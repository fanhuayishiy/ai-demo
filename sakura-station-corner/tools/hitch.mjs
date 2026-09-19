// 卡顿探针：逐帧记录 (帧耗时, 该帧发出的 draw calls)，用 calls 的尖峰认出「阴影刷新帧」，
// 再把尖峰帧与普通帧的耗时分开统计 —— 分清「整体慢」和「周期性硬卡」。
// 用法：node tools/hitch.mjs [--secs=8] [--drag=1]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const SECS = Number(arg('secs', 8));
const DRAG = arg('drag', '1') === '1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const host = await page.$('canvas') || await page.$('#stage');
const bb = await host.boundingBox();
const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
if (DRAG) {
  await page.mouse.move(cx, cy);
  await page.mouse.down();
}

const sampler = page.evaluate(({ secs }) => new Promise((res) => {
  const e = window.__DIORAMA__;
  const info = e.renderer.info;
  info.autoReset = false;            // 关掉逐 render 复位，改用「累计值差分」得到每帧真实 calls
  let prevCalls = info.render.calls;
  const out = [];
  let prev = performance.now();
  const t0 = prev;
  const tick = () => {
    const now = performance.now();
    const c = info.render.calls;
    out.push([+(now - prev).toFixed(2), c - prevCalls, info.render.triangles]);
    prevCalls = c;
    prev = now;
    if (now - t0 < secs * 1000) requestAnimationFrame(tick);
    else res(out);
  };
  requestAnimationFrame(tick);
}), { secs: SECS });

// 采样期间真的把手柄拖动起来：只按住不动的话相机是静止的，
// 「阴影只在画面静止后重绘」这道闸门会正常工作，测不出交互期的表现。
if (DRAG) {
  const steps = Math.round((SECS * 1000) / 70);
  for (let i = 0; i < steps; i++) {
    await page.mouse.move(cx + Math.sin(i * 0.22) * 300, cy + Math.cos(i * 0.13) * 70);
    await page.waitForTimeout(55);
  }
  await page.mouse.up();
}
const rows = await sampler;
await page.evaluate(() => { window.__DIORAMA__.renderer.info.autoReset = true; });
await browser.close();

const r = rows.filter((x) => x[1] > 0);
const dt = r.map((x) => x[0]).sort((a, b) => a - b);
const calls = r.map((x) => x[1]).sort((a, b) => a - b);
const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
const medCalls = q(calls, 0.5);
const spikes = r.filter((x) => x[1] > medCalls * 1.35);
const norm = r.filter((x) => x[1] <= medCalls * 1.35);
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const gaps = [];
for (let i = 1; i < r.length; i++) if (r[i][1] > medCalls * 1.35 && r[i - 1][1] <= medCalls * 1.35) gaps.push(i);
const intervals = [];
for (let i = 1; i < gaps.length; i++) intervals.push(gaps[i] - gaps[i - 1]);
console.log(`帧数 ${r.length}（${SECS}s${DRAG ? ' 持续拖拽' : ' 静止'}）`);
console.log(`帧耗时 ms  p50 ${q(dt, 0.5)}  p90 ${q(dt, 0.9)}  p99 ${q(dt, 0.99)}  max ${dt[dt.length - 1]}`);
console.log(`draw calls/帧  中位 ${medCalls}  p90 ${q(calls, 0.9)}  max ${calls[calls.length - 1]}`);
console.log(`尖峰帧（calls > 1.35×中位）${spikes.length} 帧：平均 ${avg(spikes.map((x) => x[0]).sort((a, b) => a - b))} ms，`
  + `普通帧平均 ${avg(norm.map((x) => x[0]).sort((a, b) => a - b))} ms`);
console.log(`尖峰帧之间的间隔（帧）：${intervals.join(', ')}`);
console.log(`→ 若间隔稳定且尖峰帧耗时数倍于普通帧，就是周期性重负载（阴影整场景重绘），不是整体帧率低`);
