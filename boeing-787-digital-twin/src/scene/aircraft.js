import * as THREE from 'three';
import { cylinderBetween, line, profileAt, shellGeometry, wingGeometry } from './geometry.js';
import { addCockpit } from './cockpit.js';

const BODY = [
  [-15.7, 0.03],
  [-15.25, 0.45],
  [-14.3, 0.9],
  [-12.8, 1.26],
  [-10.5, 1.44],
  [-7, 1.46],
  [4.5, 1.46],
  [8.5, 1.36],
  [10.5, 1.15],
  [12.5, 0.83],
  [14.6, 0.36],
  [15.7, 0.03],
];
export const WING = [
  [1.1, -3, -0.25, 7.1, 0.75],
  [2.5, -2.7, -0.2, 6.5, 0.65],
  [5, -1.55, -0.05, 5.1, 0.47],
  [8, 0.3, 0.17, 3.8, 0.3],
  [11, 2.25, 0.5, 2.5, 0.19],
  [13.6, 4.1, 0.98, 1.45, 0.11],
  [15.1, 6.1, 1.58, 0.22, 0.03],
];

function paint(color, metalness = 0.2, roughness = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    side: THREE.DoubleSide,
    fog: false,
  });
}

function mesh(geometry, material, parent, position) {
  const object = new THREE.Mesh(geometry, material);
  if (position) object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function textDecal(text, color, width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.font = 'italic 500 122px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 512, 100, 1000);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 0.4,
    }),
  );
}

