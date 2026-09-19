//  assets/products/tissue-pack.js —— ティッシュ類 4 variant
//  tissue ソフトティッシュ（袋ふくらみ・取り出しシール剥がれ・覗く白）・wet 除菌ウェット（ハードプラ flip 蓋・シート先端）
//  handkerchief 紙箱＋布ハンカチ（スリットから掛け出る・角スレ）・paper トイレットロール二巻束（フィルムの谷・紙芯・しり尾）
//  構成：superellipsoid 袋（底に flatten／端は絞り＋ギザのフィシール）・曲面印刷パッチ（前面／背面／天面）・
//        材質の使い分け（フィルム／紙／箔／布）・生活痕（シワ・潰れ・剥がれ・指紋・棚擦れ）。
//  options: { seed, scale, variant, tint, pack:1 }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない
import * as THREE from 'three';
import { grp, mesh, box, rbox, cyl, tor, rand, range, weather, decal } from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX, makeCanvas, toTexture, memo } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'tissue-pack',
  real: [0.190, 0.050, 0.100],
  origin: 'bottom-center',
  variants: ['tissue', 'wet', 'handkerchief', 'paper'],
};
export const VARIANTS = meta.variants;

const W = 0.190, H = 0.050, D = 0.100;
const HW = W / 2, HH = H / 2, HD = D / 2;
const PI = Math.PI;

const SPEC = {
  tissue: {
    title: 'やわらか紙', sub: 'FACE TISSUE 150組', side: '3箱分お徳用',
    bg: '#eef3f7', accent: '#3f7fb0', band: '#6fa8cf', kind: 'film', n: 3.35, hhF: 0.960, lid: 'sticker',
    cloth: '#fdfbf4', defect: 'wrinkle',
  },
  wet: {
    title: '除菌ウェット', sub: 'DISINFECT WIPES 20枚', side: 'アルコール配合',
    bg: '#e7f2ec', accent: '#2f8f6a', band: '#5cb48c', kind: 'film', n: 3.15, hhF: 0.900, lid: 'flip',
    cloth: '#fbfaf5', defect: 'peel',
  },
  handkerchief: {
    title: '木綿ハンカチ', sub: 'COTTON HANDKERCHIEF 二枚入', side: '贈答向き',
    bg: '#f4ece0', accent: '#b8443a', band: '#d9745f', kind: 'box', n: 6.0, hhF: 0.940, lid: 'slit',
    cloth: '#8fa9c4', defect: 'corner',
  },
  paper: {
    title: 'ダブルロール', sub: 'TOILET PAPER 二個入', side: '120m 各巻',
    bg: '#f4f1e7', accent: PAL.markingYellow, band: '#e0b74f', kind: 'roll', n: 3.20, hhF: 0.900, lid: 'none',
    cloth: '#f7f4ea', defect: 'sag',
  },
};

const rbx = (w, h, d, r) => rbox(w, h, d, r, 2);
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* ---------------- ローカル tex：フィルムのシワ高光 ---------------- */
const crinkleTex = () => memo('tp:crinkle', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 84; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.14;
    g.strokeStyle = rnd() > 0.5 ? '#ffffff' : '#c6c8bd';
    g.lineWidth = 1 + rnd() * 3.4;
    const x = rnd() * w, y = rnd() * h, a = rnd() * PI, l = 30 + rnd() * 160;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 24, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return toTexture(cv, { repeat: 2 });
});

