// @vitest-environment node
import { describe, expect, it } from "vitest";
import { Children, isValidElement, type ReactNode } from "react";
import { Box3, Matrix4, Vector3 } from "three";
import type { UnitState, Vec3 } from "../types";
import { createUnits } from "../simulation/data";
import { AIRCRAFT_TIMING } from "../simulation/aircraft";
import { STATIC_SOLIDS, STAGING, SURFACE_Y, VEHICLE_SCALE } from "../spatial/layout";
import { createHoseCurve, ROTOR_ARM, ROTOR_BLADE_HALF, vehicleToWorld } from "./helpers";
import { Box } from "./Primitives";
import { FireAirport } from "./Vehicles";
import {
  FIRE_DOCK_X,
  FIRE_DOCK_Y,
  FIRE_FOLDED_SCALES,
  carrierDock,
  fireAircraftPose,
  fireCarrierPorts,
  fireHoseRoute,
  type FlightPose,
} from "./aircraft";

const RADIUS = 0.13;
const INTERRUPTIONS = [1, 5, 12, 18, 24, 30];
const indices = [0, 1, 2];
const unitAt = (time: number): UnitState => ({
  ...createUnits().find((unit) => unit.id === "F01")!,
  position: [...STAGING.F01.position],
  heading: STAGING.F01.heading,
  status: "working",
  deployment: 5,
  airTime: time,
});
const distance = (a: Vec3, b: Vec3) => new Vector3(...a).distanceTo(new Vector3(...b));
const curveAt = (unit: UnitState) => createHoseCurve(fireHoseRoute(unit), SURFACE_Y, RADIUS);

type Obstacle = { id: string; box: Box3 };
const volume = (id: string, center: Vec3, size: Vec3): Obstacle => ({
  id,
  box: new Box3().setFromCenterAndSize(new Vector3(...center), new Vector3(...size)),
});
function localVolume(id: string, position: Vec3, angle: number, center: Vec3, size: Vec3, scale = VEHICLE_SCALE): Obstacle {
  const result = volume(id, center, size);
  result.box.applyMatrix4(new Matrix4().makeScale(scale, scale, scale));
  result.box.applyMatrix4(new Matrix4().makeRotationY(angle).setPosition(...position));
  return result;
}
const stationary: Obstacle[] = [
  ...STATIC_SOLIDS.map((solid) => volume(solid.id, solid.center, solid.size)),
  ...Object.entries(STAGING).flatMap(([id, place]) => {
    const part = (name: string, center: Vec3, size: Vec3) =>
      localVolume(`${id}-${name}`, place.position, place.heading, center, size);
    return [
      part("chassis", [-0.3, 0.95, 0], [7.6, 0.6, 2.7]),
      part("cab", [2.3, 2, 0], [2.5, 2.3, 2.8]),
      ...[-2.3, 2.4].flatMap((x) => [-1.45, 1.45].map((z) =>
        part(`wheel-${x}-${z}`, [x, 0.75, z], [1.48, 1.48, 0.43]))),
      ...(["F01", "B01", "L01"].includes(id)
        ? [-2, 2].flatMap((x) => [-3.3, 3.3].map((z) =>
          part(`support-${x}-${z}`, [x, 0.15, z], [0.8, 0.3, 0.8])))
        : []),
      ...(id === "R01" ? [
        part("recon-module", [-1, 1.7, 0], [4.5, 0.7, 2.8]),
        part("recon-antenna", [-2.5, 3, 0], [0.14, 2, 0.14]),
      ] : []),
    ];
  }),
];
function cradleParts(node: ReactNode, parent = ""): { id: string; center: Vec3; size: Vec3 }[] {
  if (!isValidElement<{ name?: string; children?: ReactNode; p?: Vec3; s?: Vec3 }>(node)) return [];
  const id = node.props.name ?? parent;
  return [
    ...(node.type === Box && id.startsWith("fire-dock-cradle-") && node.props.p && node.props.s
      ? [{ id, center: node.props.p, size: node.props.s }]
      : []),
    ...Children.toArray(node.props.children).flatMap((child) => cradleParts(child, id)),
  ];
}
const cradles = cradleParts(FireAirport());
function fireDeck(unit: UnitState): Obstacle[] {
  const part = (id: string, center: Vec3, size: Vec3) =>
    localVolume(id, unit.position, unit.heading ?? 0, center, size);
  return [
    part("fire-module", [-1.2, 1.8, 0], [4.9, 1, 2.8]),
    part("fire-deck", [-1.2, 2.5, 0], [4.9, 0.3, 2.6]),
    ...FIRE_DOCK_X.flatMap((x, index) => [
      part(`pad-${index}`, [x, 2.68, 0], [1.28, 0.05, 1.28]),
      part(`pad-mark-x-${index}`, [x, 2.715, 0], [0.6, 0.016, 0.1]),
      part(`pad-mark-z-${index}`, [x, 2.715, 0], [0.1, 0.016, 0.55]),
    ]),
    ...cradles.map(({ id, center, size }) => part(id, center, size)),
  ];
}
function aircraftVolume(pose: FlightPose, index: number): Obstacle {
  const radius = ROTOR_ARM + ROTOR_BLADE_HALF;
  const box = new Box3(
    new Vector3(-radius, -1.06, -radius).multiplyScalar(pose.scale),
    new Vector3(radius, 0.5, radius).multiplyScalar(pose.scale),
  );
  box.applyMatrix4(new Matrix4().makeRotationY(pose.heading).setPosition(...pose.position));
  return { id: `aircraft-${index}`, box };
}
function clearanceFailure(unit: UnitState): string | undefined {
  const route = fireHoseRoute(unit);
  if (route.length < 2) return "disconnected hose";
  const curve = curveAt(unit);
  const obstacles = [
    ...stationary,
    ...fireDeck(unit),
    ...indices.map((index) => aircraftVolume(fireAircraftPose(unit, index), index)),
  ].map(({ id, box }) => ({ id, box: box.clone().expandByScalar(RADIUS - 0.0001) }));
  const count = Math.max(1, Math.ceil(curve.getLength() / 0.09));
  for (const point of curve.getPoints(count)) {
    if (point.y - RADIUS < SURFACE_Y - 0.0001) return "ground";
    const hit = obstacles.find(({ box }) => box.containsPoint(point));
    if (hit) return `${hit.id} at ${point.toArray().map((value) => value.toFixed(3)).join(",")}`;
  }
  return undefined;
}
function checkContacts(unit: UnitState) {
  const route = fireHoseRoute(unit), ports = fireCarrierPorts(unit);
  expect(route.slice(0, 3)).toEqual([ports.reel, ...ports.guides]);
  let previous = -1;
  for (const index of indices) {
    const pose = fireAircraftPose(unit, index);
    const contact = route.findIndex((point) => distance(point, pose.hook) < 1e-9);
    expect(contact, `missing contact ${index}`).toBeGreaterThan(previous);
    previous = contact;
  }
  expect(route.at(-1)).toEqual(fireAircraftPose(unit, 2).hook);
}

