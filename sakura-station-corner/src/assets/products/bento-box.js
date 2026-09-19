//  assets/products/bento-box.js —— 総菜弁当（6 variant）
//  構成：PP／パルプ／塗り／木目のトレー（押出フレーム＋底リブ＋フランジ）／
//        御飯（粒凹凸の頂点変位＋個別米粒）／オカズ（唐揚げ・刺身・葉物・ペンネ・天ぷら・飾り）／
//        仕切りバラン・紙ラン・割り箸・伝票／透明 PET 蓋（テーパー＋ドーム）or 印刷蓋 or 紙スリーブ／
//        結露・油滲み・褐変・食べこぼしなどの欠陥。
import * as THREE from 'three';
import { grp, mesh, box, cyl, sph, rbox, capsule, tor, lathe, tubeOf, rand, range, decal } from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';

export const meta = {
  id: 'bento-box',
  real: [0.170, 0.050, 0.120],
  origin: 'ground-center',
  variants: ['chicken', 'sashimi', 'salad', 'pasta', 'tendon', 'ekiben'],
};
export const VARIANTS = meta.variants;

const W = 0.170, H = 0.050, D = 0.120;

const SPEC = {
  chicken: {
    tray: '#25282c', trayKind: 'pp', rice: null, lid: 'dome', sleeve: false,
    name: '唐揚げ弁当', sub: 'FRIED CHICKEN 6pc', bg: '#f4ecdc', accent: '#c8564d',
    chop: false, slip: true, defect: 'condense',
  },
  sashimi: {
    tray: '#efeade', trayKind: 'pulp', rice: '#fbf7ec', lid: 'dome', sleeve: true,
    name: '刺身五種', sub: 'ASSORTED SASHIMI', bg: '#e9f1f4', accent: '#2f6fa8',
    chop: false, slip: false, defect: 'condense',
  },
  salad: {
    tray: '#eceee4', trayKind: 'pulp', rice: null, lid: 'dome', sleeve: true,
    name: '緑色サラダ', sub: 'GREEN SALAD 180g', bg: '#e8f2dc', accent: '#4e8f2c',
    chop: false, slip: false, defect: 'wilt',
  },
  pasta: {
    tray: '#f3eee0', trayKind: 'pp', trayH: 0.0300, rice: null, lid: 'none', sleeve: false,
    name: 'ミートソース', sub: 'MEAT SAUCE PENNE', bg: '#f7e7d2', accent: '#b3492c',
    chop: true, slip: true, defect: 'sauce',
  },
  tendon: {
    tray: '#4b2b25', trayKind: 'lacquer', rice: '#f9f4e6', lid: 'dome', sleeve: true,
    name: '天丼', sub: 'TEMPURA DONBURI', bg: '#efe3cd', accent: '#7a4f22',
    chop: false, slip: false, defect: 'condense',
  },
  ekiben: {
    tray: '#8a5a3a', trayKind: 'wood', rice: '#fbf6ea', lid: 'paper', sleeve: false,
    name: '駅の弁当', sub: 'EKIBEN 彩り', bg: '#f6e9d2', accent: '#c2564a',
    chop: true, slip: false, defect: 'crumb',
  },
};

/* ------------------------------------------------------------- ヘルパー */
const lerp = (a, b, t) => a + (b - a) * t;
function rrPath(s, w, d, r) {
  const x = w / 2, y = d / 2, rr = Math.min(r, x * 0.92, y * 0.92);
  s.moveTo(-x + rr, -y);
  s.lineTo(x - rr, -y); s.quadraticCurveTo(x, -y, x, -y + rr);
  s.lineTo(x, y - rr); s.quadraticCurveTo(x, y, x - rr, y);
  s.lineTo(-x + rr, y); s.quadraticCurveTo(-x, y, -x, y - rr);
  s.lineTo(-x, -y + rr); s.quadraticCurveTo(-x, -y, -x + rr, -y);
}
function frameGeo(w, d, r, t, h) {
  const outer = new THREE.Shape(); rrPath(outer, w, d, r);
  const hole = new THREE.Path(); rrPath(hole, w - t, d - t, Math.max(0.0015, r - t * 0.5));
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false, curveSegments: 5 });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}
function sheetGeo(nu, nv, fn) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv);
    pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** でこぼこ球（揚げ物・団子・具） */
