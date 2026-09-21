// 交互态帧率探针：真实派发 pointer 事件持续拖拽相机，统计 fps 与总 draw calls。
// 与 shoot.mjs 的区别：不做任何 readPixels / screenshot（那些会把 GPU 拖慢），
// 也不在视角切换后的阻尼余震里取样 —— 只测「手按着鼠标一直转」的稳定交互态。
// 用法：node tools/perf.mjs [--seconds=8] [--w=1600] [--h=900]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const W = Number(arg('w', 1600)), H = Number(arg('h', 900));
const SECONDS = Number(arg('seconds', 8));
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
page.setDefaultTimeout(280000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 240000, polling: 500 });

// 关掉自动重置，自己每帧复位一次，才能拿到「整条后期链 + 场景」的总 draw call
await page.evaluate(() => {
  const e = window.__DIORAMA__;
  e.renderer.info.autoReset = false;
  window.__probe = { frames: 0, calls: 0, tris: 0, t0: performance.now(), samples: [], running: true };
  const tick = () => {
    const p = window.__probe;
    if (!p.running) return;
    p.calls = e.renderer.info.render.calls;
    p.tris = e.renderer.info.render.triangles;
    e.renderer.info.reset();
    p.frames++;
    const el = performance.now() - p.t0;
    if (el >= 500) {
      // 只在采样点遍历，避免探针自身污染被测帧率
      let vis = 0, tot = 0;
      e.scene.traverse((o) => { if (o.isMesh) { tot++; if (o.visible) vis++; } });
      p.samples.push({ ms: Math.round(el), fps: +((p.frames / el) * 1000).toFixed(1), calls: p.calls, tris: p.tris, vis, tot });
      p.frames = 0; p.t0 = performance.now();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// 真实拖拽：按下左键来回横扫，模拟用户「移动看一下」
const y = Math.round(H * 0.5);
await page.mouse.move(Math.round(W * 0.5), y);
await page.mouse.down();
const t1 = Date.now();
let dir = 1;
while (Date.now() - t1 < SECONDS * 1000) {
  for (let s = 0; s < 24; s++) { await page.mouse.move(Math.round(W * 0.5) + dir * s * 14, y); }
  dir *= -1;
}
await page.mouse.up();

const res = await page.evaluate(() => { window.__probe.running = false; return window.__probe.samples; });
const fps = res.map((r) => r.fps);
const avg = (a) => a.reduce((x, y2) => x + y2, 0) / a.length;
console.log(`视口 ${W}x${H}  持续拖拽 ${SECONDS}s  采样 ${res.length} 段`);
console.log('fps 逐段 :', fps.join(' '));
console.log(`fps 最低 ${Math.min(...fps)} | 中位 ${fps.slice().sort((a, b) => a - b)[fps.length >> 1]} | 平均 ${avg(fps).toFixed(1)} | 最高 ${Math.max(...fps)}`);
console.log('draw calls/帧 :', res.map((r) => r.calls).slice(-6).join(' '));
console.log('triangles/帧  :', res.map((r) => (r.tris / 1e6).toFixed(1) + 'M').slice(-6).join(' '));
console.log('可见 Mesh/总数 :', res.slice(-3).map((r) => `${r.vis}/${r.tot}`).join('  '));
await browser.close();
