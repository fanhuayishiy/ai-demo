import { g as grp, M as MAT, P as PAL, T as TEX, D as DoubleSide, m as mesh, b as box, A as row, w as weather, q as finish, n as range, i as grill, z as rand } from './index-BxWjt-aN.js';

//  assets/buildings/minka.js —— 日式民家（切妻妻入り・平屋 3.4×4.5 m）
//  構造：布モルタル基礎（打継・コケ）→ 厚み 155 mm の実外壁（開口は穴あけパネル分割＝紙壁なし）
//        → 下見板の妻壁（開口あり）→ 野地板＋瓦（棟瓦・鬼瓦・雪止め・割れ・コケ・樋詰まり）
//        → 破風・鼻隠し・雨樋・竪樋 → 建具（アルミサッシ/木枠・網戸・雨戸・ガラス・内側障子の組子）
//        → 引き違い玄関（段差框・三和土・下駄箱の気配・表札・郵便受け・インターホン）
//        → 軒下（照明・防犯カメラ風・干渉物）/ 物干し竿掛け / 室外機 / プロパン / 水道メーター / 換気口
//        → 屋根上（TV・BS アンテナ、点検口、鳥除け針金）/ 庭（飛石・植木・菜園枠・側溝蓋）
//  四面すべてに内容：+Z 南＝玄関妻、-Z 北＝縁側・裏庭、+X 東＝小巷側、-X 西＝隣地隙間。
//  単位メートル / 原点＝敷地底面中心（y=0＝地盤）/ +Y 上 / 正面（玄関）朝 +Z。同一 options で完全決定。

const meta = {
  id: 'minka',
  real: [3.96, 3.62, 5.02],   // 屋根仕舞い（X 幅, 棟含高さ, Z 奥行）。棟上アンテナ含めず。
  origin: 'ground-center',    // y=0 = 地盤（民家敷地 土間 y≈0.006 と噛み合う）
};

const DEFAULT_OPTIONS = { seed: 4801, w: 3.4, d: 4.5, roof: 'tile' };

/* ------------------------------ 寸法定数（m） ------------------------------ */
const WT = 0.155;        // 外壁厚
const FND_TOP = 0.42;    // 基礎天＝床レベル
const WALL_TOP = 2.44;   // 壁天端（軒天井よりやや上）
const MIZUKE = 1.06;     // 水切り高
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);

/* =============================================================================
 *  汎用部品
 * ===========================================================================*/

/** 厚みのある外壁：開口を貫通穿ちとして実パネルに分割（＝決して紙壁にしない） */
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

/** 障子（内側から見える木格子＋和紙）── 開口の内側に据え、見通しを止める役割も持つ */
function shojiPanel({ w, h, mat, paper, seedOff = 0 }) {
  const g = grp('shoji');
  g.add(mesh(box(w, h, 0.006), paper, { pos: [0, 0, -0.012], name: 'shoji-paper' }));
  grill(g, { w: w - 0.02, h: h - 0.02, nx: Math.max(2, Math.round(w / 0.15) + 1), ny: Math.max(2, Math.round(h / 0.17) + 1), bar: 0.009, mat, pos: [0, 0, 0.0] });
  // 框（障子枠 4 辺）
  for (const [dx, dy, bw, bh] of [[0, h / 2, w, 0.02], [0, -h / 2, w, 0.02], [-w / 2, 0, 0.02, h], [w / 2, 0, 0.02, h]]) {
    g.add(mesh(box(rq(bw), rq(bh), 0.018), mat, { pos: [dx, dy, 0.004], name: 'shoji-frame' }));
  }
  g.position.z = -0.055 - seedOff * 0.001;
  return g;
}

