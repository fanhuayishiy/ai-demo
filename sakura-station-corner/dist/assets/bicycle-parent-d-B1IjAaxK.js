import { P as PAL, g as grp, M as MAT, D as DoubleSide, s as shade, m as mesh, r as rbox, c as cyl, h as decal, T as TEX, b as box, t as tor, a as sph, w as weather, B as BufferGeometry, F as Float32BufferAttribute, e as radial, V as Vector3, C as CatmullRomCurve3, f as along, i as grill, k as tubeOf, l as catenary, d as coil, n as range, p as shadowBlob, q as finish, j as d2r, v as Mesh, x as PlaneGeometry, u as Matrix4, o as lathe, y as TorusGeometry, z as rand } from './index-Dv-C_8Uh.js';

//  assets/bike/bicycle-parent-d.js
//  通勤自転車 D —— 子乗せ（前チャイルドシート仕様）。
//   前シート：プロテクションバー・ヘッドレスト・安全带（腰・肩・クロッチ）・日除け・フットレスト、
//   後部に大型バスケット（蓋付き）＋ベビーヘルメット、フレーム補強ガセット、
//   両足（センター）スタンド、大型バッテリーライト、重厚なキャリア。
//  単位：メートル。原点 = 両輪接地面中心。+Y 上。车头 +Z。lean>0 = 左倒し。

const meta = {
  id: 'bicycle-parent-d',
  real: [1.88, 1.05, 0.72],
  origin: 'ground-center',
};

