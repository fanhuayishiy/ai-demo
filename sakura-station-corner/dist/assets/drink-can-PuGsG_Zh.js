import { g as grp, M as MAT, o as lathe, m as mesh, T as TEX, D as DoubleSide, n as range, t as tor, U as circ, c as cyl, a as sph, V as Vector3, w as weather, J as shape, ab as Path, R as ExtrudeGeometry, z as rand, ac as Box3 } from './index-CB0Lacpv.js';

//  assets/products/drink-can.js —— アルミ飲料缶（350ml・7 variant）
//  構成：ボディ車削（ビード環・ネック絞り）・底ドーム／天面コンソール＋カールシーム／
//        スコア線・リベット・プルタブ（開封済み状態を選べる）・側面印刷・結露・へこみ。

const meta = {
  id: 'drink-can',
  real: [0.065, 0.122, 0.065],
  origin: 'ground-center',
  variants: ['coffee', 'cola', 'beer', 'tea', 'juice', 'energy', 'chazuke'],
};
const VARIANTS = meta.variants;

const lerp = (a, b, t) => a + (b - a) * t;

const SPEC = {
  coffee: { name: '微糖珈琲', sub: 'CAFE LATTE', a: '#6b4a2c', b: '#efe0c8', ink: ['#c8a274', '#4a3121'], frost: 0.35, flute: 0, defect: 'scuff', open: false, mat: 0.55 },
  cola: { name: '炭酸', sub: 'COLA', a: '#bb231b', b: '#f6e2d6', ink: ['#e03a2c', '#f7f3ea'], frost: 0.75, flute: 0, defect: 'dent', open: true, mat: 0.35 },
  beer: { name: '発泡酒', sub: 'DRAFT STYLE', a: '#1f6fa8', b: '#e8f2f6', ink: ['#d9b45a', '#1b4f78'], frost: 1.0, flute: 0, defect: 'watermark', open: false, mat: 0.2 },
  tea: { name: '緑茶', sub: 'GYOKURO', a: '#2e7d4f', b: '#e9f2df', ink: ['#3f8f56', '#eef5e2'], frost: 0.5, flute: 0, defect: 'faded', open: false, mat: 0.4 },
  juice: { name: 'もも', sub: 'FRUIT 12%', a: '#e08a86', b: '#fdf0e2', ink: ['#ef9c72', '#5e7f4a'], frost: 0.45, flute: 0, defect: 'dent', open: false, mat: 0.3 },
  energy: { name: 'エナジー', sub: 'VITAMIN RC', a: '#2a2b33', b: '#e7c65a', ink: ['#1b1c22', '#e8c25a'], frost: 0.2, flute: 1, defect: 'scratch', open: false, mat: 0.25 },
  chazuke: { name: '烏龍茶', sub: 'OOLONG ICE', a: '#7a4f2a', b: '#f0e6d2', ink: ['#8b5c32', '#eef1e0'], frost: 0.65, flute: 0, defect: 'faded', open: true, mat: 0.45 },
};

