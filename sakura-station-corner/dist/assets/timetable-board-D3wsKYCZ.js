import { g as grp, M as MAT, T as TEX, n as range, m as mesh, c as cyl, P as PAL, b as box, w as weather, h as decal, p as shadowBlob, q as finish, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-CxdYZv8e.js';

//  assets/station/timetable-board.js —— 時刻表看板（アクリル黄変・枠のネジと錆・雨だれ・貼紙）
//  原点 = 床面接触中心 / +Y 上 / 読取面 +Z。装配例：(−3.6, −11.5) rotY=180（線路側へ向ける）。
//  build({ seed })

const meta = {
  id: 'timetable-board',
  real: [1.06, 1.88, 0.31],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 7307 };

const D2R = Math.PI / 180;

/** 便数の入った時刻表（下り／上り）。mode は TEX.lightPanel のキャッシュ鍵を分ける印でもある。 */
function sheetTex(kind, tag) {
  const rows = kind === 'down'
    ? [{ t: '06 42', v: '河合原行' }, { t: '07 58', v: '河合原行' }, { t: '09 14', v: '富士見行' }, { t: '12 06', v: '河合原行' }]
    : [{ t: '07 12', v: '桜ヶ丘行' }, { t: '08 31', v: '桜ヶ丘行' }, { t: '10 05', v: '桜ヶ丘行' }, { t: '13 22', v: '富士見行' }];
  return TEX.lightPanel({ rows, bg: kind === 'down' ? '#f7f2e2' : '#f4f0e4', fg: '#3b3527', mode: 'tt' + tag, spacing: 2 });
}
/** 手書き風の運賃表（右下に貼った小紙片） */
function fareTex() {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f2ecda'; g.fillRect(0, 0, w, h);
  jpText(g, '運 賃', { x: w / 2, y: h * 0.2, size: h * 0.16, color: '#3d3527', weight: 800, spacing: 6 });
  g.strokeStyle = 'rgba(60,50,35,0.5)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const y = h * (0.34 + i * 0.16); g.beginPath(); g.moveTo(w * 0.12, y); g.lineTo(w * 0.88, y); g.stroke(); }
  jpText(g, '大人 170円', { x: w * 0.4, y: h * 0.42, size: h * 0.1, color: '#4a4234', weight: 700 });
  jpText(g, '小人  90円', { x: w * 0.4, y: h * 0.58, size: h * 0.1, color: '#4a4234', weight: 700 });
  jpText(g, '春季ダイヤ 4/1〜', { x: w * 0.42, y: h * 0.82, size: h * 0.08, color: '#7a6f5a', weight: 600 });
  g.globalAlpha = 0.14;
  for (let i = 0; i < 500; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#7a6a4c'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 2); }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 7307;
  const rnd = rand(seed);
  const g = grp('timetable-board');

  const CASE_W = 0.86, CASE_H = 0.62, CASE_D = 0.1;
  const CY = 1.42;                                  // ケース中心の高さ

  const mFrame = MAT.metalPaint('#8c8f88', { worn: 1.25, base: '#b3b6ae', uv: { repeat: [0.35, 0.35] } });
  const mBack = MAT.metalPaint('#7d817a', { worn: 1.1, base: '#9ea29b', uv: { repeat: [0.4, 0.4] } });
  const mPost = MAT.metalPaint('#7f8580', { worn: 1.35, base: '#a4a9a3', uv: { repeat: [0.4, 0.22] } });
  const mIron = MAT.darkIron({ worn: 1.3, uv: { repeat: [0.5, 0.5] } });
  const mScrew = MAT.metal('#a9a49c', { worn: 1.1, uv: { repeat: [0.5, 0.5] } });
  // アクリル（黄変・磨き傷）
  const mAcrylic = MAT.glassLite({
    color: '#e7dcb6', opacity: 0.34, spec: 0.9, specPower: 230, specCut: 0.05, rim: 0.42, steps: 2,
    map: TEX.frost({ repeat: 2 }).map,
  });

  /* ══════════════════════════════════════════ 支柱（2 本）と基礎 */
  for (const sx of [-1, 1]) {
    const p = grp(`post-${sx > 0 ? 'e' : 'w'}`, { pos: [sx * (CASE_W / 2 - 0.09), 0, -0.01], rot: [range(rnd, -0.4, 0.4) * D2R, 0, sx * range(rnd, -0.5, 0.5) * D2R] });
    p.add(mesh(cyl(0.032, 0.036, CY - 0.5, 12), mPost, { pos: [0, (CY - 0.5) / 2 + 0.06, 0], name: 'post' }));
    p.add(mesh(cyl(0.05, 0.056, 0.07, 12), mPost, { pos: [0, 0.09, 0] }));                      // 根部のカラー
    p.add(mesh(cyl(0.028, 0.028, 0.02, 10), mIron, { pos: [0, 0.132, 0] }));
    p.add(mesh(box(0.11, 0.05, 0.11), MAT.concrete({ base: PAL.concreteDark, repeat: 1, cracked: true }), { pos: [0, 0.025, 0], name: 'footing' }));
    for (let i = 0; i < 2; i++) {
      p.add(mesh(cyl(0.009, 0.01, 0.055, 6), mIron, { pos: [(i ? 1 : -1) * 0.045, 0.06, 0.05], cast: false }));
      p.add(mesh(cyl(0.012, 0.012, 0.016, 6), mScrew, { pos: [(i ? 1 : -1) * 0.045, 0.092, 0.05], cast: false }));
    }
    weather(p, { w: 0.09, h: 0.6, pos: [0.03, 0.42, 0.03], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + (sx + 1) * 9, density: 1.8, spread: 0.05 });
    weather(p, { w: 0.1, h: 0.3, pos: [-0.03, 1.0, 0.02], rot: [0, -90 * D2R, 0], kind: 'dirt', color: '#5f5a4c', opacity: 0.4, seed: seed + (sx + 1) * 19, density: 1.4, spread: 0.06 });
    g.add(p);
  }

  /* ══════════════════════════════════════════ ケース（枠・背面・アクリル） */
  const cs = grp('case', { pos: [0, CY, 0] });
  g.add(cs);
  const FW = 0.045;
  cs.add(mesh(box(CASE_W, CASE_H, CASE_D), mBack, { pos: [0, 0, -CASE_D / 2 + 0.008], name: 'case-back' }));
  cs.add(mesh(box(CASE_W + FW, FW, CASE_D + 0.02), mFrame, { pos: [0, CASE_H / 2 + FW / 2 - 0.005, 0], name: 'frame-top' }));
  cs.add(mesh(box(CASE_W + FW, FW * 1.2, CASE_D + 0.03), mFrame, { pos: [0, -CASE_H / 2 - FW / 2 + 0.005, 0], name: 'frame-bottom' }));
  for (const sx of [-1, 1]) cs.add(mesh(box(FW, CASE_H + FW * 2, CASE_D + 0.02), mFrame, { pos: [sx * (CASE_W / 2 + FW / 2 - 0.005), 0, 0], name: 'frame-side' }));
  // 枠のリベット（4 辺）
  for (let i = 0; i < 9; i++) {
    const x = -CASE_W / 2 + i * (CASE_W / 8);
    cs.add(mesh(cyl(0.007, 0.007, 0.012, 6), mScrew, { pos: [x, CASE_H / 2 + 0.02, 0.055], rot: [90 * D2R, 0, 0], cast: false }));
    cs.add(mesh(cyl(0.007, 0.007, 0.012, 6), mScrew, { pos: [x, -CASE_H / 2 - 0.024, 0.055], rot: [90 * D2R, 0, 0], cast: false }));
  }
  for (let i = 0; i < 5; i++) {
    const y = -CASE_H / 2 + 0.06 + i * ((CASE_H - 0.12) / 4);
    for (const sx of [-1, 1]) cs.add(mesh(cyl(0.007, 0.007, 0.012, 6), mScrew, { pos: [sx * (CASE_W / 2 + 0.022), y, 0.055], rot: [90 * D2R, 0, 0], cast: false }));
  }
  // 開閉蝶番と留め金（右側）
  for (const sy of [-1, 1]) {
    cs.add(mesh(box(0.05, 0.06, 0.02), mIron, { pos: [CASE_W / 2 + 0.04, sy * 0.2, 0.02] }));
    cs.add(mesh(cyl(0.008, 0.008, 0.06, 8), mScrew, { pos: [CASE_W / 2 + 0.04, sy * 0.2, 0.02], rot: [0, 0, 90 * D2R] }));
  }
  cs.add(mesh(box(0.06, 0.03, 0.022), mIron, { pos: [-CASE_W / 2 - 0.03, 0, 0.03], name: 'catch' }));

  /* ══════════════════════════════════════════ 中の紙（時刻表 2 枚・運賃小札） */
  {
    const papers = grp('papers');
    cs.add(papers);
    const sheet = (tex, x, w, h, rot, tag) => {
      const pg = grp(`sheet-${tag}`, { pos: [x, 0.01, -0.028], rot: [0, 0, rot * D2R] });
      pg.add(mesh(box(w, h, 0.0016), MAT.paper({ color: '#ffffff', map: tex, uv: { repeat: [1, 1] }, shadowAmt: 0.72, steps: 2 }), { name: `paper-${tag}`, cast: false }));
      // 紙の捲れ（下端が浮いている）
      pg.add(mesh(box(w, 0.02, 0.006), MAT.paper({ color: '#f2ecd8' }), { pos: [0, -h / 2 + 0.012, 0.004], rot: [12 * D2R, 0, 0], cast: false }));
      papers.add(pg);
      return pg;
    };
    sheet(sheetTex('down', 'a'), -CASE_W * 0.25, CASE_W * 0.46, CASE_H * 0.86, -0.7, 'down');
    sheet(sheetTex('up', 'b'), CASE_W * 0.25, CASE_W * 0.46, CASE_H * 0.86, 0.5, 'up');
    // 見出し（下り／上り）
    for (const [x, t] of [[-CASE_W * 0.25, '下り'], [CASE_W * 0.25, '上り']]) {
      const hd = grp('sheet-head', { pos: [x, CASE_H * 0.44, -0.026] });
      hd.add(mesh(box(0.19, 0.05, 0.004), MAT.paint(PAL.signBlue, { steps: 2, spec: 0.12 }), { cast: false }));
      decal(hd, { map: TEX.signboard({ text: t, bg: PAL.signBlue, fg: '#f6f4e8' }), w: 0.17, h: 0.042, pos: [0, 0, 0.004], order: 1 });
      papers.add(hd);
    }
    // 運賃小札（右上にビニールテープで仮貼り）
    const fare = grp('fare', { pos: [CASE_W * 0.25 - 0.02, -CASE_H * 0.3, -0.022], rot: [0, 0, -4 * D2R] });
    fare.add(mesh(box(0.2, 0.2, 0.003), MAT.paper({ color: '#f2ecda', map: fareTex() }), { cast: false }));
    fare.add(mesh(box(0.075, 0.02, 0.002), MAT.hardPlastic('#e6e2d2', { repeat: 6, opacity: 0.7, transparent: true }), { pos: [-0.04, 0.09, 0.004], rot: [0, 0, 20 * D2R], cast: false }));
    papers.add(fare);
    weather(papers, { w: 0.3, h: 0.2, pos: [-0.2, -0.16, -0.024], kind: 'dirt', color: '#a89258', opacity: 0.45, seed: seed + 31, density: 1.6, spread: 0.02 });
    weather(papers, { w: 0.24, h: 0.34, pos: [0.24, 0.1, -0.025], kind: 'chip', color: '#efe7cf', opacity: 0.4, seed: seed + 32, density: 1.2, spread: 0.02 });
  }
  // アクリル前面（黄変・磨き傷・内側の結露跡）
  cs.add(mesh(box(CASE_W - 0.005, CASE_H - 0.005, 0.008), mAcrylic, { pos: [0, 0, CASE_D / 2 - 0.004], name: 'acrylic', cast: false }));
  weather(cs, { w: 0.4, h: 0.24, pos: [-0.16, 0.12, CASE_D / 2 + 0.002], kind: 'scratch', color: '#efe9d2', opacity: 0.22, seed: seed + 35, density: 1.2, spread: 0.02 });
  // 押さえプラ枠（4 本）
  for (const [w, h, x, y] of [[CASE_W + 0.02, 0.022, 0, CASE_H / 2 - 0.006], [CASE_W + 0.02, 0.022, 0, -CASE_H / 2 + 0.006]]) {
    cs.add(mesh(box(w, h, 0.014), mFrame, { pos: [x, y, CASE_D / 2 + 0.002], cast: false }));
  }
  for (const sx of [-1, 1]) cs.add(mesh(box(0.022, CASE_H + 0.02, 0.014), mFrame, { pos: [sx * (CASE_W / 2 - 0.006), 0, CASE_D / 2 + 0.002], cast: false }));

  /* ══════════════════════════════════════════ 屋根（雨だれの発生源）と水切 */
  {
    const cap = grp('roof', { pos: [0, CY + CASE_H / 2 + FW + 0.04, -0.01] });
    cap.add(mesh(box(CASE_W + 0.2, 0.018, 0.28), MAT.galvanized({ uv: { repeat: [0.35, 0.6] } }), { pos: [0, 0.02, 0.02], rot: [-9 * D2R, 0, 0], name: 'roof-plate' }));
    cap.add(mesh(box(CASE_W + 0.2, 0.026, 0.022), MAT.galvanized({ uv: { repeat: [0.35, 0.6] } }), { pos: [0, 0.055, 0.13] }));      // 前端の雨切り
    cap.add(mesh(box(CASE_W + 0.16, 0.05, 0.02), mFrame, { pos: [0, 0.02, -0.09] }));
    for (let i = 0; i < 3; i++) cap.add(mesh(cyl(0.008, 0.008, 0.02, 6), mIron, { pos: [-CASE_W / 2 + 0.1 + i * (CASE_W - 0.2) / 2, 0.032, 0.02], cast: false }));
    weather(cap, { w: CASE_W * 0.7, h: 0.14, pos: [0, 0.033, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 41, density: 1.7, spread: 0.02 });
    g.add(cap);
  }
  // 屋根から回り込んだ雨だれ
  for (const sx of [-1, 1]) {
    weather(cs, { w: 0.06, h: CASE_H * 0.9, pos: [sx * (CASE_W / 2 + 0.012), -0.06, 0.056], kind: 'dirt', color: '#6c6350', opacity: 0.42, seed: seed + (sx + 1) * 47, density: 1.6, spread: 0.02 });
  }

  /* ══════════════════════════════════════════ 枠の錆・貼紙あと */
  weather(cs, { w: CASE_W * 0.8, h: 0.1, pos: [0, -CASE_H / 2 - 0.02, 0.056], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 51, density: 2.0, spread: 0.02 });
  weather(cs, { w: 0.2, h: 0.12, pos: [-CASE_W / 2 + 0.08, CASE_H / 2 - 0.06, 0.058], kind: 'chip', color: '#cfc9b6', opacity: 0.5, seed: seed + 52, density: 1.5, spread: 0.02 });
  decal(cs, { map: TEX.wear({ kind: 'scratch', color: '#f0e8d0', seed: seed + 53, density: 0.8 }), w: 0.18, h: 0.1, pos: [CASE_W / 2 - 0.1, -CASE_H / 2 + 0.09, 0.06], opacity: 0.6, order: 2 });
  shadowBlob(g, { r: 0.3, pos: [0, 0.004, -0.01], opacity: 0.24, ratio: 0.5 });

  return finish(g, { outline: 'normal', minSize: 0.035 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
