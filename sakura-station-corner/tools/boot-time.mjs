// 启动墙钟：连续 N 次冷启动，到 window.__DIORAMA__.built === true 为止。
// 首次是冷启动（磁盘/着色器缓存空），默认丢弃后再报中位数与区间。
// node tools/boot-time.mjs [--url=http://127.0.0.1:4173/] [--runs=5] [--keep-first] [--w=800] [--h=500]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:4173/');
const RUNS = Number(arg('runs', 5));
const url = BASE + (BASE.includes('?') ? '&' : '?') + 'bootprobe=1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});

const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const rows = [];
for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext({ viewport: { width: Number(arg('w', 800)), height: Number(arg('h', 500)) } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(300000);
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
  const wall = (Date.now() - t0) / 1000;
  const parts = await page.evaluate(() => {
    const t = window.__DIORAMA__.timings || {};
    const i = window.__DIORAMA__.renderer.info;
    return { engine: t.engine, world: t.world, lod: t.lod, motion: t.motion, rm: t.motion_render, fr: t.motion_frames, geo: i.memory.geometries, tex: i.memory.textures, calls: i.render.calls, meshes: (() => { let k = 0; window.__DIORAMA__.scene.traverse((o) => { if (o.isMesh) k++; }); return k; })(), shape: window.__DIORAMA__.shapeStats?.meshes ?? 0 };
  });
  // built 只是「装配完」，还要等装配期间被跳过/限流的那一帧真正补上，用户才算看见成品
  await page.waitForFunction(`window.__DIORAMA__.frames > ${parts.fr || 0} + 1`, { polling: 100, timeout: 120000 });
  const vis = (Date.now() - t0) / 1000;
  rows.push({ wall, vis, ...parts });
  const d = (a, b) => (((a || 0) - (b || 0)) / 1000).toFixed(2);
  const rm = (parts.rm || 0) / 1000, fr = parts.fr || 0;
  console.log(`  #${i + 1}  到 built ${wall.toFixed(2)} s → 成帧 ${vis.toFixed(2)} s   engine ${((parts.engine || 0) / 1000).toFixed(2)} | world ${d(parts.world, parts.engine)} | lod ${d(parts.lod, parts.world)} | motion ${d(parts.motion, parts.lod)}   ← 装配期帧渲染 ${rm.toFixed(2)} s / ${fr} 帧（${fr ? Math.round(rm * 1000 / fr) : 0} ms/帧）`);
  await ctx.close();
}
const kept = arg('keep-first') ? rows : rows.slice(1);
const walls = kept.map((r) => r.wall);
const v = kept.map((r) => r.vis);
console.log(`\n丢弃首次冷启动后 ${kept.length} 次：到 built 中位 ${med(walls).toFixed(2)} s（区间 ${Math.min(...walls).toFixed(2)}–${Math.max(...walls).toFixed(2)}）｜成帧中位 ${med(v).toFixed(2)} s（区间 ${Math.min(...v).toFixed(2)}–${Math.max(...v).toFixed(2)}）`);
const last = rows[rows.length - 1];
console.log(`末次资源：几何 ${last.geo}，贴图 ${last.tex}，Mesh 绘制 ${last.calls}   场景 Mesh ${last.meshes}（形状归一命中 ${last.shape}）`);
await browser.close();
