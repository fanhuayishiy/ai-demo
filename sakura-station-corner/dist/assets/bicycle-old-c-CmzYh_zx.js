import { P as PAL, g as grp, s as shade, M as MAT, D as DoubleSide, m as mesh, r as rbox, c as cyl, h as decal, T as TEX, t as tor, a as sph, b as box, w as weather, e as radial, V as Vector3, C as CatmullRomCurve3, f as along, B as BufferGeometry, F as Float32BufferAttribute, j as d2r, p as shadowBlob, q as finish, v as Mesh, x as PlaneGeometry, u as Matrix4, k as tubeOf, o as lathe, y as TorusGeometry } from './index-BvEZsPNz.js';

//  assets/bike/bicycle-old-c.js
//  通勤自転車 C —— 旧型・年式古。錆びが激しく塗装は退色、チェーン垂れ、前カゴ無し、
//   一速、ハンドル曲がり、サドル割れ（ガムテープ補強）、タイヤ空気抜け、
//   後輪に泥跳ね、防犯登録札が日焼け、スタンドバネ紛失（ゴム輪で仮止め）。
//  単位：メートル。原点 = 両輪接地面中心。+Y 上。车头 +Z。lean>0 = 左倒し。

const meta = {
  id: 'bicycle-old-c',
  real: [1.74, 1.03, 0.60],
  origin: 'ground-center',
};

