// 装配期帧账本：把「启动那 8 s 里 GPU 到底在干什么」逐帧摊开。
// 用法：node tools/boot-feed.mjs [--url=http://127.0.0.1:5173/] [--w=800] [--h=500] [--tail=18]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const url = BASE + (BASE.includes('?') ? '&' : '?') + 'bootprobe=1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: Number(arg('w', 800)), height: Number(arg('h', 500)) } });
const page = await ctx.newPage();
page.setDefaultTimeout(300000);
const t0 = Date.now();
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
const builtAt = (Date.now() - t0) / 1000;
// 等 GPU 首触真正结束（成帧），账本才包含 built 之后那几帧
const fr = await page.evaluate('window.__DIORAMA__.frames');
await page.waitForFunction(`window.__DIORAMA__.frames > ${fr} + 2`, { polling: 100, timeout: 120000 });
const visAt = (Date.now() - t0) / 1000;
const out = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  return { log: e.frameLog, timings: e.timings, bytes: e.texCacheInfo ? e.texCacheInfo().bytes : 0, progs: e.renderer.info.programs?.length ?? 0 };
});
await browser.close();

const L = out.log;
console.log(`到 built ${builtAt.toFixed(2)} s → 成帧 ${visAt.toFixed(2)} s   账本 ${L.length} 帧 / 帧上总账 ${(L.reduce((a, r) => a + r.ms, 0) / 1000).toFixed(2)} s`);
// built 记号之后（含）的帧属于「GPU 首触总账」，之前是「边建边喂」
const bi = L.findIndex((r) => r.mark === 'built');
const split = bi < 0 ? L.length : bi;
const sum = (a) => a.reduce((s, r) => s + r.ms, 0);
console.log(`  装配中渲染 ${split} 帧 ${(sum(L.slice(0, split)) / 1000).toFixed(2)} s ｜ built 之后 ${L.length - split} 帧 ${(sum(L.slice(split)) / 1000).toFixed(2)} s`);

// 逐帧归因：上传（geo/tex 增量）、阴影 bake（sh=1）、绘制本身（calls）
let upMs = 0, shMs = 0, otherMs = 0, dGeo = 0, dTex = 0, shFrames = 0;
for (let i = 0; i < L.length; i++) {
  const r = L[i];
  const pg = i ? L[i - 1].geo : 0, pt = i ? L[i - 1].tex : 0;
  const g = Math.max(0, r.geo - pg), t = Math.max(0, r.tex - pt);
  dGeo += g; dTex += t;
  if (g + t > 20) upMs += r.ms;
  else if (r.sh) { shMs += r.ms; shFrames++; }
  else otherMs += r.ms;
}
const s = (ms) => (ms / 1000).toFixed(2) + ' s';
console.log(`归因（帧时间按「这一帧主要动了什么」归类，帧内混合成本无法再分）：`);
console.log(`  含上传的帧（累计 几何 +${dGeo}，贴图 +${dTex}）：${s(upMs)}`);
console.log(`  阴影 bake 帧 ${shFrames} 次：${s(shMs)}`);
console.log(`  其余（纯绘制 / 后期 / updaters）：${s(otherMs)}`);
console.log(`  着色器程序 ${out.progs} 个｜贴图位图 ${(out.bytes / 1048576).toFixed(0)} MB`);

console.log(`\n  #  t(s)    ms  calls  sh  Δgeo Δtex prog`);
const rows = L.filter((r, i) => r.ms >= 25 || r.mark || i < 3);
for (const r of rows.slice(-Number(arg('tail', 40)))) {
  const i = L.indexOf(r);
  const pg = i ? L[i - 1].geo : 0, pt = i ? L[i - 1].tex : 0;
  console.log(`${String(r.f).padStart(3)} ${((r.t) / 1000).toFixed(2).padStart(6)} ${String(r.ms).padStart(6)} ${String(r.c).padStart(7)} ${String(r.sh).padStart(3)} ${String(Math.max(0, r.geo - pg)).padStart(6)} ${String(Math.max(0, r.tex - pt)).padStart(5)} ${String(r.prog).padStart(4)}  ${r.mark || ''}`);
}
