// 场景总规划常量（与 docs/LAYOUT.md 一致，地图层与装配层共用）
/* 只保留这一矩形（红线范围）。框外的地图铺面由 kit.setWorldClip 裁掉，
   框外的资产由 placement.js 过滤，底座尺寸跟 PLATE_RECT 走。
   两条道路各留约三分之二，让路口与人行横道仍然读得出是路口：
     roadNS  x 3.6..9.4  → 留到 8.0
     roadEW  z 7.0..13.4 → 留到 12.0  */
export const CROP = { x0: -17.0, x1: 8.0, z0: -17.6, z1: 12.0 };
/** 底座 = 裁剪框外只留 0.9 m 草皮：参考图是「很窄一圈草地 + 厚台座侧面」，
 *  边带留宽了会变成一大片空草地，模型台座感就没了。 */
export const PLATE_RECT = { x0: CROP.x0 - 0.9, x1: CROP.x1 + 0.9, z0: CROP.z0 - 0.9, z1: CROP.z1 + 0.9 };

export const PLOT = { min: -18, max: 18 };
/** 底座顶面（=土台底）：街道标高 y=0，土台厚 0.55 */
export const PLATE_TOP = -0.55;
export const CONTENT = 36;

/** 区段：X 范围 [x0,x1]，Z 范围 [z0,z1]，顶面高 y */
export const SEG = {
  /** 単線軌道带（道床掘り込み） */
  track: { x0: -18, x1: 3.6, z0: -17.2, z1: -12.4, y: -0.42 },
  /** 站台 */
  platform: { x0: -18, x1: 1.4, z0: -12.2, z1: -9.4, y: 0.72 },
  /** 踏切（N-S 道が軌道を_cross する区間） */
  crossing: { x0: 3.6, x1: 9.4, z0: -17.2, z1: -12.2, y: 0.0 },
  /** 南北道路（駅舎側から南端まで） */
  roadNS: { x0: 3.6, x1: 9.4, z0: -12.2, z1: 18 },
  /** 東西道路（丁字路で南北道に合流） */
  roadEW: { x0: -18, x1: 3.6, z0: 7.0, z1: 13.4, y: 0 },
  /** 丁字路平坦部 */
  junction: { x0: 3.6, x1: 9.4, z0: 7.0, z1: 13.4 },
  /** 店舗前歩道（北側歩道） */
  walkFront: { x0: -18, x1: 3.6, z0: 4.8, z1: 7.0, y: 0.15 },
  /** 道路南側歩道 */
  walkSouth: { x0: -18, x1: 3.6, z0: 13.4, z1: 15.4, y: 0.15 },
  /** 南北道東側歩道 */
  walkEast: { x0: 9.4, x1: 11.4, z0: -12.2, z1: 18, y: 0.15 },
  /** 南北道西側歩道（広場側） */
  walkWest: { x0: 1.6, x1: 3.6, z0: -12.2, z1: 7.0, y: 0.15 },
  /** 中央広場・駐輪場 */
  plaza: { x0: -11.3, x1: 3.6, z0: -9.4, z1: -0.8 },
  /** 自転車駐輪場（自転車をラックに直角に停めると車体 1.80 m が列の前後に出る。
   *  旧 z -7.6..-4.2 の 3.4 m だと前後の車輪が舗装から突き出たので 4.0 m に延ばした） */
  bikepark: { x0: -9.0, x1: -2.8, z0: -7.9, z1: -3.9 },
  /** 民家敷地 */
  minka: { x0: -18, x1: -14.7, z0: -3.0, z1: 5.0 },
  /** 小巷（行き止まり） */
  alley: { x0: -14.3, x1: -11.7, z0: -3.6, z1: 7.0 },
  /** 南側の余白（草地・法面・桜並木） */
  southBand: { x0: -18, x1: 18, z0: 15.4, z1: 18 },
  /** 軌道北側のり面・田んぼ */
  northBand: { x0: -18, x1: 18, z0: -18, z1: -17.2 },
};

/** 便利店（9.4 × 5.6，原点は輪郭中心） */
export const STORE = {
  w: 9.4,
  d: 5.6,
  cx: -6.6,
  cz: 2.0,
  x0: -11.3,
  x1: -1.9,
  z0: -0.8,
  z1: 4.8,
  floorY: 0.12,
  clearH: 2.85,
  parapetTop: 3.42,
  doorX: -6.6,
  doorW: 1.8,
};

/** 軌道 */
export const RAIL = {
  centerZ: -14.9,
  gauge: 1.067,
  railTop: -0.30,
  ballastTop: -0.42,
  sleeperPitch: 0.80,
  headW: 0.072,
  headH: 0.09,
};

/** 横断歩道 */
export const CROSSWALK = {
  ew: { x0: -0.6, x1: 2.0, z0: 7.0, z1: 13.4 },
  nsNorth: { x0: 3.6, x1: 9.4, z0: -8.2, z1: -5.6 },
  southApproach: { x0: 5.0, x1: 7.6, z0: 13.4, z1: 18 },
};

/** 電柱 anchors（utility-pole / power-lines と共通）
 *  P0-P1-P2 は東西街面の南側歩道に一直線、P3 で丁字路の隅を 90° 曲がって P4 へ。
 *  P3 は转角杆：腕金を二方向の角二等分（−45°）に向ける。power-lines 側は
 *  档ごとに断面軸を档距直交へ揃えるので、档内で線が交差して蜘蛛の巣になる事はない。 */
export const POLES = [
  // P0 从 -17.2 移到 -16.4：横担两端原本伸到 x=-17.66，越出取景框 0.66 m，
  // 整根杆会被装配层的包围盒越界判定摘掉，连带 P0–P1 那一档电线（电线必须两端落杆）。
  { id: 'P0', x: -16.4, z: 6.3, h: 8.0, transformer: true, rotY: -90 },
  { id: 'P1', x: -13.9, z: 6.3, h: 7.4, transformer: false, rotY: -90 },
  { id: 'P2', x: -2.7, z: 6.35, h: 8.4, transformer: true, rotY: -90 },
  { id: 'P3', x: 10.7, z: 6.5, h: 8.0, transformer: false, rotY: -45 },
  { id: 'P4', x: 10.75, z: -8.0, h: 7.6, transformer: true, rotY: 0 },
];
export const SPANS = [
  ['P0', 'P1'],
  ['P1', 'P2'],
  ['P2', 'P3'],
  ['P3', 'P4'],
];
export const POLE_ANCHORS = {
  top: 7.55,
  upper: { y: 7.35, dx: 0.7 },
  middle: { y: 6.85, dx: 0.62 },
  neutral: 6.3,
  drop: { y: 5.2, dx: 0.16 },
};

export function center(seg) {
  return [(seg.x0 + seg.x1) / 2, (seg.z0 + seg.z1) / 2];
}
export function size(seg) {
  return [Math.abs(seg.x1 - seg.x0), Math.abs(seg.z1 - seg.z0)];
}
