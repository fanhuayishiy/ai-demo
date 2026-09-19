// 取景/台座越界体检：无头页面里量真实世界包围盒，报告任何伸出裁剪框的东西
// node tools/crop-check.mjs [--url=...] [--tol=0.06]
//
// 为什么必须无头量：应用内浏览器那个页面会跑旧代码，它的 evaluate 读数不可信。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const TOL = Number(arg('tol', 0.06));

const browser = await chromium.launch({
  channel: arg('channel', 'chrome'), headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message).split('\n')[0]));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const rep = await page.evaluate(({ tol }) => {
  const eng = window.__DIORAMA__;
  const THREE = eng.THREE;
  const world = eng.scene.getObjectByName('world');
  // markStatic 会关掉 matrixWorldAutoUpdate，three 的 updateMatrixWorld(force) 对这类
  // 节点直接跳过计算 → 必须手工自顶向下合成，否则量到的是恒等矩阵下的假包围盒。
  const compose = (o, parentWorld) => {
    if (o.matrixAutoUpdate) o.updateMatrix();
    if (parentWorld) o.matrixWorld.multiplyMatrices(parentWorld, o.matrix);
    else o.matrixWorld.copy(o.matrix);
    for (const c of o.children) compose(c, o.matrixWorld);
  };
  compose(world, null);

  const CROP = { x0: -17.0, x1: 8.0, z0: -17.6, z1: 12.0 };
  const PLATE = { x0: CROP.x0 - 0.9, x1: CROP.x1 + 0.9, z0: CROP.z0 - 0.9, z1: CROP.z1 + 0.9 };
  const box = () => new THREE.Box3(new THREE.Vector3(1e9, 1e9, 1e9), new THREE.Vector3(-1e9, -1e9, -1e9));
  const grow = (b, o) => {
    const g = o.geometry;
    if (!g) return false;
    if (o.isInstancedMesh && typeof o.computeBoundingBox === 'function') {
      o.computeBoundingBox();
      if (o.boundingBox) { b.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); return true; }
      return false;
    }
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingBox) return false;
    b.union(g.boundingBox.clone().applyMatrix4(o.matrixWorld));
    return true;
  };
  const over = (b, r) => Math.max(r.x0 - b.min.x, b.max.x - r.x1, r.z0 - b.min.z, b.max.z - r.z1);
  const outside = (b, r) => b.max.x < r.x0 || b.min.x > r.x1 || b.max.z < r.z0 || b.min.z > r.z1;
  const path = (o) => { const p = []; let q = o; while (q && q !== world) { p.unshift(q.name || q.type); q = q.parent; } return p.join('/'); };
  const r2 = (v) => +v.toFixed(2);

  // 1) 地图层：按模块给包围盒；再逐件挑出中心落在框外、或整体落在台座外的
  const modules = [];
  const strays = [];
  const offenders = [];
  for (const layer of ['map', 'assets']) {
    const node = world.getObjectByName(layer);
    if (!node) continue;
    for (const child of node.children) {
      const b = box();
      let n = 0;
      child.traverse((o) => { if (o.isMesh && grow(b, o)) n++; });
      if (!Number.isFinite(b.min.x) || b.min.x > b.max.x) continue;
      modules.push({ layer, name: child.name || '(unnamed)', n, x: [r2(b.min.x), r2(b.max.x)], z: [r2(b.min.z), r2(b.max.z)], overCrop: r2(over(b, CROP)), offPlate: outside(b, PLATE) });
      // 越框のモジュールは「どれがはみ出しているか」まで出す（座標指定で再実行する手間を省く）
      if (layer === 'map' && n > 2) {
        const ov = over(b, CROP);
        if (ov > tol) {
          const detail = [];
          child.traverse((o) => {
            if (!o.isMesh || !o.geometry) return;
            const mb = box();
            if (!grow(mb, o)) return;
            const d2 = over(mb, CROP);
            if (d2 > tol) {
              const c = mb.getCenter(new THREE.Vector3());
              detail.push({ name: path(o), over: r2(d2), at: [r2(c.x), r2(c.z)], size: [r2(mb.max.x - mb.min.x), r2(mb.max.z - mb.min.z)] });
            }
          });
          detail.sort((p, q) => q.over - p.over);
          for (const d of detail.slice(0, 6)) offenders.push({ mod: child.name, ...d });
        }
      }
    }
    if (layer !== 'map') continue;
    node.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const b = box();
      if (!grow(b, o)) return;
      const c = b.getCenter(new THREE.Vector3());
      const out = over(b, PLATE);
      if (out > tol || !Number.isFinite(out)) {
        strays.push({ at: [r2(c.x), r2(c.z)], over: r2(Math.max(0, out)), size: [r2(b.max.x - b.min.x), r2(b.max.z - b.min.z)], name: path(o) });
      }
    });
  }
  strays.sort((p, q) => q.over - p.over);
  return {
    modules,
    strays: strays.slice(0, 30),
    strayCount: strays.length,
    offenders,
    overflow: eng.overflow || null,
    missing: eng.missing || [],
    placed: eng.placedCount,
    clipped: (world.getObjectByName('map') || {}).userData?.clipped,
  };
}, { tol: TOL });

console.log(`placed=${rep.placed}  map 兜底摘除=${rep.clipped}  missing=${JSON.stringify(rep.missing)}`);
console.log('\n== 模块包围盒（x / z）==');
for (const m of rep.modules) {
  // baseplate 是台座本身：它按设计比裁剪框宽 0.9 m（草皮边带），不参与越框判定
  const flag = m.name === 'baseplate' ? '' : m.offPlate ? ' ✗ 悬在台座外' : m.overCrop > 0.06 ? ` ! 越框 ${m.overCrop}m` : '';
  console.log(`${m.layer.padEnd(7)} ${m.name.padEnd(20)} n=${String(m.n).padStart(5)}  x[${m.x[0]}, ${m.x[1]}]  z[${m.z[0]}, ${m.z[1]}]${flag}`);
}
console.log(`\n== 地图层伸出台座的散件 ${rep.strayCount} 件（列前 30）==`);
for (const s of rep.strays) console.log(`+${String(s.over).padEnd(6)} x=${s.at[0]} z=${s.at[1]}  footprint=${s.size[0]}×${s.size[1]}  ${s.name}`);
console.log('\n== 越框模块的元凶零件 ==');
for (const o of rep.offenders) console.log(`+${String(o.over).padEnd(6)} ${o.mod.padEnd(17)} x=${o.at[0]} z=${o.at[1]}  size=${o.size[0]}×${o.size[1]}  ${o.name}`);
console.log('\n== 资产层因越界被丢弃 ==');
if (!rep.overflow) console.log('（engine.overflow 未就绪）');
else for (const o of rep.overflow) console.log(`+${String(o.over).padEnd(6)} ${o.name}`);
if (errors.length) console.log('\npageerror:', errors.slice(0, 3));
await browser.close();
