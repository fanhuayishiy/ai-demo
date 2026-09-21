import { z as rand, g as grp, J as shape, K as extrude, m as mesh, a as sph, k as tubeOf, r as rbox, M as MAT, t as tor, o as lathe, c as cyl, U as circ, h as decal, T as TEX, w as weather, ac as Box3, b as box, Y as memo, N as makeCanvas, s as shade, Q as toTexture } from './index-B3pU02Rl.js';

//  assets/products/ice-cream.js —— 冷凍ショーケース用 アイス 6 variant
//  bar チョココーティング（割れ・ナッツ）・cup 紙カップ（蓋＋スプーン）・parfait パフェ（層／グラス）
//  mochi もちアイス（片栗粉）・twin ツイン（二本棒）・popsicle 果実アイス（中に棒の影が透える）
//  霜・凍結霜：weather(kind:'chip', 白) ＋ TEX.frost ＋ 氷晶（MAT.water 微細粒）
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'ice-cream',
  real: [0.065, 0.09, 0.065],
  origin: 'bottom-center',
  variants: ['bar', 'cup', 'parfait', 'mochi', 'popsicle', 'twin'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
const slab = (pts, a) => pts.map(([x, y]) => [x * Math.min(1, 1 - a * 0.24), y]);

/* -------------------------------- 局所テクチャ -------------------------------- */
/** カップ類の印刷（アイス社風バンド＋日本語） */
const cupPrint = (key, title, sub, bg, band) => memo(`ice:print:${title}`, () => {
  if (typeof document === 'undefined') return null;
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = band; g.fillRect(0, h * 0.56, w, h * 0.16);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(40 + i * 108, h * 0.22, 26 + rnd() * 12, 0, 6.284); g.fill(); }
  g.save(); g.translate(w / 2, h * 0.64); g.font = '800 58px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff'; g.fillText(title, 0, 0); g.restore();
  g.save(); g.translate(w / 2, h * 0.85); g.font = '700 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = shade(bg, 0.6); g.fillText(sub, 0, 0); g.restore();
  g.save(); g.translate(w / 2, h * 0.24); g.font = '800 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = band; g.fillText('ICE', 0, 0); g.restore();
  // 冷害・色褪せ・霜
  for (let i = 0; i < 260; i++) { g.globalAlpha = 0.05 + rnd() * 0.16; g.fillStyle = '#fff'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 4, 0, 6.284); g.fill(); }
  g.globalAlpha = 0.14; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 凍結霜（氷の結晶）：alpha 付き */
const frostTex = () => memo('ice:frost', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 340; i++) {
    const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 9;
    g.globalAlpha = 0.12 + rnd() * 0.4;
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.6 + rnd() * 1.2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * 6.284;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke();
    }
  }
  for (let i = 0; i < 900; i++) { g.globalAlpha = 0.1 + rnd() * 0.5; g.fillStyle = '#fff'; g.fillRect(rnd() * w, rnd() * h, 1.4, 1.4); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
function mats(tint) {
  const t = { tint };
  return {
    choco: MAT.food({ color: '#43261a', spec: 0.86, specPower: 110, specCut: 0.1, sheen: 0.22, shadowAmt: 0.62, steps: 4, ...t }),
    chocoIn: MAT.food({ color: '#2e1a12', spec: 0.4, shadowAmt: 0.95, ...t }),
    nut: MAT.food({ color: '#c99f5f', spec: 0.45, specPower: 30, shadowAmt: 0.7, ...t }),
    vanilla: MAT.food({ color: '#fbf2dc', spec: 0.6, specPower: 44, specCut: 0.16, sheen: 0.14, shadowAmt: 0.58, ...t }),
    milkIce: MAT.rice({ color: '#fdf8ee', spec: 0.62, specPower: 48, shadowAmt: 0.56, ...t }),
    matcha: MAT.food({ color: '#a8bf79', spec: 0.55, specPower: 36, shadowAmt: 0.62, ...t }),
    strawberry: MAT.food({ color: '#dc5566', spec: 0.72, specPower: 80, specCut: 0.12, ...t }),
    cherry: MAT.food({ color: '#b8283c', spec: 0.9, specPower: 150, specCut: 0.08, ...t }),
    cream: MAT.rice({ color: '#fffaf2', spec: 0.5, specPower: 30, specCut: 0.22, sheen: 0.14, shadowAmt: 0.52, ...t }),
    cake: MAT.bread({ color: '#e7c98d', spec: 0.2, shadowAmt: 0.74, ...t }),
    jelly: MAT.water({ color: '#c8375a', opacity: 0.62, spec: 1, specPower: 240 }),
    mochiSkin: MAT.food({ color: '#f4efe0', spec: 0.14, specPower: 12, specCut: 0.75, sheen: 0.02, shadowAmt: 0.66, steps: 3, ...t }),
    powder: MAT.paint('#fbfaf4', { spec: 0.02, sheen: 0.0, shadowAmt: 0.5, steps: 2, transparent: true, opacity: 0.7 }),
    paper: MAT.paper({ color: '#f6f1e4' }),
    wood: MAT.wood({ light: '#ecd6a4', dark: '#c6a570', repeat: 4, spec: 0.22, ...t }),
    stickShadow: MAT.wood({ light: '#d8bd88', dark: '#b08f5c', repeat: 3, spec: 0.2 }),
    plastic: MAT.hardPlastic('#e9eef0', { repeat: 6, ...t }),
    plasticWarm: MAT.hardPlastic('#f4e6cd', { repeat: 6, ...t }),
    glass: MAT.glassLite({ color: '#e7f4f7', opacity: 0.3, spec: 1, specPower: 240 }),
    tray: MAT.plastic('#dfe6e8', { repeat: 5, ...t }),
    frostPuff: MAT.paint('#ffffff', { spec: 0.1, sheen: 0.0, steps: 2, transparent: true, opacity: 0.55 }),
    fruitIce: MAT.water({ color: '#f0913e', opacity: 0.78, spec: 1, specPower: 250, scroll: [0.003, 0.005] }),
    melonIce: MAT.water({ color: '#8dc98a', opacity: 0.76, spec: 1, specPower: 250, scroll: [0.003, 0.005] }),
  };
}

/* -------------------------------- 共通小物 -------------------------------- */
function frostPatch(parent, { w = 0.02, h = 0.02, pos, rot = [0, 0, 0], seed = 1, opacity = 0.5, count = 1 }) {
  weather(parent, { w, h, pos, rot, kind: 'chip', color: '#ffffff', opacity, seed, density: 1.6, spread: 0.0008, count });
  decal(parent, { map: frostTex(), w: w * 1.2, h: h * 1.2, pos: [pos[0], pos[1], pos[2] + (rot[1] ? 0 : 0.0004)], rot, opacity: opacity * 0.85, order: 1 });
}
/** 凍結した霜の粒（結晶） */
function iceCrystals(parent, seed, n = 6, R = 0.026) {
  const rnd = rand(seed);
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.284, r = R * (0.3 + rnd() * 0.7);
    parent.add(noHull(mesh(sph(0.0009 + rnd() * 0.0013, 6, 5), M_dropMat(), {
      pos: [Math.cos(a) * r, 0.0008 + rnd() * 0.002, Math.sin(a) * r], scale: [1, 0.7, 1], cast: false, receive: false,
    })));
  }
}
const M_dropMat = () => MAT.water({ color: '#ffffff', opacity: 0.7, spec: 1, specPower: 300 });
/** 木製アイススティック（角部・繊維） */
function stick(parent, M, { w = 0.0055, t = 0.0035, h = 0.026, y, x = 0, z = 0, rot = [0, 0, 0] }) {
  const s = grp('stick');
  s.add(mesh(rbox(w, h, t, 0.0012, 2), M.wood, { name: 'stick-body' }));
  s.add(noHull(mesh(box(w * 0.8, 0.0006, t * 1.02), M.stickShadow, { pos: [0, h * 0.2, 0], cast: false })));
  s.position.set(x, y, z);
  s.rotation.set(rot[0], rot[1], rot[2]);
  parent.add(s);
  return s;
}

