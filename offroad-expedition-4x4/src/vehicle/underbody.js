import * as THREE from 'three';
import { chassis } from './body.js';
import { assembly, beam, box, cylinder, fasteners, lathe, mesh, panel, profile, rod, tube } from './geometry.js';

function differential(axle, m, x, y, direction) {
  const casting = mesh(axle, new THREE.SphereGeometry(0.14, 28, 18), m.gunmetal, x, y, 0);
  casting.scale.set(1.16, 0.88, 0.99);
  const seal = cylinder(axle, m.steel, 0.119, 0.03, x, y, direction * 0.103, 'z', 24);
  seal.scale.x = 1.14;
  const cover = mesh(axle, new THREE.SphereGeometry(0.11, 24, 12), m.steel, x, y, direction * 0.107);
  cover.scale.set(1.14, 1.0, 0.52);
  fasteners(axle, m.rawSteel, Array.from({ length: 9 }, (_, i) => {
    const theta = i * Math.PI * 2 / 9;
    return [x + Math.cos(theta) * 0.121, y + Math.sin(theta) * 0.105, direction * 0.122];
  }), 0.009, 'z');
  cylinder(axle, m.steel, 0.048, 0.14, x, y + 0.014, direction * -0.119, 'z', 18);
}

function axleAssembly(frame, m, z, isFront) {
  const y = chassis.axleHeight;
  const axle = assembly(frame, isFront ? 'front-suspension' : 'rear-suspension', [0, 0, z]);
  cylinder(axle, m.gunmetal, 0.053, 1.366, 0, y, 0, 'x', 24);
  differential(axle, m, isFront ? 0.164 : -0.018, y - 0.015, isFront ? 1 : -1);

  for (const side of [-1, 1]) {
    cylinder(axle, m.steel, 0.094, 0.092, side * 0.646, y, 0, 'x', 24);
    cylinder(axle, m.rawSteel, 0.12, 0.018, side * 0.686, y, 0, 'x', 32);
    box(axle, m.gunmetal, 0.051, 0.092, 0.064, side * 0.67, y + 0.063, 0.07, 0.009);
    cylinder(axle, m.steel, 0.078, 0.028, side * 0.528, y + 0.023, 0.096, 'y', 20);
    cylinder(axle, m.steel, 0.076, 0.028, side * 0.528, 0.692, 0.096, 'y', 20);
    const spring = Array.from({ length: 77 }, (_, i) => {
      const angle = i * Math.PI / 7;
      return [side * 0.528 + Math.cos(angle) * 0.06, 0.468 + i * 0.00287, 0.096 + Math.sin(angle) * 0.06];
    });
    tube(axle, m.steel, spring, 0.008, { segments: 86, sides: 8 });

    const lowerShock = [side * 0.541, 0.396, -0.093];
    const upperShock = [side * 0.547, 0.738, -0.182];
    rod(axle, m.oxide, lowerShock, [side * 0.544, 0.592, -0.144], 0.028);
    rod(axle, m.rawSteel, lowerShock, upperShock, 0.011);
    tube(axle, m.seal, [[side * 0.675, 0.494, 0.085], [side * 0.60, 0.55, 0.118], [side * 0.578, 0.602, 0.066], [side * 0.397, 0.569, -0.138]], 0.005, { segments: 23 });

    const span = isFront ? -0.68 : 0.69;
    rod(axle, m.gunmetal, [side * 0.498, y - 0.046, -span * 0.13], [side * 0.415, 0.433, span], 0.032);
    cylinder(axle, m.steel, 0.048, 0.072, side * 0.418, 0.439, span, 'x', 16);
  }

  rod(axle, m.steel, [-0.587, y - 0.056, isFront ? 0.135 : -0.094], [0.555, y + 0.061, isFront ? 0.128 : -0.119], 0.019);
  if (isFront) {
    rod(axle, m.rawSteel, [-0.622, y + 0.015, -0.097], [0.635, y + 0.023, -0.097], 0.013);
    rod(axle, m.gunmetal, [-0.625, y + 0.016, -0.102], [-0.341, 0.589, -0.3], 0.021);
  }
}

