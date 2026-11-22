import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const boxes = new Map();
const up = new THREE.Vector3(0, 1, 0);

export function assembly(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.fromArray(position);
  parent?.add(group);
  return group;
}

export function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function box(parent, material, width, height, depth, x, y, z, radius = 0.009) {
  const key = [width, height, depth, radius].join('/');
  if (!boxes.has(key)) {
    const geometry = radius ? new RoundedBoxGeometry(width, height, depth, 1, radius) : new THREE.BoxGeometry(width, height, depth);
    boxes.set(key, geometry);
  }
  return mesh(parent, boxes.get(key), material, x, y, z);
}

export function beam(parent, material, from, to, width, depth = width) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const center = start.lerp(end, 0.5);
  const object = box(parent, material, width, direction.length(), depth, ...center.toArray(), width * 0.17);
  object.quaternion.setFromUnitVectors(up, direction.normalize());
  return object;
}

// Extrude a structural panel in its own plane, with optional openings for glazing.
export function panel(parent, material, corners, depth, bevel = 0.005, holes = []) {
  const origin = new THREE.Vector3(...corners[0]);
  const u = new THREE.Vector3(...corners[1]).sub(origin).normalize();
  const normal = u.clone().cross(new THREE.Vector3(...corners[2]).sub(origin)).normalize();
  const v = normal.clone().cross(u);
  const project = (points) => points.map((point) => {
    const offset = new THREE.Vector3(...point).sub(origin);
    return new THREE.Vector2(offset.dot(u), offset.dot(v));
  });
  const shape = new THREE.Shape(project(corners));
  shape.holes = holes.map((points) => new THREE.Path(project(points)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel * 0.7, bevelSegments: 2, steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.applyMatrix4(new THREE.Matrix4().makeBasis(u, v, normal));
  return mesh(parent, geometry, material, ...origin.toArray());
}

export function profile(parent, material, points, axis, offset, depth, bevel) {
  const corners = points.map(([along, y]) => axis === 'x' ? [offset, y, along] : [along, y, offset]);
  return panel(parent, material, corners, depth, bevel);
}

export function cylinder(parent, material, radius, length, x, y, z, axis = 'y', segments = 24) {
  const key = ['cylinder', radius, length, segments].join('/');
  if (!boxes.has(key)) boxes.set(key, new THREE.CylinderGeometry(radius, radius, length, segments));
  const object = mesh(parent, boxes.get(key), material, x, y, z);
  if (axis === 'x') object.rotation.z = -Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

export function rod(parent, material, from, to, radius, segments = 12) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const center = start.lerp(end, 0.5);
  const object = cylinder(parent, material, radius, delta.length(), ...center.toArray(), 'y', segments);
  object.quaternion.setFromUnitVectors(up, delta.normalize());
  return object;
}

export function ring(parent, material, radius, thickness, x, y, z, segments = 48) {
  const key = ['ring', radius, thickness, segments].join('/');
  if (!boxes.has(key)) boxes.set(key, new THREE.TorusGeometry(radius, thickness, 8, segments));
  return mesh(parent, boxes.get(key), material, x, y, z);
}

export function lathe(parent, material, points, segments, x = 0, y = 0, z = 0) {
  const geometry = new THREE.LatheGeometry(points.map(([radius, axial]) => new THREE.Vector2(radius, axial)), segments);
  geometry.rotateX(Math.PI / 2);
  return mesh(parent, geometry, material, x, y, z);
}

export function tube(parent, material, points, radius, { segments = 32, sides = 8, closed = false, smooth = true } = {}) {
  const vertices = points.map((point) => new THREE.Vector3(...point));
  const curve = smooth ? new THREE.CatmullRomCurve3(vertices, closed) : new THREE.CurvePath();
  if (!smooth) {
    for (let index = 1; index < vertices.length; index++) {
      curve.add(new THREE.LineCurve3(vertices[index - 1], vertices[index]));
    }
    if (closed) curve.closePath();
  }
  return mesh(parent, new THREE.TubeGeometry(curve, segments, radius, sides, closed), material);
}

export function fasteners(parent, material, positions, radius = 0.01, axis = 'y') {
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.07, radius * 0.77, 6);
  if (axis === 'x') geometry.rotateZ(-Math.PI / 2);
  if (axis === 'z') geometry.rotateX(Math.PI / 2);
  const bolts = new THREE.InstancedMesh(geometry, material, positions.length);
  const matrix = new THREE.Matrix4();
  positions.forEach(([x, y, z], index) => bolts.setMatrixAt(index, matrix.makeTranslation(x, y, z)));
  bolts.computeBoundingSphere();
  bolts.receiveShadow = true;
  parent.add(bolts);
  return bolts;
}
