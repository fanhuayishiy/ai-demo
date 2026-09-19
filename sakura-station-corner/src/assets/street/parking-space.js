//  assets/street/parking-space.js —— 駐車区画（白線・車輪止め・区画番号・砂利と雑草・境界縁石）
//  乡村の空地感：精算機などは置かず、擦れた白線・タイヤ跡・砂利・生い茂った雑草で「使われ続きの区画」を出す
//  ※ 原点 = 区画中心の路面レベル（y=0）。間口 +Z 側（車道側）、奥行き -Z 側。
import * as THREE from 'three';
import {
  grp, mesh, box, rbox, cyl, lathe, inst, finish, rand, range,
  weather, decal, plane,
} from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX, makeCanvas, toTexture, jpText } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'parking-space',
  real: [2.5, 0.2, 5.0],
  origin: 'road-level',
};
export const DEFAULT_OPTIONS = { len: 5, seed: 88 };

const D2R = Math.PI / 180;
const W = 2.5;                       // 区画幅（実寸）

function numberTex(n) {
  const cv = makeCanvas(512, 512);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.globalAlpha = 0.82;
  g.fillStyle = '#f3f0e6';
  g.save(); g.translate(w / 2, h / 2); g.rotate(-0.02);
  jpText(g, String(n), { x: 0, y: 0, size: h * 0.52, color: '#f3f0e6', weight: 900 });
  g.restore();
  // 擦れ・欠け
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 120; i++) {
    g.globalAlpha = 0.12 + rnd() * 0.5;
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 26, 1 + rnd() * 7);
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}
function tireTex() {
  const cv = makeCanvas(256, 512);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (const cx of [w * 0.3, w * 0.7]) {
    for (let i = 0; i < 90; i++) {
      g.globalAlpha = 0.05 + rnd() * 0.18;
      g.fillStyle = '#26252a';
      const y = rnd() * h;
      g.fillRect(cx - w * 0.13 + (rnd() - 0.5) * 12, y, w * 0.26, 2 + rnd() * 9);
    }
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}

export function build(options = {}) {
  const len = options.len ?? 5;
  const seed = options.seed ?? 88;
  const rnd = rand(seed);
  const g = grp('parking-space');
  const no = 1 + Math.floor(rnd() * 18);

  /* ------------------------------ 砂利面（下地＋砕石） ------------------------------ */
  g.add(mesh(box(W, 0.06, len), MAT.paint('#8f8579', { map: TEX.concrete({ base: '#8f8579', repeat: 4 }).map, steps: 3, spec: 0.05, shadowAmt: 0.94 }), { pos: [0, -0.03, 0], name: 'bed' }));
  const top = mesh(box(W, 0.012, len), MAT.ballast({ repeat: 8 }), { pos: [0, -0.001, 0], receive: true, cast: false, name: 'ballast' });
  g.add(top);
  // 砂利の寄せムラ（小石を inst で撒く）
  const stoneGeo = new THREE.DodecahedronGeometry(0.028, 0);
  g.add(inst(stoneGeo, MAT.stone({ color: '#9b968a' }), 90, (i, d, r) => {
    d.position.set((r() - 0.5) * (W - 0.1), 0.006 + r() * 0.01, (r() - 0.5) * (len - 0.1));
    d.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
    d.scale.setScalar(0.5 + r() * 1.5);
  }, { name: 'gravel', receive: false }));
  // 泥はね・油染み（車両系）
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#4a4438', seed: seed + 2, density: 1.6 }), w: W * 0.8, h: len * 0.4, pos: [0, 0.0072, -len * 0.18], rot: [-90 * D2R, 0, 0], opacity: 0.45, order: 1 });
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#23211f', seed: seed + 3, density: 1.1 }), w: 0.7, h: 0.9, pos: [0.35, 0.0072, len * 0.1], rot: [-90 * D2R, 0, 0.4], opacity: 0.55, order: 2 });   // オイル
  const tire = tireTex();
  for (const sx of [-0.62, 0.62]) {
    const t = mesh(plane(0.62, len * 0.72), MAT.decal({ map: tire, opacity: 0.9 }), { pos: [sx, 0.0072, -len * 0.08], rot: [-90 * D2R, 0, 0], cast: false });
    t.userData.noOutline = true;
    g.add(t);
  }

  /* ------------------------------ 白線（擦れ・タイヤ跡） ------------------------------ */
  const lineMat = MAT.marking(PAL.marking, { steps: 2, spec: 0.16, repeat: 4 });
  const LW = 0.1, LH = 0.008;
  for (const sx of [-W / 2 + LW / 2, W / 2 - LW / 2]) {
    // 2 分割（途中で切れた古い線）
    g.add(mesh(box(LW, LH, len * 0.62), lineMat, { pos: [sx, LH / 2, -len * 0.19], name: 'line-side' }));
    g.add(mesh(box(LW, LH, len * 0.3), lineMat, { pos: [sx, LH / 2, len * 0.33], name: 'line-side' }));
    weather(g, { w: LW * 1.6, h: 0.4, pos: [sx, LH + 0.001, len * 0.1], rot: [-90 * D2R, 0, 0], kind: 'chip', color: '#8f8579', opacity: 0.75, seed: seed + 11 + sx * 10, count: 3, density: 2 });
  }
  g.add(mesh(box(W - LW, LH, LW), lineMat, { pos: [0, LH / 2, -len / 2 + LW / 2], name: 'line-back' }));
  // 白線の上を跨ぐタイヤ痕
  for (const sx of [-0.62, 0.62]) {
    const t = mesh(plane(0.34, 0.16), MAT.decal({ map: tire, opacity: 0.8, color: '#8d8f8c' }), { pos: [sx, LH + 0.0012, len * 0.32], rot: [-90 * D2R, 0, 0], cast: false });
    t.userData.noOutline = true;
    g.add(t);
  }
  // 区画番号ペイント（入口側）
  const np = mesh(plane(0.62, 0.62), MAT.decal({ map: numberTex(no), opacity: 1 }), { pos: [0, 0.0075, len * 0.32], rot: [-90 * D2R, 0, 0], cast: false });
  np.userData.noOutline = true;
  g.add(np);

  /* ------------------------------ 車輪止め ------------------------------ */
  {
    const zw = -len * 0.2;
    const stopG = grp('wheel-stop', { pos: [0, 0, zw] });
    // 樹脂／コンクリートブロック（台形断面）
    const prof = [[0, 0], [0.09, 0], [0.09, 0.055], [0.055, 0.115], [0, 0.12]];
    for (const sx of [-0.86, 0.86]) {
      const endCap = mesh(lathe(prof, 10), MAT.hardPlastic('#c9c3b2'), { pos: [sx, 0, 0], scale: [1, 1, 1] });
      endCap.scale.set(1, 1, 1);
      stopG.add(endCap);
    }
    const bar = mesh(rbox(1.72, 0.1, 0.085, 0.012, 2), MAT.metalPaint(PAL.markingYellow, { worn: 0.9, base: '#e8cf8e' }), { pos: [0, 0.062, 0], name: 'stop-bar' });
    stopG.add(bar);
    // 黒の反射帯
    stopG.add(mesh(rbox(1.72, 0.03, 0.088, 0.008, 2), MAT.paint('#33373c', { steps: 2, spec: 0.2 }), { pos: [0, 0.085, 0] }));
    // 固定ボルト（錆）
    for (const bx of [-0.7, -0.24, 0.24, 0.7]) {
      stopG.add(mesh(cyl(0.011, 0.011, 0.02, 6), MAT.metal('#8a6a4a', { worn: 1, base: '#a37f57' }), { pos: [bx, 0.115, 0] }));
      stopG.add(mesh(cyl(0.017, 0.017, 0.008, 6), MAT.metal('#7d5f42', { worn: 1 }), { pos: [bx, 0.124, 0] }));
      weather(stopG, { w: 0.05, h: 0.06, pos: [bx + 0.01, 0.085, 0.045], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 21 + bx * 10, count: 1 });
    }
    weather(stopG, { w: 0.5, h: 0.06, pos: [0.4, 0.05, 0.045], kind: 'chip', color: '#b8b2a3', opacity: 0.6, seed: seed + 22, count: 3, spread: 0.06 });
    weather(stopG, { w: 0.34, h: 0.05, pos: [-0.6, 0.02, 0.045], kind: 'dirt', color: '#6d6152', opacity: 0.55, seed: seed + 23, count: 2 });
    g.add(stopG);
  }

  /* ------------------------------ 境界の縁石（奥側） ------------------------------ */
  {
    const curb = grp('curb', { pos: [0, 0, -len / 2 - 0.14] });
    const nC = Math.max(2, Math.round(W / 0.5) + 1);
    for (let i = 0; i < nC; i++) {
      const x = -W / 2 - 0.14 + (i + 0.5) * ((W + 0.28) / nC);
      const c = mesh(rbox((W + 0.28) / nC - 0.014, 0.16, 0.28, 0.008, 2), MAT.concrete({ base: PAL.curb, repeat: 1, cracked: true }), { pos: [x, 0.055, 0], name: 'curb-block' });
      if (i === 1) c.rotation.z = 0.035;                    // 1 個沈んだ縁石
      curb.add(c);
      if (i === 2) curb.add(mesh(rbox(0.16, 0.06, 0.14, 0.01, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 1 }), { pos: [x, 0.135, 0.02], rot: [0, 0, 0.28] }));  // 欠けの埋め補修
    }
    weather(curb, { w: W * 0.8, h: 0.1, pos: [0, 0.1, 0.145], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 31, density: 1.6, count: 2, spread: 0.06 });
    g.add(curb);
  }

  /* ------------------------------ 雑草（境界と白線の隙間） ------------------------------ */
  {
    const grassMat = MAT.grass({ base: PAL.grass, repeat: 1 });
    // 隙間から生える雑草なので「株」は小さい。以前は s が最大 1.6（円錐 0.19 m × 1.6 × 1.5
    // ≈ 高さ 0.46 m）あり、路面に並んだ緑の円錐がそのまま視認できてしまった。
    const clumpGeo = new THREE.ConeGeometry(0.055, 0.13, 7, 1, true);
    const spots = [];
    for (let i = 0; i < 16; i++) {
      const edge = rnd();
      const x = edge < 0.5 ? (rnd() < 0.5 ? -W / 2 : W / 2) + range(rnd, -0.12, 0.12) : range(rnd, -W / 2, W / 2);
      const z = edge < 0.5 ? range(rnd, -len / 2, len / 2) : (rnd() < 0.5 ? -len / 2 : len / 2) + range(rnd, -0.08, 0.12);
      spots.push([x, z, 0.55 + rnd() * 0.55, rnd() * 3.14]);
    }
    // 立体的な草株（円錐殻＝紙片にしない）
    const tufts = inst(clumpGeo, grassMat, spots.length, (i, d) => {
      const [x, z, s, a] = spots[i];
      d.position.set(x, 0.065 * s * 0.5, z);
      d.rotation.set(range(rnd, -0.1, 0.1), a, range(rnd, -0.12, 0.12));
      d.scale.set(s, s * range(rnd, 0.85, 1.25), s);
    }, { name: 'weeds', cast: true, receive: false });
    g.add(tufts);
    // 白線の際に少し大きな株を 2 つ（独立 Mesh）
    for (let i = 0; i < 2; i++) {
      const x = (rnd() < 0.5 ? -W / 2 : W / 2) + range(rnd, -0.05, 0.05);
      const z = range(rnd, -len / 2 + 0.2, len / 2 - 0.2);
      const cg = grp('weed-clump', { pos: [x, 0, z] });
      for (let k = 0; k < 4; k++) {
        const s = 0.7 + rnd() * 0.5;
        const c = mesh(clumpGeo, grassMat, { pos: [range(rnd, -0.05, 0.05), 0.065 * s * 0.5, range(rnd, -0.05, 0.05)], rot: [0, rnd() * 3, 0], scale: [s, s * 1.2, s] });
        cg.add(c);
      }
      cg.add(mesh(cyl(0.07, 0.09, 0.012, 10), MAT.paint('#6f6250', { map: TEX.concrete({ base: '#6f6250', repeat: 1 }).map, steps: 3, spec: 0.04 }), { pos: [0, 0.005, 0] }));
      g.add(cg);
    }
  }
  weather(g, { w: W * 0.9, h: 0.5, pos: [0, 0.0072, -len * 0.42], rot: [-90 * D2R, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.3, seed: seed + 41, density: 1.4, count: 2 });
  // 路面に寝る面は描边壳が黒滲みになるので除外（立体物は thin で縁取る）
  g.traverse((o) => { if (o.isMesh && /^(bed|ballast|line-|curb|weeds|gravel|wheel-stop)/.test(o.name || '')) o.userData.noOutline = true; });
  return finish(g, { outline: 'thin', minSize: 0.05 });
}
export default build;
