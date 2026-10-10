import type { UnitState, Vec3 } from "../types";
import { AIRCRAFT_TIMING, cargoFlightTime, cargoMissionDuration } from "../simulation/aircraft";
import {
  AIR_FIRE_POSITION,
  CARGO_POSITION,
  GROUND_BASKET_POSITION,
  ROOFTOP_BASKET_POSITION,
  ROOFTOP_CARGO_LANDING,
  STAGING,
  SURFACE_Y,
  VEHICLE_SCALE,
} from "../spatial/layout";
import { ROTOR_ARM, ROTOR_BLADE_HALF, vehicleToWorld } from "./helpers";

export type FlightStage =
  | "docked"
  | "takeoff"
  | "transit"
  | "working"
  | "delivering"
  | "returning";
export interface FlightPose {
  position: Vec3;
  scale: number;
  heading: number;
  airborne: boolean;
  workReady: boolean;
  stage: FlightStage;
  hook: Vec3;
  nozzle: Vec3;
}
export interface CargoLoadPose {
  position: Vec3;
  cableEnd: Vec3;
  attached: boolean;
  count: number;
}
type Frame = [number, Vec3];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: Vec3, b: Vec3, t: number): Vec3 =>
  t <= 0
    ? [...a]
    : t >= 1
      ? [...b]
      : (a.map((n, i) => n + (b[i] - n) * t) as Vec3);
const add = (a: Vec3, b: Vec3): Vec3 => a.map((n, i) => n + b[i]) as Vec3;
const heading = (unit: UnitState) =>
  unit.heading ?? STAGING[unit.id]?.heading ?? 0;
const onCarrier = (unit: UnitState, p: Vec3) =>
  vehicleToWorld(p, unit.position, heading(unit), VEHICLE_SCALE);
const atFrames = (frames: Frame[], time: number): Vec3 => {
  for (let i = 1; i < frames.length; i++) {
    if (time <= frames[i][0] && frames[i][0] > frames[i - 1][0]) {
      return mix(
        frames[i - 1][1],
        frames[i][1],
        (time - frames[i - 1][0]) / (frames[i][0] - frames[i - 1][0]),
      );
    }
  }
  return [...frames[frames.length - 1][1]];
};

export const FIRE_TARGETS: Vec3[] = [
  [12.5, 10, 15],
  [13.5, 16, 15],
  AIR_FIRE_POSITION,
];
export const CARGO_LANDING = ROOFTOP_CARGO_LANDING;
export const CARGO_LOAD_SIZE: Vec3 = [1.3, 0.7, 0.72];
export const CARGO_ROTOR_HALF: Vec3 = [3.7, 0.85, 3];
export const CARGO_GEAR_BOTTOM = 1.6;
export const FIRE_DOCK_X = [-2.95, -1.35, 0.25];
export const FIRE_DOCK_Y = 3.32;
export const FIRE_FOLDED_SCALES = [0.2, 0.2, 0.24];

export function carrierDock(
  unit: UnitState,
  kind: "fire-drone" | "cargo",
  index = 0,
): Vec3 {
  return onCarrier(
    unit,
    kind === "cargo" ? [-1.1, 4.55, 0] : [FIRE_DOCK_X[index], FIRE_DOCK_Y, 0],
  );
}

const fireScale = (index: number, position: Vec3, dock: Vec3) => {
  const folded = FIRE_FOLDED_SCALES[index] * VEHICLE_SCALE;
  return (
    folded +
    ((index === 2 ? 1.2 : 0.6) - folded) *
      clamp((position[1] - dock[1] - 0.8) / 3)
  );
};
function firePose(unit: UnitState, index: number, time: number): FlightPose {
  const elapsed = Math.max(0, time - AIRCRAFT_TIMING.fire.launchOffsets[index]);
  const dock = carrierDock(unit, "fire-drone", index),
    target = FIRE_TARGETS[index];
  const position = atFrames(
    [
      [0, dock],
      [4, [dock[0], 8 + index * 1.5, dock[2]]],
      [8, [dock[0], 14 + index * 8, 22 + index * 3]],
      [12, [target[0], 14 + index * 8, 22 + index * 3]],
      [16, target],
    ],
    elapsed,
  );
  const scale = fireScale(index, position, dock),
    h = heading(unit) * (1 - clamp(elapsed / 4));
  return {
    position,
    scale,
    heading: h,
    airborne: elapsed > 0,
    workReady: elapsed >= 16 && unit.status === "working" && unit.battery > 8,
    stage:
      elapsed <= 0
        ? "docked"
        : elapsed < 4
          ? "takeoff"
          : elapsed < 16
            ? "transit"
            : "working",
    hook: vehicleToWorld(
      index === 2 ? [0, -1.75, 0] : [-4, -1.3, 0],
      position,
      h,
      scale,
    ),
    nozzle: vehicleToWorld([0, -1.25, -1.7], position, h, scale),
  };
}

