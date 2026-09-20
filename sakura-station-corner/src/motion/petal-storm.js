// 落樱系统：空中飘落 + 风旋飞舞 + 地面堆积随风微动
import * as THREE from 'three';
import { MAT } from '../core/materials.js';
import { inst, grp, clipRect, insideClip, groundYAt, sakuraPetalGeo, sakuraPetalRestGeo } from '../core/kit.js';
import { WX } from '../weather/index.js';

export const NAME = 'petal-storm';

/* 花瓣の輪郭は core/kit.js の sakuraPetalGeo()：桜树冠・落枝・道ばらの花弁と几何を共有する */

/* 空中柱：[minX, maxX, minZ, maxZ, 密度权重, 顶高]（底は張らない：足場は地図から取る）
   地面堆：[minX, maxX, minZ, maxZ, 密度权重]
   落地高さを自前で持つと必ず「歩道に埋もれた花びら」が出る（舗面は広場 0.009 /
   駐輪場 0.016 / 歩道 0.15 / ホーム 0.72 と段差が多い）。実際そう見えていたので、
   高さは kit.groundYAt() へ聞きに行く。 */
const ZONES_AIR = [
  [-19, -11.5, -9.5, -1.5, 0.30, 6.4],
  [-3.0, 3.4, -8.0, -0.5, 0.18, 5.6],
  [-2.0, 4.6, -10.0, -3.0, 0.10, 5.4],
  [8.6, 18, 4.0, 12.0, 0.13, 5.6],
  [-18, -9.0, 10.4, 17.6, 0.10, 5.2],
  [-18, 18, -18, 18, 0.19, 7.4],
];

const ZONES_GROUND = [
  [-19.5, -10.0, -10.0, -1.0, 0.26],
  [-3.6, 4.2, -9.6, -1.2, 0.13],
  [-18.2, -12.6, 1.2, 6.6, 0.09],
  [-12.6, -2.2, 4.9, 6.9, 0.10], // 店前歩道（縁石で一段高い）
  [2.2, 9.6, -12.4, -6.0, 0.07],
  [-17.6, -8.4, 13.6, 17.6, 0.10],
  [9.6, 17.6, 3.4, 13.0, 0.07],
  [-17.0, 1.4, -12.2, -9.4, 0.05], // ホーム上（SEG.platform と同じ矩形）
];

function pickZone(zones, r) {
  let total = 0;
  for (const z of zones) total += z[4];
  let acc = 0;
  const target = r * total;
  for (const z of zones) {
    acc += z[4];
    if (target <= acc) return z;
  }
  return zones[zones.length - 1];
}

/**
 * 撒花区域先和裁剪框求交，权重按剩余面积缩放（否则裁掉一半的区域会留下一倍密度）。
 * 台座の外に花びらを撒くと、縁のない空中に粉が点って模型が崩れる。
 */
function clipZones(zones) {
  const out = [];
  for (const z of zones) {
    const r = clipRect(z[0], z[1], z[2], z[3]);
    if (!r) continue;
    const old = Math.max(1e-6, (z[1] - z[0]) * (z[3] - z[2]));
    const c = z.slice();
    c[0] = r[0]; c[1] = r[1]; c[2] = r[2]; c[3] = r[3];
    c[4] = z[4] * ((r[1] - r[0]) * (r[3] - r[2])) / old;
    out.push(c);
  }
  return out;
}

