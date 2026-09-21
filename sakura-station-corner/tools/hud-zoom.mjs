// 把右上角读数那块裁出来放大拍，判断它在亮/暗两套配色下是否真的读得清。
// 整屏截图缩到 1600 px 宽时 11 px 的字本来就糊，那种「看不清」是缩略图的错，不是配色的错 ——
// 要判配色就得按 1:1（甚至 2×）看它自己那一小块。
// 用法：node tools/hud-zoom.mjs [--weather=night] [--dpr=3]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 700, height: 420 }, deviceScaleFactor: Number(arg('dpr', 3)) })).newPage();
page.setDefaultTimeout(300000);
await page.goto(`http://127.0.0.1:5173/?fps=1${arg('weather', '') ? '&weather=' + arg('weather') : ''}`, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
await page.waitForTimeout(4000);
const txt = await page.evaluate(() => document.getElementById('fps')?.textContent ?? '(没有 #fps)');
await page.screenshot({ path: `shots/hud-zoom${arg('weather', '') ? '-' + arg('weather') : ''}.png`, clip: { x: 700 - 250, y: 6, width: 244, height: 30 } });
console.log('读数文本:', JSON.stringify(txt));
console.log('放大图 -> shots/hud-zoom' + (arg('weather', '') ? '-' + arg('weather') : '') + '.png');
await browser.close();