/* ================================ variants ================================ */

/** バー：チョココート + 割れ + ナッツ + 霜 */
function vBar(inner, M, rnd, o) {
  const B = grp('bar'); inner.add(B);
  const W = 0.042, H = 0.062, D = 0.021;
  const prof = slab([[-0.5, 0], [0.5, 0], [0.5, 0.5], [0.46, 0.82], [0.24, 0.98], [0, 1], [-0.24, 0.98], [-0.46, 0.82], [-0.5, 0.5], [-0.5, 0]], 0);
  const face = (hw, hh, d, cv) => {
    const sh = shape((s) => {
      prof.forEach(([px, py], i) => {
        const X = px * hw * 2 - (i ? 0 : 0), Y = py * hh;
        if (i === 0) s.moveTo(X, Y); else s.lineTo(X, Y);
      });
      s.closePath();
    });
    const g = extrude(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.0035, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -d / 2);
    g.computeVertexNormals();
    return g;
  };
  // バニラ本体（欠けた箇所から見える）
  B.add(mesh(face(W / 2, H, D), M.vanilla, { pos: [0, 0, 0], name: 'bar-core' }));
  // チョコ殻（一回り大きく、上面は別 disk）
  const shell = mesh(face(W / 2 + 0.0022, H + 0.0012, D + 0.0044), M.choco, { pos: [0, 0, 0], name: 'bar-shell' });
  B.add(shell);
  // チョコ割れ（表面を走る細い曲線 = 冷えて割れた筋）
  const crackPlane = [0.0112, -0.0112];
  for (const [i, z] of crackPlane.entries()) {
    for (let k = 0; k < 3; k++) {
      const y0 = H * (0.2 + k * 0.24 + rnd() * 0.06);
      const x0 = (rnd() - 0.5) * W * 0.6;
      const pts = [
        [x0 - W * 0.2, y0 - H * 0.05, z * 1.02], [x0 - W * 0.05, y0 + H * 0.02, z * 1.06],
        [x0 + W * 0.1, y0 - H * 0.01, z * 1.02], [x0 + W * 0.26, y0 + H * 0.06, z * 1.04],
      ];
      B.add(noHull(mesh(tubeOf(pts, 0.00055, 10, 4), M.chocoIn, { cast: false })));
    }
  }
  // 割れて落ちた欠片（アイス地むき出し）＝ 缺陷
  B.add(noHull(mesh(sph(0.0062, 9, 7), M.vanilla, { pos: [W * 0.28, H * 0.66, D * 0.5], scale: [1.15, 0.85, 0.55], cast: false })));
  B.add(noHull(mesh(sph(0.004, 8, 6), M.vanilla, { pos: [-W * 0.4, H * 0.16, -D * 0.52], scale: [1, 0.9, 0.6], cast: false })));
  // ナッツ（アーモンド）破片
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 6.284, zz = (rnd() > 0.5 ? 1 : -1) * D * 0.52, yy = H * (0.15 + rnd() * 0.8);
    B.add(noHull(mesh(sph(0.0018 + rnd() * 0.0016, 7, 5), M.nut, {
      pos: [Math.cos(a) * W * 0.44, yy, zz], rot: [rnd(), a, rnd()], scale: [1.6, 0.5, 1.1], cast: false,
    })));
  }
  // 串（スティック）
  stick(B, M, { y: H + 0.0085, h: 0.025, x: 0.0006, rot: [0, 0, 2 * D2R] });
  // 霜・凍結霜
  frostPatch(B, { w: 0.02, h: 0.026, pos: [-W * 0.2, H * 0.42, D * 0.55], seed: (o.seed ?? 1) + 3, opacity: 0.5 });
  frostPatch(B, { w: 0.016, h: 0.02, pos: [W * 0.16, H * 0.72, -D * 0.55], rot: [0, Math.PI, 0], seed: (o.seed ?? 1) + 5, opacity: 0.42 });
  iceCrystals(B, (o.seed ?? 1) + 7, 5, 0.019);
}

