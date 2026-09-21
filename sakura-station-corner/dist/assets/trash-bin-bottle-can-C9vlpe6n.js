import { g as grp, M as MAT, P as PAL, m as mesh, b as box, r as rbox, c as cyl, E as inst, a as sph, T as TEX, H as plane, w as weather, i as grill, h as decal, n as range, t as tor, o as lathe, p as shadowBlob, q as finish, k as tubeOf, z as rand } from './index-C4-XtFer.js';

//  assets/street/trash-bin-bottle-can.js —— びん・缶専用ステーション（金網カゴ＋蓋＋底の砂利と落ち葉）
//  原点 = 地面接触中心 / +Y 上 / 正面（ラベル・投入口）+Z

const meta = {
  id: 'trash-bin-bottle-can',
  real: [0.42, 0.60, 0.34],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);

  const g = grp('trash-bin-bottle-can');

  /* ---------------- 寸法 ---------------- */
  const W = 0.42, D = 0.34, yTray = 0.052, yTop = 0.520;
  const hw = W / 2, hd = D / 2;
  const postX = hw - 0.009, postZ = hd - 0.009;

  /* ---------------- 材質 ---------------- */
  const zinc = MAT.galvanized({ repeat: 4, uv: { repeat: [3, 3] } });
  const wire = MAT.metal('#9fa6a8', { worn: 0.85, repeat: 5, spec: 0.5 });
  const wireBent = MAT.metal('#a8a39c', { worn: 1.0, repeat: 5 });
  const frame = MAT.metalPaint(PAL.lampBlack, { worn: 0.9, repeat: 3 });
  const trayMat = MAT.galvanized({ repeat: 3, tint: '#d9d5cc' });
  const labelPlate = MAT.paint(PAL.signGreen, { sat: 0.72, tint: '#eef2e8', steps: 2 });

  /* ================= Frame ================= */
  const fr = grp('frame');
  g.add(fr);
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? -1 : 1;
    fr.add(mesh(box(0.018, yTop - yTray + 0.03, 0.018), frame, { pos: [sx * postX, (yTray + yTop) / 2 + 0.008, sz * postZ] }));
    // 脚（防振ゴム＋サビた根元）
    fr.add(mesh(rbox(0.030, 0.014, 0.030, 0.004, 2), MAT.rubber('#2f3238'), { pos: [sx * postX, yTray - 0.034, sz * postZ] }));
    fr.add(mesh(cyl(0.011, 0.013, 0.026, 8), MAT.metal('#8d7a68', { worn: 1, repeat: 6 }), { pos: [sx * postX, yTray - 0.014, sz * postZ] }));
  }
  for (const y of [yTray - 0.005, yTop + 0.018, (yTray + yTop) / 2 + 0.06]) {
    for (const sz of [-1, 1]) fr.add(mesh(box(W - 0.014, 0.014, 0.014), frame, { pos: [0, y, sz * postZ] }));
    for (const sx of [-1, 1]) fr.add(mesh(box(0.014, 0.014, D - 0.014), frame, { pos: [sx * postX, y, 0] }));
  }

  /* ================= 底トレイ（砂利と落ち葉） ================= */
  const tray = grp('tray');
  g.add(tray);
  tray.add(mesh(box(W - 0.02, 0.012, D - 0.02), trayMat, { pos: [0, yTray - 0.006, 0] }));
  for (const sz of [-1, 1]) tray.add(mesh(box(W - 0.02, 0.026, 0.008), trayMat, { pos: [0, yTray + 0.012, sz * (hd - 0.014)] }));
  for (const sx of [-1, 1]) tray.add(mesh(box(0.008, 0.026, D - 0.036), trayMat, { pos: [sx * (hw - 0.014), yTray + 0.012, 0] }));
  // 排水穴（黒い开口に見せる小判）
  for (const [x, z] of [[-0.12, -0.06], [0, 0.06], [0.12, -0.06], [-0.06, 0.10], [0.07, -0.11]]) {
    tray.add(mesh(cyl(0.011, 0.011, 0.014, 10), MAT.paint('#2a2c2e', { steps: 2, shadowAmt: 1 }), { pos: [x, yTray - 0.006, z] }));
  }
  // 砂利（砕石＝インスタンス可）
  tray.add(inst(sph(0.010, 4, 3), MAT.ballast({ repeat: 1 }), 120, (i, d, r, col) => {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.155;
    d.position.set(Math.cos(a) * rr * 1.28, yTray + 0.006 + r() * 0.008, Math.sin(a) * rr * 0.92);
    d.scale.set(0.55 + r() * 0.9, 0.42 + r() * 0.5, 0.55 + r() * 0.9);
    d.rotation.set(r() * 3, r() * 3, r() * 3);
    col.setRGB(0.72 + r() * 0.34, 0.70 + r() * 0.30, 0.64 + r() * 0.28);
  }, { name: 'gravel', cast: false, receive: true }));
  // 落ち葉（カゴ底・蓋の上・足元にも）
  const leafTex = TEX.leafCluster({ base: '#9c8a5c', seed: seed + 2 });
  const leafMat = MAT.leaf({ map: leafTex, alphaMap: leafTex, alphaTest: 0.35 });
  const leafGeo = plane(0.055, 0.055);
  const leaves = (count, yFn, castShadow, cx = 0, cz = 0, rad = 0.15) => inst(leafGeo, leafMat, count, (i, d, r) => {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * rad;
    d.position.set(cx + Math.cos(a) * rr * 1.2, yFn(r), cz + Math.sin(a) * rr * 0.9);
    d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.34, 0, r() * 6.283);
    d.scale.setScalar(0.7 + r() * 0.6);
  }, { name: 'leaves', cast: castShadow, receive: true });
  tray.add(leaves(14, (r) => yTray + 0.017 + r() * 0.005, false));
  weather(tray, { w: 0.20, h: 0.12, pos: [0.04, yTray + 0.014, -0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4a4438', opacity: 0.6, seed: seed + 6, density: 1.8, spread: 0.006 });

  /* ================= 金網（4 面） ================= */
  const cage = grp('wire-cage');
  g.add(cage);
  const meshMat = wire;
  // 前後
  for (const sz of [-1, 1]) {
    grill(cage, { w: W - 0.034, h: yTop - yTray - 0.020, nx: 13, ny: 8, bar: 0.0045, mat: meshMat, pos: [0, (yTray + yTop) / 2 + 0.006, sz * (hd - 0.008)], rot: [0, 0, 0] });
  }
  // 左右（1 本だけ明らかに曲がった金線＝経年の変形）
  for (const sx of [-1, 1]) {
    grill(cage, { w: D - 0.034, h: yTop - yTray - 0.020, nx: 10, ny: 8, bar: 0.0045, mat: meshMat, pos: [sx * (hw - 0.008), (yTray + yTop) / 2 + 0.006, 0], rot: [0, Math.PI / 2, 0] });
  }
  cage.add(mesh(tubeBent(0.14, 0.0048), wireBent, { pos: [hw - 0.004, 0.30, 0.02], rot: [0, Math.PI / 2, 0] }));
  cage.add(mesh(tubeBent(0.11, 0.0048), wireBent, { pos: [-0.206, 0.22, -0.05], rot: [0, Math.PI / 2, 6 * D2R] }));
  // 帯（網を押さえる横バー）
  for (const y of [0.20, 0.40]) {
    for (const sz of [-1, 1]) cage.add(mesh(box(W - 0.006, 0.008, 0.008), zinc, { pos: [0, y, sz * (hd - 0.006)] }));
    for (const sx of [-1, 1]) cage.add(mesh(box(0.008, 0.008, D - 0.006), zinc, { pos: [sx * (hw - 0.006), y, 0] }));
  }

  /* ================= 前面ラベル帯 ================= */
  const band = grp('front-band');
  g.add(band);
  band.add(mesh(rbox(W - 0.01, 0.115, 0.014, 0.005, 2), labelPlate, { pos: [0, 0.128, hd + 0.004] }));
  decal(band, { map: TEX.signboard({ text: 'びん・かん', sub: '水洗いしてから出してください', bg: '#2f6b52', fg: '#f6f3e6' }), w: 0.34, h: 0.085, pos: [0, 0.128, hd + 0.0118] });
  band.add(mesh(box(0.04, 0.03, 0.008), MAT.paint(PAL.markingYellow, { sat: 0.75, tint: '#f8efdb' }), { pos: [0.15, 0.098, hd + 0.012] }));   // 小札（日付札）
  weather(band, { w: 0.16, h: 0.06, pos: [-0.1, 0.098, hd + 0.0122], kind: 'chip', color: '#e7e2d2', opacity: 0.55, seed: seed + 8, density: 1.6, spread: 0.005 });

  /* ================= 蓋（半開き・網付き） ================= */
  const lid = grp('lid', { pos: [0, yTop + 0.030, -hd + 0.004] });
  g.add(lid);
  lid.rotation.x = -13 * D2R;                       // いつも少し開いている
  const LW = W + 0.012, LD = D + 0.012;
  for (const sz of [-1, 1]) lid.add(mesh(rbox(LW, 0.016, 0.018, 0.005, 2), zinc, { pos: [0, 0.008, sz === 1 ? LD - 0.009 : 0.009] }));
  lid.add(mesh(rbox(0.018, 0.016, LD, 0.005, 2), zinc, { pos: [-0.207, 0.008, LD / 2] }));
  lid.add(mesh(rbox(0.018, 0.016, LD, 0.005, 2), zinc, { pos: [LW / 2 - 0.009, 0.008, LD / 2] }));
  lid.add(mesh(box(LW - 0.02, 0.012, 0.02), zinc, { pos: [0, 0.010, LD * 0.50] }));                   // 中央留め
  grill(lid, { w: LW - 0.030, h: LD - 0.030, nx: 13, ny: 11, bar: 0.0045, mat: meshMat, pos: [0, 0.010, LD / 2], rot: [-Math.PI / 2, 0, 0] });
  // 投入口の押しバー
  lid.add(mesh(rbox(0.13, 0.014, 0.020, 0.005, 2), MAT.plastic(PAL.storeBand2, { sat: 0.80, tint: '#fff6e2' }), { pos: [0, 0.021, LD * 0.78] }));   // 押しバー（色褪せ）
  // ヒンジ・ガス泡
  for (const x of [-0.13, 0.13]) {
    lid.add(mesh(cyl(0.0075, 0.0075, 0.036, 8), MAT.darkIron({ repeat: 6 }), { pos: [x, 0.004, 0.004], rot: [0, Math.PI / 2, 0] }));
    weather(lid, { w: 0.05, h: 0.03, pos: [x, 0.014, 0.010], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 12 + Math.round(x * 100), spread: 0.004 });
  }
  // 蓋上の落ち葉・鳥フン・サビ
  lid.add(leaves(6, (r) => 0.021 + r() * 0.004, false, 0, LD / 2, 0.115));
  weather(lid, { w: 0.20, h: 0.16, pos: [-0.05, 0.019, LD * 0.42], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#e6e2d4', opacity: 0.5, seed: seed + 14, density: 0.7, spread: 0.006 });
  weather(lid, { w: 0.16, h: 0.12, pos: [0.10, 0.019, LD * 0.66], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a6f52', opacity: 0.42, seed: seed + 15, spread: 0.005 });

  /* ================= 中身：潰れた缶 2 本・空ペット 1 本 ================= */
  const stuff = grp('contents');
  g.add(stuff);
  const canMatA = MAT.canBody({ color: '#c94f45', map: TEX.drinkLabel({ name: 'サイダー', sub: 'SPARKLING', ml: '350ml', a: '#c94f45', b: '#f6efe0' }) });
  const canMatB = MAT.canBody({ color: '#3d76b4', map: TEX.drinkLabel({ name: '緑茶', sub: 'GREEN TEA', ml: '280ml', a: '#3d76b4', b: '#eef4ee' }) });
  for (const [x, z, ry, mat] of [[-0.095, 0.045, 0.7, canMatA], [0.070, -0.055, -1.9, canMatB]]) {
    const can = grp('crushed-can');
    can.position.set(x, yTray + 0.026, z);
    can.rotation.set(74 * D2R, ry, range(rnd, -8, 8) * D2R);
    stuff.add(can);
    can.add(mesh(cyl(0.0325, 0.0305, 0.104, 14), mat, { scale: [1, 1, 0.66] }));                     // 潰れた断面
    can.add(mesh(tor(0.0300, 0.0028, 5, 16), MAT.metal('#cfd4d6', { repeat: 8 }), { pos: [0, 0.050, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.66, 1] }));
    can.add(mesh(tor(0.0295, 0.0026, 5, 16), MAT.metal('#c6cbcd', { repeat: 8 }), { pos: [0, -0.052, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.66, 1] }));
    can.add(mesh(rbox(0.062, 0.006, 0.030, 0.003, 2), mat, { pos: [0, 0.006, 0.006], rot: [0, 0, 6 * D2R] }));   // 折り目のへこみ
    can.add(mesh(cyl(0.0322, 0.0322, 0.004, 14), MAT.metal('#dfe3e5', { repeat: 8 }), { pos: [0, 0.052, 0], scale: [1, 1, 0.66] }));
  }
  // 空ペット（中身なし＝透明、キャップ白）
  const pet = grp('pet-empty');
  pet.position.set(0.015, yTray + 0.036, -0.02);
  pet.rotation.set(90 * D2R, 0.9, 12 * D2R);
  stuff.add(pet);
  pet.add(mesh(lathe([[0, -0.115], [0.028, -0.112], [0.0355, -0.085], [0.0345, -0.02], [0.0325, 0.03], [0.019, 0.078], [0.014, 0.094], [0.0148, 0.106], [0.009, 0.110], [0, 0.111]], 18),
    MAT.glassLite({ color: '#e4f1f3', opacity: 0.40 }), { scale: [1, 1, 0.88], cast: false, receive: false }));
  pet.add(mesh(cyl(0.0152, 0.0148, 0.013, 12), MAT.hardPlastic('#eae7dd', { repeat: 6 }), { pos: [0, 0.114, 0] }));
  pet.add(mesh(rbox(0.052, 0.034, 0.0016, 0.0008, 2), MAT.paper({ color: '#eef3e8' }), { pos: [0, -0.02, 0.030], cast: false }));
  decal(pet, { map: TEX.drinkLabel({ name: '水', sub: 'NATURAL WATER', ml: '500ml', a: '#8fb6cf', b: '#f2f7f8' }), w: 0.050, h: 0.030, pos: [0, -0.02, 0.0315], opacity: 0.9 });
  // びん（1 本混入＝分別ミス、経年の物語）
  const bt = grp('stray-bottle');
  bt.position.set(-0.115, yTray + 0.030, -0.075);
  bt.rotation.set(88 * D2R, -0.5, 0);
  stuff.add(bt);
  bt.add(mesh(lathe([[0, -0.072], [0.029, -0.07], [0.0322, -0.04], [0.031, 0.012], [0.0205, 0.045], [0.0125, 0.062], [0.012, 0.086], [0.0135, 0.094], [0.0075, 0.098], [0, 0.099]], 16),
    MAT.glassLite({ color: '#a9cfae', opacity: 0.5 }), { cast: false, receive: false }));

  /* ================= カゴ外の錆・苔 ================= */
  weather(cage, { w: 0.14, h: 0.22, pos: [-0.212, 0.20, 0.05], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 21, density: 1.7, spread: 0.006 });
  weather(cage, { w: 0.16, h: 0.16, pos: [hw + 0.002, 0.14, -0.04], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 22, density: 1.5, spread: 0.006 });
  weather(cage, { w: 0.24, h: 0.10, pos: [0.02, 0.44, hd + 0.002], kind: 'dirt', color: '#6b6152', opacity: 0.45, seed: seed + 23, density: 1.3, spread: 0.005 });
  weather(fr, { w: 0.10, h: 0.10, pos: [-hw + 0.01, 0.075, hd - 0.005], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 24, density: 1.6, spread: 0.005 });
  weather(fr, { w: 0.08, h: 0.09, pos: [hw - 0.01, 0.068, -hd + 0.01], rot: [0, Math.PI, 0], kind: 'moss', color: '#6d8a52', opacity: 0.5, seed: seed + 25, spread: 0.005 });
  // トレイから溢れた砂利が地面へ
  g.add(inst(sph(0.009, 4, 3), MAT.ballast({ repeat: 1 }), 14, (i, d, r, col) => {
    const a = r() * Math.PI * 2, rr = 0.20 + r() * 0.09;
    d.position.set(Math.cos(a) * rr, 0.017 + r() * 0.004, Math.sin(a) * rr * 0.62);
    d.scale.setScalar(0.5 + r() * 0.55);
    d.rotation.set(r() * 3, r() * 3, r() * 3);
    col.setRGB(0.7 + r() * 0.3, 0.68 + r() * 0.28, 0.62 + r() * 0.26);
  }, { name: 'spilled-gravel', cast: false, receive: true }));
  g.add(leaves(8, () => 0.014, false, 0, 0, 0.185));

  shadowBlob(g, { r: 0.27, pos: [0, 0.003, 0], opacity: 0.28, ratio: 0.82 });

  return finish(g, { outline: 'normal' });
}

/** 曲がった金線（網が変形した個所を1 本だけ別 Mesh で） */
function tubeBent(len, r) {
  return tubeOf([
    [-len / 2, 0, 0], [-len * 0.18, r * 1.6, r * 2.4], [len * 0.16, -r * 1.2, r * 3.1], [len / 2, 0, 0],
  ], r, 10, 6);
}

export { build, meta };
