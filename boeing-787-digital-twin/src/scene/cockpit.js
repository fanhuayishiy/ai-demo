import * as THREE from 'three';
import { profileAt } from './geometry.js';

// Four-window exterior reference, not dimensioned manufacturer glazing.
const PANES = [
  {
    name: 'windshield',
    corners: [
      [-14.23, 0.055],
      [-13.48, 0.055],
      [-12.94, 0.76],
      [-13.67, 1.12],
    ],
  },
  {
    name: 'side',
    corners: [
      [-13.59, 1.15],
      [-12.88, 0.8],
      [-11.95, 0.93],
      [-12.1, 1.27],
    ],
  },
];

function patch(profile, corners, side, inset, lift) {
  const center = corners.reduce(
    (sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4],
    [0, 0],
  );
  const points = corners.map((point) =>
    point.map((value, i) => center[i] + (value - center[i]) * inset),
  );
  const positions = [],
    indices = [],
    uv = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const u = i / steps,
        v = j / steps;
      const weights = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
      const [x, theta] = [0, 1].map((axis) =>
        points.reduce((sum, point, index) => sum + point[axis] * weights[index], 0),
      );
      const radius = profileAt(profile, x) + lift;
      positions.push(x, Math.cos(theta) * radius, side * Math.sin(theta) * radius);
      uv.push(u, v);
      if (i < steps && j < steps) {
        const a = i * (steps + 1) + j,
          b = a + steps + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addCockpit(parent, profile, materials) {
  for (const side of [-1, 1]) {
    for (const pane of PANES) {
      const frame = new THREE.Mesh(
        patch(profile, pane.corners, side, 1.04, 0.014),
        materials.cockpitSeal,
      );
      const glass = new THREE.Mesh(
        patch(profile, pane.corners, side, 0.92, 0.022),
        materials.cockpitGlass,
      );
      glass.name = `cockpit-glass-${pane.name}-${side < 0 ? 'left' : 'right'}`;
      frame.name = `cockpit-frame-${pane.name}-${side < 0 ? 'left' : 'right'}`;
      parent.add(frame, glass);
    }
  }
}
