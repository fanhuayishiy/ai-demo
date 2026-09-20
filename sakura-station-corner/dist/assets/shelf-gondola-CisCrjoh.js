import { g as grp, M as MAT, D as DoubleSide, T as TEX, P as PAL, m as mesh, r as rbox, b as box, n as range, a9 as stockItem, c as cyl, h as decal, q as finish, N as makeCanvas, Q as toTexture, al as heightToNormal, w as weather, W as pipe, z as rand } from './index-BFJstGKs.js';
import { b as build$1, P as P_BOTTLE } from './drink-bottle-17yIW8iw.js';
import { b as build$3, P as P_CAN } from './drink-can-TJ1MdNLx.js';
import { P as P_MILK } from './milk-carton-71ZxeCct.js';
import { b as build$2, P as P_CHIP } from './chip-bag-6fjM-NyW.js';
import { P as P_CANDY } from './candy-bar-DJeLxnQu.js';
import { b as build$4, P as P_SNACK } from './snack-shelf-pack-Bbfbtu90.js';
import { P as P_BREAD } from './bread-set-CNgGE33v.js';
import { P as P_CUP } from './cup-noodle-CGrt8s6h.js';
import { build as build$5 } from './price-tag-CITPc6p3.js';

//  assets/interior/shelf-gondola.js —— 背合わせ島棚（零食・加工食品・飲料／4ベイ × 5段 × 両面びっしり）
//  ・原点 = 据付床面中心、+Y 上、正面 +Z（背面 -Z 側にも同密度で陳列）
//  ・構造：ベース（当たり・キズ・泥はね）／アジャスト脚／端板＋パンチング挿入板／センター背板（パンチング）／
//        棚板（前エッジ＝価格レール＋黄色プライス帯）／ベイ仕切バー／上段フック列／天板／トップサイン（TEX.poster）
//  ・陳列：正面は整列・奥列は yaw ランダム、前後2〜3列。欠番には price-tag と棚板の日焼け影、
//        倒れたペットボトル1本、寝かせた袋、埃・指紋・色褪せ・張り替え痕

const meta = {
  id: 'shelf-gondola',
  real: [3.24, 1.93, 0.99],
  origin: 'ground-center',
};

const PI = Math.PI;
const PRODUCTS = {
  bottle: P_BOTTLE, can: P_CAN, milk: P_MILK, chip: P_CHIP,
  candy: P_CANDY, snack: P_SNACK, bread: P_BREAD, cup: P_CUP,
};
const DIM = {};
for (const k in PRODUCTS) DIM[k] = (PRODUCTS[k].meta && PRODUCTS[k].meta.real) || [0.08, 0.12, 0.08];

/* ---------- 寸法（米） ---------- */
const BASE_T = 0.13;          // ベース上端
const BOARD_T = 0.024;        // 棚板厚
const PITCH = 0.315;          // 段ピッチ
const TIER0 = BASE_T + 0.02;  // 最下段の上面
const Z_BOARD = 0.262;        // 棚板中心（片側）
const Z_BOARD_OUT = 0.472;    // 棚板前端
const Z_FACE = 0.468;         // 商品の前面基準
const Z_STOP = 0.045;         // 奥行き限界（センター背板の手前）
const Z_TAG = 0.4855;         // 値札立面

