import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

/**
 * 新项目一律追加到「最后一位」。
 *
 * 首页卡片顺序就是发布顺序（prepare-pages 按卡片顺序发现预览），
 * 所以只要把新卡片插到 .grid 的最后一个子元素之后，
 * 预览、索引表格、详情段落三处就自动保持同一个顺序。
 *
 * 这里刻意不提供「插到第 N 位」的能力：允许插队就会让三处顺序漂移，
 * 而这正是过去需要人工核对的原因。
 */

const GRID_CLASS = 'grid';
const TABLE_HEADER = '| 项目 | 一句话简介 | 预览 | 详细文档 |';
const SCREENSHOT_TABLE_HEADER = '| 截图 | 项目 | 一句话简介 | 预览 | 详细文档 |';
const NEW_PROJECT_HEADING = '## 新增项目';

const eolOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');
const isProjectTableHeader = (line) => [TABLE_HEADER, SCREENSHOT_TABLE_HEADER].includes(line.trim());

function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* walk(child);
}

function classesOf(node) {
  const attr = node.attrs?.find(({ name }) => name === 'class');
  return new Set((attr?.value ?? '').split(/[\t\n\f\r ]+/u).filter(Boolean));
}

/** 读取首页卡片的项目目录顺序。 */
export function readHomeProjects(html) {
  const document = parse(html);
  const dirs = [];
  for (const node of walk(document)) {
    if (node.tagName !== 'a') continue;
    const classes = classesOf(node);
    if (!classes.has('badge') || !classes.has('cover')) continue;
    const href = node.attrs.find(({ name }) => name === 'href')?.value ?? '';
    const dir = href.replace(/^\.\//u, '').split('/')[0];
    if (dir) dirs.push(dir);
  }
  return dirs;
}

/** 读取 README「项目列表」表格的项目目录顺序。 */
export function readReadmeProjects(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const start = lines.findIndex(isProjectTableHeader);
  if (start < 0) throw new Error('README 缺少「项目列表」表头');
  const dirs = [];
  for (let i = start + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) break;
    const match = /\]\(\.\/([^/)\s]+)\/README\.md\)/u.exec(line);
    if (match) dirs.push(match[1]);
  }
  return dirs;
}

function escapeHtml(value) {
  return String(value).replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}

