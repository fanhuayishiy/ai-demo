import { g as grp, m as mesh, b as box, q as finish, M as MAT, D as DoubleSide, T as TEX, P as PAL, n as range, r as rbox, w as weather, i as grill, A as row, c as cyl, H as plane, E as inst, h as decal, t as tor, z as rand, L as TubeGeometry, C as CatmullRomCurve3, V as Vector3, v as Mesh, N as makeCanvas, O as jpText, Q as toTexture } from './index-2XMcV6P5.js';

//  assets/buildings/fence-set.js —— 敷地境界の塀・フェンス・門（4 工种 = 1 ファイル 1 接口、kind で切替）
//  kind='block'   : 打設 RC 布基礎 + 組積 100 コンクリートブロック塀（1 丁每個独立メッシュ / 上段の空洞孔 /
//                   型板透かし / 控え柱 + 天端水切金物 / 白華・苔・欠け・傾き / 内側の塩ビ管と斜撑）
//  kind='plaster' : 乱積自然石の根巻 + 左官（漆喰）塀 + 袖瓦笠 + 銅版巻 + 補修跡（網地露出） + 裏面の金網増設
//  kind='mesh'    : 既製コンクリート根巻 + アルミ角柱 + 一番付きメッシュパネル + 千切れ・針金補修・よれよれ日除フィルム
//  kind='gate'    : 門柱 2（表札・インターホン・郵便受） + 片開きアルミ扉（縦格子・錠前・丁番・戸当り） + 敷居の砂利
//  単位 m / 原点 = 接地面中心 / +Y 上 / 正面（表側）+Z / 長さ方向 X。装配側は rotY で向きだけ決める。
//  ※ 全面・底面・裏面まで実体。紙壁（1 枚板で両面を済ませる）は作らない。

const meta = {
  id: 'fence-set',
  real: [3.6, 1.38, 0.30],       // kind='block' / len 3.6 のとき
  origin: 'ground-center',
};

const DEFAULT_OPTIONS = { kind: 'block', len: 3.6, h: null, seed: 811 };

const KIND_H = { block: 1.20, plaster: 1.52, mesh: 1.40, gate: 1.55 };
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const noOut = (o) => { o.userData.noOutline = true; return o; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------------------------------------------------------------- 素材 ---- */
function materials(seed) {
  return {
    blockFace: MAT.concrete({ base: '#c9c4b7', repeat: 1, joints: 0, sat: 0.86, tint: '#eee7d6' }),
    blockDark: MAT.concrete({ base: '#aca698', repeat: 1, sat: 0.82 }),
    footing: MAT.concrete({ base: '#a29c8f', repeat: 1, joints: 2, cracked: true }),
    mortar: MAT.concrete({ base: '#b6b0a2', repeat: 1, cracked: true, sat: 0.85 }),
    plaster: MAT.concrete({ base: PAL.wallPlaster, repeat: 1, cracked: true, sat: 0.88, tint: '#fbf5e6' }),
    plasterPatch: MAT.concrete({ base: '#f0e9d6', repeat: 1, sat: 0.78 }),
    stoneA: MAT.stone({ color: '#a8a094', repeat: 1 }),
    stoneB: MAT.stone({ color: '#8f8a7c', repeat: 1 }),
    stoneC: MAT.stone({ color: '#b8b0a0', repeat: 1 }),
    alu: MAT.metal('#c3c8cc', { worn: 0.34, repeat: 1, spec: 0.62 }),
    aluDark: MAT.metal('#8f959a', { worn: 0.58, repeat: 1 }),
    galv: MAT.galvanized({ worn: 0.72 }),
    iron: MAT.darkIron({ worn: 0.7, spec: 0.36 }),
    rust: MAT.metal('#7d5340', { worn: 0.95, spec: 0.18 }),
    copper: MAT.metal('#7f9a88', { worn: 0.55, repeat: 1, spec: 0.5 }),   // 銅板の緑青
    tileCap: MAT.roofTile({ base: '#63636c', repeat: 1 }),
    woodOld: MAT.wood({ light: PAL.woodWeathered, dark: '#6a5c47', repeat: 1, uv: { repeat: [1.2, 1.4] } }),
    pvc: MAT.plastic('#d7d9d2', { spec: 0.42 }),
    void: MAT.paint('#1b1d1a', { steps: 2, shadowAmt: 1, spec: 0.02 }),
    dirt: MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 1 }).map, spec: 0.03, shadowAmt: 0.97 }),
    gravel: MAT.ballast({ repeat: 2 }),
    grassPatch: MAT.grass({ base: PAL.moss, repeat: 2, sat: 0.92 }),
    leafWeed: MAT.leaf({ color: '#77995a', rim: 0.24 }),
    leafWeedB: MAT.leaf({ color: PAL.leafYoung, tint: '#f2ead4' }),
    meshFabric: MAT.paint('#4b5250', { map: TEX.metal({ base: '#4b5250', worn: 0.2, repeat: 14 }).map, side: DoubleSide, spec: 0.12 }),
    shadeFilm: MAT.plastic('#a8b7ab', { spec: 0.2, transparent: true, opacity: 0.66, side: DoubleSide }),
    paperWhite: MAT.paper({ color: '#f2ecdd' }),
    plate: MAT.metal('#d9d5cb', { worn: 0.3, spec: 0.5 }),
    plateDark: MAT.metal('#5d6165', { worn: 0.42, spec: 0.45 }),
    marking: MAT.marking('#ded8c6', { repeat: 1, sat: 0.7, opacity: 0.92, transparent: true }),
    bag: MAT.plastic('#e6e2d6', { spec: 0.5, transparent: true, opacity: 0.86, side: DoubleSide }),
    ...{ seed },
  };
}

/* 際雑草（塀の根元・両面）: 1 本ずつ向きと高さの違う葉カード */
function edgeWeeds(parent, M, { x0, x1, z, seed, n = 26, y = 0, h = 0.13 }) {
  const rnd = rand(seed);
  const geo = plane(0.035, 1, 1, 1).clone();
  geo.translate(0, 0.5, 0);
  parent.add(inst(geo, rnd() > 0.5 ? M.leafWeed : M.leafWeedB, n, (i, d, r, col) => {
    const hh = h * (0.5 + r() * 1.15);
    d.position.set(range(r, x0, x1), y + 0.004, z + range(r, -0.05, 0.05));
    d.rotation.set(range(r, -0.22, 0.22), r() * 6.283, range(r, -0.3, 0.3));
    d.scale.set(0.7 + r() * 0.7, hh, 0.7 + r() * 0.7);
    const k = 0.74 + r() * 0.5; col.setRGB(k, k * (0.95 + r() * 0.12), k * 0.82);
  }, { name: 'weed-blade', cast: false, receive: true }));
  // 根元の土・剥がれ
  parent.add(noOut(mesh(box(rq(x1 - x0), 0.018, 0.14), M.dirt, { pos: [(x0 + x1) / 2, y + 0.009, z], cast: false, name: 'weed-soil' })));
}

