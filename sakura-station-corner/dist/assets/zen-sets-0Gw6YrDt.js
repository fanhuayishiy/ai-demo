import { z as rand, g as grp, m as mesh, o as lathe, c as cyl, M as MAT, U as circ, k as tubeOf, t as tor, w as weather, a as sph, ae as SphereGeometry, V as Vector3, J as shape, ab as Path, K as extrude, aj as BackSide, ak as RingGeometry, D as DoubleSide, ac as Box3, af as BoxGeometry, ag as CylinderGeometry, Y as memo, N as makeCanvas, Q as toTexture } from './index-Dj2iGATz.js';

//  assets/products/zen-sets.js —— おでんの具（关东煮具材）6 variant
//  daikon 大根（面取り・煮含み）・egg 卵（殻向き・白身黄身）・konnyaku こんにゃく（三角切り・穴）
//  satsuma さつま揚げ（表面凹凸）・norimaki 海苔巻（層）・chikuwa ちくわ（竹串穴）
//  共通：煮汁の液面（MAT.water 薄層・broth:false で省略可）、表面のつや（高い spec + つゆ玉）、
//        串（skewer:true で竹串を通した状態にする／串込みは高さ 0.112m になる）
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない（棚側で描边）

const meta = {
  id: 'zen-sets',
  real: [0.055, 0.05, 0.05],        // 具材単体（煮汁層込み）の実測 bbox
  origin: 'bottom-center',
  variants: ['daikon', 'egg', 'konnyaku', 'satsuma', 'norimaki', 'chikuwa'],
  skewerReal: [0.055, 0.114, 0.055], // options.skewer = true のとき（竹串が上へ 64mm 出る）
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* ------------------------------- 局所テクチャ（core 非汚染） ------------------------------- */
/** 大根の煮含み：上下（切り口側）が濃く、筋と出汁の斑点 */
const daikonTex = () => memo('zen:daikon', () => {
  const cv = makeCanvas(128, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#efe4cd'; g.fillRect(0, 0, w, h);
  // 切り口側へ行くほど煮汁で色が入る（v 方向グラデ）
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(186,138,80,0.55)');
  gr.addColorStop(0.16, 'rgba(206,166,110,0.16)');
  gr.addColorStop(0.5, 'rgba(255,250,238,0.10)');
  gr.addColorStop(0.84, 'rgba(206,166,110,0.16)');
  gr.addColorStop(1, 'rgba(178,128,72,0.58)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // 繊維筋（v 方向の細線）
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.1;
    g.strokeStyle = rnd() > 0.5 ? '#c9a97c' : '#fffaf0';
    g.lineWidth = 0.8 + rnd() * 2.2;
    const x = rnd() * w;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rnd() - 0.5) * 12, h); g.stroke();
  }
  // リング（円周方向のスジ）＋出汁の斑点
  for (let i = 0; i < 7; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.06;
    g.strokeStyle = '#b9945f'; g.lineWidth = 1 + rnd() * 2;
    const y = rnd() * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 260; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.2;
    g.fillStyle = rnd() > 0.6 ? '#8a6a3c' : '#fffdf6';
    g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.9, 0, 6.284); g.fill();
  }
  return toTexture(cv, { repeat: 1 });
});

/** さつま揚げの揚げ衣：キメの凹凸 + 異物（人参・生姜・糸こんにゃく） */
const satsumaTex = () => memo('zen:satsuma', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#d9a262'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 8;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rnd() > 0.5 ? 'rgba(255,232,190,0.5)' : 'rgba(150,88,42,0.42)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
  }
  // 混入具材
  for (let i = 0; i < 34; i++) {
    g.fillStyle = ['#e2593f', '#f0d9a0', '#c4d98a', '#f6efe0'][i % 4];
    g.globalAlpha = 0.75;
    const x = rnd() * w, y = rnd() * h;
    g.save(); g.translate(x, y); g.rotate(rnd() * 6.284);
    g.fillRect(-2 - rnd() * 7, -1 - rnd() * 2, 4 + rnd() * 14, 2 + rnd() * 3);
    g.restore();
  }
  // 揚げムラの焦げ
  g.globalAlpha = 1;
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.22;
    g.fillStyle = '#8b4a22';
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 26, 4 + rnd() * 14, rnd() * 3, 0, 6.284); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 海苔巻の断面（層）と寿司揚げの表皮 */
const noriLayerTex = () => memo('zen:noriLayer', () => {
  const cv = makeCanvas(64, 64);
  if (!cv) return null;
  const { g } = cv;
  g.fillStyle = '#f4e9cf'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#2c3728';
  for (let i = 0; i < 3; i++) g.fillRect(0, 8 + i * 20, 64, 5);
  return toTexture(cv, { repeat: 1 });
});

