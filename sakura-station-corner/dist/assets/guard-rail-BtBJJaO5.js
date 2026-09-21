import { g as grp, M as MAT, m as mesh, r as rbox, c as cyl, w as weather, n as range, t as tor, D as DoubleSide, U as circ, h as decal, T as TEX, b as box, P as PAL, H as plane, s as shade, p as shadowBlob, q as finish, R as ExtrudeGeometry, N as makeCanvas, Q as toTexture, J as shape, z as rand } from './index-BvEZsPNz.js';

//  assets/street/guard-rail.js —— 波形ガードレール（波板リブ断面・柱・エンドブロック・反射標識・基礎）
//  endType: 'start' 端末（緩衝段＋反射板） / 'middle' 直線連節 / 'join' 継手金具
//  摩耗：亜鉛メッキの白サビ・横スクレンド・凹み（打ち込み）・補修交換跡・根元の錆と泥・苔

const meta = {
  id: 'guard-rail',
  real: [4.0, 0.66, 0.16],
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { len: 4, seed: 44, endType: 'middle' };

const D2R = Math.PI / 180;
const BEAM_H = 0.082;         // 波板 全高
const BEAM_WAVE = 0.033;      // 段深（波の膨らみ）
const BEAM_T = 0.0042;        // 板厚
const BEAM_Y = 0.53;          // 波板下端の地上高（天端 0.612）
const CREST_T = 0.5;          // 波頂のパラメータ位置
const zAt = (t) => BEAM_WAVE * Math.pow(Math.sin(Math.PI * t), 1.15) * (0.5 + 0.5 * Math.cos((t - 0.5) * Math.PI * 4));

/** 波板断面（Y = 高さ / X =  road 側への膨らみ）を板厚付き閉轮廓で */
function beamSection() {
  const N = 40;
  const mid = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    mid.push([zAt(t), t * BEAM_H]);
  }
  return shape((sh) => {
    sh.moveTo(-0.016, 0);
    for (const [z, y] of mid) sh.lineTo(z, y);
    sh.lineTo(-0.016, BEAM_H);
    sh.lineTo(-0.016 + BEAM_T, BEAM_H);
    for (let i = mid.length - 1; i >= 0; i--) sh.lineTo(mid[i][0] - BEAM_T, mid[i][1]);
    sh.lineTo(-0.016 + BEAM_T, 0);
    sh.closePath();
  });
}
function beamMesh(lenVal, mat, x, y, rz = 0) {
  const geo = new ExtrudeGeometry(beamSection(), { depth: lenVal, bevelEnabled: false, curveSegments: 8, steps: 1 });
  return mesh(geo, mat, { pos: [x, y, 0], rot: [0, -90 * D2R, rz] });
}

