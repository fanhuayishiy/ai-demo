import { g as grp, M as MAT, P as PAL, T as TEX, m as mesh, b as box, c as cyl, t as tor, w as weather, r as rbox, h as decal, a as sph, X as cone, n as range, p as shadowBlob, q as finish, z as rand } from './index-BFJstGKs.js';

//  assets/street/trash-bin-combustible.js —— 可燃ごみ箱（車輪付き樹脂胴・蓋は lidOpen で開閉）
//  原点 = 地面接触中心 / +Y 上 / 正面（投入口・表示札）+Z

const meta = {
  id: 'trash-bin-combustible',
  real: [0.47, 0.66, 0.38],      // H 0.66（蓋閉時）／0.90（蓋開時）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const lidOpen = Math.max(0, Math.min(1, options.lidOpen ?? 0));

  const g = grp('trash-bin-combustible');

  /* ---------------- 寸法 ---------------- */
  const BW = 0.44, BD = 0.34;          // 胴の外形
  const yBody0 = 0.135, yBody1 = 0.592;
  const bh = yBody1 - yBody0, yb = (yBody0 + yBody1) / 2;
  const wall = 0.024;

  /* ---------------- 樹脂 / 金属 ---------------- */
  // 日焼け退色した赤樹脂（PAL.vendingRed を色褪せさせた指定色）
  const redBody = MAT.plastic(PAL.vendingRed, { sat: 0.74, tint: '#ffeade', steps: 3, repeat: 3, uv: { repeat: [2.2, 2.2] } });
  const redDeep = MAT.plastic(PAL.vendingRed, { sat: 0.86, tint: '#e8cfc2' });
  const orangeLid = MAT.plastic(PAL.storeBand2, { sat: 0.72, tint: '#fff0d8', steps: 3, uv: { repeat: [2.2, 1.6] } });
  MAT.paint('#4b4642', { steps: 2, shadowAmt: 1.0, sheen: 0.02 });
  const innerFloor = MAT.paint('#37332f', { steps: 2, shadowAmt: 1, map: TEX.concrete({ base: '#3a3632', repeat: 4 }).map });
  const steelChassis = MAT.metalPaint(PAL.lampBlack, { worn: 0.85, repeat: 3 });
  const axleMetal = MAT.metal('#9aa0a2', { worn: 0.9, repeat: 4 });
  const tyre = MAT.rubber('#26282c', { steps: 2 });
  const bagMat = MAT.paint('#232529', { spec: 0.55, specPower: 34, specCut: 0.24, sheen: 0.22, steps: 3, shadowAmt: 0.9 });
  const labelPlate = MAT.paint(PAL.marking, { steps: 2, sat: 0.9, tint: '#f7f0e2' });

  /* ================= 台車枠・車輪 ================= */
  const chassis = grp('chassis');
  g.add(chassis);
  for (const sx of [-1, 1]) {
    chassis.add(mesh(box(0.026, 0.026, BD - 0.06), steelChassis, { pos: [sx * (BW / 2 - 0.03), 0.108, 0] }));
    chassis.add(mesh(box(0.026, 0.062, 0.026), steelChassis, { pos: [sx * (BW / 2 - 0.03), 0.124, -0.12000000000000001] }));
    chassis.add(mesh(box(0.026, 0.062, 0.026), steelChassis, { pos: [sx * (BW / 2 - 0.03), 0.124, BD / 2 - 0.05] }));
  }
  chassis.add(mesh(box(BW - 0.03, 0.024, 0.026), steelChassis, { pos: [0, 0.108, -0.12000000000000001] }));
  chassis.add(mesh(box(BW - 0.03, 0.024, 0.026), steelChassis, { pos: [0, 0.108, BD / 2 - 0.05] }));
  // 車輪軸（錆）
  const axleY = 0.072, axleR = 0.008;
  chassis.add(mesh(cyl(axleR, axleR, BW - 0.02, 10), axleMetal, { pos: [0, axleY, -0.04], rot: [0, 0, Math.PI / 2] }));
  for (const sx of [-1, 1]) {
    chassis.add(mesh(cyl(0.014, 0.014, 0.02, 8), MAT.darkIron({ repeat: 6 }), { pos: [sx * (BW / 2 - 0.05), axleY, -0.04], rot: [0, 0, Math.PI / 2] }));
    // 車輪（タイヤ＋ホイール＋ボス）
    const w = grp(`wheel-${sx > 0 ? 'r' : 'l'}`);
    w.position.set(sx * (BW / 2 - 0.028), axleY, -0.04);
    w.rotation.y = sx * 0.05;                                  // 僅かなヨジリ（真直ぐ走らない痕）
    chassis.add(w);
    w.add(mesh(cyl(0.072, 0.072, 0.028, 18), tyre, { rot: [0, 0, Math.PI / 2] }));
    w.add(mesh(tor(0.062, 0.011, 6, 18), tyre, { rot: [0, Math.PI / 2, 0] }));
    w.add(mesh(cyl(0.038, 0.038, 0.030, 14), MAT.hardPlastic('#5a5751', { repeat: 5 }), { rot: [0, 0, Math.PI / 2] }));
    w.add(mesh(cyl(0.013, 0.013, 0.036, 8), axleMetal, { rot: [0, 0, Math.PI / 2] }));
    // 車輪のリブ（モールド 6 本）
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      w.add(mesh(box(0.008, 0.028, 0.006), MAT.hardPlastic('#5a5751', { repeat: 5 }), {
        pos: [0, Math.cos(a) * 0.055, Math.sin(a) * 0.055], rot: [a, 0, 0],
      }));
    }
  }
  weather(chassis, { w: 0.13, h: 0.05, pos: [0, axleY, -0.028], kind: 'rust', color: PAL.rust, opacity: 0.62, seed: seed + 5, density: 1.7, spread: 0.008 });   // 経年 1：軸錆
  weather(chassis, { w: 0.30, h: 0.05, pos: [0, 0.118, BD / 2 - 0.036], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 6, spread: 0.006 });
  weather(chassis, { w: 0.18, h: 0.08, pos: [-0.06, 0.08, -0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4a4238', opacity: 0.5, seed: seed + 7, spread: 0.006 });

  /* ================= 胴（厚みある板組み＝中身が見える） ================= */
  const body = grp('body');
  g.add(body);
  body.add(mesh(box(BW, bh, wall), redBody, { pos: [0, yb, BD / 2 - wall / 2] }));              // 前
  body.add(mesh(box(BW, bh, wall), redBody, { pos: [0, yb, -0.158] }));           // 後
  body.add(mesh(box(wall, bh, BD - wall * 2), redBody, { pos: [-0.208, yb, 0] })); // 左
  body.add(mesh(box(wall, bh, BD - wall * 2), redBody, { pos: [BW / 2 - wall / 2, yb, 0] }));    // 右
  body.add(mesh(box(BW - 0.02, 0.022, BD - 0.02), innerFloor, { pos: [0, yBody0 + 0.011, 0] })); // 底（内面）
  // 上縁（補強リム）
  body.add(mesh(box(BW + 0.014, 0.022, BD + 0.014), redDeep, { pos: [0, yBody1 + 0.011, 0] }));
  // 胴のリブ（縦 3 本 × 前後、横 2 本）
  for (const x of [-0.145, 0, 0.145]) {
    body.add(mesh(rbox(0.026, bh - 0.075, 0.010, 0.004, 2), redDeep, { pos: [x, yb + 0.01, BD / 2 + 0.001] }));
    body.add(mesh(rbox(0.026, bh - 0.075, 0.010, 0.004, 2), redDeep, { pos: [x, yb + 0.01, -0.171] }));
  }
  for (const y of [0.24, 0.46]) {
    body.add(mesh(box(BW - 0.02, 0.016, 0.008), redDeep, { pos: [0, y, BD / 2 + 0.002] }));
    for (const sx of [-1, 1]) body.add(mesh(box(0.008, 0.016, BD - 0.04), redDeep, { pos: [sx * (BW / 2 + 0.002), y, 0] }));
  }
  // 前面の押し込みモールド（取手部）
  body.add(mesh(rbox(0.20, 0.055, 0.014, 0.008, 2), redDeep, { pos: [0, 0.545, BD / 2 + 0.004] }));
  body.add(mesh(rbox(0.17, 0.034, 0.010, 0.005, 2), MAT.paint(PAL.storeBand3, { sat: 0.6, tint: '#f6e6da' }), { pos: [0, 0.335, BD / 2 + 0.004] }));
  decal(body, { map: TEX.signboard({ text: 'もえるごみ', sub: '月・木曜 朝 8 時まで', bg: '#f4efe3', fg: '#b03a2e' }), w: 0.166, h: 0.0415, pos: [0, 0.335, BD / 2 + 0.0105] });
  // 内側の汚れ・黒ズミ（蓋を開けると必ず見える面）
  const innerFaces = [
    [[0.02, 0.32, BD / 2 - wall - 0.003], [0, Math.PI, 0]],
    [[-0.03, 0.30, -0.14300000000000002], [0, 0, 0]],
    [[-0.193, 0.28, 0.02], [0, Math.PI / 2, 0]],
    [[BW / 2 - wall - 0.003, 0.30, -0.03], [0, -Math.PI / 2, 0]],
  ];
  innerFaces.forEach(([pos, rot], k) => {
    weather(body, { w: 0.28, h: 0.24, pos, rot, kind: 'dirt', color: '#211f1c', opacity: 0.6, seed: seed + 14 + k, density: 1.9, spread: 0.006 });
    weather(body, { w: 0.20, h: 0.10, pos: [pos[0], 0.18, pos[2]], rot, kind: 'moss', color: '#4d5b3c', opacity: 0.4, seed: seed + 24 + k, density: 1.2, spread: 0.005 });
  });
  weather(body, { w: 0.36, h: 0.06, pos: [0, 0.160, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#1c1a17', opacity: 0.7, seed: seed + 18, density: 2.0, spread: 0.006 });   // 底の内側の汚水
  // 経年 2：日焼け退色（上半分が白っぽい）
  decal(body, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']] }), w: BW - 0.02, h: 0.26, pos: [0, yBody1 - 0.15, BD / 2 + 0.0022], opacity: 0.30 });
  // 経年 3：縁の掉漆・打痕
  weather(body, { w: 0.26, h: 0.05, pos: [-0.05, yBody1 - 0.008, BD / 2 + 0.0024], kind: 'chip', color: '#d9cfc2', opacity: 0.55, seed: seed + 19, density: 1.8, spread: 0.006 });
  weather(body, { w: 0.20, h: 0.12, pos: [0.10, 0.19, BD / 2 + 0.0026], kind: 'scratch', color: '#e6dcd0', opacity: 0.35, seed: seed + 20, density: 1.4, spread: 0.006 });
  // 経年 4：下部の泥はね・苔
  weather(body, { w: 0.30, h: 0.09, pos: [0, 0.165, BD / 2 + 0.0028], kind: 'dirt', color: '#6b5f4c', opacity: 0.55, seed: seed + 21, density: 1.8, count: 2, spread: 0.006 });
  weather(body, { w: 0.10, h: 0.11, pos: [-0.2225, 0.19, 0.05], rot: [0, -Math.PI / 2, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 22, spread: 0.006 });
  // 経年 5：貼紙残り（剥がした分別ラベル）
  decal(body, { map: TEX.wear({ kind: 'chip', color: '#efe6d2', seed: seed + 23, density: 1.1 }), w: 0.11, h: 0.085, pos: [0.135, 0.42, BD / 2 + 0.0028], opacity: 0.8, rot: [0, 0, -7 * D2R] });
  decal(body, { map: TEX.adStrip({ text: '分けてね', bg: '#e5dcc8', seed: seed + 24 }), w: 0.09, h: 0.022, pos: [-0.13, 0.50, BD / 2 + 0.0029], opacity: 0.62, rot: [0, 0, 4 * D2R] });

  /* ================= 中身：黒いゴミ袋（蓋の内側に干渉しない高さ） ================= */
  const bag = grp('bag');
  g.add(bag);
  const yRim = yBody1 + 0.022;                    // リム天面 0.614
  const bagTop = 0.534;                           // 袋の嵩（リムより下＝蓋と干渉しない）
  for (const [x, z, tilt] of [[-0.068, 0.038, 0.13], [0.062, -0.038, -0.1], [-0.015, -5e-3, 0.05]]) {
    const s = 0.086 + rnd() * 0.028;
    bag.add(mesh(sph(s, 12, 9), bagMat, { pos: [x, bagTop - s * 0.34, z], scale: [1.08, 0.76, 0.96], rot: [tilt * D2R, 0, tilt * 0.6 * D2R] }));
  }
  bag.add(mesh(rbox(0.34, 0.055, 0.245, 0.02, 2), bagMat, { pos: [0, 0.452, 0], rot: [0, 5 * D2R, 0] }));
  // 袋口：左リムに折り返して胴の外側へ垂れる（＝臭い漏れ）
  const fold = grp('bag-mouth');
  bag.add(fold);
  fold.add(mesh(rbox(0.080, 0.011, 0.195, 0.004, 2), bagMat, { pos: [-0.191, yRim + 0.0025, 0.012] }));      // リム天に載る折り返し（蓋と 3mm 间隙）
  fold.add(mesh(rbox(0.016, 0.020, 0.195, 0.006, 2), bagMat, { pos: [-0.225, yRim - 0.008, 0.012], rot: [0, 0, -4 * D2R] }));  // 縁の折れ曲がり
  fold.add(mesh(rbox(0.013, 0.285, 0.172, 0.005, 2), bagMat, { pos: [-0.226, 0.452, 0.014], rot: [0, 0, 1.6 * D2R] }));      // 外側へ垂れる袋
  fold.add(mesh(rbox(0.055, 0.020, 0.150, 0.008, 2), bagMat, { pos: [-0.15, bagTop - 0.02, 0.014], rot: [0, 0, 9 * D2R] }));           // 内側の折り込み
  // 結び目（袋口を括った捩れ）
  const knot = grp('knot');
  knot.position.set(-0.23, 0.308, 0.018);
  knot.rotation.z = -4 * D2R;
  bag.add(knot);
  knot.add(mesh(cyl(0.017, 0.024, 0.032, 10), bagMat, { pos: [0, 0.016, 0] }));
  knot.add(mesh(tor(0.013, 0.0048, 6, 12), bagMat, { pos: [0, 0.002, 0], rot: [Math.PI / 2, 0, 0.4] }));
  for (let k = 0; k < 3; k++) {
    knot.add(mesh(cone(0.0075, 0.034 + k * 0.009, 7), bagMat, { pos: [0.004 * (k - 1), -0.018, 0.006 * (k - 1)], rot: [170 * D2R + k * 9 * D2R, 0, k * 12 * D2R - 12 * D2R] }));
  }
  weather(bag, { w: 0.14, h: 0.09, pos: [-0.02, bagTop - 0.005, 0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#0e0f11', opacity: 0.5, seed: seed + 31, spread: 0.008 });
  weather(bag, { w: 0.06, h: 0.16, pos: [-0.2325, 0.42, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'dirt', color: '#4a4640', opacity: 0.5, seed: seed + 32, density: 1.4, spread: 0.005 });   // 袋口の泥はね

  /* ================= 蓋（ヒンジは後面、反りあり・裏面あり） ================= */
  const lid = grp('lid', { pos: [0, yBody1 + 0.033, -0.17600000000000002] });
  g.add(lid);
  lid.rotation.x = -(lidOpen * 62 * D2R);
  const LD = BD + 0.030, LW = BW + 0.026;
  // 剛性盤（後面〜中央）
  lid.add(mesh(rbox(LW, 0.020, LD * 0.52, 0.006, 2), orangeLid, { pos: [0, 0.010, LD * 0.26] }));
  // 中央リブ
  lid.add(mesh(box(LW - 0.05, 0.016, 0.022), orangeLid, { pos: [0, 0.026, LD * 0.50] }));
  for (const x of [-0.13, 0.13]) lid.add(mesh(box(0.020, 0.014, LD * 0.92), orangeLid, { pos: [x, 0.024, LD * 0.48] }));
  // 前側スラブ：袋を挟んで反り上がっている（蓋の反り）
  const frontSlab = grp('lid-front');
  frontSlab.position.set(0, 0.020, LD * 0.52);
  frontSlab.rotation.x = -1.9 * D2R;
  lid.add(frontSlab);
  frontSlab.add(mesh(rbox(LW, 0.020, LD * 0.50, 0.006, 2), orangeLid, { pos: [0, 0.004, LD * 0.24] }));
  frontSlab.add(mesh(box(LW - 0.04, 0.014, 0.020), orangeLid, { pos: [0, -0.013, LD * 0.30] }));
  // 反りの捩れ（左前隅が浮く）
  const corner = grp('lid-corner');
  corner.position.set(-0.233 + 0.075, 0.008, LD * 0.72);
  corner.rotation.z = 2.6 * D2R;
  lid.add(corner);
  corner.add(mesh(rbox(0.15, 0.019, 0.11, 0.006, 2), orangeLid, { pos: [0, 0.002, 0] }));
  // 蓋の裏面（補強リブ格子＝開けたとき必ず見える）
  for (const z of [0.10, 0.20, 0.30]) lid.add(mesh(box(LW - 0.03, 0.014, 0.016), orangeLid, { pos: [0, -6e-3, z] }));
  lid.add(mesh(box(0.016, 0.014, LD - 0.02), orangeLid, { pos: [0, -6e-3, LD * 0.48] }));
  // 前縁の掴み手
  lid.add(mesh(rbox(0.19, 0.026, 0.030, 0.008, 2), MAT.hardPlastic(PAL.storeBand3, { sat: 0.7, tint: '#f2ddd2' }), { pos: [0, -4e-3, LD + 0.0] }));
  lid.add(mesh(box(0.026, 0.020, 0.026), MAT.hardPlastic(PAL.storeBand3, { repeat: 5 }), { pos: [-0.08, 0.006, LD * 0.99] }));
  lid.add(mesh(box(0.026, 0.020, 0.026), MAT.hardPlastic(PAL.storeBand3, { repeat: 5 }), { pos: [0.08, 0.006, LD * 0.99] }));
  // 「もえる」表示札
  lid.add(mesh(rbox(0.205, 0.006, 0.054, 0.002, 2), labelPlate, { pos: [0.02, 0.030, LD * 0.30], rot: [0, -2 * D2R, 0] }));
  decal(lid, { map: TEX.signboard({ text: 'もえる', sub: 'COMBUSTIBLE', bg: '#f5efe2', fg: '#b8402f' }), w: 0.19, h: 0.0475, pos: [0.02, 0.0345, LD * 0.30], rot: [-Math.PI / 2, 0, -2 * D2R] });
  // 蓋の経年：退色・掉漆・こすり痕
  decal(lid, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']] }), w: LW - 0.05, h: LD * 0.55, pos: [0.01, 0.0245, LD * 0.66], rot: [-Math.PI / 2, 0, 0], opacity: 0.34 });   // 経年 6
  weather(lid, { w: 0.24, h: 0.16, pos: [-0.07, 0.024, LD * 0.34], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#efe4d4', opacity: 0.5, seed: seed + 41, density: 1.5, spread: 0.006 });
  weather(lid, { w: 0.16, h: 0.10, pos: [0.11, 0.026, LD * 0.80], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#fff3df', opacity: 0.4, seed: seed + 42, spread: 0.006 });
  weather(lid, { w: 0.22, h: 0.10, pos: [0, -0.014, LD * 0.55], rot: [Math.PI / 2, 0, 0], kind: 'dirt', color: '#2b2724', opacity: 0.6, seed: seed + 43, density: 1.7, spread: 0.006 });   // 裏面の汚れ
  // ヒンジ（樹脂蝶番 2 客＋サビたピン）
  for (const x of [-0.14, 0.14]) {
    const hg = grp('hinge');
    hg.position.set(x, 0.004, -4e-3);
    lid.add(hg);
    hg.add(mesh(rbox(0.056, 0.018, 0.048, 0.005, 2), MAT.hardPlastic('#6d6a63', { repeat: 6 }), { pos: [0, 0.002, 0.020] }));
    hg.add(mesh(cyl(0.0075, 0.0075, 0.052, 8), MAT.metal('#8d8f8c', { worn: 0.8 }), { pos: [0, 0.008, 0.004], rot: [Math.PI / 2, 0, 0] }));
    weather(hg, { w: 0.04, h: 0.03, pos: [0, 0.014, 0.012], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 44 + Math.round(x * 100), spread: 0.004 });
  }

  /* ================= 水漏れ・接触影 ================= */
  // 蓋から胴前縁へ流れた汚水跡（経年 7）
  for (let i = 0; i < 4; i++) {
    const x = -0.15 + i * 0.10 + range(rnd, -0.02, 0.02);
    weather(body, { w: 0.018, h: 0.16, pos: [x, 0.50, BD / 2 + 0.0030], kind: 'rust', color: '#8d7a5e', opacity: 0.42, seed: seed + 51 + i, density: 0.7, spread: 0.004 });
  }
  shadowBlob(g, { r: 0.29, pos: [0, 0.003, -0.01], opacity: 0.3, ratio: 0.85 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
