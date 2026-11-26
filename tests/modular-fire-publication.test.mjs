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
const shipyardPreview = 'steel-tide-shipyard/dist/index.html';
const shipyardTitle = '钢潮入海 · 航母建造体素船厂';
const pianoPreview = 'largo-piano/index.html';
const pianoTitle = 'LARGO · 看键跟弹';
const trafficPreview = 'smart-traffic-intersection/dist/index.html';
const trafficTitle = '路序 · 智能交通路口';
const spiderPreview = 'spider-teardown/dist/index.html';
const spiderTitle = '机器人蜘蛛 · 八足拆解实验室';
const rexPreview = 'tyrant-rex/dist/index.html';
const rexTitle = 'TYRANT RX-01 · 机械霸王龙拆解档案';
const starshipPreview = 'starship-atlas/dist/index.html';
const starshipTitle = '星舰档案 · 第十五次飞行';
const dataCenterPreview = 'data-center-dashboard/index.html';
const dataCenterTitle = 'DC-01 · 机房运行态势';
const moltenPreview = 'molten-salt-tower/index.html';
const moltenTitle = '熔盐塔式发电站可视化';
const offroadPreview = 'offroad-expedition-4x4/index.html';
const offroadTitle = '荒野行者 · 复古四驱探险车';
const agrasPreview = 'agras-t50-teardown/dist/index.html';
const agrasTitle = 'DJI AGRAS T50 · 农业无人机 3D 拆解与飞行';
// 新项目一律追加到末尾，所以这个列表只会在尾部增长。
const appendedPreviews = [firePreview, roadsterPreview, oceanPreview, shipPreview, cubePreview, portPreview, keyboardPreview, rainPreview, basilicaPreview, townPreview, shipyardPreview, pianoPreview, trafficPreview, spiderPreview, rexPreview, starshipPreview, dataCenterPreview, moltenPreview, offroadPreview, agrasPreview];

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

test('collection appends new previews in the indexed order after the fourteen original pages', () => {
  assert.deepEqual(discoverPreviews(html), [...existingPreviews, ...appendedPreviews]);
});

