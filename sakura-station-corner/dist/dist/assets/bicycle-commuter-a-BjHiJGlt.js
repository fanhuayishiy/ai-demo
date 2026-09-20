import { P as PAL, g as grp, s as shade, M as MAT, D as DoubleSide, m as mesh, r as rbox, c as cyl, b as box, t as tor, a as sph, w as weather, d as coil, e as radial, V as Vector3, C as CatmullRomCurve3, f as along, B as BufferGeometry, F as Float32BufferAttribute, h as decal, T as TEX, i as grill, j as d2r, k as tubeOf, l as catenary, n as range, o as lathe, p as shadowBlob, q as finish, u as Matrix4, v as Mesh, x as PlaneGeometry, y as TorusGeometry, z as rand } from './index-CNQWoZB0.js';

//  assets/bike/bicycle-commuter-a.js
//  通勤自転車 A —— 26インチ「ママチャリ」型の定番通勤車。
//   ダイヤ（前カゴ：金网の錆・藤風カバー・買い物袋の残り）、ダイナモ式前灯、
//   チェーンケース（「パンク注意」ステッカー）、サイドスタンド、サドルバッグ、U字ロック。
//  単位：メートル。原点 = 両輪接地面中心。+Y 上。**车头は +Z**。
//  lean（度）> 0 = 左（スタンド側）へ倒す。接地線（Z軸）まわりで回すので車輪は沈まない。

const meta = {
  id: 'bicycle-commuter-a',
  real: [1.80, 1.04, 0.60],
  origin: 'ground-center',      // 原点=接地面中心 / +Y 上 / 车头 +Z
};

/* ================================ 寸法 ================================ */
const RW = 0.325;                            // 車輪外半径（=軸高）→ 輪径 0.65m
const ZR = -0.55, ZF = 0.55;                 // 後輪 / 前輪 軸（軸距 1.10）
const BB = [0, 0.262, -0.012];               // ボトムブラケット
const SC = [0, 0.768, -0.19];               // シートクラスター
const HTT = [0, 0.742, 0.262];               // ヘッドチューブ上端
const HTB = [0, 0.548, 0.318];               // ヘッドチューブ下端
const UP = new Vector3(0, 1, 0);
const AX = new Vector3(1, 0, 0);
const FZ = new Vector3(0, 0, 1);

