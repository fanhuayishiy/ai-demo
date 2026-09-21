import { g as grp, M as MAT, m as mesh, o as lathe, t as tor, c as cyl, r as rbox, b as box, D as DoubleSide, n as range, w as weather, z as rand } from './index-CB0Lacpv.js';

//  assets/products/trash-liner.js —— 空容器与废弃包装（店先・ゴミステーション・通路の細物）
//  契约：原点=底面中心，+Y 上，正面 +Z，build({seed,variant,scale})，不调用 finish()

const meta = {
  id: 'trash-liner',
  real: [0.066, 0.22, 0.066],
  variants: ['pet-bottle', 'can', 'wrapper', 'bento-tray', 'cup', 'straw'],
};

function build(options = {}) {
  const { seed = 1, variant = 'pet-bottle', scale = 1 } = options;
  const rnd = rand(seed);
  const g = grp('trash-' + variant);
  const tilt = () => [range(rnd, -0.5, 0.5), range(rnd, 0, 6.283), range(rnd, -0.5, 0.5)];

  const petMat = MAT.plastic('#e8f0ef', { spec: 0.7, specPower: 170, specCut: 0.08, sheen: 0.16, transparent: true, opacity: 0.72, depthWrite: false });
  const labelMat = MAT.plastic('#d8d2c6', { spec: 0.24, sheen: 0.03 });
  const aluMat = MAT.metal('#c6cacd', { worn: 0.6, spec: 0.72, specPower: 170 });
  const paperMat = MAT.paper({ color: '#efe6d2' });

  if (variant === 'pet-bottle') {
    // 潰れた PET ボトル：断面を楕円化し、胴に折り筋
    const body = grp('bottle');
    const prof = [[0.0, 0.0], [0.026, 0.0], [0.031, 0.012], [0.033, 0.055], [0.030, 0.10], [0.020, 0.135], [0.014, 0.155], [0.0125, 0.185], [0.0135, 0.196], [0.0, 0.2]];
    const b = mesh(lathe(prof, 14), petMat, { name: 'pet-body' });
    b.scale.set(1, 1, 0.72);
    b.rotation.z = 1.55;
    b.position.set(0, 0.032, 0);
    body.add(b);
    // 折り筋（2 本のくぼみを薄いリングで示す）
    for (const y of [0.055, 0.086]) {
      const crease = mesh(tor(0.030, 0.0035, 5, 12), petMat, { pos: [0, y, 0], rot: [0, 0, 1.55], scale: [1, 1, 0.7] });
      body.add(crease);
    }
    body.add(mesh(cyl(0.0135, 0.0135, 0.012, 10), MAT.plastic('#3f7fb5', { spec: 0.3 }), { pos: [0.098, 0.052, 0], rot: [0, 0, 1.55] }));
    body.add(mesh(rbox(0.052, 0.026, 0.002, 0.002, 1), labelMat, { pos: [0.01, 0.062, 0.026], rot: [0, 0.4, 0.1], cast: false }));
    g.add(body);
  } else if (variant === 'can') {
    const can = grp('can');
    const c = mesh(cyl(0.0325, 0.0325, 0.115, 16), aluMat, { name: 'can-body', pos: [0, 0.032, 0], rot: [0, 0, 1.5] });
    can.add(c);
    can.add(mesh(cyl(0.030, 0.026, 0.010, 16), MAT.metal('#b7bbbe', { worn: 0.5 }), { pos: [0.056, 0.034, 0], rot: [0, 0, 1.5] }));
    can.add(mesh(box(0.062, 0.004, 0.030), MAT.plastic('#b8443c', { spec: 0.3 }), { pos: [0.0, 0.062, 0.014], rot: [0, 0, 1.5], cast: false }));
    // 飲み口（開け済み）
    can.add(mesh(rbox(0.016, 0.004, 0.008, 0.002, 1), MAT.stainless({ spec: 0.6 }), { pos: [-0.05, 0.036, 0.012], rot: [0, 0, 1.5] }));
    g.add(can);
  } else if (variant === 'wrapper') {
    // 空の菓子袋（口が開いたまま潰れている）
    const bag = grp('wrapper');
    const prof = [[0, 0], [0.048, 0.004], [0.062, 0.02], [0.055, 0.042], [0.03, 0.055], [0.0, 0.06]];
    const b = mesh(lathe(prof, 12), MAT.plastic('#e2b449', { spec: 0.34, specPower: 40, sheen: 0.05, side: DoubleSide }), { name: 'bag' });
    b.scale.set(0.72, 0.5, 1);
    b.rotation.set(0.2, 0, 1.4);
    b.position.set(0, 0.018, 0);
    bag.add(b);
    bag.add(mesh(rbox(0.05, 0.004, 0.036, 0.004, 1), MAT.plastic('#c9302c', { spec: 0.2 }), { pos: [0.02, 0.012, 0.006], rot: [0, 0.4, 0], cast: false }));
    g.add(bag);
  } else if (variant === 'bento-tray') {
    const tray = grp('tray');
    tray.add(mesh(rbox(0.155, 0.026, 0.105, 0.006, 2), MAT.plastic('#e9e6df', { spec: 0.4, specPower: 90, transparent: true, opacity: 0.86, depthWrite: false }), { pos: [0, 0.013, 0] }));
    tray.add(mesh(box(0.14, 0.002, 0.09), paperMat, { pos: [0.005, 0.024, 0], rot: [0, 0.1, 0], cast: false }));
    tray.add(mesh(cyl(0.008, 0.008, 0.16, 6), MAT.wood({ light: '#d8c39a', dark: '#b59b6d' }), { pos: [0.02, 0.03, 0.02], rot: [0, 0.4, 1.5] }));
    g.add(tray);
  } else if (variant === 'cup') {
    const cup = grp('cup');
    cup.add(mesh(cyl(0.036, 0.028, 0.086, 14, true), MAT.paper({ color: '#f2ece0' }), { pos: [0, 0.043, 0], rot: [0, 0, 1.52] }));
    cup.add(mesh(cyl(0.0365, 0.0365, 0.006, 14), MAT.plastic('#4b5b6b', { spec: 0.3 }), { pos: [0.043, 0.043, 0], rot: [0, 0, 1.52] }));
    cup.add(mesh(cyl(0.004, 0.004, 0.11, 6), MAT.plastic('#c9c3b6'), { pos: [0.0, 0.062, 0.01], rot: [0.3, 0, 1.9] }));
    g.add(cup);
  } else {
    // 折れたストロー・楊枝の束
    for (let i = 0; i < 4; i++) {
      g.add(mesh(cyl(0.0025, 0.0025, range(rnd, 0.06, 0.13), 6), MAT.plastic(['#d8d2c6', '#8fb6cf', '#e2b449', '#c9c3b6'][i % 4], { spec: 0.3 }), { pos: [range(rnd, -0.04, 0.04), 0.004, range(rnd, -0.04, 0.04)], rot: tilt() }));
    }
  }

  // 生活感：泥・水跡・踏まれた跡
  weather(g, { w: 0.12, h: 0.12, pos: [0, 0.006, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6d5f4a', opacity: 0.3, seed: seed + 5, density: 1.2 });
  g.scale.setScalar(scale);
  return g;
}

export { build, build as default, meta };
