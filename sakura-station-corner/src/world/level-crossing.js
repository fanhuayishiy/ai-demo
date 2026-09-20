// 踏切：全天候舗装・レール通過・遮断台基礎・警報機柱基礎・誘導・待避所
import * as THREE from 'three';
import { grp, mesh, box, rbox, cyl, finish, rand, range, weather } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { surface, slab, Y, clipRun, insideClip, roadWord } from './common.js';
import { SEG, RAIL, PLOT } from './plan.js';

export function build(options = {}) {
  const g = grp('level-crossing');
  const rnd = rand(options.seed ?? 3311);
  const C = { ...SEG.crossing };
  // 踏切面板是一根横贯车道的长箱：跟着取景框截断，否则东侧悬出台座
  const run = clipRun('x', C.x0, C.x1, (C.z0 + C.z1) / 2);
  if (!run) return finish(g, { outline: 'thin', minSize: 0.2 });
  C.x0 = run[0];
  C.x1 = run[1];
  const T = SEG.track;
  const zc = RAIL.centerZ;
  const half = RAIL.gauge / 2;

  /* ---------- 踏切床版（掘り込みを埋めて車道と面一） ---------- */
  g.add(slab(C.x0, C.x1, C.z0, C.z1, Y.road - 0.004, 0.42, MAT.concrete({ base: '#a5a096', repeat: 1 }), { name: 'slab-fill', cast: false }));
  g.add(surface(C.x0, C.x1, C.z0, C.z1, Y.road, MAT.asphalt({ tone: 1, repeat: 1 }), { tile: 2.0, name: 'crossing-asphalt', segs: 3 }));

  /* ---------- 踏切パネル（レール間の滑り止めコンクリート板） ---------- */
  // プレキャストの踏切板は 0.6 m 級。以前は 1.15 m 板 4 枚に 5 mm 盛りの
  // 滑り止め帯を 5 本ずつ載せていたが、「横に長い別色のリブ」を等間隔に積むと
  // ローアングルで波板屋根に読えてしまった（`shots/y1/rib-no-track.png` で
  // 軌道側を消しても瓦楞だけが残った＝犯人は level-crossing 側の帯）。
  // 目地は盛らない。板と板の隙間から下のアスファルトを見せて立てる。
  const panelMat = [
    MAT.concrete({ base: '#c4beb2', repeat: 1, joints: 2 }),
    MAT.concrete({ base: '#bbb5a9', repeat: 1, joints: 2 }),
    MAT.concrete({ base: '#c9c3b7', repeat: 1, joints: 2 }),
  ];
  const railsZ = [zc - half, zc + half];
  const zones = [
    [C.z0, railsZ[0] - 0.09],
    [railsZ[0] + 0.09, railsZ[1] - 0.09],
    [railsZ[1] + 0.09, C.z1],
  ];
  let pn = 0;
  for (const [z0, z1] of zones) {
    if (z1 - z0 < 0.05) continue;
    const n = Math.max(1, Math.round((z1 - z0) / 0.62));
    for (let i = 0; i < n; i++) {
      const zz = z0 + ((i + 0.5) / n) * (z1 - z0);
      const d = ((z1 - z0) / n) - 0.026;
      const p = mesh(rbox(C.x1 - C.x0 - 0.02, 0.03, d, 0.012, 2), panelMat[pn++ % panelMat.length], {
        pos: [(C.x0 + C.x1) / 2, Y.road + 0.012, zz],
        cast: false,
        receive: true,
        name: 'crossing-panel',
      });
      g.add(p);
      // 吊り下げ穴の樹脂プラグ。板の両端に「点」で立つのでリブには見えない。
      for (const sx of [-1, 1]) {
        g.add(mesh(cyl(0.028, 0.028, 0.003, 10), MAT.paint('#a59f94', { spec: 0.05, steps: 2 }), {
          pos: [(C.x0 + C.x1) / 2 + sx * (C.x1 - C.x0) * 0.33, Y.road + 0.0275, zz],
          cast: false,
          receive: true,
          name: 'lift-plug',
        }));
      }
    }
  }

  /* ---------- レール通過部（フランガ埋め・レール頭光沢） ---------- */
  const railMat = MAT.metal('#b3aea6', { dir: 'h', repeat: 1, spec: 0.9, specPower: 240, specCut: 0.06 });
  // 轨道沿 X 走、车道沿 Z 走，所以踏切里的这段续轨必须沿 X 摆（原来用 z 的跨度当长度、
  // 还转了 90°，结果是在 x=-14.7 的线路中间横插了一根 5 m 的钢轨 stub）。
  const rx0 = (C.x0 + C.x1) / 2;
  const rlen = C.x1 - C.x0;
  for (const z of railsZ) {
    g.add(mesh(box(rlen, 0.04, 0.072), railMat, { pos: [rx0, Y.road - 0.02 + 0.04, z], cast: true, receive: true }));
    g.add(mesh(box(rlen, 0.03, 0.14), MAT.darkIron({ spec: 0.2 }), { pos: [rx0, Y.road - 0.03, z], cast: false, receive: true }));
    // フランガ（レールとパネルの隙間）を黒く埋める
    for (const s of [-1, 1]) {
      g.add(mesh(box(rlen, 0.02, 0.05), MAT.rubber('#26282a'), { pos: [rx0, Y.road + 0.006, z + s * 0.062], cast: false, receive: true }));
    }
  }

  /* ---------- 遮断機台・警報機の基礎（据付ボルトまで） ---------- */
  const baseMat = MAT.concrete({ base: '#b9b4a8', repeat: 1 });
  const spots = [
    [C.x0 - 0.34, C.z1 - 0.05],
    [C.x1 + 0.34, C.z1 - 0.05],
    [C.x0 - 0.34, C.z0 + 0.1],
    [C.x1 + 0.34, C.z0 + 0.1],
  ];
  for (const [x, z] of spots) {
    if (!insideClip(x, z)) continue;
    const b = grp('barrier-base', { pos: [x, 0, z] });
    b.add(mesh(rbox(0.42, 0.1, 0.42, 0.02, 2), baseMat, { pos: [0, Y.road + 0.05, 0], cast: true, receive: true }));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.283 + 0.4;
      b.add(mesh(cyl(0.016, 0.016, 0.09, 8), MAT.stainless({ spec: 0.6 }), { pos: [Math.cos(a) * 0.13, Y.road + 0.13, Math.sin(a) * 0.13], cast: false, receive: true }));
    }
    b.add(mesh(cyl(0.075, 0.075, 0.05, 14), MAT.darkIron(), { pos: [0, Y.road + 0.12, 0], cast: false, receive: true }));
    weather(b, { w: 0.4, h: 0.4, pos: [0, Y.road + 0.104, 0], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.34, seed: Math.round(x * 100 + z * 37), density: 1.4 });
    g.add(b);
  }

  /* ---------- 踏切前停止線（白実線）＋「ふみきりまえ／いちじていし」 ---------- */
  // 以前はここへ黄色い破線を 2 列、crosswalk.js が同じ z に黄色い帯と歯を 5 本、
  // と二つのモジュールが別々に塗っていた。重なりが櫛の歯に見えていた原因
  // （`shots/y1/crossing-wide.png`）。黄色は全部やめて、実物どおり白の停止線にする。
  // 点字ブロックは車道の上に載せるものではないので sidewalk.js の歩道側へ移した。
  // 踏切手前の停止線は道路法上の必須標示。南側（+z）から踏切へ向かう車は
  // -z へ進むので、文字の「上」は -z 向き。
  {
    const lane = clipRun('x', SEG.roadNS.x0 + 0.42, SEG.roadNS.x1 - 0.42, C.z1 + 0.78);
    if (lane) {
      g.add(
        mesh(box(lane[1] - lane[0], 0.007, 0.34), MAT.marking('#f3efe4', { repeat: 1 }), {
          pos: [(lane[0] + lane[1]) / 2, Y.road + 0.009, C.z1 + 0.78],
          cast: false,
          receive: true,
          name: 'crossing-stop-line',
        }),
      );
    }
    const row = (chars, z, from) => roadWord(g, chars, { axis: 'x', at: z, from, step: 0.66, size: 0.56, y: Y.road + 0.011, travel: -1 });
    // 停止線の南側に二行。-z へ進む運転手は先に手前の一行を読むので、
    // 「ふみきりまえ」を南（+z 側）、「いちじていし」を停止線の際に置く。
    // 車線中心 x=6.5 に対し、5 文字は張出し 1.32、6 文字は 1.65。
    row('ふみきりまえ', C.z1 + 2.42, 6.5 - 1.32);
    row('いちじていし', C.z1 + 1.62, 6.5 - 1.65);
  }

  /* ---------- 側溝の踏切横断（蓋） ---------- */
  for (const z of [C.z0 + 0.02, C.z1 - 0.02]) {
    g.add(mesh(rbox(C.x1 - C.x0 - 0.1, 0.035, 0.34, 0.014, 2), MAT.galvanized({ spec: 0.26 }), { pos: [(C.x0 + C.x1) / 2, Y.road + 0.006, z], cast: false, receive: true }));
  }

  /* ---------- 経年：油・泥・砂・水たまり ---------- */
  for (let i = 0; i < 9; i++) {
    weather(g, {
      w: range(rnd, 0.7, 2.0),
      h: range(rnd, 0.5, 1.4),
      pos: [range(rnd, C.x0 + 0.5, C.x1 - 0.5), Y.road + 0.011, range(rnd, C.z0 + 0.3, C.z1 - 0.3)],
      rot: [-Math.PI / 2, 0, range(rnd, -0.6, 0.6)],
      kind: ['dirt', 'oil' === 'oil' ? 'dirt' : 'dirt', 'chip', 'scratch'][i % 4],
      color: ['#3d3a42', '#5b4a3a', '#8b857a', '#6d5f4c'][i % 4],
      opacity: range(rnd, 0.12, 0.3),
      seed: 2000 + i,
      density: 1.3,
    });
  }
  // 砂利のり上げ（線路側から）
  for (let i = 0; i < 40; i++) {
    g.add(
      mesh(rbox(range(rnd, 0.02, 0.07), 0.014, range(rnd, 0.02, 0.06), 0.008, 1), MAT.stone({ color: '#9a9488' }), {
        pos: [range(rnd, C.x0 + 0.2, C.x1 - 0.2), Y.road + 0.012, range(rnd, C.z0, C.z1)],
        rot: [0, range(rnd, 0, 3), 0],
        cast: false,
        receive: true,
      }),
    );
  }

  return finish(g, { outline: 'thin', minSize: 0.2 });
}

export default build;
