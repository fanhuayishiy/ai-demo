//  assets/station/platform-canopy.js —— ホーム上屋（木柱・トタン片流れ・梁貫腕木・雨樋・天井照明・鳥除けネット）
//  ---------------------------------------------------------------------------
//  ・原点 = ホーム床面上の底面中心（装配は y=0.72 に置く）。+Y 上。
//    正面（低く庇が出る線路側・雨樋側）= **-Z**、高く上がる後方（駅裏側）= +Z。
//  ・柱芯は world/station-platform.js の上屋柱基礎石（x=-16.6..-1.1、ピッチ 3.1、z=-11.2）に
//    合わせるため架構中心をローカル x=-0.45 に寄せる（落位点 -8.4 基準で柱芯 = 世界 -13.5/-7.3/-4.2）。
//    x=-10.4 の基礎石は長椅（落位 -9.8）と干渉するため柱を立てず、その跨ぎだけ二重梁＋補強で処理。
//  ・片流れ屋根：後方腕木で持ち、前端 1.06m は線路側へ cantilever。雨は前端の雨樋→竪樋で吐く。
//  ・meta.real = [x 長, y 高, z 幅]。
//  ---------------------------------------------------------------------------
import * as THREE from 'three';
import {
  grp, mesh, box, cyl, rbox, sph, tor, extrude, shape, tubeOf,
  finish, rand, range, weather, decal, inst, pipe,
} from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'platform-canopy',
  real: [12.16, 3.13, 3.44],
  origin: 'ground-center (deck level), rain eave / gutter faces -Z',
};
export const DEFAULT_OPTIONS = { len: 12, seed: 601 };

const D2R = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);

/* ───────── 架構寸法（装配表・ホーム基礎石と突き合わせた固定値） ───────── */
const CX = -0.45;                  // 架構中心
const POSTS = [-5.1, 1.1, 4.2];    // 柱芯（世界 x -13.5 / -7.3 / -4.2）
const POST_Z = -0.40;              // 柱列（世界 z -11.2 の基礎石上）
const POST_W = 0.14;
const POST_TOP = 2.28;
const BEAM = { y0: 2.31, y1: 2.575, w: 0.12 };
const NUKE_Y = 1.36;               // 貫
const SLOPE = 0.16514;             // 勾配（rad, 約 9.5 分）
const RMID = { y: 2.845, z: -0.04 };  // 屋根 y'=0 面の中点
const SH = 1.5816;                 // 勾配方向半長
/** 屋根裏面の高さ（野地板〜垂木〜母屋の下） */
const yUnder = (z) => RMID.y + ((z - RMID.z) / Math.cos(SLOPE)) * Math.sin(SLOPE) - 0.21;

