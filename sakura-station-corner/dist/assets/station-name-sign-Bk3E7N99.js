import { g as grp, M as MAT, n as range, m as mesh, b as box, c as cyl, w as weather, r as rbox, h as decal, T as TEX, q as finish, N as makeCanvas, P as PAL, s as shade, O as jpText, Q as toTexture, a6 as rr, z as rand } from './index-BqvI026L.js';

//  assets/station/station-name-sign.js —— 木製駅名標（白地・青帯・ローマ字併記・隣站名・桜のイラスト）
//  ---------------------------------------------------------------------------
//  原点 = ホーム床面接触中心 / +Y 上 / 読取面を +Z とする（裏面にも同じ版面 → どちらからでも読める）。
//  装配例：(−6.2, −11.4) と (−12.4, −11.4) に rotY = 180（線路側へ向ける）。
//  build({ name, prev, next, seed })

const meta = {
  id: 'station-name-sign',
  real: [1.22, 1.61, 0.20],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { name: '桜ヶ丘', prev: '富士見', next: '河合原', seed: 2024 };

const D2R = Math.PI / 180;
const ROMAJI = { 桜ヶ丘: 'Sakuragaoka', 富士見: 'Fujimi', 河合原: 'Kawahara' };

/** 版面を一枚の canvas に描く（前面／背面は隣站の左右が入れ替わる） */
function faceTex(name, prev, next, back) {
  const cv = makeCanvas(1024, 384);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const paper = '#f7f4e8';
  g.fillStyle = paper; g.fillRect(0, 0, w, h);
  // 青帯（上下）
  g.fillStyle = PAL.storeBand; g.fillRect(0, 0, w, h * 0.15);
  g.fillStyle = PAL.storeBand; g.fillRect(0, h * 0.85, w, h * 0.15);
  g.fillStyle = shade(PAL.storeBand, 0.72); g.fillRect(0, h * 0.15, w, h * 0.022);
  g.fillStyle = shade(PAL.storeBand, 0.72); g.fillRect(0, h * 0.828, w, h * 0.022);
  const prevT = back ? next : prev, nextT = back ? prev : next;
  // 隣站名（左右）＋矢印
  const drawEnd = (txt, x, dir) => {
    g.fillStyle = 'rgba(60,90,120,0.14)';
    rr(g, x - 118, h * 0.36, 236, h * 0.3, 10); g.fill();
    jpText(g, dir > 0 ? '▶' : '◀', { x: x + dir * 92, y: h * 0.51, size: h * 0.14, color: '#2f5c86', weight: 800 });
    jpText(g, txt, { x: x - dir * 16, y: h * 0.465, size: h * 0.15, color: '#33506d', weight: 700 });
    jpText(g, (ROMAJI[txt] || txt).toUpperCase(), { x: x - dir * 16, y: h * 0.575, size: h * 0.062, color: '#7d8ea0', weight: 600, spacing: 2 });
  };
  drawEnd(prevT, 152, -1);
  drawEnd(nextT, w - 152, 1);
  // 自站名
  jpText(g, name, { x: w / 2, y: h * 0.46, size: h * 0.3, color: '#2b3a45', weight: 800, spacing: 10 });
  jpText(g, (ROMAJI[name] || name).toUpperCase(), { x: w / 2, y: h * 0.63, size: h * 0.09, color: '#5d6b74', weight: 600, spacing: 6 });
  // 桜のイラスト（左下に五弁花を数輪）
  const flower = (cx, cy, r, rot, tone) => {
    g.save(); g.translate(cx, cy); g.rotate(rot);
    for (let i = 0; i < 5; i++) {
      g.rotate((Math.PI * 2) / 5);
      const gr = g.createRadialGradient(0, -r * 0.55, 1, 0, -r * 0.5, r * 0.62);
      gr.addColorStop(0, tone); gr.addColorStop(1, '#fdeef4');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(-r * 0.46, -r * 0.62, -r * 0.3, -r * 1.16, 0, -r * 1.06);
      g.bezierCurveTo(r * 0.3, -r * 1.16, r * 0.46, -r * 0.62, 0, 0);
      g.fill();
    }
    g.fillStyle = '#e88ea8'; g.beginPath(); g.arc(0, 0, r * 0.2, 0, 7); g.fill();
    g.restore();
  };
  flower(w * 0.34, h * 0.775, 21, 0.3, PAL.sakuraPetalDeep);
  flower(w * 0.385, h * 0.735, 14, 1.1, PAL.sakuraPetal);
  flower(w * 0.315, h * 0.72, 10, 2.2, PAL.sakuraPetalPale);
  flower(w * 0.665, h * 0.775, 18, -0.4, PAL.sakuraPetalDeep);
  flower(w * 0.7, h * 0.73, 11, 1.7, PAL.sakuraPetal);
  // 上の帯に白文字（駅番号のようなもの：架空）
  jpText(g, 'SK-03', { x: w * 0.075, y: h * 0.078, size: h * 0.085, color: '#f4f7f2', weight: 800, spacing: 2 });
  jpText(g, 'かすがしゃくでん', { x: w * 0.86, y: h * 0.078, size: h * 0.062, color: '#e4eef4', weight: 600, spacing: 3 });
  // 日焼け・汚れ・落書きを擦った跡
  g.globalAlpha = 0.2;
  const gr = g.createLinearGradient(0, 0, w, h * 0.4);
  gr.addColorStop(0, 'rgba(255,240,200,0.55)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(150,140,110,0.35)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.03 + rnd() * 0.07;
    g.fillStyle = rnd() > 0.5 ? '#8b8570' : '#ffffff';
    const bw = 20 + rnd() * 160;
    g.fillRect(rnd() * w, rnd() * h, bw, 1 + rnd() * 3);
  }
  g.globalAlpha = 0.16;
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = '#c9c2ae'; g.lineWidth = 2 + rnd() * 6;
    g.beginPath();
    let x = 300 + rnd() * 400, y = h * (0.2 + rnd() * 0.5);
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 90; y += (rnd() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const name = options.name ?? DEFAULT_OPTIONS.name;
  const prev = options.prev ?? DEFAULT_OPTIONS.prev;
  const next = options.next ?? DEFAULT_OPTIONS.next;
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const g = grp('station-name-sign');

  const BW = 1.02, BH = 0.38;                    // 看板本体
  const TOP = 1.28;                              // 看板中心の高さ（床面基準）

  const mFrame = MAT.wood({ light: '#9d7a4f', dark: '#5f482c', knots: true, uv: { repeat: [0.45, 0.45] }, shadowAmt: 0.9 });
  const mFrame2 = MAT.wood({ light: '#8b6c46', dark: '#54402a', uv: { repeat: [0.4, 0.4] } });
  const mFace = MAT.paint('#ffffff', { graphic: true, map: faceTex(name, prev, next, false), spec: 0.14, specPower: 34, sheen: 0.02, shadowAmt: 0.62, steps: 3 });
  const mFaceBack = MAT.paint('#ffffff', { graphic: true, map: faceTex(name, prev, next, true), spec: 0.14, specPower: 34, sheen: 0.02, shadowAmt: 0.62, steps: 3 });
  const mIron = MAT.darkIron({ uv: { repeat: [0.5, 0.5] } });
  const mCollar = MAT.galvanized({ uv: { repeat: [0.6, 0.6] } });
  const mSteel = MAT.metal('#9d9f9c', { worn: 0.8, uv: { repeat: [0.5, 0.5] } });

  /* ---------- 柱（2 本、根元金具・苔・割れ） ---------- */
  for (const sx of [-1, 1]) {
    const p = grp(`post-${sx > 0 ? 'e' : 'w'}`, { pos: [sx * 0.41, 0, 0], rot: [0, 0, sx * range(rnd, -0.4, 0.4) * D2R] });
    p.add(mesh(box(0.086, TOP + 0.16, 0.086), mFrame, { pos: [0, (TOP + 0.16) / 2, 0], name: 'post' }));
    p.add(mesh(box(0.104, 0.12, 0.104), mFrame2, { pos: [0, TOP + 0.16 - 0.06, 0] }));               // 笠木受け
    p.add(mesh(box(0.11, 0.1, 0.11), mCollar, { pos: [0, 0.14, 0], name: 'post-collar' }));          // 根元の鉄巻き
    p.add(mesh(box(0.126, 0.016, 0.126), mIron, { pos: [0, 0.196, 0], cast: false }));
    p.add(mesh(box(0.126, 0.016, 0.126), mIron, { pos: [0, 0.092, 0], cast: false }));
    // アンカー
    for (const sz of [-1, 1]) {
      p.add(mesh(cyl(0.011, 0.012, 0.075, 6), mIron, { pos: [0.045 * sx, 0.038, sz * 0.045], cast: false }));
      p.add(mesh(cyl(0.014, 0.014, 0.022, 6), mSteel, { pos: [0.045 * sx, 0.082, sz * 0.045], cast: false }));
    }
    // 木割れ・腐朽
    p.add(mesh(box(0.004, range(rnd, 0.35, 0.75), 0.088), MAT.paint('#4a3826', { steps: 2, shadowAmt: 1 }), { pos: [0.02, TOP * 0.55, 0.012], cast: false, name: 'shake' }));
    weather(p, { w: 0.11, h: 0.4, pos: [0, 0.34, 0.045], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + (sx + 1) * 7, density: 1.7, spread: 0.06 });
    weather(p, { w: 0.11, h: 0.36, pos: [0.045, 0.9, 0], rot: [0, 90 * D2R, 0], kind: 'chip', color: '#c1a97e', opacity: 0.5, seed: seed + (sx + 1) * 13, density: 1.3, spread: 0.08 });
    g.add(p);
  }

  /* ---------- 枠（上下の見付 + 側框 + 屋根小板） ---------- */
  const board = grp('board', { pos: [0, TOP, 0] });
  g.add(board);
  const FT = 0.052;
  board.add(mesh(box(BW + 0.09, FT, 0.1), mFrame, { pos: [0, BH / 2 + FT / 2, 0], name: 'rail-top' }));
  board.add(mesh(box(BW + 0.09, FT, 0.1), mFrame, { pos: [0, -BH / 2 - FT / 2, 0], name: 'rail-bottom' }));
  for (const sx of [-1, 1]) board.add(mesh(box(FT, BH, 0.1), mFrame, { pos: [sx * (BW / 2 + FT / 2), 0, 0], name: 'stile' }));
  // 版面（前後两面）— 枠より 3mm 奥（面一にしない）
  board.add(mesh(box(BW, BH, 0.026), mFace, { pos: [0, 0, 0.016], name: 'face-front', cast: false }));
  board.add(mesh(box(BW, BH, 0.026), mFaceBack, { pos: [0, 0, -0.016], name: 'face-back', cast: false }));
  // 板裏（合板）
  board.add(mesh(box(BW - 0.02, BH - 0.02, 0.012), MAT.paper({ color: '#a89272' }), { pos: [0, 0, -0.036], cast: false }));
  // 小さな屋根（トタン）
  const cap = grp('cap', { pos: [0, BH / 2 + FT + 0.03, 0] });
  cap.add(mesh(box(BW + 0.2, 0.016, 0.2), MAT.galvanized({ uv: { repeat: [0.4, 0.4] } }), { pos: [0, 0.03, -0.02], rot: [-8 * D2R, 0, 0] }));
  cap.add(mesh(box(BW + 0.2, 0.03, 0.02), MAT.galvanized({ uv: { repeat: [0.4, 0.4] } }), { pos: [0, 0.045, 0.055] }));
  board.add(cap);
  // ネジ・締め直し跡
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    board.add(mesh(cyl(0.011, 0.011, 0.014, 6), mSteel, { pos: [sx * (BW / 2 - 0.055), sy * (BH / 2 - 0.055), 0.032], rot: [90 * D2R, 0, 0], cast: false }));
    board.add(mesh(cyl(0.011, 0.011, 0.014, 6), mSteel, { pos: [sx * (BW / 2 - 0.055), sy * (BH / 2 - 0.055), -0.032], rot: [90 * D2R, 0, 0], cast: false }));
  }

  /* ---------- 下部の補助札（時刻・駅距離） ---------- */
  {
    const sub = grp('sub-plate', { pos: [0.18, -BH / 2 - FT - 0.14, 0.01] });
    sub.add(mesh(rbox(0.5, 0.16, 0.016, 0.006, 2), MAT.paper({ color: '#efe9d8' }), { name: 'sub-board' }));
    decal(sub, { map: TEX.signboard({ text: 'つぎ かわいはら', sub: '0.8 km', bg: '#efe9d8', fg: '#4a5a68' }), w: 0.46, h: 0.13, pos: [0, 0, 0.011], order: 1 });
    weather(sub, { w: 0.3, h: 0.1, pos: [0.1, -0.03, 0.012], kind: 'dirt', color: '#9a8a68', opacity: 0.45, seed: seed + 21, density: 1.4, spread: 0.02 });
    board.add(sub);
  }

  /* ---------- 経年：水洟・日焼け・貼紙・落書き除去 ---------- */
  weather(board, { w: 0.9, h: 0.14, pos: [0, -BH / 2 + 0.05, 0.031], rot: [0, 0, 0], kind: 'dirt', color: '#8d8270', opacity: 0.35, seed: seed + 31, density: 1.5, spread: 0.02 });
  weather(board, { w: 0.6, h: 0.3, pos: [-0.2, 0.02, 0.031], kind: 'scratch', color: '#efeade', opacity: 0.3, seed: seed + 32, density: 0.8, spread: 0.02 });
  decal(board, { map: TEX.wear({ kind: 'scratch', color: '#e8e2d0', seed: seed + 33, density: 0.6 }), w: 0.34, h: 0.2, pos: [0.26, -0.06, 0.032], opacity: 0.5, order: 2 });
  // 貼りかけの小さなステッカー（角が捲れている）
  {
    const st = grp('sticker', { pos: [-BW / 2 - 0.01, BH / 2 - 0.02, 0.03], rot: [0, 0, 7 * D2R] });
    st.add(mesh(box(0.11, 0.08, 0.004), MAT.paper({ color: '#f2dfae' }), { cast: false }));
    st.add(mesh(box(0.11, 0.016, 0.004), MAT.paper({ color: '#d8c896' }), { pos: [0, -0.048, 0.004], rot: [-24 * D2R, 0, 0], cast: false }));
    board.add(st);
  }
  // 鳥糞・柱の打痕
  weather(g, { w: 0.1, h: 0.22, pos: [0.41, 1.02, 0.05], kind: 'dirt', color: '#eae4d2', opacity: 0.5, seed: seed + 35, density: 1.2, spread: 0.03 });
  for (let i = 0; i < 3; i++) {
    g.add(mesh(rbox(0.02, 0.03, 0.012, 0.006, 2), mFrame2, { pos: [-0.41 + range(rnd, -0.02, 0.02), range(rnd, 0.3, 1.0), 0.045], rot: [0, 0, range(rnd, -0.5, 0.5)], cast: false }));
  }

  return finish(g, { outline: 'normal', minSize: 0.04 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
