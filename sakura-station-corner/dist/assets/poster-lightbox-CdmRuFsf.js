import { g as grp, M as MAT, m as mesh, r as rbox, c as cyl, b as box, k as tubeOf, l as catenary, w as weather, h as decal, T as TEX, t as tor, q as finish, H as plane, D as DoubleSide, Y as memo, N as makeCanvas, z as rand, a7 as blotches, Q as toTexture, P as PAL, O as jpText, a5 as speckle } from './index-Dv-C_8Uh.js';

//  assets/interior/poster-lightbox.js —— 海报灯箱（wall / ceiling / shelf の 3 形態）
//  アルミ枠＋黄変アクリル／内側 LED（MAT.lampShade + userData.breathe）／ポスター面（TEX.poster）
//  取付金物・配線・ネジ・点灯ムラとホコリ／ケース背面も内容あり（補強筋・铭板・ダクト穴）
//  原点 = 形態ごとの支持基準面の底面中心（wall/shelf = 床 or 台、ceiling = パネル下端）、正面 +Z。

const meta = {
  id: 'poster-lightbox',
  real: [0.94, 1.64, 0.36],   // kind='wall' 基準（ceiling: 0.9×(h+rod+0.02)×0.1 / shelf: w×(h+0.14)×0.11）
  origin: 'ground-center',
};
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** アクリル面板の黄変・反り・ホコリ付着 */
const yellowAcrylicTex = (seed) => memo(`lb:yel|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 9);
  const { g, w, h, rnd } = cv;
  g.fillStyle = 'rgba(255,255,255,0.02)'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, 'rgba(226,196,120,0.34)');
  gr.addColorStop(0.4, 'rgba(255,246,220,0.05)');
  gr.addColorStop(1, 'rgba(214,182,108,0.30)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // 角の焼けどリング（LED 熱）
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * w, y = Math.floor(i / 2) * h;
    const rg = g.createRadialGradient(x, y, 4, x, y, 90);
    rg.addColorStop(0, 'rgba(198,150,72,0.42)');
    rg.addColorStop(1, 'rgba(198,150,72,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
  speckle(g, w, h, { count: 1800, r: [0.4, 2.2], colors: ['#fff6e0', '#c9b487', '#8a8272'], alpha: [0.03, 0.18], rnd });
  return toTexture(cv, { repeat: 1 });
});

/** 庫内（反射板・LED 影・埃） */
const innerReflectorTex = (seed) => memo(`lb:ref|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 21);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(150,145,132,0.5)'; g.lineWidth = 2;
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo((i * w) / 8, 0); g.lineTo((i * w) / 8, h); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, (i * h) / 5); g.lineTo(w, (i * h) / 5 + 6); g.stroke(); }
  blotches(g, w, h, { count: 26, rad: [8, 40], colors: ['#b8ab8d', '#8a8272'], alpha: [0.05, 0.22], rnd });
  for (let i = 0; i < 60; i++) { g.globalAlpha = 0.1 + rnd() * 0.4; g.fillStyle = '#6b6558'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 3, 0, 6.284); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 春の限定ポスター（複数面・レイアウト違い） */
