import { P as PAL, g as grp, M as MAT, D as DoubleSide, s as shade, m as mesh, r as rbox, c as cyl, h as decal, T as TEX, b as box, t as tor, a as sph, w as weather, d as coil, e as radial, V as Vector3, C as CatmullRomCurve3, f as along, B as BufferGeometry, F as Float32BufferAttribute, i as grill, k as tubeOf, l as catenary, n as range, p as shadowBlob, q as finish, j as d2r, v as Mesh, x as PlaneGeometry, u as Matrix4, o as lathe, y as TorusGeometry, z as rand } from './index-BxWjt-aN.js';

//  assets/bike/bicycle-commuter-b.js
//  通勤自転車 B —— 女子仕様（低床フレーム・前バスケット＋布カバー・3段変速・スカートガード）。
//   カゴに傘、丸めたレインカバー、サドルカバー、白／水色のツートン。
//  単位：メートル。原点 = 両輪接地面中心。+Y 上。车头 +Z。lean>0 = 左倒し。

const meta = {
  id: 'bicycle-commuter-b',
  real: [1.76, 1.06, 0.62],
  origin: 'ground-center',
};

/* ================================ 寸法 ================================ */
const RW = 0.322;                        // 26" やや細身
const ZR = -0.545, ZF = 0.545;
const BB = [0, 0.258, -6e-3];
const SC = [0, 0.742, -0.176];            // 低床：シートチューブが寝ている
const HTT = [0, 0.736, 0.268];
const HTB = [0, 0.540, 0.322];
const UP = new Vector3(0, 1, 0);
const AX = new Vector3(1, 0, 0);
const FZ = new Vector3(0, 0, 1);

