// 材质预设库 —— 在 toon 内核之上封装出「金属/玻璃/木材/塑胶/沥青/花瓣/树皮/纸/织物」等家族
import * as THREE from 'three';
import { toon, glow, physical } from './toon.js';
import { TEX } from './textures.js';
import { PAL } from './palette.js';

const T = (o = {}) => ({ ...o });
/** 过滤 undefined：避免调用方传 {map:undefined} 覆盖预设默认值 */
const clean = (o = {}) => { const r = {}; for (const k in o) if (o[k] !== undefined) r[k] = o[k]; return r; };

export const MAT = {
  /* ---------- 通用喷漆 / 塑料 ---------- */
  paint: (color, o = {}) =>
    toon(
      T({
        color,
        steps: o.steps ?? 3,
        spec: o.spec ?? 0.2,
        specPower: o.specPower ?? 60,
        specCut: o.specCut ?? 0.26,
        sheen: o.sheen ?? 0.03,
        rim: o.rim ?? 0.16,
        shadowTint: o.shadowTint ?? '#7f97c6',
        shadowAmt: o.shadowAmt ?? 0.82,
        map: o.map,
        normalMap: o.normalMap,
        normalScaleX: o.normalScaleX,
        normalScaleY: o.normalScaleY,
        uv: o.uv,
        transparent: o.transparent,
        opacity: o.opacity,
        side: o.side,
        
        vertexColors: o.vertexColors,
        tint: o.tint,
        sat: o.sat,
        contrast: o.contrast,
        emissive: o.emissive,
        emissiveIntensity: o.emissiveIntensity,
        wind: o.wind,
        pulse: o.pulse,
        scroll: o.scroll,
        dither: o.dither,
      }),
    ),

  /** 塑料（货架件、容器、外壳）：柔和窄高光 */
  plastic: (color, o = {}) =>
    MAT.paint(color, { spec: 0.3, specPower: 34, specCut: 0.2, sheen: 0.06, shadowAmt: 0.78, ...o }),

  /** 硬质塑胶（贩卖机面板、自行车挡泥板） */
  hardPlastic: (color, o = {}) =>
    MAT.paint(color, {
      spec: 0.42,
      specPower: 70,
      specCut: 0.16,
      sheen: 0.08,
      map: o.map || TEX.metal({ base: color, worn: 0.3, repeat: o.repeat ?? 1 }).map,
      normalMap: o.normalMap || TEX.metal({ base: color, worn: 0.3, repeat: o.repeat ?? 1 }).normalMap,
      normalScaleX: 0.4,
      normalScaleY: 0.4,
      ...clean(o),
    }),

  /** 喷漆金属（车身、栏杆、铁皮）：细颗粒 + 磨损 */
  metalPaint: (color, o = {}) => {
    const wear = TEX.metal({ base: color, worn: o.worn ?? 0.5, repeat: o.repeat ?? 2 });
    return MAT.paint(o.base ?? "#ffffff", {
      spec: 0.34,
      specPower: 58,
      specCut: 0.22,
      sheen: 0.07,
      map: o.map || wear.map,
      normalMap: o.normalMap || wear.normalMap,
      normalScaleX: o.normalScaleX ?? 0.5,
      normalScaleY: o.normalScaleY ?? 0.5,
      uv: o.uv,
      ...clean(o),
    });
  },

  /** 裸露金属 / 不锈钢（拉丝） */
  metal: (color = '#b9bcc0', o = {}) => {
    const t = TEX.metal({ base: color, dir: o.dir ?? 'v', worn: o.worn ?? 0.35, repeat: o.repeat ?? 1 });
    return MAT.paint(o.base ?? "#ffffff", {
      spec: o.spec ?? 0.62,
      specPower: o.specPower ?? 120,
      specCut: o.specCut ?? 0.12,
      sheen: o.sheen ?? 0.16,
      shadowTint: '#8ea6c9',
      shadowAmt: 0.66,
      rim: 0.26,
      rimColor: '#e8f3ff',
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 0.55,
      normalScaleY: 0.55,
      uv: o.uv,
      ...clean(o),
    });
  },
  stainless: (o = {}) => MAT.metal('#c3c7cb', { worn: 0.4, repeat: 2, ...o }),
  chrome: (o = {}) => MAT.metal('#dfe4e8', { spec: 0.85, specPower: 200, specCut: 0.07, sheen: 0.28, ...o }),
  darkIron: (o = {}) => MAT.metal('#5b5f66', { spec: 0.4, sheen: 0.1, ...o }),
  galvanized: (o = {}) =>
    MAT.paint('#a7adad', {
      map: TEX.metal({ base: '#a7adad', worn: 0.6, repeat: 2 }).map,
      normalMap: TEX.metal({ base: '#a7adad', worn: 0.6, repeat: 2 }).normalMap,
      spec: 0.4,
      sheen: 0.1,
      ...clean(o),
    }),

  /* ---------- 玻璃 / 液体 ---------- */
  glass: (o = {}) =>
    physical({
      color: o.color ?? '#dceef2',
      transmission: o.transmission ?? 0.95,
      roughness: o.roughness ?? 0.055,
      thickness: o.thickness ?? 0.012,
      ior: o.ior ?? 1.52,
      // 屋外 daylight で橱窗が鏡になると店内（本项目的最大见せ场）が全部消える。
      // 环境反射と clearcoat を落として「透けるガラス」を优先させる。
      envMapIntensity: o.envMapIntensity ?? 0.6,
      clearcoat: 0.22,
      reflectivity: 0.4,
      attenuation: o.attenuation ?? '#c9e6e4',
      attenuationDistance: o.attenuationDistance ?? 3.2,
      uv: o.uv,
    }),
  /** 卡通化薄玻璃（货架门小窗、展示罩）：省开销 */
  glassLite: (o = {}) =>
    toon({
      color: o.color ?? '#dceef2',
      transparent: true,
      opacity: o.opacity ?? 0.24,
      depthWrite: false,
      side: o.side ?? THREE.DoubleSide,
      spec: 0.9,
      specPower: 220,
      specCut: 0.06,
      sheen: 0.3,
      rim: 0.4,
      rimPower: 1.9,
      shadowAmt: 0.3,
      steps: 2,
      ...clean(o),
    }),
  water: (o = {}) =>
    toon({
      color: '#7fa9b8',
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      spec: 1.0,
      specPower: 260,
      specCut: 0.05,
      sheen: 0.4,
      shadowAmt: 0.3,
      steps: 2,
      scroll: o.scroll ?? [0.02, 0.014],
      ...clean(o),
    }),

  /* ---------- 木 / 树皮 ---------- */
  wood: (o = {}) => {
    const t = TEX.wood({ light: o.light ?? '#c9a878', dark: o.dark ?? '#8b6a45', knots: o.knots, repeat: o.repeat ?? 1 });
    return MAT.paint(o.base ?? o.light ?? '#c9a878', {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 0.8,
      normalScaleY: 0.8,
      spec: 0.1,
      sheen: 0.02,
      shadowAmt: 0.86,
      uv: o.uv,
      ...clean(o),
    });
  },
  bark: (o = {}) => {
    const base = o.base ?? PAL.trunk;
    const t = TEX.bark({ base, seed: o.seed ?? 1, repeat: o.repeat ?? 1 });
    return MAT.paint(base, {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 1.6,
      normalScaleY: 1.6,
      spec: 0.05,
      sheen: 0.0,
      shadowAmt: 0.95,
      steps: 4,
      rim: 0.22,
      rimColor: '#ffd9e4',
      uv: o.uv,
      ...clean(o),
    });
  },

  /* ---------- 石 / 沥青 / 混凝土 ---------- */
  asphalt: (o = {}) => {
    const t = TEX.asphalt({ tone: o.tone ?? 2, repeat: o.repeat ?? 4 });
    return MAT.paint(o.base ?? ['#8b8880', '#83807a', '#7a7772'][o.tone ?? 2], {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 1.1,
      normalScaleY: 1.1,
      spec: 0.12,
      specPower: 18,
      specCut: 0.55,
      sheen: 0.02,
      shadowAmt: 0.9,
      steps: 3,
      uv: o.uv,
      ...clean(o),
    });
  },
  concrete: (o = {}) => {
    const base = o.base ?? PAL.concrete;
    const t = TEX.concrete({ base, repeat: o.repeat ?? 2, joints: o.joints, cracked: o.cracked });
    return MAT.paint(base, {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 0.9,
      normalScaleY: 0.9,
      spec: 0.06,
      sheen: 0.01,
      shadowAmt: 0.88,
      uv: o.uv,
      ...clean(o),
    });
  },
  paving: (o = {}) => {
    const t = TEX.paving({ color: o.color ?? PAL.sidewalk, mode: o.mode ?? 'block', cells: o.cells ?? 6, repeat: o.repeat ?? 2 });
    return MAT.paint(o.base ?? o.color ?? PAL.sidewalk, {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 1.3,
      normalScaleY: 1.3,
      spec: 0.09,
      sheen: 0.02,
      shadowAmt: 0.85,
      uv: o.uv,
      ...clean(o),
    });
  },
  /** 瓷砖（室内壁・关东煮柜台・腰壁）：贴图承载基色 */
  tile: (o = {}) => {
    const t = TEX.tile({ color: o.color ?? '#eef2f0', n: o.n ?? 8, grout: o.grout, repeat: o.repeat ?? 1 });
    return MAT.paint(o.base ?? o.color ?? '#eef2f0', {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 0.55,
      normalScaleY: 0.55,
      spec: o.spec ?? 0.4,
      specPower: o.specPower ?? 120,
      specCut: o.specCut ?? 0.11,
      sheen: 0.1,
      shadowAmt: 0.62,
      steps: 3,
      ...clean(o),
    });
  },
  stone: (o = {}) => MAT.paint(o.color ?? '#a8a29a', { map: TEX.concrete({ base: o.color ?? '#a8a29a', repeat: 1 }).map, spec: 0.08, shadowAmt: 0.9, ...o }),
  ballast: (o = {}) => {
    const t = TEX.ballast({ repeat: o.repeat ?? 8 });
    return MAT.paint(o.base ?? PAL.ballast, { map: t.map, normalMap: t.normalMap, normalScaleX: 2.2, normalScaleY: 2.2, spec: 0.1, shadowAmt: 0.95, ...o });
  },
  tactile: (o = {}) => {
    const t = TEX.tactile({ kind: o.kind ?? 'dot', base: PAL.tactile });
    return MAT.paint(o.base ?? "#ffffff", { map: t.map, normalMap: t.normalMap, normalScaleX: 2.4, normalScaleY: 2.4, spec: 0.16, ...o });
  },
  grass: (o = {}) => {
    const base = o.base ?? PAL.grass;
    const t = TEX.grass({ base, repeat: o.repeat ?? 6 });
    return MAT.paint(base, {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 1.4,
      normalScaleY: 1.4,
      spec: 0.04,
      shadowAmt: 0.94,
      steps: 4,
      rim: 0.24,
      rimColor: '#dfffce',
      ...clean(o),
    });
  },
  roofTile: (o = {}) => {
    const base = o.base ?? PAL.minkaRoof;
    const t = TEX.roofTile({ base, repeat: o.repeat ?? 1 });
    return MAT.paint(base, { map: t.map, normalMap: t.normalMap, normalScaleX: 1.6, normalScaleY: 1.6, spec: 0.22, specPower: 70, ...o });
  },
  corrugated: (o = {}) => {
    const t = TEX.corrugated({ base: o.base ?? '#9fa7a4', repeat: o.repeat ?? 1 });
    return MAT.paint(o.tintBase ?? o.base ?? '#9fa7a4', { map: t.map, normalMap: t.normalMap, normalScaleX: 1.2, normalScaleY: 1.2, spec: 0.3, ...o });
  },

  /* ---------- 纸 / 海报 / 布 ---------- */
  paper: (o = {}) =>
    MAT.paint(o.color ?? '#f4efe1', {
      map: o.map || TEX.paper({ base: o.color ?? '#f4efe1' }).map,
      spec: 0.05,
      sheen: 0.0,
      shadowAmt: 0.8,
      steps: 2,
      uv: o.uv,
      ...clean(o),
    }),
  poster: (o = {}) =>
    MAT.paint('#ffffff', { map: o.map, graphic: true, spec: 0.12, specPower: 26, sheen: 0.02, shadowAmt: 0.7, steps: 2, ...o }),
  fabric: (o = {}) => {
    const t = TEX.fabric({ base: o.color ?? '#5d6470', repeat: o.repeat ?? 8 });
    return MAT.paint(o.base ?? o.color ?? '#5d6470', {
      map: t.map,
      normalMap: t.normalMap,
      normalScaleX: 1.1,
      normalScaleY: 1.1,
      spec: 0.03,
      sheen: 0.0,
      shadowAmt: 0.96,
      steps: 3,
      ...clean(o),
    });
  },
  rubber: (color = '#2f3238', o = {}) =>
    MAT.paint(color, { spec: 0.06, specPower: 10, specCut: 0.7, sheen: 0.01, shadowAmt: 0.98, steps: 2, ...o }),

  /* ---------- 樱花 / 叶 ---------- */
  /** 花瓣：半透 + 强边缘透光 */
  petal: (o = {}) =>
    toon({
      color: [PAL.sakuraPetalPale, PAL.sakuraPetal, PAL.sakuraPetalDeep][o.tone ?? 0],
      map: o.map,
      alphaMap: o.alphaMap,
      alphaTest: o.alphaTest ?? 0.42,
      transparent: !!o.alphaMap,
      side: THREE.DoubleSide,
      steps: 3,
      // 花びらの影は「濃いピンク」にせず「淡いピンクの陰」に留める。
      // 乗算影を強くすると群れが赤紫に潰れて治愈系の柔らかさが消える。
      shadowTint: '#f0c6d6',
      shadowAmt: 0.42,
      spec: 0.1,
      specPower: 22,
      sheen: 0.0,
      rim: 0.62,
      rimPower: 1.7,
      rimColor: '#ffe1ec',
      emissive: o.glowColor ?? '#ffc9dc',
      emissiveIntensity: o.glow ?? 0.16,
      vertexColors: o.vertexColors,
      wind: o.wind,
      depthWrite: o.depthWrite ?? true,
      sat: 1.0,
      ...clean(o),
    }),
  leaf: (o = {}) =>
    toon({
      color: o.color ?? PAL.leaf,
      map: o.map,
      alphaMap: o.alphaMap,
      alphaTest: o.alphaTest ?? 0.42,
      side: THREE.DoubleSide,
      steps: 3,
      shadowTint: '#6b8f6a',
      shadowAmt: 0.7,
      rim: 0.4,
      rimColor: '#e6ffd4',
      emissive: '#bfe59a',
      emissiveIntensity: 0.12,
      wind: o.wind,
      ...clean(o),
    }),

  /* ---------- 发光 / 灯具 ---------- */
  bulb: (o = {}) =>
    glow({
      color: o.color ?? '#fff4d8',
      map: o.map,
      transparent: o.transparent,
      opacity: o.opacity,
      toneMapped: o.toneMapped ?? true,
      side: o.side,
      uv: o.uv,
    }),
  /** 发光面（带三渲二壳的灯罩：略染色 + bloom 触发） */
  lampShade: (o = {}) =>
    toon({
      color: o.color ?? '#fff6e2',
      emissive: o.emissive ?? '#ffdda6',
      emissiveIntensity: o.emissiveIntensity ?? 0.75,
      spec: 0.3,
      sheen: 0.1,
      steps: 2,
      shadowAmt: 0.4,
      pulse: o.pulse ?? { base: 0.94, amount: 0.08, speed: 0.55, spread: 0.4 },
      transparent: o.transparent,
      opacity: o.opacity,
      side: o.side,
      map: o.map,
      uv: o.uv,
      ...clean(o),
    }),
  screen: (o = {}) =>
    glow({ color: o.color ?? '#cfe6ff', map: o.map, graphic: true, uv: o.uv, toneMapped: o.toneMapped ?? true, transparent: o.transparent, opacity: o.opacity }),
  ledOn: (color, o = {}) => glow({ color, ...o }),
  ledOff: (color = '#2b2f33', o = {}) => MAT.paint(color, { spec: 0.05, shadowAmt: 1, steps: 2, ...o }),

  /* ---------- 路面标线 / 贴花 ---------- */
  marking: (color = PAL.marking, o = {}) =>
    MAT.paint(color, {
      map: o.map || TEX.concrete({ base: color, repeat: 3 }).map,
      spec: 0.14,
      specPower: 20,
      sheen: 0.02,
      shadowAmt: 0.72,
      steps: 2,
      ...clean(o),
    }),
  /** 贴花材质：锈斑 / 污渍 / 贴纸残片 / 青苔（浮于母面上） */
  decal: (o = {}) =>
    new THREE.MeshBasicMaterial({
      map: o.map,
      color: new THREE.Color(o.color ?? '#ffffff'),
      transparent: true,
      opacity: o.opacity ?? 0.55,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3 - (o.order ?? 0),
      polygonOffsetUnits: -3,
      side: o.side ?? THREE.FrontSide,
      toneMapped: true,
      blending: o.blending ?? THREE.NormalBlending,
      alphaTest: 0.02,
      fog: o.fog !== false,
    }),

  /* ---------- 食物 / 商品 ---------- */
  food: (o = {}) =>
    MAT.paint(o.color ?? '#f0e2c8', {
      spec: o.spec ?? 0.28,
      specPower: 26,
      specCut: 0.3,
      sheen: 0.06,
      shadowAmt: 0.7,
      steps: 3,
      map: o.map,
      uv: o.uv,
      ...clean(o),
    }),
  rice: (o = {}) => MAT.food({ color: '#faf6ec', spec: 0.34, specPower: 34, ...o }),
  nori: (o = {}) => MAT.paint('#2f3a2c', { spec: 0.22, sheen: 0.05, map: TEX.paper({ base: '#2f3a2c' }).map, ...o }),
  bread: (o = {}) => MAT.food({ color: '#d8a86a', ...o }),
  liquidBottle: (o = {}) =>
    physical({
      color: o.color ?? '#e8f4f6',
      transmission: 0.92,
      roughness: 0.06,
      thickness: o.thickness ?? 0.03,
      ior: 1.45,
      attenuation: o.attenuation ?? '#bfe0dc',
      attenuationDistance: 0.6,
      envMapIntensity: 1.6,
    }),
  canBody: (o = {}) => MAT.metal(o.color ?? '#cfd4d8', { spec: 0.8, specPower: 160, specCut: 0.1, ...o }),
};

export { toon, glow, physical, TEX, PAL };
export default MAT;