/** 窓ユニット：外側を +Z として組む（壁グループにそのまま入れると自動で外向き） */
function windowUnit(M, o) {
  const { w, h, kind = 'alu', inner = true, screen = false, shutter = null, rnd } = o;
  const g = grp('win-' + kind);
  const fw = kind === 'alu' ? 0.05 : 0.062;      // 框幅
  const fMat = kind === 'alu' ? M.alu : M.woodFrame;
  const dep = kind === 'alu' ? 0.075 : 0.095;    // 框の奥行き

  // 外框 4 辺
  for (const [dx, dy, bw, bh] of [
    [0, h / 2 - fw / 2, w, fw], [0, -h / 2 + fw / 2, w, fw],
    [-w / 2 + fw / 2, 0, fw, h], [w / 2 - fw / 2, 0, fw, h],
  ]) g.add(mesh(box(rq(bw), rq(bh), dep), fMat, { pos: [dx, dy, 0], name: 'win-frame' }));
  // 中央の縦中枠（引き違い 2 枚）
  g.add(mesh(box(0.032, h - fw * 2, dep * 0.8), fMat, { pos: [range(rnd, -0.09, 0.09), 0, 0], name: 'win-mullion' }));
  // 横框（下上げ窓の鴨居）
  if (h > 0.8) g.add(mesh(box(w - fw * 2, 0.026, dep * 0.72), fMat, { pos: [0, h * 0.18, 0.004], name: 'win-rail' }));
  // ガラス（2 枚の葉、わずかにずらして引き違い感）
  const gl = M.glass;
  g.add(mesh(box(w - fw * 2 - 0.01, h - fw * 2 - 0.01, 0.006), gl, { pos: [-0.012, 0, -6e-3], name: 'win-glass-a' }));
  g.add(mesh(box((w - fw * 2) / 2, h - fw * 2 - 0.01, 0.005), gl, { pos: [w / 4 - 0.03, 0, 0.012], name: 'win-glass-b' }));
  // 室内側の障子 or 内窓幕
  if (inner) g.add(shojiPanel({ w: w - fw * 2 - 0.02, h: h - fw * 2 - 0.02, mat: M.woodFrame, paper: M.washi }));
  // 網戸（外側に一枚、少しずれて開いた状態）
  if (screen) {
    const sw = (w - fw * 2) * 0.52;
    const sg = grp('screen', { pos: [-w / 2 + fw + sw / 2 + 0.008, 0, dep / 2 + 0.028] });
    sg.add(mesh(box(sw, h - fw * 2, 0.008), M.meshFabric, { name: 'screen-mesh' }));
    for (const [dx, dy, bw, bh] of [[0, (h - fw * 2) / 2, sw, 0.018], [0, -(h - fw * 2) / 2, sw, 0.018],
      [-(sw / 2) + 0.009, 0, 0.018, h - fw * 2], [sw / 2 - 0.009, 0, 0.018, h - fw * 2]]) {
      sg.add(mesh(box(rq(bw), rq(bh), 0.016), M.aluDark, { pos: [dx, dy, 0.004], name: 'screen-frame' }));
    }
    sg.add(mesh(box(0.03, 0.012, 0.02), M.plasticDark, { pos: [sw / 2 - 0.05, -0.02, 0.02], name: 'screen-pull' }));
    g.add(sg);
  }
  // 雨戸（'closed' 全閉 / 'open' 両側に積み残し）
  if (shutter) {
    const pw = (w - fw * 2) / 2 + 0.03;
    const zOut = dep / 2 + 0.055;
    if (shutter === 'closed') {
      for (const s of [-1, 1]) {
        g.add(mesh(box(pw, h - 0.01, 0.024), M.shutter, { pos: [s * (pw / 2 - 0.015), 0, zOut], name: 'shutter-leaf' }));
        g.add(mesh(box(pw - 0.03, 0.014, 0.006), M.shutterRib, { pos: [s * (pw / 2 - 0.015), h * 0.22, zOut + 0.015], name: 'shutter-rib' }));
      }
      g.add(mesh(box(0.05, 0.09, 0.02), M.aluDark, { pos: [0.02, -0.18, zOut + 0.02], name: 'shutter-lock' }));
    } else {
      for (const s of [-1, 1]) {
        g.add(mesh(box(pw * 0.94, h - 0.01, 0.024), M.shutter, { pos: [s * (w / 2 + pw * 0.42 - 0.02), 0, zOut], name: 'shutter-stacked' }));
        // 戸当り・走りレール
        g.add(mesh(box(0.024, 0.02, 0.05), M.aluDark, { pos: [s * (w / 2 + pw * 0.42 - 0.02), h / 2 + 0.014, zOut], name: 'shutter-stopper' }));
      }
      g.add(mesh(box(w + pw * 0.9, 0.016, 0.03), M.aluDark, { pos: [0, h / 2 + 0.006, zOut], name: 'shutter-rail' }));
    }
  }
  // 窓台（外側へ出た水切役）＋ 雨だれ
  g.add(mesh(box(w + 0.06, 0.035, 0.11), M.metalFlash, { pos: [0, -h / 2 - 0.012, 0.012], name: 'win-sill-flash' }));
  weather(g, { w: w * 0.9, h: 0.42, pos: [0, -h / 2 - 0.28, dep / 2 + 0.021], rot: [0, 0, 0], kind: 'dirt', color: '#5f584c', opacity: 0.4, seed: 991 + (o.seedOff | 0), density: 1.3, count: 2, spread: 0.06 });
  return g;
}

