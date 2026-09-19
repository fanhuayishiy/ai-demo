// LOD 阈值扫描：pxThreshold 从 18 往上抬，看可见对象数与 renderer.render 怎么掉。
// 用法：node tools/lod-sweep.mjs [--views=hero,store] [--t=18,24,30,40]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEWS = arg('views', 'hero,store').split(',');
const T = arg('t', '18,24,30,40').split(',').map(Number);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const out = await page.evaluate(async ({ views, ts }) => {
  const e = window.__DIORAMA__;
  const wait = (ms) => new Promise((r) => { const t0 = performance.now(); const k = () => (performance.now() - t0 > ms ? r() : requestAnimationFrame(k)); requestAnimationFrame(k); });
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const rows = [];
  for (const v of views) {
    e.setView(v);
    await wait(1400);
    for (const t of ts) {
      e.lod.ranges.pxThreshold = t;
      e.lod.set(false); e.lod.set(true);       // 逼一次重算
      await wait(700);
      let vis = 0;
      e.scene.traverse((o) => {
        if (!o.isMesh) return;
        let vv = o.visible;
        for (let p = o.parent; vv && p; p = p.parent) vv = vv && p.visible;
        if (vv) vis++;
      });
      const t2 = [];
      for (let i = 0; i < 8; i++) { const a = performance.now(); e.renderer.render(e.scene, e.camera); t2.push(performance.now() - a); }
      rows.push({ view: v, t, vis, ms: +med(t2).toFixed(1), calls: e.renderer.info.render.calls });
    }
  }
  return rows;
}, { views: VIEWS, ts: T });

console.log('view      pxThreshold  可见Mesh  renderer.render  calls');
for (const r of out) console.log(`${r.view.padEnd(10)} ${String(r.t).padStart(4)}        ${String(r.vis).padStart(6)}   ${String(r.ms).padStart(6)} ms     ${r.calls}`);
await browser.close();
