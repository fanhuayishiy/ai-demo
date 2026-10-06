import * as THREE from "three";

export const DURATION = 72;

export const SHOTS = Object.freeze(
  [
    {
      id: "sea-skimming",
      title: "掠海",
      subtitle: "Above the Adriatic",
      start: 0,
      end: 12,
    },
    {
      id: "pursuit",
      title: "追逐",
      subtitle: "A familiar rival",
      start: 12,
      end: 24,
    },
    {
      id: "crossing",
      title: "交错",
      subtitle: "Between the wings",
      start: 24,
      end: 36,
    },
    {
      id: "climb",
      title: "爬升",
      subtitle: "Into the blue",
      start: 36,
      end: 48,
    },
    {
      id: "turn",
      title: "回旋",
      subtitle: "One more dance",
      start: 48,
      end: 60,
    },
    {
      id: "homeward",
      title: "远航",
      subtitle: "Until we meet again",
      start: 60,
      end: 72,
    },
  ].map(Object.freeze),
);

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const DIFFERENTIAL = 0.015;
const ROUTE_SCALE = 1.8;

function normalizedTime(time) {
  return ((time % DURATION) + DURATION) % DURATION;
}

function phase(time) {
  return (normalizedTime(time) / DURATION) * TAU;
}

function redPosition(time) {
  const angle = phase(time);
  return new THREE.Vector3(
    ROUTE_SCALE * (185 * Math.sin(angle) + 32 * Math.sin(angle * 3)),
    // The phase is chosen so both aircraft rise for the entire 36–48 s climb.
    82 - 14 * Math.sin(angle - 0.3) - 7 * Math.sin(angle * 2 + 0.4),
    ROUTE_SCALE * (160 * Math.cos(angle) + 22 * Math.sin(angle * 2)),
  );
}

// An upright moving reference frame gives both pursuit spacing and camera
// dolly motion a steady horizon, independent of the aircraft's bank.
function redFrame(time) {
  const forward = redPosition(time + DIFFERENTIAL).sub(
    redPosition(time - DIFFERENTIAL),
  );
  forward.y = 0;
  forward.normalize();
  return {
    forward,
    right: new THREE.Vector3().crossVectors(UP, forward).normalize(),
  };
}

function bluePosition(time) {
  const angle = phase(time);
  const pursuit = angle * 2 - 0.7;
  const { forward, right } = redFrame(time);
  // An elliptical exchange of places: the opponent passes from a trailing
  // quarter to the outside wing, then crosses ahead. The two horizontal
  // offsets never vanish together, preserving >26 m of spacing.
  return redPosition(time)
    .addScaledVector(right, 26 * Math.sin(pursuit))
    .addScaledVector(forward, -30 * Math.cos(pursuit))
    .addScaledVector(UP, 10 + 5 * Math.sin(angle * 2 + 1));
}

function aircraftPose(positionAt, time) {
  const position = positionAt(time);
  const before = positionAt(time - DIFFERENTIAL);
  const after = positionAt(time + DIFFERENTIAL);
  const forward = after.clone().sub(before).normalize();
  const right = new THREE.Vector3().crossVectors(UP, forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, up, forward);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

  const incoming = position.clone().sub(before).normalize();
  const outgoing = after.clone().sub(position).normalize();
  const turnRate =
    Math.atan2(
      incoming.z * outgoing.x - incoming.x * outgoing.z,
      incoming.x * outgoing.x + incoming.z * outgoing.z,
    ) / DIFFERENTIAL;
  // Banking is a response to the actual turn, not an unrelated animation.
  const bank = THREE.MathUtils.clamp(-turnRate * 2.5, -0.72, 0.72);
  quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(FORWARD, bank));
  return { position, quaternion: quaternion.normalize() };
}

/** Pure sampling supports pause, scrubbing, seeking, and a seamless loop. */
export function sampleFlight(time) {
  const loopTime = normalizedTime(time);
  return {
    red: aircraftPose(redPosition, loopTime),
    blue: aircraftPose(bluePosition, loopTime),
  };
}

// Deliberate editorial cuts every 12 seconds. Within a shot the dolly movement
// is slow and bounded; there is no free-running orbit or accumulated state.
const CAMERA_SHOTS = [
  {
    offset: [18, 7, 25],
    drift: [1, 1, -1],
    blueWeight: 0.22,
    fov: 42,
    roll: 0.025,
  },
  {
    offset: [-37, 8, 4],
    drift: [-3, 2, -6],
    blueWeight: 0.32,
    fov: 47,
    roll: -0.035,
  },
  {
    offset: [18, 9, -28],
    drift: [2, 3, 2],
    blueWeight: 0.34,
    fov: 50,
    roll: 0.045,
  },
  {
    offset: [27, -32, 25],
    drift: [5, 7, -4],
    blueWeight: 0.25,
    fov: 46,
    roll: -0.035,
  },
  {
    offset: [-33, 16, 24],
    drift: [-4, 2, -5],
    blueWeight: 0.38,
    fov: 48,
    roll: 0.12,
  },
  {
    offset: [88, 42, -100],
    drift: [15, 9, -18],
    blueWeight: 0.5,
    fov: 50,
    roll: 0.015,
  },
];

export function sampleCamera(time, mode = "cinematic") {
  const loopTime = normalizedTime(time);
  const shotIndex = Math.min(5, Math.floor(loopTime / 12));
  const progress = (loopTime - SHOTS[shotIndex].start) / 12;
  const state = sampleFlight(loopTime);
  const { forward, right } = redFrame(loopTime);
  let config = CAMERA_SHOTS[shotIndex];

  if (mode === "chase") {
    config = {
      offset: [0, 17, -53],
      drift: [0, 0, 0],
      blueWeight: 0.2,
      fov: 47,
      roll: 0,
    };
  } else if (mode === "wide") {
    config = {
      offset: [100, 65, -120],
      drift: [0, 0, 0],
      blueWeight: 0.5,
      fov: 50,
      roll: 0,
    };
  }

  const drift = Math.sin(progress * Math.PI - Math.PI / 2);
  const offset = config.offset.map(
    (value, axis) => value + config.drift[axis] * drift,
  );
  const position = state.red.position
    .clone()
    .addScaledVector(right, offset[0])
    .addScaledVector(UP, offset[1])
    .addScaledVector(forward, offset[2]);
  const target = state.red.position
    .clone()
    .lerp(state.blue.position, config.blueWeight);

  return {
    position,
    target,
    fov: config.fov,
    roll: config.roll * Math.sin(progress * Math.PI),
    shotIndex,
  };
}
