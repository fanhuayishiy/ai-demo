import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'parse5';
import { discoverPreviews } from '../scripts/prepare-pages.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const existingPreviews = [
  'habitat-interactive-home/dist/index.html',
  'orbit-heatpump-washer-dryer/dist/index.html',
  'boeing-787-digital-twin/dist/index.html',
  'sunny-side-kindergarten/dist/index.html',
  'hydrogen-energy-system/index.html',
  'campus-3d-dashboard/index.html',
  'mcb-2p-c16-blender-animation/index.html',
  'voxel-construction-site/preview.html',
  'voxel-ramen-stall/preview.html',
  'sakura-station-corner/dist/index.html',
  'sanfang-qixiang-atlas/dist/index.html',
  'terra-728-tractor-blender-animation/index.html',
  'sunset-flight-study/dist/index.html',
  'warehouse-demo/dist/client/index.html',
];
const firePreview = 'modular-fire-response/dist/index.html';
const fireTitle = 'FIRELINK · 分布式智能消防';
const roadsterPreview = 'roadster-escape-toll/index.html';
const roadsterTitle = 'Roadster 逃离收费站';
const oceanPreview = 'ocean-shallows/index.html';
const oceanTitle = '浅海 · Ocean Shallows';
// 新项目一律追加到末尾，所以这个列表只会在尾部增长。
const appendedPreviews = [firePreview, roadsterPreview, oceanPreview];

function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* walk(child);
}

const attribute = (node, name) => node?.attrs?.find(attr => attr.name === name)?.value;
const hasClass = (node, name) => (attribute(node, 'class') ?? '').split(/\s+/u).includes(name);
const text = node => [...walk(node)].filter(child => child.nodeName === '#text').map(child => child.value).join('').trim();
const nodes = [...walk(parse(html))];

/** 按标题取卡片，而不是按位置——位置会随新项目追加而变。 */
function cardByTitle(title) {
  const card = nodes.filter(node => hasClass(node, 'card'))
    .find(node => text([...walk(node)].find(child => child.tagName === 'h2')) === title);
  assert.ok(card, `首页缺少标题为「${title}」的卡片`);
  return [...walk(card)];
}

test('collection appends new previews at the tail after the fourteen originals in their original order', () => {
  assert.deepEqual(discoverPreviews(html), [...existingPreviews, ...appendedPreviews]);
});

test('homepage metadata advertises seventeen runnable projects', () => {
  const description = nodes.find(node => node.tagName === 'meta' && attribute(node, 'name') === 'description');
  assert.match(attribute(description, 'content'), /17 个可运行项目/u);
});

test('Roadster card presents an offline mini-game with preview and prompt links', () => {
  const cardNodes = cardByTitle(roadsterTitle);
  const preview = cardNodes.find(node => node.tagName === 'a' && hasClass(node, 'badge') && hasClass(node, 'cover'));
  assert.equal(attribute(preview, 'href'), `./${roadsterPreview}`);
  const prompt = cardNodes.find(node => node.tagName === 'a' && hasClass(node, 'prompt-link'));
  assert.equal(attribute(prompt, 'href'), 'https://github.com/fanhuayishiy/ai-demo/blob/main/roadster-escape-toll/README.md');
  assert.equal(attribute(prompt, 'target'), '_blank');
  for (const rel of ['noopener', 'noreferrer']) assert.ok(attribute(prompt, 'rel').split(/\s+/u).includes(rel));
  const description = text(cardNodes.find(node => node.tagName === 'p'));
  for (const concept of ['冷气推进器', '车道', '翻滚', '补气', '本地排行榜', '离线']) {
    assert.ok(description.includes(concept), `Roadster description must mention ${concept}`);
  }
});

