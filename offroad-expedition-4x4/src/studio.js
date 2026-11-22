import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function groundTexture() {
  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(size, size);
  let seed = 91709;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const value = 211 + (random() - 0.5) * 27;
      pixels.data.set([value + 4, value + 2, value - 3, 255], index);
    }
  }
  context.putImageData(pixels, 0, 0);
  for (let i = 0; i < 74; i++) {
    const x = random() * size;
    const y = random() * size;
    const radius = 3 + random() * 15;
    const stain = context.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, i % 3 === 0 ? 'rgba(123, 115, 99, .13)' : 'rgba(233, 224, 205, .15)');
    stain.addColorStop(1, 'rgba(174, 166, 148, 0)');
    context.fillStyle = stain;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let i = 0; i < 810; i++) {
    const x = random() * size;
    const y = random() * size;
    context.fillStyle = i % 3 === 0 ? 'rgba(99, 91, 73, .24)' : 'rgba(239, 230, 207, .39)';
    context.fillRect(x, y, 0.6 + random() * 2.1, 0.6 + random() * 2.7);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(78, 78);
  map.anisotropy = 8;
  return map;
}

function contactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0.14, 'rgba(255,255,255,.45)');
  gradient.addColorStop(0.47, 'rgba(255,255,255,.35)');
  gradient.addColorStop(0.75, 'rgba(255,255,255,.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const material = new THREE.MeshBasicMaterial({
    color: 0x292a23, map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.28, 5.65), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.0011;
  return shadow;
}

export function makeStudio(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7e887e);
  scene.fog = new THREE.FogExp2(0x7e887e, 0.048);

  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, 0.093).texture;
  scene.environmentIntensity = 0.78;
  environment.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffead0, 2.95);
  key.position.set(-3.7, 7.4, 3.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3.9, right: 3.9, top: 4.2, bottom: -4.2, near: 0.4, far: 18 });
  key.shadow.radius = 3.4;
  key.shadow.normalBias = 0.016;
  key.shadow.bias = -0.0002;

  const fill = new THREE.DirectionalLight(0xcddcdd, 0.98);
  fill.position.set(4, 3.9, -4.5);
  const bottomFill = new THREE.DirectionalLight(0xe9e6db, 0);
  bottomFill.position.set(-3, -4, 3);
  scene.add(key, fill, bottomFill, new THREE.HemisphereLight(0xe5eee7, 0x686451, 0.92));

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({ color: 0x898777, map: groundTexture(), roughness: 0.96 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.0015;
  floor.receiveShadow = true;
  const ground = new THREE.Group();
  ground.add(floor, contactShadow());
  scene.add(ground);
  return { scene, ground, bottomFill };
}
