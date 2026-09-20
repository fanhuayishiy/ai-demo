// 装配耗时剖析：?trace=1 启动，打印每个地图模块 / 资产 / 动效的毫秒与占比
// node tools/boot-trace.mjs [--url=http://127.0.0.1:5173/] [--top=18] [--kind=asset]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const TOP = Number(arg('top', 18));
const KIND = arg('kind', '');

const url = BASE + (BASE.includes('?') ? '&' : '?') + 'trace=1';
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 800, height: 500 } })).newPage();
page.setDefaultTimeout(300000);
const warns = [];
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text()); });
page.on('pageerror', (e) => warns.push('pageerror ' + e.message));
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 500 });
const out = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  let n = 0;
  e.scene.traverse((o) => { if (o.isMesh) n++; });
  // 「首帧成本」：世界刚挂上时前几帧要上传几何/贴图并编译 program，
  // 让出主线程的等待其实全花在这里，所以把它单独量出来，别误判成装配代码慢。
  const t0 = performance.now();
  e.step(1 / 60, 3);
  const cold = Math.round(performance.now() - t0);
  const t1 = performance.now();
  e.step(1 / 60, 3);
  const warm = Math.round(performance.now() - t1);
  return { trace: e.trace, timings: e.timings, mesh: n, coldMs: Math.round(cold / 3), warmMs: Math.round(warm / 3), tex: e.texCacheInfo ? e.texCacheInfo() : null };
});
if (out.tex) {
  const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
  console.log(`贴图缓存 ${out.tex.entries} 项 → 去重后 ${out.tex.sources} 份位图 / ${mb(out.tex.bytes)}（另有 ${out.tex.dupes} 项与别人共用同一份位图，只上传一次）`);
  for (const [fam, b, n] of out.tex.by.slice(0, 12)) console.log(`  ${mb(b).padStart(9)}  ×${String(n).padStart(4)}  ${fam}`);
}
const total = Object.values(out.trace).reduce((a, l) => a + l.reduce((s, x) => s + x[1], 0), 0);
console.log(`到 built：engine ${out.timings.engine} ms → world ${out.timings.world} ms → lod ${out.timings.lod} ms → motion ${out.timings.motion} ms`);
console.log(`首帧 ${out.coldMs} ms/帧（上传+编译）｜热帧 ${out.warmMs} ms/帧｜Mesh ${out.mesh}`);
console.log(`记录到的同步耗时合计 ${(total / 1000).toFixed(2)} s（其余是 let-out 给浏览器的等待）`);
for (const [kind, list] of Object.entries(out.trace)) {
  if (KIND && kind !== KIND) continue;
  const sum = list.reduce((a, x) => a + x[1], 0);
  if (!list.length) continue;
  // 纹理按家族（key 的第一段）聚合：单独一张可能只有 5 ms，但同一族会有几百张
  let rows = list;
  if (kind === 'tex') {
    const g = new Map();
    for (const [label, ms] of list) {
      const fam = label.split('|')[0];
      const e = g.get(fam) || [0, 0];
      e[0] += ms; e[1]++;
      g.set(fam, e);
    }
    rows = [...g].map(([fam, [ms, n]]) => [`${fam} ×${n}`, ms]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  const max = rows[0][1] || 1;
  console.log(`\n== ${kind}：${list.length} 项 / ${(sum / 1000).toFixed(2)} s`);
  for (const [label, ms] of rows.slice(0, TOP)) {
    console.log(`  ${(ms / 1000).toFixed(2).padStart(6)} s  ${'█'.repeat(Math.max(1, Math.round((ms / max) * 28)))}  ${label}`);
  }
}
if (warns.length) console.log('\n警告 ' + warns.length + ' 条（首条）: ' + warns[0].slice(0, 160));
await browser.close();
