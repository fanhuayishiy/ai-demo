import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const V = p => new THREE.Vector3(...p);
const catmull = (a, b, c, d, t) => .5 * (
  2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t +
  (-a + 3 * b - 3 * c + d) * t * t * t
);

export const oval = (x, y, rx, ry, count = 32) => Array.from({length: count}, (_, i) => [
  x + Math.cos(i / count * TAU) * rx, y + Math.sin(i / count * TAU) * ry,
]);

export function sampleLoft(stations, fraction) {
  const u = THREE.MathUtils.clamp(fraction, 0, 1) * (stations.length - 1);
  const j = Math.min(stations.length - 2, Math.floor(u)), t = u - j;
  return Array.from({length: 5}, (_, k) => catmull(
    stations[Math.max(0, j - 1)][k], stations[j][k], stations[j + 1][k],
    stations[Math.min(stations.length - 1, j + 2)][k], t,
  ));
}

/** A closed, section-built casting, with a changing centre, depth and width.
 * Stations: [x, y, z, half-width in Z, half-height in Y]. */
export function loftHull(stations, {steps = 40, profile = null, opening = null} = {}) {
  profile ||= Array.from({length: 16}, (_, i) => [Math.cos(i / 16 * TAU), Math.sin(i / 16 * TAU)]);
  const positions = [], uv = [], indices = [], n = profile.length;
  for (let i = 0; i <= steps; i++) {
    const p = sampleLoft(stations, i / steps);
    for (let k = 0; k < n; k++) {
      positions.push(p[0], p[1] + profile[k][0] * Math.max(.001, p[4]), p[2] + profile[k][1] * Math.max(.001, p[3]));
      uv.push(i / steps, k / n);
      if (i === steps) continue;
      if (opening?.((i + .5) / steps, profile[k], profile[(k + 1) % n])) continue;
      const a = i * n + k, b = (i + 1) * n + k, c = (i + 1) * n + (k + 1) % n, d = i * n + (k + 1) % n;
      indices.push(a, d, b, d, c, b);
    }
  }
  // Separate cap vertices prevent smoothing across the end faces.
  for (const end of [0, steps]) {
    const base = positions.length / 3;
    const p = stations[end === 0 ? 0 : stations.length - 1];
    positions.push(p[0], p[1], p[2]); uv.push(.5, .5);
    for (let k = 0; k < n; k++) {
      const at = (end * n + k) * 3;
      positions.push(...positions.slice(at, at + 3)); uv.push((profile[k][0] + 1) / 2, (profile[k][1] + 1) / 2);
    }
    for (let k = 0; k < n; k++) {
      const a = base + 1 + k, b = base + 1 + (k + 1) % n;
      indices.push(base, end === 0 ? b : a, end === 0 ? a : b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** An elliptical, tapered sweep. Used for cast arches, recurved crowns and conduits. */
export function taperedSweep(points, radius, {segments = 48, radial = 12, flatten = 1} = {}) {
  const path = new THREE.CatmullRomCurve3(points.map(V));
  const frames = path.computeFrenetFrames(segments, false);
  const positions = [], uv = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, p = path.getPointAt(t), r = typeof radius === 'function' ? radius(t) : radius;
    for (let j = 0; j < radial; j++) {
      const a = j / radial * TAU;
      const v = p.clone().addScaledVector(frames.normals[i], Math.cos(a) * r)
        .addScaledVector(frames.binormals[i], Math.sin(a) * r * flatten);
      positions.push(v.x, v.y, v.z); uv.push(t, j / radial);
      if (i === segments) continue;
      const at = i * radial + j, next = i * radial + (j + 1) % radial;
      indices.push(at, next, at + radial, next, next + radial, at + radial);
    }
  }
  for (const end of [0, segments]) {
    const p = path.getPointAt(end / segments), base = positions.length / 3;
    positions.push(p.x, p.y, p.z); uv.push(.5, .5);
    for (let j = 0; j < radial; j++) {
      const a = end * radial + j, b = end * radial + (j + 1) % radial;
      indices.push(base, end === 0 ? b : a, end === 0 ? a : b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Split every shared edge once and retriangulate both neighbours with the same
 * midpoint. Independent triangle refinement creates T-junctions when warped. */
function refineCastSurface(input, maxLength = .14, passes = 4) {
  input.deleteAttribute('normal');
  input.deleteAttribute('uv');
  const welded = mergeVertices(input, 1e-6);
  const positions = Array.from(welded.getAttribute('position').array);
  let indices = Array.from(welded.getIndex().array);
  const edgeKey = (a, b) => a < b ? `${a}/${b}` : `${b}/${a}`;
  for (let pass = 0; pass < passes; pass++) {
    const midpoints = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = indices[i + k], b = indices[i + (k + 1) % 3], key = edgeKey(a, b);
        if (midpoints.has(key)) continue;
        const distance = [0, 1, 2].reduce((sum, c) => sum + (positions[a * 3 + c] - positions[b * 3 + c]) ** 2, 0);
        if (distance <= maxLength * maxLength) continue;
        midpoints.set(key, positions.length / 3);
        for (let c = 0; c < 3; c++) positions.push((positions[a * 3 + c] + positions[b * 3 + c]) / 2);
      }
    }
    if (!midpoints.size) break;
    const next = [];
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.slice(i, i + 3);
      const ab = midpoints.get(edgeKey(a, b)), bc = midpoints.get(edgeKey(b, c)), ca = midpoints.get(edgeKey(c, a));
      const mask = (ab !== undefined ? 1 : 0) | (bc !== undefined ? 2 : 0) | (ca !== undefined ? 4 : 0);
      if (mask === 0) next.push(a, b, c);
      else if (mask === 1) next.push(a, ab, c, ab, b, c);
      else if (mask === 2) next.push(b, bc, a, bc, c, a);
      else if (mask === 4) next.push(c, ca, b, ca, a, b);
      else if (mask === 3) next.push(b, bc, ab, a, ab, c, ab, bc, c);
      else if (mask === 6) next.push(c, ca, bc, b, bc, a, bc, ca, a);
      else if (mask === 5) next.push(a, ab, ca, c, ca, b, ca, ab, b);
      else next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  welded.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** Form a bevelled plate around the changing lateral surface of the skull.
 * The two sides have proper outward winding, including the walls of every opening. */
export function castPanel(outline, holes, depth, surface, side = 1, bevel = .012) {
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  for (const loop of holes) {
    const hole = new THREE.Path();
    loop.forEach(([x, y], i) => i ? hole.lineTo(x, y) : hole.moveTo(x, y));
    hole.closePath(); shape.holes.push(hole);
  }
  const extrusion = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 3, curveSegments: 16, steps: 2,
  });
  // Curve the whole face, not just its silhouette vertices. Welding then gives the
  // casting continuous normals instead of visible triangles around the windows.
  let geometry = refineCastSurface(extrusion);
  extrusion.dispose();
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    positions.setZ(i, side * (surface(x, y) + z - depth / 2));
  }
  if (side < 0) {
    const index = geometry.getIndex();
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2)); index.setX(i + 2, b);
    }
  }
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const unwelded = geometry;
  geometry = mergeVertices(unwelded, 1e-5);
  unwelded.dispose();
  const p = geometry.getAttribute('position'), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getY(i); }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export const CHAMFER = [[1, .50], [.60, 1], [-.60, 1], [-1, .50], [-1, -.50], [-.60, -1], [.60, -1], [1, -.50]];
