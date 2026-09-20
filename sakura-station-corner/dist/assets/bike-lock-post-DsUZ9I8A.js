import { g as grp, M as MAT, P as PAL, m as mesh, c as cyl, e as radial, w as weather, r as rbox, t as tor, h as decal, T as TEX, b as box, k as tubeOf, C as CatmullRomCurve3, f as along, q as finish, j as d2r, V as Vector3 } from './index-CsDGE8n9.js';

//  assets/bike/bike-lock-post.js
//  施錠設備 —— kind='post'  施錠柱（車輪止め突起・ボルト・錆・穴）
//            kind='ulock'  U字ロック（単体、鍵穴・カバー剥がれ・擦れ）
//            kind='chain'  施錠チェーン（柱に巻いた鎖・南京錠・擦れ跡）
//  単位：メートル。原点 = 接地中心。+Y 上。+Z = 車輪を受け側（前）。

/** 曲線パイプ */
function bend(pts, r, mat, name = 'bend', ts = 20) {
  return mesh(tubeOf(pts, r, ts, 8), mat, { name });
}

const meta = {
  id: 'bike-lock-post',
  real: [0.32, 0.78, 0.40],
  origin: 'ground-center',
};

function build(options = {}) {
  const seed = options.seed ?? 401;
  const kind = options.kind ?? 'post';
  const g = grp('bike-lock-post-' + kind);

  const M = {
    post: MAT.metalPaint('#4d6b78', { worn: 0.72, repeat: 2.4 }),
    postDark: MAT.metal('#405058', { worn: 0.85 }),
    steel: MAT.metal('#9aa0a6', { worn: 0.6, repeat: 2 }),
    chrome: MAT.chrome(),
    bolt: MAT.darkIron({ worn: 0.88 }),
    rust: MAT.metalPaint(PAL.rust, { worn: 1.0, repeat: 1.4, spec: 0.12 }),
    concrete: MAT.concrete({ base: PAL.concreteDark, repeat: 1.6, joints: 2, cracked: true }),
    rubber: MAT.rubber('#33363b'),
    yellow: MAT.hardPlastic(PAL.markingYellow, { worn: 0.7 }),
    white: MAT.hardPlastic('#e9e6dd', { worn: 0.6 }),
    ulockBody: MAT.hardPlastic('#b8433a', { worn: 0.6 }),
    shackle: MAT.metal('#c2c7cb', { worn: 0.55, repeat: 2 }),
    chain: MAT.metal('#8f959a', { worn: 0.8, repeat: 1.6 }),
    padlock: MAT.hardPlastic('#d8a83c', { worn: 0.6 }),
    sign: MAT.metalPaint(PAL.signBlue, { worn: 0.66, repeat: 2 }),
    glow: MAT.lampShade({ color: '#e6f0e0', emissive: '#cfe9d4', emissiveIntensity: 0.45 }),
  };

  /* =========================== 共通：基礎 =========================== */
  const base = grp('foundation');
  g.add(base);
  base.add(mesh(cyl(0.130, 0.150, 0.048, 18), M.concrete, { name: 'footing', pos: [0, 0.024, 0] }));
  base.add(mesh(cyl(0.118, 0.130, 0.014, 18), M.concrete, { name: 'footing-cap', pos: [0, 0.055, 0] }));
  base.add(mesh(cyl(0.086, 0.092, 0.020, 16), M.postDark, { name: 'sleeve', pos: [0, 0.072, 0] }));
  radial(base, 4, 0.070, (i, a, x, z) => {
    const b = grp('anchor');
    b.position.set(x, 0.078, z);
    b.add(mesh(cyl(0.0088, 0.0088, 0.018, 6), M.bolt, { name: 'anchor-bolt' }));
    b.add(mesh(cyl(0.0142, 0.0142, 0.005, 6), M.rust, { name: 'washer', pos: [0, -8e-3, 0] }));
    return b;
  });
  weather(base, { w: 0.16, h: 0.06, pos: [0.06, 0.062, 0.07], rot: [0, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 3, spread: 0.03 });

  /* =========================== kind: post =========================== */
  if (kind === 'post') {
    const P = grp('lock-post');
    g.add(P);
    const H = 0.640;
    // 角柱（上面は面取り、側面に車輪止め突起）
    P.add(mesh(rbox(0.128, H, 0.108, 0.014, 3), M.post, { name: 'post-body', pos: [0, 0.070 + H / 2, 0] }));
    P.add(mesh(rbox(0.140, 0.026, 0.120, 0.008, 2), M.postDark, { name: 'post-cap', pos: [0, 0.070 + H + 0.010, 0] }));
    P.add(mesh(rbox(0.140, 0.020, 0.120, 0.006, 2), M.postDark, { name: 'post-skirt', pos: [0, 0.082, 0] }));
    // 車輪止め突起（前輪を受ける L 金物＋ゴム）
    const arm = grp('wheel-catch', { pos: [0, 0.230, 0.056] });
    arm.add(mesh(rbox(0.118, 0.024, 0.180, 0.006, 2), M.post, { name: 'catch-arm', pos: [0, 0, 0.080] }));
    arm.add(mesh(rbox(0.118, 0.140, 0.024, 0.006, 2), M.post, { name: 'catch-riser', pos: [0, 0.070, 0.158] }));
    arm.add(mesh(rbox(0.098, 0.090, 0.016, 0.005, 2), M.rubber, { name: 'catch-pad', pos: [0, 0.062, 0.172] }));
    arm.add(mesh(cyl(0.0100, 0.0100, 0.130, 8), M.steel, { name: 'catch-hinge', pos: [0, 0.012, 0.030], rot: [0, 0, Math.PI / 2] }));
    for (const sx of [-1, 1]) {
      arm.add(mesh(cyl(0.0072, 0.0072, 0.022, 6), M.bolt, { name: 'catch-bolt', pos: [sx * 0.048, 0.012, 0.010], rot: [0, 0, Math.PI / 2] }));
      arm.add(mesh(tor(0.0125, 0.0026, 4, 12), M.rust, { name: 'catch-spring', pos: [sx * 0.062, 0.012, 0.030], rot: [0, Math.PI / 2, 0] }));
    }
    P.add(arm);
    // 穿ち穴（ロックを通す 2 穴）＋内側の金具
    for (const [hy, hz] of [[0.470, 0.0], [0.330, 0.0]]) {
      P.add(mesh(cyl(0.0210, 0.0210, 0.130, 14), M.postDark, { name: 'hole-sleeve', pos: [0, hy, hz], rot: [Math.PI / 2, 0, 0] }));
      P.add(mesh(cyl(0.0180, 0.0180, 0.150, 14), M.rubber, { name: 'hole-liner', pos: [0, hy, hz], rot: [Math.PI / 2, 0, 0] }));
    }
    // 夜光反射帯・標識
    P.add(mesh(rbox(0.132, 0.030, 0.112, 0.004, 2), M.glow, { name: 'reflector-band', pos: [0, 0.578, 0] }));
    const sg = grp('sign-plate', { pos: [0, 0.500, 0.062], rot: [d2r(-8), 0, 0] });
    sg.add(mesh(rbox(0.126, 0.086, 0.008, 0.004, 2), M.sign, { name: 'sign-back' }));
    decal(sg, { map: TEX.signboard({ text: '施錠ここ', sub: 'LOCK HERE', bg: '#e8eef4', fg: '#2c6cb0' }), w: 0.118, h: 0.078, pos: [0, 0, 0.006], opacity: 0.95 });
    P.add(sg);
    // 使用済み鍵の掛かったフック
    const hk = grp('key-hook', { pos: [0.070, 0.400, 0.010] });
    hk.add(mesh(cyl(0.0050, 0.0050, 0.030, 8), M.steel, { name: 'hook-stem', rot: [0, 0, Math.PI / 2] }));
    hk.add(bendHook(hk, M.steel));
    hk.add(mesh(rbox(0.020, 0.026, 0.008, 0.003, 2), M.padlock, { name: 'spare-key-tag', pos: [0.026, -0.03, 0] }));
    P.add(hk);
    // 錆・掉漆・擦れ（車輪が当たる面）
    weather(P, { w: 0.10, h: 0.22, pos: [0.066, 0.300, 0.030], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 7, count: 2, spread: 0.06 });
    weather(P, { w: 0.09, h: 0.14, pos: [-0.066, 0.480, 0.020], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#c9c4b6', opacity: 0.5, seed: seed + 9, spread: 0.04 });
    weather(P, { w: 0.11, h: 0.05, pos: [0, 0.096, 0.056], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6d6250', opacity: 0.45, seed: seed + 11, spread: 0.02 });
    decal(P, { map: TEX.wear({ kind: 'scratch', color: '#d8dcde', seed: seed + 13, density: 1.6 }), w: 0.06, h: 0.16, pos: [0.0665, 0.240, 0.0], rot: [0, Math.PI / 2, 0], opacity: 0.45 });
    g.userData.tint = 1;
  }

  /* =========================== kind: ulock =========================== */
  if (kind === 'ulock') {
    const U = grp('u-lock');
    g.add(U);
    // 立てた状態の U字ロック（鞘 + シャックル）＋保持スタンド
    U.add(mesh(cyl(0.052, 0.060, 0.036, 16), M.concrete, { name: 'ulock-stand-base', pos: [0, 0.018, 0] }));
    U.add(mesh(rbox(0.062, 0.230, 0.052, 0.008, 2), M.postDark, { name: 'holder-post', pos: [0, 0.148, -0.014] }));
    U.add(mesh(rbox(0.086, 0.020, 0.062, 0.005, 2), M.steel, { name: 'holder-fork', pos: [0, 0.262, 0.004] }));
    const lock = grp('lock', { pos: [0, 0.262, 0.006], rot: [0, 0, d2r(4)] });
    // 本体（鞘）
    lock.add(mesh(rbox(0.062, 0.044, 0.126, 0.010, 2), M.ulockBody, { name: 'ulock-casing' }));
    lock.add(mesh(rbox(0.056, 0.010, 0.120, 0.004, 2), M.postDark, { name: 'casing-sole', pos: [0, -0.024, 0] }));
    lock.add(mesh(cyl(0.0125, 0.0125, 0.014, 12), M.chrome, { name: 'keyhole', pos: [0, 0.0, 0.066], rot: [Math.PI / 2, 0, 0] }));
    lock.add(mesh(rbox(0.020, 0.016, 0.006, 0.003, 2), M.rubber, { name: 'keyhole-flap', pos: [0.002, -0.02, 0.066], rot: [0, 0, d2r(24)] }));
    lock.add(mesh(box(0.030, 0.006, 0.014), M.white, { name: 'model-plate', pos: [0.032, 0.006, -0.02] }));
    decal(lock, { map: TEX.signboard({ text: 'STRONG 18', sub: '防犯登録済', bg: '#b8433a', fg: '#f4ece0' }), w: 0.056, h: 0.022, pos: [-0.0315, 0.004, 0.010], rot: [0, -Math.PI / 2, 0], opacity: 0.9 });
    // シャックル（U 字・鞘から立ち上がる 2 本 + 顶部アーチ）
    const shPts = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * (i / 24);
      shPts.push([0, 0.024 + Math.sin(a) * 0.200, -Math.cos(a) * 0.086]);
    }
    U.add(mesh(tubeOf(shPts.map((p) => [p[0], p[1] + 0.262, p[2] + 0.006]), 0.0105, 30, 8), M.shackle, { name: 'shackle' }));
    U.add(mesh(cyl(0.0108, 0.0108, 0.026, 8), M.chrome, { name: 'shackle-leg-L', pos: [0, 0.286, -0.08], rot: [d2r(8), 0, 0] }));
    U.add(mesh(cyl(0.0108, 0.0108, 0.026, 8), M.chrome, { name: 'shackle-leg-R', pos: [0, 0.286, 0.092], rot: [d2r(-8), 0, 0] }));
    // シャックル上のゴムスリーブ（4 分割・日焼け）
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (0.18 + i * 0.22);
      U.add(mesh(cyl(0.0132, 0.0132, 0.036, 10), M.rubber, {
        name: 'shackle-sleeve', pos: [0, 0.262 + 0.024 + Math.sin(a) * 0.200, 0.006 - Math.cos(a) * 0.086],
        rot: [a - Math.PI / 2, 0, 0],
      }));
    }
    // 取付金具プレート（ボルト 4 本）と注意タグ
    U.add(mesh(rbox(0.110, 0.014, 0.086, 0.004, 2), M.steel, { name: 'holder-plate', pos: [0, 0.036, -0.014] }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      U.add(mesh(cyl(0.0068, 0.0068, 0.014, 6), M.bolt, { name: 'plate-bolt', pos: [sx * 0.044, 0.046, -0.014 + sz * 0.030] }));
    }
    const tg = grp('tag', { pos: [-0.048, 0.300, 0.030], rot: [d2r(6), d2r(-14), d2r(12)] });
    tg.add(mesh(rbox(0.044, 0.056, 0.003, 0.002, 2), M.white, { name: 'tag-card' }));
    decal(tg, { map: TEX.signboard({ text: '防犯登録', sub: 'C-118', bg: '#f6f1e4', fg: '#b8433a', ar: 0.8 }), w: 0.040, h: 0.050, pos: [0, 0, 0.003], opacity: 0.95 });
    tg.add(mesh(tor(0.0050, 0.0014, 4, 10), M.chrome, { name: 'tag-ring', pos: [0, 0.030, 0] }));
    U.add(tg);
    // 鞘側の打痕・泥
    U.add(mesh(rbox(0.066, 0.012, 0.030, 0.003, 2), M.postDark, { name: 'casing-dent', pos: [0, 0.240, 0.052], rot: [d2r(-8), 0, 0] }));
    weather(U, { w: 0.09, h: 0.05, pos: [0.0, 0.030, 0.070], kind: 'dirt', color: '#6d6250', opacity: 0.45, seed: seed + 29, spread: 0.02 });
    // 擦れ跡（シャックルの鞘出入口）
    weather(U, { w: 0.05, h: 0.10, pos: [0.012, 0.420, 0.006], rot: [0, Math.PI / 2, 0], kind: 'scratch', color: '#dfe3e6', opacity: 0.5, seed: seed + 15, spread: 0.03 });
    weather(lock, { w: 0.06, h: 0.05, pos: [-0.033, 0.010, 0.030], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#e6ded0', opacity: 0.6, seed: seed + 17, spread: 0.02 });
    weather(U, { w: 0.08, h: 0.06, pos: [0, 0.286, -0.07], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 19, spread: 0.03 });
    // 鍵（差しっぱなしのキー＋キーリング）
    const key = grp('key', { pos: [0, 0.262, 0.078], rot: [d2r(14), 0, 0] });
    key.add(mesh(cyl(0.0048, 0.0048, 0.036, 8), M.chrome, { name: 'key-blade', rot: [Math.PI / 2, 0, 0] }));
    key.add(mesh(rbox(0.020, 0.005, 0.026, 0.002, 2), M.padlock, { name: 'key-bow', pos: [0, 0, 0.028] }));
    key.add(mesh(tor(0.0140, 0.0018, 4, 14), M.steel, { name: 'key-ring', pos: [0.012, 0, 0.038], rot: [Math.PI / 2, 0, 0] }));
    U.add(key);
  }

  /* =========================== kind: chain =========================== */
  if (kind === 'chain') {
    const C = grp('chain-lock');
    g.add(C);
    // 環状に巻かれたチェーン（柱に固定された锚柱のまわり）
    const anchor = grp('chain-anchor', { pos: [0, 0.070, 0] });
    anchor.add(mesh(cyl(0.052, 0.058, 0.300, 16), M.post, { name: 'anchor-post', pos: [0, 0.150, 0] }));
    anchor.add(mesh(cyl(0.060, 0.060, 0.016, 16), M.postDark, { name: 'anchor-cap', pos: [0, 0.308, 0] }));
    anchor.add(mesh(tor(0.0545, 0.0045, 5, 16), M.rust, { name: 'anchor-weld', pos: [0, 0.078, 0], rot: [Math.PI / 2, 0, 0] }));
    anchor.add(mesh(cyl(0.0130, 0.0130, 0.026, 12), M.chrome, { name: 'chain-eye', pos: [0.052, 0.230, 0], rot: [0, 0, Math.PI / 2] }));
    C.add(anchor);
    weather(anchor, { w: 0.09, h: 0.16, pos: [0.056, 0.170, 0.01], rot: [0, Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 21, spread: 0.04 });

    // チェーン本体：柱のまわりを 1.5 周して地面に垂れる
    const cpts = [];
    const turns = 1.55, rBase = 0.086;
    for (let i = 0; i <= 46; i++) {
      const t = i / 46;
      const a = t * Math.PI * 2 * turns + 0.6;
      const rr = rBase + t * 0.030;
      const yy = 0.240 - t * 0.150 - Math.sin(t * Math.PI) * 0.030;
      cpts.push(new Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr));
    }
    cpts.push(new Vector3(0.118, 0.072, 0.060));
    cpts.push(new Vector3(0.128, 0.030, 0.018));
    cpts.push(new Vector3(0.112, 0.020, -0.03));
    const chainCurve = new CatmullRomCurve3(cpts, false, 'catmullrom', 0.05);
    const CH = grp('chain');
    const linkGeo = tor(0.0140, 0.0052, 5, 12);
    along(CH, chainCurve, 44, (i, p, t) => {
      const tg = chainCurve.getTangentAt(Math.min(0.999, t));
      const mm = mesh(linkGeo, i % 2 ? M.chain : M.steel, { name: 'chain-link' });
      mm.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), tg);
      if (i % 2) mm.rotateY(Math.PI / 2);
      mm.userData.noOutline = true;
      return mm;
    });
    C.add(CH);
    // 南京錠（チェーン端・黄銅・鍵穴）
    const pl = grp('padlock', { pos: [0.128, 0.052, 0.018], rot: [d2r(8), d2r(-24), d2r(12)] });
    pl.add(mesh(rbox(0.052, 0.060, 0.026, 0.008, 2), M.padlock, { name: 'padlock-body' }));
    pl.add(mesh(cyl(0.0075, 0.0075, 0.010, 10), M.postDark, { name: 'padlock-keyhole', pos: [0, -6e-3, 0.016], rot: [Math.PI / 2, 0, 0] }));
    pl.add(bend([[0.016, 0.030, 0], [0.016, 0.052, 0], [0, 0.062, 0], [-0.016, 0.052, 0], [-0.016, 0.030, 0]], 0.0058, M.chrome, 'padlock-shackle', 16));
    pl.add(mesh(box(0.040, 0.008, 0.004), M.white, { name: 'padlock-sticker', pos: [0, 0.018, 0.014] }));
    weather(pl, { w: 0.04, h: 0.04, pos: [-0.026, 0.004, 0.006], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 23, spread: 0.02 });
    C.add(pl);
    // 柱に擦られた塗装ハゲ帯
    for (let i = 0; i < 3; i++) {
      C.add(mesh(tor(0.0575, 0.0035, 5, 16), M.rust, { name: 'chain-rub', pos: [0, 0.226 - i * 0.048, 0], rot: [Math.PI / 2, 0, d2r(i * 6)] }));
    }
    // 地面に接する部分の泥
    weather(C, { w: 0.14, h: 0.045, pos: [0.112, 0.056, -0.02], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#6d6250', opacity: 0.5, seed: seed + 25, spread: 0.008 });
  }

  /* =========================== 共通：標識・全体做旧 =========================== */
  if (kind !== 'ulock') {
    const top = grp('top-mark', { pos: [0, kind === 'post' ? 0.686 : 0.400, 0] });
    top.add(mesh(rbox(0.150, 0.020, 0.126, 0.005, 2), M.yellow, { name: 'top-plate' }));
    decal(top, { map: TEX.signboard({ text: '施錠', sub: 'LOCK', bg: '#f0c353', fg: '#3a3325' }), w: 0.130, h: 0.016, pos: [0, 0.011, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.9 });
    g.add(top);
  }
  weather(g, { w: 0.20, h: 0.08, pos: [0.02, 0.030, 0.14], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a6f5c', opacity: 0.30, seed: seed + 27, count: 2, spread: 0.008 });

  return finish(g, { outline: 'thin' });
}

/* 鍵フック（曲がった針金） */
function bendHook(parent, mat, seed) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const a = Math.PI * (0.2 + t * 1.5);
    pts.push(new Vector3(0.018 + Math.cos(a) * 0.020, -Math.sin(a) * 0.026, 0));
  }
  return mesh(tubeOf(pts, 0.0032, 14, 6), mat, { name: 'hook-curve' });
}

export { build, build as default, meta };
