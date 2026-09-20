import { g as grp, M as MAT, m as mesh, ak as RingGeometry, c as cyl, b as box, am as hoop, U as circ, r as rbox, h as decal, T as TEX, w as weather, a8 as CircleGeometry, P as PAL, s as shade, H as plane, q as finish, N as makeCanvas, a6 as rr, O as jpText, Q as toTexture, x as PlaneGeometry, E as inst, z as rand } from './index-B1SzF3Mh.js';

//  assets/street/manhole-cover.js —— 側溝蓋・manhole（manhole 円形鋳鉄 / grate 金柵 / vdrain U字側溝蓋）
//  鋳鉄の文様（grill 筋＋浮き文字「下水」「雨水」）・錆と塗装補修・周囲のアスファルト段差・水たまり跡・落ち葉詰まり・擦り減った縁
//  ※ 原点 = 路面レベル（y=0 = アスファルト面）。本体は +0.02 側へ僅かに持ち上がり、下面は路盤に埋まる。

const meta = {
  id: 'manhole-cover',
  real: [0.74, 0.06, 0.74],
  origin: 'road-level',            // y=0 = 舗装面（地面に埋まる蓋のため ground-center とは少し違う）
};
const DEFAULT_OPTIONS = { kind: 'manhole', size: 0.6, seed: 71 };

const D2R = Math.PI / 180;

const iron = (o = {}) => MAT.metalPaint('#7d8384', { worn: 0.95, repeat: 3, base: '#8d9392', ...o });
const ironNew = MAT.metalPaint('#7f8580', { worn: 0.3, repeat: 2, base: '#a5aca6' });

/** 蓋表面の文様（同心円＋滑り止め筋＋浮き文字） */
function coverTex(text) {
  const cv = makeCanvas(512, 512);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#6b7172'; g.fillRect(0, 0, w, h);
  // 鋳肌
  for (let i = 0; i < 4200; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.16;
    g.fillStyle = rnd() > 0.5 ? '#8b9192' : '#4b5152';
    g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.8 + rnd() * 4.2, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  // 同心円
  g.strokeStyle = 'rgba(35,40,40,0.55)';
  for (let i = 1; i <= 5; i++) { g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h / 2, (i / 6) * w * 0.48, 0, 7); g.stroke(); }
  // 滑り止め斜筋
  g.strokeStyle = 'rgba(200,205,200,0.30)'; g.lineWidth = 9; g.lineCap = 'round';
  for (let i = -8; i < 18; i++) {
    g.beginPath(); g.moveTo(i * 34, 0); g.lineTo(i * 34 + 120, h); g.stroke();
  }
  // 中央の浮き文字帯
  g.fillStyle = 'rgba(30,34,34,0.5)'; rr(g, w * 0.18, h * 0.38, w * 0.64, h * 0.24, 16); g.fill();
  g.fillStyle = 'rgba(196,202,198,0.85)'; rr(g, w * 0.19, h * 0.39, w * 0.62, h * 0.21, 14); g.fill();
  jpText(g, text, { x: w / 2, y: h * 0.5, size: h * 0.15, color: '#4a504f', weight: 900, spacing: 12 });
  // 退色・錆・泥
  g.globalAlpha = 0.3;
  for (let i = 0; i < 14; i++) {
    g.fillStyle = ['#8a5236', '#6d6152', '#9aa09b'][i % 3];
    g.beginPath(); g.arc(rnd() * w, rnd() * h, 10 + rnd() * 60, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}
function grateTex() {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#5f6566'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(190,196,192,0.35)'; g.lineWidth = 10;
  for (let i = 0; i < 6; i++) { const y = (i + 0.5) * h / 6; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.globalAlpha = 0.35;
  for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? '#8a5236' : '#3d4243'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 14, 3 + rnd() * 10); }
  return toTexture(cv, { repeat: 1 });
}
/** 落ち葉（薄いが構造でなく debris。葉脈入りの alpha 卡片を数枚） */
function leaves(parent, rnd, n, spread, y, x0 = 0, z0 = 0) {
  const geo = new PlaneGeometry(0.1, 0.075);
  const mat = MAT.leaf({ map: TEX.leafCluster({ base: '#9aab5e', seed: 3 }), alphaMap: TEX.petal({ tone: 1, mode: 'single' }), alphaTest: 0.34, color: '#b8ab5e' });
  const im = inst(geo, mat, n, (i, d, r) => {
    d.position.set(x0 + (r() - 0.5) * spread, y + 0.004 + r() * 0.006, z0 + (r() - 0.5) * spread * 0.7);
    d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.283);
    d.scale.setScalar(0.7 + r() * 0.8);
    d.updateMatrix();
  }, { name: 'fallen-leaves', cast: false, receive: true });
  parent.add(im);
  return im;
}