test('FIRELINK card keeps its preview and reproduction prompt links', () => {
  const cardNodes = cardByTitle(fireTitle);
  const preview = cardNodes.find(node => node.tagName === 'a' && hasClass(node, 'badge') && hasClass(node, 'cover'));
  assert.equal(attribute(preview, 'href'), `./${firePreview}`);
  const prompt = cardNodes.find(node => node.tagName === 'a' && hasClass(node, 'prompt-link'));
  assert.equal(attribute(prompt, 'href'), 'https://github.com/fanhuayishiy/ai-demo/blob/main/modular-fire-response/docs/RECREATE_PROMPT.zh-CN.md');
  assert.equal(attribute(prompt, 'target'), '_blank');
  for (const rel of ['noopener', 'noreferrer']) assert.ok(attribute(prompt, 'rel').split(/\s+/u).includes(rel));
  const description = text(cardNodes.find(node => node.tagName === 'p'));
  for (const concept of ['概念', '分布式调度', '两架承托无人机', '一架末端喷射机', '共用一根水带', '移动增压', '循环补水', '重载无人机物资投送']) {
    assert.ok(description.includes(concept), `FIRELINK description must mention ${concept}`);
  }
});

test('the newest project sits last in the homepage grid', () => {
  const cards = nodes.filter(node => hasClass(node, 'card'));
  const heading = [...walk(cards.at(-1))].find(node => node.tagName === 'h2');
  assert.equal(text(heading), oceanTitle);
  const preview = [...walk(cards.at(-1))].find(node => node.tagName === 'a' && hasClass(node, 'badge') && hasClass(node, 'cover'));
  assert.equal(attribute(preview, 'href'), `./${oceanPreview}`);
});

test('README lists the same projects in the same order, newest last', () => {
  const rows = readme.split(/\r?\n/u).filter(line => line.startsWith('|') && /\| [a-z][\w-]+ \|/u.test(line));
  const expectedProjects = [...existingPreviews, ...appendedPreviews].map(preview => preview.split('/')[0]);
  assert.deepEqual(rows.map(row => /\| ([a-z][\w-]+) \|/u.exec(row)[1]), expectedProjects);
  assert.ok(rows.at(-1).includes('[在线](https://fanhuayishiy.github.io/ai-demo/ocean-shallows/)'));
  assert.ok(rows.at(-1).includes('[README](./ocean-shallows/README.md)'));
});

test('README puts the newest overview immediately before the contribution instructions', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const contributionIndex = headings.indexOf('## 新增项目');
  assert.ok(contributionIndex > 0);
  assert.ok(headings[contributionIndex - 1].startsWith('## ocean-shallows '));
  const overviewStart = readme.indexOf('## ocean-shallows ');
  const overview = readme.slice(overviewStart, readme.indexOf('## 新增项目', overviewStart));
  assert.match(overview, /浅海|潮间带|热带/u);
  assert.match(overview, /\[在线预览\]\(https:\/\/fanhuayishiy\.github\.io\/ai-demo\/ocean-shallows\/\)/u);
  assert.ok(overview.includes('[README（含主生成提示原文）](./ocean-shallows/README.md)'));
});

test('README keeps the Roadster overview directly before the newest overview', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const roadsterIndex = headings.findIndex(heading => heading.startsWith('## roadster-escape-toll '));
  assert.ok(roadsterIndex > 0);
  assert.ok(headings[roadsterIndex + 1].startsWith('## ocean-shallows '));
  const overviewStart = readme.indexOf('## roadster-escape-toll ');
  const overview = readme.slice(overviewStart, readme.indexOf('## ocean-shallows ', overviewStart));
  assert.match(overview, /冷气推进器/u);
  assert.match(overview, /按高度返还冷气/u);
  assert.match(overview, /空中翻滚/u);
  assert.doesNotMatch(overview, /烧完不补/u);
  assert.match(overview, /1:1/u);
  assert.ok(overview.includes('(./roadster-escape-toll/docs/official-render-compare.png)'));
});

test('README keeps the FIRELINK overview directly before the Roadster overview', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const fireIndex = headings.indexOf('## modular-fire-response — FIRELINK 分布式智能消防');
  assert.ok(fireIndex > 0);
  assert.ok(headings[fireIndex + 1].startsWith('## roadster-escape-toll '));
  const overviewStart = readme.indexOf('## modular-fire-response ');
  const overview = readme.slice(overviewStart, readme.indexOf('## roadster-escape-toll ', overviewStart));
  assert.match(overview, /概念/u);
  assert.match(overview, /重载无人机物资投送/u);
  assert.match(overview, /不用于实际救援决策/u);
  assert.ok(overview.includes('(./modular-fire-response/docs/RECREATE_PROMPT.zh-CN.md)'));
});
