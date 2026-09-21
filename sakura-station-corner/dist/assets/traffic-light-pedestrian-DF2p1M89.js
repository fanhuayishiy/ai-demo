import { g as grp, M as MAT, m as mesh, P as PAL, r as rbox, c as cyl, k as tubeOf, am as hoop, b as box, w as weather, D as DoubleSide, H as plane, ag as CylinderGeometry, h as decal, T as TEX, n as range, a as sph, p as shadowBlob, q as finish, N as makeCanvas, Q as toTexture, z as rand } from './index-C4-XtFer.js';

//  assets/street/traffic-light-pedestrian.js —— 歩行者用信号機（青人／赤人・カウントダウン・バイザー・柱と基礎）
//  画面 Mesh に userData.signalLamp = { kind:'walk'|'stop'|'count' }（动效层が点滅/残数を書き換える）

const meta = {
  id: 'traffic-light-pedestrian',
  real: [0.28, 2.66, 0.24],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 17, faces: 1, countdown: true };

const D2R = Math.PI / 180;

/* --------------------------- 画面テクチャ（歩行者記号・残数） --------------------------- */
function figure(kind) {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#141716'; g.fillRect(0, 0, w, h);
  // LED マトリクス下地
  g.globalAlpha = 0.1;
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) { g.fillStyle = '#fff'; g.fillRect(x, y, 4, 4); }
  g.globalAlpha = 1;
  const col = kind === 'walk' ? '#63d68d' : '#f07a4a';
  g.fillStyle = col; g.strokeStyle = col;
  if (kind === 'walk') {
    // 歩行姿（横向き・前へ出る脚）
    g.beginPath(); g.arc(w * 0.5, h * 0.17, 26, 0, 7); g.fill();
    g.lineWidth = 30; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w * 0.5, h * 0.3); g.lineTo(w * 0.46, h * 0.56); g.stroke();     // 胴
    g.lineWidth = 20;
    g.beginPath(); g.moveTo(w * 0.49, h * 0.36); g.lineTo(w * 0.72, h * 0.44); g.stroke();    // 前腕
    g.beginPath(); g.moveTo(w * 0.49, h * 0.36); g.lineTo(w * 0.28, h * 0.5); g.stroke();     // 後腕
    g.lineWidth = 24;
    g.beginPath(); g.moveTo(w * 0.46, h * 0.55); g.lineTo(w * 0.72, h * 0.68); g.lineTo(w * 0.74, h * 0.88); g.stroke();
    g.beginPath(); g.moveTo(w * 0.46, h * 0.55); g.lineTo(w * 0.3, h * 0.72); g.lineTo(w * 0.24, h * 0.88); g.stroke();
  } else {
    // 直立（正面）
    g.beginPath(); g.arc(w * 0.5, h * 0.16, 27, 0, 7); g.fill();
    g.lineWidth = 32; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w * 0.5, h * 0.3); g.lineTo(w * 0.5, h * 0.57); g.stroke();
    g.lineWidth = 21;
    g.beginPath(); g.moveTo(w * 0.5, h * 0.37); g.lineTo(w * 0.25, h * 0.5); g.stroke();
    g.beginPath(); g.moveTo(w * 0.5, h * 0.37); g.lineTo(w * 0.75, h * 0.5); g.stroke();
    g.lineWidth = 26;
    g.beginPath(); g.moveTo(w * 0.5, h * 0.56); g.lineTo(w * 0.33, h * 0.89); g.stroke();
    g.beginPath(); g.moveTo(w * 0.5, h * 0.56); g.lineTo(w * 0.67, h * 0.89); g.stroke();
  }
  // 画面の黄変・ホコリ
  g.globalAlpha = 0.12; g.fillStyle = '#c9b06a';
  for (let i = 0; i < 12; i++) { const x = rnd() * w, y = rnd() * h, r = 12 + rnd() * 40; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}
