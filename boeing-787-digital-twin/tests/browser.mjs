import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
const errors = [],
  warnings = [],
  evidence = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});

async function screenshot(name) {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}
function differenceFraction(before, after) {
  const a = PNG.sync.read(before),
    b = PNG.sync.read(after);
  assert.equal(a.data.length, b.data.length);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]) >
      60
    )
      changed++;
  }
  return changed / (a.width * a.height);
}
async function canvasEvidence(label) {
  const dataUrl = await page
    .getByTestId('aircraft-canvas')
    .evaluate((canvas) => canvas.toDataURL('image/png'));
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  const png = PNG.sync.read(buffer);
  let bright = 0;
  for (let i = 0; i < png.data.length; i += 4)
    if (png.data[i] > 125 && png.data[i + 1] > 130 && png.data[i + 2] > 130) bright++;
  const fraction = bright / (png.width * png.height);
  assert.ok(fraction > 0.008, `${label}: visible aircraft occupies ${fraction}`);
  evidence.push({
    label,
    canvas: [png.width, png.height],
    brightPixels: bright,
    brightFraction: fraction,
  });
  return buffer;
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  assert.ok(
    dimensions.scrollWidth <= dimensions.width + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`,
  );
  evidence.push({ label, dimensions });
  if (dimensions.width > 1100) {
    const collisions = await page.evaluate(() => {
      const issues = [];
      for (const selector of ['.left-rail', '.right-rail', '.assembly-section']) {
        const rail = document.querySelector(selector),
          railBox = rail.getBoundingClientRect();
        for (const child of rail.children) {
          if (child.getBoundingClientRect().bottom > railBox.bottom + 1)
            issues.push(`${selector} > ${child.className} overflows`);
        }
      }
      const lastPart = document.querySelector('.assembly-item:last-child').getBoundingClientRect();
      const summary = document.querySelector('.assembly-summary').getBoundingClientRect();
      if (lastPart.bottom > summary.top) issues.push('assembly list overlaps summary');
      const tools = document.querySelector('.viewer-side-tools').getBoundingClientRect();
      const presets = document.querySelector('.view-presets').getBoundingClientRect();
      if (tools.bottom > presets.top && tools.left < presets.right && tools.right > presets.left)
        issues.push('camera controls overlap');
      return issues;
    });
    assert.deepEqual(collisions, [], `${label}: layout collisions`);
  }
}

try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.getByText('三维场景已就绪').waitFor();
  await page.getByRole('button', { name: '查看铝合金占比', exact: true }).click();
  await page.mouse.move(0, 0);
  assert.equal(await page.locator('.donut-center strong').innerText(), '20%');
  assert.equal(await page.locator('.donut-center small').innerText(), '铝合金');
  await page.getByRole('button', { name: '查看钛合金占比', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.donut-center strong').innerText(), '15%');
  await page.getByRole('button', { name: '查看复合材料占比', exact: true }).click();
  await page.mouse.move(0, 0);
  await page.getByRole('button', { name: '整机视图', exact: true }).click();
  await page.waitForTimeout(900);
  await screenshot('desktop-assembled');
  await canvasEvidence('1920 assembled');
  await noOverflow('1920 desktop');
  console.log('Initial buttons:', await page.getByRole('button').allTextContents());
  await page.getByRole('button', { name: '爆炸视图', exact: true }).click();
  await page.waitForFunction(
    () => Number(document.querySelector('canvas[data-testid]').dataset.explosion) > 0.7,
  );
  await screenshot('desktop-exploded');
  const explosionPixels = await canvasEvidence('1920 exploded');
  await page.getByRole('slider', { name: '拆解程度' }).fill('100');
  await page.waitForFunction(
    () => Number(document.querySelector('canvas[data-testid]').dataset.explosion) > 0.99,
  );
  await screenshot('desktop-exploded-full');
  await canvasEvidence('1920 full explosion');
  await page.getByRole('slider', { name: '拆解程度' }).fill('10');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '播放拆解演示', exact: true }).click();
  await page.waitForTimeout(750);
  await page.getByRole('button', { name: '暂停拆解演示', exact: true }).click();
  const pauseValue = await page.getByTestId('aircraft-canvas').getAttribute('data-explosion');
  await page.waitForTimeout(600);
  const pausedValue = await page.getByTestId('aircraft-canvas').getAttribute('data-explosion');
  assert.ok(
    Math.abs(Number(pausedValue) - Number(pauseValue)) < 0.025,
    'pausing freezes decomposition',
  );
  await page.getByRole('button', { name: '剖面视图', exact: true }).click();
  await page.waitForTimeout(1400);
  await screenshot('desktop-cutaway');
  const cutawayPixels = await canvasEvidence('1920 cutaway');
  assert.notDeepEqual(explosionPixels, cutawayPixels);
  await page.locator('.assembly-item').filter({ hasText: '左侧发动机' }).click();
  await page.locator('.component-inspector h3').filter({ hasText: '左侧发动机' }).waitFor();
  const beforeFocus = await canvasEvidence('before component focus');
  await page.getByRole('button', { name: '聚焦选中部件', exact: true }).click();
  await page.waitForTimeout(1600);
  assert.equal(
    await page.getByTestId('aircraft-canvas').getAttribute('data-focused-part'),
    'engine-left',
  );
  assert.ok(differenceFraction(beforeFocus, await canvasEvidence('engine focused')) > 0.01);
  await screenshot('desktop-engine-detail');
  await page.getByRole('button', { name: '返回全机', exact: true }).click();
  await page.waitForTimeout(1400);
  assert.equal(await page.getByTestId('aircraft-canvas').getAttribute('data-focused-part'), '');
  assert.equal(
    await page.getByRole('button', { name: '剖面视图', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: '查看部件检测报告' }).click();
  await page.locator('dialog[open]').waitFor();
  assert.equal(await page.locator('dialog tbody tr').count(), 1);
  assert.match(await page.locator('.report-result').innerText(), /98\.8/);
  const reportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 JSON 报告' }).click();
  assert.equal((await reportDownload).suggestedFilename(), 'B787-9-structural-report.json');
  await page.getByRole('button', { name: '关闭报告' }).click();
  await page.getByRole('button', { name: '重置视图' }).click();
  await page.waitForTimeout(1000);
  await page.locator('.assembly-item').filter({ hasText: '客舱与地板梁' }).click();
  assert.equal(
    await page.getByRole('button', { name: '剖面视图', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page.getByRole('button', { name: '结构拆解', exact: true }).getAttribute('aria-current'),
    'page',
  );
  await page.getByRole('button', { name: '重置视图' }).click();
  await page.waitForTimeout(1000);
  const beforeZoom = await canvasEvidence('before zoom');
  await page.getByRole('button', { name: '放大', exact: true }).click();
  await page.waitForTimeout(300);
  assert.notDeepEqual(beforeZoom, await canvasEvidence('after zoom'));
  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出视图', exact: true }).click();
  assert.equal((await imageDownload).suggestedFilename(), 'B787-9-assembled.png');
  await page.getByRole('button', { name: '俯视', exact: true }).click();
  await page.waitForTimeout(1400);
  await screenshot('desktop-top');
  await canvasEvidence('top view');
  for (const [name, file] of [
    ['侧视', 'side'],
    ['前视', 'front'],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForTimeout(1800);
    await canvasEvidence(`${file} view`);
    await screenshot(`desktop-${file}`);
  }
  await page.getByRole('button', { name: '部件标注', exact: true }).click();
  assert.equal(await page.locator('.annotation:visible').count(), 0);
  await page.getByRole('button', { name: '坐标网格', exact: true }).click();
  await page.getByRole('button', { name: '重置视图' }).click();
  await page.waitForTimeout(1800);
  const nosePoint = await page.locator('[data-annotation="nose"] .annotation-point').boundingBox();
  assert.ok(nosePoint);
  await page.mouse.move(nosePoint.x + nosePoint.width / 2, nosePoint.y + nosePoint.height / 2);
  await page.waitForFunction(
    () => document.querySelector('canvas[data-testid]').dataset.hoveredPart === 'nose',
  );
  assert.match(await page.locator('.assembly-item.hovered').innerText(), /机首与驾驶舱/);
  await page.mouse.click(nosePoint.x + nosePoint.width / 2, nosePoint.y + nosePoint.height / 2);
  await page.locator('.component-inspector h3').filter({ hasText: '机首与驾驶舱' }).waitFor();
  await page.getByRole('button', { name: '取消部件选择' }).click();
  const beforeRotate = await canvasEvidence('rotation baseline');
  await page.getByRole('button', { name: '自动旋转', exact: true }).click();
  await page.waitForTimeout(1800);
  const rotateDifference = differenceFraction(
    beforeRotate,
    await canvasEvidence('rotating aircraft'),
  );
  assert.ok(rotateDifference > 0.002, `real camera rotation changes image: ${rotateDifference}`);
  await page.getByRole('button', { name: '自动旋转', exact: true }).click();
  const beforeDrag = await canvasEvidence('orbit baseline');
  const canvasBox = await page.getByTestId('aircraft-canvas').boundingBox();
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.4, canvasBox.y + canvasBox.height * 0.48);
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.55,
    canvasBox.y + canvasBox.height * 0.5,
    { steps: 10 },
  );
  await page.mouse.up();
  await page.waitForTimeout(400);
  assert.ok(differenceFraction(beforeDrag, await canvasEvidence('dragged aircraft')) > 0.01);
  assert.equal(await page.locator('.component-inspector').count(), 0, 'orbit drag is not a click');
  await page.getByRole('button', { name: '系统监测', exact: true }).click();
  await page.getByText('关键系统在线率').waitFor();
  await page.getByText('液压系统', { exact: true }).waitFor();
  await page.getByRole('combobox', { name: '应变趋势时间范围' }).selectOption('15');
  assert.equal(await page.getByRole('combobox', { name: '应变趋势时间范围' }).inputValue(), '15');
  await page.getByRole('button', { name: '全屏显示', exact: true }).click();
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.getByRole('button', { name: '重置视图' }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1300);
  await screenshot('desktop-1440');
  await canvasEvidence('1440 assembled');
  await noOverflow('1440 desktop');
  for (const [width, height] of [
    [1366, 768],
    [2560, 1440],
    [1024, 768],
    [768, 1024],
    [320, 740],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(700);
    await noOverflow(`${width}x${height}`);
    await canvasEvidence(`${width}x${height} canvas`);
    await screenshot(`viewport-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1300);
  await screenshot('mobile-assembled');
  await canvasEvidence('390 mobile assembled');
  await noOverflow('390 mobile');
  await page.getByRole('button', { name: '爆炸视图', exact: true }).click();
  await page.waitForTimeout(1300);
  await screenshot('mobile-exploded');
  await canvasEvidence('390 mobile exploded');
  const labelCollisions = await page.locator('.annotation-label:visible').evaluateAll((labels) => {
    const boxes = labels.map((label) => label.getBoundingClientRect());
    return boxes.some((a, i) =>
      boxes
        .slice(i + 1)
        .some((b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top),
    );
  });
  assert.equal(labelCollisions, false, 'mobile annotations do not overlap');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('三维场景已就绪').waitFor();
  await canvasEvidence('390 reduced motion');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(400);
  await screenshot('showcase');
  assert.deepEqual(errors, []);
  await writeFile(
    'test-results/evidence.json',
    JSON.stringify({ evidence, errors, warnings }, null, 2),
  );
  console.log(JSON.stringify({ evidence, errors, warnings }, null, 2));
} finally {
  console.log('Browser errors:', errors);
  await browser.close();
}
