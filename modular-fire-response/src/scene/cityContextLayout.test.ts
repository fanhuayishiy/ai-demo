// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Vector3 } from 'three';
import type { UnitState, Vec3 } from '../types';
import { LOW_BUILDINGS, ROAD_WIDTH, ROAD_XS, ROAD_ZS, STAGING, STATION_LAYOUT, STATIC_SOLIDS, SURFACE_Y, WATER_SOURCES } from '../spatial/layout';
import { ACCESS_ROUTES, ROAD_JUNCTIONS } from '../simulation/routing';
import { footprint, headingTo, overlaps, solidFootprint } from '../simulation/geometry';
import { createUnits } from '../simulation/data';
import { cargoAircraftPose, CARGO_GEAR_BOTTOM, CARGO_ROTOR_HALF, fireAircraftPose, fireHoseRoute, type FlightPose } from './aircraft';
import { createHoseCurve, dogRoutePosition, ROTOR_ARM, ROTOR_BLADE_HALF } from './helpers';
import { boomSupplyRoute, dogSupplyRoute, fireSupplyRoute, waterToBoosterRoute } from './waterPaths';

type Part = { id: string; kind: string; p: Vec3; s: Vec3; color: string };
const modules = import.meta.glob('./cityContextLayout.ts');
async function contextParts() {
  const load = modules['./cityContextLayout.ts'];
  expect(load, 'the bounded courtyard layout is available').toBeTypeOf('function');
  return ((await load()) as { CITY_CONTEXT_PARTS: Part[] }).CITY_CONTEXT_PARTS;
}
const bounds = (p: Vec3, s: Vec3) => new Box3().setFromCenterAndSize(new Vector3(...p), new Vector3(...s));
const polygon = (part: Part) => solidFootprint({ id: part.id, center: part.p, size: part.s });
function unit(id: string, time = 0): UnitState {
  return { ...createUnits().find(value => value.id === id)!, position: [...STAGING[id].position], heading: STAGING[id].heading, status: 'working', deployment: 5, airTime: time };
}