test('homepage metadata advertises the number of runnable projects', () => {
  const description = nodes.find(node => node.tagName === 'meta' && attribute(node, 'name') === 'description');
  const count = /(?:^|\D)(\d+) 个可运行项目/u.exec(attribute(description, 'content'));
  assert.equal(Number(count?.[1]), existingPreviews.length + appendedPreviews.length);
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
  const agras = [...walk(cards.at(-1))];
  assert.equal(text(agras.find(node => node.tagName === 'h2')), agrasTitle);
  assert.equal(coverHref(agras), `./${agrasPreview}`);
  const offroad = [...walk(cards.at(-2))];
  assert.equal(text(offroad.find(node => node.tagName === 'h2')), offroadTitle);
  assert.equal(coverHref(offroad), `./${offroadPreview}`);
  const molten = [...walk(cards.at(-3))];
  assert.equal(text(molten.find(node => node.tagName === 'h2')), moltenTitle);
  assert.equal(coverHref(molten), `./${moltenPreview}`);
  const dataCenter = [...walk(cards.at(-4))];
  assert.equal(text(dataCenter.find(node => node.tagName === 'h2')), dataCenterTitle);
  assert.equal(coverHref(dataCenter), `./${dataCenterPreview}`);
  const starship = [...walk(cards.at(-5))];
  assert.equal(text(starship.find(node => node.tagName === 'h2')), starshipTitle);
  assert.equal(coverHref(starship), `./${starshipPreview}`);
  const rex = [...walk(cards.at(-6))];
  assert.equal(text(rex.find(node => node.tagName === 'h2')), rexTitle);
  assert.equal(coverHref(rex), `./${rexPreview}`);
  const spider = [...walk(cards.at(-7))];
  assert.equal(text(spider.find(node => node.tagName === 'h2')), spiderTitle);
  assert.equal(coverHref(spider), `./${spiderPreview}`);
  const traffic = [...walk(cards.at(-8))];
  assert.equal(text(traffic.find(node => node.tagName === 'h2')), trafficTitle);
  assert.equal(coverHref(traffic), `./${trafficPreview}`);
  const last = [...walk(cards.at(-9))];
  assert.equal(text(last.find(node => node.tagName === 'h2')), pianoTitle);
  assert.equal(coverHref(last), `./${pianoPreview}`);

  const previous = [...walk(cards.at(-10))];
  assert.equal(text(previous.find(node => node.tagName === 'h2')), shipyardTitle);
  assert.equal(coverHref(previous), `./${shipyardPreview}`);
  const town = [...walk(cards.at(-11))];
  assert.equal(text(town.find(node => node.tagName === 'h2')), townTitle);
  assert.equal(coverHref(town), `./${townPreview}`);
  const basilica = [...walk(cards.at(-12))];
  assert.equal(text(basilica.find(node => node.tagName === 'h2')), basilicaTitle);
  assert.equal(coverHref(basilica), `./${basilicaPreview}`);
  const rain = [...walk(cards.at(-13))];
  assert.equal(text(rain.find(node => node.tagName === 'h2')), rainTitle);
  assert.equal(coverHref(rain), `./${rainPreview}`);
  const keyboard = [...walk(cards.at(-14))];
  assert.equal(text(keyboard.find(node => node.tagName === 'h2')), keyboardTitle);
  assert.equal(coverHref(keyboard), `./${keyboardPreview}`);

  // 新卡片沿用全站统一的真实截图结构。
  for (const [card, dir, label] of [[agras, 'agras-t50-teardown', 'AGRAS T50'], [offroad, 'offroad-expedition-4x4', '荒野行者'], [molten, 'molten-salt-tower', '熔盐塔式发电站'], [dataCenter, 'data-center-dashboard', '机房运行态势'], [starship, 'starship-atlas', '星舰档案'], [rex, 'tyrant-rex', '机械霸王龙'], [spider, 'spider-teardown', '机器人蜘蛛'], [traffic, 'smart-traffic-intersection', '路序'], [last, 'largo-piano', 'LARGO'], [previous, 'steel-tide-shipyard', '钢潮入海'], [town, 'songfeng-town', '松风镇']]) {
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
  const trailingPreviews = [agrasPreview, offroadPreview, moltenPreview, dataCenterPreview, starshipPreview, rexPreview, spiderPreview, trafficPreview, pianoPreview, shipyardPreview, townPreview, basilicaPreview, rainPreview, keyboardPreview];
  for (const [index, preview] of trailingPreviews.entries()) {
    const project = preview.split('/')[0];
    const row = rows.at(-1 - index);
    const livePath = preview.replace(/index\.html$/u, '');
    assert.ok(row.includes(`[在线](https://fanhuayishiy.github.io/ai-demo/${livePath})`));
    assert.ok(row.includes(`[README](./${project}/README.md)`));
    assert.ok(row.includes(`./assets/project-thumbnails/${project}.webp`));
  }
});

test('README puts the newest overview immediately before the contribution instructions', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const contributionIndex = headings.indexOf('## 新增项目');
  assert.ok(contributionIndex > 0);
  assert.equal(headings[contributionIndex - 1], `## agras-t50-teardown — ${agrasTitle}`);
  assert.equal(headings[contributionIndex - 2], `## offroad-expedition-4x4 — ${offroadTitle}`);
  assert.equal(headings[contributionIndex - 3], `## molten-salt-tower — ${moltenTitle}`);
  assert.equal(headings[contributionIndex - 4], `## data-center-dashboard — ${dataCenterTitle}`);
  assert.equal(headings[contributionIndex - 5], `## starship-atlas — ${starshipTitle}`);
  assert.ok(headings[contributionIndex - 6].startsWith('## tyrant-rex '));
  assert.ok(headings[contributionIndex - 7].startsWith('## spider-teardown '));
  assert.ok(headings[contributionIndex - 8].startsWith('## smart-traffic-intersection '));
  assert.ok(headings[contributionIndex - 9].startsWith('## largo-piano '));
  assert.ok(headings[contributionIndex - 10].startsWith('## steel-tide-shipyard '));
  const moltenStart = readme.indexOf('## molten-salt-tower ');
  const moltenOverview = readme.slice(moltenStart, readme.indexOf('## 新增项目', moltenStart));
  assert.ok(moltenOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/molten-salt-tower/)'));
  assert.ok(moltenOverview.includes('[README（含主生成提示原文）](./molten-salt-tower/README.md)'));
  const dataCenterStart = readme.indexOf('## data-center-dashboard ');
  const dataCenterOverview = readme.slice(dataCenterStart, moltenStart);
  assert.ok(dataCenterOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/data-center-dashboard/)'));
  assert.ok(dataCenterOverview.includes('[README（含主生成提示原文）](./data-center-dashboard/README.md)'));
  const starshipStart = readme.indexOf('## starship-atlas ');
  const starshipOverview = readme.slice(starshipStart, dataCenterStart);
  assert.ok(starshipOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/starship-atlas/dist/)'));
  assert.ok(starshipOverview.includes('[README（含主生成提示原文）](./starship-atlas/README.md)'));
  const rexStart = readme.indexOf('## tyrant-rex ');
  const rexOverview = readme.slice(rexStart, starshipStart);
  assert.ok(rexOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/tyrant-rex/dist/)'));
  assert.ok(rexOverview.includes('[README（含主生成提示原文）](./tyrant-rex/README.md)'));
  const spiderStart = readme.indexOf('## spider-teardown ');
  const spiderOverview = readme.slice(spiderStart, rexStart);
  for (const concept of ['八条尖足', '胫节', '爆炸拆解']) assert.ok(spiderOverview.includes(concept));
  assert.ok(spiderOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/spider-teardown/dist/)'));
  assert.ok(spiderOverview.includes('[README（含主生成提示原文）](./spider-teardown/README.md)'));
  const trafficStart = readme.indexOf('## smart-traffic-intersection ');
  const trafficOverview = readme.slice(trafficStart, spiderStart);
  for (const concept of ['调整绿灯', '行人过街', '并行', '倒计时']) assert.ok(trafficOverview.includes(concept));
  assert.ok(trafficOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/smart-traffic-intersection/dist/)'));
  assert.ok(trafficOverview.includes('[README（含主生成提示原文）](./smart-traffic-intersection/README.md)'));
  const overviewStart = readme.indexOf('## largo-piano ');
  const overview = readme.slice(overviewStart, trafficStart);
  for (const concept of ['88 键', '提前展示', '全曲进度', '小星星', '欢乐颂']) assert.ok(overview.includes(concept));
  assert.ok(overview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/largo-piano/)'));
  assert.ok(overview.includes('[README（含主生成提示原文）](./largo-piano/README.md)'));
  const shipyardStart = readme.indexOf('## steel-tide-shipyard ');
  const shipyardOverview = readme.slice(shipyardStart, readme.indexOf('## largo-piano ', shipyardStart));
  for (const concept of ['B-07', '注水出坞', '昼夜循环', '离线']) assert.ok(shipyardOverview.includes(concept));
  assert.ok(shipyardOverview.includes('[在线预览](https://fanhuayishiy.github.io/ai-demo/steel-tide-shipyard/dist/)'));
  assert.ok(shipyardOverview.includes('[README（含主生成提示原文）](./steel-tide-shipyard/README.md)'));
});

test('README retains the town overview directly before the shipyard', () => {
  const headings = readme.split(/\r?\n/u).filter(line => line.startsWith('## '));
  const townIndex = headings.findIndex(heading => heading.startsWith('## songfeng-town '));
  assert.ok(headings[townIndex + 1].startsWith('## steel-tide-shipyard '));
  assert.ok(headings[townIndex - 1].startsWith('## sagrada-familia '));
  const overviewStart = readme.indexOf('## songfeng-town ');
  const overview = readme.slice(overviewStart, readme.indexOf('## steel-tide-shipyard ', overviewStart));
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
