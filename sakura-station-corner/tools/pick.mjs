// 屏幕取色 + 沿该像素视线列出所有物体：node tools/pick.mjs [--pos=] [--target=] --px=x1,y1[,x2,y2...]
// 用途：画面上有一块「说不清是什么」的色带时，用世界坐标去猜射线会打偏。
// 直接把**屏幕像素**反投影成射线，量它的路径长度上有什么、以及该像素的真实 RGB。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const nums = (s) => (s ? s.split(',').map(Number) : null);
const POS = nums(arg('pos', '-6.2,1.9,11.0'));
const TGT = nums(arg('target', '-7.6,1.3,1.0'));
const W = Number(arg('w', 1200)), H = Number(arg('h', 760));
const flat = arg('px', '600,555').split(',').map(Number);
const PX = [];
for (let i = 0; i + 1 < flat.length; i += 2) PX.push([flat[i], flat[i + 1]]);

const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox', `--window-size=${W},${H}`] });
const ctx = await b.newContext({ viewport: { width: W, height: H } });
const p = await ctx.newPage();
p.setDefaultTimeout(300000);
await p.goto(arg('url', 'http://127.0.0.1:5173/?sample'), { waitUntil: 'commit' });
await p.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
await p.waitForFunction('!document.getElementById("boot")', { timeout: 60000, polling: 100 });

const out = await p.evaluate(({ POS, TGT, PX, W, H }) => {
  const e = window.__DIORAMA__;
  e.rig.place(POS, TGT);
  e.scene.updateMatrixWorld(true);
  e.renderer.render(e.scene, e.camera);
  const rc = new e.THREE.Raycaster();
  const res = [];
  for (const [px, py] of PX) {
    const ndc = new e.THREE.Vector2((px / W) * 2 - 1, -(py / H) * 2 + 1);
    rc.setFromCamera(ndc, e.camera);
    rc.near = 0.01; rc.far = 60;   // intersectObjects 的第 3 参是「结果数组」，不是 far
    const hits = rc.intersectObjects(e.scene.children, true).filter((h) => h.object.isMesh);
    const list = [];
    let alpha = 1;
    for (const h of hits.slice(0, 14)) {
      const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      const path = [];
      for (let o = h.object; o; o = o.parent) if (o.name) path.unshift(o.name);
      const op = m && m.transparent ? Number(m.opacity ?? 1) : 1;
      if (m && m.transparent) alpha *= 1 - op;
      list.push({
        d: +h.distance.toFixed(2), n: path.slice(-2).join('/'),
        c: '#' + ((m && m.color ? m.color.hex : 0) >>> 0).toString(16).padStart(6, '0'),
        op: m && m.transparent ? op : 1,
        tr: !!(m && m.transparent),
      });
    }
    // 该像素的真实颜色
    const gl = e.renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(Math.round(px), Math.round(H - py), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    res.push({ px, py, rgb: [buf[0], buf[1], buf[2]], through: +alpha.toFixed(3), list });
  }
  return res;
}, { POS, TGT, PX, W, H });

for (const r of out) {
  console.log(`像素 (${r.px},${r.py}) 实际 RGB = ${r.rgb.join(',')}  视线累计透过率 ${(r.through * 100).toFixed(1)}%`);
  for (const h of r.list) console.log(`   ${String(h.d).padStart(6)}m  ${h.c}  ${h.tr ? 'α' + h.op.toFixed(2) : '  不透明 '}  ${h.n}`);
}
await b.close();
