// 真实场景的帧时间模型：ms ≈ a·提交数 + b·三角形数 + c。
// 用法：node tools/frame-anatomy.mjs [--view=hero] [--frames=10] [--px=6,12,26,45,80,150,300]
//
// 为什么要拟合而不是单点：老结论「是 draw-call bound」来自「降分辨率几乎不省」，
// 但**降分辨率只证明它不是片元 bound —— 顶点处理与分辨率无关**。5M 三角形/帧这件事
// 从来没人单独量过。用 LOD 阈值在同一份画面上采出 7 个 (提交数, 三角形数, 毫秒) 点，
// 最小二乘解出每次提交与每个三角形各值多少，才知道 60 fps 该砍哪一头。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/?bootprobe=1'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(2500);

const rows = await page.evaluate(({ frames, pxList }) => {
  const e = window.__DIORAMA__, R = e.renderer;
  const gl = R.getContext();
  const rt = new e.THREE.WebGLRenderTarget(1600, 900);
  R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = false;
  R.setRenderTarget(rt);
  const out = [];
  for (const px of pxList) {
    e.lod.setThresholds({ pxThreshold: px });
    e.step(1 / 60, 6);                                   // 剔除跑在 updaters 里，必须走一帧才会生效
    R.setRenderTarget(rt);
    const once = () => {
      const t = performance.now();
      R.render(e.scene, e.camera);
      gl.finish();
      return performance.now() - t;
    };
    once();                                              // 热身
    const real = [];
    for (let k = 0; k < frames; k++) real.push(once());
    const calls = R.info.render.calls, tris = R.info.render.triangles;
    // 同一批提交、同一批三角形，只把着色换成最便宜的 → 剩下的就是「提交 + 顶点 + 光栅」
    const basic = new e.THREE.MeshBasicMaterial();
    e.scene.overrideMaterial = basic;
    once();
    const flat = [];
    for (let k = 0; k < frames; k++) flat.push(once());
    e.scene.overrideMaterial = null;
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    out.push({ px, ms: Math.round(med(real)), shade: Math.round(med(flat)), calls, tris });
  }
  R.setRenderTarget(null);
  rt.dispose();
  e.lod.setThresholds({ pxThreshold: 26 });
  return out;
}, { frames: Number(arg('frames', 10)), pxList: arg('px', '6,12,26,45,80,150,300').split(',').map(Number) });
await browser.close();

console.log('  px阈值   毫秒   其中着色   提交数    三角形/帧');
for (const r of rows) console.log(`  ${String(r.px).padStart(5)} ${String(r.ms).padStart(7)} ${String(r.ms - r.shade).padStart(10)} ${String(r.calls).padStart(8)} ${String((r.tris / 1e6).toFixed(2) + 'M').padStart(10)}`);
// 最小二乘拟合 ms = a·calls + b·tris + c（3×3 正规方程 + 高斯消元）
const X = rows.map((r) => [r.calls, r.tris, 1]), Y = rows.map((r) => r.ms);
const AtA = [0, 1, 2].map((i) => [0, 1, 2].map((j) => X.reduce((s, x) => s + x[i] * x[j], 0)));
const AtY = [0, 1, 2].map((i) => X.reduce((s, x, k) => s + x[i] * Y[k], 0));
const M = AtA.map((row, i) => [...row, AtY[i]]);
for (let i = 0; i < 3; i++) {
  const p = M.slice(i).reduce((a, b) => (Math.abs(b[0]) > Math.abs(a[0]) ? b : a));
  M.splice(i, 0, M.splice(M.indexOf(p), 1)[0]);
  for (let r = 0; r < 3; r++) { if (r === i) continue; const f = M[r][i] / M[i][i]; for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c]; }
}
const [a, b, c] = M.map((r, i) => r[3] / r[i]);
console.log(`\n  拟合：ms ≈ ${(a * 1e3).toFixed(2)} µs/次提交 + ${(b * 1e6).toFixed(2)} ms/百万三角形 + ${c.toFixed(1)} ms 固定项`);
for (const r of rows) {
  const pred = a * r.calls + b * r.tris + c;
  console.log(`    px=${String(r.px).padStart(3)} 实测 ${String(r.ms).padStart(3)} ms 预测 ${pred.toFixed(1)} ms   提交占 ${(a * r.calls).toFixed(1)}｜三角形占 ${(b * r.tris).toFixed(1)}｜残差 ${(r.ms - pred).toFixed(1)}`);
}
const target = 16.6;
console.log(`\n  60 fps 预算 ${target} ms：按当前 px=26 的 ${(a * rows.find((r) => r.px === 26)?.calls || 0).toFixed(1)} ms 提交 + ${(b * (rows.find((r) => r.px === 26)?.tris || 0)).toFixed(1)} ms 三角形，缺口要砍哪头看上面两行的比例。`);
