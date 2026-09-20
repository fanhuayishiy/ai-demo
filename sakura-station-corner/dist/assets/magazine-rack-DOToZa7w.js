import { g as grp, M as MAT, T as TEX, m as mesh, b as box, h as decal, r as rbox, n as range, H as plane, w as weather, c as cyl, k as tubeOf, l as catenary, q as finish, Y as memo, z as rand, N as makeCanvas, a5 as speckle, Q as toTexture, P as PAL, O as jpText } from './index-BFJstGKs.js';
import { b as build$1 } from './magazine-item-C_fc4CJZ.js';
import { b as build$2 } from './candy-bar-DJeLxnQu.js';

//  assets/interior/magazine-rack.js —— 雑誌・新聞ラック（前傾段違い・面陳列＋背陳列）
//  アルミ枠＋前傾棚（押えバー）／magazine-item を面陳列（上 2 段）と背陳列（下段）／新聞束
//  レジ横の小型ラック（文庫・グミ）／上段の帯と新刊札／落ちた雑誌 1 冊／指紋と埃
//  原点 = 床接触面の中心、+Y 上、正面（顾客侧）+Z。装配層は rotY=90 で西壁に付ける想定。

const meta = {
  id: 'magazine-rack',
  real: [1.62, 1.64, 0.88],   // 枠幅 1.60（+小型ラック前面張り出し 0.14）× ヘッダー上端 × 奥行き
  origin: 'ground-center',
};

