import { g as grp, m as mesh, M as MAT, P as PAL, c as cyl, w as weather, o as lathe, D as DoubleSide, t as tor, h as decal, T as TEX, a as sph, am as hoop, H as plane, b as box, r as rbox, p as shadowBlob, q as finish, N as makeCanvas, Q as toTexture } from './index-yWEMv7O8.js';

//  assets/street/bollard.js —— ボラード／車止め（pipe 鉄管・concrete  Concrete・folding 可倒式）
//  摩耗：反射帯の剥がれ、塗装の黄変、根元の錆輪、打痕・塗装ハゲ、（可倒式は）蝶番の磨耗と錆

const meta = {
  id: 'bollard',
  real: [0.16, 0.7, 0.16],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { kind: 'pipe', h: 0.7, seed: 63 };

const D2R = Math.PI / 180;

/** 反射帯のシート（白＋細いシルバー縁、色褪せ・汚れ） */
function tapeTex() {
  const cv = makeCanvas(256, 64);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, w, h * 0.3);
  g.fillStyle = '#b9bcb9'; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.globalAlpha = 0.35;
  for (let i = 0; i < 70; i++) {
    g.fillStyle = rnd() > 0.5 ? '#8d8676' : '#ffffff';
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 16, 1 + rnd() * 5);
  }
  // ダイヤ反射パターン
  g.globalAlpha = 0.22; g.strokeStyle = '#7f7a6c'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 22, h); g.stroke(); g.beginPath(); g.moveTo(x, h); g.lineTo(x + 22, 0); g.stroke(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const kind = ['pipe', 'concrete', 'folding'].includes(options.kind) ? options.kind : 'pipe';
  const h = options.h ?? 0.7;
  const seed = options.seed ?? 63;
  const g = grp('bollard-' + kind);
  const tape = tapeTex();

  /* ------------------------------ 根回し（土間コン・泥） ------------------------------ */
  const collar = mesh(cyl(0.14, 0.17, 0.045, 18), MAT.concrete({ base: PAL.concreteDark, repeat: 1, cracked: true }), { pos: [0, 0.02, 0] });
  g.add(collar);
  g.add(mesh(cyl(0.115, 0.135, 0.03, 18), MAT.concrete({ base: '#c2bcae', repeat: 1 }), { pos: [0, 0.045, 0] }));
  weather(g, { w: 0.2, h: 0.08, pos: [0.03, 0.03, 0.09], kind: 'dirt', color: '#6d6152', opacity: 0.55, seed: seed + 1, count: 2 });

  if (kind === 'concrete') {
    /* ------------------------------ コンクリート角柱 ------------------------------ */
    const prof = [[0, 0], [0.088, 0.0], [0.082, h * 0.12], [0.066, h * 0.85], [0.06, h * 0.95], [0.048, h], [0, h]];
    const post = mesh(lathe(prof, 8), MAT.concrete({ base: PAL.concrete, repeat: 2, cracked: true }), { name: 'bollard-concrete' });
    g.add(post);
    // チェーン通し穴（上端）
    g.add(mesh(cyl(0.016, 0.016, 0.16, 12, true), MAT.paint('#8f8a80', { steps: 2, side: DoubleSide }), { pos: [0, h - 0.1, 0], rot: [0, 0, 90 * D2R] }));
    g.add(mesh(tor(0.016, 0.005, 6, 14), MAT.concrete({ base: PAL.concreteDark }), { pos: [0.078, h - 0.1, 0], rot: [0, 90 * D2R, 0] }));
    // 黄色の帯（打ち込み塗布）＋ 剥がれ
    g.add(mesh(cyl(0.075, 0.079, 0.1, 8, true), MAT.paint(PAL.markingYellow, { steps: 2, spec: 0.14, side: DoubleSide, shadowAmt: 0.8 }), { pos: [0, h * 0.62, 0] }));
    weather(g, { w: 0.1, h: 0.12, pos: [0.02, h * 0.62, 0.078], kind: 'chip', color: '#b8b2a4', opacity: 0.7, seed: seed + 11, count: 3, spread: 0.06 });
    weather(g, { w: 0.16, h: h * 0.4, pos: [-0.02, h * 0.24, 0.07], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 12, count: 2, density: 1.3, spread: 0.1 });
    weather(g, { w: 0.12, h: 0.14, pos: [0.03, h * 0.9, 0.06], kind: 'dirt', color: '#e0d6b4', opacity: 0.35, seed: seed + 13, count: 2 });   // 塗装の黄変
    decal(g, { map: TEX.signboard({ text: '駐禁', bg: '#c9c3b5', fg: '#4a453d', size: 190 }), w: 0.09, h: 0.05, pos: [0, h * 0.42, 0.0705], order: 1 });
  } else {
    /* ------------------------------ 鉄管ボラード（pipe / folding 共通芯） ------------------------------ */
    const R = 0.062;
    const bodyH = kind === 'folding' ? h * 0.82 : h;
    const steel = MAT.metalPaint('#d9d5c8', { worn: 0.6, repeat: 2, base: '#f2efe4' });
    const pipeG = grp('pipe-body', { pos: [0, 0, 0], rot: kind === 'folding' ? [0, 0, -6 * D2R] : [0, 0, 0] });
    pipeG.add(mesh(cyl(R, R * 1.02, bodyH, 18), steel, { name: 'bollard-pipe', pos: [0, bodyH / 2 + 0.04, 0] }));
    // 顶部：ドームキャップ＋溶接ビード
    pipeG.add(mesh(sph(R * 1.02, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.metalPaint('#e0dcd0', { worn: 0.5, base: '#f5f2e8' }), { pos: [0, bodyH + 0.04, 0] }));
    pipeG.add(hoop(R * 1.01, 0.005, MAT.metal('#a8a29a', { worn: 0.7 }), { pos: [0, bodyH + 0.038, 0], rot: [90 * D2R, 0, 0] }));
    // 反射帯（白：やや膨らませて貼る／一角をめくれ）
    const bandY = bodyH * 0.66 + 0.04;
    pipeG.add(mesh(cyl(R + 0.006, R + 0.006, 0.085, 18, true), MAT.paint('#f2eee2', {
      map: tape, steps: 2, spec: 0.3, specPower: 60, side: DoubleSide, shadowAmt: 0.66,
    }), { pos: [0, bandY, 0] }));
    const peel = mesh(plane(0.05, 0.04), MAT.paint('#e6e0d0', { side: DoubleSide, steps: 2, spec: 0.2 }), {
      pos: [Math.cos(1.2) * (R + 0.014), bandY + 0.05, Math.sin(1.2) * (R + 0.014)], rot: [-0.5, 1.2 - Math.PI / 2, 0.3],
    });
    pipeG.add(peel);
    decal(pipeG, { map: TEX.wear({ kind: 'chip', color: '#8f8a7c', seed: seed + 5, density: 2.2 }), w: 0.05, h: 0.05, pos: [Math.cos(1.2) * (R + 0.007), bandY + 0.03, Math.sin(1.2) * (R + 0.007)], rot: [0, 1.2 - Math.PI / 2, 0], order: 2 });
    // 下側の黄色帯（車体に当たる部分＝黄変・擦り傷）
    pipeG.add(mesh(cyl(R + 0.004, R + 0.004, 0.05, 18, true), MAT.paint(PAL.markingYellow, { steps: 2, side: DoubleSide, shadowAmt: 0.8, map: tape }), { pos: [0, bodyH * 0.24 + 0.04, 0] }));
    weather(pipeG, { w: 0.08, h: 0.16, pos: [0.03, bodyH * 0.42, R + 0.006], kind: 'scratch', color: '#8d8676', opacity: 0.5, seed: seed + 21, count: 3, spread: 0.08 });
    weather(pipeG, { w: 0.09, h: 0.1, pos: [-0.03, bodyH * 0.85, R + 0.005], kind: 'chip', color: '#a89f8d', opacity: 0.6, seed: seed + 22, count: 3 });
    g.add(pipeG);
    // 根元の錆輪
    g.add(hoop(R + 0.008, 0.007, MAT.metal('#8b7355', { worn: 1, base: '#9a7c5c' }), { pos: [0, 0.055, 0], rot: [90 * D2R, 0, 0] }));
    weather(g, { w: 0.19, h: 0.13, pos: [0.01, 0.11, R * 0.9], kind: 'rust', color: PAL.rust, opacity: 0.62, seed: seed + 23, density: 2.2, count: 3, spread: 0.05 });

    if (kind === 'folding') {
      /* ------------------------------ 可倒式の蝶番・鍵 ------------------------------ */
      const hinge = grp('hinge', { pos: [0, 0.075, 0] });
      hinge.add(mesh(cyl(0.075, 0.075, 0.05, 18), MAT.metal('#7f8588', { worn: 0.9 }), { pos: [0, 0, 0] }));
      hinge.add(mesh(box(0.19, 0.03, 0.06), MAT.metal('#8d9491', { worn: 0.85 }), { pos: [0, 0.02, 0] }));
      for (const sx of [-1, 1]) {
        hinge.add(mesh(cyl(0.011, 0.011, 0.075, 8), MAT.metal('#a5aaaa', { worn: 0.7 }), { pos: [sx * 0.08, 0.028, 0] }));
        hinge.add(mesh(cyl(0.016, 0.016, 0.014, 6), MAT.metal('#b7bcc0', { worn: 0.6 }), { pos: [sx * 0.08, 0.068, 0] }));
      }
      // 蝶番ピン（抜き差し跡）
      hinge.add(mesh(cyl(0.014, 0.014, 0.09, 10), MAT.metal('#6f7477', { worn: 0.95 }), { pos: [0, 0.03, -0.05] }));
      hinge.add(hoop(0.016, 0.004, MAT.metal('#9aa0a3'), { pos: [0, -0.012, -0.05] }));
      // 鍵（シリンダー＋錠前金具）
      const lock = grp('lock', { pos: [0.052, 0.16, 0.03] });
      lock.add(mesh(rbox(0.05, 0.075, 0.026, 0.006, 2), MAT.metal('#8f9497', { worn: 0.85 }), {}));
      lock.add(mesh(cyl(0.011, 0.011, 0.01, 12), MAT.metal('#c8c3ae', { worn: 0.5 }), { pos: [0, 0.006, 0.016], rot: [90 * D2R, 0, 0] }));
      lock.add(mesh(box(0.006, 0.018, 0.004), MAT.darkIron(), { pos: [0, 0.006, 0.023] }));
      lock.add(mesh(tor(0.019, 0.0045, 6, 12), MAT.metal('#a8adb0', { worn: 0.6 }), { pos: [0, 0.048, 0.006], rot: [0, 0, 0] }));  // 鎖通し
      hinge.add(lock);
      g.add(hinge);
      weather(g, { w: 0.16, h: 0.1, pos: [0.02, 0.06, 0.06], kind: 'rust', color: '#7d4a2c', opacity: 0.6, seed: seed + 31, count: 2, density: 2 });
    } else {
      // 固定式：根元のアンカーボルト 3 本
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        g.add(mesh(cyl(0.008, 0.008, 0.026, 6), MAT.metal('#9aa0a3', { worn: 0.85 }), { pos: [Math.cos(a) * 0.09, 0.058, Math.sin(a) * 0.09] }));
      }
    }
  }
  shadowBlob(g, { r: 0.17, pos: [0, 0.004, 0], opacity: 0.26 });
  return finish(g, { outline: 'normal', minSize: 0.024 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
