import { z as rand, g as grp, ac as Box3, n as range, m as mesh, k as tubeOf, a as sph, M as MAT, w as weather, c as cyl, b as box, x as PlaneGeometry, V as Vector3, t as tor, r as rbox, D as DoubleSide, ae as SphereGeometry, af as BoxGeometry, H as plane, J as shape, K as extrude, s as shade, Y as memo, N as makeCanvas, a6 as rr, Q as toTexture } from './index-D8uBk-tk.js';

//  assets/products/bread-set.js —— 棚・トレイのパン 6 variant
//  toast 食パン（袋・切り口 3 枚）・melonpan メロンパン（クッキー割れ・砂糖粒）
//  anpan あんパン（餡色・黒ゴマ・絞り seam）・sandwichサンドイッチ（切り口の具）
//  cream クリームパン（絞り筋）・roll ロールパン（綴じ目・打ち粉）
//  options: { seed, scale, variant, tint, pack }  pack = 袋内の個数（1..4、自動的に縮退配置）
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'bread-set',
  real: [0.11, 0.05, 0.09],
  origin: 'bottom-center',
  variants: ['toast', 'melonpan', 'anpan', 'sandwich', 'cream', 'roll'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
const W = 0.11, H = 0.05, D = 0.09;

/* -------------------------------- 局所テクチャ -------------------------------- */
/** メロンパンのクッキー割れ（格子＝経緯に合う UV） */
const melonTex = (v) => memo(`br:melon:${v}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, '#e3b473');
  // 生地の濃淡
  for (let i = 0; i < 320; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.14;
    g.fillStyle = rnd() > 0.5 ? '#f4d9a8' : '#c48f50';
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 30, 4 + rnd() * 14, rnd() * 3, 0, 6.284); g.fill();
  }
  // 割れ（縦筋・横筋）：やや不揃い＝手作業
  g.strokeStyle = '#a8703a'; g.lineCap = 'round';
  for (let i = 0; i < 13; i++) {
    const x = (i / 13) * w + (rnd() - 0.5) * 8;
    g.globalAlpha = 0.55 + rnd() * 0.35; g.lineWidth = 5 + rnd() * 5;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 24) g.lineTo(x + Math.sin(y * 0.05 + i) * 5, y);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const y = (i / 6) * h + (rnd() - 0.5) * 6;
    g.globalAlpha = 0.5 + rnd() * 0.3; g.lineWidth = 4 + rnd() * 4;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 30) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 4);
    g.stroke();
  }
  // 焼きムラ（濃い縁）
  g.globalAlpha = 1;
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(120,70,30,0.35)'); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(120,70,30,0.4)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  return toTexture(cv, { repeat: 1 });
});

/** パンの生地（耳・クラムの粒） */
const crumbTex = (base) => memo(`br:crumb:${base}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, base);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w, y = rnd() * h, r = 1.5 + rnd() * 6;
    g.globalAlpha = 0.06 + rnd() * 0.2;
    g.fillStyle = rnd() > 0.4 ? shade(base, 1.12) : shade(base, 0.78);
    g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 2 });
});

