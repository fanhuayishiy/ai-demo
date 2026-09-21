// 拉近探针：装配稳定后（A）瞬移到店内、（B）用真实滚轮事件无级推进，各量「新露出的零件补上传」的尖峰。
// 用法：node tools/zoom-hitch.mjs [--url=...] [--views=store,interior] [--mode=both|teleport|wheel]
//
// 为什么要单独量：LOD 安装时立刻剔除（?lodtick）让启动少了 ~2 s，但被隐藏的那些零件
// 也就没在第一帧被上传过。用户拖到近景时它们第一次进 GPU，可能换来一次卡顿 ——
// 省下的时间不能只是搬到别处收。瞬移是最坏情况，滚轮才是用户实际会做的事。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:5173/');
const MODE = arg('mode', 'both');
const url = BASE + (BASE.includes('?') ? '&' : '?') + 'bootprobe=1';

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
await page.waitForTimeout(2500);

const snap = () => page.evaluate(() => ({ n: window.__DIORAMA__.frameLog.length, geo: window.__DIORAMA__.renderer.info.memory.geometries, tex: window.__DIORAMA__.renderer.info.memory.textures }));
const since = (s) => page.evaluate((s) => {
  const e = window.__DIORAMA__, rows = e.frameLog.slice(s.n);
  const g = e.renderer.info.memory, ms = rows.map((x) => x.ms);
  return { frames: rows.length, warm: Math.round(ms.reduce((a, b) => a + b, 0) / (ms.length || 1)), peak: Math.max(0, ...ms), p90: ms.slice().sort((a, b) => a - b)[Math.floor(ms.length * 0.9)] ?? 0, worst: [...rows].sort((a, b) => b.ms - a.ms).slice(0, 3).map((x) => `${x.ms}ms/${x.c}c`), dGeo: g.geometries - s.geo, dTex: g.textures - s.tex };
}, s);

for (const v of arg('views', 'store,interior').split(',')) {
  if (MODE !== 'wheel') {
    const r = await page.evaluate((view) => {
      const e = window.__DIORAMA__;
      e.pause(true);
      e.step(1 / 60, 6);
      const warm = e.frameLog.slice(-6).map((x) => x.ms);
      const n = e.frameLog.length;
      const geo0 = e.renderer.info.memory.geometries, tex0 = e.renderer.info.memory.textures;
      e.setView(view);
      e.step(1 / 60, 20);
      const after = e.frameLog.slice(n);
      e.pause(false);
      return {
        view, warm: Math.round(warm.reduce((a, b) => a + b, 0) / warm.length), peak: Math.max(...after.map((x) => x.ms)),
        calls: after[after.length - 1].c, dGeo: e.renderer.info.memory.geometries - geo0, dTex: e.renderer.info.memory.textures - tex0,
      };
    }, v);
    console.log(`  ${r.view.padEnd(9)} 瞬移   稳态 ${String(r.warm).padStart(3)} ms → 峰值 ${String(r.peak).padStart(5)} ms   绘制 ${r.calls} 次，补传 几何 +${r.dGeo} 贴图 +${r.dTex}`);
    await page.waitForTimeout(1200);
  }
  if (MODE !== 'teleport') {
    await page.evaluate((view) => { const e = window.__DIORAMA__; e.setView('hero'); }, v);
    await page.waitForTimeout(1200);
    const s = await snap();
    await page.mouse.move(800, 450);
    for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(45); }
    await page.waitForTimeout(600);
    const r = await since(s);
    console.log(`  ${v.padEnd(9)} 滚轮推进 ${r.frames} 帧  均值 ${String(r.warm).padStart(3)} ms｜p90 ${String(r.p90).padStart(4)} ms｜峰值 ${String(r.peak).padStart(5)} ms   最尖三帧 ${r.worst.join(' ')}   补传 几何 +${r.dGeo} 贴图 +${r.dTex}`);
    await page.evaluate((view) => window.__DIORAMA__.setView('hero'), v);
    await page.waitForTimeout(1200);
  }
}
await browser.close();
