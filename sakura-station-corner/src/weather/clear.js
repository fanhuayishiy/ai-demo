// 晴（春日昼）—— 这就是场景原本的样子，数值逐条抄自 core/lighting.js 与 core/engine.js，
// 目的是让「天气」成为唯一的色彩事实源，而不是给别的天气开一条特殊路径、默认态却写死在引擎里。
export default {
  NAME: 'clear',
  LABEL: '晴',
  sky: {
    stops: ['#7fb4ea', '#98c6ef', '#bddcf3', '#f2ece3', '#f3dfdb', '#d8d3c8'],
    sun: { x: 0.31, y: 0.3, r: 90, inner: 'rgba(255,252,238,1)', outer: 'rgba(255,240,206,0.75)' },
    clouds: { n: 46, band: [0.18, 0.52], alpha: 0.5 },
    haze: { y0: 0.52, y1: 0.72, rgb: '255,214,224', alpha: 0.42 },
    backdrop: ['#bcdcf4', '#cbe4f5', '#dae6f6', '#eceae9', '#f2e8e1', '#efe6de'],
  },
  fog: { color: '#e9eef2', density: 0.0041 },
  lights: {
    sun: { color: '#fff6e4', intensity: 2.3, dir: [-0.52, 0.74, 0.58] },
    hemi: { sky: '#bcd8f7', ground: '#f2dfd0', intensity: 0.88 },
    fill: { color: '#cfe0ff', intensity: 0.5 },
    bounce: { color: '#ffd5e2', intensity: 0.42 },
    kicker: { color: '#fff6e8', intensity: 0.34 },
  },
  exposure: 0.94,
  envIntensity: 1,
  grade: {
    saturation: 1.13, contrast: 1.13, vignette: 0.24, grain: 0.016, ca: 0.00045,
    lift: [0.02, 0.015, 0.027], gamma: [1.0, 0.995, 0.982], gain: [1.062, 1.018, 0.972],
    haze: '#ffdfe6', hazeAmount: 0.036,
  },
  wx: { breeze: 1, lampGain: 1, petal: 1, rain: 0 },
};