/* 天端水切り金物（落水面 + 竪目地のかぶせ） */
function capFlash(parent, M, { len, x, y, w = 0.20, t = 0.026, mat }) {
  const g = grp('cap-flash', { pos: [x, y, 0] });
  parent.add(g);
  g.add(mesh(box(rq(len), t, rq(w)), mat || M.aluDark, { name: 'cap-plate' }));
  for (const s of [-1, 1]) {
    g.add(mesh(box(rq(len), rq(t * 2.2), 0.012), mat || M.aluDark, { pos: [0, -t * 0.9, s * (w / 2 - 0.006)], name: 'cap-drip' }));
  }
  g.add(noOut(mesh(box(rq(len - 0.02), 0.006, rq(w - 0.05)), M.void, { pos: [0, -t * 1.7, 0], cast: false, name: 'cap-shadow' })));
  return g;
}

/* ============================================================ kind: block */
function buildBlock(g, M, { L, H, seed }) {
  const rnd = rand(seed + 1);
  const body = grp('block-wall');
  g.add(body);
  const T = 0.10;                        // ブロック壁厚
  const FND_H = 0.16, FND_W = T + 0.14;
  const BH = 0.19, JOINT = 0.010;
  const BW = 0.39;
  const courses = Math.max(3, Math.round((H - FND_H - 0.06) / (BH + JOINT)));

  /* 布基礎（打継・泥はね・型枠ずれ） */
  body.add(mesh(box(rq(L + 0.12), FND_H, rq(FND_W)), M.footing, { pos: [0, FND_H / 2, 0], name: 'rc-footing' }));
  for (let i = 1; i < 4; i++) {
    body.add(noOut(mesh(box(0.014, FND_H - 0.03, rq(FND_W + 0.004)), M.blockDark, { pos: [-L / 2 + (i / 4) * L, FND_H / 2, 0], cast: false, name: 'pour-joint' })));
  }
  body.add(mesh(box(rq(L + 0.16), 0.028, rq(FND_W + 0.06)), M.blockDark, { pos: [0, FND_H + 0.014, 0], name: 'sill-mortar' }));
  weather(body, { w: L * 0.9, h: 0.10, pos: [0, 0.055, FND_W / 2 + 0.004], kind: 'dirt', color: '#6b6152', opacity: 0.42, seed: seed + 3, density: 1.7, count: 3, spread: 0.05 });

  /* 控え柱（両端 + 1.8 m 每） */
  const nPost = clamp(Math.round(L / 1.8) + 1, 2, 5);
  const posts = [];
  for (let i = 0; i < nPost; i++) {
    const x = -L / 2 + (i / (nPost - 1)) * L;
    posts.push(x);
    const ph = FND_H + courses * (BH + JOINT) + 0.05;
    const pg = grp('rc-column', { pos: [x, 0, 0] });
    body.add(pg);
    pg.add(mesh(box(0.17, rq(ph), rq(T + 0.10)), M.blockFace, { pos: [0, ph / 2, 0], name: 'column' }));
    pg.add(mesh(box(0.20, 0.030, rq(T + 0.14)), M.mortar, { pos: [0, ph + 0.015, 0], name: 'column-head' }));
    // 柱の端部で鉄筋が見切り出ている（実物の欠損）
    if (i === nPost - 1) {
      for (let k = 0; k < 3; k++) pg.add(mesh(cyl(0.005, 0.005, 0.075, 6), M.rust, { pos: [0.02, ph + 0.055, -0.035 + k * 0.035], rot: [0.1, 0, range(rnd, -0.12, 0.12)], name: 'rebar-cut' }));
    }
    capFlash(pg, M, { len: 0.22, x: 0, y: ph + 0.038, w: 0.24, t: 0.016, mat: M.galv });
    weather(pg, { w: 0.13, h: 0.5, pos: [0, 0.42, (T + 0.10) / 2 + 0.004], kind: 'moss', color: '#63804e', opacity: 0.42, seed: seed + 5 + i, density: 1.8, count: 2, spread: 0.06 });
    weather(pg, { w: 0.12, h: 0.42, pos: [0, 0.6, -0.2 / 2 - 0.004], rot: [0, Math.PI, 0], kind: 'dirt', color: '#5f584c', opacity: 0.3, seed: seed + 7 + i, density: 1.5 });
  }

  /* ブロック積（1 丁ずつ独立メッシュ・半丁ずらし） */
  const y0 = FND_H + 0.028;
  let holeIdx = new Set([Math.floor(courses * 0.55)]);   // 透かしに交換する段
  for (let c = 0; c < courses; c++) {
    const y = y0 + c * (BH + JOINT) + BH / 2;
    const offset = c % 2 ? BW / 2 : 0;
    const n = Math.floor((L - 0.36) / (BW + 0.012));
    const start = -(n * (BW + 0.012)) / 2 + BW / 2 + offset * 0;
    const through = holeIdx.has(c);
    for (let i = 0; i < n; i++) {
      const x = start + i * (BW + 0.012) + 0.006;
      // 柱の位置はスキップ
      if (posts.some((p) => Math.abs(p - x) < 0.14)) continue;
      const isHole = through && i % 3 === 1;
      const lean = i === n - 2 && c === courses - 1 ? 0.022 : 0;
      const bg = grp(isHole ? 'block-louver' : 'concrete-block', { pos: [x, y, 0], rot: [0, 0, lean] });
      body.add(bg);
      if (isHole) {
        // 型板透かし（上下左右の框 + 中空）
        const fw = BW, fh = BH;
        for (const [dx, dy, bw, bh] of [[0, fh / 2 - 0.022, fw, 0.044], [0, -fh / 2 + 0.022, fw, 0.044], [-fw / 2 + 0.022, 0, 0.044, fh], [fw / 2 - 0.022, 0, 0.044, fh]]) {
          bg.add(mesh(box(rq(bw), rq(bh), T), M.blockFace, { pos: [dx, dy, 0], name: 'louver-frame' }));
        }
        bg.add(mesh(box(0.10, 0.026, 0.010), M.galv, { pos: [0, 0.03, 0], name: 'louver-bar' }));
        bg.add(noOut(mesh(box(fw - 0.09, fh - 0.09, 0.006), M.void, { pos: [0, 0, -T / 2 + 0.004], cast: false, receive: false, name: 'louver-void' })));
      } else {
        bg.add(mesh(rbox(BW, BH, T, 0.004, 1), M.blockFace, { name: 'block' }));
        // 空洞孔（上段だけ上面に開く・中は暗い）
        if (c === courses - 1) {
          for (const s of [-1, 1]) {
            bg.add(noOut(mesh(cyl(0.026, 0.026, 0.09, 9), M.void, { pos: [s * BW * 0.24, BH / 2 - 0.03, 0], cast: false, name: 'core-hole' })));
            bg.add(noOut(mesh(tor(0.028, 0.005, 4, 10), M.blockDark, { pos: [s * BW * 0.24, BH / 2 + 0.001, 0], rot: [Math.PI / 2, 0, 0], cast: false, name: 'core-rim' })));
          }
        }
        // 1 丁だけ欠け・1 丁だけ打ち替え（色違い）
        if (i === 2 && c === 1) {
          bg.add(mesh(rbox(0.10, 0.075, T + 0.004, 0.02, 2), M.blockDark, { pos: [BW * 0.2, -BH * 0.24, 0], rot: [0, 0, 0.4], name: 'block-chip' }));
          bg.add(noOut(mesh(box(0.13, 0.10, 0.004), M.void, { pos: [BW * 0.2, -BH * 0.24, T / 2 + 0.002], cast: false, name: 'chip-shadow' })));
        }
        if (i === n - 1 && c === 2) bg.material = M.blockDark;
      }
    }
    // 目地モルタル（縦目地の影）
    for (let i = 0; i <= n; i++) {
      const x = start - BW / 2 + i * (BW + 0.012);
      if (posts.some((p) => Math.abs(p - x) < 0.10)) continue;
      body.add(noOut(mesh(box(0.010, BH, T + 0.006), M.mortar, { pos: [x, y, 0], cast: false, name: 'mortar-joint' })));
    }
  }

  /* 天端キャップ（かぶせ金物 + 落水面） */
  const topY = y0 + courses * (BH + JOINT) - JOINT;
  body.add(mesh(box(rq(L - 0.02), 0.048, rq(T + 0.06)), M.mortar, { pos: [0, topY + 0.024, 0], name: 'coppe' }));
  capFlash(body, M, { len: L, x: 0, y: topY + 0.058, w: T + 0.13, t: 0.018, mat: M.galv });
  // 一部の水切が浮いて捲れ返っている
  const lift = grp('cap-lifted', { pos: [L * 0.24, topY + 0.062, 0], rot: [0, 0, -0.1] });
  body.add(lift);
  lift.add(mesh(box(0.34, 0.014, rq(T + 0.12)), M.galv, { name: 'cap-peeled' }));
  lift.add(mesh(box(0.03, 0.05, 0.03), M.rust, { pos: [-0.14, -0.03, 0], name: 'cap-loose-bracket' }));

  /* 経年：白華（炭酸カルシウムの白筋）・苔・汚・塗料の落書き除去 */
  for (let i = 0; i < 5; i++) {
    const x = range(rnd, -L / 2 + 0.2, L / 2 - 0.2);
    body.add(noOut(decal(body, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,252,0.95)'], [0.4, 'rgba(246,244,238,0.4)'], [1, 'rgba(240,238,232,0)']] }), w: 0.09, h: range(rnd, 0.24, 0.62), pos: [x, range(rnd, 0.42, 0.92), T / 2 + 0.006], opacity: 0.36 })));
  }
  weather(body, { w: L * 0.95, h: 0.26, pos: [0, 0.24, T / 2 + 0.005], kind: 'moss', color: PAL.moss, opacity: 0.44, seed: seed + 9, density: 1.9, count: 3, spread: 0.06 });
  weather(body, { w: L * 0.8, h: 0.22, pos: [0, 0.22, -T / 2 - 0.005], rot: [0, Math.PI, 0], kind: 'moss', color: '#63804e', opacity: 0.46, seed: seed + 11, density: 1.8, count: 2 });
  weather(body, { w: 0.5, h: 0.62, pos: [-L * 0.28, 0.72, T / 2 + 0.007], kind: 'chip', color: '#b4ab98', opacity: 0.34, seed: seed + 13, density: 1.5, count: 2 });

  /* 内側（-Z）の実体：塩ビ管 2 本作り付け + 斜撑 + 注意札 */
  const side = grp('rear-fittings');
  body.add(side);
  for (let i = 0; i < 2; i++) {
    const x = -L * 0.22 + i * 0.09;
    side.add(mesh(cyl(0.022, 0.022, rq(topY - 0.1), 10), M.pvc, { pos: [x, (topY - 0.1) / 2, -0.08], name: 'pvc-riser' }));
    side.add(mesh(box(0.06, 0.024, 0.05), M.iron, { pos: [x, topY * 0.62, -0.062], name: 'pipe-saddle' }));
    side.add(noOut(mesh(cyl(0.019, 0.019, 0.02, 9), M.void, { pos: [x, topY - 0.1, -0.08], cast: false, name: 'pipe-mouth' })));
  }
  side.add(mesh(box(0.044, rq(topY * 1.16), 0.044), M.woodOld, { pos: [L * 0.18, topY * 0.56, -0.15000000000000002], rot: [0.14, 0, 0.09], name: 'shore-brace' }));
  side.add(mesh(box(0.20, 0.036, 0.044), M.woodOld, { pos: [L * 0.18, 0.02, -0.21000000000000002], name: 'shore-foot' }));
  const tag = grp('warning-tag', { pos: [-L * 0.05, topY * 0.78, -0.10500000000000001] });
  side.add(tag);
  tag.add(mesh(box(0.15, 0.10, 0.006), M.plate, { name: 'tag-plate' }));
  tag.add(noOut(mesh(box(0.13, 0.07, 0.004), MAT.poster({ color: '#efe7d3', repeat: 1 }), { pos: [0, 0, 0.005], cast: false, name: 'tag-face' })));
  tag.add(mesh(cyl(0.006, 0.006, 0.01, 6), M.iron, { pos: [0, 0.044, 0.004], rot: [Math.PI / 2, 0, 0], name: 'tag-nail' }));
  weather(tag, { w: 0.14, h: 0.08, pos: [0.01, -0.02, 0.008], kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + 15, density: 1.6 });

  edgeWeeds(body, M, { x0: -L / 2 + 0.05, x1: L / 2 - 0.05, z: T / 2 + 0.06, seed: seed + 17, n: 22 });
  edgeWeeds(body, M, { x0: -L / 2 + 0.05, x1: L / 2 - 0.05, z: -0.11, seed: seed + 19, n: 16 });
  return { topY };
}

/* ========================================================== kind: plaster */
function buildPlaster(g, M, { L, H, seed }) {
  const rnd = rand(seed + 2);
  const body = grp('plaster-wall');
  g.add(body);
  const T = 0.16;
  const STONE_H = 0.42;

  /* 根巻の乱積自然石（1 石ずつ形状違い） */
  const n = Math.max(8, Math.round(L / 0.26));
  for (let i = 0; i < n; i++) {
    const w = range(rnd, 0.20, 0.33), h = range(rnd, 0.13, 0.22); range(rnd, 0.13, 0.20);
    const x = -L / 2 + (i + 0.5) * (L / n) + range(rnd, -0.02, 0.02);
    const row0 = i % 2 === 0;
    body.add(mesh(rbox(w, h, rq(T + 0.02), 0.035, 2), i % 3 === 0 ? M.stoneB : row0 ? M.stoneA : M.stoneC, {
      pos: [x, 0.05 + h / 2 + (row0 ? 0 : 0.10), range(rnd, -0.02, 0.02)],
      rot: [range(rnd, -0.06, 0.06), range(rnd, -0.16, 0.16), range(rnd, -0.05, 0.05)], name: 'rubble',
    }));
  }
  body.add(mesh(box(rq(L), 0.05, rq(T + 0.05)), M.mortar, { pos: [0, STONE_H + 0.02, 0], name: 'base-course-crown' }));
  weather(body, { w: L * 0.9, h: 0.2, pos: [0, 0.14, T / 2 + 0.03], kind: 'dirt', color: '#6b6152', opacity: 0.4, seed: seed + 21, density: 1.7, count: 3, spread: 0.06 });
  weather(body, { w: L * 0.7, h: 0.18, pos: [-L * 0.2, 0.12, -0.11], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.44, seed: seed + 23, density: 1.8 });

  /* 左官本体（両面仕上げ・厚みあり） */
  const wallTop = H;
  body.add(mesh(box(rq(L), rq(wallTop - STONE_H - 0.02), rq(T)), M.plaster, { pos: [0, (STONE_H + 0.02 + wallTop) / 2, 0], name: 'plaster-body' }));
  // 下地の木桟が透けて浮いた箇所（経年）＋ 亀甲クラック
  const reveal = grp('lath-reveal', { pos: [L * 0.16, STONE_H + 0.52, T / 2 + 0.002] });
  body.add(reveal);
  reveal.add(mesh(rbox(0.52, 0.30, 0.008, 0.004, 2), M.plasterPatch, { name: 'patch-fresh' }));
  noOut(grill(reveal, { w: 0.44, h: 0.24, nx: 9, ny: 6, bar: 0.0035, mat: M.metalMesh ?? M.aluDark, pos: [0.02, -0.01, 0.010] }));
  for (let i = 0; i < 3; i++) reveal.add(noOut(mesh(box(0.42, 0.010, 0.006), M.woodOld, { pos: [0, -0.08 + i * 0.08, 0.008], rot: [0, 0, i === 1 ? 0.02 : 0], cast: false, name: 'lath-batten' })));
  for (let i = 0; i < 4; i++) {
    body.add(noOut(mesh(box(0.005, range(rnd, 0.14, 0.42), 0.006), M.mortar, {
      pos: [range(rnd, -L / 2 + 0.2, L / 2 - 0.2), range(rnd, STONE_H + 0.25, wallTop - 0.2), T / 2 + 0.004],
      rot: [0, 0, range(rnd, -0.5, 0.5)], cast: false, name: 'plaster-crack',
    })));
  }
  // 雨だれ（上端から竪筋）
  weather(body, { w: L * 0.9, h: wallTop - STONE_H, pos: [0, (STONE_H + wallTop) / 2, T / 2 + 0.006], kind: 'dirt', color: '#8d8574', opacity: 0.22, seed: seed + 25, density: 1.4, count: 3, spread: 0.30 });

  /* 天端：袖瓦笠（丸瓦 1 列 + 平瓦 2 枚受け）+ 棟漆喰 */
  const capY = wallTop + 0.06;
  body.add(mesh(box(rq(L + 0.10), 0.05, rq(T + 0.10)), M.mortar, { pos: [0, wallTop + 0.025, 0], name: 'coping-mortar' }));
  const nK = Math.max(6, Math.round((L + 0.10) / 0.17));
  row(body, nK, (L + 0.10) / nK, (i, x) => mesh(cyl(0.030, 0.030, 0.15, 9), M.tileCap, {
    pos: [x, capY + 0.01, 0], rot: [0, 0, Math.PI / 2], name: 'cap-kawara',
  }), { x0: -(L + 0.10) / 2 + (L + 0.10) / nK / 2, z: 0, y: 0 });
  for (const s of [-1, 1]) {
    body.add(mesh(box(rq(L + 0.14), 0.028, 0.05), M.tileCap, { pos: [0, capY - 0.036, s * (T / 2 + 0.045)], rot: [0, 0, 0], name: 'cap-hira' }));
    body.add(mesh(box(rq(L + 0.14), 0.016, 0.014), M.copper, { pos: [0, capY - 0.058, s * (T / 2 + 0.062)], name: 'cap-drip' }));
  }
  // 銅版で巻いた柱（両端 + 中央）: 巻は 0.6 mm の板を 4 面
  for (const x of [-L / 2 + 0.06, L / 2 - 0.06, 0]) {
    const pillar = grp('plaster-pier', { pos: [x, 0, 0] });
    body.add(pillar);
    const ph = wallTop + 0.10;
    pillar.add(mesh(box(0.26, rq(ph - STONE_H), 0.26), M.plaster, { pos: [0, STONE_H + (ph - STONE_H) / 2, 0], name: 'pier' }));
    pillar.add(mesh(box(0.30, 0.045, 0.30), M.mortar, { pos: [0, ph + 0.022, 0], name: 'pier-cap' }));
    pillar.add(mesh(box(0.34, 0.02, 0.34), M.copper, { pos: [0, ph + 0.054, 0], name: 'pier-flash' }));
    for (const s of [-1, 1]) pillar.add(mesh(box(0.006, 0.34, 0.30), M.copper, { pos: [s * 0.131, STONE_H + 0.20, 0], name: 'pier-corner-flash' }));
    weather(pillar, { w: 0.2, h: 0.4, pos: [0, STONE_H + 0.3, 0.132], kind: 'moss', color: '#63804e', opacity: 0.44, seed: seed + 27 + Math.round(x * 10), density: 1.7, count: 2 });
    if (Math.abs(x) < 0.1) {
      // 中央の柱だけ天端が割けて下地が見える
      pillar.add(noOut(mesh(box(0.20, 0.012, 0.10), M.void, { pos: [0.02, ph + 0.046, 0], cast: false, name: 'pier-crack' })));
      pillar.add(mesh(cyl(0.006, 0.006, 0.06, 6), M.rust, { pos: [0.06, ph + 0.07, 0.02], rot: [0.2, 0, 0.3], name: 'pier-rebar' }));
    }
  }

  /* 裏面（-Z）：金網フェンスの後設増設（実物の「見える化」対策） */
  const retro = grp('retro-mesh', { pos: [0, 0, -0.13] });
  body.add(retro);
  const mh = wallTop - 0.30;
  retro.add(noOut(grill(retro, { w: L - 0.5, h: mh * 0.62, nx: Math.round((L - 0.5) / 0.07), ny: 8, bar: 0.004, mat: M.metalMesh ?? M.aluDark, pos: [0, STONE_H + mh * 0.66, 0] })));
  for (let i = 0; i < 4; i++) {
    const x = -L / 2 + 0.35 + i * (L - 0.7) / 3;
    retro.add(mesh(box(0.024, 0.024, 0.09), M.iron, { pos: [x, STONE_H + mh * 0.66, 0.045], name: 'retro-bracket' }));
    retro.add(mesh(box(0.024, 0.024, 0.09), M.iron, { pos: [x, STONE_H + mh * 1.02, 0.045], name: 'retro-bracket' }));
    retro.add(noOut(mesh(box(0.03, mh * 1.1, 0.02), M.aluDark, { pos: [x, STONE_H + mh * 0.55, 0.01], cast: false, name: 'retro-post' })));
  }
  // 裏の物干し金具・注意札・配管クリップ
  retro.add(mesh(box(0.05, 0.05, 0.10), M.aluDark, { pos: [-L * 0.2, STONE_H + 1.02, -0.05], name: 'hoop-stand-off' }));
  retro.add(mesh(cyl(0.014, 0.014, 0.20, 8), M.pvc, { pos: [L * 0.3, STONE_H + 0.7, -0.05], rot: [0, 0, Math.PI / 2], name: 'conduit' }));

  edgeWeeds(body, M, { x0: -L / 2 + 0.08, x1: L / 2 - 0.08, z: T / 2 + 0.07, seed: seed + 29, n: 24 });
  edgeWeeds(body, M, { x0: -L / 2 + 0.08, x1: L / 2 - 0.08, z: -0.15000000000000002, seed: seed + 31, n: 18 });
  return { capY };
}

/* ============================================================= kind: mesh */
function buildMesh(g, M, { L, H, seed }) {
  const rnd = rand(seed + 3);
  const body = grp('mesh-fence');
  g.add(body);
  const POST_H = H;
  const PANEL_TOP = H - 0.14, PANEL_BOT = 0.14;
  const nBay = clamp(Math.round(L / 1.6), 1, 4);
  const bayW = L / nBay;

  for (let i = 0; i <= nBay; i++) {
    const x = -L / 2 + i * bayW;
    const lean = i === 1 ? 0.030 : i === nBay ? -0.014 : 0;
    const pg = grp('fence-post', { pos: [x, 0, 0], rot: [0, 0, lean] });
    body.add(pg);
    // 既製コンクリート根巻
    const broken = i === 1;
    pg.add(mesh(rbox(0.34, 0.14, 0.34, 0.012, 2), broken ? M.blockDark : M.footing, { pos: [0, 0.07, 0], name: 'post-footing' }));
    if (broken) {
      pg.add(mesh(rbox(0.13, 0.055, 0.16, 0.01, 2), M.blockDark, { pos: [0.16, 0.03, 0.12], rot: [0, 0.5, 0.1], name: 'footing-chip' }));
      for (let k = 0; k < 2; k++) pg.add(mesh(cyl(0.007, 0.007, 0.075, 6), M.rust, { pos: [-0.05 + k * 0.1, 0.16, 0.05], rot: [0.16, 0, -0.2 + k * 0.4], name: 'anchor-exposed' }));
    }
    // アルミ角柱（4 面 + 巻）
    pg.add(mesh(box(0.062, rq(POST_H), 0.062), M.aluDark, { pos: [0, POST_H / 2, 0], name: 'post' }));
    for (const s of [-1, 1]) pg.add(noOut(mesh(box(0.066, rq(POST_H - 0.06), 0.006), M.alu, { pos: [0, POST_H / 2, s * 0.031], cast: false, name: 'post-face' })));
    pg.add(mesh(box(0.074, 0.020, 0.074), M.alu, { pos: [0, POST_H + 0.010, 0], name: 'post-cap' }));
    pg.add(noOut(mesh(cyl(0.020, 0.020, 0.008, 10), M.void, { pos: [0, POST_H + 0.021, 0], cast: false, name: 'post-plug' })));
    // 柱脚金物（基礎から浮いた柱はボルト 4 本が錆）
    pg.add(mesh(box(0.11, 0.016, 0.11), M.iron, { pos: [0, 0.148, 0], name: 'base-plate' }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      pg.add(mesh(cyl(0.0055, 0.0055, 0.026, 6), i === 1 ? M.rust : M.iron, { pos: [sx * 0.042, 0.168, sz * 0.042], name: 'anchor-bolt' }));
    }
    weather(pg, { w: 0.06, h: 0.4, pos: [0, 0.3, 0.036], kind: 'rust', color: PAL.rust, opacity: 0.34, seed: seed + 33 + i, density: 1.7, count: 2, spread: 0.05 });
  }

  for (let i = 0; i < nBay; i++) {
    const cx = -L / 2 + (i + 0.5) * bayW;
    const pw = bayW - 0.09;
    const tattered = i === nBay - 1;
    const panel = grp('mesh-panel', { pos: [cx, (PANEL_TOP + PANEL_BOT) / 2, 0], rot: [0, 0, i === 1 ? 0.02 : 0] });
    body.add(panel);
    const ph = PANEL_TOP - PANEL_BOT;
    // 框（上下一番 + 縦框）
    for (const [dx, dy, bw, bh] of [[0, ph / 2 - 0.014, pw, 0.028], [0, -ph / 2 + 0.014, pw, 0.028], [-pw / 2 + 0.014, 0, 0.028, ph], [pw / 2 - 0.014, 0, 0.028, ph]]) {
      panel.add(mesh(box(rq(bw), rq(bh), 0.030), M.alu, { pos: [dx, dy, 0], name: 'panel-frame' }));
    }
    // 縦リブ（中途半端な位置に残る後付けリブ）
    panel.add(mesh(box(0.020, ph - 0.05, 0.024), M.aluDark, { pos: [-pw * 0.16, 0, 0.006], name: 'panel-rib' }));
    // 網
    const nx = Math.max(8, Math.round(pw / 0.052));
    noOut(grill(panel, { w: pw - 0.05, h: ph - 0.06, nx, ny: Math.max(5, Math.round(ph / 0.075)), bar: 0.0035, mat: M.metalMesh ?? M.alu, pos: [0, 0, -2e-3] }));
    if (tattered) {
      // 千切れた区域：框の内側 1/3 が欠けて、残った線が垂れる
      panel.add(noOut(mesh(box(pw * 0.30, ph * 0.34, 0.004), M.void, { pos: [pw * 0.28, -ph * 0.24, -4e-3], cast: false, receive: false, name: 'mesh-hole' })));
      for (let k = 0; k < 4; k++) {
        panel.add(noOut(mesh(cyl(0.0022, 0.0022, range(rnd, 0.10, 0.24), 4), M.rust, {
          pos: [pw * 0.16 + k * 0.05, -ph * 0.14 + range(rnd, -0.03, 0.03), 0.012],
          rot: [range(rnd, -0.5, 0.5), 0, range(rnd, 0.8, 1.5)], cast: false, name: 'wire-dangling',
        })));
      }
      // 針金補修（3 箇所巻）
      for (let k = 0; k < 3; k++) panel.add(coilWrap(M.iron, { x: -pw * 0.18 + k * 0.11, y: ph * 0.18 - k * 0.08 }));
    }
    // 下部に絡んだゴミ袋（1 bay だけ）
    if (i === 0) {
      const bag = grp('snagged-bag', { pos: [pw * 0.24, PANEL_BOT + 0.10, 0.03], rot: [0.2, 0.4, 0.1] });
      panel.add(bag);
      bag.add(mesh(rbox(0.16, 0.13, 0.07, 0.04, 2), M.bag, { name: 'bag-body' }));
      bag.add(mesh(rbox(0.05, 0.10, 0.03, 0.02, 2), M.bag, { pos: [0.07, 0.06, 0.01], rot: [0, 0, 0.6], name: 'bag-handle' }));
      bag.add(mesh(rbox(0.045, 0.09, 0.028, 0.02, 2), M.bag, { pos: [-0.07, 0.055, -0.01], rot: [0, 0, -0.7], name: 'bag-handle-2' }));
      bag.add(noOut(mesh(box(0.07, 0.03, 0.004), MAT.poster({ color: '#c9d3c4', repeat: 1 }), { pos: [0.01, -0.01, 0.04], cast: false, name: 'bag-print' })));
    }
  }

  /* 上部に巻き付けたよれよれの日除フィルム（1 bay の半分だけ残る） */
  const film = grp('shade-film', { pos: [-L / 2 + bayW * 1.45, PANEL_TOP - 0.24, 0.036], rot: [0.04, 0, 0.03] });
  body.add(film);
  film.add(noOut(mesh(plane(bayW * 0.55, 0.46, 3, 2), M.shadeFilm, { cast: false, name: 'film-sheet' })));
  for (let k = 0; k < 4; k++) film.add(mesh(cyl(0.0022, 0.0022, 0.05, 4), M.iron, { pos: [-bayW * 0.22 + k * 0.14, 0.22, 0], rot: [Math.PI / 2, 0, 0], name: 'film-tie' }));
  film.add(noOut(mesh(box(0.34, 0.010, 0.008), M.aluDark, { pos: [0.04, -0.235, 0.006], cast: false, name: 'film-slit' })));

  /* 脚元の雑草・落ち葉堆积・土 */
  edgeWeeds(body, M, { x0: -L / 2 + 0.05, x1: L / 2 - 0.05, z: 0.09, seed: seed + 35, n: 30, h: 0.16 });
  edgeWeeds(body, M, { x0: -L / 2 + 0.05, x1: L / 2 - 0.05, z: -0.09, seed: seed + 37, n: 20 });
  const leafGeo = plane(0.07, 0.048, 1, 1).clone();
  leafGeo.translate(0, 0.004, 0);
  body.add(inst(leafGeo, M.leafWeed, 26, (i, d, r, col) => {
    d.position.set(range(r, -L / 2, L / 2), 0.012 + r() * 0.03, range(r, -0.16, 0.16));
    d.rotation.set(-Math.PI / 2 + r() * 0.5, r() * 6.283, r() * 0.6);
    const s = 0.7 + r() * 0.8; d.scale.set(s, s, s);
    const k = 0.8 + r() * 0.36; col.setRGB(k, k * 0.97, k * 0.86);
  }, { name: 'litter', cast: false, receive: true }));
  return { POST_H };
}

/** 針金補修（小さな 8 巻） */
function coilWrap(mat, { x = 0, y = 0, r = 0.020, turns = 6 }) {
  const pts = [];
  for (let i = 0; i <= turns * 8; i++) {
    const t = i / (turns * 8), a = t * turns * 6.283;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, t * 0.05 - 0.025]);
  }
  const geo = new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2]))), turns * 10, 0.0018, 5, false);
  const mm = new Mesh(geo, mat);
  mm.position.set(x, y, 0);
  mm.name = 'binding-wire';
  mm.userData.noOutline = true;
  return mm;
}