describe("continuous shared fire hose", () => {
  it("keeps every aircraft attached in order, including the docked free end", () => {
    for (const time of [0, 0.9, 1, 7, 7.8, 14, 14.6, 16, 23, 30]) checkContacts(unitAt(time));
    for (const from of INTERRUPTIONS) {
      const unit = unitAt(from);
      unit.airReturning = true;
      unit.airReturnFrom = from;
      for (const time of [0, 4, 8, 12, 16, 20, 24]) {
        unit.airReturnTime = time;
        checkContacts(unit);
      }
    }
  });

  it("does not add entire hose links at the former takeoff height thresholds", () => {
    const unit = unitAt(0);
    const transitions = indices.map((index) => AIRCRAFT_TIMING.fire.launchOffsets[index]
      + 1.2 * 4 / (8 + index * 1.5 - carrierDock(unit, "fire-drone", index)[1]));
    for (const time of [0, 4, 7, 8, 12, 14, 16, 23, 30, ...transitions]) {
      unit.airTime = Math.max(0, time - 0.0001);
      const before = curveAt(unit);
      unit.airTime = time + 0.0001;
      const after = curveAt(unit);
      expect(Math.abs(after.getLength() - before.getLength()), `launch=${time}`).toBeLessThan(0.02);
      for (let point = 0; point <= 20; point++)
        expect(after.getPoint(point / 20).distanceTo(before.getPoint(point / 20))).toBeLessThan(0.02);
    }
  });

  it.each(INTERRUPTIONS)("keeps payout and retraction continuous when recalled at %ss", (from) => {
    const unit = unitAt(from);
    const source = fireHoseRoute(unit);
    unit.airReturning = true;
    unit.airReturnFrom = from;
    unit.airReturnTime = 0;
    expect(fireHoseRoute(unit)).toEqual(source);
    let previous = curveAt(unit).getLength();
    for (let tick = 1; tick <= 480; tick++) {
      unit.airReturnTime = tick / 20;
      const current = curveAt(unit).getLength();
      expect(Math.abs(current - previous), `return=${tick / 20}`).toBeLessThan(1.8);
      previous = current;
    }
    for (const time of [0, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 24]) {
      unit.airReturnTime = Math.max(0, time - 0.0001);
      const before = curveAt(unit);
      unit.airReturnTime = Math.min(24, time + 0.0001);
      const after = curveAt(unit);
      for (let point = 0; point <= 20; point++)
        expect(after.getPoint(point / 20).distanceTo(before.getPoint(point / 20)), `return=${time}`).toBeLessThan(0.02);
    }
    const docked = fireHoseRoute(unit);
    unit.airReturning = false;
    unit.airTime = 0;
    expect(fireHoseRoute(unit)).toEqual(docked);
  });

  it("leaves a gentle suspended dip between successive support contacts", () => {
    const unit = unitAt(30), route = fireHoseRoute(unit);
    const first = fireAircraftPose(unit, 0).hook, second = fireAircraftPose(unit, 1).hook;
    const start = route.findIndex((point) => distance(point, first) < 1e-9);
    const end = route.findIndex((point) => distance(point, second) < 1e-9);
    expect(Math.min(...route.slice(start, end + 1).map((point) => point[1]))).toBeLessThan(first[1] - 0.05);
  });

  it("keeps the docked terminal hose above the deck and pad marking", () => {
    const unit = unitAt(0), pose = fireAircraftPose(unit, 2);
    const markingTop = unit.position[1] + (2.715 + 0.016 / 2) * VEHICLE_SCALE;
    expect(pose.hook[1] - RADIUS).toBeGreaterThan(markingTop);
    expect(FIRE_DOCK_Y - 1.06 * FIRE_FOLDED_SCALES[2]).toBeGreaterThan(2.705);
  });

  it("fits the connected hose between the real terminal cradle posts", () => {
    const unit = unitAt(0), hook = fireAircraftPose(unit, 2).hook;
    const terminal = cradles.filter(({ id }) => id.startsWith("fire-dock-cradle-2"));
    expect(terminal).toHaveLength(4);
    for (const { center, size } of terminal) {
      const post = localVolume("terminal-post", unit.position, unit.heading ?? 0, center, size).box;
      const exit = new Vector3(hook[0], hook[1], (post.min.z + post.max.z) / 2);
      expect(post.distanceToPoint(exit)).toBeGreaterThan(RADIUS);
    }
  });

  it("keeps real hook transforms and yaw continuous during rotated-carrier recovery", () => {
    for (const from of [1, 5, 12, 18, 24, 30]) {
      const unit = unitAt(from);
      unit.heading = 0.7;
      const source = indices.map((index) => fireAircraftPose(unit, index));
      unit.airReturning = true;
      unit.airReturnFrom = from;
      unit.airReturnTime = 0;
      for (const index of indices) {
        const pose = fireAircraftPose(unit, index);
        expect(distance(pose.hook, source[index].hook)).toBeLessThan(1e-9);
        expect(distance(pose.nozzle, source[index].nozzle)).toBeLessThan(1e-9);
      }
      let previous = source;
      for (let tick = 0; tick <= 480; tick++) {
        unit.airReturnTime = tick / 20;
        const poses = indices.map((index) => fireAircraftPose(unit, index));
        poses.forEach((pose, index) => {
          const local: Vec3 = index < 2 ? [-4, -1.3, 0] : [0, -1.75, 0];
          expect(distance(pose.hook, vehicleToWorld(local, pose.position, pose.heading, pose.scale))).toBeLessThan(1e-9);
          expect(Math.abs(pose.heading - previous[index].heading)).toBeLessThan(0.03);
          expect(distance(pose.hook, previous[index].hook)).toBeLessThan(1.1);
        });
        previous = poses;
      }
    }
  });
});

describe("shared fire hose physical clearance", () => {
  it("clears rotor sweeps, the carrier deck and parked apparatus throughout deployment", () => {
    for (let tick = 0; tick <= 300; tick++) {
      const time = tick / 10;
      expect(clearanceFailure(unitAt(time)), `launch=${time}`).toBeUndefined();
    }
  });

  it.each(INTERRUPTIONS)("keeps its rendered radius clear throughout a return from %ss", (from) => {
    const unit = unitAt(from);
    unit.airReturning = true;
    unit.airReturnFrom = from;
    for (let tick = 0; tick <= 240; tick++) {
      unit.airReturnTime = tick / 10;
      expect(clearanceFailure(unit), `from=${from}, return=${tick / 10}`).toBeUndefined();
    }
  });
});
