// 零件普查：把「视锥内还会被绘制的那些对象」按类别 / 资产 / 形状原型分堆，
// 看清提交花在哪、哪一层合并值得做。
// 用法：node tools/part-census.mjs [--views=hero,store] [--url=http://127.0.0.1:5173/?merge=off]
// 合并 pass 报的 skip 原因只说明「为什么没并」，不说明「值不值得并」—— 这里逐视口数次数。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEWS = arg('views', 'hero,store,interior,top').split(',').filter(Boolean);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/?merge=off'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const out = await page.evaluate(async ({ views }) => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const world = e.scene.getObjectByName('world');
  const waitFrames = (ms) => new Promise((res) => { const t0 = performance.now(); const tick = () => (performance.now() - t0 > ms ? res() : requestAnimationFrame(tick)); requestAnimationFrame(tick); });
  const sph = new THREE.Sphere();
  const put = (m, k, n = 1) => { const x = m.get(k) || 0; m.set(k, x + n); };
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  /* 形状原型族：BoxGeometry(0.1,0.2,0.03) 与 BoxGeometry(2,1,0.5) 的拓扑/法线/UV 完全一样，
     只差一个逐轴缩放。换成同一个 1×1×1 原型 + mesh.scale 后渲染结果等价，
     而「同几何 + 同材质」的实例化分桶会大幅塌缩 —— 这是唯一不花显存的省提交办法。 */
  const familyOf = (g) => {
    const p = g.parameters || {};
    switch (g.type) {
      case 'BoxGeometry': return 'box';
      case 'PlaneGeometry': return 'plane:' + (p.widthSegments || 1) + 'x' + (p.heightSegments || 1);
      case 'CylinderGeometry': return ['cyl', p.radialSegments, p.heightSegments || 1, p.openEnded ? 'o' : 'c',
        (p.thetaLength === undefined || p.thetaLength > 6.28) ? '' : 'arc', Math.abs(p.radiusTop - p.radiusBottom) < 1e-6 ? '' : 'taper'].filter(Boolean).join(':');
      case 'CircleGeometry': return 'circ:' + p.segments;
      case 'SphereGeometry': return 'sph:' + p.widthSegments + 'x' + p.heightSegments;
      case 'ConeGeometry': return 'cone:' + p.radialSegments;
      case 'CapsuleGeometry': return 'capsule:' + p.radialSegments;
      case 'TorusGeometry': return 'tor';
      case 'RoundedBoxGeometry': return 'rbox';
      case 'LatheGeometry': return 'lathe';
      case 'ExtrudeGeometry': return 'extrude';
      case 'TubeGeometry': return 'tube';
      default: return 'other:' + g.type;
    }
  };
  /** retile 过的 UV 已被改写（世界尺度铺贴），换原型会改掉贴图密度 → 不能归一 */
  const uvTainted = (g) => {
    const uv = g.attributes.uv;
    if (!uv) return false;
    for (let i = 0; i < uv.count; i++) {
      const a = uv.getX(i), b = uv.getY(i);
      if (a > 1.0001 || b > 1.0001 || a < -0.0001 || b < -0.0001) return true;
    }
    return false;
  };
  const inAnimated = (o) => {
    for (let p = o; p && p !== world; p = p.parent) {
      if (p.userData && (p.userData.sway || p.userData.breathe || p.userData.signalLamp || p.userData.glassShine)) return true;
    }
    return false;
  };

  const results = [];
  for (const view of views) {
    e.setView(view);
    await waitFrames(1500);
    world.updateMatrixWorld(true);
    const cam = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
    const cat = new Map(), unit = new Map(), fam = new Map();
    const v = { n: 0, im: 0, plain: 0, imStat: 0, imAnim: 0, inst: 0, instStat: 0 };
    const imKeys = new Set();
    const baked = { verts: 0, tris: 0, buf: new Set() };
    for (const layer of ['map', 'assets']) {
      const node = world.getObjectByName(layer);
      for (const child of node.children) {
        child.traverse((o) => {
          if (!o.isMesh || !o.geometry) return;
          let vv = o.visible;
          for (let p = o.parent; vv && p && p !== world; p = p.parent) vv = vv && p.visible;
          if (!vv) return;
          const g = o.geometry;
          if (!g.boundingSphere) g.computeBoundingSphere();
          sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
          if (!cam.intersectsSphere(sph)) return;
          v.n++;
          const m = o.material;
          const im = !!o.isInstancedMesh;
          const mt = Array.isArray(m) ? 'array' : m.type;
          const tr = !m || Array.isArray(m) ? '?' : (m.transparent ? (m.depthWrite ? 'transp+dw' : 'transp') : 'opaque');
          put(cat, `${im ? 'inst' : o.userData?.mergedParts ? 'merge' : 'plain'} ${mt} ${tr}`);
          put(unit, `${layer}/${child.name}`);
          if (im) {
            v.im++; v.inst += o.count;
            const anim = inAnimated(o);
            if (anim) v.imAnim++;
            else {
              v.imStat++; v.instStat += o.count;
              imKeys.add(g.uuid + '|' + m.uuid + '|' + (o.renderOrder | 0));
              let un = o; while (un.parent && un.parent !== world) un = un.parent;
              baked.buf.add(un.name + '|' + m.uuid + '|' + (o.renderOrder | 0) + (o.castShadow ? 1 : 0));
              const pc = g.attributes.position.count;
              baked.verts += o.count * pc;
              baked.tris += o.count * (g.index ? g.index.count / 3 : pc / 3);
            }
          } else v.plain++;
          const k = familyOf(g);
          let f = fam.get(k);
          if (!f) fam.set(k, (f = { cur: 0, geos: new Set(), bck: new Set(), bad: 0, pverts: 0, inst: 0 }));
          f.cur++; f.geos.add(g.uuid); f.pverts += g.attributes.position.count;
          if (im) f.inst += o.count;
          if (uvTainted(g)) f.bad++;
          else f.bck.add((Array.isArray(m) ? 'arr' : m.uuid) + '|' + (o.renderOrder | 0) + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0));
        });
      }
    }
    results.push({
      view, v, imKeys: imKeys.size,
      cat: top(cat, 10).map(([k, n]) => `${k} ${n}`),
      unit: top(unit, 12).map(([k, n]) => `${k} ${n}`),
      fam: [...fam.entries()].sort((a, b) => b[1].cur - a[1].cur).slice(0, 14)
        .map(([k, f]) => ({ k, cur: f.cur, inst: f.inst, geos: f.geos.size, bck: f.bck.size, bad: f.bad, pverts: f.pverts })),
      baked: { verts: baked.verts, tris: Math.round(baked.tris), buffers: baked.buf.size },
    });
  }
  return { results, mem: { ...e.renderer.info.memory }, q: e.quality?.name };
}, { views: VIEWS });

