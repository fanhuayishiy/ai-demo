import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  appendProject, readHomeProjects, readReadmeProjects,
} from '../scripts/add-project.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const homeHtml = readFileSync(root + 'index.html', 'utf8');
const readmeMd = readFileSync(root + 'README.md', 'utf8');

const sample = {
  dir: 'sample-project',
  title: 'Sample',
  tag: 'TAG',
  summary: '一句话简介',
  desc: '两三句速览。',
};

const fixtureHome = '<div class="grid"><div class="card"><a class="badge cover" href="./existing/index.html">预览</a></div></div>';
function fixtureReadme(withScreenshot = false, existing = true) {
  return [
    withScreenshot ? '| 截图 | 项目 | 一句话简介 | 预览 | 详细文档 |' : '| 项目 | 一句话简介 | 预览 | 详细文档 |',
    withScreenshot ? '| --- | --- | --- | --- | --- |' : '| --- | --- | --- | --- |',
    ...(existing ? [withScreenshot ? '| 待补截图 | existing | 简介 | [在线](https://example.com/) | [README](./existing/README.md) |' : '| existing | 简介 | [在线](https://example.com/) | [README](./existing/README.md) |'] : []),
    '', '---', '', '## 新增项目',
  ].join('\n');
}

for (const withScreenshot of [false, true]) {
  test(`兼容${withScreenshot ? '五' : '四'}列表格，保持原有项目顺序并追加末尾`, () => {
    const readmeMd = fixtureReadme(withScreenshot);
    assert.deepEqual(readReadmeProjects(readmeMd), ['existing']);
    const result = appendProject({ homeHtml: fixtureHome, readmeMd, project: sample });
    assert.deepEqual(readReadmeProjects(result.readmeMd), ['existing', sample.dir]);
    const row = result.readmeMd.split('\n').find((line) => line.includes('| sample-project |'));
    assert.equal(row.split('|').length - 2, withScreenshot ? 5 : 4);
    if (withScreenshot) assert.ok(row.startsWith('| 待补截图 |'));
    assert.doesNotMatch(result.homeHtml, /class="project-shot"/u);
  });
}

test('截图表格为空时，第一条项目紧跟分隔行', () => {
  const result = appendProject({ homeHtml: '<div class="grid"></div>', readmeMd: fixtureReadme(true, false), project: sample });
  assert.match(result.readmeMd, /\| --- \| --- \| --- \| --- \| --- \|\n\| 待补截图 \| sample-project/u);
});

test('可选截图生成卡片图片和160px表格预览，并转义标题', () => {
  const title = 'Sample "A" & <B> \'C\'';
  const screenshot = './assets/project-thumbnails/sample-project.webp';
  const result = appendProject({ homeHtml: fixtureHome, readmeMd: fixtureReadme(true), project: { ...sample, title, screenshot } });
  const alt = 'Sample &quot;A&quot; &amp; &lt;B&gt; &#39;C&#39;';
  assert.ok(result.homeHtml.includes(`<img class="project-shot" src="${screenshot}" width="640" height="360" loading="lazy" decoding="async" alt="${alt}">`));
  assert.ok(result.readmeMd.includes(`<a href="${screenshot}"><img src="${screenshot}" width="160" height="90" alt="${alt}"></a>`));
  assert.ok(result.readmeMd.includes('[在线](https://fanhuayishiy.github.io/ai-demo/sample-project/)'));
  assert.deepEqual(readHomeProjects(result.homeHtml), ['existing', sample.dir]);
  assert.deepEqual(readReadmeProjects(result.readmeMd), ['existing', sample.dir]);
});

test('旧表格仍可为卡片提供截图，且保留四列格式', () => {
  const result = appendProject({ homeHtml: fixtureHome, readmeMd: fixtureReadme(), project: { ...sample, screenshot: 'assets/project-thumbnails/sample.png' } });
  assert.match(result.homeHtml, /src="assets\/project-thumbnails\/sample\.png"/u);
  assert.match(result.readmeMd, /\| sample-project \| 一句话简介 \| \[在线\]/u);
});

