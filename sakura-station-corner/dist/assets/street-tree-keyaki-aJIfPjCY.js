import { g as grp, M as MAT, P as PAL, T as TEX, n as range, m as mesh, c as cyl, V as Vector3, E as inst, t as tor, w as weather, q as finish, H as plane, $ as MathUtils, C as CatmullRomCurve3, z as rand, Z as Euler } from './index-Dv-C_8Uh.js';

//  assets/flora/street-tree-keyaki.js —— 街路樹（ケヤキ：春の新緑・三級分枝・不規則な樹冠）
//  ケヤキ並木風。桜並木の間伐残し（株元起張り＋徒長枝混じり）も意識した形状。
//  単位メートル / 原点＝地面接触中心 / +Y 上 / 正面 +Z / 同 options → 同一結果（rand(seed) のみ使用）

const meta = {
  id: 'street-tree-keyaki',
  real: [5.6, 4.2, 5.6],        // 基準: crown=2.8(半径) / height=4.2
  origin: 'ground-center',
};

const UP = new Vector3(0, 1, 0);
const V = (x, y, z) => new Vector3(x, y, z);
const _eu = new Euler();
const _v = new Vector3();
/** 2mm 丸め → kit の図元キャッシュを共有（メモリ節約／同一形状は作らない） */
const rq = (v) => Math.max(0.004, Math.round(v * 500) / 500);

/** 湾曲した葉カード図元（PlaneGeometry の clone → 描边は自動スキップ、両面） */
function cardGeo(w, h, bend = 0.14, segY = 3) {
  const g = plane(w, h, 1, segY).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = MathUtils.clamp((p.getY(i) + h / 2) / h, 0, 1);   // 浮動小数の僅かな負値で pow→NaN にならないよう固定
    p.setZ(i, Math.pow(t, 1.7) * bend - bend * 0.2);
  }
  g.translate(0, h / 2, 0);          // 根元 pivot（枝先に刺さる形になる）
  g.computeVertexNormals();
  return g;
}

/** 先細り枝：曲線に沿ってテーパー円柱を連結（各節が独立 Mesh・merge しない） */
function limb(parent, pts, r0, r1, mat, { segs = 5, name = 'limb' } = {}) {
  const curve = new CatmullRomCurve3(pts.map((p) => V(p[0], p[1], p[2])), false, 'catmullrom', 0.4);
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const a = curve.getPointAt(t0), b = curve.getPointAt(t1);
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (len < 1e-4) continue;
    const mm = mesh(
      cyl(rq(MathUtils.lerp(r0, r1, t1)), rq(MathUtils.lerp(r0, r1, t0)), rq(len * 1.14), 6 + Math.round((1 - t0) * 4)),
      mat, { pos: [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], name },
    );
    mm.quaternion.setFromUnitVectors(UP, dir.normalize());
    parent.add(mm);
  }
  return curve;
}