/* =============================================================================
  *  本構築
  * ===========================================================================*/
function build(options = {}) {
  const seed = (options.seed ?? 4801) | 0;
  const rnd = rand(seed);
  const w = options.w ?? 3.4;
  const d = options.d ?? 4.5;
  const slate = options.roof === 'slate';
  const g = grp('minka');
  const hx = w / 2, hz = d / 2;

  /* ---------------- 素材 ---------------- */
  const baseMat = MAT.concrete({ base: '#b6b0a2', repeat: 1, joints: 2, cracked: true });
  const plaster = MAT.concrete({ base: PAL.wallPlaster, repeat: 1, cracked: true });
  MAT.concrete({ base: '#ded6c2', repeat: 1, cracked: true, tint: '#f6efdf', sat: 0.9 });
  MAT.wood({ light: '#a3917142'.slice(0, 7), dark: '#6c5c46', repeat: 1, uv: { repeat: [1.2, 1.2] } });
  const M = {
    plaster, baseMat,
    concDark: MAT.concrete({ base: '#a8a296', repeat: 1, joints: 3 }),
    alu: MAT.metal('#c3c8cc', { worn: 0.42, repeat: 1 }),
    aluDark: MAT.metal('#8f959a', { worn: 0.6, repeat: 1 }),
    aluBright: MAT.metal('#d7dde0', { worn: 0.2, repeat: 1 }),
    metalFlash: MAT.metal('#a9afb2', { worn: 0.55, repeat: 1 }),
    galv: MAT.galvanized({ worn: 0.75 }),
    darkIron: MAT.darkIron({ worn: 0.7 }),
    woodFrame: MAT.wood({ light: '#9b8261', dark: '#5d4a33', repeat: 1, uv: { repeat: [1.6, 1.6] } }),
    woodWeathered: MAT.wood({ light: PAL.woodWeathered, dark: '#6b5f4c', repeat: 1, uv: { repeat: [1.4, 1.4] } }),
    shutter: MAT.paint('#8c9a90', { map: TEX.wood({ light: '#8c9a90', dark: '#5f6b62', repeat: 1 }).map, spec: 0.1, steps: 3 }),
    shutterRib: MAT.paint('#71807a', { spec: 0.14 }),
    washi: MAT.paper({ color: '#f2ead6', map: TEX.paper({ base: '#f2ead6' }).map }),
    glass: MAT.glassLite({ color: PAL.glassTint, opacity: 0.3, spec: 0.95 }),
    meshFabric: MAT.paint('#39433f', { map: TEX.metal({ base: '#39433f', worn: 0.2, repeat: 14 }).map, side: DoubleSide, spec: 0.1 }),
    plasticDark: MAT.hardPlastic('#4b4f52'),
    acCase: MAT.paint('#e6e2d6', { map: TEX.metal({ base: '#e6e2d6', worn: 0.55, repeat: 2 }).map, worn: 0.5, spec: 0.24 }),
    finDark: MAT.paint('#6d6b66', { map: TEX.metal({ base: '#6d6b66', worn: 0.7, repeat: 10 }).map, spec: 0.32 }),
    insulation: MAT.rubber('#c8c2b4'),
    rubberMat: MAT.rubber('#33352f'),
    tank: MAT.paint('#9d5a4a', { map: TEX.metal({ base: '#9d5a4a', worn: 0.7, repeat: 2 }).map, spec: 0.36, specPower: 90 }),
    tankCollar: MAT.metal('#8d8f92', { worn: 0.8 }),
    rustIron: MAT.metal('#7a5a44', { worn: 0.95, spec: 0.22 }),
    brass: MAT.metal('#b99a58', { spec: 0.7, worn: 0.4 }),
    paperWhite: MAT.paper({ color: '#f6f2e6' }),
    fabricBlue: MAT.fabric({ color: '#5c6f86', repeat: 10 }),
    panelWhite: MAT.paint('#ded9cc', { map: TEX.metal({ base: '#ded9cc', worn: 0.6, repeat: 2 }).map, spec: 0.26 }),
    tile: slate
      ? MAT.paint('#5f6a64', { map: TEX.corrugated({ base: '#6a746e', repeat: 1 }).map, normalMap: TEX.corrugated({ base: '#6a746e', repeat: 1 }).normalMap, spec: 0.2, sat: 0.86 })
      : MAT.roofTile({ base: PAL.minkaRoof, repeat: 1 }),
    tileOld: MAT.roofTile({ base: '#5c5f68', repeat: 1, tint: '#e9e2d0', sat: 0.8 }),
    ridgeTile: MAT.roofTile({ base: '#585d66', repeat: 1 }),
    onigawara: MAT.paint('#59606a', { map: TEX.concrete({ base: '#59606a', repeat: 1 }).map, spec: 0.28 }),
    barkSmall: MAT.bark({ base: '#6b574a', repeat: 1 }),
    leaf: [
      MAT.leaf({ color: '#a9c47a' }),
      MAT.leaf({ color: PAL.leaf }),
      MAT.leaf({ color: '#5d7a4c' }),
      MAT.leaf({ color: '#c7b25e', alphaTest: 0.4 }),
    ],
    soil: MAT.paint('#7b664c', { map: TEX.concrete({ base: '#7b664c', repeat: 1 }).map, spec: 0.03, shadowAmt: 0.98 }),
    grass: MAT.grass({ base: PAL.grass, repeat: 3 }),
    stone: MAT.stone({ color: '#a8a29a' }),
    paving: MAT.paving({ color: '#c4beb0', mode: 'block', cells: 4, repeat: 1 }),
    tatch: MAT.concrete({ base: '#c2bcae', repeat: 1, joints: 2 }),
    doorPanel: MAT.wood({ light: '#8e7a5c', dark: '#54432e', repeat: 1, uv: { repeat: [1.4, 1.4] } }),
    signPlate: MAT.paint('#efe9d9', { map: TEX.signboard({ text: '藤原', bg: '#efe9d9', fg: '#3d4650', size: 190, ar: 2 }), spec: 0.2 }),
  };

  /* ============================ 1. 基礎・土台 ============================ */
  const fnd = grp('foundation');
  fnd.add(mesh(box(w + 0.07, FND_TOP + 0.1, d + 0.07), M.baseMat, { pos: [0, (FND_TOP - 0.1) / 2, 0], name: 'fnd-body' }));
  // 打継ぎ目（縦リブ）＋ 水切りライン
  row(fnd, 9, (w + 0.07) / 9, (i, x) => mesh(box(0.012, FND_TOP, 0.012), M.concDark, { pos: [x, FND_TOP / 2, hz + 0.036], name: 'fnd-joint' }), { x0: -hx, start: 0 });
  for (const [bw, bd, x, z] of [[w + 0.09, 0.02, 0, hz], [w + 0.09, 0.02, 0, -hz], [0.02, d + 0.09, hx, 0], [0.02, d + 0.09, -hx, 0]]) {
    fnd.add(mesh(box(rq(bw), 0.022, rq(bd)), M.concDark, { pos: [x, MIZUKE - 0.62, z], name: 'fnd-pourline' }));
  }
  // 布基礎の根巻（土戻し＋モルタルwash）
  fnd.add(mesh(box(w + 0.16, 0.06, d + 0.16), M.concDark, { pos: [0, 0.03, 0], name: 'fnd-slick' }));
  g.add(fnd);
  // 土台（防腐-treated 木、壁の下に潜る）
  g.add(mesh(box(w - 0.02, 0.1, d - 0.02), M.woodWeathered, { pos: [0, FND_TOP - 0.02, 0], name: 'sill-beam' }));
  // 基礎のコケ・泥はね・打継（経年 1）
  weather(g, { w: w * 1.4, h: 0.3, pos: [0, 0.14, hz + 0.04], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 11, density: 1.7, count: 3, spread: 0.05 });
  weather(g, { w: d * 1.4, h: 0.28, pos: [hx + 0.04, 0.13, 0], rot: [0, Math.PI / 2, 0], kind: 'moss', color: '#63804e', opacity: 0.46, seed: seed + 13, density: 1.6, count: 3, spread: 0.05 });
  weather(g, { w: w * 1.2, h: 0.24, pos: [0, 0.1, -hz - 0.04], rot: [0, Math.PI, 0], kind: 'dirt', color: '#4e4536', opacity: 0.44, seed: seed + 17, density: 1.5, count: 2, spread: 0.04 });

  /* ============================ 2. 外壁（4 面・開口穿孔） ============================ */
  const wallM = slate ? M.plaster : M.plaster;
  const walls = {};
  // 南（+Z）：玄関＋居間窓
  walls.s = piercedWall(g, {
    len: w, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: wallM,
    pos: [0, 0, hz - WT / 2], name: 'wall-south',
    opens: [
      { c: -0.44, w: 1.46, y0: FND_TOP, y1: 2.10 },   // 引き違い玄関
      { c: 1.0, w: 0.9, y0: 1.05, y1: 1.85 },          // 居間窓
    ],
  });
  // 北（-Z）：裏口＋台所窓
  walls.n = piercedWall(g, {
    len: w, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: wallM,
    pos: [0, 0, -(hz - WT / 2)], rotYdeg: 180, name: 'wall-north',
    opens: [
      { c: -0.5, w: 0.82, y0: FND_TOP, y1: 2.02 },     // 裏口（local x=-0.5 → 世界 x=+0.5）
      { c: 0.86, w: 0.92, y0: 1.0, y1: 1.78 },         // 台所窓（世界 x=-0.86）
    ],
  });
  // 東（+X、小巷側）：大きな窓＋雨戸の窓
  const sideLen = d - WT * 2;
  walls.e = piercedWall(g, {
    len: sideLen, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: wallM,
    pos: [hx - WT / 2, 0, 0], rotYdeg: -90, name: 'wall-east',
    opens: [
      { c: 0.7, w: 1.1, y0: 1.02, y1: 1.88 },
      { c: -0.85, w: 0.8, y0: 1.1, y1: 1.78 },
    ],
  });
  // 西（-X、隣地隙間）：小窓
  walls.w = piercedWall(g, {
    len: sideLen, thick: WT, y0: FND_TOP, y1: WALL_TOP, mat: wallM,
    pos: [-(hx - WT / 2), 0, 0], rotYdeg: 90, name: 'wall-west',
    opens: [{ c: -0.55, w: 0.7, y0: 1.3, y1: 1.86 }],
  });

  /* ---- 建具を開口に差し込む（各壁グループのローカル +Z = 外向き、y は絶対値） ---- */
  const fit = (wall, o, unit) => {
    const u = unit;
    u.position.set(o.c, (o.y0 + o.y1) / 2, 0);
    wall.add(u);
    return u;
  };
  const OP = {
    s: walls.s.userData.opens || [
      { c: -0.44, w: 1.46, y0: FND_TOP, y1: 2.1 },
      { c: 1.0, w: 0.9, y0: 1.05, y1: 1.85 },
    ],
    n: [
      { c: -0.5, w: 0.82, y0: FND_TOP, y1: 2.02 },
      { c: 0.86, w: 0.92, y0: 1.0, y1: 1.78 },
    ],
    e: [
      { c: 0.7, w: 1.1, y0: 1.02, y1: 1.88 },
      { c: -0.85, w: 0.8, y0: 1.1, y1: 1.78 },
    ],
    w: [{ c: -0.55, w: 0.7, y0: 1.3, y1: 1.86 }],
  };
  // 南：引き違い玄関（アルミ框・ガラス・採光）＋居間窓（網戸・雨戸・障子）
  fit(walls.s, OP.s[0], windowUnit(M, { w: OP.s[0].w - 0.06, h: OP.s[0].y1 - OP.s[0].y0 - 0.06, kind: 'alu', inner: false, screen: false, shutter: null, rnd, seedOff: 1 }));
  walls.s.add(mesh(box(OP.s[0].w - 0.1, 0.02, 0.03), M.aluDark, { pos: [OP.s[0].c, FND_TOP + 0.02, 0.02], name: 'door-threshold' }));
  fit(walls.s, OP.s[1], windowUnit(M, { w: OP.s[1].w - 0.05, h: OP.s[1].y1 - OP.s[1].y0 - 0.05, kind: 'alu', inner: true, screen: true, shutter: 'open', rnd, seedOff: 2 }));
  // 北：裏口（鋼製建具）＋台所窓
  fit(walls.n, OP.n[0], windowUnit(M, { w: OP.n[0].w - 0.06, h: OP.n[0].y1 - OP.n[0].y0 - 0.06, kind: 'alu', inner: false, screen: false, shutter: null, rnd, seedOff: 3 }));
  walls.n.add(mesh(box(0.03, 0.16, 0.03), M.aluDark, { pos: [OP.n[0].c + OP.n[0].w / 2 - 0.12, OP.n[0].y0 + 0.95, 0.05], name: 'door-handle' }));
  fit(walls.n, OP.n[1], windowUnit(M, { w: OP.n[1].w - 0.05, h: OP.n[1].y1 - OP.n[1].y0 - 0.05, kind: 'wood', inner: true, screen: false, shutter: 'closed', rnd, seedOff: 4 }));
  // 東（小巷側）：出窓風の大きな窓＋小窓
  fit(walls.e, OP.e[0], windowUnit(M, { w: OP.e[0].w - 0.05, h: OP.e[0].y1 - OP.e[0].y0 - 0.05, kind: 'wood', inner: true, screen: true, shutter: 'open', rnd, seedOff: 5 }));
  fit(walls.e, OP.e[1], windowUnit(M, { w: OP.e[1].w - 0.05, h: OP.e[1].y1 - OP.e[1].y0 - 0.05, kind: 'alu', inner: true, screen: false, shutter: 'open', rnd, seedOff: 6 }));
  // 西：小窓（雨戸閉じ）
  fit(walls.w, OP.w[0], windowUnit(M, { w: OP.w[0].w - 0.05, h: OP.w[0].y1 - OP.w[0].y0 - 0.05, kind: 'wood', inner: true, screen: false, shutter: 'closed', rnd, seedOff: 7 }));
  // 建具まわりの経年（サビ・枠の塗りムラ・テープ残り）
  for (const [wall, list] of [[walls.s, OP.s], [walls.n, OP.n], [walls.e, OP.e], [walls.w, OP.w]]) {
    for (const o of list) {
      weather(wall, { w: o.w * 1.05, h: (o.y1 - o.y0) * 0.5, pos: [o.c, (o.y0 + o.y1) / 2, WT / 2 + 0.012], kind: 'dirt', color: '#6b6152', opacity: 0.3, seed: seed + Math.round(o.c * 97 + o.w * 31), density: 1.2 });
    }
  }

  return finish(g, { outline: 'normal' });
}

export { DEFAULT_OPTIONS, build, meta };
