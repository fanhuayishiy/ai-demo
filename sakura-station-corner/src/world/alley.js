// 小巷：狭い路地・ブロック塀・行き止まり・側溝・生活感の詰め込み
import * as THREE from 'three';
import { grp, mesh, box, rbox, cyl, finish, rand, range, weather, decal } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, slab, wallX, wallZ, Y } from './common.js';
import { SEG } from './plan.js';

export function build(options = {}) {
  const g = grp('alley');
  const rnd = rand(options.seed ?? 616);
  const A = SEG.alley;
  const y = Y.walk - 0.02;

  /* ---------- 路盤と舗装（生活道路：アスファルト打ち継ぎ） ---------- */
  g.add(surface(A.x0, A.x1, A.z0, A.z1, y, MAT.asphalt({ tone: 0, repeat: 1 }), { tile: 1.5, name: 'alley-pave', segs: 3 }));
  g.add(slab(A.x0, A.x1, A.z0, A.z1, y - 0.006, 0.14, MAT.concrete({ base: '#9d988d', repeat: 1 }), { name: 'alley-base', cast: false }));
  // 打ち継ぎ・補修
  for (let i = 0; i < 6; i++) {
    g.add(mesh(box(A.x1 - A.x0 - 0.1, 0.008, 0.035), MAT.rubber('#3b3941'), { pos: [(A.x0 + A.x1) / 2, y + 0.006, A.z0 + 0.9 + i * 1.7], cast: false, receive: true }));
  }
  for (let i = 0; i < 4; i++) {
    g.add(mesh(rbox(range(rnd, 0.5, 1.1), 0.012, range(rnd, 0.4, 0.9), 0.04, 2), MAT.asphalt({ tone: 2, repeat: 1 }), { pos: [range(rnd, A.x0 + 0.4, A.x1 - 0.4), y + 0.008, range(rnd, A.z0 + 0.5, A.z1 - 0.5)], rot: [0, range(rnd, -0.5, 0.5), 0], cast: false, receive: true }));
  }

  /* ---------- 両側の塀（東：店舗裏、西：民家塀） ---------- */
  const wallMat = MAT.concrete({ base: PAL.wallPlaster, repeat: 1, cracked: true });
  const blockMat = MAT.concrete({ base: '#b3ada0', repeat: 1, joints: 3 });
  // 東側（店舗敷地際）：ブロック塀 + 金网
  g.add(wallZ(A.z0 + 0.1, A.z1 - 0.1, y, y + 1.15, A.x1 - 0.06, blockMat, { tile: 1.8, face: '-x', name: 'wall-east' }));
  g.add(wallZ(A.z0 + 0.1, A.z1 - 0.1, y + 1.15, y + 1.3, A.x1 - 0.06, MAT.concrete({ base: '#c7c1b4', repeat: 1 }), { tile: 1.2, face: '-x', name: 'wall-east-cap' }));
  // 西側（民家側）：塗装塀 + 植木が覗く
  g.add(wallZ(A.z0 + 0.3, A.z1 - 0.4, y, y + 1.45, A.x0 + 0.05, wallMat, { tile: 2.0, face: '+x', name: 'wall-west' }));
  g.add(wallZ(A.z0 + 0.3, A.z1 - 0.4, y + 1.45, y + 1.56, A.x0 + 0.05, MAT.roofTile({ base: '#7a6f63', repeat: 1 }), { tile: 1.0, face: '+x', name: 'wall-west-cap' }));
  // 塀の基礎・水切
  g.add(wallZ(A.z0 + 0.3, A.z1 - 0.4, y, y + 0.22, A.x0 + 0.03, MAT.concrete({ base: '#8f8a7e', repeat: 1 }), { tile: 1.0, face: '+x', name: 'wall-west-foundation' }));

  /* ---------- 突き当たり（行き止まり） ---------- */
  const endZ = A.z0;
  g.add(wallX(A.x0, A.x1, y, y + 2.0, endZ, MAT.concrete({ base: '#c2bcac', repeat: 1, cracked: true }), { tile: 1.6, face: '+z', name: 'dead-end-wall' }));
  // 「行き止まり」看板
  const plate = mesh(rbox(0.62, 0.34, 0.03, 0.02, 2), MAT.paint('#e8e2d2', { map: TEX.signboard({ text: '行き止まり', bg: '#e8e2d2', fg: '#3b4a5a', sub: 'ひきかえ注意', size: 150 }), spec: 0.16 }), { pos: [(A.x0 + A.x1) / 2, y + 1.28, endZ + 0.06], cast: true, receive: true });
  g.add(plate);
  // 注意鏡（丸い凸面鏡）
  const mirror = grp('mirror', { pos: [A.x1 - 0.24, y + 1.5, endZ + 0.5] });
  mirror.add(mesh(cyl(0.24, 0.24, 0.05, 22), MAT.chrome({ spec: 0.9 }), { rot: [Math.PI / 2, 0, 0], cast: true, receive: true }));
  mirror.add(mesh(rbox(0.54, 0.54, 0.04, 0.04, 2), MAT.paint('#d8d2c4', { spec: 0.14 }), { pos: [0, 0, -0.04], rot: [0, 0, 0.78], cast: true, receive: true }));
  mirror.add(mesh(box(0.05, 0.9, 0.05), MAT.galvanized(), { pos: [0.06, -0.62, -0.02], cast: true, receive: true }));
  g.add(mirror);

  /* ---------- 生活感：電線引き込み・給水管・換気・物置 ---------- */
  // 店舗裏の排気口と配管（路地側）
  for (let i = 0; i < 3; i++) {
    g.add(
      mesh(cyl(0.055, 0.055, 0.5, 12), MAT.galvanized({ spec: 0.3 }), {
        pos: [A.x1 - 0.14, y + 1.6 - i * 0.5, A.z0 + 1.4 + i * 1.9],
        rot: [0, 0, Math.PI / 2],
        cast: true,
        receive: true,
      }),
    );
    g.add(mesh(cyl(0.075, 0.075, 0.06, 12), MAT.darkIron(), { pos: [A.x1 - 0.4, y + 1.6 - i * 0.5, A.z0 + 1.4 + i * 1.9], rot: [0, 0, Math.PI / 2], cast: true, receive: true }));
  }
  // 物置（板金箱）
  const shed = grp('shed', { pos: [A.x0 + 0.62, y, A.z0 + 1.0] });
  shed.add(mesh(rbox(0.9, 0.95, 1.15, 0.02, 2), MAT.galvanized({ spec: 0.26, worn: 0.7 }), { pos: [0, 0.48, 0], cast: true, receive: true }));
  shed.add(mesh(box(0.86, 0.02, 1.1), MAT.galvanized(), { pos: [0, 0.99, 0], cast: true, receive: true }));
  shed.add(mesh(box(0.3, 0.62, 0.02), MAT.paint('#7a6a58', { spec: 0.1 }), { pos: [0.28, 0.34, 0.58], cast: false, receive: true }));
  weather(shed, { w: 0.9, h: 0.9, pos: [0, 0.3, 0.6], rot: [0, 0, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.34, seed: 12, density: 1.6, count: 2, spread: 0.5 });
  g.add(shed);
  // 植木鉢・ジョウロ・物干し台
  for (let i = 0; i < 4; i++) {
    const x = A.x0 + 0.24 + (i % 2) * 0.34;
    const z = A.z0 + 2.2 + i * 1.15;
    g.add(
      mesh(cyl(0.14, 0.11, 0.2, 14), MAT.paint('#b06a4a', { map: TEX.concrete({ base: '#b06a4a', repeat: 1 }).map, spec: 0.14 }), {
        pos: [x, y + 0.1, z],
        cast: true,
        receive: true,
      }),
    );
    g.add(mesh(cyl(0.12, 0.12, 0.02, 14), MAT.paint('#4a3a2c', { spec: 0.04 }), { pos: [x, y + 0.19, z], cast: false, receive: true }));
  }
  // 物干し竿（2 本柱）
  const hoshi = grp('hoshi', { pos: [A.x0 + 0.5, y, A.z0 + 5.2] });
  for (const dz of [-0.9, 0.9]) {
    hoshi.add(mesh(cyl(0.03, 0.035, 1.5, 10), MAT.galvanized(), { pos: [0, 0.75, dz], cast: true, receive: true }));
    hoshi.add(mesh(cyl(0.022, 0.022, 1.95, 8), MAT.metalPaint('#c8c2b4'), { pos: [0, 1.48, 0], rot: [Math.PI / 2, 0, 0], cast: true, receive: true }));
  }
  g.add(hoshi);

  /* ---------- 経年：落書き・苔・泥・猫よけトゲ（人物はいない） ---------- */
  for (let i = 0; i < 10; i++) {
    weather(g, {
      w: range(rnd, 0.4, 1.3),
      h: range(rnd, 0.5, 1.6),
      pos: [A.x1 - 0.075, y + range(rnd, 0.2, 1.1), range(rnd, A.z0 + 0.4, A.z1 - 0.4)],
      rot: [0, -Math.PI / 2, 0],
      kind: i % 3 === 0 ? 'moss' : i % 3 === 1 ? 'dirt' : 'scratch',
      color: i % 3 === 0 ? '#6d8152' : i % 3 === 1 ? '#5d564c' : '#8b857a',
      opacity: range(rnd, 0.14, 0.3),
      seed: 3000 + i,
      density: 1.2,
    });
    weather(g, {
      w: range(rnd, 0.4, 1.2),
      h: range(rnd, 0.5, 1.4),
      pos: [A.x0 + 0.075, y + range(rnd, 0.15, 1.2), range(rnd, A.z0 + 0.5, A.z1 - 0.5)],
      rot: [0, Math.PI / 2, 0],
      kind: i % 2 ? 'dirt' : 'moss',
      color: i % 2 ? '#5b5045' : '#67804f',
      opacity: range(rnd, 0.14, 0.3),
      seed: 3200 + i,
      density: 1.2,
    });
  }
  // 落書き（スプレー）
  decal(g, {
    map: TEX.wear({ kind: 'scratch', color: '#b8543f', seed: 7, density: 1.4 }),
    w: 0.7,
    h: 0.4,
    pos: [A.x1 - 0.078, y + 0.72, A.z0 + 3.1],
    rot: [0, -Math.PI / 2, 0],
    opacity: 0.5,
  });

  return finish(g, { outline: 'thin', minSize: 0.16 });
}

export default build;
