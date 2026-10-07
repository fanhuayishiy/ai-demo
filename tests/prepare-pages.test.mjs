import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { link, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import * as implementation from '../scripts/prepare-pages.mjs';
function api(name) {
  assert.equal(typeof implementation[name], 'function', `${name} must be implemented`);
  return implementation[name];
}

const start = '<!-- ai-demo-github:start -->';
const end = '<!-- ai-demo-github:end -->';
const fragment = '<script>window.sharedEntry = true;</script>\n';
const preview = '<!doctype html><html><head><title>Preview</title></head><body><main>Scene</main></body></html>';
const card = (href, classes = 'badge cover') => `<a class="${classes}" href="${href}">Preview</a>`;
const home = (...hrefs) => `<!doctype html><html><body>${hrefs.map((href) => card(href)).join('')}</body></html>`;

async function fixture(t, hrefs = ['./one/dist/index.html', './two/preview.html']) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-demo-pages-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'output');
  async function put(relative, contents) {
    const file = path.join(sourceDir, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
  }
  await put('index.html', home(...hrefs));
  await put('shared/github-entry.html', fragment);
  await put('one/dist/index.html', preview);
  await put('two/preview.html', preview);
  return { root, sourceDir, outputDir, put };
}

async function snapshot(directory, prefix = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(filename, `${name}/`));
    else if (entry.isSymbolicLink()) result[name] = 'symlink';
    else result[name] = createHash('sha256').update(await readFile(filename)).digest('hex');
  }
  return result;
}

test('discovers only anchors with both class tokens and decodes HTML attributes', () => {
  const html = home('./one/dist/index.html?foo=1&amp;bar=2#view')
    + card('two/preview.html', 'active cover\tbadge')
    + card('ignored.html', 'cover')
    + card('ignored-too.html', 'badge covered')
    + '<script>const fake = \'<a class="badge cover" href="wrong.html">\';</script>'
    + card('a&amp;b/preview.html');
  assert.deepEqual(api('discoverPreviews')(html), ['one/dist/index.html', 'two/preview.html', 'a&b/preview.html']);
});

test('normalizes directory links, percent-encoded names and duplicate query/hash cards', () => {
  assert.deepEqual(api('discoverPreviews')(home('./one/dist/?mode=1#view', 'one/dist/index.html', './new%20project/preview.html#top')),
    ['one/dist/index.html', 'new project/preview.html']);
});

test('automatically discovers an arbitrary future project without a manifest', () => {
  const discover = api('discoverPreviews');
  const existing = home('./one/dist/index.html', './two/preview.html');
  assert.deepEqual(discover(existing + card('./future-fifteenth-project/dist/')), ['one/dist/index.html', 'two/preview.html', 'future-fifteenth-project/dist/index.html']);
});

for (const target of [
  'https://example.com/index.html', '//example.com/index.html', '/one/index.html',
  '../outside/index.html', 'one/../index.html', '%2e%2e/outside.html', 'one/%2e%2E/index.html',
  'one/%252e%252e/index.html', 'one\\index.html', 'one/%5cindex.html', '%2fone/index.html',
  'file:one/index.html', 'javascript:alert(1)', 'one/image.png', 'one/%ZZ/index.html',
  'one/%00/index.html', 'one/\nindex.html', 'one//index.html', '', '#preview', '?view=1',
  './index.html', './', '.private/index.html', 'node_modules/demo/index.html', '_site/demo/index.html',
  ' one/index.html', 'one/index.html ', 'node_modules%20/demo/index.html', 'one./index.html',
  'NODE_MODULES/demo/index.html', '_SITE/demo/index.html', 'Audit-GitHub-Entry/preview.html',
]) {
  test(`rejects unsafe or non-preview target ${JSON.stringify(target)}`, () => {
    const discover = api('discoverPreviews');
    assert.throws(() => discover(home(target)), /preview|target|path|URL/i);
  });
}

test('rejects a selected preview anchor without href', () => {
  const discover = api('discoverPreviews');
  assert.throws(() => discover('<a class="badge cover">Missing</a>'), /href|preview/i);
});

test('rejects a homepage with no recognized preview cards', () => {
  assert.throws(() => api('discoverPreviews')('<html><body><a href="one/index.html">Unrecognized card</a></body></html>'), /no.*preview|preview.*found/i);
});

test('inserts the inline fragment before the real body closing tag, not a script string or comment', () => {
  const html = '<html><body><script>const fake = "</body>";</script><!-- </body> --><main>Scene</main></body></html>';
  const result = api('injectEntry')(html, fragment);
  assert.equal(result, html.replace('<main>Scene</main></body>', `<main>Scene</main>${start}\n${fragment}\n${end}</body>`));
});

