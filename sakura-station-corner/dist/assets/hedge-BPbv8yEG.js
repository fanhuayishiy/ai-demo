import { g as grp, M as MAT, P as PAL, T as TEX, E as inst, n as range, c as cyl, m as mesh, b as box, t as tor, w as weather, q as finish, H as plane, V as Vector3, z as rand, $ as MathUtils, Z as Euler } from './index-BFJstGKs.js';

//  assets/flora/hedge.js —— 生垣・植栽帯（kind: 'privet'=ケヤキ/レイランDIY的な実生垣 / 'box'=ツゲの刈り込み）
//  ・体積内に葉カードを錯落填充（頂部は微円拱、内層は暗色と枝幹が見える）
//  ・根部土帯＋落葉＋支撑竹竿（剪定跡）／女貞の前年果穂・色褪せ葉で経年感
//  単位メートル / 原点＝地面接触中心（長さ方向 X、厚み方向 Z）/ +Y 上 / 正面 +Z

const meta = {
  id: 'hedge',
  real: [3, 1.05, 0.5],         // len=3, h=0.75 + 竹竿梢
  origin: 'ground-center',
};

const UP = new Vector3(0, 1, 0);
const _eu = new Euler();
const _v = new Vector3();
const V = (x, y, z) => new Vector3(x, y, z);
const rq = (v) => Math.max(0.002, Math.round(v * 1000) / 1000);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));

