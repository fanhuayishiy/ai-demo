import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";

const moduleUrl = new URL("../src/reference-flight.js", import.meta.url);
const reference = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

function api() {
  assert.equal(
    typeof reference.sampleFlight,
    "function",
    "reference flight sampler exists",
  );
  assert.equal(
    typeof reference.sampleCamera,
    "function",
    "reference camera sampler exists",
  );
  return reference;
}

function bankOf(pose) {
  const nose = FORWARD.clone().applyQuaternion(pose.quaternion);
  const right = new THREE.Vector3().crossVectors(UP, nose).normalize();
  const up = new THREE.Vector3().crossVectors(nose, right).normalize();
  const wing = new THREE.Vector3(1, 0, 0).applyQuaternion(pose.quaternion);
  return Math.atan2(wing.dot(up), wing.dot(right));
}

function renderedCamera(frame, aspect = 16 / 9) {
  const camera = new THREE.PerspectiveCamera(frame.fov, aspect, 0.1, 3000);
  camera.position.copy(frame.position);
  camera.lookAt(frame.target);
  camera.rotateZ(frame.roll);
  camera.updateMatrixWorld();
  return camera;
}

test("reference API exposes four immutable six-second chapters covering the 24-second loop", () => {
  const { DURATION, SHOTS, sampleCamera } = api();
  assert.equal(DURATION, 24);
  assert.equal(SHOTS.length, 4);
  assert.deepEqual(
    SHOTS.map((shot) => shot.title),
    ["尾随", "剪刀", "回旋", "俯冲"],
  );
  assert.equal(new Set(SHOTS.map((shot) => shot.id)).size, 4);
  assert.ok(Object.isFrozen(SHOTS));
  SHOTS.forEach((shot, index) => {
    assert.ok(Object.isFrozen(shot));
    assert.equal(shot.start, index * 6);
    assert.equal(shot.end, (index + 1) * 6);
    assert.ok(shot.subtitle.length > 0 && shot.subtitle.length <= 30);
    assert.equal(sampleCamera(shot.start).shotIndex, index);
    assert.equal(sampleCamera(shot.end - 0.001).shotIndex, index);
  });
  assert.equal(sampleCamera(DURATION).shotIndex, 0);
});

test("dense reference poses remain finite, normalized, bounded and separated above the ocean", () => {
  const { DURATION, sampleFlight } = api();
  for (let t = 0; t < DURATION; t += 0.025) {
    const state = sampleFlight(t);
    for (const pose of Object.values(state)) {
      assert.ok(pose.position instanceof THREE.Vector3);
      assert.ok(pose.position.toArray().every(Number.isFinite));
      assert.ok(pose.quaternion instanceof THREE.Quaternion);
      assert.ok(pose.quaternion.toArray().every(Number.isFinite));
      assert.ok(Math.abs(pose.quaternion.length() - 1) < 1e-10);
      assert.ok(
        pose.position.y > 300 && pose.position.y < 540,
        `altitude at ${t}`,
      );
    }
    const radius = Math.hypot(state.red.position.x, state.red.position.z);
    assert.ok(
      radius >= 290 && radius <= 390,
      `route radius at ${t}: ${radius}`,
    );
    assert.ok(state.red.position.y >= 330 && state.red.position.y <= 510);
    assert.ok(state.red.position.distanceTo(state.blue.position) >= 26);
  }
});

test("sampling is periodic, order-independent and does not share mutable return objects", () => {
  const { DURATION, sampleFlight, sampleCamera } = api();
  for (const t of [0, 1.37, 5.999, 9.2, 17.6, 23.9]) {
    const expected = sampleFlight(t);
    sampleFlight(15.77);
    for (const offset of [-DURATION, DURATION, 3 * DURATION]) {
      const actual = sampleFlight(t + offset);
      for (const key of ["red", "blue"]) {
        assert.ok(
          expected[key].position.distanceTo(actual[key].position) < 1e-9,
        );
        assert.ok(
          1 - Math.abs(expected[key].quaternion.dot(actual[key].quaternion)) <
            1e-12,
        );
      }
      for (const mode of ["cinematic", "chase", "wide"]) {
        const a = sampleCamera(t, mode);
        const b = sampleCamera(t + offset, mode);
        assert.ok(a.position.distanceTo(b.position) < 1e-9);
        assert.ok(a.target.distanceTo(b.target) < 1e-9);
        assert.ok(Math.abs(a.roll - b.roll) < 1e-10);
        assert.ok(Math.abs(a.fov - b.fov) < 1e-10);
      }
    }
    const mutable = sampleFlight(t);
    mutable.red.position.set(0, 0, 0);
    mutable.blue.quaternion.set(0, 0, 0, 0);
    assert.ok(expected.red.position.equals(sampleFlight(t).red.position));
    assert.ok(expected.blue.quaternion.equals(sampleFlight(t).blue.quaternion));
  }
});

