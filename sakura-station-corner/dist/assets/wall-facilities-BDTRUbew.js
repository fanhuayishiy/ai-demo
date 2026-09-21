import { g as grp, M as MAT, P as PAL, T as TEX, G as put, m as mesh, b as box, c as cyl, i as grill, h as decal, w as weather, am as hoop, t as tor, r as rbox, k as tubeOf, a as sph, l as catenary, n as range, q as finish, z as rand } from './index-C4-XtFer.js';

//  assets/store/wall-facilities.js —— 店舗 背面・側面の壁面設備群（換気ガラリ・ダクト・配管・電気・点検口・照明）
//  原点 = 壁の取り付き面（local z=0）× 地面（y=0）の中心 / +Y 上 / 建物の外側が +Z
//  装配層は世界 (STORE.cx, 0, STORE.z0)・rotY=180 で置く（→ local +Z = 北＝外側、local +X = 西側）。
//  ※ 室外機（他資産）が local x∈[-1.74,-1.06]・[0.86,1.54] の帯（z 0.20〜0.48, y ≤ 0.58）を占有するため、
//     低所の配管・金物はそれ以外に配置している。span=6 → local x ∈ [-3.0, 3.0]。

const meta = {
  id: 'wall-facilities',
  real: [6.0, 3.02, 0.46],        // span=6 のとき（ダクト・配管の張り出しを含む）
  origin: 'wall-foot-center',     // 壁面 z=0 × 地面 y=0 の中心
  front: '+Z = 建物の外側',
};

const D2R = Math.PI / 180;
const noOut = (o) => { o.userData.noOutline = true; return o; };

