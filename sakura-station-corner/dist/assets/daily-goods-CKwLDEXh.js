import { z as rand, g as grp, ac as Box3, af as BoxGeometry, V as Vector3, m as mesh, M as MAT, b as box, c as cyl, U as circ, h as decal, T as TEX, a as sph, w as weather, r as rbox, n as range, D as DoubleSide, H as plane, ag as CylinderGeometry, k as tubeOf, t as tor, s as shade, o as lathe, y as TorusGeometry, J as shape, ab as Path, K as extrude, ah as ConeGeometry, Y as memo, N as makeCanvas, Q as toTexture, a6 as rr } from './index-B1SzF3Mh.js';

//  assets/products/daily-goods.js —— 日用・文房・生活雑貨（フック掛けパック）7 variant
//  battery 電池パック（＋−表示）/ umbrella 折り畳み傘（袋入り）/ towel タオル（畳みヒダ）
//  pen ペン（フック掛け・2 本）/ notebook ノート / razor 剃刀（替刃 3 個）/ wiper 除菌クロス
//  構成：ハングヘッド（打ち抜き穴）・ブリスター（透明泡）・台紙印刷・帯・値引きシール跡
//  options: { seed, scale, variant, tint }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'daily-goods',
  real: [0.06, 0.16, 0.03],
  origin: 'bottom-center',
  variants: ['battery', 'umbrella', 'towel', 'pen', 'notebook', 'razor', 'wiper'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
/** パック実寸（mm 相当）→ envelope 60×160×30 に収める */
const SPEC = {
  battery: { w: 0.058, h: 0.157, t: 0.026 },
  umbrella: { w: 0.056, h: 0.156, t: 0.028 },
  towel: { w: 0.058, h: 0.150, t: 0.027 },
  pen: { w: 0.052, h: 0.158, t: 0.021 },
  notebook: { w: 0.056, h: 0.152, t: 0.024 },
  razor: { w: 0.058, h: 0.156, t: 0.025 },
  wiper: { w: 0.058, h: 0.157, t: 0.022 },
};

/* -------------------------------- 局所テクチャ -------------------------------- */
/** 台紙（ハングヘッド＋商品名＋规格＋バーコード） */
const cardTex = (v) => memo(`dg:card:${v}`, () => {
  const S = SPEC[v];
  const cv = makeCanvas(256, Math.round(256 * (S.h / S.w)));
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const skin = {
    battery: { bg: '#f3e6c8', ink: '#2b2b30', a: '#e0812c', b: '#2f3b52' },
    umbrella: { bg: '#e4edf3', ink: '#2b3a4a', a: '#3d76b4', b: '#4b5a68' },
    towel: { bg: '#f3e7ee', ink: '#4a3340', a: '#db6f8e', b: '#7c5b68' },
    pen: { bg: '#eef1e6', ink: '#2f3b2c', a: '#4f9a72', b: '#37503a' },
    notebook: { bg: '#f6f0e2', ink: '#3a3226', a: '#c9a227', b: '#5b4a2c' },
    razor: { bg: '#e8eef2', ink: '#26343c', a: '#4a8fb0', b: '#2f4854' },
    wiper: { bg: '#e6f2e8', ink: '#2b4030', a: '#5aa870', b: '#31543c' },
  }[v];
  fill(g, w, h, skin.bg);
  // ヘッド部（商品名_band）
  g.fillStyle = skin.a; g.fillRect(0, h * 0.055, w, h * 0.19);
  g.fillStyle = '#fff'; g.font = '800 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const T = { battery: 'アルカリ 4 本', umbrella: '折りたたみ傘', towel: 'タオル', pen: 'ボールペン 2', notebook: 'メモ帳 B7', razor: 'カミソリ 3', wiper: '除菌クロス' }[v];
  g.fillText(T, w / 2, h * 0.13);
  g.font = '700 15px sans-serif'; g.globalAlpha = 0.9;
  g.fillText({ battery: '単 3形 · LR6 · 10 年保存', umbrella: 'UV 加工 · 親骨 8 本', towel: 'パイル 100% · 34×80', pen: '0.7mm · 黒 2 本入', notebook: '方眼 80 枚 · 無酸紙', razor: '5 枚刃 · 替刃 3 個', wiper: '77% 配合 · 10 枚' }[v], w / 2, h * 0.215);
  g.globalAlpha = 1;
  // 中央の窓（ブリスターの下地＝明るい面）
  g.fillStyle = shade(skin.bg, 1.06);
  rr(g, w * 0.09, h * 0.29, w * 0.82, h * 0.5, 10); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; rr(g, w * 0.09, h * 0.29, w * 0.82, h * 0.5, 10); g.stroke();
  // 規格 bullet
  g.fillStyle = skin.b; g.font = '700 16px sans-serif'; g.textAlign = 'left';
  for (let i = 0; i < 3; i++) {
    const y = h * (0.815 + i * 0.032);
    g.globalAlpha = 0.8; g.fillRect(w * 0.11, y - 4, 6, 6);
    g.fillText(['・日本製','・通年品','・まとめ買い用'][i], w * 0.16, y);
  }
  g.globalAlpha = 1;
  // バーコード
  g.fillStyle = '#fff'; g.fillRect(w * 0.55, h * 0.83, w * 0.36, h * 0.1);
  g.fillStyle = '#151515';
  for (let i = 0; i < 26; i++) g.fillRect(w * 0.565 + i * (w * 0.33 / 26), h * 0.845, rnd() > 0.5 ? 3 : 1.3, h * 0.062);
  // 色褪せ・ヨゴレ・折じわ
  g.globalAlpha = 0.14; g.fillStyle = '#fff';
  for (let i = 0; i < 22; i++) g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 70, 2 + rnd() * 7);
  g.globalAlpha = 0.1; g.fillStyle = skin.ink;
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 8 + rnd() * 28, 4 + rnd() * 12, rnd() * 3, 0, 6.284); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});
function fill(g, w, h, c) { g.fillStyle = c; g.fillRect(0, 0, w, h); }

