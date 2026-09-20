// 公网延迟下的启动墙钟：本地静态服务 + 给每个 JS chunk 人为加 N ms 往返。
// 为什么要这个：localhost 的 dist 测出 7.9 s，同一份产物推到 GitHub Pages 变成 36 s，
// 差的全是「103 个 chunk 串行 await 的往返次数」。只有把延迟加回去才能在本地复现。
// node tools/net-lag.mjs --root=dist-a [--lag=120] [--runs=3]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const ROOT = resolve(arg('root', 'dist-a'));
const LAG = Number(arg('lag', 120));
const RUNS = Number(arg('runs', 3));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

const server = createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = join(ROOT, rel === '/' ? 'index.html' : rel);
  // 只允许 ROOT 内的文件（工具只跑本地产物，仍然把路径穿越挡掉）
  if (!resolve(file).startsWith(ROOT + sep) && resolve(file) !== ROOT) { res.writeHead(403).end(); return; }
  stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('404'); return; }
    const delay = extname(file) === '.js' ? LAG : 0;
    readFile(file, (e2, buf) => {
      if (e2) { res.writeHead(500).end(); return; }
      setTimeout(() => {
        res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(buf);
      }, delay);
    });
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const rows = [];
for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 500 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(300000);
  let reqs = 0;
  page.on('request', (r) => { if (r.url().endsWith('.js')) reqs++; });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
  const wall = (Date.now() - t0) / 1000;
  const t = await page.evaluate(() => window.__DIORAMA__.timings);
  rows.push({ wall, world: (t.world - t.engine) / 1000 });
  console.log(`  #${i + 1}  到 built ${wall.toFixed(2)} s（世界阶段 ${((t.world - t.engine) / 1000).toFixed(2)} s，JS 请求 ${reqs} 个）`);
  await ctx.close();
}
const kept = rows.slice(1);
console.log(`\n[${arg('root')} + ${LAG} ms/chunk] 丢首轮 ${kept.length} 次：到 built 中位 ${med(kept.map((r) => r.wall)).toFixed(2)} s（世界阶段中位 ${med(kept.map((r) => r.world)).toFixed(2)} s）`);
await browser.close();
server.close();
