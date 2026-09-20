// 几何 / 组装工具集 —— 所有资产模块共享的低层积木
import * as THREE from 'three';
import { IS_FLAT } from './style.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TEX, mulberry32 } from './textures.js';
import { MAT } from './materials.js';

const geoCache = new Map();
function cachedGeo(key, factory) {
  if (geoCache.has(key)) return geoCache.get(key);
  const g = factory();
  geoCache.set(key, g);
  return g;
}

/* ------------------------------ 基础图元 ------------------------------ */
/**
 * 缓存键量化到 0.5 mm。0.0249 与 0.025 是同一个零件，不该各存一份几何：
 * 全场景 1.1 万个「唯一」几何里相当一部分就是这种亚毫米重复，
 * 每一份都要占一次 GPU 上传（启动等待的大头）。只量化 key，
 * 构造参数取首次命中的实际值，误差 ≤ 0.5 mm。
 */
const kq = (v) => Math.round(v * 2000) / 2000;
export const box = (w, h, d) => cachedGeo(`box:${kq(w)},${kq(h)},${kq(d)}`, () => new THREE.BoxGeometry(w, h, d));
export const rbox = (w, h, d, r = 0.02, s = 2) =>
  cachedGeo(`rbox:${kq(w)},${kq(h)},${kq(d)},${kq(r)},${s}`, () => new RoundedBoxGeometry(w, h, d, s, Math.min(r, Math.min(w, h, d) / 2.001)));
export const cyl = (rt, rb, h, seg = 16, open = false) =>
  cachedGeo(`cyl:${kq(rt)},${kq(rb)},${kq(h)},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
export const cone = (r, h, seg = 14) => cachedGeo(`cone:${kq(r)},${kq(h)},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const sph = (r, ws = 16, hs = 12, phiS = 0, phiL = Math.PI * 2, thetaS = 0, thetaL = Math.PI) =>
  cachedGeo(`sph:${kq(r)},${ws},${hs},${kq(phiS)},${kq(phiL)},${kq(thetaS)},${kq(thetaL)}`, () => new THREE.SphereGeometry(r, ws, hs, phiS, phiL, thetaS, thetaL));
export const tor = (r, t, rs = 12, ts = 8, aSeg = Math.PI * 2) =>
  cachedGeo(`tor:${kq(r)},${kq(t)},${rs},${ts},${kq(aSeg)}`, () => new THREE.TorusGeometry(r, t, rs, ts, aSeg));
export const plane = (w, h, sw = 1, sh = 1) => cachedGeo(`plane:${kq(w)},${kq(h)},${sw},${sh}`, () => new THREE.PlaneGeometry(w, h, sw, sh));
export const circ = (r, seg = 24) => cachedGeo(`circ:${kq(r)},${seg}`, () => new THREE.CircleGeometry(r, seg));
export const capsule = (r, len, seg = 12) => cachedGeo(`cap:${kq(r)},${kq(len)},${seg}`, () => new THREE.CapsuleGeometry(r, len, 4, seg));
/**
 * 樱花花瓣的**几何轮廓**（不是矩形面片）。
 *
 * 平涂方向会把非 graphic 材质的 map 整个剥掉（core/style.js），于是「PlaneGeometry +
 * 贴图 alpha 抠形」在平涂下必然退化成粉白小方块 —— 远看像一把碎纸屑，不是樱花。
 * 形状只能做进几何里：基部收窄、中部最宽、先端带樱花特有的缺口。
 * 10 顶点 / 8 三角形，不依赖任何贴图，两种风格下都是花瓣。
 */
function sakuraPetalRaw(w, h, curl = 0.5) {
  const hw = w / 2;
  //        先端の切れ込み
  //   L2 '  NL  C  NR '  R2
  //   L1 '      |      ' R1     ← 中部が最も広い
  //   L0 '      |      ' R0
  //        B (萼側)
  const P = [
    [0, 0],                  // 0 B
    [-0.30 * w, 0.22 * h],   // 1 L0
    [0.30 * w, 0.22 * h],    // 2 R0
    [-0.50 * w, 0.58 * h],   // 3 L1
    [0.50 * w, 0.58 * h],    // 4 R1
    [-0.36 * w, 0.92 * h],   // 5 L2
    [0.36 * w, 0.92 * h],    // 6 R2
    [-0.17 * w, 1.00 * h],   // 7 NL
    [0.17 * w, 1.00 * h],    // 8 NR
    [0, 0.83 * h],           // 9 C（缺口底）
  ];
  const pos = new Float32Array(P.length * 3);
  for (let i = 0; i < P.length; i++) {
    const x = P[i][0], y = P[i][1];
    const nx = x / hw, ny = y / h;
    // 横向に反り、縦向きにわずかに伏せる（一枚ずつ立体感が出る）
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = -(nx * nx) * curl * h * 0.55 + (ny * ny) * curl * h * 0.16;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6, 5, 7, 9, 5, 9, 6, 9, 8, 6]);
  // 重心まわりに回す（基部原点のままだと旗のようにヒラヒラする）
  g.translate(0, -h * 0.5, 0);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
/** 空中にある一枚（反り curl 0.5 前後）、地面にある一枚（sakuraPetalRestGeo） */
export const sakuraPetalGeo = (w = 0.024, h = 0.02, curl = 0.5) =>
  cachedGeo(`sakuraPetal:${w},${h},${curl}`, () => sakuraPetalRaw(w, h, curl));
/** 贴地堆积用：躺平、边缘微卷 */
export const sakuraPetalRestGeo = (s = 0.026) => cachedGeo(`sakuraPetalRest:${s}`, () => {
  const g = sakuraPetalRaw(s, s * 0.86, 0.34);
  g.rotateX(-Math.PI / 2 + 0.12);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
});
/**
 * 桜の葉の輪郭（楕円＋尖った先端）。花瓣と同じ理由で、カード＋alpha 抜きは平涂で四角になる。
 */
export const sakuraLeafGeo = (w = 0.05, h = 0.04, curl = 0.3) => cachedGeo(`sakuraLeaf:${w},${h},${curl}`, () => {
  const hw = w / 2;
  const P = [
    [0, 0],                  // 基部（葉柄側）
    [-0.30 * w, 0.18 * h], [-0.50 * w, 0.52 * h], [0, h],   // 左縁 → 先端
    [0.50 * w, 0.52 * h], [0.30 * w, 0.18 * h],             // 右縁
  ];
  const pos = new Float32Array(P.length * 3);
  for (let i = 0; i < P.length; i++) {
    const x = P[i][0], y = P[i][1];
    const nx = x / hw, ny = y / h;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = -(nx * nx) * curl * h * 0.5 + (ny * ny) * curl * h * 0.14;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
  g.translate(0, -h * 0.5, 0);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
});
/**
 * 低多边形草むら：blades 枚の葉を扇状に開いた立体。
 *
 * 従来の「四角カード + leafCluster 貼图の alpha 抜き」は、平涂方向で map が剥がれると
 * 緑の四角が宙に浮いたように見える（幹元の苔が全面そう見えていた）。輪郭を几何側に持つ。
 */
export const tuftGeo = (w = 0.11, h = 0.11, blades = 5) => cachedGeo(`tuft:${w},${h},${blades}`, () => {
  const pos = [];
  const idx = [];
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + 0.35;
    const cx = Math.cos(a), sz = Math.sin(a);
    const hh = h * (0.58 + (b % 3) * 0.21);
    const half = w * 0.085;
    const base = w * 0.12;
    const tip = w * 0.42;
    const i = pos.length / 3;
    // 基部（左右）→ 先端（外側へ倒れて尖る）
    pos.push(
      cx * base + sz * half, 0, sz * base - cx * half,
      cx * base - sz * half, 0, sz * base + cx * half,
      cx * tip, hh, sz * tip,
    );
    idx.push(i, i + 1, i + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
});
const latheKey = (points, seg, phiS, phiL) =>
  seg + '|' + phiS.toFixed(3) + '|' + phiL.toFixed(3) + '|' + points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]).map((v) => Math.round(v * 2000) / 2000).join(',')).join(';');