/** こんにゃくの斑点（黒粉） */
const konnyakuTex = () => memo('zen:konnyaku', () => {
  const cv = makeCanvas(128, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#dcd9d0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    g.globalAlpha = 0.14 + rnd() * 0.5;
    g.fillStyle = rnd() > 0.15 ? '#3b3a34' : '#fbf8f0';
    g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.5 + rnd() * 1.7, 0, 6.284); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 3 });
});

/* --------------------------------- 共用マテリアル --------------------------------- */
function mats(tint) {
  const t = { tint };
  return {
    daikon: MAT.food({ color: '#f1e6d0', map: daikonTex(), spec: 0.62, specPower: 26, specCut: 0.16, sheen: 0.14, shadowAmt: 0.6, ...t }),
    daikonCore: MAT.food({ color: '#fbf5e6', spec: 0.5, specPower: 30, shadowAmt: 0.66, ...t }),
    eggWhite: MAT.food({ color: '#f7f3e8', spec: 0.66, specPower: 34, specCut: 0.15, sheen: 0.12, shadowAmt: 0.58, ...t }),
    eggYolk: MAT.food({ color: '#e8a63b', spec: 0.5, specPower: 18, specCut: 0.3, sheen: 0.1, shadowAmt: 0.62, ...t }),
    eggYolkDeep: MAT.food({ color: '#c98a2c', spec: 0.42, specPower: 16, shadowAmt: 0.7, ...t }),
    konnyaku: MAT.food({ color: '#e2dfd6', map: konnyakuTex(), spec: 0.55, specPower: 22, specCut: 0.2, sheen: 0.1, shadowAmt: 0.62, side: DoubleSide, ...t }),
    satsuma: MAT.food({ color: '#e0a862', map: satsumaTex(), spec: 0.58, specPower: 20, specCut: 0.2, sheen: 0.12, shadowAmt: 0.66, steps: 4, ...t }),
    satsumaEdge: MAT.food({ color: '#a2602c', spec: 0.4, specPower: 16, shadowAmt: 0.8, ...t }),
    nori: MAT.nori({ color: '#28331f', spec: 0.62, specPower: 44, specCut: 0.16, sheen: 0.16, ...t }),
    noriFried: MAT.nori({ color: '#39472c', spec: 0.7, specPower: 60, specCut: 0.13, ...t }),
    paste: MAT.food({ color: '#f2e3c2', map: noriLayerTex(), spec: 0.5, specPower: 24, ...t }),
    chikuwa: MAT.food({ color: '#dcab5f', spec: 0.6, specPower: 26, specCut: 0.17, sheen: 0.12, shadowAmt: 0.64, side: DoubleSide, steps: 4, ...t }),
    chikuwaIn: MAT.food({ color: '#b98a4d', spec: 0.3, specPower: 14, shadowAmt: 0.9, side: DoubleSide, ...t }),
    bamboo: MAT.wood({ light: '#e3c78d', dark: '#c2a067', repeat: 3, spec: 0.24, ...t }),
    broth: MAT.water({ color: '#c69a5e', opacity: 0.52, scroll: [0.006, 0.004] }),
    drop: MAT.water({ color: '#e6d7b4', opacity: 0.72, spec: 1, specPower: 300, scroll: [0.002, 0.006] }),
  };
}

