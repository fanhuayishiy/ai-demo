import { g as grp, m as mesh, M as MAT, P as PAL, r as rbox, ak as RingGeometry, k as tubeOf, c as cyl, w as weather, o as lathe, am as hoop, b as box, a as sph, aj as BackSide, D as DoubleSide, p as shadowBlob, q as finish, ar as Color, as as CapsuleGeometry, z as rand } from './index-BvEZsPNz.js';

//  assets/street/street-lamp-retro.js —— レトロ街灯（鋄物支柱・飾りリング・アーム曲管・笠・グローブ／コブラ型）
//  要求：灯具に MAT.lampShade + userData.breathe、内側スス・鳥糞・虫の死骸・再塗装跡・基礎コンクリート

const meta = {
  id: 'street-lamp-retro',
  real: [0.42, 4.6, 0.42],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 31, height: 4.6, kind: 'cobra' };

const D2R = Math.PI / 180;

/** 乳白ガラス（内側スス・黄変）：glassLite に暖色を薄く透す */
const milkGlass = (soot = 1) =>
  MAT.glassLite({
    color: soot > 0.5 ? '#efe4cd' : '#f4f0e4',
    opacity: 0.42,
    spec: 0.95,
    specPower: 210,
    sheen: 0.35,
    rim: 0.5,
    shadowAmt: 0.42,
    steps: 2,
  });

