//  assets/street/vending-machine-tea.js —— お茶／珈琲の温蔵自動販売機（第 2 形態）
//  ・原点 = 据付パッド下面中心 / +Y 上 / 正面 +Z   主尺度 1.13 × 1.85 × 0.75 m（凍結）
//  ・第 1 台（vending-machine.js）との形態差：
//      ①上部は「前傾オーバーハング斜面＋円筒クローン天板」（灯箱箱ではなく傾斜 FACE）
//      ②庫内左端に「縦长 5 段ヒーター表示タワー」（赤帯＋ヒーター球＋番号 LED）
//      ③ガラス扉は右ヒンジ・大型ツマミ錠（第 1 台は左ヒンジ・バーハンドル）
//      ④ガラスは琥珀がかった温蔵用、庫内は反射円盤＋オレンジ灯管
//      ⑤选购パネルは右縦長 2 列、下面に排気グリルと大フラップ受取口
//      ⑥色指定は PAL.vendingGreen 系＋茶系、段差付き二層ベース
//  ⚠ 庫内はすべて不透明マテリアル（ガラスの transmission バッファに載るように）
import * as THREE from 'three';
import {
  grp, mesh, box, cyl, rbox, sph, tor, plane, lathe, finish, rand, range,
  row, grill, pipe, decal, weather,
} from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'vending-machine-tea',
  real: [1.13, 1.85, 0.75],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const noOut = (o) => { o.userData.noOutline = true; return o; };

const _lathe = new Map();
function latheOf(pts, seg = 16) {
  const k = seg + '|' + pts.map((p) => p[0].toFixed(4) + ',' + p[1].toFixed(4)).join(';');
  let g = _lathe.get(k);
  if (!g) { g = lathe(pts.map(([x, y]) => [Math.max(0, x), y]), seg); _lathe.set(k, g); }
  return g;
}
const _lab = new Map();
function labelOf(e) {
  if (!_lab.has(e.key)) {
    _lab.set(e.key, MAT.paint('#ffffff', {
      map: TEX.drinkLabel({ name: e.jp, sub: e.sub, ml: e.ml, a: e.a, b: e.b }),
      steps: 3, spec: 0.30, specPower: 74, specCut: 0.18, sheen: 0.10, rim: 0.10, shadowAmt: 0.70,
    }));
  }
  return _lab.get(e.key);
}
/** ラベルは「テクスチャ」として使う（MAT を map に渡しない事！） */
function labelTex(e) { return TEX.drinkLabel({ name: e.jp, sub: e.sub, ml: e.ml, a: e.a, b: e.b }); }

/* ------------------------------------------------------------------ 品揃え（瓶・紙パック・缶珈琲中心） */
const TEA_HOT = [
  { key: 'h_cof', kind: 'bottle', jp: '焙煎珈琲', sub: 'ROAST COFFEE', ml: '190ml', a: '#7a4a2c', b: '#f4e6d0', cap: '#b8892f', body: '#4a2a12', h: 0.166, r: 0.0280, price: 130 },
  { key: 'h_au', kind: 'bottle', jp: 'カフェオーレ', sub: 'MILK COFFEE', ml: '190ml', a: '#c9a273', b: '#f8f0e0', cap: '#a5763c', body: '#d8bd94', h: 0.164, r: 0.0276, price: 130 },
  { key: 'h_tea', kind: 'bottle', jp: '檸檬紅茶', sub: 'LEMON TEA', ml: '190ml', a: '#c86a2a', b: '#fbeed4', cap: '#a54f18', body: '#d99a45', h: 0.162, r: 0.0272, price: 120 },
  { key: 'h_swk', kind: 'bottle', jp: 'すいとう', sub: 'ICE TEA', ml: '190ml', a: '#9a4a2c', b: '#f6e8d6', cap: '#7a3a1e', body: '#a4633a', h: 0.160, r: 0.0270, price: 120 },
  { key: 'h_milt', kind: 'pack', jp: 'ミルクティー', sub: 'MILK TEA', ml: '200ml', a: '#b79a72', b: '#f7f0e2', cap: '#8b6f4a', body: '#e6d7bd', h: 0.098, price: 140 },
  { key: 'h_azuki', kind: 'pack', jp: 'あずき茶', sub: 'AZUKI', ml: '200ml', a: '#8a4f3c', b: '#f4e5da', cap: '#6b3a2a', body: '#c69a80', h: 0.096, price: 120 },
  { key: 'h_ginger', kind: 'pack', jp: '生姜湯', sub: 'GINGER', ml: '190ml', a: '#c8a038', b: '#faf1d8', cap: '#9c7a20', body: '#e8d09a', h: 0.094, price: 130 },
  { key: 'h_apple', kind: 'pack', jp: 'りんご', sub: 'APPLE', ml: '200ml', a: '#b8342c', b: '#fbeae0', cap: '#8a231c', body: '#e0a08a', h: 0.096, price: 130 },
  { key: 'h_bittersw', kind: 'tallcan', jp: '微糖', sub: 'CAN COFFEE', ml: '245ml', a: '#3b3f45', b: '#e7ded2', cap: '#8a5a2a', body: '#54463a', h: 0.124, r: 0.0266, price: 110 },
  { key: 'h_black', kind: 'tallcan', jp: '無糖', sub: 'BLACK', ml: '245ml', a: '#22252a', b: '#c9ccd2', cap: '#4a4f56', body: '#2e3238', h: 0.124, r: 0.0266, price: 110 },
  { key: 'h_sugar', kind: 'tallcan', jp: '甘口', sub: 'SWEET', ml: '245ml', a: '#6b4a2c', b: '#f2e6d2', cap: '#b8892f', body: '#8a6242', h: 0.124, r: 0.0266, price: 110 },
  { key: 'h_cocoa', kind: 'can', jp: 'ココア', sub: 'HOT COCOA', ml: '210ml', a: '#6b4630', b: '#f2e3cd', cap: '#4b2f1e', body: '#b28b62', h: 0.110, r: 0.0326, price: 120 },
  { key: 'h_genmai', kind: 'can', jp: '玄米茶', sub: 'GENMAICHA', ml: '210ml', a: '#4e7a3c', b: '#eef3dc', cap: '#375c2a', body: '#a8bf7e', h: 0.110, r: 0.0326, price: 110 },
  { key: 'h_soup', kind: 'can', jp: 'コーンスープ', sub: 'CORN SOUP', ml: '190ml', a: '#e0b23c', b: '#fbf1d8', cap: '#b98a20', body: '#f2d489', h: 0.106, r: 0.0324, price: 120 },
];