/* ================================ 寸法 ================================ */
const RW = 0.328;                        // 27インチ旧型（ややおおきめ）
const ZR = -0.552, ZF = 0.552;
const BB = [0, 0.268, -0.01];
const SC = [0, 0.752, -0.182];
const HTT = [0, 0.748, 0.252];
const HTB = [0, 0.552, 0.306];
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
  arc.add(mesh(lathe([[r, -w / 2], [r, -w * 0.2], [r, w * 0.2], [r, w / 2]], 28, center - span / 2, span),
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
    MAT.decal({ map: TEX.wear({ kind, color, seed, density: 1.35 }), opacity, side: DoubleSide, order: 1 }));
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
/* 車輪：ローカル +Z = 車軸。bent = リム振れ（旧車のゆがみ） */
function wheel(o) {
  const { R, tireT, rimR, rimW, spokes, M, phase = 0, squash = 1, bent = 0, rusty = 1 } = o;
  const w = grp('wheel');
  w.rotation.y = Math.PI / 2;
  const Ro = R + tireT;
  w.add(tireMesh(R, tireT, squash, M.tire, 'tire'));
  if (squash < 0.99) {                       // 空気抜け：接地が平らに広がる
    for (const s of [-1, 1]) w.add(mesh(sph(0.036, 12, 9), M.tire, { name: 'flat-spot', pos: [0, -Ro * 0.945, s * rimW * 0.42], scale: [1, 0.34, 0.86] }));
    w.add(mesh(rbox(0.052, 0.010, 0.150, 0.004, 2), M.tire, { name: 'flat-tread', pos: [0, -Ro * 0.972, 0] }));
    tubeDecal(w, { at: [0, -Ro * 0.88, 0], axis: [1, 0, 0], side: [0, -1, 0], w: 0.030, h: 0.150, kind: 'dirt', color: '#5f5344', opacity: 0.6, seed: 43 });
  }
  for (const s of [-1, 1]) w.add(mesh(tor(R - tireT * 0.35, 0.0024, 4, 40), M.tireSide, { name: 'sidewall-band', pos: [0, 0, s * tireT * 0.72] }));
  w.add(mesh(cyl(rimR, rimR, rimW, 28, true), M.rim, { name: 'rim-barrel', rot: [Math.PI / 2, 0, 0] }));
  if (bent) {
    // リム振れ：小さな段を 3 箇所
    for (let k = 0; k < 3; k++) {
      const a = k * 2.09 + 0.4;
      w.add(mesh(rbox(rimW * 0.95, 0.010, 0.036, 0.002, 2), M.rim, { name: 'rim-dent', pos: [Math.cos(a) * (rimR + bent), Math.sin(a) * (rimR + bent), 0], rot: [0, 0, a] }));
    }
  }
  w.add(mesh(cyl(rimR - 0.007, rimR - 0.007, rimW * 0.86, 28, true), M.rimDark, { name: 'rim-bed', rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) w.add(mesh(tor(rimR + 0.0018, 0.0054, 5, 28), M.rim, { name: 'rim-flange', pos: [0, 0, s * rimW * 0.5] }));
  const hub = grp('hub');
  hub.add(mesh(cyl(0.0200, 0.0200, 0.056, 12), M.hub, { name: 'hub-body', rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0248, 0.0195, 0.017, 12), M.hub, { name: 'hub-flange-L', pos: [0, 0, -0.028], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0195, 0.0248, 0.017, 12), M.hub, { name: 'hub-flange-R', pos: [0, 0, 0.028], rot: [Math.PI / 2, 0, 0] }));
  hub.add(mesh(cyl(0.0070, 0.0070, 0.136, 8), M.rustyMetal, { name: 'axle', rot: [Math.PI / 2, 0, 0] }));
  hub.add(bolt([0, 0, -0.07], 0.0122, M.rustyMetal, 'z', 'axle-nut-L'));
  hub.add(bolt([0, 0, 0.072], 0.0122, M.rustyMetal, 'z', 'axle-nut-R'));
  w.add(hub);
  const planeG = polar('z');
  const rIn = 0.024, rOut = rimR - 0.0085, len = rOut - rIn;
  cyl(0.00230, 0.00195, len, 5);
  radial(planeG, spokes, 0, (i, a) => {
    const flip = i % 2 === 0 ? 1 : -1;
    const g = grp('spoke-arm');
    g.rotation.y = a + phase;
    const jitter = bent ? 1 + Math.sin(a * 3) * 0.006 : 1;
    const sp = mesh(cyl(0.0023, 0.00195, len * jitter, 5), M.spoke, { name: 'spoke', pos: [rIn + len * jitter / 2, flip * 0.0045, 0], rot: [0, 0, Math.PI / 2] });
    const ni = mesh(cyl(0.0032, 0.0032, 0.010, 6), M.rustyMetal, { name: 'nipple', pos: [rOut - 0.003, flip * 0.0045, 0], rot: [0, 0, Math.PI / 2] });
    sp.userData.noOutline = ni.userData.noOutline = true;
    g.add(sp, ni);
    return g;
  });
  w.add(planeG);
  const vg = grp('valve'); vg.rotation.z = 0.9 + phase;
  vg.add(mesh(cyl(0.0034, 0.0034, 0.026, 6), M.rustyMetal, { name: 'valve-body', pos: [rimR - 0.010, 0, 0], rot: [0, 0, Math.PI / 2] }));
  if (rusty < 1) vg.add(mesh(cyl(0.0055, 0.0055, 0.011, 8), M.rubberCap, { name: 'valve-cap', pos: [rimR + 0.011, 0, 0], rot: [0, 0, Math.PI / 2] }));
  w.add(vg);
  if (rusty < 1) {                                  // 反射板は片側のみ（片方は欠落）
    const rg = grp('reflector-arm'); rg.rotation.z = -1.05 + phase;
    rg.add(mesh(rbox(0.012, 0.048, 0.006, 0.003, 2), M.reflector, { name: 'spoke-reflector', pos: [(rIn + rOut) * 0.58, 0, 0.006] }));
    rg.add(mesh(box(0.011, 0.009, 0.013), M.rustyMetal, { name: 'reflector-clip', pos: [(rIn + rOut) * 0.58, 0, -2e-3] }));
    w.add(rg);
  }
  return w;
}

/* ================================ build ================================ */
function build(options = {}) {
  const seed = options.seed ?? 44;
  const frame = options.frame ?? PAL.bikeFrameC;
  const lean = options.lean ?? 0;
  const g = grp('bicycle-old-c');
  const tilt = grp('lean', { rot: [0, 0, d2r(lean)] });
  const bike = grp('bike');
  tilt.add(bike);
  g.add(tilt);

  const faded = shade(frame, 0.92);
  const M = {
    tire: MAT.rubber('#3b3834', { steps: 3, shadowAmt: 0.97, worn: 0.8 }),
    tireSide: MAT.rubber('#57514a', { spec: 0.1 }),
    rubberCap: MAT.rubber('#2c2926'),
    rim: MAT.metal('#a49b90', { worn: 0.85, repeat: 2, side: DoubleSide }),
    rimDark: MAT.metal('#7d7469', { worn: 0.9, side: DoubleSide }),
    hub: MAT.metal('#98908a', { worn: 0.85, repeat: 1.6 }),
    spoke: MAT.metal('#8e8579', { worn: 0.9 }),
    chrome: MAT.metal('#c8c4bc', { worn: 0.8, spec: 0.5 }),
    rustyMetal: MAT.metalPaint(PAL.rust, { worn: 1.0, repeat: 1.2, spec: 0.14, shadowAmt: 0.95 }),
    steel: MAT.metal('#8d8a84', { worn: 0.8, repeat: 2 }),
    darkMetal: MAT.darkIron({ worn: 0.85 }),
    wire: MAT.metalPaint('#575049', { worn: 0.9, spec: 0.12 }),
    frame: MAT.metalPaint(faded, { worn: 0.92, repeat: 1.6, shadowAmt: 0.9 }),
    frameDark: MAT.metalPaint(shade(faded, 0.7), { worn: 0.95, repeat: 1.4 }),
    fender: MAT.hardPlastic(shade(faded, 0.6), { worn: 0.95, repeat: 2, side: DoubleSide }),
    guard: MAT.hardPlastic('#b9b3a6', { worn: 0.9 }),
    saddle: MAT.plastic('#6b4f42', { spec: 0.16, shadowAmt: 0.94 }),
    tape: MAT.paper({ color: '#cbbfa4' }),
    grip: MAT.rubber('#3a332e', { steps: 2, worn: 0.8 }),
    rubber: MAT.rubber('#4a423a'),
    red: MAT.hardPlastic('#9c4640', { worn: 0.85 }),
    amber: MAT.hardPlastic('#b98a3a', { worn: 0.8 }),
    reflector: MAT.hardPlastic('#a8443c', { worn: 0.7, side: DoubleSide }),
    redGlow: MAT.ledOn('#b8443c'),
    bulb: MAT.bulb({ color: '#f2e6cd' }),
    glass: MAT.glassLite({ color: '#dfe6e2', opacity: 0.34 }),
    paper: MAT.paper({ color: '#e8dcc0' }),
    wood: MAT.wood({ light: '#a89274', dark: '#7a6448' }),
  };

  /* ---------- 1. 旧型ダイヤモンドフレーム（細身・退色・錆） ---------- */
  const F = grp('frame');
  bike.add(F);
  F.add(seg(BB, SC, 0.0180, M.frame, 'seat-tube'));
  F.add(seg(HTB, BB, 0.0165, M.frame, 'down-tube'));
  F.add(seg(SC, HTT, 0.0158, M.frame, 'top-tube'));            // 水平気味な旧型トップチューブ
  F.add(seg(HTB, HTT, 0.0215, M.frame, 'head-tube'));
  F.add(seg(SC, [0, 0.718, -0.224], 0.0128, M.frame, 'seat-tube-extension'));
  for (const s of [-1, 1]) {
    F.add(seg([s * 0.045, BB[1], BB[2] + 0.004], [s * 0.056, RW, ZR], 0.0105, M.frame, 'chain-stay'));
    F.add(seg([s * 0.018, SC[1] - 0.048, SC[2] - 0.004], [s * 0.056, RW + 0.012, ZR + 0.026], 0.0088, M.frame, 'seat-stay'));
    F.add(mesh(rbox(0.018, 0.036, 0.026, 0.005, 2), M.frameDark, { name: 'dropout', pos: [s * 0.056, RW - 0.002, ZR] }));
  }
  F.add(mesh(cyl(0.0260, 0.0260, 0.062, 12), M.frameDark, { name: 'bb-shell', pos: [BB[0], BB[1], BB[2]], rot: [0, 0, Math.PI / 2] }));
  // 旧型のヘッドバッジ（溶接リベット 2 個）
  F.add(bolt([0.0215, 0.664, 0.286], 0.0044, M.rustyMetal, 'x', 'badge-rivet-1'));
  F.add(bolt([-0.0215, 0.664, 0.286], 0.0044, M.rustyMetal, 'x', 'badge-rivet-2'));
  F.add(mesh(rbox(0.030, 0.016, 0.008, 0.003, 2), M.rustyMetal, { name: 'head-badge', pos: [0, 0.664, 0.292], rot: [d2r(-14), 0, 0] }));
  // 溶接
  F.add(ring([0, SC[1] - 0.016, SC[2] + 0.014], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0190, 0.0030, M.frameDark, 'weld-seat'));
  F.add(ring([0, BB[1] + 0.030, BB[2] - 0.012], [0, SC[1] - BB[1], SC[2] - BB[2]], 0.0185, 0.0028, M.frameDark, 'weld-bb'));
  F.add(ring([0, HTT[1] - 0.024, HTT[2] - 0.002], [0, HTT[1] - HTB[1], HTT[2] - HTB[2]], 0.0225, 0.0030, M.frameDark, 'weld-head'));
  // 錆・退色・掉漆（いたる所）
  {
    const dtAx = [0, HTB[1] - BB[1], HTB[2] - BB[2]];
    tubeDecal(F, { at: [0.0165, 0.400, 0.140], axis: dtAx, side: [1, 0, 0], w: 0.030, h: 0.170, kind: 'rust', color: PAL.rust, opacity: 0.72, seed: seed + 3 });
    tubeDecal(F, { at: [-0.0165, 0.450, 0.200], axis: dtAx, side: [-1, 0, 0], w: 0.028, h: 0.130, kind: 'rust', color: '#6b3f24', opacity: 0.66, seed: seed + 5 });
    const stAx = [0, SC[1] - BB[1], SC[2] - BB[2]];
    tubeDecal(F, { at: [-0.018, 0.640, -0.14], axis: stAx, side: [-1, 0, 0], w: 0.028, h: 0.200, kind: 'rust', color: PAL.rust, opacity: 0.68, seed: seed + 7 });
    tubeDecal(F, { at: [0.0180, 0.560, -0.11], axis: stAx, side: [1, 0, 0], w: 0.026, h: 0.100, kind: 'chip', color: '#a89f92', opacity: 0.6, seed: seed + 9 });
    const ttAx = [0, HTT[1] - SC[1], HTT[2] - SC[2]];
    tubeDecal(F, { at: [0, 0.750, 0.040], axis: ttAx, side: [0, 1, 0], w: 0.024, h: 0.220, kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 13 });
    const csAx = [0, RW - BB[1], ZR - BB[2]];
    tubeDecal(F, { at: [0.048, 0.292, -0.2], axis: csAx, side: [0, 1, 0], w: 0.020, h: 0.200, kind: 'dirt', color: '#5f5344', opacity: 0.6, seed: seed + 15 });
    tubeDecal(F, { at: [-0.048, 0.286, -0.32], axis: csAx, side: [0, -1, 0], w: 0.020, h: 0.180, kind: 'dirt', color: '#5f5344', opacity: 0.55, seed: seed + 17 });
  }
  tubeDecal(F, { at: [0.0165, 0.618, 0.233], axis: [0, HTB[1] - BB[1], HTB[2] - BB[2]], side: [1, 0, 0], w: 0.024, h: 0.086, kind: 'chip', color: shade(faded, 1.25), opacity: 0.55, seed: seed + 65 });
  decal(F, { map: TEX.signboard({ text: '春日商会', sub: 'SINCE 1968', bg: shade(faded, 0.8), fg: '#e6dcc4' }), w: 0.078, h: 0.020, pos: [0.0185, 0.618, 0.233], rot: [0, Math.PI / 2, d2r(-62)], opacity: 0.55 });

  /* ---------- 2. ヘッドセット・フォーク（曲がったフォーク） ---------- */
  const H = grp('headset');
  bike.add(H);
  const hAngle = Math.atan2(HTT[2] - HTB[2], HTT[1] - HTB[1]);
  H.add(mesh(cyl(0.0240, 0.0240, 0.009, 12), M.rustyMetal, { name: 'upper-race', pos: [0, HTT[1] + 0.005, HTT[2] - 0.001], rot: [hAngle, 0, 0] }));
  H.add(mesh(cyl(0.0225, 0.0225, 0.011, 12), M.rustyMetal, { name: 'lower-race', pos: [0, HTB[1] - 0.009, HTB[2] + 0.002], rot: [hAngle, 0, 0] }));
  H.add(seg([0, HTB[1] - 0.030, HTB[2] + 0.004], [0, HTT[1] + 0.100, HTT[2] - 0.028], 0.0128, M.chrome, 'steerer'));
  const crown = [0, 0.516, 0.324];
  H.add(bend([[0, HTB[1] - 0.004, HTB[2] + 0.002], crown], 0.0205, M.frame, 'fork-crown', 6));
  // 左右非対称（右刃が前に曲がっている = 転び傷）
  H.add(bend([[0.022, 0.516, 0.326], [0.040, 0.452, 0.404], [0.050, 0.386, 0.486], [0.056, RW + 0.004, ZF]], 0.0128, M.frame, 'fork-blade-R', 22));
  H.add(bend([[-0.022, 0.516, 0.326], [-0.04, 0.452, 0.418], [-0.05, 0.386, 0.500], [-0.056, RW + 0.004, ZF - 0.014]], 0.0128, M.frame, 'fork-blade-L', 22));
  H.add(mesh(rbox(0.018, 0.032, 0.026, 0.005, 2), M.frameDark, { name: 'fork-dropout-R', pos: [0.056, RW - 0.002, ZF] }));
  H.add(mesh(rbox(0.018, 0.032, 0.026, 0.005, 2), M.frameDark, { name: 'fork-dropout-L', pos: [-0.056, RW - 0.002, ZF - 0.014] }));
  tubeDecal(H, { at: [0.0530, 0.430, 0.400], axis: [0, -0.066, 0.082], side: [1, 0, 0], w: 0.026, h: 0.150, kind: 'rust', color: PAL.rust, opacity: 0.7, seed: seed + 19 });

  /* ---------- 3. ハンドル（曲がった旧型バー・片下げ） ---------- */
  const HB = grp('handlebar');
  bike.add(HB);
  const barTilt = d2r(6);                              // バー全体が右へ回っている
  HB.add(mesh(cyl(0.0195, 0.0170, 0.056, 12), M.frameDark, { name: 'quill', pos: [0, HTT[1] + 0.066, HTT[2] - 0.014], rot: [hAngle * 0.6, 0, 0] }));
  HB.add(mesh(rbox(0.034, 0.024, 0.040, 0.006, 2), M.frameDark, { name: 'stem-head', pos: [0, 0.836, 0.228], rot: [0, barTilt * 0.5, 0] }));
  HB.add(bolt([0, 0.856, 0.228], 0.0070, M.rustyMetal, 'y', 'stem-bolt'));
  HB.add(mesh(cyl(0.0162, 0.0162, 0.036, 12), M.rustyMetal, { name: 'bar-clamp', pos: [0, 0.852, 0.224], rot: [0, 0, Math.PI / 2] }));
  const barBase = [
    [0, 0.854, 0.224], [0.078, 0.856, 0.212], [0.142, 0.864, 0.176],
    [0.190, 0.872, 0.132], [0.220, 0.876, 0.084],
  ];
  // 右：上に巻き上がる旧型バー、左：下に曲がって戻っている
  const right = barBase.map((p) => [p[0], p[1] + p[0] * 0.10, p[2]]);
  const left = barBase.map((p) => [-p[0], p[1] - p[0] * 0.13, p[2] - p[0] * 0.06]);
  HB.add(bend(right, 0.0110, M.chrome, 'handlebar-R', 22));
  HB.add(bend(left, 0.0110, M.chrome, 'handlebar-L', 22));
  const gripPos = [[right[right.length - 1], 1], [left[left.length - 1], -1]];
  for (const [tip, s] of gripPos) {
    HB.add(mesh(cyl(0.0160, 0.0142, 0.098, 12), M.grip, { name: 'grip', pos: [tip[0] + s * 0.048, tip[1] - 0.002, tip[2] - 0.030], rot: [d2r(-10), 0, d2r(84)] }));
    for (let k = 0; k < 4; k++) HB.add(mesh(tor(0.0158, 0.0018, 4, 12), M.grip, { name: 'grip-ring', pos: [tip[0] + s * (0.020 + k * 0.019), tip[1] - 0.002 - k * 0.0006, tip[2] - 0.012 - k * 0.019], rot: [0, 0, Math.PI / 2] }));
    HB.add(bolt([tip[0] + s * 0.100, tip[1] - 0.004, tip[2] - 0.048], 0.0140, M.rustyMetal, 'x', 'bar-end'));
    const lev = grp('lever', { pos: [tip[0] - s * 0.006, tip[1] + 0.004, tip[2] + 0.014], rot: [d2r(18), 0, d2r(90 - s * 12)] });
    lev.add(mesh(rbox(0.014, 0.012, 0.032, 0.004, 2), M.rustyMetal, { name: 'lever-root' }));
    lev.add(seg([0.010, 0, 0], [0.010, 0, -0.084], 0.0050, M.rustyMetal, 'lever-blade'));
    lev.add(bend([[0.010, 0, -0.084], [0.012, 0, -0.108], [0.017, 0.004, -0.118]], 0.0050, M.rustyMetal, 'lever-tip', 6));
    HB.add(lev);
  }
  // 旧型の大きなベル（鉄・錆）
  const bell = grp('bell', { pos: [-0.15, 0.856, 0.170], rot: [0, d2r(-14), 0] });
  bell.add(mesh(sph(0.0275, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M.rustyMetal, { name: 'bell-dome' }));
  bell.add(mesh(cyl(0.0280, 0.0260, 0.007, 14), M.darkMetal, { name: 'bell-rim' }));
  bell.add(mesh(cyl(0.0072, 0.0072, 0.016, 8), M.darkMetal, { name: 'bell-post', pos: [0, -0.01, 0] }));
  bell.add(mesh(box(0.007, 0.004, 0.026), M.rustyMetal, { name: 'bell-striker', pos: [0.014, 0.002, 0.012], rot: [0, d2r(18), 0] }));
  HB.add(bell);
  // ミラーは無い（ステーだけ・折れた跡）
  HB.add(mesh(cyl(0.0062, 0.0062, 0.026, 8), M.rustyMetal, { name: 'mirror-stub', pos: [0.232, 0.900, 0.060], rot: [0, 0, d2r(38)] }));
  weather(HB, { w: 0.06, h: 0.04, pos: [0.268, 0.876, -0.028], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#6d655c', opacity: 0.6, seed: seed + 31, spread: 0.010 });

  /* ---------- 4. サドル（割れ・ガムテープ補強） ---------- */
  const S = grp('saddle-assembly');
  bike.add(S);
  const postTop = [SC[0], 0.926, SC[2] - 0.052];
  S.add(seg([SC[0], SC[1] - 0.02, SC[2] + 0.006], postTop, 0.0128, M.chrome, 'seatpost'));
  S.add(mesh(rbox(0.038, 0.032, 0.044, 0.007, 2), M.frameDark, { name: 'seat-clamp', pos: [SC[0], SC[1] + 0.012, SC[2]] }));
  S.add(bolt([0.025, SC[1] + 0.012, SC[2] - 0.004], 0.0064, M.rustyMetal, 'x', 'clamp-bolt'));
  const sad = grp('saddle', { pos: [0, 0.952, -0.232], rot: [d2r(-5), 0, d2r(2)] });
  sad.add(mesh(rbox(0.146, 0.030, 0.248, 0.028, 3), M.saddle, { name: 'saddle-shell' }));
  sad.add(mesh(rbox(0.112, 0.016, 0.176, 0.022, 3), M.saddle, { name: 'saddle-crown', pos: [0, 0.014, -6e-3] }));
  sad.add(mesh(rbox(0.050, 0.020, 0.064, 0.012, 2), M.saddle, { name: 'saddle-nose', pos: [0, -2e-3, 0.140] }));
  // 割れ目（黒い切れ目 + ガムテープ 2 枚）
  sad.add(mesh(box(0.004, 0.030, 0.112), M.rubber, { name: 'saddle-crack', pos: [0.018, 0.008, -0.03] }));
  sad.add(mesh(box(0.072, 0.0025, 0.026), M.rubber, { name: 'saddle-crack-2', pos: [-0.03, 0.018, 0.052], rot: [0, d2r(24), 0] }));
  sad.add(mesh(rbox(0.056, 0.004, 0.130, 0.002, 2), M.tape, { name: 'duct-tape-1', pos: [0.018, 0.021, -0.03], rot: [0, 0, d2r(4)] }));
  sad.add(mesh(rbox(0.078, 0.004, 0.048, 0.002, 2), M.tape, { name: 'duct-tape-2', pos: [-0.026, 0.022, 0.056], rot: [0, d2r(24), 0] }));
  for (const s of [-1, 1]) sad.add(bend([[s * 0.028, -0.022, 0.078], [s * 0.030, -0.03, 0], [s * 0.028, -0.028, -0.088]], 0.0040, M.rustyMetal, 'saddle-rail', 12));
  sad.add(mesh(rbox(0.074, 0.018, 0.032, 0.005, 2), M.rustyMetal, { name: 'rail-cradle', pos: [0, -0.032, 0] }));
  weather(sad, { w: 0.09, h: 0.06, pos: [-0.03, 0.024, -0.02], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#3a2a22', opacity: 0.6, seed: seed + 33, count: 2, spread: 0.012 });
  S.add(sad);

  /* ---------- 5. クランク・一速・チェーン垂れ ---------- */
  const D = grp('drivetrain');
  bike.add(D);
  const ringR = 0.0700, cogR = 0.0330, chainX = 0.0560;
  const crankAng = d2r(-62);
  const cranks = grp('cranks', { pos: [BB[0], BB[1], BB[2]], rot: [crankAng, 0, 0] });
  for (const s of [-1, 1]) {
    const armX = s * (s > 0 ? 0.060 : 0.020);
    const arm = grp('crank', { pos: [armX, 0, 0] });
    arm.add(mesh(rbox(0.013, 0.162, 0.028, 0.005, 2), M.rustyMetal, { name: 'crank-arm', pos: [0, s * 0.081, 0] }));
    arm.add(mesh(cyl(0.0118, 0.0118, 0.018, 10), M.darkMetal, { name: 'crank-boss', rot: [0, 0, Math.PI / 2] }));
    arm.add(mesh(cyl(0.0080, 0.0080, 0.048, 8), M.rustyMetal, { name: 'pedal-spindle', pos: [s * 0.028, s * 0.162, 0], rot: [0, 0, Math.PI / 2] }));
    const ped = grp('pedal', { pos: [s * (Math.abs(armX) + 0.046), s * 0.162, 0] });
    ped.add(mesh(rbox(0.092, 0.020, 0.078, 0.005, 2), M.rubber, { name: 'pedal-body' }));
    // 古い金型ペダル：枠 + すのこ
    for (let k = -1; k <= 1; k++) ped.add(mesh(box(0.086, 0.006, 0.007), M.rustyMetal, { name: 'pedal-slat', pos: [0, 0.013, k * 0.022] }));
    if (s > 0) ped.add(mesh(rbox(0.050, 0.040, 0.005, 0.004, 2), M.amber, { name: 'pedal-reflector', pos: [s * 0.048, 0, 0] }));
    arm.add(ped);
    cranks.add(arm);
  }
  D.add(cranks);
  const ringG = grp('chainring', { pos: [chainX, BB[1], BB[2]], rot: [crankAng, 0, 0] });
  ringG.add(mesh(cyl(ringR - 0.010, ringR - 0.010, 0.0038, 28), M.rustyMetal, { name: 'ring-plate', rot: [0, 0, Math.PI / 2] }));
  ringG.add(ring([0, 0, 0], [1, 0, 0], ringR, 0.0048, M.rustyMetal, 'ring-wall'));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.5;
    ringG.add(seg([Math.cos(a) * 0.020, 0.004, Math.sin(a) * 0.020], [Math.cos(a) * (ringR - 0.012), 0.003, Math.sin(a) * (ringR - 0.012)], 0.0060, M.rustyMetal, 'spider-arm'));
  }
  {
    const tp = polar('x');
    radial(tp, 28, ringR + 0.0026, (i, a) => {
      const gg = grp('tooth-arm');
      gg.rotation.y = -a;
      const t = mesh(rbox(0.0094, 0.0062, 0.0058, 0.0016, 1), M.steel, { name: 'ring-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    ringG.add(tp);
  }
  D.add(ringG);
  const cog = grp('cog', { pos: [chainX, RW, ZR] });
  cog.add(ring([0, 0, 0], [1, 0, 0], cogR, 0.0044, M.rustyMetal, 'cog-wall'));
  {
    const tp = polar('x');
    radial(tp, 15, cogR + 0.0021, (i, a) => {
      const gg = grp('cogtooth-arm');
      gg.rotation.y = -a;
      const t = mesh(box(0.0072, 0.0046, 0.0044), M.steel, { name: 'cog-tooth' });
      t.userData.noOutline = true;
      gg.add(t);
      return gg;
    });
    cog.add(tp);
  }
  cog.add(bolt([0.013, 0, 0], 0.0190, M.rustyMetal, 'x', 'lockring'));
  D.add(cog);
  // チェーン（大きく垂れる・錆）
  const sag = 0.036;
  const dzc = ZR - BB[2], dyc = RW - BB[1], dd = Math.hypot(dzc, dyc);
  const phi = Math.atan2(dyc, dzc);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (ringR - cogR) / dd)));
  const aTop = phi - alpha, aBot = phi + alpha - Math.PI * 2;
  const cC = [BB[2], BB[1]], cG = [ZR, RW];
  const pAt = (c, r, a, drop = 0) => new Vector3(chainX, c[1] + Math.sin(a) * r - drop, c[0] + Math.cos(a) * r);
  const pathPts = [];
  for (let i = 0; i <= 16; i++) pathPts.push(pAt(cC, ringR, aTop + ((aBot - aTop) * i) / 16));
  const p1 = pAt(cC, ringR, aBot), p2 = pAt(cG, cogR, aBot);
  pathPts.push(p1, p1.clone().lerp(p2, 0.30).sub(new Vector3(0, sag * 0.72, 0)), p1.clone().lerp(p2, 0.62).sub(new Vector3(0, sag, 0)), p2);
  const wrap = Math.PI * 2 - (aTop - aBot);
  for (let i = 1; i <= 10; i++) pathPts.push(pAt(cG, cogR, aBot - (wrap * i) / 10));
  const chainCurve = new CatmullRomCurve3(pathPts, true, 'catmullrom', 0.02);
  const chainG = grp('chain');
  const linkOut = rbox(0.0076, 0.0078, 0.0150, 0.0018, 1);
  const linkIn = cyl(0.0045, 0.0045, 0.0106, 7);
  along(chainG, chainCurve, 72, (i, p, t) => {
    const tg = chainCurve.getTangentAt(t % 1);
    const outer = i % 2 === 0;
    const mm = mesh(outer ? linkOut : linkIn, outer ? M.rustyMetal : M.steel, { name: outer ? 'chain-outer' : 'chain-roller' });
    mm.quaternion.setFromUnitVectors(FZ, tg);
    if (!outer) mm.rotateZ(Math.PI / 2);
    mm.userData.noOutline = true;
    return mm;
  });
  D.add(chainG);
  // 旧型のハーフチェーンガード（片側・欠け・錆）
  const CG = grp('chain-guard');
  bike.add(CG);
  const gx = 0.0665;
  const guardShape = [];
  for (let i = 0; i <= 20; i++) {
    const a = -0.55 + (i / 20) * 3.6;
    if (i === 8 || i === 9) continue;                       // 欠け（一部かけている）
    guardShape.push(new Vector3(gx, BB[1] + Math.sin(a) * 0.098, BB[2] + Math.cos(a) * 0.098));
  }
  CG.add(bend(guardShape, 0.0075, M.guard, 'guard-edge', 26));
  {
    const verts = [], idx = [];
    const N = guardShape.length - 1;
    for (let i = 0; i <= N; i++) {
      const q = guardShape[i];
      const inner = new Vector3(gx, BB[1] + (q.y - BB[1]) * 0.30, BB[2] + (q.z - BB[2]) * 0.30);
      verts.push(q.x, q.y, q.z, inner.x, inner.y, inner.z);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    CG.add(mesh(geo, MAT.hardPlastic('#b9b3a6', { worn: 0.95, side: DoubleSide }), { name: 'guard-plate' }));
  }
  CG.add(bolt([gx + 0.004, BB[1] + 0.020, BB[2] - 0.032], 0.0058, M.rustyMetal, 'x', 'guard-bolt'));
  tubeDecal(CG, { at: [gx + 0.003, BB[1] - 0.052, BB[2] + 0.062], axis: [0, 0.4, 0.4], side: [1, 0, 0], w: 0.040, h: 0.070, kind: 'rust', color: PAL.rust, opacity: 0.75, seed: seed + 37 });

  /* ---------- 6. フェンダー（曲がり・破れ・泥跳ね） ---------- */
  const FD = grp('fenders');
  bike.add(FD);
  const rearF = fender({ r: 0.348, w: 0.056, center: 2.10, span: 1.86, mat: M.fender });
  rearF.position.set(0, RW, ZR);
  rearF.rotation.x = d2r(-3.4);                    // 曲がり
  rearF.rotation.z = d2r(1.8);
  FD.add(rearF);
  const frontF = fender({ r: 0.344, w: 0.052, center: 1.16, span: 1.30, mat: M.fender });
  frontF.position.set(0, RW, ZF);
  frontF.rotation.z = d2r(-4.2);                   // 左に寄って曲がっている
  FD.add(frontF);
  // 前フェンダーの破損部（当て板・ガムテープ巻き）
  FD.add(mesh(rbox(0.062, 0.006, 0.070, 0.002, 2), M.tape, { name: 'fender-patch', pos: [0.002, 0.630, ZF + 0.150], rot: [d2r(-16), 0, d2r(6)] }));
  FD.add(mesh(rbox(0.058, 0.006, 0.052, 0.002, 2), M.rustyMetal, { name: 'fender-split-plate', pos: [-4e-3, 0.618, ZF + 0.206], rot: [d2r(-24), 0, d2r(-4)] }));
  for (const s of [-1, 1]) {
    FD.add(seg([s * 0.024, 0.470, ZF + 0.176], [s * 0.046, 0.428, 0.690], 0.0042, M.rustyMetal, 'fender-strut-f'));
    FD.add(bolt([s * 0.046, 0.428, 0.690], 0.0052, M.rustyMetal, 'x', 'strut-bolt-f'));
    FD.add(seg([s * 0.026, 0.478, ZR - 0.156], [s * 0.056, RW + 0.020, ZR - 0.042], 0.0042, M.rustyMetal, 'fender-strut-r'));
    FD.add(bolt([s * 0.056, RW + 0.020, ZR - 0.042], 0.0052, M.rustyMetal, 'x', 'strut-bolt-r'));
  }
  // 後輪側の泥跳ね（フェンダー内側・ハブ・スポーク）
  for (const sx of [1, -1]) {
    for (const [phi, wdt, ht, k, col, op, so] of [[2.34, 0.24, 0.050, 'dirt', '#574b3c', 0.75, 51], [2.72, 0.16, 0.044, 'dirt', '#4f453a', 0.7, 71], [1.86, 0.12, 0.032, 'rust', PAL.rust, 0.6, 73]]) {
      tubeDecal(FD, { at: [sx * 0.014, RW + 0.348 * Math.sin(phi), ZR + 0.348 * Math.cos(phi)], axis: [1, 0, 0], side: [0, Math.sin(phi), Math.cos(phi)], w: wdt, h: ht, kind: k, color: col, opacity: op, seed: seed + so });
    }
    tubeDecal(FD, { at: [sx * 0.013, RW + 0.344 * Math.sin(0.62), ZF + 0.344 * Math.cos(0.62)], axis: [1, 0, 0], side: [0, Math.sin(0.62), Math.cos(0.62)], w: 0.12, h: 0.030, kind: 'dirt', color: '#574b3c', opacity: 0.6, seed: seed + 75 });
  }

  /* ---------- 7. 旧型ランプ・反射板（片方欠落） ---------- */
  const L = grp('lights');
  bike.add(L);
  const lamp = grp('head-lamp', { pos: [0, 0.604, 0.402], rot: [d2r(-12), 0, 0] });
  lamp.add(mesh(cyl(0.0355, 0.0325, 0.052, 16), M.rustyMetal, { name: 'lamp-body', rot: [Math.PI / 2, 0, 0] }));
  lamp.add(mesh(cyl(0.0370, 0.0370, 0.007, 16), M.chrome, { name: 'lamp-bezel', pos: [0, 0, 0.026], rot: [Math.PI / 2, 0, 0] }));
  lamp.add(mesh(sph(0.0300, 14, 10, 0, Math.PI * 2, 0, 0.6), M.glass, { name: 'lamp-glass', pos: [0, 0, 0.028], rot: [-Math.PI / 2, 0, 0] }));
  lamp.add(mesh(sph(0.0135, 10, 8), M.bulb, { name: 'lamp-reflector-cup', pos: [0, 0, 0.010] }));
  lamp.add(mesh(cyl(0.0098, 0.0098, 0.024, 8), M.rustyMetal, { name: 'lamp-stem', pos: [0, -0.044, -8e-3] }));
  lamp.add(bend([[0, -0.052, 0.004], [-0.03, -0.066, 0.050], [-0.046, -0.048, 0.108]], 0.0030, M.wire, 'lamp-wire', 10));
  L.add(lamp);
  // 尾灯は欠落、ステーとネジだけ残る
  const tl = grp('tail-lamp-remnant', { pos: [0, 0.500, ZR - 0.300], rot: [d2r(18), 0, 0] });
  tl.add(mesh(box(0.016, 0.030, 0.014), M.rustyMetal, { name: 'tail-bracket' }));
  tl.add(bolt([0, 0.016, 0], 0.0046, M.darkMetal, 'y', 'tail-screw-loose'));
  tl.add(mesh(tor(0.0075, 0.0016, 4, 10), M.rubber, { name: 'tail-rubber-band', pos: [0, -0.01, 0.006], rot: [d2r(70), 0, 0] }));
  L.add(tl);
  const rref = grp('fender-reflector', { pos: [0, 0.336, ZR - 0.330], rot: [d2r(-30), 0, 0] });
  rref.add(mesh(rbox(0.054, 0.036, 0.005, 0.005, 2), M.red, { name: 'rear-reflector' }));
  rref.add(mesh(rbox(0.044, 0.026, 0.0025, 0.004, 2), M.redGlow, { name: 'rear-reflector-face', pos: [0, 0, -3e-3] }));
  L.add(rref);

  /* ---------- 8. 旧キャリア（錆・曲がり）＋日焼け防犯登録札 ---------- */
  const RC = grp('rear-carrier');
  bike.add(RC);
  const rackY = 0.700, rackZ0 = -0.25, rackZ1 = -0.8;
  for (const s of [-1, 1]) {
    RC.add(seg([s * 0.074, rackY + (s < 0 ? 0.008 : 0), rackZ0 + 0.02], [s * 0.074, rackY - 0.014 + (s < 0 ? 0.008 : 0), rackZ1], 0.0082, M.rustyMetal, 'rack-rail'));
    RC.add(bend([[s * 0.074, rackY - 0.004, rackZ0 + 0.026], [s * 0.060, 0.628, -0.204], [s * 0.046, 0.546, -0.194]], 0.0056, M.rustyMetal, 'rack-stay', 10));
    RC.add(bend([[s * 0.074, rackY - 0.014, rackZ1 + 0.090], [s * 0.060, 0.596, -0.47], [s * 0.056, RW + 0.022, ZR - 0.036]], 0.0056, M.rustyMetal, 'rack-stay-rear', 12));
    RC.add(bolt([s * 0.056, RW + 0.022, ZR - 0.036], 0.0056, M.rustyMetal, 'x', 'rack-bolt'));
  }
  for (let i = 0; i < 5; i++) {
    const z = rackZ0 + 0.026 + (i / 4) * (rackZ1 - rackZ0 - 0.078);
    RC.add(mesh(cyl(0.0054, 0.0054, 0.148, 8), M.rustyMetal, { name: 'rack-cross', pos: [0, rackY - 0.008 - i * 0.0018 + (i === 2 ? 0.010 : 0), z], rot: [0, 0, Math.PI / 2] }));
  }
  RC.add(mesh(rbox(0.156, 0.009, 0.046, 0.004, 2), M.rustyMetal, { name: 'clip-plate', pos: [0, rackY - 0.012, rackZ0 + 0.034] }));
  const clip = grp('spring-clip', { pos: [0, rackY + 0.010, rackZ0 + 0.078], rot: [0, 0, d2r(-6)] });
  clip.add(bend([[-0.048, 0, 0], [-0.028, 0.026, 0.004], [0, 0.034, 0.002], [0.028, 0.026, 0.004], [0.048, 0, 0]], 0.0040, M.rustyMetal, 'clip-wire', 14));
  RC.add(clip);
  // 日焼けした防犯登録札（赤文字が白く飛んでいる）
  const tag = grp('crime-tag', { pos: [0.004, 0.792, -0.176], rot: [d2r(24), d2r(5), d2r(-3)] });
  tag.add(mesh(rbox(0.062, 0.040, 0.0032, 0.003, 2), M.paper, { name: 'tag-plate' }));
  decal(tag, { map: TEX.signboard({ text: '防犯登録', sub: '4-0932 春日', bg: '#efe6cf', fg: '#c9a08f' }), w: 0.058, h: 0.036, pos: [0, 0, 0.003], opacity: 0.62 });
  decal(tag, { map: TEX.wear({ kind: 'dirt', color: '#efe4c8', seed: seed + 52, density: 1.6 }), w: 0.05, h: 0.03, pos: [0.006, 0.006, 0.0045], opacity: 0.55 });
  tag.add(mesh(tor(0.0040, 0.0013, 4, 8), M.rustyMetal, { name: 'tag-wire', pos: [0, 0.020, 0.004] }));
  bike.add(tag);

  /* ---------- 9. サイドスタンド（バネ紛失・ゴム輪で仮止め） ---------- */
  const ST = grp('stand');
  bike.add(ST);
  const px = -0.05, py = 0.248, pz = -0.046;
  const fx = -0.206, fz = 0.030;
  const fy = -fx * Math.tan(d2r(lean));
  ST.add(bolt([px - 0.013, py, pz], 0.0106, M.rustyMetal, 'x', 'stand-pivot'));
  ST.add(seg([px, py, pz], [fx, fy + 0.016, fz], 0.0090, M.rustyMetal, 'stand-leg'));
  ST.add(mesh(cyl(0.0090, 0.0090, 0.038, 8), M.rustyMetal, { name: 'stand-foot-bend', pos: [fx + 0.002, fy + 0.014, fz], rot: [Math.PI / 2, 0, 0] }));
  ST.add(mesh(rbox(0.048, 0.010, 0.036, 0.004, 2), M.rustyMetal, { name: 'stand-pad', pos: [fx + 0.004, fy + 0.006, fz] }));
  // ゴム輪（バネの代わりに巻いてある）
  for (let k = 0; k < 3; k++) {
    const band = mesh(tor(0.0165 + k * 0.0018, 0.0026, 5, 14), M.rubber, { name: 'rubber-band', pos: [px + 0.010 + k * 0.008, py - 0.048, pz + 0.014], rot: [d2r(72), 0, d2r(20 + k * 8)] });
    band.userData.noOutline = true;
    ST.add(band);
  }
  ST.add(mesh(cyl(0.0034, 0.0034, 0.050, 6), M.wire, { name: 'wire-tie', pos: [px + 0.020, py - 0.052, pz + 0.016], rot: [d2r(70), 0, d2r(18)] }));
  tubeDecal(ST, { at: [-0.132, 0.140, -6e-3], axis: [0, -0.104, 0.076], side: [-1, 0, 0], w: 0.024, h: 0.150, kind: 'rust', color: PAL.rust, opacity: 0.8, seed: seed + 59 });

  /* ---------- 10. ロッドブレーキ（旧型・ワイヤーではない） ---------- */
  const BR = grp('brakes');
  bike.add(BR);
  for (const s of [-1, 1]) {
    // 前：ダイレクトロッド
    BR.add(bend([[s * 0.206, 0.856, 0.096], [s * 0.152, 0.742, 0.190], [s * 0.092, 0.620, 0.300], [s * 0.034, 0.512, ZF + 0.268]], 0.0042, M.steel, 'front-rod', 18));
    BR.add(mesh(cyl(0.0060, 0.0060, 0.018, 8), M.rustyMetal, { name: 'rod-joint-1', pos: [s * 0.150, 0.720, 0.200], rot: [0, 0, Math.PI / 2] }));
    BR.add(mesh(cyl(0.0060, 0.0060, 0.018, 8), M.rustyMetal, { name: 'rod-joint-2', pos: [s * 0.086, 0.560, 0.300], rot: [0, Math.PI / 2, 0] }));
  }
  for (const c of [{ y: 0.512, z: ZF + 0.268 }, { y: 0.548, z: ZR - 0.048 }]) {
    const cal = grp('caliper', { pos: [0, c.y, c.z] });
    cal.add(mesh(rbox(0.030, 0.026, 0.026, 0.006, 2), M.rustyMetal, { name: 'caliper-body' }));
    for (const s of [-1, 1]) {
      cal.add(seg([s * 0.011, -6e-3, 0], [s * 0.028, -0.116, 0.010], 0.0052, M.steel, 'caliper-arm'));
      cal.add(mesh(rbox(0.013, 0.018, 0.007, 0.003, 2), M.rubber, { name: 'brake-pad', pos: [s * 0.030, -0.124, 0.014] }));
    }
    cal.add(bolt([0, 0.013, 0], 0.0058, M.rustyMetal, 'y', 'caliper-bolt'));
    BR.add(cal);
  }
  // 後ブレーキはロッド（シートステー沿い）
  BR.add(bend([[0, 0.836, 0.214], [-0.012, 0.792, -0.15], [-0.014, 0.700, -0.24], [-0.012, 0.600, -0.42], [0, 0.548, ZR - 0.046]], 0.0042, M.steel, 'rear-rod', 22));
  BR.add(mesh(cyl(0.0072, 0.0072, 0.020, 8), M.rustyMetal, { name: 'rear-rod-crank', pos: [-0.014, 0.700, -0.24], rot: [0, 0, Math.PI / 2] }));
  BR.add(mesh(cyl(0.0068, 0.0068, 0.130, 8), M.steel, { name: 'rear-transverse-rod', pos: [0, 0.556, ZR - 0.040], rot: [0, 0, Math.PI / 2] }));

  /* ---------- 11. 車輪（後輪 空気抜け・リム振れ、前輪 やや減り） ---------- */
  const rear = wheel({ R: 0.3060, tireT: 0.0220, rimR: 0.2810, rimW: 0.026, spokes: 20, M, phase: 0.17, squash: 0.958, bent: 0.004, rusty: 0 });
  rear.position.set(0, RW, ZR);
  bike.add(rear);
  const front = wheel({ R: 0.3060, tireT: 0.0220, rimR: 0.2810, rimW: 0.026, spokes: 20, M, phase: 0.31, squash: 0.982, bent: 0.002, rusty: 1 });
  front.position.set(0, RW, ZF);
  bike.add(front);
  // 後輪のスポークに絡んだ草・泥
  tubeDecal(bike, { at: [0.0180, RW + 0.348 * Math.sin(3.00), ZR + 0.348 * Math.cos(3.00)], axis: [1, 0, 0], side: [0, Math.sin(3.00), Math.cos(3.00)], w: 0.130, h: 0.030, kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 61 });
  tubeDecal(bike, { at: [-0.018, RW + 0.348 * Math.sin(2.80), ZR + 0.348 * Math.cos(2.80)], axis: [1, 0, 0], side: [0, Math.sin(2.80), Math.cos(2.80)], w: 0.100, h: 0.028, kind: 'moss', color: '#6d8a52', opacity: 0.4, seed: seed + 63 });

  shadowBlob(g, { r: 0.27, pos: [0, 0.001, ZR], opacity: 0.24 });
  shadowBlob(g, { r: 0.27, pos: [0, 0.001, ZF], opacity: 0.20 });
  shadowBlob(g, { r: 0.11, pos: [-0.21, 0.001, 0.03], opacity: 0.18 });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
