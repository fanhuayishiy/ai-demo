import { describe, expect, it } from "vitest";
import { Box3, Ray, Vector3 } from "three";
import type { UnitKind, UnitState, Vec3 } from "../types";
import { AIRCRAFT_TIMING } from "../simulation/aircraft";
import { STAGING, VEHICLE_SCALE } from "../spatial/layout";
import { vehicleToWorld } from "./helpers";
import {
  boosterPorts,
  cargoAircraftPose,
  cargoLoadPose,
  carrierDock,
  fireAircraftPose,
  fireCarrierPorts,
  fireHoseRoute,
  rescueBasketPose,
} from "./aircraft";

const carrier = (kind: UnitKind, airTime = 0): UnitState => {
  const id = kind === "cargo" ? "C01" : kind === "booster" ? "M01" : "F01";
  return {
    id,
    kind,
    name: id,
    station: "EAST",
    position: [...STAGING[id].position],
    home: [50, 0.18, -42],
    destination: [...STAGING[id].position],
    heading: 0,
    battery: 100,
    water: 0,
    capacity: 0,
    status: "working",
    task: "",
    route: [],
    travel: 0,
    deployment: 5,
    airTime,
  };
};
const distance = (a: Vec3, b: Vec3) => Math.hypot(...a.map((n, i) => n - b[i]));

