import { z as rand, g as grp, M as MAT, ac as Box3, n as range, m as mesh, r as rbox, h as decal, T as TEX, b as box, k as tubeOf, w as weather, t as tor, ag as CylinderGeometry, V as Vector3, c as cyl, a as sph, ae as SphereGeometry, U as circ, o as lathe, s as shade, x as PlaneGeometry, D as DoubleSide, Y as memo, N as makeCanvas, Q as toTexture, a6 as rr } from './index-C4-XtFer.js';

//  assets/products/snack-shelf-pack.js —— チェッカー棚・デザート棚向け multipack 6 variant
//  boxsnack 箱入り小菓子（1 個ずつ独立 Mesh）/ jelly カップゼリー（蓋シール＋スプーン）
//  pudding プリン（カラメル層が側面から見える）/ yogurt ヨーグルト（アルミ蓋）
//  cookie ビスケット（トレイ＋フィルム）/ ice アイス菓子（個包装・霜）
//  options: { seed, scale, variant, tint, pack }  pack = 同一トレイ内の個数（2..8・pitch は自動）
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'snack-shelf-pack',
  real: [0.12, 0.06, 0.09],
  origin: 'bottom-center',
  variants: ['boxsnack', 'jelly', 'pudding', 'yogurt', 'cookie', 'ice'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
const W = 0.12, D = 0.09;      // envelope（棚が確保する幅）

/* -------------------------------- 局所テクチャ -------------------------------- */
const packArt = (key, title, sub, bg, ink, motif) => memo(`ssp:${key}`, () => {
  const cv = makeCanvas(512, 384);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, bg);
  g.fillStyle = ink; g.globalAlpha = 0.9;
  rr(g, w * 0.04, h * 0.06, w * 0.92, h * 0.3, 10); g.fill();
  g.globalAlpha = 1;
  g.fillStyle = bg; g.font = '800 46px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(title, w / 2, h * 0.21);
  g.font = '700 22px sans-serif'; g.fillStyle = ink; g.globalAlpha = 0.85;
  g.fillText(sub, w / 2, h * 0.42);
  g.globalAlpha = 1;
  // motif（お菓子のシルエット／果実）
  if (motif === 'cake') {
    for (let i = 0; i < 6; i++) {
      const x = w * (0.12 + (i % 3) * 0.3), y = h * (0.62 + ((i / 3) | 0) * 0.16);
      g.fillStyle = shade('#c9915a', 0.9 + rnd() * 0.3);
      g.beginPath(); g.moveTo(x - 26, y + 16); g.lineTo(x + 26, y + 16); g.lineTo(x + 18, y - 18); g.lineTo(x - 18, y - 18); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - 24, y + 12, 48, 4);
    }
  } else if (motif === 'fruit') {
    for (let i = 0; i < 5; i++) {
      const x = w * (0.14 + i * 0.18), y = h * (0.68 + (i % 2) * 0.1);
      g.fillStyle = ['#e2574c', '#f0b23c', '#7fb2d8', '#9fc37a', '#c78bd0'][i];
      g.beginPath(); g.arc(x, y, 26, 0, 6.284); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(x - 8, y - 9, 8, 0, 6.284); g.fill();
    }
  } else {
    for (let i = 0; i < 22; i++) {
      g.globalAlpha = 0.14 + rnd() * 0.2; g.fillStyle = ink;
      g.fillRect(w * 0.06 + rnd() * w * 0.88, h * (0.58 + rnd() * 0.34), 20 + rnd() * 60, 4 + rnd() * 8);
    }
    g.globalAlpha = 1;
  }
  // 個数バッジ・バーコード
  g.fillStyle = '#f0c353'; g.beginPath(); g.arc(w * 0.9, h * 0.14, 42, 0, 6.284); g.fill();
  g.fillStyle = '#3a3325'; g.font = '800 30px sans-serif'; g.fillText('6', w * 0.9, h * 0.13);
  g.font = '700 14px sans-serif'; g.fillText('pcs', w * 0.9, h * 0.185);
  g.fillStyle = '#fff'; g.fillRect(w * 0.06, h * 0.9, w * 0.3, h * 0.07);
  g.fillStyle = '#1a1a1a';
  for (let i = 0; i < 30; i++) g.fillRect(w * 0.068 + i * (w * 0.28 / 30), h * 0.912, rnd() > 0.5 ? 3 : 1.4, h * 0.046);
  // 退色・擦れ
  g.globalAlpha = 0.13; g.fillStyle = '#fff';
  for (let i = 0; i < 20; i++) g.fillRect(rnd() * w, rnd() * h, 24 + rnd() * 90, 2 + rnd() * 7);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});
function fillCv(g, w, h, c) { g.fillStyle = c; g.fillRect(0, 0, w, h); }

