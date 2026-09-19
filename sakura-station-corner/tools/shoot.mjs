// 多机位实拍校验工具：node tools/shoot.mjs [--url=...] [--views=hero,store] [--out=shots] [--w=1600] [--h=900]
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

const BASE = arg('url', 'http://127.0.0.1:5173/');
const W = Number(arg('w', 1600));
const H = Number(arg('h', 900));
const OUT = resolve(arg('out', 'shots'));
const VIEWS = arg('views', 'hero').split(',').filter(Boolean);
const WAIT = Number(arg('wait', 2600));
const CHANNEL = arg('channel', 'chrome');
const CONSOLE = arg('console', '1') === '1';

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: CHANNEL,
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--no-sandbox',
    `--window-size=${W},${H}`,
  ],
});

const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: Number(arg('dsf', 1)),
  reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
page.setDefaultTimeout(300000);

const errors = [];
const warns = [];
page.on('console', (msg) => {
  const t = msg.type();
  const txt = msg.text();
  if (t === 'error') errors.push(txt);
  else if (t === 'warning') warns.push(txt);
  else if (CONSOLE && t === 'log') console.log('  [log]', txt);
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e.message || String(e))));

for (let attempt = 0; attempt < 4; attempt++) {
  try {
    await page.goto(BASE, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 150000, polling: 500 });
    break;
  } catch (e) {
    console.log('  retry', attempt, String(e.message).split('\n')[0]);
    if (attempt === 3) throw e;
    await page.waitForTimeout(4000);
  }
}

const info = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  return {
    size: [innerWidth, innerHeight],
    drawBuf: e.renderer.getDrawingBufferSize(new e.THREE.Vector2()).toArray(),
    objects: countAll(e.scene),
    missing: e.missing || null,
    calls: e.stats.calls,
    tris: e.stats.tris,
    fps: Math.round(e.stats.fps),
    gl: e.renderer.getContext().getParameter(0x1f01) + ' / ' + e.renderer.getContext().getParameter(0x1f00),
  };
  function countAll(o) {
    let n = 0, mesh = 0, hull = 0;
    o.traverse((x) => { n++; if (x.isMesh) { mesh++; if (x.userData.isHull) hull++; } });
    return { n, mesh, hull };
  }
});
console.log('scene:', JSON.stringify(info));

for (const v of VIEWS) {
  await page.evaluate((name) => window.__DIORAMA__.setView(name), v);
  await page.waitForTimeout(WAIT);
  const file = `${OUT}/${v}.png`;
  await page.screenshot({ path: file });
  console.log('shot ->', file);
}

const post = await page.evaluate(() => ({ fps: Math.round(window.__DIORAMA__.stats.fps), calls: window.__DIORAMA__.stats.calls, tris: window.__DIORAMA__.stats.tris }));
console.log('perf:', JSON.stringify(post));

if (warns.length) {
  const uniq = [...new Set(warns.map((w) => w.split('\n')[0].slice(0, 160)))];
  console.log(`\nwarnings (${warns.length}, ${uniq.length} unique):`);
  for (const w of uniq.slice(0, 25)) console.log('  !', w);
}
if (errors.length) {
  const uniq = [...new Set(errors)];
  console.log(`\nERRORS (${errors.length}, ${uniq.length} unique):`);
  for (const w of uniq.slice(0, 6)) console.log('  x', w.slice(0, 4000));
}

await browser.close();
process.exit(errors.length ? 1 : 0);
