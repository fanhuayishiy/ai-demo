// 电影级日光装置：程序化天空环境 + 暖主光 + 天空半球 + 冷补 + 樱花反弹光
import * as THREE from 'three';
import { PAL } from './palette.js';
import { U } from './toon.js';

/** 程序化春日天空（equirect）→ PMREM 环境贴图 */
export function skyEnvironment(renderer) {
  if (typeof document === 'undefined') return null;
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#7fb4ea');
  gr.addColorStop(0.34, '#a9d2f2');
  gr.addColorStop(0.5, '#dceaf5');
  gr.addColorStop(0.62, '#f6ecdf');
  gr.addColorStop(0.78, '#f3e0dd');
  gr.addColorStop(1, '#d8d3c8');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  // 太阳
  const sx = w * 0.31, sy = h * 0.3;
  const sg = g.createRadialGradient(sx, sy, 2, sx, sy, 90);
  sg.addColorStop(0, 'rgba(255,252,238,1)');
  sg.addColorStop(0.25, 'rgba(255,240,206,0.75)');
  sg.addColorStop(1, 'rgba(255,240,206,0)');
  g.fillStyle = sg;
  g.fillRect(0, 0, w, h);
  // 柔云
  for (let i = 0; i < 46; i++) {
    const x = Math.random() * w, y = h * (0.18 + Math.random() * 0.34);
    const rw = 40 + Math.random() * 120, rh = 6 + Math.random() * 16;
    const cg = g.createRadialGradient(x, y, 0, x, y, rw);
    cg.addColorStop(0, 'rgba(255,255,255,0.5)');
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
  // 地平线暖粉雾
  const hz = g.createLinearGradient(0, h * 0.52, 0, h * 0.72);
  hz.addColorStop(0, 'rgba(255,214,224,0)');
  hz.addColorStop(0.5, 'rgba(255,214,224,0.42)');
  hz.addColorStop(1, 'rgba(255,214,224,0)');
  g.fillStyle = hz;
  g.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/** 背景：柔和竖向渐变（无 UI、无杂色） */
export function backgroundTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#bcdcf4');
  gr.addColorStop(0.42, '#dcecf7');
  gr.addColorStop(0.68, '#f3e9e3');
  gr.addColorStop(1, '#efe6de');
  g.fillStyle = gr;
  g.fillRect(0, 0, 8, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  return t;
}

export const SUN_DIR = new THREE.Vector3(-0.52, 0.74, 0.58).normalize();

export function setupLighting(scene, { quality = {} } = {}) {
  const rig = new THREE.Group();
  rig.name = 'lightRig';
  scene.add(rig);

  const sun = new THREE.DirectionalLight(PAL.sunKey, quality.sun ?? 2.3);
  sun.castShadow = true;
  // VSM 4096 は 1 フレームあたりの固定コストが大きい（ぼかし 12 サンプル × 2 面）。
  // 微縮モデルでは 2048（約 2 cm/texel）で影の輪郭は十分シャープ。
  sun.shadow.mapSize.set(quality.shadow ?? 2048, quality.shadow ?? 2048);
  const cam = sun.shadow.camera;
  cam.left = -25; cam.right = 25; cam.top = 25; cam.bottom = -25;
  cam.near = 1; cam.far = 110;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.022;
  sun.shadow.radius = 2.4;
  sun.shadow.blurSamples = 12;
  sun.position.copy(SUN_DIR).multiplyScalar(46);
  sun.target.position.set(-2, 0.4, 0);
  rig.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight('#bcd8f7', '#f2dfd0', quality.hemi ?? 0.88);
  rig.add(hemi);

  // 冷侧补光（来自站台/北面天空）
  const fill = new THREE.DirectionalLight(PAL.fillCool, quality.fill ?? 0.5);
  fill.position.set(9, 14, -22);
  rig.add(fill);

  // 樱花反弹暖粉光（从树冠方向打来，令阴影面不死黑）
  const bounce = new THREE.DirectionalLight(PAL.blossomBounce, quality.bounce ?? 0.42);
  bounce.position.set(-16, 7, 4);
  rig.add(bounce);

  // 轮廓背光（把物件从背景里"剥"出来）
  const kicker = new THREE.DirectionalLight('#fff6e8', quality.kicker ?? 0.34);
  kicker.position.set(-6, 12, -30);
  rig.add(kicker);

  return { rig, sun, hemi, fill, bounce, kicker };
}

/** 每帧：把世界太阳方向换算到视空间，供卡通高光/边缘光使用 */
export function syncSunToView(camera) {
  _v.copy(SUN_DIR).transformDirection(camera.matrixWorldInverse);
  U.sunDirView.value.copy(_v);
}
const _v = new THREE.Vector3();
