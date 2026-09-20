import { P as PAL, M as MAT, T as TEX, g as grp, n as range, m as mesh, r as rbox, w as weather, Y as memo, b as box, t as tor, c as cyl, h as decal, V as Vector3, z as rand, B as BufferGeometry, F as Float32BufferAttribute, S as Shape, R as ExtrudeGeometry, o as lathe, ac as Box3, N as makeCanvas, Q as toTexture } from './index-BqvI026L.js';

//  assets/products/candy-bar.js —— 個包装のチョコレート／ガム（6 variant）
//  choco 板チョコ／caramel キャラメル／mint 薄荷／kinoko きのこの山／almond ナougat・アーモンド／gum シュガレスガム
//  構成：個包装フィルム（pillow 断面＋シワ・光沢）・上下シーラーフィン（ギザ刃）・前面／背面／名帯の曲面印刷・
//        棚フック掛け穴（ユーロスロット）・開封済み（箔と中身）／pack で複数本のシュリンクパック・指紋／掠れ／凹み。
//  options: { seed, scale, variant, tint, open:false, pack:1 }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'candy-bar',
  real: [0.045, 0.155, 0.012],
  origin: 'bottom-center',
  variants: ['choco', 'caramel', 'mint', 'kinoko', 'almond', 'gum'],
};
const VARIANTS = meta.variants;

const W = 0.045, H = 0.155, D = 0.012;
const FIN = 0.0132;                        // シーラーフィンの高さ
const PI = Math.PI;

const SPEC = {
  choco: {
    title: '板チョコ', sub: 'CACAO 72%', weight: '65g', bg: '#3c2620', accent: '#dfb257', band: '#c8963a',
    body: 1.00, hang: true, paper: false, defect: 'crease', inner: 'choco',
  },
  caramel: {
    title: 'キャラメル', sub: 'MILK CARAMEL', weight: '48g', bg: '#efd9b4', accent: '#a45a24', band: '#c87a35',
    body: 0.99, hang: true, paper: false, defect: 'dent', inner: 'caramel',
  },
  mint: {
    title: '薄荷チョコ', sub: 'MOINT CHOCO', weight: '52g', bg: '#dff2e6', accent: '#2f8f6a', band: '#48a87e',
    body: 1.02, hang: false, paper: false, defect: 'faded', inner: 'mint',
  },
  kinoko: {
    title: 'きのこ山', sub: 'MUSHROOM BISCUIT', weight: '60g', bg: '#f6e3b6', accent: '#c0392b', band: '#d9534f',
    body: 1.04, hang: true, paper: false, defect: 'torn', inner: 'kinoko',
  },
  almond: {
    title: 'アーモンド', sub: 'NOUGAT BAR', weight: '58g', bg: '#e7d8bd', accent: '#7a4f2c', band: '#9c6a3c',
    body: 1.00, hang: true, paper: false, defect: 'scuff', inner: 'almond',
  },
  gum: {
    title: 'シュガレス', sub: 'SUGAR FREE GUM', weight: '4.5g', bg: '#e6f2f7', accent: PAL.signBlue, band: '#4a8fc4',
    body: 0.98, hang: true, paper: true, defect: 'crease', inner: 'gum',
  },
};

const rbx = (w, h, d, r) => rbox(w, h, d, r, 2);
const sgn = (x) => (x < 0 ? -1 : 1);
const noHull = (o) => { o.userData.noOutline = true; return o; };
const noFit = (o) => { o.userData.noFit = true; return o; };

/* ---------------- ローカル tex：フィルムの微細シワ ---------------- */
const sheenTex = () => memo('cb:sheen', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.04 + rnd() * 0.10;
    g.strokeStyle = rnd() > 0.5 ? '#ffffff' : '#c8c4b8';
    g.lineWidth = 1 + rnd() * 3;
    const x = rnd() * w, y = rnd() * h, a = rnd() * PI, l = 24 + rnd() * 120;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return toTexture(cv, { repeat: 3 });
});

