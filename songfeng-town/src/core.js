export const PLAYER_RADIUS = 0.31;
export const SPEED = 4.2;
export const BOUNDS = { minX: -25.5, maxX: 25.5, minZ: -21.5, maxZ: 21.5 };
export const RIVER = { minX: 10, maxX: 14, minZ: -22, maxZ: 22 };
export const BRIDGE = { minX: 9.5, maxX: 14.5, minZ: -0.3, maxZ: 3.3 };
export const HOUSES = [
  {
    x: -17,
    z: -11,
    w: 6.2,
    d: 5.4,
    wall: "#f1d8ac",
    roof: "#b86651",
    name: "杏子家",
  },
  {
    x: -6.5,
    z: -13,
    w: 5.5,
    d: 5.2,
    wall: "#eddc9f",
    roof: "#768d9d",
    name: "面包房",
  },
  {
    x: 2.5,
    z: -9.5,
    w: 5.4,
    d: 5,
    wall: "#d1dac0",
    roof: "#7c8970",
    name: "阿禾家",
  },
];
export const TREES = [
  [-23, -18],
  [-19, -19],
  [-13, -18],
  [-10, -20],
  [-1, -18],
  [5, -18],
  [8, -15],
  [-23, -8],
  [-23, -3],
  [-23, 4],
  [-23, 12],
  [-22, 18],
  [-18, 19],
  [-13, 19],
  [-7, 19],
  [-2, 18],
  [4, 18],
  [7, 13],
  [6, 7],
  [17, -17],
  [21, -18],
  [24, -14],
  [17, -11],
  [22, -9],
  [18, -6],
  [24, -3],
  [19, 7],
  [24, 8],
  [17, 12],
  [22, 14],
  [18, 18],
  [24, 19],
];
export function rect(x, z, w, d, kind = "solid") {
  return {
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    kind,
  };
}
export function createColliders() {
  return [
    ...HOUSES.map((h) => rect(h.x, h.z, h.w + 0.1, h.d + 0.1, "house")),
    ...TREES.map(([x, z]) => rect(x, z, 0.8, 0.8, "tree")),
    rect(-3, -0.5, 2.5, 2.5, "planter"),
    rect(-8, 2.7, 0.8, 0.5, "sign"),
    rect(-20.7, 9, 0.16, 9, "fence"),
    rect(-16, 13.45, 9.4, 0.16, "fence"),
    rect(-16, 4.65, 9.4, 0.16, "fence"),
    rect(-11.3, 5.4, 0.16, 1.5, "fence"),
    rect(-11.3, 12.5, 0.16, 1.6, "fence"),
    rect(-6, -1.7, 1.7, 0.8, "bench"),
    rect(0.3, -1.8, 0.8, 1.7, "bench"),
    ...[
      [-20, -7],
      [-19, -6.7],
      [-9, -9],
      [-9.6, 12.5],
      [4.4, -5.7],
      [21, 5],
    ].map(([x, z]) => rect(x, z, 0.85, 0.85, "crate")),
    // River banks are solid except for the one continuous bridge corridor.
    { ...RIVER, maxZ: BRIDGE.minZ, kind: "river" },
    { ...RIVER, minZ: BRIDGE.maxZ, kind: "river" },
    rect(12, BRIDGE.minZ - 0.1, 5, 0.2, "railing"),
    rect(12, BRIDGE.maxZ + 0.1, 5, 0.2, "railing"),
  ];
}
export function canStand(x, z, colliders, radius = PLAYER_RADIUS) {
  if (
    x - radius < BOUNDS.minX ||
    x + radius > BOUNDS.maxX ||
    z - radius < BOUNDS.minZ ||
    z + radius > BOUNDS.maxZ
  )
    return false;
  return !colliders.some((r) => {
    const cx = Math.max(r.minX, Math.min(x, r.maxX)),
      cz = Math.max(r.minZ, Math.min(z, r.maxZ));
    return (x - cx) ** 2 + (z - cz) ** 2 < radius ** 2;
  });
}
export function screenMovement(right, down) {
  const length = Math.hypot(right, down);
  if (!length) return { x: 0, z: 0 };
  return {
    x: (right + down) / length / Math.SQRT2,
    z: (down - right) / length / Math.SQRT2,
  };
}
export function movePlayer(position, dx, dz, colliders) {
  // Substeps prevent tunnelling even after a slow frame. Axis separation slides along walls.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12));
  let { x, z } = position;
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx / steps, z, colliders)) x += dx / steps;
    if (canStand(x, z + dz / steps, colliders)) z += dz / steps;
  }
  return { x, z };
}
export function nearestInteraction(position, objects) {
  return (
    objects
      .filter(
        (o) =>
          !o.harvested &&
          Math.hypot(o.x - position.x, o.z - position.z) < (o.range ?? 1.8),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - position.x, a.z - position.z) -
          Math.hypot(b.x - position.x, b.z - position.z),
      )[0] ?? null
  );
}
