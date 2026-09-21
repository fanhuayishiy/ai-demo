import { g as grp, M as MAT, P as PAL, T as TEX, J as shape, K as extrude, u as Matrix4, m as mesh, n as range, r as rbox, b as box, D as DoubleSide, c as cyl, t as tor, w as weather, W as pipe, U as circ, X as cone, l as catenary, a as sph, h as decal, q as finish, Y as memo, H as plane, B as BufferGeometry, F as Float32BufferAttribute, z as rand, E as inst, V as Vector3, N as makeCanvas, Q as toTexture } from './index-Dj2iGATz.js';

//  assets/flora/grass-slope.js —— 軌道北側の法面＋田んぼ背景 strip＋里山シルエット（A 区まるごと）
//  ・草のり面（盛土プリズム＋芝スキン＋草叶 inst）／法止めブロック／防護柵（金网・錆・褪色）
//  ・排水落口（伏越・鉄格子・水跡）／奥に水田（水面 MAT.water・畦・杭と糸・苗・枯れ梗）
//  ・最奥に杉・竹のシルエット（3 層の濃淡で空気遠近）
//  単位メートル / 原点＝接地面中心（法先 y=0）/ +Z = 南（線路側）/ -Z = 北（里山側）
//  ※ 乱数はすべて rand(seed) 経由で事前生成 → 同一 options で完全一致（Math.random 不使用）

const meta = {
  id: 'grass-slope',
  real: [36, 6.4, 5.9],         // len ×（法面＋杉天高）× 奥行き
  origin: 'ground-center',
};

