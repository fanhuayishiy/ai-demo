import { g as grp, M as MAT, P as PAL, m as mesh, r as rbox, b as box, c as cyl, w as weather, am as hoop, k as tubeOf, h as decal, ae as SphereGeometry, ag as CylinderGeometry, a as sph, q as finish, N as makeCanvas, O as jpText, Q as toTexture, T as TEX } from './index-D433i3Qe.js';

//  assets/station/rail-signal.js —— 閉そく信号機（色灯式・3 灯／笠／柱／基礎／番号札）
//  ---------------------------------------------------------------------------
//  原点 = 地面（路盤天）接触中心 / +Y 上 / 現示面（レンズ面）を +Z とする。
// 装配例：(1.8, −16.2) に rotY = 0 で線路南側から見える向きに。
// 各レンズ Mesh に userData.signalLamp = { kind:'red'|'yellow'|'green', group:'x', index }
//  → 动效层（traffic-signal）が group:'x' の交互呼吸で柔らかく明滅させる。

const meta = {
  id: 'rail-signal',
  real: [0.91, 4.17, 0.51],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 4404, kind: 'absolute' };

const D2R = Math.PI / 180;
const LAMP = {
  red: { glass: '#a8564f', emissive: '#ff4a3c' },
  yellow: { glass: '#ab9760', emissive: '#ffcf52' },
  green: { glass: '#5f8f78', emissive: '#5fe28a' },
};

