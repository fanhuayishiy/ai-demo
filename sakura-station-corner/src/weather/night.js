// 夜：便利店要自己把画面点亮 —— 日光几乎撤干净，靠 lampGain 把灯具、灯箱、贩卖机和
// 室内灯带抬起来，再由后处理的暗角与颗粒收住黑位。
// lampGain 是给 motion/light-breath.js 的乘数，它作用于所有 userData.breathe 灯器的
// emissiveIntensity 与其挂载的点光源，所以夜景区间的亮度是逐件灯具给的，不是整体提曝光。
export default {
  NAME: 'night',
  DARK: true,
  LABEL: '夜',
  sky: {
    stops: ['#0e1526', '#141d33', '#1b2740', '#233049', '#2a3750', '#31384a'],
    sun: { x: 0.24, y: 0.22, r: 46, inner: 'rgba(226,236,255,0.9)', outer: 'rgba(150,178,220,0.28)' },
    clouds: { n: 26, band: [0.14, 0.5], alpha: 0.16 },
    haze: { y0: 0.5, y1: 0.78, rgb: '64,84,124', alpha: 0.5 },
    backdrop: ['#111827', '#16203a', '#1c2942', '#233252', '#2a3a5a', '#333f57'],
  },
  fog: { color: '#1c2740', density: 0.0125 },
  lights: {
    sun: { color: '#8fa8d8', intensity: 0.16, dir: [0.34, 0.62, -0.7] },
    hemi: { sky: '#2b3c5c', ground: '#1c1c22', intensity: 0.42 },
    fill: { color: '#41567c', intensity: 0.22 },
    bounce: { color: '#5a4a52', intensity: 0.18 },
    kicker: { color: '#7d94c4', intensity: 0.26 },
  },
  exposure: 0.86,
  envIntensity: 0.34,
  grade: {
    saturation: 0.78, contrast: 1.18, vignette: 0.42, grain: 0.06, ca: 0.0008,
    lift: [0.014, 0.02, 0.042], gamma: [0.98, 0.99, 1.04], gain: [0.94, 0.98, 1.1],
    haze: '#5f7ba8', hazeAmount: 0.055,
  },
  wx: { breeze: 0.6, lampGain: 3.1, petal: 0.35, rain: 0, wet: 0.22 },
};
