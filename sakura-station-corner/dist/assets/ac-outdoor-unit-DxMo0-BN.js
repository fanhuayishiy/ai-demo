import { g as grp, M as MAT, m as mesh, b as box, r as rbox, c as cyl, k as tubeOf, w as weather, i as grill, an as Quaternion, V as Vector3, am as hoop, a as sph, A as row, d as coil, P as PAL, h as decal, T as TEX, t as tor, D as DoubleSide, n as range, o as lathe, p as shadowBlob, q as finish, z as rand } from './index-D8uBk-tk.js';

//  assets/street/ac-outdoor-unit.js —— 冷暖房室外機（前面ファングリル／背面フィン列／配管・ドレン・据付金物）
//  原点 = 地面（または支持面）接触中心 / +Y 上 / 前面（ファングリル）+Z・壁側 -Z

const meta = {
  id: 'ac-outdoor-unit',
  real: [0.70, 0.55, 0.30],      // 基本寸法。背面 -Z 側は配管・ブラケット含め原点から約 0.25m、前面 +Z 側はグリル・ドレン受け含め約 0.20m まで張り出す
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const wallMount = options.wallMount !== false;
  const size = options.size ?? 1;

  const g = grp('ac-outdoor-unit');

  /* ---------------- 寸法 ---------------- */
  const CW = 0.68, CD = 0.27, yBot = 0.048, yTop = 0.520;
  const ch = yTop - yBot, yc = (yBot + yTop) / 2;
  const fz = CD / 2;                                   // 前面板の中心 z

  /* ---------------- 材質（塗装鉄・アルミ・亜鉛・樹脂） ---------------- */
  // 黄変した白塗装鉄（PAL.paintWarm を黄ばませた指定色）
  const casePaint = MAT.metalPaint('#e6e2d2', { worn: 0.55, repeat: 2, tint: '#fff4dc', sat: 1.04 });
  const caseTop = MAT.metalPaint('#ded9c8', { worn: 0.8, repeat: 3, tint: '#ffeecb' });
  MAT.metal('#c4c9cc', { spec: 0.6, repeat: 4 });
  const galv = MAT.galvanized({ repeat: 4 });
  const dark = MAT.paint('#3b3e42', { steps: 2, shadowAmt: 1, sheen: 0.02 });
  const deepShadow = MAT.paint('#1c1e21', { steps: 2, shadowAmt: 1, spec: 0.04 });
  const finCu = MAT.metal('#b47a4c', { spec: 0.7, specPower: 110, repeat: 3 });
  const foamWhite = MAT.plastic('#e9e6dc', { sat: 0.86, tint: '#f8f0dc', steps: 3 });
  const foamTorn = MAT.rubber('#2e3134');
  const resin = MAT.plastic('#5a5f5c', { steps: 2 });
  const grilleMat = MAT.metal('#a9aeb1', { worn: 0.55, repeat: 3 });

  /* ================= 脚まわり：据付金物・アンカーボルト・ドレン受け ================= */
  const base = grp('base');
  g.add(base);
  base.add(mesh(box(CW - 0.02, 0.014, CD - 0.01), galv, { pos: [0, 0.041, 0] }));            // 底板
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? -1 : 1;
    const fx = sx * (CW / 2 - 0.048), fq = sz * (CD / 2 - 0.040);
    // L 字支持金物（床面プレ＋立上り）
    base.add(mesh(box(0.064, 0.006, 0.058), galv, { pos: [fx - sx * 0.008, 0.003, fq] }));
    base.add(mesh(box(0.007, 0.038, 0.058), galv, { pos: [fx + sx * 0.026, 0.022, fq] }));
    // 防振ゴム（胴と金物の間）
    base.add(mesh(rbox(0.050, 0.013, 0.046, 0.004, 2), resin, { pos: [fx - sx * 0.010, 0.0125, fq] }));
    // アンカーボルト（ワッシャ＋六角ナット）
    base.add(mesh(cyl(0.0128, 0.0128, 0.0035, 10), MAT.metal('#8f9497', { worn: 0.9, repeat: 6 }), { pos: [fx - sx * 0.030, 0.0078, fq] }));
    base.add(mesh(cyl(0.0088, 0.0088, 0.013, 6), MAT.stainless({ repeat: 8 }), { pos: [fx - sx * 0.030, 0.0155, fq] }));
    base.add(mesh(cyl(0.0042, 0.0042, 0.020, 8), MAT.darkIron({ repeat: 6 }), { pos: [fx - sx * 0.030, 0.0105, fq] }));
  }
  // ドレン水受け（前下面に提げる浅い樹脂トレイ）
  const pan = grp('drain-pan');
  base.add(pan);
  pan.add(mesh(rbox(CW - 0.10, 0.014, 0.086, 0.005, 2), MAT.plastic('#6e726b', { steps: 2, sat: 0.82, tint: '#e8ead8' }), { pos: [0, 0.026, fz + 0.012] }));
  pan.add(mesh(box(CW - 0.112, 0.005, 0.074), deepShadow, { pos: [0, 0.0315, fz + 0.012] }));
  pan.add(mesh(cyl(0.010, 0.010, 0.012, 10), dark, { pos: [CW / 2 - 0.086, 0.024, fz + 0.036] }));
  for (const sx of [-1, 1]) pan.add(mesh(box(0.012, 0.024, 0.012), galv, { pos: [sx * (CW / 2 - 0.062), 0.038, fz + 0.012] }));
  // ドレンホース（細・黒、地面まで垂れる）
  pan.add(mesh(tubeOf([
    [CW / 2 - 0.086, 0.020, fz + 0.038], [CW / 2 - 0.072, 0.014, fz + 0.052],
    [CW / 2 - 0.082, 0.020, fz + 0.066], [CW / 2 - 0.098, 0.013, fz + 0.078],
  ], 0.0075, 14, 7), MAT.rubber('#3a3d40')));
  weather(pan, { w: 0.22, h: 0.06, pos: [-0.06, 0.0345, fz + 0.012], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#5f7f4a', opacity: 0.62, seed: seed + 3, density: 1.8, spread: 0.006 });
  weather(pan, { w: 0.16, h: 0.05, pos: [0.14, 0.0340, fz + 0.020], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#6e7f5c', opacity: 0.5, seed: seed + 4, spread: 0.005 });
  weather(base, { w: 0.30, h: 0.10, pos: [0.0, 0.0045, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.5, seed: seed + 5, density: 1.6, spread: 0.004 });   // 据付面の泥水跡

  /* ================= 本体ケース（4 面＋裏面） ================= */
  const caseG = grp('case');
  g.add(caseG);
  caseG.add(mesh(box(CW, ch, 0.012), casePaint, { pos: [0, yc, -fz + 0.006] }));                  // 背面
  for (const sx of [-1, 1]) {
    caseG.add(mesh(box(0.012, ch, CD - 0.024), casePaint, { pos: [sx * (CW / 2 - 0.006), yc, 0] })); // 側面
  }
  caseG.add(mesh(box(CW, 0.014, CD), casePaint, { pos: [0, yTop - 0.007, 0] }));                  // 天板下地
  // 上面（少し大きく、縁に立ち上がり）
  const top = grp('top-panel');
  caseG.add(top);
  top.add(mesh(rbox(CW + 0.016, 0.014, CD + 0.016, 0.004, 2), caseTop, { pos: [0, yTop + 0.006, 0] }));
  top.add(mesh(box(CW + 0.016, 0.008, 0.010), caseTop, { pos: [0, yTop + 0.013, (CD + 0.016) / 2 - 0.005] }));
  top.add(mesh(box(CW + 0.016, 0.008, 0.010), caseTop, { pos: [0, yTop + 0.013, -0.138] }));
  // 側面のルーバー（吸気スリット：横スラット 6 本 × 2 面）
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const y = yBot + 0.075 + k * 0.062;
      caseG.add(mesh(box(0.006, 0.030, CD - 0.09), dark, { pos: [sx * (CW / 2 + 0.001), y, -8e-3], rot: [0, 0, 0] }));
      caseG.add(mesh(box(0.010, 0.006, CD - 0.09), casePaint, { pos: [sx * (CW / 2 + 0.002), y + 0.017, -8e-3], rot: [sx * 0.10, 0, 0] }));
    }
  }

  /* ================= 前面：枠＋ダストスクリーン＋ファン ================= */
  const front = grp('front');
  g.add(front);
  const op = 0.200;                                      // 開口の半辺
  const frameT = 0.014;
  // 下の帯
  front.add(mesh(box(CW, (yc - op) - yBot, frameT), casePaint, { pos: [0, (yBot + yc - op) / 2, fz - 0.006] }));
  // 上の帯
  front.add(mesh(box(CW, yTop - (yc + op), frameT), casePaint, { pos: [0, (yc + op + yTop) / 2, fz - 0.006] }));
  // 左右の帯
  for (const sx of [-1, 1]) front.add(mesh(box(CW / 2 - op, (yc + op) - (yc - op), frameT), casePaint, { pos: [sx * (op + (CW / 2 - op) / 2), yc, fz - 0.006] }));
  // 奥の暗部（内部：暗い底＋コルゲート状の影板）
  front.add(mesh(box(op * 2 + 0.03, op * 2 + 0.03, 0.006), deepShadow, { pos: [0, yc, fz - 0.062] }));
  for (let k = 0; k < 5; k++) {
    front.add(mesh(box(op * 2 - 0.01, 0.010, 0.010), dark, { pos: [0, yc - 0.16 + k * 0.08, fz - 0.052] }));
  }
  // ダストスクリーン（細かい網：四隅を埋める）
  grill(front, { w: op * 2 - 0.006, h: op * 2 - 0.006, nx: 11, ny: 11, bar: 0.0035, mat: grilleMat, pos: [0, yc, fz - 0.010] });
  // ファン（ハブ＋4 枚の羽根＋モーター）
  const fan = grp('fan');
  fan.position.set(0, yc, fz - 0.022);
  front.add(fan);
  fan.add(mesh(cyl(0.032, 0.028, 0.026, 14), MAT.metal('#6f7478', { repeat: 5 }), { rot: [Math.PI / 2, 0, 0] }));
  fan.add(mesh(cyl(0.016, 0.016, 0.034, 10), dark, { pos: [0, 0, -0.014], rot: [Math.PI / 2, 0, 0] }));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.36;
    const blade = mesh(rbox(0.062, 0.148, 0.007, 0.006, 2), MAT.plastic('#d9d5c9', { sat: 0.86, tint: '#efeadd', steps: 2 }), { cast: true });
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), a);
    blade.quaternion.copy(q).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.42));
    blade.position.set(-Math.sin(a) * 0.078, Math.cos(a) * 0.078, 0);
    fan.add(blade);
  }
  fan.add(mesh(cyl(0.014, 0.014, 0.010, 12), MAT.metal('#8d9296', { repeat: 6 }), { pos: [0, 0, 0.016], rot: [Math.PI / 2, 0, 0] }));
  // モーター背面＋支架アーム 3 本
  fan.add(mesh(cyl(0.046, 0.046, 0.052, 16), dark, { pos: [0, 0, -0.034], rot: [Math.PI / 2, 0, 0] }));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    const arm = mesh(box(0.012, 0.16, 0.010), galv, { pos: [-Math.sin(a) * 0.078, Math.cos(a) * 0.078, -0.026] });
    arm.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -a));
    fan.add(arm);
  }
  // ファンガード（同心リング＋放射スポーク＋中央キャップ）
  const guard = grp('fan-guard');
  guard.position.set(0, yc, fz + 0.006);
  front.add(guard);
  for (const r of [0.058, 0.100, 0.142, 0.184]) {
    guard.add(hoop(r, 0.0034, grilleMat, { cast: false }));
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const sp = mesh(box(0.0055, 0.372, 0.0055), grilleMat, { cast: false });
    sp.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), a));
    guard.add(sp);
  }
  guard.add(mesh(cyl(0.020, 0.020, 0.008, 14), grilleMat, { rot: [Math.PI / 2, 0, 0] }));
  guard.add(mesh(sph(0.0125, 10, 7), grilleMat, { pos: [0, 0, 0.005] }));
  // ガード押え-ring（開口の縁）とネジ 2 本
  guard.add(mesh(cyl(0.194, 0.194, 0.014, 32, true), grilleMat, { rot: [Math.PI / 2, 0, 0] }));
  for (const a of [0.7, 3.9]) {
    guard.add(mesh(cyl(0.0062, 0.0062, 0.008, 6), MAT.stainless({ repeat: 8 }), { pos: [Math.cos(a) * 0.186, Math.sin(a) * 0.186, 0.009] }));
  }

  /* ================= 背面：フィン列（コイル風）＋保護グリル ================= */
  const rear = grp('rear-coil');
  g.add(rear);
  const finX = CW / 2 - 0.036, finY0 = yBot + 0.040, finY1 = yTop - 0.052;
  const finGeoKey = finY1 - finY0;
  const nFin = 26;
  row(rear, nFin, (finX * 2) / (nFin - 1), (i, x) => {
    const f = mesh(box(0.0055, finGeoKey, 0.030), MAT.metal('#b9bdbf', { spec: 0.55, sheen: 0.14, repeat: 6 }), { pos: [x, (finY0 + finY1) / 2, -fz - 0.020] });
    return f;
  });
  // コールドバー（銅管の U 字_return bend_：コイル状に往復、左右交互）
  for (let t = 0; t < 3; t++) {
    const y = finY0 + 0.062 + t * 0.126;
    const side = t % 2 ? -1 : 1;
    rear.add(mesh(coil(0.024, 0.014, 0.5, 12, 0.0052), finCu, { pos: [side * (finX + 0.010), y, -fz - 0.020], rot: [0, 0, Math.PI / 2], cast: false }));
    rear.add(mesh(coil(0.017, 0.014, 0.5, 12, 0.0052), finCu, { pos: [-side * (finX + 0.006), y - 0.063, -fz - 0.020], rot: [0, 0, -Math.PI / 2], cast: false }));
    rear.add(mesh(cyl(0.0052, 0.0052, finX * 2 - 0.01, 6), finCu, { pos: [0, y - 0.031, -fz - 0.020], rot: [0, 0, Math.PI / 2], cast: false }));
  }
  // 背面の上下ヘッダー管（X 方向へ通る）
  for (const y of [finY0 - 0.006, finY1 + 0.006]) {
    rear.add(mesh(cyl(0.0085, 0.0085, finX * 2 + 0.01, 8), finCu, { pos: [0, y, -fz - 0.028], rot: [0, 0, Math.PI / 2] }));
  }
  // 背面ファングリル（フィンを保護する縦横バー）
  grill(rear, { w: CW - 0.056, h: (finY1 - finY0) + 0.014, nx: 9, ny: 6, bar: 0.0055, mat: galv, pos: [0, (finY0 + finY1) / 2, -fz - 0.040] });
  rear.add(mesh(box(CW - 0.040, 0.010, 0.010), galv, { pos: [0, finY0 - 0.016, -fz - 0.040] }));
  rear.add(mesh(box(CW - 0.040, 0.010, 0.010), galv, { pos: [0, finY1 + 0.016, -fz - 0.040] }));

  /* ================= 側面の点検口「エアコン」表示 ================= */
  const panel = grp('service-panel');
  g.add(panel);
  const px = CW / 2 + 0.004;
  panel.add(mesh(rbox(0.010, 0.150, 0.120, 0.004, 2), casePaint, { pos: [px, yTop - 0.115, 0.030] }));
  for (const [sy, sz] of [[0.062, 0.046], [-0.062, 0.046], [0, -0.046]]) {
    panel.add(mesh(cyl(0.0055, 0.0055, 0.008, 6), MAT.stainless({ repeat: 8 }), { pos: [px + 0.008, yTop - 0.115 + sy, 0.030 + sz], rot: [0, Math.PI / 2, 0] }));
  }
  panel.add(mesh(rbox(0.006, 0.030, 0.072, 0.002, 2), MAT.paint(PAL.marking, { steps: 2, sat: 0.86, tint: '#f6efdd' }), { pos: [px + 0.006, yBot + 0.100, 0.020] }));
  decal(panel, { map: TEX.signboard({ text: 'エアコン', sub: '室外機 点検口', bg: '#f4efe2', fg: '#4a5259' }), w: 0.068, h: 0.017, pos: [px + 0.010, yBot + 0.100, 0.020], rot: [0, Math.PI / 2, 0] });
  // 待機 LED（夜間点灯・呼吸）
  const ledGrp = grp('standby-led');
  ledGrp.position.set(px + 0.008, yBot + 0.148, -0.028);
  panel.add(ledGrp);
  ledGrp.add(mesh(cyl(0.0042, 0.0042, 0.004, 8), MAT.plastic('#2b2f33'), { rot: [0, Math.PI / 2, 0] }));
  ledGrp.add(mesh(sph(0.0030, 8, 6), MAT.ledOn('#7fe08a'), { pos: [0.0032, 0, 0], cast: false }));
  ledGrp.userData.breathe = { speed: 0.55, amount: 0.22, phase: seed % 6 };
  // 型番铭板（色褪せ）
  decal(panel, { map: TEX.adStrip({ text: '2.2kW 春風仕様', bg: '#dcd8cc', seed: seed + 7 }), w: 0.084, h: 0.021, pos: [px + 0.009, yTop - 0.030, -0.062], rot: [0, Math.PI / 2, 0], opacity: 0.8 });

  /* ================= 配管（保温・タイラップ・ほどけ） ================= */
  const pipes = grp('pipes');
  g.add(pipes);
  const route = [
    [0.190, yBot + 0.062, -fz + 0.010],
    [0.252, yBot + 0.058, -fz - 0.018],
    [0.286, yBot + 0.104, -fz - 0.034],
    [0.296, yBot + 0.220, -fz - 0.040],
    [0.292, yBot + 0.346, -fz - 0.040],
    [0.288, yBot + 0.452, -fz - 0.038],
  ];
  pipes.add(mesh(tubeOf(route, 0.0165, 26, 9), foamWhite));                     // 太管（吸側・保温）
  const route2 = route.map((p, i) => [p[0] - 0.034 + i * 0.002, p[1] - 0.010, p[2] + 0.006]);
  pipes.add(mesh(tubeOf(route2, 0.0115, 24, 8), foamWhite));                    // 細管（液側）
  // 電線（黒・2 芯）
  const route3 = route.map((p, i) => [p[0] + 0.020, p[1] - 0.020 - i * 0.004, p[2] - 0.004]);
  pipes.add(mesh(tubeOf(route3, 0.0058, 22, 6), MAT.rubber('#26292c')));
  // 保温巻がほどけた箇所（黒い下地と銅管が覗く）
  const fray = 2;
  pipes.add(mesh(tubeOf([
    route[fray], [ (route[fray][0] + route[fray + 1][0]) / 2 + 0.008, (route[fray][1] + route[fray + 1][1]) / 2, (route[fray][2] + route[fray + 1][2]) / 2 - 0.006 ], route[fray + 1],
  ], 0.0122, 10, 8), foamTorn));
  pipes.add(mesh(tubeOf([
    [route[fray][0] + 0.004, route[fray][1] - 0.004, route[fray][2] + 0.010],
    [route[fray + 1][0] + 0.004, route[fray + 1][1] - 0.004, route[fray + 1][2] + 0.010],
  ], 0.0062, 6, 6), finCu));
  // 剥げたアルミテープの端
  pipes.add(mesh(box(0.024, 0.004, 0.030), MAT.metal('#d8dcd8', { repeat: 8 }), { pos: [route[fray][0] + 0.006, route[fray][1] + 0.014, route[fray][2] + 0.004], rot: [0.2, 0.3, 0.5], cast: false }));
  // タイラップ（3 箇所）
  for (const idx of [1, 3, 4]) {
    const p = route[idx];
    const tie = grp('cable-tie');
    tie.position.set(p[0] - 0.006, p[1], p[2] - 0.002);
    tie.rotation.set(0.12, 0.2, 0.4);
    pipes.add(tie);
    tie.add(mesh(tor(0.030, 0.0026, 5, 14), MAT.rubber('#e8e6df', { steps: 2 }), { rot: [Math.PI / 2, 0, 0], cast: false }));
    tie.add(mesh(box(0.010, 0.006, 0.008), MAT.rubber('#e8e6df', { steps: 2 }), { pos: [0.028, 0, 0] }));
  }
  // フレアナット（2 ヶ所）とサービスポートキャップ
  for (const [i, r] of [[0, 0.0115], [0, 0.0165]]) {
    const p = route[i];
    pipes.add(mesh(cyl(r + 0.006, r + 0.006, 0.014, 6), MAT.metal('#b9a06a', { worn: 0.7, repeat: 5 }), { pos: [p[0] + 0.012, p[1] + 0.006, p[2] - 0.004], rot: [0, 0, Math.PI / 2] }));
  }
  pipes.add(mesh(cyl(0.0092, 0.0092, 0.010, 10), MAT.metal('#a8adb0', { repeat: 6 }), { pos: [route[0][0] + 0.030, route[0][1] + 0.020, route[0][2] - 0.006], rot: [0, 0, Math.PI / 2] }));

  /* ================= 据付金物・壁ブラケット・貫通スリーブ ================= */
  const mount = grp('mount');
  g.add(mount);
  const zWall = -fz - 0.046;                               // 壁寄り（ブラケット立板の面）
  for (const sx of [-1, 1]) {
    const bx = sx * (CW / 2 - 0.104);
    // 受け棚（ケース底板受）
    mount.add(mesh(rbox(0.054, 0.010, 0.146, 0.003, 2), galv, { pos: [bx, 0.0385, -fz - 0.026] }));
    // 壁立板
    mount.add(mesh(rbox(0.054, 0.152, 0.010, 0.003, 2), galv, { pos: [bx, 0.110, zWall] }));
    // 筋交い（斜め支持）
    mount.add(mesh(tubeOf([[bx, 0.048, -fz - 0.092], [bx, 0.150, zWall + 0.008]], 0.0056, 8, 6), galv));
    // 壁アンカーボルト（ワッシャ＋ナット）
    mount.add(mesh(cyl(0.0075, 0.0075, 0.064, 8), MAT.stainless({ repeat: 6 }), { pos: [bx, 0.168, zWall - 0.024], rot: [Math.PI / 2, 0, 0] }));
    mount.add(mesh(cyl(0.0132, 0.0132, 0.004, 10), galv, { pos: [bx, 0.168, zWall - 0.052] }));
    mount.add(mesh(cyl(0.0092, 0.0092, 0.010, 6), MAT.stainless({ repeat: 8 }), { pos: [bx, 0.168, zWall - 0.058] }));
    // 上部転倒防止金物
    mount.add(mesh(rbox(0.048, 0.010, 0.064, 0.003, 2), galv, { pos: [bx, yTop - 0.006, -fz - 0.016] }));
    mount.add(mesh(box(0.048, 0.058, 0.008), galv, { pos: [bx, yTop + 0.028, zWall + 0.006] }));
    weather(mount, { w: 0.08, h: 0.11, pos: [bx, 0.075, zWall + 0.012], kind: 'rust', color: PAL.rust, opacity: 0.66, seed: seed + 14 + sx, density: 1.8, spread: 0.005 });
    weather(mount, { w: 0.10, h: 0.05, pos: [bx, 0.044, -fz + 0.020], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 15 + sx, spread: 0.004 });
  }
  if (wallMount) {
    // 配管貫通スリーブ（壁を抜ける塩ビ管＋パテ）：上部右側、壁面へ
    const sl = grp('sleeve');
    sl.position.set(0.288, yBot + 0.450, zWall + 0.012);
    sl.rotation.x = -Math.PI / 2;                                 // ローカル +Y → -Z（壁側）
    mount.add(sl);
    sl.add(mesh(cyl(0.0245, 0.0245, 0.062, 14, true), MAT.plastic('#dcd7c9', { steps: 2, side: DoubleSide })));
    sl.add(mesh(tor(0.0255, 0.0048, 6, 14), MAT.plastic('#c9c3b2', { steps: 2 }), { pos: [0, 0.028, 0] }));
    sl.add(mesh(cyl(0.0325, 0.0295, 0.013, 14), MAT.paint('#b7b0a2', { steps: 3 }), { pos: [0, 0.036, 0] }));   // パテ Rounds
    weather(sl, { w: 0.05, h: 0.05, pos: [0.012, 0.030, 0.010], kind: 'dirt', color: '#7d7566', opacity: 0.5, seed: seed + 17, spread: 0.004 });
  } else {
    // 直置き：コンクリート基礎ブロック
    for (const sx of [-1, 1]) {
      mount.add(mesh(rbox(0.15, 0.062, 0.22, 0.008, 2), MAT.concrete({ repeat: 3 }), { pos: [sx * (CW / 2 - 0.104), 0.031, -0.012] }));
      weather(mount, { w: 0.10, h: 0.030, pos: [sx * (CW / 2 - 0.104), 0.046, 0.100], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 18 + sx, spread: 0.003 });
    }
  }

  /* ================= 上面の埃・落ち葉・小枝 ================= */
  const dirt = grp('top-litter');
  g.add(dirt);
  dirt.add(mesh(rbox(CW - 0.07, 0.006, CD - 0.08, 0.003, 2), MAT.paint('#a9a294', { steps: 3, map: TEX.paper({ base: '#b3ac9e' }).map }), { pos: [0.01, yTop + 0.0145, -6e-3], rot: [0, 0.02, 0] }));   // 上面の埃の層
  for (let i = 0; i < 9; i++) {
    const s = range(rnd, 0.020, 0.042);
    const leafG = lathe([[0, 0], [s * 0.42, s * 0.10], [s * 0.8, s * 0.05], [s, 0], [s * 0.7, -s * 0.06]], 7);
    dirt.add(noOut(mesh(leafG, MAT.leaf({ color: i % 3 === 0 ? '#9c8a5c' : '#8b6a45', tint: '#e8dcc4' }), {
      pos: [range(rnd, -CW / 2 + 0.06, CW / 2 - 0.06), yTop + 0.017 + rnd() * 0.004, range(rnd, -CD / 2 + 0.05, CD / 2 - 0.05)],
      rot: [range(rnd, -0.3, 0.3), range(rnd, 0, 6.28), range(rnd, -0.3, 0.3)],
      cast: false,
    })));
  }
  dirt.add(noOut(mesh(tubeOf([[-0.2, yTop + 0.018, 0.04], [-0.13, yTop + 0.024, 0.06], [-0.05, yTop + 0.020, 0.03]], 0.0035, 8, 5), MAT.bark({ base: PAL.trunk, repeat: 2 }))));   // 小枝
  // 松葉状のゴミ
  for (let i = 0; i < 4; i++) {
    dirt.add(noOut(mesh(cyl(0.0012, 0.0006, 0.045, 5), MAT.paint('#8a7a55', { steps: 2 }), {
      pos: [range(rnd, -0.24, 0.24), yTop + 0.018, range(rnd, -0.09, 0.09)], rot: [Math.PI / 2 + range(rnd, -0.2, 0.2), range(rnd, 0, 3), 0], cast: false,
    })));
  }

  /* ================= 経年：錆・黄変・水跡・欠け ================= */
  // 下面縁の錆（3 箇所）
  for (const x of [-0.22, 0.02, 0.24]) {
    weather(caseG, { w: 0.13, h: 0.09, pos: [x, yBot + 0.055, fz - 0.0015], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 22 + Math.round(x * 10), density: 1.5, spread: 0.005 });
  }
  weather(caseG, { w: 0.20, h: 0.14, pos: [0, yc - 0.10, -0.1375], rot: [0, Math.PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.55, seed: seed + 26, density: 1.6, spread: 0.006 });   // 背面錆
  weather(caseG, { w: 0.10, h: 0.18, pos: [-0.3425, 0.16, 0.03], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: '#7d5a3a', opacity: 0.45, seed: seed + 27, spread: 0.005 });
  // ドレンの水跡（緑錆・苔の流筋）
  for (let i = 0; i < 4; i++) {
    weather(caseG, { w: 0.026, h: 0.20, pos: [-0.1 + i * 0.07, yBot + 0.13, fz - 0.0010], kind: 'rust', color: '#7f9578', opacity: 0.4, seed: seed + 31 + i, density: 0.7, spread: 0.004 });
  }
  // 塗装の黄変・退色（上半分）
  decal(caseG, { map: TEX.gradient({ stops: [[0, 'rgba(255,236,190,1)'], [0.65, 'rgba(255,240,210,0.35)'], [1, 'rgba(255,255,255,0)']] }), w: CW - 0.03, h: 0.30, pos: [0, yTop - 0.16, fz - 0.0012], opacity: 0.34 });
  // 掉漆・小キズ・へこみ
  weather(caseG, { w: 0.14, h: 0.06, pos: [0.14, yTop - 0.06, fz - 0.0014], kind: 'chip', color: '#9c968a', opacity: 0.5, seed: seed + 36, density: 1.6, spread: 0.005 });
  weather(front, { w: 0.12, h: 0.05, pos: [-0.16, yBot + 0.10, fz + 0.0015], kind: 'scratch', color: '#efe9dc', opacity: 0.35, seed: seed + 37, density: 1.3, spread: 0.004 });
  caseG.add(noOut(mesh(sph(0.034, 10, 7), casePaint, { pos: [-0.2, yTop - 0.14, fz - 0.004], scale: [1, 0.8, 0.24] })));   // へこみ（当たり跡）
  // 貼紙残り（設置年プレートの剥がれ）
  decal(caseG, { map: TEX.wear({ kind: 'chip', color: '#efe7d3', seed: seed + 38, density: 0.9 }), w: 0.075, h: 0.055, pos: [-0.26, yTop - 0.055, fz - 0.0016], opacity: 0.7, rot: [0, 0, 7 * D2R] });
  weather(top, { w: 0.24, h: 0.10, pos: [-0.06, yTop + 0.0145, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8b8171', opacity: 0.5, seed: seed + 39, density: 1.6, spread: 0.006 });   // 上面の埃

  shadowBlob(g, { r: 0.36, pos: [0, 0.0025, 0.01], opacity: 0.30, ratio: 0.52 });

  if (size !== 1) g.scale.setScalar(size);
  return finish(g, { outline: 'normal' });
}

const noOut = (o) => { o.userData.noOutline = true; return o; };

export { build, meta };