test("both noses track velocity, with meaningful opposite banks and noncircular scissors", () => {
  const { DURATION, sampleFlight } = api();
  const banks = [];
  const radii = [];
  for (let t = 0; t < DURATION; t += 0.04) {
    const now = sampleFlight(t);
    const next = sampleFlight(t + 0.0005);
    const previous = sampleFlight(t - 0.0005);
    for (const key of ["red", "blue"]) {
      const velocity = next[key].position
        .clone()
        .sub(previous[key].position)
        .normalize();
      const nose = FORWARD.clone().applyQuaternion(now[key].quaternion);
      assert.ok(nose.dot(velocity) > 0.99999, `${key} nose at ${t}`);
      assert.ok(
        now[key].quaternion.angleTo(next[key].quaternion) < 0.005,
        `smooth pose at ${t}`,
      );
    }
    banks.push(bankOf(now.red));
    radii.push(Math.hypot(now.red.position.x, now.red.position.z));
  }
  assert.ok(Math.max(...banks) > 1.0, "rightward bank is substantial");
  assert.ok(Math.min(...banks) < -1.1, "leftward bank is substantial");
  assert.ok(Math.max(...banks.map(Math.abs)) <= 1.31);
  assert.ok(
    Math.max(...radii) - Math.min(...radii) > 55,
    "scissors depart from a static circle",
  );
  assert.ok(
    sampleFlight(23).red.position.y < sampleFlight(18).red.position.y - 45,
    "last chapter dives",
  );
});

test("flight and every camera mode have continuous position, velocity and orientation at every chapter and loop seam", () => {
  const { sampleFlight, sampleCamera } = api();
  const h = 0.0001;
  for (const seam of [0, 6, 12, 18, 24]) {
    for (const key of ["red", "blue"]) {
      const a = sampleFlight(seam - h)[key];
      const b = sampleFlight(seam)[key];
      const c = sampleFlight(seam + h)[key];
      assert.ok(a.position.distanceTo(c.position) < 0.04);
      assert.ok(a.quaternion.angleTo(c.quaternion) < 0.004);
      const incoming = b.position.clone().sub(a.position).divideScalar(h);
      const outgoing = c.position.clone().sub(b.position).divideScalar(h);
      assert.ok(
        incoming.distanceTo(outgoing) < 0.035,
        `${key} velocity seam ${seam}`,
      );
    }
    for (const mode of ["cinematic", "chase", "wide"]) {
      const a = sampleCamera(seam - h, mode);
      const b = sampleCamera(seam, mode);
      const c = sampleCamera(seam + h, mode);
      for (const key of ["position", "target"]) {
        assert.ok(
          a[key].distanceTo(c[key]) < 0.06,
          `${mode} ${key} seam ${seam}`,
        );
        const incoming = b[key].clone().sub(a[key]).divideScalar(h);
        const outgoing = c[key].clone().sub(b[key]).divideScalar(h);
        assert.ok(
          incoming.distanceTo(outgoing) < 0.08,
          `${mode} ${key} derivative seam ${seam}`,
        );
      }
      assert.ok(Math.abs(a.fov - c.fov) < 0.002);
      assert.ok(Math.abs(a.roll - c.roll) < 0.003);
      const incomingRoll = (b.roll - a.roll) / h;
      const outgoingRoll = (c.roll - b.roll) / h;
      assert.ok(
        Math.abs(incomingRoll - outgoingRoll) < 0.02,
        `${mode} roll derivative seam ${seam}`,
      );
    }
  }
});

test("camera modes are safe rear-quarter views and cinematic keeps a close elevated position", () => {
  const { DURATION, sampleFlight, sampleCamera } = api();
  for (let t = 0; t < DURATION; t += 0.04) {
    const state = sampleFlight(t);
    for (const mode of ["cinematic", "chase", "wide"]) {
      const frame = sampleCamera(t, mode);
      for (const value of [frame.position, frame.target]) {
        assert.ok(value instanceof THREE.Vector3);
        assert.ok(value.toArray().every(Number.isFinite));
      }
      const distance = frame.position.distanceTo(state.red.position);
      assert.ok(distance >= 18 && distance < 95);
      assert.ok(frame.position.y > 250);
      assert.ok(frame.position.distanceTo(frame.target) > 12);
      assert.ok(frame.position.distanceTo(state.blue.position) > 15);
      assert.ok(frame.fov >= 45 && frame.fov <= 55);
      assert.ok(Number.isFinite(frame.roll) && Math.abs(frame.roll) < 1.5);
      const relative = frame.position
        .clone()
        .sub(state.red.position)
        .applyQuaternion(state.red.quaternion.clone().invert());
      assert.ok(relative.z < -12, `${mode} stays behind at ${t}`);
      assert.ok(relative.y > 3, `${mode} sees upper wings at ${t}`);
      if (mode === "cinematic") {
        assert.ok(distance <= 26);
        assert.ok(
          frame.position.y > state.red.position.y + 1,
          `camera above aircraft at ${t}`,
        );
      }
    }
  }
});

