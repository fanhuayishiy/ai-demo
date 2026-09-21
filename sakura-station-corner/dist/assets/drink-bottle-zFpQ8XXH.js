import { g as grp, M as MAT, o as lathe, n as range, m as mesh, U as circ, c as cyl, T as TEX, D as DoubleSide, V as Vector3, z as rand, t as tor, w as weather, ac as Box3 } from './index-B3pU02Rl.js';

//  assets/products/drink-bottle.js —— PET 飲料ボトル（500ml・11 variant）
//  構成：車削（lathe）ボディ＝底ドーム＋ヒール＋膨らみ＋肩部／ねじ首・サポートリング／
//        キャップ（ローレット・タンパーリング付き）／収缩膜ラベル（品名・配色が逐種異なる）／
//        中身液体（充填面つき）／フィルムのテカり・指紋・へこみ・潰れ・色褪せ。
//  契約：原点＝底面中心、+Y 上、正面 +Z、meta.real 厳守、finish() を呼ばない。

const meta = {
  id: 'drink-bottle',
  real: [0.066, 0.225, 0.066],
  origin: 'ground-center',
  variants: ['tea', 'cola', 'water', 'orange', 'milk', 'coffee', 'grape', 'sport', 'green', 'malt', 'yogurt'],
};
const VARIANTS = meta.variants;

/* ------------------------------------------------------------------ 仕様表 */
const lerp = (a, b, t) => a + (b - a) * t;

