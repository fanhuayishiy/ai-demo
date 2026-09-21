// 提交层静态合并：建模层一个零件都没少，只是把「同一批要一起画掉的东西」烘进同一个 buffer。
//
// 为什么必须做：本场景是 draw-call bound，不是三角形 bound。
// 实测 Chrome/ANGLE 下每次 CPU 提交约 8.8–10.7 µs，hero 视口 7641 次提交 = 62 ms，
// 而把分辨率从 1600×900 降到 400×300 只从 77 ms 掉到 65 ms —— 瓶颈在主线程排队提交，
// 不在着色。autoInstance 已经把「同几何+同材质」的重复件折叠成 InstancedMesh，
// 剩下的全是**形状各不相同**的零件（一根横梁、一块面板、一颗螺栓），
// 它们各自占一次提交，谁都合并不了 —— 除了「同材质的零件并成一个几何体」。
//
// 与 AGENT.md §27 的关系（原文则上写的是「不合并网格」）：
//   · 资产文件、build() 建模、逐件细节、程序化贴图全部不变；
//   · 合并只发生在**装配完成之后**，是提交层的批处理，不是建模层的简化；
//   · 每条零件的三角形数据原样进入 buffer（顶点数不变、精度不变、不 decimate）。
//
// 代价（如实记录）：合并后单个零件不能再独立隐藏 —— LOD 的粒度从「件」变成「尺寸带」。
// 为此每个合并体带 userData.lodSize = 其成员里最大的那个零件尺寸，
// LOD 只有在「这一带所有成员本来都会被剔除」时才整块隐藏，所以远景不会多出画面，
// 近景会比合并前多画一点本来已被剔除的微小件（它们屏幕上小于阈值，看不出来）。
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { traceMark, IS_FLAT } from './style.js';

/** 与 autoInstance 同一套「必须保持独立」的名字黑名单（外加描边壳） */
const SKIP_NAME = /#shine|decal|screen|lens|bulb|#hull/i;
/** 带这些 userData 标记的零件要逐件开关/摆动/换材质，不能被吸收 */
const FLAG_KEYS = ['breathe', 'signalLamp', 'sway', 'glassShine', 'noInstancing', 'noMerge'];
const isAnimatedFlagged = (ud) => !!ud && FLAG_KEYS.some((k) => ud[k]);

/**
 * 几何体的「可并性」签名：属性集合 + 每种属性的 itemSize + 有无索引 + morph 情况。
 * mergeGeometries 遇到这些不一致会 console.error 并返回 null，
 * 所以提前按它分桶，而不是等它失败。
 */
function geoSig(g) {
  let s = '';
  for (const k in g.attributes) {
    const a = g.attributes[k];
    if (a.isInstancedBufferAttribute) return null;      // 实例属性混进合并体 = 语义错乱
    s += k + a.itemSize + (a.normalized ? 'n' : '') + ',';
  }
  const morph = Object.keys(g.morphAttributes || {});
  return s + '|' + (g.index ? 'i' : '') + '|' + (morph.length ? 'M' + morph.length + (g.morphTargetsRelative ? 'r' : '') : '');
}

/**
 * @param world 装配完成的世界根（含 map / assets 两个图层）
 * @param o { min = 3, bands = 4 }
 *   min   ：少于这么件就不值得并（并一次要克隆+拼接，3 件起才有净收益）
 *   bands ：每个资产内按零件尺寸分几档；1 = 一档到底（提交最少），越大远景省得越多
 */
