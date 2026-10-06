import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { PilotMotion } from "../src/pilot-motion.js";
import { sampleFlight, sampleCamera } from "../src/reference-flight.js";
import { frameReferenceCamera } from "../src/camera.js";

function advance(pilot, seconds, input, fps = 120) {
  for (let index = 0; index < Math.round(seconds * fps); index++) {
    pilot.update(1 / fps, input);
  }
  return pilot;
}

function cameraFor(frame, aspect) {
  const camera = new THREE.PerspectiveCamera(frame.fov, aspect, 0.1, 3000);
  camera.position.copy(frameReferenceCamera(frame.position, frame.target, aspect));
  camera.lookAt(frame.target);
  camera.rotateZ(frame.roll);
  camera.updateMatrixWorld();
  return camera;
}

test("100ms and 250ms presses reach responsive velocity and visible bank", () => {
  const pilot = advance(new PilotMotion(), 0.1, { x: 1 });
  assert.ok(pilot.vx > 14, `100ms velocity ${pilot.vx}`);
  assert.ok(pilot.x > 0.98, `100ms displacement ${pilot.x}`);
  assert.ok(pilot.bank > 0.4, `100ms bank ${pilot.bank}`);
  advance(pilot, 0.15, { x: 1 });
  assert.ok(pilot.x > 3.3 && pilot.x < 3.5, `250ms displacement ${pilot.x}`);
  assert.ok(pilot.bank > 0.5);
});

test("reversal crosses velocity zero within 34ms and release settles within 150ms", () => {
  const pilot = advance(new PilotMotion(), 0.5, { x: 1 });
  const before = pilot.x;
  advance(pilot, 1 / 30, { x: -1 });
  assert.ok(pilot.vx < 0, `reversal velocity ${pilot.vx}`);
  advance(pilot, 1 / 15, { x: -1 });
  assert.ok(pilot.x < before - 0.35, `reverse displacement ${pilot.x - before}`);
  advance(pilot, 0.15, {});
  assert.ok(Math.abs(pilot.vx) < 0.5, `release velocity ${pilot.vx}`);
});

test("manual engagement blends smoothly in 0.4 seconds, survives release and resets exactly", () => {
  const pilot = new PilotMotion();
  assert.equal(pilot.engaged, false);
  assert.equal(pilot.cameraBlend, 0);
  assert.equal(typeof pilot.steeringCamera, "function");
  const pose = sampleFlight(9).red;
  const authored = sampleCamera(9);
  const untouched = pilot.steeringCamera(authored, pose);
  assert.deepEqual(untouched, authored);
  assert.notEqual(untouched.position, authored.position);
  assert.notEqual(untouched.target, authored.target);
  pilot.update(1 / 120, { x: 1 });
  assert.equal(pilot.engaged, true);
  assert.ok(pilot.cameraBlend > 0 && pilot.cameraBlend < 0.01);
  let previous = pilot.steeringCamera(authored, pose);
  for (let index = 1; index < 48; index++) {
    pilot.update(1 / 120, {});
    const next = pilot.steeringCamera(authored, pose);
    assert.ok(next.position.distanceTo(previous.position) < 1.5);
    assert.ok(Math.abs(next.roll - previous.roll) < 0.08);
    assert.ok(next.fov >= authored.fov && next.fov <= 52);
    previous = next;
  }
  assert.equal(pilot.cameraBlend, 1);
  assert.equal(pilot.engaged, true);
  const saved = { ...pilot };
  pilot.update(1 / 60, { x: -1 }, false);
  assert.deepEqual({ ...pilot }, saved);
  pilot.reset();
  assert.equal(pilot.engaged, false);
  assert.equal(pilot.cameraBlend, 0);
  assert.deepEqual(pilot.steeringCamera(authored, pose), authored);
});

test("manual camera stabilizes a world-up rear view independent of authored bank without mutation", () => {
  const pilot = advance(new PilotMotion(), 0.5, { x: 1 });
  assert.equal(typeof pilot.steeringCamera, "function");
  for (let time = 0; time < 24; time += 0.25) {
    const pose = sampleFlight(time).red;
    const frame = sampleCamera(time);
    const saved = { position: frame.position.clone(), target: frame.target.clone() };
    const actual = pilot.steeringCamera(frame, pose);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
    forward.y = 0;
    forward.normalize();
    const rear = actual.position.clone().sub(actual.target);
    assert.ok(Math.abs(rear.dot(forward) + 34) < 1e-10);
    assert.equal(actual.roll, 0);
    assert.equal(actual.fov, 52);
    assert.ok(Math.abs(rear.y - 8) < 1e-10);
    assert.equal(actual.shotIndex, frame.shotIndex);
    assert.ok(frame.position.equals(saved.position));
    assert.ok(frame.target.equals(saved.target));
    const extraBank = { ...pose, quaternion: pose.quaternion.clone().multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 1),
    ) };
    const banked = pilot.steeringCamera(frame, extraBank);
    assert.ok(actual.position.distanceTo(banked.position) < 1e-10);
  }
});