describe("carrier-relative aircraft", () => {
  it("places three folded aircraft at separate real carrier docks", () => {
    const unit = carrier("fire-drone");
    unit.position = [80, 0.18, 55];
    unit.heading = Math.PI / 2;
    for (let index = 0; index < 3; index++) {
      const pose = fireAircraftPose(unit, index);
      expect(pose.position).toEqual(carrierDock(unit, "fire-drone", index));
      expect(pose.airborne).toBe(false);
      expect(pose.workReady).toBe(false);
      expect(pose.scale).toBeLessThan(0.25);
    }
    expect(
      distance(
        fireAircraftPose(unit, 0).position,
        fireAircraftPose(unit, 1).position,
      ),
    ).toBeGreaterThan(1.3);
  });

  it("launches sequentially and becomes ready only at each full arrival", () => {
    for (let index = 0; index < 3; index++) {
      const start = AIRCRAFT_TIMING.fire.launchOffsets[index];
      expect(
        fireAircraftPose(carrier("fire-drone", start), index).airborne,
      ).toBe(false);
      expect(
        fireAircraftPose(carrier("fire-drone", start + 0.1), index).airborne,
      ).toBe(true);
      expect(
        fireAircraftPose(carrier("fire-drone", start + 15.99), index).workReady,
      ).toBe(false);
      expect(
        fireAircraftPose(carrier("fire-drone", start + 16), index).workReady,
      ).toBe(true);
    }
  });

  it("keeps fire launch and all interrupted returns continuous", () => {
    for (let index = 0; index < 3; index++) {
      for (let time = 0.1; time <= 30; time += 0.1) {
        expect(
          distance(
            fireAircraftPose(carrier("fire-drone", time), index).position,
            fireAircraftPose(carrier("fire-drone", time - 0.1), index).position,
          ),
        ).toBeLessThan(0.8);
      }
      for (const from of [1, 5, 12, 18, 24, 30]) {
        const unit = carrier("fire-drone", from);
        const source = fireAircraftPose(unit, index).position;
        unit.airReturning = true;
        unit.airReturnFrom = from;
        unit.airReturnTime = 0;
        expect(fireAircraftPose(unit, index).position).toEqual(source);
        for (let time = 0; time <= 24; time += 0.1) {
          unit.airReturnTime = time;
          expect(fireAircraftPose(unit, index).workReady).toBe(false);
        }
        unit.airReturnTime = 24;
        expect(fireAircraftPose(unit, index).position).toEqual(
          carrierDock(unit, "fire-drone", index),
        );
        expect(fireAircraftPose(unit, index).airborne).toBe(false);
      }
    }
  });

  it("flies the cargo aircraft from and back to the same carrier", () => {
    const unit = carrier("cargo");
    expect(cargoAircraftPose(unit).position).toEqual(
      carrierDock(unit, "cargo"),
    );
    let previous = cargoAircraftPose(unit).position;
    for (let time = 0.1; time <= 64; time += 0.1) {
      unit.airTime = time;
      const pose = cargoAircraftPose(unit);
      expect(distance(previous, pose.position)).toBeLessThan(1.25);
      if (pose.position[2] > -18 && pose.position[2] < 1)
        expect(pose.position[1]).toBeGreaterThan(35);
      previous = pose.position;
    }
    unit.airTime = 64;
    expect(cargoAircraftPose(unit).position).toEqual(
      carrierDock(unit, "cargo"),
    );
    expect(cargoAircraftPose(unit).stage).toBe("docked");
  });

  it("returns cargo continuously even when interrupted during its normal return", () => {
    for (const from of [1, 6, 15, 22, 29, 33, 35, 43, 47, 59, 63]) {
      const unit = carrier("cargo", from);
      let previous = cargoAircraftPose(unit).position;
      const previousLoad = cargoLoadPose(unit).position;
      unit.airReturning = true;
      unit.airReturnFrom = from;
      unit.airReturnTime = 0;
      expect(cargoAircraftPose(unit).position).toEqual(previous);
      expect(cargoLoadPose(unit).position).toEqual(previousLoad);
      for (let time = 0.1; time <= 24; time += 0.1) {
        unit.airReturnTime = time;
        const pose = cargoAircraftPose(unit);
        expect(distance(previous, pose.position)).toBeLessThan(1.7);
        expect(pose.workReady).toBe(false);
        previous = pose.position;
      }
      unit.airReturnTime = 24;
      expect(cargoAircraftPose(unit).position).toEqual(
        carrierDock(unit, "cargo"),
      );
    }
  });

  it("keeps basket orientation continuous when takeoff from a rotated carrier is interrupted", () => {
    const unit = carrier("cargo", 1);
    unit.heading = 1.1;
    const source = rescueBasketPose(unit);
    unit.airReturning = true;
    unit.airReturnFrom = 1;
    unit.airReturnTime = 0.000001;
    const returning = rescueBasketPose(unit);
    expect(Math.abs(returning.heading - source.heading)).toBeLessThan(0.0001);
    expect(distance(returning.position, source.position)).toBeLessThan(0.0001);
    expect(distance(returning.hook, source.hook)).toBeLessThan(0.0001);
    unit.airReturnTime = 24;
    expect(rescueBasketPose(unit).heading).toBe(unit.heading);
  });

  it("lowers four physical supply groups vertically onto the actual rooftop", () => {
    const unit = carrier("cargo");
    const dockLoad = cargoLoadPose(unit);
    expect(dockLoad.count).toBe(4);
    expect(dockLoad.attached).toBe(true);
    expect(
      distance(dockLoad.position, cargoAircraftPose(unit).position),
    ).toBeLessThan(3);
    let previous = dockLoad.position;
    for (let time = 0.1; time < 34; time += 0.1) {
      unit.airTime = time;
      const load = cargoLoadPose(unit);
      expect(load.attached).toBe(true);
      expect(distance(previous, load.position)).toBeLessThan(1.25);
      if (time >= 22) {
        expect(load.position[0]).toBe(6.8);
        expect(load.position[2]).toBe(4.8);
        expect(load.position[1]).toBeGreaterThan(29.025);
      }
      previous = load.position;
    }
    unit.airTime = 34;
    expect(cargoLoadPose(unit).position).toEqual([6.8, 29.045, 4.8]);
    expect(cargoLoadPose(unit).attached).toBe(false);
    unit.airTime = 64;
    expect(cargoLoadPose(unit, 4).position).toEqual([6.8, 29.045, 4.8]);
  });

  it("binds water ports to the mobile booster and carrier geometry", () => {
    const unit = carrier("booster");
    unit.heading = 0.7;
    const ports = boosterPorts(unit);
    expect(ports.inlet).toEqual(
      vehicleToWorld([-0.8, 1.8, -1.675], unit.position, 0.7, VEHICLE_SCALE),
    );
    expect(ports.outlet).toEqual(
      vehicleToWorld([0.3, 1.8, 1.675], unit.position, 0.7, VEHICLE_SCALE),
    );
    const fire = carrier("fire-drone", 30),
      firePorts = fireCarrierPorts(fire);
    expect(fireHoseRoute(fire)[0]).toEqual(firePorts.reel);
    for (let index = 0; index < 3; index++)
      expect(fireHoseRoute(fire)).toContainEqual(
        fireAircraftPose(fire, index).hook,
      );
  });

  it("keeps the auxiliary rescue basket stowed on the ground and moves it with the aircraft", () => {
    const unit = carrier("cargo");
    unit.airLiftDeployment = 1;
    expect(rescueBasketPose(unit).extension).toBe(0);
    expect(rescueBasketPose(unit).position[1]).toBeGreaterThan(3);
    unit.airTime = 38;
    expect(rescueBasketPose(unit).position).toEqual([5.65, 29.045, 4.8]);
    const source = rescueBasketPose(unit).position;
    unit.airReturning = true;
    unit.airReturnFrom = 38;
    unit.airReturnTime = 0;
    expect(rescueBasketPose(unit).position).toEqual(source);
    unit.airLiftDeployment = 0;
    unit.airReturnTime = 24;
    expect(rescueBasketPose(unit).extension).toBe(0);
    expect(rescueBasketPose(unit).position[1]).toBeGreaterThan(3);
  });

  it("keeps every moving hose segment outside the aircraft swept volumes on return", () => {
    const unit = carrier("fire-drone", 30);
    unit.airReturning = true;
    unit.airReturnFrom = 30;
    const hits: string[] = [];
    for (let tick = 0; tick <= 240; tick++) {
      unit.airReturnTime = tick / 10;
      const boxes = [0, 1, 2].map((index) => {
        const pose = fireAircraftPose(unit, index),
          p = pose.position,
          s = pose.scale;
        return new Box3(
          new Vector3(p[0] - 3.05 * s, p[1] - 1.06 * s, p[2] - 3.05 * s),
          new Vector3(p[0] + 3.05 * s, p[1] + 0.5 * s, p[2] + 3.05 * s),
        ).expandByScalar(0.13);
      });
      const points = fireHoseRoute(unit);
      for (let index = 1; index < points.length; index++) {
        const start = new Vector3(...points[index - 1]),
          end = new Vector3(...points[index]);
        const delta = end.clone().sub(start),
          length = delta.length(),
          ray = new Ray(start, delta.normalize());
        boxes.forEach((box, plane) => {
          const hit = ray.intersectBox(box, new Vector3());
          if (
            box.containsPoint(start) ||
            box.containsPoint(end) ||
            (hit && hit.distanceTo(start) < length)
          )
            hits.push(`return=${tick / 10} segment=${index} aircraft=${plane}`);
        });
      }
      if (hits.length) break;
    }
    expect(hits).toEqual([]);
  });
});
