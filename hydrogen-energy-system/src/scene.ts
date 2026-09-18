import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { devices } from './devices';
import { palette as p, type Carrier } from './palette';
import type { Simulation } from './simulation';

type Point = [number, number, number];
interface Flow {
  carrier: Carrier;
  curve: THREE.CurvePath<THREE.Vector3>;
  group: THREE.Group;
  particles: THREE.Mesh[];
  power: (s: Simulation) => number;
}

export class EnergyScene {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(39, 1, 0.1, 250);
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private groups = new Map<string, THREE.Group>();
  private labels: { button: HTMLButtonElement; position: THREE.Vector3 }[] = [];
  private flows: Flow[] = [];
  private rotors: THREE.Group[] = [];
  private fans: THREE.Group[] = [];
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private selection = new THREE.Group();
  private state: Simulation | null = null;
  private last = 0;
  private time = 0;
  private windSpeed = 7.2;
  private active = true;
  private animation = 0;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private resizeObserver: ResizeObserver;
  private frameCount = 0;
  private fpsTime = 0;
  private fittedDistance = 0;
  public showLabels = true;
  public onFps: (fps: number) => void = () => {};

  constructor(private host: HTMLElement, private onSelect: (id: string) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.setClearColor(p.background, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.domElement.setAttribute('aria-label', '综合能源园区三维场景，可拖动旋转、滚轮缩放，或通过设备标签选择设备');
    this.renderer.domElement.setAttribute('role', 'img');
    host.prepend(this.renderer.domElement);
    this.camera.position.set(32, 30, 38);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 26;
    this.controls.maxDistance = 105;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minPolarAngle = 0.1;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.update();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.4, 0.85));
    this.composer.addPass(new OutputPass());
    this.scene.add(new THREE.HemisphereLight('#a9d4ed', '#213447', 2.3));
    const key = new THREE.DirectionalLight('#d4e8ff', 3.4);
    key.position.set(-15, 35, 15);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -35, right: 35, top: 25, bottom: -25, far: 100 });
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(p.primary, 1.4);
    rim.position.set(10, 15, -20);
    this.scene.add(rim);
    this.ground();
    this.buildDevices();
    this.buildFlows();
    this.buildSelection();
    this.select('electrolyzer');
    const pointer = new THREE.Vector2();
    const down = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    this.renderer.domElement.addEventListener('pointerdown', e => down.set(e.clientX, e.clientY));
    this.renderer.domElement.addEventListener('pointerup', e => {
      if (down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, this.camera);
      const hits = raycaster.intersectObjects([...this.groups.values()], true);
      if (!hits.length) return;
      let object: THREE.Object3D | null = hits[0].object;
      while (object && !object.userData.deviceId) object = object.parent;
      if (object) this.onSelect(object.userData.deviceId as string);
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.animation = requestAnimationFrame(t => this.render(t));
  }

  private material(color: string, metalness = 0.45, emissive = 0) {
    const key = `${color}/${metalness}/${emissive}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color, metalness, roughness: 0.48, emissive: color, emissiveIntensity: emissive,
      });
      this.materials.set(key, material);
    }
    return material;
  }

  private box(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, color = p.metalDark, glow = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material(color, 0.45, glow));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private cylinder(parent: THREE.Object3D, r: number, h: number, x: number, y: number, z: number, color = p.metalLight, top = r) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, r, h, 24), this.material(color, 0.65));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private sphere(parent: THREE.Object3D, r: number, x: number, y: number, z: number, color: string) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), this.material(color, 0.65));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private line(parent: THREE.Object3D, points: Point[], color: string, radius = 0.045, glow = 0) {
    const curve = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++) {
      curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i - 1]), new THREE.Vector3(...points[i])));
    }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 4, radius, 6, false), this.material(color, 0.3, glow));
    parent.add(mesh);
    return mesh;
  }

  private ground() {
    this.box(this.scene, 50, 0.7, 32, 0, -0.65, 0, p.deck);
    this.box(this.scene, 49.7, 0.12, 31.7, 0, -0.23, 0, p.metalDark);
    this.box(this.scene, 49.4, 0.12, 31.4, 0, -0.14, 0, p.surface);
    const grid = new THREE.GridHelper(90, 60, p.line, p.line);
    grid.position.y = -1.02;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    this.scene.add(grid);
    this.line(this.scene, [[-25, -0.4, -16], [25, -0.4, -16], [25, -0.4, 16], [-25, -0.4, 16], [-25, -0.4, -16]], p.primary, 0.032, 1.8);
    for (let x = -23; x <= 23; x += 2) {
      this.box(this.scene, 0.55, 0.025, 0.09, x, 0, 13.5, p.muted);
      this.box(this.scene, 0.55, 0.025, 0.09, x, 0, -14, p.muted);
    }
    for (const z of [-2.8, 0.1]) this.box(this.scene, 47, 0.035, 0.04, 0, 0.01, z, p.line);
    for (let x = -23; x <= 23; x += 4) {
      this.box(this.scene, 0.15, 0.12, 0.4, x, 0.08, 15, p.primary, 2);
      this.box(this.scene, 0.15, 0.12, 0.4, x, 0.08, -15, p.primary, 2);
    }
    for (const x of [-24, 24]) {
      for (let z = -13; z <= 13; z += 3) {
        this.cylinder(this.scene, 0.025, 0.75, x, 0.4, z, p.metal);
      }
      this.line(this.scene, [[x, 0.8, -13], [x, 0.8, 14]], p.metalDark, 0.02);
      this.line(this.scene, [[x, 0.4, -13], [x, 0.4, 14]], p.metalDark, 0.015);
    }
    for (const x of [-21, -15, -6, 3, 12, 21]) {
      this.cylinder(this.scene, 0.05, 2.5, x, 1.25, 14.6, p.metalDark);
      this.box(this.scene, 0.6, 0.09, 0.22, x + 0.2, 2.5, 14.6, p.metal);
      this.box(this.scene, 0.4, 0.04, 0.18, x + 0.2, 2.43, 14.6, p.primary, 2);
    }
    this.groundText('RENEWABLE GENERATION', -15, -12.8, 7, 0.55, p.muted);
    this.groundText('HYDROGEN ENERGY HUB', 5.5, -13, 10, 0.6, p.hydrogen);
    this.groundText('INTEGRATED ENERGY CAMPUS', -1, 12.2, 15, 0.8, p.muted);
    for (let x = -20; x < 13; x += 2.7) {
      this.box(this.scene, 1.2, 0.12, 0.9, x, 0.06, 10.5, p.deck);
      this.cylinder(this.scene, 0.08, 0.5, x, 0.4, 10.5, p.metalDark);
      const tree = this.sphere(this.scene, 0.45, x, 0.85, 10.5, p.metalDark);
      tree.scale.y = 1.5;
    }
    // The external bidirectional electricity connection has its own inlet.
    this.box(this.scene, 2, 1.4, 2.6, -22, 0.8, -0.9, p.metalDark);
    for (let i = 0; i < 3; i++) this.cylinder(this.scene, 0.1, 0.65, -22.6 + i * 0.6, 1.8, -0.9, p.electricity);
    this.groundText('GRID', -22, 1, 2, 0.5, p.electricity);
  }

  private groundText(text: string, x: number, z: number, width: number, height: number, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '500 38px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, 512, 45);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.06, z);
    this.scene.add(mesh);
  }

  private buildDevices() {
    for (const device of devices) {
      const group = new THREE.Group();
      const [x, z] = device.position;
      group.position.set(x, 0, z);
      group.userData.deviceId = device.id;
      this.groups.set(device.id, group);
      this.scene.add(group);
      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'device-label';
      label.dataset.device = device.id;
      label.style.setProperty('--carrier', p[device.carrier]);
      label.innerHTML = `<span class="label-dot"></span>${device.name}<span class="label-code">${device.code}</span>`;
      label.addEventListener('click', e => { e.stopPropagation(); this.onSelect(device.id); });
      this.host.append(label);
      this.labels.push({ button: label, position: new THREE.Vector3(x, device.labelHeight, z) });
      if (device.id !== 'wind') {
        const width = device.id === 'solar' ? 9.5 : device.id === 'storage' ? 7 : device.id === 'load' ? 7 : 6.3;
        const depth = device.id === 'load' ? 8.5 : device.id === 'solar' ? 7 : 5.5;
        this.box(group, width, 0.16, depth, 0, 0.08, 0, p.deck);
        this.line(group, [[-width / 2, 0.18, depth / 2], [width / 2, 0.18, depth / 2]], p[device.carrier], 0.028, 1.2);
      }
      switch (device.id) {
        case 'solar': this.solar(group); break;
        case 'wind': this.turbine(group, 0, 0, 7.5); this.turbine(group, 1, 6, 6); break;
        case 'storage': this.tanks(group); break;
        case 'electrolyzer': this.electrolyzer(group); break;
        case 'fuelcell': this.cabinets(group, p.hydrogen); break;
        case 'gas': this.gas(group); break;
        case 'chp': this.chp(group); break;
        case 'heatpump': this.hvac(group, p.heat); break;
        case 'chiller': this.hvac(group, p.cold); break;
        case 'load': this.buildings(group); break;
      }
    }
  }

  private solar(g: THREE.Group) {
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 5; column++) {
        const x = -3.6 + column * 1.8;
        const z = -2.2 + row * 2.2;
        this.box(g, 0.08, 0.9, 0.08, x, 0.6, z, p.metal);
        const panel = new THREE.Group();
        panel.position.set(x, 1.2, z);
        panel.rotation.x = -0.35;
        g.add(panel);
        this.box(panel, 1.68, 0.1, 1.8, 0, 0, 0, p.metal);
        this.box(panel, 1.58, 0.025, 1.7, 0, 0.065, 0, p.solar, 0.06);
        for (let i = -2; i <= 2; i++) this.box(panel, 0.013, 0.015, 1.7, i * 0.28, 0.085, 0, p.glass, 0.2);
        for (let i = -2; i <= 2; i++) this.box(panel, 1.58, 0.015, 0.013, 0, 0.085, i * 0.29, p.metalDark);
      }
    }
  }

  private turbine(g: THREE.Group, x: number, z: number, height: number) {
    this.cylinder(g, 0.8, 0.25, x, 0.2, z, p.metalDark);
    this.cylinder(g, 0.23, height, x, height / 2, z, p.metalLight, 0.12);
    this.box(g, 0.75, 0.6, 1.3, x, height, z, p.metalLight);
    const rotor = new THREE.Group();
    rotor.position.set(x, height, z + 0.8);
    g.add(rotor);
    this.sphere(rotor, 0.27, 0, 0, 0, p.metalLight);
    const blade = new THREE.Shape();
    blade.moveTo(-0.13, 0.18);
    blade.lineTo(-0.22, 0.8);
    blade.lineTo(-0.05, 3.1);
    blade.lineTo(0.1, 3.4);
    blade.lineTo(0.2, 0.9);
    blade.lineTo(0.11, 0.18);
    const geometry = new THREE.ExtrudeGeometry(blade, { depth: 0.055, bevelEnabled: false });
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(geometry, this.material(p.metalLight));
      mesh.rotation.z = i * Math.PI * 2 / 3;
      mesh.castShadow = true;
      rotor.add(mesh);
    }
    this.rotors.push(rotor);
  }

  private tanks(g: THREE.Group) {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 2.15;
      this.cylinder(g, 0.85, 0.3, x, 0.3, 0, p.metalDark);
      this.cylinder(g, 0.77, 3.2, x, 2.15, 0);
      this.sphere(g, 0.77, x, 3.75, 0, p.metalLight).scale.y = 0.55;
      this.sphere(g, 0.77, x, 0.55, 0, p.metalLight).scale.y = 0.5;
      for (const y of [1, 3.2]) this.cylinder(g, 0.79, 0.09, x, y, 0, p.hydrogen);
      this.cylinder(g, 0.09, 0.4, x, 4.2, 0, p.metal);
      this.line(g, [[x, 4.4, 0], [x, 4.4, -1.2], [x, 0.7, -1.2]], p.metal, 0.055);
      for (const dx of [-0.3, 0.3]) this.line(g, [[x + dx, 0.4, 0.85], [x + dx, 3.8, 0.85]], p.metalDark, 0.025);
      for (let y = 0.5; y < 3.8; y += 0.3) this.box(g, 0.6, 0.035, 0.04, x, y, 0.85, p.metalDark);
      this.box(g, 0.45, 0.3, 0.02, x, 2.3, 0.78, p.hydrogen, 0.3);
    }
    this.line(g, [[-2.15, 0.7, -1.2], [2.15, 0.7, -1.2]], p.hydrogen, 0.09, 0.4);
  }

  private electrolyzer(g: THREE.Group) {
    this.box(g, 5.3, 0.25, 3.5, 0, 0.35, 0, p.metal);
    for (let stack = 0; stack < 2; stack++) {
      const z = -0.8 + stack * 1.5;
      for (let i = 0; i < 17; i++) this.box(g, 0.14, 1.8, 1.02, -1.7 + i * 0.21, 1.5, z, i % 3 === 0 ? p.metalLight : p.metalDark);
      for (const x of [-2, 1.95]) this.box(g, 0.23, 2.1, 1.35, x, 1.5, z, p.metalLight);
      for (const y of [0.8, 2.2]) this.line(g, [[-2.2, y, z + 0.65], [2.2, y, z + 0.65]], p.metal, 0.04);
      this.line(g, [[-2.4, 2.65, z], [2.6, 2.65, z], [2.6, 0.6, z]], p.hydrogen, 0.08, 0.5);
    }
    this.box(g, 0.8, 1.5, 0.55, -2.5, 1.2, 1.8, p.metalDark);
    this.box(g, 0.45, 0.45, 0.03, -2.5, 1.5, 2.1, p.primary, 1);
    this.cylinder(g, 0.26, 1.9, 2.6, 1.4, -1.2, p.metalLight);
  }

  private cabinets(g: THREE.Group, color: string) {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.75;
      this.box(g, 1.5, 2.25, 2.9, x, 1.35, 0, p.metalLight);
      this.box(g, 1.35, 1.9, 0.04, x, 1.4, 1.48, p.metalDark);
      this.box(g, 1.3, 0.09, 0.06, x, 2.15, 1.53, color, 1.5);
      this.box(g, 0.45, 0.33, 0.03, x, 1.7, 1.52, p.glass, 0.5);
      for (let j = 0; j < 6; j++) this.box(g, 1.1, 0.035, 0.06, x, 0.62 + j * 0.11, 1.52, p.metal);
      this.cylinder(g, 0.43, 0.08, x, 2.54, 0, p.metalDark);
    }
  }

  private gas(g: THREE.Group) {
    for (const x of [-1.7, 0, 1.7]) {
      const tank = this.cylinder(g, 0.6, 3.2, x, 1.45, 0, p.metal);
      tank.rotation.x = Math.PI / 2;
      this.sphere(g, 0.6, x, 1.45, 1.6, p.metal).scale.z = 0.45;
      this.sphere(g, 0.6, x, 1.45, -1.6, p.metal).scale.z = 0.45;
      for (const z of [-1, 1]) this.box(g, 0.8, 0.9, 0.17, x, 0.6, z, p.metalDark);
      this.line(g, [[x, 1.45, 1.85], [x, 0.65, 2.15]], p.gas, 0.075, 0.3);
    }
    this.line(g, [[-2.3, 0.65, 2.15], [2.5, 0.65, 2.15], [2.5, 0.65, 0]], p.gas, 0.1, 0.7);
  }

  private chp(g: THREE.Group) {
    this.box(g, 5.6, 0.35, 4, 0, 0.4, 0, p.metal);
    this.box(g, 2.8, 1.7, 2.7, -0.8, 1.4, 0, p.metalDark);
    for (let i = 0; i < 8; i++) this.box(g, 0.13, 1.9, 2.95, -1.9 + i * 0.32, 1.5, 0, p.metal);
    const generator = this.cylinder(g, 0.8, 1.7, 1.6, 1.4, 0, p.metalLight);
    generator.rotation.z = Math.PI / 2;
    this.box(g, 1, 0.55, 1.2, 1.3, 2.2, 0, p.heat);
    for (const x of [-1.7, -0.5]) {
      this.cylinder(g, 0.25, 3.7, x, 2.2, -1.5, p.metal);
      this.cylinder(g, 0.3, 0.15, x, 4.1, -1.5, p.metalDark);
      this.cylinder(g, 0.26, 0.3, x, 3.75, -1.5, p.heat);
    }
    this.line(g, [[-2.2, 1.5, 1.7], [2.6, 1.5, 1.7], [2.6, 0.6, 0]], p.heat, 0.1, 0.45);
  }

  private hvac(g: THREE.Group, color: string) {
    for (const x of [-1.45, 1.45]) {
      this.box(g, 2.4, 1.8, 3.5, x, 1.25, 0, p.metalLight);
      this.box(g, 2.15, 1.4, 0.08, x, 1.25, 1.8, p.metalDark);
      for (let j = 0; j < 12; j++) this.box(g, 0.055, 1.3, 0.1, x - 1 + j * 0.18, 1.25, 1.85, p.metal);
      this.box(g, 2.4, 0.1, 0.07, x, 2, 1.85, color, 0.8);
      for (const z of [-0.85, 0.85]) {
        this.cylinder(g, 0.84, 0.13, x, 2.23, z, p.metalDark);
        const fan = new THREE.Group();
        fan.position.set(x, 2.33, z);
        g.add(fan);
        for (let j = 0; j < 4; j++) {
          const blade = this.box(fan, 0.28, 0.035, 1.35, 0, 0, 0, p.metal);
          blade.rotation.y = j * Math.PI / 2;
        }
        this.cylinder(fan, 0.18, 0.12, 0, 0, 0, p.metalLight);
        this.fans.push(fan);
      }
    }
    this.line(g, [[-2.8, 0.6, -2], [2.8, 0.6, -2]], color, 0.1, 0.5);
  }

  private buildings(g: THREE.Group) {
    for (const [x, z, w, h, d] of [[-1.2, -0.8, 3.2, 5.8, 4.7], [1.9, 1.1, 2.5, 3.6, 4.2]]) {
      this.box(g, w, h, d, x, h / 2 + 0.2, z, p.metalDark);
      this.box(g, w + 0.15, 0.2, d + 0.15, x, h + 0.3, z, p.metal);
      this.box(g, w - 0.5, 0.35, d - 0.8, x, h + 0.5, z, p.surface);
      for (let y = 1; y < h; y += 0.75) {
        this.box(g, w - 0.25, 0.43, 0.035, x, y, z + d / 2 + 0.02, p.glass, 0.7);
        this.box(g, 0.035, 0.43, d - 0.25, x + w / 2 + 0.02, y, z, p.glass, 0.6);
        for (let dx = -w / 2 + 0.55; dx < w / 2; dx += 0.65) this.box(g, 0.06, 0.5, 0.07, x + dx, y, z + d / 2 + 0.04, p.metal);
      }
      for (let i = 0; i < 2; i++) this.box(g, 0.65, 0.4, 0.85, x - 0.5 + i, h + 0.8, z, p.metal);
    }
  }

  private flow(carrier: Carrier, points: Point[], power: (s: Simulation) => number) {
    const vectors = points.map(v => new THREE.Vector3(...v));
    const curve = new THREE.CurvePath<THREE.Vector3>();
    let start = vectors[0];
    for (let i = 1; i < vectors.length - 1; i++) {
      const previous = vectors[i - 1], corner = vectors[i], next = vectors[i + 1];
      const radius = Math.min(0.4, previous.distanceTo(corner) / 3, corner.distanceTo(next) / 3);
      const entry = corner.clone().add(previous.clone().sub(corner).normalize().multiplyScalar(radius));
      const exit = corner.clone().add(next.clone().sub(corner).normalize().multiplyScalar(radius));
      curve.add(new THREE.LineCurve3(start, entry));
      curve.add(new THREE.QuadraticBezierCurve3(entry, corner, exit));
      start = exit;
    }
    curve.add(new THREE.LineCurve3(start, vectors[vectors.length - 1]));
    const group = new THREE.Group();
    this.scene.add(group);
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.063, 8, false), this.material(p[carrier], 0.3, 0.6));
    group.add(pipe);
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.14, 6, false),
      new THREE.MeshBasicMaterial({ color: p[carrier], transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(halo);
    const particles: THREE.Mesh[] = [];
    const geometry = new THREE.SphereGeometry(0.105, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(p[carrier]).multiplyScalar(2.7) });
    for (let i = 0; i < Math.max(3, Math.floor(curve.getLength() / 1.6)); i++) {
      const particle = new THREE.Mesh(geometry, material);
      group.add(particle);
      particles.push(particle);
    }
    this.flows.push({ carrier, curve, group, particles, power });
  }

  private buildFlows() {
    this.flow('electricity', [[-14, 0.6, -5], [-14, 0.6, -2], [-22, 0.6, -2], [-22, 1, -1]], s => s.pv);
    this.flow('electricity', [[-20, 0.6, -4], [-20, 0.6, -2]], s => s.wind);
    this.flow('electricity', [[-22, 0.6, -2], [-22, 0.6, -3.1], [22, 0.6, -3.1], [22, 0.6, 4]], s => s.electricLoad);
    this.flow('electricity', [[-2, 0.6, -3.1], [-2, 0.6, -6]], s => s.electrolyzer);
    this.flow('electricity', [[-10, 0.6, 2], [-10, 0.6, -3.1]], s => s.chpElectric);
    this.flow('electricity', [[19, 0.6, -6], [19, 0.6, -3.1]], s => s.fuelElectric);
    this.flow('electricity', [[0, 0.6, -3.1], [0, 0.6, 3]], s => s.heatPumpElectric);
    this.flow('electricity', [[7, 0.6, -3.1], [7, 0.6, 3]], s => s.chillerElectric);
    this.flow('electricity', [[-26, 0.6, -1], [-22, 0.6, -1]], s => s.grid);
    this.flow('hydrogen', [[0.6, 1.1, -9.2], [2.5, 1.1, -9.2], [2.5, 1.1, -11.5], [9, 1.1, -11.5], [9, 1.1, -10.2]], s => s.producedHydrogen);
    this.flow('hydrogen', [[11.1, 1.1, -10.2], [14, 1.1, -10.2], [14, 1.1, -9], [17, 1.1, -9]], s => s.fuelHydrogen);
    this.flow('gas', [[-26, 0.8, 7], [-22, 0.8, 7]], s => s.chpGas);
    this.flow('gas', [[-17.5, 0.8, 5], [-14, 0.8, 5], [-14, 0.8, 3], [-12, 0.8, 3]], s => s.chpGas);
    this.flow('heat', [[-7.4, 0.9, 4], [-6, 0.9, 4], [-6, 0.9, -1.8], [18, 0.9, -1.8], [18, 0.9, 4]], s => s.directHeat);
    this.flow('heat', [[19, 0.9, -6], [19, 0.9, -1.8], [18, 0.9, -1.8]], s => s.fuelHeat);
    this.flow('heat', [[2.8, 0.9, 3], [3.5, 0.9, 3], [3.5, 0.9, -1.8]], s => s.heatPumpHeat);
    this.flow('heat', [[5, 0.9, -1.8], [5, 0.9, 3], [6.2, 0.9, 3]], s => s.absorptionHeat);
    this.flow('cold', [[11.8, 0.6, 3], [14, 0.6, 3], [14, 0.6, 9.5], [17, 0.6, 9.5]], s => s.coldLoad);
    for (let x = -17; x <= 17; x += 5) {
      for (const z of [-3.5, -1.3]) this.box(this.scene, 0.1, 0.7, 0.1, x, 0.35, z, p.metalDark);
      this.box(this.scene, 0.14, 0.1, 2.4, x, 0.5, -2.4, p.metalDark);
    }
  }

  private buildSelection() {
    for (const x of [-3.4, 3.4]) {
      for (const z of [-3.1, 3.1]) {
        this.line(this.selection, [[x - Math.sign(x) * 0.85, 0.22, z], [x, 0.22, z], [x, 0.22, z - Math.sign(z) * 0.85]], p.primary, 0.055, 2);
        this.line(this.selection, [[x, 0.22, z], [x, 0.8, z]], p.primary, 0.035, 1.2);
      }
    }
    this.scene.add(this.selection);
  }

  select(id: string) {
    const group = this.groups.get(id);
    if (!group) return;
    this.selection.position.copy(group.position);
    for (const { button } of this.labels) {
      const selected = button.dataset.device === id;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  }

  update(state: Simulation, wind: number, active: boolean) {
    this.state = state;
    this.windSpeed = wind;
    this.active = active;
  }

  setCarrier(carrier: Carrier | null) {
    for (const flow of this.flows) flow.group.visible = !carrier || flow.carrier === carrier;
  }

  setAutoRotate(value: boolean) { this.controls.autoRotate = value; }

  resetView(top = false) {
    this.camera.position.set(...(top ? [0, 66, 0.1] : [32, 30, 38]) as Point);
    this.camera.position.setLength(this.fittedDistance || 58);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  zoom(factor: number) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance));
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  private resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    const distance = Math.max(58, 96 / this.camera.aspect);
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(this.fittedDistance ? offset.length() * distance / this.fittedDistance : distance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.fittedDistance = distance;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  private render(timestamp: number) {
    this.animation = requestAnimationFrame(t => this.render(t));
    const dt = Math.min((timestamp - this.last) / 1000, 0.05);
    this.last = timestamp;
    const moving = this.active && !this.reducedMotion;
    if (moving) {
      this.time += dt;
      for (const rotor of this.rotors) rotor.rotation.z -= dt * (this.windSpeed >= 3 && this.windSpeed < 25 ? this.windSpeed * 0.13 : 0);
      for (const fan of this.fans) fan.rotation.y += dt * 2.5;
    }
    if (this.state) {
      for (const flow of this.flows) {
        const power = flow.power(this.state);
        const speed = Math.min(Math.abs(power) / 200, 2) + 0.5;
        for (let i = 0; i < flow.particles.length; i++) {
          const particle = flow.particles[i];
          particle.visible = Math.abs(power) > 0.01;
          const t = ((i / flow.particles.length + this.time * speed / flow.curve.getLength() * Math.sign(power)) % 1 + 1) % 1;
          particle.position.copy(flow.curve.getPointAt(t));
        }
      }
    }
    this.controls.update();
    const width = this.host.clientWidth, height = this.host.clientHeight;
    for (const { button, position } of this.labels) {
      const projected = position.clone().project(this.camera);
      const visible = this.showLabels && projected.z < 1 && Math.abs(projected.x) < 0.98 && Math.abs(projected.y) < 0.94;
      button.hidden = !visible;
      button.style.transform = `translate(-50%, -100%) translate(${(projected.x * 0.5 + 0.5) * width}px, ${(-projected.y * 0.5 + 0.5) * height}px)`;
    }
    this.composer.render();
    this.frameCount++;
    if (timestamp - this.fpsTime > 1000) {
      this.onFps(Math.round(this.frameCount * 1000 / (timestamp - this.fpsTime)));
      this.frameCount = 0;
      this.fpsTime = timestamp;
    }
  }

  dispose() {
    cancelAnimationFrame(this.animation);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.composer.dispose();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
      }
    });
    this.renderer.dispose();
  }
}
