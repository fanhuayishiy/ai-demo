// 丁字路口柏油路网：車道・縁石・路面标线・補修跡
import * as THREE from 'three';
import { grp, mesh, box, rbox, plane, finish, rand, range, weather, decal, inst } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { slab, surface, wallX, wallZ, curbRun, repeats, Y, insideClip, clipRun } from './common.js';
import { PLOT, SEG, STORE, CROSSWALK } from './plan.js';

export function build(options = {}) {
  const rnd = rand(options.seed ?? 4242);
  const g = grp('road-network');

  const asphalt = MAT.asphalt({ tone: 1, repeat: 1 });
  const asphaltOld = MAT.asphalt({ tone: 0, repeat: 1 });
  const marking = MAT.marking(PAL.marking, { repeat: 1 });
  const markingY = MAT.marking(PAL.markingYellow, { repeat: 1 });
  const curbMat = MAT.concrete({ base: PAL.curb, repeat: 1, joints: 3 });

  /* ---------- 車道面 ---------- */
  // junction / crossing-appr と roadNS は同じ y=0.0 で重なる（丁字路の平坦部は
  // 南北道の範囲をそのまま含む）。同一平面上で 2 枚の舗装が競合して
  // ファイティング → 路面に黒い多角形の破れが出るので、重ねる分だけ 4 mm 盛る。
  const roads = [
    ['ns', SEG.roadNS, asphalt, 0],
    ['ew', SEG.roadEW, asphaltOld, 0],
    ['junction', SEG.junction, asphalt, 0.004],
    ['crossing-appr', { x0: SEG.crossing.x0, x1: SEG.crossing.x1, z0: SEG.crossing.z1, z1: SEG.crossing.z1 + 2.2 }, asphalt, 0.004],
  ];
  for (const [name, s, m, dy] of roads) {
    g.add(surface(s.x0, s.x1, s.z0, s.z1, Y.road + dy, m, { tile: 2.2, name: 'asphalt-' + name, segs: 3 }));
    if (dy > 0) continue;   // 重ねる区間の路盤は下層が既に持っている
    // 車道の路盤厚（側面断面用）
    g.add(slab(s.x0, s.x1, s.z0, s.z1, Y.road - 0.005, 0.2, m, { name: 'road-base-' + name, cast: false }));
  }

  /* ---------- 補修パッチ・アスファルト継ぎ目 ---------- */
  // 補修パッチ是「刨掉一层再重新铺平」，不是往路面上搁砖。三处改掉的毛病：
  // ① 原来是有 14 mm 厚度的圆角盒：侧壁在低机位下描出一条边、还会投影，
  //    于是路面读起来像掉了几块深灰瓷砖（顶视 `shots/audit/top.png` 尤其明显）。
  //    改成贴地的平面，没有侧壁也没有影子。
  // ② 原来 yaw 随机 ±0.5 rad，矩形像随手撒的纸片；真实切割会顺着车行道方向。
  // ③ 原来不看路面标线，补丁会直接压在斑马线上，两边都不像真的。
  const patchAvoid = [CROSSWALK.ew, CROSSWALK.nsNorth, CROSSWALK.southApproach, SEG.crossing];
  const onMarking = (x, z, w, d) => patchAvoid.some((r) =>
    Math.abs(x - (r.x0 + r.x1) / 2) < (r.x1 - r.x0 + w) / 2 &&
    Math.abs(z - (r.z0 + r.z1) / 2) < (r.z1 - r.z0 + d) / 2);
  const patchMat = [MAT.asphalt({ tone: 2, repeat: 1 }), MAT.asphalt({ tone: 0, repeat: 1 })];
  for (let i = 0; i < 16; i++) {
    const onNS = rnd() > 0.45;
    const x = onNS ? range(rnd, SEG.roadNS.x0 + 0.4, SEG.roadNS.x1 - 0.4) : range(rnd, -18, 3.4);
    const z = onNS ? range(rnd, SEG.roadNS.z0, 17.4) : range(rnd, SEG.roadEW.z0 + 0.3, SEG.roadEW.z1 - 0.3);
    const w = range(rnd, 0.5, 2.4), d = range(rnd, 0.4, 1.6);
    // 補修パッチは中心だけでなく四つ隅まで見る：枠をまたぐ_patch は台座の外に一枚はみ出す
    if (!insideClip(x - w / 2, z - d / 2) || !insideClip(x + w / 2, z + d / 2)) continue;
    if (onMarking(x, z, w, d)) continue;
    const p = mesh(plane(w, d), patchMat[i % 2], {
      pos: [x, Y.road + 0.008, z],
      rot: [-Math.PI / 2, 0, (onNS ? Math.PI / 2 : 0) + range(rnd, -0.06, 0.06)],
      cast: false,
      receive: true,
      name: 'asphalt-patch',
    });
    p.userData.noOutline = true;
    g.add(p);
  }
  // 継ぎ目（_cut-back アスファルトの溝）
  for (const j of [
    { axis: 'x', at: 9.1, from: -18, to: 3.4 },
    { axis: 'x', at: 11.9, from: -18, to: 3.4 },
    { axis: 'z', at: 5.0, from: SEG.roadNS.z0 + 0.3, to: 17.4 },
    { axis: 'z', at: 7.9, from: 14.0, to: 17.4 },
  ]) {
    const run = clipRun(j.axis, j.from, j.to, j.at);
    if (!run) continue;
    const len = run[1] - run[0], c = (run[0] + run[1]) / 2;
    g.add(
      j.axis === 'x'
        ? mesh(box(len, 0.008, 0.05), MAT.rubber('#3b3941'), { pos: [c, Y.road + 0.004, j.at], cast: false, receive: true })
        : mesh(box(0.05, 0.008, len), MAT.rubber('#3b3941'), { pos: [j.at, Y.road + 0.004, c], cast: false, receive: true }),
    );
  }

  /* ---------- 縁石 ---------- */
  // 東西道路：北縁（店舗前歩道際）と南縁
  g.add(curbRun('x', -18, 3.6, SEG.roadEW.z0 - 0.09, curbMat, { y: Y.walk, h: Y.walk - Y.road + 0.03 }));
  g.add(curbRun('x', -18, 3.6, SEG.roadEW.z1 + 0.09, curbMat, { y: Y.walk, h: Y.walk - Y.road + 0.03 }));
  // 南北道路：西縁・東縁
  g.add(curbRun('z', 13.4, SEG.roadNS.z0, SEG.roadNS.x0 - 0.09, curbMat, { y: Y.walk, h: Y.walk - Y.road + 0.03 }));
  g.add(curbRun('z', 13.4, SEG.roadNS.z0, SEG.roadNS.x1 + 0.09, curbMat, { y: Y.walk, h: Y.walk - Y.road + 0.03 }));
  // 丁字路角のラウンド縁石
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.5 + (i / 6) * 0.5);
    const bx = 3.6 + 0.62 + Math.cos(a) * 0.62;
    const bz = 13.4 + 0.62 + Math.sin(a) * 0.62;
    if (!insideClip(bx, bz)) continue;
    g.add(
      mesh(rbox(0.42, Y.walk + 0.03, 0.17, 0.02, 2), curbMat, {
        pos: [bx, (Y.walk - 0.02) / 2 - 0.02, bz],
        rot: [0, -a + Math.PI / 2, 0],
        cast: true,
        receive: true,
      }),
    );
  }

  /* ---------- 路面标线 ---------- */
  // センターライン（西東道、色褪せた破線）
  for (let i = 0; i < 11; i++) {
    const x = -17.4 + i * 1.95;
    const mz = 10.2 + range(rnd, -0.02, 0.02);
    if (!insideClip(x, mz)) continue;
    g.add(
      mesh(box(1.05, 0.006, 0.11), MAT.marking('#efe9dc', { repeat: 1 }), {
        pos: [x, Y.road + 0.006, mz],
        rot: [0, 0, 0],
        cast: false,
        receive: true,
      }),
    );
  }
  // 路側帯線（南北道、白実線）
  for (const x of [SEG.roadNS.x0 + 0.42, SEG.roadNS.x1 - 0.42]) {
    const run = clipRun('z', SEG.roadNS.z0 + 0.6, 17.4, x);
    if (!run) continue;
    g.add(
      mesh(box(0.11, 0.006, run[1] - run[0]), MAT.marking('#efe9dc', { repeat: 1 }), {
        pos: [x, Y.road + 0.006, (run[0] + run[1]) / 2],
        cast: false,
        receive: true,
      }),
    );
  }
  // 車道外側線（東西道南側）
  {
    const run = clipRun('x', -18.2, 3.0, SEG.roadEW.z1 - 0.45);
    if (run) {
      g.add(
        mesh(box(run[1] - run[0], 0.006, 0.1), MAT.marking('#e8e2d4', { repeat: 1 }), {
          pos: [(run[0] + run[1]) / 2, Y.road + 0.006, SEG.roadEW.z1 - 0.45],
          cast: false,
          receive: true,
        }),
      );
    }
  }
  // 黄色の安全地帯線（学校・駅への動線、色褪せ）
  for (let i = 0; i < 9; i++) {
    const x = -2.2 + i * 0.52;
    const z = SEG.roadEW.z0 + 0.5;
    if (!insideClip(x, z)) continue;
    g.add(
      mesh(box(0.42, 0.006, 0.1), MAT.marking('#e9c25c', { repeat: 1 }), {
        pos: [x, Y.road + 0.006, z],
        cast: false,
        receive: true,
      }),
    );
  }
  // 「ゆずりあい」風ひらがな路面文字（白・薄れかけ）
  const moji = ['ゆ', 'ず', 'り', 'あ', 'い'];
  for (let i = 0; i < moji.length; i++) {
    const mx = -13.6 + i * 0.72;
    if (!insideClip(mx, 11.7)) continue;
    const cv = TEX.signboard({ text: moji[i], bg: 'rgba(0,0,0,0)', fg: 'rgba(246,243,236,0.86)', size: 200 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: cv, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(mx, Y.road + 0.008, 11.7);
    m.renderOrder = 4;
    g.add(m);
  }

  /* ---------- 経年：汚れ・油染み・落書き除去 ---------- */
  for (let i = 0; i < 10; i++) {
    const wx = range(rnd, -16, 8.6), wz = range(rnd, -11, 17);
    if (!insideClip(wx, wz)) continue;
    weather(g, {
      w: range(rnd, 0.6, 2.2),
      h: range(rnd, 0.5, 1.6),
      pos: [wx, Y.road + 0.007, wz],
      rot: [-Math.PI / 2, 0, range(rnd, -0.6, 0.6)],
      kind: 'dirt',
      color: rnd() > 0.5 ? '#2b2a30' : '#5b4a3a',
      opacity: range(rnd, 0.12, 0.3),
      seed: 400 + i,
      density: 1.2,
    });
  }

  return finish(g, { outline: false });
}

export default build;