function build(options = {}) {
  const seed = options.seed ?? 231;
  const rnd = rand(seed);
  const g = grp('wall-facilities');

  const span = Math.max(2.4, options.span ?? 6);
  const x0 = -span / 2, x1 = span / 2;
  const WALL_TOP = 3.00;                        // 女墙（他資産）の手前で終える

  /* ---------------- 材質（鋼・亜鉛・アルミ・塩ビ・ゴム・磁器・銅） ---------------- */
  const alu = MAT.metal('#ccd1d2', { spec: 0.6, repeat: 5 });
  const aluOld = MAT.metal('#b7bcbb', { worn: 0.8, repeat: 3, tint: '#efe8d2', sat: 0.92 });      // 黄変アルミ
  const galv = MAT.galvanized({ repeat: 4 });
  const galvRust = MAT.galvanized({ repeat: 3, worn: 0.95, tint: '#e2c9a8', sat: 1.06 });
  const iron = MAT.darkIron({ repeat: 6 });
  const steelPaint = MAT.metalPaint(PAL.storeWallTrim, { worn: 0.7, repeat: 3 });
  const pvc = MAT.plastic('#e8e5da', { steps: 3, spec: 0.3, specPower: 44, tint: '#f7f1de', sat: 0.96 });
  const pvcGrey = MAT.plastic('#c6c8c4', { steps: 3, spec: 0.26, tint: '#e8e4d2' });
  const pipeIron = MAT.metal('#8b7d72', { worn: 0.95, repeat: 3, spec: 0.4, tint: '#e7c9a4', sat: 1.1 });   // サビ鉄管
  const copper = MAT.metal('#b47a4c', { spec: 0.68, specPower: 110, repeat: 4 });
  const foam = MAT.rubber('#2f3235', { steps: 2 });                                                // 保温下地
  const foil = MAT.metal('#dfe2dd', { spec: 0.5, specPower: 90, repeat: 8, sheen: 0.1 });           // 保温巻アルミ
  const cable = MAT.rubber('#26292c', { steps: 2 });
  const cableGrey = MAT.rubber('#4d5158', { steps: 2 });
  const porcelain = MAT.paint('#cdc7b6', { spec: 0.46, specPower: 120, specCut: 0.14, shadowAmt: 0.6, steps: 3 });
  const deep = MAT.paint('#171918', { steps: 2, shadowAmt: 1, spec: 0.02 });
  const gasket = MAT.rubber('#22252a', { steps: 2 });
  const concrete = MAT.concrete({ base: PAL.concrete, repeat: 1, joints: 2 });
  const mortar = MAT.paint('#cfc8b7', { map: TEX.concrete({ base: '#d3ccbc', repeat: 1 }).map, spec: 0.05, shadowAmt: 0.94, steps: 3 });
  const coverResin = MAT.glassLite({ color: '#dfe7e6', opacity: 0.3 });
  const signPlate = MAT.paint(PAL.marking, { steps: 2, sat: 0.9, tint: '#f7f2e4' });
  const meshWire = MAT.metal('#b3b8b6', { worn: 0.62, repeat: 6 });

  /* ================= 汎用小物 ================= */
  const bolt = (parent, x, y, z, r = 0.0075, mat = MAT.stainless({ repeat: 8 })) => {
    parent.add(noOut(mesh(cyl(r, r, 0.008, 6), mat, { pos: [x, y, z], rot: [90 * D2R, 0, 0], cast: false })));
  };
  const wallClip = (parent, x, y, r, mat = galv) => {
    const c = put(grp('pipe-clip'), x, y, r + 0.016);
    parent.add(c);
    c.add(mesh(box(0.026, 0.022, 0.018), mat, { pos: [0, 0, -8e-3] }));
    c.add(noOut(mesh(tor(r + 0.004, 0.005, 5, 14, Math.PI * 1.25), mat, { rot: [0, 0, -0.4], cast: false })));
    bolt(c, 0, -0.018, -2e-3, 0.0055);
    return c;
  };

  /* ================= １. 換気口ガラリ（角型：アルミ羽根・防虫网・内部ダクト） ================= */
  const ventA = put(grp('louver-rect'), -2.5, 2.40, 0);
  g.add(ventA);
  const avW = 0.48, avH = 0.38;
  ventA.add(mesh(box(avW, avH, 0.014), alu, { pos: [0, 0, 0.008], cast: false }));
  ventA.add(mesh(box(avW + 0.030, 0.022, 0.070), alu, { pos: [0, avH / 2 + 0.011, 0.034] }));
  ventA.add(mesh(box(avW + 0.030, 0.022, 0.070), alu, { pos: [0, -avH / 2 - 0.011, 0.034] }));
  for (const sx of [-1, 1]) ventA.add(mesh(box(0.022, avH + 0.044, 0.070), alu, { pos: [sx * (avW / 2 + 0.011), 0, 0.034] }));
  ventA.add(mesh(box(avW - 0.02, avH - 0.02, 0.008), deep, { pos: [0, 0, 0.016], cast: false }));                     // 内部の暗がり
  ventA.add(mesh(cyl(0.108, 0.108, 0.11, 16), galv, { pos: [0.03, 0, -0.026], rot: [90 * D2R, 0, 0] }));               // 内部ダクト
  noOut(grill(ventA, { w: avW - 0.03, h: avH - 0.03, nx: 11, ny: 5, bar: 0.0026, mat: meshWire, pos: [0, 0, 0.021] })); // 防虫网
  for (let i = 0; i < 6; i++) {                                                                                        // 羽根
    const y = -avH / 2 + 0.040 + i * ((avH - 0.080) / 5);
    ventA.add(mesh(box(avW - 0.038, 0.042, 0.010), alu, { pos: [0, y, 0.038 + (i === 3 ? 0.010 : 0)], rot: [0.72 + (i === 3 ? -0.22 : 0), 0, 0] }));
  }
  for (const [bx, by] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    bolt(ventA, bx * (avW / 2 + 0.006), by * (avH / 2 + 0.006), 0.070, 0.0068);
  }
  decal(ventA, { map: TEX.gradient({ stops: [[0, 'rgba(255,235,186,1)'], [1, 'rgba(240,228,196,0)']] }), w: avW + 0.05, h: avH + 0.06, pos: [0, 0, 0.073], opacity: 0.44 });
  weather(ventA, { w: avW * 0.7, h: 0.07, pos: [0, -avH / 2 - 0.010, 0.052], kind: 'dirt', color: '#6b6152', opacity: 0.6, seed: seed + 201, density: 2.1, spread: 0.005 });
  weather(ventA, { w: 0.10, h: 0.10, pos: [avW * 0.34, avH * 0.2, 0.073], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 202, spread: 0.005 });

  /* ================= ２. 換気口ガラリ（丸型排気＋防水フード：突き当たりの排気） ================= */
  const ventB = put(grp('exhaust-round'), 2.30, 1.94, 0);
  g.add(ventB);
  ventB.add(mesh(cyl(0.152, 0.152, 0.020, 22), aluOld, { pos: [0, 0, 0.012], rot: [90 * D2R, 0, 0] }));
  ventB.add(mesh(cyl(0.112, 0.112, 0.14, 20, true), aluOld, { pos: [0, 0, 0.078], rot: [90 * D2R, 0, 0] }));
  ventB.add(mesh(cyl(0.100, 0.100, 0.010, 20), deep, { pos: [0, 0, 0.030], rot: [90 * D2R, 0, 0], cast: false }));
  noOut(grill(ventB, { w: 0.18, h: 0.18, nx: 8, ny: 8, bar: 0.0024, mat: meshWire, pos: [0, 0, 0.040] }));
  const hood = put(grp('weather-hood'), 0, 0.138, 0.088);
  ventB.add(hood);
  hood.add(mesh(cyl(0.158, 0.100, 0.062, 20), aluOld));
  hood.add(noOut(hoop(0.158, 0.008, aluOld, { pos: [0, -0.03, 0], rot: [90 * D2R, 0, 0], cast: false })));
  hood.add(mesh(cyl(0.020, 0.020, 0.056, 10), galv, { pos: [0, 0.046, -0.032], rot: [90 * D2R, 0, 0] }));
  for (let i = 0; i < 3; i++) hood.add(noOut(mesh(box(0.004, 0.030, 0.150), galv, { pos: [-0.05 + i * 0.05, -0.058, 0.004], cast: false })));   // 鳥よけ
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    ventB.add(mesh(box(0.014, 0.014, 0.058), galv, { pos: [Math.cos(a) * 0.118, Math.sin(a) * 0.118, 0.030], rot: [0, 0, a] }));
    bolt(ventB, Math.cos(a) * 0.118, Math.sin(a) * 0.118, 0.062, 0.006);
  }
  weather(ventB, { w: 0.20, h: 0.10, pos: [0, -0.168, 0.030], kind: 'rust', color: '#8a5236', opacity: 0.5, seed: seed + 205, density: 1.8, spread: 0.006 });
  // 温風による壁の退色・塗装の浮き
  const stain = put(grp('warm-air-stain'), 2.30, 0, 0);
  g.add(stain);
  decal(stain, { map: TEX.gradient({ stops: [[0, 'rgba(224,206,168,0)'], [0.35, 'rgba(229,209,166,1)'], [1, 'rgba(214,196,158,0)']] }), w: 1.10, h: 1.62, pos: [0, 1.00, 0.012], opacity: 0.5 });
  weather(stain, { w: 0.7, h: 1.1, pos: [0.02, 0.84, 0.010], kind: 'dirt', color: '#8b8171', opacity: 0.3, seed: seed + 207, density: 1.5, spread: 0.03 });
  weather(stain, { w: 0.34, h: 0.24, pos: [0, 1.62, 0.011], kind: 'chip', color: '#e6dfcb', opacity: 0.42, seed: seed + 208, density: 1.4, spread: 0.02 });

  /* ================= ３. ダクト（巻板・継手・支持金物・保温剥がれ・ドレン受け） ================= */
  const duct = grp('duct-run');
  g.add(duct);
  const dY = 2.70, dZ = 0.215, dR = 0.132;
  const dFrom = -2.06, dTo = 0.60;
  const dSegs = 8, dStep = (dTo - dFrom) / dSegs;
  for (let i = 0; i < dSegs; i++) {
    const cx = dFrom + (i + 0.5) * dStep;
    duct.add(mesh(cyl(dR, dR, dStep - 0.014, 20), foil, { pos: [cx, dY, dZ], rot: [0, 0, 90 * D2R] }));          // 巻板（1 節ずつ独立）
    duct.add(noOut(hoop(dR + 0.002, 0.0035, alu, { pos: [cx, dY, dZ], rot: [0, Math.PI / 2, 0], cast: false })));  // 長手シーム
  }
  for (let i = 1; i < dSegs; i++) {                                                                              // 継手
    const x = dFrom + i * dStep;
    duct.add(noOut(mesh(cyl(dR + 0.011, dR + 0.011, 0.052, 20), alu, { pos: [x, dY, dZ], rot: [0, 0, 90 * D2R], cast: false })));
    duct.add(noOut(hoop(dR + 0.014, 0.004, galv, { pos: [x + 0.028, dY, dZ], rot: [0, Math.PI / 2, 0], cast: false })));
  }
  for (const bx of [dFrom + 0.40, -0.4]) {                                                                      // 支持金物
    const br = put(grp('duct-bracket'), bx, dY, dZ);
    duct.add(br);
    br.add(noOut(mesh(tor(dR + 0.017, 0.009, 5, 18, Math.PI * 1.1), galv, { rot: [0, Math.PI / 2, 0], cast: false })));
    br.add(mesh(box(0.026, 0.020, 0.132), galv, { pos: [0, -0.02, -0.072] }));
    br.add(mesh(box(0.030, 0.150, 0.010), galv, { pos: [0, -0.08, -0.136] }));
    bolt(br, 0.011, -0.142, -0.146, 0.0062, galv);
    bolt(br, -0.011, -0.012, -0.146, 0.0062, galv);
    weather(br, { w: 0.07, h: 0.10, pos: [0, -0.152, -0.128], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 211 + Math.round(bx * 10), density: 1.8, spread: 0.005 });
  }
  // 保温巻の剥がれ（アルミがめくれて黒い下地が覗く）
  const tear = put(grp('insulation-tear'), -1.2, dY, dZ);
  duct.add(tear);
  tear.add(mesh(cyl(dR - 0.003, dR - 0.003, 0.24, 18), foam, { rot: [0, 0, 90 * D2R] }));
  tear.add(noOut(mesh(cyl(dR + 0.012, dR + 0.012, 0.10, 18, true), foil, { pos: [-0.12, 0, 0], rot: [0, 0, 90 * D2R], cast: false })));
  tear.add(noOut(mesh(box(0.13, 0.003, 0.16), foil, { pos: [-0.19, 0.078, 0.062], rot: [0.5, 0.2, -0.35] })));
  tear.add(noOut(mesh(box(0.09, 0.003, 0.13), foil, { pos: [0.06, -0.1, 0.074], rot: [-0.6, 0.1, 0.4] })));
  weather(tear, { w: 0.26, h: 0.16, pos: [-0.04, 0.05, dR - 0.01], kind: 'dirt', color: '#4b4a44', opacity: 0.45, seed: seed + 214, density: 1.6, spread: 0.015 });
  // 末端の立ち下がり＋壁面吸込フード
  duct.add(mesh(cyl(dR, dR, 0.30, 20), foil, { pos: [dTo, dY - 0.15, dZ] }));
  duct.add(noOut(mesh(cyl(dR + 0.011, dR + 0.011, 0.05, 20), alu, { pos: [dTo, dY - 0.30, dZ], cast: false })));
  duct.add(mesh(box(0.30, 0.26, 0.014), alu, { pos: [dTo, dY - 0.44, 0.012] }));
  noOut(grill(duct, { w: 0.24, h: 0.19, nx: 7, ny: 5, bar: 0.0026, mat: meshWire, pos: [dTo, dY - 0.44, 0.022] }));
  duct.add(mesh(box(0.34, 0.014, 0.09), alu, { pos: [dTo, dY - 0.30, 0.048], rot: [0.30, 0, 0] }));                 // 雨じまい
  // ドレン受け（トレイ＋ホース＋支持）
  const pan = put(grp('drain-tray'), -0.08, dY - 0.17, dZ);
  duct.add(pan);
  pan.add(mesh(rbox(0.30, 0.016, 0.22, 0.005, 2), galv, { pos: [0, 0, -6e-3] }));
  pan.add(mesh(box(0.30, 0.05, 0.008), galv, { pos: [0, 0.026, 0.10] }));
  for (const sx of [-1, 1]) pan.add(mesh(box(0.008, 0.05, 0.22), galv, { pos: [sx * 0.15, 0.026, -6e-3] }));
  pan.add(mesh(cyl(0.011, 0.011, 0.02, 10), deep, { pos: [0.10, -0.012, 0.05], cast: false }));
  pan.add(mesh(tubeOf([[0.10, -0.024, 0.05], [0.13, -0.44, 0.09], [0.11, -1.1, 0.11], [0.13, -1.8, 0.10], [0.15, -2.42, 0.09]], 0.0105, 24, 7), MAT.rubber('#3a3d40')));
  for (const sx of [-1, 1]) pan.add(mesh(box(0.012, 0.11, 0.012), galv, { pos: [sx * 0.13, 0.060, -0.09] }));
  weather(pan, { w: 0.22, h: 0.05, pos: [0, 0.012, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#5f7f4a', opacity: 0.55, seed: seed + 217, density: 1.8, spread: 0.004 });
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#5b6a55', seed: seed + 218, density: 1.5 }), w: 0.30, h: 0.9, pos: [0.05, 0.55, 0.014], opacity: 0.4 });   // ホースの水筋

  /* ================= ４. 給排水管（塩ビ・錆鉄・バルブ・凍結防止巻・水漏れ・苔） ================= */
  const pipes = grp('pipes');
  g.add(pipes);
  // (a) 塩ビ排水立管 x=-0.40
  const px = -0.4, pR = 0.062;
  pipes.add(mesh(cyl(pR, pR, 2.18, 18), pvc, { pos: [px, 0.26 + 1.09, 0.116] }));
  for (const y of [0.46, 1.22, 1.94]) wallClip(pipes, px, y, pR);
  for (const y of [0.86, 1.60]) pipes.add(noOut(mesh(cyl(pR + 0.009, pR + 0.009, 0.058, 18), pvc, { pos: [px, y, 0.116], cast: false })));   // 差込継手
  pipes.add(noOut(mesh(cyl(pR + 0.013, pR + 0.013, 0.022, 18), pvcGrey, { pos: [px, 2.45, 0.116], cast: false })));                            // 受口
  pipes.add(mesh(box(0.15, 0.15, 0.016), pvcGrey, { pos: [px, 2.52, 0.116], rot: [0, 0, 0.02] }));                                             // 頂部点検口（ねじ込み盖）
  pipes.add(mesh(cyl(0.034, 0.034, 0.024, 14), pvcGrey, { pos: [px, 2.52, 0.198], rot: [90 * D2R, 0, 0] }));
  for (let i = 0; i < 6; i++) pipes.add(noOut(mesh(box(0.128, 0.006, 0.006), pvcGrey, { pos: [px, 2.52 - 0.06 + i * 0.024, 0.210], cast: false })));
  pipes.add(noOut(mesh(tor(0.10, pR * 0.92, 6, 18, Math.PI), pvc, { pos: [px + 0.10, 0.258, 0.116], rot: [0, 0, -Math.PI / 2], cast: false })));   // トラップ
  pipes.add(mesh(cyl(pR * 0.9, pR * 0.9, 0.20, 16), pvc, { pos: [px + 0.20, 0.16, 0.116] }));
  pipes.add(noOut(mesh(cyl(pR + 0.012, pR + 0.012, 0.026, 16), pvcGrey, { pos: [px + 0.20, 0.068, 0.116], cast: false })));                        // 排水口
  pipes.add(mesh(box(0.20, 0.030, 0.16), concrete, { pos: [px + 0.20, 0.014, 0.116] }));                                                          // 水受け小基礎
  weather(pipes, { w: 0.10, h: 1.30, pos: [px + 0.02, 1.28, 0.014], kind: 'dirt', color: '#6e7a68', opacity: 0.42, seed: seed + 221, density: 1.2, spread: 0.02 });
  weather(pipes, { w: 0.46, h: 0.20, pos: [px + 0.10, 0.07, 0.016], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 222, density: 1.9, spread: 0.01 });
  decal(pipes, { map: TEX.wear({ kind: 'dirt', color: '#5d6a58', seed: seed + 223, density: 1.4 }), w: 0.36, h: 0.30, pos: [px + 0.20, 0.026, 0.24], rot: [-Math.PI / 2, 0, 0], opacity: 0.5 });
  // 細管 2 本（塩ビ＋銅、並走）
  for (const [sx, r, mm] of [[-0.05, 0.024, pvc], [0.05, 0.020, copper]]) {
    pipes.add(mesh(cyl(r, r, 1.30, 14), mm, { pos: [px + 0.30 + sx, 1.34, 0.152] }));
    pipes.add(noOut(mesh(cyl(r + 0.008, r + 0.008, 0.030, 14), mm, { pos: [px + 0.30 + sx, 1.06, 0.152], cast: false })));
    wallClip(pipes, px + 0.30 + sx, 1.72, r, galv);
  }
  // (b) サビ鉄管（給水：x 1.66 → 2.92, y=0.60）＋フランジ・バルブ・凍結防止巻
  const iY = 0.60, iR = 0.036, iFrom = 1.66, iTo = 2.92;
  pipes.add(mesh(cyl(iR, iR, iTo - iFrom, 16), pipeIron, { pos: [(iFrom + iTo) / 2, iY, 0.104], rot: [0, 0, 90 * D2R] }));
  pipes.add(mesh(cyl(iR, iR, 0.34, 16), pipeIron, { pos: [iFrom, iY - 0.17, 0.104] }));
  pipes.add(noOut(mesh(tor(0.085, iR * 0.9, 6, 14, Math.PI * 0.92), pipeIron, { pos: [iFrom + 0.085, iY - 0.010, 0.104], rot: [0, Math.PI / 2, 0], cast: false })));
  for (const x of [iFrom + 0.18, iFrom + 0.74, iTo - 0.12]) {
    pipes.add(noOut(mesh(cyl(iR + 0.015, iR + 0.015, 0.030, 16), pipeIron, { pos: [x, iY, 0.104], rot: [0, 0, 90 * D2R], cast: false })));   // フランジ
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      pipes.add(noOut(mesh(cyl(0.005, 0.005, 0.018, 6), iron, { pos: [x, iY + Math.cos(a) * (iR + 0.008), 0.104 + Math.sin(a) * (iR + 0.008)], rot: [90 * D2R, 0, 0], cast: false })));
    }
    wallClip(pipes, x, iY, iR, galvRust);
  }
  const valve = put(grp('valve'), iFrom + 0.46, iY, 0.104);
  pipes.add(valve);
  valve.add(mesh(cyl(iR + 0.021, iR + 0.021, 0.060, 14), pipeIron));
  valve.add(mesh(cyl(0.011, 0.011, 0.088, 10), iron, { pos: [0, 0.058, 0] }));
  valve.add(noOut(mesh(tor(0.058, 0.008, 5, 18), MAT.paint(PAL.storeBand3, { steps: 3, sat: 0.86, tint: '#f4d8cc' }), { pos: [0, 0.100, 0], rot: [-Math.PI / 2, 0, 0], cast: false })));   // 赤手輪
  for (let k = 0; k < 4; k++) valve.add(noOut(mesh(box(0.116, 0.007, 0.009), MAT.paint(PAL.storeBand3, { steps: 3, sat: 0.86 }), { pos: [0, 0.100, 0], rot: [0, (k / 4) * Math.PI * 2, 0], cast: false })));
  valve.add(mesh(cyl(0.016, 0.016, 0.016, 10), iron, { pos: [0, 0.108, 0] }));
  weather(valve, { w: 0.14, h: 0.17, pos: [0, -0.062, 0.02], kind: 'rust', color: PAL.rust, opacity: 0.66, seed: seed + 226, density: 2.2, spread: 0.008 });
  weather(pipes, { w: 0.16, h: 0.44, pos: [iFrom + 0.46, iY - 0.30, 0.016], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 227, density: 1.6, spread: 0.012 });   // 水漏れ跡
  // 凍結防止巻のほどけ（保温・アルミテープ捲れ・電源リード）
  const wrap = put(grp('heat-wrap'), iFrom + 0.92, iY, 0.104);
  pipes.add(wrap);
  wrap.add(mesh(cyl(iR + 0.020, iR + 0.020, 0.60, 16), foam, { rot: [0, 0, 90 * D2R] }));
  wrap.add(mesh(cyl(iR + 0.028, iR + 0.028, 0.38, 16), foil, { pos: [-0.11, 0, 0], rot: [0, 0, 90 * D2R] }));
  wrap.add(noOut(mesh(box(0.16, 0.003, 0.10), foil, { pos: [0.15, 0.050, 0.056], rot: [0.55, 0.2, -0.5] })));
  wrap.add(noOut(mesh(box(0.10, 0.003, 0.08), foil, { pos: [0.23, -0.03, 0.060], rot: [-0.7, 0.1, 0.6] })));
  wrap.add(noOut(mesh(cyl(iR + 0.004, iR + 0.004, 0.16, 14), foam, { pos: [0.24, 0, 0], rot: [0, 0, 90 * D2R], cast: false })));
  wrap.add(noOut(mesh(tubeOf([[0.30, 0.02, 0.03], [0.38, 0.10, 0.06], [0.42, 0.30, 0.07], [0.38, 0.52, 0.05]], 0.0052, 14, 6), cable, { cast: false })));
  weather(wrap, { w: 0.34, h: 0.12, pos: [0, -0.052, 0.048], kind: 'dirt', color: '#6b6152', opacity: 0.5, seed: seed + 229, density: 1.8, spread: 0.008 });

  /* ================= ５. 電気メーター箱＋幹線引き込み＋アース ================= */
  const elec = grp('meter');
  g.add(elec);
  const mx = -1.96, my = 1.42;
  elec.add(mesh(rbox(0.52, 0.66, 0.132, 0.010, 2), galv, { pos: [mx, my, 0.070], name: 'meter-box' }));
  elec.add(mesh(box(0.56, 0.016, 0.166), galv, { pos: [mx, my + 0.340, 0.074] }));                      // 屋根
  elec.add(mesh(box(0.46, 0.010, 0.030), galv, { pos: [mx, my - 0.336, 0.132], rot: [0.3, 0, 0] }));      // 水切
  elec.add(mesh(box(0.42, 0.52, 0.008), deep, { pos: [mx, my, 0.128], cast: false }));
  for (let i = 0; i < 2; i++) {                                                                          // メーター 2 灯
    const yy = my - 0.12 + i * 0.24;
    elec.add(noOut(mesh(cyl(0.086, 0.086, 0.014, 22), MAT.paint('#eeeade', { steps: 2, sat: 0.86, tint: '#f7f2e2' }), { pos: [mx - 0.06, yy, 0.136], rot: [90 * D2R, 0, 0], cast: false })));
    elec.add(noOut(mesh(cyl(0.080, 0.080, 0.004, 22), MAT.paint('#2b2f33', { steps: 2 }), { pos: [mx - 0.06, yy, 0.145], rot: [90 * D2R, 0, 0], cast: false })));
    elec.add(noOut(mesh(box(0.003, 0.052, 0.004), MAT.paint('#e9e4d6', { steps: 2 }), { pos: [mx - 0.06, yy + 0.016, 0.148], rot: [0, 0, (i ? -0.9 : 0.6)], cast: false })));
    elec.add(noOut(mesh(sph(0.0055, 8, 6), MAT.ledOn('#e05a4a'), { pos: [mx + 0.10, yy, 0.147], cast: false })));
    elec.add(mesh(box(0.17, 0.010, 0.010), iron, { pos: [mx - 0.06, yy - 0.10, 0.140] }));                // 銘板押え
  }
  elec.add(mesh(box(0.44, 0.54, 0.006), coverResin, { pos: [mx, my, 0.150], cast: false, receive: false }));   // 樹脂カバー
  for (const dy of [0.28, -0.28]) elec.add(mesh(box(0.44, 0.022, 0.014), alu, { pos: [mx, my + dy, 0.156] }));
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) bolt(elec, mx + sx * 0.24, my + sy * 0.30, 0.142, 0.0072);
  elec.add(mesh(cyl(0.030, 0.030, 0.050, 14), pvcGrey, { pos: [mx, my - 0.352, 0.070] }));                    // 下部導管受口
  // 碍子（磁器がい・金具）と幹線
  const insulator = (x, y) => {
    const it = put(grp('insulator'), x, y, 0.026);
    elec.add(it);
    it.add(mesh(box(0.058, 0.058, 0.026), galv, { pos: [0, 0, -0.01] }));
    it.add(mesh(cyl(0.026, 0.030, 0.058, 14), porcelain, { pos: [0, 0, 0.030], rot: [90 * D2R, 0, 0] }));
    for (const dz of [0.016, 0.036, 0.056]) it.add(noOut(hoop(0.030, 0.0044, porcelain, { pos: [0, 0, dz], cast: false })));
    return it;
  };
  const iA = insulator(mx - 0.16, WALL_TOP - 0.12);
  const iB = insulator(mx + 0.16, WALL_TOP - 0.12);
  insulator(mx, my + 0.42);
  for (let k = 0; k < 3; k++) {
    const off = (k - 1) * 0.026;
    elec.add(noOut(mesh(tubeOf(catenary([mx - 0.16 + off, WALL_TOP - 0.16, 0.062], [mx - 0.02 + off * 0.4, my + 0.44, 0.062], 0.05, 14), 0.0088, 16, 6), k === 1 ? cableGrey : cable, { cast: false })));
    iA.add(noOut(mesh(cyl(0.006, 0.006, 0.030, 6), iron, { pos: [off, -0.03, 0.060], cast: false })));
  }
  elec.add(noOut(mesh(tubeOf(catenary([mx + 0.16, WALL_TOP - 0.16, 0.062], [mx + 0.06, my + 0.44, 0.062], 0.06, 14), 0.0092, 16, 6), cable, { cast: false })));
  iB.add(noOut(mesh(cyl(0.006, 0.006, 0.030, 6), iron, { pos: [0, -0.03, 0.060], cast: false })));
  elec.add(mesh(box(0.30, 0.018, 0.018), galv, { pos: [mx, my + 0.40, 0.058] }));                              // ケーブル押え金物
  // アース（黄緑線・標識・接地ボルト・小基礎）
  const gr = grp('earth');
  g.add(gr);
  const ex = mx - 0.30;
  gr.add(noOut(mesh(tubeOf([[ex, my - 0.30, 0.104], [ex - 0.03, 1.00, 0.100], [ex - 0.01, 0.44, 0.096], [ex, 0.08, 0.094]], 0.0075, 26, 6), MAT.paint('#7f9a5e', { steps: 2, spec: 0.14, sat: 1.1 }), { cast: false })));
  gr.add(mesh(box(0.09, 0.09, 0.008), signPlate, { pos: [ex + 0.13, 0.42, 0.012] }));
  decal(gr, { map: TEX.signboard({ text: 'アース', sub: 'D種 接地', bg: '#f3f0e4', fg: '#3f4a52', ar: 1 }), w: 0.078, h: 0.078, pos: [ex + 0.13, 0.42, 0.017] });
  gr.add(mesh(cyl(0.0088, 0.0088, 0.030, 8), copper, { pos: [ex, 0.08, 0.094], rot: [90 * D2R, 0, 0] }));
  gr.add(mesh(cyl(0.014, 0.014, 0.008, 6), galv, { pos: [ex, 0.08, 0.114], rot: [90 * D2R, 0, 0] }));
  gr.add(mesh(box(0.07, 0.030, 0.06), concrete, { pos: [ex, 0.015, 0.10] }));
  decal(elec, { map: TEX.signboard({ text: 'さわるな！ 電気', sub: '中部電気', bg: PAL.markingYellow, fg: '#4a4033' }), w: 0.15, h: 0.062, pos: [mx + 0.15, my + 0.21, 0.142], rot: [0, 0, 3 * D2R] });
  weather(elec, { w: 0.50, h: 0.16, pos: [mx, my - 0.30, 0.142], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 241, density: 1.8, spread: 0.01 });
  weather(elec, { w: 0.42, h: 0.50, pos: [mx, my + 0.18, 0.140], kind: 'chip', color: '#a9a292', opacity: 0.32, seed: seed + 242, density: 1.2, spread: 0.02 });
  decal(elec, { map: TEX.gradient({ stops: [[0, 'rgba(255,238,196,1)'], [1, 'rgba(255,238,196,0)']] }), w: 0.44, h: 0.54, pos: [mx, my, 0.1445], opacity: 0.34 });   // カバー黄変

  /* ================= ６. 外壁の点検口（鍵・蝶番・パッキン）＋配線ダクト ================= */
  const hatch = grp('hatch');
  const hx = 1.24, hy = 1.06, hW = 0.54, hH = 0.46;
  g.add(hatch);
  hatch.add(mesh(box(hW + 0.05, hH + 0.05, 0.014), steelPaint, { pos: [hx, hy, 0.008], cast: false }));
  hatch.add(mesh(box(hW + 0.05, hH + 0.05, 0.008), gasket, { pos: [hx, hy, 0.016], cast: false }));                 // パッキン
  hatch.add(mesh(rbox(hW, hH, 0.018, 0.004, 2), steelPaint, { pos: [hx, hy, 0.030], name: 'hatch-lid' }));
  for (const dy of [0.10, -0.1]) hatch.add(mesh(box(hW - 0.06, 0.010, 0.006), steelPaint, { pos: [hx, hy + dy, 0.040] }));
  for (const dy of [-0.15, 0.15]) {                                                                                 // 蝶番
    hatch.add(mesh(box(0.020, 0.058, 0.022), galv, { pos: [hx - hW / 2 - 0.004, hy + dy, 0.032] }));
    hatch.add(mesh(cyl(0.0072, 0.0072, 0.062, 10), iron, { pos: [hx - hW / 2 - 0.004, hy + dy, 0.032] }));
  }
  hatch.add(mesh(rbox(0.056, 0.062, 0.016, 0.005, 2), iron, { pos: [hx + hW / 2 - 0.055, hy, 0.042] }));             // 錠前
  hatch.add(mesh(cyl(0.010, 0.010, 0.010, 12), MAT.metal('#a9a5a0', { repeat: 7 }), { pos: [hx + hW / 2 - 0.055, hy, 0.052], rot: [90 * D2R, 0, 0] }));
  hatch.add(mesh(box(0.005, 0.016, 0.006), deep, { pos: [hx + hW / 2 - 0.055, hy, 0.058] }));                        // 鍵穴
  hatch.add(mesh(box(0.058, 0.014, 0.016), alu, { pos: [hx + hW / 2 - 0.055, hy - 0.062, 0.046] }));                  // 抓み
  for (const [sx, sy] of [[1, 1], [1, -1]]) bolt(hatch, hx + sx * (hW / 2 - 0.04), hy + sy * (hH / 2 - 0.04), 0.040, 0.006);
  weather(hatch, { w: 0.16, h: 0.10, pos: [hx + hW * 0.30, hy - hH * 0.40, 0.040], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 251, density: 2.0, spread: 0.006 });
  weather(hatch, { w: 0.20, h: 0.12, pos: [hx - 0.08, hy + 0.12, 0.040], kind: 'scratch', color: '#efe9dc', opacity: 0.4, seed: seed + 252, density: 1.6, spread: 0.006 });
  decal(hatch, { map: TEX.signboard({ text: '点検口', sub: '関係者以外 開閉禁止', bg: '#f2eee1', fg: '#465058' }), w: 0.19, h: 0.062, pos: [hx - 0.06, hy + 0.02, 0.040], opacity: 0.9 });

  // 配線ダクト（塩ビトラッキング：蓋セグメント・目地・支持金物・こぼれたケーブル）
  const trk = grp('trunking');
  g.add(trk);
  const tY = 1.62, tZ = 0.062, tH = 0.058;
  const segFrom = 0.60, segTo = x1 - 0.10, nT = 8, tStep = (segTo - segFrom) / nT;
  for (let i = 0; i < nT; i++) {
    const cx = segFrom + (i + 0.5) * tStep;
    trk.add(mesh(box(tStep - 0.008, tH, tZ * 2), pvcGrey, { pos: [cx, tY, tZ] }));
    trk.add(noOut(mesh(box(0.006, tH + 0.004, tZ * 2 + 0.006), MAT.paint('#b3b5ad', { steps: 2 }), { pos: [cx + tStep / 2, tY, tZ], cast: false })));
    if (i % 3 === 1) trk.add(mesh(box(0.026, 0.018, 0.020), galv, { pos: [cx, tY, 0.002] }));
  }
  trk.add(mesh(rbox(0.10, tH + 0.006, tZ * 2 + 0.008, 0.012, 2), pvc, { pos: [segFrom - 0.02, tY, tZ] }));            // 端蓋（elbow 風）
  trk.add(mesh(rbox(0.10, tH + 0.006, tZ * 2 + 0.008, 0.012, 2), pvc, { pos: [segTo + 0.02, tY, tZ] }));
  trk.add(noOut(mesh(tubeOf([[segFrom + 0.10, tY - tH / 2, tZ + 0.02], [segFrom + 0.16, tY - 0.28, tZ + 0.06], [segFrom + 0.11, tY - 0.54, tZ + 0.03]], 0.0068, 14, 6), cable, { cast: false })));
  trk.add(noOut(mesh(tubeOf([[2.02, tY - tH / 2, tZ + 0.02], [2.08, tY - 0.34, tZ + 0.07], [2.02, tY - 0.60, tZ + 0.02]], 0.0058, 14, 6), cableGrey, { cast: false })));
  // メーター箱からダクトへ（金属フレキ管：配管の上をまたぐ）
  const flexPts = [[mx + 0.12, my + 0.35, 0.245], [mx + 0.20, my + 0.56, 0.245], [0.28, tY + 0.04, 0.245], [segFrom - 0.04, tY, 0.10]];
  trk.add(mesh(tubeOf(flexPts, 0.019, 30, 10), galv));
  for (let k = 0; k < 15; k++) {
    const t = 0.06 + (k / 14) * 0.86;
    const a = flexPts[1], b = flexPts[2];
    trk.add(noOut(hoop(0.021, 0.0032, galv, { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.245], rot: [0, 90 * D2R, 0], cast: false })));
  }
  for (const t of [0.3, 0.72]) {
    const a = flexPts[1], b = flexPts[2];
    const fx = a[0] + (b[0] - a[0]) * t, fy = a[1] + (b[1] - a[1]) * t;
    trk.add(mesh(box(0.024, 0.020, 0.20), galv, { pos: [fx, fy - 0.030, 0.146] }));
  }
  weather(trk, { w: 0.9, h: 0.06, pos: [1.70, tY + tH / 2 + 0.005, tZ + 0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7d7566', opacity: 0.45, seed: seed + 255, density: 1.8, spread: 0.01 });
  decal(trk, { map: TEX.gradient({ stops: [[0, 'rgba(250,240,210,1)'], [1, 'rgba(236,226,196,0)']] }), w: segTo - segFrom, h: 0.12, pos: [(segFrom + segTo) / 2, tY + 0.02, tZ * 2 + 0.004], opacity: 0.4 });

  /* ================= ７. 突き当たり排気（床際）・防犯センサー・照明 ================= */
  const exhaust = put(grp('floor-exhaust'), 0.34, 0.20, 0);
  g.add(exhaust);
  exhaust.add(mesh(box(0.34, 0.20, 0.026), aluOld, { pos: [0, 0, 0.016] }));
  noOut(grill(exhaust, { w: 0.28, h: 0.14, nx: 9, ny: 3, bar: 0.0032, mat: MAT.metal('#a7aca9', { worn: 0.7, repeat: 6 }), pos: [0, 0, 0.031] }));
  exhaust.add(mesh(box(0.38, 0.014, 0.09), alu, { pos: [0, 0.112, 0.044], rot: [0.36, 0, 0] }));
  exhaust.add(mesh(cyl(0.062, 0.062, 0.10, 16), galv, { pos: [0, -0.02, -0.028], rot: [90 * D2R, 0, 0] }));
  for (const sx of [-1, 1]) bolt(exhaust, sx * 0.14, 0, 0.032, 0.0062);
  weather(exhaust, { w: 0.24, h: 0.10, pos: [0, -0.135, 0.034], kind: 'rust', color: '#8a5236', opacity: 0.55, seed: seed + 271, density: 2.0, spread: 0.006 });
  decal(g, { map: TEX.gradient({ stops: [[0, 'rgba(226,208,170,0)'], [0.4, 'rgba(230,212,174,1)'], [1, 'rgba(220,202,166,0)']] }), w: 0.7, h: 0.9, pos: [0.34, 0.42, 0.011], opacity: 0.42 });   // 温風退色

  // 防犯センサー（ダブル PIR：本体・レンズ・LED 呼吸）
  const pir = put(grp('pir-sensor'), 2.74, 2.60, 0);
  g.add(pir);
  pir.add(mesh(box(0.10, 0.036, 0.028), steelPaint, { pos: [0, 0, 0.018] }));
  const head = put(grp('pir-head'), 0.058, 0.012, 0.046);
  head.rotation.set(0, -0.42, 0.20);
  pir.add(head);
  head.add(mesh(rbox(0.062, 0.058, 0.072, 0.014, 2), MAT.hardPlastic('#eee8d8', { worn: 0.5, steps: 3 })));
  head.add(noOut(mesh(cyl(0.017, 0.017, 0.012, 14), MAT.glassLite({ color: '#e8dfd0', opacity: 0.45 }), { pos: [0.030, -4e-3, 0], rot: [0, Math.PI / 2, 0], cast: false })));
  const pirLed = put(grp('pir-led'), 0.020, -0.028, 0.028);
  head.add(pirLed);
  pirLed.add(noOut(mesh(sph(0.0048, 8, 6), MAT.ledOn('#8ce08f'), { cast: false })));
  pirLed.userData.breathe = { speed: 0.9, amount: 0.5, phase: seed % 7 };
  pir.add(mesh(cyl(0.012, 0.012, 0.050, 12), steelPaint, { pos: [0.010, 0, 0.050], rot: [90 * D2R, 0, 0] }));
  bolt(pir, -0.034, 0.012, 0.032, 0.006);
  weather(pir, { w: 0.09, h: 0.06, pos: [0.05, -0.036, 0.052], kind: 'dirt', color: '#7d7566', opacity: 0.5, seed: seed + 274, density: 1.6, spread: 0.005 });

  // 壁付け照明（支架・アーム・笠・ランプ：userData.breathe で呼吸）
  const lamp = put(grp('wall-lamp'), -2.94, 2.24, 0);
  g.add(lamp);
  lamp.add(mesh(rbox(0.07, 0.14, 0.016, 0.006, 2), steelPaint, { pos: [0, 0, 0.010] }));
  lamp.add(mesh(cyl(0.014, 0.014, 0.19, 12), steelPaint, { pos: [0.086, 0.030, 0.096], rot: [0, 0, 90 * D2R] }));
  lamp.add(mesh(cyl(0.011, 0.011, 0.13, 10), steelPaint, { pos: [0.152, 0.082, 0.150], rot: [0.72, 0, 0] }));
  const shade = put(grp('lamp-shade'), 0.192, 0.086, 0.216);
  shade.rotation.z = 0.22;
  lamp.add(shade);
  shade.add(mesh(cyl(0.126, 0.062, 0.072, 20, true), MAT.metalPaint(PAL.lampGreen, { worn: 0.85, repeat: 3 })));
  shade.add(noOut(hoop(0.126, 0.006, MAT.metal('#8f938c', { repeat: 6 }), { pos: [0, -0.036, 0], rot: [90 * D2R, 0, 0], cast: false })));
  shade.add(noOut(mesh(cyl(0.106, 0.106, 0.008, 20), MAT.lampShade({ color: '#f6f4e4', emissive: '#ffe9b8', emissiveIntensity: 0.62 }), { pos: [0, -0.038, 0], cast: false })));
  shade.add(noOut(mesh(cyl(0.086, 0.086, 0.030, 18), MAT.bulb({ color: '#fff6e0' }), { pos: [0, -6e-3, 0], cast: false })));
  lamp.add(mesh(box(0.024, 0.020, 0.020), iron, { pos: [0.02, -0.062, 0.020] }));
  shade.userData.breathe = { speed: 0.42, amount: 0.12, phase: (seed % 5) * 0.7 };
  weather(shade, { w: 0.20, h: 0.06, pos: [0, -0.03, 0.0], kind: 'dirt', color: '#4b4a44', opacity: 0.5, seed: seed + 277, density: 1.6, spread: 0.006 });
  weather(lamp, { w: 0.10, h: 0.16, pos: [0, -0.02, 0.014], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 278, density: 1.8, spread: 0.006 });
  for (let i = 0; i < 5; i++) {                                                                                       // 雀よけスパイク
    lamp.add(noOut(mesh(cyl(0.0022, 0.0012, 0.05, 5), MAT.stainless({ repeat: 8 }), { pos: [0.192 + Math.cos(i) * 0.05, 0.148 + i * 0.002, 0.216 + Math.sin(i) * 0.05], cast: false })));
  }
  decal(g, { map: TEX.gradient({ stops: [[0, 'rgba(255,246,222,1)'], [1, 'rgba(255,240,206,0)']] }), w: 0.6, h: 1.2, pos: [-2.6, 1.48, 0.013], opacity: 0.26 });

  /* ================= ８. 壁のひび・補修パテ・コーキング打ち増し・下端汚れ ================= */
  const wear = grp('wall-wear');
  g.add(wear);
  for (const [x, y, w, h, rot] of [
    [x0 + 0.26, 2.06, 0.22, 0.66, 0.06], [-0.86, 1.26, 0.30, 0.18, -0.03],
    [1.90, 2.44, 0.42, 0.28, 0.02], [x1 - 0.34, 0.86, 0.24, 0.50, -0.05],
  ]) {
    wear.add(noOut(mesh(box(w, h, 0.010), mortar, { pos: [x, y, 0.006], rot: [0, 0, rot], cast: false })));
    weather(wear, { w: w * 1.5, h: h * 0.9, pos: [x, y, 0.009], kind: 'scratch', color: '#8f887a', opacity: 0.4, seed: seed + Math.round(x * 100 + y * 10), density: 1.5, spread: 0.02 });
  }
  weather(wear, { w: 1.6, h: 0.5, pos: [-1.1, 2.30, 0.008], kind: 'chip', color: '#c2bbab', opacity: 0.4, seed: seed + 261, density: 1.4, spread: 0.03 });
  weather(wear, { w: span * 0.60, h: 0.24, pos: [0, 0.13, 0.009], kind: 'dirt', color: '#5f5a4e', opacity: 0.34, seed: seed + 262, density: 1.8, spread: 0.03 });
  weather(wear, { w: 2.4, h: 0.18, pos: [0.6, 0.05, 0.010], kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 263, density: 1.9, spread: 0.02 });
  for (const [x, y, w, h] of [[-0.2, 2.30, 0.86, 0.014], [-2.16, 1.02, 0.014, 0.72], [2.66, 1.32, 0.014, 0.50]]) {
    wear.add(noOut(mesh(box(w, h, 0.009), gasket, { pos: [x, y, 0.010], cast: false })));           // コーキング打ち増し
  }
  for (const x of [x0 + 0.30, -1.32, 0.94, x1 - 0.24]) {                                             // 型枠の打継筋
    wear.add(noOut(mesh(box(0.008, 2.40, 0.006), MAT.paint('#dcd5c6', { steps: 2, sat: 0.9 }), { pos: [x, 1.44, 0.005], cast: false })));
  }
  wear.add(mesh(box(x1 - x0, 0.026, 0.012), galv, { pos: [0, 0.013, 0.006] }));                       // 壁際水切り金物
  for (let i = 0; i < 22; i++) {                                                                      // 砂利溜まり
    wear.add(noOut(mesh(rbox(0.022 + rnd() * 0.026, 0.016, 0.020 + rnd() * 0.020, 0.006, 1), MAT.stone({ color: '#a8a29a' }), {
      pos: [range(rnd, x0 + 0.1, x1 - 0.1), 0.012, range(rnd, 0.03, 0.18)], rot: [0, rnd() * 3, 0], cast: false,
    })));
  }
  for (let i = 0; i < 14; i++) {                                                                      // 落ち葉・花弁
    wear.add(noOut(mesh(rbox(range(rnd, 0.03, 0.07), 0.004, range(rnd, 0.03, 0.06), 0.002, 1),
      rnd() > 0.5 ? MAT.petal({ tone: i % 3 }) : MAT.leaf({ color: '#9c8a5c', tint: '#eee2c6' }), {
      pos: [range(rnd, x0 + 0.1, x1 - 0.1), 0.022, range(rnd, 0.06, 0.40)], rot: [0, rnd() * 6.28, 0], cast: false,
    })));
  }
  weather(g, { w: span * 0.58, h: 0.10, pos: [0, 0.014, 0.10], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.22, seed: seed + 281, density: 1.5, spread: 0.05 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