/** アルミ蓋（ピールオフ）：放射状の押し型＋縁のカール */
const aluTex = () => memo('ssp:alu', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, '#dfe3e6');
  g.save(); g.translate(w / 2, h / 2);
  for (let i = 0; i < 60; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.12;
    g.strokeStyle = i % 2 ? '#fff' : '#9aa0a4'; g.lineWidth = 1 + rnd() * 3;
    const a = (i / 60) * 6.284;
    g.beginPath(); g.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); g.lineTo(Math.cos(a) * 124, Math.sin(a) * 124); g.stroke();
  }
  g.globalAlpha = 0.9; g.fillStyle = '#8c9195'; g.font = '800 22px sans-serif'; g.textAlign = 'center';
  g.fillText('OPEN', 0, -70); g.fillText(' aqui →', 0, 62);
  g.restore();
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** フィルム（シュリンク）のシワ・高光 */
const filmTex = () => memo('ssp:film', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.3;
    g.strokeStyle = '#ffffff'; g.lineWidth = 1 + rnd() * 5;
    const x = rnd() * w, y = rnd() * h, a = rnd() * 3.14, l = 40 + rnd() * 150;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 30, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
function mats(o) {
  const t = { tint: o.tint };
  return {
    board: (key, title, sub, bg, ink, motif) => MAT.poster({ map: packArt(key, title, sub, bg, ink, motif), color: '#ffffff', steps: 2, spec: 0.12, shadowAmt: 0.74, side: DoubleSide, ...t }),
    paper: MAT.paper({ color: '#f3ead6', spec: 0.06, shadowAmt: 0.82, ...t }),
    cupPaper: MAT.paper({ color: '#fbf6ea', spec: 0.1, shadowAmt: 0.78, ...t }),
    trayPlastic: (c) => MAT.hardPlastic(c, { repeat: 5, spec: 0.44, specPower: 66, ...t }),
    cupClear: MAT.glassLite({ color: '#f0f6f6', opacity: 0.3, spec: 1, specPower: 230, side: DoubleSide, depthWrite: false }),
    alu: MAT.metalPaint('#dfe3e6', { worn: 0.15, repeat: 3, map: aluTex(), spec: 0.8, specPower: 150, shadowAmt: 0.6 }),
    film: MAT.glassLite({ color: '#eef4f6', opacity: 0.2, map: filmTex(), side: DoubleSide, depthWrite: false }),
    seal: MAT.plastic('#e9e5da', { steps: 2, spec: 0.3, ...t }),
    spoon: (c) => MAT.hardPlastic(c, { repeat: 5, ...t }),
    // 食材
    jellyFruit: (c) => MAT.food({ color: c, spec: 0.9, specPower: 170, specCut: 0.08, sheen: 0.3, shadowAmt: 0.5, transparent: true, opacity: 0.86, ...t }),
    jellySyrup: MAT.water({ color: '#f2c879', opacity: 0.62, spec: 1, specPower: 250, scroll: [0.004, 0.003] }),
    custard: MAT.food({ color: '#f2dcae', spec: 0.72, specPower: 60, specCut: 0.14, sheen: 0.16, shadowAmt: 0.55, ...t }),
    caramel: MAT.food({ color: '#6b3410', spec: 0.95, specPower: 160, specCut: 0.07, sheen: 0.28, shadowAmt: 0.5, ...t }),
    yogurt: MAT.rice({ color: '#fbf6ea', spec: 0.66, specPower: 46, shadowAmt: 0.55, ...t }),
    yogurtFruit: MAT.food({ color: '#d98a9a', spec: 0.7, specPower: 60, ...t }),
    cakeCrumb: (c) => MAT.food({ color: c, spec: 0.3, specPower: 22, specCut: 0.42, sheen: 0.06, shadowAmt: 0.68, ...t }),
    choc: MAT.food({ color: '#4a2a19', spec: 0.82, specPower: 110, specCut: 0.1, sheen: 0.2, ...t }),
    icing: MAT.food({ color: '#f7eef0', spec: 0.7, specPower: 90, specCut: 0.12, ...t }),
    filmPrint: (c) => MAT.plastic(c, { steps: 3, spec: 0.4, ...t }),
    wet: MAT.water({ color: '#e8dcc4', opacity: 0.42 }),
  };
}

/* -------------------------------- 共通部品 -------------------------------- */
/**  termoformed トレイ（フチ・内底・仕切り） */
function tray(parent, { w, d, h, wall = 0.0016, mat, floorMat, y = 0 }) {
  const T = grp('tray'); parent.add(T);
  // フチ（厚みのあるリブ：4 本）
  for (const [sx, len, ox, oz, rotY] of [[0, w, 0, d / 2 - wall / 2, 0], [0, w, 0, -(d / 2 - wall / 2), 0], [1, d, w / 2 - wall / 2, 0, 90], [1, d, -(w / 2 - wall / 2), 0, 90]]) {
    T.add(mesh(box(rotY ? wall : len, h, rotY ? len : wall), mat, { pos: [ox, y + h / 2, oz] }));
  }
  // 内底（一段薄くして奥行き感）
  T.add(noHull(mesh(box(w - wall * 2, 0.0022, d - wall * 2), floorMat || mat, { pos: [0, y + 0.0011, 0], cast: false })));
  return T;
}
/** シュリンクフィルム（角丸 Box＋シワ map＋両端のヒダ） */
function filmWrap(parent, { w, h, d, y = 0, mat }) {
  const F = grp('film'); parent.add(F);
  F.add(noHull(mesh(rbox(w, h, d, 0.006, 3), mat, { pos: [0, y + h / 2, 0], cast: false, receive: false, renderOrder: 7 })));
  // 両端の寄せヒダ（セロファンを絞った先端）
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.284;
      F.add(noHull(mesh(tubeOf([
        [sx * (w / 2 - 0.002), y + h / 2 + Math.sin(a) * h * 0.2, Math.cos(a) * d * 0.2],
        [sx * (w / 2 + 0.0044), y + h / 2 + Math.sin(a) * h * 0.1, Math.cos(a) * d * 0.07],
      ], 0.0008, 6, 4), mat, { cast: false, receive: false })));
    }
    F.add(noHull(mesh(rbox(0.0034, h * 0.5, d * 0.5, 0.0015, 2), mat, { pos: [sx * (w / 2 + 0.0062), y + h / 2, 0], cast: false, receive: false })));
  }
  return F;
}