test("settled keyboard camera keeps the aircraft visibly close rather than a distant wide shot", () => {
  const pilot = advance(new PilotMotion(), 0.1, { x: 1 });
  advance(pilot, 0.8, {});
  for (let time = 0; time < 24; time += 0.5) {
    const pose = sampleFlight(time).red;
    for (const mode of ["cinematic", "chase"]) {
      const frame = pilot.steeringCamera(sampleCamera(time, mode), pose);
      const moved = pilot.applyPose(pose, frame);
      const camera = cameraFor(pilot.applyCamera(frame), 1.4);
      const left = new THREE.Vector3(-6, 0, 0).applyQuaternion(moved.quaternion).add(moved.position).project(camera);
      const right = new THREE.Vector3(6, 0, 0).applyQuaternion(moved.quaternion).add(moved.position).project(camera);
      const span = Math.abs(right.x - left.x) / 2;
      // A quarter-frame span is readable in both authored camera modes; the
      // previous 42m view only occupied about one fifth of this desktop frame.
      assert.ok(span > 0.25, `12m wing span occupies only ${(span * 100).toFixed(2)}% of frame at ${time}/${mode}`);
    }
  }
});

test("takeover preserves the authored aircraft screen anchor at every blend and aspect", () => {
  for (const seconds of [1 / 120, 0.075, 0.1, 0.25, 0.4, 1]) {
    const pilot = advance(new PilotMotion(), seconds, { x: 1 });
    for (let time = 0; time < 24; time += 0.5) {
      const pose = sampleFlight(time).red;
      for (const mode of ["cinematic", "chase"]) {
        const authored = sampleCamera(time, mode);
        const manual = pilot.steeringCamera(authored, pose);
        for (const aspect of [1.6, 1.4, 390 / 844]) {
          const before = pose.position.clone().project(cameraFor(authored, aspect));
          const after = pose.position.clone().project(cameraFor(manual, aspect));
          assert.ok(Math.abs(after.x - before.x) < 1e-10 && Math.abs(after.y - before.y) < 1e-10,
            `takeover alone moved aircraft at t=${time}, blend=${pilot.cameraBlend}, aspect=${aspect}: ${before.toArray()} -> ${after.toArray()}`);
        }
      }
    }
  }
});

test("first takeover presses and 75ms taps move all four requested directions from the actual pre-engagement view", () => {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    for (const seconds of [0.075, 0.1, 0.25]) {
      for (const movingRoute of [false, true]) {
        for (const mode of ["cinematic", "chase"]) {
          for (let start = 0; start < 24; start += 0.5) {
            for (const axis of ["x", "y"]) {
              for (const sign of [-1, 1]) {
                const beforePose = sampleFlight(start).red;
                const before = beforePose.position.clone().project(
                  cameraFor(sampleCamera(start, mode), width / height),
                );
                const pilot = advance(new PilotMotion(), seconds, { [axis]: sign });
                const now = start + (movingRoute ? seconds : 0);
                const pose = sampleFlight(now).red;
                const frame = pilot.steeringCamera(sampleCamera(now, mode), pose);
                const after = pilot.applyPose(pose, frame).position.project(
                  cameraFor(pilot.applyCamera(frame), width / height),
                );
                const pixels = (after[axis] - before[axis]) * sign * (axis === "x" ? width : height) / 2;
                const minimum = (width === 1440 ? 4 : 1) * (axis === "y" ? 0.625 : 1);
                assert.ok(pixels > minimum,
                  `${width}px ${mode} t=${start} ${movingRoute ? "moving" : "fixed"} route ${axis}=${sign} ${seconds}s first press: ${pixels}px`);
              }
            }
          }
        }
      }
    }
  }
});