const SPEC = {
  tea: {
    name: '緑茶', sub: 'SENCHA', ml: '500ml', a: '#2e7d4f', b: '#e9f2df',
    cap: '#1d6b41', capStyle: 'std', liquid: '#c9dc6e', op: 0.86, fill: 0.795,
    body: [[0.0312, 0.0160], [0.0322, 0.0270], [0.0322, 0.0450], [0.0292, 0.0580], [0.0288, 0.0670],
      [0.0320, 0.0830], [0.0322, 0.0980], [0.0300, 0.1250], [0.0318, 0.1400], [0.0306, 0.1500]],
    band: [0.0680, 0.1500], rib: 0.5, facet: 0, defect: 'dent', sat: 1.04,
  },
  cola: {
    name: '炭酸', sub: 'COLA', ml: '500ml', a: '#b3271f', b: '#f4ddd0',
    cap: '#a8241c', capStyle: 'std', liquid: '#3a1a0c', op: 0.93, fill: 0.780,
    body: [[0.0314, 0.0160], [0.0322, 0.0300], [0.0314, 0.0520], [0.0322, 0.0720], [0.0322, 0.1060],
      [0.0304, 0.1300], [0.0318, 0.1440], [0.0300, 0.1530]],
    band: [0.0620, 0.1440], rib: 0.9, facet: 0, defect: 'faded', sat: 0.92,
  },
  water: {
    name: '天然水', sub: 'NATURAL WATER', ml: '500ml', a: '#3f97d1', b: '#e6f4fb',
    cap: '#2b78b5', capStyle: 'std', liquid: '#dff0f4', op: 0.55, fill: 0.845,
    body: [[0.0316, 0.0160], [0.0322, 0.0260], [0.0318, 0.0660], [0.0322, 0.0740], [0.0318, 0.1160],
      [0.0322, 0.1240], [0.0312, 0.1520]],
    band: [0.0930, 0.1320], rib: 0.35, facet: 0, defect: 'condense', sat: 1.0,
  },
  orange: {
    name: 'オレンジ', sub: 'PULP 30%', ml: '500ml', a: '#e8912a', b: '#fdf0d8',
    cap: '#dd7f1e', capStyle: 'std', liquid: '#f0a52c', op: 0.92, fill: 0.765,
    body: [[0.0310, 0.0160], [0.0322, 0.0330], [0.0310, 0.0470], [0.0322, 0.0620], [0.0322, 0.1040],
      [0.0298, 0.1240], [0.0322, 0.1400], [0.0302, 0.1520]],
    band: [0.0600, 0.1400], rib: 0.75, facet: 0.18, defect: 'dent', sat: 1.08,
  },
  milk: {
    name: '牛乳', sub: 'FRESH MILK', ml: '500ml', a: '#3b6fa8', b: '#f7f6ef',
    cap: '#1f5f9c', capStyle: 'wide', liquid: '#f8f4ea', op: 0.98, fill: 0.800,
    body: [[0.0318, 0.0160], [0.0324, 0.0280], [0.0324, 0.0980], [0.0310, 0.1180], [0.0320, 0.1340],
      [0.0296, 0.1460]],
    band: [0.0480, 0.1360], rib: 0.25, facet: 0, defect: 'scuff', sat: 1.0,
  },
  coffee: {
    name: 'カフェオレ', sub: 'CAFE AU LAIT', ml: '500ml', a: '#7a5133', b: '#efe0cb',
    cap: '#5d3a22', capStyle: 'std', liquid: '#c9a279', op: 0.95, fill: 0.790,
    body: [[0.0312, 0.0160], [0.0322, 0.0300], [0.0316, 0.0600], [0.0322, 0.0860], [0.0306, 0.1120],
      [0.0320, 0.1360], [0.0300, 0.1510]],
    band: [0.0640, 0.1360], rib: 0.6, facet: 0, defect: 'faded', sat: 0.9,
  },
  grape: {
    name: 'ぶどう', sub: 'KYOHU JUICE', ml: '500ml', a: '#6d3f8a', b: '#f0e2f2',
    cap: '#5c2f78', capStyle: 'std', liquid: '#8b4a9e', op: 0.9, fill: 0.770,
    body: [[0.0310, 0.0160], [0.0320, 0.0300], [0.0320, 0.1040], [0.0300, 0.1260], [0.0318, 0.1420],
      [0.0298, 0.1520]],
    band: [0.0580, 0.1420], rib: 0.3, facet: 0.85, defect: 'crush', sat: 1.05,
  },
  sport: {
    name: 'スポーツ', sub: 'ION DRINK', ml: '500ml', a: '#0f8fa4', b: '#e4f6f8',
    cap: '#0d7f93', capStyle: 'sport', liquid: '#b6dfe2', op: 0.72, fill: 0.760,
    body: [[0.0314, 0.0160], [0.0322, 0.0280], [0.0322, 0.0480], [0.0282, 0.0620], [0.0280, 0.0760],
      [0.0322, 0.0920], [0.0322, 0.1180], [0.0290, 0.1300], [0.0290, 0.1380], [0.0318, 0.1500], [0.0288, 0.1580]],
    band: [0.0780, 0.1280], rib: 0.45, facet: 0.55, defect: 'dent', sat: 1.06, rim: 0.2005,
  },
  green: {
    name: '青汁', sub: 'GREEN VEGETABLE', ml: '500ml', a: '#4e8f2c', b: '#e9f3d6',
    cap: '#3d7a22', capStyle: 'std', liquid: '#7fae3a', op: 0.95, fill: 0.785,
    body: [[0.0316, 0.0160], [0.0322, 0.0260], [0.0320, 0.0700], [0.0322, 0.0800], [0.0320, 0.1220],
      [0.0322, 0.1320], [0.0304, 0.1510]],
    band: [0.0560, 0.1340], rib: 0.8, facet: 0, defect: 'scuff', sat: 1.02,
  },
  malt: {
    name: '麦とろろ', sub: 'MALT SOURCED', ml: '500ml', a: '#8a5a26', b: '#f3e6cf',
    cap: '#6d4219', capStyle: 'wide', liquid: '#4a2a14', op: 0.94, fill: 0.770,
    body: [[0.0310, 0.0165], [0.0324, 0.0320], [0.0310, 0.0440], [0.0324, 0.0580], [0.0310, 0.0700],
      [0.0324, 0.0840], [0.0324, 0.1120], [0.0296, 0.1320], [0.0316, 0.1460]],
    band: [0.0560, 0.1460], rib: 1.0, facet: 0.25, defect: 'crush', sat: 0.95,
  },
  yogurt: {
    name: '飲むヨーグルト', sub: 'MILD YOGURT', ml: '400ml', a: '#d98fa8', b: '#fdf3f5',
    cap: '#c76f8e', capStyle: 'wide', liquid: '#f5ead9', op: 0.98, fill: 0.720,
    body: [[0.0318, 0.0160], [0.0326, 0.0300], [0.0326, 0.0920], [0.0306, 0.1160], [0.0316, 0.1320],
      [0.0280, 0.1480]],
    band: [0.0460, 0.1320], rib: 0.2, facet: 0, defect: 'dent', sat: 1.0,
  },
};

