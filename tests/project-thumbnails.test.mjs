import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { readHomeProjects, readReadmeProjects } from '../scripts/add-project.mjs';
import { validateProjectScreenshot } from '../scripts/project-screenshot.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const readme = await readFile(path.join(root, 'README.md'), 'utf8');
const document = new JSDOM(html).window.document;

test('each existing project card has one lightweight screenshot with stable dimensions', async () => {
  const cards = [...document.querySelectorAll('.grid > .card')];
  assert.equal(cards.length, readHomeProjects(html).length);
  let total = 0;
  for (const card of cards) {
    const dir = card.querySelector('a.badge.cover').getAttribute('href').split('/')[1];
    const images = card.querySelectorAll('img.project-shot');
    assert.equal(images.length, 1, `${dir} screenshot is missing or duplicated`);
    const image = images[0];
    assert.equal(image.getAttribute('src'), `./assets/project-thumbnails/${dir}.webp`);
    assert.equal(image.getAttribute('width'), '640');
    assert.equal(image.getAttribute('height'), '360');
    assert.equal(image.getAttribute('loading'), 'lazy');
    assert.equal(image.getAttribute('decoding'), 'async');
    assert(image.getAttribute('alt')?.includes(card.querySelector('h2').textContent));
    const filename = path.join(root, image.getAttribute('src'));
    await validateProjectScreenshot({ root, dir, screenshot: image.getAttribute('src') });
    const bytes = await readFile(filename);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    const { size } = await stat(filename);
    assert(size > 1000 && size < 80000, `${dir} screenshot exceeds the thumbnail budget`);
    total += size;
  }
  assert(total < cards.length * 80000, 'The total thumbnail budget should scale with the project count');
});

test('README screenshots open the large image, keeping a separate online preview in the same order', () => {
  assert(readme.includes('| 截图 | 项目 | 一句话简介 | 预览 | 详细文档 |'));
  assert.deepEqual(readReadmeProjects(readme), readHomeProjects(html));
  for (const card of document.querySelectorAll('.grid > .card')) {
    const preview = card.querySelector('a.badge.cover').getAttribute('href');
    const dir = preview.split('/')[1];
    const line = readme.split(/\r?\n/u).find(row => row.includes(`| ${dir} |`));
    assert(line, `${dir} row missing`);
    const images = new JSDOM(line).window.document.querySelectorAll('img');
    assert.equal(images.length, 1, `${dir} README screenshot missing`);
    const image = images[0];
    assert.equal(image.getAttribute('src'), `./assets/project-thumbnails/${dir}.webp`);
    assert.equal(image.getAttribute('width'), '160');
    assert.equal(image.getAttribute('height'), '90');
    assert.equal(image.parentElement.tagName, 'A');
    assert.equal(image.parentElement.getAttribute('href'), image.getAttribute('src'));
    assert(line.includes(`[在线](https://fanhuayishiy.github.io/ai-demo/${preview.replace(/^\.\//u, '').replace(/index\.html$/u, '')})`));
  }
});

test('home includes the lightweight image-preview enhancement', async () => {
  assert(document.querySelector('script[src="./assets/gallery-preview.js"][defer]'));
  const script = await readFile(path.join(root, 'assets/gallery-preview.js'), 'utf8');
  assert(script.length < 10000, 'Preview should not need a large dependency');
});

test('Roadster summary describes the currently published gameplay', () => {
  const card = [...document.querySelectorAll('.card')].find(card => card.querySelector('a.badge.cover')?.getAttribute('href').includes('roadster-escape-toll'));
  for (const text of ['翻滚', '补气', '车道']) assert(card.textContent.includes(text), `Missing Roadster feature: ${text}`);
  assert(!card.textContent.includes('烧完不补'));
  const summary = readme.split(/\r?\n/u).find(row => row.includes('| roadster-escape-toll |'));
  assert(summary.includes('补气') && summary.includes('翻滚') && !summary.includes('烧完不补'));
});
