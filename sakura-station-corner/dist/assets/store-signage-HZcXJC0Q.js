import { g as grp, q as finish, M as MAT, P as PAL, m as mesh, r as rbox, b as box, c as cyl, w as weather, n as range, h as decal, T as TEX, p as shadowBlob, k as tubeOf, X as cone, a as sph, Y as memo, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-D8uBk-tk.js';

//  assets/store/store-signage.js —— 店招（fascia 文字看板）/ 立柱看板（pylon）/ 角柱看板（pillar）
//  fascia: 原点 = 女墙上の据付線中心（+Z = 正面）  pylon / pillar: 原点 = 地面接触中心（+Z = 正面）

const meta = {
  id: 'store-signage',
  // fascia [5.13, 2.02, 0.40]（女墙埋め込み 0.47 を含む）/ pylon [1.14, 2.71, 0.60] / pillar [0.72, 2.99, 0.72]
  real: [5.13, 2.02, 0.40],
  origin: 'kind=fascia → 女墙天端の据付線中心 / kind=pylon|pillar → 地面接触中心（+Z 正面）',
};

const DEFAULT_OPTIONS = { kind: 'fascia', seed: 33 };

const noOut = (o) => { o.userData.noOutline = true; return o; };
const D2R = Math.PI / 180;
const NAME = 'サクラ・マート';

/** チャンネル文字用：TEX.signboard は 1024×256 の横長なので、1 字を正方形の
 *  文字盤に貼ると上下に引き伸ばされて「黒い帯」になる。1 字 = 1 枚の正方形で描く。 */
function charFace(ch, bg = '#fbf8f0', fg = '#33414f') {
  return memo(`sign-char|${ch}|${bg}|${fg}`, () => {
    const cv = makeCanvas(256, 256);
    if (!cv) return null;
    const { g, w, h, rnd } = cv;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    jpText(g, ch, { x: w / 2, y: h * 0.53, size: 200, color: fg, weight: 800, spacing: 0 });
    // アクリルの経年黄変・端の擦れ・埃
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,226,164,0.30)');
    gr.addColorStop(0.55, 'rgba(255,240,210,0.06)');
    gr.addColorStop(1, 'rgba(214,204,182,0.20)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${150 + rnd() * 70 | 0},${140 + rnd() * 60 | 0},${120 + rnd() * 60 | 0},${0.04 + rnd() * 0.1})`;
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 3);
    }
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.16})`; g.lineWidth = 1 + rnd() * 2;
      g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke();
    }
    g.strokeStyle = 'rgba(120,112,96,0.35)'; g.lineWidth = 5;
    g.strokeRect(2, 2, w - 4, h - 4);
    return toTexture(cv, { repeat: 1, aniso: 8 });
  });
}

/* 共通材質（アルミ複合板・塗装鉄・亜鉛・コンクリート・塩ビ） */
function kit(seed) {
  const alu = MAT.metal('#c7cbc7', { worn: 0.55, repeat: 3 });
  const aluDk = MAT.metal('#a8adaf', { worn: 0.85, repeat: 4 });
  const galv = MAT.galvanized({ repeat: 3 });
  const iron = MAT.darkIron({ repeat: 4 });
  const stainless = MAT.stainless({ repeat: 8 });
  const faceWhite = MAT.hardPlastic('#f7f4e9', { repeat: 2, sat: 0.9, tint: '#f8efdc' });
  const faceDark = MAT.hardPlastic('#2f3a44', { repeat: 2, spec: 0.45, shadowAmt: 0.9 });
  const concrete = MAT.concrete({ base: PAL.concrete, repeat: 2, cracked: 1, joints: 2 });
  const bandBlue = MAT.metalPaint(PAL.storeBand, { worn: 0.6, repeat: 3 });
  const bandYel = MAT.metalPaint(PAL.storeBand2, { worn: 0.66, repeat: 3 });
  const bandRed = MAT.metalPaint(PAL.storeBand3, { worn: 0.66, repeat: 3 });
  const seal = MAT.paint('#4a4a45', { steps: 2, spec: 0.1, sheen: 0, shadowAmt: 0.98 });
  const cable = MAT.rubber('#2b2e31');
  return { alu, aluDk, galv, iron, stainless, faceWhite, faceDark, concrete, bandBlue, bandYel, bandRed, seal, cable, seed };
}

/** 六角ボルト（頭＋ワッシャ＋座金） */
function bolt(parent, K, x, y, z, rot = [Math.PI / 2, 0, 0], r = 0.009) {
  parent.add(noOut(mesh(cyl(r, r, 0.008, 6), K.stainless, { pos: [x, y, z], rot, cast: false })));
  parent.add(noOut(mesh(cyl(r * 1.6, r * 1.6, 0.003, 10), K.aluDk, { pos: [x, y, z], rot, cast: false })));
}

/* ------------------------------------------------------------------ */
/* kind = fascia ：屋根上の文字看板（チャンネル文字＋支持鉄骨＋配線）  */
/* ------------------------------------------------------------------ */
function buildFascia(g, K, seed, rnd) {
  const LW = 0.58, LH = 0.62, LP = 0.10, gap = 0.705;
  const chars = [...NAME];
  const totalW = (chars.length - 1) * gap;
  const baseY = 0.62;                       // 文字下端（鉄骨の上）
  const BW = totalW + 0.86, BH = 0.92;      // 野板の寸法

  // ---- 支持鉄骨（水平レール 2 本＋柱 4 本＋据付ボルト） ----
  const steel = grp('steel-frame');
  g.add(steel);
  for (const [ry, rz] of [[baseY + 0.62, -0.14], [baseY - 0.10, -0.14], [baseY + 0.26, -0.22]]) {
    steel.add(mesh(rbox(BW - 0.12, 0.052, 0.052, 0.006, 2), K.iron, { pos: [0, ry, rz] }));
    steel.add(mesh(box(BW - 0.12, 0.012, 0.058), K.aluDk, { pos: [0, ry + 0.028, rz] }));
  }
  const postXs = [-BW / 2 + 0.30, -BW / 6, BW / 6, BW / 2 - 0.30];
  for (const px of postXs) {
    steel.add(mesh(box(0.072, baseY + 0.70 + 0.46, 0.060), K.iron, { pos: [px, (baseY + 0.70 - 0.46) / 2, -0.18] }));
    steel.add(mesh(rbox(0.13, 0.014, 0.12, 0.004, 2), K.galv, { pos: [px, -0.452, -0.18] }));       // 天端のベースプレート
    for (const bx of [-0.045, 0.045]) {
      steel.add(noOut(mesh(cyl(0.0088, 0.0088, 0.050, 6), K.iron, { pos: [px + bx, -0.44, -0.18] })));
      bolt(steel, K, px + bx, -0.414, -0.18, [0, 0, 0], 0.0115);
    }
    for (const by of [baseY + 0.62, baseY - 0.10]) bolt(steel, K, px, by, -0.146, [Math.PI / 2, 0, 0], 0.0082);
    weather(steel, { w: 0.16, h: 0.30, pos: [px + 0.036, baseY - 0.30, -0.18], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + Math.round(10 + px * 10), density: 1.7, spread: 0.02 });
  }
  // 斜め筋交（片側 2 本）
  for (const sx of [-1, 1]) {
    const dx = sx * (BW / 2 - 0.30);
    const brace = mesh(box(0.040, Math.hypot(0.9, 0.9), 0.032), K.iron, { pos: [dx - sx * 0.45, baseY + 0.18, -0.19], rot: [0, 0, sx * 45 * D2R] });
    steel.add(brace);
  }

  // ---- 裏の野板（合板・退色）＋ 前枠 ----
  const back = grp('backer');
  g.add(back);
  back.add(mesh(rbox(BW, BH, 0.016, 0.004, 2), MAT.wood({ base: '#cbc0a8', light: '#d8cdb4', dark: '#9c8d70', repeat: 3 }), { pos: [0, baseY + 0.28, -0.112] }));
  back.add(mesh(box(BW + 0.04, 0.026, 0.040), K.alu, { pos: [0, baseY + 0.76, -0.108] }));           // 天端押え（雨水返し）
  back.add(mesh(box(BW + 0.04, 0.020, 0.030), K.aluDk, { pos: [0, baseY - 0.20, -0.108] }));
  weather(back, { w: BW * 0.42, h: BH * 0.6, pos: [-BW * 0.16, baseY + 0.30, -0.1235], rot: [0, Math.PI, 0], kind: 'dirt', color: '#8b7f68', opacity: 0.42, seed: seed + 12, density: 1.3, spread: 0.03 });
  weather(back, { w: 0.30, h: 0.24, pos: [BW * 0.30, baseY + 0.02, -0.1235], rot: [0, Math.PI, 0], kind: 'moss', color: '#5f7f4a', opacity: 0.5, seed: seed + 13, density: 1.6, spread: 0.02 });
  decal(back, { map: TEX.gradient({ stops: [[0, 'rgba(255,232,186,1)'], [1, 'rgba(255,255,255,0)']] }), w: BW - 0.10, h: BH - 0.10, pos: [0, baseY + 0.28, -0.125], rot: [0, Math.PI, 0], opacity: 0.30 });

  // ---- チャンネル文字（前面発光・側リターン・ボルト止め） ----
  const letters = grp('channel-letters');
  g.add(letters);
  chars.forEach((ch, i) => {
    const x = -totalW / 2 + i * gap;
    const L = grp('letter');
    L.position.set(x, baseY + LH / 2, 0);
    letters.add(L);
    L.add(mesh(rbox(LW, LH, LP, 0.012, 3), K.alu, { pos: [0, 0, -LP / 2 + 0.004] }));                  // 側リターン＋背板
    L.add(mesh(rbox(LW - 0.028, LH - 0.028, 0.012, 0.005, 2), K.faceWhite, { pos: [0, 0, 0.006] }));   // 前面アクリル
    decal(L, { map: charFace(ch), w: LW - 0.05, h: LH - 0.09, pos: [0, 0, 0.0135] });
    // 文字の上下リム（アルミ見切り）
    L.add(mesh(box(LW + 0.010, 0.016, LP + 0.006), K.aluDk, { pos: [0, LH / 2 + 0.006, -LP / 2 + 0.004] }));
    L.add(mesh(box(LW + 0.010, 0.016, LP + 0.006), K.aluDk, { pos: [0, -LH / 2 - 0.006, -LP / 2 + 0.004] }));
    // 文字をレールへ留めるボルト 2 本
    bolt(L, K, -LW * 0.22, -LH * 0.30, -LP + 0.004, [Math.PI / 2, 0, 0], 0.0072);
    bolt(L, K, LW * 0.24, LH * 0.28, -LP + 0.004, [Math.PI / 2, 0, 0], 0.0072);
    // 経年：前面の黄変・上端の鳥糞・リターの錆
    decal(L, { map: TEX.gradient({ stops: [[0, 'rgba(255,226,164,1)'], [0.7, 'rgba(255,240,210,0.35)'], [1, 'rgba(255,255,255,0)']] }), w: LW - 0.03, h: LH - 0.05, pos: [0, 0, 0.0130], opacity: 0.26 + (i % 3) * 0.05 });
    weather(L, { w: 0.24, h: 0.10, pos: [range(rnd, -0.14, 0.14), LH / 2 + 0.004, 0.006], kind: 'dirt', color: '#e9e4d6', opacity: 0.75, seed: seed + 21 + i, density: 1.1, spread: 0.03 });
    if (i % 2 === 0) weather(L, { w: 0.10, h: 0.16, pos: [LW / 2 - 0.01, -LH * 0.24, -LP * 0.55], kind: 'rust', color: '#9a6236', opacity: 0.5, seed: seed + 27 + i, density: 1.4, spread: 0.02 });
  });

  // ---- LED 配線・トランス・アース ----
  const wire = grp('wiring');
  g.add(wire);
  wire.add(mesh(rbox(0.20, 0.14, 0.070, 0.006, 2), K.galv, { pos: [BW / 2 - 0.62, baseY - 0.14, -0.16] }));   // トランス箱
  wire.add(mesh(box(0.20, 0.012, 0.074), K.aluDk, { pos: [BW / 2 - 0.62, baseY - 0.075, -0.16] }));
  bolt(wire, K, BW / 2 - 0.55, baseY - 0.19, -0.122, [Math.PI / 2, 0, 0], 0.0068);
  for (let i = 0; i < chars.length; i++) {
    const x = -totalW / 2 + i * gap;
    wire.add(noOut(mesh(tubeOf([
      [x - 0.10, baseY + 0.02, -0.06], [x - 0.02, baseY - 0.06, -0.118], [x + 0.14, baseY - 0.12, -0.15],
    ], 0.0055, 10, 5), K.cable)));
  }
  wire.add(noOut(mesh(tubeOf([
    [-totalW / 2 + 0.30, baseY - 0.13, -0.15], [0, baseY - 0.20, -0.19], [BW / 2 - 0.72, baseY - 0.14, -0.16],
  ], 0.0075, 18, 6), K.cable)));
  wire.add(noOut(mesh(tubeOf([
    [BW / 2 - 0.62, baseY - 0.21, -0.17], [BW / 2 - 0.60, baseY - 0.44, -0.19], [postXs[3], -0.44, -0.18],
  ], 0.0048, 14, 5), MAT.rubber('#4a5140'))));                                                            // アース
  for (const cx of [-totalW / 2 + 0.6, totalW / 2 - 0.5]) {
    wire.add(noOut(mesh(cyl(0.010, 0.010, 0.020, 8), K.galv, { pos: [cx, baseY + 0.02, -0.14], rot: [Math.PI / 2, 0, 0] })));  // カップリング
  }
  weather(wire, { w: 0.22, h: 0.12, pos: [BW / 2 - 0.62, baseY - 0.20, -0.122], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 33, density: 1.7, spread: 0.01 });

  // ---- 全体：鳥糞の筋・色褪せ・ボルト周りの錆 ----
  const grime = grp('grime');
  g.add(grime);
  for (let i = 0; i < 6; i++) {
    const x = range(rnd, -totalW / 2, totalW / 2);
    decal(grime, { map: TEX.wear({ kind: 'dirt', color: '#efe9db', seed: seed + 41 + i, density: 0.6 }), w: 0.06, h: LH * range(rnd, 0.5, 0.95), pos: [x, baseY + LH / 2 - 0.05, 0.014], opacity: 0.55 });
  }
  weather(steel, { w: 0.6, h: 0.10, pos: [-BW * 0.28, baseY + 0.65, -0.1], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 47, density: 1.5, spread: 0.02 });
  decal(grime, { map: TEX.gradient({ stops: [[0, 'rgba(252,236,196,1)'], [1, 'rgba(255,255,255,0)']] }), w: BW - 0.3, h: 0.30, pos: [0, baseY + LH + 0.16, 0.020], opacity: 0.22 });
}

/* ------------------------------------------------------------------ */
/* kind = pylon ：道路側の独立柱看板                                    */
/* ------------------------------------------------------------------ */
function buildPylon(g, K, seed, rnd) {
  const FW = 1.04, FH = 1.00, FD = 0.17;
  const headY = 2.14;                        // 頭部パネル中心
  const colH = headY - FH / 2 - 0.15;

  // ---- 基礎コンクリート・アースボルト ----
  const fnd = grp('foundation');
  g.add(fnd);
  fnd.add(mesh(rbox(0.84, 0.17, 0.54, 0.020, 2), K.concrete, { pos: [0, 0.085, 0] }));
  fnd.add(mesh(box(0.90, 0.026, 0.60), MAT.concrete({ base: PAL.concreteDark, repeat: 2 }), { pos: [0, 0.012, 0.0] }));
  for (const [bx, bz] of [[-0.24, -0.14], [0.24, -0.14], [-0.24, 0.14], [0.24, 0.14]]) {
    fnd.add(noOut(mesh(cyl(0.0085, 0.0085, 0.10, 6), K.iron, { pos: [bx, 0.21, bz] })));
    fnd.add(noOut(mesh(cyl(0.014, 0.014, 0.010, 6), K.stainless, { pos: [bx, 0.176, bz] })));
    fnd.add(noOut(mesh(cyl(0.020, 0.020, 0.005, 10), K.galv, { pos: [bx, 0.170, bz], cast: false })));
  }
  weather(fnd, { w: 0.5, h: 0.10, pos: [0, 0.026, 0.27], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 51, density: 1.8, spread: 0.03 });
  weather(fnd, { w: 0.34, h: 0.10, pos: [-0.2, 0.14, 0.268], kind: 'dirt', color: '#7d7261', opacity: 0.5, seed: seed + 52, density: 1.5, spread: 0.02 });

  // ---- 柱（角鋼管・溶接シーム・下部錆） ----
  const col = grp('column');
  g.add(col);
  col.add(mesh(box(0.24, colH, 0.22), K.galv, { pos: [0, 0.16 + colH / 2, 0] }));
  col.add(mesh(box(0.014, colH - 0.04, 0.014), K.aluDk, { pos: [0.121, 0.16 + colH / 2, 0.05] }));      // 溶接シーム
  col.add(mesh(rbox(0.30, 0.026, 0.28, 0.006, 2), K.aluDk, { pos: [0, 0.168, 0] }));                     // 仕切り金物
  col.add(mesh(box(0.26, 0.010, 0.24), K.seal, { pos: [0, headY - FH / 2 - 0.012, 0] }));                // 取合シーリング
  for (const sy of [0.36, 0.86, 1.36]) col.add(noOut(mesh(cyl(0.0055, 0.0055, 0.25, 6), K.iron, { pos: [0, 0.16 + sy, 0], rot: [0, 0, Math.PI / 2] })));   // 貫通ボルト
  weather(col, { w: 0.20, h: 0.34, pos: [0.121, 0.36, 0.06], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.62, seed: seed + 55, density: 1.9, spread: 0.05 });
  weather(col, { w: 0.20, h: 0.30, pos: [-0.121, 0.42, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: '#7d5a3a', opacity: 0.55, seed: seed + 56, density: 1.6, spread: 0.05 });
  // 貼紙剥がし跡（柱下部）
  for (let i = 0; i < 4; i++) {
    const a = range(rnd, 0, 6.28), px = Math.cos(a) * 0.121, pz = Math.sin(a) * 0.115;
    decal(col, { map: TEX.wear({ kind: 'chip', color: '#e7dfc9', seed: seed + 58 + i, density: 1.2 }), w: 0.11, h: 0.15, pos: [px, 0.55 + i * 0.16, pz], rot: [0, -a + Math.PI / 2, 0], opacity: 0.6 });
  }

  // ---- 頭部パネル（両面看板・笠金物） ----
  const head = grp('head-panel');
  g.add(head);
  head.add(mesh(rbox(FW, FH, FD, 0.010, 2), K.alu, { pos: [0, headY, 0] }));
  for (const sx of [-1, 1]) head.add(mesh(box(0.016, FH - 0.02, FD + 0.006), K.aluDk, { pos: [sx * (FW / 2 - 0.004), headY, 0] }));
  // 前：店名＋営業時間／後ろ：深夜料金表記
  decal(head, { map: TEX.signboard({ text: NAME, sub: '24 時間営業・年中無休', bg: PAL.storeBand, fg: PAL.paint, stripe: PAL.storeBand2 }), w: FW - 0.10, h: FH - 0.16, pos: [0, headY + 0.02, FD / 2 + 0.004] });
  decal(head, { map: TEX.lightPanel({ text: '深夜料金', bg: '#f6f2e6', fg: '#3b4650', rows: [{ t: '22 時〜 5 時', v: '228 円' }, { t: 'レジ袋', v: '有料' }, { t: '公共料金', v: '取扱い' }] }), w: FW - 0.16, h: FH - 0.20, pos: [0, headY, -0.08900000000000001], rot: [0, Math.PI, 0] });
  // 桜のイラスト（前面右下）＋ 春の帯
  decal(head, { map: TEX.petal({ tone: 1, mode: 'cluster' }), w: 0.24, h: 0.24, pos: [FW / 2 - 0.19, headY - FH / 2 + 0.16, FD / 2 + 0.006], opacity: 0.95 });
  head.add(mesh(box(FW - 0.06, 0.036, 0.012), K.bandRed, { pos: [0, headY - FH / 2 + 0.055, FD / 2 + 0.006] }));
  // 笠金物（防水・コケ）
  const hood = grp('hood');
  g.add(hood);
  hood.add(mesh(rbox(FW + 0.10, 0.036, FD + 0.14, 0.010, 2), K.alu, { pos: [0, headY + FH / 2 + 0.028, 0.014], rot: [-4 * D2R, 0, 0] }));
  hood.add(mesh(box(FW + 0.10, 0.014, 0.018), K.aluDk, { pos: [0, headY + FH / 2 + 0.010, FD / 2 + 0.078] }));
  weather(hood, { w: 0.5, h: 0.10, pos: [-FW * 0.2, headY + FH / 2 + 0.049, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#5f7f4a', opacity: 0.55, seed: seed + 63, density: 1.8, spread: 0.02 });
  // 面板の経年：褪色・雨染み・剥がし跡・固定ボルト
  decal(head, { map: TEX.gradient({ stops: [[0, 'rgba(255,228,170,1)'], [0.6, 'rgba(255,242,214,0.4)'], [1, 'rgba(255,255,255,0)']] }), w: FW - 0.06, h: FH - 0.06, pos: [0, headY + 0.04, FD / 2 + 0.005], opacity: 0.30 });
  for (let i = 0; i < 5; i++) weather(head, { w: 0.05, h: 0.42, pos: [-FW / 2 + 0.12 + i * 0.2, headY - 0.12, FD / 2 + 0.0052], kind: 'dirt', color: '#8b8571', opacity: 0.42, seed: seed + 65 + i, density: 0.8, spread: 0.02 });
  weather(head, { w: 0.30, h: 0.18, pos: [-FW / 2 + 0.24, headY - FH / 2 + 0.12, FD / 2 + 0.0054], kind: 'chip', color: '#ded6c2', opacity: 0.55, seed: seed + 72, density: 1.4, spread: 0.02 });
  for (const [bx, by] of [[-FW / 2 + 0.055, headY + FH / 2 - 0.06], [FW / 2 - 0.055, headY + FH / 2 - 0.06], [-FW / 2 + 0.055, headY - FH / 2 + 0.06], [FW / 2 - 0.055, headY - FH / 2 + 0.06]]) {
    bolt(head, K, bx, by, FD / 2 + 0.006, [Math.PI / 2, 0, 0], 0.0075);
    weather(head, { w: 0.05, h: 0.10, pos: [bx, by - 0.07, FD / 2 + 0.0056], kind: 'rust', color: '#96602f', opacity: 0.45, seed: seed + Math.round(75 + bx * 10), density: 1.0, spread: 0.006 });
  }
  shadowBlob(g, { r: 0.42, pos: [0, 0.004, 0.04], opacity: 0.24, ratio: 0.62 });
}

/* ------------------------------------------------------------------ */
/* kind = pillar ：店舗角の柱看板（タイル巻き・帯・照明・防犯カメラ）   */
/* ------------------------------------------------------------------ */
function buildPillar(g, K, seed, rnd) {
  const CW = 0.46, CH = 2.84;
  const tile = MAT.paint('#efeadb', {
    map: TEX.tile({ color: '#e9e3d3', n: 7, repeat: 2 }).map,
    normalMap: TEX.tile({ color: '#e9e3d3', n: 7, repeat: 2 }).normalMap,
    normalScaleX: 1.1, normalScaleY: 1.1, spec: 0.16, shadowAmt: 0.8, steps: 3,
  });

  // ---- 柱本体（タイル巻き・目地・欠け） ----
  const body = grp('tile-column');
  g.add(body);
  body.add(mesh(box(CW, CH, CW), tile, { pos: [0, CH / 2, 0] }));
  body.add(mesh(rbox(CW + 0.024, 0.070, CW + 0.024, 0.008, 2), K.alu, { pos: [0, 0.035, 0] }));        // 底部アルミ見切り
  body.add(mesh(box(CW + 0.010, 0.022, CW + 0.010), K.aluDk, { pos: [0, CH + 0.011, 0] }));            // 天端キャップ
  for (const sx of [-1, 1]) body.add(mesh(box(0.018, CH - 0.09, 0.018), K.alu, { pos: [sx * (CW / 2 + 0.004), CH / 2, CW / 2 + 0.004] }));  // 角アルミ金物
  weather(body, { w: 0.34, h: 0.30, pos: [0, 0.28, CW / 2 + 0.003], kind: 'chip', color: '#bdb6a4', opacity: 0.55, seed: seed + 81, density: 1.3, spread: 0.04 });
  weather(body, { w: 0.30, h: 0.40, pos: [-0.233, 0.40, -0.04], rot: [0, -Math.PI / 2, 0], kind: 'dirt', color: '#8b8271', opacity: 0.5, seed: seed + 82, density: 1.6, spread: 0.06 });
  decal(body, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 83, density: 0.9 }), w: CW * 0.8, h: 0.5, pos: [0, 1.05, CW / 2 + 0.0032], opacity: 0.3 });

  // ---- 三色帯（上部ラップ）＋ 文字面 ----
  const bandG = grp('bands');
  g.add(bandG);
  const bands = [{ c: K.bandBlue, h: 0.100, y: 2.500 }, { c: K.bandYel, h: 0.070, y: 2.411 }, { c: K.bandRed, h: 0.070, y: 2.338 }];
  for (const b of bands) bandG.add(mesh(box(CW + 0.020, b.h, CW + 0.020), b.c, { pos: [0, b.y, 0] }));
  const plate = grp('plate');
  g.add(plate);
  // 正面：店名プレート＋営業時間プレート（柱から 9mm 浮かせて干渉なし）
  plate.add(mesh(rbox(0.36, 0.46, 0.014, 0.004, 2), K.faceWhite, { pos: [0, 1.86, CW / 2 + 0.016] }));
  decal(plate, { map: TEX.signboard({ text: NAME, sub: '駅前三丁目 2-14', bg: PAL.paint, fg: '#3a4a58', stripe: PAL.storeBand, ar: 0.78 }), w: 0.31, h: 0.40, pos: [0, 1.86, CW / 2 + 0.025] });
  plate.add(mesh(rbox(0.30, 0.30, 0.012, 0.004, 2), K.faceWhite, { pos: [0, 1.42, CW / 2 + 0.015] }));
  decal(plate, { map: TEX.lightPanel({ text: '24H', bg: '#f7f2e4', fg: '#3d4a54', rows: [{ t: '営業時間', v: '常時' }, { t: '深夜料金', v: '二百二十八円' }] }), w: 0.26, h: 0.26, pos: [0, 1.42, CW / 2 + 0.023] });
  // 側面（+X）：営業時間帯プレート／背面（-Z）：ATM・公共料金プレート
  plate.add(mesh(rbox(0.36, 0.30, 0.012, 0.004, 2), K.faceWhite, { pos: [CW / 2 + 0.015, 1.16, 0], rot: [0, Math.PI / 2, 0] }));
  decal(plate, { map: TEX.signboard({ text: '営業時間', sub: '24 時間 / 年中無休', bg: PAL.storeBand2, fg: '#3b3a34', ar: 1.36 }), w: 0.30, h: 0.22, pos: [CW / 2 + 0.023, 1.16, 0], rot: [0, Math.PI / 2, 0] });
  plate.add(mesh(rbox(0.34, 0.34, 0.012, 0.004, 2), K.faceWhite, { pos: [0.02, 1.90, -0.246], rot: [0, Math.PI, 0] }));
  decal(plate, { map: TEX.signboard({ text: '公共料金払込', sub: '収納代行・ATM 併設', bg: '#f2ede0', fg: '#4a5560', stripe: PAL.storeBand3 }), w: 0.28, h: 0.28, pos: [0.02, 1.90, -0.255], rot: [0, Math.PI, 0] });
  for (const [bx, by] of [[-0.15, 2.06], [0.15, 2.06], [-0.15, 1.66], [0.15, 1.66]]) bolt(plate, K, bx, by, CW / 2 + 0.024, [Math.PI / 2, 0, 0], 0.0070);
  weather(plate, { w: 0.20, h: 0.14, pos: [0.06, 1.70, CW / 2 + 0.0252], kind: 'dirt', color: '#8b8571', opacity: 0.45, seed: seed + 86, density: 1.4, spread: 0.02 });
  for (let i = 0; i < 3; i++) {
    const a = range(rnd, 0, 6.283), px = Math.cos(a) * (CW / 2 + 0.024), pz = Math.sin(a) * (CW / 2 + 0.024);
    decal(plate, { map: TEX.wear({ kind: 'chip', color: '#efe7d2', seed: seed + 88 + i, density: 1.0 }), w: 0.09, h: 0.12, pos: [px, 1.05 + i * 0.2, pz], rot: [0, -a + Math.PI / 2, 0], opacity: 0.55 });
  }

  // ---- 上部照明（看板を照らすアッパーライト） ----
  const lamp = grp('pillar-lamp');
  lamp.position.set(0, 2.24, CW / 2 + 0.06);
  g.add(lamp);
  lamp.add(mesh(rbox(0.16, 0.050, 0.10, 0.010, 2), K.alu, { pos: [0, 0, 0] }));
  lamp.add(mesh(rbox(0.13, 0.014, 0.078, 0.004, 2), MAT.lampShade({ color: '#fff6e4', emissive: '#ffdca6', emissiveIntensity: 0.95 }), { pos: [0, 0.028, 0.004], rot: [-22 * D2R, 0, 0] }));
  lamp.add(mesh(box(0.030, 0.058, 0.034), K.aluDk, { pos: [0, 0.0, -0.06] }));
  bolt(lamp, K, 0, 0.0, -0.076, [0, 0, Math.PI / 2], 0.0066);
  lamp.add(noOut(mesh(tubeOf([[0, -0.02, -0.07], [-0.05, -0.1, -0.076], [-0.06, -0.3, -0.05]], 0.0045, 10, 5), K.cable)));
  lamp.userData.breathe = { speed: 0.5, amount: 0.08, phase: seed % 5 };
  weather(lamp, { w: 0.12, h: 0.05, pos: [0, -0.024, 0.02], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 91, density: 1.4, spread: 0.01 });

  // ---- 防犯カメラ風（トップ隅・ドーム＋金物＋ケーブル＋録画中 LED） ----
  const cam = grp('cctv');
  cam.position.set(CW / 2 - 0.02, CH + 0.10, CW / 2 - 0.02);
  g.add(cam);
  cam.add(mesh(rbox(0.10, 0.028, 0.10, 0.006, 2), K.alu, { pos: [0.02, 0.014, 0.02] }));                    // 直付ベース
  cam.add(noOut(mesh(cyl(0.016, 0.016, 0.060, 10), K.aluDk, { pos: [0.05, -0.016, 0.05], rot: [0, 0, 28 * D2R] })));
  const head = grp('cam-head');
  head.position.set(0.086, -0.05, 0.086);
  head.rotation.set(0.34, -0.78, 0.20);
  cam.add(head);
  head.add(mesh(cone(0.042, 0.048, 14), K.faceWhite, { pos: [0, -4e-3, 0], rot: [Math.PI, 0, 0] }));        // 防雨フード
  head.add(mesh(cyl(0.034, 0.030, 0.062, 14), K.faceWhite, { pos: [0, -0.046, 0] }));
  head.add(noOut(mesh(sph(0.027, 12, 9), MAT.glassLite({ color: '#2a3138', opacity: 0.62, depthWrite: false }), { pos: [0, -0.078, 0], cast: false })));
  head.add(noOut(mesh(cyl(0.016, 0.016, 0.006, 12), MAT.darkIron({ repeat: 6 }), { pos: [0, -0.08, 0], rot: [Math.PI / 2, 0, 0] })));
  const led = grp('cam-led');
  led.position.set(0.026, -0.056, 0.018);
  head.add(led);
  led.add(noOut(mesh(sph(0.0042, 8, 6), MAT.ledOn('#ff6b5e'), { cast: false })));
  led.userData.breathe = { speed: 0.9, amount: 0.55, phase: 0.4 };
  cam.add(noOut(mesh(tubeOf([[0.02, 0.0, 0.02], [-0.03, -0.02, 0.0], [-0.1, -0.05, -0.04], [-0.16, -0.12, -0.1]], 0.0048, 14, 5), K.cable)));
  weather(cam, { w: 0.10, h: 0.08, pos: [0.03, 0.03, 0.06], kind: 'dirt', color: '#7f7a68', opacity: 0.5, seed: seed + 95, density: 1.4, spread: 0.02 });

  // ---- 足元：泥はね・車輪擦り・花壇状の拥壁 ----
  const foot = grp('foot');
  g.add(foot);
  foot.add(mesh(rbox(CW + 0.16, 0.060, CW + 0.16, 0.014, 2), K.concrete, { pos: [0, 0.030, 0] }));
  weather(foot, { w: 0.42, h: 0.10, pos: [0, 0.062, CW / 2 + 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6f5c', opacity: 0.55, seed: seed + 97, density: 1.8, spread: 0.03 });
  weather(foot, { w: 0.30, h: 0.14, pos: [CW / 2 + 0.02, 0.16, 0.06], rot: [0, Math.PI / 2, 0], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 98, density: 1.4, spread: 0.03 });
  shadowBlob(g, { r: 0.36, pos: [0, 0.004, 0.02], opacity: 0.26, ratio: 1 });
}

/* ------------------------------------------------------------------ */
function build(options = {}) {
  const kind = options.kind ?? 'fascia';
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const g = grp('store-signage:' + kind);
  const K = kit(seed);

  if (kind === 'pylon') buildPylon(g, K, seed, rnd);
  else if (kind === 'pillar') buildPillar(g, K, seed, rnd);
  else buildFascia(g, K, seed, rnd);

  return finish(g, { outline: 'normal', minSize: kind === 'fascia' ? 0.032 : 0.026 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
