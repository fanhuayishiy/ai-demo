// 频闪探针：逐帧读回同一块画面，量化「相邻帧平均亮度差」。
// 用途：后期链的缓冲奇偶性、深度贴图错位、曝光抖动都会表现为整画面逐帧明暗交替，
//       肉眼只看得到「一闪一闪」，用这个可以量化。
// 用法：node tools/flicker.mjs [--frames=12] [--clip=x,y,w,h]
// 需要 ?sample（engine 会开启 preserveDrawingBuffer），否则 readPixels 读到空缓冲。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/?sample');
const FRAMES = Number(arg('frames', 12));
const [CX, CY, CW, CH] = arg('clip', '560,300,480,300').split(',').map(Number);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(280000);
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 240000, polling: 500 });

const r = await page.evaluate(({ FRAMES, CX, CY, CW, CH }) => new Promise((res) => {
  const e = window.__DIORAMA__;
  const gl = e.renderer.getContext();
  const y0 = Math.max(0, e.renderer.domElement.height - CY - CH);
  const buf = new Uint8Array(CW * CH * 4);
  const L = (f, p) => 0.299 * f[p] + 0.587 * f[p + 1] + 0.114 * f[p + 2];
  const shots = [];
  let i = 0;
  const tick = () => {
    gl.readPixels(CX, y0, CW, CH, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    shots.push(buf.slice());
    if (++i < FRAMES) return requestAnimationFrame(tick);
    /* 均值一律用**全精度**算。旧版在这里 toFixed(1)，于是「真实波动 0.019 级」被压成一串 0，
       而 Math.sign(0) === 0 与任何非零符号都判成翻转 —— 翻转率由三五个抛硬币样本决定，
       同一份代码两次数出 0 和 0.7（阶段 34 把它误记成「摆动件合并引入的频闪」，
       四条件对照证明开不开合并逐项相同）。 */
    const means = [], deltas = [];
    for (const f of shots) { let s = 0; for (let p = 0; p < f.length; p += 4) s += L(f, p); means.push(s / (f.length / 4)); }
    for (let k = 1; k < shots.length; k++) {
      let sum = 0;
      for (let p = 0; p < shots[k].length; p += 4) sum += Math.abs(L(shots[k], p) - L(shots[k - 1], p));
      deltas.push(sum / (shots[k].length / 4));
    }
    const p2p = Math.max(...means) - Math.min(...means);
    const path = means.slice(1).reduce((a, v, k) => a + Math.abs(v - means[k]), 0);
    const net = Math.abs(means[means.length - 1] - means[0]);
    let alt = 0, tot = 0;
    for (let k = 2; k < means.length; k++) {
      const a = means[k - 1] - means[k - 2], b = means[k] - means[k - 1];
      if (Math.abs(a) < 1e-6 || Math.abs(b) < 1e-6) continue;      // 零差不算翻转，也不算稳定
      tot++;
      if (Math.sign(b) !== Math.sign(a)) alt++;
    }
    // 频闪的真正特征是「来回走而不前进」：路径长 ÷ 净位移 越大越像振荡，≈1 是单调漂移
    const osc = net > 1e-6 ? path / net : path > 1e-6 ? 99 : 1;
    res({
      means, deltas, fps: Math.round(e.stats.fps),
      swaps: e.fx.composer.passes.filter((p) => p.needsSwap && p.enabled).length,
      readParity: e.fx.composer.readBuffer === e.fx.composer.renderTarget1 ? 'rt1' : 'rt2',
      p2p, osc, flipRatio: tot >= 5 ? +(alt / tot).toFixed(2) : null, usable: tot,
    });
  };
  requestAnimationFrame(tick);
}), { FRAMES, CX, CY, CW, CH });

console.log('采样', `${CW}x${CH} @`, CX, CY, '| fps', r.fps, '| 参与交换的 pass 数', r.swaps, r.swaps % 2 ? '(奇数——已由 composer.render 复位起点兜住)' : '(偶数)');
console.log('画面平均亮度 :', r.means.map((v) => v.toFixed(3)).join(' '));
console.log('相邻帧亮度差 :', r.deltas.map((v) => v.toFixed(3)).join(' '));
const mean = r.deltas.reduce((a, b) => a + b, 0) / r.deltas.length;
console.log('=> max', Math.max(...r.deltas).toFixed(2), '| mean', mean.toFixed(2), '(0-255 标度；胶片颗粒基线约 1~3)');
console.log(`=> 均值全精度极差 ${r.p2p.toFixed(4)} | 路径/净位移 ${r.osc.toFixed(2)}（≈1 单调漂移，越大越来回振荡）`);
console.log(`=> 亮度方向翻转率: ${r.flipRatio === null ? `n/a（可用样本 ${r.usable}/${r.means.length - 2}，画面没有可测量的波动）` : `${r.flipRatio}（可用样本 ${r.usable}；≈1 逐帧交替＝频闪，<0.5 稳定）`}`);
/* 判据先于比值：极差不到 0.05/255 时，画面整体明暗根本没有可测量的摆动，
   此时翻转率与路径比都只是噪声的符号，读它就是在读随机数。 */
console.log(r.p2p < 0.05
  ? `=> 判定：**无频闪**。整体明暗极差 ${r.p2p.toFixed(4)}/255（<0.05 判据），翻转率此时无意义。`
  : `=> 判定：整体明暗有 ${r.p2p.toFixed(3)}/255 的摆动，路径/净位移 ${r.osc.toFixed(1)}${r.flipRatio > 0.7 ? ' —— 疑似逐帧交替，按 pass 奇偶 / 曝光抖动继续查' : ' —— 更像单调漂移（相机阻尼、天气过渡）'}`);
await browser.close();