function build(options = {}) {
  const seed = (options.seed ?? 7) | 0;
  const H = options.height ?? 4.2;                 // 樹高
  const CR = options.crown ?? 2.8;                 // 樹冠半径
  const rnd = rand(seed);

  const g = grp('street-tree-keyaki');

  /* ---------------- 素材 ---------------- */
  const barkMain = MAT.bark({ base: PAL.trunk, seed: (seed % 90) + 3, uv: { repeat: [2.6, 7] } });
  const barkLimb = MAT.bark({ base: '#7a6450', seed: (seed % 60) + 11, uv: { repeat: [2.2, 3.6] } });
  const barkTwig = MAT.bark({ base: '#8d7a63', seed: (seed % 40) + 21, uv: { repeat: [1.6, 2.2] } });
  const barkDead = MAT.bark({ base: '#6b5d4d', seed: 33, uv: { repeat: [1.2, 2] } });
  const matSoil = MAT.concrete({ base: '#6a5b47', repeat: 3 });
  const matGravel = MAT.ballast({ color: '#9c968a', repeat: 14 });
  const matStake = MAT.wood({ light: '#c2ab6f', dark: '#8b7340', repeat: 1, uv: { repeat: [1, 4] } });
  const matRope = MAT.fabric({ color: '#b9a179', repeat: 12 });

  /** 葉カード：5 階層（陽の新緑 → 深部 → 色褪せ前年葉）で「同じカードの繰り返し」を回避 */
  const TIERS = [
    { base: '#cbdd93', col: '#fff8e4', size: 0.30, emiss: 0.20, amt: 0.5 },
    { base: PAL.leafYoung, col: '#f2f9dd', size: 0.34, emiss: 0.14, amt: 0.66 },
    { base: PAL.leaf, col: '#e2f0cf', size: 0.38, emiss: 0.10, amt: 0.78 },
    { base: '#547640', col: '#a9c39c', size: 0.30, emiss: 0.03, amt: 0.95 },
    { base: '#c7b46c', col: '#ffeccb', size: 0.26, emiss: 0.06, amt: 0.85 },
  ].map((t, i) => ({
    ...t,
    mat: MAT.leaf({
      color: t.col,
      map: TEX.leafCluster({ base: t.base, seed: seed + i * 7 }),
      alphaTest: 0.44,
      emissiveIntensity: t.emiss,
      shadowAmt: t.amt,
      rim: 0.42 - i * 0.06,
      rimColor: i < 2 ? '#f0ffd8' : '#dff0cf',
      steps: 3,
      wind: { amp: 0.010 + i * 0.0015, freq: 1.02 + i * 0.14, base: -0.55, span: 1.7, px: 0.85, pz: 0.62 },
    }),
    geo: cardGeo(0.62, 0.62, 0.16),
  }));
  /** 落葉・枯れ葉（根元と樹冠の傷み） */
  const matBrown = MAT.leaf({
    color: '#d9c3a4', map: TEX.leafCluster({ base: '#9b7a4e', seed: seed + 91 }),
    alphaTest: 0.4, emissiveIntensity: 0.0, rim: 0.14, shadowAmt: 1,
  });

  /* ---------------- 樹冠形状（不規則：多倍音の和） ---------------- */
  const ph = [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283, rnd() * 6.283];
  0.86 + rnd() * 0.16;               // 横に広がる／細身の個体差
  const domeAt = (p) => {                            // 軸距離 p の許容半径
    return CR * (0.80 + 0.15 * Math.sin(p * 2.1 + ph[0]) + 0.10 * Math.sin(p * 3.9 + ph[1]) + 0.07 * Math.sin(p * 6.3 + ph[2]));
  };
  const Y_TOP = H * 1.005;                           // 天端上限（地面基準）
  const yFork = H * (0.42 + rnd() * 0.06);

  const crown = grp('crown', { pos: [0, yFork, 0] });
  g.add(crown);
  crown.userData.sway = { amp: 0.0085, freq: 0.36, phase: (seed % 11) * 0.57, axis: 'both', lean: 0.45 };

  /** 樹冠ローカル座標をドーム内へ引き込む（突き抜け／ペチャンコ防止） */
  function fit(p, margin = 0.94) {
    const axz = Math.hypot(p.x, p.z);
    const hRel = (p.y + yFork) / Y_TOP;               // 0=分枝点付近 1=天端
    const lim = domeAt(axz / Math.max(0.001, CR)) * margin;
    // 高さ方向は上膨れを抑え、下は枝垂れを許す（カードが 0.7m 突き出る前提の余裕）
    const topLimit = (H - yFork) * (0.94 - 0.20 * Math.min(1, axz / (CR * 0.9)));
    if (axz > lim) { const k = lim / Math.max(0.001, axz); p.x *= k; p.z *= k; }
    if (p.y > topLimit) p.y = topLimit + (p.y - topLimit) * 0.28;
    if (hRel < 0.06 && axz > CR * 0.5) p.y = Math.max(p.y, -0.1);
    return p;
  }

  /* ---------------- 幹（株元～分枝点） ---------------- */
  const rBase = 0.155 + rnd() * 0.045;
  const lean = V(range(rnd, -0.06, 0.06), 0, range(rnd, -0.06, 0.06));
  limb(g, [
    [0, -0.02, 0],
    [lean.x * 0.4, yFork * 0.42, lean.z * 0.4],
    [lean.x * 0.75 + range(rnd, -0.05, 0.05), yFork * 0.76, lean.z * 0.75 + range(rnd, -0.05, 0.05)],
    [lean.x, yFork, lean.z],
  ], rBase, rBase * 0.62, barkMain, { segs: 8, name: 'trunk' });

  // 株元の根張り（地面を這う根）＋根上りコブ
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.283 + range(rnd, -0.2, 0.2);
    const L = range(rnd, 0.26, 0.62);
    limb(g, [
      [Math.cos(a) * 0.05, 0.13, Math.sin(a) * 0.05],
      [Math.cos(a) * L * 0.55, 0.055, Math.sin(a) * L * 0.55],
      [Math.cos(a) * L, 0.006, Math.sin(a) * L],
    ], rq(rBase * 0.30), 0.016, barkMain, { segs: 3, name: 'root' });
  }
  // 板根風の盛り上がり（ケヤキ特有の根張り）
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 6.283 + 0.4 + rnd() * 0.5;
    const fin = mesh(cyl(0.008, rq(rBase * 0.5), 0.3, 5), barkMain, {
      pos: [Math.cos(a) * 0.1, 0.13, Math.sin(a) * 0.1], name: 'buttress',
    });
    fin.quaternion.setFromUnitVectors(UP, V(Math.cos(a) * 0.8, -1, Math.sin(a) * 0.8).normalize());
    g.add(fin);
  }

  /* ---------------- 三級分枝 ---------------- */
  const anchors = [];        // {p, r, lv}
  const tipsDead = [];       // 枯れ梢

  /** 枝 1 本：計算途中でドームへ引き込む → 葉アンカーと枝先端がズレない */
  function twig(from, dir, len, r0, level, parent, opts = {}) {
    const d = dir.clone().normalize();
    const droop = opts.droop ?? (level >= 2 ? 0.30 : level === 1 ? -0.08 : -0.02);
    const mid = from.clone().addScaledVector(d, len * 0.52).add(V(0, len * 0.11 * (opts.up ?? 1), 0));
    const dEnd = V(d.x, d.y - droop, d.z).normalize();
    const to = from.clone().addScaledVector(dEnd, len * 0.8);
    if (opts.fit) { fit(mid, 0.90); fit(to, 0.95); }
    limb(parent, [
      [from.x, from.y, from.z],
      [mid.x, mid.y, mid.z],
      [to.x, to.y, to.z],
    ], rq(r0), rq(r0 * 0.58), level <= 1 ? barkLimb : barkTwig,
      { segs: Math.max(3, Math.min(6, Math.round(len * 5.5))), name: 'branch' + level });
    return { mid, to };
  }

  // 主枝（一次）→ 側枝（二次）→ 小枝（三次）
  const N1 = 4 + (rnd() > 0.55 ? 1 : 0);
  for (let i = 0; i < N1; i++) {
    const a = (i / N1) * 6.283 + range(rnd, -0.3, 0.3) + ph[0] * 0.15;
    const el = range(rnd, 0.55, 1.05);                    // 上向角（rad）
    const L1 = range(rnd, 1.15, 1.78) * (CR / 2.8);
    const dir1 = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const r1 = rBase * 0.44;
    const A = twig(V(lean.x * 0.9, 0.02, lean.z * 0.9), dir1, L1, r1, 0, crown, { up: 1.2, fit: true });
    anchors.push({ p: A.mid, r: 0.34, lv: 1 });
    const N2 = 2 + (rnd() > 0.6 ? 1 : 0);
    for (let j = 0; j < N2; j++) {
      const a2 = a + range(rnd, -1.2, 1.2);
      const el2 = range(rnd, -0.15, 0.72);
      const dir2 = V(Math.cos(a2) * Math.cos(el2), Math.sin(el2) + 0.25, Math.sin(a2) * Math.cos(el2));
      const B = twig(A.to.clone(), dir2, range(rnd, 0.66, 1.05) * (CR / 2.8), r1 * 0.55, 1, crown, { fit: true });
      anchors.push({ p: B.to, r: 0.30, lv: 2 });
      const N3 = 1 + (rnd() > 0.45 ? 1 : 0);
      for (let k = 0; k < N3; k++) {
        const a3 = a2 + range(rnd, -1.5, 1.5);
        const dir3 = V(Math.cos(a3), range(rnd, 0.15, 0.75), Math.sin(a3));
        const C = twig(B.to.clone().addScaledVector(dir2, 0.02), dir3, range(rnd, 0.34, 0.58) * (CR / 2.8), r1 * 0.30, 2, crown, { fit: true });
        anchors.push({ p: C.to, r: 0.24, lv: 3 });
        if (rnd() > 0.80) tipsDead.push(C.to.clone());     // 枯れ梢
      }
    }
  }

  // 立ち枯れた芯止め（間伐残し感）＋ 徒長枝
  const leadY = (H - yFork) * 0.90;
  limb(crown, [[0, 0.02, 0], [range(rnd, -0.1, 0.1), leadY * 0.45, range(rnd, -0.1, 0.1)], [0.06, leadY, -0.04]], rq(rBase * 0.34), rq(rBase * 0.09), barkLimb, { segs: 5, name: 'leader' });
  for (let i = 0; i < 3; i++) {
    const a = rnd() * 6.283;
    const S = twig(V(Math.cos(a) * 0.12, 0.04, Math.sin(a) * 0.12), V(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3), range(rnd, 0.8, 1.3) * (H / 4.2), rBase * 0.18, 1, crown, { up: 1.6, droop: 0.05, fit: true });
    anchors.push({ p: S.to, r: 0.26, lv: 2 });
  }

  // 枝下の低垂枝（ケヤキの下垂気味の下枝）：葉を暗部階層でまとめて日陰を作る
  const droopAnchors = [];
  const ND = 3;
  for (let i = 0; i < ND; i++) {
    const a = (i / ND) * 6.283 + 0.7 + rnd() * 0.4;
    const by = yFork * range(rnd, 0.34, 0.50);                    // 幹の低い位置から出る
    const L = range(rnd, 0.55, 0.85) * (CR / 2.8);
    const px = (f) => Math.cos(a) * (rBase * 0.5 + L * f);
    const pz = (f) => Math.sin(a) * (rBase * 0.5 + L * f);
    const pts = [
      V(px(0), by + 0.02, pz(0)),
      V(px(0.34), by + 0.12, pz(0.34)),
      V(px(0.7), by + 0.02, pz(0.7)),
      V(px(1), Math.max(0.46, by - L * 0.55), pz(1)),
    ];
    limb(g, pts.map((p) => [p.x, p.y, p.z]), rq(rBase * 0.26), rq(rBase * 0.07), barkLimb, { segs: 6, name: 'droop' });
    // 吊り下がる小枝（地面に届かないよう下限を確保）
    for (let k = 1; k < 4; k++) {
      const t = pts[k];
      const a2 = a + range(rnd, -1.1, 1.1);
      const drop = Math.min(0.28, Math.max(0.10, t.y - 0.36));
      const tip = V(t.x + Math.cos(a2) * 0.16, t.y - drop, t.z + Math.sin(a2) * 0.16);
      limb(g, [
        [t.x, t.y, t.z],
        [(t.x + tip.x) / 2, t.y - drop * 0.45, (t.z + tip.z) / 2],
        [tip.x, tip.y, tip.z],
      ], rq(rBase * 0.09), 0.012, barkTwig, { segs: 3, name: 'droopTwig' });
      droopAnchors.push(tip);
    }
  }

  /* ---------------- 枯れ梢（地上部に残す茶色い枝） ---------------- */
  for (const p of tipsDead) {
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.283;
      limb(crown, [
        [p.x, p.y, p.z],
        [p.x + Math.cos(a) * 0.12, p.y + 0.1, p.z + Math.sin(a) * 0.12],
        [p.x + Math.cos(a) * 0.24, p.y + 0.13, p.z + Math.sin(a) * 0.24],
      ], 0.016, 0.005, barkDead, { segs: 2, name: 'deadTip' });
    }
  }

  /* ---------------- 葉カード（階層別 inst・枚数は seed で決まる） ---------------- */
  const cards = [[], [], [], [], []];
  const put = (p, tier, s, rot) => cards[tier].push({ p, s, rot });
  for (const an of anchors) {
    if (rnd() > 0.90) continue;                             // 透かし（樹冠に隙間）
    const hRel = (an.p.y + yFork) / Y_TOP;                  // 天端に近いほど明るい階層
    const axz = Math.hypot(an.p.x, an.p.z) / CR;
    const n = 5 + Math.round(rnd() * 8 * (0.6 + an.lv * 0.2));
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.6) * an.r * 1.5;
      const p = V(an.p.x + Math.cos(a) * rr, an.p.y + range(rnd, -0.16, 0.22), an.p.z + Math.sin(a) * rr);
      let tier;
      const q = rnd();
      if (hRel > 0.78 && axz > 0.45 && q > 0.42) tier = 0;
      else if (hRel > 0.5 && q > 0.30) tier = 1;
      else if (q > 0.22) tier = 2;
      else if (q > 0.09) tier = 3;
      else tier = 4;
      if (an.lv === 3 && tier === 3) tier = 2;              // 小枝先は暗部にしない
      put(p, tier, range(rnd, 0.55, 1.15), V(range(rnd, -2.1, 2.1), rnd() * 6.283, range(rnd, -1.1, 1.1)));
    }
  }
  for (const p of droopAnchors) {
    const n = 4 + Math.round(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.6) * 0.2;
      put(V(p.x + Math.cos(a) * rr, Math.max(0.52, p.y + range(rnd, -0.12, 0.1)), p.z + Math.sin(a) * rr),
        rnd() > 0.55 ? 3 : 2, range(rnd, 0.5, 0.85), V(range(rnd, -1.25, 1.25), rnd() * 6.283, range(rnd, -0.5, 0.5)));
    }
  }
  const foliage = grp('foliage');
  g.add(foliage);
  TIERS.forEach((t, ti) => {
    const arr = cards[ti];
    if (!arr.length) return;
    const im = inst(t.geo, t.mat, arr.length, (i, d, r, col) => {
      const c = arr[i];
      const s = c.s * t.size / 0.34;
      const sx = rq(s * range(r, 0.86, 1.14)), sy = rq(s * range(r, 0.84, 1.2));
      _eu.set(c.rot.x, c.rot.y, c.rot.z, 'XYZ');
      // カードを包む box の 8 隅を回して最低点算出 → 低垂枝の葉が地面を穿たない
      const hw = 0.62 * Math.max(sx, sy) / 2, hh = 0.62 * sy;
      let lo = 0;
      for (const fx of [-hw, hw]) for (const fy of [0, hh]) for (const fz of [-hw, hw]) {
        _v.set(fx, fy, fz).applyEuler(_eu);
        if (_v.y < lo) lo = _v.y;
      }
      d.position.set(c.p.x, Math.max(c.p.y, 0.02 - lo), c.p.z);
      d.rotation.set(c.rot.x, c.rot.y, c.rot.z);
      d.scale.set(sx, sy, 1);
      const k = 0.86 + r() * 0.26;
      col.setRGB(k * (0.96 + r() * 0.08), k * (0.99 + r() * 0.06), k * (0.9 + r() * 0.1));
    }, { name: 'leaf-' + ti, cast: true, receive: false });
    foliage.add(im);
  });

  /* ---------------- 株元：洗出し砂利・土輪・落葉 ---------------- */
  const rootR = Math.max(0.62, rBase * 4.2);
  const soil = mesh(cyl(rq(rootR), rq(rootR * 1.04), 0.045, 24), matSoil, { pos: [0, 0.014, 0], name: 'root-soil' });
  g.add(soil);
  const gravel = mesh(tor(rq(rootR * 0.97), 0.035, 5, 18), matGravel, { pos: [0, 0.03, 0], rot: [Math.PI / 2, 0, 0], name: 'gravel-ring' });
  g.add(gravel);
  const pebble = cardGeo(0.05, 0.03, 0.01);
  g.add(inst(pebble, matGravel, 46, (i, d, r) => {
    const a = r() * 6.283, rr = Math.sqrt(r()) * rootR * 0.95;
    d.position.set(Math.cos(a) * rr, 0.036 + r() * 0.01, Math.sin(a) * rr);
    d.rotation.set(-Math.PI / 2 + range(r, -0.4, 0.4), r() * 6.283, 0);
    const s = range(r, 0.5, 1.6); d.scale.set(s, s, s);
  }, { name: 'pebbles', cast: false, receive: true }));
  // 根元の落葉堆き（前年残し＋春の飛散）
  const litter = cardGeo(0.09, 0.07, 0.02);
  g.add(inst(litter, matBrown, 70, (i, d, r, col) => {
    const a = r() * 6.283, rr = rootR * 0.35 + Math.sqrt(r()) * (rootR * 0.9);
    d.position.set(Math.cos(a) * rr, 0.043 + r() * 0.014, Math.sin(a) * rr);
    d.rotation.set(-Math.PI / 2 + range(r, -0.5, 0.5), r() * 6.283, range(r, -0.6, 0.6));
    const s = range(r, 0.6, 1.3); d.scale.set(s, s, s);
    col.setRGB(0.8 + r() * 0.3, 0.72 + r() * 0.25, 0.55 + r() * 0.2);
  }, { name: 'leaf-litter', cast: false, receive: true }));

  /* ---------------- 支柱（幼い街路樹の標準仕様）＋ 園芸テープ ---------------- */
  const stakeH = H * 0.42;
  for (let i = 0; i < 2; i++) {
    const a = (i / 2) * 6.283 + 0.9 + rnd() * 0.6;
    const topY = stakeH * (0.86 + rnd() * 0.14);
    limb(g, [
      [Math.cos(a) * rootR * 0.62, 0.0, Math.sin(a) * rootR * 0.62],
      [Math.cos(a) * rootR * 0.36, topY * 0.55, Math.sin(a) * rootR * 0.36],
      [Math.cos(a) * 0.1, topY, Math.sin(a) * 0.1],
    ], 0.026, 0.02, matStake, { segs: 4, name: 'stake' });
    // 節
    for (let s = 1; s < 4; s++) {
      const t = s / 4;
      const y = topY * t;
      const rr2 = rootR * 0.62 * (1 - t) + 0.1 * t;
      const node = mesh(tor(0.028, 0.006, 4, 10), matStake, { pos: [Math.cos(a) * rr2, y, Math.sin(a) * rr2], rot: [Math.PI / 2, 0, 0], name: 'stake-node' });
      g.add(node);
    }
    // 縛り縄（8 時・4 時方向の 2 箇所）
    for (const yy of [topY * 0.62, topY * 0.9]) {
      const rope = mesh(tor(0.075, 0.011, 5, 12), matRope, { pos: [lean.x * (yy / yFork), yy, lean.z * (yy / yFork)], rot: [Math.PI / 2, 0, 0], name: 'tie' });
      rope.rotation.z = rnd() * 1.2;
      g.add(rope);
    }
  }

  /* ---------------- 経年・傷み（3 箇所以上） ---------------- */
  // 1) 根回りの土跳ね・踏み固め跡（+Z 側＝通行側）
  weather(g, { kind: 'dirt', w: rootR * 2.4, h: rootR * 2.0, pos: [0, 0.048, 0], rot: [-Math.PI / 2, 0, 0], color: '#4a3f2d', opacity: 0.5, seed: seed + 5, density: 1.3, count: 2, spread: 0.1 });
  // 2) 樹皮剥離（陽当たり側の捲げ）
  weather(g, { kind: 'chip', w: 0.26, h: 0.6, pos: [rBase * 0.92, yFork * 0.5, rBase * 0.2], rot: [0, -1.1, 0.1], color: '#cbb69a', opacity: 0.55, seed: seed + 9, density: 1.1 });
  // 3) 北側の苔（地上 0 に着く縦長バンド：下面が地中に潜らないよう高さを管理）
  weather(g, { kind: 'moss', w: 0.42, h: 0.74, pos: [-rBase * 0.85, 0.44, -rBase * 0.35], rot: [0, 1.2, 0], color: PAL.moss, opacity: 0.5, seed: seed + 13, density: 1.5, count: 2, spread: 0.03 });
  // 4) 剪定跡（前年落とした太枝の断面＋巻皮）
  const cutY = yFork * 0.62, cutA = 2.4;
  const cut = mesh(cyl(0.052, 0.055, 0.05, 12), MAT.wood({ light: '#d9c9a4', dark: '#b09770' }), { pos: [Math.cos(cutA) * rBase * 0.9, cutY, Math.sin(cutA) * rBase * 0.9], name: 'prune-cut' });
  cut.quaternion.setFromUnitVectors(UP, V(Math.cos(cutA), 0.35, Math.sin(cutA)).normalize());
  g.add(cut);
  const cutRing = mesh(tor(0.055, 0.008, 4, 12), barkLimb, { pos: [cut.position.x, cut.position.y, cut.position.z], name: 'prune-ring' });
  cutRing.quaternion.copy(cut.quaternion);
  g.add(cutRing);
  // 5) 幹に巻いた残置紐（古びたビニール紐）
  const vine = mesh(tor(rBase * 1.08, 0.008, 4, 14), MAT.rubber('#6d6a5f'), { pos: [lean.x * 0.3, yFork * 0.3, lean.z * 0.3], rot: [Math.PI / 2, 0, 0.4], name: 'old-tie' });
  g.add(vine);

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