/* ---------- プラン・オグラム（段 × ベイ × 面） ---------- */
const PLAN = [
  [ // 最下段：大容量の飲料
    [{ k: 'bottle', v: ['tea', 'green', 'water'] }, { k: 'bottle', v: ['cola', 'orange', 'grape'] },
      { k: 'can', v: ['coffee', 'chazuke', 'tea'] }, { k: 'milk', v: ['milk1000', 'milk500', 'soy'] }],
    [{ k: 'bottle', v: ['sport', 'malt', 'yogurt'] }, { k: 'can', v: ['energy', 'cola', 'juice'] },
      { k: 'bottle', v: ['water', 'green', 'tea'] }, { k: 'can', v: ['beer', 'juice'] }],
  ],
  [ // カップ麺・ポテチ・缶
    [{ k: 'can', v: ['beer', 'energy', 'cola'] }, { k: 'chip', v: ['salt', 'shio', 'nori'] },
      { k: 'cup', v: ['shrimp', 'soy', 'seafood'] }, { k: 'chip', v: ['kettle', 'udon'] }],
    [{ k: 'chip', v: ['cheese', 'nori'] }, { k: 'can', v: ['chazuke', 'tea'] },
      { k: 'chip', v: ['salt', 'shio'] }, { k: 'bread', v: ['toast', 'roll', 'anpan'] }],
  ],
  [ // ポテチ帯
    [{ k: 'chip', v: ['salt', 'shio', 'nori', 'kettle'] }, { k: 'chip', v: ['udon', 'cheese'] },
      { k: 'snack', v: ['pudding', 'jelly', 'cookie'] }, { k: 'bottle', v: ['water', 'green', 'tea'] }],
    [{ k: 'bottle', v: ['orange', 'grape', 'sport'] }, { k: 'chip', v: ['cheese', 'kettle'] },
      { k: 'chip', v: ['nori', 'salt', 'shio'] }, { k: 'snack', v: ['cookie', 'boxsnack'] }],
  ],
  [ // パン・箱菓子（欠番を1ベイ作る）
    [{ k: 'bread', v: ['toast', 'melonpan', 'anpan'] }, { k: 'chip', v: ['yogurt', 'cookie'] },
      { k: 'bread', v: ['sandwich', 'cream', 'roll'] }, { k: 'chip', v: ['udon', 'nori'] }],
    [{ k: 'chip', v: ['ice', 'boxsnack'] }, { k: 'snack', v: ['jelly', 'yogurt', 'pudding'] },
      { k: 'chip', v: ['salt', 'kettle'] }, { k: 'bread', v: ['cream', 'melonpan', 'toast'] }],
  ],
  [ // 上段：軽い袋・箱＋フック吊り
    [{ k: 'snack', v: ['boxsnack', 'cookie', 'jelly'] }, { k: 'chip', v: ['kettle', 'cheese'] },
      { k: 'snack', v: ['pudding', 'ice'] }, { k: 'bread', v: ['sandwich', 'toast'] }],
    [{ k: 'chip', v: ['salt', 'nori'] }, { k: 'snack', v: ['yogurt', 'jelly'] },
      { k: 'bread', v: ['roll', 'anpan', 'cream'] }, { k: 'chip', v: ['shio', 'udon', 'kettle'] }],
  ],
];
/** 欠番（商品が切れた区画）: [tier, faceIndex, bay] */
const EMPTY = [[3, 0, 1], [2, 1, 2]];

/* --------------------------------------------------------- パンチング板纹理 */
const _texMemo = new Map();
function punchMaps(base = '#e0d9ca', step = 32, r = 6.4) {
  const key = `punch|${base}|${step}|${r}`;
  if (_texMemo.has(key)) return _texMemo.get(key);
  const out = { map: null, normalMap: null };
  const cv = makeCanvas(256);
  if (cv) {
    const { g, w, h, rnd } = cv;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      g.globalAlpha = 0.02 + rnd() * 0.07;
      g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#8f8979';
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    g.globalAlpha = 1;
    for (let gy = 0; gy < h / step; gy++) {
      for (let gx = 0; gx < w / step + 1; gx++) {
        const cx = (gx + 0.5) * step + (gy % 2 ? step / 2 : 0);
        const cy = (gy + 0.5) * step;
        g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.fillStyle = '#3a352f'; g.fill();
        g.beginPath(); g.arc(cx, cy - r * 0.2, r * 0.84, 0, PI * 2);
        g.fillStyle = '#9d9686'; g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
      }
    }
    out.map = toTexture(cv, { repeat: 1 });
    out.normalMap = heightToNormal(cv, { size: 256, strength: 1.5 });
  }
  _texMemo.set(key, out);
  return out;
}

/* ---------------------------------------------------------- 陳列ヘルパ */
/** dust() は内部で平面を 0.6〜1.4 倍に拡散させるので、是正してから渡す（模型からはみ出さないため） */
const WS = 1.4;
function dust(parent, o) {
  return weather(parent, { spread: 0.014, ...o, w: (o.w || 1) / WS, h: (o.h || 1) / WS });
}

/** 立ち物（ボトル・缶・パック・袋・カップ）を前後複数列で詰める。前面列の x 配列を返す */
function stockUpright(parent, kind, o) {
  const [w, h, d] = DIM[kind];
  const { x0, x1, y, seed, rnd, variants, rows = 2, gap = 0.007, back = 0.62 } = o;
  const span = x1 - x0;
  const pitch = w + gap;
  const n = Math.max(1, Math.floor((span + gap) / pitch));
  const xs0 = x0 + (span - (n - 1) * pitch) / 2;
  const front = [];
  for (let r = 0; r < rows; r++) {
    const z = Z_FACE - d / 2 - 0.006 - r * (d + 0.008);
    if (z - d / 2 < Z_STOP) break;
    const count = r === 0 ? n : Math.max(1, Math.round(n * back));
    const shift = r === 0 ? 0 : pitch * 0.5;
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + shift + (r ? range(rnd, -0.013, 0.013) : range(rnd, -2e-3, 0.002));
      if (x < x0 - 0.003 || x > x1 + 0.003) continue;
      const it = stockItem(`gondola:${kind}:${variants[(i + r * 2) % variants.length]}`,
        () => PRODUCTS[kind].build({ seed: seed + r * 131 + i * 17, variant: variants[(i + r * 2) % variants.length] }));
      it.position.set(x, y, z);
      it.rotation.y = r === 0 ? range(rnd, -0.026, 0.026) : range(rnd, -0.22, 0.22);
      if (r > 0 && rnd() > 0.88) it.rotation.z = range(rnd, -0.09, 0.09);
      parent.add(it);
      if (r === 0) front.push(x);
    }
  }
  return front;
}

