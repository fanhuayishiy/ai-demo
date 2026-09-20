import { z as rand, g as grp, ac as Box3, m as mesh, c as cyl, M as MAT, H as plane, D as DoubleSide, t as tor, w as weather, r as rbox, U as circ, b as box, J as shape, K as extrude, y as TorusGeometry, k as tubeOf, T as TEX, P as PAL, Y as memo, N as makeCanvas, Q as toTexture, h as decal, a6 as rr } from './index-D8uBk-tk.js';

//  assets/products/price-tag.js —— チェッカープライス・POP・値札 6 variant
//  shelf チェッカープライス（既定＝meta.real 正確）/ hook フック掛け札 / floor 床 POP（折台紙）
//  pop 新発売ポップ（星形・クリップ）/ new100 100 円札 / sale 半額ステッカー
//  数字は TEX.lightPanel で生成（¥ と数字）、台紙側の商品名・バーコードは本ファイル内 canvas で描く
//  ※ floor / pop / hook は現実寸法が契約の代表寸（60×30×4mm）より大きい。
//     → meta.real は既定 variant=shelf の実測、各 variant の実寸は meta.variantReal に公開。
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'price-tag',
  real: [0.06, 0.03, 0.004],
  origin: 'bottom-center',
  variants: ['shelf', 'hook', 'floor', 'pop', 'new100', 'sale'],
  variantReal: {                                  // 実測 bbox（棚・床への仮置はこっちを優先で使うこと）
    shelf: [0.06, 0.03, 0.0041],
    new100: [0.06, 0.032, 0.0052],
    sale: [0.0325, 0.0325, 0.0092],
    hook: [0.0535, 0.05, 0.0176],
    pop: [0.0933, 0.104, 0.0162],
    floor: [0.215, 0.3984, 0.1336],
  },
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* -------------------------------- 局所テクチャ -------------------------------- */
/** プライス台紙（商品名・税表示・バーコード・黄帯） */
const faceTex = (key, name, sub, tone) => memo(`pt:face:${key}`, () => {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, '#fffdf5');
  g.fillStyle = tone; g.fillRect(0, 0, w, h * 0.16);                     // 上帯（カテゴリ色）
  g.fillStyle = '#f0c353'; g.fillRect(0, h * 0.16, w, h * 0.05);         // チェッカー黄帯
  g.fillStyle = '#2b2a26'; g.font = '800 44px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(name, w * 0.04, h * 0.4);
  g.font = '700 24px sans-serif'; g.fillStyle = '#6b6a64';
  g.fillText(sub, w * 0.04, h * 0.58);
  g.fillStyle = '#2b2a26'; g.font = '700 20px sans-serif'; g.textAlign = 'right';
  g.fillText('税込 / tax in', w * 0.96, h * 0.58);
  // バーコード
  g.fillStyle = '#1a1a1a';
  for (let i = 0; i < 34; i++) g.fillRect(w * 0.04 + i * (w * 0.34 / 34), h * 0.74, rnd() > 0.5 ? 4 : 1.6, h * 0.16);
  // 数字欄（lightPanel を貼るための白い枠）
  g.fillStyle = '#fff'; g.fillRect(w * 0.52, h * 0.66, w * 0.44, h * 0.26);
  g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.strokeRect(w * 0.52, h * 0.66, w * 0.44, h * 0.26);
  // 色褪せ・指紋・ヨゴレ
  g.globalAlpha = 0.16; g.fillStyle = '#fff';
  for (let i = 0; i < 14; i++) g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 120, 2 + rnd() * 8);
  g.globalAlpha = 0.08; g.fillStyle = '#7d6a48';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 16, rnd() * 3, 0, 6.284); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});
function fillCv(g, w, h, c) { g.fillStyle = c; g.fillRect(0, 0, w, h); }

/** 半額ステッカー（ぎざぎざ円＋赤文字） */
const halfTex = () => memo('pt:half', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#fff8ea';
  g.beginPath();
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * 6.284, r = 118 + Math.sin(a * 12) * 8;
    i ? g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r) : g.moveTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  g.strokeStyle = '#c0392b'; g.lineWidth = 9; g.stroke();
  g.fillStyle = '#c0392b'; g.font = '800 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('半額', w / 2, h * 0.44);
  g.font = '700 30px sans-serif'; g.fillText('WEEK END SALE', w / 2, h * 0.68);
  g.globalAlpha = 0.22; g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) g.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 90, 3 + rnd() * 9);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 新発売ポップ（星形の印刷面） */