/* ================================ 小道具 ================================ */
/** 直線パイプ */
function seg(a, b, r, mat, name = 'tube', s = 10) {
  const A = new Vector3(a[0], a[1], a[2]);
  const B = new Vector3(b[0], b[1], b[2]);
  const d = B.clone().sub(A);
  const mm = mesh(cyl(r, r * 0.96, d.length(), s), mat, { name });
  mm.position.copy(A).add(B).multiplyScalar(0.5);
  mm.quaternion.setFromUnitVectors(UP, d.normalize());
  return mm;
}
/** 曲線パイプ */
function bend(pts, r, mat, name = 'bend', ts = 20) {
  return mesh(tubeOf(pts, r, ts, 8), mat, { name });
}
/** 溶接ビード等のリング：軸を dir に合わせる */
function ring(pos, dir, r, t, mat, name = 'weld') {
  const mm = mesh(tor(r, t, 6, 16), mat, { name });
  mm.position.set(pos[0], pos[1], pos[2]);
  mm.quaternion.setFromUnitVectors(FZ, new Vector3(dir[0], dir[1], dir[2]).normalize());
  return mm;
}
/** 六角ボルト */
function bolt(pos, r, mat, axis = 'y', name = 'bolt') {
  const mm = mesh(cyl(r, r, r * 0.85, 6), mat, { name });
  mm.position.set(pos[0], pos[1], pos[2]);
  if (axis === 'x') mm.rotation.set(0, 0, Math.PI / 2);
  else if (axis === 'z') mm.rotation.set(Math.PI / 2, 0, 0);
  return mm;
}
/** radial() を「ある軸のまわり」で使えるようにする平面グループ */
function polar(axis) {
  const p = grp('polar');
  if (axis === 'x') p.quaternion.setFromUnitVectors(UP, AX);
  else if (axis === 'z') p.quaternion.setFromUnitVectors(UP, FZ);
  return p;
}
/** フェンダー（円筒帯）。phi は +Z(前)=0 / 上=π/2 / 後=π */
function fender({ r, w, center, span, mat }) {
  const arc = grp('fender');
  arc.add(mesh(lathe([[r, -w / 2], [r, -w * 0.2], [r, w * 0.2], [r, w / 2]], 30, center - span / 2, span),
    mat, { name: 'fender-band', rot: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) {                                  // 端の折り返しリップ
    const a = center + (s * span) / 2;
    const lip = grp('lip');
    lip.rotation.x = -a;
    lip.add(mesh(rbox(w, 0.005, 0.018, 0.002, 2), mat, { name: 'fender-lip', pos: [0, 0, r] }));
    arc.add(lip);
  }
  return arc;
}
/** 円筒表面に添う做旧デカル（法線 side / 高さ方向 axis） */
function tubeDecal(parent, { at, axis, side, w = 0.05, h = 0.10, kind = 'chip', color = PAL.rust, opacity = 0.5, seed = 1, offset = 0.0016 }) {
  const n = new Vector3(side[0], side[1], side[2]).normalize();
  const a = new Vector3(axis[0], axis[1], axis[2]).normalize();
  const b = new Vector3().crossVectors(n, a).normalize();
  const m4 = new Matrix4().makeBasis(b, a, n);
  const mm = new Mesh(new PlaneGeometry(w, h),
    MAT.decal({ map: TEX.wear({ kind, color, seed, density: 1.25 }), opacity, side: DoubleSide, order: 1 }));
  mm.position.set(at[0], at[1], at[2]).addScaledVector(n, offset);
  mm.quaternion.setFromRotationMatrix(m4);
  mm.castShadow = mm.receiveShadow = false;
  parent.add(mm);
  return mm;
}
/** タイヤ（空気圧不足 = 接地だけ沈め、リムは軸に据える） */
function tireMesh(R, t, squash, mat, name = 'tire') {
  const mm = mesh(new TorusGeometry(R, t, 12, 44), mat, { name });
  if (squash < 1) {
    mm.scale.y = squash;
    mm.position.y = -(R + t) * (1 - squash);
  }
  return mm;
}

/* ================================ 車輪 ================================
 * ローカル +Z = 車軸、円盤面 = ローカル XY。w.rotation.y = 90° で +Z → 世界 +X。 */
function wheel(o) {
  const { R, tireT, rimR, rimW, spokes, M, phase = 0, squash = 1, drum = false } = o;
  const w = grp('wheel');
  w.rotation.y = Math.PI / 2;
  const Ro = R + tireT;

  // タイヤ + 側壁帯
  w.add(tireMesh(R, tireT, squash, M.tire, 'tire'));
  for (const s of [-1, 1]) {
    w.add(mesh(tor(R - tireT * 0.35, 0.0026, 4, 40), M.tireSide, { name: 'sidewall-band', pos: [0, 0, s * tireT * 0.72] }));
  }
  // 接地の側壁ふくれ（空気圧む足）
  if (squash < 0.995) {
    for (const s of [-1, 1]) {
      w.add(mesh(sph(0.031, 10, 8), M.tire, { name: 'sidewall-bulge', pos: [0, -Ro * 0.96, s * rimW * 0.30], scale: [1.0, 0.40, 0.62] }));
    }
    weather(w, { w: 0.15, h: 0.045, pos: [0, -Ro * 0.865, 0], rot: [0, 0, 0], kind: 'dirt', color: '#6a5c48', opacity: 0.5, seed: 41, spread: 0.012 });
  }

  // リム（バレル + 両フランジ + ベース帯）
  w.add(mesh(cyl(rimR, rimR, rimW, 30, true), M.rim, { name: 'rim-barrel', rot: [Math.PI / 2, 0, 0] }));
  w.add(mesh(cyl(rimR - 0.007, rimR - 0.007, rimW * 0.86, 30, true), M.rimDark, { name: 'rim-bed', rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) {
    w.add(mesh(tor(rimR + 0.0018, 0.0058, 5, 30), M.rim, { name: 'rim-flange', pos: [0, 0, s * rimW * 0.5] }));
  }

  // ハブ
  const hub = grp('hub');
  hub.add(mesh(cyl(0.0215, 0.0215, 0.062, 14), M.hub, { name: 'hub-body', rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0268, 0.0205, 0.020, 14), M.hub, { name: 'hub-flange-L', pos: [0, 0, -0.024], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0205, 0.0268, 0.020, 14), M.hub, { name: 'hub-flange-R', pos: [0, 0, 0.024], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0075, 0.0075, 0.132, 8), M.chrome, { name: 'axle', rot: [Math.PI / 2, 0, 0] }));
  hub.add(bolt([0, 0, -0.068], 0.0128, M.chrome, 'z', 'axle-nut-L'));
  hub.add(bolt([0, 0, 0.070], 0.0128, M.chrome, 'z', 'axle-nut-R'));
  if (drum) {                                                 // ローラーブレーキ ドラム（左）
    hub.add(mesh(cyl(0.048, 0.048, 0.030, 20), M.darkMetal, { name: 'brake-drum', pos: [0, 0, -0.054], rot: [Math.PI / 2, 0, 0] }));
    hub.add(ring([0, 0, -0.07], [0, 0, 1], 0.044, 0.004, M.chrome, 'drum-ring'));
  }
  w.add(hub);

  // スポーク（2X 組・radial() で極配）
  const planeG = polar('z');
  const rIn = 0.024, rOut = rimR - 0.0085, len = rOut - rIn;
  const sGeo = cyl(0.00215, 0.00185, len, 5);
  radial(planeG, spokes, 0, (i, a) => {
    const flip = i % 2 === 0 ? 1 : -1;
    const g = grp('spoke-arm');
    g.rotation.y = a + phase;
    const s = mesh(sGeo, M.spoke, { name: 'spoke', pos: [rIn + len / 2, flip * 0.0045, 0], rot: [0, 0, Math.PI / 2] });
    const nip = mesh(cyl(0.0031, 0.0031, 0.011, 6), M.spoke, { name: 'nipple', pos: [rOut - 0.003, flip * 0.0045, 0], rot: [0, 0, Math.PI / 2] });
    s.userData.noOutline = nip.userData.noOutline = true;      // 細物は描边省略（糊れないため）
    g.add(s, nip);
    return g;
  });
  w.add(planeG);

  // バルブ + キャップ
  const va = 0.66 + phase;
  const vg = grp('valve'); vg.rotation.z = va;
  vg.add(mesh(cyl(0.0034, 0.0034, 0.030, 6), M.darkMetal, { name: 'valve-body', pos: [rimR - 0.010, 0, 0], rot: [0, 0, Math.PI / 2] }));
  vg.add(mesh(cyl(0.0058, 0.0058, 0.013, 8), M.rubberCap, { name: 'valve-cap', pos: [rimR + 0.014, 0, 0], rot: [0, 0, Math.PI / 2] }));
  w.add(vg);

  // スポーク反射板（樹脂クリップ留め）
  const rg = grp('reflector-arm'); rg.rotation.z = -1.15 + phase;
  const rmid = (rIn + rOut) * 0.62;
  rg.add(mesh(rbox(0.013, 0.054, 0.006, 0.003, 2), M.reflector, { name: 'spoke-reflector', pos: [rmid, 0, 0.006] }));
  rg.add(mesh(box(0.012, 0.010, 0.014), M.darkMetal, { name: 'reflector-clip', pos: [rmid, 0, -2e-3] }));
  w.add(rg);

  return w;
}

/* ================================ build ================================ */
function build(options = {}) {
  const seed = options.seed ?? 7;
  const frame = options.frame ?? PAL.bikeFrameA;
  const basket = options.basket !== false;
  const lean = options.lean ?? 0;

  const rnd = rand(seed);
  const g = grp('bicycle-commuter-a');
  const tilt = grp('lean', { rot: [0, 0, d2r(lean)] });
  const bike = grp('bike');
  tilt.add(bike);
  g.add(tilt);

  const dark = shade(frame, 0.56);
  /* ---- 材質（塗装フレーム / クローム / ゴム / 樹脂 / 布 / 錆鉄 を識別可能に） ---- */
  const M = {
    tire: MAT.rubber('#33363c', { steps: 3, shadowAmt: 0.96 }),
    tireSide: MAT.rubber(shade('#3d4046', 1.2), { spec: 0.12 }),
    rubberCap: MAT.rubber('#22252a'),
    rim: MAT.metal('#c8ccd0', { worn: 0.45, repeat: 3, side: DoubleSide }),
    rimDark: MAT.metal('#8d9298', { worn: 0.55, side: DoubleSide }),
    hub: MAT.metal('#b3b8bd', { worn: 0.55, repeat: 2 }),
    spoke: MAT.chrome({ spec: 0.68 }),
    chrome: MAT.chrome(),
    steel: MAT.metal('#9ea3a8', { worn: 0.66, repeat: 2 }),
    darkMetal: MAT.darkIron({ worn: 0.6 }),
    rusty: MAT.metalPaint(PAL.rust, { worn: 0.95, repeat: 1.5, spec: 0.1, shadowAmt: 0.95 }),
    wire: MAT.darkIron('#4a4d52'),
    frame: MAT.metalPaint(frame, { worn: 0.5, repeat: 2.4 }),
    frameDark: MAT.metalPaint(dark, { worn: 0.62, repeat: 2 }),
    fender: MAT.hardPlastic(shade(frame, 0.44), { worn: 0.7, repeat: 3, side: DoubleSide }),
    guard: MAT.hardPlastic('#eee9de', { worn: 0.6 }),
    guardSide: MAT.hardPlastic('#eee9de', { worn: 0.6, side: DoubleSide }),
    saddle: MAT.paint('#4a3831', { spec: 0.3, specPower: 58, sheen: 0.05, shadowAmt: 0.9 }),
    saddleTop: MAT.paint('#57423a', { spec: 0.34, specPower: 66, sheen: 0.06, shadowAmt: 0.86 }),
    grip: MAT.rubber('#2d3037', { steps: 3 }),
    resin: MAT.plastic('#3f4640', { steps: 4 }),
    rattan: MAT.plastic('#9c7a4c', { spec: 0.16, shadowAmt: 0.92 }),
    bag: MAT.fabric({ color: '#4c5560', repeat: 26 }),
    bagDark: MAT.fabric({ color: '#39414b', repeat: 22 }),
    bagPocket: MAT.fabric({ color: '#8c7f66', repeat: 20 }),
    plasticBag: MAT.plastic('#eae5d8', { spec: 0.4, transparent: true, opacity: 0.92 }),
    paper: MAT.paper({ color: '#f4efe2' }),
    red: MAT.hardPlastic('#c2413a', { worn: 0.4 }),
    amber: MAT.hardPlastic('#e2a53c', { worn: 0.4 }),
    reflector: MAT.hardPlastic('#d1402f', { worn: 0.35, side: DoubleSide }),
    reflectorAmber: MAT.ledOn('#f0b03e'),
    redGlow: MAT.ledOn('#e8453c'),
    bulb: MAT.bulb({ color: '#fff4d8' }),
    white: MAT.hardPlastic('#e9e6dd', { worn: 0.55 }),
  };

  /* =========================== 1. フレーム =========================== */
  const F = grp('frame');
  bike.add(F);
  const rSeat = 0.0195, rMain = 0.0175, rStay = 0.0115;
  F.add(seg(BB, SC, rSeat, M.frame, 'seat-tube'));
  F.add(seg(HTB, BB, rMain, M.frame, 'down-tube'));
  F.add(seg(SC, HTT, rMain, M.frame, 'top-tube'));
  F.add(seg(HTB, HTT, 0.0235, M.frame, 'head-tube'));
  F.add(seg(SC, [0, 0.700, -0.245], 0.0135, M.frame, 'seat-tube-extension'));
  // ダウンチューブの補強バンド（溶接）
  F.add(ring([0, 0.452, 0.196], [0, HTB[1] - BB[1], HTB[2] - BB[2]], 0.0188, 0.0034, M.frameDark, 'dt-band'));
  for (const s of [-1, 1]) {
    F.add(seg([s * 0.047, BB[1], BB[2] + 0.005], [s * 0.0585, RW, ZR], rStay, M.frame, 'chain-stay'));
    F.add(seg([s * 0.020, SC[1] - 0.055, SC[2] - 0.005], [s * 0.0585, RW + 0.014, ZR + 0.028], 0.0095, M.frame, 'seat-stay'));
    F.add(mesh(rbox(0.020, 0.040, 0.030, 0.006, 2), M.frameDark, { name: 'dropout', pos: [s * 0.0585, RW - 0.002, ZR] }));
    // 泥除けゴム（チェーンステー後端）
    F.add(mesh(rbox(0.012, 0.006, 0.10, 0.002, 2), M.rubberCap, { name: 'chainstay-mudflap', pos: [s * 0.048, 0.238, -0.3], rot: [d2r(4), 0, 0] }));
  }
  // 溶接ビード
  F.add(ring([0, SC[1] - 0.016, SC[2] + 0.018], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0205, 0.0028, M.frameDark, 'weld-seat'));
  F.add(ring([0, BB[1] + 0.030, BB[2] - 0.011], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0198, 0.0026, M.frameDark, 'weld-bb'));
  F.add(ring([0, HTT[1] - 0.028, HTT[2] - 0.003], [0, HTT[1] - HTB[1], HTT[2] - HTB[2]], 0.0245, 0.0028, M.frameDark, 'weld-head'));
  F.add(mesh(cyl(0.0285, 0.0285, 0.068, 14), M.frameDark, { name: 'bb-shell', pos: [BB[0], BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  // 使われないボトルケージ雌ねじ
  for (const [yy, zz] of [[0.428, -0.048], [0.372, 0.014]]) {
    F.add(bolt([0.0190, yy, zz], 0.0058, M.darkMetal, 'x', 'braze-on'));
  }
  // 経年（掉漆・錆・傷・泥）
  {
    const dtAx = [0, HTB[1] - BB[1], HTB[2] - BB[2]];
    tubeDecal(F, { at: [0.0175, 0.398, 0.144], axis: dtAx, side: [1, 0, 0], w: 0.030, h: 0.115, kind: 'chip', color: shade(frame, 0.30), opacity: 0.62, seed: seed + 3 });
    tubeDecal(F, { at: [0.0175, 0.330, 0.0665], axis: dtAx, side: [1, 0, 0], w: 0.026, h: 0.060, kind: 'scratch', color: '#efe9dd', opacity: 0.34, seed: seed + 19 });
    const stAx = [0, SC[1] - BB[1], SC[2] - BB[2]];
    tubeDecal(F, { at: [-0.0195, 0.655, -0.15], axis: stAx, side: [-1, 0, 0], w: 0.030, h: 0.130, kind: 'rust', color: PAL.rust, opacity: 0.48, seed: seed + 11 });
    tubeDecal(F, { at: [-0.0195, 0.560, -0.116], axis: stAx, side: [-1, 0, 0], w: 0.026, h: 0.055, kind: 'chip', color: '#cfc7b6', opacity: 0.45, seed: seed + 13 });
    const ttAx = [0, HTT[1] - SC[1], HTT[2] - SC[2]];
    tubeDecal(F, { at: [0, 0.7735, 0.06], axis: ttAx, side: [0, 1, 0], w: 0.028, h: 0.190, kind: 'scratch', color: '#f2efe6', opacity: 0.30, seed: seed + 17 });
    const csAx = [0, RW - BB[1], ZR - BB[2]];
    tubeDecal(F, { at: [0.0509, 0.2965, -0.19], axis: csAx, side: [0, 1, 0], w: 0.022, h: 0.160, kind: 'dirt', color: '#6d5f4b', opacity: 0.5, seed: seed + 27 });
  }

  /* ===================== 2. ヘッドセット・フォーク ===================== */
  const H = grp('headset');
  bike.add(H);
  const hAngle = Math.atan2(HTT[2] - HTB[2], HTT[1] - HTB[1]);
  H.add(mesh(cyl(0.0265, 0.0265, 0.010, 14), M.chrome, { name: 'upper-race', pos: [0, HTT[1] + 0.006, HTT[2] - 0.001], rot: [hAngle, 0, 0] }));
  H.add(mesh(cyl(0.0245, 0.0245, 0.012, 14), M.chrome, { name: 'lower-race', pos: [0, HTB[1] - 0.008, HTB[2] + 0.002], rot: [hAngle, 0, 0] }));
  const steerTop = [0, HTT[1] + 0.118, HTT[2] - 0.031];
  H.add(seg([0, HTB[1] - 0.030, HTB[2] + 0.005], steerTop, 0.0135, M.chrome, 'steerer'));
  const crown = [0, 0.512, 0.336];
  H.add(bend([[0, HTB[1] - 0.004, HTB[2] + 0.002], crown], 0.0225, M.frame, 'fork-crown', 6));
  for (const s of [-1, 1]) {
    H.add(bend([
      [s * 0.024, 0.512, 0.338],
      [s * 0.042, 0.452, 0.418],
      [s * 0.052, 0.386, 0.498],
      [s * 0.0585, RW + 0.004, ZF],
    ], 0.0135, M.frame, 'fork-blade', 22));
    H.add(mesh(rbox(0.019, 0.034, 0.028, 0.005, 2), M.frameDark, { name: 'fork-dropout', pos: [s * 0.0585, RW - 0.002, ZF] }));
    H.add(mesh(box(0.020, 0.015, 0.026), M.steel, { name: 'basket-eyelet', pos: [s * 0.050, 0.436, 0.452] }));
    H.add(bolt([s * 0.050, 0.436, 0.466], 0.0055, M.darkMetal, 'z', 'eyelet-bolt'));
    // ダイナミキステー
    H.add(mesh(box(0.012, 0.014, 0.046), M.steel, { name: 'dynamo-stay', pos: [s * 0.070, 0.452, 0.350] }));
  }
  tubeDecal(H, { at: [0.0555, 0.452, 0.418], axis: [0, -0.06, 0.082], side: [1, 0, 0], w: 0.026, h: 0.110, kind: 'rust', color: PAL.rust, opacity: 0.48, seed: seed + 5 });
  tubeDecal(H, { at: [-0.0605, 0.420, 0.462], axis: [0, -0.066, 0.080], side: [-1, 0, 0], w: 0.026, h: 0.075, kind: 'chip', color: '#c9c3b6', opacity: 0.5, seed: seed + 9 });

  /* ================ 3. ハンドル（グリップ・ベル・ミラー・バーエンド） ================ */
  const HB = grp('handlebar');
  bike.add(HB);
  HB.add(mesh(cyl(0.0215, 0.019, 0.062, 12), M.frameDark, { name: 'quill', pos: [0, HTT[1] + 0.072, HTT[2] - 0.016], rot: [hAngle * 0.6, 0, 0] }));
  HB.add(mesh(rbox(0.038, 0.028, 0.044, 0.006, 2), M.frameDark, { name: 'stem-head', pos: [0, 0.852, 0.238] }));
  HB.add(bolt([0, 0.876, 0.238], 0.0075, M.chrome, 'y', 'stem-bolt'));
  HB.add(mesh(cyl(0.0178, 0.0178, 0.040, 12), M.steel, { name: 'bar-clamp', pos: [0, 0.868, 0.232], rot: [0, 0, Math.PI / 2] }));
  const barPts = [
    [0, 0.870, 0.232], [0.085, 0.872, 0.216], [0.155, 0.880, 0.176],
    [0.205, 0.886, 0.126], [0.238, 0.888, 0.070],
  ];
  for (const s of [-1, 1]) {
    HB.add(bend(barPts.map((p) => [p[0] * s, p[1], p[2]]), 0.0125, M.chrome, 'handlebar', 20));
    // グリップ（日焼け・テカり・劣化）
    HB.add(mesh(cyl(0.0175, 0.0158, 0.108, 12), M.grip, { name: 'grip', pos: [s * 0.278, 0.8885, 0.030], rot: [d2r(-8), 0, d2r(86)] }));
    for (let k = 0; k < 5; k++) {
      HB.add(mesh(tor(0.0172, 0.0019, 4, 12), M.grip, { name: 'grip-ring', pos: [s * (0.248 + k * 0.017), 0.8885 - k * 0.0009, 0.030 + k * 0.017], rot: [0, 0, Math.PI / 2] }));
    }
    HB.add(bolt([s * 0.3345, 0.8883, 0.0100], 0.0152, M.darkMetal, 'x', 'bar-end'));
    // ブレーキレバー
    const lev = grp('lever', { pos: [s * 0.232, 0.884, 0.096], rot: [d2r(16), 0, d2r(90 - s * 12)] });
    lev.add(mesh(rbox(0.016, 0.013, 0.038, 0.004, 2), M.chrome, { name: 'lever-root' }));
    lev.add(seg([0.012, 0, 0], [0.012, 0, -0.098], 0.0055, M.chrome, 'lever-blade'));
    lev.add(bend([[0.012, 0, -0.098], [0.014, 0, -0.126], [0.020, 0.004, -0.14]], 0.0055, M.chrome, 'lever-tip', 6));
    HB.add(lev);
    HB.add(bolt([s * 0.240, 0.896, 0.062], 0.0055, M.darkMetal, 'y', 'reach-screw'));
  }
  // ベル
  const bell = grp('bell', { pos: [-0.18, 0.902, 0.150], rot: [0, d2r(-22), 0] });
  bell.add(mesh(sph(0.026, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.chrome, { name: 'bell-dome' }));
  bell.add(mesh(cyl(0.0265, 0.0245, 0.007, 14), M.steel, { name: 'bell-rim', pos: [0, -1e-3, 0] }));
  bell.add(mesh(cyl(0.0075, 0.0075, 0.014, 8), M.darkMetal, { name: 'bell-post', pos: [0, -9e-3, 0] }));
  bell.add(mesh(box(0.007, 0.004, 0.026), M.chrome, { name: 'bell-striker', pos: [0.014, 0.002, 0.012], rot: [0, d2r(20), 0] }));
  HB.add(bell);
  // ミラー（左・球部を多少振り向いた状態）
  const mir = grp('mirror', { pos: [-0.3, 0.898, 0.052], rot: [d2r(-14), d2r(24), d2r(28)] });
  mir.add(mesh(cyl(0.0075, 0.0075, 0.020, 8), M.darkMetal, { name: 'mirror-cup' }));
  mir.add(mesh(sph(0.0092, 10, 8), M.darkMetal, { name: 'mirror-ball', pos: [0, 0.020, 0] }));
  mir.add(seg([0, 0.024, 0], [0, 0.086, 0.010], 0.0042, M.darkMetal, 'mirror-stem'));
  mir.add(mesh(cyl(0.0325, 0.0325, 0.008, 18), M.darkMetal, { name: 'mirror-frame', pos: [0, 0.094, 0.013], rot: [d2r(18), 0, 0] }));
  mir.add(mesh(cyl(0.0295, 0.0295, 0.0025, 18), M.chrome, { name: 'mirror-glass', pos: [0, 0.094, 0.018], rot: [d2r(18), 0, 0] }));
  HB.add(mir);
  // 3段シフター
  const shf = grp('shifter', { pos: [0.226, 0.900, 0.128], rot: [0, d2r(8), d2r(90)] });
  shf.add(mesh(rbox(0.020, 0.026, 0.036, 0.005, 2), M.white, { name: 'shifter-body' }));
  shf.add(mesh(box(0.009, 0.004, 0.028), M.darkMetal, { name: 'shifter-lever', pos: [0.012, -9e-3, 0.004] }));
  HB.add(shf);
  weather(HB, { w: 0.08, h: 0.05, pos: [0.279, 0.902, 0.03], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#575c63', opacity: 0.5, seed: seed + 31, spread: 0.05 });

  /* ================ 4. サドル（日焼けひび割れ・下見の金具） ================ */
  const S = grp('saddle-assembly');
  bike.add(S);
  const postTop = [SC[0] - 0.002, 0.964, SC[2] - 0.062];
  S.add(seg([SC[0], SC[1] - 0.02, SC[2] + 0.005], postTop, 0.0135, M.chrome, 'seatpost'));
  S.add(mesh(rbox(0.042, 0.036, 0.048, 0.008, 2), M.frameDark, { name: 'seat-clamp', pos: [SC[0], SC[1] + 0.014, SC[2]] }));
  S.add(bolt([0.027, SC[1] + 0.014, SC[2] - 0.004], 0.0068, M.darkMetal, 'x', 'clamp-bolt'));
  const sad = grp('saddle', { pos: [0, 0.996, -0.246], rot: [d2r(-3.5), 0, 0] });
  sad.add(mesh(rbox(0.154, 0.034, 0.264, 0.030, 3), M.saddle, { name: 'saddle-shell' }));
  sad.add(mesh(rbox(0.120, 0.020, 0.198, 0.026, 3), M.saddleTop, { name: 'saddle-crown', pos: [0, 0.017, -8e-3] }));
  sad.add(mesh(rbox(0.054, 0.024, 0.072, 0.014, 2), M.saddle, { name: 'saddle-nose', pos: [0, -2e-3, 0.150] }));
  sad.add(mesh(rbox(0.130, 0.020, 0.054, 0.012, 2), M.saddle, { name: 'saddle-tail', pos: [0, -8e-3, -0.148] }));
  for (const s of [-1, 1]) {
    sad.add(bend([[s * 0.030, -0.026, 0.088], [s * 0.032, -0.034, 0.0], [s * 0.030, -0.032, -0.098]], 0.0042, M.chrome, 'saddle-rail', 12));
  }
  sad.add(mesh(rbox(0.080, 0.020, 0.036, 0.005, 2), M.darkMetal, { name: 'rail-cradle', pos: [0, -0.036, 0] }));
  sad.add(bolt([0.044, -0.036, 0.030], 0.0052, M.darkMetal, 'x', 'rail-bolt-f'));
  sad.add(bolt([-0.044, -0.038, -0.03], 0.0052, M.darkMetal, 'x', 'rail-bolt-r'));
  // サドル下部の金具（下見：裏側のクリップとリベット）
  for (const s of [-1, 1]) {
    sad.add(mesh(cyl(0.0058, 0.0058, 0.006, 8), M.steel, { name: 'saddle-rivet', pos: [s * 0.052, -0.018, 0.056], rot: [Math.PI / 2, 0, 0] }));
  }
  sad.add(mesh(rbox(0.088, 0.008, 0.052, 0.003, 2), M.darkMetal, { name: 'saddle-plate-under', pos: [0, -0.022, -0.056] }));
  // バネ付きシートピラー
  for (const s of [-1, 1]) {
    S.add(mesh(cyl(0.0125, 0.0125, 0.050, 10), M.chrome, { name: 'spring-cup', pos: [s * 0.046, 0.938, -0.216], rot: [d2r(12), 0, s * d2r(6)] }));
    const sp = mesh(coil(0.0135, 0.050, 5, 10, 0.0032), M.steel, { name: 'seat-spring', pos: [s * 0.046, 0.912, -0.21], rot: [d2r(12), 0, s * d2r(6)] });
    sp.userData.noOutline = true;
    S.add(sp);
  }
  weather(sad, { w: 0.10, h: 0.07, pos: [0.02, 0.028, 0.01], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#2b201c', opacity: 0.55, seed: seed + 33, count: 3, spread: 0.04 });
  weather(sad, { w: 0.07, h: 0.05, pos: [-0.045, 0.029, -0.06], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#8b7a5e', opacity: 0.5, seed: seed + 35, spread: 0.03 });
  S.add(sad);

  /* ============ 5. クランク・ペダル・チェーン・リング・ケース ============ */
  const D = grp('drivetrain');
  bike.add(D);
  const ringR = 0.0685, cogR = 0.0315, chainX = 0.0585;
  const crankAng = d2r(-24);
  const cranks = grp('cranks', { pos: [BB[0], BB[1], BB[2]], rot: [crankAng, 0, 0] });
  for (const s of [-1, 1]) {
    const armX = s * (s > 0 ? 0.064 : 0.022);
    const arm = grp('crank', { pos: [armX, 0, 0] });
    arm.add(mesh(rbox(0.015, 0.168, 0.032, 0.006, 2), s > 0 ? M.chrome : M.steel, { name: 'crank-arm', pos: [0, s * 0.084, 0] }));
    arm.add(mesh(cyl(0.0125, 0.0125, 0.022, 10), M.darkMetal, { name: 'crank-boss', rot: [0, 0, Math.PI / 2] }));
    const ped = grp('pedal', { pos: [s * (Math.abs(armX) + 0.050), s * 0.168, 0] });
    ped.add(mesh(rbox(0.098, 0.024, 0.076, 0.006, 2), M.white, { name: 'pedal-body' }));
    ped.add(mesh(box(0.090, 0.004, 0.052), M.darkMetal, { name: 'pedal-plate', pos: [0, 0.014, 0] }));
    ped.add(mesh(rbox(0.058, 0.046, 0.006, 0.004, 2), M.reflectorAmber, { name: 'pedal-reflector', pos: [s * 0.052, 0, 0] }));
    ped.add(mesh(rbox(0.064, 0.005, 0.046, 0.002, 2), M.reflectorAmber, { name: 'pedal-reflector-under', pos: [0, -0.015, 0] }));
    ped.add(bolt([s * 0.060, 0, 0], 0.0082, M.darkMetal, 'x', 'pedal-cap'));
    arm.add(mesh(cyl(0.0085, 0.0085, 0.052, 8), M.chrome, { name: 'pedal-spindle', pos: [s * 0.030, s * 0.168, 0], rot: [0, 0, Math.PI / 2] }));
    arm.add(ped);
    cranks.add(arm);
  }
  D.add(cranks);
  // チェーンリング（32T・歯を radial() で）
  const ringG = grp('chainring', { pos: [chainX, BB[1], BB[2]], rot: [crankAng, 0, 0] });
  ringG.add(mesh(cyl(ringR - 0.008, ringR - 0.008, 0.0035, 30), M.steel, { name: 'ring-plate', rot: [0, 0, Math.PI / 2] }));
  ringG.add(ring([0, 0, 0], [1, 0, 0], ringR, 0.0045, M.steel, 'ring-wall'));
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.42;
      ringG.add(seg([Math.cos(a) * 0.020, s * 0.006, Math.sin(a) * 0.020],
        [Math.cos(a) * (ringR - 0.010), s * 0.0035, Math.sin(a) * (ringR - 0.010)], 0.0058, M.steel, 'spider-arm'));
    }
  }
  {
    const tp = polar('x');
    radial(tp, 32, ringR + 0.0026, (i, a) => {
      const gg = grp('tooth-arm');
      gg.rotation.y = -a;
      const t = mesh(rbox(0.0095, 0.0062, 0.0058, 0.0016, 1), M.chrome, { name: 'ring-tooth', pos: [0, 0, 0] });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    ringG.add(tp);
  }
  D.add(ringG);
  // リアスプロケット（14T）+ ロックリング
  const cog = grp('cog', { pos: [chainX, RW, ZR] });
  cog.add(ring([0, 0, 0], [1, 0, 0], cogR, 0.0042, M.steel, 'cog-wall'));
  cog.add(mesh(cyl(cogR - 0.006, cogR - 0.006, 0.0062, 20), M.steel, { name: 'cog-plate', rot: [0, 0, Math.PI / 2] }));
  {
    const tp = polar('x');
    radial(tp, 14, cogR + 0.0020, (i, a) => {
      const gg = grp('cogtooth-arm');
      gg.rotation.y = -a;
      const t = mesh(box(0.0072, 0.0046, 0.0044), M.chrome, { name: 'cog-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    cog.add(tp);
  }
  cog.add(bolt([0.016, 0, 0], 0.0178, M.darkMetal, 'x', 'lockring'));
  D.add(cog);

  // チェーン（外リンク / ローラー を交互、下面は軽く垂れる）
  const sag = 0.011;
  const dzc = ZR - BB[2], dyc = RW - BB[1], dd = Math.hypot(dzc, dyc);
  const phi = Math.atan2(dyc, dzc);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (ringR - cogR) / dd)));
  const aTop = phi - alpha, aBot = phi + alpha - Math.PI * 2;    // -100° 相当へ
  const cC = [BB[2], BB[1]], cG = [ZR, RW];
  const pAt = (c, r, a, drop = 0) => new Vector3(chainX, c[1] + Math.sin(a) * r - drop, c[0] + Math.cos(a) * r);
  const pathPts = [];
  for (let i = 0; i <= 16; i++) pathPts.push(pAt(cC, ringR, aTop + ((aBot - aTop) * i) / 16));   // リング前側を wrap
  {                                                                                                 // 下側ラン（垂れ）
    const p1 = pAt(cC, ringR, aBot), p2 = pAt(cG, cogR, aBot);
    pathPts.push(p1);
    pathPts.push(p1.clone().lerp(p2, 0.38).sub(new Vector3(0, sag, 0)));
    pathPts.push(p1.clone().lerp(p2, 0.66).sub(new Vector3(0, sag * 0.86, 0)));
    pathPts.push(p2);
  }
  const wrap = Math.PI * 2 - (aTop - aBot);                                                          // ギア後側を回る 172°
  for (let i = 1; i <= 10; i++) pathPts.push(pAt(cG, cogR, aBot - (wrap * i) / 10));
  const chainCurve = new CatmullRomCurve3(pathPts, true, 'catmullrom', 0.02);
  const chainG = grp('chain');
  const linkOut = rbox(0.0074, 0.0076, 0.0148, 0.0018, 1);
  const linkIn = cyl(0.0043, 0.0043, 0.0104, 7);
  along(chainG, chainCurve, 70, (i, p, t) => {
    const tg = chainCurve.getTangentAt(t % 1);
    const outer = i % 2 === 0;
    const mm = mesh(outer ? linkOut : linkIn, outer ? M.steel : M.chrome, { name: outer ? 'chain-outer' : 'chain-roller' });
    mm.quaternion.setFromUnitVectors(FZ, tg);
    if (!outer) mm.rotateZ(Math.PI / 2);
    mm.userData.noOutline = true;
    return mm;
  });
  D.add(chainG);

  // チェーンケース（半覆い・「パンク注意」ステッカー）
  const CG = grp('chain-guard');
  bike.add(CG);
  const gx = 0.0705;
  CG.add(mesh(cyl(0.1055, 0.1055, 0.0045, 30), M.guard, { name: 'guard-disc', pos: [gx, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  CG.add(ring([gx, BB[1], BB[2]], [1, 0, 0], 0.1042, 0.0055, M.frameDark, 'guard-rim'));
  // 絞りプレートの筋とボス（平べったく見せないための立上げ）
  CG.add(ring([gx + 0.0015, BB[1], BB[2]], [1, 0, 0], 0.0620, 0.0035, M.guard, 'guard-bead-1'));
  CG.add(ring([gx + 0.0015, BB[1], BB[2]], [1, 0, 0], 0.0330, 0.0035, M.guard, 'guard-bead-2'));
  CG.add(mesh(cyl(0.0245, 0.0245, 0.010, 16), M.guard, { name: 'guard-boss', pos: [gx + 0.005, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    CG.add(mesh(box(0.006, 0.052, 0.0075), M.guard, {
      name: 'guard-rib', pos: [gx + 0.004, BB[1] + Math.cos(a) * 0.082, BB[2] + Math.sin(a) * 0.082],
      rot: [a, 0, 0],
    }));
    CG.add(mesh(box(0.005, 0.014, 0.006), M.frameDark, {
      name: 'guard-vent', pos: [gx + 0.004, BB[1] + Math.cos(a + 0.628) * 0.048, BB[2] + Math.sin(a + 0.628) * 0.048],
      rot: [a + 0.628, 0, 0],
    }));
  }
  {
    const plate = [
      new Vector3(gx, BB[1] + ringR * Math.sin(aTop) + 0.016, BB[2] + ringR * Math.cos(aTop)),
      new Vector3(gx, 0.404, -0.2),
      new Vector3(gx, 0.398, -0.4),
      new Vector3(gx, RW + cogR + 0.016, ZR + 0.020),
      new Vector3(gx, RW + cogR + 0.012, ZR - 0.058),
    ];
    const curve = new CatmullRomCurve3(plate, false, 'catmullrom', 0.3);
    const verts = [], idx = [], wHalf = 0.026, N = 22;
    for (let i = 0; i <= N; i++) {
      const q = curve.getPointAt(i / N);
      verts.push(q.x, q.y - wHalf, q.z, q.x, q.y + wHalf, q.z);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    CG.add(mesh(geo, M.guardSide, { name: 'guard-top-plate' }));
  }
  CG.add(bolt([gx + 0.004, BB[1] + 0.022, BB[2] - 0.036], 0.0062, M.darkMetal, 'x', 'guard-bolt'));
  CG.add(bolt([gx + 0.004, 0.392, -0.3], 0.0062, M.darkMetal, 'x', 'guard-bolt2'));
  decal(CG, { map: TEX.signboard({ text: 'パンク注意', sub: 'AIR 2.5-3.5', bg: '#f4e7c8', fg: '#b8433a', stripe: '#e0b641' }), w: 0.062, h: 0.0155, pos: [gx + 0.0042, 0.356, -0.234], rot: [-Math.PI / 2 + 0.12, 0, 0], opacity: 0.92 });
  decal(CG, { map: TEX.adStrip({ text: '春の交通安全', bg: '#e7e3d8', seed: seed + 3 }), w: 0.046, h: 0.030, pos: [gx + 0.0042, BB[1] + 0.030, BB[2] + 0.034], rot: [0, Math.PI / 2, Math.PI / 2], opacity: 0.7 });
  tubeDecal(CG, { at: [gx + 0.0026, 0.398, -0.42], axis: [0, -6e-3, -0.1], side: [1, 0, 0], w: 0.040, h: 0.130, kind: 'chip', color: '#9c937e', opacity: 0.55, seed: seed + 37 });
  weather(CG, { w: 0.07, h: 0.05, pos: [gx + 0.005, BB[1] - 0.03, BB[2] + 0.055], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + 39, spread: 0.05 });

  /* ============ 6. 前かご（ダイヤ）＋藤風カバー＋買い物袋の残り ============ */
  if (basket) {
    const K = grp('front-basket');
    bike.add(K);
    const bw = 0.300, bl = 0.400, bh = 0.168;
    const z0 = 0.330, z1 = z0 + bl, yBase = 0.652, yTop = yBase + bh;
    const zMid = (z0 + z1) / 2;
    // 底金网（前下がり）
    const bottom = grp('basket-floor', { pos: [0, yBase - 0.004, zMid], rot: [d2r(-9), 0, 0] });
    grill(bottom, { w: bw - 0.024, h: bl - 0.030, nx: 9, ny: 12, bar: 0.0052, mat: M.resin, rot: [Math.PI / 2, 0, 0] });
    K.add(bottom);
    // 壁 4 面（金网）
    const wall = (name, w, pos, rotY, leanDeg) => {
      const gg = grp(name, { pos, rot: [0, rotY, 0] });
      grill(gg, { w, h: bh, nx: Math.max(6, Math.round(w * 26)), ny: 7, bar: 0.0050, mat: M.resin, rot: [d2r(leanDeg), 0, 0] });
      for (let k = -1; k <= 1; k++) gg.add(mesh(box(0.007, bh, 0.009), M.resin, { name: name + '-rib', pos: [k * w * 0.32, 0, 0.0025] }));
      K.add(gg);
    };
    wall('basket-side-L', bl + 0.020, [-bw / 2 - 0.005, yBase + bh / 2, zMid], Math.PI / 2, 0);
    wall('basket-side-R', bl + 0.020, [bw / 2 + 0.005, yBase + bh / 2, zMid], Math.PI / 2, 0);
    wall('basket-front', bw + 0.020, [0, yBase + bh / 2 - 0.008, z1 + 0.012], 0, -7);
    wall('basket-back', bw + 0.020, [0, yBase + bh / 2 + 0.006, z0 - 0.010], 0, 7);
    // 上縁（藤巻き）
    const rim = grp('basket-rim');
    const ry = yTop + 0.004, za = z0 - 0.016, zb = z1 + 0.020;
    rim.add(seg([-bw / 2 - 0.012, ry, za], [-bw / 2 - 0.012, ry, zb], 0.0078, M.rattan, 'rim-L'));
    rim.add(seg([bw / 2 + 0.012, ry, za], [bw / 2 + 0.012, ry, zb], 0.0078, M.rattan, 'rim-R'));
    rim.add(seg([-bw / 2 - 0.012, ry, zb], [bw / 2 + 0.012, ry, zb], 0.0078, M.rattan, 'rim-F'));
    rim.add(seg([-bw / 2 - 0.012, ry, za], [bw / 2 + 0.012, ry, za], 0.0078, M.rattan, 'rim-B'));
    K.add(rim);
    // 藤風カバー（下半分を巻く）
    const covH = 0.104, covY = yBase + covH / 2 - 0.008;
    const cov = grp('rattan-cover');
    const panel = (name, w, pos, rotY) => {
      const p = grp(name, { pos, rot: [0, rotY, 0] });
      grill(p, { w: w - 0.02, h: covH - 0.02, nx: Math.round(w * 26), ny: 7, bar: 0.0064, mat: M.rattan });
      for (let k = 0; k < 3; k++) p.add(mesh(box(w, 0.0058, 0.0072), M.rattan, { name: name + '-weft', pos: [0, -covH / 2 + 0.014 + (k * (covH - 0.03)) / 2, 0.0038] }));
      cov.add(p);
    };
    panel('cover-front', bw + 0.03, [0, covY, z1 + 0.020], 0);
    panel('cover-back', bw + 0.03, [0, covY, z0 - 0.018], 0);
    panel('cover-L', bl + 0.03, [-bw / 2 - 0.016, covY, zMid], Math.PI / 2);
    panel('cover-R', bl + 0.03, [bw / 2 + 0.016, covY, zMid], Math.PI / 2);
    cov.add(mesh(rbox(bw + 0.014, 0.009, 0.024, 0.003, 2), M.rattan, { name: 'cover-braid-front', pos: [0, yBase + covH - 0.012, z1 + 0.020] }));
    cov.add(mesh(rbox(0.024, 0.009, bl + 0.014, 0.003, 2), M.rattan, { name: 'cover-braid-L', pos: [-bw / 2 - 0.016, yBase + covH - 0.012, zMid] }));
    cov.add(mesh(rbox(0.024, 0.009, bl + 0.014, 0.003, 2), M.rattan, { name: 'cover-braid-R', pos: [bw / 2 + 0.016, yBase + covH - 0.012, zMid] }));
    K.add(cov);
    // 取付ブラケット
    const mnt = grp('basket-mount');
    mnt.add(seg([-0.104, yBase - 0.010, z0 - 0.006], [-0.055, 0.552, 0.372], 0.0075, M.steel, 'mount-L'));
    mnt.add(seg([0.104, yBase - 0.010, z0 - 0.006], [0.055, 0.552, 0.372], 0.0075, M.steel, 'mount-R'));
    mnt.add(mesh(rbox(0.030, 0.011, 0.034, 0.003, 2), M.steel, { name: 'mount-plate', pos: [0, 0.616, 0.300] }));
    mnt.add(bolt([0, 0.623, 0.300], 0.0062, M.darkMetal, 'y', 'mount-bolt'));
    K.add(mnt);
    // 中身：買い物袋の残り・卵パック・袋の持ち手
    const st = grp('basket-stuff');
    st.add(mesh(rbox(0.188, 0.072, 0.150, 0.026, 2), M.plasticBag, { name: 'shopping-bag', pos: [0.022, yBase + 0.040, zMid + 0.034], rot: [d2r(4), d2r(11), d2r(-3)], scale: [1, 0.82, 1] }));
    st.add(mesh(sph(0.052, 12, 9), M.plasticBag, { name: 'bag-crumple', pos: [-0.052, yBase + 0.056, z0 + 0.092], scale: [1.15, 0.62, 0.95] }));
    st.add(mesh(rbox(0.054, 0.112, 0.054, 0.010, 2), M.paper, { name: 'carton', pos: [0.072, yBase + 0.064, z0 + 0.062], rot: [d2r(-6), d2r(24), d2r(4)] }));
    st.add(bend([[0.098, yBase + 0.062, 0.502], [0.128, yBase + 0.140, 0.500], [0.152, yBase + 0.062, 0.514]], 0.0036, M.plasticBag, 'bag-handle', 10));
    st.add(mesh(rbox(0.062, 0.014, 0.048, 0.005, 2), MAT.plastic('#d8d2c2'), { name: 'rice-pack', pos: [-0.058, yBase + 0.028, zMid + 0.086], rot: [0, d2r(-18), 0] }));
    K.add(st);
    weather(K, { w: 0.18, h: 0.12, pos: [-bw / 2 - 0.010, yBase + 0.05, 0.52], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.42, seed: seed + 41, count: 2, spread: 0.018 });
    weather(K, { w: 0.22, h: 0.10, pos: [0, yBase - 0.012, zMid], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6248', opacity: 0.45, seed: seed + 43, spread: 0.010 });
    decal(K, { map: TEX.signboard({ text: '春日駐輪場', sub: 'A-07', bg: '#eae4d6', fg: '#2f6b52' }), w: 0.072, h: 0.026, pos: [0, yBase + 0.122, z1 + 0.024], rot: [d2r(-7), 0, 0], opacity: 0.9 });
  } else {
    // かご無し時はキャリア台座のみ
    bike.add(mesh(rbox(0.22, 0.010, 0.16, 0.004, 2), M.steel, { name: 'carrier-plate', pos: [0, 0.640, 0.470], rot: [d2r(-8), 0, 0] }));
  }

  /* ============ 7. フェンダー（曲がり・擦り傷・水垢・泥跳ね） ============ */
  const FD = grp('fenders');
  bike.add(FD);
  const rearF = fender({ r: 0.344, w: 0.058, center: 2.14, span: 1.80, mat: M.fender });
  rearF.position.set(0, RW, ZR);
  rearF.rotation.x = d2r(2.2);                            // 曲がりのつけ
  FD.add(rearF);
  const frontF = fender({ r: 0.341, w: 0.054, center: 1.10, span: 1.72, mat: M.fender });
  frontF.position.set(0, RW, ZF);
  frontF.rotation.z = d2r(-2.6);
  FD.add(frontF);
  for (const s of [-1, 1]) {
    FD.add(seg([s * 0.026, 0.486, ZF + 0.192], [s * 0.050, 0.442, 0.730], 0.0042, M.chrome, 'fender-strut-f'));
    FD.add(bolt([s * 0.050, 0.446, 0.742], 0.0055, M.darkMetal, 'x', 'strut-bolt-f'));
    FD.add(seg([s * 0.028, 0.498, ZR - 0.166], [s * 0.058, RW + 0.022, ZR - 0.046], 0.0042, M.chrome, 'fender-strut-r'));
    FD.add(bolt([s * 0.058, RW + 0.022, ZR - 0.046], 0.0055, M.darkMetal, 'x', 'strut-bolt-r'));
  }
  
  for (const sx of [1, -1]) {
    for (const [phi, wdt, ht, k, col, op, so] of [[0.52, 0.14, 0.034, 'chip', '#c6c2b8', 0.5, 47], [1.42, 0.10, 0.026, 'scratch', '#8e8b84', 0.4, 49], [0.24, 0.09, 0.030, 'dirt', '#6f6350', 0.5, 55]]) {
      tubeDecal(FD, { at: [sx * 0.013, RW + 0.341 * Math.sin(phi), ZF + 0.341 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
  }
  for (const sx of [1, -1]) {
    for (const [phi, wdt, ht, k, col, op, so] of [[2.62, 0.20, 0.052, 'dirt', '#6f6350', 0.62, 51], [2.98, 0.10, 0.040, 'dirt', '#5f5545', 0.55, 71], [1.62, 0.13, 0.030, 'scratch', '#9a958c', 0.35, 73]]) {
      tubeDecal(FD, { at: [sx * 0.014, RW + 0.344 * Math.sin(phi), ZR + 0.344 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
  }

  /* ====== 8. ライト類（ダイナモ式前灯・ボトルダイナモ・尾灯・反射板） ====== */
  const L = grp('lights');
  bike.add(L);
  const lamp = grp('head-lamp', { pos: [0, 0.628, 0.452], rot: [d2r(-9), 0, 0] });
  lamp.add(mesh(cyl(0.0335, 0.0305, 0.060, 16), M.darkMetal, { name: 'lamp-body', rot: [Math.PI / 2, 0, 0] }));
  lamp.add(mesh(cyl(0.0355, 0.0355, 0.008, 16), M.chrome, { name: 'lamp-bezel', pos: [0, 0, 0.030], rot: [Math.PI / 2, 0, 0] }));
  lamp.add(mesh(sph(0.030, 14, 10, 0, Math.PI * 2, 0, 0.62), M.bulb, { name: 'lamp-lens', pos: [0, 0, 0.032], rot: [-Math.PI / 2, 0, 0] }));
  lamp.add(mesh(cyl(0.0105, 0.0105, 0.028, 8), M.darkMetal, { name: 'lamp-stem', pos: [0, -0.044, -0.01] }));
  lamp.add(mesh(rbox(0.032, 0.012, 0.028, 0.004, 2), M.steel, { name: 'lamp-plate', pos: [0, -0.058, -8e-3] }));
  lamp.add(bolt([0.018, -0.058, -8e-3], 0.0058, M.darkMetal, 'x', 'lamp-bolt'));
  lamp.add(bend([[0, -0.058, 0.004], [-0.034, -0.07, 0.056], [-0.05, -0.05, 0.118]], 0.0028, M.wire, 'lamp-wire', 10));
  L.add(lamp);
  // ボトルダイナモ（前輪側壁を転がす・ローラー擦り減り）
  const dyn = grp('dynamo', { pos: [0.0885, 0.452, 0.336], rot: [0, 0, d2r(-13)] });
  dyn.add(mesh(cyl(0.0148, 0.0148, 0.048, 12), M.darkMetal, { name: 'dynamo-body', rot: [0, 0, Math.PI / 2] }));
  dyn.add(bolt([-0.028, 0, 0], 0.0104, M.chrome, 'x', 'dynamo-cap'));
  dyn.add(mesh(cyl(0.0092, 0.0092, 0.032, 10), M.steel, { name: 'dynamo-bracket', pos: [0, 0.028, 0] }));
  dyn.add(bend([[0, -0.014, 0], [0, -0.03, 0.014], [0, -0.044, 0.030]], 0.0042, M.steel, 'dynamo-arm', 8));
  dyn.add(mesh(cyl(0.0086, 0.0086, 0.015, 10), M.rubberCap, { name: 'dynamo-roller', pos: [0, -0.05, 0.034], rot: [0, 0, Math.PI / 2] }));
  dyn.add(bolt([0, 0.044, 0], 0.0062, M.darkMetal, 'y', 'dynamo-bolt'));
  dyn.add(bend([[0.014, 0.020, 0], [0.030, 0.012, 0.062], [0.020, -0.02, 0.118]], 0.0026, M.wire, 'dynamo-lead', 10));
  L.add(dyn);
  // 尾灯（キャリア下）
  const tl = grp('tail-lamp', { pos: [0, 0.512, ZR - 0.318], rot: [d2r(14), 0, 0] });
  tl.add(mesh(rbox(0.040, 0.032, 0.018, 0.005, 2), M.red, { name: 'tail-body' }));
  tl.add(mesh(rbox(0.030, 0.022, 0.004, 0.004, 2), M.redGlow, { name: 'tail-lens', pos: [0, 0, -0.01] }));
  tl.add(mesh(box(0.010, 0.022, 0.014), M.darkMetal, { name: 'tail-tab', pos: [0, 0.010, 0.012] }));
  tl.add(bolt([0, 0.022, 0.014], 0.005, M.chrome, 'y', 'tail-screw'));
  L.add(tl);
  // フェンダー後端の反射板
  const rref = grp('fender-reflector', { pos: [0, 0.346, ZR - 0.342], rot: [d2r(-24), 0, 0] });
  rref.add(mesh(rbox(0.054, 0.036, 0.005, 0.005, 2), M.red, { name: 'rear-reflector' }));
  rref.add(mesh(rbox(0.044, 0.026, 0.0025, 0.004, 2), M.redGlow, { name: 'rear-reflector-face', pos: [0, 0, -3e-3] }));
  L.add(rref);
  // サドル後方の小型反射板・太阳能テール
  L.add(mesh(rbox(0.030, 0.014, 0.004, 0.003, 2), M.red, { name: 'saddle-reflector', pos: [0, 0.954, -0.388], rot: [d2r(-14), 0, 0] }));
  L.add(mesh(rbox(0.026, 0.012, 0.012, 0.003, 2), M.redGlow, { name: 'seatpost-light', pos: [0, 0.922, -0.294] }));

  /* ====== 9. リアキャリア・防犯登録札・サドルバッグ ====== */
  const RC = grp('rear-carrier');
  bike.add(RC);
  const rackY = 0.712, rackZ0 = -0.262, rackZ1 = -0.845;
  for (const s of [-1, 1]) {
    RC.add(seg([s * 0.076, rackY, rackZ0 + 0.02], [s * 0.076, rackY - 0.008, rackZ1], 0.0085, M.steel, 'rack-rail'));
    RC.add(mesh(cyl(0.0088, 0.0088, 0.058, 8), M.steel, { name: 'rack-rail-bend', pos: [s * 0.076, rackY - 0.034, rackZ1 + 0.012], rot: [d2r(-34), 0, 0] }));
    RC.add(bend([[s * 0.076, rackY - 0.004, rackZ0 + 0.030], [s * 0.062, 0.642, -0.212], [s * 0.048, 0.560, -0.202]], 0.0058, M.steel, 'rack-stay', 10));
    RC.add(bend([[s * 0.076, rackY - 0.008, rackZ1 + 0.100], [s * 0.062, 0.614, -0.52], [s * 0.058, RW + 0.026, ZR - 0.040]], 0.0058, M.steel, 'rack-stay-rear', 12));
    RC.add(bolt([s * 0.058, RW + 0.026, ZR - 0.040], 0.0058, M.darkMetal, 'x', 'rack-bolt'));
    RC.add(bolt([s * 0.048, 0.560, -0.202], 0.0058, M.darkMetal, 'x', 'rack-bolt-front'));
  }
  for (let i = 0; i < 6; i++) {
    const z = rackZ0 + 0.024 + (i / 5) * (rackZ1 - rackZ0 - 0.070);
    RC.add(mesh(cyl(0.0056, 0.0056, 0.152, 8), M.steel, { name: 'rack-cross', pos: [0, rackY - 0.004 - i * 0.0008, z], rot: [0, 0, Math.PI / 2] }));
  }
  const clip = grp('spring-clip', { pos: [0, rackY + 0.016, rackZ0 + 0.072] });
  clip.add(bend([[-0.052, 0, 0], [-0.03, 0.030, 0.006], [0, 0.040, 0.004], [0.030, 0.030, 0.006], [0.052, 0, 0]], 0.0042, M.chrome, 'clip-wire', 16));
  clip.add(bolt([0, 0.004, -0.01], 0.0075, M.darkMetal, 'x', 'clip-pivot'));
  RC.add(clip);
  RC.add(mesh(rbox(0.170, 0.010, 0.050, 0.004, 2), M.steel, { name: 'clip-plate', pos: [0, rackY - 0.008, rackZ0 + 0.032] }));
  // 防犯登録札（日焼け・角折れ）
  const tag = grp('crime-tag', { pos: [0, 0.806, -0.188], rot: [d2r(14), d2r(4), 0] });
  tag.add(mesh(rbox(0.064, 0.042, 0.0035, 0.003, 2), M.paper, { name: 'tag-plate' }));
  decal(tag, { map: TEX.signboard({ text: '防犯登録', sub: '2-1148 春日', bg: '#f6f1e4', fg: '#c2413a' }), w: 0.058, h: 0.038, pos: [0, 0, 0.003], opacity: 0.95 });
  tag.add(mesh(tor(0.0042, 0.0013, 4, 8), M.chrome, { name: 'tag-wire', pos: [0, 0.021, 0.004] }));
  weather(tag, { w: 0.05, h: 0.03, pos: [0.008, 0.008, 0.004], rot: [0, 0, 0], kind: 'chip', color: '#cbbf9d', opacity: 0.4, seed: seed + 52, spread: 0.02 });
  bike.add(tag);
  // サドルバッグ
  const BG = grp('saddle-bag');
  bike.add(BG);
  const bgY = rackY + 0.062, bgZ = -0.558;
  BG.add(mesh(rbox(0.152, 0.100, 0.234, 0.020, 3), M.bag, { name: 'bag-body', pos: [0, bgY, bgZ] }));
  BG.add(mesh(rbox(0.158, 0.030, 0.240, 0.012, 2), M.bagDark, { name: 'bag-flap', pos: [0, bgY + 0.060, bgZ - 0.006], rot: [d2r(4), 0, 0] }));
  for (const s of [-1, 1]) {
    BG.add(mesh(rbox(0.028, 0.012, 0.011, 0.003, 2), M.steel, { name: 'buckle', pos: [s * 0.052, bgY + 0.022, bgZ + 0.114] }));
    BG.add(mesh(box(0.013, 0.080, 0.004), M.bagDark, { name: 'strap', pos: [s * 0.052, bgY - 0.010, bgZ + 0.119] }));
  }
  BG.add(mesh(rbox(0.054, 0.038, 0.009, 0.004, 2), M.bagPocket, { name: 'bag-pocket', pos: [0, bgY - 0.012, bgZ + 0.121] }));
  BG.add(bolt([-0.084, bgY - 0.012, bgZ + 0.02], 0.024, M.bagDark, 'x', 'side-pouch'));
  weather(BG, { w: 0.10, h: 0.07, pos: [0.078, bgY + 0.020, bgZ - 0.04], rot: [0, Math.PI / 2, 0], kind: 'moss', color: PAL.moss, opacity: 0.28, seed: seed + 53, spread: 0.05 });
  weather(BG, { w: 0.14, h: 0.05, pos: [0, bgY - 0.050, bgZ + 0.10], kind: 'dirt', color: '#5b5045', opacity: 0.40, seed: seed + 55, spread: 0.05 });
  decal(BG, { map: TEX.wear({ kind: 'scratch', color: '#d8d2c4', seed: seed + 57, density: 1.2 }), w: 0.12, h: 0.06, pos: [0, bgY + 0.076, bgZ - 0.004], rot: [-Math.PI / 2, 0, 0], opacity: 0.35 });

  /* ============ 10. スタンド（サイドスタンド・バネの錆・センター補助） ============ */
  const ST = grp('stand');
  bike.add(ST);
  const px = -0.05, py = 0.246, pz = -0.05;
  const fx = -0.196, fz = 0.046;
  const fy = -fx * Math.tan(d2r(lean));                   // 傾き後ちょうど接地する高さ
  ST.add(bolt([px - 0.014, py, pz], 0.0108, M.darkMetal, 'x', 'stand-pivot'));
  ST.add(seg([px, py, pz], [fx, fy + 0.016, fz], 0.0088, M.steel, 'stand-leg'));
  ST.add(mesh(cyl(0.0088, 0.0088, 0.040, 8), M.steel, { name: 'stand-foot-bend', pos: [fx + 0.002, fy + 0.014, fz], rot: [Math.PI / 2, 0, 0] }));
  ST.add(mesh(rbox(0.050, 0.010, 0.038, 0.004, 2), M.darkMetal, { name: 'stand-pad', pos: [fx + 0.004, fy + 0.006, fz] }));
  const spr = mesh(coil(0.0125, 0.042, 6, 10, 0.0027), M.rusty, { name: 'stand-spring', pos: [px - 0.006, py - 0.028, pz + 0.020], rot: [d2r(78), 0, d2r(28)] });
  spr.userData.noOutline = true;
  ST.add(spr);
  ST.add(mesh(cyl(0.0075, 0.0075, 0.060, 8), M.steel, { name: 'center-stand-bar', pos: [0, 0.200, ZR + 0.030], rot: [0, 0, Math.PI / 2] }));
  tubeDecal(ST, { at: [-0.118, 0.145, -4e-3], axis: [0, -0.104, 0.048], side: [-1, 0, 0], w: 0.022, h: 0.130, kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 59 });

  /* ============ 11. U字ロック（前輪まわりを施錠・カバー剥がれ） ============ */
  const UL = grp('u-lock');
  bike.add(UL);
  const ulx = -0.1, ulz = ZR + 0.150;
  const body = grp('ulock-body', { pos: [ulx, 0.300, ulz + 0.130], rot: [0, d2r(-8), d2r(90)] });
  body.add(mesh(rbox(0.054, 0.038, 0.112, 0.008, 2), M.red, { name: 'ulock-casing' }));
  body.add(bolt([0, 0, 0.060], 0.0108, M.darkMetal, 'z', 'keyhole-cover'));
  decal(body, { map: TEX.signboard({ text: '施錠', sub: 'SECURE', bg: '#c2413a', fg: '#f2e9dc' }), w: 0.055, h: 0.022, pos: [0.028, 0, 0.0], rot: [0, Math.PI / 2, 0], opacity: 0.85 });
  weather(body, { w: 0.06, h: 0.05, pos: [-0.029, 0.012, 0.020], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#e6ded0', opacity: 0.55, seed: seed + 61, spread: 0.04 });
  UL.add(body);
  UL.add(bend([
    [ulx, 0.300, ulz + 0.170],
    [ulx - 0.006, 0.248, ulz + 0.118],
    [ulx - 0.010, 0.192, ulz + 0.062],
    [ulx - 0.010, 0.186, ulz - 0.020],
    [ulx - 0.004, 0.236, ulz - 0.076],
    [ulx, 0.300, ulz - 0.090],
  ], 0.0089, M.chrome, 'shackle', 26));
  weather(UL, { w: 0.08, h: 0.07, pos: [ulx - 0.014, 0.188, ulz + 0.020], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 63, spread: 0.05 });

  /* ============ 12. ブレーキ（キャリパ・ワイヤー・ロッド） ============ */
  const BR = grp('brakes');
  bike.add(BR);
  for (const c of [{ y: 0.556, z: ZF + 0.298 }, { y: 0.560, z: ZR - 0.058 }]) {
    const cal = grp('caliper', { pos: [0, c.y, c.z] });
    cal.add(mesh(rbox(0.032, 0.028, 0.028, 0.006, 2), M.white, { name: 'caliper-body' }));
    for (const s of [-1, 1]) {
      cal.add(seg([s * 0.012, -6e-3, 0], [s * 0.030, -0.124, 0.010], 0.0055, M.steel, 'caliper-arm'));
      cal.add(mesh(rbox(0.014, 0.020, 0.008, 0.003, 2), M.rubberCap, { name: 'brake-pad', pos: [s * 0.032, -0.132, 0.014] }));
      cal.add(bolt([s * 0.030, -0.124, 0.020], 0.0048, M.darkMetal, 'z', 'pad-pin'));
    }
    cal.add(bolt([0, 0.014, 0], 0.006, M.chrome, 'y', 'caliper-bolt'));
    BR.add(cal);
  }
  for (const s of [-1, 1]) {
    const ay = s < 0 ? 0.452 : 0.520;
    BR.add(mesh(tubeOf(catenary([s * 0.232, 0.864, 0.098], [s * 0.030, ay, ZF + 0.298], 0.034 + range(rnd, 0, 0.012), 18), 0.0026, 22, 6), M.wire, { name: 'brake-cable' }));
    BR.add(bolt([s * 0.030, ay + 0.006, ZF + 0.300], 0.0055, M.darkMetal, 'z', 'cable-ferrel'));
    BR.add(mesh(tubeOf(catenary([s * 0.228, 0.860, 0.108], [s * 0.122, 0.802, 0.222], 0.020, 8), 0.0046, 10, 6), M.rubberCap, { name: 'cable-casing' }));
  }
  BR.add(bend([[0, 0.560, ZR - 0.058], [-0.04, 0.522, ZR - 0.090], [-0.062, 0.436, ZR - 0.072], [-0.062, 0.400, ZR - 0.032]], 0.0036, M.steel, 'roller-brake-rod', 14));
  // 変速ワイヤー
  BR.add(mesh(tubeOf(catenary([0.030, 0.876, 0.140], [0.048, 0.392, 0.096], 0.055, 14), 0.0022, 18, 5), M.wire, { name: 'shift-cable' }));

  /* ============ 13. 車輪 2 枚（後輪はやや空気圧不足・ホイールキャップ） ============ */
  const rear = wheel({ R: 0.3025, tireT: 0.0225, rimR: 0.2775, rimW: 0.026, spokes: 24, M, phase: 0.13, drum: true, squash: 0.986 });
  rear.position.set(0, RW, ZR);
  bike.add(rear);
  const cap = mesh(lathe([[0, -0.013], [0.070, -0.012], [0.116, -4e-3], [0.126, 0.003], [0.118, 0.007], [0.070, 0.003], [0, 0.003]], 24), M.white, { name: 'hub-cap-shell', pos: [-0.072, RW, ZR], rot: [0, 0, Math.PI / 2] });
  bike.add(cap);
  cap.userData.tint = 1;
  const front = wheel({ R: 0.3025, tireT: 0.0225, rimR: 0.2775, rimW: 0.026, spokes: 24, M, phase: 0.27, squash: 1 });
  front.position.set(0, RW, ZF);
  bike.add(front);

  /* ============ 14. 全体做旧・接地影 ============ */
  tubeDecal(bike, { at: [0.0120, 0.216, -0.14], axis: [0, 0.063, -0.538], side: [0, 1, 0], w: 0.024, h: 0.140, kind: 'dirt', color: '#6d6250', opacity: 0.45, seed: seed + 67 });
  shadowBlob(g, { r: 0.27, pos: [0, 0.001, ZR], opacity: 0.22 });
  shadowBlob(g, { r: 0.27, pos: [0, 0.001, ZF], opacity: 0.20 });
  shadowBlob(g, { r: 0.11, pos: [-0.2, 0.001, 0.05], opacity: 0.16 });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
