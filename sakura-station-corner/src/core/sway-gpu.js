// 摆动件的提交层合并：把「每根枝条各自画一批花瓣」变成「整棵树一个批次，摆动在顶点里应用」。
//
// 为什么樱花是最大的一块：实测 hero 视锥内 1028 次提交来自摆动子树里的实例批次（占全场 20%），
// 因为花瓣按枝条分组，每个摆动组 × 每种(几何,材质)就是一个批次，而批次就是一次提交。
// 跨组并批过去做不到 —— 组一转动，组里的零件就得跟着转，而合并后它们不在同一个组里了。
//
// 解法不需要把风的公式搬进 GPU（那是另一套动画，很难对齐，也不该由着色器决定）：
//   设某摆动组静态时的世界矩阵 W_s、当前世界矩阵 W_a，令 B = W_a · W_s⁻¹。
//   顶点静止世界位置 x = W_s·R·p，摆动后应为 W_a·R·p = B·x —— **恒等式**，与链深无关，
//   因为祖先组的运动本来就叠在 W_a / W_s 里，所以每个实例只需要一个骨骼号。
//   动画仍在 CPU 上跑（branch-sway 照旧改 257 个组的 rotation），每帧只多 257 次矩阵乘，
//   搬进 GPU 的只是「把变换应用到顶点上」这一步。
//
// B 是含平移的完整仿射阵（绕枝根的旋转 = 旋转 + 平移），所以位置乘一次就够；
// 缩放会自己约掉（W = T·R·S ⇒ W_a·W_s⁻¹ = T·R_a·R_s⁻¹·T⁻¹），因此它始终是纯旋转，法线无需逆转置。
// 阴影走同一条变换：给合并体配 customDepthMaterial，否则树影会停在静止姿态。
import * as THREE from 'three';
import { IS_FLAT } from './style.js';
import { toon, patchSwayShader } from './toon.js';

const SKIP_NAME = /#shine|decal|screen|lens|bulb|#hull/i;
const FLAGGED = (ud) => !!(ud && (ud.breathe || ud.signalLamp || ud.glassShine || ud.noInstancing || ud.noSway));

