import { g as grp, M as MAT, m as mesh, b as box, c as cyl, k as tubeOf, w as weather, n as range, r as rbox, h as decal, a as sph, T as TEX, x as PlaneGeometry, p as shadowBlob, q as finish, af as BoxGeometry, N as makeCanvas, Q as toTexture, z as rand } from './index-B1SzF3Mh.js';

//  assets/station/platform-bench.js —— ホームの木製長椅（板の反り・脚の錆・ゴミの貼り付き・裏の落書き・固定ボルト）
//  原点 = 床面接触中心 / +Y 上 / 腰掛け面（座る人が向く側）を +Z とする。
//  装配例：(−9.6, −11.3) に rotY = 180 で線路側を向かせて置く。

const meta = {
  id: 'platform-bench',
  real: [1.49, 0.85, 0.46],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 6101 };

const D2R = Math.PI / 180;

/** 反り・捻じれのある一枚板（頂点を手で動かして「木が動いた」感じを出す） */
function plank(w, t, d, bow = 0.012, twist = 0.006, seed = 1) {
  const g = new BoxGeometry(w, t, d, 6, 1, 2);
  const pos = g.attributes.position;
  let s = seed >>> 0;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const u = x / w + 0.5;
    let dy = Math.sin(u * Math.PI) * bow * (y > 0 ? 1 : 0.7);
    dy += (r() - 0.5) * 0.0018;                                    // 表面のざらつき
    pos.setY(i, y + dy);
    pos.setZ(i, z + (u - 0.5) * twist * d * 2 + (r() - 0.5) * 0.0012);
  }
  g.computeVertexNormals();
  return g;
}

