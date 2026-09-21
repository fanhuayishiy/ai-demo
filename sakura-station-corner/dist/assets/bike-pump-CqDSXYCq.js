import { g as grp, M as MAT, P as PAL, m as mesh, c as cyl, e as radial, r as rbox, b as box, w as weather, t as tor, a as sph, h as decal, T as TEX, k as tubeOf, q as finish, j as d2r, n as range, z as rand } from './index-Dv-C_8Uh.js';

//  assets/bike/bike-pump.js
//  立式空気入れ（駐輪場の柱型ポンプ）—— ゲージ（ガラス・目盛）・ホース（劣化・曲がり）・グリップ・
//   台座（ボルト・錆・コンクリート基礎）・上部の広告プレート・ホコリと泥。
//  単位：メートル。原点 = 台座の接地中心。+Y 上。持ち手／ゲージの読み取り面は +Z。

const meta = {
  id: 'bike-pump',
  real: [0.34, 1.12, 0.30],
  origin: 'ground-center',
};

function build(options = {}) {
  const seed = options.seed ?? 305;
  const rnd = rand(seed);
  const g = grp('bike-pump');

  const M = {
    barrel: MAT.metalPaint('#3f6f8c', { worn: 0.68, repeat: 2.4 }),
    barrelDark: MAT.metal('#4a5a62', { worn: 0.85 }),
    chrome: MAT.chrome({ spec: 0.8 }),
    steel: MAT.metal('#9aa0a6', { worn: 0.62, repeat: 2 }),
    bolt: MAT.darkIron({ worn: 0.88 }),
    rust: MAT.metalPaint(PAL.rust, { worn: 1.0, repeat: 1.4, spec: 0.12 }),
    rubber: MAT.rubber('#33363b'),
    hose: MAT.rubber('#2f3237', { steps: 3, specPower: 18 }),
    grip: MAT.plastic('#b8433a', { spec: 0.24, shadowAmt: 0.9 }),
    concrete: MAT.concrete({ base: PAL.concreteDark, repeat: 1.8, joints: 2, cracked: true }),
    dial: MAT.paper({ color: '#f2ecd9' }),
    glass: MAT.glassLite({ color: '#e6eef0', opacity: 0.28 }),
    ad: MAT.poster({ map: null }),
    yellow: MAT.marking(PAL.markingYellow),
    needle: MAT.hardPlastic('#c2413a', { worn: 0.4 }),
  };

  /* ---------- 1. コンクリート基礎 + 台座プレート ---------- */
  const base = grp('base');
  g.add(base);
  base.add(mesh(cyl(0.150, 0.168, 0.056, 20), M.concrete, { name: 'concrete-footing', pos: [0, 0.028, 0] }));
  base.add(mesh(cyl(0.138, 0.150, 0.014, 20), M.concrete, { name: 'footing-cap', pos: [0, 0.063, 0] }));
  base.add(mesh(cyl(0.112, 0.112, 0.016, 18), M.steel, { name: 'base-plate', pos: [0, 0.078, 0] }));
  base.add(mesh(cyl(0.098, 0.112, 0.022, 18), M.barrelDark, { name: 'base-collar', pos: [0, 0.094, 0] }));
  radial(base, 4, 0.092, (i, a, x, z) => {
    const b = grp('anchor');
    b.position.set(x, 0.088, z);
    b.add(mesh(cyl(0.0095, 0.0095, 0.020, 6), M.bolt, { name: 'anchor-bolt' }));
    b.add(mesh(cyl(0.0155, 0.0155, 0.006, 6), M.rust, { name: 'washer', pos: [0, -9e-3, 0] }));
    return b;
  });
  // 台座の踏み板（タイヤを乗せる）
  const foot = grp('footboard', { pos: [0, 0.070, 0.112], rot: [d2r(-3), 0, 0] });
  foot.add(mesh(rbox(0.230, 0.014, 0.130, 0.005, 2), M.steel, { name: 'footplate' }));
  for (let k = 0; k < 5; k++) foot.add(mesh(box(0.200, 0.005, 0.010), M.barrelDark, { name: 'grip-bar', pos: [0, 0.010, -0.048 + k * 0.024] }));
  foot.add(mesh(rbox(0.060, 0.010, 0.040, 0.003, 2), M.rubber, { name: 'heel-pad', pos: [-0.07, 0.012, 0.030] }));
  base.add(foot);
  weather(base, { w: 0.18, h: 0.06, pos: [0.09, 0.086, 0.06], rot: [0, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 3, spread: 0.03 });
  weather(base, { w: 0.20, h: 0.10, pos: [-0.04, 0.070, 0.14], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6d6250', opacity: 0.4, seed: seed + 5, spread: 0.03 });

  /* ---------- 2. シリンダ（胴体）とロッド ---------- */
  const body = grp('cylinder');
  g.add(body);
  body.add(mesh(cyl(0.0340, 0.0365, 0.720, 18), M.barrel, { name: 'barrel', pos: [0, 0.462, 0] }));
  body.add(mesh(cyl(0.0372, 0.0372, 0.026, 18), M.barrelDark, { name: 'barrel-collara', pos: [0, 0.820, 0] }));
  body.add(mesh(cyl(0.0355, 0.0355, 0.018, 18), M.barrelDark, { name: 'barrel-collarb', pos: [0, 0.126, 0] }));
  body.add(mesh(tor(0.0348, 0.0032, 5, 18), M.rust, { name: 'barrel-seam', pos: [0, 0.300, 0], rot: [Math.PI / 2, 0, 0] }));
  body.add(mesh(tor(0.0348, 0.0028, 5, 18), M.chrome, { name: 'barrel-ring', pos: [0, 0.640, 0], rot: [Math.PI / 2, 0, 0] }));
  // ロッド（引き出し棒・クローム・擦り傷）
  const rod = grp('rod');
  rod.add(mesh(cyl(0.0135, 0.0135, 0.300, 12), M.chrome, { name: 'piston-rod', pos: [0, 0.960, 0] }));
  rod.add(mesh(cyl(0.0170, 0.0170, 0.026, 12), M.barrelDark, { name: 'rod-guide', pos: [0, 0.838, 0] }));
  // T グリップ（ゴム・劣化してテカる）
  const gr = grp('handle', { pos: [0, 1.108, 0] });
  gr.add(mesh(cyl(0.0210, 0.0190, 0.052, 12), M.grip, { name: 'grip-knob', rot: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) {
    gr.add(mesh(cyl(0.0245, 0.0225, 0.100, 14), M.grip, { name: 'grip-bar', pos: [s * 0.076, 0, 0], rot: [0, 0, Math.PI / 2] }));
    gr.add(mesh(sph(0.0240, 12, 9), M.grip, { name: 'grip-end', pos: [s * 0.128, 0, 0] }));
    for (let k = 0; k < 4; k++) gr.add(mesh(tor(0.0242, 0.0018, 4, 12), M.grip, { name: 'grip-ring', pos: [s * (0.040 + k * 0.021), 0, 0], rot: [0, Math.PI / 2, 0] }));
  }
  gr.add(mesh(cyl(0.0125, 0.0125, 0.036, 10), M.chrome, { name: 'grip-stem', pos: [0, -0.026, 0] }));
  rod.add(gr);
  body.add(rod);
  weather(body, { w: 0.08, h: 0.26, pos: [0.036, 0.560, 0.01], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#c9c4b6', opacity: 0.45, seed: seed + 7, spread: 0.04 });
  weather(body, { w: 0.10, h: 0.20, pos: [-0.036, 0.340, 0.01], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 9, count: 2, spread: 0.05 });

  /* ---------- 3. ゲージ（ガラス・目盛・針） ---------- */
  const GA = grp('gauge', { pos: [0.030, 0.600, 0.028], rot: [d2r(-14), d2r(26), 0] });
  g.add(GA);
  GA.add(mesh(cyl(0.0480, 0.0480, 0.022, 22), M.steel, { name: 'gauge-case', rot: [Math.PI / 2, 0, 0] }));
  GA.add(mesh(cyl(0.0500, 0.0480, 0.008, 22), M.chrome, { name: 'gauge-bezel', pos: [0, 0, 0.014], rot: [Math.PI / 2, 0, 0] }));
  GA.add(mesh(cyl(0.0440, 0.0440, 0.003, 22), M.dial, { name: 'gauge-dial', pos: [0, 0, 0.011], rot: [Math.PI / 2, 0, 0] }));
  decal(GA, {
    map: TEX.lightPanel({ text: 'kgl/cm2', bg: '#f4eeda', fg: '#3a3f36', mode: 'sign', rows: [{ t: '26IN', v: '2.5-3.5' }, { t: 'MAX', v: '5.0' }] }),
    w: 0.080, h: 0.080, pos: [0, 0, 0.0128], opacity: 0.95,
  });
  // 目盛（radial で 13 本）
  radial(GA, 13, 0.036, (i, a, x, z) => {
    const t = mesh(box(0.0022, i % 4 === 0 ? 0.013 : 0.0075, 0.0012), M.needle, { name: 'dial-tick' });
    t.position.set(x, z, 0.0132);
    t.rotation.z = -a + Math.PI / 2;
    t.userData.noOutline = true;
    return t;
  });
  GA.add(mesh(box(0.0030, 0.0300, 0.0014), M.needle, { name: 'gauge-needle', pos: [0.008, 0.010, 0.0136], rot: [0, 0, d2r(38)] }));
  GA.add(mesh(cyl(0.0050, 0.0050, 0.004, 10), M.barrelDark, { name: 'needle-hub', pos: [0, 0, 0.014], rot: [Math.PI / 2, 0, 0] }));
  GA.add(mesh(cyl(0.0455, 0.0455, 0.0022, 22), M.glass, { name: 'gauge-glass', pos: [0, 0, 0.0158], rot: [Math.PI / 2, 0, 0] }));
  GA.add(mesh(cyl(0.0100, 0.0100, 0.030, 10), M.steel, { name: 'gauge-stem', pos: [-0.02, -0.052, -6e-3], rot: [d2r(18), 0, d2r(-18)] }));
  GA.add(mesh(rbox(0.030, 0.026, 0.030, 0.004, 2), M.barrelDark, { name: 'gauge-bracket', pos: [-0.026, -0.062, -0.01], rot: [0, d2r(14), d2r(10)] }));
  GA.add(mesh(tor(0.0108, 0.0022, 4, 12), M.rust, { name: 'gauge-joint', pos: [-0.028, -0.07, -0.01], rot: [d2r(70), 0, d2r(-18)] }));
  weather(GA, { w: 0.05, h: 0.03, pos: [0.020, -0.024, 0.017], kind: 'dirt', color: '#8b8268', opacity: 0.4, seed: seed + 11, spread: 0.01 });

  /* ---------- 4. ホース（劣化・曲がり・先端チャック） ---------- */
  const HO = grp('hose');
  g.add(HO);
  const hosePts = [
    [0.030, 0.170, 0.020],
    [0.098, 0.150, 0.062],
    [0.126, 0.112, 0.128],
    [0.100, 0.096, 0.186],
    [0.040, 0.100, 0.216],
    [-0.03, 0.112, 0.206],
    [-0.072, 0.118, 0.168],
    [-0.084, 0.128, 0.116],
  ];
  HO.add(mesh(tubeOf(hosePts, 0.0108, 40, 8), M.hose, { name: 'hose' }));
  // ホースの擦り切れ（白化した部分）
  for (let i = 0; i < 4; i++) {
    const p = hosePts[1 + i * 2];
    HO.add(mesh(cyl(0.0116, 0.0116, 0.026, 10), MAT.rubber('#4d5055', { spec: 0.16 }), { name: 'hose-wear', pos: [p[0], p[1], p[2]], rot: [d2r(80 - i * 12), d2r(i * 24), 0] }));
  }
  HO.add(mesh(cyl(0.0145, 0.0145, 0.024, 12), M.steel, { name: 'hose-ferrule', pos: [0.030, 0.170, 0.020], rot: [d2r(70), 0, d2r(30)] }));
  HO.add(mesh(tor(0.0152, 0.0026, 4, 12), M.rust, { name: 'hose-clamp', pos: [0.052, 0.162, 0.034], rot: [d2r(60), 0, d2r(24)] }));
  // 先端チャック（空気口・ねじ・レバー）
  const ch = grp('chuck', { pos: [-0.084, 0.128, 0.112], rot: [d2r(24), d2r(-14), 0] });
  ch.add(mesh(cyl(0.0135, 0.0115, 0.058, 12), M.steel, { name: 'chuck-body' }));
  ch.add(mesh(cyl(0.0150, 0.0150, 0.010, 12), M.chrome, { name: 'chuck-collar', pos: [0, 0.020, 0] }));
  ch.add(mesh(cyl(0.0062, 0.0062, 0.020, 8), M.chrome, { name: 'chuck-nozzle', pos: [0, 0.040, 0] }));
  ch.add(mesh(rbox(0.030, 0.010, 0.008, 0.003, 2), M.grip, { name: 'chuck-lever', pos: [0.018, 0.002, 0], rot: [0, 0, d2r(-18)] }));
  ch.add(mesh(cyl(0.0048, 0.0048, 0.014, 8), M.rust, { name: 'chuck-pin', pos: [0.014, 0.002, 0], rot: [0, 0, Math.PI / 2] }));
  HO.add(ch);
  // ホース吊り金具（胴体に戻しておく）
  HO.add(mesh(tor(0.0420, 0.0035, 4, 14), M.steel, { name: 'hose-hanger', pos: [0.030, 0.246, 0], rot: [0, Math.PI / 2, 0] }));
  HO.add(mesh(cyl(0.0040, 0.0040, 0.034, 6), M.steel, { name: 'hanger-stem', pos: [0.014, 0.246, 0], rot: [0, 0, Math.PI / 2] }));

  /* ---------- 5. 上部の広告プレート ---------- */
  const AD = grp('ad-plate', { pos: [0, 0.730, 0.046], rot: [d2r(-10), 0, 0] });
  g.add(AD);
  AD.add(mesh(rbox(0.230, 0.150, 0.010, 0.006, 2), M.steel, { name: 'ad-back' }));
  decal(AD, { map: TEX.poster({ title: '春日サイクル', sub: '空気圧チェックを!', bg: '#f2e7d0', accent: '#3d7fb5', seed: seed + 13 }), w: 0.214, h: 0.136, pos: [0, 0, 0.0065], opacity: 0.95 });
  AD.add(mesh(rbox(0.236, 0.014, 0.020, 0.004, 2), M.barrelDark, { name: 'ad-hood', pos: [0, 0.080, 0.002], rot: [d2r(16), 0, 0] }));
  for (const sx of [-1, 1]) {
    AD.add(mesh(cyl(0.0060, 0.0060, 0.026, 8), M.bolt, { name: 'ad-bolt', pos: [sx * 0.100, -0.062, -6e-3], rot: [Math.PI / 2, 0, 0] }));
    AD.add(mesh(box(0.018, 0.014, 0.030), M.steel, { name: 'ad-bracket', pos: [sx * 0.100, -0.062, -0.024] }));
  }
  weather(AD, { w: 0.12, h: 0.05, pos: [-0.044, -0.052, 0.008], kind: 'chip', color: '#d8d2c0', opacity: 0.5, seed: seed + 15, spread: 0.010 });
  weather(AD, { w: 0.08, h: 0.08, pos: [0.062, 0.026, 0.008], kind: 'dirt', color: '#7a7159', opacity: 0.4, seed: seed + 17, spread: 0.012 });

  /* ---------- 6. 使用説明・注意シール、ホコリと泥 ---------- */
  const st = grp('usage-sticker', { pos: [-0.036, 0.430, 0.034], rot: [0, d2r(38), 0] });
  st.add(mesh(rbox(0.060, 0.086, 0.002, 0.002, 2), M.dial, { name: 'sticker-base' }));
  decal(st, { map: TEX.poster({ title: '使い方', sub: '1 2 3', bg: '#eef2ea', accent: '#c2413a', seed: seed + 19 }), w: 0.054, h: 0.080, pos: [0, 0, 0.002], opacity: 0.9 });
  g.add(st);
  // 卷き上がった角
  st.add(mesh(rbox(0.016, 0.010, 0.0022, 0.001, 1), M.dial, { name: 'sticker-curl', pos: [0.024, -0.04, 0.004], rot: [d2r(-28), 0, d2r(14)] }));
  // ホコリ堆積（肩部・台座）
  weather(g, { w: 0.14, h: 0.05, pos: [0, 0.850, 0.020], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b6ad99', opacity: 0.35, seed: seed + 21, count: 2, spread: 0.006 });
  weather(g, { w: 0.22, h: 0.10, pos: [0.02, 0.078, 0.10], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6d6250', opacity: 0.35, seed: seed + 23, count: 2, spread: 0.008 });
  // 足元の小石
  const pebble = sph(0.011, 6, 5);
  radial(g, 7, 0.190, (i, a, x, z) => {
    const p = mesh(pebble, MAT.stone({ color: '#a8a29a' }), { name: 'pebble', pos: [x * range(rnd, 0.72, 1.06), 0.0145, z * range(rnd, 0.72, 1.06) + 0.03] });
    p.scale.set(range(rnd, 0.5, 1.2), range(rnd, 0.24, 0.44), range(rnd, 0.5, 1.1));
    p.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    p.userData.noOutline = true;
    return p;
  });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
