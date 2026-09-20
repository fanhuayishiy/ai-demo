import { g as grp, M as MAT, P as PAL, T as TEX, l as catenary, m as mesh, k as tubeOf, c as cyl, r as rbox, n as range, b as box, S as Shape, R as ExtrudeGeometry, w as weather, H as plane, E as inst, q as finish, t as tor, V as Vector3, z as rand } from './index-D8uBk-tk.js';

//  assets/buildings/utility-background.js —— 軌道北側の遠景「電設」レイヤー
//  ※ 法面・防護柵・杉竹シルエット・水田は flora/grass-slope.js が既に担当している。
//    本モジュールはその稜線より「上と奥」だけを担当し、二重に盛らない：
//      ① 送電鉄塔 2 基（格鋼・4 脚＋X 筋・3 段腕金・碍子 string・昇降金・赤白標識・基礎とアンカーボルト）
//      ② 3 相導体＋架空地線（**両端は必ず碍子下端の線留めに終端**。档内は断面が平行で交差しない）
//      ③ 導体間スペーサ／終端金具
//      ④ 線の手前に覗く遠景民家 4 户（切妻屋根・妻三角・煙突。壁は 4 面実体）
//  単位 m / 原点 = 接地面中心（y=0＝法先＝街道面）/ +Z = 線路側。装配は (0,0,-17.4)・rotY 0。

const meta = {
  id: 'utility-background',
  real: [36, 8.1, 1.4],
  origin: 'ground-center',
};

const DEFAULT_OPTIONS = { seed: 807, span: 36 };

const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const noOut = (o) => { o.userData.noOutline = true; return o; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 脚・筋・腕金を「見た方向へ立てる」：Y 軸の箱を 2 点間に架ける
 *  ※ lookAt は方向が up(+Y) と平行になると縮退する（鉄塔の脚はほぼ垂直）。
 *     よって setFromUnitVectors で直接回転を組む。 */
const UPV = new Vector3(0, 1, 0);
function strut(parent, mat, a, b, w, t, name) {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = d.length() || 0.001;
  const m = mesh(box(w, rq(len), t), mat, { pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], name });
  m.quaternion.setFromUnitVectors(UPV, d.normalize());
  parent.add(m);
  return m;
}

