import { g as grp, n as range, M as MAT, T as TEX, P as PAL, m as mesh, a as sph, r as rbox, w as weather, o as lathe, a0 as IS_FLAT, E as inst, a3 as tuftGeo, I as sakuraPetalRestGeo, l as catenary, k as tubeOf, p as shadowBlob, a1 as sakuraPetalGeo, q as finish, N as makeCanvas, Q as toTexture, a4 as RepeatWrapping, C as CatmullRomCurve3, V as Vector3, B as BufferGeometry, F as Float32BufferAttribute, z as rand, u as Matrix4, a2 as sakuraLeafGeo, x as PlaneGeometry } from './index-B1SzF3Mh.js';

//  assets/flora/sakura-somei-yoshino.js —— 染井吉野（Prunus × yedoensis）盛花・主力树
//  树干：车削母线做锥形+弯曲+板根（根元 D≈0.55m → 2.5m 处 D≈0.34m），皮孔壳/瘤节/幹傷露木/苔
//  分枝：三级（主枝 4~6 → 亚枝 2~3 叉 → 小枝），曲线走枝、枝元膨大、每组原点=枝根 + userData.sway
//  花冠：38± 个花团（每团 6~11 片花瓣卡片 inst 球面错落 + 随机 tilt/roll），不规则扁圆穹顶（Perlin 扰动）
//        上密下疏 / 外亮内暗 3 色阶 + 内层新叶 + 末端散瓣；冠下 shadowBlob 接地
//  单位米；原点 = 树干与地面接触点；+Y 上；正面 +Z；同一 options 结果完全确定（全部随机来自 rand(seed)）

const meta = {
  id: 'sakura-somei-yoshino',
  real: [5.2, 5.4, 5.2],      // 默认 options 下的幅 x 高 x 奥行（装配层再乘 scale）
  origin: 'ground-center',    // 原点 = 树根与地面接触点（干心），+Y 上，正面 +Z
};

const DEFAULT_OPTIONS = { seed: 11, height: 5.4, spread: 5.2, lean: 0, age: 1, style: 'open' };

/* ============================== 工具 ============================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const q = (v) => Math.round(v * 400) / 400;          // 缓存图元的半径量化
const ZAX = new Vector3(0, 0, 1);

/** 使对象局部 +Z 指向法线（父局部空间） */
function faceOut(o, nx, ny, nz) {
  const v = new Vector3(nx, ny, nz);
  if (v.lengthSq() < 1e-9) v.set(0, 0, 1);
  o.quaternion.setFromUnitVectors(ZAX, v.normalize());
  return o;
}

/** 微卷花瓣卡片（PlaneGeometry 派生 → 描边层跳过，轮廓不糊） */
function petalCardRaw(w, h, curl) {
  const g = new PlaneGeometry(w, h, 3, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const nx = x / (w / 2), ny = y / (h / 2);
    p.setZ(i, -nx * nx * curl * h * 0.55 + ny * ny * curl * h * 0.2 - Math.abs(nx) * curl * h * 0.06);
  }
  g.computeVertexNormals();
  return g;
}
/**
 * 卡片几何共享：花房ごとに新しい PlaneGeometry を作ると、同じ形・同じ素材の花弁が
 * すべて「別几何」になり inst() が花房単位で 1 draw call を消費する（この一本で約 1050）。
 * 寸法 10 mm / 巻き 0.2 単位に丸めて共有すれば数十種で足り、房ごとの size 差は
 * instance 側の scale が担うので見た目は変わらない。
 */
const CARD_STEP = 0.01, CURL_STEP = 0.2;
const cardCache = new Map();
const qCard = (v) => Math.max(CARD_STEP, Math.round(v / CARD_STEP) * CARD_STEP);
const qCurl = (v) => Math.round(v / CURL_STEP) * CURL_STEP;
/**
 * 平涂模式剥掉 map（core/style.js）→ alpha 抜きが空振りして全カードが「粉色の四角紙」に
 * なる（アップで見た花冠が紙吹雪の山になっていた）。輪郭は几何側で持つ。
 * toon 側は従来どおりカード＋貼图（细分 18 三角 → 花瓣 8 三角で軽い）。
 * FILL：実形の面積は bbox の約 45%。そのまま差し替えると花冠が透けて見えるので
 * 一弁を 1.35 倍して茂りの密度を戻す（10 mm 格子は 13.5 mm 格子にずれるだけ）。
 */
const FILL_P = 1.35, FILL_L = 1.25;
function petalCard(w, h, curl) {
  const qw = qCard(w), qh = qCard(h), qc = qCurl(curl);
  if (IS_FLAT) return sakuraPetalGeo(qw * FILL_P, qh * FILL_P, qc);
  const key = qw.toFixed(3) + 'x' + qh.toFixed(3) + '@' + qc.toFixed(2);
  let g = cardCache.get(key);
  if (!g) { g = petalCardRaw(qw, qh, qc); cardCache.set(key, g); }
  return g;
}
/** 葉（桜の葉は楕円＋尖頭）：花瓣と同じ理由で平涂では几何で形を持つ */
function leafCard(w, h, curl) {
  const qw = qCard(w), qh = qCard(h), qc = qCurl(curl);
  if (IS_FLAT) return sakuraLeafGeo(qw * FILL_L, qh * FILL_L, qc);
  const key = 'L' + qw.toFixed(3) + 'x' + qh.toFixed(3) + '@' + qc.toFixed(2);
  let g = cardCache.get(key);
  if (!g) { g = petalCardRaw(qw, qh, qc); cardCache.set(key, g); }
  return g;
}
/** 花梗の単位形状：長さ 1 cm・太さ 0.5 mm 単位で共有、方位はインスタンスの回転で出す */
const stalkCache = new Map();
function cachedStalk(L, r) {
  const qL = Math.max(0.01, Math.round(L / 0.01) * 0.01);
  const qR = Math.max(0.0005, Math.round(r / 0.0005) * 0.0005);
  const key = 's' + qL.toFixed(2) + 'r' + qR.toFixed(4);
  let g = stalkCache.get(key);
  if (!g) {
    const pts = catenary([0, qL, 0], [0.3 * qL, 0, 0], qL * 0.14, 5).map((v) => [v.x, v.y, v.z]);
    g = tubeOf(pts, qR, 6, 5);
    stalkCache.set(key, g);
  }
  return g;
}

