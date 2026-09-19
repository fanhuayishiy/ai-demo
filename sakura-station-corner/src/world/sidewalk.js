// 歩道：铺砖・点字ブロック・樹木枡・段差（勾配路）
import * as THREE from 'three';
import { grp, mesh, box, rbox, finish, rand, range, weather, insideClip, clipRun } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, slab, Y } from './common.js';
import { SEG, PLOT } from './plan.js';

const TILE = {
  paving: () => MAT.paving({ color: '#cbc5b8', mode: 'run', cells: 8, repeat: 1 }),
  pavingAlt: () => MAT.paving({ color: '#c2bcae', mode: 'block', cells: 6, repeat: 1 }),
  tactileDot: () => MAT.tactile({ kind: 'dot', repeat: 1 }),
  tactileLine: () => MAT.tactile({ kind: 'line', repeat: 1 }),
};

/** 点字ブロックの帯（1 枚 0.305m 角を並べる） */
function tactileRun(g, { axis, from, to, at, y, kind = 'dot', seed = 1, offset = 0 }) {
  const lat = at + offset;
  const cut = clipRun(axis, from, to, lat);
  if (!cut) return;
  [from, to] = cut;
  const rnd = rand(seed);
  const len = Math.abs(to - from);
  const n = Math.max(1, Math.round(len / 0.305));
  const dir = to > from ? 1 : -1;
  const mat = kind === 'dot' ? TILE.tactileDot() : TILE.tactileLine();
  for (let i = 0; i < n; i++) {
    const c = from + dir * (i + 0.5) * (len / n);
    const m =
      kind === 'line'
        ? mesh(box(axis === 'x' ? 0.3 : 0.29, 0.014, axis === 'x' ? 0.29 : 0.3), mat, { cast: false, receive: true })
        : mesh(box(0.29, 0.014, 0.29), mat, { cast: false, receive: true });
    if (axis === 'x') m.position.set(c, y + 0.007, lat);
    else m.position.set(lat, y + 0.007, c);
    m.rotation.y = range(rnd, -0.008, 0.008);
    // 一部は欠け・色褪せ
    if (rnd() > 0.86) m.material = MAT.tactile({ kind, repeat: 1, base: '#cfa944', sat: 0.8 });
    g.add(m);
  }
}

