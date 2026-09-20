import { g as grp, M as MAT, D as DoubleSide, P as PAL, m as mesh, r as rbox, n as range, b as box, c as cyl, w as weather, t as tor, K as extrude, J as shape, h as decal, T as TEX, k as tubeOf, q as finish, B as BufferGeometry, F as Float32BufferAttribute, z as rand, o as lathe } from './index-CNQWoZB0.js';

//  assets/store/awning.js —— 便利店正面雨棚（FRP 波板の屋根＋アルミ支持アーム＋看板帯＋帯下照明＋吊り看板）
//  原点 = 雨棚の壁面取付点中心：局所 z=0 が壁面（+Z = 道路側）、局所 y=0 が床面（安装高度 y は build 内で織り込み）

const meta = {
  id: 'awning',
  real: [9.18, 1.18, 1.21],      // width=9.0 / depth=1.15 / y=2.92 のとき（看板帯・照明・吊り看板込み／局所 y 2.11〜3.28）
  origin: 'wall-face-center（局所 z=0 = 壁面, 局所 y=0 = 店舗前床面, y=2.92 は内部で加算済み）',
};

const DEFAULT_OPTIONS = { width: 9.0, depth: 1.15, y: 2.92, seed: 71 };

const noOut = (o) => { o.userData.noOutline = true; return o; };
const D2R = Math.PI / 180;

