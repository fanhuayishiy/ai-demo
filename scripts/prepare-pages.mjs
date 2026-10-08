import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { buildEntry } from './build-entry.mjs';
import { patchPreviewCsp } from './preview-csp.mjs';

const START = '<!-- ai-demo-github:start -->';
const END = '<!-- ai-demo-github:end -->';
const excludedName = (name) => name.startsWith('.')
  || ['node_modules', '_site', 'audit-github-entry'].includes(name.toLowerCase()) || /\.log$/iu.test(name);

function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* walk(child);
}

function normalizePreview(href) {
  const invalid = (reason) => new Error(`Invalid preview target ${JSON.stringify(href)}: ${reason}`);
  if (typeof href !== 'string' || !href || href !== href.trim() || /[\u0000-\u001f\u007f\\]/u.test(href)) {
    throw invalid('a local relative href is required');
  }
  // Parse path before URL normalization: WHATWG URLs otherwise silently remove ../.
  const rawPath = href.split(/[?#]/u, 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); }
  catch { throw invalid('invalid URL encoding'); }
  if (!decoded || decoded.startsWith('/') || /[\u0000-\u001f\u007f\\:<>"|?*%]/u.test(decoded)) {
    throw invalid('only unambiguous local relative HTML paths are supported');
  }
  const parts = decoded.split('/');
  while (parts[0] === '.') parts.shift();
  if (parts.at(-1) === '') parts[parts.length - 1] = 'index.html';
  if (!parts.length || parts.some((part) => !part || excludedName(part) || /[. ]$/u.test(part))) {
    throw invalid('traversal, hidden paths, excluded directories and ambiguous path aliases are not allowed');
  }
  const normalized = parts.join('/');
  if (!/\.html$/iu.test(normalized)) throw invalid('target must be an HTML file or directory link');
  if (normalized.toLowerCase() === 'index.html') throw invalid('the root homepage is not a preview');
  return normalized;
}

/** Discover real homepage card anchors, preserving their order without a project manifest. */
export function discoverPreviews(homeHtml) {
  const previews = new Set();
  for (const node of walk(parse(homeHtml))) {
    if (node.tagName !== 'a') continue;
    const attrs = new Map(node.attrs.map(({ name, value }) => [name, value]));
    const classes = new Set((attrs.get('class') ?? '').split(/[\t\n\f\r ]+/u));
    if (classes.has('badge') && classes.has('cover')) previews.add(normalizePreview(attrs.get('href')));
  }
  if (!previews.size) throw new Error('No preview cards found: homepage anchors must have both badge and cover classes');
  return [...previews];
}

/** Only source offsets from parsed HTML are edited; application markup is never serialized. */
export function injectEntry(html, fragment) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const markers = [...walk(document)]
    .filter((node) => node.nodeName === '#comment' && /^\s*ai-demo-github:(?:start|end)\s*$/u.test(node.data))
    .sort((a, b) => a.sourceCodeLocation.startOffset - b.sourceCodeLocation.startOffset);
  const ranges = [];
  let pending;
  for (const marker of markers) {
    if (marker.data.trim() === 'ai-demo-github:start') {
      if (pending) throw new Error('Malformed GitHub entry markers: nested start marker');
      pending = marker;
    } else {
      if (!pending) throw new Error('Malformed GitHub entry markers: end without start');
      ranges.push([pending.sourceCodeLocation.startOffset, marker.sourceCodeLocation.endOffset]);
      pending = undefined;
    }
  }
  if (pending) throw new Error('Malformed GitHub entry markers: missing end marker');
  let clean = html;
  for (const [start, end] of ranges.reverse()) clean = clean.slice(0, start) + clean.slice(end);
  const cleanDocument = ranges.length ? parse(clean, { sourceCodeLocationInfo: true }) : document;
  const body = [...walk(cleanDocument)].find((node) => node.tagName === 'body');
  const offset = body?.sourceCodeLocation?.endTag?.startOffset;
  if (offset === undefined) throw new Error('Preview HTML must contain a real closing </body> tag');
  return clean.slice(0, offset) + `${START}\n${fragment}\n${END}` + clean.slice(offset);
}

function within(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function statIfExists(filename) {
  try { return await lstat(filename); }
  catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

// Resolve existing parents as well, so an output alias cannot overlap the source.
async function canonicalDestination(filename) {
  const stat = await statIfExists(filename);
  if (stat) {
    if (stat.isSymbolicLink()) throw new Error(`Output path may not use a symbolic link: ${filename}`);
    return realpath(filename);
  }
  const parent = path.dirname(filename);
  if (parent === filename) throw new Error(`Output path has no existing parent: ${filename}`);
  return path.join(await canonicalDestination(parent), path.basename(filename));
}

async function readSafeFile(sourceDir, relative) {
  let current = sourceDir;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = await statIfExists(current);
    if (!stat) throw new Error(`Required preview/build file is missing: ${relative}`);
    if (stat.isSymbolicLink()) throw new Error(`Preview/build path may not use a symbolic link: ${relative}`);
    if (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) {
      throw new Error(`Required preview/build path is not a regular file: ${relative}`);
    }
  }
  return readFile(current, 'utf8');
}

async function copyTree(source, destination, outputDir) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (excludedName(entry.name) || within(outputDir, from)) continue;
    // Do not follow links or reproduce links in the Pages artifact.
    const stat = await lstat(from);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) await copyTree(from, to, outputDir);
    else if (stat.isFile()) await copyFile(from, to, constants.COPYFILE_EXCL);
  }
}

/** Validate everything first, then create a separate static artifact. Source remains untouched. */
export async function prepareSite({ sourceDir, outputDir }) {
  const sourcePath = path.resolve(sourceDir);
  const outputPath = path.resolve(outputDir);
  if (within(outputPath, sourcePath)) throw new Error('Output must not equal or be an ancestor of the source directory');
  const sourceStat = await statIfExists(sourcePath);
  if (!sourceStat?.isDirectory() || sourceStat.isSymbolicLink()) throw new Error('Source must be a real directory, not a symbolic link');
  const source = await realpath(sourcePath);
  const output = await canonicalDestination(outputPath);
  if (within(output, source)) throw new Error('Output must not overlap the source through an ancestor or alias');
  const outputStat = await statIfExists(output);
  if (outputStat && (!outputStat.isDirectory() || (await readdir(output)).length > 0)) {
    throw new Error(`Output directory must be empty; refusing nonempty output: ${output}`);
  }

  const previews = discoverPreviews(await readSafeFile(source, 'index.html'));
  const fragment = await buildEntry({sourceDir:source, template:await readSafeFile(source, 'shared/github-entry.html')});
  const prepared = new Map();
  for (const relative of previews) {
    if (within(output, path.join(source, relative))) throw new Error(`Preview target is inside the output directory: ${relative}`);
    try { prepared.set(relative, injectEntry(patchPreviewCsp(await readSafeFile(source, relative)), fragment)); }
    catch (error) { throw new Error(`Cannot prepare preview ${relative}: ${error.message}`, { cause: error }); }
  }

  await copyTree(source, output, output);
  for (const [relative, html] of prepared) await writeFile(path.join(output, relative), html, 'utf8');
  return previews;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDir = fileURLToPath(new URL('../', import.meta.url));
  try {
    const previews = await prepareSite({ sourceDir, outputDir: path.join(sourceDir, '_site') });
    console.log(`Prepared _site with the shared GitHub entry in ${previews.length} preview pages.`);
  } catch (error) {
    console.error(`Pages packaging failed: ${error.message}`);
    process.exitCode = 1;
  }
}
