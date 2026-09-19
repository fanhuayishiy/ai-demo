// 判定瓶颈在 CPU 提交还是 GPU 填充：同一画面只改渲染分辨率，看 renderer.render 怎么动。
// 用法：node tools/fill-test.mjs [--view=hero] [--sizes=400x300,800x600,1600x900,2400x1350]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const SIZES = arg('sizes', '400x300,800x600,1600x900,2400x1350').split(',');

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
if (arg('view', 'hero') !== 'none') await page.evaluate((v) => window.__DIORAMA__.setView(v), arg('view', 'hero'));
await page.waitForTimeout(1500);

console.log(await page.evaluate(async ({ sizes }) => {
  const e = window.__DIORAMA__;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const lines = [];
  for (const s of sizes) {
    const [w, h] = s.split('x').map(Number);
    e.renderer.setSize(w, h, false);
    e.camera.aspect = w / h;
    e.camera.updateProjectionMatrix();
    e.fx.composer.setSize(w, h);
    await wait(400);
    const t = [];
    for (let i = 0; i < 8; i++) { const a = performance.now(); e.renderer.render(e.scene, e.camera); t.push(performance.now() - a); }
    const tf = [];
    for (let i = 0; i < 8; i++) { const a = performance.now(); e.fx.composer.render(0.016); tf.push(performance.now() - a); }
    lines.push(`${s.padEnd(11)} renderer.render ${String(+med(t).toFixed(1)).padStart(6)} ms   含后期 ${String(+med(tf).toFixed(1)).padStart(6)} ms   calls ${e.renderer.info.render.calls}`);
  }
  e.renderer.setSize(1600, 900, false);
  e.camera.aspect = 1600 / 900;
  e.camera.updateProjectionMatrix();
  e.fx.composer.setSize(1600, 900);
  await wait(300);
  // 再测「只画一次全屏四边形」的下限：把整个 world 藏掉
  const world = e.scene.getObjectByName('world');
  world.visible = false;
  const t0 = [];
  for (let i = 0; i < 8; i++) { const a = performance.now(); e.renderer.render(e.scene, e.camera); t0.push(performance.now() - a); }
  world.visible = true;
  lines.push(`空场景       renderer.render ${String(+med(t0).toFixed(1)).padStart(6)} ms  ← 固定开销（清屏/环境/驱动）`);
  return lines.join('\n');
}, { sizes: SIZES }));
await browser.close();
