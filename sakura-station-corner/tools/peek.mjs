// 自定义机位实拍：node tools/peek.mjs --pos=6,2,10 --target=0,0.5,7 [--out=shots/peek.png] [--w=1400] [--h=900]
// 用途：预设机位看不清某个零件时，把它拉到眼前看真渲染，而不是凭包围盒猜。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const nums = (s) => (s ? s.split(',').map(Number) : null);

const POS = nums(arg('pos', ''));
const TGT = nums(arg('target', ''));
if (!POS || !TGT) {
  console.log('用法: node tools/peek.mjs --pos=x,y,z --target=x,y,z');
  process.exit(1);
}
const OUT = arg('out', 'shots/peek.png');
const W = Number(arg('w', 1400));
const H = Number(arg('h', 900));

const browser = await chromium.launch({
  channel: arg('channel', 'chrome'), headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: Number(arg('dsf', 1)) });
const page = await ctx.newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
await page.evaluate(({ pos, tgt, hide, fov }) => {
  const e = window.__DIORAMA__;
  e.rig.place(pos, tgt);
  // --fov=7：望遠マクロ。1 cm 級の小物を画面内で大きく見せる（落桜の輪郭確認など）
  if (fov) { e.camera.fov = fov; e.camera.updateProjectionMatrix(); }
  // --hide=store-glass,in-shell  把某些图层临时藏掉，用来判断「看不清」是玻璃挡的还是里面本来就空
  if (hide) for (const n of hide.split(',')) {
    const o = e.scene.getObjectByName(n.trim());
    if (o) o.visible = false; else console.warn('hide: 找不到 ' + n);
  }
}, { pos: POS, tgt: TGT, hide: arg('hide', ''), fov: Number(arg('fov', 0)) || null });

// --ray=x,y,z：从相机向该点打一条射线，列出沿途所有会着色的物体 ——
// 「橱窗看不清」到底是几层透明面叠出来的，一次就能数出来。
const RAY = arg('ray', '');
if (RAY) {
  const hits = await page.evaluate(({ ray }) => {
    const e = window.__DIORAMA__;
    const [x, y, z] = ray.split(',').map(Number);
    e.scene.updateMatrixWorld(true);
    const from = e.camera.position.clone();
    const to = new e.THREE.Vector3(x, y, z);
    const dir = to.clone().sub(from);
    const len = dir.length();
    const rc = new e.THREE.Raycaster(from, dir.normalize(), 0.01, len + 0.4);
    const out = [];
    for (const h of rc.intersectObjects(e.scene.children, true)) {
      const o = h.object;
      if (!o.isMesh || o.visible === false) continue;
      let v = true;
      for (let p = o; p; p = p.parent) if (p.visible === false) { v = false; break; }
      if (!v) continue;
      const m = o.material;
      const path = [];
      for (let p = o; p && p.name; p = p.parent) path.unshift(p.name);
      out.push({
        d: +h.distance.toFixed(2),
        n: path.slice(-3).join('/'),
        tr: m ? !!m.transparent : false,
        op: m ? +(m.opacity ?? 1).toFixed(2) : 1,
        side: m ? m.side : 0,
        order: o.renderOrder,
      });
    }
    return out;
  }, { ray: RAY });
  const alpha = hits.reduce((a, h) => a * (h.tr ? 1 - h.op : 1), 1);
  console.log(`射线路径上 ${hits.length} 个物体，其中透明 ${hits.filter((h) => h.tr).length} 个 → 累计透过率 ${(alpha * 100).toFixed(1)}%`);
  for (const h of hits) console.log(`  ${String(h.d).padStart(5)}m  ${h.tr ? `α${h.op} order${h.order}` : '    不透明  '}  ${h.n}`);
}
await page.waitForTimeout(Number(arg('wait', 2200)));
await page.screenshot({ path: OUT });
console.log('shot ->', OUT);
await browser.close();
