import { g as grp, M as MAT, P as PAL, D as DoubleSide, m as mesh, r as rbox, c as cyl, e as radial, t as tor, w as weather, h as decal, T as TEX, b as box, o as lathe, q as finish, j as d2r, n as range, z as rand } from './index-C4-XtFer.js';

//  assets/bike/bike-park-sign.js
//  駐輪場看板 —— 「駐輪場」看板（退色・貼紙・雨だれ）＋整理券ポスト（アクリル黄変・中の券）
//   ＋時間表示プレート＋支柱とコンクリート基礎＋夜光反射帯。
//  単位：メートル。原点 = 支柱の接地中心。+Y 上。看板の面（読み取り面）は +Z。

const meta = {
  id: 'bike-park-sign',
  real: [0.72, 1.92, 0.34],
  origin: 'ground-center',
};

function build(options = {}) {
  const seed = options.seed ?? 211;
  const rnd = rand(seed);
  const g = grp('bike-park-sign');

  const M = {
    post: MAT.metalPaint('#6f7a72', { worn: 0.72, repeat: 2.4 }),
    postDark: MAT.metal('#5a625f', { worn: 0.85 }),
    bolt: MAT.darkIron({ worn: 0.85 }),
    board: MAT.metalPaint(PAL.signGreen, { worn: 0.62, repeat: 2 }),
    boardFace: MAT.paper({ color: '#efe9db' }),
    acrylic: MAT.glassLite({ color: '#f0e4bc', opacity: 0.42, side: DoubleSide }),
    acrylicFrame: MAT.hardPlastic('#d8d2c2', { worn: 0.7 }),
    ticket: MAT.paper({ color: '#f6efdc' }),
    concrete: MAT.concrete({ base: PAL.concrete, repeat: 1.6, joints: 2, cracked: true }),
    rubber: MAT.rubber('#3b3e43'),
    marking: MAT.marking(PAL.marking),
    yellow: MAT.marking(PAL.markingYellow),
    glow: MAT.lampShade({ color: '#dff0e2', emissive: '#bfe8c8', emissiveIntensity: 0.5 }),
    steel: MAT.metal('#a3a8ad', { worn: 0.6, repeat: 2 }),
    red: MAT.hardPlastic('#c2413a', { worn: 0.5 }),
  };

  /* ---------- 1. 基礎と支柱 ---------- */
  const base = grp('foundation');
  g.add(base);
  base.add(mesh(rbox(0.400, 0.070, 0.400, 0.010, 2), M.concrete, { name: 'footing', pos: [0, 0.035, 0] }));
  base.add(mesh(rbox(0.340, 0.026, 0.340, 0.006, 2), M.concrete, { name: 'footing-cap', pos: [0, 0.083, 0] }));
  base.add(mesh(cyl(0.0620, 0.0700, 0.052, 14), M.postDark, { name: 'base-sleeve', pos: [0, 0.122, 0] }));
  base.add(mesh(cyl(0.0760, 0.0760, 0.010, 14), M.bolt, { name: 'base-flange', pos: [0, 0.100, 0] }));
  radial(base, 4, 0.062, (i, a, x, z) => {
    const b = grp('anchor');
    b.position.set(x, 0.108, z);
    b.add(mesh(cyl(0.0085, 0.0085, 0.018, 6), M.bolt, { name: 'anchor-bolt' }));
    b.add(mesh(cyl(0.0130, 0.0130, 0.006, 6), M.bolt, { name: 'washer', pos: [0, -8e-3, 0] }));
    return b;
  });
  // 支柱（溶接継ぎ・塗装の傷み）
  const post = grp('post');
  g.add(post);
  post.add(mesh(cyl(0.0300, 0.0330, 1.520, 14), M.post, { name: 'main-post', pos: [0, 0.880, 0] }));
  post.add(mesh(cyl(0.0340, 0.0300, 0.024, 14), M.postDark, { name: 'post-splice', pos: [0, 0.980, 0] }));
  post.add(mesh(tor(0.0315, 0.0035, 5, 14), M.postDark, { name: 'weld-ring', pos: [0, 0.966, 0], rot: [Math.PI / 2, 0, 0] }));
  post.add(mesh(cyl(0.0345, 0.0300, 0.030, 14), M.postDark, { name: 'post-cap', pos: [0, 1.652, 0] }));
  weather(post, { w: 0.10, h: 0.44, pos: [0.032, 0.44, 0.01], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 3, count: 2, spread: 0.06 });
  weather(post, { w: 0.09, h: 0.30, pos: [-0.033, 1.20, 0.01], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#c9c4b6', opacity: 0.42, seed: seed + 5, spread: 0.05 });

  /* ---------- 2. 看板本体（二層：駐輪場／注意事項） ---------- */
  const B = grp('board');
  g.add(B);
  const boardY = 1.400;
  const frame = grp('board-frame', { pos: [0, boardY, 0.054], rot: [d2r(-3), 0, 0] });
  frame.add(mesh(rbox(0.680, 0.380, 0.024, 0.010, 2), M.board, { name: 'board-back' }));
  frame.add(mesh(rbox(0.652, 0.352, 0.010, 0.006, 2), M.boardFace, { name: 'board-face', pos: [0, 0, 0.016] }));
  decal(frame, {
    map: TEX.signboard({ text: '駐輪場', sub: 'BIKE PARKING  春日町', bg: '#eef2ea', fg: '#2f6b52', stripe: '#e8c14b' }),
    w: 0.628, h: 0.300, pos: [0, 0.012, 0.0225], opacity: 0.97,
  });
  // 角の補強リベット
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    frame.add(mesh(cyl(0.0075, 0.0075, 0.008, 8), M.bolt, { name: 'corner-rivet', pos: [sx * 0.312, sy * 0.164, 0.016], rot: [Math.PI / 2, 0, 0] }));
  }
  // 上部の緑帯（看板枠）
  frame.add(mesh(rbox(0.700, 0.048, 0.036, 0.008, 2), M.board, { name: 'board-hood', pos: [0, 0.206, 0.002], rot: [d2r(12), 0, 0] }));
  frame.add(mesh(rbox(0.700, 0.030, 0.020, 0.006, 2), M.postDark, { name: 'hood-drip-edge', pos: [0, 0.196, 0.020] }));
  // 貼紙（山と崩れたステッカー）
  decal(frame, { map: TEX.poster({ title: '春の交通安全', sub: '4月1日-30日', bg: '#f4e6cd', accent: '#3d7fb5', seed: seed + 7 }), w: 0.130, h: 0.092, pos: [-0.244, -0.104, 0.0235], rot: [0, 0, d2r(-4)], opacity: 0.9 });
  decal(frame, { map: TEX.adStrip({ text: '整理券ご協力を', bg: '#f0e9d8', seed: seed + 9 }), w: 0.170, h: 0.044, pos: [0.216, -0.128, 0.0235], rot: [0, 0, d2r(3)], opacity: 0.82 });
  decal(frame, { map: TEX.wear({ kind: 'chip', color: '#d8d2c0', seed: seed + 11, density: 1.6 }), w: 0.100, h: 0.070, pos: [0.240, 0.086, 0.024], opacity: 0.7 });
  // 雨だれ・退色・日焼け
  weather(frame, { w: 0.44, h: 0.10, pos: [0, 0.150, 0.024], rot: [0, 0, 0], kind: 'dirt', color: '#7a7159', opacity: 0.30, seed: seed + 13, count: 3, spread: 0.03 });
  weather(frame, { w: 0.20, h: 0.16, pos: [-0.2, 0.060, 0.024], kind: 'dirt', color: '#efe6cf', opacity: 0.42, seed: seed + 15, spread: 0.04 });
  weather(frame, { w: 0.11, h: 0.09, pos: [0.232, -0.132, 0.024], kind: 'moss', color: PAL.moss, opacity: 0.28, seed: seed + 17, spread: 0.014 });
  B.add(frame);
  // 支柱への金具
  for (const sy of [-0.06, 0.120]) {
    B.add(mesh(rbox(0.120, 0.030, 0.090, 0.005, 2), M.steel, { name: 'board-bracket', pos: [0, boardY + sy, 0.006] }));
    B.add(mesh(cyl(0.0068, 0.0068, 0.112, 8), M.bolt, { name: 'band-bolt', pos: [0, boardY + sy, 0.006], rot: [0, 0, Math.PI / 2] }));
    B.add(mesh(cyl(0.0110, 0.0110, 0.008, 6), M.bolt, { name: 'band-nut', pos: [-0.046, boardY + sy, -0.03], rot: [0, 0, Math.PI / 2] }));
  }

  /* ---------- 3. 時間表示プレート ---------- */
  const tb = grp('time-plate', { pos: [0, 1.100, 0.056], rot: [d2r(-8), 0, 0] });
  tb.add(mesh(rbox(0.300, 0.110, 0.014, 0.006, 2), M.board, { name: 'time-back' }));
  tb.add(mesh(rbox(0.280, 0.090, 0.008, 0.004, 2), M.boardFace, { name: 'time-face', pos: [0, 0, 0.010] }));
  decal(tb, { map: TEX.lightPanel({ text: '8:00 - 20:00', bg: '#f4efe0', fg: '#2f6b52', mode: 'sign', rows: [{ t: '駐輪料金', v: '無料' }, { t: '整理券', v: '発行中' }] }), w: 0.272, h: 0.084, pos: [0, 0, 0.015], opacity: 0.95 });
  tb.add(mesh(rbox(0.316, 0.016, 0.024, 0.004, 2), M.postDark, { name: 'time-hood', pos: [0, 0.062, 0.002], rot: [d2r(14), 0, 0] }));
  weather(tb, { w: 0.16, h: 0.05, pos: [0.05, -0.03, 0.016], kind: 'dirt', color: '#8b8268', opacity: 0.35, seed: seed + 19, spread: 0.02 });
  g.add(tb);

  /* ---------- 4. 整理券ポスト（アクリル黄変・中の券） ---------- */
  const PO = grp('ticket-box', { pos: [0.000, 0.760, 0.086], rot: [d2r(4), 0, 0] });
  g.add(PO);
  PO.add(mesh(rbox(0.226, 0.200, 0.096, 0.010, 2), M.acrylicFrame, { name: 'box-frame' }));
  // アクリル窓（黄変・細かい傷）
  PO.add(mesh(rbox(0.196, 0.150, 0.006, 0.003, 2), M.acrylic, { name: 'acrylic-window', pos: [0, 0.010, 0.050] }));
  PO.add(mesh(rbox(0.204, 0.012, 0.010, 0.003, 2), M.acrylicFrame, { name: 'window-rail-top', pos: [0, 0.090, 0.050] }));
  PO.add(mesh(rbox(0.204, 0.012, 0.010, 0.003, 2), M.acrylicFrame, { name: 'window-rail-bottom', pos: [0, -0.068, 0.050] }));
  // 中の整理券（束・斜めに崩れた一番上）
  const tk = grp('tickets');
  for (let i = 0; i < 9; i++) {
    const t = mesh(rbox(0.170, 0.112, 0.0035, 0.0015, 1), M.ticket, { name: 'ticket-' + i, pos: [(i % 3 - 1) * 0.004, -4e-3 - i * 0.0022, 0.020 - i * 0.0035], rot: [d2r(-2 + i * 0.6), d2r((i % 2 ? 1 : -1) * 2.4), d2r(i % 2 ? 1.2 : -1.6)] });
    t.userData.noOutline = true;
    tk.add(t);
  }
  decal(tk, { map: TEX.signboard({ text: '整理券', sub: 'No. 042', bg: '#f7f0dc', fg: '#b8433a', ar: 1.6 }), w: 0.150, h: 0.092, pos: [0, -4e-3, 0.024], opacity: 0.95 });
  PO.add(tk);
  // 投入口・蓋・錠前
  PO.add(mesh(rbox(0.150, 0.020, 0.030, 0.004, 2), M.postDark, { name: 'slot-lip', pos: [0, 0.104, 0.028] }));
  const lid = grp('box-lid', { pos: [0, 0.100, -0.01], rot: [d2r(-24), 0, 0] });
  lid.add(mesh(rbox(0.226, 0.012, 0.100, 0.004, 2), M.acrylicFrame, { name: 'lid-plate' }));
  lid.add(mesh(cyl(0.0080, 0.0080, 0.014, 8), M.bolt, { name: 'lid-hinge-L', pos: [-0.09, 0.004, -0.046], rot: [0, 0, Math.PI / 2] }));
  lid.add(mesh(cyl(0.0080, 0.0080, 0.014, 8), M.bolt, { name: 'lid-hinge-R', pos: [0.090, 0.004, -0.046], rot: [0, 0, Math.PI / 2] }));
  PO.add(lid);
  PO.add(mesh(rbox(0.034, 0.040, 0.014, 0.004, 2), M.steel, { name: 'hasp', pos: [0, -0.086, 0.054] }));
  PO.add(mesh(cyl(0.0085, 0.0085, 0.016, 10), M.bolt, { name: 'padlock-shackle', pos: [0, -0.104, 0.058], rot: [Math.PI / 2, 0, 0] }));
  PO.add(mesh(rbox(0.030, 0.024, 0.016, 0.004, 2), M.red, { name: 'padlock-body', pos: [0, -0.126, 0.058] }));
  // 取付バンド（支柱に巻く）
  for (const by of [0.052, -0.06]) {
    PO.add(mesh(tor(0.0385, 0.0060, 5, 16), M.steel, { name: 'band', pos: [-0.036, by, -0.03], rot: [0, Math.PI / 2, 0] }));
    PO.add(mesh(box(0.016, 0.020, 0.014), M.bolt, { name: 'band-bolt', pos: [-0.036, by, 0.008] }));
  }
  weather(PO, { w: 0.16, h: 0.10, pos: [0.030, -0.06, 0.054], kind: 'dirt', color: '#8b7f5e', opacity: 0.4, seed: seed + 21, spread: 0.03 });
  weather(PO, { w: 0.12, h: 0.12, pos: [-0.08, 0.030, 0.054], kind: 'scratch', color: '#cfc9b4', opacity: 0.3, seed: seed + 23, spread: 0.03 });

  /* ---------- 5. 夜光反射帯（支柱に巻く帯） ---------- */
  for (const gy of [0.300, 1.620]) {
    const band = mesh(tor(0.0335, 0.0055, 5, 18), M.glow, { name: 'glow-band', pos: [0, gy, 0], rot: [Math.PI / 2, 0, 0] });
    g.add(band);
    g.add(mesh(tor(0.0335, 0.0022, 5, 18), M.marking, { name: 'glow-band-edge', pos: [0, gy + 0.010, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  // 看板下端の反射テープ
  g.add(mesh(rbox(0.620, 0.018, 0.004, 0.003, 2), M.glow, { name: 'reflector-tape', pos: [0, boardY - 0.196, 0.078] }));

  /* ---------- 6. 足元の小道具（落ち葉・泥・車輪止め跡） ---------- */
  g.add(mesh(rbox(0.520, 0.010, 0.460, 0.004, 2), M.concrete, { name: 'ground-patch', pos: [0, 0.005, 0.02] }));
  weather(g, { w: 0.26, h: 0.14, pos: [0.06, 0.024, 0.20], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6350', opacity: 0.35, seed: seed + 25, count: 2, spread: 0.008 });
  weather(g, { w: 0.20, h: 0.10, pos: [-0.14, 0.024, 0.14], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.30, seed: seed + 27, spread: 0.008 });
  // 看板の影になる小草（3 本）
  const blade = lathe([[0, 0], [0.004, 0.030], [0.0015, 0.075], [0, 0.092]], 5);
  radial(g, 5, 0.215, (i, a, x, z) => {
    const b = mesh(blade, MAT.grass({ repeat: 2 }), { name: 'foot-weed', pos: [x * 0.9, 0.020, z * 0.9 + 0.06] });
    b.rotation.set(range(rnd, -0.2, 0.2), rnd() * 6.283, range(rnd, -0.25, 0.25));
    b.userData.noOutline = true;
    return b;
  });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