export function fireAircraftPose(unit: UnitState, index: number): FlightPose {
  if (!unit.airReturning) return firePose(unit, index, unit.airTime ?? 0);
  const from = unit.airReturnFrom ?? unit.airTime ?? 0;
  const source = firePose(unit, index, from),
    dock = carrierDock(unit, "fire-drone", index);
  const elapsed = Math.max(0, (unit.airReturnTime ?? 0) - (2 - index) * 4);
  const cruise = 14 + index * 8;
  const position = !source.airborne
    ? dock
    : from - AIRCRAFT_TIMING.fire.launchOffsets[index] < 4
      ? mix(source.position, dock, elapsed / 16)
      : atFrames(
          [
            [0, source.position],
            [3, [source.position[0], cruise, source.position[2]]],
            [5, [source.position[0], cruise, 22 + index * 3]],
            [10, [dock[0], cruise, 22 + index * 3]],
            [13, [dock[0], 8 + index * 1.5, dock[2]]],
            [16, dock],
          ],
          elapsed,
        );
  const scale = fireScale(index, position, dock),
    h = !source.airborne
      ? heading(unit)
      : source.heading * (1 - clamp(elapsed / 3)) +
        heading(unit) * clamp((elapsed - 12) / 4);
  return {
    position,
    scale,
    heading: h,
    airborne: source.airborne && elapsed < 16,
    workReady: false,
    stage: source.airborne && elapsed < 16 ? "returning" : "docked",
    hook: vehicleToWorld(
      index === 2 ? [0, -1.75, 0] : [-4, -1.3, 0],
      position,
      h,
      scale,
    ),
    nozzle: vehicleToWorld([0, -1.25, -1.7], position, h, scale),
  };
}

const cargoScale = (position: Vec3, dock: Vec3) =>
  0.34 + 0.66 * clamp((position[1] - dock[1] - 0.6) / 3);
function cargoPose(unit: UnitState, time: number): FlightPose {
  const dock = carrierDock(unit, "cargo"),
    mission = cargoMissionDuration(unit),
    rescueMission = !!(unit.airRescuePassenger || unit.airRescueDelivered);
  const aboveRoof: Vec3 = [CARGO_POSITION[0], 42, CARGO_POSITION[2]];
  const groundHover: Vec3 = [GROUND_BASKET_POSITION[0] + 1.15, 9, GROUND_BASKET_POSITION[2]];
  const returnFrames: Frame[] = rescueMission
    ? [
        [48, aboveRoof],
        [54, [groundHover[0], 42, groundHover[2]]],
        [AIRCRAFT_TIMING.roofRescue.groundApproach, groundHover],
        [AIRCRAFT_TIMING.roofRescue.groundRetract, groundHover],
        [mission - 4, [dock[0], 9, dock[2]]],
        [mission, dock],
      ]
    : [
        [48, aboveRoof],
        [53, [25, 42, CARGO_POSITION[2]]],
        [58, [dock[0], 42, dock[2]]],
        [60, [dock[0], 22, dock[2]]],
        [mission, dock],
      ];
  const position = atFrames(
    [
      [0, dock],
      [4, [dock[0], 12, dock[2]]],
      [8, [dock[0], 42, dock[2]]],
      [11, [25, 42, dock[2]]],
      [14, [25, 42, CARGO_POSITION[2]]],
      [16, aboveRoof],
      [22, CARGO_POSITION],
      [44, CARGO_POSITION],
      ...returnFrames,
    ],
    time,
  );
  const scale = cargoScale(position, dock),
    h =
      heading(unit) * (time < 4 ? 1 - clamp(time / 4) : clamp((time - mission + 4) / 4));
  return {
    position,
    scale,
    heading: h,
    airborne: time > 0 && time < mission,
    workReady: time >= 22 && time < 44 && unit.status === "working",
    stage:
      time <= 0 || time >= mission
        ? "docked"
        : time < 4
          ? "takeoff"
          : time < 22
            ? "transit"
            : time < 44
              ? "delivering"
              : "returning",
    hook: vehicleToWorld([0, -0.75, 0], position, h, scale),
    nozzle: [...position],
  };
}

