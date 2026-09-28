import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser.mjs';

// Serve the production files at the same nested path used by GitHub Pages.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/ai-demo/orbit-heatpump-washer-dryer/';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.glb': 'model/gltf-binary', '.txt': 'text/plain; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    let file = resolve(root, pathname.slice(prefix.length));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (pathname.endsWith('/')) file = resolve(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
const url = `http://127.0.0.1:${server.address().port}${prefix}`;
const errors = [];
let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const response = await page.goto(`${url}dist/`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await page.locator('#loading').waitFor({ state: 'hidden', timeout: 60000 });
  assert.equal(await page.evaluate(() => window.__ORBIT__.washer.parts.length), 19);
  for (const view of ['assembled', 'exploded', 'cutaway', 'thermal']) {
    await page.locator(`[data-view="${view}"]`).click();
    assert.equal(await page.locator(`[data-view="${view}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.locator('#view-connections').click();
  for (const [part, title] of [['inlet', '冷水进水口与进水阀'], ['outlet', '排水出口与排水软管']]) {
    await page.locator(`[data-part="${part}"]`).click();
    assert.equal(await page.locator('#part-name').innerText(), title);
  }
  await page.locator('#info-button').click();
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
  await page.locator('#export-model').click();
  const download = await downloadPromise;
  assert.equal(await download.failure(), null);
  const exported = await readFile(await download.path());
  assert.equal(exported.readUInt32LE(0), 0x46546c67);
  assert.equal(exported.readUInt32LE(4), 2);
  await page.locator('#close-help').click();
  const glbResponse = await page.request.get(`${url}output/ORBIT-heatpump-animated.glb`);
  assert.equal(glbResponse.status(), 200);
  const glb = await glbResponse.body();
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const pngs = ['01-爆炸图', '02-内部拆解图', '03-整机外观', '04-热泵循环', '05-背面进排水接口'];
  for (const name of pngs) {
    const pngResponse = await page.request.get(`${url}output/${encodeURIComponent(name)}.png`);
    assert.equal(pngResponse.status(), 200);
    const png = await pngResponse.body();
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 3000);
    assert.equal(png.readUInt32BE(20), 2000);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, nestedPath: `${prefix}dist/`, parts: 19, views: 4, waterPorts: 2, posters: 5, liveGlbExportBytes: exported.length, savedGlbBytes: glb.length, mobile: true, browserErrors: errors }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
