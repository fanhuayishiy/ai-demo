import { g as grp, M as MAT, m as mesh, b as box, r as rbox, c as cyl, n as range, h as decal, T as TEX, w as weather, q as finish, z as rand } from './index-CNQWoZB0.js';

//  assets/interior/lockers.js —— コインロッカー（ダイヤ錠 / シリンダ錠、1 扉だけ開いて中が見える）

const meta = {
  id: 'lockers',
  real: [1.2, 1.78, 0.46],
  origin: 'ground-center',
};

function build(options = {}) {
  const { seed = 921, cols = 4, rows = 3, h = 1.78 } = options;
  const rnd = rand(seed);
  const g = grp('lockers');

  const bodyMat = MAT.metalPaint('#b9bec2', { worn: 0.6, repeat: 2 });
  const doorMat = MAT.metalPaint('#c8ccce', { worn: 0.75, repeat: 2 });
  const trimMat = MAT.metal('#8f9598', { worn: 0.6, spec: 0.5 });

  const W = 1.2, D = 0.46;
  const cw = W / cols, ch = (h - 0.16) / rows;

  // 本体框
  g.add(mesh(box(W, h, D), bodyMat, { pos: [0, h / 2, 0], name: 'locker-body' }));
  // 天板の傾きとホコリ受け
  g.add(mesh(rbox(W + 0.03, 0.028, D + 0.03, 0.008, 2), trimMat, { pos: [0, h + 0.012, 0] }));
  // 脚とパンチングメッシュの底板
  g.add(mesh(box(W, 0.07, D), MAT.paint('#7f8488', { spec: 0.2, steps: 2 }), { pos: [0, 0.035, 0] }));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = -W / 2 + (i + 0.5) * cw;
      const y = 0.1 + (j + 0.5) * ch;
      const door = grp('locker-door', { pos: [x, y, D / 2 + 0.008] });
      door.add(mesh(rbox(cw - 0.014, ch - 0.014, 0.016, 0.004, 2), doorMat, { cast: true, receive: true }));
      // 通気スリット（3 本）
      for (let k = 0; k < 3; k++) {
        door.add(mesh(box(cw * 0.5, 0.008, 0.006), MAT.paint('#4d5255', { spec: 0.06, steps: 2 }), { pos: [0, ch * 0.24 - k * 0.026, 0.011], cast: false }));
      }
      // 鍵（ダイヤル / シリンダ）と番号札
      const kind = (i + j) % 2;
      if (kind === 0) {
        door.add(mesh(cyl(0.019, 0.019, 0.014, 12), MAT.stainless({ spec: 0.62 }), { pos: [cw * 0.28, 0, 0.014], rot: [Math.PI / 2, 0, 0] }));
        for (let k = 0; k < 3; k++) door.add(mesh(cyl(0.006, 0.006, 0.006, 8), MAT.paint('#3b3f42'), { pos: [cw * 0.28 + (k - 1) * 0.011, 0, 0.021], rot: [Math.PI / 2, 0, 0] }));
      } else {
        door.add(mesh(cyl(0.014, 0.014, 0.016, 10), MAT.metal('#a7adb0', { worn: 0.6 }), { pos: [cw * 0.28, -ch * 0.1, 0.014], rot: [Math.PI / 2, 0, 0] }));
        door.add(mesh(box(0.008, 0.026, 0.006), MAT.stainless({ spec: 0.6 }), { pos: [cw * 0.28, -ch * 0.1, 0.022], rot: [0, 0, range(rnd, -0.6, 0.6)] }));
      }
      const num = i * rows + j + 1;
      decal(door, { map: TEX.lightPanel({ text: String(num).padStart(2, '0'), bg: '#e8ecec', fg: '#33383b' }), w: 0.05, h: 0.036, pos: [-cw * 0.3, ch * 0.3, 0.012], opacity: 0.96, order: num % 3 });
      // 扉のたわみ・隙間ムラ
      door.rotation.y = range(rnd, -6e-3, 0.006);
      g.add(door);
      // 開いた扉（1 箇所だけ中が見える）
      if (i === 1 && j === rows - 1) {
        door.rotation.y = 0.62;
        door.position.x = x - cw * 0.42;
        door.position.z = D / 2 + 0.06;
        const inside = mesh(box(cw - 0.03, ch - 0.03, D - 0.06), MAT.paint('#2f3336', { spec: 0.03, steps: 2, shadowAmt: 1 }), { pos: [x, y, -0.01], cast: false, receive: true });
        g.add(inside);
        // 忘れ物風の傘 1 本
        const ub = mesh(cyl(0.011, 0.013, 0.5, 8), MAT.paint('#3d5a7a', { spec: 0.2 }), { pos: [x + 0.04, y - ch * 0.24, 0.02], rot: [0.1, 0, 0.22], cast: true, receive: true });
        g.add(ub);
        g.add(mesh(cyl(0.016, 0.016, 0.06, 8), MAT.rubber('#2b2f33'), { pos: [x + 0.06, y - ch * 0.24 + 0.27, 0.03], rot: [0.1, 0, 0.22] }));
      }
    }
  }
  // 上部の案内札と側面の通気口
  g.add(mesh(rbox(W * 0.72, 0.1, 0.02, 0.006, 2), MAT.paint('#e6e2d4', { map: TEX.signboard({ text: 'コインロッカー', bg: '#e6e2d4', fg: '#3d4a52', size: 120 }), spec: 0.1, steps: 2 }), { pos: [0, h + 0.09, 0.02], rot: [-0.12, 0, 0] }));
  // 経年：錆・凹み・貼紙・落書き
  for (let i = 0; i < 8; i++) {
    weather(g, {
      w: range(rnd, 0.08, 0.3),
      h: range(rnd, 0.1, 0.4),
      pos: [range(rnd, -W / 2, W / 2), range(rnd, 0.15, h - 0.1), D / 2 + 0.017],
      rot: [0, 0, 0],
      kind: i % 3 === 0 ? 'rust' : i % 3 === 1 ? 'scratch' : 'dirt',
      color: ['#8a5236', '#dcdad6', '#5d564c'][i % 3],
      opacity: range(rnd, 0.16, 0.36),
      seed: seed + 300 + i,
      density: 1.3,
    });
  }
  decal(g, { map: TEX.poster({ title: '注意', bg: '#f4e6d0', accent: '#c05a4a', seed: seed + 11 }), w: 0.16, h: 0.22, pos: [W / 2 - 0.02, h * 0.6, D / 2 + 0.02], rot: [0, 0, 0.02], opacity: 0.9 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
