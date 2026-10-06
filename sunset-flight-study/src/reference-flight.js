import * as THREE from "three";

export const DURATION = 24;

export const SHOTS = Object.freeze(
  [
    {
      id: "following",
      title: "尾随",
      subtitle: "SWALLOW · FOLLOW",
      start: 0,
      end: 6,
    },
    {
      id: "scissors",
      title: "剪刀",
      subtitle: "SWALLOW · SCISSORS",
      start: 6,
      end: 12,
    },
    {
      id: "turn",
      title: "回旋",
      subtitle: "SWALLOW · TURN",
      start: 12,
      end: 18,
    },
    {
      id: "spiral-dive",
      title: "俯冲",
      subtitle: "SWALLOW · SPIRAL DIVE",
      start: 18,
      end: 24,
    },
  ].map(Object.freeze),
);

const TAU = 2 * Math.PI;
const ANGULAR_SPEED = TAU / DURATION;
const ROUTE_ROTATION = 2.65;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

function loopTime(time) {
  return ((time % DURATION) + DURATION) % DURATION;
}

// Derivatives are analytic: even seeking across the loop cannot introduce a
// finite-difference wobble. Two radial harmonics give genuine curvature
// reversals / scissors while keeping the corridor within 340 +/- 45 metres.
function route(time, following = false) {
  const phase = loopTime(time) * ANGULAR_SPEED - (following ? 0.1 : 0);
  const a = 3 * phase + 0.4;
  const b = 5 * phase - 0.8;
  const radius =
    340 + 28 * Math.sin(a) + 17 * Math.sin(b) + (following ? 24 : 0);
  const radialVelocity = 84 * Math.cos(a) + 85 * Math.cos(b);
  const radialAcceleration = -252 * Math.sin(a) - 425 * Math.sin(b);
  const sin = Math.sin(phase);
  const cos = Math.cos(phase);
  const altitude = 420 - 64 * Math.cos(phase - 0.5) - 22 * Math.sin(2 * phase);
  const climb = 64 * Math.sin(phase - 0.5) - 44 * Math.cos(2 * phase);
  const climbAcceleration =
    64 * Math.cos(phase - 0.5) + 88 * Math.sin(2 * phase);
  const position = new THREE.Vector3(
    radius * sin,
    altitude + (following ? 12 : 0),
    radius * cos,
  );
  const velocity = new THREE.Vector3(
    radialVelocity * sin + radius * cos,
    climb,
    radialVelocity * cos - radius * sin,
  ).multiplyScalar(ANGULAR_SPEED);
  const acceleration = new THREE.Vector3(
    (radialAcceleration - radius) * sin + 2 * radialVelocity * cos,
    climbAcceleration,
    (radialAcceleration - radius) * cos - 2 * radialVelocity * sin,
  ).multiplyScalar(ANGULAR_SPEED ** 2);
  for (const vector of [position, velocity, acceleration]) {
    vector.applyAxisAngle(UP, ROUTE_ROTATION);
  }
  return { position, velocity, acceleration };
}

function bankForRoute({ velocity, acceleration }) {
  const turnRate =
    (velocity.z * acceleration.x - velocity.x * acceleration.z) /
    (velocity.x ** 2 + velocity.z ** 2);
  // Soft saturation preserves derivatives at full bank. Bank responds to the
  // real route curvature; it is not a disconnected decorative roll animation.
  return -1.28 * Math.tanh(turnRate * 4.7);
}

function aircraftPose(time, following = false, easeCamera = false) {
  const sample = route(time, following);
  const { position, velocity } = sample;
  const forward = velocity.clone().normalize();
  const right = new THREE.Vector3().crossVectors(UP, forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up, forward),
  );
  let bank = bankForRoute(sample);
  if (easeCamera) {
    // A symmetric binomial shutter eases the camera's bank without a mutable
    // spring, playback lag, or quaternion sign seams. The airplane itself
    // keeps its precise bank; only the camera's mounting frame is softened.
    bank =
      (6 * bank +
        4 * bankForRoute(route(time - 0.4)) +
        4 * bankForRoute(route(time + 0.4)) +
        bankForRoute(route(time - 0.8)) +
        bankForRoute(route(time + 0.8))) /
      16;
  }
  quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(FORWARD, bank));
  return { position, quaternion: quaternion.normalize() };
}