test('replaces old marked entries exactly once and is byte-for-byte idempotent', () => {
  const inject = api('injectEntry');
  const once = inject(preview, fragment);
  assert.equal(inject(once, fragment), once);
  const updated = inject(once, '<script>window.updated = true;</script>');
  assert.equal(updated.includes('window.sharedEntry'), false);
  assert.equal(updated.split(start).length - 1, 1);
  assert.ok(updated.includes('window.updated'));
});

test('does not mistake marker strings within JavaScript for injected comments', () => {
  const html = preview.replace('<main>', `<script>const fake = '${start}keep me${end}';</script><main>`);
  assert.ok(api('injectEntry')(html, fragment).includes(`'${start}keep me${end}'`));
});

test('fails usefully without a real closing body tag or with unbalanced injection markers', () => {
  const inject = api('injectEntry');
  assert.throws(() => inject('<html><body><script>const fake = "</body>";</script>', fragment), /closing.*body|body.*closing/i);
  assert.throws(() => inject(preview.replace('</body>', start + '</body>'), fragment), /marker/i);
});

test('stages all current and future previews, preserves assets/docs, and never changes source or injects root', async (t) => {
  const fixtureData = await fixture(t, ['./one/dist/?foo=1#scene', 'one/dist/index.html', './two/preview.html', './future-fifteenth-project/dist/']);
  const { sourceDir, outputDir, put } = fixtureData;
  await put('future-fifteenth-project/dist/index.html', preview);
  await put('one/dist/assets/model.glb', Buffer.from([0, 1, 2, 3, 255]));
  await put('one/README.md', '# Documentation');
  await put('unlisted/index.html', preview);
  await put('LICENSE', 'MIT');
  const before = await snapshot(sourceDir);
  assert.deepEqual(await api('prepareSite')({ sourceDir, outputDir }), ['one/dist/index.html', 'two/preview.html', 'future-fifteenth-project/dist/index.html']);
  assert.deepEqual(await snapshot(sourceDir), before);
  assert.equal(await readFile(path.join(outputDir, 'index.html'), 'utf8'), await readFile(path.join(sourceDir, 'index.html'), 'utf8'));
  for (const file of ['one/dist/index.html', 'two/preview.html', 'future-fifteenth-project/dist/index.html']) {
    assert.equal(await readFile(path.join(outputDir, file), 'utf8'), api('injectEntry')(preview, fragment));
    assert.equal((await lstat(path.join(outputDir, file))).nlink, 1);
  }
  for (const file of ['one/dist/assets/model.glb', 'one/README.md', 'LICENSE', 'unlisted/index.html']) {
    assert.deepEqual(await readFile(path.join(outputDir, file)), await readFile(path.join(sourceDir, file)));
  }
});

test('fresh second packaging is byte-for-byte identical, including already injected inputs', async (t) => {
  const { root, sourceDir, outputDir, put } = await fixture(t);
  await put('one/dist/index.html', api('injectEntry')(preview, fragment));
  await api('prepareSite')({ sourceDir, outputDir });
  const second = path.join(root, 'second');
  await api('prepareSite')({ sourceDir: outputDir, outputDir: second });
  assert.deepEqual(await snapshot(second), await snapshot(outputDir));
});

test('excludes hidden paths, dependencies, existing staging and the chosen in-source output', async (t) => {
  const { sourceDir, put } = await fixture(t);
  for (const file of ['.git/config', '.env', 'one/.hidden/private.txt', 'one/.private', 'node_modules/pkg/index.js', 'one/node_modules/pkg/index.js', '_site/old.txt', 'one/_site/old.txt', 'audit-github-entry/screenshot.png', 'one/audit-github-entry/audit.json', 'server.log', 'one/build.log', 'upper/NODE_MODULES/pkg/index.js', 'upper/_SITE/old.txt', 'upper/Audit-GitHub-Entry/shot.png']) await put(file, 'excluded');
  const outputDir = path.join(sourceDir, 'publish-output');
  await api('prepareSite')({ sourceDir, outputDir });
  const files = Object.keys(await snapshot(outputDir));
  assert.equal(files.some((file) => /(^|\/)(\.|node_modules\/|_site\/|publish-output\/)/i.test(file)), false);
  assert.equal(files.some((file) => /(^|\/)audit-github-entry\/|\.log$/i.test(file)), false);
  assert.ok(files.includes('one/dist/index.html'));
});

test('allows the conventional _site child output', async (t) => {
  const { sourceDir } = await fixture(t);
  await api('prepareSite')({ sourceDir, outputDir: path.join(sourceDir, '_site') });
  assert.ok((await readFile(path.join(sourceDir, '_site/one/dist/index.html'), 'utf8')).includes(start));
});

