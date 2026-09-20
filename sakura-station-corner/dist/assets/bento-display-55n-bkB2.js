import { g as grp, M as MAT, T as TEX, P as PAL, D as DoubleSide, m as mesh, b as box, n as range, i as grill, c as cyl, r as rbox, h as decal, a9 as stockItem, A as row, q as finish, w as weather, z as rand } from './index-CxdYZv8e.js';
import { P as P_BENTO } from './bento-box-Du8ebPtk.js';
import { P as P_ONI } from './onigiri-BSSSE3wX.js';
import { P as P_SUSHI } from './sushi-tray-Df2NOWlz.js';
import { P as P_DELI } from './deli-tray-CFZianhN.js';
import { build as build$1 } from './price-tag-C8RTtJvi.js';

//  assets/interior/bento-display.js —— 弁当・おにぎり・寿司の冷蔵ケース（前傾ガラス＋冷気カーテン／3 段カスケード）
//  ・原点 = 床面中心、+Y 上、正面 +Z（客通路側）
//  ・構造：下台ボデー（点検口・格栅・キャスタ・泥はね）／後方の冷気リザー（スリット・霜・温度表示・段 LED）／
//        3 段のカスケードデッキ（アルミ框・前面ドレン沟・水抜き）／前傾ガラス＋側チーク／吊り透明帯（冷気カーテン）／
//        上蓋広告（TEX.poster）＋蛍光管（breathe）
//  ・陳列：bento-box / deli-tray / onigiri / sushi-tray を前後列で隙間なく。手前は品出し順の寄せ（突き出し・傾き）、
//        奥には取り出し済みの空トレイと値札、棚面には水滴・霜・埃

const meta = {
  id: 'bento-display',
  real: [2.48, 1.78, 0.75],
  origin: 'ground-center',
};

const PI = Math.PI;
const PRODUCTS = { bento: P_BENTO, oni: P_ONI, sushi: P_SUSHI, deli: P_DELI };
const DIM = {};
for (const k in PRODUCTS) DIM[k] = (PRODUCTS[k].meta && PRODUCTS[k].meta.real) || [0.15, 0.05, 0.11];

/* ---------- 寸法 ---------- */
const D = 0.68;
const WALL = 0.042;
const DECK = [0.620, 0.950, 1.280];        // 各段のデッキ上面
const Z_BACK = -0.29;                      // デッキ奥端
const ZF = [0.296, 0.262, 0.228];           // 段ごとの商品フロント（カスケードに後退）
const Y_BOT = DECK[0] - 0.030;              // ガラス下端
const Y_HDR = DECK[2] + 0.170;              // ガラス上端＝見出し下
const Z_BOT = D / 2 - 0.016;                // ガラス下端の z（0.324）
const Z_TOP = D / 2 - 0.136;                // ガラス上端の z（0.204）

/** 前傾ガラス面上の z（高さ y から） */
const glassZ = (y) => Z_BOT + (y - Y_BOT) * (Z_TOP - Z_BOT) / (Y_HDR - Y_BOT);

const WS = 1.4;
function dust(parent, o) {
  return weather(parent, { spread: 0.014, ...o, w: (o.w || 1) / WS, h: (o.h || 1) / WS });
}

