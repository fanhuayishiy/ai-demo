import { g as grp, M as MAT, T as TEX, D as DoubleSide, m as mesh, b as box, r as rbox, w as weather, c as cyl, t as tor, h as decal, H as plane, n as range, k as tubeOf, o as lathe, a as sph, i as grill, d as coil, l as catenary, q as finish, Y as memo, z as rand, N as makeCanvas, Q as toTexture, a6 as rr } from './index-DD_JJZx9.js';
import { build as build$1 } from './zen-sets-Vn5JMvvp.js';

//  assets/interior/oden-counter.js —— おでんコーナー（ステン釜 6 区画・具材・湯気・換気フード・ガス）
//  釜（仕切り・ふた・湯面 MAT.water・薄く湯気）／具材は zen-sets を串ごと立てる／串受けバー
//  トング・割り箸・たれ入れ・薬味（からし／ねぎ）／上部の加熱照明と換気フード
//  前面ガラスの曇り／飛沫の跡と焦げ付き／床の排水グリル／値札 POP／下部のガス管とバルブ
//  原点 = 床接触面の中心、+Y 上、顧客側 +Z（装配層が rotY で動線に合わせる）。

const meta = {
  id: 'oden-counter',
  real: [1.62, 1.96, 1.68],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** 出汁の表面（煮汁の照り・脂の輪・アク） */
const brothSkinTex = (seed) => memo(`od:skin|${seed}`, () => {
  const cv = makeCanvas(128, 128);
  if (!cv) return null;
  cv.rnd = rand(seed + 5);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.2;
    g.fillStyle = rnd() > 0.5 ? '#e6cf9c' : '#8a6631';
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 14, 2 + rnd() * 8, rnd() * 3, 0, 6.284); g.fill();
  }
  for (let i = 0; i < 50; i++) {   // アク・泡
    g.globalAlpha = 0.1 + rnd() * 0.35;
    g.fillStyle = '#c9b48b';
    g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.7 + rnd() * 2.2, 0, 6.284); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 湯気（やわらかい立ち上り） */
const steamTex = () => memo('od:steam', () => {
  const cv = makeCanvas(128, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const x = w * (0.2 + rnd() * 0.6), y = h * (0.15 + rnd() * 0.8), r = 12 + rnd() * 34;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,252,244,0.34)');
    gr.addColorStop(1, 'rgba(255,252,244,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
  }
  return toTexture(cv, { repeat: 1 });
});

/** 前面ガラスの曇り・水滴 */
const fogTex = (seed) => memo(`od:fog|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 17);
  const { g, w, h, rnd } = cv;
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)');
  gr.addColorStop(1, 'rgba(255,255,255,0.55)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 130; i++) {
    g.globalAlpha = 0.18 + rnd() * 0.5;
    g.fillStyle = '#ffffff';
    const x = rnd() * w, y = rnd() * h, r = 0.8 + rnd() * 2.8;
    g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
    if (rnd() > 0.74) { g.globalAlpha *= 0.5; rr(g, x - r * 0.4, y, r * 0.8, 6 + rnd() * 26, r * 0.4); g.fill(); }
  }
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 5; i++) {
    g.globalAlpha = 0.5 + rnd() * 0.3;
    g.beginPath(); g.ellipse(rnd() * w, h * (0.35 + rnd() * 0.5), 18 + rnd() * 30, 8 + rnd() * 12, rnd() * 3, 0, 6.284); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 焦げ付き・飛沫（釜まわりの縁） */
const scorchedTex = (seed) => memo(`od:scorch|${seed}`, () => {
  const cv = makeCanvas(256, 128);
  if (!cv) return null;
  cv.rnd = rand(seed + 29);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.42;
    g.fillStyle = rnd() > 0.4 ? '#4a3a22' : '#8a6a3a';
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 6, 1 + rnd() * 4, rnd() * 3, 0, 6.284); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 731;
  const rnd = rand(seed);
  const g = grp('oden-counter');

  /* ---------- マテリアル ---------- */
  const ss = MAT.stainless({ worn: 0.62, repeat: 2 });
  const ssDk = MAT.metal('#a3a8aa', { worn: 0.8, spec: 0.5 });
  const chrome = MAT.chrome();
  const tileMat = MAT.paint('#ffffff', {
    map: TEX.tile({ color: '#e8ebe4', n: 10, repeat: 1 }).map,
    normalMap: TEX.tile({ color: '#e8ebe4', n: 10, repeat: 1 }).normalMap,
    normalScaleX: 0.5, normalScaleY: 0.5, spec: 0.5, specPower: 130, specCut: 0.1, sheen: 0.1, shadowAmt: 0.6,
  });
  const glassFog = MAT.glassLite({ color: '#dceaee', opacity: 0.2 });
  const broth = MAT.water({ color: '#b98a4e', opacity: 0.66, scroll: [0.004, 0.003] });
  const gasYellow = MAT.paint('#c9a83f', { worn: 0.7, map: TEX.metal({ base: '#c9a83f', worn: 0.7, repeat: 2 }).map, spec: 0.28 });
  const woodBoard = MAT.wood({ light: '#d8c193', dark: '#a8845a', repeat: 2 });
  const plasticW = MAT.hardPlastic('#e9e5d8', { worn: 0.6 });
  const lampMat = MAT.lampShade({ color: '#ffe9c8', emissive: '#ff9d4a', emissiveIntensity: 0.85 });
  const steamMat = MAT.decal({ map: steamTex(), opacity: 0.5, side: DoubleSide, order: 4 });

  /* ---------- 寸法 ---------- */
  const TW = 1.56, TD = 0.82, TH = 0.90;      // 天板長(X) / 天板奥き(Z) / 天面高
  const BX0 = -0.775, BX1 = 0.35;              // 釜（drop-in 湯銭槽）の X 範囲
  const BZ = 0.278;                            // 釜の半奥行き
  const RIM = 0.96, FLOOR = 0.70, SKIN = 0.82; // 縁 / 釜底 / 出汁の液面
  const SHELF = 0.775;                          // 網棚（具材が載る高）
  const TL = BX1 - BX0, TCX = (BX0 + BX1) / 2;

  /* ============ 1. 躯体（下部キャビ＋釜まわりの外壳） ============ */
  const body = grp('carcass');
  g.add(body);
  body.add(mesh(box(TW - 0.04, 0.06, TD - 0.06), MAT.paint('#4b4f50', { spec: 0.08, steps: 2 }), { pos: [0, 0.03, 0], name: 'kick' }));
  body.add(mesh(box(TW - 0.02, 0.57, TD - 0.04), tileMat, { pos: [0, 0.375, 0], name: 'oden-carcass' }));
  // タイルの目地アルミ（前面）
  for (let i = 1; i < 6; i++) body.add(mesh(box(0.01, 0.57, 0.012), ssDk, { pos: [-TW / 2 + 0.02 + (i * (TW - 0.04)) / 6, 0.375, TD / 2 - 0.026], cast: false }));
  body.add(mesh(box(TW - 0.02, 0.018, 0.024), ssDk, { pos: [0, 0.655, TD / 2 - 0.026] }));
  // 釜まわりの外壳（上部は釜が抜けるので 4 枚の側板で囲う＝内面あり）
  const upH = 0.21, upY = 0.66 + upH / 2;
  body.add(mesh(box(TW - 0.02, upH, 0.014), ss, { pos: [0, upY, TD / 2 - 0.027] }));
  body.add(mesh(box(TW - 0.02, upH, 0.014), ss, { pos: [0, upY, -TD / 2 + 0.027] }));
  for (const sx of [-1, 1]) body.add(mesh(box(0.014, upH, TD - 0.056), ss, { pos: [sx * (TW / 2 - 0.027), upY, 0] }));
  body.add(noHull(mesh(box(TW - 0.05, 0.006, TD - 0.06), MAT.paint('#7f8486', { spec: 0.15, steps: 2 }), { pos: [0, 0.663, 0], cast: false, receive: true })));
  // 天板（釜の開口を残す 3 枚構成：前帯・後帯・右作業帯）
  const bandZ = (TD + 0.04) / 2 - BZ - 0.002;
  body.add(mesh(box(TW + 0.04, 0.04, bandZ + 0.004), ss, { pos: [0, TH - 0.02, BZ + bandZ / 2 + 0.002], name: 'top-front' }));
  body.add(mesh(box(TW + 0.04, 0.04, bandZ + 0.004), ss, { pos: [0, TH - 0.02, -BZ - bandZ / 2 - 0.002], name: 'top-back' }));
  body.add(mesh(box(TW + 0.04 - (BX1 + TW / 2 + 0.02), 0.04, TD + 0.04), ss, { pos: [(BX1 + TW / 2 + 0.02) / 2, TH - 0.02, 0], name: 'top-work' }));
  body.add(mesh(box(0.012, 0.02, TD + 0.04), ssDk, { pos: [BX1 + 0.006, TH + 0.002, 0], cast: false }));   // 開口と作業台の立ち上がり
  // 背面（店員側）点検扉 2 枚
  const bz = -0.7799999999999999 / 2 - 0.010;
  for (let i = 0; i < 2; i++) {
    const d = grp('access-door', { pos: [-0.36 + i * 0.72, 0.36, bz], rot: [0, i === 0 ? -0.05 : 0, 0] });
    d.add(mesh(rbox(0.68, 0.56, 0.016, 0.005, 2), ssDk, {}));
    d.add(mesh(box(0.16, 0.012, 0.02), chrome, { pos: [0.22, 0.2, 0.016] }));
    d.add(mesh(box(0.62, 0.008, 0.008), ss, { pos: [0, -0.24, 0.012], cast: false }));
    weather(d, { w: 0.3, h: 0.2, pos: [-0.1, -0.16, 0.012], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + i * 9, spread: 0.02 });
    body.add(d);
  }
  // 下部棚（内面）と業務用だれ・容器
  body.add(mesh(box(1.2, 0.014, 0.28), ssDk, { pos: [-0.1, 0.19, bz + 0.16] }));
  for (let i = 0; i < 3; i++) {
    body.add(mesh(cyl(0.055, 0.052, 0.13, 14), MAT.metal('#b6bcbf', { worn: 0.55, spec: 0.6 }), { pos: [-0.42 + i * 0.17, 0.262, bz + 0.16] }));
    body.add(noHull(mesh(tor(0.053, 0.004, 5, 16), chrome, { pos: [-0.42 + i * 0.17, 0.326, bz + 0.16], rot: [-Math.PI / 2, 0, 0], cast: false })));
    decal(body, { map: TEX.lightPanel({ text: ['たれ', '原液', '食塩'][i], bg: '#e9e2cf', fg: '#5d564a' }), w: 0.07, h: 0.04, pos: [-0.42 + i * 0.17, 0.26, bz + 0.216], opacity: 0.9 });
  }
  body.add(mesh(rbox(0.34, 0.2, 0.24, 0.01, 2), MAT.plastic('#5d6b63', { spec: 0.28 }), { pos: [0.44, 0.3, bz + 0.16] }));
  // 側面板の通気孔
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) body.add(noHull(mesh(cyl(0.014, 0.014, 0.02, 12), MAT.paint('#3f4447', { spec: 0.1 }), { pos: [sx * (TW / 2 - 0.02), 0.52 - i * 0.1, 0.16], rot: [0, 0, Math.PI / 2], cast: false })));
  }

  /* ============ 2. ステン釜（6 区画・仕切り・ふた・湯面） ============ */
  const tank = grp('broth-tank');
  g.add(tank);
  tank.add(mesh(box(TL, 0.012, BZ * 2), ss, { pos: [TCX, FLOOR, 0], name: 'tank-bottom' }));
  tank.add(noHull(mesh(box(TL - 0.02, 0.006, BZ * 2 - 0.02), MAT.paint('#8c9193', { spec: 0.14, steps: 2 }), { pos: [TCX, FLOOR + 0.01, 0], cast: false, receive: true })));
  // 4 壁（外側＋内側が読めるよう薄板で独立）
  tank.add(mesh(box(TL, 0.28, 0.012), ss, { pos: [TCX, FLOOR + 0.14, BZ] }));
  tank.add(mesh(box(TL, 0.28, 0.012), ss, { pos: [TCX, FLOOR + 0.14, -BZ] }));
  tank.add(mesh(box(0.012, 0.28, BZ * 2), ss, { pos: [BX0, FLOOR + 0.14, 0] }));
  tank.add(mesh(box(0.012, 0.28, BZ * 2), ss, { pos: [BX1, FLOOR + 0.14, 0] }));
  // 縁の折り返し（溶接ビード）
  for (const [w2, d2, x2, z2] of [[TL + 0.05, 0.03, TCX, BZ + 0.008], [TL + 0.05, 0.03, TCX, -BZ - 0.008], [0.03, BZ * 2 + 0.05, BX0 - 0.008, 0], [0.03, BZ * 2 + 0.05, BX1 + 0.008, 0]]) {
    tank.add(mesh(box(w2, 0.018, d2), ssDk, { pos: [x2, RIM, z2] }));
  }
  // 仕切り 5 枚 → 6 区画
  for (let i = 1; i < 6; i++) {
    const x = BX0 + (i * TL) / 6;
    tank.add(mesh(box(0.007, 0.25, BZ * 2 - 0.03), ss, { pos: [x, FLOOR + 0.128, -6e-3] }));
    tank.add(noHull(mesh(box(0.014, 0.01, 0.018), ssDk, { pos: [x, RIM - 0.016, BZ - 0.03], cast: false })));
    tank.add(noHull(mesh(box(0.014, 0.01, 0.018), ssDk, { pos: [x, RIM - 0.016, -BZ + 0.03], cast: false })));
  }
  // 網棚と串受けバー
  for (let i = 0; i < 9; i++) tank.add(noHull(mesh(box(TL - 0.03, 0.0035, 0.006), ssDk, { pos: [TCX, SHELF, -BZ + 0.04 + i * 0.062], cast: false })));
  for (const bx of [BX0 + 0.06, BX1 - 0.06]) tank.add(noHull(mesh(cyl(0.005, 0.005, BZ * 2 - 0.03, 8), ssDk, { pos: [bx, RIM - 0.006, 0], rot: [Math.PI / 2, 0, 0], cast: false })));
  tank.add(noHull(mesh(cyl(0.005, 0.005, TL - 0.03, 8), ssDk, { pos: [TCX, RIM - 0.006, BZ - 0.055], cast: false })));
  tank.add(noHull(mesh(cyl(0.005, 0.005, TL - 0.03, 8), ssDk, { pos: [TCX, RIM - 0.006, -BZ + 0.055], cast: false })));
  // 各区画：出汁の液面・具材（串ごと立てる）・湯気
  const cellVariant = [['daikon', 'daikon', 'satsuma'], ['egg', 'egg', 'konnyaku'], ['konnyaku', 'chikuwa', 'chikuwa'],
    ['satsuma', 'norimaki', 'norimaki'], ['chikuwa', 'daikon', 'egg'], ['norimaki', 'satsuma', 'daikon']];
  const cellCW = TL / 6;
  for (let i = 0; i < 6; i++) {
    const cx = BX0 + cellCW * (i + 0.5);
    tank.add(noHull(mesh(box(cellCW - 0.016, 0.004, BZ * 2 - 0.03), broth, { pos: [cx, SKIN, 0], cast: false, receive: false })));
    tank.add(noHull(mesh(plane(cellCW - 0.02, BZ * 2 - 0.04), MAT.decal({ map: brothSkinTex(seed + i), opacity: 0.8, order: 2 }), { pos: [cx, SKIN + 0.0035, 0], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false })));
    const spots = [[-0.045, -0.1], [0.0, 0.02], [0.042, 0.12]];
    cellVariant[i].forEach((v, k) => {
      const [ox, oz] = spots[k];
      const item = build$1({ seed: seed + i * 31 + k * 7, variant: v, skewer: true });
      item.position.set(cx + ox, SHELF + 0.004, oz);
      item.rotation.y = range(rnd, -0.6, 0.6);
      item.rotation.z = range(rnd, -0.05, 0.05);
      tank.add(item);
    });
    if (i % 2 === 0) {
      const st = noHull(mesh(plane(0.2, 0.44), steamMat, { pos: [cx, SKIN + 0.26, range(rnd, -0.05, 0.05)], rot: [0, range(rnd, -0.4, 0.4), 0], cast: false, receive: false }));
      st.renderOrder = 6;
      tank.add(st);
    }
  }
  // ふた（1 枚は半開き・1 枚は作業台に立てかけ）
  const lidMat = MAT.stainless({ worn: 0.7, spec: 0.66 });
  const lidA = grp('lid', { pos: [BX0 + cellCW * 1.5, RIM + 0.014, -0.01], rot: [0.02, 0, 0.24] });
  lidA.add(mesh(rbox(cellCW + 0.01, 0.009, BZ * 2 - 0.03, 0.004, 2), lidMat, {}));
  lidA.add(mesh(cyl(0.017, 0.02, 0.024, 12), MAT.plastic('#3f4a44', { spec: 0.4, worn: 0.5 }), { pos: [0, 0.017, 0] }));
  lidA.add(noHull(mesh(tor(BZ * 0.45, 0.003, 5, 18), ssDk, { pos: [0, 0.006, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));
  tank.add(lidA);
  const lidB = grp('lid-lean', { pos: [0.66, TH + 0.2, -0.3], rot: [-1.42, 0.16, 0] });
  lidB.add(mesh(rbox(0.24, 0.009, 0.42, 0.004, 2), lidMat, {}));
  lidB.add(mesh(cyl(0.016, 0.019, 0.022, 12), MAT.plastic('#3f4a44', { spec: 0.4 }), { pos: [0, 0.015, -0.16], cast: false }));
  g.add(lidB);
  // 焦げ付き・飛沫（縁・天板）
  decal(tank, { map: scorchedTex(seed), w: TL, h: 0.055, pos: [TCX, RIM + 0.014, BZ + 0.026], rot: [-Math.PI / 2, 0, 0], opacity: 0.75, order: 1 });
  decal(g, { map: scorchedTex(seed + 4), w: 0.5, h: 0.14, pos: [TCX, TH + 0.002, BZ + 0.12], rot: [-Math.PI / 2, 0, 0], opacity: 0.6, order: 2 });
  weather(g, { w: 0.4, h: 0.1, pos: [0.05, TH + 0.0025, BZ + 0.14], rot: [-Math.PI / 2, 0, 0.2], kind: 'scratch', color: '#cfcac0', opacity: 0.3, seed: seed + 6, spread: 0.004 });

  /* ============ 3. 作業天板（右側）と調理用品 ============ */
  const work = grp('worktop', { pos: [0.575, TH, 0] });
  g.add(work);
  // まな板・大根・包丁
  work.add(mesh(rbox(0.3, 0.018, 0.19, 0.006, 2), woodBoard, { pos: [-0.04, 0.009, -0.05] }));
  work.add(noHull(mesh(cyl(0.021, 0.023, 0.14, 14), MAT.food({ color: '#efe6d2', spec: 0.5, specPower: 26 }), { pos: [-0.05, 0.032, -0.05], rot: [0, 0, Math.PI / 2] })));
  work.add(noHull(mesh(cyl(0.023, 0.021, 0.012, 14), MAT.food({ color: '#d8cbb0', spec: 0.4 }), { pos: [0.03, 0.032, -0.05], rot: [0, 0, Math.PI / 2], cast: false })));
  const knife = grp('knife', { pos: [-0.02, 0.024, 0.07], rot: [0, 0.42, 0] });
  knife.add(mesh(box(0.15, 0.0025, 0.026), chrome, {}));
  knife.add(mesh(box(0.07, 0.011, 0.018), MAT.plastic('#3b3f44', { spec: 0.3 }), { pos: [-0.105, 0.004, 0] }));
  work.add(knife);
  // トング（2 腕・バネ）と立て
  const tong = grp('tongs', { pos: [-0.06, 0.0, 0.14], rot: [0, -0.3, 0.05] });
  for (const s2 of [-1, 1]) tong.add(noHull(mesh(tubeOf([[s2 * 0.004, 0.2, 0], [s2 * 0.016, 0.12, 0.012], [s2 * 0.006, 0.055, -0.012]], 0.0038, 12, 6), MAT.stainless({ worn: 0.5, spec: 0.7 }), {})));
  tong.add(noHull(mesh(tor(0.011, 0.0026, 5, 14), MAT.stainless({ worn: 0.4 }), { pos: [0, 0.206, 0], rot: [0, Math.PI / 2, 0], cast: false })));
  work.add(tong);
  work.add(mesh(cyl(0.026, 0.029, 0.07, 12), plasticW, { pos: [-0.14, 0.035, 0.12] }));
  work.add(noHull(mesh(cyl(0.022, 0.022, 0.004, 12), MAT.paint('#6b6f68', { spec: 0.1 }), { pos: [-0.14, 0.067, 0.12], cast: false })));
  // 割り箸（束・透明ケース）
  const hashi = grp('waribashi', { pos: [0.1, 0.0, 0.13] });
  hashi.add(mesh(rbox(0.1, 0.075, 0.06, 0.008, 2), MAT.plastic('#dfe6e2', { transparent: true, opacity: 0.7, spec: 0.4 }), { pos: [0, 0.037, 0] }));
  for (let i = 0; i < 12; i++) {
    hashi.add(noHull(mesh(box(0.004, 0.15, 0.012), MAT.wood({ light: '#e6c893', dark: '#c19a5f', repeat: 4 }), { pos: [-0.03 + (i % 4) * 0.02, 0.09, -0.018 + Math.floor(i / 4) * 0.018], rot: [range(rnd, -0.08, 0.08), 0, range(rnd, -0.08, 0.08)], cast: false })));
  }
  decal(hashi, { map: TEX.lightPanel({ text: '割り箸', bg: '#f0e9d6', fg: '#5d564a' }), w: 0.07, h: 0.02, pos: [0, 0.028, 0.0315], opacity: 0.9 });
  work.add(hashi);
  // たれ入れ（ポンプ式・中身・垂れ）
  const tare = grp('sauce', { pos: [0.12, 0, -0.14] });
  tare.add(mesh(lathe([[0, 0], [0.031, 0], [0.035, 0.012], [0.035, 0.15], [0.03, 0.172], [0.018, 0.186], [0.016, 0.21], [0, 0.212]], 16), MAT.glassLite({ color: '#e6ded0', opacity: 0.34 }), { name: 'sauce-body' }));
  tare.add(mesh(lathe([[0, 0.004], [0.028, 0.004], [0.031, 0.03], [0.031, 0.13], [0, 0.134]], 14), MAT.paint('#6b4a22', { spec: 0.4, shadowAmt: 0.7 }), {}));
  tare.add(mesh(cyl(0.017, 0.016, 0.022, 12), MAT.plastic('#b5372f', { spec: 0.4 }), { pos: [0, 0.222, 0] }));
  tare.add(noHull(mesh(tubeOf([[0, 0.212, 0], [0, 0.11, 0]], 0.003, 8, 5), MAT.plastic('#d8d2c2'), { cast: false })));
  decal(tare, { map: TEX.poster({ title: 'おでんたれ', bg: '#f4ecd8', accent: '#a0522d', seed: seed + 13 }), w: 0.05, h: 0.075, pos: [0, 0.09, 0.0355], opacity: 0.97 });
  weather(tare, { w: 0.03, h: 0.05, pos: [0.02, 0.19, 0.024], kind: 'dirt', color: '#6b4a22', opacity: 0.42, seed: seed + 21, spread: 0.008 });
  work.add(tare);
  // 薬味（からし・ねぎ）
  const yaku = grp('condiment', { pos: [-0.16, 0, -0.1] });
  yaku.add(mesh(rbox(0.11, 0.014, 0.08, 0.006, 2), MAT.plastic('#efeade', { spec: 0.34 }), {}));
  yaku.add(noHull(mesh(cyl(0.026, 0.024, 0.011, 14), MAT.food({ color: '#e8b93a', spec: 0.5, specPower: 30 }), { pos: [-0.022, 0.012, 0], cast: false })));
  for (let i = 0; i < 10; i++) {
    yaku.add(noHull(mesh(cyl(0.0035, 0.0035, 0.0035, 8), MAT.food({ color: i % 3 ? '#7fa855' : '#a8c878', spec: 0.42 }), {
      pos: [0.024 + range(rnd, -0.018, 0.018), 0.011 + rnd() * 0.004, range(rnd, -0.02, 0.02)], rot: [range(rnd, -0.4, 0.4), 0, range(rnd, -0.4, 0.4)], cast: false,
    })));
  }
  yaku.add(mesh(cyl(0.013, 0.011, 0.075, 12), MAT.plastic('#e2574c', { spec: 0.36, worn: 0.5 }), { pos: [0.055, 0.045, 0.02], rot: [0, 0, 0.06] }));
  yaku.add(mesh(box(0.022, 0.008, 0.014), MAT.plastic('#f2efe4', { spec: 0.3 }), { pos: [0.057, 0.086, 0.02], cast: false }));
  work.add(yaku);
  // 見本盛り（ガラス越しに読べる一皿）
  const sample = grp('sample-plate', { pos: [0.6, TH + 0.001, 0.29], rot: [0, -0.24, 0] });
  g.add(sample);
  sample.add(mesh(cyl(0.085, 0.068, 0.016, 20), MAT.plastic('#f2eee2', { spec: 0.4, worn: 0.4 }), { pos: [0, 0.008, 0] }));
  sample.add(noHull(mesh(cyl(0.07, 0.056, 0.004, 20), MAT.paint('#ddd6c4', { spec: 0.2 }), { pos: [0, 0.017, 0], cast: false })));
  [['daikon', -0.028, 0.008], ['egg', 0.024, -0.012], ['chikuwa', 0.004, 0.03]].forEach(([v, px, pz], i) => {
    const it = build$1({ seed: seed + 101 + i * 11, variant: v, skewer: true });
    it.position.set(px, 0.019, pz);
    it.rotation.y = range(rnd, -0.9, 0.9);
    sample.add(it);
  });
  sample.add(noHull(mesh(plane(0.12, 0.05), MAT.decal({ map: brothSkinTex(seed + 3), opacity: 0.5, order: 1 }), { pos: [-0.01, 0.0186, -0.03], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false })));

  /* ============ 4. 前面ガラス（曇り・飛沫） ============ */
  const gp = grp('splash-glass', { pos: [0, TH, BZ + 0.14] });
  g.add(gp);
  gp.add(mesh(rbox(1.24, 0.42, 0.008, 0.004, 2), glassFog, { pos: [TCX + 0.06, 0.21, 0], name: 'oden-glass' }));
  decal(gp, { map: fogTex(seed), w: 1.18, h: 0.4, pos: [TCX + 0.06, 0.21, 0.0052], opacity: 0.85, order: 1 });
  decal(gp, { map: fogTex(seed + 9), w: 0.34, h: 0.3, pos: [0.52, 0.18, 0.0052], opacity: 0.4, order: 2 });
  gp.add(mesh(box(TW - 0.04, 0.018, 0.022), ssDk, { pos: [0, 0.435, 0] }));
  for (const sx of [-1, 1]) gp.add(mesh(box(0.016, 0.44, 0.022), ssDk, { pos: [sx * (TW / 2 - 0.02), 0.215, 0] }));
  for (let i = 0; i < 6; i++) gp.add(noHull(mesh(sph(0.0032 + rnd() * 0.0022, 8, 6), MAT.water({ color: '#e6f2f4', opacity: 0.75, scroll: [0.001, 0.004] }), { pos: [-0.6 + i * 0.22, 0.1 + rnd() * 0.14, 0.0062], scale: [1, 1.5, 0.6], cast: false, receive: false })));
  weather(gp, { w: 0.5, h: 0.14, pos: [0.1, 0.35, 0.006], kind: 'dirt', color: '#d9c9a4', opacity: 0.34, seed: seed + 11, spread: 0.01 });

  /* ============ 5. 換気フード・加熱照明 ============ */
  const hood = grp('hood');
  g.add(hood);
  for (const sx of [-1, 1]) {
    hood.add(mesh(box(0.04, 1.08, 0.04), ss, { pos: [sx * 0.66, 1.4, -0.35] }));
    hood.add(mesh(box(0.056, 0.014, 0.056), ssDk, { pos: [sx * 0.66, 0.9, -0.35] }));
    hood.add(noHull(mesh(box(0.014, 0.5, 0.014), ssDk, { pos: [sx * 0.66, 1.2, -0.2], rot: [0, 0, sx * 0.3], cast: false })));
  }
  const canopy = grp('canopy', { pos: [0, 1.66, -0.1], rot: [0.05, 0, 0] });
  canopy.add(mesh(rbox(1.44, 0.12, 0.62, 0.012, 2), ss, { name: 'hood-body' }));
  canopy.add(mesh(box(1.46, 0.02, 0.03), ssDk, { pos: [0, 0.05, 0.31] }));
  canopy.add(noHull(mesh(box(1.36, 0.012, 0.5), ssDk, { pos: [0, -0.058, 0], cast: false, receive: true })));      // 裏面（内側）
  grill(canopy, { w: 1.2, h: 0.4, nx: 5, ny: 5, bar: 0.01, mat: MAT.metal('#9fa5a7', { worn: 0.8 }), pos: [0, -0.068, 0], rot: [-90 * D2R, 0, 0] });
  canopy.add(mesh(box(0.32, 0.24, 0.32), MAT.galvanized({ worn: 0.6, spec: 0.3 }), { pos: [0.24, 0.16, -0.22] }));   // ダクト
  canopy.add(noHull(mesh(coil(0.15, 0.18, 3, 12, 0.006), MAT.galvanized({ spec: 0.28 }), { pos: [0.24, 0.3, -0.22] })));
  for (let i = 0; i < 3; i++) {                                                                                     // 加熱照明（呼吸）
    const lx = -0.48 + i * 0.48;
    const lamp = grp('heat-lamp', { pos: [lx, -0.085, 0.02] });
    lamp.userData.breathe = { speed: 0.32 + i * 0.06, amount: 0.09, phase: i * 1.7 };
    lamp.add(mesh(cyl(0.028, 0.055, 0.05, 14), MAT.hardPlastic('#4a4f52', { worn: 0.7 }), { pos: [0, 0.022, 0] }));
    lamp.add(noHull(mesh(sph(0.026, 12, 9), lampMat, { pos: [0, -6e-3, 0], cast: false, receive: false })));
    lamp.add(noHull(mesh(tor(0.03, 0.0035, 5, 16), ssDk, { pos: [0, 0.046, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));
    canopy.add(lamp);
  }
  weather(canopy, { w: 0.5, h: 0.12, pos: [-0.3, -0.062, 0.1], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6540', opacity: 0.42, seed: seed + 24, spread: 0.006 });
  weather(canopy, { w: 0.3, h: 0.16, pos: [0.66, 0.02, 0.31], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + 26, spread: 0.03 });
  g.add(hood);
  // 温度計（右ポスト）
  const th = grp('thermo', { pos: [0.66, 1.26, -0.32], rot: [0, 0.2, 0] });
  th.add(mesh(cyl(0.045, 0.045, 0.016, 16), MAT.plastic('#efe9da', { spec: 0.3, worn: 0.5 }), { rot: [Math.PI / 2, 0, 0] }));
  th.add(noHull(mesh(cyl(0.038, 0.038, 0.003, 16), MAT.paint('#f7f3e6', { spec: 0.2 }), { pos: [0, 0, 0.009], rot: [Math.PI / 2, 0, 0], cast: false })));
  th.add(noHull(mesh(box(0.024, 0.0022, 0.003), MAT.paint('#b5372f', { spec: 0.2 }), { pos: [0.008, 0.008, 0.012], rot: [0, 0, 0.9], cast: false })));
  for (let i = 0; i < 8; i++) th.add(noHull(mesh(box(0.003, 0.006, 0.002), MAT.paint('#4a4640'), { pos: [Math.cos((i / 8) * 6.28) * 0.03, Math.sin((i / 8) * 6.28) * 0.03, 0.011], cast: false })));
  g.add(th);

  /* ============ 6. 値札 POP ============ */
  const popPos = [[BX0 + 0.1, 1.005, BZ + 0.03, '大根 120'], [BX0 + TL * 0.5, 1.005, BZ + 0.03, 'たまご 100'], [0.44, TH + 0.002, BZ + 0.11, 'おでん 6種']];
  popPos.forEach(([px, py, pz, txt], i) => {
    const flat = i === 2;
    const pop = grp('pop', { pos: [px, py, pz], rot: [flat ? -Math.PI / 2 + 0.1 : -0.16, range(rnd, -0.22, 0.22), 0] });
    pop.add(mesh(rbox(0.13, 0.085, 0.004, 0.003, 2), MAT.paper({ color: '#fbf5e4' }), {}));
    decal(pop, { map: TEX.lightPanel({ text: txt, bg: '#fbf5e4', fg: i === 1 ? '#b5372f' : '#3f4a44', spacing: 2 }), w: 0.118, h: 0.07, pos: [0, 0, 0.003], opacity: 0.98 });
    pop.add(noHull(mesh(box(0.13, 0.012, 0.004), MAT.plastic('#e2574c', { spec: 0.3 }), { pos: [0, 0.036, 0], cast: false })));
    if (!flat) pop.add(mesh(box(0.008, 0.03, 0.008), MAT.plastic('#c9c3b2'), { pos: [0, -0.045, -8e-3], cast: false }));
    g.add(pop);
  });
  // 吊り POP（フードから下げる・両面印刷）
  const hang = grp('hang-pop', { pos: [-0.24, 1.42, 0.14], rot: [0.12, 0.1, 0] });
  hang.add(mesh(plane(0.24, 0.16), MAT.poster({ map: TEX.poster({ title: 'おでんの季節', bg: '#f5e9cf', accent: '#b5573a', seed: seed + 33 }) })));
  hang.add(noHull(mesh(plane(0.24, 0.16), MAT.poster({ map: TEX.poster({ title: 'おでんの季節', bg: '#efe1c4', accent: '#a44f34', seed: seed + 33 }) }), { pos: [0, 0, -4e-3], rot: [0, Math.PI, 0], cast: false })));
  for (const sx of [-1, 1]) hang.add(noHull(mesh(tubeOf([[sx * 0.09, 0.08, 0], [sx * 0.12, 0.19, -0.03]], 0.0013, 6, 4), MAT.plastic('#c9c3b2'), { cast: false })));
  g.add(hang);

  /* ============ 7. 下部のガス管とバルブ ============ */
  const gas = grp('gas', { pos: [0, 0.14, -0.52] });
  g.add(gas);
  gas.add(noHull(mesh(tubeOf([[BX0 - 0.02, 0, 0], [BX1 + 0.14, 0, 0]], 0.016, 14, 8), gasYellow, {})));
  gas.add(noHull(mesh(tubeOf([[BX0 - 0.02, 0, 0], [BX0 - 0.02, 0.12, -0.14]], 0.016, 10, 8), gasYellow, {})));
  for (const bx of [BX0 + 0.14, TCX, BX1 - 0.14]) {
    gas.add(noHull(mesh(cyl(0.02, 0.02, 0.024, 10), MAT.metal('#b0b5b7', { worn: 0.6 }), { pos: [bx, 0.018, 0] })));
    gas.add(noHull(mesh(tubeOf(catenary([bx, 0.03, 0.012], [bx, 0.4, 0.14], 0.05, 10), 0.008, 12, 6), MAT.rubber('#5a5f52'), {})));
  }
  const valve = grp('valve', { pos: [BX0 + 0.36, 0, 0] });
  valve.add(mesh(cyl(0.026, 0.026, 0.052, 12), MAT.metal('#b8a04a', { worn: 0.7, spec: 0.5 }), { rot: [0, 0, Math.PI / 2] }));
  valve.add(mesh(box(0.05, 0.01, 0.016), MAT.plastic('#c0392b', { spec: 0.32, worn: 0.5 }), { pos: [0, 0.034, 0], rot: [0, 0, 0.35] }));
  valve.add(noHull(mesh(tor(0.028, 0.004, 5, 14), MAT.metal('#9a8c4a', { worn: 0.6 }), { pos: [0.026, 0, 0], rot: [0, Math.PI / 2, 0], cast: false })));
  gas.add(valve);
  decal(gas, { map: TEX.signboard({ text: 'ガス注意', bg: '#f0c353', fg: '#4a3a10', size: 110 }), w: 0.11, h: 0.05, pos: [BX1 + 0.06, 0.05, 0.02], opacity: 0.95 });
  weather(gas, { w: 0.4, h: 0.06, pos: [0, 0.02, 0.02], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + 35, spread: 0.01 });
  g.add(gas);

  /* ============ 8. 床の排水グリル・水跡 ============ */
  const drain = grp('floor-drain', { pos: [TCX, 0, BZ + 0.6] });
  g.add(drain);
  drain.add(mesh(rbox(TL - 0.14, 0.012, 0.22, 0.004, 2), ssDk, { pos: [0, 0.006, 0], name: 'drain-frame' }));
  grill(drain, { w: TL - 0.2, h: 0.15, nx: 2, ny: 9, bar: 0.01, mat: MAT.metal('#9ba1a3', { worn: 0.75 }), pos: [0, 0.0122, 0], rot: [-90 * D2R, 0, 0] });
  drain.add(noHull(mesh(box(TL - 0.24, 0.012, 0.15), MAT.paint('#2f3332', { spec: 0.05, steps: 2 }), { pos: [0, 0.006, 0], cast: false, receive: false })));
  decal(drain, { map: scorchedTex(seed + 8), w: TL - 0.24, h: 0.18, pos: [0.02, 0.0128, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.7, order: 1 });
  decal(g, { map: fogTex(seed + 5), w: 0.7, h: 0.3, pos: [TCX + 0.2, 0.0016, BZ + 0.42], rot: [-Math.PI / 2, 0, 0], opacity: 0.34, order: 3 });
  weather(g, { w: 0.5, h: 0.2, pos: [TCX - 0.1, 0.0018, BZ + 0.46], rot: [-Math.PI / 2, 0, 0.2], kind: 'dirt', color: '#5b564c', opacity: 0.3, seed: seed + 38, spread: 0.003 });
  for (let i = 0; i < 3; i++) {                                                     // 落ちた具材のかけら
    g.add(noHull(mesh(cyl(0.008 + i * 0.002, 0.009, 0.004, 10), MAT.food({ color: i === 2 ? '#7fa855' : '#efe4cc', spec: 0.5 }), {
      pos: [TCX + range(rnd, -0.35, 0.4), 0.014, BZ + range(rnd, 0.34, 0.62)], rot: [-Math.PI / 2 + range(rnd, -0.2, 0.2), 0, range(rnd, 0, 3)], cast: false,
    })));
  }
  // 釜まわりの手脂・床の擦れ（経年まとめ）
  weather(g, { w: 0.4, h: 0.2, pos: [TCX, 0.6, -BZ - 0.16], kind: 'dirt', color: '#6f6152', opacity: 0.22, seed: seed + 40, spread: 0.02 });
  weather(g, { w: 0.3, h: 0.1, pos: [0.6, 0.62, TD / 2 - 0.02], kind: 'chip', color: '#cdc7ba', opacity: 0.26, seed: seed + 42, spread: 0.02 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
