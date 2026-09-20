import { g as grp, M as MAT, n as range, m as mesh, b as box, t as tor, U as circ, c as cyl, T as TEX, h as decal, J as shape, ad as Vector2, R as ExtrudeGeometry, z as rand, V as Vector3, ac as Box3 } from './index-BxWjt-aN.js';

//  assets/products/milk-carton.js —— 無菌紙パック（カートン・5 variant）
//  構成：山型（gable）／角型（brick）／丸肩形状を押出断面で作り起こした立体パック／
//        稜線のシーラーフィン＋折り込みフラップ＋波型刻み／面取り／キャップ（色分け・ローレット・首リング）／
//        印刷面（TEX.poster 縦面＋TEX.drinkLabel 横帯＋adStrip 冷蔵表示）／
//        角の潰れ・折筋・水跡・黄変・印刷剥がれ。

const meta = {
  id: 'milk-carton',
  real: [0.075, 0.205, 0.065],
  origin: 'ground-center',
  variants: ['milk1000', 'milk500', 'juice', 'soy', 'lactic'],
};
const VARIANTS = meta.variants;

const W = 0.075, D = 0.065, H = 0.205;
const BT = 0.0013;                                 // 面取り幅

const SPEC = {
  milk1000: {
    top: 'gable', bodyH: 0.1580, roofH: 0.0410, ridge: 0.0050,
    title: '牛乳', sub: '北海道産 生乳100%', accent: '#2f6fa8', bg: '#f7f5ec',
    band: { name: '牛乳', sub: 'FRESH MILK', ml: '1000ml', a: '#2f6fa8', b: '#eef3f7' },
    cap: '#f4f2ea', capRing: '#2f6fa8', defect: 'corner', corner: [1, 1], print2: 'side', date: '09.28',
  },
  milk500: {
    top: 'gable', bodyH: 0.1700, roofH: 0.0290, ridge: 0.0042,
    title: '牛乳', sub: '低温殺菌 500ml', accent: '#3f8fbf', bg: '#f6f4ea',
    band: { name: '低温殺菌', sub: 'PASTEURIZED', ml: '500ml', a: '#3f8fbf', b: '#e9f4f8' },
    cap: '#e6f0f6', capRing: '#3f8fbf', defect: 'crease', corner: [-1, 1], print2: 'back', date: '10.02',
  },
  juice: {
    top: 'flat', bodyH: 0.2000, roofH: 0.0000, ridge: 0.0060,
    title: 'オレンジ', sub: '果実42% / 朝のビタミン', accent: '#e0871f', bg: '#fdf3df',
    band: { name: 'オレンジ', sub: 'ORANGE 42%', ml: '400ml', a: '#e0871f', b: '#fdf0d8' },
    cap: null, capRing: null, defect: 'corner', corner: [-1, -1], print2: 'side', date: '09.14',
  },
  soy: {
    top: 'gable', bodyH: 0.1630, roofH: 0.0360, ridge: 0.0038,
    title: '調整豆乳', sub: '無糖 / 大豆まるごと', accent: '#4d8a48', bg: '#f4f6ea',
    band: { name: '豆乳', sub: 'SOY MILK', ml: '500ml', a: '#4d8a48', b: '#eef5e4' },
    cap: '#f2f4ea', capRing: '#4d8a48', defect: 'faded', corner: [1, -1], print2: 'back', date: '11.06',
  },
  lactic: {
    top: 'round', bodyH: 0.1500, roofH: 0.0404, ridge: 0.0100,
    title: '乳酸菌', sub: '飲むヨーグルト', accent: '#d9738f', bg: '#fdf1f4',
    band: { name: '乳酸菌', sub: 'LACTIC ACID', ml: '400ml', a: '#c8607f', b: '#fbeef1' },
    cap: '#f6eef0', capRing: '#c8607f', defect: 'corner', corner: [1, 1], print2: 'side', date: '09.30',
  },
};