/* --------------------------------------------------------------- 陳列 */
/** plan = [{k, v, to, rows, gap}] を区画幅割合で並べる */
function stockTier(parent, plan, { x0, x1, y, zf, seed, rnd, back }) {
  let cursor = x0;
  for (const seg of plan) {
    const [w, h, d] = DIM[seg.k];
    const segX1 = Math.min(x1, x0 + seg.to * (x1 - x0));
    const pitch = w + (seg.gap ?? 0.007);
    const n = Math.max(1, Math.floor((segX1 - cursor - 0.006) / pitch));
    const xs0 = cursor + (segX1 - cursor - (n - 1) * pitch) / 2;
    for (let r = 0; r < (seg.rows || 2); r++) {
      const z = zf - d / 2 - 0.006 - r * (d + 0.010);
      const count = r === 0 ? n : Math.max(1, Math.round(n * back));
      for (let i = 0; i < count; i++) {
        const x = xs0 + i * pitch + (r ? pitch * 0.5 + range(rnd, -0.012, 0.012) : range(rnd, -3e-3, 0.003));
        const it = stockItem(`g:${seg.k}:${seg.v[(i + r * 2) % seg.v.length]}`, () => PRODUCTS[seg.k].build({ seed: seed + r * 157 + i * 29, variant: seg.v[(i + r * 2) % seg.v.length] }));
        // 手前は「品出し順の寄せ」＝前へ突き出し、少し傾いて並ぶ
        const push = r === 0 ? range(rnd, -4e-3, 0.011) : 0;
        it.position.set(x, y, z + push);
        it.rotation.y = r === 0 ? range(rnd, -0.06, 0.06) : range(rnd, -0.3, 0.30);
        if (r === 0 && rnd() > 0.9) it.rotation.z = range(rnd, -0.03, 0.035);
        parent.add(it);
      }
    }
    cursor = segX1;
  }
}