function fuselageWindows(parent, from, to, white, glass) {
  const geo = new THREE.SphereGeometry(1, 10, 8);
  const positions = [];
  for (let x = from; x < to; x += 0.39) {
    if ([-9, -2.8, 3, 8.1].some((d) => Math.abs(d - x) < 0.28)) continue;
    for (const side of [-1, 1]) {
      const r = profileAt(BODY, x);
      positions.push([x, 0.4, side * Math.sqrt(Math.max(0, r * r - 0.16))]);
    }
  }
  const rims = new THREE.InstancedMesh(geo, white, positions.length);
  const windows = new THREE.InstancedMesh(geo, glass, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach((p, i) => {
    dummy.position.set(p[0], p[1], p[2] * 1.003);
    dummy.scale.set(0.102, 0.145, 0.031);
    dummy.updateMatrix();
    rims.setMatrixAt(i, dummy.matrix);
    dummy.position.z = p[2] * 1.017;
    dummy.scale.set(0.076, 0.111, 0.025);
    dummy.updateMatrix();
    windows.setMatrixAt(i, dummy.matrix);
  });
  parent.add(rims, windows);
  for (const x of [-9, -2.8, 3, 8.1].filter((v) => v >= from && v <= to)) {
    for (const side of [-1, 1]) {
      const points = [];
      for (let j = 0; j <= 44; j++) {
        const a = (j / 44) * Math.PI * 2;
        const px = x + Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.4 * 0.28;
        const y = -0.05 + Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.4 * 0.71;
        const r = profileAt(BODY, px);
        points.push([px, y, side * (Math.sqrt(r * r - y * y) + 0.012)]);
      }
      parent.add(line(points, 0x91a2a9, 0.8));
    }
  }
}

function buildEngine(parent, side, materials, fans) {
  const engine = new THREE.Group();
  engine.position.set(-2.8, -1.85, side * 5.05);
  parent.add(engine);
  const profile = [
    [-1.9, 0.92],
    [-1.65, 1.04],
    [-0.8, 1.08],
    [0.5, 0.97],
    [1.5, 0.77],
  ];
  const cowling = mesh(shellGeometry(profile, -1.9, 1.5), materials.white, engine);
  cowling.name = 'engine-cowling';
  for (const x of [-0.95, 0.85]) {
    const radius = profileAt(profile, x) + 0.009;
    cowling.add(
      line(
        Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [x, Math.cos(angle) * radius, Math.sin(angle) * radius];
        }),
        0x71818b,
        0.55,
      ),
    );
  }
  const lip = mesh(
    new THREE.TorusGeometry(0.914, 0.087, 16, 64),
    materials.metal,
    engine,
    [-1.88, 0, 0],
  );
  lip.rotation.y = Math.PI / 2;
  mesh(
    shellGeometry(
      [
        [-1.88, 0.86],
        [-1.35, 0.83],
      ],
      -1.88,
      -1.35,
    ),
    materials.graphite,
    engine,
  );
  const fan = new THREE.Group();
  fan.position.x = -1.39;
  engine.add(fan);
  fans.push(fan);
  const fanDisk = mesh(new THREE.CylinderGeometry(0.83, 0.83, 0.07, 48), materials.dark, fan);
  fanDisk.rotation.z = Math.PI / 2;
  for (let j = 0; j < 22; j++) {
    const a = (j / 22) * Math.PI * 2;
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.14, 0);
    bladeShape.quadraticCurveTo(0.45, -0.09, 0.81, 0.03);
    bladeShape.lineTo(0.79, 0.17);
    bladeShape.quadraticCurveTo(0.4, 0.03, 0.14, 0.05);
    const blade = mesh(
      new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.025,
        bevelEnabled: false,
        curveSegments: 5,
      }),
      materials.blade,
      fan,
    );
    blade.rotation.set(Math.PI / 2, 0, a);
    blade.rotation.y = Math.PI / 2;
    // Align radial blade coordinates to the engine's YZ plane.
    blade.quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
    blade.rotateZ(a);
    blade.position.x = -0.065;
  }
  const spinner = mesh(new THREE.ConeGeometry(0.23, 0.5, 32), materials.metal, fan, [-0.2, 0, 0]);
  spinner.rotation.z = Math.PI / 2;
  const core = mesh(
    new THREE.CylinderGeometry(0.5, 0.35, 2.8, 40),
    materials.graphite,
    engine,
    [0.4, 0, 0],
  );
  core.rotation.z = Math.PI / 2;
  const services = new THREE.Group();
  services.name = 'engine-service-lines';
  engine.add(services);
  for (const angle of [0.55, 2.15, 3.7, 5.3]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.75, Math.cos(angle) * 0.51, Math.sin(angle) * 0.51),
      new THREE.Vector3(-0.2, Math.cos(angle) * 0.65, Math.sin(angle) * 0.65),
      new THREE.Vector3(0.7, Math.cos(angle + 0.3) * 0.64, Math.sin(angle + 0.3) * 0.64),
      new THREE.Vector3(1.3, Math.cos(angle + 0.3) * 0.41, Math.sin(angle + 0.3) * 0.41),
    ]);
    mesh(new THREE.TubeGeometry(curve, 24, 0.024, 6, false), materials.copper, services);
  }
  const fasteners = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6),
    materials.metal,
    48,
  );
  fasteners.name = 'engine-flange-fasteners';
  const bolt = new THREE.Object3D();
  for (let i = 0; i < 48; i++) {
    const angle = ((i % 24) / 24) * Math.PI * 2;
    bolt.position.set(i < 24 ? -0.38 : 1.05, Math.cos(angle) * 0.52, Math.sin(angle) * 0.52);
    bolt.rotation.z = Math.PI / 2;
    bolt.updateMatrix();
    fasteners.setMatrixAt(i, bolt.matrix);
  }
  services.add(fasteners);
  for (let i = 0; i < 10; i++) {
    const ring = mesh(
      new THREE.TorusGeometry(0.47 - i * 0.013, 0.035, 8, 32),
      materials.metal,
      engine,
      [i * 0.18, 0, 0],
    );
    ring.rotation.y = Math.PI / 2;
  }
  const exhaust = mesh(
    new THREE.ConeGeometry(0.32, 1.05, 40),
    materials.metal,
    engine,
    [2.05, 0, 0],
  );
  exhaust.rotation.z = -Math.PI / 2;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const g = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          1.4,
          Math.cos(a) * 0.78,
          Math.sin(a) * 0.78,
          1.78,
          Math.cos(a + 0.13) * 0.66,
          Math.sin(a + 0.13) * 0.66,
          1.4,
          Math.cos(a + 0.3) * 0.78,
          Math.sin(a + 0.3) * 0.78,
        ],
        3,
      ),
    );
    g.computeVertexNormals();
    mesh(g, materials.white, cowling);
  }
  const pylon = new THREE.Shape();
  pylon.moveTo(-0.7, 0.85);
  pylon.lineTo(0.15, 1.9);
  pylon.lineTo(2.1, 2);
  pylon.lineTo(1.25, 0.75);
  pylon.closePath();
  for (const x of [0.2, 0.95]) {
    engine.add(cylinderBetween([x, 0.43, -0.15], [x, 1.1, 0], 0.065, materials.metal));
    engine.add(cylinderBetween([x, 0.43, 0.15], [x, 1.1, 0], 0.065, materials.metal));
  }
  mesh(
    new THREE.ExtrudeGeometry(pylon, { depth: 0.22, bevelEnabled: false }),
    materials.white,
    engine,
    [0, 0, -0.11],
  );
  engine.userData.cowling = cowling;
  return engine;
}

