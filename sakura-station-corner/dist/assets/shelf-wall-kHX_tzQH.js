import { g as grp, M as MAT, P as PAL, m as mesh, b as box, c as cyl, n as range, h as decal, T as TEX, r as rbox, a9 as stockItem, W as pipe, q as finish, N as makeCanvas, Q as toTexture, al as heightToNormal, w as weather, z as rand } from './index-D8uBk-tk.js';
import { P as P_DAILY } from './daily-goods-CFpgA8ml.js';
import { P as P_TISSUE } from './tissue-pack-GBiv-7Jh.js';
import { P as P_CANDY } from './candy-bar-B6HSxitz.js';
import { P as P_SNACK } from './snack-shelf-pack-B0gtDUO6.js';
import { P as P_MAG } from './magazine-item-D3vfX_eW.js';
import { P as P_CUP } from './cup-noodle-ozAljXjh.js';
import { build as build$1 } from './price-tag-DTT5YDFd.js';
import { build as build$2 } from './trash-liner-DJCrKGVX.js';

//  assets/interior/shelf-wall.js —— 壁側棚（文房具・日用雑貨・ペーパー類／4 段・パンチング背板＋フック掛け）
//  ・原点 = 床面中心、+Y 上、正面 +Z（背面 -Z が壁に接する）
//  ・構造：ベース＋胴縁／背板パンチング（壁との間に埃の帯）／端板／棚板（価格レール＋黄色プライス帯）／
//        フックレール（2 段）／棚札（TEX.adStrip）／天板（埃・予備棚札）
//  ・陳列：下段に箱カートン（段ボール本体＋flap＋テープ）、中〜上段に daily-goods / tissue-pack / candy-bar /
//        snack-shelf-pack / magazine-item を前後列でびっしり。欠番には price-tag、床に落ちた包装紙

const meta = {
  id: 'shelf-wall',
  real: [4.22, 1.90, 0.54],
  origin: 'ground-center',
};

const PI = Math.PI;
const PRODUCTS = { daily: P_DAILY, tissue: P_TISSUE, candy: P_CANDY, snack: P_SNACK, mag: P_MAG, cup: P_CUP };
const DIM = {};
for (const k in PRODUCTS) DIM[k] = (PRODUCTS[k].meta && PRODUCTS[k].meta.real) || [0.08, 0.14, 0.06];

/* ---------- 寸法 ---------- */
const BASE_T = 0.13;
const BOARD_T = 0.022;
const PITCH = 0.44;
const TIER0 = BASE_T + 0.03;
const Z_BOARD = 0.155;        // 棚板中心
const Z_BOARD_OUT = 0.326;    // 棚板前端
const Z_FACE = 0.320;         // 商品前面基準
const Z_STOP = -5e-3;        // 奥限界（背板の手前）
const Z_TAG = 0.340;

const WS = 1.4;
function dust(parent, o) {
  return weather(parent, { spread: 0.014, ...o, w: (o.w || 1) / WS, h: (o.h || 1) / WS });
}

/* ---------------------------------------------------- パンチング（挂穴）板 */
const _texMemo = new Map();
function punchMaps(base = '#ded7c6', step = 26, r = 5.0) {
  const key = `pw|${base}|${step}|${r}`;
  if (_texMemo.has(key)) return _texMemo.get(key);
  const out = { map: null, normalMap: null };
  const cv = makeCanvas(256);
  if (cv) {
    const { g, w, h, rnd } = cv;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) {
      g.globalAlpha = 0.02 + rnd() * 0.06;
      g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#8b8577';
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    g.globalAlpha = 1;
    for (let gy = 0; gy < h / step; gy++) {
      for (let gx = 0; gx < w / step + 1; gx++) {
        const cx = (gx + 0.5) * step + (gy % 2 ? step / 2 : 0);
        const cy = (gy + 0.5) * step;
        g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.fillStyle = '#38342e'; g.fill();
        g.beginPath(); g.arc(cx, cy - r * 0.2, r * 0.82, 0, PI * 2);
        g.fillStyle = '#a49d8d'; g.globalAlpha = 0.45; g.fill(); g.globalAlpha = 1;
      }
    }
    out.map = toTexture(cv, { repeat: 1 });
    out.normalMap = heightToNormal(cv, { size: 256, strength: 1.4 });
  }
  _texMemo.set(key, out);
  return out;
}