/** Pure, independently owned poses for playback, pause, negative time and seek. */
export function sampleFlight(time) {
  return { red: aircraftPose(time), blue: aircraftPose(time, true) };
}

// These are continuous camera poses, not editorial cuts. Quintic interpolation
// has zero first and second derivatives at chapter boundaries and at 24 -> 0.
const CAMERA_CHAPTERS = [
  {
    side: 1.7,
    height: 7,
    rear: 21.7,
    fov: 48,
    follow: 0.9,
    aimX: 3.1,
    aimY: 3.0,
  },
  {
    side: -1.2,
    height: 7.4,
    rear: 22.0,
    fov: 48,
    follow: 0.9,
    aimX: 3.0,
    aimY: 3.0,
  },
  {
    side: 2.0,
    height: 7.8,
    rear: 22.0,
    fov: 48,
    follow: 0.92,
    aimX: 3.2,
    aimY: 3.2,
  },
  {
    side: 2.0,
    height: 7.0,
    rear: 21.4,
    fov: 48,
    follow: 0.94,
    aimX: 3.0,
    aimY: 3.0,
  },
];
const CHASE_CAMERA = {
  side: 0.5,
  height: 12,
  rear: 19,
  fov: 47,
  follow: 0.9,
  aimX: 0.8,
  aimY: 2,
};
const WIDE_CAMERA = {
  side: 16,
  height: 30,
  rear: 55,
  fov: 50,
  follow: 0.72,
  aimX: 4,
  aimY: 4,
};

function cameraConfig(time, shotIndex, mode) {
  if (mode === "chase") return CHASE_CAMERA;
  if (mode === "wide") return WIDE_CAMERA;
  const progress = (time - SHOTS[shotIndex].start) / 6;
  const blend = progress ** 3 * (progress * (progress * 6 - 15) + 10);
  const current = CAMERA_CHAPTERS[shotIndex];
  const next = CAMERA_CHAPTERS[(shotIndex + 1) % CAMERA_CHAPTERS.length];
  return Object.fromEntries(
    Object.keys(current).map((key) => [
      key,
      THREE.MathUtils.lerp(current[key], next[key], blend),
    ]),
  );
}

function screenFrame(position, target, aircraftUp, follow) {
  const forward = target.clone().sub(position).normalize();
  const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  // A rear camera looks down local -Z while the aircraft noses along +Z.
  // Projecting the aircraft up vector handles this opposite roll convention
  // (and the rear-quarter pitch) instead of simply copying its Euler bank.
  const roll = Math.atan2(-aircraftUp.dot(right), aircraftUp.dot(up)) * follow;
  return {
    right: right
      .clone()
      .multiplyScalar(Math.cos(roll))
      .addScaledVector(up, Math.sin(roll)),
    up: up
      .clone()
      .multiplyScalar(Math.cos(roll))
      .addScaledVector(right, -Math.sin(roll)),
    roll,
  };
}

/** Apply with camera.up=(0,1,0), lookAt(target), then camera.rotateZ(roll). */
export function sampleCamera(time, mode = "cinematic") {
  const normalized = loopTime(time);
  const shotIndex = Math.floor(normalized / 6);
  const config = cameraConfig(normalized, shotIndex, mode);
  const plane = aircraftPose(normalized, false, true);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(plane.quaternion);
  const up = UP.clone().applyQuaternion(plane.quaternion);
  const forward = FORWARD.clone().applyQuaternion(plane.quaternion);
  forward.y = 0;
  forward.normalize();
  // Bank-relative elevation reveals the upper wing throughout the turn. A
  // horizontal rear offset and small world-up lift keep the camera above the
  // aircraft even in the dive; they never accumulate state or lag on seeking.
  const position = plane.position
    .clone()
    .addScaledVector(right, config.side)
    .addScaledVector(up, config.height)
    .addScaledVector(forward, -config.rear)
    .addScaledVector(UP, 2.5);
  const screen = screenFrame(position, plane.position, up, config.follow);
  // Look above/left of the plane in rolled screen space, leaving it large and
  // lower-right, with open space ahead for sunset and cloud silhouettes.
  const target = plane.position
    .clone()
    .addScaledVector(screen.right, -config.aimX)
    .addScaledVector(screen.up, config.aimY);
  const { roll } = screenFrame(position, target, up, config.follow);
  return { position, target, fov: config.fov, roll, shotIndex };
}