/* ------------------------------------------------------------- ユーティリティ */
function displace(geo, fn) {
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const d = fn(v);
    if (!d) continue;
    pos.setXYZ(i, v.x + (d.x || 0), v.y + (d.y || 0), v.z + (d.z || 0));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
/** 断面（shape.x = Z／shape.y = 高さ） */
function profilePoints(sp) {
  const h = D / 2, b = sp.bodyH, r = sp.roofH, rg = sp.ridge;
  if (sp.top === 'gable') {
    return [[-h, 0], [h, 0], [h, b], [rg * 1.5, b + r - rg * 0.85], [rg * 0.5, b + r - rg * 0.10],
      [0, b + r], [-rg * 0.5, b + r - rg * 0.10], [-rg * 1.5, b + r - rg * 0.85], [-h, b]];
  }
  if (sp.top === 'round') {
    const pts = [[-h, 0], [h, 0], [h, b]];
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      pts.push([h * (1 - 0.74 * Math.pow(t, 0.72)), b + r * Math.pow(t, 0.58)]);
    }
    pts.push([-h * (1 - 0.74), b + r]);
    for (let i = 5; i >= 1; i--) {
      const t = i / 5;
      pts.push([-h * (1 - 0.74 * Math.pow(t, 0.72)), b + r * Math.pow(t, 0.58)]);
    }
    return pts;
  }
  return [[-h, 0], [h, 0], [h, b - 0.005], [h - 0.005, b], [-h + 0.005, b], [-h, b - 0.005]];
}
/** 断面押出の本体（押し出し方向 = ワールド X）
 *  ※ ExtrudeGeometry は bevel 分だけ断面外側・押し出し両端へ膨らむため、
 *     先に断面を BT 分 inset して寸法を meta.real に一致させる。 */
