import { g as grp, M as MAT, m as mesh, b as box, c as cyl, h as decal, T as TEX, w as weather, n as range, r as rbox, q as finish, z as rand } from './index-BxWjt-aN.js';

//  assets/store/auto-door.js —— 自動ドア（2 葉・開いた状態）
//  局所：+Z が外（歩道側）、原点 = 開口中心（地面 y=0）。装配：世界 (STORE.doorX, 0, STORE.z1 + 0.02)。

const meta = {
  id: 'auto-door',
  real: [1.9, 2.4, 0.22],
  origin: 'center-ground',
};

function build(options = {}) {
  const { seed = 207, width = 1.9, height = 2.32, open = 0.35, y0 = 0.12 } = options;
  const rnd = rand(seed);
  const g = grp('auto-door');
  const HX = width / 2;

  const M = {
    alu: MAT.metal('#bcc1c4', { worn: 0.35, dir: 'v', repeat: 2, spec: 0.55, specPower: 120 }),
    aluDark: MAT.metal('#7d8386', { worn: 0.6 }),
    glass: MAT.glassLite({ color: '#eaf3f4', opacity: 0.13, spec: 0.95, specPower: 240, rim: 0.34, shadowAmt: 0.22 }),
    edge: MAT.paint('#c3e2dd', { spec: 0.6, specPower: 170, sheen: 0.2, steps: 2, shadowAmt: 0.35 }),
    rubber: MAT.rubber('#33383b'),
    plastic: MAT.plastic('#2c3134', { spec: 0.3, sheen: 0.06 }),
    sticker: MAT.paint('#f2eee2', { spec: 0.14, steps: 2 }),
  };

  /* ---------- 戸袋（左右の框）と上框 ---------- */
  for (const s of [-1, 1]) {
    const jamb = grp('jamb' + (s > 0 ? '-r' : '-l'));
    jamb.add(mesh(box(0.12, height + 0.16, 0.2), M.alu, { pos: [s * (HX + 0.06), y0 + (height + 0.16) / 2, 0], cast: true, receive: true }));
    jamb.add(mesh(box(0.03, height + 0.16, 0.22), M.aluDark, { pos: [s * (HX + 0.012), y0 + (height + 0.16) / 2, 0], cast: false }));
    // 丁番・調整ネジ
    for (let i = 0; i < 3; i++) {
      jamb.add(mesh(cyl(0.012, 0.012, 0.03, 8), M.aluDark, { pos: [s * (HX + 0.12), y0 + 0.4 + i * 0.75, 0.06], rot: [0, 0, Math.PI / 2], cast: false }));
    }
    g.add(jamb);
  }
  const head = grp('head');
  head.add(mesh(box(width + 0.3, 0.16, 0.22), M.alu, { pos: [0, y0 + height + 0.08, 0], cast: true, receive: true }));
  head.add(mesh(box(width + 0.34, 0.03, 0.26), M.alu, { pos: [0, y0 + height + 0.17, 0], cast: true, receive: true }));
  // センサー（黒帯）と LED
  head.add(mesh(box(width * 0.62, 0.055, 0.03), M.plastic, { pos: [0, y0 + height + 0.1, 0.11], cast: false }));
  const led = mesh(box(0.06, 0.02, 0.012), MAT.ledOn('#6fe08a'), { pos: [width * 0.2, y0 + height + 0.1, 0.128], cast: false });
  led.userData.breathe = { speed: 0.9, amount: 0.22, phase: 1.2 };
  head.add(led);
  head.add(mesh(box(0.05, 0.02, 0.012), MAT.ledOff('#4a3a3a'), { pos: [-width * 0.2, y0 + height + 0.1, 0.128], cast: false }));
  // 「自動ドア」表示
  decal(head, { map: TEX.signboard({ text: '自動ドア', bg: 'rgba(0,0,0,0)', fg: 'rgba(60,66,70,0.92)', size: 120 }), w: 0.34, h: 0.06, pos: [0, y0 + height + 0.1, 0.118], opacity: 0.95 });
  g.add(head);
  // ドアクローザ（内側）
  const closer = grp('closer');
  closer.add(mesh(box(width * 0.7, 0.06, 0.05), M.aluDark, { pos: [0, y0 + height - 0.06, -0.09], cast: false }));
  for (const s of [-1, 1]) closer.add(mesh(cyl(0.014, 0.014, 0.1, 8), M.alu, { pos: [s * width * 0.28, y0 + height - 0.12, -0.06], rot: [Math.PI / 2, 0, 0], cast: false }));
  g.add(closer);

  /* ---------- 建具 2 葉（open 分だけ左右にスライド） ---------- */
  const leafW = width / 2;
  const slide = open * leafW * 0.92;
  for (const s of [-1, 1]) {
    const leaf = grp('leaf-' + (s < 0 ? 'l' : 'r'));
    const lx = s * (leafW / 2 + slide);
    leaf.position.set(lx, 0, 0);
    // ガラス
    const pane = mesh(box(leafW - 0.05, height - 0.2, 0.01), M.glass, { pos: [0, y0 + height / 2, 0], cast: false });
    pane.userData.glassShine = { w: leafW * 0.8, h: height * 0.75, z: 0.012, speed: 0.05, phase: s * 1.3 + 0.4, opacity: 0.1 };
    leaf.add(pane);
    // 上下アルミ框・縦框
    for (const [dy, bh] of [[y0 + 0.04, 0.08], [y0 + height - 0.06, 0.07]]) {
      leaf.add(mesh(box(leafW - 0.03, bh, 0.05), M.alu, { pos: [0, dy, 0], cast: true, receive: true }));
    }
    leaf.add(mesh(box(0.035, height - 0.14, 0.05), M.alu, { pos: [s * (leafW / 2 - 0.03), y0 + height / 2, 0], cast: true, receive: true }));
    // ガラス押さえゴム
    for (const [dy, bw, bh] of [[y0 + 0.08, leafW - 0.06, 0.014], [y0 + height - 0.1, leafW - 0.06, 0.014]]) {
      for (const zz of [0.026, -0.026]) leaf.add(mesh(box(bw, bh, 0.01), M.rubber, { pos: [0, dy, zz], cast: false }));
    }
    // 安全ステッカー（手押し側・中央帯）
    decal(leaf, { map: TEX.signboard({ text: 'ご注意', bg: 'rgba(0,0,0,0)', fg: 'rgba(70,80,86,0.85)', size: 96 }), w: leafW * 0.5, h: 0.09, pos: [0, y0 + 1.02, 0.03], opacity: 0.9, order: 1 });
    leaf.add(mesh(box(leafW * 0.62, 0.02, 0.012), M.sticker, { pos: [0, y0 + 0.94, 0.031], cast: false }));
    // 下端ブラシ・ガイドシュー
    leaf.add(mesh(box(leafW - 0.05, 0.026, 0.05), M.rubber, { pos: [0, y0 - 0.01, 0], cast: false }));
    for (const dz of [-0.03, 0.03]) leaf.add(mesh(cyl(0.014, 0.014, 0.03, 8), M.plastic, { pos: [0, y0 - 0.03, dz], rot: [Math.PI / 2, 0, 0], cast: false }));
    // 指紋・手あか
    weather(leaf, { w: leafW * 0.5, h: 0.6, pos: [range(rnd, -0.1, 0.1), y0 + 1.1, 0.021], kind: 'dirt', color: '#9fb0ae', opacity: 0.2, seed: seed + (s > 0 ? 11 : 13), density: 1.4 });
    g.add(leaf);
  }

  /* ---------- 床レール・ガイド・感応エリア表示 ---------- */
  const track = grp('floor-track');
  track.add(mesh(box(width + 0.24, 0.03, 0.1), M.aluDark, { pos: [0, y0 - 0.005, 0], cast: false, receive: true }));
  track.add(mesh(box(width + 0.2, 0.016, 0.05), MAT.paint('#22262a', { spec: 0.1, steps: 2 }), { pos: [0, y0 + 0.008, 0], cast: false, receive: true }));
  for (let i = 0; i < 13; i++) {
    track.add(mesh(box(0.014, 0.02, 0.052), M.aluDark, { pos: [-HX + 0.06 + i * (width - 0.12) / 12, y0 + 0.012, 0], cast: false }));
  }
  // ガイドレール（室内側）
  track.add(mesh(box(width * 0.9, 0.012, 0.03), M.alu, { pos: [0, y0 + 0.006, -0.09], cast: false }));
  g.add(track);
  // 感応エリアの床ステッカー
  g.add(mesh(box(width * 0.86, 0.006, 0.34), MAT.paint('#e0dccd', { spec: 0.12, steps: 2, map: TEX.concrete({ base: '#e0dccd', repeat: 1 }).map }), { pos: [0, y0 + 0.018, 0.26], name: 'sensor-zone', cast: false, receive: true }));
  decal(g, { map: TEX.signboard({ text: '感応区域', bg: 'rgba(0,0,0,0)', fg: 'rgba(90,96,100,0.8)', size: 96 }), w: 0.4, h: 0.09, pos: [0, y0 + 0.024, 0.26], rot: [-Math.PI / 2, 0, 0], opacity: 0.85 });

  /* ---------- 経年：傷・サビ・砂・水垢・貼紙剥がし ---------- */
  for (let i = 0; i < 7; i++) {
    weather(g, {
      w: 0.1 + rnd() * 0.24,
      h: 0.3 + rnd() * 0.7,
      pos: [(rnd() - 0.5) * width, y0 + 0.3 + rnd() * 1.6, 0.055],
      kind: ['scratch', 'chip', 'dirt'][i % 3],
      color: ['#8a5236', '#cfcfc8', '#6f6a5e'][i % 3],
      opacity: 0.24,
      seed: seed + 40 + i,
      density: 1.2,
    });
  }
  // 下枠に詰まった砂利・落ち葉
  for (let i = 0; i < 12; i++) {
    g.add(mesh(rbox(0.02 + rnd() * 0.05, 0.008, 0.02 + rnd() * 0.04, 0.004, 1), i % 3 === 0 ? MAT.paper('#a8895c') : MAT.stone({ color: '#9a9488' }), {
      pos: [(rnd() - 0.5) * width, y0 + 0.014, (rnd() - 0.5) * 0.09],
      rot: [0, rnd() * 3, 0],
      cast: false,
      receive: true,
    }));
  }

  return finish(g, { outline: 'thin', minSize: 0.06 });
}

export { build, build as default, meta };
