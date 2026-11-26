import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function group(parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Group();
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

export function box(parent, m, size, p, round = 0) {
  const geometry = round > 0 ? new RoundedBoxGeometry(...size, 2, round) : new THREE.BoxGeometry(...size);
  return mesh(parent, geometry, m, ...p);
}

export function cylinder(parent, m, top, bottom, height, p, axis = 'y', segments = 32) {
  const object = mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), m, ...p);
  if (axis === 'x') object.rotation.z = -Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

export function ring(parent, m, outer, inner, height, p, axis = 'y') {
  const y = height / 2;
  const bevel = Math.min(y * .48, (outer - inner) * .37);
  const profile = [
    [inner, -y], [outer - bevel, -y], [outer, -y + bevel],
    [outer, y - bevel], [outer - bevel, y], [inner, y], [inner, -y],
  ].map(point => new THREE.Vector2(...point));
  const object = mesh(parent, new THREE.LatheGeometry(profile, 48), m, ...p);
  if (axis === 'x') object.rotation.z = -Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

export function tube(parent, m, points, radius, lengthSegments = 20, radialSegments = 8) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return mesh(parent, new THREE.TubeGeometry(curve, lengthSegments, radius, radialSegments, false), m);
}

function contour(path, points, fillet) {
  const vertex = i => new THREE.Vector2(points[i][0], -points[i][1]);
  for (let i = 0; i < points.length; i++) {
    const p = vertex(i);
    const before = p.clone().lerp(vertex((i + points.length - 1) % points.length), fillet);
    const after = p.clone().lerp(vertex((i + 1) % points.length), fillet);
    if (i === 0) path.moveTo(before.x, before.y);
    else path.lineTo(before.x, before.y);
    path.quadraticCurveTo(p.x, p.y, after.x, after.y);
  }
  path.closePath();
  return path;
}

export function plate(parent, m, points, y, thickness, bevel = .025, holes = []) {
  const outline = contour(new THREE.Shape(), points, .16);
  outline.holes = holes.map(points => contour(new THREE.Path(), points, .17));
  const object = mesh(parent, new THREE.ExtrudeGeometry(outline, {
    depth: thickness - 2 * bevel, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 5, steps: 1,
  }), m, 0, y - (thickness - 2 * bevel) / 2, 0);
  object.rotation.x = -Math.PI / 2;
  return object;
}

// Cross sections run from tail to nose. A thin inner skin leaves the cover open underneath.
export function loft(parent, materials, sections, crossSection, strips, thickness) {
  const width = crossSection.length;
  const points = [], uv = [];
  for (const inset of [0, thickness]) {
    for (const [z, halfWidth, crown, depth] of sections) {
      for (const [x, drop] of crossSection) {
        points.push(x * (halfWidth - inset), crown - drop * depth - inset * (1 - .7 * drop), z);
        uv.push((x + 1) * .5, z * .42 + .5);
      }
    }
  }
  const layer = sections.length * width;
  const indices = materials.map(() => []);
  const lip = indices.at(-1);
  for (let section = 1; section < sections.length; section++) {
    const row = (section - 1) * width;
    for (let strip = 0; strip < width - 1; strip++) {
      const a = row + strip, b = a + 1;
      indices[strips[strip]].push(a, a + width, b, b, a + width, b + width);
      lip.push(a + layer, b + layer, a + width + layer, b + layer, b + width + layer, a + width + layer);
    }
    const rim = row + width - 1;
    lip.push(row, row + layer, row + width, row + width, row + layer, row + width + layer);
    lip.push(rim, rim + width, rim + layer, rim + width, rim + width + layer, rim + layer);
  }
  const nose = layer - width;
  for (let j = 0; j < width - 1; j++) {
    lip.push(j, j + 1, j + layer, j + 1, j + 1 + layer, j + layer);
    const k = nose + j;
    lip.push(k, k + layer, k + 1, k + 1, k + layer, k + layer + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices.flat());
  let offset = 0;
  for (const [i, list] of indices.entries()) {
    geometry.addGroup(offset, list.length, i);
    offset += list.length;
  }
  geometry.computeVertexNormals();
  return mesh(parent, geometry, materials);
}

export function bolt(parent, materials, p, radius = .036, axis = 'y') {
  const fastener = group(parent, ...p);
  if (axis === 'x') fastener.rotation.z = -Math.PI / 2;
  if (axis === 'z') fastener.rotation.x = Math.PI / 2;
  cylinder(fastener, materials.steel, radius * .86, radius, radius * .32, [0, 0, 0], 'y', 16);
  cylinder(fastener, materials.black, radius * .40, radius * .40, .002, [0, radius * .17, 0], 'y', 6);
}

export function canvasTexture(width, height, draw, color = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function decal(parent, texture, size, position, rotation = -Math.PI / 2) {
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  const plane = mesh(parent, new THREE.PlaneGeometry(...size), material, ...position);
  plane.rotation.x = rotation;
  plane.castShadow = plane.receiveShadow = false;
  return plane;
}

// Merge stationary details within a removable part into one draw per material.
export function batch(part) {
  part.updateWorldMatrix(true, true);
  const inverse = part.matrixWorld.clone().invert();
  const byMaterial = new Map();
  part.traverse(object => {
    if (!object.isMesh || Array.isArray(object.material) || object.material.transparent) return;
    if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
    byMaterial.get(object.material).push(object);
  });
  for (const [material, objects] of byMaterial) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => {
      const source = object.geometry;
      const geometry = source.index ? source.toNonIndexed() : source.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      for (const key of Object.keys(geometry.attributes)) {
        if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
      }
      return geometry;
    });
    const merged = mergeGeometries(geometries);
    geometries.forEach(geometry => geometry.dispose());
    mesh(part, merged, material);
    for (const object of objects) {
      object.removeFromParent();
      object.geometry.dispose();
    }
  }
}