function bodyGeo(sp) {
  const pts = profilePoints(sp).map(([x, y]) => [x * (1 - BT / (D / 2)), y + BT]);
  const s = shape((k) => { k.setFromPoints(pts.map(([x, y]) => new Vector2(x, y))); k.closePath(); });
  const geo = new ExtrudeGeometry(s, {
    depth: W - 2 * BT, bevelEnabled: true, bevelSize: BT, bevelThickness: BT, bevelSegments: 2, curveSegments: 2,
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(W / 2 - BT, 0, 0);
  geo.computeVertexNormals();
  return geo;
}
/** 角の潰れ */
function crushCorner(geo, sx, sz, amt, yTop) {
  const x0 = sx * W / 2, z0 = sz * D / 2;
  const dirX = -sx, dirZ = -sz;
  const L = Math.hypot(dirX, dirZ);
  return displace(geo, (v) => {
    const yLow = yTop - 0.082;
    if (v.y < yLow) return null;
    const d = Math.hypot(v.x - x0, v.z - z0);
    const rad = 0.040;
    if (d > rad) return null;
    const w = Math.pow(1 - d / rad, 1.7) * Math.min(1, (v.y - yLow) / 0.058);
    return { x: (dirX / L) * amt * w, z: (dirZ / L) * amt * w, y: -amt * 0.5 * w };
  });
}
/** 側面に走る折筋（へこみ） */
function crease(geo, sx, amt) {
  const x0 = sx * 0.019;
  return displace(geo, (v) => {
    const d = Math.abs(v.x - x0);
    if (d > 0.011 || v.y < 0.030) return null;
    const w = Math.pow(1 - d / 0.011, 2) * Math.min(1, (v.y - 0.030) / 0.055);
    const sgn = v.z > 0 ? 1 : -1;
    return { z: -sgn * amt * w * 0.55, y: -amt * 0.22 * w };
  });
}
/** 做旧デカール（寸法を厳密指定＝面からはみ出さない） */
function wearOn(parent, { kind, color, seed, density = 1.4, w, h, pos, rotY = 0, opacity = 0.45, order = 0 }) {
  return decal(parent, {
    map: TEX.wear({ kind, color, seed, density }),
    w, h, pos, rot: [0, rotY, 0], opacity, order,
  });
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'milk1000');
  const sp = SPEC[key] || SPEC.milk1000;
  const sc = options.scale ?? 1;
  const totalH = sp.top === 'flat' ? sp.bodyH : sp.bodyH + sp.roofH;

  const g = grp('milk-carton');

  /* ---- マテリアル ---- */
  const paperMat = MAT.paper({ color: sp.bg, repeat: 3, uv: { repeat: [4, 4] }, tint: '#fffaf0' });
  const paperInner = MAT.paper({ color: '#e9e3d3', repeat: 4 });
  const foil = MAT.metal('#d9dde0', { repeat: 6, spec: 0.8, specPower: 170 });

  /* ---- 本体 ---- */
  let geo = bodyGeo(sp);
  if (sp.defect === 'corner') geo = crushCorner(geo, sp.corner[0], sp.corner[1], range(rnd, 0.0075, 0.0115), totalH);
  if (sp.defect === 'crease') geo = crease(geo, -1, 0.0068);
  if (sp.defect === 'faded') geo = crushCorner(geo, sp.corner[0], sp.corner[1], 0.0042, totalH);
  g.add(mesh(geo, paperMat, { name: 'carton-body' }));

  /* ---- 稜線シーラーフィン・折り込みフラップ ---- */
  const seal = grp('sealer');
  g.add(seal);
  if (sp.top === 'gable') {
    const finY = totalH + 0.0024;
    seal.add(mesh(box(W - 0.007, 0.0050, 0.0062), paperInner, { name: 'ridge-fin', pos: [0, finY, 0] }));
    seal.add(mesh(box(W - 0.011, 0.0014, 0.0028), MAT.paper({ color: '#d5cfbe', repeat: 7 }), { name: 'ridge-crease', pos: [0, finY + 0.0027, 0], cast: false }));
    for (const sx of [-1, 1]) {                                      // 両端の折り込みフラップ
      seal.add(mesh(box(0.0120, 0.0034, 0.0158), paperInner, { name: 'flap-' + sx, pos: [sx * (W / 2 - 0.0068), finY + 0.0006, 0], rot: [0, 0, sx * 0.10] }));
    }
    for (let i = 0; i < 9; i++) {                                  // 波型シーラーの刻み
      const x = -W / 2 + 0.0065 + (i / 8) * (W - 0.013);
      seal.add(mesh(box(0.0016, 0.0052, 0.0066), MAT.paper({ color: '#cdc6b3', repeat: 8 }), { pos: [x, finY, 0], cast: false, receive: false }));
    }
  } else if (sp.top === 'flat') {
    const topY = sp.bodyH;
    seal.add(mesh(box(W - 0.006, 0.0038, D - 0.012), foil, { name: 'foil-lid', pos: [0, topY - 0.0016, 0] }));
    for (let i = 0; i < 7; i++) {                                   // シーラーの圧着筋
      seal.add(mesh(box(W - 0.012, 0.0011, 0.0015), MAT.metal('#b7bcbe', { spec: 0.7 }), { pos: [0, topY + 0.0006, -D / 2 + 0.011 + i * 0.0062], cast: false }));
    }
    seal.add(mesh(tor(0.0030, 0.0006, 5, 14), MAT.paper({ color: '#cdc6b3', repeat: 6 }), { name: 'straw-ring', pos: [0.009, topY + 0.0014, 0.004], rot: [-Math.PI / 2, 0, 0], cast: false }));
    seal.add(mesh(circ(0.0027, 12), MAT.paint('#3a3630', { steps: 2, shadowAmt: 1 }), { name: 'straw-hole', pos: [0.009, topY + 0.0010, 0.004], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false }));
  } else {
    const topY = totalH;
    seal.add(mesh(cyl(0.0100, 0.0106, 0.0030, 18), paperInner, { name: 'mouth-collar', pos: [0, topY - 0.0004, 0] }));
    seal.add(mesh(circ(0.0088, 16), foil, { name: 'foil-seal', pos: [0, topY + 0.0012, 0], rot: [-Math.PI / 2, 0, 0] }));
  }

  /* ---- キャップ ---- */
  if (sp.cap) {
    const capG = grp('cap');
    g.add(capG);
    const slope = sp.top === 'round' ? 0 : Math.atan2(D / 2, sp.roofH);
    const t = sp.top === 'round' ? 1 : 0.52;
    const px = sp.top === 'round' ? 0 : 0.006;
    const py = sp.top === 'round' ? totalH + 0.0016 : sp.bodyH + sp.roofH * t + 0.0014;
    const pz = sp.top === 'round' ? 0 : (D / 2) * (1 - t);
    const cg = grp('cap-asm', { pos: [px, py, pz], rot: [slope, 0, 0] });
    capG.add(cg);
    const capMat = MAT.plastic(sp.cap, { spec: 0.38, specPower: 46, sat: 1.0 });
    const ringMat = MAT.plastic(sp.capRing, { spec: 0.34 });
    cg.add(mesh(cyl(0.0112, 0.0124, 0.0040, 18), ringMat, { name: 'collar', pos: [0, 0.0012, 0] }));
    cg.add(mesh(cyl(0.0106, 0.0108, 0.0082, 18), capMat, { name: 'cap-body', pos: [0, 0.0068, 0] }));
    cg.add(mesh(cyl(0.0088, 0.0098, 0.0016, 18), capMat, { name: 'cap-top', pos: [0, 0.0114, 0] }));
    cg.add(mesh(tor(0.0104, 0.0008, 5, 18), capMat, { name: 'cap-seam', pos: [0, 0.0092, 0], rot: [-Math.PI / 2, 0, 0], cast: false }));
    for (let i = 0; i < 14; i++) {                                  // ローマレット
      const a = (i / 14) * Math.PI * 2;
      cg.add(mesh(box(0.0011, 0.0068, 0.0016), capMat, { pos: [Math.sin(a) * 0.0106, 0.0068, Math.cos(a) * 0.0106], rot: [0, a, 0], cast: false, receive: false }));
    }
    if (rnd() > 0.4) cg.add(mesh(tor(0.0119, 0.0007, 5, 18), ringMat, { name: 'tamper-band', pos: [0, 0.0024, 0], rot: [-Math.PI / 2, 0, 0], cast: false }));
  }

  /* ---- 印刷面 ---- */
  const zf = D / 2 + 0.0002, xf = W / 2 + 0.0002;
  const poster = TEX.poster({ title: sp.title, sub: sp.sub, bg: sp.bg, accent: sp.accent, seed: (seed % 97) + 1 });
  const bandTex = TEX.drinkLabel({ name: sp.band.name, sub: sp.band.sub, ml: sp.band.ml, a: sp.band.a, b: sp.band.b, kind: 'carton' });
  const backTex = sp.print2 === 'back' ? poster : bandTex;
  const sideTex = sp.print2 === 'side' ? poster : TEX.adStrip({ text: sp.title, bg: sp.bg, seed: seed + 5 });

  // 前面
  decal(g, { map: poster, w: 0.0620, h: 0.0930, pos: [-2e-3, sp.bodyH * 0.575, zf] });
  decal(g, { map: bandTex, w: 0.0580, h: 0.0290, pos: [0.0000, sp.bodyH * 0.165, zf], order: 1 });
  // 背面
  decal(g, { map: backTex, w: 0.0560, h: (sp.print2 === 'back' ? 0.0840 : 0.0280), pos: [0.0040, sp.bodyH * (sp.print2 === 'back' ? 0.565 : 0.40), -zf], rot: [0, Math.PI, 0], order: 1 });
  decal(g, { map: TEX.adStrip({ text: '要冷蔵 10℃以下', bg: '#e9e4d6', seed: seed + 3 }), w: 0.0520, h: 0.0260, pos: [0, sp.bodyH * 0.115, -zf], rot: [0, Math.PI, 0], order: 2 });
  // 側面
  for (const sx of [-1, 1]) {
    decal(g, { map: bandTex, w: 0.0380, h: 0.0190, pos: [sx * xf, sp.bodyH * 0.63, 0.002], rot: [0, sx * Math.PI / 2, 0], order: 1 });
    decal(g, { map: sideTex, w: 0.0320, h: 0.0480, pos: [sx * xf, sp.bodyH * 0.275, -1e-3], rot: [0, sx * Math.PI / 2, 0], order: 2 });
  }
  // 賞味期限印字
  decal(g, { map: TEX.lightPanel({ text: sp.date, bg: '#efe9db', fg: '#3b3a36', mode: 'sign' }), w: 0.0260, h: 0.0130, pos: [-0.014, 0.0150, zf], order: 3 });

  /* ---- 底部（折り込みシール） ---- */
  g.add(mesh(box(W - 0.011, 0.0026, D - 0.011), paperInner, { name: 'bottom-seal', pos: [0, 0.0014, 0] }));
  g.add(mesh(box(W - 0.021, 0.0011, D - 0.023), MAT.paper({ color: '#cec7b4', repeat: 6 }), { name: 'bottom-crease', pos: [0, 0.0028, 0], cast: false }));

  /* ---- 経年・欠陥（すべて面の内側に収まる寸法で打つ） ---- */
  wearOn(g, { kind: 'dirt', color: '#b3a98f', seed: seed + 21, density: 1.6, w: 0.048, h: 0.020, pos: [0.002, 0.0155, zf + 0.0001], opacity: 0.48 });      // 底の水跡・ふやけ
  wearOn(g, { kind: 'chip', color: '#f2ece0', seed: seed + 22, density: 1.3, w: 0.020, h: 0.034, pos: [sp.corner[0] * (W / 2 - 0.014), sp.bodyH * 0.70, zf + 0.0002], opacity: 0.55 });   // 印刷剥がれ
  wearOn(g, { kind: 'scratch', color: '#cfc7b6', seed: seed + 23, density: 1.6, w: 0.026, h: 0.030, pos: [(-sp.corner[0]) * (W / 2 - 0.016), sp.bodyH * range(rnd, 0.34, 0.58), -zf - 0.0001], rotY: Math.PI, opacity: 0.40 });   // 棚擦れ
  if (sp.defect === 'faded') {
    wearOn(g, { kind: 'dirt', color: '#fff4e0', seed: seed + 24, density: 1.1, w: 0.046, h: 0.034, pos: [0.006, sp.bodyH * 0.90, zf + 0.0003], opacity: 0.5 });   // 窓光で退色
  } else {
    wearOn(g, { kind: 'dirt', color: '#e6d7b2', seed: seed + 24, density: 1.0, w: 0.034, h: 0.030, pos: [-0.012, sp.bodyH * 0.88, zf + 0.0003], opacity: 0.30 });  // 蛍光灯黄変
  }
  if (sp.top !== 'flat') {
    wearOn(g, { kind: 'dirt', color: '#a9a08a', seed: seed + 25, density: 1.2, w: 0.030, h: 0.014, pos: [0.004, sp.bodyH * 0.30, -zf - 0.0002], rotY: Math.PI, opacity: 0.35 }); // 底溜まりの污
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
  const s = bb.getSize(new Vector3());
  g.scale.set(size[0] / s.x, size[1] / s.y, size[2] / s.z);
  g.updateMatrixWorld(true);
  bb = contentBounds(g);
  const c = bb.getCenter(new Vector3());
  g.position.set(-c.x, -bb.min.y, -c.z);
  return g;
}

const P_MILK = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_MILK as P, build as b };
