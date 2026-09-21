// 「抬阈值到底藏掉了什么」按资产对账：同一机位、两个阈值（各自独立启动一次），列出可绘制件数差。
// 用法：node tools/lod-where.mjs [--views=hero] [--a=26] [--b=90]
//
// 为什么要它：全局像素阈值是把钝刀 —— 它既砍掉螺栓、标签、碎石这类「多而无所谓」的件，
// 也砍掉招牌字、灯头、自行车车架这类「少但定义画面」的件。要挑出「值得单独留低阈值」的资产，
// 必须先看到每个资产各交出多少次提交。
// 两档各自开一次页面：运行时改 setThresholds 在这条链上不可靠（滞回与 acc 的时序），
// 而 ?lodpx= 是装配期就生效的真路径 —— 测的东西必须和用户看到的一致。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});

const snap = async (px, view) => {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  page.setDefaultTimeout(300000);
  await page.goto(`http://127.0.0.1:5173/?bootprobe=1&lodpx=${px}`, { waitUntil: 'commit' });
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
  const rows = await page.evaluate((v) => {
    const e = window.__DIORAMA__, THREE = e.THREE;
    e.setView(v);
    e.pause(true); e.step(1 / 60, 12); e.pause(false);            // 让 LOD 至少跑两遍（滞回收敛）
    const cam = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
    const byAsset = new Map();
    e.scene.updateMatrixWorld();
    e.scene.traverse((o) => {
      if (!o.isMesh) return;
      let vis = o.visible;
      for (let p = o.parent; p && vis; p = p.parent) vis = vis && p.visible;
      if (!vis) return;
      const g = o.geometry;
      if (!g) return;
      if (!g.boundingSphere) g.computeBoundingSphere();
      if (!cam.intersectsSphere(g.boundingSphere.clone().applyMatrix4(o.matrixWorld))) return;
      let a = o;
      while (a.parent && !/^(assets|map|world)$/.test(a.parent.name || '')) a = a.parent;
      const name = a.name || '(anon)';
      byAsset.set(name, (byAsset.get(name) || 0) + 1);
    });
    return { rows: [...byAsset], px: e.quality.lodPx, calls: e.renderer.info.render.calls };
  }, view);
  await page.context().close();
  return rows;
};

for (const view of arg('views', 'hero').split(',')) {
  const A = await snap(arg('a', 26), view);
  const B = await snap(arg('b', 90), view);
  if (A.px === B.px) console.log(`  !! 两档阈值读出来一样（A=${A.px} B=${B.px}），?lodpx 没生效，别信下面的表`);
  const ma = new Map(A.rows), mb = new Map(B.rows);
  const diffs = [...new Set([...ma.keys(), ...mb.keys()])]
    .map((k) => [k, ma.get(k) || 0, mb.get(k) || 0])
    .filter((r) => r[1] !== r[2])
    .sort((x, y) => (y[1] - y[2]) - (x[1] - x[2]));
  const tot = diffs.reduce((a, r) => a + r[1] - r[2], 0);
  console.log(`\n  ${view}：${arg('a', 26)} → ${arg('b', 90)} px，共少画 ${tot} 次（视锥内），涉及 ${diffs.length} 个资产`);
  for (const [k, a, b] of diffs.slice(0, 30)) console.log(`    ${k.padEnd(26)} ${String(a).padStart(5)} → ${String(b).padStart(5)}   少 ${a - b}`);
}
await browser.close();
