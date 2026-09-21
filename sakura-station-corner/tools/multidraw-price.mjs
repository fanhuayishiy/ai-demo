// 60 fps 这条路到底走不走得通：把「一次提交 11.6 µs」拆开，看 multi-draw 能压掉多少。
// 用法：node tools/multidraw-price.mjs [--n=3000] [--tris=1000]
//
// 前提（tools/draw-cost.mjs 实测）：hero 4492 次提交 / 55 ms = 12.2 µs/次；
// 摘掉全部贴图 0 ms、全场共用一个材质只省 3 ms —— 所以成本是「提交本身」，省材质/做图集都没肉。
// 剩下的可能只有两件：少提交（LOD 抬阈值 = 拿画面换），或者换提交方式（BatchedMesh 的
// WEBGL_multi_draw 把 N 次 JS→GL 穿越并成一次）。这个探针量的就是后者值多少倍。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const N = Number(arg('n', 3000));

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto('http://127.0.0.1:5173/?bootprobe=1', { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });

const res = await page.evaluate(async (N) => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const gl = e.renderer.getContext();
  const md = gl.getExtension('WEBGL_multi_draw');
  const rt = new THREE.WebGLRenderTarget(1600, 900);
  const cam = new THREE.OrthographicCamera(-40, 40, 22.5, -22.5, 0.1, 300);
  cam.position.set(0, 0, 60);
  const mat0 = new THREE.MeshBasicMaterial({ color: 0x88aacc });
  // 与真实场景同量级：平均每次提交约 1000 三角形
  const proto = new THREE.SphereGeometry(0.6, 28, 18);
  const triPer = proto.index.count / 3;
  const pos = [];
  const cols = Math.ceil(Math.sqrt(N));
  for (let i = 0; i < N; i++) pos.push(new THREE.Vector3(((i % cols) - cols / 2) * 1.35, Math.floor(i / cols) * -1.35 + 20, 0));

  const bench = (label, scene, callsHint) => {
    e.renderer.setRenderTarget(rt);
    e.renderer.render(scene, cam);                 // 热身
    const cpu = [], gpu = [];
    for (let k = 0; k < 7; k++) {
      const t = performance.now();
      e.renderer.info.reset();
      e.renderer.render(scene, cam);
      cpu.push(performance.now() - t);
      gl.finish();
      gpu.push(performance.now() - t);
    }
    e.renderer.setRenderTarget(null);
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const calls = e.renderer.info.render.calls;
    return { label, cpu: Math.round(med(cpu)), gpu: Math.round(med(gpu)), calls: callsHint ?? calls };
  };

  const mkScene = () => { const s = new THREE.Scene(); s.add(new THREE.AmbientLight(1, 1)); return s; };
  const out = { multiDraw: !!md, triPer, rows: [] };

  // 1) N 个独立 Mesh，共用 1 个材质
  let s = mkScene();
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(proto, mat0); m.position.copy(pos[i]); m.matrixAutoUpdate = false; s.add(m); }
  out.rows.push(bench('N 个独立 Mesh · 1 材质', s));

  // 2) N 个独立 Mesh，每两个换一次材质（贴近真实：2097 材质 / 4492 次绘制）
  s = mkScene();
  const mats = [];
  for (let i = 0; i < N; i += 2) mats.push(mat0.clone());
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(proto, mats[i >> 1]); m.position.copy(pos[i]); m.matrixAutoUpdate = false; s.add(m); }
  out.rows.push(bench('N 个独立 Mesh · N/2 材质', s));

  // 2b) 每份几何都是独立 buffer（真实场景：视锥内 2137 份不同几何 / 4187 次绘制）
  //     —— 这一档用来判断「12 µs/次」到底是提交本身，还是换 VAO / 换顶点缓冲
  s = mkScene();
  for (let i = 0; i < N; i++) {
    const g = proto.clone();
    g.attributes.position.array[0] += i * 1e-6;          // 让每份几何真的独立（否则可能被上游复用）
    const m = new THREE.Mesh(g, mat0);
    m.position.copy(pos[i]); m.matrixAutoUpdate = false; s.add(m);
  }
  out.rows.push(bench('N 个独立 Mesh · 各自几何 · 1 材质', s));

  // 2c) 各自几何 + 各自材质（真实场景的最坏组合）
  s = mkScene();
  for (let i = 0; i < N; i++) {
    const mm = mat0.clone(); mm.color.offsetHSL(0, 0, (i % 7) * 0.004);
    const m = new THREE.Mesh(proto.clone(), mm);
    m.position.copy(pos[i]); m.matrixAutoUpdate = false; s.add(m);
  }
  out.rows.push(bench('N 个独立 Mesh · 各自几何 · 各自材质', s));

  // 2d) 各自几何 + **属性布局各不相同**：真实场景有 2137 份不同几何、若干种 attribute 组合，
  //     D3D11 侧每次换布局都要重设 vertex input layout —— 这一档查的是「布局切换」值多少钱。
  s = mkScene();
  const layouts = [];
  for (let v = 0; v < 4; v++) {
    const g = proto.clone();
    if (v & 1) g.setAttribute('uv2', g.attributes.uv.clone());
    if (v & 2) g.setAttribute('aExtra', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    layouts.push(g);
  }
  for (let i = 0; i < N; i++) {
    const g = layouts[i & 3].clone();
    g.attributes.position.array[0] += i * 1e-6;
    const m = new THREE.Mesh(g, mat0);
    m.position.copy(pos[i]); m.matrixAutoUpdate = false; s.add(m);
  }
  out.rows.push(bench('N 个独立 Mesh · 4 种属性布局交替', s));

  // 3) 一个 BatchedMesh 装下 N 份几何（走 multiDrawElementsWEBGL）
  const bm = new THREE.BatchedMesh(N, N * proto.attributes.position.count, N * proto.index.count, mat0);
  for (let i = 0; i < N; i++) {
    const gid = bm.addGeometry(proto);
    const iid = bm.addInstance(gid);
    bm.setMatrixAt(iid, new THREE.Matrix4().makeTranslation(pos[i].x, pos[i].y, 0));
  }
  s = mkScene(); s.add(bm);
  out.rows.push(bench('1 个 BatchedMesh（multi-draw）', s, 1));

  // 4) 20 个 BatchedMesh，每个 150 份 —— 真实场景里材质把批次天然切开
  const per = Math.ceil(N / 20), parts = [];
  s = mkScene();
  for (let b = 0; b < 20; b++) {
    const g = new THREE.BatchedMesh(per, per * proto.attributes.position.count, per * proto.index.count, mat0);
    for (let i = 0; i < per; i++) {
      const gid = g.addGeometry(proto);
      const iid = g.addInstance(gid);
      g.setMatrixAt(iid, new THREE.Matrix4().makeTranslation(pos[b * per + i].x, pos[b * per + i].y, 0));
    }
    s.add(g); parts.push(g);
  }
  out.rows.push(bench('20 个 BatchedMesh × 150', s, 20));

  // 5) 参照地板：InstancedMesh（同几何 N 实例 = 1 次提交）
  const im = new THREE.InstancedMesh(proto, mat0, N);
  for (let i = 0; i < N; i++) im.setMatrixAt(i, new THREE.Matrix4().makeTranslation(pos[i].x, pos[i].y, 0));
  im.instanceMatrix.needsUpdate = true;
  s = mkScene(); s.add(im);
  out.rows.push(bench('1 个 InstancedMesh（地板价）', s, 1));
  rt.dispose();
  return out;
}, N);
await browser.close();

console.log(`WEBGL_multi_draw：${res.multiDraw ? '可用' : '不可用（那 BatchedMesh 会退化成逐批 _gl_DrawID 循环，等于没省）'}   每份几何 ${Math.round(res.triPer)} 三角形`);
for (const r of res.rows) {
  console.log(`  ${r.label.padEnd(38)} ${String(r.calls).padStart(5)} 次提交  CPU ${String(r.cpu).padStart(4)} ms  GPU(含提交) ${String(r.gpu).padStart(4)} ms   ${(r.cpu * 1000 / Math.max(1, r.calls)).toFixed(1)} µs/次`);
}
