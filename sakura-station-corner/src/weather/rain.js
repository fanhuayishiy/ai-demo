// 雨：冷灰蓝的主调 + 明显变密的雾 + 灯具全部提亮（雨天白天也开灯是真实观感的来源）。
// 花瓣量压到 0.18 —— 春雨会把樱花打落得差不多，但完全清零会让树冠突然变味，留一点更连贯。
// rain 是给 motion/rain-shower.js 的量（0..1），同时 wind 抬到 1.7 让花枝和雨丝同向。
export default {
  NAME: 'rain',
  LABEL: '雨',
  sky: {
    stops: ['#5d6b78', '#6b7885', '#7b8792', '#8d97a0', '#9aa2a8', '#8e9194'],
    sun: null,
    clouds: { n: 82, band: [0.06, 0.6], alpha: 0.5 },
    haze: { y0: 0.46, y1: 0.8, rgb: '150,164,178', alpha: 0.55 },
    backdrop: ['#6a7683', '#75818d', '#818c97', '#8e98a1', '#98a0a6', '#8f9498'],
  },
  fog: { color: '#8d99a6', density: 0.0135 },
  lights: {
    sun: { color: '#9fb0c0', intensity: 0.26, dir: [-0.44, 0.66, 0.6] },
    hemi: { sky: '#8fa3b6', ground: '#6f6d68', intensity: 1.5 },
    fill: { color: '#a9bccf', intensity: 0.72 },
    bounce: { color: '#93a4b2', intensity: 0.22 },
    kicker: { color: '#b7c6d4', intensity: 0.16 },
  },
  exposure: 0.9,
  envIntensity: 1.05,
  grade: {
    saturation: 0.8, contrast: 1.1, vignette: 0.34, grain: 0.05, ca: 0.0009,
    lift: [0.03, 0.038, 0.05], gamma: [0.985, 0.995, 1.02], gain: [0.94, 0.98, 1.04],
    haze: '#b9c8d6', hazeAmount: 0.11,
  },
  wx: { breeze: 1.7, lampGain: 1.7, petal: 0.18, rain: 1 },
};
