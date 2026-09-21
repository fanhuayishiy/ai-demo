// 视锥内那 4492 次提交，按「能不能进同一个 multi-draw 批次」分类：
//   键 = 着色器变体 + map + normalMap + gradientMap + side/透明/顶点色 等真正决定状态的字段
//   颜色、spec、normalScale 这类纯 uniform 差异不算（BatchedMesh 可以逐批 setColorAt / 自带属性贴图）
// 用法：node tools/draw-classes.mjs [--views=hero,store,interior]
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
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });

for (const v of arg('views', 'hero,store,interior').split(',')) {
  await page.evaluate((x) => window.__DIORAMA__.setView(x), v);
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const e = window.__DIORAMA__, THREE = e.THREE;
    const cam = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
    const classes = new Map(), geos = new Map(), byKey = new Map();
    let total = 0, tris = 0;
    e.scene.updateMatrixWorld();
    e.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      let vis = o.visible;
      for (let p = o.parent; vis && p; p = p.parent) vis = vis && p.visible;
      if (!vis) return;
      const g = o.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      if (!cam.intersectsSphere(g.boundingSphere.clone().applyMatrix4(o.matrixWorld))) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      total++;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      // 有些材质的 map 是 DataTexture / CanvasTexture / 甚至被换成了 null，统一取 source.uuid
      const src = (t) => (t ? (t.source && t.source.uuid ? t.source.uuid : t.uuid) : '-');
      // 四种「同批」定义，从严到宽：能进同一个 BatchedMesh 的前提是材质对象可共用，
      // 差异只能靠逐实例数据（setColorAt / 自建属性贴图）带进着色器。
      const state = [m.type, m.side, m.transparent ? 't' : '', m.vertexColors ? 'v' : '', m.blending, m.opacity === 1 ? '' : 'op' + m.opacity];
      const tex = [src(m.map), src(m.normalMap), m.gradientMap ? m.gradientMap.source.uuid : '-', g.attributes.uv2 ? 'uv2' : '', g.index ? 'i' : 'n', Object.keys(g.attributes).sort().join(',')];
      // 逐实例可搬运的标量：BatchedMesh 的 setColorAt 只带颜色，其余要靠属性贴图
      const scalars = ['roughness', 'metalness', 'emissiveIntensity', 'reflectivity', 'ior', 'transmission', 'specularIntensity', 'sheen', 'clearcoat', 'alphaTest', 'normalScaleX', 'normalScaleY', 'spec', 'specPower', 'shadowAmt', 'worn', 'tint']
        .filter((k) => m[k] !== undefined).map((k) => k + '=' + (typeof m[k] === 'number' ? m[k].toFixed(3) : m[k])).join(';');
      const ns = m.normalScale ? m.normalScale.x + 'x' + m.normalScale.y : '';
      const col = m.color ? m.color.getHexString() : '-';
      const em = m.emissive ? m.emissive.getHexString() : '-';
      const keys = [
        ['K1 只看状态', state.join('|')],
        ['K2 + 贴图身份', [...state, ...tex].join('|')],
        ['K3 + 逐件标量', [...state, ...tex, ns, scalars, em].join('|')],
        ['K4 + 颜色（≈材质数）', [...state, ...tex, ns, scalars, em, col].join('|')],
      ];
      for (const [kn, k] of keys) {
        let mp = byKey.get(kn);
        if (!mp) byKey.set(kn, (mp = new Map()));
        mp.set(k, (mp.get(k) || 0) + 1);
      }
      classes.set(keys[2][1], (classes.get(keys[2][1]) || 0) + 1);
      geos.set(g.uuid, (geos.get(g.uuid) || 0) + 1);
    });
    const stat = (mp) => {
      const sizes = [...mp.values()].sort((a, b) => b - a);
      const batchable = sizes.filter((n) => n >= 2).reduce((a, n) => a + n, 0);
      return {
        n: sizes.length, single: sizes.filter((x) => x === 1).length, batchable,
        capped: sizes.reduce((a, x) => a + Math.ceil(x / 128), 0), top: sizes.slice(0, 6),
      };
    };
    return {
      total, tris: Math.round(tris / 1000),
      distinctGeo: geos.size, geoSingletons: [...geos.values()].filter((n) => n === 1).length,
      keys: [...byKey].map(([name, mp]) => ({ name, ...stat(mp) })),
    };
  });
  console.log(`  ${v.padEnd(9)} 视锥内 ${r.total} 次绘制 / ${r.tris}k 三角   独立几何 ${r.distinctGeo}（其中单件 ${r.geoSingletons}）`);
  for (const k of r.keys) {
    console.log(`    ${k.name.padEnd(20)} 类 ${String(k.n).padStart(4)} 个（单件类 ${String(k.single).padStart(4)}）｜≥2 件的类覆盖 ${String(k.batchable).padStart(4)} 次绘制（${(k.batchable / r.total * 100).toFixed(0)}%）｜每批 ≤128 → ${String(k.capped).padStart(4)} 次提交｜最大几类 ${k.top.join(', ')}`);
  }
}
await browser.close();
