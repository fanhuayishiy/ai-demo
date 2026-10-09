import { describe, it, expect } from "vitest";
import {
  routePosition,
  overviewZoom,
  actionAllowed,
  deploymentProgress,
  dogRoutePosition,
  worldToVehicle,
  vehicleToWorld,
  createHoseCurve,
  ROTOR_ARM,
  ROTOR_BLADE_HALF,
  STOWED_AIRCRAFT_SCALE,
} from "./helpers";
describe("scene helpers", () => {
  it("moves the dog team from their carrier through the doorway without looping", () => {
    expect(dogRoutePosition([4, 0.18, 12], 0, 2)).toEqual([8.7, 0.21, 9.5]);
    expect(dogRoutePosition([4, 0.18, 12], 100, 0)[2]).toBe(4);
    expect(dogRoutePosition([4, 0.18, 12], 100, 2)[2]).toBe(-2);
    expect(dogRoutePosition([4, 0.18, 12], 10, 0)[2]).toBeGreaterThan(
      dogRoutePosition([4, 0.18, 12], 10, 2)[2],
    );
    expect(dogRoutePosition([8, 0, 20], 100, 0)).toEqual(
      dogRoutePosition([8, 0, 20], 101, 0),
    );
  });
  it("keeps dogs outside the carrier and at least 2.5m apart at every step", () => {
    for (let time = 0; time <= 30; time += 0.25) {
      const positions = [0, 1, 2].map((i) =>
        dogRoutePosition([4, 0.18, 12], time, i),
      );
      positions.forEach((p) => expect(p[0] > 7.6 || p[2] < 9.4).toBe(true));
      positions.forEach((p) => expect(p[2] + 1.1).toBeLessThan(18));
      expect(
        Math.hypot(...positions[0].map((v, i) => v - positions[1][i])),
      ).toBeGreaterThanOrEqual(2.5);
      expect(
        Math.hypot(...positions[1].map((v, i) => v - positions[2][i])),
      ).toBeGreaterThanOrEqual(2.5);
    }
  });
  it("derives local ladder endpoint from safe world balcony target", () => {
    const local = worldToVehicle([11.7, 20.9, 9.2], [20, 0.18, 11], 0, 0.85);
    const world = vehicleToWorld(local, [20, 0.18, 11], 0, 0.85);
    world.forEach((v, i) => expect(v).toBeCloseTo([11.7, 20.9, 9.2][i]));
    expect(world[2] - 0.9 * 0.85).toBeGreaterThan(7.765 + 0.5);
    const turned = vehicleToWorld(
      worldToVehicle([2, 20, 10], [-5, 0.18, 11], 1.2, 0.85),
      [-5, 0.18, 11],
      1.2,
      0.85,
    );
    turned.forEach((v, i) => expect(v).toBeCloseTo([2, 20, 10][i]));
  });
  it("keeps full rotor swept disks separated", () =>
    expect(ROTOR_ARM * 2 - ROTOR_BLADE_HALF * 2).toBeGreaterThan(0.5));
  it("keeps stowed rotor equipment inside the road vehicle footprint", () =>
    expect(
      (ROTOR_ARM + ROTOR_BLADE_HALF) * 2 * STOWED_AIRCRAFT_SCALE * 0.85,
    ).toBeLessThanOrEqual(2.85));
  it("never lets a hose spline overshoot below the common surface", () => {
    const curve = createHoseCurve(
      [
        [-10, 1, 20],
        [-8, 0.3, 18],
        [17, 0.3, 18],
        [20, 1, 18],
      ],
      0.18,
      0.16,
    );
    for (let i = 0; i <= 1000; i++)
      expect(curve.getPoint(i / 1000).y - 0.16).toBeGreaterThanOrEqual(0.18);
  });
  it("clamps deployment elapsed seconds to a physical actuator range", () => {
    expect(deploymentProgress(30)).toBe(1);
    expect(deploymentProgress(2.5)).toBe(0.5);
    expect(deploymentProgress(-1)).toBe(0);
  });
  it("interpolates route by distance and clamps endpoints", () => {
    expect(
      routePosition(
        [
          [0, 0, 0],
          [10, 0, 0],
          [10, 0, 30],
        ],
        0.5,
      ),
    ).toEqual([10, 0, 10]);
    expect(routePosition([[1, 0, 2]], 5)).toEqual([1, 0, 2]);
  });
  it("frames complete city in narrow and wide windows", () => {
    expect(overviewZoom(1400, 900)).toBeGreaterThan(overviewZoom(390, 844));
    expect(overviewZoom(390, 844) * 196).toBeLessThanOrEqual(370);
    expect(overviewZoom(1304, 892) * 196).toBeLessThanOrEqual(1304 - 330);
  });
  it("never animates recalled or fault equipment", () => {
    expect(actionAllowed("recalled", 1)).toBe(false);
    expect(actionAllowed("fault", 1)).toBe(false);
    expect(actionAllowed("working", 1)).toBe(true);
    expect(actionAllowed("enroute", 0)).toBe(false);
  });
});