test("cinematic projection keeps a large readable airplane below-right of center with a rotating horizon", () => {
  const { DURATION, sampleFlight, sampleCamera } = api();
  const rolls = [];
  const widths = [];
  for (let t = 0; t < DURATION; t += 0.08) {
    const plane = sampleFlight(t).red;
    const frame = sampleCamera(t);
    const camera = renderedCamera(frame);
    const center = plane.position.clone().project(camera);
    assert.ok(
      center.x > 0.07 && center.x < 0.45,
      `rightward framing at ${t}: ${center.x}`,
    );
    assert.ok(
      center.y < -0.08 && center.y > -0.6,
      `lower framing at ${t}: ${center.y}`,
    );
    const wings = [-6.5, 6.5].map((x) =>
      new THREE.Vector3(x, 0, 0)
        .applyQuaternion(plane.quaternion)
        .add(plane.position)
        .project(camera),
    );
    const width = Math.abs(wings[1].x - wings[0].x) / 2;
    widths.push(width);
    assert.ok(width > 0.3 && width < 0.58, `prominent wings at ${t}: ${width}`);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
      camera.quaternion,
    );
    const planeUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
      plane.quaternion,
    );
    assert.ok(
      cameraUp.dot(planeUp) > 0.55,
      `camera follows aircraft roll at ${t}`,
    );
    rolls.push(frame.roll);
  }
  assert.ok(widths.reduce((a, b) => a + b, 0) / widths.length > 0.34);
  assert.ok(Math.max(...rolls) > 0.85);
  assert.ok(Math.min(...rolls) < -0.75);
});

test("opening travels toward the sunset and unknown camera modes use cinematic sampling", () => {
  const { sampleFlight, sampleCamera } = api();
  const nose = FORWARD.clone().applyQuaternion(sampleFlight(0).red.quaternion);
  nose.y = 0;
  assert.ok(
    nose.normalize().dot(new THREE.Vector3(-0.65, 0, -0.7).normalize()) > 0.94,
  );
  const expected = sampleCamera(9.4);
  const unknown = sampleCamera(9.4, "not-a-mode");
  assert.ok(unknown.position.equals(expected.position));
  assert.ok(unknown.target.equals(expected.target));
});

test("cinematic sightline opens the amber horizon instead of looking steeply into the ocean", () => {
  const { DURATION, sampleCamera } = api();
  for (let t = 0; t < DURATION; t += 0.025) {
    const frame = sampleCamera(t);
    const direction = frame.target.clone().sub(frame.position).normalize();
    const downwardPitch = (Math.asin(-direction.y) * 180) / Math.PI;
    assert.ok(
      downwardPitch >= 2 && downwardPitch <= 21,
      `shallow cinematic pitch at ${t}: ${downwardPitch}`,
    );
    const camera = renderedCamera(frame);
    // At least one top viewport corner must see above the geometric horizon,
    // even when its line slopes diagonally across the rolled composition.
    const cornerRays = [-1, 1].map((x) =>
      new THREE.Vector3(x, 1, 0.5)
        .unproject(camera)
        .sub(frame.position)
        .normalize(),
    );
    assert.ok(
      cornerRays.some((ray) => ray.y > 0.04),
      `sky visible at ${t}`,
    );
  }
});

test("rolling camera eases scissors without frame-dependent lag or a fast angular snap", () => {
  const { DURATION, sampleCamera } = api();
  const step = 0.005;
  for (let t = 0; t < DURATION; t += step) {
    const a = renderedCamera(sampleCamera(t));
    const b = renderedCamera(sampleCamera(t + step));
    const angularSpeed = a.quaternion.angleTo(b.quaternion) / step;
    assert.ok(
      angularSpeed < 2.2,
      `camera angular speed at ${t}: ${angularSpeed}`,
    );
  }
});

test("review viewport keeps the full wings modestly smaller and right below center", () => {
  const { DURATION, sampleFlight, sampleCamera } = api();
  const widths = [];
  for (let t = 0; t < DURATION; t += 0.04) {
    const plane = sampleFlight(t).red;
    const camera = renderedCamera(sampleCamera(t), 1254 / 892);
    const wings = [-6.5, 6.5].map((x) =>
      new THREE.Vector3(x, 0, 0)
        .applyQuaternion(plane.quaternion)
        .add(plane.position)
        .project(camera),
    );
    const width = Math.abs(wings[1].x - wings[0].x) / 2;
    widths.push(width);
    assert.ok(width >= 0.34 && width <= 0.49, `review width at ${t}: ${width}`);
  }
  const meanWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  assert.ok(
    meanWidth >= 0.4 && meanWidth <= 0.46,
    `review mean width: ${meanWidth}`,
  );
});
