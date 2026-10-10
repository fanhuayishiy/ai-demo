import { describe, expect, it } from "vitest";
import { Box3, Matrix4, Ray, Vector3 } from "three";
import type { UnitState, Vec3 } from "../types";
import { createUnits } from "../simulation/data";
import * as layout from "../spatial/layout";
import { vehicleToWorld } from "./helpers";
import {
  CARGO_GEAR_BOTTOM,
  CARGO_LANDING,
  CARGO_LOAD_SIZE,
  CARGO_ROTOR_HALF,
  cargoAircraftPose,
  cargoLoadPose,
  carrierDock,
  fireAircraftPose,
  rescueBasketPose,
} from "./aircraft";

const ROOF_CARGO: Vec3 = [6.8, 29.045, 4.8];
const ROOF_BASKET: Vec3 = [5.65, 29.045, 4.8];
const GROUND_BASKET: Vec3 = [43.5, 0.18, -24.5];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const distance = (a: Vec3, b: Vec3) => new Vector3(...a).distanceTo(new Vector3(...b));
const cargo = (time: number): UnitState => ({
  ...createUnits().find((unit) => unit.id === "C01")!,
  position: [...layout.STAGING.C01.position],
  heading: 0,
  deployment: 5,
  status: "working",
  airTime: time,
});

function rescue(time: number): UnitState {
  const unit = cargo(time);
  unit.airRescueBoarding = clamp((time - 37) / 2);
  unit.airRescuePassenger = time >= 39;
  unit.airRescueDelivered = time >= 64;
  unit.airLiftDeployment = time < 34 ? 0
    : time < 37 ? (time - 34) / 3
      : time < 39 ? 1
        : time < 42 ? (42 - time) / 3
          : time < 59 ? 0
            : time < 62 ? (time - 59) / 3
              : time < 64 ? 1
                : time < 67 ? (67 - time) / 3 : 0;
  return unit;
}

const box = (center: Vec3, size: Vec3) => new Box3().setFromCenterAndSize(
  new Vector3(...center), new Vector3(...size),
);
const localBox = (position: Vec3, heading: number, scale: number, min: Vec3, max: Vec3) =>
  new Box3(new Vector3(...min).multiplyScalar(scale), new Vector3(...max).multiplyScalar(scale))
    .applyMatrix4(new Matrix4().makeRotationY(heading).setPosition(...position))
    .expandByScalar(-0.0001);
const roofObstacles = [
  { id: "roof-deck", box: box([7, 28.8, 0], [14.8, 0.45, 12.8]) },
  { id: "roof-rim", box: box([7, 28.3, 0], [16.5, 0.6, 14.5]) },
  { id: "roof-room", box: box([4, 30, -2], [4.3, 2, 3.5]) },
  { id: "roof-tank", box: box([10.5, 30.3, -2.6], [3, 2.8, 3]) },
  {
    id: "roof-solar",
    box: box([0, 0, 0], [3.8, 0.3, 2.8])
      .applyMatrix4(new Matrix4().makeRotationX(-0.18).setPosition(10, 29.3, 2)),
  },
];
const staticObstacles = [
  ...layout.STATIC_SOLIDS.map((solid) => ({ id: solid.id, box: box(solid.center, solid.size) })),
  ...roofObstacles,
  ...Object.entries(layout.STAGING).map(([id, staging]) => ({
    id: `${id}-cab`,
    box: localBox(staging.position, staging.heading, layout.VEHICLE_SCALE,
      [1.05, 0.85, -1.4], [3.55, 3.15, 1.4]),
  })),
];
function segmentIntersects(from: Vec3, to: Vec3, obstacle: Box3, radius: number) {
  const bounds = obstacle.clone().expandByScalar(radius);
  const start = new Vector3(...from), end = new Vector3(...to);
  if (bounds.containsPoint(start) || bounds.containsPoint(end)) return true;
  const length = start.distanceTo(end);
  const hit = new Ray(start, end.clone().sub(start).normalize()).intersectBox(bounds, new Vector3());
  return !!hit && hit.distanceTo(start) <= length;
}
function clearance(unit: UnitState) {
  const aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit), load = cargoLoadPose(unit);
  const rotor = localBox(aircraft.position, aircraft.heading, aircraft.scale,
    [-CARGO_ROTOR_HALF[0], -CARGO_GEAR_BOTTOM, -CARGO_ROTOR_HALF[2]], CARGO_ROTOR_HALF);
  const basketBox = localBox(basket.position, basket.heading, basket.scale,
    [-0.45, 0, -0.625], [0.45, basket.slingHeight ?? 0.12 + 1.23 * basket.extension, 0.625]);
  const loadBox = box([load.position[0], load.position[1] + CARGO_LOAD_SIZE[1] / 2, load.position[2]], CARGO_LOAD_SIZE);
  const issues: string[] = [];
  for (const obstacle of staticObstacles) {
    for (const [name, shape] of [["rotors", rotor], ["basket", basketBox], ["supplies", loadBox]] as const) {
      if (shape.intersectsBox(obstacle.box)) issues.push(`${name} intersects ${obstacle.id}`);
    }
    if (segmentIntersects(basket.hook, basket.cableEnd, obstacle.box, 0.0125))
      issues.push(`basket cable intersects ${obstacle.id}`);
    if (segmentIntersects(aircraft.hook, load.cableEnd, obstacle.box, 0.0225))
      issues.push(`supply cable intersects ${obstacle.id}`);
  }
  if (basketBox.intersectsBox(loadBox)) issues.push("basket intersects supplies");
  if (basketBox.min.y < layout.SURFACE_Y) issues.push("basket below ground");
  if (unit.airRescuePassenger && !unit.airRescueDelivered) {
    if (basketBox.intersectsBox(rotor)) issues.push("occupied basket intersects aircraft swept volume");
    if (basket.position[1] + 1.83 > aircraft.position[1] - CARGO_GEAR_BOTTOM)
      issues.push("passenger head intersects landing gear");
  }
  return issues;
}