/* ============================ 共通ヘルパ ============================ */
function seg(a, b, r, mat, name = 'tube', s = 10) {
  const A = new Vector3(a[0], a[1], a[2]);
  const B = new Vector3(b[0], b[1], b[2]);
  const d = B.clone().sub(A);
  const mm = mesh(cyl(r, r * 0.96, d.length(), s), mat, { name });
  mm.position.copy(A).add(B).multiplyScalar(0.5);
  mm.quaternion.setFromUnitVectors(UP, d.normalize());
  return mm;
}
function bend(pts, r, mat, name = 'bend', ts = 20) {
  return mesh(tubeOf(pts, r, ts, 8), mat, { name });
}
function ring(pos, dir, r, t, mat, name = 'weld') {
  const mm = mesh(tor(r, t, 6, 16), mat, { name });
  mm.position.set(pos[0], pos[1], pos[2]);
  mm.quaternion.setFromUnitVectors(FZ, new Vector3(dir[0], dir[1], dir[2]).normalize());
  return mm;
}
function bolt(pos, r, mat, axis = 'y', name = 'bolt') {
  const mm = mesh(cyl(r, r, r * 0.85, 6), mat, { name });
  mm.position.set(pos[0], pos[1], pos[2]);
  if (axis === 'x') mm.rotation.set(0, 0, Math.PI / 2);
  else if (axis === 'z') mm.rotation.set(Math.PI / 2, 0, 0);
  return mm;
}
function polar(axis) {
  const p = grp('polar');
  if (axis === 'x') p.quaternion.setFromUnitVectors(UP, AX);
  else if (axis === 'z') p.quaternion.setFromUnitVectors(UP, FZ);
  return p;
}
function fender({ r, w, center, span, mat }) {
  const arc = grp('fender');
  arc.add(mesh(lathe([[r, -w / 2], [r, -w * 0.2], [r, w * 0.2], [r, w / 2]], 30, center - span / 2, span),
    mat, { name: 'fender-band', rot: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) {
    const a = center + (s * span) / 2;
    const lip = grp('lip');
    lip.rotation.x = -a;
    lip.add(mesh(rbox(w, 0.005, 0.017, 0.002, 2), mat, { name: 'fender-lip', pos: [0, 0, r] }));
    arc.add(lip);
  }
  return arc;
}
function tubeDecal(parent, { at, axis, side, w = 0.05, h = 0.10, kind = 'chip', color = PAL.rust, opacity = 0.5, seed = 1, offset = 0.0016 }) {
  const n = new Vector3(side[0], side[1], side[2]).normalize();
  const a = new Vector3(axis[0], axis[1], axis[2]).normalize();
  const b = new Vector3().crossVectors(n, a).normalize();
  const mm = new Mesh(new PlaneGeometry(w, h),
    MAT.decal({ map: TEX.wear({ kind, color, seed, density: 1.25 }), opacity, side: DoubleSide, order: 1 }));
  mm.position.set(at[0], at[1], at[2]).addScaledVector(n, offset);
  mm.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(b, a, n));
  mm.castShadow = mm.receiveShadow = false;
  parent.add(mm);
  return mm;
}
function tireMesh(R, t, squash, mat, name = 'tire') {
  const mm = mesh(new TorusGeometry(R, t, 12, 44), mat, { name });
  if (squash < 1) {
    mm.scale.y = squash;
    mm.position.y = -(R + t) * (1 - squash);
  }
  return mm;
}
/* 車輪：ローカル +Z = 車軸 */
function wheel(o) {
  const { R, tireT, rimR, rimW, spokes, M, phase = 0, squash = 1, icoHub = false } = o;
  const w = grp('wheel');
  w.rotation.y = Math.PI / 2;
  const Ro = R + tireT;
  w.add(tireMesh(R, tireT, squash, M.tire, 'tire'));
  for (const s of [-1, 1]) w.add(mesh(tor(R - tireT * 0.35, 0.0024, 4, 40), M.tireSide, { name: 'sidewall-band', pos: [0, 0, s * tireT * 0.72] }));
  if (squash < 0.995) {
    for (const s of [-1, 1]) w.add(mesh(sph(0.030, 10, 8), M.tire, { name: 'sidewall-bulge', pos: [0, -Ro * 0.955, s * rimW * 0.3], scale: [1, 0.4, 0.6] }));
    tubeDecal(w, { at: [0, -Ro * 0.88, 0], axis: [1, 0, 0], side: [0, -1, 0], w: 0.028, h: 0.130, kind: 'dirt', color: '#6a5c48', opacity: 0.5, seed: 43 });
  }
  w.add(mesh(cyl(rimR, rimR, rimW, 30, true), M.rim, { name: 'rim-barrel', rot: [Math.PI / 2, 0, 0] }));
  w.add(mesh(cyl(rimR - 0.007, rimR - 0.007, rimW * 0.86, 30, true), M.rimDark, { name: 'rim-bed', rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) w.add(mesh(tor(rimR + 0.0018, 0.0056, 5, 30), M.rim, { name: 'rim-flange', pos: [0, 0, s * rimW * 0.5] }));
  const hub = grp('hub');
  if (icoHub) {                                      // 3段内装ハブ（太いドラム）
    hub.add(mesh(cyl(0.0325, 0.0325, 0.092, 16), M.hub, { name: 'igh-drum', rot: [Math.PI / 2, 0, 0] }));
    hub.add(mesh(cyl(0.0300, 0.0325, 0.014, 16), M.darkMetal, { name: 'igh-cone-L', pos: [0, 0, -0.052], rot: [Math.PI / 2, 0, 0] }));
    hub.add(mesh(cyl(0.0325, 0.0300, 0.014, 16), M.darkMetal, { name: 'igh-cone-R', pos: [0, 0, 0.052], rot: [Math.PI / 2, 0, 0] }));
    hub.add(mesh(box(0.014, 0.010, 0.020), M.darkMetal, { name: 'igh-cable-stub', pos: [0.026, 0.014, -0.03] }));
    hub.add(ring([0, 0, -0.06], [0, 0, 1], 0.026, 0.0035, M.chrome, 'igh-ring'));
  } else {
    hub.add(mesh(cyl(0.0205, 0.0205, 0.058, 14), M.hub, { name: 'hub-body', rot: [Math.PI / 2, 0, 0] }));
  }
  hub.add(mesh(cyl(0.0255, 0.0200, 0.018, 14), M.hub, { name: 'hub-flange-L', pos: [0, 0, -0.03], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0200, 0.0255, 0.018, 14), M.hub, { name: 'hub-flange-R', pos: [0, 0, 0.030], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0072, 0.0072, 0.140, 8), M.chrome, { name: 'axle', rot: [Math.PI / 2, 0, 0] }));
  hub.add(bolt([0, 0, -0.072], 0.0125, M.chrome, 'z', 'axle-nut-L'));
  hub.add(bolt([0, 0, 0.074], 0.0125, M.chrome, 'z', 'axle-nut-R'));
  w.add(hub);
  const planeG = polar('z');
  const rIn = 0.026, rOut = rimR - 0.0085, len = rOut - rIn;
  const sGeo = cyl(0.00205, 0.00175, len, 5);
  radial(planeG, spokes, 0, (i, a) => {
    const flip = i % 2 === 0 ? 1 : -1;
    const g = grp('spoke-arm');
    g.rotation.y = a + phase;
    const sp = mesh(sGeo, M.spoke, { name: 'spoke', pos: [rIn + len / 2, flip * 0.005, 0], rot: [0, 0, Math.PI / 2] });
    const ni = mesh(cyl(0.0030, 0.0030, 0.010, 6), M.spoke, { name: 'nipple', pos: [rOut - 0.003, flip * 0.005, 0], rot: [0, 0, Math.PI / 2] });
    sp.userData.noOutline = ni.userData.noOutline = true;
    g.add(sp, ni);
    return g;
  });
  w.add(planeG);
  const vg = grp('valve'); vg.rotation.z = 0.7 + phase;
  vg.add(mesh(cyl(0.0033, 0.0033, 0.028, 6), M.darkMetal, { name: 'valve-body', pos: [rimR - 0.010, 0, 0], rot: [0, 0, Math.PI / 2] }));
  vg.add(mesh(cyl(0.0056, 0.0056, 0.012, 8), M.rubberCap, { name: 'valve-cap', pos: [rimR + 0.012, 0, 0], rot: [0, 0, Math.PI / 2] }));
  w.add(vg);
  const rg = grp('reflector-arm'); rg.rotation.z = -1.2 + phase;
  rg.add(mesh(rbox(0.012, 0.050, 0.006, 0.003, 2), M.reflector, { name: 'spoke-reflector', pos: [(rIn + rOut) * 0.6, 0, 0.006] }));
  rg.add(mesh(box(0.011, 0.009, 0.013), M.darkMetal, { name: 'reflector-clip', pos: [(rIn + rOut) * 0.6, 0, -2e-3] }));
  w.add(rg);
  return w;
}

/* ================================ build ================================ */
function build(options = {}) {
  const seed = options.seed ?? 21;
  const frame = options.frame ?? PAL.bikeFrameB;
  const basket = options.basket !== false;
  const lean = options.lean ?? 0;

  const rnd = rand(seed);
  const g = grp('bicycle-commuter-b');
  const tilt = grp('lean', { rot: [0, 0, d2r(lean)] });
  const bike = grp('bike');
  tilt.add(bike);
  g.add(tilt);

  const accent = '#8fc4d8';                           // 水色差し色
  const M = {
    tire: MAT.rubber('#34373d', { steps: 3, shadowAmt: 0.95 }),
    tireSide: MAT.rubber('#4a4e55', { spec: 0.14 }),
    rubberCap: MAT.rubber('#25282d'),
    rim: MAT.metal('#d3d7da', { worn: 0.35, repeat: 3, side: DoubleSide }),
    rimDark: MAT.metal('#9aa0a6', { worn: 0.45, side: DoubleSide }),
    hub: MAT.metal('#bcc1c5', { worn: 0.45, repeat: 2 }),
    spoke: MAT.chrome({ spec: 0.66 }),
    chrome: MAT.chrome(),
    steel: MAT.metal('#a3a8ad', { worn: 0.55, repeat: 2 }),
    darkMetal: MAT.darkIron({ worn: 0.5 }),
    rusty: MAT.metalPaint(PAL.rust, { worn: 0.95, repeat: 1.5, spec: 0.1 }),
    wire: MAT.darkIron('#4a4d52'),
    frame: MAT.metalPaint(frame, { worn: 0.42, repeat: 2.2 }),
    frameDark: MAT.metalPaint(shade(frame, 0.72), { worn: 0.5, repeat: 2 }),
    accent: MAT.hardPlastic(accent, { worn: 0.45 }),
    fender: MAT.hardPlastic(shade(accent, 0.86), { worn: 0.55, repeat: 3, side: DoubleSide }),
    skirt: MAT.hardPlastic(shade(frame, 0.96), { worn: 0.5, side: DoubleSide }),
    guard: MAT.hardPlastic(shade(frame, 0.98), { worn: 0.5 }),
    guardSide: MAT.hardPlastic(shade(frame, 0.98), { worn: 0.5, side: DoubleSide }),
    saddle: MAT.plastic('#dcd6cd', { spec: 0.24, shadowAmt: 0.88 }),
    saddleCover: MAT.fabric({ color: '#e7b7c6', repeat: 22 }),
    grip: MAT.plastic('#c9a3b4', { spec: 0.2, shadowAmt: 0.9 }),
    basket: MAT.plastic('#e6e2d8', { steps: 4 }),
    cloth: MAT.fabric({ color: '#f0e3d6', repeat: 16 }),
    cloth2: MAT.fabric({ color: '#bcd8e4', repeat: 14 }),
    bag: MAT.fabric({ color: '#dfe6ea', repeat: 20 }),
    red: MAT.hardPlastic('#c8524a', { worn: 0.4 }),
    amber: MAT.hardPlastic('#e8b451', { worn: 0.4 }),
    reflector: MAT.hardPlastic('#d1402f', { worn: 0.3, side: DoubleSide }),
    redGlow: MAT.ledOn('#e8453c'),
    bulb: MAT.bulb({ color: '#fff6e4' }),
    white: MAT.hardPlastic('#eeeae1', { worn: 0.4 }),
    umbrella: MAT.fabric({ color: '#7fb4cf', repeat: 12 }),
    paper: MAT.paper({ color: '#f4efe2' }),
  };

  /* ---------- 1. 低床フレーム（ダウンチューブが大きく湾曲） ---------- */
  const F = grp('frame');
  bike.add(F);
  F.add(seg(BB, SC, 0.0205, M.frame, 'seat-tube'));
  F.add(seg(SC, [0, 0.700, -0.232], 0.0145, M.frame, 'seat-tube-extension'));
  // 低床メインチューブ：ヘッド下部から下へ回り込んで後輪へ
  F.add(bend([
    [0, HTB[1] + 0.020, HTB[2] - 0.004],
    [0, 0.470, 0.286],
    [0, 0.360, 0.200],
    [0, 0.306, 0.060],
    [0, 0.298, -0.014],
  ], 0.0215, M.frame, 'low-step-tube', 34));
  // チェーンステー / シートステー
  for (const s of [-1, 1]) {
    F.add(seg([s * 0.046, BB[1], BB[2] + 0.004], [s * 0.0575, RW, ZR], 0.0112, M.frame, 'chain-stay'));
    F.add(seg([s * 0.019, SC[1] - 0.050, SC[2] - 0.006], [s * 0.0575, RW + 0.016, ZR + 0.030], 0.0092, M.frame, 'seat-stay'));
    F.add(mesh(rbox(0.019, 0.038, 0.028, 0.006, 2), M.frameDark, { name: 'dropout', pos: [s * 0.0575, RW - 0.002, ZR] }));
    // 低床フレーム特有の補強プレート
    F.add(mesh(rbox(0.014, 0.056, 0.074, 0.004, 2), M.frameDark, { name: 'step-reinforce', pos: [s * 0.014, 0.318, 0.012], rot: [d2r(8), 0, 0] }));
  }
  F.add(seg(HTB, HTT, 0.0235, M.frame, 'head-tube'));
  F.add(mesh(cyl(0.0275, 0.0275, 0.064, 14), M.frameDark, { name: 'bb-shell', pos: [BB[0], BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  // 溶接・継ぎ
  F.add(ring([0, SC[1] - 0.018, SC[2] + 0.016], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0215, 0.0028, M.frameDark, 'weld-seat'));
  F.add(ring([0, 0.300, -0.014], [0, -8e-3, -0.074], 0.0230, 0.0028, M.frameDark, 'weld-step'));
  F.add(ring([0, HTT[1] - 0.026, HTT[2] - 0.002], [0, HTT[1] - HTB[1], HTT[2] - HTB[2]], 0.0245, 0.0026, M.frameDark, 'weld-head'));
  // アクセントストライプ（水色のラインデカル）
  decal(F, { map: TEX.adStrip({ text: 'spring 3-speed', bg: shade(frame, 1.0), seed: seed + 7 }), w: 0.13, h: 0.026, pos: [0.0218, 0.352, 0.130], rot: [0, Math.PI / 2, d2r(-58)], opacity: 0.9 });
  tubeDecal(F, { at: [0.0215, 0.402, 0.216], axis: [0, -0.11, 0.072], side: [1, 0, 0], w: 0.030, h: 0.085, kind: 'chip', color: '#9fa4a8', opacity: 0.55, seed: seed + 3 });
  tubeDecal(F, { at: [-0.021, 0.640, -0.14], axis: [0, SC[1] - BB[1], SC[2] - BB[2]], side: [-1, 0, 0], w: 0.028, h: 0.110, kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + 11 });
  tubeDecal(F, { at: [0.0120, 0.290, -0.18], axis: [0, RW - BB[1], ZR - BB[2]], side: [0, 1, 0], w: 0.022, h: 0.150, kind: 'dirt', color: '#6d5f4b', opacity: 0.5, seed: seed + 27 });
  tubeDecal(F, { at: [0, 0.7585, -0.19], axis: [0, SC[1] - BB[1], SC[2] - BB[2]], side: [0, 1, 0], w: 0.026, h: 0.090, kind: 'scratch', color: '#c7ccd0', opacity: 0.35, seed: seed + 17 });

  /* ---------- 2. ヘッドセット・フォーク ---------- */
  const H = grp('headset');
  bike.add(H);
  const hAngle = Math.atan2(HTT[2] - HTB[2], HTT[1] - HTB[1]);
  H.add(mesh(cyl(0.0260, 0.0260, 0.010, 14), M.chrome, { name: 'upper-race', pos: [0, HTT[1] + 0.005, HTT[2] - 0.001], rot: [hAngle, 0, 0] }));
  H.add(mesh(cyl(0.0240, 0.0240, 0.012, 14), M.chrome, { name: 'lower-race', pos: [0, HTB[1] - 0.010, HTB[2] + 0.002], rot: [hAngle, 0, 0] }));
  H.add(seg([0, HTB[1] - 0.032, HTB[2] + 0.004], [0, HTT[1] + 0.112, HTT[2] - 0.030], 0.0132, M.chrome, 'steerer'));
  const crown = [0, 0.504, 0.340];
  H.add(bend([[0, HTB[1] - 0.006, HTB[2] + 0.002], crown], 0.0220, M.frame, 'fork-crown', 6));
  for (const s of [-1, 1]) {
    H.add(bend([
      [s * 0.023, 0.504, 0.342], [s * 0.040, 0.444, 0.420],
      [s * 0.050, 0.380, 0.496], [s * 0.0575, RW + 0.004, ZF],
    ], 0.0132, M.frame, 'fork-blade', 22));
    H.add(mesh(rbox(0.018, 0.032, 0.026, 0.005, 2), M.frameDark, { name: 'fork-dropout', pos: [s * 0.0575, RW - 0.002, ZF] }));
    H.add(mesh(box(0.019, 0.014, 0.024), M.steel, { name: 'basket-eyelet', pos: [s * 0.048, 0.428, 0.452] }));
    H.add(bolt([s * 0.048, 0.428, 0.466], 0.0053, M.darkMetal, 'z', 'eyelet-bolt'));
  }
  tubeDecal(H, { at: [0.0535, 0.444, 0.420], axis: [0, -0.064, 0.076], side: [1, 0, 0], w: 0.024, h: 0.090, kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + 5 });

  /* ---------- 3. ハンドル（女性用：やや高め・細バークローム） ---------- */
  const HB = grp('handlebar');
  bike.add(HB);
  HB.add(mesh(cyl(0.0205, 0.0180, 0.058, 12), M.frameDark, { name: 'quill', pos: [0, HTT[1] + 0.070, HTT[2] - 0.016], rot: [hAngle * 0.6, 0, 0] }));
  HB.add(mesh(rbox(0.036, 0.026, 0.042, 0.006, 2), M.frameDark, { name: 'stem-head', pos: [0, 0.846, 0.242] }));
  HB.add(bolt([0, 0.868, 0.242], 0.0072, M.chrome, 'y', 'stem-bolt'));
  HB.add(mesh(cyl(0.0168, 0.0168, 0.038, 12), M.steel, { name: 'bar-clamp', pos: [0, 0.864, 0.236], rot: [0, 0, Math.PI / 2] }));
  const barPts = [
    [0, 0.866, 0.236], [0.080, 0.872, 0.222], [0.148, 0.892, 0.184],
    [0.198, 0.912, 0.134], [0.226, 0.920, 0.082],
  ];
  for (const s of [-1, 1]) {
    HB.add(bend(barPts.map((p) => [p[0] * s, p[1], p[2]]), 0.0112, M.chrome, 'handlebar', 22));
    HB.add(mesh(cyl(0.0162, 0.0146, 0.100, 12), M.grip, { name: 'grip', pos: [s * 0.262, 0.924, 0.042], rot: [d2r(-14), 0, d2r(84)] }));
    for (let k = 0; k < 4; k++) HB.add(mesh(tor(0.0160, 0.0017, 4, 12), M.grip, { name: 'grip-ring', pos: [s * (0.234 + k * 0.019), 0.9245 - k * 0.0016, 0.042 + k * 0.019], rot: [0, 0, Math.PI / 2] }));
    HB.add(bolt([s * 0.312, 0.926, 0.024], 0.0142, M.accent, 'x', 'bar-end'));
    // レバー（小柄用・ショートリーチ）
    const lev = grp('lever', { pos: [s * 0.214, 0.916, 0.108], rot: [d2r(20), 0, d2r(90 - s * 14)] });
    lev.add(mesh(rbox(0.015, 0.012, 0.034, 0.004, 2), M.chrome, { name: 'lever-root' }));
    lev.add(seg([0.011, 0, 0], [0.011, 0, -0.086], 0.0052, M.chrome, 'lever-blade'));
    lev.add(bend([[0.011, 0, -0.086], [0.013, 0, -0.112], [0.018, 0.004, -0.124]], 0.0052, M.chrome, 'lever-tip', 6));
    HB.add(lev);
  }
  // グリップシフター（3段）
  const shf = grp('grip-shifter', { pos: [0.222, 0.922, 0.070], rot: [d2r(-14), 0, d2r(84)] });
  shf.add(mesh(cyl(0.0175, 0.0175, 0.030, 12), M.accent, { name: 'twist-grip', rot: [0, 0, Math.PI / 2] }));
  for (let k = 0; k < 6; k++) shf.add(mesh(tor(0.0176, 0.0016, 4, 12), M.accent, { name: 'twist-rib', pos: [-0.012 + k * 0.005, 0, 0], rot: [0, 0, Math.PI / 2] }));
  shf.add(mesh(box(0.010, 0.014, 0.016), M.white, { name: 'shifter-window', pos: [0, 0.018, 0.006] }));
  HB.add(shf);
  // ベル（小ぶりの丸ベル）
  const bell = grp('bell', { pos: [-0.166, 0.938, 0.158], rot: [0, d2r(-18), 0] });
  bell.add(mesh(sph(0.0225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.chrome, { name: 'bell-dome' }));
  bell.add(mesh(cyl(0.0230, 0.0210, 0.006, 14), M.steel, { name: 'bell-rim' }));
  bell.add(mesh(cyl(0.0068, 0.0068, 0.013, 8), M.darkMetal, { name: 'bell-post', pos: [0, -8e-3, 0] }));
  bell.add(mesh(box(0.006, 0.0035, 0.022), M.chrome, { name: 'bell-striker', pos: [0.012, 0.002, 0.010], rot: [0, d2r(18), 0] }));
  HB.add(bell);
  // ミラー（右側・丸型）
  const mir = grp('mirror', { pos: [0.288, 0.936, 0.062], rot: [d2r(-10), d2r(-26), d2r(-24)] });
  mir.add(mesh(cyl(0.0070, 0.0070, 0.018, 8), M.darkMetal, { name: 'mirror-cup' }));
  mir.add(mesh(sph(0.0086, 10, 8), M.darkMetal, { name: 'mirror-ball', pos: [0, 0.018, 0] }));
  mir.add(seg([0, 0.022, 0], [0, 0.078, 0.008], 0.0040, M.darkMetal, 'mirror-stem'));
  mir.add(mesh(cyl(0.0295, 0.0295, 0.0075, 18), M.accent, { name: 'mirror-frame', pos: [0, 0.086, 0.011], rot: [d2r(16), 0, 0] }));
  mir.add(mesh(cyl(0.0268, 0.0268, 0.0025, 18), M.chrome, { name: 'mirror-glass', pos: [0, 0.086, 0.016], rot: [d2r(16), 0, 0] }));
  HB.add(mir);
  // 電池式ライト（バー中央・角型）
  const lamp = grp('bar-lamp', { pos: [0, 0.884, 0.286], rot: [d2r(6), 0, 0] });
  lamp.add(mesh(rbox(0.056, 0.040, 0.062, 0.008, 2), M.white, { name: 'lamp-body' }));
  lamp.add(mesh(cyl(0.0170, 0.0150, 0.010, 14), M.bulb, { name: 'lamp-lens', pos: [0, 0.004, 0.034], rot: [Math.PI / 2, 0, 0] }));
  lamp.add(mesh(box(0.016, 0.006, 0.012), M.darkMetal, { name: 'lamp-button', pos: [0.014, 0.021, 0.010] }));
  lamp.add(mesh(rbox(0.024, 0.020, 0.020, 0.004, 2), M.darkMetal, { name: 'lamp-strap', pos: [0, 0.020, -0.03] }));
  HB.add(lamp);
  weather(HB, { w: 0.06, h: 0.04, pos: [0.264, 0.936, 0.042], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#a99aa0', opacity: 0.45, seed: seed + 31, spread: 0.012 });

  /* ---------- 4. サドル（カバー付き・高めのポジション） ---------- */
  const S = grp('saddle-assembly');
  bike.add(S);
  const postTop = [SC[0], 0.946, SC[2] - 0.056];
  S.add(seg([SC[0], SC[1] - 0.02, SC[2] + 0.006], postTop, 0.0132, M.chrome, 'seatpost'));
  S.add(mesh(rbox(0.040, 0.034, 0.046, 0.008, 2), M.frameDark, { name: 'seat-clamp', pos: [SC[0], SC[1] + 0.012, SC[2]] }));
  S.add(bolt([0.026, SC[1] + 0.012, SC[2] - 0.004], 0.0066, M.darkMetal, 'x', 'clamp-bolt'));
  const sad = grp('saddle', { pos: [0, 0.978, -0.238], rot: [d2r(-2), 0, 0] });
  sad.add(mesh(rbox(0.162, 0.032, 0.252, 0.034, 3), M.saddle, { name: 'saddle-shell' }));
  sad.add(mesh(rbox(0.128, 0.018, 0.186, 0.026, 3), M.saddle, { name: 'saddle-crown', pos: [0, 0.016, -6e-3] }));
  sad.add(mesh(rbox(0.056, 0.022, 0.068, 0.014, 2), M.saddle, { name: 'saddle-nose', pos: [0, -2e-3, 0.142] }));
  for (const s of [-1, 1]) sad.add(bend([[s * 0.030, -0.024, 0.082], [s * 0.032, -0.032, 0], [s * 0.030, -0.03, -0.092]], 0.0040, M.chrome, 'saddle-rail', 12));
  sad.add(mesh(rbox(0.078, 0.018, 0.034, 0.005, 2), M.darkMetal, { name: 'rail-cradle', pos: [0, -0.034, 0] }));
  // サドルカバー（伸びたゴム布・端にシワ）
  const cov = grp('saddle-cover', { pos: [0, 0.022, -4e-3], rot: [d2r(-2), 0, 0] });
  cov.add(mesh(rbox(0.170, 0.014, 0.262, 0.040, 3), M.saddleCover, { name: 'cover-top' }));
  for (const s of [-1, 1]) {
    cov.add(mesh(rbox(0.012, 0.030, 0.070, 0.006, 2), M.saddleCover, { name: 'cover-skirt', pos: [s * 0.082, -0.014, -0.03], rot: [0, 0, s * d2r(14)] }));
  }
  cov.add(mesh(rbox(0.070, 0.010, 0.030, 0.004, 2), M.saddleCover, { name: 'cover-nose-tuck', pos: [0, -6e-3, 0.132], rot: [d2r(24), 0, 0] }));
  sad.add(cov);
  weather(sad, { w: 0.09, h: 0.06, pos: [0.03, 0.032, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#b6a1a8', opacity: 0.4, seed: seed + 33, count: 2, spread: 0.012 });
  S.add(sad);
  // 後方サドルスプリング
  for (const s of [-1, 1]) {
    const sp = mesh(coil(0.0125, 0.044, 5, 10, 0.0030), M.steel, { name: 'seat-spring', pos: [s * 0.044, 0.928, -0.214], rot: [d2r(10), 0, s * d2r(6)] });
    sp.userData.noOutline = true;
    S.add(sp);
  }

  /* ---------- 5. クランク・ペダル・チェーン（3段・内装） ---------- */
  const D = grp('drivetrain');
  bike.add(D);
  const ringR = 0.0665, cogR = 0.0345, chainX = 0.0575;
  const crankAng = d2r(38);
  const cranks = grp('cranks', { pos: [BB[0], BB[1], BB[2]], rot: [crankAng, 0, 0] });
  for (const s of [-1, 1]) {
    const armX = s * (s > 0 ? 0.062 : 0.021);
    const arm = grp('crank', { pos: [armX, 0, 0] });
    arm.add(mesh(rbox(0.014, 0.165, 0.030, 0.006, 2), s > 0 ? M.chrome : M.steel, { name: 'crank-arm', pos: [0, s * 0.0825, 0] }));
    arm.add(mesh(cyl(0.0120, 0.0120, 0.020, 10), M.darkMetal, { name: 'crank-boss', rot: [0, 0, Math.PI / 2] }));
    arm.add(mesh(cyl(0.0082, 0.0082, 0.050, 8), M.chrome, { name: 'pedal-spindle', pos: [s * 0.030, s * 0.165, 0], rot: [0, 0, Math.PI / 2] }));
    const ped = grp('pedal', { pos: [s * (Math.abs(armX) + 0.048), s * 0.165, 0] });
    ped.add(mesh(rbox(0.094, 0.022, 0.082, 0.006, 2), M.white, { name: 'pedal-body' }));
    ped.add(mesh(box(0.086, 0.004, 0.058), M.darkMetal, { name: 'pedal-plate', pos: [0, 0.013, 0] }));
    ped.add(mesh(rbox(0.054, 0.044, 0.006, 0.004, 2), M.amber, { name: 'pedal-reflector', pos: [s * 0.050, 0, 0] }));
    for (let k = -1; k <= 1; k++) ped.add(mesh(box(0.084, 0.006, 0.006), M.darkMetal, { name: 'pedal-grip-bar', pos: [0, 0.016, k * 0.026] }));
    arm.add(ped);
    cranks.add(arm);
  }
  D.add(cranks);
  const ringG = grp('chainring', { pos: [chainX, BB[1], BB[2]], rot: [crankAng, 0, 0] });
  ringG.add(mesh(cyl(ringR - 0.008, ringR - 0.008, 0.0035, 30), M.steel, { name: 'ring-plate', rot: [0, 0, Math.PI / 2] }));
  ringG.add(ring([0, 0, 0], [1, 0, 0], ringR, 0.0044, M.steel, 'ring-wall'));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    ringG.add(seg([Math.cos(a) * 0.020, 0.005, Math.sin(a) * 0.020], [Math.cos(a) * (ringR - 0.010), 0.003, Math.sin(a) * (ringR - 0.010)], 0.0055, M.steel, 'spider-arm'));
  }
  {
    const tp = polar('x');
    radial(tp, 30, ringR + 0.0025, (i, a) => {
      const gg = grp('tooth-arm');
      gg.rotation.y = -a;
      const t = mesh(rbox(0.0092, 0.0060, 0.0056, 0.0016, 1), M.chrome, { name: 'ring-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    ringG.add(tp);
  }
  D.add(ringG);
  const cog = grp('cog', { pos: [chainX, RW, ZR] });
  cog.add(ring([0, 0, 0], [1, 0, 0], cogR, 0.0042, M.steel, 'cog-wall'));
  {
    const tp = polar('x');
    radial(tp, 16, cogR + 0.0020, (i, a) => {
      const gg = grp('cogtooth-arm');
      gg.rotation.y = -a;
      const t = mesh(box(0.0070, 0.0044, 0.0042), M.chrome, { name: 'cog-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    cog.add(tp);
  }
  cog.add(bolt([0.014, 0, 0], 0.0195, M.darkMetal, 'x', 'lockring'));
  D.add(cog);
  // チェーン
  const sag = 0.008;
  const dzc = ZR - BB[2], dyc = RW - BB[1], dd = Math.hypot(dzc, dyc);
  const phi = Math.atan2(dyc, dzc);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (ringR - cogR) / dd)));
  const aTop = phi - alpha, aBot = phi + alpha - Math.PI * 2;
  const cC = [BB[2], BB[1]], cG = [ZR, RW];
  const pAt = (c, r, a, drop = 0) => new Vector3(chainX, c[1] + Math.sin(a) * r - drop, c[0] + Math.cos(a) * r);
  const pathPts = [];
  for (let i = 0; i <= 16; i++) pathPts.push(pAt(cC, ringR, aTop + ((aBot - aTop) * i) / 16));
  const p1 = pAt(cC, ringR, aBot), p2 = pAt(cG, cogR, aBot);
  pathPts.push(p1, p1.clone().lerp(p2, 0.5).sub(new Vector3(0, sag, 0)), p2);
  const wrap = Math.PI * 2 - (aTop - aBot);
  for (let i = 1; i <= 10; i++) pathPts.push(pAt(cG, cogR, aBot - (wrap * i) / 10));
  const chainCurve = new CatmullRomCurve3(pathPts, true, 'catmullrom', 0.02);
  const chainG = grp('chain');
  const linkOut = rbox(0.0070, 0.0072, 0.0142, 0.0018, 1);
  const linkIn = cyl(0.0041, 0.0041, 0.0100, 7);
  along(chainG, chainCurve, 66, (i, p, t) => {
    const tg = chainCurve.getTangentAt(t % 1);
    const outer = i % 2 === 0;
    const mm = mesh(outer ? linkOut : linkIn, outer ? M.steel : M.chrome, { name: outer ? 'chain-outer' : 'chain-roller' });
    mm.quaternion.setFromUnitVectors(FZ, tg);
    if (!outer) mm.rotateZ(Math.PI / 2);
    mm.userData.noOutline = true;
    return mm;
  });
  D.add(chainG);
  // 全覆いチェーンケース（白・水色ライン）
  const CG = grp('chain-guard');
  bike.add(CG);
  const gx = 0.0690;
  CG.add(mesh(cyl(0.1010, 0.1010, 0.0045, 30), M.guard, { name: 'guard-disc', pos: [gx, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  CG.add(ring([gx, BB[1], BB[2]], [1, 0, 0], 0.0998, 0.0052, M.accent, 'guard-rim'));
  CG.add(ring([gx + 0.0015, BB[1], BB[2]], [1, 0, 0], 0.0560, 0.0032, M.accent, 'guard-line'));
  CG.add(mesh(cyl(0.0235, 0.0235, 0.009, 16), M.guard, { name: 'guard-boss', pos: [gx + 0.005, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  {
    const plate = [
      new Vector3(gx, BB[1] + ringR * Math.sin(aTop) + 0.015, BB[2] + ringR * Math.cos(aTop)),
      new Vector3(gx, 0.396, -0.19),
      new Vector3(gx, 0.392, -0.38),
      new Vector3(gx, RW + cogR + 0.016, ZR + 0.018),
      new Vector3(gx, RW + cogR + 0.012, ZR - 0.056),
    ];
    const curve = new CatmullRomCurve3(plate, false, 'catmullrom', 0.3);
    const verts = [], idx = [], wHalf = 0.024, N = 22;
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
  CG.add(bolt([gx + 0.004, BB[1] + 0.020, BB[2] - 0.034], 0.0060, M.darkMetal, 'x', 'guard-bolt'));
  decal(CG, { map: TEX.signboard({ text: '3段変速', sub: 'INNER 3', bg: '#eef3f5', fg: '#4d8ba3' }), w: 0.056, h: 0.015, pos: [gx + 0.0042, 0.352, -0.226], rot: [-Math.PI / 2 + 0.12, 0, 0], opacity: 0.9 });
  tubeDecal(CG, { at: [gx + 0.0026, 0.392, -0.4], axis: [0, -6e-3, -0.1], side: [1, 0, 0], w: 0.036, h: 0.110, kind: 'chip', color: '#9c937e', opacity: 0.5, seed: seed + 37 });

  /* ---------- 6. 前バスケット（布カバー・傘・丸めレインカバー） ---------- */
  if (basket) {
    const K = grp('front-basket');
    bike.add(K);
    const bw = 0.286, bl = 0.362, bh = 0.150;
    const z0 = 0.336, z1 = z0 + bl, yBase = 0.636, yTop = yBase + bh;
    const zMid = (z0 + z1) / 2;
    const bottom = grp('basket-floor', { pos: [0, yBase - 0.004, zMid], rot: [d2r(-8), 0, 0] });
    grill(bottom, { w: bw - 0.024, h: bl - 0.028, nx: 8, ny: 11, bar: 0.0050, mat: M.basket, rot: [Math.PI / 2, 0, 0] });
    K.add(bottom);
    const wall = (name, w, pos, rotY, leanDeg) => {
      const gg = grp(name, { pos, rot: [0, rotY, 0] });
      grill(gg, { w, h: bh, nx: Math.max(6, Math.round(w * 24)), ny: 6, bar: 0.0050, mat: M.basket, rot: [d2r(leanDeg), 0, 0] });
      gg.add(mesh(box(w + 0.01, 0.012, 0.010), M.basket, { name: name + '-toprail', pos: [0, bh / 2 + 0.004, 0] }));
      K.add(gg);
    };
    wall('basket-side-L', bl + 0.018, [-bw / 2 - 0.005, yBase + bh / 2, zMid], Math.PI / 2, 0);
    wall('basket-side-R', bl + 0.018, [bw / 2 + 0.005, yBase + bh / 2, zMid], Math.PI / 2, 0);
    wall('basket-front', bw + 0.018, [0, yBase + bh / 2 - 0.006, z1 + 0.010], 0, -8);
    wall('basket-back', bw + 0.018, [0, yBase + bh / 2 + 0.006, z0 - 0.008], 0, 8);
    // 布カバー（前の半分を覆う、裾にシワ）
    const cl = grp('cloth-cover');
    const clothTop = grp('cloth-top', { pos: [0, yTop + 0.006, zMid + 0.03], rot: [d2r(-8), 0, 0] });
    clothTop.add(mesh(rbox(bw + 0.03, 0.008, bl * 0.72, 0.006, 2), M.cloth, { name: 'cloth-flap' }));
    cl.add(clothTop);
    cl.add(mesh(rbox(bw + 0.026, 0.100, 0.010, 0.005, 2), M.cloth, { name: 'cloth-front-skirt', pos: [0, yTop - 0.044, z1 + 0.018], rot: [d2r(-8), 0, 0] }));
    for (const s of [-1, 1]) {
      cl.add(mesh(rbox(0.010, 0.086, bl * 0.62, 0.005, 2), M.cloth, { name: 'cloth-side-skirt', pos: [s * (bw / 2 + 0.014), yTop - 0.050, zMid + 0.05] }));
      cl.add(mesh(box(0.012, 0.030, 0.012), M.cloth2, { name: 'cloth-tie', pos: [s * (bw / 2 + 0.012), yTop - 0.002, z0 + 0.06] }));
    }
    for (let k = 0; k < 5; k++) {                       // シワ（細い帯）
      cl.add(mesh(box(0.011, 0.084, 0.014), M.cloth2, { name: 'cloth-wrinkle', pos: [-bw / 2 + 0.03 + k * (bw - 0.06) / 4, yTop - 0.050, z1 + 0.026] }));
    }
    K.add(cl);
    // 中身：傘（斜めに突き出し）、ボトル、小さなかばん
    const st = grp('basket-stuff');
    const umb = grp('umbrella', { pos: [0.074, yBase + 0.05, zMid + 0.02], rot: [d2r(24), 0, d2r(24)] });
    umb.add(mesh(cyl(0.0190, 0.0205, 0.300, 12), M.umbrella, { name: 'umbrella-cloth', pos: [0, 0.060, 0] }));
    for (let k = 0; k < 6; k++) umb.add(mesh(box(0.004, 0.290, 0.004), M.darkMetal, { name: 'umbrella-rib', pos: [Math.cos(k / 6 * 6.283) * 0.019, 0.060, Math.sin(k / 6 * 6.283) * 0.019] }));
    umb.add(mesh(cyl(0.0050, 0.0050, 0.120, 8), M.darkMetal, { name: 'umbrella-shaft', pos: [0, -0.13, 0] }));
    umb.add(mesh(capsuleGeo(), M.accent, { name: 'umbrella-handle', pos: [0, -0.196, 0.014], rot: [d2r(20), 0, 0] }));
    umb.add(mesh(cyl(0.0075, 0.0030, 0.030, 8), M.accent, { name: 'umbrella-tip', pos: [0, 0.222, 0] }));
    umb.add(mesh(tor(0.0205, 0.0035, 5, 12), M.cloth2, { name: 'umbrella-strap', pos: [0, 0.010, 0], rot: [Math.PI / 2, 0, 0] }));
    st.add(umb);
    st.add(mesh(rbox(0.062, 0.086, 0.048, 0.012, 2), M.bag, { name: 'pouch', pos: [-0.072, yBase + 0.048, z0 + 0.070], rot: [0, d2r(14), 0] }));
    st.add(mesh(cyl(0.0225, 0.0225, 0.086, 12), M.accent, { name: 'bottle', pos: [0.004, yBase + 0.048, z1 - 0.070] }));
    st.add(mesh(sph(0.0235, 12, 9), M.white, { name: 'bottle-cap', pos: [0.004, yBase + 0.094, z1 - 0.070] }));
    K.add(st);
    // 取付
    const mnt = grp('basket-mount');
    mnt.add(seg([-0.1, yBase - 0.010, z0 - 0.006], [-0.052, 0.544, 0.376], 0.0072, M.steel, 'mount-L'));
    mnt.add(seg([0.100, yBase - 0.010, z0 - 0.006], [0.052, 0.544, 0.376], 0.0072, M.steel, 'mount-R'));
    mnt.add(bolt([0, 0.606, 0.306], 0.0060, M.darkMetal, 'y', 'mount-bolt'));
    K.add(mnt);
    weather(K, { w: 0.16, h: 0.10, pos: [-bw / 2 - 0.010, yBase + 0.05, zMid + 0.06], rot: [0, -Math.PI / 2, 0], kind: 'dirt', color: '#8d8574', opacity: 0.4, seed: seed + 41, count: 2, spread: 0.016 });
    decal(K, { map: TEX.signboard({ text: '春日駅', sub: 'B-12', bg: '#eef2f4', fg: '#4d8ba3' }), w: 0.066, h: 0.024, pos: [0, yBase + 0.108, z1 + 0.016], rot: [d2r(-8), 0, 0], opacity: 0.9 });
  }

  /* ---------- 7. フェンダー + スカートガード ---------- */
  const FD = grp('fenders');
  bike.add(FD);
  const rearF = fender({ r: 0.341, w: 0.060, center: 2.12, span: 1.84, mat: M.fender });
  rearF.position.set(0, RW, ZR);
  FD.add(rearF);
  const frontF = fender({ r: 0.338, w: 0.056, center: 1.08, span: 1.74, mat: M.fender });
  frontF.position.set(0, RW, ZF);
  FD.add(frontF);
  for (const s of [-1, 1]) {
    FD.add(seg([s * 0.025, 0.480, ZF + 0.186], [s * 0.048, 0.436, 0.720], 0.0040, M.chrome, 'fender-strut-f'));
    FD.add(bolt([s * 0.048, 0.436, 0.720], 0.0053, M.darkMetal, 'x', 'strut-bolt-f'));
    FD.add(seg([s * 0.027, 0.488, ZR - 0.160], [s * 0.057, RW + 0.022, ZR - 0.044], 0.0040, M.chrome, 'fender-strut-r'));
    FD.add(bolt([s * 0.057, RW + 0.022, ZR - 0.044], 0.0053, M.darkMetal, 'x', 'strut-bolt-r'));
  }
  // スカートガード（後輪左側の樹脂パネル・花柄エンボス）
  const sk = grp('skirt-guard');
  bike.add(sk);
  const skArc = fender({ r: 0.368, w: 0.086, center: 2.30, span: 1.30, mat: M.skirt });
  skArc.position.set(-0.062, RW, ZR);
  sk.add(skArc);
  for (const [yy, zz] of [[0.560, -0.4], [0.606, -0.545], [0.520, -0.69]]) {
    sk.add(mesh(box(0.010, 0.014, 0.050), M.steel, { name: 'skirt-bracket', pos: [-0.052, yy, zz], rot: [d2r(10), 0, d2r(-14)] }));
  }
  sk.add(bolt([-0.057, RW + 0.022, ZR - 0.044], 0.0060, M.darkMetal, 'x', 'skirt-bolt'));
  decal(sk, { map: TEX.poster({ title: '春の花', sub: 'SKIRT GUARD', bg: '#f6f1e8', accent: '#e6a8bb', seed: seed + 9 }), w: 0.086, h: 0.086, pos: [-0.071, 0.556, -0.556], rot: [0, -Math.PI / 2, 0], opacity: 0.55 });
  for (const sx of [1, -1]) {
    for (const [phi, wdt, ht, k, col, op, so] of [[2.58, 0.19, 0.046, 'dirt', '#6f6350', 0.55, 51], [2.94, 0.10, 0.038, 'dirt', '#5f5545', 0.5, 71], [1.50, 0.12, 0.028, 'scratch', '#a8aeb2', 0.4, 73]]) {
      tubeDecal(FD, { at: [sx * 0.014, RW + 0.341 * Math.sin(phi), ZR + 0.341 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
    for (const [phi, wdt, ht, k, col, op, so] of [[0.50, 0.13, 0.032, 'chip', '#c6ccd0', 0.45, 47], [1.36, 0.10, 0.026, 'scratch', '#9aa0a6', 0.4, 49]]) {
      tubeDecal(FD, { at: [sx * 0.013, RW + 0.338 * Math.sin(phi), ZF + 0.338 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
  }

  /* ---------- 8. 尾灯・反射板 ---------- */
  const L = grp('lights');
  bike.add(L);
  const tl = grp('tail-lamp', { pos: [0, 0.520, ZR - 0.306], rot: [d2r(16), 0, 0] });
  tl.add(mesh(rbox(0.042, 0.034, 0.020, 0.006, 2), M.red, { name: 'tail-body' }));
  tl.add(mesh(rbox(0.032, 0.024, 0.004, 0.004, 2), M.redGlow, { name: 'tail-lens', pos: [0, 0, -0.011] }));
  tl.add(mesh(box(0.011, 0.024, 0.014), M.darkMetal, { name: 'tail-tab', pos: [0, 0.010, 0.014] }));
  L.add(tl);
  const rref = grp('fender-reflector', { pos: [0, 0.348, ZR - 0.326], rot: [d2r(-26), 0, 0] });
  rref.add(mesh(rbox(0.056, 0.038, 0.005, 0.005, 2), M.red, { name: 'rear-reflector' }));
  rref.add(mesh(rbox(0.046, 0.028, 0.0025, 0.004, 2), M.redGlow, { name: 'rear-reflector-face', pos: [0, 0, -3e-3] }));
  L.add(rref);
  L.add(mesh(rbox(0.030, 0.013, 0.004, 0.003, 2), M.red, { name: 'saddle-reflector', pos: [0, 0.936, -0.372], rot: [d2r(-12), 0, 0] }));
  // 丸めたレインカバー（キャリア上にゴムバンドで縛ってある）
  const rc = grp('rolled-raincover', { pos: [0, 0.738, -0.402], rot: [0, 0, d2r(3)] });
  rc.add(mesh(cyl(0.0430, 0.0400, 0.216, 16), M.cloth2, { name: 'roll-body', rot: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) rc.add(mesh(sph(0.0415, 12, 9), M.cloth2, { name: 'roll-end', pos: [s * 0.108, 0, 0], scale: [0.42, 1, 1] }));
  for (const bx of [-0.056, 0.052]) {
    rc.add(mesh(tor(0.0445, 0.0045, 5, 16), M.darkMetal, { name: 'roll-band', pos: [bx, 0, 0], rot: [0, Math.PI / 2, 0] }));
  }
  rc.add(mesh(box(0.020, 0.012, 0.010), M.accent, { name: 'roll-clip', pos: [0.0, 0.045, 0.010] }));
  rc.add(bend([[-0.1, -0.02, 0], [-0.05, -0.048, 0.010], [0.050, -0.048, -0.01], [0.100, -0.02, 0]], 0.0028, M.wire, 'roll-cord', 14));
  bike.add(rc);

  /* ---------- 9. リアキャリア（小型）＋防犯登録札 ---------- */
  const RC = grp('rear-carrier');
  bike.add(RC);
  const rackY = 0.700, rackZ0 = -0.25, rackZ1 = -0.79;
  for (const s of [-1, 1]) {
    RC.add(seg([s * 0.072, rackY, rackZ0 + 0.02], [s * 0.072, rackY - 0.010, rackZ1], 0.0080, M.steel, 'rack-rail'));
    RC.add(bend([[s * 0.072, rackY - 0.004, rackZ0 + 0.028], [s * 0.060, 0.630, -0.206], [s * 0.046, 0.548, -0.196]], 0.0055, M.steel, 'rack-stay', 10));
    RC.add(bend([[s * 0.072, rackY - 0.010, rackZ1 + 0.090], [s * 0.058, 0.600, -0.48], [s * 0.057, RW + 0.024, ZR - 0.038]], 0.0055, M.steel, 'rack-stay-rear', 12));
    RC.add(bolt([s * 0.057, RW + 0.024, ZR - 0.038], 0.0055, M.darkMetal, 'x', 'rack-bolt'));
  }
  for (let i = 0; i < 5; i++) {
    const z = rackZ0 + 0.026 + (i / 4) * (rackZ1 - rackZ0 - 0.076);
    RC.add(mesh(cyl(0.0052, 0.0052, 0.146, 8), M.steel, { name: 'rack-cross', pos: [0, rackY - 0.006 - i * 0.0008, z], rot: [0, 0, Math.PI / 2] }));
  }
  RC.add(mesh(rbox(0.160, 0.009, 0.046, 0.004, 2), M.accent, { name: 'clip-plate', pos: [0, rackY - 0.010, rackZ0 + 0.034] }));
  const tag = grp('crime-tag', { pos: [0, 0.780, -0.166], rot: [d2r(12), d2r(3), 0] });
  tag.add(mesh(rbox(0.062, 0.040, 0.0035, 0.003, 2), M.paper, { name: 'tag-plate' }));
  decal(tag, { map: TEX.signboard({ text: '防犯登録', sub: '5-2210 春日', bg: '#f6f1e4', fg: '#c8524a' }), w: 0.056, h: 0.036, pos: [0, 0, 0.003], opacity: 0.95 });
  tag.add(mesh(tor(0.0040, 0.0012, 4, 8), M.chrome, { name: 'tag-wire', pos: [0, 0.020, 0.004] }));
  bike.add(tag);

  /* ---------- 10. スタンド（細いサイドスタンド） ---------- */
  const ST = grp('stand');
  bike.add(ST);
  const px = -0.048, py = 0.240, pz = -0.044;
  const fx = -0.186, fz = 0.040;
  const fy = -fx * Math.tan(d2r(lean));
  ST.add(bolt([px - 0.013, py, pz], 0.0102, M.darkMetal, 'x', 'stand-pivot'));
  ST.add(seg([px, py, pz], [fx, fy + 0.015, fz], 0.0082, M.steel, 'stand-leg'));
  ST.add(mesh(cyl(0.0082, 0.0082, 0.036, 8), M.steel, { name: 'stand-foot-bend', pos: [fx + 0.002, fy + 0.013, fz], rot: [Math.PI / 2, 0, 0] }));
  ST.add(mesh(rbox(0.046, 0.009, 0.036, 0.004, 2), M.accent, { name: 'stand-pad', pos: [fx + 0.004, fy + 0.0055, fz] }));
  const spr = mesh(coil(0.0115, 0.038, 6, 10, 0.0025), M.rusty, { name: 'stand-spring', pos: [px - 0.005, py - 0.026, pz + 0.018], rot: [d2r(76), 0, d2r(26)] });
  spr.userData.noOutline = true;
  ST.add(spr);
  tubeDecal(ST, { at: [-0.112, 0.140, -2e-3], axis: [0, -0.1, 0.044], side: [-1, 0, 0], w: 0.020, h: 0.115, kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 59 });

  /* ---------- 11. ブレーキ・ワイヤー ---------- */
  const BR = grp('brakes');
  bike.add(BR);
  for (const c of [{ y: 0.548, z: ZF + 0.292 }, { y: 0.552, z: ZR - 0.052 }]) {
    const cal = grp('caliper', { pos: [0, c.y, c.z] });
    cal.add(mesh(rbox(0.030, 0.026, 0.026, 0.006, 2), M.white, { name: 'caliper-body' }));
    for (const s of [-1, 1]) {
      cal.add(seg([s * 0.011, -6e-3, 0], [s * 0.028, -0.118, 0.010], 0.0052, M.steel, 'caliper-arm'));
      cal.add(mesh(rbox(0.013, 0.018, 0.007, 0.003, 2), M.rubberCap, { name: 'brake-pad', pos: [s * 0.030, -0.126, 0.014] }));
    }
    cal.add(bolt([0, 0.013, 0], 0.0058, M.chrome, 'y', 'caliper-bolt'));
    BR.add(cal);
  }
  for (const s of [-1, 1]) {
    const ay = s < 0 ? 0.446 : 0.514;
    BR.add(mesh(tubeOf(catenary([s * 0.214, 0.898, 0.118], [s * 0.028, ay, ZF + 0.292], 0.032 + range(rnd, 0, 0.012), 18), 0.0024, 22, 6), M.wire, { name: 'brake-cable' }));
    BR.add(bolt([s * 0.028, ay + 0.006, ZF + 0.294], 0.0053, M.darkMetal, 'z', 'cable-ferrel'));
    BR.add(mesh(tubeOf(catenary([s * 0.210, 0.894, 0.128], [s * 0.110, 0.828, 0.226], 0.018, 8), 0.0044, 10, 6), M.accent, { name: 'cable-casing' }));
  }
  BR.add(mesh(tubeOf(catenary([0.236, 0.906, 0.074], [0.052, 0.600, 0.246], 0.020, 10), 0.0021, 14, 5), M.wire, { name: 'shift-cable-1' }));
  BR.add(mesh(tubeOf(catenary([0.052, 0.600, 0.246], [0.030, 0.330, 0.040], 0.014, 10), 0.0021, 14, 5), M.wire, { name: 'shift-cable-2' }));
  BR.add(mesh(tubeOf(catenary([0.030, 0.330, 0.040], [0.030, RW + 0.020, ZR - 0.030], 0.026, 14), 0.0021, 20, 5), M.wire, { name: 'shift-cable-3' }));
  BR.add(bolt([0.030, RW + 0.020, ZR - 0.030], 0.0048, M.darkMetal, 'y', 'shift-cable-anchor'));

  /* ---------- 12. 車輪 ---------- */
  const rear = wheel({ R: 0.3000, tireT: 0.0220, rimR: 0.2750, rimW: 0.025, spokes: 28, M, phase: 0.11, icoHub: true, squash: 0.990 });
  rear.position.set(0, RW, ZR);
  bike.add(rear);
  const front = wheel({ R: 0.3000, tireT: 0.0220, rimR: 0.2750, rimW: 0.025, spokes: 28, M, phase: 0.24, squash: 0.996 });
  front.position.set(0, RW, ZF);
  bike.add(front);

  shadowBlob(g, { r: 0.26, pos: [0, 0.001, ZR], opacity: 0.22 });
  shadowBlob(g, { r: 0.26, pos: [0, 0.001, ZF], opacity: 0.20 });
  shadowBlob(g, { r: 0.10, pos: [-0.19, 0.001, 0.04], opacity: 0.16 });

  return finish(g, { outline: 'thin' });
}

/* 傘ハンドル用の膠形（capsule 相当を lathe で） */
function capsuleGeo() {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    pts.push([0.0062 + Math.cos(a) * 0.0032, Math.sin(a) * 0.020]);
  }
  return lathe(pts, 12);
}

export { build, build as default, meta };
