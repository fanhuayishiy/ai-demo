// 启动失败探针：装配抛异常时 built 永远不会置位，工具只能干等到超时。
// 这里只等一小会儿，把页面错误直接吐出来。用法：node tools/boot-error.mjs [--url=...] [--wait=30]
import { chromium } from 'playwright';
const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 800, height: 500 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + (e.stack || e.message || String(e)).split('\n').slice(0, 6).join('\n  ')));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
const t0 = Date.now();
let state = null;
while (Date.now() - t0 < (+arg('wait', '30')) * 1000) {
  state = await page.evaluate(() => {
    const e = window.__DIORAMA__;
    return e ? { built: e.built, ready: e.ready, phase: e.progress?.phase, frames: e.frames, timings: e.timings } : null;
  }).catch(() => null);
  if (state?.built) break;
  await page.waitForTimeout(1000);
}
console.log('状态', JSON.stringify(state));
console.log(errs.length ? errs.slice(0, 8).join('\n') : '（无页面错误）');
await browser.close();