const V = (x, y, z) => new Vector3(x, y, z);
const rq = (v) => Math.max(0.004, Math.round(v * 500) / 500);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------------- ローカル程序テクスチャ（core は触らない） ---------------- */
/** 金网の菱形マスク：黒背景＋白線（alphaMap は .g 参照なので不透明画像で作る） */
function netMask(step = 9, wire = 6) {
  return memo(`flora|net|${step}|${wire}`, () => {
    const cv = makeCanvas(256);
    if (!cv) return toTexture(null);
    const { g, w, h, rnd } = cv;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = wire; g.lineCap = 'square';
    const s = w / step;
    for (let k = -step; k < step * 3; k++) {
      g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s + h, h); g.stroke();
      g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s - h, h); g.stroke();
    }
    g.globalCompositeOperation = 'destination-out';        // 破れ・欠け
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(rnd() * w, rnd() * h, s * (0.3 + rnd() * 0.35), 0, 7); g.fill();
    }
    return toTexture(cv, { repeat: 1, srgb: false });
  });
}
/** 水田の泥・藻の斑 */
function mudMap(base = '#5d5040') {
  return memo(`flora|mud|${base}`, () => {
    const cv = makeCanvas(256);
    if (!cv) return toTexture(null);
    const { g, w, h, rnd } = cv;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.globalAlpha = 0.05 + rnd() * 0.2;
      g.fillStyle = rnd() > 0.5 ? '#39312a' : '#8c7f66';
      g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 32, 1 + rnd() * 5, rnd() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 0.22; g.strokeStyle = '#6f7d55';
    for (let i = 0; i < 46; i++) { g.lineWidth = 1 + rnd() * 2; g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
    return toTexture(cv, { repeat: 1.2 });
  });
}

/** 地形パッチ（y = yFn(x,z) のグリッド面、uv はメートル単位） */
function patch(x0, x1, z0, z1, nx, nz, yFn) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + (i / nx) * (x1 - x0), z = z0 + (j / nz) * (z1 - z0);
    pos.push(x, yFn(x, z), z); uv.push(x, z);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
/** 草叶・落葉カード（先端湾曲・根元 pivot） */
function bladeGeo(w, h, bend = 0.34, seg = 3) {
  const g = plane(w, h, 1, seg).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = cl((p.getY(i) + h / 2) / h, 0, 1);
    p.setX(i, p.getX(i) * (1 - 0.55 * Math.pow(t, 2)));
    p.setZ(i, Math.pow(t, 1.9) * h * bend);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}

function build(options = {}) {
  const len = options.len ?? 36;
  const H = options.height ?? 1.6;
  const seed = (options.seed ?? 61) | 0;
  const rnd = rand(seed);

  const g = grp('grass-slope');
  /* 奥行き raw z ∈ [-4.72, 1.25] → 接地面中心に寄せる */
  const Z0 = 1.72;
  const body = grp('slope-body', { pos: [0, 0, Z0] });
  g.add(body);

  /* ---------------- 地盤プロファイル（raw z → y） ---------------- */
  const Z_FRONT = 1.25, Z_TOE = 1.00, Z_FACE_TOP = -1.35, Z_BERM_END = -1.85;
  const Z_PADDY_TOP = -2.1, Z_PADDY_END = -3.62, Z_BANK_TOP = -3.98, Z_FAR = -4.72;
  const H_PADDY = H - 0.30, H_BANK = H - 0.10;
  const faceY = (z) => {                                     // 1:1.5 基調、上部だけ起きる緩円弧
    const t = cl((Z_TOE - z) / (Z_TOE - Z_FACE_TOP), 0, 1);
    return H * (1 - Math.pow(1 - t, 1.42)) * 1.06 - H * 0.06 * t;
  };
  const gh = (z) => {
    if (z > Z_TOE) return 0;
    if (z > Z_FACE_TOP) return faceY(z);
    if (z > Z_BERM_END) return H;
    if (z > Z_PADDY_TOP) return H + (H_PADDY - H) * cl((Z_BERM_END - z) / (Z_BERM_END - Z_PADDY_TOP), 0, 1);
    if (z > Z_PADDY_END) return H_PADDY;
    if (z > Z_BANK_TOP) return H_PADDY + (H_BANK - H_PADDY) * cl((Z_PADDY_END - z) / (Z_PADDY_END - Z_BANK_TOP), 0, 1);
    return H_BANK;
  };
  const bump = (x, z) => Math.sin(x * 0.7 + z * 1.9) * 0.035 + Math.sin(x * 1.9 - z * 0.8) * 0.02 + Math.sin(x * 0.31 + z * 4.1) * 0.012;
  const ground = (x, z) => (z > Z_PADDY_TOP && z < Z_PADDY_END) ? gh(z) + bump(x, z) * 0.2 : gh(z) + bump(x, z);
  const ph0 = rnd() * 6.283;

  /* ---------------- 素材 ---------------- */
  const matEarth = MAT.concrete({ base: '#8a7a62', repeat: 3, cracked: true, tint: '#cdc3ae' });
  const matGrass = MAT.grass({ base: PAL.grass, repeat: 2.2, tint: '#e6efd8' });
  const matGrassDark = MAT.grass({ base: PAL.grassDark, repeat: 2.8, tint: '#d7e3cf' });
  const matMud = MAT.paint('#ffffff', { map: mudMap(), spec: 0.1, shadowAmt: 0.95, steps: 4, sat: 0.92 });
  const matBlock = MAT.concrete({ base: PAL.concrete, repeat: 1.6, joints: 2 });
  const matBlockOld = MAT.concrete({ base: PAL.concreteDark, repeat: 1.6, joints: 2 });
  const matKerb = MAT.concrete({ base: '#c7c1b5', repeat: 1.6 });
  const matSteel = MAT.galvanized({ repeat: 2 });
  const matIron = MAT.darkIron({ spec: 0.32 });
  const matWood = MAT.wood({ light: PAL.wood, dark: PAL.woodDark, repeat: 1, uv: { repeat: [1, 3] } });
  const matPole = MAT.wood({ light: '#a89272', dark: '#6d5a43', repeat: 1, knots: true });
  const matString = MAT.paint('#ded8c8', { spec: 0.12, shadowAmt: 0.85, steps: 2 });
  const matWater = MAT.water({ opacity: 0.55, color: '#7d9fa6' });
  const matGrille = MAT.paint('#22201f', { spec: 0.05, shadowAmt: 1, steps: 2 });
  /** 草 5 階層（陰／中／表／春の若葉／前年の枯草） */
  const GRASS = [
    { base: '#4f6d3c', col: '#b3c4ad', emis: 0.02, amt: 1.0, geo: 2 },
    { base: PAL.grassDark, col: '#ddebd6', emis: 0.06, amt: 0.92, geo: 0 },
    { base: PAL.grass, col: '#f7f8e4', emis: 0.10, amt: 0.82, geo: 0 },
    { base: '#bcd684', col: '#fffce8', emis: 0.17, amt: 0.70, geo: 0 },
    { base: '#a89355', col: '#eee0c0', emis: 0.04, amt: 0.95, geo: 2 },
  ].map((t, i) => ({
    ...t,
    mat: MAT.leaf({
      color: t.col, map: TEX.leafCluster({ base: t.base, seed: seed + i * 17 }), alphaTest: 0.44,
      emissiveIntensity: t.emis, shadowAmt: t.amt, rim: 0.38 - i * 0.05, rimColor: '#eaffd6',
      wind: { amp: 0.012 + i * 0.002, freq: 1.5 + i * 0.22, base: -0.2, span: 0.9, px: 2.2, pz: 1.8 },
    }),
  }));
  const BLADES = [bladeGeo(0.05, 0.24, 0.42, 3), bladeGeo(0.055, 0.3, 0.5, 3), bladeGeo(0.035, 0.13, 0.3, 2)];
  const matFlowerY = MAT.food({ color: '#e8d85c', spec: 0.3, steps: 2 });
  const matFlowerP = MAT.food({ color: '#b48fc6', spec: 0.3, steps: 2 });

  /** 事前生成した配置配列 → inst（seed 依存の散らばり／描画は 1 draw） */
  const scatter = (n, gen) => { const a = []; for (let i = 0; i < n; i++) a.push(gen(i)); return a; };
  const place = (parent, arr, geo, mat, name, opts = {}) => {
    if (!arr.length) return null;
    parent.add(inst(geo, mat, arr.length, (i, d, r, col) => {
      const s = arr[i];
      d.position.set(s.x, s.y, s.z);
      d.rotation.set(s.rx, s.ry, s.rz);
      d.scale.set(s.s, s.s2 ?? s.s, s.s3 ?? 1);
      if (s.c) col.setRGB(s.c[0], s.c[1], s.c[2]);
    }, { name, ...opts }));
  };

  /* ---------------- 盛土プリズム（底・背面まで実体） ---------------- */
  {
    const pts = [[Z_FRONT, 0], [Z_TOE, 0]];
    for (let i = 1; i <= 14; i++) { const z = Z_TOE + (Z_FACE_TOP - Z_TOE) * (i / 14); pts.push([z, faceY(z)]); }
    pts.push([Z_BERM_END, H], [Z_PADDY_TOP, H_PADDY], [Z_PADDY_END, H_PADDY], [Z_BANK_TOP, H_BANK], [Z_FAR, H_BANK], [Z_FAR, -0.55], [Z_FRONT, -0.55]);
    const shp = shape((s) => { pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); });
    const geo = extrude(shp, { depth: len, bevelEnabled: false, curveSegments: 2, steps: 1 });
    const M = new Matrix4();
    M.set(0, 0, -1, len / 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);   // shapeX→worldZ・押出し→worldX（行列式 +1）
    geo.applyMatrix4(M);
    geo.computeVertexNormals();
    const emb = mesh(geo, matEarth, { name: 'embankment' });
    emb.userData.noOutline = true;                        // 大地塊は反壳描边不发（画面侧 edge に任せる）
    body.add(emb);
  }
  /* ---------------- 芝・泥のスキン（プリズムの上 6〜8mm） ---------------- */
  const skin = (z0, z1, nx, nz, yFn, mat, name) => {
    const m = mesh(patch(-len / 2, len / 2, z0, z1, nx, nz, yFn), mat, { name });
    m.userData.noOutline = true;
    body.add(m);
    return m;
  };
  skin(Z_FRONT, Z_TOE + 0.02, 30, 3, (x, z) => ground(x, z) + 0.007, matGrassDark, 'apron-toe');
  skin(Z_FACE_TOP - 0.03, Z_TOE + 0.02, 90, 18, (x, z) => ground(x, z) + 0.009, matGrass, 'slope-face');
  skin(Z_BERM_END, Z_FACE_TOP, 50, 4, (x, z) => ground(x, z) + 0.008, matGrass, 'berm-top');
  skin(Z_PADDY_TOP, Z_BERM_END, 24, 3, (x, z) => ground(x, z) + 0.007, matGrassDark, 'berm-step');
  skin(Z_PADDY_END + 0.02, Z_PADDY_TOP - 0.02, 46, 12, (x, z) => gh(z) + bump(x, z) * 0.22 + 0.005, matMud, 'paddy-floor');
  skin(Z_BANK_TOP, Z_PADDY_END, 24, 3, (x, z) => ground(x, z) + 0.007, matGrass, 'paddy-bank');
  skin(Z_FAR, Z_BANK_TOP, 34, 4, (x, z) => ground(x, z) + 0.007, matGrassDark, 'far-ground');
  // 雨筋（法面に洗われた土の筋＝経年 1）
  for (let i = 0; i < Math.round(len / 3.2); i++) {
    const x = -len / 2 + range(rnd, 1.0, len - 1.0);
    const m = mesh(patch(x - 0.42, x + 0.42, Z_FACE_TOP + 0.2, Z_TOE - 0.06, 3, 9, (xx, z) => gh(z) + 0.013), matEarth, { name: 'erosion-rill' });
    m.userData.noOutline = true;
    body.add(m);
  }

  /* ---------------- 草叶・春の小花 ---------------- */
  const lawn = grp('lawn');
  body.add(lawn);
  const bladesByTier = GRASS.map(() => []);
  for (let i = 0; i < 5200; i++) {
    const x = range(rnd, -len / 2, len / 2);
    const z = range(rnd, Z_BANK_TOP, Z_TOE + 0.3);
    if (z < Z_PADDY_TOP && z > Z_PADDY_END) continue;                   // 水面は空ける
    const slope = Math.abs(gh(z - 0.2) - gh(z + 0.2));
    const dens = z > Z_TOE ? 0.5 : z > Z_FACE_TOP ? (slope > 0.12 ? 0.82 : 1.0) : 0.95;
    if (rnd() > dens) continue;
    const q = rnd();
    const tier = q < 0.16 ? 0 : q < 0.44 ? 1 : q < 0.74 ? 2 : q < 0.9 ? 3 : 4;
    const s = range(rnd, 0.5, 1.25);
    bladesByTier[tier].push({
      x, y: ground(x, z) + 0.004, z, s, s2: s * range(rnd, 0.75, 1.45),
      rx: range(rnd, -0.3, 0.3), ry: rnd() * 6.283, rz: range(rnd, -0.34, 0.34),
      c: [0.84 + rnd() * 0.32, 0.86 + rnd() * 0.3, 0.8 + rnd() * 0.22],
    });
  }
  bladesByTier.forEach((arr, ti) => place(lawn, arr, BLADES[GRASS[ti].geo], GRASS[ti].mat, 'grass-' + ti, { cast: false, receive: true }));
  place(lawn, scatter(Math.round(len * 7), () => {
    const x = range(rnd, -len / 2, len / 2), z = range(rnd, Z_FACE_TOP + 0.1, Z_TOE + 0.1);
    const s = range(rnd, 0.9, 1.8);
    return { x, y: ground(x, z), z, s, s2: s * range(rnd, 1.1, 1.6), rx: range(rnd, -0.2, 0.4), ry: rnd() * 6.283, rz: range(rnd, -0.3, 0.3), c: [1.05, 1.06, 0.9] };
  }), BLADES[1], GRASS[3].mat, 'grass-seedheads', { cast: false });
  const flowerDots = (n, zmin, zmax, mat, nm, col) => place(lawn, scatter(n, () => {
    const x = range(rnd, -len / 2, len / 2), z = range(rnd, zmin, zmax);
    const s = range(rnd, 0.6, 1.4);
    return { x, y: ground(x, z) + range(rnd, 0.035, 0.11), z, s, s2: s, s3: s, rx: 0, ry: rnd() * 6.283, rz: 0, c: col };
  }), sph(0.016, 6, 5), mat, nm, { cast: false });
  flowerDots(Math.round(len * 2.2), Z_TOE - 0.9, Z_TOE + 0.3, matFlowerY, 'flower-dandelion', [1, 1, 1]);
  flowerDots(Math.round(len * 1.5), Z_TOE - 0.6, Z_TOE + 0.35, matFlowerP, 'flower-hotorokenoza', [1, 1, 1]);
  // 法先の玉石・砕石（洗い出し）
  place(body, scatter(Math.round(len * 18), () => {
    const x = range(rnd, -len / 2, len / 2), z = range(rnd, Z_TOE - 0.7, Z_FRONT + 0.1);
    const s = range(rnd, 0.4, 1.5);
    return { x, y: ground(x, z) + 0.014, z, s, s2: s, s3: s, rx: -Math.PI / 2 + range(rnd, -0.6, 0.6), ry: rnd() * 6.283, rz: 0 };
  }), BLADES[2], MAT.ballast({ color: PAL.ballast, repeat: 12 }), 'toe-stones', { cast: false, receive: true });

  /* ---------------- 法止めブロック（3 列・僅かにめり込み） ---------------- */
  const blocks = grp('slope-blocks');
  body.add(blocks);
  const bw = 0.94;
  const rows = [[Z_TOE - 0.10, Z_TOE - 1.02], [Z_TOE - 0.99, Z_TOE - 1.92], [Z_TOE - 1.89, Z_TOE - 2.68]];
  for (const [z0, z1] of rows) {
    const n = Math.floor(len / bw);
    const ang = Math.atan2(faceY(z0) - faceY(z1), z0 - z1);
    for (let i = 0; i < n; i++) {
      if (rnd() > 0.80) continue;                              // 欠け区画＝草が突き上げる（市松の抜け）
      const x = -len / 2 + bw * (i + 0.5) + range(rnd, -0.025, 0.025);
      const zc = (z0 + z1) / 2;
      const b = grp('block');
      b.add(mesh(rbox(bw - 0.035, 0.08, Math.abs(z1 - z0) + 0.66, 0.02, 2), rnd() > 0.8 ? matBlockOld : matBlock, { name: 'block-body' }));
      if (rnd() > 0.5) b.add(mesh(box(0.055, 0.05, Math.abs(z1 - z0) + 0.58), matBlock, { pos: [range(rnd, -0.12, 0.12), 0.055, 0], rot: [0, range(rnd, -0.45, 0.45), 0.38], name: 'block-rib' }));
      b.position.set(x, (gh(zc - 0.33) + gh(zc + 0.33)) / 2 + 0.024, zc);
      b.rotation.x = -ang * 0.6 + range(rnd, -0.02, 0.02);
      b.rotation.y = range(rnd, -0.05, 0.05);
      blocks.add(b);
    }
  }

  /* ---------------- 防護柵（天端：柱＋金网 2 層＋上端パイプ） ---------------- */
  const fence = grp('guard-fence');
  body.add(fence);
  const FZ = Z_BERM_END + 0.14, FH = 1.06, POST = 2.4;
  const nPost = Math.floor(len / POST) + 1;
  const netMat = MAT.metal('#a9b6a8', { alphaMap: netMask(9, 6), alphaTest: 0.5, side: DoubleSide, uv: { repeat: [2.3, 2.3] }, spec: 0.34, sheen: 0.06 });
  const netMatFade = MAT.metal('#87977c', { alphaMap: netMask(7, 8), alphaTest: 0.5, side: DoubleSide, uv: { repeat: [1.9, 1.9] }, spec: 0.16, sheen: 0.02, shadowAmt: 0.98 });
  for (let i = 0; i < nPost - 1; i++) {
    const x0 = -len / 2 + i * POST, x1 = x0 + POST;
    const sag = 0.035 + rnd() * 0.05;
    [[netMatFade, -0.032], [netMat, 0.009]].forEach(([mat, off], ord) => {
      const geo = patch(x0, x1, 0, FH, 8, 5, (x, t) => Math.sin(cl(t / FH, 0, 1) * Math.PI) * sag - off);
      geo.rotateX(-Math.PI / 2);                                 // 水平-strip → 垂直の网面
      const nm = mesh(geo, mat, { name: 'fence-net' + ord, pos: [0, gh(FZ), FZ] });
      nm.userData.noOutline = true;
      fence.add(nm);
    });
  }
  for (let i = 0; i < nPost; i++) {
    const x = -len / 2 + i * POST + range(rnd, -0.035, 0.035);
    const yp = gh(FZ), ph = FH + 0.10;
    const post = mesh(cyl(0.030, 0.034, ph, 8), matSteel, { pos: [x, yp + ph / 2 - 0.05, FZ], name: 'fence-post' });
    post.rotation.z = range(rnd, -0.02, 0.02);
    fence.add(post);
    fence.add(mesh(cyl(0.041, 0.030, 0.036, 8), matSteel, { pos: [x, yp + ph - 0.05, FZ], name: 'post-cap' }));
    fence.add(mesh(box(0.055, 0.028, 0.10), matSteel, { pos: [x, yp + FH - 0.01, FZ - 0.012], name: 'post-arm' }));
    for (const t of [0.34, 0.7]) fence.add(mesh(tor(0.039, 0.009, 4, 8), matIron, { pos: [x, yp + FH * t, FZ], rot: [Math.PI / 2, 0, 0], name: 'band' }));
    fence.add(mesh(cyl(0.054, 0.060, 0.07, 8), matKerb, { pos: [x, yp + 0.015, FZ], name: 'post-socket' }));
    // 柱の錆（経年 2）
    weather(fence, { kind: 'rust', w: 0.11, h: 0.36, pos: [x, yp + 0.24, FZ + 0.038], color: PAL.rust, opacity: 0.55, seed: seed + i * 7, density: 1.6, spread: 0.03 });
  }
  fence.add(pipe([...Array(Math.round(len / 1.2) + 1)].map((_, i, a) => {
    const x = -len / 2 + (i / (a.length - 1)) * len;
    return V(x, gh(FZ) + FH + 0.055 + Math.sin(x * 0.9 + ph0) * 0.014, FZ);
  }), 0.019, matSteel, { name: 'top-rail', seg: Math.round(len * 3) }));
  // 柵に絡む蔓・越草（経年 3）
  place(fence, scatter(Math.round(len * 5), () => {
    const x = range(rnd, -len / 2, len / 2);
    const s = range(rnd, 0.5, 1.3);
    return { x, y: gh(FZ) + range(rnd, -0.02, FH * 0.8), z: FZ + range(rnd, -0.1, 0.1), s, s2: s * range(rnd, 0.8, 1.4), rx: range(rnd, -1.4, 1.4), ry: rnd() * 6.283, rz: range(rnd, -1.3, 1.3), c: [0.9 + rnd() * 0.24, 1, 0.82 + rnd() * 0.2] };
  }), BLADES[2], GRASS[2].mat, 'fence-vine', { cast: false });

  /* ---------------- 排水落口（伏越）×2 ---------------- */
  for (let i = 0; i < 2; i++) {
    const x = (i === 0 ? -1 : 1) * len * (0.19 + rnd() * 0.09);
    const dz = Z_TOE - 0.28;
    const dg = grp('outlet');
    dg.add(mesh(rbox(0.80, 0.48, 0.60, 0.02, 2), matKerb, { pos: [0, 0.17, 0.10], name: 'headwall' }));
    dg.add(mesh(box(0.52, 0.28, 0.52), matGrille, { pos: [0, 0.12, -0.14], name: 'pipe-hollow' }));
    dg.add(mesh(cyl(0.13, 0.13, 0.46, 10, true), matEarth, { pos: [0, 0.12, -0.38], rot: [Math.PI / 2, 0, 0], name: 'culvert' }));
    const gg = grp('grille');
    for (let k = 0; k < 5; k++) gg.add(mesh(box(0.028, 0.26, 0.022), matIron, { pos: [-0.18 + k * 0.09, 0, 0], name: 'grille-v' }));
    for (let k = 0; k < 3; k++) gg.add(mesh(box(0.5, 0.024, 0.022), matIron, { pos: [0, -0.09 + k * 0.09, 0], name: 'grille-h' }));
    gg.position.set(0, 0.12, 0.41);
    dg.add(gg);
    weather(dg, { kind: 'dirt', w: 0.62, h: 0.34, pos: [0, 0.10, 0.42], color: '#3c3226', opacity: 0.55, seed: seed + 41 + i, density: 1.8, spread: 0.04 });
    weather(dg, { kind: 'moss', w: 0.5, h: 0.2, pos: [0.05, 0.33, 0.42], color: PAL.moss, opacity: 0.5, seed: seed + 47 + i, density: 1.4, spread: 0.03 });
    weather(dg, { kind: 'rust', w: 0.2, h: 0.2, pos: [-0.15, 0.15, 0.42], color: PAL.rust, opacity: 0.42, seed: seed + 53 + i, density: 1.2, spread: 0.03 });
    dg.position.set(x, gh(dz) - 0.07, dz + 0.34);
    dg.rotation.x = -0.15;
    body.add(dg);
    const pool = mesh(circ(0.44, 16), matWater, { pos: [x, 0.013, dz + 0.78], rot: [-Math.PI / 2, 0, 0], name: 'outlet-pool' });
    pool.userData.noOutline = true;
    body.add(pool);
  }

  /* ---------------- 田んぼ strip ---------------- */
  const paddy = grp('paddy');
  body.add(paddy);
  const pY = H_PADDY;
  {
    const water = mesh(patch(-len / 2 + 0.35, len / 2 - 0.35, Z_PADDY_TOP + 0.12, Z_PADDY_END + 0.06, 64, 10, (x, z) => pY + 0.030 + Math.sin(x * 2.1 + z * 1.3) * 0.004), matWater, { name: 'paddy-water' });
    water.userData.noOutline = true;
    paddy.add(water);
  }
  const levee = (x0, x1, z, wdt, nm) => {
    const m = mesh(box(Math.abs(x1 - x0), 0.17, wdt), matMud, { name: nm });
    m.position.set((x0 + x1) / 2, pY + 0.09, z);
    paddy.add(m);
    const cap = mesh(box(Math.abs(x1 - x0), 0.03, wdt * 0.55), matGrassDark, { name: nm + '-grass' });
    cap.position.set((x0 + x1) / 2, pY + 0.175, z);
    paddy.add(cap);
    return m;
  };
  levee(-len / 2, len / 2, Z_PADDY_TOP, 0.32, 'kidane-front');
  levee(-len / 2, len / 2, Z_PADDY_END, 0.36, 'kidane-back');
  for (let i = 0; i < 3; i++) {
    const x = -len / 2 + (i + 1) * (len / 4);
    const m = mesh(box(0.26, 0.17, Math.abs(Z_PADDY_END - Z_PADDY_TOP) - 0.1), matMud, { pos: [x, pY + 0.09, (Z_PADDY_TOP + Z_PADDY_END) / 2], name: 'kidane-div' });
    paddy.add(m);
  }
  // 杭と糸（鳥よけ／区画）
  {
    const nH = Math.max(4, Math.round(len / 1.8));
    const hz = Z_PADDY_TOP + 0.28;
    const pts = [];
    for (let i = 0; i < nH; i++) {
      const x = -len / 2 + 0.6 + i * ((len - 1.2) / (nH - 1));
      const hh = 0.5 + range(rnd, -0.07, 0.1);
      pts.push([x, pY + hh, hz]);
      const pole = mesh(cyl(0.019, 0.025, hh, 6), matPole, { pos: [x, pY + hh / 2, hz], name: 'paddy-stake' });
      pole.rotation.z = range(rnd, -0.07, 0.07);
      paddy.add(pole);
      paddy.add(mesh(cone(0.027, 0.05, 5), MAT.paint('#b8433c', { steps: 2, spec: 0.22 }), { pos: [x, pY + hh + 0.024, hz], name: 'stake-tip' }));
    }
    paddy.add(pipe(catenary(pts[0], pts[pts.length - 1], 0.14, 40), 0.005, matString, { name: 'bird-thread', seg: 56 }));
  }
  // 苗代・枯れ梗（水から顔を出す）
  place(paddy, scatter(Math.round(len * 3.4), () => {
    const x = range(rnd, -len / 2 + 0.5, len / 2 - 0.5), z = range(rnd, Z_PADDY_TOP + 0.42, Z_PADDY_END - 0.2);
    const s = range(rnd, 0.55, 1.35);
    return { x, y: pY + 0.03, z, s, s2: s * range(rnd, 0.8, 1.5), rx: range(rnd, -0.3, 0.3), ry: rnd() * 6.283, rz: range(rnd, -0.35, 0.35), c: [0.9 + rnd() * 0.12, 1.04, 0.7 + rnd() * 0.14] };
  }), BLADES[2], GRASS[3].mat, 'rice-seedlings', { cast: false });
  place(paddy, scatter(Math.round(len * 1.6), () => {
    const x = range(rnd, -len / 2 + 0.5, len / 2 - 0.5), z = range(rnd, Z_PADDY_TOP + 0.35, Z_PADDY_END - 0.15);
    const s = range(rnd, 0.4, 1.0);
    return { x, y: pY + 0.02, z, s, s2: s, rx: range(rnd, 0.1, 0.55), ry: rnd() * 6.283, rz: range(rnd, -0.5, 0.5) };
  }), BLADES[2], MAT.leaf({ color: '#d8c79c', map: TEX.leafCluster({ base: '#9a8552', seed: seed + 61 }), alphaTest: 0.44, emissiveIntensity: 0.02, shadowAmt: 1 }), 'stubble', { cast: false });
  // 畦端の肥料袋（生活感・人物は置かない）
  {
    const bag = grp('fert-bag');
    bag.add(mesh(rbox(0.36, 0.15, 0.25, 0.055, 3), MAT.fabric({ color: '#ded8c8', repeat: 6 }), { pos: [0, 0.075, 0], rot: [0, 0.3, 0], name: 'bag' }));
    bag.add(mesh(box(0.3, 0.006, 0.16), MAT.paper({ map: TEX.paper({ base: '#c1ac8c' }).map }), { pos: [0.02, 0.152, 0], rot: [0, 0.3, 0], name: 'bag-label' }));
    weather(bag, { kind: 'dirt', w: 0.32, h: 0.18, pos: [0, 0.07, 0.14], color: '#5c4a34', opacity: 0.5, seed: seed + 71, density: 1.6, spread: 0.03 });
    bag.position.set(len * 0.13, pY + 0.03, Z_PADDY_TOP - 0.42);
    bag.rotation.y = 0.4;
    paddy.add(bag);
  }

  /* ---------------- 里山シルエット（杉・竹・広葉樹） ---------------- */
  const hills = grp('hillback');
  body.add(hills);
  const TIERC = ['#4b6050', '#5b715a', '#6d8367'];            // 手前→奥（淡く＝空気遠近）
  const matSugi = TIERC.map((c) => MAT.paint(c, { steps: 2, spec: 0.03, sheen: 0, shadowAmt: 0.88, rim: 0.12, rimColor: '#cfe3d6', sat: 0.84 }));
  const matTrunk = MAT.bark({ base: '#57493d', seed: seed + 5, uv: { repeat: [1, 2] } });
  for (let i = 0; i < Math.round(len / 1.5); i++) {
    const depth = i % 3;
    const x = -len / 2 + (i + range(rnd, 0.1, 0.9)) * (len / Math.round(len / 1.5));
    const z = cl(Z_BANK_TOP - 0.3 - depth * range(rnd, 0.22, 0.4) - range(rnd, 0, 0.3), Z_FAR + 0.35, Z_BANK_TOP);
    const base = gh(z + 0.4);
    const th = range(rnd, 2.6, 5.8) * (1 - depth * 0.05);
    if (rnd() > 0.74) {                                       // 広葉樹（春の淡緑の塊）
      hills.add(mesh(cyl(0.05, 0.095, th * 0.42, 6), matTrunk, { pos: [x, base + th * 0.2, z], name: 'tree-trunk' }));
      for (let k = 0; k < 4; k++) {
        const s = mesh(sph(rq(th * range(rnd, 0.13, 0.23)), 8, 6), k === 0 ? matSugi[Math.min(2, depth)] : matSugi[depth], { pos: [x + range(rnd, -0.4, 0.4), base + th * 0.62 + range(rnd, -0.25, 0.45), z + range(rnd, -0.35, 0.35)], name: 'tree-crown' });
        s.scale.y = range(rnd, 0.55, 0.86);
        s.scale.x = s.scale.z = range(rnd, 0.9, 1.15);
        hills.add(s);
      }
      continue;
    }
    for (let k = 0; k < 3; k++) {                             // 杉：円錐 3 段
      const t0 = k / 3;
      const c = mesh(cone(rq(th * (0.2 - t0 * 0.05)), rq(th * (0.52 - t0 * 0.07)), 8), matSugi[depth], { pos: [x, base + th * (0.3 + t0 * 0.52), z], name: 'sugi' });
      c.rotation.y = rnd() * 3;
      c.scale.z = range(rnd, 0.82, 1.0);
      hills.add(c);
    }
    hills.add(mesh(cyl(0.035, 0.055, th * 0.22, 5), matTrunk, { pos: [x, base + th * 0.09, z], name: 'sugi-trunk' }));
  }
  // 竹薮（稈＋節＋葉カード）
  const matBamboo = MAT.paint('#83986a', { steps: 3, spec: 0.14, shadowAmt: 0.84, rim: 0.2, sat: 0.9 });
  const matBambooLeaf = MAT.leaf({ color: '#e8f2d2', map: TEX.leafCluster({ base: '#6f8f58', seed: seed + 77 }), alphaTest: 0.44, emissiveIntensity: 0.08, shadowAmt: 0.8, wind: { amp: 0.02, freq: 1.9, base: 0.8, span: 1.8 } });
  for (let c = 0; c < 3; c++) {
    const cx = -len / 2 + len * (0.12 + c * 0.34) + range(rnd, -1.2, 1.2);
    const cz = Z_FAR + 0.95 + range(rnd, -0.35, 0.35);
    const cb = gh(cz + 0.4);
    const n = 7 + ((rnd() * 5) | 0);
    scatter(n, () => {
      const hh = rq(range(rnd, 2.4, 4.8)), dx = range(rnd, -0.9, 0.9), dz = range(rnd, -0.7, 0.7);
      const m = mesh(cyl(0.022, 0.035, hh, 6), matBamboo, { pos: [cx + dx, cb + hh / 2, cz + dz], name: 'bamboo-culm' });
      m.rotation.set(range(rnd, -0.1, 0.1), 0, range(rnd, -0.12, 0.12));
      hills.add(m);
      for (let k = 2; k < 5; k += 2) {                        // 節は 2 箇所（描边不要＝微細部）
        const nd = mesh(tor(0.027, 0.005, 4, 7), matBamboo, { pos: [cx + dx, cb + (hh * k) / 5, cz + dz], rot: [Math.PI / 2, 0, 0], name: 'bamboo-node' });
        nd.userData.noOutline = true;
        hills.add(nd);
      }
      return { hh };
    });
    place(hills, scatter(n * 6, () => {
      const s = range(rnd, 0.6, 1.5);
      return { x: cx + range(rnd, -1, 1.0), y: cb + range(rnd, 1.9, 4.3), z: cl(cz + range(rnd, -0.9, 0.9), Z_FAR + 0.05, Z_BANK_TOP), s, s2: s, rx: range(rnd, -1.4, 1.4), ry: rnd() * 6.283, rz: range(rnd, -1.2, 1.2), c: [0.9 + rnd() * 0.2, 0.97 + rnd() * 0.14, 0.82 + rnd() * 0.2] };
    }), BLADES[0], matBambooLeaf, 'bamboo-leaf');
  }

  /* ---------------- 全体の経年（3 箇所以上） ---------------- */
  // 4) 天端の踏み跡・落枝
  for (let i = 0; i < Math.round(len * 0.7); i++) {
    const x = range(rnd, -len / 2, len / 2);
    const z = range(rnd, Z_FACE_TOP + 0.1, Z_BERM_END - 0.05);
    const st = mesh(cyl(0.008, 0.013, rq(range(rnd, 0.14, 0.4)), 5), matWood, { pos: [x, gh(z) + 0.024, z], name: 'fallen-twig' });
    st.rotation.set(Math.PI / 2, 0, rnd() * 6.283);
    st.userData.noOutline = true;
    body.add(st);
  }
  // 5) 法面の苔斑（斜面角に合わせた小判型を点在）
  {
    const z0 = Z_TOE - 0.5, z1 = Z_TOE - 1.6;
    const phi = Math.atan2(faceY(z1) - faceY(z0), z0 - z1);
    for (let i = 0; i < Math.round(len / 2.4); i++) {
      const x = range(rnd, -len / 2 + 1, len / 2 - 1);
      const z = range(rnd, Z_FACE_TOP + 0.3, Z_TOE - 0.1);
      weather(body, { kind: 'moss', w: range(rnd, 0.6, 1.15), h: range(rnd, 0.35, 0.6), pos: [x, gh(z) + 0.04, z], rot: [-(Math.PI / 2 - phi), 0, rnd() * 3], color: PAL.moss, opacity: 0.45, seed: seed + 83 + i, density: 1.7, count: 1, spread: 0.02 });
    }
    // 天端・法先の土砂付着（歩道側に流れ出た泥）
    weather(body, { kind: 'dirt', w: len * 0.32, h: 0.42, pos: [-len * 0.2, 0.02, Z_TOE + 0.16], rot: [-Math.PI / 2, 0, 0], color: '#6b5a41', opacity: 0.45, seed: seed + 111, density: 1.4, count: 2, spread: 0.015 });
  }
  decal(body, { map: TEX.wear({ kind: 'dirt', color: '#6b5a41', seed: seed + 91, density: 1.6 }), w: len * 0.5, h: 0.5, pos: [len * 0.1, 0.014, Z_FRONT - 0.02], rot: [-Math.PI / 2, 0, 0], opacity: 0.5, order: 2 });
  // 6) 古びた管理札（立入禁止）
  {
    const tag = grp('fence-tag');
    tag.add(mesh(rbox(0.21, 0.14, 0.01, 0.008, 2), matKerb, { name: 'tag-plate' }));
    decal(tag, { map: TEX.signboard({ text: '立入禁止', sub: '里山保全', bg: '#e8e0cb', fg: '#8a4038' }), w: 0.18, h: 0.11, pos: [0, 0, 0.007], opacity: 0.94 });
    weather(tag, { kind: 'dirt', w: 0.16, h: 0.1, pos: [0.01, -0.03, 0.008], color: '#6b5a41', opacity: 0.4, seed: seed + 97, density: 1.3, spread: 0.02 });
    tag.position.set(len * 0.07, gh(FZ) + FH * 0.62, FZ + 0.04);
    tag.rotation.set(0.05, 0.2, 0.03);
    body.add(tag);
  }

  return finish(g, { outline: 'thin', minSize: 0.06 });   // 極小部材（節・金具・枝）は描边不发＝輪郭の濁り防止
}

export { build, build as default, meta };
