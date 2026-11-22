import * as THREE from 'three';
import { assembly, cylinder, fasteners, lathe, mesh, ring } from './geometry.js';
import { addSidewallMarkings } from './markings.js';

function treadGeometry() {
  const shape = new THREE.Shape([
    [-0.036, -0.029], [0.007, -0.041], [0.033, -0.033], [0.037, 0.017],
    [0.016, 0.032], [-0.027, 0.029], [-0.039, 0.014],
  ].map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.026, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.013, 0);
  return geometry;
}

function tread(parent, m) {
  const sectors = 32;
  const tread = new THREE.InstancedMesh(treadGeometry(), m.tread, sectors * 4);
  tread.name = 'tread-blocks';
  const block = new THREE.Object3D();
  const color = new THREE.Color();
  for (let sector = 0; sector < sectors; sector++) {
    for (let row = 0; row < 4; row++) {
      const outer = row === 0 || row === 3;
      const side = row < 2 ? -1 : 1;
      const phase = sector + (row % 2) * 0.27 + (side < 0 ? 0.15 : 0.5);
      const theta = phase * Math.PI * 2 / sectors;
      const index = sector * 4 + row;
      const radius = outer ? 0.405 : 0.413;
      block.position.set(-Math.sin(theta) * radius, Math.cos(theta) * radius, side * (outer ? 0.092 : 0.036));
      block.rotation.set(side * (outer ? 0.26 : 0.035), side * (outer ? -0.26 : 0.38), theta, 'ZXY');
      block.scale.set(outer ? 0.94 : 0.76, 1, outer ? 1.04 : 0.84);
      block.updateMatrix();
      tread.setMatrixAt(index, block.matrix);
      tread.setColorAt(index, color.setScalar(0.83 + ((index * 37) % 23) * 0.009));
    }
  }
  tread.computeBoundingSphere();
  tread.castShadow = true;
  tread.receiveShadow = true;
  parent.add(tread);
}

function rimFace() {
  const outline = new THREE.Shape();
  outline.absarc(0, 0, 0.234, 0, Math.PI * 2, false);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const hole = new THREE.Path();
    const polar = (radius, phase) => [Math.cos(angle + phase) * radius, Math.sin(angle + phase) * radius];
    hole.moveTo(...polar(0.155, -0.18));
    hole.lineTo(...polar(0.206, -0.17));
    hole.quadraticCurveTo(...polar(0.216, 0), ...polar(0.206, 0.17));
    hole.lineTo(...polar(0.155, 0.18));
    hole.quadraticCurveTo(...polar(0.146, 0), ...polar(0.155, -0.18));
    outline.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(outline, {
    depth: 0.014, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 2, curveSegments: 18,
  });
}

export function buildWheel(m) {
  const wheel = assembly(null, 'wheel');
  lathe(wheel, m.tire, [
    [0.226, -0.112], [0.246, -0.127], [0.28, -0.137], [0.324, -0.143], [0.359, -0.14],
    [0.383, -0.126], [0.402, -0.103], [0.411, -0.066], [0.416, 0], [0.411, 0.066],
    [0.402, 0.103], [0.383, 0.126], [0.359, 0.14], [0.324, 0.143], [0.28, 0.137],
    [0.246, 0.127], [0.226, 0.112], [0.218, 0.102], [0.218, -0.101], [0.226, -0.112],
  ], 80).name = 'tire-carcass';
  tread(wheel, m);
  for (const side of [-1, 1]) {
    ring(wheel, m.rubber, 0.357, 0.003, 0, 0, side * 0.14, 64);
    ring(wheel, m.rubber, 0.275, 0.003, 0, 0, side * 0.138, 64);
  }

  cylinder(wheel, m.gunmetal, 0.226, 0.204, 0, 0, -0.009, 'z', 44);
  lathe(wheel, m.rim, [
    [0.217, -0.115], [0.242, -0.119], [0.25, -0.104], [0.231, -0.079],
    [0.231, 0.102], [0.25, 0.121], [0.251, 0.139], [0.239, 0.151],
    [0.222, 0.148], [0.218, 0.129], [0.217, -0.115],
  ], 64);
  mesh(wheel, rimFace(), m.rim, 0, 0, 0.107);
  cylinder(wheel, m.rim, 0.117, 0.037, 0, 0, 0.132, 'z', 32);
  cylinder(wheel, m.steel, 0.056, 0.071, 0, 0, 0.134, 'z', 24);
  cylinder(wheel, m.rawSteel, 0.031, 0.013, 0, 0, 0.169, 'z', 12);
  cylinder(wheel, m.gunmetal, 0.094, 0.032, 0, 0, -0.113, 'z', 28);
  const lugs = Array.from({ length: 6 }, (_, i) => {
    const theta = i * Math.PI / 3;
    return [Math.cos(theta) * 0.086, Math.sin(theta) * 0.086, 0.154];
  });
  fasteners(wheel, m.rawSteel, lugs, 0.013, 'z');
  cylinder(wheel, m.gunmetal, 0.006, 0.017, 0.179, -0.107, 0.13, 'z', 8);
  addSidewallMarkings(wheel);
  return wheel;
}
