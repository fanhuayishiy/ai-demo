import { g as grp, M as MAT, T as TEX, P as PAL, m as mesh, t as tor, c as cyl, C as CatmullRomCurve3, V as Vector3, d as coil, n as range, E as inst, w as weather, a as sph, r as rbox, b as box, h as decal, q as finish, o as lathe, U as circ, H as plane, z as rand, D as DoubleSide, x as PlaneGeometry } from './index-Dv-C_8Uh.js';

//  assets/flora/potted-plant.js —— 店舗前・ホーム端の盆栽／植木鉢
//  kind:
//   'conifer'   松の盆栽仕立（釉薬丸鉢・針金巻き跡・支柱・名前札）
//   'seasonal'  季節の寄せ植え（素焼き鉢・葉ボタン＋パンジー＋球根）
//   'bigpot'    店舗前の大型ポット（釉薬角鉢＋サツキ・花殻・水跡リング）
//  単位メートル / 原点＝鉢底（接地面）中心 / +Y 上 / 正面 +Z / rand(seed) のみ使用

const meta = {
  id: 'potted-plant',
  real: [0.56, 1.0, 0.56],      // bigpot 基準（conifer は 0.30×0.62、seasonal は 0.36×0.36）
  origin: 'ground-center',
};

const V = (x, y, z) => new Vector3(x, y, z);
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));

