// 横断歩道・停止線・安全導流帯
import * as THREE from 'three';
import { grp, mesh, box, rbox, finish, rand, range } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, Y, insideClip, clipRect, clipRun } from './common.js';
import { CROSSWALK, SEG } from './plan.js';

/**
 * @param {object} o { dir:'ns'|'ew', seg, bars, width, worn }
 * 横断歩道を車道上に打つ（各本は独立 Mesh、摩耗は頂点色でなく別メッシュで表現）
 */
function crosswalk(g, { x0, x1, z0, z1, axis, bars = 11, worn = 0.5, seed = 1 }) {
  // 先按取景框截断整条横断歩道的落位矩形：南北向的条带是按全宽一根箱铺过去的，
  // 只判每条的中心会把 1.4 m 长的斑马线条铺到台座外。
  const c = clipRect(x0, x1, z0, z1);
  if (!c) return g;
  [x0, x1, z0, z1] = c;
  const rnd = rand(seed);
  const len = axis === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  const wide = axis === 'x' ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
  const barW = (wide * 0.62) / bars;
  const gap = (wide * 0.38) / (bars - 1);
  const matNew = MAT.marking('#f7f4ec', { repeat: 1, spec: 0.16, specPower: 16 });
  const matWorn = MAT.marking('#ddd7c9', { repeat: 1, spec: 0.1, map: TEX.concrete({ base: '#ddd7c9', repeat: 1 }).map });
  const total = bars * barW + (bars - 1) * gap;
  let off = -total / 2;
  for (let i = 0; i < bars; i++) {
    const w = barW * range(rnd, 0.97, 1.03);
    const mat = rnd() < worn ? matWorn : matNew;
    const lenJ = len * range(rnd, 0.985, 1.0);
    const m =
      axis === 'x'
        ? mesh(box(lenJ, 0.008, w), mat, { cast: false, receive: true })
        : mesh(box(w, 0.008, lenJ), mat, { cast: false, receive: true });
    if (axis === 'x') m.position.set((x0 + x1) / 2, Y.road + 0.009, (z0 + z1) / 2 + off + w / 2);
    else m.position.set((x0 + x1) / 2 + off + w / 2, Y.road + 0.009, (z0 + z1) / 2);
    m.rotation.y = range(rnd, -0.004, 0.004);
    g.add(m);
    off += w + gap;
  }
  // 端の欠け・タイヤ擦れ
  for (let i = 0; i < 5; i++) {
    const t = range(rnd, -0.45, 0.45);
    const sc = mesh(rbox(len * range(rnd, 0.06, 0.16), 0.006, wide * range(rnd, 0.05, 0.14), 0.05, 2), MAT.asphalt({ tone: 2, repeat: 1 }), {
      pos: [axis === 'x' ? (x0 + x1) / 2 + range(rnd, -0.2, 0.2) : (x0 + x1) / 2 + t * wide, Y.road + 0.0075, axis === 'x' ? (z0 + z1) / 2 + t * wide : (z0 + z1) / 2 + range(rnd, -0.2, 0.2) * len],
      rot: [0, range(rnd, -0.4, 0.4), 0],
      cast: false,
      receive: true,
    });
    g.add(sc);
  }
}

export function build(options = {}) {
  const g = grp('crosswalk');
  const rnd = rand(options.seed ?? 909);

  // ① 東西道路の横断歩道（店舗前 → 角地）
  crosswalk(g, { ...CROSSWALK.ew, axis: 'z', bars: 11, worn: 0.55, seed: 11 });
  // ② 踏切手前（南北道北側）
  crosswalk(g, { ...CROSSWALK.nsNorth, axis: 'x', bars: 9, worn: 0.42, seed: 22 });
  // ③ 南側アプローチ
  crosswalk(g, { ...CROSSWALK.southApproach, axis: 'z', bars: 9, worn: 0.6, seed: 33 });

  // 停止線（横断歩道の手前、白実線）
  const stopMat = MAT.marking('#f3efe4', { repeat: 1 });
  const nsCx = (SEG.roadNS.x0 + SEG.roadNS.x1) / 2;
  for (const s of [
    { axis: 'x', from: nsCx - 2.8, to: nsCx + 2.8, at: CROSSWALK.nsNorth.z1 + 0.5 },
    { axis: 'z', from: SEG.roadEW.z0 + 0.2, to: SEG.roadEW.z1 - 0.2, at: CROSSWALK.ew.x1 + 0.42 },
  ]) {
    // 停止線も车道を横断する一本の長い箱：枠内で切り落とさないと台座の外に伸びる
    const run = clipRun(s.axis, s.from, s.to, s.at);
    if (!run) continue;
    const len = run[1] - run[0], c = (run[0] + run[1]) / 2;
    g.add(
      s.axis === 'x'
        ? mesh(box(len, 0.008, 0.16), stopMat, { pos: [c, Y.road + 0.009, s.at], cast: false, receive: true })
        : mesh(box(0.16, 0.008, len), stopMat, { pos: [s.at, Y.road + 0.009, c], cast: false, receive: true }),
    );
  }

  // 安全導流帯（黄色のハッチ、角地側）
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const hx = 4.1 + t * 1.5, hz = 6.4 - t * 0.5;
    if (!insideClip(hx, hz)) continue;
    g.add(
      mesh(box(0.1, 0.007, 1.5 + t * 1.2), MAT.marking('#eac85f', { repeat: 1 }), {
        pos: [hx, Y.road + 0.0085, hz],
        rot: [0, 0.42, 0],
        cast: false,
        receive: true,
      }),
    );
  }

  // 踏切内の黄色線（歩行者誘導）
  for (let i = 0; i < 5; i++) {
    const cx = SEG.crossing.x0 + 0.5 + i * 0.28, cz = SEG.crossing.z1 + 0.6;
    if (!insideClip(cx, cz)) continue;
    g.add(
      mesh(box(0.09, 0.007, 0.62), MAT.marking('#eac85f', { repeat: 1 }), {
        pos: [cx, Y.road + 0.0085, cz],
        cast: false,
        receive: true,
      }),
    );
  }

  return finish(g, { outline: false });
}

export default build;
