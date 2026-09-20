import { g as grp, q as finish, M as MAT, P as PAL, T as TEX, s as shade, z as rand, m as mesh, r as rbox, n as range, b as box, k as tubeOf, w as weather, x as PlaneGeometry, E as inst, c as cyl, a as sph, H as plane, h as decal, t as tor, am as hoop, N as makeCanvas, O as jpText, Q as toTexture } from './index-D433i3Qe.js';

const meta = {
  id: 'rail-furniture',
  real: [2.38, 0.72, 0.87],      // kind='stop'（最大実体）／kind 別の寸法はファイルヘッダの表参照
  origin: 'ground-center, front = +Z',
};
const DEFAULT_OPTIONS = { kind: 'switch', seed: 661 };

const D2R = Math.PI / 180;
const HALF_PI = Math.PI / 2;
const GAUGE_HALF = 1.067 / 2;      // 0.5335（stop の車輪受け位置）

/* ───────────────────────────────────────── 質感セット（kind 共通で共有） */
function kit() {
  return {
    paintGrey: MAT.metalPaint(shade(PAL.poleConcrete, 0.94), { worn: 1.15, uv: { repeat: [0.3, 0.3] }, spec: 0.28, shadowAmt: 0.86 }),
    paintDark: MAT.metalPaint(shade(PAL.lampBlack, 1.06), { worn: 1.2, uv: { repeat: [0.25, 0.25] }, spec: 0.3, shadowAmt: 0.9 }),
    paintGreen: MAT.metalPaint(shade(PAL.lampGreen, 0.96), { worn: 1.35, uv: { repeat: [0.3, 0.3] }, spec: 0.24, shadowAmt: 0.88 }),
    paintYellow: MAT.metalPaint(PAL.markingYellow, { worn: 1.2, uv: { repeat: [0.3, 0.3] }, spec: 0.26 }),
    paintWhite: MAT.metalPaint(PAL.marking, { worn: 1.3, uv: { repeat: [0.3, 0.3] }, spec: 0.3 }),
    steel: MAT.metal('#9aa0a3', { worn: 0.85, dir: 'h', uv: { repeat: [0.5, 0.5] } }),
    ss: MAT.stainless({ worn: 0.6, repeat: 2 }),
    alu: MAT.metal('#bcc0c1', { worn: 0.7, uv: { repeat: [0.5, 0.5] }, spec: 0.55 }),
    galv: MAT.galvanized({ uv: { repeat: [0.3, 0.3] }, spec: 0.38 }),
    dark: MAT.darkIron({ uv: { repeat: [0.4, 0.4] } }),
    rust: MAT.metal(PAL.rust, { worn: 1.8, uv: { repeat: [0.3, 0.3] }, spec: 0.14, sheen: 0.02, shadowAmt: 0.95 }),
    conc: MAT.concrete({ base: shade(PAL.concrete, 0.94), repeat: 1, uv: { repeat: [0.4, 0.4] } }),
    concDark: MAT.concrete({ base: shade(PAL.concreteDark, 0.98), repeat: 1, joints: 2, uv: { repeat: [0.4, 0.4] } }),
    timber: MAT.wood({ light: '#a08058', dark: '#6a5136', repeat: 2, uv: { repeat: [0.35, 0.35] } }),
    timberOld: MAT.wood({ light: '#93816a', dark: '#5f5241', repeat: 3, uv: { repeat: [0.3, 0.3] } }),
    rubber: MAT.rubber('#2c2e32', { steps: 2 }),
    rubberOld: MAT.rubber('#4b463c', { steps: 2 }),
    gravel: MAT.ballast({ repeat: 6, base: shade(PAL.ballast, 0.96) }),
    dirt: MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 1 }).map, spec: 0.04, shadowAmt: 0.98, steps: 2 }),
    leaf: MAT.paper({ color: '#a8895c' }),
    glass: MAT.glassLite({ color: '#dfeae6', opacity: 0.2 }),
  };
}

/* ─────────────────────────────────────────────────────────── 小物ヘルパ */
/** +Z 向きの六角ボルト */
function boltZ(p, mat, x, y, z, r = 0.009, len = 0.013) {
  p.add(mesh(cyl(r, r * 0.9, len, 6), mat, { pos: [x, y, z], rot: [HALF_PI, 0, 0], cast: false }));
}
/** +Y 向きのアンカーボルト（ワッシャ＋ナット） */
function boltY(p, mat, x, y, z, r = 0.012, len = 0.034) {
  p.add(mesh(cyl(r, r, len, 6), mat, { pos: [x, y + len / 2, z], cast: false }));
  p.add(mesh(cyl(r * 1.6, r * 1.6, 0.009, 6), mat, { pos: [x, y + 0.0045, z], cast: false }));
  p.add(mesh(cyl(r * 1.35, r * 1.35, 0.012, 6), mat, { pos: [x, y + 0.015, z], cast: false }));
}
/** 黄黒のハゼン帯（横向き・+Z 面） */
function hazardTex() {
  const cv = makeCanvas(512, 128);
  if (!cv) return null;
  const { g, w, h } = cv;
  g.fillStyle = PAL.markingYellow; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#33312c'; g.lineWidth = 42;
  for (let i = -2; i < 16; i++) { g.beginPath(); g.moveTo(i * 44, h + 14); g.lineTo(i * 44 + 46, -14); g.stroke(); }
  g.globalAlpha = 0.2; g.fillStyle = '#6a5a34'; g.fillRect(0, 0, w, h * 0.5);
  g.globalAlpha = 0.12; g.fillStyle = '#fff'; g.fillRect(0, h * 0.62, w, h * 0.38);
  return toTexture(cv, { repeat: 1 });
}
/** 数字プレートの下地（距離標・号数を白地に黒字） */
function numberTex(big, small) {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f4f1e7'; g.fillRect(0, 0, w, h);
  jpText(g, big, { x: w / 2, y: h * 0.42, size: h * 0.42, color: '#33312b', weight: 800 });
  jpText(g, small, { x: w / 2, y: h * 0.78, size: h * 0.15, color: '#6b6659', weight: 600 });
  g.globalAlpha = 0.16;
  for (let i = 0; i < 26; i++) { g.fillStyle = rnd() > 0.5 ? '#8a8474' : '#fff'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 18, 2 + rnd() * 6); }
  return toTexture(cv, { repeat: 1 });
}
/** 砕石・土砂の盛り上がり（低めの不定形塊） */
function mound(p, K, rnd, x, y, z, w, d, hgt, mat) {
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283;
    const r0 = 0.03 + rnd() * 0.05;
    p.add(mesh(sph(r0, 7, 6), mat, {
      pos: [x + Math.cos(a) * w * 0.32 * rnd(), y + r0 * 0.35, z + Math.sin(a) * d * 0.32 * rnd()],
      scale: [1.3, hgt, 1.15], cast: false,
    }));
  }
  p.add(mesh(rbox(w, hgt * 0.1, d, 0.02, 1), mat, { pos: [x, y + 0.006, z], rot: [0, rnd() * 0.6, 0], cast: false }));
}
/** 落ち葉（薄板） */
function leaf(p, rnd, x, y, z, K, s = 1) {
  const l = mesh(rbox(0.058 * s, 0.004, 0.044 * s, 0.004, 1), K.leaf, {
    pos: [x, y, z], rot: [range(rnd, -0.3, 0.3), range(rnd, 0, 3.14), range(rnd, -0.3, 0.3)], cast: false,
  });
  l.userData.noOutline = true;
  p.add(l);
}

