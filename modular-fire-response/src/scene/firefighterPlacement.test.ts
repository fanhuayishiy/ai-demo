// @vitest-environment node
import { Box3, Matrix4, Ray, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { SimulationState, UnitState, Vec3 } from "../types";
import { applyCommand, createInitialState } from "../simulation";
import { AIRCRAFT_TIMING, cargoFlightTime } from "../simulation/aircraft";
import { footprint, headingTo, overlaps } from "../simulation/geometry";
import { ACCESS_ROUTES, distance } from "../simulation/routing";
import { CREW_POSTS, crewForCarrier, crewJourney, crewTravelSeconds } from "../spatial/crew";
import { ROAD_XS, ROAD_ZS, ROOFTOP_PEOPLE, ROOFTOP_SURFACE_Y, STAGING, STATIC_SOLIDS, SURFACE_Y } from "../spatial/layout";
import { CARGO_GEAR_BOTTOM, CARGO_LOAD_SIZE, CARGO_ROTOR_HALF, cargoAircraftPose, cargoLoadPose, fireHoseRoute, rescueBasketPose } from "./aircraft";
import { CITY_DETAIL_BOXES } from "./cityDetailLayout";
import { firefighterPoses } from "./firefighterPoses";
import { dogRoutePosition } from "./helpers";
import { rooftopPersonPose } from "./RooftopResponse";
import { boomSupplyRoute, dogSupplyRoute, fireSupplyRoute, waterToBoosterRoute } from "./waterPaths";

const RADIUS = 0.8;
const HEIGHT = 2.2;
const STEP = 0.25;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
type Point = [number, number];
type Shape = { id: string; bounds: Box3 };
const box = (center: Vec3, size: Vec3) => new Box3().setFromCenterAndSize(new Vector3(...center), new Vector3(...size));
const localBox = (position: Vec3, heading: number, scale: number, min: Vec3, max: Vec3) =>
  new Box3(new Vector3(...min).multiplyScalar(scale), new Vector3(...max).multiplyScalar(scale))
    .applyMatrix4(new Matrix4().makeRotationY(heading).setPosition(...position));

function stagedScene() {
  const state = createInitialState();
  Object.assign(state, { time: 80, phase: 3 });
  state.life.confirmed = true;
  state.water.connected = true;
  state.water.outflow = 8;
  for (const unit of state.units) Object.assign(unit, {
    position: [...STAGING[unit.id].position], heading: STAGING[unit.id].heading,
    status: "working", deployment: 5, crewProgress: 1, crewReturning: false,
  });
  return state;
}

function crew(state: SimulationState, dogs: Vec3[] = []) {
  return firefighterPoses(state, dogs).map(person => ({
    ...person,
    bounds: box([person.position[0], person.position[1] + HEIGHT / 2, person.position[2]], [RADIUS * 2, HEIGHT, RADIUS * 2])
      .expandByScalar(-0.00001),
  }));
}
type Crew = ReturnType<typeof crew>;
const collisions = (people: Crew, obstacles: Shape[]) => people.flatMap(person => obstacles
  .filter(obstacle => person.bounds.intersectsBox(obstacle.bounds)).map(obstacle => `${person.id}: ${obstacle.id}`));

function segmentHits(from: Vec3, to: Vec3, bounds: Box3, radius: number) {
  const expanded = bounds.clone().expandByScalar(radius);
  const start = new Vector3(...from), end = new Vector3(...to);
  if (expanded.containsPoint(start) || expanded.containsPoint(end)) return true;
  const length = start.distanceTo(end);
  if (length < 0.00001) return false;
  const hit = new Ray(start, end.clone().sub(start).normalize()).intersectBox(expanded, new Vector3());
  return !!hit && hit.distanceTo(start) <= length;
}

function distanceToPolygon(point: Point, polygon: Point[]) {
  const [x, z] = point;
  if (overlaps([[x - 0.00001, z - 0.00001], [x + 0.00001, z - 0.00001],
    [x + 0.00001, z + 0.00001], [x - 0.00001, z + 0.00001]], polygon)) return 0;
  return Math.min(...polygon.map((from, index) => {
    const to = polygon[(index + 1) % polygon.length], dx = to[0] - from[0], dz = to[1] - from[1];
    const t = clamp(((x - from[0]) * dx + (z - from[1]) * dz) / (dx * dx + dz * dz));
    return Math.hypot(x - from[0] - dx * t, z - from[1] - dz * t);
  }));
}

const roofObstacles: Shape[] = [
  { id: "roof-deck", bounds: box([7, 28.8, 0], [14.8, 0.45, 12.8]) },
  { id: "roof-room", bounds: box([4, 30, -2], [4.3, 2, 3.5]) },
  { id: "roof-tank", bounds: box([10.5, 30.3, -2.6], [3, 2.8, 3]) },
  { id: "roof-solar", bounds: box([0, 0, 0], [3.8, 0.3, 2.8])
    .applyMatrix4(new Matrix4().makeRotationX(-0.18).setPosition(10, 29.3, 2)) },
  { id: "roof-work-light", bounds: box([0.65, ROOFTOP_SURFACE_Y + 0.85, 5.6], [0.65, 1.7, 0.45]) },
];
const siteObstacles: Shape[] = [
  ...STATIC_SOLIDS.map(solid => ({ id: solid.id, bounds: box(solid.center, solid.size) })),
  ...CITY_DETAIL_BOXES.map(detail => ({ id: detail.id, bounds: box(detail.p, detail.s) })),
  ...roofObstacles,
  ...[-11, -5, -1, 11, 15].map(x => ({ id: `cone-${x}`, bounds: box([x, 0.93, 16], [0.9, 1.5, 0.9]) })),
];

function cargoAt(time: number, occupied: boolean): UnitState {
  const unit = stagedScene().units.find(unit => unit.id === "C01")!;
  unit.airTime = time;
  if (occupied) Object.assign(unit, {
    airRescueBoarding: clamp((time - 37) / 2), airRescuePassenger: time >= 39, airRescueDelivered: time >= 64,
    airLiftDeployment: time < 34 ? 0 : time < 37 ? (time - 34) / 3 : time < 39 ? 1
      : time < 42 ? (42 - time) / 3 : time < 59 ? 0 : time < 62 ? (time - 59) / 3
        : time < 64 ? 1 : time < 67 ? (67 - time) / 3 : 0,
  });
  return unit;
}

function cargoObstacles(unit: UnitState): Shape[] {
  const aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit), load = cargoLoadPose(unit);
  const shapes: Shape[] = [
    { id: "aircraft-and-gear", bounds: localBox(aircraft.position, aircraft.heading, aircraft.scale,
      [-CARGO_ROTOR_HALF[0], -CARGO_GEAR_BOTTOM, -CARGO_ROTOR_HALF[2]], CARGO_ROTOR_HALF) },
    { id: "basket", bounds: localBox(basket.position, basket.heading, basket.scale,
      [-0.45, 0, -0.625], [0.45, basket.slingHeight, 0.625]) },
    { id: "supplies-and-slings", bounds: localBox(load.position, load.attached ? aircraft.heading : 0, 1,
      [-CARGO_LOAD_SIZE[0] / 2, 0, -CARGO_LOAD_SIZE[2] / 2], [CARGO_LOAD_SIZE[0] / 2, 0.86, CARGO_LOAD_SIZE[2] / 2]) },
  ];
  for (let index = 0; index < 4; index++) {
    const { position } = rooftopPersonPose(unit, index);
    shapes.push({ id: `civilian-${index}`, bounds: box([position[0], position[1] + 0.92, position[2]], [1.3, 1.84, 1.3]) });
  }
  const ground = (unit.airRescuePassenger || unit.airRescueDelivered)
    && cargoFlightTime(unit) >= AIRCRAFT_TIMING.roofRescue.groundApproach;
  const gateOpen = clamp((basket.extension - 0.7) / 0.3);
  for (const side of [-1, 1]) {
    const angle = side === (ground ? 1 : -1) ? side * gateOpen * Math.PI / 2 : 0;
    const bounds = box([0, basket.railHeight / 2, 0.58], [0.04, basket.railHeight, 1.16])
      .applyMatrix4(new Matrix4().makeRotationY(angle).setPosition(side * 0.43, 0, -0.58))
      .applyMatrix4(new Matrix4().makeScale(basket.scale, basket.scale, basket.scale))
      .applyMatrix4(new Matrix4().makeRotationY(basket.heading).setPosition(...basket.position));
    shapes.push({ id: `basket-gate-${side}`, bounds });
  }
  return shapes;
}

