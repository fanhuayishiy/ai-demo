//  assets/flora/ground-cover.js —— 地被ディテール（地面に贴う薄層、2〜6mm 浮かしで z-fighting 回避）
//  kind:
//   'moss'            苔（3 層のフェザードアルファ＋苔株・小石・枯れ葉）
//   'fallen-petals'   桜吹雪の堆积（風下に寄せる・3 トーン・水たまりに張り付いた分）
//   'weeds-crack'     舗装亀裂の雑草（裂け目・タンポポ/オオバコ/カタバム・欠けた舗装片）
//   'dirt-patch'      むき出し土斑（3 トーン・玉石・土塊・踏み固め・流出舌）
//  単位メートル / 原点＝接地面中心 / +Y 上 / 正面 +Z / rand(seed) のみ使用（Math.random 不使用）
import * as THREE from 'three';
import { grp, mesh, cyl, rbox, sph, cone, tor, plane, circ, finish, rand, range, weather, inst } from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX, makeCanvas, toTexture, memo, mulberry32 } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'ground-cover',
  real: [3, 0.14, 3],
  origin: 'ground-center',
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));
const rq = (v) => Math.max(0.001, Math.round(v * 1000) / 1000);

/* ---------------- 羽化アルファマスク（黒背景＋白斑：alphaMap は .g を参照） ---------------- */
function blobMask(key, { blobs = 13, spread = 0.36, hard = 0.62, seed = 3 } = {}) {
  return memo(`gc|blob|${key}|${blobs}|${spread}|${hard}|${seed}`, () => {
    const cv = makeCanvas(256);
    if (!cv) return toTexture(null);
    cv.rnd = mulberry32(seed);                       // canvas 内蔵 rnd を差し替え（呼び出しごとに別模様）
    const { g, w, h, rnd } = cv;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < blobs; i++) {
      const cx = w / 2 + (rnd() - 0.5) * w * spread * 2;
      const cy = h / 2 + (rnd() - 0.5) * h * spread * 2;
      const rad = w * (0.09 + rnd() * 0.2);
      const gr = g.createRadialGradient(cx, cy, rad * (1 - hard), cx, cy, rad);
      gr.addColorStop(0, '#fff');
      gr.addColorStop(0.55, 'rgba(255,255,255,0.75)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      const n = 13;
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * 6.283;
        const rr = rad * (0.62 + 0.38 * Math.sin(a * (2 + (i % 3)) + i));
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fill();
    }
    return toTexture(cv, { repeat: 1, srgb: false });
  });
}
/** 亀裂マスク（ジグザグの白線＝裂け目） */
function crackMask(key, { lines = 3, seed = 5 } = {}) {
  return memo(`gc|crack|${key}|${lines}|${seed}`, () => {
    const cv = makeCanvas(256);
    if (!cv) return toTexture(null);
    cv.rnd = mulberry32(seed);
    const { g, w, h, rnd } = cv;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < lines; i++) {
      const pts = [];
      let x = w * (0.04 + rnd() * 0.1), y = h * (0.2 + rnd() * 0.6);
      pts.push([x, y]);
      for (let k = 0; k < 16; k++) { x += w * (0.03 + rnd() * 0.06); y += (rnd() - 0.5) * h * 0.1; pts.push([x, y]); }
      for (const [wd, al] of [[13, 0.22], [7, 0.55], [3.2, 1]]) {
        g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = wd;
        g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      }
      // 分岐
      if (rnd() > 0.4) {
        const b = pts[(rnd() * pts.length) | 0];
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(b[0], b[1]);
        for (let k = 0; k < 6; k++) g.lineTo(b[0] + (rnd() - 0.3) * w * 0.14, b[1] + (rnd() - 0.5) * h * 0.18);
        g.stroke();
      }
    }
    return toTexture(cv, { repeat: 1, srgb: false });
  });
}
/** 薄葉（花弁・落葉）カード */
function cardGeo(w, h, bend = 0.02, seg = 1) {
  const g = plane(w, h, 1, seg).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = cl((p.getY(i) + h / 2) / h, 0, 1);
    p.setZ(i, Math.pow(t, 1.8) * bend);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
function bladeGeo(w, h, bend = 0.4, seg = 3) {
  const g = plane(w, h, 1, seg).clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = cl((p.getY(i) + h / 2) / h, 0, 1);
    p.setX(i, p.getX(i) * (1 - 0.6 * t * t));
    p.setZ(i, Math.pow(t, 1.9) * h * bend);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}

export function build(options = {}) {
  const area = Array.isArray(options.area) ? options.area : [3, 3];
  const W = area[0] ?? 3, D = area[1] ?? 3;
  const kind = ['moss', 'fallen-petals', 'weeds-crack', 'dirt-patch'].includes(options.kind) ? options.kind : 'moss';
  const seed = (options.seed ?? 101) | 0;
  const rnd = rand(seed);
  const g = grp('ground-cover-' + kind);

  /** 羽化レイヤ：y ミリメートルで重ね、マスク違い＝輪郭が揃わない。
   *  面内回転（spin）で AABB が膨らまないよう w/k・d/k に縮める → area 指定を守れる */
  function layer(y, color, mask, { map, alphaTest = 0.38, opacity, w = W, d = D, name = 'layer', rough = 1, sat = 1.02 } = {}) {
    const square = Math.min(w, d) / Math.max(w, d) > 0.62;          // 帯状（亀裂・側溝）は回さない
    const spin = square ? rnd() * 0.6 : 0;
    const k = Math.abs(Math.cos(spin)) + Math.abs(Math.sin(spin));
    const m = mesh(plane(w / k, d / k), MAT.paint(color, {
      map, alphaMap: mask, alphaTest, side: THREE.DoubleSide, steps: 3,
      spec: 0.05, specPower: 16, sheen: 0.01, shadowAmt: 0.92, sat, rough,
      transparent: opacity != null, opacity, uv: { repeat: [1, 1] },
    }), { name, pos: [0, y, 0], rot: [-Math.PI / 2, 0, spin], cast: false, receive: true });
    g.add(m);
    return m;
  }
  const scatter = (n, gen) => { const a = []; for (let i = 0; i < n; i++) a.push(gen()); return a; };
  /** inst で色を乗せる版（海量同质の葉・花弁・石。色阶は配列側で決める） */
  const placeC = (arr, geo, mat, name, opts = {}) => {
    if (!arr.length) return;
    g.add(inst(geo, mat, arr.length, (i, d, r, col) => {
      const s = arr[i];
      d.position.set(s.x, s.y, s.z);
      d.rotation.set(s.rx, s.ry, s.rz);
      d.scale.set(s.s, s.s2 ?? s.s, s.s3 ?? 1);
      if (s.c) col.setRGB(s.c[0], s.c[1], s.c[2]);
    }, { name, cast: false, receive: true, ...opts }));
  };

  /** 伏せるカードを地面に「座らせる」：カードを包む box の 8 隅を回して最低点を出す
   *  （ry で幅が z 方向に寝るので、2 隅だと地面めり込みを見逃す） */
  const _eu = new THREE.Euler(), _v = new THREE.Vector3();
  const seat = (s, gw, gh, min = 0.0015) => {
    _eu.set(s.rx, s.ry, s.rz, 'XYZ');
    const sx = (s.s ?? 1) * gw / 2, sy = (s.s2 ?? s.s ?? 1) * gh, sz = (s.s ?? 1) * gw / 2;
    let lo = 0;
    for (const fx of [-sx, sx]) for (const fy of [0, sy]) for (const fz of [-sz, sz]) {
      _v.set(fx, fy, fz).applyEuler(_eu);
      if (_v.y < lo) lo = _v.y;
    }
    s.y = Math.max(s.y, min - lo);
    return s;
  };

  const matDirt = MAT.concrete({ base: PAL.dirt, repeat: 4 });
  const matDirtDark = MAT.concrete({ base: '#6d5c46', repeat: 3 });
  const matGravel = MAT.ballast({ color: PAL.ballast, repeat: 10 });
  const matTwig = MAT.wood({ light: PAL.woodWeathered, dark: PAL.woodDark, repeat: 1, uv: { repeat: [1, 2] } });

  /* =========================================================
   *  kind 別
   * =======================================================*/
  if (kind === 'moss') {
    const LEV = [
      { y: 0.0022, c: '#5c7746', m: blobMask('moss-a', { blobs: 15, spread: 0.42, hard: 0.5, seed: seed + 1 }), tex: TEX.grass({ base: '#5c7746', repeat: 6 }).map },
      { y: 0.0038, c: PAL.moss, m: blobMask('moss-b', { blobs: 11, spread: 0.34, hard: 0.6, seed: seed + 7 }), tex: TEX.grass({ base: PAL.moss, repeat: 7 }).map },
      { y: 0.0054, c: '#93ad62', m: blobMask('moss-c', { blobs: 8, spread: 0.26, hard: 0.72, seed: seed + 13 }), tex: TEX.grass({ base: '#93ad62', repeat: 8 }).map },
    ];
    LEV.forEach((l, i) => layer(l.y, l.c, l.m, { map: l.tex, alphaTest: 0.4, name: 'moss-layer' + i, sat: 1.05 }));
    // 乾燥して茶色くなった苔（斑）
    layer(0.0062, '#a08a5c', blobMask('moss-dry', { blobs: 7, spread: 0.3, hard: 0.66, seed: seed + 19 }), { map: TEX.grass({ base: '#a08a5c', repeat: 7 }).map, alphaTest: 0.45, name: 'moss-dry', sat: 0.9 });
    // 苔株（盛り上がり）
    placeC(scatter(Math.round(W * D * 22), () => {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.62);
      const s = range(rnd, 0.35, 1.15);
      return { x: Math.cos(a) * rr * W * 0.47, y: 0.006, z: Math.sin(a) * rr * D * 0.47, s, s2: s * 0.55, s3: s, rx: 0, ry: rnd() * 6.283, rz: 0, c: [0.8 + rnd() * 0.36, 0.9 + rnd() * 0.26, 0.66 + rnd() * 0.3] };
    }), sph(0.026, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.leaf({ color: '#dcebc6', map: TEX.leafCluster({ base: PAL.moss, seed: seed + 23 }), alphaTest: 0.42, emissiveIntensity: 0.04, shadowAmt: 0.95 }), 'moss-tufts');
    // 載っている落葉・小石・折れた小枝（経年 3 点）
    const leafMat = MAT.leaf({ color: '#e2cba1', map: TEX.leafCluster({ base: '#9b7a4e', seed: seed + 29 }), alphaTest: 0.42, emissiveIntensity: 0, shadowAmt: 1 });
    placeC(scatter(Math.round(W * D * 6), () => {
      const s = range(rnd, 0.6, 1.4);
      return seat({
        x: range(rnd, -W / 2, W / 2), y: 0.0072 + rnd() * 0.002, z: range(rnd, -D / 2, D / 2), s, s2: s,
        rx: -Math.PI / 2 + range(rnd, -0.22, 0.22), ry: rnd() * 6.283, rz: range(rnd, -0.35, 0.35),
        c: [0.8 + rnd() * 0.34, 0.7 + rnd() * 0.3, 0.45 + rnd() * 0.3],
      }, 0.062, 0.048);
    }), cardGeo(0.062, 0.048, 0.008, 2), leafMat, 'moss-litter');
    placeC(scatter(Math.round(W * D * 3), () => {
      const s = range(rnd, 0.4, 1.3);
      return { x: range(rnd, -W / 2, W / 2), y: 0.0068, z: range(rnd, -D / 2, D / 2), s, s2: s * 0.6, s3: s, rx: range(rnd, -0.3, 0.3), ry: rnd() * 6.283, rz: range(rnd, -0.3, 0.3), c: [0.85 + rnd() * 0.3, 0.83 + rnd() * 0.3, 0.78 + rnd() * 0.3] };
    }), sph(0.021, 6, 5), matGravel, 'moss-pebbles');
    for (let i = 0; i < 2; i++) {
      const L = range(rnd, W * 0.22, W * 0.5);
      const st = mesh(cyl(0.006, 0.011, rq(L), 6), matTwig, { pos: [range(rnd, -W * 0.3, W * 0.3), 0.013, range(rnd, -D * 0.35, D * 0.35)], name: 'broken-twig' });
      st.rotation.set(Math.PI / 2 + range(rnd, -0.1, 0.1), 0, rnd() * 6.283);
      g.add(st);
      g.add(mesh(cyl(0.004, 0.005, rq(L * 0.32), 5), matTwig, { pos: [st.position.x + 0.03, 0.021, st.position.z - 0.05], rot: [1.2, 0.5, 0.9], name: 'twig-branch' }));
    }
    // 土の乗り上げ（苔の边缘に被る薄塵）
    layer(0.0068, PAL.dirt, blobMask('moss-dust', { blobs: 9, spread: 0.48, hard: 0.4, seed: seed + 31 }), { map: TEX.concrete({ base: PAL.dirt, repeat: 5 }).map, alphaTest: 0.42, name: 'moss-dust', opacity: 0.9 });

  } else if (kind === 'fallen-petals') {
    // 地面を薄く染める花弁膜（湿って色が付いた面）
    layer(0.002, '#f3dbe2', blobMask('petal-film', { blobs: 12, spread: 0.44, hard: 0.45, seed: seed + 2 }), { map: TEX.petal({ tone: 0, mode: 'cluster' }), alphaTest: 0.3, opacity: 0.5, name: 'petal-film', sat: 1.0 });
    // 水たまり（花弁が張り付く）
    for (let i = 0; i < 2; i++) {
      const px = range(rnd, -W * 0.28, W * 0.28), pz = range(rnd, -D * 0.28, D * 0.28);
      const pw = range(rnd, 0.22, 0.46);
      const pool = mesh(plane(pw, pw * range(rnd, 0.6, 0.9)), MAT.water({ opacity: 0.55, color: '#93a8a6' }), { pos: [px, 0.0026, pz], rot: [-Math.PI / 2, 0, rnd() * 3], name: 'puddle', cast: false });
      g.add(pool);
      const edge = layer(0.0032, '#6f6a5f', blobMask('pool-edge' + i, { blobs: 5, spread: 0.2, hard: 0.85, seed: seed + 5 + i }), { alphaTest: 0.5, w: pw * 1.5, d: pw * 1.5, name: 'puddle-wetring', opacity: 0.6 });
      edge.position.set(px, 0.0032, pz);
    }
    // 花弁 inst（3 トーン＋褐色進み・風下に寄せる偏り）
    const PET = [0, 1, 2].map((t) => MAT.petal({ map: TEX.petal({ tone: t, mode: 'single' }), alphaTest: 0.4, glow: 0.12 + t * 0.04 }));
    const brown = MAT.petal({ color: '#dcc4a8', map: TEX.petal({ tone: 0, mode: 'single' }), alphaTest: 0.4, glow: 0, shadowAmt: 1, rim: 0.2 });
    const lists = [[], [], [], []];
    const N = Math.round(W * D * 46);
    for (let i = 0; i < N; i++) {
      // 風下＝+X,+Z 寄りに濃くなる分布
      const bias = Math.pow(rnd(), 0.62);
      const a = rnd() * 6.283;
      const x = (Math.cos(a) * bias) * W * 0.42 + W * 0.1 * bias * bias;
      const z = (Math.sin(a) * bias) * D * 0.42 + D * 0.08 * bias * bias;
      if (Math.abs(x) > W / 2 || Math.abs(z) > D / 2) continue;
      const q = rnd();
      const tier = q > 0.86 ? 3 : q > 0.6 ? 2 : q > 0.3 ? 1 : 0;
      const s = range(rnd, 0.55, 1.3);
      const curl = rnd() > 0.72;
      lists[tier].push(seat({
        x, y: 0.0035 + rnd() * 0.0045 + (curl ? 0.003 : 0), z, s, s2: s * (curl ? 0.9 : 1),
        rx: -Math.PI / 2 + range(rnd, -0.42, 0.42) + (curl ? range(rnd, 0.2, 0.5) : 0),
        ry: rnd() * 6.283, rz: range(rnd, -0.55, 0.55),
        c: [0.94 + rnd() * 0.14, 0.93 + rnd() * 0.12, 0.9 + rnd() * 0.16],
      }, 0.062, 0.058));
    }
    const pGeo = cardGeo(0.062, 0.058, 0.012, 2);
    lists.forEach((arr, ti) => {
      const arr2 = arr.map((s) => ({ ...s }));
      if (ti < 3) {
        // TEX.petal の map を使うため色は instanceColor で微調
        g.add(inst(pGeo, PET[ti], arr2.length, (i, d, r, col) => {
          const s = arr2[i];
          d.position.set(s.x, s.y, s.z); d.rotation.set(s.rx, s.ry, s.rz); d.scale.set(s.s, s.s2, 1);
          col.setRGB(s.c[0], s.c[1], s.c[2]);
        }, { name: 'petals-t' + ti, cast: false, receive: true }));
      } else {
        placeC(arr2, pGeo, brown, 'petals-brown');
      }
    });
    // 角に溜まった花団子（盛り上がり・枚数多め）
    const pileX = W * 0.32, pileZ = -D * 0.3;
    placeC(scatter(Math.round(W * D * 9), () => {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.5) * 0.26;
      const s = range(rnd, 0.6, 1.2);
      return seat({ x: pileX + Math.cos(a) * rr, y: 0.006 + (0.26 - rr) * 0.11, z: pileZ + Math.sin(a) * rr * 0.8, s, s2: s, rx: -Math.PI / 2 + range(rnd, -0.62, 0.62), ry: rnd() * 6.283, rz: range(rnd, -0.62, 0.62), c: [1, 0.98, 0.98] }, 0.062, 0.058);
    }), pGeo, PET[1], 'petal-pile');
    // 桜の断枝・萼（花殻）
    const stub = mesh(cyl(0.004, 0.006, 0.075, 5), matTwig, { pos: [pileX - 0.12, 0.007, pileZ + 0.06], rot: [Math.PI / 2, 0, 0.7], name: 'petal-stub' });
    g.add(stub);
    for (let i = 0; i < 5; i++) {
      g.add(mesh(tor(0.006, 0.0022, 4, 7), MAT.leaf({ color: '#c6a06a', alphaTest: 0, shadowAmt: 1 }), { pos: [range(rnd, -W * 0.3, W * 0.3), 0.004, range(rnd, -D * 0.3, D * 0.3)], rot: [-Math.PI / 2 + range(rnd, -0.3, 0.3), 0, 0], name: 'calyx' }));
    }
    // 泥の跳ね跡（撒水・雨はね＝経年）
    weather(g, { kind: 'dirt', w: W * 0.7, h: D * 0.55, pos: [-W * 0.18, 0.004, D * 0.12], rot: [-Math.PI / 2, 0, 0], color: '#7d6f5a', opacity: 0.32, seed: seed + 37, density: 1.6, count: 2, spread: 0.004 });

  } else if (kind === 'weeds-crack') {
    // 亀裂そのもの（暗い隙間）＋ 中に溜まった土
    layer(0.0016, '#2f2c30', crackMask('crack-main', { lines: 2, seed: seed + 3 }), { alphaTest: 0.35, name: 'crack-void', sat: 0.6 });
    layer(0.0028, PAL.dirt, crackMask('crack-soil', { lines: 2, seed: seed + 3 }), { map: TEX.concrete({ base: PAL.dirt, repeat: 3 }).map, alphaTest: 0.42, name: 'crack-soil' });
    // 裂け目際の苔・白華
    layer(0.0038, PAL.moss, blobMask('crack-moss', { blobs: 10, spread: 0.42, hard: 0.5, seed: seed + 9 }), { map: TEX.grass({ base: PAL.moss, repeat: 7 }).map, alphaTest: 0.45, name: 'crack-moss' });
    layer(0.0046, '#d8d3c6', blobMask('crack-efflo', { blobs: 8, spread: 0.46, hard: 0.42, seed: seed + 15 }), { alphaTest: 0.5, name: 'crack-efflorescence', opacity: 0.7, sat: 0.5 });
    // 舗装の欠け（持ち上がった破片・下地が出た穴）
    for (let i = 0; i < 3; i++) {
      const px = range(rnd, -W * 0.34, W * 0.34), pz = range(rnd, -D * 0.34, D * 0.34);
      const sc = range(rnd, 0.7, 1.5);
      const flake = mesh(rbox(0.13 * sc, 0.012, 0.1 * sc, 0.004, 2), MAT.paving({ color: PAL.sidewalk, cells: 2, repeat: 1 }), { pos: [px, 0.009, pz], rot: [range(rnd, -0.12, 0.12), rnd() * 3, range(rnd, -0.1, 0.1)], name: 'asphalt-flake' });
      g.add(flake);
      const pit = mesh(circ(rq(0.055 * sc), 10), MAT.concrete({ base: '#5d5348', repeat: 2 }), { pos: [px + 0.09 * sc, 0.0022, pz - 0.05 * sc], rot: [-Math.PI / 2, 0, rnd() * 3], name: 'spalled-pit' });
      g.add(pit);
    }
    // 裂け目に沿って生える草（inst 3 階層）
    const WG = [
      MAT.leaf({ color: '#c3d8b0', map: TEX.leafCluster({ base: '#3f5c33', seed: seed + 21 }), alphaTest: 0.44, shadowAmt: 0.96, emissiveIntensity: 0.02 }),
      MAT.leaf({ color: '#dcecc6', map: TEX.leafCluster({ base: PAL.grassDark, seed: seed + 27 }), alphaTest: 0.44, shadowAmt: 0.86, emissiveIntensity: 0.08 }),
      MAT.leaf({ color: '#f2f7dc', map: TEX.leafCluster({ base: PAL.leafYoung, seed: seed + 33 }), alphaTest: 0.44, shadowAmt: 0.74, emissiveIntensity: 0.16, rim: 0.46 }),
    ];
    const crackPath = [];
    {
      let x = -W * 0.44, z = range(rnd, -D * 0.2, D * 0.2);
      for (let i = 0; i < 18; i++) { crackPath.push(V(x, 0.004, z)); x += W / 18; z += range(rnd, -0.1, 0.1); }
    }
    const curve = new THREE.CatmullRomCurve3(crackPath, false, 'catmullrom', 0.4);
    const wLists = [[], [], []];
    for (let i = 0; i < Math.round(W * 26); i++) {
      const t = Math.pow(rnd(), 0.8);
      const p = curve.getPointAt(t);
      const off = range(rnd, -0.075, 0.075);
      const s = range(rnd, 0.4, 1.7);
      wLists[((rnd() * 3) | 0) % 3].push(seat({
        x: p.x, y: 0.004, z: p.z + off, s, s2: s * range(rnd, 0.7, 1.7),
        rx: range(rnd, -0.4, 0.4), ry: rnd() * 6.283, rz: range(rnd, -0.5, 0.5),
        c: [0.85 + rnd() * 0.3, 0.92 + rnd() * 0.2, 0.75 + rnd() * 0.3],
      }, 0.03, 0.21));
    }
    wLists.forEach((arr, ti) => placeC(arr, bladeGeo(0.03, 0.14, 0.45, 3), WG[ti], 'crack-grass-' + ti));
    // 単体の雑草（タンポポ・オオバコ・カタバム・スギナ）＝1 株ずつ独立
    const gLeafLong = bladeGeo(0.022, 0.12, 0.55, 4);
    function dandelion(x, z, withFluff) {
      const f = grp('dandelion', { pos: [x, 0.004, z], rotY: rnd() * 360 });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.283 + rnd() * 0.4;
        const l = mesh(gLeafLong, WG[1], { pos: [Math.cos(a) * 0.012, 0.001, Math.sin(a) * 0.012], rot: [Math.PI / 2 - range(rnd, 1.15, 1.5), -a + Math.PI / 2, 0], name: 'dand-leaf' });
        l.scale.setScalar(range(rnd, 0.7, 1.15));
        f.add(l);
      }
      const hgt = range(rnd, 0.075, 0.13);
      f.add(mesh(cyl(0.0022, 0.003, hgt, 5), WG[1], { pos: [range(rnd, -0.01, 0.01), hgt / 2, range(rnd, -0.01, 0.01)], rot: [range(rnd, -0.18, 0.18), 0, range(rnd, -0.18, 0.18)], name: 'dand-scape' }));
      if (withFluff) {
        const head = grp('fluff', { pos: [0.006, hgt + 0.004, 0] });
        const n = 34;
        head.add(inst(cardGeo(0.006, 0.016, 0.004, 1), MAT.leaf({ color: '#f6f3ea', alphaTest: 0, shadowAmt: 0.7, rim: 0.5, rimColor: '#ffffff' }), n, (i, d, r) => {
          const a = r() * 6.283, e = Math.acos(2 * r() - 1) - Math.PI / 2;
          d.position.set(Math.cos(a) * Math.cos(e) * 0.012, Math.sin(e) * 0.012, Math.sin(a) * Math.cos(e) * 0.012);
          d.rotation.set(e, a, 0);
          d.scale.setScalar(range(r, 0.7, 1.3));
        }, { name: 'fluff-threads', cast: false }));
        head.add(mesh(sph(0.005, 6, 5), MAT.food({ color: '#efeadd', spec: 0.1, steps: 2 }), { name: 'fluff-core' }));
        f.add(head);
      } else {
        f.add(mesh(sph(0.013, 8, 6), MAT.food({ color: '#e8cf4a', spec: 0.24, steps: 3, shadowAmt: 0.72 }), { pos: [0.006, hgt + 0.006, 0], scale: [1, 0.62, 1], name: 'dand-flower' }));
      }
      return f;
    }
    function plantain(x, z) {                                    // オオバコ：平ろゼット＋穂
      const f = grp('plantain', { pos: [x, 0.004, z], rotY: rnd() * 360 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.283 + rnd() * 0.5;
        const l = mesh(bladeGeo(0.03, 0.09, 0.18, 3), WG[1], { pos: [Math.cos(a) * 0.014, 0.002, Math.sin(a) * 0.014], rot: [Math.PI / 2 - range(rnd, 1.32, 1.52), -a + Math.PI / 2, 0], name: 'pl-leaf' });
        l.scale.setScalar(range(rnd, 0.75, 1.2));
        f.add(l);
      }
      for (let i = 0; i < 2; i++) {
        const hh = range(rnd, 0.06, 0.11);
        f.add(mesh(cyl(0.0018, 0.0022, hh, 5), WG[0], { pos: [range(rnd, -0.012, 0.012), hh / 2, range(rnd, -0.012, 0.012)], rot: [range(rnd, -0.12, 0.12), 0, range(rnd, -0.12, 0.12)], name: 'pl-spike' }));
        f.add(mesh(cyl(0.0035, 0.0032, 0.022, 6), MAT.food({ color: '#8d7f5c', spec: 0.12, steps: 2 }), { pos: [0.004, hh + 0.008, 0], name: 'pl-seedhead' }));
      }
      return f;
    }
    function woodSorrel(x, z) {                                  // カタバム：三つ葉＋黄花
      const f = grp('wood-sorrel', { pos: [x, 0.004, z], rotY: rnd() * 360 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * 6.283 + rnd();
        const hh = range(rnd, 0.02, 0.045);
        f.add(mesh(cyl(0.0012, 0.0015, hh, 4), WG[1], { pos: [Math.cos(a) * 0.012, hh / 2, Math.sin(a) * 0.012], rot: [Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25], name: 'ws-stalk' }));
        const leaf = mesh(circ(0.011, 8), WG[2], { pos: [Math.cos(a) * 0.024, hh + 0.002, Math.sin(a) * 0.024], rot: [-Math.PI / 2 + range(rnd, -0.4, 0.4), 0, rnd() * 3], name: 'ws-leaf' });
        leaf.scale.set(1, 0.72, 1);
        f.add(leaf);
      }
      f.add(mesh(sph(0.0055, 6, 5), MAT.food({ color: '#e6d34a', spec: 0.24, steps: 2 }), { pos: [0.01, 0.042, -0.008], scale: [1, 0.7, 1], name: 'ws-flower' }));
      return f;
    }
    function horsetail(x, z) {                                   // スギナ（春の胞子茎＋栄養茎）
      const f = grp('horsetail', { pos: [x, 0.004, z], rotY: rnd() * 360 });
      const hh = range(rnd, 0.05, 0.1);
      f.add(mesh(cyl(0.0025, 0.0035, hh, 6), MAT.leaf({ color: '#d9cfae', alphaTest: 0, shadowAmt: 0.95, emissiveIntensity: 0.02 }), { pos: [0, hh / 2, 0], rot: [range(rnd, -0.14, 0.14), 0, range(rnd, -0.14, 0.14)], name: 'hs-spore-stem' }));
      f.add(mesh(cone(0.006, 0.016, 6), MAT.food({ color: '#e6dcc0', spec: 0.14, steps: 2 }), { pos: [0.002, hh + 0.006, 0], name: 'hs-spore-head' }));
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + rnd();
        f.add(mesh(cyl(0.0018, 0.0026, hh * 0.85, 5), WG[0], { pos: [Math.cos(a) * 0.014, hh * 0.42, Math.sin(a) * 0.014], rot: [Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12], name: 'hs-veg-stem' }));
      }
      return f;
    }
    const weeds = grp('weeds');
    g.add(weeds);
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.2 + rnd() * 0.6) / 6;
      const p = curve.getPointAt(cl(t, 0, 1));
      const zz = p.z + range(rnd, -0.09, 0.09);
      const pick = rnd();
      weeds.add(pick > 0.68 ? dandelion(p.x, zz, pick > 0.86) : pick > 0.44 ? plantain(p.x, zz) : pick > 0.2 ? woodSorrel(p.x, zz) : horsetail(p.x, zz));
    }
    // 前年の枯れた茎（経年）
    for (let i = 0; i < 3; i++) {
      const p = curve.getPointAt(rnd());
      const hh = range(rnd, 0.06, 0.12);
      const st = mesh(cyl(0.0016, 0.0026, hh, 5), matTwig, { pos: [p.x + range(rnd, -0.06, 0.06), hh / 2, p.z + range(rnd, -0.08, 0.08)], rot: [range(rnd, -0.5, 0.5), 0, range(rnd, -0.5, 0.5)], name: 'last-year-stem' });
      weeds.add(st);
    }

  } else {
    /* ---- dirt-patch：むき出し土斑 ---- */
    layer(0.002, PAL.dirt, blobMask('dirt-a', { blobs: 9, spread: 0.4, hard: 0.55, seed: seed + 1 }), { map: TEX.concrete({ base: PAL.dirt, repeat: 5 }).map, alphaTest: 0.4, name: 'dirt-base' });
    layer(0.0034, '#7d6a4f', blobMask('dirt-b', { blobs: 7, spread: 0.3, hard: 0.6, seed: seed + 11 }), { map: TEX.concrete({ base: '#7d6a4f', repeat: 4 }).map, alphaTest: 0.42, name: 'dirt-moist' });
    layer(0.0048, '#b3a081', blobMask('dirt-c', { blobs: 12, spread: 0.38, hard: 0.42, seed: seed + 17 }), { map: TEX.concrete({ base: '#b3a081', repeat: 6 }).map, alphaTest: 0.45, name: 'dirt-sandy' });
    // 踏み固められた中央（淡く締まった面）
    layer(0.0056, '#c2b49b', blobMask('dirt-packed', { blobs: 4, spread: 0.16, hard: 0.72, seed: seed + 23 }), { map: TEX.paving({ color: '#c2b49b', cells: 4, repeat: 3 }).map, alphaTest: 0.5, name: 'dirt-packed', sat: 0.86 });
    // 乾いて割れた土（crack マスクを茶で）
    layer(0.0062, '#57493a', crackMask('dirt-crack', { lines: 4, seed: seed + 29 }), { alphaTest: 0.4, name: 'dirt-mudcracks', w: W * 0.8, d: D * 0.8 });
    // 側溝方向（+Z）へ流出した舌
    {
      const tongue = mesh(plane(W * 0.34, D * 0.3), MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 3 }).map, alphaMap: blobMask('dirt-tongue', { blobs: 5, spread: 0.24, hard: 0.5, seed: seed + 37 }), alphaTest: 0.4, side: THREE.DoubleSide, shadowAmt: 0.94 }), { pos: [W * 0.12, 0.0035, D * 0.34], rot: [-Math.PI / 2, 0, 0.2], name: 'dirt-outflow', cast: false, receive: true });
      g.add(tongue);
    }
    // 玉石・土塊・枯れ枝
    placeC(scatter(Math.round(W * D * 8), () => {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.6);
      const s = range(rnd, 0.35, 1.25);
      return { x: Math.cos(a) * rr * W * 0.48, y: 0.005, z: Math.sin(a) * rr * D * 0.48, s, s2: s * 0.62, s3: s, rx: range(rnd, -0.3, 0.3), ry: rnd() * 6.283, rz: range(rnd, -0.3, 0.3), c: [0.82 + rnd() * 0.34, 0.8 + rnd() * 0.3, 0.74 + rnd() * 0.32] };
    }), sph(0.018, 6, 5), matGravel, 'dirt-pebbles');
    placeC(scatter(Math.round(W * D * 4), () => {
      const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.55) * 0.9;
      const s = range(rnd, 0.5, 1.5);
      return { x: Math.cos(a) * rr * W * 0.44, y: 0.008, z: Math.sin(a) * rr * D * 0.44, s, s2: s * 0.7, s3: s, rx: range(rnd, -0.35, 0.35), ry: rnd() * 6.283, rz: range(rnd, -0.35, 0.35), c: [0.9 + rnd() * 0.2, 0.85 + rnd() * 0.18, 0.7 + rnd() * 0.2] };
    }), rbox(0.032, 0.018, 0.028, 0.006, 1), matDirtDark, 'dirt-clods');
    for (let i = 0; i < 3; i++) {
      const L = range(rnd, W * 0.12, W * 0.34);
      const st = mesh(cyl(0.005, 0.010, rq(L), 6), matTwig, { pos: [range(rnd, -W * 0.3, W * 0.3), 0.011, range(rnd, -D * 0.3, D * 0.3)], rot: [Math.PI / 2 + range(rnd, -0.12, 0.12), 0, rnd() * 6.283], name: 'dirt-twig' });
      g.add(st);
    }
    // 生えかけの雑草（3〜4 叢）
    const DG = [
      MAT.leaf({ color: '#cfdfb6', map: TEX.leafCluster({ base: '#4f6d3c', seed: seed + 41 }), alphaTest: 0.44, shadowAmt: 0.94 }),
      MAT.leaf({ color: '#e9f2d4', map: TEX.leafCluster({ base: PAL.grass, seed: seed + 43 }), alphaTest: 0.44, shadowAmt: 0.84, emissiveIntensity: 0.1 }),
    ];
    for (let c = 0; c < 4; c++) {
      const cx = range(rnd, -W * 0.34, W * 0.34), cz = range(rnd, -D * 0.34, D * 0.34);
      placeC(scatter(9 + ((rnd() * 7) | 0), () => {
        const a = rnd() * 6.283, rr = rnd() * 0.075;
        const s = range(rnd, 0.5, 1.5);
        return seat({ x: cx + Math.cos(a) * rr, y: 0.006, z: cz + Math.sin(a) * rr, s, s2: s * range(rnd, 0.8, 1.6), rx: range(rnd, -0.45, 0.45), ry: rnd() * 6.283, rz: range(rnd, -0.5, 0.5), c: [0.86 + rnd() * 0.28, 0.94 + rnd() * 0.16, 0.74 + rnd() * 0.3] }, 0.026, 0.19);
      }), bladeGeo(0.026, 0.12, 0.5, 3), DG[c % 2], `weed-clump-${c}`);
    }
    // 縁が崩れて芝が剥がれた境目（緑の切れ端を輪に）
    placeC(scatter(Math.round(W * 4), () => {
      const a = rnd() * 6.283;
      const s = range(rnd, 0.4, 1.1);
      return seat({ x: Math.cos(a) * W * (0.42 + rnd() * 0.06), y: 0.004, z: Math.sin(a) * D * (0.42 + rnd() * 0.06), s, s2: s, rx: -Math.PI / 2 + range(rnd, -0.5, 0.5), ry: rnd() * 6.283, rz: 0, c: [0.86, 0.98, 0.72] }, 0.05, 0.04);
    }), cardGeo(0.05, 0.04, 0.008, 2), DG[1], 'torn-turf-edge');
  }

  /* ---------------- 接地感を足す接触影（薄く・大きく） ---------------- */
  const shadow = mesh(plane(W * 0.92, D * 0.92), MAT.decal({ map: blobMask(`sh${kind}`, { blobs: 6, spread: 0.34, hard: 0.35, seed: seed + 57 }), color: '#3a3325', opacity: 0.14, order: 1, side: THREE.DoubleSide }), { pos: [0, 0.0012, 0], rot: [-Math.PI / 2, 0, 0], name: 'contact-dirt', cast: false, receive: false });
  g.add(shadow);

  return finish(g, { outline: 'thin' });
}

export default build;
