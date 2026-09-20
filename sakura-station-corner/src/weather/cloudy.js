// 曇り：日轮收掉、天光抬起来接管照明，影子边缘还在但几乎不暗。
// 关键是把 sun 的强度压下去同时把 hemi/fill 抬上来 —— 只压不抬会得到一张发灰的死场景。
export default {
  NAME: 'cloudy',
  LABEL: '曇',
  sky: {
    stops: ['#a8b8c6', '#b6c3cf', '#c4cfd8', '#d2d9de', '#dadfe2', '#d5d6d2'],
    sun: null,
    clouds: { n: 64, band: [0.1, 0.62], alpha: 0.62 },
    haze: { y0: 0.5, y1: 0.76, rgb: '214,220,224', alpha: 0.5 },
    backdrop: ['#b4c2ce', '#bcc8d3', '#c6d0d8', '#d2d8dc', '#dadcd9', '#d6d4cd'],
  },
  fog: { color: '#dfe5e9', density: 0.0062 },
  lights: {
    sun: { color: '#e8eef4', intensity: 0.62, dir: [-0.52, 0.74, 0.58] },
    hemi: { sky: '#cddbe8', ground: '#ded8cc', intensity: 1.42 },
    fill: { color: '#dbe6f2', intensity: 0.82 },
    bounce: { color: '#e8e2df', intensity: 0.3 },
    kicker: { color: '#f0f4f8', intensity: 0.22 },
  },
  exposure: 0.98,
  envIntensity: 1.18,
  grade: {
    saturation: 0.94, contrast: 1.06, vignette: 0.2, grain: 0.02, ca: 0.0004,
    lift: [0.026, 0.028, 0.033], gamma: [0.995, 0.998, 1.004], gain: [0.995, 1.0, 1.012],
    haze: '#dfe8ee', hazeAmount: 0.05,
  },
  wx: { breeze: 1.25, lampGain: 1.18, petal: 0.72, rain: 0, wet: 0.18 },
};
