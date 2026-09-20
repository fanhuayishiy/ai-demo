import { g as grp, M as MAT, P as PAL, m as mesh, c as cyl, t as tor, b as box, at as rotY, w as weather, p as shadowBlob, r as rbox, h as decal, k as tubeOf, d as coil, T as TEX, am as hoop, a as sph, q as finish, N as makeCanvas, Q as toTexture, o as lathe, z as rand, O as jpText, a5 as speckle } from './index-D8uBk-tk.js';

//  assets/street/utility-pole.js —— 電柱（PC 円錐柱・節リング・腕金・碍子・高圧引下線・変圧器・低圧盤・標識・踏板）
//  構成：コンクリート柱（底径 0.28 → 梢径 0.17）／打刻番号札／上部白帯／コウモリラン＋苔／
//        上段3線＋中段2線＋中性線＋サービス引下のアンカー金具／柱上変圧器（台枠・高圧ケーブル湾曲）／
//        低圧盤（メーター・蓋のネジ）／「⚡高圧危険」標識／脚立踏板／柱根元の影
//  ※ 電線アンカーの局所座標は power-lines.js と完全一致させる（下記 POLE_ANCHORS を参照）

/* =========================================================================
 *  POLE_ANCHORS —— 電線上アンカー表（資産局所座標 / 基準柱高 8.00 m）
 *    X = 腕金軸（＝档距方向に垂直）   Y = 地上高 [m]   Z = 档距方向（常に 0）
 *    上段3線  y=7.55(中) / y=7.35(左右 ±0.70)
 *    中段2線  y=6.85 (±0.62)
 *    中性線   y=6.30 (x=0)
 *    引下/サービス y=5.20 (x=+0.16)
 *  ※ CONTRACT により資産間 import 禁止 → power-lines.js 側に同一値をミラー複製。
 *  ※ 装配層：柱の rotY は「档距方向を向く Z 軸」を合わせること。
 *     rotY[deg] = deg(atan2(-dx, -dz))、(dx,dz) = 隣接柱へ向かう単位ベクトル。
 *     P0(-17.2,6.3)→P1(-13.9,6.3)  : -90.0     P1→P2(-2.7,6.3) : -90.0
 *     P2→P3(10.6,2.8)               : -75.2     P3→P4(10.6,-8.0):   0.0
 * ========================================================================= */
const POLE_ANCHORS = {
  refHeight: 8.0,
  levels: [
    { name: 'primary', wires: 'high-tension', pts: [{ x: 0.00, y: 7.55 }, { x: -0.7, y: 7.35 }, { x: 0.70, y: 7.35 }] },
    { name: 'secondary', wires: 'low-tension', pts: [{ x: -0.62, y: 6.85 }, { x: 0.62, y: 6.85 }] },
    { name: 'neutral', wires: 'neutral', pts: [{ x: 0.0, y: 6.30 }] },
    { name: 'service', wires: 'service', pts: [{ x: 0.16, y: 5.20 }] },
  ],
};
/** 柱高さに応じて Y だけスケールしたアンカー一覧を返す（power-lines と共用する表式） */
function anchorList(height = 8.0) {
  const s = height / POLE_ANCHORS.refHeight;
  const out = [];
  for (const lv of POLE_ANCHORS.levels) {
    for (const p of lv.pts) out.push({ level: lv.name, wires: lv.wires, x: p.x, y: +(p.y * s).toFixed(4) });
  }
  return out;
}
const DEFAULT_OPTIONS = { seed: 7, height: 8.0, transformer: true, lampArm: false };