/** 预览页的 GitHub Pages 目录地址，例如 ./dir/index.html → .../dir/ */
function pagesUrl(dir, preview) {
  const relative = preview.replace(/^\.\//u, '').replace(/index\.html$/u, '');
  return `https://fanhuayishiy.github.io/ai-demo/${relative}`;
}

function normalizeProject(project) {
  const dir = String(project.dir ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(dir)) {
    throw new Error(`项目目录名必须是小写 kebab-case：${JSON.stringify(dir)}`);
  }
  const preview = String(project.preview ?? `./${dir}/index.html`).trim();
  if (!preview.startsWith(`./${dir}/`) || !/\.html$/iu.test(preview)) {
    throw new Error(`预览路径必须指向本项目内的 HTML：${JSON.stringify(preview)}`);
  }
  for (const field of ['title', 'tag', 'summary', 'desc']) {
    if (!String(project[field] ?? '').trim()) throw new Error(`缺少字段 ${field}`);
  }
  const screenshot = project.screenshot == null ? '' : String(project.screenshot).trim();
  if (screenshot) {
    const relative = screenshot.replace(/^\.\//u, '');
    if (!/^[a-z0-9][a-z0-9._/-]*\.(?:png|jpe?g|webp|gif|avif)$/iu.test(relative)
      || relative.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
      throw new Error(`截图路径必须是安全的本地相对图片路径：${JSON.stringify(screenshot)}`);
    }
  }
  return {
    dir,
    preview,
    screenshot,
    title: String(project.title).trim(),
    tag: String(project.tag).trim(),
    summary: String(project.summary).trim(),
    desc: String(project.desc).trim(),
    pages: pagesUrl(dir, preview),
  };
}

function cardHtml(p, eol) {
  return [
    '<div class="card">',
    ...(p.screenshot ? [`<img class="project-shot" src="${escapeHtml(p.screenshot)}" width="640" height="360" loading="lazy" decoding="async" alt="${escapeHtml(p.title)}">`] : []),
    `<div class="tag">${escapeHtml(p.tag)}</div>`,
    `<h2>${escapeHtml(p.title)}</h2>`,
    `<p>${escapeHtml(p.summary)}</p>`,
    '<div class="row">',
    `<a class="badge cover" href="${p.preview}">可交互</a>`,
    `<a class="prompt-link" href="https://github.com/fanhuayishiy/ai-demo/blob/main/${p.dir}/README.md" target="_blank" rel="noopener noreferrer">主生成提示 ↗</a>`,
    '</div>',
    '</div>',
  ].join(eol);
}

function tableRow(p, withScreenshot) {
  const shot = p.screenshot
    ? `<a href="${escapeHtml(p.pages)}"><img src="${escapeHtml(p.screenshot)}" width="160" height="90" alt="${escapeHtml(p.title)}"></a>`
    : '待补截图';
  return `| ${withScreenshot ? `${shot} | ` : ''}${p.dir} | ${p.summary} | [在线](${p.pages}) | [README](./${p.dir}/README.md) |`;
}

function detailSection(p, eol) {
  return [
    `## ${p.dir} — ${p.title}`,
    '',
    p.desc,
    '',
    `[在线预览](${p.pages}) · [README（含主生成提示原文）](./${p.dir}/README.md)`,
  ].join(eol);
}

/** 把卡片插到 .grid 的末尾（即最后一个子元素之后）。 */
function appendCard(html, card, eol) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  let grid = null;
  for (const node of walk(document)) {
    if (node.tagName === 'div' && classesOf(node).has(GRID_CLASS) && node.sourceCodeLocation?.endTag) {
      grid = node;
      break;
    }
  }
  if (!grid) throw new Error('index.html 中找不到 class="grid" 容器');
  const at = grid.sourceCodeLocation.endTag.startOffset;
  return html.slice(0, at) + card + eol + html.slice(at);
}

/** 把表格行追加到「项目列表」最后一行之后。 */
function appendTableRow(markdown, project) {
  const eol = eolOf(markdown);
  const lines = markdown.split(eol);
  const start = lines.findIndex(isProjectTableHeader);
  if (start < 0) throw new Error('README 缺少「项目列表」表头');
  let last = start + 1;
  while (last + 1 < lines.length && lines[last + 1].startsWith('|')) last++;
  lines.splice(last + 1, 0, tableRow(project, lines[start].trim() === SCREENSHOT_TABLE_HEADER));
  return lines.join(eol);
}

/** 把详情段落插到「## 新增项目」说明之前。 */
function appendDetail(markdown, section) {
  const eol = eolOf(markdown);
  const marker = `${eol}---${eol}${eol}${NEW_PROJECT_HEADING}`;
  const at = markdown.indexOf(marker);
  if (at < 0) throw new Error(`README 缺少「${NEW_PROJECT_HEADING}」小节`);
  return markdown.slice(0, at) + eol + section + eol + markdown.slice(at);
}

/** 纯函数：返回追加后的首页与 README 文本。 */
export function appendProject({ homeHtml, readmeMd, project }) {
  const p = normalizeProject(project);
  const homeDirs = readHomeProjects(homeHtml);
  const readmeDirs = readReadmeProjects(readmeMd);
  if (homeDirs.includes(p.dir) || readmeDirs.includes(p.dir)) {
    throw new Error(`项目 ${p.dir} 已存在；新项目只能追加，不能重复`);
  }
  const home = appendCard(homeHtml, cardHtml(p, eolOf(homeHtml)), eolOf(homeHtml));
  const readme = appendDetail(appendTableRow(readmeMd, p), detailSection(p, eolOf(readmeMd)));
  return { homeHtml: home, readmeMd: readme, project: p };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'dry-run') { out.dryRun = true; continue; }
    out[key] = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = fileURLToPath(new URL('..', import.meta.url));
  const homePath = path.join(root, 'index.html');
  const readmePath = path.join(root, 'README.md');

  if (!args.dir) {
    console.error('用法：npm run add:project -- --dir <目录名> --title <标题> --tag <标签> --summary <一句话简介> --desc <2-4 句速览> [--preview ./dir/index.html] [--screenshot ./assets/project-thumbnails/dir.webp] [--dry-run]');
    process.exitCode = 2;
    return;
  }

  const result = appendProject({
    homeHtml: await readFile(homePath, 'utf8'),
    readmeMd: await readFile(readmePath, 'utf8'),
    project: args,
  });

  if (args.dryRun) {
    console.log(`将追加项目：${result.project.dir}`);
    console.log(`  预览：${result.project.pages}`);
    console.log('（dry-run，未写入任何文件）');
    return;
  }

  await writeFile(homePath, result.homeHtml);
  await writeFile(readmePath, result.readmeMd);
  console.log(`已把 ${result.project.dir} 追加到首页卡片与 README 索引的最后一位。`);
}

// 只有被当作脚本直接执行时才跑 CLI；被测试 import 时保持纯函数。
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
