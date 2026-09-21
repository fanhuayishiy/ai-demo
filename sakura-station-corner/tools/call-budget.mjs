// 提交预算：一帧里的 draw call 到底花在哪儿 —— 主场景 / 阴影 pass / 后期链，
// 以及「不动画面还能省多少」的两条候选（透明件合并、摆动件合并）各值几次。
//
// 为什么需要：静态视口量到的 calls 和真实拖拽时花的 calls 不是一回事 ——
// 平行光的阴影贴图在光空间，相机移动本来不需要重画；如果实现里每次镜头变化都
// 标脏，拖拽的每一帧就多付一整遍场景的提交。这个工具把两者拆开数清楚。
// 用法：node tools/call-budget.mjs [--view=hero] [--drag=4]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + (e.message || '').slice(0, 200)));
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(1500);

const out = await page.evaluate(async ({ drag }) => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const r = e.renderer;
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];

  // ---- 1. 阴影 pass：谁在什么时候重画 ----
  const sm = r.shadowMap;
  const orig = sm.render.bind(sm);
  let shadowRuns = 0, shadowCalls = 0, shadowMs = 0;
  sm.render = function (a, b, c) {
    const t0 = performance.now();
    const before = r.info.render.calls;
    orig(a, b, c);
    shadowRuns++;
    shadowCalls += r.info.render.calls - before;
    shadowMs += performance.now() - t0;
  };

  const scenePass = () => { r.info.reset(); const t0 = performance.now(); r.render(e.scene, e.camera); return { ms: performance.now() - t0, calls: r.info.render.calls }; };

  // 静止态：连续 8 次渲染，看阴影 pass 跑了几遍
  const still = [];
  for (let i = 0; i < 8; i++) still.push(scenePass());
  const stillShadowRuns = shadowRuns;

  // 拖拽态：真的派发 pointer 事件转镜头，数阴影重画次数
  const cv = document.getElementById('stage');
  const box = cv.getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  const before = shadowRuns;
  const dragCalls = [];
  await cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: cx, clientY: cy, buttons: 1, isPrimary: true, bubbles: true }));
  const t0 = performance.now();
  let k = 0;
  while (performance.now() - t0 < drag * 1000) {
    const a = (performance.now() - t0) / 1400;
    await cv.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: cx + Math.cos(a) * 260, clientY: cy + Math.sin(a * 1.7) * 90, buttons: 1, isPrimary: true, bubbles: true }));
    if (++k % 6 === 0) dragCalls.push(scenePass());
    await new Promise((res) => requestAnimationFrame(res));
  }
  await cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: cx, clientY: cy, isPrimary: true, bubbles: true }));
  const dragShadowRuns = shadowRuns - before;

  // 关掉阴影再量一次主场景：差值就是阴影 pass 的真实开销
  const warm = scenePass();
  sm.enabled = false;
  const noShadow = [];
  for (let i = 0; i < 6; i++) noShadow.push(scenePass());
  sm.enabled = true;
  sm.needsUpdate = true;
  scenePass();

  // ---- 2. 后期链的额外提交 ----
  let postCalls = 0;
  try {
    r.info.reset();
    e.fx.composer.render(0.016);
    postCalls = r.info.render.calls;
  } catch { postCalls = -1; }

  // ---- 3. 透明件合并余量：同资产 × 同材质 × 同 renderOrder 的透明散件 ----
  const world = e.scene.getObjectByName('world');
  world.updateMatrixWorld(true);
  const cam = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(e.camera.projectionMatrix, e.camera.matrixWorldInverse));
  const sph = new THREE.Sphere();
  const trBucket = new Map(), opBucket = new Map();
  let vis = 0, tr = 0, trMergeable = 0, anim = 0, animBuckets = new Set();
  const inAnim = (o) => { for (let p = o; p && p !== world; p = p.parent) if (p.userData && (p.userData.sway || p.userData.breathe || p.userData.signalLamp || p.userData.glassShine)) return true; return false; };
  for (const layer of ['map', 'assets']) {
    for (const unit of world.getObjectByName(layer).children) {
      unit.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        let v = o.visible;
        for (let p = o.parent; v && p && p !== world; p = p.parent) v = v && p.visible;
        if (!v) return;
        const g = o.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
        if (!cam.intersectsSphere(sph)) return;
        vis++;
        const m = o.material;
        if (Array.isArray(m)) return;
        if (m.transparent) {
          tr++;
          const k2 = layer + '/' + unit.name + '|' + m.uuid + '|' + (o.renderOrder | 0) + '|' + (m.depthWrite ? 1 : 0) + '|' + m.blending;
          trBucket.set(k2, (trBucket.get(k2) || 0) + 1);
        } else if (!o.isInstancedMesh && !o.userData?.mergedParts) {
          // 只数「还没被任何合并层吸收的散件」——把合并体也算进来会把
          // 省不下来的 1 次提交当成 20 次，虚报收益（踩过：估出 −222，实测 −38）
          const k2 = layer + '/' + unit.name + '|' + m.uuid;
          opBucket.set(k2, (opBucket.get(k2) || 0) + 1);
        }
        if (o.isInstancedMesh && inAnim(o)) { anim++; animBuckets.add(g.uuid + '|' + m.uuid + '|' + (o.renderOrder | 0)); }
      });
    }
  }
  const collapse = (map, min) => { let parts = 0, buckets = 0; for (const n of map.values()) if (n >= min) { parts += n; buckets++; } return { parts, buckets }; };

  return {
    still: { calls: med(still.map((s) => s.calls)), ms: +med(still.map((s) => s.ms)).toFixed(1), shadowRuns: stillShadowRuns },
    drag: { calls: med(dragCalls.map((s) => s.calls)), ms: +med(dragCalls.map((s) => s.ms)).toFixed(1), shadowRuns: dragShadowRuns, samples: dragCalls.length },
    shadow: { runs: shadowRuns, callsPerRun: shadowRuns ? Math.round(shadowCalls / shadowRuns) : 0, msPerRun: shadowRuns ? +(shadowMs / shadowRuns).toFixed(1) : 0 },
    noShadow: { calls: med(noShadow.map((s) => s.calls)), ms: +med(noShadow.map((s) => s.ms)).toFixed(1) },
    postCalls,
    vis, tr,
    trMerge: collapse(trBucket, 3),
    opLeft: collapse(opBucket, 3),
    anim, animBuckets: animBuckets.size,
    dpr: r.getPixelRatio(),
  };
}, { drag: Number(arg('drag', 4)) });

