export const DIM = Object.freeze({
  ground: .07, femur: 1.63, tibia: 1.56, hipX: .9, hipY: 2.93, legZ: .68,
  tailSegments: 14,
});
export const ROAR = Object.freeze({duration: 3.6, start: .045, peak: .39, maxJaw: 1.04, voiceStart: .226, voiceEnd: .75});
const walkDuration = 2.8, turnDuration = 1.85;
const runDuration = walkDuration + ROAR.duration + turnDuration;
export const PATROL = Object.freeze({
  walk: walkDuration, turn: turnDuration, run: runDuration, duration: 2 * runDuration, distance: 3.28,
});
const TAU = Math.PI * 2;
const mod = n => ((n % 1) + 1) % 1;
const point = (x, y, z) => [x, y, z];
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};
const ramp = (phase, start, end) => ease((phase - start) / (end - start));
const envelope = (phase, start, attack, release, end) =>
  ramp(phase, start, attack) * (1 - ramp(phase, release, end));
const openMouth = phase => envelope(phase, ROAR.voiceStart, .326, .54, ROAR.voiceEnd);
export const roarStrengthAt = phase => openMouth(phase) * (1 - .24 * ramp(phase, .39, .66));
const blinkAt = (seconds, closure) => envelope(seconds, closure - .09, closure, closure + .035, closure + .17);
const restFeet = [
  {ankle: point(1.13, .57, -DIM.legZ), yaw: 0, contact: true},
  {ankle: point(.43, .57, DIM.legZ), yaw: 0, contact: true},
];

function solveLeg(motion, {ankle, yaw, contact}, index) {
  const side = index === 0 ? -1 : 1;
  const hip = point(DIM.hipX + motion.shift, DIM.hipY + motion.rise, side * DIM.legZ);
  const [dx, dy, dz] = ankle.map((value, axis) => value - hip[axis]);
  const distance = Math.hypot(dx, dy, dz);
  const along = (DIM.femur ** 2 - DIM.tibia ** 2 + distance ** 2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, DIM.femur ** 2 - along ** 2));
  const down = Math.hypot(dy, dz);
  const knee = point(
    hip[0] + along * dx / distance - bend * down / distance,
    hip[1] + along * dy / distance + bend * dx * dy / (distance * down),
    hip[2] + along * dz / distance + bend * dx * dz / (distance * down),
  );
  const hipAngle = Math.atan2(knee[1] - hip[1], knee[0] - hip[0]);
  const shinAngle = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]);
  return {
    side, hip, knee, ankle, yaw, contact,
    toe: point(ankle[0] - .76 * Math.cos(yaw), DIM.ground + ankle[1] - .57, ankle[2] + .76 * Math.sin(yaw)),
    angles: [hipAngle, shinAngle, shinAngle - hipAngle],
  };
}

function makePose(phase, motion, tail, heartPhase, feet = restFeet) {
  const heartAngle = mod(heartPhase) * TAU;
  return {
    phase, motion, tail, legs: feet.map((foot, index) => solveLeg(motion, foot, index)),
    jaw: motion.jaw,
    neck: motion.pitch + motion.headTilt,
    reactor: .6 + .4 * Math.sin(heartAngle) ** 2,
    reactorAngle: heartAngle,
  };
}

export function poseRex(input = 0, {heartPhase = input, from, blend = 1} = {}) {
  const phase = mod(input);
  const coil = envelope(phase, .08, .215, .215, .32);
  const lunge = envelope(phase, .215, .34, .44, .78);
  const call = openMouth(phase);
  const look = envelope(phase, .118, .322, .56, .94);
  const windup = envelope(phase, .038, .11, .14, .225);
  const recovery = envelope(phase, .63, .79, .80, .94);
  const ripple = call * Math.sin((phase - .32) * TAU * 8);
  const motion = {
    shift: .19 * coil - .50 * lunge + .035 * recovery,
    rise: -.18 * coil + .025 * lunge - .07 * recovery,
    pitch: .079 * coil - .107 * lunge + .048 * recovery,
    neckFlex: -.105 * coil + .19 * lunge + .07 * recovery,
    headTilt: .061 * coil - .14 * call + .074 * call * ramp(phase, .38, .59) + .061 * recovery,
    headYaw: .89 * look - .16 * windup + .045 * envelope(phase, .30, .39, .41, .55),
    jaw: .155 - .03 * coil + (ROAR.maxJaw - .17) * call + .015 * ripple,
    armBend: -.10 * coil + .20 * lunge + .035 * recovery,
    tailLift: -.026 * coil + .085 * lunge - .04 * recovery,
    roar: roarStrengthAt(phase),
  };
  const weight = ease(blend);
  if (from) {
    for (const key of Object.keys(motion)) motion[key] = from.motion[key] + (motion[key] - from.motion[key]) * weight;
  }
  const tail = Array.from({length: DIM.tailSegments}, (_, index) => {
    const delay = index * .011;
    const follow = envelope(phase, .22 + delay, .34 + delay, .47 + delay, .79 + delay);
    const yaw = .012 * Math.sin(phase * TAU - index * .33) + follow * (.033 - index * .0025);
    return from ? from.tail[index] + (yaw - from.tail[index]) * weight : yaw;
  });
  return {...makePose(phase, motion, tail, heartPhase), blink: blinkAt(phase * ROAR.duration, 2.96)};
}

