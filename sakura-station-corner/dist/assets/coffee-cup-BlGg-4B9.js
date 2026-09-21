import { z as rand, g as grp, w as weather, m as mesh, U as circ, ac as Box3, M as MAT, D as DoubleSide, c as cyl, ag as CylinderGeometry, t as tor, k as tubeOf, a as sph, o as lathe, Y as memo, N as makeCanvas, Q as toTexture } from './index-Dj2iGATz.js';

//  assets/products/coffee-cup.js —— セルフ咖啡机まわりのカップコーヒー
//  variant: s / m / l（m が meta.real 基準）, 蓋（飲み口・穴）, 段ボールスリーブ, ストロー,
//  中身のコーヒー面（クラウンリング）, カップの積み stack=2|3（ネス嵌套）
//  options: { seed, scale, variant, tint, lid:'black'|'red'|'blue'|'#rrggbb', sleeve, straw, fill, stack }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'coffee-cup',
  real: [0.078, 0.098, 0.078],      // = variant 'm'（蓋込み実測）
  origin: 'bottom-center',
  variants: ['s', 'm', 'l'],
  variantReal: { s: [0.068, 0.086, 0.068], m: [0.078, 0.098, 0.078], l: [0.088, 0.112, 0.088] },
  stackedReal: [0.078, 0.123, 0.078], // stack = 3 のとき（ネス嵌套の総高、実測値）
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
/** 紙コップの寸法表（実物の 6.5oz / 8oz / 10oz 相当） */
const SPEC = {
  s: { rt: 0.0340, rb: 0.0268, hb: 0.0755, wall: 0.0008, lid: 0.0118 },
  m: { rt: 0.0388, rb: 0.0306, hb: 0.0865, wall: 0.0009, lid: 0.0135 },
  l: { rt: 0.0432, rb: 0.0342, hb: 0.1000, wall: 0.0010, lid: 0.0145 },
};

/* -------------------------------- 局所テクチャ -------------------------------- */
/** カップ本体の印刷（前面にロゴ、周回にリング） */
const cupPrintTex = (key, ink, paper) => memo(`cc:print:${key}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = paper; g.fillRect(0, 0, w, h);
  // 上下の印刷リング
  g.fillStyle = ink; g.fillRect(0, h * 0.06, w, h * 0.022); g.fillRect(0, h * 0.115, w, h * 0.008);
  g.fillRect(0, h * 0.88, w, h * 0.014);
  // ロゴ（前面＋背面）
  for (const cx of [w * 0.25, w * 0.75]) {
    g.save(); g.translate(cx, h * 0.5);
    g.fillStyle = ink; g.beginPath(); g.arc(0, 0, 44, 0, 6.284); g.fill();
    g.fillStyle = paper; g.beginPath(); g.arc(0, 0, 33, 0, 6.284); g.fill();
    g.fillStyle = ink; g.font = '800 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Café', 0, -6);
    g.font = '700 15px sans-serif'; g.fillText(' STAND ', 0, 16);
    // カップマーク
    g.beginPath(); g.moveTo(-9, -34); g.lineTo(9, -34); g.lineTo(6, -46); g.lineTo(-6, -46); g.closePath(); g.fill();
    g.restore();
  }
  // 豆のアイコン（周回）
  for (let i = 0; i < 14; i++) {
    const x = (i + 0.5) * (w / 14), y = h * 0.78;
    g.save(); g.translate(x, y); g.rotate(0.5);
    g.fillStyle = ink; g.globalAlpha = 0.5;
    g.beginPath(); g.ellipse(0, 0, 9, 6, 0, 0, 6.284); g.fill();
    g.strokeStyle = paper; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -3); g.quadraticCurveTo(0, 0, 6, 3); g.stroke();
    g.restore();
  }
  // 水濡れ・色褪せ・かすれ
  g.globalAlpha = 1;
  for (let i = 0; i < 16; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.1; g.fillStyle = '#fff';
    g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 90, 2 + rnd() * 8);
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 段ボールスリーブ（波形エンボス＋上下ノコギリ刃edge を alpha で表現） */
const sleeveTex = (key, ink) => memo(`cc:sleeve:${key}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  // 台形刃（上下 18mm 相当のノコギリ）
  const teeth = 26, th = h * 0.13;
  g.fillStyle = '#c49a63';
  g.beginPath();
  g.moveTo(0, th);
  for (let i = 0; i <= teeth; i++) { const x = (i / teeth) * w; g.lineTo(x, i % 2 ? th : th * 0.35); }
  g.lineTo(w, h - th);
  for (let i = teeth; i >= 0; i--) { const x = (i / teeth) * w; g.lineTo(x, i % 2 ? h - th : h - th * 0.35); }
  g.closePath(); g.fill();
  // ワンウェーブ（段溝）
  g.save(); g.clip();
  for (let i = 0; i < 60; i++) {
    const x = (i / 60) * w;
    const gr = g.createLinearGradient(x, 0, x + w / 60, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.5, 'rgba(120,80,40,0.20)'); gr.addColorStop(1, 'rgba(255,255,255,0.22)');
    g.fillStyle = gr; g.fillRect(x, 0, w / 60, h);
  }
  // 印刷（熱いので注意）
  g.globalAlpha = 0.9; g.fillStyle = ink;
  g.font = '800 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const cx of [w * 0.25, w * 0.75]) {
    g.fillText('やけど注意', cx, h * 0.44);
    g.font = '700 17px sans-serif'; g.fillText('HOT · CAREFUL', cx, h * 0.60); g.font = '800 40px sans-serif';
  }
  // 咖啡滴り・色移り
  g.globalAlpha = 0.5; g.fillStyle = '#5a3a24';
  for (let i = 0; i < 5; i++) { const x = rnd() * w; g.fillRect(x, h * 0.66 + rnd() * 20, 3 + rnd() * 5, 24 + rnd() * 40); }
  g.restore();
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
const LIDCOLOR = { black: '#2c2f33', red: '#b8443a', blue: '#3d6f9e', white: '#eceadf', green: '#4a7f5a' };