/** 変位する薄板グリッド（共有キャッシュを使わない専用ジオメトリ・上面法線 +Y） */
function surfaceGeo(x0, x1, z0, z1, nx, nz, hFn) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) {
    const z = z0 + ((z1 - z0) * j) / nz;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + ((x1 - x0) * i) / nx;
      pos.push(x, hFn(x, z), z);
      uv.push(i / nx, j / nz);
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** 薄板の端実幅（鉛直カーテン）：上面 topFn(x) から drop 分だけ下ろす */
function edgeStripGeo(x0, x1, z, topFn, drop, nx, back = false) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx;
    const y = topFn(x);
    pos.push(x, y, z, x, y - drop, z);
    uv.push(i / nx, 1, i / nx, 0);
  }
  for (let i = 0; i < nx; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    if (back) idx.push(a, c, b, c, d, b);
    else idx.push(a, b, c, c, b, d);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** 落ち葉 1 枚 */
const leafGeo = (s) => lathe([[0, 0], [s * 0.40, s * 0.09], [s * 0.82, s * 0.05], [s, 0], [s * 0.68, -s * 0.05]], 7);

function build(options = {}) {
  const W = options.width ?? 9.0;
  const D = options.depth ?? 1.15;
  const MB = options.y ?? 2.92;                 // 看板帯の上端＝壁面の安装基準高（局所 y）
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);

  const g = grp('awning');

  /* ---------------- 寸法 ---------------- */
  const BH = 0.36;                              // 看板帯の高さ
  const bandBot = MB - BH;
  const bandFront = D, bandBack = D - 0.05;
  const zBack = 0.010, zFront = D - 0.10;       // 波板パネルの前後端
  const PW = W / 2 + 0.06;                      // パネル半幅
  const yRear = MB + 0.20, yFront = MB + 0.055; // 勾配（前端に樋・ドレン）
  const span = zFront - zBack;
  const nRib = Math.max(18, Math.round((PW * 2) / 0.19));
  const ribPitch = (PW * 2) / nRib;

  const tri = (t) => { const u = ((t % 1) + 1) % 1; return 1 - 4 * Math.abs(u - 0.5); };
  const roofH = (x, z) => {
    const s = (z - zBack) / span;                                   // 0=壁, 1=前端
    const across = Math.max(0, 1 - Math.pow((2 * x) / (PW * 2), 2));
    const edge = Math.max(0, Math.abs(x) - (PW - 0.12)) / 0.12;
    return yRear + (yFront - yRear) * s
      - 0.030 * across * Math.pow(s, 0.85)                          // たわみ
      + 0.014 * across                                              // 中央の反り（キャンバー）
      + 0.011 * tri(x / ribPitch) * (1 - 0.18 * s)                  // 波リブ
      + 0.024 * edge * edge;                                        // 端部の反り
  };
  const crestX = (k) => (k + 0.5) * ribPitch - PW;

  /* ---------------- 材質 ---------------- */
  const frp = MAT.corrugated({
    base: '#d3d5c2', tintBase: '#fffaf0', tint: '#f8e6bd', sat: 0.94, steps: 3,
    spec: 0.26, specPower: 38, sheen: 0.06, side: DoubleSide, uv: { repeat: [nRib / 16, 1] },
  });
  const alu = MAT.metal('#c6cac6', { worn: 0.5, repeat: 3 });        // アルミ押出
  const aluDk = MAT.metal('#a7acae', { worn: 0.8, repeat: 4 });
  const galv = MAT.galvanized({ repeat: 3 });                        // 亜鉛めっき
  const iron = MAT.darkIron({ repeat: 4 });                          // 塗装鉄（支持）
  const screwSt = MAT.stainless({ repeat: 8 });
  const bandBlue = MAT.metalPaint(PAL.storeBand, { worn: 0.55, repeat: 3 });
  const bandYel = MAT.metalPaint(PAL.storeBand2, { worn: 0.62, repeat: 3 });
  const bandRed = MAT.metalPaint(PAL.storeBand3, { worn: 0.62, repeat: 3 });
  const seal = MAT.paint('#494a44', { steps: 2, spec: 0.1, sheen: 0, shadowAmt: 0.98 });
  const board = MAT.hardPlastic('#f2eee2', { repeat: 4, sat: 0.9, tint: '#f6efdd' });
  const pvc = MAT.plastic('#cfcbbc', { steps: 3, tint: '#f0e6cc', sat: 0.88 });

  /* ================ 1. FRP 波板の屋根 ================ */
  const roof = grp('frp-roof');
  g.add(roof);
  roof.add(noOut(mesh(surfaceGeo(-PW, PW, zBack, zFront, nRib * 6, 6, roofH), frp, { name: 'frp-panel' })));
  // 端の実幅（前后：16mm 厚の切り口）
  const slopeDeg = Math.atan2(yRear - yFront, span) / D2R;
  roof.add(noOut(mesh(edgeStripGeo(-PW, PW, zFront, (x) => roofH(x, zFront), 0.017, 64), aluDk, { name: 'front-edge' })));
  roof.add(noOut(mesh(edgeStripGeo(-PW, PW, zBack, (x) => roofH(x, zBack), 0.017, 32, true), aluDk, { name: 'rear-edge' })));
  // 前端の雨切り（笠木状の押えアングル）
  roof.add(mesh(rbox(PW * 2 + 0.02, 0.026, 0.048, 0.007, 2), alu, { pos: [0, yFront - 0.004, zFront + 0.014], rot: [-slopeDeg * 0.4 * D2R, 0, 0] }));

  // 端部のケバ（切断面のバリ・繊維のほつれ）＋ 切断面の層
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 10; k++) {
      const z = range(rnd, zBack + 0.03, zFront - 0.03);
      roof.add(noOut(mesh(box(0.030, 0.0018, 0.0034), MAT.plastic('#ded9c4', { steps: 2, tint: '#f4e6c4' }), {
        pos: [sx * (PW + 0.013), roofH(sx * PW, z) + range(rnd, -8e-3, 0.012), z],
        rot: [range(rnd, -0.5, 0.5), range(rnd, -0.5, 0.5), range(rnd, -0.35, 0.35)], cast: false,
      })));
    }
    roof.add(noOut(mesh(box(0.010, 0.030, zFront - zBack), MAT.plastic('#cfcbba', { steps: 2 }), {
      pos: [sx * (PW - 0.003), roofH(sx * (PW - 0.005), (zBack + zFront) / 2) + 0.004, (zBack + zFront) / 2],
      rot: [0, 0, -sx * 3 * D2R], cast: false,
    })));
    // 端見切り（アルミキャップ）＋ リベット
    const cz = (zBack + zFront) / 2;
    g.add(mesh(rbox(0.026, 0.056, zFront - zBack + 0.06, 0.008, 2), alu, { pos: [sx * (PW + 0.014), roofH(sx * PW, cz) + 0.008, cz], name: 'end-trim' }));
    for (let k = 0; k < 4; k++) {
      const z = zBack + 0.12 + k * ((zFront - zBack - 0.24) / 3);
      g.add(noOut(mesh(cyl(0.0055, 0.0055, 0.007, 6), screwSt, { pos: [sx * (PW + 0.027), roofH(sx * PW, z) + 0.010, z], rot: [0, 0, Math.PI / 2], cast: false })));
    }
    weather(g, { w: 0.11, h: 0.11, pos: [sx * (PW + 0.028), roofH(sx * PW, zFront - 0.24) + 0.01, zFront - 0.24], rot: [0, sx * Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 11 + sx, density: 1.4, spread: 0.02 });
  }

  /* ================ 2. 野縁（パurlin）・ビス・壁際シーリング ================ */
  const under = grp('purlins');
  g.add(under);
  const purlinZ = [zBack + 0.14, (zBack + zFront) / 2, zFront - 0.14];
  purlinZ.forEach((pz, pi) => {
    const py = roofH(0, pz) - 0.036;
    under.add(mesh(box(W - 0.02, 0.044, 0.048), galv, { pos: [0, py, pz] }));
    under.add(mesh(box(W - 0.02, 0.010, 0.064), galv, { pos: [0, py + 0.021, pz] }));
    under.add(mesh(box(W - 0.02, 0.008, 0.020), aluDk, { pos: [0, py - 0.022, pz] }));
    // リブの頂上打ちビス（周囲に錆）
    const n = Math.max(6, Math.round(W / 0.52));
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.26 + i * ((W - 0.52) / (n - 1));
      const xr = crestX(Math.round((x + PW) / ribPitch - 0.5));
      const yy = roofH(xr, pz) + 0.004;
      under.add(noOut(mesh(cyl(0.0088, 0.0088, 0.008, 6), MAT.metal('#8d8f8a', { worn: 0.9, repeat: 8 }), { pos: [xr, yy, pz], cast: false })));
      under.add(noOut(mesh(cyl(0.0040, 0.0040, 0.014, 6), iron, { pos: [xr, yy - 0.006, pz], cast: false })));
    }
    weather(under, { w: 1.0, h: 0.09, pos: [-W * 0.26, py - 0.026, pz], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 13 + pi, density: 1.6, spread: 0.014 });
  });
  // ビス穴周りの錆（上面・3 箇所）
  for (const bx of [-0.31, 0.06, 0.34].map((f) => f * W)) {
    weather(roof, { w: 0.22, h: 0.18, pos: [bx, roofH(bx, purlinZ[1]) + 0.019, purlinZ[1]], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#9a6236', opacity: 0.5, seed: seed + Math.round(75 + bx), density: 1.7, spread: 0.006 });
  }
  // 壁際押えフラッシング＋シーリングの黒ズミ
  const flash = grp('flashing');
  g.add(flash);
  flash.add(mesh(box(W + 0.04, 0.17, 0.013), galv, { pos: [0, yRear + 0.062, 0.004] }));
  flash.add(mesh(box(W + 0.04, 0.014, 0.026), alu, { pos: [0, yRear + 0.148, 0.010], rot: [-7 * D2R, 0, 0] }));
  flash.add(mesh(box(W + 0.02, 0.017, 0.017), seal, { pos: [0, yRear - 0.014, 0.019] }));   // シーリング目地
  weather(flash, { w: 1.5, h: 0.05, pos: [W / 6, yRear - 0.010, 0.029], kind: 'moss', color: '#3c4a33', opacity: 0.62, seed: seed + 15, density: 1.8, spread: 0.006 });
  weather(flash, { w: 1.2, h: 0.04, pos: [-W / 3, yRear - 0.012, 0.029], kind: 'dirt', color: '#2f3128', opacity: 0.55, seed: seed + 16, density: 1.3, spread: 0.005 });
  weather(flash, { w: W * 0.5, h: 0.16, pos: [0, yRear + 0.066, 0.013], kind: 'dirt', color: '#8c8271', opacity: 0.4, seed: seed + 17, density: 1.1, spread: 0.02 });

  /* ================ 3. 前端ドレン・受け樋・竪樋受け ================ */
  const drain = grp('front-drain');
  g.add(drain);
  const gz = zFront + 0.05, gy = yFront + 0.02;
  drain.add(mesh(box(W + 0.02, 0.010, 0.10), aluDk, { pos: [0, gy, gz] }));
  drain.add(mesh(box(W + 0.02, 0.072, 0.010), aluDk, { pos: [0, gy + 0.033, gz + 0.048] }));
  drain.add(mesh(box(W + 0.02, 0.058, 0.010), aluDk, { pos: [0, gy + 0.026, gz - 0.048] }));
  for (const sx of [-1, 1]) drain.add(mesh(box(0.010, 0.072, 0.10), aluDk, { pos: [sx * (W / 2 + 0.006), gy + 0.033, gz] }));
  // ドレン（あふれ穴 3 箇所）
  for (const dx of [-0.34, 0, 0.33].map((f) => f * W)) {
    drain.add(noOut(mesh(cyl(0.0125, 0.0125, 0.032, 9), pvc, { pos: [dx, gy + 0.020, gz + 0.057], rot: [Math.PI / 2, 0, 0] })));
    drain.add(noOut(mesh(tor(0.0125, 0.0032, 5, 12), MAT.plastic('#bdb9a8', { steps: 2 }), { pos: [dx, gy + 0.020, gz + 0.071], rot: [Math.PI / 2, 0, 0], cast: false })));
    weather(drain, { w: 0.11, h: 0.06, pos: [dx, gy - 0.004, gz + 0.055], kind: 'rust', color: '#7f8d78', opacity: 0.5, seed: seed + Math.round(20 + dx), density: 1.2, spread: 0.004 });
  }
  // 樋内の泥・落ち葉
  weather(drain, { w: W * 0.62, h: 0.09, pos: [-W * 0.12, gy + 0.008, gz], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6d6553', opacity: 0.6, seed: seed + 24, density: 1.9, spread: 0.004 });
  for (let i = 0; i < 8; i++) {
    const s = range(rnd, 0.018, 0.036);
    drain.add(noOut(mesh(leafGeo(s), MAT.leaf({ color: i % 3 === 0 ? '#9d8a5b' : '#8a6f49', tint: '#eee0c2' }), {
      pos: [range(rnd, -W / 2 + 0.1, W / 2 - 0.1), gy + 0.014 + rnd() * 0.006, gz + range(rnd, -0.03, 0.03)],
      rot: [range(rnd, -0.4, 0.4), range(rnd, 0, 6.28), range(rnd, -0.4, 0.4)], cast: false,
    })));
  }
  // 竪樋への受け（帯の両端の内側で下りる）
  for (const sx of [-1, 1]) {
    const dp = grp('downpipe-recv');
    g.add(dp);
    const px = sx * (W / 2 - 0.075);
    dp.add(mesh(cyl(0.040, 0.040, 0.44, 14, true), pvc, { pos: [px, gy - 0.24, gz - 0.016] }));
    dp.add(mesh(cyl(0.050, 0.042, 0.052, 14), MAT.plastic('#c9c5b6', { steps: 2 }), { pos: [px, gy + 0.026, gz - 0.016] }));
    dp.add(noOut(mesh(tor(0.042, 0.0055, 5, 16), MAT.plastic('#bfb9a8', { steps: 2 }), { pos: [px, gy - 0.05, gz - 0.016], rot: [Math.PI / 2, 0, 0], cast: false })));
    dp.add(mesh(box(0.014, 0.052, 0.10), galv, { pos: [px - sx * 0.052, gy - 0.30, gz - 0.016] }));
    dp.add(noOut(mesh(cyl(0.0068, 0.0068, 0.056, 6), iron, { pos: [px - sx * 0.078, gy - 0.30, gz - 0.016], rot: [0, 0, Math.PI / 2] })));
    weather(dp, { w: 0.10, h: 0.24, pos: [px + sx * 0.028, gy - 0.30, gz + 0.010], kind: 'dirt', color: '#6f6a56', opacity: 0.5, seed: seed + 27 + sx, density: 1.5, spread: 0.012 });
  }

  /* ================ 4. 支持アーム（アングル・ボルト・補強ガセット・塗装剥がれ） ================ */
  const armXs = [-0.472, -0.283, -0.094, 0.094, 0.283, 0.472].map((f) => f * W);
  const armRootY = MB + 0.08, armTipY = MB - 0.28, armTipZ = bandBack - 0.055;
  const armDrop = armRootY - armTipY, armRun = armTipZ - 0.016;
  const armL = Math.hypot(armDrop, armRun), armA = Math.atan2(armDrop, armRun);
  armXs.forEach((ax, i) => {
    const arm = grp('arm');
    arm.position.set(ax, armRootY, 0.014);
    g.add(arm);
    // 壁取付 Plate＋アンカーボルト 4 本
    arm.add(mesh(rbox(0.112, 0.172, 0.012, 0.005, 2), iron, { pos: [0, -0.024, 0.006] }));
    for (const [bx, by] of [[-0.034, 0.040], [0.034, 0.040], [-0.034, -0.08], [0.034, -0.08]]) {
      arm.add(noOut(mesh(cyl(0.0125, 0.0125, 0.005, 10), screwSt, { pos: [bx, by, 0.015], rot: [Math.PI / 2, 0, 0], cast: false })));
      arm.add(noOut(mesh(cyl(0.0068, 0.0068, 0.026, 6), iron, { pos: [bx, by, 0.024], rot: [Math.PI / 2, 0, 0], cast: false })));
    }
    // 補強ガセット（三角座金）
    const gus = mesh(extrude(shape((s) => { s.moveTo(0, 0); s.lineTo(0.24, 0); s.lineTo(0, -0.165); s.closePath(); }), { depth: 0.006, bevelEnabled: false }), iron, { pos: [0.003, -0.01, 0.020], rot: [0, -Math.PI / 2, 0] });
    arm.add(gus);
    // 傾斜アングル（ウェブ＋上下フラジ）
    const raf = grp('rafter');
    raf.rotation.x = armA;
    arm.add(raf);
    raf.add(mesh(box(0.008, 0.058, armL), iron, { pos: [0, 0.004, armL / 2] }));
    raf.add(mesh(box(0.054, 0.008, armL), iron, { pos: [0.025, -0.029, armL / 2] }));
    raf.add(mesh(box(0.054, 0.008, armL), iron, { pos: [-0.025, -0.029, armL / 2] }));
    for (let k = 0; k < 3; k++) {
      const zz = 0.16 + k * ((armL - 0.32) / 2);
      raf.add(noOut(mesh(box(0.060, 0.006, 0.018), aluDk, { pos: [0, -0.017, zz], cast: false })));
      raf.add(noOut(mesh(cyl(0.0062, 0.0062, 0.052, 6), screwSt, { pos: [0, -6e-3, zz + 0.052], rot: [Math.PI / 2, 0, 0], cast: false })));
    }
    // 前端：帯の野縁レールを受ける金物
    const br = grp('front-bracket');
    br.position.set(ax, armTipY, armTipZ);
    g.add(br);
    br.add(mesh(rbox(0.092, 0.150, 0.010, 0.005, 2), iron, { pos: [0, 0.026, 0.014] }));
    br.add(mesh(box(0.072, 0.010, 0.092), iron, { pos: [0, -0.046, 0.056] }));
    for (const [bx, by] of [[-0.028, 0.066], [0.028, 0.066], [0, -0.01]]) {
      br.add(noOut(mesh(cyl(0.0075, 0.0075, 0.020, 6), screwSt, { pos: [bx, by, 0.024], rot: [Math.PI / 2, 0, 0], cast: false })));
      br.add(noOut(mesh(cyl(0.0115, 0.0115, 0.0045, 8), aluDk, { pos: [bx, by, 0.017], rot: [Math.PI / 2, 0, 0], cast: false })));
    }
    // 先端から屋根前端への竖直引き（短い丸钢・br は armTip に位置しているので局所座標）
    const tieLen = Math.max(0.05, roofH(ax, zFront) - armTipY - 0.02);
    br.add(mesh(cyl(0.0095, 0.0095, tieLen, 8), iron, { pos: [0, tieLen / 2 - 0.012, 0.066] }));
    br.add(noOut(mesh(cyl(0.016, 0.016, 0.009, 8), MAT.rubber('#2f3238'), { pos: [0, tieLen - 0.014, 0.066], cast: false })));
    // 経年：塗装剥がれ・下端の錆
    weather(arm, { w: 0.17, h: 0.14, pos: [0, -0.03, 0.021], kind: 'chip', color: '#8f8b80', opacity: 0.6, seed: seed + 31 + i, density: 1.8, spread: 0.012 });
    weather(raf, { w: armL * 0.42, h: 0.07, pos: [0, -0.032, armL * 0.62], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 37 + i, density: 1.8, spread: 0.014 });
    weather(br, { w: 0.10, h: 0.11, pos: [0, -0.052, 0.022], kind: 'rust', color: '#7d5a3a', opacity: 0.55, seed: seed + 43 + i, density: 1.6, spread: 0.01 });
  });

  /* ================ 5. 看板帯（三色帯・店名・側面営業時間） ================ */
  const bandG = grp('sign-band');
  g.add(bandG);
  // 野縁レール（帯の裏側で帯とアームをつなぐ）
  bandG.add(mesh(box(W - 0.02, BH + 0.10, 0.020), aluDk, { pos: [0, MB - BH / 2 + 0.03, bandBack - 0.012] }));
  // 三色の横帯
  const stripes = [
    { h: 0.130, c: bandBlue, y: MB - 0.065 },
    { h: 0.120, c: bandYel, y: MB - 0.190 },
    { h: 0.110, c: bandRed, y: MB - 0.305 },
  ];
  for (const st of stripes) bandG.add(mesh(rbox(W, st.h - 0.003, 0.050, 0.004, 2), st.c, { pos: [0, st.y, bandFront - 0.025], name: 'band-stripe' }));
  // 笠木（コピング）＋ 滴下切れ目
  const cap = grp('coping');
  g.add(cap);
  cap.add(mesh(rbox(W + 0.08, 0.034, 0.100, 0.010, 2), alu, { pos: [0, MB + 0.014, bandFront - 0.026] }));
  cap.add(mesh(box(W + 0.08, 0.012, 0.014), aluDk, { pos: [0, MB - 0.006, bandFront + 0.017] }));
  for (const sx of [-1, 1]) cap.add(mesh(box(0.014, 0.040, 0.100), alu, { pos: [sx * (W / 2 + 0.038), MB + 0.014, bandFront - 0.026] }));
  // 見切り（下端アルミチャンネル・ドレンスリット）
  const skirt = grp('band-skirt');
  g.add(skirt);
  skirt.add(mesh(box(W + 0.02, 0.013, 0.018), alu, { pos: [0, bandBot - 0.005, bandFront - 0.007] }));
  for (let k = 0; k < 8; k++) skirt.add(noOut(mesh(box(0.022, 0.010, 0.014), MAT.paint('#2f3236', { steps: 2 }), { pos: [-W / 2 + 0.5 + k * ((W - 1.0) / 7), bandBot - 0.006, bandFront - 0.030], cast: false })));
  // 店名プレート（正面の文字帯：架空店名「サクラ・マート」）
  const npW = Math.min(3.10, W * 0.36), npH = 0.200;
  const nameG = grp('store-name');
  bandG.add(nameG);
  nameG.add(mesh(rbox(npW, npH, 0.016, 0.004, 2), board, { pos: [0, MB - 0.178, bandFront + 0.011] }));
  nameG.add(mesh(box(npW + 0.024, 0.010, 0.020), alu, { pos: [0, MB - 0.079, bandFront + 0.012] }));
  nameG.add(mesh(box(npW + 0.024, 0.010, 0.020), alu, { pos: [0, MB - 0.277, bandFront + 0.012] }));
  decal(nameG, {
    map: TEX.signboard({ text: 'サクラ・マート', sub: '24 時間営業・駅前三丁目', bg: PAL.paint, fg: '#3d4a58', stripe: PAL.storeBand }),
    w: npW - 0.030, h: npH - 0.024, pos: [0, MB - 0.178, bandFront + 0.0225],
  });
  for (const sx of [-1, 1]) nameG.add(noOut(mesh(cyl(0.0075, 0.0075, 0.010, 6), screwSt, { pos: [sx * (npW / 2 - 0.045), MB - 0.178, bandFront + 0.020], rot: [Math.PI / 2, 0, 0], cast: false })));
  // 帯左右のテキスト帯（入荷・市のご案内）
  // 底色是帯自己的红，字是暖白 —— 原来用 PAL.paintWarm（≈白）当底，等于在
  // 红/金/蓝三色条上各贴了一块 84 mm 高的白纸，实拍里读成「招牌上横着几条白杠」。
  // 真实便利店看板这类资讯是印在色带上的，不是另贴一张纸。
  for (const sx of [-1, 1]) {
    decal(bandG, {
      map: TEX.adStrip({ text: sx < 0 ? '春のさくら市 開催中' : '毎朝 6 時 パン・おにぎり入荷', bg: sx < 0 ? PAL.storeBand3 : PAL.storeBand, fg: '#fbf6ea', seed: seed + (sx < 0 ? 3 : 4) }),
      w: (W - npW) / 2 - 0.34, h: 0.084, pos: [sx * (npW / 2 + (W - npW) / 4 + 0.06), MB - 0.198, bandFront + 0.0035], opacity: 0.94,
    });
  }
  // 側面（帯の端バック）：営業時間帯
  for (const sx of [-1, 1]) {
    const cheek = grp('cheek');
    g.add(cheek);
    const cxp = sx * (W / 2 - 0.002);
    cheek.add(mesh(rbox(0.016, BH - 0.02, 0.42, 0.004, 2), bandBlue, { pos: [cxp, MB - BH / 2, bandFront - 0.24] }));
    cheek.add(mesh(box(0.020, 0.010, 0.44), alu, { pos: [cxp, MB - 0.004, bandFront - 0.24] }));
    decal(cheek, {
      map: TEX.signboard({ text: '営業時間', sub: '24 時間 / 年中無休', bg: PAL.storeBand, fg: PAL.paint }),
      w: 0.36, h: 0.24, pos: [cxp + sx * 0.0125, MB - BH / 2 - 0.03, bandFront - 0.24], rot: [0, sx * Math.PI / 2, 0],
    });
    weather(cheek, { w: 0.30, h: 0.12, pos: [cxp + sx * 0.012, MB - 0.06, bandFront - 0.40], rot: [0, sx * Math.PI / 2, 0], kind: 'dirt', color: '#5f5a4a', opacity: 0.5, seed: seed + 47 + sx, density: 1.4, spread: 0.02 });
  }

  /* ================ 6. 帯下照明（3 灯・呼吸） ================ */
  const lampXs = (W >= 7 ? [-0.33, 0, 0.33] : [-0.24, 0.24]).map((f) => f * W);
  const lw = Math.min(0.40, W * 0.052);
  lampXs.forEach((lx, i) => {
    const lamp = grp('band-lamp');
    lamp.position.set(lx, 0, 0);
    g.add(lamp);
    const yTop = bandBot + 0.010;
    lamp.add(mesh(rbox(lw, 0.040, 0.044, 0.004, 2), alu, { pos: [0, yTop - 0.022, bandFront - 0.028] }));      // 框
    lamp.add(mesh(box(lw - 0.020, 0.008, 0.030), MAT.hardPlastic('#efece0', { repeat: 6 }), { pos: [0, yTop - 0.041, bandFront - 0.028] }));
    lamp.add(mesh(rbox(lw - 0.028, 0.008, 0.036, 0.003, 2), MAT.lampShade({ color: '#fff5df', emissive: '#ffdca6', emissiveIntensity: 0.92 }), { pos: [0, yTop - 0.0485, bandFront - 0.028] }));
    for (const sx of [-1, 1]) {
      lamp.add(noOut(mesh(cyl(0.005, 0.005, 0.010, 6), screwSt, { pos: [sx * (lw / 2 - 0.014), yTop - 0.014, bandFront - 0.006], rot: [Math.PI / 2, 0, 0], cast: false })));
    }
    lamp.add(mesh(box(0.034, 0.016, 0.030), MAT.hardPlastic('#e6e2d4'), { pos: [0, yTop - 0.010, bandFront - 0.058] }));   // 配線盒
    lamp.add(noOut(mesh(tubeOf([[0, yTop - 0.010, bandFront - 0.072], [-0.03, yTop + 0.03, bandFront - 0.086], [-0.05, yTop + 0.10, bandFront - 0.074]], 0.0052, 8, 6), MAT.rubber('#3a3d40'))));
    lamp.userData.breathe = { speed: 0.5, amount: 0.08, phase: i * 1.7 + (seed % 5) };
    weather(lamp, { w: 0.14, h: 0.05, pos: [lw * 0.2, yTop - 0.046, bandFront - 0.010], kind: 'dirt', color: '#6a6252', opacity: 0.45, seed: seed + 51 + i, density: 1.3, spread: 0.008 });
  });

  /* ================ 7. 吊り看板（季節 POP・帯下に 1 枚） ================ */
  const hang = grp('hanging-pop');
  hang.position.set(-0.135 * W, 0, bandFront - 0.058);
  g.add(hang);
  const hangY0 = bandBot - 0.024, hangH = 0.38, hangW = Math.min(0.80, W * 0.11);
  const hb = grp('pop-board');
  hb.position.set(0, hangY0 - hangH / 2 - 0.040, 0);
  hb.rotation.z = -1.6 * D2R;
  hang.add(hb);
  hb.add(mesh(rbox(hangW, hangH, 0.012, 0.004, 2), board, { pos: [0, 0, 0.008] }));
  hb.add(mesh(rbox(hangW, hangH, 0.012, 0.004, 2), MAT.hardPlastic('#ded9cb', { repeat: 3 }), { pos: [0, 0, -8e-3] }));
  decal(hb, { map: TEX.poster({ title: '春の味覚市', sub: '4/1 〜 4/14 新発売', bg: '#fdf3e2', accent: PAL.storeBand3, seed: seed + 61 }), w: hangW - 0.030, h: hangH - 0.030, pos: [0, 0, 0.0148] });
  decal(hb, { map: TEX.poster({ title: 'さくらだんご', sub: '店内調理・つぶあん', bg: '#f4efe3', accent: PAL.storeBand, seed: seed + 62 }), w: hangW - 0.040, h: hangH - 0.040, pos: [0, 0, -0.0148], rot: [0, Math.PI, 0], opacity: 0.94 });
  for (const sx of [-1, 1]) {
    hang.add(mesh(tubeOf([[sx * (hangW / 2 - 0.05), hangY0, 0.012], [sx * (hangW / 2 - 0.046), hangY0 - 0.050, 0.010]], 0.0028, 6, 5), MAT.stainless({ repeat: 8 })));
    hang.add(noOut(mesh(tor(0.008, 0.0022, 5, 10), MAT.stainless({ repeat: 8 }), { pos: [sx * (hangW / 2 - 0.05), hangY0 - 0.004, 0.012], rot: [Math.PI / 2, 0, 0], cast: false })));
    hang.add(noOut(mesh(cyl(0.0055, 0.0055, 0.022, 6), iron, { pos: [sx * (hangW / 2 - 0.05), hangY0 + 0.008, 0.012], cast: false })));
  }
  weather(hb, { w: hangW * 0.8, h: 0.07, pos: [0, -hangH / 2 + 0.038, 0.0150], kind: 'dirt', color: '#8d7f66', opacity: 0.5, seed: seed + 65, density: 1.5, spread: 0.01 });
  decal(hb, { map: TEX.gradient({ stops: [[0, 'rgba(255,232,180,1)'], [0.6, 'rgba(255,240,215,0.35)'], [1, 'rgba(255,255,255,0)']] }), w: hangW - 0.02, h: hangH - 0.02, pos: [0, 0, 0.0150], opacity: 0.38 });
  // 吊るし POP は「紙一枚が微風に揺れる」程度。amp はラジアンで、0.9 は約 51° の大振り
  // （全資産の sway が 0.001〜0.085 なのにここだけ桁違い）→ 看板が激しく動き回っていた。
  hang.userData.sway = { amp: 0.045, freq: 0.34, phase: (seed % 4) * 1.1, axis: 'z' };

  /* ================ 8. 屋根上面の経年（日焼け黄変・堆積） ================ */
  // 日焼け黄変（前端ほど色あせ：パネルに追従する小判で 3 帯）
  for (const [kf, op] of [[0.18, 0.30], [0.52, 0.24], [0.86, 0.20]]) {
    const z = zBack + span * kf;
    decal(roof, {
      map: TEX.gradient({ stops: [[0, 'rgba(255,220,146,1)'], [0.5, 'rgba(255,238,196,0.5)'], [1, 'rgba(255,250,235,0)']] }),
      w: PW * 2 - 0.06, h: span * 0.34, pos: [0, roofH(0, z) + 0.036, z], rot: [-Math.PI / 2, 0, 0], opacity: op,
    });
  }
  // 壁際（勾配で止まる）落ち葉・泥の堆積
  const litter = grp('roof-litter');
  g.add(litter);
  for (let i = 0; i < 18; i++) {
    const z = range(rnd, zBack + 0.03, zBack + 0.26 + rnd() * 0.24);
    const x = range(rnd, -PW + 0.12, PW - 0.12);
    const s = range(rnd, 0.022, 0.052);
    litter.add(noOut(mesh(leafGeo(s), MAT.leaf({ color: i % 4 === 0 ? '#a3854f' : '#7f6a45', tint: '#f0e3c6' }), {
      pos: [x, roofH(x, z) + 0.014 + rnd() * 0.008, z],
      rot: [range(rnd, -0.5, 0.5), range(rnd, 0, 6.28), range(rnd, -0.5, 0.5)], cast: false,
    })));
  }
  for (let i = 0; i < 3; i++) {
    const x0 = range(rnd, -PW + 0.5, PW - 0.7);
    litter.add(noOut(mesh(tubeOf([
      [x0, roofH(x0, zBack + 0.10) + 0.020, zBack + 0.10],
      [x0 + 0.10, roofH(x0 + 0.10, zBack + 0.17) + 0.024, zBack + 0.17],
      [x0 + 0.20, roofH(x0 + 0.20, zBack + 0.12) + 0.021, zBack + 0.12],
    ], 0.0042, 10, 5), MAT.bark({ base: PAL.trunk, repeat: 2 }))));
  }
  weather(litter, { w: W * 0.5, h: 0.28, pos: [W * 0.08, roofH(0, zBack + 0.14) + 0.018, zBack + 0.14], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6c54', opacity: 0.55, seed: seed + 71, density: 1.9, spread: 0.02 });
  weather(litter, { w: 1.3, h: 0.22, pos: [-W * 0.30, roofH(-W * 0.3, zBack + 0.18) + 0.018, zBack + 0.18], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#6d8a52', opacity: 0.5, seed: seed + 72, density: 1.5, spread: 0.012 });
  // 帯前面の退色・汚れ筋・補修（落書き消し）跡
  weather(bandG, { w: W * 0.5, h: 0.10, pos: [-W * 0.22, MB - 0.32, bandFront + 0.0034], kind: 'dirt', color: '#6b6555', opacity: 0.5, seed: seed + 81, density: 1.6, spread: 0.02 });
  weather(bandG, { w: 0.55, h: 0.24, pos: [W * 0.31, MB - 0.14, bandFront + 0.0036], kind: 'chip', color: '#e6e0d0', opacity: 0.42, seed: seed + 82, density: 1.2, spread: 0.01 });
  decal(bandG, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 83, density: 0.8 }), w: 0.62, h: 0.20, pos: [W * 0.31, MB - 0.13, bandFront + 0.0038], opacity: 0.34 });
  decal(bandG, { map: TEX.gradient({ stops: [[0, 'rgba(250,236,205,1)'], [1, 'rgba(255,255,255,0)']] }), w: W, h: BH, pos: [0, MB - BH / 2, bandFront + 0.0031], opacity: 0.22 });
  weather(cap, { w: W * 0.6, h: 0.05, pos: [W * 0.1, MB + 0.032, bandFront - 0.020], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7c7461', opacity: 0.5, seed: seed + 85, density: 1.6, spread: 0.02 });
  // 帯の留付リベット（等間隔・周囲に錆）
  for (let i = 0; i < 13; i++) {
    const x = -W / 2 + 0.25 + i * ((W - 0.5) / 12);
    bandG.add(noOut(mesh(cyl(0.0055, 0.0055, 0.006, 6), screwSt, { pos: [x, MB - 0.018, bandFront + 0.0032], rot: [Math.PI / 2, 0, 0], cast: false })));
    if (i % 4 === 1) weather(bandG, { w: 0.07, h: 0.05, pos: [x, MB - 0.036, bandFront + 0.0033], kind: 'rust', color: '#96602f', opacity: 0.45, seed: seed + 91 + i, density: 1.1, spread: 0.004 });
  }

  return finish(g, { outline: 'normal', minSize: 0.030 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
