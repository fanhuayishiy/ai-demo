import { g as grp, M as MAT, P as PAL, m as mesh, r as rbox, b as box, A as row, n as range, c as cyl, t as tor, w as weather, h as decal, T as TEX, o as lathe, E as inst, x as PlaneGeometry, q as finish, k as tubeOf, j as d2r, z as rand } from './index-ROCNX270.js';

//  assets/bike/bike-parking-rack.js
//  駐輪ラック —— アーチパイプ（亜鉛の白サビ・溶接スジ）＋車輪止めブロック（コンクリート/ゴム、欠け）
//   ＋区画白線と番号札＋基礎ボルト＋端部の案内板＋隙間の雑草と落ち葉。
//  単位：メートル。原点 = ラック直下の接地中心（列の中央）。+X = 列方向、车头受け側 = +Z。

const meta = {
  id: 'bike-parking-rack',
  real: [4.10, 0.68, 1.15],
  origin: 'ground-center',
};

/** 曲線アーチ（YZ 面）を点列で */
/** アーチ：列に直角な平面（XY）内の半円。脚は x 方向に +/-hw、前輪の直後に立ちフレームを預ける。 */
function arch(x, h, hw, r, mat, name, zoff = 0) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * (i / 18);
    pts.push([x + Math.cos(a) * hw, Math.sin(a) * h, zoff]);
  }
  return mesh(tubeOf(pts, r, 26, 8), mat, { name });
}