/** 2 点間に部材を掛ける（断面積 geoFn(L)、L は長さ） */
function member(a, b, geoFn, mat, o = {}) {
  const va = new THREE.Vector3(a[0], a[1], a[2]);
  const vb = new THREE.Vector3(b[0], b[1], b[2]);
  const d = vb.clone().sub(va);
  const L = d.length();
  const m = mesh(geoFn(L), mat, o);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

export function build(options = {}) {
  const len = options.len ?? 12;
  const seed = options.seed ?? 601;
  const rnd = rand(seed);
  const g = grp('platform-canopy');
  const RX = len / 2;
  const x0 = CX - RX, x1 = CX + RX;      // 屋根端
  const BL = x1 - x0;                     // 屋根長

  /* ───────── 材質（木・トタン・亜鉛・塗装鉄・磁器） ───────── */
  const post1 = MAT.wood({ light: '#b89464', dark: '#7d5f3d', knots: true, repeat: 1, uv: { repeat: [1, 3] } });
  const post2 = MAT.wood({ light: PAL.woodWeathered, dark: '#6f6250', knots: true, repeat: 1, uv: { repeat: [1, 3] } });
  const beamMat = MAT.wood({ light: '#a9865a', dark: '#6f5232', repeat: 1, uv: { repeat: [6, 1] } });
  const deckWood = MAT.wood({ light: '#9d8259', dark: '#655033', repeat: 1, uv: { repeat: [8, 1] } });
  const rafMat = MAT.wood({ light: '#8f7550', dark: '#5d4a2f', repeat: 1, uv: { repeat: [1, 4] } });
  const zinc = MAT.corrugated({ base: '#9aa39f', uv: { repeat: [2.7, 1] }, spec: 0.34, sat: 0.92 });
  const zincOld = MAT.corrugated({ base: '#8b9189', uv: { repeat: [2.7, 1] }, spec: 0.2, tintBase: '#efe4cd', sat: 0.7 });
  const steel = MAT.metalPaint('#5d625f', { worn: 0.9, repeat: 2 });
  const galv = MAT.galvanized({ spec: 0.3, worn: 0.85 });
  const boltM = MAT.metal('#9aa0a3', { worn: 0.85 });
  const rotW = MAT.wood({ light: '#6d5f4c', dark: '#3b3226', knots: true, repeat: 1 });
  const leafM = MAT.leaf({ color: '#a8895c' });
  const leafGeo = rbox(0.055, 0.004, 0.042, 0.004, 1);

  /* ═══════════ 1. 木柱 ═══════════ */
  POSTS.forEach((px, i) => {
    const col = grp('post-' + i, { pos: [px, 0, POST_Z] });
    const h = POST_TOP + range(rnd, -0.005, 0.005);
    const wm = i % 2 ? post2 : post1;
    col.add(mesh(box(POST_W, h, POST_W), wm, { pos: [0, h / 2, 0], name: 'column' }));
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      col.add(mesh(box(0.024, h, 0.024), wm, { pos: [sx * (POST_W / 2 - 0.006), h / 2, sz * (POST_W / 2 - 0.006)] }));
    }
    col.add(mesh(box(POST_W * 0.78, 0.014, 0.013), rotW, { pos: [0, h + 0.001, 0], rot: [0, range(rnd, 0, 1.4), 0], cast: false }));  // 木口の割れ

    /* 根元金属巻き（防腐巻鉄） */
    const wh = 0.30 + range(rnd, -0.02, 0.03);
    col.add(mesh(cyl(POST_W * 0.72, POST_W * 0.76, wh, 4, true), galv, { pos: [0, wh / 2, 0], rot: [0, 45 * D2R, 0] }));
    col.add(mesh(cyl(POST_W * 0.75, POST_W * 0.75, 0.018, 4), galv, { pos: [0, wh, 0], rot: [0, 45 * D2R, 0] }));
    col.add(mesh(cyl(POST_W * 0.75, POST_W * 0.75, 0.015, 4), galv, { pos: [0, 0.008, 0], rot: [0, 45 * D2R, 0] }));
    for (let b = 0; b < 4; b++) {
      const a = (b / 4) * Math.PI * 2 + Math.PI / 4 + range(rnd, -0.05, 0.05);
      const rr2 = POST_W * 0.74;
      col.add(mesh(cyl(0.008, 0.008, 0.024, 6), boltM, { pos: [Math.sin(a) * rr2, wh * range(rnd, 0.32, 0.72), Math.cos(a) * rr2], rot: [90 * D2R, 0, -a] }));
    }
    /* 仕口座金 + アンカー 2 本（基礎石へ） */
    col.add(mesh(rbox(POST_W + 0.1, 0.017, POST_W + 0.1, 0.006, 2), steel, { pos: [0, 0.0085, 0] }));
    [-1, 1].forEach((sx) => {
      const bx = sx * (POST_W / 2 + 0.03);
      col.add(mesh(cyl(0.011, 0.011, 0.14, 8), MAT.stainless({ worn: 0.85, spec: 0.5 }), { pos: [bx, 0.07, 0.018] }));
      col.add(mesh(cyl(0.018, 0.018, 0.017, 6), boltM, { pos: [bx, 0.145, 0.018] }));
      weather(col, { w: 0.04, h: 0.1, pos: [bx, 0.055, 0.036], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + i * 9 + (sx > 0 ? 3 : 7), count: 1 });
    });
    /* 腐朽：木肌むき出し・欠け・虫食い穴 */
    col.add(mesh(rbox(POST_W + 0.014, range(rnd, 0.13, 0.2), 0.052, 0.012, 1), rotW, { pos: [POST_W * 0.34, 0.27, POST_W * 0.44], rot: [0, 0.22, 0], cast: false }));
    col.add(mesh(rbox(0.052, range(rnd, 0.08, 0.15), POST_W + 0.012, 0.012, 1), rotW, { pos: [-POST_W * 0.42, 0.45, 0.1], rot: [0, 0, 0.05], cast: false }));
    for (let k = 0; k < 3; k++) {
      col.add(mesh(cyl(0.009, 0.009, 0.022, 8), MAT.paint('#2f2a20', { steps: 2, spec: 0.02, shadowAmt: 1 }), {
        pos: [range(rnd, -0.05, 0.05), range(rnd, 0.15, 0.52), POST_W / 2 + 0.001], rot: [90 * D2R, 0, 0], cast: false,
      }));
    }
    /* 点検札（針金吊り） */
    const tag = grp('tag', { pos: [POST_W / 2 + 0.012, 1.26, 0.02], rot: [0, 0, -0.1] });
    tag.add(mesh(tubeOf([[0, 0.05, 0], [0.022, 0.02, 0.006], [0.004, 0, 0.012]], 0.0035), MAT.metal('#8d9491', { worn: 0.8 }), { cast: false }));
    tag.add(mesh(box(0.054, 0.074, 0.0035), MAT.paper({ map: TEX.lightPanel({ text: '検', bg: '#f4efe0', fg: '#4a4a44' }), color: '#fbf7ec' }), { pos: [0.004, -0.04, 0.012], cast: false }));
    col.add(tag);
    /* 柱に巻かれた注意札（赤帯＋下げ札） */
    const band = grp('notice', { pos: [0, 1.66, 0] });
    band.add(mesh(box(POST_W + 0.022, 0.028, POST_W + 0.022), MAT.metalPaint('#b8433a', { worn: 0.8, base: '#d8615a' }), {}));
    band.add(mesh(rbox(0.086, 0.112, 0.004, 0.004, 1), MAT.paper({ map: TEX.poster({ title: '足もと ちゅうい', bg: '#f7f0dd', accent: '#d8b23c', seed: seed + i }), color: '#ffffff' }), { pos: [0.055, -0.066, POST_W / 2 + 0.006], rot: [0.13, 0, -0.06] }));
    band.add(mesh(cyl(0.004, 0.004, 0.03, 6), boltM, { pos: [0.055, -0.012, POST_W / 2 + 0.006], rot: [90 * D2R, 0, 0] }));
    col.add(band);
    /* 経年：苔・泥跳ね・日焼け欠け */
    weather(col, { w: 0.2, h: 0.3, pos: [0, 0.34, POST_W / 2 + 0.004], kind: 'moss', color: '#6d8152', opacity: 0.34, seed: seed + i * 5, density: 1.5, count: 2, spread: 0.05 });
    weather(col, { w: 0.16, h: 0.9, pos: [-POST_W / 2 - 0.004, 0.85, 0], rot: [0, -Math.PI / 2, 0], kind: 'dirt', color: '#5d564c', opacity: 0.26, seed: seed + 40 + i, count: 2 });
    weather(col, { w: 0.11, h: 0.26, pos: [POST_W / 2 + 0.005, 1.05, 0.01], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#d8c8a6', opacity: 0.4, seed: seed + 60 + i, count: 2, density: 1.3 });
    g.add(col);
  });

  /* ═══════════ 2. 梁・二重梁・貫・柱頭金物・筋交 ═══════════ */
  g.add(mesh(box(BL - 0.2, BEAM.y1 - BEAM.y0, BEAM.w), beamMat, { pos: [CX, (BEAM.y0 + BEAM.y1) / 2, POST_Z], name: 'main-beam' }));
  // 中跨（柱の無い 6.2m）だけ梁を二重にする — 後補強の経年
  [[x0 + 0.12, POSTS[1] - 0.09], [POSTS[1] + 0.09, x1 - 0.12]].forEach(([a, b], k) => {
    const w = b - a;
    g.add(mesh(box(w, 0.16, 0.1), beamMat, { pos: [a + w / 2, BEAM.y0 - 0.085, POST_Z], name: 'doubled-beam-' + k }));
    for (const sx of [-1, 1]) {
      g.add(mesh(box(w - 0.1, 0.13, 0.008), steel, { pos: [a + w / 2, BEAM.y0 - 0.085, POST_Z + sx * 0.055] }));
      const n = Math.max(3, Math.round(w / 0.72));
      for (let j = 0; j < n; j++) {
        const bx = a + ((j + 0.5) / n) * w;
        g.add(mesh(cyl(0.011, 0.011, 0.02, 6), boltM, { pos: [bx, BEAM.y0 - 0.085, POST_Z + sx * 0.062], rot: [90 * D2R, 0, 0] }));
        weather(g, { w: 0.032, h: 0.085, pos: [bx, BEAM.y0 - 0.145, POST_Z + sx * 0.066], rot: [0, sx > 0 ? 0 : Math.PI, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + 300 + k * 7 + j + (sx > 0 ? 0 : 41), count: 1 });
      }
    }
  });
  // 貫（柱を貫く横胴）
  g.add(mesh(box(BL - 0.36, 0.092, 0.088), beamMat, { pos: [CX, NUKE_Y, POST_Z], name: 'nuki' }));
  // 柱頭金物（キャップ＋羽根＋ボルト）
  for (const px of POSTS) {
    const hd = grp('head', { pos: [px, 0, POST_Z] });
    hd.add(mesh(box(POST_W + 0.06, 0.018, POST_W + 0.06), steel, { pos: [0, POST_TOP + 0.009, 0] }));
    [-1, 1].forEach((sx) => {
      hd.add(mesh(box(0.009, BEAM.y1 - (POST_TOP - 0.26), POST_W * 0.72), steel, { pos: [sx * (POST_W / 2 + 0.007), (POST_TOP - 0.26 + BEAM.y1) / 2, 0], name: 'wing' }));
      [POST_TOP - 0.2, 1.95].forEach((by) => hd.add(mesh(cyl(0.008, 0.008, 0.022, 6), boltM, { pos: [sx * (POST_W / 2 + 0.016), by, 0.03], rot: [0, 0, 90 * D2R] })));
    });
    // 前端 cantilever 受け（持ち送り＝梁下から軒裏母屋への上向き腕木）※hd は既に柱芯へ移動済み
    hd.add(member([0, BEAM.y0 + 0.02, POST_Z - BEAM.w / 2 - 0.012], [0, yUnder(-1.44), -1.44], (L) => box(0.055, L, 0.06), rafMat, { name: 'eave-strut' }));
    hd.add(mesh(box(0.09, 0.02, 0.13), steel, { pos: [0, yUnder(-1.44) + 0.03, -1.44] }));
    g.add(hd);
  }
  // 柱間の X 筋交いは造らない：田舎駅の上屋は柱＋主梁＋二重梁だけであとは素朴、
  // 客側（線路側）に大きな X が出ると足元が脚手架に見える。
  // 後方腕木（cantilever 受け）＋ その筋交
  for (const bx of [x0 + 0.95, ...POSTS, x1 - 0.95]) {
    g.add(member([bx, BEAM.y1 - 0.06, POST_Z + 0.07], [bx, 2.862, 1.33], (L) => box(0.07, L, 0.17), beamMat, { name: 'corbel' }));
    g.add(member([bx, POST_TOP - 0.44, POST_Z + 0.07], [bx, 2.7, 0.74], (L) => box(0.055, L, 0.055), rafMat, { name: 'corbel-brace' }));
    g.add(mesh(box(0.12, 0.022, 0.2), steel, { pos: [bx, 2.8, 1.34] }));
  }

  /* ═══════════ 3. 屋根（母屋・垂木・野地板・トタン） ═══════════ */
  const roof = grp('roof-plane', { pos: [CX, RMID.y, RMID.z], rot: [-SLOPE, 0, 0] });
  for (const [pz, pw, ph] of [[-1.44, 0.09, 0.11], [-0.365, 0.12, 0.13], [1.42, 0.1, 0.12]]) {
    roof.add(mesh(box(BL - 0.1, ph, pw), beamMat, { pos: [0, -0.21 + ph / 2, pz], name: 'purlin' }));
  }
  const nRaf = Math.round(len / 0.42);
  for (let i = 0; i <= nRaf; i++) {
    const x = -RX + 0.06 + (i / nRaf) * (BL - 0.12);
    const lift = i % 7 === 0 ? range(rnd, -0.007, 0.007) : 0;   // 垂木の反り
    roof.add(mesh(box(0.05, 0.072, SH * 2 - 0.06), rafMat, { pos: [x, -0.054 + lift, 0], name: 'rafter' }));
  }
  for (let i = 0; i < 5; i++) {                                  // 野地板 5 枚（目地 4mm）
    const zw = -SH + 0.005 + (i + 0.5) * ((SH * 2 - 0.01) / 5);
    const bow = Math.sin((i / 4) * Math.PI) * 0.004;
    roof.add(mesh(box(BL, 0.016, (SH * 2 - 0.01) / 5 - 0.005), deckWood, { pos: [0, -0.009 - bow, zw], name: 'deck-board-' + i }));
  }
  const sw = BL / 3;                                             // トタン 3 枚継ぎ（反り・色違い）
  for (let i = 0; i < 3; i++) {
    const sx = x0 - CX + sw * (i + 0.5);
    const curl = range(rnd, -0.0045, 0.0045);
    roof.add(mesh(box(sw - 0.02, 0.013, SH * 2 + 0.02), i === 1 ? zinc : zincOld, {
      pos: [sx, 0.0065 + curl, range(rnd, -0.007, 0.007)], rot: [range(rnd, -0.005, 0.005), 0, curl], name: 'totoan-' + i,
    }));
    if (i < 2) roof.add(mesh(box(0.062, 0.017, SH * 2 + 0.03), zinc, { pos: [sx + sw / 2, 0.014, 0], rot: [0, 0, 0.02], name: 'lap-' + i }));
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {       // 釘（釘浮き＋錆）
    const nx = -RX + 0.85 + c * ((BL - 1.7) / 5);
    const nz = -1.28 + r * 1.28;
    const loose = r === 1 && c % 3 === 0;
    roof.add(mesh(cyl(0.008, 0.0075, 0.009, 8), MAT.metal('#b9b3a8', { worn: 0.9, spec: 0.5 }), { pos: [nx, 0.0155 + (loose ? 0.005 : 0), nz], cast: false }));
    if (loose) weather(roof, { w: 0.028, h: 0.13, pos: [nx, 0.02, nz - 0.055], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a5236', opacity: 0.55, seed: seed + r * 17 + c, count: 1 });
  }
  roof.add(inst(leafGeo, leafM, 78, (i, d, r) => {              // 屋根上の落葉堆積
    const band = i % 3;
    d.position.set(range(r, -RX + 0.2, RX - 0.2), 0.017 + r() * 0.006, band === 0 ? -SH + 0.07 + r() * 0.24 : band === 1 ? 0.1 + r() * 0.5 : SH - 0.18 - r() * 0.3);
    d.rotation.set(range(r, -0.18, 0.18), r() * 3.1, range(r, -0.2, 0.2));
    d.scale.setScalar(range(r, 0.72, 1.35));
  }, { name: 'roof-litter', cast: false, receive: true }));
  weather(roof, { w: 3.2, h: 0.9, pos: [-2.3, 0.018, 0.85], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#6d8152', opacity: 0.34, seed: seed + 301, density: 1.5, count: 2 });
  weather(roof, { w: 2.6, h: 1.2, pos: [2.4, 0.018, -0.4], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a5236', opacity: 0.3, seed: seed + 302, density: 1.3, count: 2 });
  weather(roof, { w: 1.8, h: 0.5, pos: [0.2, 0.018, -1.25], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d564c', opacity: 0.28, seed: seed + 303, count: 2 });
  g.add(roof);

  /* 鼻隠し・破風・棟側見切り */
  const eaveY = RMID.y - SH * Math.sin(SLOPE);       // 軒先 y'=0 面
  const eaveZ = RMID.z - SH * Math.cos(SLOPE);
  g.add(mesh(box(BL + 0.04, 0.14, 0.024), deckWood, { pos: [CX, eaveY - 0.07, eaveZ - 0.009], name: 'fascia' }));
  for (const ex of [x0 - 0.022, x1 + 0.022]) {
    g.add(mesh(box(0.024, 0.18, SH * 2 - 0.1), deckWood, { pos: [ex, RMID.y + 0.03, RMID.z], rot: [-SLOPE, 0, 0], name: 'rake' }));
  }
  {
    const ry = RMID.y + SH * Math.sin(SLOPE), rz = RMID.z + SH * Math.cos(SLOPE);
    g.add(mesh(box(BL + 0.03, 0.05, 0.1), galv, { pos: [CX, ry + 0.01, rz + 0.03], rot: [-0.55, 0, 0], name: 'ridge-flash' }));
    g.add(mesh(box(BL + 0.03, 0.016, 0.04), galv, { pos: [CX, ry - 0.02, rz - 0.02] }));
  }

  /* ═══════════ 4. 雨樋と受け・竪樋 ═══════════ */
  const GY = eaveY - 0.03, GZ = eaveZ - 0.1;
  const gutterGeo = extrude(shape((sh) => {
    sh.moveTo(-0.086, 0.026);
    sh.absarc(0, 0, 0.078, Math.PI, Math.PI * 2, false);
    sh.lineTo(0.086, 0.026);
    sh.lineTo(0.072, 0.026);
    sh.absarc(0, 0.005, 0.065, 0, Math.PI, true);
    sh.closePath();
  }), { depth: BL + 0.02, bevelEnabled: false, steps: 1, curveSegments: 14 });
  g.add(mesh(gutterGeo, galv, { pos: [x0 - 0.01, GY, GZ], rot: [0, 90 * D2R, 0], name: 'gutter' }));
  const nB = Math.max(6, Math.round(len / 1.05));
  for (let i = 0; i <= nB; i++) {
    const bx = x0 + (i / nB) * BL;
    const br = grp('gutter-strap', { pos: [bx, GY, GZ] });
    br.add(mesh(tor(0.082, 0.007, 5, 10), steel, { rot: [0, 90 * D2R, 0] }));
    br.add(member([0, 0.01, 0.078], [0, 0.115, 0.115], (L) => box(0.02, L, 0.016), steel));
    g.add(br);
    if (i % 3 === 0) weather(g, { w: 0.045, h: 0.18, pos: [bx, GY - 0.07, GZ - 0.079], rot: [0, Math.PI, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 400 + i, count: 1 });
  }
  const DPX = x1 - 0.42;
  g.add(pipe([[DPX, GY - 0.03, GZ], [DPX, 2.24, GZ + 0.05], [DPX, 2.02, POST_Z - 0.86], [DPX, 0.4, POST_Z - 0.86], [DPX, 0.11, POST_Z - 0.82]], 0.055, galv, { seg: 30, radial: 9, name: 'downpipe' }));
  g.add(mesh(cyl(0.066, 0.056, 0.06, 12), galv, { pos: [DPX, 0.13, POST_Z - 0.82] }));      // 吐口
  for (const by of [1.86, 1.16, 0.5]) {
    g.add(mesh(box(0.15, 0.05, 0.018), steel, { pos: [DPX, by, POST_Z - 0.916], cast: false }));
    g.add(mesh(cyl(0.007, 0.007, 0.026, 6), boltM, { pos: [DPX, by, POST_Z - 0.9], rot: [90 * D2R, 0, 0] }));
  }
  weather(g, { w: 0.16, h: 0.8, pos: [DPX + 0.06, 0.95, POST_Z - 0.8], rot: [0, Math.PI, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.45, seed: seed + 431, density: 1.6, count: 3, spread: 0.14 });
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#4f4a3f', seed: seed + 440, density: 1.6 }), w: 4.6, h: 0.09, pos: [CX - 1.2, GY + 0.02, GZ - 0.079], rot: [0, Math.PI, 0], opacity: 0.42, order: 2 });
  for (let i = 0; i < 10; i++) {
    g.add(mesh(leafGeo, leafM, { pos: [range(rnd, x0 + 0.3, x1 - 0.3), GY + 0.05, GZ + range(rnd, -0.05, 0.05)], rot: [range(rnd, -0.5, 0.5), rnd() * 3, range(rnd, -0.6, 0.6)], cast: false }));
  }

  /* ═══════════ 5. 天井照明（2~3 灯・breathe） ═══════════ */
  const nLamp = len > 10 ? 3 : 2;
  for (let i = 0; i < nLamp; i++) {
    const lx = CX + (nLamp === 1 ? 0 : (i / (nLamp - 1) - 0.5) * (BL - 2.6));
    const zc = -0.98 + range(rnd, -0.06, 0.06);
    const top = yUnder(zc) + 0.12;
    const L = grp('lamp-' + i, { pos: [lx, top, zc] });
    L.add(mesh(cyl(0.014, 0.014, 0.05, 8), steel, { pos: [0, -0.025, 0] }));
    L.add(mesh(cyl(0.004, 0.004, 0.12, 6), MAT.metal('#8d9491', { worn: 0.8 }), { pos: [0, -0.11, 0] }));
    L.add(mesh(cyl(0.022, 0.018, 0.05, 12), MAT.paint('#efe9dc', { spec: 0.55, specPower: 130, sheen: 0.12, steps: 2 }), { pos: [0, -0.195, 0], name: 'porcelain-socket' }));  // 磁器
    L.add(mesh(cyl(0.13, 0.072, 0.072, 18, true), MAT.lampShade({ color: '#fff6e2', emissive: '#ffdca6', emissiveIntensity: 0.6, side: THREE.DoubleSide }), { pos: [0, -0.25, 0], cast: false, name: 'lamp-shade' }));
    L.add(mesh(cyl(0.126, 0.126, 0.006, 18), MAT.lampShade({ color: '#fff8ea', emissive: '#ffe1b0', emissiveIntensity: 0.85, side: THREE.DoubleSide }), { pos: [0, -0.286, 0], cast: false }));
    L.add(mesh(sph(0.03, 10, 8), MAT.bulb({ color: '#fff4d8' }), { pos: [0, -0.252, 0], cast: false }));
    L.add(mesh(cyl(0.122, 0.07, 0.06, 16, true), MAT.paint('#6b6355', { side: THREE.BackSide, steps: 2, spec: 0.02, shadowAmt: 1, transparent: true, opacity: 0.72 }), { pos: [0, -0.247, 0], cast: false, receive: false }));  // 内側スス
    L.add(hoopLike(L, 0.132, steel, -0.216));
    L.userData.breathe = { speed: 0.33 + i * 0.05, amount: 0.1, phase: ((seed % 7) / 7) * 6.28 + i * 1.7 };
    g.add(L);
  }

  /* ═══════════ 6. 鳥除けネット（妻側くさび形 2 面） ═══════════ */
  const netM = MAT.fabric({ color: '#767a70', repeat: 4, spec: 0.02 });
  for (const ex of [x0 + 0.08, x1 - 0.08]) {
    const nz = grp('bird-net', { pos: [ex, 0, 0] });
    const n = 11;
    for (let i = 0; i < n; i++) {
      const z = POST_Z + 0.14 + (i / (n - 1)) * 1.2;
      const hh = Math.max(0.02, yUnder(z) + 0.012 - BEAM.y1);
      nz.add(mesh(box(0.006, hh, 0.006), netM, { pos: [0, BEAM.y1 + hh / 2, z], cast: false }));
    }
    for (let j = 0; j < 3; j++) {
      nz.add(mesh(box(0.005, 0.005, 1.02), netM, { pos: [0, BEAM.y1 + 0.03 + j * 0.075, 0.06 + j * 0.06 + 0.45], cast: false }));
    }
    nz.add(mesh(box(0.022, 0.02, 1.4), steel, { pos: [0, BEAM.y1 - 0.012, POST_Z + 0.74] }));
    g.add(nz);
  }

  /* ═══════════ 7. 全体経年 ═══════════ */
  weather(g, { w: 1.3, h: 0.26, pos: [CX - 2.4, BEAM.y0 + 0.05, POST_Z + BEAM.w / 2 + 0.007], kind: 'chip', color: '#d6c19a', opacity: 0.45, seed: seed + 501, count: 3, density: 1.4 });
  weather(g, { w: 2.4, h: 0.32, pos: [CX + 2.0, NUKE_Y - 0.14, POST_Z + 0.05], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.3, seed: seed + 502, count: 2, density: 1.2 });
  weather(g, { w: 0.6, h: 0.24, pos: [CX - RX * 0.4, eaveY - 0.11, eaveZ - 0.024], rot: [0, Math.PI, 0], kind: 'dirt', color: '#4f5a45', opacity: 0.42, seed: seed + 503, count: 3, spread: 0.7 });
  g.add(inst(rbox(0.05, 0.003, 0.04, 0.003, 1), MAT.petal({ map: TEX.petal({ mode: 'single', tone: 1 }), alphaTest: 0.4, side: THREE.DoubleSide }), 44, (i, d, r) => {
    d.position.set(range(r, x0 + 0.4, x1 - 0.4), -0.005, range(r, -1.3, 1.3));
    d.rotation.set(0, r() * 3.1, 0);
    d.scale.setScalar(range(r, 0.7, 1.2));
  }, { name: 'fallen-petals', cast: false, receive: true }));

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

/** 灯具まわりの押さえ環（kit.hoop は position を返さない為の薄い torus） */
function hoopLike(parent, r, mat, y) {
  const m = mesh(tor(r, 0.006, 5, 10), mat, { pos: [0, y, 0], rot: [90 * D2R, 0, 0] });
  parent.add(m);
  return m;
}

export default build;