describe("rooftop cargo and rescue geometry", () => {
  it("shares the actual roof surface and separate rooftop/ground receiving positions", () => {
    expect(layout).toMatchObject({
      ROOFTOP_SURFACE_Y: 29.025,
      ROOFTOP_CARGO_LANDING: ROOF_CARGO,
      ROOFTOP_BASKET_POSITION: ROOF_BASKET,
      ROOFTOP_PEOPLE: [
        [3.4, 29.045, 4.8], [1.6, 29.045, 3.8],
        [2.5, 29.045, 5.5], [4.6, 29.045, 2.2],
      ],
      CARGO_POSITION: [6.8, 38, 4.8],
      GROUND_BASKET_POSITION: GROUND_BASKET,
      GROUND_PERSON_POSITION: [44.7, 0.18, -23.5],
    });
    expect(CARGO_LANDING).toEqual(ROOF_CARGO);
  });

  it("reaches the roof pickup and ground handoff surfaces at full winch extension", () => {
    const rooftop = rescueBasketPose(rescue(37));
    expect(rooftop.position).toEqual(ROOF_BASKET);
    expect(rooftop.extension).toBe(1);
    const ground = rescueBasketPose(rescue(62));
    expect(ground.position).toEqual(GROUND_BASKET);
    expect(ground.extension).toBe(1);
    expect(cargoAircraftPose(rescue(62)).position).toEqual([44.65, 9, -24.5]);
    expect(cargoAircraftPose(rescue(65)).airborne).toBe(true);
    expect(cargoAircraftPose(rescue(72)).position).toEqual(carrierDock(rescue(72), "cargo"));
  });

  it("keeps a full-size passenger below the landing gear with an unfolded basket", () => {
    const unit = rescue(48), aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit);
    expect(basket.extension).toBe(0);
    expect(basket.scale).toBe(1);
    expect(basket.railHeight).toBeCloseTo(0.7);
    expect(basket.slingHeight).toBeCloseTo(2.1);
    expect(aircraft.position[1] - basket.position[1]).toBeCloseTo(4.2);
    expect(basket.cableEnd[1]).toBeLessThan(aircraft.position[1] - CARGO_GEAR_BOTTOM);
  });

  it("attaches both cable endpoints throughout winch travel, boarding, and ground exit", () => {
    let previous = rescueBasketPose(rescue(33.9));
    for (let tick = 340; tick <= 720; tick++) {
      const unit = rescue(tick / 10), aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit);
      expect(distance(previous.position, basket.position), `basket at ${tick / 10}s`).toBeLessThan(1.25);
      expect(distance(previous.cableEnd, basket.cableEnd), `sling at ${tick / 10}s`).toBeLessThan(1.25);
      expect(basket.hook).toEqual(vehicleToWorld([-1.15, -0.75, 0], aircraft.position, aircraft.heading, aircraft.scale));
      expect(basket.cableEnd).toEqual(vehicleToWorld([0, basket.slingHeight, 0], basket.position, basket.heading, basket.scale));
      previous = basket;
    }
    for (const time of [37, 39, 42, 44, 48, 54, 59, 62, 64, 67, 68, 72]) {
      const before = rescueBasketPose(rescue(time - 0.000001));
      const after = rescueBasketPose(rescue(time));
      expect(distance(before.position, after.position), `basket boundary ${time}s`).toBeLessThan(0.0001);
      expect(distance(before.cableEnd, after.cableEnd), `sling boundary ${time}s`).toBeLessThan(0.0001);
    }
  });

  it.each([39, 40, 43, 47, 54, 59, 60, 62, 63.9, 64, 65, 69, 71])(
    "continues the occupied route without snapping after a recovery request at %ss", (from) => {
      for (let step = 0; step <= Math.ceil((72 - from) * 10); step++) {
        const time = Math.min(72, from + step / 10);
        const normal = rescue(time), interrupted = rescue(time);
        Object.assign(interrupted, {
          status: "fault", airTime: from, airReturning: true,
          airReturnFrom: from, airReturnTime: time - from, airRescueRecovery: true,
        });
        expect(cargoAircraftPose(interrupted).position).toEqual(cargoAircraftPose(normal).position);
        expect(rescueBasketPose(interrupted).position).toEqual(rescueBasketPose(normal).position);
        expect(rescueBasketPose(interrupted).cableEnd).toEqual(rescueBasketPose(normal).cableEnd);
        expect(cargoLoadPose(interrupted).position).toEqual(ROOF_CARGO);
        expect(cargoLoadPose(interrupted).cableEnd).toEqual(cargoLoadPose(normal).cableEnd);
        expect(cargoAircraftPose(interrupted).workReady).toBe(false);
        expect(clearance(interrupted), `recovery from ${from}s at ${time}s`).toEqual([]);
      }
    },
  );

  it.each([false, true])("clears roof fixtures and structures throughout the rescue=%s route", (occupied) => {
    const duration = occupied ? 72 : 64;
    for (let tick = 0; tick <= duration * 10; tick++) {
      const unit = occupied ? rescue(tick / 10) : cargo(tick / 10);
      expect(clearance(unit), `flight at ${tick / 10}s`).toEqual([]);
    }
  });

  it.each([1, 6, 15, 22, 29, 33, 35, 43, 47, 59, 63])(
    "clears actual roof obstacles during an unoccupied interruption at %ss", (from) => {
      const unit = cargo(from);
      Object.assign(unit, { airReturning: true, airReturnFrom: from });
      for (let tick = 0; tick <= 240; tick++) {
        unit.airReturnTime = tick / 10;
        expect(clearance(unit), `return from ${from}s at ${tick / 10}s`).toEqual([]);
      }
    },
  );

  it("keeps the occupied cruise clear of all three fire aircraft", () => {
    const fire = { ...createUnits().find((unit) => unit.id === "F01")!,
      position: [...layout.STAGING.F01.position] as Vec3, heading: 0,
      status: "working" as const, airTime: 30 };
    for (let tick = 390; tick <= 720; tick++) {
      const unit = rescue(tick / 10), aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit);
      const cargoBounds = localBox(aircraft.position, aircraft.heading, aircraft.scale,
        [-3.7, -CARGO_GEAR_BOTTOM, -3], CARGO_ROTOR_HALF);
      const basketBounds = localBox(basket.position, basket.heading, basket.scale,
        [-0.45, 0, -0.625], [0.45, basket.slingHeight, 0.625]);
      for (let index = 0; index < 3; index++) {
        const other = fireAircraftPose(fire, index);
        const otherBounds = localBox(other.position, other.heading, other.scale,
          [index < 2 ? -4.18 : -3.05, -1.86, -3.05], [3.05, 0.5, 3.05]);
        expect(cargoBounds.intersectsBox(otherBounds), `aircraft ${index} at ${tick / 10}s`).toBe(false);
        expect(basketBounds.intersectsBox(otherBounds), `basket ${index} at ${tick / 10}s`).toBe(false);
      }
    }
  });
});
