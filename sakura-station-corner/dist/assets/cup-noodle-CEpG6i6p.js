import { g as grp, M as MAT, D as DoubleSide, o as lathe, m as mesh, T as TEX, t as tor, h as decal, U as circ, d as coil, n as range, a as sph, c as cyl, b as box, S as Shape, ab as Path, R as ExtrudeGeometry, V as Vector3, B as BufferGeometry, F as Float32BufferAttribute, ac as Box3, k as tubeOf, z as rand } from './index-B1SzF3Mh.js';

//  assets/products/cup-noodle.js —— カップ麺（5 variant）
//  構成：紙カップ（テーパー＋ロールリム＋内面）・側面印刷スリーブ・湯線・注意帯／
//        アルミ蓋（封印 or 前半を剝いて後ろへ折り返した状態）／麺のコイル・かやく・具・スープ面／
//        プラ製スプーン＋固定テープ／棚用フック掛け（紙カードのタブ＋ユーロ穴）／
//        側面のへこみ・焦げ・水跡・色褪せ・リムの打痕。

const meta = {
  id: 'cup-noodle',
  real: [0.095, 0.095, 0.095],
  origin: 'ground-center',
  variants: ['shrimp', 'curry', 'soy', 'miso', 'seafood'],
};
const VARIANTS = meta.variants;

const SZ = 0.095, R_MAX = 0.0470;