function countTex() {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#101112'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.09;
  for (let y = 0; y < h; y += 5) for (let x = 0; x < w; x += 5) { g.fillStyle = '#fff'; g.fillRect(x, y, 3.4, 3.4); }
  g.globalAlpha = 1;
  // 7 セグ（全点灯の「8」＝动效层が UV で残数を出す前提）
  const seg = (x, y, ww, hh) => { g.fillStyle = '#f2b23c'; g.fillRect(x, y, ww, hh); };
  const X = w * 0.28, Y = h * 0.12, SW = w * 0.44, SH = h * 0.76, T = 20;
  seg(X, Y, SW, T); seg(X, Y + SH / 2 - T / 2, SW, T); seg(X, Y + SH - T, SW, T);
  seg(X, Y, T, SH / 2); seg(X + SW - T, Y, T, SH / 2);
  seg(X, Y + SH / 2, T, SH / 2); seg(X + SW - T, Y + SH / 2, T, SH / 2);
  g.globalAlpha = 0.14; g.fillStyle = '#8d7a45';
  for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(rnd() * w, rnd() * h, 14 + rnd() * 30, 0, 7); g.fill(); }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 17;
  const faces = Math.max(1, Math.min(2, options.faces ?? 1));
  const countdown = options.countdown !== false;
  const rnd = rand(seed);
  const g = grp('traffic-light-pedestrian');

  const caseMat = MAT.metalPaint('#4a5450', { worn: 0.9, repeat: 3, base: '#79837f' });
  const poleMat = MAT.metalPaint('#8b938f', { worn: 0.85, repeat: 3, base: '#a4aca8' });
  const boltMat = MAT.metal('#9aa0a3', { worn: 0.8 });
  const H = 2.28;                                    // 信号頭下地

  /* ------------------------------ 基礎と柱 ------------------------------ */
  const base = grp('base');
  base.add(mesh(rbox(0.42, 0.1, 0.42, 0.018, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 2, cracked: true }), { pos: [0, 0.04, 0] }));
  base.add(mesh(cyl(0.13, 0.16, 0.07, 16), poleMat, { pos: [0, 0.115, 0] }));
  base.add(mesh(tubeOf([[-0.12, 0.02, 0.12], [-0.2, 0.03, 0.2], [-0.22, 0.1, 0.24]], 0.006, 12, 5), MAT.metal('#7d8285', { worn: 0.9 })));  // アース線
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    base.add(mesh(cyl(0.012, 0.013, 0.05, 6), boltMat, { pos: [Math.cos(a) * 0.1, 0.165, Math.sin(a) * 0.1] }));
  }
  g.add(base);
  g.add(mesh(cyl(0.062, 0.072, H - 0.06, 16), poleMat, { name: 'ped-pole', pos: [0, (H - 0.06) / 2 + 0.14, 0] }));
  g.add(hoop(0.068, 0.007, MAT.metal('#8d9491', { worn: 0.7 }), { pos: [0, 1.04, 0], rot: [90 * D2R, 0, 0] }));
  // 柱の点検口（内部に端子台）
  {
    const hatch = grp('hatch', { pos: [0, 0.86, 0.062] });
    hatch.add(mesh(rbox(0.09, 0.15, 0.014, 0.005, 2), poleMat, {}));
    hatch.add(mesh(box(0.05, 0.09, 0.02), MAT.paint('#26292b', { steps: 2, shadowAmt: 1 }), { pos: [0, 0, -0.014] }));
    hatch.add(mesh(box(0.04, 0.014, 0.014), MAT.hardPlastic('#c9c3b4'), { pos: [0, 0.02, -0.014] }));
    hatch.add(mesh(tubeOf([[-0.014, -0.04, -0.01], [0.01, 0.0, -0.014], [-0.01, 0.04, -8e-3]], 0.004, 10, 5), MAT.rubber('#d0a94f')));
    for (const sy of [0.06, -0.06]) hatch.add(mesh(cyl(0.0055, 0.0055, 0.008, 6), boltMat, { pos: [0, sy, 0.012], rot: [90 * D2R, 0, 0] }));
    g.add(hatch);
  }
  // 経年：柱の錆輪・泥跳ね・塗装の退色
  weather(g, { w: 0.16, h: 0.5, pos: [0.02, 0.36, 0.062], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 11, density: 1.7, count: 3, spread: 0.12 });
  weather(g, { w: 0.2, h: 0.16, pos: [-0.01, 0.16, 0.05], kind: 'dirt', color: '#7b7361', opacity: 0.5, seed: seed + 12, count: 2 });
  g.add(mesh(cyl(0.066, 0.07, 0.44, 16, true), MAT.metalPaint('#9aa5a0', { worn: 0.3, transparent: true, opacity: 0.6, side: DoubleSide }), { pos: [0, 1.66, 0] }));

  /* ------------------------------ 信号頭（2 現示＋カウントダウン） ------------------------------ */
  const ANG = [0, -90];
  for (let f = 0; f < faces; f++) {
    const mount = grp('head-mount', { pos: [0, H, 0], rotY: ANG[f] });
    mount.add(hoop(0.08, 0.01, MAT.metal('#8f9497', { worn: 0.85 }), { pos: [0, -0.12, 0.01], rot: [90 * D2R, 0, 0] }));
    mount.add(hoop(0.08, 0.01, MAT.metal('#8f9497', { worn: 0.85 }), { pos: [0, 0.28, 0.01], rot: [90 * D2R, 0, 0] }));
    mount.add(mesh(box(0.05, 0.62, 0.05), poleMat, { pos: [0, 0.1, 0.06] }));

    const head = grp('ped-head', { pos: [0, 0.3, 0.16] });
    const W = 0.26, D = 0.13;
    const secH = countdown ? 0.24 : 0.29;
    const totalH = secH * (countdown ? 3 : 2) + 0.03;
    // 筐体
    head.add(mesh(rbox(W, totalH, D, 0.016, 2), caseMat, { name: 'ped-case' }));
    for (const sx of [-1, 1]) head.add(mesh(box(0.016, totalH - 0.03, D + 0.012), caseMat, { pos: [sx * (W / 2 - 0.007), 0, 0.004] }));
    head.add(mesh(box(W * 0.9, 0.016, D + 0.014), caseMat, { pos: [0, totalH / 2 - 0.012, 0.004] }));
    head.add(mesh(box(W * 0.9, 0.016, D + 0.014), caseMat, { pos: [0, -totalH / 2 + 0.012, 0.004] }));

    const walkTex = figure('walk'), stopTex = figure('stop'), cntTex = countTex();
    const sections = countdown
      ? [{ kind: 'walk', map: walkTex, y: secH }, { kind: 'stop', map: stopTex, y: 0 }, { kind: 'count', map: cntTex, y: -secH }]
      : [{ kind: 'walk', map: walkTex, y: secH / 2 }, { kind: 'stop', map: stopTex, y: -secH / 2 }];
    for (const s of sections) {
      const sec = grp('ped-section-' + s.kind, { pos: [0, s.y, D / 2 + 0.006] });
      // 枠（アパーチャ）＋奥の暗板＋画面
      sec.add(mesh(rbox(W - 0.036, secH - 0.032, 0.014, 0.005, 2), caseMat, {}));
      sec.add(mesh(box(W - 0.056, secH - 0.052, 0.01), MAT.paint('#1b1e1f', { steps: 2, shadowAmt: 1 }), { pos: [0, 0, -8e-3] }));
      const scr = mesh(plane(W - 0.058, secH - 0.054), MAT.screen({ color: '#ffffff', map: s.map }), { pos: [0, 0, 0.004], name: 'screen-' + s.kind, cast: false, receive: false });
      scr.userData.signalLamp = { kind: s.kind };
      scr.userData.noOutline = true;
      sec.add(scr);
      // 画面前の防眩フィルター（薄い樹脂・黄変）
      const film = mesh(plane(W - 0.056, secH - 0.052), MAT.glassLite({ color: '#e8e2cc', opacity: 0.12, side: DoubleSide }), { pos: [0, 0, 0.008], cast: false });
      film.userData.noOutline = true;
      sec.add(film);
      // バイザー（上から被さる半円殼＋左右の羽）
      const vw = W - 0.03, vd = 0.1;
      sec.add(mesh(new CylinderGeometry(vw * 0.62, vw * 0.62, vd, 16, 1, true, Math.PI * 0.16, Math.PI * 0.68), caseMat, { pos: [0, secH * 0.28, vd * 0.42], rot: [90 * D2R, 0, 0], scale: [1, 1, 1] }));
      sec.add(mesh(box(vw, 0.01, vd + 0.02), caseMat, { pos: [0, secH * 0.42, vd * 0.36] }));
      for (const sx of [-1, 1]) sec.add(mesh(box(0.012, secH * 0.3, vd * 0.8), caseMat, { pos: [sx * (vw / 2 - 0.005), secH * 0.26, vd * 0.34] }));
      // 固定ネジ
      for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
        sec.add(mesh(cyl(0.005, 0.005, 0.007, 6), boltMat, { pos: [sx * (W / 2 - 0.028), sy * (secH / 2 - 0.026), 0.012], rot: [90 * D2R, 0, 0] }));
      }
      head.add(sec);
    }
    // 背面プレート（番号・放熱リブ）
    head.add(mesh(rbox(W - 0.05, totalH - 0.07, 0.012, 0.005, 2), MAT.metal('#5b6360', { worn: 0.85 }), { pos: [0, 0, -D / 2 - 0.004] }));
    decal(head, {
      map: TEX.signboard({ text: 'P-' + (10 + Math.floor(rnd() * 80)), bg: '#5b6360', fg: '#dfe3e0', size: 120 }),
      w: 0.12, h: 0.05, pos: [0, -totalH * 0.28, -D / 2 - 0.012], rot: [0, Math.PI, 0], order: 1,
    });
    for (let i = 0; i < 5; i++) head.add(mesh(box(W - 0.08, 0.012, 0.018), caseMat, { pos: [0, -totalH * 0.34 + i * 0.055, -D / 2 - 0.016] }));
    // 頭の上の雨水カバー
    head.add(mesh(rbox(W + 0.02, 0.014, D + 0.06, 0.005, 2), MAT.metal('#727a76', { worn: 0.7 }), { pos: [0, totalH / 2 + 0.016, 0.014] }));
    mount.add(head);
    g.add(mount);
  }

  // 柱への取り合いボルト・鳥糞
  for (let i = 0; i < 3; i++) {
    const yy = H + range(rnd, 0.05, 0.62);
    g.add(mesh(sph(0.011 + rnd() * 0.007, 8, 6), MAT.paint('#e7e1d2', { steps: 2, spec: 0.08 }), { pos: [0.02 + rnd() * 0.03, yy, 0.085], scale: [1, 0.45, 1] }));
  }
  weather(g, { w: 0.3, h: 0.16, pos: [0.01, H + 0.68, 0.09], kind: 'dirt', color: '#cfc7ad', opacity: 0.45, seed: seed + 31, count: 2, spread: 0.06 });
  shadowBlob(g, { r: 0.26, pos: [0, 0.005, 0], opacity: 0.3 });
  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
