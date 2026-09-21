import { g as grp, M as MAT, m as mesh, b as box, H as plane, h as decal, T as TEX, c as cyl, w as weather, n as range, r as rbox, q as finish, z as rand } from './index-C4-XtFer.js';

//  assets/store/glass-curtain-wall.js —— 正面大面積ガラスカーテンウォール
//  局所：+Z が外側（歩道側）、原点 = 幕墙中心（地面 y=0、内部で y を上げる）。
//  装配：世界 (STORE.cx, 0, STORE.z1)、rotY=0。

const meta = {
  id: 'glass-curtain-wall',
  real: [9.4, 2.85, 0.2],
  origin: 'center-ground',
};

function build(options = {}) {
  const {
    seed = 203,
    width = 9.4,
    height = 2.85,
    y0 = 0.12,
    bays = 7,
    doorBay = 3,
    doorW = 1.9,
    sillH = 0.16,
  } = options;
  const rnd = rand(seed);
  const g = grp('glass-curtain-wall');
  const HX = width / 2;

  const M = {
    alu: MAT.metal('#b9bec1', { worn: 0.4, dir: 'v', repeat: 2, spec: 0.55, specPower: 120 }),
    aluDark: MAT.metal('#7f8588', { worn: 0.65, spec: 0.4 }),
    rubber: MAT.rubber('#3a3f42'),
    // 全面ガラスは physical(transmission) だと店内が暗く潰れる（屈折バッファの解像度・
    // 室内灯が減光で届かない）。三渲二では「薄く透ける＋強い高光」が正しい見せ方。
    // opacity 0.13 → 0.08：後述の「1 枚化」と合わせて、店頭の一枚ガラスの被膜を
    // 26% → 8% に落とす。需要の核が「大ガラス越しに店内を見せる」なので。
    glass: MAT.glassLite({ color: '#dfeef0', opacity: 0.08, spec: 0.95, specPower: 240, rim: 0.34, shadowAmt: 0.22 }),
    glassEdge: MAT.paint('#bfe0dc', { spec: 0.6, specPower: 160, sheen: 0.2, steps: 2, shadowAmt: 0.35 }),
    skirt: MAT.tile({ color: '#d5cfc0', n: 6, repeat: 1 }),
  };

  const bayW = width / bays;
  const fw = 0.072;      // 框幅
  const dep = 0.11;      // 框奥行き
  const topY = y0 + height;

  /* ---------- 下枠・床レール・腰壁 ---------- */
  const base = grp('base');
  base.add(mesh(box(width, sillH, dep + 0.04), M.skirt, { pos: [0, y0 - sillH / 2 + 0.02, 0], name: 'sill-tile', cast: true, receive: true }));
  base.add(mesh(box(width + 0.04, 0.026, dep + 0.07), M.alu, { pos: [0, y0 + 0.012, 0.01], name: 'sill-cap', cast: true, receive: true }));
  base.add(mesh(box(width, 0.05, 0.07), M.aluDark, { pos: [0, y0 + 0.05, -0.02], name: 'track-recess', cast: false, receive: true }));
  for (let i = 0; i < 26; i++) {
    base.add(mesh(box(0.012, 0.052, 0.072), M.aluDark, { pos: [-HX + 0.18 + i * (width - 0.36) / 25, y0 + 0.05, -0.02], cast: false }));
  }
  g.add(base);

  /* ---------- 柱（バイポスト）と上框 ---------- */
  for (let i = 0; i <= bays; i++) {
    const x = -HX + i * bayW;
    const isDoor = i === doorBay || i === doorBay + 1;
    const m = mesh(box(fw, height, dep), M.alu, {
      name: 'mullion-' + i,
      pos: [x, y0 + height / 2, 0],
      cast: true,
      receive: true,
    });
    g.add(m);
    // 立ち上がり見切（内外）
    for (const s of [1, -1]) g.add(mesh(box(0.016, height, 0.012), M.aluDark, { pos: [x + s * (fw / 2 - 0.006), y0 + height / 2, s * (dep / 2 - 0.004)], cast: false }));
    if (isDoor) continue;
    // ドア上部は横梁
  }
  g.add(mesh(box(width, fw * 1.25, dep), M.alu, { pos: [0, topY - fw * 0.6, 0], name: 'head', cast: true, receive: true }));
  g.add(mesh(box(width + 0.05, 0.035, dep + 0.05), M.alu, { pos: [0, topY + 0.02, 0], name: 'head-cap', cast: true, receive: true }));
  // ドア上の横梁
  g.add(mesh(box(doorW + 0.2, fw, dep), M.alu, { pos: [-HX + doorBay * bayW + bayW / 2, y0 + 2.36, 0], name: 'transom', cast: true, receive: true }));
  // 中間横框（腰窓ライン）
  for (const x of [-HX + doorBay * bayW / 2, HX - (bays - doorBay - 1) * bayW / 2 - bayW / 2]) {
    g.add(mesh(box(bayW * (x < 0 ? doorBay : bays - doorBay - 1), 0.04, dep * 0.6), M.alu, { pos: [x, y0 + 1.62, 0.006], cast: false, receive: true }));
  }

  /* ---------- ガラス ---------- */
  for (let i = 0; i < bays; i++) {
    const cx = -HX + (i + 0.5) * bayW;
    const isDoor = i === doorBay;
    const gh = isDoor ? 2.36 - y0 - 0.06 : height - fw * 1.6;
    const gy = isDoor ? y0 + gh / 2 + 0.04 : y0 + height / 2;
    const gw = bayW - fw * 1.1;
    // **ガラスを box で作らない。** glassLite は既定が DoubleSide なので、
    // box(gw, gh, 0.012) は手前面と奥面が**両方**描かれて 1 枚の窓で 2 層になる。
    // 実測で店頭のガラス 1 枚を貫く視線に α0.13 が 4 ヒット、冷藏ケースの
    // ドアガラス（旧 0.34）と合わせて**透過率 37.8%** —— 「橱窗が起雾」の正体だった。
    // 平面 1 枚にすればどの方向から見ても必ず 1 層。厚みは下の緑辺（glassEdge）が
    // 既に表現しているので box である用はない。
    const pane = mesh(plane(gw, gh), M.glass, { name: 'glass-' + i, pos: [cx, gy, 0], cast: false, receive: false });
    // 反光は「上部 1/3 の帯」だけにする：全面に薄く巻くと店内が白んで見えない
    pane.userData.glassShine = { w: gw * 0.9, h: gh * 0.3, y: gh * 0.3, z: 0.012, speed: 0.032 + i * 0.004, phase: i * 0.37, opacity: 0.07 };
    g.add(pane);
    // ガラスの緑辺り（エッジ）
    for (const [dx, dy, bw, bh] of [[0, gh / 2, gw, 0.008], [0, -gh / 2, gw, 0.008], [-gw / 2, 0, 0.008, gh], [gw / 2, 0, 0.008, gh]]) {
      g.add(mesh(box(bw, bh, 0.016), M.glassEdge, { pos: [cx + dx, gy + dy, 0], cast: false }));
    }
    // パッキン：枠（4 本）であって「全面を覆う板」ではない。
    // 以前は pane と同じ大きさの box をガラスの室内側に置いていたため、
    // 橱窗全体が不透明のゴム板で塞がれ、店内がまったく見えなかった（需要の核なのに）。
    const pz = -dep / 2 + 0.012;
    for (const [dx, dy, bw, bh] of [
      [0, gh / 2 + 0.007, gw + 0.024, 0.014], [0, -gh / 2 - 0.007, gw + 0.024, 0.014],
      [-gw / 2 - 0.007, 0, 0.014, gh + 0.014], [gw / 2 + 0.007, 0, 0.014, gh + 0.014],
    ]) {
      g.add(mesh(box(bw, bh, 0.012), M.rubber, { pos: [cx + dx, gy + dy, pz], cast: false }));
    }
    // 室内側の表示・ポスター（ガラスに貼る）
    if (i === 1) decal(g, { map: TEX.signboard({ text: '24時間営業', bg: 'rgba(0,0,0,0)', fg: 'rgba(246,243,236,0.9)', size: 120 }), w: bayW * 0.72, h: 0.2, pos: [cx, y0 + 2.1, 0.014], opacity: 0.9, order: 1 });
    if (i === 5) decal(g, { map: TEX.poster({ title: '春の桜フェア', bg: '#f7ece0', accent: '#e08aa4', seed: seed + i }), w: bayW * 0.56, h: bayW * 0.78, pos: [cx, y0 + 1.15, 0.014], opacity: 0.95, order: 2 });
    if (i === 6) decal(g, { map: TEX.signboard({ text: '禁煙', bg: 'rgba(0,0,0,0)', fg: 'rgba(200,80,60,0.9)', size: 110, ar: 1 }), w: 0.34, h: 0.34, pos: [cx, y0 + 1.9, 0.014], opacity: 0.9, order: 3 });
  }

  /* ---------- ドア枠・上センサー回り・戸当り ---------- */
  const doorCx = -HX + doorBay * bayW + bayW / 2;
  g.add(mesh(box(doorW + 0.24, 0.09, dep + 0.03), M.alu, { pos: [doorCx, y0 + 2.4, 0], name: 'door-head', cast: true, receive: true }));
  g.add(mesh(box(0.34, 0.1, 0.09), MAT.plastic('#2f3336', { spec: 0.3, sheen: 0.05 }), { pos: [doorCx, y0 + 2.46, dep / 2 - 0.01], name: 'sensor-window', cast: false }));
  for (const s of [-1, 1]) {
    g.add(mesh(cyl(0.008, 0.008, 0.05, 8), M.aluDark, { pos: [doorCx + s * 0.14, y0 + 2.4, dep / 2], cast: false }));
  }
  // 側部の見切・雨仕舞（端部は袖壁に収まる）
  for (const s of [-1, 1]) {
    g.add(mesh(box(0.05, height, dep + 0.05), M.alu, { pos: [s * (HX - 0.02), y0 + height / 2, 0], cast: true, receive: true }));
  }
  // 上部換気（ハゼ付きダクト）
  g.add(mesh(box(width * 0.5, 0.07, 0.07), M.aluDark, { pos: [-width * 0.18, topY + 0.08, -0.02], cast: false }));

  /* ---------- 経年：指紋・拭き筋・雨染み・飛石・パッキン劣化 ---------- */
  for (let i = 0; i < 14; i++) {
    const cx = -HX + (Math.floor(rnd() * bays) + 0.5) * bayW;
    weather(g, {
      w: bayW * 0.5,
      h: 0.5 + rnd() * 0.9,
      pos: [cx + range(rnd, -0.18, 0.18), y0 + 0.5 + rnd() * 1.5, 0.019],
      kind: ['dirt', 'scratch', 'chip'][(i + 1) % 3],
      color: ['#b8c4c2', '#8f9a98', '#d8ded8'][(i + 1) % 3],
      opacity: 0.18,
      seed: seed + 200 + i,
      density: 1.1,
    });
  }
  // ドレントラブル（下枠の汚れ）
  weather(g, { w: width * 0.9, h: 0.1, pos: [0, y0 + 0.04, 0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5f6a66', opacity: 0.34, seed: seed + 260, density: 1.6 });
  // ガラスの欠け（飛石）
  for (let i = 0; i < 4; i++) {
    const cx = -HX + (Math.floor(rnd() * bays) + 0.5) * bayW;
    g.add(mesh(rbox(0.02 + rnd() * 0.03, 0.016, 0.006, 0.004, 1), MAT.paint('#eef6f4', { spec: 0.6, steps: 2 }), { pos: [cx + range(rnd, -0.2, 0.2), y0 + 0.3 + rnd() * 0.5, 0.02], rot: [0, rnd(), 0], cast: false }));
  }

  return finish(g, { outline: 'thin', minSize: 0.08, includePlanes: false });
}

export { build, build as default, meta };
