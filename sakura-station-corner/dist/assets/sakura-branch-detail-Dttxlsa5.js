import { g as grp, M as MAT, T as TEX, a0 as IS_FLAT, P as PAL, n as range, m as mesh, V as Vector3, o as lathe, c as cyl, r as rbox, w as weather, a as sph, k as tubeOf, l as catenary, E as inst, p as shadowBlob, q as finish, C as CatmullRomCurve3, B as BufferGeometry, F as Float32BufferAttribute, z as rand, a1 as sakuraPetalGeo, a2 as sakuraLeafGeo, x as PlaneGeometry } from './index-D8uBk-tk.js';

//  assets/flora/sakura-branch-detail.js —— 掉落／斜伸の帯花細枝（貼地近景ディテール道具）
//  構成：折れた主枝（断口の白木＋裂片）→ 2~3 叉の小枝（上向きに弧く）→ 10~20 個の花簇（八重気味の小球）
//        ＋ 若葉・花梗 ＋ 旁らに散った単瓣 3~6 枚（貼地）＋ 接地軟影
//  単位米；原点 = 地面接触点（小枝の水平中心下）；+Y 上；主枝は X 方向、折口は −X 側、梢は +X 側。
//  同一 options 結果は完全に決定論的（rand(seed) のみ使用）。

const meta = {
  id: 'sakura-branch-detail',
  real: [1.2, 0.24, 0.34],       // length=1.2（既定）時の目安：全長 x 持ち上がり x 幅
  origin: 'ground-center',
};

const DEFAULT_OPTIONS = { seed: 71, length: 1.2 };

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
/**
 * 花弁／葉のカード。寸法 10 mm・巻 0.2 単位でキャッシュ共有（呼ぶたびに新しい
 * BufferGeometry を作ると、同じ形の花弁が全部「別几何」になって inst バッチが効かない）。
 * 平涂模式は map を剥がす（core/style.js）ので alpha 抜きが空振り → 四角紙になる。
 * だから輪郭は几何側で持つ（toon 模式は従来どおりカード＋貼图）。
 */