/** 個包装フィルム（1 品ずつ包む小袋） */
function unitFilm(parent, { w, h, d, pos, rot = [0, 0, 0], mat }) {
  const m = noHull(mesh(rbox(w, h, d, Math.min(w, h, d) * 0.28, 2), mat, { pos, rot, cast: false, receive: false, renderOrder: 7 }));
  parent.add(m);
  return m;
}

/** カップ（紙 or プラスミック）：上端ロール付き */
function cupGeo(rB, rT, h) {
  return lathe([[0, 0], [rB * 0.98, 0], [rB, 0.0018], [rT - 0.0004, h - 0.0022], [rT, h - 0.0006], [rT + 0.0012, h]], 20);
}

/* ================================ variants ================================ */

/** 箱菓子：=open top 箱＋紙ライナー＋独立した 6 個の小菓子 */
function vBoxsnack(P, M, rnd, o) {
  const n = Math.max(2, Math.min(6, o.pack ?? 6));
  const nx = n <= 3 ? n : Math.ceil(n / 2), nz = Math.ceil(n / nx);
  const bw = W * 0.94, bd = D * 0.9, bh = 0.034;
  const boxG = grp('box'); P.add(boxG);
  const art = M.board('boxsnack', '小さな焼菓子', 'バター風味 · 6 個入', '#f5e6c8', '#6b4a2c', 'cake');
  // 箱の 4 壁＋底（前壁を低くして中身が見える陳列仕様）
  boxG.add(mesh(box(bw, 0.0016, bd), art, { pos: [0, 0.0008, 0], name: 'box-floor' }));
  boxG.add(mesh(box(bw, bh, 0.0016), art, { pos: [0, bh / 2, -bd / 2], name: 'box-back' }));
  boxG.add(mesh(box(0.0016, bh, bd), art, { pos: [-bw / 2, bh / 2, 0], name: 'box-left' }));
  boxG.add(mesh(box(0.0016, bh, bd), art, { pos: [bw / 2, bh / 2, 0], name: 'box-right' }));
  boxG.add(mesh(box(bw, bh * 0.52, 0.0016), art, { pos: [0, bh * 0.26, bd / 2], name: 'box-front' }));
  // 天蓋（開けて背側へ折り倒したフラップ＝箱の外側面に沿って下がる）
  const lid = grp('lid'); boxG.add(lid);
  lid.add(mesh(box(bw * 0.99, 0.0014, 0.0135), art, { pos: [0, 0, 0] }));
  lid.position.set(0, bh + 0.0068, -bd / 2 - 0.0016);
  lid.rotation.x = -7 * D2R;
  // 内側の紙ライナー（クシュッとした包装紙）
  const lin = new PlaneGeometry(bw * 0.9, bd * 0.8, 6, 6);
  const lp = lin.attributes.position; const lv = new Vector3();
  for (let i = 0; i < lp.count; i++) { lv.fromBufferAttribute(lp, i); lp.setZ(i, Math.sin(lv.x * 90) * 0.0016 + Math.cos(lv.y * 74) * 0.0016); }
  lp.needsUpdate = true; lin.computeVertexNormals();
  boxG.add(noHull(mesh(lin, M.paper, { pos: [0, 0.0028, 0], rot: [-90 * D2R, 0, 0.05], cast: false })));
  // 小菓子（1 個ずつ独立形状：マドレーヌ形・フィナンシェ形・どら焼き形を順に）
  const px = bw * 0.8 / Math.max(1, nx), pz = bd * 0.78 / Math.max(1, nz);
  let idx = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (idx >= n) break;
    const kind = idx % 3;
    const x = -bw * 0.4 + px * (i + 0.5), z = -bd * 0.39 + pz * (j + 0.5);
    const c = grp(`cake-${idx}`); P.add(c);
    c.position.set(x + range(rnd, -2e-3, 0.002), 0.004, z + range(rnd, -2e-3, 0.002));
    c.rotation.y = range(rnd, -0.4, 0.4);
    if (kind === 0) {
      // マドレーヌ（シェル形＝扇の凹凸）
      const shell = lathe([[0, 0], [0.0125, 0.0015], [0.015, 0.0055], [0.0125, 0.0092], [0, 0.0105]], 16);
      c.add(mesh(shell, M.cakeCrumb('#dcac6d'), { scale: [1, 1, 1.35], name: 'madeleine' }));
      for (let k = 0; k < 5; k++) c.add(noHull(mesh(box(0.0016, 0.0088, 0.028), M.cakeCrumb('#d3a062'), { pos: [(-2 + k) * 0.005, 0.0055, 0], rot: [0, 0, (k - 2) * 0.06], cast: false })));
    } else if (kind === 1) {
      // フィナンシェ（長方形・縁が茶色）
      c.add(mesh(rbox(0.03, 0.011, 0.019, 0.004, 2), M.cakeCrumb('#e2b478'), { pos: [0, 0.0055, 0], name: 'financier' }));
      c.add(noHull(mesh(rbox(0.031, 0.0022, 0.02, 0.0012, 2), M.cakeCrumb('#b07a3e'), { pos: [0, 0.0106, 0], cast: false })));
      c.add(noHull(mesh(cyl(0.0026, 0.0026, 0.0012, 10), M.choc, { pos: [0.006, 0.0116, 0.002], cast: false })));
    } else {
      // どら焼き風（二枚の皮＋餡の覗き）
      for (const [k, dy] of [[0, 0.0026], [1, 0.0092]]) {
        c.add(mesh(cyl(0.0155, 0.0148, 0.0048, 18), M.cakeCrumb(k ? '#d8a869' : '#c98f52'), { pos: [0, dy, 0], name: 'doraya' }));
      }
      c.add(noHull(mesh(cyl(0.0142, 0.0142, 0.0024, 18), M.cakeCrumb('#5b3a22'), { pos: [0, 0.0059, 0], cast: false })));
    }
    // 個別フィルムの照り返し
    if (idx % 2 === 0) unitFilm(c, { w: 0.034, h: 0.016, d: 0.024, pos: [0, 0.006, 0], mat: M.film });
    idx++;
  }
  // 缺陷：箱の角の潰れ・個包装の破れ・屑
  boxG.add(noHull(mesh(rbox(0.014, 0.006, 0.004, 0.002, 2), M.paper, { pos: [bw / 2 - 0.004, bh - 0.002, bd / 2 - 0.008], rot: [0, 0.3, 0], cast: false })));
  weather(boxG, { w: 0.026, h: 0.02, pos: [-bw * 0.3, bh * 0.6, bd / 2 + 0.0016], kind: 'dirt', color: '#8b7a58', opacity: 0.3, seed: (o.seed ?? 1) + 3, spread: 0.0015 });
  for (let i = 0; i < 5; i++) {
    P.add(noHull(mesh(sph(0.0012 + rnd() * 0.0016, 6, 5), M.cakeCrumb('#c9a06a'), {
      pos: [range(rnd, -0.05, 0.05), 0.0025, range(rnd, -0.038, 0.038)], cast: false, receive: false,
    })));
  }
}

