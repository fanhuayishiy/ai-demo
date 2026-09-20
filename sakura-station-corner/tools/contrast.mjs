// 画面局部对比度量测：node tools/contrast.mjs <png> [--crop=x,y,w,h]
// 用途：「橱窗起雾 / 店内没对比度」这类主观描述要能证伪。看三个数就够：
//   亮度均值（是否过曝）、标准差（层次）、>248 与 <8 的饱和像素占比（是否糊成一片）。
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const file = process.argv[2];
if (!file) { console.log('用法: node tools/contrast.mjs <png> [--crop=x,y,w,h]'); process.exit(1); }
const c = (process.argv.find((a) => a.startsWith('--crop=')) || '').split('=')[1];
const crop = c ? c.split(',').map(Number) : null;
const b64 = readFileSync(file).toString('base64');

const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 200, height: 200 } })).newPage();
const r = await p.evaluate(async ({ b64, crop }) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d');
  g.drawImage(img, 0, 0);
  const x = crop ? crop[0] : 0, y = crop ? crop[1] : 0;
  const w = crop ? crop[2] : img.width, h = crop ? crop[3] : img.height;
  const d = g.getImageData(x, y, w, h).data;
  const lum = [];
  for (let i = 0; i < d.length; i += 4) lum.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  const n = lum.length;
  const mean = lum.reduce((a, v) => a + v, 0) / n;
  const sd = Math.sqrt(lum.reduce((a, v) => a + (v - mean) ** 2, 0) / n);
  const hi = lum.filter((v) => v > 248).length / n;
  const lo = lum.filter((v) => v < 8).length / n;
  // 16 级灰阶直方图的峰谷分布：层次是否被压到少数几档
  const hist = new Array(16).fill(0);
  for (const v of lum) hist[Math.min(15, Math.floor(v / 16))]++;
  const occ = hist.filter((v) => v > 0).length;
  return { size: `${w}×${h}`, mean: +mean.toFixed(1), sd: +sd.toFixed(1), hi: +(hi * 100).toFixed(1), lo: +(lo * 100).toFixed(1), occ };
}, { b64, crop });
console.log(`${file}${crop ? ` crop=${crop.join(',')}` : ''}  ${r.size}px`);
console.log(`  亮度均值 ${r.mean}  标准差 ${r.sd}  >248 占 ${r.hi}%  <8 占 ${r.lo}%  灰阶占用 ${r.occ}/16`);
await b.close();
