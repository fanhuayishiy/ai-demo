import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const folder = fileURLToPath(new URL('../', import.meta.url));
const teardown = path.resolve(folder, process.env.TEARDOWN_DIR || '.teardown');
const {CHROMIUM, CHROMIUM_ARGS, playwright} = await import(pathToFileURL(path.join(teardown, 'paths.mjs')).href);
const url = pathToFileURL(path.join(folder, 'dist', 'index.html')).href;
const images = path.join(folder, 'screenshots');
const retainImages = process.argv.includes('--shots');
if (retainImages) await fs.mkdir(images, {recursive: true});

const {chromium} = playwright();
const browser = await chromium.launch({executablePath: CHROMIUM, args: CHROMIUM_ARGS});
const errors = [], remote = [];

function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', request => {
    if (/^https?:/.test(request.url())) remote.push(request.url());
  });
}

async function launchPage(options) {
  const page = await browser.newPage({offline: true, ...options});
  observe(page);
  await page.goto(url);
  await page.locator('#app[data-ready="true"]').waitFor({timeout: 45000});
  return page;
}

async function shot(page, name) {
  if (retainImages) await page.screenshot({path: path.join(images, name), fullPage: true});
}

try {
  const page = await launchPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  const model = page.locator('#app');
  const slider = page.getByLabel('拆解进度');
  const clock = page.getByLabel('飞行时间');
  const flightPanel = page.locator('.flight-panel');
  const monitor = page.locator('.monitor-spray');
  const waitMode = mode => page.locator('#app[data-mode="' + mode + '"]').waitFor();
  const waitPhase = phase => page.locator('.flight-panel[data-phase="' + phase + '"]').waitFor();
  const parts = page.locator('.part-row');
  assert.equal(await parts.count(), 8);
  assert.equal(await model.getAttribute('data-mode'), 'flight');
  assert.equal(await clock.inputValue(), '0');
  assert.ok(await page.locator('#gl').isVisible());
  const [modes, index, scene, observations] = await Promise.all([
    page.getByRole('navigation', {name: '探索模式'}).boundingBox(),
    page.getByRole('complementary', {name: '部件索引'}).boundingBox(),
    page.locator('.stage').boundingBox(),
    page.getByRole('complementary', {name: '观察面板'}).boundingBox(),
  ]);
  assert.ok(modes.x + modes.width <= scene.x && index.x + index.width <= scene.x);
  assert.ok(observations.x >= scene.x + scene.width);
  const deck = page.locator('.control-deck');
  assert.equal(await deck.count(), 1, 'the workbench has a shared bottom control panel');
  const footer = await deck.boundingBox();
  assert.ok(footer.x <= modes.x && footer.x + footer.width >= observations.x + observations.width);
  assert.ok(footer.y >= scene.y + scene.height - 1);
  assert.equal(await deck.getByRole('button', {name: '飞行演示', exact: true}).count(), 1);
  assert.equal(await monitor.textContent(), '关闭');
  const ground = await page.locator('#gl').screenshot();
  await shot(page, 't50-flight-start.png');

  for (const [label, phase, time] of [
    ['起飞', 'takeoff', '3.1'], ['前进', 'forward', '4.85'], ['撒药', 'spray', '6.4'], ['降落', 'landing', '10.5'],
  ]) {
    await page.getByRole('button', {name: label, exact: true}).click();
    await waitPhase(phase);
    assert.equal(await clock.inputValue(), time);
    assert.equal(await monitor.textContent(), phase === 'spray' ? '喷洒中' : '关闭');
    assert.ok(!(await page.locator('#gl').screenshot()).equals(ground), label + ' visibly changes the scene');
    await shot(page, 't50-' + phase + '.png');
  }
  await clock.fill('14.4');
  await waitPhase('landed');
  await page.getByRole('button', {name: '重播飞行', exact: true}).waitFor();
  await shot(page, 't50-landed.png');
  assert.equal(await flightPanel.getByText('已落地').count(), 1);

  await page.getByRole('button', {name: '装配', exact: true}).click();
  await waitMode('build');
  assert.equal(await slider.inputValue(), '0');
  await shot(page, 't50-assembled.png');
  const viewport = await page.locator('#gl').boundingBox();
  await page.mouse.click(viewport.x + viewport.width * .49, viewport.y + viewport.height * .405);
  await page.getByRole('heading', {name: '40 L 药箱', exact: true}).waitFor();
  await page.keyboard.press('Escape');

  await page.getByRole('button', {name: '爆炸拆解', exact: true}).click();
  await page.locator('#app[data-mode="explode"] .readout').getByText('100', {exact: false}).waitFor();
  assert.equal(await slider.inputValue(), '100');
  assert.equal(await page.locator('.callout:visible').count(), 8);
  await shot(page, 't50-exploded.png');

  await slider.fill('48');
  await page.locator('.readout').getByText('48', {exact: false}).waitFor();
  await page.keyboard.press('3');
  await waitMode('xray');
  assert.equal(await slider.inputValue(), '0');
  await shot(page, 't50-xray.png');

  const motors = parts.filter({hasText: '双层无刷电机'});
  await motors.click();
  await page.getByRole('heading', {name: '双层无刷电机', exact: true}).waitFor();
  assert.equal(await motors.getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', {name: '单独查看', exact: true}).click();
  await page.getByRole('button', {name: '返回整机', exact: true}).waitFor();
  assert.equal(await page.locator('.callout:visible').count(), 0);
  await shot(page, 't50-motors.png');
  const saved = page.waitForEvent('download');
  await page.getByRole('button', {name: '保存画面', exact: true}).click();
  const download = await saved;
  assert.equal(download.suggestedFilename(), 'AGRAS-T50-motors.png');
  const png = await fs.readFile(await download.path());
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.byteLength > 15_000, 'the export contains the rendered model');
  await page.getByRole('button', {name: '返回整机', exact: true}).click();
  await waitMode('xray');

  await page.keyboard.press('r');
  await waitMode('build');
  await page.getByRole('button', {name: '俯视', exact: true}).click();
  await page.locator('[data-view="top"][aria-pressed="true"]').waitFor();
  const box = await page.locator('#gl').boundingBox();
  await page.mouse.move(box.x + box.width * .52, box.y + box.height * .48);
  const beforeDrag = await page.locator('#gl').screenshot();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .60, box.y + box.height * .40, {steps: 6});
  await page.mouse.up();
  assert.ok(!beforeDrag.equals(await page.locator('#gl').screenshot()), 'dragging orbits the 3D model');
  await page.close();

  const phone = await launchPage({
    viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
  });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  const mobileDeck = await phone.locator('.control-deck').boundingBox();
  const mobileStage = await phone.locator('.stage').boundingBox();
  const mobileParts = await phone.locator('.component-index').boundingBox();
  assert.ok(mobileDeck.y >= mobileStage.y + mobileStage.height - 1);
  assert.ok(mobileDeck.y + mobileDeck.height <= mobileParts.y + 1);
  await phone.getByRole('button', {name: '撒药', exact: true}).tap();
  await phone.locator('.flight-panel[data-phase="spray"]').waitFor();
  await shot(phone, 't50-mobile.png');
  await phone.getByRole('button', {name: '爆炸拆解', exact: true}).tap();
  await phone.locator('#app[data-mode="explode"]').waitFor();
  assert.equal(await phone.getByLabel('拆解进度').inputValue(), '100');
  await phone.close();

  const live = await launchPage({viewport: {width: 1200, height: 800}, reducedMotion: 'no-preference'});
  await live.getByRole('button', {name: '暂停飞行', exact: true}).waitFor();
  await live.locator('.flight-panel[data-phase="spray"]').waitFor({timeout: 10000});
  assert.equal(await live.locator('.monitor-spray').textContent(), '喷洒中');
  await live.getByRole('button', {name: '重播飞行', exact: true}).waitFor({timeout: 21000});
  assert.equal(await live.locator('.flight-panel').getAttribute('data-phase'), 'landed');
  await live.getByRole('button', {name: '重播飞行', exact: true}).click();
  await live.locator('.flight-panel[data-phase="takeoff"]').waitFor();
  await live.keyboard.press('Escape');
  await live.getByRole('button', {name: '继续飞行', exact: true}).waitFor();
  const pausedAt = await live.getByLabel('飞行时间').inputValue();
  await live.waitForTimeout(200);
  assert.equal(await live.getByLabel('飞行时间').inputValue(), pausedAt);
  await live.getByRole('button', {name: '拆解导览', exact: true}).click();
  await live.getByRole('button', {name: '停止导览', exact: true}).waitFor();
  await live.keyboard.press('1');
  await live.getByRole('button', {name: '拆解导览', exact: true}).waitFor();
  assert.equal(await live.locator('#app').getAttribute('data-mode'), 'build');
  await live.close();

  assert.deepEqual(remote, [], 'the local page does not request network assets');
  assert.deepEqual(errors, [], 'no page or WebGL console errors');
  console.log('PASS · 离线 T50、左侧模式与部件索引、起飞前进撒药降落、暂停重播、拆解透视、部件聚焦、PNG 导出、触屏布局');
} finally {
  await browser.close();
}
