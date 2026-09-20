import { g as grp, M as MAT, m as mesh, n as range, r as rbox, c as cyl, w as weather, b as box, am as hoop, T as TEX, h as decal, D as DoubleSide, p as shadowBlob, q as finish, z as rand } from './index-D433i3Qe.js';

//  assets/street/bench-wait.js —— 街角待合ベンチ（木製スノコ + 鋳鉄脚 + 上屋支柱）

const meta = {
  id: 'bench-wait',
  real: [1.62, 0.86, 0.56],
  origin: 'ground-center',
};

const SLAT = 6;

function build(options = {}) {
  const { seed = 17, len = 1.62, backrest = true, canopyPost = true } = options;
  const rnd = rand(seed);
  const g = grp('bench-wait');

  const woodMat = MAT.wood({ light: '#c19a6b', dark: '#8a6a45', knots: true, repeat: 1 });
  const woodWorn = MAT.wood({ light: '#a98a63', dark: '#755b3e', knots: true, repeat: 1 });
  const ironMat = MAT.metalPaint('#3d4740', { worn: 0.8, repeat: 2 });
  const castMat = MAT.metal('#4a4f52', { worn: 0.9, repeat: 1, spec: 0.34 });

  /* ---------- 座面：6 本のスノコ（反り・摩耗・色ムラ） ---------- */
  const seatY = 0.42;
  const d = 0.42;
  for (let i = 0; i < SLAT; i++) {
    const z = -d / 2 + (i + 0.5) * (d / SLAT);
    const sag = Math.sin((i / (SLAT - 1)) * Math.PI) * 0.004;
    const slat = mesh(
      rbox(len, 0.026, d / SLAT - 0.008, 0.008, 2),
      i % 2 ? woodMat : woodWorn,
      { pos: [range(rnd, -4e-3, 0.004), seatY - sag, z], name: `seat-slat-${i}` },
    );
    slat.rotation.z = range(rnd, -4e-3, 0.004);
    g.add(slat);
    // 留め金（2 箇所）
    for (const x of [-len * 0.32, len * 0.32]) {
      g.add(mesh(cyl(0.009, 0.009, 0.008, 8), castMat, { pos: [x + range(rnd, -0.01, 0.01), seatY + 0.014 - sag, z], cast: false }));
    }
  }
  // 座面の経年：日焼け・ささくれ・水染み・コケ
  weather(g, { w: len * 0.9, h: d * 0.9, pos: [0, seatY + 0.015, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d564c', opacity: 0.24, seed: seed + 1, density: 1.4 });
  weather(g, { w: len * 0.4, h: d * 0.6, pos: [len * 0.2, seatY + 0.016, 0.02], rot: [-Math.PI / 2, 0, 0.3], kind: 'moss', color: '#6d8152', opacity: 0.2, seed: seed + 2, density: 1 });
  for (let i = 0; i < 5; i++) {
    g.add(
      mesh(rbox(range(rnd, 0.06, 0.2), 0.004, 0.008, 0.002, 1), MAT.wood({ light: '#d8c0a0', dark: '#b09068', repeat: 1 }), {
        pos: [range(rnd, -len / 2, len / 2), seatY + 0.015, range(rnd, -d / 2, d / 2)],
        rot: [0, range(rnd, -0.4, 0.4), 0],
        cast: false,
      }),
    ); // ささくれて剥げた木片
  }

  /* ---------- 背もたれ ---------- */
  if (backrest) {
    for (let i = 0; i < 3; i++) {
      const y = 0.56 + i * 0.11;
      const s = mesh(rbox(len - 0.1, 0.062, 0.024, 0.01, 2), i === 1 ? woodWorn : woodMat, { pos: [0, y, -d / 2 + 0.02], name: `back-slat-${i}` });
      s.rotation.x = -0.09;
      g.add(s);
    }
    for (const x of [-len / 2 + 0.06, len / 2 - 0.06]) {
      g.add(mesh(box(0.03, 0.34, 0.024), ironMat, { pos: [x, 0.62, -d / 2 + 0.01], rot: [0.09, 0, 0] }));
    }
  }

  /* ---------- 鋳鉄脚（2 脚、飾りリブ） ---------- */
  for (const x of [-len / 2 + 0.18, len / 2 - 0.18]) {
    const leg = grp('leg', { pos: [x, 0, 0] });
    leg.add(mesh(box(0.05, seatY - 0.02, 0.05), ironMat, { pos: [0, (seatY - 0.02) / 2, -d * 0.28], name: 'leg-back' }));
    leg.add(mesh(box(0.05, seatY - 0.02, 0.05), ironMat, { pos: [0, (seatY - 0.02) / 2, d * 0.3], name: 'leg-front' }));
    leg.add(mesh(box(0.05, 0.036, d + 0.06), ironMat, { pos: [0, 0.018, 0.01], name: 'foot-bar' }));
    // 飾り：渦巻き（リング 2 枚）とリブ
    leg.add(hoop(0.062, 0.011, castMat, { pos: [0, 0.2, 0.0], rot: [0, Math.PI / 2, 0] }));
    leg.add(hoop(0.042, 0.009, castMat, { pos: [0, 0.3, 0.02], rot: [0, Math.PI / 2, 0.3] }));
    leg.add(mesh(box(0.036, 0.16, 0.02), ironMat, { pos: [0, 0.26, 0.01] }));
    // 接地：アンカーボルトと土台
    for (const dz of [-d * 0.3, d * 0.34]) {
      leg.add(mesh(cyl(0.016, 0.016, 0.05, 8), MAT.stainless({ worn: 0.8 }), { pos: [0, 0.026, dz] }));
      leg.add(mesh(rbox(0.07, 0.014, 0.07, 0.006, 2), MAT.concrete({ base: '#b7b1a6', repeat: 1 }), { pos: [0, 0.007, dz] }));
    }
    weather(leg, { w: 0.1, h: 0.4, pos: [0.028, 0.2, 0], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.42, seed: seed + 11, density: 1.6, count: 2, spread: 0.16 });
    g.add(leg);
  }
  // 座面下の補強棒
  g.add(mesh(box(len - 0.1, 0.026, 0.026), ironMat, { pos: [0, seatY - 0.06, -d * 0.26] }));
  g.add(mesh(box(len - 0.1, 0.026, 0.026), ironMat, { pos: [0, seatY - 0.06, d * 0.26] }));

  /* ---------- 上屋支柱（片側だけ）＋看板 ---------- */
  if (canopyPost) {
    const px = len / 2 + 0.24;
    const post = grp('post', { pos: [px, 0, -d * 0.1] });
    post.add(mesh(cyl(0.036, 0.042, 1.86, 14), ironMat, { pos: [0, 0.93, 0], name: 'post' }));
    post.add(mesh(cyl(0.052, 0.052, 0.06, 12), castMat, { pos: [0, 0.03, 0] }));
    post.add(mesh(cyl(0.03, 0.048, 0.1, 12), ironMat, { pos: [0, 1.9, 0] }));
    post.add(mesh(rbox(0.5, 0.02, 0.34, 0.006, 2), MAT.metalPaint('#4a6b5a', { worn: 0.7 }), { pos: [-0.16, 1.84, 0], rot: [0, 0, 0.04] }));
    // 待合看板（時刻・行先）
    const board = mesh(rbox(0.42, 0.3, 0.014, 0.008, 2), MAT.paint('#eae4d6', { map: TEX.lightPanel({ text: '待合', bg: '#eae4d6', fg: '#3d4a44', rows: [{ t: '次  10:24', v: '河合原行' }, { t: '次  10:51', v: '富士見行' }] }), spec: 0.1, steps: 2 }), { pos: [-0.02, 1.52, 0.03], rot: [-0.06, 0, 0] });
    post.add(board);
    post.add(mesh(box(0.44, 0.012, 0.03), ironMat, { pos: [-0.02, 1.68, 0.02] }));
    post.add(mesh(box(0.44, 0.012, 0.03), ironMat, { pos: [-0.02, 1.36, 0.02] }));
    weather(post, { w: 0.09, h: 1.4, pos: [0.03, 0.7, 0], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.4, seed: seed + 21, density: 1.5, count: 2, spread: 0.4 });
    g.add(post);
  }

  /* ---------- 小物：落書き除去・貼紙・ゴミ・花びら ---------- */
  decal(g, { map: TEX.wear({ kind: 'scratch', color: '#8b857a', seed: seed + 31, density: 1.2 }), w: 0.24, h: 0.1, pos: [-len * 0.28, seatY + 0.016, 0.06], rot: [-Math.PI / 2, 0, 0.2], opacity: 0.5 });
  decal(g, { map: TEX.poster({ title: '落とし物', bg: '#f2e9d8', accent: '#c7b98f', seed: seed + 33 }), w: 0.1, h: 0.13, pos: [len / 2 + 0.24, 1.1, -d * 0.05], rot: [0, 0, 0], opacity: 0.9 });
  for (let i = 0; i < 4; i++) {
    g.add(
      mesh(rbox(0.032, 0.004, 0.026, 0.008, 1), MAT.petal({ map: TEX.petal({ mode: 'single', tone: i % 2 }), alphaTest: 0.4, side: DoubleSide }), {
        pos: [range(rnd, -len / 2, len / 2), seatY + 0.016, range(rnd, -d / 2, d / 2)],
        rot: [range(rnd, -0.2, 0.2), range(rnd, 0, 3.1), range(rnd, -0.2, 0.2)],
        cast: false,
      }),
    );
  }
  shadowBlob(g, { r: len * 0.56, pos: [0, 0.004, 0], opacity: 0.2 });

  return finish(g, { outline: 'normal', minSize: 0.03 });
}

export { build, build as default, meta };