/** 街路樹枡（金网 or 砂利） */
function treePit(g, { x, z, y, r = 0.46, kind = 'gravel', seed = 5 }) {
  if (!insideClip(x, z)) return null;
  const rnd = rand(seed);
  const p = grp('tree-pit', { pos: [x, 0, z] });
  p.add(mesh(rbox(r * 2 + 0.16, 0.05, r * 2 + 0.16, 0.02, 2), MAT.concrete({ base: '#c3bdb0', repeat: 1 }), { pos: [0, y - 0.02, 0], cast: false, receive: true }));
  p.add(mesh(box(r * 2, 0.03, r * 2), MAT.paint('#5b4a3a', { map: TEX.concrete({ base: '#5b4a3a' }).map, spec: 0.02, shadowAmt: 0.98 }), { pos: [0, y + 0.005, 0], cast: false, receive: true }));
  if (kind === 'grate') {
    for (let i = 0; i < 7; i++) {
      p.add(mesh(box(r * 1.9, 0.02, 0.036), MAT.darkIron(), { pos: [0, y + 0.028, -r + 0.12 + i * ((r * 2 - 0.2) / 6)], cast: true, receive: true }));
    }
  } else {
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.283, rr = rnd() * r * 0.94;
      p.add(
        mesh(rbox(0.05 + rnd() * 0.05, 0.03, 0.05 + rnd() * 0.05, 0.012, 1), MAT.stone({ color: '#9c968a' }), {
          pos: [Math.cos(a) * rr, y + 0.02, Math.sin(a) * rr],
          rot: [0, rnd() * 3, 0],
          cast: false,
          receive: true,
        }),
      );
    }
  }
  // 落ち葉・泥はね
  weather(p, { w: r * 1.6, h: r * 1.6, pos: [0, y + 0.032, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b5a3f', opacity: 0.3, seed, density: 1.4 });
  g.add(p);
  return p;
}

export function build(options = {}) {
  const g = grp('sidewalk');
  const rnd = rand(options.seed ?? 808);
  const y = Y.walk;

  const zones = [
    ['front', SEG.walkFront, TILE.paving(), 1.55],
    ['south', SEG.walkSouth, TILE.pavingAlt(), 1.4],
    ['east', SEG.walkEast, TILE.pavingAlt(), 1.5],
    ['west', SEG.walkWest, TILE.paving(), 1.5],
  ];
  for (const [name, s, mat, tile] of zones) {
    g.add(surface(s.x0, s.x1, s.z0, s.z1, y, mat, { tile, name: 'paving-' + name, segs: 3 }));
    // 路盤（側面断面）
    g.add(slab(s.x0, s.x1, s.z0, s.z1, y - 0.006, 0.16, MAT.concrete({ base: '#a9a49a', repeat: 1 }), { name: 'walk-base-' + name, cast: false }));
  }

  /* ---------- 点字ブロック（店舗前帯は store/pavement-frontage 側が担当＝重複回避） ---------- */
  // 角から横断歩道へ（南北道西歩道）
  tactileRun(g, { axis: 'z', from: 5.0, to: 6.9, at: 2.62, y, kind: 'dot', seed: 32 });
  // 南北道西側の歩道（駅方面へ続く誘導線）
  tactileRun(g, { axis: 'z', from: -8.6, to: 5.0, at: 2.62, y, kind: 'line', seed: 42 });
  // 踏切前の横断誘導
  tactileRun(g, { axis: 'x', from: 4.1, to: 8.9, at: -8.9, y, kind: 'dot', seed: 44 });
  // 南側歩道
  tactileRun(g, { axis: 'x', from: -17, to: 3.0, at: 14.42, y, kind: 'dot', seed: 52 });
  // 広場から駅階段へ
  tactileRun(g, { axis: 'x', from: -1.9, to: 1.4, at: -8.9, y: Y.ground + 0.01, kind: 'line', seed: 54 });

  /* ---------- 段差（車椅子スロープ）：横断歩道両端 ---------- */
  for (const [x, z, ry] of [[1.0, 6.9, 0], [1.0, 13.5, 0], [3.5, -6.9, 90], [9.5, -6.9, 90]]) {
    if (!insideClip(x, z)) continue;
    const ramp = grp('ramp', { pos: [x, 0, z], rotY: ry });
    const geo = new THREE.BoxGeometry(1.5, 0.05, 0.9);
    const m = mesh(geo, TILE.paving(), { pos: [0, y - 0.055, 0], rot: [0.075, 0, 0], cast: false, receive: true });
    ramp.add(m);
    ramp.add(mesh(box(1.5, 0.1, 0.06), MAT.tactile({ kind: 'dot', repeat: 1 }), { pos: [0, y - 0.03, -0.44], cast: false, receive: true }));
    g.add(ramp);
  }

  /* ---------- 樹木枡 ---------- */
  const pits = [
    [-6.2, 15.3, 'gravel'],
    [5.2, 15.3, 'grate'],
    [-13.4, 6.35, 'gravel'],
    [10.6, 6.4, 'gravel'],
    [10.6, -2.2, 'grate'],
  ];
  pits.forEach(([x, z, k], i) => treePit(g, { x, z, y, r: 0.44, kind: k, seed: 100 + i }));

  /* ---------- 人孔・共用ボックス蓋 ---------- */
  const coverMat = MAT.concrete({ base: '#c6c0b4', repeat: 1, joints: 2 });
  for (let i = 0; i < 9; i++) {
    const x = range(rnd, -16, 10.6), z = range(rnd, -11, 16.5);
    if (Math.abs(x - -6.6) < 6 && z > -1 && z < 5) continue; // 店舗前を避ける
    if (!insideClip(x, z)) continue;
    g.add(
      mesh(rbox(range(rnd, 0.5, 1.0), 0.03, range(rnd, 0.4, 0.7), 0.02, 2), coverMat, {
        pos: [x, y + 0.004, z],
        rot: [0, range(rnd, -0.2, 0.2), 0],
        cast: false,
        receive: true,
      }),
    );
  }

  /* ---------- タイル目地の汚れ・経年 ---------- */
  for (let i = 0; i < 8; i++) {
    weather(g, {
      w: range(rnd, 1.4, 3.4),
      h: range(rnd, 1.0, 2.4),
      pos: [range(rnd, -14, 9), y + 0.004, range(rnd, -10, 16)],
      rot: [-Math.PI / 2, 0, range(rnd, -0.5, 0.5)],
      kind: rnd() > 0.6 ? 'moss' : 'dirt',
      color: rnd() > 0.6 ? '#6d7f4f' : '#5d564c',
      opacity: range(rnd, 0.1, 0.26),
      seed: 300 + i,
      density: 1.1,
    });
  }

  return finish(g, { outline: false });
}

export default build;
