// 那 13 ms 着色成本里有什么：各向异性、alpha 剔除、雾、后期。逐档关掉量一遍。
// 用法：node tools/shade-cost.mjs [--view=hero] [--frames=14]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto('http://127.0.0.1:5173/?bootprobe=1', { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(2500);

const rows = await page.evaluate(({ frames }) => {
  const e = window.__DIORAMA__, R = e.renderer, gl = R.getContext();
  const rt = new e.THREE.WebGLRenderTarget(1600, 900);
  R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = false;
  const mats = new Set(), texs = new Set();
  e.scene.traverse((o) => { if (o.isMesh) { mats.add(o.material); const m = o.material; for (const k of ['map', 'normalMap', 'alphaMap', 'gradientMap', 'emissiveMap']) if (m[k]) texs.add(m[k]); } });
  const arm = (label) => {
    R.setRenderTarget(rt);
    R.render(e.scene, e.camera); gl.finish();
    const t = [];
    for (let k = 0; k < frames; k++) { const a = performance.now(); R.render(e.scene, e.camera); gl.finish(); t.push(performance.now() - a); }
    R.setRenderTarget(null);
    return Math.round(t.sort((x, y) => x - y)[Math.floor(t.length / 2)]);
  };
  const out = [{ label: '基线（场景直渲，无后期）', ms: arm() }];
  const aniso = (n) => { for (const t of texs) t.anisotropy = n; for (const m of mats) m.needsUpdate = true; };
  aniso(1); out.push({ label: '各向异性 8 → 1', ms: arm() });
  aniso(4); out.push({ label: '各向异性 8 → 4', ms: arm() });
  aniso(8); out.push({ label: '各向异性回 8', ms: arm() });
  const alpha = [];
  for (const m of mats) if (m.alphaTest) { alpha.push([m, m.alphaTest]); m.alphaTest = 0; }
  for (const m of mats) m.needsUpdate = true;
  out.push({ label: `关掉 ${alpha.length} 个材质的 alphaTest`, ms: arm() });
  for (const [m, v] of alpha) m.alphaTest = v;
  for (const m of mats) m.needsUpdate = true;
  const fog = e.scene.fog ? e.scene.fog.density : null;
  if (e.scene.fog) { e.scene.fog.density = 0; for (const m of mats) m.needsUpdate = true; out.push({ label: '雾密度归零', ms: arm() }); e.scene.fog.density = fog; for (const m of mats) m.needsUpdate = true; }
  out.push({ label: '贴图换成 1×1（采样带宽归零）', ms: (() => { const keep = [...texs].map((t) => [t, t.image]); for (const t of texs) { t.image = { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) }; t.needsUpdate = true; } const v = arm(); for (const [t, im] of keep) { t.image = im; t.needsUpdate = true; } return v; })() });
  out.push({ label: '整帧（含后期与 updaters）', ms: (() => { e.pause(true); const n = e.frameLog.length; e.step(1 / 60, frames); const r = e.frameLog.slice(n).map((x) => x.ms).sort((a, b) => a - b); e.pause(false); return Math.round(r[Math.floor(r.length / 2)]); })() });
  out.textures = texs.size; out.mats = mats.size;
  return out;
}, { frames: Number(arg('frames', 14)) });
await browser.close();
const base = rows[0].ms;
console.log(`  材质 ${rows.mats}，被引用贴图 ${rows.textures}`);
for (const r of rows) console.log(`  ${r.label.padEnd(28)} ${String(r.ms).padStart(4)} ms   ${r.ms - base === 0 ? '' : (r.ms - base > 0 ? '+' : '') + (r.ms - base) + ' ms'}`);