test("a released 75ms tap keeps its requested direction while the remaining camera takeover completes", () => {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    for (const seconds of [0.1, 0.25, 0.4]) {
      for (const mode of ["cinematic", "chase"]) {
        for (let start = 0; start < 24; start += 0.5) {
          for (const axis of ["x", "y"]) {
            for (const sign of [-1, 1]) {
              const before = sampleFlight(start).red.position.clone().project(
                cameraFor(sampleCamera(start, mode), width / height),
              );
              const pilot = advance(new PilotMotion(), 0.075, { [axis]: sign });
              advance(pilot, seconds - 0.075, {});
              const pose = sampleFlight(start + seconds).red;
              const frame = pilot.steeringCamera(sampleCamera(start + seconds, mode), pose);
              const after = pilot.applyPose(pose, frame).position.project(
                cameraFor(pilot.applyCamera(frame), width / height),
              );
              const pixels = (after[axis] - before[axis]) * sign * (axis === "x" ? width : height) / 2;
              assert.ok(pixels > (width === 1440 ? 2 : 0.5),
                `${width}px ${mode} t=${start} ${axis}=${sign} 75ms tap after ${seconds}s: ${pixels}px`);
            }
          }
        }
      }
    }
  }
});

test("manual attitude levels scripted bank and banks toward the pressed screen direction", () => {
  for (let time = 0; time < 24; time += 0.25) {
    const pose = sampleFlight(time).red;
    for (const direction of [-1, 1]) {
      const pilot = advance(new PilotMotion(), 0.5, { x: direction });
      assert.equal(typeof pilot.steeringCamera, "function");
      const frame = pilot.steeringCamera(sampleCamera(time), pose);
      const savedQuaternion = pose.quaternion.clone();
      const savedPosition = pose.position.clone();
      const moved = pilot.applyPose(pose, frame);
      assert.ok(pose.position.equals(savedPosition));
      assert.ok(pose.quaternion.equals(savedQuaternion));
      const camera = cameraFor(frame, 1.4);
      const screenRightWing = new THREE.Vector3(-1, 0, 0)
        .applyQuaternion(moved.quaternion)
        .applyQuaternion(camera.quaternion.clone().invert());
      assert.ok(screenRightWing.x > 0.8);
      assert.ok(screenRightWing.y * direction < -0.4,
        `bank direction at ${time}: ${screenRightWing.toArray()}`);
      const originalForward = new THREE.Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
      const movedForward = new THREE.Vector3(0, 0, 1).applyQuaternion(moved.quaternion);
      assert.ok(originalForward.distanceTo(movedForward) < 1e-10);
    }
  }
});

test("engagement and finite camera transforms agree at 30, 60, and 120fps", () => {
  for (const seconds of [0.1, 0.2, 0.4, 1]) {
    const pilots = [30, 60, 120].map((fps) => advance(new PilotMotion(), seconds, { x: -1, y: 1 }, fps));
    for (let time = 0; time <= 24; time += 0.5) {
      const pose = sampleFlight(time).red;
      const authored = sampleCamera(time);
      const expected = pilots[0].steeringCamera(authored, pose);
      for (const pilot of pilots) {
        const actual = pilot.steeringCamera(authored, pose);
        assert.ok(actual.position.distanceTo(expected.position) < 1e-10);
        assert.ok(actual.target.distanceTo(expected.target) < 1e-10);
        assert.ok(Math.abs(actual.roll - expected.roll) < 1e-10);
        assert.ok(Math.abs(actual.fov - expected.fov) < 1e-10);
        assert.ok([...actual.position, ...actual.target, actual.fov, actual.roll].every(Number.isFinite));
      }
    }
  }
});

test("brief presses visibly displace the aircraft on desktop and portrait across the route", () => {
  for (const [width, height, min100, min250] of [[1440, 900, 10, 20], [390, 844, 3, 6]]) {
    for (const seconds of [0.1, 0.25]) {
      for (const mode of ["cinematic", "chase"]) {
        for (let time = 0; time < 24; time += 0.5) {
          for (const axis of ["x", "y"]) {
            const pilot = advance(new PilotMotion(), seconds, { [axis]: 1 });
            assert.equal(typeof pilot.steeringCamera, "function");
            const pose = sampleFlight(time).red;
            const frame = pilot.steeringCamera(sampleCamera(time, mode), pose);
            // Use the same route time / blend on both sides: camera takeover
            // and automatic route motion must not count as keyboard response.
            const before = pose.position.clone().project(cameraFor(frame, width / height));
            const after = pilot.applyPose(pose, frame).position
              .project(cameraFor(pilot.applyCamera(frame), width / height));
            const pixels = (after[axis] - before[axis]) * (axis === "x" ? width : height) / 2;
            const minimum = (seconds === 0.1 ? min100 : min250) * (axis === "y" ? 0.625 : 1);
            assert.ok(pixels >= minimum,
              `${width}px ${mode} t=${time} ${axis} ${seconds}s: ${pixels}px < ${minimum}px`);
          }
        }
      }
    }
  }
});