/* ------------------------------------------------------------ 陳列ヘルパ */
function stockUpright(parent, kind, o) {
  const [w, h, d] = DIM[kind];
  const { x0, x1, y, seed, rnd, variants, rows = 2, gap = 0.008, back = 0.6 } = o;
  const span = x1 - x0;
  const pitch = w + gap;
  const n = Math.max(1, Math.floor((span + gap) / pitch));
  const xs0 = x0 + (span - (n - 1) * pitch) / 2;
  for (let r = 0; r < rows; r++) {
    const z = Z_FACE - d / 2 - 0.006 - r * (d + 0.008);
    if (z - d / 2 < Z_STOP) break;
    const count = r === 0 ? n : Math.max(1, Math.round(n * back));
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + (r ? pitch * 0.5 + range(rnd, -0.012, 0.012) : range(rnd, -2e-3, 0.002));
      if (x < x0 - 0.003 || x > x1 + 0.003) continue;
      const it = stockItem(`g:${kind}:${variants[(i + r) % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + r * 137 + i * 19, variant: variants[(i + r) % variants.length] }));
      it.position.set(x, y, z);
      it.rotation.y = r === 0 ? range(rnd, -0.03, 0.03) : range(rnd, -0.24, 0.24);
      parent.add(it);
    }
  }
}

function stockFlat(parent, kind, o) {
  const [w, h, d] = DIM[kind];
  const { x0, x1, y, seed, rnd, variants, rows = 2, layers = 2 } = o;
  const span = x1 - x0;
  const pitch = w + 0.006;
  const n = Math.max(1, Math.floor((span + 0.006) / pitch));
  const xs0 = x0 + (span - (n - 1) * pitch) / 2;
  for (let r = 0; r < rows; r++) {
    const z = Z_FACE - d / 2 - 0.005 - r * (d + 0.007);
    if (z - d / 2 < Z_STOP) break;
    const count = r === 0 ? n : Math.max(1, Math.round(n * 0.6));
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + (r ? range(rnd, -0.01, 0.010) : 0);
      const lay = r === 0 ? layers : 1;
      for (let l = 0; l < lay; l++) {
        const it = stockItem(`g:${kind}:${variants[(i + l) % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + r * 83 + i * 29 + l * 11, variant: variants[(i + l) % variants.length] }));
        it.position.set(x, y + l * (h + 0.003), z);
        it.rotation.y = r === 0 ? range(rnd, -0.02, 0.02) : range(rnd, -0.14, 0.14);
        parent.add(it);
      }
    }
  }
}