/** 锥形曲线枝干：沿 CatmullRom 扫掠，起止半径渐变 + 棱线起伏 + 端盖 */
function limbGeo(pts, r0, r1, o = {}) {
  const seg = o.seg ?? Math.max(10, (pts.length - 1) * 5);
  const radial = o.radial ?? 9;
  const flat = o.flat ?? 1;
  const wob = o.wob ?? 0.05;
  const wp = o.wobPhase ?? 0;
  const taper = o.taper ?? 0.85;
  const vSpan = o.vSpan ?? 0.58;
  const curve = new CatmullRomCurve3(
    pts.map((p) => new Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.4);
  const len = curve.getLength();
  const fr = curve.computeFrenetFrames(seg, false);
  const ring = radial + 1;
  const pos = [], nor = [], uvs = [], idx = [];
  const push = (x, y, z, nx, ny, nz, u, v) => {
    pos.push(x, y, z); nor.push(nx, ny, nz); uvs.push(u, v);
  };
  const radAt = (t) => r0 + (r1 - r0) * Math.pow(t, taper);
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const r = radAt(t);
    const P = curve.getPoint(t);
    const N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const s = Math.sin(a), c = Math.cos(a);
      const rr = r * (1 + wob * Math.sin(a * 3 + t * 7.4 + wp) + wob * 0.5 * Math.sin(a * 7 - t * 3.1 + wp));
      const d = new Vector3(N.x * c + B.x * s, (N.y * c + B.y * s) * flat, N.z * c + B.z * s);
      if (d.lengthSq() < 1e-9) d.set(1, 0, 0);
      d.normalize();
      push(P.x + d.x * rr, P.y + d.y * rr, P.z + d.z * rr, d.x, d.y, d.z, (j / radial) * 1.6, (t * len) / vSpan);
    }
  }
  for (let i = 0; i < seg; i++) {
    const a0 = i * ring, b0 = (i + 1) * ring;
    for (let j = 0; j < radial; j++) idx.push(a0 + j, b0 + j, b0 + j + 1, a0 + j, b0 + j + 1, a0 + j + 1);
  }
  const cap = (t, flip) => {
    const k = Math.round(t * seg);
    const P = curve.getPoint(t), T = fr.tangents[k];
    push(P.x, P.y, P.z, T.x * flip, T.y * flip, T.z * flip, 0.5, (t * len) / vSpan);
    const center = pos.length / 3 - 1;
    const first = pos.length / 3;
    for (let j = 0; j <= radial; j++) {
      const N = fr.normals[k], B = fr.binormals[k];
      const a = (j / radial) * TAU;
      const r = radAt(t) * 0.97;
      push(
        P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r,
        P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r * flat,
        P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r,
        T.x * flip, T.y * flip, T.z * flip, j / radial, 0.5);
    }
    for (let j = 0; j < radial; j++) {
      if (flip > 0) idx.push(center, first + j, first + j + 1);
      else idx.push(center, first + j + 1, first + j);
    }
  };
  if (o.capStart !== false) cap(0, -1);
  if (o.capEnd !== false) cap(1, 1);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** 确定性 3D Perlin + fbm（每株独立排列表） */
