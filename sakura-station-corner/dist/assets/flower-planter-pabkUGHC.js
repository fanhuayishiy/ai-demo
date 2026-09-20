import { g as grp, M as MAT, T as TEX, P as PAL, m as mesh, b as box, r as rbox, c as cyl, w as weather, n as range, h as decal, k as tubeOf, a as sph, X as cone, o as lathe, t as tor, p as shadowBlob, q as finish, an as Quaternion, V as Vector3, z as rand } from './index-yWEMv7O8.js';

//  assets/street/flower-planter.js —— 店舗前の大型コンクリート・プランター（春の花を一株ずつ独立 Mesh）
//  構成：打放し目地・白華・苔・水跡・底穴からの草／葉ボタン 3＋パンジー 3＋春の苗 3／じょうろ・シャベル／名前札

const meta = {
  id: 'flower-planter',
  real: [0.84, 0.40, 0.39],      // 本体 0.82×0.34×0.36（じょうろ込みで幅 1.2 前後）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

/** 浅い皿状の葉身（回転体）：+Z 方向に長い葉として使う */
function bowlGeo(r, depth, seg = 10) {
  return lathe([
    [0, -depth],
    [r * 0.42, -depth * 0.76],
    [r * 0.78, -depth * 0.34],
    [r, 0],
    [r * 0.97, depth * 0.24],
    [r * 0.80, depth * 0.36],
  ], seg);
}
/** 極配向：Ry(a) ∘ Rx(tilt) ∘ Rz(roll) —— 放射状に葉・花弁を並べるための規約 */
function orient(o, tilt, a, roll = 0) {
  const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), a);
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), tilt);
  const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll);
  o.quaternion.copy(qy).multiply(qx).multiply(qz);
  return o;
}
/** 放射状に 1 枚置く：方向は Ry(a)(0,0,1) = (sin a, 0, cos a) */
function radialPlace(o, a, r, y) {
  o.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
  return o;
}
const noShadow = (o) => { o.castShadow = false; return o; };

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);

  const g = grp('flower-planter');

  /* ---------------- 寸法 ---------------- */
  const W = 0.82, D = 0.36, H = 0.34, wall = 0.055;

  /* ---------------- コンクリート系（base は質感色・tint で濃淡をつける） ---------------- */
  const cFace = MAT.concrete({ repeat: 3, uv: { repeat: [2.4, 1.2] } });
  const cBand = MAT.concrete({ repeat: 3, tint: '#cdc7ba' });
  const cRim = MAT.concrete({ repeat: 4, tint: '#fffaef' });
  const cInner = MAT.paint('#a8a297', { steps: 3, shadowAmt: 0.98, map: TEX.concrete({ repeat: 4 }).map, normalMap: TEX.concrete({ repeat: 4 }).normalMap });
  const soilMat = MAT.paint('#d3c4ac', {
    steps: 4, shadowAmt: 0.96, sheen: 0.0, spec: 0.05,
    map: TEX.grass({ base: PAL.dirt, repeat: 5 }).map,
    normalMap: TEX.grass({ base: PAL.dirt, repeat: 5 }).normalMap,
    normalScaleX: 1.8, normalScaleY: 1.8,
  });
  const galv = MAT.galvanized({ repeat: 4 });
  const tinMat = MAT.metalPaint('#b6b9b4', { worn: 0.9, repeat: 3 });
  const grassMat = MAT.grass({ repeat: 3, tint: '#c2d4ac' });

  /* ================= 本体（打放し：目地を段差で刻む） ================= */
  const body = grp('planter-body');
  g.add(body);
  const bands = [
    { y0: 0, y1: 0.112, inset: 0 },
    { y0: 0.116, y1: 0.224, inset: 0.0038 },      // 型枠の目地（3.8mm 立ち下がり）
    { y0: 0.228, y1: H, inset: 0 },
  ];
  for (const bd of bands) {
    const h = bd.y1 - bd.y0, y = (bd.y0 + bd.y1) / 2;
    body.add(mesh(box(W - bd.inset * 2, h, wall), cFace, { pos: [0, y, D / 2 - bd.inset - wall / 2] }));
    body.add(mesh(box(W - bd.inset * 2, h, wall), cFace, { pos: [0, y, -(D / 2 - bd.inset - wall / 2)] }));
    body.add(mesh(box(wall, h, D - wall * 2 - bd.inset * 2), cFace, { pos: [W / 2 - bd.inset - wall / 2, y, 0] }));
    body.add(mesh(box(wall, h, D - wall * 2 - bd.inset * 2), cFace, { pos: [-(W / 2 - bd.inset - wall / 2), y, 0] }));
  }
  // 縁（打ち増しのリップ）
  body.add(mesh(rbox(W + 0.028, 0.030, D + 0.028, 0.006, 2), cRim, { pos: [0, H + 0.015, 0] }));
  body.add(mesh(box(W + 0.006, 0.010, D + 0.006), cBand, { pos: [0, H - 0.004, 0] }));
  // 底スラブ＋排水穴 3 け所
  body.add(mesh(box(W - wall * 2 + 0.02, 0.034, D - wall * 2 + 0.02), cInner, { pos: [0, 0.017, 0] }));
  for (const x of [-0.22, 0, 0.22]) {
    body.add(mesh(cyl(0.020, 0.020, 0.046, 10), MAT.paint('#2f2c28', { steps: 2, shadowAmt: 1 }), { pos: [x, 0.024, 0] }));
  }
  // 型枠引き穴（黒いクレーター）
  for (const [x, y] of [[-0.26, 0.168], [0, 0.168], [0.26, 0.168], [-0.13, 0.286], [0.13, 0.286]]) {
    body.add(mesh(cyl(0.0085, 0.0085, 0.012, 8), MAT.paint('#6d665c', { steps: 2, shadowAmt: 1 }), { pos: [x, y, D / 2 - 0.0015], rot: [Math.PI / 2, 0, 0] }));
  }
  // 内側面（土に埋まる部分もきちんと作る）
  for (const sz of [-1, 1]) body.add(mesh(box(W - wall * 2, H - 0.05, 0.008), cInner, { pos: [0, (H - 0.05) / 2 + 0.03, sz * (D / 2 - wall - 0.004)] }));
  for (const sx of [-1, 1]) body.add(mesh(box(0.008, H - 0.05, D - wall * 2), cInner, { pos: [sx * (W / 2 - wall - 0.004), (H - 0.05) / 2 + 0.03, 0] }));

  /* ================= 経年：白華・水跡・苔・欠け・補修 ================= */
  weather(body, { w: 0.34, h: 0.12, pos: [-0.14, 0.078, D / 2 + 0.0022], kind: 'dirt', color: '#eef0ea', opacity: 0.55, seed: seed + 3, density: 1.7, spread: 0.008 });    // 白華
  weather(body, { w: 0.24, h: 0.10, pos: [0.24, 0.094, D / 2 + 0.0022], kind: 'dirt', color: '#e8ebe4', opacity: 0.45, seed: seed + 4, density: 1.3, spread: 0.007 });
  for (let i = 0; i < 5; i++) {                                                                        // 水跡（縁からの流筋）
    weather(body, { w: 0.030, h: 0.19, pos: [-0.3 + i * 0.15 + range(rnd, -0.02, 0.02), 0.225, D / 2 + 0.0026], kind: 'rust', color: '#8f9a90', opacity: 0.35, seed: seed + 11 + i, density: 0.6, spread: 0.004 });
  }
  weather(body, { w: 0.30, h: 0.14, pos: [-0.1, 0.10, -0.1822], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.6, seed: seed + 16, density: 1.8, spread: 0.008 });
  weather(body, { w: 0.12, h: 0.16, pos: [-0.41219999999999996, 0.12, 0.04], rot: [0, -Math.PI / 2, 0], kind: 'moss', color: '#6d8a52', opacity: 0.55, seed: seed + 17, spread: 0.006 });
  weather(body, { w: 0.16, h: 0.05, pos: [0.18, H + 0.022, D / 2 + 0.0028], kind: 'chip', color: '#b8b1a4', opacity: 0.6, seed: seed + 18, density: 1.5, spread: 0.005 });  // 縁の欠け
  body.add(mesh(rbox(0.058, 0.028, 0.020, 0.008, 2), cBand, { pos: [0.31, H + 0.026, D / 2 - 0.010], rot: [0, 12 * D2R, 3 * D2R] }));                                     // 補修モルタル
  decal(body, { map: TEX.wear({ kind: 'chip', color: '#efe9dc', seed: seed + 21, density: 0.8 }), w: 0.09, h: 0.07, pos: [-0.28, 0.242, D / 2 + 0.0024], opacity: 0.6, rot: [0, 0, 5 * D2R] });   // 貼紙残り
  decal(body, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [0.7, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']] }), w: W - 0.06, h: 0.20, pos: [0.02, 0.24, D / 2 + 0.0020], opacity: 0.22 });   // 上面向日の退色

  /* ================= 底穴（排水穴）から出る草 ================= */
  const dg = grp('drain-grass');
  g.add(dg);
  for (const bx of [-0.222, -0.128, 0.004, 0.118, 0.226]) {
    const len = range(rnd, 0.055, 0.115);
    const s = range(rnd, -0.026, 0.026);
    dg.add(noShadow(mesh(tubeOf([
      [bx, 0.014, -0.03], [bx + s * 0.4, 0.007, 0.070],
      [bx + s, 0.014, D / 2 + 0.004], [bx + s * 1.4, 0.020 + len, D / 2 + 0.016],
    ], 0.0022, 10, 4), grassMat)));
    // 根元の土の流出跡
    dg.add(noShadow(mesh(rbox(0.030, 0.012, 0.026, 0.005, 2), soilMat, { pos: [bx + s * 0.5, 0.006, D / 2 + 0.002] })));
  }
  weather(dg, { w: 0.20, h: 0.05, pos: [0.0, 0.062, D / 2 + 0.0028], kind: 'dirt', color: '#6b5c44', opacity: 0.5, seed: seed + 29, density: 1.6, spread: 0.006 });

  /* ================= 土（盛り上がり） ================= */
  const soil = grp('soil');
  g.add(soil);
  soil.add(mesh(sph(0.33, 18, 12), soilMat, { pos: [0, 0.234, 0], scale: [1.02, 0.175, 0.35] }));
  soil.add(mesh(sph(0.17, 14, 9), soilMat, { pos: [-0.16, 0.250, 0.02], scale: [1.0, 0.20, 0.60] }));
  soil.add(mesh(sph(0.14, 14, 9), soilMat, { pos: [0.19, 0.248, -0.03], scale: [1.0, 0.18, 0.54] }));
  weather(soil, { w: 0.28, h: 0.10, pos: [0.03, 0.296, 0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4b3f2e', opacity: 0.5, seed: seed + 26, density: 1.5, spread: 0.02 });
  for (let i = 0; i < 6; i++) {   // 枯れ茎・小石
    soil.add(noShadow(mesh(cone(0.004, 0.028 + rnd() * 0.022, 5), MAT.paint('#8b7c5c', { steps: 2 }), {
      pos: [range(rnd, -0.3, 0.30), 0.292, range(rnd, -0.08, 0.08)], rot: [range(rnd, -0.5, 0.5), 0, range(rnd, -0.5, 0.5)],
    })));
  }

  /* ============================================================
   *  植物 —— 一株ずつ独立 Group、構成葉・花弁も個別 Mesh
   * ========================================================== */
  const plants = grp('plants');
  g.add(plants);

  /** 葉ボタン（羽衣ギャラン）：外段 8・中段 6・芯 4 の_rosette_ */
  function kale({ x, z, scale = 1, tone = 0 } = {}) {
    const p = grp('kale');
    p.position.set(x, 0.290, z);
    p.scale.setScalar(scale);
    p.userData.sway = { amp: 0.010, freq: 0.62, phase: x * 7 + z * 3, axis: 'z' };
    plants.add(p);
    const outer = MAT.leaf({ color: tone === 0 ? PAL.leaf : '#8a9a6a', tint: '#eef2e2' });
    const mid = MAT.leaf({ color: PAL.leafYoung });
    const young = MAT.leaf({ color: tone === 0 ? '#cfdcae' : '#d8c8d6' });
    const geoL = bowlGeo(0.070, 0.030), geoM = bowlGeo(0.056, 0.024), geoS = bowlGeo(0.038, 0.016);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.24;
      const m = mesh(geoL, outer, { cast: false });
      radialPlace(orient(m, -0.66 + (k % 3) * 0.08, a, (k % 2 ? 0.1 : -0.1)), a, 0.050, 0.004);
      m.scale.set(0.86, 1, 1.28);
      p.add(m);
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.72;
      const m = mesh(geoM, mid, { cast: false });
      radialPlace(orient(m, -0.38, a), a, 0.030, 0.026);
      m.scale.set(0.88, 1, 1.24);
      p.add(m);
    }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.34;
      const m = mesh(geoS, young, { cast: false });
      radialPlace(orient(m, -0.1, a), a, 0.013, 0.048);
      m.scale.set(0.9, 1, 1.18);
      p.add(m);
    }
    p.add(noShadow(mesh(sph(0.013, 8, 6), young, { pos: [0, 0.055, 0], scale: [1, 0.7, 1] })));
    return p;
  }

  /** パンジー：5 弁×2 輪＋ギザ葉 */
  function pansy({ x, z, hue = 0, scale = 1 } = {}) {
    const p = grp('pansy');
    p.position.set(x, 0.288, z);
    p.scale.setScalar(scale);
    p.userData.sway = { amp: 0.012, freq: 0.75, phase: x * 11 - z * 5, axis: 'x' };
    plants.add(p);
    const skin = [['#6a5a93', '#9c8ac4'], ['#4f6ea0', '#86a6d2'], ['#8f5f86', '#c391b4']][hue % 3];
    const petalMat = MAT.leaf({ color: skin[0], rimColor: skin[1], rim: 0.5, shadowTint: '#7c6f9c' });
    const eyeMat = MAT.leaf({ color: skin[1], rimColor: '#fff4d0', rim: 0.6 });
    const leafMat = MAT.leaf({ color: '#6f9455' });
    const pGeo = bowlGeo(0.017, 0.0050, 8);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.4;
      const m = mesh(pGeo, leafMat, { cast: false });
      radialPlace(orient(m, -0.5, a), a, 0.028, 0.004);
      m.scale.set(0.82, 1, 1.45);
      p.add(m);
    }
    for (let f = 0; f < 2; f++) {
      const hx = f ? 0.024 : -0.019, hz = f ? -0.016 : 0.018, hy = f ? 0.064 : 0.050;
      p.add(noShadow(mesh(tubeOf([[0, 0.004, 0], [hx * 0.4, hy * 0.5, hz * 0.4], [hx, hy, hz]], 0.0022, 8, 4), MAT.leaf({ color: '#7a9a5c' }))));
      const head = grp('pansy-head');
      head.position.set(hx, hy, hz);
      head.rotation.set(0, f * 1.7, 0);
      p.add(head);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + (k === 0 ? 0 : Math.PI);
        const pm = mesh(pGeo, k === 0 || k === 4 ? eyeMat : petalMat, { cast: false });
        radialPlace(orient(pm, -1.16 + (k % 2) * 0.10, a), a, 0.0115, 0.0018 * (k % 2));
        pm.scale.set(0.92, 1, 1.30);
        head.add(pm);
      }
      head.add(noShadow(mesh(sph(0.0062, 8, 6), MAT.food({ color: '#f2d675', spec: 0.34 }), { pos: [0, 0.006, 0] })));
      head.add(noShadow(mesh(sph(0.0030, 6, 5), MAT.paint('#54452c', { steps: 2 }), { pos: [0, 0.0085, 0] })));
    }
    return p;
  }

  /** 春の苗（対葉＋小さな房咲き） */
  function seedling({ x, z, flower = '#f6b8cd', leaf = PAL.leafYoung } = {}) {
    const p = grp('seedling');
    p.position.set(x, 0.287, z);
    p.userData.sway = { amp: 0.014, freq: 0.95, phase: x * 13 + z * 9, axis: 'z' };
    plants.add(p);
    const lmat = MAT.leaf({ color: leaf });
    const fmat = MAT.petal({ tone: 1, glow: 0.20 });
    const nStem = 3 + ((rnd() * 2) | 0);
    for (let s = 0; s < nStem; s++) {
      const a = (s / nStem) * Math.PI * 2 + rnd() * 0.9;
      const len = range(rnd, 0.048, 0.084);
      const tx = Math.sin(a) * len * 0.40, tz = Math.cos(a) * len * 0.40;
      p.add(noShadow(mesh(tubeOf([[0, 0.002, 0], [tx * 0.5, len * 0.55, tz * 0.5], [tx, len, tz]], 0.0016, 6, 4), lmat)));
      for (let k = 0; k < 2; k++) {
        const m = mesh(bowlGeo(0.010, 0.0034, 6), lmat, { cast: false });
        radialPlace(orient(m, -0.52, a + k * Math.PI), a + k * Math.PI, 0.014, len * (0.42 + k * 0.22));
        m.scale.set(0.8, 1, 1.5);
        p.add(m);
      }
      const head = grp('floret');
      head.position.set(tx, len, tz);
      p.add(head);
      for (let k = 0; k < 5; k++) {
        const aa = (k / 5) * Math.PI * 2;
        const fm = mesh(bowlGeo(0.0058, 0.0020, 6), fmat, { cast: false });
        radialPlace(orient(fm, -1.28, aa), aa, 0.0046, 0.0016);
        head.add(fm);
      }
      head.add(noShadow(mesh(sph(0.0024, 6, 5), MAT.food({ color: flower }), { pos: [0, 0.0032, 0] })));
    }
    return p;
  }

  /* ---- 植栽配置 ---- */
  kale({ x: -0.25, z: 0.030, scale: 1.00, tone: 0 });
  kale({ x: 0.012, z: -0.03, scale: 1.10, tone: 1 });
  kale({ x: 0.268, z: 0.026, scale: 0.90, tone: 0 });
  pansy({ x: -0.128, z: -0.034, hue: 0, scale: 1.0 });
  pansy({ x: 0.142, z: 0.042, hue: 1, scale: 0.94 });
  pansy({ x: -0.318, z: -4e-3, hue: 2, scale: 0.86 });
  seedling({ x: 0.086, z: -0.048, flower: '#f6b8cd', leaf: PAL.leafYoung });
  seedling({ x: -0.058, z: 0.054, flower: '#f2e6c8', leaf: PAL.leaf });
  seedling({ x: 0.206, z: -0.052, flower: '#b9a6d8', leaf: '#7fa35c' });

  /* ================= 名前札「店先の花」 ================= */
  const tag = grp('name-tag');
  g.add(tag);
  tag.add(mesh(cyl(0.0028, 0.0028, 0.20, 6), galv, { pos: [-0.352, 0.362, 0.106], rot: [4 * D2R, 0, 6 * D2R] }));
  tag.add(mesh(rbox(0.134, 0.038, 0.009, 0.003, 2), MAT.paint('#f7f2e4', { steps: 2, map: TEX.paper({ base: '#f7f2e4' }).map }), { pos: [-0.352, 0.454, 0.115], rot: [4 * D2R, 0, 6 * D2R] }));
  decal(tag, { map: TEX.signboard({ text: '店先の花', sub: '春組 一同', bg: '#f7f2e4', fg: '#3f5a45' }), w: 0.126, h: 0.0315, pos: [-0.352, 0.454, 0.1202], rot: [4 * D2R, 0, 6 * D2R] });
  weather(tag, { w: 0.10, h: 0.03, pos: [-0.36, 0.444, 0.1218], kind: 'dirt', color: '#a8977a', opacity: 0.42, seed: seed + 31, spread: 0.004 });

  /* ================= じょうろ（樹脂胴＋錆びた散水キャップ） ================= */
  const can = grp('watering-can');
  can.position.set(-0.235, 0, 0.330);
  can.rotation.y = 8 * D2R;
  g.add(can);
  const tinTex = TEX.metal({ base: '#ffffff', worn: 0.55, repeat: 2 });
  const canBody = MAT.hardPlastic('#4f8bb4', { map: tinTex.map, normalMap: tinTex.normalMap, sat: 0.80, tint: '#f2f7f9' });
  can.add(mesh(lathe([[0, 0], [0.062, 0.003], [0.069, 0.022], [0.070, 0.128], [0.066, 0.148], [0.047, 0.153], [0.045, 0.161], [0, 0.163]], 18), canBody, { pos: [0, 0.006, 0] }));
  can.add(mesh(tor(0.0455, 0.0045, 6, 18), canBody, { pos: [0, 0.167, 0], rot: [Math.PI / 2, 0, 0] }));
  can.add(mesh(cyl(0.0445, 0.0445, 0.010, 16), MAT.hardPlastic('#33566e', { repeat: 5 }), { pos: [0, 0.165, 0] }));
  for (const y of [0.052, 0.118]) can.add(mesh(tor(0.0695, 0.0035, 6, 20), canBody, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
  can.add(noShadow(mesh(tubeOf([[-0.02, 0.169, 0], [-0.066, 0.226, 0], [-0.128, 0.228, 0], [-0.156, 0.176, 0], [-0.148, 0.122, 0]], 0.0075, 14, 6), canBody)));
  can.add(noShadow(mesh(tubeOf([[0.066, 0.140, 0], [0.108, 0.176, 0], [0.116, 0.110, 0], [0.070, 0.064, 0]], 0.0075, 12, 6), canBody)));
  can.add(noShadow(mesh(tubeOf([[0.062, 0.126, 0], [0.112, 0.176, 0], [0.146, 0.220, 0]], 0.0105, 10, 8), tinMat)));
  const rose = grp('rose-head');
  rose.position.set(0.150, 0.226, 0);
  rose.rotation.set(0, 0, -42 * D2R);
  can.add(rose);
  rose.add(mesh(cyl(0.0265, 0.0225, 0.014, 14), tinMat, { pos: [0, 0.006, 0] }));
  rose.add(mesh(cyl(0.0265, 0.0265, 0.0035, 14), MAT.metal('#a8a29a', { worn: 1, repeat: 6 }), { pos: [0, 0.0150, 0] }));
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2, rr = k === 6 ? 0 : 0.0155;
    rose.add(mesh(cyl(0.0032, 0.0032, 0.006, 6), MAT.paint('#4a4741', { steps: 2, shadowAmt: 1 }), { pos: [Math.cos(a) * rr, 0.0156, Math.sin(a) * rr] }));
  }
  can.add(noShadow(mesh(cyl(0.060, 0.060, 0.004, 14), MAT.water({ opacity: 0.55 }), { pos: [0, 0.032, 0], cast: false })));   // 残水
  weather(rose, { w: 0.05, h: 0.04, pos: [0, 0.012, 0.019], kind: 'rust', color: PAL.rust, opacity: 0.62, seed: seed + 36, density: 1.7, spread: 0.004 });
  weather(can, { w: 0.10, h: 0.06, pos: [0, 0.032, 0.0705], kind: 'chip', color: '#dfe6ea', opacity: 0.5, seed: seed + 37, density: 1.5, spread: 0.005 });
  weather(can, { w: 0.12, h: 0.05, pos: [0, 0.052, 0.0625], kind: 'dirt', color: '#6a6152', opacity: 0.45, seed: seed + 38, density: 1.4, spread: 0.005 });
  decal(can, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']] }), w: 0.13, h: 0.10, pos: [0, 0.118, 0.0708], opacity: 0.30 });

  /* ================= シャベル（土に挿した状态） ================= */
  const shovel = grp('trowel');
  shovel.position.set(0.316, 0.292, -0.056);
  shovel.rotation.set(-0.16, 0.5, 0.28);
  g.add(shovel);
  shovel.add(mesh(box(0.030, 0.010, 0.100), MAT.stainless({ repeat: 5 }), { pos: [0, -0.012, 0.046], rot: [0.30, 0, 0] }));
  shovel.add(mesh(lathe([[0, -0.052], [0.012, -0.048], [0.016, -0.03], [0.015, 0], [0.010, 0.012], [0, 0.015]], 10), MAT.stainless({ repeat: 5 }), { pos: [0, -0.018, 0.100], rot: [0.30, 0, 0] }));
  shovel.add(mesh(cyl(0.0075, 0.0075, 0.086, 10), MAT.wood({ light: PAL.wood, dark: PAL.woodDark, repeat: 3 }), { pos: [0, 0.030, -0.014] }));
  shovel.add(mesh(rbox(0.021, 0.060, 0.025, 0.008, 2), MAT.hardPlastic(PAL.storeBand3, { sat: 0.78, tint: '#f8e8da', repeat: 5 }), { pos: [0, 0.088, -0.016] }));
  weather(shovel, { w: 0.05, h: 0.05, pos: [0.004, -0.018, 0.082], kind: 'dirt', color: '#57472f', opacity: 0.6, seed: seed + 41, density: 1.7, spread: 0.005 });
  weather(shovel, { w: 0.03, h: 0.05, pos: [0.008, 0.032, -0.012], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#8a6a4a', opacity: 0.4, seed: seed + 42, spread: 0.004 });

  /* ================= 接触影 ================= */
  shadowBlob(g, { r: 0.46, pos: [0, 0.003, 0], opacity: 0.26, ratio: 0.46 });
  shadowBlob(g, { r: 0.11, pos: [-0.235, 0.004, 0.330], opacity: 0.30, ratio: 1 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