export function buildUnderbody(root, m) {
  const frame = assembly(root, 'chassis');
  const railSection = [
    [-1.916, 0.483], [-1.523, 0.5], [-1.31, 0.554], [-1.046, 0.535], [-0.783, 0.431],
    [0.722, 0.429], [1.143, 0.526], [1.522, 0.537], [1.905, 0.5], [1.958, 0.511],
    [1.958, 0.632], [1.515, 0.656], [-1.53, 0.655], [-1.916, 0.61],
  ];
  for (const side of [-1, 1]) {
    profile(frame, m.steel, railSection, 'x', side * 0.417, 0.09, 0.012);
    for (const z of [-1.65, -0.784, 0.585, 1.63]) {
      box(frame, m.gunmetal, 0.26, 0.083, 0.105, side * 0.511, 0.55, z, 0.008);
      fasteners(frame, m.rawSteel, [[side * 0.43, 0.482, z - 0.03], [side * 0.43, 0.482, z + 0.03]], 0.009);
    }
    tube(frame, m.rawSteel, [[side * 0.367, 0.599, 1.5], [side * 0.359, 0.523, 0.519], [side * 0.345, 0.521, -0.668], [side * 0.382, 0.577, -1.68]], 0.006, { segments: 27 });
  }
  for (const z of [-1.794, -0.662, 0.565, 1.781]) box(frame, m.steel, 0.836, 0.103, 0.118, 0, 0.52, z, 0.014);

  axleAssembly(frame, m, chassis.frontAxle, true);
  axleAssembly(frame, m, chassis.rearAxle, false);

  const power = assembly(frame, 'transmission');
  box(power, m.gunmetal, 0.386, 0.199, 0.472, -0.013, 0.518, 0.951, 0.044);
  for (const z of [0.802, 0.894, 0.986, 1.077, 1.169]) {
    box(power, m.steel, 0.324, 0.015, 0.026, -0.013, 0.418, z, 0.005);
  }
  const bell = new THREE.CylinderGeometry(0.156, 0.112, 0.204, 16);
  bell.rotateX(Math.PI / 2);
  mesh(power, bell, m.steel, -0.008, 0.518, 0.606);
  box(power, m.steel, 0.223, 0.212, 0.407, 0.012, 0.504, 0.39, 0.033);
  box(power, m.gunmetal, 0.339, 0.197, 0.189, 0.071, 0.461, 0.127, 0.026);
  const drive = [
    [[0.153, 0.448, 0.208], [0.164, 0.428, 1.099]],
    [[0.003, 0.451, 0.037], [-0.018, 0.431, -1.098]],
  ];
  for (const [start, end] of drive) {
    rod(power, m.rawSteel, start, end, 0.025);
    for (const [x, y, z] of [start, end]) {
      cylinder(power, m.steel, 0.043, 0.058, x, y, z, 'z', 16);
      cylinder(power, m.rawSteel, 0.028, 0.024, x, y, z, 'x', 12);
    }
  }

  const skid = assembly(frame, 'skid-plate');
  const bottom = [[-0.345, 0.376, 0.75], [0.328, 0.376, 0.75], [0.291, 0.376, 1.097], [-0.291, 0.376, 1.097]];
  const drain = [-0.155, -0.052, 0.052, 0.155].map((x) => [
    [x - 0.013, 0.376, 0.858], [x + 0.013, 0.376, 0.858], [x + 0.013, 0.376, 1.008], [x - 0.013, 0.376, 1.008],
  ]);
  panel(skid, m.steel, bottom, 0.022, 0.004, drain);
  panel(skid, m.steel, [[-0.291, 0.376, 1.092], [0.291, 0.376, 1.092], [0.391, 0.507, 1.496], [-0.391, 0.507, 1.496]], 0.018, 0.006);
  for (const x of [-0.284, 0.284]) {
    beam(skid, m.gunmetal, [x, 0.357, 0.782], [x * 0.92, 0.358, 1.069], 0.022, 0.014);
    beam(skid, m.steel, [x, 0.384, 0.787], [x * 1.25, 0.517, 0.651], 0.037);
  }
  fasteners(skid, m.rawSteel, [[-0.246, 0.362, 0.795], [0.246, 0.362, 0.795], [-0.246, 0.362, 1.04], [0.246, 0.362, 1.04]], 0.011);

  const exhaust = assembly(frame, 'exhaust');
  tube(exhaust, m.rawSteel, [
    [0.218, 0.562, 1.045], [0.328, 0.472, 0.795], [0.322, 0.405, 0.328], [0.311, 0.396, -0.317],
  ], 0.024, { segments: 32, sides: 12 });
  box(exhaust, m.rawSteel, 0.194, 0.125, 0.529, 0.313, 0.414, -0.587, 0.044);
  for (const z of [-0.827, -0.348]) box(exhaust, m.steel, 0.18, 0.104, 0.013, 0.313, 0.415, z, 0.024);
  tube(exhaust, m.rawSteel, [
    [0.317, 0.42, -0.834], [0.34, 0.479, -1.045], [0.348, 0.549, -1.217],
    [0.355, 0.564, -1.385], [0.395, 0.411, -1.665], [0.448, 0.413, -1.948],
  ], 0.025, { segments: 40, sides: 12 });
  lathe(exhaust, m.rawSteel, [[0.026, -0.056], [0.03, -0.054], [0.031, 0.011], [0.026, 0.011], [0.026, -0.056]], 24, 0.448, 0.413, -1.964).rotation.y = Math.PI;
  box(frame, m.gunmetal, 0.514, 0.178, 0.502, -0.063, 0.493, -1.546, 0.065);
  for (const x of [-0.212, 0.086]) {
    box(frame, m.steel, 0.035, 0.014, 0.514, x, 0.4, -1.546, 0.005);
  }
}
