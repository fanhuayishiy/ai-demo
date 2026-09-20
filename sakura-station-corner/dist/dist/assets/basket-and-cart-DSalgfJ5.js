import { g as grp, M as MAT, m as mesh, c as cyl, b as box, h as decal, T as TEX, w as weather, n as range, p as shadowBlob, r as rbox, P as PAL, U as circ, a8 as CircleGeometry, q as finish, Y as memo, k as tubeOf, i as grill, t as tor, l as catenary, N as makeCanvas, z as rand, a5 as speckle, Q as toTexture, O as jpText } from './index-CNQWoZB0.js';
import { b as build$2 } from './bread-set-w4G5983p.js';
import { b as build$3 } from './tissue-pack-Ce3WA0J3.js';
import { b as build$1 } from './daily-goods-BcxKHdsy.js';

//  assets/interior/basket-and-cart.js —— カゴ・カート・店内傘立て・袋ラック・ティッシュ（入口まわり一式）
//  買い物カゴ（積み・1 個倒れた状態・取手の擦れ）・カートの山・レジ横／入口のカゴ置き場
//  店内傘立て（数本の傘・水受け）／パンの袋ラック（紙袋・bread-set が覗く）／ティッシュの箱
//  床の落ち葉と花びら 2〜3 枚・経年（擦れ・サビ・水ジミ・埃）
//  原点 = 床接触面の中心、+Y 上、顾客側 +Z。

const meta = {
  id: 'basket-and-cart',
  real: [1.96, 1.16, 1.58],
  origin: 'ground-center',
};
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** カゴのプラスチック表面：擦り傷・退色・型抜け方向 */
const basketTex = (seed, base) => memo(`bc:basket|${base}|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 7);
  const { g, w, h, rnd } = cv;
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  // 目地（格子の影）
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo((i * w) / 8, 0); g.lineTo((i * w) / 8, h); g.stroke(); }
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, (i * h) / 8); g.lineTo(w, (i * h) / 8); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.6;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo((i * w) / 8 + 2, 0); g.lineTo((i * w) / 8 + 2, h); g.stroke(); }
  speckle(g, w, h, { count: 5000, r: [0.4, 1.6], colors: ['#ffffff', '#000000', '#c9c2b2'], alpha: [0.03, 0.14], rnd });
  // 持ち手の擦れ（明るい筋）
  for (let i = 0; i < 14; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.3; g.strokeStyle = '#f6f3e8'; g.lineWidth = 1 + rnd() * 3;
    const y = rnd() * h; g.beginPath(); g.moveTo(rnd() * w * 0.4, y); g.lineTo(w * (0.5 + rnd() * 0.5), y + (rnd() - 0.5) * 8); g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 紙袋（kraft）：シワ・印刷・底の折目 */
const bagTex = (seed) => memo(`bc:bag|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 11);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#d9c19a'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, { count: 6000, r: [0.4, 2.2], colors: ['#efdcb6', '#b5966a', '#e6d0a8'], alpha: [0.04, 0.2], rnd });
  g.globalAlpha = 0.16; g.strokeStyle = '#8a6f45'; g.lineWidth = 1.4;
  for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(rnd() * w, 0); g.lineTo(rnd() * w, h); g.stroke(); }
  g.globalAlpha = 1;
  jpText(g, 'BREAD', { x: w / 2, y: h * 0.4, size: 34, color: 'rgba(88,64,36,0.9)', weight: 800, spacing: 6 });
  jpText(g, 'パンのおかい上げ', { x: w / 2, y: h * 0.54, size: 18, color: 'rgba(88,64,36,0.8)', weight: 700 });
  return toTexture(cv, { repeat: 1 });
});

