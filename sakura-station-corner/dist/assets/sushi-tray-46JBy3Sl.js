import { g as grp, n as range, M as MAT, D as DoubleSide, P as PAL, T as TEX, m as mesh, a as sph, b as box, h as decal, w as weather, ai as capsule, Y as memo, z as rand, c as cyl, r as rbox, B as BufferGeometry, F as Float32BufferAttribute, V as Vector3, ac as Box3, N as makeCanvas, Q as toTexture } from './index-BvEZsPNz.js';

//  assets/products/sushi-tray.js —— 寿司・刺身の陳列トレー（4 variant）
//  nigiri6 握り六貫（鮪／サーモン／鰹／玉子／海老・巻の一貫）／roll4 巻物四切（断面の層）
//  chirashi ちらし（シャリ全面＋具の散らし・いくら）・sashimi5 刺身五点盛（大根・紫蘇）
//  構成：黒 PP トレイ（縁リブ・底リブ・抜き勾配）・吸水垫・シャリ（粒の凹凸）・ネタ・わさび・
//        醤油皿・LAP フィルム（半透明＋シワ dome）・値札シール／バーコード・陳列の傾き・生活痕
//  options: { seed, scale, variant, tint }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'sushi-tray',
  real: [0.190, 0.045, 0.130],
  origin: 'bottom-center',
  variants: ['nigiri6', 'roll4', 'chirashi', 'sashimi5'],
};
const VARIANTS = meta.variants;

/* ----------------寸法（envelope に合わせる） ---------------- */
const W = 0.190, H = 0.045, D = 0.130;
const TW = 0.182, TD = 0.124;            // トレイ外寸
const RIM = 0.0305, WT = 0.0028, FL = 0.0030;   // 縁高さ / 肉厚 / 底天面
const FW2 = TW / 2 + 0.0020, FD2 = TD / 2 + 0.0012;  // フィルム半幅（トレイ外周＋被せ）
const CREST = 0.0408;                    // フィルム頂
const TILT = 0.0225;                     // 陳列の傾き（奥上がり）
const PI = Math.PI;

const SPEC = {
  nigiri6: {
    title: '握り六貫', sub: '鮪・鮭・鰹・玉子・海老', price: '¥580', label: '#f4efe2', accent: '#b8443a',
    layout: 'nigiri', garnish: 'ginger', defect: 'grain',
  },
  roll4: {
    title: '巻四切', sub: '鉄火／かっぱ／玉子', price: '¥460', label: '#eaf1e6', accent: '#2f6b52',
    layout: 'roll', garnish: 'ginger', defect: 'peel',
  },
  chirashi: {
    title: 'ちらし寿司', sub: 'サーモン・鮪・いくら', price: '¥690', label: '#f7ecd8', accent: '#c8792c',
    layout: 'chirashi', garnish: 'shiso', defect: 'smudge',
  },
  sashimi5: {
    title: '刺身五点盛', sub: '鮪・鮭・鰹・蛸・白身', price: '¥880', label: '#eef2f5', accent: '#33566e',
    layout: 'sashimi', garnish: 'daikon', defect: 'drip',
  },
};

/* ネタの地金・筋・照り */
const NETA = {
  maguro: { body: '#a9333b', line: '#f2ddd7', spec: 0.54, power: 38 },
  sake: { body: '#ec8a58', line: '#fce6d7', spec: 0.50, power: 34 },
  katsu: { body: '#b46a5c', line: '#4a3634', spec: 0.46, power: 30, char: true },
  tamago: { body: '#efc65e', line: '#f8e2a6', spec: 0.34, power: 22 },
  ebi: { body: '#ef9f88', line: '#fbe2d7', spec: 0.48, power: 30 },
  tako: { body: '#e2b8ae', line: '#f7e6df', spec: 0.44, power: 28 },
  shiromi: { body: '#f0ece0', line: '#cfd8cf', spec: 0.52, power: 40 },
};

const noHull = (o) => { o.userData.noOutline = true; return o; };
const rbx = (w, h, d, r) => rbox(w, h, d, r, 2);

/* ---------------- フィルムのシワ（ローカル tex） ---------------- */
const filmTex = () => memo('st:film', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#eef7f9'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 92; i++) {
    g.globalAlpha = 0.06 + rnd() * 0.24;
    g.strokeStyle = rnd() > 0.45 ? '#ffffff' : '#b7ccd3';
    g.lineWidth = 1 + rnd() * 4;
    const x = rnd() * w, y = rnd() * h, a = rnd() * PI, l = 26 + rnd() * 150;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 26,
      x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 0.12;
  for (let i = 0; i < 26; i++) { g.fillStyle = '#8fa7ae'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
  return toTexture(cv, { repeat: 1 });
});

