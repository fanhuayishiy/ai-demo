import * as THREE from 'three';

export const FLIGHT_DURATION = 22;
const smooth = (a, b, t) => THREE.MathUtils.smoothstep(t, a, b);

// Presentation timeline, not a flight dynamics or performance model.
export function sampleFlight(kind, progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  if (kind === 'takeoff') {
    const pitch = 0.15 * smooth(0.25, 0.43, t) - 0.045 * smooth(0.7, 1, t);
    return {
      distance: 240 * t * t,
      altitude: 24 * smooth(0.38, 1, t),
      pitch,
      gear: 1 - smooth(0.52, 0.72, t),
      speed: 175 * smooth(0, 0.65, t),
      phase:
        t < 0.25
          ? '跑道滑跑'
          : t < 0.38
            ? '抬轮'
            : t < 0.52
              ? '离地爬升'
              : t < 0.72
                ? '收起起落架'
                : '持续爬升',
    };
  }
  return {
    distance: 260 * (t - (t * t) / 2),
    altitude: 19 * (1 - smooth(0, 0.62, t)),
    pitch: 0.035 + 0.065 * smooth(0.42, 0.57, t) - 0.1 * smooth(0.63, 0.75, t),
    gear: smooth(0.04, 0.3, t),
    speed: 150 * (1 - smooth(0.62, 1, t)),
    phase:
      t < 0.3
        ? '进近 · 放下起落架'
        : t < 0.5
          ? '稳定进近'
          : t < 0.62
            ? '拉平'
            : t < 0.75
              ? '主轮接地'
              : t < 1
                ? '滑跑减速'
                : '降落完成',
  };
}

export function createRunway() {
  const root = new THREE.Group();
  root.position.y = -3.395;
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x303b3e, roughness: 0.96 });
  const paint = new THREE.MeshStandardMaterial({ color: 0xdce6df, roughness: 0.8 });
  const light = new THREE.MeshBasicMaterial({ color: 0x8ee8e1 });
  function slab(x, z, length, width, material, y = 0.02) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.025, width), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  slab(-180, 0, 700, 17, asphalt, -0.03);
  for (const z of [-8, 8]) slab(-180, z, 700, 0.1, paint);
  for (let x = -520; x < 170; x += 12) {
    slab(x, 0, 4, 0.18, paint);
    for (const z of [-8.5, 8.5]) slab(x, z, 0.22, 0.22, light, 0.08);
  }
  for (const x of [-45, -170, -295]) {
    for (const z of [-5.5, -4.7, -3.9, 3.9, 4.7, 5.5]) slab(x, z, 9, 0.45, paint);
  }
  root.visible = false;
  return {
    root,
    dispose() {
      root.traverse((o) => o.geometry?.dispose());
      asphalt.dispose();
      paint.dispose();
      light.dispose();
    },
  };
}
