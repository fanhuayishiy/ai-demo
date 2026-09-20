// 装配表 ↔ 场景对账：列出「PLACEMENT 里有、场景里没有」的资产，并收集页面错误。
// 为什么需要它：placement.js 用 .catch(() => {}) 吞掉构建异常，而 check-assets.mjs 跑在
// Node（HAS_DOM === false）—— 所有 canvas 绘制代码一行都不执行。于是浏览器里一句
// ReferenceError 就会让整台资产静默消失，而 npm run check 依然全绿（实测丢过整列电车）。
//   node tools/check-placed.mjs [--url=http://127.0.0.1:5173/]
// 取景框（plan.js 的 CROP）之外的条目本来就该缺席，所以这个工具报的是「候选」，
// 需要逐条判断是被裁掉了还是构建失败了 —— 缺的如果是电线杆，务必顺带检查挂在其上的电线。

import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage();
p.setDefaultTimeout(300000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await p.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 300, timeout: 300000 });
const r = await p.evaluate(async () => {
  const e = window.__DIORAMA__;
  const have = new Set();
  e.scene.traverse((o) => { if (o.name) have.add(o.name); });
  const mod = await import('/src/world/placement.js');
  const all = (mod.PLACEMENT || []).map((row) => row[5]).filter(Boolean);
  return { want: all.length, missing: all.filter((n) => !have.has(n)), meshes: (() => { let k = 0; e.scene.traverse((o) => { if (o.isMesh) k++; }); return k; })() };
});
console.log('meshes:', r.meshes, ' 装配条目:', r.want, ' 场景中缺失:', r.missing.length);
if (r.missing.length) console.log('缺失清单:', r.missing.join(', '));
if (errs.length) { console.log('页面错误:'); for (const e of errs.slice(0, 12)) console.log('  ', e.slice(0, 300)); }
await b.close();
