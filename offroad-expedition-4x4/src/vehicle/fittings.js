import * as THREE from 'three';
import { assembly, beam, box, cylinder, fasteners, lathe, mesh, panel, ring, rod, tube } from './geometry.js';
import { addPlateMarking } from './markings.js';

function headlamp(parent, m, x, y, z, radius) {
  const lamp = assembly(parent, 'round-lamp', [x, y, z]);
  const scale = radius / 0.121;
  lamp.scale.setScalar(scale);
  cylinder(lamp, m.gunmetal, 0.138, 0.023, 0, 0, -0.002, 'z', 40);
  lathe(lamp, m.gunmetal, [[0.136, -0.012], [0.142, 0.003], [0.142, 0.036], [0.131, 0.053], [0.119, 0.053], [0.118, 0.018]], 48);
  lathe(lamp, m.reflector, [[0.128, 0.047], [0.103, 0.033], [0.077, 0.023], [0.044, 0.017], [0.013, 0.013]], 26);
  cylinder(lamp, m.lampCore, 0.019, 0.027, 0, 0, 0.027, 'z', 24);
  ring(lamp, m.rawSteel, 0.123, 0.0085, 0, 0, 0.053);
  ring(lamp, m.gunmetal, 0.136, 0.005, 0, 0, 0.036);
  const cover = mesh(lamp, new THREE.SphereGeometry(0.119, 32, 14), m.lens, 0, 0, 0.053);
  cover.scale.z = 0.14;
  cover.castShadow = false;
  cover.receiveShadow = false;

  const flutes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0017, 1, 0.002), m.reflector, 11);
  const transform = new THREE.Object3D();
  for (let i = 0; i < flutes.count; i++) {
    const stripe = (i - 5) * 0.017;
    transform.position.set(stripe, 0, 0.055);
    transform.scale.y = Math.sqrt(0.112 ** 2 - stripe ** 2) * 2;
    transform.updateMatrix();
    flutes.setMatrixAt(i, transform.matrix);
  }
  lamp.add(flutes);
  return lamp;
}

export function buildFrontFittings(front, m) {
  box(front, m.gunmetal, 0.819, 0.326, 0.034, 0, 1.003, 1.953, 0.024);
  box(front, m.steel, 0.787, 0.291, 0.036, 0, 1.004, 1.977, 0.016);
  box(front, m.seal, 0.745, 0.249, 0.029, 0, 1.004, 1.994, 0.014);
  for (let row = 0; row < 7; row++) {
    const slat = box(front, m.gunmetal, 0.743, 0.014, 0.022, 0, 0.902 + row * 0.034, 2.012, 0.004);
    slat.rotation.x = -0.33;
  }
  for (const x of [-0.281, 0, 0.281]) {
    box(front, m.steel, 0.017, 0.238, 0.013, x, 1.004, 2.009, 0.003);
  }
  fasteners(front, m.rawSteel, [[-0.379, 0.88, 2.005], [0.379, 0.88, 2.005], [-0.379, 1.127, 2.005], [0.379, 1.127, 2.005]], 0.006, 'z');

  const beams = [];
  for (const side of [-1, 1]) {
    box(front, m.olive, 0.328, 0.342, 0.038, side * 0.575, 1.019, 1.95, 0.025);
    headlamp(front, m, side * 0.573, 1.044, 1.967, 0.117);
    cylinder(front, m.seal, 0.056, 0.024, side * 0.726, 0.861, 1.967, 'z', 28);
    cylinder(front, m.amber, 0.045, 0.025, side * 0.726, 0.861, 1.989, 'z', 32);
    ring(front, m.amber, 0.034, 0.0026, side * 0.726, 0.861, 2.003, 24);
    cylinder(front, m.seal, 0.041, 0.021, side * 0.583, 0.856, 1.971, 'z');
    cylinder(front, m.ivory, 0.031, 0.017, side * 0.583, 0.856, 1.985, 'z');

    const light = new THREE.SpotLight(0xffd794, 0, 8, 0.32, 0.83, 1.6);
    light.position.set(side * 0.573, 1.044, 2.047);
    light.target.position.set(side * 0.78, 0.01, 6.37);
    front.add(light, light.target);
    beams.push(light);

    const bonnetLatchX = side * 0.657;
    box(front, m.gunmetal, 0.075, 0.029, 0.089, bonnetLatchX, 1.261, 1.721, 0.009);
    rod(front, m.rawSteel, [bonnetLatchX - 0.023, 1.281, 1.699], [bonnetLatchX + 0.023, 1.281, 1.699], 0.005);
  }

  const snorkel = assembly(front, 'snorkel');
  box(snorkel, m.gunmetal, 0.106, 0.064, 0.17, -0.766, 1.264, 0.795, 0.015);
  tube(snorkel, m.gunmetal, [[-0.782, 1.27, 0.811], [-0.836, 1.32, 0.775], [-0.854, 1.45, 0.731], [-0.82, 1.805, 0.668], [-0.815, 1.936, 0.64]], 0.046, { segments: 38, sides: 14 });
  for (const [x, y, z] of [[-0.847, 1.464, 0.727], [-0.821, 1.805, 0.667]]) {
    rod(snorkel, m.steel, [x + 0.003, y, z], [x + 0.069, y, z - 0.101], 0.012);
    cylinder(snorkel, m.steel, 0.048, 0.024, x, y, z, 'y', 20).rotation.x = -0.13;
  }
  box(snorkel, m.gunmetal, 0.138, 0.092, 0.167, -0.815, 1.938, 0.693, 0.027);
  box(snorkel, m.seal, 0.109, 0.052, 0.012, -0.815, 1.943, 0.773, 0.005);
  for (let i = -2; i <= 2; i++) box(snorkel, m.steel, 0.008, 0.053, 0.009, -0.815 + i * 0.019, 1.943, 0.782, 0.002);
  return beams;
}