const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* --------------------------- 局所テクチャ --------------------------- */
/** 棚板の埃・指紋混在（アルミ上） */
const dustFingerTex = (seed) => memo(`mz:dust|${seed}`, () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  cv.rnd = rand(seed + 3);
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  speckle(g, w, h, { count: 2600, r: [0.4, 2.4], colors: ['#cfc8b6', '#f6f2e6', '#8b8578'], alpha: [0.04, 0.24], rnd });
  for (let i = 0; i < 16; i++) {   // 指で触れた筋
    g.globalAlpha = 0.05 + rnd() * 0.12;
    g.strokeStyle = '#9a917c'; g.lineWidth = 1.4 + rnd() * 3.4;
    const x = rnd() * w, y = rnd() * h;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20 + rnd() * 40, y + (rnd() - 0.5) * 20, x + 60 + rnd() * 60, y + (rnd() - 0.5) * 26); g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 新聞の段（束の口・刷り面） */
const newsEdgeTex = (seed) => memo(`mz:news|${seed}`, () => {
  const cv = makeCanvas(256, 64);
  if (!cv) return null;
  cv.rnd = rand(seed + 13);
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#efe9db'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    g.globalAlpha = 0.10 + rnd() * 0.28;
    g.fillStyle = rnd() > 0.5 ? '#cdc6b4' : '#fbf7ea';
    g.fillRect(0, y, w, 1.4);
  }
  for (let i = 0; i < 120; i++) { g.globalAlpha = 0.1 + rnd() * 0.3; g.fillStyle = '#8b8474'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** 新刊札・帯（POP） */
const flagTex = (seed, txt) => memo(`mz:flag|${txt}|${seed}`, () => {
  const cv = makeCanvas(256, 128);
  if (!cv) return null;
  const { g, w, h } = cv;
  g.fillStyle = '#f7f1de'; g.fillRect(0, 0, w, h);
  g.fillStyle = PAL.storeBand3; g.fillRect(0, 0, w, h * 0.3);
  jpText(g, txt, { x: w / 2, y: h * 0.15, size: 26, color: '#fff6ee', weight: 800, spacing: 4 });
  jpText(g, '新刊入荷', { x: w / 2, y: h * 0.62, size: 34, color: '#3f4a44', weight: 800, spacing: 4 });
  g.globalAlpha = 0.5; jpText(g, '380円', { x: w / 2, y: h * 0.88, size: 20, color: '#b5372f', weight: 800 });
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/* ================================ 本体 ================================ */
function build(options = {}) {
  const seed = options.seed ?? 733;
  const rnd = rand(seed);
  const L = Math.max(0.7, options.len ?? 1.6);          // 枠幅（X）
  const DP = 0.42;                                       // 奥行き（Z）
  const H = 1.52;                                        // 枠高
  const g = grp('magazine-rack');

  const alu = MAT.metal('#c6cacb', { worn: 0.5, repeat: 2, spec: 0.55 });
  const aluDk = MAT.metal('#9ba0a2', { worn: 0.7, spec: 0.45 });
  const chrome = MAT.chrome();
  const board = MAT.paint('#efe9da', { map: TEX.paper({ base: '#efe9da' }).map, spec: 0.12, shadowAmt: 0.78 });
  const acrylic = MAT.glassLite({ color: '#e9f2f4', opacity: 0.26 });
  const rubberMat = MAT.rubber('#3f4348');

  /* ---------- 1. 枠（側板・背板・脚） ---------- */
  const frame = grp('frame');
  g.add(frame);
  for (const sx of [-1, 1]) {
    const side = grp('side', { pos: [sx * (L / 2 - 0.012), 0, 0] });
    side.add(mesh(box(0.024, H, DP), alu, { pos: [0, H / 2 + 0.05, 0] }));
    side.add(mesh(box(0.03, 0.05, DP - 0.02), aluDk, { pos: [0, 0.025, 0] }));                        // 脚
    side.add(noHull(mesh(box(0.032, 0.008, DP - 0.06), MAT.rubber('#4b5055'), { pos: [0, 0.054, 0], cast: false })));
    // 側板の抜孔（棚受金物用）と指紋
    for (let i = 0; i < 7; i++) side.add(noHull(mesh(box(0.028, 0.012, 0.012), MAT.paint('#6f7477', { spec: 0.2 }), { pos: [0, 0.24 + i * 0.18, 0.06], cast: false })));
    decal(side, { map: dustFingerTex(seed + sx), w: 0.02, h: 0.5, pos: [sx * 0.013, 0.7, 0.1], rot: [0, sx * Math.PI / 2, 0], opacity: 0.7 });
    frame.add(side);
  }
  // チラシポケット（西側のアクリル・無料新聞折り込み）
  const pocket = grp('flyer-pocket', { pos: [-L / 2 + 0.02, 1.06, DP / 2 - 0.04], rot: [0, -0.1, 0] });
  pocket.add(mesh(rbox(0.016, 0.16, 0.13, 0.004, 2), acrylic, {}));
  pocket.add(mesh(box(0.02, 0.008, 0.13), aluDk, { pos: [0, -0.08, 0], cast: false }));
  for (let i = 0; i < 4; i++) {
    pocket.add(noHull(mesh(box(0.004 + (i % 2) * 0.002, 0.14, 0.1), MAT.paper({ color: ['#f3e9d5', '#e9eff2', '#f7e3e0', '#eef3e4'][i], spec: 0.08 }), {
      pos: [0.004, 0.02 - i * 0.004, 0], rot: [range(rnd, -0.04, 0.04), 0, range(rnd, -0.05, 0.05)], cast: false,
    })));
  }
  decal(pocket, { map: TEX.signboard({ text: '無料配布', bg: '#efe9d8', fg: '#4a5158', size: 96 }), w: 0.1, h: 0.026, pos: [0.012, 0.055, 0], rot: [0, Math.PI / 2, 0], opacity: 0.9 });
  frame.add(pocket);
  // 背板（表＝合板・裏＝補強筋と発注リストの挟み込み）
  const back = grp('back', { pos: [0, 0, -DP / 2 + 0.014] });
  back.add(mesh(box(L - 0.02, H - 0.02, 0.012), board, { pos: [0, H / 2 + 0.03, 0], name: 'rack-back' }));
  for (let i = 0; i < 3; i++) back.add(mesh(box(L - 0.1, 0.03, 0.014), aluDk, { pos: [0, 0.34 + i * 0.42, -0.014] }));
  back.add(noHull(mesh(plane(L * 0.5, 0.2), MAT.poster({ map: TEX.adStrip({ text: '仕入れ一覧', bg: '#e9e3d0', seed: seed + 5 }) }), { pos: [0.1, 0.78, -0.024], rot: [0, Math.PI, 0], cast: false })));
  weather(back, { w: 0.4, h: 0.3, pos: [-L * 0.28, 0.3, -0.024], rot: [0, Math.PI, 0], kind: 'dirt', color: '#8b8474', opacity: 0.26, seed: seed + 7, spread: 0.02 });
  g.add(back);
  // 天header（看板帯）
  const head = grp('header', { pos: [0, H + 0.02, -0.04], rot: [-16 * D2R, 0, 0] });
  head.add(mesh(rbox(L - 0.02, 0.16, 0.026, 0.006, 2), alu, {}));
  decal(head, { map: TEX.signboard({ text: '雑誌・新聞 新刊', bg: '#4fa3d1', fg: '#f4f8fb', size: 96, stripe: '#f2b23c' }), w: L - 0.08, h: 0.13, pos: [0, 0.004, 0.015], opacity: 0.98 });
  head.add(mesh(box(L - 0.02, 0.012, 0.03), aluDk, { pos: [0, -0.084, 0] }));
  g.add(head);

  /* ---------- 2. 前傾棚（3 段・段違い） ---------- */
  const TILT = -13 * D2R;
  const tiers = [
    { y: 0.42, z: 0.0, d: 0.34, mode: 'face' },
    { y: 0.76, z: -0.02, d: 0.32, mode: 'face' },
    { y: 1.1, z: -0.04, d: 0.3, mode: 'spine' },
  ];
  const faceVariants = ['weekly', 'comic', 'magazine', 'women', 'weekly', 'magazine'];
  tiers.forEach((t, ti) => {
    const tier = grp(`tier-${ti}`, { pos: [0, t.y, t.z + 0.02], rot: [TILT, 0, ti === 1 ? 0.004 : 0] });
    // 棚板（アルミ＋前上がり押えバー）
    tier.add(mesh(rbox(L - 0.05, 0.014, t.d, 0.004, 2), alu, { name: `shelf-${ti}` }));
    tier.add(noHull(mesh(box(L - 0.06, 0.004, t.d - 0.03), MAT.paint('#b8bdc0', { spec: 0.3 }), { pos: [0, -0.01, 0], cast: false, receive: true })));   // 板裏（内面）
    for (const sx of [-1, 1]) tier.add(mesh(box(0.014, 0.05, t.d), aluDk, { pos: [sx * ((L - 0.05) / 2), 0.02, 0] }));                                        // 棚受
    const lipY = 0.026;
    tier.add(mesh(box(L - 0.05, 0.012, 0.014), alu, { pos: [0, lipY, t.d / 2 - 0.008] }));                                                                    // 押えバー
    tier.add(noHull(mesh(cyl(0.006, 0.006, L - 0.06, 8), chrome, { pos: [0, lipY + 0.012, t.d / 2 - 0.006], rot: [0, 0, Math.PI / 2], cast: false })));
    // 価格レール（帯）
    decal(tier, { map: TEX.adStrip({ text: ti === 2 ? '文庫・新書' : '週刊誌・漫画', bg: '#f2ead6', seed: seed + ti }), w: L * 0.42, h: 0.03, pos: [-L * 0.26, lipY + 0.002, t.d / 2 + 0.004], rot: [-Math.PI / 2 + 0.24, 0, 0], opacity: 0.95 });
    // 商品
    if (t.mode === 'face') {
      // 面陳列（前列）＋背に 2 列目を覗かせる
      const n = Math.max(4, Math.round((L - 0.1) / 0.215));
      for (let i = 0; i < n; i++) {
        const v = faceVariants[(i + ti * 2) % faceVariants.length];
        const mg = build$1({ seed: seed + 200 + i * 17 + ti * 41, variant: v });
        mg.position.set(-((n - 1) / 2) * 0.215 + i * 0.215, 0.008, 0.02 + (i % 2) * 0.006);
        mg.rotation.set(-9 * D2R, range(rnd, -0.05, 0.05), range(rnd, -0.02, 0.02));
        tier.add(mg);
        if (i % 3 === 0) {   // 後ろに 2 列目（少し高く覗く）
          const b = build$1({ seed: seed + 300 + i * 23 + ti * 7, variant: faceVariants[(i + 3) % faceVariants.length] });
          b.position.set(-((n - 1) / 2) * 0.215 + i * 0.215 + 0.02, 0.01, -0.05);
          b.rotation.set(-13 * D2R, range(rnd, -0.06, 0.06), 0);
          tier.add(b);
        }
      }
      // 1 冊だけ抜けて背表紙が覗く空隙
      if (ti === 0) {
        tier.add(noHull(mesh(box(0.2, 0.28, 0.006), MAT.paint('#d8d2c0', { spec: 0.1 }), { pos: [0.44, 0.15, -0.02], rot: [-9 * D2R, 0, 0], cast: false })));
      }
    } else {
      // 背陳列（1 冊ずつ独立 Mesh・90° 回転で背表紙を顾客へ）
      const spineSet = [['comic', 6], ['weekly', 5], ['magazine', 4], ['women', 5]];
      let sx2 = -L / 2 + 0.1;
      spineSet.forEach(([v, cnt], gi) => {
        for (let k = 0; k < cnt; k++) {
          const one = build$1({ seed: seed + 400 + gi * 61 + k * 13, variant: v });
          const thick = 0.019 + ((k + gi) % 3) * 0.006;
          one.position.set(sx2 + thick / 2, 0.01 + (gi === 3 && k > 2 ? 0.02 : 0), -0.02 + (k % 2) * 0.008);
          one.rotation.set(2 * D2R, 90 * D2R + range(rnd, -0.05, 0.05), range(rnd, -0.02, 0.02));
          tier.add(one);
          sx2 += thick + 0.0022;
        }
        sx2 += 0.014;   // 群れの間
      });
      // 斜めに差し込まれた 1 冊（取り出しかけ）
      const pull = build$1({ seed: seed + 477, variant: 'women' });
      pull.position.set(L / 2 - 0.2, 0.05, 0.06);
      pull.rotation.set(-24 * D2R, 0.28, 0.1);
      tier.add(pull);
    }
    // 新刊札（クリップ留め）
    if (ti !== 2) {
      const flag = grp('flag', { pos: [-L / 2 + 0.18, lipY + 0.05, t.d / 2 - 0.01], rot: [-0.22, range(rnd, -0.12, 0.12), 0.03] });
      flag.add(mesh(rbox(0.11, 0.06, 0.003, 0.002, 2), MAT.paper({ color: '#f7f1de' }), {}));
      decal(flag, { map: flagTex(seed + ti, '今週号'), w: 0.104, h: 0.055, pos: [0, 0, 0.0025], opacity: 0.98 });
      flag.add(noHull(mesh(box(0.018, 0.02, 0.008), aluDk, { pos: [0, -0.034, 0], cast: false })));
      tier.add(flag);
    }
    // 埃（板の奥・隅）
    weather(tier, { w: L * 0.5, h: t.d * 0.5, pos: [0.1, 0.009, -t.d * 0.2], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b8ae96', opacity: 0.34, seed: seed + 31 + ti, spread: 0.004 });
    g.add(tier);
  });

  /* ---------- 3. 新聞束（下段前の床棚） ---------- */
  const news = grp('news-bundle', { pos: [-L / 2 + 0.34, 0.2, 0.1] });
  g.add(news);
  news.add(mesh(rbox(0.42, 0.014, 0.3, 0.004, 2), alu, { pos: [0, -7e-3, 0] }));
  news.add(mesh(box(0.42, 0.04, 0.012), aluDk, { pos: [0, 0.02, 0.15] }));
  for (let i = 0; i < 3; i++) {
    const np = build$1({ seed: seed + 511 + i * 19, variant: 'newspaper', pack: i === 2 ? 1 : 2 });
    np.position.set(-0.12 + i * 0.13, 0.0, i === 1 ? 0.02 : 0);
    np.rotation.set(-Math.PI / 2 + range(rnd, -0.05, 0.05), range(rnd, -0.3, 0.3), 0);
    news.add(np);
  }
  // 束の口（断面）＝別メッシュで厚み感
  for (let i = 0; i < 2; i++) {
    news.add(noHull(mesh(box(0.19, 0.05, 0.26), MAT.paint('#ffffff', { graphic: true, map: newsEdgeTex(seed + i), spec: 0.08, shadowAmt: 0.86, steps: 2 }), {
      pos: [-0.12 + i * 0.13, 0.026, i * 0.02], rot: [0, range(rnd, -0.06, 0.06), 0],
    })));
  }
  news.add(noHull(mesh(box(0.06, 0.002, 0.27), MAT.paper({ color: '#e6dcc0' }), { pos: [0.14, 0.053, 0], rot: [0, 0.02, 0], cast: false })));   // 紙紐
  decal(news, { map: TEX.lightPanel({ text: '新聞 1部 160', bg: '#f3ecd8', fg: '#4a4a44' }), w: 0.14, h: 0.034, pos: [0.05, 0.062, 0.152], rot: [-0.3, 0, 0], opacity: 0.95 });

  /* ---------- 4. レジ横の小型ラック（文庫・グミ） ---------- */
  const small = grp('mini-rack', { pos: [0.55, 0, 0.36], rot: [0, -0.06, 0] });
  g.add(small);
  const mL = 0.44, mH = 0.86;
  for (const sx of [-1, 1]) small.add(mesh(box(0.018, mH, 0.2), alu, { pos: [sx * (mL / 2), mH / 2, 0] }));
  small.add(mesh(box(mL + 0.02, 0.016, 0.2), aluDk, { pos: [0, 0.008, 0] }));                       // 脚台
  small.add(mesh(box(mL, mH - 0.06, 0.01), board, { pos: [0, mH / 2 + 0.02, -0.096] }));            // 背板（裏側も板で塞ぐ）
  small.add(noHull(mesh(box(mL - 0.03, mH - 0.1, 0.006), MAT.paint('#dcd5c4', { spec: 0.1 }), { pos: [0, mH / 2 + 0.02, -0.09], cast: false, receive: true })));
  const mTier = [0.24, 0.48, 0.72];
  mTier.forEach((y, i) => {
    const t3 = grp('mini-tier', { pos: [0, y, 0], rot: [-11 * D2R, 0, 0] });
    t3.add(mesh(rbox(mL - 0.03, 0.012, 0.17, 0.004, 2), alu, {}));
    t3.add(mesh(box(mL - 0.03, 0.01, 0.012), aluDk, { pos: [0, 0.02, 0.083] }));
    if (i < 2) {
      // 文庫（背陳列・1 冊ずつ）
      let bx = -mL / 2 + 0.05;
      for (let k = 0; k < 11; k++) {
        const one = build$1({ seed: seed + 611 + i * 97 + k * 11, variant: ['comic', 'comic', 'weekly'][k % 3] });
        const thick = 0.016 + (k % 3) * 0.003;
        one.position.set(bx + thick / 2, 0.008, 0.01);
        one.rotation.set(3 * D2R, 90 * D2R + range(rnd, -0.04, 0.04), k === 7 ? 0.16 : range(rnd, -0.01, 0.01));
        one.scale.setScalar(0.72);            // 文庫は小さい
        t3.add(one);
        bx += thick + 0.002;
      }
    } else {
      // グミ・ガム（candy-bar を立て掛け）
      for (let k = 0; k < 5; k++) {
        const cb = build$2({ seed: seed + 700 + k * 29, variant: ['gum', 'mint', 'caramel'][k % 3] });
        cb.position.set(-0.15 + k * 0.075, 0.007, 0.02);
        cb.rotation.set(-12 * D2R, range(rnd, -0.14, 0.14), range(rnd, -0.05, 0.05));
        t3.add(cb);
      }
    }
    weather(t3, { w: 0.2, h: 0.06, pos: [0.08, 0.008, -0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#b8ae96', opacity: 0.3, seed: seed + 41 + i, spread: 0.003 });
    small.add(t3);
  });
  // 上部の小型見出し
  const mhead = grp('mini-head', { pos: [0, mH + 0.05, -0.06], rot: [-0.2, 0, 0] });
  mhead.add(mesh(rbox(mL, 0.11, 0.016, 0.004, 2), alu, {}));
  decal(mhead, { map: TEX.signboard({ text: '文庫・グミ', bg: '#f2b23c', fg: '#4a3a12', size: 110 }), w: mL - 0.05, h: 0.09, pos: [0, 0, 0.01], opacity: 0.97 });
  small.add(mhead);
  // 本体枠前板への取付金物（2 点・ボルト）
  for (const sy of [0.3, 0.62]) {
    small.add(noHull(mesh(box(0.06, 0.02, 0.24), aluDk, { pos: [0.11 - 0.11, sy, -0.16], cast: false })));
    small.add(noHull(mesh(cyl(0.006, 0.006, 0.03, 8), MAT.metal('#7d8285', { worn: 0.6 }), { pos: [0, sy, -0.24], rot: [Math.PI / 2, 0, 0], cast: false })));
  }
  g.add(small);

  /* ---------- 5. 落ちた雑誌 1 冊・床の埃 ---------- */
  const fallen = build$1({ seed: seed + 823, variant: 'weekly' });
  fallen.position.set(-0.36, 0.078, 0.44);
  fallen.rotation.set(-Math.PI / 2 + 0.04, 0.72, 0.03);
  g.add(fallen);
  // 落ちた冊子の角の傷み（別メッシュで欠け）
  g.add(noHull(mesh(rbox(0.05, 0.006, 0.07, 0.004, 2), MAT.paper({ color: '#e9e2d0' }), { pos: [-0.24, 0.006, 0.52], rot: [0, 0.9, 0], cast: false })));
  weather(g, { w: 0.4, h: 0.24, pos: [-0.32, 0.0016, 0.4], rot: [-Math.PI / 2, 0, 0.3], kind: 'dirt', color: '#8b8578', opacity: 0.22, seed: seed + 51, spread: 0.002 });
  // 枠の足元の擦り傷・壁側の埃
  weather(g, { w: 0.6, h: 0.06, pos: [0, 0.03, -DP / 2 - 0.002], rot: [0, Math.PI, 0], kind: 'dirt', color: '#7a7365', opacity: 0.3, seed: seed + 53, spread: 0.01 });
  decal(g, { map: dustFingerTex(seed + 9), w: L - 0.1, h: 0.06, pos: [0, 0.016, DP / 2 - 0.02], rot: [-Math.PI / 2, 0, 0], opacity: 0.6, order: 2 });
  // アルミ枠の擦れ・小傷
  for (const sx of [-1, 1]) weather(g, { w: 0.12, h: 0.4, pos: [sx * (L / 2 + 0.002), 0.5, 0.02], rot: [0, sx * Math.PI / 2, 0], kind: 'scratch', color: '#dedcd6', opacity: 0.34, seed: seed + 55 + sx, spread: 0.02 });
  // ガム・チョコの陳列クリップ（上段に挟んだ帯）
  const obi = grp('obi', { pos: [-L / 2 + 0.5, 1.16, 0.09], rot: [-0.25, 0.04, 0] });
  obi.add(mesh(box(0.16, 0.03, 0.004), MAT.paper({ color: '#e2574c' }), {}));
  decal(obi, { map: TEX.lightPanel({ text: '付録つき', bg: '#e2574c', fg: '#fff4ea' }), w: 0.14, h: 0.024, pos: [0, 0, 0.003], opacity: 0.98 });
  g.add(obi);
  // 配線（店内照明のコードが棚の後ろを通る＝中身感）
  g.add(noHull(mesh(tubeOf(catenary([-L / 2 + 0.05, 1.36, -DP / 2 - 0.03], [L / 2 - 0.05, 0.32, -DP / 2 - 0.05], 0.06, 14), 0.004, 16, 6), rubberMat, {})));

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { build, build as default, meta };