/* =================================================================== 鉄塔 */
function tower(M, { x, z, h, seed, lean = 0 }) {
  const g = grp('lattice-tower', { pos: [x, 0, z], rotY: lean });
  const baseW = 1.02, topW = 0.34;
  const SEG_H = 0.78, NSEG = Math.max(4, Math.round((h - 1.4) / SEG_H));
  const bodyH = NSEG * SEG_H;
  const halfAt = (t) => baseW / 2 + (topW / 2 - baseW / 2) * t;
  const steel = M.towerSteel, bolt = M.towerBolt;

  /* 基礎（4 隅の RC 台・露出アンカーボルト・根回し石） */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * baseW / 2, pz = sz * baseW / 2;
    g.add(mesh(rbox(0.36, 0.24, 0.36, 0.02, 2), M.towerFnd, { pos: [px, 0.12, pz], name: 'footing' }));
    g.add(noOut(mesh(box(0.32, 0.02, 0.32), M.towerFndDark, { pos: [px, 0.245, pz], cast: false, name: 'footing-dab' })));
    for (let k = 0; k < 4; k++) {
      g.add(mesh(cyl(0.008, 0.008, 0.10, 6), bolt, { pos: [px + (k % 2 ? 0.10 : -0.1), 0.29, pz + (k < 2 ? 0.10 : -0.1)], name: 'anchor-bolt' }));
      g.add(noOut(mesh(box(0.026, 0.008, 0.026), bolt, { pos: [px + (k % 2 ? 0.10 : -0.1), 0.342, pz + (k < 2 ? 0.10 : -0.1)], cast: false, name: 'washer-nut' })));
    }
    g.add(noOut(mesh(box(0.52, 0.04, 0.52), M.grassDry, { pos: [px, 0.02, pz], cast: false, receive: true, name: 'footing-apron' })));
  }
  /* 4 脚 */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    strut(g, steel, [sx * halfAt(0), 0.24, sz * halfAt(0)], [sx * halfAt(1), 0.24 + bodyH, sz * halfAt(1)], 0.052, 0.052, 'leg');
  }
  /* 水平帯 + 各面 X 筋 */
  for (let i = 0; i <= NSEG; i++) {
    const t = i / NSEG, hw = halfAt(t), y = 0.24 + i * SEG_H;
    for (const s of [-1, 1]) {
      g.add(mesh(box(rq(hw * 2), 0.032, 0.030), steel, { pos: [0, y, s * hw], name: 'girt' }));
      g.add(mesh(box(0.030, 0.032, rq(hw * 2)), steel, { pos: [s * hw, y, 0], name: 'girt' }));
    }
    if (i === NSEG) break;
    const j = (i + 1) / NSEG, hw2 = halfAt(j), y1 = y + SEG_H;
    for (const s of [-1, 1]) {
      strut(g, steel, [-hw, y, s * hw], [hw2, y1, s * hw2], 0.020, 0.016, 'brace');
      strut(g, steel, [hw, y, s * hw2], [-hw2, y1, s * hw], 0.020, 0.016, 'brace');
      strut(g, steel, [s * hw, y, -hw], [s * hw2, y1, hw2], 0.020, 0.016, 'brace');
      strut(g, steel, [s * hw, y, hw], [s * hw2, y1, -hw2], 0.020, 0.016, 'brace');
    }
  }
  /* 腕金 3 段（下段が長い＝実系配列）＋ 碍子 string ＋ 線留め */
  const anchors = [];
  const armY = [0.24 + bodyH + 0.30, 0.24 + bodyH + 0.94, 0.24 + bodyH + 1.46];
  const armW = [1.30, 1.10, 0.90];
  for (let i = 0; i < 3; i++) {
    const y = armY[i], w = armW[i];
    for (const s of [-1, 1]) {
      g.add(mesh(box(rq(w), 0.038, 0.052), steel, { pos: [s * w / 2, y, 0], name: 'arm' }));
      g.add(mesh(box(rq(w * 0.9), 0.020, 0.020), steel, { pos: [s * w * 0.45, y - 0.24, 0], rot: [0, 0, s * 0.30], name: 'arm-diag' }));
      const tipX = s * (w - 0.05);
      g.add(mesh(box(0.030, 0.30, 0.030), steel, { pos: [tipX, y - 0.16, 0], name: 'arm-stub' }));
      // 碍子（5 枚のディスク＋スカート）＝線はこの下端に留まる
      for (let k = 0; k < 5; k++) {
        g.add(noOut(mesh(cyl(0.032, 0.032, 0.015, 10), M.insulator, { pos: [tipX, y - 0.32 - k * 0.030, 0], cast: false, name: 'insulator' })));
        g.add(noOut(mesh(tor(0.037, 0.006, 4, 10), M.insulator, { pos: [tipX, y - 0.328 - k * 0.030, 0], rot: [Math.PI / 2, 0, 0], cast: false, name: 'insulator-skirt' })));
      }
      const ay = y - 0.32 - 5 * 0.030;
      g.add(mesh(box(0.055, 0.036, 0.055), bolt, { pos: [tipX, ay - 0.01, 0], name: 'tension-clamp' }));
      anchors.push([tipX, ay - 0.045, 0]);
    }
  }
  /* 架空地線支持（頂部の小柱 2 本＋交差） */
  const topY = armY[2] + 0.46;
  for (const s of [-1, 1]) g.add(mesh(box(0.026, 0.46, 0.026), steel, { pos: [s * 0.15, armY[2] + 0.23, 0], name: 'peak-post' }));
  g.add(mesh(box(0.36, 0.026, 0.026), steel, { pos: [0, topY, 0], name: 'peak-cross' }));
  anchors.push([0, topY + 0.055, 0]);
  /* 付帯：昇降 peg・点検扉・立入禁止札・番号板・航空障害灯 */
  for (let i = 0; i < NSEG; i++) g.add(mesh(box(0.36, 0.014, 0.014), bolt, { pos: [0, 0.40 + i * SEG_H, halfAt(i / NSEG) + 0.055], name: 'climbing-peg' }));
  const door = grp('access-door', { pos: [0, 0.62, halfAt(0.06) + 0.03] });
  g.add(door);
  door.add(mesh(box(0.34, 0.46, 0.014), M.towerPlate, { name: 'door-plate' }));
  door.add(mesh(box(0.30, 0.010, 0.010), M.towerSteel, { pos: [0, 0.14, 0.012], name: 'door-hinge-bar' }));
  door.add(noOut(mesh(cyl(0.012, 0.012, 0.012, 8), bolt, { pos: [0.12, -0.06, 0.014], rot: [Math.PI / 2, 0, 0], cast: false, name: 'door-lock' })));
  g.add(mesh(box(0.30, 0.20, 0.010), M.towerSign, { pos: [-0.3, 1.42, halfAt(0.2) + 0.04], name: 'danger-sign' }));
  g.add(mesh(box(0.20, 0.13, 0.008), M.towerPlate, { pos: [0.34, 1.30, halfAt(0.22) + 0.03], rot: [0, 0, 0.06], name: 'number-plate' }));
  /* 航空障害灯（点滅）：userData.breathe は「灯器だけの下位ノード」に限定する。
     塔グループ全体に付けると light-breath が脚・筋・腕金の全 Mesh（約 400 基/塔）を
     個別マテリアルへ置換し、ユニフォーム別枠＝プログラム再コンパイル地獄になる。 */
  const beacon = grp('obstacle-beacon', { pos: [0, topY + 0.12, 0] });
  g.add(beacon);
  beacon.add(mesh(cyl(0.055, 0.055, 0.05, 12), M.obstacleLamp, { name: 'lamp-globe' }));
  beacon.add(noOut(mesh(tor(0.062, 0.008, 4, 12), M.towerBolt, { pos: [0, -0.025, 0], rot: [Math.PI / 2, 0, 0], cast: false, name: 'lamp-bracket' })));
  beacon.userData.breathe = { speed: 0.55, amount: 0.16, phase: (seed % 7) / 7 * 6.283 };
  // 赤白航空障害標識（上段脚 2 本）
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.add(noOut(mesh(box(0.058, 0.24, 0.058), i % 2 ? M.towerRed : M.towerWhite, { pos: [s * (topW / 2 - 0.01), 0.24 + bodyH - 0.34 + i * 0.24, s * (topW / 2 - 0.01)], cast: false, name: 'mark-band' })));
    }
  }
  weather(g, { w: 0.6, h: 0.8, pos: [0.42, 0.55, 0.42], kind: 'rust', color: PAL.rust, opacity: 0.44, seed: seed + 3, density: 1.9, count: 3, spread: 0.24 });
  weather(g, { w: 0.5, h: 0.6, pos: [-0.4, 1.5, -0.4], rot: [0, Math.PI, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.36, seed: seed + 5, density: 1.7, count: 2 });
  return { group: g, anchors, topY, bodyH };
}