/** 番号札（ABL 22 風の架空記号） */
function plateTex(main, sub) {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#2f4d76'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#eae6d6'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
  jpText(g, main, { x: w / 2, y: h * 0.42, size: h * 0.34, color: '#f6f3e6', weight: 800 });
  jpText(g, sub, { x: w / 2, y: h * 0.74, size: h * 0.15, color: '#cfd8e4', weight: 700, spacing: 3 });
  for (let i = 0; i < 800; i++) {
    g.globalAlpha = 0.03 + rnd() * 0.1;
    g.fillStyle = rnd() > 0.5 ? '#fff' : '#20304a';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  return toTexture(cv, { repeat: 1 });
}
const lensMat = (kind, on) => MAT.paint(LAMP[kind].glass, {
  steps: 2, spec: 0.74, specPower: 170, specCut: 0.09, sheen: 0.24,
  emissive: LAMP[kind].emissive, emissiveIntensity: on, shadowAmt: 0.6,
  map: TEX.metal({ base: LAMP[kind].glass, worn: 0.2, repeat: 1 }).map,
});

function build(options = {}) {
  const seed = options.seed ?? 4404;
  const g = grp('rail-signal');

  const H = 3.06;                                   // 信号頭下地の高さ
  const mPole = MAT.metalPaint('#98938a', { worn: 1.15, base: '#b5afa4', uv: { repeat: [0.28, 0.14] } });
  const mCase = MAT.metalPaint('#3f4a44', { worn: 1.05, base: '#6d7772', uv: { repeat: [0.4, 0.4] } });
  const mDark = MAT.darkIron({ worn: 1.3, uv: { repeat: [0.5, 0.5] } });
  const mSteel = MAT.metal('#a3a6a1', { worn: 0.85 });
  const mConc = MAT.concrete({ base: PAL.concreteDark, repeat: 1, cracked: true, joints: 2 });

  /* ══════════════════════════════════════════ 基礎（路盤に埋まり気味） */
  const f = grp('foundation');
  f.add(mesh(rbox(0.46, 0.2, 0.4, 0.02, 2), mConc, { pos: [0, 0.03, 0], name: 'footing' }));
  f.add(mesh(box(0.52, 0.03, 0.46), mConc, { pos: [0, -0.055, 0], cast: false, name: 'footing-spread' }));
  f.add(mesh(box(0.34, 0.03, 0.3), mSteel, { pos: [0, 0.145, 0], name: 'base-plate' }));
  for (const [bx, bz] of [[-0.13, 0.1], [0.13, 0.1], [-0.13, -0.1], [0.13, -0.1]]) {
    f.add(mesh(cyl(0.014, 0.016, 0.05, 6), mDark, { pos: [bx, 0.175, bz], cast: false }));
    f.add(mesh(cyl(0.02, 0.02, 0.018, 6), mSteel, { pos: [bx, 0.205, bz], cast: false }));
  }
  // 土砂の堆积・苔・落ち葉
  f.add(mesh(rbox(0.52, 0.06, 0.46, 0.06, 2), MAT.stone({ color: '#8b7c62' }), { pos: [0, -5e-3, 0.02], cast: false, name: 'dirt-heap' }));
  weather(f, { w: 0.4, h: 0.16, pos: [-0.08, 0.06, 0.202], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 5, density: 1.7, spread: 0.03 });
  g.add(f);

  /* ══════════════════════════════════════════ 柱（点検口・抱き金具・碍子） */
  const pole = grp('pole');
  pole.add(mesh(cyl(0.062, 0.086, H - 0.1, 16), mPole, { pos: [0, (H - 0.1) / 2 + 0.18, 0], name: 'pole' }));
  for (const y of [0.62, 1.34, 2.06, 2.62]) pole.add(hoop(0.068 - (y - 0.62) * 0.004, 0.008, mSteel, { pos: [0, y, 0], rot: [90 * D2R, 0, 0] }));
  {
    const hatch = grp('hatch', { pos: [0, 1.14, 0.072] });
    hatch.add(mesh(rbox(0.11, 0.2, 0.014, 0.006, 2), mPole, { name: 'hatch-door' }));
    hatch.add(mesh(rbox(0.09, 0.18, 0.006, 0.004, 2), mDark, { pos: [0, 0, 0.011] }));
    for (const sy of [-0.078, 0.078]) hatch.add(mesh(cyl(0.006, 0.006, 0.01, 6), mSteel, { pos: [0, sy, 0.014], rot: [90 * D2R, 0, 0] }));
    hatch.add(mesh(box(0.018, 0.012, 0.01), mSteel, { pos: [0.04, 0, 0.014] }));
    pole.add(hatch);
  }
  // 配管（柱を上がって信号頭へ）
  pole.add(mesh(tubeOf([[0.09, 0.24, 0.06], [0.09, 1.2, 0.06], [0.075, 2.3, 0.05], [0.02, H - 0.02, 0.03]], 0.018, 22, 7), mDark));
  for (const y of [0.7, 1.6, 2.5]) pole.add(mesh(box(0.03, 0.02, 0.05), mSteel, { pos: [0.086, y, 0.055], cast: false }));
  // 中継箱
  {
    const jb = grp('junction', { pos: [-0.09, 1.72, 0.02], rot: [0, -6 * D2R, 0] });
    jb.add(mesh(rbox(0.12, 0.2, 0.11, 0.012, 2), mCase, { name: 'relay-box' }));
    jb.add(mesh(box(0.13, 0.016, 0.12), mSteel, { pos: [0, 0.104, 0] }));
    decal(jb, { map: plateTex('22', 'ABL'), w: 0.08, h: 0.08, pos: [0, 0.01, 0.057], order: 1 });
    pole.add(jb);
  }
  weather(pole, { w: 0.16, h: 1.0, pos: [0.05, 0.9, 0.07], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 11, density: 1.8, spread: 0.05 });
  weather(pole, { w: 0.18, h: 0.5, pos: [-0.05, 2.2, 0.05], rot: [0, -20 * D2R, 0], kind: 'dirt', color: '#6b6553', opacity: 0.4, seed: seed + 12, density: 1.4, spread: 0.06 });
  g.add(pole);

  /* ══════════════════════════════════════════ 信号頭（3 灯・笠・仕切り・背面） */
  {
    const head = grp('head', { pos: [0, H + 0.44, 0.03] });
    const W = 0.26, DH = 0.9, DP = 0.19;
    head.add(mesh(rbox(W, DH, DP, 0.02, 2), mCase, { name: 'signal-case' }));
    head.add(mesh(box(W + 0.04, 0.03, DP + 0.05), mSteel, { pos: [0, DH / 2 + 0.02, 0.01] }));           // 上笠
    head.add(mesh(rbox(W - 0.03, DH - 0.05, 0.016, 0.008, 2), MAT.metalPaint('#31393a', { worn: 0.9, base: '#4d5655' }), { pos: [0, 0, DP / 2 + 0.005] }));
    const order = ['red', 'yellow', 'green'];
    const intens = [0.22, 0.16, 0.5];
    for (let i = 0; i < 3; i++) {
      const kind = order[i];
      const y = (1 - i) * (DH / 3) + 0.02;
      const sec = grp(`section-${kind}`, { pos: [0, y, DP / 2 + 0.012] });
      sec.add(hoop(0.078, 0.009, mDark, { rot: [90 * D2R, 0, 0] }));
      const R = 0.26, th = Math.asin(0.072 / R);
      const lens = mesh(new SphereGeometry(R, 22, 11, 0, Math.PI * 2, 0, th), lensMat(kind, intens[i]), {
        pos: [0, 0, -R * Math.cos(th) + 0.014], rot: [Math.PI / 2, 0, 0], cast: false, name: `lens-${kind}`,
      });
      lens.userData.signalLamp = { kind, group: 'x', index: i };
      sec.add(lens);
      // 笠（visor）— 上を覆う半筒 + 前面立ち上がり
      sec.add(mesh(new CylinderGeometry(0.088, 0.093, 0.14, 18, 1, true, Math.PI / 2, Math.PI), mCase, { pos: [0, 0.008, 0.07], rot: [90 * D2R, 0, 0], name: `visor-${kind}` }));
      sec.add(mesh(new CylinderGeometry(0.09, 0.09, 0.014, 18, 1, true, Math.PI / 2, Math.PI), mCase, { pos: [0, 0.008, 0.14], rot: [90 * D2R, 0, 0] }));
      weather(sec, { w: 0.12, h: 0.12, pos: [0.02, 0.02, 0.03], kind: 'dirt', color: '#c8bfa2', opacity: 0.3, seed: seed + 31 + i, density: 0.9, spread: 0.015 });
      head.add(sec);
      if (i < 2) head.add(mesh(box(W - 0.01, 0.014, 0.07), mCase, { pos: [0, y - DH / 6, DP / 2 + 0.03] }));  // 仕切り板
    }
    // 背面（放熱リブ・番号札・吊り金具）
    head.add(mesh(rbox(W - 0.05, DH - 0.1, 0.014, 0.006, 2), MAT.metal('#57605c', { worn: 0.9 }), { pos: [0, 0, -DP / 2 - 0.004] }));
    decal(head, { map: plateTex('22', '閉そく'), w: 0.13, h: 0.13, pos: [0, -0.24, -DP / 2 - 0.013], rot: [0, Math.PI, 0], order: 1 });
    for (let i = 0; i < 4; i++) head.add(mesh(box(W - 0.08, 0.014, 0.02), mCase, { pos: [0, -0.32 + i * 0.21, -DP / 2 - 0.012] }));
    head.add(mesh(sph(0.05, 12, 8), mDark, { pos: [0, -DH / 2 - 0.05, -0.02] }));
    head.add(mesh(cyl(0.026, 0.026, 0.2, 10), mSteel, { pos: [0, -DH / 2 - 0.16, -0.02] }));
    // 柱への抱き金具
    head.add(hoop(0.075, 0.012, mSteel, { pos: [0, -0.1, -0.05], rot: [90 * D2R, 0, 0] }));
    head.add(hoop(0.075, 0.012, mSteel, { pos: [0, 0.42, -0.05], rot: [90 * D2R, 0, 0] }));
    weather(head, { w: 0.22, h: 0.5, pos: [W / 2 - 0.01, 0.1, 0.04], rot: [0, 90 * D2R, 0], kind: 'rust', color: PAL.rust, opacity: 0.42, seed: seed + 41, density: 1.5, spread: 0.06 });
    g.add(head);
  }

  /* ══════════════════════════════════════════ 附属：車上子器・標識・はしご */
  {
    const acc = grp('accessories');
    // 車上信号受光器（レール際の小箱）
    const rec = grp('ats-receiver', { pos: [0.34, 0.14, 0.12], rot: [0, 0, 3 * D2R] });
    rec.add(mesh(rbox(0.2, 0.1, 0.09, 0.014, 2), mCase, { name: 'ats-box' }));
    rec.add(mesh(box(0.21, 0.014, 0.1), mSteel, { pos: [0, 0.056, 0] }));
    rec.add(mesh(tubeOf([[0.1, -0.02, 0], [0.22, -0.06, -0.02], [0.3, -0.02, -0.06]], 0.012, 10, 6), mDark));
    acc.add(rec);
    // 標柱の番号札（柱の中程）
    const tag = grp('number-plate', { pos: [0, 2.42, 0.078] });
    tag.add(mesh(rbox(0.2, 0.14, 0.012, 0.006, 2), MAT.metalPaint('#f0ecdd', { worn: 1.1, base: '#f6f3e6' }), { name: 'tag-plate' }));
    decal(tag, { map: plateTex('22AB', 'ふじみ側'), w: 0.2, h: 0.13, pos: [0, 0, 0.008], order: 1 });
    tag.rotation.z = -2 * D2R;
    acc.add(tag);
    // 点検用足掛（柱の裏側金具 2 段）
    for (const y of [0.9, 1.9]) {
      acc.add(mesh(box(0.2, 0.018, 0.13), mSteel, { pos: [0, y, -0.11], name: 'step-iron' }));
      acc.add(mesh(box(0.02, 0.05, 0.13), mSteel, { pos: [0, y + 0.03, -0.11], cast: false }));
    }
    g.add(acc);
  }
  // 頭部の色褪せ・鳥糞
  weather(g, { w: 0.3, h: 0.2, pos: [0.06, H + 0.92, 0.14], kind: 'dirt', color: '#efe8d4', opacity: 0.45, seed: seed + 51, density: 1.2, spread: 0.03 });
  weather(g, { w: 0.14, h: 0.6, pos: [0, 0.4, -0.08], rot: [0, Math.PI, 0], kind: 'rust', color: '#7b4526', opacity: 0.4, seed: seed + 52, density: 1.6, spread: 0.05 });

  return finish(g, { outline: 'normal', minSize: 0.04 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