export function buildBumpers(root, m) {
  const bumper = assembly(root, 'front-bumper');
  box(bumper, m.steel, 1.352, 0.139, 0.195, 0, 0.603, 2.016, 0.023);
  for (const side of [-1, 1]) {
    panel(bumper, m.steel, [
      [side * 0.602, 0.596, 1.932], [side * 0.889, 0.596, 1.89], [side * 0.895, 0.596, 1.963],
      [side * 0.81, 0.596, 2.068], [side * 0.602, 0.596, 2.085],
    ], 0.131, 0.018);
    box(bumper, m.gunmetal, 0.156, 0.055, 0.04, side * 0.58, 0.623, 2.112, 0.008);
    box(bumper, m.steel, 0.086, 0.088, 0.072, side * 0.526, 0.562, 2.088, 0.008);
    const x = side * 0.526;
    tube(bumper, m.oxide, [[x - 0.038, 0.562, 2.126], [x - 0.034, 0.489, 2.134], [x, 0.471, 2.143], [x + 0.034, 0.489, 2.134], [x + 0.038, 0.562, 2.126]], 0.0115, { segments: 24 });
    rod(bumper, m.rawSteel, [x - 0.046, 0.561, 2.126], [x + 0.047, 0.561, 2.126], 0.011);
  }

  const guard = assembly(bumper, 'brush-guard');
  tube(guard, m.gunmetal, [[-0.419, 0.634, 2.064], [-0.417, 1.083, 2.106], [-0.383, 1.154, 2.11], [-0.325, 1.19, 2.11], [0.325, 1.19, 2.11], [0.383, 1.154, 2.11], [0.417, 1.083, 2.106], [0.419, 0.634, 2.064]], 0.029, { segments: 62, sides: 12 });
  for (const side of [-1, 1]) {
    tube(guard, m.gunmetal, [[side * 0.421, 0.799, 2.09], [side * 0.68, 0.824, 2.08], [side * 0.795, 0.803, 2.015], [side * 0.824, 0.644, 1.999]], 0.02, { segments: 26 });
  }
  fasteners(guard, m.rawSteel, [[-0.438, 0.628, 2.124], [-0.387, 0.628, 2.124], [0.438, 0.628, 2.124], [0.387, 0.628, 2.124]], 0.009, 'z');

  const winch = assembly(bumper, 'winch');
  box(winch, m.gunmetal, 0.44, 0.032, 0.201, 0, 0.664, 2.009, 0.006);
  cylinder(winch, m.steel, 0.051, 0.307, 0, 0.724, 2.002, 'x');
  for (const side of [-1, 1]) {
    cylinder(winch, m.gunmetal, 0.061, 0.029, side * 0.164, 0.724, 2.002, 'x');
    box(winch, m.steel, 0.085, 0.123, 0.117, side * 0.207, 0.721, 2.005, 0.013);
  }
  const coil = Array.from({ length: 169 }, (_, i) => {
    const angle = i * Math.PI / 6;
    return [-0.136 + 0.272 * i / 168, 0.724 + Math.cos(angle) * 0.049, 2.002 + Math.sin(angle) * 0.049];
  });
  tube(winch, m.rawSteel, coil, 0.006, { segments: 168, sides: 6 });
  box(winch, m.gunmetal, 0.367, 0.079, 0.039, 0, 0.695, 2.075, 0.008);
  for (const y of [0.677, 0.715]) cylinder(winch, m.rawSteel, 0.011, 0.285, 0, y, 2.106, 'x', 16);
  for (const x of [-0.152, 0.152]) cylinder(winch, m.rawSteel, 0.011, 0.053, x, 0.696, 2.113, 'y', 16);
  tube(winch, m.rawSteel, [[0.047, 0.722, 2.05], [0.043, 0.694, 2.114], [-0.075, 0.685, 2.148], [-0.237, 0.618, 2.139]], 0.006, { segments: 22 });
  tube(winch, m.steel, [[-0.235, 0.617, 2.14], [-0.256, 0.589, 2.157], [-0.294, 0.595, 2.153], [-0.292, 0.618, 2.139], [-0.275, 0.626, 2.137]], 0.01, { segments: 24 });

  const rear = assembly(root, 'rear-bumper');
  box(rear, m.steel, 1.671, 0.124, 0.204, 0, 0.545, -1.874, 0.019);
  box(rear, m.gunmetal, 0.966, 0.035, 0.159, 0, 0.617, -1.913, 0.01);
  for (const side of [-1, 1]) {
    box(rear, m.gunmetal, 0.23, 0.131, 0.108, side * 0.715, 0.524, -1.922, 0.015);
    box(rear, m.tailLens, 0.083, 0.024, 0.007, side * 0.728, 0.54, -1.979, 0.002);
  }
  box(rear, m.gunmetal, 0.188, 0.113, 0.143, 0, 0.443, -1.849, 0.009);
  box(rear, m.rawSteel, 0.073, 0.066, 0.104, 0, 0.422, -1.963, 0.006);
  cylinder(rear, m.rawSteel, 0.025, 0.054, 0, 0.449, -2.019, 'y', 18);
}

