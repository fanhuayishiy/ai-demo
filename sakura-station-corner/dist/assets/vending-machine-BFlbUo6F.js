import { P as PAL, g as grp, M as MAT, T as TEX, m as mesh, b as box, w as weather, h as decal, A as row, r as rbox, H as plane, c as cyl, i as grill, d as coil, W as pipe, D as DoubleSide, a as sph, q as finish, t as tor, z as rand, n as range, o as lathe } from './index-D433i3Qe.js';

//  assets/street/vending-machine.js —— 飲料自動販売機（ガラス扉・庫内 5段×3列＝15セル全商品実モデル）
//  ・原点 = 底面（据付パッド下面）中心 / +Y 上 / 正面 +Z（歩道側）
//  ・主尺度 1.13 × 1.85 × 0.75 m（凍結値）
//  ・構造：①鋼板机体（折辺・溶接シーム・錆・掉漆・へこみ・鳥フン）②上部サイン灯箱（呼吸）
//          ③アルミ框ガラス扉（実折射・戸開 option）④庫内 5段棚×3列・LED 価格札・棚前ワイヤー・灯管
//          ⑤選購パネル（ボタン／LED／お釣り／硬貨／QR・交通系）⑥受け取り口（フラップ・盗難バー）
//          ⑦接地（アンカーボルト・コンクリート段差・油汚れ・排水跡・空き缶）
//  ⚠ ガラス（MeshPhysicalMaterial transmission）は不透明オブジェクトのみ屈折バッファに含めるため、
//     庫内の部品はすべて不透明マテリアルで構成している（半透明デカールは庫内では見えない）。

