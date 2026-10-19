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