export function buildRearFittings(body, rearDoor, m, wheel) {
  for (const side of [-1, 1]) {
    const x = side * 0.745;
    box(body, m.gunmetal, 0.128, 0.318, 0.044, x, 0.994, -1.89, 0.012);
    for (const [y, material] of [[1.097, m.tailLens], [1.001, m.amber], [0.907, m.ivory]]) {
      box(body, material, 0.096, 0.069, 0.029, x, y, -1.918, 0.01);
      for (const offset of [-0.022, 0, 0.022]) {
        box(body, material, 0.087, 0.004, 0.004, x, y + offset, -1.934, 0.001);
      }
    }
    fasteners(body, m.rawSteel, [[x, 1.15, -1.916], [x, 0.839, -1.916]], 0.005, 'z');
  }
  box(rearDoor, m.gunmetal, 0.277, 0.116, 0.022, -0.394, 0.791, -1.913, 0.009);
  box(rearDoor, m.ivory, 0.243, 0.074, 0.006, -0.394, 0.793, -1.927, 0.004).name = 'registration-plate';
  box(rearDoor, m.gunmetal, 0.159, 0.027, 0.026, -0.394, 0.853, -1.925, 0.005);
  addPlateMarking(rearDoor);

  const carrier = assembly(rearDoor, 'spare-carrier');
  for (const x of [-0.123, 0.262]) {
    box(carrier, m.steel, 0.087, 0.217, 0.027, x, 1.065, -1.918, 0.009);
    beam(carrier, m.gunmetal, [x, 1.047, -1.929], [0.087, 1.105, -2.004], 0.051);
  }
  cylinder(carrier, m.gunmetal, 0.102, 0.143, 0.087, 1.105, -1.96, 'z');
  wheel.name = 'spare-wheel';
  wheel.position.set(0.087, 1.105, -2.064);
  wheel.rotation.set(0, Math.PI, -Math.PI / 5);
  carrier.add(wheel);
}

export function mountRackLamps(rack, m) {
  for (const x of [-0.46, -0.155, 0.155, 0.46]) {
    box(rack, m.steel, 0.082, 0.026, 0.093, x, 2.039, 0.472, 0.006);
    const lamp = headlamp(rack, m, x, 2.092, 0.479, 0.052);
    lamp.rotation.x = -0.065;
  }
}
