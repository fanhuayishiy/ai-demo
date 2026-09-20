// 天空与环境的程序化生成器：天气模块只提供「六级色阶 + 太阳参数」，这里负责画出来。
// 背景是一条 8×512 的竖向渐变（贴到 scene.background），环境是同构的 equirect 画布
// 过一遍 PMREM。背景每帧可以重画（8 px 宽，成本可忽略），PMREM 不行，所以按天气缓存。
import * as THREE from 'three';

/** 背景用的竖向色阶条。stops 数量固定为 6，天气之间才能逐槽插值。 */
export function makeBackdrop(stops) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  paintBackdrop(t, stops);
  return t;
}

export function paintBackdrop(tex, stops) {
  const c = tex.image;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, c.height);
  stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s.isColor ? '#' + s.getHexString() : s));
  g.fillStyle = gr;
  g.fillRect(0, 0, c.width, c.height);
  tex.needsUpdate = true;
}

/**
 * equirect 天空 → PMREM 环境贴图。
 * sun 为 null 时不画日轮（阴雨/夜晚），否则按 x/y/r/颜色画一团带光晕的高光。
 * clouds.n>0 时叠几层扁椭圆云，alpha 控制云的不透明度。
 * haze 是地平线那一条暖雾带（原 lighting.js 的天空就有，去掉会让低角度反弹光偏冷）。
 */
export function makeEnvironment(renderer, cache, { stops, sun, clouds, haze }) {
  if (cache.map) return cache.map;
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s.isColor ? '#' + s.getHexString() : s));
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  if (haze) {
    const hg = g.createLinearGradient(0, h * haze.y0, 0, h * haze.y1);
    hg.addColorStop(0, `rgba(${haze.rgb},0)`);
    hg.addColorStop(0.5, `rgba(${haze.rgb},${haze.alpha})`);
    hg.addColorStop(1, `rgba(${haze.rgb},0)`);
    g.fillStyle = hg;
    g.fillRect(0, 0, w, h);
  }
  if (sun) {
    const sx = w * sun.x, sy = h * sun.y;
    const sg = g.createRadialGradient(sx, sy, sun.core || 2, sx, sy, sun.r);
    sg.addColorStop(0, sun.inner);
    sg.addColorStop(0.25, sun.outer);
    sg.addColorStop(1, 'rgba(255,240,206,0)');
    g.fillStyle = sg;
    g.fillRect(0, 0, w, h);
  }
  if (clouds && clouds.n) {
    for (let i = 0; i < clouds.n; i++) {
      const x = Math.random() * w;
      const y = h * (clouds.band[0] + Math.random() * (clouds.band[1] - clouds.band[0]));
      const rw = 40 + Math.random() * 120, rh = 6 + Math.random() * 16;
      const cg = g.createRadialGradient(x, y, 0, x, y, rw);
      cg.addColorStop(0, `rgba(255,255,255,${clouds.alpha})`);
      cg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cg;
      g.save();
      g.translate(x, y);
      g.scale(1, rh / rw);
      g.translate(-x, -y);
      g.beginPath();
      g.arc(x, y, rw, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  cache.map = env;
  return env;
}