function cargoCollisions(state: SimulationState, unit: UnitState) {
  state.units = state.units.map(current => current.id === unit.id ? unit : current);
  const people = crew(state), aircraft = cargoAircraftPose(unit), basket = rescueBasketPose(unit), load = cargoLoadPose(unit);
  const issues = collisions(people, cargoObstacles(unit));
  for (const person of people) {
    if (segmentHits(basket.hook, basket.cableEnd, person.bounds, 0.0125)) issues.push(`${person.id}: basket cable`);
    if (segmentHits(aircraft.hook, load.cableEnd, person.bounds, 0.0225)) issues.push(`${person.id}: supply cable`);
  }
  return issues;
}

describe("firefighter placement clearances", () => {
  it("keeps personnel aboard before arrival and again after reset", () => {
    expect(crew(createInitialState())).toEqual([]);
    const state = stagedScene();
    expect(crew(state)).toHaveLength(7);
    expect(crew(applyCommand(state, { type: "reset" }))).toEqual([]);
  });

  it("keeps all seven separate full-size firefighter positions on the ground", () => {
    const people = crew(stagedScene());
    expect(Object.fromEntries(people.map(person => [person.id, person.position]))).toEqual({
      commander: [14, SURFACE_Y, 25], "water-operator": [-4.2, SURFACE_Y, 3.5],
      "dog-handler": [11.4, SURFACE_Y, 13.2], "cargo-operator": [34, SURFACE_Y, -18],
      "rescue-observer": [16, SURFACE_Y, 25], "ground-receiver": [44.9, SURFACE_Y, -21.8],
      "ground-support": [43, SURFACE_Y, -22],
    });
    expect(people).toHaveLength(7);
    for (const person of people) expect(person.position[1], person.id).toBe(SURFACE_Y);
    for (const person of people) for (const other of people) {
      if (person.id !== other.id) expect(person.bounds.intersectsBox(other.bounds), `${person.id}: ${other.id}`).toBe(false);
    }
    const civilians = ROOFTOP_PEOPLE.map((_, index) => rooftopPersonPose(undefined, index));
    expect(civilians).toHaveLength(4);
    for (const civilian of civilians) {
      expect(civilian.phase).toBe("waiting");
      expect(civilian.position[1]).toBeGreaterThanOrEqual(ROOFTOP_SURFACE_Y);
    }
  });

  it("never elevates firefighters during supply, pickup, handoff, recovery, pause, completion, or reset", () => {
    const state = stagedScene();
    state.flags.liftConcept = true;
    state.approvals.lift = true;
    const grounded = (sample: SimulationState, count = 7) => {
      const people = firefighterPoses(sample);
      expect(people).toHaveLength(count);
      for (const person of people) expect(person.position[1], `${person.id} at ${sample.time}`).toBe(SURFACE_Y);
    };
    grounded(createInitialState(), 0);
    for (const time of [0, 34, 37, 38, 39, 50, 59, 62, 63, 64, 67, 72]) {
      const unit = cargoAt(time, true);
      state.time = time;
      state.units = state.units.map(current => current.id === unit.id ? unit : current);
      grounded(state);
      grounded({ ...state, playing: false });
      if (time >= 39) {
        Object.assign(unit, { status: "fault", airTime: 39, airReturning: true,
          airReturnFrom: 39, airReturnTime: time - 39, airRescueRecovery: true });
        grounded(state);
      }
    }
    grounded({ ...state, complete: true, playing: false });
    grounded(applyCommand(state, { type: "reset" }), 0);
  });

  it("clears buildings, roof fixtures, doors, parapets, cones, and waiting civilians", () => {
    const state = stagedScene();
    const obstacles: Shape[] = [
      ...siteObstacles,
      ...cargoObstacles(cargoAt(0, false)).filter(shape => shape.id.startsWith("civilian-")),
    ];
    expect(collisions(crew(state), obstacles)).toEqual([]);
  });

  it.each([false, true])("clears ground fixtures and every parked carrier throughout walking with returning=%s", returning => {
    const state = stagedScene();
    const samples = Math.ceil(Math.max(...CREW_POSTS.map(post => crewTravelSeconds(post.carrierId))) / 0.05);
    const seen = new Set<string>();
    for (let tick = 0; tick <= samples; tick++) {
      const progress = returning ? 1 - tick / samples : tick / samples;
      for (const unit of state.units) Object.assign(unit, {
        crewProgress: progress, crewReturning: returning,
        status: returning ? "returning" : "deploying",
      });
      const people = crew(state);
      const expected = CREW_POSTS.filter(post => crewJourney(post, state.units.find(unit => unit.id === post.carrierId)!).progress > 0);
      expect(people.map(person => person.id)).toEqual(expected.map(post => post.id));
      expect(collisions(people, siteObstacles), `walk progress ${progress}`).toEqual([]);
      for (const person of people) {
        seen.add(person.id);
        expect(person.position[1], person.id).toBe(SURFACE_Y);
        expect([...person.position, person.heading].every(Number.isFinite), person.id).toBe(true);
        for (const unit of state.units) {
          const polygon = footprint(unit.position, unit.heading ?? 0);
          const clearance = distanceToPolygon([person.position[0], person.position[2]], polygon) - RADIUS;
          expect(clearance, `${person.id}: parked ${unit.id} at ${progress}`).toBeGreaterThan(0.15);
        }
      }
    }
    expect([...seen].sort()).toEqual(CREW_POSTS.map(post => post.id).sort());
  });

  it.each(["P01", "C01"])("preserves shared-door spacing for %s in both walking directions", carrierId => {
    const state = stagedScene(), carrier = state.units.find(unit => unit.id === carrierId)!;
    const members = crewForCarrier(carrierId);
    const samples = Math.ceil(crewTravelSeconds(carrierId) / 0.025);
    for (const returning of [false, true]) {
      for (let tick = 0; tick <= samples; tick++) {
        const progress = returning ? 1 - tick / samples : tick / samples;
        Object.assign(carrier, { crewProgress: progress, crewReturning: returning });
        const people = crew(state).filter(person => person.carrierId === carrierId);
        expect(people).toHaveLength(members.filter(post => crewJourney(post, carrier).progress > 0).length);
        for (const person of people) for (const other of people) {
          if (person.id === other.id) continue;
          expect(person.bounds.intersectsBox(other.bounds), `${person.id}: ${other.id} at ${progress}`).toBe(false);
        }
      }
    }
  });

  it("keeps outgoing and returning footpaths clear of the fixed supply hoses", () => {
    const state = stagedScene(), unit = (id: string) => state.units.find(unit => unit.id === id)!;
    const booster = unit("M01");
    const paths = [
      ...state.units.filter(unit => unit.kind === "water").map((water, index) => ({ points: waterToBoosterRoute(water, booster, index), radius: 0.12 })),
      { points: fireSupplyRoute(booster, unit("F01")), radius: 0.13 },
      { points: boomSupplyRoute(booster, unit("B01")), radius: 0.13 },
    ];
    for (let tick = 0; tick <= 200; tick++) {
      for (const current of state.units) current.crewProgress = tick / 200;
      for (const person of crew(state)) for (const path of paths) {
        for (let index = 1; index < path.points.length; index++) {
          expect(segmentHits(path.points[index - 1], path.points[index], person.bounds, path.radius + 0.05),
            `${person.id}: supply hose at ${tick / 200}`).toBe(false);
        }
      }
    }
  });

  it("stays outside vehicle access paths and complete arrival/departure turn envelopes", () => {
    const people = crew(stagedScene());
    expect(people).toHaveLength(7);
    for (const person of people) expect(person.position[1], person.id).toBe(SURFACE_Y);
    const nearest = new Map(people.map(person => [person.id, Infinity]));
    const check = (position: Vec3, heading: number) => {
      const polygon = footprint(position, heading);
      for (const person of people) {
        const clearance = distanceToPolygon([person.position[0], person.position[2]], polygon) - RADIUS;
        nearest.set(person.id, Math.min(nearest.get(person.id)!, clearance));
      }
    };
    const roads: Vec3[][] = [
      ...ROAD_XS.map(x => [[x, SURFACE_Y, -30], [x, SURFACE_Y, 40]] as Vec3[]),
      ...ROAD_ZS.map(z => [[-45, SURFACE_Y, z], [50, SURFACE_Y, z]] as Vec3[]),
    ];
    for (const route of [...ACCESS_ROUTES, ...roads]) {
      for (let index = 1; index < route.length; index++) {
        const from = route[index - 1], to = route[index], heading = headingTo(from, to);
        const samples = Math.ceil(distance(from, to) / STEP);
        for (let tick = 0; tick <= samples; tick++) {
          const position: Vec3 = [from[0] + (to[0] - from[0]) * tick / samples, SURFACE_Y,
            from[2] + (to[2] - from[2]) * tick / samples];
          check(position, heading);
          check(position, heading + Math.PI);
        }
      }
      for (const endpoint of route) for (let angle = 0; angle < 128; angle++) check(endpoint, angle * Math.PI / 64);
    }
    // Sampling can miss at most 0.125m of translation or 0.096m of a corner's turn.
    for (const [id, clearance] of nearest) expect(clearance, id).toBeGreaterThan(0.15);
  });

  it("keeps the robot handler and equipment crew clear of robots and actual supply hoses", () => {
    const state = stagedScene();
    const unit = (id: string) => state.units.find(unit => unit.id === id)!;
    const booster = unit("M01"), dog = unit("D01");
    const fixed: { points: Vec3[]; radius: number }[] = [
      ...state.units.filter(unit => unit.kind === "water").map((water, index) => ({ points: waterToBoosterRoute(water, booster, index), radius: 0.12 })),
      { points: fireSupplyRoute(booster, unit("F01")), radius: 0.13 },
      { points: boomSupplyRoute(booster, unit("B01")), radius: 0.13 },
    ];
    for (let tick = 0; tick <= 26 / STEP; tick++) {
      const elapsed = tick * STEP;
      state.time = 80 + elapsed;
      const positions = [0, 1, 2].map(index => dogRoutePosition(dog.position, elapsed, index));
      const people = crew(state, positions);
      const issues = collisions(people, positions.map((position, index) => ({
        id: `robot-${index}`, bounds: localBox(position, Math.PI / 2, 1, [-1.1, 0, -0.34], [1.13, 1.35, 0.68]),
      })));
      for (const person of people) for (const path of [...fixed, { points: dogSupplyRoute(booster, positions), radius: 0.11 }]) {
        for (let index = 1; index < path.points.length; index++) {
          if (segmentHits(path.points[index - 1], path.points[index], person.bounds, path.radius + 0.05)) issues.push(`${person.id}: hose`);
        }
      }
      expect(issues, `robot elapsed ${elapsed}`).toEqual([]);
    }
  });

  it("clears elevated fire-hose segments throughout launch and staggered recovery", () => {
    const state = stagedScene(), fire = state.units.find(unit => unit.id === "F01")!;
    for (const from of [undefined, 8, 22, 30]) {
      const duration = from === undefined ? AIRCRAFT_TIMING.fire.mission : AIRCRAFT_TIMING.return;
      for (let tick = 0; tick <= duration / STEP; tick++) {
        const elapsed = tick * STEP;
        Object.assign(fire, { airTime: from ?? elapsed, airReturning: from !== undefined,
          airReturnFrom: from, airReturnTime: elapsed });
        state.time = elapsed;
        const points = fireHoseRoute(fire), issues: string[] = [];
        for (const person of crew(state)) for (let index = 1; index < points.length; index++) {
          if (segmentHits(points[index - 1], points[index], person.bounds, 0.18)) issues.push(`${person.id}: segment ${index}`);
        }
        expect(issues, `fire hose from ${from ?? "launch"}, elapsed ${elapsed}`).toEqual([]);
      }
    }
  });

  it.each([false, true])("clears aircraft, supplies, basket gates, cables, and passengers with rescue=%s", occupied => {
    const state = stagedScene();
    const duration = occupied ? AIRCRAFT_TIMING.roofRescue.mission : AIRCRAFT_TIMING.cargo.mission;
    for (let tick = 0; tick <= duration / STEP; tick++) {
      const time = tick * STEP;
      state.time = time;
      expect(cargoCollisions(state, cargoAt(time, occupied)), `cargo time ${time}`).toEqual([]);
    }
  });

  it.each([40, 60, 63])("preserves crew clearance when an occupied aircraft is recalled at %ss", from => {
    const state = stagedScene();
    for (let tick = 0; tick <= (AIRCRAFT_TIMING.roofRescue.mission - from) / STEP; tick++) {
      const time = from + tick * STEP, unit = cargoAt(time, true);
      Object.assign(unit, { status: "fault", airTime: from, airReturning: true,
        airReturnFrom: from, airReturnTime: time - from, airRescueRecovery: true });
      state.time = time;
      expect(cargoCollisions(state, unit), `recovery time ${time}`).toEqual([]);
    }
  });
});