test('拒绝远程、绝对、穿越目录和非图片截图路径', () => {
  for (const screenshot of ['https://example.com/a.png', '//example.com/a.png', '/assets/a.png', 'C:/a.png', '../a.png', './assets/../a.png', './assets/%2e%2e/a.png', './assets/a%2fb.png', './assets\\a.png', './assets/a.html', './assets/a.png?x=1', './assets/a.png#x', './assets/a.png" onerror="alert(1)', './assets/a\n.png']) {
    assert.throws(() => appendProject({ homeHtml: fixtureHome, readmeMd: fixtureReadme(), project: { ...sample, screenshot } }), /截图路径/u, screenshot);
  }
});

test('首页卡片顺序与 README 索引顺序完全一致', () => {
  const home = readHomeProjects(homeHtml);
  const readme = readReadmeProjects(readmeMd);
  assert.deepEqual(home, readme, '首页卡片与「项目列表」必须同序，新项目只能追加到末尾');
});

test('每个首页卡片都有对应的项目目录与 README', () => {
  const { existsSync } = process.getBuiltinModule('node:fs');
  for (const dir of readHomeProjects(homeHtml)) {
    assert.ok(existsSync(root + dir), `缺少项目目录 ${dir}`);
    assert.ok(existsSync(root + dir + '/README.md'), `缺少 ${dir}/README.md`);
  }
});

test('新项目被追加到卡片与表格的最后一位', () => {
  const { homeHtml: home, readmeMd: readme } = appendProject({
    homeHtml, readmeMd, project: sample,
  });
  const homeDirs = readHomeProjects(home);
  const readmeDirs = readReadmeProjects(readme);
  assert.equal(homeDirs.at(-1), sample.dir);
  assert.equal(readmeDirs.at(-1), sample.dir);
  assert.deepEqual(homeDirs, readmeDirs);
  // 既有项目一位都不许动
  assert.deepEqual(homeDirs.slice(0, -1), readHomeProjects(homeHtml));
});

test('详情段落追加在「新增项目」说明之前，且带预览与文档链接', () => {
  const { readmeMd: readme } = appendProject({ homeHtml, readmeMd, project: sample });
  const at = readme.indexOf('## sample-project — Sample');
  assert.ok(at > 0);
  assert.ok(at < readme.indexOf('## 新增项目'));
  assert.match(readme.slice(at), /\[在线预览\]\(https:\/\/fanhuayishiy\.github\.io\/ai-demo\/sample-project\/\)/u);
  assert.match(readme.slice(at), /\[README（含主生成提示原文）\]\(\.\/sample-project\/README\.md\)/u);
});

test('重复追加同一个项目会被拒绝', () => {
  const once = appendProject({ homeHtml, readmeMd, project: sample });
  assert.throws(() => appendProject({ homeHtml: once.homeHtml, readmeMd: once.readmeMd, project: sample }), /已存在/u);
});

test('预览路径必须落在本项目目录内', () => {
  assert.throws(() => appendProject({
    homeHtml, readmeMd, project: { ...sample, preview: './other/index.html' },
  }), /预览路径/u);
});

test('项目目录名必须是小写 kebab-case', () => {
  assert.throws(() => appendProject({
    homeHtml, readmeMd, project: { ...sample, dir: 'Bad_Name' },
  }), /kebab-case/u);
});

test('缺少必填字段会被拒绝', () => {
  assert.throws(() => appendProject({
    homeHtml, readmeMd, project: { ...sample, summary: '  ' },
  }), /缺少字段 summary/u);
});

test('追加后的首页仍是可解析的 HTML，卡片带 badge cover 两个 class', () => {
  const { homeHtml: home } = appendProject({ homeHtml, readmeMd, project: sample });
  assert.match(home, /<a class="badge cover" href="\.\/sample-project\/index\.html">/u);
  assert.equal((home.match(/<div class="card">/gu) ?? []).length, readHomeProjects(home).length);
});