/* ---------------- 断面・表面 ---------------- */
function sectionPoint(u, hw, hd, n = 4.6) {
  const c = Math.cos(u), s = Math.sin(u), e = 2 / n;
  return [sgn(c) * Math.abs(c) ** e * hw, sgn(s) * Math.abs(s) ** e * hd];
}
/** v(0..1) → 半幅・半膨らみ（上下はフィンのため絞まる） */
function profileAt(v, sp, topCut) {
  const sh = 0.085;
  let b;
  if (v < sh) b = 0.26 + 0.74 * Math.pow(v / sh, 0.72);
  else if (v > topCut - sh) b = 0.26 + 0.74 * Math.pow(Math.max(0, (topCut - v) / sh), 0.72);
  else b = 1 + 0.055 * Math.sin(((v - sh) / (topCut - 2 * sh)) * PI);
  const taper = 1 - 0.045 * Math.pow((v - 0.46) * 2, 2);
  return { hw: (W / 2) * 0.968 * taper, hd: Math.max(0.0005, (D / 2) * 0.745 * b * sp.body), top: topCut };
}
/** 袋本体（フィルムの pillow プリズム）＋シワ */
function bodyGeo(sp, seedN, topCut) {
  const nu = 34, nv = 30;
  const pos = [], uv = [], idx = [];
  const y0 = FIN * 0.62, y1 = sp.open ? H * 0.80 : H - FIN * 0.62;
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const { hw, hd } = profileAt(v, sp, topCut);
    const y = y0 + v * (y1 - y0);
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * PI * 2;
      const [x, z] = sectionPoint(u, hw, hd);
      const wr = 0.00042 * Math.sin(u * 8.0 + v * 9.0 + seedN) * (0.3 + 0.7 * Math.sin(v * PI))
        + 0.00018 * Math.sin(u * 19.0 - v * 13.0 + seedN * 1.4)
        + 0.00040 * Math.sin(u * 1.5 + v * 4.0 + seedN * 0.5);
      const nx = x / (hw * hw), nz = z / (hd * hd);
      const nl = Math.hypot(nx, nz) || 1;
      pos.push(x + (nx / nl) * wr, y, z + (nz / nl) * wr);
      uv.push(i / nu, v);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, c = a + 1, b = a + nu + 1, d = b + 1;
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
/** 袋面に沿った印刷パッチ */
function patchGeo(sp, u0, u1, v0, v1, off, topCut, nu = 14, nv = 10) {
  const pos = [], uv = [], idx = [];
  const y0 = FIN * 0.62, y1 = sp.open ? H * 0.80 : H - FIN * 0.62;
  for (let j = 0; j <= nv; j++) {
    const v = v0 + (v1 - v0) * (j / nv);
    const { hw, hd } = profileAt(v, sp, topCut);
    const y = y0 + v * (y1 - y0);
    for (let i = 0; i <= nu; i++) {
      const u = u0 + (u1 - u0) * (i / nu);
      const [x, z] = sectionPoint(u, hw + off, hd + off * 0.6);
      pos.push(x, y, z);
      uv.push(i / nu, 1 - (j / nv));
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, c = a + 1, b = a + nu + 1, d = b + 1;
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
/** ギザ刃のシーラーフィン（up=false なら刃が下） */
function finGeo(w, h, teeth, depth, up) {
  const s = new Shape();
  const x0 = -w / 2, x1 = w / 2, n = Math.max(3, teeth), dx = (x1 - x0) / n;
  const lo = 0.0006, sh = h * 0.66;
  s.moveTo(x0, lo); s.lineTo(x1, lo); s.lineTo(x1, sh);
  for (let i = 0; i < n; i++) {
    const xa = x1 - i * dx;
    s.lineTo(xa - dx * 0.5, h); s.lineTo(xa - dx, sh);
  }
  s.lineTo(x0, lo);
  const geo = new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
  if (!up) { geo.rotateX(PI); geo.translate(0, h, 0); }
  geo.computeVertexNormals();
  return geo;
}
/** 開封時の破断エッジ（ギザの筋を刻んだ帯） */
function tornGeo(w, h, n, depth) {
  const s = new Shape();
  const x0 = -w / 2, x1 = w / 2, dx = (x1 - x0) / n;
  s.moveTo(x0, 0); s.lineTo(x1, 0); s.lineTo(x1, h * 0.42);
  for (let i = 0; i < n; i++) {
    const xa = x1 - i * dx;
    s.lineTo(xa - dx * 0.38, h * (0.55 + (i % 3) * 0.15));
    s.lineTo(xa - dx * 0.76, h * 0.40);
  }
  s.lineTo(x0, 0);
  const geo = new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
  geo.computeVertexNormals();
  return geo;
}

/* ---------------- 中身（箔・板・ガム） ---------------- */
function foilLiner(parent, M, rnd, y0, y1, seed) {
  const f = grp('foil', { pos: [0, (y0 + y1) / 2, 0] });
  parent.add(f);
  const hh = (y1 - y0) / 2;
  f.add(mesh(rbx(W * 0.82, hh, D * 0.62, 0.0012), M.foil, { name: 'foil-sleeve', cast: false, renderOrder: 4 }));
  // 折り返した箔（クシャッ）
  for (let i = 0; i < 3; i++) {
    const p = mesh(rbx(W * (0.64 - i * 0.08), 0.0012, D * (0.72 + i * 0.14), 0.0006), M.foil, {
      name: 'foil-crease' + i, pos: [(i - 1) * 0.003 + range(rnd, -1e-3, 0.001), hh - 0.0040 - i * 0.0030, 0.0006],
      rot: [0.14 - i * 0.1, 0, 0.10 + i * 0.06], cast: false,
    });
    noHull(p); f.add(p);
  }
  weather(f, { w: W * 0.6, h: (y1 - y0) * 0.4, pos: [0, 0, D * 0.34], kind: 'chip', color: '#efe9d6', opacity: 0.30, seed: seed + 61, density: 1.2, spread: 0.0015 });
  return f;
}
function barCore(bar, M, sp, rnd, topY) {
  const k = sp.inner;
  const base = FIN * 0.9;
  if (k === 'choco') {
    bar.add(mesh(rbx(W * 0.78, topY - base, D * 0.58, 0.0016), M.choco, { name: 'choco-core', pos: [0, (topY + base) / 2, 0] }));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        bar.add(mesh(rbx(W * 0.30, 0.0018, D * 0.26, 0.0007), M.choco, {
          name: `seg-${r}${c}`, pos: [(c - 0.5) * W * 0.34, topY - 0.0012 - r * 0.0105, 0], cast: false,
        }));
      }
    }
    // 折って欠けた角
    bar.add(mesh(rbx(W * 0.15, 0.0060, D * 0.50, 0.0018), M.chocoBroken, { name: 'choco-bite', pos: [W * 0.29, topY - 0.0060, 0], rot: [0, 0, -0.22], cast: false }));
  } else if (k === 'caramel') {
    bar.add(mesh(rbx(W * 0.78, topY - base, D * 0.56, 0.0014), M.choco, { name: 'caramel-shell', pos: [0, (topY + base) / 2, 0] }));
    bar.add(mesh(rbx(W * 0.70, 0.0048, D * 0.46, 0.0010), M.caramel, { name: 'caramel-layer', pos: [0, topY - 0.0060, 0], cast: false }));
    bar.add(mesh(rbx(W * 0.70, 0.0028, D * 0.46, 0.0008), M.milkFill, { name: 'milk-layer', pos: [0, topY - 0.0096, 0], cast: false }));
  } else if (k === 'mint') {
    bar.add(mesh(rbx(W * 0.78, topY - base, D * 0.56, 0.0014), M.whiteChoco, { name: 'mint-core', pos: [0, (topY + base) / 2, 0] }));
    for (let i = 0; i < 3; i++) {
      bar.add(mesh(rbx(W * 0.72, 0.0016, D * 0.22, 0.0006), M.mintFill, { name: 'mint-groove' + i, pos: [0, topY - 0.0030 - i * 0.0086, 0], cast: false }));
    }
  } else if (k === 'kinoko') {
    for (let i = 0; i < 2; i++) {
      const m = grp('kinoko' + i, { pos: [(i - 0.5) * W * 0.40, topY - 0.0135 - i * 0.001, 0], rotY: (i ? 22 : -18) + range(rnd, -6, 6) });
      bar.add(m);
      m.add(mesh(cyl(0.0038, 0.0030, 0.0160, 10), M.biscuit, { name: 'stem', pos: [0, -75e-4, 0] }));
      m.add(mesh(lathe([[0, 0.0068], [0.0040, 0.0062], [0.0086, 0.0036], [0.0092, 0.0004], [0.0074, -12e-4], [0, -16e-4]], 16), M.choco, { name: 'cap', pos: [0, 0.0008, 0] }));
    }
  } else if (k === 'almond') {
    bar.add(mesh(rbx(W * 0.78, topY - base, D * 0.54, 0.0020), M.nougat, { name: 'nougat-core', pos: [0, (topY + base) / 2, 0] }));
    for (let i = 0; i < 5; i++) {
      bar.add(mesh(rbx(0.0066, 0.0026, 0.0040, 0.0012), M.almond, {
        name: 'almond' + i, pos: [range(rnd, -4e-3, 0.004), topY - 0.0042 - i * 0.0090, D * 0.26],
        rot: [0.2, 0.5 * (i % 2 ? 1 : -1), 0.12 * i], cast: false,
      }));
    }
  } else {
    // gum：細いスティックが束
    for (let i = 0; i < 4; i++) {
      bar.add(mesh(rbx(W * 0.72, (topY - base) * 0.86, 0.0020, 0.0006), i === 1 ? M.gumPale : M.gum, {
        name: 'gum-stick' + i, pos: [0, base + (topY - base) * 0.44, -D * 0.24 + i * D * 0.16], cast: false,
      }));
    }
  }
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'choco');
  const base = SPEC[key] || SPEC.choco;
  const sc = options.scale ?? 1;
  const pack = Math.max(1, Math.round(options.pack ?? 1));
  const open = !!options.open;
  const seedN = (seed % 23) * 0.29;

  /* ---- 素材 ---- */
  const sh = sheenTex();
  const filmMat = base.paper
    ? MAT.paper({ color: base.bg, map: TEX.paper({ base: base.bg, repeat: 5 }).map, spec: 0.16, steps: 3 })
    : MAT.paint(base.bg, {
      spec: 0.56, specPower: 108, specCut: 0.16, sheen: 0.16, steps: 3, shadowAmt: 0.72,
      map: sh || undefined, sat: base.defect === 'faded' ? 0.78 : 1.02, tint: base.defect === 'faded' ? '#fff2e0' : (options.tint || '#ffffff'),
    });
  const M = {
    film: filmMat,
    foil: MAT.metal('#cbc4ae', { repeat: 10, spec: 0.78, specPower: 150, sheen: 0.24, shadowAmt: 0.66 }),
    foilDark: MAT.metal('#8f8875', { repeat: 8, spec: 0.6 }),
    front: MAT.poster({ map: TEX.poster({ title: base.title, sub: base.sub, bg: base.bg, accent: base.accent, seed: (seed % 71) + 3 }), steps: 3, sat: base.defect === 'faded' ? 0.76 : 1.05, spec: 0.42, specPower: 76, tint: options.tint }),
    back: MAT.poster({ map: TEX.adStrip({ text: base.sub, bg: '#f7f3e6', seed: (seed % 53) + 11 }), steps: 2, sat: 1.0, spec: 0.32 }),
    band: MAT.poster({ map: TEX.drinkLabel({ name: base.title, sub: base.sub, ml: base.weight, a: base.band, b: base.bg, kind: 'bag' }), steps: 3, spec: 0.46, specPower: 84, sat: base.defect === 'faded' ? 0.78 : 1.06, tint: options.tint }),
    choco: MAT.food({ color: '#4a2c19', spec: 0.42, specPower: 52, shadowAmt: 0.7 }),
    chocoBroken: MAT.food({ color: '#6a4526', spec: 0.3, specPower: 24, shadowAmt: 0.8 }),
    caramel: MAT.food({ color: '#c0812f', spec: 0.55, specPower: 70, shadowAmt: 0.62 }),
    milkFill: MAT.food({ color: '#e9d6b2', spec: 0.4, specPower: 36 }),
    whiteChoco: MAT.food({ color: '#f4efe0', spec: 0.44, specPower: 56 }),
    mintFill: MAT.food({ color: '#9ed4b4', spec: 0.4, specPower: 40 }),
    biscuit: MAT.bread({ color: '#dcbb84', spec: 0.22 }),
    nougat: MAT.food({ color: '#eadbb6', spec: 0.3, specPower: 26 }),
    almond: MAT.food({ color: '#c69a62', spec: 0.26, shadowAmt: 0.8 }),
    gum: MAT.food({ color: '#f7f5ee', spec: 0.34, specPower: 40 }),
    gumPale: MAT.food({ color: '#e6eef2', spec: 0.34, specPower: 40 }),
    shrink: MAT.glassLite({ color: '#eaf3f6', opacity: 0.20, spec: 0.95, specPower: 240, sheen: 0.3 }),
  };

  const g = grp('candy-bar');

  /* ---- 複数本パック（シュリンク束） ---- */
  if (pack > 1) {
    const bundle = grp('pack');
    g.add(bundle);
    const rows = pack > 4 ? 2 : 1;
    const per = Math.ceil(pack / rows);
    for (let i = 0; i < pack; i++) {
      const r = Math.floor(i / per), c = i % per;
      const n = Math.min(per, pack - r * per);
      const one = single(barSpec(base, i), M, seed + i * 31, seedN + i * 1.3, i % 2 ? 1 : -1);
      one.position.set((c - (n - 1) / 2) * (W * 0.94), 0, (r - (rows - 1) / 2) * (D * 1.5));
      one.rotation.set(0, range(rnd, -0.09, 0.09), range(rnd, -6e-3, 0.006));
      bundle.add(one);
    }
    const bw = per * W * 0.94 + 0.006, bh = H * 0.985, bd = rows * (D * 1.5) + D * 0.55;
    const wrap = mesh(rbox(bw, bh, bd, 0.0026, 2), M.shrink, { name: 'shrink-wrap', cast: false, receive: false, renderOrder: 6 });
    noHull(wrap); wrap.position.y = bh / 2; bundle.add(wrap);
    // Pack 正面／背面のヘッドバンド印刷
    bundle.add(mesh(rbx(bw * 0.97, bh * 0.30, 0.0006, 0.0004), M.band, { name: 'pack-band-front', pos: [0, bh * 0.62, bd / 2 + 0.0005], cast: false, renderOrder: 7 }));
    bundle.add(mesh(rbx(bw * 0.97, bh * 0.22, 0.0006, 0.0004), M.back, { name: 'pack-band-back', pos: [0, bh * 0.32, -bd / 2 - 0.0005], rot: [0, PI, 0], cast: false, renderOrder: 7 }));
    // トップの糊しろとシュリンクのシワ
    bundle.add(mesh(rbx(bw * 0.90, 0.0100, bd * 0.90, 0.0016), M.foilDark, { name: 'pack-top-glue', pos: [0, bh - 0.0030, 0], cast: false }));
    weather(bundle, { w: bw * 0.5, h: 0.020, pos: [0, bh * 0.16, bd / 2 + 0.0008], kind: 'scratch', color: '#ffffff', opacity: 0.24, seed: seed + 71, density: 1.5, spread: 0.002 });
    g.userData.pack = [bw, bh, bd].map((v) => +v.toFixed(4));
    return g;
  }

  const root = grp('fit');
  g.add(root);
  root.add(single({ ...base, open }, M, seed, seedN, 1));
  return fitTo(g, root, [W * sc, H * sc, D * sc]);
}
const barSpec = (b, i) => ({ ...b, open: false, hang: b.hang && i % 2 === 0 });

/* ---------------- 一本 ---------------- */
function single(sp, M, seed, seedN, side) {
  const rnd = rand(seed);
  const bar = grp('candy-bar-single');
  const topCut = sp.open ? 0.80 : 1.0;
  const lean = range(rnd, -0.03, 0.030) * side;               // 陳列の小さな倒れ（Y 軸のみ＝寸法を変えない）
  const holder = grp('holder', { rot: [0, lean, range(rnd, -4e-3, 0.004)] });
  bar.add(holder);

  /* --- 包装フィルム本体 --- */
  const body = mesh(bodyGeo(sp, seedN, topCut), M.film, { name: 'wrapper', renderOrder: 1 });
  holder.add(body);

  /* --- 印刷（前面・背面・名帯） --- */
  holder.add(mesh(patchGeo(sp, PI / 2 - 1.16, PI / 2 + 1.16, 0.06, sp.open ? 0.62 : 0.94, 0.00035, topCut), M.front,
    { name: 'print-front', cast: false, receive: false, renderOrder: 3 }));
  holder.add(mesh(patchGeo(sp, -PI / 2 - 1.16, -PI / 2 + 1.16, 0.06, 0.94, 0.00035, topCut), M.back,
    { name: 'print-back', cast: false, receive: false, renderOrder: 3 }));
  holder.add(mesh(patchGeo(sp, PI / 2 - 1.42, PI / 2 + 1.42, 0.30, 0.55, 0.00055, topCut), M.band,
    { name: 'print-band', cast: false, receive: false, renderOrder: 4 }));
  // 側シーム（折り代の筋）
  for (const s of [1, -1]) {
    holder.add(mesh(patchGeo(sp, s > 0 ? -0.2 : PI - 0.20, s > 0 ? 0.20 : PI + 0.20, 0.06, 0.94, 0.0003, topCut), M.foilDark,
      { name: 'side-seam' + s, cast: false, receive: false, renderOrder: 2 }));
  }

  /* --- 下フィン（ギザ）と上フィン／開封なら破断エッジ --- */
  const fw = W * 0.93, fh = FIN * 1.5;
  holder.add(mesh(finGeo(fw, fh, 9, 0.0022, false), M.film, { name: 'seal-bottom', pos: [0, 0.0004, -11e-4] }));
  holder.add(mesh(box(fw * 0.96, 0.0012, 0.0046), M.foil, { name: 'seal-edge-bottom', pos: [0, FIN + 0.0012, 0], cast: false }));
  if (!sp.open) {
    holder.add(mesh(finGeo(fw, fh, 9, 0.0022, true), M.film, { name: 'seal-top', pos: [0, H - 0.0006 - fh, -11e-4] }));
    holder.add(mesh(box(fw * 0.96, 0.0012, 0.0046), M.foil, { name: 'seal-edge-top', pos: [0, H - FIN - 0.0012, 0], cast: false }));
  } else {
    const ty = H * 0.80;
    holder.add(mesh(tornGeo(fw, 0.0125, 7, 0.0024), M.film, { name: 'torn-edge', pos: [0, ty - 0.0040, -12e-4], renderOrder: 2 }));
    foilLiner(holder, M, rnd, ty - 0.030, ty + 0.010, seed);
    barCore(holder, M, sp, rnd, H * 0.986);
  }

  /* --- 棚フック掛け穴 --- */
  if (sp.hang && !sp.open) {
    const hy = H - FIN * 0.66;
    const ring = mesh(tor(0.0034, 0.0009, 8, 10), M.foilDark, { name: 'euro-hole', pos: [0, hy, 0], cast: false });
    holder.add(ring);
    holder.add(noFit(mesh(rbx(0.0060, 0.0022, 0.0040, 0.0009), M.foil, { name: 'euro-slot', pos: [0.0046, hy, 0], cast: false })));
    holder.add(mesh(cyl(0.0030, 0.0030, 0.0040, 12, true), M.foilDark, { name: 'euro-tube', pos: [0, hy, 0], rot: [PI / 2, 0, 0], cast: false }));
  }

  /* --- 欠陥・生活痕 --- */
  const zfront = (v) => { const { hd } = profileAt(v, sp, topCut); return hd + 0.0008; };
  if (sp.defect === 'dent') {
    const p = body.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const k = Math.exp(-((x - 0.014) ** 2 + (z - 0.004) ** 2) / 0.000055);
      if (k > 0.02) { p.setX(i, x - x * k * 0.30); p.setZ(i, z - z * k * 0.55); }
    }
    p.needsUpdate = true;
    body.geometry.computeVertexNormals();
  }
  if (sp.defect === 'crease') {
    decal(holder, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 21, density: 1.7 }), w: 0.016, h: 0.042, pos: [0.007, H * 0.22, zfront(0.22)], opacity: 0.34 });
    decal(holder, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 22, density: 1.4 }), w: 0.012, h: 0.026, pos: [-9e-3, H * 0.70, zfront(0.70)], rot: [0, 0, 0.5], opacity: 0.28 });
  }
  if (sp.defect === 'faded') {
    decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#fff4e2', seed: seed + 23, density: 1.2 }), w: 0.024, h: 0.060, pos: [0.002, H * 0.72, zfront(0.72)], opacity: 0.46 });
  }
  if (sp.defect === 'torn') {
    holder.add(noFit(mesh(rbx(0.0100, 0.0064, 0.0024, 0.0012), M.foil, { name: 'tear-foil', pos: [-W * 0.30, H * 0.115, zfront(0.115) - 0.0016], rot: [0, 0, 0.42], cast: false, renderOrder: 5 })));
    holder.add(noFit(mesh(rbx(0.0068, 0.0034, 0.0018, 0.0008), M.film, { name: 'tear-flap', pos: [-W * 0.26, H * 0.134, zfront(0.134) - 0.0012], rot: [0.3, 0, 0.7], cast: false })));
  }
  if (sp.defect === 'scuff') {
    decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#efe7d2', seed: seed + 24, density: 1.6 }), w: 0.020, h: 0.016, pos: [0.004, H * 0.44, zfront(0.44)], opacity: 0.40 });
  }
  // 指紋（陳列によるもの・全 variant）
  decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#d8d2c4', seed: seed + 25, density: 0.9 }), w: 0.011, h: 0.013, pos: [-6e-3, H * 0.30, zfront(0.30)], rot: [0, 0, 0.4], opacity: 0.26 });
  // 下端の棚擦れ
  weather(holder, { w: 0.020, h: 0.004, pos: [0, FIN * 0.42, -zfront(0.10)], rot: [0, PI, 0], kind: 'dirt', color: '#9e977f', opacity: 0.34, seed: seed + 26, density: 1.1, spread: 0.001 });
  return bar;
}

/* ---------------- 寸法合わせ ---------------- */
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
function fitTo(g, root, size) {
  let bb = contentBounds(root);
  const hx = Math.max(1e-4, Math.abs(bb.min.x), Math.max(bb.max.x, 0));
  const hz = Math.max(1e-4, Math.abs(bb.min.z), Math.max(bb.max.z, 0));
  const hy = Math.max(1e-4, bb.max.y - bb.min.y);
  g.userData.raw = [2 * hx, hy, 2 * hz].map((v) => +v.toFixed(4));
  root.scale.set(size[0] / (2 * hx), size[1] / hy, size[2] / (2 * hz));
  root.updateMatrixWorld(true);
  bb = contentBounds(root);
  root.position.y -= bb.min.y;
  g.userData.envelope = bb.getSize(new Vector3()).toArray().map((v) => +v.toFixed(4));
  return g;
}

const P_CANDY = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_CANDY as P, build as b };
