// 田舎駅ホーム：コンクリート本体・端部・盲道・白線・排水・階段開口
import * as THREE from 'three';
import { grp, mesh, box, rbox, finish, rand, range, weather, decal } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, slab, wallX, wallZ, repeats, Y, clipRun, insideClip } from './common.js';
import { SEG, RAIL, PLOT } from './plan.js';

export function build(options = {}) {
  const g = grp('station-platform');
  const rnd = rand(options.seed ?? 1717);
  const P = { ...SEG.platform };
  // 端石・白線・目地是横穿整个站台的一根长箱：按取景框把 x 区间截断，
  // 否则站台西端会伸出台座外面去。
  const run = clipRun('x', P.x0, P.x1, (P.z0 + P.z1) / 2);
  if (!run) return finish(g, { outline: 'thin', minSize: 0.2 });
  P.x0 = run[0];
  P.x1 = run[1];
  const top = P.y;
  const bot = SEG.track.y;
  const h = top - bot;

  const conc = MAT.concrete({ base: '#cdc7bb', repeat: 1, joints: 4, cracked: true });
  const concOld = MAT.concrete({ base: '#bdb7aa', repeat: 1, joints: 3, cracked: true });

  /* ---------- ホーム本体 ---------- */
  g.add(surface(P.x0, P.x1, P.z0, P.z1, top, conc, { tile: 1.9, name: 'deck', segs: 4 }));
  g.add(slab(P.x0, P.x1, P.z0, P.z1, top - 0.004, h, concOld, { name: 'body', cast: true }));

  /* ---------- 側面（擁壁）：北（線路側）・南（裏側）・東端 ---------- */
  g.add(wallX(P.x0, P.x1, bot, top, P.z0, MAT.concrete({ base: '#b3ada1', repeat: 1 }), { tile: 2.6, face: '-z', name: 'wall-trackside' }));
  g.add(wallX(P.x0, P.x1, bot, top - 0.02, P.z1, MAT.concrete({ base: '#a9a396', repeat: 1 }), { tile: 2.6, face: '+z', name: 'wall-back' }));
  g.add(wallZ(P.z0, P.z1, bot, top, P.x0, MAT.concrete({ base: '#b0aa9e', repeat: 1 }), { tile: 2.6, face: '-x', name: 'wall-west' }));
  // 東端（踏切側）は階段開口のため半分だけ
  g.add(wallZ(P.z0, P.z1, bot, top, P.x1, MAT.concrete({ base: '#b0aa9e', repeat: 1 }), { tile: 2.6, face: '+x', name: 'wall-east' }));

  /* ---------- 線路側の端石・安全白線・隙間 ---------- */
  const edgeStone = MAT.concrete({ base: '#d6d0c4', repeat: 1 });
  const edgeZ = P.z0 + 0.06;
  g.add(mesh(box(P.x1 - P.x0, 0.05, 0.24), edgeStone, { pos: [(P.x0 + P.x1) / 2, top + 0.012, edgeZ + 0.1], cast: true, receive: true }));
  for (let i = 0; i < 15; i++) {
    const x = P.x0 + 0.3 + i * 1.28;
    if (x > P.x1 - 0.4) break;
    // 端石は 1.24 m の一石：中心ではなく両端を見て枠外に出す
    if (!insideClip(x - 0.62, edgeZ) || !insideClip(x + 0.62, edgeZ)) continue;
    g.add(mesh(rbox(1.24, 0.055, 0.24, 0.012, 2), edgeStone, { pos: [x, top + 0.014, edgeZ + 0.1], cast: true, receive: true }));
  }
  // 安全白線（端から 0.5m 内側、色褪せ）
  g.add(mesh(box(P.x1 - P.x0 - 0.4, 0.008, 0.11), MAT.marking('#efe9da', { repeat: 1 }), { pos: [(P.x0 + P.x1) / 2, top + 0.02, edgeZ + 0.56], cast: false, receive: true }));
  // 端部の隙間（ホームと車体）に見えない影
  g.add(mesh(box(P.x1 - P.x0, 0.02, 0.1), MAT.paint('#2a2b28', { spec: 0, steps: 2, shadowAmt: 1 }), { pos: [(P.x0 + P.x1) / 2, top - 0.004, P.z0 + 0.05], cast: false, receive: false }));

  /* ---------- 点字ブロック（ホーム中央誘導） ---------- */
  for (let i = 0; i < Math.floor((P.x1 - P.x0) / 0.305); i++) {
    const x = P.x0 + 0.16 + i * 0.305;
    if (x > P.x1 - 0.2) break;
    const m = mesh(box(0.29, 0.014, 0.29), i % 6 === 0 ? MAT.tactile({ kind: 'dot', repeat: 1 }) : MAT.tactile({ kind: 'line', repeat: 1 }), {
      pos: [x, top + 0.012, P.z1 - 0.62],
      cast: false,
      receive: true,
    });
    g.add(m);
  }

  /* ---------- 排水桝・継ぎ目・モルタル補修 ---------- */
  for (let i = 0; i < 9; i++) {
    const x = P.x0 + 1.6 + i * 2.2;
    if (x > P.x1 - 0.6) break;
    g.add(
      mesh(rbox(0.34, 0.02, 0.3, 0.015, 2), MAT.darkIron({ spec: 0.24 }), {
        pos: [x, top + 0.018, P.z1 - 0.34],
        cast: false,
        receive: true,
      }),
    );
    for (let b = 0; b < 4; b++) {
      g.add(mesh(box(0.28, 0.024, 0.026), MAT.darkIron(), { pos: [x, top + 0.022, P.z1 - 0.45 + b * 0.074], cast: false, receive: true }));
    }
  }
  // 目地（充填打換）
  for (let i = 0; i < 12; i++) {
    const x = P.x0 + 1.0 + i * 1.72;
    if (x > P.x1) break;
    g.add(mesh(box(0.022, 0.01, P.z1 - P.z0 - 0.3), MAT.rubber('#8f8a7e'), { pos: [x, top + 0.008, (P.z0 + P.z1) / 2], cast: false, receive: true }));
  }
  // 補修モルタル（白っぽいパテ）
  for (let i = 0; i < 7; i++) {
    g.add(
      mesh(rbox(range(rnd, 0.5, 1.5), 0.012, range(rnd, 0.3, 0.9), 0.05, 2), MAT.concrete({ base: '#e0dbd0', repeat: 1 }), {
        pos: [range(rnd, P.x0 + 1, P.x1 - 1), top + 0.014, range(rnd, P.z0 + 0.9, P.z1 - 0.6)],
        rot: [0, range(rnd, -0.4, 0.4), 0],
        cast: false,
        receive: true,
      }),
    );
  }

  /* ---------- 経年：水洟・苔・油・落書き ---------- */
  for (let i = 0; i < 12; i++) {
    weather(g, {
      w: range(rnd, 0.4, 1.6),
      h: range(rnd, 0.3, 1.1),
      pos: [range(rnd, P.x0 + 0.4, P.x1 - 0.4), top + 0.006, range(rnd, P.z0 + 0.3, P.z1 - 0.3)],
      rot: [-Math.PI / 2, 0, range(rnd, -0.6, 0.6)],
      kind: ['dirt', 'moss', 'chip', 'scratch'][i % 4],
      color: ['#5d564c', '#6d8152', '#9a958a', '#7a746a'][i % 4],
      opacity: range(rnd, 0.1, 0.28),
      seed: 900 + i,
      density: 1.2,
    });
  }
  // 擁壁の水洟
  for (let i = 0; i < 14; i++) {
    weather(g, {
      w: 0.16,
      h: h * range(rnd, 0.5, 0.98),
      pos: [range(rnd, P.x0 + 0.5, P.x1 - 0.5), top - h * 0.45, P.z0 - 0.005],
      rot: [0, Math.PI, 0],
      kind: 'dirt',
      color: '#4f5a45',
      opacity: range(rnd, 0.14, 0.34),
      seed: 1200 + i,
      density: 0.8,
    });
  }

  /* ---------- ホーム上の敷石帯（上屋柱の基礎） ---------- */
  for (let i = 0; i < 6; i++) {
    const x = P.x0 + 1.4 + i * 3.1;
    if (x > P.x1 - 1) break;
    g.add(mesh(rbox(0.42, 0.05, 0.42, 0.03, 2), MAT.stone({ color: '#b8b2a6' }), { pos: [x, top + 0.026, P.z0 + 1.0], cast: true, receive: true }));
  }

  return finish(g, { outline: 'thin', minSize: 0.2 });
}

export default build;
