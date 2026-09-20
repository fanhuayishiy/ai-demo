import { n as range, g as grp, M as MAT, m as mesh, b as box, h as decal, T as TEX, a as sph, V as Vector3, ai as capsule, c as cyl, D as DoubleSide, S as Shape, ab as Path, R as ExtrudeGeometry, B as BufferGeometry, F as Float32BufferAttribute, z as rand, ac as Box3 } from './index-2XMcV6P5.js';

//  assets/products/onigiri.js —— おにぎり（5 variant）
//  構成：単位球を頂点変位で三角球体化（米粒の凹凸＝ノイズ変位、底は平面化）／個別米粒・具の粒／
//        のり（パラメトリックシート、端のめくれ・縦すじ）／ラップフィルム（半透明・シワ・シール筋・めくれ）／
//        黒 PP 底トレイ（フランジ・型筋）／陳列用の傾き／トレイ内の脱落米粒と塩霜。

const meta = {
  id: 'onigiri',
  real: [0.075, 0.055, 0.060],
  origin: 'ground-center',
  variants: ['salmon', 'kombu', 'tunamayo', 'mentaiko', 'okaka'],
};
const VARIANTS = meta.variants;

const W = 0.075, H = 0.055, D = 0.060;
const FLAT = -0.66;                              // 底の平面化位置（単位球基準）

const SPEC = {
  salmon:   { rice: '#fbf7ee', k: 0.30, nori: [0.62, 0.24], film: true,  tilt: -0.11, topo: 'flake',  flake: '#e8766a', bump: 1.00, defect: 'loose' },
  kombu:    { rice: '#f7f2e4', k: 0.27, nori: [0.92, 0.34], film: false, tilt: -0.05, topo: 'none',   flake: '#2f3a2c', bump: 0.90, defect: 'torn' },
  tunamayo: { rice: '#f9f4e6', k: 0.33, nori: [0.56, 0.20], film: true,  tilt: -0.15, topo: 'dollop', flake: '#f0dcae', bump: 1.06, defect: 'creased' },
  mentaiko: { rice: '#faf5e8', k: 0.29, nori: [0.66, 0.22], film: true,  tilt: -0.08, topo: 'dollop', flake: '#d9534f', bump: 1.02, defect: 'loose' },
  okaka:    { rice: '#f3ead6', k: 0.31, nori: [0.46, 0.16], film: false, tilt: -0.13, topo: 'bonito', flake: '#6b4a34', bump: 0.96, defect: 'torn' },
};

const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------- 形状ヘルパ */
/** 三角球体の寸法定数（飾り余裕 M を取って meta.real に収める） */
function makeSH(k, height, margin) {
  const sy = height / (1 + k - FLAT);
  return { k, sx: (W / 2 - margin) / (0.866 * (1 + k)), sy, sz: D / 2 - margin, yShift: -FLAT * sy, yTop: height };
}
/** 単位球上の点 → おにぎり表面（三角化 → 底の平面化 → スケール → 昇降） */
function ricePoint(X, Y, Z, sh) {
  const th = Math.atan2(Y, X), rad = Math.hypot(X, Y);
  const rho = 1 + sh.k * Math.cos(3 * (th - Math.PI / 2));
  const x = Math.cos(th) * rad * rho;
  let y = Math.sin(th) * rad * rho;
  if (y < FLAT) y = FLAT;
  return new Vector3(x * sh.sx, y * sh.sy + sh.yShift, Z * sh.sz);
}
function riceNormal(p, sh) {
  return new Vector3(p.x / (sh.sx * sh.sx), (p.y - sh.yShift) / (sh.sy * sh.sy), p.z / (sh.sz * sh.sz)).normalize();
}
/** 米粒の凹凸（決定的ノイズ） */
function bumpAt(p, sh, ph) {
  const s = 780;
  return sh.bumpA * 0.00055 * (
    Math.sin(p.x * s * 1.0 + (p.y - sh.yShift) * s * 1.7 + ph[0]) * 0.55 +
    Math.sin(p.z * s * 1.9 - p.x * s * 0.8 + ph[1]) * 0.45 +
    Math.sin((p.x + p.z + p.y - sh.yShift) * s * 1.15 + ph[2]) * 0.30
  );
}
/** パラメトリック・シート（のり／フィルム） */
function sheetGeo(nu, nv, fn) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      const p = fn(u, v);
      pos.push(p.x, p.y, p.z);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** 角丸矩形 Shape（トレイ用） */
