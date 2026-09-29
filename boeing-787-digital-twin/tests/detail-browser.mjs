import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(process.env.AEROSTRUCT_URL || 'http://localhost:5173', {
    waitUntil: 'networkidle',
  });
  await page.getByText('三维场景已就绪').waitFor();
  const ids = [
    'nose',
    'fuselage',
    'wing-left',
    'wing-right',
    'engine-left',
    'engine-right',
    'tail',
    'cabin',
    'landing-gear',
  ];
  const canvas = page.getByTestId('aircraft-canvas');
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const index of width === 1920 ? ids.map((_, i) => i) : [4, 7, 8]) {
      await page.getByRole('button', { name: '重置视图', exact: true }).click();
      await page.getByRole('button', { name: '剖面视图', exact: true }).click();
      await page.locator('.assembly-item').nth(index).click();
      await page.getByRole('button', { name: '聚焦选中部件', exact: true }).click();
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1500);
      assert.equal(await canvas.getAttribute('data-focused-part'), ids[index]);
      const data = await canvas.evaluate((element) => element.toDataURL());
      const png = PNG.sync.read(Buffer.from(data.split(',')[1], 'base64'));
      let visible = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        if (Math.max(png.data[i], png.data[i + 1], png.data[i + 2]) > 125 && png.data[i + 3] > 128)
          visible++;
      }
      assert.ok(visible / (png.width * png.height) > 0.004, `visible ${ids[index]} at ${width}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false);
      const controlsOverlap = await page.evaluate(() => {
        const a = document.querySelector('.viewer-side-tools').getBoundingClientRect();
        const b = document.querySelector('.view-presets').getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      });
      assert.equal(controlsOverlap, false, `camera controls overlap at ${width}`);
      if (width > 1100) {
        const overlap = await page.evaluate(() => {
          const health = document.querySelector('.health-section').getBoundingClientRect();
          const next = document.querySelector('.engine-section').getBoundingClientRect();
          const report = document.querySelector('.report-link').getBoundingClientRect();
          return report.bottom > next.top || health.bottom > next.top;
        });
        assert.equal(overlap, false, `inspector layout for ${ids[index]} at ${width}`);
      }
      if ([4, 7, 8].includes(index)) {
        await page.screenshot({
          path: `test-results/detail-${ids[index]}-${width}.png`,
          fullPage: true,
        });
      }
      await page.getByRole('button', { name: '返回全机', exact: true }).click();
      assert.equal(await canvas.getAttribute('data-focused-part'), '');
      assert.equal(
        await page
          .getByRole('button', { name: '剖面视图', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      );
      console.log(`Verified focus, pixels, layout and return: ${ids[index]} / ${width}`);
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
