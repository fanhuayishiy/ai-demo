const clamp = value => Math.min(1, Math.max(0, value));

// Scene coordinates follow the T50 overview and orthographic drawing.
export const ROTOR_MOUNTS = [
  {sign: -1, front: true, x: -1.982, y: .051, z: 1.653, angle: .65, hand: 1},
  {sign: 1, front: true, x: 1.982, y: .051, z: 1.653, angle: -.55, hand: -1},
  {sign: -1, front: false, x: -1.907, y: .218, z: -1.650, angle: -.84, hand: -1},
  {sign: 1, front: false, x: 1.907, y: .218, z: -1.650, angle: .76, hand: 1},
];

export const PHASES = {
  propellers: [0, .57],
  tank: [.07, .69],
  nozzles: [.15, .88],
  motorTop: [.21, .85],
  arms: [.27, .95],
  battery: [.29, .93],
  sensors: [.30, .93],
  gear: [.32, .98],
  motorCore: [.40, .94],
  frame: [.42, 1],
  avionics: [.44, 1],
};

export function travel(value, start, end) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export const FLIGHT = {
  seconds: 14.4, span: 4.5, ceiling: 1.80, floor: -1.25,
  spinUp: [.60, 2.65], liftOff: [1.87, 4.10], glide: [4.10, 8.87], descent: [9.0, 12.0], spinDown: [12.0, 14.22],
  sprayOn: [5.15, 5.65], sprayOff: [8.05, 8.55],
};

// Integral of the same smoothstep used for the visible acceleration and slowdown.
function integratedTravel(time, start, end) {
  const length = end - start;
  const u = clamp((time - start) / length);
  return length * u ** 3 * (1 - u * .5) + Math.max(0, time - end);
}

export function flightPose(time) {
  const t = Math.max(0, Math.min(time, FLIGHT.seconds));
  const forward = travel(t, ...FLIGHT.glide);
  const lift = FLIGHT.ceiling * travel(t, ...FLIGHT.liftOff) * (1 - travel(t, ...FLIGHT.descent));
  const pitch = .108 * (4 * forward * (1 - forward)) ** 2;
  const spray = travel(t, ...FLIGHT.sprayOn) * (1 - travel(t, ...FLIGHT.sprayOff));
  const phase = t < FLIGHT.spinUp[0] ? 'ready' : t < FLIGHT.glide[0] ? 'takeoff'
    : spray > 0 ? 'spray' : t < FLIGHT.descent[0] ? 'forward' : t < FLIGHT.descent[1] ? 'landing' : 'landed';
  return {
    time: t, phase, lift, z: FLIGHT.span * (forward - .5), pitch, spray,
    rotorSpeed: travel(t, ...FLIGHT.spinUp) * (1 - travel(t, ...FLIGHT.spinDown)),
    rotorAngle: 31 * (integratedTravel(t, ...FLIGHT.spinUp) - integratedTravel(t, ...FLIGHT.spinDown)),
  };
}

export const TOUR_SECONDS = 28;

export function tourPose(time) {
  const t = (time % TOUR_SECONDS + TOUR_SECONDS) % TOUR_SECONDS;
  const focus = t >= 9.5 && t < 14 ? 'motors' : t >= 15.5 && t < 20 ? 'sensors' : null;
  return {
    amount: travel(t, 1.8, 5.6) * (1 - travel(t, 24, 27.5)),
    focus,
    view: t >= 20 && t < 25 ? 'top' : 'hero',
  };
}