/* ================================================================== build */
function build(options = {}) {
  const seed = (options.seed ?? 807) | 0;
  const rnd = rand(seed);
  Math.max(12, options.span ?? 36);
  const g = grp('utility-background');

  const M = {
    towerSteel: MAT.metal('#9aa0a4', { worn: 0.66, repeat: 2, spec: 0.42 }),
    towerBolt: MAT.metal('#7f8286', { worn: 0.8, spec: 0.3 }),
    towerFnd: MAT.concrete({ base: '#b3ada0', repeat: 1, joints: 1 }),
    towerFndDark: MAT.concrete({ base: '#918b7f', repeat: 1 }),
    towerPlate: MAT.metal('#b8bcbe', { worn: 0.5, spec: 0.4 }),
    towerSign: MAT.paint('#e6e0cc', { map: TEX.signboard({ text: '立入禁止', sub: '高圧危険', bg: '#efe9d6', fg: '#8d2f2a', stripe: '#f0c353', ar: 1.5 }), spec: 0.14, steps: 3 }),
    towerRed: MAT.paint('#c0524a', { spec: 0.16, steps: 2 }),
    towerWhite: MAT.paint('#efe9dc', { spec: 0.16, steps: 2 }),
    insulator: MAT.paint('#7f8b7f', { spec: 0.62, specPower: 130, steps: 3, shadowAmt: 0.86 }),
    obstacleLamp: MAT.paint('#d9dce0', { spec: 0.5, emissive: '#ffd9a0', emissiveIntensity: 0.22, steps: 2 }),
    wire: MAT.rubber('#2a2c30', { spec: 0.18, steps: 2 }),
    wireBare: MAT.metal('#a9aeb1', { worn: 0.3, spec: 0.6, repeat: 2 }),
    roof: MAT.roofTile({ base: '#63636c', repeat: 1 }),
    roofFar: MAT.paint('#8b8f9c', { spec: 0.08, steps: 2, sat: 0.7, tint: '#dfe6f0' }),
    wallFar: MAT.paint('#cdc8bb', { spec: 0.08, steps: 2, sat: 0.74 }),
    dirt: MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 1 }).map, spec: 0.03, shadowAmt: 0.97 }),
    grassDry: MAT.grass({ base: '#a8ab74', repeat: 1, sat: 0.86 }),
    leafDead: MAT.paper({ color: '#a8895c' }),
  };

  /* ---------------- ① 鉄塔 2 基 ---------------- */
  const tA = tower(M, { x: -9.8, z: -0.34, h: 6.5, seed: seed + 11, lean: 1.2 });
  const tB = tower(M, { x: 12.6, z: -0.4, h: 6.1, seed: seed + 19, lean: -0.9 });
  g.add(tA.group); g.add(tB.group);

  /* ---------------- ② 導体（両端＝碍子下端の線留め。档内で交差しない） ---------------- */
  const wires = grp('transmission');
  g.add(wires);
  const sagRef = 0.78;
  const spans = [];
  for (let i = 0; i < tA.anchors.length; i++) {
    const a = [tA.group.position.x + tA.anchors[i][0], tA.anchors[i][1], tA.group.position.z + tA.anchors[i][2]];
    const b = [tB.group.position.x + tB.anchors[i][0], tB.anchors[i][1], tB.group.position.z + tB.anchors[i][2]];
    const d = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const isEarth = i === tA.anchors.length - 1;
    const sag = clamp(sagRef * Math.pow(d / 22, 2) * (isEarth ? 0.82 : 1), 0.06, sagRef);
    const pts = catenary(a, b, sag, 46).map((v) => [v.x, v.y, v.z]);
    const line = [[a[0] + (tA.group.position.x - a[0]) * 0.06, a[1] - 0.01, a[2] + (tA.group.position.z - a[2]) * 0.06], ...pts,
      [b[0] + (tB.group.position.x - b[0]) * 0.06, b[1] - 0.01, b[2] + (tB.group.position.z - b[2]) * 0.06]];
    wires.add(mesh(tubeOf(line, isEarth ? 0.010 : 0.017, Math.max(64, line.length * 3), 6), isEarth ? M.wireBare : M.wire, { name: isEarth ? 'earth-wire' : `phase-${i}` }));
    spans.push({ a, b, sag, isEarth });
  }
  /* 導体間スペーサ（2 箇所／档）＝束に見せない間隔保持金 */
  for (let k = 1; k <= 2; k++) {
    const t = k / 3;
    for (let i = 0; i < 3; i++) {
      const A = spans[i], B = spans[i + 1];
      if (!B || A.isEarth || B.isEarth) continue;
      const yA = A.a[1] - Math.sin(Math.PI * t) * A.sag;
      const yB = B.a[1] - Math.sin(Math.PI * t) * B.sag;
      const x = A.a[0] + (A.b[0] - A.a[0]) * t;
      const z = A.a[2] + (A.b[2] - A.a[2]) * t;
      wires.add(noOut(mesh(cyl(0.007, 0.007, Math.abs(yA - yB) - 0.05, 6), M.towerSteel, { pos: [x, (yA + yB) / 2, z], cast: false, name: 'conductor-spacer' })));
      for (const y of [yA, yB]) wires.add(noOut(mesh(rbox(0.030, 0.022, 0.030, 0.004, 1), M.towerBolt, { pos: [x, y, z], cast: false, name: 'spacer-clamp' })));
    }
  }
  /* 鉄塔の反対側（山側）には線を延ばさない＝この 2 基で終端する耐張構成。
     線は碍子下端の線留めで終わり、空中で切れた端を作らない。 */
  for (const t of [tA, tB]) {
    for (let i = 0; i < 3; i++) {
      const ax = t.anchors[i][0] + t.group.position.x, ay = t.anchors[i][1], az = t.anchors[i][2] + t.group.position.z;
      // 耐張クサビ金具と碍子を繋ぐ金具棒（線端が杆から遊離して見えない為の受け）
      wires.add(noOut(mesh(cyl(0.010, 0.010, 0.10, 6), M.towerBolt, { pos: [ax, ay + 0.07, az], cast: false, name: 'tension-rod' })));
      wires.add(mesh(rbox(0.045, 0.055, 0.045, 0.006, 1), M.towerBolt, { pos: [ax, ay + 0.02, az], name: 'wedge-grip' }));
    }
  }

  /* ---------------- ③ 稜線に覗く遠景民家 ---------------- */
  const houses = grp('far-houses');
  g.add(houses);
  for (let i = 0; i < 5; i++) {
    const x = -15.5 + i * 6.4 + range(rnd, -1.2, 1.2);
    const z = -0.05 + range(rnd, -0.06, 0.05);
    const w = range(rnd, 2.1, 3.2), d = range(rnd, 1.1, 1.5), wallH = range(rnd, 0.42, 0.62), ridge = wallH + range(rnd, 0.78, 1.05);
    const hg = grp('far-house', { pos: [x, 0.30, z], rotY: range(rnd, -16, 16) });
    houses.add(hg);
    hg.add(mesh(box(rq(w), rq(wallH), rq(d)), M.wallFar, { pos: [0, wallH / 2, 0], name: 'far-wall' }));
    const run = d / 2 + 0.16, ang = Math.atan2(ridge - wallH, run);
    for (const s of [-1, 1]) {
      const len = Math.hypot(run, ridge - wallH);
      hg.add(mesh(box(rq(w + 0.24), 0.055, rq(len)), M.roofFar, { pos: [0, (wallH + ridge) / 2, s * run / 2], rot: [s * ang, 0, 0], name: 'far-roof' }));
    }
    hg.add(mesh(box(rq(w + 0.26), 0.05, 0.10), M.roof, { pos: [0, ridge + 0.03, 0], name: 'far-ridge' }));
    for (const s of [-1, 1]) {
      const tri = new Shape();
      tri.moveTo(-run, wallH); tri.lineTo(run, wallH); tri.lineTo(0, ridge); tri.closePath();
      const geo = new ExtrudeGeometry(tri, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
      hg.add(mesh(geo, M.wallFar, { pos: [s * (w / 2), 0, -0.025], rot: [0, s * Math.PI / 2, 0], name: 'far-gable' }));
    }
    hg.add(mesh(box(0.16, 0.34, 0.16), M.towerFnd, { pos: [w * 0.22, ridge + 0.18, -0.18], name: 'far-chimney' }));
    hg.add(noOut(mesh(box(0.19, 0.03, 0.19), M.towerFndDark, { pos: [w * 0.22, ridge + 0.36, -0.18], cast: false, name: 'chimney-cap' })));
    // 屋根の苔・瓦のズレ
    weather(hg, { w: w * 0.7, h: 0.4, pos: [0, ridge - 0.2, run * 0.4], rot: [-ang, 0, 0], kind: 'moss', color: '#63804e', opacity: 0.4, seed: seed + 23 + i, density: 1.7, count: 2 });
  }

  /* ---------------- ④ 鉄塔敷地の地面（法肩の土・枯草） ---------------- */
  for (const t of [tA, tB]) {
    g.add(noOut(mesh(box(2.6, 0.05, 1.7), M.dirt, { pos: [t.group.position.x, 0.025, t.group.position.z], cast: false, receive: true, name: 'tower-pad' })));
  }
  const tuftGeo = plane(0.05, 1, 1, 1).clone();
  tuftGeo.translate(0, 0.5, 0);
  g.add(inst(tuftGeo, M.grassDry, 260, (i, d, r, col) => {
    const near = i % 2 ? tA.group.position.x : tB.group.position.x;
    d.position.set(near + range(r, -1.3, 1.3), 0.05, -0.34 + range(r, -0.6, 0.5));
    d.rotation.set(r() * 0.4 - 0.2, r() * 6.283, r() * 0.6 - 0.3);
    const s = 0.5 + r() * 0.9; d.scale.set(s * 0.8, 0.08 + r() * 0.16, s);
    const k = 0.72 + r() * 0.5; col.setRGB(k * 1.02, k, k * 0.78);
  }, { name: 'tower-tufts', cast: false, receive: true }));

  return finish(g, { outline: 'thin', minSize: 0.10 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
