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

function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* walk(child);
}

const attribute = (node, name) => node?.attrs?.find(attr => attr.name === name)?.value;
const hasClass = (node, name) => (attribute(node, 'class') ?? '').split(/\s+/u).includes(name);
const text = node => [...walk(node)].filter(child => child.nodeName === '#text').map(child => child.value).join('').trim();
const nodes = [...walk(parse(html))];

test('collection appends FIRELINK after all fourteen existing previews in their original order', () => {
  assert.deepEqual(discoverPreviews(html), [...existingPreviews, firePreview]);
});

test('homepage metadata advertises fifteen runnable projects', () => {
  const description = nodes.find(node => node.tagName === 'meta' && attribute(node, 'name') === 'description');
  assert.match(attribute(description, 'content'), /15 个可运行项目/u);
});

test('last card presents FIRELINK as a concept demo with preview and reproduction links', () => {
  const cards = nodes.filter(node => hasClass(node, 'card'));
  const cardNodes = [...walk(cards.at(-1))];
  const heading = cardNodes.find(node => node.tagName === 'h2');
  assert.equal(text(heading), fireTitle);
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

test('README lists FIRELINK last and gives its final project overview before contribution instructions', () => {
  const rows = readme.split('\n').filter(line => /^\| [a-z][\w-]+ \|/u.test(line));
  const expectedProjects = [...existingPreviews, firePreview].map(preview => preview.split('/')[0]);
  assert.deepEqual(rows.map(row => row.split('|')[1].trim()), expectedProjects);
  assert.ok(rows.at(-1).includes('[在线](https://fanhuayishiy.github.io/ai-demo/modular-fire-response/dist/)'));
  assert.ok(rows.at(-1).includes('[README](./modular-fire-response/README.md)'));
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const contributionIndex = headings.indexOf('## 新增项目');
  assert.ok(contributionIndex > 0);
  assert.ok(headings[contributionIndex - 1].startsWith('## modular-fire-response '));
  const overviewStart = readme.indexOf('## modular-fire-response ');
  const overview = readme.slice(overviewStart, readme.indexOf('## 新增项目', overviewStart));
  assert.match(overview, /概念/u);
  assert.match(overview, /重载无人机物资投送/u);
  assert.match(overview, /不用于实际救援决策/u);
  assert.ok(overview.includes('(./modular-fire-response/docs/RECREATE_PROMPT.zh-CN.md)'));
});
