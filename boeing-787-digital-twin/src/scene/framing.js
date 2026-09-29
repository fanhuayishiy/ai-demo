import * as THREE from 'three';

export function fitDistance(bounds, direction, aspect, fov) {
  const view = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), view);
  if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(view, right).normalize();
  const center = bounds.getCenter(new THREE.Vector3());
  const tanY = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const tanX = tanY * aspect;
  let distance = 6;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(center);
        distance = Math.max(
          distance,
          point.dot(view) +
            1.3 * Math.max(Math.abs(point.dot(right)) / tanX, Math.abs(point.dot(up)) / tanY),
        );
      }
    }
  }
  return distance;
}