const meta = {
  id: 'vending-machine',
  real: [1.13, 1.85, 0.75],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const noOut = (o) => { o.userData.noOutline = true; return o; };

/* 車削断面キャッシュ（同一寸法は BufferGeometry を共有 → クローンで量産） */
const _latheCache = new Map();
function latheOf(pts, seg = 16) {
  const key = seg + '|' + pts.map((p) => p[0].toFixed(4) + ',' + p[1].toFixed(4)).join(';');
  let g = _latheCache.get(key);
  if (!g) {
    g = lathe(pts.map(([x, y]) => [Math.max(0, x), y]), seg);
    _latheCache.set(key, g);
  }
  return g;
}
/** 商品ラベル（不透明：ガラス越しに屈折バッファへ入るため） */
function labelMat(map) {
  return MAT.paint('#ffffff', { map, steps: 3, spec: 0.30, specPower: 74, specCut: 0.18, sheen: 0.10, rim: 0.10, shadowAmt: 0.70 });
}
const labelCache = new Map();
function labelOf(e) {
  if (!labelCache.has(e.key)) {
    labelCache.set(e.key, labelMat(TEX.drinkLabel({ name: e.jp, sub: e.sub, ml: e.ml, a: e.a, b: e.b })));
  }
  return labelCache.get(e.key);
}
/** ラベルは「テクスチャ」として使う（MAT を map に渡しない事！） */
function labelTex(e) { return TEX.drinkLabel({ name: e.jp, sub: e.sub, ml: e.ml, a: e.a, b: e.b }); }

/* ------------------------------------------------------------------ 商品仕様（飲料） */
const DRINK_CATALOG = [
  { key: 'water', kind: 'pet', jp: '山の清水', sub: 'NATURAL WATER', ml: '500ml', a: '#3fa9d8', b: '#e4f4fb', cap: '#2a7fb5', body: '#d3eaf2', h: 0.190, r: 0.0325, price: 130 },
  { key: 'cola', kind: 'pet', jp: 'コーク', sub: 'CLASSIC COLA', ml: '500ml', a: '#c2302a', b: '#f7ddd0', cap: '#b0271f', body: '#4a2418', h: 0.188, r: 0.0322, price: 150 },
  { key: 'orange', kind: 'pet', jp: 'みかん', sub: 'ORANGE 100%', ml: '350ml', a: '#ef8f2a', b: '#ffeed2', cap: '#dd7118', body: '#f0a52c', h: 0.166, r: 0.0298, price: 140 },
  { key: 'greentea', kind: 'petsquat', jp: '深蒸し緑茶', sub: 'SENCHA', ml: '550ml', a: '#3f8a4a', b: '#e9f3dd', cap: '#2c6234', body: '#c9dc9a', h: 0.178, r: 0.0362, price: 140 },
  { key: 'coffee', kind: 'pet', jp: 'ブラック', sub: 'NO SUGAR COFFEE', ml: '280ml', a: '#6a452c', b: '#efe2cd', cap: '#4b2f1c', body: '#3a2113', h: 0.156, r: 0.0300, price: 120 },
  { key: 'energy', kind: 'tallcan', jp: 'キリリ', sub: 'ENERGY', ml: '250ml', a: '#26292f', b: '#e8c14b', cap: '#c9a227', body: '#2b2f36', h: 0.132, r: 0.0272, price: 180 },
  { key: 'latte', kind: 'pack', jp: 'カフェオレ', sub: 'CAFE LATTE', ml: '200ml', a: '#c39a6b', b: '#f6ecdb', cap: '#9c7245', body: '#e8dcc4', h: 0.100, price: 130 },
  { key: 'grape', kind: 'petsmall', jp: '巨峰水', sub: 'GRAPE', ml: '400ml', a: '#6b4b8f', b: '#f0e2f7', cap: '#573879', body: '#8d6bb0', h: 0.160, r: 0.0286, price: 140 },
  { key: 'melon', kind: 'can', jp: 'メロンソーダ', sub: 'MELON SODA', ml: '350ml', a: '#5fb877', b: '#eaf8e4', cap: '#48995c', body: '#7ec98d', h: 0.118, r: 0.0334, price: 120 },
  { key: 'bincoffee', kind: 'bottle', jp: '瓶コーヒー', sub: 'VACUUM POT', ml: '190ml', a: '#8a5a30', b: '#f4e7d2', cap: '#c8a24a', body: '#5b3418', h: 0.176, r: 0.0282, price: 130 },
  { key: 'sport', kind: 'sqpet', jp: 'アクアSP', sub: 'SPORTS DRINK', ml: '500ml', a: '#2f8fc9', b: '#eef8fd', cap: '#1f6fa5', body: '#dff0f8', h: 0.186, price: 150 },
  { key: 'barley', kind: 'pet', jp: '麦炒り茶', sub: 'BARLEY TEA', ml: '500ml', a: '#8a6a3c', b: '#f3e9d5', cap: '#6b4d28', body: '#c9a86a', h: 0.190, r: 0.0330, price: 130 },
];

/* ------------------------------------------------------------------ 商品仕様（お茶／珈琲＝温仕様） */
const TEA_CATALOG = [
  { key: 't_coffee', kind: 'bottle', jp: '焙煎珈琲', sub: 'ROASTED COFFEE', ml: '190ml', a: '#7a4a2c', b: '#f4e6d0', cap: '#b8892f', body: '#4a2a12', h: 0.176, r: 0.0282, price: 130 },
  { key: 't_latte', kind: 'bottle', jp: 'カフェオーレ', sub: 'MILK COFFEE', ml: '190ml', a: '#c9a273', b: '#f8f0e0', cap: '#a5763c', body: '#d8bd94', h: 0.174, r: 0.0280, price: 130 },
  { key: 't_tea', kind: 'bottle', jp: '紅茶', sub: 'LEMON TEA', ml: '190ml', a: '#c86a2a', b: '#fbeed4', cap: '#a54f18', body: '#e0a04a', h: 0.172, r: 0.0276, price: 120 },
  { key: 't_mikan', kind: 'pack', jp: '蜜柑汁', sub: 'MANDARIN', ml: '200ml', a: '#e8892a', b: '#fdf0d8', cap: '#c86f18', body: '#f6d9a8', h: 0.100, price: 130 },
  { key: 't_milk', kind: 'pack', jp: ' milk 茶', sub: 'MILK TEA', ml: '200ml', a: '#b79a72', b: '#f7f0e2', cap: '#8b6f4a', body: '#e6d7bd', h: 0.100, price: 140 },
  { key: 't_azuki', kind: 'pack', jp: 'あずき茶', sub: 'AZUKI TEA', ml: '200ml', a: '#8a4f3c', b: '#f4e5da', cap: '#6b3a2a', body: '#c69a80', h: 0.098, price: 120 },
  { key: 't_ginger', kind: 'pack', jp: '生姜湯', sub: 'GINGER', ml: '190ml', a: '#c8a038', b: '#faf1d8', cap: '#9c7a20', body: '#e8d09a', h: 0.096, price: 130 },
  { key: 't_cansw', kind: 'tallcan', jp: '微糖', sub: 'CAN COFFEE', ml: '245ml', a: '#3b3f45', b: '#e7ded2', cap: '#8a5a2a', body: '#54463a', h: 0.126, r: 0.0268, price: 110 },
  { key: 't_canswg', kind: 'tallcan', jp: '無糖', sub: 'BLACK', ml: '245ml', a: '#22252a', b: '#c9ccd2', cap: '#4a4f56', body: '#2e3238', h: 0.126, r: 0.0268, price: 110 },
  { key: 't_cocoa', kind: 'can', jp: 'ココア', sub: 'COCOA', ml: '210ml', a: '#6b4630', b: '#f2e3cd', cap: '#4b2f1e', body: '#b28b62', h: 0.112, r: 0.0328, price: 120 },
  { key: 't_genmai', kind: 'can', jp: '玄米茶', sub: 'GENMAICHA', ml: '210ml', a: '#4e7a3c', b: '#eef3dc', cap: '#375c2a', body: '#a8bf7e', h: 0.112, r: 0.0328, price: 110 },
  { key: 't_soup', kind: 'can', jp: 'とうもろこし', sub: 'CORN SOUP', ml: '190ml', a: '#e0b23c', b: '#fbf1d8', cap: '#b98a20', body: '#f2d489', h: 0.108, r: 0.0326, price: 120 },
];

/* ------------------------------------------------------------------ 商品テンプレート */
const _tpl = new Map();
function productTemplate(e) {
  if (_tpl.has(e.key)) return _tpl.get(e.key);
  const p = grp('item:' + e.key);
  labelOf(e);
  const R = e.r || 0.0325;
  const H = e.h;

  if (e.kind === 'pet' || e.kind === 'petsmall') {
    // PET ボトル：シェル（非透明度の高い PET 調）＋収缩膜ラベル＋キャップ＋サポートリング
    const neckTop = H - 0.020;
    const pts = [
      [0, 0], [R * 0.80, 0], [R * 0.94, 0.004], [R, 0.010], [R, 0.030],
      [R * 0.94, 0.046], [R * 0.985, 0.062], [R, 0.086], [R * 0.975, 0.104],
      [R * 0.90, H * 0.60], [R * 0.62, H * 0.70], [R * 0.36, H * 0.76],
      [0.0108, neckTop - 0.010], [0.0124, neckTop - 0.004], [0.0124, neckTop], [0, neckTop],
    ];
    p.add(noOut(mesh(latheOf(pts, 18), MAT.plastic(e.body, { spec: 0.52, specPower: 96, specCut: 0.12, sheen: 0.16, tint: '#f2fbff', sat: 0.9 }), { pos: [0, 0, 0], name: 'pet-shell' })));
    // 収缩膜（ボトル径より 1mm 大きく、上下エンドは巻き込み）
    const bs = H * 0.055, be = H * 0.60;
    const sl = [[R * 1.032, bs], [R * 1.018, bs + 0.006], [R * 1.032, (bs + be) * 0.5], [R * 1.016, be - 0.006], [R * 1.032, be]];
    p.add(noOut(mesh(latheOf(sl, 18), MAT.plastic('#ffffff', { map: labelTex(e), side: DoubleSide, spec: 0.34, specPower: 70, sheen: 0.1, shadowAmt: 0.72, steps: 3 }), { pos: [0, 0, 0], name: 'pet-sleeve' })));
    p.add(noOut(mesh(cyl(0.0148, 0.0146, 0.020, 14), MAT.plastic(e.cap, { spec: 0.42, specPower: 66, steps: 2 }), { pos: [0, neckTop + 0.004, 0], name: 'pet-cap' })));
    p.add(noOut(mesh(tor(0.0132, 0.0016), MAT.plastic(e.cap, { spec: 0.4 }), { pos: [0, neckTop + 0.012, 0], rot: [PI / 2, 0, 0] })));
  } else if (e.kind === 'petsquat') {
    const neckTop = H - 0.018;
    const pts = [
      [0, 0], [R * 0.82, 0], [R * 0.98, 0.008], [R, 0.022], [R, 0.055],
      [R * 0.965, 0.078], [R, 0.100], [R * 0.99, 0.126], [R * 0.86, H * 0.72],
      [R * 0.5, H * 0.82], [0.0132, neckTop - 0.012], [0.0148, neckTop], [0, neckTop],
    ];
    p.add(noOut(mesh(latheOf(pts, 18), MAT.plastic(e.body, { spec: 0.5, specPower: 90, sheen: 0.14, tint: '#f6fbff', sat: 0.86 }))));
    const bs = H * 0.06, be = H * 0.70;
    p.add(noOut(mesh(latheOf([[R * 1.03, bs], [R * 1.02, bs + 0.008], [R * 1.032, (bs + be) * 0.5], [R * 1.02, be - 0.006], [R * 1.03, be]], 18),
      MAT.plastic('#ffffff', { map: labelTex(e), side: DoubleSide, spec: 0.32, sheen: 0.1, shadowAmt: 0.72 }))));
    p.add(noOut(mesh(cyl(0.0172, 0.0170, 0.019, 14), MAT.plastic(e.cap, { spec: 0.42, steps: 2 }), { pos: [0, neckTop + 0.001, 0], name: 'cap' })));
    p.add(noOut(mesh(tor(0.0152, 0.0018), MAT.plastic(e.cap, { spec: 0.4 }), { pos: [0, neckTop + 0.010, 0], rot: [PI / 2, 0, 0] })));
  } else if (e.kind === 'can' || e.kind === 'tallcan') {
    // アルミ缶：胴（印刷）＋天面リッド＋ビード＋プルタブ＋リベット
    const rim = H - 0.004;
    const pts = [
      [0, 0], [R * 0.72, 0], [R * 0.74, 0.003], [R * 0.94, 0.007], [R, 0.013],
      [R * 1.004, 0.020], [R * 1.004, H * 0.78], [R, H * 0.86], [R * 0.86, H * 0.925],
      [R * 0.90, rim], [R * 0.88, H], [0, H],
    ];
    p.add(noOut(mesh(latheOf(pts, 18), labelOf(e), { name: 'can-body' })));
    p.add(noOut(mesh(cyl(R * 0.86, R * 0.86, 0.0035, 16), MAT.canBody({ color: '#d6dbe0' }), { pos: [0, H - 0.0015, 0], name: 'can-lid' })));
    p.add(noOut(mesh(tor(R * 1.002, 0.0013), MAT.chrome({}), { pos: [0, H * 0.50], rot: [PI / 2, 0, 0] })));
    p.add(noOut(mesh(rbox(0.019, 0.0018, 0.0115, 0.0016), MAT.chrome({}), { pos: [0, H + 0.0012, 0.0045], name: 'can-tab' })));
    p.add(noOut(mesh(cyl(0.0034, 0.0034, 0.0024, 8), MAT.chrome({}), { pos: [0, H + 0.0016, -52e-4] })));
  } else if (e.kind === 'pack') {
    // 紙パック：本体（5 面印刷）＋折り込み天端＋ストロー
    p.add(noOut(mesh(box(0.054, H - 0.010, 0.040), labelOf(e), { pos: [0, (H - 0.010) / 2, 0], name: 'pack-body' })));
    p.add(noOut(mesh(box(0.034, 0.010, 0.010), MAT.paper({ color: '#efe6d4' }), { pos: [0, H - 0.004, 0], name: 'pack-fin' })));
    p.add(noOut(mesh(box(0.050, 0.003, 0.036), MAT.paper({ color: '#e2d8c4' }), { pos: [0, 0.0015, 0] })));
    p.add(noOut(mesh(cyl(0.0035, 0.0035, 0.062, 8), MAT.plastic(e.cap, { spec: 0.4 }), { pos: [0.012, H + 0.024, -6e-3], rot: [8 * D2R, 0, 6 * D2R] })));
  } else if (e.kind === 'sqpet') {
    // 角型 PET（スポーツドリンク）
    p.add(noOut(mesh(rbox(0.058, H - 0.024, 0.044, 0.009), MAT.plastic(e.body, { spec: 0.5, specPower: 92, sheen: 0.14, tint: '#f4fbff', sat: 0.88 }), { pos: [0, (H - 0.024) / 2, 0] })));
    p.add(noOut(mesh(box(0.0594, H * 0.52, 0.0454), labelOf(e), { pos: [0, H * 0.36, 0] })));
    p.add(noOut(mesh(box(0.040, 0.016, 0.030), MAT.plastic(e.body, { spec: 0.5, tint: '#f4fbff' }), { pos: [0, H - 0.020, 0] })));
    p.add(noOut(mesh(cyl(0.0152, 0.0150, 0.020, 14), MAT.plastic(e.cap, { spec: 0.42, steps: 2 }), { pos: [0, H - 0.006, 0] })));
  } else { // bottle（ガラス瓶・王冠キャップ）
    const neckTop = H - 0.016;
    const pts = [
      [0, 0], [R * 0.78, 0.002], [R * 0.95, 0.010], [R, 0.022], [R, H * 0.44],
      [R * 0.98, H * 0.52], [R * 0.78, H * 0.62], [R * 0.42, H * 0.70], [0.0098, H * 0.76],
      [0.0098, neckTop], [0.0112, neckTop + 0.003], [0, neckTop + 0.004],
    ];
    p.add(noOut(mesh(latheOf(pts, 16), MAT.plastic(e.body, { spec: 0.62, specPower: 130, specCut: 0.10, sheen: 0.22, tint: '#f7ece0', sat: 0.92 }), { name: 'bottle-glass' })));
    const bs = H * 0.10, be = H * 0.56;
    p.add(noOut(mesh(latheOf([[R * 1.035, bs], [R * 1.022, bs + 0.007], [R * 1.035, (bs + be) * 0.5], [R * 1.022, be - 0.005], [R * 1.035, be]], 16),
      MAT.plastic('#ffffff', { map: labelTex(e), side: DoubleSide, spec: 0.24, sheen: 0.06, shadowAmt: 0.72 }))));
    p.add(noOut(mesh(cyl(0.0146, 0.0132, 0.011, 12), MAT.metal(e.cap, { spec: 0.72, specPower: 140 }), { pos: [0, neckTop + 0.002, 0], name: 'bottle-crown' })));
  }
  _tpl.set(e.key, p);
  return p;
}
function placeProduct(parent, e, x, y, z, yaw) {
  const c = productTemplate(e).clone();
  c.position.set(x, y, z);
  c.rotation.y = yaw;
  parent.add(c);
  return c;
}

/* ------------------------------------------------------------------ 寸法（凍結） */
const W = 1.13, D = 0.75;
const HW = W / 2, HD = D / 2;                    // 0.565 / 0.375
const Y_BODY_T = 1.470;        // 鋼板本体
const WIN = { x0: -0.53, x1: 0.100, y0: 0.302, y1: 1.450 };
const CAB = { x0: -0.548, x1: 0.118, z0: -0.33, z1: 0.300, y0: 0.306, y1: 1.462 };
const PKU = { x0: -0.508, x1: -0.098, y0: 0.112, y1: 0.282 };
const ROWS = 5, COLS = 3;
const SHELF_Y = [0.350, 0.566, 0.782, 0.998, 1.214];
const COL_X = [-0.437, -0.215, 0.007];
const Z_FRONT = 0.232, Z_BACK = 0.142;
const PIVOT_X = -0.524, PIVOT_Z = 0.371;         // 扉ヒンジ軸

/* ================================================================== BUILD */
function build(options = {}) {
  const o = options || {};
  const seed = o.seed ?? 2024;
  const rnd = rand(seed);
  const variant = ['drink', 'tea', 'coffee'].indexOf(o.variant) >= 0 ? o.variant : 'drink';
  const warm = variant !== 'drink';
  const color = o.color ?? (warm ? PAL.vendingGreen : PAL.vendingRed);
  const soldOutRatio = clamp(o.soldOutRatio ?? 0.18, 0, 0.55);
  const doorOpen = clamp(o.doorOpen ?? 0, 0, 62);   // 開き角度（deg）
  const cat = warm ? TEA_CATALOG : DRINK_CATALOG;
  const accent = warm ? '#e0574c' : PAL.storeBand2;

  const g = grp('vending-machine');

  /* ---------------- 共通マテリアル ---------------- */
  const skin = MAT.metalPaint(color, { worn: 0.62, repeat: 3, sat: 1.03, tint: '#fff2e0' });
  const skinTop = MAT.metalPaint(color, { worn: 0.9, repeat: 4, tint: '#ffe9c9', sat: 0.94 });
  const skinDark = MAT.metalPaint(color, { worn: 0.8, base: '#8f8478', repeat: 2 });
  const alu = MAT.metal('#c3c8cc', { spec: 0.66, repeat: 3 });
  const aluDim = MAT.metal('#a9aeb2', { worn: 0.5, repeat: 4 });
  const chrome = MAT.chrome({});
  const zinc = MAT.galvanized({ repeat: 3 });
  const dark = MAT.paint('#3a3d41', { steps: 2, shadowAmt: 1, spec: 0.08 });
  const deep = MAT.paint('#1b1d20', { steps: 2, shadowAmt: 1, spec: 0.04 });
  const panelPlastic = MAT.hardPlastic(warm ? '#3a4238' : '#2f3238', { repeat: 3 });
  const interiorW = MAT.paint('#eef1ee', { map: TEX.gradient({ stops: [[0, 'rgba(255,222,180,1)'], [0.45, 'rgba(246,249,250,1)'], [1, 'rgba(214,236,250,1)']] }), steps: 3, spec: 0.16, sheen: 0.04, shadowAmt: 0.72 });
  const interiorPlate = MAT.metal('#d5dad9', { worn: 0.55, repeat: 3, tint: '#fff6e6' });
  const bulb = MAT.bulb({ color: warm ? '#ffe0b4' : '#eefaff' });
  const screwM = MAT.stainless({ worn: 0.6 });

  const screwHead = (x, y, z, face) => {
    const s = mesh(cyl(0.0062, 0.0056, 0.005, 10), screwM, { pos: [x, y, z] });
    if (face === 'z') s.rotation.x = PI / 2;
    else if (face === 'x') s.rotation.z = PI / 2;
    else if (face === 'xn') s.rotation.z = -PI / 2;
    return noOut(s);
  };
  /** 板金打ち痕（当跡）：塗膜の盛り上がりと周围のひび。+Z（局部）を外側として配置する */
  const crumple = (x, y, z, ax, sgn, sc = 1, name = 'crumple') => {
    const c = grp(name, { pos: [x, y, z] });
    if (ax === 'x') c.rotation.y = (sgn > 0 ? PI / 2 : -PI / 2);
    else if (ax === 'z') c.rotation.y = (sgn > 0 ? 0 : PI);
    else c.rotation.x = (sgn > 0 ? PI / 2 : -PI / 2);
    const dents = MAT.plastic(color, {
      map: TEX.metal({ base: color, worn: 0.8, repeat: 2 }).map, side: DoubleSide,
      spec: 0.34, specPower: 62, shadowAmt: 0.72, steps: 3, tint: '#ffedcc', sat: 0.98,
    });
    const crack = MAT.paint('#6b4a34', { spec: 0.10, steps: 2, shadowAmt: 1 });
    const patt = [[0, 0, 0.058, 0.34], [0.046, 0.030, 0.034, 0.26], [-0.04, -0.024, 0.028, 0.22], [0.014, -0.046, 0.024, 0.30]];
    for (let i = 0; i < patt.length; i++) {
      const [dx, dy, r, k] = patt[i];
      c.add(mesh(sph(r, 12, 8, 0, PI * 2, 0, PI / 2.1), dents, { pos: [dx * sc, dy * sc, 0.0015], rot: [PI / 2, 0, 0], scale: [sc, k, sc] }));
    }
    c.add(noOut(mesh(tor(0.062 * sc, 0.0020), crack, { pos: [0, 0, 0.0022], scale: [sc, sc, 1] })));
    return c;
  };

  /* ================================================================ ①机体 */
  const shellG = grp('shell');
  g.add(shellG);
  // 側板／天板／底板／背板
  shellG.add(mesh(box(0.020, 1.738, D - 0.02), skin, { pos: [-HW + 0.010, 0.958, 0], name: 'skin-left' }));
  shellG.add(mesh(box(0.020, 1.738, D - 0.02), skin, { pos: [HW - 0.010, 0.958, 0], name: 'skin-right' }));
  shellG.add(mesh(box(W, 0.018, D), skinTop, { pos: [0, 1.841, 0], name: 'skin-top' }));
  shellG.add(mesh(box(W - 0.012, 0.014, D - 0.012), zinc, { pos: [0, 1.826, 0], name: 'top-lining' }));
  shellG.add(mesh(box(0.012, 0.052, D - 0.006), zinc, { pos: [0, 1.806, 0], name: 'top-flange' }));
  shellG.add(mesh(box(W - 0.014, 0.014, D - 0.016), zinc, { pos: [0, 0.096, 0], name: 'skin-bottom' }));
  shellG.add(mesh(box(W - 0.014, 1.72, 0.018), zinc, { pos: [0, 0.965, -HD + 0.009], name: 'skin-back' }));
  shellG.add(mesh(box(W - 0.030, 0.360, 0.014), zinc, { pos: [0, 1.640, -HD + 0.030], name: 'upper-back-rib' }));
  // 前面上部（枠と灯箱のあいだのヘッダ）／コンソール背面埋め
  shellG.add(mesh(box(0.684, 0.050, 0.020), skin, { pos: [(-0.56 + 0.124) / 2, 1.466, 0.352], name: 'header-plate' }));
  shellG.add(mesh(box(0.428, 1.16, 0.018), skinDark, { pos: [0.340, 0.878, 0.340], name: 'console-fill' }));
  // 受取口上の前面板（skirtFront 側で構築。ガラス後面は塞がない）
  // 前端折辺（フランジ）
  [[-0.552, WIN.y0 - 0.012, 0.014, WIN.y1 + 0.014], [0.122, WIN.y0 - 0.012, 0.012, WIN.y1 + 0.014]].forEach(([x, y0, w, y1], i) => {
    shellG.add(mesh(box(w, y1 - y0, 0.024), skin, { pos: [x, (y0 + y1) / 2, 0.370], name: 'front-fold' + i }));
  });

  // スカート（下部）＋受け取り口まわりの面板
  const skirt = grp('skirt', { pos: [0, 0, 0] });
  shellG.add(skirt);
  skirt.add(mesh(box(W - 0.004, 0.043, D - 0.010), skinDark, { pos: [0, 0.0665, 0], name: 'skirt' }));
  skirt.add(mesh(box(W, 0.012, 0.020), aluDim, { pos: [0, 0.088, HD - 0.004], name: 'skirt-trim' }));
  const skirtFront = (w, h, x, y) => skirt.add(mesh(box(w, h, 0.020), skin, { pos: [x, y, 0.352] }));
  skirtFront(0.048, 0.220, -0.536, 0.194);
  skirtFront(0.220, 0.220, 0.014, 0.194);
  skirtFront(0.428, 0.214, 0.340, 0.195);
  skirtFront(0.414, 0.026, -0.302, 0.099);
  skirtFront(0.414, 0.018, -0.302, 0.289);
  // 底部の泥跳ね・錆・ドレン水跡・掉漆
  weather(skirt, { w: 0.42, h: 0.10, pos: [-0.24, 0.075, HD + 0.0015], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 3, density: 1.5, spread: 0.008 });
  weather(skirt, { w: 0.36, h: 0.09, pos: [0.30, 0.072, HD + 0.0015], kind: 'dirt', color: '#5d5348', opacity: 0.5, seed: seed + 4, density: 1.7, spread: 0.008 });
  weather(skirt, { w: 0.30, h: 0.14, pos: [-0.36, 0.14, 0.3665], kind: 'chip', color: '#8f7f6a', opacity: 0.45, seed: seed + 5, density: 1.4, spread: 0.008 });
  decal(skirt, { map: TEX.wear({ kind: 'dirt', color: '#6b6153', seed: seed + 6, density: 1.2 }), w: 0.24, h: 0.20, pos: [-0.3, 0.16, 0.3660], opacity: 0.35 });
  // 落ち葉貼り付き跡
  decal(skirt, { map: TEX.wear({ kind: 'chip', color: '#94804f', seed: seed + 7, density: 0.7 }), w: 0.16, h: 0.09, pos: [0.22, 0.20, 0.3660], opacity: 0.4, rot: [0, 0, 6 * D2R] });

  // 折辺・溶接シーム・リベット列
  const seamG = grp('seams');
  shellG.add(seamG);
  seamG.add(mesh(box(0.014, 1.36, 0.014), skinDark, { pos: [-HW + 0.006, 0.78, -0.18] }));
  seamG.add(mesh(box(0.014, 1.36, 0.014), skinDark, { pos: [HW - 0.006, 0.78, -0.18] }));
  row(seamG, 13, 0.088, (i, x) => screwHead(x, Y_BODY_T - 0.030, -HD - 0.0005, 'z'), { x0: -0.528 });
  row(seamG, 9, 0.078, (i, x) => screwHead(x, 0.118, -HD - 0.0005, 'z'), { x0: -HW + 0.10 });
  for (let i = 0; i < 8; i++) seamG.add(screwHead(HW + 0.0005, 0.20 + i * 0.17, -0.3 + i * 0.02, 'x'));
  for (let i = 0; i < 8; i++) seamG.add(screwHead(-HW - 0.0005, 0.20 + i * 0.17, -0.3 + i * 0.02, 'xn'));
  // 溶接ビード（背面部）
  seamG.add(mesh(rbox(0.90, 0.010, 0.010, 0.004), MAT.metal('#97816e', { spec: 0.4, worn: 0.8 }), { pos: [0, 0.125, -HD], name: 'weld-seam-b' }));
  seamG.add(mesh(rbox(0.90, 0.008, 0.008, 0.003), MAT.metal('#8d7a68', { spec: 0.35, worn: 0.9 }), { pos: [0, 1.455, -HD], name: 'weld-seam-t' }));

  // 側面 採気ルーバー＋へこみ（当跡）
  [-1, 1].forEach((sgn) => {
    const side = grp('side' + (sgn < 0 ? '-L' : '-R'));
    shellG.add(side);
    for (let i = 0; i < 6; i++) {
      side.add(mesh(box(0.012, 0.014, 0.130), dark, { pos: [sgn * (HW - 0.004), 1.30 - i * 0.024, -0.16], rot: [0, 0, sgn * 14 * D2R] }));
    }
    for (let i = 0; i < 5; i++) side.add(screwHead(sgn * (HW + 0.0005), 1.36, -0.24 + i * 0.055, sgn > 0 ? 'x' : 'xn'));
    // panel seam（側面の溶接筋）
    side.add(mesh(box(0.008, 1.30, 0.012), skinDark, { pos: [sgn * (HW + 0.001), 0.80, -0.02] }));
    side.add(crumple(sgn * (HW + 0.002), 0.62, 0.06, 'x', sgn, 1.0, 'dent-side' + sgn));
    side.add(crumple(sgn * (HW + 0.002), 1.16, -0.2, 'x', sgn, 0.62, 'dent-side2' + sgn));
    weather(side, { w: 0.16, h: 0.16, pos: [sgn * (HW + 0.006), 0.62, 0.06], rot: [0, sgn * PI / 2, 0], kind: 'chip', color: '#8b6f57', opacity: 0.55, seed: seed + 10 + (sgn > 0 ? 1 : 0), density: 1.3, spread: 0.006 });
    weather(side, { w: 0.28, h: 0.20, pos: [sgn * (HW + 0.010), 0.20, -0.1], rot: [0, sgn * PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.34, seed: seed + 11, density: 1.0, spread: 0.006 });
  });
  // 前面右下のぶつかり痕
  shellG.add(crumple(0.34, 0.170, 0.3635, 'z', 1, 0.85, 'dent-front'));

  // 天板の埃・鳥フン
  weather(shellG, { w: 0.5, h: 0.4, pos: [-0.16, 1.8545, -0.02], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8171', opacity: 0.5, seed: seed + 12, density: 1.6, spread: 0.006 });
  weather(shellG, { w: 0.34, h: 0.26, pos: [0.24, 1.8550, 0.10], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#e9e3d5', opacity: 0.55, seed: seed + 13, density: 0.5, count: 2, spread: 0.006 });
  decal(shellG, { map: TEX.wear({ kind: 'dirt', color: '#f2ece0', seed: seed + 14, density: 0.35 }), w: 0.30, h: 0.22, pos: [-0.3, 1.8552, 0.16], rot: [-PI / 2, 0, 0.4], opacity: 0.6 });

  /* ================================================================ ②サイン灯箱 */
  const signG = grp('signbox');
  signG.userData.breathe = { speed: 0.5, amount: 0.08, phase: (seed % 7) / 3 };
  g.add(signG);
  signG.add(mesh(box(1.142, 0.320, 0.115), skin, { pos: [0, 1.630, 0.330], name: 'sign-housing' }));
  signG.add(mesh(box(1.146, 0.014, 0.118), aluDim, { pos: [0, 1.794, 0.330], name: 'sign-crown' }));
  signG.add(mesh(box(1.146, 0.016, 0.020), alu, { pos: [0, 1.462, 0.376], name: 'sign-visor' }));
  // 発光 FACE（褪色・内側ムラ）
  signG.add(mesh(box(1.088, 0.242, 0.016), dark, { pos: [0, 1.644, 0.380], name: 'sign-frame-inner' }));
  signG.add(noOut(mesh(plane(1.058, 0.214), MAT.lampShade({
    map: TEX.signboard({ text: warm ? 'あったか' : 'つめたい', sub: warm ? 'HOT COFFEE & TEA' : 'COLD DRINKS 24H', bg: warm ? '#fdf2e0' : '#eef7fb', fg: warm ? '#a2432c' : color, stripe: accent, size: 132, spacing: 0 }),
    color: '#ffffff', emissive: warm ? '#ffd9a8' : '#eaf6ff', emissiveIntensity: 0.42,
  }), { pos: [0, 1.644, 0.3965], name: 'sign-face' })));
  // 内側のムラ（点灯ムラを褪色デカールで）
  decal(signG, { map: TEX.wear({ kind: 'dirt', color: '#b8a68a', seed: seed + 16, density: 0.8 }), w: 0.9, h: 0.19, pos: [-0.08, 1.648, 0.4045], opacity: 0.22 });
  weather(signG, { w: 0.5, h: 0.06, pos: [0.26, 1.780, 0.3925], kind: 'chip', color: '#c9bda8', opacity: 0.5, seed: seed + 17, density: 1.6, spread: 0.006 });
  // 枠の褪色
  weather(signG, { w: 0.62, h: 0.030, pos: [-0.16, 1.466, 0.3885], kind: 'chip', color: '#8f8474', opacity: 0.42, seed: seed + 18, density: 1.3, spread: 0.006 });
  // 上面「つめたい／あたたかい」区分
  const tone = (t, bg, fg) => MAT.lampShade({ map: TEX.signboard({ text: t, bg, fg, size: 112, spacing: 0 }), color: '#ffffff', emissive: bg, emissiveIntensity: 0.30 });
  signG.add(mesh(box(0.262, 0.062, 0.016), tone(warm ? 'あたたか' : 'つめたい', warm ? '#f6d7cf' : '#dbeeff', warm ? '#a8382a' : '#1f5b8a'), { pos: [-0.28, 1.506, 0.384] }));
  signG.add(mesh(box(0.262, 0.062, 0.016), tone(warm ? 'つめたい' : 'あたたか', warm ? '#dbeeff' : '#f6d7cf', warm ? '#1f5b8a' : '#a8382a'), { pos: [0.280, 1.506, 0.384] }));
  signG.add(mesh(box(0.016, 0.076, 0.018), alu, { pos: [0, 1.506, 0.388] }));
  // 灯箱ネジ
  row(signG, 4, 0.30, (i, x) => screwHead(x, 1.780, 0.390, 'z'), { x0: -0.45 });

  /* ================================================================ ③庫内 */
  const cabG = grp('cabinet-inside');
  g.add(cabG);
  const CW = CAB.x1 - CAB.x0, CCX = (CAB.x0 + CAB.x1) / 2;
  const CDp = CAB.z1 - CAB.z0, CCZ = (CAB.z0 + CAB.z1) / 2;
  const CH = CAB.y1 - CAB.y0, CCY = (CAB.y0 + CAB.y1) / 2;
  cabG.add(noOut(mesh(box(CW, CH, 0.016), interiorW, { pos: [CCX, CCY, CAB.z0 + 0.008], name: 'in-back' })));
  cabG.add(noOut(mesh(box(0.016, CH, CDp), interiorPlate, { pos: [CAB.x0 + 0.008, CCY, CCZ], name: 'in-left' })));
  cabG.add(noOut(mesh(box(0.016, CH, CDp), interiorPlate, { pos: [CAB.x1 - 0.008, CCY, CCZ], name: 'in-right' })));
  cabG.add(noOut(mesh(box(CW, 0.018, CDp), interiorW, { pos: [CCX, CAB.y1 - 0.009, CCZ], name: 'in-ceiling' })));
  cabG.add(noOut(mesh(box(CW, 0.018, CDp + 0.02), interiorPlate, { pos: [CCX, CAB.y0 + 0.009, CCZ - 0.01], name: 'in-floor' })));
  // 背面部の縦リブ（庫内構造物＝見え方対策）
  for (let i = 0; i < 8; i++) {
    cabG.add(noOut(mesh(box(0.016, CH - 0.03, 0.016), interiorPlate, { pos: [CAB.x0 + 0.045 + i * 0.086, CCY, CAB.z0 + 0.024] })));
  }
  // 庫内天井の配線・小物
  cabG.add(noOut(mesh(box(0.10, 0.05, 0.24), MAT.plastic('#4b4f52', { steps: 2 }), { pos: [CAB.x1 - 0.08, CAB.y1 - 0.05, CAB.z0 + 0.15] })));
  cabG.add(noOut(mesh(cyl(0.012, 0.012, 0.42, 10), MAT.plastic('#5b5f62'), { pos: [CCX + 0.06, CAB.y1 - 0.032, CAB.z0 + 0.06], rot: [0, 0, PI / 2] })));

  /* ---- 棚（5 段） ---- */
  const shelfG = grp('shelves');
  cabG.add(shelfG);
  for (let s = 0; s < ROWS; s++) {
    const y = SHELF_Y[s];
    const lane = grp('shelf' + s);
    shelfG.add(lane);
    lane.add(noOut(mesh(rbox(CW - 0.010, 0.014, CDp - 0.010, 0.004), MAT.metal('#d9ddda', { worn: 0.4, repeat: 4, tint: '#fff6ea' }), { pos: [CCX, y - 0.007, CCZ - 0.01], name: 'plate' })));
    lane.add(noOut(mesh(box(CW - 0.006, 0.030, 0.012), MAT.plastic(accent, { spec: 0.36, steps: 3, sat: 1.02 }), { pos: [CCX, y - 0.022, 0.292], name: 'lip' })));
    // 棚前ワイヤーバー＋支持柱
    lane.add(noOut(mesh(cyl(0.0034, 0.0034, CW - 0.016, 8), alu, { pos: [CCX, y + 0.030, 0.288], rot: [0, 0, PI / 2] })));
    [-0.532, 0.102].forEach((px) => lane.add(noOut(mesh(cyl(0.0040, 0.0040, 0.046, 8), alu, { pos: [px, y + 0.014, 0.288] }))));
    // 列間仕切
    [-0.326, -0.104].forEach((dx) => lane.add(noOut(mesh(box(0.006, 0.198, 0.236), MAT.plastic('#e3e7e4', { spec: 0.3, sat: 0.9, tint: '#f8f4ea' }), { pos: [dx, y + 0.092, 0.188] }))));
    // 庫内灯（棚下 LED 管）
    if (s > 0) lane.add(noOut(mesh(cyl(0.0058, 0.0058, CW - 0.030, 10), bulb, { pos: [CCX, y - 0.024, 0.258], rot: [0, 0, PI / 2] })));
  }
  cabG.add(noOut(mesh(cyl(0.0058, 0.0058, CW - 0.030, 10), bulb, { pos: [CCX, CAB.y1 - 0.026, 0.256], rot: [0, 0, PI / 2] })));   // 天井灯管
  cabG.add(noOut(mesh(box(0.014, CH - 0.06, 0.020), bulb, { pos: [CAB.x0 + 0.022, CCY, 0.240] })));                              // 側面灯（帯）
  cabG.add(noOut(mesh(box(0.014, CH - 0.06, 0.020), bulb, { pos: [CAB.x1 - 0.022, CCY, 0.240] })));

  /* ---- 商品割当（15 セル） ---- */
  const plan = [];
  {
    let k = Math.floor(rnd() * cat.length);
    for (let s = 0; s < ROWS; s++) for (let c = 0; c < COLS; c++) {
      plan.push({ s, c, e: cat[k % cat.length], soldOut: rnd() < soldOutRatio, fallen: false });
      k++;
    }
    let n = plan.reduce((a, p) => a + (p.soldOut ? 1 : 0), 0);
    for (let i = 0; i < plan.length && n < 2; i++) if (!plan[i].soldOut) { plan[i].soldOut = true; n++; }
    let f = 0;
    for (const p of plan) if (!p.soldOut && rnd() < 0.22) { p.fallen = true; f++; if (f >= 2) break; }
    if (f < 2) for (const p of plan) { if (f >= 2) break; if (!p.soldOut && !p.fallen) { p.fallen = true; f++; } }
  }
  const goodsG = grp('goods');
  cabG.add(goodsG);
  const ledCache = new Map();
  const ledMat = (txt, fg) => {
    const kk = txt + fg;
    if (!ledCache.has(kk)) ledCache.set(kk, MAT.screen({ map: TEX.lightPanel({ text: txt, bg: '#0e1013', fg, mode: 'led', spacing: 0 }), color: '#ffffff' }));
    return ledCache.get(kk);
  };
  for (const p of plan) {
    const y = SHELF_Y[p.s], cx = COL_X[p.c];
    const e = p.e;
    // 最大横方向ハーフサイズ（回転後の AABB も考慮）→ 隣接商品と決して重ならない間隔に
    const half = e.kind === 'pack' ? 0.0345 : e.kind === 'sqpet' ? 0.0385
      : e.kind === 'can' || e.kind === 'tallcan' ? (e.r || 0.032) * 1.03
        : (e.r || 0.0325) * 1.06;
    const ox = half + 0.009;
    if (p.soldOut) {
      // 空位：埃輪＋棚板の陰（商品が置かれていた跡）
      goodsG.add(noOut(mesh(box(0.200, 0.0012, 0.170), MAT.paint('#c7c4ba', { steps: 2, spec: 0.05, shadowAmt: 1 }), { pos: [cx, y + 0.0006, 0.186] })));
      for (let i = 0; i < 2; i++) {
        goodsG.add(noOut(mesh(cyl(0.030, 0.031, 0.0016, 12), MAT.paint('#b3afa4', { steps: 2, spec: 0.05, shadowAmt: 1 }), { pos: [cx + (i ? ox : -ox), y + 0.0022, Z_FRONT] })));
      }
    } else if (p.fallen) {
      // 倒れた商品（1 本だけ寝ている／奥に 1 本残る）
      const restR = e.kind === 'pack' ? 0.029 : (e.kind === 'sqpet' ? 0.031 : (e.r || 0.0325) * 1.10);
      const lie = productTemplate(e).clone();
      lie.rotation.set(0, 0, -PI / 2);
      lie.position.set(cx - e.h * 0.5, y + restR, 0.200);
      goodsG.add(lie);
      placeProduct(goodsG, e, cx, y, 0.086, range(rnd, -0.16, 0.16));
    } else {
      const yawJ = () => range(rnd, e.kind === 'pack' || e.kind === 'sqpet' ? -0.05 : -0.1, e.kind === 'pack' || e.kind === 'sqpet' ? 0.05 : 0.10);
      placeProduct(goodsG, e, cx - ox, y, Z_FRONT, yawJ());
      placeProduct(goodsG, e, cx + ox, y, Z_FRONT, yawJ());
      if (rnd() < 0.85) placeProduct(goodsG, e, cx - ox, y, Z_BACK, yawJ() + PI);
      if (e.kind === 'can' || e.kind === 'tallcan' || e.kind === 'pack') placeProduct(goodsG, e, cx + ox, y, Z_BACK, yawJ() + PI * 0.9);
    }
    /* 価格札（LED 風）＋棚札台 */
    const tagW = 0.062, tagH = 0.030;
    const label = p.soldOut ? '売切' : '¥' + e.price;
    goodsG.add(noOut(mesh(box(tagW, tagH, 0.010), MAT.plastic('#141719', { spec: 0.2, steps: 2 }), { pos: [cx, y - 0.022, 0.300] })));
    goodsG.add(noOut(mesh(plane(tagW - 0.008, tagH - 0.009), ledMat(label, p.soldOut ? '#ff6a5c' : (warm ? '#ffcf7a' : '#ffe08a')), { pos: [cx, y - 0.022, 0.308] })));
    goodsG.add(noOut(mesh(box(tagW + 0.010, 0.006, 0.016), MAT.plastic('#8b9096', { spec: 0.3 }), { pos: [cx, y - 0.006, 0.298] })));
  }

  /* ================================================================ ④ガラス扉 */
  const doorStatic = grp('door-frame');
  g.add(doorStatic);
  const fw = 0.026;
  const frameBar = (w, h, x, y) => mesh(rbox(w, h, 0.032, 0.005), alu, { pos: [x, y, 0.374], name: 'alu-frame' });
  doorStatic.add(frameBar(fw, WIN.y1 - WIN.y0 + fw * 2, WIN.x0 - fw / 2, (WIN.y0 + WIN.y1) / 2));
  doorStatic.add(frameBar(fw, WIN.y1 - WIN.y0 + fw * 2, WIN.x1 + fw / 2, (WIN.y0 + WIN.y1) / 2));
  doorStatic.add(frameBar(WIN.x1 - WIN.x0 + fw * 2, fw, (WIN.x0 + WIN.x1) / 2, WIN.y1 + fw / 2));
  doorStatic.add(frameBar(WIN.x1 - WIN.x0 + fw * 2, fw, (WIN.x0 + WIN.x1) / 2, WIN.y0 - fw / 2));
  // パッキン（劣化＝ところどころ縮み）
  const gasket = MAT.rubber(warm ? '#39332c' : '#33373c');
  [[0.018, 1.146, WIN.x0 + 0.009, 0.876], [0.018, 1.146, WIN.x1 - 0.009, 0.876], [0.612, 0.018, -0.215, WIN.y1 - 0.009], [0.612, 0.018, -0.215, WIN.y0 + 0.009]].forEach(([w, h, x, y], i) => {
    const gg = mesh(box(w, h, 0.014), i === 2 ? MAT.rubber('#4a4239', { spec: 0.03 }) : gasket, { pos: [x, y, 0.352] });
    doorStatic.add(gg);
  });
  // ドアストッパ・上部ドアカバリ
  doorStatic.add(mesh(box(0.024, 0.048, 0.020), zinc, { pos: [WIN.x1 + 0.020, 1.420, 0.352] }));
  doorStatic.add(mesh(box(0.020, 0.030, 0.030), zinc, { pos: [WIN.x0 - 0.020, 0.330, 0.348] }));

  const doorG = grp('door', { pos: [PIVOT_X, 0, PIVOT_Z] });
  g.add(doorG);
  doorG.rotation.y = -doorOpen * D2R;
  // アルミアングル（框）
  const dBar = (w, h, x, y) => mesh(rbox(w, h, 0.026, 0.004), alu, { pos: [x, y, 0] });
  doorG.add(dBar(0.024, 1.140, 0.012, 0.876));
  doorG.add(dBar(0.024, 1.140, 0.606, 0.876));
  doorG.add(dBar(0.618, 0.024, 0.309, 1.434));
  doorG.add(dBar(0.618, 0.024, 0.309, 0.318));
  // ガラスの緑辺り（実体バー＝屈折バッファに入るよう不透明）
  const greenEdge = MAT.plastic('#a7d8c6', { spec: 0.62, specPower: 130, sheen: 0.22, sat: 1.06, tint: '#f0fffb' });
  doorG.add(noOut(mesh(box(0.010, 1.080, 0.016), greenEdge, { pos: [0.029, 0.876, 0] })));
  doorG.add(noOut(mesh(box(0.010, 1.080, 0.016), greenEdge, { pos: [0.589, 0.876, 0] })));
  doorG.add(noOut(mesh(box(0.560, 0.010, 0.016), greenEdge, { pos: [0.309, 1.411, 0] })));
  doorG.add(noOut(mesh(box(0.560, 0.010, 0.016), greenEdge, { pos: [0.309, 0.341, 0] })));
  // 強化ガラス（実折射）
  const glass = mesh(box(0.570, 1.080, 0.012), MAT.glass({ thickness: 0.012, color: '#dceef2' }), { pos: [0.309, 0.876, 0], name: 'door-glass', cast: false });
  glass.userData.noOutline = true;
  doorG.add(glass);
  // 内側：棚板の写り込みを殺す小棚／吊り下げプライスレール
  doorG.add(noOut(mesh(box(0.560, 0.014, 0.006), MAT.plastic('#d9dedb', { spec: 0.3 }), { pos: [0.309, 1.400, -0.014] })));
  // ヒンジ（3 箇所）＋ピン
  [0.420, 0.876, 1.330].forEach((hy) => {
    doorG.add(mesh(box(0.020, 0.056, 0.030), zinc, { pos: [0.004, hy, 0.002] }));
    doorG.add(mesh(cyl(0.0042, 0.0042, 0.074, 8), chrome, { pos: [0.010, hy, 0.010] }));
  });
  // ロック金具・ハンドル
  doorG.add(mesh(box(0.028, 0.084, 0.022), zinc, { pos: [0.584, 0.660, 0.006] }));
  doorG.add(mesh(cyl(0.0110, 0.0110, 0.010, 12), chrome, { pos: [0.596, 0.660, 0.006], rot: [0, 0, PI / 2] }));
  doorG.add(mesh(cyl(0.0106, 0.0106, 0.014, 12), MAT.plastic('#1c1e21', { steps: 2 }), { pos: [0.594, 0.660, 0.006], rot: [0, 0, PI / 2] }));
  doorG.add(mesh(box(0.020, 0.014, 0.010), chrome, { pos: [0.596, 0.640, 0.006] }));
  doorG.add(mesh(rbox(0.022, 0.210, 0.024, 0.008), MAT.hardPlastic('#b7bcc0', { repeat: 2 }), { pos: [0.600, 0.876, 0.008], name: 'handle' }));
  doorG.add(mesh(box(0.014, 0.190, 0.010), alu, { pos: [0.588, 0.876, -4e-3] }));
  // 表面の経年：指紋・拭き跡・飛石キズ・結露（すべて外側面＝ガラス手前）
  const gz = 0.0075;
  decal(doorG, { map: TEX.wear({ kind: 'scratch', color: '#e8f4f2', seed: seed + 20, density: 0.9 }), w: 0.22, h: 0.16, pos: [0.160, 0.660, gz + 0.0005], opacity: 0.20, rot: [0, 0, -8 * D2R], order: 1 });
  decal(doorG, { map: TEX.wear({ kind: 'scratch', color: '#f0f7f4', seed: seed + 21, density: 1.6 }), w: 0.30, h: 0.20, pos: [0.440, 1.040, gz + 0.0006], opacity: 0.16, rot: [0, 0, 14 * D2R], order: 2 });
  decal(doorG, { map: TEX.wear({ kind: 'scratch', color: '#dff0ee', seed: seed + 22, density: 0.5 }), w: 0.10, h: 0.05, pos: [0.300, 0.470, gz + 0.0004], opacity: 0.30, rot: [0, 0, 34 * D2R], order: 3 });
  decal(doorG, { map: TEX.wear({ kind: 'chip', color: '#c8d8d6', seed: seed + 23, density: 0.35 }), w: 0.05, h: 0.05, pos: [0.520, 0.400, gz + 0.0007], opacity: 0.40, order: 4 });
  decal(doorG, { map: TEX.frost().map, w: 0.52, h: 0.20, pos: [0.309, 0.430, gz + 0.0008], opacity: 0.26, color: '#e6f5f6', order: 5 });
  decal(doorG, { map: TEX.frost().map, w: 0.34, h: 0.12, pos: [0.180, 1.300, gz + 0.0009], opacity: 0.16, color: '#eef8f8', order: 6 });
  // 扉の下桟に「押してね」風プレートの残骸
  weather(doorG, { w: 0.16, h: 0.05, pos: [0.36, 0.336, 0.014], kind: 'chip', color: '#e8dfc9', opacity: 0.6, seed: seed + 24, density: 1.1, spread: 0.01 });

  /* ================================================================ ⑤選購パネル */
  const conG = grp('console');
  g.add(conG);
  conG.add(mesh(box(0.420, 1.148, 0.022), panelPlastic, { pos: [0.338, 0.876, 0.372], name: 'console-plate' }));
  conG.add(mesh(box(0.432, 0.014, 0.026), alu, { pos: [0.338, 1.456, 0.372] }));
  conG.add(mesh(box(0.432, 0.014, 0.026), alu, { pos: [0.338, 0.296, 0.372] }));
  // 見出し
  conG.add(noOut(mesh(plane(0.208, 0.052), MAT.screen({ map: TEX.signboard({ text: warm ? 'あったか' : 'つめたい', sub: '24H', bg: '#1b1f24', fg: warm ? '#ffb27a' : '#8fd8ff', size: 118, spacing: 0 }) }), { pos: [0.300, 1.418, 0.3845] })));
  // 金額表示
  conG.add(mesh(box(0.206, 0.070, 0.016), MAT.plastic('#0f1215', { spec: 0.35, steps: 2 }), { pos: [0.338, 1.352, 0.378] }));
  conG.add(noOut(mesh(plane(0.192, 0.056), MAT.screen({ map: TEX.lightPanel({ text: String(100 + ((seed * 17) % 7) * 10) + '円', bg: '#0c0e10', fg: '#ffd06a', mode: 'led', spacing: 0 }) }), { pos: [0.338, 1.352, 0.3875] })));
  // ボタン 5×3
  const btnMat = MAT.hardPlastic(warm ? '#4b3f36' : '#40454b', { repeat: 2 });
  const btnLed = [PAL.storeBand3, '#5fbf72'];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const bx = 0.212 + c * 0.126, by = 1.240 - r * 0.100;
      const on = rnd() < 0.62;
      const no = r * 3 + c + 1;
      const pr = cat[(r * 3 + c) % cat.length].price;
      conG.add(mesh(rbox(0.050, 0.032, 0.014, 0.005), btnMat, { pos: [bx, by, 0.388] }));
      conG.add(noOut(mesh(cyl(0.0056, 0.0056, 0.008, 10), on ? MAT.ledOn(btnLed[r % 2], {}) : MAT.ledOff('#2b2f33'), { pos: [bx, by + 0.028, 0.388], rot: [PI / 2, 0, 0] })));
      conG.add(noOut(mesh(plane(0.048, 0.012), MAT.screen({ map: TEX.signboard({ text: no + ' ' + pr, bg: '#12151a', fg: on ? '#ffe08a' : '#7d848c', size: 150, spacing: 0 }) }), { pos: [bx, by - 0.033, 0.3862] })));
    }
  }
  // ボタン周りのテカリ・文字消え
  weather(conG, { w: 0.24, h: 0.14, pos: [0.338, 1.10, 0.3885], kind: 'scratch', color: '#cbd2d8', opacity: 0.22, seed: seed + 26, density: 1.6, spread: 0.006 });
  decal(conG, { map: TEX.wear({ kind: 'chip', color: '#20242a', seed: seed + 27, density: 1.8 }), w: 0.24, h: 0.13, pos: [0.30, 1.20, 0.3868], opacity: 0.34 });
  // IC / QR 読み取り
  conG.add(mesh(box(0.150, 0.150, 0.018), MAT.hardPlastic('#22262b', { repeat: 2 }), { pos: [0.232, 0.730, 0.380], rot: [-6 * D2R, 0, 0] }));
  conG.add(noOut(mesh(plane(0.112, 0.056), MAT.screen({ map: TEX.lightPanel({ text: '交通系', bg: '#0d1a22', fg: '#7fe8c0', mode: 'led', spacing: 0 }) }), { pos: [0.232, 0.770, 0.3905], rot: [-6 * D2R, 0, 0] })));
  {
    const qrG = grp('qr', { pos: [0.232, 0.700, 0.3925], rot: [-6 * D2R, 0, 0] });
    conG.add(qrG);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      if (rnd() < 0.45) continue;
      qrG.add(noOut(mesh(box(0.0085, 0.0085, 0.0016), MAT.plastic('#e9f6f2', { steps: 2, shadowAmt: 0.4 }), { pos: [-0.019 + i * 0.0095, 0.019 - j * 0.0095, 0.0012] })));
    }
  }
  // 硬貨投入口
  conG.add(mesh(box(0.120, 0.112, 0.016), zinc, { pos: [0.446, 0.738, 0.380] }));
  conG.add(mesh(box(0.062, 0.006, 0.014), deep, { pos: [0.446, 0.762, 0.389] }));
  conG.add(mesh(box(0.056, 0.020, 0.012), deep, { pos: [0.446, 0.712, 0.388] }));
  conG.add(noOut(mesh(plane(0.100, 0.050), MAT.screen({ map: TEX.signboard({ text: '500円', bg: '#dfe4e6', fg: '#2c3238', size: 130, spacing: 0 }), color: '#ffffff' }), { pos: [0.446, 0.796, 0.3895] })));
  // お釣り出口
  conG.add(mesh(box(0.120, 0.070, 0.016), MAT.plastic('#1e2226', { steps: 2 }), { pos: [0.232, 0.560, 0.366] }));
  conG.add(noOut(mesh(box(0.104, 0.052, 0.010), deep, { pos: [0.232, 0.558, 0.360] })));
  conG.add(mesh(rbox(0.112, 0.056, 0.008, 0.004), MAT.hardPlastic('#4a4f55', { repeat: 2 }), { pos: [0.232, 0.556, 0.378], rot: [12 * D2R, 0, 0] }));
  // 数量／釣銭 表示
  conG.add(mesh(box(0.090, 0.040, 0.014), MAT.plastic('#101317', { steps: 2 }), { pos: [0.446, 0.560, 0.378] }));
  conG.add(noOut(mesh(plane(0.080, 0.030), MAT.screen({ map: TEX.lightPanel({ text: '×1', bg: '#0b0d0f', fg: '#ff9f6a', mode: 'led', spacing: 0 }) }), { pos: [0.446, 0.560, 0.3865] })));
  // 注意事項プレートの色褪せ
  conG.add(mesh(box(0.330, 0.084, 0.010), MAT.paper({ color: '#efe7d6' }), { pos: [0.338, 0.400, 0.380] }));
  decal(conG, { map: TEX.signboard({ text: 'お取扱 24 時間', sub: '不良品は店頭にて', bg: '#efe7d6', fg: '#6b6355', size: 108, spacing: 0 }), w: 0.310, h: 0.078, pos: [0.338, 0.400, 0.3868], opacity: 0.92 });
  weather(conG, { w: 0.20, h: 0.05, pos: [0.28, 0.396, 0.3875], kind: 'dirt', color: '#8b7f66', opacity: 0.4, seed: seed + 29, density: 1.3, spread: 0.005 });
  conG.add(screwHead(0.146, 1.440, 0.384, 'z'));
  conG.add(screwHead(0.530, 1.440, 0.384, 'z'));
  conG.add(screwHead(0.146, 0.312, 0.384, 'z'));
  conG.add(screwHead(0.530, 0.312, 0.384, 'z'));

  /* ================================================================ ⑥受け取り口 */
  const pkG = grp('pickup');
  g.add(pkG);
  // 暗所（内箱）
  const innerBox = grp('chute');
  pkG.add(innerBox);
  innerBox.add(noOut(mesh(box(PKU.x1 - PKU.x0 - 0.010, 0.168, 0.014), deep, { pos: [-0.303, 0.198, -0.06] })));
  innerBox.add(noOut(mesh(box(0.012, 0.168, 0.350), deep, { pos: [PKU.x0 + 0.006, 0.198, 0.110] })));
  innerBox.add(noOut(mesh(box(0.012, 0.168, 0.350), deep, { pos: [PKU.x1 - 0.006, 0.198, 0.110] })));
  innerBox.add(noOut(mesh(box(PKU.x1 - PKU.x0, 0.012, 0.350), MAT.paint('#2a2c2e', { steps: 2, shadowAmt: 1, map: TEX.metal({ base: '#3a3d40', worn: 1, repeat: 3 }).map }), { pos: [-0.303, 0.114, 0.110] })));
  innerBox.add(noOut(mesh(box(PKU.x1 - PKU.x0, 0.012, 0.350), deep, { pos: [-0.303, 0.282, 0.110] })));
  // 盗難防止バー
  innerBox.add(noOut(mesh(cyl(0.0055, 0.0055, 0.402, 8), chrome, { pos: [-0.303, 0.244, 0.086], rot: [0, 0, PI / 2] })));
  [-0.498, -0.108].forEach((px) => innerBox.add(noOut(mesh(cyl(0.0060, 0.0060, 0.040, 8), chrome, { pos: [px, 0.244, 0.086], rot: [PI / 2, 0, 0] }))));
  // 中の埃・落ち葉・砂
  innerBox.add(noOut(mesh(box(0.30, 0.004, 0.10), MAT.paint('#8b8071', { steps: 2, spec: 0.05, shadowAmt: 1, map: TEX.concrete({ base: '#8b8071', repeat: 3 }).map }), { pos: [-0.32, 0.122, 0.180] })));
  const leafMat = MAT.leaf({ map: TEX.leafCluster({ base: '#a8875f', seed: seed + 31 }), alphaMap: TEX.leafCluster({ base: '#a8875f', seed: seed + 31 }), alphaTest: 0.4, color: '#b09166' });
  pkG.add(noOut(mesh(plane(0.07, 0.07), leafMat, { pos: [-0.36, 0.126, 0.190], rot: [-78 * D2R, 0.4, 0.6] })));
  // フラップ（開いた状態）＋パッキン劣化
  pkG.add(mesh(box(PKU.x1 - PKU.x0 + 0.030, 0.014, 0.024), alu, { pos: [-0.303, PKU.y1 + 0.010, 0.352], name: 'flap-hinge' }));
  const flapG = grp('flap', { pos: [-0.303, PKU.y1 + 0.004, 0.354] });
  pkG.add(flapG);
  flapG.rotation.x = 13 * D2R;
  flapG.add(mesh(rbox(PKU.x1 - PKU.x0 - 0.006, 0.164, 0.012, 0.004), MAT.hardPlastic(warm ? '#3b4a3e' : '#3b3f45', { repeat: 2 }), { pos: [0, -0.086, 0.004], name: 'flap' }));
  flapG.add(noOut(mesh(plane(0.200, 0.050), MAT.screen({ map: TEX.signboard({ text: 'おとりだし', sub: 'PUSH', bg: '#2a2e33', fg: '#ffd88a', size: 118, spacing: 0 }) }), { pos: [0, -0.1, 0.0125] })));
  flapG.add(mesh(box(PKU.x1 - PKU.x0 - 0.020, 0.010, 0.010), MAT.rubber('#54473a', { spec: 0.03 }), { pos: [0, -0.166, 0.002] }));
  pkG.add(mesh(box(PKU.x1 - PKU.x0 + 0.020, 0.012, 0.022), zinc, { pos: [-0.303, PKU.y0 - 0.008, 0.348] }));
  weather(pkG, { w: 0.24, h: 0.06, pos: [-0.3, 0.100, 0.3665], kind: 'scratch', color: '#c9c2b4', opacity: 0.4, seed: seed + 33, density: 2.2, spread: 0.005 });
  weather(pkG, { w: 0.14, h: 0.10, pos: [-0.536, 0.200, 0.3665], kind: 'chip', color: '#8a5236', opacity: 0.45, seed: seed + 34, density: 1.4, spread: 0.005 });

  /* ================================================================ ⑦背面 */
  const backG = grp('back');
  g.add(backG);
  // 放熱グリル
  const grG = grp('grille', { pos: [-0.2, 0.42, -HD - 0.006] });
  backG.add(grG);
  grG.add(mesh(box(0.520, 0.340, 0.014), zinc, { pos: [0, 0, -4e-3] }));
  for (let i = 0; i < 11; i++) grG.add(mesh(box(0.480, 0.014, 0.016), dark, { pos: [0, -0.15 + i * 0.030, 0.006], rot: [24 * D2R, 0, 0] }));
  grill(grG, { w: 0.480, h: 0.320, nx: 5, ny: 0, bar: 0.008, mat: zinc, pos: [0, 0, 0.014] });
  // コンプレッサー膨らみ
  const compG = grp('compressor', { pos: [0.24, 0.30, -HD - 0.010] });
  backG.add(compG);
  compG.add(mesh(rbox(0.240, 0.250, 0.060, 0.018), zinc, { pos: [0, 0, -0.022], name: 'comp-box' }));
  compG.add(mesh(cyl(0.054, 0.054, 0.150, 16), MAT.darkIron({}), { pos: [0.02, 0.030, -2e-3], rot: [0, 0, PI / 2], name: 'comp-hump' }));
  compG.add(mesh(cyl(0.044, 0.048, 0.018, 14), MAT.metal('#8d8f92', { worn: 0.8 }), { pos: [-0.068, 0.030, -2e-3], rot: [0, 0, PI / 2] }));
  compG.add(mesh(box(0.060, 0.046, 0.028), MAT.plastic('#2f3336', { steps: 2 }), { pos: [-0.04, -0.088, -0.026] }));
  // 冷媒コイルと配管
  compG.add(mesh(coil(0.040, 0.150, 7, 12, 0.0055), MAT.metal('#b47a4c', { spec: 0.7, specPower: 120, worn: 0.6 }), { pos: [0.148, 0.020, -4e-3], name: 'condenser' }));
  backG.add(pipe([[-0.02, 0.16, -HD - 0.020], [-0.02, 0.52, -HD - 0.030], [0.10, 0.66, -HD - 0.026], [0.24, 0.62, -HD - 0.022]], 0.0075, MAT.metal('#c0c4c6', { spec: 0.7 }), { seg: 22 }));
  backG.add(pipe([[0.30, 0.46, -HD - 0.030], [0.32, 0.72, -HD - 0.024], [0.16, 0.86, -HD - 0.030]], 0.0060, MAT.rubber('#57504a'), { seg: 16 }));
  // 配線ダクト・電源コード・プラグ
  backG.add(mesh(box(0.050, 0.900, 0.040), MAT.hardPlastic('#c9c3b5', { repeat: 2 }), { pos: [-0.42, 0.90, -HD - 0.024] }));
  backG.add(pipe([[-0.42, 1.34, -HD - 0.040], [-0.36, 1.20, -HD - 0.056], [-0.24, 0.42, -HD - 0.052], [-0.1, 0.10, -HD - 0.044], [-0.02, 0.024, -HD - 0.038]], 0.0085, MAT.rubber('#33373b'), { seg: 26 }));
  backG.add(mesh(box(0.046, 0.030, 0.024), MAT.hardPlastic('#3b3f44', { repeat: 2 }), { pos: [-0.02, 0.016, -HD - 0.040] }));
  backG.add(mesh(box(0.020, 0.014, 0.010), MAT.metal('#b8bcbf', { worn: 0.7 }), { pos: [-0.02, 0.014, -HD - 0.055] }));
  // 点検口・ネジ列・シリアルプレート
  backG.add(mesh(box(0.360, 0.620, 0.012), zinc, { pos: [0.16, 1.06, -HD - 0.010] }));
  for (let i = 0; i < 4; i++) backG.add(screwHead(0.02 + (i % 2) * 0.28, 0.80 + Math.floor(i / 2) * 0.52, -HD - 0.018, 'z'));
  row(backG, 9, 0.085, (i, x) => screwHead(-0.36 + i * 0.085, 1.70, -HD - 0.018, 'z'), {});
  backG.add(mesh(box(0.210, 0.090, 0.008), MAT.metal('#cfd4d6', { spec: 0.6, worn: 0.4 }), { pos: [-0.28, 1.24, -HD - 0.020] }));
  decal(backG, { map: TEX.lightPanel({ bg: '#d3d8da', fg: '#333a3f', mode: 'sign', rows: [{ t: '型式 SA113G', v: 'AC100V' }, { t: '圧縮機 240W', v: '50/60Hz' }, { t: '製造 2019', v: 'No.0422' }] }), w: 0.196, h: 0.074, pos: [-0.28, 1.24, -HD - 0.0265], rot: [0, PI, 0], opacity: 0.95 });
  weather(backG, { w: 0.60, h: 0.30, pos: [0.0, 0.28, -HD - 0.006], rot: [0, PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.55, seed: seed + 36, density: 1.6, spread: 0.006 });
  weather(backG, { w: 0.50, h: 0.24, pos: [-0.2, 0.16, -HD - 0.006], rot: [0, PI, 0], kind: 'dirt', color: '#5d5348', opacity: 0.5, seed: seed + 37, density: 1.8, spread: 0.006 });

  /* ================================================================ ⑧接地 */
  const groundG = grp('grounding');
  g.add(groundG);
  groundG.add(mesh(box(1.200, 0.032, 0.860), MAT.concrete({ repeat: 2, cracked: true, base: PAL.concreteDark }), { pos: [0, 0.016, 0.045], name: 'curb-pad' }));
  groundG.add(mesh(box(1.188, 0.008, 0.848), MAT.concrete({ base: '#b0aa9f', repeat: 2 }), { pos: [0, 0.036, 0.045], name: 'curb-step' }));
  // アンカーボルト 4 本
  [[-0.47, -0.28], [-0.47, 0.30], [0.47, -0.28], [0.47, 0.30]].forEach(([ax, az]) => {
    groundG.add(mesh(cyl(0.0085, 0.0085, 0.052, 8), zinc, { pos: [ax, 0.062, az] }));
    groundG.add(mesh(cyl(0.0140, 0.0140, 0.014, 6), MAT.metal('#9ba0a3', { worn: 0.8 }), { pos: [ax, 0.088, az] }));
    groundG.add(mesh(cyl(0.0190, 0.0190, 0.006, 10), MAT.metal('#8b8f92', { worn: 1 }), { pos: [ax, 0.044, az] }));
  });
  // 油汚れ・排水跡
  weather(groundG, { w: 0.72, h: 0.42, pos: [0, 0.0455, 0.04], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#4b433a', opacity: 0.42, seed: seed + 38, density: 1.2, spread: 0.004 });
  decal(groundG, { map: TEX.wear({ kind: 'dirt', color: '#6a6152', seed: seed + 39, density: 1.4 }), w: 0.44, h: 0.22, pos: [-0.06, 0.0455, -0.12], rot: [-PI / 2, 0, 0.3], opacity: 0.42 });
  groundG.add(noOut(mesh(box(0.26, 0.004, 0.09), MAT.paint('#7f7668', { steps: 2, spec: 0.06, shadowAmt: 1 }), { pos: [0.04, 0.0425, -0.29], name: 'drain-trace' })));
  // 周囲の落ち葉
  for (let i = 0; i < 4; i++) {
    groundG.add(noOut(mesh(plane(0.075, 0.075), leafMat, { pos: [range(rnd, -0.5, 0.50), 0.0452, range(rnd, 0.02, 0.38)], rot: [-PI / 2, 0, range(rnd, 0, 6.28)] })));
  }
  // 隣に空き缶 1 本（踏まれて片側が潰れ・ラベル色褪せ）
  const canE = { key: 'litter_' + (seed % 5), kind: 'can', jp: cat[seed % cat.length].jp, sub: 'EMPTY', ml: '350ml', a: '#b9b3a6', b: '#e9e3d6', cap: '#8b8b8b', body: '#c8ccc9', h: 0.116, r: 0.033 };
  const canG = grp('litter-can', { pos: [0.516, 0.0400, 0.412], rot: [2.5 * D2R, range(rnd, 0, 6.28), -5 * D2R] });
  canG.add(productTemplate(canE).clone());
  canG.add(noOut(mesh(sph(0.017, 10, 7, 0, PI * 2, 0, PI / 2.1), MAT.plastic('#c3c7c4', { side: DoubleSide, spec: 0.4, shadowAmt: 0.95 }), { pos: [0.028, 0.062, 0.004], rot: [0, 0, -PI / 2], scale: [0.42, 1, 1] })));
  groundG.add(canG);

  /* ================================================================ ⑨灯箱・側面の最終做旧 */
  weather(shellG, { w: 0.50, h: 0.10, pos: [0.10, 1.8060, 0.300], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8171', opacity: 0.45, seed: seed + 41, density: 1.4, spread: 0.004 });
  weather(shellG, { w: 0.10, h: 0.26, pos: [HW + 0.0090, 1.630, 0.330], rot: [0, PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.40, seed: seed + 42, density: 1.2, spread: 0.004 });
  // 左側面に残る貼紙ポスター（日焼け・めくれ）
  decal(shellG, { map: TEX.signboard({ text: '春の限定', sub: 'NEW', bg: '#f6e9d2', fg: '#5a4a38', stripe: color, size: 130, spacing: 0 }), w: 0.22, h: 0.055, pos: [-HW - 0.0035, 0.95, -0.15], rot: [0, -PI / 2, 0], opacity: 0.92 });
  decal(shellG, { map: TEX.wear({ kind: 'chip', color: '#e6ddc9', seed: seed + 45, density: 0.8 }), w: 0.10, h: 0.06, pos: [-HW - 0.0040, 0.70, -0.24], rot: [0, -PI / 2, 0], opacity: 0.65 });
  // 防犯ステッカー（console 下段）＋文字消え
  decal(conG, { map: TEX.signboard({ text: '防犯カメラ', bg: '#f3f0e6', fg: '#3f4a55', size: 130, spacing: 0 }), w: 0.16, h: 0.040, pos: [0.20, 0.328, 0.3868], opacity: 0.9 });
  weather(conG, { w: 0.14, h: 0.05, pos: [0.20, 0.328, 0.3875], kind: 'chip', color: '#cfc7b4', opacity: 0.5, seed: seed + 44, density: 1.2, spread: 0.004 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
