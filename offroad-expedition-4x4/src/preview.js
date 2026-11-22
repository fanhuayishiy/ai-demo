import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeStudio } from './studio.js';
import { createVehicle } from './vehicle/index.js';

const views = {
  front: [-0.93, 0.40, 1.13],
  side: [-1, 0.105, 0],
  rear: [0.94, 0.33, -1.12],
  bottom: [-0.66, -1.17, 0.85],
};
const focus = new THREE.Vector3(0, 0.98, 0.04);
const closedBounds = [[-0.98, 0.98], [0, 2.23], [-2.24, 2.18]];
const doorBounds = {
  driver: [[-1.94, -0.74], [0.65, 1.89], [-0.08, 0.70]],
  rear: [[0.07, 1.07], [0.61, 1.89], [-3.16, -1.87]],
};

function fitDistance(camera, direction, volumes) {
  const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
  const up = direction.clone().cross(right).normalize();
  const height = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const width = height * camera.aspect;
  const point = new THREE.Vector3();
  let distance = 0;
  for (const [xs, ys, zs] of volumes) {
    for (const x of xs) {
      for (const y of ys) {
        for (const z of zs) {
          point.set(x, y, z).sub(focus);
          const fitX = Math.abs(point.dot(right)) / (width * 0.94);
          const fitY = Math.abs(point.dot(up)) / (height * 0.83);
          distance = Math.max(distance, point.dot(direction) + Math.max(fitX, fitY));
        }
      }
    }
  }
  return distance;
}

export function startPreview(viewport, onReady) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '三维车辆。拖动或按方向键旋转。滚轮、双指捏合或加减键缩放。');
  viewport.append(renderer.domElement);

  const { scene, ground, bottomFill } = makeStudio(renderer);
  const vehicle = createVehicle();
  scene.add(vehicle.root);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 180);
  const controls = new OrbitControls(camera, renderer.domElement);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  controls.target.copy(focus);
  controls.enableDamping = !reducedMotion.matches;
  controls.dampingFactor = 0.10;
  controls.enablePan = false;
  controls.minDistance = 2.25;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minPolarAngle = 0.11;

  let view = 'front';
  let orbitListener;
  let transition;
  let underbody = false;
  let dirty = true;
  let initialized = false;
  let drawn = false;
  let lastFrame = 0;
  const openDoors = new Set();

  function framedDistance(direction) {
    return fitDistance(camera, direction, [closedBounds, ...[...openDoors].map((door) => doorBounds[door])]);
  }

  function setView(name, animate = true) {
    view = name;
    const wasUnderbody = underbody;
    underbody = name === 'bottom';
    bottomFill.intensity = underbody ? 2.4 : 0;
    controls.maxPolarAngle = underbody || wasUnderbody ? Math.PI * 0.86 : Math.PI * 0.5;
    const direction = new THREE.Vector3(...views[name]).normalize();
    const closer = !openDoors.size && camera.aspect > 0.95 && name !== 'side';
    const distance = framedDistance(direction) * (closer ? 0.91 : 1);
    if (!animate || reducedMotion.matches) {
      transition = undefined;
      camera.position.copy(focus).addScaledVector(direction, distance);
      controls.maxPolarAngle = underbody ? Math.PI * 0.86 : Math.PI * 0.5;
      controls.update();
      dirty = true;
      return;
    }

    const current = camera.position.clone().sub(focus);
    const spherical = new THREE.Spherical().setFromVector3(current);
    const end = new THREE.Spherical().setFromVector3(direction.multiplyScalar(distance));
    const delta = THREE.MathUtils.euclideanModulo(end.theta - spherical.theta + Math.PI, Math.PI * 2) - Math.PI;
    end.theta = spherical.theta + delta;
    transition = { start: performance.now(), from: spherical, to: end };
  }

  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => {
    transition = undefined;
    view = undefined;
    orbitListener?.();
  });

  renderer.domElement.addEventListener('keydown', (event) => {
    const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(focus));
    switch (event.key) {
      case 'ArrowLeft': orbit.theta -= 0.11; break;
      case 'ArrowRight': orbit.theta += 0.11; break;
      case 'ArrowUp': orbit.phi -= 0.09; break;
      case 'ArrowDown': orbit.phi += 0.09; break;
      case '+': case '=': orbit.radius *= 0.88; break;
      case '-': orbit.radius /= 0.88; break;
      default: return;
    }
    event.preventDefault();
    transition = undefined;
    view = undefined;
    orbitListener?.();
    camera.position.setFromSpherical(orbit).add(focus);
    controls.update();
  });

  function resize() {
    const { clientWidth: width, clientHeight: height } = viewport;
    if (!width || !height) return;
    const direction = camera.position.clone().sub(focus).normalize();
    const ratio = initialized ? camera.position.distanceTo(focus) / framedDistance(direction) : 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (view) setView(view, false);
    else camera.position.copy(focus).addScaledVector(direction, framedDistance(direction) * ratio);
    initialized = true;
    dirty = true;
  }

  new ResizeObserver(resize).observe(viewport);
  resize();
  renderer.setAnimationLoop((time) => {
    const seconds = Math.min((time - lastFrame) / 1000, 0.1);
    lastFrame = time;
    if (transition) {
      const progress = Math.min((time - transition.start) / 550, 1);
      const ease = THREE.MathUtils.smoothstep(progress, 0, 1);
      const { from, to } = transition;
      const blend = (property) => THREE.MathUtils.lerp(from[property], to[property], ease);
      camera.position.setFromSphericalCoords(blend('radius'), blend('phi'), blend('theta')).add(focus);
      if (progress === 1) {
        transition = undefined;
        controls.maxPolarAngle = underbody ? Math.PI * 0.86 : Math.PI * 0.5;
      }
    }
    controls.update();
    ground.visible = !underbody && camera.position.y > 0.05;
    if (vehicle.update(seconds, reducedMotion.matches)) {
      renderer.shadowMap.needsUpdate = true;
      dirty = true;
    }
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
      if (!drawn) {
        drawn = true;
        onReady();
      }
    }
  });

  return {
    setView,
    setDoor(name, open) {
      vehicle.setDoor(name, open);
      if (open) openDoors.add(name);
      else openDoors.delete(name);
      if (view) setView(view);
    },
    setLights(on) {
      vehicle.setLights(on);
      dirty = true;
    },
    onOrbit: (listener) => { orbitListener = listener; },
  };
}
