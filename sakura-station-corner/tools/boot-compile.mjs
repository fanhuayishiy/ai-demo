// built 之后那一帧的 4.9 s 到底是什么：着色器编译 / 几何上传 / 贴图上传 / 绘制本身。
// 用法：node tools/boot-compile.mjs [--url=http://127.0.0.1:5173/] [--async]
//
// 手法：?asm=freeze 让装配期几乎不出帧（只前 2 帧），built 一到就 pause()，
// 于是「首触总账」全部留在手里，可以用 renderer.compile() 手动拆开：
//   compile 第一次  = 真正的着色器编译（+ 遍历 2 万个 Mesh 的固定开销）
//   compile 第二次  = 只剩遍历（程序全命中缓存）→ 两者之差才是编译净成本
//   compile 之后首帧 = 剩下的（几何/贴图上传 + 阴影 bake + 绘制）
//   再一帧          = 稳态
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const url = BASE + (BASE.includes('?') ? '&' : '?') + 'asm=freeze&bootprobe=1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 800, height: 500 } })).newPage();
page.setDefaultTimeout(300000);
const t0 = Date.now();
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 20, timeout: 300000 });
const builtAt = ((Date.now() - t0) / 1000).toFixed(2);
const r = await page.evaluate(async (useAsync) => {
  const e = window.__DIORAMA__;
  const gl = e.renderer.getContext();
  const out = {
    parallel: !!gl.getExtension('KHR_parallel_shader_compile'),
    renderer: gl.getParameter(gl.VERSION),
    progs0: e.renderer.info.programs.length,
  };
  e.pause(true);                     // 先闸住循环，别让它抢先跑掉那一帧
  const snap = () => { const m = e.renderer.info.memory; return `${m.geometries}geo/${m.textures}tex`; };
  const tm = async (fn) => { const a = performance.now(); const v = await fn(); return { ms: Math.round(performance.now() - a), res: v === undefined ? '' : typeof v, after: snap() }; };
  out.memBefore = snap();
  out.compile1 = await tm(() => e.renderer.compile(e.scene, e.camera));
  out.progs1 = e.renderer.info.programs.length;
  out.compile2 = await tm(() => e.renderer.compile(e.scene, e.camera));
  out.firstFrame = await tm(() => e.step(1 / 60, 1));
  out.secondFrame = await tm(() => e.step(1 / 60, 1));
  out.shadowFrame = await tm(() => { e.markShadowsDirty(); return e.step(1 / 60, 1); });
  out.mem = { geo: e.renderer.info.memory.geometries, tex: e.renderer.info.memory.textures, progs: e.renderer.info.programs.length };
  // 账本是判定「探测有没有被抢先跑掉一帧」的证据：built 记号那行带着当时的 geo/tex 绝对值，
  // 记号之后若出现大帧，说明上传/编译成本在它之前就付掉了，本探测测的只是尾款。
  const mk = e.frameLog.find((x) => x.mark === 'built');
  out.atBuilt = mk ? { geo: mk.geo, tex: mk.tex, prog: mk.prog, t: mk.t } : null;
  out.tail = e.frameLog.slice(-6);
  return out;
}, arg('async') === '' || argv.includes('--async'));
await browser.close();
console.log(`到 built ${builtAt} s（装配期不出帧）`);
console.log(`KHR_parallel_shader_compile：${r.parallel ? '支持' : '不支持'}｜程序数 ${r.progs0} → 编译后 ${r.progs1}`);
const f = (x) => `${String(x.ms).padStart(5)} ms  [${x.after}]`;
console.log(`renderer.compile 第 1 次 ${f(r.compile1)}（含遍历 2 万个 Mesh）`);
console.log(`                    第 2 次 ${f(r.compile2)}（程序全命中缓存 → 只剩遍历）`);
console.log(`   → 着色器净成本 ≈ ${r.compile1.ms - r.compile2.ms} ms`);
console.log(`编译后首帧 ${f(r.firstFrame)}（几何/贴图上传 + 阴影 + 绘制）`);
console.log(`          次帧 ${f(r.secondFrame)}｜补阴影帧 ${f(r.shadowFrame)}`);
console.log(`装配结束时的资源：${r.memBefore}（built 时）→ ${r.mem.geo}geo/${r.mem.tex}tex/${r.mem.progs} 程序`);
console.log(`built 记号：t=${((r.atBuilt?.t || 0) / 1000).toFixed(2)} s，当时 ${r.atBuilt?.geo}geo/${r.atBuilt?.tex}tex/${r.atBuilt?.prog} 程序`);
for (const x of r.tail) console.log(`  帧#${x.f} t=${(x.t / 1000).toFixed(2)} ms=${x.ms} calls=${x.c} sh=${x.sh} geo=${x.geo} tex=${x.tex} prog=${x.prog} ${x.mark || ''}`);
