import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import { sampleFlight, DURATION } from "../src/reference-flight.js";

const flight = (time) => ({
  red: {
    position: new THREE.Vector3(time * 32, 420, 0),
    quaternion: new THREE.Quaternion(),
  },
});
const tips = [new THREE.Vector3(-6.4, 0, 0), new THREE.Vector3(6.4, 0, 0)];

test("reference ribbons follow sampled flight history and taper to transparent tails", async () => {
  assert.ok(existsSync("src/reference-effects.js"));
  const { createReferenceEffects } = await import(
    "../src/reference-effects.js"
  );
  const scene = new THREE.Scene();
  const effects = createReferenceEffects(scene, flight, tips);
  effects.update(3);
  const ribbons = effects.root.children.filter((object) =>
    object.name.startsWith("wing-ribbon"),
  );
  assert.equal(ribbons.length, 2);
  for (const ribbon of ribbons) {
    const positions = ribbon.geometry.attributes.position.array;
    assert.ok(Array.from(positions).every(Number.isFinite));
    assert.ok(positions.length >= 64 * 2 * 3);
    assert.ok(Math.abs(positions[0] - positions.at(-6)) > 35);
    const alpha = ribbon.geometry.attributes.aOpacity.array;
    assert.ok(alpha[0] > 0.1);
    assert.equal(alpha.at(-1), 0);
    assert.equal(ribbon.material.depthWrite, false);
    assert.equal(ribbon.material.transparent, true);
  }
  const before = Array.from(ribbons[0].geometry.attributes.position.array);
  effects.update(3);
  assert.deepEqual(
    Array.from(ribbons[0].geometry.attributes.position.array),
    before,
  );
  effects.dispose();
});

test("reference effects have bounded quality and idempotent shared-resource disposal", async () => {
  assert.ok(existsSync("src/reference-effects.js"));
  const { createReferenceEffects } = await import(
    "../src/reference-effects.js"
  );
  const scene = new THREE.Scene();
  const effects = createReferenceEffects(scene, flight, tips);
  const streaks = effects.root.getObjectByName("airflow-streaks");
  effects.setQuality("low");
  assert.ok(streaks.geometry.drawRange.count <= 24);
  effects.setQuality("high");
  assert.ok(streaks.geometry.drawRange.count > 24);
  const geometry = effects.root.children[0].geometry;
  const material = effects.root.children[0].material;
  let geometries = 0,
    materials = 0;
  geometry.addEventListener("dispose", () => geometries++);
  material.addEventListener("dispose", () => materials++);
  effects.dispose();
  effects.dispose();
  effects.update(2);
  effects.setQuality("high");
  assert.equal(scene.children.length, 0);
  assert.equal(geometries, 1);
  assert.equal(materials, 1);
});

test("ambient streak phases repeat with the film and fade out before recycling", async () => {
  const { createReferenceEffects } = await import(
    "../src/reference-effects.js"
  );
  const effects = createReferenceEffects(new THREE.Scene(), sampleFlight, tips);
  const streaks = effects.root.getObjectByName("airflow-streaks");
  effects.update(2.3);
  const before = Array.from(streaks.geometry.attributes.position.array);
  effects.update(2.3 + DURATION);
  const after = Array.from(streaks.geometry.attributes.position.array);
  after.forEach((value, index) =>
    assert.ok(Math.abs(value - before[index]) < 0.001),
  );
  effects.update(0);
  const opacity = streaks.geometry.attributes.aOpacity;
  assert.ok(opacity, "streak recycling needs per-vertex fade");
  assert.equal(opacity.getX(0), 0);
  assert.equal(opacity.getX(1), 0);
  effects.dispose();
});
