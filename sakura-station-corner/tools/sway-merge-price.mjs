// 给「摆动件合并」定价：合并会把花冠批次合成横跨整棵树的大包围球，LOD 就再也剔不掉它们。
// 不用真去做蒙皮 —— 直接把所有摆动子树里的实例批次强制可见，量出「多画的那些三角形值多少毫秒」，
// 再和「少掉的提交值多少毫秒」（≈ 8.8 µs/次）对一下就知道这项工程划不划算。
// 用法：node tools/sway-merge-price.mjs [--views=hero,store]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEWS = arg('views', 'hero,store,interior').split(',').filter(Boolean);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const rows = await page.evaluate(async ({ views }) => {
  const e = window.__DIORAMA__;
  const world = e.scene.getObjectByName('world');
  const waitFrames = (ms) => new Promise((res) => { const t0 = performance.now(); const tick = () => (performance.now() - t0 > ms ? res() : requestAnimationFrame(tick)); requestAnimationFrame(tick); });
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const shot = () => {
    const t = [];
    for (let i = 0; i < 9; i++) { const t0 = performance.now(); e.renderer.render(e.scene, e.camera); t.push(performance.now() - t0); }
    return { ms: +med(t).toFixed(1), calls: e.renderer.info.render.calls, tris: e.renderer.info.render.triangles };
  };
  const inAnim = (o) => { for (let p = o; p && p !== world; p = p.parent) if (p.userData?.sway) return true; return false; };
  const out = [];
  for (const v of views) {
    e.setView(v);
    await waitFrames(1500);
    const base = shot();
    // 强制可见：把摆动子树里被 LOD 藏掉的实例批次全部点亮（＝合并后必然的结果）
    const flipped = [];
    world.traverse((o) => { if (o.isInstancedMesh && inAnim(o) && !o.visible) { flipped.push(o); o.visible = true; } });
    const forced = shot();
    for (const o of flipped) o.visible = false;
    out.push({ v, base, forced, flipped: flipped.length });
  }
  return out;
}, { views: VIEWS });

for (const r of rows) {
  const dMs = r.forced.ms - r.base.ms;
  const dTri = r.forced.tris - r.base.tris;
  console.log(`${r.v.padEnd(9)} 基线 ${String(r.base.calls).padStart(5)} calls / ${(r.base.tris / 1e6).toFixed(2)}M tris / ${r.base.ms} ms`
    + ` → 花冠全可见 ${String(r.base.calls + r.flipped).padStart(5)} calls / ${(r.forced.tris / 1e6).toFixed(2)}M tris / ${r.forced.ms} ms`
    + `   多画 ${dTri.toLocaleString('en')} 三角形 = ${dMs >= 0 ? '+' : ''}${dMs} ms（强制回来 ${r.flipped} 批）`);
}
console.log('\n判据：合并能省的提交 ≈ 782 次 × 8.8 µs ≈ 6.9 ms。上面「多画三角形的 ms」若接近或超过它，这项工程就是零和甚至倒贴。');
await browser.close();