const SPEC = {
  shrimp: {
    name: 'エビそば', sub: 'PRAWN SOUP NOODLE', a: '#c8564d', b: '#fbeee0',
    paper: '#f7efdf', soup: '#e8cdaa', noodle: '#e8cf94', lid: 'peeled', hook: false,
    toppers: ['shrimp', 'naruto', 'green', 'carrot'], defect: 'dent',
  },
  curry: {
    name: 'カレーうどん', sub: 'JAPANESE CURRY', a: '#c98b28', b: '#fbf0da',
    paper: '#f4e8cd', soup: '#b78535', noodle: '#e2c98e', lid: 'sealed', hook: true,
    toppers: ['beef', 'green', 'fishcake'], defect: 'scorch',
  },
  soy: {
    name: 'しょうゆ', sub: 'SOY SAUCE RAMEN', a: '#2f5f8a', b: '#eaf1f6',
    paper: '#f2eee2', soup: '#c0904e', noodle: '#e6cf98', lid: 'peeled', hook: false,
    toppers: ['menma', 'egg', 'green', 'nori'], defect: 'watermark',
  },
  miso: {
    name: 'みそ', sub: 'MISO RAMEN', a: '#8b5a2b', b: '#f6ecd8',
    paper: '#efe6d2', soup: '#b0803c', noodle: '#dfc48a', lid: 'sealed', hook: false,
    toppers: ['corn', 'butter', 'bean', 'green'], defect: 'dent',
  },
  seafood: {
    name: 'シーフード', sub: 'SEAFOOD VERMICELLI', a: '#1f7f9c', b: '#e8f5f7',
    paper: '#f4f2e8', soup: '#e2ead6', noodle: '#eee3c8', lid: 'peeled', hook: true,
    toppers: ['squid', 'shrimp', 'broccoli', 'pepper'], defect: 'faded',
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------- ヘルパー */
function cupProfile(fy) {
  const rb = 0.0302, rt = 0.0452;
  const raw = [
    [0, 0.0042], [rb * 0.62, 0.0040], [rb * 0.90, 0.0022], [rb, 0.0000], [rb + 0.0016, 0.0018],
    [rb + 0.0030, 0.0060], [0.0340, 0.0200], [0.0372, 0.0360], [rt * 0.98, 0.0560], [rt, 0.0720],
    [rt + 0.0012, 0.0824], [R_MAX, 0.0864], [R_MAX + 0.0004, 0.0890], [R_MAX - 0.0016, 0.0906],
    [rt - 0.0030, 0.0892], [rt - 0.0034, 0.0840], [rt - 0.0050, 0.0700], [0.0360, 0.0400],
    [0.0310, 0.0180], [0.0268, 0.0090], [0, 0.0082],
  ];
  return raw.map(([r, y]) => [r, y * fy]);
}
function displace(geo, fn) {
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const d = fn(v);
    if (!d) continue;
    let x = v.x, z = v.z, y = v.y;
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
/** 円盤／扇（h = fn(v, a)、a は atan2(z,x)） */
function discGeo(ring, hFn, seg = 30, rows = 5, a0 = 0, a1 = Math.PI * 2) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= seg; i++) {
      const a = lerp(a0, a1, i / seg);
      pos.push(Math.cos(a) * ring * t, hFn(t, a), Math.sin(a) * ring * t);
      uv.push(i / seg, t);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i, c = a + 1, b = a + seg + 1, d = b + 1;
      idx.push(a, b, c, c, b, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** 円弧チューブ（海老の丸まり） */
function torusSeg(r, t, ang, squash = 0.7) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = -ang / 2 + (i / 12) * ang;
    pts.push([Math.cos(a) * r, Math.sin(a) * r * squash, 0]);
  }
  return tubeOf(pts, t, 12, 7);
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'shrimp');
  const sp = SPEC[key] || SPEC.shrimp;
  const sc = options.scale ?? 1;

  const g = grp('cup-noodle');
  const fy = sp.hook ? 0.8850 : 1.0000;                 // フック掛けはカップを低くしてタブの余地を作る
  const prof = cupProfile(fy);
  const rimY = 0.0858 * fy;
  const LID_Y = rimY + (sp.hook ? 0.0032 : 0.0038);
  const SOUP_Y = (sp.lid === 'sealed' ? 0.0760 : 0.0700) * fy;

  /* ---- 素材 ---- */
  const paperOut = MAT.paper({ color: sp.paper, repeat: 3, uv: { repeat: [4, 3] }, spec: 0.12, shadowAmt: 0.78 });
  const paperIn = MAT.paper({ color: '#f8f4ea', repeat: 4, side: DoubleSide, spec: 0.08, shadowAmt: 0.95 });
  const foil = MAT.metal('#e1e4e6', { repeat: 6, spec: 0.84, specPower: 175, sheen: 0.2 });
  const foilIn = MAT.metal('#c5cace', { repeat: 6, spec: 0.62 });

  /* ---- カップ本体 ---- */
  let cupGeo = lathe(prof, 30);
  cupGeo = displace(cupGeo, (v) => {
    const a = Math.atan2(v.x, v.z);
    if (sp.defect === 'dent' && v.y > 0.018 * fy && v.y < 0.070 * fy) {
      const along = v.x * Math.sin(-0.9) + v.z * Math.cos(-0.9);
      const gg = Math.exp(-((v.y - 0.044 * fy) ** 2) / 0.0010) * Math.exp(-((along - 0.034) ** 2) / 0.0010);
      if (gg > 0.02) return { r: -52e-4 * gg };
    }
    return { r: 0.00035 * Math.sin(a * 28 + v.y * 40) };
  });
  g.add(mesh(cupGeo, paperOut, { name: 'cup-shell' }));
  g.add(mesh(lathe(prof.slice(15).map(([r, y]) => [Math.max(0.0005, r - 0.0012), y]), 22), paperIn, {
    name: 'cup-inner', cast: false, receive: false,
  }));

  /* ---- 印刷スリーブ ---- */
  const s0 = 0.0140 * fy, s1 = 0.0790 * fy;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const y = lerp(s0, s1, i / 14);
    pts.push([rAt(prof, y) + 0.0004, y]);
  }
  const sleeveMat = MAT.poster({
    map: TEX.drinkLabel({ name: sp.name, sub: sp.sub, ml: 'めんと具 82g', a: sp.a, b: sp.b, kind: 'cup' }),
    side: DoubleSide, uv: { offset: [0.5, 0] }, steps: 3, sat: sp.defect === 'faded' ? 0.74 : 1.06,
    tint: sp.defect === 'faded' ? '#fff1e0' : '#ffffff', spec: 0.22, specPower: 40, shadowAmt: 0.66,
  });
  g.add(mesh(lathe(pts, 30), sleeveMat, { name: 'print-sleeve', renderOrder: 2 }));
  // 湯線
  for (const [yy, th, op] of [[0.0640 * fy, 0.0005, 0.85], [0.0690 * fy, 0.00035, 0.70]]) {
    g.add(mesh(tor(rAt(prof, yy) + 0.0008, th, 5, 28), MAT.paint('#b9b2a0', { transparent: true, opacity: op, depthWrite: false, steps: 2 }), {
      name: 'fill-line', pos: [0, yy, 0], rot: [-Math.PI / 2, 0, 0], cast: false,
    }));
  }
  decal(g, { map: TEX.adStrip({ text: '火傷注意 熱い!', bg: '#f7e6c8', seed: seed + 5 }), w: 0.0380, h: 0.0130, pos: [0.0, 0.0240 * fy, rAt(prof, 0.0240 * fy) - 0.0008], opacity: 0.95 });

  /* ---- 中身 ---- */
  const foodG = grp('contents');
  g.add(foodG);
  foodG.add(mesh(circ(rAt(prof, SOUP_Y) - 0.0024, 26), MAT.food({ color: sp.soup, spec: 0.58, specPower: 80, transparent: true, opacity: 0.94, shadowAmt: 0.55, steps: 3 }), {
    name: 'broth', pos: [0, SOUP_Y, 0], rot: [-Math.PI / 2, 0, 0], cast: false,
  }));
  const nMat = MAT.food({ color: sp.noodle, spec: 0.44, specPower: 36, specCut: 0.26, shadowAmt: 0.68, steps: 3 });
  foodG.add(mesh(coil(0.0225 * fy, 0.0290 * fy, key === 'seafood' ? 5 : 6, 12, key === 'seafood' ? 0.0026 : 0.0036), nMat, { name: 'noodles', pos: [0, SOUP_Y - 0.0100, 0], cast: false }));
  foodG.add(mesh(coil(0.0150, 0.0170, 4, 10, 0.0032), nMat, { name: 'noodles-2', pos: [0.002, SOUP_Y - 0.0030, -1e-3], rot: [0, 0.7, 0.10], cast: false }));
  for (let i = 0; i < 14; i++) {
    const a = range(rnd, 0, Math.PI * 2), rr = Math.sqrt(rnd()) * 0.027;
    foodG.add(mesh(sph(0.0018, 6, 5), MAT.food({ color: ['#a8bf6a', '#c96a3a', '#d9c9a0', '#7a9a4a'][i % 4], spec: 0.36 }), {
      pos: [Math.cos(a) * rr, SOUP_Y + 0.0016, Math.sin(a) * rr], scale: [1.3, 0.6, 1.1], cast: false,
    }));
  }
  const T = {
    shrimp: (i) => {
      const s = grp('shrimp', { pos: [-0.011 + i * 0.022, SOUP_Y + 0.0052, 0.005 - i * 0.011], rot: [0.4, i * 1.2, 0.2] });
      const mat = MAT.food({ color: '#e8856a', spec: 0.52, specPower: 60, shadowAmt: 0.6, steps: 3 });
      s.add(mesh(torusSeg(0.0100, 0.0034, Math.PI * 1.25), mat, { name: 'shrimp-body', cast: false }));
      s.add(mesh(box(0.0056, 0.0015, 0.0076), MAT.food({ color: '#f3c8b8', spec: 0.44 }), { pos: [0.0082, -1e-3, 0], rot: [0, 0, -0.4], cast: false }));
      for (let k = 0; k < 3; k++) s.add(mesh(box(0.0011, 0.0068, 0.0070), MAT.food({ color: '#d96a52', spec: 0.4 }), { pos: [-38e-4 + k * 0.0034, 0.0026, 0], cast: false, receive: false }));
      return s;
    },
    naruto: () => mesh(cyl(0.0070, 0.0070, 0.0026, 14), MAT.food({ color: '#f7f3ea', spec: 0.4 }), { name: 'naruto', pos: [0.013, SOUP_Y + 0.0038, 0.011], rot: [1.30, 0.2, 0], cast: false }),
    green: (i) => {
      const s = grp('green', { pos: [0.004 + i * 0.005, SOUP_Y + 0.0024, -0.013 + i * 0.009], rot: [0.2, i, 0.1] });
      for (let k = 0; k < 3; k++) s.add(mesh(cyl(0.0017, 0.0017, 0.0012, 7), MAT.food({ color: k ? '#6fa845' : '#e9e4d0', spec: 0.4 }), { pos: [k * 0.0024, 0, k * 0.0011], cast: false }));
      return s;
    },
    carrot: () => mesh(cyl(0.0038, 0.0038, 0.0014, 8), MAT.food({ color: '#e07a28', spec: 0.42 }), { name: 'carrot', pos: [-9e-3, SOUP_Y + 0.0028, -9e-3], rot: [1.2, 0.3, 0], cast: false }),
    beef: (i) => mesh(box(0.0108, 0.0022, 0.0072), MAT.food({ color: '#6b3f2a', spec: 0.42, shadowAmt: 0.7 }), { name: 'beef', pos: [-7e-3 + i * 0.013, SOUP_Y + 0.0032, 0.005 - i * 0.011], rot: [0.2, i * 1.1, 0.1], cast: false }),
    fishcake: () => mesh(box(0.0156, 0.0016, 0.0078), MAT.food({ color: '#f4efe2', spec: 0.42 }), { name: 'fishcake', pos: [0.002, SOUP_Y + 0.0032, -7e-3], rot: [0, 0.4, 0.03], cast: false }),
    menma: () => {
      const s = grp('menma');
      for (let k = 0; k < 3; k++) s.add(mesh(box(0.0164, 0.0020, 0.0032), MAT.food({ color: '#d8c48a', spec: 0.36 }), { pos: [0.004 * k - 0.006, SOUP_Y + 0.0030 + k * 0.0012, 0.007 - k * 0.004], rot: [0, 0.5 + k * 0.2, 0.03], cast: false }));
      return s;
    },
    egg: () => {
      const s = grp('egg', { pos: [0.009, SOUP_Y + 0.0044, 0.004] });
      s.add(mesh(sph(0.0072, 12, 8), MAT.food({ color: '#f7f2e4', spec: 0.44 }), { scale: [1, 0.72, 1], cast: false }));
      s.add(mesh(sph(0.0038, 10, 7), MAT.food({ color: '#e8a33a', spec: 0.5 }), { pos: [0, 0.0034, 0], scale: [1, 0.5, 1], cast: false }));
      return s;
    },
    nori: () => mesh(box(0.0194, 0.0006, 0.0126), MAT.nori({ side: DoubleSide }), { name: 'nori', pos: [-0.011, SOUP_Y + 0.0034, -4e-3], rot: [0.1, 0.3, -0.16], cast: false }),
    corn: () => {
      const s = grp('corn');
      for (let k = 0; k < 8; k++) s.add(mesh(sph(0.0020, 7, 5), MAT.food({ color: '#f0c33c', spec: 0.5 }), { pos: [-8e-3 + (k % 4) * 0.0050, SOUP_Y + 0.0026 + ((k / 4) | 0) * 0.0030, 0.009 + ((k / 4) | 0) * 0.0038], cast: false }));
      return s;
    },
    butter: () => mesh(box(0.0086, 0.0032, 0.0062), MAT.food({ color: '#f2dd8e', spec: 0.5, shadowAmt: 0.6 }), { name: 'butter', pos: [0.006, SOUP_Y + 0.0046, -7e-3], rot: [0, 0.4, 0], cast: false }),
    bean: () => {
      const s = grp('bean');
      for (let k = 0; k < 5; k++) s.add(mesh(sph(0.0025, 7, 5), MAT.food({ color: '#4a5f38', spec: 0.4 }), { pos: [-9e-3 + k * 0.0042, SOUP_Y + 0.0028, -0.013 + (k % 2) * 0.0034], cast: false }));
      return s;
    },
    squid: () => {
      const s = grp('squid');
      for (let k = 0; k < 3; k++) s.add(mesh(box(0.0080, 0.0018, 0.0058), MAT.food({ color: '#efe9dc', spec: 0.5 }), { pos: [0.010 - k * 0.004, SOUP_Y + 0.0030 + k * 0.0010, -6e-3 + k * 0.005], rot: [0.1, 0.6 * k, 0.05], cast: false }));
      return s;
    },
    broccoli: () => {
      const s = grp('broccoli', { pos: [-0.013, SOUP_Y + 0.0038, 0.010] });
      s.add(mesh(cyl(0.0021, 0.0025, 0.0056, 7), MAT.food({ color: '#dfe8cc', spec: 0.34 }), { pos: [0, 0.0020, 0], cast: false }));
      for (let k = 0; k < 4; k++) s.add(mesh(sph(0.0034, 8, 6), MAT.food({ color: '#3f6f38', spec: 0.34 }), { pos: [Math.cos(k * 1.6) * 0.0028, 0.0052, Math.sin(k * 1.6) * 0.0028], scale: [1, 0.7, 1], cast: false }));
      return s;
    },
    pepper: () => {
      const s = grp('pepper');
      for (let k = 0; k < 2; k++) s.add(mesh(box(0.0086, 0.0022, 0.0030), MAT.food({ color: k ? '#3f8a45' : '#c8564d', spec: 0.44 }), { pos: [0.002 + k * 0.008, SOUP_Y + 0.0032, 0.013 - k * 0.004], rot: [0, 0.5 * k, 0.1], cast: false }));
      return s;
    },
  };
  let gi = 0;
  for (const t of sp.toppers) {
    const fn = T[t];
    if (fn) { const o = fn(gi++); if (o) foodG.add(o); }
  }

  /* ---- アルミ蓋 ---- */
  const lidG = grp('lid', { pos: [0, LID_Y, 0] });
  g.add(lidG);
  const ringR = 0.0458;                                      // 蓋のカール（リム内に収める）
  if (sp.lid === 'sealed') {
    lidG.add(mesh(discGeo(ringR, (t, a) => 0.0024 * (1 - t * t) + 0.0004 * Math.sin(a * 22)), foil, { name: 'alu-lid', cast: false }));
    lidG.add(mesh(tor(ringR, 0.0013, 6, 30), foilIn, { name: 'lid-crimp', pos: [0, 0.0004, 0], rot: [-Math.PI / 2, 0, 0] }));
    decal(lidG, { map: TEX.drinkLabel({ name: sp.name, sub: sp.sub, ml: 'めんと具 82g', a: sp.a, b: sp.b, kind: 'cuplid' }), w: ringR * 1.5, h: ringR * 0.72, pos: [0, 0.0030, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.98 });
    lidG.add(mesh(cyl(0.0015, 0.0015, 0.0014, 8), MAT.paint('#4a453c', { steps: 2 }), { name: 'steam-hole', pos: [0.013, 0.0018, -9e-3], cast: false }));
  } else {
    // 前半を剝いて後面へ折り返す
    lidG.add(mesh(discGeo(ringR, (t, a) => 0.0016 * (1 - t * t), 24, 5, Math.PI, Math.PI * 2), foil, { name: 'lid-rest', cast: false }));
    const fold = mesh(discGeo(ringR * 0.97, (t, a) => 0.0012 + 0.0022 * Math.pow(t, 1.8) + 0.0007 * Math.sin(a * 8), 24, 5, Math.PI, Math.PI * 2), foilIn, { name: 'lid-folded', cast: false });
    fold.rotation.x = -0.085;
    fold.position.set(-2e-3, 0.0016, -8e-4);
    lidG.add(fold);
    lidG.add(mesh(tor(ringR, 0.0012, 6, 30, Math.PI), foilIn, { name: 'lid-crimp-back', pos: [0, 0.0002, 0], rot: [-Math.PI / 2, 0, Math.PI] }));
    // 剝ぎ口のギザ刃（前面リム）
    for (let i = 0; i < 16; i++) {
      const a = (i / 15) * Math.PI;
      lidG.add(mesh(box(0.0015, 0.0011, 0.0024), foilIn, { pos: [Math.cos(a) * ringR * 0.985, 0.0006, Math.sin(a) * ringR * 0.985], rot: [0, -a, 0], cast: false, receive: false }));
    }
    // 内側に折れたフタの影（黒ズミ）
    lidG.add(mesh(discGeo(ringR * 0.94, (t, a) => 0.0002, 20, 3, Math.PI, Math.PI * 2), MAT.metal('#8f9498', { spec: 0.4, side: DoubleSide }), { name: 'lid-shadow', pos: [0, -8e-4, 0], cast: false, receive: false }));
  }

  /* ---- スプーンと固定テープ ---- */
  const plastic = MAT.hardPlastic('#efe9dc', { repeat: 5, spec: 0.44 });
  const spoon = grp('spoon', { pos: [0.004, LID_Y + (sp.lid === 'sealed' ? 0.0046 : 0.0034), 0.004], rot: [0, 0.26, 0.04] });
  g.add(spoon);
  spoon.add(mesh(box(0.0580, 0.0016, 0.0082), plastic, { name: 'spoon-handle', pos: [-0.012, 0, 0], cast: false }));
  const bowl = mesh(sph(0.0088, 12, 9), plastic, { name: 'spoon-bowl', pos: [0.0232, -6e-4, 0], cast: false });
  bowl.scale.set(1.28, 0.34, 0.86);
  spoon.add(bowl);
  spoon.add(mesh(box(0.0066, 0.0018, 0.0090), plastic, { pos: [0.0140, -2e-4, 0], cast: false }));
  const tapeMat = MAT.paper({ color: '#f6e9c8', repeat: 5, side: DoubleSide, transparent: true, opacity: 0.94, depthWrite: false });
  for (const [dx, dz, rot] of [[-0.018, 0.014, 0.30], [0.020, -6e-3, -0.55]]) {
    const t = mesh(box(0.0160, 0.0006, 0.0072), tapeMat, { name: 'spoon-tape', pos: [dx, LID_Y + 0.0026, dz], rot: [0, rot, 0], cast: false, receive: false });
    g.add(t);
  }

  /* ---- 棚用フック掛けタブ（紙カード・ユーロ穴） ---- */
  if (sp.hook) {
    const tabH = 0.0176, tabW = 0.0300;
    const card = new Shape();
    card.moveTo(-tabW / 2, 0);
    card.lineTo(tabW / 2, 0);
    card.lineTo(tabW / 2, tabH - 0.004);
    card.quadraticCurveTo(tabW / 2, tabH, tabW / 2 - 0.004, tabH);
    card.lineTo(-tabW / 2 + 0.004, tabH);
    card.quadraticCurveTo(-tabW / 2, tabH, -tabW / 2, tabH - 0.004);
    card.lineTo(-tabW / 2, 0);
    const euro = new Path();
    euro.moveTo(-18e-4, 0.0060);
    euro.lineTo(-18e-4, 0.0084);
    euro.absarc(0, 0.0084, 0.0018, Math.PI, 0, true);
    euro.lineTo(0.0018, 0.0060);
    euro.absarc(0, 0.0060, 0.0018, 0, Math.PI, true);
    card.holes.push(euro);
    const geo = new ExtrudeGeometry(card, { depth: 0.0016, bevelEnabled: false, curveSegments: 6 });
    const tab = grp('hang-tab', { pos: [0, rimY - 0.0034, -0.044], rot: [-0.05, 0, 0] });
    g.add(tab);
    tab.add(mesh(geo, MAT.poster({
      map: TEX.poster({ title: sp.name, sub: '3食パック', bg: sp.b, accent: sp.a, seed: (seed % 71) + 7 }),
      steps: 3, side: DoubleSide, sat: 1.04,
    }), { name: 'hang-card', pos: [0, 0, -16e-4] }));
    // タブとカップを留める糊代
    tab.add(mesh(box(0.0300, 0.0060, 0.0012), MAT.paper({ color: '#e5ddc8', repeat: 5 }), { pos: [0, -16e-4, 0.0018], cast: false }));
  }

  /* ---- 経年 ---- */
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#b8ac92', seed: seed + 31, density: 1.4 }), w: 0.040, h: 0.015, pos: [0.019, 0.0130 * fy, rAt(prof, 0.0130 * fy) - 0.0022], opacity: 0.34 });
  if (sp.defect === 'watermark') decal(g, { map: TEX.wear({ kind: 'dirt', color: '#cbbfa4', seed: seed + 32, density: 1.2 }), w: 0.034, h: 0.032, pos: [-0.015, 0.0500 * fy, rAt(prof, 0.0500 * fy) - 0.0034], opacity: 0.40 });
  if (sp.defect === 'scorch') decal(g, { map: TEX.wear({ kind: 'dirt', color: '#6a5138', seed: seed + 33, density: 1.3 }), w: 0.032, h: 0.022, pos: [0.004, 0.0120 * fy, rAt(prof, 0.0120 * fy) - 0.0028], opacity: 0.45 });
  if (sp.defect === 'faded') decal(g, { map: TEX.wear({ kind: 'dirt', color: '#fff4e2', seed: seed + 34, density: 1.0 }), w: 0.038, h: 0.034, pos: [0.004, 0.0560 * fy, rAt(prof, 0.0560 * fy) - 0.0032], opacity: 0.48 });
  // リムの打痕（僅かに潰した环）
  g.add(mesh(tor(rAt(prof, rimY + 0.0026) - 0.0006, 0.0008, 5, 26), MAT.paper({ color: '#e6dfcd', repeat: 6 }), {
    name: 'rim-dent', pos: [0, rimY + 0.0026, 0], rot: [-Math.PI / 2, 0, 0], scale: [1, 1, 0.94], cast: false,
  }));

  return fitTo(g, [SZ * sc, SZ * sc, SZ * sc]);
}

/** 実体メッシュだけの AABB（做旧・貼花などの平面は寸法に数えない） */
function contentBounds(root) {
  const bb = new Box3();
  const b2 = new Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.noFit) return;
    if (o.geometry.type === 'PlaneGeometry' && !o.userData.keepFit) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    b2.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    bb.union(b2);
  });
  return bb;
}
function fitTo(g, size) {
  let bb = contentBounds(g);
  const hx = Math.max(1e-4, Math.abs(bb.min.x), Math.max(bb.max.x, 0));
  const hz = Math.max(1e-4, Math.abs(bb.min.z), Math.max(bb.max.z, 0));
  const hy = Math.max(1e-4, bb.max.y - bb.min.y);
  g.scale.set(size[0] / (2 * hx), size[1] / hy, size[2] / (2 * hz));
  g.updateMatrixWorld(true);
  bb = contentBounds(g);
  g.position.y -= bb.min.y;
  return g;
}

const P_CUP = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_CUP as P };