export const lathe = (points, seg = 20, phiS = 0, phiL = Math.PI * 2) =>
  cachedGeo('lathe:' + latheKey(points, seg, phiS, phiL), () => new THREE.LatheGeometry(
      Array.isArray(points[0]) ? points.map(([x, y]) => new THREE.Vector2(x, y)) : points,
      seg,
      phiS,
      phiL,
    ),
  );
export const extrude = (shape, opts) => new THREE.ExtrudeGeometry(shape, opts);
export const shape = (cb) => {
  const s = new THREE.Shape();
  cb(s);
  return s;
};
export const tubeOf = (points, r, seg = 24, radial = 8, closed = false) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))), closed, 'catmullrom', 0.4),
    seg,
    r,
    radial,
    closed,
  );
/** 悬链线近似（电线、花枝吊线）：两端锚定，中间下垂 */
export const catenary = (a, b, sag = 0.2, seg = 24) => {
  const p0 = new THREE.Vector3(a[0], a[1], a[2]);
  const p1 = new THREE.Vector3(b[0], b[1], b[2]);
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = p0.clone().lerp(p1, t);
    p.y -= Math.sin(Math.PI * t) * sag;
    pts.push(p);
  }
  return pts;
};
/** 螺旋线圈（空调冷凝器、弹簧、螺丝） */
export const coil = (r, h, turns = 8, seg = 14, wire = 0.01) => {
  const pts = [];
  const n = Math.max(8, Math.round(turns * seg));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * h - h / 2, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 6, false);
};
/** 圆角扁条（护栏、框料） */
export const bar = (len, w, t, r = 0.006) => rbox(w, t, len, r, 2);

/* ------------------------------ 网格工厂 ------------------------------ */
export function mesh(geo, mat, o = {}) {
  if (!geo) throw new Error('kit.mesh: 缺少几何体（' + (o.name || 'unnamed') + '）');
  if (!mat) console.warn('[kit.mesh] 材质为 undefined，将退化为白色基础材质：', o.name || geo.type || 'mesh');
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.receive !== false;
  if (o.name) m.name = o.name;
  if (o.pos) m.position.set(o.pos[0], o.pos[1], o.pos[2]);
  if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  if (o.scale) (Array.isArray(o.scale) ? m.scale.set(...o.scale) : m.scale.setScalar(o.scale));
  if (o.renderOrder != null) m.renderOrder = o.renderOrder;
  if (o.frustumCulled === false) m.frustumCulled = false;
  if (o.matrixAutoUpdate === false) m.matrixAutoUpdate = false;
  return m;
}
/** 简写：m(geo, mat, x, y, z) */
export const m = (geo, mat, x = 0, y = 0, z = 0) => mesh(geo, mat, { pos: [x, y, z] });
/** 旋转件（绕 X 90° 的圆柱等常用） */
export const mrx = (geo, mat, x, y, z, deg = 90) => mesh(geo, mat, { pos: [x, y, z], rot: [(deg * Math.PI) / 180, 0, 0] });
export const mrz = (geo, mat, x, y, z, deg = 90) => mesh(geo, mat, { pos: [x, y, z], rot: [0, 0, (deg * Math.PI) / 180] });

