import { g as grp, M as MAT, m as mesh, b as box, r as rbox, c as cyl, o as lathe, a as sph, w as weather, h as decal, k as tubeOf, n as range, T as TEX, E as inst, x as PlaneGeometry, ae as SphereGeometry, p as shadowBlob, q as finish, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-BvEZsPNz.js';

//  assets/station/platform-bin.js —— ホームゴミ箱（缶／ペットボトル 2 口 + 灰皿 + 落ち葉）
//  原点 = 床面接触中心 / +Y 上 / 投入口・ラベルの正面を +Z とする。装配例：(−1.6, −11.4) rotY=180。

const meta = {
  id: 'platform-bin',
  real: [0.8, 0.86, 0.42],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 8411 };

const D2R = Math.PI / 180;

/** 分類ラベル（缶／ペット）を自作 canvas で */
function labelTex(jp, en, bg, mark) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f7f4e8'; g.fillRect(0, h * 0.5, w, h * 0.5);
  jpText(g, jp, { x: w / 2, y: h * 0.26, size: h * 0.3, color: '#f8f5ea', weight: 800, spacing: 8 });
  jpText(g, en, { x: w / 2, y: h * 0.64, size: h * 0.12, color: '#6f7a72', weight: 700, spacing: 4 });
  //  pictogram（缶／ペットのシルエット）
  g.fillStyle = mark; g.strokeStyle = mark; g.lineWidth = 7; g.lineCap = 'round';
  if (en === 'CAN') {
    g.beginPath(); g.roundRect ? g.roundRect(w * 0.44, h * 0.7, w * 0.055, h * 0.22, 4) : g.rect(w * 0.44, h * 0.7, w * 0.055, h * 0.22); g.fill();
    g.beginPath(); g.roundRect ? g.roundRect(w * 0.51, h * 0.72, w * 0.055, h * 0.2, 4) : g.rect(w * 0.51, h * 0.72, w * 0.055, h * 0.2); g.stroke();
  } else {
    g.beginPath();
    g.moveTo(w * 0.46, h * 0.7); g.lineTo(w * 0.46, h * 0.68); g.lineTo(w * 0.49, h * 0.68); g.lineTo(w * 0.49, h * 0.7);
    g.lineTo(w * 0.505, h * 0.74); g.lineTo(w * 0.505, h * 0.92); g.lineTo(w * 0.445, h * 0.92); g.lineTo(w * 0.445, h * 0.74);
    g.closePath(); g.fill();
    g.beginPath(); g.arc(w * 0.56, h * 0.84, h * 0.07, 0.4, 5.6); g.stroke();
  }
  jpText(g, 'お先に ありがとうございます', { x: w / 2, y: h * 0.97, size: h * 0.085, color: '#8b8578', weight: 600 });
  // 日焼け・剥がれ
  g.globalAlpha = 0.22;
  for (let i = 0; i < 700; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#7a6f57'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 3); }
  g.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++) {
    g.fillStyle = '#efe9d6';
    g.beginPath();
    const cx = rnd() * w, cy = rnd() * h, n = 6 + ((rnd() * 5) | 0);
    for (let k = 0; k < n; k++) { const a = (k / n) * 6.283, r = 6 + rnd() * 26; g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6); }
    g.closePath(); g.fill();
  }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 8411;
  const rnd = rand(seed);
  const g = grp('platform-bin');

  const W = 0.76, D = 0.36, H = 0.62;             // 胴体
  const TOP = 0.7;                                 // 上縁（灰皿天板はこれより上）

  const mBody = MAT.metalPaint('#8b9089', { worn: 1.3, base: '#b0b5ae', uv: { repeat: [0.42, 0.42] } });
  const mBodyDark = MAT.metalPaint('#6e746e', { worn: 1.2, base: '#8d938c', uv: { repeat: [0.4, 0.4] } });
  const mLid = MAT.galvanized({ uv: { repeat: [0.5, 0.9] }, spec: 0.34 });
  const mIron = MAT.darkIron({ worn: 1.4, uv: { repeat: [0.5, 0.5] } });
  const mSteel = MAT.metal('#a5a7a2', { worn: 0.9, uv: { repeat: [0.5, 0.5] } });
  const mRubber = MAT.rubber('#33352f', { steps: 2 });
  const mBag = MAT.hardPlastic('#e8e5da', { repeat: 5, opacity: 0.9 });
  const mInner = MAT.paint('#2e2f2b', { spec: 0.04, steps: 2, shadowAmt: 1 });

  /* ══════════════════════════════════════════ 胴体（2 室 + 仕切） */
  const body = grp('body');
  g.add(body);
  body.add(mesh(box(W, H, D), mBody, { pos: [0, H / 2 + 0.05, 0], name: 'shell' }));
  // 前面の立帯（一枚板に見せない）
  for (let i = 0; i < 5; i++) {
    body.add(mesh(box(0.014, H - 0.06, 0.012), mBodyDark, { pos: [-W / 2 + 0.09 + i * ((W - 0.18) / 4), H / 2 + 0.05, D / 2 + 0.005], cast: false }));
  }
  body.add(mesh(box(W + 0.02, 0.05, D + 0.02), mBodyDark, { pos: [0, 0.075, 0], name: 'plinth' }));   // 足回り
  body.add(mesh(box(W - 0.06, 0.014, D - 0.06), mIron, { pos: [0, 0.055, 0], cast: false }));
  // 仕切（中央）と側面の溶接筋
  body.add(mesh(box(0.02, H - 0.04, D - 0.02), mBodyDark, { pos: [0, H / 2 + 0.05, 0], cast: false }));
  for (const sx of [-1, 1]) body.add(mesh(box(0.016, H - 0.02, 0.016), mSteel, { pos: [sx * (W / 2 - 0.02), H / 2 + 0.05, D / 2 - 0.02], cast: false }));

  /* ══════════════════════════════════════════ 上面：投入口 2 箇所 + 灰皿 */
  const top = grp('top');
  g.add(top);
  top.add(mesh(box(W + 0.03, 0.026, D + 0.03), mLid, { pos: [0, TOP, 0], name: 'top-plate' }));
  for (const sx of [-1, 1]) {
    const cx = sx * (W / 4 + 0.01);
    // 投入口の立ち上がり
    top.add(mesh(box(0.3, 0.09, D - 0.1), mLid, { pos: [cx, TOP + 0.05, -0.01], name: 'throat' }));
    top.add(mesh(box(0.26, 0.014, 0.2), mInner, { pos: [cx, TOP + 0.096, 0.0], cast: false, name: 'mouth' }));
    // フラップ（バネ式の蓋・少し開いている）
    const fl = grp('flap', { pos: [cx, TOP + 0.098, -0.1], rot: [-24 * D2R, 0, 0] });
    fl.add(mesh(rbox(0.27, 0.008, 0.2, 0.003, 2), mSteel, { name: 'flap-plate' }));
    fl.add(mesh(cyl(0.008, 0.008, 0.24, 8), mIron, { pos: [0, 0.004, 0.1], rot: [0, 0, 90 * D2R] }));
    top.add(fl);
    // ゴムの縁
    top.add(mesh(box(0.27, 0.01, 0.012), mRubber, { pos: [cx, TOP + 0.094, -0.104], cast: false }));
  }
  // 中央の灰皿（金皿 + 砂 + 吸い殻）
  {
    const ash = grp('ashtray', { pos: [0, TOP + 0.014, D / 2 - 0.075] });
    ash.add(mesh(lathe([[0, 0], [0.085, 0.004], [0.092, 0.026], [0.086, 0.03], [0.076, 0.026], [0.074, 0.006], [0, 0.004]], 18), mSteel, { name: 'ash-dish' }));
    ash.add(mesh(cyl(0.072, 0.072, 0.008, 16), MAT.stone({ color: '#b4ac96' }), { pos: [0, 0.012, 0], cast: false }));   // 砂
    for (let i = 0; i < 5; i++) {
      const a = rnd() * 6.283, r = rnd() * 0.05;
      ash.add(mesh(cyl(0.0045, 0.0045, 0.034, 7), MAT.paper({ color: '#ded8c2' }), { pos: [Math.cos(a) * r, 0.02, Math.sin(a) * r], rot: [Math.PI / 2, 0, a], cast: false }));
      ash.add(mesh(cyl(0.0046, 0.0046, 0.008, 7), MAT.paint('#a9503c', { steps: 2 }), { pos: [Math.cos(a) * r + 0.014, 0.02, Math.sin(a) * r], rot: [Math.PI / 2, 0, a], cast: false }));
      if (i < 2) ash.add(mesh(sph(0.006, 6, 5), MAT.paint('#3a3630', { steps: 2, shadowAmt: 1 }), { pos: [Math.cos(a) * r * 0.6, 0.024, Math.sin(a) * r * 0.6], scale: [1, 0.5, 1], cast: false }));
    }
    weather(ash, { w: 0.14, h: 0.05, pos: [0, 0.014, 0.03], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4a4238', opacity: 0.6, seed: seed + 11, density: 1.8, spread: 0.01 });
    top.add(ash);
    // 灰皿受けのステー
    top.add(mesh(box(0.03, 0.02, 0.06), mIron, { pos: [0, TOP + 0.02, D / 2 - 0.12], cast: false }));
  }
  // 側面の通気スリット
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    body.add(mesh(box(0.012, 0.06, 0.012), mInner, { pos: [sx * (W / 2 + 0.001), 0.24 + i * 0.09, 0.06], cast: false }));
  }

  /* ══════════════════════════════════════════ ラベル・注意札 */
  {
    const labels = [
      [-W / 4 - 0.01, labelTex('かん', 'CAN', '#2f6f9d', '#2f6f9d')],
      [W / 4 + 0.01, labelTex('ペット', 'PET', '#3f8053', '#3f8053')],
    ];
    for (const [x, tex] of labels) {
      const lb = grp('label', { pos: [x, 0.44, D / 2 + 0.008] });
      lb.add(mesh(rbox(0.28, 0.19, 0.006, 0.008, 2), MAT.paper({ color: '#f2efe2' }), { name: 'label-plate' }));
      decal(lb, { map: tex, w: 0.26, h: 0.17, pos: [0, 0, 0.006], order: 1 });
      weather(lb, { w: 0.2, h: 0.1, pos: [0.03, -0.05, 0.008], kind: 'chip', color: '#e6dfc9', opacity: 0.55, seed: seed + Math.round(x * 100), density: 1.6, spread: 0.01 });
      body.add(lb);
    }
    // 手持ち环・蓋の蝶番
    for (const sx of [-1, 1]) {
      body.add(mesh(tubeOf([[sx * (W / 2 + 0.004), 0.5, 0.08], [sx * (W / 2 + 0.004), 0.5, -0.08]], 0.008, 8, 6), mSteel));
    }
    // 底部の点検蓋
    const hatch = grp('hatch', { pos: [0, 0.2, -D / 2 - 0.006] });
    hatch.add(mesh(box(0.34, 0.2, 0.012), mBodyDark, { name: 'hatch-plate' }));
    for (const [hx, hy] of [[-0.14, 0.07], [0.14, 0.07], [-0.14, -0.07], [0.14, -0.07]]) {
      hatch.add(mesh(cyl(0.008, 0.008, 0.01, 6), mIron, { pos: [hx, hy, -8e-3], rot: [90 * D2R, 0, 0], cast: false }));
    }
    body.add(hatch);
  }

  /* ══════════════════════════════════════════ 中身（覗ける範囲の袋・缶） */
  {
    const stuff = grp('contents');
    g.add(stuff);
    for (const sx of [-1, 1]) {
      const cx = sx * (W / 4 + 0.01);
      stuff.add(mesh(rbox(0.24, 0.16, 0.16, 0.05, 2), mBag, { pos: [cx, TOP - 0.09, 0], rot: [0, 0, sx * 8 * D2R], name: 'bag', cast: false }));
      for (let i = 0; i < 3; i++) {
        stuff.add(mesh(cyl(0.031, 0.031, 0.1, 10), i % 2 ? MAT.canBody({ color: '#c04a42' }) : MAT.canBody({ color: '#3d76b4' }), {
          pos: [cx + range(rnd, -0.06, 0.06), TOP - 0.02, range(rnd, -0.06, 0.06)],
          rot: [range(rnd, -0.6, 0.6), 0, range(rnd, -1.2, 1.2)], cast: false,
        }));
      }
    }
  }

  /* ══════════════════════════════════════════ 経年：錆・焦げ・腐葉土・苔 */
  weather(body, { w: W * 0.55, h: 0.3, pos: [-0.1, 0.14, D / 2 + 0.004], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + 21, density: 2.0, spread: 0.03 });
  weather(body, { w: 0.2, h: 0.4, pos: [W / 2 - 0.04, 0.3, D / 2 + 0.005], kind: 'dirt', color: '#5f5646', opacity: 0.42, seed: seed + 22, density: 1.6, spread: 0.03 });
  weather(body, { w: 0.16, h: 0.14, pos: [-W / 2 + 0.03, 0.42, D / 2 + 0.004], kind: 'chip', color: '#cfcab6', opacity: 0.5, seed: seed + 23, density: 1.4, spread: 0.02 });
  // 吸い殻の焦げ（天板）
  weather(top, { w: 0.24, h: 0.14, pos: [0.02, TOP + 0.015, D / 2 - 0.09], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#3d372e', opacity: 0.55, seed: seed + 24, density: 1.5, spread: 0.02 });
  weather(top, { w: 0.2, h: 0.12, pos: [-0.16, TOP + 0.015, -0.02], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a5f3c', opacity: 0.4, seed: seed + 25, density: 1.4, spread: 0.02 });
  // 足元の落ち葉・砂
  {
    const leafTex = TEX.leafCluster({ base: '#98804f', seed: seed + 7 });
    const leafMat = MAT.leaf({ map: leafTex, alphaMap: leafTex, alphaTest: 0.34 });
    g.add(inst(new PlaneGeometry(0.062, 0.062), leafMat, 16, (i, d, r) => {
      const a = r() * 6.283, rr = 0.2 + r() * 0.11;
      d.position.set(Math.cos(a) * rr * 1.2, 0.008 + r() * 0.006, Math.sin(a) * rr * 0.62);
      d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.283);
      d.scale.setScalar(0.7 + r() * 0.7);
    }, { name: 'leaves-at-foot', cast: false, receive: true }));
    g.add(inst(new SphereGeometry(0.008, 4, 3), MAT.ballast({ repeat: 1 }), 22, (i, d, r, col) => {
      const a = r() * 6.283, rr = 0.18 + r() * 0.15;
      d.position.set(Math.cos(a) * rr * 1.3, 0.006, Math.sin(a) * rr * 0.7);
      d.scale.setScalar(0.5 + r() * 0.7);
      col.setRGB(0.72 + r() * 0.24, 0.7 + r() * 0.2, 0.64 + r() * 0.2);
    }, { name: 'grit', cast: false, receive: true }));
    // 箱の上に載ってしまった落ち葉
    g.add(mesh(new PlaneGeometry(0.07, 0.07), leafMat, { pos: [-W / 4 - 0.06, TOP + 0.104, -0.04], rot: [-Math.PI / 2 + 0.1, 0, 1.2], cast: false }));
  }
  shadowBlob(g, { r: 0.4, pos: [0, 0.003, 0], opacity: 0.3, ratio: 0.52 });

  return finish(g, { outline: 'normal', minSize: 0.035 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
