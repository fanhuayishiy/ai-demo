// U 字側溝・集水桝・落し蓋（縁石際に沿って排水）
import * as THREE from 'three';
import { grp, mesh, box, rbox, finish, rand, range, insideClip, clipRun } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { Y } from './common.js';
import { SEG, PLOT } from './plan.js';

const IRON = () => MAT.darkIron({ spec: 0.3, sheen: 0.06 });

/**
 * 側溝 1 区間
 * @param axis 'x' = 沿 X 延伸（沟的长边沿 X）
 */
function drainRun(g, { axis, from, to, at, pitch = 0.74, y = Y.walk, w = 0.30, depth = 0.24, seed = 1, name = 'drain' }) {
  // 底版・側壁・暗渠是「一根长箱铺满整条街」，中心落在取景框内也会被 pruneToClip 留下，
  // 所以必须在源头截断区间（南北道那两条原本铺到 z=17.6，台座外悬了 4.7 m）。
  const cut = clipRun(axis, from, to, at);
  if (!cut) return null;
  [from, to] = cut;
  const rnd = rand(seed);
  const len = Math.abs(to - from);
  const n = Math.max(1, Math.round(len / pitch));
  const step = len / n;
  const dir = to > from ? 1 : -1;
  const conc = MAT.concrete({ base: '#bdb8ac', repeat: 1, joints: 2 });
  const voidMat = MAT.paint('#20211f', { spec: 0.02, shadowAmt: 1, steps: 2, dither: 0.004 });

  const run = grp(name);
  // 底版（連続）
  const floor = mesh(
    axis === 'x' ? box(len, 0.05, w) : box(w, 0.05, len),
    conc,
    { pos: [axis === 'x' ? from + (dir * len) / 2 : at, y - depth, axis === 'x' ? at : from + (dir * len) / 2], cast: false, receive: true },
  );
  run.add(floor);
  // 側壁 2 枚
  for (const s of [-1, 1]) {
    const off = (w / 2) * s;
    run.add(
      mesh(
        axis === 'x' ? box(len, depth, 0.045) : box(0.045, depth, len),
        conc,
        {
          pos: [
            axis === 'x' ? from + (dir * len) / 2 : at + off,
            y - depth / 2,
            axis === 'x' ? at + off : from + (dir * len) / 2,
          ],
          cast: false,
          receive: true,
        },
      ),
    );
  }
  // 暗渠（内部を黒く）
  run.add(
    mesh(
      axis === 'x' ? box(len - 0.02, depth - 0.05, w - 0.09) : box(w - 0.09, depth - 0.05, len - 0.02),
      voidMat,
      {
        pos: [axis === 'x' ? from + (dir * len) / 2 : at, y - depth / 2 - 0.02, axis === 'x' ? at : from + (dir * len) / 2],
        cast: false,
        receive: false,
      },
    ),
  );
  // 蓋（グレーチング）1 枚ずつ独立
  for (let i = 0; i < n; i++) {
    const c = from + dir * (i + 0.5) * step;
    const seg = grp('grate', { pos: axis === 'x' ? [c, y - 0.012, at] : [at, y - 0.012, c], rotY: axis === 'x' ? 0 : 90 });
    const fw = step - 0.03, fd = w - 0.02;
    seg.add(mesh(box(fw, 0.026, fd), IRON(), { name: 'grate-frame', cast: true, receive: true }));
    const bars = Math.max(3, Math.round(fw / 0.09));
    for (let b = 0; b < bars; b++) {
      const bx = -fw / 2 + ((b + 0.5) / bars) * fw;
      seg.add(mesh(box(0.014, 0.032, fd - 0.05), IRON(), { pos: [bx, 0.006, 0], cast: false, receive: true }));
    }
    // 錆・泥・落ち葉
    if (rnd() > 0.55) {
      seg.add(
        mesh(new THREE.PlaneGeometry(fw * range(rnd, 0.4, 0.95), fd * 1.05), MAT.decal({ map: TEX.wear({ kind: 'rust', color: '#7d4a2c', seed: 10 + i }), opacity: range(rnd, 0.2, 0.5), order: 1 }), {
          pos: [range(rnd, -0.05, 0.05), 0.021, 0],
          rot: [-Math.PI / 2, 0, 0],
          cast: false,
          receive: false,
        }),
      );
    }
    if (rnd() > 0.72) {
      const leaf = mesh(rbox(0.09, 0.006, 0.06, 0.02, 1), MAT.paper('#a8895c'), { pos: [range(rnd, -fw / 3, fw / 3), 0.026, range(rnd, -0.05, 0.05)], rot: [0, range(rnd, -1, 1), 0] });
      seg.add(leaf);
    }
    run.add(seg);
  }
  g.add(run);
  return run;
}