export function cargoAircraftPose(unit: UnitState): FlightPose {
  if (!unit.airReturning || unit.airRescueRecovery) {
    const pose = cargoPose(unit, cargoFlightTime(unit));
    return unit.airRescueRecovery
      ? { ...pose, workReady: false, stage: pose.airborne ? "returning" : "docked" }
      : pose;
  }
  const from = unit.airReturnFrom ?? unit.airTime ?? 0,
    elapsed = unit.airReturnTime ?? 0;
  const source = cargoPose(unit, from),
    dock = carrierDock(unit, "cargo");
  const aboveDock =
    Math.hypot(source.position[0] - dock[0], source.position[2] - dock[2]) <
    0.01;
  const hold = from >= 22 && from < 44 ? 8 : 0;
  const position = aboveDock
    ? mix(source.position, dock, elapsed / AIRCRAFT_TIMING.return)
    : atFrames(
        [
          [0, source.position],
          [hold, source.position],
          [hold + 4, [source.position[0], 42, source.position[2]]],
          [hold + 9, [dock[0], 42, source.position[2]]],
          [hold + 12, [dock[0], 42, dock[2]]],
          [24, dock],
        ],
        elapsed,
      );
  const scale = cargoScale(position, dock),
    h =
      source.heading * (1 - clamp(elapsed / 4)) +
      heading(unit) * clamp((elapsed - 20) / 4);
  return {
    position,
    scale,
    heading: h,
    airborne: source.airborne && elapsed < 24,
    workReady: false,
    stage: elapsed < 24 && source.airborne ? "returning" : "docked",
    hook: vehicleToWorld([0, -0.75, 0], position, h, scale),
    nozzle: [...position],
  };
}

const carriedLoad = (unit: UnitState, position: Vec3): Vec3 => {
  const dock = carrierDock(unit, "cargo"),
    dockLoad = onCarrier(unit, [-1.1, 1.925, 0]);
  const dockGap = dock[1] - dockLoad[1],
    extension = clamp((position[1] - dock[1]) / (12 - dock[1]));
  return add(position, [0, -dockGap - (3.7 - dockGap) * extension, 0]);
};
function normalLoad(unit: UnitState, time: number): Vec3 {
  if (time < 22) return carriedLoad(unit, cargoPose(unit, time).position);
  return atFrames(
    [
      [22, carriedLoad(unit, CARGO_POSITION)],
      [34, CARGO_LANDING],
    ],
    time,
  );
}
function normalCable(unit: UnitState, time: number): Vec3 {
  return time < 34
    ? add(normalLoad(unit, time), [0, 0.86, 0])
    : mix(
        add(CARGO_LANDING, [0, 0.86, 0]),
        add(cargoPose(unit, time).hook, [0, -1.4, 0]),
        (time - 34) / 10,
      );
}
export function cargoLoadPose(
  unit: UnitState,
  deliveredCount = 0,
): CargoLoadPose {
  const returning = unit.airReturning && !unit.airRescueRecovery;
  const from = returning
    ? (unit.airReturnFrom ?? unit.airTime ?? 0)
    : cargoFlightTime(unit);
  const released = deliveredCount > 0 || from >= AIRCRAFT_TIMING.cargo.delivery;
  const elapsed = unit.airReturnTime ?? 0,
    pose = cargoAircraftPose(unit);
  const position = released
    ? ([...CARGO_LANDING] as Vec3)
    : !returning
      ? normalLoad(unit, from)
      : from >= 22 && elapsed <= 8
        ? normalLoad(unit, from - (from - 22) * clamp(elapsed / 8))
        : carriedLoad(unit, pose.position);
  const cableEnd = !released
    ? add(position, [0, 0.86, 0])
    : !returning
      ? normalCable(unit, from)
      : mix(normalCable(unit, from), add(pose.hook, [0, -1.4, 0]), elapsed / 8);
  return { position, cableEnd, attached: !released, count: 4 };
}