/* ------------------------------------------------------------- ユーティリティ */
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
    if (d.s != null) { x *= d.s; z *= d.s; }
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
/** ボディ縦断面：底ドーム → ヒール → 直胴（ビード 3 本）→ ネック → カール → コンソール */
function bodyProfile(sp, rnd) {
  const R = 0.0320;
  const p = [];
  p.push([0, 0.0068], [0.0130, 0.0054], [0.0240, 0.0022], [0.0286, 0.0004], [0.0292, 0.0000],
    [0.0308, 0.0018], [0.0318, 0.0046], [R, 0.0078]);
  // 直胴 + ビード（環沟）
  const beads = [0.0300, 0.0620, 0.0940];
  for (const by of beads) {
    p.push([R, by - 0.0052], [R - 0.0004, by - 0.0026], [R - 0.0014, by], [R - 0.0004, by + 0.0026], [R, by + 0.0052]);
  }
  p.push([R, 0.1064], [R - 0.0006, 0.1092]);
  // ネック絞り
  const n = 6;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    p.push([lerp(R - 0.0006, 0.0256, Math.pow(t, 1.35)), lerp(0.1092, 0.1186, t)]);
  }
  // カールシーム（上端）→ コンソール（浅い椀）
  p.push([0.0254, 0.1208], [0.0246, 0.1220], [0.0236, 0.1214], [0.0230, 0.1194],
    [0.0206, 0.1176], [0.0150, 0.1166], [0.0080, 0.1161], [0, 0.1159]);
  return p;
}
/** 円筒外周に添わせる做旧平面（四隅がシルエットからはみ出さないよう自動で引っ込める） */
function band(parent, { R, y, ang, w, h, kind = 'chip', color = '#cfd3d6', opacity = 0.5, seed = 1, density = 1.5, count = 1, tilt = 0 }) {
  const inset = Math.min(0.009, (0.27 * w * w) / R + (h / 2) * Math.abs(Math.sin(tilt)) + 0.0018);
  const rr = R - inset;
  return weather(parent, {
    w, h, pos: [Math.sin(ang) * rr, y, Math.cos(ang) * rr], rot: [tilt, ang, 0],
    kind, color, opacity, seed, density, count, spread: 0.0012,
  });
}
/** プルタブ（ドッグボーン形 + 指あき + リベット受け） */
function tabGeo() {
  const s = shape((k) => {
    k.moveTo(-52e-4, -3e-3);
    k.lineTo(0.0072, -41e-4);
    k.quadraticCurveTo(0.0116, -41e-4, 0.0116, -2e-4);
    k.quadraticCurveTo(0.0116, 0.0039, 0.0072, 0.0042);
    k.lineTo(-52e-4, 0.0034);
    k.quadraticCurveTo(-92e-4, 0.0034, -92e-4, 0.0004);
    k.quadraticCurveTo(-92e-4, -3e-3, -52e-4, -3e-3);
  });
  const hole = new Path();
  hole.absellipse(0.0038, 0.0002, 0.0044, 0.0022, 0, Math.PI * 2, false);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: 0.0007, bevelEnabled: true, bevelSize: 0.00025, bevelThickness: 0.00025, bevelSegments: 1, curveSegments: 10 });
  g.rotateX(Math.PI / 2);           // 平板を水平に（+Y 厚みは下向き）
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------- build */
function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'cola');
  const sp = SPEC[key] || SPEC.cola;
  const sc = options.scale ?? 1;
  const opened = options.open ?? sp.open;

  const g = grp('drink-can');

  /* ---- マテリアル ---- */
  const alu = MAT.canBody({ color: '#d8dcdf', repeat: 3, uv: { repeat: [3, 1] } });
  const aluTop = MAT.canBody({ color: '#cfd4d8', repeat: 4, spec: 0.86, specPower: 190 });
  const frosty = MAT.glassLite({ color: '#eaf6ff', opacity: 0.34, spec: 1, specPower: 240, steps: 2 });

  /* ---- ボディ ---- */
  const prof = bodyProfile();
  let bodyGeo = lathe(prof, 26);
  if (sp.flute) bodyGeo = displace(bodyGeo, (v) => (v.y > 0.0090 && v.y < 0.1080 ? { r: 0.0007 * Math.sin(14 * Math.atan2(v.x, v.z)) } : null));
  if (sp.defect === 'dent') bodyGeo = displace(bodyGeo, (v) => {
    const a = -0.7, along = v.x * Math.sin(a) + v.z * Math.cos(a);
    if (along <= 0) return null;
    const gg = Math.exp(-((v.y - 0.052) ** 2) / 0.0016) * Math.exp(-((along - 0.026) ** 2) / 0.0012);
    return gg < 0.02 ? null : { r: -46e-4 * gg };
  });
  if (sp.defect === 'crush') bodyGeo = displace(bodyGeo, (v) => ({ r: -3e-3 * Math.exp(-((v.y - 0.04) ** 2) / 0.002) * Math.max(0, Math.cos(Math.atan2(v.x, v.z))) }));
  g.add(mesh(bodyGeo, alu, { name: 'can-body' }));

  /* ---- 側面印刷（ボディ轮廓追従の帯） ---- */
  const band0 = 0.0108, band1 = 0.1040;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const y = lerp(band0, band1, i / 16);
    pts.push([rAt(prof, y) + (sp.flute ? 0.0006 : 0) + 0.00035, y]);
  }
  const labGeo = lathe(pts, 26);
  const labTex = TEX.drinkLabel({ name: sp.name, sub: sp.sub, ml: '350ml', a: sp.a, b: sp.b, kind: 'can' });
  const labMat = MAT.poster({
    map: labTex, side: DoubleSide, uv: { offset: [0.5, 0] },
    steps: 4, spec: 0.6 - sp.mat, specPower: 130, specCut: 0.14, sheen: 0.14,
    shadowAmt: 0.6, sat: sp.defect === 'faded' ? 0.72 : 1.05,
    tint: sp.defect === 'faded' ? '#fff0e0' : '#ffffff',
  });
  g.add(mesh(labGeo, labMat, { name: 'print-band', renderOrder: 2 }));
  // 印刷縁の欠け（アルミ地金が見える）
  const chipY = range(rnd, 0.030, 0.090);
  band(g, { R: rAt(prof, chipY) + 0.0005, y: chipY, ang: -0.79, w: 0.020, h: 0.013, kind: 'chip', color: '#cfd3d6', opacity: 0.55, seed: seed + 5, density: 1.5 });

  /* ---- 天面：スコア線・飲み口・リベット・タブ ---- */
  const topG = grp('top');
  g.add(topG);
  const scoreC = 0.0058;                       // 飲み口中心（+Z 側＝客の方を向く）
  const scoreR = 0.0158, scoreD = 0.0098;      // 長軸 X / 短軸 Z の楕円
  // スコア線（開封時の切り込み）
  const score = mesh(tor(1, 0.00038, 5, 30), MAT.metal('#9ba0a4', { spec: 0.72, repeat: 5 }), { name: 'score', pos: [0, 0.11630, scoreC], cast: false });
  score.rotation.x = Math.PI / 2;
  score.scale.set(scoreR, scoreD, 1);
  topG.add(score);
  if (opened) {
    // 開口部の暗がり（内側に沈んだ底）
    const dark = mesh(circ(1, 22), MAT.paint('#241d18', { steps: 2, shadowAmt: 1, side: DoubleSide }), {
      name: 'opening-shadow', pos: [0, 0.1128, scoreC], cast: false, receive: false,
    });
    dark.rotation.x = -Math.PI / 2;
    dark.scale.set(scoreR * 0.9, scoreD * 0.9, 1);
    topG.add(dark);
    // めくれたフラップ（ヒンジ +Z 側の-scoreD で回内へ沈む）
    const hinge = grp('flap-hinge', { pos: [0, 0.11605, scoreC - scoreD] });
    hinge.rotation.x = 0.46;
    const flap = mesh(circ(1, 22), aluTop, { name: 'opened-flap', cast: false });
    flap.rotation.x = -Math.PI / 2;
    flap.scale.set(scoreR * 0.94, scoreD * 0.94, 1);
    flap.position.set(0, 0.0002, scoreD * 0.94);
    hinge.add(flap);
    topG.add(hinge);
    // 飲み口際の内側リム
    const lip = mesh(tor(scoreR * 0.92, 0.0006, 5, 24), MAT.metal('#aeb3b6', { spec: 0.8 }), { name: 'lip', pos: [0, 0.1152, scoreC], cast: false });
    lip.rotation.x = Math.PI / 2;
    lip.scale.set(1, scoreD / scoreR, 1);
    topG.add(lip);
  } else {
    // 未開封：フラップはコンソールと面一、リベット受けの盛り上げのみ
    const face = mesh(circ(1, 22), MAT.canBody({ color: '#d6dbde', repeat: 5 }), { name: 'flap-face', pos: [0, 0.11650, scoreC], cast: false });
    face.rotation.x = -Math.PI / 2;
    face.scale.set(scoreR * 0.96, scoreD * 0.96, 1);
    topG.add(face);
  }
  // リベット
  topG.add(mesh(cyl(0.0022, 0.0027, 0.0018, 12), aluTop, { name: 'rivet', pos: [0, 0.1170, -58e-4] }));
  topG.add(mesh(tor(0.0025, 0.0005, 5, 14), MAT.metal('#bcc1c4', { spec: 0.82 }), { name: 'rivet-ring', pos: [0, 0.1166, -58e-4], rot: [-Math.PI / 2, 0, 0] }));
  // プルタブ（リベットで回動）
  const tabMat = MAT.canBody({ color: '#e3e7ea', repeat: 6, spec: 0.92, specPower: 210 });
  const tabPivot = grp('tab-pivot', { pos: [0, 0.1179, -58e-4] });
  tabPivot.add(mesh(tabGeo(), tabMat, { name: 'pull-tab', cast: false }));
  if (opened) {
    tabPivot.rotation.x = -0.34;
    tabPivot.rotation.z = 0.07;
  }
  g.add(tabPivot);

  /* ---- 底のドーム外面（接地面の環）＋棚跡 ---- */
  g.add(mesh(tor(0.0292, 0.0009, 5, 24), MAT.metal('#c2c7ca', { spec: 0.75 }), { name: 'foot-chime', pos: [0, 0.0006, 0], rot: [-Math.PI / 2, 0, 0] }));
  band(g, { R: 0.0298, y: 0.0075, ang: Math.PI, w: 0.018, h: 0.009, kind: 'scratch', color: '#f2f2f2', opacity: 0.30, seed: seed + 9, density: 1.8 });

  /* ---- 結露・霜 ---- */
  if (sp.frost > 0.25) {
    // 高光沢の水滴（実球。面際に沈めて輪郭の膨らみを抑える）
    const drops = Math.round(6 + sp.frost * 8);
    const dropGeo = sph(0.0013, 7, 5);
    const dropMat = MAT.water({ opacity: 0.75 });
    for (let i = 0; i < drops; i++) {
      const a = range(rnd, -Math.PI, Math.PI);
      const y = range(rnd, 0.016, 0.104);
      const r = rAt(prof, y) - 0.0004;
      const dm = mesh(dropGeo, dropMat, { pos: [Math.sin(a) * r, y, Math.cos(a) * r], cast: false, receive: false });
      dm.scale.set(0.75 + rnd() * 0.5, 1.3 + rnd() * 1.0, 0.75 + rnd() * 0.5);
      g.add(dm);
    }
    // 流れた痕
    band(g, { R: 0.0324, y: 0.062, ang: Math.PI / 2, w: 0.020, h: 0.048, kind: 'dirt', color: '#ffffff', opacity: 0.18 * sp.frost + 0.08, seed: seed + 11, density: 1.5, count: 2 });
    band(g, { R: 0.0324, y: 0.048, ang: -Math.PI / 2, w: 0.020, h: 0.040, kind: 'dirt', color: '#e9f6ff', opacity: 0.16 * sp.frost + 0.06, seed: seed + 12, density: 1.2 });
  }
  if (sp.defect === 'watermark') {
    // 凍らせた後の水跡・ラベル退色
    band(g, { R: 0.0324, y: 0.0845, ang: 0.72, w: 0.022, h: 0.028, kind: 'dirt', color: '#dfe9ec', opacity: 0.42, seed: seed + 13, density: 1.6 });
  }
  if (sp.defect === 'scratch') {
    band(g, { R: 0.0324, y: 0.058, ang: -0.5, w: 0.022, h: 0.056, kind: 'scratch', color: '#f6f6f6', opacity: 0.34, seed: seed + 14, density: 2.2, count: 2 });
  }
  if (sp.defect === 'scuff') {
    // 棚との擦れで印刷が削れた帯
    band(g, { R: 0.0324, y: 0.0285, ang: 0.40, w: 0.020, h: 0.012, kind: 'chip', color: '#dfe3e5', opacity: 0.5, seed: seed + 15, density: 1.8 });
  }
  if (opened) {
    // 開封時の泡残り（飲み口际）
    const foam = mesh(circ(1, 16), MAT.paint('#f6efe2', { transparent: true, opacity: 0.5, depthWrite: false, steps: 2, spec: 0.6 }), {
      name: 'foam', pos: [0, 0.1146, scoreC - 0.0022], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false,
    });
    foam.scale.set(scoreR * 0.68, scoreD * 0.68, 1);
    g.add(foam);
  }
  // 天面のテカり（フチの高光沢リング）
  g.add(mesh(tor(0.0246, 0.0006, 5, 26), frosty, { name: 'gloss-ring', pos: [0, 0.1217, 0], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false }));

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

const P_CAN = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANTS,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_CAN as P, build as b };
