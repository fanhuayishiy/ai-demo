// 帧成本剖析：把「一帧 ~90 ms」拆开 —— draw call 数量、逐资产归属、以及消融后的变化。
// 用法：node tools/frame-cost.mjs [--views=hero,store] [--ablate=assets,map,sakura,interior]
//
// 背景：实测 Chrome/ANGLE 下每个 draw call 约 8.8 µs（CPU 提交），所以
// 「卡不卡」几乎等价于「视锥内有多少个可绘制对象」。这个工具就是量这个的。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEWS = arg('views', 'hero').split(',').filter(Boolean);
const ABLATE = (arg('ablate', 'assets,map,sakura,interior')).split(',').filter(Boolean);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
const warns = [];
page.on('console', (m) => { if (m.type() === 'warning' && /placement|kit\./.test(m.text())) warns.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => warns.push('PAGEERROR ' + (e.message || '').slice(0, 160)));
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const gl = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  const c = e.renderer.getContext();
  const d = c.getExtension('WEBGL_debug_renderer_info');
  return {
    renderer: d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : '(masked)',
    drawBuf: e.renderer.getDrawingBufferSize(new e.THREE.Vector2()).toArray(),
    objects: (() => { let n = 0, im = 0; e.scene.traverse((o) => { if (o.isMesh) n++; if (o.isInstancedMesh) im++; }); return { mesh: n, instanced: im }; })(),
  };
});
console.log('GL:', gl.renderer, ' drawBuffer', JSON.stringify(gl.drawBuf), ' 场景 Mesh', gl.objects.mesh, '（其中 InstancedMesh', gl.objects.instanced, '）');

const run = await page.evaluate(async ({ views, ablate }) => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const world = e.scene.getObjectByName('world');
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  // 忙等会阻塞主线程 → 一帧都不跑，LOD 与阻尼不会更新。必须真的等帧。
  const waitFrames = (ms) => new Promise((res) => {
    const t0 = performance.now();
    const tick = () => (performance.now() - t0 > ms ? res() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });
  const timeRender = (n = 10) => {
    const t = [];
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      e.renderer.render(e.scene, e.camera);
      t.push(performance.now() - t0);
    }
    return { ms: +med(t).toFixed(1), calls: e.renderer.info.render.calls };
  };
  const out = [];
  for (const v of views) {
    e.setView(v);
    await waitFrames(1200);   // 让 LOD / 阻尼落定
    const cam = new THREE.Frustum();
    cam.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
    const rows = [];
    for (const layer of ['map', 'assets']) {
      const node = world.getObjectByName(layer);
      for (const child of node.children) {
        let vis = 0, tot = 0;
        child.traverse((o) => {
          if (!o.isMesh) return;
          tot++;
          let vv = o.visible;
          for (let p = o.parent; vv && p && p !== world; p = p.parent) vv = vv && p.visible;
          if (!vv || !o.geometry) return;
          const g = o.geometry;
          if (!g.boundingSphere) g.computeBoundingSphere();
          if (!cam.intersectsSphere(g.boundingSphere.clone().applyMatrix4(o.matrixWorld))) return;
          vis++;
        });
        if (vis) rows.push({ layer, name: child.name || '(anon)', vis, tot });
      }
    }
    rows.sort((a, b) => b.vis - a.vis);
    const base = timeRender();
    const ab = [{ label: 'baseline', ...base }];
    const hide = (pred) => {
      const flipped = [];
      world.traverse((o) => { if (pred(o)) { flipped.push([o, o.visible]); o.visible = false; } });
      const r = timeRender();
      for (const [o, val] of flipped) o.visible = val;
      return r;
    };
    for (const k of ablate) {
      if (k === 'sakura') ab.push({ label: k, ...hide((o) => /^sakura-/.test(o.name || '')) });
      if (k === 'interior') ab.push({ label: k, ...hide((o) => /^in-/.test(o.name || '')) });
      if (k === 'assets') ab.push({ label: k, ...hide((o) => o.name === 'assets') });
      if (k === 'map') ab.push({ label: k, ...hide((o) => o.name === 'map') });
    }
    out.push({ view: v, total: rows.reduce((s, r) => s + r.vis, 0), rows: rows.slice(0, 14), ab });
  }
  return out;
}, { views: VIEWS, ablate: ABLATE });

for (const r of run) {
  console.log(`\n===== ${r.view}：视锥内可见对象 ${r.total} =====`);
  for (const x of r.rows) console.log(`  ${x.layer.padEnd(7)} ${x.name.padEnd(20)} 可见 ${String(x.vis).padStart(5)} / 共 ${x.tot}`);
  console.log('  消融 renderer.render CPU 中位：' + r.ab.map((a) => `${a.label} ${a.ms}ms/${a.calls}calls`).join('  |  '));
}
if (warns.length) console.log('\n警告/错误：\n  ' + [...new Set(warns)].slice(0, 6).join('\n  '));
await browser.close();