/* ================================ 寸法 ================================ */
const RW = 0.326;
const ZR = -0.575, ZF = 0.575;              // 長いホイールベース（前チャイルドシート載せ）
const BB = [0, 0.256, -0.01];
const SC = [0, 0.760, -0.196];
const HTT = [0, 0.752, 0.276];
const HTB = [0, 0.556, 0.332];
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
    lip.add(mesh(rbox(w, 0.005, 0.018, 0.002, 2), mat, { name: 'fender-lip', pos: [0, 0, r] }));
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
function wheel(o) {
  const { R, tireT, rimR, rimW, spokes, M, phase = 0, squash = 1, drum = false } = o;
  const w = grp('wheel');
  w.rotation.y = Math.PI / 2;
  const Ro = R + tireT;
  w.add(tireMesh(R, tireT, squash, M.tire, 'tire'));
  for (const s of [-1, 1]) w.add(mesh(tor(R - tireT * 0.35, 0.0026, 4, 40), M.tireSide, { name: 'sidewall-band', pos: [0, 0, s * tireT * 0.72] }));
  if (squash < 0.995) {
    for (const s of [-1, 1]) w.add(mesh(sph(0.033, 10, 8), M.tire, { name: 'sidewall-bulge', pos: [0, -Ro * 0.955, s * rimW * 0.32], scale: [1, 0.4, 0.62] }));
    tubeDecal(w, { at: [0, -Ro * 0.88, 0], axis: [1, 0, 0], side: [0, -1, 0], w: 0.030, h: 0.140, kind: 'dirt', color: '#665a48', opacity: 0.55, seed: 43 });
  }
  w.add(mesh(cyl(rimR, rimR, rimW, 30, true), M.rim, { name: 'rim-barrel', rot: [Math.PI / 2, 0, 0] }));
  w.add(mesh(cyl(rimR - 0.007, rimR - 0.007, rimW * 0.86, 30, true), M.rimDark, { name: 'rim-bed', rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) w.add(mesh(tor(rimR + 0.0018, 0.0060, 5, 30), M.rim, { name: 'rim-flange', pos: [0, 0, s * rimW * 0.5] }));
  const hub = grp('hub');
  hub.add(mesh(cyl(0.0230, 0.0230, 0.070, 14), M.hub, { name: 'hub-body', rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0280, 0.0220, 0.020, 14), M.hub, { name: 'hub-flange-L', pos: [0, 0, -0.028], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0220, 0.0280, 0.020, 14), M.hub, { name: 'hub-flange-R', pos: [0, 0, 0.028], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0080, 0.0080, 0.142, 8), M.chrome, { name: 'axle', rot: [Math.PI / 2, 0, 0] }));
  hub.add(bolt([0, 0, -0.074], 0.0135, M.chrome, 'z', 'axle-nut-L'));
  hub.add(bolt([0, 0, 0.076], 0.0135, M.chrome, 'z', 'axle-nut-R'));
  if (drum) {
    hub.add(mesh(cyl(0.0520, 0.0520, 0.034, 20), M.darkMetal, { name: 'brake-drum', pos: [0, 0, -0.058], rot: [Math.PI / 2, 0, 0] }));
    hub.add(ring([0, 0, -0.077], [0, 0, 1], 0.0500, 0.0042, M.chrome, 'drum-ring'));
  }
  w.add(hub);
  const planeG = polar('z');
  const rIn = 0.026, rOut = rimR - 0.0085, len = rOut - rIn;
  const sGeo = cyl(0.00240, 0.00205, len, 5);
  radial(planeG, spokes, 0, (i, a) => {
    const flip = i % 2 === 0 ? 1 : -1;
    const g = grp('spoke-arm');
    g.rotation.y = a + phase;
    const sp = mesh(sGeo, M.spoke, { name: 'spoke', pos: [rIn + len / 2, flip * 0.005, 0], rot: [0, 0, Math.PI / 2] });
    const ni = mesh(cyl(0.0033, 0.0033, 0.011, 6), M.spoke, { name: 'nipple', pos: [rOut - 0.003, flip * 0.005, 0], rot: [0, 0, Math.PI / 2] });
    sp.userData.noOutline = ni.userData.noOutline = true;
    g.add(sp, ni);
    return g;
  });
  w.add(planeG);
  const vg = grp('valve'); vg.rotation.z = 0.7 + phase;
  vg.add(mesh(cyl(0.0036, 0.0036, 0.030, 6), M.darkMetal, { name: 'valve-body', pos: [rimR - 0.011, 0, 0], rot: [0, 0, Math.PI / 2] }));
  vg.add(mesh(cyl(0.0060, 0.0060, 0.013, 8), M.rubberCap, { name: 'valve-cap', pos: [rimR + 0.014, 0, 0], rot: [0, 0, Math.PI / 2] }));
  w.add(vg);
  const rg = grp('reflector-arm'); rg.rotation.z = -1.15 + phase;
  rg.add(mesh(rbox(0.013, 0.052, 0.006, 0.003, 2), M.reflector, { name: 'spoke-reflector', pos: [(rIn + rOut) * 0.6, 0, 0.006] }));
  rg.add(mesh(box(0.012, 0.010, 0.014), M.darkMetal, { name: 'reflector-clip', pos: [(rIn + rOut) * 0.6, 0, -2e-3] }));
  w.add(rg);
  return w;
}

/* ================================ build ================================ */
function build(options = {}) {
  const seed = options.seed ?? 67;
  const frame = options.frame ?? PAL.bikeFrameD;
  const basket = options.basket !== false;
  const lean = options.lean ?? 0;

  const rnd = rand(seed);
  const g = grp('bicycle-parent-d');
  const tilt = grp('lean', { rot: [0, 0, d2r(lean)] });
  const bike = grp('bike');
  tilt.add(bike);
  g.add(tilt);

  const cream = '#e8e2d4';
  const M = {
    tire: MAT.rubber('#32353a', { steps: 3, shadowAmt: 0.96 }),
    tireSide: MAT.rubber('#474b52', { spec: 0.13 }),
    rubberCap: MAT.rubber('#24272c'),
    rim: MAT.metal('#cfd3d6', { worn: 0.42, repeat: 3, side: DoubleSide }),
    rimDark: MAT.metal('#93999f', { worn: 0.5, side: DoubleSide }),
    hub: MAT.metal('#aeb4b9', { worn: 0.5, repeat: 2 }),
    spoke: MAT.chrome({ spec: 0.66 }),
    chrome: MAT.chrome(),
    steel: MAT.metal('#9aa0a6', { worn: 0.6, repeat: 2 }),
    darkMetal: MAT.darkIron({ worn: 0.6 }),
    rusty: MAT.metalPaint(PAL.rust, { worn: 0.95, repeat: 1.5, spec: 0.12 }),
    wire: MAT.darkIron('#484b50'),
    frame: MAT.metalPaint(frame, { worn: 0.52, repeat: 2.2 }),
    frameDark: MAT.metalPaint(shade(frame, 0.62), { worn: 0.66, repeat: 2 }),
    fender: MAT.hardPlastic(shade(frame, 0.5), { worn: 0.66, repeat: 3, side: DoubleSide }),
    guard: MAT.hardPlastic(cream, { worn: 0.55 }),
    guardSide: MAT.hardPlastic(cream, { worn: 0.55, side: DoubleSide }),
    saddle: MAT.plastic('#4d4a46', { spec: 0.2, shadowAmt: 0.9 }),
    grip: MAT.rubber('#2f3238'),
    resin: MAT.plastic('#3c4340', { steps: 4 }),
    seatShell: MAT.plastic('#c9563f', { spec: 0.28, specPower: 62, shadowAmt: 0.86 }),
    seatPad: MAT.fabric({ color: '#e6b56a', repeat: 18 }),
    harness: MAT.fabric({ color: '#3c4a58', repeat: 24 }),
    canopy: MAT.fabric({ color: '#d9603f', repeat: 12 }),
    basketCloth: MAT.fabric({ color: '#8fb5a8', repeat: 14 }),
    helmet: MAT.hardPlastic('#e8c34a', { worn: 0.4 }),
    helmetPad: MAT.fabric({ color: '#b5b0a4', repeat: 18 }),
    bag: MAT.fabric({ color: '#5c6b74', repeat: 22 }),
    red: MAT.hardPlastic('#bd4238', { worn: 0.45 }),
    amber: MAT.hardPlastic('#e0a33c', { worn: 0.4 }),
    reflector: MAT.hardPlastic('#c9412f', { worn: 0.35, side: DoubleSide }),
    redGlow: MAT.ledOn('#e8453c'),
    bulb: MAT.bulb({ color: '#fff6e0' }),
    white: MAT.hardPlastic('#eeeae1', { worn: 0.5 }),
    paper: MAT.paper({ color: '#f4efe2' }),
  };

  /* ---------- 1. 補強フレーム（低床＋前載せ用ガセット） ---------- */
  const F = grp('frame');
  bike.add(F);
  F.add(seg(BB, SC, 0.0225, M.frame, 'seat-tube'));
  F.add(seg(SC, [0, 0.716, -0.248], 0.0155, M.frame, 'seat-tube-extension'));
  // 低床メインチューブ
  F.add(bend([
    [0, HTB[1] + 0.022, HTB[2] - 0.004],
    [0, 0.480, 0.300],
    [0, 0.366, 0.210],
    [0, 0.310, 0.060],
    [0, 0.304, -0.02],
  ], 0.0245, M.frame, 'low-step-tube', 32));
  F.add(seg(HTB, HTT, 0.0265, M.frame, 'head-tube'));
  F.add(seg(HTB, BB, 0.0185, M.frame, 'down-tube-brace'));         // 補強チューブ
  for (const s of [-1, 1]) {
    F.add(seg([s * 0.050, BB[1], BB[2] + 0.004], [s * 0.062, RW, ZR], 0.0128, M.frame, 'chain-stay'));
    F.add(seg([s * 0.021, SC[1] - 0.056, SC[2] - 0.006], [s * 0.062, RW + 0.016, ZR + 0.030], 0.0105, M.frame, 'seat-stay'));
    F.add(mesh(rbox(0.022, 0.044, 0.032, 0.006, 2), M.frameDark, { name: 'dropout', pos: [s * 0.062, RW - 0.002, ZR] }));
    // ガセットプレート（応力集中部）
    F.add(mesh(rbox(0.005, 0.062, 0.070, 0.003, 2), M.frameDark, { name: 'gset-seat', pos: [s * 0.024, SC[1] - 0.030, SC[2] + 0.020], rot: [d2r(-16), 0, 0] }));
    F.add(mesh(rbox(0.005, 0.056, 0.062, 0.003, 2), M.frameDark, { name: 'gset-bb', pos: [s * 0.030, BB[1] + 0.026, BB[2] - 0.020], rot: [d2r(14), 0, 0] }));
    for (const [gy, gz] of [[0.026, -0.03], [-0.014, 0.010]]) {
      F.add(bolt([s * 0.030, BB[1] + gy, BB[2] + gz], 0.0048, M.darkMetal, 'x', 'gset-bolt'));
    }
  }
  F.add(mesh(cyl(0.0310, 0.0310, 0.076, 14), M.frameDark, { name: 'bb-shell', pos: [BB[0], BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  F.add(ring([0, SC[1] - 0.018, SC[2] + 0.016], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0240, 0.0032, M.frameDark, 'weld-seat'));
  F.add(ring([0, 0.304, -0.02], [0, -6e-3, -0.08], 0.0258, 0.0030, M.frameDark, 'weld-step'));
  F.add(ring([0, HTT[1] - 0.028, HTT[2] - 0.002], [0, HTT[1] - HTB[1], HTT[2] - HTB[2]], 0.0278, 0.0032, M.frameDark, 'weld-head'));
  {
    const dtAx = [0, 0.160, -0.34];
    tubeDecal(F, { at: [0.0245, 0.420, 0.246], axis: [0, -0.114, 0.090], side: [1, 0, 0], w: 0.032, h: 0.130, kind: 'chip', color: shade(frame, 0.34), opacity: 0.6, seed: seed + 3 });
    tubeDecal(F, { at: [0.0245, 0.356, 0.150], axis: dtAx, side: [1, 0, 0], w: 0.028, h: 0.070, kind: 'scratch', color: '#e6e2d6', opacity: 0.34, seed: seed + 5 });
    const stAx = [0, SC[1] - BB[1], SC[2] - BB[2]];
    tubeDecal(F, { at: [-0.0225, 0.640, -0.152], axis: stAx, side: [-1, 0, 0], w: 0.032, h: 0.150, kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 7 });
    const csAx = [0, RW - BB[1], ZR - BB[2]];
    tubeDecal(F, { at: [0.0540, 0.286, -0.2], axis: csAx, side: [0, 1, 0], w: 0.024, h: 0.170, kind: 'dirt', color: '#6d5f4b', opacity: 0.5, seed: seed + 9 });
  }
  decal(F, { map: TEX.signboard({ text: 'まも号', sub: 'SAFETY 26', bg: shade(frame, 1.15), fg: cream }), w: 0.072, h: 0.020, pos: [0.0252, 0.470, 0.268], rot: [0, Math.PI / 2, d2r(-50)], opacity: 0.9 });

  /* ---------- 2. ヘッドセット・フォーク（太刃） ---------- */
  const H = grp('headset');
  bike.add(H);
  const hAngle = Math.atan2(HTT[2] - HTB[2], HTT[1] - HTB[1]);
  H.add(mesh(cyl(0.0285, 0.0285, 0.011, 14), M.chrome, { name: 'upper-race', pos: [0, HTT[1] + 0.006, HTT[2] - 0.001], rot: [hAngle, 0, 0] }));
  H.add(mesh(cyl(0.0265, 0.0265, 0.013, 14), M.chrome, { name: 'lower-race', pos: [0, HTB[1] - 0.010, HTB[2] + 0.002], rot: [hAngle, 0, 0] }));
  H.add(seg([0, HTB[1] - 0.034, HTB[2] + 0.005], [0, HTT[1] + 0.112, HTT[2] - 0.030], 0.0145, M.chrome, 'steerer'));
  const crown = [0, 0.524, 0.352];
  H.add(bend([[0, HTB[1] - 0.006, HTB[2] + 0.002], crown], 0.0265, M.frame, 'fork-crown', 6));
  for (const s of [-1, 1]) {
    H.add(bend([
      [s * 0.028, 0.524, 0.354], [s * 0.046, 0.458, 0.436],
      [s * 0.056, 0.390, 0.514], [s * 0.062, RW + 0.004, ZF],
    ], 0.0155, M.frame, 'fork-blade', 22));
    H.add(mesh(rbox(0.022, 0.038, 0.030, 0.005, 2), M.frameDark, { name: 'fork-dropout', pos: [s * 0.062, RW - 0.002, ZF] }));
    // 前チャイルドシート／前キャリアの共締めブラケット
    H.add(mesh(box(0.024, 0.018, 0.032), M.steel, { name: 'seat-eyelet', pos: [s * 0.054, 0.450, 0.470] }));
    H.add(bolt([s * 0.054, 0.450, 0.488], 0.0062, M.darkMetal, 'z', 'seat-eyelet-bolt'));
    H.add(mesh(box(0.022, 0.016, 0.028), M.steel, { name: 'basket-eyelet', pos: [s * 0.050, 0.404, 0.560] }));
    H.add(bolt([s * 0.050, 0.404, 0.576], 0.0058, M.darkMetal, 'z', 'basket-eyelet-bolt'));
  }
  tubeDecal(H, { at: [0.0600, 0.458, 0.436], axis: [0, -0.068, 0.078], side: [1, 0, 0], w: 0.028, h: 0.120, kind: 'rust', color: PAL.rust, opacity: 0.42, seed: seed + 11 });

  /* ---------- 3. ハンドル（太バー・大型ライト・ベル・ミラー） ---------- */
  const HB = grp('handlebar');
  bike.add(HB);
  HB.add(mesh(cyl(0.0230, 0.0200, 0.064, 12), M.frameDark, { name: 'quill', pos: [0, HTT[1] + 0.074, HTT[2] - 0.016], rot: [hAngle * 0.6, 0, 0] }));
  HB.add(mesh(rbox(0.042, 0.030, 0.048, 0.006, 2), M.frameDark, { name: 'stem-head', pos: [0, 0.858, 0.246] }));
  HB.add(bolt([0, 0.884, 0.246], 0.0080, M.chrome, 'y', 'stem-bolt'));
  HB.add(mesh(cyl(0.0195, 0.0195, 0.044, 12), M.steel, { name: 'bar-clamp', pos: [0, 0.876, 0.240], rot: [0, 0, Math.PI / 2] }));
  const barPts = [
    [0, 0.878, 0.240], [0.092, 0.880, 0.224], [0.166, 0.888, 0.182],
    [0.218, 0.894, 0.130], [0.252, 0.898, 0.074],
  ];
  for (const s of [-1, 1]) {
    HB.add(bend(barPts.map((p) => [p[0] * s, p[1], p[2]]), 0.0135, M.chrome, 'handlebar', 22));
    HB.add(mesh(cyl(0.0188, 0.0170, 0.112, 12), M.grip, { name: 'grip', pos: [s * 0.296, 0.898, 0.032], rot: [d2r(-8), 0, d2r(86)] }));
    for (let k = 0; k < 5; k++) HB.add(mesh(tor(0.0186, 0.0020, 4, 12), M.grip, { name: 'grip-ring', pos: [s * (0.262 + k * 0.017), 0.898 - k * 0.0009, 0.032 + k * 0.017], rot: [0, 0, Math.PI / 2] }));
    HB.add(bolt([s * 0.354, 0.898, 0.012], 0.0162, M.darkMetal, 'x', 'bar-end'));
    const lev = grp('lever', { pos: [s * 0.248, 0.894, 0.096], rot: [d2r(16), 0, d2r(90 - s * 12)] });
    lev.add(mesh(rbox(0.016, 0.013, 0.038, 0.004, 2), M.chrome, { name: 'lever-root' }));
    lev.add(seg([0.012, 0, 0], [0.012, 0, -0.102], 0.0058, M.chrome, 'lever-blade'));
    lev.add(bend([[0.012, 0, -0.102], [0.014, 0, -0.13], [0.020, 0.004, -0.144]], 0.0058, M.chrome, 'lever-tip', 6));
    HB.add(lev);
    // 親ブレーキ（子ども側レバーも兼ねる大型レバー）
    lev.add(mesh(rbox(0.010, 0.008, 0.046, 0.003, 2), M.red, { name: 'lever-grip', pos: [0.012, 0.010, -0.06] }));
  }
  // 大型バッテリーライト（バー中央・角型大）
  const lamp = grp('big-lamp', { pos: [0, 0.888, 0.300], rot: [d2r(8), 0, 0] });
  lamp.add(mesh(rbox(0.078, 0.054, 0.074, 0.009, 2), M.white, { name: 'lamp-body' }));
  lamp.add(mesh(rbox(0.062, 0.038, 0.006, 0.006, 2), M.bulb, { name: 'lamp-lens', pos: [0, 0, 0.040] }));
  lamp.add(ring([0, 0, 0.036], [0, 0, 1], 0.0330, 0.0042, M.chrome, 'lamp-bezel'));
  lamp.add(mesh(box(0.020, 0.008, 0.014), M.red, { name: 'lamp-switch', pos: [0.020, 0.030, 0.010] }));
  lamp.add(mesh(rbox(0.030, 0.024, 0.026, 0.005, 2), M.darkMetal, { name: 'lamp-strap', pos: [0, 0.026, -0.04] }));
  lamp.add(bolt([0.020, 0.026, -0.04], 0.0058, M.chrome, 'z', 'lamp-bolt'));
  lamp.add(bend([[0, 0.0, -0.052], [-0.03, -0.04, -0.09], [-0.034, -0.06, -0.15]], 0.0030, M.wire, 'lamp-wire', 10));
  HB.add(lamp);
  // ベル（大きな親指ベル）
  const bell = grp('bell', { pos: [-0.196, 0.918, 0.160], rot: [0, d2r(-20), 0] });
  bell.add(mesh(sph(0.0290, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.chrome, { name: 'bell-dome' }));
  bell.add(mesh(cyl(0.0295, 0.0275, 0.007, 14), M.steel, { name: 'bell-rim' }));
  bell.add(mesh(cyl(0.0080, 0.0080, 0.014, 8), M.darkMetal, { name: 'bell-post', pos: [0, -9e-3, 0] }));
  bell.add(mesh(box(0.008, 0.004, 0.028), M.chrome, { name: 'bell-striker', pos: [0.015, 0.002, 0.013], rot: [0, d2r(20), 0] }));
  HB.add(bell);
  // ミラー（左右両方・子乗せは右にも）
  for (const s of [-1, 1]) {
    const mir = grp('mirror', { pos: [s * 0.322, 0.910, 0.054], rot: [d2r(-12), d2r(22 * s), d2r(26 * s)] });
    mir.add(mesh(cyl(0.0080, 0.0080, 0.020, 8), M.darkMetal, { name: 'mirror-cup' }));
    mir.add(mesh(sph(0.0098, 10, 8), M.darkMetal, { name: 'mirror-ball', pos: [0, 0.021, 0] }));
    mir.add(seg([0, 0.025, 0], [0, 0.088, 0.010], 0.0045, M.darkMetal, 'mirror-stem'));
    mir.add(mesh(cyl(0.0330, 0.0330, 0.008, 18), M.darkMetal, { name: 'mirror-frame', pos: [0, 0.096, 0.013], rot: [d2r(18), 0, 0] }));
    mir.add(mesh(cyl(0.0300, 0.0300, 0.0025, 18), M.chrome, { name: 'mirror-glass', pos: [0, 0.096, 0.018], rot: [d2r(18), 0, 0] }));
    HB.add(mir);
  }
  weather(HB, { w: 0.07, h: 0.04, pos: [0.300, 0.912, 0.032], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#5a5f66', opacity: 0.5, seed: seed + 13, spread: 0.010 });

  /* ---------- 4. 大人サドル（後ろ乗りポジション・低め） ---------- */
  const S = grp('saddle-assembly');
  bike.add(S);
  const postTop = [SC[0], 0.934, SC[2] - 0.058];
  S.add(seg([SC[0], SC[1] - 0.02, SC[2] + 0.006], postTop, 0.0148, M.chrome, 'seatpost'));
  S.add(mesh(rbox(0.046, 0.038, 0.050, 0.008, 2), M.frameDark, { name: 'seat-clamp', pos: [SC[0], SC[1] + 0.014, SC[2]] }));
  S.add(bolt([0.029, SC[1] + 0.014, SC[2] - 0.004], 0.0072, M.darkMetal, 'x', 'clamp-bolt'));
  const sad = grp('saddle', { pos: [0, 0.962, -0.244], rot: [d2r(-4), 0, 0] });
  sad.add(mesh(rbox(0.164, 0.036, 0.272, 0.032, 3), M.saddle, { name: 'saddle-shell' }));
  sad.add(mesh(rbox(0.128, 0.020, 0.202, 0.026, 3), M.saddle, { name: 'saddle-crown', pos: [0, 0.018, -8e-3] }));
  sad.add(mesh(rbox(0.056, 0.024, 0.072, 0.014, 2), M.saddle, { name: 'saddle-nose', pos: [0, -2e-3, 0.154] }));
  for (const s of [-1, 1]) sad.add(bend([[s * 0.032, -0.028, 0.092], [s * 0.034, -0.036, 0], [s * 0.032, -0.034, -0.102]], 0.0045, M.chrome, 'saddle-rail', 12));
  sad.add(mesh(rbox(0.084, 0.020, 0.038, 0.005, 2), M.darkMetal, { name: 'rail-cradle', pos: [0, -0.038, 0] }));
  weather(sad, { w: 0.10, h: 0.06, pos: [0.03, 0.030, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#2f2c28', opacity: 0.5, seed: seed + 15, count: 2, spread: 0.012 });
  S.add(sad);

  /* ---------- 5. 前チャイルドシート（バー・ヘッドレスト・安全带・日除け・フットレスト） ---------- */
  const CS = grp('child-seat');
  bike.add(CS);
  const seatY = 0.690, seatZ = 0.400;                        // シート座面中心
  // 台座プレート＋支柱（ヘッドチューブとフォークに共締め）
  CS.add(mesh(rbox(0.230, 0.014, 0.170, 0.005, 2), M.steel, { name: 'seat-base-plate', pos: [0, 0.630, seatZ + 0.010], rot: [d2r(-6), 0, 0] }));
  for (const s of [-1, 1]) {
    CS.add(seg([s * 0.098, 0.626, seatZ - 0.060], [s * 0.056, 0.520, 0.352], 0.0095, M.steel, 'seat-leg'));
    CS.add(seg([s * 0.098, 0.626, seatZ + 0.070], [s * 0.052, 0.452, 0.470], 0.0095, M.steel, 'seat-leg-rear'));
    CS.add(bolt([s * 0.056, 0.520, 0.352], 0.0068, M.darkMetal, 'x', 'seat-leg-bolt'));
    CS.add(bolt([s * 0.052, 0.452, 0.470], 0.0062, M.darkMetal, 'x', 'seat-leg-bolt2'));
  }
  // シートシェル（背もたれ付き・樹脂成型）
  const shell = grp('child-shell', { pos: [0, seatY, seatZ], rot: [d2r(-6), 0, 0] });
  shell.add(mesh(rbox(0.216, 0.030, 0.212, 0.030, 3), M.seatShell, { name: 'cs-pan' }));
  shell.add(mesh(rbox(0.216, 0.196, 0.034, 0.026, 3), M.seatShell, { name: 'cs-backrest', pos: [0, 0.104, -0.096], rot: [d2r(9), 0, 0] }));
  for (const s of [-1, 1]) {
    shell.add(mesh(rbox(0.026, 0.072, 0.150, 0.012, 2), M.seatShell, { name: 'cs-side-wing', pos: [s * 0.100, 0.044, 0.014], rot: [0, 0, s * d2r(-6)] }));
  }
  shell.add(mesh(rbox(0.180, 0.026, 0.170, 0.012, 2), M.seatPad, { name: 'cs-cushion', pos: [0, 0.026, 0.006] }));
  shell.add(mesh(rbox(0.170, 0.140, 0.020, 0.010, 2), M.seatPad, { name: 'cs-back-pad', pos: [0, 0.110, -0.08], rot: [d2r(9), 0, 0] }));
  // ヘッドレスト（両側から挟むパッド + 上部アーム）
  shell.add(mesh(rbox(0.052, 0.056, 0.048, 0.014, 2), M.seatPad, { name: 'cs-headrest', pos: [0, 0.202, -0.092] }));
  for (const s of [-1, 1]) shell.add(mesh(rbox(0.026, 0.068, 0.040, 0.010, 2), M.seatShell, { name: 'cs-headrest-wing', pos: [s * 0.044, 0.206, -0.086] }));
  // プロテクションバー（子供を囲む樹脂バー：前面・側面・股回り）
  const bars = grp('cs-bars');
  for (const s of [-1, 1]) {
    bars.add(bend([[s * 0.106, seatY + 0.010, seatZ - 0.086], [s * 0.118, seatY + 0.070, seatZ - 0.040], [s * 0.120, seatY + 0.086, seatZ + 0.050], [s * 0.108, seatY + 0.020, seatZ + 0.108]], 0.0085, M.resin, 'cs-bar-side', 16));
  }
  bars.add(bend([[-0.108, seatY + 0.022, seatZ + 0.110], [-0.05, seatY + 0.030, seatZ + 0.132], [0.050, seatY + 0.030, seatZ + 0.132], [0.108, seatY + 0.022, seatZ + 0.110]], 0.0085, M.resin, 'cs-bar-front', 16));
  bars.add(mesh(cyl(0.0085, 0.0085, 0.150, 8), M.resin, { name: 'cs-crotch-post', pos: [0, seatY + 0.056, seatZ + 0.046], rot: [d2r(24), 0, 0] }));
  bars.add(mesh(rbox(0.036, 0.026, 0.030, 0.008, 2), M.resin, { name: 'cs-crotch-pad', pos: [0, seatY + 0.086, seatZ + 0.062] }));
  for (let k = 0; k < 3; k++) bars.add(mesh(cyl(0.0060, 0.0060, 0.226, 8), M.resin, { name: 'cs-bar-rail', pos: [0, seatY + 0.040 + k * 0.024, seatZ + 0.126 - k * 0.010], rot: [0, 0, Math.PI / 2] }));
  CS.add(bars);
  // 安全带（腰・肩・クロッチの 3 本 + ベuckle）
  const hs = grp('harness');
  hs.add(mesh(rbox(0.206, 0.016, 0.006, 0.002, 2), M.harness, { name: 'waist-belt', pos: [0, seatY + 0.030, seatZ + 0.020], rot: [0, 0, d2r(3)] }));
  for (const s of [-1, 1]) {
    hs.add(mesh(rbox(0.018, 0.140, 0.006, 0.002, 2), M.harness, { name: 'shoulder-belt', pos: [s * 0.052, seatY + 0.112, seatZ - 0.062], rot: [d2r(-14), 0, s * d2r(6)] }));
    hs.add(mesh(box(0.020, 0.022, 0.010), M.red, { name: 'belt-guide', pos: [s * 0.052, seatY + 0.046, seatZ - 0.020] }));
  }
  hs.add(mesh(rbox(0.046, 0.030, 0.014, 0.004, 2), M.red, { name: 'buckle', pos: [0, seatY + 0.030, seatZ + 0.026] }));
  hs.add(mesh(box(0.012, 0.010, 0.006), M.chrome, { name: 'buckle-pin', pos: [0, seatY + 0.030, seatZ + 0.036] }));
  hs.add(mesh(rbox(0.024, 0.060, 0.006, 0.002, 2), M.harness, { name: 'crotch-strap', pos: [0, seatY - 0.004, seatZ + 0.052], rot: [d2r(28), 0, 0] }));
  CS.add(hs);
  // フットレスト（足置きプレート・ベルト・可動ピボット）
  const fr = grp('foot-rest', { pos: [0, seatY - 0.152, seatZ + 0.164] });
  fr.add(mesh(cyl(0.0090, 0.0090, 0.090, 8), M.steel, { name: 'fr-arm', pos: [0, 0.060, -0.02], rot: [0, 0, Math.PI / 2] }));
  fr.add(mesh(rbox(0.170, 0.012, 0.086, 0.005, 2), M.resin, { name: 'fr-plate', pos: [0, 0, 0.010] }));
  for (let k = -2; k <= 2; k++) fr.add(mesh(box(0.010, 0.004, 0.078), M.darkMetal, { name: 'fr-grip', pos: [k * 0.032, 0.008, 0.010] }));
  fr.add(mesh(rbox(0.050, 0.010, 0.024, 0.003, 2), M.harness, { name: 'fr-strap', pos: [0, 0.040, 0.010] }));
  fr.add(bolt([0.048, 0.060, -0.02], 0.0068, M.darkMetal, 'x', 'fr-pivot'));
  CS.add(fr);
  // 日除け（ワイヤー骨 + 布・折りシワ）
  const cn = grp('sun-canopy');
  const ribs = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = Math.PI * (0.14 + t * 0.84);
    ribs.push([0.000, seatY + 0.164 + Math.sin(a) * 0.162, seatZ - 0.024 + Math.cos(a) * 0.196]);
  }
  for (const s of [-1, 1]) {
    cn.add(bend(ribs.map((p) => [p[0] + s * 0.086, p[1], p[2]]), 0.0032, M.steel, 'canopy-rib', 22));
  }
  cn.add(bend(ribs, 0.0036, M.steel, 'canopy-rib-center', 22));
  const cp = grp('canopy-cloth');
  {
    const verts = [], idx = [];
    const N = 12, halfW = 0.104;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = Math.PI * (0.10 + t * 0.86);
      const y = seatY + 0.164 + Math.sin(a) * 0.162, z = seatZ - 0.024 + Math.cos(a) * 0.196;
      const wv = halfW * (0.60 + 0.40 * Math.sin(Math.PI * t));
      verts.push(-wv, y + 0.006, z, wv, y + 0.006, z);
      if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    cp.add(mesh(geo, MAT.fabric({ color: '#d9603f', repeat: 12, side: DoubleSide }), { name: 'canopy-surface' }));
  }
  for (let k = 0; k < 4; k++) {
    const a = Math.PI * (0.22 + k * 0.19);
    cp.add(mesh(cyl(0.0038, 0.0038, 0.176, 6), M.canopy, { name: 'canopy-seam', pos: [0, seatY + 0.164 + Math.sin(a) * 0.166, seatZ - 0.024 + Math.cos(a) * 0.200], rot: [0, 0, Math.PI / 2] }));
  }
  cp.add(mesh(rbox(0.212, 0.012, 0.048, 0.004, 2), M.canopy, { name: 'canopy-visor', pos: [0, seatY + 0.286, seatZ + 0.150], rot: [d2r(-22), 0, 0] }));
  CS.add(cp);
  weather(CS, { w: 0.12, h: 0.08, pos: [0.112, seatY + 0.030, seatZ + 0.020], rot: [0, Math.PI / 2, 0], kind: 'scratch', color: '#f0dcd2', opacity: 0.4, seed: seed + 17, spread: 0.02 });
  weather(CS, { w: 0.14, h: 0.07, pos: [0, seatY - 0.140, seatZ + 0.020], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6f5c', opacity: 0.45, seed: seed + 19, spread: 0.014 });
  decal(CS, { map: TEX.signboard({ text: '安全運転', sub: 'こども乗せ', bg: shade(frame, 1.1), fg: cream }), w: 0.070, h: 0.020, pos: [0.116, 0.636, seatZ + 0.010], rot: [0, Math.PI / 2, 0], opacity: 0.85 });

  /* ---------- 6. クランク・チェーンケース・内装 3 速 ---------- */
  const D = grp('drivetrain');
  bike.add(D);
  const ringR = 0.0720, cogR = 0.0350, chainX = 0.0620;
  const crankAng = d2r(-34);
  const cranks = grp('cranks', { pos: [BB[0], BB[1], BB[2]], rot: [crankAng, 0, 0] });
  for (const s of [-1, 1]) {
    const armX = s * (s > 0 ? 0.070 : 0.024);
    const arm = grp('crank', { pos: [armX, 0, 0] });
    arm.add(mesh(rbox(0.017, 0.170, 0.034, 0.006, 2), s > 0 ? M.chrome : M.steel, { name: 'crank-arm', pos: [0, s * 0.085, 0] }));
    arm.add(mesh(cyl(0.0135, 0.0135, 0.022, 10), M.darkMetal, { name: 'crank-boss', rot: [0, 0, Math.PI / 2] }));
    arm.add(mesh(cyl(0.0092, 0.0092, 0.052, 8), M.chrome, { name: 'pedal-spindle', pos: [s * 0.032, s * 0.170, 0], rot: [0, 0, Math.PI / 2] }));
    const ped = grp('pedal', { pos: [s * (Math.abs(armX) + 0.052), s * 0.170, 0] });
    ped.add(mesh(rbox(0.104, 0.024, 0.088, 0.006, 2), M.white, { name: 'pedal-body' }));
    ped.add(mesh(box(0.096, 0.004, 0.062), M.darkMetal, { name: 'pedal-plate', pos: [0, 0.014, 0] }));
    ped.add(mesh(rbox(0.060, 0.048, 0.006, 0.004, 2), M.amber, { name: 'pedal-reflector', pos: [s * 0.055, 0, 0] }));
    for (const k of [-1, 1]) ped.add(mesh(box(0.094, 0.006, 0.008), M.darkMetal, { name: 'pedal-clip-bar', pos: [0, 0.018, k * 0.030] }));
    arm.add(ped);
    cranks.add(arm);
  }
  D.add(cranks);
  const ringG = grp('chainring', { pos: [chainX, BB[1], BB[2]], rot: [crankAng, 0, 0] });
  ringG.add(mesh(cyl(ringR - 0.009, ringR - 0.009, 0.0040, 30), M.steel, { name: 'ring-plate', rot: [0, 0, Math.PI / 2] }));
  ringG.add(ring([0, 0, 0], [1, 0, 0], ringR, 0.0050, M.steel, 'ring-wall'));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.35;
    ringG.add(seg([Math.cos(a) * 0.022, 0.006, Math.sin(a) * 0.022], [Math.cos(a) * (ringR - 0.011), 0.004, Math.sin(a) * (ringR - 0.011)], 0.0062, M.steel, 'spider-arm'));
  }
  {
    const tp = polar('x');
    radial(tp, 32, ringR + 0.0028, (i, a) => {
      const gg = grp('tooth-arm');
      gg.rotation.y = -a;
      const t = mesh(rbox(0.0098, 0.0064, 0.0060, 0.0016, 1), M.chrome, { name: 'ring-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    ringG.add(tp);
  }
  D.add(ringG);
  const cog = grp('cog', { pos: [chainX, RW, ZR] });
  cog.add(ring([0, 0, 0], [1, 0, 0], cogR, 0.0046, M.steel, 'cog-wall'));
  {
    const tp = polar('x');
    radial(tp, 16, cogR + 0.0022, (i, a) => {
      const gg = grp('cogtooth-arm');
      gg.rotation.y = -a;
      const t = mesh(box(0.0074, 0.0048, 0.0044), M.chrome, { name: 'cog-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    cog.add(tp);
  }
  cog.add(bolt([0.016, 0, 0], 0.0205, M.darkMetal, 'x', 'lockring'));
  D.add(cog);
  const sag = 0.009;
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
  const linkOut = rbox(0.0078, 0.0080, 0.0154, 0.0018, 1);
  const linkIn = cyl(0.0046, 0.0046, 0.0108, 7);
  along(chainG, chainCurve, 76, (i, p, t) => {
    const tg = chainCurve.getTangentAt(t % 1);
    const outer = i % 2 === 0;
    const mm = mesh(outer ? linkOut : linkIn, outer ? M.steel : M.chrome, { name: outer ? 'chain-outer' : 'chain-roller' });
    mm.quaternion.setFromUnitVectors(FZ, tg);
    if (!outer) mm.rotateZ(Math.PI / 2);
    mm.userData.noOutline = true;
    return mm;
  });
  D.add(chainG);
  // 全周チェーンケース（補強リブ付き）
  const CG = grp('chain-guard');
  bike.add(CG);
  const gx = 0.0750;
  CG.add(mesh(cyl(0.1100, 0.1100, 0.0050, 30), M.guard, { name: 'guard-disc', pos: [gx, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  CG.add(ring([gx, BB[1], BB[2]], [1, 0, 0], 0.1086, 0.0060, M.frameDark, 'guard-rim'));
  CG.add(ring([gx + 0.0016, BB[1], BB[2]], [1, 0, 0], 0.0640, 0.0038, M.frameDark, 'guard-bead'));
  CG.add(mesh(cyl(0.0260, 0.0260, 0.011, 16), M.guard, { name: 'guard-boss', pos: [gx + 0.005, BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.2;
    CG.add(mesh(box(0.0065, 0.056, 0.0080), M.guard, { name: 'guard-rib', pos: [gx + 0.004, BB[1] + Math.cos(a) * 0.086, BB[2] + Math.sin(a) * 0.086], rot: [a, 0, 0] }));
  }
  {
    const plate = [
      new Vector3(gx, BB[1] + ringR * Math.sin(aTop) + 0.017, BB[2] + ringR * Math.cos(aTop)),
      new Vector3(gx, 0.406, -0.21),
      new Vector3(gx, 0.400, -0.42),
      new Vector3(gx, RW + cogR + 0.018, ZR + 0.020),
      new Vector3(gx, RW + cogR + 0.014, ZR - 0.062),
    ];
    const curve = new CatmullRomCurve3(plate, false, 'catmullrom', 0.3);
    const verts = [], idx = [], wHalf = 0.028, N = 22;
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
  CG.add(bolt([gx + 0.004, BB[1] + 0.022, BB[2] - 0.038], 0.0066, M.darkMetal, 'x', 'guard-bolt'));
  decal(CG, { map: TEX.signboard({ text: 'パンク注意', sub: 'AIR 2.8', bg: '#f2ead6', fg: '#b8433a', stripe: '#4a7f6a' }), w: 0.064, h: 0.016, pos: [gx + 0.0046, 0.360, -0.246], rot: [-Math.PI / 2 + 0.12, 0, 0], opacity: 0.9 });
  tubeDecal(CG, { at: [gx + 0.003, 0.398, -0.43], axis: [0, -6e-3, -0.1], side: [1, 0, 0], w: 0.040, h: 0.120, kind: 'chip', color: '#9c937e', opacity: 0.5, seed: seed + 21 });

  /* ---------- 7. フェンダー ---------- */
  const FD = grp('fenders');
  bike.add(FD);
  const rearF = fender({ r: 0.350, w: 0.064, center: 2.14, span: 1.86, mat: M.fender });
  rearF.position.set(0, RW, ZR);
  FD.add(rearF);
  const frontF = fender({ r: 0.346, w: 0.060, center: 1.10, span: 1.72, mat: M.fender });
  frontF.position.set(0, RW, ZF);
  FD.add(frontF);
  for (const s of [-1, 1]) {
    FD.add(seg([s * 0.028, 0.486, ZF + 0.190], [s * 0.054, 0.438, 0.740], 0.0046, M.chrome, 'fender-strut-f'));
    FD.add(bolt([s * 0.054, 0.438, 0.740], 0.0058, M.darkMetal, 'x', 'strut-bolt-f'));
    FD.add(seg([s * 0.030, 0.496, ZR - 0.168], [s * 0.062, RW + 0.024, ZR - 0.046], 0.0046, M.chrome, 'fender-strut-r'));
    FD.add(bolt([s * 0.062, RW + 0.024, ZR - 0.046], 0.0058, M.darkMetal, 'x', 'strut-bolt-r'));
    for (const [phi, wdt, ht, k, col, op, so] of [[2.56, 0.20, 0.050, 'dirt', '#6f6350', 0.6, 23], [2.92, 0.11, 0.040, 'dirt', '#5f5545', 0.55, 25], [1.60, 0.13, 0.030, 'scratch', '#9a9f96', 0.4, 27]]) {
      tubeDecal(FD, { at: [s * 0.015, RW + 0.350 * Math.sin(phi), ZR + 0.350 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
    for (const [phi, wdt, ht, k, col, op, so] of [[0.52, 0.14, 0.032, 'chip', '#c6c2b8', 0.45, 29], [1.34, 0.11, 0.028, 'scratch', '#8e8b84', 0.4, 31]]) {
      tubeDecal(FD, { at: [s * 0.014, RW + 0.346 * Math.sin(phi), ZF + 0.346 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
  }

  /* ---------- 8. 大型リアキャリア + 子供バスケット + ヘルメット ---------- */
  const RC = grp('rear-carrier');
  bike.add(RC);
  const rackY = 0.724, rackZ0 = -0.28, rackZ1 = -0.9;
  for (const s of [-1, 1]) {
    RC.add(seg([s * 0.084, rackY, rackZ0 + 0.02], [s * 0.084, rackY - 0.012, rackZ1], 0.0100, M.steel, 'rack-rail'));
    RC.add(mesh(cyl(0.0102, 0.0102, 0.066, 8), M.steel, { name: 'rack-rail-bend', pos: [s * 0.084, rackY - 0.044, rackZ1 + 0.014], rot: [d2r(-32), 0, 0] }));
    RC.add(bend([[s * 0.084, rackY - 0.004, rackZ0 + 0.032], [s * 0.068, 0.652, -0.222], [s * 0.052, 0.560, -0.212]], 0.0068, M.steel, 'rack-stay', 10));
    RC.add(bend([[s * 0.084, rackY - 0.012, rackZ1 + 0.110], [s * 0.068, 0.624, -0.55], [s * 0.062, RW + 0.030, ZR - 0.042]], 0.0068, M.steel, 'rack-stay-rear', 12));
    RC.add(bolt([s * 0.062, RW + 0.030, ZR - 0.042], 0.0064, M.darkMetal, 'x', 'rack-bolt'));
    RC.add(bolt([s * 0.052, 0.560, -0.212], 0.0064, M.darkMetal, 'x', 'rack-bolt-front'));
  }
  for (let i = 0; i < 7; i++) {
    const z = rackZ0 + 0.026 + (i / 6) * (rackZ1 - rackZ0 - 0.080);
    RC.add(mesh(cyl(0.0064, 0.0064, 0.172, 8), M.steel, { name: 'rack-cross', pos: [0, rackY - 0.006 - i * 0.0010, z], rot: [0, 0, Math.PI / 2] }));
  }
  RC.add(mesh(rbox(0.190, 0.011, 0.052, 0.004, 2), M.steel, { name: 'clip-plate', pos: [0, rackY - 0.010, rackZ0 + 0.036] }));
  const clip = grp('spring-clip', { pos: [0, rackY + 0.018, rackZ0 + 0.078] });
  clip.add(bend([[-0.062, 0, 0], [-0.036, 0.034, 0.006], [0, 0.046, 0.004], [0.036, 0.034, 0.006], [0.062, 0, 0]], 0.0048, M.chrome, 'clip-wire', 16));
  clip.add(bolt([0, 0.004, -0.012], 0.0084, M.darkMetal, 'x', 'clip-pivot'));
  RC.add(clip);
  // 大型バスケット（蓋付き・布張り内側）
  if (basket) {
    const BK = grp('rear-basket');
    RC.add(BK);
    const bw = 0.320, bl = 0.400, bh = 0.190;
    const z0 = rackZ0 + 0.030, z1 = z0 - bl, zMid = (z0 + z1) / 2;
    const yBase = rackY + 0.006;
    const bottom = grp('bk-floor', { pos: [0, yBase, zMid] });
    grill(bottom, { w: bw - 0.024, h: bl - 0.028, nx: 10, ny: 12, bar: 0.0056, mat: M.resin, rot: [Math.PI / 2, 0, 0] });
    BK.add(bottom);
    const wall = (name, w, pos, rotY) => {
      const gg = grp(name, { pos, rot: [0, rotY, 0] });
      grill(gg, { w, h: bh, nx: Math.max(6, Math.round(w * 22)), ny: 8, bar: 0.0056, mat: M.resin, rot: [d2r(name === 'bk-front' ? -5 : name === 'bk-back' ? 5 : 0), 0, 0] });
      gg.add(mesh(box(w + 0.012, 0.014, 0.012), M.resin, { name: name + '-toprail', pos: [0, bh / 2 + 0.006, 0] }));
      BK.add(gg);
    };
    wall('bk-side-L', bl + 0.020, [-bw / 2 - 0.006, yBase + bh / 2, zMid], Math.PI / 2);
    wall('bk-side-R', bl + 0.020, [bw / 2 + 0.006, yBase + bh / 2, zMid], Math.PI / 2);
    wall('bk-front', bw + 0.020, [0, yBase + bh / 2, z1 - 0.012], 0);
    wall('bk-back', bw + 0.020, [0, yBase + bh / 2, z0 + 0.012], 0);
    // 内側の布（荷物隠し・裾が外に垂れる）
    const lin = grp('bk-liner');
    for (const s of [-1, 1]) {
      lin.add(mesh(rbox(0.008, bh - 0.048, bl - 0.030, 0.004, 2), M.basketCloth, { name: 'liner-side', pos: [s * (bw / 2 - 0.016), yBase + (bh - 0.048) / 2 + 0.014, zMid] }));
      lin.add(mesh(rbox(0.014, 0.060, bl - 0.020, 0.005, 2), M.basketCloth, { name: 'liner-peek', pos: [s * (bw / 2 + 0.002), yBase + bh - 0.014, zMid - 0.02], rot: [0, 0, s * d2r(6)] }));
    }
    lin.add(mesh(rbox(bw - 0.026, bh - 0.040, 0.008, 0.004, 2), M.basketCloth, { name: 'liner-back', pos: [0, yBase + (bh - 0.040) / 2 + 0.012, z0 - 0.016] }));
    lin.add(mesh(rbox(bw - 0.010, 0.010, bl - 0.010, 0.004, 2), M.basketCloth, { name: 'liner-floor', pos: [0, yBase + 0.010, zMid] }));
    BK.add(lin);
    // 蓋（開きかけ・蝶番・ゴム紐）
    const lid = grp('bk-lid', { pos: [0, yBase + bh + 0.020, zMid], rot: [d2r(-24), 0, 0] });
    lid.add(mesh(rbox(bw + 0.014, 0.010, bl + 0.014, 0.005, 2), M.resin, { name: 'lid-plate' }));
    lid.add(mesh(rbox(bw - 0.060, 0.006, bl - 0.070, 0.003, 2), M.basketCloth, { name: 'lid-cloth', pos: [0, -8e-3, 0] }));
    for (const s of [-1, 1]) lid.add(mesh(cyl(0.0060, 0.0060, 0.024, 8), M.steel, { name: 'lid-hinge', pos: [s * (bw / 2 - 0.020), 0.002, (bl + 0.014) / 2], rot: [0, 0, Math.PI / 2] }));
    BK.add(lid);
    for (const s of [-1, 1]) {
      BK.add(mesh(tor(0.0125, 0.0022, 4, 10), M.steel, { name: 'lid-hook', pos: [s * (bw / 2 + 0.004), yBase + bh + 0.006, zMid + bl * 0.42], rot: [Math.PI / 2, 0, 0] }));
      BK.add(mesh(tubeOf(catenary([s * (bw / 2 + 0.004), yBase + bh + 0.006, zMid + bl * 0.42], [s * (bw / 2 + 0.004), yBase + bh * 0.42, zMid + bl * 0.50], 0.030, 8), 0.0022, 12, 5), M.wire, { name: 'lid-cord' }));
    }
    // 中身（買い物・抱っこ紐・鞄）＋ 掛けたベビーヘルメット
    const st = grp('bk-stuff');
    st.add(mesh(rbox(0.180, 0.130, 0.200, 0.022, 3), M.bag, { name: 'diaper-bag', pos: [-0.04, yBase + 0.080, zMid + 0.050], rot: [0, d2r(8), 0] }));
    st.add(mesh(rbox(0.150, 0.070, 0.110, 0.016, 2), M.paper, { name: 'grocery-box', pos: [0.076, yBase + 0.052, zMid - 0.090], rot: [d2r(-4), d2r(-16), 0] }));
    st.add(mesh(sph(0.062, 14, 10), M.helmetPad, { name: 'bundled-cloth', pos: [0.010, yBase + 0.100, zMid - 0.020], scale: [1.2, 0.7, 1.0] }));
    BK.add(st);
    const hel = grp('helmet', { pos: [-bw / 2 - 0.030, yBase + bh - 0.020, zMid + 0.100], rot: [d2r(8), 0, d2r(24)] });
    hel.add(mesh(sph(0.0620, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), M.helmet, { name: 'helmet-shell' }));
    hel.add(mesh(tor(0.0590, 0.0060, 5, 16), M.helmet, { name: 'helmet-rim', pos: [0, -0.022, 0], rot: [Math.PI / 2, 0, 0] }));
    hel.add(mesh(sph(0.0520, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), M.helmetPad, { name: 'helmet-liner' }));
    hel.add(mesh(rbox(0.030, 0.010, 0.020, 0.004, 2), M.red, { name: 'helmet-peak', pos: [0, -0.012, 0.058] }));
    hel.add(mesh(tubeOf(catenary([-0.04, -0.026, 0.030], [-0.052, -0.1, 0.010], 0.020, 8), 0.0022, 10, 5), M.harness, { name: 'helmet-strap-1' }));
    hel.add(mesh(tubeOf(catenary([0.040, -0.026, 0.030], [0.052, -0.1, 0.010], 0.020, 8), 0.0022, 10, 5), M.harness, { name: 'helmet-strap-2' }));
    hel.add(mesh(box(0.014, 0.010, 0.006), M.darkMetal, { name: 'helmet-hook', pos: [0, 0.010, -0.058] }));
    BK.add(hel);
    weather(BK, { w: 0.18, h: 0.10, pos: [bw / 2 + 0.014, yBase + 0.06, zMid - 0.06], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#6f6248', opacity: 0.45, seed: seed + 33, spread: 0.016 });
  }
  // 防犯登録札（フレーム立て・日焼け少なめ）
  const tag = grp('crime-tag', { pos: [0, 0.800, -0.196], rot: [d2r(12), d2r(4), 0] });
  tag.add(mesh(rbox(0.064, 0.042, 0.0035, 0.003, 2), M.paper, { name: 'tag-plate' }));
  decal(tag, { map: TEX.signboard({ text: '防犯登録', sub: '1-0426 春日', bg: '#f6f1e4', fg: '#c2413a' }), w: 0.058, h: 0.038, pos: [0, 0, 0.003], opacity: 0.95 });
  tag.add(mesh(tor(0.0042, 0.0013, 4, 8), M.chrome, { name: 'tag-wire', pos: [0, 0.021, 0.004] }));
  bike.add(tag);

  /* ---------- 9. 尾灯・反射板 ---------- */
  const L = grp('lights');
  bike.add(L);
  const tl = grp('tail-lamp', { pos: [0, 0.536, ZR - 0.340], rot: [d2r(16), 0, 0] });
  tl.add(mesh(rbox(0.046, 0.038, 0.022, 0.006, 2), M.red, { name: 'tail-body' }));
  tl.add(mesh(rbox(0.036, 0.026, 0.004, 0.004, 2), M.redGlow, { name: 'tail-lens', pos: [0, 0, -0.012] }));
  tl.add(mesh(box(0.012, 0.026, 0.016), M.darkMetal, { name: 'tail-tab', pos: [0, 0.012, 0.016] }));
  tl.add(bolt([0, 0.024, 0.018], 0.0056, M.chrome, 'y', 'tail-screw'));
  L.add(tl);
  const rref = grp('fender-reflector', { pos: [0, 0.352, ZR - 0.352], rot: [d2r(-26), 0, 0] });
  rref.add(mesh(rbox(0.058, 0.040, 0.005, 0.005, 2), M.red, { name: 'rear-reflector' }));
  rref.add(mesh(rbox(0.048, 0.030, 0.0025, 0.004, 2), M.redGlow, { name: 'rear-reflector-face', pos: [0, 0, -3e-3] }));
  L.add(rref);
  L.add(mesh(rbox(0.032, 0.014, 0.004, 0.003, 2), M.red, { name: 'saddle-reflector', pos: [0, 0.916, -0.392], rot: [d2r(-14), 0, 0] }));

  /* ---------- 10. 両足（センター）スタンド —— 重厚 ---------- */
  const ST = grp('stand');
  bike.add(ST);
  const pivotY = 0.206, pivotZ = ZR + 0.030;
  for (const s of [-1, 1]) {
    const fx = s * 0.148, fz = pivotZ + 0.020;
    const fy = -fx * Math.tan(d2r(lean));
    ST.add(seg([s * 0.048, pivotY, pivotZ], [fx, fy + 0.018, fz], 0.0108, M.steel, 'center-leg'));
    ST.add(mesh(cyl(0.0108, 0.0108, 0.046, 8), M.steel, { name: 'center-knee', pos: [fx * 0.62, pivotY - 0.052, pivotZ + 0.006], rot: [0, d2r(s * 22), d2r(90)] }));
    ST.add(mesh(rbox(0.056, 0.012, 0.044, 0.005, 2), M.darkMetal, { name: 'stand-foot-pad', pos: [fx, fy + 0.006, fz] }));
    ST.add(bolt([fx, fy + 0.018, fz + 0.016], 0.0062, M.darkMetal, 'z', 'foot-rivet'));
  }
  ST.add(mesh(cyl(0.0120, 0.0120, 0.112, 10), M.darkMetal, { name: 'center-axle', pos: [0, pivotY, pivotZ], rot: [0, 0, Math.PI / 2] }));
  ST.add(mesh(rbox(0.130, 0.026, 0.036, 0.006, 2), M.frameDark, { name: 'center-bracket', pos: [0, pivotY, pivotZ - 0.018] }));
  {
    const sp = mesh(coil(0.0155, 0.056, 6, 10, 0.0034), M.rusty, { name: 'center-spring', pos: [0.062, pivotY - 0.024, pivotZ - 0.028], rot: [d2r(84), 0, d2r(-18)] });
    sp.userData.noOutline = true;
    ST.add(sp);
  }
  ST.add(mesh(tubeOf(catenary([0.030, pivotY + 0.010, pivotZ - 0.030], [0.100, 0.300, ZR - 0.010], 0.024, 10), 0.0026, 14, 5), M.wire, { name: 'stand-link' }));
  tubeDecal(ST, { at: [-0.104, 0.112, pivotZ + 0.014], axis: [0, -0.094, -0.012], side: [-1, 0, 0], w: 0.026, h: 0.130, kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 35 });

  /* ---------- 11. ブレーキ（前後キャリパ・ワイヤー・ロッド） ---------- */
  const BR = grp('brakes');
  bike.add(BR);
  for (const c of [{ y: 0.560, z: ZF + 0.296 }, { y: 0.566, z: ZR - 0.056 }]) {
    const cal = grp('caliper', { pos: [0, c.y, c.z] });
    cal.add(mesh(rbox(0.034, 0.030, 0.030, 0.006, 2), M.white, { name: 'caliper-body' }));
    for (const s of [-1, 1]) {
      cal.add(seg([s * 0.013, -7e-3, 0], [s * 0.032, -0.13, 0.011], 0.0060, M.steel, 'caliper-arm'));
      cal.add(mesh(rbox(0.015, 0.022, 0.008, 0.003, 2), M.rubberCap, { name: 'brake-pad', pos: [s * 0.034, -0.138, 0.015] }));
      cal.add(bolt([s * 0.032, -0.13, 0.022], 0.0052, M.darkMetal, 'z', 'pad-pin'));
    }
    cal.add(bolt([0, 0.015, 0], 0.0066, M.chrome, 'y', 'caliper-bolt'));
    BR.add(cal);
  }
  for (const s of [-1, 1]) {
    const ay = s < 0 ? 0.462 : 0.530;
    BR.add(mesh(tubeOf(catenary([s * 0.248, 0.874, 0.098], [s * 0.032, ay, ZF + 0.296], 0.036 + range(rnd, 0, 0.014), 18), 0.0028, 22, 6), M.wire, { name: 'brake-cable' }));
    BR.add(bolt([s * 0.032, ay + 0.007, ZF + 0.298], 0.0060, M.darkMetal, 'z', 'cable-ferrel'));
    BR.add(mesh(tubeOf(catenary([s * 0.244, 0.870, 0.108], [s * 0.128, 0.812, 0.228], 0.020, 8), 0.0048, 10, 6), M.rubberCap, { name: 'cable-casing' }));
  }
  BR.add(bend([[0, 0.566, ZR - 0.056], [-0.044, 0.528, ZR - 0.090], [-0.066, 0.440, ZR - 0.072], [-0.066, 0.404, ZR - 0.030]], 0.0040, M.steel, 'roller-brake-rod', 14));

  /* ---------- 12. 車輪（太タイヤ・ローラーブレーキ・多スポーク） ---------- */
  const rear = wheel({ R: 0.3020, tireT: 0.0240, rimR: 0.2760, rimW: 0.028, spokes: 24, M, phase: 0.15, drum: true, squash: 0.980 });
  rear.position.set(0, RW, ZR);
  bike.add(rear);
  const front = wheel({ R: 0.3020, tireT: 0.0240, rimR: 0.2760, rimW: 0.028, spokes: 24, M, phase: 0.29, squash: 0.992 });
  front.position.set(0, RW, ZF);
  bike.add(front);

  shadowBlob(g, { r: 0.28, pos: [0, 0.001, ZR], opacity: 0.24 });
  shadowBlob(g, { r: 0.28, pos: [0, 0.001, ZF], opacity: 0.20 });
  shadowBlob(g, { r: 0.14, pos: [0, 0.001, ZR + 0.05], opacity: 0.18 });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