/* --------------------------------------------------------- ジオメトリ生成 */
/** 縦断面（底ドーム → ヒール → 側壁 → 肩 → ねじ首 → rim） */
function profileOf(sp) {
  const p = [];
  const dome = 0.0112;
  p.push([0.0000, dome], [0.0092, dome - 0.0012], [0.0158, dome - 0.0040], [0.0196, 0.0028],
    [0.0204, 0.0000], [0.0228, 0.0022], [0.0268, 0.0072], [0.0292, 0.0122]);
  for (const [r, y] of sp.body) p.push([r, y]);
  // ---- 肩（滑らかに絞り） ----
  const [rLast, yLast] = sp.body[sp.body.length - 1];
  const rim = sp.rim ?? 0.2062;
  const yNeck0 = rim - 0.0200;
  const rNeck = 0.0110;
  const n = 7;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    p.push([lerp(rLast, rNeck, Math.pow(t, 1.55)), lerp(yLast, yNeck0, t)]);
  }
  // ---- ねじ・サポートリング・rim ----
  const y = yNeck0;
  p.push(
    [0.0102, y + 0.0016], [0.0131, y + 0.0038], [0.0100, y + 0.0062], [0.0128, y + 0.0086],
    [0.0100, y + 0.0110], [0.0144, y + 0.0126], [0.0102, y + 0.0142], [0.0106, y + 0.0176],
    [0.0090, y + 0.0198], [0.0088, y + 0.0178], [0.0, y + 0.0174],
  );
  return p;
}
/** 断面半径の補間参照 */
function rAt(prof, y) {
  for (let i = 1; i < prof.length; i++) {
    if (prof[i][1] >= y) {
      const [r0, y0] = prof[i - 1], [r1, y1] = prof[i];
      const t = y1 - y0 > 1e-6 ? (y - y0) / (y1 - y0) : 0;
      return lerp(r0, r1, Math.min(1, Math.max(0, t)));
    }
  }
  return prof[prof.length - 1][0];
}
/** 円筒面に沿って做旧平面を置く（四隅がシルエットを超えないよう自動で引っ込める） */
function band(parent, { prof, y, ang, w, h, keep = 0.0006, kind = 'chip', color = '#eaeaea', opacity = 0.5, seed = 1, density = 1.4, count = 1, tilt = 0 }) {
  const R = Math.max(0.004, rAt(prof, y) + keep);
  const inset = Math.min(0.010, (0.27 * w * w) / R + (h / 2) * Math.abs(Math.sin(tilt)) + 0.0018);
  const rr = Math.max(0.002, R - inset);
  return weather(parent, {
    w, h, pos: [Math.sin(ang) * rr, y, Math.cos(ang) * rr], rot: [tilt, ang, 0],
    kind, color, opacity, seed, density, count, spread: 0.0012,
  });
}
/** ボディ轮廓に沿った帯（収缩膜）用プロファイル：y を等間見にサンプル */
function bandProfile(prof, y0, y1, inset, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, y1, i / n);
    pts.push([Math.max(0.0012, rAt(prof, y) + inset), y]);
  }
  return pts;
}
/** 頂点変位（fn が {s: 半径倍, r: 半径加算, y: 上下} を返す） */
function displace(geo, fn) {
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const d = fn(v);
    if (!d) continue;
    let x = v.x, z = v.z, y = v.y;
    if (d.s != null) { x *= d.s; z *= d.s; }
    if (d.r != null) {
      const L = Math.hypot(v.x, v.z);
      if (L > 1e-6) { const k = Math.max(0, L + d.r) / L; x = v.x * k; z = v.z * k; }
    }
    if (d.y != null) y += d.y;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
/** 角丸四角断面（k=0 円 → k=1 角丸四角）。正面 +Z が平坦面になる */
function facetFn(k, nExp = 4.4) {
  const maxR = Math.pow(Math.pow(0.7071, nExp) * 2, -1 / nExp);
  return (v) => {
    const a = Math.atan2(v.x, v.z) - Math.PI / 4;
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const rho = 1 / Math.pow(Math.pow(c, nExp) + Math.pow(s, nExp), 1 / nExp);
    return { s: 1 + (rho / maxR - 1) * k };
  };
}
/** 局所的なくぼみ（潰れ） */
function dentFn(dent) {
  const [ang, cy, rz, amt] = dent;
  const dx = Math.sin(ang), dz = Math.cos(ang);
  return (v) => {
    const along = v.x * dx + v.z * dz;
    if (along <= 0) return null;
    const g = Math.exp(-((v.y - cy) ** 2) / (rz * rz * 0.5)) * Math.exp(-((along - 0.028) ** 2) / 0.0026);
    if (g < 0.02) return null;
    return { r: -amt * g };
  };
}
/** 片側だけ潰れたへこみ（横縮み） */
function crushFn(sp) {
  return (v) => {
    if (v.z < 0.004) return null;
    const g = Math.exp(-((v.y - 0.098) ** 2) / 0.0042) * Math.exp(-((Math.abs(v.x) - 0.024) ** 2) / 0.0022);
    return { r: -52e-4 * g };
  };
}
/** キャップ（ローレット・天面刻印・タンパーリング） */
function capGroup(sp, rnd, seed) {
  const g = grp('cap');
  const rim = sp.rim ?? 0.2062;
  const style = sp.capStyle;
  const top = 0.2250;
  const rOut = style === 'wide' ? 0.0170 : style === 'sport' ? 0.0144 : 0.0156;
  const skirtBottom = style === 'sport' ? rim - 0.0055 : rim - 0.0012;
  const capTop = style === 'sport' ? top - 0.0075 : top;
  const capMat = MAT.plastic(sp.cap, { spec: 0.42, specPower: 52, specCut: 0.2, sat: 1.02 });
  const pts = [
    [0, capTop], [rOut - 0.0042, capTop], [rOut - 0.0022, capTop - 0.0016], [rOut, capTop - 0.0042],
    [rOut, skirtBottom + 0.0030], [rOut - 0.0006, skirtBottom + 0.0008], [rOut - 0.0008, skirtBottom],
    [rOut - 0.0052, skirtBottom - 0.0006], [rOut - 0.0056, skirtBottom + 0.0050], [0, skirtBottom + 0.0054],
  ];
  const geo = displace(lathe(pts, 24), (v) => (v.y > skirtBottom + 0.001 && v.y < capTop - 0.004
    ? { r: 0.00062 * Math.sin(22 * Math.atan2(v.x, v.z)) } : null));
  g.add(mesh(geo, capMat, { name: 'cap' }));
  // 天面の刻印リング（型抜き）
  g.add(mesh(tor(rOut - 0.0062, 0.00075, 5, 20), capMat, { name: 'cap-mark', pos: [0, capTop - 0.0004, 0], rot: [-Math.PI / 2, 0, 0], cast: false }));
  if (style === 'sport') {
    // ポップアップ式ノズル（先端が缶高の上限 0.225 にちょうど収まる）
    const nMat = MAT.plastic('#e9e5da', { spec: 0.4 });
    g.add(mesh(cyl(0.0064, 0.0074, 0.0050, 14), capMat, { name: 'nozzle-base', pos: [0, capTop + 0.0022, 0] }));
    g.add(mesh(cyl(0.0046, 0.0058, 0.0028, 12), nMat, { name: 'nozzle', pos: [0, capTop + 0.0061, 0] }));
    g.add(mesh(tor(0.0048, 0.0006, 5, 14), nMat, { name: 'nozzle-ring', pos: [0, capTop + 0.0067, 0], rot: [-Math.PI / 2, 0, 0], cast: false }));
  }
  // タンパーリング（開封で切れるブリッジ：1 本欠けている個体あり）
  const ringY = skirtBottom - 0.0034;
  const ringMat = MAT.plastic(sp.cap, { spec: 0.3, sat: 0.86, tint: '#fff2e6' });
  g.add(mesh(cyl(rOut - 0.0006, rOut + 0.0004, 0.0040, 22, true), ringMat, { name: 'tamper-ring', pos: [0, ringY, 0], cast: false }));
  g.add(mesh(tor(rOut - 0.0002, 0.0007, 5, 20), ringMat, { pos: [0, ringY + 0.0020, 0], rot: [-Math.PI / 2, 0, 0], cast: false }));
  const bridges = 5;
  for (let i = 0; i < bridges; i++) {
    const a = (i / bridges) * Math.PI * 2 + 0.4;
    g.add(mesh(cyl(0.0011, 0.0011, 0.0030, 6), ringMat, {
      pos: [Math.sin(a) * (rOut - 0.001), skirtBottom - 0.0006, Math.cos(a) * (rOut - 0.001)], cast: false,
    }));
  }
  if (rnd() > 0.45) {
    // 既に切れたリング（1 箇所めくれ）
    weather(g, { w: 0.012, h: 0.006, pos: [rOut * 0.8, ringY - 0.0018, rOut * 0.55], rot: [0, Math.atan2(rOut * 0.8, rOut * 0.55), 0], kind: 'chip', color: sp.cap, opacity: 0.6, seed: seed + 7, density: 1.2, spread: 0.001 });
  }
  return g;
}
/** 中身液体（充填面つき車削） */
function liquidMesh(sp, prof, matShell) {
  const fill = sp.fill;
  const maxY = 0.0140 + 0.1320 * fill;
  const inset = 0.0019;
  const pts = [];
  for (const [r, y] of prof) {
    if (y > maxY) break;
    pts.push([Math.max(0, r - inset), y + (y < 0.0125 ? 0.0016 : 0)]);
  }
  const rf = Math.max(0.002, rAt(prof, maxY) - inset);
  pts.push([rf, maxY], [0, maxY]);
  const geo = lathe(pts, 16);
  const msh = mesh(geo, matShell, { name: 'liquid', cast: false });
  // 液面（メニスカス）：光る楕円
  msh.userData.meniscus = maxY;
  return msh;
}

/* ---------------------------------------------------------------- build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'tea');
  const sp = SPEC[key] || SPEC.tea;
  const sc = options.scale ?? 1;

  const g = grp('drink-bottle');

  /* ---- マテリアル ---- */
  const pete = MAT.glassLite({
    color: options.tint ?? '#eef8f8',
    opacity: sp.defect === 'condense' ? 0.26 : 0.30,
    spec: 1.0, specPower: 240, specCut: 0.05, sheen: 0.34, rim: 0.42, steps: 2,
  });
  const liquidMat = MAT.paint(sp.liquid, {
    transparent: true, opacity: sp.op, depthWrite: sp.op > 0.9,
    spec: 0.7, specPower: 150, specCut: 0.12, shadowAmt: 0.46, steps: 3, sat: 1.12, rim: 0.24,
    shadowTint: '#8fa2c4',
  });

  /* ---- ボディ ---- */
  const prof = profileOf(sp);
  let shellGeo = lathe(prof, 22);
  shellGeo = displace(shellGeo, (v) => {
    let s = 1, dr = 0;
    if (sp.facet) {
      const a = Math.atan2(v.x, v.z) - Math.PI / 4;
      const c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a));
      const rho = 1 / Math.pow(Math.pow(c, 4.4) + Math.pow(sn, 4.4), 1 / 4.4);
      s *= 1 + (rho / 1.1910 - 1) * sp.facet;
    }
    // 下部の水平リブ（型割りの沟）
    if (v.y > 0.018 && v.y < 0.070) dr += -42e-5 * sp.rib * (0.5 + 0.5 * Math.sin(v.y * 205));
    // 縦の微細な収縮あと
    dr += 0.00016 * Math.sin(9 * Math.atan2(v.x, v.z));
    const out = { s };
    if (dr) out.r = dr;
    return out;
  });
  if (sp.defect === 'dent') shellGeo = displace(shellGeo, dentFn([range(rnd, -1, 1.0) + (rnd() > 0.5 ? 0.4 : -2.4), range(rnd, 0.055, 0.125), 0.020, range(rnd, 0.0038, 0.0062)]));
  if (sp.defect === 'crush') shellGeo = displace(shellGeo, crushFn());
  const shell = mesh(shellGeo, pete, { name: 'pet-shell', renderOrder: 6 });
  g.add(shell);

  /* ---- 中身 ---- */
  const liq = liquidMesh(sp, prof, liquidMat);
  g.add(liq);
  // 液面の白いテカり
  const my = liq.userData.meniscus;
  const mr = Math.max(0.004, rAt(prof, my) - 0.0022);
  g.add(mesh(circ(mr, 20), MAT.paint('#ffffff', { transparent: true, opacity: 0.22, depthWrite: false, spec: 1, steps: 2 }), {
    name: 'meniscus', pos: [0, my + 0.0006, 0], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false, renderOrder: 7,
  }));
  // 気泡（上部に 2〜3 個）
  for (let i = 0; i < 3; i++) {
    const a = range(rnd, 0, Math.PI * 2), rr = range(rnd, 0.004, 0.013);
    g.add(mesh(cyl(0.0022, 0.0022, 0.0012, 8), MAT.paint('#ffffff', { transparent: true, opacity: 0.5, depthWrite: false, spec: 1, steps: 2 }), {
      pos: [Math.sin(a) * rr, my - 0.0016 - i * 0.0008, Math.cos(a) * rr], cast: false, receive: false, renderOrder: 8,
    }));
  }

  /* ---- 収缩膜ラベル（ボディ轮廓に追従する帯） ---- */
  const [b0, b1] = sp.band;
  const labTex = TEX.drinkLabel({ name: sp.name, sub: sp.sub, ml: sp.ml, a: sp.a, b: sp.b, kind: 'bottle' });
  const labMat = MAT.poster({
    map: labTex, side: DoubleSide, uv: { offset: [0.5, 0] },
    steps: 3, sat: sp.sat, shadowAmt: 0.62, spec: 0.30, specPower: 74, specCut: 0.2,
  });
  const labGeo = displace(lathe(bandProfile(prof, b0, b1, 0.0004, 16), 24), (v) => {
    const a = Math.atan2(v.x, v.z);
    return { r: 0.00016 * Math.sin(6.5 * a + 0.8) + 0.00010 * Math.sin(15 * a) };
  });
  if (sp.facet) displace(labGeo, facetFn(sp.facet));
  g.add(mesh(labGeo, labMat, { name: 'shrink-label', renderOrder: 3 }));
  // フィルム被膜（ラベル上下のエッジとテカり帯）
  const filmMat = MAT.glassLite({ color: '#ffffff', opacity: 0.16, spec: 1, specPower: 260, specCut: 0.04, sheen: 0.5, rim: 0.5, steps: 2 });
  const filmGeo = lathe(bandProfile(prof, b0 - 0.006, b1 + 0.006, 0.0006, 12), 20);
  displace(filmGeo, (v) => {
    const a = Math.atan2(v.x, v.z);
    return { r: 0.0002 * Math.sin(4.5 * a + 2.1) };
  });
  if (sp.facet) displace(filmGeo, facetFn(sp.facet));
  g.add(mesh(filmGeo, filmMat, { name: 'film', cast: false, receive: false, renderOrder: 9 }));
  // フィルム重なり seam（側面に縦線）
  const seamA = 2.35;
  g.add(mesh(cyl(0.0005, 0.0005, b1 - b0, 5), MAT.plastic('#dcdcd2', { transparent: true, opacity: 0.55, depthWrite: false }), {
    name: 'seam', pos: [Math.sin(seamA) * (rAt(prof, (b0 + b1) / 2) + 0.0009), (b0 + b1) / 2, Math.cos(seamA) * (rAt(prof, (b0 + b1) / 2) + 0.0009)],
    rot: [0, seamA, 0], cast: false, receive: false,
  }));

  /* ---- キャップ ---- */
  g.add(capGroup(sp, rnd, seed));

  /* ---- 経年・欠陥 ---- */
  // 指紋・手あか（PET 肩部）
  band(g, { prof, y: 0.166, ang: 0.42, w: 0.020, h: 0.018, kind: 'scratch', color: '#ffffff', opacity: 0.20, seed: seed + 31, density: 1.4 });
  band(g, { prof, y: 0.126, ang: -1.24, w: 0.018, h: 0.024, kind: 'dirt', color: '#cfd6cf', opacity: 0.24, seed: seed + 32, density: 1.1 });
  // 棚擦れ（底のヒール）
  band(g, { prof, y: 0.0135, ang: 0.05, w: 0.024, h: 0.011, keep: 0.0018, kind: 'chip', color: '#eaeaea', opacity: 0.28, seed: seed + 33, density: 1.6 });
  if (sp.defect === 'faded') {
    // ラベル色褪せ（太陽側だけ退色）
    band(g, { prof, y: (b0 + b1) / 2 + 0.012, ang: 1.45, w: 0.022, h: Math.min(0.032, (b1 - b0) * 0.7), kind: 'dirt', color: '#fff2dc', opacity: 0.42, seed: seed + 34, density: 1.0 });
  }
  if (sp.defect === 'scuff') {
    // 棚から出す時のこすり傷
    band(g, { prof, y: 0.104, ang: -0.38, w: 0.018, h: 0.055, kind: 'scratch', color: '#f4f4f4', opacity: 0.34, seed: seed + 35, density: 2.0, count: 2 });
  }
  if (sp.defect === 'condense') {
    // 冷結露（水滴を小球で打つ）
    for (let i = 0; i < 9; i++) {
      const a = range(rnd, -1.1, 1.1), y = range(rnd, 0.030, 0.150);
      const r = Math.max(0.004, rAt(prof, y) - 0.0006);
      g.add(mesh(cyl(0.0010, 0.0014, 0.0020, 6), MAT.water({ opacity: 0.7 }), {
        pos: [Math.sin(a) * r, y, Math.cos(a) * r], rot: [Math.PI / 2, 0, 0], cast: false, receive: false,
      }));
    }
  }
  // 底の影（透明なので弱く）
  g.add(mesh(circ(0.0205, 18), MAT.paint('#9fb6bd', { transparent: true, opacity: 0.18, depthWrite: false, shadowAmt: 1, steps: 2 }), {
    pos: [0, 0.0012, 0], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false,
  }));

  return fitTo(g, [meta.real[0] * sc, meta.real[1] * sc, meta.real[2] * sc]);
}
/** 実体メッシュだけの AABB（做旧・貼花などの平面は寸法に数えない） */
function contentBounds(root) {
  const bb = new Box3();
  const box = new Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.noFit) return;
    if (o.geometry.type === 'PlaneGeometry' && !o.userData.keepFit) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    bb.union(box);
  });
  return bb;
}
/** meta.real へ厳密に正規化（据え付け層が棚割に使える） */
function fitTo(g, size) {
  let bb = contentBounds(g);
  const s = bb.getSize(new Vector3());
  g.scale.set(size[0] / s.x, size[1] / s.y, size[2] / s.z);
  g.updateMatrixWorld(true);
  bb = contentBounds(g);
  const c = bb.getCenter(new Vector3());
  g.position.set(-c.x, -bb.min.y, -c.z);
  return g;
}

const P_BOTTLE = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_BOTTLE as P, build as b };