/* ------------------------------------------------------------------ 商品テンプレ（独立 Mesh） */
const _tpl = new Map();
function productTemplate(e) {
  if (_tpl.has(e.key)) return _tpl.get(e.key);
  const p = grp('item:' + e.key);
  const lab = labelOf(e);
  const R = e.r || 0.028, H = e.h;
  if (e.kind === 'bottle') {
    const neckTop = H - 0.014;
    const pts = [
      [0, 0.0015], [R * 0.76, 0.003], [R * 0.95, 0.011], [R, 0.024], [R, H * 0.44],
      [R * 0.985, H * 0.53], [R * 0.76, H * 0.63], [R * 0.40, H * 0.71], [0.0096, H * 0.78],
      [0.0096, neckTop], [0.0112, neckTop + 0.003], [0, neckTop + 0.004],
    ];
    p.add(noOut(mesh(latheOf(pts, 16), MAT.plastic(e.body, { spec: 0.60, specPower: 128, specCut: 0.10, sheen: 0.22, tint: '#f8efe4', sat: 0.94 }), { name: 'glass-body' })));
    const bs = H * 0.10, be = H * 0.56;
    p.add(noOut(mesh(latheOf([[R * 1.036, bs], [R * 1.022, bs + 0.006], [R * 1.036, (bs + be) * 0.5], [R * 1.022, be - 0.005], [R * 1.036, be]], 16),
      MAT.plastic('#ffffff', { map: labelTex(e), side: THREE.DoubleSide, spec: 0.24, sheen: 0.06, shadowAmt: 0.72 }))));
    p.add(noOut(mesh(cyl(0.0148, 0.0130, 0.011, 12), MAT.metal(e.cap, { spec: 0.72, specPower: 140 }), { pos: [0, neckTop + 0.003, 0], name: 'crown' })));
    p.add(noOut(mesh(tor(0.0140, 0.0016), MAT.metal('#b0b4b6', {}), { pos: [0, neckTop - 0.001, 0], rot: [PI / 2, 0, 0] })));
  } else if (e.kind === 'pack') {
    p.add(noOut(mesh(box(0.054, H - 0.010, 0.040), lab, { pos: [0, (H - 0.010) / 2, 0], name: 'pack-body' })));
    p.add(noOut(mesh(box(0.034, 0.010, 0.010), MAT.paper({ color: '#efe6d4' }), { pos: [0, H - 0.004, 0], name: 'pack-fin' })));
    p.add(noOut(mesh(box(0.050, 0.003, 0.036), MAT.paper({ color: '#ddd2bc' }), { pos: [0, 0.0015, 0] })));
    p.add(noOut(mesh(cyl(0.0034, 0.0034, 0.058, 8), MAT.plastic(e.cap, { spec: 0.4 }), { pos: [0.011, H + 0.022, -0.005], rot: [8 * D2R, 0, 7 * D2R] })));
  } else {
    const rim = H - 0.004;
    const pts = [
      [0, 0], [R * 0.72, 0], [R * 0.74, 0.003], [R * 0.94, 0.007], [R, 0.013],
      [R * 1.004, 0.020], [R * 1.004, H * 0.78], [R, H * 0.86], [R * 0.86, H * 0.925],
      [R * 0.90, rim], [R * 0.88, H], [0, H],
    ];
    p.add(noOut(mesh(latheOf(pts, 18), lab, { name: 'can-body' })));
    p.add(noOut(mesh(cyl(R * 0.86, R * 0.86, 0.0035, 16), MAT.canBody({ color: '#d3d8dc' }), { pos: [0, H - 0.0015, 0], name: 'can-lid' })));
    p.add(noOut(mesh(tor(R * 1.002, 0.0013), MAT.chrome({}), { pos: [0, H * 0.50], rot: [PI / 2, 0, 0] })));
    p.add(noOut(mesh(rbox(0.019, 0.0018, 0.0115, 0.0016), MAT.chrome({}), { pos: [0, H + 0.0012, 0.0045], name: 'can-tab' })));
    p.add(noOut(mesh(cyl(0.0034, 0.0034, 0.0024, 8), MAT.chrome({}), { pos: [0, H + 0.0016, -0.0052] })));
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

/* ------------------------------------------------------------------ 寸法 */
const W = 1.13, H = 1.85, D = 0.75;
const HW = W / 2, HD = D / 2;
const Y_B = 0.075, Y_T = 1.440;
const WIN = { x0: -0.490, x1: 0.190, y0: 0.420, y1: 1.400 };
const CON = { x0: 0.214, x1: 0.556 };
const HTW = { x0: -0.556, x1: -0.492 };                    // ヒーター表示タワー
const PKU = { x0: -0.470, x1: 0.170, y0: 0.140, y1: 0.400 };
const CAB = { x0: -0.508, x1: 0.208, z0: -0.330, z1: 0.300, y0: 0.412, y1: 1.412 };
const ROWS = 5, COLS = 3;
const SHELF_Y = [0.432, 0.624, 0.816, 1.008, 1.200];
const COL_X = [-0.387, -0.149, 0.089];
const DIV_X = [-0.268, -0.030];
const Z_FRONT = 0.228, Z_BACK = 0.138;
const TILT = 18 * D2R;                                       // 上部斜面の前傾角
const PIV_X = 0.190, PIV_Z = 0.368;                          // 右ヒンジ軸

/* ================================================================== BUILD */
export function build(options = {}) {
  const o = options || {};
  const seed = o.seed ?? 4024;
  const rnd = rand(seed);
  const variant = o.variant === 'coffee' ? 'coffee' : 'tea';
  const color = o.color ?? (variant === 'coffee' ? '#5b4a3a' : PAL.vendingGreen);
  const soldOutRatio = clamp(o.soldOutRatio ?? 0.18, 0, 0.55);
  const doorOpen = clamp(o.doorOpen ?? 0, 0, 62);
  const cat = TEA_HOT;
  const red = '#c9402f';                                   // 「あたたかい」赤帯
  const cream = '#f0e4cc';

  const g = grp('vending-machine-tea');

  /* ---------------- マテリアル ---------------- */
  const skin = MAT.metalPaint(color, { worn: 0.68, repeat: 3, sat: 1.02, tint: '#fff0d8' });
  const skinDeep = MAT.metalPaint(color, { worn: 0.9, repeat: 2, base: '#7d7566', tint: '#e8d7b8' });
  const skinBrown = MAT.metalPaint('#6b5540', { worn: 0.85, repeat: 3 });
  const aluDk = MAT.metal('#8d8578', { worn: 0.6, repeat: 3, tint: '#f0e2c8' });     // 青銅色アルミ框
  const aluDim = MAT.metal('#a9aeb2', { worn: 0.5, repeat: 4 });
  const chrome = MAT.chrome({});
  const zinc = MAT.galvanized({ repeat: 3 });
  const dark = MAT.paint('#37342e', { steps: 2, shadowAmt: 1, spec: 0.08 });
  const deep = MAT.paint('#1a1815', { steps: 2, shadowAmt: 1, spec: 0.04 });
  const resin = MAT.hardPlastic('#4a4034', { repeat: 3 });
  const inWarm = MAT.paint('#f2ece0', { map: TEX.gradient({ stops: [[0, 'rgba(255,206,148,1)'], [0.5, 'rgba(250,242,228,1)'], [1, 'rgba(255,192,126,1)']] }), steps: 3, spec: 0.18, sheen: 0.05, shadowAmt: 0.70 });
  const inPlate = MAT.metal('#d8cdb6', { worn: 0.7, repeat: 4, tint: '#ffecc8' });
  const bulbWarm = MAT.bulb({ color: '#ffd9a0' });
  const heater = MAT.bulb({ color: '#ff8c3a' });
  const screwM = MAT.stainless({ worn: 0.7 });
  const greenEdge = MAT.plastic('#bcd8a8', { spec: 0.62, specPower: 130, sheen: 0.22, sat: 1.04, tint: '#f6fff0' });

  const screwHead = (x, y, z, face) => {
    const s = mesh(cyl(0.0064, 0.0058, 0.005, 10), screwM, { pos: [x, y, z] });
    if (face === 'z') s.rotation.x = PI / 2;
    else if (face === 'x') s.rotation.z = PI / 2;
    else if (face === 'xn') s.rotation.z = -PI / 2;
    return noOut(s);
  };
  /** 板金の打ち痕（当跡） */
  const crumple = (x, y, z, ax, sgn, sc = 1, name = 'crumple') => {
    const c = grp(name, { pos: [x, y, z] });
    if (ax === 'x') c.rotation.y = sgn > 0 ? PI / 2 : -PI / 2;
    else c.rotation.y = sgn > 0 ? 0 : PI;
    const dents = MAT.plastic(color, { map: TEX.metal({ base: color, worn: 0.8, repeat: 2 }).map, side: THREE.DoubleSide, spec: 0.32, specPower: 62, shadowAmt: 0.72, steps: 3, tint: '#f2e2c4', sat: 0.96 });
    const crack = MAT.paint('#6b4a34', { spec: 0.1, steps: 2, shadowAmt: 1 });
    [[0, 0, 0.052, 0.32], [0.042, 0.026, 0.030, 0.24], [-0.036, -0.022, 0.026, 0.22]].forEach(([dx, dy, r, k]) => {
      c.add(mesh(sph(r, 12, 8, 0, PI * 2, 0, PI / 2.1), dents, { pos: [dx * sc, dy * sc, 0.0015], rot: [PI / 2, 0, 0], scale: [sc, k, sc] }));
    });
    c.add(noOut(mesh(tor(0.056 * sc, 0.0020), crack, { pos: [0, 0, 0.0022], scale: [sc, sc, 1] })));
    return c;
  };

  /* ================================================================ ①本体（鋼板） */
  const shell = grp('shell');
  g.add(shell);
  shell.add(mesh(box(0.020, Y_T - Y_B, D - 0.018), skin, { pos: [-HW + 0.010, (Y_T + Y_B) / 2, 0], name: 'skin-left' }));
  shell.add(mesh(box(0.020, Y_T - Y_B, D - 0.018), skin, { pos: [HW - 0.010, (Y_T + Y_B) / 2, 0], name: 'skin-right' }));
  shell.add(mesh(box(W - 0.014, 0.016, D - 0.014), zinc, { pos: [0, 1.432, 0], name: 'skin-top' }));
  shell.add(mesh(box(1.112, 0.360, 0.700), skin, { pos: [0, 1.620, -0.020], name: 'head-block' }));
  shell.add(mesh(box(0.014, 0.330, 0.660), skinDeep, { pos: [-0.300, 1.620, -0.020], name: 'head-seam-l' }));
  shell.add(mesh(box(0.014, 0.330, 0.660), skinDeep, { pos: [0.300, 1.620, -0.020], name: 'head-seam-r' }));
  shell.add(mesh(box(W - 0.014, 1.38, 0.018), zinc, { pos: [0, 0.77, -HD + 0.009], name: 'skin-back' }));
  shell.add(mesh(box(W - 0.010, 0.014, D - 0.012), zinc, { pos: [0, Y_B - 0.002, 0], name: 'skin-bottom' }));
  // 前面：枠まわりの面板（ガラス・ヒーター塔・コンソールで開いた部分は塞ぐ）
  const fpl = (w, h, x, y, z = 0.350) => shell.add(mesh(box(w, h, 0.020), skin, { pos: [x, y, z] }));
  fpl(1.100, 0.044, 0.000, 1.424);                                                   // 上ヘッダ（ガラス天端より上）
  fpl(CON.x1 - CON.x0 + 0.012, 1.100, (CON.x0 + CON.x1) / 2, 0.900);                  // 选购後面
  fpl(HTW.x1 - HTW.x0 + 0.02, 1.100, (HTW.x0 + HTW.x1) / 2, 0.900);                   // ヒーター塔後面
  fpl(WIN.x0 - HTW.x0, 0.300, (WIN.x0 + HTW.x0) / 2, 0.260);                          // 左裾
  fpl(0.620, 0.060, -0.150, 0.418);                                                   // ガラス下見切り
  fpl(CON.x1 - HTW.x0, 0.090, (CON.x1 + HTW.x0) / 2, 0.123);                          // 受取口下
  fpl(CON.x1 - 0.160, 0.252, (CON.x1 + 0.160) / 2, 0.291);                               // 右裾（选购下）
  shell.add(mesh(box(0.014, 1.02, 0.022), skinDeep, { pos: [0.202, 0.900, 0.366], name: 'mullion' }));   // ガラス／选购の立枠
  // 前端折辺
  shell.add(mesh(box(0.016, Y_T - Y_B - 0.02, 0.026), skinDeep, { pos: [HW - 0.010, 0.900, 0.368], name: 'fold-r' }));
  shell.add(mesh(box(0.016, Y_T - Y_B - 0.02, 0.026), skinDeep, { pos: [-HW + 0.010, 0.900, 0.368], name: 'fold-l' }));
  // ベース（二層段差）
  const base = grp('base');
  shell.add(base);
  base.add(mesh(box(W, 0.055, D - 0.006), skinDeep, { pos: [0, 0.045, 0], name: 'base-upper' }));
  base.add(mesh(box(W + 0.020, 0.020, D + 0.014), MAT.metal('#6f6a60', { worn: 0.9, repeat: 2 }), { pos: [0, 0.012, 0.002], name: 'base-lower' }));
  base.add(mesh(box(W + 0.024, 0.010, 0.028), aluDim, { pos: [0, 0.024, HD - 0.006], name: 'base-trim' }));
  // 底部の排気グリル（温蔵機の下面）
  const vent = grp('bottom-vent', { pos: [0.02, 0.062, HD - 0.004] });
  base.add(vent);
  vent.add(mesh(box(0.660, 0.062, 0.014), dark, { pos: [0, 0, -0.006] }));
  for (let i = 0; i < 12; i++) vent.add(mesh(box(0.046, 0.042, 0.010), aluDk, { pos: [-0.300 + i * 0.055, 0, 0.002], rot: [22 * D2R, 0, 0] }));
  // リベット・ネジ
  row(shell, 12, 0.092, (i, x) => screwHead(x, Y_T - 0.028, HD + 0.0025, 'z'), { x0: -0.516 });
  row(shell, 12, 0.092, (i, x) => screwHead(x, Y_B + 0.055, HD + 0.0025, 'z'), { x0: -0.516 });
  for (let i = 0; i < 6; i++) shell.add(screwHead(HW + 0.0005, 0.30 + i * 0.20, -0.24 + i * 0.02, 'x'));
  for (let i = 0; i < 6; i++) shell.add(screwHead(-HW - 0.0005, 0.30 + i * 0.20, -0.24 + i * 0.02, 'xn'));
  shell.add(mesh(rbox(0.94, 0.010, 0.010, 0.004), MAT.metal('#9a8270', { spec: 0.4, worn: 0.9 }), { pos: [0, Y_B + 0.006, HD - 0.004], name: 'weld-front' }));
  // 側面：丸ベンチレーション列（第 1 台のルーバーとは違う）
  [-1, 1].forEach((sgn) => {
    const sd = grp('side' + sgn);
    shell.add(sd);
    sd.add(mesh(box(0.008, 1.20, 0.012), skinDeep, { pos: [sgn * (HW + 0.001), 0.80, -0.10], name: 'seam' }));
    sd.add(mesh(box(0.006, 0.460, 0.340), skinDeep, { pos: [sgn * (HW - 0.004), 1.120, -0.140], name: 'vent-recess' }));
    grill(sd, { w: 0.300, h: 0.420, nx: 4, ny: 5, bar: 0.007, mat: aluDim, pos: [sgn * (HW - 0.001), 1.120, -0.140], rot: [0, sgn * PI / 2, 0] });
    sd.add(crumple(sgn * (HW + 0.002), 0.660, 0.070, 'x', sgn, 0.9, 'dent' + sgn));
    weather(sd, { w: 0.34, h: 0.22, pos: [sgn * (HW + 0.009), 0.22, -0.06], rot: [0, sgn * PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 41, density: 1.4, spread: 0.005 });
    weather(sd, { w: 0.18, h: 0.18, pos: [sgn * (HW + 0.006), 0.66, 0.07], rot: [0, sgn * PI / 2, 0], kind: 'chip', color: '#8b6f57', opacity: 0.5, seed: seed + 42, density: 1.2, spread: 0.005 });
  });

  /* ================================================================ ②上部：前傾斜面 FACE ＋ 円筒クローン */
  const fascia = grp('fascia', { pos: [0, 1.623, 0.318], rot: [TILT, 0, 0] });
  g.add(fascia);
  fascia.add(mesh(box(1.130, 0.420, 0.110), skin, { pos: [0, 0, -0.010], name: 'fascia-slab' }));
  fascia.add(mesh(box(1.136, 0.016, 0.118), aluDim, { pos: [0, -0.216, -0.010], name: 'fascia-sill' }));
  // 呼吸するサイン群（枠＋発光 FACE＋二層 LED）
  const signG = grp('signbox');
  fascia.add(signG);
  signG.userData.breathe = { speed: 0.5, amount: 0.08, phase: (seed % 5) / 4 };
  // 発光 FACE（褪色・内側ムラ）
  signG.add(mesh(box(1.020, 0.215, 0.014), dark, { pos: [0, 0.078, 0.048], name: 'face-bezel' }));
  const faceMat = MAT.lampShade({
    map: TEX.signboard({ text: variant === 'coffee' ? 'あったか 珈琲' : 'あったか', sub: variant === 'coffee' ? 'HOT COFFEE 24H' : 'HOT TEA & COFFEE', bg: cream, fg: '#8a3a20', stripe: red, size: 132, spacing: 0 }),
    color: '#ffffff', emissive: '#ffd9a4', emissiveIntensity: 0.45,
  });
  signG.add(noOut(mesh(plane(0.992, 0.190), faceMat, { pos: [0, 0.078, 0.0635], name: 'face-glow' })));
  decal(signG, { map: TEX.wear({ kind: 'dirt', color: '#b09a78', seed: seed + 43, density: 0.9 }), w: 0.78, h: 0.15, pos: [-0.10, 0.082, 0.0655], opacity: 0.24 });
  weather(fascia, { w: 0.42, h: 0.05, pos: [0.30, -0.100, 0.0565], kind: 'chip', color: '#c9b79a', opacity: 0.5, seed: seed + 44, density: 1.5, spread: 0.005 });
  // 「あたたかい／つめたい」二層 LED
  const ledRow = (txt, bg, fg, em, y) => {
    signG.add(mesh(box(0.300, 0.074, 0.014), MAT.plastic('#141210', { steps: 2, spec: 0.2 }), { pos: [0, y, 0.052] }));
    signG.add(noOut(mesh(plane(0.260, 0.065), MAT.screen({ map: TEX.signboard({ text: txt, bg, fg, size: 118, spacing: 0 }) }), { pos: [0, y, 0.0625] })));
    signG.add(mesh(box(0.030, 0.048, 0.016), MAT.lampShade({ color: '#ffffff', emissive: em, emissiveIntensity: 0.7 }), { pos: [-0.455, y, 0.054] }));
  };
  ledRow('あたたかい', '#1c1210', '#ff8f6a', red, -0.086);
  ledRow('つめたい', '#0f1a22', '#8fd0ff', '#2b6fb5', -0.160);
  // クローン（円筒天板）＋後方ホッパー
  fascia.add(mesh(cyl(0.032, 0.032, 1.132, 16), skin, { pos: [0, 0.194, 0.012], rot: [0, 0, PI / 2], name: 'crown-bar' }));
  fascia.add(mesh(sph(0.0325, 14, 10), skin, { pos: [-0.562, 0.194, 0.012], name: 'crown-cap-l' }));
  fascia.add(mesh(sph(0.0325, 14, 10), skin, { pos: [0.562, 0.194, 0.012], name: 'crown-cap-r' }));
  // 天板上面（クローン後方の平坦部）：埃・鳥フン・落ち葉
  const topG = grp('topdeck');
  g.add(topG);
  topG.add(mesh(box(0.320, 0.036, 0.220), skinDeep, { pos: [0.28, 1.818, -0.180], name: 'hopper-bump' }));
  topG.add(mesh(box(0.160, 0.024, 0.150), zinc, { pos: [-0.32, 1.812, -0.190], name: 'service-hatch' }));
  topG.add(mesh(box(0.090, 0.020, 0.090), aluDk, { pos: [-0.32, 1.828, -0.190], name: 'hatch-knob' }));
  weather(topG, { w: 0.56, h: 0.26, pos: [0.0, 1.8060, -0.150], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8171', opacity: 0.5, seed: seed + 46, density: 1.6, spread: 0.004 });
  weather(topG, { w: 0.32, h: 0.20, pos: [-0.18, 1.8100, -0.060], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#eee6d6', opacity: 0.55, seed: seed + 47, density: 0.5, count: 2, spread: 0.004 });
  for (let i = 0; i < 3; i++) row(topG, 3, 0.085, (k, x) => screwHead(x, 1.8020, -0.320 + i * 0.090, 'z'), { x0: -0.30 });

  /* ================================================================ ③庫内（5 段 × 3 列） */
  const cabG = grp('cabinet-inside');
  g.add(cabG);
  const CW = CAB.x1 - CAB.x0, CCX = (CAB.x0 + CAB.x1) / 2;
  const CDp = CAB.z1 - CAB.z0, CCZ = (CAB.z0 + CAB.z1) / 2;
  const CH = CAB.y1 - CAB.y0, CCY = (CAB.y0 + CAB.y1) / 2;
  cabG.add(noOut(mesh(box(CW, CH, 0.016), inWarm, { pos: [CCX, CCY, CAB.z0 + 0.008], name: 'in-back' })));
  cabG.add(noOut(mesh(box(0.016, CH, CDp), inPlate, { pos: [CAB.x0 + 0.008, CCY, CCZ], name: 'in-left' })));
  cabG.add(noOut(mesh(box(0.016, CH, CDp), inPlate, { pos: [CAB.x1 - 0.008, CCY, CCZ], name: 'in-right' })));
  cabG.add(noOut(mesh(box(CW, 0.018, CDp), inWarm, { pos: [CCX, CAB.y1 - 0.009, CCZ], name: 'in-ceiling' })));
  cabG.add(noOut(mesh(box(CW, 0.020, CDp + 0.02), inPlate, { pos: [CCX, CAB.y0 + 0.010, CCZ - 0.01], name: 'in-floor' })));
  // 温蔵庫特有の背面反射円盤＋ヒーター球
  for (let s = 0; s < ROWS; s++) {
    for (let c = 0; c < COLS; c++) {
      cabG.add(noOut(mesh(cyl(0.062, 0.062, 0.006, 18), MAT.metal('#e6d8bc', { spec: 0.5, worn: 0.3, repeat: 2 }), { pos: [COL_X[c], SHELF_Y[s] + 0.090, CAB.z0 + 0.022], rot: [PI / 2, 0, 0] })));
      cabG.add(noOut(mesh(cyl(0.014, 0.014, 0.030, 12), heater, { pos: [COL_X[c], SHELF_Y[s] + 0.090, CAB.z0 + 0.040], rot: [PI / 2, 0, 0] })));
    }
    cabG.add(noOut(mesh(cyl(0.0050, 0.0050, CW - 0.034, 10), bulbWarm, { pos: [CCX, SHELF_Y[s] + 0.176, 0.246], rot: [0, 0, PI / 2] })));
  }
  // 棚
  const shelfG = grp('shelves');
  cabG.add(shelfG);
  for (let s = 0; s < ROWS; s++) {
    const y = SHELF_Y[s];
    const lane = grp('shelf' + s);
    shelfG.add(lane);
    lane.add(noOut(mesh(rbox(CW - 0.010, 0.014, CDp - 0.012, 0.004), MAT.metal('#dcd3bd', { worn: 0.5, repeat: 4, tint: '#fff2d8' }), { pos: [CCX, y - 0.007, CCZ - 0.012] })));
    lane.add(noOut(mesh(box(CW - 0.006, 0.028, 0.012), MAT.plastic(red, { spec: 0.34, steps: 3, sat: 1.04 }), { pos: [CCX, y - 0.020, 0.288] })));
    lane.add(noOut(mesh(cyl(0.0036, 0.0036, CW - 0.018, 8), aluDk, { pos: [CCX, y + 0.026, 0.282], rot: [0, 0, PI / 2] })));
    [CAB.x0 + 0.014, CAB.x1 - 0.014].forEach((px) => lane.add(noOut(mesh(cyl(0.0042, 0.0042, 0.042, 8), aluDk, { pos: [px, y + 0.012, 0.282] }))));
    DIV_X.forEach((dx) => lane.add(noOut(mesh(box(0.006, 0.168, 0.230), MAT.plastic('#e6e2d2', { spec: 0.28, sat: 0.9, tint: '#fff6e8' }), { pos: [dx, y + 0.084, 0.182] }))));
  }

  /* ---- 商品割当 ---- */
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
    for (const p of plan) if (!p.soldOut && rnd() < 0.24) { p.fallen = true; f++; if (f >= 2) break; }
    if (f < 2) for (const p of plan) { if (f >= 2) break; if (!p.soldOut && !p.fallen) { p.fallen = true; f++; } }
  }
  const goodsG = grp('goods');
  cabG.add(goodsG);
  const ledCache = new Map();
  const ledMat = (t, fg) => {
    const kk = t + fg;
    if (!ledCache.has(kk)) ledCache.set(kk, MAT.screen({ map: TEX.lightPanel({ text: t, bg: '#100d0a', fg, mode: 'led', spacing: 0 }) }));
    return ledCache.get(kk);
  };
  for (const p of plan) {
    const y = SHELF_Y[p.s], cx = COL_X[p.c], e = p.e;
    const half = e.kind === 'pack' ? 0.0345 : (e.r || 0.028) * 1.06;
    const ox = half + 0.009;
    if (p.soldOut) {
      goodsG.add(noOut(mesh(box(0.190, 0.0012, 0.160), MAT.paint('#c3b9a4', { steps: 2, spec: 0.05, shadowAmt: 1 }), { pos: [cx, y + 0.0006, 0.180] })));
      for (let i = 0; i < 2; i++) goodsG.add(noOut(mesh(cyl(0.028, 0.029, 0.0016, 12), MAT.paint('#ae9f86', { steps: 2, spec: 0.05, shadowAmt: 1 }), { pos: [cx + (i ? ox : -ox), y + 0.0022, Z_FRONT] })));
    } else if (p.fallen) {
      const restR = e.kind === 'pack' ? 0.028 : (e.r || 0.028) * 1.10;
      const lie = productTemplate(e).clone();
      lie.rotation.set(0, 0, -PI / 2);
      lie.position.set(cx - e.h * 0.5, y + restR, 0.196);
      goodsG.add(lie);
      placeProduct(goodsG, e, cx, y, 0.082, range(rnd, -0.14, 0.14));
    } else {
      const yaw = () => range(rnd, e.kind === 'pack' ? -0.05 : -0.10, e.kind === 'pack' ? 0.05 : 0.10);
      placeProduct(goodsG, e, cx - ox, y, Z_FRONT, yaw());
      placeProduct(goodsG, e, cx + ox, y, Z_FRONT, yaw());
      if (rnd() < 0.85) placeProduct(goodsG, e, cx - ox, y, Z_BACK, yaw() + PI);
      if (e.kind === 'can' || e.kind === 'tallcan') placeProduct(goodsG, e, cx + ox, y, Z_BACK, yaw() + PI * 0.85);
    }
    // 価格札（LED）＋台
    goodsG.add(noOut(mesh(box(0.060, 0.028, 0.010), MAT.plastic('#171412', { spec: 0.2, steps: 2 }), { pos: [cx, y - 0.020, 0.296] })));
    goodsG.add(noOut(mesh(plane(0.052, 0.020), ledMat(p.soldOut ? '売切' : '¥' + e.price, p.soldOut ? '#ff6a5c' : '#ffd07a'), { pos: [cx, y - 0.020, 0.3025] })));
    goodsG.add(noOut(mesh(box(0.070, 0.006, 0.016), MAT.plastic('#8b8478', { spec: 0.3 }), { pos: [cx, y - 0.005, 0.294] })));
  }

  /* ================================================================ ④ヒーター表示タワー（縦长 5 段） */
  const towG = grp('heater-tower');
  g.add(towG);
  const tx = (HTW.x0 + HTW.x1) / 2, tw = HTW.x1 - HTW.x0;
  towG.add(mesh(box(tw + 0.012, 1.060, 0.020), skinBrown, { pos: [tx, 0.900, 0.356], name: 'tower-plate' }));
  towG.add(mesh(box(tw + 0.020, 0.016, 0.026), aluDk, { pos: [tx, 1.440, 0.360] }));
  towG.add(mesh(box(tw + 0.020, 0.016, 0.026), aluDk, { pos: [tx, 0.360, 0.360] }));
  for (let s = 0; s < ROWS; s++) {
    const ty = SHELF_Y[s] + 0.088;
    towG.add(mesh(rbox(tw, 0.150, 0.016, 0.006), MAT.plastic(red, { spec: 0.32, steps: 3, sat: 1.06, tint: '#ffd9c4' }), { pos: [tx, ty, 0.370] }));
    towG.add(mesh(rbox(tw - 0.012, 0.136, 0.008, 0.004), MAT.plastic('#8a2c1e', { steps: 2, shadowAmt: 0.95 }), { pos: [tx, ty, 0.3795] }));
    towG.add(noOut(mesh(cyl(0.0125, 0.0125, 0.010, 12), heater, { pos: [tx, ty + 0.052, 0.380], rot: [PI / 2, 0, 0] })));
    towG.add(noOut(mesh(tor(0.0150, 0.0026), aluDk, { pos: [tx, ty + 0.052, 0.380] })));
    towG.add(noOut(mesh(plane(tw - 0.014, 0.014), MAT.screen({ map: TEX.signboard({ text: (s + 1) + ' ' + cat[(s * 3) % cat.length].price, bg: '#241a10', fg: '#ffdf9a', size: 165, spacing: 0 }) }), { pos: [tx, ty + 0.006, 0.3845] })));
    towG.add(noOut(mesh(plane(tw - 0.014, 0.014), MAT.screen({ map: TEX.signboard({ text: 'HOT', bg: '#3a140c', fg: '#ffb27a', size: 165, spacing: 0 }) }), { pos: [tx, ty - 0.040, 0.3845] })));
  }
  towG.add(screwHead(tx, 1.420, 0.384, 'z'));
  towG.add(screwHead(tx, 0.380, 0.384, 'z'));
  weather(towG, { w: 0.05, h: 0.70, pos: [tx + 0.02, 1.02, 0.3860], kind: 'chip', color: '#e8d5c4', opacity: 0.45, seed: seed + 49, density: 1.6, spread: 0.004 });

  /* ================================================================ ⑤ガラス扉（右ヒンジ・ツマミ錠） */
  const frG = grp('door-frame');
  g.add(frG);
  const fb = (w, h, x, y) => mesh(rbox(w, h, 0.034, 0.006), aluDk, { pos: [x, y, 0.372] });
  frG.add(fb(0.028, WIN.y1 - WIN.y0 + 0.056, WIN.x0 - 0.014, 0.910));
  frG.add(fb(0.028, WIN.y1 - WIN.y0 + 0.056, WIN.x1 + 0.014, 0.910));
  frG.add(fb(WIN.x1 - WIN.x0 + 0.056, 0.028, 0.150, WIN.y1 + 0.014));
  frG.add(fb(WIN.x1 - WIN.x0 + 0.056, 0.028, 0.150, WIN.y0 - 0.014));
  // パッキン（上側だけ硬化・縮み）
  const gask = MAT.rubber('#4b4238');
  [[0.016, 0.952, WIN.x0 + 0.008], [0.016, 0.952, WIN.x1 - 0.008]].forEach(([w, h, x]) => frG.add(mesh(box(w, h, 0.012), gask, { pos: [x, 0.910, 0.350] })));
  frG.add(mesh(box(0.660, 0.016, 0.012), MAT.rubber('#6a5a48', { spec: 0.02 }), { pos: [0.150, WIN.y1 - 0.008, 0.350] }));
  frG.add(mesh(box(0.020, 0.046, 0.022), zinc, { pos: [WIN.x1 + 0.024, 0.470, 0.348] }));

  const doorG = grp('door', { pos: [PIV_X, 0, PIV_Z] });
  g.add(doorG);
  doorG.rotation.y = doorOpen * D2R;                     // 右ヒンジ：+ 回転で手前に開く
  const lx = (x) => x - PIV_X;
  const dBar = (w, h, x, y) => mesh(rbox(w, h, 0.028, 0.005), aluDk, { pos: [x, y, 0] });
  const DX0 = lx(WIN.x0 + 0.006), DX1 = lx(WIN.x1 - 0.006), DCX = (DX0 + DX1) / 2, DW = DX1 - DX0;
  const DY0 = WIN.y0 + 0.008, DY1 = WIN.y1 - 0.008, DCY = (DY0 + DY1) / 2, DH = DY1 - DY0;
  doorG.add(dBar(0.026, DH + 0.026, DX0 + 0.013, DCY));
  doorG.add(dBar(0.026, DH + 0.026, DX1 - 0.013, DCY));
  doorG.add(dBar(DW, 0.026, DCX, DY1 - 0.013));
  doorG.add(dBar(DW, 0.026, DCX, DY0 + 0.013));
  // 緑（琥珀）辺り
  doorG.add(noOut(mesh(box(0.010, DH - 0.026, 0.018), greenEdge, { pos: [DX0 + 0.023, DCY, 0] })));
  doorG.add(noOut(mesh(box(0.010, DH - 0.026, 0.018), greenEdge, { pos: [DX1 - 0.023, DCY, 0] })));
  doorG.add(noOut(mesh(box(DW - 0.046, 0.010, 0.018), greenEdge, { pos: [DCX, DY1 - 0.023, 0] })));
  doorG.add(noOut(mesh(box(DW - 0.046, 0.010, 0.018), greenEdge, { pos: [DCX, DY0 + 0.023, 0] })));
  // 強化ガラス（温蔵用＝琥珀がかり）
  const glass = mesh(box(DW - 0.026, DH - 0.026, 0.012), MAT.glass({ thickness: 0.012, color: '#eadfce', attenuation: '#e8cfae', attenuationDistance: 2.6 }), { pos: [DCX, DCY, 0], name: 'door-glass', cast: false });
  glass.userData.noOutline = true;
  doorG.add(glass);
  // 内側の棚写り抑え＋吊レール
  doorG.add(noOut(mesh(box(DW - 0.05, 0.014, 0.006), MAT.plastic('#ded6c4', { spec: 0.3 }), { pos: [DCX, DY1 - 0.036, -0.016] })));
  // ヒンジ（右側 3 箇所）＋ピン
  [0.520, 0.910, 1.300].forEach((hy) => {
    doorG.add(mesh(box(0.022, 0.058, 0.032), zinc, { pos: [DX1 - 0.004, hy, 0.002] }));
    doorG.add(mesh(cyl(0.0044, 0.0044, 0.078, 8), chrome, { pos: [DX1 + 0.004, hy, 0.010] }));
  });
  // 大型ツマミ（回し錠）＋下部錠前
  const knobG = grp('knob', { pos: [DX0 + 0.048, 0.910, 0.020] });
  doorG.add(knobG);
  knobG.add(mesh(cyl(0.040, 0.044, 0.020, 18), MAT.hardPlastic('#2e2a26', { repeat: 2 }), { rot: [PI / 2, 0, 0], name: 'knob' }));
  knobG.add(mesh(cyl(0.030, 0.030, 0.026, 18), MAT.hardPlastic('#8a7f6c', { repeat: 2 }), { pos: [0, 0, 0.014], rot: [PI / 2, 0, 0] }));
  knobG.add(noOut(mesh(tor(0.044, 0.0035), aluDk, { pos: [0, 0, 0.002] })));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    knobG.add(noOut(mesh(box(0.008, 0.014, 0.010), MAT.hardPlastic('#2e2a26'), { pos: [Math.cos(a) * 0.036, Math.sin(a) * 0.036, 0.020], rot: [0, 0, a] })));
  }
  doorG.add(mesh(box(0.030, 0.054, 0.020), zinc, { pos: [DX0 + 0.046, 0.500, 0.006] }));
  doorG.add(mesh(cyl(0.0106, 0.0106, 0.012, 12), chrome, { pos: [DX0 + 0.046, 0.500, 0.014], rot: [PI / 2, 0, 0] }));
  doorG.add(noOut(mesh(box(0.014, 0.004, 0.010), deep, { pos: [DX0 + 0.046, 0.500, 0.021] })));
  // 表面の経年（指紋・拭き跡・飛石・外側結露＝湯気）
  const gz = 0.0075;
  decal(doorG, { map: TEX.wear({ kind: 'scratch', color: '#f3ece0', seed: seed + 51, density: 1.1 }), w: 0.24, h: 0.16, pos: [DCX - 0.14, 0.70, gz + 0.0005], opacity: 0.20, rot: [0, 0, -9 * D2R], order: 1 });
  decal(doorG, { map: TEX.wear({ kind: 'scratch', color: '#efe6d8', seed: seed + 52, density: 1.7 }), w: 0.28, h: 0.18, pos: [DCX + 0.12, 1.10, gz + 0.0006], opacity: 0.17, rot: [0, 0, 16 * D2R], order: 2 });
  decal(doorG, { map: TEX.wear({ kind: 'chip', color: '#d8cec0', seed: seed + 53, density: 0.4 }), w: 0.06, h: 0.05, pos: [DCX + 0.02, 0.52, gz + 0.0007], opacity: 0.42, order: 3 });
  decal(doorG, { map: TEX.frost().map, w: 0.52, h: 0.24, pos: [DCX, 0.56, gz + 0.0008], opacity: 0.30, color: '#f6f0e6', order: 4 });
  decal(doorG, { map: TEX.frost().map, w: 0.40, h: 0.14, pos: [DCX + 0.06, 1.28, gz + 0.0009], opacity: 0.18, color: '#fbf6ec', order: 5 });
  weather(doorG, { w: 0.14, h: 0.04, pos: [DCX + 0.10, DY0 + 0.026, 0.015], kind: 'chip', color: '#e6dcc6', opacity: 0.55, seed: seed + 54, density: 1.2, spread: 0.004 });

  /* ================================================================ ⑥选购パネル（右縦长 2 列） */
  const conG = grp('console');
  g.add(conG);
  conG.add(mesh(box(CON.x1 - CON.x0, 1.060, 0.022), resin, { pos: [(CON.x0 + CON.x1) / 2, 0.900, 0.366], name: 'console-plate' }));
  const cxm = (CON.x0 + CON.x1) / 2, cw = CON.x1 - CON.x0;
  // 「あたたかい」赤帯（縦长）
  conG.add(mesh(box(0.024, 1.020, 0.016), MAT.lampShade({ color: red, emissive: '#ff8358', emissiveIntensity: 0.30, steps: 2 }), { pos: [CON.x0 + 0.022, 0.900, 0.380] }));
  conG.add(mesh(box(0.214, 0.056, 0.014), MAT.plastic('#241a12', { steps: 2 }), { pos: [cxm + 0.030, 1.408, 0.378] }));
  conG.add(noOut(mesh(plane(0.200, 0.050), MAT.screen({ map: TEX.signboard({ text: 'あたたかい', bg: red, fg: '#fff4e4', size: 120, spacing: 0 }) }), { pos: [cxm + 0.030, 1.408, 0.3875] })));
  // 金額表示
  conG.add(mesh(box(cw - 0.030, 0.062, 0.016), MAT.plastic('#100d0a', { steps: 2, spec: 0.2 }), { pos: [cxm, 1.360, 0.378] }));
  conG.add(noOut(mesh(plane(cw - 0.042, 0.048), MAT.screen({ map: TEX.lightPanel({ text: String(110 + (seed % 4) * 10) + '円', bg: '#0d0a08', fg: '#ffcf72', mode: 'led', spacing: 0 }) }), { pos: [cxm, 1.360, 0.3875] })));
  // ボタン 2 列 × 5 段
  const btnMat = MAT.hardPlastic('#57493a', { repeat: 2 });
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      const bx = cxm - 0.058 + c * 0.116, by = 1.260 - r * 0.104;
      const on = rnd() < 0.66;
      conG.add(mesh(rbox(0.062, 0.040, 0.016, 0.006), btnMat, { pos: [bx, by, 0.384] }));
      conG.add(noOut(mesh(cyl(0.0064, 0.0064, 0.009, 10), on ? MAT.ledOn(r % 2 ? '#5fbf72' : red, {}) : MAT.ledOff('#2b2621'), { pos: [bx, by + 0.034, 0.384], rot: [PI / 2, 0, 0] })));
      conG.add(noOut(mesh(plane(0.056, 0.014), MAT.screen({ map: TEX.signboard({ text: (r * 2 + c + 1) + ' ' + cat[(r * 2 + c) % cat.length].price, bg: '#191410', fg: on ? '#ffe0a0' : '#8b8175', size: 155, spacing: 0 }) }), { pos: [bx, by - 0.037, 0.3855] })));
    }
  }
  weather(conG, { w: 0.20, h: 0.12, pos: [cxm, 1.10, 0.3855], kind: 'scratch', color: '#d8cdb8', opacity: 0.24, seed: seed + 56, density: 1.7, spread: 0.005 });
  decal(conG, { map: TEX.wear({ kind: 'chip', color: '#241f1a', seed: seed + 57, density: 1.9 }), w: 0.20, h: 0.16, pos: [cxm - 0.02, 1.18, 0.3860], opacity: 0.34 });
  // 硬貨投入口／IC・QR／お釣り
  conG.add(mesh(box(0.110, 0.100, 0.016), zinc, { pos: [cxm + 0.052, 0.700, 0.380] }));
  conG.add(mesh(box(0.058, 0.006, 0.014), deep, { pos: [cxm + 0.052, 0.722, 0.389] }));
  conG.add(mesh(box(0.052, 0.018, 0.012), deep, { pos: [cxm + 0.052, 0.676, 0.388] }));
  conG.add(noOut(mesh(plane(0.100, 0.036), MAT.screen({ map: TEX.signboard({ text: '1000円', bg: '#e2ded2', fg: '#33302a', size: 140, spacing: 0 }) }), { pos: [cxm + 0.052, 0.772, 0.3895] })));
  conG.add(mesh(box(0.112, 0.122, 0.016), MAT.hardPlastic('#241f1a', { repeat: 2 }), { pos: [cxm - 0.064, 0.700, 0.378] }));
  conG.add(noOut(mesh(plane(0.090, 0.045), MAT.screen({ map: TEX.lightPanel({ text: 'かざす', bg: '#0d1a16', fg: '#7fe8c0', mode: 'led', spacing: 0 }) }), { pos: [cxm - 0.064, 0.730, 0.3875] })));
  {
    const qr = grp('qr', { pos: [cxm - 0.064, 0.672, 0.388] });
    conG.add(qr);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if (rnd() < 0.42) continue;
      qr.add(noOut(mesh(box(0.009, 0.009, 0.0018), MAT.plastic('#e9f6f2', { steps: 2, shadowAmt: 0.5 }), { pos: [-0.0135 + i * 0.009, -0.0045 + j * 0.009, 0.0014] })));
    }
  }
  conG.add(mesh(box(0.112, 0.066, 0.016), MAT.plastic('#191512', { steps: 2 }), { pos: [cxm - 0.064, 0.566, 0.364] }));
  conG.add(noOut(mesh(box(0.098, 0.050, 0.010), deep, { pos: [cxm - 0.064, 0.564, 0.356] })));
  conG.add(mesh(rbox(0.106, 0.054, 0.008, 0.004), MAT.hardPlastic('#5b4c3c', { repeat: 2 }), { pos: [cxm - 0.064, 0.562, 0.376], rot: [12 * D2R, 0, 0] }));
  conG.add(mesh(box(0.110, 0.040, 0.012), MAT.plastic('#100d0a', { steps: 2 }), { pos: [cxm + 0.052, 0.566, 0.378] }));
  conG.add(noOut(mesh(plane(0.098, 0.030), ledMat('×1', '#ff9f6a'), { pos: [cxm + 0.052, 0.566, 0.3855] })));
  conG.add(mesh(box(cw - 0.030, 0.082, 0.010), MAT.paper({ color: '#eadfc8' }), { pos: [cxm, 0.452, 0.378] }));
  decal(conG, { map: TEX.signboard({ text: '熱いので注意', sub: 'やけどにご注意', bg: '#eadfc8', fg: '#6b5c42', size: 108, spacing: 0 }), w: cw - 0.044, h: 0.074, pos: [cxm, 0.452, 0.3845], opacity: 0.92 });
  conG.add(screwHead(CON.x0 + 0.018, 1.410, 0.380, 'z'));
  conG.add(screwHead(CON.x1 - 0.018, 1.410, 0.380, 'z'));
  conG.add(screwHead(CON.x0 + 0.018, 0.390, 0.380, 'z'));
  conG.add(screwHead(CON.x1 - 0.018, 0.390, 0.380, 'z'));

  /* ================================================================ ⑦受け取り口（大フラップ） */
  const pkG = grp('pickup');
  g.add(pkG);
  const ch = grp('chute');
  pkG.add(ch);
  const pxm = (PKU.x0 + PKU.x1) / 2, pw = PKU.x1 - PKU.x0;
  ch.add(noOut(mesh(box(pw - 0.010, 0.250, 0.014), deep, { pos: [pxm, 0.268, -0.040] })));
  ch.add(noOut(mesh(box(0.012, 0.250, 0.340), deep, { pos: [PKU.x0 + 0.006, 0.268, 0.100] })));
  ch.add(noOut(mesh(box(0.012, 0.250, 0.340), deep, { pos: [PKU.x1 - 0.006, 0.268, 0.100] })));
  ch.add(noOut(mesh(box(pw, 0.012, 0.340), MAT.paint('#26221d', { steps: 2, shadowAmt: 1, map: TEX.metal({ base: '#33302a', worn: 1, repeat: 3 }).map }), { pos: [pxm, 0.146, 0.100] })));
  ch.add(noOut(mesh(box(pw, 0.012, 0.340), deep, { pos: [pxm, 0.390, 0.100] })));
  // 傾斜床（瓶が転がって手前に集まる）
  ch.add(noOut(mesh(box(pw - 0.020, 0.010, 0.300), MAT.paint('#2e2a24', { steps: 2, shadowAmt: 1 }), { pos: [pxm, 0.176, 0.104], rot: [-13 * D2R, 0, 0] })));
  // 盗難防止バー
  ch.add(noOut(mesh(cyl(0.0056, 0.0056, pw - 0.010, 8), chrome, { pos: [pxm, 0.344, 0.070], rot: [0, 0, PI / 2] })));
  [-0.010, 0.010].forEach((s) => ch.add(noOut(mesh(cyl(0.0062, 0.0062, 0.040, 8), chrome, { pos: [pxm + s * (pw / 2 - 0.012), 0.344, 0.070], rot: [PI / 2, 0, 0] }))));
  // フラップ
  pkG.add(mesh(box(pw + 0.030, 0.016, 0.026), aluDk, { pos: [pxm, PKU.y1 + 0.010, 0.350], name: 'flap-hinge' }));
  const flapG = grp('flap', { pos: [pxm, PKU.y1 + 0.002, 0.352] });
  pkG.add(flapG);
  flapG.rotation.x = 16 * D2R;
  flapG.add(mesh(rbox(pw - 0.008, 0.252, 0.014, 0.005), MAT.hardPlastic('#3d3428', { repeat: 2 }), { pos: [0, -0.130, 0.004], name: 'flap' }));
  flapG.add(mesh(box(pw - 0.050, 0.026, 0.008), MAT.plastic(red, { spec: 0.3, steps: 3 }), { pos: [0, -0.200, 0.012] }));
  flapG.add(noOut(mesh(plane(0.220, 0.055), MAT.screen({ map: TEX.signboard({ text: 'おとりだし', sub: 'PUSH', bg: '#2a241d', fg: '#ffd88a', size: 118, spacing: 0 }) }), { pos: [0, -0.160, 0.0135] })));
  flapG.add(mesh(box(pw - 0.020, 0.012, 0.010), MAT.rubber('#5e4c38', { spec: 0.03 }), { pos: [0, -0.256, 0.002] }));
  pkG.add(mesh(box(pw + 0.020, 0.014, 0.022), zinc, { pos: [pxm, PKU.y0 - 0.008, 0.346] }));
  // 中の砂・落ち葉
  const leafMat = MAT.leaf({ map: TEX.leafCluster({ base: '#9c8f79', seed: seed + 58 }), alphaMap: TEX.leafCluster({ base: '#9c8f79', seed: seed + 58 }), alphaTest: 0.4, color: '#a89272' });
  pkG.add(noOut(mesh(plane(0.07, 0.07), leafMat, { pos: [pxm - 0.12, 0.164, 0.170], rot: [-74 * D2R, 0.5, 0.7] })));
  weather(pkG, { w: 0.26, h: 0.05, pos: [pxm, 0.132, 0.3640], kind: 'scratch', color: '#cabfa8', opacity: 0.42, seed: seed + 59, density: 2.2, spread: 0.004 });
  weather(pkG, { w: 0.20, h: 0.10, pos: [PKU.x0 - 0.030, 0.260, 0.3640], kind: 'chip', color: '#8a5236', opacity: 0.45, seed: seed + 60, density: 1.5, spread: 0.004 });

  /* ================================================================ ⑧背面 */
  const bk = grp('back');
  g.add(bk);
  bk.add(mesh(box(0.520, 0.400, 0.014), zinc, { pos: [-0.20, 0.52, -HD - 0.010] }));
  grill(bk, { w: 0.460, h: 0.340, nx: 7, ny: 3, bar: 0.010, mat: dark, pos: [-0.20, 0.52, -HD - 0.022] });
  bk.add(mesh(box(0.260, 0.300, 0.050), zinc, { pos: [0.22, 0.42, -HD - 0.030] }));
  bk.add(mesh(cyl(0.050, 0.050, 0.170, 14), MAT.darkIron({}), { pos: [0.22, 0.40, -HD - 0.062], rot: [0, 0, PI / 2], name: 'tank' }));
  bk.add(mesh(cyl(0.030, 0.030, 0.020, 12), MAT.metal('#8d8f92', { worn: 0.9 }), { pos: [0.31, 0.40, -HD - 0.062], rot: [0, 0, PI / 2] }));
  bk.add(mesh(box(0.046, 0.860, 0.036), MAT.hardPlastic('#c6bfae', { repeat: 2 }), { pos: [0.440, 0.96, -HD - 0.022] }));
  bk.add(mesh(box(0.320, 0.440, 0.012), zinc, { pos: [-0.14, 1.16, -HD - 0.010] }));
  for (let i = 0; i < 4; i++) bk.add(screwHead(-0.26 + (i % 2) * 0.24, 1.00 + Math.floor(i / 2) * 0.32, -HD - 0.018, 'z'));
  row(bk, 8, 0.075, (i, x) => screwHead(x, 1.34, -HD - 0.018, 'z'), { x0: -0.28 });
  bk.add(mesh(box(0.200, 0.086, 0.008), MAT.metal('#d0cdc4', { spec: 0.6, worn: 0.5 }), { pos: [0.10, 1.20, -HD - 0.022] }));
  decal(bk, { map: TEX.lightPanel({ bg: '#d8d4c8', fg: '#37342e', mode: 'sign', rows: [{ t: '型式 HT114T', v: 'AC100V' }, { t: '電熱 420W', v: '50/60Hz' }, { t: '製造 2017.11', v: 'No.1108' }] }), w: 0.186, h: 0.070, pos: [0.10, 1.20, -HD - 0.0285], rot: [0, PI, 0], opacity: 0.95 });
  bk.add(mesh(box(0.046, 0.030, 0.024), MAT.hardPlastic('#3b352c', { repeat: 2 }), { pos: [-0.36, 0.016, -HD - 0.040] }));
  bk.add(pipe([[-0.44, 1.30, -HD - 0.032], [-0.40, 0.90, -HD - 0.044], [-0.36, 0.30, -HD - 0.040], [-0.30, 0.030, -HD - 0.036], [-0.10, 0.020, -HD - 0.040]], 0.0085, MAT.rubber('#33302a'), { seg: 24 }));
  weather(bk, { w: 0.56, h: 0.30, pos: [0.0, 0.24, -HD - 0.006], rot: [0, PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.6, seed: seed + 62, density: 1.8, spread: 0.006 });
  weather(bk, { w: 0.42, h: 0.18, pos: [-0.22, 0.20, -HD - 0.006], rot: [0, PI, 0], kind: 'dirt', color: '#575044', opacity: 0.5, seed: seed + 63, density: 1.9, spread: 0.006 });

  /* ================================================================ ⑨接地 */
  const gr = grp('grounding');
  g.add(gr);
  gr.add(mesh(box(1.210, 0.030, 0.830), MAT.concrete({ repeat: 2, cracked: true, base: PAL.concreteDark }), { pos: [0, 0.015, 0.020], name: 'curb-pad' }));
  gr.add(mesh(box(0.880, 0.014, 0.170), MAT.rubber('#3d3a34'), { pos: [-0.150, 0.037, 0.366], name: 'mat' }));
  decal(gr, { map: TEX.fabric({ repeat: 6 }).map, color: '#4a463e', w: 0.84, h: 0.13, pos: [-0.150, 0.0455, 0.366], rot: [-PI / 2, 0, 0], opacity: 0.5 });
  [[-0.49, -0.28], [-0.49, 0.30], [0.49, -0.28], [0.49, 0.30]].forEach(([ax, az]) => {
    gr.add(mesh(cyl(0.0090, 0.0090, 0.048, 8), zinc, { pos: [ax, 0.056, az] }));
    gr.add(mesh(cyl(0.0150, 0.0150, 0.014, 6), MAT.metal('#999ea1', { worn: 0.9 }), { pos: [ax, 0.080, az] }));
    gr.add(mesh(cyl(0.0200, 0.0200, 0.006, 10), MAT.metal('#8a8e91', { worn: 1 }), { pos: [ax, 0.040, az] }));
  });
  weather(gr, { w: 0.70, h: 0.40, pos: [0, 0.0455, 0.02], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#4b443a', opacity: 0.45, seed: seed + 65, density: 1.4, spread: 0.004 });
  decal(gr, { map: TEX.wear({ kind: 'dirt', color: '#7a6a4c', seed: seed + 66, density: 1.2 }), w: 0.44, h: 0.22, pos: [0.10, 0.0455, -0.12], rot: [-PI / 2, 0, 0.4], opacity: 0.42 });
  for (let i = 0; i < 4; i++) {
    gr.add(noOut(mesh(plane(0.08, 0.08), leafMat, { pos: [range(rnd, -0.50, 0.50), 0.0452, range(rnd, -0.10, 0.34)], rot: [-PI / 2, 0, range(rnd, 0, 6.28)] })));
  }
  // 空き瓶 1 本（温蔵機の横は瓶が転がる）
  const bE = { key: 'litterb_' + (seed % 4), kind: 'bottle', jp: '紅茶', sub: 'EMPTY', ml: '190ml', a: '#b6a894', b: '#eee6d6', cap: '#9a9086', body: '#c8b9a2', h: 0.162, r: 0.0278 };
  const bg2 = grp('litter-bottle', { pos: [-0.300, 0.0700, 0.420], rot: [0, range(rnd, -0.08, 0.08), PI / 2 - 0.06] });
  bg2.add(productTemplate(bE).clone());
  gr.add(bg2);
  gr.add(noOut(mesh(plane(0.20, 0.10), MAT.paint('#6b6355', { steps: 2, spec: 0.05, shadowAmt: 1, map: TEX.wear({ kind: 'dirt', color: '#4b4438', seed: seed + 67, density: 1.4 }) }), { pos: [-0.300, 0.0455, 0.420], rot: [-PI / 2, 0, 0.2] })));

  /* ================================================================ ⑩前面做旧・落葉跡 */
  decal(shell, { map: TEX.wear({ kind: 'chip', color: '#94804f', seed: seed + 68, density: 0.8 }), w: 0.14, h: 0.09, pos: [0.06, 0.300, 0.3620], opacity: 0.45, rot: [0, 0, -7 * D2R] });
  decal(shell, { map: TEX.signboard({ text: '春の新茶', sub: 'HOT', bg: '#f4e8d0', fg: '#5a4a38', stripe: color, size: 130, spacing: 0 }), w: 0.20, h: 0.050, pos: [HW + 0.0040, 1.00, -0.14], rot: [0, PI / 2, 0], opacity: 0.9 });
  weather(shell, { w: 0.30, h: 0.10, pos: [-0.30, 0.150, HD + 0.0015], kind: 'rust', color: '#8a5236', opacity: 0.45, seed: seed + 70, density: 1.4, spread: 0.005 });

  return finish(g, { outline: 'normal' });
}

export default build;
