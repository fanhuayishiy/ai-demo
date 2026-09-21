import { g as grp, n as range, T as TEX, M as MAT, P as PAL, m as mesh, a as sph, w as weather, r as rbox, o as lathe, a0 as IS_FLAT, E as inst, a3 as tuftGeo, I as sakuraPetalRestGeo, l as catenary, k as tubeOf, p as shadowBlob, a1 as sakuraPetalGeo, q as finish, N as makeCanvas, Q as toTexture, a4 as RepeatWrapping, C as CatmullRomCurve3, V as Vector3, B as BufferGeometry, F as Float32BufferAttribute, z as rand, u as Matrix4, a2 as sakuraLeafGeo, x as PlaneGeometry } from './index-CSUFndW_.js';

//  assets/flora/sakura-late-yaezeni.js —— 晚樱・八重红枝垂混風（Prunus lannesiana）
//  特徴：花色が濃い（PAL.yaePetal / yaePetalDeep）／花団が丸く密（二重瓣＝二層カード）／
//        長い花梗に数珠で下がる房／新葉が多い（PAL.leafYoung）／花期が遅いので冠が「実」／
//        幹が老木（瘤節・苔痕・空洞落枝痕を増量）／小枝は枝垂れ気味に下垂
//  単位米；原点 = 树干与地面接触点；+Y 上；正面 +Z；同一 options 結果は完全に決定論的

const meta = {
  id: 'sakura-late-yaezeni',
  real: [4.2, 4.6, 4.2],
  origin: 'ground-center',
};

const DEFAULT_OPTIONS = { seed: 53, height: 4.6, spread: 4.2 };

/* ============================== 工具（この文件内で完結） ============================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const q = (v) => Math.round(v * 400) / 400;
const ZAX = new Vector3(0, 0, 1);

function faceOut(o, nx, ny, nz) {
  const v = new Vector3(nx, ny, nz);
  if (v.lengthSq() < 1e-9) v.set(0, 0, 1);
  o.quaternion.setFromUnitVectors(ZAX, v.normalize());
  return o;
}
/** 丸みのある八重花瓣カード（卷き強め） */
function petalCardRaw(w, h, curl) {
  const g = new PlaneGeometry(w, h, 4, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const nx = x / (w / 2), ny = y / (h / 2);
    p.setZ(i, -(nx * nx) * curl * h * 0.5 + ny * ny * curl * h * 0.16 - Math.abs(ny) * curl * h * 0.08);
  }
  g.computeVertexNormals();
  return g;
}
/** 葉カード（細長・先尖） */
function leafCardRaw(w, h, curl) {
  const g = new PlaneGeometry(w, h, 3, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const nx = x / (w / 2), ny = y / (h / 2);
    p.setZ(i, -nx * nx * curl * h * 0.4 + ny * ny * curl * h * 0.1);
  }
  g.computeVertexNormals();
  return g;
}
/**
 * カード几何の共有キャッシュ。
 * 従来は花房ごとに新しい PlaneGeometry を作っていたため、同じ素材・同じ形の葉が
 * 何百枚も「別几何」として扱い分けられ、inst() が花房ごとに 1 draw call になっていた
 * （この一本の木だけで 2787 コール）。寸法を 10 mm、巻きを 0.2 単位に丸めて共有すると
 * 数十種に落ち、実体差は instance 側の scale（±20% 連続）がそのまま担うので見た目は不変。
 */
