import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { DURATION, SHOTS, sampleFlight, sampleCamera } from "../src/flight.js";

const EPSILON = 1e-7;

function finiteVector(vector) {
  assert.ok(vector instanceof THREE.Vector3);
  assert.ok(vector.toArray().every(Number.isFinite));
}

test("exports the deterministic 72-second flight and camera sampling API", () => {
  assert.equal(DURATION, 72);
  assert.equal(typeof sampleFlight, "function");
  assert.equal(typeof sampleCamera, "function");
});

test("six named shots cover the loop without gaps or overlaps", () => {
  assert.ok(Array.isArray(SHOTS));
  assert.equal(SHOTS.length, 6);
  assert.deepEqual(
    SHOTS.map((shot) => shot.title),
    ["掠海", "追逐", "交错", "爬升", "回旋", "远航"],
  );
  assert.equal(new Set(SHOTS.map((shot) => shot.id)).size, 6);
  SHOTS.forEach((shot, index) => {
    assert.equal(shot.start, index === 0 ? 0 : SHOTS[index - 1].end);
    assert.ok(shot.end > shot.start);
    assert.ok(shot.subtitle.length > 0);
  });
  assert.equal(SHOTS.at(-1).end, DURATION);
});

test("dense flight samples stay finite, above the sea, inside the set and separated", () => {
  assert.equal(typeof sampleFlight, "function");
  for (let time = 0; time <= 72; time += 0.04) {
    const state = sampleFlight(time);
    for (const plane of [state.red, state.blue]) {
      finiteVector(plane.position);
      assert.ok(
        plane.position.y >= 55 && plane.position.y <= 125,
        `altitude at ${time}`,
      );
      assert.ok(Math.hypot(plane.position.x, plane.position.z) <= 450);
      assert.ok(plane.quaternion instanceof THREE.Quaternion);
      assert.ok(plane.quaternion.toArray().every(Number.isFinite));
      assert.ok(Math.abs(plane.quaternion.length() - 1) < EPSILON);
    }
    assert.ok(
      state.red.position.distanceTo(state.blue.position) >= 20,
      `separation at ${time}`,
    );
    assert.ok(state.red.position.distanceTo(state.blue.position) <= 55);
  }
});

test("positions and rotations loop exactly and negative time normalizes", () => {
  assert.equal(typeof sampleFlight, "function");
  for (const time of [0, 2.25, 11.99, 29, 61.5]) {
    const state = sampleFlight(time);
    for (const otherTime of [time + 72, time - 72, time + 144]) {
      const other = sampleFlight(otherTime);
      for (const name of ["red", "blue"]) {
        assert.ok(
          state[name].position.distanceTo(other[name].position) < EPSILON,
        );
        assert.ok(
          1 - Math.abs(state[name].quaternion.dot(other[name].quaternion)) <
            EPSILON,
        );
      }
    }
  }
});

test("both aircraft climb continuously throughout the climb chapter", () => {
  const climb = SHOTS.find((shot) => shot.id === "climb");
  const beginning = sampleFlight(climb.start);
  const ending = sampleFlight(climb.end);
  for (const name of ["red", "blue"]) {
    assert.ok(
      ending[name].position.y - beginning[name].position.y >= 8,
      `${name} gains meaningful altitude`,
    );
  }
  for (let time = climb.start; time < climb.end; time += 0.01) {
    const current = sampleFlight(time);
    const next = sampleFlight(Math.min(time + 0.01, climb.end));
    for (const name of ["red", "blue"]) {
      assert.ok(
        next[name].position.y > current[name].position.y,
        `${name} climbs at ${time}`,
      );
    }
  }
});

test("the enlarged flight circuit sustains a convincing pursuit speed", () => {
  const totals = { red: 0, blue: 0 };
  let count = 0;
  for (let time = 0; time < DURATION; time += 0.05) {
    const current = sampleFlight(time);
    const next = sampleFlight(time + 0.005);
    for (const name of ["red", "blue"]) {
      const speedKmh =
        (next[name].position.distanceTo(current[name].position) / 0.005) * 3.6;
      assert.ok(
        speedKmh >= 60 && speedKmh <= 185,
        `${name} pursuit speed at ${time}`,
      );
      totals[name] += speedKmh;
    }
    count += 1;
  }
  for (const name of ["red", "blue"]) {
    assert.ok(totals[name] / count >= 100, `${name} average pursuit speed`);
  }
});