/* ============================================================== kind: gate */
function buildGate(g, M, { L, H, seed }) {
  const rnd = rand(seed + 4);
  const body = grp('gate');
  g.add(body);
  const postH = H, gap = L;
  for (const s of [-1, 1]) {
    const x = s * (gap / 2 + 0.14);
    const pg = grp('gate-post', { pos: [x, 0, 0] });
    body.add(pg);
    pg.add(mesh(rbox(0.26, 0.10, 0.30, 0.012, 2), M.footing, { pos: [0, 0.05, 0], name: 'post-footing' }));
    pg.add(mesh(box(0.22, rq(postH), 0.24), M.blockFace, { pos: [0, postH / 2 + 0.06, 0], name: 'post-body' }));
    for (const t of [-1, 1]) pg.add(noOut(mesh(box(0.006, rq(postH - 0.06), 0.20), M.mortar, { pos: [t * 0.112, postH / 2 + 0.06, 0], cast: false, name: 'post-edge' })));
    pg.add(mesh(box(0.28, 0.034, 0.30), M.mortar, { pos: [0, postH + 0.077, 0], name: 'post-cap' }));
    pg.add(mesh(box(0.31, 0.016, 0.33), M.copper, { pos: [0, postH + 0.102, 0], name: 'post-flash' }));
    // 門灯台（灯具は無い・配管口だけ残る＝球切れ撤去跡）
    pg.add(mesh(cyl(0.024, 0.024, 0.09, 10), M.aluDark, { pos: [0, postH + 0.15, 0], name: 'lamp-stub' }));
    pg.add(noOut(mesh(cyl(0.018, 0.018, 0.02, 9), M.void, { pos: [0, postH + 0.196, 0], cast: false, name: 'lamp-void' })));
    pg.add(mesh(cyl(0.006, 0.006, 0.05, 6), M.rust, { pos: [0.01, postH + 0.13, 0.03], rot: [0.3, 0, 0.2], name: 'lamp-bolt' }));
    weather(pg, { w: 0.2, h: 0.36, pos: [0, 0.26, 0.121], kind: 'moss', color: PAL.moss, opacity: 0.44, seed: seed + 39 + (s + 1) * 5, density: 1.8, count: 2 });
    weather(pg, { w: 0.18, h: 0.9, pos: [0, 0.8, -0.121], rot: [0, Math.PI, 0], kind: 'dirt', color: '#5f584c', opacity: 0.3, seed: seed + 41 + (s + 1) * 5, density: 1.5 });
  }

  /* 表札（東柱のみ・文字は tex） */
  const namePlate = grp('nameplate', { pos: [-(gap / 2 + 0.14), postH - 0.34, 0.126] });
  body.add(namePlate);
  const plateTex = makeNameplateTexture(seed);
  namePlate.add(mesh(rbox(0.24, 0.11, 0.016, 0.004, 2), M.plate, { name: 'plate-body' }));
  decal(namePlate, { map: plateTex, w: 0.215, h: 0.086, pos: [0, 0, 0.010], opacity: 0.95 });
  for (const s of [-1, 1]) namePlate.add(mesh(cyl(0.005, 0.005, 0.012, 6), M.iron, { pos: [s * 0.10, 0, 0.012], rot: [Math.PI / 2, 0, 0], name: 'standoff' }));
  weather(namePlate, { w: 0.22, h: 0.05, pos: [0, -0.045, 0.012], kind: 'rust', color: PAL.rust, opacity: 0.32, seed: seed + 43, density: 1.6 });

  /* インターホン子機 + 郵便受 */
  const inter = grp('intercom', { pos: [-(gap / 2 + 0.14), 1.16, 0.134] });
  body.add(inter);
  inter.add(mesh(rbox(0.09, 0.15, 0.028, 0.006, 2), M.plateDark, { name: 'intercom-case' }));
  inter.add(noOut(mesh(box(0.06, 0.03, 0.004), M.void, { pos: [0, 0.045, 0.016], cast: false, name: 'intercom-grille' })));
  inter.add(noOut(grill(inter, { w: 0.055, h: 0.026, nx: 6, ny: 1, bar: 0.0025, mat: M.iron, pos: [0, 0.045, 0.018] })));
  inter.add(mesh(cyl(0.014, 0.014, 0.03, 10), M.plate, { pos: [0, -0.02, 0.030], rot: [Math.PI / 2, 0, 0], name: 'button-ring' }));
  inter.add(mesh(cyl(0.010, 0.010, 0.008, 10), MAT.ledOff('#3d4348'), { pos: [0, -0.02, 0.045], rot: [Math.PI / 2, 0, 0], name: 'button' }));
  inter.add(mesh(box(0.07, 0.016, 0.006), M.paperWhite, { pos: [0, -0.062, 0.018], rot: [0.1, 0, range(rnd, -0.06, 0.06)], name: 'intercom-label' }));

  const post = grp('letterbox', { pos: [gap / 2 + 0.14, 1.02, 0.14] });
  body.add(post);
  post.add(mesh(rbox(0.24, 0.30, 0.16, 0.014, 2), M.aluDark, { name: 'box-body' }));
  post.add(mesh(box(0.20, 0.018, 0.02), M.void, { pos: [0, 0.10, 0.084], name: 'slot' }));
  post.add(mesh(box(0.22, 0.05, 0.02), M.alu, { pos: [0, 0.07, 0.086], rot: [0.34, 0, 0], name: 'slot-hood' }));
  post.add(mesh(box(0.13, 0.09, 0.008), M.plate, { pos: [0, -0.06, 0.083], name: 'box-plate' }));
  post.add(mesh(cyl(0.010, 0.010, 0.014, 8), M.rust, { pos: [0.075, -0.06, 0.089], rot: [Math.PI / 2, 0, 0], name: 'box-lock' }));
  // 中に溜まった郵便（はみ出し）
  post.add(noOut(mesh(box(0.16, 0.02, 0.11), M.paperWhite, { pos: [0, 0.03, 0.01], rot: [0, 0.06, 0], cast: false, name: 'mail-inside' })));
  weather(post, { w: 0.2, h: 0.1, pos: [0, 0.16, 0.086], kind: 'rust', color: '#7d4a2c', opacity: 0.4, seed: seed + 45, density: 1.7, count: 2 });

  /* 片開き扉（枠 + 縦格子 + 下パネル、3° 開いて隙間と暗がり） */
  const DW = gap - 0.03, DH = 1.18;
  const leaf = grp('gate-leaf', { pos: [-gap / 2 + 0.02, 0.16, 0], rotY: 3.2 });
  body.add(leaf);
  for (const [dx, dy, bw, bh] of [[DW / 2, DH - 0.016, DW, 0.032], [DW / 2, 0.016, DW, 0.032]]) {
    leaf.add(mesh(box(rq(bw), rq(bh), 0.036), M.alu, { pos: [dx, dy, 0], name: 'leaf-rail' }));
  }
  leaf.add(mesh(box(0.032, DH, 0.036), M.alu, { pos: [0.016, DH / 2, 0], name: 'leaf-stile-hinge' }));
  leaf.add(mesh(box(0.032, DH, 0.036), M.alu, { pos: [DW - 0.016, DH / 2, 0], name: 'leaf-stile-lock' }));
  // 中間の横補剛（片持ち気味に垂れた 1 本）
  leaf.add(mesh(box(DW - 0.06, 0.026, 0.028), M.aluDark, { pos: [DW / 2, DH * 0.62, 0], rot: [0, 0, -0.012], name: 'leaf-cross-rail' }));
  // 縦格子
  const nBars = Math.max(6, Math.round(DW / 0.075));
  for (let i = 0; i < nBars; i++) {
    const x = 0.045 + (i / (nBars - 1)) * (DW - 0.09);
    leaf.add(mesh(box(0.016, DH - 0.05, 0.016), M.alu, { pos: [x, DH / 2, 0], name: 'leaf-bar' }));
    if (i % 3 === 0) leaf.add(noOut(mesh(box(0.020, 0.010, 0.020), M.aluDark, { pos: [x, DH * 0.62, 0], cast: false, name: 'bar-crimp' })));
  }
  // 下部アルミパネル（目隠し）
  leaf.add(mesh(box(DW - 0.07, 0.30, 0.014), M.aluDark, { pos: [DW / 2, 0.17, 0], name: 'lower-panel' }));
  for (let i = 0; i < 4; i++) leaf.add(noOut(mesh(box(DW - 0.10, 0.006, 0.006), M.alu, { pos: [DW / 2, 0.075 + i * 0.075, 0.009], cast: false, name: 'panel-groove' })));
  // 丁番 2（片側はネジが無く針金で仮固定＝実物の応急修理）
  for (const dy of [0.26, DH - 0.22]) {
    const hg = grp('hinge', { pos: [0.004, dy, 0.016] });
    leaf.add(hg);
    hg.add(mesh(box(0.026, 0.09, 0.010), M.iron, { pos: [0.006, 0, -4e-3] }));
    hg.add(mesh(cyl(0.009, 0.009, 0.10, 8), M.iron, { pos: [0.020, 0, 0] }));
    hg.add(mesh(cyl(0.012, 0.012, 0.012, 8), M.iron, { pos: [0.020, 0.052, 0] }));
    if (dy < 0.5) {
      hg.add(mesh(cyl(0.0018, 0.0018, 0.10, 4), M.rust, { pos: [0.020, -0.02, 0.012], rot: [0.6, 0.2, 0], name: 'binding-wire' }));
    } else {
      weather(hg, { w: 0.05, h: 0.1, pos: [0.02, -0.06, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 47, density: 1.9 });
    }
  }
  // 錠前 + ハンドル + 戸車
  const lock = grp('gate-lock', { pos: [DW - 0.03, DH * 0.46, 0.026] });
  leaf.add(lock);
  lock.add(mesh(rbox(0.05, 0.15, 0.018, 0.005, 2), M.alu, { name: 'lock-rose' }));
  lock.add(mesh(cyl(0.012, 0.012, 0.044, 10), M.iron, { pos: [0.004, 0, 0.026], rot: [Math.PI / 2, 0, 0], name: 'handle-spindle' }));
  lock.add(mesh(box(0.09, 0.018, 0.016), M.alu, { pos: [0.040, 0, 0.044], rot: [0, 0.12, 0.04], name: 'handle-lever' }));
  lock.add(mesh(cyl(0.010, 0.010, 0.010, 10), MAT.metal('#a9a5a0', { repeat: 6 }), { pos: [0.004, -0.086, 0.030], rot: [Math.PI / 2, 0, 0], name: 'keyway' }));
  lock.add(mesh(box(0.006, 0.016, 0.005), M.void, { pos: [0.004, -0.086, 0.036] }));
  lock.add(mesh(box(0.04, 0.024, 0.010), M.iron, { pos: [0.02, 0.088, 0.006], name: 'dead-bolt' }));
  // 戸当り（柱側）+ ゴムキャップ
  const stop = grp('door-stop', { pos: [gap / 2 - 0.03, 0.20, 0.10] });
  body.add(stop);
  stop.add(mesh(box(0.03, 0.05, 0.09), M.iron, { name: 'stop-plate' }));
  stop.add(mesh(cyl(0.016, 0.016, 0.02, 10), M.rubber ?? MAT.rubber('#33352f'), { pos: [0, 0.0, 0.13], rot: [Math.PI / 2, 0, 0], name: 'stop-buffer' }));

  /* 敷居：門前の砂利 + 水勾配のすき間 + 段差 */
  const sill = grp('sill');
  body.add(sill);
  sill.add(mesh(box(rq(gap + 0.30), 0.03, 0.60), M.gravel, { pos: [0, 0.014, 0.26], cast: false, receive: true, name: 'gravel-apron' }));
  sill.add(mesh(box(rq(gap + 0.34), 0.05, 0.10), M.footing, { pos: [0, 0.024, -0.04], name: 'sill-beam' }));
  for (let i = 0; i < 5; i++) {
    sill.add(noOut(mesh(rbox(range(rnd, 0.05, 0.09), 0.02, range(rnd, 0.04, 0.07), 0.012, 1), M.stoneA, { pos: [range(rnd, -gap / 2, gap / 2), 0.03, range(rnd, 0.06, 0.34)], rot: [0, range(rnd, 0, 3), 0], cast: false, name: 'stepping-stone' })));
  }
  // 扉と地面の隙間から覗く暗がり（実物の建具隙間）
  body.add(noOut(mesh(box(rq(DW - 0.06), 0.026, 0.02), M.void, { pos: [0.02 + DW / 2, 0.148, 0], cast: false, receive: false, name: 'undercut-void' })));

  edgeWeeds(body, M, { x0: -gap / 2, x1: gap / 2, z: -0.16, seed: seed + 49, n: 16 });
  return { postH };
}

/* 表札テクスチャ（日本語姓・和書体風の掠れ） */
function makeNameplateTexture(seed) {
  const cv = makeCanvas(256, 96);
  if (!cv) return TEX.paper({ color: '#e8e2d2' }).map;
  const { g, w, h } = cv;
  const rnd = rand(seed + 71);
  g.fillStyle = '#efe9db'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(${120 + rnd() * 60 | 0},${110 + rnd() * 50 | 0},${95 + rnd() * 40 | 0},${0.03 + rnd() * 0.07})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  jpText(g, '藤 原', { x: w / 2, y: h * 0.52, size: 44, color: '#3b3630', weight: 600, spacing: 2 });
  g.strokeStyle = 'rgba(90,80,66,.45)'; g.lineWidth = 2;
  g.strokeRect(9, 9, w - 18, h - 18);
  // 掠れ・苔点
  for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,255,252,${0.12 + rnd() * 0.2})`; g.fillRect(rnd() * (w - 40), rnd() * h, 30 + rnd() * 40, 3); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(108,128,84,${0.05 + rnd() * 0.16})`; g.beginPath(); g.arc(rnd() * w, h * 0.72 + rnd() * h * 0.28, 1 + rnd() * 3, 0, 6.283); g.fill(); }
  return toTexture(cv, { repeat: 1, aniso: 8 });
}

/* ================================================================== build */
function build(options = {}) {
  const kind = options.kind || 'block';
  const seed = (options.seed ?? 811) | 0;
  const L = Math.max(0.9, options.len ?? 3.6);
  const H = Math.max(0.7, options.h ?? KIND_H[kind] ?? 1.20);
  const M = materials(seed);
  const g = grp('fence-' + kind);
  if (kind === 'plaster') buildPlaster(g, M, { L, H, seed });
  else if (kind === 'mesh') buildMesh(g, M, { L, H, seed });
  else if (kind === 'gate') buildGate(g, M, { L, H, seed });
  else buildBlock(g, M, { L, H, seed });
  // 接地面の裏（底）を塞ぐ：塀は地中なので土間で覆う
  g.add(noOut(mesh(box(rq(L + 0.30), 0.02, 0.42), M.dirt, { pos: [0, 0.004, 0], cast: false, receive: true, name: 'grade-strip' })));
  return finish(g, { outline: 'normal', minSize: 0.07 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
