import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as THREE from "three";
import { PilotMotion, PILOT_CAMERA_FOLLOW } from "../src/pilot-motion.js";
import { createReferenceEffects } from "../src/reference-effects.js";

const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const functions = [
  "steeringFrame",
  "samplePilotedFlight",
  "resetPilot",
  "setMode",
  "seek",
  "updateOrbitCamera",
  "updateScene",
]
  .map(
    (name) =>
      source.match(
        new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`),
      )?.[0],
  )
  .filter(Boolean)
  .join("\n");

function nearVector(actual, expected, message, tolerance = 1e-10) {
  assert.ok(
    actual.distanceTo(expected) < tolerance,
    `${message}: ${actual.toArray()} versus ${expected.toArray()}`,
  );
}

function harness({
  classic = false,
  movingRoute = false,
  rotateOnUpdate = false,
} = {}) {
  const basePosition = (time) =>
    new THREE.Vector3(
      movingRoute ? time * 12 : 0,
      100 + (movingRoute ? time : 0),
      movingRoute ? time * 2 : 0,
    );
  const sampleFlight = (time) => ({
    red: { position: basePosition(time), quaternion: new THREE.Quaternion() },
    blue: {
      position: basePosition(time).add(new THREE.Vector3(30, 10, 0)),
      quaternion: new THREE.Quaternion(),
    },
  });
  const camera = new THREE.PerspectiveCamera(48, 1.4, 0.1, 3000);
  camera.position.copy(basePosition(0)).add(new THREE.Vector3(0, 5, -25));
  camera.lookAt(basePosition(0));
  camera.updateMatrixWorld();
  const controls = {
    target: basePosition(0),
    enabled: true,
    update() {
      if (rotateOnUpdate) {
        camera.position
          .sub(this.target)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.2)
          .add(this.target);
      }
      camera.lookAt(this.target);
      camera.updateMatrixWorld();
    },
  };
  const dom = {
    textContent: "",
    value: 0,
    style: { setProperty() {} },
    setAttribute() {},
  };
  const model = (position) => ({
    position,
    quaternion: new THREE.Quaternion(),
    userData: { propeller: { rotation: { z: 0 } } },
  });
  const context = {
    THREE,
    PILOT_CAMERA_FOLLOW,
    camera,
    controls,
    pilot: classic ? null : new PilotMotion(),
    pilotInput: { axes: () => ({ x: 1, y: 0 }), sample() { return this.axes(); }, clear() {} },
    player: {
      time: 0,
      paused: false,
      seek(time) {
        this.time = time;
      },
    },
    DURATION: 24,
    mode: "orbit",
    isReference: !classic,
    profile: { propellerSpeed: 0 },
    sampleFlight,
    sampleCamera: (time) => ({
      position: basePosition(time).add(new THREE.Vector3(0, 5, -25)),
      target: basePosition(time),
      fov: 48,
      roll: 0,
      shotIndex: 0,
    }),
    red: model(basePosition(0)),
    blue: model(basePosition(0)),
    lastOrbitTarget: basePosition(0),
    lastPilotOffset: new THREE.Vector3(),
    orbitSteeringFrame: null,
    displacement: new THREE.Vector3(),
    world: null,
    updateEffects() {},
    $: () => dom,
    lastShot: 0,
    formatTime: String,
    audio: { update() {} },
    syncPilot() {},
    syncDock() {},
    toast() {},
    document: { querySelectorAll: () => [] },
    constrainOrbitCamera() {},
  };
  runInNewContext(functions, context);
  return context;
}

test("orbit leaves 45 percent of pilot translation visible instead of canceling it", () => {
  const app = harness();
  const originalCamera = app.camera.position.clone();
  const originalTarget = app.controls.target.clone();
  const originalPlane = app.red.position.clone();
  const before = originalPlane.clone().project(app.camera);
  app.updateScene(0.1);
  const planeDelta = app.red.position.clone().sub(originalPlane);
  assert.ok(Math.abs(planeDelta.length() - 16 * (0.1 - (1 - Math.exp(-2.4)) / 24)) < 1e-12);
  nearVector(
    app.camera.position.clone().sub(originalCamera),
    planeDelta.clone().multiplyScalar(PILOT_CAMERA_FOLLOW),
    "camera follows configured ratio",
  );
  nearVector(
    app.controls.target.clone().sub(originalTarget),
    planeDelta.clone().multiplyScalar(PILOT_CAMERA_FOLLOW),
    "orbit target follows configured ratio",
  );
  const after = app.red.position.clone().project(app.camera);
  assert.ok(
    after.x - before.x > 0.003,
    `visible horizontal displacement: ${after.x - before.x}`,
  );
});

test("orbit follows all automatic-route movement while retaining configured pilot follow", () => {
  const app = harness({ movingRoute: true });
  const initialCamera = app.camera.position.clone();
  app.updateScene(0.1);
  app.pilotInput.axes = () => ({ x: 0, y: 0 });
  app.player.time = 2;
  app.updateScene(0);
  const base = app.sampleFlight(2).red.position;
  const pilotOffset = app.red.position.clone().sub(base);
  const expectedDelta = base
    .clone()
    .sub(app.sampleFlight(0).red.position)
    .addScaledVector(pilotOffset, PILOT_CAMERA_FOLLOW);
  nearVector(
    app.camera.position.clone().sub(initialCamera),
    expectedDelta,
    "route delta remains complete",
  );
});

test("reset and repeated seeks/restarts remove pilot offset without orbit-camera drift", () => {
  const app = harness({ movingRoute: true });
  const initialCamera = app.camera.position.clone();
  const initialTarget = app.controls.target.clone();
  for (const nextTime of [5, 0, 18, 0, 0]) {
    app.updateScene(0.1);
    app.seek(nextTime);
    const routeDelta = app
      .sampleFlight(nextTime)
      .red.position.clone()
      .sub(initialTarget);
    nearVector(
      app.camera.position,
      initialCamera.clone().add(routeDelta),
      "first seek restores the route-relative camera",
    );
    nearVector(
      app.controls.target,
      app.sampleFlight(nextTime).red.position,
      "first seek has no residual pilot target offset",
    );
    app.seek(0);
    nearVector(
      app.camera.position,
      initialCamera,
      "seek/restart restores the original orbit camera",
    );
    nearVector(
      app.controls.target,
      initialTarget,
      "seek/restart restores the original target",
    );
    assert.equal(app.pilot.active, false);
  }
  app.updateScene(0.1);
  app.resetPilot();
  app.updateScene(0);
  nearVector(
    app.camera.position,
    initialCamera,
    "G reset restores camera without drift",
  );
  nearVector(
    app.controls.target,
    initialTarget,
    "G reset restores target without drift",
  );
});

test("entering orbit initializes both trackers and does not apply a prior offset twice", () => {
  const app = harness();
  const initialCamera = app.camera.position.clone();
  app.pilot.update(0.1, { x: 1, y: 0 });
  const frame = app.sampleCamera(0);
  app.red.position.copy(
    app.pilot.applyPose(app.sampleFlight(0).red, frame).position,
  );
  app.camera.position.copy(app.pilot.applyCamera(frame).position);
  app.mode = "chase";
  app.setMode("orbit");
  app.updateScene(0);
  nearVector(
    app.camera.position,
    initialCamera,
    "old camera offset is removed exactly once",
  );
  nearVector(
    app.controls.target,
    app.sampleFlight(0).red.position,
    "orbit starts centered on reset route",
  );
  nearVector(
    app.lastPilotOffset,
    new THREE.Vector3(),
    "pilot tracker is neutral",
  );
  const savedCamera = app.camera.position.clone();
  app.updateScene(0);
  nearVector(
    app.camera.position,
    savedCamera,
    "next frame does not move twice",
  );
});

test("classic orbit remains an exact full-displacement route follower", () => {
  const app = harness({ classic: true, movingRoute: true });
  const initialCamera = app.camera.position.clone();
  const initialTarget = app.controls.target.clone();
  app.player.time = 3;
  app.updateScene(0.1);
  const routeDelta = app
    .sampleFlight(3)
    .red.position.clone()
    .sub(app.sampleFlight(0).red.position);
  nearVector(
    app.camera.position.clone().sub(initialCamera),
    routeDelta,
    "classic camera is unchanged",
  );
  nearVector(
    app.controls.target.clone().sub(initialTarget),
    routeDelta,
    "classic target is unchanged",
  );
});

test("vapor roots share the rendered aircraft pose when orbit controls rotate after sampling", () => {
  const app = harness({ rotateOnUpdate: true });
  app.pilot.update(0.1, { x: 1, y: 1 });
  const tips = [
    new THREE.Vector3(-6.43, -0.145, 0.13),
    new THREE.Vector3(6.43, -0.145, 0.13),
  ];
  const effects = createReferenceEffects(
    new THREE.Scene(),
    (time) => app.samplePilotedFlight(time),
    tips,
  );
  app.updateEffects = (time) => effects.update(time);
  app.updateScene(0);
  for (let side = 0; side < 2; side++) {
    const positions = effects.root.getObjectByName(`wing-ribbon-${side}`)
      .geometry.attributes.position;
    const actualRoot = new THREE.Vector3()
      .fromBufferAttribute(positions, 0)
      .add(new THREE.Vector3().fromBufferAttribute(positions, 1))
      .multiplyScalar(0.5);
    const renderedWing = tips[side]
      .clone()
      .applyQuaternion(app.red.quaternion)
      .add(app.red.position);
    nearVector(
      actualRoot,
      renderedWing,
      "ribbon root matches aircraft after orbit rotation",
      1e-5,
    );
  }
  effects.dispose();
});

test("paused orbit rotation freezes the aircraft and vapor roots until playback resumes", () => {
  const app = harness({ rotateOnUpdate: true });
  const tips = [
    new THREE.Vector3(-6.43, -0.145, 0.13),
    new THREE.Vector3(6.43, -0.145, 0.13),
  ];
  const effects = createReferenceEffects(
    new THREE.Scene(),
    (time) => app.samplePilotedFlight(time),
    tips,
  );
  app.updateEffects = (time) => effects.update(time);
  app.updateScene(0.1);
  app.player.paused = true;
  const frozenPosition = app.red.position.clone();
  const frozenAttitude = app.red.quaternion.clone();
  const frozenX = app.pilot.x;
  const orbitStart = app.camera.position.clone();
  for (let step = 0; step < 3; step++) {
    app.updateScene(0);
    nearVector(
      app.red.position,
      frozenPosition,
      "paused orbit cannot move the aircraft",
    );
    assert.ok(
      app.red.quaternion.equals(frozenAttitude),
      "paused attitude stays unchanged",
    );
    assert.equal(app.pilot.x, frozenX);
    for (let side = 0; side < 2; side++) {
      const positions = effects.root.getObjectByName(`wing-ribbon-${side}`)
        .geometry.attributes.position;
      const actualRoot = new THREE.Vector3()
        .fromBufferAttribute(positions, 0)
        .add(new THREE.Vector3().fromBufferAttribute(positions, 1))
        .multiplyScalar(0.5);
      const frozenWing = tips[side]
        .clone()
        .applyQuaternion(frozenAttitude)
        .add(frozenPosition);
      nearVector(
        actualRoot,
        frozenWing,
        "paused vapor root remains attached",
        1e-5,
      );
    }
  }
  assert.ok(
    app.camera.position.distanceTo(orbitStart) > 1,
    "camera remains freely orbitable while paused",
  );
  app.player.paused = false;
  app.updateScene(0.1);
  assert.ok(app.pilot.x > frozenX, "input resumes normally");
  assert.ok(
    app.red.position.distanceTo(frozenPosition) > 0.01,
    "resumed steering uses the current orbit frame",
  );
  effects.dispose();
});
