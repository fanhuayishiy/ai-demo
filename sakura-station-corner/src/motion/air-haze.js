// 春日空气光晕：浮遊する花粉・光尘 + 太陽方向のやわらい光膜
import * as THREE from 'three';
import { inst, grp, rand, range } from '../core/kit.js';
import { makeCanvas, toTexture, HAS_DOM } from '../core/textures.js';
import { SUN_DIR } from '../core/lighting.js';

export const NAME = 'air-haze';

function dotTexture() {
  if (!HAS_DOM) return null;
  const cv = makeCanvas(64);
  const g = cv.g;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,246,232,0.55)');
  gr.addColorStop(1, 'rgba(255,240,225,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return toTexture(cv, { repeat: 1 });
}

function hazeTexture() {
  if (!HAS_DOM) return null;
  const cv = makeCanvas(256);
  const g = cv.g;
  const gr = g.createRadialGradient(128, 128, 8, 128, 128, 124);
  gr.addColorStop(0, 'rgba(255,248,232,0.5)');
  gr.addColorStop(0.45, 'rgba(255,232,224,0.2)');
  gr.addColorStop(1, 'rgba(255,228,222,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return toTexture(cv, { repeat: 1 });
}

export function attach(engine, world) {
  if (!HAS_DOM) return null;
  const g = grp('air-haze');
  const rnd = rand(424242);
  const tex = dotTexture();
  const hz = hazeTexture();
  if (!tex || !hz) return null;

  /* ---------- 光尘 / 花粉 ---------- */
  const N = 420;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: true,
    color: new THREE.Color('#fff3e2'),
  });
  const geo = new THREE.PlaneGeometry(1, 1);
  const state = [];
  const motes = inst(geo, mat, N, (i, d, r, col) => {
    const x = range(r, -19, 19);
    const y = range(r, 0.15, 5.4);
    const z = range(r, -17, 18);
    const s = range(r, 0.006, 0.028);
    d.position.set(x, y, z);
    d.scale.setScalar(s);
    col.setHSL(0.09 + r() * 0.06, 0.25 + r() * 0.3, 0.92);
    state.push({ x, y, z, s, vy: range(r, 0.004, 0.022), ph: r() * 6.283, sw: range(r, 0.12, 0.5), drift: range(r, 0.02, 0.09) });
  }, { name: 'motes', cast: false, receive: false });
  motes.frustumCulled = false;
  motes.renderOrder = 20;
  g.add(motes);

  /* ---------- 太阳方向的柔光膜（billboard） ---------- */
  const hazeMat = new THREE.MeshBasicMaterial({
    map: hz,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: true,
    color: new THREE.Color('#ffe9dc'),
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), hazeMat);
  veil.name = 'sun-veil';
  veil.renderOrder = 19;
  veil.frustumCulled = false;
  g.add(veil);

  world.add(g);

  const dummy = new THREE.Object3D();
  engine.onUpdate((dt, t, ctx) => {
    const { camera } = ctx;
    const gust = 0.7 + 0.4 * Math.sin(t * 0.17);
    for (let i = 0; i < N; i++) {
      const p = state[i];
      p.y += p.vy * dt * 0.6;
      p.x += (Math.sin(t * p.sw + p.ph) * 0.12 + 0.055 * gust) * dt * 6;
      p.z += Math.cos(t * p.sw * 0.8 + p.ph) * 0.09 * dt * 6;
      if (p.y > 5.8) p.y = 0.12;
      if (p.x > 19.4) p.x = -19.2;
      dummy.position.set(p.x, p.y, p.z);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(p.s * (0.82 + 0.3 * Math.sin(t * 0.7 + p.ph)));
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;

    // 光膜始终在太阳方向、随相机距离缩放，形成春日空气透视
    const pos = SUN_DIR.clone().multiplyScalar(38).add(new THREE.Vector3(0, 4, 0));
    veil.position.copy(pos);
    veil.quaternion.copy(camera.quaternion);
    hazeMat.opacity = 0.2 + 0.09 * Math.sin(t * 0.13);
  });
  return { group: g, motes, veil };
}
