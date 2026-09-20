import { g as grp, M as MAT, m as mesh, b as box, r as rbox, c as cyl, w as weather, D as DoubleSide, T as TEX, k as tubeOf, i as grill, l as catenary, h as decal, n as range, d as coil, p as shadowBlob, o as lathe, t as tor, P as PAL, H as plane, q as finish, Y as memo, z as rand, N as makeCanvas, a5 as speckle, a6 as rr, O as jpText, a7 as blotches, Q as toTexture } from './index-B1SzF3Mh.js';
import { b as build$1 } from './drink-can-ubD76HwX.js';
import { b as build$2 } from './milk-carton-C8XrnCXe.js';

//  assets/interior/backroom-shelving.js —— 後場棚・ストックヤード一式
//  重量ラック（ボルト・サビ・棚板のたわみ・背面筋交い）／段ボール箱（潰れ・テープ・印字）
//  プラコンテナ（積み・中身の覗き）／台車（キャスター・傷）／清掃用具（モップ・バケツ・雑巾・洗剤）
//  壁のピクトグラム／床のガイドライン／蜘蛛の巣と埃／蛍光灯の点滅（userData.breathe + flicker）
//  原点 = 床接触面の中心、+Y 上、通路側（顾客側）を +Z とする。

const meta = {
  id: 'backroom-shelving',
  real: [2.72, 2.24, 1.76],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** 段ボール：段目・印刷・水染み */
const cartonTex = (seed, mark) => memo(`br:carton|${mark}|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + mark.length * 31);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#c9a874'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, { count: 5200, r: [0.4, 1.8], colors: ['#e0c292', '#a8834c', '#d9b880'], alpha: [0.04, 0.2], rnd });
  // 段目のうねり
  g.globalAlpha = 0.12; g.strokeStyle = '#8a6a3c'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.globalAlpha = 1;
  // 印字（品名・矢印・扱い注意）
  g.fillStyle = 'rgba(52,44,32,0.85)';
  rr(g, w * 0.08, h * 0.12, w * 0.5, h * 0.1, 3); g.fill();
  jpText(g, mark, { x: w * 0.1, y: h * 0.17, size: 22, color: '#f4ecd8', weight: 800, align: 'left', spacing: 2 });
  jpText(g, '上・右下', { x: w * 0.1, y: h * 0.34, size: 18, color: '#3d3527', weight: 700, align: 'left' });
  //  arrows
  g.strokeStyle = '#3d3527'; g.lineWidth = 4; g.globalAlpha = 0.8;
  for (let i = 0; i < 2; i++) {
    const x = w * (0.66 + i * 0.16);
    g.beginPath(); g.moveTo(x, h * 0.42); g.lineTo(x, h * 0.24); g.moveTo(x - 8, h * 0.3); g.lineTo(x, h * 0.22); g.lineTo(x + 8, h * 0.3); g.stroke();
  }
  g.globalAlpha = 1;
  // 水染み・へこみ
  blotches(g, w, h, { count: 8, rad: [22, 62], colors: ['#8d6f43', '#b5945f'], alpha: [0.08, 0.22], rnd });
  return toTexture(cv, { repeat: 1 });
});

/** 蜘蛛の巣（隅に張る） */
const webTex = () => memo('br:web', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(246,244,236,0.75)'; g.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {   // 放射
    const a = (i / 9) * Math.PI * 0.62;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * w, Math.sin(a) * w * 0.9); g.stroke();
  }
  for (let k = 1; k <= 6; k++) {  // 輪
    const r = (k / 6) * w * 0.92;
    g.beginPath();
    for (let i = 0; i <= 9; i++) {
      const a = (i / 9) * Math.PI * 0.62;
      const rr2 = r * (0.82 + 0.18 * Math.cos(i * 2.1));
      const x = Math.cos(a) * rr2, y = Math.sin(a) * rr2 * 0.94;
      g[i ? 'lineTo' : 'moveTo'](x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 0.4; g.fillStyle = '#8f8a7c';
  for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  return toTexture(cv, { repeat: 1 });
});

/** 床のピクトグラム（後場表示） */
const pictoTex = (kind, seed) => memo(`br:picto|${kind}|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f5efdd'; g.fillRect(0, 0, w, h);
  g.lineWidth = 14; g.strokeStyle = kind === 'warn' ? '#e0a52c' : '#c5312c';
  g.strokeRect(10, 10, w - 20, h - 20);
  if (kind === 'warn') {
    g.fillStyle = '#e0a52c';
    g.beginPath(); g.moveTo(w / 2, 54); g.lineTo(w - 52, h - 74); g.lineTo(52, h - 74); g.closePath(); g.fill();
    jpText(g, '!', { x: w / 2, y: h * 0.58, size: 62, color: '#3a3126', weight: 900 });
    jpText(g, 'すべり注意', { x: w / 2, y: h - 40, size: 26, color: '#3a3126', weight: 800 });
  } else if (kind === 'heavy') {
    g.fillStyle = '#c5312c'; rr(g, 60, 70, 136, 96, 8); g.fill();
    jpText(g, '10kg', { x: w / 2, y: h * 0.42, size: 34, color: '#fff4ea', weight: 900 });
    jpText(g, '重量物 二人で', { x: w / 2, y: h - 40, size: 24, color: '#3a3126', weight: 800 });
  } else {
    g.fillStyle = '#2f6b52'; g.fillRect(40, 46, 176, 120);
    jpText(g, '立入', { x: w / 2, y: h * 0.28, size: 42, color: '#f2f7ef', weight: 900 });
    jpText(g, '注意', { x: w / 2, y: h * 0.48, size: 42, color: '#f2f7ef', weight: 900 });
    jpText(g, '店員以外', { x: w / 2, y: h - 40, size: 24, color: '#3a3126', weight: 700 });
  }
  g.globalAlpha = 0.18;
  for (let i = 0; i < 60; i++) { g.fillStyle = '#7a7365'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 3); }
  return toTexture(cv, { repeat: 1 });
});

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 751;
  const rnd = rand(seed);
  const L = Math.max(1.0, options.len ?? 2.2);      // ラック幅（X）
  const D = 0.5;                                     // 棚奥行き
  const H = 2.0;                                     // 棚高
  const g = grp('backroom-shelving');

  const orange = MAT.metalPaint('#b06a35', { worn: 0.85, repeat: 2 });     // 重量ラックの橙（退色・錆）
  const orangeDk = MAT.metal('#8b5a30', { worn: 0.9, spec: 0.4 });
  const steelDk = MAT.metal('#8f9598', { worn: 0.7, spec: 0.5 });
  const galv = MAT.galvanized({ worn: 0.75, spec: 0.35 });
  const carton = (mark, s) => MAT.paint('#ffffff', { graphic: true, map: cartonTex(seed + mark.length, mark), spec: 0.06, sheen: 0.0, shadowAmt: 0.86, steps: 2, uv: { repeat: [s ?? 1, s ?? 1] } });
  const crateBlue = MAT.plastic('#4b6f8f', { worn: 0.7, spec: 0.3 });
  const crateGray = MAT.plastic('#8b958f', { worn: 0.8, spec: 0.26 });
  const rubberMat = MAT.rubber('#3a3d40');

  /* ---------- 1. 重量ラック ---------- */
  const rack = grp('rack');
  g.add(rack);
  const bays = 2, ux = [];
  for (let i = 0; i <= bays; i++) ux.push(-L / 2 + (i * L) / bays);
  const deckY = [0.16, 0.62, 1.12, 1.62];
  for (const x of ux) {
    for (const z of [-1, 1]) {
      const col = grp('upright', { pos: [x, 0, z * (D / 2 - 0.028)] });
      col.add(mesh(box(0.05, H, 0.046), orange, { pos: [0, H / 2, 0] }));
      // 打ち抜き穴（段ピッチ）
      for (let i = 0; i < 12; i++) col.add(noHull(mesh(box(0.052, 0.012, 0.012), MAT.paint('#5e4a34', { spec: 0.08 }), { pos: [0, 0.14 + i * 0.16, 0], cast: false })));
      // 脚部ベースプレート・アンカーボルト・サビ
      col.add(mesh(rbox(0.1, 0.012, 0.08, 0.004, 2), orangeDk, { pos: [0, 0.006, 0] }));
      for (const [bx, bz] of [[-0.036, -0.026], [0.036, -0.026], [-0.036, 0.026], [0.036, 0.026]]) {
        col.add(noHull(mesh(cyl(0.007, 0.007, 0.016, 8), steelDk, { pos: [bx, 0.02, bz], cast: false })));
        col.add(noHull(mesh(cyl(0.011, 0.011, 0.005, 6), MAT.metal('#6f7477', { worn: 0.6 }), { pos: [bx, 0.029, bz], cast: false })));
      }
      weather(col, { w: 0.09, h: 0.2, pos: [0.026, 0.14, 0.024], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + Math.round(x * 100 + z * 7), density: 1.6, spread: 0.03 });
      rack.add(col);
    }
    // 柱間の横補剛（上部）
    rack.add(noHull(mesh(box(0.02, 0.02, D - 0.04), orangeDk, { pos: [x, H - 0.06, 0], cast: false })));
  }
  // 背面の筋交い（X ブレース）と背板（＝ピクトグラムの下地）
  rack.add(mesh(box(L, H - 0.1, 0.01), MAT.paint('#a89e8c', { map: TEX.paper({ base: '#a89e8c' }).map, spec: 0.08, shadowAmt: 0.94, side: DoubleSide }), { pos: [0, H / 2 + 0.02, -D / 2 + 0.01], name: 'rack-backboard' }));
  for (let i = 0; i < bays; i++) {
    const cx0 = ux[i], cx1 = ux[i + 1];
    for (const dir of [1, -1]) {
      const a = dir > 0 ? [cx0, 0.24, -D / 2 + 0.026] : [cx0, H - 0.12, -D / 2 + 0.026];
      const b = dir > 0 ? [cx1, H - 0.12, -D / 2 + 0.026] : [cx1, 0.24, -D / 2 + 0.026];
      rack.add(noHull(mesh(tubeOf([a, b], 0.008, 12, 6), orangeDk, {})));
    }
  }
  // 段（4 枚・たわみ付き・ワイヤーメッシュ）
  deckY.forEach((y, di) => {
    const deck = grp(`deck-${di}`, { pos: [0, y, 0] });
    for (let b = 0; b < bays; b++) {
      const cxm = (ux[b] + ux[b + 1]) / 2, bw = ux[b + 1] - ux[b] - 0.05;
      const sag = (di < 2 ? 0.01 : 0.016) * (b === 0 ? 1 : -0.7);      // 載荷側のたわみ
      const seg = 3;
      for (let s = 0; s < seg; s++) {
        const t0 = s / seg, t1 = (s + 1) / seg;
        const y0 = -sag * Math.sin(Math.PI * t0), y1 = -sag * Math.sin(Math.PI * t1);
        const x0 = cxm - bw / 2 + bw * t0, x1 = cxm - bw / 2 + bw * t1;
        deck.add(mesh(box(x1 - x0 + 0.002, 0.016, D - 0.05), galv, { pos: [(x0 + x1) / 2, (y0 + y1) / 2 + sag * 0.12, 0], rot: [0, 0, Math.atan2(y1 - y0, x1 - x0)] }));
      }
      // ワイヤーメッシュ（荷物を載せる格子）＋前縁の価格札レール
      grill(deck, { w: bw - 0.04, h: D - 0.1, nx: 7, ny: 4, bar: 0.005, mat: MAT.metal('#a4a9ab', { worn: 0.8 }), pos: [cxm, 0.012, 0], rot: [-90 * D2R, 0, 0] });
      deck.add(mesh(box(bw, 0.026, 0.012), MAT.metal('#9aa0a2', { worn: 0.7 }), { pos: [cxm, 0.02, D / 2 - 0.032] }));
      for (const sx of [-1, 1]) deck.add(noHull(mesh(box(0.03, 0.05, 0.012), orangeDk, { pos: [cxm + sx * (bw / 2 - 0.01), -0.02, D / 2 - 0.05], cast: false })));
    }
    weather(deck, { w: L * 0.5, h: 0.14, pos: [0.2, 0.012, 0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8b8474', opacity: 0.34, seed: seed + 40 + di, spread: 0.004 });
    rack.add(deck);
  });
  // 蛍光灯（最上段の裏・点滅する 1 灯）
  const flu = grp('fluorescent', { pos: [0, H + 0.06, 0.02] });
  flu.userData.breathe = { speed: 1.9, amount: 0.22, phase: 0.6, flicker: 0.62 };
  flu.add(mesh(rbox(L - 0.3, 0.05, 0.07, 0.008, 2), MAT.hardPlastic('#dedacc', { worn: 0.7 }), {}));
  flu.add(noHull(mesh(box(L - 0.36, 0.026, 0.04), MAT.lampShade({ color: '#f4fbff', emissive: '#dff0ff', emissiveIntensity: 1.05 }), { pos: [0, -0.022, 0], cast: false, receive: false })));
  for (const sx of [-1, 1]) flu.add(noHull(mesh(box(0.03, 0.05, 0.02), steelDk, { pos: [sx * (L / 2 - 0.14), 0.03, 0], cast: false })));
  flu.add(noHull(mesh(tubeOf(catenary([0.1, 0.02, -0.04], [L / 2 - 0.2, 0.16, -0.2], 0.06, 10), 0.0035, 12, 5), rubberMat, {})));
  rack.add(flu);

  /* ---------- 2. 段ボール箱（潰れ・テープ・印字） ---------- */
  const boxes = [
    { x: -L / 2 + 0.34, y: deckY[0] + 0.01, w: 0.44, h: 0.3, d: 0.34, mark: '紙コップ', ry: 0.05, crush: 0.02 },
    { x: -L / 2 + 0.82, y: deckY[0] + 0.01, w: 0.36, h: 0.24, d: 0.3, mark: 'おしぼり', ry: -0.1, crush: 0.0 },
    { x: -L / 2 + 0.36, y: deckY[0] + 0.31, w: 0.4, h: 0.26, d: 0.32, mark: '冰 4kg', ry: 0.02, crush: 0.03 },
    { x: L / 2 - 0.42, y: deckY[0] + 0.01, w: 0.5, h: 0.36, d: 0.36, mark: 'トイレット', ry: -0.04, crush: 0.0 },
    { x: L / 2 - 0.42, y: deckY[0] + 0.37, w: 0.34, h: 0.22, d: 0.28, mark: 'レジ袋', ry: 0.14, crush: 0.015 },
    { x: -L / 2 + 0.4, y: deckY[1] + 0.012, w: 0.46, h: 0.34, d: 0.34, mark: '弁当容器', ry: -0.03, crush: 0.0 },
    { x: L / 2 - 0.5, y: deckY[1] + 0.012, w: 0.42, h: 0.4, d: 0.32, mark: '洗剤', ry: 0.07, crush: 0.022 },
    { x: -0.1, y: deckY[1] + 0.012, w: 0.38, h: 0.28, d: 0.3, mark: 'ストロー', ry: 0.3, crush: 0.0 },
  ];
  boxes.forEach((b, i) => {
    const bx = grp('carton', { pos: [b.x, b.y + b.h / 2, 0.02], rot: [0, b.ry, 0] });
    const mat = carton(b.mark, i % 2 ? 1 : 0.8);
    bx.add(mesh(box(b.w, b.h - b.crush, b.d), mat, { name: 'carton-body' }));
    // 天面（折り返し蓋・隙間）と側面の段目
    bx.add(noHull(mesh(box(b.w - 0.006, 0.006, b.d - 0.006), MAT.paint('#b5925f', { spec: 0.06, map: cartonTex(seed + 3, '段'), uv: { repeat: [2, 2] } }), { pos: [0, b.h / 2 - b.crush / 2 + 0.002, 0], cast: false })));
    // テープ（横幅・シワ・端の浮き）
    decal(bx, { map: TEX.lightPanel({ text: '', bg: '#d8c193', fg: '#d8c193' }), w: b.w * 0.98, h: 0.05, pos: [0, b.h / 2 - b.crush / 2 + 0.006, 0], rot: [-Math.PI / 2, 0, range(rnd, -0.03, 0.03)], opacity: 0.85, order: 1 });
    decal(bx, { map: TEX.adStrip({ text: b.mark, bg: '#efe4cb', seed: seed + i }), w: b.w * 0.5, h: 0.05, pos: [0, b.h / 2 + 0.002, 0], rot: [-Math.PI / 2, 0, 0.02], opacity: 0.9, order: 2 });
    // 潰れ・水染み・角擦り
    weather(bx, { w: b.w * 0.6, h: b.h * 0.5, pos: [0, -b.h * 0.1, b.d / 2 + 0.002], kind: 'dirt', color: '#7a5c33', opacity: 0.3, seed: seed + 51 + i, spread: 0.012 });
    if (b.crush > 0) {
      bx.add(noHull(mesh(rbox(b.w * 0.7, b.crush, b.d * 0.6, b.crush * 0.4, 2), mat, { pos: [b.w * 0.1, b.h / 2 - b.crush * 0.6, 0], rot: [0, 0, -0.06], cast: false })));
    }
    if (i % 3 === 0) {   // 開いた箱（蓋が外側へ反る・中身が暗い）
      bx.add(noHull(mesh(box(b.w * 0.5, 0.006, b.d * 0.5), mat, { pos: [-b.w * 0.42, b.h * 0.34, 0], rot: [0, 0, 1.15], cast: false })));
      bx.add(noHull(mesh(box(b.w - 0.02, 0.02, b.d - 0.02), MAT.paint('#4b4034', { spec: 0.04, shadowAmt: 1 }), { pos: [0, b.h / 2 - b.crush - 0.01, 0], cast: false, receive: false })));
    }
    rack.add(bx);
  });

  /* ---------- 3. プラコンテナ（積み・中身の覗き） ---------- */
  const crates = grp('crates');
  g.add(crates);
  const crateSpec = [
    { x: L / 2 - 0.36, y: deckY[2] + 0.014, m: crateBlue, lid: false },
    { x: L / 2 - 0.4, y: deckY[2] + 0.24, m: crateGray, lid: true },
    { x: -L / 2 + 0.42, y: deckY[3] + 0.014, m: crateBlue, lid: false },
  ];
  crateSpec.forEach((c, ci) => {
    const cw = 0.46, ch = 0.21, cd = 0.31;
    const cr = grp('crate', { pos: [c.x, c.y + ch / 2, 0], rot: [0, range(rnd, -0.08, 0.08), 0] });
    cr.add(mesh(box(cw, 0.012, cd), c.m, { pos: [0, -ch / 2 + 0.006, 0] }));                          // 底
    for (const [w2, d2, x2, z2] of [[cw, 0.012, 0, cd / 2], [cw, 0.012, 0, -cd / 2], [0.012, cd, -cw / 2, 0], [0.012, cd, cw / 2, 0]]) {
      cr.add(mesh(box(w2, ch, d2), c.m, { pos: [x2, 0, z2] }));                                       // 4 壁
      cr.add(noHull(mesh(box(w2 * 0.9 + 0.004, ch - 0.05, d2 * 0.9 + 0.004), MAT.paint('#3a4b58', { spec: 0.16, shadowAmt: 0.95 }), { pos: [x2 * 0.94, 0, z2 * 0.94], cast: false, receive: false })));
    }
    // 補強リブ・手持ち穴
    for (let i = 0; i < 4; i++) cr.add(noHull(mesh(box(0.012, ch - 0.03, 0.012), c.m, { pos: [-cw / 2 + 0.06 + i * (cw / 3.4), 0, cd / 2 + 0.004], cast: false })));
    for (const sx of [-1, 1]) cr.add(noHull(mesh(box(0.1, 0.045, 0.016), MAT.paint('#2f3b44', { spec: 0.12 }), { pos: [sx * cw * 0.28, ch * 0.24, cd / 2 + 0.004], cast: false })));
    cr.add(noHull(mesh(box(cw + 0.012, 0.014, cd + 0.012), c.m, { pos: [0, ch / 2 - 0.005, 0], cast: false })));   // 縁
    if (c.lid) {
      cr.add(mesh(rbox(cw + 0.02, 0.014, cd + 0.02, 0.005, 2), MAT.plastic('#9aa39c', { worn: 0.7 }), { pos: [0.02, ch / 2 + 0.012, 0], rot: [0, 0, 0.03] }));
    } else {
      // 中身が覗く（缶・牛乳パック・布巾）
      for (let i = 0; i < 5; i++) {
        const can = build$1({ seed: seed + 131 + ci * 17 + i * 5, variant: ['coffee', 'cola', 'tea', 'juice', 'energy'][i % 5] });
        can.position.set(-cw / 2 + 0.06 + i * 0.085, -ch / 2 + 0.012, range(rnd, -0.07, 0.07));
        can.rotation.set(range(rnd, -0.14, 0.14), range(rnd, 0, 3), Math.PI / 2 * (i === 4 ? 1 : 0));
        cr.add(can);
      }
      const mk = build$2({ seed: seed + 157 + ci * 9, variant: ci ? 'soy' : 'milk1000' });
      mk.position.set(cw / 2 - 0.08, -ch / 2 + 0.012, -0.04);
      mk.rotation.set(0, 0.4, 0);
      cr.add(mk);
      cr.add(noHull(mesh(rbox(0.16, 0.05, 0.12, 0.014, 2), MAT.fabric({ color: '#c9c2b0', repeat: 8 }), { pos: [-0.05, -ch / 2 + 0.05, 0.06], rot: [0, 0.3, 0] })));
    }
    weather(cr, { w: cw * 0.6, h: 0.1, pos: [0.05, -ch * 0.3, cd / 2 + 0.008], kind: 'dirt', color: '#6b6456', opacity: 0.3, seed: seed + 61 + ci, spread: 0.01 });
    crates.add(cr);
  });
  // 床置きコンテナ（積みすぎた 1 列・一番上は傾く）
  for (let i = 0; i < 3; i++) {
    const st = grp('stack-crate', { pos: [-0.16 + i * 0.03, 0.001 + i * 0.19, D / 2 + 0.28], rot: [0, 0.2 + i * 0.14, i === 2 ? 0.05 : 0] });
    const cw = 0.5, ch = 0.18, cd = 0.36;
    st.add(mesh(box(cw, ch, cd), i === 1 ? crateGray : crateBlue, { pos: [0, ch / 2, 0] }));
    st.add(noHull(mesh(box(cw - 0.06, ch - 0.06, 0.006), MAT.paint('#33424d', { spec: 0.14, shadowAmt: 0.95 }), { pos: [0, ch / 2, cd / 2 - 0.002], cast: false, receive: false })));
    st.add(noHull(mesh(box(cw + 0.014, 0.012, cd + 0.014), MAT.plastic('#6f7d86', { worn: 0.7 }), { pos: [0, ch - 0.004, 0], cast: false })));
    crates.add(st);
  }
  crates.add(noHull(mesh(box(0.44, 0.01, 0.3), crateGray, { pos: [-0.16, 0.575, D / 2 + 0.28], rot: [0.05, 0.24, 0.03] })));   // 別々の蓋

  /* ---------- 4. 台車（キャスター・傷） ---------- */
  const trolley = grp('trolley', { pos: [L / 2 - 0.1, 0, D / 2 + 0.34], rot: [0, -0.42, 0] });
  g.add(trolley);
  const plateY = 0.11;
  trolley.add(mesh(rbox(0.44, 0.02, 0.62, 0.006, 2), MAT.metal('#a9aeaf', { worn: 0.85, spec: 0.5 }), { pos: [0, plateY, 0], name: 'trolley-plate' }));
  trolley.add(noHull(mesh(box(0.4, 0.004, 0.56), MAT.paint('#8f9598', { map: TEX.metal({ base: '#8f9598', worn: 0.8, repeat: 3 }).map, spec: 0.4 }), { pos: [0, plateY + 0.012, 0], cast: false, receive: true })));
  // ハンドル（曲げパイプ）＋グリップ
  trolley.add(noHull(mesh(tubeOf([[0.2, plateY, -0.28], [0.21, 0.6, -0.3], [0.2, 0.92, -0.28]], 0.012, 14, 7), MAT.metal('#b7bcbe', { worn: 0.7 }), {})));
  trolley.add(noHull(mesh(tubeOf([[-0.2, plateY, -0.28], [-0.21, 0.6, -0.3], [-0.2, 0.92, -0.28]], 0.012, 14, 7), MAT.metal('#b7bcbe', { worn: 0.7 }), {})));
  trolley.add(noHull(mesh(tubeOf([[-0.2, 0.92, -0.28], [0, 0.96, -0.28], [0.2, 0.92, -0.28]], 0.012, 10, 7), MAT.metal('#b7bcbe', { worn: 0.7 }), {})));
  trolley.add(noHull(mesh(cyl(0.016, 0.016, 0.28, 10), MAT.rubber('#4a4f46', { spec: 0.06 }), { pos: [0, 0.93, -0.28], rot: [0, 0, Math.PI / 2] })));
  trolley.add(noHull(mesh(box(0.36, 0.02, 0.02), MAT.metal('#a9aeaf', { worn: 0.8 }), { pos: [0, 0.44, -0.3] })));   // 補剛
  // キャスター 4 個（金具・車輪・ホイルキャップ）
  for (const [wx, wz] of [[-0.17, 0.24], [0.17, 0.24], [-0.17, -0.24], [0.17, -0.24]]) {
    const caster = grp('caster', { pos: [wx, 0.075, wz] });
    caster.add(mesh(box(0.05, 0.02, 0.05), MAT.metal('#8f9598', { worn: 0.8 }), { pos: [0, 0.03, 0] }));
    caster.add(noHull(mesh(tubeOf([[0, 0.03, 0], [0, 0.005, wz > 0 ? 0.012 : -0.012]], 0.008, 8, 6), MAT.metal('#9aa0a2', { worn: 0.75 }), {})));
    caster.add(mesh(cyl(0.036, 0.036, 0.022, 14), MAT.rubber('#2f3236', { spec: 0.08 }), { pos: [0, -8e-3, 0], rot: [0, 0, Math.PI / 2] }));
    caster.add(noHull(mesh(cyl(0.012, 0.012, 0.026, 10), MAT.metal('#c9cdce', { worn: 0.5, spec: 0.6 }), { pos: [0, -8e-3, 0], rot: [0, 0, Math.PI / 2], cast: false })));
    if (wx === 0.17 && wz > 0) caster.add(noHull(mesh(box(0.03, 0.012, 0.05), MAT.plastic('#c0392b', { spec: 0.3 }), { pos: [0.02, 0.028, 0.02], rot: [0, 0, -0.3], cast: false })));  // ストッパー
    trolley.add(caster);
  }
  // 台車の傷・落書き・紐
  weather(trolley, { w: 0.3, h: 0.06, pos: [0.02, plateY + 0.015, 0.08], rot: [-Math.PI / 2, 0, 0.2], kind: 'scratch', color: '#d6dadd', opacity: 0.4, seed: seed + 71, spread: 0.004 });
  decal(trolley, { map: TEX.wear({ kind: 'chip', color: '#7a5f3c', seed: seed + 72, density: 1.4 }), w: 0.2, h: 0.12, pos: [-0.12, plateY + 0.014, -0.16], rot: [-Math.PI / 2, 0, 0], opacity: 0.4 });
  trolley.add(noHull(mesh(coil(0.02, 0.14, 6, 10, 0.004), MAT.fabric({ color: '#b9a06a', repeat: 6 }), { pos: [0.2, 0.5, -0.28] })));
  // 台車に載せた段ボール（1 個）
  const load = grp('trolley-load', { pos: [0, plateY + 0.14, 0.02], rot: [0, 0.16, 0] });
  load.add(mesh(box(0.36, 0.26, 0.3), carton('氷 袋', 2), { name: 'load-carton' }));
  decal(load, { map: TEX.lightPanel({ text: '', bg: '#d8c193', fg: '#d8c193' }), w: 0.36, h: 0.045, pos: [0, 0.131, 0], rot: [-Math.PI / 2, 0, 0.03], opacity: 0.8, order: 1 });
  weather(load, { w: 0.24, h: 0.16, pos: [0.03, -0.04, 0.152], kind: 'dirt', color: '#7a5c33', opacity: 0.34, seed: seed + 73, spread: 0.01 });
  trolley.add(load);
  shadowBlob(trolley, { r: 0.3, pos: [0, 0, 0.02], opacity: 0.2 });

  /* ---------- 5. 清掃用具（モップ・バケツ・雑巾・洗剤） ---------- */
  const clean = grp('cleaning', { pos: [-L / 2 - 0.02, 0, D / 2 + 0.22], rot: [0, 0.5, 0] });
  g.add(clean);
  // モップ（立て掛け）
  const mop = grp('mop', { pos: [0, 0.03, 0], rot: [0, 0, 0.16] });
  mop.add(mesh(cyl(0.012, 0.012, 1.28, 10), MAT.wood({ light: '#c9ab7c', dark: '#8f7346', repeat: 3 }), { pos: [0, 0.66, 0] }));
  mop.add(mesh(cyl(0.03, 0.024, 0.06, 12), MAT.metal('#a9aeaf', { worn: 0.7 }), { pos: [0, 0.05, 0] }));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 6.284;
    mop.add(noHull(mesh(tubeOf([[Math.cos(a) * 0.02, 0.06, Math.sin(a) * 0.02], [Math.cos(a) * 0.06, 0.02, Math.sin(a) * 0.06], [Math.cos(a) * 0.07, -5e-3, Math.sin(a) * 0.07]], 0.006, 8, 5), MAT.fabric({ color: i % 3 ? '#d8d2c0' : '#b8ae9a', repeat: 10 }), {})));
  }
  clean.add(mop);
  // バケツ（水・内面・取手）
  const buck = grp('bucket', { pos: [0.24, 0, 0.06] });
  buck.add(mesh(lathe([[0, 0], [0.11, 0], [0.118, 0.008], [0.14, 0.24], [0.148, 0.26], [0.144, 0.272], [0.128, 0.25], [0.108, 0.014], [0, 0.008]], 20), MAT.plastic('#3f6f5e', { worn: 0.75, spec: 0.34 }), { name: 'bucket' }));
  buck.add(noHull(mesh(cyl(0.126, 0.1, 0.09, 18), MAT.water({ color: '#7f9fa6', opacity: 0.6, scroll: [0.003, 0.002] }), { pos: [0, 0.05, 0], cast: false, receive: false })));
  buck.add(noHull(mesh(tor(0.14, 0.005, 5, 20), MAT.plastic('#345c4e', { spec: 0.4 }), { pos: [0, 0.268, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));
  buck.add(noHull(mesh(tubeOf(catenary([-0.142, 0.24, 0], [0.142, 0.24, 0], -0.11, 10), 0.004, 12, 5), steelDk, {})));
  decal(buck, { map: TEX.wear({ kind: 'scratch', color: '#cfd6d0', seed: seed + 77, density: 1.4 }), w: 0.2, h: 0.18, pos: [0, 0.13, 0.132], opacity: 0.4 });
  clean.add(buck);
  // 雑巾・スプレーボトル・ブラシ
  clean.add(mesh(rbox(0.22, 0.035, 0.16, 0.014, 2), MAT.fabric({ color: '#c9c2ae', repeat: 9 }), { pos: [0.1, 0.018, 0.24], rot: [0, 0.5, 0.04] }));
  const spray = grp('spray', { pos: [0.4, 0, 0.16] });
  spray.add(mesh(lathe([[0, 0], [0.032, 0], [0.036, 0.01], [0.036, 0.16], [0.03, 0.18], [0.022, 0.196], [0, 0.2]], 14), MAT.plastic('#e6e2d2', { worn: 0.6, transparent: true, opacity: 0.9 }), {}));
  spray.add(mesh(lathe([[0, 0.006], [0.028, 0.006], [0.031, 0.05], [0.031, 0.13], [0, 0.134]], 12), MAT.paint('#7fa855', { spec: 0.3, shadowAmt: 0.7 }), {}));
  spray.add(mesh(box(0.05, 0.03, 0.04), MAT.plastic('#4b6f8f', { spec: 0.34 }), { pos: [0.012, 0.208, 0] }));
  spray.add(noHull(mesh(cyl(0.006, 0.006, 0.03, 8), MAT.plastic('#4b6f8f'), { pos: [0.04, 0.212, 0], rot: [0, 0, Math.PI / 2] })));
  decal(spray, { map: TEX.poster({ title: '床用洗剤', bg: '#eef3ea', accent: '#5aa469', seed: seed + 79 }), w: 0.055, h: 0.08, pos: [0, 0.09, 0.037], opacity: 0.95 });
  clean.add(spray);
  // ブラシ（こすり洗い・毛先摩耗）
  const brush = grp('brush', { pos: [0.24, 0.058, 0.3], rot: [0, 0.8, 0] });
  brush.add(mesh(rbox(0.2, 0.03, 0.07, 0.008, 2), MAT.wood({ light: '#b98f5e', dark: '#7d5f3c', repeat: 2 }), {}));
  for (let i = 0; i < 16; i++) {
    brush.add(noHull(mesh(cyl(0.0025, 0.002, 0.05, 5), MAT.fabric({ color: i % 4 === 0 ? '#8a8272' : '#d8d2be', repeat: 12 }), { pos: [-0.085 + i * 0.0114, -0.028, 0], rot: [0.1 * (i % 3 - 1), 0, 0.08 * (i % 2 ? 1 : -1)], cast: false })));
  }
  clean.add(brush);
  shadowBlob(clean, { r: 0.28, pos: [0.2, 0.001, 0.2], opacity: 0.18 });

  /* ---------- 6. 壁のピクトグラム・表示 ---------- */
  const picts = [
    { k: 'warn', x: -0.62, y: 1.34, w: 0.26, h: 0.26 },
    { k: 'heavy', x: -0.28, y: 1.34, w: 0.26, h: 0.26 },
    { k: 'noentry', x: 0.06, y: 1.34, w: 0.26, h: 0.26 },
  ];
  picts.forEach((p, i) => {
    decal(rack, { map: pictoTex(p.k, seed + i), w: p.w, h: p.h, pos: [p.x, p.y, -D / 2 + 0.004], rot: [0, Math.PI, 0], opacity: 0.96, order: i });
  });
  // 柱に巻いた表示（通路側）・在庫ラベル
  decal(rack, { map: TEX.signboard({ text: '後場 立入注意', bg: '#f0c353', fg: '#4a3a12', size: 90 }), w: 0.4, h: 0.1, pos: [L / 2 - 0.28, 1.78, D / 2 - 0.055], opacity: 0.96 });
  for (let i = 0; i < 3; i++) {
    decal(rack, { map: TEX.lightPanel({ text: ['A-', 'B-', 'C-'][i] + (i * 3 + 7), bg: '#f4efe0', fg: '#4a4a44' }), w: 0.09, h: 0.05, pos: [ux[i] + 0.028, 0.94, D / 2 - 0.03], opacity: 0.95, order: i });
  }

  /* ---------- 7. 床のガイドライン ---------- */
  const line = grp('floor-line');
  g.add(line);
  for (let i = 0; i < 3; i++) {
    line.add(noHull(mesh(box(L + 0.4, 0.0028, 0.055), MAT.marking(PAL.markingYellow, { spec: 0.2, steps: 2 }), { pos: [0, 0.0014 + i * 0.0002, -D / 2 - 0.1 - i * 0.002], rot: [0, 0, 0], cast: false, receive: false })));
  }
  line.add(noHull(mesh(box(0.055, 0.0028, 0.7), MAT.marking(PAL.markingYellow, { spec: 0.2, steps: 2 }), { pos: [L / 2 + 0.2, 0.0016, -0.1], cast: false, receive: false })));
  line.add(noHull(mesh(box(0.055, 0.0028, 0.7), MAT.marking('#7f97a8', { spec: 0.2, steps: 2 }), { pos: [-L / 2 - 0.16, 0.0016, -0.06], cast: false, receive: false })));
  // ガイドラインの剥がれ・磨耗・めくれ
  weather(line, { w: L * 0.6, h: 0.08, pos: [-0.3, 0.0022, -D / 2 - 0.1], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#e8e2d3', opacity: 0.5, seed: seed + 81, density: 1.5, spread: 0.003 });
  line.add(noHull(mesh(box(0.1, 0.003, 0.055), MAT.paint('#e0b64a', { spec: 0.2 }), { pos: [0.5, 0.004, -D / 2 - 0.1], rot: [0, 0, 0.14], cast: false })));
  decal(line, { map: TEX.wear({ kind: 'dirt', color: '#6b6459', seed: seed + 82, density: 1.4 }), w: 1.1, h: 0.3, pos: [0.2, 0.0024, -D / 2 - 0.34], rot: [-Math.PI / 2, 0, 0], opacity: 0.34, order: 1 });
  g.add(line);

  /* ---------- 8. 蜘蛛の巣と埃（上部隅・天井側） ---------- */
  const webs = grp('cobwebs');
  g.add(webs);
  const webMat = MAT.decal({ map: webTex(), opacity: 0.72, side: DoubleSide, order: 3 });
  [
    { pos: [-L / 2 + 0.06, H - 0.06, D / 2 - 0.04], rot: [0, 0.9, -0.7], s: 0.26 },
    { pos: [L / 2 - 0.04, H + 0.02, -D / 2 + 0.04], rot: [0, -2.1, -0.5], s: 0.3 },
    { pos: [0.1, H + 0.11, 0.12], rot: [Math.PI / 2 - 0.25, 0.3, 0], s: 0.34 },
  ].forEach((wv, i) => {
    const wm = noHull(mesh(plane(wv.s, wv.s), webMat, { pos: wv.pos, rot: wv.rot, cast: false, receive: false }));
    wm.renderOrder = 8 + i;
    webs.add(wm);
  });
  weather(g, { w: L * 0.8, h: 0.2, pos: [0, H + 0.09, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b8ae96', opacity: 0.4, seed: seed + 83, density: 1.4, spread: 0.006 });
  weather(g, { w: 0.4, h: 0.4, pos: [-L / 2 - 0.02, 0.4, -D / 2 + 0.02], rot: [0, -Math.PI / 2, 0], kind: 'moss', color: '#7c9a5e', opacity: 0.2, seed: seed + 84, spread: 0.03 });
  // 棚板天の埃・手形
  weather(g, { w: L * 0.4, h: 0.1, pos: [-0.3, deckY[3] + 0.014, 0.1], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#c9c2ae', opacity: 0.36, seed: seed + 85, spread: 0.004 });

  /* ---------- 9. 床の小物（伝票・テープ切れ・落水） ---------- */
  for (let i = 0; i < 3; i++) {
    g.add(noHull(mesh(box(0.07 + i * 0.02, 0.0012, 0.05), MAT.paper({ color: '#f2ecdc' }), {
      pos: [range(rnd, -0.9, 0.9), 0.0008 + i * 0.0006, D / 2 + range(rnd, 0.1, 0.5)], rot: [0, range(rnd, 0, 3), 0], cast: false,
    })));
  }
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#5f5a50', seed: seed + 87, density: 1.3 }), w: 0.5, h: 0.34, pos: [0.3, 0.0016, D / 2 + 0.42], rot: [-Math.PI / 2, 0, 0.4], opacity: 0.3, order: 2 });
  g.add(noHull(mesh(box(0.16, 0.004, 0.03), MAT.plastic('#d8c193', { spec: 0.2 }), { pos: [-0.62, 0.002, D / 2 + 0.36], rot: [0, 0.7, 0], cast: false })));   // 剥がしたテープ

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
