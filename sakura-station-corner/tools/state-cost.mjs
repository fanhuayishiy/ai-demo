// 状态抖动探针：数「一帧里有多少种材质 / 多少个着色器程序 / 排序后还有多少次材质切换」。
// 用法：node tools/state-cost.mjs [--view=hero]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(1500);

console.log(await page.evaluate(() => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const cam = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
  const list = [];
  e.scene.updateMatrixWorld();
  e.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    let v = o.visible;
    for (let p = o.parent; v && p; p = p.parent) v = v && p.visible;
    if (!v) return;
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    if (!cam.intersectsSphere(g.boundingSphere.clone().applyMatrix4(o.matrixWorld))) return;
    list.push(o);
  });
  const mats = new Map(), geos = new Set();
  for (const o of list) {
    mats.set(o.material, (mats.get(o.material) || 0) + 1);
    geos.add(o.geometry.uuid);
  }
  // three 的 painterSortStable：groupOrder → renderOrder → material.id → z → id
  const sorted = list.slice().sort((a, b) => {
    if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
    return a.material.id - b.material.id;
  });
  let switches = 0, progSwitches = 0;
  const progs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i].material;
    if (i && sorted[i - 1].material !== m) switches++;
    const pk = `${m.type}|${!!m.map}|${!!m.normalMap}|${!!m.alphaMap}|${m.side}|${m.transparent ? 1 : 0}|${m.vertexColors ? 1 : 0}|${!!m.gradientMap}|${m.blending}`;
    progs.add(pk);
    if (i && sorted[i - 1].pk !== pk) { /* noop */ }
  }
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1].material, b = sorted[i].material;
    const k = (m) => `${m.type}|${!!m.map}|${!!m.normalMap}|${!!m.alphaMap}|${m.side}|${m.transparent ? 1 : 0}|${m.vertexColors ? 1 : 0}`;
    if (k(a) !== k(b)) progSwitches++;
  }
  const perMat = [...mats.values()].sort((x, y) => y - x);
  return [
    `视锥内可绘制 ${list.length}   不同材质 ${mats.size}   不同几何 ${geos.size}   着色器变体 ${progs.size}`,
    `按 three 的排序后：材质切换 ${switches} 次（${(switches / list.length * 100).toFixed(0)}% 的绘制换材质）、程序切换 ${progSwitches} 次`,
    `每个材质平均 ${ (list.length / mats.size).toFixed(1) } 次绘制；最多的几个：${perMat.slice(0, 6).join(', ')} 次`,
    `renderer.info.programs = ${e.renderer.info.programs ? e.renderer.info.programs.length : 'n/a'}`,
  ].join('\n');
}));
await browser.close();
