import { g as grp, M as MAT, P as PAL, m as mesh, r as rbox, b as box, w as weather, T as TEX, h as decal, c as cyl, i as grill, t as tor, n as range, o as lathe, p as shadowBlob, q as finish, z as rand } from './index-C4-XtFer.js';

//  assets/street/trash-bin-recyclable.js —— 資源ごみ箱（缶・びん・ペットの 3 分別口＋網カバー）
//  原点 = 地面接触中心 / +Y 上 / 正面（3 つの区分帯とラベル）+Z

const meta = {
  id: 'trash-bin-recyclable',
  real: [0.72, 0.66, 0.40],
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);

  const g = grp('trash-bin-recyclable');

  /* ---------------- 寸法 ---------------- */
  const W = 0.72, D = 0.40, y0 = 0.055, y1 = 0.578;
  const bh = y1 - y0, yb = (y0 + y1) / 2;
  const wall = 0.022;
  const cells = [                       // 左：かん／中：びん／右：ペット
    { x: -0.22, band: PAL.signBlue, name: 'かん', en: 'CANS', flap: 66 },        // かん口は蝶番が緩んで開きっぱなし
    { x: 0.000, band: PAL.awningGreen, name: 'びん', en: 'BOTTLES', flap: 7 },
    { x: 0.220, band: PAL.markingYellow, name: 'ペット', en: 'PET', flap: 5 },
  ];
  const openX = [[-0.315, -0.125], [-0.095, 0.095], [0.125, 0.315]];
  const openZ = [-0.105, 0.105];

  /* ---------------- 材質 ---------------- */
  // 胴：色褪せた青緑樹脂（PAL.lampGreen を日焼けさせた色）
  const bodyMat = MAT.plastic(PAL.lampGreen, { sat: 0.66, tint: '#e9eef0', steps: 3, uv: { repeat: [3, 2] } });
  const bodyDeep = MAT.plastic(PAL.lampGreen, { sat: 0.8, tint: '#cfd8d8' });
  const deckMat = MAT.plastic('#4c5a60', { sat: 0.85, tint: '#eef2f2', steps: 3 });
  const innerMat = MAT.paint('#3c4348', { steps: 2, shadowAmt: 1 });
  const alu = MAT.metal('#c7cbcd', { spec: 0.66, sheen: 0.2, repeat: 4 });
  const steelDark = MAT.darkIron({ repeat: 5 });
  const acrylic = MAT.glassLite({ color: '#d8ecee', opacity: 0.4 });

  /* ================= 基礎（コンクリート台）＋胴 ================= */
  const plinth = grp('plinth');
  g.add(plinth);
  plinth.add(mesh(rbox(W + 0.05, 0.055, D + 0.05, 0.008, 2), MAT.concrete({ repeat: 3 }), { pos: [0, 0.0275, 0] }));
  plinth.add(mesh(box(W + 0.014, 0.012, D + 0.014), MAT.concrete({ base: PAL.concreteDark, repeat: 3 }), { pos: [0, 0.060, 0] }));
  weather(plinth, { w: 0.30, h: 0.06, pos: [-0.13, 0.048, D / 2 + 0.028], kind: 'moss', color: PAL.moss, opacity: 0.6, seed: seed + 3, density: 1.6, spread: 0.006 });
  weather(plinth, { w: 0.22, h: 0.05, pos: [0.20, 0.055, -0.226], rot: [0, Math.PI, 0], kind: 'dirt', color: '#5c5347', opacity: 0.55, seed: seed + 4, spread: 0.005 });

  const body = grp('body');
  g.add(body);
  body.add(mesh(box(W, bh, wall), bodyMat, { pos: [0, yb, D / 2 - wall / 2] }));
  body.add(mesh(box(W, bh, wall), bodyMat, { pos: [0, yb, -0.189] }));
  body.add(mesh(box(wall, bh, D - wall * 2), bodyMat, { pos: [-0.349, yb, 0] }));
  body.add(mesh(box(wall, bh, D - wall * 2), bodyMat, { pos: [W / 2 - wall / 2, yb, 0] }));
  body.add(mesh(box(W - 0.018, 0.02, D - 0.018), MAT.paint('#333a3e', { steps: 2, shadowAmt: 1, map: TEX.concrete({ base: '#3a4145', repeat: 4 }).map }), { pos: [0, y0 + 0.01, 0] }));
  // 胴のリブ（縦溝）
  for (const x of [-0.34, -0.11, 0.11, 0.34]) {
    body.add(mesh(box(0.016, bh - 0.06, 0.010), bodyDeep, { pos: [x, yb + 0.01, D / 2 + 0.001] }));
    body.add(mesh(box(0.016, bh - 0.06, 0.010), bodyDeep, { pos: [x, yb + 0.01, -0.201] }));
  }
  for (const sx of [-1, 1]) {
    body.add(mesh(box(0.010, bh - 0.06, 0.016), bodyDeep, { pos: [sx * (W / 2 + 0.001), yb + 0.01, -0.09] }));
    body.add(mesh(box(0.010, bh - 0.06, 0.016), bodyDeep, { pos: [sx * (W / 2 + 0.001), yb + 0.01, 0.09] }));
  }
  // 下部の帯（打増し）＋脚部
  body.add(mesh(box(W + 0.01, 0.026, D + 0.01), bodyDeep, { pos: [0, y0 + 0.05, 0] }));

  /* ================= 内部：仕切り 2 枚＋内側の汚れ ================= */
  const inner = grp('inner');
  g.add(inner);
  for (const x of [-0.11, 0.11]) {
    inner.add(mesh(box(0.018, bh - 0.05, D - wall * 2 - 0.01), innerMat, { pos: [x, yb - 0.015, 0] }));
    inner.add(mesh(box(0.026, 0.03, D - wall * 2), bodyDeep, { pos: [x, y1 - 0.045, 0] }));
  }
  const innerFaces = [
    [[0.05, 0.30, D / 2 - wall - 0.004], [0, Math.PI, 0], 0.42],
    [[-0.05, 0.28, -0.17400000000000002], [0, 0, 0], 0.42],
    [[-0.33399999999999996, 0.26, 0.03], [0, Math.PI / 2, 0], 0.28],
    [[W / 2 - wall - 0.004, 0.30, -0.03], [0, -Math.PI / 2, 0], 0.28],
  ];
  innerFaces.forEach(([pos, rot, fw], k) => {
    weather(inner, { w: fw, h: 0.26, pos, rot, kind: 'dirt', color: '#20242a', opacity: 0.5, seed: seed + 11 + k, density: 1.7, spread: 0.006 });
    // 洗剤の残り跡（白い筋）
    weather(inner, { w: fw * 0.5, h: 0.26, pos: [pos[0], 0.24, pos[2]], rot, kind: 'rust', color: '#dfe7e4', opacity: 0.5, seed: seed + 21 + k, density: 0.8, spread: 0.005 });
  });

  /* ================= 天板（3 か所の開口） ================= */
  const deck = grp('deck');
  g.add(deck);
  const yD0 = y1, yD1 = y1 + 0.024;
  deck.add(mesh(box(W, 0.024, 0.095), deckMat, { pos: [0, yD0 + 0.012, 0.1525] }));            // 前帯
  deck.add(mesh(box(W, 0.024, 0.095), deckMat, { pos: [0, yD0 + 0.012, -0.1525] }));           // 後帯
  deck.add(mesh(box(0.045, 0.024, D - 0.19), deckMat, { pos: [-0.3375, yD0 + 0.012, 0] }));    // 左肩
  deck.add(mesh(box(0.045, 0.024, D - 0.19), deckMat, { pos: [0.3375, yD0 + 0.012, 0] }));     // 右肩
  deck.add(mesh(box(0.030, 0.024, D - 0.19), deckMat, { pos: [-0.11, yD0 + 0.012, 0] }));      // 仕切上
  deck.add(mesh(box(0.030, 0.024, D - 0.19), deckMat, { pos: [0.11, yD0 + 0.012, 0] }));
  // 開口の立上り（コollar：厚みあり・内面あり）
  for (const [a, b] of openX) {
    for (const sz of [-1, 1]) {
      deck.add(mesh(box(b - a, 0.030, 0.012), deckMat, { pos: [(a + b) / 2, yD1 + 0.003, sz * (openZ[1] + 0.006)] }));
    }
    for (const [x0, x1] of [[a, a + 0.012], [b - 0.012, b]]) {
      deck.add(mesh(box(x1 - x0, 0.030, openZ[1] - openZ[0] + 0.024), deckMat, { pos: [(x0 + x1) / 2, yD1 + 0.003, 0] }));
    }
  }
  deck.add(mesh(box(W + 0.012, 0.014, D + 0.012), deckMat, { pos: [0, yD0 - 0.004, 0] }));     // 縁の受け

  /* ================= 区分帯（青 / 緑 / 黄）とラベル ================= */
  for (const c of cells) {
    const band = grp(`band-${c.name}`);
    body.add(band);
    const bw = 0.185;
    band.add(mesh(rbox(bw, 0.155, 0.012, 0.004, 2), MAT.plastic(c.band, { sat: 0.74, tint: '#f2f4ee', steps: 2 }), { pos: [c.x, 0.40, D / 2 + 0.002] }));
    band.add(mesh(rbox(bw - 0.03, 0.062, 0.008, 0.003, 2), MAT.paint(PAL.marking, { sat: 0.9, tint: '#f8f2e6' }), { pos: [c.x, 0.405, D / 2 + 0.008] }));
    decal(band, {
      map: TEX.signboard({ text: c.name, sub: c.en, bg: '#f6f2e6', fg: c.band === PAL.markingYellow ? '#6a5320' : '#2d3a44' }),
      w: 0.15, h: 0.0375, pos: [c.x, 0.405, D / 2 + 0.0128],
    });
    // 開口前の注意札（投入口の直下）
    band.add(mesh(rbox(0.155, 0.030, 0.007, 0.002, 2), MAT.paint(c.band, { sat: 0.8, tint: '#f6f2e6' }), { pos: [c.x, 0.545, D / 2 + 0.0025] }));
    decal(band, { map: TEX.signboard({ text: `${c.name}のみ`, bg: c.band, fg: '#fff8ea' }), w: 0.13, h: 0.024, pos: [c.x, 0.545, D / 2 + 0.0065] });
    // 帯の経年（退色・剥がれ）
    weather(band, { w: 0.12, h: 0.06, pos: [c.x + 0.02, 0.34, D / 2 + 0.009], kind: 'chip', color: '#e6e0d2', opacity: 0.55, seed: seed + 31 + Math.round(c.x * 100), density: 1.5, spread: 0.005 });
  }
  // 胴全体の経年：日焼け・泥・落ちたステッカー
  decal(body, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']] }), w: W - 0.04, h: 0.22, pos: [0.02, 0.50, D / 2 + 0.0024], opacity: 0.26 });   // 経年：退色
  weather(body, { w: 0.26, h: 0.10, pos: [-0.05, 0.13, D / 2 + 0.0026], kind: 'dirt', color: '#5f5545', opacity: 0.55, seed: seed + 35, density: 1.8, spread: 0.006 });
  weather(body, { w: 0.15, h: 0.20, pos: [W / 2 + 0.0026, 0.30, -0.05], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#8a7a5e', opacity: 0.4, seed: seed + 36, density: 1.2, spread: 0.005 });
  decal(body, { map: TEX.wear({ kind: 'chip', color: '#efe7d6', seed: seed + 37, density: 1.0 }), w: 0.10, h: 0.09, pos: [0.30, 0.24, D / 2 + 0.0027], opacity: 0.75, rot: [0, 0, 8 * D2R] });   // 貼紙残り
  weather(body, { w: 0.24, h: 0.06, pos: [0, 0.09, D / 2 + 0.0028], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 38, density: 1.5, spread: 0.005 });

  /* ================= 投入口フラップ（内側へ吊り下がる蓋） ================= */
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const [a, b] = openX[i];
    const flap = grp(`flap-${c.name}`, { pos: [(a + b) / 2, yD1 - 0.004, openZ[0] + 0.006] });
    deck.add(flap);
    flap.rotation.x = c.flap * D2R;                       // 内側へ倒れ込む（上面と干渉しない）
    const fw = b - a - 0.020, fd = openZ[1] - openZ[0] - 0.012;
    flap.add(mesh(rbox(fw, 0.010, fd, 0.003, 2), acrylic, { pos: [0, -5e-3, fd / 2], cast: false, receive: false }));
    flap.add(mesh(box(fw, 0.014, 0.012), alu, { pos: [0, -5e-3, fd] }));                                  // 前縁の重り
    flap.add(mesh(box(fw - 0.02, 0.012, 0.009), alu, { pos: [0, -5e-3, fd * 0.52] }));                     // 補強
    for (const sx of [-1, 1]) flap.add(mesh(cyl(0.006, 0.006, 0.022, 8), steelDark, { pos: [sx * (fw / 2 - 0.006), 0.0, 0.004], rot: [Math.PI / 2, 0, 0] }));
    decal(flap, { map: TEX.signboard({ text: 'おして', bg: '#e8eef0', fg: '#3d4a52' }), w: 0.10, h: 0.025, pos: [0, -0.0108, fd * 0.55], rot: [Math.PI, 0, 0], opacity: 0.85 });
    // ヒンジの錆
    weather(flap, { w: 0.05, h: 0.03, pos: [0, -2e-3, 0.006], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 41 + i, spread: 0.004 });
  }

  /* ================= 網カバー（カラス除け・上面全体） ================= */
  const net = grp('net-cover');
  g.add(net);
  const yN = yD1 + 0.030;
  const nw = W - 0.030, nd = D - 0.030;
  // 網本体（grill() は親 Group へ実体を add する）
  grill(net, { w: nw, h: nd, nx: 15, ny: 10, bar: 0.005, mat: MAT.metal('#a9aeb0', { repeat: 3 }), pos: [0, yN, 0], rot: [-Math.PI / 2, 0, 0] });
  // 網の枠（アルミアングル 4 本）
  for (const sz of [-1, 1]) net.add(mesh(rbox(nw + 0.014, 0.014, 0.016, 0.004, 2), alu, { pos: [0, yN + 0.004, sz * (nd / 2 + 0.006)] }));
  for (const sx of [-1, 1]) net.add(mesh(rbox(0.016, 0.014, nd + 0.014, 0.004, 2), alu, { pos: [sx * (nw / 2 + 0.006), yN + 0.004, 0] }));
  // 蝶番 2 客（後面）と前金の具＋南京錠
  for (const x of [-0.2, 0.20]) {
    net.add(mesh(rbox(0.048, 0.010, 0.040, 0.003, 2), alu, { pos: [x, yN + 0.002, -0.199] }));
    net.add(mesh(cyl(0.0065, 0.0065, 0.050, 8), steelDark, { pos: [x, yN + 0.002, -0.209], rot: [0, Math.PI / 2, 0] }));
  }
  net.add(mesh(box(0.050, 0.030, 0.012), alu, { pos: [0.16, yN - 0.006, nd / 2 + 0.010] }));
  net.add(mesh(tor(0.0105, 0.0032, 6, 12), MAT.metal('#8f9497', { worn: 0.7 }), { pos: [0.16, yN - 0.026, nd / 2 + 0.010] }));
  net.add(mesh(rbox(0.020, 0.026, 0.014, 0.004, 2), MAT.metalPaint(PAL.storeBand2, { worn: 0.7, repeat: 5 }), { pos: [0.16, yN - 0.041, nd / 2 + 0.012] }));   // 南京錠
  weather(net, { w: 0.30, h: 0.06, pos: [-0.1, yN + 0.010, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4b4f4a', opacity: 0.4, seed: seed + 51, density: 1.4, spread: 0.006 });
  weather(net, { w: 0.14, h: 0.10, pos: [0.26, yN + 0.011, -0.06], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 52, spread: 0.005 });

  /* ================= 中身：缶・びん・ペットの顶部（投入口から覗く） ================= */
  const stuff = grp('contents');
  g.add(stuff);
  // かん：3 本立ち＋1 本倒れ（cell: x -0.315..-0.125）
  for (const [x, z, tilt, col] of [[-0.268, 0.035, 0, '#c94f45'], [-0.228, 0.062, 0, '#cfd4d8'], [-0.192, 0.028, 5, '#3d76b4'], [-0.24, 0.085, -84, '#d8b04a']]) {
    const can = grp('can');
    can.position.set(x + range(rnd, -6e-3, 0.006), tilt === 0 || Math.abs(tilt) < 10 ? 0.470 : 0.118, z + range(rnd, -6e-3, 0.006));
    can.rotation.set(tilt * D2R, range(rnd, -30, 30) * D2R, range(rnd, -5, 5) * D2R);
    stuff.add(can);
    can.add(mesh(cyl(0.0325, 0.0305, 0.108, 16), MAT.canBody({ color: col, map: TEX.drinkLabel({ name: 'コーヒー', sub: 'BLACK', ml: '185g', a: col, b: '#f4eee2' }) }), { pos: [0, -0.02, 0] }));
    can.add(mesh(cyl(0.0325, 0.0325, 0.004, 16), MAT.metal('#dfe3e5', { repeat: 8 }), { pos: [0, 0.034, 0] }));
    can.add(mesh(tor(0.0300, 0.0026, 5, 16), MAT.metal('#c3c8ca', { repeat: 8 }), { pos: [0, 0.0325, 0], rot: [Math.PI / 2, 0, 0] }));
    can.add(mesh(rbox(0.016, 0.0035, 0.010, 0.0015, 2), MAT.metal('#e6eaec', { repeat: 8 }), { pos: [0.006, 0.0365, 0], rot: [0, 0.5, 0] }));   // 拉开きリング
    can.add(mesh(rbox(0.007, 0.0030, 0.009, 0.0012, 2), MAT.metal('#c8b6a4', { worn: 0.6, repeat: 8 }), { pos: [-8e-3, 0.0358, 0.006], rot: [0, 0.9, 0] }));   // 僅かに錆びたツメ
  }
  // びん：3 本（首とキャップが顔を出す）
  for (const [x, z, tilt] of [[0.032, 0.048, 4], [-0.038, 0.022, -3], [0.004, 0.075, 7]]) {
    const bt = grp('bottle');
    bt.position.set(x, 0.438, z);
    bt.rotation.set(tilt * D2R, range(rnd, -20, 20) * D2R, range(rnd, -4, 4) * D2R);
    stuff.add(bt);
    bt.add(mesh(lathe([[0, -0.075], [0.030, -0.073], [0.0325, -0.04], [0.031, 0.01], [0.0205, 0.045], [0.0125, 0.062], [0.0120, 0.086], [0.0135, 0.094], [0.0075, 0.098], [0, 0.099]], 16),
      MAT.glassLite({ color: '#bcd8c4', opacity: 0.52 }), { cast: false, receive: false }));
    bt.add(mesh(cyl(0.0142, 0.0138, 0.014, 12), MAT.plastic('#7fbf90', { repeat: 6 }), { pos: [0, 0.101, 0] }));
    bt.add(mesh(cyl(0.0325, 0.0325, 0.004, 14), MAT.glassLite({ color: '#cfe4d6', opacity: 0.4 }), { pos: [0, -0.072, 0], cast: false }));
    // 洗剤の残り跡（びん胴に白濁）
    decal(bt, { map: TEX.wear({ kind: 'dirt', color: '#e7eeea', seed: seed + 61 + Math.round(x * 100), density: 1.2 }), w: 0.046, h: 0.058, pos: [0.0125, -0.02, 0.0312], rot: [0, 22 * D2R, 0], opacity: 0.55 });
  }
  // ペット：2 本倒れ＋1 本立ち（キャップ青）
  for (const [x, z, tilt, spin, cap] of [[0.186, 0.048, 86, 0.40, '#7fb0dd'], [0.256, 0.028, 90, 1.30, '#eeeade'], [0.214, 0.078, 11, 0.10, '#7fb0dd']]) {
    const pt = grp('pet');
    pt.position.set(x, Math.abs(tilt) > 45 ? 0.128 : 0.404, z);
    pt.rotation.set(tilt * D2R, spin, range(rnd, -6, 6) * D2R);
    stuff.add(pt);
    pt.add(mesh(lathe([[0, -0.11], [0.030, -0.107], [0.0345, -0.08], [0.033, -0.01], [0.030, 0.03], [0.0175, 0.075], [0.0135, 0.092], [0.0142, 0.104], [0.0085, 0.108], [0, 0.109]], 16),
      MAT.glassLite({ color: '#dfeff2', opacity: 0.42 }), { scale: [1, 1, 0.84], cast: false, receive: false }));
    pt.add(mesh(cyl(0.0150, 0.0146, 0.012, 12), MAT.plastic(cap, { repeat: 6 }), { pos: [0, 0.112, 0] }));
    pt.add(mesh(cyl(0.0300, 0.0300, 0.016, 14), MAT.paint('#e9eef2', { steps: 2 }), { pos: [0, 0.026, 0], scale: [1, 1, 0.82], cast: false }));   // 潰れた胴回り
    pt.add(mesh(rbox(0.050, 0.030, 0.0015, 0.0008, 2), MAT.paper({ color: '#f2ede0' }), { pos: [0, -0.01, 0.0295], cast: false }));               // 巻ラベル
  }

  shadowBlob(g, { r: 0.40, pos: [0, 0.004, 0], opacity: 0.28, ratio: 0.56 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
