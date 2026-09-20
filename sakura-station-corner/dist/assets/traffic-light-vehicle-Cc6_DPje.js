import { g as grp, M as MAT, m as mesh, P as PAL, r as rbox, c as cyl, w as weather, am as hoop, b as box, k as tubeOf, s as shade, ae as SphereGeometry, ag as CylinderGeometry, h as decal, a as sph, p as shadowBlob, q as finish, D as DoubleSide, T as TEX, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-DD_JJZx9.js';

//  assets/street/traffic-light-vehicle.js —— 車両用信号機（三眼・バイザー・仕切り板・電源ボックス）
//  各レンズ Mesh に userData.signalLamp = { kind:'red'|'yellow'|'green' } → 动效层が渐变する
//  消灯時も黒く沈まないよう、レンズは元色的薄いガラス＋微発光（emissiveIntensity 0.25 前後）

const meta = {
  id: 'traffic-light-vehicle',
  real: [0.26, 3.34, 0.3],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { seed: 12, faces: 2 };

const D2R = Math.PI / 180;
const LAMP_SPEC = {
  red: { color: '#a8564f', emissive: '#e2685e', base: PAL.storeBand3 },
  yellow: { color: '#ab9760', emissive: '#f2b23c', base: PAL.storeBand2 },
  green: { color: '#5f8f78', emissive: '#4fa37a', base: PAL.vendingGreen },
};
/** レンズ（ガラス + 微発光）：消灯時も沈まない */
const lensMat = (kind) => {
  const s = LAMP_SPEC[kind];
  return MAT.paint(s.color, {
    steps: 2, spec: 0.72, specPower: 165, specCut: 0.1, sheen: 0.22,
    emissive: s.emissive, emissiveIntensity: 0.26, shadowAmt: 0.62,
    map: TEX.metal({ base: s.color, worn: 0.2, repeat: 1 }).map,
  });
};
const bodyMat = () => MAT.metalPaint('#3f4a44', { worn: 0.9, repeat: 3, base: '#6f7975' });
const visorMat = () => MAT.metalPaint('#3f4a44', { worn: 0.95, repeat: 3, base: '#6f7975', side: DoubleSide });
const poleMat = () => MAT.metalPaint('#7f8a86', { worn: 0.85, repeat: 3, base: '#9ca6a2' });

/** バイザー（半円殼：軸 Z、上面 180° を覆う） */
function visorGeo(r, depth, arc = Math.PI, start = Math.PI / 2) {
  return new CylinderGeometry(r, r * 1.05, depth, 18, 1, true, start, arc);
}
function faceTex(no) {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#2d3330'; g.fillRect(0, 0, w, h);
  jpText(g, String(no), { x: w / 2, y: h * 0.5, size: h * 0.42, color: '#c9ccc4', weight: 800 });
  jpText(g, '信号', { x: w / 2, y: h * 0.82, size: h * 0.16, color: '#8d948d', weight: 700 });
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.15;
    g.fillStyle = rnd() > 0.5 ? '#fff' : '#111';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 12;
  const faces = Math.max(1, Math.min(4, options.faces ?? 2));
  const rnd = rand(seed);
  const g = grp('traffic-light-vehicle');
  const H = 3.1;                                   // 信号頭の下地高さ
  const body = bodyMat(), pole = poleMat(), visor = visorMat();
  const boltMat = MAT.metal('#9aa0a3', { worn: 0.8 });

  /* ------------------------------ 柱（点検口・ボルト・錆） ------------------------------ */
  const foot = grp('pole-base');
  foot.add(mesh(rbox(0.34, 0.09, 0.34, 0.015, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 2, cracked: true }), { pos: [0, 0.035, 0] }));
  foot.add(mesh(cyl(0.12, 0.145, 0.06, 18), pole, { pos: [0, 0.115, 0] }));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    foot.add(mesh(cyl(0.013, 0.014, 0.055, 6), boltMat, { pos: [Math.cos(a) * 0.098, 0.168, Math.sin(a) * 0.098] }));
    weather(foot, { w: 0.03, h: 0.1, pos: [Math.cos(a) * 0.098, 0.12, Math.sin(a) * 0.098 + 0.012], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 5 + i, count: 1 });
  }
  g.add(foot);
  g.add(mesh(cyl(0.074, 0.086, H - 0.06, 18), pole, { name: 'tl-pole', pos: [0, (H - 0.06) / 2 + 0.14, 0] }));
  // 柱の継ぎ目（テーパー部と上下管の溶接环）
  for (const y of [0.9, 1.86, 2.6]) g.add(hoop(0.079, 0.007, MAT.metal('#8d9491', { worn: 0.7 }), { pos: [0, y, 0], rot: [90 * D2R, 0, 0] }));
  // 点検口（蓋・ボルト・内部配線）
  {
    const hy = 1.22;
    const h = grp('hatch', { pos: [0, hy, 0.078] });
    h.add(mesh(rbox(0.115, 0.19, 0.016, 0.006, 2), pole, { name: 'hatch-door' }));
    h.add(mesh(rbox(0.095, 0.17, 0.006, 0.004, 2), MAT.metal('#5f6b66', { worn: 0.6 }), { pos: [0, 0, 0.012] }));
    for (const sy of [0.075, -0.075]) h.add(mesh(cyl(0.0065, 0.0065, 0.01, 6), boltMat, { pos: [0, sy, 0.018], rot: [90 * D2R, 0, 0] }));
    h.add(mesh(box(0.02, 0.012, 0.01), MAT.metal('#b7bcc0'), { pos: [0.042, 0, 0.02] }));   // 施錠
    g.add(h);
    g.add(mesh(tubeOf([[0.02, hy - 0.1, 0.06], [0.05, hy - 0.24, 0.03], [0.03, hy - 0.5, 0.07]], 0.006, 12, 5), MAT.rubber('#c8a24a')));
  }
  // 柱の錆・泥・再塗装跡
  weather(g, { w: 0.2, h: 0.65, pos: [0.03, 0.42, 0.075], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 11, density: 1.8, count: 3, spread: 0.14 });
  weather(g, { w: 0.24, h: 0.2, pos: [-0.02, 0.16, 0.06], kind: 'dirt', color: '#7b7361', opacity: 0.5, seed: seed + 12, count: 2 });
  weather(g, { w: 0.12, h: 0.3, pos: [0.06, 2.1, 0.02], kind: 'chip', color: shade('#7f8a86', 1.5), opacity: 0.45, seed: seed + 13, count: 3, spread: 0.2 });

  /* ------------------------------ 各面孔（signals heads） ------------------------------ */
  const ANG = [0, -90, 180, 90];
  for (let f = 0; f < faces; f++) {
    const yaw = ANG[f];
    const mount = grp('head-mount', { pos: [0, H, 0], rotY: yaw });
    // 柱への抱き金具（Band + U ボルト）
    mount.add(hoop(0.094, 0.011, MAT.metal('#8f9497', { worn: 0.85 }), { pos: [0, -0.16, 0.02], rot: [90 * D2R, 0, 0] }));
    mount.add(hoop(0.094, 0.011, MAT.metal('#8f9497', { worn: 0.85 }), { pos: [0, 0.62, 0.02], rot: [90 * D2R, 0, 0] }));
    mount.add(mesh(box(0.06, 0.9, 0.05), pole, { pos: [0, 0.22, 0.1] }));
    // アーム（頭を柱から離す）
    mount.add(mesh(tubeOf([[0, 0.72, 0.06], [0, 0.74, 0.16], [0, 0.7, 0.24]], 0.026, 12, 8), pole, { pos: [0, 0, 0] }));
    mount.add(mesh(cyl(0.02, 0.02, 0.09, 10), MAT.metal('#8f9497'), { pos: [0, 0.66, 0.24], rot: [90 * D2R, 0, 0] }));

    /* --- 信号頭（縦 3 眼） --- */
    const head = grp('tl-head', { pos: [0, 0.68, 0.3] });
    const W = 0.24, DH = 0.66, DP = 0.15;
    // 背面筐体（一枚板に見せない為、上下＋側のリブを立てる）
    head.add(mesh(rbox(W, DH, DP, 0.02, 2), body, { name: 'tl-case' }));
    head.add(mesh(box(W * 0.92, 0.02, DP + 0.02), body, { pos: [0, DH / 2 - 0.015, 0.004] }));
    head.add(mesh(box(W * 0.92, 0.02, DP + 0.02), body, { pos: [0, -DH / 2 + 0.015, 0.004] }));
    for (const sx of [-1, 1]) head.add(mesh(box(0.018, DH - 0.04, DP + 0.014), body, { pos: [sx * (W / 2 - 0.008), 0, 0.004] }));
    // 前面パネル（レンズ座）
    head.add(mesh(rbox(W - 0.03, DH - 0.04, 0.016, 0.008, 2), MAT.metalPaint('#31393a', { worn: 0.7, base: '#4d5655' }), { pos: [0, 0, DP / 2] }));
    // 仕切り板（出っ張った日除け：3 眼の間と左右）
    for (const dy of [-DH / 6, DH / 6]) {
      head.add(mesh(box(W - 0.02, 0.012, 0.05), body, { pos: [0, dy, DP / 2 + 0.02] }));
    }
    // 三眼（上赤・中黄・下青）
    const order = ['red', 'yellow', 'green'];
    const r = 0.0735;
    for (let i = 0; i < 3; i++) {
      const kind = order[i];
      const y = (1 - i) * (DH / 3) - 0.0;
      const sec = grp('section-' + kind, { pos: [0, y, DP / 2 + 0.008] });
      // 座金
      sec.add(hoop(r + 0.012, 0.008, MAT.metal('#5a625f', { worn: 0.7 }), { rot: [90 * D2R, 0, 0] }));
      // レンズ（少し膨らんだガラス球冠：+Z へ張り出す）
      const Rc = r * 2.4, th = Math.asin(r / Rc);
      const lens = mesh(new SphereGeometry(Rc, 20, 10, 0, Math.PI * 2, 0, th), lensMat(kind), {
        name: 'lens-' + kind, pos: [0, 0, -Rc * Math.cos(th) + 0.012], rot: [Math.PI / 2, 0, 0], cast: false,
      });
      lens.userData.signalLamp = { kind, section: i };
      sec.add(lens);
      // バイザー（ひさし：半円殼＋前面立ち上がり）
      const vz = mesh(visorGeo(r + 0.026, 0.13), visor, { pos: [0, 0.006, 0.062], rot: [90 * D2R, 0, 0], name: 'visor-' + kind });
      sec.add(vz);
      sec.add(mesh(new CylinderGeometry(r + 0.038, r + 0.038, 0.012, 18, 1, true, Math.PI / 2, Math.PI), visor, { pos: [0, 0.006, 0.128], rot: [90 * D2R, 0, 0] }));
      // レンズの黄変・ホコリ（前面に 3mm 浮かし）
      weather(sec, { w: 0.1, h: 0.1, pos: [0.01, 0.012, 0.024], kind: 'dirt', color: '#bfae74', opacity: 0.3, seed: seed + f * 31 + i * 7, count: 2, spread: 0.02 });
      head.add(sec);
    }
    // 背面プレート（番号）と放熱リブ
    head.add(mesh(rbox(W - 0.05, DH - 0.09, 0.014, 0.006, 2), MAT.metal('#57605c', { worn: 0.8 }), { pos: [0, 0, -DP / 2 - 0.004] }));
    decal(head, { map: faceTex(1000 + Math.floor(rnd() * 8000)), w: 0.12, h: 0.12, pos: [0, -0.12, -DP / 2 - 0.0135], rot: [0, Math.PI, 0], order: 1 });
    for (let i = 0; i < 4; i++) head.add(mesh(box(W - 0.08, 0.014, 0.02), body, { pos: [0, -0.22 + i * 0.15, -DP / 2 - 0.012] }));
    // ヘッド下端の取付球（首振り）
    head.add(mesh(sph(0.042, 12, 10), MAT.metal('#6f7775', { worn: 0.6 }), { pos: [0, -DH / 2 - 0.03, -0.02] }));
    mount.add(head);

    // 上部の電源ボックス（コンデンサ箱）
    if (f === 0) {
      const pwr = grp('power-box', { pos: [0, H + 1.12, 0.06] });
      pwr.add(mesh(rbox(0.19, 0.2, 0.14, 0.012, 2), MAT.metalPaint('#5a6360', { worn: 0.95, base: '#8a918d' }), { name: 'power-box' }));
      pwr.add(mesh(rbox(0.17, 0.05, 0.012, 0.004, 2), MAT.metal('#7f8683', { worn: 0.6 }), { pos: [0, 0.1, 0.07] })); // 屋根
      for (const [sx, sy] of [[-0.07, 0.075], [0.07, 0.075], [-0.07, -0.075], [0.07, -0.075]]) {
        pwr.add(mesh(cyl(0.006, 0.006, 0.008, 6), boltMat, { pos: [sx, sy, 0.072], rot: [90 * D2R, 0, 0] }));
      }
      pwr.add(mesh(cyl(0.012, 0.012, 0.16, 8), MAT.metal('#8f9497', { worn: 0.8 }), { pos: [0, -0.16, -0.02] }));
      pwr.add(mesh(tubeOf([[0.05, -0.1, 0.02], [0.09, -0.3, 0.05], [0.06, -0.62, 0.06]], 0.008, 14, 6), MAT.rubber('#2f3136')));
      g.add(pwr);
      weather(g, { w: 0.2, h: 0.12, pos: [0.02, H + 1.0, 0.14], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 41, count: 2, density: 1.6 });
    }
    g.add(mount);
  }

  shadowBlob(g, { r: 0.3, pos: [0, 0.005, 0], opacity: 0.3 });
  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