const CARD_STEP = 0.01, CURL_STEP = 0.2;
const cardCache = new Map();
const qCard = (v) => Math.max(CARD_STEP, Math.round(v / CARD_STEP) * CARD_STEP);
const qCurl = (v) => Math.round(v / CURL_STEP) * CURL_STEP;
function cardGeo(kind, w, h, curl) {
  const qw = qCard(w), qh = qCard(h), qc = qCurl(curl);
  if (IS_FLAT) {
    // 実形の面積は bbox の約 45%／55% → そのまま差し替えると透けるので一弁を拡大する
    const p = kind === 'p', f = p ? 1.35 : 1.25;
    return p ? sakuraPetalGeo(qw * f, qh * f, qc) : sakuraLeafGeo(qw * f, qh * f, qc);
  }
  const key = kind + qw.toFixed(3) + 'x' + qh.toFixed(3) + '@' + qc.toFixed(2);
  let g = cardCache.get(key);
  if (!g) { g = cardRaw(kind === 'p', qw, qh, qc); cardCache.set(key, g); }
  return g;
}
function cardRaw(isPetal, w, h, curl) {
  const g = new PlaneGeometry(w, h, 3, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const nx = x / (w / 2), ny = y / (h / 2);
    p.setZ(i, -(nx * nx) * curl * h * 0.5 + ny * ny * curl * h * 0.18 - Math.abs(nx) * curl * h * 0.07);
  }
  g.computeVertexNormals();
  return g;
}
const petalCard = (w, h, curl) => cardGeo('p', w, h, curl);
const leafCard = (w, h, curl) => cardGeo('l', w, h, curl);
/** 錐形曲线枝（端盖付き） */
function limbGeo(pts, r0, r1, o = {}) {
  const seg = o.seg ?? Math.max(10, (pts.length - 1) * 5);
  const radial = o.radial ?? 8;
  const wob = o.wob ?? 0.08;
  const taper = o.taper ?? 0.9;
  const vSpan = o.vSpan ?? 0.28;
  const curve = new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.4);
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
      const rr = r * (1 + wob * Math.sin(a * 3 + t * 6.2) + wob * 0.6 * Math.sin(a * 5 - t * 2.4));
      const d = new Vector3(N.x * c + B.x * s, N.y * c + B.y * s, N.z * c + B.z * s);
      if (d.lengthSq() < 1e-9) d.set(1, 0, 0);
      d.normalize();
      push(P.x + d.x * rr, P.y + d.y * rr, P.z + d.z * rr, d.x, d.y, d.z, (j / radial) * 1.2, (t * len) / vSpan);
    }
  }
  for (let i = 0; i < seg; i++) {
    const a0 = i * ring, b0 = (i + 1) * ring;
    for (let j = 0; j < radial; j++) idx.push(a0 + j, b0 + j, b0 + j + 1, a0 + j, b0 + j + 1, a0 + j + 1);
  }
  const cap = (t, flip) => {
    const k = Math.round(t * seg);
    const P = curve.getPoint(t), T = fr.tangents[k];
    push(P.x, P.y, P.z, T.x * flip, T.y * flip, T.z * flip, 0.5, 0.5);
    const center = pos.length / 3 - 1;
    const first = pos.length / 3;
    for (let j = 0; j <= radial; j++) {
      const N = fr.normals[k], B = fr.binormals[k];
      const a = (j / radial) * TAU;
      const r = radAt(t) * (o.jagged ? 1 + o.jag[j % o.jag.length] * 0.9 : 0.97);
      push(P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r,
        P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r,
        P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r,
        T.x * flip, T.y * flip, T.z * flip, j / radial, 0.5);
    }
    for (let j = 0; j < radial; j++) {
      if (flip > 0) idx.push(center, first + j, first + j + 1);
      else idx.push(center, first + j + 1, first + j);
    }
  };
  cap(0, -1);
  cap(1, 1);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function build(options = {}) {
  const seed = options.seed ?? 71;
  const length = options.length ?? 1.2;
  /** pose: 'fallen' 完全に伏せ ／ 'raised' 段差に掛かって梢が持ち上がる */
  const pose = options.pose ?? 'fallen';
  const rnd = rand(seed);
  const S = grp('sakura-branch-detail');

  const sc = clamp(length / 1.2, 0.5, 2.2);
  const liftK = pose === 'raised' ? 1 : 0;

  const MAT_BARK = MAT.bark({ seed });
  const MAT_BARK_DARK = MAT.bark({
    seed, tint: '#e6d8d2', normalScaleX: 1.9, normalScaleY: 1.9,
    map: TEX.bark({ base: '#5d4636', seed: seed + 4 }).map,
    normalMap: TEX.bark({ base: '#5d4636', seed: seed + 4 }).normalMap,
  });
  const MAT_WOOD = MAT.wood({ light: '#f0dab8', dark: '#c79a6a', knots: 1 });
  const MAT_WOOD_DRY = MAT.wood({ light: '#cbb091', dark: '#8f6f4e' });
  // 平涂模式は card を几何輪郭に切り替えるので、これらの alpha 貼图は一度もサンプリングされない
  const pTex = IS_FLAT ? [null, null, null] : [TEX.petal({ tone: 0 }), TEX.petal({ tone: 1 }), TEX.petal({ tone: 2 })];
  // 平涂で花弁が実形になると内層の掛け算色が枯れ色に見える → 明るい桜色に
  const MAT_P = [
    MAT.petal({ map: pTex[0], tone: 0, glow: 0.3, rim: 0.62, rimPower: 1.6, alphaTest: 0.38, steps: 3, dither: 0.005 }),
    MAT.petal({ map: pTex[1], tone: 1, glow: 0.16, rim: 0.48, alphaTest: 0.38, steps: 3 }),
    MAT.petal({ map: pTex[2], tone: 2, glow: 0.05, rim: 0.3, alphaTest: 0.4, steps: 3, tint: IS_FLAT ? '#f2dce4' : '#dcc2cd' }),
    MAT.petal({ map: pTex[2], tone: 2, glow: 0.0, rim: 0.16, alphaTest: 0.42, steps: 2, tint: IS_FLAT ? '#e7cdd9' : '#c39fb0' }),
  ];
  const MAT_P_BROWN = MAT.petal({
    map: pTex[2], tone: 2, glow: 0.0, rim: 0.2, alphaTest: 0.4, steps: 3,
    tint: IS_FLAT ? '#f0e0d6' : '#d9bcae', color: '#f0c8ce',
  });
  const MAT_STEM = MAT.paint('#7d6a4e', { spec: 0.07, steps: 2, shadowAmt: 0.92 });
  const MAT_CALYX = MAT.paint(PAL.sakuraCenter, { spec: 0.09, steps: 3, shadowAmt: 0.86 });
  const MAT_LEAF = MAT.leaf({ map: IS_FLAT ? null : TEX.leafCluster({ base: PAL.leafYoung, seed: seed + 5 }), color: '#f3f7e2', alphaTest: 0.4, rim: 0.34 });
  const MAT_LEAF_OLD = MAT.leaf({ map: IS_FLAT ? null : TEX.leafCluster({ base: PAL.leaf, seed: seed + 9 }), color: PAL.leafYoung, alphaTest: 0.42, rim: 0.22 });

  /* ================= 主枝（地面に伏せ、梢だけ僅かに浮く） ================= */
  const SEG = 9;
  const main = [];
  const baseY = 0.019 * (1 + liftK * 2.2);
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const x = (-0.5 + t) * length;
    // 地面に接する箇所と、枝元で僅かに浮く箇所を交互に
    const rest = Math.sin(t * Math.PI) * 0.014 + Math.sin(t * 5.1 + 0.6) * 0.006;
    const lift = liftK * Math.pow(t, 2.2) * 0.26;
    main.push([x, Math.max(0.006, baseY + rest + lift) * (0.85 + 0.3 * (t > 0.8 ? 1 : 0)),
      Math.sin(t * 2.7 + rnd() * 0.1) * 0.035 * sc]);
  }
  const rBase = 0.019 * sc, rTip = 0.0055 * sc;
  const jag = [];
  for (let i = 0; i <= 8; i++) jag.push(range(rnd, -0.55, 0.75));
  const mainMesh = mesh(limbGeo(main, rBase, rTip, {
    seg: 42, radial: 9, wob: 0.1, vSpan: 0.24, jagged: true, jag,
  }), MAT_BARK, { name: 'branch-main' });
  S.add(mainMesh);

  /* 断口：白木の折面 + 裂片 + 剥がれた皮 */
  {
    const bp = main[0];
    const tan = new Vector3(main[1][0] - bp[0], main[1][1] - bp[1], main[1][2] - bp[2]).normalize();
    const g = grp('break', { pos: [bp[0], bp[1], bp[2]] });
    faceOut(g, -tan.x, -tan.y, -tan.z);
    // 斜めの割れ面
    const disc = mesh(lathe([[0, 0], [rBase * 1.02, 0.0006], [rBase * 0.7, rBase * 0.36], [rBase * 0.24, rBase * 0.5], [0, rBase * 0.42]], 14),
      MAT_WOOD, { name: 'break-face', rot: [Math.PI / 2, 0, 0] });
    g.add(disc);
    // 年輪っぽい同心环（薄い筒）
    for (let i = 1; i <= 2; i++) {
      const rr = rBase * (0.28 + i * 0.24);
      const ring = mesh(cyl(rr, rr, 0.0012 * sc, 14, true), MAT_WOOD_DRY, { name: 'break-ring', pos: [0, 0, 0.0012 * i], cast: false });
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    // 木 Splinter（裂片）
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + rnd() * 0.7;
      const len = rBase * range(rnd, 1.4, 3.2);
      const sp = mesh(rbox(0.004 * sc, 0.0022 * sc, len, 0.001, 1), i % 2 ? MAT_WOOD : MAT_WOOD_DRY, {
        name: 'splinter', pos: [Math.cos(a) * rBase * 0.8, Math.sin(a) * rBase * 0.8, -len * 0.4],
      });
      sp.rotation.set(range(rnd, -0.5, 0.5), range(rnd, -0.5, 0.5), range(rnd, -0.4, 0.4));
      g.add(sp);
    }
    // 剥離した樹皮（外面に茶色い破片）
    for (let i = 0; i < 3; i++) {
      const a = rnd() * TAU;
      const sh = mesh(rbox(0.01 * sc, 0.0075 * sc, 0.0022 * sc, 0.002, 1), MAT_BARK_DARK, {
        name: 'peeled-bark', pos: [Math.cos(a) * rBase * 0.9, Math.sin(a) * rBase * 0.9, -rBase * range(rnd, 0.2, 1.1)],
      });
      sh.rotation.set(range(rnd, -0.9, 0.9), range(rnd, -0.9, 0.9), rnd() * TAU);
      g.add(sh);
    }
    S.add(g);
  }
  /* 枝元〜中部：横向き皮孔・縦シワ（旧さ）＋小さな疣 */
  weather(mainMesh, { w: 0.05 * sc, h: 0.06 * sc, pos: [-length * 0.2, 0.02, 0], rot: [0, 0.7, 0], kind: 'scratch', color: '#c9b39e', opacity: 0.3, seed: seed + 5, density: 1.6, count: 2, spread: 0.004 });
  weather(mainMesh, { w: 0.055 * sc, h: 0.05 * sc, pos: [length * 0.1, 0.02, 0.01], rot: [0, -0.5, 0], kind: 'moss', color: PAL.moss, opacity: 0.3, seed: seed + 6, density: 1.1, count: 2, spread: 0.003 });
  weather(mainMesh, { w: 0.06 * sc, h: 0.05 * sc, pos: [length * 0.28, 0.022, -0.01], rot: [0, 2.2, 0], kind: 'dirt', color: '#5c4b3c', opacity: 0.32, seed: seed + 7, density: 1.2, count: 2, spread: 0.003 });
  for (let i = 0; i < 4; i++) {
    const t = range(rnd, 0.15, 0.8);
    const idx = clamp(Math.round(t * SEG), 0, SEG);
    const p = main[idx];
    const a = rnd() * TAU;
    const b = mesh(sph(q(0.004 * sc), 8, 6), MAT_BARK_DARK, { name: 'lens-burl', pos: [p[0], p[1] + Math.sin(a) * rBase * 0.8, p[2] + Math.cos(a) * rBase * 0.8] });
    b.scale.set(1.6, 1, 0.7);
    S.add(b);
  }

  /* ================= 花簇 ================= */
  let flowerCount = 0;
  const targetFlowers = Math.round(range(rnd, 12, 19));

  /** 一簇：小花（5~8 瓣の二重気味）＋萼＋花梗 */
  function umbel(host, at, r, tone, opts = {}) {
    if (flowerCount >= targetFlowers + 4) return;
    flowerCount++;
    const g = grp('flower', { pos: at });
    const cr = rand(((Math.round(at[0] * 811) + Math.round(at[1] * 977) + Math.round(at[2] * 1319) + seed * 4211) & 0x7fffffff) >>> 0);
    /* 花梗（枝から下って咲く） */
    const L = opts.stalk ?? r * range(cr, 0.7, 1.9);
    if (L > 0.004) {
      const a = cr() * TAU;
      const pts = catenary([0, 0, 0], [Math.cos(a) * L * 0.3, -L, Math.sin(a) * L * 0.3], L * 0.2, 4)
        .map((v) => [v.x, v.y, v.z]);
      g.add(mesh(tubeOf(pts, 0.0016 * sc, 5, 4), MAT_STEM, { name: 'pedicel', cast: false }));
    }
    /* 萼（小花の芯） */
    const calyx = mesh(sph(q(r * 0.28), 8, 6), MAT_CALYX, { name: 'calyx', pos: [0, r * 0.1, 0] });
    calyx.scale.set(1, 0.66, 1);
    g.add(calyx);
    /* 外層瓣 */
    const n1 = Math.round(range(cr, 5, 6.8));
    g.add(inst(petalCard(q(r * 0.95), q(r * 0.9), 0.42), MAT_P[clamp(tone, 0, 2)], n1, (i, d, ru, col) => {
      const a = (i / n1) * TAU + ru() * 0.35;
      const tilt = range(ru, 1.05, 1.62);
      d.position.set(Math.cos(a) * r * 0.42, r * 0.1 - Math.cos(tilt) * r * 0.1, Math.sin(a) * r * 0.42);
      d.rotation.set(Math.cos(tilt) * 0.9, -a + TAU / 2, 0);
      d.rotateZ(range(ru, -0.3, 0.3));
      const s = range(ru, 0.85, 1.15);
      d.scale.set(s, s, s);
      col.setHSL(0.925 + ru() * 0.05, 0.24 + ru() * 0.3, (tone === 0 ? 0.9 : tone === 1 ? 0.82 : 0.7) + ru() * 0.14);
    }, { name: 'petals-out', cast: true }));
    /* 内層瓣（八重 feeling） */
    const n2 = Math.round(range(cr, 4, 6.2));
    g.add(inst(petalCard(q(r * 0.62), q(r * 0.6), 0.62), MAT_P[clamp(tone + 1, 0, 3)], n2, (i, d, ru, col) => {
      const a = (i / n2) * TAU + 0.5 + ru() * 0.4;
      d.position.set(Math.cos(a) * r * 0.2, r * 0.2, Math.sin(a) * r * 0.2);
      d.rotation.set(range(ru, 0.25, 0.75), -a + TAU / 2, range(ru, -0.4, 0.4));
      const s = range(ru, 0.8, 1.1);
      d.scale.set(s, s, s);
      col.setHSL(0.93 + ru() * 0.04, 0.3 + ru() * 0.28, 0.84 + ru() * 0.14);
    }, { name: 'petals-in', cast: false }));
    /* 雄蕊（細い点：薄い球で代用せず tiny cyl 数本） */
    const nS = Math.round(range(cr, 3, 5));
    for (let i = 0; i < nS; i++) {
      const a = cr() * TAU, rr = r * 0.12 * cr();
      const st = mesh(cyl(0.0006 * sc, 0.0008 * sc, r * 0.5, 4, true), MAT.paint('#f7e6b8', { spec: 0.2, steps: 2, shadowAmt: 0.6 }), {
        name: 'stamen', pos: [Math.cos(a) * rr, r * 0.36, Math.sin(a) * rr], cast: false,
      });
      st.rotation.set(range(cr, -0.3, 0.3), 0, range(cr, -0.3, 0.3));
      g.add(st);
    }
    /* 若葉 */
    if (opts.leaf && cr() > 0.42) {
      g.add(inst(leafCard(q(r * 1.5), q(r * 0.72), 0.24), cr() > 0.6 ? MAT_LEAF : MAT_LEAF_OLD, Math.round(range(cr, 1, 2.6)), (i, d, ru, col) => {
        const a = ru() * TAU;
        d.position.set(Math.cos(a) * r * 0.7, -r * 0.15, Math.sin(a) * r * 0.7);
        d.rotation.set(range(ru, -1.4, 0.5), ru() * TAU, ru() * 2);
        const s = range(ru, 0.85, 1.25);
        d.scale.set(s, s, s);
        col.setHSL(0.22 + ru() * 0.08, 0.32 + ru() * 0.24, 0.58 + ru() * 0.24);
      }, { name: 'leaf', cast: false }));
    }
    if (r > 0.022) g.userData.sway = { amp: range(cr, 0.02, 0.05), freq: range(cr, 1.2, 2.0), phase: cr() * TAU, axis: 'both', lean: 0.8 };
    host.add(g);
    return g;
  }

  /* ================= 二级小枝（上向きに弧く）＋花簇 ================= */
  const nFork = Math.round(range(rnd, 2.4, 3.4));
  const forks = [];
  for (let i = 0; i < nFork; i++) {
    const t = clamp(0.28 + (i / nFork) * 0.66 + range(rnd, -0.07, 0.07), 0.1, 0.97);
    const idx = clamp(Math.round(t * SEG), 0, SEG);
    const p = main[idx];
    const azim = range(rnd, -1.5, 1.5) * (i % 2 ? 1 : -1);
    const elev = range(rnd, 0.3, 0.95) * (pose === 'raised' ? 1.25 : 1) + liftK * 0.3;
    const flen = length * range(rnd, 0.24, 0.4);
    const fs = 6;
    const pts = [[0, 0, 0]];
    let x = 0, y = 0, z = 0;
    for (let k = 1; k <= fs; k++) {
      const u = k / fs;
      const e = elev - 1.15 * Math.pow(u, 2.1) * (pose === 'raised' ? 0.55 : 1);   // 上向いてから垂れる
      const a = azim + range(rnd, -0.2, 0.2) * u;
      const dl = flen / fs;
      x += Math.cos(a) * Math.cos(e) * dl;
      z += Math.sin(a) * Math.cos(e) * dl * 0.5;
      y += Math.sin(e) * dl;
      pts.push([x, y, z + range(rnd, -0.01, 0.01)]);
    }
    const g = grp('fork', { pos: [p[0], p[1] + rBase * 0.4, p[2]] });
    g.userData.sway = {
      amp: range(rnd, 0.02, 0.042), freq: range(rnd, 0.75, 1.15), phase: rnd() * TAU, axis: 'both', lean: 0.9,
    };
    /* 枝股の膨大 */
    g.add(mesh(sph(q(rBase * 0.62), 8, 6), MAT_BARK, { name: 'collar', pos: [0, rBase * 0.2, 0], scale: [1, 0.8, 1] }));
    g.add(mesh(limbGeo(pts, rBase * 0.5, rBase * 0.14, { seg: 22, radial: 7, wob: 0.12, vSpan: 0.18 }), MAT_BARK, { name: 'limb' }));
    S.add(g);
    forks.push({ g, pts });

    /* 三级小分岐（2 叉） */
    const nSub = Math.round(range(rnd, 1.2, 2.4));
    for (let j = 0; j < nSub; j++) {
      const tt = clamp(0.35 + (j / nSub) * 0.6, 0.2, 1);
      const pi = clamp(Math.round(tt * fs), 1, fs);
      const pp = pts[pi];
      const saz = azim + (j % 2 ? 1 : -1) * range(rnd, 0.5, 1.2);
      const selev = range(rnd, 0.1, 0.8);
      const slen = flen * range(rnd, 0.34, 0.5);
      const sp = [[0, 0, 0]];
      let sx = 0, sy = 0, sz = 0;
      for (let k = 1; k <= 4; k++) {
        const u = k / 4;
        const e = selev - 1.5 * Math.pow(u, 1.8);
        const dl = slen / 4;
        sx += Math.cos(saz) * Math.cos(e) * dl;
        sz += Math.sin(saz) * Math.cos(e) * dl * 0.6;
        sy += Math.sin(e) * dl;
        sp.push([sx, sy, sz]);
      }
      const sg = grp('twig', { pos: [pp[0], pp[1], pp[2]] });
      sg.userData.sway = { amp: range(rnd, 0.035, 0.06), freq: range(rnd, 1.1, 1.7), phase: rnd() * TAU, axis: 'both', lean: 0.9 };
      sg.add(mesh(sph(q(rBase * 0.3), 7, 5), MAT_BARK, { name: 'collar' }));
      sg.add(mesh(limbGeo(sp, rBase * 0.26, rBase * 0.07, { seg: 12, radial: 6, wob: 0.14, vSpan: 0.12 }), MAT_BARK, { name: 'twig-limb' }));
      g.add(sg);
      forks.push({ g: sg, pts: sp });
    }
  }

  /* 主枝・小枝に沿って花簇を配置（10~20 個） */
  {
    const slots = [];
    // 主枝の上側にも数個（伏せた枝から直接出る芽）
    for (let i = 1; i <= SEG; i++) {
      const p = main[i];
      if (i % 3 === 0 || rnd() > 0.72) slots.push({ host: S, at: [p[0], p[1] + rBase * 0.9, p[2]], small: true });
    }
    for (const f of forks) {
      for (let i = 2; i < f.pts.length; i++) {
        if (rnd() > 0.55) continue;
        const p = f.pts[i];
        slots.push({ host: f.g, at: [p[0], p[1], p[2]] });
      }
      const tp = f.pts[f.pts.length - 1];
      slots.push({ host: f.g, at: [tp[0], tp[1], tp[2]] });
    }
    let k = 0;
    while (flowerCount < targetFlowers && k < slots.length * 3) {
      const sl = slots[k % slots.length];
      k++;
      if (!sl) break;
      const r = range(rnd, 0.024, 0.042) * sc * (sl.small ? 0.85 : 1);
      umbel(sl.host, sl.at, r, flowerCount % 3 === 0 ? 0 : flowerCount % 3 === 1 ? 1 : 0,
        { leaf: true, stalk: sl.small ? r * 0.3 : undefined });
    }
    /* 蕾（まだ開かない小球）を数個 */
    for (let i = 0; i < Math.round(range(rnd, 2, 4)); i++) {
      const f = forks[Math.floor(rnd() * forks.length)];
      if (!f) break;
      const p = f.pts[Math.max(1, Math.floor(rnd() * f.pts.length))];
      const g = grp('bud', { pos: [p[0], p[1] - 0.006, p[2]] });
      const br = 0.011 * sc;
      const b = mesh(sph(q(br), 9, 7), MAT_P[1], { name: 'bud-ball' });
      b.scale.set(0.86, 1.15, 0.86);
      g.add(b);
      g.add(mesh(cyl(q(br * 0.8), q(br * 0.5), br * 0.8, 7), MAT_CALYX, { name: 'bud-calyx', pos: [0, -br * 0.9, 0] }));
      g.add(mesh(tubeOf(catenary([0, 0, 0], [0, br * 2.1, 0], br * 0.4, 3).map((v) => [v.x, v.y, v.z]), 0.0014 * sc, 4, 4), MAT_STEM, { name: 'bud-stalk', cast: false }));
      f.g.add(g);
    }
  }

  /* ================= 枝に付いたままの枯れ瓣・散瓣 ================= */
  {
    const nOn = Math.round(range(rnd, 3, 6));
    const cards = petalCard(q(0.026 * sc), q(0.023 * sc), 0.7);
    S.add(inst(cards, MAT_P_BROWN, nOn, (i, d, r2, col) => {
      const t = r2();
      const idx = clamp(Math.round(t * SEG), 0, SEG);
      const p = main[idx];
      const a = r2() * TAU;
      d.position.set(p[0] + range(r2, -0.02, 0.02), p[1] + Math.cos(a) * rBase * 1.1, p[2] + Math.sin(a) * rBase * 1.1);
      d.rotation.set(r2() * TAU, r2() * TAU, r2() * TAU);
      d.scale.setScalar(range(r2, 0.75, 1.1));
      col.setHSL(0.95 + r2() * 0.03, 0.22 + r2() * 0.2, 0.72 + r2() * 0.14);
    }, { name: 'petals-on-branch', cast: false }));
  }

  /* ================= 旁らに散った単瓣（貼地 3~6 枚） ================= */
  {
    const nG = Math.round(range(rnd, 3.4, 6.4));
    const cards = petalCard(q(0.031 * sc), q(0.027 * sc), 0.62);
    S.add(inst(cards, MAT_P[0], nG, (i, d, r2, col) => {
      const along = range(r2, -0.62, 0.72) * length;
      const side = range(r2, -0.13, 0.13) * sc;
      d.position.set(along, 0.0035 + r2() * 0.004, side);
      d.rotation.set(-Math.PI / 2 + range(r2, -0.3, 0.3), r2() * TAU, range(r2, -0.6, 0.6));
      const s = range(r2, 0.82, 1.22);
      d.scale.setScalar(s);
      // 枯れ始めの瓣も混在
      if (r2() > 0.68) col.setHSL(0.97, 0.28, 0.76);
      else col.setHSL(0.93 + r2() * 0.04, 0.2 + r2() * 0.24, 0.9 + r2() * 0.08);
    }, { name: 'fallen-petals', cast: false, receive: true }));
    /* 瓣の縁がめくれた一枚（立体見せ） */
    const curl = petalCard(q(0.034 * sc), q(0.03 * sc), 1.25);
    const cm = mesh(curl, MAT_P[1], { name: 'curled-petal', pos: [length * range(rnd, 0.1, 0.4), 0.008, range(rnd, -0.09, 0.09)] });
    cm.rotation.set(-Math.PI / 2 + 0.32, rnd() * TAU, 0.2);
    S.add(cm);
  }

  /* ================= 接地感 ================= */
  shadowBlob(S, { r: 0.1 * sc, pos: [-length * 0.32, 0, 0], opacity: 0.2, color: '#3a2f36' });
  shadowBlob(S, { r: 0.13 * sc, pos: [length * 0.06, 0, 0.01], opacity: 0.16, color: '#3a2f36' });
  shadowBlob(S, { r: 0.1 * sc, pos: [length * 0.4, 0, -0.01], opacity: 0.18, color: '#3a2f36' });
  /* 枝元の土・苔の欠けら（草むらに落ちた感じ） */
  for (let i = 0; i < 4; i++) {
    const a = rnd() * TAU, rr = range(rnd, 0.03, 0.1) * sc;
    const t = mesh(sph(q(range(rnd, 0.006, 0.013)), 6, 5), i % 2 ? MAT.stone({ color: PAL.dirt }) : MAT.stone({ color: PAL.concreteDark }), {
      name: 'soil-bit', pos: [-length * 0.4 + Math.cos(a) * rr, 0.006, Math.sin(a) * rr],
    });
    t.scale.set(1, 0.55, 1.1);
    S.add(t);
  }
  {
    const nGrass = Math.round(range(rnd, 4, 8));
    S.add(inst(leafCard(0.06 * sc, 0.06 * sc, 0), MAT_LEAF_OLD, nGrass, (i, d, r2, col) => {
      const along = range(r2, -0.55, 0.6) * length;
      d.position.set(along, 0.022 * sc, range(r2, -0.07, 0.07) * sc);
      d.rotation.set(range(r2, -0.5, -0.15), r2() * TAU, range(r2, -0.4, 0.4));
      const s = range(r2, 0.5, 1.0);
      d.scale.set(s, s * range(r2, 1.2, 2.2), 1);
      col.setHSL(0.24 + r2() * 0.08, 0.28 + r2() * 0.2, 0.6 + r2() * 0.2);
    }, { name: 'grass-bits', cast: false, receive: true }));
  }

  return finish(S, { outline: 'thin' });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