function build(options = {}) {
  const { seed = 31, kind = 'cobra' } = options;
  const height = options.height ?? 4.6;
  const rnd = rand(seed);
  const g = grp('street-lamp-retro');

  /* ------------------------- 基礎コンクリートと土台 ------------------------- */
  const footing = grp('footing');
  footing.add(mesh(rbox(0.52, 0.14, 0.52, 0.02, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 2, cracked: true }), { pos: [0, 0.03, 0] }));
  footing.add(mesh(rbox(0.4, 0.07, 0.4, 0.014, 2), MAT.concrete({ base: '#c6c0b3', repeat: 2 }), { pos: [0, 0.125, 0] }));
  // 根元の土縁（舗装との段差埋め）
  const grind = mesh(new RingGeometry(0.2, 0.34, 22, 1), MAT.asphalt({ tone: 1, repeat: 6 }), { pos: [0, 0.004, 0], rot: [-90 * D2R, 0, 0], cast: false });
  grind.userData.noOutline = true;
  footing.add(grind);
  // アース線（点検口ネジに繋がる）
  footing.add(mesh(tubeOf([[0.13, 0.02, 0.16], [0.2, 0.015, 0.24], [0.26, 0.05, 0.26]], 0.005, 14, 5), MAT.metal('#7d8285', { worn: 0.9 })));
  g.add(footing);

  // ベースボルト 4 本（鋳物フランジ）
  const flangeY = 0.16;
  g.add(mesh(cyl(0.148, 0.16, 0.05, 18), MAT.metalPaint('#4a4f52', { worn: 0.95, base: '#6d7376' }), { pos: [0, flangeY, 0] }));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.42 + rnd() * 0.12;
    const r = 0.118;
    const bolt = mesh(cyl(0.014, 0.015, 0.05, 6), MAT.metal('#9aa0a3', { worn: 0.8 }), { pos: [Math.cos(a) * r, flangeY + 0.038, Math.sin(a) * r] });
    g.add(bolt);
    g.add(mesh(cyl(0.019, 0.019, 0.012, 6), MAT.metal('#8b8f92', { worn: 0.9 }), { pos: [Math.cos(a) * r, flangeY + 0.066, Math.sin(a) * r] }));
    // ボルト頭からの錆流レ
    weather(g, { w: 0.035, h: 0.11, pos: [Math.cos(a) * r, flangeY - 0.02, Math.sin(a) * r + 0.012], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + i * 7, count: 1, density: 1.6 });
  }

  /* ------------------------- 鋳物支柱（断面を旋盤 lathe で起こす） ------------------------- */
  const bodyMat = MAT.metalPaint(PAL.lampGreen, { worn: 0.85, repeat: 3, base: shadeHex(PAL.lampGreen, 1.25) });
  const prof = [
    [0.0, 0], [0.145, 0.0], [0.15, 0.05], [0.128, 0.1], [0.108, 0.15],
    [0.1, 0.2], [0.084, 0.3], [0.078, 0.5], [0.068, height * 0.32],
    [0.058, height * 0.6], [0.052, height * 0.82], [0.05, height * 0.94],
    [0.056, height * 0.965], [0.048, height * 0.985], [0.0, height],
  ];
  const post = mesh(lathe(prof, 22), bodyMat, { name: 'lamp-post' });
  g.add(post);

  // 飾りリング（3 段：根元・中段・上段）
  for (const [t, w] of [[0.055, 0.026], [0.3, 0.018], [0.62, 0.014], [0.88, 0.012]]) {
    const y = height * t;
    const rr = 0.068 + (1 - t) * 0.055 + w * 0.5;
    g.add(hoop(rr, w * 0.55, bodyMat, { pos: [0, y, 0], rot: [90 * D2R, 0, 0] }));
    g.add(hoop(rr * 0.94, w * 0.3, bodyMat, { pos: [0, y + w * 1.1, 0], rot: [90 * D2R, 0, 0] }));
  }
  // 縦の鋺肉（fluting）4 本 — 支柱の中程まで
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const r0 = 0.086;
    const fl = mesh(box(0.016, height * 0.26, 0.024), bodyMat, { pos: [Math.cos(a) * r0, height * 0.2, Math.sin(a) * r0] });
    fl.rotation.y = -a;
    g.add(fl);
  }

  /* ------------------------- 点検口（蓋・ネジ・丁番） ------------------------- */
  {
    const hy = 0.62, hr = 0.072;
    const hatch = grp('hatch', { pos: [0, hy, hr + 0.006] });
    hatch.add(mesh(rbox(0.13, 0.16, 0.018, 0.008, 2), bodyMat, { name: 'hatch-door' }));
    hatch.add(mesh(rbox(0.108, 0.138, 0.008, 0.006, 2), MAT.metalPaint('#3d4a42', { worn: 0.7, base: '#5d6a62' }), { pos: [0, 0, 0.014] }));
    for (const [sx, sy] of [[-0.05, 0.062], [0.05, 0.062], [-0.05, -0.062]]) {
      hatch.add(mesh(cyl(0.006, 0.006, 0.008, 6), MAT.metal('#b0a89a', { worn: 0.8 }), { pos: [sx, sy, 0.023], rot: [90 * D2R, 0, 0] }));
    }
    // 丁番 2 箇所
    for (const sy of [0.045, -0.045]) {
      hatch.add(mesh(box(0.026, 0.02, 0.016), MAT.metal('#8f9497', { worn: 0.85 }), { pos: [0.068, sy, 0.006] }));
      hatch.add(mesh(cyl(0.005, 0.005, 0.026, 8), MAT.metal('#9aa0a3'), { pos: [0.068, sy, 0.006] }));
    }
    // 内部（配線・端子台 — 開けても中身がある）
    hatch.add(mesh(box(0.09, 0.12, 0.03), MAT.paint('#2a2d30', { steps: 2, shadowAmt: 1 }), { pos: [0, 0, -0.014] }));
    hatch.add(mesh(tubeOf([[-0.03, -0.05, -0.01], [-0.02, 0.01, 0.0], [0.02, 0.05, -0.01]], 0.005, 10, 5), MAT.rubber('#c8a24a')));
    g.add(hatch);
    weather(g, { w: 0.16, h: 0.09, pos: [0.02, hy - 0.1, hr + 0.02], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 21, count: 2, spread: 0.03 });
  }

  /* ------------------------- 顶部・アーム曲管 ------------------------- */
  const topY = height;
  // 柱头キャップ
  g.add(mesh(lathe([[0, 0], [0.062, 0.0], [0.058, 0.035], [0.03, 0.06], [0.0, 0.066]], 18), bodyMat, { pos: [0, topY, 0] }));

  const head = grp('lamp-head');
  if (kind === 'globe') {
    // 球を 3 本の巻アームで支える（古典型）
    const gr = 0.17;
    const gy = topY + 0.3;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const pts = [];
      for (let s = 0; s <= 8; s++) {
        const t = s / 8;
        pts.push([Math.cos(a) * (0.05 + t * 0.1), topY - 0.06 + t * (gy - topY + 0.16), Math.sin(a) * (0.05 + t * 0.1)]);
      }
      head.add(mesh(tubeOf(pts, 0.013, 16, 6), bodyMat));
    }
    // グローブ（乳白ガラス・内側スス）
    const globe = mesh(sph(gr, 22, 16), milkGlass(1), { name: 'globe', pos: [0, gy, 0] });
    globe.castShadow = false;
    head.add(globe);
    // 内側：電球＋すすけた天面
    const bulb = mesh(sph(0.05, 12, 10), MAT.lampShade({ color: '#fff5df', emissive: '#ffdca4', emissiveIntensity: 0.95 }), { pos: [0, gy - 0.02, 0], cast: false });
    bulb.userData.breathe = { speed: 0.42, amount: 0.07, phase: (seed % 9) / 9 * 6.28 };
    head.add(bulb);
    head.add(mesh(sph(gr * 0.9, 18, 12, 0, Math.PI * 2, 0, 0.72 * D2R), MAT.paint('#5f5a4e', { side: BackSide, steps: 2, shadowAmt: 1, transparent: true, opacity: 0.62 }), { pos: [0, gy, 0], cast: false, receive: false }));
    // 天笠と口金
    head.add(mesh(cyl(0.05, 0.075, 0.05, 14), bodyMat, { pos: [0, gy + gr * 0.86, 0] }));
    head.add(mesh(lathe([[0, 0], [0.16, 0.0], [0.145, 0.03], [0.06, 0.06], [0.03, 0.075]], 18), bodyMat, { pos: [0, gy + gr * 0.9, 0] }));
    head.add(mesh(cyl(0.062, 0.055, 0.055, 14), MAT.metal('#a89a72', { worn: 0.7 }), { pos: [0, gy - gr * 0.86, 0] }));
    head.add(hoop(gr * 0.99, 0.011, bodyMat, { pos: [0, gy - gr * 0.72, 0], rot: [90 * D2R, 0, 0] }));
    // 飾りトップ
    head.add(mesh(cyl(0.012, 0.012, 0.09, 8), bodyMat, { pos: [0, gy + gr + 0.06, 0] }));
    head.add(mesh(sph(0.022, 10, 8), bodyMat, { pos: [0, gy + gr + 0.115, 0] }));
  } else {
    // コブラネック：曲管で頭を出し、長い笠の下にガラス面板
    const armPts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      armPts.push([0.02 + t * 0.62, topY - 0.1 + Math.sin(t * Math.PI * 0.62) * 0.34 - t * 0.06, 0]);
    }
    head.add(mesh(tubeOf(armPts, 0.033, 26, 9), bodyMat, { name: 'cobra-arm' }));
    // 曲管の継手（バンド）
    for (const t of [0.35, 0.72]) {
      const p = armPts[Math.round(t * 14)];
      head.add(hoop(0.04, 0.009, MAT.metal('#8f9497', { worn: 0.8 }), { pos: [p[0], p[1], p[2]], rot: [0, 0, 90 * D2R] }));
    }
    const hx = 0.66, hy = topY + 0.22;
    const hgrp = grp('cobra-head', { pos: [hx, hy, 0], rot: [0, 0, -8 * D2R] });
    // 笠（フード）：上面カバーと隠し縁
    hgrp.add(mesh(lathe([[0, 0.075], [0.1, 0.06], [0.19, 0.038], [0.24, 0.012], [0.245, 0.0], [0.2, -0.012], [0.1, -0.022], [0, -0.026]], 22), bodyMat, { name: 'cobra-hood' }));
    hgrp.add(mesh(cyl(0.06, 0.075, 0.05, 14), bodyMat, { pos: [0, 0.085, 0] }));
    // 内部ランプ（笠の下で呼吸する発光芯）
    const core = mesh(sph(0.045, 12, 9), MAT.lampShade({ color: '#fff3d8', emissive: '#ffdda6', emissiveIntensity: 0.85 }), { pos: [0, 0.005, 0], cast: false });
    core.userData.breathe = { speed: 0.42, amount: 0.07, phase: (seed % 9) / 9 * 6.28 };
    hgrp.add(core);
    // 灯具ガラス面板（発光体＝呼吸対象）
    const lens = mesh(lathe([[0, -0.052], [0.13, -0.046], [0.2, -0.024], [0.206, -0.014], [0.13, -0.02], [0, -0.028]], 22),
      MAT.lampShade({ color: '#fff6e2', emissive: '#ffdda6', emissiveIntensity: 0.72, side: DoubleSide }), { name: 'cobra-lens', cast: false });
    lens.userData.breathe = { speed: 0.42, amount: 0.07, phase: (seed % 7) / 7 * 6.28 };
    hgrp.add(lens);
    // 枠（リム）とネジ
    hgrp.add(hoop(0.208, 0.011, bodyMat, { pos: [0, -0.018, 0], rot: [90 * D2R, 0, 0] }));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.7;
      hgrp.add(mesh(cyl(0.008, 0.008, 0.014, 6), MAT.metal('#b7bcc0', { worn: 0.6 }), { pos: [Math.cos(a) * 0.205, -0.016, Math.sin(a) * 0.205] }));
    }
    // 背面リブ（放熱）
    for (let i = 0; i < 5; i++) hgrp.add(mesh(box(0.02, 0.016, 0.16), bodyMat, { pos: [-0.06 + i * 0.03, 0.028, 0] }));
    head.add(hgrp);
    // 笠の上から出る配線キャップ
    head.add(mesh(cyl(0.03, 0.036, 0.05, 12), MAT.metal('#8f9497', { worn: 0.85 }), { pos: [hx - 0.02, hy + 0.13, 0] }));
  }
  g.add(head);

  /* ------------------------- 経年：錆・再塗装跡・退色 ------------------------- */
  weather(g, { w: 0.22, h: 0.9, pos: [0.03, 0.55, 0.085], kind: 'rust', color: '#7d4a2c', opacity: 0.45, seed: seed + 31, density: 1.7, count: 3, spread: 0.1 });
  weather(g, { w: 0.16, h: 0.34, pos: [-0.07, height * 0.42, 0.05], kind: 'chip', color: shadeHex(PAL.lampGreen, 1.6), opacity: 0.5, seed: seed + 32, count: 3, density: 1.3, spread: 0.12 });
  weather(g, { w: 0.1, h: 0.6, pos: [0.055, height * 0.66, 0.03], kind: 'dirt', color: '#8b8375', opacity: 0.32, seed: seed + 33, count: 2, spread: 0.2 });
  // 再塗装跡（元の緑より明るい一帯＝塗り直し）
  g.add(mesh(cyl(0.058, 0.07, height * 0.3, 18, true), MAT.metalPaint(shadeHex(PAL.lampGreen, 1.28), { worn: 0.4, base: '#ffffff', transparent: true, opacity: 0.75, side: DoubleSide }), { pos: [0, height * 0.34, 0] }));

  /* ------------------------- 鳥糞・虫の死骸 ------------------------- */
  for (let i = 0; i < 5; i++) {
    const a = rnd() * Math.PI * 2, r = 0.02 + rnd() * 0.05;
    const yy = kind === 'globe' ? height + 0.46 + rnd() * 0.06 : height + 0.3 + rnd() * 0.05;
    const d = mesh(sph(0.012 + rnd() * 0.011, 8, 6), MAT.paint('#e9e4d6', { steps: 2, spec: 0.1, shadowAmt: 0.7 }), { pos: [Math.cos(a) * r, yy, Math.sin(a) * r], scale: [1, 0.45, 1] });
    g.add(d);
  }
  // 灯具まわりの虫の死骸（面板の上に数匹）
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, r = 0.05 + rnd() * 0.13;
    const bug = mesh(capsuleLike(0.004, 0.013), MAT.paint('#3b3226', { steps: 2, spec: 0.25 }), {
      pos: [kind === 'globe' ? Math.cos(a) * r : 0.66 + Math.cos(a) * r * 0.9, kind === 'globe' ? height + 0.13 : height + 0.2 - 0.03, kind === 'globe' ? Math.sin(a) * r : Math.sin(a) * r * 0.9],
      rot: [0, rnd() * 3, 90 * D2R],
    });
    bug.castShadow = false;
    g.add(bug);
  }
  shadowBlob(g, { r: 0.44, pos: [0, 0.006, 0], opacity: 0.3, ratio: 1 });

  return finish(g, { outline: 'normal', minSize: 0.024 });
}
/** 短いカプセル（虫 bodies）：cyl + 両端球の簡略形ではなく CapsuleGeometry を使う */
function capsuleLike(r, len) {
  return new CapsuleGeometry(r, len, 3, 7);
}
function shadeHex(hex, k) {
  const c = new Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
}

export { DEFAULT_OPTIONS, build, build as default, meta };