/* ═══════════════════════════════════════════════════════════════ 転換機 */
function buildSwitch(g, rnd, seed, K) {
  const p = grp('switch-machine');
  g.add(p);

  /* 基礎コンクリート（据付ボルト 4 本） */
  const fnd = grp('switch-foundation');
  p.add(fnd);
  fnd.add(mesh(rbox(0.72, 0.12, 0.42, 0.01, 2), K.conc, { pos: [0, 0.06, 0.02], name: 'footing' }));
  fnd.add(mesh(box(0.66, 0.014, 0.36), K.concDark, { pos: [0, 0.126, 0.02], name: 'grout-bed' }));
  for (const [bx, bz] of [[-0.29, 0.17], [0.29, 0.17], [-0.29, -0.13], [0.29, -0.13]]) boltY(fnd, K.rust, bx, 0.132, bz, 0.011, 0.03);
  fnd.add(mesh(box(0.05, 0.05, 0.02), K.rust, { pos: [0.35, 0.1, 0.23], cast: false }));          // 名板ブラケット
  decal(fnd, { map: numberTex('2', 'WB-2'), w: 0.05, h: 0.05, pos: [0.35, 0.1, 0.242], order: 1 });
  weather(fnd, { w: 0.6, h: 0.14, pos: [0, 0.095, 0.24], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 11, density: 1.6, spread: 0.04 });
  weather(fnd, { w: 0.3, h: 0.1, pos: [-0.16, 0.13, -0.14], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#6d6552', opacity: 0.5, seed: seed + 12, density: 1.4 });

  /* 台枠と本体（鋳鉄カバー） */
  const frame = grp('switch-frame');
  p.add(frame);
  frame.add(mesh(box(0.62, 0.06, 0.34), K.paintDark, { pos: [0, 0.163, 0.02], name: 'bed-plate' }));
  frame.add(mesh(rbox(0.36, 0.3, 0.28, 0.018, 2), K.paintGreen, { pos: [0.05, 0.345, 0.02], name: 'cover' }));
  frame.add(mesh(box(0.38, 0.02, 0.3), K.alu, { pos: [0.05, 0.505, 0.02], name: 'cover-lid' }));
  for (const [bx, bz] of [[-0.12, -0.1], [0.22, -0.1], [-0.12, 0.14], [0.22, 0.14]]) boltZ(frame, K.steel, bx, 0.47, 0.02 + bz, 0.007, 0.01);
  frame.add(mesh(box(0.02, 0.24, 0.02), K.alu, { pos: [0.232, 0.34, 0.02], cast: false }));        // 目地押さえ
  frame.add(mesh(box(0.3, 0.03, 0.04), K.dark, { pos: [0.05, 0.2, -0.11], cast: false }));         // 下蓋
  // 標のぞき窓（カバーの +Z 面）
  const win = grp('sight-window', { pos: [0.14, 0.4, 0.162] });
  frame.add(win);
  win.add(mesh(box(0.09, 0.09, 0.012), K.dark, { pos: [0, 0, 0.004], cast: false }));
  win.add(mesh(plane(0.068, 0.068), K.glass, { pos: [0, 0, 0.012], cast: false, receive: false }));
  win.add(mesh(box(0.028, 0.028, 0.006), MAT.screen({ color: '#2f3a2e' }), { pos: [0, 0, 0.009], cast: false }));
  boltZ(win, K.ss, 0, 0.052, 0.011, 0.005, 0.008);

  /* 標的（黒地に白丸・回転軸＋ブラケット） */
  const tgt = grp('target', { pos: [-0.2, 0.4, 0.19] });
  p.add(tgt);
  tgt.add(mesh(box(0.05, 0.26, 0.03), K.paintDark, { pos: [0.03, 0, -0.02], name: 'target-arm' }));
  tgt.add(mesh(cyl(0.014, 0.014, 0.06, 10), K.steel, { pos: [0, 0, 0.0], rot: [HALF_PI, 0, 0] }));
  tgt.add(mesh(cyl(0.078, 0.078, 0.014, 20), K.paintDark, { pos: [0, 0, 0.034], rot: [HALF_PI, 0, 0], name: 'target-disc' }));
  tgt.add(mesh(cyl(0.052, 0.052, 0.004, 20), K.paintWhite, { pos: [0, 0, 0.043], rot: [HALF_PI, 0, 0], name: 'target-face', cast: false }));
  tgt.add(hoop(0.081, 0.006, K.rust, { pos: [0, 0, 0.034], rot: [HALF_PI, 0, 0], cast: false }));
  tgt.add(mesh(cyl(0.012, 0.012, 0.008, 10), K.ss, { pos: [0, 0, 0.046], rot: [HALF_PI, 0, 0], cast: false }));
  weather(tgt, { w: 0.13, h: 0.13, pos: [0.01, -0.02, 0.046], kind: 'chip', color: '#c9c3b2', opacity: 0.4, seed: seed + 21, density: 1.2, spread: 0.006 });

  /* 操作ハンドル（象限 plate・グリップ・ピン） */
  const lv = grp('lever', { pos: [-0.13, 0.36, 0.02] });
  p.add(lv);
  const ang = range(rnd, -32, 30);
  lv.add(mesh(box(0.16, 0.2, 0.022), K.paintDark, { pos: [0, 0.04, 0.06], name: 'quadrant' }));
  for (let i = 0; i < 5; i++) lv.add(mesh(box(0.006, 0.024, 0.006), K.steel, { pos: [-0.06 + i * 0.03, 0.11, 0.072], cast: false }));
  lv.add(mesh(cyl(0.028, 0.032, 0.09, 12), K.dark, { pos: [0, 0, 0.02], rot: [HALF_PI, 0, 0], name: 'lever-boss' }));
  const arm = grp('lever-arm', { pos: [0, 0.02, 0.06], rot: [ang * D2R, 0, 0] });
  lv.add(arm);
  arm.add(mesh(cyl(0.014, 0.012, 0.42, 10), K.steel, { pos: [0, 0.2, 0], name: 'handle-shaft' }));
  arm.add(mesh(sph(0.028, 12, 10), MAT.hardPlastic(shade(PAL.vendingRed, 0.9), { repeat: 3 }), { pos: [0, 0.42, 0], name: 'grip' }));
  arm.add(hoop(0.017, 0.004, K.rust, { pos: [0, 0.08, 0], rot: [HALF_PI, 0, 0], cast: false }));
  lv.add(mesh(cyl(0.009, 0.009, 0.1, 8), K.ss, { pos: [0.06, -0.05, 0.06], rot: [HALF_PI, 0, 0] }));   // 留めピン
  weather(arm, { w: 0.06, h: 0.3, pos: [0, 0.2, 0.02], kind: 'rust', color: '#7b4728', opacity: 0.5, seed: seed + 31, density: 1.7, spread: 0.02 });

  /* 連査棒・転換ロッド（線路側 -Z へ出てゆき、砕石際に潜る） */
  const rod = grp('detection-rods');
  p.add(rod);
  const rodY = 0.19, zOut = -0.62;
  for (const [ry, off, len] of [[rodY, -0.1, 1.0], [rodY - 0.055, 0.06, 0.86]]) {
    const x0 = -0.16;
    rod.add(mesh(cyl(0.012, 0.012, len, 10), K.steel, { pos: [x0, ry, -0.1 - len / 2 + 0.06], rot: [HALF_PI, 0, 0], name: 'rod' }));
    rod.add(mesh(box(0.05, 0.04, 0.12), K.dark, { pos: [x0, ry, -0.2 - off], cast: false }));           // アジャスター
    rod.add(mesh(cyl(0.017, 0.017, 0.06, 8), K.rust, { pos: [x0, ry, -0.28 - off], rot: [HALF_PI, 0, 0], cast: false }));
    rod.add(mesh(box(0.05, 0.1, 0.05), K.paintDark, { pos: [x0, ry + 0.02, zOut + 0.06], cast: false })); // ストラップ
  }
  // ロッド押さえ金・パッド（砕石の上に置いた鉄板）
  for (let i = 0; i < 3; i++) {
    const zz = -0.24 - i * 0.18;
    rod.add(mesh(rbox(0.1, 0.022, 0.1, 0.005, 1), K.galv, { pos: [-0.16, 0.165, zz], rot: [0, range(rnd, -0.06, 0.06), 0], cast: false }));
    rod.add(mesh(cyl(0.008, 0.008, 0.05, 6), K.rust, { pos: [-0.16, 0.19, zz], cast: false }));
  }
  // 配管（制御ケーブルが基礎から地中へ）
  rod.add(mesh(tubeOf([[-0.3, 0.14, 0.16], [-0.36, 0.1, 0.02], [-0.34, 0.04, -0.14]], 0.016, 14, 7), K.alu, { name: 'cable-conduit' }));
  rod.add(mesh(box(0.08, 0.06, 0.02), K.paintDark, { pos: [-0.3, 0.17, 0.22], cast: false }));
  for (const sx of [-1, 1]) rod.add(mesh(tubeOf([[0.05 + sx * 0.12, 0.16, -0.09], [0.05 + sx * 0.14, 0.09, -0.16], [0.05 + sx * 0.1, 0.03, -0.22]], 0.008, 10, 6), K.rubber));

  /* 経年：① 本体カバーの掉漆と錆膨れ ② 基部の苔 ③ ロッドの錆 ④ 落書き除去跡 */
  for (let i = 0; i < 4; i++) {
    weather(p, { w: range(rnd, 0.06, 0.14), h: range(rnd, 0.05, 0.1), pos: [range(rnd, -0.1, 0.2), range(rnd, 0.25, 0.46), range(rnd, -0.13, 0.16)], kind: 'rust', color: '#7d4a2b', opacity: 0.5, seed: seed + 41 + i, density: 1.7, spread: 0.02 });
  }
  weather(p, { w: 0.34, h: 0.06, pos: [0.05, 0.22, 0.163], kind: 'chip', color: '#b7b2a2', opacity: 0.5, seed: seed + 51, density: 1.5, spread: 0.01 });
  decal(p, { map: TEX.wear({ kind: 'scratch', color: '#dcd6c4', seed: seed + 55, density: 0.8 }), w: 0.16, h: 0.07, pos: [-0.02, 0.3, 0.163], opacity: 0.5, order: 2 });
  mound(p, K, rnd, 0.3, 0.13, -0.16, 0.22, 0.16, 0.5, K.dirt);            // 連査棒まわりの土砂上がり
  leaf(p, rnd, -0.24, 0.14, 0.1, K);
  leaf(p, rnd, 0.18, 0.14, -0.3, K, 0.8);
}

/* ═══════════════════════════════════════════════════════════ ケーブル保護槽 */
function buildDuct(g, rnd, seed, K) {
  const p = grp('cable-duct');
  g.add(p);
  const LEN = 2.5, WALL = 0.06, H = 0.13;
  const halfZ = 0.22;

  /* 側壁・底・立ち上がり */
  p.add(mesh(box(LEN, 0.03, 0.52), K.concDark, { pos: [0, 0.015, 0], name: 'duct-bottom' }));
  for (const sz of [-1, 1]) {
    p.add(mesh(box(LEN, H, WALL), K.conc, { pos: [0, 0.03 + H / 2, sz * (halfZ + WALL / 2)], name: 'duct-wall' }));
    p.add(mesh(box(LEN, 0.018, 0.022), K.galv, { pos: [0, H + 0.03 - 0.004, sz * (halfZ + WALL / 2)], cast: false, name: 'wall-rubber-seat' }));
  }
  for (const sx of [-1, 1]) p.add(mesh(box(WALL, H + 0.02, 0.52), K.conc, { pos: [sx * (LEN / 2 - WALL / 2), 0.03 + (H + 0.02) / 2 - 0.01, 0], name: 'end-wall' }));
  // 区画仕切（3 路に別れた槽）
  for (const cz of [-0.075, 0.075]) p.add(mesh(box(LEN - 0.14, 0.09, 0.022), K.concDark, { pos: [0, 0.075, cz], cast: false, name: 'divider' }));

  /* 蓋（6 枚・1 枚はズレ、1 枚は片端だけ浮く） */
  const covers = grp('covers');
  p.add(covers);
  const n = 6, cw = (LEN - 0.12) / n;
  for (let i = 0; i < n; i++) {
    const x = -LEN / 2 + 0.06 + cw / 2 + i * cw;
    const shifted = i === 2, lifted = i === 4;
    const dz = shifted ? 0.028 : 0;
    const dx = shifted ? range(rnd, -0.02, 0.02) : 0;
    const c = grp('cover', { pos: [x + dx, H + 0.03 + (lifted ? 0.024 : 0.012), dz], rot: [lifted ? -5 * D2R : 0, shifted ? 3.5 * D2R : 0, shifted ? 0 : range(rnd, -0.4, 0.4) * D2R] });
    covers.add(c);
    c.add(mesh(rbox(cw - 0.018, 0.05, 0.5 - Math.abs(dz) * 0.1, 0.006, 2), K.conc, { pos: [0, 0, 0], name: 'cover-slab' }));
    c.add(mesh(box(cw - 0.09, 0.014, 0.05), K.dark, { pos: [0, 0.02, 0], cast: false, name: 'lifting-hole' }));   // 蓋あけ穴
    c.add(mesh(box(cw - 0.05, 0.012, 0.024), K.galv, { pos: [0, 0.024, 0.16], cast: false }));                     // 押さえ金
    if (i % 2 === 0) c.add(mesh(box(0.032, 0.086, 0.54), K.galv, { pos: [cw / 2 - 0.006, -8e-3, 0], name: 'clamp-strap' }));
    weather(c, { w: cw * 0.7, h: 0.2, pos: [range(rnd, -0.05, 0.05), 0.028, range(rnd, -0.14, 0.14)], rot: [-HALF_PI, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 61 + i, density: 1.4, spread: 0.03 });
    weather(c, { w: cw * 0.5, h: 0.1, pos: [-cw * 0.2, 0.027, 0.1], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#6d6552', opacity: 0.42, seed: seed + 71 + i, density: 1.2 });
  }
  // ズレた蓋の隙間から覗くケーブル
  const cab = grp('exposed-cables', { pos: [-LEN / 2 + 0.06 + cw * 2.5, H + 0.02, 0.05] });
  p.add(cab);
  for (let i = 0; i < 3; i++) {
    cab.add(mesh(tubeOf([[-cw * 1.2, 0, -0.02 + i * 0.05], [-0.1, -0.012 + i * 0.004, 0.02 + i * 0.05], [cw * 1.2, 0.002, -0.01 + i * 0.05]], 0.011, 14, 7), i === 1 ? K.rubberOld : K.rubber));
  }
  cab.add(mesh(box(0.1, 0.02, 0.06), K.dark, { pos: [0, -0.02, 0.02], cast: false }));
  // 標識札（ケーブル槽であること）
  const tag = grp('duct-tag', { pos: [LEN / 2 - 0.3, H + 0.09, 0.28] });
  p.add(tag);
  tag.add(mesh(box(0.14, 0.06, 0.008), K.paintYellow, { pos: [0, 0, 0.006], rot: [-8 * D2R, 0, 0], cast: false }));
  decal(tag, { map: TEX.signboard({ text: '電源ケーブル', sub: '立入注意', bg: '#f0c353', fg: '#33312c' }), w: 0.126, h: 0.048, pos: [0, 0, 0.012], rot: [-8 * D2R, 0, 0], order: 1 });
  // 端部の配管取出し・砕石・枯葉
  p.add(mesh(cyl(0.042, 0.042, 0.14, 12), K.alu, { pos: [-LEN / 2 + 0.02, 0.08, -0.3], rot: [0, 0, HALF_PI], cast: false }));
  p.add(mesh(cyl(0.042, 0.042, 0.14, 12), K.alu, { pos: [LEN / 2 - 0.02, 0.08, -0.3], rot: [0, 0, HALF_PI], cast: false }));
  for (let i = 0; i < 5; i++) leaf(p, rnd, range(rnd, -1.1, 1.1), H + 0.095, range(rnd, -0.2, 0.2), K, range(rnd, 0.75, 1.2));
  mound(p, K, rnd, -0.9, H + 0.062, 0.19, 0.3, 0.1, 0.4, K.dirt);
  // 経年：① 側面の掉漆 ② 蓋の欠け ③ 縫目の土砂 ④ 金具の錆
  weather(p, { w: LEN * 0.7, h: 0.1, pos: [0.1, 0.09, 0.253], kind: 'chip', color: '#c7c1b1', opacity: 0.45, seed: seed + 81, density: 1.4, spread: 0.02 });
  for (const sx of [-1, 1]) weather(p, { w: 0.16, h: 0.14, pos: [sx * (LEN / 2 - 0.1), H + 0.06, 0.2], kind: 'rust', color: '#7d4a2b', opacity: 0.5, seed: seed + 91 + sx, density: 1.6, spread: 0.02 });
  decal(p, { map: TEX.wear({ kind: 'dirt', color: '#5f5642', seed: seed + 95, density: 1.5 }), w: LEN * 0.8, h: 0.06, pos: [0, H + 0.062, 0], rot: [-HALF_PI, 0, 0], opacity: 0.45, order: 2 });
  // 側壁際の砕石（路盤と同じ石）
  for (let i = 0; i < 16; i++) {
    p.add(mesh(rbox(range(rnd, 0.02, 0.05), 0.018, range(rnd, 0.02, 0.05), 0.008, 1), K.gravel, {
      pos: [range(rnd, -LEN / 2, LEN / 2), 0.01, (rnd() > 0.5 ? 1 : -1) * range(rnd, 0.28, 0.36)],
      rot: [0, range(rnd, 0, 3.14), 0], cast: false,
    }));
  }
}

/* ═══════════════════════════════════════════════════════════════ 線路標識 */
function buildMarker(g, rnd, seed, K) {
  const p = grp('track-marker');
  g.add(p);

  /** 支柱 1 本（根元コンクリ collar ＋ 微傾き） */
  function post(name, x, z, h, tilt, mat) {
    const s = grp(name, { pos: [x, 0, z], rot: [tilt[0], 0, tilt[1]] });
    p.add(s);
    s.add(mesh(rbox(0.2, 0.06, 0.2, 0.01, 2), K.concDark, { pos: [0, 0.034, 0], name: name + '-collar' }));
    s.add(mesh(box(0.055, h, 0.055), mat, { pos: [0, 0.044 + h / 2, 0], name: name + '-post' }));
    for (const hy of [0.14, h * 0.6]) s.add(mesh(box(0.075, 0.016, 0.075), K.rust, { pos: [0, hy, 0], cast: false }));
    s.add(mesh(box(0.062, 0.016, 0.062), K.alu, { pos: [0, 0.044 + h + 0.008, 0], cast: false }));   // 柱頭キャップ
    weather(s, { w: 0.09, h: 0.28, pos: [0.02, 0.3, 0.03], kind: 'rust', color: '#7b4728', opacity: 0.55, seed: seed + Math.round(x * 97), density: 1.8, spread: 0.018 });
    weather(s, { w: 0.22, h: 0.06, pos: [0, 0.12, 0.06], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 130 + Math.round(z * 7), density: 1.5, spread: 0.016 });
    return s;
  }

  /* ① 停止位置目標（白丸＋黒帯・+Z 向き） */
  const a = post('post-stop', -0.28, 0.0, 1.06, [range(rnd, -0.02, 0.02), range(rnd, -0.025, 0.02)], K.paintGrey);
  const st = grp('stop-target', { pos: [0, 1.16, 0.03], rot: [-6 * D2R, 0, 0] });
  a.add(st);
  st.add(mesh(box(0.34, 0.3, 0.014), K.paintGrey, { pos: [0, 0, -8e-3], name: 'backing' }));
  st.add(mesh(cyl(0.13, 0.13, 0.016, 24), K.paintDark, { pos: [0, 0, 0.004], rot: [HALF_PI, 0, 0], name: 'target-outer' }));
  st.add(mesh(cyl(0.09, 0.09, 0.006, 24), K.paintWhite, { pos: [0, 0, 0.014], rot: [HALF_PI, 0, 0], cast: false, name: 'target-inner' }));
  st.add(mesh(box(0.15, 0.026, 0.006), K.paintWhite, { pos: [0, 0, 0.017], cast: false }));
  for (const [bx, by] of [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.12], [0.14, -0.12]]) boltZ(st, K.ss, bx, by, 0.004, 0.006, 0.009);
  weather(st, { w: 0.24, h: 0.12, pos: [0.02, -0.06, 0.018], kind: 'chip', color: '#c9c3b2', opacity: 0.42, seed: seed + 141, density: 1.5, spread: 0.01 });
  weather(st, { w: 0.14, h: 0.2, pos: [-0.05, 0.02, 0.019], kind: 'dirt', color: '#8a8474', opacity: 0.35, seed: seed + 142, density: 1.3, spread: 0.01 });

  /* ② 注意標（黄の菱形・黒字） */
  const b = post('post-caution', 0.02, -0.06, 0.72, [range(rnd, -0.015, 0.02), range(rnd, -0.03, 0.015)], K.paintGrey);
  const ct = grp('caution-sign', { pos: [0, 0.8, 0.02], rot: [0, 0, 45 * D2R] });
  b.add(ct);
  ct.add(mesh(rbox(0.2, 0.2, 0.012, 0.012, 2), K.paintYellow, { pos: [0, 0, 0], name: 'diamond' }));
  ct.add(mesh(rbox(0.164, 0.164, 0.004, 0.01, 2), MAT.paint('#f7f3e6', { steps: 2, spec: 0.24 }), { pos: [0, 0, 0.008], cast: false }));
  decal(ct, { map: TEX.signboard({ text: '徐', sub: '', bg: '#f7f3e6', fg: '#33312c', ar: 1 }), w: 0.13, h: 0.13, pos: [0, 0, 0.011], rot: [0, 0, -45 * D2R], order: 1 });
  ct.add(mesh(box(0.22, 0.05, 0.01), K.paintGrey, { pos: [0, -0.13, -0.01], rot: [0, 0, -45 * D2R], cast: false }));
  weather(ct, { w: 0.16, h: 0.16, pos: [0.01, 0.01, 0.012], rot: [0, 0, -45 * D2R], kind: 'scratch', color: '#e7e0cb', opacity: 0.3, seed: seed + 151, density: 1.0 });

  /* ③ 距離標（白杭＋赤帽＋番号札） */
  const c = post('post-distance', 0.3, 0.08, 0.5, [range(rnd, 0.01, 0.035), range(rnd, -0.02, 0.02)], K.paintWhite);
  const dg = grp('distance-plate', { pos: [0, 0.42, 0.026] });
  c.add(dg);
  dg.add(mesh(rbox(0.1, 0.13, 0.01, 0.008, 2), K.paintWhite, { pos: [0, 0, 0.004] }));
  decal(dg, { map: numberTex('14', 'KM'), w: 0.088, h: 0.115, pos: [0, 0.006, 0.011], order: 1 });
  c.add(mesh(cyl(0.032, 0.034, 0.05, 12), MAT.metalPaint(PAL.trainAccent, { worn: 1.4, uv: { repeat: [0.3, 0.3] } }), { pos: [0, 0.593, 0], name: 'red-cap' }));
  weather(dg, { w: 0.09, h: 0.1, pos: [0, -0.03, 0.013], kind: 'dirt', color: '#8a8474', opacity: 0.4, seed: seed + 161, density: 1.4, spread: 0.008 });

  /* ④ 標識を支える添木・針金・配線 */
  p.add(mesh(box(0.03, 0.5, 0.03), K.timberOld, { pos: [0.16, 0.3, -0.12], rot: [0, 0, 6 * D2R], name: 'adder' }));
  for (const hy of [0.16, 0.44]) p.add(mesh(tubeOf([[0.02, hy, -0.03], [0.1, hy + 0.01, -0.09], [0.16, hy, -0.14]], 0.004, 8, 5), K.rust, { name: 'binding-wire' }));
  p.add(mesh(tubeOf([[-0.28, 0.05, 0.06], [-0.14, 0.02, 0.12], [0.02, 0.04, 0.1]], 0.006, 12, 6), K.rubberOld, { name: 'spare-lead' }));

  /* ⑤ 根部の堆積土砂・砕石・枯葉（傾きの言い訳にもなる） */
  mound(p, K, rnd, -0.28, 0.03, 0.08, 0.26, 0.22, 0.5, K.dirt);
  mound(p, K, rnd, 0.32, 0.02, -0.02, 0.2, 0.18, 0.4, K.gravel);
  for (let i = 0; i < 4; i++) leaf(p, rnd, range(rnd, -0.35, 0.35), 0.02, range(rnd, -0.12, 0.16), K, range(rnd, 0.7, 1.1));
  weather(p, { w: 0.7, h: 0.08, pos: [0.0, 0.1, 0.06], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 171, density: 1.5, spread: 0.02 });
}

/* ═════════════════════════════════════════════════════════════════ 車止め */
function buildStop(g, rnd, seed, K) {
  const p = grp('buffer-stop');
  g.add(p);
  const W = 2.24, zBeam = 0.06;                       // バッファ梁の前後面
  const mBeam = MAT.metalPaint(shade(PAL.trainSkirt, 0.96), { worn: 1.35, uv: { repeat: [0.25, 0.25] }, spec: 0.24, shadowAmt: 0.9 });

  /* 後方のコンクリート基礎 blok（盛土側） */
  p.add(mesh(rbox(W + 0.1, 0.3, 0.46, 0.012, 2), K.concDark, { pos: [0, 0.15, -0.31], name: 'anchor-block' }));
  p.add(mesh(box(W + 0.14, 0.05, 0.1), K.conc, { pos: [0, 0.31, -0.14], name: 'block-coping' }));
  for (let i = 0; i < 5; i++) {
    p.add(mesh(cyl(0.016, 0.016, 0.06, 8), K.rust, { pos: [-0.84 + i * 0.42, 0.33, -0.31], cast: false }));   // アースボルト
  }
  weather(p, { w: W * 0.8, h: 0.2, pos: [0, 0.24, -0.54], kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 211, density: 1.6, spread: 0.05 });

  /* 鋼柱（2 本）＋ 斜め支持 */
  for (const sx of [-1, 1]) {
    const col = grp('column-' + (sx > 0 ? 'r' : 'l'), { pos: [sx * 0.95, 0, -0.1] });
    p.add(col);
    col.add(mesh(cyl(0.085, 0.1, 0.52, 14), mBeam, { pos: [0, 0.26, 0], name: 'column' }));
    col.add(mesh(box(0.26, 0.03, 0.26), K.paintDark, { pos: [0, 0.02, 0], name: 'base-plate' }));
    for (const [bx, bz] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) boltY(col, K.rust, bx, 0.035, bz, 0.011, 0.026);
    col.add(mesh(box(0.24, 0.2, 0.024), K.paintDark, { pos: [0, 0.42, 0.02], name: 'gusset' }));
    col.add(mesh(tubeOf([[0, 0.16, -0.02], [-sx * 0.2, 0.14, -0.26], [-sx * 0.28, 0.1, -0.36]], 0.026, 14, 7), mBeam, { name: 'diagonal-brace' }));
    weather(col, { w: 0.14, h: 0.26, pos: [0.04, 0.3, 0.09], kind: 'rust', color: '#7a4526', opacity: 0.55, seed: seed + 221 + sx, density: 1.9, spread: 0.02 });
  }

  /* バッファ梁（上下一対・車輪受けはゲージ位置） */
  const beams = grp('buffer-beams');
  p.add(beams);
  for (const [by, bh] of [[0.18, 0.15], [0.36, 0.13]]) {
    beams.add(mesh(box(W, bh, 0.16), mBeam, { pos: [0, by, zBeam], name: 'beam' }));
    beams.add(mesh(box(W + 0.02, 0.022, 0.18), K.alu, { pos: [0, by + bh / 2 - 0.01, zBeam], cast: false, name: 'beam-cap' }));
    beams.add(mesh(box(W, 0.02, 0.02), K.paintDark, { pos: [0, by - bh / 2 + 0.008, zBeam + 0.09], cast: false }));
  }
  // 緩衝材（ゴム＋鋼_plate 3 組）
  for (const bx of [-0.86, 0, 0.86]) {
    const bu = grp('buffer', { pos: [bx, 0.18, zBeam + 0.08] });
    beams.add(bu);
    bu.add(mesh(cyl(0.062, 0.072, 0.05, 14), K.paintDark, { pos: [0, 0, 0.026], rot: [HALF_PI, 0, 0], name: 'buffer-plate' }));
    bu.add(mesh(cyl(0.05, 0.056, 0.036, 14), K.rubber, { pos: [0, 0, 0.062], rot: [HALF_PI, 0, 0], name: 'rubber-pad' }));
    bu.add(hoop(0.066, 0.007, K.rust, { pos: [0, 0, 0.03], rot: [HALF_PI, 0, 0], cast: false }));
    for (const [ax, ay] of [[-0.04, 0], [0.04, 0], [0, 0.04], [0, -0.04]]) boltZ(bu, K.steel, ax, ay, 0.052, 0.006, 0.008);
    weather(bu, { w: 0.1, h: 0.1, pos: [0.01, -0.03, 0.05], kind: 'chip', color: '#b8b2a2', opacity: 0.4, seed: seed + 231 + Math.round(bx * 10), density: 1.4 });
  }
  // 車輪受け（ゲージ 1.067 に合う 2 枚のガイド plate、レールと干渉しないよう前端は梁より下流）
  for (const sz of [-1, 1]) {
    const gu = grp('wheel-guide', { pos: [sz * GAUGE_HALF, 0.075, zBeam - 0.02] });
    beams.add(gu);
    gu.add(mesh(rbox(0.2, 0.15, 0.2, 0.012, 2), mBeam, { pos: [0, 0, 0], name: 'guide-block' }));
    gu.add(mesh(box(0.2, 0.03, 0.06), K.paintYellow, { pos: [0, 0.084, 0.06], cast: false }));
    gu.add(mesh(box(0.06, 0.14, 0.1), K.dark, { pos: [0, 0.0, -0.09], cast: false }));
    weather(gu, { w: 0.2, h: 0.07, pos: [0, 0.01, 0.06], kind: 'rust', color: '#7d4a2b', opacity: 0.5, seed: seed + 241 + sz, density: 1.7, spread: 0.02 });
  }

  /* 塗分け（黄黑ハゼン帯）と目標（黒地に白十字＝夜間反射板） */
  const band = grp('hazard-band');
  p.add(band);
  const hz = hazardTex();
  for (let i = 0; i < 5; i++) {
    const x = -0.88 + i * 0.44;
    band.add(mesh(box(0.42, 0.07, 0.014), K.paintYellow, { pos: [x, 0.29, zBeam + 0.085], name: 'hazard-block' }));
    decal(band, { map: hz, w: 0.4, h: 0.064, pos: [x, 0.29, zBeam + 0.094], order: 1 });
  }
  const target = grp('night-target', { pos: [0, 0.48, zBeam + 0.09] });
  p.add(target);
  target.add(mesh(rbox(0.3, 0.3, 0.014, 0.01, 2), K.paintDark, { pos: [0, 0, 0], name: 'target-plate' }));
  target.add(mesh(box(0.22, 0.05, 0.008), K.paintWhite, { pos: [0, 0, 0.011], cast: false }));
  target.add(mesh(box(0.05, 0.22, 0.008), K.paintWhite, { pos: [0, 0, 0.011], cast: false }));
  for (const [bx, by] of [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.12], [0.12, -0.12]]) boltZ(target, K.ss, bx, by, 0.012, 0.006, 0.009);
  decal(target, { map: TEX.signboard({ text: '停止', sub: '春日社区線', bg: '#2c2f33', fg: '#f2efe2' }), w: 0.22, h: 0.06, pos: [0, -0.11, 0.012], order: 2 });
  // 反射板の汚れ・シール剥がし跡（経年①）
  weather(target, { w: 0.24, h: 0.2, pos: [0.02, 0.02, 0.016], kind: 'dirt', color: '#9a9484', opacity: 0.32, seed: seed + 251, density: 1.3, spread: 0.01 });

  /* 手すり・点検ステップ・配管・標札 */
  p.add(mesh(tubeOf([[-1.05, 0.5, -0.06], [-1.05, 0.66, -0.02], [-0.9, 0.68, 0.0], [-0.72, 0.66, -0.03]], 0.016, 14, 7), K.steel, { name: 'walk-rail' }));
  p.add(mesh(box(0.24, 0.026, 0.18), K.galv, { pos: [-0.7, 0.338, -0.14], name: 'check-step' }));
  p.add(mesh(cyl(0.024, 0.024, 0.36, 10), K.alu, { pos: [0.66, 0.42, -0.31], name: 'drain-pipe' }));
  const tag2 = grp('stop-tag', { pos: [0.95, 0.56, -0.03] });
  p.add(tag2);
  tag2.add(mesh(box(0.14, 0.09, 0.008), K.paintWhite, { pos: [0, 0, 0.006], rot: [0, 0, -4 * D2R], cast: false }));
  decal(tag2, { map: numberTex('BM 2', '1.067'), w: 0.13, h: 0.085, pos: [0, 0, 0.011], rot: [0, 0, -4 * D2R], order: 1 });

  /* 経年②〜⑤：梁の掉漆・錆流痕・土砂堆積・落書き除去跡 */
  for (let i = 0; i < 5; i++) {
    weather(beams, { w: range(rnd, 0.16, 0.42), h: range(rnd, 0.06, 0.12), pos: [range(rnd, -1, 1.0), range(rnd, 0.18, 0.42), zBeam + 0.086], kind: i % 2 ? 'rust' : 'chip', color: i % 2 ? '#7c4a2b' : '#b8b2a2', opacity: 0.48, seed: seed + 261 + i, density: 1.6, spread: 0.02 });
  }
  for (const sz of [-1, 1]) weather(beams, { w: 0.5, h: 0.1, pos: [sz * 0.5, 0.1, zBeam + 0.09], kind: 'scratch', color: '#e7e2d2', opacity: 0.24, seed: seed + 271 + sz, density: 1.1, spread: 0.02 });
  mound(p, K, rnd, -0.4, 0.012, 0.14, 0.6, 0.24, 0.35, K.dirt);
  mound(p, K, rnd, 0.7, 0.012, 0.02, 0.4, 0.2, 0.3, K.gravel);
  for (let i = 0; i < 4; i++) leaf(p, rnd, range(rnd, -1, 1.0), 0.03, range(rnd, 0.0, 0.2), K, range(rnd, 0.8, 1.2));
  decal(p, { map: TEX.wear({ kind: 'scratch', color: '#e8e3d2', seed: seed + 281, density: 0.8 }), w: 0.4, h: 0.12, pos: [-0.55, 0.24, zBeam + 0.087], opacity: 0.5, order: 3 });
}

/* ══════════════════════════════════════════════════════════ 側溝の落口・伏越 */
function buildDrain(g, rnd, seed, K) {
  const p = grp('drain-inlet');
  g.add(p);
  const LEN = 1.6, WID = 0.5, TOP = 0.22;             // 側溝天端 y=+0.22（溝床に据える前提）
  const WALL = 0.055;

  /* 落口（集水井）の枠 */
  p.add(mesh(box(LEN, 0.03, WID + WALL * 2), K.concDark, { pos: [0, 0.015, 0], name: 'slab-bottom' }));
  for (const sz of [-1, 1]) p.add(mesh(box(LEN, TOP, WALL), K.conc, { pos: [0, TOP / 2, sz * (WID / 2 + WALL / 2)], name: 'side-wall' }));
  for (const sx of [-1, 1]) p.add(mesh(box(WALL, TOP + 0.02, WID + WALL * 2), K.conc, { pos: [sx * (LEN / 2 - WALL / 2), (TOP + 0.02) / 2, 0], name: 'end-wall' }));
  // 内部の段（落口底部へ勾配）
  p.add(mesh(box(LEN - 0.16, 0.02, WID - 0.06), K.concDark, { pos: [0, 0.05, 0], rot: [0, 0, 1.2 * D2R], name: 'invert-slab' }));
  const sump = grp('sump', { pos: [-0.34, 0.055, 0] });
  p.add(sump);
  sump.add(mesh(box(0.42, 0.07, 0.34), K.concDark, { pos: [0, 0.01, 0], cast: false }));
  sump.add(mesh(box(0.36, 0.02, 0.28), K.dirt, { pos: [0, 0.05, 0], cast: false, name: 'silt-bed' }));

  /* 鉄格子（溝幅を跨ぐ棒＋縦受け）— 天端より 15mm 控え、踏んだとき沈まない高さ */
  const gr = grp('grating', { pos: [0.12, TOP - 0.015, 0] });
  p.add(gr);
  const barN = 7;
  for (let i = 0; i < barN; i++) {
    const x = -0.52 + i * (1.04 / (barN - 1));
    const sag = i === 3 ? -0.012 : range(rnd, -3e-3, 0.003);      // 一つだけ沈んだ棒
    gr.add(mesh(box(0.036, 0.026, WID - 0.02), K.galv, { pos: [x, sag, 0], rot: [0, 0, range(rnd, -0.8, 0.8) * D2R], name: 'grate-bar' }));
    gr.add(mesh(box(0.012, 0.008, WID - 0.06), K.rust, { pos: [x, 0.016 + sag, 0], cast: false }));
  }
  for (const cz of [-1, 1]) gr.add(mesh(box(1.08, 0.03, 0.036), K.galv, { pos: [0, 0.004, cz * (WID / 2 - 0.03)], name: 'grate-rail' }));
  gr.add(mesh(box(0.5, 0.024, 0.03), K.galv, { pos: [0.0, 0.004, 0], cast: false }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) boltZ(gr, K.rust, sx * 0.52, 0.014, sz * (WID / 2 - 0.03), 0.007, 0.01);
  // 格子受けアングル（側壁上端）
  for (const sz of [-1, 1]) p.add(mesh(box(LEN - 0.12, 0.024, 0.03), K.galv, { pos: [0.12, TOP - 0.036, sz * (WID / 2 - 0.02)], cast: false, name: 'grate-seat' }));

  /* 伏越（溝を交差する埋没管路）— 側壁をくぐらせる U 管＋冠板 */
  const ub = grp('buried-crossing', { pos: [-0.52, 0, 0] });
  p.add(ub);
  ub.add(mesh(cyl(0.11, 0.11, 0.62, 14, true), K.conc, { pos: [0, 0.13, 0], rot: [HALF_PI, 0, 0], name: 'cross-pipe' }));
  ub.add(hoop(0.116, 0.012, K.rust, { pos: [0, 0.13, -0.29], cast: false }));
  ub.add(hoop(0.116, 0.012, K.rust, { pos: [0, 0.13, 0.29], cast: false }));
  ub.add(mesh(box(0.3, 0.024, 0.2), K.concDark, { pos: [0, 0.235, 0], name: 'pipe-crown' }));
  ub.add(mesh(box(0.26, 0.06, 0.02), K.rust, { pos: [0, 0.11, 0.24], cast: false }));            // 端枠
  // 伏越の入口金物の下を潜る水跡
  weather(ub, { w: 0.3, h: 0.08, pos: [0, 0.25, 0], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#7d7566', opacity: 0.45, seed: seed + 311, density: 1.5, spread: 0.02 });
  // 仮蓋代わりに掛けた古材（側壁に渡してある）
  const plank = mesh(rbox(0.12, 0.026, 0.56, 0.008, 2), K.timber, { pos: [0.7, 0.232, 0], rot: [0, 2.6 * D2R, -1.2 * D2R], name: 'temp-plank' });
  p.add(plank);
  weather(p, { w: 0.14, h: 0.5, pos: [0.7, 0.248, 0], rot: [-HALF_PI, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 313, density: 1.3, spread: 0.03 });

  /* 堆積土砂・落ちた小石・枯葉（格子の上と井戸の内） */
  mound(p, K, rnd, -0.4, 0.07, 0.02, 0.34, 0.22, 0.5, K.dirt);
  mound(sump, K, rnd, 0.1, 0.06, -0.06, 0.2, 0.14, 0.4, K.dirt);
  for (let i = 0; i < 14; i++) {
    p.add(mesh(rbox(range(rnd, 0.018, 0.045), 0.016, range(rnd, 0.018, 0.04), 0.007, 1), rnd() > 0.6 ? K.gravel : K.dirt, {
      pos: [range(rnd, -0.7, 0.7), 0.02 + rnd() * 0.03, range(rnd, -0.16, 0.16)],
      rot: [0, range(rnd, 0, 3.14), 0], cast: false,
    }));
  }
  for (let i = 0; i < 5; i++) leaf(p, rnd, range(rnd, -0.5, 0.6), TOP - 0.005, range(rnd, -0.18, 0.18), K, range(rnd, 0.8, 1.2));

  /* 経年：① 側壁の掉漆 ② 縁の欠け ③ 苔 ④ 錆 */
  for (const sz of [-1, 1]) {
    weather(p, { w: 0.5, h: 0.1, pos: [range(rnd, -0.5, 0.5), TOP - 0.05, sz * (WID / 2 + WALL + 0.003)], kind: 'chip', color: '#c8c2b2', opacity: 0.45, seed: seed + 321 + sz, density: 1.5, spread: 0.02 });
    weather(p, { w: 0.7, h: 0.08, pos: [range(rnd, -0.3, 0.4), 0.078, sz * (WID / 2 + WALL + 0.003)], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 331 + sz, density: 1.7, spread: 0.02 });
  }
  for (let i = 0; i < 3; i++) {
    const r0 = range(rnd, 0.02, 0.045);
    p.add(mesh(sph(r0, 8, 6), K.gravel, { pos: [range(rnd, -0.7, 0.7), TOP - r0 * 0.35, (i % 2 ? 1 : -1) * (WID / 2 + WALL / 2)], scale: [1.2, 0.5, 1.0], cast: false }));   // 縁の欠け（骨材が露出）
  }
  decal(p, { map: TEX.wear({ kind: 'dirt', color: '#6d6552', seed: seed + 341, density: 1.6 }), w: LEN * 0.7, h: 0.08, pos: [0.1, TOP + 0.004, 0.12], rot: [-HALF_PI, 0, 0], opacity: 0.4, order: 2 });
}

/* ═══════════════════════════════════════════════════════════ 速度標・ATS 風 */
function buildSpeed(g, rnd, seed, K) {
  const p = grp('speed-ats');
  g.add(p);
  const POST_H = 1.74;

  /* 支柱（根元コンクリ・アンカー 4 本・微傾き） */
  p.add(mesh(rbox(0.26, 0.09, 0.26, 0.012, 2), K.concDark, { pos: [0, 0.045, -0.02], name: 'footing' }));
  p.add(mesh(box(0.3, 0.02, 0.3), K.conc, { pos: [0, 0.098, -0.02], name: 'grout' }));
  for (const [bx, bz] of [[-0.09, -0.11], [0.09, -0.11], [-0.09, 0.07], [0.09, 0.07]]) boltY(p, K.rust, bx, 0.108, bz, 0.01, 0.028);
  const post = grp('post', { pos: [0, 0.11, -0.02], rot: [range(rnd, -0.012, 0.014), 0, range(rnd, -0.016, 0.012)] });
  p.add(post);
  post.add(mesh(box(0.062, POST_H, 0.05), K.paintGrey, { pos: [0, POST_H / 2, 0], name: 'angle-post' }));
  post.add(mesh(box(0.024, POST_H, 0.052), K.paintGrey, { pos: [0.03, POST_H / 2, 0], cast: false }));
  for (const hy of [0.4, 1.02]) post.add(mesh(box(0.09, 0.02, 0.075), K.rust, { pos: [0.01, hy, 0], cast: false }));
  post.add(mesh(box(0.07, 0.016, 0.06), K.alu, { pos: [0, POST_H + 0.008, 0], cast: false }));

  /* 速度標（白地・黒フチ・45）— 現示面 +Z */
  const sp = grp('speed-target', { pos: [0, POST_H - 0.2, 0.05], rot: [-4 * D2R, 0, 0] });
  post.add(sp);
  sp.add(mesh(cyl(0.19, 0.19, 0.016, 28), K.paintGrey, { pos: [0, 0, -8e-3], rot: [HALF_PI, 0, 0], name: 'sign-backing' }));
  sp.add(mesh(cyl(0.178, 0.178, 0.01, 28), K.paintWhite, { pos: [0, 0, 0.002], rot: [HALF_PI, 0, 0], name: 'sign-face' }));
  sp.add(mesh(tor(0.164, 0.012, 6, 26), K.paintDark, { pos: [0, 0, 0.008], cast: false, name: 'sign-ring' }));
  decal(sp, { map: numberTex('45', 'km/h'), w: 0.2, h: 0.2, pos: [0, 0.005, 0.009], order: 1 });
  for (const [bx, by] of [[-0.13, -0.11], [0.13, -0.11], [0, 0.15]]) boltZ(sp, K.ss, bx, by, 0.01, 0.006, 0.009);
  weather(sp, { w: 0.2, h: 0.16, pos: [0.05, -0.07, 0.011], kind: 'chip', color: '#cfc9b6', opacity: 0.45, seed: seed + 411, density: 1.5, spread: 0.02 });
  weather(sp, { w: 0.1, h: 0.26, pos: [-0.1, 0.02, 0.011], kind: 'dirt', color: '#8a8474', opacity: 0.32, seed: seed + 412, density: 1.2, spread: 0.02 });

  /* ATS 風標識（黄黒のななめ帯板）＋地上子（レール間に埋まるコイル箱） */
  const at = grp('ats-board', { pos: [0, POST_H - 0.72, 0.045], rot: [-3 * D2R, 0, 0] });
  post.add(at);
  at.add(mesh(box(0.3, 0.13, 0.012), K.paintYellow, { name: 'ats-plate' }));
  for (let i = 0; i < 5; i++) at.add(mesh(box(0.032, 0.132, 0.004), K.paintDark, { pos: [-0.12 + i * 0.06, 0, 0.008], rot: [0, 0, -14 * D2R], cast: false }));
  decal(at, { map: TEX.signboard({ text: 'ats', sub: '', bg: '#f0c353', fg: '#2f2c26' }), w: 0.1, h: 0.055, pos: [0.08, 0, 0.01], order: 1 });
  at.add(mesh(box(0.06, 0.02, 0.06), K.dark, { pos: [0, -0.075, -0.01], cast: false }));
  const bs = grp('ats-booster', { pos: [0, 0.03, -0.5] });
  p.add(bs);
  bs.add(mesh(rbox(0.3, 0.06, 0.2, 0.01, 2), K.concDark, { pos: [0, 0.01, 0], name: 'booster-frame' }));
  bs.add(mesh(box(0.24, 0.014, 0.15), K.galv, { pos: [0, 0.046, 0], name: 'booster-cover' }));
  for (const [bx, bz] of [[-0.09, -0.05], [0.09, -0.05], [-0.09, 0.05], [0.09, 0.05]]) boltZ(bs, K.rust, bx, 0.054, bz, 0.006, 0.008);
  bs.add(mesh(tubeOf([[0.11, 0.05, 0.06], [0.22, 0.14, 0.2], [0.14, 0.22, 0.42]], 0.011, 12, 6), K.rubberOld, { name: 'booster-lead' }));

  /* 経年：土砂・枯葉・錆・苔・剥した貼紙 */
  mound(p, K, rnd, 0.02, 0.09, 0.14, 0.3, 0.2, 0.4, K.dirt);
  for (let i = 0; i < 3; i++) leaf(p, rnd, range(rnd, -0.2, 0.2), 0.11, range(rnd, 0.02, 0.2), K, range(rnd, 0.8, 1.1));
  weather(post, { w: 0.09, h: 0.7, pos: [0.035, 0.5, 0.02], kind: 'rust', color: '#7b4728', opacity: 0.55, seed: seed + 421, density: 1.9, spread: 0.04 });
  weather(post, { w: 0.12, h: 0.2, pos: [0, 0.2, 0.03], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 422, density: 1.5, spread: 0.04 });
  decal(p, { map: TEX.wear({ kind: 'scratch', color: '#e7e2d0', seed: seed + 423, density: 0.7 }), w: 0.12, h: 0.16, pos: [0.002, 1.1, 0.038], opacity: 0.55, order: 2 });
}

/* ══════════════════════════════════════════════════════════ 防草マット端 */
function buildWeed(g, rnd, seed, K) {
  const p = grp('weed-mat-edge');
  g.add(p);
  const LEN = 2.4, WID = 0.9, T = 0.011;

  /* マット（端が捲れた分部だけ角度を変える）と U 金 */
  const nSeg = 8;
  for (let i = 0; i < nSeg; i++) {
    const x = -LEN / 2 + (i + 0.5) * (LEN / nSeg);
    const curl = i === nSeg - 2 ? 0.42 : i === 1 ? 0.12 : 0;
    const seg = grp(`mat-seg-${i}`, { pos: [x, 0, 0] });
    p.add(seg);
    seg.add(mesh(box(LEN / nSeg - 0.006, T, WID - curl * 0.42), K.rubber, {
      pos: [0, T / 2 + curl * 0.03, -curl * 0.18], rot: [curl * 3.4 * D2R, range(rnd, -6e-3, 0.006), 0], name: 'mat-panel', cast: false,
    }));
    if (curl > 0.3) seg.add(mesh(box(LEN / nSeg, T * 0.8, 0.12), K.rubberOld, { pos: [0, T + 0.06, -WID / 2 + 0.04], rot: [-32 * D2R, 0, 0], cast: false, name: 'mat-curl' }));
    if (i % 2 === 1) continue;
    for (const pz of [-WID / 2 + 0.12, 0, WID / 2 - 0.12]) {
      const bent = i === 5;
      const pin = grp('staple', { pos: [0, T * 0.9, pz + (bent ? 0.05 : 0)], rot: [0, 0, bent ? 22 * D2R : range(rnd, -2, 2) * D2R] });
      pin.add(mesh(box(0.012, 0.02, 0.11), K.rust, { pos: [0, 0.004, 0], cast: false }));
      pin.add(mesh(box(0.012, 0.075, 0.012), K.rust, { pos: [0, -0.03, 0.05], cast: false }));
      pin.add(mesh(box(0.012, 0.075, 0.012), K.rust, { pos: [0, -0.03, -0.05], cast: false }));
      seg.add(pin);
    }
  }
  /* 切口のほつれ・補修アルミテープ */
  for (let i = 0; i < 22; i++) {
    p.add(mesh(box(0.006, 0.004, range(rnd, 0.03, 0.09)), K.rubberOld, {
      pos: [-LEN / 2 + 0.05 + (i / 21) * (LEN - 0.1), 0.004, WID / 2 + range(rnd, 0, 0.03)], rot: [0, range(rnd, -0.25, 0.25), 0], cast: false,
    }));
  }
  const patch = grp('repair-patch', { pos: [-0.55, T + 0.004, 0.08], rot: [0, 0, -4 * D2R] });
  p.add(patch);
  patch.add(mesh(box(0.34, 0.004, 0.2), K.alu, { name: 'tape' }));
  patch.add(mesh(box(0.3, 0.006, 0.016), K.rubberOld, { pos: [0, 0.002, 0.06], cast: false }));
  weather(patch, { w: 0.3, h: 0.16, pos: [0.02, 0.006, 0], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#6d6552', opacity: 0.45, seed: seed + 441, density: 1.4 });

  /* 吹き上がった砕石・マット越しに萌えた草・落ち葉 */
  for (let i = 0; i < 26; i++) {
    p.add(mesh(rbox(range(rnd, 0.018, 0.05), 0.016, range(rnd, 0.018, 0.046), 0.007, 1), K.gravel, {
      pos: [range(rnd, -LEN / 2, LEN / 2), 0.008, range(rnd, -WID / 2, WID / 2)], rot: [0, range(rnd, 0, 3.1), 0], cast: false,
    }));
  }
  const bladeGeo = new PlaneGeometry(0.026, 0.16);
  bladeGeo.translate(0, 0.08, 0);
  p.add(inst(bladeGeo, MAT.grass({ repeat: 1, base: shade(PAL.grass, 0.94) }), 64, (i, d, r) => {
    const onEdge = r() > 0.55;
    d.position.set(r() * LEN - LEN / 2, T * 0.6, onEdge ? WID / 2 - r() * 0.12 : (r() - 0.5) * WID * 0.7);
    d.rotation.set((r() - 0.5) * 0.2, r() * 3.14, (r() - 0.5) * 0.5);
    d.scale.set(0.7 + r() * 0.7, 0.6 + r() * 0.9, 1);
  }, { name: 'grass-through-mat', cast: false, receive: true }));
  for (let i = 0; i < 4; i++) leaf(p, rnd, range(rnd, -1, 1), T + 0.01, range(rnd, -0.3, 0.4), K, range(rnd, 0.8, 1.2));
  // 経年：① UV 退色 ② 土砂堆積 ③ 苔 ④ 端の捲れ・ほつれ
  for (let i = 0; i < 3; i++) {
    weather(p, { w: range(rnd, 0.4, 0.9), h: 0.2, pos: [range(rnd, -0.9, 0.9), T + 0.004, range(rnd, -0.3, 0.3)], rot: [-HALF_PI, 0, 0], kind: 'chip', color: '#6a6c66', opacity: 0.5, seed: seed + 451 + i, density: 1.3, spread: 0.02 });
  }
  weather(p, { w: LEN * 0.8, h: 0.2, pos: [0, T + 0.005, -WID / 2 + 0.16], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#7a6f58', opacity: 0.5, seed: seed + 455, density: 1.6, spread: 0.02 });
  decal(p, { map: TEX.wear({ kind: 'moss', color: '#5f7a46', seed: seed + 456, density: 1.6 }), w: 0.7, h: 0.34, pos: [0.7, T + 0.006, -0.1], rot: [-HALF_PI, 0, 0], opacity: 0.55, order: 2 });
  mound(p, K, rnd, -1.05, T, 0.3, 0.4, 0.2, 0.4, K.dirt);
}

/* ══════════════════════════════════════════════════════ 線路脇の植生のはみ出し */
function buildVerge(g, rnd, seed, K) {
  const p = grp('trackside-verge');
  g.add(p);
  const LEN = 1.9;

  /* 土留め（古枕木＋杭＋針金） */
  const sl = grp('retain-board');
  p.add(sl);
  sl.add(mesh(rbox(LEN, 0.16, 0.09, 0.008, 2), K.timberOld, { pos: [0, 0.05, -0.34], name: 'retain-timber' }));
  for (let i = 0; i < 3; i++) {
    const x = -LEN / 2 + 0.24 + i * ((LEN - 0.48) / 2);
    const tilt = range(rnd, -3, 4);
    sl.add(mesh(box(0.075, 0.4, 0.075), K.timber, { pos: [x, 0.12, -0.42], rot: [range(rnd, -0.03, 0.03), 0, tilt * D2R], name: 'stake' }));
    sl.add(mesh(box(0.055, 0.014, 0.055), K.rust, { pos: [x, 0.32 - Math.abs(tilt) * 0.004, -0.42], cast: false }));
    sl.add(mesh(tubeOf([[x + 0.05, 0.24, -0.38], [x + 0.16, 0.2, -0.36]], 0.004, 8, 5), K.rust, { name: 'wire' }));
  }
  weather(sl, { w: LEN * 0.6, h: 0.1, pos: [0.1, 0.1, -0.285], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 471, density: 1.8, spread: 0.03 });
  weather(sl, { w: 0.4, h: 0.14, pos: [-0.6, 0.02, -0.29], kind: 'dirt', color: '#5f5642', opacity: 0.45, seed: seed + 472, density: 1.5, spread: 0.03 });

  /* 草（法面側）＋線路側へ倒れ込んだ 3 束 */
  const blade = new PlaneGeometry(0.03, 0.3);
  blade.translate(0, 0.15, 0);
  p.add(inst(blade, MAT.grass({ repeat: 1, base: PAL.grass }), 210, (i, d, r) => {
    const t = r();
    d.position.set((r() - 0.5) * (LEN + 0.4), 0, -0.36 + t * 0.9);
    d.rotation.set((r() - 0.5) * 0.24, r() * 3.1415, (r() - 0.5) * (0.5 + t * 0.5));
    const s = 0.55 + r() * 0.85;
    d.scale.set(s, s * (0.7 + r() * 0.7), 1);
  }, { name: 'grass-tufts', cast: false, receive: true }));
  const spill = new PlaneGeometry(0.034, 0.42);
  spill.translate(0, 0.21, 0);
  p.add(inst(spill, MAT.grass({ repeat: 1, base: shade(PAL.grassDark, 1.04) }), 78, (i, d, r) => {
    const cx = [-0.62, 0.05, 0.72][i % 3];
    d.position.set(cx + (r() - 0.5) * 0.34, 0.02, -0.16 + r() * 0.5);
    d.rotation.set(1.15 + r() * 0.5, r() * 3.14, (r() - 0.5) * 0.7);
    const s = 0.6 + r() * 0.7;
    d.scale.set(s, s, 1);
  }, { name: 'grass-spill', cast: false, receive: true }));

  /* タンポポ・綿毛・種穂・笹の葉 */
  for (let i = 0; i < 5; i++) {
    const x = range(rnd, -LEN / 2, LEN / 2), z = range(rnd, -0.34, 0.3), h = range(rnd, 0.16, 0.3);
    p.add(mesh(cyl(0.0035, 0.004, h, 5), MAT.leaf({ color: PAL.leafYoung }), { pos: [x, h / 2, z], rot: [range(rnd, -0.1, 0.1), 0, range(rnd, -0.12, 0.12)] }));
    p.add(mesh(sph(0.019, 8, 6), MAT.paint('#f2d358', { steps: 2, spec: 0.14 }), { pos: [x, h + 0.012, z], scale: [1, 0.72, 1], name: 'dandelion' }));
    if (i % 2 === 0) p.add(mesh(sph(0.016, 7, 5), MAT.paper({ color: '#f6f4ea' }), { pos: [x + 0.03, h + 0.03, z + 0.02], cast: false, name: 'fluff' }));
  }
  const leafTex = TEX.leafCluster({ base: PAL.leaf, seed: seed + 5 });
  const lm = MAT.leaf({ map: leafTex, alphaMap: leafTex, alphaTest: 0.34 });
  for (let i = 0; i < 9; i++) {
    p.add(mesh(plane(0.12, 0.16), lm, {
      pos: [range(rnd, -LEN / 2, LEN / 2), range(rnd, 0.04, 0.16), range(rnd, -0.36, 0.34)],
      rot: [range(rnd, -0.9, -0.2), range(rnd, 0, 6.28), range(rnd, -0.5, 0.5)], cast: false,
    }));
  }
  for (let i = 0; i < 6; i++) {
    const x = range(rnd, -LEN / 2, LEN / 2), z = range(rnd, -0.2, 0.36), h = range(rnd, 0.22, 0.4);
    p.add(mesh(cyl(0.003, 0.0035, h, 5), MAT.leaf({ color: '#8fa05c' }), { pos: [x, h / 2, z], rot: [range(rnd, -0.16, 0.16), 0, range(rnd, -0.2, 0.2)] }));
    p.add(mesh(sph(0.011, 6, 5), MAT.paper({ color: '#b9a86a' }), { pos: [x, h + 0.01, z], scale: [0.7, 1.7, 0.7], cast: false, name: 'seed-head' }));
  }
  /* 埋もれ砕石・絡んだ落ち葉・経年 */
  for (let i = 0; i < 5; i++) leaf(p, rnd, range(rnd, -LEN / 2, LEN / 2), 0.012, range(rnd, -0.1, 0.4), K, range(rnd, 0.75, 1.15));
  for (let i = 0; i < 18; i++) {
    p.add(mesh(rbox(range(rnd, 0.018, 0.045), 0.016, range(rnd, 0.018, 0.04), 0.007, 1), K.gravel, {
      pos: [range(rnd, -LEN / 2, LEN / 2), 0.006, range(rnd, 0.16, 0.5)], rot: [0, range(rnd, 0, 3.1), 0], cast: false,
    }));
  }
  weather(p, { w: 0.9, h: 0.34, pos: [0.2, 0.006, 0.3], rot: [-HALF_PI, 0, 0], kind: 'dirt', color: '#6f6653', opacity: 0.42, seed: seed + 481, density: 1.6, spread: 0.04 });
  weather(p, { w: 0.6, h: 0.3, pos: [-0.5, 0.006, 0.16], rot: [-HALF_PI, 0, 0], kind: 'moss', color: '#5f7a46', opacity: 0.45, seed: seed + 482, density: 1.8, spread: 0.03 });
  p.add(mesh(plane(0.07, 0.05), MAT.hardPlastic('#e8e4d6', { repeat: 4, opacity: 0.82, transparent: true }), { pos: [0.36, 0.14, 0.16], rot: [-0.7, 0.4, 0.3], cast: false, name: 'litter' }));
}

/* ═════════════════════════════════════════════════════════════════ build */
const KINDS = { switch: buildSwitch, duct: buildDuct, marker: buildMarker, stop: buildStop, drain: buildDrain, speed: buildSpeed, weed: buildWeed, verge: buildVerge };

function build(options = {}) {
  const seed = options.seed ?? 661;
  const rnd = rand(seed);
  const kind = options.kind ?? 'switch';
  const g = grp('rail-furniture-' + kind);
  const K = kit();
  const fn = KINDS[kind] || buildSwitch;
  fn(g, rnd, seed, K);
  return finish(g, { outline: 'thin', minSize: 0.05 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