function footfall(progress, order) {
  const first = clamp(progress * 4 - order);
  const second = clamp(progress * 4 - order - 2);
  const swing = first < 1 ? first : second;
  return {
    advance: (ease(first) + ease(second)) / 2,
    lift: 16 * (swing * (1 - swing)) ** 2,
    contact: swing === 0 || swing === 1,
  };
}

function travelingPose(progress, turning, heading, yaw, heartPhase) {
  const stride = turning ? 0 : PATROL.distance * ease(progress);
  const firstFoot = turning && heading > 0 ? 1 : 0;
  const feet = restFeet.map(({ankle}, index) => {
    const step = footfall(progress, index === firstFoot ? 0 : 1);
    const footYaw = turning ? (Math.PI - 2 * heading) * step.advance + heading - yaw : 0;
    const fore = ankle[0] - DIM.hipX;
    const depth = ankle[2];
    return {
      ankle: point(
        DIM.hipX + fore * Math.cos(footYaw) + depth * Math.sin(footYaw) + (turning ? 0 : stride - PATROL.distance * step.advance),
        ankle[1] + step.lift * (turning ? .30 : .46),
        depth * Math.cos(footYaw) - fore * Math.sin(footYaw),
      ),
      yaw: footYaw, contact: step.contact,
    };
  });
  const effort = envelope(progress, 0, .14, .82, 1);
  const gait = progress * TAU * 2;
  const pitch = effort * (-.028 + .029 * Math.sin(gait * 2));
  const motion = {
    shift: 0, rise: effort * (.082 * Math.sin(gait) ** 2 - .045),
    pitch, neckFlex: -.65 * pitch, headTilt: -.76 * pitch,
    headYaw: .024 * effort * Math.sin(gait), jaw: .155, roar: 0,
    armBend: .072 * effort * Math.sin(gait), tailLift: .024 * effort * Math.sin(gait * 2),
  };
  const tail = Array.from({length: DIM.tailSegments}, (_, index) =>
    (heading === 0 ? 1 : -1) * .012 * Math.sin(-index * .33) + .018 * effort * Math.sin(gait - index * .24));
  return {
    ...makePose(0, motion, tail, heartPhase, feet),
    blink: turning ? blinkAt(progress * PATROL.turn, .84) : blinkAt(progress * PATROL.walk, 1.12),
    path: {x: signedEndpoint(heading) - stride * Math.cos(heading), z: 0, yaw},
  };
}

const signedEndpoint = heading => DIM.hipX + PATROL.distance / 2 * Math.cos(heading);

export function posePatrol(seconds = 0, {heartPhase = seconds * .45} = {}) {
  const time = mod(seconds / PATROL.duration) * PATROL.duration;
  const returning = time >= PATROL.run;
  const heading = returning ? Math.PI : 0;
  const elapsed = returning ? time - PATROL.run : time;
  const cyclePhase = elapsed / PATROL.run;
  if (elapsed < PATROL.walk) {
    return {...travelingPose(elapsed / PATROL.walk, false, heading, heading, heartPhase), stage: 'walk', cyclePhase};
  }
  const sinceStop = elapsed - PATROL.walk;
  const endpoint = signedEndpoint(Math.PI - heading);
  if (sinceStop < ROAR.duration) {
    const pose = poseRex(sinceStop / ROAR.duration, {heartPhase});
    if (returning) {
      pose.motion.headYaw *= -1.24;
      pose.tail = pose.tail.map(yaw => -yaw);
    }
    return {...pose, path: {x: endpoint, z: 0, yaw: heading}, stage: 'roar', cyclePhase};
  }
  const turn = (sinceStop - ROAR.duration) / PATROL.turn;
  const yaw = heading + (Math.PI - 2 * heading) * ease(turn);
  const pose = travelingPose(turn, true, heading, yaw, heartPhase);
  pose.path.x = endpoint;
  const turnBlend = ease(turn);
  for (let index = 0; index < pose.tail.length; index++) {
    pose.tail[index] *= 1 - 2 * turnBlend;
  }
  return {...pose, stage: 'turn', cyclePhase};
}

export function transitionPose(from, to, progress) {
  const weight = ease(progress);
  const mix = (initial, target) => initial + (target - initial) * weight;
  const motion = Object.fromEntries(Object.entries(to.motion).map(([name, value]) => [name, mix(from.motion[name], value)]));
  return {
    ...to, motion, jaw: motion.jaw,
    blink: mix(from.blink, to.blink),
    tail: to.tail.map((angle, index) => mix(from.tail[index], angle)),
    legs: to.legs.map((leg, index) => {
      const initial = from.legs[index];
      return solveLeg(motion, {
        ankle: leg.ankle.map((value, axis) => mix(initial.ankle[axis], value)),
        yaw: mix(initial.yaw, leg.yaw),
        contact: initial.contact && leg.contact,
      }, index);
    }),
  };
}