/* ------------------------------ 组工厂 ------------------------------ */
export function grp(name = '', o = {}) {
  const g = new THREE.Group();
  g.name = name;
  if (o.pos) g.position.set(o.pos[0], o.pos[1], o.pos[2]);
  if (o.rotY != null) g.rotation.y = THREE.MathUtils.degToRad(o.rotY);
  if (o.rot) g.rotation.set(o.rot[0], o.rot[1] || 0, o.rot[2] || 0);
  if (o.scale != null) (Array.isArray(o.scale) ? g.scale.set(...o.scale) : g.scale.setScalar(o.scale));
  return g;
}
export function put(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}
export function rotY(obj, deg) {
  obj.rotation.y = THREE.MathUtils.degToRad(deg);
  return obj;
}
export function add(parent, ...children) {
  for (const c of children) if (c) parent.add(c);
  return parent;
}

/* ------------------------------ 布局循环（每个物件仍是独立 Mesh） ------------------------------ */
/** 线性阵列：cb(i, x, t) —— 逐个创建真实对象，不做几何合并 */
export function row(parent, count, dx, cb, { x0 = null, z = 0, y = 0, start = 0 } = {}) {
  const first = x0 != null ? x0 : (-(count - 1) / 2) * dx;
  for (let i = 0; i < count; i++) {
    const x = first + i * dx;
    const o = cb(start + i, x, count > 1 ? i / (count - 1) : 0);
    if (o) {
      if (o.isObject3D) {
        if (o.position.lengthSq() === 0) o.position.set(x, y, z);
        parent.add(o);
      }
    }
  }
  return parent;
}
/** 矩形阵列：cb(i, j, x, z) */
export function grid(parent, nx, nz, dx, dz, cb, { ox = null, oz = null, y = 0 } = {}) {
  const x0 = ox != null ? ox : (-(nx - 1) / 2) * dx;
  const z0 = oz != null ? oz : (-(nz - 1) / 2) * dz;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const o = cb(i + j * nx, i, x0 + i * dx, z0 + j * dz, j);
    if (o && o.isObject3D) {
      if (o.position.lengthSq() === 0) o.position.set(x0 + i * dx, y, z0 + j * dz);
      parent.add(o);
    }
  }
  return parent;
}
/** 极坐标阵列：cb(i, angle, x, z) */
export function radial(parent, count, r, cb, { a0 = 0, sweep = Math.PI * 2, y = 0 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = a0 + (i / count) * sweep;
    const o = cb(i, a, Math.cos(a) * r, Math.sin(a) * r);
    if (o && o.isObject3D) {
      if (o.position.lengthSq() === 0) o.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      parent.add(o);
    }
  }
  return parent;
}
/** 沿折线/曲线排布 */
export function along(parent, curve, count, cb, { offset = 0 } = {}) {
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const p = curve.getPointAt(t);
    const o = cb(i, p, t);
    if (o && o.isObject3D) {
      o.position.copy(p).add(new THREE.Vector3(0, offset, 0));
      parent.add(o);
    }
  }
  return parent;
}

/* ------------------------------ 风化 / 贴花 ------------------------------ */
/** 在某个朝向的面上浮贴做旧贴花（锈 / 掉漆 / 污渍 / 青苔 / 划痕） */
export function weather(parent, {
  w = 1,
  h = 1,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  kind = 'chip',
  color = '#8a5236',
  opacity = 0.5,
  seed = 1,
  density = 1,
  repeat = 1,
  count = 1,
  spread = 0.3,
}) {
  // 平涂风格不做表面做旧：这类贴花是 MeshBasicMaterial，绕过了 toon 的贴图剥离，
  // 在纯白墙面上会留下大块脏痕（便利店山墙上那道黑渍就是它）。
  // 顺带省掉全场景数千个贴花 draw call。
  if (IS_FLAT) return parent;
  const rnd = mulberry32(seed);
  const map = TEX.wear({ kind, color, seed, density });
  for (let i = 0; i < count; i++) {
    const g = new THREE.PlaneGeometry(w * (0.6 + rnd() * 0.8), h * (0.6 + rnd() * 0.8));
    const mm = new THREE.Mesh(g, MAT.decal({ map, opacity, order: i }));
    mm.position.set(
      pos[0] + (kind === 'rust' || kind === 'dirt' ? (rnd() - 0.5) * spread : 0),
      pos[1] + (rnd() - 0.5) * spread,
      pos[2] + (rnd() - 0.5) * spread * 0.4,
    );
    mm.rotation.set(rot[0], rot[1], rot[2]);
    mm.castShadow = false;
    mm.receiveShadow = false;
    mm.renderOrder = 2 + i;
    parent.add(mm);
  }
  return parent;
}
/** 面贴花（任意贴图，自动多边形偏移，避免 z-fighting） */
export function decal(parent, { map, w = 1, h = 1, pos = [0, 0, 0], rot = [0, 0, 0], color = '#ffffff', opacity = 1, order = 0, side = THREE.FrontSide }) {
  // 贴花的形状来自**贴图的 alpha**。paper/fabric 是「表面贴图」，整张画布铺满底色、
  // alpha 处处为 255，传进来只会得到一块实心矩形 —— 路边招牌上那几条白横杆就是这么来的。
  // 要斑驳形状请用 TEX.wear()（背景是 clearRect 出来的，自带 alpha）。
  if (map && map.userData && map.userData.opaqueSurface) {
    console.warn(`[decal] 贴到 ${parent && parent.name ? parent.name : '物体'} 上的贴花收到不透明表面贴图，会渲染成实心方块：请改用 TEX.wear()`);
  }
  const mat = new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(color),
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    side,
    polygonOffset: true,
    polygonOffsetFactor: -4 - order,
    polygonOffsetUnits: -4,
    toneMapped: true,
  });
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mm.position.set(pos[0], pos[1], pos[2]);
  mm.rotation.set(rot[0], rot[1], rot[2]);
  mm.renderOrder = 3 + order;
  mm.castShadow = mm.receiveShadow = false;
  parent.add(mm);
  return mm;
}
/** 接触阴影软斑（小物件落地更稳） */
export function shadowBlob(parent, { r = 0.4, pos = [0, 0, 0], opacity = 0.26, color = '#2a2530', ratio = 1 }) {
  const t = memoBlob();
  const mm = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2, r * 2 * ratio),
    new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, blending: THREE.NormalBlending }),
  );
  mm.rotation.x = -Math.PI / 2;
  mm.position.set(pos[0], pos[1] + 0.002, pos[2]);
  mm.renderOrder = 1;
  mm.castShadow = mm.receiveShadow = false;
  parent.add(mm);
  return mm;
}
let _blob = null;
function memoBlob() {
  if (_blob) return _blob;
  if (!TEX || typeof document === 'undefined') {
    _blob = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    _blob.needsUpdate = true;
    return _blob;
  }
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  _blob = new THREE.CanvasTexture(c);
  _blob.colorSpace = THREE.SRGBColorSpace;
  return _blob;
}

