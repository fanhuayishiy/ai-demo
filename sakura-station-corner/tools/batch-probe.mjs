// 机制验证 + 空间粒度扫描：把真实场景的散件按「同材质同状态（×空间格子）」合进 BatchedMesh，
// 量提交数与帧时间怎么动。
// 用法：node tools/batch-probe.mjs [--cells=8,16,32,999] [--cap=128] [--min=3] [--shot=16]
//
// 第一版探针（只按材质合批、不分空间）的结论：吸收 172 件、省 165 次提交，帧时间反而 +2 ms。
// 原因不是 multi-draw 没用，而是**合并体的包围球横跨全场**：原本逐件被视锥裁掉的东西
// 现在每帧都要画。所以合批必须同时按空间格子切 —— 这个脚本就是在找那个格子尺寸的最优点。
// （LOD 的逐件剔除不受影响：BatchedMesh 的 setVisibleAt 会让 multi-draw 少画一段。）
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
// --price：给「整条合批路」定价的上限档。键里去掉颜色与逐件标量（画面一定是错的），
// 只看「提交数掉到几百时帧时间掉不掉」。
// --override：两档都在 scene.overrideMaterial = MeshBasicMaterial 下测，
// 于是着色成本被固定成同一个常数，测出来的差就是「提交本身」能被合批掉多少 ——
// 这是判断「值不值得做逐件颜色合批」的关键实验，不必先把着色器改完。
// --noexplode：不拆 InstancedMesh，只合散件（保住可见集，避免上一版「合并体横跨全场」的失真）
const PRICE = argv.includes('--price');
const OVERRIDE = argv.includes('--override');
const EXPLODE = !argv.includes('--noexplode');

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto('http://127.0.0.1:5173/?bootprobe=1', { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200, timeout: 300000 });
await page.evaluate(() => { const e = window.__DIORAMA__; e.setView('hero'); e.setAnimTime(3.4); });
await page.waitForTimeout(2500);

