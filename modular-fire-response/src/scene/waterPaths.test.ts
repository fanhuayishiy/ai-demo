import { describe, expect, it } from "vitest";
import { createUnits } from "../simulation/data";
import { STAGING } from "../spatial/layout";
import { boosterPorts, fireCarrierPorts } from "./aircraft";
import {
  boosterOutletRoute,
  fireSupplyRoute,
  waterToBoosterRoute,
} from "./waterPaths";

const staged = (id: string) => {
  const unit = createUnits().find((unit) => unit.id === id)!;
  return {
    ...unit,
    position: [...STAGING[id].position] as [number, number, number],
    heading: STAGING[id].heading,
  };
};
describe("mobile water network routes", () => {
  it("connects all tankers to the booster north-side inlet", () => {
    const booster = staged("M01");
    ["W01", "W02", "W03"].forEach((id, index) => {
      const points = waterToBoosterRoute(staged(id), booster, index);
      expect(points.at(-1)).toEqual(boosterPorts(booster).inlet);
      expect(points.at(-2)![2]).toBeLessThan(booster.position[2] - 2);
      expect(points[0][0]).toBeLessThan(staged(id).position[0] - 3.6);
    });
  });
  it("clears the south side of M01 before turning into the west hose corridor", () => {
    const unit = staged("M01"),
      points = boosterOutletRoute(unit);
    expect(points[0]).toEqual(boosterPorts(unit).outlet);
    expect(points[1][0]).toBe(points[0][0]);
    expect(points[1][2]).toBeGreaterThan(unit.position[2] + 2);
    expect(points.at(-1)![2]).toBeGreaterThan(unit.position[2] + 2);
  });
  it("terminates the ground fire supply at the actual carrier inlet", () => {
    const fire = staged("F01"),
      booster = staged("M01"),
      points = fireSupplyRoute(booster, fire);
    expect(points[0]).toEqual(boosterPorts(booster).outlet);
    expect(points.at(-1)).toEqual(fireCarrierPorts(fire).inlet);
    expect(points.some((point) => point[2] === 17.2)).toBe(true);
  });
});
