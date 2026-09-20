import { g as grp, n as range, M as MAT, D as DoubleSide, T as TEX, m as mesh, b as box, c as cyl, k as tubeOf, h as decal, B as BufferGeometry, F as Float32BufferAttribute, S as Shape, R as ExtrudeGeometry, r as rbox, z as rand, ac as Box3 } from './index-CxdYZv8e.js';

//  assets/products/chip-bag.js —— ポテトチップスの袋（6 variant）
//  構成：(superellipse) 断面前よみ-pillow 形状を頂点でふくらませた袋／上面・下面のシーラーフィン（ギザ刃）／
//        前面・背面の曲面印刷パッチ＋商品名帯／クリップ止め（折り込み天＋樹脂クリップ）／
//        棚フック掛け穴（フィン抜きのユーロ穴）／シワ・へこみ・破れ・色褪せ。

const meta = {
  id: 'chip-bag',
  real: [0.110, 0.210, 0.055],
  origin: 'ground-center',
  variants: ['salt', 'udon', 'shio', 'nori', 'kettle', 'cheese'],
};
const VARIANTS = meta.variants;

const W = 0.110, H = 0.210, D = 0.055;
const FIN = 0.016;                                    // シーラーフィンの高さ

const SPEC = {
  salt:   { title: 'うま塩', sub: 'POTATO CHIPS 塩', bg: '#f5e3ac', accent: '#c8962c', band: '#d9a832', body: 1.00, hang: true, clip: false, defect: 'torn', n: 3.0 },
  udon:   { title: '揚げうどん', sub: 'UDON CRISPS', bg: '#e6eef4', accent: '#2f6fa8', band: '#4a86b8', body: 0.94, hang: false, clip: false, defect: 'crease', n: 3.4 },
  shio:   { title: '塩ぽてと', sub: 'SHIO POTATO', bg: '#eef3e0', accent: '#5f8f3f', band: '#7fa63f', body: 1.02, hang: true, clip: false, defect: 'faded', n: 2.8 },
  nori:   { title: 'のりしお', sub: 'SEAWEED FLAVOR', bg: '#dfe8dc', accent: '#2f4a34', band: '#3d5f42', body: 0.98, hang: false, clip: false, defect: 'crush', n: 3.1 },
  kettle: { title: '厚切り', sub: 'KETTLE COOKED', bg: '#f2e0cf', accent: '#a33b2c', band: '#b8452f', body: 0.74, hang: false, clip: false, defect: 'scuff', n: 3.8 },
  cheese: { title: 'チェダー', sub: 'CHEESE CHIPS', bg: '#f7dcb0', accent: '#d98a1f', band: '#e89b28', body: 0.92, hang: false, clip: true, defect: 'torn', n: 3.2 },
};

const lerp = (a, b, t) => a + (b - a) * t;
const sgn = (x) => (x < 0 ? -1 : 1);
const rbx = (w, h, d, r) => rbox(w, h, d, r, 2);

