import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import { sampleCamera } from "../src/flight.js";
import {
  sampleCamera as sunsetCamera,
  sampleFlight as sunsetFlight,
} from "../src/reference-flight.js";

test("reference dolly keeps the banked aircraft inside portrait and desktop frames", async () => {
  const { frameReferenceCamera } = await import("../src/camera.js");
  assert.equal(typeof frameReferenceCamera, "function");
  // Conservative full-aircraft local bounding box, including tail and propeller.
  const corners = [];
  for (const x of [-6.6, 6.6])
    for (const y of [-0.7, 2])
      for (const z of [-5.2, 5.2]) {
        corners.push(new THREE.Vector3(x, y, z));
      }
  for (const aspect of [320 / 844, 390 / 844, 768 / 1024, 16 / 9]) {
    for (let time = 0; time < 24; time += 0.1) {
      const pose = sunsetFlight(time).red;
      const shot = sunsetCamera(time);
      const camera = new THREE.PerspectiveCamera(shot.fov, aspect, 0.4, 16000);
      camera.position.copy(
        frameReferenceCamera(shot.position, shot.target, aspect),
      );
      camera.lookAt(shot.target);
      camera.rotateZ(shot.roll);
      camera.updateMatrixWorld();
      for (const corner of corners) {
        const projected = corner
          .clone()
          .applyQuaternion(pose.quaternion)
          .add(pose.position)
          .project(camera);
        assert.ok(
          Math.abs(projected.x) < 0.97 && Math.abs(projected.y) < 0.98,
          `${time.toFixed(1)}s / ${aspect}: aircraft bounds ${projected.x},${projected.y}`,
        );
      }
    }
  }
});

test("responsive framing keeps every cinematic shot above the sea on portrait screens", async () => {
  assert.ok(existsSync("src/camera.js"), "camera constraints are implemented");
  const { frameCamera } = await import("../src/camera.js");
  for (const aspect of [390 / 844, 375 / 812, 768 / 1024, 16 / 9]) {
    for (let time = 0; time < 72; time += 0.25) {
      const { position, target } = sampleCamera(time);
      const original = position.clone();
      const framed = frameCamera(position, target, aspect);
      assert.ok(
        framed.y >= 6,
        `camera at ${time}s / aspect ${aspect} stays above sea`,
      );
      assert.ok(
        framed.distanceTo(target) >= position.distanceTo(target) - 0.001,
      );
      assert.ok(position.equals(original), "source sampling remains immutable");
    }
  }
});

test("free orbit cannot cross below the sea and keeps looking at the aircraft", async () => {
  assert.ok(existsSync("src/camera.js"), "camera constraints are implemented");
  const { constrainOrbitCamera } = await import("../src/camera.js");
  const camera = new THREE.PerspectiveCamera();
  const target = new THREE.Vector3(0, 70, 0);
  camera.position.set(20, -40, 50);
  constrainOrbitCamera(camera, target);
  assert.equal(camera.position.y, 6);
  const forward = camera.getWorldDirection(new THREE.Vector3());
  assert.ok(
    forward.dot(target.clone().sub(camera.position).normalize()) > 0.99999,
  );
});