/** 傘立ての水きり表示（ぬれ伞・注意） */
const standLabelTex = () => memo('bc:stand', () => {
  const cv = makeCanvas(256, 128);
  if (!cv) return null;
  const { g, w, h } = cv;
  g.fillStyle = '#f4efe0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4fa3d1'; g.fillRect(0, 0, w, 26);
  jpText(g, 'ぬれ伞はこちら', { x: w / 2, y: 13, size: 19, color: '#f4fbff', weight: 800, spacing: 2 });
  jpText(g, 'お取扱い注意', { x: w / 2, y: h * 0.62, size: 22, color: '#5d564a', weight: 700, spacing: 3 });
  g.globalAlpha = 0.3; g.fillStyle = '#8b8474';
  for (let i = 0; i < 40; i++) g.fillRect((i * 37) % w, h * (0.72 + ((i * 13) % 20) / 100), 3, 4);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ============================ 部品：買い物カゴ ============================ */
function basket(seed, tone = 0) {
  const BW = 0.30, BH = 0.175, BD = 0.215, T = 0.005;         // 実測：幅 300 高さ 175 奥 215
  const cols = ['#e0574c', '#3d7fb5', '#e6e1d2', '#5aa469'];
  const col = cols[tone % cols.length];
  const mat = MAT.plastic('#ffffff', { map: basketTex(seed, col), spec: 0.34, specPower: 44, worn: 0.5, shadowAmt: 0.7 });
  const b = grp(`basket:${col}`);
  // 底（厚みあり・四隅面取り）
  b.add(mesh(rbox(BW - 0.03, T, BD - 0.03, 0.008, 2), mat, { pos: [0, T / 2, 0], name: 'basket-bottom' }));
  // 側壁 4 枚（外へ開く台形＝上下で幅が違う実形）
  const inx = (BW - 0.03) / 2, inz = (BD - 0.03) / 2;
  const wall = (len, x, z, ry, tilt) => {
    const w2 = grp('wall', { pos: [x, BH / 2, z], rot: [0, ry, 0] });
    w2.add(mesh(box(len, BH, T), mat, { pos: [0, 0, 0] }));
    w2.children[0].rotation.x = tilt;
    return w2;
  };
  b.add(wall(BW, 0, inz + T / 2, 0, 0.1));
  b.add(wall(BW, 0, -inz - T / 2, 0, -0.1));
  b.add(wall(BD, inx + T / 2, 0, Math.PI / 2, 0.1));
  b.add(wall(BD, -inx - T / 2, 0, Math.PI / 2, -0.1));
  // 縁（4 本の丸バー）＋角のリベット
  const rimMat = MAT.plastic('#ffffff', { map: basketTex(seed + 3, col), spec: 0.4, worn: 0.45 });
  for (const [len, x, z, along] of [[BW + 0.03, 0, inz + T, 'x'], [BW + 0.03, 0, -inz - T, 'x'], [BD + 0.03, inx + T, 0, 'z'], [BD + 0.03, -inx - T, 0, 'z']]) {
    b.add(noHull(mesh(cyl(0.006, 0.006, len, 8), rimMat, { pos: [x, BH + 0.002, z], rot: along === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], cast: false })));
  }
  // 折りたたみハンドル（針金 2 本・擦れた皮膜）
  const hdl = grp('handle');
  for (const s2 of [-1, 1]) {
    hdl.add(noHull(mesh(tubeOf([[s2 * (inx - 0.01), BH - 0.01, inz * 0.86], [s2 * (inx + 0.01), BH + 0.09, 0], [s2 * (inx - 0.01), BH - 0.01, -inz * 0.86]], 0.0038, 14, 6), MAT.metal('#a9aeaf', { worn: 0.85, spec: 0.55 }), {})));
  }
  hdl.add(noHull(mesh(cyl(0.008, 0.008, 0.11, 10), MAT.rubber('#8d5f4a', { spec: 0.1 }), { pos: [0, BH + 0.088, 0], rot: [0, 0, Math.PI / 2] })));
  b.add(hdl);
  // 経年：底の擦れ・側面の凹み・縁の退色
  weather(b, { w: BW * 0.7, h: BD * 0.5, pos: [0, T + 0.001, 0], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#f2efe4', opacity: 0.34, seed: seed + 5, spread: 0.004 });
  weather(b, { w: 0.08, h: 0.06, pos: [inx + T + 0.003, BH * 0.5, 0.02], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#7a7365', opacity: 0.3, seed: seed + 6, spread: 0.01 });
  b.userData.real = [BW + 0.04, BH + 0.1, BD + 0.04];
  return b;
}

/* ============================ 部品：パネルカート ============================ */
function panelCart(seed) {
  const c = grp('panel-cart');
  const bedMat = MAT.metal('#b7bcbe', { worn: 0.85, spec: 0.5 });
  const pipeMat = MAT.metal('#aeb3b5', { worn: 0.8, spec: 0.5 });
  // 荷台（アルミ押出・溝）
  c.add(mesh(rbox(0.34, 0.018, 0.46, 0.005, 2), bedMat, { pos: [0, 0.11, 0], name: 'cart-bed' }));
  for (let i = 0; i < 4; i++) c.add(noHull(mesh(box(0.3, 0.004, 0.012), MAT.metal('#9aa0a2', { worn: 0.8 }), { pos: [0, 0.12, -0.17 + i * 0.11], cast: false })));
  // 折りたたみ背面板（メッシュ）＋蝶番
  const back = grp('cart-back', { pos: [0, 0.12, -0.23], rot: [-0.14, 0, 0] });
  back.add(mesh(box(0.34, 0.42, 0.012), bedMat, { pos: [0, 0.21, 0] }));
  grill(back, { w: 0.28, h: 0.34, nx: 5, ny: 5, bar: 0.006, mat: MAT.metal('#9aa0a2', { worn: 0.85 }), pos: [0, 0.21, 0.01] });
  for (const sx of [-1, 1]) back.add(noHull(mesh(cyl(0.007, 0.007, 0.024, 8), MAT.metal('#7d8285', { worn: 0.7 }), { pos: [sx * 0.14, 0.004, 0], rot: [Math.PI / 2, 0, 0], cast: false })));
  c.add(back);
  // ハンドル（T 字バー・グリップ）
  c.add(noHull(mesh(tubeOf([[-0.16, 0.11, -0.22], [-0.16, 0.72, -0.3], [0, 0.78, -0.31], [0.16, 0.72, -0.3], [0.16, 0.11, -0.22]], 0.011, 20, 7), pipeMat, {})));
  c.add(noHull(mesh(cyl(0.016, 0.016, 0.2, 10), MAT.rubber('#3f4449', { spec: 0.08 }), { pos: [0, 0.78, -0.31], rot: [0, 0, Math.PI / 2] })));
  // 車輪 4（ゴムのタイヤ・金具・軸）
  for (const [wx, wz] of [[-0.14, 0.17], [0.14, 0.17], [-0.14, -0.17], [0.14, -0.17]]) {
    const wh = grp('cart-wheel', { pos: [wx, 0.04, wz] });
    wh.add(mesh(box(0.03, 0.05, 0.03), pipeMat, { pos: [0, 0.03, 0] }));
    wh.add(mesh(cyl(0.04, 0.04, 0.02, 14), MAT.rubber('#2f3236', { spec: 0.08 }), { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] }));
    wh.add(noHull(mesh(cyl(0.014, 0.014, 0.024, 10), MAT.metal('#c9cdce', { worn: 0.6, spec: 0.6 }), { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], cast: false })));
    c.add(wh);
  }
  // 傷・サビ・衝突跡
  weather(c, { w: 0.3, h: 0.06, pos: [0, 0.122, 0.1], rot: [-Math.PI / 2, 0, 0.2], kind: 'scratch', color: '#dedcd6', opacity: 0.4, seed: seed + 13, spread: 0.004 });
  weather(c, { w: 0.16, h: 0.08, pos: [0.1, 0.06, -0.24], kind: 'rust', color: '#8a5236', opacity: 0.36, seed: seed + 14, spread: 0.02 });
  decal(c, { map: TEX.wear({ kind: 'chip', color: '#7a6f5c', seed: seed + 15, density: 1.3 }), w: 0.14, h: 0.1, pos: [-0.17, 0.2, -0.226], rot: [0, -Math.PI / 2, 0], opacity: 0.44 });
  return c;
}

/* ============================ 部品：傘 ============================ */
function umbrella(i, seed) {
  const kinds = ['vinyl', 'long-green', 'long-navy', 'folding'];
  const k = kinds[i % kinds.length];
  const u = grp(`umbrella:${k}`);
  const shaftCol = k === 'vinyl' ? '#dfe6e4' : k === 'long-green' ? '#2f6b52' : '#2c3f5c';
  const canopyCol = k === 'vinyl' ? '#e9f2f2' : k === 'long-green' ? PAL.awningGreen : '#3a5578';
  const shaftMat = MAT.metal(shaftCol, { worn: 0.6, spec: 0.55 });
  const fabMat = k === 'vinyl'
    ? MAT.glassLite({ color: '#e8f2f2', opacity: 0.3 })
    : MAT.fabric({ color: canopyCol, repeat: 10, worn: 0.6 });
  const L = k === 'folding' ? 0.3 : 0.82;
  // 親骨
  u.add(mesh(cyl(0.0075, 0.0085, L, 10), shaftMat, { pos: [0, L / 2, 0], name: 'shaft' }));
  // 折りたたまれた生地の束（円錐状のひだ・中まで見えるように数本）
  const bundle = grp('canopy-fold');
  const segs = k === 'vinyl' ? 7 : 6;
  for (let r = 0; r < segs; r++) {
    const a = (r / segs) * 6.284;
    const rr2 = 0.028 + (r % 2) * 0.006;
    bundle.add(noHull(mesh(tubeOf([
      [Math.cos(a) * 0.01, L * 0.86, Math.sin(a) * 0.01],
      [Math.cos(a) * rr2, L * 0.5, Math.sin(a) * rr2],
      [Math.cos(a) * 0.012, L * 0.2, Math.sin(a) * 0.012],
    ], 0.0055, 10, 5), fabMat, {})));
  }
  bundle.add(noHull(mesh(cyl(0.033, 0.014, L * 0.62, 12, true), fabMat, { pos: [0, L * 0.52, 0], cast: false })));
  u.add(bundle);
  // 滑り（トップ）・バンド・持ち手
  u.add(noHull(mesh(cyl(0.009, 0.006, 0.05, 10), shaftMat, { pos: [0, L + 0.02, 0], cast: false })));
  u.add(noHull(mesh(tor(0.03, 0.0035, 5, 14), MAT.plastic('#3f4449', { spec: 0.3 }), { pos: [0, L * 0.3, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));
  if (k === 'vinyl') {
    u.add(noHull(mesh(tubeOf(catenary([-0.026, 0.04, 0], [0.026, 0.04, 0], -0.06, 10), 0.006, 12, 6), MAT.plastic('#e2574c', { spec: 0.34, worn: 0.5 }), {})));
  } else {
    u.add(mesh(cyl(0.011, 0.012, 0.1, 10), MAT.plastic('#4a3f33', { spec: 0.28, worn: 0.6 }), { pos: [0, 0.05, 0] }));
  }
  weather(u, { w: 0.05, h: 0.14, pos: [0.03, L * 0.4, 0.02], kind: 'dirt', color: '#7a7365', opacity: 0.3, seed: seed + i * 5, spread: 0.02 });
  return u;
}

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 757;
  const rnd = rand(seed);
  const g = grp('basket-and-cart');

  const alu = MAT.metal('#c4c8c9', { worn: 0.6, repeat: 2, spec: 0.55 });
  const aluDk = MAT.metal('#989da0', { worn: 0.8, spec: 0.45 });
  MAT.stainless({ worn: 0.65 });
  const rubberMat = MAT.rubber('#3d4146');
  const kraft = MAT.paint('#ffffff', { map: bagTex(seed), spec: 0.08, sheen: 0.02, shadowAmt: 0.84, steps: 2 });

  /* ---------- 1. カゴ置き場（アルミパイプスタンド） ---------- */
  const stand = grp('basket-stand', { pos: [-0.34, 0, -0.02] });
  g.add(stand);
  const SW = 0.66, SH = 0.86, SD = 0.34;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      stand.add(mesh(cyl(0.014, 0.014, SH, 12), alu, { pos: [sx * SW / 2, SH / 2, sz * SD / 2] }));
      stand.add(noHull(mesh(cyl(0.018, 0.02, 0.014, 10), rubberMat, { pos: [sx * SW / 2, 0.007, sz * SD / 2], cast: false })));
    }
    stand.add(noHull(mesh(cyl(0.011, 0.011, SD, 10), aluDk, { pos: [sx * SW / 2, 0.14, 0], rot: [Math.PI / 2, 0, 0] })));
    stand.add(noHull(mesh(cyl(0.011, 0.011, SW, 10), aluDk, { pos: [0, SH - 0.02, sx * SD / 2], rot: [0, 0, Math.PI / 2] })));
  }
  stand.add(mesh(box(SW, 0.016, SD), aluDk, { pos: [0, 0.13, 0] }));                     // 下棚
  stand.add(mesh(box(SW - 0.03, 0.012, SD - 0.03), alu, { pos: [0, 0.849, 0] }));         // 天_plate（小物置き）
  stand.add(mesh(box(SW + 0.03, 0.02, 0.02), alu, { pos: [0, SH, -SD / 2 + 0.01] }));     // 上縁
  decal(stand, { map: TEX.signboard({ text: 'カゴはここ', bg: '#4fa3d1', fg: '#f2f8fd', size: 96 }), w: 0.3, h: 0.08, pos: [0, SH - 0.11, -SD / 2 - 0.006], opacity: 0.95 });
  // 脚のサビ・床擦れ
  weather(stand, { w: 0.2, h: 0.1, pos: [SW / 2 - 0.02, 0.1, SD / 2], kind: 'rust', color: '#8a5236', opacity: 0.36, seed: seed + 3, spread: 0.03 });
  weather(stand, { w: SW * 0.8, h: 0.04, pos: [0, 0.004, SD / 2 + 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#8b8578', opacity: 0.3, seed: seed + 4, spread: 0.004 });
  // スタンドに載るカゴ（積み・傾き）
  for (let i = 0; i < 3; i++) {
    const bk = basket(seed + 31 + i * 13, i);
    bk.position.set(range(rnd, -0.012, 0.012), 0.14 + i * 0.052, range(rnd, -0.01, 0.01));
    bk.rotation.set(range(rnd, -0.02, 0.02), range(rnd, -0.25, 0.25), range(rnd, -0.02, 0.02));
    stand.add(bk);
  }
  // 天板に伏せて載せた予備カゴ（口を下にした定番の積み方）
  {
    const bk = basket(seed + 51, 2);
    bk.position.set(-0.13, 1.126, 0);
    bk.rotation.set(Math.PI, range(rnd, -0.18, 0.18), 0);
    stand.add(bk);
  }

  /* ---------- 2. カゴの山（床置き・最上段は引っかかり気味） ---------- */
  const pile = grp('basket-pile', { pos: [0.16, 0, 0.18], rot: [0, 0.42, 0] });
  g.add(pile);
  for (let i = 0; i < 4; i++) {
    const bk = basket(seed + 71 + i * 17, i + 1);
    bk.position.set(range(rnd, -8e-3, 0.008), i * 0.049, range(rnd, -8e-3, 0.008));
    bk.rotation.y = range(rnd, -0.4, 0.4);
    if (i === 3) bk.rotation.set(-0.08, 0.5, 0.1);       // 引っかかって傾く
    pile.add(bk);
  }
  shadowBlob(pile, { r: 0.22, pos: [0, 0, 0], opacity: 0.22 });

  /* ---------- 3. 倒れたカゴ 1 個（取手の擦れ・中が見える） ---------- */
  const fallen = basket(seed + 97, 0);
  fallen.position.set(-0.02, 0.178, 0.46);
  fallen.rotation.set(0.05, 0.7, Math.PI / 2 - 0.12);
  g.add(fallen);
  // 倒れた拍子に散った物（レシート・ガムの包み）
  g.add(noHull(mesh(box(0.06, 0.0012, 0.04), MAT.paper({ color: '#f6f2e4' }), { pos: [0.1, 0.001, 0.56], rot: [0, 0.6, 0], cast: false })));
  g.add(noHull(mesh(box(0.03, 0.006, 0.02), MAT.plastic('#e8b24a', { spec: 0.34 }), { pos: [-0.08, 0.004, 0.6], rot: [0, 1.1, 0], cast: false })));
  shadowBlob(g, { r: 0.2, pos: [-0.02, 0.0004, 0.48], opacity: 0.2 });

  /* ---------- 4. カートの山（2 台入れ子・1 台は自立） ---------- */
  const carts = grp('cart-stack', { pos: [0.44, 0, -0.16], rot: [0, -0.24, 0] });
  g.add(carts);
  const c1 = panelCart(seed + 5);
  carts.add(c1);
  const c2 = panelCart(seed + 105);
  c2.position.set(0.006, 0.006, -0.17);
  c2.rotation.y = 0.05;
  c2.scale.setScalar(0.985);                                  // 入れ子用の微小な寸法差
  carts.add(c2);
  const c3 = panelCart(seed + 111);
  c3.position.set(0.012, 0.012, -0.34);
  c3.rotation.y = -0.06;
  carts.add(c3);
  shadowBlob(carts, { r: 0.3, pos: [0, 0, -0.18], opacity: 0.24 });
  // カートの荷台に乗り忘れたカゴ（最上段の台）
  const left = basket(seed + 121, 3);
  left.position.set(0.012, 0.132, -0.34);
  left.rotation.set(0, 0.8, 0);
  carts.add(left);

  /* ---------- 5. 店内傘立て（両面スリット・水受け・傘 5 本） ---------- */
  const us = grp('umbrella-stand', { pos: [-0.74, 0, 0.28], rot: [0, 0.16, 0] });
  g.add(us);
  const UW = 0.52, UD = 0.26, UH = 0.34;
  us.add(mesh(rbox(UW, 0.02, UD, 0.006, 2), aluDk, { pos: [0, 0.01, 0] }));                                  // トレイ枠
  us.add(mesh(box(UW - 0.02, 0.008, UD - 0.02), MAT.plastic('#8f9b98', { worn: 0.7, transparent: true, opacity: 0.6 }), { pos: [0, 0.018, 0], cast: false, receive: true }));
  for (const sz of [-1, 1]) {
    const side = grp('u-side', { pos: [0, UH / 2 + 0.02, sz * (UD / 2 - 0.006)] });
    side.add(mesh(box(UW, UH, 0.012), MAT.plastic('#5d6f6a', { worn: 0.75, spec: 0.3 }), {}));
    //  insert 穴（2 列・縁を立ち上げる）
    for (let i = 0; i < 4; i++) {
      side.add(noHull(mesh(rbox(0.085, 0.03, 0.018, 0.006, 2), MAT.plastic('#4a5a56', { spec: 0.28 }), { pos: [-0.18 + i * 0.12, UH * 0.42, 0], cast: false })));
      side.add(noHull(mesh(box(0.08, 0.006, 0.014), aluDk, { pos: [-0.18 + i * 0.12, UH * 0.42 + 0.02, 0], cast: false })));
    }
    side.add(mesh(box(UW, 0.016, 0.02), alu, { pos: [0, UH + 0.012, 0] }));
    us.add(side);
  }
  for (const sx of [-1, 1]) us.add(mesh(box(0.012, UH, UD), MAT.plastic('#5d6f6a', { worn: 0.7, spec: 0.3 }), { pos: [sx * (UW / 2 - 0.006), UH / 2 + 0.02, 0] }));
  decal(us, { map: standLabelTex(), w: 0.28, h: 0.14, pos: [0, UH * 0.6, UD / 2 + 0.002], opacity: 0.95 });
  // 中の水（受け）・濡れ跡
  us.add(noHull(mesh(box(UW - 0.05, 0.004, UD - 0.05), MAT.water({ color: '#9fb8bc', opacity: 0.5, scroll: [0.002, 0.003] }), { pos: [0, 0.023, 0], cast: false, receive: false })));
  weather(us, { w: UW * 0.7, h: UD * 0.7, pos: [0.04, 0.026, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6a5c', opacity: 0.34, seed: seed + 131, spread: 0.004 });
  // 傘 5 本（立てかけ・傾き）
  for (let i = 0; i < 5; i++) {
    const u = umbrella(i, seed + 141 + i * 7);
    const px = -0.17 + i * 0.085;
    u.position.set(px, 0.03, (i % 2 ? 0.05 : -0.05));
    u.rotation.set(range(rnd, -0.1, 0.1), 0, range(rnd, 0.08, 0.2) * (i % 2 ? 1 : -1));
    us.add(u);
  }
  // 折り畳み傘（袋入り＝商品）＋傘袋の dispens 箱
  const folded = build$1({ seed: seed + 161, variant: 'umbrella' });
  folded.position.set(0.2, 0.03, -0.02);
  folded.rotation.set(0, 0.6, 0.06);
  folded.scale.setScalar(1.25);
  us.add(folded);
  shadowBlob(us, { r: 0.3, pos: [0, 0.001, 0], opacity: 0.2 });

  /* ---------- 6. パンの袋ラック（紙袋・中身が覗く） ---------- */
  const rack = grp('bag-rack', { pos: [0.06, 0, -0.3], rot: [0, -0.12, 0] });
  g.add(rack);
  const RW = 0.46, RH = 1.06, RD = 0.2;
  for (const sx of [-1, 1]) {
    rack.add(mesh(box(0.018, RH, RD), alu, { pos: [sx * RW / 2, RH / 2, 0] }));
    rack.add(noHull(mesh(cyl(0.016, 0.018, 0.012, 10), rubberMat, { pos: [sx * RW / 2, 0.006, 0], cast: false })));
  }
  rack.add(mesh(box(RW, 0.014, RD), aluDk, { pos: [0, 0.02, 0] }));
  rack.add(mesh(box(RW, 0.014, RD), aluDk, { pos: [0, RH - 0.02, 0] }));
  for (let i = 0; i < 5; i++) {                                                          // ワイヤー棚（斜め）
    rack.add(noHull(mesh(cyl(0.004, 0.004, RW - 0.03, 8), aluDk, { pos: [0, 0.14 + i * 0.185, RD / 2 - 0.03], rot: [0, 0, Math.PI / 2], cast: false })));
  }
  rack.add(mesh(box(RW - 0.04, 0.006, RD - 0.06), MAT.plastic('#c9c3b2', { spec: 0.2 }), { pos: [0, 0.13, -0.01], cast: false, receive: true }));
  // 紙袋（立ち・1 枚だけ倒れ気味・中からパン）
  for (let i = 0; i < 6; i++) {
    const bag = grp('paper-bag', { pos: [-0.16 + i * 0.062, 0.136, 0.02], rot: [range(rnd, -0.05, 0.05), range(rnd, -0.2, 0.2), range(rnd, -0.04, 0.04)] });
    bag.add(mesh(box(0.055, 0.24, 0.035), kraft, { pos: [0, 0.12, 0] }));
    bag.add(noHull(mesh(box(0.055, 0.004, 0.035), MAT.paint('#c9ae80', { spec: 0.08, map: bagTex(seed + 2) }), { pos: [0, 0.242, 0], cast: false })));   // 口の折り返し
    bag.add(noHull(mesh(box(0.05, 0.006, 0.03), MAT.paint('#4a3f33', { spec: 0.1 }), { pos: [0, 0.246, 0], cast: false })));                               // 袋内部（暗い）
    if (i === 2) {
      const br = build$2({ seed: seed + 171 + i, variant: 'melonpan' });
      br.position.set(0.004, 0.248, 0.004);
      br.rotation.set(0, 0.5, 0);
      br.scale.setScalar(0.8);
      bag.add(br);
    }
    rack.add(bag);
  }
  rack.add(noHull(mesh(box(0.055, 0.2, 0.035), kraft, { pos: [0.19, 0.24, 0.06], rot: [0.3, 0.4, -0.5] })));   // 斜めに落ちかけた 1 枚
  decal(rack, { map: TEX.signboard({ text: 'パンの袋', bg: '#f2b23c', fg: '#4a3a12', size: 110 }), w: 0.26, h: 0.07, pos: [0, RH - 0.09, RD / 2 + 0.004], opacity: 0.95 });
  weather(rack, { w: 0.2, h: 0.14, pos: [-0.1, 0.5, RD / 2 + 0.004], kind: 'dirt', color: '#8b8474', opacity: 0.26, seed: seed + 151, spread: 0.02 });

  /* ---------- 7. ティッシュの箱（上置き・1 箱は開いて箱ティッシュが出る） ---------- */
  const tbox = grp('tissue', { pos: [-0.16, 0.892, -0.06], rot: [0, 0.28, 0] });
  g.add(tbox);
  tbox.add(mesh(rbox(0.24, 0.07, 0.12, 0.006, 2), MAT.paper({ color: '#e8eef4' }), {}));
  decal(tbox, { map: TEX.adStrip({ text: '春・花粉シーズン', bg: '#e8f0f6', seed: seed + 9 }), w: 0.22, h: 0.05, pos: [0, 0.012, 0.061], opacity: 0.95 });
  tbox.add(noHull(mesh(box(0.11, 0.004, 0.05), MAT.paint('#b7c6d2', { spec: 0.2 }), { pos: [0, 0.036, 0], cast: false })));      // 摘み口
  tbox.add(noHull(mesh(rbox(0.09, 0.02, 0.05, 0.008, 2), MAT.paper({ color: '#fbfaf4' }), { pos: [0.01, 0.05, 0], rot: [0.2, 0.1, -0.2] })));   // 引き出したティッシュ
  for (let i = 0; i < 2; i++) {
    const tp = build$3({ seed: seed + 181 + i * 9, variant: i ? 'wet' : 'tissue' });
    tp.position.set(-0.02 + i * 0.11, 0.036 + i * 0.05, -0.02);
    tp.rotation.set(0, range(rnd, -0.2, 0.2), 0);
    tbox.add(tp);
  }
  weather(tbox, { w: 0.14, h: 0.05, pos: [0.04, 0.037, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#9a927e', opacity: 0.26, seed: seed + 161, spread: 0.004 });
  g.add(tbox);

  /* ---------- 8. 床の落ち葉・花びら（入口から流れ込んだ春） ---------- */
  const petalMat = MAT.petal({ tone: 1, map: TEX.petal({ tone: 1, mode: 'single' }), wind: { amp: 0.006, freq: 0.9, base: 0, span: 0.5 } });
  const leafMat = MAT.leaf({ color: PAL.leafYoung, map: TEX.leafCluster({ base: PAL.leafYoung, seed: seed + 3 }) });
  for (let i = 0; i < 3; i++) {
    const p = noHull(mesh(circ(0.011 + i * 0.002, 10), petalMat, {
      pos: [range(rnd, -0.5, 0.4), 0.0025 + i * 0.0006, range(rnd, 0.2, 0.66)],
      rot: [-Math.PI / 2 + range(rnd, -0.2, 0.2), 0, range(rnd, 0, 3)], cast: false, receive: false,
    }));
    p.name = `petal-${i}`;
    g.add(p);
  }
  for (let i = 0; i < 2; i++) {
    const l = noHull(mesh(new CircleGeometry(0.018 + i * 0.004, 9), leafMat, {
      pos: [range(rnd, -0.24, 0.52), 0.0026, range(rnd, 0.3, 0.62)],
      rot: [-Math.PI / 2 + range(rnd, -0.25, 0.25), 0, range(rnd, 0, 3)], scale: [1, 0.6, 1], cast: false, receive: false,
    }));
    l.name = `leaf-${i}`;
    g.add(l);
  }
  // 入口側の水滴（傘から垂れた）と埃
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#6b6459', seed: seed + 171, density: 1.4 }), w: 0.7, h: 0.5, pos: [-0.62, 0.0018, 0.4], rot: [-Math.PI / 2, 0, 0.2], opacity: 0.28, order: 1 });
  for (let i = 0; i < 5; i++) {
    g.add(noHull(mesh(cyl(0.006 + rnd() * 0.006, 0.007, 0.0012, 10), MAT.water({ color: '#cfe0e2', opacity: 0.55, spec: 0.9 }), {
      pos: [-0.7 + range(rnd, 0, 0.24), 0.0016, 0.3 + range(rnd, 0, 0.34)], cast: false, receive: false,
    })));
  }
  weather(g, { w: 0.4, h: 0.3, pos: [0.4, 0.0016, 0.28], rot: [-Math.PI / 2, 0, 0.5], kind: 'dirt', color: '#8b8578', opacity: 0.22, seed: seed + 173, spread: 0.003 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
