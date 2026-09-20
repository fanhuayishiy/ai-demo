// 两张截图逐像素比对：node tools/img-diff.mjs a.png b.png [--crop=x,y,w,h]
// 用途：确认「默认天气」没有把改动前的画面带走 —— 天气系统的 clear 数值是从 core/lighting.js 抄来的，
// 抄错一位肉眼未必看得出，平均通道差能。--crop 用来排掉屏幕控件那一小块（控件每次都不同，那不是画面回归）。
// 图片走 data URL 而不是 file:// —— about:blank 里加载 file:// 会被拦下来，
// onload 永远不触发，脚本就静默挂住（踩过一次）。
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const cropArg = (argv.find((a) => a.startsWith('--crop=')) || '').slice(7).split(',').map(Number).filter(Number.isFinite);
const [fa, fb] = argv.filter((a) => !a.startsWith('--'));
const url = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const br = await chromium.launch({ channel: 'chrome', headless: true });
const p = await br.newPage();
await p.goto('about:blank');
console.log(await p.evaluate(async ([ua, ub, crop]) => {
  const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
  const [ia, ib] = await Promise.all([load(ua), load(ub)]);
  if (ia.width !== ib.width || ia.height !== ib.height) return `尺寸不同 ${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`;
  const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(ia, 0, 0); const A = g.getImageData(0, 0, cv.width, cv.height).data;
  g.clearRect(0, 0, cv.width, cv.height); g.drawImage(ib, 0, 0); const B = g.getImageData(0, 0, cv.width, cv.height).data;
  const [cx, cy, cw, ch] = crop.length === 4 ? crop : [0, 0, cv.width, cv.height];
  let sum = 0, max = 0, big = 0, n = 0;
  for (let y = cy; y < Math.min(ch ? cy + ch : cv.height, cv.height); y++) {
    const row = y * cv.width * 4;
    for (let x = cx; x < Math.min(cx + cw, cv.width); x++) {
      const i = row + x * 4;
      for (let k = 0; k < 3; k++) {
        const d = Math.abs(A[i + k] - B[i + k]);
        sum += d; n++; if (d > max) max = d; if (d > 24) big++;
      }
    }
  }
  return JSON.stringify({ region: `${cw}x${ch}@${cx},${cy}`, meanAbsDiff: +(sum / n).toFixed(2), maxDiff: max, pctPixelsOver24: +(100 * big / (n / 3)).toFixed(2) + '%' });
}, [url(fa), url(fb), cropArg]));
await br.close();