const meta = {
  id: 'utility-pole',
  real: [1.52, 8.0, 0.62],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* --------------------------- 質感（磁器 / 亜鉛 / 塗鉄 / 樹脂） --------------------------- */
const porcelain = (c, o = {}) =>
  MAT.hardPlastic(c, { spec: 0.68, specPower: 132, specCut: 0.11, sheen: 0.16, shadowAmt: 0.72, steps: 3, ...o });
const galv = (o = {}) => MAT.galvanized({ worn: 0.75, ...o });
const paintIron = (c, o = {}) => MAT.metalPaint(c, { worn: 0.9, repeat: 3, ...o });

/** 手作りの標識／番号札テクチャ（Node 環境では makeCanvas() が null → null を返す） */
function plateTex(w, h, draw) {
  const cv = makeCanvas(w, h);
  if (!cv) return null;
  draw(cv.g, cv);
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const { seed = 7, transformer = true, lampArm = false } = options;
  const height = options.height ?? 8.0;
  const rnd = rand(seed);
  const k = height / POLE_ANCHORS.refHeight;         // アンカー高さスケール
  const g = grp('utility-pole');

  /* ---------------------------- 柱本体（PC 円錐） ---------------------------- */
  const rBase = 0.14, rTip = 0.085;
  const rAt = (y) => rBase + (rTip - rBase) * clamp(y / height, 0, 1);
  const conc = MAT.concrete({ base: PAL.poleConcrete, repeat: 4, cracked: true });
  const shaft = mesh(cyl(rTip, rBase, height, 22), conc, { name: 'pole-shaft', pos: [0, height / 2, 0] });
  g.add(shaft);
  // 梢 head：キャップ（コンクリートの打放し天端＋鉄蓋の痕）
  g.add(mesh(cyl(rTip * 0.92, rTip, 0.05, 20), MAT.concrete({ base: PAL.concreteDark, repeat: 3 }), { pos: [0, height - 0.005, 0] }));

  // 節ごとのリング筋（撓み打ち型継ぎ目：0.75 m ピッチ、打ち継ぎは僅かに太る）
  for (let y = 0.34, i = 0; y < height - 0.18; y += 0.755, i++) {
    const r = rAt(y) + 0.0022;
    const ring = mesh(tor(r, i % 4 === 3 ? 0.0058 : 0.0034, 6, 26), MAT.concrete({ base: PAL.concreteDark, repeat: 2 }), { pos: [0, y, 0], rot: [90 * D2R, 0, 0] });
    g.add(ring);
    if (i % 4 === 3) { // 打ち継ぎ部に薄泥浆の段
      g.add(mesh(cyl(rAt(y + 0.06) + 0.004, rAt(y - 0.05) + 0.004, 0.05, 20), MAT.concrete({ base: '#c4bfb4', repeat: 2 }), { pos: [0, y + 0.02, 0] }));
    }
  }
  // 纵向の打型すじ（木型目）3 本
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const stripe = mesh(box(0.007, height * 0.93, 0.012), MAT.concrete({ base: '#a9a49a', repeat: 2 }), { pos: [Math.cos(a) * (rAt(height * 0.5) + 0.001), height * 0.5, Math.sin(a) * (rAt(height * 0.5) + 0.001)] });
    rotY(stripe, -a / D2R);
    g.add(stripe);
  }

  /* ---------------------------- 根元（土台・モルタル・苔） ---------------------------- */
  g.add(mesh(cyl(0.185, 0.245, 0.13, 22), MAT.concrete({ base: PAL.concreteDark, repeat: 2, cracked: true }), { pos: [0, 0.065, 0] }));
  g.add(mesh(cyl(0.225, 0.275, 0.035, 22), MAT.concrete({ base: '#b6ae9f', repeat: 2 }), { pos: [0, 0.018, 0] }));
  weather(g, { w: 0.36, h: 0.5, pos: [0, 0.3, 0.02], rot: [0, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 11, density: 1.5, count: 3, spread: 0.18 });
  weather(g, { w: 0.3, h: 1.6, pos: [-0.05, 1.05, rAt(1) + 0.004], rot: [0, 0.2, 0], kind: 'dirt', color: '#6d6152', opacity: 0.34, seed: seed + 12, density: 1.2, count: 2, spread: 0.2 });
  shadowBlob(g, { r: 0.46, pos: [0, 0.004, 0], opacity: 0.3, ratio: 1 });

  /* ---------------------------- 打刻番号札（柱に埋め込み鋳物） ---------------------------- */
  const numTex = plateTex(256, 256, (gg, cv) => {
    const { w, h } = cv;
    gg.fillStyle = '#b9b3a6'; gg.fillRect(0, 0, w, h);
    jpText(gg, String(1000 + Math.floor(rnd() * 8000)), { x: w / 2, y: h * 0.42, size: h * 0.3, color: '#4a453d', weight: 800, spacing: 2 });
    jpText(gg, '電柱', { x: w / 2, y: h * 0.72, size: h * 0.2, color: '#5d564c', weight: 700 });
    speckle(gg, w, h, { count: 4000, r: [0.5, 1.8], colors: ['#fff', '#7d766a'], alpha: [0.04, 0.2], rnd: cv.rnd });
  });
  const tagPlate = mesh(rbox(0.13, 0.15, 0.016, 0.008, 2), MAT.hardPlastic('#b8b2a5', { spec: 0.3, repeat: 1 }), { pos: [0, 1.72, rAt(1.72) + 0.004] });
  g.add(tagPlate);
  decal(g, { map: numTex, w: 0.115, h: 0.135, pos: [0, 1.72, rAt(1.72) + 0.014], order: 1 });

  /* ---------------------------- 上部の白帯（区画標識帯） ---------------------------- */
  const bandY = 5.98 * k;
  g.add(mesh(cyl(rAt(bandY + 0.09) + 0.006, rAt(bandY - 0.09) + 0.006, 0.2, 22), MAT.paint(PAL.paint, { spec: 0.16, steps: 2, shadowAmt: 0.78 }), { pos: [0, bandY, 0] }));
  weather(g, { w: 0.26, h: 0.22, pos: [0.02, bandY, rAt(bandY) + 0.008], kind: 'dirt', color: '#7d7466', opacity: 0.4, seed: seed + 31, count: 2, density: 1.1, spread: 0.06 });

  /* ============================ 腕金（アーム・タイ・ボルト・錆） ============================ */
  const armMat = galv({ repeat: 3 });
  const boltMat = MAT.metal('#8f9497', { worn: 0.6, repeat: 2 });
  function bolt(parent, x, y, z, r = 0.012, axis = 'z', hex = 6) {
    const b = mesh(cyl(r, r * 0.96, 0.014, hex), boltMat, { pos: [x, y, z] });
    if (axis === 'z') b.rotation.x = 90 * D2R; else if (axis === 'x') b.rotation.z = 90 * D2R;
    parent.add(b);
    return b;
  }
  /** 柱に巻くタイ（バンド）＋ U 金 */
  function band(y, { w = 0.035, t = 0.008, x = 0 } = {}) {
    const r = rAt(y) + t * 0.7;
    const h = hoop(r, t, armMat, { pos: [x, y, 0], rot: [90 * D2R, 0, 0] });
    g.add(h);
    weather(g, { w: 0.1, h: 0.06, pos: [x + 0.02, y - 0.03, r * 0.7], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: (x + y) * 100 + seed, density: 1.4, count: 1, spread: 0.02 });
    return h;
  }
  /** 腕金：L 金＋タイ＋斜め支柱＋ボルト。armHalf=片長 */
  function crossArm(y, armHalf, { braceSide = -1, label = '' } = {}) {
    const a = grp('arm' + label, { pos: [0, y, 0] });
    const L = armHalf * 2 + 0.12;
    // 主材（角鋼：縦置き平板）
    a.add(mesh(box(L, 0.056, 0.013), armMat, { pos: [0, 0, 0] }));
    // 上面の折り返し（L 鋼のウエブ）
    a.add(mesh(box(L, 0.012, 0.042), armMat, { pos: [0, 0.028, 0.014] }));
    // 下端ボルト 2 本＋ナット
    for (const sx of [-0.055, 0.055]) {
      a.add(mesh(cyl(0.008, 0.008, 0.2, 8), boltMat, { pos: [sx, -0.02, 0], rot: [0, 0, 90 * D2R] }));
      a.add(mesh(cyl(0.016, 0.016, 0.012, 6), MAT.metal('#9aa0a3'), { pos: [sx + (sx > 0 ? 0.1 : -0.1), -0.02, 0], rot: [0, 0, 90 * D2R] }));
    }
    // 斜め支柱（タイロッド：柱 lower からアーム端へ）
    const bx = braceSide * armHalf * 0.86;
    const by = -0.56;
    const len = Math.hypot(bx, by);
    const rod = mesh(box(0.028, len, 0.011), armMat, { pos: [bx / 2, by / 2 - 0.02, 0.006] });
    rod.rotation.z = Math.atan2(-bx, by);
    a.add(rod);
    a.add(mesh(cyl(0.014, 0.014, 0.02, 6), boltMat, { pos: [bx, by - 0.03, 0.006], rot: [90 * D2R, 0, 0] }));
    // 端金具（碍子台）
    for (const s of [-1, 1]) {
      a.add(mesh(rbox(0.055, 0.05, 0.05, 0.008, 2), armMat, { pos: [s * armHalf, 0.04, 0] }));
      bolt(a, s * armHalf, 0.068, 0, 0.011, 'y');
    }
    g.add(a);
    // 腕金の柱 Take 部タイ
    band(y, { x: 0 });
    band(y - 0.56, { x: 0 });
    // 経年：白サビと釘錆の流レ
    weather(g, { w: L * 0.5, h: 0.09, pos: [armHalf * 0.4 * braceSide, y - 0.045, 0.012], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + y * 37, density: 1.6, count: 2, spread: 0.05 });
    weather(g, { w: 0.2, h: 0.05, pos: [-armHalf * 0.5, y + 0.03, -0.012], kind: 'dirt', color: '#8d9a99', opacity: 0.45, seed: seed + y * 71, count: 1 });
    return a;
  }
  /** 柱直付けのボルトがいし（中性線・サービス） */
  function poleClamp(y, x, { r = 0.03, kind = 'bolt' } = {}) {
    const a = grp('clamp', { pos: [x, y, 0] });
    a.add(mesh(cyl(0.011, 0.011, 0.1, 8), boltMat, { pos: [-x / 2, 0, 0], rot: [0, 0, 90 * D2R] }));
    a.add(mesh(rbox(0.05, 0.055, 0.05, 0.008, 2), armMat, { pos: [x, 0, 0] }));
    a.add(mesh(cyl(0.02, 0.024, 0.02, 10), porcelain('#8c7a5e'), { pos: [x, 0.036, 0] }));
    g.add(a);
    band(y);
    return a;
  }
  /** がい子：磁器ドーナツ型（引き留碍子）＋ピン＋真鍮キャップ。割れは opts.crack */
  function insulator(x, y, { crack = false, scale = 1, kind = 'donut' } = {}) {
    const a = grp('ins', { pos: [x, y, 0] });
    if (kind === 'pin') {
      a.add(mesh(cyl(0.009 * scale, 0.011 * scale, 0.13 * scale, 9), MAT.metal('#a89a72', { worn: 0.5 }), { pos: [0, 0.065 * scale, 0] }));
      for (let i = 0; i < 4; i++) {
        const r = (0.034 - i * 0.004) * scale;
        a.add(mesh(cyl(r, r * 1.06, 0.014 * scale, 14), porcelain('#7f7566'), { pos: [0, (0.05 + i * 0.021) * scale, 0] }));
      }
      a.add(mesh(cyl(0.014 * scale, 0.014 * scale, 0.016 * scale, 6), MAT.metal('#b9a37a'), { pos: [0, 0.14 * scale, 0] }));
    } else {
      // ドーナツ型（傘が 2 枚の引留碍子）
      const p = [[0.014, 0], [0.036, 0.008], [0.021, 0.021], [0.042, 0.033], [0.024, 0.047], [0.03, 0.058], [0.012, 0.066], [0.01, 0.078], [0.016, 0.086]];
      const body = mesh(lathe(p.map(([u, v]) => [u * scale, v * scale]), 16), porcelain('#8a7f6a'), { pos: [0, 0.01, 0] });
      a.add(body);
      a.add(mesh(cyl(0.013 * scale, 0.013 * scale, 0.05 * scale, 9), MAT.metal('#9aa0a3', { worn: 0.6 }), { pos: [0, -0.02 * scale, 0] }));
      a.add(mesh(cyl(0.02 * scale, 0.02 * scale, 0.012 * scale, 6), MAT.metal('#b9a37a'), { pos: [0, 0.098 * scale, 0] }));
      if (crack) { // ガラス質の欠け：小さな欠片を貼り、割れ目を流す
        const shard = mesh(rbox(0.016 * scale, 0.012 * scale, 0.008 * scale, 0.003, 1), porcelain('#a29882'), { pos: [0.03 * scale, 0.04 * scale, 0.022 * scale], rot: [0.4, 0.7, 0.2] });
        a.add(shard);
        weather(a, { w: 0.05, h: 0.07, pos: [0, 0.04, 0.032], kind: 'chip', color: '#5b5245', opacity: 0.8, seed: seed + 3, count: 1 });
      }
    }
    g.add(a);
    return a;
  }

  // 上段：中央はピン碍子（7.55）、左右は腕金上のドーナツ碍子（7.35 / ±0.70）
  //   ※ 碍子「天面」＝POLE_ANCHORS の y（＝power-lines の電線端点）に厳密一致させる。
  //     ドーナツ碍子：台金天面(base) → 頂 +0.104 ／ ピン碍子：base → 頂 +0.145
  const prim = POLE_ANCHORS.levels[0].pts.map((p) => ({ x: p.x, y: p.y * k }));
  const yTopArm = prim[1].y - 0.169;
  crossArm(yTopArm, 0.72, { braceSide: -1, label: '-top' });
  // 中央のピン支柱（腕金天面から碍子下地まで立ち上がる）
  g.add(mesh(cyl(0.016, 0.021, (prim[0].y - 0.145) - (yTopArm + 0.034), 10), galv({ repeat: 2 }), { pos: [0, (prim[0].y - 0.145 + yTopArm + 0.034) / 2, 0] }));
  insulator(0, prim[0].y - 0.145, { kind: 'pin', scale: 1.06 });
  insulator(-0.7, prim[1].y - 0.104, { crack: false });
  insulator(0.70, prim[1].y - 0.104, { crack: true });

  // 中段：低圧 2 線（±0.62 / 6.85）
  const sec = POLE_ANCHORS.levels[1].pts.map((p) => ({ x: p.x, y: p.y * k }));
  crossArm(sec[0].y - 0.169, 0.64, { braceSide: 1, label: '-mid' });
  insulator(-0.62, sec[0].y - 0.104, {});
  insulator(0.62, sec[0].y - 0.104, {});

  // 中性線（6.30 / x=0）：柱直付けボルトがいし
  const neu = POLE_ANCHORS.levels[2].pts[0];
  poleClamp(neu.y * k - 0.06, 0.0);
  insulator(0, neu.y * k - 0.112, { kind: 'pin', scale: 0.8 });
  // サービス引下（5.20 / x=+0.16）：引き留金具＋針金巻き
  const svc = POLE_ANCHORS.levels[3].pts[0];
  poleClamp(svc.y * k - 0.05, svc.x);

  /* ---------------------------- 高圧引下線（柱に沿って降ろし、メンダートと固定金具） ---------------------------- */
  const tfY = 4.42 * k;            // 変圧器中心高さ
  const tx = -0.3;                // 変圧器の柱からの偏心（-X 側）
  const dropSide = -1;             // 引下線を落とす側
  const cableBlack = MAT.rubber('#2b2d31', { spec: 0.14, specPower: 26 });
  const dropTop = prim[1].y + 0.06;
  const dropBot = transformer ? tfY + 0.62 : 3.66;
  const dropPts = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const y = dropTop + (dropBot - dropTop) * t;
    const bulge = Math.sin(t * Math.PI * 3.2) * 0.013;
    dropPts.push([dropSide * (rAt(y) + 0.042 + bulge), y, 0.03]);
  }
  g.add(mesh(tubeOf(dropPts, 0.021, 44, 7), cableBlack, { name: 'hv-drop' }));
  // メンダート（支線碍子）＋針金巻き＋固定金具
  for (const t of [0.28, 0.72]) {
    const y = dropTop + (dropBot - dropTop) * t;
    const x = dropSide * (rAt(y) + 0.03);
    const md = grp('mendart', { pos: [x, y, 0.03] });
    md.add(mesh(cyl(0.019, 0.024, 0.1, 10), porcelain('#8f8570'), { pos: [dropSide * 0.02, 0, 0], rot: [0, 0, 90 * D2R] }));
    for (let i = 0; i < 5; i++) md.add(mesh(cyl(0.023 - i * 0.001, 0.023 - i * 0.001, 0.006, 10), porcelain('#7d7360'), { pos: [dropSide * (0.005 + i * 0.009), 0, 0], rot: [0, 0, 90 * D2R] }));
    md.add(mesh(box(0.03, 0.05, 0.05), galv(), { pos: [dropSide * -0.028, 0, 0] }));
    g.add(md);
    g.add(mesh(coil(0.028, 0.05, 5, 12, 0.0035), MAT.metal('#9ba0a2'), { pos: [x + dropSide * 0.03, y, 0.03], rot: [0, 0, 90 * D2R] }));
    band(y, { x: 0 });
  }
  if (transformer) {
    // 高圧ケーブルの湾曲（引下终端 → 1 次ブッシング 2 本）
    for (const z of [0.09, -0.09]) {
      const x0 = dropSide * (rAt(dropBot) + 0.05);
      g.add(mesh(tubeOf([
        [x0, dropBot, 0.03],
        [(x0 + tx + 0.1) / 2, dropBot - 0.13, 0.03 + z * 0.5],
        [tx + 0.1, tfY + 0.42, z],
        [tx + 0.1, tfY + 0.33, z],
      ], 0.0145, 24, 6), cableBlack, { name: 'hv-jumper' }));
    }
  } else {
    // 変圧器を持たない柱：高開閉器（カットアウト）で終端
    const sw = grp('cutout', { pos: [dropSide * (rAt(dropBot) + 0.05), dropBot, 0.03] });
    sw.add(mesh(rbox(0.07, 0.16, 0.05, 0.008, 2), porcelain('#8a8171'), { pos: [0, 0.02, 0] }));
    sw.add(mesh(box(0.018, 0.19, 0.018), MAT.metal('#9aa0a3', { worn: 0.8 }), { pos: [dropSide * 0.03, -0.04, 0], rot: [0, 0, dropSide * 0.36] }));
    sw.add(mesh(cyl(0.012, 0.012, 0.05, 8), MAT.darkIron(), { pos: [0, -0.11, 0] }));
    g.add(sw);
    weather(g, { w: 0.1, h: 0.09, pos: [dropSide * (rAt(dropBot) + 0.06), dropBot - 0.12, 0.04], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 9, count: 1 });
  }

  /* ---------------------------- 変圧器（筒形・台枠・プレート退色） ---------------------------- */
  if (transformer) {
    const frame = grp('xfmr', { pos: [0, tfY, 0] });
    // 台枠（チャンネル鋼 2 本＋デッキ）
    for (const z of [-0.19, 0.19]) {
      frame.add(mesh(box(0.5, 0.055, 0.03), galv({ repeat: 2 }), { pos: [tx, 0.24, z] }));
      frame.add(mesh(box(0.03, 0.055, 0.42), galv({ repeat: 2 }), { pos: [tx - 0.23, 0.24, 0] }));
    }
    frame.add(mesh(box(0.5, 0.014, 0.44), MAT.metalPaint('#7f857f', { worn: 0.8, repeat: 3 }), { pos: [tx, 0.268, 0] }));
    // ボルト留め（台枠→柱）
    for (const z of [-0.16, 0.16]) {
      frame.add(mesh(cyl(0.012, 0.012, 0.3, 6), boltMat, { pos: [tx + 0.2, 0.24, z], rot: [0, 0, 90 * D2R] }));
    }
    // タンク（横置き円筒：軸は Z＝档距方向）
    const tankMat = paintIron('#5f6d68', { worn: 1.0, repeat: 4, base: '#8b9691' });
    const tank = mesh(cyl(0.17, 0.17, 0.5, 22), tankMat, { pos: [tx, 0.1, 0], rot: [90 * D2R, 0, 0], name: 'xfmr-tank' });
    frame.add(tank);
    for (const z of [-0.25, 0.25]) {
      frame.add(mesh(cyl(0.172, 0.15, 0.045, 22), tankMat, { pos: [tx, 0.1, z], rot: [90 * D2R, 0, 0] }));
      frame.add(mesh(tor(0.155, 0.012, 7, 22), MAT.metal('#767d78'), { pos: [tx, 0.1, z * 0.99], }));
    }
    // 放熱フィン（側面に短いリブ）
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI + Math.PI * 0.06;
      frame.add(mesh(box(0.02, 0.3, 0.055), tankMat, { pos: [tx + Math.cos(a) * 0.175, 0.1 + Math.sin(a) * 0.175, -0.06], rot: [0, 0, -a] }));
    }
    // プレート（容量表示・退色）
    // 銘板（タンク前端のドーム head に貼る：側面に埋めない）
    frame.add(mesh(rbox(0.12, 0.08, 0.006, 0.004, 2), MAT.metal('#c9c3b4', { worn: 0.5 }), { pos: [tx, 0.12, 0.277] }));
    decal(frame, { map: TEX.signboard({ text: '60kVA', sub: '高圧', bg: '#9aa49d', fg: '#2f3532' }), w: 0.1, h: 0.062, pos: [tx, 0.12, 0.2825], order: 1 });
    // 高圧端子（ブッシング 2 本）は上の「高圧ケーブルの湾曲」側で接続
    frame.add(mesh(cyl(0.02, 0.02, 0.06, 10), porcelain('#8a7f6a'), { pos: [tx + 0.1, 0.31, 0.09] }));
    frame.add(mesh(cyl(0.02, 0.02, 0.06, 10), porcelain('#8a7f6a'), { pos: [tx + 0.1, 0.31, -0.09] }));
    // 2 次側（低圧）_terminal_ボス
    frame.add(mesh(cyl(0.018, 0.018, 0.07, 10), porcelain('#7f7667'), { pos: [tx - 0.1, -0.06, -0.11], rot: [90 * D2R, 0, 0] }));
    g.add(frame);
    // 低圧引下線：変圧器 2 次 → 柱裏を回って低圧盤へ（根元で 2 回折弯）
    g.add(mesh(tubeOf([
      [tx - 0.1, tfY - 0.06, -0.145],
      [-(rAt(tfY - 0.3) + 0.028), tfY - 0.34, -0.115],
      [-0.02, 3.6 * k, -0.135],
      [0.14, 3.3 * k, -0.1],
      [0.205, 3.28 * k, -0.045],
    ], 0.013, 26, 6), MAT.rubber('#3b3d42'), { name: 'lv-drop' }));
    // サービスまでの低圧引上線（柱の +X 側を上る）
    g.add(mesh(tubeOf([
      [0.205, 3.44 * k, 0.0],
      [rAt(4.1 * k) + 0.028, 4.1 * k, 0.045],
      [rAt(4.75 * k) + 0.02, 4.75 * k, 0.03],
      [svc.x, svc.y * k - 0.06, 0.02],
    ], 0.012, 24, 6), MAT.rubber('#43464c'), { name: 'lv-riser' }));
    // タンク下部の錆と退色・鳥糞
    weather(g, { w: 0.42, h: 0.2, pos: [tx, tfY + 0.02, 0.18], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 41, density: 1.8, count: 2, spread: 0.06 });
    weather(g, { w: 0.3, h: 0.14, pos: [tx, tfY + 0.28, -0.1], kind: 'dirt', color: '#cfc7ad', opacity: 0.5, seed: seed + 42, count: 2, spread: 0.08 });
  }

  /* ---------------------------- 低圧盤（メーター・蓋のネジ） ---------------------------- */
  {
    const by = 3.28 * k, bx = 0.205;
    const boxG = grp('lv-panel', { pos: [bx, by, 0.02] });
    // 取付ブラケット（柱巻きBand + 腕）
    boxG.add(mesh(box(0.11, 0.05, 0.055), armMat, { pos: [-0.115, 0.04, -0.02] }));
    boxG.add(mesh(box(0.11, 0.05, 0.055), armMat, { pos: [-0.115, -0.06, -0.02] }));
    boxG.add(mesh(rbox(0.16, 0.24, 0.13, 0.008, 2), paintIron('#5d6a74', { worn: 0.85, base: '#8d979e' }), { name: 'lv-body' }));
    boxG.add(mesh(rbox(0.15, 0.23, 0.014, 0.006, 2), paintIron('#6d7a84', { worn: 0.6, base: '#97a1a7' }), { pos: [0, 0, 0.069] }));
    // 蓋のネジ 4 箇所
    for (const [sx, sy] of [[-0.062, 0.095], [0.062, 0.095], [-0.062, -0.095], [0.062, -0.095]]) {
      boxG.add(mesh(cyl(0.008, 0.008, 0.008, 6), MAT.metal('#b7bcc0'), { pos: [sx, sy, 0.08], rot: [90 * D2R, 0, 0] }));
    }
    // メーター（丸玻璃・内側すゝ）
    boxG.add(mesh(cyl(0.048, 0.048, 0.02, 20), MAT.metal('#aeb4b8'), { pos: [0, 0.04, 0.078], rot: [90 * D2R, 0, 0] }));
    boxG.add(mesh(cyl(0.042, 0.042, 0.006, 20), MAT.hardPlastic('#eae6da', { spec: 0.4 }), { pos: [0, 0.04, 0.086], rot: [90 * D2R, 0, 0] }));
    decal(boxG, { map: TEX.lightPanel({ text: '0.15', bg: '#efe9d8', fg: '#3b3b3b' }), w: 0.07, h: 0.07, pos: [0, 0.04, 0.09], order: 2 });
    boxG.add(hoop(0.031, 0.005, MAT.metal('#c9a15a', { worn: 0.6 }), { pos: [0, 0.04, 0.092] }));   // 真鍮ベゼル（盤面は塞がない）
    // 引き出し口のラベル
    decal(boxG, { map: TEX.signboard({ text: '低圧', bg: '#c9cdc9', fg: '#3c4348' }), w: 0.1, h: 0.03, pos: [0, -0.07, 0.078], order: 1 });
    boxG.add(mesh(box(0.03, 0.006, 0.03), MAT.metal('#8f9497'), { pos: [0.0, -0.105, 0.08] }));
    g.add(boxG);
    band(by, {});
    weather(g, { w: 0.17, h: 0.1, pos: [bx + 0.01, by - 0.13, 0.09], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 51, count: 2, spread: 0.03 });
  }

  /* ---------------------------- 標識「⚡高圧危険」 ---------------------------- */
  {
    const sy = 2.42 * k;
    const plate = grp('sign', { pos: [0, sy, rAt(sy) + 0.006] });
    plate.add(mesh(rbox(0.24, 0.17, 0.012, 0.006, 2), MAT.hardPlastic('#c8a53f', { spec: 0.35, repeat: 1 }), { name: 'sign-plate' }));
    const tex = plateTex(512, 384, (gg, cv) => {
      const { w, h, rnd: r2 } = cv;
      gg.fillStyle = '#cfa93f'; gg.fillRect(0, 0, w, h);
      gg.strokeStyle = '#2e2a24'; gg.lineWidth = 16; gg.strokeRect(14, 14, w - 28, h - 28);
      // 稲妻マーク
      gg.fillStyle = '#2e2a24';
      gg.beginPath();
      gg.moveTo(w * 0.16, h * 0.2); gg.lineTo(w * 0.34, h * 0.2); gg.lineTo(w * 0.26, h * 0.47);
      gg.lineTo(w * 0.4, h * 0.47); gg.lineTo(w * 0.2, h * 0.84); gg.lineTo(w * 0.27, h * 0.56);
      gg.lineTo(w * 0.14, h * 0.56); gg.closePath(); gg.fill();
      jpText(gg, '高圧危険', { x: w * 0.68, y: h * 0.42, size: h * 0.27, color: '#2e2a24', weight: 900, spacing: 3 });
      jpText(gg, '立入り注意', { x: w * 0.68, y: h * 0.74, size: h * 0.15, color: '#4c443a', weight: 700 });
      speckle(gg, w, h, { count: 5000, r: [0.6, 2.4], colors: ['#fff', '#7a6531'], alpha: [0.05, 0.22], rnd: r2 });
      gg.globalAlpha = 0.35; gg.fillStyle = '#8d7a45';
      gg.fillRect(w * 0.02, h * 0.62, w * 0.3, h * 0.06);
      gg.globalAlpha = 1;
    });
    decal(plate, { map: tex, w: 0.225, h: 0.155, pos: [0, 0, 0.008], order: 1 });
    for (const [sx, sy2] of [[-0.1, 0.062], [0.1, 0.062], [-0.1, -0.062], [0.1, -0.062]]) {
      plate.add(mesh(cyl(0.007, 0.007, 0.008, 6), MAT.metal('#9b9186'), { pos: [sx, sy2, 0.011], rot: [90 * D2R, 0, 0] }));
    }
    g.add(plate);
    weather(g, { w: 0.26, h: 0.2, pos: [0.02, sy, rAt(sy) + 0.02], kind: 'scratch', color: '#efe4c2', opacity: 0.35, seed: seed + 61, count: 2 });
  }

  /* ---------------------------- 脚立踏板（昇降金具） ---------------------------- */
  for (const y of [2.16 * k, 2.92 * k]) {
    const r = rAt(y);
    const step = grp('step', { pos: [-r - 0.02, y, 0] });
    step.add(mesh(box(0.075, 0.014, 0.05), MAT.metal('#7f8285', { worn: 0.9 }), { pos: [-0.02, 0, 0] }));
    step.add(mesh(box(0.075, 0.005, 0.05), MAT.metal('#8b8e91'), { pos: [-0.02, 0.009, 0], rot: [0, 0, 0.06] }));
    step.add(mesh(cyl(0.009, 0.009, 0.06, 8), MAT.darkIron(), { pos: [0.02, 0, 0], rot: [0, 0, 90 * D2R] }));
    g.add(step);
    weather(g, { w: 0.1, h: 0.05, pos: [-r - 0.05, y - 0.03, 0], kind: 'rust', color: '#7a4a2c', opacity: 0.6, seed: seed + y * 100, count: 1 });
  }

  /* ---------------------------- コウモリラン（着生シダ）と苔 ---------------------------- */
  {
    const fy = 4.05 * k, fr = rAt(fy);
    const fern = grp('fern', { pos: [fr * 0.6, fy, fr * 0.82] });
    fern.userData.sway = { amp: 0.014, freq: 0.62, phase: seed % 6, axis: 'both', lean: 0.5 };
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
      const len = 0.16 + rnd() * 0.13;
      const tip = 0.55 + rnd() * 0.55;
      const pts = [];
      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        pts.push([
          Math.cos(a) * len * t * 0.9,
          len * t * (1 - t * tip * 0.9),
          Math.sin(a) * len * t * 0.9,
        ]);
      }
      const blade = mesh(tubeOf(pts, 0.019, 12, 5), MAT.leaf({ color: i % 3 === 0 ? '#6d8f52' : PAL.leaf }), { pos: [0, 0.02, 0] });
      blade.scale.set(0.42, 1, 1);
      blade.rotation.set(rnd() * 0.2 - 0.1, a, rnd() * 0.2);
      fern.add(blade);
      if (i % 4 === 0) fern.add(mesh(sph(0.012, 8, 6), MAT.leaf({ color: '#8a9a55' }), { pos: [Math.cos(a) * len * 0.5, len * 0.32, Math.sin(a) * len * 0.5] }));
    }
    // 株元（乾葉と苔玉）
    fern.add(mesh(cyl(0.055, 0.03, 0.05, 12), MAT.leaf({ color: '#6f6a44' }), { pos: [0, 0.01, 0] }));
    g.add(fern);
    weather(g, { w: 0.3, h: 0.24, pos: [fr * 0.5, fy - 0.06, fr * 0.7], kind: 'moss', color: '#6d8b52', opacity: 0.62, seed: seed + 71, count: 2, density: 1.6, spread: 0.05 });
  }
  // 北側（-Z）の流レ苔・経年
  weather(g, { w: 0.2, h: 2.4, pos: [-rAt(4) * 0.8, 4.0, -rAt(4) * 0.6], kind: 'moss', color: PAL.moss, opacity: 0.34, seed: seed + 72, count: 3, density: 1.2, spread: 0.16 });
  weather(g, { w: 0.24, h: 1.2, pos: [0, height - 1.1, rAt(height - 1.1) + 0.005], kind: 'dirt', color: '#8b8375', opacity: 0.3, seed: seed + 73, count: 2, spread: 0.1 });

  /* ---------------------------- 街灯アーム（オプション） ---------------------------- */
  if (lampArm) {
    const ay = height - 0.55;
    const arm = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      arm.push([0.1 + t * 0.72, ay + Math.sin(t * Math.PI * 0.5) * 0.3, 0]);
    }
    g.add(mesh(tubeOf(arm, 0.026, 22, 8), galv({ repeat: 2 }), { name: 'lamp-arm' }));
    const head = grp('lamp-head', { pos: [0.84, ay + 0.31, 0] });
    head.userData.breathe = { speed: 0.42, amount: 0.07 };
    head.add(mesh(cyl(0.09, 0.06, 0.06, 14), paintIron('#5c656c'), { pos: [0, 0.05, 0] }));
    head.add(mesh(cyl(0.11, 0.07, 0.09, 14, true), MAT.lampShade({ color: '#fff4dc' }), { pos: [0, -0.03, 0] }));
    g.add(head);
  }

  return finish(g, { outline: 'normal', minSize: 0.02 });
}

export { DEFAULT_OPTIONS, POLE_ANCHORS, anchorList, build, build as default, meta };