function mats(tint, lidKey) {
  const t = { tint };
  const ink = '#6d4a2e';
  const print = cupPrintTex('classic', ink, '#f6f0e2');
  const slv = sleeveTex('kraft', '#6b4a2c');
  return {
    paperOut: MAT.paper({ color: '#ffffff', map: print, side: DoubleSide, uv: { repeat: [1, 1] }, spec: 0.12, ...t }),
    paperIn: MAT.paper({ color: '#f3ecdd', side: DoubleSide, spec: 0.08, shadowAmt: 0.9, ...t }),
    printBand: MAT.poster({ map: print, color: '#ffffff', side: DoubleSide, sat: 1.02, ...t }),
    sleeve: MAT.paper({ color: '#ffffff', map: slv, alphaMap: slv, alphaTest: 0.5, side: DoubleSide, spec: 0.08, shadowAmt: 0.82, ...t }),
    lid: MAT.hardPlastic(LIDCOLOR[lidKey] || lidKey || LIDCOLOR.black, { repeat: 5, spec: 0.55, specPower: 78, ...t }),
    lidIn: MAT.plastic('#b9b6ae', { steps: 2, side: DoubleSide, shadowAmt: 0.95 }),
    coffee: MAT.food({ color: '#3d2314', spec: 0.95, specPower: 140, specCut: 0.07, sheen: 0.25, shadowAmt: 0.5, ...t }),
    crema: MAT.food({ color: '#a8703c', spec: 0.6, specPower: 40, ...t }),
    straw: MAT.hardPlastic('#c1503f', { repeat: 6, ...t }),
    strawWhite: MAT.hardPlastic('#f2efe6', { repeat: 6 }),
    wet: MAT.water({ color: '#c9a97e', opacity: 0.5, scroll: [0.003, 0.006] }),
    stain: MAT.paint('#7a5230', { transparent: true, opacity: 0.42, spec: 0.1, steps: 2 }),
  };
}

/* -------------------------------- 紙コップ本体 -------------------------------- */
/** 外面 → 丸 rolled rim → 内面 を一枚の断面で回す（肉厚・卷边可见）
 *  ※ 縫い目は phiS でずらす（Mesh を Y 回転させると AABB が √2 倍に膨らみ棚寸法と食い違う） */