/** 超楕円断面（n 大 → 角張り） */
function sup(u, hw, hd, n = 4.2) {
  const c = Math.cos(u), s = Math.sin(u), e = 2 / n;
  return [Math.sign(c) * Math.abs(c) ** e * hw, Math.sign(s) * Math.abs(s) ** e * hd];
}
/** トレイに被せる LAP フィルム：中央ドーム＋縁で外へ垂れるスカート＋シワ */
function filmGeo(seedN) {
  const nu = 48, nv = 17;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const s = Math.pow(j / nv, 1.04);
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * PI * 2;
      const [x, z] = sup(u, FW2 * s, FD2 * s, 4.2);
      let y = RIM - 0.004 + (CREST - RIM + 0.004) * (1 - Math.pow(s, 3.0));
      if (s > 0.88) y -= ((s - 0.88) / 0.12) ** 1.5 * (RIM - 0.014);   // 外側へ垂下
      const wr = 0.0013 * Math.sin(u * 6.0 + seedN) * (0.30 + 0.70 * s)
        + 0.0008 * Math.sin(u * 15.0 - s * 8.0 + seedN * 1.6)
        + 0.0010 * Math.sin(u * 2.0 + s * 5.0);
      y += wr * (0.35 + 0.65 * Math.sin(s * PI));
      const [nx, nz] = sup(u, 1 / (FW2 * FW2), 1 / (FD2 * FD2), 2);
      const nl = Math.hypot(nx, nz) || 1;
      pos.push(x + (nx / nl) * wr * 0.42, y, z + (nz / nl) * wr * 0.42);
      uv.push(i / nu, j / nv);
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
/** 葉（紫蘇）：脈と反りのある楕円板 */
function leafGeo(len, wid, curl) {
  const nu = 14, nv = 9;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const t = j / nv;
    for (let i = 0; i <= nu; i++) {
      const a = (i / nu) * PI * 2;
      const r = Math.pow(Math.abs(Math.cos(a)) ** 2.6 + Math.abs(Math.sin(a)) ** 2.6, -1 / 2.6);
      const x = Math.cos(a) * r * t * len, z = Math.sin(a) * r * t * wid;
      pos.push(x, curl * t * t * Math.cos(a * 2) * 0.6 + curl * (1 - t * t) * 0.35 - curl * 0.2, z);
      uv.push(i / nu, t);
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

/* ---------------- 黒トレイ ---------------- */
function buildTray(stage, M, rnd, seed) {
  stage.add(mesh(rbx(TW - WT * 2, FL, TD - WT * 2, 0.0012), M.tray, { name: 'tray-floor' , pos: [0, FL / 2, 0] }));
  // 内底の光沢（PP の照り）
  stage.add(mesh(rbx(TW - WT * 2 - 0.002, 0.0004, TD - WT * 2 - 0.002, 0.0008), M.traySheen,
    { name: 'tray-floor-gloss', pos: [0, FL + 0.0001, 0], cast: false }));
  // 側壁（抜き勾配 3.2°）
  const draft = 0.056;
  const walls = [
    ['wall-front', 0, FL * 0.4, TD / 2 - WT / 2, [draft, 0, 0], TW, WT],
    ['wall-back', 0, FL * 0.4, -0.0606, [-draft, 0, 0], TW, WT],
    ['wall-right', TW / 2 - WT / 2, FL * 0.4, 0, [0, 0, -draft], WT, TD - WT * 2],
    ['wall-left', -0.0896, FL * 0.4, 0, [0, 0, draft], WT, TD - WT * 2],
  ];
  for (const [nm, hx, hy, hz, rot, ww, wd] of walls) {
    const hinge = grp(nm, { pos: [hx, hy, hz], rot });
    stage.add(hinge);
    hinge.add(mesh(box(ww, RIM - FL * 0.4, wd), M.tray, { name: nm + '-body', pos: [0, (RIM - FL * 0.4) / 2, 0] }));
    hinge.add(mesh(box(ww * 0.985, 0.0008, wd * 0.86), M.traySheen, { name: nm + '-inner', pos: [0, (RIM - FL * 0.4) * 0.62, 0], cast: false }));
  }
  // 縁（厚唇）
  for (const s of [1, -1]) {
    stage.add(mesh(rbx(TW + 0.0028, 0.0022, WT + 0.0016, 0.0009), M.trayRim, { name: 'lip-z' + s, pos: [0, RIM - 0.0011, s * (TD / 2 - WT / 2 + 0.0004)] }));
    stage.add(mesh(rbx(WT + 0.0016, 0.0022, TD - WT * 2, 0.0009), M.trayRim, { name: 'lip-x' + s, pos: [s * (TW / 2 - WT / 2 + 0.0004), RIM - 0.0011, 0] }));
  }
  // 底リブ（シャリを載せる棚）＋側リブ
  for (let i = 0; i < 5; i++) {
    const z = -TD / 2 + 0.020 + i * ((TD - 0.040) / 4);
    stage.add(mesh(rbx(TW - 0.016, 0.0016, 0.0042, 0.0007), M.tray, { name: 'rib-x' + i, pos: [0, FL + 0.0007, z], cast: false }));
  }
  for (let i = 0; i < 3; i++) {
    const x = -TW / 2 + 0.040 + i * 0.040;
    stage.add(mesh(rbx(0.0040, 0.0014, TD - 0.020, 0.0006), M.tray, { name: 'rib-z' + i, pos: [x, FL + 0.0006, 0], cast: false }));
  }
  for (let i = 0; i < 4; i++) {
    const sx = i < 2 ? -1 : 1, sz = i % 2 ? -1 : 1;
    stage.add(mesh(box(0.0032, RIM * 0.62, 0.0032), M.tray, { name: 'corner-rib' + i, pos: [sx * (TW / 2 - 0.0085), FL + RIM * 0.31, sz * (TD / 2 - 0.0085)], cast: false }));
  }
  // 吸水垫（ドリンカー）
  const pad = mesh(rbx(TW - 0.018, 0.0008, TD - 0.020, 0.0004), M.pad, { name: 'absorb-pad', pos: [range(rnd, -2e-3, 0.002), FL + 0.0016, range(rnd, -1e-3, 0.002)] });
  noHull(pad); stage.add(pad);
  // トレイ外側の擦れ・打痕（生活痕／フィルム下端から下は露出）
  weather(stage, { w: 0.056, h: 0.008, pos: [0.030, 0.013, TD / 2 + 0.0014], kind: 'scratch', color: '#8d9298', opacity: 0.30, seed: seed + 11, density: 1.5, spread: 0.002 });
  weather(stage, { w: 0.040, h: 0.009, pos: [-0.052, 0.012, -0.0634], rot: [0, PI, 0], kind: 'dirt', color: '#cfc9b6', opacity: 0.30, seed: seed + 12, density: 1.2, spread: 0.002 });
}

/* ---------------- シャリ・ネタ ---------------- */
function grains(parent, mat, rnd, len, wid, hgt, y0, n) {
  const geo = capsule(0.0015, 0.0021, 5);
  for (let i = 0; i < n; i++) {
    const a = rnd() * PI * 2, rr = Math.sqrt(rnd());
    const gm = mesh(geo, rnd() > 0.72 ? mat.dry : mat.wet, {
      name: 'grain' + i,
      pos: [Math.cos(a) * rr * len * 0.46, y0 + hgt * (0.86 + rnd() * 0.13) * (rnd() > 0.5 ? 1 : 0.98), Math.sin(a) * rr * wid * 0.44],
      rot: [rnd() * PI, rnd() * PI, rnd() * PI], cast: false, receive: false,
    });
    noHull(gm); parent.add(gm);
  }
}
function shariLump(parent, M, rnd, len, wid, hgt, x, z, ry) {
  const p = grp('shari', { pos: [x, 0, z], rotY: ry });
  parent.add(p);
  p.add(mesh(rbx(len, hgt, wid, Math.min(0.0062, hgt * 0.5)), M.rice, { name: 'shari-body', pos: [0, FL + hgt / 2 + 0.0016, 0] }));
  grains(p, M.grain, rnd, len, wid, hgt, FL + 0.0016, 11);
  return p;
}
function netaPiece(parent, M, rnd, kind, len, wid, top, opts = {}) {
  const nt = NETA[kind];
  const body = MAT.food({ color: nt.body, spec: nt.spec, specPower: nt.power, shadowAmt: 0.64, tint: opts.tint });
  const line = MAT.food({ color: nt.line, spec: nt.spec * 0.85, specPower: nt.power + 8, shadowAmt: 0.7 });
  const th = opts.thick || 0.0042;
  const neta = mesh(rbx(len, th, wid, 0.0017), body, { name: 'neta-' + kind, pos: [0, top + th / 2, 0], rot: [0, 0, range(rnd, -0.04, 0.04)] });
  parent.add(neta);
  // 脂の筋・照り
  const nl = kind === 'sake' ? 4 : kind === 'shiromi' ? 3 : 2;
  for (let i = 0; i < nl; i++) {
    const t = (i + 0.5) / nl;
    parent.add(mesh(box(len * 0.86, 0.0007, 0.0016 + (i % 2) * 0.0006), line, {
      name: 'neta-line' + i, pos: [range(rnd, -2e-3, 0.002), top + th * (0.42 + 0.5 * t), -wid / 2 + wid * t + range(rnd, -1e-3, 0.001)],
      rot: [0, range(rnd, -0.1, 0.1), 0], cast: false,
    }));
  }
  if (nt.char) {  // 鰹：torch 焦げ
    parent.add(mesh(rbx(len * 0.94, 0.0011, wid * 0.98, 0.0014), M.char, { name: 'neta-char', pos: [0, top + th + 0.0003, 0], cast: false }));
  }
  if (kind === 'tamago') {  // 海苔の帯
    parent.add(mesh(rbx(0.0075, th + 0.0115, wid + 0.0035, 0.0009), M.nori, { name: 'nori-band', pos: [range(rnd, -3e-3, 0.003), top - 0.0022, 0] }));
  }
  if (kind === 'ebi') {     // 海老の尾と節
    for (let i = 0; i < 3; i++) {
      parent.add(mesh(box(0.0016, 0.0008, wid * 0.9), line, { name: 'ebi-band' + i, pos: [-len * 0.28 + i * len * 0.28, top + th * 0.92, 0], cast: false }));
    }
    const tail = grp('ebi-tail', { pos: [len / 2 + 0.0055, top + 0.0006, 0], rotY: range(rnd, -14, 14) });
    parent.add(tail);
    for (let i = -1; i <= 1; i++) {
      tail.add(mesh(rbx(0.0092, 0.0011, 0.0042, 0.0005), body, { name: 'tail-fin' + i, pos: [0.004, 0.0004, i * 0.0042], rot: [0, 0, i * 0.16], cast: false }));
    }
  }
  return neta;
}

/* ---------------- 薬味・小皿 ---------------- */
function wasabi(parent, M, x, y, z, r, rnd) {
  const w = grp('wasabi', { pos: [x, y, z], rotY: range(rnd, 0, 180) });
  parent.add(w);
  w.add(mesh(rbx(r * 2, r * 1.45, r * 1.75, r * 0.62), M.wasabi, { name: 'wasabi-body' }));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + rnd();
    const s = mesh(sph(r * 0.42, 8, 6), M.wasabi, { name: 'wasabi-lobe' + i, pos: [Math.cos(a) * r * 0.62, r * 0.36, Math.sin(a) * r * 0.5], cast: false });
    noHull(s); w.add(s);
  }
  return w;
}
function soyDish(parent, M, x, z, rnd, seed) {
  const d = grp('soy-dish', { pos: [x, FL + 0.002, z], rotY: range(rnd, -12, 12) });
  parent.add(d);
  d.add(mesh(cyl(0.0192, 0.0158, 0.0030, 20), M.dish, { name: 'dish-body', pos: [0, 0.0015, 0] }));
  d.add(mesh(cyl(0.0178, 0.0178, 0.0006, 20), M.dishRim, { name: 'dish-lip', pos: [0, 0.0030, 0], cast: false }));
  d.add(mesh(cyl(0.0146, 0.0134, 0.0012, 18), M.soy, { name: 'soy-pool', pos: [0, 0.0019, 0], cast: false }));
  d.add(mesh(cyl(0.0052, 0.0052, 0.0004, 12), M.soyHi, { name: 'soy-reflection', pos: [-4e-3, 0.00255, 0.003], cast: false }));
  // 縁の醤油垂れ
  decal(d, { map: TEX.wear({ kind: 'dirt', color: '#4a2c17', seed: seed + 31, density: 1.1 }), w: 0.010, h: 0.006, pos: [0.014, 0.0021, 0.008], rot: [0, PI / 2, 0], opacity: 0.42 });
  return d;
}
function ginger(parent, M, x, y, z, rnd) {
  const gr = grp('ginger', { pos: [x, y, z], rotY: range(rnd, -20, 20) });
  parent.add(gr);
  for (let i = 0; i < 5; i++) {
    gr.add(mesh(rbx(0.0128, 0.0012, 0.0088, 0.0006), i % 2 ? M.ginger : M.gingerPale, {
      name: 'ginger-ruff' + i, pos: [range(rnd, -25e-4, 0.0025), i * 0.0016 + 0.0008, range(rnd, -22e-4, 0.0022)],
      rot: [range(rnd, -0.24, 0.24), range(rnd, -0.5, 0.5), range(rnd, -0.2, 0.2)], cast: false,
    }));
  }
  return gr;
}
function daikon(parent, M, x, y, z, rnd) {
  const d = grp('daikon', { pos: [x, y, z] });
  parent.add(d);
  d.add(mesh(rbx(0.036, 0.0055, 0.026, 0.0028), M.daikonBase, { name: 'daikon-mound' }));
  for (let i = 0; i < 12; i++) {
    d.add(mesh(box(0.030 + rnd() * 0.010, 0.0006, 0.0008), M.daikon, {
      name: 'daikon-shred' + i, pos: [range(rnd, -8e-3, 0.008), 0.0030 + i * 0.00042 + range(rnd, -1e-3, 0.001), range(rnd, -0.01, 0.010)],
      rot: [range(rnd, -0.3, 0.3), range(rnd, -0.7, 0.7), range(rnd, -0.2, 0.2)], cast: false,
    }));
  }
  return d;
}

/* ---------------- 巻の層 ---------------- */
function maki(parent, M, rnd, x, z, fill, h) {
  const p = grp('maki', { pos: [x, FL + 0.0018, z], rotY: range(rnd, -14, 14) });
  parent.add(p);
  const r = 0.0182;
  p.add(mesh(cyl(r, r * 0.985, h, 22), M.rice, { name: 'maki-rice', pos: [0, h / 2, 0] }));
  p.add(mesh(cyl(r + 0.0011, (r + 0.0011) * 0.985, h * 0.985, 22, true), M.nori, { name: 'maki-nori', pos: [0, h / 2 + 0.0002, 0] }));
  p.add(mesh(cyl(r + 0.0011, r + 0.0011, 0.0008, 22), M.nori, { name: 'maki-nori-top', pos: [0, h - 0.0004, 0], cast: false }));
  // 断面の具（芯）
  const top = h + 0.0004;
  for (let i = 0; i < fill.length; i++) {
    const a = (i / fill.length) * PI * 2 + 0.4;
    p.add(mesh(rbx(0.0092, 0.0038, 0.0072, 0.0014), fill[i].mat, {
      name: 'maki-fill-' + fill[i].k, pos: [Math.cos(a) * r * 0.42, top - 0.0012, Math.sin(a) * r * 0.42], rot: [0, range(rnd, -0.52, 0.52), 0], cast: false,
    }));
  }
  p.add(mesh(cyl(0.0026, 0.0026, 0.0036, 10), M.wasabi, { name: 'maki-core', pos: [0, top - 0.0016, 0], cast: false }));
  // ゴマ
  for (let i = 0; i < 5; i++) {
    const s = mesh(sph(0.0011, 6, 5), i % 2 ? M.sesame : M.sesameDark, { name: 'sesame' + i, pos: [range(rnd, -8e-3, 0.008), top + 0.0004, range(rnd, -8e-3, 0.008)], cast: false });
    noHull(s); p.add(s);
  }
  return p;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'nigiri6');
  const sp = SPEC[key] || SPEC.nigiri6;
  const sc = options.scale ?? 1;
  const tint = options.tint;
  const seedN = (seed % 19) * 0.41;

  const g = grp('sushi-tray');
  const root = grp('fit');
  g.add(root);
  const stage = grp('stage', { rot: [TILT, range(rnd, -0.011, 0.011), 0] });   // 陳列の傾き
  root.add(stage);

  /* ---- 素材 ---- */
  const fm = filmTex();
  const M = {
    tray: MAT.hardPlastic('#232529', { repeat: 6, spec: 0.42, specPower: 52, shadowAmt: 0.86 }),
    trayRim: MAT.hardPlastic('#2c2f34', { repeat: 8, spec: 0.5, specPower: 66 }),
    traySheen: MAT.plastic('#3a3e44', { spec: 0.62, specPower: 110, shadowAmt: 0.7 }),
    pad: MAT.paper({ color: PAL.paintWarm, map: TEX.paper({ base: PAL.paint, repeat: 6 }).map }),
    rice: MAT.rice({ color: tint ?? '#f9f4e8', spec: 0.42, specPower: 44, map: TEX.paper({ base: '#f7f2e6', repeat: 8 }).map }),
    grain: { wet: MAT.rice({ color: '#fffdf4', spec: 0.52, specPower: 60 }), dry: MAT.rice({ color: '#efe7d6', spec: 0.3, specPower: 26 }) },
    nori: MAT.nori({ spec: 0.3, specPower: 40, shadowAmt: 0.9 }),
    char: MAT.food({ color: '#3b2a26', spec: 0.24, specPower: 18, shadowAmt: 1 }),
    wasabi: MAT.food({ color: PAL.grassDark, spec: 0.52, specPower: 26, shadowAmt: 0.62 }),
    dish: MAT.hardPlastic('#1d1f22', { repeat: 5, spec: 0.48 }),
    dishRim: MAT.plastic('#2b2e33', { spec: 0.6, specPower: 96 }),
    soy: MAT.paint('#3a2110', { spec: 0.86, specPower: 190, specCut: 0.08, shadowAmt: 0.5 }),
    soyHi: MAT.paint(PAL.concreteDark, { spec: 0.9, specPower: 220, emissive: '#4a3f2c', emissiveIntensity: 0.25 }),
    ginger: MAT.food({ color: PAL.sakuraPetalDeep, spec: 0.36, shadowAmt: 0.66 }),
    gingerPale: MAT.food({ color: PAL.sakuraPetalPale, spec: 0.32, shadowAmt: 0.66 }),
    daikon: MAT.food({ color: PAL.marking, spec: 0.44, specPower: 40, shadowAmt: 0.6 }),
    daikonBase: MAT.food({ color: PAL.concrete, spec: 0.32, shadowAmt: 0.7 }),
    sesame: MAT.food({ color: PAL.marking, spec: 0.3 }),
    sesameDark: MAT.food({ color: PAL.outline, spec: 0.26 }),
    leaf: MAT.food({ color: PAL.awningGreen, spec: 0.34, side: DoubleSide, shadowAmt: 0.74 }),
    film: MAT.glassLite({ color: '#e9f5f7', opacity: 0.21, map: fm || undefined, spec: 0.95, specPower: 230, sheen: 0.35 }),
  };

  buildTray(stage, M, rnd, seed);

  /* ---- 中身 ---- */
  if (sp.layout === 'nigiri') {
    const kinds = ['sake', 'maguro', 'katsu', 'tamago', 'ebi', 'maguro'];
    const rows = [0.0385, -45e-4];
    let k = 0;
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const kind = kinds[k++ % kinds.length];
        const x = -0.058 + i * 0.058 + range(rnd, -25e-4, 0.0025);
        const z = rows[r] + range(rnd, -18e-4, 0.0018);
        const len = 0.0465 + range(rnd, -18e-4, 0.0026), wid = 0.0232 + range(rnd, -12e-4, 0.0016);
        const hgt = 0.0128 + range(rnd, -12e-4, 0.0018);
        const p = shariLump(stage, M, rnd, len, wid, hgt, x, z, range(rnd, -8, 8));
        netaPiece(p, M, rnd, kind, len + 0.0052, wid + 0.0024, FL + 0.0016 + hgt, { tint });
      }
    }
    // 一品だけ崩れかけ（シャリが覗く）
    const loose = shariLump(stage, M, rnd, 0.0430, 0.0226, 0.0116, 0.0575, 0.0415, 21);
    netaPiece(loose, M, rnd, 'sake', 0.0435, 0.0240, FL + 0.0128, { thick: 0.0038 });
    soyDish(stage, M, -0.062, -0.0395, rnd, seed);
    wasabi(stage, M, 0.0590, FL + 0.0075, -0.04, 0.0082, rnd);
    ginger(stage, M, -0.0205, FL + 0.0024, -0.041, rnd);
  } else if (sp.layout === 'roll') {
    const fills = [
      [{ k: 'tuna', mat: MAT.food({ color: '#a22f36', spec: 0.5 }) }, { k: 'cuke', mat: MAT.food({ color: '#5f8f45', spec: 0.36 }) }],
      [{ k: 'tamago', mat: MAT.food({ color: '#efc65e', spec: 0.34 }) }, { k: 'cuke', mat: MAT.food({ color: '#5f8f45', spec: 0.36 }) }],
      [{ k: 'nori2', mat: MAT.nori({}) }, { k: 'tuna', mat: MAT.food({ color: '#a22f36', spec: 0.5 }) }],
      [{ k: 'cuke', mat: MAT.food({ color: '#5f8f45', spec: 0.36 }) }, { k: 'ginger2', mat: MAT.food({ color: '#d9743f', spec: 0.4 }) }],
    ];
    let n = 0;
    for (const [x, z] of [[-0.04, 0.0300], [0.0000, 0.0325], [-0.0205, -0.0115], [0.0205, -0.013]]) {
      maki(stage, M, rnd, x + range(rnd, -2e-3, 0.002), z + range(rnd, -2e-3, 0.002), fills[n], 0.0228 + range(rnd, -12e-4, 0.0016));
      n++;
    }
    // 巻き end に零れた飯粒・acap
    grains(stage, M.grain, rnd, 0.060, 0.050, 0.002, FL + 0.0002, 7);
    soyDish(stage, M, 0.0625, -0.0385, rnd, seed);
    wasabi(stage, M, -0.0605, FL + 0.0068, -0.0385, 0.0076, rnd);
    ginger(stage, M, -0.064, FL + 0.0024, 0.0280, rnd);
  } else if (sp.layout === 'chirashi') {
    // シャリを全面に敷く
    const bed = mesh(rbx(TW - 0.014, 0.0122, TD - 0.016, 0.0050), M.rice, { name: 'shari-bed', pos: [0, FL + 0.0078, 0] });
    stage.add(bed);
    grains(stage, M.grain, rnd, TW - 0.030, TD - 0.030, 0.0122, FL + 0.0030, 30);
    // 紫蘇の下葉
    const sh = mesh(leafGeo(0.046, 0.028, 0.0035), M.leaf, { name: 'shiso-leaf', pos: [-0.034, FL + 0.0150, 0.014], rot: [0, 0.18, 0.06] });
    stage.add(sh);
    // 具の散らし
    const cubes = [
      ['#e9874f', 0.0135, -0.05, 0.026], ['#a9333b', 0.0125, 0.010, 0.030], ['#e9874f', 0.0130, 0.048, -8e-3],
      ['#a9333b', 0.0122, -0.018, -0.03], ['#efc65e', 0.0140, 0.030, 0.034], ['#5f8f45', 0.0110, -0.06, -0.012],
    ];
    cubes.forEach((c, i) => {
      stage.add(mesh(rbx(c[1], c[1] * 0.62, c[1] * 0.78, 0.0026), MAT.food({ color: tint ?? c[0], spec: 0.5, specPower: 34, shadowAmt: 0.62 }), {
        name: 'topping' + i, pos: [c[2], FL + 0.0165 + c[1] * 0.3, c[3]], rot: [range(rnd, -0.18, 0.18), range(rnd, -1.2, 1.2), range(rnd, -0.14, 0.14)],
      }));
    });
    // いくら（小粒の塊）
    const ikura = grp('ikura', { pos: [0.0620, FL + 0.0180, 0.0180], rotY: range(rnd, -20, 20) });
    stage.add(ikura);
    ikura.add(mesh(rbx(0.0240, 0.0036, 0.0170, 0.0016), MAT.nori({}), { name: 'ikura-base' }));
    const roeMat = MAT.food({ color: '#e06a38', spec: 0.72, specPower: 120, shadowAmt: 0.5 });
    for (let i = 0; i < 13; i++) {
      const a = i * 2.399, rr = 0.0022 + 0.0032 * Math.sqrt(i);
      const s = mesh(sph(0.0030 + (i % 3) * 0.0004, 8, 6), roeMat, {
        name: 'roe' + i, pos: [Math.cos(a) * rr, 0.0032 + (i % 4) * 0.0008, Math.sin(a) * rr * 0.72], cast: false,
      });
      noHull(s); ikura.add(s);
    }
    // 海老・きぬさや・かまぼこ
    netaPiece(shariLump(stage, M, rnd, 0.0420, 0.0210, 0.0072, -0.042, -0.03, -14), M, rnd, 'ebi', 0.0440, 0.0230, FL + 0.0110, {});
    for (let i = 0; i < 3; i++) {
      stage.add(mesh(rbx(0.0200, 0.0016, 0.0072, 0.0008), MAT.food({ color: '#7fa63f', spec: 0.4 }), {
        name: 'pea' + i, pos: [-4e-3 + i * 0.014, FL + 0.0196 + i * 0.0006, -0.04 + range(rnd, -3e-3, 0.003)], rot: [0, range(rnd, -0.6, 0.6), 0], cast: false,
      }));
    }
    wasabi(stage, M, -0.072, FL + 0.0136, 0.0400, 0.0070, rnd);
  } else {
    /* sashimi5：扇状に five 枚・大根と紫蘇 */
    stage.add(mesh(leafGeo(0.058, 0.036, 0.0042), M.leaf, { name: 'shiso-bed', pos: [0.020, FL + 0.0042, 0.006], rot: [0, -0.3, 0] }));
    const order = ['maguro', 'sake', 'katsu', 'tako', 'shiromi'];
    order.forEach((kind, i) => {
      const t = i / (order.length - 1);
      const x = -0.064 + t * 0.1220;
      const z = 0.0280 - t * 0.0520;
      const p = grp('sashimi-' + kind, { pos: [x, 0, z], rotY: -34 + t * 26 + range(rnd, -4, 4) });
      stage.add(p);
      const len = 0.0520 + range(rnd, -2e-3, 0.003), wid = 0.0234 + range(rnd, -12e-4, 0.0018);
      const y0 = FL + 0.0048 + i * 0.0007;
      netaPiece(p, M, rnd, kind, len, wid, y0, { thick: 0.0056, tint });
      // 厚めの切り身に刃の跡
      p.add(mesh(box(len * 0.9, 0.0006, 0.0009), MAT.food({ color: NETA[kind].line, spec: 0.4 }), { name: 'knife-mark' + i, pos: [0, y0 + 0.0028, -wid * 0.22], cast: false }));
      if (i === 3) p.add(mesh(box(len * 0.5, 0.0007, 0.0012), M.char, { name: 'tako-score' + i, pos: [0, y0 + 0.0058, 0], cast: false }));
    });
    daikon(stage, M, 0.0560, FL + 0.0026, -0.036, rnd);
    wasabi(stage, M, -0.07, FL + 0.0066, -0.035, 0.0078, rnd);
    soyDish(stage, M, -0.06, 0.0390, rnd, seed);
    // 白髪ねぎ
    for (let i = 0; i < 6; i++) {
      stage.add(mesh(box(0.0180, 0.0008, 0.0008), MAT.food({ color: '#e8f0d8', spec: 0.4 }), {
        name: 'negi' + i, pos: [range(rnd, -0.02, 0.05), FL + 0.0090 + i * 0.0005, range(rnd, -0.02, 0.01)], rot: [0, range(rnd, -1.4, 1.4), 0], cast: false,
      }));
    }
  }

  /* ---- フィルム（LAP） ---- */
  const film = mesh(filmGeo(seedN), M.film, { name: 'lap-film', cast: false, receive: false, renderOrder: 6 });
  noHull(film);
  stage.add(film);
  // 縁のシーラー（フィルム圧着）とたるみ
  for (const s of [1, -1]) {
    stage.add(mesh(rbx(TW + 0.0050, 0.0016, 0.0030, 0.0007), M.film, { name: 'film-seal-z' + s, pos: [0, RIM - 0.0040, s * (TD / 2 + 0.0016)], cast: false, renderOrder: 7 }));
    stage.add(mesh(rbx(0.0030, 0.0016, TD + 0.0050, 0.0007), M.film, { name: 'film-seal-x' + s, pos: [s * (TW / 2 + 0.0016), RIM - 0.0040, 0], cast: false, renderOrder: 7 }));
  }
  decal(stage, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 41, density: 1.4 }), w: 0.040, h: 0.024, pos: [-0.02, CREST + 0.0004, -6e-3], rot: [PI / 2, 0, 0.3], opacity: 0.22, order: 6 });

  /* ---- 値札・バーコード ---- */
  const label = mesh(rbx(0.0420, 0.0120, 0.0007, 0.0004), MAT.poster({
    map: TEX.drinkLabel({ name: sp.title, sub: sp.sub, ml: sp.price, a: sp.accent, b: sp.label, kind: 'bag' }),
    steps: 2, spec: 0.3, sat: 1.02,
  }), { name: 'price-label', pos: [0.0440, 0.0132, TD / 2 + 0.0012], rot: [0.06, range(rnd, -0.06, 0.06), 0], cast: false });
  noHull(label); label.userData.noFit = true; stage.add(label);
  // フィルム前面に貼られた価格シール（トレイ縁の下地ごと）
  decal(stage, {
    map: TEX.drinkLabel({ name: sp.title, sub: sp.sub, ml: sp.price, a: sp.accent, b: '#fbf8ef', kind: 'bag' }),
    w: 0.0440, h: 0.0140, pos: [-0.028, 0.0135, FD2 - 0.0014], opacity: 0.99, order: 2,
  });
  // 値札の掠れ（生活痕）
  weather(stage, { w: 0.018, h: 0.008, pos: [-0.02, 0.0150, FD2 - 0.0010], kind: 'dirt', color: '#fff6e2', opacity: 0.42, seed: seed + 43, density: 1.1, spread: 0.0015 });

  /* ---- variant 固有の生活痕 ---- */
  if (sp.defect === 'grain') {
    // 縁に付いた飯粒・トレイ上の零れ粒（包装内側）
    for (let i = 0; i < 4; i++) {
      const s = mesh(capsule(0.0015, 0.0021, 5), M.grain.wet, {
        name: 'stray-grain' + i, pos: [range(rnd, -0.082, 0.082), RIM - 0.0016, range(rnd, -0.052, 0.052)],
        rot: [rnd() * PI, rnd() * PI, rnd() * PI], cast: false, receive: false,
      });
      noHull(s); stage.add(s);
    }
  }
  if (sp.defect === 'peel') {
    // フィルムの一隅が浮いて剥がれかけ
    const flap = mesh(rbx(0.0240, 0.0008, 0.0160, 0.0004), M.film, { name: 'film-peel', pos: [TW / 2 - 0.018, RIM + 0.0026, -TD / 2 + 0.016], rot: [0.42, 0.2, -0.3], cast: false, renderOrder: 8 });
    noHull(flap); stage.add(flap);
    weather(stage, { w: 0.028, h: 0.012, pos: [0.0560, RIM - 0.0040, -0.044], kind: 'chip', color: '#dfe9ec', opacity: 0.40, seed: seed + 45, density: 1.2, spread: 0.0018 });
  }
  if (sp.defect === 'smudge') {
    // シャリベッドのへり欠け＋指紋
    decal(stage, { map: TEX.wear({ kind: 'dirt', color: '#e8e2cf', seed: seed + 46, density: 1.3 }), w: 0.034, h: 0.016, pos: [0.030, FL + 0.0150, -0.044], rot: [-PI / 2 + 0.36, 0, 0], opacity: 0.5 });
    weather(stage, { w: 0.044, h: 0.011, pos: [-0.04, 0.0160, TD / 2 + 0.0016], kind: 'dirt', color: '#b9b3a1', opacity: 0.34, seed: seed + 47, density: 1.4, spread: 0.002 });
  }
  if (sp.defect === 'drip') {
    // 醤油の垂れた跡と刺身の汁
    weather(stage, { w: 0.016, h: 0.012, pos: [-0.056, 0.0205, TD / 2 + 0.0016], kind: 'dirt', color: '#5d3f22', opacity: 0.34, seed: seed + 48, density: 1.5, spread: 0.002 });
    const pool = mesh(rbx(0.0240, 0.0009, 0.0170, 0.0006), MAT.food({ color: '#e6d6c0', spec: 0.62, specPower: 90, shadowAmt: 0.5 }), { name: 'drip-pool', pos: [0.024, FL + 0.0022, 0.0380], cast: false });
    noHull(pool); pool.userData.noFit = true; stage.add(pool);
  }
  // トレイ底の打痕（全 variant）
  weather(stage, { w: 0.028, h: 0.005, pos: [-0.056, 0.0090, TD / 2 + 0.0014], kind: 'chip', color: '#6a6f76', opacity: 0.30, seed: seed + 49, density: 1.0, spread: 0.001 });

  return fitTo(g, root, [W * sc, H * sc, D * sc]);
}

/* ---------------- 寸法合わせ（デカール等の平面は除外） ---------------- */
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
  root.position.y -= bb.min.y;                 // 底面を y=0 へ（親 group の position は触らない）
  g.userData.envelope = bb.getSize(new Vector3()).toArray().map((v) => +v.toFixed(4));
  return g;
}

const P_SUSHI = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_SUSHI as P };