/* ---------------- 袋シェル（superellipsoid, 底は面一にクランプ） ---------------- */
const AX = (sp) => ({ hw: HW * 0.982, hh: HH * sp.hhF, hd: HD * 0.982, cut: 0.82 });
/** 上面の高さ */
function yTop(x, z, sp, a, off = 0) {
  const q = 1 - Math.pow(Math.abs(x) / a.hw, sp.n) - Math.pow(Math.abs(z) / a.hd, sp.n);
  return a.hh * Math.pow(Math.max(0.0009, q), 1 / sp.n) + off;
}
/** 前面の奥行き */
function zFront(x, y, sp, a, off = 0) {
  const q = 1 - Math.pow(Math.abs(x) / a.hw, sp.n) - Math.pow(Math.abs(y) / (a.hh * 0.995), sp.n);
  return a.hd * Math.pow(Math.max(0.0009, q), 1 / sp.n) + off;
}
function bagGeo(sp, a, seedN, amp) {
  const nu = 50, nv = 26;
  const pos = [], uv = [], idx = [];
  const cut = -a.hh * a.cut;
  for (let j = 0; j <= nv; j++) {
    const th = (j / nv) * PI;
    const dy = Math.cos(th), sr = Math.sin(th);
    for (let i = 0; i <= nu; i++) {
      const ph = (i / nu) * PI * 2;
      const dx = Math.cos(ph) * sr, dz = Math.sin(ph) * sr;
      const S = Math.pow(Math.abs(dx) / a.hw, sp.n) + Math.pow(Math.abs(dy) / a.hh, sp.n) + Math.pow(Math.abs(dz) / a.hd, sp.n);
      let r = Math.pow(S, -1 / sp.n);
      const wr = amp * (Math.sin(ph * 7.0 + dy * 5.0 + seedN) * 0.55
        + Math.sin(ph * 17.0 - dy * 9.0 + seedN * 1.7) * 0.25
        + Math.sin(dy * 12.0 + seedN * 0.6) * 0.30);
      r *= 1 + wr - 0.052 * Math.pow(Math.abs(dx), 3.2);       // 端（フィシール際）の絞り
      pos.push(dx * r, Math.max(cut, dy * r), dz * r);
      uv.push(i / nu, j / nv);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a2 = j * (nu + 1) + i, c = a2 + 1, b = a2 + nu + 1, d = b + 1;
      idx.push(a2, b, c, c, b, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** 袋面に沿った印刷パッチ（axis 'z'＝前面 / 'y'＝天面） */
function printPatch(sp, a, axis, x0, x1, a0, a1, off, nu = 18, nv = 10) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const t = a0 + (a1 - a0) * (j / nv);
    for (let i = 0; i <= nu; i++) {
      const s = x0 + (x1 - x0) * (i / nu);
      if (axis === 'z') pos.push(s, t, zFront(s, t, sp, a, off));
      else pos.push(s, yTop(s, t, sp, a, off), t);
      uv.push(i / nu, 1 - j / nv);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a2 = j * (nu + 1) + i, c = a2 + 1, b = a2 + nu + 1, d = b + 1;
      idx.push(a2, b, c, c, b, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** 両端のフィシール（ギザの糊しろ：長さ=x / 巾=z / 厚み=y） */
function endFinGeo(len, wid, teeth, th) {
  const s = new THREE.Shape();
  const n = Math.max(3, teeth), dy = wid / n;
  s.moveTo(0, -wid / 2);
  s.lineTo(len * 0.84, -wid / 2);
  for (let i = 0; i < n; i++) {
    const yb = -wid / 2 + i * dy;
    s.lineTo(len, yb + dy * 0.5);
    s.lineTo(len * 0.84, yb + dy);
  }
  s.lineTo(0, wid / 2);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-PI / 2);
  geo.computeVertexNormals();
  return geo;
}
/** 折り布（ハンカチ） */
function foldedCloth(parent, M, x, y, z, w, d, layers, rot, mat) {
  const c = grp('cloth', { pos: [x, y, z], rot });
  parent.add(c);
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(1, layers - 1);
    const p = mesh(rbx(w * (1 - t * 0.04), 0.0015 + t * 0.0004, d * (1 - t * 0.06), 0.0006), i % 2 ? M.cloth : mat, {
      name: 'cloth-layer' + i, pos: [t * 0.0014, i * 0.0018, -t * 0.0010],
      rot: [(i - 1) * 0.014, (i % 2 ? 1 : -1) * 0.022, i * 0.009], cast: i === 0,
    });
    c.add(p);
  }
  return c;
}
/** 取り出し口から覗く白（ティッシュ先） */
function tissueTips(parent, M, x, y, z, n, spread, rnd, tilt) {
  const t = grp('tips', { pos: [x, y, z], rot: [0, range(rnd, -0.3, 0.3), 0] });
  parent.add(t);
  for (let i = 0; i < n; i++) {
    const p = mesh(rbx(spread * (0.70 + rnd() * 0.40), 0.0006, spread * (0.30 + rnd() * 0.28), 0.0003), i % 2 ? M.tissue : M.tissueShade, {
      name: 'tip' + i, pos: [(rnd() - 0.5) * spread * 0.7, i * 0.0010, (rnd() - 0.5) * spread * 0.6],
      rot: [tilt * (0.3 + rnd() * 0.5), (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.45], cast: false,
    });
    noHull(p); t.add(p);
  }
  return t;
}

/* ------------------------------------------------------------------ build */
export function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'tissue');
  const sp = SPEC[key] || SPEC.tissue;
  const sc = options.scale ?? 1;
  const pack = Math.max(1, Math.round(options.pack ?? 1));
  const seedN = (seed % 29) * 0.33;

  const crk = crinkleTex();
  const M = {
    bag: MAT.paint(sp.bg, {
      spec: 0.50, specPower: 96, specCut: 0.18, sheen: 0.14, steps: 3, shadowAmt: 0.74,
      map: crk || TEX.paper({ base: sp.bg, repeat: 3 }).map, tint: options.tint || '#ffffff', sat: 1.02,
    }),
    paperBox: MAT.paper({ color: sp.bg, map: TEX.paper({ base: sp.bg, repeat: 3 }).map, spec: 0.13, steps: 3 }),
    front: MAT.poster({ map: TEX.drinkLabel({ name: sp.title, sub: sp.sub, ml: '税込', a: sp.accent, b: sp.bg, kind: 'bag' }), steps: 3, spec: 0.42, specPower: 76, sat: 1.05, tint: options.tint }),
    top: MAT.poster({ map: TEX.poster({ title: sp.side, sub: sp.sub, bg: sp.bg, accent: sp.band, seed: (seed % 67) + 7 }), steps: 2, spec: 0.34 }),
    band: MAT.poster({ map: TEX.adStrip({ text: sp.title, bg: '#fbf8ee', seed: (seed % 43) + 5 }), steps: 2, spec: 0.36 }),
    fin: MAT.paint(sp.band, { spec: 0.34, steps: 2, shadowAmt: 0.86, map: TEX.paper({ base: sp.band, repeat: 6 }).map }),
    foil: MAT.metal('#cfc9b4', { repeat: 9, spec: 0.76, specPower: 150, sheen: 0.22 }),
    tissue: MAT.paper({ color: sp.cloth, spec: 0.06, sheen: 0.0, steps: 2 }),
    tissueShade: MAT.paper({ color: '#efeade', spec: 0.06, steps: 2 }),
    lid: MAT.hardPlastic('#eae7de', { repeat: 5, spec: 0.5, specPower: 74 }),
    lidDark: MAT.plastic('#cfcabb', { spec: 0.4 }),
    sticker: MAT.paper({ color: '#fbf7ea', spec: 0.2, steps: 2 }),
    cloth: MAT.fabric({ color: sp.cloth, repeat: 9 }),
    clothDark: MAT.fabric({ color: '#5d6470', repeat: 11 }),
    roll: MAT.paper({ color: '#f6f3ea', spec: 0.06, steps: 2, map: TEX.paper({ base: '#f6f3ea', repeat: 6 }).map }),
    rollShade: MAT.paper({ color: '#e6e1d2', spec: 0.06, steps: 2 }),
    core: MAT.paper({ color: '#b98a55', spec: 0.1, steps: 2 }),
    ink: MAT.paint(PAL.outline, { spec: 0.2, steps: 2 }),
  };

  const g = grp('tissue-pack');

  /* ---- 複数パックの束（シュリンク） ---- */
  if (pack > 1) {
    const bundle = grp('pack');
    g.add(bundle);
    const rows = pack > 2 ? 2 : 1;
    const per = Math.ceil(pack / rows);
    for (let i = 0; i < pack; i++) {
      const r = Math.floor(i / per), c = i % per;
      const n = Math.min(per, pack - r * per);
      const u = unit(sp, M, rand(seed + i * 37), seed + i * 37, seedN + i * 1.7);
      u.position.set((c - (n - 1) / 2) * (W * 0.965), r * (H * 0.985), r ? range(rnd, -0.004, 0.004) : 0);
      u.rotation.set(0, range(rnd, -0.05, 0.05), range(rnd, -0.006, 0.006));
      bundle.add(u);
    }
    const bw = per * W * 0.965 + 0.008, bh = rows * H * 0.985 + 0.008, bd = D * 0.99 + 0.008;
    const wrap = mesh(rbox(bw, bh, bd, 0.009, 3), MAT.glassLite({ color: '#eaf3f6', opacity: 0.19, spec: 0.95, specPower: 235, sheen: 0.3 }),
      { name: 'shrink-wrap', cast: false, receive: false, renderOrder: 6 });
    noHull(wrap); wrap.position.y = bh / 2 - 0.004; bundle.add(wrap);
    bundle.add(mesh(rbx(bw * 0.95, 0.0008, bd * 0.62, 0.0004), M.band, { name: 'pack-band-top', pos: [0, bh - 0.0056, 0], cast: false, renderOrder: 7 }));
    weather(bundle, { w: bw * 0.5, h: 0.018, pos: [0, bh * 0.44, bd / 2 + 0.0012], kind: 'scratch', color: '#ffffff', opacity: 0.22, seed: seed + 71, density: 1.4, spread: 0.002 });
    g.userData.pack = [bw, bh, bd].map((v) => +v.toFixed(4));
    return g;
  }

  const root = grp('fit');
  g.add(root);
  root.add(unit(sp, M, rnd, seed, seedN));
  return fitTo(g, root, [W * sc, H * sc, D * sc]);
}

/* ---------------- 一パック ---------------- */
function unit(sp, M, rnd, seed, seedN) {
  const u = grp('unit');
  const a = AX(sp);
  const isRoll = sp.kind === 'roll';
  const lift = isRoll ? 0 : a.hh * a.cut + 0.0004;
  const body = grp('body', { pos: [0, lift, 0], rot: [range(rnd, -0.004, 0.004), range(rnd, -0.010, 0.010), 0] });
  u.add(body);
  if (isRoll) { rollsAndWrap(body, M, sp, rnd, seed); return u; }

  /* --- 袋／紙箱シェル --- */
  const amp = sp.kind === 'box' ? 0.00016 : 0.0010;
  const bag = mesh(bagGeo(sp, a, seedN, amp), sp.kind === 'box' ? M.paperBox : M.bag, { name: 'pack-body', renderOrder: 1 });
  body.add(bag);

  /* --- 印刷（前面・背面・天面） --- */
  body.add(mesh(printPatch(sp, a, 'z', -a.hw * 0.84, a.hw * 0.84, -a.hh * 0.52, a.hh * 0.52, 0.00040), M.front,
    { name: 'print-front', cast: false, receive: false, renderOrder: 3 }));
  body.add(mesh(printPatch(sp, a, 'z', -a.hw * 0.84, a.hw * 0.84, -a.hh * 0.52, a.hh * 0.52, 0.00040), M.top,
    { name: 'print-back', cast: false, receive: false, renderOrder: 3, rot: [0, PI, 0] }));
  body.add(mesh(printPatch(sp, a, 'y', -a.hw * 0.58, a.hw * 0.58, -a.hd * 0.46, a.hd * 0.46, 0.00032), M.band,
    { name: 'print-top', cast: false, receive: false, renderOrder: 4 }));

  /* --- 両端のフィシール（ギザ） --- */
  for (const s of [1, -1]) {
    body.add(mesh(endFinGeo(0.0136, a.hd * 1.24, 6, 0.0024), M.fin,
      { name: 'fin-' + (s > 0 ? 'r' : 'l'), pos: [s * a.hw * 0.845, 0, -0.0012], rot: [0, s > 0 ? 0 : PI, 0] }));
    body.add(mesh(rbx(0.0030, 0.0046, a.hd * 1.10, 0.0009), M.foil, { name: 'fin-root-' + s, pos: [s * a.hw * 0.828, 0, 0], cast: false }));
  }

  /* --- 取り出し口 --- */
  const oy = yTop(0, 0, sp, a, 0.0006);
  if (sp.lid === 'sticker') {
    const o = grp('opening', { pos: [0, oy, 0], rot: [0, 0.14, 0] });
    body.add(o);
    o.add(mesh(cyl(a.hd * 0.40, a.hd * 0.385, 0.0007, 24), M.sticker, { name: 'seal-sticker', pos: [0, 0.0005, 0], scale: [1.78, 1, 1], cast: false }));
    const peel = mesh(rbx(a.hd * 0.62, 0.0006, a.hd * 0.50, 0.0003), M.sticker, { name: 'sticker-peel', pos: [a.hd * 0.52, 0.0016, a.hd * 0.14], rot: [0, 0.10, -0.17], cast: false });
    noHull(peel); o.add(peel);
    o.add(mesh(rbx(a.hd * 0.34, 0.0006, a.hd * 0.52, 0.0003), M.ink, { name: 'open-slot', pos: [-a.hd * 0.20, 0.0009, 0], cast: false }));
    for (let i = 0; i < 9; i++) {
      body.add(mesh(box(0.0026, 0.0005, 0.0012), M.lidDark, { name: 'perf' + i, pos: [-a.hd * 0.62 + i * 0.0066, oy + 0.0005, -a.hd * 0.26], cast: false }));
    }
    tissueTips(body, M, -a.hd * 0.10, oy + 0.0008, 0.002, 4, a.hd * 0.44, rnd, -0.42);
  } else if (sp.lid === 'flip') {
    // ハードプラの flip 蓋（閉じたまま隙間からシートが覗く）＋楕円シールの剥がれ
    const ow = a.hw * 0.44, od = a.hd * 0.34, lt = 0.0044;
    const lid = grp('flip-lid', { pos: [0, oy - 0.0018, 0] });
    body.add(lid);
    for (const s of [1, -1]) {
      lid.add(mesh(rbx(ow * 2, lt, 0.0042, 0.0012), M.lid, { name: 'lid-bar-z' + s, pos: [0, lt / 2, s * od] }));
      lid.add(mesh(rbx(0.0042, lt, od * 2, 0.0012), M.lid, { name: 'lid-bar-x' + s, pos: [s * ow, lt / 2, 0] }));
    }
    lid.add(mesh(rbx(ow * 2 - 0.004, 0.0012, od * 2 - 0.004, 0.0008), M.lidDark, { name: 'lid-tray', pos: [0, 0.0006, 0], cast: false }));
    lid.add(mesh(rbx(ow * 1.86, 0.0026, od * 1.82, 0.0011), M.lid, { name: 'lid-cover', pos: [0, lt - 0.0006, 0] }));
    lid.add(mesh(rbx(ow * 1.44, 0.0007, od * 1.30, 0.0005), M.band, { name: 'lid-print', pos: [0, lt + 0.0006, 0], cast: false }));
    lid.add(mesh(box(0.0044, 0.0030, od * 1.9), M.lidDark, { name: 'lid-hinge', pos: [0, lt * 0.5, -od - 0.0022], cast: false }));
    // 蓋の隙間（中身の白）＋突き出すシート
    lid.add(mesh(rbx(ow * 1.6, 0.0009, od * 1.5, 0.0005), M.tissue, { name: 'lid-gap-white', pos: [0, lt * 0.42, 0], cast: false }));
    tissueTips(body, M, ow * 0.30, oy + lt + 0.0004, od * 0.55, 3, a.hd * 0.40, rnd, -0.5);
    // 剝がれかけた楕円シール
    const st = grp('seal', { pos: [-ow * 0.30, oy + lt + 0.0012, 0], rot: [0, -0.20, 0] });
    body.add(st);
    st.add(mesh(cyl(od * 1.02, od * 0.98, 0.0006, 22), M.sticker, { name: 'oval-seal', scale: [1.7, 1, 1], cast: false }));
    const curl = mesh(rbx(od * 1.05, 0.0005, od * 0.60, 0.0003), M.sticker, { name: 'seal-curl', pos: [od * 1.06, 0.0013, od * 0.30], rot: [0, 0.2, -0.19], cast: false });
    noHull(curl); st.add(curl);
  } else {
    // 紙箱：天面スリットから布が掛け出る
    body.add(mesh(rbx(a.hw * 0.60, 0.0009, 0.0060, 0.0005), M.ink, { name: 'box-slit', pos: [a.hw * 0.14, oy + 0.0004, -a.hd * 0.04], cast: false }));
    const dr = foldedCloth(body, M, a.hw * 0.16, oy + 0.0016, 0.0010, a.hw * 0.34, a.hd * 0.44, 3, [0.04, 0.14, -0.04], M.clothDark);
    dr.add(mesh(rbx(a.hw * 0.30, 0.0010, a.hd * 0.40, 0.0005), M.clothDark, { name: 'cloth-hem', pos: [0.0014, 0.0042, 0], cast: false }));
    // 前縁まで垂れる布（包装内側ではなく外に掛ける）
    const hang = mesh(rbx(a.hw * 0.30, 0.0180, 0.0010, 0.0005), M.cloth, { name: 'cloth-drape', pos: [a.hw * 0.20, oy - 0.0060, zFront(a.hw * 0.20, 0, sp, a, 0.0002)], rot: [0, 0, 0.05], cast: false });
    noHull(hang); body.add(hang);
    // 天面の印刷帯・小口のかぶせ
    body.add(mesh(rbx(a.hw * 1.42, 0.0007, a.hd * 1.36, 0.0004), M.top, { name: 'box-top-print', pos: [-a.hw * 0.10, oy + 0.0009, 0], cast: false }));
    for (const s of [1, -1]) {
      body.add(mesh(rbx(a.hw * 1.84, 0.0011, 0.0018, 0.0004), M.paperBox, { name: 'box-seam-z' + s, pos: [0, -a.hh * 0.55 * s, s * zFront(0, -a.hh * 0.55, sp, a) * 0.985], cast: false }));
    }
  }

  /* --- 生活痕 --- */
  const zf = (x, y) => zFront(x, y, sp, a, 0.0009);
  if (sp.defect === 'wrinkle') {
    decal(body, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 31, density: 1.6 }), w: 0.038, h: 0.014, pos: [-a.hw * 0.42, a.hh * 0.16, zf(a.hw * 0.42, a.hh * 0.16)], opacity: 0.30 });
  }
  if (sp.defect === 'peel') {
    weather(body, { w: 0.028, h: 0.012, pos: [a.hw * 0.50, -a.hh * 0.18, zf(a.hw * 0.50, -a.hh * 0.18)], kind: 'chip', color: '#ffffff', opacity: 0.34, seed: seed + 32, density: 1.3, spread: 0.002 });
  }
  if (sp.defect === 'corner') {
    // 紙箱の一角が潰れて地が見える
    const p = bag.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = Math.exp(-((x - a.hw * 0.86) ** 2 + (y - a.hh * 0.72) ** 2 + (z + a.hd * 0.66) ** 2) / 0.00040);
      if (k > 0.02) { p.setX(i, x - k * 0.0065); p.setY(i, y - k * 0.0080); p.setZ(i, z + k * 0.0040); }
    }
    p.needsUpdate = true;
    bag.geometry.computeVertexNormals();
    body.add(mesh(rbx(0.0096, 0.0058, 0.0068, 0.0015), M.tissueShade, { name: 'corner-bruise', pos: [a.hw * 0.84, a.hh * 0.60, -a.hd * 0.70], rot: [0.3, 0.4, 0.2], cast: false }));
    weather(body, { w: 0.022, h: 0.009, pos: [a.hw * 0.78, a.hh * 0.06, zf(a.hw * 0.78, 0)], kind: 'chip', color: '#d8cfc0', opacity: 0.42, seed: seed + 33, density: 1.4, spread: 0.0015 });
  }
  if (sp.defect === 'sag') {
    decal(body, { map: TEX.wear({ kind: 'dirt', color: '#c9c2ae', seed: seed + 34, density: 1.2 }), w: 0.048, h: 0.018, pos: [0, -a.hh + 0.0022, 0], rot: [PI / 2, 0, 0], opacity: 0.30 });
  }
  weather(body, { w: 0.058, h: 0.005, pos: [a.hw * 0.18, -a.hh * 0.66, a.hd * 0.84], kind: 'dirt', color: '#a49c88', opacity: 0.32, seed: seed + 35, density: 1.3, spread: 0.0012 });
  decal(body, { map: TEX.wear({ kind: 'dirt', color: '#ded8c8', seed: seed + 36, density: 0.8 }), w: 0.014, h: 0.012, pos: [-a.hw * 0.28, -a.hh * 0.14, zf(a.hw * 0.28, a.hh * 0.14)], rot: [0, 0, 0.5], opacity: 0.24 });
  return u;
}