/** 集水桝（グレーチング + 段付き） */
function basin(g, { x, z, y = Y.walk, seed = 3 }) {
  if (!insideClip(x, z)) return null;
  const rnd = rand(seed);
  const b = grp('basin', { pos: [x, 0, z] });
  b.add(mesh(box(0.56, 0.05, 0.52), MAT.concrete({ base: '#b6b1a5', repeat: 1 }), { pos: [0, y - 0.30, 0], cast: false, receive: true }));
  b.add(mesh(box(0.5, 0.3, 0.46), MAT.paint('#1c1d1b', { spec: 0.02, steps: 2, shadowAmt: 1 }), { pos: [0, y - 0.16, 0], cast: false, receive: false }));
  const cover = grp('basin-cover', { pos: [0, y - 0.01, 0], rotY: range(rnd, -0.02, 0.02) });
  cover.add(mesh(rbox(0.54, 0.032, 0.5, 0.01, 2), IRON(), { cast: true, receive: true }));
  for (let i = 0; i < 4; i++) {
    cover.add(mesh(box(0.4, 0.036, 0.036), IRON(), { pos: [0, 0.008, -0.17 + i * 0.113], cast: false, receive: true }));
  }
  cover.add(mesh(box(0.1, 0.04, 0.05), IRON(), { pos: [0.19, 0.014, 0], cast: false, receive: true }));
  b.add(cover);
  g.add(b);
  return b;
}

export function build(options = {}) {
  const g = grp('drainage');

  // 側溝は縁石の「歩道側」に寄せる。以前は車道側に 0.26 m 入った位置に、
  // しかも歩道の高さ（y=0.15）で造っていたため、アスファルトの上に 15 cm 浮いた
  // 黒い板（暗渠 box）になっていた。
  // 店舗前歩道北側（車道際）
  drainRun(g, { axis: 'x', from: -18, to: 3.4, at: SEG.roadEW.z0 - 0.26, seed: 11, name: 'drain-ew-north' });
  // 道路南側歩道北側
  drainRun(g, { axis: 'x', from: -18, to: 3.4, at: SEG.roadEW.z1 + 0.26, seed: 21, name: 'drain-ew-south' });
  // 南北道西側
  drainRun(g, { axis: 'z', from: SEG.roadNS.z0 + 0.3, to: 17.6, at: SEG.roadNS.x0 - 0.26, seed: 31, name: 'drain-ns-west' });
  // 南北道東側
  drainRun(g, { axis: 'z', from: SEG.roadNS.z0 + 0.3, to: 17.6, at: SEG.roadNS.x1 + 0.26, seed: 41, name: 'drain-ns-east' });
  // 小巷
  drainRun(g, { axis: 'z', from: 6.5, to: -3.0, at: -14.05, pitch: 0.62, w: 0.24, depth: 0.2, y: Y.walk - 0.02, seed: 51, name: 'drain-alley' });

  basin(g, { x: -3.2, z: SEG.roadEW.z0 - 0.26, seed: 61 });
  basin(g, { x: 2.6, z: SEG.roadEW.z0 - 0.26, seed: 71 });
  basin(g, { x: -10.4, z: SEG.roadEW.z1 + 0.26, seed: 81 });
  basin(g, { x: SEG.roadNS.x0 - 0.26, z: -3.4, seed: 91 });
  basin(g, { x: SEG.roadNS.x1 + 0.26, z: 9.2, seed: 101 });

  return finish(g, { outline: 'thin', minSize: 0.06 });
}

export default build;