function lumpy(r, ph, amp, ws = 12, hs = 9, squash = 0.86) {
  const g = sph(r, ws, hs).clone();
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const a = Math.atan2(v.z, v.x), e = Math.acos(Math.max(-1, Math.min(1, v.y / Math.max(1e-4, v.length()))));
    const k = 1 + amp * (0.5 * Math.sin(a * 5.3 + e * 4.1 + ph) + 0.3 * Math.sin(a * 9.1 - e * 6.7 + ph * 1.7) + 0.2 * Math.sin(e * 11.3 + ph * 0.6));
    p.setXYZ(i, v.x * k, v.y * k * squash, v.z * k);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
/** 角丸矩形アウトライン（弧長等間隔 n 点・反時計回り） */
function rrOutline(a, b, r, n) {
  r = Math.min(r, a * 0.9, b * 0.9);
  const ax = a - r, az = b - r;
  const items = [
    { l: [[a, -az], [a, az]] },
    { arc: [ax, az, 0, Math.PI / 2] },
    { l: [[ax, b], [-ax, b]] },
    { arc: [-ax, az, Math.PI / 2, Math.PI] },
    { l: [[-a, az], [-a, -az]] },
    { arc: [-ax, -az, Math.PI, Math.PI * 1.5] },
    { l: [[-ax, -b], [ax, -b]] },
    { arc: [ax, -az, Math.PI * 1.5, Math.PI * 2] },
  ];
  let total = 0;
  for (const it of items) {
    it.len = it.l ? Math.hypot(it.l[1][0] - it.l[0][0], it.l[1][1] - it.l[0][1]) : r * Math.PI / 2;
    total += it.len;
  }
  const pts = [];
  for (let i = 0; i < n; i++) {
    let s = (i / n) * total, done = false;
    for (const it of items) {
      if (s > it.len) { s -= it.len; continue; }
      const t = s / it.len;
      if (it.l) pts.push([lerp(it.l[0][0], it.l[1][0], t), lerp(it.l[0][1], it.l[1][1], t)]);
      else {
        const ang = lerp(it.arc[2], it.arc[3], t);
        pts.push([it.arc[0] + r * Math.cos(ang), it.arc[1] + r * Math.sin(ang)]);
      }
      done = true;
      break;
    }
    if (!done) pts.push(pts[pts.length - 1] || [a, 0]);
  }
  return pts;
}
/** テーパー＋ドームの PET 蓋（側壁＋天面ファン。原点は足元 y=0、天面は y=rise） */
function domeLid(a, b, r, taper, rise, n = 42, lv = 6) {
  const ring = rrOutline(a, b, r, n);
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= lv; j++) {
    const t = j / lv;
    const k = 1 - (1 - taper) * Math.pow(t, 2.1);
    const y = rise * Math.pow(t, 0.72);
    for (let i = 0; i < n; i++) {
      pos.push(ring[i][0] * k, y, ring[i][1] * k);
      uv.push(i / n, t);
    }
  }
  for (let j = 0; j < lv; j++) {
    for (let i = 0; i < n; i++) {
      const a1 = j * n + i, c1 = j * n + ((i + 1) % n);
      const b1 = (j + 1) * n + i, d1 = (j + 1) * n + ((i + 1) % n);
      idx.push(a1, b1, c1, c1, b1, d1);
    }
  }
  const ci = pos.length / 3;
  pos.push(0, rise + 0.0002, 0); uv.push(0.5, 1);
  const base = lv * n;
  for (let i = 0; i < n; i++) idx.push(ci, base + i, base + ((i + 1) % n));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function grains(parent, n, mat, geo, area, y, rnd) {
  for (let i = 0; i < n; i++) {
    const gm = mesh(geo, mat, { cast: true, receive: false });
    gm.position.set(range(rnd, area[0], area[1]), y + range(rnd, 0, 0.0012), range(rnd, area[2], area[3]));
    gm.rotation.set(Math.PI / 2 + range(rnd, -0.6, 0.6), range(rnd, 0, 3.1), range(rnd, -0.6, 0.6));
    gm.scale.setScalar(range(rnd, 0.8, 1.1));
    parent.add(gm);
  }
}

/* ------------------------------------------------------------------ build */
export function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const key = String(options.variant ?? 'chicken');
  const sp = SPEC[key] || SPEC.chicken;
  const sc = options.scale ?? 1;

  const g = grp('bento-box');
  const TRAY_H = sp.trayH || (sp.trayKind === 'pp' ? 0.0240 : 0.0258);
  const shellW = W - 0.004, shellD = D - 0.004;
  const INX = shellW / 2 - 0.0042, INZ = shellD / 2 - 0.0042;
  const foodY = TRAY_H - 0.0022;

  /* ---- 素材 ---- */
  const trayMat = sp.trayKind === 'lacquer'
    ? MAT.paint('#4b2b25', { spec: 0.58, specPower: 100, specCut: 0.15, sheen: 0.16, shadowAmt: 0.7, map: TEX.metal({ base: '#4b2b25', worn: 0.22, repeat: 3 }).map })
    : sp.trayKind === 'wood'
      ? MAT.wood({ light: '#b98b57', dark: '#82593a', repeat: 2 })
      : sp.trayKind === 'pulp'
        ? MAT.paper({ color: sp.tray, repeat: 7 })
        : MAT.hardPlastic(sp.tray, { repeat: 5, spec: 0.42, specPower: 58 });
  const riceMat = MAT.rice({ color: sp.rice || '#fbf7ee', spec: 0.36, specPower: 40 });
  const grainGeo = capsule(0.0016, 0.0030, 5);

  /* ---- トレー ---- */
  const tray = grp('tray');
  g.add(tray);
  tray.add(mesh(frameGeo(shellW, shellD, 0.010, 0.0028, TRAY_H), trayMat, { name: 'tray-wall' }));
  tray.add(mesh(box(shellW - 0.009, 0.0018, shellD - 0.009), sp.trayKind === 'pulp' ? MAT.paper({ color: '#ddd7c7', repeat: 7 }) : trayMat, { name: 'tray-floor', pos: [0, 0.0011, 0] }));
  for (let i = 0; i < 4; i++) {
    tray.add(mesh(box(shellW - 0.024, 0.0008, 0.0016), trayMat, { pos: [0, 0.0022, -shellD / 2 + 0.017 + i * 0.021], cast: false, receive: false }));
  }
  tray.add(mesh(frameGeo(shellW + 0.004, shellD + 0.004, 0.011, 0.0030, 0.0016), trayMat, { name: 'tray-flange', pos: [0, TRAY_H - 0.0008, 0] }));

  /* ---- 部品生成関数 ---- */
  function baran(x0, x1, z, hgt, color = '#eaf1de') {
    g.add(mesh(sheetGeo(16, 4, (u, v) => new THREE.Vector3(
      lerp(x0, x1, u), foodY + 0.001 + v * hgt, z + 0.0018 * Math.sin(u * Math.PI * 13),
    )), MAT.paper({ color, repeat: 8, side: THREE.DoubleSide, spec: 0.08 }), { name: 'baran', cast: false }));
  }
  function ran(x, z, r, h, color = '#f2b9c4') {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([r * (0.60 + 0.40 * t) + 0.0011 * Math.sin(t * 42), t * h]);
    }
    g.add(mesh(lathe(pts, 18), MAT.paper({ color, repeat: 8, side: THREE.DoubleSide, spec: 0.1 }), { name: 'ran', pos: [x, foodY, z], cast: false }));
  }
  function riceBed(x0, x1, z0, z1, top) {
    const w = x1 - x0, d = z1 - z0;
    const geo = rbox(w, top, d, Math.min(0.006, top * 0.55), 5).clone();
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      const up = v.y > 0;
      const k = 0.0009 * Math.sin(v.x * 170 + v.z * 120 + 1.3) + 0.0007 * Math.sin(v.z * 210 - v.x * 90);
      p.setXYZ(i, v.x, v.y + (up ? k + 0.0010 * Math.sin(v.x * 55) * Math.cos(v.z * 48) : k * 0.25), v.z + k * 0.35);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    const bed = mesh(geo, riceMat, { name: 'rice-bed', pos: [(x0 + x1) / 2, foodY + top / 2, (z0 + z1) / 2] });
    g.add(bed);
    grains(bed, 20, riceMat, grainGeo, [-w / 2 + 0.004, w / 2 - 0.004, -d / 2 + 0.004, d / 2 - 0.004], top / 2 - 0.0004, rnd);
    return bed;
  }
  function Leaf(cx, cy, cz, s, color, curl = 0.5) {
    g.add(mesh(sheetGeo(10, 8, (u, v) => new THREE.Vector3(
      cx + (u - 0.5) * s * 2,
      cy + curl * s * (0.5 - v) * Math.sin(u * 3.1) + 0.12 * s * Math.sin(u * 7 + v * 5) + 0.004 * Math.sin(u * 9),
      cz + (v - 0.5) * s * 1.5,
    )), MAT.leaf({ color, side: THREE.DoubleSide, spec: 0.22, rim: 0.34 }), { name: 'leaf', cast: false }));
  }
  function Karaage(cx, cz, s, i) {
    const mat = MAT.food({ color: i % 2 ? '#8b5a2c' : '#9a6531', spec: 0.44, specPower: 26, specCut: 0.24, shadowAmt: 0.66, steps: 4 });
    const m = mesh(lumpy(s, i * 3.7 + (seed % 13), 0.17), mat, { name: 'karaage' });
    m.position.set(cx, foodY + s * 0.68, cz);
    m.rotation.set(range(rnd, -0.3, 0.3), range(rnd, 0, 3), range(rnd, -0.3, 0.3));
    g.add(m);
    g.add(mesh(lumpy(s * 0.40, i * 5.1 + 2, 0.22, 8, 6), MAT.food({ color: '#e3cfa4', spec: 0.24 }), { pos: [cx + s * 0.36, foodY + s * 1.02, cz - s * 0.28], cast: false }));
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#c9b487', seed: seed + i, density: 1.4 }), w: s * 2.2, h: s * 1.9, pos: [cx, foodY + 0.0008, cz + 0.004], rot: [-Math.PI / 2, 0, 0], opacity: 0.34, order: i });
  }
  function Sashimi(cx, cz, len, wid, color, sin, rotZ) {
    const mat = MAT.food({ color, spec: 0.62, specPower: 92, specCut: 0.14, shadowAmt: 0.58, steps: 3, sat: 1.1 });
    const geo = rbox(len, 0.0052, wid, 0.0022, 3).clone();
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y + (y > 0 ? 0.0011 * Math.sin(p.getX(i) * 42 + seed) : 0));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    const m = mesh(geo, mat, { name: 'sashimi' });
    m.position.set(cx, foodY + 0.0066, cz);
    m.rotation.set(-0.20, 0, rotZ);
    g.add(m);
    if (sin) {
      for (let i = 0; i < 3; i++) {
        const s = mesh(box(len * 0.78, 0.0005, 0.0011), MAT.food({ color: '#f7efe6', spec: 0.5, shadowAmt: 0.5 }), {
          pos: [cx, foodY + 0.0094, cz - wid * 0.26 + i * wid * 0.26], cast: false, receive: false,
        });
        s.rotation.set(-0.20, 0, rotZ);
        g.add(s);
      }
    }
  }

  /* ---- オカズ ---- */
  if (key === 'chicken') {
    const spots = [[-0.050, -0.020], [-0.014, -0.028], [0.024, -0.018], [-0.038, 0.014], [0.002, 0.016], [0.040, 0.008]];
    spots.forEach(([x, z], i) => Karaage(x, z, 0.0124 + (i % 3) * 0.0012, i));
    for (let i = 0; i < 3; i++) Leaf(-0.058 + i * 0.007, foodY + 0.002 + i * 0.0035, 0.032 - i * 0.004, 0.019, '#7fae4e', 0.42);
    g.add(mesh(cyl(0.0122, 0.0122, 0.0034, 14), MAT.food({ color: '#e8d257', spec: 0.5 }), { name: 'lemon', pos: [0.062, foodY + 0.0020, 0.028], rot: [0.32, 0, 0.2] }));
    g.add(mesh(cyl(0.0104, 0.0104, 0.0036, 14), MAT.food({ color: '#f6ecae', spec: 0.42 }), { pos: [0.0622, foodY + 0.0023, 0.0276], rot: [0.32, 0, 0.2], cast: false }));
    ran(0.060, -0.028, 0.0155, 0.0090, '#f2c94c');
    baran(-INX, INX, 0.006, 0.0130);
  }
  if (key === 'sashimi') {
    const cuts = [
      [-0.050, -0.016, 0.032, 0.0135, '#c2564a', true, 0.10],
      [-0.014, -0.020, 0.030, 0.0125, '#e8846a', true, -0.06],
      [0.022, -0.016, 0.028, 0.0120, '#f0a278', false, 0.05],
      [0.052, -0.018, 0.024, 0.0105, '#dbe0e4', false, -0.12],
      [-0.030, 0.014, 0.028, 0.0120, '#b9573f', true, 0.16],
    ];
    cuts.forEach(([x, z, l, wd, c, s, r]) => Sashimi(x, z, l, wd, c, s, r));
    Leaf(0.016, foodY + 0.0020, 0.020, 0.030, '#3f7a45', 0.28);
    g.add(mesh(lumpy(0.0056, 3.1 + seed % 7, 0.19, 9, 7), MAT.food({ color: '#8fbf4a', spec: 0.5, shadowAmt: 0.6 }), { name: 'wasabi', pos: [0.052, foodY + 0.0054, 0.024], cast: false }));
    ran(-0.056, 0.024, 0.0135, 0.0080, '#8fb6cf');
    riceBed(-INX + 0.004, INX - 0.004, -INZ + 0.002, -INZ + 0.020, 0.0065);
    baran(-INX, INX, 0.0015, 0.0105, '#e5efd8');
  }
  if (key === 'salad') {
    const cols = ['#6f9e42', '#8fb659', '#4f7f38', '#a8c46a', '#5f8f45'];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      Leaf(Math.cos(a) * range(rnd, 0.018, 0.056), foodY + 0.002 + (i % 3) * 0.0035, Math.sin(a) * range(rnd, 0.012, 0.036), range(rnd, 0.015, 0.024), cols[i % 5], 0.55);
    }
    const tom = [[-0.040, 0.022], [0.008, 0.030], [0.044, -0.006], [-0.012, -0.026]];
    for (const [x, z] of tom) {
      g.add(mesh(sph(0.0098, 12, 9), MAT.food({ color: '#d3372c', spec: 0.66, specPower: 110, shadowAmt: 0.55 }), { pos: [x, foodY + 0.0088, z], scale: [1, 0.92, 1] }));
      g.add(mesh(cyl(0.0021, 0.0029, 0.0026, 7), MAT.food({ color: '#5c8f3f' }), { pos: [x, foodY + 0.0178, z], cast: false }));
    }
    const cup = grp('dressing', { pos: [0.056, 0, -0.026] });
    g.add(cup);
    cup.add(mesh(lathe([[0, 0], [0.0102, 0.0008], [0.0118, 0.0100], [0.0126, 0.0114], [0.0108, 0.0118]], 16),
      MAT.hardPlastic('#eae6db', { transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }), { name: 'cup', pos: [0, foodY - 0.0008, 0] }));
    cup.add(mesh(cyl(0.0096, 0.0088, 0.0020, 14), MAT.food({ color: '#d8b84a', spec: 0.6, transparent: true, opacity: 0.92 }), { pos: [0, foodY + 0.0068, 0], cast: false }));
    cup.add(mesh(cyl(0.0126, 0.0126, 0.0014, 16), MAT.hardPlastic('#c9c3b2'), { name: 'cup-lid', pos: [0, foodY + 0.0116, 0], cast: false }));
  }
  if (key === 'pasta') {
    const sauce = MAT.food({ color: '#9c3a24', spec: 0.5, specPower: 40, shadowAmt: 0.62, steps: 4 });
    g.add(mesh(rbox(0.128, 0.0060, 0.084, 0.010, 3), sauce, { name: 'sauce-bed', pos: [0.008, foodY + 0.0028, 0] }));
    const penne = MAT.food({ color: '#e6c274', spec: 0.46, specPower: 44, shadowAmt: 0.66 });
    const tube = tubeOf([[0, 0, 0], [0.0080, 0.0012, 0.0018]], 0.0026, 4, 6);
    for (let i = 0; i < 24; i++) {
      const a = range(rnd, 0, Math.PI * 2), rr = Math.sqrt(rnd()) * 0.044;
      const m = mesh(tube, penne, { name: 'penne' });
      m.position.set(0.008 + Math.cos(a) * rr * 1.42, foodY + 0.0078 + range(rnd, -0.002, 0.0045), Math.sin(a) * rr);
      m.rotation.set(range(rnd, -0.5, 0.5), range(rnd, 0, 3.1), range(rnd, -0.7, 0.7));
      g.add(m);
    }
    for (let i = 0; i < 8; i++) {
      g.add(mesh(lumpy(0.0060, i * 2.3 + seed % 5, 0.24, 8, 6), sauce, { pos: [0.008 + range(rnd, -0.048, 0.048), foodY + 0.0108, range(rnd, -0.032, 0.032)], cast: false }));
    }
    for (let i = 0; i < 3; i++) Leaf(0.008 + range(rnd, -0.030, 0.030), foodY + 0.0112, range(rnd, -0.022, 0.022), 0.011, '#3f7a45', 0.4);
    riceBed(-INX + 0.002, -INX + 0.026, -0.028, 0.028, 0.0060);                        // 端の白飯
    g.add(mesh(box(0.020, 0.0016, 0.012), MAT.food({ color: '#e7b04c', spec: 0.4 }), { pos: [-INX + 0.014, foodY + 0.0074, 0.014], rot: [0, 0.3, 0.04], cast: false }));
  }
  if (key === 'tendon') {
    riceBed(-INX + 0.003, INX - 0.003, -INZ + 0.003, INZ - 0.003, 0.0090);
    const batter = MAT.food({ color: '#d9b269', spec: 0.42, specPower: 34, specCut: 0.26, steps: 4, shadowAmt: 0.68 });
    for (let i = 0; i < 2; i++) {
      const x = -0.040 + i * 0.052, z = -0.014 + i * 0.010;
      g.add(mesh(capsule(0.0060, 0.0340, 8), batter, { name: 'shrimp-tempura', pos: [x, foodY + 0.0102, z], rot: [0.16, 0.4 - i * 0.7, 1.42] }));
      for (let k = 0; k < 6; k++) {
        g.add(mesh(sph(0.0028, 7, 5), batter, { pos: [x + range(rnd, -0.015, 0.015), foodY + 0.0128 + range(rnd, -0.003, 0.003), z + range(rnd, -0.009, 0.009)], cast: false }));
      }
      g.add(mesh(cyl(0.0025, 0.0017, 0.0098, 8), MAT.food({ color: '#e8c9a0' }), { pos: [x + 0.021 * (i ? -1 : 1), foodY + 0.0084, z], rot: [0, 0, 1.45 - i * 0.18], cast: false }));
    }
    g.add(mesh(cyl(0.0116, 0.0116, 0.0048, 12), MAT.food({ color: '#e0a63c', spec: 0.44 }), { name: 'kabocha', pos: [0.014, foodY + 0.0104, 0.028], rot: [0.3, 0.4, 0.1] }));
    g.add(mesh(rbox(0.025, 0.0058, 0.0150, 0.0028, 2), MAT.food({ color: '#6b4a6e', spec: 0.4 }), { name: 'nasu', pos: [-0.036, foodY + 0.0106, 0.030], rot: [0, 0.3, 0] }));
    const strip = mesh(sheetGeo(8, 2, (u, v) => new THREE.Vector3(lerp(-0.022, 0.028, u), foodY + 0.0158 + 0.0016 * Math.sin(u * 6), lerp(0.002, 0.016, v))), MAT.nori({ side: THREE.DoubleSide }), { name: 'nori-strip', cast: false });
    g.add(strip);
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#7a5a30', seed: seed + 41, density: 1.2 }), w: 0.120, h: 0.060, pos: [0.002, foodY + 0.0094, 0.002], rot: [-Math.PI / 2, 0, 0], opacity: 0.28 });
  }
  if (key === 'ekiben') {
    riceBed(-INX + 0.004, INX - 0.004, -INZ + 0.004, INZ - 0.004, 0.0100);
    const ume = mesh(sph(0.0088, 12, 9), MAT.food({ color: '#b0324a', spec: 0.55, specPower: 62, shadowAmt: 0.6 }), { pos: [0.002, foodY + 0.0166, 0.020] });
    ume.scale.set(1, 0.8, 1);
    g.add(ume);
    g.add(mesh(cyl(0.0030, 0.0038, 0.0024, 10), MAT.food({ color: '#8d2a3c' }), { pos: [0.002, foodY + 0.0224, 0.020], cast: false }));
    g.add(mesh(cyl(0.0086, 0.0086, 0.0032, 16), MAT.food({ color: '#f6f1e8', spec: 0.4 }), { name: 'naruto', pos: [-0.040, foodY + 0.0138, 0.024], rot: [0.2, 0, 1.5] }));
    g.add(mesh(tor(0.0038, 0.0010, 5, 14), MAT.food({ color: '#e0576c', spec: 0.4 }), { pos: [-0.040, foodY + 0.0154, 0.024], rot: [0.2, 0, 0], cast: false }));
    g.add(mesh(box(0.028, 0.0056, 0.0142), MAT.food({ color: '#f2f0e6', spec: 0.42 }), { name: 'kamaboko', pos: [0.036, foodY + 0.0146, 0.026], rot: [0, -0.22, 0] }));
    g.add(mesh(box(0.028, 0.0014, 0.0142), MAT.food({ color: '#d9534f', spec: 0.4 }), { pos: [0.036, foodY + 0.0178, 0.026], rot: [0, -0.22, 0], cast: false }));
    for (let i = 0; i < 9; i++) {
      g.add(mesh(sph(0.0032, 8, 6), MAT.food({ color: '#5f9e45', spec: 0.5 }), { pos: [range(rnd, -0.054, 0.054), foodY + 0.0162, range(rnd, 0.002, 0.042)], cast: false }));
    }
    for (let i = 0; i < 12; i++) {
      const s = mesh(capsule(0.0010, 0.0012, 4), MAT.food({ color: i % 2 ? '#2f2b24' : '#e8dcc0', spec: 0.3 }), { cast: false });
      s.position.set(range(rnd, -0.060, 0.060), foodY + 0.0150, range(rnd, 0.000, 0.046));
      s.rotation.set(range(rnd, 0, 3), range(rnd, 0, 3), range(rnd, 0, 3));
      g.add(s);
    }
    baran(-INX + 0.002, -INX + 0.034, 0.020, 0.0130, '#f0c9c0');
  }

  /* ---- 割り箸（蓋上有 or 縁置） ---- */
  if (sp.chop) {
    const onLid = sp.lid === 'paper';
    const yBase = onLid ? TRAY_H + 0.0076 : TRAY_H + 0.0022;
    const zBase = onLid ? -0.0280 : 0.0400;
    const wood = MAT.wood({ light: '#e6d8b6', dark: '#c3ac7d', repeat: 3 });
    const cg = grp('chopsticks', { pos: [0, 0, 0], rot: [0, -0.10, 0] });
    g.add(cg);
    for (let i = 0; i < 2; i++) {
      const y = yBase + i * 0.0042;
      cg.add(mesh(box(0.138, 0.0040, 0.0048), wood, { name: 'chopstick-' + i, pos: [-0.006, y, zBase + i * 0.0054], rot: [0, 0.02 - i * 0.05, 0.015] }));
      cg.add(mesh(box(0.0090, 0.0044, 0.0050), MAT.paper({ color: '#e7dcc0', repeat: 4 }), { pos: [0.060, y, zBase + i * 0.0054], cast: false }));
    }
    cg.add(mesh(box(0.028, 0.0012, 0.0130), MAT.paper({ color: '#f2e7cf', repeat: 5 }), { pos: [0.054, yBase - 0.0010, zBase + 0.004], rot: [0, 0.10, 0], cast: false }));
  }

  /* ---- 伝票（蓋の内側に挟む） ---- */
  if (sp.slip) {
    const sy = foodY + 0.0012;
    g.add(mesh(box(0.050, 0.0006, 0.028), MAT.paper({ color: '#f8f5ec', repeat: 4 }), { name: 'slip', pos: [-0.044, sy, 0.032], rot: [0, -0.20, 0.02] }));
    decal(g, { map: TEX.adStrip({ text: 'お取り扱い注意', bg: '#f8f5ec', seed: seed + 7 }), w: 0.040, h: 0.022, pos: [-0.044, sy + 0.0005, 0.032], rot: [-Math.PI / 2, 0, -0.20], opacity: 0.95 });
  }

  /* ---- 蓋（PET ドーム／印刷ペーパー蓋／紙スリーブ） ---- */
  const lidY = TRAY_H + 0.0012;
  const pet = MAT.glassLite({ color: '#eff8f9', opacity: 0.20, spec: 1, specPower: 250, specCut: 0.05, sheen: 0.45, rim: 0.5, side: THREE.DoubleSide, steps: 2 });
  if (sp.lid === 'dome') {
    const rise = (H - 0.0016) - lidY;
    g.add(mesh(domeLid(shellW / 2 + 0.001, shellD / 2 + 0.001, 0.010, 0.90, rise), pet, {
      name: 'pet-lid', pos: [0, lidY, 0], cast: false, receive: false, renderOrder: 9,
    }));
    g.add(mesh(frameGeo(shellW + 0.004, shellD + 0.004, 0.011, 0.0016, 0.0028), pet, { name: 'lid-skirt', pos: [0, lidY, 0], cast: false, receive: false }));
    if (sp.defect === 'condense') {
      for (let i = 0; i < 11; i++) {
        g.add(mesh(sph(0.0016, 7, 5), MAT.water({ opacity: 0.75 }), {
          pos: [range(rnd, -INX * 0.8, INX * 0.8), lidY + rise * range(rnd, 0.55, 0.95), range(rnd, -INZ * 0.8, INZ * 0.8)],
          scale: [0.8, 1.5, 0.8], cast: false, receive: false,
        }));
      }
    }
  }
  if (sp.lid === 'paper') {
    // 印刷ペーパー蓋：後方 45% に掛かり、前側の御飯と具が見える
    const t = 0.0038, lz = (shellD + 0.004) * 0.46;
    g.add(mesh(rbox(shellW + 0.003, t, lz, 0.0055, 3), MAT.poster({
      map: TEX.poster({ title: sp.name, sub: sp.sub, bg: sp.bg, accent: sp.accent, seed: (seed % 89) + 3 }),
      steps: 3, sat: 1.04, spec: 0.16,
    }), { name: 'paper-lid', pos: [0, lidY + t / 2, -(shellD / 2 - lz / 2 + 0.001)], rot: [0.020, 0.02, -0.010] }));
    g.add(mesh(box(shellW + 0.005, 0.0012, lz * 0.98), MAT.paper({ color: '#e2d6bc', repeat: 6 }), {
      name: 'paper-lid-underside', pos: [0, lidY - 0.0004, -(shellD / 2 - lz / 2 + 0.001)], cast: false,
    }));
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#c9bb98', seed: seed + 61, density: 1.1 }), w: 0.060, h: 0.024, pos: [0.020, lidY + t + 0.0004, -(shellD / 2 - 0.014)], rot: [-Math.PI / 2, 0, 0.02], opacity: 0.30 });
  }
  if (sp.sleeve) {
    // 紙スリーブ（前後左右の 4 面＋前面印刷）
    const sm = MAT.poster({ map: TEX.drinkLabel({ name: sp.name, sub: sp.sub, ml: '内容量 約320g', a: sp.accent, b: sp.bg, kind: 'bento' }), steps: 3, side: THREE.DoubleSide, sat: 1.04, spec: 0.14 });
    const sh2 = 0.0200, y0 = 0.0060;
    const sl = grp('sleeve');
    g.add(sl);
    sl.add(mesh(box(shellW + 0.0012, sh2, 0.0008), sm, { name: 'sleeve-front', pos: [0, y0 + sh2 / 2, shellD / 2 + 0.0006] }));
    sl.add(mesh(box(shellW + 0.0012, sh2, 0.0008), sm, { name: 'sleeve-back', pos: [0, y0 + sh2 / 2, -shellD / 2 - 0.0006] }));
    sl.add(mesh(box(0.0008, sh2, shellD + 0.0012), sm, { name: 'sleeve-l', pos: [-shellW / 2 - 0.0006, y0 + sh2 / 2, 0] }));
    sl.add(mesh(box(0.0008, sh2, shellD + 0.0012), sm, { name: 'sleeve-r', pos: [shellW / 2 + 0.0006, y0 + sh2 / 2, 0] }));
  }

  /* ---- 経年・欠陥 ---- */
  decal(g, { map: TEX.wear({ kind: 'scratch', color: '#efefef', seed: seed + 51, density: 1.8 }), w: 0.040, h: 0.009, pos: [-0.056, TRAY_H - 0.0050, shellD / 2 - 0.0030], opacity: 0.30 });
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#8d8574', seed: seed + 52, density: 1.4 }), w: 0.050, h: 0.016, pos: [0.050, 0.0102, -shellD / 2 - 0.0004], rot: [Math.PI, 0, 0], opacity: 0.30 });
  if (sp.defect === 'wilt') {
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#a89a4a', seed: seed + 53, density: 1.2 }), w: 0.046, h: 0.030, pos: [-0.028, foodY + 0.0058, 0.018], rot: [-Math.PI / 2, 0, 0], opacity: 0.38 });
  }
  if (sp.defect === 'sauce') {
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#8a4326', seed: seed + 54, density: 1.5 }), w: 0.046, h: 0.024, pos: [-0.020, foodY + 0.0016, -0.028], rot: [-Math.PI / 2, 0, 0.3], opacity: 0.45 });
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#8a4326', seed: seed + 55, density: 1.1 }), w: 0.026, h: 0.012, pos: [0.062, TRAY_H + 0.0010, -0.042], rot: [-Math.PI / 2, 0, 0.5], opacity: 0.40 });
  }
  if (sp.defect === 'crumb') {
    for (let i = 0; i < 6; i++) {
      const s = mesh(capsule(0.0014, 0.0024, 4), riceMat, { cast: false, receive: false });
      s.position.set(range(rnd, -0.074, 0.074), TRAY_H + 0.0008, (rnd() > 0.5 ? 1 : -1) * range(rnd, 0.048, 0.055));
      s.rotation.set(Math.PI / 2 + range(rnd, -0.4, 0.4), range(rnd, 0, 3), 0);
      g.add(s);
    }
  }

  return fitTo(g, [W * sc, H * sc, D * sc]);
}

/** 実体メッシュだけの AABB（做旧・貼花などの平面は寸法に数えない） */
function contentBounds(root) {
  const bb = new THREE.Box3();
  const b2 = new THREE.Box3();
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
export default build;