/** 奥に残った空トレイ（取り出し済み）＋値札 */
function emptyTray(parent, { x, y, z, zf, w, seed, rnd }, mats) {
  const t = grp('empty-tray', { pos: [x, y, z] });
  parent.add(t);
  t.add(mesh(rbox(w, 0.012, 0.13, 0.004, 2), mats.tray, { pos: [0, 0.006, 0], name: 'tray' }));
  t.add(mesh(box(w - 0.020, 0.003, 0.13 - 0.020), mats.trayIn, { pos: [0, 0.0126, 0], name: 'tray-inner', cast: false }));
  for (let i = 0; i < 5; i++) {   // 残ったご飯粒・味噌
    t.add(mesh(cyl(0.0035, 0.0022, 0.0022, 6), MAT.food({ color: '#f4ead6', shadowAmt: 0.9 }), {
      pos: [range(rnd, -w / 2 + 0.02, w / 2 - 0.02), 0.0142, range(rnd, -0.05, 0.05)], cast: false, receive: false,
    }));
  }
  dust(t, { w: w * 0.7, h: 0.09, pos: [0, 0.0145, 0], rot: [-PI / 2, 0, 0.3], kind: 'scratch', color: '#f3efe4', opacity: 0.35, seed: seed + 3, density: 1.4 });
  const tg = build$1({ seed: seed + 9, variant: 'pop' });
  tg.position.set(x + w * 0.26, y + 0.004, zf + 0.030);
  tg.rotation.x = -0.13;
  parent.add(tg);
  return t;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const { len = 2.4, tiers = 3, seed = 5501, density = 1 } = options;
  const back = Math.max(0.25, Math.min(0.75, 0.45 * density));
  const rnd = rand(seed);
  const g = grp('bento-display');
  const HW = len / 2;
  const topY = Y_HDR;

  const mats = {
    skin: MAT.metalPaint('#e6e1d3', { worn: 0.55, repeat: 3 }),
    steel: MAT.metal('#b9bcbb', { worn: 0.6, dir: 'h', repeat: 2 }),
    alu: MAT.metal('#cfd3d4', { worn: 0.3, dir: 'v', spec: 0.66, repeat: 3 }),
    aluDim: MAT.metal('#adb2b3', { worn: 0.6, dir: 'h', spec: 0.5, repeat: 2 }),
    chrome: MAT.chrome({}),
    deckPlate: MAT.plastic('#eae4d6', { spec: 0.3, shadowAmt: 0.66, steps: 3 }),
    tray: MAT.plastic('#f2eee4', { spec: 0.36, specPower: 66, shadowAmt: 0.6 }),
    trayIn: MAT.plastic('#e2ddd0', { spec: 0.2, shadowAmt: 0.82, steps: 2 }),
    rubber: MAT.rubber('#2c2f33', {}),
    dark: MAT.paint('#33373a', { spec: 0.14, shadowAmt: 0.96, steps: 2 }),
    glass: MAT.glassLite({ color: '#e2f1f4', opacity: 0.2, spec: 1, specPower: 230, specCut: 0.05, sheen: 0.4, rim: 0.5, steps: 2, side: DoubleSide }),
    curtain: MAT.glassLite({ color: '#eaf6f8', opacity: 0.13, spec: 0.9, specPower: 200, sheen: 0.3, steps: 2, side: DoubleSide }),
    frost: MAT.paint('#eef6f7', {
      map: TEX.frost({ repeat: 2 }).map, normalMap: TEX.frost({ repeat: 2 }).normalMap,
      normalScaleX: 0.6, normalScaleY: 0.6, spec: 0.3, shadowAmt: 0.6, steps: 3, sat: 0.9,
    }),
    led: MAT.lampShade({ color: '#f4fbff', emissive: '#e2f2ff', emissiveIntensity: 0.9, steps: 2, shadowAmt: 0.3 }),
    priceLed: MAT.lampShade({ color: '#fff8e8', emissive: '#ffe4a8', emissiveIntensity: 0.62, steps: 2, shadowAmt: 0.5 }),
    ad: MAT.poster({
      map: TEX.poster({ title: 'おべんとう・おにぎり', sub: 'FRESH EVERY MORNING', bg: '#f8f2e2', accent: PAL.storeBand3, seed }),
      steps: 3, sat: 0.99, spec: 0.18, shadowAmt: 0.6,
    }),
  };

  /* ==================================================== ①下台ボデー */
  const base = grp('base');
  g.add(base);
  base.add(mesh(box(len, DECK[0] - 0.06, D), mats.skin, { pos: [0, (DECK[0] - 0.06) / 2 + 0.03, 0], name: 'body' }));
  base.add(mesh(box(len + 0.010, 0.022, D + 0.012), mats.alu, { pos: [0, DECK[0] - 0.032, 0], name: 'crown-alu' }));
  base.add(mesh(box(len - 0.02, 0.09, 0.014), mats.aluDim, { pos: [0, 0.075, D / 2 - 0.010], name: 'kick-plate' }));
  base.add(mesh(box(len + 0.006, 0.012, 0.022), mats.steel, { pos: [0, 0.126, D / 2 - 0.012], name: 'kick-trim' }));
  for (const s of [1, -1]) {
    base.add(mesh(box(0.010, 0.30, 0.42), mats.aluDim, { pos: [s * (HW + 0.0015), 0.30, 0.02], name: 'access-panel' }));
    for (let i = 0; i < 4; i++) {
      base.add(mesh(box(0.005, 0.008, 0.30), mats.dark, { pos: [s * (HW + 0.009), 0.20 + i * 0.05, 0.02], name: 'louver', cast: false }));
    }
    dust(base, { w: 0.4, h: 0.3, pos: [s * (HW + 0.011), 0.28, range(rnd, -0.1, 0.14)], rot: [0, s * PI / 2, 0], kind: 'scratch', color: '#cfc9ba', opacity: 0.3, seed: seed + s * 13, density: 1.5, spread: 0.05 });
  }
  grill(base, { w: len - 0.7, h: 0.13, nx: 2, ny: 12, bar: 0.007, mat: mats.aluDim, pos: [0, 0.24, D / 2 - 0.004] });
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    base.add(mesh(cyl(0.026, 0.026, 0.060, 10), mats.rubber, { pos: [sx * (HW - 0.10), 0.030, sz * (D / 2 - 0.10)], name: 'caster' }));
    base.add(mesh(cyl(0.009, 0.009, 0.070, 8), mats.chrome, { pos: [sx * (HW - 0.10), 0.048, sz * (D / 2 - 0.10)], name: 'caster-bolt', cast: false }));
  }
  dust(base, { w: len * 0.9, h: 0.06, pos: [range(rnd, -0.5, 0.5), 0.045, D / 2 - 0.003], kind: 'dirt', color: '#6a6357', opacity: 0.42, seed: seed + 21, density: 2.0, spread: 0.03 });
  dust(base, { w: 0.36, h: 0.22, pos: [-HW + 0.36, 0.40, D / 2 - 0.003], kind: 'scratch', color: '#f6f2e6', opacity: 0.24, seed: seed + 22, density: 1.4, spread: 0.04 });
  dust(base, { w: 0.5, h: 0.10, pos: [HW - 0.40, 0.15, D / 2 - 0.003], kind: 'chip', color: '#c9bda6', opacity: 0.4, seed: seed + 23, density: 1.4, spread: 0.03 });

  /* ==================================================== ②冷気リザー（背面） */
  const riser = grp('riser');
  g.add(riser);
  riser.add(mesh(box(len - 2 * WALL, topY - DECK[0] + 0.18, WALL), MAT.metal('#c6cbcd', { worn: 0.45, dir: 'v', repeat: 2 }), { pos: [0, (topY + DECK[0]) / 2 + 0.06, -D / 2 + WALL / 2 + 0.008], name: 'riser-plate' }));
  for (let t = 0; t < tiers; t++) {
    const y = DECK[t] + 0.20;
    for (let k = 0; k < 3; k++) {
      riser.add(mesh(box(len - 2 * WALL - 0.10, 0.013, 0.010), mats.dark, { pos: [0, y - 0.06 + k * 0.028, -D / 2 + WALL + 0.014], name: 'air-slot', cast: false }));
    }
    riser.add(mesh(rbox(len - 2 * WALL - 0.08, 0.05, 0.008, 0.006, 2), mats.frost, { pos: [0, y - 0.02, -D / 2 + WALL + 0.020], name: 'riser-frost', cast: false }));
    const lamp = grp('deck-led' + t, { pos: [0, DECK[t] + 0.248, -D / 2 + WALL + 0.05] });
    riser.add(lamp);
    lamp.add(mesh(box(len - 2 * WALL - 0.06, 0.014, 0.024), mats.led, { name: 'led-tube' }));
    lamp.add(mesh(box(len - 2 * WALL - 0.04, 0.020, 0.008), mats.aluDim, { pos: [0, 0.006, -0.014], name: 'led-cover', cast: false }));
    lamp.userData.breathe = { speed: 0.38, amount: 0.10, phase: t * 1.9 + (seed % 5) };
  }
  {
    const p = grp('temp-panel', { pos: [-HW + 0.30, topY + 0.02, -D / 2 + WALL + 0.030] });
    riser.add(p);
    p.add(mesh(rbox(0.24, 0.075, 0.014, 0.005, 2), mats.dark, { name: 'panel-body' }));
    p.add(mesh(box(0.19, 0.046, 0.006), MAT.ledOn('#8fe3b6'), { pos: [-0.018, 0, 0.009], name: 'temp-led' }));
    decal(p, { map: TEX.lightPanel({ text: '8℃', bg: '#0e1b16', fg: '#a8f0c8', mode: 'led' }), w: 0.17, h: 0.042, pos: [-0.018, 0, 0.013], opacity: 0.98 });
    p.add(mesh(cyl(0.006, 0.006, 0.008, 8), mats.chrome, { pos: [0.092, 0.024, 0.008], rot: [PI / 2, 0, 0], name: 'panel-led', cast: false }));
    p.userData.breathe = { speed: 0.7, amount: 0.28, phase: seed % 3 };
  }

  /* ==================================================== ③カスケード デッキ */
  const x0 = -HW + 0.075, x1 = HW - 0.075;
  for (let t = 0; t < tiers; t++) {
    const y = DECK[t];
    const zf = ZF[t];
    const dp = zf + 0.020;                      // デッキ前端
    const depth = dp - Z_BACK;
    const T = grp('deck' + t);
    g.add(T);
    T.add(mesh(rbox(len - 2 * WALL + 0.02, 0.020, depth, 0.004, 2), mats.deckPlate, { pos: [0, y - 0.010, (dp + Z_BACK) / 2], name: 'deck' }));
    T.add(mesh(box(len - 2 * WALL + 0.02, 0.026, 0.012), mats.alu, { pos: [0, y - 0.008, dp - 0.006], name: 'deck-edge' }));
    T.add(mesh(box(len - 2 * WALL - 0.02, 0.006, 0.010), mats.aluDim, { pos: [0, y - 0.021, dp - 0.020], name: 'drain-channel', cast: false }));
    for (let i = 0; i < 3; i++) {
      T.add(mesh(cyl(0.004, 0.004, 0.007, 8), mats.chrome, { pos: [-0.6 + i * 0.6, y - 0.017, dp - 0.020], name: 'drain-hole', cast: false }));
    }
    T.add(mesh(box(len - 2 * WALL, 0.012, 0.030), mats.alu, { pos: [0, y - 0.028, Z_BACK + 0.12], name: 'deck-bracket', cast: false }));
    for (const s of [-1, 1]) T.add(mesh(box(0.014, 0.060, 0.030), mats.steel, { pos: [s * (HW - WALL - 0.02), y - 0.048, Z_BACK + 0.12], name: 'deck-arm', cast: false }));

    let plan;
    if (t === 0) plan = [{ k: 'bento', v: ['chicken', 'tendon', 'salad', 'pasta'], to: 0.56, rows: 2 },
      { k: 'deli', v: ['karaage', 'hamburgu', 'potato'], to: 1.0, rows: 2 }];
    else if (t === 1) plan = [{ k: 'oni', v: ['salmon', 'tunamayo', 'kombu', 'mentaiko'], to: 0.78, rows: 2, gap: 0.005 },
      { k: 'sushi', v: ['nigiri6', 'roll4', 'chirashi'], to: 1.0, rows: 2 }];
    else plan = [{ k: 'sushi', v: ['sashimi5', 'nigiri6', 'roll4'], to: 0.40, rows: 2 },
      { k: 'bento', v: ['ekiben', 'sashimi', 'salad'], to: 0.80, rows: 2 },
      { k: 'deli', v: ['edamame', 'salad', 'sushi-roll'], to: 1.0, rows: 2 }];
    stockTier(T, plan, { x0, x1, y, zf, seed: seed + t * 401, rnd, back });

    emptyTray(T, { x: x0 + 0.28 + t * 0.42, y: y + 0.001, z: Z_BACK + 0.085, zf, w: 0.34, seed: seed + t * 71, rnd }, mats);

    /* 段ごとの値札（デッキ前框に立てる） */
    const nTag = 6;
    for (let k = 0; k < nTag; k++) {
      const x = x0 + (k + 0.5) * ((x1 - x0) / nTag);
      const tg = stockItem(`tag:${(k + t) % 4 === 1 ? 'new100' : 'shelf'}`, () => build$1({ seed: seed + t * 61 + k * 17, variant: (k + t) % 4 === 1 ? 'new100' : 'shelf' }));
      tg.position.set(x, y - 0.004, zf + 0.028);
      tg.rotation.x = -0.15;
      tg.rotation.y = range(rnd, -0.05, 0.05);
      T.add(tg);
    }
    T.add(mesh(box(len - 2 * WALL - 0.10, 0.016, 0.006), mats.priceLed, { pos: [0, y + 0.026, zf + 0.014], name: 'led-strip' }));

    /* 水滴・霜・埃 */
    for (let i = 0; i < 9; i++) {
      T.add(mesh(cyl(0.0022, 0.0034, range(rnd, 0.005, 0.015), 6), MAT.water({ opacity: 0.72 }), {
        pos: [range(rnd, x0, x1), y + 0.0012, range(rnd, Z_BACK + 0.06, zf - 0.02)],
        rot: [PI / 2, 0, 0], cast: false, receive: false, name: 'drip',
      }));
    }
    dust(T, { w: (x1 - x0) * 0.8, h: 0.06, pos: [range(rnd, -0.5, 0.5), y + 0.0012, Z_BACK + 0.10], rot: [-PI / 2, 0, 0.2], kind: 'dirt', color: '#9b9b90', opacity: 0.26, seed: seed + t * 29, density: 1.5, spread: 0.03 });
    T.add(mesh(rbox(0.42, 0.006, 0.10, 0.02, 2), mats.frost, { pos: [x1 - 0.36, y + 0.0015, Z_BACK + 0.07], name: 'deck-frost', cast: false }));
  }

  /* ==================================================== ④前傾ガラス＋冷気カーテン */
  {
    const gh = Y_HDR - Y_BOT;
    const lenG = Math.hypot(gh, Z_BOT - Z_TOP);
    const lean = -Math.atan2(Z_BOT - Z_TOP, gh);
    const cy = (Y_HDR + Y_BOT) / 2;
    const cz = (Z_TOP + Z_BOT) / 2;
    const gp = grp('sneeze-glass');
    g.add(gp);
    const pane = mesh(box(len - 2 * WALL + 0.02, lenG, 0.010), mats.glass, { pos: [0, cy, cz], name: 'front-glass' });
    pane.rotation.x = lean;
    pane.castShadow = false;
    pane.userData.noOutline = true;
    gp.add(pane);
    // 上框・下框・側チーク
    gp.add(mesh(box(len - 2 * WALL + 0.05, 0.016, 0.026), mats.alu, { pos: [0, Y_HDR - 0.008, Z_TOP - 0.004], name: 'glass-head-rail' }));
    gp.add(mesh(box(len - 2 * WALL + 0.05, 0.014, 0.024), mats.alu, { pos: [0, Y_BOT + 0.004, Z_BOT + 0.002], name: 'glass-sill-rail' }));
    for (const s of [-1, 1]) {
      const cheek = mesh(rbox(0.012, lenG, 0.15, 0.005, 2), mats.glass, { pos: [s * (HW - WALL + 0.005), cy, cz], name: 'cheek' });
      cheek.rotation.x = lean;
      cheek.castShadow = false;
      cheek.userData.noOutline = true;
      gp.add(cheek);
      gp.add(mesh(box(0.016, gh + 0.03, 0.018), mats.alu, { pos: [s * (HW - WALL + 0.005), cy, Z_BOT + 0.006], name: 'cheek-post' }));
    }
    /* 冷気カーテン：ガラス内面に並行して吊られた透明帯（9 枚、わずかに反る） */
    const nC = 9;
    const spanX = len - 2 * WALL - 0.06;
    for (let i = 0; i < nC; i++) {
      const x = -spanX / 2 + (i + 0.5) * (spanX / nC);
      const strip = mesh(box(spanX / nC - 0.008, gh - 0.03, 0.004), mats.curtain, { pos: [x, cy - 0.010, cz - 0.011], name: 'curtain-strip' + i });
      strip.rotation.x = lean + range(rnd, -0.012, 0.012);
      strip.rotation.z = range(rnd, -0.01, 0.01);
      strip.castShadow = false;
      strip.receiveShadow = false;
      strip.userData.noOutline = true;
      gp.add(strip);
    }
    // 吹出口（レール＋ノズル列）
    gp.add(mesh(box(len - 2 * WALL, 0.020, 0.030), mats.aluDim, { pos: [0, Y_HDR - 0.002, Z_TOP + 0.012], name: 'curtain-rail' }));
    for (let i = 0; i < 16; i++) {
      gp.add(mesh(box(len - 2 * WALL - 0.08, 0.005, 0.007), mats.dark, { pos: [0, Y_HDR - 0.013, Z_TOP + 0.004 - i * 0.0016], name: 'nozzle', cast: false }));
    }
    // ガラスの指紋・水滴・霜
    dust(gp, { w: 0.34, h: 0.30, pos: [range(rnd, -0.6, 0.6), cy + 0.06, cz + 0.008], kind: 'scratch', color: '#ffffff', opacity: 0.22, seed: seed + 41, density: 1.4, spread: 0.05 });
    for (let i = 0; i < 16; i++) {
      const yy = range(rnd, Y_BOT + 0.06, Y_HDR - 0.06);
      gp.add(mesh(cyl(0.0018, 0.0028, range(rnd, 0.005, 0.013), 6), MAT.water({ opacity: 0.7 }), {
        pos: [range(rnd, -HW + 0.1, HW - 0.1), yy, glassZ(yy) + 0.007], rot: [PI / 2, 0, 0], cast: false, receive: false, name: 'glass-drip',
      }));
    }
    gp.add(mesh(rbox(len - 2 * WALL - 0.2, 0.06, 0.005, 0.02, 2), mats.frost, { pos: [0.2, Y_BOT + 0.05, cz + (Z_BOT - Z_TOP) * 0.45], name: 'glass-frost', cast: false }));
  }

  /* ==================================================== ⑤上蓋広告 */
  {
    const headY = topY + 0.012;
    const hh = 0.30;
    const hd = grp('header');
    g.add(hd);
    hd.add(mesh(box(len, hh, 0.16), mats.skin, { pos: [0, headY + hh / 2, -D / 2 + 0.15], name: 'header-box' }));
    hd.add(mesh(box(len + 0.012, 0.012, 0.17), mats.aluDim, { pos: [0, headY + hh + 0.004, -D / 2 + 0.15], name: 'header-crown' }));
    hd.add(mesh(box(len - 0.06, hh - 0.055, 0.010), mats.ad, { pos: [0, headY + hh / 2 - 0.005, -D / 2 + 0.232], name: 'ad-face' }));
    const lamp = grp('ad-lamp', { pos: [0, headY + hh - 0.05, -D / 2 + 0.19] });
    hd.add(lamp);
    lamp.add(mesh(box(len - 0.16, 0.016, 0.026), mats.led, { name: 'ad-tube' }));
    lamp.userData.breathe = { speed: 0.32, amount: 0.11, phase: (seed % 6) / 6 * 6.28 };
    dust(hd, { w: len * 0.7, h: hh * 0.6, pos: [range(rnd, -0.4, 0.4), headY + hh / 2, -D / 2 + 0.238], kind: 'dirt', color: '#e5dbc2', opacity: 0.34, seed: seed + 61, density: 0.9 });
    dust(hd, { w: 0.26, h: 0.06, pos: [len / 2 - 0.18, headY + 0.05, -D / 2 + 0.238], kind: 'chip', color: '#cdc4ae', opacity: 0.5, seed: seed + 62, density: 1.2 });
    dust(hd, { w: 1.40, h: 0.14, pos: [0, headY + hh + 0.011, -D / 2 + 0.12], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#7e776a', opacity: 0.4, seed: seed + 63, density: 1.9, spread: 0.03 });
    for (const s of [-1, 1]) {
      hd.add(mesh(box(0.014, hh + 0.02, 0.020), mats.alu, { pos: [s * (len / 2 - 0.008), headY + hh / 2, -D / 2 + 0.228], name: 'header-stile' }));
    }
    row(hd, 5, (len - 0.30) / 4, (i, x) => mesh(cyl(0.004, 0.004, 0.008, 8), mats.chrome, { pos: [x, headY + 0.020, -D / 2 + 0.236], rot: [PI / 2, 0, 0], cast: false }), { x0: -len / 2 + 0.15 });
    // 広告パネルへの支持腕
    for (const s of [-1, 1]) {
      hd.add(mesh(box(0.018, 0.018, 0.20), mats.steel, { pos: [s * (len / 2 - 0.30), headY - 0.010, -D / 2 + 0.26], name: 'header-arm', cast: false }));
    }
  }

  /* ---------- 足元の埃・落ちた伝票 ---------- */
  for (const s of [1, -1]) {
    dust(g, { w: len * 0.9, h: 0.05, pos: [0, 0.004, s * (D / 2 - 0.02)], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#7a7365', opacity: 0.34, seed: seed + 81 + s, density: 2.2, spread: 0.02 });
  }
  {
    const slip = mesh(box(0.070, 0.0015, 0.048), MAT.paper({ color: '#f7f2e4' }), { pos: [HW - 0.26, 0.0035, D / 2 - 0.042], name: "receipt" });
    slip.rotation.y = 0.7;
    g.add(slip);
  }

  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { build, build as default, meta };
