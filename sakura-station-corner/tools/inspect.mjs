// 装配体检工具：dump 每个资产实例的世界包围盒 / 网格数，用于定位错位的资产
// node tools/inspect.mjs [--url=...] [--filter=substr] [--sort=vol]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const FILTER = arg('filter', '');
const SORT = arg('sort', 'vol');
const DEEP = arg('deep', '');
/** --in=x0,x1,z0,z1 : その矩形領域に中心が入るメッシュを全レイヤーから列挙（雑物の正体特定用） */
const IN = arg('in', '');

const browser = await chromium.launch({
  channel: arg('channel', 'chrome'), headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 200000, polling: 500 });

const rows = await page.evaluate(({ filter, deep, inBox }) => {
  const THREE = window.__DIORAMA__.THREE;
  const out = [];
  const scene = window.__DIORAMA__.scene;
  const root = window.__DIORAMA__.assetsGroup || scene;
  const worldRoot = root.parent || scene;
  // markStatic 会关掉 matrixWorldAutoUpdate，three 的 updateMatrixWorld(force) 对这类
  // 节点直接跳过计算 → 必须手工自顶向下合成，否则量到的是恒等矩阵下的假包围盒。
  // ただし matrixAutoUpdate===false のノード（描边壳は matrix へ直接書き込む）の
  // updateMatrix() を呼ぶと position 既定値で matrix が上書きされ、位置が飛ぶ。
  const compose = (o, parentWorld) => {
    if (o.matrixAutoUpdate) o.updateMatrix();
    if (parentWorld) o.matrixWorld.multiplyMatrices(parentWorld, o.matrix);
    else o.matrixWorld.copy(o.matrix);
    for (const c of o.children) compose(c, o.matrixWorld);
  };
  compose(root, null);
  if (inBox) {
    compose(worldRoot, null);
    const [x0, x1, z0, z1] = inBox;
    const path = (o) => { const p = []; let q = o; while (q) { p.unshift(q.name || q.type); q = q.parent; } return p.join('/'); };
    const acc = new Map();
    worldRoot.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const gg = o.geometry;
      if (!gg.boundingBox) gg.computeBoundingBox();
      const b = new THREE.Box3().copy(gg.boundingBox).applyMatrix4(o.matrixWorld);
      if (!isFinite(b.min.x)) return;
      const ct = b.getCenter(new THREE.Vector3());
      if (ct.x < x0 || ct.x > x1 || ct.z < z0 || ct.z > z1) return;
      // 資産インスタンス単位（world/assets/<name> または world/map/<name>）で寄せる
      let a = o;
      while (a.parent && a.parent !== worldRoot && !['assets', 'map'].includes(a.parent.name)) a = a.parent;
      const key = (a.parent ? a.parent.name + '/' : '') + a.name;
      const sz = b.getSize(new THREE.Vector3());
      const e = acc.get(key) || { n: 0, maxExt: 0, y0: 1e9, y1: -1e9 };
      e.n++; e.maxExt = Math.max(e.maxExt, Math.max(sz.x, sz.y, sz.z));
      e.y0 = Math.min(e.y0, b.min.y); e.y1 = Math.max(e.y1, b.max.y);
      acc.set(key, e);
    });
    for (const [k, e] of acc) {
      out.push({ name: k, size: [e.n, +e.maxExt.toFixed(2), 0], min: [+e.y0.toFixed(2), +e.y1.toFixed(2), 0], max: [0, 0, 0], vol: e.n, mesh: e.n });
    }
    return out;
  }
  for (const child of root.children) {
    if (filter && !child.name.includes(filter)) continue;
    if (deep) {
      // 深扫：資産ローカル座標で「Envelope を超えた零件」を上位 N 件出す（誤配置の特定位定）
      const path = (o) => { const p = []; let q = o; while (q && q !== child) { p.unshift(q.name || q.type); q = q.parent; } return p.join('/'); };
      const inv = new THREE.Matrix4().copy(child.matrixWorld).invert();
      child.traverse((o) => {
        if (!o.isMesh || !o.geometry || o.isInstancedMesh) return;
        const gg = o.geometry;
        if (!gg.boundingBox) gg.computeBoundingBox();
        const b = new THREE.Box3().copy(gg.boundingBox).applyMatrix4(o.matrixWorld);
        if (!isFinite(b.min.x)) return;
        const ct = b.getCenter(new THREE.Vector3()).applyMatrix4(inv);
        const sz = b.getSize(new THREE.Vector3());
        out.push({
          name: path(o),
          size: [sz.x, sz.y, sz.z].map((v) => +v.toFixed(2)),
          min: [ct.x, ct.y, ct.z].map((v) => +v.toFixed(2)),
          max: [0, 0, 0], vol: Math.max(Math.abs(ct.x), Math.abs(ct.y), Math.abs(ct.z)), mesh: 0,
        });
      });
      continue;
    }
    const bb = new THREE.Box3();
    child.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (o.isInstancedMesh && typeof o.computeBoundingBox === 'function') {
        // InstancedMesh は既定の bbox が「1 個分」にしかならないので実体分を広げる
        o.computeBoundingBox();
        if (o.boundingBox) { bb.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); return; }
      }
      const gg = o.geometry;
      if (!gg.boundingBox) gg.computeBoundingBox();
      bb.union(new THREE.Box3().copy(gg.boundingBox).applyMatrix4(o.matrixWorld));
    });
    if (!isFinite(bb.min.x)) continue;
    const size = bb.getSize(new THREE.Vector3());
    let mesh = 0; child.traverse((o) => { if (o.isMesh) mesh++; });
    const rec = {
      name: child.name || '(unnamed)',
      min: [bb.min.x, bb.min.y, bb.min.z].map((v) => +v.toFixed(2)),
      max: [bb.max.x, bb.max.y, bb.max.z].map((v) => +v.toFixed(2)),
      size: [size.x, size.y, size.z].map((v) => +v.toFixed(2)),
      vol: +(size.x * size.y * size.z).toFixed(1),
      mesh,
    };
    if (!filter || rec.name.includes(filter)) out.push(rec);
  }
  return out;
}, { filter: FILTER, deep: DEEP, inBox: IN ? IN.split(',').map(Number) : null });

rows.sort((a, b) => b.vol - a.vol);
const list = (DEEP || IN) ? rows.slice(0, 40) : rows;
console.log((DEEP || IN ? 'path' : 'name').padEnd(46), 'size/n'.padEnd(24), 'y-range / center'.padEnd(24), 'sortKey');
for (const r of list) {
  console.log(r.name.padEnd(46), JSON.stringify(r.size).padEnd(24), JSON.stringify(r.min).padEnd(24), r.vol);
}
console.log('total', rows.length, DEEP || IN ? 'rows (top 40 shown)' : 'instances');
await browser.close();
