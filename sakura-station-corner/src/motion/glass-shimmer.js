// 玻璃光影浮动：为标记 userData.glassShine 的玻璃面附加缓慢滑动的动漫式反光带
import * as THREE from 'three';
import { makeCanvas, toTexture, HAS_DOM } from '../core/textures.js';
import { IS_FLAT } from '../core/style.js';
import { grp, mesh, box, plane } from '../core/kit.js';

export const NAME = 'glass-shimmer';

function shineTexture() {
  if (!HAS_DOM) return null;
  const cv = makeCanvas(256, 64);
  const g = cv.g;
  g.clearRect(0, 0, 256, 64);
  // 一组宽窄不一的高光带
  const bands = [
    [0.06, 0.05, 0.85],
    [0.16, 0.02, 0.6],
    [0.22, 0.09, 0.95],
    [0.44, 0.03, 0.5],
    [0.62, 0.12, 0.75],
    [0.8, 0.025, 0.45],
  ];
  for (const [c, w, a] of bands) {
    const x = c * 256;
    const bw = Math.max(2, w * 256);
    const gr = g.createLinearGradient(x - bw, 0, x + bw, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, `rgba(255,255,255,${a})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x - bw, 0, bw * 2, 64);
  }
  // 纵向淡出（反光带不是等高贯穿）
  const vg = g.createLinearGradient(0, 0, 0, 64);
  vg.addColorStop(0, 'rgba(0,0,0,0.85)');
  vg.addColorStop(0.35, 'rgba(0,0,0,0)');
  vg.addColorStop(0.75, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = vg;
  g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = 'source-over';
  return toTexture(cv, { repeat: 1 });
}

export function attach(engine, world) {
  if (!HAS_DOM) return null;
  // 平涂方向不贴「流动的加算反光带」：那些白色条带会把橱窗变成毛玻璃，
  // 实测遮掉了店内 60% 以上的对比度（需求点名要「透过大玻璃看清店内陈设」）。
  // 平涂本来就没有高光漂移/泛光/景深这一套，玻璃应该是干净的一块。
  if (IS_FLAT) return null;
  const targets = [];
  world.traverse((o) => {
    const cfg = o.userData?.glassShine;
    if (!cfg || !o.isMesh) return;
    const w = cfg.w || 1;
    const h = cfg.h || 1;
    const tex = shineTexture();
    if (!tex) return;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: new THREE.Color(cfg.color ?? '#ffffff'),
      transparent: true,
      opacity: cfg.opacity ?? 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
      toneMapped: true,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    quad.name = (o.name || 'glass') + '#shine';
    quad.position.set(0, cfg.y ?? 0, cfg.z ?? 0.006);
    quad.renderOrder = 12;
    quad.castShadow = false;
    quad.receiveShadow = false;
    o.add(quad);
    targets.push({ quad, mat, base: cfg.opacity ?? 0.1, speed: cfg.speed ?? 0.045, phase: cfg.phase ?? Math.random(), dir: cfg.dir ?? 1 });
  });
  if (!targets.length) return null;
  engine.onUpdate((dt, t) => {
    for (const s of targets) {
      s.mat.map.offset.x = ((t * s.speed * s.dir + s.phase) % 1 + 1) % 1;
      const pulse = 0.72 + 0.28 * Math.sin(t * 0.23 + s.phase * 6.283);
      // 加算の白い帯を強く貼ると、ガラスが「曇り板」になって店内が見えなくなる。
      // 反光はあくまで薄く、透けるガラスを主役にする。
      s.mat.opacity = s.base * pulse;
    }
  });
  return { targets };
}
