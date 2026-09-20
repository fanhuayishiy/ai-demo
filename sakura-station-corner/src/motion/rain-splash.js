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

  const geo = new THREE.RingGeometry(0.88, 1, 20);
  geo.rotateX(-Math.PI / 2);
  // 环厚 = (1-0.88) = 半径的 12%。原来是 0.82 → 18%，配上近白色和 0.4 的不透明度，
  // 在湿沥青上读起来像打孔出来的白圈，而不是水花。
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#cfe0ee'),
    transparent: true,
    opacity: 0.24,
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

  // 水花落在「注视点周围 r=7 的圆盘」里。原来用 clamp 把出界的样本压回裁剪框，
  // 于是注视点靠近台座边缘时，一排水花被整齐地钉在边界线上 —— 就是路缘那条
  // 「气泡带」（`shots/readme/crossing-rain.png`）。改成拒绝采样：出界就重掷，
  // 连续 8 次都不合格才退回圆心附近，分布因此保持均匀。
  const spawn = (r, cx, cz) => {
    for (let k = 0; k < 8; k++) {
      const a = r() * 6.283;
      const rr = Math.sqrt(r()) * R;
      const x = cx + Math.cos(a) * rr;
      const z = cz + Math.sin(a) * rr;
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return [x, z];
    }
    const a = r() * 6.283;
    const rr = Math.sqrt(r()) * 1.2;
    return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr];
  };

  const parts = [];
  for (let i = 0; i < N; i++) {
    const r = mulberry32(i * 6151 + 7);
    const [x, z] = spawn(r, 0, 0);
    const life = 0.34 + r() * 0.26;
    // 半径 0.026..0.052 m，配合下面的生长倍率，最大直径约 15 cm。
    // 原来是 0.05..0.105 × 生长 1.45 → 直径最大 30 cm，比真实水花大了一倍。
    parts.push({ x, z, y: groundYAt(x, z) + 0.004, t: r() * life, life, s: 0.026 + r() * 0.026 });
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
        [p.x, p.z] = spawn(rnd, c.x, c.z);
        p.y = groundYAt(p.x, p.z) + 0.004;
        p.life = 0.34 + rnd() * 0.26;
        p.s = 0.026 + rnd() * 0.026;
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