const run = (cell, cap, minN, shot) => page.evaluate(({ cell, cap, minN, shot, price, override, explode }) => {
  const OVERRIDE = override;
  const e = window.__DIORAMA__, THREE = e.THREE;
  const src = (t) => (t ? (t.source && t.source.uuid ? t.source.uuid : t.uuid) : '-');
  const groups = new Map();
  const loose = [];
  const _m4 = new THREE.Matrix4();
  const push = (o, geo, mat, world) => {
    if (!geo || !geo.attributes.position || !geo.index) return;
    if (/#shine|decal|screen|lens|bulb|#hull/i.test(o.name || '')) return;
    if (['breathe', 'signalLamp', 'sway', 'glassShine', 'noInstancing', 'noMerge'].some((k) => o.userData[k])) return;
    if (['breathe', 'signalLamp', 'sway', 'glassShine'].some((k) => (o.parent && o.parent.userData && o.parent.userData[k]))) return;
    if (mat.transparent || mat.blending !== THREE.NormalBlending) return;
    if (Array.isArray(mat)) return;
    let vis = o.visible !== false;
    for (let p = o.parent; p && vis; p = p.parent) vis = vis && p.visible;
    if (!vis) return;
    loose.push({ o, world });
    // price 模式：键里连颜色与逐件标量都不算，全部用第一个成员的材质 —— 画面一定是错的，
    // 这一档只回答一个问题「提交数掉到几百次时，帧时间到底掉不掉」，也就是整条路的上限。
    const k = [mat.type, mat.side, mat.blending, price ? '' : mat.opacity, price ? '' : mat.color.getHexString(),
      src(mat.map), src(mat.normalMap), price ? '' : (mat.normalScale ? mat.normalScale.x + 'x' + mat.normalScale.y : ''),
      Object.keys(geo.attributes).sort().map((a) => a + geo.attributes[a].itemSize).join(','), geo.index ? 'i' : 'n']
      .filter((x) => x !== '').join('|');
    const key = cell > 0 ? `${k}|${Math.floor(world.elements[12] / cell)},${Math.floor(world.elements[13] / cell)},${Math.floor(world.elements[14] / cell)}` : k;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ o, geo, mat, world });
  };
  e.scene.traverse((o) => {
    if (!o.isMesh || o.userData.__batched) return;
    if (o.isInstancedMesh) {
      if (!price || !explode) return;              // 常规档不动实例批次（它们本来就是 1 次提交画 N 件）
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, _m4); push(o, o.geometry, o.material, _m4.clone().premultiply(o.matrixWorld)); }
      return;
    }
    if (o.children.length) return;
    push(o, o.geometry, o.material, o.matrixWorld.clone());
  });

  const pick = [...groups.values()].filter((a) => a.length >= minN);
  const made = [], hidden = new Map();
  let absorbed = 0, fails = 0;
  for (const items of pick) {
    for (let i = 0; i < items.length; i += cap) {
      const chunk = items.slice(i, i + cap);
      if (chunk.length < minN) continue;
      const uniq = new Map();
      for (const it of chunk) if (!uniq.has(it.geo.uuid) && uniq.size < cap) uniq.set(it.geo.uuid, it.geo);
      let vsum = 0, isum = 0;
      for (const g of uniq.values()) { vsum += g.attributes.position.count; isum += g.index.count; }
      let bm = null;
      try {
        bm = new THREE.BatchedMesh(chunk.length * 2 + 32, vsum * 2 + 1024, isum * 2 + 1024, chunk[0].mat);
      } catch (err) { fails++; continue; }
      const ids = new Map();
      try {
        for (const [u, g] of uniq) ids.set(u, bm.addGeometry(g));
        let used = 0;
        for (const it of chunk) {
          const gid = ids.get(it.geo.uuid);
          if (gid === undefined) continue;
          bm.setMatrixAt(bm.addInstance(gid), it.world);
          if (!it.o.isInstancedMesh) {
            if (it.o.visible === false) continue;                   // 已被别的批次收走
            it.o.visible = false; it.o.userData.__batched = true;
            hidden.set(it.o, true);
          }
          used++;
        }
        if (used < minN) { e.scene.remove(bm); bm.dispose(); continue; }
        bm.castShadow = chunk[0].o.castShadow;
        bm.receiveShadow = chunk[0].o.receiveShadow;
        bm.name = 'probe-batch';
        bm.computeBoundingSphere();
        e.scene.add(bm);
        made.push(bm); absorbed += used;
      } catch (err) { fails++; e.scene.remove(bm); bm.dispose(); }
    }
  }
  e.renderer.shadowMap.needsUpdate = true;
  const measure = () => {
    if (OVERRIDE) e.scene.overrideMaterial = new e.THREE.MeshBasicMaterial();
    e.pause(true); e.step(1 / 60, 8);
    const n = e.frameLog.length; e.step(1 / 60, 20);
    const rows = e.frameLog.slice(n);
    e.pause(false);
    if (OVERRIDE) e.scene.overrideMaterial = null;
    const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
    return { ms: ms[Math.floor(ms.length / 2)], calls: rows[Math.floor(rows.length / 2)].c, tris: Math.round(rows[Math.floor(rows.length / 2)].t / 1e5) / 10 };
  };
  const out = measure();
  out.batches = made.length; out.absorbed = absorbed; out.loose = loose.length; out.fails = fails;
  out.err = window.__probeErr || '';
  // 撤场：把散件放回去、批次删掉，下一档从干净状态开始
  for (const bm of made) { e.scene.remove(bm); bm.dispose(); }
  for (const o of hidden.keys()) { o.visible = true; delete o.userData.__batched; }
  e.renderer.shadowMap.needsUpdate = true;
  return out;
}, { cell: Number(cell), cap: Number(arg('cap', 128)), minN: Number(arg('min', 3)), shot: !!shot, price: !!PRICE, override: OVERRIDE, explode: EXPLODE });

const base = await page.evaluate((ovr) => {
  const e = window.__DIORAMA__;
  if (ovr) e.scene.overrideMaterial = new e.THREE.MeshBasicMaterial();
  e.pause(true); e.step(1 / 60, 8);
  const n = e.frameLog.length; e.step(1 / 60, 20);
  const rows = e.frameLog.slice(n); e.pause(false);
  if (ovr) e.scene.overrideMaterial = null;
  const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
  const r = rows[Math.floor(rows.length / 2)];
  return { ms: Math.round(ms[Math.floor(ms.length / 2)]), calls: r.c, tris: Math.round(r.t / 1e5) / 10 };
}, OVERRIDE);
console.log(`  基线        帧 ${String(base.ms).padStart(4)} ms｜${base.calls} 次提交｜${base.tris}M 三角`);
for (const c of arg('cells', '8,16,32,999').split(',')) {
  const r = await run(c, Number(arg('cap', 128)), Number(arg('min', 3)), arg('shot', '') === c);
  console.log(`  ${PRICE ? 'price ' : ''}格子 ${String(c).padStart(3)} m   帧 ${String(r.ms).padStart(4)} ms（${r.ms - base.ms > 0 ? '+' : ''}${(r.ms - base.ms).toFixed(1)}）｜${String(r.calls).padStart(4)} 次（省 ${base.calls - r.calls}）｜批次 ${r.batches}，吸收 ${r.absorbed}/${r.loose} 件，失败 ${r.fails}`);
  await page.waitForTimeout(500);
}
await browser.close();