const springPosterTex = (seed, variant) => memo(`lb:poster|${variant}|${seed}`, () => {
  const cv = makeCanvas(512, 340);
  if (!cv) return null;
  cv.rnd = rand(seed + variant * 7);
  const { g, w, h, rnd } = cv;
  const bg = ['#fbf3df', '#f6ece0', '#eef4ea'][variant % 3];
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // 上帯
  g.fillStyle = [PAL.storeBand3, PAL.storeBand2, PAL.awningGreen][variant % 3];
  g.fillRect(0, 0, w, 46);
  jpText(g, ['春の限定', '新発売', '駅ちかフェア'][variant % 3], { x: w / 2, y: 24, size: 28, color: '#fff8ec', weight: 800, spacing: 8 });
  // 写真風の料理ブロック（円と帯）
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.2 + i * 0.3), cy = h * 0.5;
    g.fillStyle = ['#f3d9a8', '#e8b58a', '#cfe0b8'][i];
    g.beginPath(); g.arc(cx, cy, 54, 0, 6.284); g.fill();
    g.globalAlpha = 0.6; g.fillStyle = ['#d9534f', '#f0b23c', '#7fa855'][i];
    g.beginPath(); g.arc(cx - 12, cy - 10, 20 + rnd() * 10, 0, 6.284); g.fill();
    g.globalAlpha = 1;
    jpText(g, ['桜餅', '新茶', '花見弁当'][i], { x: cx, y: cy + 78, size: 18, color: '#4a4235', weight: 700 });
    jpText(g, `${[150, 220, 480][i]}円`, { x: cx, y: cy + 100, size: 20, color: '#b5372f', weight: 800 });
  }
  // 下部の情報帯・花びら
  g.fillStyle = 'rgba(79,163,209,0.85)'; g.fillRect(0, h - 40, w, 40);
  jpText(g, '3月1日〜4月30日まで', { x: w / 2, y: h - 20, size: 20, color: '#f2f8fd', weight: 700, spacing: 3 });
  for (let i = 0; i < 18; i++) {
    g.globalAlpha = 0.3 + rnd() * 0.5; g.fillStyle = PAL.sakuraPetal;
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h * 0.35, 5 + rnd() * 6, 3 + rnd() * 4, rnd() * 3, 0, 6.284); g.fill();
  }
  // 日焼け・シワ・重ね貼りの跡
  g.globalAlpha = 0.16; g.fillStyle = '#a8946a'; g.fillRect(0, 0, w * 0.12, h); g.fillRect(w * 0.9, 0, w * 0.1, h);
  g.globalAlpha = 0.1; g.strokeStyle = '#7a6f58'; g.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(rnd() * w, 0); g.lineTo(rnd() * w, h); g.stroke(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ====================== 灯箱ケース本体（共通） ====================== */
function lightCase(w, h, seed, opts, dbl) {
  const c = grp('lightbox-case');
  const depth = opts.depth ?? 0.075;
  const alu = MAT.metal('#c8cccd', { worn: 0.55, repeat: 2, spec: 0.55 });
  const aluDark = MAT.metal('#969b9d', { worn: 0.75, spec: 0.45 });
  const bodyWhite = MAT.hardPlastic('#efeade', { worn: 0.7 });
  const acrylic = MAT.glassLite({ color: '#f2e9cf', opacity: 0.3 });
  const lampMat = MAT.lampShade({ color: '#fff8e8', emissive: '#ffe7b4', emissiveIntensity: 0.9 });
  const lampDim = MAT.lampShade({ color: '#e6dcc6', emissive: '#c8a870', emissiveIntensity: 0.32 });

  // 枠（アルミアングル 4 本・寄せ口・コーナー金物・ネジ）
  const fw = 0.022;
  c.add(mesh(rbox(w, fw, depth, 0.006, 2), alu, { pos: [0, h / 2 - fw / 2, 0] }));
  c.add(mesh(rbox(w, fw, depth, 0.006, 2), alu, { pos: [0, -h / 2 + fw / 2, 0] }));
  for (const sx of [-1, 1]) c.add(mesh(rbox(fw, h - fw * 2, depth, 0.006, 2), alu, { pos: [sx * (w / 2 - fw / 2), 0, 0] }));
  for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    c.add(noHull(mesh(rbox(fw + 0.004, fw + 0.004, depth + 0.006, 0.004, 2), aluDark, { pos: [cx * (w / 2 - fw / 2), cy * (h / 2 - fw / 2), 0], cast: false })));
    c.add(noHull(mesh(cyl(0.004, 0.004, 0.004, 8), MAT.metal('#6f7477', { spec: 0.6 }), { pos: [cx * (w / 2 - 0.012), cy * (h / 2 - 0.012), depth / 2 + 0.001], rot: [Math.PI / 2, 0, 0], cast: false })));
  }
  // 奥面（庫内）＝反射板＋LED＋ムラ・埃
  c.add(mesh(box(w - fw, h - fw, 0.008), bodyWhite, { pos: [0, 0, -depth / 2 + 0.006], name: 'case-back' }));
  c.add(noHull(mesh(plane(w - fw * 1.6, h - fw * 1.6), MAT.paint('#ffffff', { map: innerReflectorTex(seed), spec: 0.1, steps: 2 }), { pos: [0, 0, -depth / 2 + 0.012], cast: false, receive: false })));
  const nled = Math.max(2, Math.round(h / 0.18));
  const leds = grp('led-strip-root', { pos: [0, 0, -depth / 2 + 0.024] });
  leds.userData.breathe = { speed: 0.44, amount: 0.055, phase: (seed % 11) / 3 };
  for (let i = 0; i < nled; i++) {
    const y = -h / 2 + (i + 0.5) * ((h - fw * 2) / nled);
    const dim = i === 1 || (nled > 3 && i === nled - 1);   // 点灯ムラ
    leds.add(noHull(mesh(box(w - fw * 2.4, 0.016, 0.008), dim ? lampDim : lampMat, { pos: [0, y, 0], cast: false, receive: false })));
    leds.add(noHull(mesh(box(0.012, 0.02, 0.01), aluDark, { pos: [-(w - fw * 2.4) / 2, y, 0], cast: false })));
    leds.add(noHull(mesh(box(0.012, 0.02, 0.01), aluDark, { pos: [(w - fw * 2.4) / 2, y, 0], cast: false })));
  }
  c.add(leds);
  // ポスター面（紙・角めくれ）とアクリル板（黄変）
  const faceZ = -depth / 2 + 0.034;
  const posterMat = MAT.paint('#ffffff', { graphic: true, map: springPosterTex(seed, opts.variant ?? 0), spec: 0.14, specPower: 30, shadowAmt: 0.55, steps: 2 });
  c.add(noHull(mesh(plane(w - fw * 1.4, h - fw * 1.4), posterMat, { pos: [0, 0, faceZ], cast: false, receive: false })));
  if (dbl) {
    c.add(noHull(mesh(plane(w - fw * 1.4, h - fw * 1.4), MAT.paint('#ffffff', { graphic: true, map: springPosterTex(seed + 3, (opts.variant ?? 0) + 1), spec: 0.14, shadowAmt: 0.55, steps: 2 }), { pos: [0, 0, -faceZ - 0.006], rot: [0, Math.PI, 0], cast: false, receive: false })));
    c.add(noHull(mesh(plane(w - fw * 1.2, h - fw * 1.2), acrylic, { pos: [0, 0, -depth / 2 - 0.004], rot: [0, Math.PI, 0], cast: false, receive: false })));
  }
  const ac = noHull(mesh(rbox(w - fw * 1.2, h - fw * 1.2, 0.005, 0.003, 2), acrylic, { pos: [0, 0, depth / 2 - 0.006], cast: false, receive: false }));
  c.add(ac);
  decal(c, { map: yellowAcrylicTex(seed), w: w - fw * 1.4, h: h - fw * 1.4, pos: [0, 0, depth / 2 - 0.0025], opacity: 0.9, order: 1 });
  // ポスターの押さえクリップ 4 处
  for (const [cx, cy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    c.add(noHull(mesh(box(0.02, 0.028, 0.008), aluDark, { pos: [cx * (w / 2 - fw - 0.016), cy * (h / 2 - fw - 0.02), depth / 2 - 0.012], cast: false })));
  }
  // 角めくれ（紙 1 枚浮く）
  const curl = noHull(mesh(plane(0.05, 0.05), MAT.paint('#ffffff', { graphic: true, map: springPosterTex(seed, opts.variant ?? 0), spec: 0.14, side: DoubleSide }), { pos: [(w - fw * 1.4) / 2 - 0.02, -(h - fw * 1.4) / 2 + 0.02, faceZ + 0.004], rot: [0.3, -0.4, 0.7], cast: false, receive: false }));
  c.add(curl);
  // 天側の排熱スリットとホコリ
  for (let i = 0; i < 4; i++) c.add(noHull(mesh(box(0.05, 0.004, depth - 0.02), MAT.paint('#5d6265', { spec: 0.1 }), { pos: [-w / 4 + i * (w / 6), h / 2 - 0.004, 0], cast: false })));
  weather(c, { w: w * 0.5, h: 0.05, pos: [w * 0.1, h / 2 + 0.002, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#a89a7c', opacity: 0.42, seed: seed + 5, spread: 0.004 });
  weather(c, { w: 0.1, h: 0.14, pos: [-w / 2 - 0.002, -h * 0.2, 0.01], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + 7, spread: 0.02 });
  // 铭板・容量ステッカー（背面）と補修テープ（角の欠け）
  decal(c, { map: TEX.lightPanel({ text: 'LED 18W  春', bg: '#e8e2d0', fg: '#4a4a44' }), w: 0.09, h: 0.03, pos: [w * 0.22, -h * 0.34, -depth / 2 - 0.001], rot: [0, Math.PI, 0], opacity: 0.92 });
  c.add(noHull(mesh(box(0.05, 0.024, 0.002), MAT.paper({ color: '#e8e0c6' }), { pos: [w / 2 - 0.07, -h / 2 + 0.055, depth / 2 + 0.001], rot: [0, 0, 0.08], cast: false })));
  // 配線（ケース裏から出る・結束・アース）— 吊り型は上へ、据え型は下へ
  const wy = opts.wireTop ? h * 0.42 : -h * 0.4;
  const wy2 = opts.wireTop ? h * 0.62 : -h * 0.62;
  c.add(noHull(mesh(tubeOf(catenary([w * 0.3, wy, -depth / 2], [w * 0.42, wy2, -depth / 2 - 0.05], 0.03, 10), 0.004, 12, 6), MAT.rubber('#4a4f54'), {})));
  c.add(noHull(mesh(tor(0.008, 0.0022, 5, 12), MAT.plastic('#e8e5da'), { pos: [w * 0.33, (wy + wy2) / 2, -depth / 2 - 0.02], rot: [0, 0, Math.PI / 2], cast: false })));
  return { c, w, h, depth, alu, aluDark };
}

/* ================================ build ================================ */
function build(options = {}) {
  const seed = options.seed ?? 743;
  const kind = ['wall', 'ceiling', 'shelf'].includes(options.kind) ? options.kind : 'wall';
  const w = Math.max(0.24, options.w ?? 0.9);
  const h = Math.max(0.18, options.h ?? 0.6);
  const g = grp(`poster-lightbox:${kind}`);

  const alu = MAT.metal('#c8cccd', { worn: 0.55, repeat: 2, spec: 0.55 });
  const aluDark = MAT.metal('#969b9d', { worn: 0.75, spec: 0.45 });
  const steel = MAT.stainless({ worn: 0.6 });
  const rubberMat = MAT.rubber('#42464b');

  if (kind === 'wall') {
    /* -------- 壁掛け＋床支え（ガラス内側の柱面） -------- */
    const footY = 0.0;
    const base = grp('base', { pos: [0, footY, -0.06] });
    g.add(base);
    base.add(mesh(rbox(w * 0.78, 0.024, 0.2, 0.006, 2), aluDark, { pos: [0, 0.012, 0] }));
    for (const sx of [-1, 1]) {
      base.add(mesh(rbox(0.06, 0.012, 0.16), rubberMat, { pos: [sx * w * 0.32, 0.006, 0] }));
      base.add(noHull(mesh(cyl(0.008, 0.008, 0.014, 8), MAT.metal('#7d8285', { worn: 0.6 }), { pos: [sx * w * 0.32, 0.028, 0], cast: false })));
    }
    base.add(mesh(box(w * 0.78, 0.014, 0.02), alu, { pos: [0, 0.03, 0.1] }));
    // 支柱（2 本）＋壁へ戻るアームと金物
    const postH = 0.98;
    for (const sx of [-1, 1]) {
      const px = sx * (w / 2 - 0.06);
      g.add(mesh(box(0.03, postH, 0.03), alu, { pos: [px, postH / 2, -0.13] }));
      g.add(noHull(mesh(box(0.05, 0.02, 0.05), aluDark, { pos: [px, 0.05, -0.13], cast: false })));
      g.add(mesh(box(0.026, 0.14, 0.026), steel, { pos: [px, postH * 0.62, -0.19] }));
      g.add(noHull(mesh(box(0.05, 0.06, 0.012), aluDark, { pos: [px, postH * 0.62, -0.238], cast: false })));
      for (let i = 0; i < 2; i++) g.add(noHull(mesh(cyl(0.005, 0.005, 0.012, 8), MAT.metal('#6f7477', { spec: 0.6 }), { pos: [px, postH * 0.62 + (i - 0.5) * 0.03, -0.246], rot: [Math.PI / 2, 0, 0], cast: false })));
    }
    // 壁側のアウトレット・配線（床まで下りる）
    g.add(noHull(mesh(tubeOf(catenary([w / 2 - 0.06, postH * 0.2, -0.16], [w / 2 - 0.02, 0.06, -0.2], 0.05, 12), 0.005, 14, 6), rubberMat, {})));
    g.add(mesh(rbox(0.07, 0.1, 0.024, 0.006, 2), MAT.hardPlastic('#e7e2d4', { worn: 0.6 }), { pos: [w / 2 - 0.02, 0.12, -0.222] }));
    g.add(noHull(mesh(box(0.03, 0.02, 0.006), MAT.paint('#4a4f54'), { pos: [w / 2 - 0.02, 0.14, -0.208], cast: false })));
    // 灯箱本体
    const box1 = lightCase(w, h, seed, { depth: 0.075, variant: 0 }, false);
    box1.c.position.set(0, postH + h / 2, -0.11);
    g.add(box1.c);
    // 上屋ダクト（壁へ）
    g.add(noHull(mesh(box(0.06, 0.05, 0.08), MAT.galvanized({ spec: 0.3, worn: 0.6 }), { pos: [-w * 0.25, postH + h + 0.03, -0.16], cast: false })));
    // 下部の埃・飛び傷・貼紙残り
    weather(g, { w: 0.3, h: 0.16, pos: [0.1, 0.24, -0.02], kind: 'dirt', color: '#8b8474', opacity: 0.3, seed: seed + 11, spread: 0.02 });
    decal(g, { map: TEX.wear({ kind: 'chip', color: '#cfc7b4', seed: seed + 13, density: 1.2 }), w: 0.1, h: 0.07, pos: [-w * 0.3, 0.2, -0.112], opacity: 0.5 });
    g.add(noHull(mesh(box(w * 0.5, 0.004, 0.05), MAT.plastic('#d9d2c0', { spec: 0.2 }), { pos: [0, 0.002, 0.06], cast: false })));   // 床のケーブルモール
  } else if (kind === 'ceiling') {
    /* -------- 吊り型（両面・通路中央）：原点 = パネル下端 -------- */
    const box1 = lightCase(w, h, seed, { depth: 0.085, variant: 1, wireTop: true }, true);
    box1.c.position.set(0, h / 2, 0);
    g.add(box1.c);
    // サスロッド（2 本）・ターンバックル・天花玫瑰板・安全チェーン
    const rod = Math.max(0.04, options.rod ?? 0.1);
    for (const sx of [-1, 1]) {
      const px = sx * (w / 2 - 0.1);
      g.add(mesh(cyl(0.006, 0.006, rod, 10), MAT.metal('#b3b8ba', { worn: 0.5 }), { pos: [px, h + rod / 2, 0] }));
      g.add(mesh(cyl(0.011, 0.011, 0.036, 10), MAT.metal('#c9c3b2', { worn: 0.6, spec: 0.6 }), { pos: [px, h + 0.05, 0] }));
      g.add(noHull(mesh(tor(0.012, 0.003, 5, 12), MAT.metal('#9ea3a5', { worn: 0.7 }), { pos: [px, h + 0.026, 0], rot: [Math.PI / 2, 0, 0], cast: false })));
      g.add(noHull(mesh(cyl(0.045, 0.05, 0.016, 14), MAT.metal('#cfd3d4', { worn: 0.5 }), { pos: [px, h + rod - 0.004, 0] })));
      // チェーン（3 粒の link で表現）
      for (let i = 0; i < 3; i++) g.add(noHull(mesh(tor(0.007, 0.0018, 5, 10), MAT.metal('#8f9598', { worn: 0.6 }), { pos: [px + 0.03, h + rod * 0.55 + i * 0.012, 0.01], rot: [i % 2 ? 0 : Math.PI / 2, 0, 0], cast: false })));
    }
    // 余った配線（天花手前でループ）
    g.add(noHull(mesh(tubeOf(catenary([-w * 0.28, h + rod * 0.5, 0.02], [w * 0.16, h + rod * 0.86, -0.02], 0.03, 12), 0.004, 14, 6), rubberMat, {})));
    // 吊り金物の傾き（片側だけ下がり気味）
    box1.c.rotation.z = 0.012;
    // ホコリ（上面に堆積・照明ムラ）
    weather(g, { w: w * 0.7, h: 0.06, pos: [0, h + 0.008, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b6ac93', opacity: 0.45, seed: seed + 17, spread: 0.004 });
    decal(g, { map: yellowAcrylicTex(seed + 2), w: w * 0.5, h: h * 0.4, pos: [-w * 0.22, h * 0.7, 0.045], opacity: 0.5, order: 2 });
    g.add(noHull(mesh(box(w - 0.04, 0.008, 0.03), aluDark, { pos: [0, 0.004, 0], cast: false })));   // 下端の見切り
  } else {
    /* -------- 棚上クランプ型 -------- */
    const foot = grp('clamp', { pos: [0, 0, 0] });
    foot.add(mesh(rbox(0.14, 0.014, 0.1, 0.004, 2), aluDark, { pos: [0, 0.007, 0] }));
    foot.add(mesh(box(0.14, 0.05, 0.012), alu, { pos: [0, 0.03, -0.05] }));
    for (const sy of [0, 1]) foot.add(mesh(cyl(0.007, 0.007, 0.03, 10), steel, { pos: [0.045 - sy * 0.09, 0.03, -0.058], rot: [Math.PI / 2, 0, 0] }));
    foot.add(noHull(mesh(tor(0.011, 0.003, 5, 12), MAT.plastic('#3f4447', { spec: 0.3 }), { pos: [0.045, 0.03, -0.075], rot: [Math.PI / 2, 0, 0], cast: false })));
    foot.add(noHull(mesh(tor(0.011, 0.003, 5, 12), MAT.plastic('#3f4447', { spec: 0.3 }), { pos: [-0.045, 0.03, -0.075], rot: [Math.PI / 2, 0, 0], cast: false })));
    g.add(foot);
    const postH = 0.12;
    g.add(mesh(box(0.024, postH, 0.024), alu, { pos: [0, 0.014 + postH / 2, -0.03] }));
    g.add(noHull(mesh(cyl(0.009, 0.009, 0.02, 10), MAT.metal('#7d8285', { worn: 0.6 }), { pos: [0, 0.014 + postH, -0.03], cast: false })));
    const box1 = lightCase(w, h, seed, { depth: 0.055, variant: 2 }, false);
    box1.c.position.set(0, 0.014 + postH + h / 2, -0.028);
    box1.c.rotation.x = -0.1;
    g.add(box1.c);
    weather(g, { w: 0.1, h: 0.05, pos: [0.02, 0.016, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#a89a7c', opacity: 0.4, seed: seed + 19, spread: 0.003 });
    decal(g, { map: TEX.lightPanel({ text: '棚卸 済', bg: '#f5efdd', fg: '#7a5b2a' }), w: 0.06, h: 0.022, pos: [-w * 0.34, 0.02 + postH + h * 0.1, 0.004], opacity: 0.85 });
  }

  // 形態の違う 2 面目（棚卸シール）
  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
