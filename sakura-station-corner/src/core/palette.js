// 调色板 —— 全场景色彩单一事实源（春日晴暖 · 治愈系低饱和）
export const PAL = {
  // 底座与地面
  baseplate: '#efeade',
  grassDeck: '#a9cf86',        // 基座顶面草皮（参考图的一整块绿台）
  asphalt: '#6d6e76',
  asphaltDark: '#5f6069',
  asphaltWet: '#4a4856',
  concrete: '#ded8ca',
  concreteDark: '#c6c0b2',
  curb: '#e6e0d2',
  sidewalk: '#dcd6c8',
  tileFront: '#ece6d8',
  paint: '#f4f1ea',
  paintWarm: '#f7efe0',
  marking: '#eeeade',            // 路面白線（真白にするとブロンミングで眩しく飛ぶ）
  markingYellow: '#f0c353',
  tactile: '#e8c14b',
  ballast: '#8c8779',
  railSteel: '#a9a49c',
  grass: '#9cc173',
  grassDark: '#88ae63',
  moss: '#8bab68',
  dirt: '#9c8a72',
  paddy: '#a8bf7e',

  // 便利店
  storeBand: '#4fa3d1', // 看板帯 蓝
  storeBand2: '#f2b23c', // 看板帯 黄
  storeBand3: '#e2685e', // 看板帯 红
  storeWall: '#e4ddcc',
  storeWallTrim: '#c9c2b3',
  storePillar: '#d2cbbe',
  awningGreen: '#3f7a52',
  // 店内床：它是「商品和棚的底色」，flat 又把阴影压到 0.5，所以它必须**明显暗于**
  // 货架白与商品色，否则整间店挤在 200-240 一档里（实测均值 204、标准差只有 25），
  // 隔着大玻璃看就是一片没有层次的白。往下压一档，让棚板与商品的边缘读得出来。
  interiorFloor: '#d9d2c2',
  shelfBody: '#efe9db',
  shelfEdge: '#f0b93a',
  register: '#4c5a63',
  glassTint: '#d7ecef',

  // 街渠金属/设施
  poleConcrete: '#b9b5ac',
  lampGreen: '#4a6b5a',
  lampBlack: '#3c3f45',
  vendingRed: '#c5312c',
  vendingBlue: '#2b6fb5',
  vendingGreen: '#3d8a5a',
  signGreen: '#2f6b52',
  signBlue: '#2c6cb0',
  bikeFrameA: '#3d76b4',
  bikeFrameB: '#d9dee3',
  bikeFrameC: '#8a5a52',
  bikeFrameD: '#4a7f6a',
  trainBody: '#e6e2d8',
  trainAccent: '#c2564a',
  trainStripe: '#4c6f8a',
  trainSkirt: '#5a5f66',
  wood: '#a8875f',
  woodDark: '#7d6244',
  woodWeathered: '#9c8f79',
  rust: '#8a5236',
  minkaRoof: '#8b8a93',         // 瓦屋根（陰側でも黒潰れしない明度のスレート）
  wallPlaster: '#e6dfd0',

  // 樱花
  sakuraPetal: '#fbd9e4',
  sakuraPetalDeep: '#f6b8cd',
  sakuraPetalPale: '#fdeaf1',
  sakuraCenter: '#e88ea8',
  yaePetal: '#ef8fb0',
  yaePetalDeep: '#d9577f',
  trunk: '#6f5a4c',
  trunkDark: '#54443a',
  leafYoung: '#a9c47a',
  leaf: '#7fa35c',

  // 光
  sunKey: '#fff6e4',
  skyTop: '#a9d4fa',
  skyLow: '#f0f7fd',
  skyHaze: '#f3e6ea',
  fillCool: '#cfe0ff',
  blossomBounce: '#ffd5e2',
  interiorWarm: '#ffe9c9',
  fluorescent: '#eaf6ff',
  outline: '#4a3d45',
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