/** カップ：紙カップ＋蓋＋スプーン（蓋上の独立 Mesh） */
function vCup(inner, M, rnd, o) {
  const C = grp('cup'); inner.add(C);
  const rB = 0.0272, rT = 0.0292, hC = 0.056, lidH = 0.013;
  const print = cupPrint('cup', 'バニラ', 'CREAMY VANILLA · 150ml', '#f7f0df', '#5f9fc9');
  // 側面（印刷入り・上下に roll）
  const bodyMat = MAT.paper({ color: '#ffffff', map: print, uv: { repeat: [1, 1] } });
  C.add(mesh(lathe([[rB, 0], [rB + 0.0008, 0.0016], [rT - 0.0006, hC - 0.0028], [rT, hC - 0.0012], [rT + 0.0016, hC]], 26), bodyMat, { name: 'cup-body' }));
  // 底（二重の底＝厚みを見せる）
  C.add(mesh(cyl(rB + 0.0012, rB + 0.0012, 0.0022, 24), M.paper, { pos: [0, 0.0011, 0] }));
  // 内側（アイス面・空洞ではなく充填）
  C.add(noHull(mesh(circ(rT - 0.0015, 22), M.milkIce, { pos: [0, hC - 0.006, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  // 蓋：浅いカップ形（周缘の嵌合リブ）
  const lid = grp('lid'); C.add(lid);
  lid.add(mesh(lathe([[0, lidH], [rT * 0.86, lidH], [rT * 0.94, lidH - 0.004], [rT + 0.0022, lidH - 0.006], [rT + 0.0022, 0.004], [rT - 0.001, 0]], 24), M.plastic, { pos: [0, hC - 0.001, 0] }));
  lid.add(noHull(mesh(tor(rT + 0.0012, 0.0011, 6, 24), M.plasticWarm, { pos: [0, hC + 0.004, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  // 蓋上の商品名デカール
  decal(lid, {
    map: TEX.lightPanel({ text: '要冷 -18℃', bg: '#eaf3f8', fg: '#3c5d78', mode: 'sign' }),
    w: 0.032, h: 0.016, pos: [0, hC + lidH + 0.0006, 0], rot: [-90 * D2R, 0, 0], opacity: 0.92,
  });
  // スプーン（樹脂・蓋の上に斜めに载せ）
  const sp = grp('spoon'); C.add(sp);
  const sL = 0.05;
  sp.add(mesh(lathe([[0, 0], [0.0052, 0.0008], [0.0062, 0.0026], [0.0056, 0.005], [0, 0.0058]], 14), M.plastic, { pos: [0, 0, -sL * 0.42], rot: [0, 0, 0], scale: [0.82, 1.6, 1] }));
  sp.add(mesh(rbox(0.0068, 0.0016, sL * 0.62, 0.0008, 2), M.plastic, { pos: [0, 0.0012, sL * 0.16] }));
  sp.add(noHull(mesh(rbox(0.005, 0.0004, sL * 0.2, 0.0006, 2), M.plasticWarm, { pos: [0, 0.0021, sL * 0.34], cast: false })));
  sp.position.set(0.004, hC + lidH + 0.0016, 0.0);
  sp.rotation.set(0, 0.18, -6 * D2R);
  sp.rotateY(-24 * D2R);
  // 霜・結露水（蓋の縁）・缺陷：カップの潰れ
  frostPatch(C, { w: 0.024, h: 0.018, pos: [0, hC + lidH + 0.0016, 0], rot: [-90 * D2R, 0, 0], seed: (o.seed ?? 1) + 11, opacity: 0.4 });
  C.add(noHull(mesh(rbox(0.011, 0.014, 0.005, 0.0035, 2), MAT.paper({ color: '#eae3d1' }), { pos: [rT * 0.7, hC * 0.4, rT * 0.44], rot: [0, 0.55, 0.2], scale: [1, 1, 0.42], cast: false })));
  weather(C, { w: 0.013, h: 0.014, pos: [-rT * 0.55, hC * 0.28, rT * 0.6], rot: [0, -0.75, 0], kind: 'dirt', color: '#8b8f86', opacity: 0.28, seed: (o.seed ?? 1) + 13, spread: 0.0015 });
  iceCrystals(C, (o.seed ?? 1) + 17, 6, 0.028);
}

/** パフェ：透明カップ＋層（クリーム・苺・蛋糕・ジュレ）＋ホイップ＋さくらんぼ */
function vParfait(inner, M, rnd, o) {
  const P = grp('parfait'); inner.add(P);
  const rB = 0.0205, rT = 0.0288, hC = 0.058;
  // グラス（薄肉・DoubleSide で縁を見る）
  P.add(mesh(lathe([[rB, 0], [rB + 0.002, 0.0018], [rT - 0.002, hC * 0.86], [rT, hC - 0.001], [rT + 0.0014, hC], [rT - 0.001, hC - 0.0016], [rB - 0.0016, 0.0022], [rB - 0.0016, 0]], 26), M.glass, { name: 'parfait-glass' }));
  // 層（下から ジュレ→カスタード→蛋糕→苺→アイス→ホイップ）
  const layers = [
    [0.0035, 0.011, M.jelly], [0.0125, 0.010, M.vanilla], [0.0235, 0.0085, M.cake],
    [0.033, 0.008, M.strawberry], [0.0418, 0.011, M.milkIce],
  ];
  const rAt = (y) => rB + (rT - rB) * Math.min(1, y / (hC * 0.86)) - 0.0016;
  for (const [y, hh, mat] of layers) {
    P.add(noHull(mesh(cyl(rAt(y + hh), rAt(y), hh, 22), mat, { pos: [0, y + hh / 2, 0], cast: false })));
    P.add(noHull(mesh(circ(rAt(y + hh), 20), mat, { pos: [0, y + hh + 0.0004, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  }
  // ホイップの絞り（上）
  const swirl = [];
  const turns = 2.35, steps = 26;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * 6.284;
    const r = 0.0132 * (1 - t * 0.86);
    swirl.push([Math.cos(a) * r, hC * 0.9 + t * 0.0205, Math.sin(a) * r]);
  }
  P.add(noHull(mesh(tubeOf(swirl, 0.0052 * 1, 30, 9), M.cream, { cast: false })));
  // さくらんぼ＋軸
  P.add(mesh(sph(0.0056, 12, 10), M.cherry, { pos: [0.0055, hC * 0.9 + 0.0225, 0.0028], scale: [1, 0.92, 1] }));
  P.add(noHull(mesh(tubeOf([[0.0055, hC * 0.9 + 0.027, 0.0028], [0.0075, hC * 0.9 + 0.0325, -2e-3], [0.0032, hC * 0.9 + 0.0338, -68e-4]], 0.0006, 8, 4), MAT.food({ color: '#6d8a45', spec: 0.3 }), { cast: false })));
  // 苺のスライス（側面に張り付き層として読める）
  for (let i = 0; i < 2; i++) {
    const a = 0.6 + i * 2.6;
    P.add(noHull(mesh(sph(0.0062, 10, 8), M.strawberry, {
      pos: [Math.cos(a) * rAt(0.037) * 0.62, 0.0375, Math.sin(a) * rAt(0.037) * 0.62], scale: [1.2, 0.35, 1], rot: [0.2, a, 0.3], cast: false,
    })));
  }
  // スプーン（カップ外に寄り添う）
  stick(P, M, { y: hC * 0.52, h: 0.05, w: 0.006, t: 0.0016, x: rT * 0.66, z: 0.004, rot: [0, 0, 10 * D2R] });
  // 霜・缺陷：グラスのくもり・ホイップの崩れ
  frostPatch(P, { w: 0.024, h: 0.022, pos: [-rT * 0.55, hC * 0.36, rAt(hC * 0.36) * 0.94], seed: (o.seed ?? 1) + 23, opacity: 0.34 });
  P.add(noHull(mesh(sph(0.0042, 8, 6), M.cream, { pos: [-75e-4, hC * 0.94, 0.004], scale: [1.3, 0.5, 1.1], cast: false })));
  iceCrystals(P, (o.seed ?? 1) + 29, 5, 0.026);
}

/** もちアイス：片栗粉の白粉・角の丸み・トレイ */
function vMochi(inner, M, rnd, o) {
  const G = grp('mochi'); inner.add(G);
  const W = 0.046, H = 0.030, D = 0.042;
  // 餅皮（粉を打った matte な面）＋少し潰れた角
  const skin = rbox(W, H, D, 0.0105, 3);
  G.add(mesh(skin, M.mochiSkin, { pos: [0, H / 2 + 0.0045, 0], name: 'mochi-skin', scale: [1, 1, 1] }));
  // 天面のへこみ（指痕＝押跡）
  G.add(noHull(mesh(sph(0.008, 10, 8), M.mochiSkin, { pos: [W * 0.16, H + 0.0025, D * 0.1], scale: [1.2, 0.22, 1.05], cast: false })));
  // 包み紙の折り返し（底に敷いた紙）
  G.add(mesh(rbox(W * 1.16, 0.0022, D * 1.16, 0.0016, 2), MAT.paper({ color: '#f2eadd' }), { pos: [0, 0.0022, 0] }));
  G.add(noHull(mesh(rbox(W * 0.6, 0.0016, D * 1.28, 0.0012, 2), MAT.paper({ color: '#efe6d6' }), { pos: [0.004, 0.0035, 0], rot: [0, 0.1, 0], cast: false })));
  // 白粉（片栗・表面とトレイに散る）
  for (let i = 0; i < 26; i++) {
    rnd() * 6.284;
    G.add(noHull(mesh(sph(0.0011 + rnd() * 0.0016, 6, 5), M.powder, {
      pos: [(rnd() - 0.5) * W * 1.35, 0.0032 + rnd() * (H + 0.004), (rnd() - 0.5) * D * 1.3],
      scale: [1, 0.4, 1], cast: false, receive: false,
    })));
  }
  frostPatch(G, { w: 0.03, h: 0.018, pos: [-W * 0.2, H * 0.7, D * 0.53], seed: (o.seed ?? 1) + 31, opacity: 0.42 });
  // 缺陷：餅皮の切れ目（中身アイスが見える）
  const cut = noHull(mesh(sph(0.0062, 9, 7), M.matcha, { pos: [W * 0.32, H * 0.42, -D * 0.52], scale: [1.5, 0.9, 0.5], cast: false }));
  G.add(cut);
  G.add(noHull(mesh(tor(0.0058, 0.0012, 5, 14), M.mochiSkin, { pos: [W * 0.32, H * 0.42, -D * 0.5], rot: [0, 0, 0.2], scale: [1.5, 1, 0.5], cast: false })));
  iceCrystals(G, (o.seed ?? 1) + 37, 5, 0.028);
}

/** ツイン：二つに割れた棒アイス（棒 2 本・チョコ継ぎ目） */
function vTwin(inner, M, rnd, o) {
  const T = grp('twin'); inner.add(T);
  const W = 0.0265, H = 0.056, D = 0.019;
  const halves = [];
  for (const sx of [-1, 1]) {
    const half = grp(sx < 0 ? 'twin-L' : 'twin-R'); T.add(half);
    halves.push(half);
    const sh = shape((s) => {
      s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0);
      s.lineTo(W / 2 - 0.001, H * 0.6);
      s.quadraticCurveTo(W / 2 - 0.0035, H * 0.95, 0, H);
      s.quadraticCurveTo(-W / 2 + 0.0035, H * 0.95, -W / 2 + 0.001, H * 0.6);
      s.closePath();
    });
    const geo = extrude(sh, { depth: D, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 6 });
    geo.translate(0, 0, -D / 2);
    half.add(mesh(geo, sx < 0 ? M.vanilla : M.matcha, { name: 'twin-lobe' }));
    // チョコの一部（下半分だけコーティング）
    const ch = shape((s) => { s.moveTo(-W / 2 - 0.0016, 0); s.lineTo(W / 2 + 0.0016, 0); s.lineTo(W / 2 + 0.0016, H * 0.3); s.lineTo(-W / 2 - 0.0016, H * 0.3); s.closePath(); });
    const chg = extrude(ch, { depth: D + 0.005, bevelEnabled: true, bevelThickness: 0.0026, bevelSize: 0.0026, bevelSegments: 2, curveSegments: 4 });
    chg.translate(0, 0, -0.024 / 2);
    half.add(mesh(chg, M.choco, { name: 'twin-dip' }));
    // 継ぎ目のチョコ垂れ（内側）
    half.add(noHull(mesh(sph(0.004, 8, 6), M.choco, { pos: [-sx * W * 0.5, H * 0.3, D * 0.2], scale: [0.7, 1.6, 1.1], cast: false })));
    // 棒（2 本）
    stick(T, M, { y: H + 0.011, h: 0.022, x: sx * W * 0.42, z: 0, rot: [0, 0, sx * 3 * D2R] });
    // 割れ・ナッツ欠片
    half.add(noHull(mesh(tubeOf([[-W * 0.3, H * 0.32, D * 0.52], [0, H * 0.44, D * 0.55], [W * 0.28, H * 0.33, D * 0.52]], 0.0005, 8, 4), M.chocoIn, { cast: false })));
    for (let i = 0; i < 3; i++) half.add(noHull(mesh(sph(0.0016, 6, 5), M.nut, { pos: [(rnd() - 0.5) * W, H * (0.06 + rnd() * 0.2), D * 0.53], scale: [1.4, 0.5, 1], cast: false })));
  }
  // 左右を少し開いて「割った」状態に
  halves[0].position.x = -22e-4;
  halves[1].position.x = 0.0022;
  halves[1].rotation.y = -0.06;
  frostPatch(T, { w: 0.022, h: 0.024, pos: [0, H * 0.55, D * 0.56], seed: (o.seed ?? 1) + 41, opacity: 0.4 });
  iceCrystals(T, (o.seed ?? 1) + 43, 6, 0.024);
}

/** ポップ：果実アイス（半透明）＋中に沈んだ棒の影 */
function vPopsicle(inner, M, rnd, o) {
  const K = grp('popsicle'); inner.add(K);
  const W = 0.044, H = 0.062, D = 0.014;
  const sh = shape((s) => {
    s.moveTo(-W / 2, H * 0.26);
    s.quadraticCurveTo(-W / 2 - 0.002, H * 0.02, 0, 0.004);
    s.quadraticCurveTo(W / 2 + 0.002, H * 0.02, W / 2, H * 0.26);
    s.lineTo(W / 2 - 0.001, H * 0.82);
    s.quadraticCurveTo(W / 2 - 0.006, H, 0, H + 0.0015);
    s.quadraticCurveTo(-W / 2 + 0.006, H, -W / 2 + 0.001, H * 0.82);
    s.closePath();
  });
  const geo = extrude(sh, { depth: D, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.0035, bevelSegments: 2, curveSegments: 8 });
  geo.translate(0, 0, -D / 2);
  // 果肉層（内側：不透明な果実・スラリー）
  const pulp = extrude(shape((s) => {
    s.moveTo(-W / 2 + 0.004, H * 0.3);
    s.quadraticCurveTo(0, H * 0.1, W / 2 - 0.004, H * 0.3);
    s.lineTo(W / 2 - 0.006, H * 0.66); s.lineTo(-W / 2 + 0.006, H * 0.66);
    s.closePath();
  }), { depth: D * 0.5, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 6 });
  pulp.translate(0, 0, -D * 0.25);
  K.add(mesh(pulp, M.fruitIce, { name: 'pop-pulp' }));
  K.add(mesh(geo, M.melonIce, { name: 'pop-ice', renderOrder: 4 }));
  // 中に沈んだ棒（影として透える）
  K.add(noHull(mesh(rbox(W * 0.16, H * 0.72, D * 0.34, 0.0016, 2), M.stickShadow, { pos: [0.0004, H * 0.36, 0], rot: [0, 0, 1.4 * D2R], cast: false, receive: false })));
  // 気泡（凍らせるときに入った泡）
  for (let i = 0; i < 8; i++) {
    K.add(noHull(mesh(sph(0.0012 + rnd() * 0.0018, 7, 6), MAT.water({ color: '#ffffff', opacity: 0.5, spec: 1, specPower: 300 }), {
      pos: [(rnd() - 0.5) * W * 0.8, H * (0.12 + rnd() * 0.78), (rnd() - 0.5) * D * 0.7], cast: false, receive: false,
    })));
  }
  // 突出しの持ち手（実体の棒）
  stick(K, M, { y: H + 0.0135, h: 0.027, x: -5e-4, rot: [0, 0, 2.5 * D2R] });
  // 霜・缺陷：先欠け
  frostPatch(K, { w: 0.024, h: 0.026, pos: [-W * 0.14, H * 0.5, D * 0.54], seed: (o.seed ?? 1) + 47, opacity: 0.45 });
  K.add(noHull(mesh(sph(0.0052, 9, 7), MAT.water({ color: '#f4c48a', opacity: 0.62, spec: 1, specPower: 220 }), { pos: [W * 0.32, H * 0.94, 0], scale: [1, 0.7, 0.9], cast: false })));
  iceCrystals(K, (o.seed ?? 1) + 53, 5, 0.022);
}

const VARIANTS = { bar: vBar, cup: vCup, parfait: vParfait, mochi: vMochi, popsicle: vPopsicle, twin: vTwin };
const VARIANT_LIST = Object.keys(VARIANTS);

function seat(g, inner, scale) {
  inner.scale.setScalar(scale);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

function build(options = {}) {
  const variant = options.variant && VARIANTS[options.variant] ? options.variant : 'bar';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 71);
  const g = grp(`ice-cream:${variant}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, mats(options.tint), rnd, { seed, tint: options.tint });
  return seat(g, inner, options.scale ?? 1);
}

export { VARIANT_LIST, build, build as default, meta };
