import { g as grp, M as MAT, D as DoubleSide, T as TEX, P as PAL, m as mesh, b as box, n as range, r as rbox, c as cyl, w as weather, A as row, i as grill, G as put, t as tor, V as Vector3, h as decal, H as plane, E as inst, I as sakuraPetalRestGeo, q as finish, J as shape, K as extrude, z as rand } from './index-CxdYZv8e.js';

//  assets/buildings/alley-houses.js —— 巷奥の隣家「背面」モジュール
//  構成：布モルタル基礎＋厚み 140 mm の実外壁（開口は穿孔分割＝紙壁なし）→ 妻壁（下見板）
//        → 瓦屋根（越境する前端軒先・軒天・回し瓦・雨樋詰まり・竪樋・割れ・苔・鳥除け）
//        → 勝手口（金属建・2 段段差框・回転レバー錠＋鍵・雨除し・網戸）
//        → トタンの物置（釘・錆・南京錠・半開きの扉と中の暗がり・換気口・根入石）
//        → 境界のブロック塀＋メッシュフェンス／給水管と水道メーター／物干し竿（洗濯バサミまで）
//        → 植木鉢の列／裏の側溝と蓋／落ち葉と苔／壁の落書き除去跡／自転車置場の痕跡（跡のみ）
//  単位メートル / 原点＝接地面中心（y=0＝地盤）/ +Y 上 / 正面（生活側・勝手口）朝 +Z / 長さ方向 X。
//  ※ 装配注意：+Z 側（塀・軒先）を路地開口側へ向けると、軒先が突き当たりの塀越しに路地から見える。

const meta = {
  id: 'alley-houses',
  real: [5.56, 3.32, 3.98],      // len 5.2 のとき：躯体長 × 棟上（鳥除け迄）× 越境軒先＋裏側溝
  origin: 'ground-center',
};

const DEFAULT_OPTIONS = { seed: 803, len: 5.2 };

/* ------------------------------ 寸法（m・raw。最後に OZ だけ中心合わせで移動） ------------------------------ */
const WT = 0.14;                 // 外壁厚
const FND_TOP = 0.30;            // 床レベル（基礎天端）
const WALL_TOP = 2.52;           // 壁天端
const RIDGE_Z = -0.52;           // 棟の z
const Z_F = 0.42;                // +Z 側壁面
const Z_B = -1.74;               // -Z 側壁面
const SLOPE = 0.52;              // 勾配（≈5.5 寸）
const EAVE_F = 1.72;             // 前端軒先 ── 境界 1.42 を越える
const EAVE_B = -1.92;            // 後端軒先
const EAVE_Y = 1.98;             // 軒先の高さ
const RIDGE_Y = EAVE_Y + SLOPE * (EAVE_F - RIDGE_Z);
const GABLE_APEX = 3.16;
const Z_BND = 1.42;              // 敷地境界（塀の中心）
const Z_DRN = -2.24;             // 裏の側溝の中心
const OZ = 0.30;                 // bbox を原点中心に寄せるオフセット

const ANG = Math.atan(SLOPE);
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const noOut = (o) => { o.userData.noOutline = true; return o; };

/* ------------------------------ 汎用：厚みのある外壁（開口は貫通穿孔） ------------------------------ */
function piercedWall(parent, { len, thick, y0, y1, opens = [], mat, pos, rotYdeg = 0, name = 'wall' }) {
  const g = grp(name, { pos, rotY: rotYdeg });
  const solid = (x0, x1, by0, by1) => {
    const bw = x1 - x0, bh = by1 - by0;
    if (bw < 0.006 || bh < 0.006) return;
    g.add(mesh(box(rq(bw), rq(bh), thick), mat, { pos: [(x0 + x1) / 2, (by0 + by1) / 2, 0], name: name + '-panel' }));
  };
  let cur = -len / 2;
  for (const o of opens.slice().sort((a, b) => a.c - b.c)) {
    const a = o.c - o.w / 2, b = o.c + o.w / 2;
    solid(cur, a, y0, y1);
    solid(a, b, y0, o.y0);
    solid(a, b, o.y1, y1);
    cur = b;
  }
  solid(cur, len / 2, y0, y1);
  parent.add(g);
  return g;
}

/* ------------------------------ 妻三角形（下見板張りの芯・厚みあり） ------------------------------ */
function gablePrism(parent, { corners, thick, mat, x, flip, name = 'gable' }) {
  const s = shape((p) => {
    corners.forEach(([z, y], i) => {
      const u = flip ? -z : z;
      if (i === 0) p.moveTo(u, y); else p.lineTo(u, y);
    });
    p.closePath();
  });
  const geo = extrude(s, { depth: thick, bevelEnabled: false, curveSegments: 1 });
  const mm = mesh(geo, mat, { name, pos: [x, 0, 0], rot: [0, (flip ? 90 : -90) * Math.PI / 180, 0] });
  parent.add(mm);
  return mm;
}

/* ------------------------------ 植木鉢（変種） ------------------------------ */
function plantPot(M, { x, z, r = 0.13, h = 0.19, kind = 'terracotta', seed = 1 }) {
  const g = grp('pot-' + kind);
  const body = kind === 'glaze'
    ? MAT.paint('#7f94a8', { map: TEX.concrete({ base: '#7f94a8', repeat: 1 }).map, spec: 0.55, specPower: 120 })
    : kind === 'plastic'
      ? MAT.plastic('#4d6b4a', { spec: 0.28 })
      : MAT.paint('#b06a4a', { map: TEX.concrete({ base: '#b06a4a', repeat: 1 }).map, spec: 0.14, shadowAmt: 0.92 });
  if (kind === 'broken') {
    // 割れて口が欠けた鉢（逆さ置き）
    g.add(mesh(cyl(r * 0.78, r, h * 0.92, 13), body, { pos: [0, h * 0.46, 0], name: 'pot-shell' }));
    g.add(mesh(box(r * 1.5, h * 0.30, r * 0.5), body, { pos: [r * 0.52, h * 0.30, r * 0.2], rot: [0, 0.5, 0.4], name: 'pot-shard' }));
    for (let i = 0; i < 3; i++) g.add(mesh(rbox(0.03, 0.018, 0.026, 0.006, 1), body, { pos: [-r * 0.6 + i * 0.05, 0.009, -r * 0.7 + i * 0.03], rot: [0, i * 1.1, 0], name: 'pot-chip' }));
  } else {
    g.add(mesh(cyl(r, r * 0.76, h, 14), body, { pos: [0, h / 2, 0], name: 'pot-body' }));
    g.add(mesh(cyl(r * 1.06, r * 1.06, 0.016, 14), body, { pos: [0, h - 0.008, 0], name: 'pot-rim' }));
    g.add(mesh(cyl(r * 1.2, r * 1.2, 0.014, 14), M.potSaucer, { pos: [0, 0.007, 0], name: 'pot-saucer' }));
    g.add(mesh(cyl(r * 0.94, r * 0.94, 0.022, 13), M.soil, { pos: [0, h - 0.026, 0], name: 'pot-soil' }));
    g.add(noOut(mesh(cyl(r * 0.66, r * 0.66, 0.006, 12), M.mossDisk, { pos: [r * 0.14, h - 0.011, -r * 0.1], cast: false, name: 'pot-moss' })));
    if (kind !== 'empty') {
      // 苗（葉カード 5〜7 枚）
      const geo = plane(0.055, 0.10, 1, 1).clone();
      geo.translate(0, 0.05, 0);
      g.add(inst(geo, kind === 'conifer' ? M.leafDark : M.leafA, kind === 'conifer' ? 7 : 9, (i, d, rr, col) => {
        const a = (i / 9) * 6.283 + rr() * 0.6;
        d.position.set(Math.cos(a) * r * 0.42, h - 0.02 + rr() * (kind === 'conifer' ? 0.16 : 0.05), Math.sin(a) * r * 0.42);
        d.rotation.set(rr() * 0.6 - 0.3, a, kind === 'conifer' ? 0.12 : rr() * 1.5 - 0.75);
        const s = 0.75 + rr() * 0.75; d.scale.set(s, s, s);
        const k = 0.86 + rr() * 0.3; col.setRGB(k, k * (0.97 + rr() * 0.08), k * 0.92);
      }, { name: 'pot-leaf', cast: true }));
      g.add(mesh(cyl(0.006, 0.008, 0.14, 5), M.barkSmall, { pos: [0, h + 0.04, 0], rot: [0.12, 0, -0.1], name: 'pot-stem' }));
    }
  }
  g.position.set(x, 0, z);
  return g;
}

/* =============================================================================
 *  本構築
 * ===========================================================================*/
