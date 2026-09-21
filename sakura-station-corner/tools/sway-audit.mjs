// 摆动链体检：花瓣/叶这些「在 sway 组里被逐批画掉」的东西，到底被几层 sway 组套着？
// 决定 GPU 化走哪条路：
//   · 链深 1 → 每个实例只需 (枢轴, 轴, 角度参数)，顶点里做一次 Rodrigues 旋转即可，与 CPU 等价；
//   · 链深 ≥2 → 必须按链依次乘「动画矩阵 × 静态矩阵⁻¹」，等价于实例化蒙皮（工作量大得多）。
// 顺带查：sway 链上有没有缩放（有则 D=G_a·G_s⁻¹ 不是纯旋转，法线要额外处理）。
// 用法：node tools/sway-audit.mjs
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:5173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { timeout: 300000, polling: 500 });

const r = await page.evaluate(() => {
  const e = window.__DIORAMA__;
  const THREE = e.THREE;
  const world = e.scene.getObjectByName('world');
  world.updateMatrixWorld(true);
  const SC = new THREE.Vector3();
  const byDepth = new Map();       // 链深 → { batches, instances, verts }
  const axes = new Map();
  let scaled = 0, groups = 0, maxDepth = 0;
  const paramSpread = { amp: [1e9, -1e9], freq: [1e9, -1e9], lean: [1e9, -1e9] };
  const sample = (k, v) => { const s = paramSpread[k]; if (Number.isFinite(v)) { s[0] = Math.min(s[0], v); s[1] = Math.max(s[1], v); } };

  const walk = (node, chain) => {
    let ch = chain;
    const sw = node.userData?.sway;
    if (sw && node !== world) {
      groups++;
      ch = chain.concat([{ o: node, cfg: sw }]);
      sample('amp', sw.amp); sample('freq', sw.freq); sample('lean', sw.lean);
      axes.set(sw.axis || 'z', (axes.get(sw.axis || 'z') || 0) + 1);
    }
    for (const c of node.children) {
      if (c.isMesh) {
        if (c.isInstancedMesh && ch.length) {
          const key = ch.length;
          maxDepth = Math.max(maxDepth, ch.length);
          let v = byDepth.get(key);
          if (!v) byDepth.set(key, (v = { batches: 0, instances: 0, verts: 0, seen: new Set() }));
          if (!v.seen.has(c.uuid)) { v.seen.add(c.uuid); v.batches++; v.instances += c.count; v.verts += c.count * c.geometry.attributes.position.count; }
          for (const g of ch) {
            g.o.getWorldScale(SC);
            if (Math.abs(SC.x - SC.y) > 1e-4 || Math.abs(SC.x - SC.z) > 1e-4) { scaled++; break; }
          }
        }
        walk(c, ch);
      } else walk(c, ch);
    }
  };
  walk(world, []);
  const rows = [...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([d, v]) => ({ depth: d, batches: v.batches, instances: v.instances, verts: v.verts }));
  return { groups, maxDepth, rows, axes: [...axes.entries()], scaled, paramSpread };
});
console.log(`sway 组 ${r.groups} 个，最深链 ${r.maxDepth} 层，轴分布 ${JSON.stringify(r.axes)}`);
console.log(`参数范围 amp ${r.paramSpread.amp.map((n) => n.toFixed(3)).join('~')} · freq ${r.paramSpread.freq.map((n) => n.toFixed(2)).join('~')} · lean ${r.paramSpread.lean.map((n) => n.toFixed(2)).join('~')}`);
console.log('链深 → 批次 / 实例 / 烘焙顶点：');
for (const x of r.rows) console.log(`  ${x.depth} 层  批次 ${String(x.batches).padStart(5)}  实例 ${String(x.instances).padStart(7)}  顶点 ${x.verts.toLocaleString('en')}`);
await browser.close();