/** flat 物（パン・箱菓子）を rows × layers で段積み（前列だけ積む） */
function stockFlat(parent, kind, o) {
  const [w, h, d] = DIM[kind];
  const { x0, x1, y, seed, rnd, variants, rows = 2, layers = 2, back = 0.6 } = o;
  const span = x1 - x0;
  const pitch = w + 0.006;
  const n = Math.max(1, Math.floor((span + 0.006) / pitch));
  const xs0 = x0 + (span - (n - 1) * pitch) / 2;
  const front = [];
  for (let r = 0; r < rows; r++) {
    const z = Z_FACE - d / 2 - 0.005 - r * (d + 0.006);
    if (z - d / 2 < Z_STOP) break;
    const count = r === 0 ? n : Math.max(1, Math.round(n * back));
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + (r ? range(rnd, -9e-3, 0.009) : 0);
      const lay = r === 0 ? layers : 1;
      for (let l = 0; l < lay; l++) {
        const it = stockItem(`g:${kind}:${variants[(i + l + r) % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + r * 71 + i * 23 + l * 7, variant: variants[(i + l + r) % variants.length] }));
        it.position.set(x, y + l * (h + 0.003), z);
        it.rotation.y = r === 0 ? range(rnd, -0.02, 0.02) : range(rnd, -0.13, 0.13);
        parent.add(it);
        if (r === 0 && l === 0) front.push(x);
      }
    }
  }
  return front;
}

/** 奥の在庫ケース（段ボール＋ラップ巻き）＝見た目の詰まりを安く稼ぐ */
function caseStock(parent, kind, { x0, x1, y, z, rnd, seed, variants }, mats) {
  const [w, h, d] = DIM[kind];
  const n = Math.max(1, Math.round((x1 - x0) / 0.30));
  const cw = (x1 - x0) / n - 0.014;
  const cartonMat = [MAT.paper({ color: '#c3a375' }), MAT.paper({ color: '#b79770' }), MAT.paper({ color: '#cdae82' })];
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i + 0.5) * ((x1 - x0) / n);
    const ch = Math.min(0.19, range(rnd, 0.10, 0.17));
    const boxG = grp('case', { pos: [cx, y, z] });
    parent.add(boxG);
    boxG.add(mesh(rbox(cw, ch, 0.24, 0.004, 2), cartonMat[i % 3], { pos: [0, ch / 2, 0], name: 'carton' }));
    // 開けた flap・印刷窓・テープ
    const flap = mesh(box(cw, 0.003, 0.10), cartonMat[(i + 1) % 3], { pos: [0, ch + 0.003, -0.075], name: 'flap' });
    flap.rotation.x = -0.42;
    boxG.add(flap);
    boxG.add(mesh(box(cw * 0.90, ch * 0.34, 0.006), MAT.paint('#efe7d6', { shadowAmt: 0.9, steps: 2 }), { pos: [0, ch * 0.44, 0.1235], name: 'print-window' }));
    boxG.add(mesh(box(0.030, 0.005, 0.252), MAT.paint('#d8cdb4', { shadowAmt: 0.85 }), { pos: [0, ch + 0.0065, 0], name: 'tape' }));
    // ケース上に仮置きした商品（低い種類だけ・棚板との干渉なし）
    if (h <= 0.12 && rnd() > 0.35) {
      const pk = stockItem(`g:${kind}:${variants[i % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + i * 41, variant: variants[i % variants.length] }));
      pk.position.set(cx + range(rnd, -0.03, 0.03), y + ch + 0.004, z + range(rnd, -0.04, 0.02));
      pk.rotation.set(0, range(rnd, -0.5, 0.5), 0);
      parent.add(pk);
    }
    dust(boxG, { w: cw, h: 0.22, pos: [0, ch + 0.009, 0], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8d8578', opacity: 0.32, seed: seed + i, density: 1.3, spread: 0.02 });
  }
}


/** 上段フック列：実(pipe)のフックに吊る */
function hookRow(parent, kind, { x0, x1, y, z, seed, rnd, variants }, mats) {
  const [w, h] = DIM[kind];
  const pitch = Math.max(0.055, w + 0.013);
  const n = Math.max(1, Math.floor((x1 - x0) / pitch));
  const xs0 = x0 + (x1 - x0 - (n - 1) * pitch) / 2;
  for (let i = 0; i < n; i++) {
    const x = xs0 + i * pitch;
    parent.add(pipe([[x, y, z], [x, y - 0.010, z + 0.020], [x, y - 0.014, z + 0.048], [x, y - 0.007, z + 0.056]],
      0.0022, mats.chrome, { seg: 10, radial: 6, name: 'hook' + i, cast: false }));
    const it = stockItem(`g:${kind}:${variants[i % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + i * 37, variant: variants[i % variants.length] }));
    it.position.set(x + range(rnd, -3e-3, 0.003), y - 0.016 - h, z + 0.048);
    it.rotation.y = range(rnd, -0.05, 0.05);
    it.rotation.z = range(rnd, -0.04, 0.04);
    parent.add(it);
  }
  // フックレール（アルミ角棒）と曲がり・指紋
  parent.add(mesh(box(x1 - x0 + 0.04, 0.008, 0.012), mats.alu, { pos: [(x0 + x1) / 2, y + 0.004, z - 0.004], name: 'hook-rail' }));
  dust(parent, { w: 0.42, h: 0.016, pos: [(x0 + x1) / 2 + 0.2, y + 0.006, z], kind: 'scratch', color: '#f4f1e6', opacity: 0.32, seed: seed + 7, density: 1.7, spread: 0.02 });
  return n;
}

/** 欠番：値札を立てて、棚板に日焼け影と埃を残す */
function emptySlot(parent, { x, y, w, seed, rnd }) {
  const n = Math.max(2, Math.floor(w / 0.20));
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + (i + 0.5) * (w / n);
    const t = stockItem(`tag:${i % 4 === 3 ? 'new100' : 'shelf'}`, () => build$5({ seed: seed + i * 53, variant: i % 4 === 3 ? 'new100' : 'shelf' }));
    t.position.set(cx, y - 0.004, Z_TAG);
    t.rotation.x = -0.11;
    t.rotation.y = range(rnd, -0.05, 0.05);
    parent.add(t);
  }
  dust(parent, {
    w: w * 0.94, h: 0.062, pos: [x, y + 0.0014, Z_FACE - 0.075], rot: [-PI / 2, 0, 0],
    kind: 'dirt', color: '#b3a992', opacity: 0.32, seed: seed + 9, density: 0.9, spread: 0.012,
  });
  dust(parent, {
    w: w * 0.7, h: 0.034, pos: [x + range(rnd, -0.05, 0.05), y + 0.0016, Z_FACE - 0.175], rot: [-PI / 2, 0, 0.22],
    kind: 'dirt', color: '#7c756a', opacity: 0.24, seed: seed + 19, density: 1.3, spread: 0.014,
  });
  // 棚板の手前、埃の盛り上がりと古い値札の糊残り
  dust(parent, { w: 0.14, h: 0.022, pos: [x, y - 0.020, Z_TAG - 0.006], kind: 'chip', color: '#e6dcc2', opacity: 0.5, seed: seed + 29, density: 1.1 });
}

/* ------------------------------------------------------------- 建具（本体） */
function carcass(g, { len, tiers, deckY, mats, rnd, seed }) {
  const HW = len / 2;

  /* ベース */
  const base = grp('plinth');
  g.add(base);
  base.add(mesh(box(len, BASE_T - 0.03, 0.86), mats.steel, { pos: [0, 0.03 + (BASE_T - 0.03) / 2, 0], name: 'plinth' }));
  for (const s of [1, -1]) {
    base.add(mesh(box(len + 0.012, 0.082, 0.020), mats.edgeYellow, { pos: [0, 0.080, s * 0.442], name: 'kick-band' }));
    base.add(mesh(box(len + 0.012, 0.010, 0.028), mats.alu, { pos: [0, 0.125, s * 0.448], name: 'kick-cap' }));
    dust(base, { w: 0.30, h: 0.055, pos: [range(rnd, -HW + 0.4, HW - 0.4), 0.060, s * 0.456], kind: 'chip', color: '#9d9583', opacity: 0.55, seed: seed + s * 31, density: 1.6, spread: 0.02 });
    dust(base, { w: 0.52, h: 0.038, pos: [range(rnd, -HW + 0.5, HW - 0.5), 0.036, s * 0.456], kind: 'dirt', color: '#5d574c', opacity: 0.5, seed: seed + s * 57, density: 1.4, spread: 0.03 });
    dust(base, { w: 0.22, h: 0.02, pos: [range(rnd, -HW + 0.3, HW - 0.3), 0.128, s * 0.452], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8375', opacity: 0.35, seed: seed + s * 73, density: 1.8, spread: 0.02 });
  }
  for (const [cx, cz] of [[HW - 0.012, 0.428], [-HW + 0.012, -0.428], [HW - 0.012, -0.428]]) {
    base.add(mesh(rbox(0.048, 0.088, 0.048, 0.014, 2), mats.alu, { pos: [cx, 0.084, cz], name: 'corner-guard' }));
  }

  /* アジャスト脚 */
  for (let i = 0; i < 5; i++) {
    const fx = -HW + 0.20 + i * ((len - 0.40) / 4);
    for (const fz of [-0.36, 0.36]) {
      g.add(mesh(cyl(0.024, 0.030, 0.032, 12), mats.rubber, { pos: [fx, 0.016, fz], name: 'leveler' }));
      g.add(mesh(cyl(0.008, 0.008, 0.046, 8), mats.steel, { pos: [fx, 0.050, fz], name: 'leveler-bolt', cast: false }));
    }
  }

  /* 端板（サイドパネル）＋パンチング挿入板 */
  const sideH = deckY + 0.05 - BASE_T;
  for (const s of [1, -1]) {
    const end = grp('end-panel', { pos: [s * (HW - 0.016), BASE_T + sideH / 2, 0] });
    g.add(end);
    end.add(mesh(box(0.030, sideH, 0.90), mats.body, { name: 'end-board' }));
    // 外侧にパンチング挿入板（6mm 浮かせて取り合い）
    end.add(mesh(box(0.008, sideH - 0.06, 0.80), mats.punch, { pos: [s * 0.019, 0.01, 0], name: 'end-punch', cast: false }));
    for (const zz of [1, -1]) {
      end.add(mesh(box(0.014, 0.016, 0.88), mats.edgeYellow, { pos: [zz * 0.021, -sideH / 2 + 0.014, 0], name: 'end-band' }));
    }
    end.add(mesh(box(0.036, 0.010, 0.912), mats.alu, { pos: [0, sideH / 2 + 0.005, 0], name: 'end-cap' }));
    for (const zz of [1, -1]) {
      dust(end, { w: 0.20, h: 0.14, pos: [zz * 0.024, range(rnd, -0.3, 0.3), range(rnd, -0.3, 0.3)], rot: [0, zz * PI / 2, 0], kind: 'scratch', color: '#b6afa0', opacity: 0.30, seed: seed + s * 11 + zz, density: 1.5, spread: 0.06 });
    }
    dust(end, { w: 0.032, h: 0.90, pos: [0, sideH / 2 + 0.012, 0], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8d8578', opacity: 0.4, seed: seed + s * 91, density: 1.6, spread: 0.05 });
  }

  /* センター背板（パンチング）＋芯柱 */
  const backH = deckY - BASE_T + 0.02;
  g.add(mesh(box(len - 0.05, backH, 0.020), mats.steel, { pos: [0, BASE_T + backH / 2, 0], name: 'back-core', cast: false }));
  for (const s of [1, -1]) {
    g.add(mesh(box(len - 0.05, backH, 0.012), mats.punch, { pos: [0, BASE_T + backH / 2, s * 0.020], name: 'back-punch', cast: false }));
    // 背板の下辺に溜まった埃
    dust(g, { w: len * 0.7, h: 0.03, pos: [0, BASE_T + 0.004, s * 0.030], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#6f6859', opacity: 0.35, seed: seed + s * 301, density: 2.2, spread: 0.02 });
  }
  for (let i = 0; i < 5; i++) {
    const x = -HW + 0.16 + i * ((len - 0.32) / 4);
    g.add(mesh(box(0.050, backH, 0.052), mats.steel, { pos: [x, BASE_T + backH / 2, 0], name: 'upright' }));
    for (let b = 0; b < 4; b++) {
      g.add(mesh(box(0.056, 0.010, 0.058), mats.alu, { pos: [x, BASE_T + 0.12 + b * (backH - 0.24) / 3, 0], name: 'upright-brace', cast: false }));
    }
    for (const s of [1, -1]) {
      g.add(mesh(cyl(0.005, 0.005, 0.010, 8), mats.chrome, { pos: [x, BASE_T + 0.20, s * 0.028], rot: [PI / 2, 0, 0], cast: false }));
    }
  }
  return base;
}

/* ------------------------------------------------------------------ 棚板 */
function shelfBoard(face, { len, tier, y, mats, rnd, seed }) {
  const bw = len - 0.07;
  const T = grp('tier' + tier, { pos: [0, 0, 0] });
  face.add(T);
  T.add(mesh(rbox(bw, BOARD_T, 0.42, 0.004, 2), mats.body, { pos: [0, y - BOARD_T / 2, Z_BOARD], name: 'board' }));
  // 板裏のリブ・金物
  for (let i = 0; i < 3; i++) {
    T.add(mesh(box(bw - 0.16, 0.013, 0.013), mats.steel, { pos: [0, y - BOARD_T - 0.006, 0.11 + i * 0.13], name: 'rib', cast: false }));
  }
  for (let i = 0; i < 5; i++) {
    T.add(mesh(box(0.030, 0.014, 0.050), mats.steel, { pos: [-bw / 2 + 0.20 + i * (bw - 0.40) / 4, y - BOARD_T - 0.007, 0.030], name: 'bracket', cast: false }));
  }
  // 黄色プライス帯 → 価格レール（手前）
  T.add(mesh(box(bw, 0.016, 0.010), mats.edgeYellow, { pos: [0, y - 0.020, Z_BOARD_OUT - 0.008], name: 'price-band' }));
  T.add(mesh(box(bw, 0.026, 0.014), mats.rail, { pos: [0, y - 0.012, Z_BOARD_OUT + 0.004], name: 'price-rail' }));
  T.add(mesh(box(bw, 0.004, 0.019), mats.alu, { pos: [0, y + 0.0008, Z_BOARD_OUT + 0.004], name: 'rail-lip', cast: false }));
  if (tier % 2 === 0) {
    // レールが外れて浮いた端（陳列のカオスの証拠）
    const loose = mesh(box(0.06, 0.008, 0.016), mats.rail, { pos: [bw * 0.24, y + 0.004, Z_BOARD_OUT + 0.006], name: 'rail-loose', cast: false });
    loose.rotation.set(0, 0.18, 0.06);
    T.add(loose);
  }
  // 板上面的の埃・商品の置き傷・指紋
  dust(T, { w: 1.60, h: 0.05, pos: [range(rnd, -0.7, 0.7), y + 0.0014, Z_BOARD], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8d8578', opacity: 0.28, seed: seed + tier * 13, density: 1.5, spread: 0.03 });
  dust(T, { w: 0.22, h: 0.020, pos: [range(rnd, -1.3, 1.3), y + 0.0015, Z_FACE - 0.06], rot: [-PI / 2, 0, 0.12], kind: 'scratch', color: '#efe7d3', opacity: 0.34, seed: seed + tier * 29, density: 1.9, spread: 0.02 });
  dust(T, { w: 0.12, h: 0.014, pos: [range(rnd, -1.4, 1.4), y - 0.022, Z_BOARD_OUT + 0.011], kind: 'chip', color: '#998e79', opacity: 0.5, seed: seed + tier * 41, density: 1.2 });
  return T;
}

/* --------------------------------------------------------------- build */
function build(options = {}) {
  const { len = 3.2, tiers = 5, bothSides = true, seed = 4711, density = 1 } = options;
  const back = Math.max(0.25, Math.min(0.9, 0.45 * density));   // 奥列の充足率（装配層で調整可）
  const rnd = rand(seed);
  const g = grp('shelf-gondola');
  const deckY = TIER0 + (tiers - 1) * PITCH + 0.235;
  const faces = bothSides ? [1, -1] : [1];

  const pm = punchMaps();
  const mats = {
    body: MAT.metalPaint(PAL.shelfBody, { worn: 0.5, repeat: 3 }),
    steel: MAT.metal('#b4b1aa', { worn: 0.65, repeat: 2 }),
    alu: MAT.metal('#cfd2d1', { worn: 0.3, dir: 'h', spec: 0.68, repeat: 3 }),
    chrome: MAT.chrome({}),
    punch: MAT.paint('#ffffff', {
      map: pm.map, normalMap: pm.normalMap, normalScaleX: 1.2, normalScaleY: 1.2,
      tint: PAL.shelfBody, spec: 0.17, shadowAmt: 0.86, steps: 3, sat: 0.96, uv: { repeat: [10, 4] },
    }),
    edgeYellow: MAT.plastic(PAL.shelfEdge, { spec: 0.36, specPower: 48, sat: 1.05, tint: '#ffe7ae' }),
    rail: MAT.hardPlastic('#eaeff1', { spec: 0.5, transparent: true, opacity: 0.9, shadowAmt: 0.62 }),
    rubber: MAT.rubber('#3c3f44', {}),
    divider: MAT.plastic('#dcd6c8', { spec: 0.28, transparent: true, opacity: 0.94 }),
    signPoster: MAT.poster({
      map: TEX.poster({ title: 'おやつ・飲みもの', sub: 'SNACK & DRINK 100-150', bg: '#f8f1de', accent: PAL.storeBand3, seed }),
      side: DoubleSide, steps: 3, sat: 0.98,
    }),
  };

  carcass(g, { len, tiers, deckY, mats, rnd, seed });

  /* ---------- 天板（埃・置き忘れ段ボール） ---------- */
  const deck = grp('top-deck');
  g.add(deck);
  deck.add(mesh(rbox(len, 0.026, 0.94, 0.005, 2), mats.body, { pos: [0, deckY - 0.013, 0], name: 'deck' }));
  for (const s of [1, -1]) deck.add(mesh(box(len + 0.01, 0.008, 0.018), mats.alu, { pos: [0, deckY + 0.010, s * 0.47], name: 'deck-edge' }));
  dust(deck, { w: len * 0.7, h: 0.26, pos: [range(rnd, -0.5, 0.5), deckY + 0.0018, range(rnd, -0.16, 0.16)], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8375', opacity: 0.34, seed: seed + 201, density: 1.6, spread: 0.08 });
  dust(deck, { w: 0.40, h: 0.22, pos: [len * 0.31, deckY + 0.002, -0.1], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#6b645a', opacity: 0.28, seed: seed + 202, density: 2.0, spread: 0.05 });
  {
    const lid = mesh(rbox(0.34, 0.05, 0.22, 0.006, 2), MAT.paper({ color: '#c6a679' }), { pos: [-len * 0.30, deckY + 0.038, -0.14], name: 'card-lid' });
    lid.rotation.set(0.02, 0.28, 0.012);
    deck.add(lid);
    const lid2 = mesh(rbox(0.26, 0.026, 0.18, 0.005, 2), MAT.paper({ color: '#b7976c' }), { pos: [-len * 0.30 + 0.06, deckY + 0.080, -0.11], name: 'card-lid2' });
    lid2.rotation.set(-0.03, -0.42, 0.02);
    deck.add(lid2);
    dust(deck, { w: 0.30, h: 0.20, pos: [-len * 0.30, deckY + 0.0022, -0.14], rot: [-PI / 2, 0, 0.3], kind: 'dirt', color: '#7d7466', opacity: 0.3, seed: seed + 205, density: 1.2 });
  }

  /* ---------- 両面の陳列 ---------- */
  const HW = len / 2;
  const bx = [-HW + 0.055, -HW + 0.805, -0.525, 0.03, 0.5925, HW - 0.075];
  for (let f = 0; f < faces.length; f++) {
    const sgn = faces[f];
    const face = grp('face-' + (sgn > 0 ? 'front' : 'back'), { rotY: sgn > 0 ? 0 : 180 });
    g.add(face);

    for (let t = 0; t < tiers; t++) {
      const y = TIER0 + t * PITCH;
      shelfBoard(face, { len, tier: t, y, mats, rnd, seed: seed + f * 97 });
    }

    for (let t = 0; t < tiers; t++) {
      const y = TIER0 + t * PITCH;
      for (let i = 0; i < 4; i++) {
        const x0 = bx[i], x1 = bx[i + 1];
        if (EMPTY.some((e) => e[0] === t && e[1] === f && e[2] === i)) {
          const cx = (x0 + x1) / 2;
          emptySlot(face, { x: cx, y, w: x1 - x0, seed: seed + t * 67 + i * 23 + f * 401, rnd });
          // 欠番なのに置かれたままの商品（寝かせた袋・倒れたボトル・転がった缶）
          if (t === 3 && i === 1) {
            const fallen = build$1({ seed: seed + 9091, variant: 'water' });
            fallen.position.set(x1 - 0.037, y + 0.0335, Z_FACE - 0.100);
            fallen.rotation.set(0, 0.12, PI / 2);
            fallen.name = 'fallen-bottle';
            face.add(fallen);
            const laid = build$2({ seed: seed + 613, variant: 'udon' });
            laid.position.set(cx - 0.05, y + 0.0305, Z_FACE - 0.15);
            laid.rotation.set(-PI / 2, 0.22, 0);
            laid.name = 'laid-chip';
            face.add(laid);
            dust(face, { w: 0.22, h: 0.03, pos: [x1 - 0.16, y + 0.0017, Z_FACE - 0.07], rot: [-PI / 2, 0, 0.1], kind: 'scratch', color: '#cfc7b4', opacity: 0.42, seed: seed + 777, density: 1.4 });
          }
          if (t === 2 && i === 2) {
            const rolled = build$3({ seed: seed + 9101, variant: 'juice' });
            rolled.position.set(cx + 0.10, y + 0.036, Z_FACE - 0.20);
            rolled.rotation.set(PI / 2, 0.55, 0);
            rolled.name = 'rolled-can';
            face.add(rolled);
            const laid2 = build$4({ seed: seed + 619, variant: 'jelly' });
            laid2.position.set(cx - 0.09, y + 0.0475, Z_FACE - 0.26);
            laid2.rotation.set(-PI / 2, 0.16, 0.05);
            laid2.name = 'laid-snack';
            face.add(laid2);
          }
        } else {
          const spec = PLAN[t][f][i];
          const opt = {
            x0, x1, y, seed: seed + t * 277 + i * 61 + f * 811, rnd, variants: spec.v,
          };
          const tall = DIM[spec.k][1] > 0.14;                       // 背の高い物は前面＋奥に在庫ケース
          const flat = spec.k === 'snack' || spec.k === 'bread';
          if (flat) {
            stockFlat(face, spec.k, { ...opt, rows: t >= 3 ? 2 : 1, layers: t >= 2 ? 2 : 1, back });
          } else {
            stockUpright(face, spec.k, { ...opt, rows: 2 });
          }
          if (tall || flat) caseStock(face, spec.k, { x0, x1, y, z: 0.155, rnd, seed: seed + t * 53 + i * 907 + f * 31, variants: spec.v });
          // レールの値札（このベイに 2〜4 枚）
          const n = Math.max(2, Math.min(3, Math.round((x1 - x0) / 0.30)));
          for (let k = 0; k < n; k++) {
            const x = x0 + (k + 0.5) * ((x1 - x0) / n);
            const tg = stockItem(`tag:${k % 5 === 3 ? 'pop' : 'shelf'}`, () => build$5({ seed: seed + Math.round(x * 977) + t * 31 + k + f * 7, variant: k % 5 === 3 ? 'pop' : 'shelf' }));
            tg.position.set(x, y - 0.004, Z_TAG);
            tg.rotation.x = -0.1;
            tg.rotation.y = range(rnd, -0.04, 0.04);
            face.add(tg);
          }
        }
        // ベイ仕切バー
        if (i < 3) {
          const dv = mesh(rbox(0.008, 0.062, 0.30, 0.003, 2), mats.divider, { pos: [(x1 + bx[i + 1]) / 2, y + 0.031, (Z_FACE + Z_STOP) / 2], name: 'divider' });
          dv.rotation.y = range(rnd, -0.02, 0.02);
          face.add(dv);
        }
      }
    }

    /* 上段フック列（一番上の棚奥に吊り） */
    const hy = TIER0 + (tiers - 1) * PITCH;
    hookRow(face, 'candy', {
      x0: -HW + 0.48, x1: HW - 0.48, y: hy + 0.272, z: 0.104,
      seed: seed + f * 137, rnd, variants: ['choco', 'caramel', 'mint', 'kinoko', 'almond', 'gum'],
    }, mats);

    /* 面ごとの指紋・埃（レール前面） */
    for (let t = 0; t < tiers; t++) {
      const y = TIER0 + t * PITCH;
      dust(face, { w: range(rnd, 0.18, 0.40), h: 0.026, pos: [range(rnd, -HW + 0.3, HW - 0.3), y - 0.012, Z_BOARD_OUT + 0.012], kind: 'scratch', color: '#f6f2e6', opacity: 0.30, seed: seed + f * 31 + t * 5, density: 1.6, spread: 0.02 });
    }
  }

  /* ---------- トップサイン ---------- */
  {
    const H = 0.26;
    const s = grp('top-sign', { pos: [0, deckY + H / 2 + 0.012, 0] });
    g.add(s);
    const sw = len * 0.62;
    s.add(mesh(box(sw, H, 0.040), mats.steel, { name: 'sign-core' }));
    s.add(mesh(box(sw - 0.02, H - 0.03, 0.044), mats.signPoster, { name: 'sign-face' }));
    s.add(mesh(box(sw + 0.008, 0.014, 0.054), mats.alu, { pos: [0, H / 2 - 0.004, 0], name: 'sign-crown' }));
    s.add(mesh(box(sw + 0.008, 0.014, 0.054), mats.alu, { pos: [0, -H / 2 + 0.004, 0], name: 'sign-sill' }));
    for (const sx of [-1, 1]) s.add(mesh(box(0.014, H, 0.056), mats.alu, { pos: [sx * (sw / 2 - 0.004), 0, 0], name: 'sign-side' }));
    for (const sx of [-sw * 0.32, sw * 0.32]) {
      s.add(mesh(box(0.026, 0.062, 0.026), mats.steel, { pos: [sx, -H / 2 - 0.024, 0], name: 'sign-post' }));
      s.add(mesh(cyl(0.004, 0.004, 0.030, 8), mats.chrome, { pos: [sx, -H / 2 - 0.050, 0], rot: [PI / 2, 0, 0], cast: false }));
    }
    dust(s, { w: sw * 0.5, h: H * 0.8, pos: [-sw * 0.16, 0.01, 0.024], kind: 'dirt', color: '#e6d9ba', opacity: 0.36, seed: seed + 411, density: 0.8 });
    dust(s, { w: 0.16, h: 0.05, pos: [sw * 0.42, -H * 0.40, 0.024], kind: 'chip', color: '#cec5ae', opacity: 0.5, seed: seed + 412, density: 1.3 });
    dust(s, { w: 0.20, h: 0.03, pos: [0, H / 2 - 0.014, 0.028], kind: 'dirt', color: '#8b8375', opacity: 0.3, seed: seed + 413, density: 1.2 });
  }

  /* ---------- 全体の経年 ---------- */
  for (let i = 0; i < 6; i++) {
    dust(g, {
      w: range(rnd, 0.16, 0.36), h: range(rnd, 0.12, 0.28),
      pos: [range(rnd, -HW + 0.1, HW - 0.1), range(rnd, 0.22, deckY - 0.12), (i % 2 ? 1 : -1) * 0.487],
      kind: i % 3 === 1 ? 'scratch' : 'dirt', color: i % 3 === 1 ? '#f3eee0' : '#948b7a',
      opacity: range(rnd, 0.16, 0.34), seed: seed + 600 + i, density: 1.2, spread: 0.02,
    });
  }
  decal(g, { map: TEX.wear({ kind: 'chip', color: '#e8dec3', seed: seed + 640, density: 0.6 }), w: 0.24, h: 0.018, pos: [-HW + 0.42, TIER0 + PITCH - 0.020, Z_BOARD_OUT + 0.002], opacity: 0.55 });
  // 床際の埃（棚と床の取り合い）
  for (const s of [1, -1]) {
    dust(g, { w: len * 0.9, h: 0.05, pos: [0, 0.006, s * 0.47], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#7a7365', opacity: 0.34, seed: seed + 650 + s, density: 2.4, spread: 0.02 });
  }

  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { build, build as default, meta };
