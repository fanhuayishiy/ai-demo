// 雨：一个罩住整块台座的雨丝体积，只在天气给出 rain>0 时有代价（rain=0 时 count 直接归 0）。
//
// 为什么不用「贴图 alpha 拉一条」：平涂模式会剥掉非 graphic 材质的 map，那种雨丝会退化成
// 一堆半透明方块。所以雨丝的形状由几何给 —— 1×1 平面按实例缩放成 6–11 mm 宽、
// 50–140 mm 长的竖条，并且每帧绕 Y 转到相机的方位角，从任何角度看都是有一条厚度的斜线，
// 不会侧过去变成一条看不见的边。
import * as THREE from 'three';
import { inst, grp, clipRect, plane } from '../core/kit.js';
import { mulberry32 } from '../core/textures.js';
import { WX } from '../weather/index.js';

export const NAME = 'rain-shower';

const N = 4200;
const TOP = 10.5;

export function attach(engine, world) {
  const box = clipRect(-20, 20, -20, 20) || [-20, 20, -20, 20];
  const [x0, x1, z0, z1] = box;
  const spanX = x1 - x0;
  const spanZ = z1 - z0;

  const parts = [];
  for (let i = 0; i < N; i++) {
    const r = mulberry32(i * 7919 + 5);
    parts.push({
      x: x0 + r() * spanX,
      y: r() * TOP,
      z: z0 + r() * spanZ,
      len: 0.10 + r() * 0.16,
      th: 0.0055 + r() * 0.004,
      v: 7.4 + r() * 5.4,
      lean: 0.7 + r() * 0.7,
    });
  }

  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#d3e0ee'),
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
  });

  const mesh = inst(plane(1, 1), mat, N, (i, d) => {
    const p = parts[i];
    d.position.set(p.x, p.y, p.z);
    d.scale.set(p.th, p.len, 1);
  }, { name: 'rain-shower', cast: false, receive: false });
  mesh.frustumCulled = false;
  mesh.renderOrder = 8;
  mesh.count = 0;
  const group = grp('rain-shower');
  group.add(mesh);
  world.add(group);

  const dummy = new THREE.Object3D();
  let shown = 0;

  engine.onUpdate((dt) => {
    const want = Math.round(N * Math.min(1, Math.max(0, WX.rain)));
    if (want !== shown) {
      shown = want;
      mesh.count = shown;
    }
    if (!shown) return;
    const cam = engine.camera.position;
    const tgt = engine.rig.controls.target;
    const yaw = Math.atan2(cam.x - tgt.x, cam.z - tgt.z);
    const slant = 0.15 * Math.min(2.2, WX.breeze);
    const driftX = 0.62 * WX.breeze;
    const driftZ = 0.26 * WX.breeze;
    for (let i = 0; i < shown; i++) {
      const p = parts[i];
      p.y -= p.v * dt;
      p.x += driftX * dt * p.lean;
      p.z += driftZ * dt * p.lean;
      if (p.y < 0) {
        // 落到台座顶面就回收。雨丝不生成水花，所以不需要问 groundYAt ——
        // 它在地面附近已经被雾吃掉大半，硬算每根丝的地面标高只会白花时间。
        p.y = TOP;
        p.x = x0 + (((i * 0.6180339887) % 1) * spanX + driftX * 3) % spanX;
        p.z = z0 + ((i * 0.3819660113) % 1) * spanZ;
      }
      if (p.x > x1) p.x -= spanX;
      if (p.x < x0) p.x += spanX;
      if (p.z > z1) p.z -= spanZ;
      if (p.z < z0) p.z += spanZ;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, yaw, slant * p.lean);
      dummy.scale.set(p.th, p.len, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  engine.rainShower = { group, mesh, parts };
  return { group, mesh };
}