function rrPath(s, w, d, r) {
  const x = w / 2, y = d / 2, rr = Math.min(r, x * 0.9, y * 0.9);
  s.moveTo(-x + rr, -y);
  s.lineTo(x - rr, -y); s.quadraticCurveTo(x, -y, x, -y + rr);
  s.lineTo(x, y - rr); s.quadraticCurveTo(x, y, x - rr, y);
  s.lineTo(-x + rr, y); s.quadraticCurveTo(-x, y, -x, y - rr);
  s.lineTo(-x, -y + rr); s.quadraticCurveTo(-x, -y, -x + rr, -y);
}
function frameGeo(w, d, r, t, h) {
  const outer = new Shape();
  rrPath(outer, w, d, r);
  const hole = new Path();
  rrPath(hole, w - t, d - t, Math.max(0.0012, r - t * 0.6));
  outer.holes.push(hole);
  const geo = new ExtrudeGeometry(outer, { depth: h, bevelEnabled: false, curveSegments: 5 });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'salmon');
  const sp = SPEC[key] || SPEC.salmon;
  const sc = options.scale ?? 1;
  const ph = [range(rnd, 0, 9), range(rnd, 0, 9), range(rnd, 0, 9)];

  const TRAY_H = 0.0082;
  const M = 0.0058;                                                  // フィルム・米粒・のりのための余裕
  const topPad = (sp.film ? 0.0020 : 0.0010) + (sp.topo === 'dollop' ? 0.0050 : 0)
    + (sp.topo === 'bonito' ? 0.0018 : 0) + (sp.topo === 'flake' ? 0.0006 : 0);
  const riceH = H - 0.0006 - (TRAY_H - 0.0016) - topPad;
  const sh = makeSH(sp.k, riceH, M);
  sh.bumpA = sp.bump;

  const g = grp('onigiri');

  /* ---- 底トレイ（黒 PP ブリスター） ---- */
  const tray = grp('tray');
  g.add(tray);
  const pp = MAT.hardPlastic('#272a2e', { repeat: 6, spec: 0.44, specPower: 62, sat: 0.9 });
  const ppIn = MAT.plastic('#35383d', { spec: 0.24, steps: 2 });
  tray.add(mesh(frameGeo(W - 0.002, D - 0.002, 0.010, 0.0024, TRAY_H), pp, { name: 'tray-wall' }));
  tray.add(mesh(box(W - 0.007, 0.0016, D - 0.007), ppIn, { name: 'tray-floor', pos: [0, 0.0011, 0] }));
  for (let i = 0; i < 3; i++) {                                     // 底の型筋
    tray.add(mesh(box(W - 0.016, 0.0007, 0.0014), pp, { pos: [0, 0.0021, -D / 2 + 0.013 + i * 0.0105], cast: false, receive: false }));
  }
  tray.add(mesh(frameGeo(W, D, 0.011, 0.0026, 0.0014), pp, { name: 'tray-flange', pos: [0, TRAY_H - 0.0007, 0] }));
  decal(tray, { map: TEX.wear({ kind: 'dirt', color: '#e6e2d6', seed: seed + 3, density: 1.3 }), w: 0.040, h: 0.024, pos: [0.004, TRAY_H - 0.0036, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.32 });

  /* ---- 米粒本体 ---- */
  const riceGrp = grp('rice-body', { pos: [0, TRAY_H - 0.0016, -8e-4], rot: [sp.tilt * 0.55, 0.03, 0.012] });
  g.add(riceGrp);
  const base = sph(1, 30, 20).clone();
  const pos = base.attributes.position;
  const v3 = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const p = ricePoint(v3.x, v3.y, v3.z, sh);
    const n = riceNormal(p, sh);
    const onBase = p.y <= sh.yShift + 0.0009;
    p.addScaledVector(n, onBase ? 0 : bumpAt(p, sh, ph));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
  base.computeVertexNormals();
  riceGrp.add(mesh(base, MAT.rice({ color: sp.rice, spec: 0.36, specPower: 40, tint: '#fffaf0' }), { name: 'rice' }));

  /* ---- 表面の個別米粒／具の粒 ---- */
  const grainGeo = capsule(0.0015, 0.0028, 5);
  const grainMat = MAT.rice({ color: '#fffdf6', spec: 0.44, specPower: 48 });
  const fillMat = MAT.food({ color: sp.flake, spec: 0.38, steps: 3 });
  function scatter(count, mat, scale, eRange, aRange) {
    for (let i = 0; i < count; i++) {
      const a = range(rnd, aRange[0], aRange[1]);
      const e = range(rnd, eRange[0], eRange[1]);
      const X = Math.sin(e) * Math.cos(a), Y = Math.cos(e), Z = Math.sin(e) * Math.sin(a);
      const p = ricePoint(X, Y, Z, sh);
      if (p.y <= sh.yShift + 0.0020) continue;                       // 底面には置かない
      const n = riceNormal(p, sh);
      p.addScaledVector(n, 0.0004);
      const gm = mesh(grainGeo, mat, { cast: false });
      gm.position.copy(p);
      gm.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), n);
      gm.rotateOnAxis(n, range(rnd, -1.2, 1.2));
      gm.scale.set(scale[0], scale[1] * range(rnd, 0.86, 1.26), scale[2]);
      riceGrp.add(gm);
    }
  }
  scatter(18, grainMat, [1, 1, 1], [0.5, 2.5], [0, Math.PI * 2]);
  if (sp.topo === 'flake') scatter(8, fillMat, [0.92, 0.72, 0.85], [0.7, 2.2], [Math.PI * 0.15, Math.PI * 0.85]);

  /* ---- 天面のせもの ---- */
  if (sp.topo === 'dollop') {
    const dollop = grp('topping', { pos: [0.002, sh.yTop - 0.0038, 0.004] });
    riceGrp.add(dollop);
    const dMat = MAT.food({ color: sp.flake, spec: 0.46, specPower: 30, shadowAmt: 0.6 });
    for (let i = 0; i < 4; i++) {
      const s = 0.0054 - i * 0.0011;
      dollop.add(mesh(sph(s, 10, 8), dMat, { pos: [range(rnd, -24e-4, 0.0024), i * 0.0024, range(rnd, -22e-4, 0.0022)], cast: false }));
    }
    dollop.add(mesh(cyl(0.0014, 0.0020, 0.0032, 8), dMat, { pos: [0.0030, 0.0092, -16e-4], rot: [0.2, 0, -0.5], cast: false }));
  }
  if (sp.topo === 'bonito') {
    const bMat = MAT.food({ color: '#7a4f33', spec: 0.32, side: DoubleSide, shadowAmt: 0.8 });
    for (let i = 0; i < 9; i++) {
      const a = range(rnd, 0, Math.PI * 2), rr = range(rnd, 0.002, 0.015);
      const fl = mesh(box(0.0070, 0.0005, 0.0044), bMat, { cast: false, receive: false });
      fl.position.set(Math.cos(a) * rr, sh.yTop - 0.0012 + range(rnd, -12e-4, 0.0018), Math.sin(a) * rr * 0.8);
      fl.rotation.set(range(rnd, -0.5, 0.5), range(rnd, 0, 3), range(rnd, -0.7, 0.7));
      riceGrp.add(fl);
    }
  }

  /* ---- のり（前面下_band_、端がめくれる） ---- */
  const [span, bandH] = sp.nori;
  const noriMat = MAT.nori({ side: DoubleSide, spec: 0.36, specPower: 56, steps: 3 });
  const eMid = Math.PI * 0.5 + 0.30;
  const e0 = eMid - bandH * Math.PI * 0.55, e1 = eMid + bandH * Math.PI * 0.55;
  const curlAt = (u, v) => {
    const eu = Math.min(u, 1 - u), ev = Math.min(v, 1 - v);
    let o = 0.0005;
    if (eu < 0.17) o += Math.pow((0.17 - eu) / 0.17, 1.7) * 0.0024;
    if (ev < 0.20) o += Math.pow((0.20 - ev) / 0.20, 1.6) * 0.0011;
    return o;
  };
  riceGrp.add(mesh(sheetGeo(26, 10, (u, v) => {
    const a = Math.PI / 2 + lerp(-span, span, u);
    const e = lerp(e0, e1, v);
    const X = Math.sin(e) * Math.cos(a), Y = Math.cos(e), Z = Math.sin(e) * Math.sin(a);
    const p = ricePoint(X, Y, Z, sh);
    const n = riceNormal(p, sh);
    p.addScaledVector(n, curlAt(u, v) + 0.0003 + 0.00022 * Math.sin(u * 44));
    return p;
  }), noriMat, { name: 'nori', cast: false }));

  /* ---- ラップフィルム ---- */
  if (sp.film) {
    const filmMat = MAT.glassLite({ color: '#f4fafa', opacity: 0.28, spec: 1.0, specPower: 250, specCut: 0.05, sheen: 0.52, rim: 0.55, side: DoubleSide, steps: 2 });
    riceGrp.add(mesh(sheetGeo(28, 18, (u, v) => {
      const a = u * Math.PI * 2, e = v * Math.PI;
      const X = Math.sin(e) * Math.cos(a), Y = Math.cos(e), Z = Math.sin(e) * Math.sin(a);
      const p = ricePoint(X, Y, Z, sh);
      const n = riceNormal(p, sh);
      const wr = 0.0009 * Math.sin(a * 5.5 + e * 3.1) + 0.0005 * Math.sin(a * 12 - e * 6.2);
      if (p.y > sh.yShift + 0.0012) p.addScaledVector(n, 0.0014 + wr);
      p.y = Math.max(0.0003, p.y);
      return p;
    }), filmMat, { name: 'wrap-film', cast: false, receive: false, renderOrder: 8 }));
    // フィルムのシール筋＋天面のつば
    const seam = mesh(box(0.030, 0.0007, 0.0044), MAT.glassLite({ color: '#ffffff', opacity: 0.5, side: DoubleSide }), {
      name: 'film-seam', pos: [0, sh.yTop + 0.0012, 0], cast: false, receive: false,
    });
    seam.rotation.z = 0.05;
    riceGrp.add(seam);
    if (sp.defect === 'loose') {
      riceGrp.add(mesh(sheetGeo(10, 6, (u, v) => new Vector3(
        lerp(-0.024, 0.016, u), 0.0006 + v * 0.0090 - v * v * 0.0070, lerp(D * 0.18, D * 0.31, u) + v * 0.0016,
      )), filmMat, { name: 'film-peel', cast: false, receive: false, renderOrder: 9 }));
    }
  }

  /* ---- トレ内の落とし物（米粒・塩・のり片） ---- */
  for (let i = 0; i < 5; i++) {
    const gm = mesh(grainGeo, i < 3 ? grainMat : MAT.rice({ color: '#f2ece0' }), { cast: false, receive: false });
    gm.position.set(range(rnd, -W / 2 + 0.011, W / 2 - 0.011), TRAY_H - 0.0042, range(rnd, -D / 2 + 0.010, D / 2 - 0.010));
    gm.rotation.set(Math.PI / 2 + range(rnd, -0.3, 0.3), range(rnd, 0, 3), range(rnd, -0.3, 0.3));
    gm.scale.setScalar(range(rnd, 0.6, 0.86));
    g.add(gm);
  }
  if (sp.defect === 'torn') {
    const scrap = mesh(box(0.0115, 0.0005, 0.0074), MAT.nori({ side: DoubleSide }), { cast: false, receive: false });
    scrap.position.set(range(rnd, -0.02, 0.020), TRAY_H - 0.0040, range(rnd, -0.013, 0.006));
    scrap.rotation.set(0, range(rnd, 0, 3), range(rnd, -0.2, 0.2));
    g.add(scrap);
  }
  if (sp.defect === 'creased') {
    // 指で押したへこみ（天面の一部を沈める）
    const p2 = base.attributes.position;
    for (let i = 0; i < p2.count; i++) {
      const x = p2.getX(i), y = p2.getY(i); p2.getZ(i);
      const d = Math.hypot(x - 0.012, y - (sh.yTop - 0.006));
      if (d < 0.012) {
        const w = Math.pow(1 - d / 0.012, 2);
        p2.setY(i, y - 0.0042 * w);
        p2.setX(i, x + 0.0016 * w);
      }
    }
    p2.needsUpdate = true;
    base.computeVertexNormals();
  }

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

const P_ONI = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_ONI as P };
