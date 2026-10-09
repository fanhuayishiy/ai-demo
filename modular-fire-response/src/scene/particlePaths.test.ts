import { describe, expect, it } from "vitest";
import { incidentParticle, waterParticle } from "./particlePaths";
import type { Vec3 } from "../types";

const jet: [Vec3, Vec3, Vec3] = [[-5, 21, 16], [1, 22, 12], [7, 18, 7.9]];

describe("deterministic incident particles", () => {
  it("uses simulation time so pause and replay reproduce the same frame", () => {
    for (const kind of ["smoke", "flame", "ember"] as const) {
      expect(incidentParticle(kind, 35.2, 7, .8)).toEqual(incidentParticle(kind, 35.2, 7, .8));
      expect(incidentParticle(kind, 35.2, 7, .8).position).not.toEqual(incidentParticle(kind, 35.5, 7, .8).position);
    }
  });
  it("hides particles at zero fire intensity and clamps excessive intensity", () => {
    for (const kind of ["smoke", "flame", "ember"] as const) {
      expect(incidentParticle(kind, 12, 5, 0).opacity).toBe(0);
      expect(incidentParticle(kind, 12, 5, 3)).toEqual(incidentParticle(kind, 12, 5, 1));
    }
  });
  it("keeps the plume bounded above the incident with finite render values", () => {
    for (const time of [0, 12.4, 59.9, 180, 1000]) for (let i = 0; i < 32; i++) {
      const p = incidentParticle("smoke", time, i, .9);
      expect(p.position.every(Number.isFinite)).toBe(true);
      expect(p.position[1]).toBeGreaterThanOrEqual(3);
      expect(p.position[1]).toBeLessThanOrEqual(21);
      expect(p.diameter).toBeGreaterThan(0);
      expect(p.diameter).toBeLessThan(11);
      expect(p.opacity).toBeGreaterThanOrEqual(0);
      expect(p.opacity).toBeLessThanOrEqual(.65);
    }
  });
  it("uses different stable trajectories for adjacent particles", () => {
    expect(incidentParticle("smoke", 25, 1, 1).position).not.toEqual(incidentParticle("smoke", 25, 2, 1).position);
  });
  it("widens the upper plume enough to remain visible in the command view", () => {
    const diameters = Array.from({ length: 24 }, (_, index) => incidentParticle("smoke", 65, index, .9).diameter);
    expect(Math.max(...diameters)).toBeGreaterThan(8);
    expect(Math.min(...diameters)).toBeGreaterThan(3);
  });
});

describe("water jet droplets", () => {
  it("advances only with simulation time and remains deterministic", () => {
    expect(waterParticle(jet, 10, 6)).toEqual(waterParticle(jet, 10, 6));
    expect(waterParticle(jet, 10, 6).position).not.toEqual(waterParticle(jet, 10.3, 6).position);
  });
  it("never continues through the target facade or behind the nozzle", () => {
    for (const time of [0, 12.5, 45, 120]) for (let i = 0; i < 52; i++) {
      const p = waterParticle(jet, time, i);
      expect(p.position.every(Number.isFinite)).toBe(true);
      expect(p.position[2]).toBeGreaterThanOrEqual(7.9);
      expect(p.position[2]).toBeLessThanOrEqual(16);
      expect(p.diameter).toBeGreaterThan(0);
      expect(p.opacity).toBeGreaterThanOrEqual(0);
      expect(p.opacity).toBeLessThanOrEqual(1);
    }
  });
});