export function createAircraft() {
  const root = new THREE.Group();
  root.name = 'Boeing-787-9';
  const materials = {
    white: paint(0xdce4e8, 0.32, 0.28),
    metal: paint(0x9cafbc, 0.84, 0.22),
    glass: paint(0x122735, 0.64, 0.15),
    cockpitSeal: paint(0x263438, 0.25, 0.44),
    cockpitGlass: new THREE.MeshPhysicalMaterial({
      color: 0x13212a,
      metalness: 0.35,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
      emissiveIntensity: 0,
    }),
    graphite: paint(0x25343c, 0.67, 0.4),
    dark: paint(0x091319, 0.3, 0.52),
    blade: paint(0x72858e, 0.85, 0.28),
    teal: paint(0x176b80, 0.45, 0.3),
    frame: paint(0x668f91, 0.63, 0.35),
    seat: paint(0x214451, 0.15, 0.62),
    seatHead: paint(0xa8b9b9, 0.1, 0.7),
    tire: paint(0x151c1f, 0.05, 0.86),
    deck: paint(0x596b70, 0.5, 0.55),
    copper: paint(0xaf8563, 0.77, 0.32),
  };
  const definitions = [
    ['nose', [-13, 0.9, 0], [-4.3, 0.5, 0]],
    ['fuselage', [-3, 1.4, 0], [0, 0, 0]],
    ['wing-left', [2, 0.3, -8], [0, 0.4, -4.6]],
    ['wing-right', [2, 0.3, 8], [0, 0.4, 4.6]],
    ['engine-left', [-3, -1.6, -5.05], [-0.8, -3, -2.2]],
    ['engine-right', [-3, -1.6, 5.05], [-0.8, -3, 2.2]],
    ['tail', [13, 3, 0], [4.3, 1.2, 0]],
    ['cabin', [-2, 0.5, 0], [0, 0.8, 0]],
    ['landing-gear', [0, -2.3, 0], [0, -2.2, 0]],
  ];
  materials.cockpitGlass.userData.preserveTint = true;
  materials.cockpitSeal.userData.preserveTint = true;
  const parts = definitions.map(([id, anchor, offset]) => {
    const group = new THREE.Group();
    group.name = id;
    root.add(group);
    return {
      id,
      group,
      anchor: new THREE.Vector3(...anchor),
      offset: new THREE.Vector3(...offset),
    };
  });
  const groups = Object.fromEntries(parts.map((p) => [p.id, p.group]));

  mesh(shellGeometry(BODY, -15.7, -10.5), materials.white, groups.nose);
  fuselageWindows(groups.nose, -11.3, -10.5, materials.metal, materials.glass);
  addCockpit(groups.nose, BODY, materials);
  const topShell = new THREE.Group();
  topShell.name = 'upper-fuselage-shell';
  groups.fuselage.add(topShell);
  mesh(shellGeometry(BODY, -10.5, 9, -Math.PI / 2, Math.PI / 2), materials.white, topShell);
  const lowerShell = new THREE.Group();
  groups.fuselage.add(lowerShell);
  mesh(shellGeometry(BODY, -10.5, 9, Math.PI / 2, Math.PI * 1.5), materials.white, lowerShell);
  fuselageWindows(topShell, -10.4, 8.8, materials.metal, materials.glass);
  for (let x = -10.4; x <= 9; x += 3.2) {
    const points = Array.from({ length: 65 }, (_, j) => {
      const a = -Math.PI / 2 + (j / 64) * Math.PI;
      const r = profileAt(BODY, x) * 1.001;
      return [x, Math.cos(a) * r, Math.sin(a) * r];
    });
    topShell.add(line(points, 0x9dafb6, 0.35));
  }
  for (const side of [-1, 1]) {
    const stripe = mesh(
      shellGeometry(BODY, -12.5, 10.4, side > 0 ? 1.68 : -1.87, side > 0 ? 1.87 : -1.68, 1.005),
      materials.teal,
      root,
    );
    stripe.userData.componentId = 'fuselage';
    stripe.name = 'livery-stripe';
    const decal = textDecal('787 DREAMLINER', '#326374', 5, 0.53);
    if (decal) {
      decal.position.set(-6.1, 0.77, side * 1.26);
      if (side < 0) decal.rotation.y = Math.PI;
      topShell.add(decal);
    }
  }

  const skeleton = new THREE.Group();
  skeleton.name = 'internal-frames';
  groups.fuselage.add(skeleton);
  for (let x = -10; x < 9; x += 0.66) {
    const r = profileAt(BODY, x) * 0.955;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 35 }, (_, j) => {
        const angle = 1.65 + (j / 34) * (Math.PI * 2 - 1.53);
        return new THREE.Vector3(x, Math.cos(angle) * r, Math.sin(angle) * r);
      }),
    );
    mesh(new THREE.TubeGeometry(curve, 40, 0.025, 5, false), materials.frame, skeleton);
  }
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2;
    if (a > 0.12 && a < 1.65) continue;
    const points = Array.from({ length: 40 }, (_, i) => {
      const x = -10 + (i / 39) * 18.7,
        r = profileAt(BODY, x) * 0.95;
      return [x, Math.cos(a) * r, Math.sin(a) * r];
    });
    skeleton.add(line(points, 0x92b2ac));
  }
  const cabin = groups.cabin;
  mesh(new THREE.BoxGeometry(19.3, 0.09, 2.58), materials.deck, cabin, [-0.5, -0.21, 0]);
  const seatPositions = [];
  for (let row = 0; row < 29; row++) {
    for (const z of [-1.05, -0.8, -0.55, -0.13, 0.13, 0.55, 0.8, 1.05])
      seatPositions.push([-9.6 + row * 0.62, 0.02, z]);
  }
  const seatBase = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.31, 0.12, 0.205),
    materials.seat,
    seatPositions.length,
  );
  const seatBack = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 0.44, 0.205),
    materials.seat,
    seatPositions.length,
  );
  const heads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.085, 0.085, 0.17),
    materials.seatHead,
    seatPositions.length,
  );
  const dummy = new THREE.Object3D();
  seatPositions.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    seatBase.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + 0.15, y + 0.19, z);
    dummy.updateMatrix();
    seatBack.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y + 0.37;
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  cabin.add(seatBase, seatBack, heads);
  const armrests = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.3, 0.035, 0.024),
    materials.seatHead,
    seatPositions.length * 2,
  );
  armrests.name = 'seat-armrests';
  seatPositions.forEach(([x, y, z], i) => {
    for (const [j, side] of [-1, 1].entries()) {
      dummy.position.set(x, y + 0.15, z + side * 0.108);
      dummy.updateMatrix();
      armrests.setMatrixAt(i * 2 + j, dummy.matrix);
    }
  });
  cabin.add(armrests);
  for (const z of [-0.34, 0.34]) {
    mesh(new THREE.BoxGeometry(18.7, 0.005, 0.028), materials.seatHead, cabin, [-0.5, -0.161, z]);
  }
  for (let x = -9.5; x < 9; x += 1.3)
    mesh(new THREE.BoxGeometry(0.08, 0.13, 2.67), materials.metal, cabin, [x, -0.34, 0]);
  for (const z of [-0.8, 0.8])
    mesh(new THREE.BoxGeometry(18.8, 0.55, 0.84), materials.graphite, cabin, [-0.6, -0.84, z]);

  for (const side of [-1, 1]) {
    const wing = groups[side < 0 ? 'wing-left' : 'wing-right'];
    mesh(wingGeometry(WING, side), materials.white, wing);
    mesh(wingGeometry(WING.slice(-2), side), materials.teal, wing);
    for (const chord of [0.16, 0.66, 0.86]) {
      wing.add(
        line(
          WING.slice(0, -1).map(([z, x, y, c, thick]) => [
            x + c * chord,
            y + thick * 0.5 + 0.025,
            z * side,
          ]),
          0x70888f,
          0.6,
        ),
      );
    }
    for (let i = 1; i < WING.length - 1; i++) {
      const [z, x, y, chord, thickness] = WING[i];
      wing.add(
        line(
          [
            [x + chord * 0.67, y + thickness * 0.45 + 0.018, z * side],
            [x + chord * 0.97, y + 0.015, z * side],
          ],
          0x6c8088,
          0.75,
        ),
      );
    }
    for (const [z, x, y] of [WING[1], WING[2], WING[3]]) {
      const fairing = mesh(new THREE.SphereGeometry(1, 16, 10), materials.white, wing, [
        x + 4,
        y - 0.24,
        side * z,
      ]);
      fairing.scale.set(1.1, 0.15, 0.15);
    }
    const navMaterial = new THREE.MeshBasicMaterial({ color: side < 0 ? 0xee716c : 0x7de2c2 });
    mesh(new THREE.SphereGeometry(0.055, 8, 8), navMaterial, wing, [6.12, 1.6, side * 15.09]);
  }
  const fans = [];
  const engines = [
    buildEngine(groups['engine-left'], -1, materials, fans),
    buildEngine(groups['engine-right'], 1, materials, fans),
  ];

  const tail = groups.tail;
  mesh(shellGeometry(BODY, 9, 15.7), materials.white, tail);
  for (const side of [-1, 1])
    mesh(
      wingGeometry(
        [
          [0.6, 8.9, 0.55, 4.6, 0.35],
          [2.5, 10.1, 0.83, 3.3, 0.22],
          [5.8, 13.2, 1.45, 0.8, 0.07],
        ],
        side,
      ),
      materials.white,
      tail,
    );
  const fin = new THREE.Shape();
  fin.moveTo(8.8, 0.7);
  fin.quadraticCurveTo(10.5, 1.4, 12.95, 6.15);
  fin.lineTo(14.35, 6.15);
  fin.lineTo(14.6, 0.65);
  fin.closePath();
  mesh(
    new THREE.ExtrudeGeometry(fin, {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.075,
      bevelThickness: 0.06,
      curveSegments: 22,
    }),
    materials.teal,
    tail,
    [0, 0, -0.075],
  );
  tail.add(
    line(
      [
        [13.85, 6.12, 0.16],
        [13.95, 2, 0.2],
        [14.1, 1.1, 0.24],
      ],
      0x5d9fa9,
    ),
  );
  for (const side of [-1, 1]) {
    const decal = textDecal('787', '#e3f3f4', 1.65, 0.72);
    if (decal) {
      decal.position.set(13.38, 3.75, side * 0.17);
      if (side < 0) decal.rotation.y = Math.PI;
      tail.add(decal);
    }
  }

  const gear = groups['landing-gear'];
  const gearPivots = [];
  for (const [x, z, main] of [
    [-11.2, 0, false],
    [1.5, -2, true],
    [1.5, 2, true],
  ]) {
    const previousChildren = new Set(gear.children);
    const torqueLinks = new THREE.Group();
    torqueLinks.name = 'gear-torque-links';
    gear.add(torqueLinks);
    const bottom = main ? -3 : -2.95;
    gear.add(cylinderBetween([x, -0.8, z], [x + 0.25, bottom, z], 0.065, materials.metal));
    gear.add(cylinderBetween([x - 0.7, -1, z], [x + 0.2, -2.6, z], 0.04, materials.metal));
    gear.add(cylinderBetween([x + 0.1, -1.5, z], [x + 0.24, -2.65, z], 0.097, materials.graphite));
    for (const side of [-1, 1]) {
      const knee = [x + 0.58, -2.15, z + side * 0.09];
      torqueLinks.add(
        cylinderBetween([x + 0.14, -1.75, z + side * 0.09], knee, 0.027, materials.metal),
      );
      torqueLinks.add(
        cylinderBetween(knee, [x + 0.22, -2.55, z + side * 0.09], 0.027, materials.metal),
      );
    }
    gear.add(
      cylinderBetween(
        [x + 0.25, bottom, z - 0.3],
        [x + 0.25, bottom, z + 0.3],
        0.065,
        materials.metal,
      ),
    );
    for (const dx of main ? [-0.38, 0.38] : [0]) {
      for (const dz of [-0.2, 0.2]) {
        const tire = mesh(
          new THREE.TorusGeometry(main ? 0.28 : 0.2, main ? 0.115 : 0.09, 10, 22),
          materials.tire,
          gear,
          [x + 0.25 + dx, bottom, z + dz],
        );
        const hub = mesh(
          new THREE.CylinderGeometry(main ? 0.19 : 0.12, main ? 0.19 : 0.12, 0.16, 16),
          materials.metal,
          gear,
          tire.position.toArray(),
        );
        hub.rotation.x = Math.PI / 2;
      }
    }
    const pivot = new THREE.Group();
    pivot.name = main ? `main-gear-pivot-${z < 0 ? 'left' : 'right'}` : 'nose-gear-pivot';
    pivot.position.set(x, -0.8, z);
    const assembly = new THREE.Group();
    assembly.position.set(-x, 0.8, -z);
    for (const child of [...gear.children]) {
      if (!previousChildren.has(child)) assembly.add(child);
    }
    pivot.add(assembly);
    gear.add(pivot);
    gearPivots.push({ pivot, main, z });
  }

  for (const part of parts) {
    const materialCopies = new Map();
    part.group.traverse((object) => {
      if (object.isMesh) {
        object.userData.componentId = part.id;
        if (!materialCopies.has(object.material))
          materialCopies.set(object.material, object.material.clone());
        object.material = materialCopies.get(object.material);
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    part.materials = [...materialCopies.values()];
  }
  let previousSelected, previousHovered;
  function update({
    mode = 'assembled',
    explosion = 0,
    selected = null,
    hovered = null,
    focused = null,
    time = 0,
    gearExtension = 1,
  } = {}) {
    const amount = THREE.MathUtils.clamp(Number(explosion) || 0, 0, 1);
    for (const { pivot, main, z } of gearPivots) {
      const retraction = 1 - THREE.MathUtils.clamp(gearExtension, 0, 1);
      const fold = THREE.MathUtils.smoothstep(retraction, main ? 0.04 : 0, main ? 1 : 0.92);
      pivot.rotation.set(main ? Math.sign(z) * fold * 1.48 : 0, 0, main ? 0 : fold * 1.48);
      // Stow inside the fuselage; the skin occludes the gear instead of a visibility switch.
      pivot.position.y = -0.8 + 0.65 * THREE.MathUtils.smoothstep(fold, 0.45, 1);
    }
    for (const part of parts) {
      part.group.position.copy(part.offset).multiplyScalar(amount);
      part.group.visible = !focused || part.id === focused;
    }
    topShell.position.y = amount * 4.2;
    lowerShell.position.y = -amount * 0.65;
    topShell.visible = mode !== 'cutaway';
    skeleton.visible = mode === 'cutaway' || amount > 0.015;
    cabin.visible = (mode === 'cutaway' || amount > 0.015) && (!focused || focused === 'cabin');
    engines.forEach((e) => {
      e.userData.cowling.visible = mode !== 'cutaway';
    });
    root.children
      .filter((o) => o.name === 'livery-stripe')
      .forEach((o) => {
        o.visible = mode === 'assembled' && amount < 0.02 && !focused;
      });
    fans.forEach((fan) => {
      fan.rotation.x = time * 1.8;
    });
    if (selected !== previousSelected || hovered !== previousHovered) {
      for (const part of parts) {
        part.materials.forEach((material) => {
          if (material.emissive && !material.userData.preserveTint) {
            material.emissive.set(
              part.id === selected ? 0x227e6c : part.id === hovered ? 0x476b80 : 0x000000,
            );
            material.emissiveIntensity =
              part.id === selected ? 0.35 : part.id === hovered ? 0.18 : 0;
          }
        });
      }
      previousSelected = selected;
      previousHovered = hovered;
    }
  }
  update();
  function dispose() {
    const geometries = new Set(),
      allMaterials = new Set(Object.values(materials)),
      textures = new Set();
    root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) allMaterials.add(object.material);
    });
    allMaterials.forEach((material) => {
      if (material.map) textures.add(material.map);
      material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
    geometries.forEach((geometry) => geometry.dispose());
  }
  return { root, parts, update, dispose };
}