/** 袋の印刷（商品名・賞味・栄養表示のかすれ） */
const bagPrint = (title, sub, ink) => memo(`br:bag:${title}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = ink; g.globalAlpha = 0.92;
  rr(g, w * 0.04, h * 0.3, w * 0.5, h * 0.36, 10); g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#fff8ea'; g.font = '800 42px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(title, w * 0.29, h * 0.48);
  g.font = '700 20px sans-serif'; g.fillStyle = ink;
  g.fillText(sub, w * 0.29, h * 0.72);
  // 賞味期限印字（にじみ）
  g.globalAlpha = 0.65; g.fillStyle = '#2b2b30'; g.font = '700 24px sans-serif'; g.textAlign = 'left';
  g.fillText('賞味 3/24', w * 0.62, h * 0.4);
  g.globalAlpha = 0.35; g.fillText('賞味 3/24', w * 0.623, h * 0.403);
  g.globalAlpha = 1;
  for (let i = 0; i < 8; i++) { g.globalAlpha = 0.06 + rnd() * 0.1; g.fillStyle = '#fff'; g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 90, 3); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});
function fillCv(g, w, h, c) { g.fillStyle = c; g.fillRect(0, 0, w, h); }

/* ------------------------------ マテリアル ------------------------------ */
function mats(o) {
  const t = { tint: o.tint };
  return {
    crust: (c) => MAT.bread({ color: c, map: crumbTex(c), spec: 0.34, specPower: 26, specCut: 0.32, sheen: 0.08, shadowAmt: 0.68, ...t }),
    crumbSoft: (c) => MAT.food({ color: c, map: crumbTex(c), spec: 0.2, specPower: 18, specCut: 0.5, sheen: 0.04, shadowAmt: 0.72, ...t }),
    glazed: (c) => MAT.bread({ color: c, map: crumbTex(c), spec: 0.85, specPower: 120, specCut: 0.09, sheen: 0.24, shadowAmt: 0.58, steps: 4, ...t }),
    melon: MAT.bread({ color: '#ffffff', map: melonTex(0), spec: 0.44, specPower: 34, specCut: 0.26, sheen: 0.1, shadowAmt: 0.66, ...t }),
    sugar: MAT.paint('#fdfbf2', { spec: 0.6, specPower: 130, steps: 2 }),
    an: MAT.food({ color: '#5c3a20', spec: 0.62, specPower: 52, specCut: 0.16, sheen: 0.14, shadowAmt: 0.62, ...t }),
    sesame: MAT.paint('#211d18', { spec: 0.5, specPower: 90, steps: 2 }),
    custard: MAT.food({ color: '#f5dc9a', spec: 0.8, specPower: 100, specCut: 0.11, sheen: 0.2, shadowAmt: 0.55, ...t }),
    flour: MAT.paint('#fbf7ea', { spec: 0.04, sheen: 0.0, steps: 2, transparent: true, opacity: 0.6 }),
    lettuce: MAT.food({ color: '#7fae5a', spec: 0.6, specPower: 44, sheen: 0.12, side: DoubleSide, ...t }),
    tomato: MAT.food({ color: '#d5502f', spec: 0.85, specPower: 130, specCut: 0.1, ...t }),
    eggFill: MAT.food({ color: '#f0dc9a', spec: 0.5, specPower: 30, ...t }),
    cucumber: MAT.food({ color: '#8fbf72', spec: 0.75, specPower: 90, ...t }),
    ham: MAT.food({ color: '#dc9a9a', spec: 0.55, specPower: 50, ...t }),
    bag: MAT.glassLite({ color: '#f2f6f7', opacity: 0.26, spec: 1, specPower: 240, side: DoubleSide, depthWrite: false }),
    bagPrintMat: (title, sub, ink) => MAT.glassLite({ color: '#ffffff', opacity: 0.95, map: bagPrint(title, sub, ink), side: DoubleSide, depthWrite: false }),
    tie: (c) => MAT.plastic(c, { steps: 2, spec: 0.4, ...t }),
    paperCase: MAT.paper({ color: '#f7f1e2', spec: 0.06, shadowAmt: 0.82, ...t }),
    wet: MAT.water({ color: '#e8d9bd', opacity: 0.4 }),
  };
}

/* -------------------------------- 成形ヘルパー -------------------------------- */
/** 有機的なドーム（パン）：球頂点を変位して潰す */
function bunGeo(rx, ry, rz, amp, seed, flat = 0, spin = 0) {
  const g = new SphereGeometry(1, 26, 18);
  const p = g.attributes.position; const v = new Vector3();
  const rnd = rand(seed);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const k = 1 + (Math.sin(n.x * 5.7 + n.z * 4.1) * 0.5 + Math.sin(n.y * 7.3 - n.x * 3.2) * 0.32 + (rnd() - 0.5) * 0.5) * amp;
    let y = n.y;
    if (flat && y < 0) y = -Math.pow(-y, 0.62);          // 底を平らに（天板つき）
    v.set(n.x * k * rx, y * k * ry, n.z * k * rz);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  if (spin) g.rotateY(spin);
  g.computeVertexNormals();
  return g;
}
/** 山形食パンの断面（押出）＋クラウン */
function loafGeo(w, d, h, crown) {
  const s = shape((sh) => {
    const r = 0.006;
    sh.moveTo(-w / 2 + r, 0);
    sh.lineTo(w / 2 - r, 0);
    sh.quadraticCurveTo(w / 2, 0, w / 2, r);
    sh.lineTo(w / 2, h * 0.62);
    sh.quadraticCurveTo(w / 2 - 0.002, h * 0.94, 0, h);
    sh.quadraticCurveTo(-w / 2 + 0.002, h * 0.94, -w / 2, h * 0.62);
    sh.lineTo(-w / 2, r);
    sh.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  });
  const g = extrude(s, { depth: d, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 8, steps: 4 });
  g.translate(0, 0, -d / 2);
  // クラウン（天面の山なりに沿った盛り上がり）
  const p = g.attributes.position; const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (w / 2);
    const top = Math.max(0, (v.y - h * 0.6) / (h * 0.4));
    p.setY(i, v.y + top * crown * (1 - nx * nx) * 0.9);
  }
  p.needsUpdate = true; g.computeVertexNormals();
  return g;
}
/** 透明袋（パンを包む袋：本体・ひだ・ねじり・印刷テープ） */
function breadBag(parent, M, { w, h, d, seed, print, twistAt = 1 }) {
  const G = grp('bag'); parent.add(G);
  const g = new BoxGeometry(w, h, d, 10, 8, 8);
  const p = g.attributes.position; const v = new Vector3(); const dv = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (w / 2), ny = v.y / (h / 2), nz = v.z / (d / 2);
    // 端（±x）へ行くほど絞る（袋の口をねじった形）
    const pinch = 1 - 0.5 * Math.pow(Math.abs(nx), 3.2);
    v.set(v.x * (0.88 + 0.12 * pinch), v.y * (0.9 + 0.1 * pinch), v.z * (0.88 + 0.12 * pinch));
    // 袋面の微細な波（≤1.4mm）
    const wob = Math.sin(ny * 7 + nz * 5 + seed) * 0.0007 + Math.sin(nx * 9 + nz * 6) * 0.0007;
    dv.set(v.x / (w / 2), v.y / (h / 2), v.z / (d / 2)).normalize();
    p.setXYZ(i, v.x + dv.x * wob, v.y + dv.y * wob, v.z + dv.z * wob);
  }
  p.needsUpdate = true; g.computeVertexNormals();
  G.add(noHull(mesh(g, M.bag, { pos: [0, h / 2, 0], cast: false, receive: false, renderOrder: 6 })));
  // ねじり端（twist tie）：袋の口を寄せて紐で留める（bag envelope を越えない長さにする）
  const gStart = w / 2 - 0.0095, gEnd = w / 2 + 0.0006;
  for (let i = 0; i < 4; i++) {
    const f = i / 4, r0 = 0.0044 - f * 0.0016;
    G.add(noHull(mesh(cyl(r0, r0 - 0.0004, 0.0026, 8), M.bag, {
      pos: [gStart + f * (gEnd - gStart), h * 0.7, 0], rot: [0, 0, 90 * D2R], cast: false, receive: false,
    })));
  }
  G.add(noHull(mesh(tubeOf([[gEnd - 0.0035, h * 0.7, 0], [gEnd + 0.0006, h * 0.74, 0.0022], [gEnd + 0.0016, h * 0.66, -18e-4]], 0.0006, 8, 4), M.tie('#c9403a'), { cast: false })));
  // 印刷テープ（袋の接合部＝正面に出る）
  G.add(noHull(mesh(plane(w * 0.62, h * 0.3), M.bagPrintMat(print[0], print[1], print[2]), { pos: [-w * 0.06, h * 0.66, d / 2 + 0.0006], cast: false, receive: false })));
  // 袋の接合シーム（背中のテープ）
  G.add(noHull(mesh(box(w * 0.96, h * 0.14, 0.0006), M.tie('#e8e2d2'), { pos: [0, h * 0.94, -d * 0.2], cast: false, receive: false })));
  return G;
}
/** 切り口（クラムの面）に気泡と耳の輪 */
function cutFace(parent, M, { w, h, pos, rot = [0, 0, 0], crust = '#c98f52', crumb = '#f6e9cf' }) {
  const G = grp('cut'); parent.add(G);
  G.position.set(pos[0], pos[1], pos[2]); G.rotation.set(rot[0], rot[1], rot[2]);
  G.add(noHull(mesh(rbox(w, h, 0.0016, Math.min(w, h) * 0.16, 2), M.crumbSoft(crumb), { cast: false, receive: false })));
  G.add(noHull(mesh(rbox(w * 1.02, h * 1.02, 0.0012, Math.min(w, h) * 0.16, 2), M.crust(crust), { pos: [0, 0, -12e-4], cast: false, receive: false })));
  const rnd = rand(w * 1e4 + h * 1e3);
  for (let i = 0; i < 12; i++) {
    G.add(noHull(mesh(sph(0.0012 + rnd() * 0.0022, 6, 5), M.crumbSoft(shade(crumb, 0.88)), {
      pos: [(rnd() - 0.5) * w * 0.8, (rnd() - 0.5) * h * 0.78, 0.0011], scale: [1, 0.8, 0.24], cast: false, receive: false,
    })));
  }
  return G;
}

/* ================================ variants ================================ */

/** 食パン：3 枚切り mini ローフ（耳・クラウン・切り口・袋） */
function vToast(P, M, rnd, o) {
  const B = grp('toast'); P.add(B);
  const lw = 0.079, ld = 0.069, lh = 0.031;
  B.add(mesh(loafGeo(lw, ld, lh, 0.005), M.crust('#c0854a'), { pos: [0, 0.0058, 0], name: 'loaf' }));
  // 耳の焼きムラ（濃い帯）
  B.add(noHull(mesh(rbox(lw * 1.005, 0.004, ld * 1.005, 0.0018, 2), M.crust('#9c6431'), { pos: [0, lh * 0.72, 0], cast: false })));
  // 切り口（前面 +Z に 1 面、スライス筋 2 本で 3 枚に見える）
  cutFace(B, M, { w: lw * 0.99, h: lh * 0.99, pos: [0, lh / 2 + 0.002, ld / 2 + 0.006] });
  for (const gx of [-0.012, 0.012]) {
    B.add(noHull(mesh(box(0.0008, lh * 0.9, ld * 0.94), M.crumbSoft('#e6d5b4'), { pos: [gx, lh * 0.5, 0.004], cast: false })));
    B.add(noHull(mesh(box(lw * 0.96, lh * 0.9, 0.0008), M.crumbSoft('#e6d5b4'), { pos: [0, lh * 0.5, gx * 2.4], cast: false })));
  }
  breadBag(B, M, { w: lw + 0.012, h: lh + 0.014, d: ld + 0.012, seed: (o.seed ?? 1) + 1, print: ['生食パン', '3 枚切り · 北海道産小麦', '#7a4f22'] });
  // 缺陷：耳の破け・袋のシワ・パン屑
  B.add(noHull(mesh(sph(0.005, 8, 6), M.crumbSoft('#f0e2c4'), { pos: [lw * 0.4, lh * 0.9, -ld * 0.3], scale: [1, 0.4, 1], cast: false })));
  weather(B, { w: 0.018, h: 0.012, pos: [-lw * 0.3, 0.016, ld * 0.5 + 0.002], kind: 'dirt', color: '#a58a5f', opacity: 0.3, seed: (o.seed ?? 1) + 3, spread: 0.001 });
  for (let i = 0; i < 3; i++) P.add(noHull(mesh(sph(0.0016 + rnd() * 0.002, 6, 5), M.crumbSoft('#f2e6ca'), { pos: [range(rnd, -0.05, 0.05), 0.0012, range(rnd, -0.04, 0.04)], scale: [1, 0.4, 1], cast: false, receive: false })));
}

/** メロンパン：クッキー割れ（格子）・砂糖粒・餡の入った底 */
const PACKPOS = {
  1: { xy: [[0, 0]], r: 0.0425 },
  2: { xy: [[-0.0265, 0], [0.0265, 0]], r: 0.0245 },
  3: { xy: [[-0.031, 0], [0, 0.016], [0.031, -4e-3]], r: 0.0185 },
  4: { xy: [[-0.026, -0.021], [0.026, -0.021], [-0.026, 0.021], [0.026, 0.021]], r: 0.024 },
};
function vMelonpan(P, M, rnd, o) {
  const B = grp('melonpan'); P.add(B);
  const n = Math.max(1, Math.min(4, o.pack ?? 1));
  const { xy, r } = PACKPOS[n];
  for (let i = 0; i < n; i++) {
    const one = grp(`melon-${i}`); B.add(one);
    one.position.set(xy[i][0], 0.001, xy[i][1]);
    const spin = range(rnd, -0.5, 0.5);
    const rx = r, ry = r * 0.5, rz = r * 0.95;
    // クッキー面（上 3/4）と下部のパン地
    one.add(mesh(bunGeo(rx, ry, rz, 0.055, (o.seed ?? 1) + i * 7, 1, spin), M.melon, { pos: [0, ry * 1.07, 0], name: 'cookie-top' }));
    one.add(mesh(bunGeo(rx * 0.965, ry * 0.5, rz * 0.96, 0.05, (o.seed ?? 1) + i * 13, 1, spin), M.crust('#c98f52'), { pos: [0, ry * 0.44, 0], name: 'bottom' }));
    // 砂糖粒（結晶）
    for (let k = 0; k < 14; k++) {
      const a = rnd() * 6.284, u = 0.15 + rnd() * 0.75;
      one.add(noHull(mesh(sph(0.0011 + rnd() * 0.0008, 5, 4), M.sugar, {
        pos: [Math.cos(a) * rx * u, ry + Math.sin(Math.acos(Math.min(1, u))) * ry * 0.86, Math.sin(a) * rz * u], cast: false, receive: false,
      })));
    }
    // 侧面の割れ目から生地が覗く
    one.add(noHull(mesh(sph(0.004, 7, 6), M.crust('#b57c41'), { pos: [rx * 0.72, ry * 0.72, rz * 0.4], scale: [0.5, 1.4, 1.1], cast: false })));
  }
  const bagW = n === 1 ? r * 2 + 0.008 : W * 0.87;
  const bagD = n === 1 ? r * 1.84 + 0.006 : D * 0.8;
  breadBag(B, M, { w: bagW, h: n === 1 ? r + 0.006 : H * 0.82, d: bagD, seed: (o.seed ?? 1) + 5, print: ['メロンパン', n === 1 ? 'クッキー生地のせ' : `${n} 個入`, '#8a5a26'] });
  weather(B, { w: 0.02, h: 0.014, pos: [r * 0.2, r * 0.75, r * 0.9], kind: 'chip', color: '#f6efdc', opacity: 0.32, seed: (o.seed ?? 1) + 9, spread: 0.0012 });
}

/** あんパン：餡色の透け・黒ゴマ・絞りの seam・照り（卵wash） */
function vAnpan(P, M, rnd, o) {
  const B = grp('anpan'); P.add(B);
  const rx = 0.0408, ry = 0.0192, rz = 0.0382;
  B.add(mesh(bunGeo(rx, ry, rz, 0.06, (o.seed ?? 1) + 3, 1), M.glazed('#cf9450'), { pos: [0, ry * 1.07, 0], name: 'bun' }));
  // 餡が透ける面（薄皮的部分＝暗く沈む）
  B.add(noHull(mesh(sph(0.0142, 12, 9), M.an, { pos: [rx * 0.26, ry * 1.14, rz * 0.72], scale: [1.3, 0.8, 0.26], rot: [0.34, 0.34, 0], cast: false })));
  B.add(noHull(mesh(tor(0.0132, 0.0019, 6, 20), M.glazed('#c08a48'), { pos: [rx * 0.26, ry * 1.14, rz * 0.71], rot: [0.34, 0.34, 0], scale: [1.3, 1.06, 0.4], cast: false })));
  // 絞り seam（生地に寄せる）
  const seam = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = t * 6.4;
    seam.push([Math.cos(a) * rx * 0.1 * (1 - t * 0.5), ry * 1.94 - t * 0.001, Math.sin(a) * rz * 0.1 * (1 - t * 0.5)]);
  }
  B.add(noHull(mesh(tubeOf(seam, 0.0016, 22, 6), M.glazed('#b98144'), { cast: false })));
  // 黒ゴマ（中心まわりに 13 粒）
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * 6.284 + rnd() * 0.4, r = 0.006 + rnd() * 0.014;
    const y = ry * 1.98 - (r * r) / (rx * 2) * ry;
    B.add(noHull(mesh(sph(0.0013, 6, 5), M.sesame, { pos: [Math.cos(a) * r, y, Math.sin(a) * r], scale: [1.5, 0.35, 1], rot: [0, a, 0.12], cast: false, receive: false })));
  }
  // 底に漏れて焼けた餡（生活痕＝缺陷）
  B.add(noHull(mesh(cyl(0.0092, 0.0112, 0.0016, 12), M.an, { pos: [-rx * 0.5, 0.0009, rz * 0.34], cast: false, receive: false })));
  weather(B, { w: 0.022, h: 0.014, pos: [rx * 0.6, ry * 1.3, -rz * 0.62], kind: 'chip', color: '#f2e6ca', opacity: 0.3, seed: (o.seed ?? 1) + 11, spread: 0.0014 });
  breadBag(B, M, { w: rx * 2 + 0.009, h: ry * 2 + 0.01, d: rz * 2 + 0.009, seed: (o.seed ?? 1) + 13, print: ['つぶあんぱん', '北海道十勝あずき', '#5f4326'] });
}

/** サンドイッチ：斜め切り三角・具の層（レタス／玉／番茄／胡瓜／ハム）・フリルケース */
function vSandwich(P, M, rnd, o) {
  const S = grp('sandwich'); P.add(S);
  const bw = 0.082, bd = 0.074, th = 0.0075;
  const tri = (flip) => {
    const s = shape((sh) => {
      sh.moveTo(-bw / 2, -bd / 2);
      sh.lineTo(bw / 2, flip ? -bd / 2 : bd / 2);
      sh.lineTo(-bw / 2, bd / 2);
      sh.closePath();
    });
    const g = extrude(s, { depth: th, bevelEnabled: true, bevelThickness: 0.0022, bevelSize: 0.0026, bevelSegments: 2, curveSegments: 3 });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  };
  // 上のパン／下のパン
  S.add(mesh(tri(false), M.crumbSoft('#f3e6c8'), { pos: [-1e-3, 0.0285, 0.001], name: 'bread-top' }));
  S.add(mesh(tri(true), M.crumbSoft('#f3e6c8'), { pos: [0.001, 0.0085, -1e-3], name: 'bread-bottom' }));
  // 耳（三角の 3 辺に沿って周回）
  const diag = Math.hypot(bw, bd), dang = Math.atan2(bd, bw);
  S.add(noHull(mesh(box(0.0042, 0.008, bd * 0.99), M.crust('#c08a4c'), { pos: [-bw / 2, 0.019, 0], cast: false })));
  S.add(noHull(mesh(box(bw * 0.99, 0.008, 0.0042), M.crust('#c08a4c'), { pos: [0, 0.019, bd / 2], cast: false })));
  S.add(noHull(mesh(box(diag * 0.99, 0.008, 0.0042), M.crust('#c08a4c'), { pos: [0, 0.019, 0], rot: [0, -dang, 0], cast: false })));
  // 具の層（レタス＝波うち、玉子、番茄、胡瓜、ハム）
  const leaf = new PlaneGeometry(bw * 0.98, bd * 0.98, 8, 8);
  const lp = leaf.attributes.position; const lv = new Vector3();
  for (let i = 0; i < lp.count; i++) { lv.fromBufferAttribute(lp, i); lp.setZ(i, Math.sin(lv.x * 70) * 0.0022 + Math.cos(lv.y * 52) * 0.0018); }
  lp.needsUpdate = true; leaf.computeVertexNormals();
  S.add(noHull(mesh(leaf, M.lettuce, { pos: [0, 0.0225, 0], rot: [-90 * D2R, 0, 0.08], cast: false })));
  S.add(noHull(mesh(leaf, M.lettuce, { pos: [0.002, 0.0212, -2e-3], rot: [-90 * D2R, 0, -0.05], cast: false })));
  S.add(noHull(mesh(box(bw * 0.8, 0.0034, bd * 0.7), M.eggFill, { pos: [-4e-3, 0.0185, 0.004], rot: [0, 0.05, 0], cast: false })));
  S.add(noHull(mesh(box(bw * 0.72, 0.0028, bd * 0.62), M.ham, { pos: [0.002, 0.0162, -4e-3], rot: [0, -0.06, 0], cast: false })));
  for (const [fx, fz, fr] of [[-0.014, 0.012, 0.0115], [0.014, -0.01, 0.0105], [0.004, 0.024, 0.009]]) {
    S.add(noHull(mesh(cyl(fr, fr, 0.0042, 16), M.tomato, { pos: [fx, 0.0198, fz], rot: [0, 0, range(rnd, -0.2, 0.2)], cast: false })));
  }
  for (const [fx, fz] of [[-0.026, -0.014], [0.02, 0.02]]) {
    S.add(noHull(mesh(cyl(0.0086, 0.0086, 0.0024, 14), M.cucumber, { pos: [fx, 0.0158, fz], cast: false })));
    S.add(noHull(mesh(tor(0.0082, 0.001, 4, 14), M.lettuce, { pos: [fx, 0.0158, fz], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // 切り口の断面（前面 +Z に見える具の断面）
  cutFace(S, M, { w: bw * 0.92, h: 0.021, pos: [-bw * 0.22, 0.019, bd / 2 - 0.001], rot: [0, 0, 0] });
  // フリル付きケース（セロファン＋パ紙）
  S.add(noHull(mesh(rbox(bw + 0.01, 0.0028, bd + 0.01, 0.0014, 2), M.paperCase, { pos: [0, 0.0014, 0], cast: false })));
  for (let i = 0; i < 22; i++) {
    const t = i / 22;
    S.add(noHull(mesh(box(0.006, 0.008, 0.0008), M.paperCase, {
      pos: [(t - 0.5) * (bw + 0.008), 0.004, bd / 2 + 0.004], rot: [0.35, 0, range(rnd, -0.2, 0.2)], cast: false, receive: false,
    })));
  }
  S.add(noHull(mesh(rbox(bw + 0.012, 0.042, bd + 0.012, 0.006, 3), M.bag, { pos: [0, 0.019, 0], cast: false, receive: false, renderOrder: 6 })));
  // 缺陷：番茄から出た水・パンの耳の欠け・ケチャップの滲み
  S.add(noHull(mesh(tubeOf([[0.014, 0.017, 0.012], [0.018, 0.008, 0.02], [0.016, 0.003, 0.028]], 0.0009, 8, 4), MAT.water({ color: '#e08a6a', opacity: 0.5 }), { cast: false })));
  weather(S, { w: 0.02, h: 0.014, pos: [-bw * 0.36, 0.03, -bd * 0.2], kind: 'dirt', color: '#a8863f', opacity: 0.26, seed: (o.seed ?? 1) + 17, spread: 0.0012 });
}

/** クリームパン：絞り筋（カスタードの筋）・粉砂糖・切り込み */
function vCream(P, M, rnd, o) {
  const B = grp('cream'); P.add(B);
  const rx = 0.0435, ry = 0.0178, rz = 0.0348;
  B.add(mesh(bunGeo(rx, ry, rz, 0.05, (o.seed ?? 1) + 7, 1), M.glazed('#c8904e'), { pos: [0, ry * 1.06, 0], name: 'bun' }));
  // 中央の切り込みに沿ってカスタードを絞る（筋が複数見える＝Tube のうねり）
  const line = [[-rx * 0.62, ry * 1.78, 0.001], [-rx * 0.2, ry * 1.9, -2e-3], [rx * 0.2, ry * 1.9, 0.002], [rx * 0.62, ry * 1.74, 0]];
  B.add(mesh(tubeOf(line, 0.0056, 22, 9), M.custard, { name: 'custard-pipe' }));
  // 絞り筋（同一線上に細い出膨れ 3 本）
  for (let k = 0; k < 3; k++) {
    const off = (k - 1) * 0.0034;
    B.add(noHull(mesh(tubeOf(line.map(([x, y, z], i) => [x, y + 0.0016 + Math.abs(off) * 0.1, z + off * (i > 1 ? -1 : 1)]), 0.0016, 20, 6), MAT.food({ color: '#efcf86', spec: 0.7, specPower: 80 }), { cast: false })));
  }
  // 餡（カスタード）がはみ出た箇所
  B.add(noHull(mesh(sph(0.0038, 8, 6), M.custard, { pos: [rx * 0.6, ry * 1.6, rz * 0.32], scale: [1, 0.7, 1], cast: false })));
  // 粉砂糖
  for (let i = 0; i < 18; i++) {
    const a = rnd() * 6.284, u = rnd();
    B.add(noHull(mesh(sph(0.0008 + rnd() * 0.0008, 5, 4), M.flour, {
      pos: [Math.cos(a) * rx * u, ry * 1.9 - u * u * ry * 0.5, Math.sin(a) * rz * u], cast: false, receive: false,
    })));
  }
  // 底の焼き色
  B.add(noHull(mesh(cyl(rx * 0.78, rx * 0.86, 0.0022, 16), M.crust('#9b6531'), { pos: [0, 0.0011, 0], scale: [1, 1, rz / rx], cast: false })));
  weather(B, { w: 0.02, h: 0.014, pos: [-rx * 0.5, ry * 0.9, rz * 0.74], kind: 'chip', color: '#f4ead2', opacity: 0.3, seed: (o.seed ?? 1) + 19, spread: 0.0012 });
  breadBag(B, M, { w: rx * 2 + 0.009, h: ry * 2.2 + 0.006, d: rz * 2 + 0.009, seed: (o.seed ?? 1) + 23, print: ['カスタードクリーム', '北海道産牛乳使用', '#4b5a3c'] });
}

/** ロールパン：綴じ目・打ち粉・バター照り（pack で複数本） */
function vRoll(P, M, rnd, o) {
  const B = grp('roll'); P.add(B);
  const n = Math.max(1, Math.min(4, o.pack ?? 1));
  const { xy, r } = PACKPOS[n];
  for (let i = 0; i < n; i++) {
    const one = grp(`roll-${i}`); B.add(one);
    one.position.set(xy[i][0], 0.001, xy[i][1]);
    const spin = range(rnd, -0.5, 0.5);
    const rx = r * 1.04, ry = r * 0.44, rz = r * 0.8;
    one.add(mesh(bunGeo(rx, ry, rz, 0.045, (o.seed ?? 1) + i * 17, 1, spin), M.glazed('#d29a55'), { pos: [0, ry * 1.05, 0], name: 'roll-body' }));
    // 綴じ目（生地の継ぎ＝中心から斜めに走る筋）
    const cr = [[-rx * 0.8, ry * 0.7, rz * 0.3], [-rx * 0.2, ry * 1.82, 0.001], [rx * 0.42, ry * 1.7, -rz * 0.28], [rx * 0.86, ry * 0.6, -rz * 0.3]];
    one.add(noHull(mesh(tubeOf(cr, 0.0014, 16, 6), M.crust('#b07a3f'), { cast: false })));
    // 天面のクボミ（発酵の割れ）
    one.add(noHull(mesh(sph(0.006, 8, 6), M.crumbSoft('#e9d7ae'), { pos: [rx * 0.18, ry * 1.72, rz * 0.1], scale: [1.6, 0.24, 1], cast: false })));
    // 打ち粉
    for (let k = 0; k < 12; k++) {
      const a = rnd() * 6.284, u = 0.1 + rnd() * 0.85;
      one.add(noHull(mesh(sph(0.0009 + rnd() * 0.0011, 5, 4), M.flour, {
        pos: [Math.cos(a) * rx * u, ry + Math.sin(Math.acos(Math.min(1, u))) * ry * 0.8, Math.sin(a) * rz * u], cast: false, receive: false,
      })));
    }
  }
  const rx = r * 1.04, ry = r * 0.44, rz = r * 0.8;
  // バターの照り（光る筋）
  B.add(noHull(mesh(tubeOf([[-rx * 0.5, ry * 1.9, -rz * 0.2], [0, ry * 2.0, 0.004], [rx * 0.5, ry * 1.86, rz * 0.16]], 0.0022, 12, 6), MAT.food({ color: '#f7e2ae', spec: 0.95, specPower: 160, transparent: true, opacity: 0.7 }), { cast: false })));
  breadBag(B, M, { w: n === 1 ? rx * 2 + 0.01 : W * 0.88, h: n === 1 ? ry * 2.05 + 0.008 : H * 0.8, d: n === 1 ? rz * 2 + 0.01 : D * 0.82, seed: (o.seed ?? 1) + 29, print: ['バターロール', n === 1 ? '発酵バター使用' : `${n} 本入`, '#3b4d6b'] });
  weather(B, { w: 0.02, h: 0.014, pos: [rx * 0.4, ry * 0.4, -rz * 0.8], kind: 'dirt', color: '#9a8258', opacity: 0.28, seed: (o.seed ?? 1) + 31, spread: 0.0012 });
}

const VARIANTS = { toast: vToast, melonpan: vMelonpan, anpan: vAnpan, sandwich: vSandwich, cream: vCream, roll: vRoll };
const VARIANT_LIST = Object.keys(VARIANTS);

function build(options = {}) {
  const variant = VARIANTS[options.variant] ? options.variant : 'toast';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 101);
  const g = grp(`bread-set:${variant}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, mats(options), rnd, { seed, pack: options.pack ?? 1, tint: options.tint });
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

const P_BREAD = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANT_LIST,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_BREAD as P, build as b };