/* ---------------- トイレットロール束 ---------------- */
function rollsAndWrap(body, M, sp, rnd, seed) {
  const R = 0.0242, cz = 0.0248, halfLen = 0.0878;
  const yc = R + 0.0006;
  for (const s of [1, -1]) {
    const r = grp('roll', { pos: [0, yc, s * cz], rot: [0, 0, PI / 2] });   // 軸を X へ
    body.add(r);
    r.add(mesh(cyl(R, R, halfLen * 2 - 0.004, 26), M.roll, { name: 'roll-body' + s }));
    // 巻の段（周目）
    for (let i = 0; i < 4; i++) {
      const t = mesh(tor(R - 0.0007 - i * 0.0015, 0.0006, 6, 22), i % 2 ? M.roll : M.rollShade, {
        name: `roll-wind${s}-${i}`, pos: [0, (i - 1.5) * 0.026, 0], rot: [PI / 2, 0, 0], cast: false,
      });
      noHull(t); r.add(t);
    }
    // 端面部：渦巻き・紙芯・芯穴
    for (const e of [1, -1]) {
      const ey = e * (halfLen - 0.0022);
      r.add(mesh(cyl(R * 0.985, R * 0.985, 0.0010, 26), M.rollShade, { name: 'roll-face' + e, pos: [0, ey, 0], cast: false }));
      for (let i = 1; i <= 3; i++) {
        const t = mesh(tor(R - i * 0.0040, 0.0006, 5, 20), i % 2 ? M.roll : M.tissueShade, {
          name: `end-ring${e}-${i}`, pos: [0, ey - e * (0.0006 + i * 0.0003), 0], rot: [PI / 2, 0, 0], cast: false,
        });
        noHull(t); r.add(t);
      }
      r.add(mesh(cyl(0.0079, 0.0079, 0.0036, 16, true), M.core, { name: 'core' + e, pos: [0, ey - e * 0.0018, 0], cast: false }));
      r.add(mesh(cyl(0.0070, 0.0070, 0.0008, 14), M.ink, { name: 'core-hole' + e, pos: [0, ey - e * 0.0034, 0], cast: false }));
    }
  }
  // 出し端のしり尾（一枚めくれた紙）
  body.add(mesh(rbx(0.0340, 0.0006, 0.0280, 0.0003), M.roll, { name: 'sheet-tail', pos: [-halfLen * 0.40, yc + R * 0.66, cz + R * 0.42], rot: [0.46, 0.12, -0.09], cast: false }));
  body.add(mesh(rbx(0.0280, 0.0005, 0.0220, 0.0003), M.tissueShade, { name: 'sheet-tail-under', pos: [-halfLen * 0.38, yc + R * 0.56, cz + R * 0.52], rot: [0.60, 0.12, -0.09], cast: false }));

  /* --- フィルム（二巻を跨ぐ花生断面のシュリンク） --- */
  const RF = R + 0.0008;
  const nu = 42, nv = 24;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const th = (j / nv) * PI * 2;
    const uy = Math.cos(th), uz = Math.sin(th);
    const disc = Math.max(0, uz * uz * cz * cz - cz * cz + RF * RF);
    const s1 = uz * cz + Math.sqrt(disc);
    const s2 = -uz * cz + Math.sqrt(disc);
    const rad = Math.max(R * 0.55, Math.max(s1, s2));
    for (let i = 0; i <= nu; i++) {
      const t = i / nu;
      const x = -halfLen + t * 2 * halfLen;
      const k = Math.abs(x) / halfLen;
      const taper = 1 - 0.30 * Math.pow(Math.max(0, (k - 0.74) / 0.26), 2.0);
      const wr = 0.0007 * Math.sin(th * 6.0 + x * 58 + (seed % 7)) * (0.4 + 0.6 * (1 - k))
        + 0.0004 * Math.sin(th * 14.0 - x * 33);
      pos.push(x, yc + (uy + wr) * rad * taper, (uz + wr) * rad * taper);
      uv.push(t, j / nv);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a2 = j * (nu + 1) + i, c = a2 + 1, b = a2 + nu + 1, d = b + 1;
      idx.push(a2, b, c, c, b, d);
    }
  }
  const film = new THREE.BufferGeometry();
  film.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  film.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  film.setIndex(idx);
  film.computeVertexNormals();
  body.add(mesh(film, M.bag, { name: 'roll-wrap', cast: false, renderOrder: 4 }));
  for (const s of [1, -1]) {
    body.add(mesh(endFinGeo(0.0074, 0.0340, 6, 0.0022), M.fin, { name: 'roll-fin-' + s, pos: [s * halfLen * 0.985, yc, 0], rot: [0, s > 0 ? 0 : PI, 0] }));
    body.add(mesh(rbx(0.0026, 0.0040, 0.0300, 0.0008), M.foil, { name: 'roll-fin-root-' + s, pos: [s * halfLen * 0.965, yc, 0], cast: false }));
  }
  // 正面／背面を巻く腰帯印刷（フィルムの平らな帯域にだけ密着させる）
  for (const s of [1, -1]) {
    body.add(noHull(mesh(rbx(HW * 1.30, 0.0100, 0.0005, 0.0003), M.front, {
      name: 'roll-print-band' + s, pos: [0, yc, s * (cz + R + 0.0018)], rot: [0, s > 0 ? 0 : PI, 0], cast: false, renderOrder: 5,
    })));
  }
  // 二巻の谷に入るフィルムの押さえ筋（頂を結ぶ細い山）
  body.add(noHull(mesh(rbx(halfLen * 1.58, 0.0011, 0.0022, 0.0004), M.rollShade, {
    name: 'film-valley-ridge', pos: [0, yc + 0.0139, 0], cast: false,
  })));
  weather(body, { w: 0.056, h: 0.012, pos: [halfLen * 0.30, yc - R * 0.20, cz + R * 0.88], kind: 'scratch', color: '#ffffff', opacity: 0.26, seed: seed + 37, density: 1.5, spread: 0.0018 });
  decal(body, { map: TEX.wear({ kind: 'dirt', color: '#bdb6a3', seed: seed + 38, density: 1.1 }), w: 0.040, h: 0.008, pos: [-halfLen * 0.5, yc - R * 0.50, -cz - R * 0.30], opacity: 0.30 });
}

/* ---------------- 寸法合わせ ---------------- */
function contentBounds(root) {
  const bb = new THREE.Box3();
  const b2 = new THREE.Box3();
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
  g.userData.envelope = bb.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(4));
  return g;
}
export default build;