/** 裏側の落書き（油性マジキンを消した残り） */
function graffitiTex(seed) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = ['#3a3f52', '#5c3b3b', '#39463a'][k];
    g.globalAlpha = 0.5 + rnd() * 0.3;
    g.lineWidth = 5 + rnd() * 5;
    let x = 40 + rnd() * 120, y = 60 + rnd() * 130;
    g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i < 12; i++) {
      x += 12 + rnd() * 26; y += (rnd() - 0.5) * 44;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 0.35;
  g.strokeStyle = '#cfc7b2'; g.lineWidth = 26;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 6101;
  const rnd = rand(seed);
  const g = grp('platform-bench');

  /* 寸法 */
  const L = 1.50, SD = 0.40, SH = 0.375;          // 奥行き・座面高
  const BW = 0.055;                               // 板幅
  const GAP = 0.012;

  const mWood = MAT.wood({ light: '#b99260', dark: '#79573a', knots: true, uv: { repeat: [0.28, 0.9] }, shadowAmt: 0.88 });
  const mWoodEnd = MAT.wood({ light: '#a9855a', dark: '#6b4e33', uv: { repeat: [0.5, 0.5] } });
  const mLeg = MAT.metalPaint('#5d6560', { worn: 1.3, base: '#8b928d', uv: { repeat: [0.5, 0.5] } });
  const mIron = MAT.darkIron({ worn: 1.3, uv: { repeat: [0.5, 0.5] } });
  MAT.rubber('#3a3d3a', { steps: 2 });

  /* ══════════════════════════════════════════ 脚（錆・塗装膨れ・固定ボルト） */
  for (const sx of [-1, 1]) {
    const leg = grp(`leg-${sx > 0 ? 'e' : 'w'}`, { pos: [sx * (L / 2 - 0.17), 0, 0] });
    // 逆テーパーの脚板（2 枚）
    for (const sz of [-1, 1]) {
      const plate = mesh(plank(0.075, SH - 0.02, 0.014, 0.002, 0.02, seed + (sz + 1) * 3 + sx), mLeg, {
        pos: [0, (SH - 0.02) / 2 + 0.02, sz * (SD / 2 - 0.03)], name: 'leg-plate',
      });
      plate.rotation.x = sz * 2.2 * D2R;
      leg.add(plate);
      leg.add(mesh(box(0.09, 0.02, 0.024), mIron, { pos: [0, 0.03, sz * (SD / 2 - 0.03)], cast: false }));
    }
    // 座受け・背受けアングル
    leg.add(mesh(box(0.1, 0.026, SD - 0.02), mLeg, { pos: [0, SH - 0.01, 0], name: 'seat-rail' }));
    leg.add(mesh(box(0.03, 0.30, 0.026), mLeg, { pos: [-sx * 0.03, SH + 0.16, -SD / 2 + 0.03], rot: [0, 0, sx * 5 * D2R], name: 'back-stay' }));
    leg.add(mesh(box(0.026, 0.026, SD - 0.06), mLeg, { pos: [-sx * 0.05, SH + 0.30, 0], name: 'back-rail' }));
    // 補強リブ・ボルト・アンカー
    leg.add(mesh(box(0.02, 0.02, SD - 0.09), mIron, { pos: [0, SH * 0.55, 0], name: 'tie-rod' }));
    for (const sz of [-1, 1]) {
      leg.add(mesh(cyl(0.012, 0.012, 0.02, 6), mIron, { pos: [0.04, SH - 0.01, sz * (SD / 2 - 0.09)], rot: [90 * D2R, 0, 0], cast: false }));
      leg.add(mesh(cyl(0.011, 0.012, 0.06, 6), mIron, { pos: [0, 0.03, sz * (SD / 2 - 0.03)], rot: [90 * D2R, 0, 0], cast: false }));
      leg.add(mesh(cyl(0.016, 0.016, 0.018, 6), mIron, { pos: [0, 0.009, sz * (SD / 2 + 0.005)], cast: false, name: 'anchor-nut' }));
      leg.add(mesh(tubeOf([[0, 0.02, sz * (SD / 2 - 0.03)], [0.02, 0.0, sz * (SD / 2 - 0.03)]], 0.008, 6, 5), mIron, { cast: false }));
    }
    // 脚の錆・塗装膨れ
    weather(leg, { w: 0.1, h: 0.26, pos: [0.04, 0.16, SD / 2 - 0.03], kind: 'rust', color: '#8a5236', opacity: 0.6, seed: seed + (sx + 1) * 17, density: 1.8, spread: 0.03 });
    weather(leg, { w: 0.09, h: 0.2, pos: [-0.042, 0.2, -SD / 2 + 0.03], rot: [0, Math.PI, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + (sx + 1) * 23, density: 1.6, spread: 0.03 });
    weather(leg, { w: 0.12, h: 0.08, pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.5, seed: seed + (sx + 1) * 31, density: 1.4, spread: 0.02 });
    g.add(leg);
  }

  /* ══════════════════════════════════════════ 座面板（反り・日焼け・ササクレ） */
  const seat = grp('seat-slats');
  g.add(seat);
  const nS = Math.floor((SD - 0.02) / (BW + GAP));
  for (let i = 0; i < nS; i++) {
    const z = -SD / 2 + 0.02 + BW / 2 + i * (BW + GAP);
    const bow = range(rnd, -0.012, 0.016);
    const p = mesh(plank(L - 0.02, 0.026, BW - 0.006, bow, range(rnd, -0.5, 0.5), seed + 100 + i), i % 4 === 0 ? mWoodEnd : mWood, {
      pos: [range(rnd, -6e-3, 0.006), SH + 0.012 + Math.abs(bow) * 0.3, z], name: `seat-slat-${i}`,
    });
    p.rotation.x = range(rnd, -8e-3, 0.008);
    p.rotation.z = range(rnd, -6e-3, 0.006);
    seat.add(p);
    // 板の端の打痕・ささくれ
    if (i % 2 === 0) seat.add(mesh(rbox(0.03, 0.01, BW - 0.02, 0.005, 2), MAT.wood({ light: '#d6b98d', dark: '#b09068', uv: { repeat: [1, 1] } }), { pos: [(L / 2 - 0.05) * (i % 4 === 0 ? 1 : -1), SH + 0.026, z], cast: false }));
  }
  // 座面のねじ（板を留める 4 箇所 × 2 列）
  for (const sx of [-1, 1]) for (let i = 0; i < nS; i++) {
    const z = -SD / 2 + 0.02 + BW / 2 + i * (BW + GAP);
    seat.add(mesh(cyl(0.007, 0.007, 0.008, 6), mIron, { pos: [sx * (L / 2 - 0.17), SH + 0.026, z], cast: false }));
  }

  /* ══════════════════════════════════════════ 背もたれ（板 3 枚 + 裏の落書き） */
  const back = grp('backrest');
  g.add(back);
  for (let i = 0; i < 3; i++) {
    const y = SH + 0.13 + i * 0.115;
    const bow = range(rnd, -8e-3, 0.014);
    const p = mesh(plank(L - 0.04, 0.024, 0.086, bow, range(rnd, -0.4, 0.4), seed + 200 + i), i === 1 ? mWoodEnd : mWood, { pos: [0, y, -SD / 2 + 0.03], name: `back-slat-${i}` });
    p.rotation.x = 6 * D2R;
    back.add(p);
    // 裏側（腰の後ろ）の落書き除去跡
    const gr = decal(back, { map: graffitiTex(), w: 0.44, h: 0.06, pos: [range(rnd, -0.3, 0.3), y - 0.004, -SD / 2 + 0.012], rot: [6 * D2R, 0, 0], opacity: 0.55, order: 1 });
    gr.renderOrder = 4 + i;
  }
  // 肘掛け（端の 2 箇所・木帽）— 田舎駅では珍しく無い仕切り
  for (const sx of [-1, 1]) {
    const arm = grp('armrest', { pos: [sx * (L / 2 - 0.075), SH + 0.19, -0.02] });
    arm.add(mesh(box(0.05, 0.19, 0.05), mLeg, { pos: [0, -0.09, 0] }));
    arm.add(mesh(rbox(0.11, 0.032, 0.34, 0.012, 2), mWoodEnd, { pos: [0, 0.02, 0.02], name: 'arm-cap' }));
    weather(arm, { w: 0.1, h: 0.06, pos: [0.02, 0.04, 0.1], kind: 'chip', color: '#cbb48d', opacity: 0.5, seed: seed + (sx + 1) * 41, density: 1.2, spread: 0.02 });
    back.add(arm);
  }

  /* ══════════════════════════════════════════ ゴミの貼り付き・落ち葉・こぼれ種 */
  {
    const grime = grp('grime');
    g.add(grime);
    // 噛んだガム（座面の下・脚の裏）
    for (let i = 0; i < 7; i++) {
      const under = i < 4;
      grime.add(mesh(sph(range(rnd, 0.008, 0.016), 6, 5), MAT.hardPlastic(i % 3 ? '#e5e0d2' : '#c9c2b0', { repeat: 4, steps: 2 }), {
        pos: [range(rnd, -L / 2 + 0.1, L / 2 - 0.1), under ? SH - 0.005 : SH + 0.026, under ? -SD / 2 + range(rnd, 0.02, 0.1) : range(rnd, -0.12, 0.14)],
        scale: [1, range(rnd, 0.3, 0.6), range(rnd, 0.7, 1.2)], cast: false,
      }));
    }
    // 貼ったままのガムの紙・吸い殻
    grime.add(mesh(box(0.032, 0.001, 0.026), MAT.paper({ color: '#ded7c4' }), { pos: [0.31, SH + 0.026, 0.06], rot: [0, 0.6, 0], cast: false }));
    grime.add(mesh(cyl(0.0045, 0.0045, 0.032, 8), MAT.paper({ color: '#e8e2cc' }), { pos: [-0.44, SH + 0.03, 0.11], rot: [90 * D2R, 0, 0.5], cast: false }));
    grime.add(mesh(cyl(0.0045, 0.0045, 0.008, 8), MAT.paint('#b5563f', { steps: 2 }), { pos: [-0.44 + 0.018, SH + 0.03, 0.112], rot: [90 * D2R, 0, 0.5], cast: false }));
    // 座面と脚元の落ち葉（桜の葉・花がら）
    const leafTex = TEX.leafCluster({ base: '#9c8a5c', seed: seed + 5 });
    const leafMat = MAT.leaf({ map: leafTex, alphaMap: leafTex, alphaTest: 0.34 });
    for (let i = 0; i < 4; i++) {
      grime.add(mesh(new PlaneGeometry(0.05, 0.05), leafMat, {
        pos: [range(rnd, -L / 2 + 0.12, L / 2 - 0.12), SH + 0.027, range(rnd, -SD / 2 + 0.06, SD / 2 - 0.06)],
        rot: [-Math.PI / 2 + range(rnd, -0.16, 0.16), 0, range(rnd, 0, 6.28)], cast: false,
      }));
    }
    shadowBlob(grime, { r: 0.42, pos: [0, 0.004, 0], opacity: 0.26, ratio: 0.42 });
  }

  /* ══════════════════════════════════════════ 板の日焼け・水洟・シミ */
  weather(seat, { w: 0.5, h: 0.2, pos: [-0.35, SH + 0.028, 0.04], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#d9c39a', opacity: 0.45, seed: seed + 61, density: 1.3, spread: 0.01 });
  weather(seat, { w: 0.34, h: 0.16, pos: [0.42, SH + 0.028, -0.08], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6e6552', opacity: 0.4, seed: seed + 62, density: 1.5, spread: 0.01 });
  weather(back, { w: 0.5, h: 0.2, pos: [0.1, SH + 0.36, -SD / 2 + 0.055], kind: 'dirt', color: '#7d7360', opacity: 0.34, seed: seed + 63, density: 1.4, spread: 0.02 });
  // 傘で打たれた跡（座面端の凹み）
  for (let i = 0; i < 5; i++) {
    g.add(mesh(rbox(0.02, 0.006, 0.02, 0.003, 2), mWoodEnd, { pos: [range(rnd, -0.6, 0.6), SH + 0.024, range(rnd, -0.14, 0.14)], rot: [0, range(rnd, 0, 1.5), 0], cast: false }));
  }

  return finish(g, { outline: 'normal', minSize: 0.03 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