/* --------------------------------- 共通小物 --------------------------------- */
/** 煮汁の薄い液面（具が鍋から上がった直後の濡れ） */
function brothPond(parent, M, r, seed) {
  const disc = noHull(mesh(circ(r, 22), M.broth, { pos: [0, 0.0012, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false }));
  parent.add(disc);
  // 液縁の meniscus（周回の微小リング）＋飛び出した出汁の玉
  parent.add(noHull(mesh(tor(r * 0.98, 0.0009, 5, 18), M.drop, { pos: [0, 0.0018, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  const rnd = rand(seed);
  for (let i = 0; i < 4; i++) {
    const a = rnd() * 6.284, rr2 = r * (0.42 + rnd() * 0.4);
    parent.add(noHull(mesh(sph(0.0016 + rnd() * 0.0012, 7, 6), M.drop, {
      pos: [Math.cos(a) * rr2, 0.0022 + rnd() * 0.001, Math.sin(a) * rr2], scale: [1, 0.62, 1], cast: false, receive: false,
    })));
  }
}

/** つゆ玉（具の表面に張り付いた煮汁の輝き） */
function glossyDrops(parent, M, pts, seed) {
  const rnd = rand(seed);
  for (const [x, y, z, s] of pts) {
    parent.add(noHull(mesh(sph(s ?? (0.0014 + rnd() * 0.0012), 8, 6), M.drop, {
      pos: [x, y, z], scale: [1, 0.78, 1], cast: false, receive: false,
    })));
  }
}

/** 竹串：尖った先端 + 節 + 煮汁の滴り */
function skewer(parent, M, { x = 0, z = 0, y0 = -4e-3, y1 = 0.108, tilt = 0, through = true }) {
  const s = grp('skewer');
  const r = 0.0016;
  const L = y1 - y0;
  s.add(mesh(cyl(r * 0.92, r, L * 0.86, 8), M.bamboo, { pos: [0, y0 + L * 0.43, 0] }));
  // 先端（下側＝尖り）と持ち手側の面取り
  s.add(mesh(cyl(r, r * 0.12, 0.016, 8), M.bamboo, { pos: [0, y0 + 0.008, 0] }));
  s.add(mesh(cyl(r * 0.7, r * 0.7, L * 0.145, 8), M.bamboo, { pos: [0, y0 + L * 0.93, 0] }));
  s.add(noHull(mesh(sph(r * 0.86, 7, 5), M.bamboo, { pos: [0, y0 + L, 0], cast: false })));
  // 節（竹の節目 2 箇所）
  for (const t of [0.3, 0.64]) {
    s.add(noHull(mesh(tor(r * 1.06, 0.0005, 5, 12), M.bamboo, { pos: [0, y0 + L * t, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // 煮汁の滴り（串を伝う筋 + 垂れた玉）
  s.add(noHull(mesh(cyl(r * 1.16, r * 1.12, L * 0.22, 7), M.drop, { pos: [0, y0 + L * 0.7, 0], cast: false, receive: false })));
  s.add(noHull(mesh(sph(0.0022, 8, 6), M.drop, { pos: [0, y0 + L * 0.585, 0], scale: [1, 1.5, 1], cast: false, receive: false })));
  s.position.set(x, 0, z);
  s.rotation.z = tilt * D2R;
  s.rotation.x = tilt * 0.4 * D2R;
  parent.add(s);
  return s;
}

/* ================================ 各 variant ================================ */

/** 大根：面取りされた円柱 + 隠し包丁 + 煮含みの濃淡 + 欠け（缺陷） */
function vDaikon(inner, M, rnd, o) {
  const R = 0.0235, H = 0.034;
  const body = grp('daikon');
  inner.add(body);
  // 鍋底に接する面は平ら、上下とも 面取り（欠けないように角を落とす）
  const prof = [[0, 0], [R - 0.0052, 0], [R, 0.0052], [R, H - 0.0058], [R - 0.0058, H], [0, H]];
  body.add(mesh(lathe(prof, 26), M.daikon, { name: 'daikon-body' }));
  // 芯（切り口の白身感）：上 face に一段明るい円盤
  body.add(noHull(mesh(circ(R * 0.62, 20), M.daikonCore, { pos: [0, H + 0.0004, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  // 隠し包丁（切り口に入れる X の筋 — 含み色を良くする実務細工）
  for (const ry of [0, 90]) {
    body.add(noHull(mesh(tubeOf([
      [-R * 0.5, H - 0.0016, 0], [0, H - 0.0006, 0], [R * 0.5, H - 0.0016, 0],
    ], 0.0008, 10, 5), M.satsumaEdge, { rot: [0, ry * D2R, 0], cast: false })));
  }
  // 煮含みの色帯（側面下部に吸い上げた出汁）
  body.add(noHull(mesh(cyl(R + 0.0006, R + 0.0006, 0.006, 26, true), MAT.water({
    color: '#b9814a', opacity: 0.32, spec: 0.5, side: DoubleSide, scroll: [0.002, 0.004],
  }), { pos: [0, 0.0072, 0], cast: false, receive: false })));
  // 缺陷：面取りの一部が欠けて白芯が出ている／細い割れ
  const chipA = rnd() * 6.284;
  body.add(mesh(lathe([[0, 0], [0.0062, 0.0008], [0.0074, 0.0042], [0.0032, 0.0056], [0, 0.0052]], 10), M.daikonCore, {
    pos: [Math.cos(chipA) * R * 0.985, 0.0038, Math.sin(chipA) * R * 0.985],
    rot: [90 * D2R, 0, -chipA * D2R + 90 * D2R], name: 'daikon-chip',
  }));
  body.add(noHull(mesh(tubeOf([[R * 0.2, H * 0.62, R * 0.98], [R * 0.05, H * 0.86, R * 0.999], [-R * 0.1, H, R * 0.96]], 0.0005, 8, 4), M.satsumaEdge, { cast: false })));
  weather(body, { w: 0.02, h: 0.014, pos: [0, H + 0.0009, 0.004], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#9b7038', opacity: 0.34, seed: (o.seed ?? 1) + 3, density: 1.1, spread: 0.001 });
  glossyDrops(body, M, [[R * 0.9, H * 0.62, R * 0.44], [-R * 0.5, H * 0.35, R * 0.9], [R * 0.3, H + 0.0012, -R * 0.5]], (o.seed ?? 1) + 7);
  brothPond(inner, M, 0.026, (o.seed ?? 1) + 11);
  if (o.skewer) skewer(inner, M, { x: 0.001, z: -15e-4, tilt: 1.2 });
}

/** 卵：縦半分に切った白身＋黄身、切り口を斜め前へ向け、殻側ドームが背面 */
function vEgg(inner, M, rnd, o) {
  const egg = grp('egg');
  inner.add(egg);
  const RX = 0.0192, RY = 0.0206, RZ = 0.0168;   // 卵球
  // 半卵（z>=0 半球）を切り口 +Z 側へ向けるため 180° 回す → ドームが背面
  const shellHalf = mesh(new SphereGeometry(1, 24, 16, Math.PI, Math.PI), M.eggWhite, { name: 'egg-shell' });
  shellHalf.scale.set(RX, RY, RZ);
  shellHalf.rotation.y = 0;
  egg.add(shellHalf);
  // 切り口（円盤）— 白身の縁を厚く、中心へ黄身
  const face = grp('cut-face');
  egg.add(face);
  face.add(noHull(mesh(circ(1, 26), M.eggWhite, { pos: [0, 0, 0.0004], scale: [RX * 0.995, RY * 0.995, 1], cast: false })));
  // 黄身：やや盛り上がった球冠 + 火の通った縁（灰緑の輪）
  face.add(noHull(mesh(sph(1, 20, 12, 0, 6.284, 0, 0.62), M.eggYolk, { pos: [0, -15e-4, 0.0012], scale: [0.0126, 0.0126, 0.0112], cast: false })));
  face.add(noHull(mesh(new RingGeometry(0.0112, 0.0142, 24), M.eggYolkDeep, { pos: [0, -15e-4, 0.0009], cast: false, receive: false })));
  // 白身の外側（殻側）の薄皮筋
  egg.add(noHull(mesh(tor(RX * 0.985, 0.0006, 5, 22), M.eggYolkDeep, { pos: [0, 0, 0.0002], rot: [0, 0, 0], cast: false })));
  // 全体を寝かせて切り口を斜め上前面へ（煮汁に浮かぶ状態）
  egg.rotation.set(-20 * D2R, 0, 5 * D2R);
  egg.position.set(0, 0.0035, 0.002);
  // 缺陷：白身の欠け／煮汁の染み・黄身の割れ
  egg.add(noHull(mesh(tubeOf([
    [RX * 0.2, RY * 0.5, RZ * 0.72], [RX * 0.55, RY * 0.2, RZ * 0.86], [RX * 0.72, -RY * 0.2, RZ * 0.82],
  ], 0.0006, 8, 4), M.satsumaEdge, { cast: false })));
  weather(egg, { w: 0.018, h: 0.014, pos: [-RX * 0.4, -RY * 0.55, RZ * 0.6], kind: 'dirt', color: '#9c7341', opacity: 0.3, seed: (o.seed ?? 1) + 5, density: 1.2, spread: 0.002 });
  glossyDrops(egg, M, [[RX * 0.55, RY * 0.42, RZ * 0.68, 0.0019], [-RX * 0.7, -RY * 0.2, RZ * 0.72, 0.0015]], (o.seed ?? 1) + 9);
  brothPond(inner, M, 0.024, (o.seed ?? 1) + 13);
  if (o.skewer) skewer(inner, M, { x: -4e-3, z: 0.004, tilt: 2.4 });
}

/** こんにゃく：三角切り（面取り押出）+ 水抜きの穴 + 黒粉 */
function vKonnyaku(inner, M, rnd, o) {
  const k = grp('konnyaku');
  inner.add(k);
  const W = 0.0245, H = 0.0455, D = 0.013;
  const s = shape((sh) => {
    sh.moveTo(-W, -H * 0.44);
    sh.lineTo(W, -H * 0.44);
    sh.quadraticCurveTo(W * 1.04, -H * 0.40, W * 0.94, -H * 0.31);
    sh.lineTo(0.0028, H * 0.46);                 // 頂（わずかに反らせた実形）
    sh.quadraticCurveTo(-22e-4, H * 0.485, -58e-4, H * 0.44);
    sh.lineTo(-W * 0.94, -H * 0.31);
    sh.quadraticCurveTo(-W * 1.04, -H * 0.40, -W, -H * 0.44);
  });
  // こんにゃく名物：中央下寄りの水抜き穴
  const hole = new Path();
  hole.absarc(0.0, -H * 0.16, 0.0038, 0, 6.284, true);
  s.holes.push(hole);
  const geo = extrude(s, { depth: D, bevelEnabled: true, bevelThickness: 0.0022, bevelSize: 0.0024, bevelSegments: 2, curveSegments: 10, steps: 1 });
  geo.translate(0, 0, -D / 2);
  geo.computeVertexNormals();
  k.add(mesh(geo, M.konnyaku, { name: 'konnyaku-body' }));
  // 半透明の奥（光を通す質感）：少し小さい同形を内側へ
  const inner2 = extrude(s, { depth: D * 0.55, bevelEnabled: false, curveSegments: 8, steps: 1 });
  inner2.translate(0, 0, -D * 0.275);
  k.add(noHull(mesh(inner2, MAT.food({ color: '#cfcdc4', transparent: true, opacity: 0.5, spec: 0.4, side: BackSide }), { cast: false, receive: false })));
  // 缺陷：端の欠け・表面のえぐれ
  k.add(noHull(mesh(sph(0.0038, 8, 6), MAT.food({ color: '#c8c5bb', spec: 0.45 }), {
    pos: [W * 0.55, -H * 0.3, D * 0.2], scale: [1.4, 0.5, 0.7], cast: false,
  })));
  weather(k, { w: 0.02, h: 0.02, pos: [-4e-3, H * 0.06, D / 2 + 0.0026], kind: 'dirt', color: '#9b7746', opacity: 0.26, seed: (o.seed ?? 1) + 17, density: 1.0, spread: 0.002 });
  glossyDrops(k, M, [[0.004, -H * 0.28, D * 0.55, 0.002], [0.008, H * 0.05, D * 0.5, 0.0016], [-6e-3, -H * 0.05, D * 0.52, 0.0018]], (o.seed ?? 1) + 19);
  brothPond(inner, M, 0.024, (o.seed ?? 1) + 23);
  if (o.skewer) skewer(inner, M, { x: 0.0, z: 0.0 });   // 穴へ通る串
}

/** さつま揚げ：凸凹の表面（頂点変位）+ 焦げ縁 + 混入具 */
function vSatsuma(inner, M, rnd, o) {
  const s = grp('satsuma');
  inner.add(s);
  const R = 0.0235;
  const g = new SphereGeometry(R, 22, 14);
  const p = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const bump =
      Math.sin(n.x * 7.3 + n.z * 2.1) * 0.5 +
      Math.sin(n.y * 9.1 - n.x * 4.4) * 0.32 +
      Math.sin(n.z * 13.7 + 1.7) * 0.26;
    const k = 1 + bump * 0.055 + (rnd() - 0.5) * 0.03;
    v.multiplyScalar(k);
    p.setXYZ(i, v.x, v.y * 0.46, v.z);   // 楕円板状に潰す
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  g.translate(0, 0.0115, 0);
  s.add(mesh(g, M.satsuma, { name: 'satsuma-body' }));
  // 揚げた縁（濃い衣のリング）＋裏側の平たい面
  s.add(noHull(mesh(tor(R * 0.92, 0.0022, 6, 26), M.satsumaEdge, { pos: [0, 0.0108, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  s.add(noHull(mesh(circ(R * 0.9, 22), M.satsumaEdge, { pos: [0, 0.0022, 0], rot: [90 * D2R, 0, 0], cast: false, receive: false })));
  // 表面の凹凸（小さな揚げ泡 = 衣のふくらみ）を独立 Mesh で数箇所
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 6.284, rr2 = R * (0.2 + rnd() * 0.68);
    s.add(noHull(mesh(sph(0.0022 + rnd() * 0.0026, 8, 6), M.satsuma, {
      pos: [Math.cos(a) * rr2, 0.021 + rnd() * 0.004, Math.sin(a) * rr2], scale: [1.2, 0.62, 1.2], cast: false,
    })));
  }
  // 混入具が覗く（人参・生姜・糸こんにゃく）
  for (let i = 0; i < 5; i++) {
    const a = rnd() * 6.284, rr2 = R * (0.35 + rnd() * 0.5);
    s.add(noHull(mesh(box0(0.0035 + rnd() * 0.004, 0.0011, 0.0016), MAT.food({
      color: ['#e05a3c', '#f5e2b0', '#cbdca0'][i % 3], spec: 0.4,
    }), { pos: [Math.cos(a) * rr2, 0.0235 + rnd() * 0.001, Math.sin(a) * rr2], rot: [0, a, (rnd() - 0.5) * 0.3], cast: false })));
  }
  // 缺陷：衣の剥げ（白身の魚肉が出る）・油の垂れ
  s.add(noHull(mesh(sph(0.0045, 9, 7), M.paste, { pos: [R * 0.62, 0.014, -R * 0.55], scale: [1.3, 0.5, 1], cast: false })));
  weather(s, { w: 0.026, h: 0.016, pos: [-R * 0.3, 0.0235, R * 0.25], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#7d5a2c', opacity: 0.3, seed: (o.seed ?? 1) + 29, density: 1.3, spread: 0.002 });
  glossyDrops(s, M, [[R * 0.3, 0.027, R * 0.2, 0.0022], [-R * 0.5, 0.024, R * 0.4, 0.0018]], (o.seed ?? 1) + 31);
  brothPond(inner, M, 0.025, (o.seed ?? 1) + 37);
  if (o.skewer) skewer(inner, M, { x: -6e-3, z: 0.004, y0: 0.002, tilt: 1.6 });
}
/** 極小 box（kit.box はキャッシュ共用なので変位用途に新設） */
function box0(w, h, d) { return new BoxGeometry(w, h, d); }

/** 海苔巻：揚げ海苔の筒 + 断面の層（のり・魚肉）+ 縫い目の重なり */
function vNorimaki(inner, M, rnd, o) {
  const n = grp('norimaki');
  inner.add(n);
  const R = 0.0198, H = 0.031;
  // 本体（やや樽形）
  n.add(mesh(lathe([[0, 0], [R * 0.9, 0.0015], [R, H * 0.32], [R * 1.02, H * 0.62], [R * 0.94, H - 0.0018], [0, H]], 26), M.paste, { name: 'norimaki-core' }));
  // 海苔の巻き（筒を 2 枚ずらして重ね、端がめくれる実形に）
  // ※ thetaStart で縫い目をずらす（Mesh 回転は AABB が膨らむため避ける）
  const wrap = (rad, y0, hgt, seam, mat) => {
    const g = new CylinderGeometry(rad, rad * 0.99, hgt, 26, 1, true, seam, Math.PI * 2);
    const mm = mesh(g, mat, { pos: [0, y0 + hgt / 2, 0] });
    n.add(mm);
    return mm;
  };
  wrap(R + 0.0011, 0.0005, H * 0.72, 0.2, M.nori);
  wrap(R + 0.0017, H * 0.5, H * 0.5, 1.1, M.noriFried);
  // 海苔の重なり端（めくれた 1 枚：小さい折り返し）
  n.add(mesh(lathe([[0, 0], [0.0068, 0.001], [0.0086, 0.0042], [0.0062, 0.0074], [0.0026, 0.0058]], 10), M.nori, {
    pos: [R * 0.5, H * 0.9, R * 0.66], rot: [0.3, 0.5, -0.4], name: 'nori-flap',
  }));
  // 断面の層（天面）：魚肉 → のり → 魚肉 → のり の同心円
  const layers = [[R * 0.9, M.paste], [R * 0.72, M.nori], [R * 0.54, M.paste], [R * 0.36, M.nori], [R * 0.2, M.paste]];
  layers.forEach(([r, mat], i) => {
    n.add(noHull(mesh(circ(r, 22), mat, { pos: [0, H + 0.0004 + i * 0.0006, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  });
  // 揚げ衣の blister
  for (let i = 0; i < 5; i++) {
    const a = rnd() * 6.284;
    n.add(noHull(mesh(sph(0.0014 + rnd() * 0.0014, 7, 6), M.noriFried, {
      pos: [Math.cos(a) * (R + 0.0016), H * (0.2 + rnd() * 0.6), Math.sin(a) * (R + 0.0016)], scale: [1, 0.8, 0.5], cast: false,
    })));
  }
  // 缺陷：海苔の切れ・揚げた欠片
  n.add(noHull(mesh(tubeOf([[R * 0.5, 0, R * 0.9], [R * 0.8, H * 0.3, R * 0.7], [R * 0.62, H * 0.55, R * 0.85]], 0.0006, 8, 4), M.satsumaEdge, { cast: false })));
  weather(n, { w: 0.016, h: 0.02, pos: [0, H * 0.35, -0.022400000000000003], rot: [0, Math.PI, 0], kind: 'chip', color: '#8d8574', opacity: 0.4, seed: (o.seed ?? 1) + 41, density: 1.2, spread: 0.002 });
  glossyDrops(n, M, [[R * 0.5, H * 0.7, R * 0.9, 0.002], [-R * 0.8, H * 0.3, R * 0.55, 0.0016]], (o.seed ?? 1) + 43);
  brothPond(inner, M, 0.024, (o.seed ?? 1) + 47);
  if (o.skewer) skewer(inner, M, { x: 0, z: 0, tilt: 0.8 });
}

/** ちくわ：中空（竹串が通る穴）+ 縦スジ + 焼けた端 */
function vChikuwa(inner, M, rnd, o) {
  const c = grp('chikuwa');
  inner.add(c);
  const RO = 0.0122, RI = 0.0056, H = 0.049;
  // 外側 → 上縁 → 内側（穴底まで一枚連続）＝ 中身が見える
  const prof = [
    [RI, 0.0], [RO - 0.0035, 0.0], [RO, 0.0038], [RO * 1.02, H * 0.42], [RO, H - 0.0042], [RO - 0.0038, H],
    [RI + 0.0006, H], [RI, H - 0.003], [RI, 0.0034], [RI - 0.0006, 0.0],
  ];
  c.add(mesh(lathe(prof, 24), M.chikuwa, { name: 'chikuwa-body' }));
  // 穴の内側（暗い煮汁溜り）
  c.add(noHull(mesh(cyl(RI * 0.94, RI * 0.94, 0.004, 14), M.broth, { pos: [0, 0.0042, 0], cast: false, receive: false })));
  c.add(noHull(mesh(circ(RI * 0.94, 14), MAT.water({ color: '#d8c49a', opacity: 0.55, scroll: [0.004, 0.002] }), { pos: [0, H - 0.0022, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  // 竹の型_take  longitudinal 筋（製造痕）
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 6.284 + 0.4;
    c.add(noHull(mesh(tubeOf([
      [Math.cos(a) * RO * 1.001, 0.004, Math.sin(a) * RO * 1.001],
      [Math.cos(a) * RO * 1.02, H * 0.5, Math.sin(a) * RO * 1.02],
      [Math.cos(a) * RO * 1.001, H - 0.004, Math.sin(a) * RO * 1.001],
    ], 0.0006, 10, 4), M.chikuwaIn, { cast: false })));
  }
  // 両端の焼き色
  for (const [y, r] of [[0.0016, RO * 0.99], [H - 0.0008, RO * 0.995]]) {
    c.add(noHull(mesh(tor(r, 0.0013, 6, 24), M.satsumaEdge, { pos: [0, y, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // 缺陷：斜めに欠けた縁・表皮のしわ
  c.add(noHull(mesh(box0(0.006, 0.003, 0.004), M.paste, { pos: [RO * 0.72, H - 0.0012, RO * 0.55], rot: [0, 0.6, 0.2], cast: false })));
  weather(c, { w: 0.014, h: 0.02, pos: [-RO - 0.0006, H * 0.45, 0], rot: [0, -90 * D2R, 0], kind: 'scratch', color: '#8a6434', opacity: 0.3, seed: (o.seed ?? 1) + 53, density: 1.0, spread: 0.002 });
  glossyDrops(c, M, [[RO * 0.9, H * 0.62, RO * 0.44, 0.0019], [RO * 0.3, H * 0.28, -RO * 0.95, 0.0015]], (o.seed ?? 1) + 59);
  brothPond(inner, M, 0.023, (o.seed ?? 1) + 61);
  if (o.skewer) skewer(inner, M, { x: 0, z: 0, through: true });
}

const VARIANTS = {
  daikon: vDaikon, egg: vEgg, konnyaku: vKonnyaku, satsuma: vSatsuma, norimaki: vNorimaki, chikuwa: vChikuwa,
};
const VARIANT_LIST = Object.keys(VARIANTS);

/* -------------------------------- 原点合わせ -------------------------------- */
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
  const variant = options.variant && VARIANTS[options.variant] ? options.variant : 'daikon';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 131);
  const g = grp(`zen-sets:${variant}`);
  const inner = grp('body');
  const M = mats(options.tint);
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, M, rnd, { seed, skewer: !!options.skewer, tint: options.tint });
  return seat(g, inner, options.scale ?? 1);
}

export { VARIANT_LIST, build, build as default, meta };