function reflectorTex() {
  const cv = makeCanvas(128, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#f3efe4';
  g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, 7); g.fill();
  g.fillStyle = PAL.storeBand3;
  g.beginPath(); g.arc(w / 2, h / 2, w * 0.31, 0, 7); g.fill();
  g.globalAlpha = 0.4;                                   // 色褪せ
  for (let i = 0; i < 24; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#9a9184';
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 10);
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const len = options.len ?? 4;
  const seed = options.seed ?? 44;
  const endType = options.endType || 'middle';
  const rnd = rand(seed);
  const g = grp('guard-rail');

  const zinc = MAT.galvanized({ repeat: 3, worn: 0.7 });
  const zincPost = MAT.galvanized({ repeat: 2, worn: 0.95 });
  const boltMat = MAT.metal('#9aa0a3', { worn: 0.85 });
  const nPost = Math.max(2, Math.round(len / 2.0) + 1);
  const crestZ = zAt(CREST_T);

  /* ------------------------------ 波板（リブ断面） ------------------------------ */
  const wbeam = beamMesh(len, zinc, len / 2, BEAM_Y);
  wbeam.name = 'w-beam';
  g.add(wbeam);

  /* ------------------------------ 補修交換跡（中央 0.5 m を新品に打換） ------------------------------ */
  if (len > 3) {
    const rp = beamMesh(0.5, MAT.galvanized({ repeat: 2, worn: 0.2 }), 0.25, BEAM_Y + 0.0004);
    g.add(rp);
    for (const sx of [-0.25, 0.25]) {
      g.add(mesh(rbox(0.1, 0.058, 0.013, 0.004, 2), zincPost, { pos: [sx, BEAM_Y + BEAM_H * 0.5, -0.028] }));
      for (const [bx, by] of [[-0.03, 0.015], [0.03, 0.015], [-0.03, -0.015], [0.03, -0.015]]) {
        g.add(mesh(cyl(0.006, 0.006, 0.011, 6), boltMat, { pos: [sx + bx, BEAM_Y + BEAM_H * 0.5 + by, -0.036], rot: [90 * D2R, 0, 0] }));
      }
    }
  }
  /* ------------------------------ 継手（endType='join'） ------------------------------ */
  if (endType === 'join') {
    for (const sx of [-len / 2 + 0.06, len / 2 - 0.06]) {
      g.add(mesh(rbox(0.12, BEAM_H * 0.9, 0.014, 0.004, 2), zincPost, { pos: [sx, BEAM_Y + BEAM_H / 2, crestZ + 0.006] }));
      for (const [bx, by] of [[-0.038, 0.026], [0.038, 0.026], [-0.038, -0.026], [0.038, -0.026]]) {
        g.add(mesh(cyl(0.0062, 0.0062, 0.012, 6), boltMat, { pos: [sx + bx, BEAM_Y + BEAM_H / 2 + by, crestZ + 0.014], rot: [90 * D2R, 0, 0] }));
      }
    }
  }

  /* ------------------------------ 経年：白サビ・擦り傷・凹み ------------------------------ */
  // 波頂（最も膨らんだ稜線）と上下のフラット縁にだけ浮き貼するので z-fighting / 浮き無し
  weather(g, { w: len * 0.4, h: 0.026, pos: [-len * 0.17, BEAM_Y + BEAM_H * CREST_T, crestZ + 0.0016], kind: 'scratch', color: '#e4e7e3', opacity: 0.45, seed: seed + 3, count: 2, density: 1.6 });
  weather(g, { w: len * 0.26, h: 0.024, pos: [len * 0.2, BEAM_Y + BEAM_H * CREST_T + 0.002, crestZ + 0.0016], kind: 'rust', color: '#b6bab5', opacity: 0.5, seed: seed + 4, count: 2, density: 1.5 });
  weather(g, { w: len * 0.5, h: 0.02, pos: [0, BEAM_Y + BEAM_H + 0.0018, -6e-3], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#8a8171', opacity: 0.5, seed: seed + 5, count: 3, spread: 0.05 });
  weather(g, { w: len * 0.4, h: 0.018, pos: [-len * 0.1, BEAM_Y - 0.0018, -4e-3], rot: [90 * D2R, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 6, count: 2 });
  // 凹み（打ち込み）：盛り上がる縁＋削れた中心
  for (let i = 0; i < 3; i++) {
    const dx = range(rnd, -len / 2 + 0.35, len / 2 - 0.35);
    const dz = crestZ;
    const rz = 0.05;
    const ring = mesh(tor(rz, 0.005, 6, 18), MAT.galvanized({ repeat: 1, worn: 0.35 }), { pos: [dx, BEAM_Y + BEAM_H * CREST_T, dz + 0.002] });
    ring.rotation.set(range(rnd, -0.08, 0.08), range(rnd, -0.1, 0.1), range(rnd, -0.4, 0.4));
    g.add(ring);
    const dish = mesh(circ(rz * 0.94, 18), MAT.metal('#8d938f', { worn: 0.9, base: '#a9afab', side: DoubleSide }), { pos: [dx, BEAM_Y + BEAM_H * CREST_T, dz + 0.0055], scale: [1, 1.55, 1] });
    dish.userData.noOutline = true;
    g.add(dish);
    decal(g, { map: TEX.wear({ kind: 'chip', color: '#7b817d', seed: seed + 30 + i, density: 1.8 }), w: rz * 1.7, h: rz * 1.1, pos: [dx, BEAM_Y + BEAM_H * CREST_T, dz + 0.0022], order: 2 });
  }

  /* ------------------------------ 柱 ------------------------------ */
  for (let i = 0; i < nPost; i++) {
    const x = -len / 2 + (i * len) / (nPost - 1);
    const p = grp('post', { pos: [x, 0, -0.055] });
    const topY = 0.63;
    p.add(mesh(box(0.086, topY, 0.016), zincPost, { pos: [0, topY / 2, 0], name: 'rail-post' }));
    for (const sx of [-1, 1]) p.add(mesh(box(0.02, topY, 0.05), zincPost, { pos: [sx * 0.033, topY / 2, 0.014] }));
    p.add(mesh(box(0.048, topY, 0.012), zincPost, { pos: [0, topY / 2, 0.028] }));
    p.add(mesh(rbox(0.094, 0.022, 0.062, 0.005, 2), zinc, { pos: [0, topY + 0.009, 0.008] }));   // 柱頭キャップ
    // 波板を押さえる貼付金具（上・中・下）
    for (const t of [0.86, 0.5, 0.14]) {
      const by = BEAM_Y + BEAM_H * t;
      const zz = zAt(t);
      p.add(mesh(rbox(0.108, 0.046, 0.014, 0.004, 2), zinc, { pos: [0, by, zz + 0.008] }));
      p.add(mesh(cyl(0.0075, 0.0075, 0.014, 6), boltMat, { pos: [0, by, zz + 0.017], rot: [90 * D2R, 0, 0] }));
      p.add(mesh(box(0.015, 0.015, Math.max(0.05, zz + 0.06)), MAT.metal('#8d9491', { worn: 0.7 }), { pos: [0, by, (zz + 0.008 - 0.03) / 2] }));
    }
    // 根元：土盛り・泥はね・錆
    p.add(mesh(cyl(0.075, 0.1, 0.045, 12), MAT.concrete({ base: PAL.dirt, repeat: 1 }), { pos: [0, 0.018, 0.005] }));
    weather(p, { w: 0.11, h: 0.22, pos: [0.012, 0.14, 0.052], kind: 'rust', color: '#7d4a2c', opacity: 0.6, seed: seed + 11 + i, density: 2, count: 2, spread: 0.05 });
    weather(p, { w: 0.1, h: 0.09, pos: [-0.02, 0.05, 0.06], kind: 'dirt', color: '#6d6152', opacity: 0.62, seed: seed + 21 + i, count: 1 });
    g.add(p);
  }

  /* ------------------------------ 反射標識（「○」形・色褪せ） ------------------------------ */
  const nRef = Math.max(2, Math.round(len / 1.6));
  const rTex = reflectorTex();
  for (let i = 0; i < nRef; i++) {
    const x = -len / 2 + ((i + 0.5) * len) / nRef;
    const r = 0.036;
    const rf = grp('reflector', { pos: [x, BEAM_Y + BEAM_H + 0.036, 0.004] });
    rf.add(mesh(cyl(r, r * 0.95, 0.013, 16), MAT.metal('#b7bcbf', { worn: 0.6 }), { rot: [90 * D2R, 0, 0] }));
    const disc = mesh(plane(r * 1.7, r * 1.7), MAT.decal({ map: rTex, opacity: 1 }), { pos: [0, 0, 0.0078], cast: false, receive: false });
    disc.userData.noOutline = true;
    rf.add(disc);
    rf.add(mesh(box(0.014, 0.052, 0.014), MAT.metal('#9aa0a3', { worn: 0.85 }), { pos: [0, -0.03, -0.012] }));
    g.add(rf);
  }

  /* ------------------------------ 端末処理 ------------------------------ */
  if (endType === 'start') {
    const t = grp('terminal', { pos: [len / 2, 0, 0] });
    const slope = 0.66;
    // 緩衝段：端末から地際へ降りる短い波板
    const tb = beamMesh(slope, zinc, slope / 2, BEAM_Y - 0.02);
    tb.rotation.z = -20 * D2R;
    tb.position.set(slope / 2 + 0.02, BEAM_Y - 0.19, 0);
    t.add(tb);
    // エンドブロック（黒ゴム緩衝材・割れ）
    const eb = mesh(rbox(0.17, 0.13, 0.078, 0.022, 2), MAT.rubber('#33373c', { spec: 0.1, shadowAmt: 0.98 }), { pos: [slope + 0.03, BEAM_Y - 0.42, 0.01], rot: [0, 0, -20 * D2R] });
    t.add(eb);
    weather(t, { w: 0.1, h: 0.06, pos: [slope + 0.05, BEAM_Y - 0.38, 0.052], kind: 'chip', color: '#6f7377', opacity: 0.7, seed: seed + 41, count: 2 });
    // 赤白反射板
    t.add(mesh(rbox(0.1, 0.15, 0.012, 0.004, 2), MAT.metalPaint('#c9cdc9', { worn: 0.75, base: '#e9ece8' }), { pos: [0.0, BEAM_Y + 0.12, 0.03], rot: [0, 0, -6 * D2R] }));
    decal(t, {
      map: TEX.gradient({ stops: [[0, PAL.storeBand3], [0.5, PAL.storeBand3], [0.5, '#efeade'], [1, '#efeade']] }),
      w: 0.086, h: 0.134, pos: [0.0, BEAM_Y + 0.12, 0.038], rot: [0, 0, -6 * D2R], order: 1,
    });
    t.add(mesh(box(0.09, 0.52, 0.055), zincPost, { pos: [-0.02, 0.26, -0.05] }));
    g.add(t);
  } else {
    for (const sx of [-1, 1]) {
      g.add(mesh(rbox(0.015, BEAM_H * 1.04, BEAM_WAVE * 2.0, 0.005, 2), MAT.hardPlastic('#8f9490', { spec: 0.25 }), {
        pos: [sx * (len / 2 + 0.006), BEAM_Y + BEAM_H / 2, BEAM_WAVE * 0.42],
      }));
    }
  }

  /* ------------------------------ 基礎と土留め ------------------------------ */
  const bed = grp('foundation');
  bed.add(mesh(rbox(len + 0.08, 0.055, 0.3, 0.008, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 3, joints: 4, cracked: true }), { pos: [0, -2e-3, -0.045] }));
  const nb = Math.max(2, Math.round(len / 0.4));
  for (let i = 0; i < nb; i++) {
    const x = -len / 2 + (i + 0.5) * (len / nb);
    bed.add(mesh(rbox(len / nb - 0.014, 0.16, 0.09, 0.006, 2), MAT.concrete({ base: shade(PAL.concrete, 0.92), repeat: 1 }), { pos: [x, 0.055, -0.185] }));
  }
  bed.add(mesh(box(len, 0.03, 0.12), MAT.grass({ repeat: 6, base: PAL.grassDark }), { pos: [0, 0.008, -0.265] }));
  g.add(bed);
  weather(g, { w: len * 0.5, h: 0.13, pos: [len * 0.12, 0.05, -0.138], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 51, density: 1.6, count: 2, spread: 0.12 });
  shadowBlob(g, { r: len * 0.3, pos: [0, 0.004, 0.03], opacity: 0.18, ratio: 0.4 });
  return finish(g, { outline: 'normal', minSize: 0.03 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