const CARD_STEP = 0.01, CURL_STEP = 0.2;
const cardCache = new Map();
function cardGeo(raw, w, h, curl) {
  const qw = Math.max(CARD_STEP, Math.round(w / CARD_STEP) * CARD_STEP);
  const qh = Math.max(CARD_STEP, Math.round(h / CARD_STEP) * CARD_STEP);
  const qc = Math.round(curl / CURL_STEP) * CURL_STEP;
  // 平涂模式は card を几何輪郭に切り替えるので、これらの alpha 貼图は一度もサンプリングされない
  // FILL：実形の面積は bbox の約 45%／55%。そのまま差し替えると花冠が透けるので一弁を拡大する。
  if (IS_FLAT) {
    const isP = raw === petalCardRaw, f = isP ? 1.35 : 1.25;
    return isP ? sakuraPetalGeo(qw * f, qh * f, qc) : sakuraLeafGeo(qw * f, qh * f, qc);
  }
  const key = (raw === petalCardRaw ? 'p' : 'l') + qw.toFixed(3) + 'x' + qh.toFixed(3) + '@' + qc.toFixed(2);
  let g = cardCache.get(key);
  if (!g) { g = raw(qw, qh, qc); cardCache.set(key, g); }
  return g;
}
const petalCard = (w, h, curl) => cardGeo(petalCardRaw, w, h, curl);
const leafCard = (w, h, curl) => cardGeo(leafCardRaw, w, h, curl);
/** 花梗の単位形状：長さ 1 cm・太さ 0.5 mm 単位で共有（傾きはインスタンスの回転+縮で出す） */
const stalkCache = new Map();
function cachedStalk(L, r) {
  const qL = Math.max(0.01, Math.round(L / 0.01) * 0.01);
  const qR = Math.max(0.0005, Math.round(r / 0.0005) * 0.0005);
  const key = 's' + qL.toFixed(2) + 'r' + qR.toFixed(4);
  let g = stalkCache.get(key);
  if (!g) {
    const pts = catenary([0, 0, 0], [0.3 * qL, -qL, 0], qL * 0.22, 5).map((v) => [v.x, v.y, v.z]);
    g = tubeOf(pts, qR, 6, 5);
    stalkCache.set(key, g);
  }
  return g;
}
/** 锥形曲线枝干 */
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
  const push = (x, y, z, nx, ny, nz, u, v) => { pos.push(x, y, z); nor.push(nx, ny, nz); uvs.push(u, v); };
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
/** 老木化的樱树皮：皮孔が太く縦裂が深い */
function lenticelTexture(seed, dense = 1) {
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
  for (let i = 0; i < Math.round(250 * dense); i++) {
    const x = r() * w, y = r() * h;
    const len = 10 + r() * 74, th = 1.1 + r() * 3.4;
    const dark = r() > 0.3;
    const col = dark ? '#2a211c' : '#c7ab96';
    const al = dark ? 0.3 + r() * 0.36 : 0.16 + r() * 0.22;
    dash(x, y, len, th, col, al);
    if (y > h - 16) dash(x, y - h, len, th, col, al);
    if (y < 16) dash(x, y + h, len, th, col, al);
  }
  for (let i = 0; i < Math.round(22 * dense); i++) {
    const x = r() * w, y = r() * h, rr = 4 + r() * 11;
    g.globalAlpha = 0.34;
    g.fillStyle = '#332722';
    g.beginPath(); g.ellipse(x, y, rr * 1.7, rr, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.22;
    g.fillStyle = '#cbb39c';
    g.beginPath(); g.ellipse(x - rr * 0.3, y - rr * 0.4, rr * 0.95, rr * 0.5, 0, 0, TAU); g.fill();
  }
  // 縦裂溝（老木）
  for (let i = 0; i < Math.round(16 * dense); i++) {
    const x = r() * w, y = r() * h, l = 40 + r() * 190;
    g.globalAlpha = 0.18 + r() * 0.2;
    g.strokeStyle = '#2a211c';
    g.lineWidth = 1.4 + r() * 4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 18, y + l); g.stroke();
  }
  g.globalAlpha = 1;
  const t = toTexture(cv, { repeat: 1 });
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/* ============================== 建模 ============================== */
function build(options = {}) {
  const seed = options.seed ?? 53;
  const height = options.height ?? 4.6;
  const spread = options.spread ?? 4.2;
  const age = clamp(options.age ?? 1.15, 0.2, 1.8);
  const weep = clamp(options.weep ?? 1.0, 0, 1.8);
  const lean = options.lean ?? 0;

  const rnd = rand(seed);
  const noise = makeNoise(rand(seed * 3 + 29));
  const S = grp('sakura-late-yaezeni');

  const H = height;
  const W = spread;
  const girth = Math.pow(age, 0.6) * Math.pow(H / 4.6, 0.55);
  const trunkTop = clamp(H * 0.42, 1.2, 2.4);
  const nPrim = clamp(Math.round(range(rand(seed + 71), 4.6, 5.8)), 4, 6);

  /* ---- 老木树干：より短い裾・太い瘤 ---- */
  const PROF = [
    [0.264, 0.0], [0.252, 0.04], [0.236, 0.11], [0.219, 0.24], [0.206, 0.42],
    [0.196, 0.64], [0.187, 0.92], [0.18, 1.24], [0.174, 1.58], [0.168, 1.96],
    [0.162, 2.4], [0.15, 2.72], [0.134, 3.0], [0.114, 3.32], [0.094, 3.62], [0.076, 3.9],
  ];
  const radiusAt = (y) => {
    const yy = clamp(y, 0, 3.9);
    let i = 0;
    while (i < PROF.length - 2 && PROF[i + 1][1] < yy) i++;
    const [r0, y0] = PROF[i], [r1, y1] = PROF[i + 1];
    const t = y1 > y0 ? clamp((yy - y0) / (y1 - y0), 0, 1) : 0;
    return r0 + (r1 - r0) * t;
  };
  const leanAz = range(rnd, 0, TAU);
  const leanK = lean * H * 0.44;
  const axisAt = (y) => {
    const t = clamp(y / trunkTop, 0, 1);
    const s = t * t * (3 - 2 * t);
    return {
      x: Math.cos(leanAz) * leanK * s + noise.n3(2.1, y * 0.7, 5.4) * 0.09 * girth,
      z: Math.sin(leanAz) * leanK * s + noise.n3(6.5, y * 0.7, 1.8) * 0.09 * girth,
      r: radiusAt(y) * girth,
    };
  };
  const ridgeN = clamp(Math.round(range(rnd, 5, 7)), 4, 7);
  const ridgePh = rnd() * TAU;
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
      const fy = clamp(1 - y / (trunkTop * 0.6), 0, 1);
      const ridge = Math.pow(Math.max(0, Math.cos(a * ridgeN + ridgePh)), 2.6) * fy * fy;
      const deep = 0.09 * noise.n3(Math.cos(a) * 2.2, y * 2.6, Math.sin(a) * 2.2);
      r = r * (1 + deep + 0.2 * ridge) + inflate;
      const o = axisAt(y);
      pa.setXYZ(i, o.x + Math.cos(a) * r, y, o.z + Math.sin(a) * r);
      ua.setXY(i, ua.getX(i) * 1.7, y / 0.52);
    }
    g.computeVertexNormals();
    return g;
  }

  const barkTex = TEX.bark({ base: '#5e4636', seed: seed + 2 });
  const MAT_BARK = MAT.bark({
    seed: seed + 2, contrast: 1.06, tint: '#f0ded8',
    map: barkTex.map, normalMap: barkTex.normalMap,
  });
  const MAT_BARK_OLD = MAT.bark({
    seed: seed + 2, contrast: 1.14, tint: '#ded0cc', normalScaleX: 2.0, normalScaleY: 2.0,
    map: TEX.bark({ base: '#513c2f', seed: seed + 8 }).map,
    normalMap: TEX.bark({ base: '#513c2f', seed: seed + 8 }).normalMap,
  });
  const MAT_WOOD = MAT.wood({ light: '#d9b48a', dark: '#a37a52', knots: 1 });
  const MAT_WOOD_DARK = MAT.wood({ light: '#8b6c4c', dark: '#463322' });
  const MAT_SCAR = MAT.paint(PAL.trunkDark, { spec: 0.05, steps: 2, shadowAmt: 1 });

  S.add(mesh(trunkShell(0), MAT_BARK, { name: 'trunk' }));
  const lenticel = lenticelTexture(seed, 1.25);
  if (lenticel) {
    const sleeve = mesh(trunkShell(Math.max(0.005, trunkTop * 0.009)), MAT.paint('#ffffff', {
      map: lenticel, transparent: true, opacity: 0.92, depthWrite: false,
      spec: 0.05, sheen: 0, steps: 4, shadowAmt: 0.92, shadowTint: '#7d6a72', rim: 0.08, dither: 0.006,
    }), { name: 'trunk-lenticels', cast: false, receive: false });
    sleeve.userData.noOutline = true;
    S.add(sleeve);
  }

  /* ---- 板根（老木：より太く数多く） ---- */
  const nRoot = clamp(Math.round(range(rnd, 5.4, 7.2)), 5, 8);
  const rootR0 = radiusAt(0.3) * girth;
  for (let i = 0; i < nRoot; i++) {
    const a = (i / nRoot) * TAU + range(rnd, -0.36, 0.36) + ridgePh * 0.2;
    const o = axisAt(trunkTop * 0.1);
    const L = range(rnd, 0.32, 0.62) * (0.7 + 0.5 * girth);
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const rad = o.r * (1 - 0.16 * t) + L * t * 0.95;
      pts.push([o.x * (1 - t) + Math.cos(a) * rad, trunkTop * 0.15 * (1 - t * t) + 0.014, o.z * (1 - t) + Math.sin(a) * rad]);
    }
    S.add(mesh(limbGeo(pts, rootR0 * range(rnd, 0.46, 0.68), 0.004, {
      seg: 22, radial: 8, taper: 1.4, flat: 0.44, wob: 0.13, vSpan: 0.32,
    }), MAT_BARK_OLD, { name: 'root-flare' }));
  }

  /* ---- 瘤节・空洞・苔痕（老木の証） ---- */
  const nBurl = clamp(Math.round(range(rnd, 4, 6) + age * 3), 4, 10);
  for (let i = 0; i < nBurl; i++) {
    const y = range(rnd, 0.22, trunkTop * 0.94);
    const a = rnd() * TAU;
    const o = axisAt(y);
    const s = range(rnd, 0.03, 0.075) * (0.7 + 0.6 * girth);
    const nx = Math.cos(a), nz = Math.sin(a);
    const b = mesh(sph(q(s), 12, 8), MAT_BARK_OLD, { name: 'burl', pos: [o.x + nx * (o.r - s * 0.2), y, o.z + nz * (o.r - s * 0.2)] });
    faceOut(b, nx, range(rnd, -0.3, 0.4), nz);
    b.rotateX(Math.PI / 2);
    b.scale.set(1.35, 1, range(rnd, 0.55, 0.95));
    S.add(b);
    weather(b, { w: s * 2.2, h: s * 1.8, kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 200 + i, density: 1.3, count: 1, spread: 0.003 });
  }
  /* 空洞の落枝痕（老木特有：黒い穴 + 膨隆縁） */
  for (let i = 0; i < clamp(Math.round(range(rnd, 3, 5)), 2, 6); i++) {
    const y = range(rnd, 0.45, trunkTop * 0.95);
    const a = rnd() * TAU;
    const o = axisAt(y);
    const nx = Math.cos(a), nz = Math.sin(a);
    const kg = grp('cavity-scar', { pos: [o.x + nx * o.r, y, o.z + nz * o.r] });
    faceOut(kg, nx, range(rnd, -0.2, 0.2), nz);
    kg.rotateZ(rnd() * TAU);
    const s = range(rnd, 0.02, 0.042) * (0.8 + 0.5 * girth);
    kg.add(mesh(sph(q(s), 10, 7), MAT_SCAR, { name: 'cavity-hole', pos: [0, 0, s * 0.1], scale: [1.6, 1.1, 0.4] }));
    kg.add(mesh(sph(q(s * 1.15), 10, 7), MAT_WOOD_DARK, { name: 'cavity-rot', pos: [0, 0, -s * 0.12], scale: [1.9, 1.35, 0.42] }));
    kg.add(mesh(sph(q(s * 1.5), 12, 8), MAT_BARK_OLD, { name: 'cavity-lip', pos: [0, -s * 0.2, -s * 0.4], scale: [1.1, 1.0, 0.36] }));
    S.add(kg);
  }
  /* 幹傷（広い剥離面） */
  {
    const wy = range(rnd, 0.6, 1.3);
    const wa = rnd() * TAU;
    const o = axisAt(wy);
    const nx = Math.cos(wa), nz = Math.sin(wa);
    const wg = grp('wound', { pos: [o.x + nx * (o.r - 0.003), wy, o.z + nz * (o.r - 0.003)] });
    faceOut(wg, nx, 0.08, nz);
    wg.rotateZ(range(rnd, -0.42, 0.42));
    const w = 0.072 * (0.7 + 0.6 * girth), hh = 0.2 * (0.7 + 0.6 * girth);
    wg.add(mesh(rbox(w * 1.42, hh * 1.22, 0.022, 0.02, 2), MAT_WOOD_DARK, { name: 'wound-recess', pos: [0, 0, 0.002] }));
    wg.add(mesh(rbox(w, hh, 0.028, 0.015, 2), MAT_WOOD, { name: 'wound-wood', pos: [w * 0.1, hh * 0.1, 0.011] }));
    wg.add(mesh(rbox(w * 0.4, hh * 0.55, 0.016, 0.006, 2), MAT_SCAR, { name: 'wound-core', pos: [w * 0.24, -hh * 0.22, 0.021] }));
    for (let i = 0; i < 7; i++) {
      const a = -0.68 + (i / 6) * 1.36;
      const c = mesh(sph(q(0.013), 8, 6), MAT_BARK_OLD, { name: 'callus', pos: [Math.sin(a) * w * 1.34, Math.cos(a) * hh * 1.2, 0.013] });
      c.scale.set(1, 0.6, 0.5);
      wg.add(c);
    }
    S.add(wg);
    const sc = grp('sap-streak', { pos: [o.x + nx * (o.r * 1.16 + 0.001), wy + hh, o.z + nz * (o.r * 1.16 + 0.001)] });
    faceOut(sc, nx, 0.05, nz);
    weather(sc, { w: 0.06, h: 0.3, rot: [0, 0, range(rnd, -0.2, 0.2)], kind: 'dirt', color: '#33241d', opacity: 0.46, seed: seed + 44, density: 1.6, count: 3, spread: 0.004 });
    S.add(sc);
  }
  /* 苔痕（北面中心に広く・多く） */
  const mossAz = leanAz + Math.PI * 0.6;
  for (let i = 0; i < 7; i++) {
    const a = mossAz + range(rnd, -1.1, 1.1);
    const y = range(rnd, 0.16, trunkTop * 0.72);
    const o = axisAt(y);
    const nx = Math.cos(a), nz = Math.sin(a);
    const g = grp('trunk-moss', { pos: [o.x + nx * (o.r * 1.16 + 0.003), y, o.z + nz * (o.r * 1.16 + 0.003)] });
    faceOut(g, nx, 0.06, nz);
    weather(g, { w: 0.16, h: 0.24, rot: [0, 0, rnd() * 2], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 30 + i, density: 1.4, count: 2, spread: 0.004 });
    S.add(g);
  }
  for (let i = 0; i < 4; i++) {
    const a = rnd() * TAU, y = range(rnd, 0.8, trunkTop * 0.92);
    const o = axisAt(y);
    const nx = Math.cos(a), nz = Math.sin(a);
    const g = grp('lichen', { pos: [o.x + nx * (o.r * 1.16 + 0.002), y, o.z + nz * (o.r * 1.16 + 0.002)] });
    faceOut(g, nx, 0.04, nz);
    weather(g, { w: 0.1, h: 0.08, kind: 'chip', color: '#bfc0aa', opacity: 0.32, seed: seed + 88 + i, density: 1.5, count: 2, spread: 0.003 });
    S.add(g);
  }

  /* ---- 基部：土留め円形盛土（苔付） ---- */
  const moundR = clamp(0.62 + 0.58 * girth, 0.5, 1.25);
  const moundH = 0.115 * (0.85 + 0.35 * girth);
  const MOUND = [[0, 1.0], [0.3, 0.93], [0.55, 0.8], [0.76, 0.58], [0.9, 0.32], [0.97, 0.1], [1, 0]];
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
    map: soilTex.map, normalMap: soilTex.normalMap, normalScaleX: 1.2, normalScaleY: 1.2,
    spec: 0.03, sheen: 0, steps: 4, shadowAmt: 0.98, rim: 0.08, uv: { repeat: [2.2, 2.2] },
  }), { name: 'root-mound' });
  S.add(soil);
  const curbTex = TEX.concrete({ base: PAL.curb, repeat: 3, cracked: true });
  const curb = mesh(lathe(
    [[0.985, 0], [1.0, 0.026], [1.0, 0.104], [0.972, 0.126], [0.942, 0.124], [0.95, 0.056], [0.926, 0]].map(([r, y]) => [r * moundR, y * (0.92 + 0.26 * girth)]), 30),
  MAT.paint('#ffffff', { map: curbTex.map, normalMap: curbTex.normalMap, spec: 0.09, steps: 3, shadowAmt: 0.88, uv: { repeat: [3, 1] } }),
  { name: 'kerb-ring' });
  S.add(curb);
  weather(soil, { w: moundR * 0.95, h: moundR * 0.8, pos: [-moundR * 0.18, moundH * 0.92, -moundR * 0.1], rot: [-Math.PI / 2, 0, 0.3], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 14, density: 1.4, count: 3, spread: 0.005 });
  weather(soil, { w: moundR * 0.66, h: moundR * 0.55, pos: [moundR * 0.3, moundH * 0.86, moundR * 0.3], rot: [-Math.PI / 2, 0, 1.4], kind: 'moss', color: PAL.moss, opacity: 0.46, seed: seed + 15, density: 1.2, count: 2, spread: 0.004 });
  weather(curb, { w: moundR * 0.62, h: 0.12, pos: [moundR * 0.2, 0.07, moundR * 0.99], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 16, density: 1.5, count: 3, spread: 0.012 });
  weather(soil, { w: moundR * 1.1, h: moundR * 1.0, pos: [0, moundH * 0.6, 0], rot: [-Math.PI / 2, 0, 0.7], kind: 'dirt', color: '#6a5a48', opacity: 0.26, seed: seed + 91, density: 1.0, count: 2, spread: 0.004 });

  /* ---- 花材：濃い八重红 + 新叶 ---- */
  const leafTexYoung = IS_FLAT ? null : TEX.leafCluster({ base: PAL.leafYoung, seed: seed + 5 });
  const leafTexMid = IS_FLAT ? null : TEX.leafCluster({ base: PAL.leaf, seed: seed + 7 });
  // 苔むらは立体の葉（tuftGeo）で形を持つ → 貼图の alpha 抜きは要らない
  const MAT_MOSS = MAT.leaf({ color: '#e6f0d6', alphaTest: 0, rim: 0.26 });
  // 平涂模式は card を几何輪郭に切り替えるので、これらの alpha 貼图は一度もサンプリングされない
  const yTex = IS_FLAT ? [null, null] : [TEX.petal({ tone: 1 }), TEX.petal({ tone: 2 })];
  const MAT_P = [
    MAT.petal({ map: yTex[0], color: PAL.yaePetal, tone: 1, glow: 0.26, rim: 0.62, rimPower: 1.55, alphaTest: 0.38, steps: 3, sat: 1.12, dither: 0.005 }),
    MAT.petal({ map: yTex[0], color: PAL.sakuraPetalDeep, tone: 1, glow: 0.16, rim: 0.48, alphaTest: 0.38, steps: 3, sat: 1.08, dither: 0.005 }),
    MAT.petal({ map: yTex[1], color: PAL.yaePetalDeep, tone: 2, glow: 0.07, rim: 0.34, alphaTest: 0.38, steps: 3, sat: 1.14, tint: IS_FLAT ? '#f6e6ec' : '#f0dce4', dither: 0.005 }),
    // 平涂で花弁が実形になると内層の濃さ（#b9a1ad）が枯れ色に見える → 明るい桜色に
    MAT.petal({ map: yTex[1], color: '#c8607f', tone: 2, glow: 0.0, rim: 0.18, alphaTest: 0.42, steps: 2, tint: IS_FLAT ? '#e7cdd9' : '#b9a1ad' }),
  ];
  const MAT_LEAF = MAT.leaf({ map: leafTexYoung, color: '#f6f8e8', alphaTest: 0.4, rim: 0.36 });
  const MAT_LEAF_MID = MAT.leaf({ map: leafTexMid, color: PAL.leafYoung, alphaTest: 0.42, rim: 0.24 });
  const MAT_PEDICEL = MAT.paint('#b4607a', { spec: 0.09, steps: 2, shadowAmt: 0.88, sheen: 0 });
  // 落花・漂花一弁用：輪郭は几何側（上の MAT_P は toon 側だけ貼图 alpha で抜くカード方式）
  const MAT_P_SOLID = MAT.petal({ color: PAL.yaePetal, tone: 1, glow: 0.06, rim: 0.36, alphaTest: 0, steps: 3, sat: 1.1, dither: 0.006 });

  /* 基部の苔・草・落花（濃い粉） */
  {
    const nG = clamp(Math.round(18 + 12 * age), 14, 34);
    S.add(inst(tuftGeo(0.12, 0.14, 5), MAT_MOSS, nG, (i, d, r2, col) => {
      const a = (i / nG) * TAU + r2() * 0.6;
      const k = 0.3 + r2() * 0.66;
      const rr = moundR * k;
      const s = range(r2, 0.55, 1.15);
      d.position.set(Math.cos(a) * rr, moundSurfY(k) + 0.002, Math.sin(a) * rr);
      d.rotation.set(0, r2() * TAU, 0);
      d.scale.set(s, s * range(r2, 1.0, 1.75), s);
      col.setHSL(0.24 + r2() * 0.09, 0.28 + r2() * 0.22, 0.72 + r2() * 0.18);
    }, { name: 'moss-tufts', cast: false, receive: true }));

    // 落花は sakuraPetalRestGeo() の実形（平涂で map が剥がれて四角紙になるのを防ぐ）
    const nP = clamp(Math.round(38 + 26 * age), 30, 68);
    S.add(inst(sakuraPetalRestGeo(0.038), MAT_P_SOLID, nP, (i, d, r2, col) => {
      const a = r2() * TAU;
      const k = 0.62 + Math.pow(r2(), 0.6) * 0.95;
      const rr = moundR * k;
      d.position.set(Math.cos(a) * rr, moundSurfY(k) + 0.004 + r2() * 0.007, Math.sin(a) * rr);
      d.rotation.set(range(r2, -0.12, 0.12), r2() * TAU, range(r2, -0.16, 0.16));
      d.scale.setScalar(range(r2, 0.8, 1.35));
      col.setHSL(0.93 + r2() * 0.04, 0.4 + r2() * 0.24, 0.6 + r2() * 0.22);
    }, { name: 'fallen-petals-ring', cast: false, receive: true }));
  }

  /* ---- 花房（八重＝二層の花弁 + 長花梗） ---- */
  let budget = clamp(Math.round((96 + 34 * age) * clamp(W / 4.2, 0.66, 1.3)), 70, 158);
  const spent = { n: 0 };

  /** 一層の花弁球 */
  function puff(host, rr0, nn, cwv, matv, pale, curl, spin0) {
    host.add(inst(petalCard(q(cwv), q(cwv * 0.95), curl), matv, nn, (i, d, ru, col) => {
      const k = (i + 0.35) / nn;
      const az = spin0 + i * 2.3999632 + range(ru, -0.2, 0.2);
      const sy = clamp(1 - k * 1.9, -0.9, 0.97);
      const hrr = Math.sqrt(Math.max(0.05, 1 - sy * sy));
      const pr = rr0 * range(ru, 0.58, 1.0);
      const dir = new Vector3(Math.cos(az) * hrr, sy * (sy > 0 ? 1 : 0.7), Math.sin(az) * hrr).normalize();
      d.position.set(dir.x * pr, dir.y * pr * 0.96, dir.z * pr);
      const tan = new Vector3(-dir.z, 0, dir.x);
      if (tan.lengthSq() < 1e-6) tan.set(1, 0, 0);
      tan.normalize();
      const ny = dir.clone().negate();
      const nz = new Vector3().crossVectors(tan, ny).normalize();
      d.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(tan, ny, nz));
      d.rotateX(range(ru, -0.7, 0.7));
      d.rotateY(range(ru, -0.55, 0.55));
      d.rotateZ(range(ru, -1, 1.0));
      const s = range(ru, 0.82, 1.24);
      d.scale.set(s, s * range(ru, 0.92, 1.16), 1);
      col.setHSL(0.928 + ru() * 0.045, 0.24 + ru() * 0.24, pale + ru() * (1 - pale));
    }, { name: 'petals', cast: true, receive: false }));
  }

  /** 花房：主球 + 副球 + 内層（八重の密な球）＋長梗で下垂 */
  function blossom(host, p, r, tier, opts = {}) {
    if (spent.n >= budget) return null;
    spent.n++;
    const bg = grp('blossom', { pos: [p[0], p[1], p[2]] });
    const cs = ((Math.round(p[0] * 397) + Math.round(p[1] * 941) + Math.round(p[2] * 1171) + seed * 6151) & 0x7fffffff) >>> 0;
    const cr = rand(cs);
    const spin = cr() * TAU;
    const pale = tier === 0 ? 0.88 : tier === 1 ? 0.78 : 0.62;
    /* 長花梗：数本の梗が房になって下がる（八重桜の特徴） */
    const nStalk = opts.noStalk ? 0 : Math.round(range(cr, 2, 4.4));
    const L = (opts.stalk ?? 0.085) * (0.8 + 0.5 * girth);
    const heads = [];
    // 梗は「同じ曲線を回して傾きをスケール」した形にする。従来は房ごとに
    // catenary → tubeOf で新しい TubeGeometry を作っており（この木で約 470 本＝470 draw call、
    // 細さ 3 mm の線 1 本に 8.3 µs の提出コストを払っていた）、単位形状を共有して
    // 回転+拡大縮で配置すれば autoInstance が 1 回にまとめられる。
    const stalkGeo = cachedStalk(L, 0.0035 * (0.8 + 0.4 * girth));
    for (let i = 0; i < nStalk; i++) {
      const a = (i / nStalk) * TAU + range(cr, -0.5, 0.5);
      const lean2 = range(cr, 0.25, 0.7);
      const tip = [Math.cos(a) * L * lean2, -L, Math.sin(a) * L * lean2];
      const m = mesh(stalkGeo, MAT_PEDICEL, { name: 'pedicel', cast: false });
      m.rotation.y = -a;
      m.scale.set(lean2 / 0.3, 1, lean2 / 0.3);
      bg.add(m);
      heads.push({ host: bg, at: tip });
    }
    if (!heads.length) heads.push({ host: bg, at: [0, 0, 0] });
    /* 各梗の先に二重の花球 */
    for (const hd of heads) {
      const hr = r * range(cr, 0.46, 0.62);
      const hg = grp('blossom-sub', { pos: hd.at });
      hd.host.add(hg);
      puff(hg, hr, Math.round(range(cr, 8, 12.4)), hr * range(cr, 0.5, 0.62), MAT_P[clamp(tier, 0, 3)], pale, 0.56, cr() * TAU);
      /* 内層（瓣が重ね重なって丸く見える） */
      puff(hg, hr * 0.62, Math.round(range(cr, 5, 8)), hr * range(cr, 0.44, 0.56), MAT_P[clamp(tier + 1, 0, 3)], pale - 0.1, 0.7, cr() * TAU);
      if (hr > 0.07) {
        hg.add(inst(petalCard(q(hr * 0.5), q(hr * 0.5), 0.8), MAT_P[3], 3, (i, d, ru, col) => {
          const a = (i / 3) * TAU + ru() * 1.6;
          d.position.set(Math.cos(a) * hr * 0.22, range(ru, -0.2, 0.16) * hr, Math.sin(a) * hr * 0.22);
          d.rotation.set(ru() * 3, a, ru() * 3);
          d.scale.setScalar(range(ru, 0.8, 1.15));
          col.setHSL(0.94 + ru() * 0.03, 0.26 + ru() * 0.16, 0.78 + ru() * 0.12);
        }, { name: 'petal-core', cast: false }));
      }
      /* 新葉（花期が遅い＝葉がかなり出る） */
      const nLeaf = Math.max(1, Math.round(range(cr, 1.2, 3.4) * (tier >= 1 ? 1.3 : 0.8)));
      hg.add(inst(leafCard(q(hr * 0.86), q(hr * 0.5), 0.28), tier >= 2 ? MAT_LEAF_MID : MAT_LEAF, nLeaf, (i, d, ru, col) => {
        const a = ru() * TAU;
        const el = range(ru, -1.3, 0.5);
        d.position.set(Math.cos(a) * hr * 0.9, Math.sin(el) * hr * 0.8, Math.sin(a) * hr * 0.9);
        d.rotation.set(range(ru, -1.4, 0.7), ru() * TAU, ru() * 2);
        const s = range(ru, 0.7, 1.2);
        d.scale.set(s, s, s);
        col.setHSL(0.22 + ru() * 0.09, 0.34 + ru() * 0.26, 0.56 + ru() * 0.26);
      }, { name: 'young-leaves', cast: false }));
    }
    /* 主球（花房の芯） */
    puff(bg, r, Math.round(range(cr, 7, 11)), r * range(cr, 0.52, 0.66), MAT_P[clamp(tier, 0, 3)], pale, 0.54, spin);
    const nSub = cr() > 0.34 ? (cr() > 0.7 ? 2 : 1) : 0;
    for (let i = 0; i < nSub; i++) {
      const a = cr() * TAU, el = range(cr, -0.8, 0.5);
      const off = r * range(cr, 0.42, 0.7);
      const sub = grp('blossom-sub', { pos: [Math.cos(a) * off, Math.sin(el) * off * 0.8, Math.sin(a) * off] });
      bg.add(sub);
      const sr = r * range(cr, 0.48, 0.68);
      puff(sub, sr, Math.round(range(cr, 6, 9.4)), sr * range(cr, 0.5, 0.64), MAT_P[clamp(tier + 1, 0, 3)], pale - 0.07, 0.58, cr() * TAU);
    }
    /* 散瓣 */
    if (opts.loose) {
      bg.add(inst(petalCard(q(r * 0.34), q(r * 0.32), 0.8), MAT_P[0], Math.round(range(cr, 2.2, 4.4)), (i, d, ru, col) => {
        const a = ru() * TAU;
        const el = range(ru, -1.6, 0.5);
        const R = r * range(ru, 1.2, 2.0);
        d.position.set(Math.cos(a) * R * Math.cos(el), Math.sin(el) * R * 0.8, Math.sin(a) * R * Math.cos(el));
        d.rotation.set(ru() * TAU, ru() * TAU, ru() * TAU);
        d.scale.setScalar(range(ru, 0.7, 1.05));
        col.setHSL(0.94 + ru() * 0.03, 0.3 + ru() * 0.24, 0.86);
      }, { name: 'loose-petals', cast: false }));
    }
    // 房ごとに揺れノードを付けない：amp 0.016〜0.032 rad（1〜2°）は小枝側の揺れ
    // （0.03〜0.085 rad）より小さいのに、ノードを分けた瞬間に「揺れサブツリーの宿主」が
    // 房ごとに割れて实例マージが効かず、この一本だけで 2137 draw call（全場面可见の 22%、
    // 実測 8.8 µs/call → 19 ms）になっていた。小枝が揺れれば房はそれに乗って動く。
    host.add(bg);
    return bg;
  }

  /* ---- 树冠穹頂（実った丸い雲団） ---- */
  const cyTop = H * 0.97;
  const cyBase = trunkTop * 1.02 + (H - trunkTop) * 0.2;
  const cyMid = (cyBase + cyTop) / 2;
  const ryHalf = (cyTop - cyBase) * 0.5;
  const ellX = W * 0.5;
  const ellZ = ellX * range(rnd, 0.88, 0.98);
  const outline = (az, u) => {
    const cx = Math.cos(az), cz = Math.sin(az);
    const nb = noise.fbm(cx * 1.7, u * 2.1 + 1.6, cz * 1.7, 3);
    const nb2 = noise.fbm(cx * 3.7 - 5, u * 2.9, cz * 3.7 + 7, 2);
    return clamp(0.78 + 0.3 * nb + 0.32 * ((0.9 + 0.18 * nb2) - 0.55) + 0.07 * Math.sin(az * 4 + ridgePh), 0.62, 1.04);
  };
  const ellR = (az) => 1 / Math.sqrt((Math.cos(az) * Math.cos(az)) / (ellX * ellX) + (Math.sin(az) * Math.sin(az)) / (ellZ * ellZ));
  const domeAt = (az, u, k = 1) => {
    const uu = clamp(u, 0, 1);
    const sy = uu * 2 - 1;
    const ds = Math.sqrt(clamp(1 - sy * sy * 0.74, 0.16, 1));   // 丸み強め（扁すぎない）
    const y = cyMid + ryHalf * sy * (sy >= 0 ? 1 : 0.78) + noise.n3(Math.cos(az) * 2.2, uu * 3.4, Math.sin(az) * 2.2) * 0.13;
    const rr = ellR(az) * outline(az, uu) * ds * k;
    return [Math.cos(az) * rr, y, Math.sin(az) * rr];
  };

  /* ---- 三级分枝（枝垂れ気味） ---- */
  const anchors = [];
  function limb(parent, depth, originLocal, owParent, elev, azim, len, r0, r1) {
    const g = grp(depth === 0 ? 'branch-1' : depth === 1 ? 'branch-2' : 'branch-3', { pos: originLocal });
    // 末端小枝（depth 2）不设揺れノード：房を載せるノードが増えるほど实例が細分化され、
    // この一本だけで 1144 draw call（提出 8.3 µs/call → 9.5 ms）になっていた。
    // 主枝・亜枝が揺れれば房は乗って動くので風の表情は残る。
    if (depth < 2) g.userData.sway = {
      amp: depth === 0 ? range(rnd, 0.012, 0.02) : range(rnd, 0.022, 0.036),
      freq: depth === 0 ? range(rnd, 0.3, 0.44) : range(rnd, 0.48, 0.7),
      phase: rnd() * TAU,
      axis: rnd() > 0.5 ? 'z' : 'both',
      lean: range(rnd, 0.3, 0.75),
    };
    const droop = (depth === 2 ? 1.9 : depth === 1 ? 1.15 : 0.85) * weep;
    const SEG = depth === 0 ? 8 : depth === 1 ? 6 : 5;
    const pts = [[0, 0, 0]];
    let x = 0, y = 0, z = 0;
    const azJit = range(rnd, -0.2, 0.2);
    for (let i = 1; i <= SEG; i++) {
      const t = i / SEG;
      const e = elev + 0.18 * Math.sin(t * 1.9) - droop * 0.5 * Math.pow(t, 2.2);
      const a = azim + azJit * Math.pow(t, 1.2) + 0.06 * Math.sin(t * 5.1);
      const dl = len / SEG;
      x += Math.cos(a) * Math.cos(e) * dl;
      z += Math.sin(a) * Math.cos(e) * dl;
      y += Math.sin(e) * dl;
      const wig = 0.055 * dl;
      pts.push([x + range(rnd, -wig, wig), y + range(rnd, -wig * 0.5, wig * 0.7), z + range(rnd, -wig, wig)]);
    }
    const collar = mesh(sph(q(r0 * 1.7), depth === 0 ? 12 : 8, depth === 0 ? 8 : 6), depth === 0 ? MAT_BARK_OLD : MAT_BARK, { name: 'collar' });
    collar.position.set(-pts[1][0] * 0.1, -r0 * 0.2, -pts[1][2] * 0.1);
    collar.scale.set(1.05, 0.72, 1.05);
    g.add(collar);
    g.add(mesh(limbGeo(pts, r0, r1, {
      seg: depth === 0 ? 30 : depth === 1 ? 20 : 12,
      radial: depth === 0 ? 10 : 8,
      taper: depth === 0 ? 1.0 : 1.3,
      wob: depth === 0 ? 0.08 : 0.12,
      vSpan: depth === 2 ? 0.2 : 0.42,
    }), depth === 0 ? MAT_BARK_OLD : MAT_BARK, { name: depth === 2 ? 'twig' : 'limb' }));

    const ow = [owParent[0] + originLocal[0], owParent[1] + originLocal[1], owParent[2] + originLocal[2]];
    const tip = pts[SEG];
    anchors.push({ grp: g, ow, w: 0.62, d: depth, tipFlag: false, tLocal: [0, 0, 0] });
    anchors.push({ grp: g, ow: [ow[0] + tip[0], ow[1] + tip[1], ow[2] + tip[2]], w: 1.0, d: depth, tipFlag: true, tLocal: tip });

    if (depth < 2) {
      const nChild = Math.round(range(rnd, depth === 0 ? 2.1 : 2.0, depth === 0 ? 3.3 : 3.0));
      for (let i = 0; i < nChild; i++) {
        const t = clamp(0.38 + (i / Math.max(1, nChild)) * 0.6, 0.18, 1);
        const idx = clamp(Math.round(t * SEG), 1, SEG);
        const p = pts[idx];
        const side = (i % 2 ? 1 : -1) * range(rnd, 0.28, 0.72);
        const childElev = clamp(elev - range(rnd, 0.0, 0.2) + (depth === 0 ? 0.06 : 0.06), 0.04, 1.3);
        const rMid = r0 + (r1 - r0) * t;
        limb(g, depth + 1, [p[0], p[1], p[2]], ow,
          childElev, azim + side, len * range(rnd, depth === 0 ? 0.4 : 0.46, depth === 0 ? 0.52 : 0.58),
          Math.max(0.004, rMid * 0.72), Math.max(0.002, rMid * 0.18));
      }
      if (depth === 0) {
        const p = pts[SEG];
        limb(g, 1, [p[0], p[1], p[2]], ow,
          clamp(elev + range(rnd, 0.1, 0.3), 0.35, 1.3), azim + range(rnd, -0.35, 0.35),
          len * range(rnd, 0.44, 0.56), Math.max(0.006, r1 * 1.7), Math.max(0.002, r1 * 0.36));
      }
    }
    parent.add(g);
    return g;
  }
  function limbTo(start, P, depth, r0, r1, lenK = 0.66) {
    const d = [P[0] - start[0], P[1] - start[1], P[2] - start[2]];
    const D = Math.max(0.14, Math.hypot(d[0], d[1], d[2]));
    return limb(S, depth, start, [0, 0, 0], Math.asin(clamp(d[1] / D, -0.85, 0.93)), Math.atan2(d[2], d[0]), D * lenK, r0, r1);
  }
  {
    const o = axisAt(trunkTop * 0.76);
    const start = [o.x, trunkTop * 0.82, o.z];
    const az = rnd() * TAU;
    limbTo(start, [Math.cos(az) * ellX * 0.2, cyTop * 0.98, Math.sin(az) * ellZ * 0.2], 0,
      Math.max(0.012, o.r * 0.94), 0.024 * girth, 0.68);
  }
  for (let i = 0; i < nPrim; i++) {
    const az = (i / nPrim) * TAU + range(rnd, -0.45, 0.45);
    const u = clamp(range(rnd, 0.16, 0.78) * (i % 2 ? 0.9 : 1.05), 0.05, 1);
    const y = trunkTop * clamp(0.52 + (i / nPrim) * 0.5, 0.48, 1.0);
    const o = axisAt(y);
    const start = [o.x + Math.cos(az) * o.r * 0.92, y, o.z + Math.sin(az) * o.r * 0.92];
    limbTo(start, domeAt(az + range(rnd, -0.26, 0.26), u), 0, Math.max(0.008, o.r * 0.58), 0.016 * girth);
  }
  for (let i = 0; i < 3; i++) {
    const az = rnd() * TAU;
    const y = trunkTop * range(rnd, 0.6, 0.96);
    const o = axisAt(y);
    const start = [o.x + Math.cos(az) * o.r * 0.92, y, o.z + Math.sin(az) * o.r * 0.92];
    limbTo(start, domeAt(az, range(rnd, 0.0, 0.22), 0.8), 0, Math.max(0.006, o.r * 0.36), 0.013 * girth, 0.7);
  }
  {
    const tips = anchors.filter((a) => a.tipFlag && a.d >= 1);
    const nHang = clamp(Math.round(4 + 5 * age * weep), 4, 10);
    for (let i = 0; i < nHang && tips.length; i++) {
      const an = tips[Math.min(tips.length - 1, Math.floor(rnd() * tips.length))];
      const a = rnd() * TAU;
      const L = range(rnd, 0.42, 0.92);
      const g = grp('weeping-branch', {
        pos: [an.tLocal[0] + range(rnd, -0.07, 0.07), an.tLocal[1] + range(rnd, -0.04, 0.04), an.tLocal[2] + range(rnd, -0.07, 0.07)],
      });
      g.userData.sway = { amp: range(rnd, 0.05, 0.085), freq: range(rnd, 0.95, 1.5), phase: rnd() * TAU, axis: 'both', lean: 1.0 };
      const out = range(rnd, 0.14, 0.4);
      const pts = catenary([0, 0, 0], [Math.cos(a) * out, -L, Math.sin(a) * out], L * 0.16, 7).map((v) => [v.x, v.y, v.z]);
      g.add(mesh(tubeOf(pts, Math.max(0.0035, 0.012 * girth), 10, 6), MAT_BARK, { name: 'weep-limb' }));
      /* 垂れ枝に沿って花房をぶら下げる */
      for (let k = 2; k < pts.length; k++) {
        if (rnd() > 0.62) continue;
        const pt = pts[k];
        const u = clamp((pt[1] + g.position.y + an.ow[1] - cyBase) / Math.max(0.001, cyTop - cyBase), 0, 1);
        blossom(g, pt, range(rnd, 0.075, 0.115) * clamp(W / 4.2, 0.72, 1.1), u > 0.62 ? 0 : 1,
          { loose: true, stalk: range(rnd, 0.05, 0.085) });
      }
      an.grp.add(g);
    }
  }

  /* ---- 花房を穹頂殻上→最近枝組へ ---- */
  let guard = 0;
  while (spent.n < budget && guard++ < budget * 110) {
    const az = rnd() * TAU;
    const u = clamp(Math.pow(rnd(), 0.52), 0.04, 1);            // さらに上密
    if (u < 0.28 && rnd() > 0.36 + u * 2.2) continue;
    const dep = 0.44 + 0.56 * Math.pow(rnd(), 0.34);             // 殻の外側密＝「実った」冠
    const [px, y, pz] = domeAt(az, u, dep);
    let best = null, bd = 1e9;
    for (const an of anchors) {
      const dx = an.ow[0] - px, dy = an.ow[1] - y, dz = an.ow[2] - pz;
      const d2 = (dx * dx + dy * dy + dz * dz) / (an.w * an.w);
      if (d2 < bd) { bd = d2; best = an; }
    }
    if (!best || bd > 2.0) continue;
    const tier = dep > 0.9 ? 0 : dep > 0.72 ? 1 : 2;
    const rBase = range(rnd, 0.155, 0.29) * clamp(W / 4.2, 0.7, 1.12) * (tier === 0 ? 1.04 : tier === 1 ? 0.98 : 0.9);
    blossom(best.grp, [px - best.ow[0], y - best.ow[1], pz - best.ow[2]], rBase, tier,
      { loose: dep > 0.7, stalk: range(rnd, 0.06, 0.1) });
  }

  /* ---- 冠内の新葉スプレー（葉桜気味に緑を覗かせる） ---- */
  {
    const tips = anchors.filter((a) => a.tipFlag);
    const n = clamp(Math.round(tips.length * 0.24), 6, 22);
    for (let i = 0; i < n; i++) {
      const an = tips[Math.min(tips.length - 1, Math.floor(rnd() * tips.length))];
      const g = grp('leaf-spray', { pos: [an.tLocal[0] + range(rnd, -0.05, 0.05), an.tLocal[1] - range(rnd, 0, 0.06), an.tLocal[2] + range(rnd, -0.05, 0.05)] });
      g.userData.sway = { amp: range(rnd, 0.03, 0.055), freq: range(rnd, 1.0, 1.6), phase: rnd() * TAU, axis: 'both', lean: 0.8 };
      const nL = Math.round(range(rnd, 3, 6));
      g.add(inst(leafCard(q(0.06), q(0.036), 0.3), rnd() > 0.5 ? MAT_LEAF : MAT_LEAF_MID, nL, (k, d, ru, col) => {
        const a = ru() * TAU, el = range(ru, -1.3, 0.6);
        const R = range(ru, 0.03, 0.09);
        d.position.set(Math.cos(a) * R, Math.sin(el) * R, Math.sin(a) * R);
        d.rotation.set(range(ru, -1.5, 0.9), ru() * TAU, ru() * 2);
        const s = range(ru, 0.8, 1.25);
        d.scale.set(s, s, s);
        col.setHSL(0.21 + ru() * 0.1, 0.32 + ru() * 0.28, 0.55 + ru() * 0.28);
      }, { name: 'leaves', cast: false }));
      an.grp.add(g);
    }
  }

  /* ---- 冠下接地影 ---- */
  shadowBlob(S, { r: moundR * 1.25, pos: [0, 0, 0], opacity: 0.26, color: '#3a2f36' });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + rnd();
    const rr = W * range(rnd, 0.14, 0.36);
    shadowBlob(S, { r: range(rnd, 0.45, 0.95) * clamp(W / 4.2, 0.65, 1.1), pos: [Math.cos(a) * rr, 0.001, Math.sin(a) * rr], opacity: range(rnd, 0.1, 0.18), color: '#4a3f46' });
  }
  S.add(inst(sakuraPetalGeo(0.032, 0.028, 0.62), MAT_P_SOLID, 12, (i, d, r2, col) => {
    const a = r2() * TAU;
    const rr = W * (0.1 + r2() * 0.28);
    d.position.set(Math.cos(a) * rr, cyBase + r2() * (cyTop - cyBase) * 0.9, Math.sin(a) * rr * 0.9);
    d.rotation.set(r2() * TAU, r2() * TAU, r2() * TAU);
    d.scale.setScalar(range(r2, 0.7, 1.15));
    col.setHSL(0.935 + r2() * 0.04, 0.4 + r2() * 0.22, 0.64 + r2() * 0.2);
  }, { name: 'air-petals', cast: false }));

  for (let i = 0; i < 7; i++) {
    const a = rnd() * TAU, rr = moundR * range(rnd, 0.6, 1.5);
    const st = mesh(sph(q(range(rnd, 0.014, 0.034)), 7, 5),
      i % 2 ? MAT.stone({ color: PAL.dirt }) : MAT.stone({ color: PAL.concreteDark }),
      { name: 'pebble', pos: [Math.cos(a) * rr, 0.018, Math.sin(a) * rr] });
    st.scale.set(1, range(rnd, 0.4, 0.7), range(rnd, 0.8, 1.2));
    S.add(st);
  }

  return finish(S, { outline: 'thin' });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
