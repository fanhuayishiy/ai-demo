// 装配体检：node tools/audit.mjs —— 逐个资产实例算世界包围盒，找悬浮/陷入/NaN/越界/异常尺度
import { chromium } from 'playwright';
const url = process.argv.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5173/';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0]));
p.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text().split('\n')[0]);
});
p.setDefaultTimeout(300000);
await p.goto(url, { waitUntil: 'commit', timeout: 300000 });
await p.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.ready === true', { timeout: 180000 });
await p.waitForTimeout(3000);

const report = await p.evaluate(() => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const world = e.scene.getObjectByName('world');
  const assets = world && world.getObjectByName('assets');
  const out = { missing: e.missing || [], assets: 0, float: [], sink: [], nan: [], huge: [], hulls: 0, meshes: 0, tris: 0 };
  if (!assets) return { ...out, noAssets: true };
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  for (const child of assets.children) {
    out.assets++;
    box.makeEmpty();
    let bad = false;
    child.traverse((n) => {
      if (n.isMesh) {
        out.meshes++;
        if (n.userData.isHull) out.hulls++;
        if (!isFinite(n.position.x + n.position.y + n.position.z)) bad = true;
        if (n.geometry && n.geometry.attributes.position) out.tris += (n.geometry.index ? n.geometry.index.count : n.geometry.attributes.position.count) / 3;
      }
    });
    if (bad) {
      out.nan.push(child.name);
      continue;
    }
    try {
      child.updateMatrixWorld(true);
      box.setFromObject(child);
    } catch {
      out.nan.push(child.name + ' (bbox)');
      continue;
    }
    if (!isFinite(box.min.y) || box.isEmpty()) {
      out.nan.push(child.name + ' (empty)');
      continue;
    }
    const size = box.getSize(new THREE.Vector3());
    if (size.x > 20 || size.y > 12 || size.z > 20) out.huge.push(`${child.name} ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)}`);
    if (box.min.y < -0.06) out.sink.push(`${child.name} minY=${box.min.y.toFixed(3)} y0=${child.position.y.toFixed(2)}`);
    if (box.min.y > 0.42 && child.position.y < 0.05) out.float.push(`${child.name} minY=${box.min.y.toFixed(2)}`);
    if (Math.abs(child.position.x) > 19.2 || Math.abs(child.position.z) > 19.2) out.huge.push(child.name + ' 出界');
  }
  return out;
});

console.log('资产实例:', report.assets, ' 网格:', report.meshes, ' 描边壳:', report.hulls, ' 三角面:', Math.round(report.tris));
if (report.missing && report.missing.length) console.log('\n未交付模块 (' + report.missing.length + '):\n  ' + report.missing.join('\n  '));
for (const [k, label] of [['sink', '陷入地面'], ['float', '疑似悬浮'], ['nan', '坐标/包围盒异常'], ['huge', '尺度或边界异常']]) {
  const v = report[k] || [];
  if (v.length) {
    console.log(`\n${label} (${v.length}):`);
    for (const x of v.slice(0, 40)) console.log('  ·', x);
  }
}
if (errs.length) {
  console.log('\n页面错误 (' + new Set(errs).size + ' unique):');
  for (const x of [...new Set(errs)].slice(0, 12)) console.log('  x', x.slice(0, 180));
}
await b.close();