const popTex = (title) => memo(`pt:pop:${title}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#f0c353';
  g.beginPath();
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * 6.284, r = i % 2 ? 78 : 124;
    i ? g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r) : g.moveTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  g.strokeStyle = '#c0392b'; g.lineWidth = 7; g.stroke();
  g.fillStyle = '#c0392b'; g.font = '800 46px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('新発売', w / 2, h * 0.4);
  g.fillStyle = '#2b2a26'; g.font = '800 34px sans-serif';
  g.fillText(title, w / 2, h * 0.6);
  g.globalAlpha = 0.14; g.fillStyle = '#000';
  for (let i = 0; i < 10; i++) g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 70, 2 + rnd() * 6);
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 床 POP（表／裏面の印刷） */
const floorTex = (title, sub, price) => memo(`pt:floor:${title}`, () => {
  const cv = makeCanvas(512, 720);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#fdf4e2'); gr.addColorStop(0.55, '#f7e3c0'); gr.addColorStop(1, '#efdcae');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3f7a52'; g.fillRect(0, 0, w, h * 0.14);
  g.fillStyle = '#fff'; g.font = '800 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('春の厳選', w / 2, h * 0.07);
  g.fillStyle = '#2b2a26'; g.font = '800 96px sans-serif';
  g.fillText(title, w / 2, h * 0.3);
  g.font = '700 40px sans-serif'; g.fillStyle = '#6b5a3a';
  g.fillText(sub, w / 2, h * 0.4);
  // 価格バナー
  g.fillStyle = '#c0392b'; rr(g, w * 0.16, h * 0.5, w * 0.68, h * 0.16, 16); g.fill();
  g.fillStyle = '#fff'; g.font = '800 68px sans-serif';
  g.fillText(price, w / 2, h * 0.58);
  // 写真風ブロック
  g.fillStyle = 'rgba(120,140,90,0.35)'; rr(g, w * 0.12, h * 0.7, w * 0.76, h * 0.2, 12); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * (0.2 + i * 0.15), h * (0.78 + (i % 2) * 0.06), 22 + rnd() * 16, 0, 6.284); g.fill(); }
  // 日焼け・テープ補修・擦れ
  g.globalAlpha = 0.18; g.fillStyle = '#fff';
  for (let i = 0; i < 22; i++) g.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 160, 3 + rnd() * 12);
  g.globalAlpha = 0.5; g.fillStyle = '#e8e2cc';
  g.save(); g.translate(w * 0.5, h * 0.06); g.rotate(-0.05); g.fillRect(-w * 0.2, -14, w * 0.4, 28); g.restore();
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
function mats(o) {
  const t = { tint: o.tint };
  return {
    clear: MAT.glassLite({ color: '#eef6f8', opacity: 0.26, spec: 1, specPower: 240, side: DoubleSide, depthWrite: false }),
    holder: MAT.plastic('#e7e9e4', { steps: 2, spec: 0.4, specPower: 60, ...t }),
    holderY: MAT.plastic(PAL.storeBand2, { steps: 2, spec: 0.38, shadowAmt: 0.74, ...t }),
    card: (map) => MAT.poster({ map, color: '#ffffff', steps: 2, spec: 0.1, specPower: 26, shadowAmt: 0.75, side: DoubleSide, ...t }),
    paperWhite: MAT.paper({ color: '#fdfaf1', spec: 0.06, shadowAmt: 0.8, ...t }),
    red: MAT.plastic('#c0392b', { steps: 2, spec: 0.36, ...t }),
    wire: MAT.metal('#b7bbbe', { repeat: 6 }),
    board: MAT.paper({ color: '#f3ecd8', map: TEX.paper({ base: '#f3ecd8', repeat: 2 }).map, spec: 0.07, shadowAmt: 0.8, side: DoubleSide, ...t }),
    tape: MAT.glassLite({ color: '#f6f1e2', opacity: 0.5, side: DoubleSide, depthWrite: false }),
    floorPlastic: MAT.hardPlastic('#d8dcd8', { repeat: 4, spec: 0.34, ...t }),
  };
}

/* -------------------------------- 数字デカール -------------------------------- */
/** TEX.lightPanel で作った数字プレートを前面へ貼る（正面 +Z） */
function digitsDecal(parent, { text, w, h, pos, rot = [0, 0, 0], bg = '#fffdf2', fg = '#26241f', order = 2 }) {
  decal(parent, { map: TEX.lightPanel({ text, bg, fg, mode: 'sign', spacing: 2 }), w, h, pos, rot, opacity: 1, order });
}

/* ================================ variants ================================ */

/** チェッカープライス（棚条に差込む透明ホルダー＋紙札）＝ 既定 variant・meta.real 準拠 */
function vShelf(P, M, rnd, o) {
  const S = { w: 0.06, h: 0.03, d: 0.004 };
  const G = grp('shelf-tag'); P.add(G);
  const wall = 0.0008;
  // 背板・側壁・底（透明ホルダーのチャンネル）
  G.add(mesh(box(S.w, S.h, wall), M.clear, { pos: [0, S.h / 2, -4e-3 / 2 + wall / 2], name: 'tag-back' }));
  for (const sx of [-1, 1]) G.add(mesh(box(wall, S.h, S.d), M.clear, { pos: [sx * (S.w / 2 - wall / 2), S.h / 2, 0], name: 'tag-side' }));
  G.add(mesh(box(S.w, wall, S.d), M.clear, { pos: [0, wall / 2, 0], name: 'tag-bottom' }));
  // 上面の差し込みリップ（紙札を落とすフチ）
  for (const [y, z, sx, sz] of [[S.h - 0.0004, S.d / 2 - 0.0006, S.w, 0.0012], [S.h - 0.0004, -4e-3 / 2 + 0.0006, S.w, 0.0012]]) {
    G.add(noHull(mesh(box(sx, 0.0008, sz), M.holder, { pos: [0, y, z], cast: false })));
  }
  // 紙札（商品名・バーコード・数字欄）
  const face = M.card(faceTex('sakura-den', '桜でんぶ おにぎり', '120g · 米：国産', '#4f9a72'));
  G.add(noHull(mesh(plane(S.w - 0.005, S.h - 0.005), face, { pos: [0, S.h / 2, -12e-4], cast: false, receive: false })));
  digitsDecal(G, { text: '¥180', w: 0.024, h: 0.012, pos: [0.013, S.h * 0.31, 0.0016], bg: '#fffdf2', fg: '#26241f' });
  // 缺陷：上書きの値上げシール・日焼け・小口のかけ
  G.add(noHull(mesh(plane(0.018, 0.008), M.card(faceTex('over', '¥190', '', '#c0392b')), { pos: [0.013, S.h * 0.31, 0.0021], cast: false, receive: false })));
  weather(G, { w: 0.012, h: 0.006, pos: [-0.016, S.h * 0.72, 0.0019], kind: 'dirt', color: '#a8977a', opacity: 0.34, seed: (o.seed ?? 1) + 3, spread: 0.0008 });
  G.add(noHull(mesh(box(0.006, 0.0012, 0.0012), M.holder, { pos: [S.w / 2 - 0.004, S.h - 0.0008, S.d / 2 - 0.001], rot: [0, 0, 0.2], cast: false })));
}

/** 100 円札（赤丸＋大きな 100）*/
function vNew100(P, M, rnd, o) {
  const S = { w: 0.06, h: 0.03, d: 0.0042 };
  const G = grp('new100'); P.add(G);
  G.add(mesh(rbox(S.w, S.h, S.d, 0.0012, 2), M.paperWhite, { pos: [0, S.h / 2, 0], name: 'tag-body' }));
  // 赤丸（印刷）
  G.add(noHull(mesh(circ(0.0112, 22), M.red, { pos: [S.w * 0.26, S.h * 0.5, S.d / 2 + 0.0004], cast: false, receive: false })));
  digitsDecal(G, { text: '100', w: 0.019, h: 0.0105, pos: [S.w * 0.26, S.h * 0.52, S.d / 2 + 0.0008], bg: '#c0392b', fg: '#fff8ea', order: 3 });
  G.add(noHull(mesh(plane(0.005, 0.006), M.card(faceTex('en', '円', '', '#26241f')), { pos: [S.w * 0.26, S.h * 0.24, S.d / 2 + 0.0008], cast: false, receive: false })));
  // 商品名・税抜注記
  G.add(noHull(mesh(plane(0.03, 0.012), M.card(faceTex('name100', 'お徳用', '10 個入 · 税抜', '#e0812c')), { pos: [-0.06 * 0.16, S.h * 0.52, S.d / 2 + 0.0006], cast: false, receive: false })));
  // 黄緑の「100 円均一」テープ
  G.add(noHull(mesh(box(S.w, 0.0026, 0.0006), M.holderY, { pos: [0, S.h - 0.0014, S.d / 2 - 0.0004], cast: false })));
  // 缺陷：端の剥がれ・日焼け・糊残り
  weather(G, { w: 0.014, h: 0.008, pos: [-0.06 * 0.32, S.h * 0.2, S.d / 2 + 0.0009], kind: 'chip', color: '#d9d2bd', opacity: 0.45, seed: (o.seed ?? 1) + 5, spread: 0.0008 });
  weather(G, { w: 0.012, h: 0.006, pos: [S.w * 0.1, 0.0014, S.d / 2 + 0.0009], kind: 'dirt', color: '#9a8f74', opacity: 0.3, seed: (o.seed ?? 1) + 7, spread: 0.0008 });
}

/** 半額ステッカー（円形・角が捲くれ） */
function vSale(P, M, rnd, o) {
  const G = grp('sale-sticker'); P.add(G);
  const R = 0.0155;
  G.add(noHull(mesh(cyl(R, R, 0.0008, 26), M.card(halfTex()), { pos: [0, R, 0], rot: [90 * D2R, 0, 0], cast: false })));
  // 印刷面（表）
  G.add(noHull(mesh(plane(R * 1.98, R * 1.98), MAT.decal({ map: halfTex(), opacity: 0.99, order: 2 }), { pos: [0, R, 0.0005], cast: false, receive: false })));
  // 裏の離型材（うすい青白）
  G.add(noHull(mesh(plane(R * 1.94, R * 1.94), MAT.paper({ color: '#e6eef2', side: DoubleSide, spec: 0.05 }), { pos: [0, R, -5e-4], rot: [0, Math.PI, 0], cast: false, receive: false })));
  // 捲くれた角（1 箇所）
  const curl = mesh(plane(R * 0.7, R * 0.5), M.card(halfTex()), { pos: [R * 0.62, R * 1.34, 0.0022], rot: [-Math.PI / 2 + 0.7, 0, 0.5] });
  G.add(noHull(curl));
  // 缺陷：糊のはみ出し・剥がし跡・赤インクの転写
  G.add(noHull(mesh(tor(R * 1.01, 0.0006, 5, 24), MAT.plastic('#e8d9b0', { steps: 2, transparent: true, opacity: 0.7 }), { pos: [0, R, 0.0002], cast: false, receive: false })));
  weather(G, { w: 0.012, h: 0.008, pos: [-R * 0.5, R * 0.4, 0.0009], kind: 'scratch', color: '#ffffff', opacity: 0.4, seed: (o.seed ?? 1) + 9, spread: 0.0008 });
}

/** フック掛け札（針金で棚のフックに吊るす） */
function vHook(P, M, rnd, o) {
  const G = grp('hook-tag'); P.add(G);
  const w = 0.052, h = 0.034, t = 0.0016;
  // 札本体（上部に穴）
  G.add(mesh(rbox(w, h, t, 0.0026, 2), M.card(faceTex('hook', '本日の推し', '数量限定 · 朝引き', '#3d76b4')), { pos: [0, h / 2, 0], name: 'hook-card' }));
  G.add(noHull(mesh(new TorusGeometry(0.0042, 0.0009, 6, 16), M.holder, { pos: [0, h - 0.006, 0], cast: false })));
  digitsDecal(G, { text: '¥298', w: 0.022, h: 0.011, pos: [w * 0.2, h * 0.36, t / 2 + 0.0009], bg: '#fffdf2', fg: '#c0392b' });
  // 針金フック（札の穴を通って上へ弯曲し、後ろへ戻る）
  const wire = tubeOf([
    [0, h - 0.006, 0], [0, h + 0.008, 0.0022], [0, h + 0.014, 0.0076],
    [0, h + 0.0118, 0.0138], [0, h + 0.0048, 0.0162], [0, h - 0.0015, 0.0156],
  ], 0.0007, 18, 6);
  G.add(mesh(wire, M.wire, { name: 'hook-wire' }));
  // 札の傾き（片側だけ糸が伸びて下がり気味）＋缺陷
  G.rotation.z = -2.6 * D2R;
  weather(G, { w: 0.014, h: 0.01, pos: [-w * 0.28, h * 0.7, t / 2 + 0.001], kind: 'dirt', color: '#8b8574', opacity: 0.34, seed: (o.seed ?? 1) + 11, spread: 0.001 });
  G.add(noHull(mesh(plane(w * 0.34, h * 0.22), M.tape, { pos: [w * 0.22, h * 0.8, t / 2 + 0.0012], rot: [0, 0, -6 * D2R], cast: false, receive: false })));
}

/** 新発売ポップ（星形カード＋棚端クリップ） */
function vPop(P, M, rnd, o) {
  const G = grp('pop-new'); P.add(G);
  const R = 0.042, pts = 14;
  const sh = shape((s) => {
    for (let i = 0; i <= pts * 2; i++) {
      const a = (i / (pts * 2)) * 6.284 - Math.PI / 2;
      const r = i % 2 ? R * 0.66 : R * (0.94 + ((i * 37) % 11) / 90);   // 不揃いの星
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    s.closePath();
  });
  const geo = extrude(sh, { depth: 0.0012, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0008, bevelSegments: 1, curveSegments: 3 });
  geo.translate(0, 0, -6e-4);
  const card = mesh(geo, M.card(popTex('春限定')), { pos: [0, R + 0.012, 0], rot: [0, 0, 6 * D2R], name: 'pop-star' });
  G.add(card);
  // 印刷（上面デカール）
  G.add(noHull(mesh(plane(R * 1.9, R * 1.9), MAT.decal({ map: popTex('春限定'), opacity: 1, order: 2 }), {
    pos: [0, R + 0.012, 0.0014], rot: [0, 0, 6 * D2R], cast: false, receive: false,
  })));
  // 支持棒＋棚端クリップ
  G.add(mesh(cyl(0.0016, 0.0016, 0.02, 8), M.floorPlastic, { pos: [0, 0.01, 0], name: 'pop-stick' }));
  const clip = grp('clip'); G.add(clip);
  clip.position.set(0, 0.004, 0);
  clip.add(mesh(box(0.024, 0.0016, 0.012), M.holder, { pos: [0, 0, 0] }));
  clip.add(mesh(box(0.024, 0.009, 0.0016), M.holder, { pos: [0, -4e-3, -52e-4] }));
  clip.add(noHull(mesh(tor(0.0028, 0.0011, 5, 12), M.holder, { pos: [0.011, 0.001, -26e-4], rot: [0, Math.PI / 2, 0], cast: false })));
  clip.add(noHull(mesh(tor(0.0028, 0.0011, 5, 12), M.holder, { pos: [-0.011, 0.001, -26e-4], rot: [0, Math.PI / 2, 0], cast: false })));
  // 数字（価格）を下部に
  digitsDecal(G, { text: '150円', w: 0.03, h: 0.013, pos: [0, 0.014, 0.0016], bg: '#fffdf2', fg: '#c0392b' });
  // 缺陷：捲くれた星の一角・セロテープ修理・色褪せ
  G.add(noHull(mesh(plane(R * 0.5, R * 0.34), M.card(popTex('春限定')), { pos: [R * 0.66, R * 1.5, 0.003], rot: [-0.55, 0.2, 0.4], cast: false, receive: false })));
  weather(G, { w: 0.02, h: 0.016, pos: [-R * 0.5, R * 0.9, 0.0024], kind: 'chip', color: '#f6ecd0', opacity: 0.4, seed: (o.seed ?? 1) + 13, spread: 0.001 });
}

/** 床 POP（立体的に折られた台紙：正面パネル＋裏パネル＋底の足） */
function vFloor(P, M, rnd, o) {
  const G = grp('pop-floor'); P.add(G);
  const w = 0.21, h = 0.286, t = 0.0022;
  const face = M.card(floorTex('地サイダー', '桜咲く 駅の味', '150 円'));
  // 前面パネル（後方へ傾く）
  const front = grp('front'); G.add(front);
  front.add(mesh(box(w, h, t), face, { name: 'panel-front' }));
  front.position.set(0, h / 2 + 0.006, 0.034);
  front.rotation.x = 8 * D2R;
  // 裏面板（前方へ傾き、上端で折れてつながる）
  const back = grp('back'); G.add(back);
  back.add(mesh(box(w, h * 0.98, t), M.board, { name: 'panel-back' }));
  back.position.set(0, h / 2 + 0.006, 0.034 - 0.062);
  back.rotation.x = -12 * D2R;
  // 折り山（2 パネルをつなぐ曲面＝小さい円筒）
  G.add(noHull(mesh(cyl(0.012, 0.012, w, 12, 1), face, { pos: [0, h + 0.006, 0.003], rot: [0, 90 * D2R, 0], cast: false })));
  // 底の足（前に折り返した台＝自立させる錘）
  const foot = grp('foot'); G.add(foot);
  foot.add(mesh(box(w * 0.96, t, 0.086), M.board, { pos: [0, 0, 0] }));
  foot.add(mesh(box(w * 0.96, 0.014, t), M.board, { pos: [0, 0.007, -0.043], rot: [14 * D2R, 0, 0] }));
  foot.position.set(0, 0.0012, -0.028);
  // 補強テープ・値札ホルダー（下地クリップ）
  G.add(noHull(mesh(plane(0.05, 0.018), M.tape, { pos: [-w * 0.3, h * 0.28, 0.0362], rot: [0, 0, -14 * D2R], cast: false, receive: false })));
  const holder = grp('mini-price'); G.add(holder);
  holder.add(mesh(rbox(0.06, 0.03, 0.004, 0.0012, 2), M.holder, { pos: [0, 0, 0] }));
  holder.add(noHull(mesh(plane(0.055, 0.026), face, { pos: [0, 0, 0.0022], cast: false, receive: false })));
  digitsDecal(holder, { text: '¥150', w: 0.022, h: 0.011, pos: [0.012, -8e-3, 0.0026], bg: '#fffdf2', fg: '#c0392b' });
  holder.position.set(w * 0.16, 0.024, 0.044);
  holder.rotation.set(-72 * D2R, -6 * D2R, 0);
  // 缺陷：足元の擦れ・雨じみ・破れたポスター残片
  weather(G, { w: 0.08, h: 0.03, pos: [-w * 0.2, 0.02, 0.038], kind: 'dirt', color: '#8b7f66', opacity: 0.4, seed: (o.seed ?? 1) + 17, density: 1.5, spread: 0.002 });
  weather(G, { w: 0.05, h: 0.04, pos: [w * 0.3, h * 0.9, 0.038], kind: 'chip', color: '#efe6cf', opacity: 0.42, seed: (o.seed ?? 1) + 19, spread: 0.002 });
  P.add(noHull(mesh(plane(0.03, 0.022), M.paperWhite, { pos: [-w * 0.44, 0.05, -0.05], rot: [-Math.PI / 2 + 0.1, 0, 0.3], cast: false, receive: false })));
}

const VARIANTS = { shelf: vShelf, hook: vHook, floor: vFloor, pop: vPop, new100: vNew100, sale: vSale };
const VARIANT_LIST = Object.keys(VARIANTS);

function build(options = {}) {
  const variant = VARIANTS[options.variant] ? options.variant : 'shelf';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 23);
  const g = grp(`price-tag:${variant}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.variantReal[variant];
  VARIANTS[variant](inner, mats(options), rnd, { seed, tint: options.tint });
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

export { VARIANT_LIST, build, build as default, meta };
