import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {warmUp} from 'teardown-kit/warm.js';
import {canvasTexture} from './geometry.js';
import {FLIGHT} from './kinematics.mjs';

const VIEWS = {
  hero: {direction: new THREE.Vector3(.48, .47, .88), distance: 8.65, expansion: 3.34, depth: -.045},
  top: {direction: new THREE.Vector3(0, 1, .001), distance: 9.65, expansion: 2.55, depth: -.23},
  front: {direction: new THREE.Vector3(0, .125, 1), distance: 9.0, expansion: 1.90, depth: -.045},
};

function markFloor(scene) {
  const size = 15;
  const texture = canvasTexture(1024, 1024, (ctx, width) => {
    const u = width / size;
    const mid = width / 2;
    ctx.save();
    ctx.translate(mid, mid);
    ctx.scale(.86, 1.25);
    const ambient = ctx.createRadialGradient(0, 0, 0, 0, 0, 2.4 * u);
    ambient.addColorStop(0, '#38576337');
    ambient.addColorStop(.45, '#41616c23');
    ambient.addColorStop(1, '#45617400');
    ctx.fillStyle = ambient;
    ctx.fillRect(-3 * u, -3 * u, 6 * u, 6 * u);
    ctx.restore();
    ctx.lineWidth = 1;
    for (let i = -21; i <= 21; i++) {
      const p = Math.round(mid + (i * u / 3)) + .5;
      ctx.strokeStyle = i % 3 === 0 ? '#617f8948' : '#72909923';
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, width);
      ctx.moveTo(0, p);
      ctx.lineTo(width, p);
      ctx.stroke();
    }
    ctx.translate(mid, mid);
    for (const [radius, color, dashed] of [[1.30, '#719a9a79', false], [2.72, '#527c8770', true], [3.42, '#527c8779', false]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.setLineDash(dashed ? [3.5, 6.5] : []);
      ctx.beginPath();
      ctx.arc(0, 0, radius * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i = 0; i < 72; i++) {
      ctx.rotate(Math.PI / 36);
      ctx.strokeStyle = i % 6 === 0 ? '#4c737e9c' : '#63879362';
      ctx.beginPath();
      ctx.moveTo(0, 3.42 * u);
      ctx.lineTo(0, (i % 6 === 0 ? 3.56 : 3.48) * u);
      ctx.stroke();
    }
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#527983a8';
    ctx.fillText('FRONT', 0, 3.78 * u);
    ctx.beginPath();
    ctx.moveTo(-5, 3.61 * u);
    ctx.lineTo(0, 3.68 * u);
    ctx.lineTo(5, 3.61 * u);
    ctx.stroke();
    const fade = ctx.createRadialGradient(0, 0, u * 3.10, 0, 0, u * 6.85);
    fade.addColorStop(0, '#ffffffff');
    fade.addColorStop(.69, '#ffffff9b');
    fade.addColorStop(1, '#ffffff00');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = fade;
    ctx.fillRect(-mid, -mid, width, width);
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLIGHT.floor;
  floor.renderOrder = -2;
  scene.add(floor);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({opacity: .095, depthWrite: false}));
  shadow.position.y = FLIGHT.floor + .004;
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  shadow.renderOrder = -1;
  scene.add(shadow);
  return {floor, shadow};
}

function markFlightLane(scene) {
  const size = 18;
  const texture = canvasTexture(1024, 1024, (ctx, width) => {
    const center = width / 2, u = width / size;
    ctx.translate(center, center);
    for (const sign of [-1, 1]) {
      for (let row = 0; row < 11; row++) {
        const x = sign * (3.24 + row * .37) * u;
        ctx.fillStyle = ['#758a5952', '#9da96a53', '#b2b67d60'][row % 3];
        ctx.fillRect(x - u * .124, -center, u * .248, width);
        ctx.strokeStyle = '#62794a57';
        ctx.lineWidth = .65;
        ctx.beginPath();
        for (let i = -36; i < 36; i++) {
          const y = (i * .277 + row * .06) * u;
          ctx.moveTo(x - .088 * u, y - 4);
          ctx.lineTo(x, y);
          ctx.lineTo(x + .088 * u, y - 4);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#a5a68e24';
    ctx.fillRect(-2.7 * u, -center, 5.4 * u, width);
    ctx.strokeStyle = '#5369536b';
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -4.5 * u);
    ctx.lineTo(0, 4.5 * u);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [letter, sign] of [['A', -1], ['B', 1]]) {
      const y = sign * FLIGHT.span * u / 2;
      ctx.strokeStyle = '#6477579c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, y, 1.39 * u, 0, Math.PI * 2);
      ctx.stroke();
      const edge = u * 1.55, lip = u * .20;
      for (const xs of [-1, 1]) {
        for (const ys of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(xs * (edge - lip), y + ys * edge);
          ctx.lineTo(xs * edge, y + ys * edge);
          ctx.lineTo(xs * edge, y + ys * (edge - lip));
          ctx.stroke();
        }
      }
      ctx.font = '700 17px "JetBrains Mono", monospace';
      ctx.fillStyle = '#455d47c4';
      ctx.textAlign = 'center';
      ctx.fillText(letter, 0, y + .102 * u);
      ctx.fillText(letter, 1.78 * u, y + .095 * u);
    }
    const fade = ctx.createRadialGradient(0, 0, 3.2 * u, 0, 0, 8.65 * u);
    fade.addColorStop(0, '#ffffffff');
    fade.addColorStop(.65, '#ffffffbc');
    fade.addColorStop(1, '#ffffff00');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = fade;
    ctx.fillRect(-center, -center, width, width);
  });
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
  }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = FLIGHT.floor;
  lane.renderOrder = -2;
  scene.add(lane);
  return lane;
}

export function makeStage(canvas, viewport, drone, invalidate, onOrbit) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'high-performance'});
  renderer.setClearColor(0xdbe5e8, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, .045, .1, 40).texture;
  scene.environmentIntensity = .70;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#fff6e9', 3.0);
  key.position.set(-3.7, 7.5, 5.3);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, {left: -7.8, right: 7.8, top: 7.8, bottom: -7.8, near: .1, far: 22});
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -.0002;
  key.shadow.normalBias = .025;
  key.shadow.radius = 4.3;
  const rim = new THREE.DirectionalLight('#c4e7ff', 2.05);
  rim.position.set(4.0, 4.2, -5.7);
  const fill = new THREE.DirectionalLight('#e3edff', .95);
  fill.position.set(5.3, 1.2, 4.7);
  scene.add(key, rim, fill, new THREE.HemisphereLight('#f4f9ff', '#618094', 1.31));
  const {floor, shadow} = markFloor(scene);
  const lane = markFlightLane(scene);
  lane.visible = false;
  scene.add(drone.root);

  const camera = new THREE.PerspectiveCamera(35, 1, .07, 65);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .14;
  controls.rotateSpeed = .66;
  controls.zoomSpeed = .71;
  controls.minDistance = 1.1;
  controls.maxDistance = 29;
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', onOrbit);
  const target = new THREE.Vector3(), position = new THREE.Vector3(), direction = new THREE.Vector3();
  const bounding = new THREE.Box3();
  const point = new THREE.Vector3(), ndc = new THREE.Vector2();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3(), screenUp = new THREE.Vector3(), corner = new THREE.Vector3();
  let width = 1, height = 1;

  function resize() {
    width = Math.max(1, viewport.clientWidth);
    height = Math.max(1, viewport.clientHeight);
    const maxPixels = width < 600 ? 640_000 : 1_650_000;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6, Math.sqrt(maxPixels / (width * height))));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function frameCamera(view, amount, focus, flight, blend) {
    const preset = VIEWS[view];
    direction.copy(preset.direction);
    target.set(0, -.16 + amount * (view === 'hero' ? -.20 : .15), preset.depth);
    const fitWidth = Math.max(1, (1.72 + .06 * amount + (flight ? .13 : 0)) / camera.aspect);
    let distance = (preset.distance + preset.expansion * amount) * fitWidth;
    if (flight) {
      if (view === 'hero') {
        direction.set(.76 - .44 * flight.spray, .49 - .19 * flight.spray, .79 + .15 * flight.spray);
      }
      target.y = -.20 + flight.lift * .57 - flight.z * .18;
      target.z += flight.z * .40;
      distance += (.86 + .12 * Math.abs(flight.z)) * fitWidth;
    }
    if (focus) {
      drone.bounds(focus, bounding);
      bounding.getCenter(target);
      if (view === 'hero' && focus === 'sensors') direction.set(.29, .58, .91);
      if (view === 'hero' && focus === 'motors') direction.set(.48, .43, .87);
      direction.normalize();
      // Fit the nearest and farthest corners in perspective, leaving room around edges.
      right.crossVectors(up, direction).normalize();
      screenUp.crossVectors(direction, right);
      const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov * .5)) * .80;
      const horizontal = vertical * camera.aspect;
      distance = 1.34;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? bounding.max.x : bounding.min.x, i & 2 ? bounding.max.y : bounding.min.y,
          i & 4 ? bounding.max.z : bounding.min.z).sub(target);
        const depth = corner.dot(direction);
        distance = Math.max(distance, depth + Math.abs(corner.dot(right)) / horizontal,
          depth + Math.abs(corner.dot(screenUp)) / vertical);
      }
    }
    position.copy(target).addScaledVector(direction.normalize(), distance);
    const changed = camera.position.distanceToSquared(position) + controls.target.distanceToSquared(target) > .00000015;
    if (blend >= 1 || changed) {
      const step = changed ? blend : 1;
      camera.position.lerp(position, step);
      controls.target.lerp(target, step);
    }
    return changed;
  }

  function project(id) {
    drone.anchor(id, point).project(camera);
    return {x: (point.x + 1) * width * .5, y: (1 - point.y) * height * .5, inside: Math.abs(point.z) < 1};
  }

  function pick(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    ndc.set(2 * (clientX - bounds.left) / width - 1, 1 - 2 * (clientY - bounds.top) / height);
    return drone.pick(ndc, camera);
  }

  function draw(focus, amount, flight) {
    lane.visible = Boolean(flight);
    floor.visible = !focus && !flight;
    shadow.visible = !focus;
    floor.position.y = flight ? FLIGHT.floor : FLIGHT.floor - amount * .57;
    shadow.position.y = floor.position.y + .004;
    renderer.render(scene, camera);
  }

  function save(focus, amount, flight) {
    const image = document.createElement('canvas');
    image.width = canvas.width;
    image.height = canvas.height;
    const ctx = image.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, image.height);
    sky.addColorStop(0, flight ? '#f6f9f8' : '#f7fafc');
    sky.addColorStop(1, flight ? '#dce7e8' : '#dce6ec');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, image.width, image.height);
    draw(focus, amount, flight);
    ctx.drawImage(canvas, 0, 0);
    image.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AGRAS-T50' + (flight ? '-flight' : focus ? '-' + focus : '') + '.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  return {
    width: () => width, height: () => height, controls, draw, resize, project, frameCamera, pick, save,
    warm: () => warmUp(renderer, camera, [{scene}]),
  };
}
