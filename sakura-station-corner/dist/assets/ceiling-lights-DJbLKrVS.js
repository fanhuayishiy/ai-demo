import { g as grp, M as MAT, T as TEX, m as mesh, b as box, P as PAL, c as cyl, w as weather, n as range, r as rbox, aa as PointLight, t as tor, q as finish, z as rand } from './index-Dv-C_8Uh.js';

//  assets/interior/ceiling-lights.js —— 天井・照明帯・梁・換気・スプリンクラー・点検口
//  室内に柔光を作り、室外の日光と色温差で奥行きを出す（蛍光灯 6500K 帯 + 暖色ダクトダウン）

const meta = {
  id: 'ceiling-lights',
  real: [9.4, 0.6, 5.6],
  origin: 'ground-center',
};

const X0 = -4.7, X1 = 4.7, Z0 = -2.8, Z1 = 2.8;
const CEIL = 2.97; // 天井下地（内壁の仕上げ高さと揃える）

function build(options = {}) {
  const { seed = 911, strips = 4 } = options;
  const rnd = rand(seed);
  const g = grp('ceiling-lights');

  const panelMat = MAT.paint('#efeade', {
    map: TEX.concrete({ base: '#efeade', repeat: 1, joints: 4 }).map,
    normalMap: TEX.concrete({ base: '#efeade', repeat: 1, joints: 4 }).normalMap,
    normalScaleX: 0.4,
    normalScaleY: 0.4,
    spec: 0.08,
    sheen: 0.01,
    shadowAmt: 0.66,
    steps: 3,
  });
  const frameMat = MAT.metal('#cdd1d2', { worn: 0.3, repeat: 2, spec: 0.5 });
  const pipeMat = MAT.galvanized({ spec: 0.3, worn: 0.5 });

  /* ---------- 天井版（モジュールサス） ---------- */
  const ceil = mesh(box(X1 - X0, 0.05, Z1 - Z0), panelMat, { name: 'ceiling', pos: [0, CEIL + 0.025, 0], cast: false, receive: true });
  g.add(ceil);
  // T バーチ（見切りアングル）
  for (let i = 0; i <= 6; i++) {
    const x = X0 + (i / 6) * (X1 - X0);
    g.add(mesh(box(0.024, 0.03, Z1 - Z0), frameMat, { pos: [x, CEIL - 0.005, 0], cast: false, receive: true }));
  }
  for (let j = 0; j <= 4; j++) {
    const z = Z0 + (j / 4) * (Z1 - Z0);
    g.add(mesh(box(X1 - X0, 0.03, 0.024), frameMat, { pos: [0, CEIL - 0.005, z], cast: false, receive: true }));
  }

  /* ---------- 蛍光灯帯（4 列）＋実光源 ---------- */
  const tubeMat = MAT.lampShade({
    color: '#f4fbff',
    emissive: PAL.fluorescent,
    emissiveIntensity: 1.05,
    pulse: { base: 0.97, amount: 0.035, speed: 0.33, spread: 0.9 },
    steps: 2,
    shadowAmt: 0.2,
    rim: 0.1,
  });
  const diffuserMat = MAT.glassLite({ color: '#eef6fb', opacity: 0.42, steps: 2, rim: 0.24 });
  for (let i = 0; i < strips; i++) {
    const x = X0 + 1.1 + i * ((X1 - X0 - 2.2) / Math.max(1, strips - 1));
    const unit = grp('light-unit', { pos: [x, CEIL - 0.12, 0] });
    unit.add(mesh(box(0.3, 0.09, 4.6), MAT.paint('#e4e0d6', { spec: 0.14, steps: 2 }), { pos: [0, 0.045, 0], cast: false, receive: true }));
    unit.add(mesh(box(0.26, 0.02, 4.5), tubeMat, { pos: [0, -8e-3, 0], name: 'tube', cast: false }));
    unit.add(mesh(box(0.28, 0.012, 4.52), diffuserMat, { pos: [0, -0.03, 0], cast: false, receive: false }));
    // 吊りボルトとサス
    for (let k = 0; k < 4; k++) {
      const z = -1.8 + k * 1.2;
      unit.add(mesh(cyl(0.008, 0.008, 0.13, 6), frameMat, { pos: [0, 0.115, z], cast: false }));
      unit.add(mesh(box(0.05, 0.012, 0.05), frameMat, { pos: [0, 0.175, z], cast: false }));
    }
    // 点灯ムラ・虫の死骸・ホコリ
    weather(unit, { w: 0.28, h: 4.2, pos: [0, -0.026, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#8b8578', opacity: 0.16, seed: seed + i * 7, density: 1.1 });
    for (let b = 0; b < 3; b++) {
      unit.add(mesh(rbox(0.022, 0.006, 0.012, 0.004, 1), MAT.paint('#4b4a44', { spec: 0.05, steps: 2 }), { pos: [range(rnd, -0.1, 0.1), -0.034, range(rnd, -2.1, 2.1)], rot: [0, range(rnd, 0, 3), 0], cast: false }));
    }
    // 実光源（室内の柔光を作る 2 点）
    for (const dz of [-1.4, 1.4]) {
      const l = new PointLight(PAL.fluorescent, 2.1, 7.2, 2);
      l.position.set(0, -0.16, dz);
      l.castShadow = false;
      unit.add(l);
    }
    g.add(unit);
  }

  /* ---------- 梁・ダクト・スプリンクラー・換気口・点検口 ---------- */
  for (const z of [-1.5, 0.6, 2.2]) {
    g.add(mesh(box(X1 - X0, 0.24, 0.12), MAT.paint('#ded9cd', { spec: 0.08, shadowAmt: 0.72, steps: 2 }), { pos: [0, CEIL - 0.14, z], cast: false, receive: true }));
  }
  // 換気ダクト（北側を走る）と吹出口
  g.add(mesh(cyl(0.13, 0.13, X1 - X0 - 0.6, 14), pipeMat, { pos: [0, CEIL - 0.26, Z0 + 0.66], rot: [0, 0, Math.PI / 2], cast: true, receive: true }));
  for (let i = 0; i < 3; i++) {
    const x = -2.8 + i * 2.8;
    g.add(mesh(box(0.3, 0.06, 0.3), MAT.paint('#d9d5c9', { spec: 0.12 }), { pos: [x, CEIL - 0.32, Z0 + 0.66], cast: false, receive: true }));
    for (let b = 0; b < 5; b++) g.add(mesh(box(0.26, 0.008, 0.026), frameMat, { pos: [x, CEIL - 0.35 + b * 0.001, Z0 + 0.54 + b * 0.05], rot: [0.32, 0, 0], cast: false }));
  }
  // スプリンクラー
  for (let i = 0; i < 6; i++) {
    const x = X0 + 0.9 + i * 1.5;
    const z = i % 2 ? -0.4 : 1.5;
    g.add(mesh(cyl(0.012, 0.012, 0.1, 6), MAT.metal('#b86c4a', { spec: 0.4 }), { pos: [x, CEIL - 0.07, z], cast: false }));
    g.add(mesh(tor(0.028, 0.006, 5, 10), MAT.metal('#c9c3b6', { spec: 0.5 }), { pos: [x, CEIL - 0.125, z], rot: [Math.PI / 2, 0, 0], cast: false }));
  }
  // 点検口（枠・蝶番・取っ手）
  const hatch = grp('hatch', { pos: [3.1, CEIL - 0.002, -1] });
  hatch.add(mesh(box(0.62, 0.024, 0.62), panelMat, { cast: false, receive: true }));
  hatch.add(mesh(box(0.66, 0.036, 0.03), frameMat, { pos: [0, 0.006, -0.32], cast: false }));
  hatch.add(mesh(box(0.66, 0.036, 0.03), frameMat, { pos: [0, 0.006, 0.32], cast: false }));
  hatch.add(mesh(box(0.03, 0.036, 0.66), frameMat, { pos: [-0.32, 0.006, 0], cast: false }));
  hatch.add(mesh(cyl(0.02, 0.02, 0.014, 8), MAT.stainless({ spec: 0.6 }), { pos: [0.2, 0.02, 0.16], cast: false }));
  g.add(hatch);

  /* ---------- 天井の経年：水染み・黄変・ホコリ ---------- */
  for (let i = 0; i < 6; i++) {
    weather(g, {
      w: range(rnd, 0.4, 1.3),
      h: range(rnd, 0.4, 1.1),
      pos: [range(rnd, X0 + 0.6, X1 - 0.6), CEIL - 0.006, range(rnd, Z0 + 0.5, Z1 - 0.5)],
      rot: [Math.PI / 2, 0, range(rnd, -0.6, 0.6)],
      kind: i % 2 ? 'dirt' : 'chip',
      color: i % 2 ? '#a89a7c' : '#d5cfc0',
      opacity: range(rnd, 0.1, 0.22),
      seed: seed + 200 + i,
      density: 1.1,
    });
  }

  return finish(g, { outline: 'thin', minSize: 0.12 });
}

export { build, build as default, meta };
