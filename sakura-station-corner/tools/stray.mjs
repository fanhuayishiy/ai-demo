// 杂物解剖：列出指定矩形内「横躺在地的细长网格」，用来查「人行道上躺着的黑棒」这类东西是谁。
// node tools/stray.mjs --in=-9,-2,4.4,7.2 [--min=0.6] [--y0=0.15] [--y1=0.3] [--thick=0.12] [--show=25]
import { chromium } from 'playwright';
const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const [x0, x1, z0, z1] = arg('in', '-9,-2,4.5,7').split(',').map(Number);
const MIN = Number(arg('min', 0.6));

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const rows = await page.evaluate(({ x0, x1, z0, z1, MIN, THICK, Y0, Y1 }) => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const compose = (o, parentWorld) => {
    if (o.matrixAutoUpdate) o.updateMatrix();
    if (parentWorld) o.matrixWorld.multiplyMatrices(parentWorld, o.matrix);
    else o.matrixWorld.copy(o.matrix);
    for (const c of o.children) compose(c, o.matrixWorld);
  };
  compose(e.scene, null);
  const path = (o) => { const p = []; let q = o; while (q) { p.unshift(q.name || q.type); q = q.parent; } return p.join('/'); };
  const out = [];
  e.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const gg = o.geometry;
    if (!gg.boundingBox) gg.computeBoundingBox();
    const b = new THREE.Box3().copy(gg.boundingBox).applyMatrix4(o.matrixWorld);
    if (!isFinite(b.min.x)) return;
    const c = b.getCenter(new THREE.Vector3());
    if (c.x < x0 || c.x > x1 || c.z < z0 || c.z > z1) return;
    const s = b.getSize(new THREE.Vector3());
    const long = Math.max(s.x, s.y, s.z), thin = Math.min(s.x, s.y, s.z);
    if (long < MIN || thin > 0.09) return;
    // 横倒し限定：縦に伸びていない（高さ成分が小さい）かつ中心が地際
    if (s.y > THICK) return;
    if (c.y < Y0 || c.y > Y1) return;
    out.push({ p: path(o), long: +long.toFixed(2), mid: +[s.x, s.y, s.z].sort((a, b) => a - b)[1].toFixed(3), c: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)] });
  });
  return out;
}, { x0, x1, z0, z1, MIN, THICK: Number(arg('thick', 0.12)), Y0: Number(arg('y0', 0.1)), Y1: Number(arg('y1', 0.6)) });

console.log(`${rows.length} 本の細長いメッシュ（最長>${MIN}m・最短辺<0.09m）`);
const by = new Map();
for (const r of rows) {
  const key = r.p.replace(/\/[^/]*$/, '');
  by.set(key, (by.get(key) || 0) + 1);
}
for (const [k, n] of [...by].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}×  ${k}`);
for (const r of rows.slice(0, Number(arg('show', 25)))) console.log(`  ${r.long}m @${r.c.join(',')}  ${r.p}`);
await browser.close();
