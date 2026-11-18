import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {warmUp} from 'teardown-kit/warm.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const CAMERAS = {
  hero: {position: [-7.6, 6.25, 14.5], target: [.88, 2.48, 0], distance: 1.04},
  side: {position: [.7, 4.1, 16.8], target: [.7, 2.5, 0], distance: 1},
  front: {position: [-14.5, 4.9, .45], target: [-.8, 2.5, 0], distance: 1},
  top: {position: [.2, 17.0, .2], target: [.2, 2.1, 0], distance: 1},
  detail: {position: [-6.2, 5.9, 6.4], target: [-2.77, 4.68, 0], distance: 1},
};
export const INSPECTION = {
  skull: {position: [-5.9, 5.65, 5.5], target: [-2.82, 4.69, 0]},
  core: {position: [-2.8, 4.0, 5.9], target: [-.06, 3.14, .45]},
  armor: {position: [-4.5, 5.9, 7.8], target: [-.02, 3.35, .0]},
  legs: {position: [-3.2, 3.2, 7.4], target: [.46, 1.68, .32]},
  tail: {position: [5.9, 4.6, 8.9], target: [3.15, 2.85, 0]},
};

function radialTexture() {
  const n = 128;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const r = Math.hypot((x / (n - 1) - .5) * 2, (y / (n - 1) - .5) * 2);
    const at = (y * n + x) * 4;
    data[at] = 20; data[at + 1] = 39; data[at + 2] = 48;
    data[at + 3] = Math.max(0, 1 - r) ** 2 * 96;
  }
  const texture = new THREE.DataTexture(data, n, n);
  texture.needsUpdate = true;
  return texture;
}

function createPlinth(scene) {
  const base = new THREE.Group();
  // Elliptical maintenance dais: long enough to support the entire silhouette.
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(5.95, 6.04, .13, 128),
    new THREE.MeshStandardMaterial({color: '#c3cfd3', roughness: .65, metalness: .30}),
  );
  plinth.position.set(.6, -.105, 0);
  plinth.scale.z = .43;
  plinth.receiveShadow = true;
  base.add(plinth);
  const top = new THREE.Mesh(new THREE.CircleGeometry(5.96, 128), new THREE.MeshStandardMaterial({
    color: '#dfe6e8', roughness: .7, metalness: .15,
  }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(.6, -.034, 0);
  top.scale.y = .43;
  top.receiveShadow = true;
  base.add(top);
  const lineMat = new THREE.LineBasicMaterial({color: '#91a8b1', transparent: true, opacity: .5});
  for (const radius of [5.60, 5.79]) {
    const points = Array.from({length: 161}, (_, i) => V(.6 + Math.cos(i / 160 * Math.PI * 2) * radius, -.027, Math.sin(i / 160 * Math.PI * 2) * radius * .43));
    base.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat));
  }
  const ticks = [];
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * Math.PI * 2, len = i % 10 === 0 ? .14 : .055;
    const radius = 5.65;
    ticks.push(V(.6 + Math.cos(a) * radius, -.022, Math.sin(a) * radius * .43));
    ticks.push(V(.6 + Math.cos(a) * (radius - len), -.022, Math.sin(a) * (radius - len) * .43));
  }
  base.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), lineMat));
  // Soft grounding beneath each support foot, alongside the actual shadow map.
  const soft = radialTexture();
  const footShadows = [-.68, .68].map(z => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.5), new THREE.MeshBasicMaterial({
      map: soft, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(.45, -.015, z);
    base.add(mesh);
    return mesh;
  });
  scene.add(base);
  return {plinth: base, footShadows};
}

export function createStage(canvas, viewport) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setClearColor('#e9edef', 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .05, 120);
  camera.position.set(...CAMERAS.hero.position);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(...CAMERAS.hero.target);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.minDistance = 2.0;
  controls.maxDistance = 32;
  controls.maxPolarAngle = Math.PI / 2 + .06;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.update();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e4f5ff', '#627887', .9));
  const key = new THREE.DirectionalLight('#fff1dc', 2.8);
  key.position.set(-3.5, 10.0, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -9, right: 9, top: 8, bottom: -6, near: .1, far: 30});
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .035;
  key.shadow.radius = 3;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#b6e5f9', 2.5);
  rim.position.set(1.0, 6.0, -6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#e3f4ff', .9);
  fill.position.set(-7, 3, -1);
  scene.add(fill);
  const warm = new THREE.DirectionalLight('#ffcda0', .4);
  warm.position.set(8, 4, 4);
  scene.add(warm);
  const {plinth, footShadows} = createPlinth(scene);
  const updateFootShadows = feet => {
    for (const [index, foot] of feet.entries()) {
      const shadow = footShadows[index];
      shadow.position.x = foot.x;
      shadow.position.z = foot.z;
      shadow.material.opacity = Math.max(0, 1 - (foot.y - .57) / .5);
    }
  };
  let nextPosition = null, nextTarget = null;
  let cameraFactor = 1, width = 1, height = 1;
  const resize = () => {
    const rect = viewport.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 650 ? 1.4 : 1.65));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the long silhouette by horizontal field of view at every portrait width.
    camera.fov = 33;
    camera.updateProjectionMatrix();
    cameraFactor = Math.max(1, 1.15 / (width / height));
  };
  const setCamera = (spec, immediate = false) => {
    const target = V(...spec.target);
    const position = V(...spec.position);
    position.sub(target).multiplyScalar(cameraFactor * (spec.distance || 1)).add(target);
    if (immediate) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      nextPosition = nextTarget = null;
    } else {
      nextPosition = position;
      nextTarget = target;
    }
  };
  const step = dt => {
    if (nextPosition) {
      const alpha = 1 - Math.exp(-dt * 5.8);
      camera.position.lerp(nextPosition, alpha);
      controls.target.lerp(nextTarget, alpha);
      if (camera.position.distanceTo(nextPosition) < .002) {
        camera.position.copy(nextPosition);
        controls.target.copy(nextTarget);
        nextPosition = nextTarget = null;
      }
    }
    controls.update();
  };
  const stopCamera = () => { nextPosition = nextTarget = null; };
  const render = () => renderer.render(scene, camera);
  const project = point => {
    const p = point.clone().project(camera);
    return {x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, visible: p.z >= -1 && p.z <= 1 && Math.abs(p.x) < .94 && Math.abs(p.y) < .87};
  };
  resize();
  setCamera(CAMERAS.hero, true);
  return {
    renderer, scene, camera, controls, plinth, resize, setCamera, step, render, project, stopCamera, updateFootShadows,
    warm: () => warmUp(renderer, camera, [{scene, target: null}]),
    get size() { return {width, height}; },
  };
}
