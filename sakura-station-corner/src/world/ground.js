// 地表分层：土台（diorama 断面）、草地、土间、軌道掘り込み、法面
import * as THREE from 'three';
import { grp, mesh, box, rbox, finish, rand, range, weather, decal } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { TEX } from '../core/textures.js';
import { PAL } from '../core/palette.js';
import { slab, surface, wallX, wallZ, curbRun, Y, retile, insideClip, clipRect, clipBounds } from './common.js';
import { PLOT, SEG, STORE, PLATE_TOP } from './plan.js';

// 土台の天端を地表面（y=0）より 4 mm 下げる。土芯・地層バンド・アスファルトが
// すべて y=0 に揃うと 3 枚が同一平面で競合し、路面全体に「櫛歯」状のジファイトが出る。
const SOIL_TOP = -0.004;
const SOIL_BOT = PLATE_TOP; // 土台底 = 底座顶

export function build(options = {}) {
  const rnd = rand(options.seed ?? 7001);
  const g = grp('ground');

  /* ---------- 土台（断面が見えるミニチュア芯） ---------- */
  const soilMat = MAT.paint('#8d7c66', {
    map: TEX.concrete({ base: '#8d7c66', repeat: 1 }).map,
    normalMap: TEX.concrete({ base: '#8d7c66', repeat: 1 }).normalMap,
    normalScaleX: 1.2,
    normalScaleY: 1.2,
    spec: 0.04,
    shadowAmt: 0.95,
    steps: 3,
    sat: 0.92,
  });
  // 必须走 slab()：这里原先是裸 box(PLOT 全幅 36×36)，不受裁剪框约束，
  // 于是底座已经收到 26.8×31.4 了，土芯还按 36×36 往外伸 4~5 m —— 看起来就是「地面没切掉」。
  g.add(slab(PLOT.min, PLOT.max, PLOT.min, PLOT.max, SOIL_TOP, SOIL_TOP - SOIL_BOT, soilMat, {
    name: 'soil-core',
    cast: true,
    receive: true,
  }));

  // 地層バンド（断面に砂利層・黒土層を読ませる）
  const bands = [
    { y0: -0.5, y1: -0.30, mat: MAT.paint('#6d5f4c', { map: TEX.concrete({ base: '#6d5f4c' }).map, spec: 0.03, shadowAmt: 0.98, steps: 2 }) },
    { y0: -0.3, y1: -0.12, mat: MAT.ballast({ repeat: 2 }) },
    { y0: -0.12, y1: -0.006, mat: MAT.paint('#5f6b45', { map: TEX.grass({ base: '#5f6b45', repeat: 3 }).map, spec: 0.03, shadowAmt: 0.98, steps: 2 }) },
  ];
  for (const b of bands) {
    const h = b.y1 - b.y0;
    const t = 0.012;
    g.add(
      slab(PLOT.min - 0.002, PLOT.max + 0.002, PLOT.min - 0.002, PLOT.max + 0.002, b.y1, h, b.mat, {
        name: 'stratum',
        cast: false,
        receive: true,
      }),
    );
  }

  /* ---------- 草地（未舗装帯） ---------- */
  const grass = MAT.grass({ repeat: 1, base: PAL.grass });
  const grassDark = MAT.grass({ repeat: 1, base: PAL.grassDark });
  const patches = [
    // 西側の空き地・民家庭まわり
    [-18, -14.4, -3.4, 5.6, grass, 1.9],
    [-18, -11.2, -9.4, -3.4, grass, 2.1],
    [-18, -18 + 0.01, 0, 0, grass, 1], // プレースホルダ（0 幅はスキップ）
    [1.6, 3.6, -3.4, 4.8, grassDark, 1.6],
    [11.4, 18, -12.2, 18, grass, 2.3],
    [-18, 18, 15.4, 18, grass, 2.0],
    [-11.3, 1.6, -1.2, -0.6, grassDark, 1.2],
  ];
  for (const [x0, x1, z0, z1, m, tile] of patches) {
    if (Math.abs(x1 - x0) < 0.05 || Math.abs(z1 - z0) < 0.05) continue;
    g.add(surface(x0, x1, z0, z1, Y.ground + 0.005, m, { tile, name: 'grass', segs: 2 }));
  }

  /* ---------- 軌道側の掘り込み側壁 ---------- */
  const trenchMat = MAT.concrete({ base: '#a8a49a', repeat: 1, cracked: true });
  // 掘り込み底
  g.add(surface(SEG.track.x0, SEG.track.x1, SEG.track.z0, SEG.track.z1, SEG.track.y, MAT.ballast({ repeat: 1.4 }), { tile: 1.4, name: 'trench-floor' }));
  // 南側（站台側）擁壁 L字
  g.add(wallX(SEG.track.x0, SEG.track.x1, SEG.track.y, Y.ground, SEG.track.z1, trenchMat, { tile: 2.4, face: '+z', name: 'trench-wall-s' }));
  // 北側法面
  g.add(wallX(SEG.track.x0, SEG.track.x1, SEG.track.y, Y.ground + 0.02, SEG.track.z0, trenchMat, { tile: 2.4, face: '-z', name: 'trench-wall-n' }));
  // 東端（踏切側）は踏切モジュールが塞ぐ
  g.add(wallZ(SEG.track.z0, SEG.track.z1, SEG.track.y, Y.ground, SEG.track.x0, trenchMat, { tile: 2.4, face: '-x', name: 'trench-wall-w' }));

  /* ---------- 北側のり面（里山へのrise） ---------- */
  const slopeLen = Math.abs(SEG.northBand.z1 - SEG.northBand.z0);
  const slopeZ = SEG.northBand.z0 - slopeLen * 0.5 + 0.1;
  // 宽度跟着裁剪框走：36 m 宽的整幅斜面在收窄后的取景里会伸出台座东缘 9 m，
  // 顶视图看就是一块悬在天空里的绿色平行四边形。取景已把里山切掉时整块不生成。
  const sw = clipRect(PLOT.min, PLOT.max, slopeZ, slopeZ + 0.01);
  if (sw) {
    const w = sw[1] - sw[0];
    const slopeGeo = new THREE.PlaneGeometry(w, Math.hypot(slopeLen, 1.5) + 0.4, 8, 4);
    retile(slopeGeo, w, 2.0, 1.8);
    const slope = new THREE.Mesh(slopeGeo, grass);
    slope.name = 'north-slope';
    slope.position.set((sw[0] + sw[1]) / 2, Y.ground + 0.75, slopeZ);
    slope.rotation.x = -Math.PI / 2 + 0.92;
    slope.receiveShadow = true;
    g.add(slope);
  }
  // のり止めブロック（縦縞）
  const blockZ = SEG.northBand.z0 - slopeLen * 0.42;
  for (let i = 0; i < 12; i++) {
    const x = -18 + (i + 0.5) * 3;
    if (!insideClip(x, blockZ)) continue;
    g.add(
      mesh(box(0.14, 1.7, 0.16), MAT.concrete({ base: '#b6b2a8', repeat: 1 }), {
        pos: [x, Y.ground + 0.72, blockZ],
        rot: [0.92, 0, 0],
        cast: true,
        receive: true,
      }),
    );
  }

  /* ---------- 中央広場・駐輪場・民家敷地の舗装（裸土を残さない） ---------- */
  /* ---------- 铺面高度分层 ----------
     这些矩形彼此有重叠（广场压着草地、店铺土间压着广场…）。同一张地图里
     两块铺面若落在同一个 y 上就会 z-fighting，路面上会拉出整片櫛齿纹。
     所以按「谁该盖住谁」给出严格递增的高度，相邻层至少差 2 mm。
     土芯 -0.004 < 砂利 0.002 < 草地 0.005 < 广场 0.009 < 店铺/民家土间 0.011
     < 店后通路 0.013 < 駐輪場 0.016。 */
  const plazaMat = MAT.paving({ color: '#bfb9ac', mode: 'block', cells: 5, repeat: 1 });
  const plazaFine = MAT.concrete({ base: '#c4bfb3', repeat: 1, joints: 3 });
  const bikeMat = MAT.asphalt({ tone: 2, repeat: 1 });
  g.add(surface(SEG.plaza.x0, SEG.plaza.x1, SEG.plaza.z0, SEG.plaza.z1, Y.ground + 0.009, plazaMat, { tile: 2.4, name: 'plaza', segs: 4 }));
  g.add(surface(SEG.bikepark.x0, SEG.bikepark.x1, SEG.bikepark.z0, SEG.bikepark.z1, Y.ground + 0.016, bikeMat, { tile: 2.0, name: 'bikepark' }));
  // 駐輪場区画線
  for (let i = 0; i < 7; i++) {
    const x = SEG.bikepark.x0 + 0.5 + i * 0.92;
    if (x > SEG.bikepark.x1) break;
    g.add(mesh(box(0.075, 0.006, Math.abs(SEG.bikepark.z1 - SEG.bikepark.z0) - 0.2), MAT.marking('#efe9dc', { repeat: 1 }), { pos: [x, Y.ground + 0.022, (SEG.bikepark.z0 + SEG.bikepark.z1) / 2], cast: false, receive: true }));
  }
  // 店舗敷地（建物まわりの土間：建物が来ても裸土を見せない）
  g.add(surface(STORE.x0 - 0.6, STORE.x1 + 0.6, STORE.z0 - 0.6, STORE.z1 + 0.05, Y.ground + 0.011, plazaFine, { tile: 2.0, name: 'store-lot' }));
  // 民家敷地（土間 + 庭）：西側の草地（y+0.005）と重なるので 6 mm 盛る
  g.add(surface(SEG.minka.x0, SEG.minka.x1, SEG.minka.z0, SEG.minka.z1, Y.ground + 0.011, MAT.paint('#c0b29a', { map: TEX.concrete({ base: '#b3a48c', repeat: 1 }).map, spec: 0.03, shadowAmt: 0.96 }), { tile: 1.6, name: 'minka-lot' }));
  // 店舗裏の通路（北側）：store-lot と z 方向に重なるので高さを変えておく（同一平面は競合する）
  g.add(surface(STORE.x0, STORE.x1, STORE.z0 - 0.9, STORE.z0, Y.ground + 0.013, plazaFine, { tile: 1.8, name: 'store-back-passage' }));
  // ホーム下・線路際の細部を埋める草地帯
  g.add(surface(SEG.plaza.x0, 1.6, SEG.plaza.z0 - 0.02, SEG.plaza.z0 + 0.9, Y.ground + 0.004, grassDark, { tile: 1.5, name: 'platform-foot-grass' }));

  /* ---------- 土間・砂利パッチ（未舗装の隙間） ---------- */
  const dirt = MAT.paint(PAL.dirt, { map: TEX.concrete({ base: PAL.dirt, repeat: 1 }).map, spec: 0.03, shadowAmt: 0.96, steps: 3 });
  const dirtPatches = [
    [-14.5, -11.4, -3.6, -1.2, 1.4],
    [1.4, 3.6, -9.4, -7.6, 1.2],
    [-2.8, 1.6, -2.6, -0.8, 1.3],
  ];
  for (const [x0, x1, z0, z1, tile] of dirtPatches) {
    g.add(surface(x0, x1, z0, z1, Y.ground + 0.002, dirt, { tile, name: 'dirt', segs: 2 }));
  }

  /* ---------- 縁の土こぼれ（底座との取り合い） ---------- */
  // 撒在固定的 ±18 一圈：取景收窄后那一圈已经跑到台座外面，顶视图里就是一堆
  // 飘在天空中的棕色方块。基准改成裁剪框本身，并且往内侧留半个块宽。
  const C = clipBounds() || { x0: PLOT.min, x1: PLOT.max, z0: PLOT.min, z1: PLOT.max };
  for (let i = 0; i < 26; i++) {
    const edge = (rnd() * 4) | 0;
    const s = range(rnd, 0.1, 0.42);
    const tx = range(rnd, C.x0 + s * 0.75, C.x1 - s * 0.75);
    const tz = range(rnd, C.z0 + s * 0.75, C.z1 - s * 0.75);
    const p = [
      [tx, C.z0 + s * 0.62],
      [tx, C.z1 - s * 0.62],
      [C.x0 + s * 0.62, tz],
      [C.x1 - s * 0.62, tz],
    ][edge];
    if (!insideClip(p[0], p[1])) continue;
    g.add(
      mesh(rbox(s, 0.05, s, 0.02, 2), dirt, {
        pos: [p[0], SOIL_BOT + 0.02, p[1]],
        rot: [0, range(rnd, 0, 3), 0],
        cast: false,
        receive: true,
      }),
    );
  }

  return finish(g, { outline: false });
}

export default build;
