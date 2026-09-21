// 摆动件合并的等价性证明：合并体画出来的必须和「CPU 逐组转动」是同一个姿态。
// 三步，各查一类错误：
//   ① 静止姿态逐像素对比（把 branch-sway 的 targets 全部 amp=0 后截图）
//      → 查位置 / 逐实例颜色 / 材质变体 / 阴影，这些与旋转无关，且完全无时间依赖；
//   ② 数值对比：随机抽花瓣实例，比较 B·x 与「CPU 组链」的真值
//      → 查 inv / 骨骼号 / premultiply 顺序这类簿记错误；
//   ③ 动起来再对一次（钉住动画时间）→ 残余差异只可能来自两次截图之间的帧数差（1 帧 ≈ 0.4°）。
// 用法：node tools/sway-equiv.mjs [--view=hero]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const VIEW = arg('view', 'hero');
const OUT = resolve('shots/sway-equiv');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});

async function run(tag, url, opts = {}) {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  page.setDefaultTimeout(300000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + (e.message || '').slice(0, 160)));
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });
  const info = await page.evaluate(({ view, freeze, t }) => {
    const e = window.__DIORAMA__;
    e.setView(view);
    // 落樱是独立系统且按 dt 积分位置，两次运行对不齐 → 截图前摘掉，别污染对比
    for (const n of ['petals-air', 'petals-ground']) {
      const o = e.scene.getObjectByName(n);
      if (o) o.visible = false;
    }
    const sway = (e.motion || []).find((m) => m.name === 'branch-sway');
    if (freeze && sway?.handle?.targets) {
      for (const s of sway.handle.targets) { s.amp = 0; s.o.rotation.set(s.base.x, s.base.y, s.base.z); }
    }
    if (typeof t === 'number') e.setAnimTime(t);
    return {
      gpu: !!e.swayGpu,
      batches: e.swayGpu?.batches ?? 0,
      tookFrom: e.swayGpu?.tookFrom ?? 0,
      instances: e.swayGpu?.instances ?? 0,
      groups: e.swayGpu?.groups ?? 0,
    };
  }, { view: VIEW, freeze: !!opts.freeze, t: opts.time });
  await page.waitForTimeout(opts.time != null ? 90 : 1400);
  if (opts.time != null) await page.evaluate((t) => window.__DIORAMA__.setAnimTime(t), opts.time);
  const calls = await page.evaluate(() => {
    const e = window.__DIORAMA__;
    e.renderer.info.reset();
    e.renderer.render(e.scene, e.camera);
    return { calls: e.renderer.info.render.calls, tris: e.renderer.info.render.triangles };
  });
  const file = `${OUT}/${tag}.png`;
  await page.screenshot({ path: file });
  const num = opts.numeric ? await page.evaluate(() => {
    // ② 数值：贴图里第 gi 格的 B，必须等于「该摆动组的 live 世界矩阵 × 合并时烘的静态逆阵」。
    //    槽位错位、行/列写反、忘记乘逆阵，都会在这里以「米」为单位暴露出来。
    const e = window.__DIORAMA__;
    const THREE = e.THREE;
    const world = e.scene.getObjectByName('world');
    const merged = [];
    world.traverse((o) => { if (o.isInstancedMesh && /^sway@/.test(o.name || '')) merged.push(o); });
    if (!merged.length) return { skipped: '没有合并体（?sway=off）' };
    const groups = [];
    world.traverse((n) => { if (n.userData?.sway) groups.push(n); });
    const tex = merged[0].material.userData?.u?.uSwayBones?.value;
    if (!tex) return { skipped: '材质上没有骨骼贴图' };
    const data = tex.image.data;
    const B = new THREE.Matrix4(), want = new THREE.Matrix4(), p = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    const tmp = new THREE.Matrix4();
    let worst = 0, checked = 0, noStatic = 0;
    for (const im of merged) {
      const attr = im.geometry.attributes.aSwayBone;
      if (!attr) continue;
      const step = Math.max(1, Math.floor(im.count / 9));
      for (let i = 0; i < im.count; i += step) {
        const gi = attr.array[i] | 0;
        const g = groups[gi];
        if (!g || !g.userData._swayStaticInv) { noStatic++; continue; }
        B.fromArray(data, gi * 16);
        want.multiplyMatrices(g.matrixWorld, g.userData._swayStaticInv);
        // 取该实例上的一个真实点：局部原点经实例矩阵送到世界，再各自乘一次
        im.getMatrixAt(i, tmp);
        p.set(0, 0, 0).applyMatrix4(tmp);
        a.copy(p).applyMatrix4(B);
        b.copy(p).applyMatrix4(want);
        checked++;
        const d = a.distanceTo(b);
        if (d > worst) worst = d;
      }
    }
    return { checked, worstMetres: +worst.toExponential(2), noStatic, mergedBatches: merged.length, groups: groups.length };
  }) : null;
  await page.close();
  return { tag, ...info, ...calls, file, errs, numeric: num };
}

const a = await run('cpu-still', 'http://127.0.0.1:5173/?sway=off', { freeze: true });
const b = await run('gpu-still', 'http://127.0.0.1:5173/', { freeze: true, numeric: true });
const c = await run('cpu-move', 'http://127.0.0.1:5173/?sway=off', { freeze: false, time: 3.4 });
const d = await run('gpu-move', 'http://127.0.0.1:5173/', { freeze: false, time: 3.4 });
for (const r of [a, b, c, d]) console.log(`${r.tag.padEnd(10)} calls ${String(r.calls).padStart(5)}  tris ${(r.tris / 1e6).toFixed(2)}M  gpu=${r.gpu} 合并 ${r.batches} 批 / 取自 ${r.tookFrom} 批 / 实例 ${r.instances} / 组 ${r.groups}${r.errs.length ? '  ' + r.errs[0] : ''}`);
if (b.numeric) console.log('数值核对：', JSON.stringify(b.numeric));
await browser.close();
console.log(`\n下一步：node tools/img-diff.mjs ${a.file} ${b.file} --out=shots/diff-sway-still.png`);
console.log(`        node tools/img-diff.mjs ${c.file} ${d.file} --out=shots/diff-sway-move.png`);
