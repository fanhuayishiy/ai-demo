// 店内占位与穿模检查：把 assets 下每个资产的世界包围盒打出来，并两两比对同一高度带里的重叠。
// 为什么不用 real 字段算：资产的 bbox 会把台车、杂物、堆叠的プラコン一起算进去
// （backroom-shelving 标称 2.72×2.24×1.76，实测含台车与清扫具是 2.11×1.74 的净占位），
// 而且 rotY 会交换 x/z。只有量世界包围盒才知道真正占了什么位置。
//   node tools/floor-plan.mjs [--url=]
// 一次性：把店内每个资产的世界占位打出来，用来判断入口动线被谁占了
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage();
p.setDefaultTimeout(300000);
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await p.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 300, timeout: 300000 });
const rows = await p.evaluate(() => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const bb = new THREE.Box3(), tmp = new THREE.Box3();
  const assets = e.scene.getObjectByName('assets');
  const out = [];
  for (const c of assets.children) {
    if (!c.name) continue;
    bb.makeEmpty();
    c.updateMatrixWorld(true);
    c.traverse((m) => {
      if (!m.isMesh && !m.isInstancedMesh) return;
      tmp.setFromObject(m);
      if (tmp.min.x === Infinity) return;
      bb.union(tmp);
    });
    if (bb.isEmpty()) continue;
    if (bb.max.x < -11.6 || bb.min.x > -1.6 || bb.max.z < -1.1 || bb.min.z > 5.1) continue;
    out.push({ n: c.name, x: [+bb.min.x.toFixed(2), +bb.max.x.toFixed(2)], z: [+bb.min.z.toFixed(2), +bb.max.z.toFixed(2)], y: +bb.max.y.toFixed(2), y0: +bb.min.y.toFixed(2) });
  }
  return out.filter((r) => r.x);
});
console.log('店 x[-11.3,-1.9] z[-0.8,4.8]  门 x[-7.84,-5.36] z=4.69');
if (!Array.isArray(rows)) { console.log('RAW:', JSON.stringify(rows).slice(0, 600)); }
else {
  for (const r of rows.slice().sort((q, w) => w.z[0] - q.z[0])) console.log(`${r.n.padEnd(16)} x[${String(r.x[0]).padStart(6)},${String(r.x[1]).padStart(6)}] z[${String(r.z[0]).padStart(6)},${String(r.z[1]).padStart(6)}] 顶高${r.y}`);
  // 两两重叠（>4 cm 见方才算，贴边不算穿模）
  const ov = [];
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i], b2 = rows[j];
    const ix = Math.min(a.x[1], b2.x[1]) - Math.max(a.x[0], b2.x[0]);
    const iz = Math.min(a.z[1], b2.z[1]) - Math.max(a.z[0], b2.z[0]);
    // 只有在**同一高度带里真的占着空间**才算穿模：吊顶灯、地贴、POP 立牌都不算
    const iy = Math.min(a.y, b2.y) - Math.max(a.y0, b2.y0);
    if (iy <= 0.05) continue;
    if (Math.max(a.y - a.y0, b2.y - b2.y0) > 2.5) continue;   // 整店级容器（in-shell / in-ceiling / store）
    if (ix > 0.04 && iz > 0.04) ov.push(`${a.n} × ${b2.n}  重叠 ${ix.toFixed(2)}×${iz.toFixed(2)} m（竖向 ${iy.toFixed(2)}）`);
  }
  console.log(ov.length ? '穿模:\n  ' + ov.join('\n  ') : '无两两穿模 ✓');
}
await b.close();