/** カップゼリー：蓋シール（端のツマミ）・中身の果肉・スプーン 2 本 */
function vJelly(P, M, rnd, o) {
  const n = Math.max(2, Math.min(6, o.pack ?? 6));
  const nx = Math.min(3, n), nz = Math.ceil(n / nx);
  const rT = 0.0162, rB = 0.0136, hh = 0.045;
  const px = W * 0.86 / nx, pz = D * 0.84 / nz;
  let idx = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (idx >= n) break;
    const x = -W * 0.43 + px * (i + 0.5), z = -D * 0.42 + pz * (j + 0.5);
    const c = grp(`jelly-${idx}`); P.add(c);
    c.position.set(x, 0, z);
    const flavour = ['#f0b23c', '#e2574c', '#9fc37a'][idx % 3];
    // 透明カップ（中身が見える）
    c.add(mesh(cupGeo(rB, rT, hh), M.cupClear, { name: 'jelly-cup' }));
    // ゼリー本体（上面を少しドームに）
    c.add(mesh(lathe([[0, 0.006], [rB * 0.92, 0.006], [rT - 0.0022, hh * 0.72], [rT - 0.004, hh * 0.79], [0, hh * 0.815]], 20), M.jellyFruit(flavour), { name: 'jelly-body' }));
    // 果実の封入（果肉 2 片）
    for (let k = 0; k < 2; k++) {
      const a = rnd() * 6.284;
      c.add(noHull(mesh(sph(0.0032 + rnd() * 0.002, 8, 6), M.jellyFruit(shade(flavour, 0.72)), {
        pos: [Math.cos(a) * rB * 0.4, hh * (0.2 + rnd() * 0.35), Math.sin(a) * rB * 0.4], scale: [1.3, 0.7, 1], cast: false,
      })));
    }
    // シロップの層（底）
    c.add(noHull(mesh(cyl(rB * 0.94, rB * 0.9, 0.005, 18), M.jellySyrup, { pos: [0, 0.0032, 0], cast: false, receive: false })));
    // アルミ蓋シール（やや浮き・ツマミ付き）
    c.add(noHull(mesh(cyl(rT + 0.0016, rT + 0.0012, 0.0012, 20), M.alu, { pos: [0, hh + 0.0008, 0], rot: [1.6 * D2R, 0, -1.2 * D2R], cast: false })));
    const tab = mesh(rbox(0.011, 0.0012, 0.008, 0.0008, 2), M.alu, { pos: [rT + 0.008, hh + 0.0016, 0], rot: [0.1, 0, -8 * D2R] });
    c.add(tab);
    // 侧面のラベル（風味名）
    decal(c, { map: TEX.lightPanel({ text: ['みかん', 'もも', 'ぶどう'][idx % 3], bg: '#fbf7ea', fg: '#4b4640', mode: 'sign' }), w: 0.022, h: 0.014, pos: [0, hh * 0.42, rT - 0.0008], opacity: 0.9 });
    idx++;
  }
  // スプーン（2 本、トレイ上に斜めに载せる）
  for (let k = 0; k < 2; k++) {
    const s = grp(`spoon-${k}`); P.add(s);
    s.position.set(-W * 0.14 + k * W * 0.28, 0.004, D * 0.28);
    s.rotation.set(0, 0.5 - k * 0.9, 0);
    s.add(mesh(lathe([[0, 0], [0.0055, 0.0008], [0.0066, 0.0026], [0.006, 0.005], [0, 0.0058]], 12), M.spoon('#e9eef2'), { pos: [0, 0, -0.021], scale: [0.86, 1.7, 1] }));
    s.add(mesh(rbox(0.0066, 0.0016, 0.026, 0.0008, 2), M.spoon('#e9eef2'), { pos: [0, 0.0012, 0.005] }));
    s.add(noHull(mesh(rbox(0.0046, 0.0005, 0.008, 0.0006, 2), M.spoon('#c8d2d8'), { pos: [0, 0.002, 0.017], cast: false })));
  }
  // 缺陷：蓋の端が捲れて汁が乾いた跡・カップの凹み
  weather(P, { w: 0.02, h: 0.014, pos: [W * 0.2, 0.004, -D * 0.18], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#b98f4a', opacity: 0.32, seed: (o.seed ?? 1) + 7, spread: 0.0015 });
  unitFilm(P, { w: W * 0.9, h: hh + 0.008, d: D * 0.88, pos: [0, (hh + 0.008) / 2, 0], mat: M.film });
}

/** プリン：透明カップ＋カラメル（底）＋カスタード＋アルミ蓋・小さじ */
function vPudding(P, M, rnd, o) {
  const n = Math.max(2, Math.min(4, o.pack ?? 2));
  const nx = Math.min(2, n), nz = Math.ceil(n / nx);
  const rT = 0.0258, rB = 0.0216, hh = 0.044;
  let idx = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (idx >= n) break;
    const x = (idx % nx - (nx - 1) / 2) * (W / nx) * 0.82;
    const z = (Math.floor(idx / nx) - (nz - 1) / 2) * (D * 0.36);
    const c = grp(`pudding-${idx}`); P.add(c);
    c.position.set(x, 0, z);
    // 透明カップ
    c.add(mesh(cupGeo(rB, rT, hh), M.cupClear, { name: 'pudding-cup' }));
    // カラメル（底に溜まる濃い層＋泡の縁）
    c.add(mesh(cyl(rB * 0.96, rB * 0.9, 0.0072, 22), M.caramel, { pos: [0, 0.0044, 0], name: 'caramel' }));
    c.add(noHull(mesh(circ(rB * 0.95, 20), M.caramel, { pos: [0, 0.0081, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
    // カスタード（カラメル上は薄く色が付いた“含み”）
    c.add(mesh(cyl(rT - 0.0026, rB * 0.95, hh * 0.62, 22), M.custard, { pos: [0, 0.008 + hh * 0.31, 0], name: 'custard' }));
    // 表面（つるんとした茹だり膜＋気泡）
    c.add(noHull(mesh(circ(rT - 0.003, 22), MAT.food({ color: '#f6e6bd', spec: 0.95, specPower: 190, specCut: 0.06 }), { pos: [0, hh * 0.93, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
    for (let k = 0; k < 4; k++) {
      const a = rnd() * 6.284, r = rT * (0.2 + rnd() * 0.6);
      c.add(noHull(mesh(sph(0.0012 + rnd() * 0.0014, 6, 5), MAT.food({ color: '#efe0b6', spec: 0.8, specPower: 160 }), { pos: [Math.cos(a) * r, hh * 0.932, Math.sin(a) * r], scale: [1, 0.35, 1], cast: false, receive: false })));
    }
    // アルミ蓋（中央がわずかに凹む）
    c.add(noHull(mesh(cyl(rT + 0.0018, rT + 0.0012, 0.0014, 22), M.alu, { pos: [0, hh + 0.0006, 0], cast: false })));
    c.add(noHull(mesh(circ(rT * 0.55, 18), MAT.metalPaint('#cfd4d7', { worn: 0.1, map: aluTex(), spec: 0.7 }), { pos: [0, hh + 0.0002, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
    idx++;
  }
  // すくい取り用スプーン（小・横に 1 本）
  const s = grp('spoon'); P.add(s);
  s.position.set(0, 0.003, D * 0.33); s.rotation.set(0, 1.4, 0);
  s.add(mesh(lathe([[0, 0], [0.0072, 0.001], [0.0088, 0.0032], [0.008, 0.006], [0, 0.0068]], 14), M.spoon('#f2eade'), { pos: [0, 0, -0.024], scale: [1, 1.8, 1.15] }));
  s.add(mesh(rbox(0.008, 0.0018, 0.03, 0.001, 2), M.spoon('#f2eade'), { pos: [0, 0.0014, 0.004] }));
  // 缺陷：カラメルの垂れ（カップ外壁）・蓋の白化
  for (let k = 0; k < 3; k++) {
    const a = rnd() * 6.284;
    P.add(noHull(mesh(sph(0.0016, 7, 5), M.caramel, { pos: [Math.cos(a) * (rT + 0.001), hh * (0.5 + rnd() * 0.4), Math.sin(a) * (rT + 0.001)], scale: [0.5, 2.6, 0.5], cast: false })));
  }
  weather(P, { w: 0.02, h: 0.012, pos: [W * 0.28, hh + 0.0016, -D * 0.2], kind: 'scratch', color: '#ffffff', opacity: 0.4, seed: (o.seed ?? 1) + 11, spread: 0.0012 });
}

/** ヨーグルト：アルミ蓋（ピールオフ）＋果実層＋トレイ */
function vYogurt(P, M, rnd, o) {
  const n = Math.max(2, Math.min(6, o.pack ?? 4));
  const nx = Math.min(4, n), nz = Math.ceil(n / nx);
  const rT = 0.0175, rB = 0.0152, hh = 0.042;
  const tr = tray(P, { w: W * 0.95, d: D * 0.92, h: 0.008, mat: M.trayPlastic('#eae4d5'), y: 0 });
  const cups = [];
  let idx = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (idx >= n) break;
    const x = -W * 0.43 + (W * 0.86 / nx) * (i + 0.5);
    const z = -D * 0.4 + (D * 0.8 / nz) * (j + 0.5);
    const c = grp(`yogurt-${idx}`); P.add(c);
    cups.push(c);
    c.position.set(x, 0.008, z);
    c.add(mesh(cupGeo(rB, rT, hh), M.cupPaper, { name: 'yog-cup' }));
    // 中身（ヨーグルト＋果実ソースのマーブル）
    c.add(noHull(mesh(cyl(rT - 0.0026, rB * 0.94, 0.0042, 20), M.yogurt, { pos: [0, hh - 0.0046, 0], cast: false })));
    c.add(noHull(mesh(tor(rT * 0.55, 0.0022, 5, 16), M.yogurtFruit, { pos: [0, hh - 0.0028, 0], rot: [-90 * D2R, 0, 0], scale: [1, 1, 0.35], cast: false })));
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.284;
      c.add(noHull(mesh(sph(0.0022 + rnd() * 0.0014, 7, 6), M.yogurtFruit, { pos: [Math.cos(a) * rT * 0.5, hh - 0.0032, Math.sin(a) * rT * 0.5], scale: [1, 0.4, 1], cast: false })));
    }
    // アルミ蓋（ピールオフ・中心が膨らむ）
    const lidG = new SphereGeometry(rT + 0.0016, 20, 6, 0, 6.284, 0, 0.34);
    c.add(noHull(mesh(lidG, M.alu, { pos: [0, hh - 0.0024, 0], scale: [1, 0.18, 1], cast: false })));
    c.add(noHull(mesh(tor(rT + 0.0018, 0.0009, 5, 20), M.alu, { pos: [0, hh + 0.0008, 0], rot: [-90 * D2R, 0, 0], cast: false })));
    // 側面の印刷（乳酸菌・賞味）
    decal(c, { map: TEX.lightPanel({ text: '生クリーム入り', bg: '#f8f4e8', fg: '#4a5a4a', mode: 'sign' }), w: 0.024, h: 0.012, pos: [0, hh * 0.5, rT + 0.0004], opacity: 0.9 });
    idx++;
  }
  // 缺陷：蓋の端が浮いて中身が乾燥しかけた個体・トレイの擦り傷
  if (cups.length > 1) cups[cups.length - 1].rotation.z = 4 * D2R;   // 1 個だけ蓋が浮いて傾く
  weather(tr, { w: 0.04, h: 0.012, pos: [W * 0.2, 0.0084, D * 0.2], rot: [-90 * D2R, 0, 0], kind: 'scratch', color: '#a9a89c', opacity: 0.35, seed: (o.seed ?? 1) + 13, density: 1.5, spread: 0.001 });
  weather(P, { w: 0.022, h: 0.016, pos: [-W * 0.34, 0.012, -D * 0.3], kind: 'dirt', color: '#8f8571', opacity: 0.3, seed: (o.seed ?? 1) + 17, spread: 0.0014 });
}

/** ビスケット：プラトレイ＋個々のビスケット（チョコ chip）＋フィルム */
function vCookie(P, M, rnd, o) {
  const n = Math.max(2, Math.min(6, o.pack ?? 6));
  const nx = Math.min(3, n), nz = Math.ceil(n / nx);
  const tr = tray(P, { w: W * 0.92, d: D * 0.86, h: 0.0075, mat: M.trayPlastic('#ded6c2'), y: 0 });
  let idx = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (idx >= n) break;
    const x = -W * 0.4 + (W * 0.8 / nx) * (i + 0.5);
    const z = (j - (nz - 1) / 2) * 0.024;
    const c = grp(`cookie-${idx}`); P.add(c);
    c.position.set(x, 0.008, z);
    c.rotation.y = range(rnd, -0.5, 0.5);
    const r = 0.0175 - range(rnd, 0, 0.0015);
    // 焼いた表面（微細な凹凸を頂点変位で）
    const g = new CylinderGeometry(r, r * 0.985, 0.0072, 20, 1, false);
    const p = g.attributes.position; const v = new Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      if (Math.abs(v.y) > 0.003) {
        const nrm = Math.hypot(v.x, v.z) / r;
        p.setY(k, v.y * (1 + 0.22 * (1 - nrm * nrm) + (rnd() - 0.5) * 0.14));
      }
    }
    p.needsUpdate = true; g.computeVertexNormals();
    c.add(mesh(g, M.cakeCrumb('#d3a566'), { pos: [0, 0.0036, 0], name: 'cookie-body' }));
    // 底（焼き色の深い面）
    c.add(noHull(mesh(cyl(r * 0.98, r * 0.98, 0.0012, 20), M.cakeCrumb('#a9763d'), { pos: [0, 0.0008, 0], cast: false })));
    // チョコチップ（上下面に数粒）
    for (let k = 0; k < 4; k++) {
      const a = rnd() * 6.284, rr2 = r * (0.2 + rnd() * 0.6);
      c.add(noHull(mesh(sph(0.0019 + rnd() * 0.0012, 7, 6), M.choc, { pos: [Math.cos(a) * rr2, 0.0072, Math.sin(a) * rr2], scale: [1.2, 0.5, 1.2], cast: false })));
    }
    // 塩（表面の結晶）
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.284, rr2 = r * (0.3 + rnd() * 0.6);
      c.add(noHull(mesh(sph(0.0007, 5, 4), M.icing, { pos: [Math.cos(a) * rr2, 0.0075, Math.sin(a) * rr2], cast: false, receive: false })));
    }
    idx++;
  }
  filmWrap(P, { w: W * 0.82, h: 0.026, d: D * 0.86, y: 0.001, mat: M.film });
  // 缺陷：割れたビスケット 1 枚・フィルムの破れ穴
  const cracked = grp('crack'); P.add(cracked);
  cracked.position.set(W * 0.28, 0.02, -D * 0.18);
  for (const [sx, rz] of [[-1, 6], [1, -5]]) {
    cracked.add(mesh(new CylinderGeometry(0.012, 0.0118, 0.0068, 14, 1, false, sx < 0 ? 0 : Math.PI, Math.PI), M.cakeCrumb('#d3a566'), { rot: [0, 0, 0], pos: [sx * 0.0022, 0, sx * 0.0016], scale: [1, 1, 0.9] }));
  }
  weather(tr, { w: 0.03, h: 0.014, pos: [-W * 0.3, 0.0084, D * 0.3], rot: [-90 * D2R, 0, 0], kind: 'chip', color: '#c9bda2', opacity: 0.4, seed: (o.seed ?? 1) + 19, spread: 0.0012 });
  weather(P, { w: 0.02, h: 0.02, pos: [W * 0.1, 0.02, D * 0.34], kind: 'dirt', color: '#8b7f66', opacity: 0.26, seed: (o.seed ?? 1) + 23, spread: 0.0014 });
}

/** アイス菓子：個包装バー ×n（霜・-printed wrapper・重なりの影） */
function vIce(P, M, rnd, o) {
  const n = Math.max(2, Math.min(6, o.pack ?? 4));
  const tr = tray(P, { w: W * 0.94, d: D * 0.88, h: 0.008, mat: M.trayPlastic('#e7ecef'), y: 0 });
  const bw = 0.024, bh = 0.014, bd = D * 0.58;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (W * 0.84 / Math.max(1, n));
    const c = grp(`ice-${i}`); P.add(c);
    c.position.set(x, 0.009 + (i % 2) * 0.0006, (i % 2 - 0.5) * 0.006);
    c.rotation.set(range(rnd, -0.05, 0.05), range(rnd, -0.1, 0.1), range(rnd, -0.03, 0.03));
    // 個包装（印刷フィルム）：角丸 Box＋両端のヒダ
    c.add(mesh(rbox(bw, bh, bd, 0.0042, 3), M.filmPrint(['#7fb2d8', '#e8b3c0', '#c9d98a', '#f0c88a'][i % 4]), { name: 'ice-wrap' }));
    // 印刷（商品名）
    decal(c, { map: TEX.signboard({ text: 'ICE', sub: '/coffee 珈琲/', bg: 'rgba(255,255,255,0.0)', fg: '#3a3325' }), w: bw * 0.8, h: bd * 0.34, pos: [0, bh / 2 + 0.0006, 0], rot: [-90 * D2R, 0, 0], opacity: 0.85 });
    // 端のシール（ギザギザ）
    for (const sz of [-1, 1]) {
      for (let k = 0; k < 4; k++) c.add(noHull(mesh(box(bw * 0.9, 0.0008, 0.0022), M.filmPrint('#ffffff'), { pos: [0, bh / 2 - 0.002 - k * 0.0016, sz * (bd / 2 - 0.001)], cast: false })));
      c.add(noHull(mesh(tubeOf([[0, 0, sz * (bd / 2)], [bw * 0.4, bh * 0.2, sz * (bd / 2 + 0.006)], [-bw * 0.3, -bh * 0.1, sz * (bd / 2 + 0.009)]], 0.0012, 8, 4), M.filmPrint('#ffffff'), { cast: false })));
    }
    // 霜（白・weather）
    weather(c, { w: 0.014, h: 0.05, pos: [0, bh / 2 + 0.0008, 0], rot: [-90 * D2R, 0, 0], kind: 'chip', color: '#ffffff', opacity: 0.4, seed: (o.seed ?? 1) + i * 3, density: 1.5, spread: 0.001 });
    // 缺陷：包装の角が破けてアイスが見える／凍り過ぎの白化
    if (i === 1) {
      c.add(noHull(mesh(rbox(0.008, 0.0016, 0.01, 0.002, 2), M.vanillaIce, { pos: [bw * 0.3, bh * 0.5, -bd * 0.2], rot: [0, 0.2, 0], cast: false })));
      c.add(noHull(mesh(tor(0.0048, 0.0012, 4, 12), M.filmPrint('#f4f7f8'), { pos: [bw * 0.3, bh * 0.5 + 0.0006, -bd * 0.2], rot: [-90 * D2R, 0, 0], cast: false })));
    }
  }
  // トレイ上の溶けて再凍結した跡
  weather(tr, { w: 0.05, h: 0.03, pos: [-W * 0.2, 0.0086, D * 0.2], rot: [-90 * D2R, 0, 0], kind: 'chip', color: '#dfe8ec', opacity: 0.5, seed: (o.seed ?? 1) + 29, density: 1.6, spread: 0.001 });
  weather(P, { w: 0.02, h: 0.016, pos: [W * 0.4, 0.012, -D * 0.36], kind: 'dirt', color: '#8d8b80', opacity: 0.3, seed: (o.seed ?? 1) + 31, spread: 0.0014 });
}

const VARIANTS = { boxsnack: vBoxsnack, jelly: vJelly, pudding: vPudding, yogurt: vYogurt, cookie: vCookie, ice: vIce };
const VARIANT_LIST = Object.keys(VARIANTS);

function build(options = {}) {
  const variant = VARIANTS[options.variant] ? options.variant : 'boxsnack';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 53);
  const g = grp(`snack-shelf-pack:${variant}`);
  const inner = grp('body');
  const M = mats(options);
  M.vanillaIce = MAT.food({ color: '#f2ead8', spec: 0.5, specPower: 40, shadowAmt: 0.6, tint: options.tint });
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, M, rnd, { seed, pack: options.pack, tint: options.tint });
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

const P_SNACK = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANT_LIST,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_SNACK as P, build as b };
