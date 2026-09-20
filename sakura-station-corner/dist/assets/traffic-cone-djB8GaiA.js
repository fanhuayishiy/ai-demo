import { g as grp, s as shade, M as MAT, T as TEX, n as range, m as mesh, r as rbox, b as box, o as lathe, D as DoubleSide, c as cyl, H as plane, w as weather, p as shadowBlob, k as tubeOf, P as PAL, ae as SphereGeometry, am as hoop, U as circ, a as sph, q as finish, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-BqvI026L.js';

//  assets/street/traffic-cone.js —— カラーコーン／立て看板／路地注意鏡（kind='cone'|'stand'|'mirror'）
//  cone  ：黒ゴム台の割れ・反射帯の剥がれ・積み跡・日焼け退色・先端欠け
//  stand ：アクリルの黄変・手書き風 TEX.poster・脚の曲がり・蝶番と金具
//  mirror：丸凸鏡（MAT.chrome）＋裏の支柱とバンド・水垢・枠の日焼け

const meta = {
  id: 'traffic-cone',
  real: [0.36, 0.7, 0.36],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { kind: 'cone', seed: 101 };

const D2R = Math.PI / 180;

/** 注意標語のPoster（手書き風） */
function posterBoard() {
  const cv = makeCanvas(512, 384);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f6efdd'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e2685e'; g.fillRect(0, 0, w, h * 0.17);
  jpText(g, '出入りあり', { x: w / 2, y: h * 0.085, size: h * 0.11, color: '#fff8ef', weight: 900, spacing: 4 });
  // 手書き風の丸い吹き出しと矢印
  g.strokeStyle = '#3a3630'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.ellipse(w * 0.32, h * 0.52, w * 0.2, h * 0.22, -0.08, 0, 7); g.stroke();
  jpText(g, 'ゆっくり', { x: w * 0.32, y: h * 0.46, size: h * 0.1, color: '#3a3630', weight: 800 });
  jpText(g, 'ね', { x: w * 0.32, y: h * 0.6, size: h * 0.1, color: '#3a3630', weight: 800 });
  g.beginPath();
  g.moveTo(w * 0.58, h * 0.5); g.quadraticCurveTo(w * 0.72, h * 0.36, w * 0.8, h * 0.52); g.stroke();
  g.beginPath(); g.moveTo(w * 0.74, h * 0.46); g.lineTo(w * 0.8, h * 0.52); g.lineTo(w * 0.72, h * 0.57); g.stroke();
  // 下部の注意帯
  g.fillStyle = '#f0c353'; g.fillRect(0, h * 0.82, w, h * 0.18);
  jpText(g, 'みどり台 自治会', { x: w / 2, y: h * 0.91, size: h * 0.08, color: '#4a4033', weight: 700, spacing: 3 });
  // 湿り染み・日焼け
  g.globalAlpha = 0.16;
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#8c7c5c' : '#fff'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 12 + rnd() * 60, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}
/** 鏡裏の支持 band テクスチャ（文字入りの黄色帯） */
function bandTex() {
  const cv = makeCanvas(256, 64);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, h);
  jpText(g, 'あぶない', { x: w / 2, y: h * 0.62, size: h * 0.62, color: '#c04a3f', weight: 900, spacing: 6 });
  g.globalAlpha = 0.3;
  for (let i = 0; i < 40; i++) { g.fillStyle = rnd() > 0.5 ? '#8d8676' : '#fff'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 14, 1 + rnd() * 5); }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const kind = ['cone', 'stand', 'mirror'].includes(options.kind) ? options.kind : 'cone';
  const seed = options.seed ?? 101;
  const rnd = rand(seed);
  const g = grp('traffic-' + kind);

  /* ============================ カラーコーン ============================ */
  if (kind === 'cone') {
    const H = 0.7;
    const orange = shade(PAL.storeBand3, 1.12);
    const coneMat = MAT.plastic(orange, { steps: 3, spec: 0.3, specPower: 44, shadowAmt: 0.86, map: TEX.metal({ base: orange, worn: 0.35, repeat: 2 }).map });
    const cg = grp('cone', { pos: [0, 0, 0], rot: [0, 0, range(rnd, -3, 3) * D2R] });
    // 黒ゴム台（四角＋角丸・割れあり）
    const base = mesh(rbox(0.3, 0.036, 0.3, 0.02, 3), MAT.rubber('#2d3034', { spec: 0.08, specPower: 12, shadowAmt: 0.98 }), { pos: [0, 0.018, 0], name: 'cone-base' });
    cg.add(base);
    cg.add(mesh(rbox(0.24, 0.02, 0.24, 0.014, 2), MAT.rubber('#3a3d42'), { pos: [0, 0.044, 0] }));
    // 台の割れ（細い楔を押し込んだ跡）
    for (let i = 0; i < 2; i++) {
      const a = rnd() * 6.283, r = 0.12 + rnd() * 0.03;
      const cr = mesh(box(0.006, 0.05, 0.055 + rnd() * 0.05), MAT.paint('#1f2225', { steps: 2, shadowAmt: 1 }), { pos: [Math.cos(a) * r, 0.024, Math.sin(a) * r], rot: [0, -a / D2R, range(rnd, -0.3, 0.3)] });
      cg.add(cr);
    }
    // 胴（lathe 断面：根元ふくらみ → 先端）
    const prof = [
      [0, 0], [0.135, 0.0], [0.128, 0.03], [0.098, 0.12], [0.083, 0.2],
      [0.068, 0.3], [0.052, 0.42], [0.038, 0.54], [0.028, 0.63], [0.026, 0.665], [0.02, 0.68], [0, 0.69],
    ].map(([x, y]) => [x, y * (H / 0.7)]);
    cg.add(mesh(lathe(prof, 24), coneMat, { name: 'cone-body', pos: [0, 0.05, 0] }));
    // 反射帯（白：やや膨らんだ筒で被せる／上段と下段）
    for (const [t, hh] of [[0.44, 0.1], [0.66, 0.062]]) {
      const y = 0.05 + H * t;
      const rr = 0.135 - 0.105 * t + 0.006;
      cg.add(mesh(cyl(rr, rr * 1.06, hh, 24, true), MAT.paint('#f2eee2', {
        steps: 2, spec: 0.42, specPower: 90, side: DoubleSide, shadowAmt: 0.6,
        map: TEX.metal({ base: '#efe9dc', worn: 0.5, repeat: 3 }).map,
      }), { pos: [0, y, 0], name: 'cone-tape' }));
    }
    // 反射帯の剥がれ（めくれた三角片）
    const peel = mesh(plane(0.07, 0.06), MAT.paint('#e7e1d1', { side: DoubleSide, steps: 2 }), { pos: [0.085, 0.05 + H * 0.44, 0.048], rot: [-0.35, 0.6, 0.3] });
    cg.add(peel);
    // 積み跡（重ねた時の擦過環）
    weather(cg, { w: 0.16, h: 0.03, pos: [0, 0.05 + H * 0.18, 0.112], kind: 'scratch', color: '#6f6455', opacity: 0.55, seed: seed + 2, count: 3, spread: 0.02 });
    weather(cg, { w: 0.14, h: 0.05, pos: [0.02, 0.05 + H * 0.3, 0.1], kind: 'dirt', color: '#8b8375', opacity: 0.45, seed: seed + 3, count: 2 });
    // 日焼け退色（片側だけ色抜け）
    cg.add(mesh(lathe(prof.slice(0, 9).map(([x, y]) => [x + 0.0015, y]), 20, -0.9, 1.9), MAT.plastic(shade(orange, 1.28), { transparent: true, opacity: 0.55, side: DoubleSide, steps: 2 }), { pos: [0, 0.05, 0] }));
    // 先端の欠け・潰れ
    cg.add(mesh(cyl(0.019, 0.026, 0.03, 12), MAT.plastic(shade(orange, 0.86), { steps: 2 }), { pos: [0.004, 0.05 + H * 0.965, 0.003], rot: [0, 0, 8 * D2R] }));
    g.add(cg);
    weather(g, { w: 0.2, h: 0.06, pos: [0.05, 0.02, 0.1], kind: 'dirt', color: '#6d6152', opacity: 0.5, seed: seed + 4, count: 2 });
    shadowBlob(g, { r: 0.2, pos: [0, 0.004, 0], opacity: 0.26 });
  }

  /* ============================ 立て看板（A 型） ============================ */
  if (kind === 'stand') {
    const W = 0.62, H = 0.78;
    const frameMat = MAT.metal('#a8adb0', { worn: 0.7, repeat: 2 });
    const sg = grp('stand', { pos: [0, 0, 0], rotY: 8 });
    // 脚（前後 2 組：片側を僅かに曲げる）
    for (const [sz, tilt] of [[-0.16, -6], [0.16, 4]]) {
      const leg = grp('leg', { pos: [0, 0, sz] });
      for (const sx of [-W / 2 + 0.03, W / 2 - 0.03]) {
        const pts = [[sx, 0.02, 0], [sx, H * 0.45, tilt * 0.004], [sx, H * 0.9, sz > 0 ? -0.03 : 0.02]];
        leg.add(mesh(tubeOf(pts, 0.014, 16, 7), frameMat, { name: 'stand-leg' }));
        leg.add(mesh(cyl(0.019, 0.021, 0.014, 10), MAT.rubber('#33373c'), { pos: [sx, 0.007, 0] }));
      }
      // 上部の蝶番（金具・ボルト）
      leg.add(mesh(box(W - 0.02, 0.026, 0.03), frameMat, { pos: [0, H * 0.94, 0] }));
      for (const sx of [-W / 2 + 0.03, W / 2 - 0.03]) leg.add(mesh(cyl(0.008, 0.008, 0.04, 6), MAT.metal('#8b9092', { worn: 0.85 }), { pos: [sx, H * 0.94, 0], rot: [90 * D2R, 0, 0] }));
      sg.add(leg);
    }
    // 看板パネル（枠＋ポスター＋アクリル）
    const panel = grp('panel', { pos: [0, H * 0.5, 0.028], rot: [-0.05, 0, 0] });
    panel.add(mesh(rbox(W, H * 0.82, 0.016, 0.008, 2), MAT.metalPaint('#d8d3c6', { worn: 0.6, base: '#eee9dc' }), { name: 'board' }));
    const pTex = posterBoard();
    const poster = mesh(plane(W - 0.06, (H * 0.82) - 0.055), MAT.poster({ map: pTex, steps: 2 }), { pos: [0, 0.006, 0.0095], cast: false });
    poster.userData.noOutline = true;
    panel.add(poster);
    // アクリル（黄変・小傷・ネジ留め）
    const acry = mesh(rbox(W - 0.02, H * 0.8, 0.006, 0.004, 2), MAT.glassLite({ color: '#efe4bd', opacity: 0.2, side: DoubleSide }), { pos: [0, 0.006, 0.017], cast: false });
    acry.userData.noOutline = true;
    panel.add(acry);
    weather(panel, { w: W * 0.5, h: H * 0.3, pos: [-W * 0.18, H * 0.16, 0.021], kind: 'scratch', color: '#cfc7ae', opacity: 0.4, seed: seed + 11, count: 2 });
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      panel.add(mesh(cyl(0.009, 0.009, 0.03, 6), MAT.metal('#9aa0a3', { worn: 0.8 }), { pos: [sx * (W / 2 - 0.03), sy * (H * 0.41 - 0.03), 0.014], rot: [90 * D2R, 0, 0] }));
    }
    // 下側の日除け帯（黄色反射）
    panel.add(mesh(rbox(W, 0.05, 0.014, 0.005, 2), MAT.paint(PAL.markingYellow, { steps: 2, map: bandTex(), side: DoubleSide }), { pos: [0, -H * 0.4, 0.008] }));
    sg.add(panel);
    // 裏面の当て板（紙片に見せない為のパネル厚）
    sg.add(mesh(rbox(W - 0.04, H * 0.74, 0.01, 0.006, 2), MAT.wood({ light: '#c4ab86', dark: '#8f7452', repeat: 1 }), { pos: [0, H * 0.5, -0.026], rot: [0.05, 0, 0] }));
    g.add(sg);
    // 脚の泥・錆、土台の砂利
    weather(g, { w: 0.5, h: 0.1, pos: [0, 0.03, 0.16], kind: 'dirt', color: '#6d6152', opacity: 0.55, seed: seed + 12, count: 3, spread: 0.16 });
    weather(g, { w: 0.1, h: 0.16, pos: [W / 2 - 0.03, 0.14, -0.16], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 13, count: 2 });
    shadowBlob(g, { r: 0.34, pos: [0, 0.004, 0], opacity: 0.26, ratio: 0.6 });
  }

  /* ============================ 路地注意鏡 ============================ */
  if (kind === 'mirror') {
    const R = 0.34;
    const Y = 1.72;                                   // 鏡中心の高さ
    const Rf = R * 2.2;                               // 凸率（球半径）
    const cap = Math.asin(Math.min(0.9, R / Rf));
    const zc = -Rf * Math.cos(cap) - 0.004;           // 球中心（鏡の背面側）
    const mg = grp('mirror', { pos: [0, Y, 0], rotY: 6 });
    // 凸鏡面（球冠を +Z へ向けて膨らませる＝MAT.chrome で反射的な読み）
    const face = mesh(new SphereGeometry(Rf, 30, 16, 0, Math.PI * 2, 0, cap), MAT.chrome({ spec: 0.95, specPower: 230, base: '#cdd6d8' }), {
      name: 'mirror-face', pos: [0, 0, zc], rot: [Math.PI / 2, 0, 0], cast: false,
    });
    mg.add(face);
    // 枠（黄色い樹脂リング・日焼けで退色）
    const rimA = MAT.plastic('#e0b74a', { steps: 3, spec: 0.34, shadowAmt: 0.84, map: TEX.metal({ base: '#e0b74a', worn: 0.5, repeat: 2 }).map });
    mg.add(hoop(R + 0.022, 0.03, rimA, { rot: [0, 0, 0] }));
    mg.add(mesh(cyl(R + 0.05, R + 0.05, 0.028, 30, true), rimA, { pos: [0, 0, -0.03], rot: [90 * D2R, 0, 0] }));
    // 裏側のリブ（放射 6 本）とセンターハブ
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rib = mesh(box(R * 1.7, 0.02, 0.026), MAT.hardPlastic('#b9b3a4', { spec: 0.3 }), { pos: [Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, -0.058], rot: [0, 0, a] });
      mg.add(rib);
    }
    mg.add(mesh(cyl(0.06, 0.068, 0.05, 14), MAT.metal('#8f9497', { worn: 0.8 }), { pos: [0, 0, -0.07], rot: [90 * D2R, 0, 0] }));
    mg.add(mesh(cyl(0.02, 0.022, 0.1, 12), MAT.metal('#a5aaaa', { worn: 0.7 }), { pos: [0, 0, -0.11], rot: [90 * D2R, 0, 0] }));
    // バンド（金具 2 段・ボルトで締結）
    for (const zz of [-0.1, -0.16]) {
      const bd = hoop(0.062, 0.012, MAT.metal('#9aa0a3', { worn: 0.85 }), { pos: [0, 0, zz], rot: [Math.PI / 2, 0, 0] });
      mg.add(bd);
      mg.add(mesh(box(0.03, 0.016, 0.02), MAT.metal('#b7bcc0', { worn: 0.6 }), { pos: [0.06, 0, zz] }));
    }
    g.add(mg);
    // 支柱（角鋼）と基礎
    const post = grp('post');
    post.add(mesh(box(0.07, Y - 0.02, 0.055), MAT.metalPaint('#8d968f', { worn: 0.9, base: '#adb5ae' }), { pos: [0, (Y - 0.02) / 2, -0.19], name: 'mirror-post' }));
    post.add(mesh(box(0.075, 0.02, 0.06), MAT.metal('#7f8884', { worn: 0.8 }), { pos: [0, Y - 0.02, -0.19] }));
    post.add(mesh(cyl(0.15, 0.18, 0.055, 14), MAT.concrete({ base: PAL.concreteDark, repeat: 1, cracked: true }), { pos: [0, 0.026, -0.19] }));
    post.add(mesh(rbox(0.19, 0.02, 0.19, 0.006, 2), MAT.concrete({ base: '#c2bcae', repeat: 1 }), { pos: [0, 0.06, -0.19] }));
    // 下部の補助標札（「注意」）
    post.add(mesh(rbox(0.24, 0.11, 0.012, 0.005, 2), MAT.metalPaint('#f0ede2', { worn: 0.6, base: '#faf7ee' }), { pos: [0, 0.98, -0.152] }));
    const sub = mesh(plane(0.22, 0.09), MAT.decal({ map: TEX.signboard({ text: 'みどり', bg: '#f2efe4', fg: '#3a352c', size: 210, ar: 2.4 }), opacity: 1 }), { pos: [0, 0.98, -0.144], cast: false });
    sub.userData.noOutline = true;
    post.add(sub);
    weather(post, { w: 0.14, h: 0.4, pos: [0.02, 0.3, -0.162], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 21, density: 2, count: 3, spread: 0.12 });
    weather(post, { w: 0.1, h: 0.16, pos: [-0.02, 0.8, -0.162], kind: 'chip', color: '#c6ccc6', opacity: 0.5, seed: seed + 22, count: 3 });
    g.add(post);
    // 鏡面の水垢（球面上に 3 mm 浮かせる楕円斑）
    for (let i = 0; i < 5; i++) {
      const a = rnd() * 6.283, rr = rnd() * R * 0.78;
      const d = mesh(circ(0.03 + rnd() * 0.035, 12), MAT.decal({ map: TEX.wear({ kind: 'dirt', color: '#e4e6df', seed: seed + 31 + i, density: 2 }), opacity: 0.4 }), {
        pos: [Math.cos(a) * rr, Math.sin(a) * rr, Math.sqrt(Math.max(0, Rf * Rf - rr * rr)) + zc + 0.003],
        cast: false,
      });
      d.userData.noOutline = true;
      mg.add(d);
    }
    // 鳥糞（上部）
    for (let i = 0; i < 3; i++) {
      const a = rnd() * Math.PI + 0.3;
      g.add(mesh(sph(0.011 + rnd() * 0.008, 8, 6), MAT.paint('#e9e4d6', { steps: 2, spec: 0.08 }), { pos: [Math.cos(a) * (R + 0.02), Math.sin(a) * (R + 0.02), 0.02], scale: [1, 0.5, 1] }));
    }
    shadowBlob(g, { r: 0.22, pos: [0, 0.004, -0.19], opacity: 0.26 });
  }
  return finish(g, { outline: 'normal', minSize: 0.024 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