/* ------------------------------ 实例化（仅用于花瓣 / 草 / 砕石等海量同质件） ------------------------------ */
export function inst(geo, mat, count, cb, { name = '', cast = true, receive = false } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, count);
  im.name = name;
  im.castShadow = cast;
  im.receiveShadow = receive;
  const d = new THREE.Object3D();
  const col = new THREE.Color(1, 1, 1);
  for (let i = 0; i < count; i++) {
    d.position.set(0, 0, 0);
    d.rotation.set(0, 0, 0);
    d.scale.set(1, 1, 1);
    col.setRGB(1, 1, 1);
    cb(i, d, mulberry32(i * 977 + 13), col);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    im.setColorAt(i, col);
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}

/* ------------------------------ 其它 ------------------------------ */
export const rand = (seed) => mulberry32(seed);
export function range(rnd, a, b) {
  return a + rnd() * (b - a);
}
/** 让组以其包围盒底部中心对齐原点（资产契约要求：原点=地面接触中心） */
export function groundOrigin(group) {
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(group);
  group.position.y -= bb.min.y;
  const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  group.position.x -= cx;
  group.position.z -= cz;
  return group;
}
export function bounds(group) {
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(group);
  const s = new THREE.Vector3();
  bb.getSize(s);
  return { bb, size: s, center: bb.getCenter(new THREE.Vector3()) };
}
/** 曲线管（藤蔓、电线、水管） */
export function pipe(points, r, mat, o = {}) {
  return mesh(tubeOf(points, r, o.seg ?? Math.max(12, points.length * 6), o.radial ?? 7, o.closed), mat, o);
}
/** 带刻度的圆环箍 */
export function hoop(r, t, mat, o = {}) {
  return mesh(tor(r, t, o.rs ?? 8, o.ts ?? 16), mat, o);
}
/** 网格栅（栅栏 / 井盖筋 / 通风格栅） */
export function grill(parent, { w, h, nx, ny, bar: bw = 0.012, mat, pos = [0, 0, 0], rot = [0, 0, 0] }) {
  const g = grp('grill', { pos, rot });
  for (let i = 0; i < nx; i++) {
    const x = -w / 2 + (i / (nx - 1)) * w;
    g.add(mesh(box(bw, h, bw * 0.7), mat, { pos: [x, 0, 0] }));
  }
  for (let j = 0; j < ny; j++) {
    const y = -h / 2 + (j / (ny - 1)) * h;
    g.add(mesh(box(w, bw * 0.8, bw * 0.8), mat, { pos: [0, y, 0] }));
  }
  parent.add(g);
  return g;
}
/** 车削瓶体（饮料瓶 / 杯 / 罐）：给出纵断面点集 */
export function bottle(points, seg = 22, mat, o = {}) {
  return mesh(lathe(points, seg), mat, o);
}
export const DEG = Math.PI / 180;
export const d2r = (d) => d * DEG;
export { THREE, geoCache };


/* ------------------------------ 世界尺度铺面（地图与大型资产共用） ------------------------------ */
/** 按世界尺寸重排 UV（贴图 repeat 保持 1，靠 UV 无缝平铺） */
export function retile(geo, u, v, tile = 1.5) {
  const uv = geo.attributes.uv;
  if (!uv) return geo;
  const su = u / tile, sv = v / tile;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}
/* 装配耗时剖析的实现在 core/style.js（叶子模块，避免与 textures 成环），这里转发给各层用 */
export { TRACE, TRACE_ON, traceMark } from './style.js';