for (const problem of ['missing preview', 'malformed preview', 'missing fragment', 'unsafe target', 'no preview cards']) {
  test(`fails ${problem} validation before any copying`, async (t) => {
    const { sourceDir, outputDir, put } = await fixture(t);
    if (problem === 'missing preview') await put('index.html', home('./one/dist/index.html', './missing/preview.html'));
    if (problem === 'malformed preview') await put('two/preview.html', '<html><body>Unclosed');
    if (problem === 'missing fragment') await rm(path.join(sourceDir, 'shared/github-entry.html'));
    if (problem === 'unsafe target') await put('index.html', home('./one/dist/index.html', '../outside.html'));
    if (problem === 'no preview cards') await put('index.html', home());
    await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /preview|body|fragment|github-entry|target|path/i);
    await assert.rejects(() => lstat(outputDir), { code: 'ENOENT' });
  });
}

test('refuses nonempty output without touching existing files', async (t) => {
  const { sourceDir, outputDir } = await fixture(t);
  await mkdir(outputDir);
  await writeFile(path.join(outputDir, 'keep.txt'), 'user data');
  await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /nonempty|not empty/i);
  assert.deepEqual(await readdir(outputDir), ['keep.txt']);
});

test('accepts an existing empty output directory', async (t) => {
  const { sourceDir, outputDir } = await fixture(t);
  await mkdir(outputDir);
  await api('prepareSite')({ sourceDir, outputDir });
  assert.ok((await readFile(path.join(outputDir, 'two/preview.html'), 'utf8')).includes(start));
});

test('copies source hardlinks as independent regular files', async (t) => {
  const { sourceDir, outputDir, put } = await fixture(t);
  await put('one/dist/asset.bin', Buffer.from([4, 5, 6]));
  await link(path.join(sourceDir, 'one/dist/asset.bin'), path.join(sourceDir, 'two/asset.bin'));
  await api('prepareSite')({ sourceDir, outputDir });
  assert.equal((await lstat(path.join(outputDir, 'one/dist/asset.bin'))).nlink, 1);
  assert.equal((await lstat(path.join(outputDir, 'two/asset.bin'))).nlink, 1);
  await writeFile(path.join(outputDir, 'one/dist/asset.bin'), 'changed artifact');
  assert.deepEqual(await readFile(path.join(sourceDir, 'one/dist/asset.bin')), Buffer.from([4, 5, 6]));
  assert.deepEqual(await readFile(path.join(outputDir, 'two/asset.bin')), Buffer.from([4, 5, 6]));
});

test('refuses equal output and an ancestor output', async (t) => {
  const { root, sourceDir } = await fixture(t);
  for (const outputDir of [sourceDir, root]) await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /source|ancestor|overlap/i);
});

test('rejects selected paths inside the output directory before copying', async (t) => {
  const { sourceDir, put } = await fixture(t, ['./publish-output/preview.html']);
  await put('publish-output/preview.html', preview);
  const outputDir = path.join(sourceDir, 'publish-output');
  await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /output|nonempty|not empty/i);
});

async function createLinkOrSkip(t, target, link, type) {
  try { await symlink(target, link, type); return true; }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip(`Symlink creation unavailable: ${error.code}`); return false; }
    throw error;
  }
}

test('rejects a symlinked preview directory before any copying', async (t) => {
  const { root, sourceDir, outputDir, put } = await fixture(t, ['./linked/index.html']);
  await mkdir(path.join(root, 'outside'));
  await writeFile(path.join(root, 'outside/index.html'), preview);
  if (!await createLinkOrSkip(t, path.join(root, 'outside'), path.join(sourceDir, 'linked'), 'junction')) return;
  await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /symbolic|symlink|link/i);
  await assert.rejects(() => lstat(outputDir), { code: 'ENOENT' });
});

test('skips unselected symlink directories instead of following or publishing them', async (t) => {
  const { root, sourceDir, outputDir } = await fixture(t);
  await mkdir(path.join(root, 'outside'));
  await writeFile(path.join(root, 'outside/private.txt'), 'private');
  if (!await createLinkOrSkip(t, path.join(root, 'outside'), path.join(sourceDir, 'linked'), 'junction')) return;
  await api('prepareSite')({ sourceDir, outputDir });
  await assert.rejects(() => lstat(path.join(outputDir, 'linked')), { code: 'ENOENT' });
});

test('refuses a symlinked output directory', async (t) => {
  const { root, sourceDir, outputDir } = await fixture(t);
  await mkdir(path.join(root, 'outside'));
  if (!await createLinkOrSkip(t, path.join(root, 'outside'), outputDir, 'junction')) return;
  await assert.rejects(() => api('prepareSite')({ sourceDir, outputDir }), /symbolic|symlink|link/i);
});
