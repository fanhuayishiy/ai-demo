// 两张截图逐像素比对：node tools/img-diff.mjs a.png b.png
// 用途：确认「默认天气」没有把改动前的画面带走 —— 天气系统的 clear 数值是从 core/lighting.js 抄来的，
// 抄错一位肉眼未必看得出，平均通道差能。
// 图片走 data URL 而不是 file:// —— about:blank 里加载 file:// 会被拦下来，
// onload 永远不触发，脚本就静默挂住（踩过一次）。
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [fa, fb] = process.argv.slice(2);
const url = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const br = await chromium.launch({ channel: 'chrome', headless: true });
const p = await br.newPage();
await p.goto('about:blank');
console.log(await p.evaluate(async ([ua, ub]) => {
  const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
  const [ia, ib] = await Promise.all([load(ua), load(ub)]);
  if (ia.width !== ib.width || ia.height !== ib.height) return `尺寸不同 ${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`;
  const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(ia, 0, 0); const A = g.getImageData(0, 0, cv.width, cv.height).data;
  g.clearRect(0, 0, cv.width, cv.height); g.drawImage(ib, 0, 0); const B = g.getImageData(0, 0, cv.width, cv.height).data;
  let sum = 0, max = 0, big = 0, n = 0;
  for (let i = 0; i < A.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const d = Math.abs(A[i + k] - B[i + k]);
      sum += d; n++; if (d > max) max = d; if (d > 24) big++;
    }
  }
  return JSON.stringify({ meanAbsDiff: +(sum / n).toFixed(2), maxDiff: max, pctPixelsOver24: +(100 * big / (n / 3)).toFixed(2) + '%' });
}, [url(fa), url(fb)]));
await br.close();
