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
const shipPreview = 'ship-in-a-bottle/index.html';
const shipTitle = '瓶中沧海 · 前进·梅利号';
const cubePreview = 'rubiks-cube-lab/index.html';
const cubeTitle = '三阶魔方实验室 · CUBE / LAB';
const portPreview = 'miniature-port/index.html';
const portTitle = '微缩港口 · Golden Hour Miniature Port';
const keyboardPreview = 'atelier-104/dist/index.html';
const keyboardTitle = 'ATELIER 104 · 机械键盘工作台';
const rainPreview = 'cyber-rain-district/index.html';
const rainTitle = '雨港 · 霓虹夜';
const basilicaPreview = 'sagrada-familia/index.html';
const basilicaTitle = 'Sagrada Família · 圣家堂建造时间线';
const townPreview = 'songfeng-town/dist/index.html';
const townTitle = '松风镇 · 体素乡村漫步';
// 新项目一律追加到末尾，所以这个列表只会在尾部增长。
const appendedPreviews = [firePreview, roadsterPreview, oceanPreview, shipPreview, cubePreview, portPreview, keyboardPreview, rainPreview, basilicaPreview, townPreview];

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

/** 卡片内的可交互预览链接。 */
function coverHref(cardNodes) {
  return attribute(cardNodes.find(node => node.tagName === 'a' && hasClass(node, 'badge') && hasClass(node, 'cover')), 'href');
}

test('collection appends new previews at the tail after the fourteen originals in their original order', () => {
  assert.deepEqual(discoverPreviews(html), [...existingPreviews, ...appendedPreviews]);
});

