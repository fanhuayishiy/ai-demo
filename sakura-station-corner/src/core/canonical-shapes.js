// 形状原型归一：把「只差一个逐轴缩放」的几何体换成同一个原型 + 对象缩放。
//
// 为什么这是省提交的关键：本场景 65% 的绘制调用是 InstancedMesh 批次（实测 hero 4902/7327），
// 而 autoInstance / mergeInstances 的分桶键里有 `geometry.uuid`。
// BoxGeometry(0.1,0.2,0.03) 与 BoxGeometry(2,1,0.5) 顶点拓扑、法线、UV 完全一致，
// 只差一个对角缩放 —— 但它们在缓存里是两个不同的几何，于是同材质的两根梁是两次提交。
// 换成同一个 1×1×1 原型后，「同几何+同材质」的判定才真正成立：全场景 1854 种盒子塌成 1 种。
//
// 这不是减面，也不是简化建模：
//   · 资产文件一行不改，build() 里照旧 box(0.1,0.2,0.03)；
//   · 三角形数据逐字节等价（原型 × 缩放 == 原几何，误差 ≤ 1e-6 m）；
//   · 顶点数、法线、UV、材质、阴影全部不变 —— 渲染结果逐像素相同；
//   · 显存只降不升（10271 份唯一几何塌下来只剩几百份原型 + 少量真正自定义的形状）。
//
// 安全性靠**内容校验**，不靠约定：只有当几何的 position/normal/uv/index 数组
// 真的等于「原型数组 × 声称的缩放」时才替换。于是
//   · retile() 改写过世界尺度 UV 的铺面（沥青、地砖、墙）自动落选，
//   · rotateX/translate 改动过顶点的（花枝、草簇、车体截面）自动落选，
//   · RoundedBox/Capsule/Torus 这类「圆角半径不随尺寸缩放」的族根本不参与。
import * as THREE from 'three';

const TOL = 1e-6;

/** 原型缓存：族键 → { geo, sx, sy, sz } 的构造信息 */
const protos = new Map();
function proto(key, make) {
  let p = protos.get(key);
  if (!p) protos.set(key, (p = { geo: make(), key }));
  return p;
}

/**
 * 从 `geometry.parameters`（three 构造器留下的原始参数，后续 mutate 不会更新它）
 * 推出「原型 + 缩放」。返回 null 表示这一族不参与归一。
 */
function planOf(g) {
  const p = g.parameters;
  if (!p) return null;
  switch (g.type) {
    case 'BoxGeometry':
      if ((p.widthSegments ?? 1) !== 1 || (p.heightSegments ?? 1) !== 1 || (p.depthSegments ?? 1) !== 1) return null;
      return proto('box', () => new THREE.BoxGeometry(1, 1, 1));
    case 'PlaneGeometry':
      if ((p.widthSegments ?? 1) !== 1 || (p.heightSegments ?? 1) !== 1) return null;
      return proto('plane', () => new THREE.PlaneGeometry(1, 1));
    case 'CylinderGeometry': {
      if (Math.abs(p.radiusTop - p.radiusBottom) > TOL) return null;         // 锥形不能靠缩放得到
      if ((p.heightSegments ?? 1) !== 1) return null;
      if (p.thetaStart !== 0 || Math.abs((p.thetaLength ?? Math.PI * 2) - Math.PI * 2) > 1e-9) return null;
      return proto(`cyl:${p.radialSegments}:${p.openEnded ? 1 : 0}`, () => new THREE.CylinderGeometry(1, 1, 1, p.radialSegments, 1, !!p.openEnded));
    }
    case 'ConeGeometry': {
      if ((p.heightSegments ?? 1) !== 1) return null;
      if (p.thetaStart !== 0 || Math.abs((p.thetaLength ?? Math.PI * 2) - Math.PI * 2) > 1e-9) return null;
      return proto(`cone:${p.radialSegments}:${p.openEnded ? 1 : 0}`, () => new THREE.ConeGeometry(1, 1, p.radialSegments, 1, !!p.openEnded));
    }
    case 'CircleGeometry': {
      if (p.thetaStart !== 0 || Math.abs((p.thetaLength ?? Math.PI * 2) - Math.PI * 2) > 1e-9) return null;
      return proto(`circ:${p.segments}`, () => new THREE.CircleGeometry(1, p.segments));
    }
    case 'SphereGeometry': {
      if (p.thetaStart !== 0 || Math.abs((p.thetaLength ?? Math.PI) - Math.PI) > 1e-9) return null;
      if (p.phiStart !== 0 || Math.abs((p.phiLength ?? Math.PI * 2) - Math.PI * 2) > 1e-9) return null;
      return proto(`sph:${p.widthSegments}x${p.heightSegments}`, () => new THREE.SphereGeometry(1, p.widthSegments, p.heightSegments));
    }
    default:
      return null;
  }
}