/** 雑誌・文庫の傾斜積み（背板にもたれる） */
function leanRow(parent, kind, { x0, x1, y, z, seed, rnd, variants, tilt = 0.30 }) {
  const [w, h, d] = DIM[kind];
  const pitch = w * 0.42;
  const n = Math.max(2, Math.floor((x1 - x0) / pitch));
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / n);
    const it = stockItem(`g:${kind}:${variants[i % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + i * 43, variant: variants[i % variants.length] }));
    it.position.set(x, y, z + i * 0.004);
    it.rotation.set(-tilt * (0.75 + 0.25 * ((i % 3) - 1) * 0.4), range(rnd, -0.1, 0.10), 0);
    parent.add(it);
  }
}

/** フック掛け列 */
function hookRow(parent, kind, { x0, x1, y, z, seed, rnd, variants, stepMul = 0.030 }, mats) {
  const [w, h, d] = DIM[kind];
  const pitch = w + stepMul;
  const n = Math.max(1, Math.floor((x1 - x0) / pitch));
  const xs0 = x0 + (x1 - x0 - (n - 1) * pitch) / 2;
  parent.add(mesh(box(x1 - x0 + 0.03, 0.010, 0.014), mats.alu, { pos: [(x0 + x1) / 2, y + 0.006, z], name: 'hook-rail' }));
  for (let i = 0; i < n; i++) {
    const x = xs0 + i * pitch;
    parent.add(pipe([[x, y + 0.004, z], [x, y - 0.008, z + 0.022], [x, y - 0.014, z + 0.050], [x, y - 0.006, z + 0.058]],
      0.0022, mats.chrome, { seg: 10, radial: 6, name: 'hook', cast: false }));
    const it = stockItem(`g:${kind}:${variants[i % variants.length]}`, () => PRODUCTS[kind].build({ seed: seed + i * 37, variant: variants[i % variants.length] }));
    it.position.set(x + range(rnd, -3e-3, 0.003), y - 0.015 - h, z + 0.050);
    it.rotation.set(0, range(rnd, -0.06, 0.06), range(rnd, -0.04, 0.04));
    parent.add(it);
  }
  dust(parent, { w: (x1 - x0) * 0.6, h: 0.02, pos: [(x0 + x1) / 2 + 0.2, y + 0.013, z], kind: 'scratch', color: '#f5f1e5', opacity: 0.30, seed: seed + 5, density: 1.6, spread: 0.02 });
  return n;
}

/** 段ボールカートン（下段の箱陳列） */
function cartons(parent, { x0, x1, y, z, seed, rnd }, mats) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.34));
  const cw = (x1 - x0) / n - 0.016;
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i + 0.5) * ((x1 - x0) / n);
    const ch = range(rnd, 0.16, 0.24);
    const cg = grp('carton', { pos: [cx, y, z] });
    parent.add(cg);
    cg.add(mesh(rbox(cw, ch, 0.30, 0.005, 2), mats.cardA, { pos: [0, ch / 2, 0], name: 'carton' }));
    // 開き flap（2 枚、片方は折れ曲がり）
    const f1 = mesh(box(cw * 0.48, 0.004, 0.14), mats.cardB, { pos: [-cw * 0.25, ch + 0.004, -0.075], name: 'flap-l' });
    f1.rotation.x = -0.9;
    cg.add(f1);
    const f2 = mesh(box(cw * 0.48, 0.004, 0.14), mats.cardB, { pos: [cw * 0.25, ch + 0.002, -0.075], name: 'flap-r' });
    f2.rotation.x = -0.25;
    cg.add(f2);
    // 印刷（商品名_band）・テープ・底の湿り跡
    cg.add(mesh(box(cw * 0.86, 0.030, 0.006), MAT.paint('#f2e9d6', { shadowAmt: 0.92, steps: 2 }), { pos: [0, ch * 0.62, 0.152], name: 'print' }));
    cg.add(mesh(box(0.032, 0.005, 0.31), MAT.paint('#d5c9ac', { shadowAmt: 0.9 }), { pos: [0, ch + 0.006, 0], name: 'tape' }));
    dust(cg, { w: cw, h: 0.28, pos: [0, ch + 0.010, 0], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#877f70', opacity: 0.34, seed: seed + i, density: 1.4, spread: 0.02 });
    dust(cg, { w: cw, h: 0.06, pos: [0, 0.022, 0.152], kind: 'dirt', color: '#6e6659', opacity: 0.32, seed: seed + i + 3, density: 1.2, spread: 0.01 });
  }
}

/** 棚札（段ごとに品名を掲げる） */
function shelfTag(g, { len, y, text, sub, mats, rnd, seed, side = 1 }) {
  const t = grp('shelf-tag', { pos: [side > 0 ? -len * 0.30 : len * 0.30, y + 0.30, -4e-3] });
  g.add(t);
  t.add(mesh(box(0.46, 0.058, 0.010), MAT.paint('#efe9db'), { name: 'tag-board' }));
  decal(t, { map: TEX.adStrip({ text, sub, bg: '#f6efdd', seed }), w: 0.44, h: 0.048, pos: [0, 0, 0.0062], opacity: 0.98 });
  // 支持金物・反り・色褪せ
  for (const sx of [-0.18, 0.18]) t.add(mesh(box(0.014, 0.030, 0.016), mats.alu, { pos: [sx, -0.036, -0.01], name: 'tag-arm', cast: false }));
  dust(t, { w: 0.42, h: 0.05, pos: [0.02, 0.006, 0.0075], kind: 'dirt', color: '#b7ac91', opacity: 0.35, seed: seed + 2, density: 0.9 });
  t.rotation.z = range(rnd, -0.02, 0.02);
  return t;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const { len = 4.2, tiers = 4, seed = 8123, density = 1 } = options;
  const back = Math.max(0.25, Math.min(0.9, 0.45 * density));
  const rnd = rand(seed);
  const g = grp('shelf-wall');
  const HW = len / 2;
  const topY = TIER0 + (tiers - 1) * PITCH + 0.34;

  const pm = punchMaps();
  const mats = {
    body: MAT.metalPaint(PAL.shelfBody, { worn: 0.55, repeat: 3 }),
    steel: MAT.metal('#b3b0a9', { worn: 0.7, repeat: 2 }),
    alu: MAT.metal('#ced1d0', { worn: 0.28, dir: 'h', spec: 0.66, repeat: 3 }),
    chrome: MAT.chrome({}),
    punch: MAT.paint('#ffffff', {
      map: pm.map, normalMap: pm.normalMap, normalScaleX: 1.15, normalScaleY: 1.15,
      tint: PAL.shelfBody, spec: 0.16, shadowAmt: 0.88, steps: 3, uv: { repeat: [14, 6] },
    }),
    edgeYellow: MAT.plastic(PAL.shelfEdge, { spec: 0.34, specPower: 46, sat: 1.05, tint: '#ffe7ae' }),
    rail: MAT.hardPlastic('#e9eef0', { spec: 0.5, transparent: true, opacity: 0.9, shadowAmt: 0.62 }),
    rubber: MAT.rubber('#3b3e43', {}),
    cardA: MAT.paper({ color: '#c2a074' }),
    cardB: MAT.paper({ color: '#b18f66' }),
  };

  /* ---------- ベース ---------- */
  const base = grp('plinth');
  g.add(base);
  base.add(mesh(box(len, BASE_T - 0.03, 0.36), mats.steel, { pos: [0, 0.03 + (BASE_T - 0.03) / 2, 0.10], name: 'plinth' }));
  base.add(mesh(box(len + 0.01, 0.078, 0.018), mats.edgeYellow, { pos: [0, 0.078, 0.290], name: 'kick-band' }));
  base.add(mesh(box(len + 0.01, 0.010, 0.026), mats.alu, { pos: [0, 0.124, 0.293], name: 'kick-cap' }));
  base.add(mesh(box(len + 0.012, 0.012, 0.36), mats.alu, { pos: [0, 0.132, 0.10], name: 'base-trim' }));
  for (const fx of [-HW + 0.14, 0, HW - 0.14]) {
    base.add(mesh(cyl(0.022, 0.028, 0.030, 10), mats.rubber, { pos: [fx, 0.015, 0.24], name: 'leveler' }));
    base.add(mesh(cyl(0.022, 0.028, 0.030, 10), mats.rubber, { pos: [fx, 0.015, -0.03], name: 'leveler' }));
  }
  dust(base, { w: 1.4, h: 0.06, pos: [range(rnd, -1.4, 1.4), 0.055, 0.300], kind: 'chip', color: '#9b9382', opacity: 0.5, seed: seed + 3, density: 1.6, spread: 0.03 });
  dust(base, { w: 1.1, h: 0.04, pos: [range(rnd, -1.6, 1.6), 0.028, 0.300], kind: 'dirt', color: '#5c564c', opacity: 0.5, seed: seed + 4, density: 1.5, spread: 0.03 });

  /* ---------- 背板（パンチング）と壁との取り合い ---------- */
  const backH = topY - BASE_T;
  g.add(mesh(box(len - 0.02, backH, 0.016), mats.punch, { pos: [0, BASE_T + backH / 2, -0.016], name: 'back-punch' }));
  g.add(mesh(box(len - 0.02, backH, 0.012), mats.steel, { pos: [0, BASE_T + backH / 2, -0.028], name: 'back-core', cast: false }));
  // 壁との隙間の埃・落ちた包装（側面から見える）
  dust(g, { w: 3.40, h: 0.05, pos: [0, BASE_T + 0.006, -0.026], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#6d665a', opacity: 0.42, seed: seed + 8, density: 2.6, spread: 0.02 });
  for (let i = 0; i < 3; i++) {
    dust(g, { w: 0.26, h: 0.14, pos: [range(rnd, -HW + 0.4, HW - 0.4), BASE_T + 0.012 + i * 0.02, -0.02], rot: [-PI / 2, 0, range(rnd, -0.14, 0.14)], kind: 'dirt', color: '#8b8375', opacity: 0.4, seed: seed + 11 + i, density: 1.2, spread: 0.02 });
  }
  // 壁紙の貼り直し痕・_corner_の欠け（背板の裏側に見える）
  decal(g, { map: TEX.wear({ kind: 'chip', color: '#d9d1bd', seed: seed + 15, density: 0.8 }), w: 0.6, h: 0.4, pos: [HW - 0.4, BASE_T + 0.6, -0.034], rot: [0, PI, 0], opacity: 0.5 });

  /* ---------- 端板 ---------- */
  for (const s of [1, -1]) {
    const end = grp('end-panel', { pos: [s * (HW - 0.014), BASE_T + backH / 2, 0.150] });
    g.add(end);
    end.add(mesh(box(0.026, backH, 0.35), mats.body, { name: 'end-board' }));
    end.add(mesh(box(0.010, backH - 0.05, 0.26), mats.punch, { pos: [s * 0.018, 0.01, 0], name: 'end-punch', cast: false }));
    end.add(mesh(box(0.032, 0.014, 0.356), mats.edgeYellow, { pos: [0, -backH / 2 + 0.016, 0], name: 'end-band' }));
    end.add(mesh(box(0.032, 0.010, 0.362), mats.alu, { pos: [0, backH / 2 + 0.005, 0], name: 'end-cap' }));
    dust(end, { w: 0.30, h: backH * 0.5, pos: [s * 0.021, 0.1, 0.175], rot: [0, s * PI / 2, 0], kind: 'scratch', color: '#b8b1a2', opacity: 0.28, seed: seed + s * 21, density: 1.4, spread: 0.1 });
  }

  /* ---------- 棚板・陳列 ---------- */
  const TIER_TXT = [
    { t: '洗剤・ペーパー', s: 'DETERGENT & TISSUE' },
    { t: '文房具・日用', s: 'STATIONERY & DAILY' },
    { t: 'お菓子・ガム', s: 'SNACK & GUM' },
    { t: 'ストック・箱', s: 'OVER STOCK' },
  ];
  const sec = [-HW + 0.05, -HW + 1.05, -0.85, -0.1, 0.72, HW - 0.06];   // 5 区画
  for (let t = 0; t < tiers; t++) {
    const y = TIER0 + t * PITCH;
    const T = grp('tier' + t);
    g.add(T);
    const bw = len - 0.05;
    T.add(mesh(rbox(bw, BOARD_T, 0.335, 0.004, 2), mats.body, { pos: [0, y - BOARD_T / 2, Z_BOARD], name: 'board' }));
    for (let i = 0; i < 3; i++) {
      T.add(mesh(box(bw - 0.14, 0.012, 0.012), mats.steel, { pos: [0, y - BOARD_T - 0.006, 0.05 + i * 0.11], name: 'rib', cast: false }));
    }
    T.add(mesh(box(bw, 0.015, 0.010), mats.edgeYellow, { pos: [0, y - 0.019, Z_BOARD_OUT - 0.008], name: 'price-band' }));
    T.add(mesh(box(bw, 0.024, 0.013), mats.rail, { pos: [0, y - 0.011, Z_BOARD_OUT + 0.004], name: 'price-rail' }));
    T.add(mesh(box(bw, 0.004, 0.017), mats.alu, { pos: [0, y + 0.0008, Z_BOARD_OUT + 0.004], name: 'rail-lip', cast: false }));
    dust(T, { w: 1.90, h: 0.06, pos: [range(rnd, -1, 1.0), y + 0.0013, Z_BOARD], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8375', opacity: 0.28, seed: seed + t * 17, density: 1.6, spread: 0.03 });
    dust(T, { w: 0.26, h: 0.02, pos: [range(rnd, -1.7, 1.7), y - 0.020, Z_BOARD_OUT + 0.011], kind: 'chip', color: '#a2977f', opacity: 0.45, seed: seed + t * 23, density: 1.3 });

    /* 段ごとの陳列計画 */
    if (t === 0) {
      cartons(T, { x0: sec[0], x1: sec[3], y, z: 0.155, seed: seed + 201, rnd }, mats);
      stockFlat(T, 'tissue', { x0: sec[3], x1: sec[4], y, seed: seed + 233, rnd, variants: ['tissue', 'paper', 'wet'], rows: 1, layers: 3 });
      stockFlat(T, 'snack', { x0: sec[4], x1: sec[5], y, seed: seed + 251, rnd, variants: ['jelly', 'yogurt', 'cookie'], rows: 1, layers: 2 });
    } else if (t === 1) {
      stockFlat(T, 'tissue', { x0: sec[0], x1: sec[2], y, seed: seed + 301, rnd, variants: ['tissue', 'paper'], rows: 1, layers: 2 });
      stockUpright(T, 'daily', { x0: sec[2], x1: sec[3], y, seed: seed + 311, rnd, variants: ['notebook', 'pen', 'razor'], rows: 2, back });
      leanRow(T, 'mag', { x0: sec[3], x1: sec[4], y, z: 0.20, seed: seed + 321, rnd, variants: ['weekly', 'women', 'comic'] });
      stockUpright(T, 'cup', { x0: sec[4], x1: sec[5], y, seed: seed + 331, rnd, variants: ['shrimp', 'curry', 'soy'], rows: 1, back });
    } else if (t === 2) {
      hookRow(T, 'daily', { x0: sec[0], x1: sec[2], y: y + 0.30, z: 0.10, seed: seed + 401, rnd, variants: ['battery', 'towel', 'wiper', 'razor'] }, mats);
      stockFlat(T, 'snack', { x0: sec[2], x1: sec[4], y, seed: seed + 411, rnd, variants: ['boxsnack', 'ice', 'pudding'], rows: 1, layers: 2 });
      hookRow(T, 'candy', { x0: sec[4], x1: sec[5], y: y + 0.30, z: 0.10, seed: seed + 421, rnd, variants: ['choco', 'mint', 'gum', 'almond'] }, mats);
    } else {
      hookRow(T, 'tissue', { x0: sec[0], x1: sec[2], y: y + 0.28, z: 0.10, seed: seed + 501, rnd, variants: ['handkerchief', 'wet', 'tissue'], stepMul: 0.055 }, mats);
      stockUpright(T, 'daily', { x0: sec[2], x1: sec[4], y, seed: seed + 511, rnd, variants: ['umbrella', 'towel', 'pen'], rows: 2, back });
      stockFlat(T, 'snack', { x0: sec[4], x1: sec[5], y, seed: seed + 521, rnd, variants: ['jelly', 'cookie'], rows: 1, layers: 2 });
    }

    /* レールの値札 */
    const nTag = 8;
    for (let k = 0; k < nTag; k++) {
      const x = -HW + 0.20 + k * ((len - 0.40) / (nTag - 1)) + range(rnd, -0.02, 0.02);
      const tg = stockItem(`tag:${k % 6 === 4 ? 'sale' : 'shelf'}`, () => build$1({ seed: seed + t * 97 + k * 13, variant: k % 6 === 4 ? 'sale' : 'shelf' }));
      tg.position.set(x, y - 0.004, Z_TAG);
      tg.rotation.x = -0.1;
      tg.rotation.y = range(rnd, -0.05, 0.05);
      T.add(tg);
    }
    /* 棚札（上段 3 つ） */
    if (t < 3) shelfTag(g, { len, y, text: TIER_TXT[t].t, sub: TIER_TXT[t].s, mats, rnd, seed: seed + t * 61 });
  }

  /* ---------- 欠番（上段の 1 区画が品切れ）＋値札のみ ---------- */
  {
    const y = TIER0 + 3 * PITCH;
    const x0 = sec[2], x1 = sec[3];
    for (let i = 0; i < 2; i++) {
      const cx = x0 + (i + 0.5) * ((x1 - x0) / 2);
      const tg = build$1({ seed: seed + 601 + i, variant: i ? 'new100' : 'pop' });
      tg.position.set(cx, y - 0.004, Z_TAG);
      tg.rotation.x = -0.12;
      g.add(tg);
    }
    dust(g, { w: (x1 - x0) * 0.9, h: 0.07, pos: [(x0 + x1) / 2, y + 0.0014, Z_FACE - 0.09], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#b1a792', opacity: 0.34, seed: seed + 605, density: 0.9, spread: 0.012 });
    dust(g, { w: 0.20, h: 0.03, pos: [(x0 + x1) / 2, y - 0.020, Z_TAG - 0.004], kind: 'chip', color: '#e7ddc3', opacity: 0.5, seed: seed + 607, density: 1.1 });
    // 空いた区画に残ったフックだけ
    for (let i = 0; i < 4; i++) {
      const x = x0 + 0.06 + i * 0.16;
      g.add(pipe([[x, y + 0.30, 0.10], [x, y + 0.29, 0.122], [x, y + 0.284, 0.150], [x, y + 0.292, 0.158]],
        0.0022, mats.chrome, { seg: 9, radial: 6, name: 'hook-empty', cast: false }));
    }
  }

  /* ---------- 天板 ---------- */
  const deck = grp('top-deck');
  g.add(deck);
  deck.add(mesh(rbox(len, 0.024, 0.36, 0.005, 2), mats.body, { pos: [0, topY + 0.012, 0.150], name: 'deck' }));
  deck.add(mesh(box(len + 0.01, 0.008, 0.016), mats.alu, { pos: [0, topY + 0.028, 0.326], name: 'deck-edge' }));
  dust(deck, { w: len * 0.7, h: 0.22, pos: [range(rnd, -1, 1), topY + 0.025, 0.15], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#8b8375', opacity: 0.36, seed: seed + 701, density: 1.8, spread: 0.04 });
  // 予備の棚札・箱の端材
  {
    const spare = mesh(rbox(0.30, 0.022, 0.20, 0.004, 2), mats.cardB, { pos: [len * 0.24, topY + 0.036, 0.13], name: 'spare-card' });
    spare.rotation.set(0, 0.34, 0);
    deck.add(spare);
    const spareTag = mesh(box(0.40, 0.050, 0.006), MAT.poster({ map: TEX.adStrip({ text: '期間限定 100円', bg: '#f4e6c8', seed: seed + 12 }) }), { pos: [-len * 0.26, topY + 0.042, 0.16], name: 'spare-tag' });
    spareTag.rotation.set(-0.24, 0.2, 0.04);
    deck.add(spareTag);
  }

  /* ---------- 床に落ちた包装・埃（棚と壁の足元） ---------- */
  {
    const wrap = build$2({ seed: seed + 811, variant: 'wrapper' });
    wrap.position.set(HW - 0.42, 0.055, 0.235);
    wrap.rotation.set(0, 1.15, 0);
    wrap.name = 'fallen-wrapper';
    g.add(wrap);
    const crush = build$2({ seed: seed + 823, variant: 'can' });
    crush.position.set(-HW + 0.34, 0.072, 0.195);
    crush.rotation.set(0, 0.42, 0);
    crush.name = 'fallen-crush-can';
    g.add(crush);
    dust(g, { w: 0.5, h: 0.20, pos: [HW - 0.42, 0.0025, 0.28], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#7d766a', opacity: 0.30, seed: seed + 831, density: 1.2, spread: 0.02 });
  }
  for (const s of [1, -1]) {
    dust(g, { w: len * 0.85, h: 0.05, pos: [0, 0.004, s > 0 ? 0.338 : -0.048], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#79725f', opacity: 0.32, seed: seed + 840 + s, density: 2.2, spread: 0.02 });
  }
  // 側面と前面の指紋・手あか
  for (let i = 0; i < 6; i++) {
    const side = i % 2;
    dust(g, {
      w: range(rnd, 0.14, 0.30), h: range(rnd, 0.10, 0.22),
      pos: side
        ? [range(rnd, -HW + 0.2, HW - 0.2), range(rnd, 0.3, topY - 0.1), 0.3455]
        : [(i < 4 ? -1 : 1) * (HW - 0.0305), range(rnd, 0.3, topY - 0.1), range(rnd, 0.02, 0.30)],
      rot: side ? [0, 0, 0] : [0, PI / 2, 0],
      kind: i % 3 === 1 ? 'scratch' : 'dirt', color: i % 3 === 1 ? '#f6f2e6' : '#93897a',
      opacity: range(rnd, 0.16, 0.32), seed: seed + 900 + i, density: 1.3, spread: 0.02,
    });
  }

  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { build, build as default, meta };