test('homepage metadata advertises twenty-four runnable projects', () => {
  const description = nodes.find(node => node.tagName === 'meta' && attribute(node, 'name') === 'description');
  assert.match(attribute(description, 'content'), /24 个可运行项目/u);
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

test('the newest project sits last in the homepage grid without displacing its predecessor', () => {
  const cards = nodes.filter(node => hasClass(node, 'card'));
  const last = [...walk(cards.at(-1))];
  assert.equal(text(last.find(node => node.tagName === 'h2')), townTitle);
  assert.equal(coverHref(last), `./${townPreview}`);

  // 追加只能发生在末尾：上一个项目必须原封不动地留在倒数第二位。
  const previous = [...walk(cards.at(-2))];
  assert.equal(text(previous.find(node => node.tagName === 'h2')), basilicaTitle);
  assert.equal(coverHref(previous), `./${basilicaPreview}`);
  const rain = [...walk(cards.at(-3))];
  assert.equal(text(rain.find(node => node.tagName === 'h2')), rainTitle);
  assert.equal(coverHref(rain), `./${rainPreview}`);
  const keyboard = [...walk(cards.at(-4))];
  assert.equal(text(keyboard.find(node => node.tagName === 'h2')), keyboardTitle);
  assert.equal(coverHref(keyboard), `./${keyboardPreview}`);

  // 新卡片沿用全站统一的真实截图结构。
  for (const [card, dir, label] of [[last, 'songfeng-town', '松风镇'], [previous, 'sagrada-familia', '圣家堂']]) {
  const shot = card.find(node => node.tagName === 'img' && hasClass(node, 'project-shot'));
  assert.equal(attribute(shot, 'src'), `./assets/project-thumbnails/${dir}.webp`);
  assert.equal(attribute(shot, 'width'), '640');
  assert.equal(attribute(shot, 'height'), '360');
  assert.equal(attribute(shot, 'loading'), 'lazy');
  assert.equal(attribute(shot, 'decoding'), 'async');
  assert.ok(attribute(shot, 'alt').includes(label));
  const prompt = card.find(node => node.tagName === 'a' && hasClass(node, 'prompt-link'));
  assert.equal(attribute(prompt, 'href'), `https://github.com/fanhuayishiy/ai-demo/blob/main/${dir}/README.md`);
  }
});

test('README lists the same projects in the same order, newest last', () => {
  const rows = readme.split(/\r?\n/u).filter(line => line.startsWith('|') && /\| [a-z][\w-]+ \|/u.test(line));
  const expectedProjects = [...existingPreviews, ...appendedPreviews].map(preview => preview.split('/')[0]);
  assert.deepEqual(rows.map(row => /\| ([a-z][\w-]+) \|/u.exec(row)[1]), expectedProjects);
  assert.ok(rows.at(-1).includes('[在线](https://fanhuayishiy.github.io/ai-demo/songfeng-town/dist/)'));
  assert.ok(rows.at(-1).includes('[README](./songfeng-town/README.md)'));
  assert.ok(rows.at(-1).includes('./assets/project-thumbnails/songfeng-town.webp'));
  assert.ok(rows.at(-2).includes('[在线](https://fanhuayishiy.github.io/ai-demo/sagrada-familia/)'));
  assert.ok(rows.at(-2).includes('[README](./sagrada-familia/README.md)'));
  assert.ok(rows.at(-2).includes('./assets/project-thumbnails/sagrada-familia.webp'));
  assert.ok(rows.at(-3).includes('[在线](https://fanhuayishiy.github.io/ai-demo/cyber-rain-district/)'));
  assert.ok(rows.at(-3).includes('[README](./cyber-rain-district/README.md)'));
  assert.ok(rows.at(-3).includes('./assets/project-thumbnails/cyber-rain-district.webp'));
  assert.ok(rows.at(-4).includes('[在线](https://fanhuayishiy.github.io/ai-demo/atelier-104/dist/)'));
  assert.ok(rows.at(-4).includes('[README](./atelier-104/README.md)'));
});

test('README puts the newest overview immediately before the contribution instructions', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const contributionIndex = headings.indexOf('## 新增项目');
  assert.ok(contributionIndex > 0);
  assert.ok(headings[contributionIndex - 1].startsWith('## songfeng-town '));
  assert.ok(headings[contributionIndex - 2].startsWith('## sagrada-familia '));
  const overviewStart = readme.indexOf('## songfeng-town ');
  const overview = readme.slice(overviewStart, readme.indexOf('## 新增项目', overviewStart));
  assert.match(overview, /WASD/u);
  assert.match(overview, /按 E 互动/u);
  assert.match(overview, /模型全部程序生成/u);
  assert.ok(overview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/songfeng-town/dist/)'));
  assert.ok(overview.includes('[README（含主生成提示原文）](./songfeng-town/README.md)'));
});

test('README retains the basilica overview directly before the town', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const basilicaIndex = headings.findIndex(heading => heading.startsWith('## sagrada-familia '));
  assert.ok(headings[basilicaIndex + 1].startsWith('## songfeng-town '));
  assert.ok(headings[basilicaIndex - 1].startsWith('## cyber-rain-district '));
  const overviewStart = readme.indexOf('## sagrada-familia ');
  const overview = readme.slice(overviewStart, readme.indexOf('## songfeng-town ', overviewStart));
  assert.match(overview, /1882—2026/u);
  assert.match(overview, /蓝调夜景/u);
  assert.match(overview, /18 塔规划全貌/u);
  assert.ok(overview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/sagrada-familia/)'));
  assert.ok(overview.includes('[README（含主生成提示原文）](./sagrada-familia/README.md)'));
});