export function installGpuSway(engine, world) {
  if (!IS_FLAT) return null;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('sway') === 'off') return null;
  world.updateMatrixWorld(true);

  /* ---------- 1. 骨骼槽：一个摆动组一格，静态世界矩阵当场烘好 ---------- */
  const groups = [];
  const slot = new Map();
  world.traverse((n) => {
    if (!n.userData?.sway) return;
    slot.set(n, groups.length);
    const inv = new THREE.Matrix4().copy(n.matrixWorld).invert();
    // 把静态世界矩阵留在组上：tools/sway-equiv.mjs 用它独立重算 B，
    // 检查贴图里写的确实是「这一组」的增量（槽位写错、转置写反都能被它抓到）。
    n.userData._swayStatic = n.matrixWorld.clone();
    n.userData._swayStaticInv = inv;
    groups.push({ o: n, inv, m: new THREE.Matrix4() });
  });
  if (!groups.length) return null;

  /* ---------- 2. 骨骼贴图：一格 4 个 RGBA32F 纹素 = 一个 mat4 ---------- */
  const TW = Math.max(1, groups.length) * 4;
  const data = new Float32Array(TW * 4);
  const tex = new THREE.DataTexture(data, TW, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const texel = new THREE.Vector2(1 / TW, 1);
  const ID = new THREE.Matrix4();
  for (let i = 0; i < groups.length; i++) data.set(ID.elements, i * 16);   // 先填单位阵，避免第 0 帧读到 0

  const upload = () => {
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      g.m.multiplyMatrices(g.o.matrixWorld, g.inv);
      data.set(g.m.elements, i * 16);
    }
    tex.needsUpdate = true;
  };

  /* ---------- 3. 材质：同一份 spec 派生「带摆动补丁」的缓存变体 ---------- */
  const variants = new Map();
  const swayMat = (m) => {
    if (variants.has(m.uuid)) return variants.get(m.uuid);
    const spec = m.userData && m.userData.spec;
    let v = null;
    if (spec && m.isMeshToonMaterial) {
      v = toon({ ...spec, swayBones: true });
      if (v.userData?.u) {
        v.userData.u.uSwayBones.value = tex;
        v.userData.u.uSwayTexel.value.copy(texel);
      } else v = null;
    }
    variants.set(m.uuid, v);
    return v;
  };
  const depths = new Map();
  const swayDepth = (m) => {
    if (depths.has(m.uuid)) return depths.get(m.uuid);
    const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    d.map = m.map || null;
    d.alphaMap = m.alphaMap || null;
    d.alphaTest = m.alphaTest || 0;
    d.customProgramCacheKey = () => 'swayDepth';
    d.onBeforeCompile = (shader) => patchSwayShader(shader, tex, texel);
    depths.set(m.uuid, d);
    return d;
  };

  /* ---------- 4. 抽出摆动子树里的实例批次，按 树 × 几何 × 材质 合并 ---------- */
  const innerGroup = (o) => { for (let p = o; p && p !== world; p = p.parent) if (p.userData?.sway) return p; return null; };
  const treeOf = (o) => { let p = o; while (p.parent && p.parent !== world) p = p.parent; return p; };
  const im = new THREE.Matrix4();
  const col = new THREE.Color();
  const buckets = new Map();
  const take = [];
  world.traverse((n) => {
    if (!n.isInstancedMesh) return;
    const g = innerGroup(n);
    if (!g) return;
    const m = n.material;
    if (!m || Array.isArray(m) || m.transparent || m.blending !== THREE.NormalBlending) return;
    if (SKIP_NAME.test(n.name || '') || FLAGGED(n.userData)) return;
    const sv = swayMat(m);
    if (!sv) return;
    const bi = slot.get(g);
    const key = `${treeOf(n).uuid}|${n.geometry.uuid}|${m.uuid}|${n.renderOrder | 0}|${n.castShadow ? 1 : 0}${n.receiveShadow ? 1 : 0}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { geo: n.geometry, mat: sv, src: m, order: n.renderOrder | 0, cast: n.castShadow, receive: n.receiveShadow, mats: [], bones: [], cols: null }));
    const tinted = !!n.instanceColor;
    if (tinted && !b.cols) b.cols = [];
    for (let i = 0; i < n.count; i++) {
      n.getMatrixAt(i, im);
      im.premultiply(n.matrixWorld);              // 实例矩阵 → 世界矩阵（合并体挂在 world 下，world 是单位阵）
      b.mats.push(im.clone());
      b.bones.push(bi);
      // 花瓣的疏密变化来自逐实例颜色（inst() 每朵都抖一点色），摘出来时必须带走，
      // 否则整棵树会变成一块均匀的粉。
      if (tinted) b.cols.push(new THREE.Color().copy(n.getColorAt(i, col)));
    }
    take.push(n);
  });
  if (!take.length) return null;
  for (const n of take) if (n.parent) n.parent.remove(n);

  let instances = 0;
  for (const b of buckets.values()) {
    // 逐实例属性只能挂在几何上，而几何是缓存共享的 → 必须给每个桶一份自己的几何，
    // 否则两个桶共用一份几何时后写的 aSwayBone 会覆盖前一个（花瓣会整片转到别的枝上去）。
    const geo = b.geo.clone();
    const bone = new Float32Array(b.bones.length);
    for (let i = 0; i < b.bones.length; i++) bone[i] = b.bones[i];
    geo.setAttribute('aSwayBone', new THREE.InstancedBufferAttribute(bone, 1));
    const mesh = new THREE.InstancedMesh(geo, b.mat, b.mats.length);
    for (let i = 0; i < b.mats.length; i++) {
      mesh.setMatrixAt(i, b.mats[i]);
      if (b.cols) mesh.setColorAt(i, b.cols[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.name = 'sway@' + b.mats.length;
    mesh.renderOrder = b.order;
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.customDepthMaterial = b.cast ? swayDepth(b.src) : null;
    mesh.matrixAutoUpdate = false;
    mesh.matrixWorldNeedsUpdate = true;
    mesh.computeBoundingSphere();
    world.add(mesh);
    instances += b.mats.length;
  }
  upload();
  const scene = engine?.scene;
  if (scene) {
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = (r, s, c, g) => { upload(); if (prev) prev(r, s, c, g); };
  }
  return { groups: groups.length, batches: buckets.size, instances, tookFrom: take.length };
}