test("each nose follows its velocity, and the loop seam has continuous motion", () => {
  assert.equal(typeof sampleFlight, "function");
  for (let time = 0; time < 72; time += 0.2) {
    const now = sampleFlight(time);
    const next = sampleFlight(time + 0.005);
    for (const name of ["red", "blue"]) {
      const direction = next[name].position
        .clone()
        .sub(now[name].position)
        .normalize();
      const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(
        now[name].quaternion,
      );
      assert.ok(nose.dot(direction) > 0.999, `nose alignment at ${time}`);
      assert.ok(now[name].position.distanceTo(next[name].position) < 0.3);
    }
  }
  const before = sampleFlight(72 - 0.001);
  const after = sampleFlight(0.001);
  for (const name of ["red", "blue"]) {
    assert.ok(before[name].position.distanceTo(after[name].position) < 0.1);
    assert.ok(before[name].quaternion.angleTo(after[name].quaternion) < 0.01);
  }
});

test("all camera modes are finite, clear of aircraft, and use restrained cinematic lenses", () => {
  assert.equal(typeof sampleCamera, "function");
  for (const mode of ["cinematic", "chase", "wide"]) {
    for (let time = 0; time < 72; time += 0.08) {
      const camera = sampleCamera(time, mode);
      const state = sampleFlight(time);
      finiteVector(camera.position);
      finiteVector(camera.target);
      assert.ok(camera.position.distanceTo(camera.target) > 15);
      assert.ok(camera.position.y > 5);
      assert.ok(
        camera.position.distanceTo(state.red.position) >= 18,
        `${mode} red clearance at ${time}`,
      );
      assert.ok(
        camera.position.distanceTo(state.blue.position) >= 18,
        `${mode} blue clearance at ${time}`,
      );
      assert.ok(camera.fov >= 42 && camera.fov <= 53);
      assert.ok(Number.isFinite(camera.roll) && Math.abs(camera.roll) <= 0.18);
      assert.equal(camera.shotIndex, Math.floor(time / 12));
    }
  }
});

test("opening presents the red aircraft from a close front three-quarter angle with both subjects visible", () => {
  assert.equal(typeof sampleCamera, "function");
  for (const time of [0, 2, 5]) {
    const state = sampleFlight(time);
    const result = sampleCamera(time);
    const relative = result.position
      .clone()
      .sub(state.red.position)
      .applyQuaternion(state.red.quaternion.clone().invert());
    assert.ok(relative.x > 10 && relative.z > 18, "front three-quarter view");
    assert.ok(
      result.position.distanceTo(state.red.position) < 34,
      "prominent opening subject",
    );
    const camera = new THREE.PerspectiveCamera(result.fov, 16 / 9, 0.1, 2000);
    camera.position.copy(result.position);
    camera.lookAt(result.target);
    camera.updateMatrixWorld();
    for (const plane of [state.red, state.blue]) {
      const projected = plane.position.clone().project(camera);
      assert.ok(
        Math.abs(projected.x) < 0.8 && Math.abs(projected.y) < 0.8,
        "both aircraft in frame",
      );
    }
  }
});

test("camera boundaries and wrapped time select deterministic shots", () => {
  assert.equal(typeof sampleCamera, "function");
  for (let index = 0; index < 6; index += 1) {
    const time = index * 12;
    assert.equal(sampleCamera(time).shotIndex, index);
    assert.equal(sampleCamera(time - 0.001).shotIndex, (index + 5) % 6);
    for (const mode of ["cinematic", "chase", "wide"]) {
      const a = sampleCamera(time, mode);
      const b = sampleCamera(time - 72, mode);
      assert.ok(a.position.distanceTo(b.position) < EPSILON);
      assert.ok(a.target.distanceTo(b.target) < EPSILON);
      assert.equal(a.fov, b.fov);
      assert.equal(a.roll, b.roll);
    }
  }
  assert.equal(sampleCamera(72).shotIndex, 0);
});