export function attach(engine, world, opts = {}) {
  const group = grp('petal-storm');
  const airZones = clipZones(ZONES_AIR);
  const groundZones = clipZones(ZONES_GROUND);

  // 形は sakuraPetalGeo() のジオメトリ側で持っている（貼图の alpha で抜く方式は
  // 平涂で map が剥がされて四角い紙片になるため、もう使わない）。
  const airMat = MAT.petal({
    tone: 1,
    steps: 2,
    // 発光を強めると、遠景で 1px になった花びらが全部「白い点」として
    // ブルームに飛ぶ。空中の花びらは自己発光させず、透過だけで見せる。
    glow: 0.12,
    rim: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
    dither: 0.004,
  });
  const groundMat = MAT.petal({
    tone: 1,
    steps: 3,
    glow: 0.1,
    rim: 0.42,
    side: THREE.DoubleSide,
    dither: 0.006,
  });

  /* ---------------- 空中飘落 ---------------- */
  const AIR = opts.air ?? 1500;
  const airGeo = sakuraPetalGeo(0.024, 0.020, 0.5);
  const airState = [];
  const airMesh = inst(airGeo, airMat, AIR, (i, d, r, col) => {
    const z = pickZone(airZones, r());
    const x = z[0] + r() * (z[1] - z[0]);
    const zz = z[3] - r() * (z[3] - z[2]);
    const y = z[5] * (0.25 + r() * 0.75);
    d.position.set(x, y, zz);
    d.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
    const s = 0.62 + r() * 0.46;
    d.scale.setScalar(s);
    // 桜色としてちゃんと読める彩度に。旧値（生成色 pale × S 0.20〜0.40 / L 0.90〜0.98）は
    // 線形空間で掛けると #f6e0e7、つまりほぼ白で、空に散ると「白い点」にしか見えなかった。
    // ここは実効 #e5a0ba〜#f1b3c5（PAL.sakuraPetalDeep 付近）＝誰の目にも桜色。
    col.setHSL(0.930 + r() * 0.035, 0.42 + r() * 0.18, 0.62 + r() * 0.18);
    airState.push({
      x, y, z: zz, s,
      spin: new THREE.Vector3((r() - 0.5) * 2.6, (r() - 0.5) * 2.2, (r() - 0.5) * 2.9),
      fall: 0.22 + r() * 0.3,
      swayA: 0.24 + r() * 0.55,
      swayF: 0.5 + r() * 1.25,
      phase: r() * 6.28,
      zone: z,
      drift: 0.16 + r() * 0.4,
      // 足場は舗面ごとに違う（歩道 0.15 / ホーム 0.72）→ 地図に聞いておく
      floor: groundYAt(x, zz) + 0.012,
    });
  }, { name: 'petals-air', cast: false, receive: false });
  airMesh.frustumCulled = false;
  airMesh.renderOrder = 6;
  group.add(airMesh);

  /* ---------------- 地面堆积 ---------------- */
  const GROUND = opts.ground ?? 5200;
  const gGeo = sakuraPetalRestGeo(0.026);
  const gState = [];
  const groundMesh = inst(gGeo, groundMat, GROUND, (i, d, r, col) => {
    const z = pickZone(groundZones, r());
    const x = z[0] + r() * (z[1] - z[0]);
    const zz = z[2] + r() * (z[3] - z[2]);
    // 高さはこの場の舗面そのもの（+3〜12 mm）：歩道 0.15・ホーム 0.72 に也合わせられる
    const y = groundYAt(x, zz) + 0.003 + r() * 0.009;
    d.position.set(x, y, zz);
    d.rotation.set((r() - 0.5) * 0.22, r() * 6.28, (r() - 0.5) * 0.24);
    const s = 0.7 + r() * 0.6;
    d.scale.setScalar(s);
    // 一枚ずつ彩度・明度にムラを持たせる（一律だと地面に絵の具を流したようになる）
    const mix = r();
    col.setHSL(0.930 + mix * 0.035, 0.40 + mix * 0.20, 0.58 + mix * 0.24);
    gState.push({ x, y, z: zz, s, rx: d.rotation.x, ry: d.rotation.y, rz: d.rotation.z, ph: r() * 6.28, wob: 0.4 + r() * 1.3, base: new THREE.Vector3(x, y, zz) });
  }, { name: 'petals-ground', cast: false, receive: true });
  groundMesh.frustumCulled = false;
  group.add(groundMesh);

  world.add(group);

  const dummy = new THREE.Object3D();
  let t = 0;
  const wind = { x: 0.55, z: -0.32 };
  // 镜头接近时的自收缩：微缩模型里「花瓣糊满镜头」会毁掉整张画面，
  // 与其裁剪实例，不如按距离把贴近相机的花瓣缩到 0（缩没比突然消失柔和）。
  const camPos = new THREE.Vector3();
  const NEAR = opts.nearFade ?? 1.1, FAR = opts.nearFull ?? 2.6;
  const nearK = (p) => {
    const dx = p.x - camPos.x, dy = p.y - camPos.y, dz = p.z - camPos.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d <= NEAR) return 0;
    if (d >= FAR) return 1;
    const u = (d - NEAR) / (FAR - NEAR);
    return u * u * (3 - 2 * u);
  };

  let airN = AIR, groundN = GROUND, petalK = -1;
  engine.onUpdate((dt) => {
    t += dt;
    // 天气决定花瓣量：春雨会把樱花打得差不多，但清零会让树冠突然变味，留个尾量更连贯。
    // 用 InstancedMesh.count 收，而不是少建实例 —— 切回晴天时要能立刻回到 1500/5200。
    if (WX.petal !== petalK) {
      petalK = WX.petal;
      airN = Math.round(AIR * petalK);
      groundN = Math.round(GROUND * petalK);
      airMesh.count = airN;
      groundMesh.count = groundN;
    }
    const gust = 0.72 + 0.42 * Math.sin(t * 0.21) + 0.2 * Math.sin(t * 0.63 + 1.7);
    const wx = wind.x * gust, wz = wind.z * gust;
    camPos.copy(engine.camera.position);

    /* 空中：飘落 + 翻滚 + 横向风移，落地后回到树冠 */
    for (let i = 0; i < airN; i++) {
      const p = airState[i];
      p.y -= p.fall * dt * (0.75 + 0.5 * gust);
      p.x += (wx * p.drift + Math.sin(t * p.swayF + p.phase) * p.swayA * 0.42) * dt;
      p.z += (wz * p.drift + Math.cos(t * p.swayF * 0.83 + p.phase * 1.7) * p.swayA * 0.36) * dt;
      // 風で 5 m 程流されるので、足場の高さは地上近くで毎回確認し直す。
      // 台座の外へ出たら戻す（外に浮いた粉は模型を壊す）。
      if (p.y < 0.9) p.floor = groundYAt(p.x, p.z) + 0.012;
      if (p.y < p.floor || !insideClip(p.x, p.z)) {
        const z = p.zone;
        p.x = z[0] + Math.random() * (z[1] - z[0]);
        p.z = z[3] - Math.random() * (z[3] - z[2]);
        p.y = z[5] * (0.6 + Math.random() * 0.42);
        p.floor = groundYAt(p.x, p.z) + 0.012;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(
        p.phase + t * p.spin.x * 0.72,
        p.spin.y * t * 0.6 + Math.sin(t * 0.7 + p.phase) * 0.6,
        p.spin.z * t * 0.5 + Math.cos(t * 0.53 + p.phase) * 0.4,
      );
      dummy.scale.setScalar(p.s * nearK(dummy.position));
      dummy.updateMatrix();
      airMesh.setMatrixAt(i, dummy.matrix);
    }
    airMesh.instanceMatrix.needsUpdate = true;

    /* 地面：随风轻微挪动与翻边（幅度极小，保持静谧） */
    for (let i = 0; i < groundN; i++) {
      const p = gState[i];
      const s = Math.sin(t * p.wob * 0.55 + p.ph);
      dummy.position.set(
        p.base.x + s * 0.012 * gust + wx * 0.014,
        p.base.y + Math.abs(s) * 0.006 * gust,
        p.base.z + Math.cos(t * p.wob * 0.43 + p.ph) * 0.011 + wz * 0.012,
      );
      dummy.rotation.set(p.rx + s * 0.05, p.ry, p.rz + s * 0.05);
      dummy.scale.setScalar(p.s * nearK(dummy.position));
      dummy.updateMatrix();
      groundMesh.setMatrixAt(i, dummy.matrix);
    }
    groundMesh.instanceMatrix.needsUpdate = true;
  });

  engine.petalStorm = { group, airMesh, groundMesh, airState, gState };
  return { group, airMesh, groundMesh };
}
