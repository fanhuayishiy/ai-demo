import test from "node:test";
import assert from "node:assert/strict";
import {
  screenMovement,
  movePlayer,
  canStand,
  createColliders,
  nearestInteraction,
  HOUSES,
  TREES,
  BRIDGE,
} from "../src/core.js";
const colliders = createColliders();
test("movement agrees with the isometric screen axes and diagonal speed stays constant", () => {
  for (const [right, down] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
  ]) {
    const d = screenMovement(right, down);
    const sx = (d.x - d.z) / Math.SQRT2,
      sy = (d.x + d.z) / Math.SQRT2;
    assert.ok(Math.abs(sx - right / Math.hypot(right, down)) < 1e-10);
    assert.ok(Math.abs(sy - down / Math.hypot(right, down)) < 1e-10);
    assert.ok(Math.abs(Math.hypot(d.x, d.z) - 1) < 1e-10);
  }
  assert.deepEqual(screenMovement(0, 0), { x: 0, z: 0 });
});
test("houses, tree trunks, water and map edges block the player", () => {
  for (const h of HOUSES) assert.equal(canStand(h.x, h.z, colliders), false);
  for (const [x, z] of TREES) assert.equal(canStand(x, z, colliders), false);
  for (const z of [-20, -5, 5, 20])
    assert.equal(canStand(12, z, colliders), false);
  assert.equal(canStand(-26, 0, colliders), false);
  assert.equal(canStand(26, 0, colliders), false);
});
test("bridge permits a continuous crossing in both directions; banks do not", () => {
  const p = movePlayer({ x: 8, z: 1.5 }, 8, 0, colliders);
  assert.ok(p.x > 15.9);
  const back = movePlayer(p, -8, 0, colliders);
  assert.ok(Math.abs(back.x - 8) < 0.01);
  const stopped = movePlayer({ x: 8, z: 6 }, 8, 0, colliders);
  assert.ok(stopped.x < 10);
  const rail = movePlayer({ x: 12, z: 1.5 }, 0, 8, colliders);
  assert.ok(rail.z < BRIDGE.maxZ);
});
test("main road stays open through the plaza and across the bridge", () => {
  const p = movePlayer({ x: -21, z: 1.5 }, 44, 0, colliders);
  assert.ok(p.x > 22.9, "main road obstructed by a prop");
});
test("substeps prevent tunnelling and wall contact allows sliding", () => {
  const hit = movePlayer({ x: -17, z: -5 }, 0, -30, colliders);
  assert.ok(hit.z > -8.1);
  const slide = movePlayer({ x: -17, z: -7.9 }, 2, -2, colliders);
  assert.ok(slide.x > -15.1);
  assert.ok(slide.z > -8.1);
});
test("all zones and house front doors are connected from the spawn", () => {
  const step = 0.5,
    start = { x: -6, z: 4.5 },
    queue = [start],
    visited = new Set(["-6,4.5"]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dz] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const x = p.x + dx,
        z = p.z + dz,
        key = `${x},${z}`;
      if (!visited.has(key) && canStand(x, z, colliders)) {
        visited.add(key);
        queue.push({ x, z });
      }
    }
  }
  const goals = [
    [-8, 3.5],
    [-18.9, 6],
    [-10, 9.6],
    [19.6, 3.4],
    [20, 10],
    ...HOUSES.map((h) => [h.x, h.z + h.d / 2 + 1]),
  ];
  for (const [x, z] of goals)
    assert.ok(
      queue.some((p) => Math.hypot(p.x - x, p.z - z) < 0.8),
      `unreachable: ${x},${z}`,
    );
});
test("interaction selects the nearest available object and harvested crops stay unavailable", () => {
  const crop = { id: "crop", x: 0, z: 0, range: 1.35 },
    npc = { id: "npc", x: 1, z: 0 };
  assert.equal(nearestInteraction({ x: 0.1, z: 0 }, [npc, crop]).id, "crop");
  crop.harvested = true;
  assert.equal(nearestInteraction({ x: 0.1, z: 0 }, [npc, crop]).id, "npc");
  assert.equal(nearestInteraction({ x: 8, z: 8 }, [npc, crop]), null);
});
