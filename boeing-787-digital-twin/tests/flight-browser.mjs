import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.getByText('三维场景已就绪').waitFor();
  const canvas = page.getByTestId('aircraft-canvas');
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    for (const [label, kind] of [
      ['起飞', 'takeoff'],
      ['降落', 'landing'],
    ]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.waitForTimeout(600);
      assert.equal(await canvas.getAttribute('data-flight'), kind);
      await page.getByRole('button', { name: '暂停飞行动画' }).click();
      await page.waitForTimeout(100);
      const paused = await canvas.getAttribute('data-flight-progress');
      await page.waitForTimeout(250);
      assert.equal(await canvas.getAttribute('data-flight-progress'), paused);
      const before = await canvas.evaluate((e) => e.toDataURL());
      const bounds = await canvas.boundingBox();
      await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.45);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.5, {
        steps: 16,
      });
      await page.mouse.up();
      await page.waitForTimeout(700);
      const rotated = await canvas.evaluate((e) => e.toDataURL());
      assert.notEqual(rotated, before, 'paused flight supports orbit');
      assert.equal(await canvas.getAttribute('data-flight'), kind);
      await page.getByRole('button', { name: '放大', exact: true }).click();
      await page.waitForTimeout(250);
      assert.notEqual(await canvas.evaluate((e) => e.toDataURL()), rotated, 'flight supports zoom');
      await page.getByRole('button', { name: '重置视图', exact: true }).click();
      await page.waitForTimeout(250);
      assert.equal(
        await canvas.getAttribute('data-flight-progress'),
        paused,
        'camera reset preserves timeline',
      );
      for (const progress of [450, 650, 1000]) {
        await page.getByRole('slider', { name: '飞行进度' }).fill(String(progress));
        await page.waitForTimeout(150);
        assert.equal(
          await canvas.getAttribute('data-flight-progress'),
          (progress / 1000).toFixed(3),
        );
        const data = await canvas.evaluate((e) => e.toDataURL());
        assert.notEqual(data, before);
        const png = PNG.sync.read(Buffer.from(data.split(',')[1], 'base64'));
        let bright = 0;
        for (let i = 0; i < png.data.length; i += 4) {
          if (png.data[i] > 125 && png.data[i + 3] > 128) bright++;
        }
        assert.ok(bright / (png.width * png.height) > 0.005);
        if (progress === 650) {
          await page.getByRole('button', { name: '气流效果', exact: true }).click();
          await page.waitForTimeout(150);
          assert.equal(
            await page
              .getByRole('button', { name: '气流效果', exact: true })
              .getAttribute('aria-pressed'),
            'false',
          );
          assert.ok(
            (await canvas.evaluate((e) => e.toDataURL())) !== data,
            'airflow toggle changes visible pixels',
          );
          await page.getByRole('button', { name: '气流效果', exact: true }).click();
          await page.mouse.move(0, 0);
          await page.waitForTimeout(150);
        }
        await page
          .locator('.viewer')
          .screenshot({ path: `test-results/flight-${kind}-${width}-${progress}.png` });
      }
      await page.locator('.flight-stages button').nth(2).click();
      await page.waitForTimeout(150);
      assert.equal(
        await canvas.getAttribute('data-flight-progress'),
        kind === 'takeoff' ? '0.380' : '0.500',
      );
      await page.getByRole('button', { name: '重播飞行动画' }).click();
      await page.waitForTimeout(250);
      assert.ok(Number(await canvas.getAttribute('data-flight-progress')) < 0.1);
      await page.getByRole('slider', { name: '飞行进度' }).fill('990');
      await page.getByRole('button', { name: '播放飞行动画' }).click();
      await page.waitForTimeout(800);
      assert.equal(await canvas.getAttribute('data-flight-progress'), '1.000');
      await page.getByRole('button', { name: '返回结构视图' }).click();
      await page.waitForTimeout(150);
      assert.equal(await canvas.getAttribute('data-flight'), '');
      assert.ok(await page.getByRole('button', { name: '爆炸视图', exact: true }).isVisible());
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    }
  }
  assert.deepEqual(errors, []);
  for (const width of [1920, 1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: '降落', exact: true }).click();
    const heights = [];
    for (const value of ['100', '500', '800', '999', '1000']) {
      await page.getByRole('slider', { name: '飞行进度' }).fill(value);
      heights.push((await page.locator('.flight-controls').boundingBox()).height);
    }
    assert.ok(
      Math.max(...heights) - Math.min(...heights) < 1,
      `panel height stays stable at ${width}`,
    );
    await page.mouse.move(0, 0);
    await page
      .locator('.viewer')
      .screenshot({ path: `test-results/flight-panel-end-${width}.png` });
  }
  console.log('Flight desktop/mobile: start, pause, seek, replay, exit and canvas pixels passed.');
} finally {
  await browser.close();
}
