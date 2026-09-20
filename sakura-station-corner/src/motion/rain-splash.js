// 雨滴水花：落在地面上的一圈圈扩散细环。
//
// 形状同样在几何里（RingGeometry 转平），不靠贴图 alpha —— 平涂会剥掉非 graphic 材质的 map。
// 每帧要动的实例只有 weather 给的那点量（rain=0 时 count 归 0，非雨天完全零开销）。
// 环的「消失」用缩回来做，而不是淡出：InstancedMesh 共享一个材质，
// 做不到逐实例 alpha，而为了这个再加一套 instanceColor 驱动的属性不值得。
import * as THREE from 'three';
import { grp, clipRect, groundYAt } from '../core/kit.js';
import { mulberry32 } from '../core/textures.js';
import { WX } from '../weather/index.js';

export const NAME = 'rain-splash';

const N = 320;
const R = 7;   // 水花跟着注视点走：整块 40 m 台座上均摊的话，镜头里只剩两三圈，看着像没做

export function attach(engine, world) {
  const box = clipRect(-20, 20, -20, 20) || [-20, 20, -20, 20];
  const [x0, x1, z0, z1] = box;
  const spanX = x1 - x0;
  const spanZ = z1 - z0;

  const geo = new THREE.RingGeometry(0.82, 1, 18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#e3edf6'),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.name = 'rain-splash';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 7;
  mesh.count = 0;

  const parts = [];
  for (let i = 0; i < N; i++) {
    const r = mulberry32(i * 6151 + 7);
    const x = x0 + r() * spanX;
    const z = z0 + r() * spanZ;
    const life = 0.42 + r() * 0.3;
    parts.push({ x, z, y: groundYAt(x, z) + 0.004, t: r() * life, life, s: 0.05 + r() * 0.055 });
  }
  const group = grp('rain-splash');
  group.add(mesh);
  world.add(group);

  const dummy = new THREE.Object3D();
  const rnd = mulberry32(20260920);
  let shown = 0;

  engine.onUpdate((dt) => {
    const want = Math.round(N * Math.min(1, Math.max(0, WX.rain)));
    if (want !== shown) {
      shown = want;
      mesh.count = shown;
    }
    if (!shown) return;
    for (let i = 0; i < shown; i++) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) {
        p.t = 0;
        const c = engine.rig.controls.target;
        const a = rnd() * 6.283;
        const rr = Math.sqrt(rnd()) * R;
        p.x = Math.min(x1, Math.max(x0, c.x + Math.cos(a) * rr));
        p.z = Math.min(z1, Math.max(z0, c.z + Math.sin(a) * rr));
        p.y = groundYAt(p.x, p.z) + 0.004;
        p.life = 0.42 + rnd() * 0.3;
        p.s = 0.05 + rnd() * 0.055;
      }
      const k = p.t / p.life;
      const grow = 1 - (1 - k) * (1 - k) * (1 - k);
      const collapse = k < 0.7 ? 1 : Math.max(0, (1 - k) / 0.3);
      const s = p.s * (0.3 + grow * 1.15) * collapse;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(s, 1, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  engine.rainSplash = { group, mesh, parts };
  return { group, mesh };
}