/** 湾曲カード（葉・花弁の下地。PlaneGeometry clone なので描边は自動スキップ） */
function cardGeo(w, h, bend = 0.1, seg = 2) {
  const g = plane(w, h, 1, seg).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = cl((p.getY(i) + h / 2) / h, 0, 1);
    p.setZ(i, Math.pow(t, 1.7) * bend);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
/** 葉身（幅広の湾曲ブレード） */
function bladeGeo(w, h, { bend = 0.35, taper = 0.35, twist = 0.3 } = {}) {
  const g = new PlaneGeometry(w, h, 2, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = cl((y + h / 2) / h, 0, 1);
    p.setX(i, x * (1 - taper * t * t));
    p.setZ(i, Math.pow(t, 1.75) * h * bend + x * twist * t);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
/** 花弁（扇形＋反り） */
function petalGeo(w, h, { dome = 0.24, curl = 0.16 } = {}) {
  const g = new PlaneGeometry(w, h, 4, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = cl((y + h / 2) / h, 0, 1);
    p.setX(i, x * (0.25 + Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.55)));
    p.setZ(i, (1 - Math.pow(cl(x / (w / 2), -1, 1), 2)) * h * dome + Math.pow(t, 2) * h * curl);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
/** 鉢（内側まで廻す車削プロファイル＝中に穴が見える） */
function potGeo({ r = 0.11, h = 0.09, wall = 0.009, foot = 0.62, neck = 0.94, seg = 26 }) {
  const rf = r * foot;
  return lathe([
    [0.0012, 0], [rf, 0], [rf, h * 0.09], [r * 0.9, h * 0.42], [r * neck, h * 0.82], [r, h],
    [r - wall, h], [r - wall * 1.1, h * 0.84], [r * 0.88 - wall, h * 0.44], [rf - wall, h * 0.13], [0.0012, h * 0.12],
  ], seg);
}
/** 受け皿（浅皿） */
function saucerGeo({ r = 0.115, h = 0.022 }) {
  return lathe([
    [0.0012, 0], [r * 0.55, 0], [r * 0.92, h * 0.36], [r, h], [r - 0.006, h * 0.96], [r * 0.86, h * 0.3], [r * 0.5, h * 0.12], [0.0012, h * 0.1],
  ], 24);
}

function build(options = {}) {
  const kind = ['conifer', 'seasonal', 'bigpot'].includes(options.kind) ? options.kind : 'conifer';
  const seed = (options.seed ?? 17) | 0;
  const rnd = rand(seed);
  const g = grp('potted-plant-' + kind);

  /* ---------------- 共通素材 ---------------- */
  const GLAZE = { conifer: '#4c6b7a', seasonal: '#8d6f52', bigpot: '#7a5b45' }[kind];
  const matGlaze = MAT.paint(kind === 'seasonal' ? '#b6764f' : GLAZE, {
    steps: 3, spec: 0.62, specPower: 130, specCut: 0.14, sheen: 0.22, rim: 0.3, rimColor: '#e9f6ff',
    shadowAmt: 0.62, map: TEX.metal({ base: kind === 'seasonal' ? '#b6764f' : GLAZE, worn: kind === 'seasonal' ? 0.15 : 0.42, repeat: 2 }).map,
    normalMap: TEX.metal({ base: '#ffffff', worn: 0.2, repeat: 2 }).normalMap, normalScaleX: 0.35, normalScaleY: 0.35, sat: 0.98,
  });
  const matClay = MAT.paint('#a9714c', { steps: 3, spec: 0.1, specPower: 16, sheen: 0.02, shadowAmt: 0.9, map: TEX.concrete({ base: '#a9714c', repeat: 3 }).map, normalMap: TEX.concrete({ base: '#a9714c', repeat: 3 }).normalMap, normalScaleX: 1.1, normalScaleY: 1.1 });
  const matSaucer = MAT.paint('#7e7367', { steps: 3, spec: 0.2, specPower: 40, shadowAmt: 0.86, map: TEX.concrete({ base: '#7e7367', repeat: 2 }).map });
  const matSoil = MAT.concrete({ base: '#4d3c2a', repeat: 3 });
  const matAkadama = MAT.stone({ color: '#9c6f4c', rough: 1 });
  const matMoss = MAT.leaf({ color: '#cfdfae', map: TEX.leafCluster({ base: PAL.moss, seed: seed + 3 }), alphaTest: 0.42, emissiveIntensity: 0.06, shadowAmt: 0.92, rim: 0.2 });
  const matBamboo = MAT.paint('#b6a869', { steps: 3, spec: 0.22, specPower: 40, shadowAmt: 0.8, map: TEX.wood({ light: '#cbbb7c', dark: '#8e8044' }).map });
  const matRope = MAT.fabric({ color: '#c2ab84', repeat: 12 });
  const matWire = MAT.paint('#8a6a4a', { spec: 0.5, specPower: 120, steps: 2 });
  const matTag = MAT.wood({ light: '#d9c9a4', dark: '#a89268', repeat: 1 });
  const matDead = MAT.wood({ light: '#a08f70', dark: '#6a5b45', repeat: 1 });
  const matWater = MAT.water({ opacity: 0.5, color: '#8fa6a2' });
  const matLeafG = MAT.leaf({ color: '#e8f0d8', map: TEX.leafCluster({ base: PAL.leaf, seed: seed + 11 }), alphaTest: 0.44, shadowAmt: 0.8 });
  const petalMat = (c, extra = {}) => MAT.paint(c, { steps: 3, spec: 0.14, specPower: 24, specCut: 0.45, sheen: 0.04, shadowAmt: 0.66, side: DoubleSide, rim: 0.22, rimColor: '#fff1f6', ...extra });

  /** 名前札（木札＋針金） */
  function namePlate(text, sub, wdt = 0.115, hgt = 0.062, leg = 0.09) {
    const p = grp('name-plate');
    const board = mesh(rbox(wdt, hgt, 0.008, 0.005, 2), matTag, { name: 'plate' });
    p.add(board);
    decal(p, { map: TEX.signboard({ text, sub, bg: '#efe3c6', fg: '#4c4238', size: hgt * 520 }), w: wdt * 0.9, h: hgt * 0.82, pos: [0, 0, 0.005] });
    p.add(mesh(cyl(0.0035, 0.004, leg, 6), matWire, { pos: [0, -hgt / 2 - leg / 2 + 0.01, 0], name: 'plate-leg' }));
    weather(p, { kind: 'dirt', w: wdt * 0.7, h: hgt * 0.5, pos: [0, -hgt * 0.22, 0.006], color: '#6b5a41', opacity: 0.45, seed: seed + 5, density: 1.5, spread: 0.01 });
    return p;
  }
  /** 竹支柱（節つき） */
  function bambooStake(h, x, z, tilt = 0) {
    const s = grp('stake');
    s.add(mesh(cyl(0.008, 0.0105, h, 6), matBamboo, { pos: [0, h / 2, 0], name: 'stake' }));
    for (let k = 1; k < Math.max(2, Math.round(h / 0.11)); k++) {
      const nd = mesh(tor(0.011, 0.0025, 4, 7), matBamboo, { pos: [0, (h * k) / Math.max(2, Math.round(h / 0.11)), 0], rot: [Math.PI / 2, 0, 0], name: 'stake-node' });
      nd.userData.noOutline = true;
      s.add(nd);
    }
    s.position.set(x, 0, z);
    s.rotation.z = tilt;
    return s;
  }
  /** 鉢まわりの共通小道具：赤玉土・苔・縁のカケ（pot 内）＋ 水跡・泥はね（root 地面） */
  function potDetails(pot, root, { r, h, soilY, chips = 2, waterY = 0.005 }) {
    // 赤玉土の粒（表土）
    const grains = [];
    for (let i = 0; i < 120; i++) {
      const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * (r * 0.92);
      grains.push({ x: Math.cos(a) * rr, y: soilY + range(rnd, -1e-3, 0.007), z: Math.sin(a) * rr, s: range(rnd, 0.5, 1.3), rx: rnd() * 3, ry: rnd() * 3, rz: rnd() * 3, c: [0.9 + rnd() * 0.3, 0.8 + rnd() * 0.25, 0.65 + rnd() * 0.22] });
    }
    pot.add(inst(sph(0.0075, 5, 4), matAkadama, grains.length, (i, d) => {
      const s = grains[i]; d.position.set(s.x, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz);
      d.scale.set(s.s, s.s * 0.8, s.s);
    }, { name: 'soil-grains', cast: false, receive: true }));
    // 苔（斑 2 層）
    const moss = [];
    for (let i = 0; i < 46; i++) {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.5) * r * 0.95;
      const s = range(rnd, 0.5, 1.5);
      moss.push({ x: Math.cos(a) * rr, y: soilY + 0.006, z: Math.sin(a) * rr, s, s2: s, rx: -Math.PI / 2 + range(rnd, -0.3, 0.3), ry: rnd() * 6.283, rz: 0, c: [0.85 + rnd() * 0.3, 0.95 + rnd() * 0.1, 0.7 + rnd() * 0.3] });
    }
    pot.add(inst(cardGeo(0.05, 0.04, 0.006, 1), matMoss, moss.length, (i, d) => {
      const s = moss[i]; d.position.set(s.x, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz); d.scale.set(s.s, s.s, 1);
    }, { name: 'soil-moss', cast: false, receive: true }));
    // 縁のカケ（釉薬が剥げて地肌が出た欠損 2〜3 箇所）
    for (let i = 0; i < chips; i++) {
      const a = rnd() * 6.283;
      const chip = mesh(rbox(0.018, 0.012, 0.012, 0.004, 1), MAT.paint('#c9b79e', { steps: 2, spec: 0.2, shadowAmt: 0.9 }), { pos: [Math.cos(a) * r * 0.99, h - 0.004, Math.sin(a) * r * 0.99], rot: [0, -a, range(rnd, -0.5, 0.5)], name: 'rim-chip' });
      pot.add(chip);
      // 割欠片（受け皿の上に転がったもの）
      if (i === 0) {
        const frag = mesh(box(0.014, 0.004, 0.011), matGlaze, { pos: [Math.cos(a + 2) * r * 0.62, waterY + 0.004, Math.sin(a + 2) * r * 0.62], rot: [0.2, a, 0.1], name: 'rim-fragment' });
        frag.userData.noOutline = true;
        root.add(frag);
      }
    }
    // 底の受け皿に溜まった水・ミネラルリング（＝水やりの跡）
    const disc = mesh(circ(rq(r * 0.78), 18), matWater, { pos: [0, waterY, 0], rot: [-Math.PI / 2, 0, 0], name: 'water-trace' });
    disc.userData.noOutline = true;
    disc.castShadow = false;
    root.add(disc);
    weather(root, { kind: 'dirt', w: r * 1.6, h: r * 1.4, pos: [0, waterY + 0.002, 0], rot: [-Math.PI / 2, 0, 0], color: '#8d8a76', opacity: 0.4, seed: seed + 13, density: 1.5, spread: 0.008 });
    // 鉢外側の泥はね・水垂れ
    weather(pot, { kind: 'dirt', w: r * 1.5, h: h * 0.7, pos: [0, h * 0.34, r * 0.99], rot: [0, 0, 0], color: '#5c4a34', opacity: 0.45, seed: seed + 19, density: 1.5, count: 2, spread: 0.02 });
    weather(pot, { kind: 'moss', w: r * 1.1, h: h * 0.5, pos: [-r * 0.4, h * 0.22, -r * 0.95], rot: [0, Math.PI, 0], color: PAL.moss, opacity: 0.42, seed: seed + 23, density: 1.4, spread: 0.015 });
  }

  /* =========================================================
   *  kind 別 仕立
   * =======================================================*/
  if (kind === 'conifer') {
    /* ---- 釉薬丸鉢（10 面で六方風の面持ち）＋ 松の仕立 ---- */
    const R = 0.115, PH = 0.082, BASE = 0.022;              // BASE = 受け皿の厚み（鉢底の高さ）
    g.add(mesh(saucerGeo({ r: R * 1.04, h: BASE }), matSaucer, { name: 'saucer' }));
    const pot = grp('pot', { pos: [0, BASE, 0] });
    g.add(pot);
    pot.add(mesh(potGeo({ r: R, h: PH, wall: 0.01, foot: 0.7, neck: 0.9, seg: 10 }), matGlaze, { name: 'bonsai-pot' }));
    pot.add(mesh(tor(R - 0.004, 0.004, 4, 10), matGlaze, { pos: [0, PH - 0.003, 0], rot: [Math.PI / 2, 0, 0], name: 'rim-band' }));
    const soilY = PH * 0.55;
    pot.add(mesh(cyl(R * 0.9, R * 0.9, 0.012, 12), matSoil, { pos: [0, soilY - 0.006, 0], name: 'soil' }));
    potDetails(pot, g, { r: R, h: PH, soilY, chips: 3, waterY: BASE * 0.32 });

    /* 松の幹（針金巻き跡つき・S 字仕立） */
    const tree = grp('pine', { pos: [0, BASE + soilY + 0.004, 0] });
    g.add(tree);
    const matPineBark = MAT.bark({ base: '#6b5647', seed: seed + 29, uv: { repeat: [1.6, 4] } });
    const trunkPts = [[0.0, 0.0], [0.018, 0.05], [-0.012, 0.115], [0.02, 0.185], [-4e-3, 0.245], [0.012, 0.29]];
    const up = new CatmullRomCurve3(trunkPts.map((p) => V(p[0], p[1], 0)), false, 'catmullrom', 0.4);
    for (let i = 0; i < 9; i++) {
      const t0 = i / 9, t1 = (i + 1) / 9;
      const a = up.getPointAt(t0), b = up.getPointAt(t1);
      const dir = b.clone().sub(a);
      const seg = mesh(cyl(rq(0.017 * (1 - t1 * 0.55)), rq(0.019 * (1 - t0 * 0.55)), rq(dir.length() * 1.12), 7), matPineBark, { pos: [a.clone().add(b).multiplyScalar(0.5).x, a.clone().add(b).multiplyScalar(0.5).y, 0], name: 'pine-trunk' });
      seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
      tree.add(seg);
    }
    // 針金巻き跡（古い仕立針金＝経年）
    const wiring = mesh(coil(0.021, 0.14, 11, 14, 0.0022), matWire, { pos: [0.006, 0.1, 0], rot: [0, 0, 0.06], name: 'training-wire' });
    wiring.userData.noOutline = true;
    tree.add(wiring);
    // 枝（5 床：下枝長く上床短く）
    const pads = [];
    const PAD = [[0.055, -0.6, 0.055, 0.16], [0.09, 2.4, 0.05, 0.19], [0.13, 4.0, -0.5, 0.145], [0.185, 1.1, -0.2, 0.11], [0.245, 3.4, 0.3, 0.085]];
    for (const [yh, ang, tilt, ln] of PAD) {
      const p0 = up.getPointAt(cl(yh / 0.29, 0, 1));
      const dir = V(Math.cos(ang) * Math.cos(tilt), Math.sin(tilt) * 0.55 + 0.15, Math.sin(ang) * Math.cos(tilt)).normalize();
      const pts = [p0, p0.clone().addScaledVector(dir, ln * 0.55).add(V(0, 0.012, 0)), p0.clone().addScaledVector(dir, ln)];
      const limbGeo = pts.map((p) => [p.x - p0.x, p.y - p0.y, p.z - p0.z]);
      for (let i = 0; i < 2; i++) {
        const a = V(...limbGeo[i]), b = V(...limbGeo[i + 1]);
        const dd = b.clone().sub(a);
        const seg = mesh(cyl(rq(0.006 - i * 0.0015), rq(0.0085 - i * 0.0015), rq(dd.length() * 1.15), 6), matPineBark, { pos: [p0.x + (a.x + b.x) / 2, p0.y + (a.y + b.y) / 2, p0.z + (a.z + b.z) / 2], name: 'pine-branch' });
        seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dd.normalize());
        tree.add(seg);
      }
      const tip = pts[2];
      pads.push(V(tip.x, tip.y, tip.z));
      // 小枝を 2 本ずつ
      for (let k = 0; k < 2; k++) {
        const a2 = ang + range(rnd, -1.3, 1.3);
        const t2 = tip.clone().add(V(Math.cos(a2) * 0.03, range(rnd, 0.01, 0.035), Math.sin(a2) * 0.03));
        const dd = t2.clone().sub(tip);
        tree.add(mesh(cyl(0.0035, 0.005, rq(dd.length() * 1.2), 5), matPineBark, { pos: [tip.x + dd.x / 2, tip.y + dd.y / 2, tip.z + dd.z / 2], name: 'pine-twig' }));
        pads.push(V(t2.x, t2.y, t2.z));
      }
    }
    // 葉（松の針＝3 階層のカードを床ごとに簇生）
    const matNeedle = [
      MAT.leaf({ color: '#c6dcb4', map: TEX.leafCluster({ base: '#3f5c3a', seed: seed + 31 }), alphaTest: 0.4, shadowAmt: 0.92, emissiveIntensity: 0.03, rim: 0.3 }),
      MAT.leaf({ color: '#dcecc8', map: TEX.leafCluster({ base: '#54763f', seed: seed + 37 }), alphaTest: 0.4, shadowAmt: 0.84, emissiveIntensity: 0.06, rim: 0.36 }),
      MAT.leaf({ color: '#f2f6d8', map: TEX.leafCluster({ base: '#86a95c', seed: seed + 41 }), alphaTest: 0.4, shadowAmt: 0.74, emissiveIntensity: 0.14, rim: 0.44 }),   // 春の新芽（梅雨前の若緑）
    ];
    const ndGeo = cardGeo(0.05, 0.045, 0.02, 1);
    const arr = [[], [], []];
    pads.forEach((p, pi) => {
      const n = 9 + ((rnd() * 8) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.55) * (0.035 + (pi % 3) * 0.008);
        const tier = rnd() > 0.72 ? 2 : rnd() > 0.4 ? 1 : 0;
        const s = range(rnd, 0.6, 1.5);
        arr[tier].push({ x: p.x + Math.cos(a) * rr, y: p.y + range(rnd, -0.012, 0.026), z: p.z + Math.sin(a) * rr, s, s2: s, rx: range(rnd, -1.5, 1.5), ry: rnd() * 6.283, rz: range(rnd, -1.2, 1.2), c: [0.88 + rnd() * 0.24, 0.94 + rnd() * 0.14, 0.82 + rnd() * 0.24] });
      }
    });
    const needleGrp = grp('needles');
    tree.add(needleGrp);
    arr.forEach((list, ti) => {
      if (!list.length) return;
      needleGrp.add(inst(ndGeo, matNeedle[ti], list.length, (i, d) => {
        const s = list[i]; d.position.set(s.x - 0, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz); d.scale.set(s.s, s.s2, 1);
      }, { name: 'pine-needle-' + ti }));
    });
    // 幹の支柱 2 本＋八ツ手縛り
    for (const [sx, sz, tilt] of [[0.055, 0.03, -0.13], [-0.05, -0.045, 0.12]]) {
      const st = bambooStake(0.3, sx, sz, tilt);
      tree.add(st);
      tree.add(mesh(tor(0.02, 0.0035, 4, 9), matRope, { pos: [0.004, 0.14, 0], rot: [Math.PI / 2, 0, 0.3], name: 'tie-8z' }));
    }
    tree.add(mesh(cardGeo(0.03, 0.02, 0.004, 1), matRope, { pos: [0.01, 0.145, 0.012], rot: [0.4, 0.6, 0.2], name: 'tie-knot' }));
    // 名前札
    const tag = namePlate('黒松', 'PREPARATION', 0.085, 0.042, 0.055);
    tag.position.set(-0.055, BASE + soilY + 0.062, 0.075);
    tag.rotation.set(0.12, -0.4, -0.06);
    g.add(tag);
    // 根元の吹き土・落ち葉
    g.add(inst(cardGeo(0.03, 0.024, 0.005, 1), MAT.leaf({ color: '#d8c39f', map: TEX.leafCluster({ base: '#9b7a4e', seed: seed + 43 }), alphaTest: 0.4, emissiveIntensity: 0, shadowAmt: 1 }), 16, (i, d, r) => {
      const a = r() * 6.283, rr = 0.14 + r() * 0.1;
      d.position.set(Math.cos(a) * rr, 0.003 + r() * 0.004, Math.sin(a) * rr);
      d.rotation.set(-Math.PI / 2 + range(r, -0.5, 0.5), r() * 6.283, 0);
      const s = range(r, 0.6, 1.3); d.scale.set(s, s, 1);
    }, { name: 'leaf-drift', cast: false, receive: true }));

  } else if (kind === 'seasonal') {
    /* ---- 素焼き鉢＋葉ボタン・パンジー・球根の寄せ植え ---- */
    const R = 0.155, PH = 0.135, BASE = 0.027;
    g.add(mesh(saucerGeo({ r: R * 0.95, h: BASE }), matSaucer, { name: 'saucer' }));
    const pot = grp('pot', { pos: [0, BASE, 0] });
    g.add(pot);
    pot.add(mesh(potGeo({ r: R, h: PH, wall: 0.012, foot: 0.66, neck: 0.93 }), matClay, { name: 'terracotta-pot' }));
    pot.add(mesh(tor(R - 0.005, 0.009, 5, 16), matClay, { pos: [0, PH - 0.006, 0], rot: [Math.PI / 2, 0, 0], name: 'rim-lip' }));
    const soilY = PH * 0.74;
    pot.add(mesh(cyl(R * 0.9, R * 0.9, 0.014, 16), matSoil, { pos: [0, soilY - 0.007, 0], name: 'soil' }));
    potDetails(pot, g, { r: R, h: PH, soilY, chips: 2, waterY: BASE * 0.32 });
    // 白華（素焼きに浮く白い粉）
    weather(pot, { kind: 'chip', w: R * 1.3, h: PH * 0.62, pos: [R * 0.2, PH * 0.42, R * 0.96], color: '#e6e2d8', opacity: 0.5, seed: seed + 47, density: 1.5, count: 2, spread: 0.02 });

    const plant = grp('planting', { pos: [0, BASE + soilY + 0.004, 0] });
    g.add(plant);
    // 葉ボタン：3 輪（外葉ほど大きく枯れぎわ）
    const cabbage = [
      { n: 9, r: 0.105, y: 0.012, col: '#8fa76f', tip: '#c9b9c9' },
      { n: 8, r: 0.072, y: 0.032, col: '#9fb577', tip: '#ddd0d8' },
      { n: 6, r: 0.04, y: 0.05, col: '#b3c585', tip: '#e9e2e6' },
    ];
    cabbage.forEach((ring, ri) => {
      for (let i = 0; i < ring.n; i++) {
        const a = (i / ring.n) * 6.283 + ri * 0.4 + range(rnd, -0.14, 0.14);
        const wither = ri === 0 && rnd() > 0.6;
        const bl = mesh(bladeGeo(ring.r * 0.72, ring.r * 1.05, { bend: 0.42 + ri * 0.08, taper: 0.42, twist: 0.35 }), wither ? matDead : petalMat(ring.col, { map: TEX.leafCluster({ base: wither ? '#9b7a4e' : ring.col, seed: seed + 51 + ri }), rimColor: '#f0ffe0', rim: 0.24 }), {
          pos: [Math.cos(a) * ring.r * 0.26, ring.y, Math.sin(a) * ring.r * 0.26],
          rot: [-(Math.PI / 2 - (1.05 - ri * 0.22)), a, range(rnd, -0.3, 0.3)], name: 'cabbage-leaf',
        });
        bl.scale.setScalar(range(rnd, 0.85, 1.12));
        plant.add(bl);
      }
    });
    plant.add(mesh(sph(0.022, 8, 6), petalMat('#cdd8a4', { steps: 2 }), { pos: [0, 0.062, 0], name: 'cabbage-heart' }));
    // パンジー 3 輪（1 輪ずつ独立 Mesh・傾き／色相別）
    const gpP = petalGeo(0.032, 0.028, { dome: 0.3, curl: 0.2 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.283 + 0.6 + rnd();
      const fx = Math.cos(a) * R * 0.55, fz = Math.sin(a) * R * 0.55;
      const fh = range(rnd, 0.045, 0.085);
      const f = grp('pansy', { pos: [fx, 0, fz], rotY: rnd() * 360 });
      f.add(mesh(cyl(0.003, 0.004, fh, 6), MAT.leaf({ color: '#88a35f', alphaTest: 0 }), { pos: [0, fh / 2, 0], name: 'stem' }));
      const head = grp('head', { pos: [0, fh, 0], rot: [range(rnd, -0.6, -0.15), rnd() * 6.283, range(rnd, -0.3, 0.3)] });
      const matP = petalMat(['#efe6f2', '#6b5484', '#e3cd8d'][i % 3]);
      [0, 1.2, 2.5, 3.8, 5.1].forEach((pa, k) => {
        const p = mesh(gpP, matP, { rot: [-Math.PI / 2 + range(rnd, 0.6, 1.0), pa, 0], pos: [0, 0.002 * k, 0], name: 'petal' });
        p.scale.setScalar(range(rnd, 0.9, 1.15));
        head.add(p);
      });
      head.add(mesh(sph(0.006, 7, 5), petalMat('#f0d98a', { steps: 2 }), { pos: [0, 0.005, 0], name: 'core' }));
      f.add(head);
      f.add(mesh(bladeGeo(0.022, 0.042, { bend: 0.5, taper: 0.5 }), matLeafG, { pos: [0.012, 0.004, 0.006], rot: [1.3, 0.6, 0.2], name: 'leaf' }));
      plant.add(f);
    }
    // 球根花（小チュウリップ 2 本）＋ 一本だけ萎んだ個体
    const gpT = petalGeo(0.026, 0.05, { dome: 0.5, curl: -0.14 });
    for (let i = 0; i < 2; i++) {
      const a = i * 2.6 + 1.4;
      const H = range(rnd, 0.1, 0.145);
      const f = grp('tulip', { pos: [Math.cos(a) * R * 0.34, 0, Math.sin(a) * R * 0.34], rotY: rnd() * 360 });
      f.add(mesh(cyl(0.0035, 0.005, H, 6), MAT.leaf({ color: '#7f9c5c', alphaTest: 0 }), { pos: [0, H / 2, 0], rot: [i ? 0.28 : -0.1, 0, i ? -0.2 : 0.12], name: 'stem' }));
      const head = grp('head', { pos: [0, H, 0], rot: [i === 1 ? 0.8 : 0.05, 0, 0] });
      for (let k = 0; k < 4; k++) {
        const p = mesh(gpT, petalMat(i === 1 ? '#d9c9a0' : '#c9564f'), { rot: [-(Math.PI / 2 - (0.66 + (i === 1 ? 0.3 : 0))), (k / 4) * 6.283, 0], pos: [0, 0.003, 0], name: 'petal' });
        head.add(p);
      }
      f.add(head);
      for (let k = 0; k < 2; k++) f.add(mesh(bladeGeo(0.024, 0.1, { bend: 0.3, taper: 0.4, twist: 0.35 }), matLeafG, { pos: [k ? 0.008 : -8e-3, 0.003, 0], rot: [0.25, k ? 1.2 : -1.2, k ? 0.2 : -0.2], name: 'leaf' }));
      plant.add(f);
    }
    // 落ちた花弁（鉢縁と受け皿）＋ 枯れ茎
    plant.add(inst(cardGeo(0.02, 0.017, 0.004, 1), petalMat('#e7d9c4'), 9, (i, d, r) => {
      const a = r() * 6.283, rr = 0.03 + r() * 0.11;
      d.position.set(Math.cos(a) * rr, 0.002 + r() * 0.004, Math.sin(a) * rr);
      d.rotation.set(-Math.PI / 2 + range(r, -0.5, 0.5), r() * 6.283, 0);
      const s = range(r, 0.7, 1.2); d.scale.set(s, s, 1);
    }, { name: 'fallen-petals', cast: false, receive: true }));
    plant.add(mesh(cyl(0.003, 0.004, 0.09, 5), matDead, { pos: [R * 0.5, 0.045, -R * 0.4], rot: [0.25, 0, -0.35], name: 'dead-stem' }));
    const tag = namePlate('花だん', '春', 0.075, 0.04, 0.05);
    tag.position.set(-R * 0.55, soilY + 0.05, R * 0.62);
    tag.rotation.set(0.1, -0.5, -0.08);
    plant.add(tag);

  } else {
    /* ---- 店舗前の大型ポット（釉薬角鉢＋サツキ） ---- */
    const W = 0.42, PH = 0.36, BASE = 0.03;                // BASE = 受け皿（トレー）の厚み
    g.add(mesh(rbox(W + 0.09, BASE, W + 0.09, 0.012, 2), matSaucer, { pos: [0, BASE / 2, 0], name: 'tray' }));
    const pot = grp('pot', { pos: [0, BASE, 0] });
    g.add(pot);
    pot.add(mesh(rbox(W, PH, W, 0.022, 3), matGlaze, { pos: [0, PH / 2, 0], name: 'square-pot' }));
    pot.add(mesh(rbox(W + 0.03, 0.045, W + 0.03, 0.014, 3), matGlaze, { pos: [0, PH - 0.02, 0], name: 'pot-rim' }));
    pot.add(mesh(box(W * 0.9, 0.018, W * 0.9), MAT.paint('#5d5348', { steps: 2, spec: 0.2, shadowAmt: 0.95 }), { pos: [0, 0.055, 0], name: 'pot-band' }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      pot.add(mesh(box(0.05, 0.03, 0.05), matSaucer, { pos: [sx * W * 0.36, 0.015, sz * W * 0.36], name: 'pot-foot' }));
    }
    const soilY = PH - 0.055;
    pot.add(mesh(cyl(W * 0.4, W * 0.42, 0.02, 18), matSoil, { pos: [0, soilY - 0.01, 0], name: 'soil' }));
    // 刻印・水跡リング（歩道側に流出した泥）
    decal(pot, { map: TEX.signboard({ text: '植 木', bg: '#00000000', fg: '#3d3229' }), w: 0.12, h: 0.05, pos: [0, PH * 0.42, W / 2 + 0.001], opacity: 0.5 });
    const ring = mesh(tor(W * 0.6, 0.007, 4, 24), matWater, { pos: [0, BASE + 0.005, 0.012], rot: [-Math.PI / 2, 0, 0], name: 'water-ring' });
    ring.userData.noOutline = true;
    pot.add(ring);
    weather(pot, { kind: 'dirt', w: W * 1.2, h: PH * 0.5, pos: [0, PH * 0.28, W * 0.51], rot: [0, 0, 0], color: '#5c4a34', opacity: 0.45, seed: seed + 59, density: 1.6, count: 2, spread: 0.03 });
    weather(pot, { kind: 'chip', w: W * 0.5, h: 0.12, pos: [-W * 0.2, PH * 0.72, W * 0.51], rot: [0, 0, 0], color: '#d6ccbb', opacity: 0.45, seed: seed + 61, density: 1.2 });
    weather(pot, { kind: 'moss', w: W * 0.6, h: 0.13, pos: [W * 0.24, 0.13, -W * 0.51], rot: [0, Math.PI, 0], color: PAL.moss, opacity: 0.45, seed: seed + 67, density: 1.6, spread: 0.02 });
    potDetails(pot, g, { r: W * 0.4, h: PH, soilY, chips: 2, waterY: BASE * 0.55 });

    // サツキ／ツツジの仕立（不規則な葉球＋花殻）
    const sh = grp('shrub', { pos: [0, BASE + soilY, 0] });
    g.add(sh);
    const matBark = MAT.bark({ base: '#6f5b49', seed: seed + 71, uv: { repeat: [1.4, 3] } });
    const stem = [[0, 0, 0], [0.03, 0.16, -0.02], [-0.02, 0.31, 0.03], [0.02, 0.42, -0.01]];
    for (let i = 0; i < stem.length - 1; i++) {
      const a = V(...stem[i]), b = V(...stem[i + 1]);
      const dd = b.clone().sub(a);
      const seg = mesh(cyl(rq(0.021 - i * 0.004), rq(0.028 - i * 0.004), rq(dd.length() * 1.1), 7), matBark, { pos: [a.x + dd.x / 2, a.y + dd.y / 2, a.z + dd.z / 2], name: 'shrub-trunk' });
      seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dd.normalize());
      sh.add(seg);
    }
    const buds = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283 + rnd() * 0.7;
      const el = range(rnd, 0.35, 0.95);
      const L = range(rnd, 0.1, 0.2);
      const o = V(...stem[Math.min(stem.length - 1, 1 + (i % 3))]);
      const dir = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
      const tip = o.clone().addScaledVector(dir, L);
      const dd = tip.clone().sub(o);
      const seg = mesh(cyl(0.006, 0.011, rq(dd.length() * 1.1), 5), matBark, { pos: [o.x + dd.x / 2, o.y + dd.y / 2, o.z + dd.z / 2], name: 'shrub-branch' });
      seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dd.normalize());
      sh.add(seg);
      buds.push(tip);
    }
    buds.push(V(0.02, 0.46, -0.01));
    const matAzalea = [
      MAT.leaf({ color: '#dcecc8', map: TEX.leafCluster({ base: '#4e6d3c', seed: seed + 73 }), alphaTest: 0.42, shadowAmt: 0.92, emissiveIntensity: 0.03 }),
      MAT.leaf({ color: '#eef6dc', map: TEX.leafCluster({ base: PAL.leaf, seed: seed + 79 }), alphaTest: 0.42, shadowAmt: 0.82, emissiveIntensity: 0.08 }),
      MAT.leaf({ color: '#f7ffe6', map: TEX.leafCluster({ base: '#8fae62', seed: seed + 83 }), alphaTest: 0.42, shadowAmt: 0.72, emissiveIntensity: 0.15, rim: 0.44 }),
    ];
    const leafLists = [[], [], []];
    const flowerList = [], spentList = [];
    buds.forEach((p) => {
      const n = 12 + ((rnd() * 12) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.5) * range(rnd, 0.05, 0.095);
        const q = rnd();
        const tier = q > 0.66 ? 2 : q > 0.33 ? 1 : 0;
        const s = range(rnd, 0.55, 1.25);
        leafLists[tier].push({ x: p.x + Math.cos(a) * rr, y: p.y + range(rnd, -0.05, 0.055), z: p.z + Math.sin(a) * rr, s, s2: s, rx: range(rnd, -1.5, 1.5), ry: rnd() * 6.283, rz: range(rnd, -1.3, 1.3), c: [0.88 + rnd() * 0.24, 0.94 + rnd() * 0.14, 0.8 + rnd() * 0.24] });
      }
      if (rnd() > 0.45) {                                     // 咲き残り／花殻（経年）
        const a = rnd() * 6.283, rr = range(rnd, 0.02, 0.07);
        (rnd() > 0.5 ? flowerList : spentList).push({ x: p.x + Math.cos(a) * rr, y: p.y + range(rnd, -0.02, 0.05), z: p.z + Math.sin(a) * rr, s: range(rnd, 0.7, 1.25), s2: 1, rx: range(rnd, -1.4, 1.4), ry: rnd() * 6.283, rz: 0 });
      }
    });
    const lg = grp('leaves');
    sh.add(lg);
    leafLists.forEach((list, ti) => {
      if (!list.length) return;
      lg.add(inst(cardGeo(0.05, 0.042, 0.012, 1), matAzalea[ti], list.length, (i, d) => {
        const s = list[i]; d.position.set(s.x, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz); d.scale.set(s.s, s.s2, 1);
      }, { name: 'azalea-leaf-' + ti }));
    });
    const matBloom = petalMat('#d98fa4', { steps: 2 });
    const matSpent = MAT.paint('#8b7a63', { steps: 2, spec: 0.06, shadowAmt: 1 });
    [[flowerList, matBloom, 'azalea-bloom'], [spentList, matSpent, 'azalea-spent']].forEach(([list, mat, nm]) => {
      if (!list.length) return;
      sh.add(inst(petalGeo(0.026, 0.024, { dome: 0.4, curl: 0.3 }), mat, list.length, (i, d) => {
        const s = list[i]; d.position.set(s.x, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz); d.scale.set(s.s, s.s, 1);
      }, { name: nm }));
    });
    // 支柱 1 本＋紐
    sh.add(bambooStake(0.5, 0.07, -0.05, -0.09));
    sh.add(mesh(tor(0.028, 0.004, 4, 9), matRope, { pos: [0.035, 0.26, -0.02], rot: [Math.PI / 2, 0, 0.4], name: 'tie' }));
    // 受け皿に積もった落葉・花殻
    g.add(inst(cardGeo(0.034, 0.028, 0.005, 1), MAT.leaf({ color: '#e0cba7', map: TEX.leafCluster({ base: '#9b7a4e', seed: seed + 89 }), alphaTest: 0.42, emissiveIntensity: 0, shadowAmt: 1 }), 26, (i, d, r) => {
      const a = r() * 6.283, rr = 0.212 + r() * 0.038;
      d.position.set(Math.cos(a) * rr, BASE + 0.003 + r() * 0.004, Math.sin(a) * rr);
      d.rotation.set(-Math.PI / 2 + range(r, -0.5, 0.5), r() * 6.283, 0);
      const s = range(r, 0.6, 1.3); d.scale.set(s, s, 1);
    }, { name: 'tray-litter', cast: false, receive: true }));
    const tag = namePlate('サツキ', '', 0.1, 0.048, 0.07);
    tag.position.set(-0.12, BASE + soilY + 0.06, 0.14);
    tag.rotation.set(0.1, -0.35, -0.05);
    g.add(tag);
  }

  return finish(g, { outline: 'thin', minSize: 0.02 });
}

export { build, build as default, meta };
