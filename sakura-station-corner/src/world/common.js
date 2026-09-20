// 地图层共用工具：有厚度的地块 / 路缘 / 条带
import * as THREE from 'three';
import { grp, mesh, box, rbox, insideClip, clipRun, clipRect, clipBounds } from '../core/kit.js';
import { TEX } from '../core/textures.js';
export { retile, surface, wallX, wallZ, slab, insideClip, clipRun, clipRect, clipBounds } from '../core/kit.js';

/**
 * 路面ひらがな文字。1 文字 1 枚の透明プレートを車道に寝かせる。
 *
 * 進行方向を向いた運転手が下から上へ読めるよう、文字の「上」を車の進行向きに
 * 回す。ここをサボると（以前は全文字 -Z 向きに固定だった）東西道路の文字が
 * 横倒しに並んで、路上のただの模様に見えていた。
 *
 * @param {THREE.Group} g 追加先
 * @param {string} chars 読む順に並べた文字列
 * @param {object} o { axis:'x'|'z', at, from, step, size, y, travel, fg }
 */
export function roadWord(g, chars, { axis = 'x', at, from, step = 0.72, size = 0.62, y = 0.008, travel = -1, fg = 'rgba(246,243,236,0.86)' }) {
  const ux = axis === 'x' ? travel : 0;
  const uz = axis === 'z' ? travel : 0;
  const phi = Math.atan2(-ux, -uz);
  const geo = new THREE.PlaneGeometry(size, size);
  for (let i = 0; i < chars.length; i++) {
    const c = from + i * step;
    const x = axis === 'x' ? c : at;
    const z = axis === 'x' ? at : c;
    if (!insideClip(x, z)) continue;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: TEX.signboard({ text: chars[i], bg: 'rgba(0,0,0,0)', fg, size: 200 }),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }));
    m.rotation.set(-Math.PI / 2, 0, phi);
    m.position.set(x, y, z);
    m.renderOrder = 4;
    g.add(m);
  }
  return g;
}

/** 轴对齐地块：由两个角点定义，顶面在 yTop，厚度 th */

/** 沿 X 方向的条带（路缘石、标线、白线） */
export function stripX(x0, x1, z, yTop, w, th, mat, o = {}) {
  return slab(x0, x1, z - w / 2, z + w / 2, yTop, th, mat, o);
}
/** 沿 Z 方向的条带 */
export function stripZ(z0, z1, x, yTop, w, th, mat, o = {}) {
  return slab(x - w / 2, x + w / 2, z0, z1, yTop, th, mat, o);
}

/**
 * 路缘石：沿路径排布的一段段石材（每段独立 Mesh，接缝真实）
 * @param axis 'x' 表示沿 X 延伸
 */
export function curbRun(axis, from, to, at, mat, { y = 0.15, h = 0.18, w = 0.16, seg = 1.99, gap = 0.012, name = 'curb' } = {}) {
  const g = grp(name);
  const len = Math.abs(to - from);
  const n = Math.max(1, Math.round(len / seg));
  const step = len / n;
  const dir = to > from ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const c = from + dir * (i + 0.5) * step;
    if (!insideClip(axis === 'x' ? c : at, axis === 'x' ? at : c)) continue;   // 框外的路缘段不生成
    const blk = mesh(rbox(step - gap, h, w, 0.014, 2), mat, {
      pos: axis === 'x' ? [c, y - h / 2, at] : [at, y - h / 2, c],
      cast: true,
      receive: true,
    });
    if (axis === 'z') blk.rotation.y = Math.PI / 2;
    g.add(blk);
  }
  return g;
}

/** 重复小件（沿 X 或 Z 等距排布，逐个独立对象）；cb(i, 坐标, t) 返回 Object3D */
export function repeats(axis, from, to, spacing, cb, name = 'repeats') {
  const g = grp(name);
  const n = Math.max(1, Math.floor(Math.abs(to - from) / spacing));
  const dir = to > from ? 1 : -1;
  for (let i = 0; i <= n; i++) {
    const c = from + dir * i * spacing;
    const o = cb(i, c, n ? i / n : 0);
    if (!o) continue;
    if (axis === 'x') {
      if (o.position.x === 0) o.position.x = c;
    } else if (o.position.z === 0) {
      o.position.z = c;
    }
    // 等距小件（侧沟盖・标线・横断歩道条・枕木…）逐个判定：
    // 铺面走 surface/slab 已经被裁剪框管住，但这些是逐件 mesh()，绕过那道判定，
    // 于是一排盖板会一路铺到台座外面去 —— 这就是「地面还是没切掉」的可见来源。
    if (!insideClip(o.position.x, o.position.z)) continue;
    g.add(o);
  }
  return g;
}

export const Y = {
  road: 0.0,
  walk: 0.15,
  floor: 0.12,
  plat: 0.72,
  railTop: -0.30,
  ballast: -0.42,
  ground: 0.0,
};

/** 把几何 UV 按世界尺寸重新铺排（共享材质的贴图 repeat 保持 1，靠 UV 实现无缝平铺） */

/**
 * 水平铺面：一个带世界尺度 UV 的平面（顶面朝上）
 * @param mat 材质（贴图需为 RepeatWrapping）
 * @param tile 贴图一个循环对应的米数
 */

/** 垂直铺面（墙/站台立面）：沿 X 延伸，高 h，朝 +Z 或 -Z */
/** 垂直铺面：沿 Z 延伸，朝 +X 或 -X */