/** 電池のラッパ巻き印刷（＋／−・1.5V） */
const cellTex = (v) => memo(`dg:cell:${v}`, () => {
  const cv = makeCanvas(256, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fill(g, w, h, '#e0812c');
  g.fillStyle = '#2f3b52'; g.fillRect(0, h * 0.30, w, h * 0.4);
  g.fillStyle = '#f6f2e6'; g.font = '800 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const x of [w * 0.25, w * 0.75]) {
    g.fillText('1.5V', x, h * 0.42);
    g.font = '700 22px sans-serif'; g.fillText('単3形 ALKALINE', x, h * 0.6); g.font = '800 44px sans-serif';
  }
  // ＋極マーク（周回に 2 つ）
  g.fillStyle = '#f6f2e6';
  for (const x of [w * 0.25, w * 0.75]) {
    g.fillRect(x - 16, h * 0.14, 32, 6); g.fillRect(x - 4, h * 0.06, 8, 22);
  }
  // −極側は下に帯
  g.fillStyle = 'rgba(20,20,24,0.5)'; g.fillRect(0, h * 0.9, w, h * 0.1);
  for (let i = 0; i < 200; i++) { g.globalAlpha = 0.05 + rnd() * 0.12; g.fillStyle = rnd() > 0.5 ? '#fff' : '#000'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** タオル地（パイル） */
const terryTex = (base) => memo(`dg:terry:${base}`, () => {
  const cv = makeCanvas(128, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fill(g, w, h, base);
  for (let i = 0; i < 3200; i++) {
    g.globalAlpha = 0.06 + rnd() * 0.18;
    g.strokeStyle = rnd() > 0.5 ? shade(base, 1.24) : shade(base, 0.74);
    g.lineWidth = 1 + rnd() * 2;
    const x = rnd() * w, y = rnd() * h, a = -1.57 + (rnd() - 0.5) * 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6); g.stroke();
  }
  // 刺しゅう帯
  g.globalAlpha = 0.85; g.fillStyle = shade(base, 0.62);
  g.fillRect(0, h * 0.08, w, 5); g.fillRect(0, h * 0.16, w, 3);
  g.fillRect(0, h * 0.84, w, 5); g.fillRect(0, h * 0.92, w, 3);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 4 });
});

/** 袋（PVC）の印刷＋しわ */
const bagTex = (ink) => memo(`dg:bag:${ink}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.globalAlpha = 0.2; g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 1;
  // シワ（明るい線）
  for (let i = 0; i < 46; i++) {
    g.globalAlpha = 0.12 + rnd() * 0.3;
    g.strokeStyle = '#ffffff'; g.lineWidth = 1 + rnd() * 4;
    const x = rnd() * w, y = rnd() * h, a = rnd() * 3.14, l = 30 + rnd() * 130;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 26, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
function mats(o) {
  const t = { tint: o.tint };
  return {
    card: (v) => MAT.poster({
      map: cardTex(v), color: '#ffffff', steps: 2, spec: 0.1, shadowAmt: 0.75, side: DoubleSide,
      uv: { repeat: [1 / SPEC[v].w, 1 / SPEC[v].h], offset: [0.5, 0.5] }, ...t,
    }),
    cardBack: MAT.paper({ color: '#e8e0cc', spec: 0.06, shadowAmt: 0.85, ...t }),
    blister: MAT.glassLite({ color: '#eef6f8', opacity: 0.22, spec: 1, specPower: 230, side: DoubleSide, depthWrite: false }),
    bag: MAT.glassLite({ color: '#e9f1f2', opacity: 0.3, map: bagTex('#fff'), side: DoubleSide, depthWrite: false }),
    plastic: (c) => MAT.hardPlastic(c, { repeat: 6, ...t }),
    metal: MAT.chrome({ repeat: 6 }),
    steel: MAT.stainless({ repeat: 5 }),
    cell: MAT.metalPaint('#e0812c', { worn: 0.25, repeat: 3, map: cellTex('a'), ...t }),
    terry: (c) => MAT.fabric({ color: c, map: terryTex(c), repeat: 4, ...t }),
    paper: MAT.paper({ color: '#f4eee0', ...t }),
    ink: MAT.paint('#2b2b30', { steps: 2, spec: 0.3, specPower: 60, ...t }),
    wet: MAT.water({ color: '#dff0e4', opacity: 0.5 }),
  };
}

/* -------------------------------- 共通部品 -------------------------------- */
/** ハングヘッドつきの台紙（打ち抜き穴あり・押出）
 *  ※ 前面 UV は ExtrudeGeometry のワールド寸法 → mat 側で uv{repeat:1/w, offset:0.5} を事前に当てて正規化 */
function cardPlate(parent, { w, h, t, hole = 0.0062, headY, mat }) {
  const s = shape((sh) => {
    const r = Math.min(0.006, w * 0.12);
    sh.moveTo(-w / 2 + r, -h / 2);
    sh.lineTo(w / 2 - r, -h / 2);
    sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    sh.lineTo(w / 2, h / 2 - r);
    sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    sh.lineTo(-w / 2 + r, h / 2);
    sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    sh.lineTo(-w / 2, -h / 2 + r);
    sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  });
  if (hole) {
    const hp = new Path();
    hp.absarc(0, headY - h / 2, hole, 0, Math.PI * 2, true);
    s.holes.push(hp);
  }
  const geo = extrude(s, { depth: t, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0008, bevelSegments: 1, curveSegments: 8, steps: 1 });
  geo.translate(0, 0, -t / 2);
  geo.computeVertexNormals();
  const msh = mesh(geo, mat, { name: 'card' });
  parent.add(msh);
  return msh;
}
/** ブリスター泡（角丸長方形を大きめ bevel でドーム化／背面を z=0 に揃え、前面まで d） */
function blister(parent, { w, h, d, mat, z = 0, y = 0 }) {
  const s = shape((sh) => {
    const r = Math.min(w, h) * 0.16;
    sh.moveTo(-w / 2 + r, -h / 2);
    sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  });
  const geo = extrude(s, { depth: d * 0.42, bevelEnabled: true, bevelThickness: d * 0.29, bevelSize: 0.0026, bevelSegments: 4, curveSegments: 8, steps: 1 });
  geo.computeBoundingBox();
  geo.translate(0, 0, -geo.boundingBox.min.z);
  geo.computeVertexNormals();
  const msh = mesh(geo, mat, { pos: [0, y, z], name: 'blister', renderOrder: 5 });
  parent.add(msh);
  return msh;
}

/* ================================ variants ================================ */

/** 電池パック：単3 ×4 本（＋極の膨り・−極の面・ラッパ巻き） */
function vBattery(P, M, rnd, o) {
  const S = SPEC.battery;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0016, hole: 0.0058, headY: S.h * 0.415, mat: M.card('battery') });
  // 穴の補強リング（打ち抜きの白ボロが見える）
  P.add(noHull(mesh(new TorusGeometry(0.0062, 0.0008, 6, 18), M.cardBack, { pos: [0, S.h * 0.415 - S.h / 2, 0.001], cast: false })));
  const cellH = 0.0505, cellR = 0.0053;
  for (let i = 0; i < 4; i++) {
    const c = grp(`cell-${i}`); P.add(c);
    const x = (i - 1.5) * (cellR * 2 + 0.0022);
    c.position.set(x, -0.157 * 0.085, 0.0075);
    c.rotation.z = range(rnd, -1.2, 1.2) * D2R;
    // 本体（印刷ラッパ）
    c.add(mesh(cyl(cellR, cellR, cellH, 18), M.cell, { name: 'cell-body' }));
    // ＋極の膨り（段付き）
    c.add(mesh(cyl(cellR * 0.86, cellR * 0.92, 0.0026, 16), M.metal, { pos: [0, cellH / 2 + 0.0013, 0] }));
    c.add(mesh(cyl(cellR * 0.42, cellR * 0.42, 0.0030, 12), M.metal, { pos: [0, cellH / 2 + 0.0038, 0] }));
    // −極（平坦な皿）
    c.add(mesh(cyl(cellR * 0.94, cellR * 0.86, 0.0014, 16), M.steel, { pos: [0, -cellH / 2 - 0.0005, 0] }));
    // 絶縁リング（＋極下のベロ）
    c.add(noHull(mesh(tor(cellR * 1.02, 0.0007, 5, 16), MAT.paint('#f2ede0', { steps: 2 }), { pos: [0, cellH / 2 - 0.0022, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // ブリスター（4 本を覆う泡）
  blister(P, { w: 0.044, h: 0.066, d: 0.0165, mat: M.blister, z: 0.0016, y: -0.157 * 0.085 });
  // 缺陷：開封時の切れ目・値引きシール跡・埃
  P.add(noHull(mesh(box(0.02, 0.0016, 0.004), MAT.paint('#cfc6ae', { steps: 2 }), { pos: [0.004, S.h * 0.26, 0.004], rot: [0, 0, 2 * D2R], cast: false })));
  decal(P, { map: TEX.wear({ kind: 'chip', color: '#efe7d2', seed: (o.seed ?? 1) + 3, density: 1.6 }), w: 0.02, h: 0.016, pos: [-0.011, -0.157 * 0.3, S.w * 0.03 + 0.0026], opacity: 0.8 });
  weather(P, { w: 0.014, h: 0.02, pos: [S.w * 0.28, -0.157 * 0.42, 0.003], kind: 'dirt', color: '#8b7f66', opacity: 0.35, seed: (o.seed ?? 1) + 5, spread: 0.001 });
}

/** 折り畳み傘：収納された傘本体＋PVC 袋＋ヘッドカード */
function vUmbrella(P, M, rnd, o) {
  const S = SPEC.umbrella;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0016, hole: 0.0056, headY: S.h * 0.42, mat: M.card('umbrella') });
  // 袋（透明パイプ＋口）
  const bagH = S.h * 0.58, bagW = S.w * 0.76, bagY = -0.156 * 0.145;
  const bag = grp('bag'); P.add(bag);
  bag.add(noHull(mesh(rbox(bagW, bagH, 0.023, 0.004, 3), M.bag, { pos: [0, bagY, 0.0105], cast: false, receive: false, renderOrder: 6 })));
  bag.add(noHull(mesh(box(bagW, 0.006, 0.023), M.bag, { pos: [0, bagY + bagH / 2 + 0.002, 0.0105], cast: false, renderOrder: 6 })));
  // 収納された傘（袋の中に収まる長さに納める）
  const u = grp('umbrella-folded'); P.add(u);
  const uBot = bagY - bagH / 2 + 0.007, uTop = bagY + bagH / 2 - 0.006;
  const uR = 0.0104;
  const bunA = uBot + 0.019, bunB = uTop - 0.030, uH = bunB - bunA;
  u.add(mesh(lathe([[0, 0], [uR * 0.55, 0.004], [uR, 0.014], [uR * 1.02, uH * 0.62], [uR * 0.84, uH - 0.01], [uR * 0.4, uH], [0, uH]], 14),
    MAT.fabric({ color: '#39465e', map: terryTex('#39465e'), repeat: 6, tint: o.tint }), { pos: [-15e-4, bunA, 0.0105], name: 'cloth-bun' }));
  // 束の仕切りテープ（マジック）2 箇所
  for (const f of [0.24, 0.74]) {
    u.add(noHull(mesh(tor(uR * 1.08, 0.0021, 5, 16), MAT.rubber('#2b3040'), { pos: [-15e-4, bunA + uH * f, 0.0105], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // 柄（グリップ）・芯金・先端金具
  u.add(mesh(cyl(0.0064, 0.006, 0.026, 12), MAT.rubber('#2c3038'), { pos: [-15e-4, uTop - 0.013, 0.0105] }));
  u.add(mesh(cyl(0.004, 0.0036, 0.017, 10), MAT.metal('#b7bbbe'), { pos: [-15e-4, bunA - 0.0085, 0.0105] }));
  u.add(noHull(mesh(sph(0.0038, 8, 6), MAT.metal('#b7bbbe'), { pos: [-15e-4, bunA - 0.0165, 0.0105], cast: false })));
  // 袋の印刷（商品名タテ）
  decal(bag, { map: TEX.signboard({ text: '折りたたみ', sub: 'UV CUT · 8 本骨', bg: 'rgba(255,255,255,0.86)', fg: '#3d76b4' }), w: 0.03, h: 0.048, pos: [0.003, bagY + 0.014, 0.0224], rot: [0, 0, -90 * D2R], opacity: 0.9 });
  // 缺陷：袋から覗く折れた骨 1 本・袋のシワ・台紙の角擦れ
  u.add(noHull(mesh(tubeOf([[uR * 0.9, bunA + uH * 0.3, 0.0105], [uR * 1.5, bunA + uH * 0.55, 0.016], [uR * 1.15, bunA + uH * 0.8, 0.0125]], 0.0007, 10, 4), M.steel, { cast: false })));
  weather(bag, { w: 0.018, h: 0.026, pos: [-bagW * 0.26, bagY - bagH * 0.2, 0.0224], kind: 'scratch', color: '#ffffff', opacity: 0.4, seed: (o.seed ?? 1) + 7, density: 1.4, spread: 0.001 });
  weather(P, { w: 0.016, h: 0.018, pos: [S.w * 0.2, S.h * 0.32, 0.0032], kind: 'chip', color: '#c9c2ad', opacity: 0.4, seed: (o.seed ?? 1) + 9, spread: 0.001 });
}

/** タオル：畳みヒダ（段階ずらしの束）＋紙帯＋袋 */
function vTowel(P, M, rnd, o) {
  const S = SPEC.towel;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0016, hole: 0.0056, headY: S.h * 0.425, mat: M.card('towel') });
  const clothCol = '#e8b6c2';
  const cloth = MAT.fabric({ color: clothCol, map: terryTex(clothCol), repeat: 3, tint: o.tint });
  const clothLt = MAT.fabric({ color: shade(clothCol, 1.09), map: terryTex(clothCol), repeat: 3, tint: o.tint });
  const stackY = -0.15 * 0.11;
  const tw = S.w * 0.74, sh = 0.046;
  // 畳んだ生地：山折りの段を 5 枚の独立プレートで（1 枚ずつずらす）
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    P.add(noHull(mesh(rbox(tw * (1 - t * 0.035), 0.0088, 0.0132 + t * 0.0022, 0.0022, 2), i % 2 ? cloth : clothLt, {
      pos: [(t - 0.5) * 0.0035, stackY + (i - 2) * 0.0088, 0.0108 + (i % 2 ? 0.0007 : -7e-4)],
      rot: [0, 0, range(rnd, -1.1, 1.1) * D2R], cast: false, receive: false,
    })));
  }
  // 畳みの山（左右端の丸み＝生地の折り返し）
  for (const sx of [-1, 1]) {
    P.add(noHull(mesh(cyl(0.0046, 0.0046, sh * 0.94, 10), cloth, {
      pos: [sx * (tw / 2 - 0.001), stackY + 0.002, 0.0108], scale: [0.62, 1, 1], cast: false,
    })));
  }
  // 紙帯（ブランドバンド）
  P.add(mesh(rbox(tw + 0.004, 0.026, 0.021, 0.002, 2), M.card('towel'), { pos: [0, stackY + 0.004, 0.0108], name: 'band' }));
  // 袋（透明）
  P.add(noHull(mesh(rbox(S.w * 0.88, S.h * 0.6, 0.024, 0.005, 3), M.bag, { pos: [0, stackY + 0.004, 0.0112], cast: false, receive: false, renderOrder: 6 })));
  // 缺陷：ほつれ糸・帯のヨレ・袋のシワ
  P.add(noHull(mesh(tubeOf([[tw * 0.44, stackY + sh / 2 - 0.006, 0.022], [tw * 0.52, stackY + sh / 2 + 0.001, 0.025], [tw * 0.46, stackY + sh / 2 + 0.009, 0.022]], 0.0004, 8, 4), clothLt, { cast: false })));
  weather(P, { w: 0.018, h: 0.022, pos: [-0.058 * 0.2, stackY - 0.016, 0.0242], kind: 'dirt', color: '#8b7f66', opacity: 0.24, seed: (o.seed ?? 1) + 11, spread: 0.001 });
}

/** ペン：2 本（フック掛け・キャップ・クリップ・芯先） */
function vPen(P, M, rnd, o) {
  const S = SPEC.pen;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0014, hole: 0.0052, headY: S.h * 0.43, mat: M.card('pen') });
  const body = M.plastic('#2f3b52');
  for (let i = 0; i < 2; i++) {
    const pen = grp(`pen-${i}`); P.add(pen);
    const x = (i - 0.5) * 0.017;
    pen.position.set(x, -0.158 * 0.1, 0.009);
    pen.rotation.z = (i ? 1.4 : -1.1) * D2R;
    const L = 0.112, r = 0.0042;
    pen.add(mesh(cyl(r, r * 0.86, L * 0.62, 14), body, { pos: [0, L * 0.14, 0] }));           // 軸
    pen.add(mesh(cyl(r * 0.92, r * 0.5, L * 0.24, 14), MAT.plastic('#d9d5c8'), { pos: [0, -L * 0.28, 0] })); // グリップ錐
    pen.add(mesh(cyl(r * 1.02, r * 0.98, L * 0.3, 14), M.plastic('#b8443a'), { pos: [0, L * 0.42, 0] }));    // キャップ
    pen.add(noHull(mesh(sph(r * 1.02, 10, 8), M.plastic('#b8443a'), { pos: [0, L * 0.57, 0], cast: false })));
    // クリップ（樹脂の一枚もの）
    pen.add(mesh(rbox(0.0016, L * 0.24, 0.0044, 0.0008, 2), M.plastic('#e9e5da'), { pos: [r + 0.0016, L * 0.44, 0], rot: [0, 0, -3 * D2R] }));
    // 金属ノック先・リング
    pen.add(mesh(cyl(r * 0.42, r * 0.42, 0.009, 10), M.metal, { pos: [0, -L * 0.4, 0] }));
    pen.add(noHull(mesh(coneTiny(r * 0.42, 0.006), M.metal, { pos: [0, -L * 0.408 - 0.003, 0], rot: [180 * D2R, 0, 0], cast: false })));
    pen.add(noHull(mesh(tor(r * 1.03, 0.0007, 5, 14), M.metal, { pos: [0, L * 0.27, 0], rot: [-90 * D2R, 0, 0], cast: false })));
    // 軸の印刷（商品名）
    decal(pen, { map: TEX.adStrip({ text: '0.7 BLACK', bg: '#f2efe6', seed: 3 }), w: 0.018, h: 0.005, pos: [0, L * 0.06, r + 0.0006], opacity: 0.9 });
  }
  blister(P, { w: 0.04, h: 0.122, d: 0.016, mat: M.blister, z: 0.0014, y: -0.158 * 0.1 });
  // 缺陷：ブリスターの角切れ・ペン先のかすかな曲がり
  P.add(noHull(mesh(box(0.008, 0.0022, 0.003), MAT.paint('#efe9d8', { steps: 2 }), { pos: [0.014, -0.158 * 0.02, 0.014], rot: [0, 0, 0.3], cast: false })));
  weather(P, { w: 0.014, h: 0.018, pos: [-0.052 * 0.24, -0.158 * 0.42, 0.003], kind: 'dirt', color: '#7f7a63', opacity: 0.32, seed: (o.seed ?? 1) + 13, spread: 0.001 });
}
const coneTiny = (r, h) => new ConeGeometry(r, h, 10);

/** ノート：表紙・無線糊とじ・ゴムバンド・方眼 */
function vNotebook(P, M, rnd, o) {
  const S = SPEC.notebook;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0014, hole: 0.0052, headY: S.h * 0.43, mat: M.card('notebook') });
  const B = grp('notebook'); P.add(B);
  const w = S.w * 0.74, h = S.h * 0.6, d = 0.014;
  B.position.set(0, -0.152 * 0.1, 0.009);
  B.rotation.z = -1.2 * D2R;
  // 本文（糊とじ＝背が丸い）
  const pages = new BoxGeometry(w, h, d);
  B.add(mesh(pages, MAT.paper({ color: '#f7f3e6', map: TEX.paper({ base: '#f7f3e6', repeat: 2 }).map, spec: 0.05, shadowAmt: 0.85, tint: o.tint }), { name: 'pages' }));
  // 表紙（やや大きめ・角丸）
  B.add(mesh(rbox(w + 0.002, h + 0.002, d + 0.0028, 0.0022, 2), M.plastic('#c9a227'), { pos: [0.0006, 0, 0.0012], name: 'cover' }));
  B.add(noHull(mesh(plane(w * 0.9, h * 0.9), MAT.poster({ map: TEX.poster({ title: '方眼 80 枚', sub: '春のしおりのしおり', bg: '#f6efd8', accent: '#c9a227', seed: 5 }), spec: 0.14, side: DoubleSide }), { pos: [0.0006, 0, d / 2 + 0.0044], cast: false })));
  // 背の糊とじ（‑X 側へ膨らむ半円）＋ホチキス 2 箇所
  B.add(noHull(mesh(new CylinderGeometry(d / 2 + 0.0012, d / 2 + 0.0012, h * 0.985, 12, 1, false, Math.PI, Math.PI),
    MAT.paper({ color: '#e6d9b6', tint: o.tint }), { pos: [-w / 2 - 0.001, 0, 0.0012], cast: false })));
  for (const fy of [0.28, 0.72]) {
    B.add(noHull(mesh(box(0.0034, 0.0016, 0.0012), M.metal, { pos: [-w / 2 - 0.0026, -h / 2 + h * fy, 0.0012], cast: false })));
  }
  // ゴムバンド（表紙→天→裏表紙→地の一周を閉じたチューブで通す）
  const bw = d / 2 + 0.0032, bh = h / 2 + 0.0032;
  const loop = [];
  for (let i = 0; i < 22; i++) {
    const t = i / 22 * Math.PI * 2;
    loop.push([w * 0.28, Math.sin(t) * bh, Math.cos(t) * bw]);
  }
  B.add(noHull(mesh(tubeOf(loop, 0.0011, 34, 6, true), MAT.rubber('#6b4a3a'), { pos: [0, 0, 0.0016], cast: false })));
  // しおり紐（挟んだ栞が下部から覗く）
  B.add(noHull(mesh(tubeOf([[w * 0.1, -h / 2 + 0.004, 0.002], [w * 0.115, -h / 2 - 0.006, 0.004], [w * 0.09, -h / 2 - 0.014, 0.002]], 0.0007, 8, 4), MAT.rubber('#b8443a'), { cast: false })));
  blister(P, { w: S.w * 0.82, h: S.h * 0.63, d: 0.0225, mat: M.blister, z: 0.0014, y: -0.152 * 0.1 });
  // 缺陷：表紙の角の丸み・ゴムが劣化で伸びた跡
  weather(P, { w: 0.016, h: 0.016, pos: [w * 0.28, -0.152 * 0.02, 0.0246], kind: 'chip', color: '#e6dcc0', opacity: 0.42, seed: (o.seed ?? 1) + 17, spread: 0.0012 });
}

/** 剃刀：ハンドル＋替刃 3（金属カートリッジ・5 枚刃の線） */
function vRazor(P, M, rnd, o) {
  const S = SPEC.razor;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0016, hole: 0.0056, headY: S.h * 0.42, mat: M.card('razor') });
  const Y0 = -0.156 * 0.09;
  // ハンドル（左に 1 本）
  const hd = grp('handle'); P.add(hd);
  hd.position.set(-0.058 * 0.28, Y0, 0.01);
  hd.rotation.z = 2 * D2R;
  const hL = 0.104;
  hd.add(mesh(cyl(0.0052, 0.0044, hL * 0.72, 14), M.plastic('#4a8fb0'), { pos: [0, -hL * 0.1, 0] }));
  hd.add(mesh(rbox(0.0086, hL * 0.3, 0.0062, 0.0026, 2), MAT.rubber('#25404d'), { pos: [0, -hL * 0.26, 0] }));
  hd.add(mesh(cyl(0.0056, 0.0052, hL * 0.16, 14), M.plastic('#2f4854'), { pos: [0, hL * 0.32, 0] }));
  // 刃カートリッジ（ヘッド）
  const head = grp('head'); hd.add(head);
  head.position.set(0, hL * 0.44, 0);
  head.rotation.x = -18 * D2R;
  head.add(mesh(rbox(0.015, 0.0068, 0.0086, 0.002, 2), M.plastic('#e8eef2'), { name: 'cartridge' }));
  for (let i = 0; i < 5; i++) {
    head.add(noHull(mesh(box(0.0132, 0.00035, 0.0009), M.metal, { pos: [0, -22e-4 + i * 0.0011, 0.0044], cast: false })));
  }
  head.add(noHull(mesh(rbox(0.014, 0.0016, 0.009, 0.0007, 2), M.plastic('#7fb2c8'), { pos: [0, 0.0038, 0.001], cast: false })));
  // 替刃 3 個（右側に縦に 3 列）
  for (let i = 0; i < 3; i++) {
    const bl = grp(`blade-${i}`); P.add(bl);
    bl.position.set(S.w * 0.2, Y0 + 0.036 - i * 0.037, 0.011);
    bl.rotation.z = range(rnd, -2.2, 2.2) * D2R;
    bl.add(mesh(rbox(0.017, 0.0105, 0.0072, 0.0022, 2), M.plastic('#eef2f4'), { name: 'blade-body' }));
    for (let k = 0; k < 5; k++) bl.add(noHull(mesh(box(0.0148, 0.0004, 0.0008), M.metal, { pos: [0, -34e-4 + k * 0.0017, 0.0037], cast: false })));
    bl.add(noHull(mesh(box(0.017, 0.0022, 0.0074), M.plastic('#7fb2c8'), { pos: [0, 0.005, 0], cast: false })));
  }
  blister(P, { w: S.w * 0.86, h: S.h * 0.62, d: 0.019, mat: M.blister, z: 0.0016, y: Y0 });
  // 缺陷：刃の箱の角ペチャンコ・カードの接着浮き
  P.add(noHull(mesh(rbox(0.01, 0.008, 0.006, 0.0025, 2), M.plastic('#dfe5e8'), { pos: [S.w * 0.2, Y0 - 0.056, 0.011], rot: [0, 0, 0.3], scale: [1, 0.6, 0.8], cast: false })));
  weather(P, { w: 0.018, h: 0.02, pos: [-0.058 * 0.24, S.h * 0.3, 0.0032], kind: 'chip', color: '#cfc8b6', opacity: 0.42, seed: (o.seed ?? 1) + 19, spread: 0.0012 });
}

/** 除菌クロス：フラットパウチ＋開封スリット＋ヘットカード */
function vWiper(P, M, rnd, o) {
  const S = SPEC.wiper;
  cardPlate(P, { w: S.w, h: S.h, t: 0.0014, hole: 0.0052, headY: S.h * 0.43, mat: M.card('wiper') });
  const Y0 = -0.157 * 0.11;
  const pouch = grp('pouch'); P.add(pouch);
  const w = S.w * 0.84, h = S.h * 0.56;
  // パウチ本体（ソフト＋中央が膨らむ）
  const g = new BoxGeometry(w, h, 0.012, 8, 10, 1);
  const p = g.attributes.position; const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (w / 2), ny = v.y / (h / 2);
    const bulge = (1 - nx * nx) * (1 - ny * ny) * 0.0042;
    p.setZ(i, v.z + (v.z > 0 ? bulge : -bulge * 0.6));
    p.setX(i, v.x * (1 + 0.02 * (1 - ny * ny)));   // 両端のシール部で細る
  }
  p.needsUpdate = true; g.computeVertexNormals();
  pouch.add(mesh(g, MAT.plastic('#dff0e4', { spec: 0.42, specPower: 60, shadowAmt: 0.7, tint: o.tint }), { name: 'pouch-body' }));
  // 両端のシール（エンボス条）
  for (const sx of [-1, 1]) {
    pouch.add(noHull(mesh(box(0.004, h * 0.96, 0.0072), MAT.plastic('#c8e2d0'), { pos: [sx * w / 2 * 0.99, 0, 0], cast: false })));
    for (let i = 0; i < 9; i++) pouch.add(noHull(mesh(box(0.0042, 0.0008, 0.0074), MAT.plastic('#b5d6bf'), { pos: [sx * w / 2 * 0.99, -h * 0.44 + i * (h * 0.11), 0], cast: false })));
  }
  // 開封スリット＋プラキャップ（蓋）
  pouch.add(noHull(mesh(box(w * 0.52, 0.0012, 0.0012), MAT.paint('#8fb89c', { steps: 2 }), { pos: [-w * 0.1, h * 0.3, 0.0088], cast: false })));
  pouch.add(mesh(cyl(0.0084, 0.0088, 0.0042, 16), M.plastic('#5aa870'), { pos: [w * 0.2, h * 0.3, 0.0106], rot: [90 * D2R, 0, 0] }));
  pouch.add(noHull(mesh(circ(0.0058, 14), MAT.paint('#3f7a52', { steps: 2 }), { pos: [w * 0.2, h * 0.3, 0.0128], cast: false, receive: false })));
  // 印刷（除菌 77%）
  decal(pouch, { map: TEX.signboard({ text: '除菌クロス', sub: '77% 酒精 · 10 枚', bg: 'rgba(255,255,255,0.9)', fg: '#2b4030' }), w: w * 0.86, h: h * 0.34, pos: [0, -h * 0.06, 0.0112], opacity: 0.95 });
  // 缺陷：パウチの角の白化（落とした跡）・接着の浮き・色褪せ
  P.add(noHull(mesh(sph(0.0052, 8, 6), MAT.paint('#eef7f0', { steps: 2, spec: 0.2 }), { pos: [-w * 0.44, -h * 0.42, 0.004], scale: [1, 1, 0.6], cast: false })));
  weather(P, { w: 0.02, h: 0.016, pos: [w * 0.2, -h * 0.3 + Y0, 0.013], kind: 'dirt', color: '#6d7a62', opacity: 0.26, seed: (o.seed ?? 1) + 23, spread: 0.0012 });
}

const VARIANTS = { battery: vBattery, umbrella: vUmbrella, towel: vTowel, pen: vPen, notebook: vNotebook, razor: vRazor, wiper: vWiper };
const VARIANT_LIST = Object.keys(VARIANTS);

function build(options = {}) {
  const variant = VARIANTS[options.variant] ? options.variant : 'battery';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 37);
  const g = grp(`daily-goods:${variant}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, mats(options), rnd, { seed, tint: options.tint });
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

const P_DAILY = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANT_LIST,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_DAILY as P, build as b };