function build(options = {}) {
  const bays = options.bays ?? 6;
  const seed = options.seed ?? 101;
  const rnd = rand(seed);
  const g = grp('bike-parking-rack');

  const DX = 0.62;                                   // 区画ピッチ（ハンドル干渉を避けるため左右交互に段違い）
  const span = bays * DX;
  const M = {
    pipe: MAT.galvanized({ repeat: 2.2, worn: 0.7 }),
    pipeDark: MAT.metal('#8d9295', { worn: 0.8, repeat: 2 }),
    weld: MAT.metal('#7d8285', { worn: 0.9 }),
    concrete: MAT.concrete({ base: PAL.concreteDark, repeat: 2.2, joints: 3, cracked: true }),
    rubber: MAT.rubber('#3a3d42'),
    bolt: MAT.darkIron({ worn: 0.8 }),
    marking: MAT.marking(PAL.marking),
    yellow: MAT.marking(PAL.markingYellow),
    sign: MAT.metalPaint(PAL.signGreen, { worn: 0.7, repeat: 2 }),
    signFace: MAT.paper({ color: '#eae5d8' }),
    plate: MAT.hardPlastic('#dfe3e6', { worn: 0.6 }),
    grass: MAT.grass({ repeat: 3 }),
    leaf: MAT.leaf({ color: '#b08a52' }),
    leafGreen: MAT.leaf({ color: PAL.leafYoung }),
  };

  /* ---------- 1. 区画舗装（白線・番号・水はけ勾配） ---------- */
  const pad = grp('pad');
  g.add(pad);
  pad.add(mesh(rbox(span + 0.30, 0.024, 1.10, 0.008, 2), M.concrete, { name: 'paving-slab', pos: [0, 0.012, 0.06] }));
  // 区画白線（3mm 盛り上げ＝z-fighting 回避）
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + i * DX;
    const isEdge = i === 0 || i === bays;
    pad.add(mesh(box(isEdge ? 0.075 : 0.055, 0.004, 0.94), M.marking, { name: 'bay-line', pos: [x, 0.026, 0.06] }));
  }
  // 前端の横断白線（駐輪位置）
  pad.add(mesh(box(span + 0.22, 0.004, 0.06), M.marking, { name: 'front-line', pos: [0, 0.026, 0.53] }));
  pad.add(mesh(box(span + 0.22, 0.004, 0.045), M.yellow, { name: 'front-line-2', pos: [0, 0.026, 0.47] }));
  // 番号札（区画ごとに金属プレート）
  row(pad, bays, DX, (i, x) => {
    const t = grp('bay-number', { pos: [x, 0.03, 0.60] });
    t.add(mesh(rbox(0.086, 0.006, 0.058, 0.004, 2), M.plate, { name: 'number-plate', rot: [d2r(-28), 0, 0] }));
    decal(t, {
      map: TEX.signboard({ text: String(i + 1).padStart(2, '0'), sub: 'CHUN-RIKU', bg: '#e9ede6', fg: '#2f6b52' }),
      w: 0.074, h: 0.050, pos: [0, 0.005, 0.0], rot: [-Math.PI / 2 + d2r(-28), 0, 0], opacity: 0.95,
    });
    t.add(mesh(box(0.010, 0.026, 0.010), M.bolt, { name: 'number-stem', pos: [0, -0.01, 0.024] }));
    return t;
  });

  /* ---------- 2. アーチパイプ（区画の境）＋基礎 ---------- */
  const R = grp('racks');
  g.add(R);
  // 通しベースアングル
  for (let i = 0; i < bays; i++) {
    const x = -span / 2 + (i + 0.5) * DX;
    const zoff = i % 2 ? 0.098 : -0.098;
    R.add(mesh(rbox(DX * 0.94, 0.026, 0.040, 0.005, 2), M.pipeDark, { name: 'base-rail', pos: [x, 0.040, zoff] }));
    R.add(mesh(rbox(0.046, 0.022, 0.300, 0.004, 2), M.pipeDark, { name: 'wheel-rail', pos: [x, 0.036, zoff + 0.300] }));
  }
  for (let i = 0; i < bays; i++) {
    const x = -span / 2 + (i + 0.5) * DX;
    const zoff = i % 2 ? 0.098 : -0.098;                 // 前後交互（車幅を稼ぐ）
    const h = 0.418 + range(rnd, -6e-3, 0.006);
    const hw = 0.148 + range(rnd, -4e-3, 0.006);
    R.add(arch(x, h, hw, 0.0165, M.pipe, 'arch', zoff));
    // 脚元のソケット＋基礎ボルト
    for (const sx of [-1, 1]) {
      R.add(mesh(cyl(0.0245, 0.0270, 0.048, 12), M.pipeDark, { name: 'arch-socket', pos: [x + sx * hw, 0.048, zoff] }));
      R.add(mesh(cyl(0.0300, 0.0300, 0.008, 12), M.concrete, { name: 'socket-collar', pos: [x + sx * hw, 0.028, zoff] }));
      R.add(mesh(cyl(0.0075, 0.0075, 0.014, 6), M.bolt, { name: 'anchor-bolt', pos: [x + sx * hw, 0.036, zoff + 0.020] }));
      // 溶接スジ
      const w = mesh(tor(0.0178, 0.0035, 5, 12), M.weld, { name: 'arch-weld', pos: [x + sx * hw, 0.072, zoff] });
      w.rotation.x = Math.PI / 2;
      R.add(w);
    }
    // アーチ頂部の溶接（継ぎ手）と補強リブ
    const cap = mesh(tor(0.0168, 0.0032, 5, 12), M.weld, { name: 'arch-crown-weld', pos: [x, h, zoff] });
    R.add(cap);
    R.add(mesh(cyl(0.0092, 0.0092, hw * 2, 8), M.pipeDark, { name: 'arch-tie-bar', pos: [x, h - 0.052, zoff], rot: [0, 0, Math.PI / 2] }));
    // 亜鉛の白サビ・傷
    weather(R, { w: 0.10, h: 0.16, pos: [x + hw * 0.62, 0.26, zoff + 0.018], rot: [0, 0, 0], kind: 'rust', color: '#c9ced2', opacity: 0.42, seed: seed + i * 7, spread: 0.03 });
    weather(R, { w: 0.09, h: 0.13, pos: [x - hw * 0.62, 0.20, zoff - 0.018], rot: [0, Math.PI, 0], kind: 'chip', color: '#8b8f92', opacity: 0.4, seed: seed + i * 13, spread: 0.03 });
  }

  /* ---------- 3. 車輪止めブロック（コンクリート＋ゴム、欠け） ---------- */
  const WS = grp('wheel-stops');
  g.add(WS);
  row(WS, bays, DX, (i, x) => {
    const b = grp('wheel-stop', { pos: [x, 0, 0.300 + (i % 2 ? 0.098 : -0.098)], rotY: range(rnd, -1.6, 1.6) });
    const ch = 0.086;
    b.add(mesh(rbox(0.230, ch, 0.130, 0.010, 2), M.concrete, { name: 'stop-block', pos: [0, ch / 2 + 0.024, 0] }));
    // 前面ゴム（擦り減り・欠け）
    b.add(mesh(rbox(0.214, 0.046, 0.020, 0.006, 2), M.rubber, { name: 'stop-rubber', pos: [0, ch * 0.52, 0.062] }));
    b.add(mesh(rbox(0.044, 0.030, 0.024, 0.004, 2), M.concrete, { name: 'rubber-chip', pos: [0.074, ch * 0.52, 0.062], rot: [0, d2r(14), d2r(-8)] }));
    // 斜め面（タイヤを受けめる）
    b.add(mesh(rbox(0.226, 0.030, 0.052, 0.006, 2), M.concrete, { name: 'stop-ramp', pos: [0, ch * 0.94, -0.04], rot: [d2r(30), 0, 0] }));
    // 落とし込み（区画番号の掘り込み風）
    b.add(mesh(box(0.050, 0.004, 0.026), M.signFace, { name: 'stop-mark', pos: [0, ch + 0.0245, -0.02] }));
    // 基礎ピン
    for (const px of [-0.082, 0.082]) {
      b.add(mesh(cyl(0.0085, 0.0085, 0.030, 8), M.bolt, { name: 'stop-pin', pos: [px, 0.036, -0.03] }));
      b.add(mesh(cyl(0.0140, 0.0140, 0.006, 6), M.bolt, { name: 'stop-pin-head', pos: [px, 0.054, -0.03] }));
    }
    weather(b, { w: 0.16, h: 0.055, pos: [0.02, ch * 0.66, 0.068], rot: [0, 0, 0], kind: 'dirt', color: '#6d6250', opacity: 0.45, seed: seed + i * 17, spread: 0.010 });
    weather(b, { w: 0.12, h: 0.05, pos: [-0.06, 0.058, 0.066], rot: [0, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.32, seed: seed + i * 23, spread: 0.010 });
    return b;
  });

  /* ---------- 4. 端部の案内板 ---------- */
  for (const s of [-1, 1]) {
    const eg = grp('end-guide', { pos: [s * (span / 2 + 0.15), 0, 0.16], rotY: s * d2r(4) });
    eg.add(mesh(cyl(0.0190, 0.0210, 0.620, 12), M.pipeDark, { name: 'guide-post', pos: [0, 0.330, 0] }));
    eg.add(mesh(cyl(0.0260, 0.0300, 0.040, 12), M.concrete, { name: 'guide-collar', pos: [0, 0.044, 0] }));
    const bd = grp('guide-board', { pos: [0, 0.600, 0.010], rot: [d2r(-6), s * d2r(16), 0] });
    bd.add(mesh(rbox(0.230, 0.150, 0.014, 0.008, 2), M.sign, { name: 'guide-plate' }));
    decal(bd, { map: TEX.signboard({ text: '自転車 駐輪場', sub: 'SOURCE 春日町', bg: PAL.signGreen, fg: '#f2efe4', stripe: '#e8c14b' }), w: 0.216, h: 0.136, pos: [0, 0, 0.0085], opacity: 0.96 });
    decal(bd, { map: TEX.poster({ title: '整理券', sub: 'ご協力のほど', bg: '#f2e8d6', accent: '#c2413a', seed: seed + (s > 0 ? 3 : 5) }), w: 0.062, h: 0.086, pos: [s * 0.060, -0.118, 0.010], opacity: 0.9 });
    bd.add(mesh(rbox(0.052, 0.036, 0.006, 0.003, 2), M.plate, { name: 'arrow-plate', pos: [-s * 0.070, -0.052, 0.012], rot: [0, 0, s * d2r(-16)] }));
    for (const sy of [-0.05, 0.050]) bd.add(mesh(cyl(0.0060, 0.0060, 0.020, 8), M.bolt, { name: 'board-bolt', pos: [0, sy, 0.012], rot: [Math.PI / 2, 0, 0] }));
    eg.add(bd);
    weather(eg, { w: 0.14, h: 0.10, pos: [0.022, 0.24, 0.0], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + 41, spread: 0.06 });
    g.add(eg);
  }

  /* ---------- 5. 隙間の雑草と落ち葉 ---------- */
  const blade = lathe([[0.000, 0.000], [0.0035, 0.030], [0.0012, 0.072], [0.0000, 0.086]], 5);
  const weeds = inst(blade, M.grass, bays * 7, (i, d, r) => {
    const bi = Math.floor(i / 7) % bays;
    const x0 = -span / 2 + bi * DX;
    const edge = r() > 0.5 ? 1 : -1;
    d.position.set(x0 + edge * (DX / 2 - 0.010) + (r() - 0.5) * 0.030, 0.024, -0.34 + r() * 0.72);
    d.rotation.set((r() - 0.5) * 0.5, r() * 6.283, (r() - 0.5) * 0.6);
    const sc = 0.55 + r() * 0.95;
    d.scale.set(sc, sc * (0.7 + r() * 0.8), sc);
  }, { name: 'crack-weeds', cast: true, receive: true });
  weeds.userData.noOutline = true;
  g.add(weeds);

  const leafGeo = new PlaneGeometry(0.062, 0.044);
  const leaves = inst(leafGeo, M.leaf, 26, (i, d, r, col) => {
    d.position.set((r() - 0.5) * (span + 0.20), 0.0285, -0.42 + r() * 1.02);
    d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.5, 0, r() * 6.283);
    const sc = 0.7 + r() * 0.7;
    d.scale.set(sc, sc, sc);
    col.setRGB(0.72 + r() * 0.28, 0.52 + r() * 0.34, 0.28 + r() * 0.30);
  }, { name: 'fallen-leaves', cast: false, receive: true });
  leaves.userData.noOutline = true;
  g.add(leaves);
  const greenLeaves = inst(leafGeo, M.leafGreen, 12, (i, d, r) => {
    d.position.set((r() - 0.5) * (span + 0.10), 0.0295, -0.3 + r() * 0.90);
    d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.4, 0, r() * 6.283);
    const sc = 0.6 + r() * 0.5;
    d.scale.set(sc, sc, sc);
  }, { name: 'fresh-leaves', cast: false, receive: true });
  greenLeaves.userData.noOutline = true;
  g.add(greenLeaves);

  // 桜の花びら混入（春）
  const petals = inst(leafGeo, MAT.petal({ tone: 0, map: TEX.petal({ tone: 0, mode: 'single' }), alphaMap: TEX.petal({ tone: 0, mode: 'single' }) }), 14, (i, d, r) => {
    d.position.set((r() - 0.5) * (span + 0.24), 0.0292, -0.36 + r() * 1.06);
    d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.283);
    const sc = 0.7 + r() * 0.6;
    d.scale.set(sc, sc, sc);
  }, { name: 'petals-on-rack', cast: false, receive: true });
  petals.userData.noOutline = true;
  g.add(petals);

  /* ---------- 6. 全体の做旧（泥はね・水垢・タイヤ擦過） ---------- */
  weather(g, { w: 0.30, h: 0.10, pos: [0, 0.0335, 0.52], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6f5c', opacity: 0.28, seed: seed + 61, count: 3, spread: 0.006 });
  weather(g, { w: 0.22, h: 0.08, pos: [-span * 0.28, 0.0335, -0.2], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.24, seed: seed + 63, count: 2, spread: 0.006 });

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