/* ------------------------------ 裁剪框（只保留一块矩形） ------------------------------ */
// diorama 有时只需要红线内的那一块。地图层的所有铺面都经由下面四个函数生成，
// 所以裁剪集中在这里做一次即可，不必去改十个地图模块的坐标。
let CLIP = null;
export function setWorldClip(r) { CLIP = r ? { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 } : null; }
export function getWorldClip() { return CLIP; }
const _span = (a, b, lo, hi) => {
  const s = Math.min(a, b), e = Math.max(a, b);
  const x0 = Math.max(s, lo), x1 = Math.min(e, hi);
  return x1 - x0 <= 1e-4 ? null : [x0, x1];
};
/** 完全落在框外时返回一个空 Group：调用处普遍写 g.add(surface(...))，
 *  返回 null 会让 Object3D.add 报 console.error。 */
export const emptyGroup = (name = 'clipped') => { const g = new THREE.Group(); g.name = name; return g; };
export function clipRect(x0, x1, z0, z1) {
  if (!CLIP) return [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)];
  const X = _span(x0, x1, CLIP.x0, CLIP.x1), Z = _span(z0, z1, CLIP.z0, CLIP.z1);
  return X && Z ? [X[0], X[1], Z[0], Z[1]] : null;
}
/** 点是否落在裁剪框内（逐件排布用：路缘石、等距小件） */
export function insideClip(x, z) { return !CLIP || (x >= CLIP.x0 && x <= CLIP.x1 && z >= CLIP.z0 && z <= CLIP.z1); }
export function clipBounds() { return CLIP; }
/* ------------------------------ 地表面の高さ引っかけ ------------------------------ */
// 地図層の水平铺面はすべて surface() を通るので、ここで矩形を覚えておけば
// 「落花が歩道の下に埋もれる」「ホームの高さを間違えて空中に浮く」を構造的に防げる。
// （petal-storm は地面_zones の高さを自前で持たず、必ずここへ聞きに来る）
const GROUND_RECTS = [];
/**
 * 所有从 surface() 走过的铺面材质（去重后就是「地面」的全部材质对象）。
 * 天气模块按 wet 值改它们的 toon uniform，见 src/weather/wet.js。
 */
export const WETTABLE = new Set();
/** その座標にある铺面の最上天面。未覆盖なら 0（街道標高） */
export function groundYAt(x, z) {
  let y = -Infinity;
  for (let i = 0; i < GROUND_RECTS.length; i++) {
    const r = GROUND_RECTS[i];
    if (x < r[0] || x > r[1] || z < r[2] || z > r[3]) continue;
    if (r[4] > y) y = r[4];
  }
  return y === -Infinity ? 0 : y;
}
/**
 * 一维跑位裁剪：axis='x' 时 at 是该跑的 z，axis='z' 时 at 是 x。
 * 侧沟・レール・標線这类「一根长箱铺满整条街」的件必须先在源头截断，
 * 只靠中心的 pruneToClip 拦不住它们（中心在框内，箱体却伸出台座好几米）。
 */
export function clipRun(axis, from, to, at) {
  if (!CLIP) return [Math.min(from, to), Math.max(from, to)];
  const lat = axis === 'x' ? [CLIP.z0, CLIP.z1] : [CLIP.x0, CLIP.x1];
  if (at < lat[0] || at > lat[1]) return null;
  const span = axis === 'x' ? [CLIP.x0, CLIP.x1] : [CLIP.z0, CLIP.z1];
  return _span(from, to, span[0], span[1]);
}
/** 沿 X 的竖直面：x 区间裁剪 + z 是否在框内 */
function clipWallX(x0, x1, z) {
  if (!CLIP) return [Math.min(x0, x1), Math.max(x0, x1)];
  if (z < CLIP.z0 || z > CLIP.z1) return null;
  return _span(x0, x1, CLIP.x0, CLIP.x1);
}
function clipWallZ(z0, z1, x) {
  if (!CLIP) return [Math.min(z0, z1), Math.max(z0, z1)];
  if (x < CLIP.x0 || x > CLIP.x1) return null;
  return _span(z0, z1, CLIP.z0, CLIP.z1);
}

