import { chromium } from 'playwright';
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.ready', { timeout: 60000 });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const src = document.getElementById('stage');
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  const pts = {
    road: [0.42, 0.72],
    walk: [0.30, 0.60],
    plate: [0.5, 0.35],
    sky: [0.5, 0.06],
    platform: [0.62, 0.40],
    trench: [0.55, 0.50],
  };
  const out = {};
  for (const [k, [u, v]] of Object.entries(pts)) {
    const x = Math.floor(u * c.width), y = Math.floor((1 - v) * c.height);
    const d = g.getImageData(x, y, 1, 1).data;
    out[k] = [d[0], d[1], d[2]];
  }
  // 全图直方图（16 分箱）
  const img = g.getImageData(0, 0, c.width, c.height).data;
  const hist = new Array(16).fill(0);
  let sum = 0, n = 0;
  for (let i = 0; i < img.length; i += 4 * 37) {
    const l = (img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114) / 255;
    hist[Math.min(15, Math.floor(l * 16))]++;
    sum += l; n++;
  }
  return { out, mean: +(sum / n).toFixed(3), hist: hist.map((h) => +(h / n).toFixed(3)) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
