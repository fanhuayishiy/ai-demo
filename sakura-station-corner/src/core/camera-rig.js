// 第三人称自由观景相机：拖拽 / 360° 旋转 / 无极缩放（连续对数推轨）
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const VIEW_LIMITS = {
  minDistance: 1.15,
  maxDistance: 96,
  minPolar: 0.045,
  maxPolar: 1.535,
  box: { x: [-24, 24], y: [-0.5, 8.5], z: [-24, 24] },
};

export function createCameraRig(camera, dom, opts = {}) {
  const L = { ...VIEW_LIMITS, ...(opts.limits || {}) };
  const c = new OrbitControls(camera, dom);
  c.enableDamping = true;
  c.dampingFactor = opts.damping ?? 0.058;
  c.rotateSpeed = opts.rotateSpeed ?? 0.6;
  c.zoomSpeed = opts.zoomSpeed ?? 0.86;
  c.panSpeed = opts.panSpeed ?? 0.78;
  c.screenSpacePanning = true;
  c.enablePan = true;
  c.zoomToCursor = true;
  c.minDistance = L.minDistance;
  c.maxDistance = L.maxDistance;
  c.minPolarAngle = L.minPolar;
  c.maxPolarAngle = L.maxPolar;
  c.autoRotate = false;
  c.keyPanSpeed = 0;
  c.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  c.target.set(opts.target?.[0] ?? 0, opts.target?.[1] ?? 1.2, opts.target?.[2] ?? 0);

  const grab = () => dom.classList && dom.classList.add('is-grabbing');
  const release = () => dom.classList && dom.classList.remove('is-grabbing');
  dom.addEventListener('pointerdown', grab);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  dom.addEventListener('contextmenu', (e) => e.preventDefault());

  // shift + 左键 = 平移
  let savedButton = null;
  dom.addEventListener(
    'pointerdown',
    (e) => {
      if (e.shiftKey && e.button === 0) {
        savedButton = c.mouseButtons.LEFT;
        c.mouseButtons.LEFT = THREE.MOUSE.PAN;
      }
    },
    true,
  );
  window.addEventListener('pointerup', () => {
    if (savedButton !== null) {
      c.mouseButtons.LEFT = savedButton;
      savedButton = null;
    }
  });

  let idle = 0;
  c.addEventListener('start', () => {
    idle = 0;
  });

  c.update();

  return {
    controls: c,
    limits: L,
    update(dt) {
      const t = c.target;
      t.x = Math.min(L.box.x[1], Math.max(L.box.x[0], t.x));
      t.y = Math.min(L.box.y[1], Math.max(L.box.y[0], t.y));
      t.z = Math.min(L.box.z[1], Math.max(L.box.z[0], t.z));
      const d = camera.position.distanceTo(t);
      if (d < L.minDistance || d > L.maxDistance) {
        camera.position.sub(t).setLength(Math.min(L.maxDistance, Math.max(L.minDistance, d))).add(t);
      }
      idle += dt;
      c.update();
    },
    idleTime: () => idle,
    place(pos, target) {
      camera.position.set(pos[0], pos[1], pos[2]);
      c.target.set(target[0], target[1], target[2]);
      c.update();
      return c;
    },
    dispose() {
      c.dispose();
      dom.removeEventListener('pointerdown', grab);
      window.removeEventListener('pointerup', release);
    },
  };
}
