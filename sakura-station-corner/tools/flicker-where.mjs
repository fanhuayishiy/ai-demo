// 频闪定位探针：把 flicker.mjs 的「方向翻转率」拆开看，因为它测的可能是量化的假象。
//
// flicker.mjs 里 means 被 toFixed(1) 量化到 0.1，而 Math.sign(0) === 0，
// 于是「平坦 + 偶尔一个 0.1 台阶」的序列会被判成频繁翻转，「单调漂移」反而判成稳定。
// 所以这里同时给四个口径，并做四种条件，把「动画本身」和「合并引入的逐帧不稳定」分开：
//   A sway=on  动画开   B sway=on  动画冻结（所有摆动组 amp=0）
//   C sway=off 动画开   D sway=off 动画冻结
// 若 A≈C 且 B≈D≈0，则翻转率差异只是采样窗口内的运动量不同，不是回归。
// 另外把采样框切成 3×3，报每一格的逐帧变化像素占比 —— 指明变化发生在画面哪里。
// 用法：node tools/flicker-where.mjs [--frames=40] [--clip=560,300,480,300]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const FRAMES = Number(arg('frames', 40));
const [CX, CY, CW, CH] = arg('clip', '560,300,480,300').split(',').map(Number);

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});

async function run(tag, swayOn, freeze) {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  page.setDefaultTimeout(280000);
  await page.goto(`http://127.0.0.1:5173/?sample${swayOn ? '' : '&sway=off'}`, { waitUntil: 'commit' });
  await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 240000, polling: 500 });
  const r = await page.evaluate(({ FRAMES, CX, CY, CW, CH, freeze }) => new Promise((res) => {
    const e = window.__DIORAMA__;
    if (freeze) {
      const sw = (e.motion || []).find((m) => m.name === 'branch-sway');
      if (sw?.handle?.targets) for (const s of sw.handle.targets) { s.amp = 0; s.o.rotation.set(s.base.x, s.base.y, s.base.z); }
    }
    const gl = e.renderer.getContext();
    const y0 = Math.max(0, e.renderer.domElement.height - CY - CH);
    const n = CW * CH;
    const buf = new Uint8Array(n * 4);
    const L = (f, p) => 0.299 * f[p] + 0.587 * f[p + 1] + 0.114 * f[p + 2];
    const shots = [];
    let i = 0;
    const tick = () => {
      gl.readPixels(CX, y0, CW, CH, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      // 同时存「全精度均值」和「按 flicker.mjs 的 toFixed(1) 口径」
      let s = 0;
      for (let p = 0; p < buf.length; p += 4) s += L(buf, p);
      shots.push({ raw: s / n, rounded: +(s / n).toFixed(1), px: buf.slice() });
      if (++i < FRAMES) return requestAnimationFrame(tick);

      const raw = shots.map((x) => x.raw);
      const rnd = shots.map((x) => x.rounded);
      const flip = (arr) => {
        let alt = 0, tot = 0, zero = 0;
        for (let k = 2; k < arr.length; k++) {
          const a = arr[k - 1] - arr[k - 2], b = arr[k] - arr[k - 1];
          if (a === 0 || b === 0) { zero++; continue; }        // 把「零差」单独数出来
          tot++;
          if (Math.sign(b) !== Math.sign(a)) alt++;
        }
        return { flip: +(alt / Math.max(1, tot)).toFixed(2), zero, n: tot };
      };
      // 逐帧变化像素占比 + 3×3 分格
      const cell = (gx, gy) => {
        const x0 = Math.floor(gx * CW / 3), x1 = Math.floor((gx + 1) * CW / 3);
        const y0i = Math.floor(gy * CH / 3), y1i = Math.floor((gy + 1) * CH / 3);
        let changed = 0, all = 0, sumAbs = 0;
        for (let k = 1; k < shots.length; k++) {
          const A = shots[k - 1].px, B = shots[k].px;
          for (let y = y0i; y < y1i; y++) for (let x = x0; x < x1; x++) {
            const p = (y * CW + x) * 4;
            const d = Math.abs(L(B, p) - L(A, p));
            all++; sumAbs += d; if (d > 8) changed++;
          }
        }
        return { chgPct: +(100 * changed / Math.max(1, all)).toFixed(2), meanAbs: +(sumAbs / Math.max(1, all)).toFixed(3) };
      };
      const grid = [];
      for (let gy = 0; gy < 3; gy++) { const row = []; for (let gx = 0; gx < 3; gx++) row.push(cell(gx, gy)); grid.push(row); }
      let dmax = 0, dsum = 0, dn = 0;
      for (let k = 1; k < raw.length; k++) { const d = Math.abs(raw[k] - raw[k - 1]); dmax = Math.max(dmax, d); dsum += d; dn++; }
      res({
        fps: Math.round(e.stats.fps),
        rawRange: +(Math.max(...raw) - Math.min(...raw)).toFixed(3),
        dMean: +(dsum / dn).toFixed(4), dMax: +dmax.toFixed(4),
        flipRaw: flip(raw), flipRounded: flip(rnd),
        grid,
      });
    };
    requestAnimationFrame(tick);
  }), { FRAMES, CX, CY, CW, CH, freeze });
  await page.close();
  return { tag, ...r };
}

const A = await run('A sway=on  动画开', true, false);
const B = await run('B sway=on  冻结', true, true);
const C = await run('C sway=off 动画开', false, false);
const D = await run('D sway=off 冻结', false, true);
for (const r of [A, B, C, D]) {
  console.log(`\n${r.tag}   fps ${r.fps}`);
  console.log(`  均值全精度极差 ${r.rawRange}  相邻帧 |Δ| mean ${r.dMean} max ${r.dMax}`);
  console.log(`  翻转率(全精度) ${r.flipRaw.flip}  [零差样本 ${r.flipRaw.zero}/${r.flipRaw.n}]`);
  console.log(`  翻转率(toFixed(1) 口径) ${r.flipRounded.flip}  [零差样本 ${r.flipRounded.zero}/${r.flipRounded.n}]`);
  console.log('  3×3 分格：逐帧变化像素占比 %（>8 级）');
  for (const row of r.grid) console.log('    ' + row.map((c) => String(c.chgPct).padStart(6)).join('  ') + '     | 平均亮度差 ' + row.map((c) => c.meanAbs.toFixed(2)).join(' '));
}
await browser.close();