function build(options = {}) {
  const seed = (options.seed ?? 803) | 0;
  const rnd = rand(seed);
  const L = Math.max(2.6, options.len ?? 5.2);
  const g = grp('alley-houses');
  const body = grp('site', { pos: [0, 0, OZ] });
  g.add(body);

  /* ---------------- 素材 ---------------- */
  const M = {
    plasterOld: MAT.concrete({ base: '#ddd4c0', repeat: 1, cracked: true, tint: '#f4ecd9', sat: 0.92 }),
    plasterShade: MAT.concrete({ base: '#cfc7b4', repeat: 1, cracked: true, sat: 0.88 }),
    base: MAT.concrete({ base: '#a9a496', repeat: 1, joints: 2, cracked: true }),
    concDark: MAT.concrete({ base: '#8f8a7e', repeat: 1, joints: 3 }),
    paving: MAT.paving({ color: '#bfb8a9', mode: 'block', cells: 4, repeat: 1 }),
    gravel: MAT.ballast({ repeat: 2 }),
    dirt: MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 1 }).map, spec: 0.03, shadowAmt: 0.97 }),
    clapboard: MAT.wood({ light: '#9a8a6e', dark: '#63543f', repeat: 1, uv: { repeat: [1.4, 2.4] } }),
    woodOld: MAT.wood({ light: PAL.woodWeathered, dark: '#6a5c47', repeat: 1, uv: { repeat: [1.2, 1.8] } }),
    tile: MAT.roofTile({ base: '#63636c', repeat: 1 }),
    tileOld: MAT.roofTile({ base: '#565863', repeat: 1, tint: '#e9e0cb', sat: 0.8 }),
    ridgeTile: MAT.roofTile({ base: '#51545e', repeat: 1 }),
    flash: MAT.metal('#a7adad', { worn: 0.6, repeat: 2 }),
    galv: MAT.galvanized({ worn: 0.8 }),
    alu: MAT.metal('#c3c8cc', { worn: 0.4, repeat: 1 }),
    aluDark: MAT.metal('#8d9298', { worn: 0.62, repeat: 1 }),
    iron: MAT.darkIron({ worn: 0.72, spec: 0.36 }),
    rust: MAT.metal('#7d5340', { worn: 0.95, spec: 0.2 }),
    corr: MAT.corrugated({ base: '#969c98', repeat: 1, worn: 0.75, tint: '#efe8d6' }),
    corrOld: MAT.corrugated({ base: '#8a8478', repeat: 1, tint: '#e2d7bf', sat: 0.85 }),
    glass: MAT.glassLite({ color: '#cfe0e4', opacity: 0.34, spec: 0.95 }),
    dark: MAT.paint('#15161a', { steps: 2, shadowAmt: 1, spec: 0.02 }),
    drainVoid: MAT.paint('#1d1f1c', { steps: 2, shadowAmt: 1, spec: 0.02, dither: 0.004 }),
    leafA: MAT.leaf({ color: PAL.leaf, tint: '#f0e7cd' }),
    leafDark: MAT.leaf({ color: '#5d7a4c', rim: 0.28 }),
    leafDead: MAT.paper({ color: '#a8895c' }),
    soil: MAT.paint('#6f5c45', { map: TEX.concrete({ base: '#6f5c45', repeat: 1 }).map, spec: 0.03, shadowAmt: 0.98 }),
    mossDisk: MAT.grass({ base: PAL.moss, repeat: 2, sat: 0.9 }),
    potSaucer: MAT.plastic('#6f6a5e'),
    barkSmall: MAT.bark({ base: '#6b574a', repeat: 1 }),
    rope: MAT.paint('#cfc6ad', { map: TEX.fabric({ base: '#cfc6ad', repeat: 10 }).map, spec: 0.06, steps: 2 }),
    towel: MAT.fabric({ color: '#7f96a4', repeat: 12 }),
    paperWhite: MAT.paper({ color: '#f2ecdd' }),
    meshFabric: MAT.paint('#3f4744', { map: TEX.metal({ base: '#3f4744', worn: 0.2, repeat: 16 }).map, side: DoubleSide, spec: 0.1 }),
    rubberMat: MAT.rubber('#33352f'),
    markingFaded: MAT.marking('#ded8c6', { repeat: 1, sat: 0.72, tint: '#e8e2cd', opacity: 0.9, transparent: true }),
  };

  /* ================= 1. 地盤（土間・砂利・側溝帯） ================= */
  const groundZ0 = Z_DRN - 0.34, groundZ1 = EAVE_F + 0.14;
  const lot = grp('lot-ground');
  body.add(lot);
  lot.add(mesh(box(rq(L + 0.52), 0.03, rq(groundZ1 - groundZ0)), M.dirt, { pos: [0, 0.015, (groundZ0 + groundZ1) / 2], cast: false, name: 'lot-dirt' }));
  // 勝手口前の砂利敷き（一段高く＝段差なく土間が繋がって見える）
  lot.add(mesh(box(2.30, 0.012, 0.86, ), M.gravel, { pos: [-0.95, 0.036, 0.90], cast: false, receive: true, name: 'yard-gravel' }));
  // 通路の平板（3 枚、めくれ）
  for (let i = 0; i < 3; i++) {
    lot.add(mesh(rbox(0.56, 0.04, 0.36, 0.008, 2), M.paving, {
      pos: [-1.62 + i * 0.66, 0.052, 1.06 + range(rnd, -0.05, 0.05)],
      rot: [range(rnd, -0.02, 0.02), range(rnd, -0.05, 0.05), range(rnd, -0.015, 0.015)], name: 'yard-slab',
    }));
  }
  // 自転車置場の痕跡：色褪せた区画線 2 本＋タイヤ擦跡＋抜けたアンカー
  const bikeTrace = grp('bike-traces');
  lot.add(bikeTrace);
  for (let i = 0; i < 3; i++) {
    bikeTrace.add(noOut(mesh(box(0.055, 0.004, 0.74), M.markingFaded, { pos: [1.24 + i * 0.34, 0.0325, 1.02 + range(rnd, -0.02, 0.02)], rot: [0, range(rnd, -0.03, 0.03), 0], cast: false, name: 'bike-line' })));
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      bikeTrace.add(noOut(mesh(box(0.075, 0.003, 0.05), MAT.paint('#776f61', { steps: 2, sat: 0.7 }), {
        pos: [1.35 + s * 0.10 + Math.sin(t * 2.1) * 0.03, 0.0315, 0.72 + t * 0.6],
        rot: [0, t * 0.5 * s, 0], cast: false, name: 'tire-trace',
      })));
    }
  }
  // 抜かれた駐輪アンカーの跡（穴＋切りっぱなしボルト）
  bikeTrace.add(mesh(cyl(0.026, 0.026, 0.05, 10), M.concDark, { pos: [1.72, 0.028, 1.36], name: 'anchor-hole' }));
  bikeTrace.add(noOut(mesh(cyl(0.014, 0.014, 0.02, 8), M.drainVoid, { pos: [1.72, 0.042, 1.36], cast: false, name: 'anchor-void' })));
  bikeTrace.add(mesh(cyl(0.008, 0.009, 0.024, 6), M.rust, { pos: [2.06, 0.044, 1.30], rot: [0.1, 0, 0.06], name: 'anchor-bolt-stub' }));

  /* ================= 2. 基礎 ================= */
  const fnd = grp('foundation');
  body.add(fnd);
  const bx = L / 2 + 0.05, bz0 = Z_B - 0.05, bz1 = Z_F + 0.05;
  fnd.add(mesh(box(rq(bx * 2), FND_TOP + 0.06, rq(bz1 - bz0)), M.base, { pos: [0, (FND_TOP - 0.06) / 2, (bz0 + bz1) / 2], name: 'fnd-body' }));
  // 打継ぎ目（縦リブ 4 本）＋ 根巻モルタル
  for (let i = 1; i < 5; i++) {
    const x = -L / 2 + (i / 5) * L;
    fnd.add(mesh(box(0.014, FND_TOP - 0.04, 0.016), M.concDark, { pos: [x, (FND_TOP - 0.04) / 2, bz1 - 0.004], name: 'fnd-joint' }));
  }
  fnd.add(mesh(box(rq(L + 0.14), 0.05, rq(bz1 - bz0 + 0.1)), M.concDark, { pos: [0, 0.025, (bz0 + bz1) / 2], name: 'fnd-slick' }));
  weather(fnd, { w: L * 1.1, h: 0.24, pos: [0, 0.12, bz1 + 0.004], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 11, density: 1.7, count: 3, spread: 0.05 });
  weather(fnd, { w: Math.abs(Z_F - Z_B) * 1.1, h: 0.2, pos: [bx + 0.004, 0.11, (bz0 + bz1) / 2], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#544b3e', opacity: 0.42, seed: seed + 13, density: 1.5, count: 2 });

  /* ================= 3. 外壁 4 面（穿孔）＋妻壁 ================= */
  const wallF = piercedWall(body, {
    len: L, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: M.plasterOld,
    pos: [0, 0, Z_F - WT / 2], name: 'wall-front',
    opens: [
      { c: -0.95, w: 0.88, y0: FND_TOP, y1: 2.06 },      // 勝手口
      { c: 0.62, w: 0.86, y0: 1.06, y1: 1.82 },          // 台所窓
    ],
  });
  piercedWall(body, {
    len: L, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: M.plasterShade,
    pos: [0, 0, Z_B + WT / 2], rotYdeg: 180, name: 'wall-rear',
    opens: [{ c: -0.9, w: 0.58, y0: 1.52, y1: 2.02 }, { c: 1.35, w: 0.62, y0: FND_TOP, y1: 1.94 }],
  });
  const sideLen = Math.abs(Z_F - Z_B);
  const wallE = piercedWall(body, {
    len: sideLen, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: M.plasterOld,
    pos: [L / 2 - WT / 2, 0, 0], rotYdeg: 90, name: 'wall-east',
    opens: [{ c: 0.34, w: 0.52, y0: 1.60, y1: 2.02 }],
  });
  const wallW = piercedWall(body, {
    len: sideLen, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: M.plasterShade,
    pos: [-L / 2 + WT / 2, 0, 0], rotYdeg: -90, name: 'wall-west',
    opens: [],
  });

  // 布モルタルの帯（基礎と壁の取り合い水切）
  for (const [bw, bd, x, z, ry] of [[L + 0.04, 0.024, 0, Z_F + 0.004, 0], [L + 0.04, 0.024, 0, Z_B - 0.004, 0], [sideLen + 0.04, 0.024, L / 2 + 0.004, 0, 90], [sideLen + 0.04, 0.024, -L / 2 - 0.004, 0, 90]]) {
    body.add(mesh(box(rq(bw), 0.028, rq(bd)), M.concDark, { pos: [x, FND_TOP + 0.02, z], rot: [0, ry * Math.PI / 180, 0], name: 'wall-dampcourse' }));
  }

  // 妻壁（下見板）
  const corners = [[Z_B - 0.04, FND_TOP + 2.14], [Z_F + 0.04, FND_TOP + 2.14], [RIDGE_Z, GABLE_APEX]];
  for (const flip of [false, true]) {
    gablePrism(body, { corners, thick: WT, mat: M.clapboard, x: flip ? -L / 2 : L / 2 - WT, flip, name: 'gable' + (flip ? '-w' : '-e') });
    // 下見板的な張りの重ね（3 mm 刻みで段shadow）
    const gg = grp('clapboard', { pos: [flip ? -L / 2 - 0.006 : L / 2 + 0.006, 0, 0], rotY: flip ? -90 : 90 });
    body.add(gg);
    for (let i = 0; i < 7; i++) {
      const y = WALL_TOP - 0.02 - i * 0.115;
      const halfRun = (y >= FND_TOP + 2.14) ? 0 : 0;
      const wSeg = 0.104;
      const zc = (Z_B + Z_F) / 2;
      gg.add(noOut(mesh(box(sideLen - 0.14 - i * 0.24, wSeg, 0.014), M.clapboard, { pos: [0, y, zc - halfRun], rot: [0, 0, 0], cast: true, name: 'clap-board' })));
    }
  }

  /* ================= 4. 屋根（瓦・棟・越境軒先・雨樋） ================= */
  const roof = grp('roof');
  body.add(roof);
  const roofX = L + 0.36;
  const runF = EAVE_F - RIDGE_Z, runB = RIDGE_Z - EAVE_B;
  const slopeF = Math.hypot(runF, runF * SLOPE), slopeB = Math.hypot(runB, runB * SLOPE);
  // 前（+Z）の勾配── 軒先が境界塀を越える
  roof.add(mesh(box(rq(roofX), 0.11, rq(slopeF)), M.tile, { pos: [0, (RIDGE_Y + EAVE_Y) / 2, (RIDGE_Z + EAVE_F) / 2], rot: [ANG, 0, 0], name: 'roof-slope-front' }));
  roof.add(mesh(box(rq(roofX), 0.11, rq(slopeB)), M.tileOld, { pos: [0, (RIDGE_Y + (RIDGE_Y - SLOPE * runB)) / 2, (RIDGE_Z + EAVE_B) / 2], rot: [-ANG, 0, 0], name: 'roof-slope-rear' }));
  // 瓦の段（前屋根に 9 本の鬼杢リブ）
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const z = RIDGE_Z + (EAVE_F - RIDGE_Z) * t;
    const y = RIDGE_Y - (RIDGE_Y - EAVE_Y) * t + 0.062;
    roof.add(noOut(mesh(box(rq(roofX - 0.02), 0.014, 0.02), M.tileOld, { pos: [0, y, z], rot: [ANG, 0, 0], cast: false, name: 'tile-rib' })));
  }
  // 棟瓦＋鬼瓦
  roof.add(mesh(box(rq(roofX), 0.075, 0.20), M.ridgeTile, { pos: [0, RIDGE_Y + 0.08, RIDGE_Z], name: 'ridge-tile' }));
  roof.add(mesh(box(rq(roofX) - 0.02, 0.03, 0.24), M.ridgeTile, { pos: [0, RIDGE_Y + 0.13, RIDGE_Z], name: 'ridge-cap' }));
  for (const s of [-1, 1]) {
    roof.add(mesh(rbox(0.16, 0.24, 0.14, 0.02, 2), M.onigawara ?? M.tileOld, { pos: [s * (roofX / 2 - 0.05), RIDGE_Y + 0.16, RIDGE_Z], rot: [0, 0, -s * 0.08], name: 'onigawara' }));
  }
  // 破風・鼻隠し
  for (const s of [-1, 1]) {
    roof.add(mesh(box(0.05, 0.16, rq(slopeF)), M.flash, { pos: [s * (roofX / 2 - 0.02), (RIDGE_Y + EAVE_Y) / 2 + 0.06, (RIDGE_Z + EAVE_F) / 2], rot: [ANG, 0, 0], name: 'barge-front' }));
    roof.add(mesh(box(0.05, 0.16, rq(slopeB)), M.flash, { pos: [s * (roofX / 2 - 0.02), RIDGE_Y - SLOPE * runB / 2 + 0.06, (RIDGE_Z + EAVE_B) / 2], rot: [-ANG, 0, 0], name: 'barge-rear' }));
  }
  roof.add(mesh(box(rq(roofX), 0.15, 0.05), M.flash, { pos: [0, EAVE_Y + 0.075, EAVE_F - 0.01], rot: [ANG, 0, 0], name: 'fascia-front' }));
  // 軒天（2 枚の板＝ underside を紙壁にしない）
  roof.add(noOut(mesh(box(rq(L + 0.2), 0.014, rq(runF - sideLen / 2 + 0.1)), M.woodOld, { pos: [0, WALL_TOP + 0.02, (Z_F + EAVE_F) / 2 + 0.06], rot: [ANG * 0.99, 0, 0], cast: false, name: 'soffit-front' })));
  // 回し瓦（軒先の丸瓦を 1 列）
  const nKawara = Math.max(6, Math.round((L + 0.3) / 0.18));
  row(roof, nKawara, (L + 0.3) / nKawara, (i, x) => mesh(cyl(0.032, 0.032, 0.10, 8), M.tileOld, {
    pos: [x, EAVE_Y + 0.045, EAVE_F - 0.055], rot: [Math.PI / 2, 0, 0], name: 'eave-kawara',
  }), { x0: -(L + 0.3) / 2 + (L + 0.3) / nKawara / 2, z: 0, y: 0 });
  // 雨樋（前端・越境した軒先の下）＋ 金具＋ 竪樋 ＋ 詰まり落ち葉
  const gutterLen = L + 0.28;
  const gutter = grp('gutter', { pos: [0, EAVE_Y - 0.02, EAVE_F + 0.06] });
  roof.add(gutter);
  gutter.add(mesh(cyl(0.062, 0.062, rq(gutterLen), 12, true), M.galv, { rot: [0, 0, Math.PI / 2], scale: [1, 1, 0.62], name: 'gutter-shell' }));
  gutter.add(noOut(mesh(box(rq(gutterLen), 0.008, 0.116), M.dark, { pos: [0, 0.026, 0], cast: false, name: 'gutter-inner' })));
  for (let i = 0; i < 5; i++) {
    gutter.add(mesh(box(0.026, 0.10, 0.02), M.aluDark, { pos: [-gutterLen / 2 + 0.3 + i * (gutterLen - 0.6) / 4, 0.055, 0.03], name: 'gutter-bracket' }));
  }
  for (let i = 0; i < 7; i++) {
    gutter.add(noOut(mesh(rbox(0.06, 0.012, 0.05, 0.01, 1), M.leafDead, { pos: [range(rnd, -gutterLen / 2 + 0.2, gutterLen / 2 - 0.2), 0.012, range(rnd, -0.03, 0.03)], rot: [0, range(rnd, 0, 3), 0], cast: false, name: 'gutter-leaves' })));
  }
  // 竪樋（東端から落下 → 地上の受桝）
  const dpipe = grp('downpipe', { pos: [L / 2 - 0.10, 0, Z_F - 0.14] });
  body.add(dpipe);
  dpipe.add(mesh(cyl(0.05, 0.05, rq(EAVE_Y - 0.06), 10), M.galv, { pos: [0, (EAVE_Y - 0.06) / 2 + 0.14, 0], name: 'downpipe-body' }));
  dpipe.add(mesh(cyl(0.062, 0.062, 0.07, 10), M.galv, { pos: [0, EAVE_Y - 0.06, 0], name: 'downpipe-funnel' }));
  for (const y of [0.6, 1.3, 1.9]) dpipe.add(mesh(box(0.024, 0.05, 0.13), M.aluDark, { pos: [-0.055, y, 0], name: 'downpipe-band' }));
  dpipe.add(mesh(box(0.28, 0.12, 0.28), M.concDark, { pos: [0.02, 0.06, 0.16], name: 'downpipe-basin' }));
  dpipe.add(noOut(mesh(box(0.24, 0.01, 0.24), M.dark, { pos: [0.02, 0.121, 0.16], cast: false, name: 'downpipe-void' })));

  // 屋根の経年：苔・割れ瓦・浮き・鳥除け針金
  weather(roof, { w: runF * 1.1, h: L * 0.5, pos: [-0.4, (RIDGE_Y + EAVE_Y) / 2 - 0.02, (RIDGE_Z + EAVE_F) / 2 + 0.2], rot: [-Math.PI / 2 + ANG, 0, 0], kind: 'moss', color: '#63804e', opacity: 0.46, seed: seed + 21, density: 1.8, count: 3, spread: 0.1 });
  for (let i = 0; i < 3; i++) {
    const t = range(rnd, 0.25, 0.85);
    const z = RIDGE_Z + (EAVE_F - RIDGE_Z) * t, y = RIDGE_Y - (RIDGE_Y - EAVE_Y) * t + 0.075;
    roof.add(mesh(rbox(0.24, 0.026, 0.14, 0.008, 2), M.onigawara ?? M.tile, { pos: [range(rnd, -L / 2 + 0.5, L / 2 - 0.5), y, z], rot: [ANG, 0, range(rnd, -0.06, 0.06)], name: 'tile-cracked' }));
    roof.add(mesh(box(0.03, 0.03, 0.12), M.dark, { pos: [range(rnd, -L / 2 + 0.5, L / 2 - 0.5) + 0.12, y - 0.005, z], rot: [ANG, 0, 0], name: 'tile-gap' }));
  }
  for (let i = 0; i < 3; i++) {
    const x = -L / 2 + 0.6 + i * (L - 1.2) / 2;
    roof.add(mesh(box(0.006, 0.12, 0.006), M.aluDark, { pos: [x, RIDGE_Y + 0.20, RIDGE_Z + 0.02], name: 'birdwire-post' }));
  }
  roof.add(noOut(mesh(box(L - 0.4, 0.003, 0.003), M.alu, { pos: [0, RIDGE_Y + 0.26, RIDGE_Z + 0.02], cast: false, name: 'birdwire' })));

  /* ================= 5. 建具（勝手口・窓・網戸・雨戸） ================= */
  // --- 勝手口（金属建・段差・施錠）: wallF ローカル +Z = 外
  const kuchi = grp('kuchikado', { pos: [-0.95, 0, WT / 2] });
  wallF.add(kuchi);
  const DW = 0.86, DH = 1.74, y0 = FND_TOP + 0.02;
  // 枠
  for (const [dx, dy, bw, bh] of [[0, DH / 2 + 0.026, DW + 0.10, 0.052], [-0.456, 0, 0.052, DH], [DW / 2 + 0.026, 0, 0.052, DH]]) {
    kuchi.add(mesh(box(rq(bw), rq(bh), 0.075), M.aluDark, { pos: [dx, y0 + dy, 0.030], name: 'door-frame' }));
  }
  // 扉（アルミ框＋波芯、6 分だけ開けて隙間と暗がり）
  const leaf = grp('door-leaf', { pos: [-DW / 2 + 0.01, 0, 0.066], rotY: -7 });
  kuchi.add(leaf);
  leaf.add(mesh(box(rq(DW - 0.02), rq(DH - 0.03), 0.028), M.galv, { pos: [(DW - 0.02) / 2, y0 + DH / 2, 0], name: 'door-panel' }));
  for (let i = 0; i < 4; i++) leaf.add(mesh(box(rq(DW - 0.08), 0.014, 0.034), M.alu, { pos: [(DW - 0.02) / 2, y0 + 0.28 + i * 0.42, 0.004], name: 'door-rib' }));
  leaf.add(mesh(box(rq(DW - 0.10), 0.30, 0.02), M.aluDark, { pos: [(DW - 0.02) / 2, y0 + DH - 0.24, 0.016], name: 'door-louver' }));
  leaf.add(noOut(mesh(box(0.30, 0.22, 0.012), M.glass, { pos: [(DW - 0.02) / 2, y0 + DH - 0.46, 0.022], cast: false, name: 'door-wire-glass' })));
  leaf.add(noOut(grill(leaf, { w: 0.28, h: 0.20, nx: 4, ny: 3, bar: 0.003, mat: M.alu, pos: [(DW - 0.02) / 2, y0 + DH - 0.46, 0.029] })));
  // 内側の暗がり（通し穴にしない）
  leaf.add(noOut(mesh(box(DW - 0.04, DH - 0.06, 0.01), M.dark, { pos: [(DW - 0.02) / 2, y0 + DH / 2, -0.024], cast: false, name: 'door-interior' })));
  // 丁番 2 箇所
  for (const dy of [0.30, DH - 0.34]) {
    const hgrp = put(grp('hinge'), 0.006, y0 + dy, 0.014);
    leaf.add(hgrp);
    hgrp.add(mesh(box(0.024, 0.10, 0.012), M.iron, { pos: [0, 0, -0.02] }));
    hgrp.add(mesh(cyl(0.009, 0.009, 0.11, 8), M.iron, { pos: [0.006, 0, 0] }));
    hgrp.add(mesh(cyl(0.012, 0.012, 0.012, 8), M.iron, { pos: [0.006, 0.058, 0] }));
    weather(hgrp, { w: 0.06, h: 0.12, pos: [0.02, -0.07, -6e-3], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 31 + Math.round(dy * 100), density: 1.8, spread: 0.006 });
  }
  // 回転レバー錠＋鍵（施錠状態）＋ 引き戸補助錠
  const lock = grp('lever-lock', { pos: [DW - 0.11, y0 + DH * 0.44, 0.030] });
  leaf.add(lock);
  lock.add(mesh(rbox(0.062, 0.19, 0.016, 0.006, 2), M.alu, { pos: [0, 0, 0.014] }));
  lock.add(mesh(cyl(0.013, 0.013, 0.05, 10), M.iron, { pos: [-4e-3, 0, 0.042], rot: [Math.PI / 2, 0, 0] }));
  lock.add(mesh(box(0.21, 0.02, 0.02), M.alu, { pos: [-0.108, 0, 0.062], rot: [0, 0.1, 0.05] }));
  lock.add(mesh(cyl(0.011, 0.011, 0.012, 10), MAT.metal('#a9a5a0', { repeat: 7 }), { pos: [0.004, -0.108, 0.024], rot: [Math.PI / 2, 0, 0] }));
  lock.add(mesh(box(0.006, 0.018, 0.005), M.dark, { pos: [0.004, -0.108, 0.031] }));
  lock.add(mesh(cyl(0.0055, 0.0055, 0.048, 6), MAT.metal('#c9b98a', { spec: 0.6, repeat: 6 }), { pos: [0.004, -0.108, 0.050], rot: [Math.PI / 2, 0, 0.6] }));
  lock.add(mesh(box(0.05, 0.02, 0.014), M.rust, { pos: [0.05, -0.108, 0.006] }));
  // 段差（框＋2 段＋水切）
  const stepG = grp('kuchi-step');
  body.add(stepG);
  stepG.position.set(-0.95, 0, Z_F + 0.006);
  stepG.add(mesh(box(DW + 0.16, 0.16, 0.30), M.base, { pos: [0, 0.08, 0.15], name: 'step-1' }));
  stepG.add(mesh(box(DW + 0.10, 0.14, 0.24), M.base, { pos: [0, 0.23, 0.06], name: 'step-2' }));
  stepG.add(mesh(rbox(DW + 0.06, 0.016, 0.10, 0.004, 2), M.alu, { pos: [0, y0 + 0.02, 0.05], name: 'step-sill' }));
  for (let i = 0; i < 6; i++) stepG.add(noOut(mesh(box(0.018, 0.004, 0.03), M.aluDark, { pos: [-DW / 2 + 0.08 + i * 0.14, y0 + 0.029, 0.05], cast: false, name: 'step-grip' })));
  stepG.add(mesh(box(DW + 0.24, 0.022, 0.03), M.flash, { pos: [0, 0.148, 0.302], name: 'step-drip' }));
  weather(stepG, { w: DW + 0.2, h: 0.1, pos: [0, 0.05, 0.306], kind: 'moss', color: PAL.moss, opacity: 0.44, seed: seed + 35, density: 1.6, spread: 0.02 });
  // 雨除し（波板のひさし＋アングル支持）
  const eave = grp('kuchi-canopy', { pos: [0, DH + 0.14, 0.24] });
  kuchi.add(eave);
  eave.add(mesh(box(DW + 0.28, 0.022, 0.50), M.corrOld, { pos: [0, 0, 0], rot: [-0.14, 0, 0], name: 'canopy-sheet' }));
  eave.add(mesh(box(DW + 0.30, 0.05, 0.024), M.aluDark, { pos: [0, -0.02, 0.25], rot: [-0.14, 0, 0], name: 'canopy-nose' }));
  for (const sx of [-1, 1]) {
    eave.add(mesh(box(0.022, 0.022, 0.44), M.aluDark, { pos: [sx * (DW / 2 + 0.06), -0.12, 0.16], rot: [0.62, 0, 0], name: 'canopy-brace' }));
    eave.add(mesh(box(0.03, 0.05, 0.05), M.iron, { pos: [sx * (DW / 2 + 0.06), -0.2, -0.02], name: 'canopy-anchor' }));
  }
  weather(eave, { w: DW + 0.2, h: 0.14, pos: [0, 0.03, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5b5045', opacity: 0.4, seed: seed + 37, density: 1.5 });
  // 網戸（外側に吊る・少し開いたまま）
  const ago = grp('screen', { pos: [-0.1, 0, 0.10], rotY: 16 });
  kuchi.add(ago);
  ago.add(mesh(box(DW - 0.04, DH - 0.06, 0.010), M.meshFabric, { pos: [(DW - 0.04) / 2, y0 + (DH - 0.06) / 2, 0], name: 'screen-mesh' }));
  for (const [dx, dy, bw, bh] of [[(DW - 0.04) / 2, y0 + DH - 0.07, DW - 0.04, 0.02], [(DW - 0.04) / 2, y0 + 0.01, DW - 0.04, 0.02], [0.01, y0 + (DH - 0.06) / 2, 0.02, DH - 0.06], [DW - 0.05, y0 + (DH - 0.06) / 2, 0.02, DH - 0.06]]) {
    ago.add(mesh(box(rq(bw), rq(bh), 0.018), M.aluDark, { pos: [dx, dy, 0.003], name: 'screen-frame' }));
  }
  ago.add(mesh(box(0.028, 0.09, 0.014), M.plasticDark ?? M.rubberMat, { pos: [DW - 0.07, y0 + DH * 0.52, 0.016], name: 'screen-pull' }));

  // --- 台所窓（アルミサッシ・ガラス・内側の暗がり・雨戸 開）
  const win = grp('win-kitchen', { pos: [0.62, 1.44, WT / 2] });
  wallF.add(win);
  const WW = 0.84, WH = 0.74;
  for (const [dx, dy, bw, bh] of [[0, WH / 2 - 0.024, WW, 0.048], [0, -WH / 2 + 0.024, WW, 0.048], [-WW / 2 + 0.024, 0, 0.048, WH], [WW / 2 - 0.024, 0, 0.048, WH]]) {
    win.add(mesh(box(rq(bw), rq(bh), 0.07), M.alu, { pos: [dx, dy, 0.026], name: 'win-frame' }));
  }
  win.add(mesh(box(0.03, WH - 0.10, 0.056), M.alu, { pos: [0.05, 0, 0.028], name: 'win-mullion' }));
  win.add(mesh(box(WW - 0.06, WH - 0.06, 0.006), M.glass, { pos: [-0.01, 0, 0.020], name: 'win-glass-a' }));
  win.add(mesh(box(WW / 2 - 0.05, WH - 0.06, 0.006), M.glass, { pos: [WW / 4 - 0.02, 0, 0.038], name: 'win-glass-b' }));
  win.add(noOut(mesh(box(WW - 0.08, WH - 0.08, 0.008), M.dark, { pos: [0, 0, -0.03], cast: false, name: 'win-curtain-void' })));
  win.add(mesh(box(WW - 0.10, 0.10, 0.012), M.paperWhite, { pos: [-0.02, WH / 2 - 0.12, -0.026], rot: [0.42, 0, 0], name: 'win-curtain' }));
  win.add(mesh(box(WW + 0.08, 0.03, 0.11), M.flash, { pos: [0, -WH / 2 - 0.01, 0.034], name: 'win-sill-flash' }));
  win.add(mesh(box(0.05, 0.02, 0.03), M.aluDark, { pos: [WW / 2 - 0.08, -0.02, 0.062], name: 'win-catch' }));
  // 雨戸（トタン・片側だけ積み残し）
  for (const s of [-1, 1]) {
    win.add(mesh(box(0.40, WH - 0.02, 0.022), s < 0 ? M.corr : M.corrOld, { pos: [s * (WW / 2 + 0.21), 0, 0.088], name: 'shutter-stacked' }));
    for (let i = 0; i < 3; i++) win.add(noOut(mesh(box(0.38, 0.008, 0.004), M.aluDark, { pos: [s * (WW / 2 + 0.21), -WH / 2 + 0.14 + i * 0.24, 0.101], cast: false, name: 'shutter-rib' })));
  }
  win.add(mesh(box(WW + 0.86, 0.02, 0.034), M.aluDark, { pos: [0, WH / 2 + 0.014, 0.088], name: 'shutter-rail' }));
  weather(win, { w: 0.44, h: WH * 0.75, pos: [WW / 2 + 0.21, -0.04, 0.104], kind: 'rust', color: '#7d4a2c', opacity: 0.44, seed: seed + 41, density: 1.7, count: 2, spread: 0.05 });
  weather(win, { w: WW * 0.9, h: 0.36, pos: [0, -WH / 2 - 0.22, 0.072], kind: 'dirt', color: '#5f584c', opacity: 0.4, seed: seed + 43, density: 1.4, count: 2, spread: 0.05 });

  // --- 東妻の小窓・裏窓・換気口
  const winE = grp('win-gable', { pos: [-0.34, 1.81, WT / 2] });
  wallE.add(winE);
  winE.add(mesh(box(0.54, 0.44, 0.05), M.woodOld, { pos: [0, 0, 0.022], name: 'gable-frame' }));
  winE.add(mesh(box(0.44, 0.34, 0.008), M.glass, { pos: [0, 0, 0.050], name: 'gable-glass' }));
  winE.add(noOut(mesh(box(0.42, 0.32, 0.006), M.dark, { pos: [0, 0, -4e-3], cast: false, name: 'gable-void' })));
  winE.add(mesh(box(0.60, 0.026, 0.10), M.flash, { pos: [0, -0.23, 0.030], name: 'gable-sill' }));
  noOut(grill(winE, { w: 0.44, h: 0.34, nx: 4, ny: 3, bar: 0.005, mat: M.aluDark, pos: [0, 0, 0.060] }));

  const vent = grp('vent', { pos: [WT / 2 - 0.02, 0, 0] });
  wallW.add(put(grp('vent-holder', { pos: [0.6, 1.90, 0] }), vent));
  vent.add(mesh(box(0.26, 0.20, 0.026), M.aluDark, { name: 'vent-plate' }));
  for (let i = 0; i < 5; i++) vent.add(mesh(box(0.22, 0.012, 0.02), M.alu, { pos: [0, -0.08 + i * 0.04, 0.016], rot: [0.44, 0, 0], name: 'vent-louver' }));
  vent.add(mesh(tor(0.07, 0.010, 5, 12), M.alu, { pos: [0, 0, 0.02], scale: [1.4, 1.1, 1], name: 'vent-ring' }));

  /* ================= 6. 給水管とメーター ================= */
  const water = grp('water-supply');
  body.add(water);
  // メーター箱（地上立ち上がり・蓋・取手・凍結カバー）
  const mw = put(grp('meter-box'), 0.10, 0, Z_F + 0.24);
  water.add(mw);
  mw.add(mesh(rbox(0.32, 0.22, 0.28, 0.012, 2), M.concDark, { pos: [0, 0.11, 0], name: 'meter-rise' }));
  mw.add(mesh(box(0.36, 0.034, 0.32), M.base, { pos: [0, 0.236, 0], name: 'meter-lid' }));
  mw.add(mesh(box(0.09, 0.012, 0.045), M.aluDark, { pos: [0.07, 0.256, 0], name: 'meter-handle' }));
  mw.add(mesh(box(0.12, 0.05, 0.012), M.paperWhite, { pos: [-0.06, 0.13, 0.145], rot: [0, -0.06, 0], name: 'meter-tag' }));
  // 給水管：メーター → 壁の仕切弁 → 台所窓下まで上り、保温巻き
  const pipeR = 0.016;
  const pts = [[0.10, 0.24, Z_F + 0.24], [0.10, 0.62, Z_F + 0.30], [0.10, 0.94, Z_F + 0.12], [0.10, 1.16, Z_F + 0.02]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len2 = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const seg = mesh(cyl(pipeR, pipeR, rq(len2), 8), M.galv, { pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], name: 'supply-pipe' });
    seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
    water.add(seg);
  }
  // 壁に添って上る縦管＋サドルバンド
  const riser = mesh(cyl(pipeR, pipeR, 0.66, 8), M.galv, { pos: [0.10, 1.49, Z_F + 0.02], name: 'supply-riser' });
  water.add(riser);
  for (const y of [1.24, 1.62]) {
    water.add(mesh(box(0.018, 0.036, 0.05), M.aluDark, { pos: [0.10, y, Z_F - 0.006], name: 'saddle-band' }));
    water.add(mesh(cyl(0.005, 0.005, 0.02, 6), M.iron, { pos: [0.10, y, Z_F + 0.022], rot: [Math.PI / 2, 0, 0], name: 'saddle-bolt' }));
  }
  // 仕切弁（ハンドル付き）＋ 保温スポンジ（一部めくれ）＋ 凍結カバー
  water.add(mesh(cyl(0.026, 0.026, 0.05, 9), M.brass ?? MAT.metal('#b99a58', { spec: 0.65 }), { pos: [0.10, 0.30, Z_F + 0.24], name: 'valve-body' }));
  water.add(mesh(cyl(0.042, 0.042, 0.012, 12), M.aluDark, { pos: [0.10, 0.30, Z_F + 0.28], rot: [Math.PI / 2, 0, 0], name: 'valve-wheel' }));
  water.add(mesh(box(0.09, 0.012, 0.012), M.aluDark, { pos: [0.10, 0.30, Z_F + 0.288], rot: [0, 0, 0.4], name: 'valve-spoke' }));
  water.add(mesh(cyl(0.026, 0.026, 0.30, 8), M.rubberMat, { pos: [0.10, 0.76, Z_F + 0.26], rot: [0.42, 0, 0], name: 'pipe-insulation' }));
  water.add(noOut(mesh(tor(0.027, 0.006, 5, 12), M.paperWhite, { pos: [0.10, 0.90, Z_F + 0.20], rot: [0.42, 0, 0], cast: false, name: 'insulation-tape' })));
  weather(water, { w: 0.14, h: 0.22, pos: [0.10, 0.08, Z_F + 0.20], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 51, density: 1.9, count: 2, spread: 0.04 });

  /* ================= 7. トタンの物置（釘・錆・南京錠・中の暗がり） ================= */
  const shed = grp('tin-shed', { pos: [1.55, 0, 0.78] });
  body.add(shed);
  const SW = 1.32, SD = 0.64, SH = 1.62;
  const shedY = 0.05;
  // 根入石（据付 4 点）＋ 土台アングル
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    shed.add(mesh(box(0.20, 0.05, 0.18), M.concDark, { pos: [sx * (SW / 2 - 0.14), 0.025, sz * (SD / 2 - 0.10)], name: 'shed-footing' }));
  }
  shed.add(mesh(box(SW, 0.05, SD), M.aluDark, { pos: [0, shedY + 0.025, 0], name: 'shed-sill' }));
  // 壁（波板 4 枚＋框）
  const wallH = SH - 0.10;
  shed.add(mesh(box(SW, wallH, 0.022), M.corr, { pos: [0, shedY + wallH / 2, -SD / 2 + 0.011], name: 'shed-wall-back' }));
  for (const s of [-1, 1]) {
    shed.add(mesh(box(0.022, wallH, SD), M.corr, { pos: [s * (SW / 2 - 0.011), shedY + wallH / 2, 0], name: 'shed-wall-side' }));
  }
  // 前枠（開口を残して左右柱＋上框）
  shed.add(mesh(box(0.055, wallH, 0.05), M.aluDark, { pos: [-SW / 2 + 0.028, shedY + wallH / 2, SD / 2 - 0.025], name: 'shed-post-l' }));
  shed.add(mesh(box(0.055, wallH, 0.05), M.aluDark, { pos: [SW / 2 - 0.028, shedY + wallH / 2, SD / 2 - 0.025], name: 'shed-post-r' }));
  shed.add(mesh(box(SW, 0.06, 0.05), M.aluDark, { pos: [0, shedY + wallH - 0.03, SD / 2 - 0.025], name: 'shed-lintel' }));
  // 中の暗がり（内装箱＝紙壁回避）＋ 棚板と長物
  shed.add(noOut(mesh(box(SW - 0.06, wallH - 0.06, SD - 0.06), M.dark, { pos: [0, shedY + wallH / 2, -0.01], cast: false, receive: false, name: 'shed-interior' })));
  shed.add(mesh(box(SW - 0.16, 0.02, 0.20), M.woodOld, { pos: [-0.05, shedY + wallH * 0.62, -0.14], name: 'shed-shelf' }));
  shed.add(mesh(cyl(0.016, 0.016, 0.90, 6), M.woodOld, { pos: [0.42, shedY + 0.48, -0.2], rot: [0.12, 0, 0.1], name: 'shed-pole' }));
  shed.add(mesh(box(0.22, 0.26, 0.22), M.plasticDark ?? M.rubberMat, { pos: [-0.42, shedY + 0.13, -0.14], name: 'shed-crate' }));
  // 引き戸（2 枚・右戸を半開 → 中の暗がりが見える）
  const doorW = (SW - 0.12) / 2 + 0.03;
  for (const s of [-1, 1]) {
    const dz = s < 0 ? SD / 2 + 0.006 : SD / 2 + 0.048;
    const dx = s < 0 ? -SW / 2 + doorW / 2 + 0.02 : (SW / 2 - doorW / 2 - 0.02) + 0.16;
    const d = grp('shed-door', { pos: [dx, shedY + (wallH - 0.06) / 2 + 0.02, dz], rotY: s < 0 ? 0 : 4 });
    shed.add(d);
    d.add(mesh(box(doorW, wallH - 0.06, 0.018), s < 0 ? M.corrOld : M.corr, { name: 'door-skin' }));
    for (const [ox, oy, bw, bh] of [[0, (wallH - 0.06) / 2 - 0.014, doorW, 0.028], [0, -1.46 / 2 + 0.014, doorW, 0.028], [-0.30100000000000005, 0, 0.028, wallH - 0.06], [doorW / 2 - 0.014, 0, 0.028, wallH - 0.06]]) {
      d.add(mesh(box(rq(bw), rq(bh), 0.026), M.aluDark, { pos: [ox, oy, 0.004], name: 'door-frame' }));
    }
    // 下部通風格子
    d.add(noOut(grill(d, { w: doorW - 0.10, h: 0.09, nx: 2, ny: 4, bar: 0.006, mat: M.aluDark, pos: [0, -1.46 / 2 + 0.09, 0.016] })));
    d.add(mesh(box(0.03, 0.10, 0.014), M.alu, { pos: [doorW / 2 - 0.05, 0.05, 0.022], name: 'door-handle' }));
    // 釘（波板留め 2 列）
    for (let i = 0; i < 7; i++) {
      d.add(noOut(mesh(cyl(0.0055, 0.0055, 0.006, 6), M.iron, { pos: [-doorW / 2 + 0.05 + i * (doorW - 0.1) / 6, (wallH - 0.1) / 2 - 0.05, 0.014], rot: [Math.PI / 2, 0, 0], cast: false, name: 'screw' })));
    }
  }
  // 南京錠（右戸の掛け金に掛ける・錆）
  const hasp = grp('hasp', { pos: [0.06, shedY + wallH * 0.52, SD / 2 + 0.075] });
  shed.add(hasp);
  hasp.add(mesh(box(0.10, 0.05, 0.006), M.galv, { pos: [0, 0, 0.004], rot: [0, 0, 0.06], name: 'hasp-plate' }));
  hasp.add(mesh(box(0.05, 0.04, 0.006), M.galv, { pos: [0.052, 0.004, 0.008], name: 'hasp-staple' }));
  hasp.add(mesh(rbox(0.044, 0.038, 0.016, 0.008, 2), M.rust, { pos: [0.055, -0.028, 0.012], name: 'padlock-body' }));
  hasp.add(mesh(tor(0.014, 0.0045, 5, 12), M.iron, { pos: [0.055, -6e-3, 0.012], name: 'padlock-shackle' }));
  hasp.add(noOut(mesh(box(0.012, 0.006, 0.004), M.dark, { pos: [0.055, -0.03, 0.021], cast: false, name: 'padlock-keyway' })));
  weather(hasp, { w: 0.10, h: 0.16, pos: [0.05, -0.1, 0.014], kind: 'rust', color: '#8a5236', opacity: 0.55, seed: seed + 61, density: 2.0, spread: 0.01 });
  // 屋根（波板・片流れ・軒先の出）＋ 妻金物
  const sRoofAng = 0.15;
  const sRun = SD + 0.30;
  shed.add(mesh(box(SW + 0.14, 0.026, rq(sRun / Math.cos(sRoofAng))), M.corr, { pos: [0, shedY + SH + 0.10, -0.05], rot: [-sRoofAng, 0, 0], name: 'shed-roof' }));
  shed.add(mesh(box(SW + 0.16, 0.05, 0.024), M.aluDark, { pos: [0, shedY + SH + 0.03, 0.11], name: 'shed-nose' }));
  for (const s of [-1, 1]) shed.add(mesh(box(0.028, 0.10, 0.03), M.galv, { pos: [s * (SW / 2 + 0.04), shedY + SH + 0.14, -0.14], name: 'shed-windbrace' }));
  // 換気口（波板貫通の小型フード）
  shed.add(mesh(cyl(0.05, 0.05, 0.06, 10), M.aluDark, { pos: [-0.36, shedY + SH + 0.16, -0.1], rot: [-sRoofAng, 0, 0], name: 'shed-vent' }));
  // 錆・釘::経年
  weather(shed, { w: SW * 0.9, h: 0.4, pos: [0, shedY + 0.20, SD / 2 + 0.03], kind: 'rust', color: '#7d4a2c', opacity: 0.42, seed: seed + 63, density: 1.9, count: 3, spread: 0.06 });
  weather(shed, { w: SD, h: 0.5, pos: [SW / 2 + 0.014, shedY + 0.34, -0.05], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.4, seed: seed + 65, density: 1.6, count: 2 });
  weather(shed, { w: SW * 0.8, h: 0.24, pos: [0, shedY + 0.06, -SD / 2 - 0.02], rot: [0, Math.PI, 0], kind: 'moss', color: '#63804e', opacity: 0.44, seed: seed + 67, density: 1.7 });
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    shed.add(noOut(mesh(cyl(0.005, 0.005, 0.006, 6), M.iron, {
      pos: [range(rnd, -SW / 2 + 0.08, SW / 2 - 0.08), shedY + 0.12 + (i % 6) * 0.24, side * (SD / 2 - 0.004)],
      rot: [Math.PI / 2, 0, 0], cast: false, name: 'shed-nail',
    })));
  }

  /* ================= 8. 境界のブロック塀＋メッシュフェンス ================= */
  const bnd = grp('boundary');
  body.add(bnd);
  const blkEnd = 0.52;
  // -- ブロック塀（x: -L/2-0.1 → blkEnd）
  const bw0 = -L / 2 - 0.10;
  const blkLen = blkEnd - bw0;
  bnd.add(mesh(box(rq(blkLen + 0.10), 0.16, 0.30), M.concDark, { pos: [bw0 + blkLen / 2, 0.08, Z_BND], name: 'bnd-footing' }));
  const ROWS = 7, ROW_H = 0.185;
  for (let r = 0; r < ROWS; r++) {
    const y = 0.16 + r * ROW_H + ROW_H / 2;
    bnd.add(mesh(box(rq(blkLen), rq(ROW_H - 0.008), 0.18), M.base, { pos: [bw0 + blkLen / 2, y, Z_BND], name: 'block-row' }));
    const seg = Math.max(2, Math.round(blkLen / 0.80));
    for (let i = 1; i < seg; i++) {
      bnd.add(noOut(mesh(box(0.012, ROW_H - 0.02, 0.184), M.concDark, { pos: [bw0 + (i / seg) * blkLen, y, Z_BND], cast: false, name: 'block-joint' })));
    }
    // 縦穴（覗き 2 孔）
    if (r === ROWS - 2) {
      for (let i = 0; i < 3; i++) bnd.add(noOut(mesh(cyl(0.028, 0.028, 0.19, 8), M.dark, { pos: [bw0 + 0.6 + i * 0.9, y, Z_BND], rot: [Math.PI / 2, 0, 0], cast: false, name: 'block-hole' })));
    }
  }
  // 頂キャップ（落水面付き）
  bnd.add(mesh(box(rq(blkLen + 0.06), 0.05, 0.24), M.paving, { pos: [bw0 + blkLen / 2, 0.16 + ROWS * ROW_H + 0.025, Z_BND], name: 'bnd-cap' }));
  bnd.add(mesh(box(rq(blkLen + 0.06), 0.014, 0.024), M.concDark, { pos: [bw0 + blkLen / 2, 0.16 + ROWS * ROW_H + 0.006, Z_BND + 0.12], name: 'bnd-drip' }));
  // 伸縮目地（2 箇所）・鉄筋見切り（端部で錆筋 3 本が出る）
  for (const x of [bw0 + blkLen * 0.36, bw0 + blkLen * 0.71]) {
    bnd.add(mesh(box(0.018, ROWS * ROW_H, 0.186), MAT.paint('#8b8578', { steps: 2, sat: 0.8 }), { pos: [x, 0.16 + ROWS * ROW_H / 2, Z_BND], name: 'bnd-expansionjoint' }));
  }
  for (let i = 0; i < 3; i++) {
    bnd.add(mesh(cyl(0.005, 0.005, 0.14, 6), M.rust, { pos: [blkEnd + 0.02, 0.16 + ROWS * ROW_H + 0.06, Z_BND - 0.06 + i * 0.06], rot: [Math.PI / 2, 0, 0.12], name: 'rebar-cut' }));
  }
  bnd.add(mesh(box(0.05, ROWS * ROW_H, 0.18), M.dirt, { pos: [blkEnd + 0.045, 0.16 + ROWS * ROW_H / 2, Z_BND], name: 'bnd-returnface' }));
  // 落書き除去跡（塗り残しの段違い＋消した文字の残り）
  const gph = grp('graffiti-removal', { pos: [-1.15, 0.92, Z_BND - 0.098] });
  bnd.add(gph);
  gph.add(mesh(rbox(0.84, 0.52, 0.010, 0.006, 2), MAT.concrete({ base: '#e7e0cd', repeat: 1, sat: 0.86, tint: '#f7f1e2' }), { name: 'patch-fresh' }));
  decal(gph, { map: TEX.wear({ kind: 'scratch', color: '#b2604c', seed: seed + 71, density: 1.1 }), w: 0.7, h: 0.34, pos: [0.02, -0.02, 0.008], opacity: 0.3 });
  decal(gph, { map: TEX.wear({ kind: 'chip', color: '#c8c0ae', seed: seed + 73, density: 1.3 }), w: 0.86, h: 0.5, pos: [0, 0, 0.006], opacity: 0.36 });
  gph.add(noOut(mesh(box(0.9, 0.012, 0.006), MAT.paint('#d9d0bb', { steps: 2 }), { pos: [0, 0.27, 0.006], cast: false, name: 'mask-line' })));
  weather(bnd, { w: blkLen * 0.5, h: 0.3, pos: [bw0 + blkLen * 0.3, 0.22, Z_BND - 0.10], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.46, seed: seed + 75, density: 1.8, count: 2 });
  weather(bnd, { w: 0.5, h: 0.7, pos: [blkEnd - 0.4, 1.30, Z_BND - 0.098], rot: [0, Math.PI, 0], kind: 'dirt', color: '#5f584c', opacity: 0.32, seed: seed + 77, density: 1.4 });

  // -- メッシュフェンス（x: blkEnd → L/2+0.10）
  const mf = grp('mesh-fence');
  bnd.add(mf);
  const mfX0 = blkEnd + 0.06, mfX1 = L / 2 + 0.10;
  const nPost = 3;
  for (let i = 0; i < nPost; i++) {
    const x = mfX0 + (i / (nPost - 1)) * (mfX1 - mfX0);
    const lean = i === 1 ? range(rnd, -0.03, 0.03) : 0;
    mf.add(mesh(cyl(0.026, 0.028, 1.72, 10), M.aluDark, { pos: [x, 0.86, Z_BND], rot: [lean, 0, lean * 0.6], name: 'fence-post' }));
    mf.add(mesh(cyl(0.03, 0.03, 0.02, 10), M.alu, { pos: [x, 1.73, Z_BND], name: 'fence-cap' }));
    mf.add(mesh(box(0.18, 0.10, 0.20), M.concDark, { pos: [x, 0.05, Z_BND], name: 'fence-base' }));
  }
  for (let i = 0; i < nPost - 1; i++) {
    const x0 = mfX0 + (i / (nPost - 1)) * (mfX1 - mfX0);
    const x1 = mfX0 + ((i + 1) / (nPost - 1)) * (mfX1 - mfX0);
    const pw = x1 - x0 - 0.05, cx = (x0 + x1) / 2;
    const panel = grp('mesh-panel', { pos: [cx, 0.98, Z_BND], rotY: i === 1 ? range(rnd, -1.5, 1.5) : 0 });
    mf.add(panel);
    for (const [dx, dy, bw, bh] of [[0, 0.375, pw, 0.022], [0, -0.375, pw, 0.022], [-pw / 2 + 0.011, 0, 0.022, 0.75], [pw / 2 - 0.011, 0, 0.022, 0.75]]) {
      panel.add(mesh(box(rq(bw), rq(bh), 0.024), M.alu, { pos: [dx, dy, 0], name: 'panel-frame' }));
    }
    noOut(grill(panel, { w: pw - 0.04, h: 0.72, nx: Math.round(pw / 0.055), ny: 9, bar: 0.005, mat: M.alu, pos: [0, 0, 0] }));
    if (i === 1) {
      // 一部だけ千切れた線（欠損 2 本）
      panel.add(noOut(mesh(box(pw - 0.06, 0.006, 0.008), M.rust, { pos: [0.02, 0.12, 0.02], rot: [0, 0, -0.14], cast: false, name: 'wire-broken' })));
    }
  }
  weather(mf, { w: mfX1 - mfX0, h: 0.3, pos: [(mfX0 + mfX1) / 2, 0.16, Z_BND + 0.02], kind: 'rust', color: '#8a5236', opacity: 0.34, seed: seed + 79, density: 1.7, count: 2, spread: 0.06 });

  /* ================= 9. 物干し竿（洗濯バサミまで） ================= */
  const hoshi = grp('hoshidate');
  body.add(hoshi);
  const hp0 = -2.05, hp1 = -0.15;
  for (const x of [hp0, hp1]) {
    hoshi.add(mesh(cyl(0.03, 0.036, 1.42, 10), M.galv, { pos: [x, 0.71, 1.14], name: 'hoshi-post' }));
    hoshi.add(mesh(box(0.16, 0.06, 0.16), M.concDark, { pos: [x, 0.03, 1.14], name: 'hoshi-base' }));
    hoshi.add(mesh(box(0.07, 0.028, 0.07), M.alu, { pos: [x, 1.44, 1.14], name: 'hoshi-fork' }));
    hoshi.add(noOut(mesh(box(0.13, 0.03, 0.05), M.alu, { pos: [x, 1.12, 1.14], name: 'hoshi-hook' })));
  }
  const poleLen = hp1 - hp0 + 0.24;
  hoshi.add(mesh(cyl(0.017, 0.017, rq(poleLen), 9), M.woodOld, { pos: [(hp0 + hp1) / 2, 1.46, 1.14], rot: [0, 0, Math.PI / 2], name: 'hoshi-pole-upper' }));
  hoshi.add(mesh(cyl(0.014, 0.014, rq(poleLen - 0.3), 9), M.alu, { pos: [(hp0 + hp1) / 2, 1.11, 1.14], rot: [0, 0, Math.PI / 2], name: 'hoshi-pole-lower' }));
  hoshi.add(noOut(mesh(cyl(0.019, 0.019, 0.05, 8), M.rubberMat, { pos: [hp0 + 0.1, 1.46, 1.14], rot: [0, 0, Math.PI / 2], cast: false, name: 'hoshi-grip' })));
  // タオル 1 枚（生地・端がずり落ち気味）＋ 洗濯バサミ
  const towel = grp('towel', { pos: [-1.3, 1.46, 1.14], rotY: 0.05 });
  hoshi.add(towel);
  towel.add(mesh(box(0.30, 0.46, 0.010), M.towel, { pos: [0, -0.21, 0.012], rot: [0.06, 0, 0.03], name: 'towel-body' }));
  towel.add(mesh(box(0.30, 0.02, 0.028), M.towel, { pos: [0, -6e-3, 0.002], name: 'towel-fold' }));
  for (let i = 0; i < 5; i++) {
    const px = hp0 + 0.28 + i * 0.40 + range(rnd, -0.03, 0.03);
    if (px > hp1 - 0.05) continue;
    const pin = grp('clothespin', { pos: [px, 1.478, 1.14], rotY: range(rnd, -0.3, 0.3) });
    hoshi.add(pin);
    for (const s of [-1, 1]) {
      pin.add(mesh(box(0.014, 0.05, 0.006), M.woodOld, { pos: [s * 0.005, 0.024, 0], rot: [0, 0, -s * 0.13], name: 'pin-wood' }));
    }
    pin.add(mesh(cyl(0.0035, 0.0035, 0.016, 6), M.alu, { pos: [0, 0.034, 0], rot: [0, Math.PI / 2, 0], name: 'pin-spring' }));
    if (i === 2) { pin.rotation.z = 0.5; pin.position.y = 1.44; }
  }
  // 竿受けの予備・紐
  hoshi.add(noOut(mesh(cyl(0.002, 0.002, 0.5, 4), M.rope, { pos: [hp1 + 0.02, 1.20, 1.14], rot: [0, 0, 0.3], cast: false, name: 'hoshi-string' })));
  weather(hoshi, { w: 0.1, h: 0.4, pos: [hp0, 0.24, 1.16], kind: 'rust', color: '#7d4a2c', opacity: 0.44, seed: seed + 83, density: 1.7, spread: 0.03 });

  /* ================= 10. 植木鉢の列 ================= */
  const pots = grp('pots');
  body.add(pots);
  const potKinds = ['terracotta', 'glaze', 'empty', 'plastic', 'broken', 'conifer'];
  for (let i = 0; i < 6; i++) {
    const x = -L / 2 + 0.30 + i * 0.42 + range(rnd, -0.03, 0.05);
    const z = Z_BND - 0.24 + range(rnd, -0.04, 0.04);
    const p = plantPot(M, { x, z, r: range(rnd, 0.10, 0.155), h: range(rnd, 0.15, 0.23), kind: potKinds[i], seed: seed + 90 + i });
    p.rotation.y = range(rnd, -0.5, 0.5);
    pots.add(p);
  }
  // ジョウロ（倒れたもの）
  const kann = grp('kann', { pos: [-L / 2 + 2.9, 0.09, Z_BND - 0.42], rot: [0, 0.7, Math.PI / 2 - 0.2] });
  pots.add(kann);
  kann.add(mesh(cyl(0.09, 0.10, 0.16, 12), M.galv, { name: 'kann-body' }));
  kann.add(mesh(cyl(0.02, 0.03, 0.20, 8), M.galv, { pos: [0.12, 0.05, 0], rot: [0, 0, -0.9], name: 'kann-spout' }));
  kann.add(mesh(tor(0.06, 0.008, 5, 12), M.galv, { pos: [-0.05, 0.09, 0], rot: [0, Math.PI / 2, 0], name: 'kann-handle' }));

  /* ================= 11. 裏の側溝と蓋 ================= */
  const drain = grp('rear-drain');
  body.add(drain);
  const dLen = L + 0.7, dW = 0.30, dDepth = 0.26;
  drain.add(mesh(box(rq(dLen), 0.05, dW), M.base, { pos: [0, 0 , 0], name: 'drain-floor-placeholder' }));
  // ↑ プレースホルダではなく明示的に組み直す
  drain.children.length = 0;
  drain.add(mesh(box(rq(dLen), 0.05, dW), M.base, { pos: [0, 0.025, Z_DRN], cast: false, name: 'drain-floor' }));
  for (const s of [-1, 1]) {
    drain.add(mesh(box(rq(dLen), dDepth, 0.045), M.base, { pos: [0, dDepth / 2 + 0.05, Z_DRN + s * (dW / 2 - 0.02)], cast: false, name: 'drain-wall' }));
  }
  drain.add(noOut(mesh(box(rq(dLen - 0.04), dDepth - 0.06, dW - 0.10), M.drainVoid, { pos: [0, 0.05 + (dDepth - 0.06) / 2, Z_DRN], cast: false, receive: false, name: 'drain-void' })));
  const nCovers = Math.max(4, Math.round(dLen / 1.0));
  for (let i = 0; i < nCovers; i++) {
    const x = -dLen / 2 + (i + 0.5) * (dLen / nCovers);
    const tilt = i === 2 ? range(rnd, 0.04, 0.09) : range(rnd, -0.012, 0.012);
    const c = grp('drain-cover', { pos: [x, 0.29, Z_DRN], rot: [0, range(rnd, -0.01, 0.01), tilt] });
    drain.add(c);
    c.add(mesh(box(rq(dLen / nCovers - 0.04), 0.045, rq(dW - 0.02)), i === 2 ? M.concDark : M.paving, { name: 'cover-slab' }));
    for (let b = 0; b < 3; b++) c.add(noOut(mesh(box(rq(dLen / nCovers - 0.14), 0.008, 0.022), M.dark, { pos: [0, 0.024, -0.06 + b * 0.06], cast: false, name: 'cover-slot' })));
    if (i === 2) {
      c.add(mesh(box(0.06, 0.05, 0.05), M.dirt, { pos: [0.04, -0.02, 0.02], name: 'cover-fallen-chip' }));
    }
  }
  // 側溝内の落ち葉と詰まり
  for (let i = 0; i < 14; i++) {
    drain.add(noOut(mesh(rbox(range(rnd, 0.05, 0.10), 0.008, range(rnd, 0.04, 0.08), 0.01, 1), rnd() > 0.4 ? M.leafDead : M.leafA, {
      pos: [range(rnd, -dLen / 2 + 0.2, dLen / 2 - 0.2), range(rnd, 0.06, 0.12), Z_DRN + range(rnd, -0.09, 0.09)],
      rot: [range(rnd, -0.3, 0.3), range(rnd, 0, 3), range(rnd, -0.3, 0.3)], cast: false, name: 'drain-leaves',
    })));
  }
  weather(drain, { w: dLen * 0.8, h: 0.16, pos: [0, 0.12, Z_DRN - dW / 2 - 0.026], rot: [0, Math.PI, 0], kind: 'moss', color: '#63804e', opacity: 0.46, seed: seed + 95, density: 1.8, count: 2 });

  /* ================= 12. 裏壁まわり（隣地際の詰まり・苔・落書き除去その 2） ================= */
  const rear = grp('rear-face');
  body.add(rear);
  // 裏窓の面格子＋火の見ばし
  const rg = put(grp('rear-window-guard', { pos: [0.9, 1.77, Z_B - 0.006] }), rear);
  rg.add(noOut(grill(rg, { w: 0.56, h: 0.46, nx: 5, ny: 2, bar: 0.010, mat: M.iron, pos: [0, 0, -0.026] })));
  rear.add(mesh(box(0.62, 0.026, 0.10), M.flash, { pos: [0.9, 1.50, Z_B - 0.04], name: 'rear-sill' }));
  // 裏口（物置用の小さな金属建・壁面側）
  const rdoor = piercedWall(rear, {
    len: 0.62, thick: WT, y0: FND_TOP, y1: 1.90, mat: M.plasterShade,
    pos: [1.35, 0, Z_B - WT / 2], rotYdeg: 0, name: 'rear-door-pocket',
    opens: [{ c: 0, w: 0.58, y0: FND_TOP, y1: 1.90 }],
  });
  rdoor.add(mesh(box(0.58, 1.56, 0.02), M.corrOld, { pos: [0, FND_TOP + 0.80, -0.03], name: 'rear-boarded-up' }));
  for (let i = 0; i < 3; i++) rdoor.add(mesh(box(0.60, 0.03, 0.014), M.woodOld, { pos: [0, FND_TOP + 0.28 + i * 0.6, -0.044], rot: [0, 0, i === 1 ? 0.05 : 0], name: 'boarding-batten' }));
  for (const s of [-1, 1]) rdoor.add(mesh(cyl(0.006, 0.006, 0.02, 6), M.rust, { pos: [s * 0.24, FND_TOP + 0.9, -0.05], rot: [Math.PI / 2, 0, 0], name: 'boarding-nail' }));
  // 雨だれ・苔・泥はね（壁 3 か所）
  weather(rear, { w: L * 0.7, h: 0.26, pos: [0, 0.16, Z_B - 0.075], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 97, density: 1.9, count: 3, spread: 0.04 });
  weather(rear, { w: 1.1, h: 0.9, pos: [-1.4, 1.30, Z_B - 0.075], rot: [0, Math.PI, 0], kind: 'dirt', color: '#57503f', opacity: 0.34, seed: seed + 99, density: 1.5, count: 2, spread: 0.06 });
  weather(wallE, { w: sideLen * 0.8, h: 0.3, pos: [0, 0.2, WT / 2 + 0.076], kind: 'dirt', color: '#5b5045', opacity: 0.3, seed: seed + 101, density: 1.6 });
  // 壁の落書き除去（東妻の塗り残し）
  const gr2 = grp('graffiti-removal-2', { pos: [L / 2 + 0.008, 1.28, -0.9] });
  body.add(gr2);
  gr2.add(mesh(rbox(0.010, 0.62, 0.78, 0.005, 2), MAT.concrete({ base: '#e2dbc8', repeat: 1, sat: 0.84, tint: '#f8f2e4' }), { name: 'patch-2' }));
  decal(gr2, { map: TEX.wear({ kind: 'scratch', color: '#7a5a86', seed: seed + 103, density: 1.2 }), w: 0.5, h: 0.4, pos: [0.008, 0.06, -0.1], rot: [0, Math.PI / 2, 0], opacity: 0.24 });
  gr2.add(noOut(mesh(box(0.008, 0.02, 0.6), MAT.paint('#cec5ae', { steps: 2 }), { pos: [0.006, -0.3, 0], cast: false, name: 'roller-edge' })));

  /* ================= 13. 落ち葉・苔・堆積 ================= */
  const litter = grp('litter');
  body.add(litter);
  const leafGeo = plane(0.075, 0.05, 1, 1).clone();
  leafGeo.translate(0, 0.004, 0);
  litter.add(inst(leafGeo, M.leafDead, 46, (i, d, r, col) => {
    d.position.set(range(r, -L / 2 - 0.2, L / 2 + 0.2), 0.038 + r() * 0.02, range(r, Z_BND - 0.2, Z_DRN + 0.28));
    d.rotation.set(r() * 0.4 - 0.2, r() * 6.283, r() * 0.4 - 0.2);
    const s = 0.7 + r() * 0.9; d.scale.set(s, s, s);
    const k = 0.78 + r() * 0.42; col.setRGB(k, k * (0.9 + r() * 0.15), k * 0.8);
  }, { name: 'fallen-leaves', cast: false, receive: true }));
  litter.add(inst(sakuraPetalRestGeo(0.026), MAT.petal({ tone: 1 }), 34, (i, d, r, col) => {
    d.position.set(range(r, -L / 2 - 0.1, L / 2 + 0.3), 0.042 + r() * 0.01, range(r, Z_BND - 0.1, 0.3));
    d.rotation.set((r() - 0.5) * 0.22, r() * 6.283, (r() - 0.5) * 0.24);
    const s = 0.8 + r() * 0.6; d.scale.set(s, s, s);
    const k = r(); col.setHSL(0.93 + k * 0.035, 0.40 + k * 0.2, 0.60 + k * 0.22);
  }, { name: 'fallen-petals', cast: false, receive: true }));
  // 角の土こぼれ・小石・砕石
  for (let i = 0; i < 26; i++) {
    const near = i % 3;
    litter.add(noOut(mesh(rbox(range(rnd, 0.02, 0.055), 0.016, range(rnd, 0.02, 0.05), 0.008, 1), near === 0 ? M.gravel : M.soil, {
      pos: [range(rnd, -L / 2, L / 2), 0.032, near === 0 ? Z_BND - 0.16 : range(rnd, Z_DRN + 0.1, Z_B - 0.05)],
      rot: [0, range(rnd, 0, 3), 0], cast: false, name: 'spill',
    })));
  }
  // 物置と塀の間の隙間の苔
  weather(body, { w: 1.2, h: 0.4, pos: [0.95, 0.045, 1.0], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#6b8450', opacity: 0.4, seed: seed + 107, density: 1.6, count: 2 });
  weather(body, { w: L * 0.9, h: 0.18, pos: [0, 0.042, (Z_F + 0.16) / 2 + 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.26, seed: seed + 109, density: 1.3 });

  /* ================= 14. 全体仕上げ ================= */
  // 壁面上部の色褪せ（南向きだけ新しく、上は退色）
  decal(wallF, { map: TEX.gradient({ stops: [[0, 'rgba(250,245,232,1)'], [0.55, 'rgba(228,220,202,0.35)'], [1, 'rgba(206,197,178,0)']] }), w: L, h: 1.6, pos: [0.4, 1.5, WT / 2 + 0.004], opacity: 0.32 });
  // 電線引き込み（軒先から勝手口上の受口へ・たるみ）
  const dropPts = [[L / 2 + 0.30, 2.30, 1.20], [L / 2 - 0.4, 2.10, 0.90], [0.9, 1.98, 0.50], [0.34, 1.86, 0.42]];
  for (let i = 0; i < dropPts.length - 1; i++) {
    const a = dropPts[i], b = dropPts[i + 1];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    body.add(noOut(mesh(cyl(0.008, 0.008, rq(segLen * 1.06), 6), M.rubberMat, {
      pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.05, (a[2] + b[2]) / 2],
      rot: [0, Math.atan2(b[0] - a[0], b[2] - a[2]), Math.atan(Math.hypot(b[0] - a[0], b[2] - a[2]) / (b[1] - a[1])) + Math.PI / 2 * 0],
      cast: false, name: 'service-drop',
    })));
  }
  body.add(mesh(box(0.10, 0.12, 0.06), M.aluDark, { pos: [0.34, 1.80, Z_F - 0.02], name: 'service-head' }));

  return finish(g, { outline: 'normal', minSize: 0.06 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