console.log(`静止 8 次渲染：主场景 calls ${out.still.calls} / ${out.still.ms} ms，其中阴影 pass 跑了 ${out.still.shadowRuns} 次`);
console.log(`拖拽 ${out.drag.samples} 次采样：calls ${out.drag.calls} / ${out.drag.ms} ms，期间阴影 pass 重画 ${out.drag.shadowRuns} 次`);
console.log(`阴影 pass 单次开销：${out.shadow.callsPerRun} 次提交 / ${out.shadow.msPerRun} ms`);
console.log(`彻底关掉阴影后主场景：calls ${out.noShadow.calls} / ${out.noShadow.ms} ms  ← 差值＝阴影占比`);
console.log(`后期链 composer.render 总 calls：${out.postCalls}`);
console.log(`\n视锥内可绘制 ${out.vis}；透明件 ${out.tr}，其中「同资产×同材质×同序」≥3 件的 ${out.trMerge.parts} 件可并成 ${out.trMerge.buckets} 块（省 ${out.trMerge.parts - out.trMerge.buckets}）`);
console.log(`不透明散件里还能再并的：${out.opLeft.parts} 件 → ${out.opLeft.buckets} 块（省 ${out.opLeft.parts - out.opLeft.buckets}）`);
console.log(`摆动件批次 ${out.anim} 个，若摆动改走顶点着色器（逐实例枢轴+相位，运动等价）则可并到 ${out.animBuckets} 桶（省 ${out.anim - out.animBuckets}）`);
if (errs.length) console.log('\n报错：' + [...new Set(errs)].slice(0, 4).join('\n'));
await browser.close();