describe('courtyard context clearance', () => {
  it('adds a bounded deterministic set of paving and grouped vegetation near low buildings', async () => {
    const parts = await contextParts();
    expect(parts).toEqual(await contextParts());
    expect(parts.length).toBeGreaterThan(60);
    expect(parts.length).toBeLessThan(240);
    expect(new Set(parts.map(part => part.id)).size).toBe(parts.length);
    expect(new Set(parts.map(part => part.kind))).toEqual(new Set(['paving', 'curb', 'soil', 'trunk', 'foliage']));
    for (const building of LOW_BUILDINGS) expect(parts.some(part => part.kind === 'paving' && part.id.startsWith(`${building.id}/`)), building.id).toBe(true);
    for (const part of parts) {
      expect([...part.p, ...part.s].every(Number.isFinite), part.id).toBe(true);
      expect(part.s.every(size => size > 0), part.id).toBe(true);
      expect(part.p[1] - part.s[1] / 2, part.id).toBeGreaterThanOrEqual(.1399);
      expect(part.p[1] + part.s[1] / 2, part.id).toBeLessThanOrEqual(4.6);
      if (part.kind === 'paving') expect(part.p[1] + part.s[1] / 2).toBeLessThanOrEqual(SURFACE_Y + .06);
      if (part.kind === 'curb' || part.kind === 'soil') expect(part.p[1] + part.s[1] / 2).toBeLessThanOrEqual(SURFACE_Y + .16);
      expect(LOW_BUILDINGS.some(building => Math.hypot(part.p[0] - building.position[0], part.p[2] - building.position[2]) < 23), part.id).toBe(true);
    }
  });

  it('keeps every context footprint outside roads, existing solids and complete station aprons', async () => {
    const reserved = [
      ...STATIC_SOLIDS.map(solid => ({ id: solid.id, shape: solidFootprint(solid) })),
      ...ROAD_XS.map(x => ({ id: `road-x-${x}`, shape: solidFootprint({ id: '', center: [x, 0, 5], size: [ROAD_WIDTH, 1, 78] }) })),
      ...ROAD_ZS.map(z => ({ id: `road-z-${z}`, shape: solidFootprint({ id: '', center: [2.5, 0, z], size: [103, 1, ROAD_WIDTH] }) })),
      ...STATION_LAYOUT.map(station => {
        const transform = new Matrix4().makeRotationY(station.rotation).setPosition(...station.position);
        const shape = [[-11.5, -8], [11.5, -8], [11.5, 18], [-11.5, 18]].map(([x, z]) => {
          const point = new Vector3(x, 0, z).applyMatrix4(transform);
          return [point.x, point.z] as [number, number];
        });
        return { id: `${station.id}-apron`, shape };
      }),
    ];
    const hits = (await contextParts()).flatMap(part => reserved.filter(zone => overlaps(polygon(part), zone.shape)).map(zone => `${part.id}: ${zone.id}`));
    expect(hits).toEqual([]);
  });

  it('preserves real station, staging and refill access sweeps including full parking turns', async () => {
    const parts = await contextParts(), hits = new Set<string>();
    const check = (position: Vec3, heading: number) => {
      const body = footprint(position, heading);
      for (const part of parts) if (overlaps(body, polygon(part))) hits.add(part.id);
    };
    for (const route of ACCESS_ROUTES) for (let leg = 1; leg < route.length; leg++) {
      const from = route[leg - 1], to = route[leg], heading = headingTo(from, to);
      const steps = Math.ceil(Math.hypot(to[0] - from[0], to[2] - from[2]) / .35);
      for (let step = 0; step <= steps; step++) check(from.map((value, axis) => value + (to[axis] - value) * step / steps) as Vec3, heading);
    }
    for (const point of [...ACCESS_ROUTES.flat(), ...ROAD_JUNCTIONS]) for (let turn = 0; turn < 80; turn++) check(point, turn * Math.PI / 40);
    for (const [id, bay] of Object.entries(STAGING)) {
      const depth = ['B01', 'L01', 'F01'].includes(id) ? 6.3 : 5;
      const zone = solidFootprint({ id, center: bay.position, size: [8, 1, depth] });
      for (const part of parts) if (overlaps(zone, polygon(part))) hits.add(`${part.id}: ${id}-deployed`);
    }
    for (const source of WATER_SOURCES) for (let turn = 0; turn < 80; turn++) check(source.bay, turn * Math.PI / 40);
    expect([...hits]).toEqual([]);
  });

  it('leaves the dog entrance and every live ground and aircraft hoseline unobstructed', async () => {
    const parts = await contextParts(), hits = new Set<string>();
    const checkRoute = (points: Vec3[], radius = .13) => {
      if (!points.length) return;
      const route = createHoseCurve(points, SURFACE_Y, radius);
      for (const point of route.getPoints(Math.max(1, Math.ceil(route.getLength() / .2)))) {
        for (const part of parts) if (bounds(part.p, part.s).expandByScalar(radius).containsPoint(point)) hits.add(part.id);
      }
    };
    const booster = unit('M01'), dog = unit('D01');
    ['W01', 'W02', 'W03'].forEach((id, index) => checkRoute(waterToBoosterRoute(unit(id), booster, index)));
    checkRoute(boomSupplyRoute(booster, unit('B01')));
    checkRoute(fireSupplyRoute(booster, unit('F01')));
    for (let time = 0; time <= 64; time += .5) {
      checkRoute(fireHoseRoute(unit('F01', time)));
      const dogs = [0, 1, 2].map(index => dogRoutePosition(dog.position, time, index));
      checkRoute(dogSupplyRoute(booster, dogs), .11);
      for (const position of dogs) for (const part of parts) {
        if (bounds(part.p, part.s).intersectsBox(bounds([position[0], position[1] + .55, position[2]], [1.8, 1.1, 1.5]))) hits.add(`${part.id}: dog`);
      }
    }
    expect([...hits]).toEqual([]);
  });

  it('clears actual rotor and undercarriage envelopes throughout launch, work and return', async () => {
    const parts = await contextParts(), hits = new Set<string>();
    const check = (pose: FlightPose, cargo = false, sideHook = false) => {
      const radius = ROTOR_ARM + ROTOR_BLADE_HALF;
      const half = cargo ? CARGO_ROTOR_HALF : [radius, .5, radius];
      const bottom = cargo ? CARGO_GEAR_BOTTOM : sideHook ? 1.43 : 1.86;
      const box = new Box3(new Vector3(sideHook ? -4.18 : -half[0], -bottom, -half[2]).multiplyScalar(pose.scale), new Vector3(...half).multiplyScalar(pose.scale))
        .applyMatrix4(new Matrix4().makeRotationY(pose.heading).setPosition(...pose.position));
      for (const part of parts) if (box.intersectsBox(bounds(part.p, part.s))) hits.add(part.id);
    };
    for (let time = 0; time <= 64; time += .5) {
      for (const returning of [false, true]) {
        const fire = { ...unit('F01', time), airReturning: returning, airReturnFrom: 32, airReturnTime: time };
        const cargo = { ...unit('C01', time), airReturning: returning, airReturnFrom: 36, airReturnTime: time };
        for (let index = 0; index < 3; index++) check(fireAircraftPose(fire, index), false, index < 2);
        check(cargoAircraftPose(cargo), true);
      }
    }
    expect([...hits]).toEqual([]);
  });
});