function makeNoise(rnd) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fd = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lp = (a, b, t) => a + (b - a) * t;
  const gr = (h, x, y, z) => {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14) ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  const n3 = (x, y, z) => {
    const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
    const X = fx & 255, Y = fy & 255, Z = fz & 255;
    x -= fx; y -= fy; z -= fz;
    const u = fd(x), v = fd(y), w = fd(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lp(
      lp(lp(gr(perm[AA] & 15, x, y, z), gr(perm[BA] & 15, x - 1, y, z), u),
        lp(gr(perm[AB] & 15, x, y - 1, z), gr(perm[BB] & 15, x - 1, y - 1, z), u), v),
      lp(lp(gr(perm[AA + 1] & 15, x, y, z - 1), gr(perm[BA + 1] & 15, x - 1, y, z - 1), u),
        lp(gr(perm[AB + 1] & 15, x, y - 1, z - 1), gr(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
  };
  const fbm = (x, y, z, oct = 3) => {
    let a = 0, amp = 0.62, f = 1;
    for (let i = 0; i < oct; i++) { a += n3(x * f, y * f, z * f) * amp; amp *= 0.5; f *= 2.05; }
    return a;
  };
  return { n3, fbm };
}

/** 樱树皮横向皮孔层（自制 canvas；Node 下 makeCanvas 返回 null → 跳过该层） */
function lenticelTexture(seed) {
  const cv = makeCanvas(512, 512);
  if (!cv) return null;
  const { g, w, h } = cv;
  const r = rand(seed * 7 + 5);
  g.clearRect(0, 0, w, h);
  const dash = (x, y, len, th, col, alpha) => {
    g.globalAlpha = alpha;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x - len / 2, y);
    g.quadraticCurveTo(x - len * 0.2, y - th, x + len * 0.12, y - th * 0.72);
    g.quadraticCurveTo(x + len / 2, y - th * 0.2, x + len / 2, y);
    g.quadraticCurveTo(x + len / 2, y + th * 0.34, x + len * 0.1, y + th * 0.86);
    g.quadraticCurveTo(x - len * 0.24, y + th, x - len / 2, y);
    g.closePath();
    g.fill();
  };
  for (let i = 0; i < 230; i++) {
    const x = r() * w, y = r() * h;
    const len = 9 + r() * 58, th = 0.9 + r() * 2.4;
    const dark = r() > 0.36;
    const col = dark ? '#2f2622' : '#cdb6a4';
    const al = dark ? 0.28 + r() * 0.34 : 0.18 + r() * 0.22;
    dash(x, y, len, th, col, al);
    if (y > h - 14) dash(x, y - h, len, th, col, al);
    if (y < 14) dash(x, y + h, len, th, col, al);
  }
  for (let i = 0; i < 15; i++) {
    const x = r() * w, y = r() * h, rr = 3 + r() * 8;
    g.globalAlpha = 0.3;
    g.fillStyle = '#3a2c25';
    g.beginPath(); g.ellipse(x, y, rr * 1.6, rr, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.22;
    g.fillStyle = '#d8c2ae';
    g.beginPath(); g.ellipse(x - rr * 0.3, y - rr * 0.4, rr * 0.9, rr * 0.5, 0, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const t = toTexture(cv, { repeat: 1 });
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/* ============================== 建模 ============================== */
function build(options = {}) {
  const seed = options.seed ?? 11;
  const height = options.height ?? 5.4;
  const spread = options.spread ?? 5.2;
  const lean = options.lean ?? 0;
  const age = clamp(options.age ?? 1, 0.16, 1.7);
  const style = options.style ?? 'open';

  const rnd = rand(seed);
  const noise = makeNoise(rand(seed * 3 + 17));
  const S = grp('sakura-somei-yoshino');

  /* 姿态档位：open 标准扁圆穹顶 / wide 広伞 / upright 立性 */
  const ST = style === 'wide'
    ? { w: 1.16, hy: 0.9, uRange: [0.06, 0.52], droop: 1.3, dens: 0.95, leaf: 0.7 }
    : style === 'upright'
      ? { w: 0.83, hy: 1.1, uRange: [0.4, 0.9], droop: 0.62, dens: 1.05, leaf: 0.95 }
      : { w: 1.0, hy: 1.0, uRange: [0.18, 0.8], droop: 1.0, dens: 1.0, leaf: 1.0 };

  const H = height * ST.hy;
  const W = spread * ST.w;
  const girth = Math.pow(age, 0.6) * Math.pow(H / 5.4, 0.55);
  const trunkTop = clamp(H * 0.44, 1.3, 2.75);          // 第一级分枝高度
  const nPrim = clamp(Math.round(range(rand(seed + 91), 4.4, 6.2) * (0.72 + 0.28 * age)), 4, 6);

  /* ---- 主干母线：根元 D 0.55m → 2.5m 处 D 0.34m（绝对米，按 girth 缩放） ---- */
  const PROF = [
    [0.276, 0.0], [0.262, 0.05], [0.244, 0.13], [0.226, 0.26], [0.211, 0.44],
    [0.201, 0.68], [0.192, 0.98], [0.185, 1.32], [0.179, 1.68], [0.1735, 2.08],
    [0.169, 2.5], [0.158, 2.82], [0.143, 3.1], [0.124, 3.42], [0.103, 3.72], [0.082, 4.0],
  ];
  const radiusAt = (y) => {
    const yy = clamp(y, 0, 4.0);
    let i = 0;
    while (i < PROF.length - 2 && PROF[i + 1][1] < yy) i++;
    const [r0, y0] = PROF[i], [r1, y1] = PROF[i + 1];
    const t = y1 > y0 ? clamp((yy - y0) / (y1 - y0), 0, 1) : 0;
    return r0 + (r1 - r0) * t;
  };
  const leanAz = range(rnd, 0, TAU);
  const leanK = lean * H * 0.46;
  const axisAt = (y) => {
    const t = clamp(y / trunkTop, 0, 1);
    const s = t * t * (3 - 2 * t);
    const bx = noise.n3(1.3, y * 0.62, 4.1) * 0.075 * girth;
    const bz = noise.n3(8.7, y * 0.62, 2.2) * 0.075 * girth;
    return {
      x: Math.cos(leanAz) * leanK * s + bx,
      z: Math.sin(leanAz) * leanK * s + bz,
      r: radiusAt(y) * girth,
    };
  };
  const ridgeN = clamp(Math.round(range(rnd, 4, 6)), 3, 6);
  const ridgePh = rnd() * TAU;

  /* 车削 → 顶点级变形（锥+弯+板根棱），可加半径偏移复用为皮孔壳 */
  const profPts = [[0, 0.002]];
  {
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const y = (i / N) * trunkTop;
      profPts.push([radiusAt(y), y]);
    }
  }
  function trunkShell(inflate) {
    const g = lathe(profPts, 30);
    const pa = g.attributes.position, ua = g.attributes.uv;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      let r = Math.hypot(x, z);
      const a = Math.atan2(z, x);
      const fy = clamp(1 - y / (trunkTop * 0.55), 0, 1);
      const ridge = Math.pow(Math.max(0, Math.cos(a * ridgeN + ridgePh)), 3.2) * fy * fy;
      const gn = 1 + 0.06 * noise.n3(Math.cos(a) * 1.7, y * 1.9, Math.sin(a) * 1.7) + 0.16 * ridge;
      r = r * gn + inflate;
      const o = axisAt(y);
      pa.setXYZ(i, o.x + Math.cos(a) * r, y, o.z + Math.sin(a) * r);
      ua.setXY(i, ua.getX(i) * 1.7, y / 0.58);
    }
    g.computeVertexNormals();
    return g;
  }

  const MAT_BARK = MAT.bark({ seed });
  const MAT_BARK_OLD = MAT.bark({
    seed, contrast: 1.08, tint: '#f2e0da',
    map: TEX.bark({ base: '#66503f', seed: seed + 3 }).map,
    normalMap: TEX.bark({ base: '#66503f', seed: seed + 3 }).normalMap,
  });
  const MAT_WOOD = MAT.wood({ light: '#e6c79f', dark: '#b58c60', knots: 1 });
  const MAT_WOOD_DARK = MAT.wood({ light: '#9a7a58', dark: '#54402f' });
  const MAT_SCAR = MAT.paint(PAL.trunkDark, { spec: 0.05, steps: 2, shadowAmt: 1 });

  S.add(mesh(trunkShell(0), MAT_BARK, { name: 'trunk' }));

  /* 横向皮孔壳（透明贴面，不重复描边） */
  const lenticel = lenticelTexture(seed);
  if (lenticel) {
    const sleeve = mesh(trunkShell(Math.max(0.0045, trunkTop * 0.008)), MAT.paint('#ffffff', {
      map: lenticel, transparent: true, opacity: 0.9, depthWrite: false,
      spec: 0.05, sheen: 0, steps: 4, shadowAmt: 0.9, shadowTint: '#8f7480', rim: 0.1, dither: 0.006,
    }), { name: 'trunk-lenticels', cast: false, receive: false });
    sleeve.userData.noOutline = true;
    S.add(sleeve);
  }

  /* ---- 板根 ---- */
  const nRoot = clamp(Math.round(range(rnd, 4.4, 6.4)), 4, 7);
  const rootR0 = radiusAt(0.3) * girth;
  for (let i = 0; i < nRoot; i++) {
    const a = (i / nRoot) * TAU + range(rnd, -0.34, 0.34) + ridgePh * 0.2;
    const o = axisAt(trunkTop * 0.1);
    const L = range(rnd, 0.3, 0.58) * (0.7 + 0.5 * girth);
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const rad = o.r * (1 - 0.16 * t) + L * t * 0.95;
      pts.push([
        o.x * (1 - t) + Math.cos(a) * rad,
        trunkTop * 0.14 * (1 - t * t) + 0.014,
        o.z * (1 - t) + Math.sin(a) * rad,
      ]);
    }
    S.add(mesh(limbGeo(pts, rootR0 * range(rnd, 0.42, 0.62), 0.004, {
      seg: 22, radial: 8, taper: 1.5, flat: 0.46, wob: 0.1, vSpan: 0.34,
    }), MAT_BARK_OLD, { name: 'root-flare' }));
  }

  /* ---- 瘤节 / 落枝痕 / 幹傷 ---- */
  const nBurl = clamp(Math.round(range(rnd, 2, 4) + age * 2), 2, 6);
  for (let i = 0; i < nBurl; i++) {
    const y = range(rnd, 0.3, trunkTop * 0.9);
    const a = rnd() * TAU;
    const o = axisAt(y);
    const s = range(rnd, 0.026, 0.06) * (0.7 + 0.6 * girth);
    const nx = Math.cos(a), nz = Math.sin(a);
    const b = mesh(sph(q(s), 10, 7), MAT_BARK_OLD, {
      name: 'burl', pos: [o.x + nx * (o.r - s * 0.25), y, o.z + nz * (o.r - s * 0.25)],
    });
    faceOut(b, nx, range(rnd, -0.25, 0.35), nz);
    b.rotateX(Math.PI / 2);
    b.scale.set(1.3, 1, range(rnd, 0.6, 0.9));
    S.add(b);
  }
  for (let i = 0; i < clamp(Math.round(range(rnd, 2, 4)), 1, 5); i++) {
    const y = range(rnd, 0.5, trunkTop * 0.95);
    const a = rnd() * TAU;
    const o = axisAt(y);
    const nx = Math.cos(a), nz = Math.sin(a);
    const kg = grp('stub-scar', { pos: [o.x + nx * o.r, y, o.z + nz * o.r] });
    faceOut(kg, nx, range(rnd, -0.18, 0.18), nz);
    kg.rotateZ(rnd() * TAU);
    const s = 0.02 * (0.75 + 0.5 * girth);
    kg.add(mesh(sph(q(s), 10, 7), MAT_SCAR, { name: 'stub', pos: [0, 0, s * 0.1], scale: [1.55, 1, 0.34] }));
    kg.add(mesh(sph(q(s * 1.5), 10, 7), MAT_BARK_OLD, { name: 'stub-lip', pos: [0, 0, -s * 0.2], scale: [1, 1, 0.4] }));
    S.add(kg);
  }
  {
    /* 幹傷：皮が剥げて白木が露出（陥凹 + 木肌 + 愈伤縁 + 树液流痕） */
    const wy = range(rnd, 0.8, 1.5);
    const wa = rnd() * TAU;
    const o = axisAt(wy);
    const nx = Math.cos(wa), nz = Math.sin(wa);
    const wg = grp('wound', { pos: [o.x + nx * (o.r - 0.003), wy, o.z + nz * (o.r - 0.003)] });
    faceOut(wg, nx, 0.07, nz);
    wg.rotateZ(range(rnd, -0.3, 0.3));
    const w = 0.058 * (0.7 + 0.6 * girth), hh = 0.16 * (0.7 + 0.6 * girth);
    wg.add(mesh(rbox(w * 1.4, hh * 1.26, 0.02, 0.018, 2), MAT_WOOD_DARK, { name: 'wound-recess', pos: [0, 0, 0.002] }));
    wg.add(mesh(rbox(w, hh, 0.026, 0.014, 2), MAT_WOOD, { name: 'wound-wood', pos: [0, 0, 0.01] }));
    wg.add(mesh(rbox(w * 0.34, hh * 0.5, 0.014, 0.005, 2), MAT_SCAR, { name: 'wound-core', pos: [w * 0.2, -hh * 0.2, 0.019] }));
    for (let i = 0; i < 6; i++) {
      const a = -0.66 + (i / 5) * 1.32;
      const c = mesh(sph(q(0.012), 8, 6), MAT_BARK_OLD, {
        name: 'wound-callus', pos: [Math.sin(a) * w * 1.32, Math.cos(a) * hh * 1.24, 0.012],
      });
      c.scale.set(1, 0.62, 0.5);
      wg.add(c);
    }
    S.add(wg);
    const sc = grp('sap-streak', { pos: [o.x + nx * (o.r * 1.16 + 0.001), wy + hh, o.z + nz * (o.r * 1.16 + 0.001)] });
    faceOut(sc, nx, 0.04, nz);
    weather(sc, {
      w: 0.05, h: 0.24, rot: [0, 0, range(rnd, -0.18, 0.18)], kind: 'dirt', color: '#3b2b24',
      opacity: 0.4, seed: seed + 41, density: 1.4, count: 2, spread: 0.004,
    });
    S.add(sc);
  }

  /* ---- 基部：土留め円形盛土 + 苔 + 草 + 落花 ---- */
  const moundR = clamp(0.6 + 0.55 * girth, 0.48, 1.2);
  const moundH = 0.1 * (0.85 + 0.35 * girth);
  const MOUND = [[0, 1.0], [0.3, 0.94], [0.55, 0.82], [0.76, 0.6], [0.9, 0.33], [0.97, 0.1], [1, 0]];
  /** 半径 k（moundR 単位）地点の盛土表面の高さ。苔も落花も「この上」に置かないと土に埋もれる */
  const moundSurfY = (k) => {
    for (let i = 1; i < MOUND.length; i++) {
      if (k <= MOUND[i][0]) {
        const [r0, y0] = MOUND[i - 1], [r1, y1] = MOUND[i];
        return (y0 + ((y1 - y0) * (k - r0)) / (r1 - r0)) * moundH;
      }
    }
    return 0;
  };
  const soilTex = TEX.concrete({ base: PAL.dirt, repeat: 3, cracked: true });
  const soil = mesh(lathe(
    MOUND.map(([r, y]) => [r * moundR, y * moundH]), 26),
  MAT.paint('#ffffff', {
    map: soilTex.map, normalMap: soilTex.normalMap, normalScaleX: 1.1, normalScaleY: 1.1,
    spec: 0.03, sheen: 0, steps: 4, shadowAmt: 0.98, rim: 0.08, uv: { repeat: [2.2, 2.2] },
  }), { name: 'root-mound' });
  S.add(soil);
  const curbTex = TEX.concrete({ base: PAL.curb, repeat: 3 });
  const curb = mesh(lathe(
    [[0.985, 0], [1.0, 0.026], [1.0, 0.096], [0.974, 0.118], [0.946, 0.116], [0.952, 0.058], [0.928, 0]]
      .map(([r, y]) => [r * moundR, y * (0.9 + 0.25 * girth)]), 30),
  MAT.paint('#ffffff', {
    map: curbTex.map, normalMap: curbTex.normalMap, spec: 0.09, steps: 3, shadowAmt: 0.86,
    uv: { repeat: [3, 1] },
  }), { name: 'kerb-ring' });
  S.add(curb);
  weather(soil, { w: moundR * 0.85, h: moundR * 0.72, pos: [-moundR * 0.2, moundH * 0.95, -moundR * 0.12], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 11, density: 1.3, count: 2, spread: 0.005 });
  weather(soil, { w: moundR * 0.6, h: moundR * 0.5, pos: [moundR * 0.34, moundH * 0.9, moundR * 0.26], rot: [-Math.PI / 2, 0, 1.1], kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 12, density: 1.1, count: 1, spread: 0.004 });
  weather(curb, { w: moundR * 0.5, h: 0.1, pos: [0, 0.06, moundR * 0.99], rot: [0, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 13, density: 1.4, count: 2, spread: 0.01 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + rnd() * 1.1;
    const o = axisAt(0.12);
    const nx = Math.cos(a), nz = Math.sin(a);
    const g = grp('trunk-moss', { pos: [o.x + nx * (o.r * 1.16 + 0.003), range(rnd, 0.15, 0.55), o.z + nz * (o.r * 1.16 + 0.003)] });
    faceOut(g, nx, 0.05, nz);
    weather(g, { w: 0.13, h: 0.2, rot: [0, 0, rnd() * 2], kind: 'moss', color: PAL.moss, opacity: 0.46, seed: seed + 60 + i, density: 1.3, count: 2, spread: 0.004 });
    S.add(g);
  }
  for (let i = 0; i < 3; i++) {
    const a = rnd() * TAU, y = range(rnd, 0.85, trunkTop * 0.9);
    const o = axisAt(y);
    const nx = Math.cos(a), nz = Math.sin(a);
    const g = grp('lichen', { pos: [o.x + nx * (o.r * 1.16 + 0.002), y, o.z + nz * (o.r * 1.16 + 0.002)] });
    faceOut(g, nx, 0.04, nz);
    weather(g, { w: 0.09, h: 0.075, kind: 'chip', color: '#c9c6b4', opacity: 0.3, seed: seed + 77 + i, density: 1.4, count: 2, spread: 0.003 });
    S.add(g);
  }
  weather(soil, { w: moundR * 1.2, h: moundR * 1.1, pos: [0, moundH * 0.62, 0], rot: [-Math.PI / 2, 0, 0.4], kind: 'dirt', color: '#6d5f4f', opacity: 0.24, seed: seed + 90, density: 0.9, count: 2, spread: 0.004 });

  /* ---- 材质（花瓣 3 色阶：外亮内暗 / 芯暗粉 / 新叶） ---- */
  const leafTexYoung = IS_FLAT ? null : TEX.leafCluster({ base: PAL.leafYoung, seed: seed + 5 });
  // 苔むらは立体の葉（tuftGeo）で形を持つ → 貼图の alpha 抜きは要らない
  const MAT_MOSS = MAT.leaf({ color: '#e8f2da', alphaTest: 0, rim: 0.28 });
  // 平涂模式は card を几何輪郭に切り替えるので、これらの alpha 貼图は一度もサンプリング
  // されない。生成を止めると 1 本あたり数 MB の canvas 描画＋アップロードが消える。
  const pTex = IS_FLAT ? [null, null, null] : [TEX.petal({ tone: 0 }), TEX.petal({ tone: 1 }), TEX.petal({ tone: 2 })];
  // 内層の暗みは「掛け算の色」だが、平涂で花弁が実形になると一枚ずつ読めるので
  // 今の濃さ（#b9a1ad）は枯れ色に見える。平涂では明るく薄い桜色に寄せる。
  const TINT_MID = IS_FLAT ? '#f2dce4' : '#dcc2cd';
  const TINT_DEEP = IS_FLAT ? '#e7cdd9' : '#b9a1ad';
  const MAT_P = [
    MAT.petal({ map: pTex[0], tone: 0, glow: 0.28, rim: 0.6, rimPower: 1.6, alphaTest: 0.4, steps: 3, dither: 0.005 }),
    MAT.petal({ map: pTex[1], tone: 1, glow: 0.15, rim: 0.46, alphaTest: 0.4, steps: 3, dither: 0.005 }),
    MAT.petal({ map: pTex[2], tone: 2, glow: 0.05, rim: 0.3, alphaTest: 0.4, steps: 3, tint: TINT_MID, dither: 0.005 }),
    MAT.petal({ map: pTex[2], tone: 2, glow: 0.0, rim: 0.18, alphaTest: 0.42, steps: 2, tint: TINT_DEEP }),
  ];
  const MAT_P_HANG = MAT.petal({ map: IS_FLAT ? null : TEX.petal({ mode: 'cluster', tone: 1 }), tone: 1, glow: 0.22, rim: 0.52, alphaTest: 0.3, steps: 3 });
  // 落花・漂花一弁用：輪郭は几何側（上の MAT_P は toon 側だけ貼图 alpha で抜くカード方式）
  const MAT_P_SOLID = MAT.petal({ tone: 1, glow: 0.06, rim: 0.32, alphaTest: 0, steps: 3, dither: 0.006 });
  const MAT_LEAF = MAT.leaf({ map: leafTexYoung, color: '#f4f7e6', alphaTest: 0.4, rim: 0.34 });
  const MAT_LEAF_DEEP = MAT.leaf({ map: leafTexYoung, color: PAL.leaf, alphaTest: 0.42, rim: 0.2 });
  const MAT_PEDICEL = MAT.paint(PAL.sakuraCenter, { spec: 0.08, steps: 2, shadowAmt: 0.9, sheen: 0 });

  /* 盛土上の苔・草むらと基部の落花（1m 近景の密度） */
  {
    const nG = clamp(Math.round(15 + 13 * age), 12, 30);
    S.add(inst(tuftGeo(0.11, 0.13, 5), MAT_MOSS, nG, (i, d, r2, col) => {
      const a = (i / nG) * TAU + r2() * 0.6;
      const k = 0.35 + r2() * 0.62;
      const rr = moundR * k;
      const s = range(r2, 0.5, 1.1);
      d.position.set(Math.cos(a) * rr, moundSurfY(k) + 0.002, Math.sin(a) * rr);
      d.rotation.set(0, r2() * TAU, 0);
      d.scale.set(s, s * range(r2, 1.0, 1.7), s);
      col.setHSL(0.24 + r2() * 0.08, 0.26 + r2() * 0.2, 0.74 + r2() * 0.18);
    }, { name: 'moss-tufts', cast: false, receive: true }));

    // 落花は「形を貼图で抜く」方式をやめた：平涂では map が剥がれて粉紅色の四角紙になる。
    // sakuraPetalRestGeo()（core/kit.js）なら両スタイルで花弁の輪郭になる。
    const nP = clamp(Math.round(32 + 26 * age), 24, 62);
    S.add(inst(sakuraPetalRestGeo(0.036), MAT_P_SOLID, nP, (i, d, r2, col) => {
      const a = r2() * TAU;
      const k = 0.62 + Math.pow(r2(), 0.6) * 1.0;
      const rr = moundR * k;
      d.position.set(Math.cos(a) * rr, moundSurfY(k) + 0.004 + r2() * 0.006, Math.sin(a) * rr);
      d.rotation.set(range(r2, -0.1, 0.1), r2() * TAU, range(r2, -0.14, 0.14));
      d.scale.setScalar(range(r2, 0.8, 1.35));
      col.setHSL(0.93 + r2() * 0.04, 0.4 + r2() * 0.2, 0.62 + r2() * 0.22);
    }, { name: 'fallen-petals-ring', cast: false, receive: true }));
  }

  /* ---- 花团 ---- */
  let budget = clamp(Math.round((118 + 46 * age) * ST.dens * clamp(W / 5.2, 0.66, 1.3)), 86, 186);
  const spent = { n: 0 };

  function blossom(parent, p, r, tier, opts = {}) {
    if (spent.n >= budget) return null;
    spent.n++;
    const bg = grp('blossom', { pos: [p[0], p[1], p[2]] });
    const cs = ((Math.round(p[0] * 373) + Math.round(p[1] * 911) + Math.round(p[2] * 1117) + seed * 7919) & 0x7fffffff) >>> 0;
    const cr = rand(cs);
    const n = Math.round(range(cr, 8, 14));
    const cw = r * range(cr, 0.5, 0.68);
    const spin = cr() * TAU;
    const mat = opts.clusterCard ? MAT_P_HANG : MAT_P[clamp(tier, 0, 3)];
    // 内層でも「濃い赤」にはしない。染井吉野は影側も淡い桜色のまま沈む。
    const paleBase = tier === 0 ? 0.93 : tier === 1 ? 0.88 : opts.clusterCard ? 0.9 : 0.82;

    /** 一球：n 枚の花弁カードを球面に错落配置（每片随机 tilt / roll） */
    const puff = (host, rr0, nn, cwv, matv, pale, curl, spin0) => {
      host.add(inst(petalCard(q(cwv), q(cwv * 0.93), curl), matv, nn, (i, d, ru, col) => {
        const k = (i + 0.35) / nn;
        const az = spin0 + i * 2.3999632 + range(ru, -0.17, 0.17);
        const sy = clamp(1 - k * 1.92, -0.9, 0.97);
        const hrr = Math.sqrt(Math.max(0.05, 1 - sy * sy));
        const pr = rr0 * range(ru, 0.6, 1.02);
        const dir = new Vector3(Math.cos(az) * hrr, sy * (sy > 0 ? 1 : 0.74), Math.sin(az) * hrr).normalize();
        d.position.set(dir.x * pr, dir.y * pr * 0.98, dir.z * pr);
        // 基底：卡片长轴(-Y=瓣尖) 沿半径向外，法线球面接線寄り → 重ね瓦状
        const tan = new Vector3(-dir.z, 0, dir.x);
        if (tan.lengthSq() < 1e-6) tan.set(1, 0, 0);
        tan.normalize();
        const ny = dir.clone().negate();
        const nz = new Vector3().crossVectors(tan, ny).normalize();
        d.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(tan, ny, nz));
        d.rotateX(range(ru, -0.62, 0.62));
        d.rotateY(range(ru, -0.5, 0.5));
        d.rotateZ(range(ru, -0.95, 0.95));
        const s = range(ru, 0.82, 1.26);
        d.scale.set(s, s * range(ru, 0.9, 1.18), 1);
        col.setHSL(0.93 + ru() * 0.045, 0.13 + ru() * 0.2, pale + ru() * (1 - pale));
      }, { name: 'petals', cast: true, receive: false }));
    };
    puff(bg, r, n, cw, mat, paleBase, 0.52, spin);
    /* 副球（2~3 球でひとつの花束 → 雲団構造・厚みのある冠殻） */
    const nSub = cr() > 0.4 ? (cr() > 0.78 ? 2 : 1) : 0;
    for (let i = 0; i < nSub; i++) {
      const a = cr() * TAU, el = range(cr, -0.75, 0.55);
      const off = r * range(cr, 0.44, 0.74);
      const sub = grp('blossom-sub', { pos: [Math.cos(a) * off, Math.sin(el) * off * 0.85, Math.sin(a) * off] });
      bg.add(sub);
      const sr = r * range(cr, 0.5, 0.7);
      puff(sub, sr, Math.round(range(cr, 5, 8.4)), sr * range(cr, 0.5, 0.66),
        MAT_P[clamp(tier + ((i % 2) || (tier === 2 ? 0 : 1)), 0, 3)], paleBase - 0.06, 0.58, cr() * TAU);
    }

    /* 内層の暗い芯（透光を抑え「内暗」を作る） */
    if (r > 0.1) {
      bg.add(inst(petalCard(q(cw * 1.16), q(cw * 1.12), 0.75), MAT_P[3], 4, (i, d, rr, col) => {
        const a = (i / 4) * TAU + rr() * 1.4;
        const el = range(rr, -0.55, 0.6);
        d.position.set(Math.cos(a) * r * 0.34, Math.sin(el) * r * 0.32, Math.sin(a) * r * 0.34);
        d.rotation.set(rr() * 3, a, rr() * 3);
        d.scale.setScalar(range(rr, 0.85, 1.22));
        col.setHSL(0.94 + rr() * 0.035, 0.14 + rr() * 0.16, 0.84 + rr() * 0.13);
      }, { name: 'petal-core', cast: false }));
    }
    /* 新叶（内層・下層中心） */
    const leafMul = ST.leaf * (tier >= 2 ? 1.7 : 0.6);
    const nLeaf = Math.max(0, Math.round(range(cr, 0.4, 2.2) * leafMul));
    if (nLeaf > 0) {
      bg.add(inst(leafCard(q(r * 0.74), q(r * 0.52), 0.3), tier >= 2 ? MAT_LEAF_DEEP : MAT_LEAF, nLeaf, (i, d, rr, col) => {
        const a = rr() * TAU;
        const el = range(rr, -1.2, 0.45);
        d.position.set(Math.cos(a) * r * 0.86, Math.sin(el) * r * 0.74, Math.sin(a) * r * 0.86);
        d.rotation.set(range(rr, -1.3, 0.6), rr() * TAU, rr() * 2);
        const s = range(rr, 0.68, 1.15);
        d.scale.set(s, s, s);
        col.setHSL(0.235 + rr() * 0.075, 0.3 + rr() * 0.24, 0.6 + rr() * 0.22);
      }, { name: 'young-leaves', cast: false }));
    }
    /* 末端散瓣 */
    if (opts.loose) {
      const nS = Math.round(range(cr, 2.2, 4.6));
      bg.add(inst(petalCard(q(cw * 0.86), q(cw * 0.8), 0.72), MAT_P[0], nS, (i, d, rr, col) => {
        const a = rr() * TAU;
        const el = range(rr, -1.5, 0.6);
        const R = r * range(rr, 1.25, 2.0);
        d.position.set(Math.cos(a) * R * Math.cos(el), Math.sin(el) * R * 0.8, Math.sin(a) * R * Math.cos(el));
        d.rotation.set(rr() * TAU, rr() * TAU, rr() * TAU);
        d.scale.setScalar(range(rr, 0.68, 1.05));
        col.setHSL(0.94 + rr() * 0.04, 0.2 + rr() * 0.2, 0.93);
      }, { name: 'loose-petals', cast: false }));
    }
    /* 花梗（短い吊り梗：傘形花序のごとく、枝から下って花団に繋ぐ） */
    if (opts.pedicel) {
      const L = opts.pedicel;
      const a = cr() * TAU;
      // 単位形状を回転配置（yaezeni と同じ理由：1 本 = 1 draw call を避ける）
      const m = mesh(cachedStalk(L, 0.0035 * (0.8 + 0.4 * girth)), MAT_PEDICEL, { name: 'pedicel', cast: false });
      m.rotation.y = -a;
      bg.add(m);
    }
    // 花房には個別の揺れノードを付けない（yaezeni と同じ理由）：房ごとのノードが
    // 「揺れサブツリーの宿主」を細分化して实例マージを無効化し、一本あたり数百コールを
    // 浪費していた。房自身の揺れ幅 0.012〜0.026 rad は小枝のそれより小さい。
    parent.add(bg);
    return bg;
  }

  /* ---- 树冠穹顶（不规则扁圆：Perlin 扰动轮廓）→ 分枝端点をこの殻上に誘導 ---- */
  const cyTop = H * 0.975;                              // 花冠頂（仕様高さに一致）
  const cyBase = trunkTop * 1.04 + (H - trunkTop) * 0.28; // 冠下面（人が通行できる裾）
  const cyMid = (cyBase + cyTop) / 2;
  const ryHalf = (cyTop - cyBase) * 0.5;
  const ellX = W * 0.56;
  const ellZ = ellX * range(rnd, 0.86, 0.97);
  const outline = (az, u) => {
    const cx = Math.cos(az), cz = Math.sin(az);
    const nb = noise.fbm(cx * 1.55, u * 1.9 + 3.3, cz * 1.55, 3);
    const nb2 = noise.fbm(cx * 3.4 + 9, u * 2.6, cz * 3.4 - 4, 2);
    const raw = (0.9 + 0.2 * nb + 0.09 * nb2) * (1 + 0.1 * Math.sin(az * 3 + ridgePh) * (1 - u * 0.6));
    return clamp(0.76 + 0.36 * ((raw - 0.55) / 0.65), 0.66, 1.12);   // 不規則だが仕様幅を中心に
  };
  /** 楕円断面の極径 */
  const ellR = (az) => 1 / Math.sqrt((Math.cos(az) * Math.cos(az)) / (ellX * ellX) + (Math.sin(az) * Math.sin(az)) / (ellZ * ellZ));
  /** 殻上の点：u=0 冠下面 → 1 冠頂（扁穹：頂に近づくほど半径が縮むが潰れて広い） */
  const domeAt = (az, u, k = 1) => {
    const uu = clamp(u, 0, 1);
    const sy = uu * 2 - 1;
    const ds = Math.sqrt(clamp(1 - sy * sy * 0.8, 0.12, 1));
    const y = cyMid + ryHalf * sy * (sy >= 0 ? 1 : 0.68) + noise.n3(Math.cos(az) * 2, uu * 3.1, Math.sin(az) * 2) * 0.12;
    const rr = ellR(az) * outline(az, uu) * ds * k;
    return [Math.cos(az) * rr, y, Math.sin(az) * rr];
  };

  /* ---- 三级分枝（枝組の原点＝枝根、sway の枢軸） ---- */
  const anchors = [];   // {grp, ow:[x,y,z]}  ow = 該組原点（ツローカル＝ワールド）
  const LENK = 0.66;    // 主枝長 = 目標距離 × LENK（亜枝・小枝を含めた連鎖先端が殻上に付く）

  function limb(parent, depth, originLocal, owParent, elev, azim, len, r0, r1) {
    const g = grp(depth === 0 ? 'branch-1' : depth === 1 ? 'branch-2' : 'branch-3', { pos: originLocal });
    // 最末端（depth 2）不单独设揺れノード：実測でこの一本が 1144〜707 の draw call を消費し、
    // その大半が「揺れサブツリーごとに实例を分ける」制約由来だった（描画提出 8.3 µs/call）。
    // 主枝・亜枝が揺れれば房はそれに乗って動くので、風の表情は残る。
    if (depth < 2) g.userData.sway = {
      amp: depth === 0 ? range(rnd, 0.014, 0.022) : range(rnd, 0.021, 0.033),
      freq: depth === 0 ? range(rnd, 0.34, 0.5) : range(rnd, 0.52, 0.78),
      phase: rnd() * TAU,
      axis: 'both',
      lean: range(rnd, 0.25, 0.6),
    };
    const droop = ST.droop * (depth === 2 ? 1.5 : 1);
    const SEG = depth === 0 ? 8 : depth === 1 ? 6 : 4;
    const pts = [[0, 0, 0]];
    let x = 0, y = 0, z = 0;
    const azJit = range(rnd, -0.17, 0.17);
    for (let i = 1; i <= SEG; i++) {
      const t = i / SEG;
      const e = elev + 0.2 * Math.sin(t * 2.0) - droop * 0.42 * Math.pow(t, 2.6);
      const a = azim + azJit * Math.pow(t, 1.25) + 0.05 * Math.sin(t * 4.7);
      const dl = len / SEG;
      x += Math.cos(a) * Math.cos(e) * dl;
      z += Math.sin(a) * Math.cos(e) * dl;
      y += Math.sin(e) * dl;
      const wig = 0.055 * dl;
      pts.push([x + range(rnd, -wig, wig), y + range(rnd, -wig * 0.5, wig * 0.7), z + range(rnd, -wig, wig)]);
    }
    /* 枝杈接合部の膨大 */
    const collar = mesh(sph(q(r0 * 1.66), depth === 0 ? 12 : 8, depth === 0 ? 8 : 6), depth === 0 ? MAT_BARK_OLD : MAT_BARK, { name: 'collar' });
    collar.position.set(-pts[1][0] * 0.1, -r0 * 0.18, -pts[1][2] * 0.1);
    collar.scale.set(1, 0.74, 1);
    g.add(collar);
    g.add(mesh(limbGeo(pts, r0, r1, {
      seg: depth === 0 ? 30 : depth === 1 ? 20 : 12,
      radial: depth === 0 ? 10 : 8,
      taper: depth === 0 ? 1.0 : 1.25,
      wob: depth === 0 ? 0.06 : 0.1,
      vSpan: depth === 2 ? 0.22 : 0.44,
    }), depth === 0 ? MAT_BARK_OLD : MAT_BARK, { name: depth === 2 ? 'twig' : 'limb' }));

    const ow = [owParent[0] + originLocal[0], owParent[1] + originLocal[1], owParent[2] + originLocal[2]];
    const tip = pts[SEG];
    anchors.push({ grp: g, ow, w: 0.62, d: depth, tip: false, tLocal: [0, 0, 0] });
    anchors.push({ grp: g, ow: [ow[0] + tip[0], ow[1] + tip[1], ow[2] + tip[2]], w: 1.0, d: depth, tip: true, tLocal: tip });

    if (depth < 2) {
      const nChild = Math.round(range(rnd, depth === 0 ? 2 : 1.8, depth === 0 ? 3.2 : 2.9));
      for (let i = 0; i < nChild; i++) {
        const t = clamp(0.4 + (i / Math.max(1, nChild)) * 0.58, 0.2, 1);
        const idx = clamp(Math.round(t * SEG), 1, SEG);
        const p = pts[idx];
        const side = (i % 2 ? 1 : -1) * range(rnd, 0.26, 0.68);
        const childElev = clamp(elev - range(rnd, 0.0, 0.16) + (depth === 0 ? 0.05 : 0.1), 0.06, 1.32);
        const rMid = r0 + (r1 - r0) * t;
        limb(g, depth + 1, [p[0], p[1], p[2]], ow,
          childElev, azim + side, len * range(rnd, depth === 0 ? 0.4 : 0.44, depth === 0 ? 0.5 : 0.56),
          Math.max(0.004, rMid * 0.74), Math.max(0.002, rMid * 0.2));
      }
      if (depth === 0) {
        // 枝先の直立梢（花云の頂をつくる）
        const p = pts[SEG];
        limb(g, 1, [p[0], p[1], p[2]], ow,
          clamp(elev + range(rnd, 0.12, 0.34), 0.4, 1.36), azim + range(rnd, -0.35, 0.35),
          len * range(rnd, 0.44, 0.56), Math.max(0.006, r1 * 1.6), Math.max(0.002, r1 * 0.38));
      }
    }
    parent.add(g);
    return g;
  }

  /** 殻上の目標点へ向かって枝を伸ばす（＝枝端が必ず樹冠面に乗る） */
  function limbTo(start, P, depth, r0, r1, lenK = LENK) {
    const d = [P[0] - start[0], P[1] - start[1], P[2] - start[2]];
    const D = Math.max(0.14, Math.hypot(d[0], d[1], d[2]));
    return limb(S, depth, start, [0, 0, 0], Math.asin(clamp(d[1] / D, -0.85, 0.94)), Math.atan2(d[2], d[0]),
      D * lenK, r0, r1);
  }

  /* 主幹続梢（頂へ向かう強い直立梢） */
  {
    const o = axisAt(trunkTop * 0.76);
    const start = [o.x, trunkTop * 0.82, o.z];
    const az = rnd() * TAU;
    limbTo(start, [Math.cos(az) * ellX * 0.18, cyTop * 0.99, Math.sin(az) * ellZ * 0.18], 0,
      Math.max(0.012, o.r * 0.92), 0.022 * girth, 0.7);
  }
  /* 主枝 4~6 本：各々を樹冠殻上の別々的点へ誘導 */
  for (let i = 0; i < nPrim; i++) {
    const az = (i / nPrim) * TAU + range(rnd, -0.4, 0.4);
    const u = clamp(range(rnd, ST.uRange[0], ST.uRange[1]) * (i % 2 ? 0.9 : 1.06), 0.05, 1);
    const y = trunkTop * clamp(0.55 + (i / nPrim) * 0.46, 0.5, 1.0);
    const o = axisAt(y);
    const start = [o.x + Math.cos(az) * o.r * 0.92, y, o.z + Math.sin(az) * o.r * 0.92];
    limbTo(start, domeAt(az + range(rnd, -0.25, 0.25), u), 0,
      Math.max(0.008, o.r * 0.55), 0.015 * girth);
  }
  /* 下層枝（冠下面をわずかに埋める低所枝） */
  for (let i = 0; i < 2; i++) {
    const az = rnd() * TAU;
    const y = trunkTop * range(rnd, 0.62, 0.95);
    const o = axisAt(y);
    const start = [o.x + Math.cos(az) * o.r * 0.92, y, o.z + Math.sin(az) * o.r * 0.92];
    limbTo(start, domeAt(az, range(rnd, 0.02, 0.2), 0.78), 0, Math.max(0.006, o.r * 0.34), 0.012 * girth, 0.72);
  }

  /* ---- 下垂小枝（花束を吊る枝、小枝先端のみから）：数量は予算内に数える ---- */
  const hangList = [];
  {
    const tips = anchors.filter((a) => a.tip && a.d >= 1);
    const nHang = clamp(Math.round(2 + 3 * age), 2, 6);
    for (let i = 0; i < nHang && tips.length; i++) {
      const an = tips[Math.min(tips.length - 1, Math.floor(rnd() * tips.length))];
      const a = rnd() * TAU;
      const L = range(rnd, 0.26, 0.52);
      const g = grp('hanging-branch', {
        pos: [an.tLocal[0] + range(rnd, -0.06, 0.06), an.tLocal[1] + range(rnd, -0.03, 0.03), an.tLocal[2] + range(rnd, -0.06, 0.06)],
      });
      g.userData.sway = { amp: range(rnd, 0.04, 0.07), freq: range(rnd, 1.1, 1.7), phase: rnd() * TAU, axis: 'both', lean: 0.95 };
      const pts = catenary([0, 0, 0], [Math.cos(a) * L * 0.42, -L, Math.sin(a) * L * 0.42], L * 0.26, 6)
        .map((v) => [v.x, v.y, v.z]);
      g.add(mesh(tubeOf(pts, Math.max(0.0035, 0.011 * girth), 8, 6), MAT_BARK, { name: 'hang-limb' }));
      an.grp.add(g);
      hangList.push({ g, pts, anchor: an });
    }
  }

  /* ---- 花団：まず下垂枝の先に長梗の房、残りは穹頂殻上→最近枝組へ挂靠 ---- */
  for (const hb of hangList) {
    const p = hb.pts[hb.pts.length - 1];
    const wpt = [hb.anchor.ow[0] + hb.g.position.x + p[0], hb.anchor.ow[1] + hb.g.position.y + p[1], hb.anchor.ow[2] + hb.g.position.z + p[2]];
    const u = clamp((wpt[1] - cyBase) / Math.max(0.001, cyTop - cyBase), 0, 1);
    const az = Math.atan2(wpt[2], wpt[0]);
    const dep = clamp(Math.hypot(wpt[0], wpt[2]) / (ellR(az) * outline(az, u)), 0, 1.4);
    blossom(hb.g, p, range(rnd, 0.11, 0.16) * clamp(W / 5.2, 0.7, 1.1), dep > 0.85 ? 1 : 2,
      { loose: true, pedicel: range(rnd, 0.05, 0.09), clusterCard: true });
  }

  let guard = 0;
  while (spent.n < budget - 4 && guard++ < budget * 90) {
    const az = rnd() * TAU;
    const u = clamp(Math.pow(rnd(), 0.58), 0.05, 1);              // 上密下疏
    if (u < 0.3 && rnd() > 0.3 + u * 2.1) continue;               // 冠下面は疎に
    const dep = 0.5 + 0.5 * Math.pow(rnd(), 0.4);                 // 殻の厚み（外寄り密）
    const P = domeAt(az, u, dep);
    const [px, y, pz] = P;
    let best = null, bd = 1e9;
    for (const an of anchors) {
      const dx = an.ow[0] - px, dy = an.ow[1] - y, dz = an.ow[2] - pz;
      const d2 = (dx * dx + dy * dy + dz * dz) / (an.w * an.w);
      if (d2 < bd) { bd = d2; best = an; }
    }
    if (!best || bd > 2.4) continue;                              // 枝から遠い所には置かない
    const tier = dep > 0.88 ? 0 : dep > 0.7 ? 1 : 2;
    const rBase = range(rnd, 0.175, 0.33) * clamp(W / 5.2, 0.66, 1.18) * (tier === 0 ? 1.06 : tier === 1 ? 0.99 : 0.9);
    blossom(best.grp, [px - best.ow[0], y - best.ow[1], pz - best.ow[2]], rBase, tier,
      { loose: dep > 0.72, pedicel: dep > 0.6 ? range(rnd, 0.03, 0.06) : 0 });
  }

  /* 冠頂の稜：最も高い枝先には必ず花団を乗せる（頂上が疎に見えるのを防ぐ） */
  {
    const high = anchors
      .map((a, i) => ({ a, i }))
      .filter((o) => o.a.tip)
      .sort((p, r) => (r.a.ow[1] - p.a.ow[1]) || (p.i - r.i))
      .slice(0, 8);
    const usedGrps = new Set();
    let n = 0;
    for (const { a } of high) {
      if (n >= 4 || spent.n >= budget) break;
      if (usedGrps.has(a.grp)) continue;
      usedGrps.add(a.grp);
      blossom(a.grp, [a.tLocal[0] + range(rnd, -0.04, 0.04), a.tLocal[1] + range(rnd, -0.02, 0.05), a.tLocal[2] + range(rnd, -0.04, 0.04)],
        range(rnd, 0.17, 0.26) * clamp(W / 5.2, 0.72, 1.1), 0,
        { loose: true, pedicel: range(rnd, 0.028, 0.05) });
      n++;
    }
  }

  /* ---- 冠下接地影 ---- */
  shadowBlob(S, { r: moundR * 1.2, pos: [0, 0, 0], opacity: 0.24, color: '#3a2f36' });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + rnd();
    const rr = W * range(rnd, 0.16, 0.4);
    shadowBlob(S, {
      r: range(rnd, 0.5, 1.05) * clamp(W / 5.2, 0.6, 1.1),
      pos: [Math.cos(a) * rr, 0.001, Math.sin(a) * rr], opacity: range(rnd, 0.09, 0.16), color: '#4a3f46',
    });
  }
  /* 树冠下に漂う一弁（接地感・奥行き） */
  S.add(inst(sakuraPetalGeo(0.03, 0.026, 0.6), MAT_P_SOLID, 14, (i, d, r2, col) => {
    const a = r2() * TAU;
    const rr = W * (0.12 + r2() * 0.3);
    d.position.set(Math.cos(a) * rr, cyBase + r2() * (cyTop - cyBase) * 0.9, Math.sin(a) * rr * 0.9);
    d.rotation.set(r2() * TAU, r2() * TAU, r2() * TAU);
    d.scale.setScalar(range(r2, 0.7, 1.15));
    col.setHSL(0.935 + r2() * 0.04, 0.36 + r2() * 0.2, 0.66 + r2() * 0.2);
  }, { name: 'air-petals', cast: false }));

  /* 基部の落葉・土塊（近景密度） */
  for (let i = 0; i < 6; i++) {
    const a = rnd() * TAU, rr = moundR * range(rnd, 0.65, 1.5);
    const st = mesh(sph(q(range(rnd, 0.013, 0.028)), 7, 5),
      i % 2 ? MAT.stone({ color: PAL.dirt }) : MAT.stone({ color: PAL.concreteDark }),
      { name: 'pebble', pos: [Math.cos(a) * rr, 0.016, Math.sin(a) * rr] });
    st.scale.set(1, range(rnd, 0.4, 0.7), range(rnd, 0.8, 1.2));
    S.add(st);
  }

  return finish(S, { outline: 'thin' });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
