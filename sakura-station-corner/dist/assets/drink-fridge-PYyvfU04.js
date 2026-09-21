import { g as grp, M as MAT, T as TEX, m as mesh, b as box, r as rbox, n as range, c as cyl, A as row, W as pipe, h as decal, a9 as stockItem, t as tor, P as PAL, i as grill, q as finish, w as weather, z as rand } from './index-C4-XtFer.js';
import { P as P_BOTTLE } from './drink-bottle-u6q1a97w.js';
import { P as P_CAN } from './drink-can-CsuxwTmB.js';
import { P as P_MILK } from './milk-carton-Dk3uvquB.js';
import { P as P_SNACK } from './snack-shelf-pack-Ckm-bVHd.js';
import { build as build$1 } from './price-tag-CX-x2iJT.js';

//  assets/interior/drink-fridge.js —— 飲料用マルチデッキ冷藏ケース（4 門ガラス・庫内 5 段 × 4 列を商品で満たす）
//  ・原点 = 床面（脚・ドレンパン下）中心、+Y 上、正面 +Z（北壁に沿わせて南＝客側へ向く）
//  ・構造：鋼板ボディ（側・天・底・背）／アルミ框＋ガラス扉 N 枚（把手・戸当たりゴム・蝶番・錠・つめたい表示・
//        指紋・結露）／庫内 5 段 × 列（ペット・缶・紙パックを前後列で隙間なく）／仕切バー／LED 価格札／
//        庫内灯（MAT.lampShade + userData.breathe）／奥壁のフィンと霜／床のドレン／上部広告パネルと排気グリル／
//        下面の脚とドレンパン、背面のコンデンサ・配管・銘板

const meta = {
  id: 'drink-fridge',
  real: [2.89, 2.10, 0.95],
  origin: 'ground-center',
};

const PI = Math.PI;
const PRODUCTS = { bottle: P_BOTTLE, can: P_CAN, milk: P_MILK, snack: P_SNACK };
const DIM = {};
for (const k in PRODUCTS) DIM[k] = (PRODUCTS[k].meta && PRODUCTS[k].meta.real) || [0.07, 0.15, 0.07];

/* ---------- 寸法 ---------- */
const D = 0.72;              // 本体奥行き
const WALL = 0.048;          // 側板
const Y_FLOOR = 0.205;       // 庫内床面
const Y_TOP = 1.775;         // 庫内天井
const TIERS = [0.325, 0.62, 0.915, 1.21, 1.505];   // 棚上面（5 段）
const BOARD_T = 0.018;
const Z_FRONT = D / 2 - WALL - 0.004;   // 庫内前面（商品フロント基準）

const WS = 1.4;
function dust(parent, o) {
  return weather(parent, { spread: 0.014, ...o, w: (o.w || 1) / WS, h: (o.h || 1) / WS });
}

/* 列（ドア）ごとの品揃え：下段から上段 */
const COLS = [
  [
    { k: 'bottle', v: ['green', 'tea', 'green'] },
    { k: 'bottle', v: ['tea', 'oolong'] },
    { k: 'bottle', v: ['green', 'coffee'] },
    { k: 'can', v: ['tea', 'coffee', 'chazuke'] },
    { k: 'can', v: ['coffee', 'energy'] },
  ],
  [
    { k: 'bottle', v: ['cola', 'orange', 'grape'] },
    { k: 'bottle', v: ['orange', 'malt', 'grape'] },
    { k: 'can', v: ['cola', 'juice', 'energy'] },
    { k: 'bottle', v: ['grape', 'yogurt'] },
    { k: 'can', v: ['cola', 'beer'] },
  ],
  [
    { k: 'milk', v: ['milk1000', 'milk500', 'soy'] },
    { k: 'bottle', v: ['milk', 'yogurt', 'coffee'] },
    { k: 'bottle', v: ['milk', 'yogurt', 'coffee'] },
    { k: 'can', v: ['chazuke', 'tea', 'juice'] },
    { k: 'can', v: ['energy', 'cola'] },
  ],
  [
    { k: 'bottle', v: ['water', 'sport', 'water'] },
    { k: 'bottle', v: ['sport', 'water', 'green'] },
    { k: 'bottle', v: ['water', 'coffee', 'malt'] },
    { k: 'can', v: ['juice', 'chazuke', 'tea'] },
    { k: 'can', v: ['juice', 'beer'] },
  ],
];

