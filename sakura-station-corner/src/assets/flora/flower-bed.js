//  assets/flora/flower-bed.js —— 駅前の花壇（レンガ＋コンクリート縁石／パンジー・チューリップ・ムスカリ）
//  ・一輪ごとに独立 Mesh、row/grid で枠組みつつ傾き・色相・高さを逐朵ランダム化
//  ・撒水跡・苔・欠けた縁石・枯れ茎などの経年表現／単位メートル・原点＝接地中心・正面 +Z
import * as THREE from 'three';
import { grp, mesh, box, cyl, rbox, sph, tor, circ, finish, rand, range, weather, decal, inst, row } from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'flower-bed',
  real: [2.2, 0.42, 0.9],       // w=2.2, d=0.9（花穂 + 名牌込みの高さ）
  origin: 'ground-center',
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));

/** 花弁図元：細分区画の平面をハート／扇形に成型し、わずかに湾曲させる */
function petalGeo(w, h, { notch = 0.0, dome = 0.22, curl = 0.5 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, 4, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = cl((y + h / 2) / h, 0, 1);
    const prof = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.55);
    let nx = x * (0.22 + prof * 0.95);
    if (notch && t > 0.86) nx *= 1 - notch * (t - 0.86) / 0.14 * Math.abs(Math.sign(x));   // 弁先のくぼみ
    p.setX(i, nx);
    p.setY(i, y + Math.pow(t, 2) * h * curl * 0.12);
    p.setZ(i, (1 - Math.pow(cl(x / (w / 2), -1, 1), 2)) * h * dome + Math.pow(t, 2.2) * h * 0.28);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
/** 葉身図元（チューリップの剣状葉・葉ボタンの平葉など） */
function bladeGeo(w, h, { bend = 0.35, taper = 0.28, twist = 0.25 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, 2, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = cl((y + h / 2) / h, 0, 1);
    p.setX(i, x * (1 - taper * Math.pow(t, 2)));
    p.setY(i, y);
    p.setZ(i, Math.pow(t, 1.7) * h * bend + Math.sin(t * 3.4) * w * 0.18 + x * twist * t);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}

export function build(options = {}) {
  const w = options.w ?? 2.2;
  const d = options.d ?? 0.9;
  const seed = (options.seed ?? 31) | 0;
  const rnd = rand(seed);

  const g = grp('flower-bed');

  /* ---------------- 色（PAL 基準の春の花壇色に微調） ---------------- */
  const C = {
    brick: '#a8705c', brickOld: '#96604e', brickNew: '#c08a6e',
    pansy: ['#efe7f2', '#6a5486', '#e6cf8f', '#b3765f', '#f2eee2'],
    tulip: ['#c4564f', '#e0b64a', '#e5bcc8', '#efe4cf'],
    muscari: ['#5f72ad', '#465a8f', '#8ea0c9'],
    stemGreen: '#6f8f52', leafGreen: '#7d9c5c', leafGlauc: '#88a377',
    soil: '#4c3b28', soilWet: '#33271b',
  };

  /* ---------------- 素材 ---------------- */
  const matBrick = MAT.paving({ color: C.brick, mode: 'run', cells: 3, repeat: 1 });
  const matBrickOld = MAT.paving({ color: C.brickOld, mode: 'run', cells: 3, repeat: 1 });
  const matBrickNew = MAT.paving({ color: C.brickNew, mode: 'block', cells: 2, repeat: 1 });
  const matKerb = MAT.concrete({ base: PAL.concreteDark, repeat: 2, joints: 3 });
  const matMortar = MAT.concrete({ base: '#8f887a', repeat: 1 });
  const matSoil = MAT.concrete({ base: C.soil, repeat: 5 });
  const matSoilDark = MAT.concrete({ base: C.soilWet, repeat: 3 });
  const matStem = MAT.leaf({ color: C.stemGreen, alphaTest: 0.0, rim: 0.24, emissiveIntensity: 0.04, shadowAmt: 0.8 });
  const matLeafG = MAT.leaf({ color: C.leafGreen, alphaTest: 0.0, rim: 0.3, emissiveIntensity: 0.06 });
  const matLeafB = MAT.leaf({ color: C.leafGlauc, alphaTest: 0.0, rim: 0.26, emissiveIntensity: 0.05, sat: 0.9 });
  const matDead = MAT.wood({ light: '#9d8f72', dark: '#6a5b45', repeat: 1 });
  const petalMat = (col) => MAT.paint(col, { steps: 3, spec: 0.12, specPower: 20, specCut: 0.5, sheen: 0.03, shadowAmt: 0.66, side: THREE.DoubleSide, rim: 0.2, rimColor: '#fff0f6', sat: 1.04 });
  const matPansy = C.pansy.map(petalMat);
  const matTulip = C.tulip.map(petalMat);
  const matMuscari = C.muscari.map((c) => MAT.food({ color: c, spec: 0.34, specPower: 60, steps: 3 }));
  const matPistil = MAT.food({ color: '#f0d98a', spec: 0.4, specPower: 40, steps: 2 });
  const matSignWood = MAT.wood({ light: '#c9b48c', dark: '#8f7a55', repeat: 1, knots: true });
  const matWire = MAT.darkIron({ spec: 0.3 });

  /* ---------------- 縁石（長辺＝レンガ 2 段、短辺＝コンクリート枠＝補修混在） ---------------- */
  const rimH = 0.17, brickH = 0.055, brickL = 0.205, brickT = 0.095;
  const soil = grp('soil-mass');
  g.add(soil);
  // 土壌本体（下地 + 表土：厚みを持たせて底も見る）
  const bedW = w - brickT * 1.5, bedD = d - brickT * 1.5;
  soil.add(mesh(box(w - 0.02, 0.12, d - 0.02), matKerb, { pos: [0, 0.03, 0], name: 'bed-base' }));
  const SOIL_Y = rimH - 0.055;                        // 土面（縁石より 5.5cm 低い＝水やり受け）
  const soilSurf = mesh(box(bedW, 0.07, bedD), matSoil, { pos: [0, SOIL_Y - 0.035, 0], name: 'soil' });
  soil.add(soilSurf);
  // 表土の微隆起（鍬でならした筋）
  for (let i = 0; i < 5; i++) {
    const rr = range(rnd, 0.06, 0.11);
    soil.add(mesh(cyl(rr, rr * 1.9, 0.03, 8), matSoil, { pos: [range(rnd, -bedW * 0.4, bedW * 0.4), SOIL_Y + 0.006, range(rnd, -bedD * 0.28, bedD * 0.28)], scale: [1, 1, 0.6], name: 'soil-hump' }));
  }

  /** 1 個の砖（本体＋必要なら欠けの補修片）：独立オブジェクトのまま群でまとめる */
  function mkBrick(mat, len, chip) {
    const b = grp('brick');
    b.add(mesh(rbox(len, brickH, brickT, 0.008, 2), mat, { name: 'brick-body' }));
    if (chip) {
      b.add(mesh(box(len * 0.17, brickH * 0.42, brickT * 0.42), matBrickNew, { pos: [len * 0.34, -brickH * 0.2, brickT * 0.26], rot: [0, 0.3, 0.22], name: 'brick-patch' }));
    }
    return b;
  }
  /** 砖の列（running bond：段ごとに半砖ずらし、目地 6mm、僅かな浮き沈み） */
  function brickRun(parent, axis, fixed, count, layer) {
    const span = count * (brickL + 0.006);
    for (let i = 0; i < count; i++) {
      const p = -span / 2 + i * (brickL + 0.006) + brickL / 2 + (layer % 2 ? brickL * 0.5 : 0);
      if (Math.abs(p) > (axis === 'x' ? w : d) / 2 - brickT * 0.4) continue;     // 角はコーナー柱に譲る
      const mat = layer === 0 && rnd() > 0.74 ? matBrickOld : (rnd() > 0.93 ? matBrickNew : matBrick);
      const b = mkBrick(mat, brickL - 0.007, rnd() > 0.87);
      const y = layer * brickH + brickH / 2 + range(rnd, -0.004, 0.006);
      if (axis === 'x') b.position.set(p, y, fixed);
      else { b.position.set(fixed, y, p); b.rotation.y = Math.PI / 2; }
      b.rotation.y += range(rnd, -0.025, 0.025);
      b.rotation.x = range(rnd, -0.02, 0.02);
      b.rotation.z = range(rnd, -0.015, 0.015);
      parent.add(b);
    }
  }
  const wall = grp('brick-wall');
  g.add(wall);
  const halfX = w / 2 - brickT / 2, halfZ = d / 2 - brickT / 2;
  for (let layer = 0; layer < 3; layer++) {
    brickRun(wall, 'x', halfZ, Math.ceil(w / brickL), layer);
    brickRun(wall, 'x', -halfZ, Math.ceil(w / brickL), layer);
    brickRun(wall, 'z', halfX, Math.ceil(d / brickL), layer);
    brickRun(wall, 'z', -halfX, Math.ceil(d / brickL), layer);
  }
  /* ---------------- 端はコンクリート縁石で補強（駅前の補修跡） ---------------- */
  for (const sgn of [-1, 1]) {
    const cap = mesh(rbox(brickT + 0.02, rimH + 0.02, brickT + 0.02, 0.01, 2), matKerb, { pos: [sgn * halfX, (rimH + 0.02) / 2 - 0.01, halfZ], name: 'corner-post' });
    g.add(cap);
    const cap2 = cap.clone();
    cap2.position.z = -halfZ;
    g.add(cap2);
  }
  // 笠コンクリート（+Z 側だけ段違い＝後から足した補修）
  const cope = mesh(box(w * 0.42, 0.028, brickT + 0.012), matKerb, { pos: [w * 0.16, rimH + 0.014, halfZ], name: 'concrete-cope' });
  g.add(cope);

  /* =========================================================
   *  花（1 輪 = 独立グループ、1 花弁 = 独立 Mesh）
   * =======================================================*/
  const gpPansy = petalGeo(0.036, 0.030, { notch: 0.5, dome: 0.3, curl: 0.2 });
  const gpPansyS = petalGeo(0.030, 0.026, { notch: 0.35, dome: 0.34, curl: 0.25 });
  const gpTulip = petalGeo(0.032, 0.062, { notch: 0.12, dome: 0.5, curl: -0.18 });
  const gLeafTulip = bladeGeo(0.034, 0.15, { bend: 0.30, taper: 0.4, twist: 0.3 });
  const gLeafPansy = bladeGeo(0.026, 0.055, { bend: 0.5, taper: 0.45 });
  const gLidPansy = petalGeo(0.02, 0.016, { notch: 0.2, dome: 0.6 });

  /** パンジー：5 弁（上 2・横 2・下 1）＋中心の黒班＋黄色しべ */
  function mkPansy(mat, o = {}) {
    const f = grp('pansy');
    const lift = o.h ?? range(rnd, 0.06, 0.13);
    const stem = mesh(cyl(0.0035, 0.005, lift, 6), matStem, { pos: [0, lift / 2, 0], name: 'pansy-stem' });
    stem.rotation.set(range(rnd, -0.1, 0.1), 0, range(rnd, -0.12, 0.12));
    f.add(stem);
    const head = grp('head', { pos: [0, lift, 0], rot: [range(rnd, -0.55, -0.15), rnd() * 6.283, range(rnd, -0.3, 0.3)] });
    const N = [0.0, 1.25, 2.55, 3.9, 5.2];
    N.forEach((a, i) => {
      const p = mesh(i === 4 ? gpPansy : (i < 2 ? gpPansy : gpPansyS), mat, { name: 'pansy-petal' + i });
      p.rotation.set(-Math.PI / 2 + range(rnd, 0.55, 1.05), a, range(rnd, -0.2, 0.2));
      p.scale.setScalar(range(rnd, 0.86, 1.16));
      head.add(p);
    });
    head.add(mesh(sph(0.0075, 8, 6), matPistil, { pos: [0, 0.006, 0], name: 'pansy-core' }));
    for (let i = 0; i < 3; i++) {          // 黒班（面向かい側 3 弁の基部）
      const s = mesh(gLidPansy, MAT.paint(o.blotch || '#3b2f4a', { steps: 2, spec: 0.06, shadowAmt: 0.9, side: THREE.DoubleSide }), { pos: [0, 0.0035, 0], name: 'pansy-blotch' });
      s.rotation.set(-Math.PI / 2 + 0.42, (i - 1) * 1.3 + 3.6, 0);
      s.scale.setScalar(0.9);
      head.add(s);
    }
    f.add(head);
    // 株元の葉（3〜5 枚）
    const nl = 3 + ((rnd() * 3) | 0);
    for (let i = 0; i < nl; i++) {
      const l = mesh(gLeafPansy, rnd() > 0.85 ? matDead : matLeafG, { pos: [0, 0.005, 0], rot: [range(rnd, 1.05, 1.5), (i / nl) * 6.283 + rnd() * 0.6, 0], name: 'pansy-leaf' });
      l.scale.setScalar(range(rnd, 0.75, 1.4));
      f.add(l);
    }
    return f;
  }
  /** チューリップ：茎＋2 葉＋盃形の花（3 弁＋内 3 弁）／一部は咲き進み・垂れ */
  function mkTulip(mat, o = {}) {
    const f = grp('tulip');
    const H = o.h ?? range(rnd, 0.17, 0.27);
    const bend = range(rnd, -0.1, 0.1);
    const stem = mesh(cyl(0.0045, 0.0065, H, 7), matStem, { pos: [0, H / 2, 0], rot: [bend, 0, range(rnd, -0.12, 0.12)], name: 'tulip-stem' });
    f.add(stem);
    const head = grp('head', { pos: [Math.sin(bend) * -H * 0.5, H, 0] });
    if (o.droop) head.rotation.x = range(rnd, 0.6, 1.1);
    const open = o.open ?? range(rnd, 0.0, 0.22);
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 6.283 + ring * 1.05 + rnd() * 0.2;
        const p = mesh(gpTulip, ring ? matPansy[0] : mat, { name: 'tulip-petal' });
        p.rotation.set(-(Math.PI / 2 - (0.62 + open + ring * 0.22)), a, 0);
        p.position.set(Math.cos(a) * 0.004, ring * 0.004, Math.sin(a) * 0.004);
        p.scale.setScalar(range(rnd, 0.9, 1.1));
        head.add(p);
      }
    }
    head.add(mesh(cyl(0.008, 0.010, 0.014, 6), matPistil, { pos: [0, 0.012, 0], name: 'tulip-pod' }));
    f.add(head);
    for (let i = 0; i < 2; i++) {
      const a = i * 3.1 + rnd();
      const l = mesh(gLeafTulip, i === 1 && rnd() > 0.7 ? matLeafB : matLeafG, { pos: [Math.cos(a) * 0.008, 0.006, Math.sin(a) * 0.008], rot: [range(rnd, 0.15, 0.5), a, range(rnd, -0.25, 0.25)], name: 'tulip-leaf' });
      l.scale.setScalar(range(rnd, 0.8, 1.15) * (H / 0.22));
      f.add(l);
    }
    return f;
  }
  /** ムスカリ：総状花序（小さな壺形の実を円錐配列・inst で 2 階層） */
  function mkMuscari() {
    const f = grp('muscari');
    const H = range(rnd, 0.10, 0.17);
    f.add(mesh(cyl(0.0026, 0.004, H, 6), matStem, { pos: [0, H / 2, 0], rot: [range(rnd, -0.14, 0.14), 0, range(rnd, -0.14, 0.14)], name: 'mus-stem' }));
    const n = 16 + ((rnd() * 8) | 0);
    const geo = sph(0.0052, 6, 5);
    f.add(inst(geo, matMuscari[0], n, (i, d2, r) => {
      const t = i / n;
      const a = t * n * 2.4;
      const rad = 0.0135 * (1 - t * 0.78);
      d2.position.set(Math.cos(a) * rad, H * 0.62 + t * H * 0.52, Math.sin(a) * rad);
      d2.rotation.set(r() * 3, r() * 3, r() * 3);
      const s = 0.75 + t * 0.5 + r() * 0.18;
      d2.scale.set(s, s * 1.25, s);
    }, { name: 'mus-flowers' }));
    f.add(inst(geo, matMuscari[2], Math.max(4, (n * 0.35) | 0), (i, d2, r) => {   // 開口部の淡色（口白）
      const a = (i / 6) * 6.283 + r() * 0.4;
      d2.position.set(Math.cos(a) * 0.008, H * 1.10 + r() * 0.008, Math.sin(a) * 0.008);
      const s = 0.5 + r() * 0.2; d2.scale.set(s, s, s);
    }, { name: 'mus-mouth' }));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + rnd();
      const l = mesh(gLeafTulip, matLeafB, { pos: [Math.cos(a) * 0.01, 0.004, Math.sin(a) * 0.01], rot: [range(rnd, 0.3, 0.6), a, 0], name: 'mus-leaf' });
      l.scale.set(0.45, range(rnd, 0.5, 0.8), 0.45);
      f.add(l);
    }
    return f;
  }
  /** 枯れ茎・ empties（咲き終えた後＝経年） */
  function mkDeadStem() {
    const f = grp('dead-stem');
    const H = range(rnd, 0.09, 0.16);
    f.add(mesh(cyl(0.0025, 0.004, H, 5), matDead, { pos: [0, H / 2, 0], rot: [range(rnd, -0.35, 0.35), 0, range(rnd, -0.4, 0.4)], name: 'dead-stalk' }));
    f.add(mesh(cyl(0.006, 0.002, 0.012, 5), matDead, { pos: [range(rnd, -0.02, 0.02), H, 0], rot: [0.7, 0, 0.4], name: 'dead-capsule' }));
    return f;
  }

  /* ---------------- 植栽：列で枠を作り、1 輪ずつずらす ---------------- */
  const plants = grp('plants');
  g.add(plants);
  const rows = [
    { z: -bedD * 0.26, n: 6, kind: 'tulip' },
    { z: 0, n: 5, kind: 'pansy' },
    { z: bedD * 0.27, n: 7, kind: 'mix' },
  ];
  for (const R of rows) {
    row(plants, R.n, bedW / (R.n + 1), (i, x, t) => {
      const px = x + range(rnd, -0.035, 0.035), pz = R.z + range(rnd, -0.05, 0.05);
      if (px > bedW / 2 - 0.06 || px < -bedW / 2 + 0.06) return null;
      let f;
      const pick = R.kind === 'mix' ? (rnd() > 0.55 ? 'pansy' : rnd() > 0.4 ? 'muscari' : 'tulip') : R.kind;
      if (pick === 'tulip') {
        const wilting = rnd() > 0.84;
        f = mkTulip(matTulip[(rnd() * matTulip.length) | 0], { droop: wilting, open: wilting ? 0.5 : undefined, h: range(rnd, 0.15, 0.28) });
      } else if (pick === 'pansy') {
        f = mkPansy(matPansy[(rnd() * matPansy.length) | 0], { h: range(rnd, 0.055, 0.13) });
      } else {
        f = mkMuscari();
      }
      f.position.set(px, SOIL_Y + 0.004, pz);
      f.rotation.y = rnd() * 6.283;
      f.scale.setScalar(range(rnd, 0.82, 1.06));
      return f;
    });
  }
  // 欠株（球根が腐った区画）＝土を見せる＋枯れ茎
  for (let i = 0; i < 3; i++) {
    const d1 = mkDeadStem();
    d1.position.set(range(rnd, -bedW * 0.42, bedW * 0.42), SOIL_Y + 0.002, range(rnd, -bedD * 0.3, bedD * 0.3));
    plants.add(d1);
  }
  // 前年残りの花殻（横に倒れた 1 輪）
  const fallen = mkPansy(matPansy[1], { h: 0.05 });
  fallen.rotation.set(1.2, rnd() * 3, 0.4);
  fallen.position.set(bedW * 0.3, SOIL_Y + 0.006, bedD * 0.1);
  plants.add(fallen);

  /* ---------------- 名牌「花だん」＋ 散水跡・苔 ---------------- */
  const sign = grp('name-plate', { pos: [-bedW * 0.34, 0, bedD * 0.44], rotY: -12 });
  const board = mesh(rbox(0.26, 0.13, 0.014, 0.012, 2), matSignWood, { pos: [0, 0.20, 0], rot: [-0.22, 0, 0.02], name: 'plate' });
  sign.add(board);
  decal(sign, { map: TEX.signboard({ text: '花だん', sub: '春・駅前の会', bg: '#7f9f5c', fg: '#f7f3e6' }), w: 0.24, h: 0.115, pos: [0, 0.202, 0.009], rot: [-0.22, 0, 0.02], opacity: 0.97 });
  for (const sx of [-0.085, 0.085]) {
    sign.add(mesh(cyl(0.0045, 0.005, 0.22, 6), matWire, { pos: [sx, 0.11, -0.012], rot: [0.05, 0, sx > 0 ? -0.03 : 0.03], name: 'plate-leg' }));
    sign.add(mesh(tor(0.008, 0.0025, 4, 8), matWire, { pos: [sx, 0.196, -0.004], rot: [Math.PI / 2, 0, 0], name: 'plate-rivet' }));
  }
  g.add(sign);

  // 撒水跡：湿った土＋水たまり＋縁石の石灰分
  const wet = mesh(box(bedW * 0.55, 0.012, bedD * 0.5), matSoilDark, { pos: [bedW * 0.1, SOIL_Y + 0.002, -bedD * 0.05], name: 'watered-soil' });
  g.add(wet);
  for (let i = 0; i < 4; i++) {
    const pd = mesh(circ(rq(range(rnd, 0.03, 0.07)), 12), MAT.water({ opacity: 0.5, color: '#8fa6a2' }), { pos: [range(rnd, -bedW * 0.4, bedW * 0.4), SOIL_Y + 0.0105, range(rnd, -bedD * 0.3, bedD * 0.3)], rot: [-Math.PI / 2, 0, 0], name: 'puddle' });
    pd.castShadow = false;
    g.add(pd);
  }
  weather(g, { kind: 'dirt', w: 0.5, h: 0.09, pos: [range(rnd, -0.4, 0.4), SOIL_Y * 0.6, halfZ + 0.052], rot: [0, 0, 0], color: '#5c4a34', opacity: 0.5, seed: seed + 3, density: 1.5, count: 2, spread: 0.02 });
  // 1) 目地の苔（日陰の北側）
  weather(g, { kind: 'moss', w: w * 0.55, h: 0.09, pos: [-0.15, rimH * 0.42, -halfZ - 0.052], rot: [0, Math.PI, 0], color: PAL.moss, opacity: 0.55, seed: seed + 7, density: 1.8, count: 2, spread: 0.02 });
  // 2) 縁石の白華・飛散した土（+Z 歩道側）
  weather(g, { kind: 'chip', w: 0.42, h: 0.14, pos: [w * 0.24, rimH * 0.6, halfZ + 0.052], rot: [0, 0, 0], color: '#ded6c8', opacity: 0.4, seed: seed + 11, density: 1.1 });
  weather(g, { kind: 'dirt', w: 0.8, h: 0.24, pos: [0.1, 0.06, halfZ + 0.16], rot: [-Math.PI / 2, 0, 0], color: '#6b5a41', opacity: 0.45, seed: seed + 17, density: 1.4, count: 2, spread: 0.02 });
  // 3) 踏まれた土・落ち花弁（歩道側に散る）
  const petalsFall = petalGeo(0.026, 0.022, { notch: 0.3, dome: 0.4, curl: 0.2 });
  g.add(inst(petalsFall, matPansy[0], 22, (i, d2, r, col) => {
    const side = r() > 0.45 ? 1 : -1;
    d2.position.set(range(r, -w * 0.5, w * 0.5), 0.006 + r() * 0.006, side * (d / 2 + range(r, 0.06, 0.34)));
    d2.rotation.set(-Math.PI / 2 + range(r, -0.5, 0.5), r() * 6.283, range(r, -0.7, 0.7));
    const s = range(r, 0.7, 1.25); d2.scale.set(s, s, s);
    col.setRGB(0.95 + r() * 0.12, 0.92 + r() * 0.12, 0.88 + r() * 0.14);
  }, { name: 'fallen-petals', cast: false, receive: true }));
  // 4) 先端の割れた砖・欠けた笠
  const flake = mesh(box(0.05, 0.014, 0.03), matBrickOld, { pos: [w * 0.31, 0.012, halfZ + 0.11], rot: [0, 0.5, 0.1], name: 'brick-flake' });
  g.add(flake);
  // 5) 名牌の日焼け・土はね
  weather(sign, { kind: 'dirt', w: 0.2, h: 0.07, pos: [0.02, 0.15, 0.012], rot: [0, 0, 0], color: '#6b5a41', opacity: 0.4, seed: seed + 23, density: 1.3, spread: 0.02 });

  return finish(g, { outline: 'thin' });
}

export default build;
