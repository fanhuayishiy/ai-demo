// 単線軌道：路盤・砕石・スラブ枕木・レール・側溝・ケーブル配管・標識
import * as THREE from 'three';
import { grp, mesh, box, rbox, cyl, finish, rand, range, weather, inst } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, slab, wallX, Y, clipRun } from './common.js';
import { SEG, RAIL, PLOT } from './plan.js';

export function build(options = {}) {
  const g = grp('station-track');
  const rnd = rand(options.seed ?? 5150);
  const T = { ...SEG.track };
  const zc = RAIL.centerZ;
  const half = RAIL.gauge / 2;
  // x 区间跟着取景框截断：レール・側溝・盖板都是「一根长箱铺满整条轨道带」，
  // 中心落在框内不代表箱体落在框内，pruneToClip 拦不住这类件。
  const run = clipRun('x', T.x0, T.x1, zc);
  if (!run) return finish(g, { outline: 'thin', minSize: 0.1 });
  T.x0 = run[0];
  T.x1 = run[1];
  const x0 = T.x0, x1 = T.x1;

  /* ---------- 路盤（砕石 + 砂利層） ---------- */
  g.add(surface(x0, x1, T.z0 + 0.05, T.z1 - 0.05, T.y, MAT.ballast({ repeat: 1 }), { tile: 1.3, name: 'ballast', segs: 4 }));
  // 路肩の盛土（線路際の外側へ広がる砕石）
  for (const [zz, w] of [[T.z0 - 0.1, 0.5], [T.z1 + 0.1, 0.42]]) {
    g.add(surface(x0, x1, zz - w / 2, zz + w / 2, T.y - 0.01, MAT.ballast({ repeat: 1 }), { tile: 1.1, name: 'ballast-shoulder' }));
  }
  // 防草シート（敷石帯、緑がかった黒）
  g.add(
    surface(x0, x1, T.z1 - 0.02, T.z1 + 0.34, T.y + 0.004, MAT.paint('#3f4a3a', { map: TEX.frost({ repeat: 1 }).map, spec: 0.02, shadowAmt: 0.98, steps: 2 }), {
      tile: 2.2,
      name: 'weed-sheet',
    }),
  );

  /* ---------- スラブ枕木（1 本ずつ独立、微差） ---------- */
  const sleeperMat = MAT.concrete({ base: '#b6b1a6', repeat: 1 });
  const n = Math.floor((x1 - x0) / RAIL.sleeperPitch);
  for (let i = 0; i <= n; i++) {
    const x = x0 + 0.4 + i * RAIL.sleeperPitch;
    if (x > x1 - 0.2) break;
    const tilt = range(rnd, -0.006, 0.006);
    const s = mesh(rbox(0.21, 0.14, 2.5, 0.014, 2), sleeperMat, {
      pos: [x + range(rnd, -0.012, 0.012), T.y + 0.055, zc + range(rnd, -0.014, 0.014)],
      rot: [tilt, range(rnd, -0.008, 0.008), 0],
      cast: true,
      receive: true,
    });
    g.add(s);
    // 締結金具（clip）2 個
    for (const dz of [-half, half]) {
      g.add(
        mesh(box(0.16, 0.026, 0.1), MAT.darkIron({ spec: 0.34 }), {
          pos: [s.position.x, T.y + 0.132, zc + dz],
          rot: [0, range(rnd, -0.05, 0.05), 0],
          cast: false,
          receive: true,
        }),
      );
    }
  }

  /* ---------- レール（頭・腹・座の複合断面を積層） ---------- */
  const railMat = MAT.metal('#9a958d', { dir: 'h', worn: 0.5, repeat: 1, spec: 0.72, specPower: 150, specCut: 0.1 });
  const railLen = x1 - x0;
  for (const dz of [-half, half]) {
    const z = zc + dz;
    // 座
    g.add(mesh(box(railLen, 0.028, 0.13), railMat, { pos: [(x0 + x1) / 2, T.y + 0.138, z], cast: true, receive: true }));
    // 腹
    g.add(mesh(box(railLen, 0.062, 0.036), railMat, { pos: [(x0 + x1) / 2, T.y + 0.183, z], cast: true, receive: true }));
    // 頭（磨耗した光沢面）
    g.add(mesh(rbox(railLen, 0.042, 0.072, 0.012, 2), MAT.metal('#b3aea6', { dir: 'h', repeat: 1, spec: 0.9, specPower: 240, specCut: 0.06 }), { pos: [(x0 + x1) / 2, RAIL.railTop - 0.021 + 0.042, z], cast: true, receive: true }));
    // 継ぎ目（ガス圧接跡・絶縁継ぎ目）
    for (let i = 0; i < 5; i++) {
      const x = x0 + 2.2 + i * 4.4 + range(rnd, -0.4, 0.4);
      if (x > x1 - 0.5) break;
      g.add(mesh(box(0.03, 0.1, 0.14), MAT.darkIron({ spec: 0.2 }), { pos: [x, T.y + 0.17, z], cast: false, receive: true }));
    }
    // レール踵の錆
    weather(g, {
      w: railLen * 0.9,
      h: 0.16,
      pos: [(x0 + x1) / 2, T.y + 0.13, z],
      rot: [-Math.PI / 2, 0, 0],
      kind: 'rust',
      color: '#7c4a2b',
      opacity: 0.3,
      seed: 60 + dz * 100,
      density: 1.6,
    });
  }

  /* ---------- 軌道側溝（ホーム側 V 側溝 + 蓋） ---------- */
  const gutterZ = T.z1 + 0.5;
  g.add(mesh(box(x1 - x0, 0.06, 0.44), MAT.concrete({ base: '#a8a396', repeat: 1 }), { pos: [(x0 + x1) / 2, T.y - 0.03, gutterZ], cast: false, receive: true }));
  g.add(mesh(box(x1 - x0, 0.2, 0.06), MAT.concrete({ base: '#a8a396', repeat: 1 }), { pos: [(x0 + x1) / 2, T.y + 0.05, gutterZ + 0.22], cast: false, receive: true }));
  for (let i = 0; i < Math.floor((x1 - x0) / 1.98); i++) {
    const x = x0 + 0.9 + i * 1.98;
    g.add(mesh(rbox(1.9, 0.04, 0.46, 0.014, 2), MAT.galvanized({ spec: 0.24 }), { pos: [x, T.y + 0.1, gutterZ], rot: [0, range(rnd, -0.004, 0.004), 0], cast: true, receive: true }));
  }

  /* ---------- ケーブル配管・標識・転換器 ---------- */
  const pipeMat = MAT.galvanized({ spec: 0.3 });
  for (let i = 0; i < 9; i++) {
    const x = x0 + 1.2 + i * 2.6;
    if (x > x1 - 0.6) break;
    g.add(mesh(cyl(0.055, 0.055, 0.44, 12), pipeMat, { pos: [x, T.y + 0.2, T.z1 + 0.92], rot: [0, 0, Math.PI / 2], cast: true, receive: true }));
  }
  // 距離標（小さな白杭）
  for (let i = 0; i < 7; i++) {
    const x = x0 + 2 + i * 3.1;
    if (x > x1 - 0.5) break;
    g.add(mesh(box(0.06, 0.42, 0.06), MAT.paint('#e8e4d8', { map: TEX.concrete({ base: '#e8e4d8', repeat: 1 }).map, spec: 0.1 }), { pos: [x, T.y + 0.2, T.z0 - 0.34], rot: [range(rnd, -0.03, 0.03), 0, range(rnd, -0.04, 0.04)], cast: true, receive: true }));
    g.add(mesh(box(0.062, 0.09, 0.062), MAT.paint('#c8452f', { spec: 0.14 }), { pos: [x, T.y + 0.36, T.z0 - 0.34], cast: false, receive: true }));
  }
  // 小石・落ち葉・ゴミ（線路際の堆積）
  const pebble = MAT.stone({ color: '#9a9488' });
  const pg = grp('debris');
  for (let i = 0; i < 90; i++) {
    const x = range(rnd, x0 + 0.3, x1 - 0.3);
    const z = range(rnd, T.z0 + 0.1, T.z1 + 0.8);
    pg.add(
      mesh(rbox(range(rnd, 0.03, 0.1), 0.02, range(rnd, 0.03, 0.09), 0.01, 1), rnd() > 0.7 ? MAT.paper('#a8895c') : pebble, {
        pos: [x, T.y + 0.02, z],
        rot: [0, range(rnd, 0, 3.1), 0],
        cast: false,
        receive: true,
      }),
    );
  }
  g.add(pg);

  return finish(g, { outline: 'thin', minSize: 0.1 });
}

export default build;