/** 湾曲カード（clone した PlaneGeometry → 描边スキップ・両面） */
function cardGeo(w, h, bend = 0.06, segY = 2) {
  const g = plane(w, h, 1, segY).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = cl((p.getY(i) + h / 2) / h, 0, 1);
    p.setZ(i, Math.pow(t, 1.6) * bend);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
/** 直枝（テーパー円柱を数珠つなぎ） */
function stick(parent, from, to, r0, r1, mat, segs = 3, name = 'stick') {
  const a = V(...from), b = V(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const p = a.clone().addScaledVector(dir, (t0 + t1) / 2);
    const mm = mesh(cyl(rq(MathUtils.lerp(r0, r1, t1)), rq(MathUtils.lerp(r0, r1, t0)), rq((len / segs) * 1.15), 6), mat, { pos: [p.x, p.y, p.z], name });
    mm.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
    parent.add(mm);
  }
}

function build(options = {}) {
  const kind = options.kind === 'box' ? 'box' : 'privet';
  const len = options.len ?? 3;
  const h = options.h ?? 0.75;
  const seed = (options.seed ?? 5) | 0;
  const rnd = rand(seed);
  const g = grp('hedge-' + kind);

  /* -------- kind ごとの体型差（同じ緑の箱にしない） -------- */
  const P = kind === 'box'
    ? { th: 0.36, card: 0.085, seg: 2, capAt: 0.46, dens: 210, stakeN: Math.max(2, Math.round(len / 1.1)), berry: 0, shoot: 8, arch: 0.14, tone: 1.06 }
    : { th: 0.46, card: 0.15, seg: 3, capAt: 0.70, dens: 130, stakeN: Math.max(2, Math.round(len / 0.9)), berry: 1, shoot: 13, arch: 0.07, tone: 1.0 };

  const ph = [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283];
  /** 長手方向の刈り面うねり（頂高） */
  const hTop = (x) => h * (1 + P.arch * (0.55 * Math.sin((x / len) * 5.1 + ph[0]) + 0.45 * Math.sin((x / len) * 9.3 + ph[1])));
  /** 高さ y・位置 x における半厚（台形＋肩からの円拱、両端は減衰） */
  const halfT = (x, y) => {
    const H = hTop(x);
    const t = cl(y / H, 0, 1);
    let w = (P.th / 2) * (1.05 - 0.34 * t);
    if (y > H * P.capAt) {
      const u = cl((y - H * P.capAt) / (H * (1 - P.capAt)), 0, 1);
      w *= Math.sqrt(Math.max(0, 1 - u * u)) * 1.03;
    }
    const e = cl(Math.abs(x) / (len / 2), 0, 1);
    return w * (1 - Math.pow(e, 7) * 0.62);
  };

  /* ---------------- 素材 ---------------- */
  const matWood = MAT.wood({ light: '#8d7350', dark: '#4e3c28', repeat: 1, uv: { repeat: [1, 3] } });
  const matTwigDead = MAT.bark({ base: '#5f5344', seed: seed + 3, uv: { repeat: [1, 2] } });
  const matSoil = MAT.concrete({ base: '#5d4a35', repeat: 4 });
  const matStake = MAT.wood({ light: '#bfae6e', dark: '#7f7439', repeat: 1, uv: { repeat: [1, 5] } });
  const matTie = MAT.fabric({ color: '#c8b189', repeat: 14 });
  const matBerry = MAT.food({ color: '#3b3550', spec: 0.45, specPower: 90, steps: 2 });
  const matGravel = MAT.ballast({ color: '#9a917f', repeat: 12 });
  /** 葉：4 階層（表新緑／中／内暗色／色褪・黄変）＋女貞はさらに裏葉を濃く */
  const TIERS = [
    { base: '#c7dc8e', col: '#fffaea', emis: 0.19, amt: 0.52, alpha: 0.55 },
    { base: PAL.leafYoung, col: '#f0f7dc', emis: 0.13, amt: 0.7, alpha: 0.5 },
    { base: kind === 'box' ? '#6d9152' : PAL.leaf, col: '#dfeccc', emis: 0.07, amt: 0.86, alpha: 0.46 },
    { base: '#3f5a35', col: '#8ea38b', emis: 0.02, amt: 1.0, alpha: 0.42 },
    { base: '#c9b96e', col: '#ffedc8', emis: 0.05, amt: 0.9, alpha: 0.44 },
    { base: '#9b7a4e', col: '#e6cfb0', emis: 0.0, amt: 1.0, alpha: 0.4 },
  ].map((t, i) => ({
    ...t,
    mat: MAT.leaf({
      color: t.col, map: TEX.leafCluster({ base: t.base, seed: seed + i * 13 }),
      alphaTest: t.alpha, emissiveIntensity: t.emis, shadowAmt: t.amt,
      rim: 0.42 - i * 0.07, rimColor: i < 2 ? '#eaffe0' : '#cfe6c8',
      wind: { amp: 0.006 + i * 0.001, freq: 1.35 + i * 0.11, base: -0.35, span: 1.2, px: 1.4, pz: 1.1 },
    }),
    geo: cardGeo(P.card * 2.1, P.card * 2.1, P.card * 0.5, P.seg),
  }));

  /* ---------------- 内部の枝幹（内層が見える＝密度の錯落） ---------------- */
  const nTwig = Math.round(len * 7);
  g.add(inst(cardGeo(0.02, 0.3, 0.02, 1), matTwigDead, nTwig, (i, d, r) => {
    const x = range(r, -len / 2, len / 2);
    const y = range(r, 0.04, h * 0.82);
    const z = (r() * 2 - 1) * halfT(x, y) * 0.55;
    d.position.set(x, y + 0.14, z);
    d.rotation.set(range(r, -0.6, 0.6), r() * 6.283, range(r, -0.7, 0.7));
    const s = range(r, 0.6, 1.5); d.scale.set(s, s * range(r, 0.8, 1.6), 1);
  }, { name: 'inner-twigs', cast: false }));
  for (let i = 0; i < Math.round(len * 1.6); i++) {
    const x = range(rnd, -len / 2 + 0.05, len / 2 - 0.05);
    const z = range(rnd, -P.th * 0.18, P.th * 0.18);
    stick(g, [x, 0.01, z], [x + range(rnd, -0.16, 0.16), h * range(rnd, 0.45, 0.95), z + range(rnd, -0.1, 0.1)], 0.014, 0.005, matWood, 3, 'stem');
  }

  /* ---------------- 葉カード（体積内サンプリング・階層分け） ---------------- */
  const N = Math.round(len * h * P.dens);
  const slots = TIERS.map(() => []);
  for (let i = 0; i < N; i++) {
    const x = range(rnd, -len / 2, len / 2);
    const y = Math.pow(rnd(), 0.62) * hTop(x);            // 下部に厚く、頂上は薄い
    const ht = halfT(x, y);
    if (ht <= 0.01) continue;
    const shell = Math.pow(rnd(), 0.34);                    // 表面寄りに寄せる
    const z = (rnd() * 2 - 1) * ht * (0.30 + 0.70 * shell);
    let tier;
    const q = rnd();
    if (shell > 0.93 && y > h * 0.55) tier = q > 0.45 ? 0 : 1;        // 天端の陽新緑
    else if (shell > 0.80) tier = q > 0.62 ? 1 : q > 0.30 ? 2 : 4;    // 側面の表層（一部色褪）
    else if (shell > 0.55) tier = q > 0.55 ? 2 : 4;
    else tier = q > 0.30 ? 3 : 5;                                     // 内側の枯れ込み
    const sc = range(rnd, 0.55, 1.05) * (1 - shell * 0.18);
    slots[tier].push({
      p: V(x, y, z),
      rot: V(range(rnd, -1.5, 1.5), rnd() * 6.283, range(rnd, -1.4, 1.4)),
      s: sc,
    });
  }
  // 刈り面の際だけ立たせる（輪郭が「貼り付けた箱」にならない）
  const foliage = grp('foliage');
  g.add(foliage);
  TIERS.forEach((t, ti) => {
    const arr = slots[ti];
    if (!arr.length) return;
    const GH = P.card * 2.1;
    foliage.add(inst(t.geo, t.mat, arr.length, (i, d, r, col) => {
      const c = arr[i];
      const s = c.s * range(r, 0.9, 1.12);
      _eu.set(c.rot.x, c.rot.y, c.rot.z, 'XYZ');
      // カードを包む box の 8 隅を回して最低点を出す（ry で幅が寝る分も含める）
      const hw = GH * s / 2, hh = GH * s;
      let lo = 0;
      for (const fx of [-hw, hw]) for (const fy of [0, hh]) for (const fz of [-hw, hw]) {
        _v.set(fx, fy, fz).applyEuler(_eu);
        if (_v.y < lo) lo = _v.y;
      }
      d.position.set(c.p.x, Math.max(0.004 - lo, c.p.y * 0.94 + 0.012), c.p.z);
      d.rotation.set(c.rot.x, c.rot.y, c.rot.z);
      d.scale.set(s, s, 1);
      const k = 0.86 + r() * 0.28 * P.tone;
      col.setRGB(k * (0.97 + r() * 0.07), k, k * (0.9 + r() * 0.12));
    }, { name: 'leaf-' + ti }));
  });

  /* ---------------- 徒長枝（刈り込みを逸脱して突き出す春の吹き新梢） ---------------- */
  const nShoot = Math.round(len * P.shoot / 3) + 3;
  const shootGeo = cardGeo(0.05, 0.22, 0.05, 2);
  g.add(inst(shootGeo, TIERS[0].mat, nShoot, (i, d, r, col) => {
    const x = range(r, -len / 2 + 0.03, len / 2 - 0.03);
    const y = hTop(x) * range(r, 0.86, 1.0);
    const z = (r() * 2 - 1) * halfT(x, y) * 0.95;
    d.position.set(x, y, z);
    d.rotation.set(range(r, -0.55, 0.55), r() * 6.283, range(r, -0.5, 0.5));
    const s = range(r, 0.8, 1.7); d.scale.set(s, s, 1);
    col.setRGB(1.02, 1.05, 0.86);
  }, { name: 'escape-shoots' }));

  /* ---------------- 女貞の前年果穂（dark berry spikes） ---------------- */
  if (P.berry) {
    const nB = Math.round(len * 4);
    const bGeo = cyl(0.008, 0.011, 0.02, 5);
    g.add(inst(bGeo, matBerry, nB, (i, d, r) => {
      const x = range(r, -len / 2, len / 2);
      const y = hTop(x) * range(r, 0.72, 1.02);
      const z = (r() > 0.5 ? 1 : -1) * halfT(x, y) * range(r, 0.85, 1.12);
      d.position.set(x, y, z);
      d.rotation.set(range(r, -0.4, 0.4), r() * 3, range(r, -0.35, 0.35));
      const s = range(r, 0.7, 1.4); d.scale.set(s, s, s);
    }, { name: 'berries', cast: false }));
    // 果穂の軸（茶）
    g.add(inst(cardGeo(0.012, 0.12, 0.01, 1), matTwigDead, Math.round(nB * 0.6), (i, d, r) => {
      const x = range(r, -len / 2, len / 2);
      const y = hTop(x) * range(r, 0.8, 1.05);
      d.position.set(x, y, (r() * 2 - 1) * halfT(x, y));
      d.rotation.set(range(r, -0.4, 0.4), r() * 6.283, range(r, -0.4, 0.4));
    }, { name: 'berry-stalk', cast: false }));
  }

  /* ---------------- 根部：土帯・落葉・転石・洗出し ---------------- */
  const soilW = P.th + 0.12;
  const soil = mesh(box(len + 0.10, 0.07, soilW), matSoil, { pos: [0, 0.033, 0], name: 'soil-band' });
  g.add(soil);
  // 端の盛り上がり（土が寄って見える）
  for (const sgn of [-1, 1]) {
    const mound = mesh(cyl(0.02, rq(soilW * 0.42), 0.075, 10), matSoil, { pos: [sgn * (len / 2 + 0.02), 0.036, 0], name: 'soil-end' });
    mound.scale.z = 0.75;
    g.add(mound);
  }
  // 落葉堆き（前年葉＝茶、春風に積もる）
  g.add(inst(cardGeo(0.07, 0.055, 0.012, 1), TIERS[5].mat, Math.round(len * 26), (i, d, r, col) => {
    const x = range(r, -len / 2 - 0.28, len / 2 + 0.28);
    const z = (r() * 2 - 1) * (soilW / 2 + range(r, 0, 0.16));
    d.position.set(x, 0.066 + r() * 0.012, z);
    d.rotation.set(-Math.PI / 2 + range(r, -0.55, 0.55), r() * 6.283, range(r, -0.8, 0.8));
    const s = range(r, 0.6, 1.35); d.scale.set(s, s, s);
    col.setRGB(0.78 + r() * 0.34, 0.66 + r() * 0.28, 0.44 + r() * 0.22);
  }, { name: 'fallen-leaves', cast: false, receive: true }));
  // 際の小石（歩道側の掃き寄せ）
  g.add(inst(cardGeo(0.04, 0.028, 0.008, 1), matGravel, Math.round(len * 9), (i, d, r) => {
    const x = range(r, -len / 2 - 0.2, len / 2 + 0.2);
    d.position.set(x, 0.068 + r() * 0.006, (r() > 0.5 ? 1 : -1) * (soilW / 2 + range(r, 0.02, 0.12)));
    d.rotation.set(-Math.PI / 2 + range(r, -0.4, 0.4), r() * 6.283, 0);
    const s = range(r, 0.5, 1.5); d.scale.set(s, s, s);
  }, { name: 'grit', cast: false, receive: true }));

  /* ---------------- 支撑竹竿（剪定跡・縛り・土はね） ---------------- */
  const stakeH = h * 1.55;
  for (let i = 0; i < P.stakeN; i++) {
    const x = -len / 2 + ((i + 0.5) / P.stakeN) * len + range(rnd, -0.1, 0.1);
    const front = i % 2 === 0 ? 1 : -1;
    const zBase = front * (P.th / 2 + 0.06);
    const zTop = front * (P.th * 0.10);
    stick(g, [x, 0.0, zBase], [x + range(rnd, -0.03, 0.03), stakeH, zTop], 0.017, 0.013, matStake, 4, 'stake');
    // 竹の節
    for (let k = 1; k < 4; k++) {
      const t = k / 4;
      const node = mesh(tor(0.018, 0.004, 4, 9), matStake, {
        pos: [x, stakeH * t, zBase * (1 - t) + zTop * t], name: 'bamboo-node',
      });
      node.rotation.x = Math.PI / 2 + range(rnd, -0.12, 0.12);
      g.add(node);
    }
    // 縛り（ビニール紐 2 段：刈り面を押さえる）
    for (const yy of [stakeH * 0.42, stakeH * 0.74]) {
      const tie = grp('tie', { pos: [x, yy, zBase * 0.5] });
      const loop = mesh(tor(0.055, 0.007, 4, 10), matTie, { rot: [Math.PI / 2, 0, rnd() * 2], name: 'tie-loop' });
      tie.add(loop);
      const knot = mesh(cyl(0.011, 0.013, 0.024, 6), matTie, { pos: [0.02, 0.012, 0.03], rot: [0.6, 0, 0.8], name: 'tie-knot' });
      tie.add(knot);
      g.add(tie);
    }
    // 竹竿の先端（鋏で落とした=cut 面）
    const cutTip = mesh(cyl(0.013, 0.0145, 0.012, 6), MAT.wood({ light: '#e2d3a6', dark: '#bda878' }), { pos: [x + 0.005, stakeH, zTop], name: 'stake-cut' });
    cutTip.rotation.z = range(rnd, -0.25, 0.25);
    g.add(cutTip);
  }
  // 横通し竹（支柱を縫うように：前後交互の竹竿を結ぶ）
  const railN = Math.max(3, P.stakeN);
  for (let i = 0; i < railN - 1; i++) {
    const x0 = -len / 2 + ((i + 0.5) / railN) * len, x1 = -len / 2 + ((i + 1.5) / railN) * len;
    const f0 = i % 2 === 0 ? 1 : -1, f1 = (i + 1) % 2 === 0 ? 1 : -1;
    stick(g, [x0, stakeH * 0.72, f0 * (P.th / 2 + 0.05)], [x1, stakeH * 0.70, f1 * (P.th / 2 + 0.05)], 0.012, 0.011, matStake, 2, 'stake-rail');
  }

  /* ---------------- 剪定跡（切断された枝の切り口が表面に点在） ---------------- */
  const nCut = Math.round(len * 5);
  g.add(inst(cyl(0.006, 0.009, 0.03, 5), MAT.wood({ light: '#c9b184', dark: '#8a7350' }), nCut, (i, d, r) => {
    const x = range(r, -len / 2, len / 2);
    const y = hTop(x) * range(r, 0.35, 0.98);
    const z = (r() > 0.5 ? 1 : -1) * halfT(x, y) * 1.02;
    d.position.set(x, y, z);
    d.rotation.set(Math.PI / 2 + range(r, -0.5, 0.5), 0, range(r, -0.9, 0.9));
    const s = range(r, 0.7, 1.8); d.scale.set(s, s, s);
  }, { name: 'prune-stubs', cast: false }));

  /* ---------------- 経年（4 箇所以上） ---------------- */
  // 1) 足元の苔（北向き＝−Z 面：下面が地面下に潜らない高さ管理）
  weather(g, { kind: 'moss', w: len * 0.55, h: 0.18, pos: [-len * 0.15, 0.17, -P.th * 0.52], rot: [0, Math.PI, 0], color: PAL.moss, opacity: 0.5, seed: seed + 21, density: 1.6, count: 2, spread: 0.03 });
  // 2) 内部の枯れ込み・土はね（刈り込むと中が空く＝実生垣の定番）
  weather(g, { kind: 'dirt', w: len * 0.8, h: h * 0.44, pos: [0, h * 0.31, P.th * 0.48], rot: [0, 0, 0], color: '#4d3f2c', opacity: 0.45, seed: seed + 27, density: 1.4, count: 2, spread: 0.04 });
  // 3) 竹竿の褪色・先端の割れ
  weather(g, { kind: 'scratch', w: 0.09, h: stakeH * 0.48, pos: [len * 0.22, stakeH * 0.56, P.th * 0.36], rot: [0, 0.3, 0], color: '#efe6c8', opacity: 0.4, seed: seed + 31, density: 1.2 });
  // 4) 土帯からの泥流出（歩道側＝+Z に薄く伸ばす）
  weather(g, { kind: 'dirt', w: len * 0.9, h: 0.26, pos: [0.1, 0.071, P.th / 2 + 0.16], rot: [-Math.PI / 2, 0, 0], color: '#6b5a41', opacity: 0.42, seed: seed + 37, density: 1.2, count: 2, spread: 0.02 });
  // 5) 空いた株元（欠株＝剪定失敗の跡：短い切り株＋土窪）
  const gapX = -len / 2 + len * (0.20 + rnd() * 0.6);
  const stump = mesh(cyl(0.028, 0.036, 0.11, 8), matWood, { pos: [gapX, 0.055, 0], name: 'stump' });
  g.add(stump);
  g.add(mesh(tor(0.055, 0.012, 4, 10), matSoil, { pos: [gapX, 0.07, 0], rot: [Math.PI / 2, 0, 0], name: 'stump-collar' }));

  return finish(g, { outline: 'thin' });
}

export { build, build as default, meta };