test('town publication includes the original request and real local static assets', () => {
  const projectReadme = readFileSync(new URL('../songfeng-town/README.md', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../songfeng-town/dist/index.html', import.meta.url), 'utf8');
  assert.match(projectReadme, /## 主生成提示（原文）/u);
  assert.ok(projectReadme.includes('请帮我制作一个可在浏览器中游玩的 3D 体素小镇'));
  assert.ok(projectReadme.includes('先确保移动、碰撞、镜头和互动正常，再完善画面'));
  for (const pattern of [/src="(\.\/assets\/[^"]+\.js)"/u, /href="(\.\/assets\/[^"]+\.css)"/u]) {
    const match = pattern.exec(entry);
    assert.ok(match, 'built entry must use relative bundled assets');
    assert.ok(readFileSync(new URL(`../songfeng-town/dist/${match[1]}`, import.meta.url)).length > 100);
  }
  assert.doesNotMatch(entry, /src="https?:/u);
});

test('README retains the rain district overview directly before the basilica', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const rainIndex = headings.findIndex(heading => heading.startsWith('## cyber-rain-district '));
  assert.ok(rainIndex > 0);
  assert.ok(headings[rainIndex + 1].startsWith('## sagrada-familia '));
  assert.ok(headings[rainIndex - 1].startsWith('## atelier-104 '));
  const overviewStart = readme.indexOf('## cyber-rain-district ');
  const overview = readme.slice(overviewStart, readme.indexOf('## sagrada-familia ', overviewStart));
  assert.match(overview, /WebGL 2/u);
  assert.match(overview, /积水倒影/u);
  assert.match(overview, /\[在线预览\]\(https:\/\/fanhuayishiy\.github\.io\/ai-demo\/cyber-rain-district\/\)/u);
  assert.ok(overview.includes('[README（含主生成提示原文）](./cyber-rain-district/README.md)'));
});

test('README retains the keyboard overview directly before the rain district', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const rainIndex = headings.findIndex(heading => heading.startsWith('## cyber-rain-district '));
  assert.ok(rainIndex > 0);
  assert.ok(headings[rainIndex - 1].startsWith('## atelier-104 '));
  assert.ok(headings[rainIndex - 2].startsWith('## miniature-port '));
  const overviewStart = readme.indexOf('## atelier-104 ');
  const overview = readme.slice(overviewStart, readme.indexOf('## cyber-rain-district ', overviewStart));
  assert.match(overview, /104 键模型/u);
  assert.match(overview, /检测真实键盘/u);
  assert.match(overview, /\[在线预览\]\(https:\/\/fanhuayishiy\.github\.io\/ai-demo\/atelier-104\/dist\/\)/u);
  assert.ok(overview.includes('[README（含主生成提示原文）](./atelier-104/README.md)'));
});

test('README keeps the previous newest overview intact directly before the new one', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const cubeIndex = headings.findIndex(heading => heading.startsWith('## rubiks-cube-lab '));
  assert.ok(cubeIndex > 0);
  assert.ok(headings[cubeIndex + 1].startsWith('## miniature-port '));
  const overviewStart = readme.indexOf('## rubiks-cube-lab ');
  const overview = readme.slice(overviewStart, readme.indexOf('## miniature-port ', overviewStart));
  assert.match(overview, /魔方|CUBE|LAB/u);
  assert.match(overview, /\[在线预览\]\(https:\/\/fanhuayishiy\.github\.io\/ai-demo\/rubiks-cube-lab\/\)/u);
  assert.ok(overview.includes('[README（含主生成提示原文）](./rubiks-cube-lab/README.md)'));
});

test('README keeps the Roadster overview directly before the Ocean overview', () => {
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
  assert.match(overview, /车模参考官方渲染图制作/u);
  assert.doesNotMatch(overview, /1:1/u);
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

test('new project README declares the original prompt unverifiable and supplies a separate reproduction prompt', () => {
  const projectReadme = readFileSync(new URL('../miniature-port/README.md', import.meta.url), 'utf8');
  assert.match(projectReadme, /## 主生成提示（原文）/u);
  assert.match(projectReadme, /原文未能核验/u);
  assert.match(projectReadme, /## 一键复现提示词/u);
  assert.match(projectReadme, /不是历史原文/u);
  for (const verbatim of ['优化一下性能，当前太卡了', '还是很卡而且很糊，优化到60fps', '提交到https://github.com/fanhuayishiy/ai-demo上']) {
    assert.ok(projectReadme.includes(verbatim), `可逐字核验的请求缺失：${verbatim}`);
  }
});

test('basilica publication includes the original request and distinguishes historical progress from the planned completion', () => {
  const projectReadme = readFileSync(new URL('../sagrada-familia/README.md', import.meta.url), 'utf8');
  const preview = readFileSync(new URL('../sagrada-familia/index.html', import.meta.url), 'utf8');
  assert.match(projectReadme, /## 主生成提示（原文）/u);
  assert.ok(projectReadme.includes('默认为蓝调，整体再对一下'));
  assert.ok(projectReadme.includes('2026 年指耶稣塔外部落成'));
  assert.ok(projectReadme.includes('并非测绘模型'));
  assert.match(preview, /<body class="night">/u);
  assert.match(preview, /night=1,nightTarget=1/u);
  assert.match(preview, /id="year" min="1882" max="2026" step="1"/u);
});