/** 断面積（superellipse）：u = 角度, hw/hd = 半径 */
function sectionPoint(u, hw, hd, n) {
  const c = Math.cos(u), s = Math.sin(u);
  return [sgn(c) * Math.pow(Math.abs(c), 2 / n) * hw, sgn(s) * Math.pow(Math.abs(s), 2 / n) * hd];
}
/** 高さ v(0..1) → 半幅・半膨らみ */
function profileAt(v, sp, rnd0) {
  const shoulder = 0.135, top = 1 - 0.135 - (sp.clip ? 0.055 : 0);
  let b;
  if (v < shoulder) b = Math.pow(v / shoulder, 1.35);
  else if (v > top) b = Math.pow(Math.max(0, (1 - v) / (1 - top)), 1.25);
  else b = 1 + 0.055 * Math.sin(((v - shoulder) / (top - shoulder)) * Math.PI);
  const taper = 1 - 0.055 * Math.pow(Math.abs(v - 0.44) * 2, 2.2);
  return { hw: Math.max(0.004, (W / 2) * 0.966 * taper), hd: Math.max(0.0008, (D / 2) * 0.88 * b * sp.body), top };
}
/** 袋本体のパラメトリック表面 */
function bagGeo(sp, seedN) {
  const nu = 44, nv = 26;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const { hw, hd } = profileAt(v, sp);
    const y = FIN + v * (H - 2 * FIN);
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * Math.PI * 2;
      const [x, z] = sectionPoint(u, hw, hd, sp.n);
      // フィルムのシワ（縦じる・横しわ）
      const wr = 0.00072 * Math.sin(u * 9.0 + v * 7.3 + seedN) * (0.30 + 0.70 * Math.sin(v * Math.PI))
        + 0.00042 * Math.sin(u * 17.0 - v * 11.0 + seedN * 1.7)
        + 0.00055 * Math.sin(u * 2.0 + v * 5.0);
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
/** 袋面に沿った印刷パッチ（θ=v 方向は u 指数で指定） */
function patchGeo(sp, u0, u1, v0, v1, off, nu = 16, nv = 10) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = lerp(v0, v1, j / nv);
    const { hw, hd } = profileAt(v, sp);
    const y = FIN + v * (H - 2 * FIN);
    for (let i = 0; i <= nu; i++) {
      const u = lerp(u0, u1, i / nu);
      const [x, z] = sectionPoint(u, hw + off, hd + off * 0.55, sp.n);
      pos.push(x, y, z);
      uv.push(i / nu, 1 - j / nv);
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
/** ギザ刃つきのシーラーフィン（上端が鋸刃／up=false なら下端が鋸刃） */
function finGeo(w, h, teeth, depth, up) {
  const s = new Shape();
  const x0 = -w / 2, x1 = w / 2, n = Math.max(4, teeth), dx = (x1 - x0) / n;
  const lo = 0.0008, sh = h * 0.74;
  s.moveTo(x0, lo);
  s.lineTo(x1, lo);
  s.lineTo(x1, sh);
  for (let i = 0; i < n; i++) {
    const xa = x1 - i * dx;
    s.lineTo(xa - dx * 0.5, h);
    s.lineTo(xa - dx, sh);
  }
  s.lineTo(x0, lo);
  const geo = new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 2 });
  if (!up) { geo.rotateX(Math.PI); geo.translate(0, h, 0); }
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'salt');
  const sp = SPEC[key] || SPEC.salt;
  const sc = options.scale ?? 1;
  const seedN = (seed % 17) * 0.37;

  const g = grp('chip-bag');
  const slight = range(rnd, -0.045, 0.045);            // 陳列の小さな傾き

  /* ---- 素材 ---- */
  const film = MAT.paint(sp.bg, {
    spec: 0.46, specPower: 74, specCut: 0.2, sheen: 0.12, shadowAmt: 0.7, steps: 3,
    map: TEX.paper({ base: sp.bg, repeat: 3 }).map, side: DoubleSide, sat: 1.04,
  });
  const foilIn = MAT.metal('#cfd3cc', { repeat: 8, spec: 0.7, sheen: 0.2 });

  /* ---- 袋本体 ---- */
  const bag = mesh(bagGeo(sp, seedN), film, { name: 'bag-body', renderOrder: 1 });
  const holder = grp('bag', { rot: [0.02, slight, range(rnd, -0.02, 0.02)] });
  g.add(holder);
  holder.add(bag);

  /* ---- 印刷（前面・背面・名帯） ---- */
  const front = MAT.poster({
    map: TEX.poster({ title: sp.title, sub: sp.sub, bg: sp.bg, accent: sp.accent, seed: (seed % 83) + 5 }),
    side: DoubleSide, steps: 3, sat: sp.defect === 'faded' ? 0.72 : 1.06,
    tint: sp.defect === 'faded' ? '#fff3e2' : '#ffffff', spec: 0.4, specPower: 70,
  });
  const back = MAT.poster({
    map: TEX.poster({ title: sp.sub, sub: '内容量 65g / 原材料名 馬鈴薯', bg: '#f6f2e6', accent: sp.band, seed: (seed % 61) + 23 }),
    side: DoubleSide, steps: 3, sat: 1.0, spec: 0.34,
  });
  const bandMat = MAT.poster({
    map: TEX.drinkLabel({ name: sp.title, sub: sp.sub, ml: '65g', a: sp.band, b: sp.bg, kind: 'bag' }),
    side: DoubleSide, uv: { offset: [0.5, 0] }, steps: 3, sat: sp.defect === 'faded' ? 0.74 : 1.06, spec: 0.44,
  });
  const PI = Math.PI;
  holder.add(mesh(patchGeo(sp, PI / 2 - 1.02, PI / 2 + 1.02, 0.16, 0.90, 0.0006), front, { name: 'print-front', cast: false, receive: false, renderOrder: 3 }));
  holder.add(mesh(patchGeo(sp, -PI / 2 - 1.02, -PI / 2 + 1.02, 0.16, 0.90, 0.0006), back, { name: 'print-back', cast: false, receive: false, renderOrder: 3 }));
  holder.add(mesh(patchGeo(sp, PI / 2 - 1.24, PI / 2 + 1.24, 0.42, 0.60, 0.0009), bandMat, { name: 'print-band', cast: false, receive: false, renderOrder: 4 }));
  holder.add(mesh(patchGeo(sp, -PI / 2 - 1.24, -PI / 2 + 1.24, 0.42, 0.60, 0.0009), bandMat, { name: 'print-band-back', cast: false, receive: false, renderOrder: 4 }));

  /* ---- 上下シーラーフィン（ギザ刃） ---- */
  const finMat = MAT.paint(sp.band, { spec: 0.34, specPower: 48, sheen: 0.1, shadowAmt: 0.8, map: TEX.paper({ base: sp.band, repeat: 4 }).map });
  const fw = W * 0.90;
  const fh = FIN * 1.45;
  holder.add(mesh(finGeo(fw, fh, 15, 0.0026, true), finMat, { name: 'seal-top', pos: [0, H - 0.0006 - fh, -13e-4] }));
  holder.add(mesh(finGeo(fw, fh, 15, 0.0028, false), finMat, { name: 'seal-bottom', pos: [0, 0.0004, -14e-4] }));
  // フィンの際（アルミ内面が覗く）
  holder.add(mesh(box(fw * 0.98, 0.0012, 0.0040), foilIn, { name: 'seal-edge-top', pos: [0, H - FIN - 0.0010, 0], cast: false }));
  holder.add(mesh(box(fw * 0.98, 0.0012, 0.0040), foilIn, { name: 'seal-edge-bottom', pos: [0, FIN + 0.0010, 0], cast: false }));

  /* ---- 棚フック掛け穴 ---- */
  if (sp.hang) {
    const hole = mesh(cyl(0.0042, 0.0042, 0.0060, 12, true), foilIn, { name: 'euro-hole', pos: [0, H - FIN * 0.72, 0], rot: [Math.PI / 2, 0, 0], cast: false });
    holder.add(hole);
    holder.add(mesh(box(0.0086, 0.0020, 0.0056), MAT.paint('#c9c2ae', { steps: 2, shadowAmt: 1 }), { name: 'euro-slot', pos: [0, H - FIN * 0.72, 0], cast: false }));
  }

  /* ---- クリップ止め（天を折り込んで樹脂クリップ） ---- */
  if (sp.clip) {
    const foldY = H - FIN - 0.0046;
    const fold = mesh(rbx(W * 0.88, 0.0080, D * 0.44, 0.0024), film, { name: 'folded-top', pos: [0.001, foldY, 0.0052], rot: [0.10, 0, 0.01], renderOrder: 5 });
    holder.add(fold);
    holder.add(mesh(box(W * 0.86, 0.0014, 0.0040), foilIn, { name: 'fold-crease', pos: [0.001, foldY + 0.0044, 0.0028], rot: [0.10, 0, 0], cast: false }));
    const clipMat = MAT.hardPlastic('#d9534f', { repeat: 4, spec: 0.5 });
    const clip = grp('clip', { pos: [0.004, foldY + 0.0030, 0.0080], rot: [0.10, 0, 0.03] });
    holder.add(clip);
    clip.add(mesh(box(0.0620, 0.0056, 0.0074), clipMat, { name: 'clip-bar' }));
    clip.add(mesh(tubeOf([[-0.03, 0.0022, 0.0], [-0.0352, -3e-3, 0.0], [-0.028, -74e-4, 0.0]], 0.0022, 8, 5), clipMat, { name: 'clip-arm-l', cast: false }));
    clip.add(mesh(tubeOf([[0.0300, 0.0022, 0.0], [0.0352, -3e-3, 0.0], [0.0280, -74e-4, 0.0]], 0.0022, 8, 5), clipMat, { name: 'clip-arm-r', cast: false }));
    clip.add(mesh(box(0.0100, 0.0022, 0.0080), clipMat, { pos: [0.0260, 0.0034, 0], cast: false }));
  }

  /* ---- 欠陥・経年 ---- */
  const zsurf = (y) => profileAt((y - FIN) / (H - 2 * FIN), sp).hd + 0.0014;
  if (sp.defect === 'torn') {
    // 上隅の小さな破れ（内側のアルミが見える）
    holder.add(mesh(box(0.0140, 0.0070, 0.0030), foilIn, { name: 'tear', pos: [-W / 2 + 0.020, H - FIN - 0.010, zsurf(H - FIN - 0.010) - 0.0016], rot: [0, 0, 0.32], cast: false }));
    holder.add(mesh(box(0.0092, 0.0030, 0.0034), MAT.paint('#e9e2cd', { steps: 2 }), { name: 'tear-flap', pos: [-W / 2 + 0.023, H - FIN - 0.006, zsurf(H - FIN - 0.006) + 0.0012], rot: [0.2, 0, 0.5], cast: false }));
  }
  if (sp.defect === 'crease') {
    decal(holder, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 21, density: 1.6 }), w: 0.030, h: 0.070, pos: [0.014, 0.1040, zsurf(0.1040)], opacity: 0.36 });
  }
  if (sp.defect === 'scuff') {
    decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#cfc7ae', seed: seed + 22, density: 1.6 }), w: 0.040, h: 0.026, pos: [-0.02, 0.0620, zsurf(0.0620)], opacity: 0.42 });
  }
  if (sp.defect === 'faded') {
    decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#fff5e4', seed: seed + 23, density: 1.2 }), w: 0.046, h: 0.070, pos: [0.014, 0.1280, zsurf(0.1280)], opacity: 0.50 });
  }
  if (sp.defect === 'crush') {
    const p = bag.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y > H - 0.052) {
        const k = Math.pow((y - (H - 0.052)) / 0.052, 1.4);
        p.setY(i, y - 0.010 * k);
        p.setZ(i, p.getZ(i) * (1 + 0.32 * k));
      }
    }
    p.needsUpdate = true;
    bag.geometry.computeVertexNormals();
  }
  // 底のシワ・棚擦れ
  decal(holder, { map: TEX.wear({ kind: 'dirt', color: '#9e977f', seed: seed + 24, density: 1.3 }), w: 0.050, h: 0.014, pos: [0.004, FIN + 0.0110, -zsurf(FIN + 0.0110)], rot: [0, PI, 0], opacity: 0.36 });
  // 袋内の欠片（折れたチップが角に寄る）
  holder.add(mesh(box(0.0130, 0.0030, 0.0100), MAT.food({ color: '#e6c98a', spec: 0.34 }), { name: 'crumb-inside', pos: [0.020, FIN + 0.0058, 0.004], rot: [0.2, 0.5, 0.1], cast: false }));

  return fitTo(g, [W * sc, H * sc, D * sc]);
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

const P_CHIP = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_CHIP as P, build as b };