/** 声称的缩放（从原始参数取，不从包围盒猜） */
function scaleOf(g) {
  const p = g.parameters;
  switch (g.type) {
    case 'BoxGeometry': return [p.width, p.height, p.depth];
    case 'PlaneGeometry': return [p.width, p.height, 1];
    case 'CylinderGeometry': return [p.radiusTop, p.height, p.radiusTop];
    case 'ConeGeometry': return [p.radius, p.height, p.radius];
    case 'CircleGeometry': return [p.radius, p.radius, 1];
    case 'SphereGeometry': return [p.radius, p.radius, p.radius];
    default: return null;
  }
}

const sameArr = (a, b, n) => {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < n; i++) if (Math.abs(a[i] - b[i]) > TOL) return false;
  return true;
};

const checked = new WeakMap();     // geometry → 计划（false = 不合格）

/**
 * 内容校验：position 必须等于「原型 position × scale」，normal / uv / index 必须逐字节相同。
 * 一遍扫过，结果按几何缓存（同一份几何全场共用，1 万份几何只花几十毫秒）。
 */
function verify(g) {
  const hit = checked.get(g);
  if (hit !== undefined) return hit;
  let out = false;
  const pl = planOf(g);
  const sc = pl && scaleOf(g);
  if (pl && sc && sc.every((v) => Number.isFinite(v) && v > 0)) {
    const pg = pl.geo;
    const gp = g.attributes.position, pp = pg.attributes.position;
    const idxEq = g.index ? (pg.index && g.index.count === pg.index.count) : !pg.index;
    if (idxEq && gp && pp && gp.count === pp.count) {
      const a = gp.array, b = pp.array, n = gp.count * 3;
      let ok = true;
      for (let i = 0; i < n; i += 3) {
        if (Math.abs(a[i] - b[i] * sc[0]) > TOL || Math.abs(a[i + 1] - b[i + 1] * sc[1]) > TOL || Math.abs(a[i + 2] - b[i + 2] * sc[2]) > TOL) { ok = false; break; }
      }
      if (ok) {
        const names = Object.keys(g.attributes).sort();
        if (names.join(',') !== Object.keys(pg.attributes).sort().join(',')) ok = false;
        else {
          for (const k of names) {
            if (k === 'position') continue;
            const x = g.attributes[k], y = pg.attributes[k];
            if (!sameArr(x.array, y.array, x.array.length)) { ok = false; break; }
          }
        }
      }
      if (ok && g.index && pg.index && !sameArr(g.index.array, pg.index.array, g.index.array.length)) ok = false;
      if (ok) out = { geo: pg, sx: sc[0], sy: sc[1], sz: sc[2] };
    }
  }
  checked.set(g, out);
  return out;
}

/**
 * 就地归一整棵子树。必须在 autoInstance / mergeInstances **之前**调用：
 * 分桶键用的是 geometry.uuid，晚了就来不及了。
 */
const TOTAL = { meshes: 0, batches: 0, instances: 0, skipped: 0 };

export function unifyShapes(root) {
  const m4 = new THREE.Matrix4();
  const mi = new THREE.Matrix4();
  let mesh = 0, inst = 0, insts = 0, skip = 0;  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const pl = verify(o.geometry);
    if (!pl) { skip++; return; }
    if (o.isInstancedMesh) {
      m4.makeScale(pl.sx, pl.sy, pl.sz);
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, mi);
        mi.multiply(m4);                            // 右侧乘 = 在几何自身坐标系里缩放
        o.setMatrixAt(i, mi);
      }
      o.instanceMatrix.needsUpdate = true;
      o.geometry = pl.geo;
      o.computeBoundingSphere();
      inst++;
      insts += o.count;
    } else {
      o.scale.set(o.scale.x * pl.sx, o.scale.y * pl.sy, o.scale.z * pl.sz);
      o.geometry = pl.geo;
      o.matrixWorldNeedsUpdate = true;
      mesh++;
    }
  });
  TOTAL.meshes += mesh; TOTAL.batches += inst; TOTAL.instances += insts; TOTAL.skipped += skip;
  return { meshes: mesh, batches: inst, instances: insts, skipped: skip, protos: protos.size };
}
export const shapeStats = () => ({ ...TOTAL, protos: protos.size });

/** ?shape=off 关掉这一步：同一个构建里能做前后对比（性能测量必须是配对实验） */
export function unifyShapesMaybe(root) {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('shape') === 'off') return null;
  return unifyShapes(root);
}

/** 归一后剩下的几何种类（交付指标：显存与启动上传量都跟着它走） */
export function shapeCensus(root) {
  const geos = new Set();
  let verts = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (geos.has(o.geometry.uuid)) return;
    geos.add(o.geometry.uuid);
    verts += o.geometry.attributes.position.count;
  });
  return { uniqueGeos: geos.size, protoVerts: verts };
}
