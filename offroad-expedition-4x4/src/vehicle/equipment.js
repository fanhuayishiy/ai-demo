import * as THREE from 'three';
import { assembly, beam, box, cylinder, fasteners, mesh, panel, rod, tube } from './geometry.js';

function band(parent, material, points, width) {
  const vertices = [];
  const indices = [];
  points.forEach(([x, y, z], index) => {
    vertices.push(x, y, z - width / 2, x, y, z + width / 2);
    if (index) {
      const a = 2 * index - 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material);
}

function softCargo(parent, material) {
  const geometry = new THREE.SphereGeometry(1, 52, 32);
  const positions = geometry.attributes.position;
  const rounded = (n, power) => Math.sign(n) * Math.abs(n) ** power;
  for (let i = 0; i < positions.count; i++) {
    const x = rounded(positions.getX(i), 0.57);
    const y = rounded(positions.getY(i), 0.52);
    const z = rounded(positions.getZ(i), 0.52);
    const wrinkles = (Math.sin(z * 18 + x * 5) * Math.sin(x * 12 + y) + Math.cos(z * 27 - x * 8) * 0.46) * 0.012;
    positions.setXYZ(i, x * 0.325 * (1 + wrinkles), y * 0.097 * (1 + 2.7 * wrinkles) + z * 0.006, z * 0.468);
  }
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material, -0.31, 2.111, -0.915);
}

function rackOutline(y, width, front, rear) {
  return [
    [-width + 0.11, y, front], [width - 0.11, y, front], [width - 0.036, y, front - 0.023],
    [width, y, front - 0.091], [width, y, rear + 0.09], [width - 0.036, y, rear + 0.025],
    [width - 0.107, y, rear], [-width + 0.107, y, rear], [-width + 0.036, y, rear + 0.025],
    [-width, y, rear + 0.09], [-width, y, front - 0.091], [-width + 0.036, y, front - 0.023],
  ];
}

export function buildRoofRack(body, m) {
  const rack = assembly(body, 'roof-rack');
  tube(rack, m.steel, rackOutline(1.989, 0.707, 0.458, -1.762), 0.019, { segments: 112, sides: 10, closed: true, smooth: false });
  tube(rack, m.gunmetal, rackOutline(2.103, 0.722, 0.481, -1.787), 0.016, { segments: 112, sides: 10, closed: true, smooth: false });
  for (const z of [-1.63, -1.37, -1.11, -0.85, -0.59, -0.33, -0.07, 0.19, 0.411]) {
    box(rack, m.steel, 1.396, 0.024, 0.051, 0, 2.002, z, 0.005);
  }
  for (const side of [-1, 1]) {
    for (const z of [-1.53, -0.685, 0.275]) {
      box(rack, m.seal, 0.084, 0.025, 0.139, side * 0.703, 1.955, z, 0.006);
      box(rack, m.steel, 0.084, 0.049, 0.105, side * 0.688, 1.975, z, 0.007);
      beam(rack, m.steel, [side * 0.709, 1.992, z], [side * 0.72, 2.104, z], 0.024, 0.035);
      cylinder(rack, m.rawSteel, 0.008, 0.009, side * 0.736, 1.975, z + 0.014, 'x', 6);
    }
  }
  for (const x of [-0.54, 0.54]) {
    rod(rack, m.gunmetal, [x, 1.993, -1.754], [x, 2.102, -1.781], 0.012);
    rod(rack, m.gunmetal, [x, 1.993, 0.449], [x, 2.102, 0.477], 0.012);
  }

  const load = assembly(rack, 'roof-load');
  const duffel = softCargo(load, m.canvas);
  duffel.name = 'canvas-duffel';
  duffel.updateWorldMatrix(true, false);
  const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
  tube(load, m.webbing, [[-0.557, 2.126, -0.568], [-0.445, 2.173, -0.517], [-0.231, 2.178, -0.52], [-0.101, 2.111, -0.558]], 0.004, { segments: 28 });
  tube(load, m.saddle, [[-0.405, 2.153, -0.488], [-0.399, 2.173, -0.454], [-0.273, 2.174, -0.459], [-0.264, 2.152, -0.493]], 0.009, { segments: 20 });
  for (const z of [-1.11, -0.59]) {
    const path = [[-0.685, 2.013, z]];
    for (let i = 0; i <= 32; i++) {
      const x = -0.635 + i * 0.021;
      let height = 0;
      for (const sampleZ of [z - 0.017, z, z + 0.017]) {
        ray.ray.origin.set(x, 2.27, sampleZ);
        const [hit] = ray.intersectObject(duffel, false);
        if (hit) height = Math.max(height, hit.point.y);
      }
      if (height) path.push([x, height + 0.003, z]);
    }
    path.push([0.055, 2.014, z]);
    band(load, m.webbing, path, 0.033);
    const [x, y] = path[5];
    box(load, m.rawSteel, 0.032, 0.01, 0.048, x, y + 0.008, z, 0.003).rotation.z = 0.34;
    box(load, m.steel, 0.041, 0.017, 0.042, -0.678, 2.017, z, 0.004);
    box(load, m.steel, 0.041, 0.017, 0.042, 0.053, 2.017, z, 0.004);
  }

  const roll = cylinder(load, m.roll, 0.081, 1.11, 0.018, 2.103, 0.154, 'x', 36);
  roll.scale.x = 0.94;
  for (const x of [-0.548, 0.584]) {
    const spiral = Array.from({ length: 48 }, (_, index) => {
      const phase = index / 47 * Math.PI * 5.4;
      const r = 0.008 + index / 47 * 0.069;
      return [x, 2.103 + Math.sin(phase) * r, 0.154 + Math.cos(phase) * r * 0.94];
    });
    tube(load, m.webbing, spiral, 0.0037, { segments: 58 });
  }
  for (const x of [-0.363, 0.357]) {
    const strap = cylinder(load, m.webbing, 0.084, 0.033, x, 2.102, 0.154, 'x', 36);
    strap.scale.x = 0.96;
    box(load, m.webbing, 0.033, 0.019, 0.101, x, 2.021, 0.163, 0.004);
    box(load, m.rawSteel, 0.046, 0.014, 0.033, x, 2.179, 0.18, 0.004).rotation.x = 0.24;
  }

  const caseBox = box(load, m.jug, 0.402, 0.159, 0.576, 0.386, 2.095, -1.285, 0.03);
  caseBox.name = 'roof-case';
  box(load, m.roll, 0.41, 0.031, 0.582, 0.386, 2.171, -1.285, 0.009);
  for (const z of [-1.37, -1.11]) {
    band(load, m.webbing, [[0.151, 2.013, z], [0.173, 2.14, z], [0.19, 2.19, z], [0.58, 2.19, z], [0.61, 2.152, z], [0.671, 2.014, z]], 0.032);
    box(load, m.rawSteel, 0.041, 0.012, 0.043, 0.566, 2.194, z, 0.004);
  }

  const shovel = assembly(rack, 'shovel');
  rod(shovel, m.saddle, [0.75, 2.063, -1.411], [0.75, 2.061, -0.584], 0.018);
  panel(shovel, m.steel, [[0.753, 2.125, -1.408], [0.76, 2.127, -1.633], [0.763, 2.077, -1.706], [0.762, 2.028, -1.667], [0.753, 2.002, -1.414]], 0.021, 0.008);
  tube(shovel, m.gunmetal, [[0.75, 2.06, -0.62], [0.75, 2.113, -0.525], [0.75, 2.014, -0.525], [0.75, 2.06, -0.62]], 0.012, { segments: 24 });
  for (const z of [-1.305, -0.742]) {
    box(shovel, m.gunmetal, 0.073, 0.058, 0.043, 0.713, 2.056, z, 0.009);
    cylinder(shovel, m.rawSteel, 0.024, 0.033, 0.749, 2.064, z, 'z', 14);
  }
  return rack;
}

export function mountSideEquipment(body, m) {
  const jack = assembly(body, 'recovery-jack');
  const rail = [[-0.869, 1.179, -1.714], [-0.869, 1.179, -0.769], [-0.869, 1.248, -0.769], [-0.869, 1.248, -1.714]];
  const holes = Array.from({ length: 16 }, (_, i) => {
    const z = -1.67 + i * 0.057;
    return [[-0.869, 1.204, z - 0.013], [-0.869, 1.204, z + 0.013], [-0.869, 1.222, z + 0.013], [-0.869, 1.222, z - 0.013]];
  });
  panel(jack, m.oxide, rail, 0.031, 0.003, holes);
  box(jack, m.oxide, 0.097, 0.124, 0.048, -0.867, 1.193, -1.721, 0.01);
  box(jack, m.steel, 0.083, 0.094, 0.162, -0.877, 1.219, -1.451, 0.01);
  rod(jack, m.gunmetal, [-0.884, 1.247, -1.463], [-0.883, 1.264, -0.864], 0.014);
  tube(jack, m.oxide, [[-0.885, 1.251, -0.84], [-0.884, 1.274, -0.818], [-0.882, 1.323, -0.816]], 0.015);
  for (const z of [-0.902, -1.589]) {
    box(jack, m.gunmetal, 0.048, 0.121, 0.05, -0.829, 1.205, z, 0.007);
    box(jack, m.steel, 0.016, 0.116, 0.042, -0.897, 1.213, z, 0.005);
    fasteners(jack, m.rawSteel, [[-0.908, 1.169, z], [-0.908, 1.252, z]], 0.008, 'x');
  }

  const fuel = assembly(body, 'fuel-can');
  box(fuel, m.gunmetal, 0.052, 0.067, 0.349, 0.82, 1.013, -0.901, 0.012);
  beam(fuel, m.steel, [0.83, 1.008, -1.043], [0.914, 1.008, -1.043], 0.029);
  beam(fuel, m.steel, [0.83, 1.008, -0.762], [0.914, 1.008, -0.762], 0.029);
  box(fuel, m.jug, 0.116, 0.283, 0.309, 0.865, 1.174, -0.904, 0.034);
  const ribs = [[1.244, -1.012, 1.10, -0.80], [1.244, -0.80, 1.10, -1.012]];
  for (const [y, z, yy, zz] of ribs) beam(fuel, m.jug, [0.924, y, z], [0.924, yy, zz], 0.016);
  tube(fuel, m.jug, [[0.862, 1.302, -1.025], [0.862, 1.353, -1.009], [0.862, 1.354, -0.866], [0.862, 1.311, -0.839]], 0.012, { segments: 20 });
  cylinder(fuel, m.steel, 0.024, 0.027, 0.87, 1.324, -0.786, 'y', 12).rotation.x = 0.26;
  box(fuel, m.webbing, 0.012, 0.049, 0.337, 0.926, 1.158, -0.905, 0.004);
  for (const z of [-0.738, -1.071]) box(fuel, m.webbing, 0.119, 0.049, 0.014, 0.871, 1.158, z, 0.004);
  box(fuel, m.rawSteel, 0.014, 0.062, 0.044, 0.937, 1.16, -0.968, 0.004);
}
