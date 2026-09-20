// 启动冒烟测试：在真实浏览器里加载页面，断言「引擎建起来了 + 世界装配完成 + 零 pageerror」。
// 为什么需要：tools/check-assets.mjs 只在 Node 里 import 资产模块，碰不到 main.js / postfx.js
// 这条引导链，所以「模块里少一个 import」这类只在浏览器炸的问题它会漏掉。
// 用法：先 npm run dev，再 node tools/boot-check.mjs [--url=...] [--timeout=180]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const DEADLINE = Number(arg('timeout', 180)) * 1000;

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e.message || String(e))));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

let fail = null;
const t0 = Date.now();
try {
  await page.goto(BASE, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction('!!window.__DIORAMA__', null, { timeout: 60000, polling: 250 });
  await page.waitForFunction('window.__DIORAMA__.built === true', null, { timeout: DEADLINE, polling: 250 });
  // 加载层必须在首帧之后从 DOM 里彻底消失：「成品画面零 UI」要能被断言，不能只是意图。
  await page.waitForFunction('!document.getElementById("boot")', null, { timeout: 60000, polling: 100 });
  const bootProgress = await page.evaluate(() => window.__DIORAMA__.progress.v);
  if (bootProgress < 1) fail = `装配进度只走到 ${bootProgress}，说明有阶段没报到`;
  const wall = Date.now() - t0;
  const st = await page.evaluate(() => {
    const e = window.__DIORAMA__;
    let mesh = 0, inst = 0, geo = 0, mat = 0;
    const geos = new Set(), mats = new Set();
    e.scene.traverse((o) => {
      if (!o.isMesh) return;
      mesh++; if (o.isInstancedMesh) inst++;
      if (o.geometry && !geos.has(o.geometry.uuid)) { geos.add(o.geometry.uuid); geo++; }
      if (o.material && !mats.has(o.material.uuid)) { mats.add(o.material.uuid); mat++; }
    });
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    // 贴图是「体积」的大头：程序化纹理每张都是 JS 里的一张位图（Canvas/ImageBitmap）+ 一份显存。
    // 统计「被材质引用到的唯一贴图」的像素总量，以及重复引用的程度。
    const texMap = new Map();
    const seenMat = new Set();
    e.scene.traverse((o) => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) {
        if (!m || seenMat.has(m.uuid)) continue;
        seenMat.add(m.uuid);
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'emissiveMap', 'aoMap', 'gradientMap']) {
          const t = m[k];
          if (t && t.isTexture && t.image) texMap.set(t.uuid, t);
        }
      }
    });
    let px = 0, biggest = 0, bn = '';
    for (const t of texMap.values()) {
      const w = t.image.width || 0, h = t.image.height || 0;
      px += w * h;
      if (w * h > biggest) { biggest = w * h; bn = `${t.name || t.uuid.slice(0, 6)} ${w}x${h}`; }
    }
    return {
      placed: e.assetsGroup ? e.assetsGroup.children.length : -1, missing: e.missing || [],
      fps: Math.round(e.stats.fps), timings: e.timings || null,
      mesh, inst, geo, mat, overflow: (e.overflow || []).length, mem,
      tex: texMap.size, texMB: Math.round((px * 4) / 1048576), texMax: bn,
      texByMat: (texMap.size / Math.max(1, seenMat.size)).toFixed(2),
    };
  });
  const bad = (st.missing || []).length;
  console.log(`boot OK — 到 built 约 ${wall / 1000}s，页面内装配 ${JSON.stringify(st.timings)} ms`);
  console.log(`  实例 ${st.placed}，Mesh ${st.mesh}（实例批次 ${st.inst}），几何 ${st.geo}，材质 ${st.mat}，越界丢弃 ${st.overflow}，JS 堆 ${st.mem ?? 'n/a'} MB，采样 fps ${st.fps}`);
  console.log(`  贴图 ${st.tex} 张 ≈ ${st.texMB} MB 位图（每材质 ${st.texByMat} 张），最大 ${st.texMax}`);
  if (bad) { console.log('  missing 清单:', st.missing.join(', ')); fail = 'missing assets'; }
} catch (e) {
  fail = String(e.message || e).split('\n')[0];
  console.log('boot FAIL —', fail);
}
if (errors.length) {
  console.log(`浏览器错误 ${errors.length} 条:`);
  for (const e of [...new Set(errors)].slice(0, 8)) console.log('  x', e.slice(0, 300));
  fail = fail || 'browser errors';
} else if (!fail) {
  console.log('  无 pageerror / console error');
}
await browser.close();
process.exit(fail ? 1 : 0);
