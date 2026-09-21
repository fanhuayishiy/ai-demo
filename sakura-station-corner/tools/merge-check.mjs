// 提交层合并体检：读装配期记录的 mergeStats，并按视口实测「合并后还有多少次提交」。
// 用法：node tools/merge-check.mjs [--views=hero,store,interior,corner,top] [--url=http://127.0.0.1:5173/]
// 对比基线：同一构建加 &merge=off 即关掉合并，两次运行的 calls 差就是这一步的收益。
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEWS = arg('views', 'hero,store,interior,corner,station,top').split(',').filter(Boolean);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + (e.message || '').slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 200)); });
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const head = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  const s = e.mergeStats;
  return {
    tier: e.quality?.name,
    shapes: e.shapeStats || null,
    batches: e.batchStats || null,
    stats: s && { ...s, top: s.top.slice(0, 12) },
    objects: (() => { let mesh = 0, im = 0, plain = 0, merged = 0; e.scene.traverse((o) => { if (!o.isMesh) return; mesh++; if (o.isInstancedMesh) im++; else plain++; if (o.userData?.mergedParts) merged += o.userData.mergedParts; }); return { mesh, instanced: im, plain, mergedParts: merged }; })(),
    lod: e.lod?.stats,
  };
});
console.log('档位', head.tier, ' 形状归一', head.shapes ? `Mesh ${head.shapes.meshes} + 批次 ${head.shapes.batches}（实例 ${head.shapes.instances}）→ ${head.shapes.protos} 个原型，落选 ${head.shapes.skipped}` : '（关闭）');
console.log('  跨资产并批', head.batches ? `并了 ${head.batches.buckets} 桶，省 ${head.batches.saved} 次提交` : '（关闭或未命中）');
console.log('  合并', head.stats ? `${head.stats.mergedBuffers} 个 buffer，吸收 ${head.stats.partsMerged} 件（候选 ${head.stats.cands}），未并 ${head.stats.partsKept}，失败 ${head.stats.failed}，耗时 ${head.stats.ms} ms` : '（关闭）');
if (head.stats) {
  console.log('  不并原因：', JSON.stringify(head.stats.skip));
  console.log('  合并体三角形', Math.round(head.stats.tris).toLocaleString('en'), ' 顶点', Math.round(head.stats.verts).toLocaleString('en'));
  console.log('  并得最多的资产：', head.stats.top.map((t) => `${t.unit} ${t.parts}件→${t.buffers}块`).join('，'));
}
console.log('  场景对象', JSON.stringify(head.objects), ' LOD', JSON.stringify(head.lod));

const rows = await page.evaluate(async ({ views }) => {
  const e = window.__DIORAMA__;
  const waitFrames = (ms) => new Promise((res) => { const t0 = performance.now(); const tick = () => (performance.now() - t0 > ms ? res() : requestAnimationFrame(tick)); requestAnimationFrame(tick); });
  const out = [];
  for (const v of views) {
    e.setView(v);
    await waitFrames(1400);
    const t = [];
    let calls = 0, tris = 0;
    for (let i = 0; i < 9; i++) {
      const t0 = performance.now();
      e.renderer.render(e.scene, e.camera);
      t.push(performance.now() - t0);
      calls = e.renderer.info.render.calls;
      tris = e.renderer.info.render.triangles;
    }
    t.sort((a, b) => a - b);
    out.push({ v, calls, tris, ms: +t[t.length >> 1].toFixed(1) });
  }
  return out;
}, { views: VIEWS });
for (const r of rows) console.log(`  ${r.v.padEnd(10)} 提交 ${String(r.calls).padStart(6)}   三角形 ${String(Math.round(r.tris)).padStart(9)}   renderer.render 中位 ${r.ms} ms`);
if (errs.length) console.log('报错/警告：\n  ' + [...new Set(errs)].slice(0, 10).join('\n  '));
await browser.close();