function cupBodyGeo(sp, phiS = 0) {
  const { rt, rb, hb, wall } = sp;
  const rimR = 0.0026;                                  // 卷边半径
  const cx = rt - rimR * 0.9, cy = hb - rimR * 0.55;
  const pts = [[0, 0], [rb * 0.985, 0], [rb, 0.0016], [rb + 0.0006, 0.0042]];
  // 外側テーパー（軽い張り出し＝円錐になりきらない実形）
  const N = 6;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const y = 0.0042 + (hb - rimR * 1.3 - 0.0042) * t;
    const r = rb + 0.0006 + (cx - rb - 0.0006) * Math.pow(t, 0.94);
    pts.push([r, y]);
  }
  // 卷边（外→上→内へ回る半円弧）
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 1.55;
    pts.push([cx + Math.cos(a) * rimR, cy + Math.sin(a) * rimR]);
  }
  // 内面（上→下）
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const y = (hb - rimR * 1.4) * (1 - t);
    const r = (rt - wall * 2.4) * (1 - t) + (rb - wall) * t;
    pts.push([Math.max(0.0012, r), Math.max(0.0026, y)]);
  }
  pts.push([0, 0.0026]);
  return lathe(pts, 28, phiS);
}

/* -------------------------------- variants -------------------------------- */
function oneCup(parent, M, sp, o, rnd, idx) {
  const C = grp(`cup-${idx}`); parent.add(C);
  const { rt, hb } = sp;
  // 本体（一枚 Lathe：外→卷边→内）
  C.add(mesh(cupBodyGeo(sp, idx * 0.7), M.paperOut, { name: 'cup-body' }));
  // 内側の底（二重底の段）
  C.add(noHull(mesh(cyl(sp.rb * 0.94, sp.rb * 0.9, 0.0022, 22), M.paperIn, { pos: [0, 0.0038, 0], cast: false })));
  // 印刷リング（中段に巻いた帯／thetaStart -90° でロゴが +Z 正面に来る）
  const bandH = hb * 0.30;
  const bandR = (y) => sp.rb + (rt - sp.rb) * (y / hb) + 0.0005;
  C.add(mesh(new CylinderGeometry(bandR(hb * 0.62), bandR(hb * 0.32), bandH, 28, 1, true, -Math.PI / 2, Math.PI * 2),
    M.printBand, { pos: [0, hb * 0.47, 0], name: 'cup-print' }));
  return C;
}