/** 1 セル（列 × 段）を商品で満たす */
function fillCell(parent, spec, { cx, cellW, y, seed, rnd, back }) {
  const [w, h, d] = DIM[spec.k];
  const pitch = w + 0.0075;
  const n = Math.max(1, Math.floor((cellW - 0.014) / pitch));
  const xs0 = cx - (n - 1) * pitch / 2;
  const rows = 2;
  for (let r = 0; r < rows; r++) {
    const z = Z_FRONT - d / 2 - 0.006 - r * (d + 0.008);
    const count = r === 0 ? n : Math.max(1, Math.round(n * back));
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + (r ? pitch * 0.5 + range(rnd, -0.011, 0.011) : range(rnd, -18e-4, 0.0018));
      if (Math.abs(x - cx) > cellW / 2 - w / 2 + 0.004) continue;
      const it = stockItem(`g:${spec.k}:${spec.v[(i + r) % spec.v.length]}`, () => PRODUCTS[spec.k].build({ seed: seed + r * 149 + i * 23, variant: spec.v[(i + r) % spec.v.length] }));
      it.position.set(x, y, z);
      it.rotation.y = r === 0 ? range(rnd, -0.03, 0.03) : range(rnd, -0.26, 0.26);
      if (r === 0 && rnd() > 0.93) it.rotation.z = range(rnd, -0.06, 0.06);
      parent.add(it);
    }
  }
  return n;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const { doors = 4, len = 2.86, h = 2.05, seed = 6801, density = 1 } = options;
  const back = Math.max(0.3, Math.min(1, 0.6 * density));
  const rnd = rand(seed);
  const g = grp('drink-fridge');
  const HW = len / 2;
  const yBody = 1.80;             // 箱体上端
  const yTopBox = h;              // 広告箱上端

  /* ---------- マテリアル ---------- */
  // 天面は蛍光灯を真正面から受ける「見せるためでない面」。#e8e3d6 の侭だと
  // ケース越しの亮部として目立つ（pick.mjs が shell/skin-top を拾っていた）。
  const skin = MAT.metalPaint('#d5cfc0', { worn: 0.55, repeat: 3 });
  const skinDark = MAT.metalPaint('#b9b4a8', { worn: 0.8, repeat: 2 });
  const alu = MAT.metal('#c9cdcf', { worn: 0.32, dir: 'v', spec: 0.66, repeat: 3 });
  const aluDim = MAT.metal('#aeb3b5', { worn: 0.6, dir: 'h', spec: 0.5, repeat: 2 });
  const steel = MAT.metal('#9fa4a6', { worn: 0.75, repeat: 2 });
  const zinc = MAT.galvanized({ repeat: 2 });
  const dark = MAT.paint('#2f3336', { spec: 0.12, shadowAmt: 0.98, steps: 2 });
  const rubber = MAT.rubber('#26282c', {});
  const chrome = MAT.chrome({});
  const frost = MAT.paint('#eef6f7', {
    map: TEX.frost({ repeat: 2 }).map, normalMap: TEX.frost({ repeat: 2 }).normalMap,
    normalScaleX: 0.7, normalScaleY: 0.7, spec: 0.34, shadowAmt: 0.62, steps: 3, sat: 0.9,
  });
  /* 庫内商品が扉深度で落とされないよう、ガラスはデプスライト（実屈折は維持） */
  const glassMat = MAT.glass({ color: '#dceef2', thickness: 0.009, roughness: 0.045, transmission: 0.94, attenuation: '#cbe7e6' });
  glassMat.depthWrite = false;
  glassMat.userData.isDoorGlass = true;

  /* ============================================================ ①箱体 */
  const shell = grp('shell');
  g.add(shell);
  // 側板
  for (const s of [1, -1]) {
    shell.add(mesh(box(WALL, yBody - 0.16, D - 0.02), skin, { pos: [s * (HW - WALL / 2), 0.16 + (yBody - 0.16) / 2, 0], name: 'side' }));
    shell.add(mesh(box(0.012, yBody - 0.20, 0.024), aluDim, { pos: [s * (HW - 0.006), 0.98, D / 2 - 0.06], name: 'side-trim', cast: false }));
    // 側板の当たり・色褪せ
    dust(shell, { w: 0.5, h: 0.6, pos: [s * (HW + 0.001), 0.72, 0.06], rot: [0, s * PI / 2, 0], kind: 'scratch', color: '#cfc9b8', opacity: 0.3, seed: seed + s * 11, density: 1.4, spread: 0.06 });
    dust(shell, { w: 0.34, h: 0.2, pos: [s * (HW + 0.001), 0.30, D / 2 - 0.16], rot: [0, s * PI / 2, 0], kind: 'dirt', color: '#6f6a5e', opacity: 0.34, seed: seed + s * 17, density: 1.2, spread: 0.04 });
  }
  // 天・底・背
  shell.add(mesh(box(len - 0.01, 0.016, D - 0.01), skin, { pos: [0, yBody - 0.008, 0], name: 'skin-top' }));
  shell.add(mesh(box(len - 0.014, 0.014, D - 0.02), zinc, { pos: [0, yBody - 0.024, 0], name: 'top-lining', cast: false }));
  shell.add(mesh(box(len, 0.030, D), skinDark, { pos: [0, 0.175, 0], name: 'floor-plate' }));
  shell.add(mesh(box(len - 0.01, yBody - 0.16, 0.030), zinc, { pos: [0, 0.16 + (yBody - 0.16) / 2, -D / 2 + 0.015], name: 'back-panel' }));
  // 庫内奥壁（断熱＋蒸発器フィン）
  const cabBack = grp('evaporator', { pos: [0, 0, -D / 2 + WALL + 0.006] });
  g.add(cabBack);
  cabBack.add(mesh(box(len - 2 * WALL, Y_TOP - Y_FLOOR, 0.016), MAT.metal('#c4c9cc', { worn: 0.5, dir: 'h', repeat: 3 }), { pos: [0, (Y_TOP + Y_FLOOR) / 2, 0], name: 'inner-back' }));
  {
    const finMat = MAT.metal('#d5d9da', { worn: 0.4, dir: 'v', spec: 0.6, repeat: 2 });
    const nFin = 46;
    for (let i = 0; i < nFin; i++) {
      const x = -HW + WALL + 0.03 + i * ((len - 2 * WALL - 0.06) / (nFin - 1));
      cabBack.add(mesh(box(0.0035, Y_TOP - Y_FLOOR - 0.10, 0.030), finMat, { pos: [x, (Y_TOP + Y_FLOOR) / 2 + 0.02, 0.024], name: 'fin', cast: false }));
    }
    // フィン下部の霜・着霜の縁・水濡れ
    cabBack.add(mesh(rbox(len - 2 * WALL - 0.04, 0.16, 0.008, 0.004, 2), frost, { pos: [0, Y_FLOOR + 0.10, 0.045], name: 'frost-band' }));
    for (let i = 0; i < 7; i++) {
      cabBack.add(mesh(rbox(range(rnd, 0.05, 0.14), range(rnd, 0.03, 0.08), 0.006, 0.014, 2), frost, { pos: [range(rnd, -1.2, 1.2), range(rnd, Y_FLOOR + 0.2, Y_TOP - 0.2), 0.044], name: 'frost-patch', cast: false }));
    }
    dust(cabBack, { w: len * 0.7, h: 0.20, pos: [0, Y_FLOOR + 0.05, 0.05], kind: 'dirt', color: '#cfe0e2', opacity: 0.4, seed: seed + 21, density: 1.2, spread: 0.04 });
    // ドレン受けの勾配床上・霜の取れ残り
    for (const c of [-0.9, 0, 0.9]) {
      cabBack.add(mesh(cyl(0.030, 0.030, 0.010, 14), MAT.paint('#9aa3a6', { shadowAmt: 0.9 }), { pos: [c, Y_FLOOR + 0.004, 0.02], name: 'defrost-tube', cast: false }));
    }
  }
  // 前面框（アルミアングル）
  const frameH = yBody - 0.20;
  shell.add(mesh(box(len - 0.02, 0.030, 0.030), alu, { pos: [0, yBody - 0.030, D / 2 - 0.020], name: 'frame-head' }));
  shell.add(mesh(box(len - 0.02, 0.034, 0.030), alu, { pos: [0, 0.202, D / 2 - 0.020], name: 'frame-sill' }));
  for (const s of [1, -1]) shell.add(mesh(box(0.030, frameH, 0.030), alu, { pos: [s * (HW - 0.030), 0.20 + frameH / 2, D / 2 - 0.020], name: 'frame-jamb' }));
  // 框のビス・当たり
  row(shell, 9, (len - 0.10) / 8, (i, x) => mesh(cyl(0.0042, 0.0042, 0.008, 8), chrome, { pos: [x, yBody - 0.030, D / 2 - 0.005], rot: [PI / 2, 0, 0], cast: false }), { x0: -HW + 0.05 });
  dust(shell, { w: len * 0.8, h: 0.02, pos: [0, 0.202, D / 2 - 0.006], kind: 'scratch', color: '#f2eee2', opacity: 0.34, seed: seed + 25, density: 1.8, spread: 0.02 });

  /* ============================================================ ②ベース・脚・ドレン */
  const base = grp('base');
  g.add(base);
  base.add(mesh(box(len, 0.06, D - 0.04), skinDark, { pos: [0, 0.135, 0], name: 'plinth' }));
  base.add(mesh(box(len + 0.006, 0.012, 0.026), aluDim, { pos: [0, 0.166, D / 2 - 0.020], name: 'plinth-trim' }));
  base.add(mesh(box(len - 0.04, 0.030, D - 0.10), MAT.paint('#5f6360', { shadowAmt: 0.96, spec: 0.08 }), { pos: [0, 0.088, -0.01], name: 'drain-pan' }));
  base.add(mesh(box(len - 0.10, 0.006, D - 0.18), MAT.paint('#6d7168', { shadowAmt: 0.95, spec: 0.08 }), { pos: [0, 0.106, -0.01], name: 'drain-grating', cast: false }));
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    base.add(mesh(cyl(0.026, 0.032, 0.072, 12), steel, { pos: [sx * (HW - 0.12), 0.036, sz * (D / 2 - 0.11)], name: 'leg' }));
    base.add(mesh(cyl(0.012, 0.012, 0.090, 8), chrome, { pos: [sx * (HW - 0.12), 0.048, sz * (D / 2 - 0.11)], name: 'leg-bolt', cast: false }));
  }
  // ドレンホースと水跡
  base.add(pipe([[-HW + 0.16, 0.10, -D / 2 + 0.06], [-HW + 0.10, 0.06, -D / 2 - 0.02], [-HW + 0.22, 0.03, -D / 2 - 0.06], [-HW + 0.38, 0.022, -D / 2 - 0.03]],
    0.014, MAT.rubber('#3f4247'), { seg: 16, radial: 8, name: 'drain-hose' }));
  dust(base, { w: 0.9, h: 0.20, pos: [-HW + 0.30, 0.004, D / 2 - 0.10], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#6b6558', opacity: 0.42, seed: seed + 31, density: 1.8, spread: 0.03 });
  dust(base, { w: len * 0.9, h: 0.05, pos: [0, 0.006, D / 2 - 0.03], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#7c7466', opacity: 0.34, seed: seed + 32, density: 2.2, spread: 0.02 });
  dust(base, { w: 0.4, h: 0.06, pos: [range(rnd, -0.8, 0.8), 0.118, -0.02], kind: 'rust', color: '#8a5236', opacity: 0.4, seed: seed + 33, density: 1.5, spread: 0.02 });

  /* ============================================================ ③庫内棚・商品 */
  const cab = grp('cabinet');
  g.add(cab);
  const inW = len - 2 * WALL;
  const cellW = (inW - (doors - 1) * 0.014) / doors;
  const cellX = [];
  for (let c = 0; c < doors; c++) cellX.push(-inW / 2 + cellW / 2 + c * (cellW + 0.014));
  // 列仕切板
  for (let c = 0; c < doors - 1; c++) {
    const x = -inW / 2 + (c + 1) * (cellW + 0.014) - 0.007;
    cab.add(mesh(box(0.014, Y_TOP - Y_FLOOR, D - 2 * WALL - 0.02), MAT.plastic('#dfe3e2', { shadowAmt: 0.7 }), { pos: [x, (Y_TOP + Y_FLOOR) / 2, 0], name: 'column-divider' }));
  }
  // 棚（5 段 × 列）と商品
  const ledMat = MAT.lampShade({ color: '#f2fbff', emissive: '#dff0ff', emissiveIntensity: 0.85, steps: 2, shadowAmt: 0.35 });
  const priceMat = MAT.lampShade({ color: '#fff8e6', emissive: '#ffe6ac', emissiveIntensity: 0.62, steps: 2, shadowAmt: 0.5 });
  for (let t = 0; t < TIERS.length; t++) {
    const y = TIERS[t];
    const shelfG = grp('shelf' + t);
    cab.add(shelfG);
    shelfG.add(mesh(box(inW, BOARD_T, D - 2 * WALL - 0.01), MAT.plastic('#e6eae8', { spec: 0.3, shadowAmt: 0.68 }), { pos: [0, y - BOARD_T / 2, 0], name: 'shelf-board' }));
    // 棚前のワイヤー（落ち防止バー）
    for (let c = 0; c < doors; c++) {
      shelfG.add(mesh(cyl(0.0026, 0.0026, cellW - 0.010, 8), chrome, { pos: [cellX[c], y + 0.055, Z_FRONT + 0.006], rot: [0, 0, PI / 2], name: 'guard-bar', cast: false }));
      shelfG.add(mesh(cyl(0.0026, 0.0026, 0.055, 6), chrome, { pos: [cellX[c] - cellW / 2 + 0.012, y + 0.028, Z_FRONT + 0.006], name: 'guard-post', cast: false }));
      shelfG.add(mesh(cyl(0.0026, 0.0026, 0.055, 6), chrome, { pos: [cellX[c] + cellW / 2 - 0.012, y + 0.028, Z_FRONT + 0.006], name: 'guard-post', cast: false }));
    }
    // 棚裏の庫内灯（呼吸）
    const lampG = grp('cab-lamp' + t, { pos: [0, y + 0.010, -D / 2 + WALL + 0.06] });
    cab.add(lampG);
    lampG.add(mesh(box(inW - 0.04, 0.014, 0.026), ledMat, { name: 'led-bar' }));
    lampG.add(mesh(box(inW - 0.02, 0.020, 0.010), aluDim, { pos: [0, 0.004, -0.016], name: 'led-holder', cast: false }));
    lampG.userData.breathe = { speed: 0.36 + t * 0.03, amount: 0.09, phase: (seed % 9) / 9 * 6.28 + t };
    // 列ごとの商品・価格札
    for (let c = 0; c < doors; c++) {
      const spec = COLS[c][t];
      fillCell(cab, spec, { cx: cellX[c], cellW, y, seed: seed + t * 331 + c * 77, rnd, back });
      // LED 価格札（列ごと）
      const tagY = y - 0.008;
      cab.add(mesh(box(cellW - 0.030, 0.024, 0.007), priceMat, { pos: [cellX[c], tagY, Z_FRONT + 0.016], name: 'led-price' }));
      decal(cab, {
        map: TEX.lightPanel({ text: ['150', '130', '200', '110'][(c + t) % 4], bg: '#fff6e2', fg: '#2a2f36', mode: 'led' }),
        w: 0.10, h: 0.021, pos: [cellX[c] + cellW * 0.24, tagY, Z_FRONT + 0.0205], opacity: 0.95, order: (c + t) % 3,
      });
      // 棚券（紙の値札）も併用して隙間なく見せる
      const nTag = Math.max(2, Math.round(cellW / 0.19));
      for (let k = 0; k < nTag; k++) {
        const x = cellX[c] - cellW / 2 + (k + 0.5) * (cellW / nTag);
        const tg = stockItem(`tag:${(k + t) % 5 === 2 ? 'pop' : 'shelf'}`, () => build$1({ seed: seed + t * 57 + c * 91 + k * 7, variant: (k + t) % 5 === 2 ? 'pop' : 'shelf' }));
        tg.position.set(x, y - 0.002, Z_FRONT + 0.022);
        tg.rotation.x = -0.1;
        cab.add(tg);
      }
      // 列の奥行き仕切（2 列目の後ろに押さえバー）
      cab.add(mesh(box(cellW - 0.02, 0.030, 0.006), MAT.plastic('#d8ddda', { shadowAmt: 0.75 }), { pos: [cellX[c], y + 0.015, Z_FRONT - 0.29], name: 'back-bar', cast: false }));
    }
    // 棚の埃・結露水・霜の塊
    dust(cab, { w: inW * 0.8, h: 0.05, pos: [range(rnd, -0.6, 0.6), y + 0.0012, -D / 2 + WALL + 0.08], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8d8f84', opacity: 0.24, seed: seed + t * 13, density: 1.5, spread: 0.03 });
  }
  // 庫内床の勾配・ドレン穴
  cab.add(mesh(box(inW - 0.01, 0.010, D - 2 * WALL), MAT.metal('#b7bcbe', { worn: 0.5, dir: 'h' }), { pos: [0, Y_FLOOR - 0.005, -0.01], name: 'inner-floor' }));
  cab.add(mesh(cyl(0.024, 0.024, 0.014, 14), dark, { pos: [0.0, Y_FLOOR + 0.002, -D / 2 + WALL + 0.07], name: 'drain-hole', cast: false }));
  cab.add(mesh(tor(0.026, 0.004, 6, 16), MAT.metal('#98a0a2', { worn: 0.7 }), { pos: [0.0, Y_FLOOR + 0.004, -D / 2 + WALL + 0.07], rot: [PI / 2, 0, 0], name: 'drain-ring', cast: false }));

  /* ============================================================ ④ガラス扉 */
  const doorW = cellW - 0.008;
  const doorH = Y_TOP - 0.225;
  for (let c = 0; c < doors; c++) {
    const cx = cellX[c];
    const dg = grp('door' + c, { pos: [cx, 0.215 + doorH / 2, D / 2 - 0.018] });
    g.add(dg);
    dg.rotation.y = range(rnd, -4e-3, 0.004);   // 戸車の摩耗で少し垂れる
    // ガラス（実屈折）
    const gl = mesh(box(doorW - 0.028, doorH - 0.028, 0.008), glassMat, { pos: [0, 0, 0.004], name: 'door-glass', cast: false, receive: false });
    gl.userData.noOutline = true;
    dg.add(gl);
    // アングル框（4 本）
    dg.add(mesh(box(doorW, 0.016, 0.022), alu, { pos: [0, doorH / 2 - 0.008, 0], name: 'rail-top' }));
    dg.add(mesh(box(doorW, 0.018, 0.022), alu, { pos: [0, -doorH / 2 + 0.009, 0], name: 'rail-bottom' }));
    for (const s of [-1, 1]) dg.add(mesh(box(0.016, doorH - 0.030, 0.022), alu, { pos: [s * (doorW / 2 - 0.008), 0, 0], name: 'stile' }));
    // 戸当たりゴム（4 面、ガラス外周より一回り小さく）
    for (const s of [-1, 1]) dg.add(mesh(box(0.008, doorH - 0.040, 0.010), rubber, { pos: [s * (doorW / 2 - 0.020), 0, -0.012], name: 'gasket-v', cast: false }));
    dg.add(mesh(box(doorW - 0.040, 0.008, 0.010), rubber, { pos: [0, doorH / 2 - 0.026, -0.012], name: 'gasket-t', cast: false }));
    dg.add(mesh(box(doorW - 0.040, 0.008, 0.010), rubber, { pos: [0, -doorH / 2 + 0.026, -0.012], name: 'gasket-b', cast: false }));
    // 蝶番（外側 3 箇所）
    for (let k = 0; k < 3; k++) {
      const hy = -doorH / 2 + 0.14 + k * (doorH - 0.28) / 2;
      dg.add(mesh(box(0.026, 0.040, 0.020), steel, { pos: [-doorW / 2 + 0.006, hy, -0.01], name: 'hinge', cast: false }));
      dg.add(mesh(cyl(0.0055, 0.0055, 0.044, 8), chrome, { pos: [-doorW / 2 + 0.006, hy, -0.01], name: 'hinge-pin', cast: false }));
    }
    // 把手（縦バー＋スタッド）
    const hx = doorW / 2 - 0.048;
    dg.add(mesh(cyl(0.0098, 0.0098, 0.300, 12), chrome, { pos: [hx, 0.02, 0.028], name: 'handle-bar' }));
    dg.add(mesh(cyl(0.0098, 0.0098, 0.300, 12), chrome, { pos: [hx - 0.048, 0.02, 0.028], name: 'handle-bar-b', cast: false }));
    for (const hy of [0.15, -0.11]) {
      dg.add(mesh(cyl(0.0075, 0.0075, 0.032, 8), alu, { pos: [hx, 0.02 + hy, 0.012], rot: [PI / 2, 0, 0], name: 'handle-stud', cast: false }));
      dg.add(mesh(cyl(0.0075, 0.0075, 0.032, 8), alu, { pos: [hx - 0.048, 0.02 + hy, 0.012], rot: [PI / 2, 0, 0], name: 'handle-stud', cast: false }));
    }
    // 錠前（下側）
    dg.add(mesh(cyl(0.0125, 0.0125, 0.014, 12), MAT.metal('#b6b9bb', { worn: 0.6 }), { pos: [hx - 0.024, -doorH / 2 + 0.075, 0.014], rot: [PI / 2, 0, 0], name: 'lock' }));
    dg.add(mesh(box(0.004, 0.012, 0.006), dark, { pos: [hx - 0.024, -doorH / 2 + 0.075, 0.021], name: 'keyway', cast: false }));
    // 「つめたい」表示（発光、呼吸）
    const toneG = grp('tone-sign', { pos: [-doorW * 0.16, doorH / 2 - 0.070, 0.012] });
    dg.add(toneG);
    const toneMat = MAT.lampShade({
      map: TEX.lightPanel({ text: c % 2 ? 'つめたい' : 'チルド', bg: '#dff0ff', fg: '#1f5b8a', mode: 'sign' }),
      color: '#ffffff', emissive: '#cfeaff', emissiveIntensity: 0.55, steps: 2, shadowAmt: 0.4,
    });
    toneG.add(mesh(rbox(0.20, 0.048, 0.008, 0.004, 2), toneMat, { name: 'tone-face' }));
    toneG.userData.breathe = { speed: 0.44, amount: 0.12, phase: c * 1.4 + (seed % 5) };
    // 指紋・結露・霜（ガラス表面）
    dust(dg, { w: 0.26, h: 0.30, pos: [range(rnd, -0.12, 0.12), range(rnd, -0.1, 0.25), 0.0092], kind: 'scratch', color: '#ffffff', opacity: 0.20, seed: seed + c * 19, density: 1.3, spread: 0.04 });
    dust(dg, { w: 0.30, h: 0.22, pos: [range(rnd, -0.16, 0.16), -doorH * 0.30, 0.0092], kind: 'dirt', color: '#e6f4f6', opacity: 0.30, seed: seed + c * 23, density: 1.1, spread: 0.03 });
    // 結露水滴（小柱で打つ）
    for (let i = 0; i < 14; i++) {
      const dy = range(rnd, -doorH / 2 + 0.05, doorH / 2 - 0.10);
      dg.add(mesh(cyl(0.0016, 0.0026, range(rnd, 0.004, 0.014), 6), MAT.water({ opacity: 0.75 }), {
        pos: [range(rnd, -doorW / 2 + 0.03, doorW / 2 - 0.03), dy, 0.0092], rot: [PI / 2, 0, 0], cast: false, receive: false,
      }));
    }
    // 下部の着霜（ガラス内面に白い帯）
    dg.add(mesh(rbox(doorW - 0.05, 0.085, 0.005, 0.02, 2), frost, { pos: [0, -doorH / 2 + 0.055, -6e-3], name: 'glass-frost', cast: false }));
    // 框の褪色・ゴムの変色
    dust(dg, { w: doorW * 0.6, h: 0.02, pos: [0, doorH / 2 - 0.008, 0.012], kind: 'chip', color: '#c6bfa9', opacity: 0.42, seed: seed + c * 29, density: 1.3, spread: 0.02 });
  }
  // 扉間の戸当たり隙間（光る線）と枠下ドレン
  for (let c = 0; c < doors - 1; c++) {
    const x = (cellX[c] + cellX[c + 1]) / 2;
    g.add(mesh(box(0.010, doorH, 0.016), aluDim, { pos: [x, 0.215 + doorH / 2, D / 2 - 0.020], name: 'mullion', cast: false }));
  }

  /* ============================================================ ⑤上部広告・排気 */
  const topG = grp('top-box');
  g.add(topG);
  topG.add(mesh(box(len - 0.006, yTopBox - yBody, D - 0.10), skin, { pos: [0, (yBody + yTopBox) / 2, -0.02], name: 'box' }));
  topG.add(mesh(box(len + 0.008, 0.014, D - 0.06), aluDim, { pos: [0, yTopBox + 0.006, -0.01], name: 'crown' }));
  {
    const adW = len - 0.10;
    const adMat = MAT.poster({
      map: TEX.poster({ title: 'つめたい 春の飲料', sub: 'COLD DRINKS · SPRING', bg: '#eef6fb', accent: PAL.storeBand, seed }),
      steps: 3, sat: 0.99, spec: 0.2, shadowAmt: 0.6,
    });
    topG.add(mesh(box(adW, 0.20, 0.012), adMat, { pos: [0, yBody + 0.135, D / 2 - 0.104], name: 'ad-face' }));
    topG.add(mesh(box(adW + 0.02, 0.012, 0.020), alu, { pos: [0, yBody + 0.242, D / 2 - 0.106], name: 'ad-hood' }));
    topG.add(mesh(box(0.012, 0.216, 0.020), alu, { pos: [-adW / 2 - 0.006, yBody + 0.134, D / 2 - 0.104], name: 'ad-side' }));
    topG.add(mesh(box(0.012, 0.216, 0.020), alu, { pos: [adW / 2 + 0.006, yBody + 0.134, D / 2 - 0.104], name: 'ad-side' }));
    // 内側蛍灯（呼吸）・褪色・貼り直し
    const adLamp = grp('ad-lamp', { pos: [0, yBody + 0.18, D / 2 - 0.16] });
    topG.add(adLamp);
    adLamp.add(mesh(box(adW - 0.06, 0.018, 0.030), ledMat, { name: 'ad-tube' }));
    adLamp.userData.breathe = { speed: 0.30, amount: 0.10, phase: (seed % 4) };
    dust(topG, { w: adW * 0.7, h: 0.16, pos: [range(rnd, -0.6, 0.6), yBody + 0.14, D / 2 - 0.097], kind: 'dirt', color: '#e4dcc6', opacity: 0.34, seed: seed + 51, density: 0.8 });
    dust(topG, { w: 0.22, h: 0.05, pos: [adW / 2 - 0.10, yBody + 0.045, D / 2 - 0.097], kind: 'chip', color: '#cfc6ae', opacity: 0.5, seed: seed + 52, density: 1.2 });
  }
  // 排気グリル（天面と背面）
  grill(topG, { w: len - 0.30, h: 0.18, nx: 2, ny: 11, bar: 0.008, mat: aluDim, pos: [0, yTopBox + 0.0135, -0.06], rot: [-PI / 2, 0, 0] });
  grill(topG, { w: len - 0.40, h: 0.14, nx: 2, ny: 8, bar: 0.007, mat: aluDim, pos: [0, yBody + 0.09, -D / 2 + 0.004], rot: [0, PI, 0] });
  dust(topG, { w: len * 0.7, h: 0.20, pos: [0, yTopBox + 0.014, 0.06], rot: [-PI / 2, 0, 0.4], kind: 'dirt', color: '#7e776a', opacity: 0.42, seed: seed + 55, density: 2.0, spread: 0.05 });
  // 天面の点検口・ビス
  topG.add(mesh(rbox(0.36, 0.010, 0.26, 0.005, 2), alu, { pos: [len / 2 - 0.30, yTopBox + 0.016, 0.02], name: 'service-hatch' }));
  row(topG, 4, 0.10, (i, x) => mesh(cyl(0.004, 0.004, 0.007, 8), chrome, { pos: [x, yTopBox + 0.022, 0.02], cast: false }), { x0: len / 2 - 0.44 });

  /* ============================================================ ⑥背面（機械室） */
  const rear = grp('rear');
  g.add(rear);
  rear.add(mesh(box(len - 0.14, 0.50, 0.020), zinc, { pos: [0, 0.42, -D / 2 - 0.010], name: 'machine-cover' }));
  rear.add(mesh(box(0.44, 0.30, 0.14), MAT.metalPaint('#7f8489', { worn: 0.8, repeat: 2 }), { pos: [-HW + 0.42, 0.32, -D / 2 + 0.02], name: 'compressor-bulge' }));
  grill(rear, { w: 0.40, h: 0.24, nx: 2, ny: 9, bar: 0.007, mat: aluDim, pos: [-HW + 0.42, 0.32, -D / 2 + 0.095], rot: [0, PI, 0] });
  rear.add(pipe([[HW - 0.32, 0.30, -D / 2 + 0.02], [HW - 0.30, 0.62, -D / 2 - 0.02], [HW - 0.40, 0.86, -D / 2 - 0.03], [HW - 0.56, 1.00, -D / 2 + 0.01]],
    0.011, MAT.metal('#c0a274', { worn: 0.7 }), { seg: 18, radial: 8, name: 'refrigerant-pipe' }));
  rear.add(mesh(box(0.20, 0.09, 0.006), MAT.poster({ map: TEX.signboard({ text: '春日冷研 4T', sub: 'MODEL KR-4T · R32', bg: '#dfe3e0', fg: '#3b4045' }), steps: 2 }), { pos: [HW - 0.42, 1.24, -D / 2 - 0.020], rot: [0, PI, 0], name: 'name-plate' }));
  dust(rear, { w: 0.6, h: 0.4, pos: [-HW + 0.42, 0.20, -D / 2 - 0.020], rot: [0, PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.44, seed: seed + 61, density: 1.8, spread: 0.05 });
  dust(rear, { w: len * 0.8, h: 0.3, pos: [0, 0.9, -D / 2 - 0.022], rot: [0, PI, 0], kind: 'dirt', color: '#6d6759', opacity: 0.4, seed: seed + 62, density: 2.2, spread: 0.06 });
  // 電源コードとプラグ
  rear.add(pipe([[-HW + 0.20, 0.20, -D / 2 - 0.02], [-HW + 0.10, 0.05, -D / 2 - 0.09], [-HW + 0.26, 0.024, -D / 2 - 0.16], [-HW + 0.52, 0.022, -D / 2 - 0.12]],
    0.007, MAT.rubber('#2d3134'), { seg: 18, radial: 7, name: 'power-cord' }));

  /* ---------- 前面の最终经年：下部の泥はね・手あか ---------- */
  dust(g, { w: len * 0.5, h: 0.05, pos: [range(rnd, -0.9, 0.9), 0.188, D / 2 - 0.014], kind: 'dirt', color: '#6a6357', opacity: 0.4, seed: seed + 71, density: 1.6, spread: 0.02 });
  dust(g, { w: 0.30, h: 0.10, pos: [HW - 0.16, 0.60, D / 2 - 0.010], kind: 'scratch', color: '#f7f4e9', opacity: 0.22, seed: seed + 72, density: 1.4, spread: 0.03 });

  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { build, build as default, meta };
