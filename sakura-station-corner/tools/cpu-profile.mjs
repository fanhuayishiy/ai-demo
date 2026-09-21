// 装配期 CPU 采样：把「world 那 5 s 到底是哪些函数」摊开（自顶向下的自耗时榜）。
// 用法：node tools/cpu-profile.mjs [--url=...] [--until=built|world] [--top=25]
//
// 为什么需要：boot-trace 给的是「哪个资产/哪个阶段」花了多久，回答不了
// 「同一个资产里是建模代码慢、还是几何工具慢」。要判断 5 s 里有多少是可省的机械开销，
// 只有行级采样这一条路 —— 别凭感觉猜。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const UNTIL = arg('until', 'built');

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 800, height: 500 } });
const page = await ctx.newPage();
page.setDefaultTimeout(300000);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });   // µs
await page.goto(BASE + (BASE.includes('?') ? '&' : '?') + 'bootprobe=1', { waitUntil: 'commit' });
await cdp.send('Profiler.start');
if (UNTIL === 'world') {
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.timings && window.__DIORAMA__.timings.world', { polling: 50, timeout: 300000 });
} else {
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 100, timeout: 300000 });
}
const { profile } = await cdp.send('Profiler.stop');
await browser.close();

const byId = new Map();
for (const n of profile.nodes) byId.set(n.id, n);
const self = new Map();
let total = 0;
for (let i = 0; i < profile.samples.length; i++) {
  const dt = profile.timeDeltas[i] || 0;
  if (dt <= 0) continue;
  const n = byId.get(profile.samples[i]);
  if (!n) continue;
  total += dt;
  const cf = n.callFrame;
  const file = (cf.url || '(native)').replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '');
  const key = `${cf.functionName || '(anonymous)'}  ${file}:${cf.lineNumber + 1}`;
  const bucket = self.get(key) || { ms: 0, src: 0 };
  bucket.ms += dt / 1000;
  if (file.startsWith('src/') || file.startsWith('/src/')) bucket.src += dt / 1000;
  self.set(key, bucket);
}
const rows = [...self].sort((a, b) => b[1].ms - a[1].ms);
console.log(`采样 ${(total / 1000).toFixed(2)} s（${profile.samples.length} 个样本，200 µs 间隔，含浏览器/GC/驱动侧）｜到 ${UNTIL}`);
console.log(`前 ${arg('top', 25)} 自耗时：`);
let shown = 0;
for (const [k, v] of rows) {
  if (v.ms < total / 1000 / 100 * 0.5) break;
  console.log(`  ${v.ms.toFixed(0).padStart(6)} ms  ${k}`);
  if (++shown >= Number(arg('top', 25))) break;
}
// 按「模块文件」再聚一次：函数榜会被同名工具函数刷屏
const byFile = new Map();
for (const [k, v] of rows) {
  const f = k.split('  ')[1] || '?';
  const file = f.replace(/:\d+$/, '');
  byFile.set(file, (byFile.get(file) || 0) + v.ms);
}
console.log(`\n按文件聚合（前 14）：`);
for (const [f, ms] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 14)) {
  console.log(`  ${ms.toFixed(0).padStart(6)} ms  ${f}`);
}
