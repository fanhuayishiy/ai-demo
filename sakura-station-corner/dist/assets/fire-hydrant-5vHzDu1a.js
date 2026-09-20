import { g as grp, s as shade, M as MAT, m as mesh, P as PAL, c as cyl, ak as RingGeometry, o as lathe, am as hoop, b as box, t as tor, r as rbox, h as decal, T as TEX, w as weather, p as shadowBlob, a as sph, H as plane, D as DoubleSide, q as finish, N as makeCanvas, O as jpText, Q as toTexture } from './index-yWEMv7O8.js';

//  assets/street/fire-hydrant.js —— 消火栓＋防火水槽標識＋コンクリート蓋（乡村の防火用水）
//  摩耗：赤の退色と錆、キャップの打痕、根元の泥と苔、標識柱の再塗装跡、蓋の欠け・水垢

const meta = {
  id: 'fire-hydrant',
  real: [1.55, 1.35, 0.95],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 96 };

const D2R = Math.PI / 180;

function tankSignTex() {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#2f6b52'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f0ece0'; g.lineWidth = 12; g.strokeRect(16, 16, w - 32, h - 32);
  jpText(g, '防火水槽', { x: w / 2, y: h * 0.42, size: h * 0.3, color: '#f5f2e6', weight: 900, spacing: 6 });
  jpText(g, 'この 近 辺', { x: w / 2, y: h * 0.75, size: h * 0.15, color: '#cfd8cb', weight: 700, spacing: 4 });
  // 矢印
  g.fillStyle = '#f5f2e6';
  g.beginPath(); g.moveTo(w * 0.9, h * 0.5); g.lineTo(w * 0.79, h * 0.33); g.lineTo(w * 0.79, h * 0.43);
  g.lineTo(w * 0.7, h * 0.43); g.lineTo(w * 0.7, h * 0.57); g.lineTo(w * 0.79, h * 0.57); g.lineTo(w * 0.79, h * 0.67);
  g.closePath(); g.fill();
  g.globalAlpha = 0.3;
  for (let i = 0; i < 40; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#1d3b2c'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 22, 2 + rnd() * 7); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 96;
  const g = grp('fire-hydrant');
  const red = shade(PAL.vendingRed, 1.0);
  const redMat = MAT.metalPaint(red, { worn: 0.95, repeat: 3, base: shade(red, 1.35) });
  MAT.darkIron({ worn: 0.9 });

  /* ============================ 消火栓 ============================ */
  {
    const hg = grp('hydrant', { pos: [-0.42, 0, 0.06] });
    // 土台コンクリート＋黄色縁
    hg.add(mesh(cyl(0.24, 0.27, 0.06, 20), MAT.concrete({ base: PAL.concreteDark, repeat: 1, cracked: true }), { pos: [0, 0.03, 0] }));
    hg.add(mesh(new RingGeometry(0.2, 0.235, 22, 1), MAT.marking(PAL.markingYellow), { pos: [0, 0.0665, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    // 胴（テーパーする鋳物：下太・上細）
    const prof = [
      [0, 0], [0.15, 0.0], [0.148, 0.035], [0.112, 0.07], [0.108, 0.16],
      [0.112, 0.2], [0.108, 0.4], [0.1, 0.46], [0.104, 0.5],
      [0.086, 0.56], [0.07, 0.62], [0.052, 0.66], [0, 0.68],
    ];
    hg.add(mesh(lathe(prof, 22), redMat, { name: 'hydrant-body', pos: [0, 0.06, 0] }));
    // 胴の帯リブ 2 本
    for (const [ry, rw] of [[0.26, 0.016], [0.5, 0.013]]) hg.add(hoop(0.113, rw, redMat, { pos: [0, 0.06 + ry, 0], rot: [90 * D2R, 0, 0] }));
    // 側方放出口（大 1・小 2）：キャップとチェーン
    const outlets = [
      { a: 0, r: 0.056, len: 0.14, y: 0.24 },
      { a: Math.PI / 2, r: 0.042, len: 0.11, y: 0.34 },
      { a: -Math.PI / 2, r: 0.042, len: 0.11, y: 0.34 },
    ];
    for (const o of outlets) {
      const dir = { x: Math.cos(o.a), z: Math.sin(o.a) };
      const og = grp('outlet', { pos: [dir.x * 0.1, 0.06 + o.y, dir.z * 0.1], rotY: -o.a / D2R });
      og.add(mesh(cyl(o.r, o.r * 1.06, o.len, 16), redMat, { pos: [0, 0, 0], rot: [90 * D2R, 0, 0], name: 'nozzle' }));
      og.add(hoop(o.r * 1.02, 0.01, redMat, { pos: [0, 0, o.len * 0.42] }));
      // キャップ（座中金具＋耳）
      og.add(mesh(cyl(o.r * 1.02, o.r * 0.96, 0.026, 16), MAT.metalPaint(red, { worn: 0.7, base: shade(red, 1.5) }), { pos: [0, 0, o.len * 0.53], rot: [90 * D2R, 0, 0] }));
      og.add(mesh(box(0.03, 0.012, 0.014), MAT.metal('#a8adb0', { worn: 0.8 }), { pos: [0, 0, o.len * 0.56] }));
      og.add(mesh(tor(o.r * 0.36, 0.006, 6, 12), MAT.metal('#9aa0a3', { worn: 0.9 }), { pos: [0, o.r * 0.7, o.len * 0.5] }));
      // チェーン（鎖：小さな tor を連ねる）
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const cx = Math.sin(t * 2.2) * 0.03;
        const cy = o.r * 0.7 - t * 0.055 - Math.sin(t * 3) * 0.01;
        const cz = o.len * 0.5 - t * o.len * 0.42;
        const link = mesh(tor(0.008, 0.0026, 5, 9), MAT.metal('#8b8f92', { worn: 0.95 }), { pos: [cx, cy, cz], rot: [i % 2 ? 90 * D2R : 0, 0, 0.2] });
        og.add(link);
      }
      hg.add(og);
    }
    // 開閉ナット（ pentagon 頭）と頂キャップ
    hg.add(mesh(cyl(0.055, 0.06, 0.05, 22), redMat, { pos: [0, 0.06 + 0.63, 0] }));
    hg.add(mesh(cyl(0.028, 0.03, 0.036, 5), MAT.metal('#b0a894', { worn: 0.85 }), { pos: [0, 0.06 + 0.672, 0] }));
    // 側面の操作軸（小口径用の角棒）
    hg.add(mesh(box(0.018, 0.018, 0.07), MAT.metal('#9aa0a3', { worn: 0.8 }), { pos: [0, 0.06 + 0.55, 0.06] }));
    // 铭板（水利課・番号）
    hg.add(mesh(rbox(0.075, 0.05, 0.008, 0.004, 2), MAT.metal('#c9c3b4', { worn: 0.7 }), { pos: [0, 0.06 + 0.36, 0.108] }));
    decal(hg, { map: TEX.signboard({ text: 'No.7', bg: '#cdc7b8', fg: '#3c3a33', size: 200 }), w: 0.062, h: 0.032, pos: [0, 0.06 + 0.36, 0.114], order: 1 });
    // 経年：退色・錆・泥
    weather(hg, { w: 0.22, h: 0.34, pos: [0.05, 0.06 + 0.2, 0.108], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + 3, density: 2, count: 3, spread: 0.07 });
    weather(hg, { w: 0.18, h: 0.2, pos: [-0.06, 0.06 + 0.46, 0.08], kind: 'chip', color: shade(red, 1.7), opacity: 0.5, seed: seed + 4, count: 3, spread: 0.06 });
    weather(hg, { w: 0.26, h: 0.12, pos: [0.02, 0.08, 0.09], kind: 'dirt', color: '#6d6152', opacity: 0.6, seed: seed + 5, count: 2 });
    weather(hg, { w: 0.3, h: 0.1, pos: [0, 0.06, -0.12], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 6, count: 2, spread: 0.1 });
    g.add(hg);
    shadowBlob(g, { r: 0.28, pos: [-0.42, 0.006, 0.06], opacity: 0.3 });
  }

  /* ============================ 防火水槽 標識柱 ============================ */
  {
    const sg = grp('sign-post', { pos: [0.42, 0, -0.08] });
    sg.add(mesh(cyl(0.085, 0.105, 0.05, 14), MAT.concrete({ base: PAL.concreteDark, repeat: 1 }), { pos: [0, 0.025, 0] }));
    sg.add(mesh(cyl(0.028, 0.03, 1.28, 12), MAT.metalPaint('#7f8a86', { worn: 0.9, base: '#a4aca8' }), { name: 'post', pos: [0, 0.64, 0] }));
    sg.add(mesh(sph(0.033, 12, 8), MAT.metal('#8f9793', { worn: 0.7 }), { pos: [0, 1.29, 0] }));
    // 標識板（角丸長方形・両面）
    const plate = grp('plate', { pos: [0, 1.1, 0] });
    plate.add(mesh(rbox(0.4, 0.2, 0.014, 0.008, 2), MAT.metalPaint('#2f6b52', { worn: 0.75, base: '#3f7b60' }), { name: 'tank-sign' }));
    const st = tankSignTex();
    for (const [sz, ry] of [[0.009, 0], [-9e-3, Math.PI]]) {
      const f = mesh(plane(0.378, 0.186), MAT.decal({ map: st, opacity: 1 }), { pos: [0, 0, sz], rot: [0, ry, 0], cast: false });
      f.userData.noOutline = true;
      plate.add(f);
    }
    for (const sx of [-0.16, 0.16]) for (const sy of [-0.07, 0.07]) {
      plate.add(mesh(cyl(0.006, 0.006, 0.008, 6), MAT.metal('#b7bcc0', { worn: 0.7 }), { pos: [sx, sy, 0.011], rot: [90 * D2R, 0, 0] }));
    }
    // 板の角の凹み・退色
    weather(plate, { w: 0.14, h: 0.07, pos: [-0.11, -0.05, 0.009], kind: 'chip', color: '#c9c3b4', opacity: 0.4, seed: seed + 21, count: 2 });
    decal(plate, { map: TEX.wear({ kind: 'scratch', color: '#e6e2d2', seed: seed + 22, density: 1.2 }), w: 0.3, h: 0.12, pos: [0.04, 0.02, 0.0088], order: 2 });
    plate.rotation.z = 0.045;                       // 僅かに曲がった標識
    sg.add(plate);
    // 柱の錆輪・再塗装
    weather(sg, { w: 0.1, h: 0.3, pos: [0.02, 0.24, 0.03], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 23, density: 2, count: 2, spread: 0.06 });
    sg.add(mesh(cyl(0.031, 0.033, 0.3, 12, true), MAT.metalPaint('#98a29d', { worn: 0.4, transparent: true, opacity: 0.8, side: DoubleSide }), { pos: [0, 0.86, 0] }));
    g.add(sg);
    shadowBlob(g, { r: 0.16, pos: [0.42, 0.005, -0.08], opacity: 0.24 });
  }

  /* ============================ 防火水槽のコンクリート蓋 ============================ */
  {
    const tg = grp('tank-lids', { pos: [0.02, 0, -0.6] });
    // 枠（溝）
    tg.add(mesh(box(1.44, 0.05, 0.86), MAT.concrete({ base: PAL.concreteDark, repeat: 2, joints: 2 }), { pos: [0, 0.012, 0] }));
    tg.add(mesh(box(1.3, 0.03, 0.72), MAT.paint('#2b2d2a', { steps: 2, shadowAmt: 1 }), { pos: [0, 0.036, 0], cast: false }));
    // 2 枚の蓋（片方は僅かにズレ・傾き）
    for (let i = 0; i < 2; i++) {
      const lx = -0.325 + i * 0.65;
      const lid = grp('lid', { pos: [lx, 0.055, i ? 0.012 : -6e-3], rot: i ? [0.012, 0, -0.014] : [0, 0, 0.006] });
      lid.add(mesh(rbox(0.62, 0.07, 0.68, 0.01, 2), MAT.concrete({ base: PAL.concrete, repeat: 2, cracked: true }), { name: 'tank-lid' }));
      // 持ち上げ穴 2 か所
      for (const [hx, hz] of [[-0.2, 0.24], [0.2, -0.24]]) {
        lid.add(mesh(cyl(0.032, 0.032, 0.08, 12, true), MAT.paint('#4d5049', { steps: 2, side: DoubleSide, shadowAmt: 1 }), { pos: [hx, 0.002, hz] }));
        lid.add(hoop(0.034, 0.006, MAT.metal('#8b9092', { worn: 0.9 }), { pos: [hx, 0.038, hz], rot: [90 * D2R, 0, 0] }));
      }
      // 「防火水」の白文字
      const t = mesh(plane(0.36, 0.2), MAT.decal({ map: TEX.signboard({ text: '防火水', bg: '#efece2', fg: '#3c3f3a', size: 230, ar: 1.8 }), opacity: 0.85 }), { pos: [0, 0.0361, 0], rot: [-90 * D2R, 0, 0], cast: false });
      t.userData.noOutline = true;
      lid.add(t);
      // 欠け（角が落けた所＝下地の砂利が見える）
      lid.add(mesh(rbox(0.1, 0.035, 0.07, 0.02, 2), MAT.paint('#a49c8c', { map: TEX.concrete({ base: '#a49c8c', repeat: 1 }).map, steps: 3 }), { pos: [0.28, 0.026, 0.3], rot: [0, 0.5, 0] }));
      tg.add(lid);
    }
    // 水垢・苔・泥
    weather(tg, { w: 0.9, h: 0.4, pos: [-0.1, 0.092, 0.1], rot: [-90 * D2R, 0, 0.2], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 31, density: 1.6, count: 2 });
    weather(tg, { w: 0.6, h: 0.4, pos: [0.25, 0.093, -0.14], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#c9c3b0', opacity: 0.4, seed: seed + 32, count: 2 });   // 水垢輪
    weather(tg, { w: 1.3, h: 0.1, pos: [0, 0.02, 0.44], kind: 'dirt', color: '#6d6152', opacity: 0.5, seed: seed + 33, count: 2 });
    g.add(tg);
  }
  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
