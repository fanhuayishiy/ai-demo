import { g as grp, M as MAT, P as PAL, m as mesh, r as rbox, b as box, w as weather, h as decal, T as TEX, D as DoubleSide, p as shadowBlob, n as range, q as finish, H as plane, Y as memo, N as makeCanvas, a6 as rr, O as jpText, Q as toTexture, z as rand, a7 as blotches } from './index-BxWjt-aN.js';

//  assets/interior/floor-guidance.js —— 床ガイドライン・矢印・注意ステッカー（店内動線表示一式）
//  誘導テープ（摩耗・めくれ・汚れ）・矢印ステッカー・レジ前待機ライン・「のりかえ」表示
//  傘立て周辺の注意表示・消火器設置表示・春の床ポスター・段差注意の黄帯・糊残り
//  すべて薄板／decal（polygonOffset あり）で z-fighting 不可。原点 = 動線の junction、床面 y=0。

const meta = {
  id: 'floor-guidance',
  real: [5.9, 0.06, 3.4],     // 動線全体の footprint（原点 = 入口真前の junction）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** 矢印ステッカー（方向・語ラベル付き） */
const arrowTex = (label, tone) => memo(`fg:arrow|${label}|${tone}`, () => {
  const cv = makeCanvas(256, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  const col = tone === 'blue' ? 'rgba(79,163,209,0.95)' : tone === 'green' ? 'rgba(63,122,82,0.95)' : 'rgba(240,195,83,0.96)';
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(200, h / 2); g.lineTo(140, h * 0.16); g.lineTo(140, h * 0.36); g.lineTo(20, h * 0.36);
  g.lineTo(20, h * 0.64); g.lineTo(140, h * 0.64); g.lineTo(140, h * 0.84); g.closePath(); g.fill();
  if (label) {
    g.fillStyle = 'rgba(255,252,244,0.94)';
    rr(g, 24, h * 0.4, 108, h * 0.2, 4); g.fill();
    jpText(g, label, { x: 78, y: h * 0.5, size: 17, color: '#3b4650', weight: 800 });
  }
  // 摩耗（踏まれて欠ける）
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.12 + rnd() * 0.4;
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 22, 3 + rnd() * 10, rnd() * 3, 0, 6.284); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 注意ステッカー（ぬれています／足もと・三角ピクト） */
const cautionTex = (main, sub) => memo(`fg:caution|${main}|${sub}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(247,240,220,0.96)'; g.fillRect(0, 0, w, h);
  g.lineWidth = 12; g.strokeStyle = 'rgba(224,165,44,0.98)'; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = 'rgba(224,165,44,0.98)';
  g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w - 46, 150); g.lineTo(46, 150); g.closePath(); g.fill();
  // 転倒ピクト（人型を単純化）
  g.strokeStyle = 'rgba(58,49,38,0.95)'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.arc(w * 0.5, 78, 12, 0, 6.284); g.stroke();
  g.beginPath(); g.moveTo(w * 0.44, 96); g.lineTo(w * 0.58, 118); g.stroke();
  g.beginPath(); g.moveTo(w * 0.36, 128); g.lineTo(w * 0.62, 122); g.stroke();
  jpText(g, main, { x: w / 2, y: h * 0.72, size: 30, color: '#3a3126', weight: 900, spacing: 2 });
  jpText(g, sub, { x: w / 2, y: h * 0.87, size: 20, color: '#5d564a', weight: 700 });
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 30; i++) { g.globalAlpha = 0.1 + rnd() * 0.35; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 14, 3 + rnd() * 12, rnd() * 3, 0, 6.284); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return toTexture(cv, { repeat: 1 });
});

/** 消火器設置表示（床） */
const extTex = () => memo('fg:ext', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(197,49,44,0.95)'; g.lineWidth = 10;
  g.setLineDash([18, 12]); g.strokeRect(24, 24, w - 48, h - 48); g.setLineDash([]);
  g.fillStyle = 'rgba(197,49,44,0.95)';
  rr(g, w * 0.42, h * 0.28, w * 0.16, h * 0.36, 8); g.fill();
  g.fillRect(w * 0.46, h * 0.2, w * 0.08, h * 0.1);
  g.fillStyle = 'rgba(247,240,225,0.95)';
  jpText(g, '消火器', { x: w / 2, y: h * 0.82, size: 30, color: 'rgba(197,49,44,1)', weight: 900, spacing: 3 });
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 24; i++) { g.globalAlpha = 0.12 + rnd() * 0.3; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 16, 3 + rnd() * 12, 0, 0, 6.284); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return toTexture(cv, { repeat: 1 });
});

/** 春の床ポスター（大きく・丸まり） */
const floorPosterTex = (seed) => memo(`fg:poster|${seed}`, () => {
  const cv = makeCanvas(512, 384);
  if (!cv) return null;
  cv.rnd = rand(seed + 3);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f8f1de'; g.fillRect(0, 0, w, h);
  g.fillStyle = PAL.storeBand; g.fillRect(0, 0, w, 54);
  jpText(g, '春の味覚フェア', { x: w / 2, y: 28, size: 32, color: '#f7fbff', weight: 800, spacing: 8 });
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.2 + i * 0.3), cy = h * 0.52;
    g.fillStyle = ['#f6d8a8', '#e8b58a', '#cfe0b8'][i];
    g.beginPath(); g.arc(cx, cy, 52, 0, 6.284); g.fill();
    g.globalAlpha = 0.7; g.fillStyle = ['#d9534f', '#f0b23c', '#7fa855'][i];
    g.beginPath(); g.arc(cx - 10, cy - 8, 22, 0, 6.284); g.fill();
    g.globalAlpha = 1;
    jpText(g, ['桜餅', '新茶', '花見弁当'][i], { x: cx, y: cy + 74, size: 19, color: '#4a4235', weight: 700 });
  }
  g.fillStyle = 'rgba(242,178,60,0.9)'; g.fillRect(0, h - 46, w, 46);
  jpText(g, '3/1 〜 4/30  店内でお楽しみください', { x: w / 2, y: h - 23, size: 21, color: '#4a3a12', weight: 700, spacing: 2 });
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.35 + rnd() * 0.4; g.fillStyle = PAL.sakuraPetal; g.beginPath(); g.ellipse(rnd() * w, rnd() * h * 0.4, 5 + rnd() * 7, 3 + rnd() * 5, rnd() * 3, 0, 6.284); g.fill(); }
  // 踏まれた黒ズミ・端の剥がれ
  g.globalAlpha = 1;
  blotches(g, w, h, { count: 22, rad: [20, 90], colors: ['#6b6459', '#8a8272'], alpha: [0.04, 0.16], rnd });
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 14; i++) { g.globalAlpha = 0.4 + rnd() * 0.5; g.beginPath(); g.ellipse(rnd() < 0.5 ? rnd() * 30 : w - rnd() * 30, rnd() * h, 6 + rnd() * 18, 8 + rnd() * 24, 0, 0, 6.284); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return toTexture(cv, { repeat: 1 });
});

/** 剥がしたテープの糊残り */
const glueTex = (seed) => memo(`fg:glue|${seed}`, () => {
  const cv = makeCanvas(256, 64);
  if (!cv) return null;
  cv.rnd = rand(seed + 17);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    g.globalAlpha = 0.06 + rnd() * 0.2;
    g.fillStyle = rnd() > 0.5 ? '#d8c9a0' : '#8b8578';
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 20, 1 + rnd() * 6, rnd() * 3, 0, 6.284); g.fill();
  }
  return toTexture(cv, { repeat: 1 });
});

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 753;
  const rnd = rand(seed);
  const g = grp('floor-guidance');
  const TAPE_T = 0.0034;                       // テープ厚
  const tapeBlue = MAT.marking('#5d90b0', { spec: 0.2, steps: 2 });
  const tapeYellow = MAT.marking(PAL.markingYellow, { spec: 0.22, steps: 2 });
  const tapeWhite = MAT.marking(PAL.marking, { spec: 0.2, steps: 2 });
  const tapeGreen = MAT.marking('#6a9a72', { spec: 0.2, steps: 2 });

  /** 直線テープ 1 本（端はやや細く＝手作業のカット感） */
  const tape = (parent, { x, z, len, dir = 'x', w = 0.052, y = 0.0004, mat, skew = 0 }) => {
    const t = grp('tape', { pos: [x, y + TAPE_T / 2, z], rot: [0, dir === 'x' ? 0 : 90 * D2R, skew] });
    t.add(noHull(mesh(box(len, TAPE_T, w), mat, { cast: false, receive: true })));
    parent.add(t);
    return t;
  };

  /* ---------- 1. 誘導ライン（入口 → 会計 → 通路） ---------- */
  const route = grp('guide-route');
  g.add(route);
  // 入口（+Z 側）から店内へ Straight，then 東（レジ）へ、さらに北（後場・弁当）へ枝分かれ
  tape(route, { x: 0, z: 0.86, len: 1.66, dir: 'z', mat: tapeBlue });          // 南北主推動線
  const corner = grp('corner', { pos: [0.03, 0.0049, 0.03], rot: [0, 45 * D2R, 0] });
  route.add(corner);
  corner.add(noHull(mesh(rbox(0.26, 0.0022, 0.052, 0.001, 2), tapeBlue, { cast: false, receive: true })));
  tape(route, { x: 1.25, z: 0.03, len: 2.5, dir: 'x', mat: tapeBlue });         // 東（レジ前）へ
  tape(route, { x: 0.0, z: -0.72, len: 1.5, dir: 'z', mat: tapeGreen });        // 北（後場・弁当）への枝
  const branch = grp('branch', { pos: [-0.06, 0.0049, 0.52], rot: [0, -48 * D2R, 0] });
  route.add(branch);
  branch.add(noHull(mesh(rbox(0.24, 0.0022, 0.05, 0.001, 2), tapeBlue, { cast: false, receive: true })));
  tape(route, { x: -0.95, z: 0.52, len: 1.7, dir: 'x', mat: tapeBlue });        // 西（雑誌・文庫）への枝
  // ラインの継ぎ目（溶着バンド・ tape の上に重ねるので面が被らない）
  for (const [jx, jz, jw, jd] of [[0, 0.03, 0.075, 'z'], [1.06, 0.03, 0.075, 'x'], [-0.06, 0.52, 0.07, 'x']]) {
    route.add(noHull(mesh(box(jd === 'x' ? 0.03 : jw, 0.0024, jd === 'x' ? jw : 0.03), MAT.marking('#4a7f9e', { spec: 0.2, steps: 2 }), { pos: [jx, 0.005, jz], cast: false })));
  }
  // テープのめくれ（実体 3 处・端から立ち上がる＝床下に潜り込まない）
  const peel = (x, z, ry, len) => {
    const p = grp('peel', { pos: [x, TAPE_T + 0.0008, z], rot: [0, ry, 0] });
    const flap = grp('flap', { rot: [0, 0, 0.13] });
    flap.add(noHull(mesh(box(len, 0.0016, 0.052), tapeBlue, { pos: [len / 2, 0.0008, 0], cast: false })));
    p.add(flap);
    p.add(noHull(mesh(plane(len * 0.9, 0.06), MAT.decal({ map: TEX.wear({ kind: 'dirt', color: '#6b6459', seed: seed + Math.round(x * 10), density: 1.2 }), opacity: 0.4, order: 2 }), { pos: [len * 0.4, 0.0002, 0], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false })));
    route.add(p);
  };
  peel(0.0, 1.2, Math.PI, 0.22);
  peel(1.9, 0.03, -Math.PI / 2, 0.24);
  peel(-1.4, 0.52, Math.PI, 0.2);
  // テープの摩耗・汚跡（踏まれ筋）
  weather(route, { w: 1.5, h: 0.1, pos: [0, 0.0014 + TAPE_T, 0.86], rot: [-Math.PI / 2, 0, Math.PI / 2], kind: 'chip', color: '#e8e2d3', opacity: 0.42, seed: seed + 3, density: 1.5, spread: 0.003 });
  weather(route, { w: 1.6, h: 0.12, pos: [1.5, 0.0014 + TAPE_T, 0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6459', opacity: 0.34, seed: seed + 5, density: 1.4, spread: 0.003 });
  weather(route, { w: 1.2, h: 0.1, pos: [-1, 0.0014 + TAPE_T, 0.52], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#cfc9b6', opacity: 0.3, seed: seed + 7, spread: 0.003 });

  /* ---------- 2. 矢印ステッカー（動線上に 5 枚） ---------- */
  const arrows = [
    { x: 0.0, z: 1.44, ry: 180, t: 'blue', lb: '会計' },
    { x: 0.0, z: 0.4, ry: 180, t: 'blue', lb: '' },
    { x: 1.2, z: 0.09, ry: -12, t: 'blue', lb: 'レジ' },
    { x: -1.2, z: 0.58, ry: 178, t: 'blue', lb: '雑誌' },
    { x: 0.05, z: -0.5, ry: 176, t: 'green', lb: '店员用' },
  ];
  arrows.forEach((a, i) => {
    decal(route, { map: arrowTex(a.lb, a.t), w: 0.3, h: 0.15, pos: [a.x, 0.0042, a.z], rot: [-Math.PI / 2, 0, a.ry * D2R], opacity: 0.95, order: i % 3 });
  });

  /* ---------- 3. レジ前待機ライン・「ここで待ち合わせ」 ---------- */
  const queue = grp('queue-line', { pos: [2.0, 0, 0.62] });
  g.add(queue);
  for (let i = 0; i < 2; i++) {
    queue.add(noHull(mesh(box(0.9 - i * 0.1, TAPE_T, 0.05), tapeWhite, { pos: [0, 0.0004 + TAPE_T / 2, -0.34 + i * 0.66], rot: [0, 0.03 * (i ? -1 : 1), 0], cast: false, receive: true })));
  }
  queue.add(noHull(mesh(box(0.05, TAPE_T, 0.66), tapeWhite, { pos: [-0.44, 0.0004 + TAPE_T / 2, 0.0], rot: [0, 0, 0.02], cast: false, receive: true })));
  decal(queue, { map: TEX.signboard({ text: 'こちらがお会計です', bg: '#eef3f7', fg: '#3b4650', size: 84 }), w: 0.74, h: 0.16, pos: [0.06, 0.0018, 0.0], rot: [-Math.PI / 2, 0, 0], opacity: 0.94, order: 1 });
  weather(queue, { w: 0.7, h: 0.2, pos: [0, 0.0022, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5f5a50', opacity: 0.3, seed: seed + 11, density: 1.5, spread: 0.004 });

  /* ---------- 4. 「のりかえ」表示（行列の向き変更） ---------- */
  const nori = grp('norikae', { pos: [1.28, 0, 1.12] });
  g.add(nori);
  decal(nori, { map: arrowTex('のりかえ', 'blue'), w: 0.32, h: 0.16, pos: [0, 0.0018, 0], rot: [-Math.PI / 2, 0, 150 * D2R], opacity: 0.95 });
  decal(nori, { map: TEX.signboard({ text: '列ののりかえ', bg: '#f2b23c', fg: '#4a3a12', size: 96 }), w: 0.34, h: 0.1, pos: [0.02, 0.002, 0.17], rot: [-Math.PI / 2, 0, 0.06], opacity: 0.95, order: 1 });
  nori.add(noHull(mesh(box(0.36, 0.0018, 0.055), tapeYellow, { pos: [0.02, 0.0006, 0.25], rot: [0, 0.06, 0], cast: false })));

  /* ---------- 5. 傘立て周辺の注意表示 ---------- */
  const umb = grp('umbrella-note', { pos: [-2.4, 0, 1.36] });
  g.add(umb);
  decal(umb, { map: cautionTex('ぬれています', 'かさを置く際'), w: 0.34, h: 0.34, pos: [0, 0.0018, 0], rot: [-Math.PI / 2, 0, 0.08], opacity: 0.95 });
  for (let i = 0; i < 2; i++) {
    umb.add(noHull(mesh(box(0.5, TAPE_T, 0.04), tapeYellow, { pos: [0, 0.0004 + TAPE_T / 2, -0.26 + i * 0.52], rot: [0, 0.02, 0], cast: false, receive: true })));
  }
  // 水たまり跡（傘から垂れた）
  decal(umb, { map: TEX.wear({ kind: 'dirt', color: '#7a7365', seed: seed + 13, density: 1.6 }), w: 0.5, h: 0.4, pos: [0.1, 0.002, 0.02], rot: [-Math.PI / 2, 0, 0.3], opacity: 0.34, order: 2 });

  /* ---------- 6. 消火器設置表示 ---------- */
  const ext = grp('extinguisher', { pos: [-3, 0, -0.62] });
  g.add(ext);
  decal(ext, { map: extTex(), w: 0.44, h: 0.44, pos: [0, 0.0042, 0], rot: [-Math.PI / 2, 0, 0.02], opacity: 0.96 });
  // 表示枠の四隅（摩耗が早い）
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ext.add(noHull(mesh(box(0.06, TAPE_T, 0.06), MAT.marking('#c5312c', { spec: 0.2, steps: 2 }), { pos: [sx * 0.25, 0.0004 + TAPE_T / 2, sz * 0.25], rot: [0, 0, 0.05 * sx], cast: false })));
  }
  weather(ext, { w: 0.4, h: 0.4, pos: [0, 0.0046, 0], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#e6e0d0', opacity: 0.4, seed: seed + 15, spread: 0.004 });

  /* ---------- 7. 春の床ポスター ---------- */
  const poster = grp('floor-poster', { pos: [-1, 0, 1.16], rot: [0, 0.06, 0] });
  g.add(poster);
  poster.add(noHull(mesh(box(0.94, 0.0026, 0.66), MAT.paint('#efe8d6', { spec: 0.14, steps: 2 }), { pos: [0, 0.0013, 0], cast: false, receive: true })));
  decal(poster, { map: floorPosterTex(seed), w: 0.9, h: 0.62, pos: [0, 0.0028, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.98 });
  // 端の丸まり（2 边だけ浮く・ヒンジはポスター縁＝床下に潜り込まない）
  const curlX = grp('curl-x', { pos: [0.44, 0.0032, 0], rot: [0, 0, 0.22] });
  curlX.add(noHull(mesh(box(0.16, 0.002, 0.6), MAT.paint('#efe8d6', { spec: 0.14, side: DoubleSide }), { pos: [0.08, 0.001, 0], cast: false })));
  poster.add(curlX);
  const curlZ = grp('curl-z', { pos: [-0.1, 0.0032, 0.3], rot: [-0.18, 0, 0] });
  curlZ.add(noHull(mesh(box(0.66, 0.002, 0.14), MAT.paint('#efe8d6', { spec: 0.14, side: DoubleSide }), { pos: [0, 0.001, 0.07], cast: false })));
  poster.add(curlZ);
  weather(poster, { w: 0.7, h: 0.5, pos: [0.06, 0.003, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6459', opacity: 0.3, seed: seed + 19, density: 1.6, spread: 0.004 });
  shadowBlob(poster, { r: 0.5, pos: [0, 0.0002, 0], opacity: 0.1 });

  /* ---------- 8. 段差注意の黄帯（入口敷居） ---------- */
  const step = grp('threshold', { pos: [0, 0, 1.66] });
  g.add(step);
  step.add(noHull(mesh(box(1.9, TAPE_T, 0.09), tapeYellow, { pos: [0, 0.0004 + TAPE_T / 2, 0], cast: false, receive: true })));
  for (let i = 0; i < 10; i++) {
    step.add(noHull(mesh(box(0.07, 0.0016, 0.096), MAT.marking('#4a4640', { spec: 0.14, steps: 2 }), { pos: [-0.86 + i * 0.19, 0.0046, 0], rot: [0, -0.42, 0], cast: false })));
  }
  decal(step, { map: TEX.signboard({ text: '段差注意', bg: '#f0c353', fg: '#4a3a12', size: 110 }), w: 0.3, h: 0.09, pos: [0.6, 0.0044, 0.14], rot: [-Math.PI / 2, 0, 0], opacity: 0.95, order: 1 });
  weather(step, { w: 1.6, h: 0.14, pos: [-0.2, 0.0026, 0], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#e8e2d3', opacity: 0.4, seed: seed + 21, density: 1.6, spread: 0.003 });

  /* ---------- 9. 剥がした表示の糊残り・消えかけたライン ---------- */
  decal(g, { map: glueTex(seed), w: 1.1, h: 0.14, pos: [0.7, 0.0016, -1.12], rot: [-Math.PI / 2, 0, 0.14], opacity: 0.66, order: 2 });
  decal(g, { map: glueTex(seed + 5), w: 0.5, h: 0.1, pos: [-2, 0.0016, -0.28], rot: [-Math.PI / 2, 0, -0.5], opacity: 0.5, order: 3 });
  // 点字ブロック風誘導（入口真前・摩耗した黄帯）
  const blk = grp('tactile-strip', { pos: [-0.4, 0, 1.3] });
  g.add(blk);
  blk.add(noHull(mesh(box(0.42, TAPE_T, 0.42), MAT.tactile({ kind: 'dot', base: PAL.tactile }), { pos: [0, 0.0004 + TAPE_T / 2, 0], rot: [0, 0, 0.02], cast: false, receive: true })));
  weather(blk, { w: 0.4, h: 0.4, pos: [0, 0.0044, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8a7f5f', opacity: 0.34, seed: seed + 23, spread: 0.004 });
  // 通路中央の歩行帯（黒ズミ）・タイヤ痕（台車）
  weather(g, { w: 2.6, h: 0.5, pos: [0.4, 0.0014, 0.3], rot: [-Math.PI / 2, 0, 0.06], kind: 'dirt', color: '#5b564c', opacity: 0.16, seed: seed + 25, density: 1.3, spread: 0.003 });
  for (let i = 0; i < 2; i++) {
    decal(g, { map: TEX.wear({ kind: 'scratch', color: '#4f4a44', seed: seed + 27 + i, density: 1.4 }), w: 1.6, h: 0.06, pos: [1.1 - i * 0.1, 0.0016 + i * 0.0002, -0.92 + i * 0.09], rot: [-Math.PI / 2, 0, 0.1 + i * 0.5], opacity: 0.3, order: 4 + i });
  }
  // 落ちた値札・レシート（床の小物＝生活感）
  for (let i = 0; i < 3; i++) {
    g.add(noHull(mesh(box(0.06 + i * 0.01, 0.0012, 0.036), MAT.paper({ color: ['#f4efe0', '#eef2e6', '#f7ecd8'][i], spec: 0.08 }), {
      pos: [range(rnd, -1.6, 1.4), 0.0006, range(rnd, -0.4, 1.5)], rot: [0, range(rnd, 0, 3.1), 0], cast: false,
    })));
  }

  return finish(g, { outline: 'normal', minSize: 0.06 });
}

export { build, build as default, meta };