function build(options = {}) {
  const kind = ['manhole', 'grate', 'vdrain'].includes(options.kind) ? options.kind : 'manhole';
  const size = options.size ?? 0.6;
  const seed = options.seed ?? 71;
  const rnd = rand(seed);
  const g = grp('manhole-' + kind);
  const asphalt = MAT.asphalt({ tone: 0, repeat: 4 });

  /* ============================ 円形 manhole ============================ */
  if (kind === 'manhole') {
    const R = size / 2;
    // 周囲のアスファルト段差（ひし形ではなく輪で受ける）
    g.add(mesh(new RingGeometry(R * 1.02, R * 1.42, 30, 1), asphalt, { pos: [0, 0.004, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    // 枠（鋳鉄フレーム：蓋より 2 mm 高い＝段差）
    const frame = mesh(new RingGeometry(R * 0.99, R * 1.06, 30, 1), iron({ repeat: 2 }), { pos: [0, 0.026, 0], rot: [-90 * D2R, 0, 0] });
    g.add(frame);
    g.add(mesh(cyl(R * 1.06, R * 1.09, 0.07, 30, false), iron(), { pos: [0, -0.01, 0] }));
    // 蓋本体（文様マップ＋実体の筋）
    const coverY = 0.019;
    const cover = mesh(cyl(R * 0.985, R * 0.985, 0.034, 30), iron({ map: coverTex('下 水'), repeat: 1, base: '#ffffff' }), { pos: [0, coverY - 0.017, 0], name: 'manhole-cover' });
    g.add(cover);
    // 表面の滑り止め筋（grill による実起）
    const bars = Math.max(6, Math.round(R * 22));
    for (let i = 0; i < bars; i++) {
      const t = i / (bars - 1);
      const x = -R * 0.86 + t * R * 1.72;
      const half = Math.sqrt(Math.max(0, (R * 0.9) ** 2 - x * x));
      const bar = mesh(box(0.012, 0.007, half * 2), iron({ repeat: 1, base: '#9aa09c' }), { pos: [x, coverY + 0.0035, 0], rot: [0, 0, 0.06] });
      g.add(bar);
    }
    // 同心円も実体で立てる。flat モードは map を剥ぐので、文様をテクスチャに
    // 頼った蓋はただの黒い円盤になり、路面に開いた穴に読えていた
    // （`shots/y1/v-hatch.png` 右上）。
    for (const k of [0.34, 0.56, 0.78]) {
      g.add(hoop(R * k, 0.004, iron({ repeat: 1, base: '#8f9596' }), { pos: [0, coverY + 0.004, 0], rot: [90 * D2R, 0, 0], cast: false }));
    }
    // 中央ボス＋浮き文字盤＋鍵穴
    g.add(mesh(cyl(R * 0.3, R * 0.32, 0.012, 24), iron({ repeat: 1, base: '#a2a8a4' }), { pos: [0, coverY + 0.006, 0] }));
    const boss = mesh(circ(R * 0.28, 24), MAT.decal({ map: coverTex('下水'), opacity: 1 }), { pos: [0, coverY + 0.0125, 0], rot: [-90 * D2R, 0, 0], cast: false });
    boss.userData.noOutline = true;
    g.add(boss);
    g.add(mesh(box(0.036, 0.012, 0.014), MAT.darkIron(), { pos: [0, coverY + 0.013, R * 0.52] }));   // 鍵穴（リフト孔）
    g.add(mesh(rbox(0.05, 0.026, 0.014, 0.004, 2), ironNew, { pos: [-R * 0.55, coverY + 0.011, 0] })); // リング受け
    g.add(hoop(0.019, 0.005, MAT.metal('#9aa0a3'), { pos: [-R * 0.55, coverY + 0.02, 0], rot: [0, 0, 0] }));
    // 擦り減った縁（光ったリング）と塗装補修
    g.add(hoop(R * 0.95, 0.006, MAT.metal('#a9afae', { worn: 0.2, spec: 0.75 }), { pos: [0, coverY + 0.004, 0], rot: [90 * D2R, 0, 0] }));
    decal(g, { map: TEX.wear({ kind: 'chip', color: '#8b9190', seed: seed + 3, density: 2.2 }), w: R * 0.9, h: R * 0.5, pos: [R * 0.3, coverY + 0.0025, -R * 0.34], rot: [-90 * D2R, 0, 0.4], order: 1 });
    // 錆・水たまり跡・泥
    weather(g, { w: R * 1.1, h: R * 0.9, pos: [-R * 0.25, coverY + 0.0026, R * 0.28], rot: [-90 * D2R, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 11, density: 1.8, count: 2, spread: 0.1 });
    const puddle = mesh(new CircleGeometry(R * 0.42, 22), MAT.water({ opacity: 0.42, scroll: [0.004, 0.003] }), { pos: [R * 0.18, coverY + 0.0035, -R * 0.2], rot: [-90 * D2R, 0, 0], cast: false });
    puddle.userData.noOutline = true;
    g.add(puddle);
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#3f3d44', seed: seed + 12, density: 1.4 }), w: R * 1.5, h: R * 1.2, pos: [R * 0.1, 0.006, -R * 0.15], rot: [-90 * D2R, 0, 0], order: 2 });
    leaves(g, rnd, 7, R * 1.5, coverY + 0.006, R * 0.4, R * 0.5);
    // 蓋のガタ（段付き座面）
    g.add(mesh(new RingGeometry(R * 0.9, R * 0.99, 26, 1), MAT.paint('#4f5455', { steps: 2, shadowAmt: 1 }), { pos: [0, coverY - 0.001, 0], rot: [-90 * D2R, 0, 0], cast: false }));
  }

  /* ============================ 長方形 金柵 ============================ */
  if (kind === 'grate') {
    const W = size, D = size * 0.62;
    g.add(mesh(box(W * 1.5, 0.02, D * 1.7), asphalt, { pos: [0, 0.002, 0], cast: false }));                     // 周囲舗装（段差受け）
    g.add(mesh(rbox(W, 0.055, D, 0.008, 2), iron({ repeat: 2 }), { pos: [0, -5e-3, 0], name: 'grate-frame' }));
    g.add(mesh(box(W * 0.86, 0.012, D * 0.86), MAT.paint('#26292b', { steps: 2, shadowAmt: 1 }), { pos: [0, 0.006, 0], cast: false }));
    // 桟（grill 相当を独立 Mesh で：縦桟 + 横づえ）
    const n = Math.max(5, Math.round(W / 0.055));
    for (let i = 0; i < n; i++) {
      const x = -W * 0.4 + (i / (n - 1)) * W * 0.8;
      const isNew = i === 3;                            // 1 本だけ補修交換（明るい）
      const bar = mesh(rbox(0.022, 0.024, D * 0.84, 0.005, 2), isNew ? ironNew : iron({ map: grateTex(), repeat: 1 }), { pos: [x, 0.014, 0] });
      if (i === 5) bar.rotation.z = 0.05;               // 1 本曲がり
      g.add(bar);
    }
    for (const cz of [-D * 0.28, 0, D * 0.28]) g.add(mesh(box(W * 0.84, 0.016, 0.02), iron({ repeat: 1 }), { pos: [0, 0.022, cz] }));
    // 枠の立ち上がり（アスファルトに埋まる縁）
    for (const [sx, sz, ww, dd] of [[0, -D / 2, W, 0.02], [0, D / 2, W, 0.02], [-W / 2, 0, 0.02, D], [W / 2, 0, 0.02, D]]) {
      g.add(mesh(box(ww, 0.03, dd), iron({ repeat: 1 }), { pos: [sx, 0.008, sz] }));
    }
    weather(g, { w: W * 0.6, h: D * 0.5, pos: [W * 0.1, 0.026, -D * 0.1], rot: [-90 * D2R, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 21, density: 2, count: 2 });
    weather(g, { w: W * 0.4, h: D * 0.4, pos: [-W * 0.2, 0.026, D * 0.15], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#4a4a48', opacity: 0.5, seed: seed + 22, count: 2 });
    decal(g, { map: TEX.wear({ kind: 'chip', color: '#a3a9a5', seed: seed + 23, density: 2.4 }), w: W * 0.3, h: D * 0.3, pos: [-W * 0.26, 0.0265, -D * 0.2], rot: [-90 * D2R, 0, 0.3], order: 3 });
    leaves(g, rnd, 9, W * 0.9, 0.024, 0, 0);
  }

  /* ============================ U 字側溝蓋（vdrain） ============================ */
  if (kind === 'vdrain') {
    const L = size * 3.2, Wd = size * 0.5;
    // 溝本体（暗い隙間）
    g.add(mesh(box(L, 0.02, Wd * 1.15), MAT.paint('#20221f', { steps: 2, shadowAmt: 1 }), { pos: [0, -0.03, 0], cast: false }));
    // 蓋は 2 枚分割（片方は僅かにズレて段差）
    const nLid = 2;
    for (let i = 0; i < nLid; i++) {
      const lx = -L / 2 + (i + 0.5) * (L / nLid);
      const lid = grp('lid', { pos: [lx, i === 1 ? 0.004 : 0.008, i === 1 ? 0.008 : 0] });
      lid.add(mesh(rbox(L / nLid - 0.02, 0.05, Wd, 0.006, 2), MAT.concrete({ base: PAL.concrete, repeat: 2, cracked: true }), { pos: [0, 0, 0], name: 'vdrain-lid' }));
      // 側溝の排水スリット（蓋の端に 4 箇所）
      for (let s = 0; s < 4; s++) {
        lid.add(mesh(box(0.024, 0.052, Wd * 0.42), MAT.paint('#2b2d2a', { steps: 2, shadowAmt: 1 }), { pos: [-L / 4 + 0.08 + s * 0.11, 0.001, -Wd * 0.24] }));
      }
      // 浮き文字「雨水」を盛った小plate
      lid.add(mesh(rbox(0.19, 0.012, 0.09, 0.005, 2), MAT.concrete({ base: shade(PAL.concrete, 1.05), repeat: 1 }), { pos: [0.02, 0.028, 0.02] }));
      const t = mesh(plane(0.17, 0.075), MAT.decal({ map: TEX.signboard({ text: '雨水', bg: '#cfc9be', fg: '#5b5a52', size: 210, ar: 2.2 }), opacity: 1 }), { pos: [0.02, 0.035, 0.02], rot: [-90 * D2R, 0, 0], cast: false });
      t.userData.noOutline = true;
      lid.add(t);
      // 持ち手金具
      lid.add(mesh(cyl(0.012, 0.012, 0.05, 10, true), MAT.metal('#767b7d', { worn: 0.9 }), { pos: [-0.14, 0.028, 0], rot: [0, 0, 90 * D2R] }));
      g.add(lid);
      weather(g, { w: 0.3, h: 0.14, pos: [lx + 0.05, 0.036, -0.06], rot: [-90 * D2R, 0, 0.2], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 31 + i, density: 1.8, count: 2 });
    }
    // 側溝のフチ（アスファルト段差）と詰まり
    for (const sz of [-1, 1]) g.add(mesh(box(L * 1.06, 0.03, 0.06), asphalt, { pos: [0, 0.001, sz * (Wd / 2 + 0.03)] }));
    weather(g, { w: L * 0.7, h: 0.12, pos: [0, 0.033, 0], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#5d5a50', opacity: 0.5, seed: seed + 41, count: 3, spread: 0.08 });
    leaves(g, rnd, 12, L * 0.8, 0.026, L * 0.18, 0);
    // 水たまり（溝の低部）
    const wtr = mesh(box(L * 0.4, 0.004, Wd * 0.5), MAT.water({ opacity: 0.5, scroll: [0.003, 0.002] }), { pos: [-L * 0.2, 0.004, 0], cast: false });
    wtr.userData.noOutline = true;
    g.add(wtr);
  }

  return finish(g, { outline: 'thin', minSize: 0.03 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
