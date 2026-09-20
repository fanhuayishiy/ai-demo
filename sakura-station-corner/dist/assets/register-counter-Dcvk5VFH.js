import { g as grp, M as MAT, T as TEX, P as PAL, m as mesh, b as box, r as rbox, w as weather, h as decal, H as plane, c as cyl, k as tubeOf, l as catenary, n as range, t as tor, a as sph, q as finish, Y as memo, z as rand, N as makeCanvas, a5 as speckle, a7 as blotches, a6 as rr, Q as toTexture, O as jpText } from './index-BxWjt-aN.js';
import { b as build$1 } from './candy-bar-D_PJ3f1l.js';

//  assets/interior/register-counter.js —— レジカウンター一式
//  人工大理石の天板（傷・輪ジミ）／前面タイル＋木目／2 画面の POS／金庫トレイ／レジ袋ラック／
//  ポイントカード提示札／仕切り・硬貨トレイ／ガム・チョコ陳列（candy-bar）／足踏みマット／
//  奥の棚（おしぼり・箱）／上部の防犯カメラと凸面鏡／行列方向の床表示
//  原点 = 床接触面の中心、+Y 上、正面（顧客側）+Z。装配層は rotY で向きのみ調整。

const meta = {
  id: 'register-counter',
  real: [2.66, 2.12, 2.30],   // 天板長 × 防犯カメラ上端 × （奥棚＋足踏みマット＋行列表示）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* ============================ 局所テクチャ（core 非汚染） ============================ */
/** 人工大理石の天板：微粒子 + 細傷 + コップの輪ジミ + 接着跡 */
const marbleTopTex = (seed) => memo(`reg:marble|${seed}`, () => {
  const cv = makeCanvas(512, 512);
  if (!cv) return null;
  cv.rnd = rand(seed + 7);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f2ecdf'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, { count: 9000, r: [0.3, 1.5], colors: ['#ffffff', '#d9d2c2', '#c9c1ae', '#efeee8'], alpha: [0.03, 0.16], rnd });
  blotches(g, w, h, { count: 16, rad: [30, 130], colors: ['#e0d8c6', '#fbf7ec'], alpha: [0.05, 0.14], rnd });
  // 使用方向の細傷（ほぼ X 方向）
  for (let i = 0; i < 90; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.16;
    g.strokeStyle = rnd() > 0.55 ? '#cdc4b0' : '#fffdf6';
    g.lineWidth = 0.5 + rnd() * 1.4;
    const y = rnd() * h, len = 30 + rnd() * 220;
    g.beginPath(); g.moveTo(rnd() * w, y); g.lineTo(rnd() * w + len, y + (rnd() - 0.5) * 9); g.stroke();
  }
  // コップの輪ジミ（咖啡・水）
  for (let i = 0; i < 11; i++) {
    const cx = rnd() * w, cy = rnd() * h, r0 = 9 + rnd() * 17;
    g.globalAlpha = 0.10 + rnd() * 0.22;
    g.strokeStyle = rnd() > 0.5 ? '#a8794a' : '#8f8b7f';
    g.lineWidth = 1 + rnd() * 2.6;
    g.beginPath(); g.arc(cx, cy, r0, 0, 6.284); g.stroke();
    g.globalAlpha *= 0.4;
    g.beginPath(); g.arc(cx + 1.5, cy + 1, r0 * 0.82, 0, 6.284); g.stroke();
  }
  // 貼紙を剥がした接着剤残り
  g.globalAlpha = 0.16; g.fillStyle = '#d8c48c';
  rr(g, w * 0.62, h * 0.16, 90, 54, 6); g.fill();
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 行列方向の床表示（矢印・間隔ライン・「お会計」） */
const queueTex = (seed) => memo(`reg:queue|${seed}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 21);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  // 2 本の誘導ライン（点線）
  g.fillStyle = 'rgba(79,163,209,0.92)';
  for (let i = 0; i < 9; i++) { g.fillRect(24 + i * 54, h * 0.16, 34, 12); g.fillRect(24 + i * 54, h * 0.76, 34, 12); }
  // 中央の矢印
  g.fillStyle = 'rgba(79,163,209,0.95)';
  g.beginPath();
  g.moveTo(w * 0.52, h * 0.5); g.lineTo(w * 0.4, h * 0.36); g.lineTo(w * 0.44, h * 0.44);
  g.lineTo(w * 0.2, h * 0.44); g.lineTo(w * 0.2, h * 0.56); g.lineTo(w * 0.44, h * 0.56);
  g.lineTo(w * 0.4, h * 0.64); g.closePath(); g.fill();
  jpText(g, 'お会計', { x: w * 0.8, y: h * 0.5, size: 44, color: 'rgba(58,52,44,0.9)', weight: 800, spacing: 3 });
  // 端のめくれ・摩耗（アルファ欠き）
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.25 + rnd() * 0.55;
    g.beginPath(); g.ellipse(rnd() * w, rnd() < 0.5 ? 6 + rnd() * 16 : h - 6 - rnd() * 16, 8 + rnd() * 26, 5 + rnd() * 9, rnd() * 3, 0, 6.284); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 待機位置の丸印（床タイル） */
const dotMarkTex = () => memo('reg:dot', () => {
  const cv = makeCanvas(128, 128);
  if (!cv) return null;
  const { g, w, rnd } = cv;
  g.clearRect(0, 0, w, w);
  g.strokeStyle = 'rgba(79,163,209,0.9)'; g.lineWidth = 9;
  g.beginPath(); g.arc(64, 64, 46, 0, 6.284); g.stroke();
  g.setLineDash([7, 9]); g.lineWidth = 4; g.strokeStyle = 'rgba(58,82,96,0.7)';
  g.beginPath(); g.arc(64, 64, 34, 0, 6.284); g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < 40; i++) { g.globalAlpha = 0.05 + rnd() * 0.2; g.fillStyle = '#8a8578'; g.beginPath(); g.arc(rnd() * w, rnd() * w, 1 + rnd() * 4, 0, 6.284); g.fill(); }
  return toTexture(cv, { repeat: 1 });
});

/** アクリル仕切板の指紋 */
const fingerprintTex = (seed) => memo(`reg:fp|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 33);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w, y = rnd() * h;
    g.globalAlpha = 0.06 + rnd() * 0.14;
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.1;
    for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(x, y, k * 2.4, k * 3.1, rnd(), 0.4, 5.1); g.stroke(); }
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ================================== 本体 ================================== */
function build(options = {}) {
  const seed = options.seed ?? 723;
  const rnd = rand(seed);
  const L = Math.max(1.4, options.len ?? 2.6);   // 天板長（X）
  const D = 0.62;                                  // 天板奥行き（Z）
  const TH = 0.893;                                // 天板上面高
  const g = grp('register-counter');

  /* ---------- マテリアル ---------- */
  const stone = MAT.paint('#ffffff', {
    map: marbleTopTex(seed), normalMap: null,
    spec: 0.46, specPower: 105, specCut: 0.13, sheen: 0.12, shadowAmt: 0.58, steps: 3, sat: 1.02,
  });
  const tileMat = MAT.paint('#ffffff', {
    map: TEX.tile({ color: '#e7ece9', n: 9, repeat: 1 }).map,
    normalMap: TEX.tile({ color: '#e7ece9', n: 9, repeat: 1 }).normalMap,
    normalScaleX: 0.5, normalScaleY: 0.5, spec: 0.5, specPower: 140, specCut: 0.1, sheen: 0.12, shadowAmt: 0.6,
  });
  const woodMat = MAT.wood({ light: '#c69b6d', dark: '#8b6a45', repeat: 2, knots: true });
  const bodyMat = MAT.paint(PAL.shelfBody, { map: TEX.paper({ base: PAL.shelfBody }).map, spec: 0.16, shadowAmt: 0.78 });
  const steel = MAT.stainless({ worn: 0.5, repeat: 2 });
  const steelDk = MAT.metal('#9aa0a3', { worn: 0.65, spec: 0.5 });
  const chrome = MAT.chrome();
  const posBody = MAT.hardPlastic(PAL.register, { worn: 0.7, repeat: 2 });
  const posDark = MAT.hardPlastic('#2f3a42', { worn: 0.55 });
  const screenMat = MAT.screen({ color: '#d8ecff', map: TEX.lightPanel({ text: '¥', bg: '#0e1418', fg: '#e9f6ff', mode: 'led' }) });
  const screenCust = MAT.screen({ color: '#dfe9c8', map: TEX.lightPanel({ text: '540', bg: '#131a12', fg: '#f2ffd8', mode: 'led' }) });
  const acryl = MAT.glassLite({ color: '#e9f3f5', opacity: 0.3 });
  const rubberMat = MAT.rubber('#3a3d42');
  const bagWhite = MAT.plastic('#f6f3ea', { spec: 0.24, transparent: true, opacity: 0.9 });
  const fabric = MAT.fabric({ color: '#4b5a63', repeat: 6 });

  /* =============== 1. カウンター躯体 =============== */
  const carcass = grp('carcass');
  g.add(carcass);
  // 足折れ（kick）＋ベース
  carcass.add(mesh(box(L - 0.05, 0.10, D - 0.16), MAT.paint('#4a4f52', { spec: 0.08, steps: 2 }), { pos: [0, 0.05, -0.03], name: 'toe-kick' }));
  for (const sx of [-1, 1]) carcass.add(mesh(box(0.05, 0.06, D - 0.1), steelDk, { pos: [sx * (L / 2 - 0.08), 0.03, -0.02] }));
  // 本体
  carcass.add(mesh(box(L, 0.755, D - 0.04), bodyMat, { pos: [0, 0.4775, 0], name: 'counter-body' }));
  // 前面タイル帯＋木目帯（顧客側 +Z）
  const fz = (D - 0.04) / 2 + 0.010;
  carcass.add(mesh(box(L - 0.005, 0.56, 0.02), tileMat, { pos: [0, 0.55, fz], name: 'front-tile' }));
  carcass.add(mesh(box(L - 0.005, 0.16, 0.022), woodMat, { pos: [0, 0.185, fz], name: 'front-wood' }));
  // アルミ押え（タイル上端・下端・目地）
  carcass.add(mesh(box(L, 0.016, 0.03), steel, { pos: [0, 0.836, fz + 0.004] }));
  carcass.add(mesh(box(L, 0.014, 0.028), steel, { pos: [0, 0.266, fz + 0.004] }));
  for (let i = 1; i < 4; i++) carcass.add(mesh(box(0.012, 0.56, 0.024), steel, { pos: [-L / 2 + (i * L) / 4, 0.55, fz + 0.002], cast: false }));
  // 両端板（木口）
  for (const sx of [-1, 1]) {
    carcass.add(mesh(box(0.024, 0.755, D - 0.03), woodMat, { pos: [sx * (L / 2 - 0.012), 0.4775, 0] }));
    carcass.add(mesh(box(0.03, 0.02, D - 0.02), steel, { pos: [sx * (L / 2 - 0.012), 0.845, 0] }));
  }
  // 背面（店員側 -Z）：扉 2 枚＋引き出し 2 段（1 段だけ開き気味）
  const bz = -0.29 - 0.010;
  const zx0 = -L / 2 + 0.03, zx1 = L / 2 - 0.68, zw = zx1 - zx0, dwd = zw / 2 - 0.016;
  for (let i = 0; i < 2; i++) {
    const door = grp('back-door', { pos: [zx0 + zw * (0.25 + i * 0.5), 0.5, bz] });
    door.add(mesh(rbox(dwd, 0.6, 0.018, 0.005, 2), bodyMat, { name: 'back-door-panel' }));
    door.add(mesh(box(0.09, 0.012, 0.02), chrome, { pos: [dwd * 0.36, 0.22, 0.016] }));
    door.add(mesh(box(0.006, 0.006, 0.02), steelDk, { pos: [dwd * 0.36, -0.24, 0.012], cast: false }));
    door.add(mesh(box(dwd - 0.06, 0.012, 0.006), steel, { pos: [0, -0.285, 0.012], cast: false }));
    weather(door, { w: 0.16, h: 0.2, pos: [0.05, -0.2, 0.021], kind: 'dirt', color: '#6a6355', opacity: 0.3, seed: seed + i * 17, spread: 0.02 });
    g.add(door);
  }
  const dxc = (zx1 + L / 2 - 0.03) / 2;
  for (let i = 0; i < 2; i++) {
    const open = i === 1 ? 0.11 : 0;
    const dr = grp('drawer', { pos: [dxc, 0.32 + i * 0.19, bz - open] });
    dr.add(mesh(rbox(0.56, 0.16, 0.016, 0.004, 2), bodyMat, {}));
    dr.add(mesh(box(0.14, 0.014, 0.024), chrome, { pos: [0, 0, 0.014] }));
    if (open > 0) {
      dr.add(mesh(box(0.5, 0.008, 0.1), MAT.plastic('#c9c3b4'), { pos: [0, -0.06, 0.06], cast: false }));
      dr.add(mesh(box(0.5, 0.13, 0.012), bodyMat, { pos: [0, 0, 0.11] }));
    }
    g.add(dr);
  }
  // 天板（人工大理石・厚み 38mm・裏に反り止め合板）
  g.add(mesh(rbox(L + 0.06, 0.038, D + 0.05, 0.007, 2), stone, { pos: [0, 0.874, 0], name: 'counter-top' }));
  g.add(mesh(box(L + 0.02, 0.014, D - 0.02), MAT.plastic('#c8bfa8', { spec: 0.1 }), { pos: [0, 0.848, 0], cast: false }));
  // 天板の経年：輪ジミ濃色斑・焦げ・補修跡
  decal(g, { map: fingerprintTex(seed), w: 0.5, h: 0.24, pos: [0.62, 0.8945, 0.06], rot: [-Math.PI / 2, 0, 0.2], opacity: 0.5 });
  weather(g, { w: 0.4, h: 0.2, pos: [-0.1, 0.8948, -0.1], rot: [-Math.PI / 2, 0, 0.1], kind: 'scratch', color: '#b7ad97', opacity: 0.4, seed: seed + 3, density: 1.4, spread: 0.003 });
  decal(g, { map: TEX.wear({ kind: 'chip', color: '#8d6b48', seed: seed + 5, density: 1.2 }), w: 0.13, h: 0.13, pos: [L / 2 - 0.2, 0.8948, 0.12], rot: [-Math.PI / 2, 0, 0], opacity: 0.4 });

  /* =============== 2. POS レジ本体 =============== */
  const reg = grp('register', { pos: [-0.46, TH, -0.02] });
  g.add(reg);
  // 台座（下段：小銭引き出し内蔵）
  reg.add(mesh(rbox(0.4, 0.11, 0.4, 0.012, 2), posBody, { pos: [0, 0.055, 0], name: 'pos-base' }));
  reg.add(mesh(box(0.4, 0.01, 0.4), MAT.metal('#59646d', { worn: 0.5 }), { pos: [0, 0.113, 0] }));
  // キーボード部（手前へ傾く）
  const kb = grp('keyboard', { pos: [0, 0.115, 0.02], rot: [-17 * D2R, 0, 0] });
  kb.add(mesh(rbox(0.36, 0.05, 0.3, 0.008, 2), posDark, {}));
  // テンキー（数字 10 ＋ 機能 6）＝独立 Mesh
  const keyMatA = MAT.hardPlastic('#e6e2d5', { worn: 0.5 });
  const keyMatB = MAT.hardPlastic('#c9cec9', { worn: 0.5 });
  for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 3; c++) {
    if (r2 === 3 && c === 0) continue;
    kb.add(mesh(box(0.028, 0.008, 0.024), (r2 + c) % 3 ? keyMatA : keyMatB, { pos: [-0.115 + c * 0.036, 0.028, -0.075 + r2 * 0.033] }));
  }
  for (let i = 0; i < 6; i++) {
    kb.add(mesh(box(0.03, 0.008, 0.026), MAT.hardPlastic(['#d9695e', '#e8b24a', '#5fa074', '#4f8bb5', '#b98fb0', '#c9c3b4'][i], { worn: 0.6 }), { pos: [0.075 + (i % 2) * 0.036, 0.028, -0.08 + Math.floor(i / 2) * 0.033] }));
  }
  // 合計表示（小さな 7 セグ風）
  kb.add(mesh(box(0.14, 0.02, 0.03), MAT.screen({ color: '#ffe9b3', map: TEX.lightPanel({ text: '1,620', bg: '#1a1512', fg: '#ffd98a', mode: 'led' }) }), { pos: [-0.06, 0.03, -0.13] }));
  reg.add(kb);
  // 店員側メイン画面（-Z を向く）＋支柱
  const mainArm = grp('screen-staff', { pos: [0, 0.115, -0.13] });
  mainArm.add(mesh(box(0.05, 0.16, 0.05), posBody, { pos: [0, 0.08, 0] }));
  const scr1 = grp('screen-main', { pos: [0, 0.205, -0.02], rot: [-8 * D2R, 180 * D2R, 0] });
  scr1.add(mesh(rbox(0.26, 0.19, 0.022, 0.006, 2), MAT.hardPlastic('#3b464e', { worn: 0.6 }), {}));
  scr1.add(noHull(mesh(plane(0.228, 0.158), screenMat, { pos: [0, 0.004, 0.0125], cast: false, receive: false })));
  scr1.add(noHull(mesh(box(0.03, 0.006, 0.004), MAT.ledOn('#8fe27f'), { pos: [-0.1, -0.088, 0.014], cast: false })));
  mainArm.add(scr1);
  reg.add(mainArm);
  // 顧客側サブ画面（+Z 向き・ポール上部）
  const custArm = grp('screen-customer', { pos: [0.13, 0.115, 0.14] });
  custArm.add(mesh(cyl(0.011, 0.013, 0.3, 10), steel, { pos: [0, 0.15, 0] }));
  custArm.add(mesh(box(0.02, 0.006, 0.02), steelDk, { pos: [0, 0.302, 0] }));
  const scr2 = grp('screen-cust', { pos: [0, 0.36, 0.01], rot: [12 * D2R, 0, 0] });
  scr2.add(mesh(rbox(0.17, 0.12, 0.024, 0.006, 2), MAT.hardPlastic('#39434a', { worn: 0.6 }), {}));
  scr2.add(noHull(mesh(plane(0.146, 0.096), screenCust, { pos: [0, 0.002, 0.0135], cast: false, receive: false })));
  scr2.add(noHull(mesh(box(0.15, 0.007, 0.006), MAT.ledOn('#f2b23c'), { pos: [0, -0.055, 0.012], cast: false })));
  custArm.add(scr2);
  reg.add(custArm);
  // レシート（印刷口＋巻いた紙＋千切れ）
  const rcp = grp('receipt', { pos: [-0.12, 0.13, -0.06] });
  rcp.add(mesh(box(0.1, 0.014, 0.05), MAT.paint('#242b30', { spec: 0.1 }), { pos: [0, 0.002, 0] }));
  let px = 0, py = 0.01, pz = 0, ang = -0.5;
  for (let i = 0; i < 6; i++) {
    const seg = mesh(box(0.05, 0.0012, 0.03), MAT.paper({ color: '#f8f5ea' }), { pos: [px, py, pz], rot: [ang, 0, 0] });
    rcp.add(noHull(seg));
    px += 0.004; py += 0.006 - i * 0.0016; pz += 0.026; ang -= 0.34;
  }
  rcp.add(noHull(mesh(box(0.05, 0.0014, 0.012), MAT.paper({ color: '#f4efe0' }), { pos: [0.028, 0.006, 0.19], rot: [-1.4, 0, 0] })));
  reg.add(rcp);
  // スキャナ（フラットベッド＋読み取り赤線）＋ハンディ（ホルダー付き・コード）
  const sc = grp('scanner', { pos: [0.3, 0.055, 0.11], rot: [0, -14 * D2R, 0] });
  sc.add(mesh(rbox(0.14, 0.09, 0.13, 0.01, 2), posDark, { rot: [18 * D2R, 0, 0] }));
  sc.add(noHull(mesh(rbox(0.1, 0.004, 0.09, 0.004, 2), MAT.glassLite({ color: '#e6f2f6', opacity: 0.36 }), { pos: [0, 0.055, 0.028], rot: [18 * D2R, 0, 0], cast: false })));
  sc.add(noHull(mesh(box(0.094, 0.002, 0.004), MAT.ledOn('#e2554a'), { pos: [0, 0.058, 0.028], rot: [18 * D2R, 0, 0], cast: false })));
  sc.add(noHull(mesh(tubeOf(catenary([0.06, 0.02, -0.05], [0.16, -0.02, -0.14], 0.05, 12), 0.0035, 14, 6), rubberMat, {})));
  reg.add(sc);
  const handi = grp('handy', { pos: [-0.23, 0.12, 0.13] });
  handi.add(mesh(box(0.07, 0.012, 0.11), MAT.hardPlastic('#4b565e', { worn: 0.6 }), { rot: [0, 0.2, 0] }));
  const hd = grp('handy-unit', { pos: [0, 0.05, 0], rot: [-0.18, 0.2, 0.05] });
  hd.add(mesh(rbox(0.055, 0.14, 0.024, 0.008, 2), MAT.hardPlastic('#e7e3d6', { worn: 0.7 }), {}));
  hd.add(noHull(mesh(plane(0.04, 0.032), MAT.screen({ color: '#cfe6ff' }), { pos: [0, 0.03, 0.013], cast: false, receive: false })));
  for (let i = 0; i < 4; i++) hd.add(noHull(mesh(box(0.04, 0.005, 0.006), keyMatA, { pos: [0, -0.015 - i * 0.012, 0.013], cast: false })));
  hd.add(mesh(cyl(0.005, 0.005, 0.03, 8), MAT.plastic('#5b656d'), { pos: [0.018, 0.085, 0], rot: [0.2, 0, 0] }));
  handi.add(hd);
  handi.add(noHull(mesh(tubeOf(catenary([0.01, -0.02, 0.02], [0.12, -0.06, -0.05], 0.045, 12), 0.0028, 14, 6), rubberMat, {})));
  reg.add(handi);
  // 経年：天板との接地擦れ・ボタンの退色・ラベル剥がれ
  weather(reg, { w: 0.3, h: 0.12, pos: [0, 0.03, 0.205], kind: 'dirt', color: '#7d7566', opacity: 0.28, seed: seed + 9, spread: 0.02 });
  weather(reg, { w: 0.16, h: 0.1, pos: [-0.2, 0.15, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#8e979d', opacity: 0.34, seed: seed + 11, spread: 0.03 });
  decal(reg, { map: TEX.lightPanel({ text: 'レジ 3', bg: '#e8e2d2', fg: '#4a5158' }), w: 0.07, h: 0.034, pos: [0, 0.07, -0.208], rot: [0, Math.PI, 0], opacity: 0.95 });

  /* =============== 3. 金庫トレイ（小銭・紙幣） =============== */
  const drawer = grp('cash-drawer', { pos: [-0.46, 0.62, -0.3] });
  g.add(drawer);
  drawer.add(mesh(box(0.44, 0.09, 0.4), steelDk, { pos: [0, 0, 0] }));
  drawer.add(mesh(box(0.4, 0.012, 0.36), MAT.plastic('#dcd6c6', { spec: 0.2 }), { pos: [0, 0.045, 0] }));
  // 小銭仕切り（5 区画）＋玉
  for (let i = 0; i < 4; i++) drawer.add(mesh(box(0.006, 0.03, 0.2), MAT.plastic('#cfc9ba'), { pos: [-0.14 + i * 0.07, 0.062, -0.085] }));
  for (let i = 0; i < 26; i++) {
    const r2 = 0.006 + (i % 4) * 0.0018;
    drawer.add(noHull(mesh(cyl(r2, r2, 0.0022, 12), MAT.metal(['#d8c778', '#b5b9bd', '#c98f5a', '#dcdcdc'][i % 4], { spec: 0.7, worn: 0.4 }), {
      pos: [-0.16 + (i % 5) * 0.075 + range(rnd, -0.01, 0.01), 0.052 + (i % 3) * 0.003, -0.13 + Math.floor(i / 5) * 0.022],
      rot: [range(rnd, -0.2, 0.2), 0, range(rnd, -0.2, 0.2)], cast: false,
    })));
  }
  // 紙幣（束・クリップ・滑り止めゴム板）
  for (let i = 0; i < 4; i++) {
    drawer.add(mesh(box(0.1, 0.008 + i * 0.002, 0.05), MAT.paper({ color: ['#dcd6c0', '#e2d9c8', '#d7cfc0', '#e6ddcb'][i] }), { pos: [0.02 + i * 0.0, 0.052 + i * 0.006, 0.06 + i * 0.055], rot: [0, range(rnd, -0.06, 0.06), 0] }));
  }
  drawer.add(mesh(box(0.02, 0.002, 0.05), MAT.paint('#4a5158'), { pos: [0.06, 0.062, 0.115], rot: [0, 0, 0.02] }));
  drawer.add(mesh(box(0.42, 0.004, 0.02), MAT.rubber('#6b5f4a'), { pos: [0, 0.052, 0.185] }));
  weather(drawer, { w: 0.2, h: 0.1, pos: [-0.06, 0.05, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8b7d62', opacity: 0.3, seed: seed + 13, spread: 0.004 });

  /* =============== 4. レジ袋ラック（天板下吊り・袋の束） =============== */
  const bagRack = grp('bag-rack', { pos: [0.62, 0, -0.4] });
  g.add(bagRack);
  // 天板の差し込み下から出る支持アーム＋スピンドル
  bagRack.add(mesh(box(0.028, 0.075, 0.13), steelDk, { pos: [-0.17, 0.812, 0.062] }));
  bagRack.add(mesh(cyl(0.011, 0.011, 0.36, 10), steel, { pos: [0, 0.755, 0], rot: [0, 0, Math.PI / 2] }));
  bagRack.add(mesh(cyl(0.02, 0.014, 0.022, 10), chrome, { pos: [0.185, 0.755, 0], rot: [0, 0, Math.PI / 2] }));
  for (let i = 0; i < 4; i++) {
    const ringR = 0.086 - i * 0.004;
    const bm = [bagWhite, MAT.plastic('#f4e6c8', { opacity: 0.9, transparent: true }), MAT.plastic('#e4ecdf', { opacity: 0.9, transparent: true }), bagWhite][i];
    bagRack.add(mesh(cyl(ringR, ringR, 0.03, 18), bm, { pos: [-0.12 + i * 0.062, 0.755, 0], rot: [0, 0, Math.PI / 2] }));
    bagRack.add(noHull(mesh(tor(ringR * 0.99, 0.004, 5, 20), bm, { pos: [-0.12 + i * 0.062, 0.755, 0], rot: [0, Math.PI / 2, 0], cast: false })));
    // 袋口（折り返した 1 枚が下へ垂れる）
    bagRack.add(noHull(mesh(rbox(0.05, 0.06, 0.006, 0.008, 2), bm, { pos: [-0.12 + i * 0.062, 0.69, ringR * 0.5], rot: [0, 0, range(rnd, -0.1, 0.1)], cast: false })));
  }
  // 波刃カッターバー（袋口の下）
  const blade = grp('cutter', { pos: [0.02, 0.72, 0.07] });
  for (let i = 0; i < 12; i++) blade.add(noHull(mesh(box(0.006, 0.012, 0.004), chrome, { pos: [-0.055 + i * 0.01, 0, (i % 2) * 0.005], rot: [0, 0, 0.5], cast: false })));
  blade.add(mesh(box(0.13, 0.006, 0.016), steelDk, { pos: [0, -6e-3, 0.002] }));
  bagRack.add(blade);
  // 予備袋の吊りケース（アクリル・中身の袋束）
  const bin = grp('bag-bin', { pos: [-0.42, 0.72, 0.02], rot: [0, 0.04, 0] });
  bin.add(mesh(rbox(0.24, 0.15, 0.11, 0.008, 2), acryl, {}));
  bin.add(mesh(box(0.24, 0.008, 0.11), steelDk, { pos: [0, 0.076, 0], cast: false }));
  for (let i = 0; i < 4; i++) bin.add(mesh(rbox(0.19, 0.026, 0.085, 0.01, 2), i % 2 ? bagWhite : MAT.plastic('#f0e3c4', { opacity: 0.92, transparent: true }), { pos: [range(rnd, -0.01, 0.01), -0.055 + i * 0.029, 0], rot: [0, range(rnd, -0.04, 0.04), 0] }));
  bagRack.add(bin);
  weather(bagRack, { w: 0.2, h: 0.16, pos: [-0.42, 0.72, 0.08], kind: 'dirt', color: '#6d675a', opacity: 0.24, seed: seed + 15, spread: 0.02 });

  /* =============== 5. 手前の仕切り・硬貨トレイ・提示札 =============== */
  const tray = grp('coin-tray', { pos: [0.34, 0.893, 0.19] });
  g.add(tray);
  tray.add(mesh(rbox(0.2, 0.016, 0.13, 0.006, 2), MAT.plastic('#3f4a52', { worn: 0.6 }), {}));
  tray.add(mesh(box(0.18, 0.004, 0.11), steel, { pos: [0, 0.008, 0] }));
  tray.add(noHull(mesh(box(0.17, 0.012, 0.005), acryl, { pos: [-0.06, 0.012, -0.03], cast: false })));
  tray.add(noHull(mesh(cyl(0.009, 0.009, 0.002, 12), MAT.metal('#c9b06a', { spec: 0.7 }), { pos: [0.03, 0.011, 0.02], cast: false })));
  // 仕切り板（アクリル・指紋）
  const div = grp('divider', { pos: [-0.02, 0.893, 0.22] });
  div.add(mesh(rbox(0.34, 0.11, 0.008, 0.004, 2), acryl, { pos: [0, 0.055, 0] }));
  div.add(mesh(box(0.34, 0.012, 0.024), steel, { pos: [0, 0.006, 0] }));
  decal(div, { map: fingerprintTex(seed + 2), w: 0.2, h: 0.09, pos: [0.03, 0.06, 0.0055], opacity: 0.6 });
  decal(div, { map: fingerprintTex(seed + 5), w: 0.16, h: 0.08, pos: [-0.08, 0.05, -55e-4], rot: [0, Math.PI, 0], opacity: 0.5 });
  g.add(div);
  // ポイントカード提示札（アクリル立札・傾き・色褪せ）
  const card = grp('point-sign', { pos: [0.06, 0.893, 0.26], rot: [0, -0.24, 0] });
  card.add(mesh(rbox(0.16, 0.075, 0.006, 0.003, 2), acryl, { pos: [0, 0.05, 0], rot: [-6 * D2R, 0, 0] }));
  card.add(mesh(box(0.08, 0.008, 0.05), MAT.plastic('#cfd6d2', { spec: 0.3 }), { pos: [0, 0.004, 0] }));
  decal(card, { map: TEX.lightPanel({ text: 'P', bg: '#f0d052', fg: '#5a4a14' }), w: 0.034, h: 0.034, pos: [-0.052, 0.05, 0.006], opacity: 0.97 });
  decal(card, { map: TEX.signboard({ text: 'ポイントカード', bg: '#f7f2e2', fg: '#4a5158', size: 96 }), w: 0.11, h: 0.028, pos: [0.018, 0.056, 0.006], opacity: 0.95 });
  decal(card, { map: TEX.signboard({ text: '5%', bg: '#d9695e', fg: '#fff6ee', size: 120, ar: 1.33 }), w: 0.04, h: 0.03, pos: [0.05, 0.03, 0.006], rot: [0, 0, -0.12], opacity: 0.95 });
  g.add(card);

  /* =============== 6. ガム / チョコ陳列ラック（candy-bar） =============== */
  const rack = grp('candy-rack', { pos: [L / 2 - 0.42, TH, 0.02] });
  g.add(rack);
  const rackMat = MAT.stainless({ worn: 0.42, repeat: 2 });
  rack.add(mesh(box(0.5, 0.012, 0.22), rackMat, { pos: [0, 0.006, 0] }));            // 底板
  rack.add(mesh(box(0.012, 0.2, 0.22), rackMat, { pos: [-0.244, 0.1, 0] }));         // 側板
  rack.add(mesh(box(0.012, 0.2, 0.22), rackMat, { pos: [0.244, 0.1, 0] }));
  rack.add(mesh(rbox(0.5, 0.16, 0.012, 0.004, 2), MAT.glassLite({ color: '#eaf4f6', opacity: 0.28 }), { pos: [0, 0.24, 0.106] })); // 前ガラス
  rack.add(mesh(box(0.5, 0.01, 0.012), rackMat, { pos: [0, 0.32, 0.106] }));
  const tierY = [0.012, 0.125];
  for (const ty of tierY) {
    rack.add(mesh(box(0.48, 0.008, 0.2), rackMat, { pos: [0, ty, 0] }));
    rack.add(mesh(box(0.48, 0.026, 0.006), MAT.plastic('#e9e3d3', { spec: 0.24 }), { pos: [0, ty + 0.014, -0.098] }));
    rack.add(mesh(box(0.46, 0.006, 0.014), rackMat, { pos: [0, ty + 0.003, 0.086] }));
  }
  const cv2 = ['choco', 'caramel', 'mint', 'gum', 'almond', 'kinoko', 'choco', 'mint'];
  for (let t2 = 0; t2 < 2; t2++) {
    for (let i = 0; i < 4; i++) {
      const v = cv2[(i + t2 * 4) % cv2.length];
      const b = build$1({ seed: seed + 41 + i * 13 + t2 * 7, variant: v });
      b.position.set(-0.18 + i * 0.062, tierY[t2] + 0.004, 0.02 - t2 * 0.02);
      b.rotation.set(-9 * D2R, range(rnd, -0.09, 0.09), range(rnd, -0.03, 0.03));
      rack.add(b);
    }
    // 空いた 1 枠（売れ切れ＝下地が見える）とダミーの箱底
    if (t2 === 1) {
      rack.add(mesh(box(0.05, 0.004, 0.09), MAT.plastic('#d8d2c2'), { pos: [0.12, tierY[1] + 0.006, 0.0], cast: false }));
    }
  }
  // ギャップ帯（choco 箱の背札）
  decal(rack, { map: TEX.adStrip({ text: 'ガム・チョコ', bg: '#f4e7c8', seed: seed + 3 }), w: 0.24, h: 0.03, pos: [-0.1, tierY[0] + 0.03, 0.095], rot: [-0.2, 0, 0], opacity: 0.96 });
  weather(rack, { w: 0.2, h: 0.06, pos: [0.14, 0.0215, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8b7f68', opacity: 0.3, seed: seed + 17, spread: 0.003 });
  // 埃（上段天面の縁）
  weather(rack, { w: 0.44, h: 0.02, pos: [0, 0.3265, 0.09], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#c9c2b2', opacity: 0.4, seed: seed + 19, spread: 0.003 });

  /* =============== 7. 足踏みマット =============== */
  const mat = grp('mat', { pos: [0, 0, -0.62] });
  g.add(mat);
  mat.add(mesh(rbox(L - 0.2, 0.014, 0.5, 0.006, 2), fabric, { pos: [0, 0.007, 0], name: 'anti-fatigue-mat' }));
  mat.add(noHull(mesh(box(L - 0.22, 0.002, 0.44), MAT.fabric({ color: '#3c4a52', repeat: 10 }), { pos: [0, 0.015, 0], cast: false, receive: true })));
  // 端のめくれ・擦り切れ
  for (const sx of [-1, 1]) mat.add(mesh(box(0.06, 0.02, 0.5), MAT.fabric({ color: '#5b6a72', repeat: 6 }), { pos: [sx * ((L - 0.2) / 2 - 0.02), 0.019, 0], rot: [0, 0, sx * 0.16] }));
  weather(mat, { w: L * 0.55, h: 0.24, pos: [0.1, 0.017, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#20252a', opacity: 0.3, seed: seed + 23, density: 1.5, spread: 0.004 });
  weather(mat, { w: 0.4, h: 0.18, pos: [-0.5, 0.018, 0.06], rot: [-Math.PI / 2, 0, 0.2], kind: 'chip', color: '#8a948e', opacity: 0.24, seed: seed + 25, spread: 0.004 });
  // 店員側の小さめのスリッパマット（別素材）
  mat.add(mesh(rbox(0.34, 0.01, 0.24, 0.005, 2), MAT.rubber('#4d5257', { map: TEX.concrete({ base: '#4d5257', repeat: 3 }).map }), { pos: [-0.62, 0.005, -0.34] }));

  /* =============== 8. 奥の棚（おしぼり・箱） =============== */
  const shelf = grp('back-shelf', { pos: [L / 2 - 0.52, 0, -0.86] });
  g.add(shelf);
  const sw = 0.94, sd = 0.38, sh = 1.72;
  for (const sx of [-1, 1]) shelf.add(mesh(box(0.032, sh, sd), MAT.metal('#aeb3b4', { worn: 0.6, repeat: 2 }), { pos: [sx * (sw / 2), sh / 2, 0] }));
  shelf.add(mesh(box(sw, 0.024, sd), MAT.metal('#aeb3b4', { worn: 0.6 }), { pos: [0, sh + 0.012, 0] }));
  shelf.add(mesh(box(sw - 0.02, sh, 0.012), bodyMat, { pos: [0, sh / 2, -sd / 2 + 0.006], name: 'shelf-back' })); // 背面＝内容あり
  const sy2 = [0.06, 0.52, 1.02, 1.46];
  for (const y of sy2) {
    shelf.add(mesh(box(sw - 0.05, 0.016, sd - 0.03), steel, { pos: [0, y, 0] }));
    shelf.add(mesh(box(sw - 0.05, 0.02, 0.008), MAT.plastic('#dcd6c6'), { pos: [0, y + 0.018, (sd - 0.03) / 2 - 0.004] }));
    shelf.add(mesh(box(0.012, 0.014, sd - 0.05), steelDk, { pos: [-sw / 2 + 0.03, y + 0.02, 0], cast: false }));
  }
  // おしぼり（巻いた布）＋束ねた手拭き
  for (let i = 0; i < 7; i++) {
    const roll = grp('oshibori', { pos: [-0.3 + (i % 4) * 0.06, sy2[0] + 0.03 + Math.floor(i / 4) * 0.036, -0.04 + (i % 3) * 0.04], rot: [Math.PI / 2, 0, range(rnd, -0.3, 0.3)] });
    roll.add(mesh(cyl(0.019, 0.019, 0.072, 12), MAT.fabric({ color: '#f2eee2', repeat: 12 })));
    roll.add(noHull(mesh(tor(0.019, 0.004, 5, 14), MAT.fabric({ color: '#e6e0d0', repeat: 12 }), { pos: [0, 0.02, 0], rot: [Math.PI / 2, 0, 0], cast: false })));
    shelf.add(roll);
  }
  shelf.add(mesh(rbox(0.24, 0.06, 0.16, 0.01, 2), MAT.fabric({ color: '#dfe6e0', repeat: 9 }), { pos: [0.24, sy2[0] + 0.04, 0.02], rot: [0, 0.1, 0] }));
  // 箱（段ボール 2 個・プラ容器・釣り銭袋）
  shelf.add(mesh(box(0.3, 0.18, 0.24), MAT.paper({ color: '#c9ab74' }), { pos: [-0.22, sy2[1] + 0.1, 0], rot: [0, 0.06, 0] }));
  shelf.add(noHull(mesh(box(0.31, 0.004, 0.05), MAT.paper({ color: '#b79a68' }), { pos: [-0.22, sy2[1] + 0.19, 0], rot: [0, 0.06, 0], cast: false })));
  decal(shelf, { map: TEX.lightPanel({ text: '釣 銭 紙', bg: '#e8e2d0', fg: '#5b5348' }), w: 0.14, h: 0.05, pos: [-0.22, sy2[1] + 0.12, 0.125], opacity: 0.9 });
  shelf.add(mesh(rbox(0.34, 0.14, 0.24, 0.008, 2), MAT.plastic('#c8d0cb', { spec: 0.3 }), { pos: [0.22, sy2[1] + 0.08, 0] }));
  shelf.add(mesh(box(0.26, 0.03, 0.14), MAT.plastic('#e7e2d3'), { pos: [0.2, sy2[2] + 0.03, 0], rot: [0, 0.1, 0] }));
  for (let i = 0; i < 3; i++) shelf.add(mesh(cyl(0.03, 0.032, 0.1, 12), MAT.plastic(['#d9695e', '#4f8bb5', '#e8b24a'][i], { spec: 0.36 }), { pos: [-0.28 + i * 0.09, sy2[2] + 0.09, 0.02], rot: [0, 0, i === 1 ? 0.16 : -0.06] }));
  // レジ袋の予備（箱入り）＋千社札風の付箋
  shelf.add(mesh(box(0.22, 0.11, 0.3), MAT.paper({ color: '#efe7d3' }), { pos: [0, sy2[3] + 0.065, 0] }));
  shelf.add(mesh(box(0.2, 0.006, 0.26), MAT.paper({ color: '#f6f0e0' }), { pos: [0, sy2[3] + 0.122, 0], cast: false }));
  weather(shelf, { w: 0.4, h: 0.3, pos: [0.1, sy2[1] + 0.2, 0.18], kind: 'dirt', color: '#6f6859', opacity: 0.22, seed: seed + 27, spread: 0.03 });
  weather(shelf, { w: 0.1, h: 0.5, pos: [-sw / 2 + 0.03, 0.4, 0.19], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + 29, spread: 0.03 });

  /* =============== 9. 上部：防犯カメラ・凸面鏡・配線 =============== */
  const pole = grp('camera-pole', { pos: [-0.5, 0, -0.98] });
  g.add(pole);
  pole.add(mesh(cyl(0.018, 0.02, 2.02, 12), MAT.metal('#b7bbbc', { worn: 0.55 }), { pos: [0, 1.01, 0] }));
  pole.add(mesh(cyl(0.04, 0.045, 0.03, 12), steelDk, { pos: [0, 0.02, 0] }));
  // カメラ（ドーム）
  const cam = grp('camera', { pos: [0, 2.03, 0.04], rot: [0.28, 0, 0] });
  cam.add(mesh(cyl(0.055, 0.06, 0.026, 14), MAT.hardPlastic('#e6e2d6', { worn: 0.5 }), { pos: [0, 0.03, 0] }));
  cam.add(mesh(sph(0.05, 14, 10, 0, 6.284, 0, Math.PI * 0.62), MAT.glassLite({ color: '#3c454c', opacity: 0.55 }), { pos: [0, 0.016, 0], rot: [Math.PI, 0, 0] }));
  cam.add(noHull(mesh(sph(0.016, 10, 8), MAT.paint('#22282c', { spec: 0.4 }), { pos: [0, 0.008, 0.022], cast: false })));
  cam.add(noHull(mesh(cyl(0.005, 0.005, 0.006, 8), MAT.ledOn('#e2554a'), { pos: [0.04, 0.03, 0.028], rot: [Math.PI / 2, 0, 0], cast: false })));
  pole.add(cam);
  // 凸面ミラー（アーム＋球面）
  const mir = grp('mirror', { pos: [0, 1.98, 0.06] });
  mir.add(mesh(box(0.02, 0.02, 0.36), MAT.metal('#b7bbbc', { worn: 0.5 }), { pos: [0, 0, 0.18] }));
  const disc = grp('mirror-disc', { pos: [0, -0.03, 0.38], rot: [0.5, 0, 0] });
  disc.add(mesh(cyl(0.14, 0.14, 0.016, 24), MAT.hardPlastic('#d9d4c6', { worn: 0.5 }), { rot: [Math.PI / 2, 0, 0] }));
  disc.add(noHull(mesh(sph(0.135, 20, 12, 0, 6.284, 0, 0.52), MAT.chrome({ spec: 0.9, color: '#dfe4e8' }), { pos: [0, 0.004, 0], cast: false })));
  disc.add(noHull(mesh(tor(0.136, 0.006, 6, 22), MAT.rubber('#4a4f54'), { pos: [0, 0.006, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));
  mir.add(disc);
  pole.add(mir);
  // 配線（ポールを伝う・結束バンド・差込口）
  pole.add(noHull(mesh(tubeOf(catenary([0.05, 2.0, 0.02], [0.06, 1.2, -0.05], 0.06, 14), 0.006, 16, 6), MAT.rubber('#3a3d42'), {})));
  for (let i = 0; i < 4; i++) pole.add(noHull(mesh(tor(0.024, 0.003, 5, 14), MAT.plastic('#e8e5da'), { pos: [0.0, 1.86 - i * 0.16, 0.0], rot: [0, 0, Math.PI / 2], cast: false })));
  weather(pole, { w: 0.06, h: 0.5, pos: [0.024, 0.6, 0], kind: 'rust', color: '#8a5236', opacity: 0.26, seed: seed + 31, spread: 0.05 });

  /* =============== 10. 行列方向の床表示 =============== */
  const mark = grp('floor-queue', { pos: [-0.2, 0, 0.95] });
  g.add(mark);
  decal(mark, { map: queueTex(seed), w: 1.5, h: 0.5, pos: [0, 0.0018, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.95, order: 1 });
  // めくれた端（実体 1 枚）＋踏み剥がれ
  mark.add(noHull(mesh(box(0.12, 0.0022, 0.48), MAT.paint('#5d8fb0', { spec: 0.2, steps: 2 }), { pos: [0.7, 0.006, 0], rot: [0, 0, 0.09], cast: false })));
  weather(mark, { w: 0.9, h: 0.3, pos: [-0.05, 0.0026, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6459', opacity: 0.26, seed: seed + 37, density: 1.4, spread: 0.002 });
  // 待機位置の丸印（間隔保持）
  for (let i = 0; i < 3; i++) {
    decal(mark, { map: dotMarkTex(), w: 0.26, h: 0.26, pos: [-0.55 + i * 0.55, 0.0022, 0.06], rot: [-Math.PI / 2, 0, 0], opacity: 0.85, order: 2 });
  }
  // 電源タップ・店内配線（カウンター奥床）
  const tap = grp('tap', { pos: [-0.1, 0.02, -0.52] });
  g.add(tap);
  tap.add(mesh(rbox(0.24, 0.03, 0.05, 0.008, 2), MAT.plastic('#eae6da', { worn: 0.6 }), {}));
  for (let i = 0; i < 3; i++) tap.add(noHull(mesh(box(0.03, 0.008, 0.03), MAT.plastic('#3b3f44'), { pos: [-0.08 + i * 0.08, 0.016, 0], cast: false })));
  tap.add(noHull(mesh(box(0.012, 0.006, 0.012), MAT.ledOn('#e2554a'), { pos: [0.105, 0.016, 0], cast: false })));
  tap.add(noHull(mesh(tubeOf(catenary([-0.12, 0.012, 0.02], [-0.4, 0.012, 0.28], 0.01, 12), 0.005, 14, 6), MAT.rubber('#43474c'), {})));
  g.add(noHull(mesh(tubeOf(catenary([-0.5, 1.99, -0.94], [-0.44, 0.93, -0.26], 0.16, 20), 0.0055, 24, 6), MAT.rubber('#4a4f54'), {})));

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
