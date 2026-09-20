import { g as grp, M as MAT, m as mesh, b as box, r as rbox, c as cyl, h as decal, T as TEX, w as weather, i as grill, H as plane, a as sph, o as lathe, d as coil, U as circ, n as range, k as tubeOf, l as catenary, q as finish, Y as memo, z as rand, N as makeCanvas, a6 as rr, Q as toTexture, P as PAL, O as jpText, a7 as blotches, a5 as speckle } from './index-B1SzF3Mh.js';
import { build as build$1 } from './coffee-cup-CiXwRF4n.js';

//  assets/interior/coffee-machine.js —— セルフカフェマシン＋カップ棚（一式・床置き）
//  本体（湯口・豆ホッパー・操作パネル LED・ドリップトレイ・排出口・スチーム・給水タンク）
//  カップスタック（coffee-cup 積み）・蓋・スリーブ・ストロー・シロップボトル
//  排水受けの茶ジミ／上部メニューボード（TEX.lightPanel 発光）／温風による天井の黄変
//  受け皿と落としたコーヒーの染み／給水ホースと電源コード
//  原点 = 床接触面の中心、+Y 上、顧客側 +Z。

const meta = {
  id: 'coffee-machine',
  real: [1.00, 2.94, 1.36],   // ホース・コード込み（本体は 0.82×1.96×0.66、天井黄変板が 2.83）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** ドリップトレイのコーヒー垢・茶ジミ */
const coffeeStainTex = (seed) => memo(`cf:stain|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 11);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) {
    const x = rnd() * w, y = rnd() * h, r = 10 + rnd() * 42;
    g.globalAlpha = 0.14 + rnd() * 0.3;
    g.strokeStyle = rnd() > 0.4 ? '#7a5228' : '#a3764a';
    g.lineWidth = 2 + rnd() * 6;
    g.beginPath(); g.arc(x, y, r, 0, 6.284); g.stroke();
    g.globalAlpha *= 0.5;
    g.fillStyle = '#8b6231';
    g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.5, rnd() * 3, 0, 6.284); g.fill();
  }
  // 垂れ跡
  for (let i = 0; i < 12; i++) {
    g.globalAlpha = 0.16 + rnd() * 0.3;
    g.fillStyle = '#6b4620';
    const x = rnd() * w, len = 20 + rnd() * 90;
    rr(g, x, rnd() * h * 0.5, 2 + rnd() * 4, len, 2); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 水アカ・カルシウム固着（給水タンク内面） */
const scaleTex = (seed) => memo(`cf:scale|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 23);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.35;
    g.fillStyle = rnd() > 0.3 ? '#f2efe4' : '#d8d2bd';
    const x = rnd() * w, y = h * (0.45 + rnd() * 0.55);
    g.beginPath(); g.ellipse(x, y, 1.5 + rnd() * 7, 2 + rnd() * 12, 0, 0, 6.284); g.fill();
  }
  for (let i = 0; i < 18; i++) {
    g.globalAlpha = 0.06 + rnd() * 0.14;
    g.strokeStyle = '#e8e4d6'; g.lineWidth = 1 + rnd() * 2;
    g.beginPath(); g.moveTo(rnd() * w, h); g.lineTo(rnd() * w, h * (0.4 + rnd() * 0.3)); g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** メニューボード（品名・価格・春限定） */
const menuTex = (seed) => memo(`cf:menu|${seed}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 31);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f7f0de'; g.fillRect(0, 0, w, h);
  g.fillStyle = PAL.awningGreen; g.fillRect(0, 0, w, h * 0.2);
  jpText(g, 'CAFE  春のブレンド', { x: w / 2, y: h * 0.1, size: 30, color: '#fdf7e8', weight: 800, spacing: 3 });
  const rows = [['ホットコーヒー', 'S 110 / M 130'], ['カプチーノ', '180'], ['カフェラテ', '200'], ['ココア', '170'], ['お湯（抹茶用）', '0']];
  rows.forEach((r2, i) => {
    const y = h * (0.31 + i * 0.14);
    g.globalAlpha = i % 2 ? 0.35 : 0.16; g.fillStyle = '#d9cfae'; g.fillRect(10, y - 14, w - 20, 28); g.globalAlpha = 1;
    jpText(g, r2[0], { x: 22, y, size: 21, color: '#4a4235', weight: 700, align: 'left' });
    jpText(g, r2[1], { x: w - 22, y, size: 21, color: '#7a5b2a', weight: 800, align: 'right' });
  });
  // 色褪せ・指跡・コーヒーの跳ね
  g.globalAlpha = 0.14; blotches(g, w, h, { count: 12, rad: [20, 90], colors: ['#8b7a55'], alpha: [0.1, 0.3], rnd });
  g.globalAlpha = 1;
  for (let i = 0; i < 14; i++) { g.globalAlpha = 0.2 + rnd() * 0.3; g.fillStyle = '#6b4a22'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3.4, 0, 6.284); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 天井の黄変（温風・ヤニ・埃） */
const ceilingYellowTex = (seed) => memo(`cf:ceil|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 41);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#efe9da'; g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w / 2, h * 0.45, 6, w / 2, h * 0.45, w * 0.52);
  gr.addColorStop(0, 'rgba(198,160,86,0.72)');
  gr.addColorStop(0.45, 'rgba(206,176,112,0.42)');
  gr.addColorStop(1, 'rgba(232,224,204,0.05)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  speckle(g, w, h, { count: 4200, r: [0.4, 2.2], colors: ['#a89569', '#fff8e4', '#7f7357'], alpha: [0.04, 0.22], rnd });
  // 埃の付着方向（温風の上昇筋）
  for (let i = 0; i < 30; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.14; g.strokeStyle = '#8d7c55'; g.lineWidth = 1 + rnd() * 3.5;
    const x = rnd() * w; g.beginPath(); g.moveTo(x, h); g.lineTo(x + (rnd() - 0.5) * 30, h * (0.1 + rnd() * 0.5)); g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 727;
  const rnd = rand(seed);
  const g = grp('coffee-machine');

  const steel = MAT.stainless({ worn: 0.55, repeat: 2 });
  const steelDk = MAT.metal('#9ea4a6', { worn: 0.7, spec: 0.5 });
  const chrome = MAT.chrome();
  const panelWhite = MAT.hardPlastic('#eae4d6', { worn: 0.7 });
  const panelInk = MAT.hardPlastic('#37342f', { worn: 0.55 });
  const plasticClear = MAT.glassLite({ color: '#e8f0f0', opacity: 0.3 });
  const tankGlass = MAT.glassLite({ color: '#dfeef0', opacity: 0.26 });
  const rubberMat = MAT.rubber('#3b3e42');
  const boardFace = MAT.paint('#ffffff', { graphic: true, map: menuTex(seed), spec: 0.16, specPower: 40, shadowAmt: 0.62, steps: 2 });
  const lampMat = MAT.lampShade({ color: '#fff6e0', emissive: '#ffe2ad', emissiveIntensity: 0.6 });
  const woodTrim = MAT.wood({ light: '#b98f5e', dark: '#7d5f3c', repeat: 2 });

  /* ---------- 1. 台下キャビネット ---------- */
  const base = grp('base-cabinet');
  g.add(base);
  base.add(mesh(box(0.76, 0.66, 0.60), panelWhite, { pos: [0, 0.37, 0], name: 'cab-body' }));
  base.add(mesh(box(0.72, 0.06, 0.56), MAT.paint('#4d4a45', { spec: 0.08, steps: 2 }), { pos: [0, 0.03, 0] }));      // 足折れ
  base.add(mesh(box(0.78, 0.02, 0.64), steel, { pos: [0, 0.73, 0], name: 'cab-top' }));                              // 天板（ステン）
  base.add(mesh(box(0.78, 0.012, 0.02), steelDk, { pos: [0, 0.746, 0.31] }));                                        // 前縁立ち上がり
  for (const sx of [-1, 1]) base.add(mesh(box(0.008, 0.6, 0.02), steelDk, { pos: [sx * 0.35, 0.74, 0.305], cast: false }));
  // 前扉（顧客側）：取手・蝶番・隙間、片側だけ浮き
  for (let i = 0; i < 2; i++) {
    const dx = -0.185 + i * 0.37;
    const door = grp('cab-door', { pos: [dx, 0.4, 0.304], rot: [0, i === 1 ? 0.018 : 0, 0] });
    door.add(mesh(rbox(0.355, 0.6, 0.016, 0.005, 2), panelWhite, {}));
    door.add(mesh(box(0.16, 0.014, 0.022), chrome, { pos: [0.14 - i * 0.28, 0.24, 0.016] }));
    door.add(mesh(box(0.34, 0.006, 0.006), MAT.plastic('#c8c2b2'), { pos: [0, -0.28, 0.01], cast: false }));
    for (let k = 0; k < 2; k++) door.add(noHull(mesh(cyl(0.006, 0.006, 0.018, 8), steelDk, { pos: [-0.17 + i * 0.34, 0.12 - k * 0.24, 0.008], rot: [0, 0, Math.PI / 2], cast: false })));
    decal(door, { map: TEX.lightPanel({ text: i ? '紙カップ' : '備品', bg: '#efe9d8', fg: '#5a5245' }), w: 0.1, h: 0.034, pos: [0, 0.14, 0.0095], opacity: 0.94 });
    weather(door, { w: 0.2, h: 0.14, pos: [0.05, -0.2, 0.01], kind: 'dirt', color: '#7b6b52', opacity: 0.3, seed: seed + i * 5, spread: 0.02 });
    base.add(door);
  }
  // 側面板の通気スリット・背面パネル
  for (const sx of [-1, 1]) grill(base, { w: 0.3, h: 0.16, nx: 2, ny: 6, bar: 0.008, mat: MAT.paint('#b7b1a4', { spec: 0.14 }), pos: [sx * 0.383, 0.5, 0], rot: [0, sx * 90 * D2R, 0] });
  base.add(mesh(box(0.74, 0.6, 0.012), MAT.paint('#b5afa1', { map: TEX.paper({ base: '#b5afa1' }).map, spec: 0.1 }), { pos: [0, 0.39, -0.303], name: 'cab-back' }));

  /* ---------- 2. マシン本体 ---------- */
  const mc = grp('machine', { pos: [0, 0.74, -0.07] });
  g.add(mc);
  // 柱状ボディ（厚み 300mm・前面は local z=+0.15）
  mc.add(mesh(rbox(0.42, 0.5, 0.30, 0.014, 2), steel, { pos: [0, 0.25, 0], name: 'machine-body' }));
  mc.add(mesh(box(0.44, 0.014, 0.32), steelDk, { pos: [0, 0.507, 0] }));                                // 天帽
  mc.add(mesh(box(0.42, 0.018, 0.02), MAT.paint('#2f3a3f', { spec: 0.2 }), { pos: [0, 0.014, 0.152] }));  // 前面下部の縁
  // 湯出しフード（前面から張り出す・下に湯口）
  mc.add(mesh(rbox(0.36, 0.062, 0.17, 0.008, 2), steel, { pos: [0, 0.245, 0.20], name: 'spout-hood' }));
  mc.add(mesh(box(0.36, 0.006, 0.02), steelDk, { pos: [0, 0.212, 0.285] }));
  // 操作パネル（傾いた黒い面・画面・LED ボタン）
  const op = grp('panel', { pos: [0, 0.375, 0.158], rot: [-14 * D2R, 0, 0] });
  op.add(mesh(rbox(0.38, 0.16, 0.018, 0.006, 2), panelInk, {}));
  op.add(noHull(mesh(plane(0.16, 0.1), MAT.screen({ color: '#cfe6ff', map: TEX.lightPanel({ text: 'M', bg: '#101619', fg: '#bff0ff', mode: 'led' }) }), { pos: [-0.095, 0.006, 0.011], cast: false, receive: false })));
  const ledCols = ['#8fe27f', '#f2b23c', '#e2554a', '#7fc9e2'];
  for (let i = 0; i < 4; i++) {
    op.add(noHull(mesh(box(0.046, 0.006, 0.012), MAT.paint('#22262a', { spec: 0.1 }), { pos: [0.02 + (i % 2) * 0.05, 0.032 - Math.floor(i / 2) * 0.048, 0.009], cast: false })));
    op.add(noHull(mesh(rbox(0.042, 0.03, 0.008, 0.004, 2), MAT.ledOn(ledCols[i], { color: ledCols[i] }), { pos: [0.02 + (i % 2) * 0.05, 0.032 - Math.floor(i / 2) * 0.048, 0.014], cast: false })));
  }
  for (let i = 0; i < 3; i++) op.add(noHull(mesh(box(0.05, 0.006, 0.004), MAT.paint('#c9c5b8', { spec: 0.12 }), { pos: [0.14, 0.045 - i * 0.035, 0.01], cast: false })));
  decal(op, { map: TEX.adStrip({ text: '春のブレンド', bg: '#e7dfc8', seed: seed + 3 }), w: 0.1, h: 0.024, pos: [-0.09, -0.055, 0.011], opacity: 0.9 });
  mc.add(op);
  // 湯口（2 本・フード下から下向き）
  const spouts = grp('spouts', { pos: [0, 0.21, 0.21] });
  for (let i = 0; i < 2; i++) {
    const sx = -0.05 + i * 0.1;
    spouts.add(mesh(cyl(0.011, 0.013, 0.056, 12), chrome, { pos: [sx, -0.026, 0] }));
    spouts.add(noHull(mesh(cyl(0.013, 0.006, 0.014, 12), MAT.metal('#8d9295', { worn: 0.5 }), { pos: [sx, -0.056, 0], cast: false })));
    spouts.add(noHull(mesh(sph(0.0038, 8, 6), MAT.water({ color: '#5a3a1c', opacity: 0.82, scroll: [0.001, 0.004] }), { pos: [sx, -0.066, 0], cast: false, receive: false })));
  }
  mc.add(spouts);
  // 豆ホッパー（透明・豆が見える・フタ）
  const hop = grp('hopper', { pos: [-0.1, 0.514, -0.03] });
  hop.add(mesh(lathe([[0, 0], [0.072, 0], [0.078, 0.012], [0.072, 0.09], [0.056, 0.116], [0.052, 0.12], [0, 0.12]], 20), plasticClear, { name: 'hopper-glass' }));
  hop.add(mesh(lathe([[0, 0], [0.056, 0.004], [0.05, 0.03], [0.02, 0.048], [0, 0.05]], 18), MAT.food({ color: '#5b3d24', spec: 0.42, specPower: 30, map: TEX.paper({ base: '#5b3d24' }).map }), { pos: [0, 0.004, 0] }));
  for (let i = 0; i < 13; i++) {
    const a = rnd() * 6.284, rr2 = 0.012 + rnd() * 0.038;
    hop.add(noHull(mesh(sph(0.0042, 7, 6), MAT.food({ color: i % 3 ? '#6b4527' : '#8a6136', spec: 0.5, specPower: 40 }), {
      pos: [Math.cos(a) * rr2, 0.03 + rnd() * 0.02, Math.sin(a) * rr2], scale: [1.5, 0.85, 1], rot: [rnd(), a, rnd()], cast: false,
    })));
  }
  hop.add(mesh(cyl(0.058, 0.056, 0.014, 18), MAT.hardPlastic('#3d4a52', { worn: 0.6 }), { pos: [0, 0.128, 0] }));
  hop.add(mesh(box(0.02, 0.008, 0.02), chrome, { pos: [0.05, 0.136, 0] }));
  mc.add(hop);
  // 排出口（カス出し扉・レバー・受け）
  const chute = grp('chute', { pos: [-0.145, 0.12, 0.152] });
  chute.add(mesh(rbox(0.11, 0.13, 0.02, 0.006, 2), panelInk, {}));
  chute.add(mesh(box(0.02, 0.05, 0.014), MAT.plastic('#5b656d', { spec: 0.3 }), { pos: [0.04, 0, 0.016] }));
  chute.add(mesh(box(0.1, 0.006, 0.05), steelDk, { pos: [0, -0.075, 0.03], rot: [0.1, 0, 0] }));
  decal(chute, { map: TEX.lightPanel({ text: 'かす', bg: '#e6e0ce', fg: '#5d564a' }), w: 0.05, h: 0.02, pos: [-0.015, 0.045, 0.012], opacity: 0.9 });
  mc.add(chute);
  // スチーム wand（コイルホース＋ノズル）
  const wand = grp('wand', { pos: [0.215, 0.19, 0.1] });
  wand.add(mesh(coil(0.026, 0.09, 4, 12, 0.005), chrome, { rot: [0, 0, Math.PI / 2] }));
  wand.add(mesh(cyl(0.007, 0.009, 0.11, 10), chrome, { pos: [0.01, -0.06, 0.02], rot: [24 * D2R, 0, -10 * D2R] }));
  wand.add(mesh(box(0.024, 0.03, 0.024), MAT.plastic('#39424a', { spec: 0.3 }), { pos: [0, -8e-3, 0.01] }));
  mc.add(wand);
  // ドリップトレイ（格子・受け皿・茶ジミ・引き手）＋その下の排水受け
  const dt = grp('drip-tray', { pos: [0, 0.045, 0.2] });
  mc.add(dt);
  dt.add(mesh(rbox(0.4, 0.02, 0.2, 0.006, 2), steel, {}));
  grill(dt, { w: 0.32, h: 0.13, nx: 2, ny: 8, bar: 0.008, mat: steelDk, pos: [0, 0.014, 0], rot: [-90 * D2R, 0, 0] });
  dt.add(noHull(mesh(circ(0.045, 18), MAT.water({ color: '#6b4a24', opacity: 0.5, scroll: [0.002, 0.003] }), { pos: [-0.06, 0.016, 0.01], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false })));
  decal(dt, { map: coffeeStainTex(seed), w: 0.38, h: 0.19, pos: [0, 0.0175, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.85, order: 1 });
  dt.add(mesh(box(0.4, 0.03, 0.016), MAT.plastic('#b7b1a3', { spec: 0.24 }), { pos: [0, 0.006, 0.1] }));   // 前立て（引き手）
  dt.add(mesh(box(0.1, 0.01, 0.012), chrome, { pos: [0, 0.006, 0.112] }));
  // トレイ下の排水受け（引き出して覗く内面・茶ジミ）
  const pan = grp('drain-pan', { pos: [0, -0.05, 0.22] });
  mc.add(pan);
  pan.add(mesh(rbox(0.36, 0.05, 0.18, 0.008, 2), MAT.plastic('#d9d3c4', { spec: 0.3 }), {}));
  pan.add(noHull(mesh(box(0.31, 0.004, 0.13), MAT.water({ color: '#7a5a30', opacity: 0.5, scroll: [0.001, 0.002] }), { pos: [0, 0.014, 0], cast: false, receive: false })));
  pan.add(mesh(box(0.34, 0.04, 0.008), MAT.plastic('#cfc9b9', { spec: 0.24 }), { pos: [0, 0, -0.086] }));   // 内面（奥壁）
  decal(pan, { map: coffeeStainTex(seed + 7), w: 0.3, h: 0.14, pos: [0.02, 0.0165, 0.01], rot: [-Math.PI / 2, 0, 0], opacity: 0.9, order: 2 });
  // 給水タンク（左後・水面色・カルシウム固着・目盛）
  const tank = grp('tank', { pos: [-0.3, 0.74, -0.02] });
  g.add(tank);
  tank.add(mesh(rbox(0.14, 0.3, 0.14, 0.01, 2), tankGlass, { pos: [0, 0.15, 0], name: 'water-tank' }));
  tank.add(mesh(box(0.124, 0.18, 0.124), MAT.water({ color: '#8fb6c2', opacity: 0.5, scroll: [0.004, 0.006] }), { pos: [0, 0.096, 0], cast: false, receive: false }));
  tank.add(mesh(box(0.146, 0.02, 0.146), MAT.hardPlastic('#414c52', { worn: 0.5 }), { pos: [0, 0.308, 0] }));
  decal(tank, { map: scaleTex(seed), w: 0.13, h: 0.28, pos: [0, 0.15, 0.0715], opacity: 0.75 });
  for (let i = 0; i < 4; i++) tank.add(noHull(mesh(box(0.02, 0.0016, 0.001), MAT.paint('#5f6a6e'), { pos: [-0.045, 0.07 + i * 0.05, 0.072], cast: false })));
  decal(tank, { map: TEX.lightPanel({ text: '水', bg: '#e7f0ea', fg: '#4f6a5e' }), w: 0.036, h: 0.028, pos: [0, 0.26, 0.0715], opacity: 0.9 });
  // マシンの経年：側面の指脂・縁の擦れ・ラベル日焼け
  weather(mc, { w: 0.3, h: 0.3, pos: [0.213, 0.24, 0], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#8b8577', opacity: 0.28, seed: seed + 5, spread: 0.03 });
  weather(mc, { w: 0.34, h: 0.06, pos: [0, 0.06, 0.155], kind: 'scratch', color: '#cfd4d6', opacity: 0.3, seed: seed + 6, spread: 0.01 });
  decal(mc, { map: TEX.wear({ kind: 'chip', color: '#a3937a', seed: seed + 8, density: 1.3 }), w: 0.1, h: 0.08, pos: [-0.213, 0.42, 0.05], rot: [0, -Math.PI / 2, 0], opacity: 0.5 });
  decal(mc, { map: TEX.lightPanel({ text: 'MODEL CF-2', bg: '#ded8c6', fg: '#5d564a' }), w: 0.12, h: 0.03, pos: [0.1, 0.47, 0.155], opacity: 0.85 });

  /* ---------- 3. カップ棚（ガントリー） ---------- */
  const gan = grp('cup-shelf');
  g.add(gan);
  for (const sx of [-1, 1]) {
    gan.add(mesh(box(0.028, 1.08, 0.028), steel, { pos: [sx * 0.33, 1.28, -0.26] }));
    for (let i = 0; i < 2; i++) gan.add(mesh(box(0.036, 0.01, 0.036), steelDk, { pos: [sx * 0.33, 0.86 + i * 0.42, -0.26], cast: false }));
    gan.add(mesh(cyl(0.008, 0.008, 0.02, 8), MAT.metal('#7d8285', { worn: 0.6 }), { pos: [sx * 0.33, 1.82, -0.26] }));
  }
  const shelfY = [1.45, 1.72];
  for (let i = 0; i < shelfY.length; i++) {
    const y = shelfY[i];
    const sag = i === 0 ? 0.006 : 0.004;                       // 棚板のたわみ
    const sh = grp('shelf', { pos: [0, y, -0.13], rot: [0, 0, 0] });
    sh.add(mesh(rbox(0.72, 0.018, 0.3, 0.005, 2), i === 0 ? woodTrim : steel, { rot: [0, 0, sag * 0.6] }));
    sh.add(mesh(box(0.72, 0.024, 0.012), steelDk, { pos: [0, 0.016, 0.15] }));   // 前縁バー
    sh.add(mesh(box(0.72, 0.008, 0.28), MAT.paint('#d8d2c2', { spec: 0.12, map: TEX.paper({ base: '#d8d2c2' }).map }), { pos: [0, -0.014, 0], cast: false }));  // 板下（内面）
    for (const sx of [-1, 1]) sh.add(mesh(box(0.012, 0.05, 0.3), steelDk, { pos: [sx * 0.356, 0.02, 0] }));
    gan.add(sh);
    weather(sh, { w: 0.4, h: 0.06, pos: [0.1, 0.011, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8a7b5e', opacity: 0.3, seed: seed + 12 + i, spread: 0.004 });
  }
  // カップスタック（coffee-cup の積み）／蓋・スリーブ・ストロー
  const stackSpec = [
    { x: -0.22, s: 'm', n: 3, lid: 'black' },
    { x: -0.04, s: 's', n: 2, lid: 'red' },
    { x: 0.16, s: 'm', n: 3, lid: 'blue' },
  ];
  stackSpec.forEach((sp, i) => {
    const cup = build$1({ seed: seed + 61 + i * 7, variant: sp.s, stack: sp.n, lid: sp.lid, sleeve: false, fill: false });
    cup.position.set(sp.x, shelfY[0] + 0.012, -0.12 + i * 0.02);
    cup.rotation.y = range(rnd, -0.2, 0.2);
    gan.add(cup);
    // 棚上の埃（カップ周り）
    weather(gan, { w: 0.07, h: 0.03, pos: [sp.x, shelfY[0] + 0.021, -0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#c8c0ae', opacity: 0.28, seed: seed + 71 + i, spread: 0.003 });
  });
  // 2 段目：蓋のスタック・スリーブ・ストロー・角砂糖
  const lidStack = grp('lids', { pos: [-0.24, shelfY[1] + 0.012, -0.13] });
  for (let i = 0; i < 6; i++) {
    lidStack.add(noHull(mesh(cyl(0.041, 0.039, 0.006, 16), MAT.plastic(['#2f3236', '#8c2f2a', '#2f4d70'][i % 3], { spec: 0.36, worn: 0.4 }), { pos: [range(rnd, -2e-3, 0.002), i * 0.0065, range(rnd, -2e-3, 0.002)], rot: [0, range(rnd, -0.3, 0.3), 0] })));
  }
  gan.add(lidStack);
  const slv = grp('sleeves', { pos: [-0.04, shelfY[1] + 0.012, -0.13] });
  for (let i = 0; i < 7; i++) {
    slv.add(noHull(mesh(cyl(0.036, 0.031, 0.014, 14, true), MAT.paper({ color: i % 2 ? '#c9a06a' : '#b98d59' }), { pos: [0, i * 0.0135, 0], rot: [0, range(rnd, -0.4, 0.4), 0] })));
  }
  gan.add(slv);
  const strawBox = grp('straws', { pos: [0.16, shelfY[1] + 0.012, -0.14] });
  strawBox.add(mesh(rbox(0.1, 0.09, 0.09, 0.006, 2), MAT.plastic('#e6e0d0', { spec: 0.28, transparent: true, opacity: 0.85 }), {}));
  strawBox.add(mesh(box(0.1, 0.006, 0.09), MAT.plastic('#c9c3b2'), { pos: [0, 0.048, 0], cast: false }));
  for (let i = 0; i < 9; i++) {
    const a = range(rnd, 0, 6.284), r0 = range(rnd, 0.002, 0.028);
    strawBox.add(noHull(mesh(cyl(0.0028, 0.0028, 0.16, 7), MAT.plastic(['#f2efe4', '#d9695e', '#f0e05a'][i % 3], { spec: 0.34 }), {
      pos: [Math.cos(a) * r0, 0.1, Math.sin(a) * r0], rot: [range(rnd, -0.12, 0.12), 0, range(rnd, -0.12, 0.12)], cast: false,
    })));
  }
  decal(strawBox, { map: TEX.lightPanel({ text: 'ストロー', bg: '#efe9d8', fg: '#5d564a' }), w: 0.08, h: 0.024, pos: [0, 0.01, 0.047], opacity: 0.9 });
  gan.add(strawBox);
  //  napkin / 角砂糖の小箱（棚の右端）
  gan.add(mesh(rbox(0.12, 0.07, 0.1, 0.006, 2), MAT.paper({ color: '#efe6d2' }), { pos: [0.28, shelfY[1] + 0.047, -0.12], rot: [0, 0.14, 0] }));
  for (let i = 0; i < 4; i++) gan.add(noHull(mesh(box(0.11, 0.004, 0.09), MAT.paper({ color: '#f7f2e4' }), { pos: [0.28, shelfY[1] + 0.082 + i * 0.0035, -0.12], rot: [0, 0.14 + range(rnd, -0.05, 0.05), 0], cast: false })));

  /* ---------- 4. メニューボード（発光） ---------- */
  const board = grp('menu-board', { pos: [0, 1.96, -0.24] });
  g.add(board);
  board.userData.breathe = { speed: 0.5, amount: 0.05, phase: (seed % 7) / 2 };
  board.add(mesh(rbox(0.8, 0.28, 0.06, 0.008, 2), MAT.hardPlastic('#e9e3d2', { worn: 0.65 }), { name: 'board-frame' }));
  board.add(noHull(mesh(plane(0.75, 0.235), boardFace, { pos: [0, 0.004, 0.032], cast: false, receive: false })));
  for (let i = 0; i < 3; i++) board.add(noHull(mesh(box(0.68, 0.014, 0.014), lampMat, { pos: [0, 0.08 - i * 0.08, -0.012], cast: false })));
  board.add(mesh(box(0.7, 0.008, 0.02), MAT.paint('#d5cdb8', { spec: 0.2 }), { pos: [0, -0.12, 0.01] }));
  for (const sx of [-1, 1]) board.add(mesh(box(0.02, 0.06, 0.05), steelDk, { pos: [sx * 0.34, -0.15, -0.02] }));
  weather(board, { w: 0.3, h: 0.1, pos: [0.2, 0.06, 0.034], kind: 'dirt', color: '#8f8567', opacity: 0.22, seed: seed + 14, spread: 0.01 });
  // 点灯ムラ（1 本だけ暗い）
  board.add(noHull(mesh(box(0.68, 0.014, 0.014), MAT.lampShade({ color: '#e8dcc4', emissive: '#c8a870', emissiveIntensity: 0.25 }), { pos: [0, -0.08, -0.012], cast: false })));

  /* ---------- 5. シロップボトル（3 本・ポンプ） ---------- */
  const syrCols = ['#c98a3a', '#8b5a3a', '#e2d6bc'];
  const syrupPos = [[0.31, -0.1, 0], [0.31, 0.03, 0.1], [0.31, 0.16, -0.08]];
  syrupPos.forEach(([sx, sz, tilt], i) => {
    const b = grp('syrup', { pos: [sx, 0.742, sz], rot: [0, range(rnd, -0.4, 0.4), tilt * 0.04] });
    b.add(mesh(lathe([[0, 0], [0.026, 0], [0.03, 0.008], [0.03, 0.13], [0.026, 0.152], [0.016, 0.162], [0.014, 0.19], [0, 0.19]], 16), MAT.glassLite({ color: '#e6eee6', opacity: 0.3 }), { name: 'syrup-body' }));
    b.add(mesh(lathe([[0, 0.004], [0.023, 0.004], [0.026, 0.02], [0.026, 0.115], [0, 0.118]], 14), MAT.paint(syrCols[i], { spec: 0.3, shadowAmt: 0.7 }), { pos: [0, 0.002, 0] }));
    b.add(mesh(cyl(0.014, 0.014, 0.016, 12), MAT.plastic('#3d444a', { spec: 0.3 }), { pos: [0, 0.198, 0] }));
    b.add(mesh(cyl(0.007, 0.007, 0.05, 10), MAT.plastic('#4a5158', { spec: 0.3 }), { pos: [0, 0.23, 0] }));
    b.add(mesh(box(0.048, 0.008, 0.012), MAT.plastic('#3d444a', { spec: 0.3 }), { pos: [0.024, 0.254, 0] }));
    b.add(noHull(mesh(tubeOf([[0, 0.02, 0], [0, 0.1, 0]], 0.0022, 8, 5), MAT.plastic('#c9c6ba'), { cast: false })));
    decal(b, { map: TEX.poster({ title: ['バニラ', 'キャラメル', 'アーモンド'][i], bg: '#f6efdd', accent: ['#e2a54a', '#a3703f', '#d8cbb0'][i], seed: seed + i * 9 }), w: 0.044, h: 0.07, pos: [0, 0.075, 0.0305], opacity: 0.98 });
    // 黏着の垂れ・ラベルの剥がれ
    weather(b, { w: 0.03, h: 0.06, pos: [0.02, 0.16, 0.022], kind: 'dirt', color: '#a5813f', opacity: 0.34, seed: seed + 18 + i, spread: 0.008 });
    g.add(b);
  });

  /* ---------- 6. 完成カップ（蓋・スリーブ・ストロー）と受け皿 ---------- */
  const tray = grp('saucer', { pos: [-0.24, 0.742, 0.22], rot: [0, -0.2, 0] });
  tray.add(mesh(rbox(0.16, 0.012, 0.16, 0.006, 2), steel, {}));
  tray.add(mesh(box(0.15, 0.004, 0.02), MAT.paper({ color: '#f4efe0' }), { pos: [-0.03, 0.008, 0.06], rot: [0, 0.3, 0], cast: false }));
  g.add(tray);
  const taken = build$1({ seed: seed + 91, variant: 'm', lid: 'black', sleeve: true, straw: true, fill: true });
  taken.position.set(-0.24, 0.754, 0.21);
  taken.rotation.y = 0.4;
  g.add(taken);
  // 飲みかけで置いたままの 2 つ目（蓋なし・液面あり）
  const spill = build$1({ seed: seed + 97, variant: 's', lid: false, sleeve: false, fill: true });
  spill.position.set(0.08, 0.742, 0.27);
  spill.rotation.y = -0.7;
  g.add(spill);

  /* ---------- 7. 温風による天井の黄変 ---------- */
  const ceilPatch = grp('ceiling-stain', { pos: [0, 2.83, -0.02] });
  g.add(ceilPatch);
  ceilPatch.add(mesh(box(0.62, 0.012, 0.62), MAT.paint('#ffffff', { map: ceilingYellowTex(seed), spec: 0.08, shadowAmt: 0.82, steps: 3 }), { name: 'ceiling-yellowed' }));
  ceilPatch.add(noHull(mesh(box(0.66, 0.006, 0.02), MAT.metal('#c8c2b2', { worn: 0.5 }), { pos: [0, -6e-3, 0.32], cast: false })));
  ceilPatch.add(noHull(mesh(box(0.66, 0.006, 0.02), MAT.metal('#c8c2b2', { worn: 0.5 }), { pos: [0, -6e-3, -0.32], cast: false })));
  for (const [sx, sz] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) {
    ceilPatch.add(noHull(mesh(cyl(0.007, 0.007, 0.104, 8), steelDk, { pos: [sx, 0.058, sz], cast: false })));
    ceilPatch.add(noHull(mesh(cyl(0.013, 0.013, 0.008, 8), MAT.metal('#b7b1a4', { worn: 0.6 }), { pos: [sx, 0.012, sz], cast: false })));
  }
  decal(ceilPatch, { map: coffeeStainTex(seed + 3), w: 0.4, h: 0.4, pos: [0.04, -75e-4, -0.02], rot: [Math.PI / 2, 0, 0], opacity: 0.5, order: 2 });

  /* ---------- 8. 落としたコーヒーの染み（床）・垂れ ---------- */
  decal(g, { map: coffeeStainTex(seed + 9), w: 0.42, h: 0.34, pos: [0.2, 0.0016, 0.44], rot: [-Math.PI / 2, 0, 0.3], opacity: 0.8, order: 1 });
  decal(g, { map: coffeeStainTex(seed + 13), w: 0.28, h: 0.24, pos: [-0.16, 0.0014, 0.5], rot: [-Math.PI / 2, 0, -0.6], opacity: 0.62, order: 2 });
  // ベース前面部の垂れ跡・足元の擦り傷
  weather(g, { w: 0.2, h: 0.3, pos: [0.16, 0.28, 0.306], kind: 'dirt', color: '#6b4a22', opacity: 0.26, seed: seed + 16, spread: 0.02 });
  weather(g, { w: 0.5, h: 0.1, pos: [0, 0.22, 0.308], kind: 'scratch', color: '#cfc9b8', opacity: 0.3, seed: seed + 17, spread: 0.02 });

  /* ---------- 9. 給水ホース・電源コード ---------- */
  g.add(noHull(mesh(tubeOf(catenary([-0.3, 0.5, -0.31], [-0.44, 0.02, -0.52], 0.08, 16), 0.007, 20, 6), MAT.plastic('#9fb2a8', { spec: 0.3, transparent: true, opacity: 0.9 }), {})));
  g.add(noHull(mesh(tubeOf(catenary([0.3, 0.022, -0.31], [0.5, 0.022, -0.62], 0.014, 18), 0.006, 22, 6), rubberMat, {})));
  g.add(noHull(mesh(rbox(0.07, 0.024, 0.05, 0.006, 2), MAT.plastic('#e9e5d8', { worn: 0.6 }), { pos: [0.5, 0.014, -0.64] })));
  g.add(noHull(mesh(box(0.012, 0.006, 0.012), MAT.ledOn('#e2554a'), { pos: [0.53, 0.028, -0.64], cast: false })));
  // 棚上のホコリ・機械天面の湯垢
  weather(g, { w: 0.3, h: 0.08, pos: [-0.05, 1.247, -0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#cdc6b2', opacity: 0.34, seed: seed + 19, spread: 0.004 });
  weather(g, { w: 0.4, h: 0.1, pos: [0.1, 1.462, -0.13], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b8ae96', opacity: 0.24, seed: seed + 20, spread: 0.004 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
