// 每次提交的 11.5 µs 到底花在哪：绘制本身 / 材质换绑 / 贴图绑定 / 程序切换。
// 用法：node tools/draw-cost.mjs [--view=hero] [--url=...] [--frames=24]
//
// 手法：同一份场景、同一批几何、同样的绘制次数，只换掉「状态」这一维：
//   A 基线
//   C 所有材质的 map / normalMap 摘掉（材质对象不变、绘制次数不变）→ 只省掉贴图绑定
//   B 全部网格共用 1 个材质（绘制次数不变）→ 状态切换的下界，也就是「纯提交」的地板价
// 三者相减就能判断「省材质」这条路有没有肉，而不是先验地去做图集。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const url = BASE + (BASE.includes('?') ? '&' : '?') + 'bootprobe=1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(2500);

const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const measure = (label, mutate) => page.evaluate(({ label, frames, mutateSrc }) => {
  const medn = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const e = window.__DIORAMA__;
  if (mutateSrc) new Function('e', mutateSrc)(e);
  e.pause(true);
  e.step(1 / 60, 8);                                   // 热身
  const n = e.frameLog.length;
  e.step(1 / 60, frames);
  const rows = e.frameLog.slice(n);
  e.pause(false);
  const ms = rows.map((r) => r.ms);
  let mesh = 0; const mats = new Set();
  e.scene.traverse((o) => { if (o.isMesh && o.visible) { mesh++; mats.add(o.material); } });
  return { label, med: medn(ms), max: Math.max(...ms), calls: medn(rows.map((r) => r.c)), tris: medn(rows.map((r) => r.tr || 0)), mats: mats.size, mesh };
}, { label, frames: Number(arg('frames', 24)), mutate });

const arms = [
  ['A 基线', ''],
  ['C 摘掉全部 map/normalMap', `
    const seen = new Set();
    e.scene.traverse((o) => { if (!o.isMesh) return; const m = o.material; if (seen.has(m.uuid)) continue; seen.add(m.uuid);
      if (m.map) { m.map = null; m.needsUpdate = true; } if (m.normalMap) { m.normalMap = null; m.needsUpdate = true; } });`],
  ['B 全场共用 1 个材质', `
    const cnt = new Map();
    e.scene.traverse((o) => { if (o.isMesh && !o.material.transparent) cnt.set(o.material, (cnt.get(o.material) || 0) + 1); });
    const one = [...cnt].sort((a, b) => b[1] - a[1])[0][0];   // 用出现最多的那个，不 clone：clone 会丢 onBeforeCompile
    e.scene.traverse((o) => { if (o.isMesh && !o.material.transparent) o.material = one; });`],
];
const out = [];
for (const [label, src] of arms) { out.push(await measure(label, src)); await page.waitForTimeout(800); }
await browser.close();
const base = out[0];
for (const r of out) {
  const us = (r.med * 1000) / r.calls;
  console.log(`  ${r.label.padEnd(22)} 帧 ${String(Math.round(r.med)).padStart(4)} ms｜${String(r.calls).padStart(4)} 次提交｜${us.toFixed(1).padStart(4)} µs/次｜材质 ${String(r.mats).padStart(4)}｜比基线 ${(r.med - base.med).toFixed(1)} ms`);
}
console.log(`  解读：B 是「状态全不换」的地板价；A−B 就是材质/纹理换绑的总成本，也就是「省材质」这条路的全部上限。`);