/** 中身のコーヒー面（蓋なし／蓋を開けた状態で見える） */
function coffeeFill(C, M, sp, seed) {
  const y = sp.hb * 0.80;
  const r = sp.rb + (sp.rt - sp.rb) * (y / sp.hb) - 0.0016;
  C.add(noHull(mesh(circ(r, 24), M.coffee, { pos: [0, y, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  // クレマ（縁の明るい環＋注いだ渦）
  C.add(noHull(mesh(tor(r * 0.9, 0.0016, 5, 24), M.crema, { pos: [0, y + 0.0006, 0], rot: [-90 * D2R, 0, 0], cast: false })));
  const swirl = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, a = t * 5.4;
    swirl.push([Math.cos(a) * r * 0.62 * t, y + 0.0008, Math.sin(a) * r * 0.62 * t]);
  }
  C.add(noHull(mesh(tubeOf(swirl, 0.0011, 16, 5), M.crema, { cast: false, receive: false })));
  // 壁面のコーヒー跡（飲んだ後／注ぎすぎ）
  const rnd = rand(seed);
  for (let i = 0; i < 3; i++) {
    const a = rnd() * 6.284;
    C.add(noHull(mesh(sph(0.0016 + rnd() * 0.0014, 6, 5), M.stain, {
      pos: [Math.cos(a) * (r + 0.0006), y + 0.002 + rnd() * 0.008, Math.sin(a) * (r + 0.0006)], scale: [1, 2.4, 0.4], cast: false, receive: false,
    })));
  }
}

/** 蓋：ドーム＋スカート＋飲み口（台形リング・穴）＋蒸気の小穴 */
function cupLid(C, M, sp, o, lidKey) {
  const { rt, hb, lid } = sp;
  const r0 = rt - 0.0002;
  const prof = [
    [0, lid * 0.92], [r0 * 0.32, lid * 0.9], [r0 * 0.56, lid * 0.8], [r0 * 0.76, lid * 0.58],
    [r0 * 0.88, lid * 0.3], [r0 * 0.95, lid * 0.1], [r0, 0.0], [r0 - 0.0016, -1e-3],
    [r0 - 0.0055, -22e-4], [r0 - 0.0055, lid * 0.34], [r0 - 0.0075, lid * 0.36], [0, lid * 0.36],
  ];
  C.add(mesh(lathe(prof, 26), M.lid, { pos: [0, hb - 0.0012, 0], name: 'lid' }));
  // 飲み口（楕円の立ち上がり＋中に見える暗い面）
  const spout = grp('spout'); C.add(spout);
  spout.position.set(rt * 0.36, hb + lid * 0.5, rt * 0.42);
  spout.add(noHull(mesh(new CylinderGeometry(rt * 0.3, rt * 0.32, 0.004, 16, 1, true), M.lid, { scale: [1, 1, 0.62], cast: false })));
  spout.add(noHull(mesh(circ(rt * 0.29, 16), M.coffee, { pos: [0, -6e-4, 0], rot: [-90 * D2R, 0, 0], scale: [1, 0.62, 1], cast: false, receive: false })));
  spout.add(noHull(mesh(tor(rt * 0.3, 0.0011, 5, 16), M.lidIn, { pos: [0, 0.002, 0], rot: [-90 * D2R, 0, 0], scale: [1, 0.62, 1], cast: false })));
  // 蒸気抜き穴（反対側）
  const vx = -rt * 0.45;
  C.add(noHull(mesh(circ(0.0026, 12), MAT.paint('#2a2018', { steps: 2, shadowAmt: 1 }), {
    pos: [vx, hb + lid * 0.62, -rt * 0.30], rot: [-84 * D2R, 0, 0], cast: false, receive: false,
  })));
  // 蓋の開け閉めで付く擦り傷・白化（スカート面に沿って）
  weather(C, { w: 0.010, h: 0.008, pos: [r0 * 0.985, hb - 0.0022, 0], rot: [0, Math.PI / 2, 0], kind: 'scratch', color: '#ffffff', opacity: 0.26, seed: (o.seed ?? 1) + 7, density: 1.4, spread: 0.0008 });
}

/** 段ボールスリーブ（波形・ノコギリ刃 edge） */
function cupSleeve(C, M, sp, o) {
  const { rt, rb, hb } = sp;
  const y0 = hb * 0.30, y1 = hb * 0.74;
  const r0 = rb + (rt - rb) * (y0 / hb) + 0.0017;
  const r1 = rb + (rt - rb) * (y1 / hb) + 0.0017;
  const g = new CylinderGeometry(r1, r0, y1 - y0, 30, 1, true, -Math.PI / 2, Math.PI * 2);
  C.add(mesh(g, M.sleeve, { pos: [0, (y0 + y1) / 2, 0], name: 'sleeve' }));
  // スリーブのズレ跡・咖啡の輪染み（缺陷）
  const a = 0.62, rr = r0 + 0.0009;
  weather(C, { w: 0.012, h: 0.013, pos: [Math.cos(a) * rr, y0 + 0.012, Math.sin(a) * rr], rot: [0, Math.PI / 2 - a, 0], kind: 'dirt', color: '#5b3d22', opacity: 0.42, seed: (o.seed ?? 1) + 11, density: 1.2, spread: 0.0012 });
}

/** ストロー（差し込み・柔軟部・色縞） */
function cupStraw(C, M, sp, o) {
  const S = grp('straw'); C.add(S);
  const top = sp.hb + sp.lid + 0.030;
  const pts = [[0.004, sp.hb * 0.28, 0.002], [0.0055, sp.hb * 0.8, 0.003], [0.0085, sp.hb + sp.lid + 0.004, 0.0035], [0.0135, top - 0.014, -1e-3], [0.021, top, -7e-3]];
  S.add(noHull(mesh(tubeOf(pts, 0.0027, 20, 8), M.straw, { cast: false })));
  // 柔軟部（蛇腹）
  for (let i = 0; i < 6; i++) {
    const t = 0.52 + i * 0.035;
    const p = [0.0085 + (top - 0.014 - 0.0085) * (t - 0.52) * 0.6, sp.hb + sp.lid + 0.004 + (top - 0.018 - sp.hb - sp.lid) * (t - 0.52) * 1.9, 0.0035 - (t - 0.52) * 0.012];
    S.add(noHull(mesh(tor(0.0029, 0.0006, 4, 12), M.strawWhite, { pos: p, rot: [-0.35, 0, 0.4], cast: false })));
  }
  // 白縞（ロゴ帯）
  S.add(noHull(mesh(tubeOf([[0.0055, sp.hb * 0.8, 0.003], [0.0072, sp.hb * 0.95, 0.0032]], 0.00275, 6, 8), M.strawWhite, { cast: false })));
}

/** カップの滴水・底の濡れ跡・焦げ（生活痕） */
function cupLife(C, M, sp, seed) {
  const rnd = rand(seed);
  // 底に付いたコーヒーの滴り（受け皿状の広がり）
  C.add(noHull(mesh(circ(sp.rb * (1.02 + rnd() * 0.1), 20), M.wet, { pos: [0, 0.0004, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  // 外壁を伝う垂れ
  for (let i = 0; i < 3; i++) {
    const a = rnd() * 6.284;
    const r = sp.rb + (sp.rt - sp.rb) * 0.35 + 0.0008;
    C.add(noHull(mesh(sph(0.0014 + rnd() * 0.0012, 6, 5), M.wet, {
      pos: [Math.cos(a) * r, sp.hb * (0.2 + rnd() * 0.4), Math.sin(a) * r], scale: [0.5, 2.6, 0.5], cast: false, receive: false,
    })));
  }
  // rim の軽い凹み（落とした跡＝缺陷：縁の内側にベコリ）
  const da = rnd() * 6.284;
  C.add(noHull(mesh(sph(0.0026, 8, 6), M.paperOut, {
    pos: [Math.cos(da) * (sp.rt - 0.0034), sp.hb * 0.99, Math.sin(da) * (sp.rt - 0.0034)], scale: [1, 0.5, 1], cast: false,
  })));
}

function build(options = {}) {
  const variant = SPEC[options.variant] ? options.variant : 'm';
  const sp = SPEC[variant];
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.charCodeAt(0) * 17);
  const stack = Math.max(1, Math.min(3, options.stack ?? 1));
  const g = grp(`coffee-cup:${variant}${stack > 1 ? ':x' + stack : ''}`);
  const inner = grp('body');
  const M = mats(options.tint, options.lid ?? 'black');
  g.userData.variant = variant;
  g.userData.real = meta.variantReal[variant];

  for (let i = stack - 1; i >= 0; i--) {
    const nest = grp(`nest-${i}`);
    inner.add(nest);
    const C = oneCup(nest, M, sp, options, rnd, i);
    // 上段ほど少し高く積み、口元だけ飛び出す（Y 回転は入れない＝AABB が膨らむため）
    nest.position.y = i * 0.018;
    if (i === 0) {
      if (options.fill !== false) coffeeFill(C, M, sp, seed + 3);
      if (options.lid !== false) cupLid(C, M, sp, { seed }, options.lid ?? 'black');
      if (options.sleeve !== false) cupSleeve(C, M, sp, { seed });
      if (options.straw && (options.lid !== false || options.fill !== false)) cupStraw(C, M, sp);
      cupLife(C, M, sp, seed + 5);
    } else {
      // 下段は縁だけ見える（スリーブの重なり）＋擦れ（背面側）
      if (options.sleeve !== false && i === stack - 1) cupSleeve(C, M, sp, { seed });
      const a = 2.15 + i * 0.35, rr = sp.rt * 0.998;
      weather(C, { w: 0.011, h: 0.012, pos: [Math.cos(a) * rr, sp.hb * 0.9, Math.sin(a) * rr], rot: [0, Math.PI / 2 - a, 0], kind: 'chip', color: '#c9b99a', opacity: 0.35, seed: seed + 9 + i, spread: 0.0008 });
    }
  }
  // 接触面を濡らす滴（台に置いたままの跡）
  inner.add(noHull(mesh(circ(sp.rb * 1.14, 20), M.wet, { pos: [0, 0.0002, 0], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));

  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

export { build, build as default, meta };