export function rescueBasketPose(unit: UnitState) {
  const aircraft = cargoAircraftPose(unit);
  const extension = aircraft.airborne ? clamp(unit.airLiftDeployment ?? 0) : 0;
  const occupied = !!unit.airRescuePassenger && !unit.airRescueDelivered;
  const boarding = !unit.airRescueDelivered ? clamp(unit.airRescueBoarding ?? 0) : 0;
  // Keep person-sized headroom in transit and fold it continuously after handoff.
  const occupancy = occupied ? 1 : unit.airRescueDelivered ? extension : boarding;
  const unfolded = Math.max(extension, occupancy),
    railHeight = 0.1 + 0.6 * unfolded,
    slingHeight = 0.12 + 1.23 * unfolded + 0.75 * occupancy;
  const scale = occupied || boarding > 0 ? 1 : aircraft.scale;
  const stowedGap = unit.airRescueDelivered ? 0.9 : 0.9 + 3.3 * occupancy;
  const stowed = vehicleToWorld(
    [-1.15, -stowedGap, 0],
    aircraft.position,
    aircraft.heading,
    aircraft.scale,
  );
  const receivingPosition = (unit.airRescuePassenger || unit.airRescueDelivered)
    && cargoFlightTime(unit) >= AIRCRAFT_TIMING.roofRescue.groundApproach
    ? GROUND_BASKET_POSITION : ROOFTOP_BASKET_POSITION;
  const position = mix(stowed, receivingPosition, extension);
  return {
    position,
    extension,
    scale,
    heading: aircraft.heading,
    railHeight,
    slingHeight,
    hook: vehicleToWorld(
      [-1.15, -0.75, 0],
      aircraft.position,
      aircraft.heading,
      aircraft.scale,
    ),
    cableEnd: vehicleToWorld(
      [0, slingHeight, 0],
      position,
      aircraft.heading,
      scale,
    ),
  };
}

export function boosterPorts(unit: UnitState) {
  return {
    inlet: onCarrier(unit, [-0.8, 1.8, -1.675]),
    outlet: onCarrier(unit, [0.3, 1.8, 1.675]),
  };
}
export function fireCarrierPorts(unit: UnitState) {
  return {
    inlet: onCarrier(unit, [-4.2, 1.7, 0]),
    reel: onCarrier(unit, [-3.25, 2.7, -1.75]),
    guides: [
      onCarrier(unit, [-4.8, 2.7, -1.75]),
      onCarrier(unit, [-4.8, 2.7, 7.3]),
    ],
  };
}
export function fireHoseRoute(unit: UnitState): Vec3[] {
  const ports = fireCarrierPorts(unit);
  const aircraft = [0, 1, 2].map((index) => fireAircraftPose(unit, index));
  const first = aircraft[0].hook,
    guide = ports.guides[1],
    groundY = SURFACE_Y + 0.3,
    dockY = carrierDock(unit, "fire-drone")[1];
  const points: Vec3[] = [
    ports.reel,
    ports.guides[0],
    guide,
    [guide[0], groundY, guide[2]],
    [first[0], groundY, guide[2]],
    [first[0], first[1], guide[2]],
  ];
  const suspendedSpan = (to: Vec3) => {
    const from = points[points.length - 1];
    const horizontal = Math.hypot(to[0] - from[0], to[2] - from[2]);
    const clearance = clamp((Math.min(from[1], to[1]) - dockY - 0.6) / 3);
    const sag = Math.min(0.42, horizontal * 0.1) * clearance;
    const steps = sag > 0 ? 8 : 1;
    for (let step = 1; step <= steps; step++) {
      const t = step / steps, point = mix(from, to, t);
      point[1] -= sag * 4 * t * (1 - t);
      points.push(point);
    }
  };
  suspendedSpan(first);
  // The docked tail stays connected; alternating sides avoid retracing a hose
  // through its support clamp or taking a rising diagonal through a rotor.
  for (let i = 1; i < aircraft.length; i++) {
    const previous = aircraft[i - 1],
      next = aircraft[i],
      rotorRadius = ROTOR_ARM + ROTOR_BLADE_HALF;
    const corridor = i === 1
      ? Math.min(
          previous.position[2] - rotorRadius * previous.scale,
          next.position[2] - rotorRadius * next.scale,
        ) - 0.8
      : Math.max(
          previous.position[2] + rotorRadius * previous.scale,
          next.position[2] + rotorRadius * next.scale,
        ) + 0.8;
    suspendedSpan([previous.hook[0], previous.hook[1], corridor]);
    suspendedSpan([next.hook[0], next.hook[1], corridor]);
    suspendedSpan(next.hook);
  }
  return points;
}
