import * as THREE from 'three';
import { WING } from './aircraft.js';

// Stylized flow paths in aircraft coordinates, not CFD results.
export function createAirflow() {
  const root = new THREE.Group();
  root.name = 'flight-airflow';
  const paths = [];
  for (const side of [-1, 1]) {
    for (const [span, leading, y, chord, thickness] of WING.slice(1, -1)) {
      const z = side * span;
      const surface = Array.from({ length: 18 }, (_, index) => {
        const t = index / 17;
        const foil =
          5 *
          thickness *
          (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t ** 2 + 0.2843 * t ** 3 - 0.1036 * t ** 4);
        return new THREE.Vector3(
          leading + t * chord,
          y + foil + Math.sin(t * Math.PI) * chord * 0.012 + 0.16,
          z,
        );
      });
      paths.push(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(leading - 0.9, y + 0.12, z),
          ...surface,
          new THREE.Vector3(leading + chord + 2.8, y - 0.2, z + side * 0.1),
        ]),
      );
    }
    paths.push(
      new THREE.CatmullRomCurve3(
        Array.from({ length: 32 }, (_, i) => {
          const t = i / 31;
          const radius = t * 0.32;
          return new THREE.Vector3(
            6.2 + t * 9,
            1.58 - t * 0.65 + Math.sin(t * 12) * radius,
            side * (15.1 + Math.cos(t * 12) * radius),
          );
        }),
      ),
    );
  }
  const guideMaterial = new THREE.LineBasicMaterial({
    color: 0x72cdbb,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  for (const path of paths)
    root.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.getPoints(80)), guideMaterial),
    );
  const positions = new Float32Array(paths.length * 12 * 2 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  const material = new THREE.LineBasicMaterial({
    color: 0x9ee8ef,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const streaks = new THREE.LineSegments(geometry, material);
  streaks.frustumCulled = false;
  root.add(streaks);
  const point = new THREE.Vector3();
  root.visible = false;
  return {
    root,
    update({ progress, speed, distance, enabled = true }) {
      if (![progress, speed, distance].every(Number.isFinite)) {
        root.visible = false;
        return;
      }
      const strength = THREE.MathUtils.smoothstep(speed, 5, 150);
      root.visible = enabled && strength > 0.001;
      guideMaterial.opacity = 0.18 * strength;
      material.opacity = 0.85 * strength;
      let index = 0;
      paths.forEach((path, lane) => {
        for (let dash = 0; dash < 12; dash++) {
          const t = (dash / 12 + distance * 0.025 + lane * 0.071 + progress * 0.2) % 1;
          for (const sample of [t, Math.min(1, t + 0.018)]) {
            path.getPoint(THREE.MathUtils.clamp(sample, 0, 1), point);
            positions[index++] = point.x;
            positions[index++] = point.y;
            positions[index++] = point.z;
          }
        }
      });
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      root.traverse((object) => object.geometry?.dispose());
      guideMaterial.dispose();
      material.dispose();
    },
  };
}
