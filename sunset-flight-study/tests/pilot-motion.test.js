import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import { sampleFlight, sampleCamera } from "../src/reference-flight.js";
import { frameReferenceCamera } from "../src/camera.js";
import { createReferenceAircraft } from "../src/reference-aircraft.js";

const moduleUrl = new URL("../src/pilot-motion.js", import.meta.url);
const pilotModule = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const stateKeys = ["x", "y", "vx", "vy", "bank", "pitch"];

function createPilot() {
  assert.equal(
    typeof pilotModule.PilotMotion,
    "function",
    "PilotMotion is exported",
  );
  return new pilotModule.PilotMotion();
}

function state(pilot) {
  return Object.fromEntries(stateKeys.map((key) => [key, pilot[key]]));
}

test("pilot starts inactive with zero offset, velocity, and attitude", () => {
  const pilot = createPilot();
  assert.deepEqual(state(pilot), {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    bank: 0,
    pitch: 0,
  });
  assert.equal(pilot.active, false);
});

function advance(pilot, seconds, input, fps = 60) {
  for (let step = 0; step < Math.round(seconds * fps); step++) {
    pilot.update(1 / fps, input);
  }
  return pilot;
}

function near(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} ~= ${expected}`,
  );
}

test("shared pilot limits are immutable and agree with reachable boundaries", () => {
  assert.deepEqual(pilotModule.PILOT_LIMITS, { x: 20, y: 12 });
  assert.ok(Object.isFrozen(pilotModule.PILOT_LIMITS));
  const pilot = advance(createPilot(), 5, { x: 1, y: 1 });
  assert.equal(pilot.x, pilotModule.PILOT_LIMITS.x);
  assert.equal(pilot.y, pilotModule.PILOT_LIMITS.y);
});

test("input accelerates smoothly toward the requested horizontal and vertical speeds", () => {
  const horizontal = createPilot();
  horizontal.update(1 / 60, { x: 1, y: 0 });
  assert.ok(horizontal.vx > 0 && horizontal.vx < 16);
  assert.ok(horizontal.x > 0 && horizontal.x < 16 / 60);
  assert.equal(horizontal.y, 0);
  assert.equal(horizontal.active, true);
  advance(horizontal, 0.5, { x: 1, y: 0 });
  assert.ok(horizontal.vx > 15.8 && horizontal.vx <= 16);
  assert.ok(horizontal.bank > 0.5 && horizontal.bank <= 0.52);
  const vertical = advance(createPilot(), 0.6, { x: 0, y: 1 });
  assert.ok(vertical.vy > 9.9 && vertical.vy <= 10);
  assert.ok(vertical.pitch < -0.23 && vertical.pitch >= -0.24);
  assert.equal(vertical.x, 0);
});

test("diagonal input is normalized and mirrored directions produce opposite offsets", () => {
  const straight = advance(createPilot(), 0.5, { x: 1, y: 0 });
  const diagonal = advance(createPilot(), 0.5, { x: 1, y: 1 });
  assert.ok(diagonal.x > 0 && diagonal.y > 0);
  near(diagonal.x, straight.x / Math.SQRT2);
  near(diagonal.y / 10, diagonal.x / 16);
  const reverse = advance(createPilot(), 0.5, { x: -1, y: -1 });
  for (const key of stateKeys) near(reverse[key], -diagonal[key]);
  const opposed = advance(createPilot(), 1, { x: 1 - 1, y: 1 - 1 });
  assert.equal(opposed.active, false);
  assert.ok(stateKeys.every((key) => opposed[key] === 0));
  const excessive = advance(createPilot(), 0.5, { x: 99, y: 0 });
  near(excessive.x, straight.x);
});

test("long holds clamp displacement and can move inward immediately after reversal", () => {
  for (const sign of [-1, 1]) {
    const pilot = advance(createPilot(), 60, { x: sign, y: sign });
    assert.equal(pilot.x, sign * 20);
    assert.equal(pilot.y, sign * 12);
    assert.equal(pilot.vx, 0);
    assert.equal(pilot.vy, 0);
    pilot.update(1 / 60, { x: -sign, y: -sign });
    assert.ok(Math.abs(pilot.x) < 20);
    assert.ok(Math.abs(pilot.y) < 12);
  }
});

test("release eases velocity and attitude to level while retaining the new offset", () => {
  const pilot = advance(createPilot(), 0.4, { x: 1, y: 1 });
  const moving = state(pilot);
  pilot.update(1 / 60, { x: 0, y: 0 });
  assert.ok(pilot.x > moving.x && pilot.y > moving.y);
  assert.ok(pilot.vx > 0 && pilot.vx < moving.vx);
  assert.ok(Math.abs(pilot.bank) < Math.abs(moving.bank));
  assert.ok(Math.abs(pilot.pitch) < Math.abs(moving.pitch));
  advance(pilot, 3, { x: 0, y: 0 });
  assert.ok(Math.abs(pilot.vx) < 1e-10);
  assert.ok(Math.abs(pilot.vy) < 1e-10);
  assert.ok(Math.abs(pilot.bank) < 1e-10);
  assert.ok(Math.abs(pilot.pitch) < 1e-10);
  const held = state(pilot);
  advance(pilot, 3, { x: 0, y: 0 });
  near(pilot.x, held.x);
  near(pilot.y, held.y);
  assert.ok(pilot.x > 1 && pilot.y > 0.5);
  assert.equal(
    pilot.active,
    true,
    "holding a nonzero offset stays in pilot mode",
  );
});

test("paused, invalid, and nonpositive deltas are exact no-ops; reset clears all state", () => {
  const pilot = advance(createPilot(), 0.4, { x: 1, y: -1 });
  const before = state(pilot);
  assert.notEqual(before.x, 0);
  pilot.update(1 / 60, { x: -1, y: 1 }, false);
  assert.deepEqual(state(pilot), before);
  for (const dt of [0, -1, NaN, Infinity, -Infinity, undefined, "0.1"]) {
    pilot.update(dt, { x: -1, y: 1 });
    assert.deepEqual(state(pilot), before);
  }
  pilot.reset();
  assert.deepEqual(state(pilot), {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    bank: 0,
    pitch: 0,
  });
  assert.equal(pilot.active, false);
});

test("large deltas are capped and invalid axes never poison finite state", () => {
  const capped = createPilot();
  const normal = createPilot();
  capped.update(20, { x: 1, y: 1 });
  normal.update(0.1, { x: 1, y: 1 });
  assert.ok(normal.x > 0);
  assert.deepEqual(state(capped), state(normal));
  for (const input of [{ x: NaN, y: Infinity }, {}, undefined, null]) {
    capped.update(0.1, input);
    assert.ok(stateKeys.every((key) => Number.isFinite(capped[key])));
  }
});

test("analytic motion matches at 30, 60, and 120 fps through acceleration and release", () => {
  const samples = [30, 60, 120].map((fps) => {
    const pilot = createPilot();
    advance(pilot, 0.5, { x: 1, y: 1 }, fps);
    advance(pilot, 0.3, { x: -1, y: 0 }, fps);
    advance(pilot, 0.6, { x: 0, y: -1 }, fps);
    advance(pilot, 1, { x: 0, y: 0 }, fps);
    return pilot;
  });
  assert.ok(
    samples.every((sample) => Math.abs(sample.x) + Math.abs(sample.y) > 0),
  );
  for (const sample of samples.slice(1)) {
    for (const key of stateKeys) near(sample[key], samples[0][key], 1e-10);
  }
});

function transformedPose(pilot, pose, frame) {
  assert.equal(typeof pilot.applyPose, "function", "applyPose exists");
  return pilot.applyPose(pose, frame);
}

function transformedCamera(pilot, frame) {
  assert.equal(typeof pilot.applyCamera, "function", "applyCamera exists");
  return pilot.applyCamera(frame);
}

function renderedCamera(frame, aspect = 1.4) {
  const camera = new THREE.PerspectiveCamera(frame.fov, aspect, 0.1, 3000);
  camera.position.copy(
    frameReferenceCamera(frame.position, frame.target, aspect),
  );
  camera.lookAt(frame.target);
  camera.rotateZ(frame.roll);
  camera.updateMatrixWorld();
  return camera;
}

test("positive axes translate along rendered screen right and up, including rolled frames", () => {
  const pilot = advance(createPilot(), 0.3, { x: 1, y: 1 });
  for (const time of [0, 3.5, 7, 11, 15.5, 21]) {
    for (const roll of [-1.4, -0.8, 0, 0.8, 1.4]) {
      const frame = { ...sampleCamera(time), roll };
      const original = sampleFlight(time).red;
      const camera = renderedCamera(frame);
      const moved = transformedPose(pilot, original, frame);
      const delta = moved.position.clone().sub(original.position);
      const screenDelta = delta
        .clone()
        .applyQuaternion(camera.quaternion.clone().invert());
      near(screenDelta.x, pilot.x);
      near(screenDelta.y, pilot.y);
      near(screenDelta.z, 0);
      const followed = renderedCamera(transformedCamera(pilot, frame));
      const before = original.position.clone().project(camera);
      const after = moved.position.clone().project(followed);
      assert.ok(
        after.x > before.x && after.y > before.y,
        "some pilot motion remains visible",
      );
    }
  }
});

test("aircraft attitude adds bounded local bank and pitch without mutating the sampled pose", () => {
  const pilot = advance(createPilot(), 1, { x: 1, y: 1 });
  const frame = sampleCamera(5);
  const original = sampleFlight(5).red;
  const savedPosition = original.position.clone();
  const savedQuaternion = original.quaternion.clone();
  const moved = pilot.applyPose(original, frame, { stabilize: false });
  assert.notEqual(moved, original);
  assert.notEqual(moved.position, original.position);
  assert.notEqual(moved.quaternion, original.quaternion);
  assert.ok(original.position.equals(savedPosition));
  assert.ok(original.quaternion.equals(savedQuaternion));
  const relative = original.quaternion
    .clone()
    .invert()
    .multiply(moved.quaternion);
  const expected = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 0, 1), pilot.bank)
    .multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        pilot.pitch,
      ),
    );
  assert.ok(1 - Math.abs(relative.dot(expected)) < 1e-12);
  assert.ok(original.quaternion.angleTo(moved.quaternion) > 0.05);
  assert.ok(
    original.quaternion.angleTo(moved.quaternion) <= Math.hypot(0.52, 0.24),
  );
  near(moved.quaternion.length(), 1);
});

test("camera follows 55 percent of translation with unchanged framing metadata and independent clones", () => {
  assert.equal(pilotModule.PILOT_CAMERA_FOLLOW, 0.55);
  const pilot = advance(createPilot(), 0.6, { x: -1, y: 1 });
  const frame = sampleCamera(11);
  const framePosition = frame.position.clone();
  const frameTarget = frame.target.clone();
  const pose = sampleFlight(11).red;
  const moved = transformedPose(pilot, pose, frame);
  const followed = transformedCamera(pilot, frame);
  const expected = moved.position
    .clone()
    .sub(pose.position)
    .multiplyScalar(pilotModule.PILOT_CAMERA_FOLLOW);
  assert.ok(
    followed.position.clone().sub(frame.position).distanceTo(expected) < 1e-10,
  );
  assert.ok(
    followed.target.clone().sub(frame.target).distanceTo(expected) < 1e-10,
  );
  assert.notEqual(followed, frame);
  assert.notEqual(followed.position, frame.position);
  assert.notEqual(followed.target, frame.target);
  for (const key of ["fov", "roll", "shotIndex"])
    assert.equal(followed[key], frame[key]);
  assert.ok(frame.position.equals(framePosition));
  assert.ok(frame.target.equals(frameTarget));
  followed.position.set(0, 0, 0);
  followed.target.set(0, 0, 0);
  assert.ok(frame.position.equals(framePosition));
  assert.ok(frame.target.equals(frameTarget));
});

test("neutral transforms preserve sampler values exactly and remain independently owned", () => {
  const pilot = createPilot();
  const frame = sampleCamera(8.8);
  const pose = sampleFlight(8.8).red;
  const moved = transformedPose(pilot, pose, frame);
  const followed = transformedCamera(pilot, frame);
  assert.ok(moved.position.equals(pose.position));
  assert.ok(moved.quaternion.equals(pose.quaternion));
  assert.ok(followed.position.equals(frame.position));
  assert.ok(followed.target.equals(frame.target));
  assert.notEqual(moved.position, pose.position);
  assert.notEqual(moved.quaternion, pose.quaternion);
  assert.notEqual(followed.position, frame.position);
  assert.notEqual(followed.target, frame.target);
});

test("full aircraft geometry remains in desktop/portrait cinematic/chase frames throughout takeover and maximum offsets", () => {
  const aircraft = createReferenceAircraft();
  aircraft.updateMatrixWorld(true);
  const vertices = [];
  aircraft.traverse((object) => {
    if (!object.geometry || object.userData.isAircraftOutline) return;
    const positions = object.geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      vertices.push(
        new THREE.Vector3()
          .fromBufferAttribute(positions, index)
          .applyMatrix4(object.matrixWorld),
      );
    }
  });
  assert.ok(
    vertices.length > 1000,
    "checks the complete modeled aircraft, not just wing tips",
  );
  // Test reachable intermediate states, not only the final wider manual view.
  const pilots = [0, 1 / 120, 0.05, 0.1, 0.25, 0.4, 1, 5].flatMap((seconds) =>
    [-1, 0, 1].flatMap((x) =>
      [-1, 0, 1].map((y) => advance(createPilot(), seconds, { x, y }, 120)),
    ),
  );
  const point = new THREE.Vector3();
  for (let time = 0; time <= 24; time += 0.5) {
    const pose = sampleFlight(time).red;
    for (const mode of ["cinematic", "chase"]) {
      const originalFrame = sampleCamera(time, mode);
      for (const pilot of pilots) {
        const frame = pilot.steeringCamera(originalFrame, pose);
        const moved = transformedPose(pilot, pose, frame);
        for (const aspect of [1.4, 0.462]) {
          const camera = renderedCamera(transformedCamera(pilot, frame), aspect);
          const projection = new THREE.Matrix4()
            .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
            .multiply(
              new THREE.Matrix4().compose(
                moved.position,
                moved.quaternion,
                new THREE.Vector3(1, 1, 1),
              ),
            );
          for (const vertex of vertices) {
            point.copy(vertex).applyMatrix4(projection);
            assert.ok(
              Number.isFinite(point.x) &&
                Number.isFinite(point.y) &&
                Number.isFinite(point.z),
            );
            if (
              Math.abs(point.x) >= 1 ||
              Math.abs(point.y) >= 1 ||
              point.z <= -1 ||
              point.z >= 1
            ) {
              assert.fail(
                `aircraft inside frame in ${mode} at t=${time}, blend=${pilot.cameraBlend}, aspect=${aspect}, offset=${pilot.x},${pilot.y}: ${point.toArray()}`,
              );
            }
          }
        }
      }
    }
  }
});