/** 水平铺面（顶面朝上），带世界尺度 UV */
export function surface(x0, x1, z0, z1, y, mat, { tile = 1.5, name = 'surface', segs = 1, cast = false, receive = true } = {}) {
  const c = clipRect(x0, x1, z0, z1);
  if (!c) return emptyGroup(name);
  [x0, x1, z0, z1] = c;
  GROUND_RECTS.push([x0, x1, z0, z1, y]);
  // 铺面材质登记给天气：下雨要变深变饱和、反光滑一层。
  // 这里登记的是**材质对象**而不是网格 —— 同一条 MAT.asphalt 铺了整张路网，
  // 登记一次就全湿地面，不必遍历场景；没有 toon 注入（userData.u）的材质自动跳过。
  if (mat && mat.userData && mat.userData.u) WETTABLE.add(mat);
  const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
  const g = new THREE.PlaneGeometry(w, d, segs, segs);
  retile(g, w, d, tile);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
/** 垂直铺面：沿 X 延伸 */
export function wallX(x0, x1, y0, y1, z, mat, { tile = 1.5, face = '+z', name = 'wall' } = {}) {
  const cx = clipWallX(x0, x1, z);
  if (!cx) return emptyGroup(name);
  [x0, x1] = cx;
  const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
  const g = new THREE.PlaneGeometry(w, h);
  retile(g, w, h, tile);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  if (face === '-z') m.rotation.y = Math.PI;
  m.receiveShadow = true;
  return m;
}
/** 垂直铺面：沿 Z 延伸 */
export function wallZ(z0, z1, y0, y1, x, mat, { tile = 1.5, face = '+x', name = 'wall' } = {}) {
  const cz = clipWallZ(z0, z1, x);
  if (!cz) return emptyGroup(name);
  [z0, z1] = cz;
  const d = Math.abs(z1 - z0), h = Math.abs(y1 - y0);
  const g = new THREE.PlaneGeometry(d, h);
  retile(g, d, h, tile);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
  m.rotation.y = face === '+x' ? Math.PI / 2 : -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}
/** 有厚度的地块（顶面在 yTop） */
export function slab(x0, x1, z0, z1, yTop, th, mat, o = {}) {
  const c = clipRect(x0, x1, z0, z1);
  if (!c) return emptyGroup(o.name || 'slab');
  [x0, x1, z0, z1] = c;
  const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
  const g = o.round ? rbox(w, th, d, o.round, 2) : box(w, th, d);
  return mesh(g, mat, {
    name: o.name || 'slab',
    pos: [(x0 + x1) / 2, yTop - th / 2, (z0 + z1) / 2],
    cast: o.cast === true,
    receive: o.receive !== false,
  });
}

/* ------------------------------ 同类零件实例化（不是合并网格） ------------------------------ */
const sigCache = new WeakMap();
/**
 * 材质的「除了颜色都一样」签名。
 * 商品类资产（货架饮料、饭团、零食）习惯给每一件单独 MAT.plastic('#xxxx')，
 * 于是同一形状的 40 个瓶子就是 40 个材质 → 按材质对象分桶后全是单件，draw call 一点没省。
 * 颜色其实可以走 instanceColor（three 在着色器里把它乘进 diffuse），
 * 所以判「能不能并成一次绘制」应当比材质**配置**，而不是比材质对象本身。
 */
/**
 * 材质签名只比「会改变绘制结果」的字段：标准管线开关 + 贴图身份（uuid + repeat）。
 * 语义与旧的 `JSON.stringify(m.toJSON())` 一致，但绝不调用它 ——
 * three 的 `TextureSource.toJSON` 会把每张贴图 `canvas.toDataURL('image/png')`
 * 编码成 base64（实测占整段启动 CPU 约 5%，并且每个材质都生成一份 100–300 KB 的字符串，
 * 3331 个材质就是几百 MB 的瞬时垃圾，GC 也一起拖慢装配）。
 */
const SIG_PROP = ['type', 'side', 'transparent', 'opacity', 'alphaTest', 'depthWrite', 'depthTest', 'blending',
  'vertexColors', 'flatShading', 'wireframe', 'toneMapped', 'dithering', 'fog', 'premultipliedAlpha',
  'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'colorWrite', 'alphaToCoverage', 'shadowSide',
  'forceSinglePass', 'roughness', 'metalness', 'shininess', 'clearcoat', 'clearcoatRoughness', 'ior',
  'transmission', 'thickness', 'sheen', 'sheenRoughness', 'specularIntensity', 'reflectivity', 'refractionRatio',
  'emissiveIntensity', 'combine'];
const SIG_TEX = ['map', 'alphaMap', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'emissiveMap',
  'aoMap', 'lightMap', 'specularMap', 'matcap', 'gradientMap', 'envMap', 'displacementMap', 'sheenColorMap',
  'specularColorMap', 'iridescenceMap', 'anisotropyMap', 'clearcoatMap', 'transmissionMap', 'thicknessMap'];
function sigNum(v) {
  if (v == null) return '-';
  if (typeof v === 'number') return v.toFixed(4);
  if (typeof v === 'boolean' || typeof v === 'string') return String(v);
  if (v.isVector2 || v.isVector3 || v.isVector4) return v.toArray().map((n) => n.toFixed(3)).join(',');
  if (v.isColor) return v.getHexString();
  return typeof v;
}
function materialSignature(m) {
  let s = sigCache.get(m);
  if (s !== undefined) return s;
  let out = '';
  for (const k of SIG_PROP) out += k + '=' + sigNum(m[k]) + ';';
  for (const k of SIG_TEX) {
    const t = m[k];
    out += k + '=' + (t ? t.uuid + '@' + sigNum(t.repeat) + '/' + t.wrapS + t.wrapT + '/' + t.colorSpace + '/' + t.anisotropy : '-') + ';';
  }
  s = out;
  sigCache.set(m, s);
  return s;
}
/**
 * 把「同一几何、同一材质配置（或仅颜色不同）、同一渲染顺序」的重复网格折叠成一个 InstancedMesh。
 * 每个零件仍然是独立对象（独立变换、独立颜色、可独立剔除），只是共用一次绘制调用；
 * 绝不使用 BufferGeometryUtils.merge，几何数据不被改写。
 * 跳过：已有子节点/已是 InstancedMesh/半透明贴花/带特殊 userData 标记（灯、信号、摇摆、描边豁免）等。
 */
export function autoInstance(root, { min = 5, skipNames = /#shine|decal|screen|lens|bulb/i } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();
  const col = new THREE.Color();
  const buckets = new Map();
  const animated = (o) => {
    let p = o;
    while (p && p !== root.parent) {
      const ud = p.userData;
      if (ud && (ud.sway || ud.breathe || ud.signalLamp || ud.glassShine)) return true;
      p = p.parent;
    }
    return false;
  };
  root.traverse((c) => {
    if (!c.isMesh || c.isInstancedMesh) return;
    if (c.children.length || c.visible === false) return;
    const m = c.material;
    if (!m || Array.isArray(m) || m.transparent) return;
    if (m.blending !== THREE.NormalBlending) return;
    if (skipNames.test(c.name || '')) return;
    const ud = c.userData || {};
    if (ud.breathe || ud.signalLamp || ud.sway || ud.glassShine || ud.noInstancing) return;
    const g = c.geometry;
    if (!g || !g.attributes || !g.attributes.position) return;
    if (animated(c)) return;
    const key = `${g.uuid}|${materialSignature(m)}|${c.renderOrder | 0}|${c.castShadow ? 1 : 0}${c.receiveShadow ? 1 : 0}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { geo: g, mat: m, proto: c, mats: new Set(), items: [] }));
    b.mats.add(m);
    b.items.push(c);
  });
  let collapsed = 0;
  let saved = 0;
  for (const b of buckets.values()) {
    if (b.items.length < min) continue;
    const host = b.proto.parent || root;
    inv.copy(host.matrixWorld).invert();
    // 一桶里若混着「只有颜色不同」的材质：克隆一份把底色刷白，真实颜色逐实例走 instanceColor。
    // 克隆体与原材质配置相同 → three 的 program 缓存会复用同一个着色器，不会多编译成本。
    const one = b.mats.size === 1;
    if (!one && !b.items.every((it) => it.material.color)) continue;   // 有件没颜色属性 → 不冒半填 instanceColor 的险
    const mat = one ? b.mat : b.mat.clone();
    if (!one && mat.color) mat.color.setRGB(1, 1, 1);
    const im = new THREE.InstancedMesh(b.geo, mat, b.items.length);
    im.name = (b.proto.name || 'part') + '@' + b.items.length;
    im.castShadow = b.proto.castShadow;
    im.receiveShadow = b.proto.receiveShadow;
    im.renderOrder = b.proto.renderOrder;
    im.userData = { ...(b.proto.userData || {}), instancedFrom: b.items.length };
    for (let i = 0; i < b.items.length; i++) {
      const it = b.items[i];
      it.updateMatrix();
      tmp.multiplyMatrices(inv, it.matrixWorld);
      im.setMatrixAt(i, tmp);
      if (!one) im.setColorAt(i, col.copy(it.material.color));
      if (it.parent) it.parent.remove(it);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
    host.add(im);
    collapsed++;
    saved += b.items.length - 1;
  }
  if (saved) root.userData.instanced = { buckets: collapsed, saved };
  return root;
}

/* ------------------------------ 实例合并（同几何+同材质的 InstancedMesh 并成一个） ------------------------------ */
/**
 * 把「同一摆动子树内、同一几何、同一材质」的多个 InstancedMesh 并成一个。
 *
 * 为什么需要：一棵樱花的每个花房都各自 inst() 出花瓣/叶/梗（一次调用 = 一次 draw call），
 * 三棵树就是 3783 个 draw call，占全场景可见调用的 40%（实测 8.8 µs/call → 33 ms）。
 * 资产里这类「每个小群组一次实例化」的写法很普遍（草坡、花箱、货架商品），
 * 所以在这里统一收口，而不是逐个资产重写。
 *
 * 这不是合并网格：几何数据一个字节都不改，只是把 instance 矩阵换到新宿主的坐标系里拼接，
 * 每朵花仍是独立实例（独立变换、独立颜色、仍可整体剔除）。
 * 宿主取「最近的摆动祖先」：摆动子树内部的相对变换恒定，整组随祖先一起动是等价的；
 * 跨摆动根则不等价，所以绝不跨根合并。
 */
export function mergeInstances(root, { min = 2 } = {}) {
  if (!root) return root;
  root.updateMatrixWorld(true);
  const hosts = new Map();          // host -> Map(key -> [im...])
  const bad = (m) => !m || Array.isArray(m) || m.transparent || m.blending !== THREE.NormalBlending;

  const bucketFor = (host) => {
    let b = hosts.get(host);
    if (!b) hosts.set(host, (b = new Map()));
    return b;
  };
  const visit = (node, host) => {
    const swayed = !!(node.userData && node.userData.sway);
    const h = swayed ? node : host;
    if (!swayed && node.isInstancedMesh && !bad(node.material) && !node.userData?.noInstancing
      && !/#shine|decal|screen|lens|bulb/i.test(node.name || '')) {
      const g = node.geometry;
      if (g && g.attributes && g.attributes.position) {
        const b = bucketFor(h || root);
        const key = `${g.uuid}|${node.material.uuid}|${node.renderOrder | 0}|${node.castShadow ? 1 : 0}${node.receiveShadow ? 1 : 0}`;
        let list = b.get(key);
        if (!list) b.set(key, (list = []));
        list.push(node);
      }
    }
    for (const c of node.children) visit(c, h);
  };
  visit(root, null);

  const hostM = new THREE.Matrix4();
  const srcM = new THREE.Matrix4();
  const outM = new THREE.Matrix4();
  const worldM = new THREE.Matrix4();
  const col = new THREE.Color(1, 1, 1);
  let merged = 0;
  let saved = 0;
  for (const [host, buckets] of hosts) {
    const inv = new THREE.Matrix4().copy(host.matrixWorld).invert();
    for (const list of buckets.values()) {
      if (list.length < min) continue;
      let total = 0;
      for (const s of list) total += s.count;
      const proto = list[0];
      const im = new THREE.InstancedMesh(proto.geometry, proto.material, total);
      im.name = (proto.name || 'inst') + '@' + total;
      im.castShadow = proto.castShadow;
      im.receiveShadow = proto.receiveShadow;
      im.renderOrder = proto.renderOrder;
      im.frustumCulled = proto.frustumCulled;
      im.userData = { ...proto.userData, mergedFrom: list.length, instancedFrom: total };
      let j = 0;
      for (const s of list) {
        hostM.copy(s.matrixWorld);
        const tinted = !!s.instanceColor;
        for (let i = 0; i < s.count; i++) {
          s.getMatrixAt(i, srcM);
          outM.multiplyMatrices(inv, worldM.multiplyMatrices(hostM, srcM));
          im.setMatrixAt(j, outM);
          if (tinted) {
            s.getColorAt(i, col);
            im.setColorAt(j, col);
          } else if (im.instanceColor) {
            im.setColorAt(j, col.setRGB(1, 1, 1));
          }
          j++;
        }
        if (s.parent) s.parent.remove(s);
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      host.add(im);
      merged++;
      saved += list.length - 1;
    }
  }
  if (saved) root.userData.mergedInstances = { buckets: merged, saved };
  return root;
}

/* ------------------------------ 货架商品的原型复用 ------------------------------ */
const protoCache = new Map();
/**
 * 同一个「型号 + 变体」的商品，就是货架上被重复摆放的同一件东西。
 * 建一次原型，其余用 clone() —— three 的 Object3D.clone 共享 geometry 与 material 引用，
 * 所以 8880 个逐件生成的几何会塌回几十种：装配时间、显存、以及 autoInstance 的可并桶
 * 同时受益。逐件的位移与转角抖动照旧施加在克隆体上，货架不会看起来像复制粘贴板。
 *
 * 用法：stockItem('bottle:tea', () => P_BOTTLE.build({ seed, variant: 'tea' }))
 */
export function stockItem(key, factory) {
  let proto = protoCache.get(key);
  if (!proto) {
    proto = factory();
    protoCache.set(key, proto);
  }
  const c = proto.clone();
  c.position.set(0, 0, 0);
  c.rotation.set(0, 0, 0);
  c.scale.setScalar(1);
  return c;
}
export const protoStats = () => ({ protos: protoCache.size });

/* ------------------------------ 地图层裁剪兜底 ------------------------------ */
const _pv = new THREE.Vector3();
/**
 * 把中心落在裁剪框外的独立小件一律摘掉（补修パッチ・標線・窨井盖・碎土…）。
 * 铺面走 clipRect、路缘与等距件走 insideClip、长条跑位走 clipRun，
 * 但地图模块里还有几十处直接 mesh(box(...)) 的自由排布 —— 逐个改坐标既慢又漏，
 * 所以在装配末尾按世界位置统一收一次口。必须在 autoInstance / pruneHulls 之前跑：
 * 折叠成 InstancedMesh 之后「中心」就没有意义了。
 */
export function pruneToClip(root) {
  if (!CLIP || !root) return root;
  root.updateMatrixWorld(true);
  const dead = [];
  root.traverse((n) => {
    if (n === root || !(n.isMesh || n.isInstancedMesh)) return;
    n.getWorldPosition(_pv);
    if (!insideClip(_pv.x, _pv.z)) dead.push(n);
  });
  for (const n of dead) if (n.parent) n.parent.remove(n);
  let removed = dead.length;
  for (let pass = 0; pass < 5; pass++) {
    const empty = [];
    root.traverse((n) => { if (n !== root && n.parent && n.isGroup && !n.children.length) empty.push(n); });
    if (!empty.length) break;
    for (const n of empty) { n.parent.remove(n); removed++; }
  }
  root.userData.clipped = removed;
  return root;
}

/* ------------------------------ 描边壳修剪 ------------------------------ */
/**
 * 移除小尺寸零件的反壳描边：小于 minSize 的物件在画面上只有一两像素，
 * 描边只会糊成一团并让绘制调用翻倍；轮廓交给屏幕空间边缘检测。
 * 同时删除空壳父组，减少场景图遍历。
 */
export function pruneHulls(root, minSize = 0.16) {
  root.updateMatrixWorld(true);
  const sz = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const kill = [];
  root.traverse((n) => {
    if (!n.isMesh || !n.userData?.isHull) return;
    const g = n.geometry;
    if (!g) return;
    if (!g.boundingBox) g.computeBoundingBox();
    g.boundingBox.getSize(sz);
    n.getWorldScale(sc);
    const maxDim = Math.max(sz.x * sc.x, sz.y * sc.y, sz.z * sc.z);
    if (maxDim < minSize) kill.push(n);
  });
  for (const k of kill) if (k.parent) k.parent.remove(k);
  return root;
}

/* ------------------------------ 资产收尾 ------------------------------ */
import { addOutline } from './outline.js';
/**
 * 资产收尾：自动补描边壳 + 名称整理。所有 build() 返回前必须调用。
 * @param group 资产根
 * @param o { outline: false | 'thin' | 'normal' | 'bold' | number, outlineColor, minSize, exclude }
 */
export function finish(group, o = {}) {
  if (o.outline !== false) {
    addOutline(group, {
      thickness: o.outline ?? 'normal',
      color: o.outlineColor,
      opacity: o.outlineOpacity,
      minSize: o.minSize,
      exclude: o.exclude,
      includePlanes: o.includePlanes,
    });
  }
  if (o.origin === 'ground') groundOrigin(group);
  return group;
}

/**
 * 让出主线程给浏览器处理输入/绘制，但**不依赖 requestAnimationFrame**。
 * rAF 在后台标签页完全不触发，用它做分批装配的节拍，页面一失焦装配就永久卡死；
 * MessageChannel 的消息回调是宏任务且不被后台节流，前台能让出帧、后台也能继续推进。
 */
export function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof MessageChannel === 'function') {
      const ch = new MessageChannel();
      ch.port1.onmessage = () => { ch.port1.close(); resolve(); };
      ch.port2.postMessage(0);
      return;
    }
    setTimeout(resolve, 0);
  });
}
