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
    const means = [], deltas = [], alt = [];
    for (const f of shots) { let s = 0; for (let p = 0; p < f.length; p += 4) s += L(f, p); means.push(+(s / (f.length / 4)).toFixed(1)); }
    for (let k = 1; k < shots.length; k++) {
      let sum = 0;
      for (let p = 0; p < shots[k].length; p += 4) sum += Math.abs(L(shots[k], p) - L(shots[k - 1], p));
      deltas.push(+(sum / (shots[k].length / 4)).toFixed(2));
    }
    for (let k = 2; k < means.length; k++) alt.push(Math.sign(means[k] - means[k - 1]) !== Math.sign(means[k - 1] - means[k - 2]));
    res({
      means, deltas, fps: Math.round(e.stats.fps),
      swaps: e.fx.composer.passes.filter((p) => p.needsSwap && p.enabled).length,
      readParity: e.fx.composer.readBuffer === e.fx.composer.renderTarget1 ? 'rt1' : 'rt2',
      flipRatio: +(alt.filter(Boolean).length / Math.max(1, alt.length)).toFixed(2),
    });
  };
  requestAnimationFrame(tick);
}), { FRAMES, CX, CY, CW, CH });

console.log('采样', `${CW}x${CH} @`, CX, CY, '| fps', r.fps, '| 参与交换的 pass 数', r.swaps, r.swaps % 2 ? '(奇数——已由 composer.render 复位起点兜住)' : '(偶数)');
console.log('画面平均亮度 :', r.means.join(' '));
console.log('相邻帧亮度差 :', r.deltas.join(' '));
console.log('亮度方向翻转率:', r.flipRatio, '（≈1 表示逐帧交替＝频闪；<0.5 表示稳定）');
const mean = r.deltas.reduce((a, b) => a + b, 0) / r.deltas.length;
console.log('=> max', Math.max(...r.deltas).toFixed(2), '| mean', mean.toFixed(2), '(0-255 标度；胶片颗粒基线约 1~3)');
await browser.close();