export function mergeStatic(world, o = {}) {
  const t0 = performance.now();
  const min = o.min ?? 3;
  const bands = Math.max(1, o.bands ?? 4);
  const stats = {
    bands,
    units: 0,
    mergedBuffers: 0,
    cands: 0,
    partsMerged: 0,
    partsKept: 0,
    tris: 0,
    verts: 0,
    failed: 0,
    skip: {},
    top: [],
    ms: 0,
  };
  const bump = (k) => { stats.skip[k] = (stats.skip[k] || 0) + 1; };

  const sizeVec = new THREE.Vector3();
  const scaleVec = new THREE.Vector3();
  /** 与 core/lod.js 完全同款的「零件世界尺寸」 */
  function worldSize(n, g) {
    if (!g.boundingBox) g.computeBoundingBox();
    g.boundingBox.getSize(sizeVec);
    n.getWorldScale(scaleVec);
    return Math.max(sizeVec.x * scaleVec.x, sizeVec.y * scaleVec.y, sizeVec.z * scaleVec.z);
  }

  /** 该节点（或其任一祖先）是否在动 —— 动的东西一律不并 */
  function animated(node, stopAt) {
    let p = node;
    while (p && p !== stopAt) {
      if (isAnimatedFlagged(p.userData)) return true;
      p = p.parent;
    }
    return false;
  }

  const inv = new THREE.Matrix4();
  const bake = new THREE.Matrix4();

  function mergeUnit(unit) {
    const cands = [];
    const walk = (node) => {
      for (const c of node.children) {
        if (c.isMesh) {
          if (c.isInstancedMesh) continue;                       // 已经是实例批次
          if (c.children.length) { bump('hasChildren'); walk(c); continue; }
          if (c.visible === false) { bump('invisible'); continue; }
          const m = c.material;
          if (!m) { bump('noMaterial'); continue; }
          if (Array.isArray(m)) { bump('materialArray'); continue; }
          if (m.transparent) { bump('transparent'); continue; }
          if (m.blending !== THREE.NormalBlending) { bump('blending'); continue; }
          if (SKIP_NAME.test(c.name || '')) { bump('skipName'); continue; }
          if (isAnimatedFlagged(c.userData)) { bump('flagged'); continue; }
          if (animated(c, unit.parent)) { bump('animated'); continue; }
          const g = c.geometry;
          if (!g || !g.attributes?.position) { bump('noGeo'); continue; }
          if (g.drawRange && (g.drawRange.start !== 0 || g.drawRange.count !== Infinity)) { bump('drawRange'); continue; }
          const sig = geoSig(g);
          if (!sig) { bump('instancedAttr'); continue; }
          const s = worldSize(c, g);
          if (!(s > 0)) { bump('zeroSize'); continue; }
          cands.push({ n: c, g, m, sig, s });
          continue;
        }
        walk(c);
      }
    };
    walk(unit);
    stats.cands += cands.length;
    if (cands.length < min) { stats.partsKept += cands.length; return; }
    stats.units++;

    // 尺寸分档：LOD 是「按零件尺寸从大到小逐个剔除」的，所以同一档里的成员
    // 在任意距离上的去留判定相同 —— 档内合并才不会改变剔除语义。
    cands.sort((a, b) => a.s - b.s);
    const lo = cands[0].s;
    const hi = cands[cands.length - 1].s;
    const ratio = hi > lo ? Math.pow(hi / lo, 1 / bands) : 1.0001;
    const bandOf = (s) => (bands === 1 ? 0 : Math.min(bands - 1, Math.floor(Math.log(s / lo) / Math.log(ratio))));

    const buckets = new Map();
    for (const c of cands) {
      const key = c.m.uuid + '|' + c.sig + '|' + c.n.renderOrder + '|' + (c.n.castShadow ? 1 : 0) + (c.n.receiveShadow ? 1 : 0)
        + '|' + (c.n.frustumCulled ? 1 : 0) + '|' + c.n.layers.mask + '|' + bandOf(c.s);
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { items: [], mat: c.m, size: 0 }));
      b.items.push(c);
      if (c.s > b.size) b.size = c.s;                             // 取档内最大：只有全员该剔才整块剔
    }

    inv.copy(unit.matrixWorld).invert();
    let made = 0;
    for (const b of buckets.values()) {
      if (b.items.length < min) { stats.partsKept += b.items.length; continue; }
      const src = [];
      for (const it of b.items) {
        bake.multiplyMatrices(inv, it.n.matrixWorld);
        src.push(it.g.clone().applyMatrix4(bake));
      }
      const geo = mergeGeometries(src, false);
      if (!geo) {
        stats.failed += b.items.length;
        stats.partsKept += b.items.length;
        for (const s of src) s.dispose();
        continue;
      }
      stats.partsMerged += b.items.length;
      made++;
      const idx = geo.index ? geo.index.count : geo.attributes.position.count;
      stats.tris += idx / 3;
      stats.verts += geo.attributes.position.count;
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      geo.name = 'merged:' + (b.items[0].n.name || unit.name);
      const mesh = new THREE.Mesh(geo, b.mat);
      // 几何已烘到资产局部坐标系 → 合并体自身是恒等变换，不需要任何逐帧矩阵更新。
      mesh.matrixAutoUpdate = false;
      mesh.matrixWorldNeedsUpdate = true;
      mesh.name = (unit.name || 'unit') + '#' + b.items.length;
      mesh.renderOrder = b.items[0].n.renderOrder;
      mesh.castShadow = b.items[0].n.castShadow;
      mesh.receiveShadow = b.items[0].n.receiveShadow;
      mesh.frustumCulled = b.items[0].n.frustumCulled;
      mesh.layers.mask = b.items[0].n.layers.mask;
      mesh.userData = { mergedParts: b.items.length, lodSize: b.size };
      unit.add(mesh);
      for (const it of b.items) {
        if (it.n.parent) it.n.parent.remove(it.n);
        it.n.geometry = null;                                     // 防止误用，真实几何仍被缓存持有
      }
    }
    stats.mergedBuffers += made;
    // 合并体是新塞进来的子节点，而 markStatic 之后父链的 matrixWorldAutoUpdate 全是 false ——
    // 渲染循环里那次 scene.updateMatrixWorld() 摸不到它们。这里强制烘一次，
    // 否则它们会带着恒等矩阵被画到资产原点上（见 core/lod.js markStatic 的注释）。
    if (made) unit.updateMatrixWorld(true);
    if (made) stats.top.push({ unit: unit.name || '(anon)', parts: cands.length, buffers: made });
  }

  // 一次性烘好全树世界矩阵：markStatic 之后逐帧更新已关，这里必须 force。
  world.updateMatrixWorld(true);
  for (const layer of world.children) {
    if (!layer.isObject3D) continue;
    const units = layer.name === 'map' || layer.name === 'assets' ? layer.children : [layer];
    for (const u of units) mergeUnit(u);
  }

  stats.top.sort((a, b) => b.parts - a.parts);
  stats.ms = Math.round(performance.now() - t0);
  return stats;
}

/**
 * 提交层批处理是否启用。?merge=off 关掉整条（同一个构建里能做前后对比 ——
 * 性能结论必须是配对实验），?merge=8 指定尺寸档数。
 * toon 档整条不走：描边壳逐件挂在零件上，合并会让轮廓消失。
 */
export function submissionPassesEnabled() {
  if (!IS_FLAT) return false;
  const p = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('merge') : '';
  return p !== 'off';
}

/** 装配末尾的统一入口：把静止同材质的散件烘成少量 buffer */
export function mergeStaticIfFlat(world, o = {}) {
  if (!submissionPassesEnabled()) return null;
  const p = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('merge') : '') || 'on';
  const t = performance.now();
  const stats = mergeStatic(world, { ...o, bands: Number.isFinite(+p) && +p > 0 ? +p : (o.bands ?? 4) });
  traceMark('misc', `提交层合并 ${stats.mergedBuffers} 个 buffer / 吸收 ${stats.partsMerged} 件`, t);
  return stats;
}
