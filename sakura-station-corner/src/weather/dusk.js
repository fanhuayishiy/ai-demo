// 夕暮れ：太阳压到低角度、色温掉到橙红，灯开始亮。
// 俯角不能压得太狠：日光阴影的正交视锥是 ±25 m 的固定盒子（core/lighting.js），
// 太阳再低影子就会长出盒子被裁掉，所以取 y≈0.3 而不是真正的贴地平角。
export default {
  NAME: 'dusk',
  DARK: true,
  LABEL: '夕',
  sky: {
    stops: ['#3f5a86', '#6b6f96', '#a97a86', '#e0956a', '#f2b477', '#c98a63'],
    sun: { x: 0.72, y: 0.52, r: 120, inner: 'rgba(255,236,200,1)', outer: 'rgba(255,168,96,0.8)' },
    clouds: { n: 40, band: [0.2, 0.56], alpha: 0.42 },
    haze: { y0: 0.44, y1: 0.74, rgb: '255,164,104', alpha: 0.6 },
    backdrop: ['#54668f', '#7d7291', '#b0807f', '#dd9570', '#efb279', '#c9906a'],
  },
  fog: { color: '#c99f8d', density: 0.0078 },
  lights: {
    sun: { color: '#ffb168', intensity: 1.85, dir: [-0.9, 0.3, 0.32] },
    hemi: { sky: '#8f8ab0', ground: '#d8a274', intensity: 0.82 },
    fill: { color: '#7f8fc0', intensity: 0.4 },
    bounce: { color: '#ff9f74', intensity: 0.5 },
    kicker: { color: '#ffcf9a', intensity: 0.62 },
  },
  exposure: 1.0,
  envIntensity: 1.05,
  grade: {
    saturation: 1.16, contrast: 1.12, vignette: 0.3, grain: 0.026, ca: 0.0006,
    lift: [0.04, 0.024, 0.02], gamma: [1.02, 0.99, 0.95], gain: [1.1, 1.0, 0.9],
    haze: '#ffb888', hazeAmount: 0.08,
  },
  wx: { breeze: 0.85, lampGain: 1.55, petal: 0.8, rain: 0, wet: 0.06 },
};