console.log('GPU 资源：', JSON.stringify(out.mem), ' 档位', out.q);
for (const r of out.results) {
  console.log(`\n===== ${r.view}：视锥内可绘制 ${r.v.n} = 实例批次 ${r.v.im}（静止 ${r.v.imStat} + 摆动 ${r.v.imAnim}，静止实例 ${r.v.instStat} 个）+ 散件 ${r.v.plain}`);
  console.log('  静止批次跨资产按 几何+材质 去重 → ' + r.imKeys + `；若烘平进（资产×材质）→ ${r.baked.buffers} 块，代价 ${r.baked.tris.toLocaleString('en')} 三角形 / ${r.baked.verts.toLocaleString('en')} 顶点`);
  console.log('  按类别：' + r.cat.join(' | '));
  console.log('  按资产：' + r.unit.join(' | '));
  console.log('  形状原型族（件数 / 归一化后桶数）：');
  for (const f of r.fam) console.log(`    ${f.k.padEnd(22)} 件 ${String(f.cur).padStart(5)}（实例 ${String(f.inst).padStart(6)}）唯一几何 ${String(f.geos).padStart(5)} → 桶 ${String(f.bck).padStart(4)}  UV已改写 ${String(f.bad).padStart(4)}  原型顶点 ${f.pverts.toLocaleString('en')}`);
}
await browser.close();
