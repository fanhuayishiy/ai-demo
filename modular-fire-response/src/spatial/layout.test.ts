import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Vector3 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import type { UnitState, Vec3 } from '../types';
import { LOW_BUILDINGS, PUMP_POSITION, ROAD_WIDTH, ROAD_XS, ROAD_ZS, STAGING, STATION_LAYOUT, STATIC_SOLIDS, SURFACE_Y, VEHICLE_SCALE, WATER_SOURCES } from './layout';
import { createUnits } from '../simulation/data';
import { AIRCRAFT_TIMING, advanceAircraft, advanceAircraftLift, beginAircraftReturn } from '../simulation/aircraft';
import { ROTOR_ARM, ROTOR_BLADE_HALF, dogRoutePosition } from '../scene/helpers';
import { CARGO_GEAR_BOTTOM, CARGO_LOAD_SIZE, CARGO_ROTOR_HALF, boosterPorts, cargoAircraftPose, cargoLoadPose, fireAircraftPose, fireCarrierPorts, fireHoseRoute, rescueBasketPose, type FlightPose } from '../scene/aircraft';
import { boomSupplyRoute, dogSupplyRoute, fireSupplyRoute, waterToBoosterRoute } from '../scene/waterPaths';

type Footprint = { id: string; box: OBB };
const EPSILON = 0.0001;
const SUPPORT_UNITS = new Set(['B01', 'L01', 'F01']);

function footprint(id: string, position: Vec3, minX: number, maxX: number, minZ: number, maxZ: number, heading = 0): Footprint {
  const bounds = new Box3(new Vector3(minX + EPSILON, -1, minZ + EPSILON), new Vector3(maxX - EPSILON, 1, maxZ - EPSILON));
  const transform = new Matrix4().makeRotationY(heading).setPosition(position[0], 0, position[2]);
  return { id, box: new OBB().fromBox3(bounds).applyMatrix4(transform) };
}

function centered(id: string, center: Vec3, width: number, depth: number, heading = 0): Footprint {
  return footprint(id, center, -width / 2, width / 2, -depth / 2, depth / 2, heading);
}

function vehicle(id: string, position: Vec3, heading: number, deployed = false): Footprint[] {
  // Model chassis is offset from its origin; bumper extends to local x=3.75.
  const parts = [footprint(`${id}:chassis`, position, -4.1 * VEHICLE_SCALE, 3.75 * VEHICLE_SCALE, -1.425, 1.425, heading)];
  if (deployed && SUPPORT_UNITS.has(id)) {
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const footX = x * 2 * VEHICLE_SCALE;
      const footZ = z * 3.3 * VEHICLE_SCALE;
      const halfFoot = 0.4 * VEHICLE_SCALE;
      parts.push(footprint(`${id}:foot-${x}-${z}`, position, footX - halfFoot, footX + halfFoot, footZ - halfFoot, footZ + halfFoot, heading));
      const armZ = [z * VEHICLE_SCALE, footZ].sort((a, b) => a - b);
      parts.push(footprint(`${id}:arm-${x}-${z}`, position, footX - 0.11 * VEHICLE_SCALE, footX + 0.11 * VEHICLE_SCALE, armZ[0] - 0.11 * VEHICLE_SCALE, armZ[1] + 0.11 * VEHICLE_SCALE, heading));
    }
  }
  return parts;
}

function intersections(first: Footprint[], second: Footprint[]) {
  return first.flatMap(a => second.filter(b => a.box.intersectsOBB(b.box)).map(b => `${a.id} intersects ${b.id}`));
}

const solids = STATIC_SOLIDS.map(s => centered(s.id, s.center, s.size[0], s.size[2]));
// Match the through-road meshes in City: north/south span [-34,44], east/west span [-49,54].
const roads = [
  ...ROAD_XS.map(x => centered(`road-x-${x}`, [x, 0, 5], ROAD_WIDTH, 78)),
  ...ROAD_ZS.map(z => centered(`road-z-${z}`, [2.5, 0, z], 103, ROAD_WIDTH)),
];
const staging = Object.entries(STAGING).map(([id, s]) => ({ id, ...s }));
const deployed = staging.flatMap(s => vehicle(s.id, s.position, s.heading, true));
const homes = STATION_LAYOUT.flatMap(s => s.homes.flatMap((p, i) => vehicle(`${s.id}-${i}`, p, s.homeHeading)));

describe('static layout clearance', () => {
  it('assigns the mobile booster its own staging bay instead of a static pump solid', () => {
    expect(STAGING.M01).toBeDefined();
    expect(STAGING.M01.position).toEqual(PUMP_POSITION);
    expect(STATIC_SOLIDS.some(solid => solid.id === 'pump')).toBe(false);
  });

  it('provides four non-overlapping home bays at the west station', () => {
    expect(STATION_LAYOUT.find(station => station.id === 'WEST')?.homes).toHaveLength(4);
    expect(STATION_LAYOUT.reduce((count, station) => count + station.homes.length, 0)).toBe(12);
  });

  it('keeps the mobile booster north approach and both parking pivots clear', () => {
    expect(STAGING.M01).toBeDefined();
    const obstacles = [...solids, ...deployed.filter(part => !part.id.startsWith('M01:'))];
    const entry: Vec3 = [PUMP_POSITION[0], SURFACE_Y, -30];
    const hits: string[] = [];
    for (let i = 0; i <= 140; i++) {
      const position: Vec3 = [entry[0], SURFACE_Y, entry[2] + (PUMP_POSITION[2] - entry[2]) * i / 140];
      hits.push(...intersections(vehicle('M01', position, -Math.PI / 2), obstacles));
    }
    for (const position of [entry, PUMP_POSITION]) for (let i = 0; i <= 32; i++) {
      hits.push(...intersections(vehicle('M01', position, -Math.PI / 2 * i / 32), obstacles));
    }
    expect([...new Set(hits)]).toEqual([]);
  });

  it.each(staging)('$id chassis and deployed supports avoid static solids', s => {
    expect(intersections(vehicle(s.id, s.position, s.heading, true), solids)).toEqual([]);
  });

  it.each(STATION_LAYOUT)('$id parked units clear the station building and other solids', station => {
    const parked = station.homes.flatMap((p, i) => vehicle(`${station.id}-${i}`, p, station.homeHeading));
    expect(intersections(parked, solids)).toEqual([]);
  });

  it('keeps deployed vehicle bodies and supports separate from other vehicles', () => {
    const overlaps: string[] = [];
    for (let i = 0; i < staging.length; i++) for (let j = i + 1; j < staging.length; j++) {
      const a = staging[i], b = staging[j];
      overlaps.push(...intersections(vehicle(a.id, a.position, a.heading, true), vehicle(b.id, b.position, b.heading, true)));
    }
    expect(overlaps).toEqual([]);
  });

  it('keeps home parking positions separate', () => {
    const overlaps = homes.flatMap((a, i) => homes.slice(i + 1).filter(b => a.box.intersectsOBB(b.box)).map(b => `${a.id} intersects ${b.id}`));
    expect(overlaps).toEqual([]);
  });

  it('keeps deployed footprints out of through traffic', () => {
    expect(intersections(deployed, roads)).toEqual([]);
  });

  it('keeps marked staging bays out of through traffic', () => {
    const bays = staging.map(s => centered(`${s.id}:bay`, s.position, 8, 5, s.heading));
    expect(intersections(bays, roads)).toEqual([]);
  });

  it('keeps home parking out of through traffic', () => {
    expect(intersections(homes, roads)).toEqual([]);
  });

  it.each(WATER_SOURCES)('$id separates its refill truck from the fixture and other solids', source => {
    // traffic.parkingHeading turns the truck to heading=0 before entering refilling.
    expect(intersections(vehicle(`${source.id}:refill`, source.bay, 0), solids)).toEqual([]);
  });

  it.each(WATER_SOURCES)('$id lets a truck stop clear of through traffic', source => {
    expect(intersections(vehicle(`${source.id}:refill`, source.bay, 0), roads)).toEqual([]);
  });

  it('does not run through roads under buildings', () => {
    const buildingIds = new Set(['tower', ...LOW_BUILDINGS.map(b => b.id), ...STATION_LAYOUT.map(s => `station-${s.id}`)]);
    expect(intersections(roads, solids.filter(s => buildingIds.has(s.id)))).toEqual([]);
  });

  it('keeps stationary pumps, hydrants, and trees off through roads', () => {
    expect(intersections(roads, solids)).toEqual([]);
  });
});

type Volume = { id: string; box: Box3 };
function volume(id: string, center: Vec3, size: Vec3): Volume {
  return { id, box: new Box3().setFromCenterAndSize(new Vector3(...center), new Vector3(...size)) };
}
function aircraftUnit(id: string, airTime: number): UnitState {
  const base = createUnits().find(unit => unit.id === id)!;
  return { ...base, position: [...STAGING[id].position], heading: STAGING[id].heading, status: 'working', deployment: 5, airTime };
}
function airVolume(id: string, pose: FlightPose, cargo = false, sideHook = false): Volume {
  const x = cargo ? CARGO_ROTOR_HALF[0] : ROTOR_ARM + ROTOR_BLADE_HALF;
  const z = cargo ? CARGO_ROTOR_HALF[2] : ROTOR_ARM + ROTOR_BLADE_HALF;
  const top = cargo ? CARGO_ROTOR_HALF[1] : 0.5;
  // Fire aircraft include the low nozzle and the side-mounted hose support arm.
  const bottom = cargo ? CARGO_GEAR_BOTTOM : sideHook ? 1.43 : 1.86;
  const box = new Box3(new Vector3(sideHook ? -4.18 : -x, -bottom, -z).multiplyScalar(pose.scale), new Vector3(x, top, z).multiplyScalar(pose.scale));
  box.applyMatrix4(new Matrix4().makeRotationY(pose.heading).setPosition(...pose.position));
  return { id, box: box.expandByScalar(-EPSILON) };
}
function volumeHits(a: Volume[], b: Volume[]): string[] {
  return a.flatMap(first => b.filter(second => first.box.intersectsBox(second.box)).map(second => `${first.id} intersects ${second.id}`));
}

const roofVolumes = [
  volume('tower-roof', [7, 28.3, 0], [16.5, 0.6, 14.5]),
  volume('tower-roof-room', [4, 30, -2], [4.3, 2, 3.5]),
  volume('tower-roof-tank', [10.5, 30.3, -2.6], [3, 2.8, 3]),
  ...LOW_BUILDINGS.flatMap(b => [
    volume(`${b.id}-roof`, [b.position[0], b.size[1] + 0.2, b.position[2]], [b.size[0] + 0.7, 0.4, b.size[2] + 0.7]),
    volume(`${b.id}-plant`, [b.position[0] + 1, b.size[1] + 1, b.position[2]], [2.8, 1.2, 2]),
  ]),
];
const solidVolumes = [...STATIC_SOLIDS.map(s => volume(s.id, s.center, s.size)), ...roofVolumes];
const cabVolumes = staging.map(s => volume(`${s.id}-cab`, [s.position[0] + 2.3 * VEHICLE_SCALE, s.position[1] + 2 * VEHICLE_SCALE, s.position[2]], [2.5 * VEHICLE_SCALE, 2.3 * VEHICLE_SCALE, 2.8 * VEHICLE_SCALE]));
const buildingDetails = [
  volume('tower-wall', [7, 15.6, 0], [15, 24.8, 13]),
  ...Array.from({ length: 7 }, (_, floor) => [2.3, 7, 11.7].flatMap(x => [
    volume(`window-${floor}-${x}`, [x, 3.5 + floor * 3.4, 6.55], [2.5, 2.2, 0.12]),
    volume(`balcony-${floor}-${x}`, [x, 2.5 + floor * 3.4, 7], [3.3, 0.25, 1.5]),
    volume(`rail-${floor}-${x}`, [x, 3 + floor * 3.4, 7.7], [3.3, 0.85, 0.13]),
    ...[-1.5, 1.5].map(side => volume(`balcony-side-${floor}-${x}-${side}`, [x + side, 3 + floor * 3.4, 7], [0.12, 0.85, 1.5])),
  ])).flat(),
];
const loadObstacles = [...solidVolumes.filter(s => s.id !== 'tower'), ...buildingDetails];
const coneBases = [-11, -5, -1, 11, 15].map(x => volume(`cone-${x}`, [x, SURFACE_Y + 0.1, 16], [0.9, 0.2, 0.9]));

function loadVolume(unit: UnitState) {
  const pose = cargoLoadPose(unit);
  const result = volume('cargo-load', [pose.position[0], pose.position[1] + CARGO_LOAD_SIZE[1] / 2, pose.position[2]], CARGO_LOAD_SIZE);
  result.box.expandByScalar(-EPSILON);
  return result;
}
function basketVolume(unit: UnitState) {
  const pose = rescueBasketPose(unit), top = pose.slingHeight;
  const box = new Box3(new Vector3(-.45, 0, -.625).multiplyScalar(pose.scale), new Vector3(.45, top, .625).multiplyScalar(pose.scale));
  box.applyMatrix4(new Matrix4().makeRotationY(pose.heading).setPosition(...pose.position));
  return { id: 'rescue-basket', box: box.expandByScalar(-EPSILON) };
}

function localVolume(id: string, position: Vec3, heading: number, center: Vec3, size: Vec3, scale = VEHICLE_SCALE): Volume {
  const box = volume(id, center, size).box;
  box.applyMatrix4(new Matrix4().makeScale(scale, scale, scale));
  box.applyMatrix4(new Matrix4().makeRotationY(heading).setPosition(...position));
  return { id, box };
}
function stagedVehicleVolumes() {
  return staging.flatMap(unit => {
    const part = (name: string, center: Vec3, size: Vec3) => localVolume(`${unit.id}-${name}`, unit.position, unit.heading, center, size);
    const parts = [part('chassis', [-.3, .95, 0], [7.6, .6, 2.7]), part('cab', [2.3, 2, 0], [2.5, 2.3, 2.8])];
    for (const x of [-2.3, 2.4]) for (const z of [-1.45, 1.45]) {
      parts.push(part(`wheel-${x}-${z}`, [x, .75, z], [1.48, 1.48, .43]));
    }
    if (SUPPORT_UNITS.has(unit.id)) for (const x of [-2, 2]) for (const z of [-3.3, 3.3]) {
      parts.push(part(`foot-${x}-${z}`, [x, .15, z], [.8, .3, .8]));
    }
    return parts;
  });
}

const towerGroundDetails = [
  ...[-4.6, 4.6].map(x => volume(`tower-ground-${x}`, [7 + x, 1.69, 0], [5.8, 3.02, 13])),
  volume('tower-back-wall', [7, 1.69, -6.2], [3.4, 3.02, .6]),
  ...[-1.6, 1.6].map(x => volume(`door-post-${x}`, [7 + x, 1.6, 6.7], [.15, 2.84, .15])),
];
const hoseObstacles = [...loadObstacles, ...towerGroundDetails, ...coneBases, ...stagedVehicleVolumes()];

function segmentHits(from: Vec3, to: Vec3, obstacles: Volume[], radius: number): string[] {
  const a = new Vector3(...from), b = new Vector3(...to), samples = Math.max(1, Math.ceil(a.distanceTo(b) / 0.15));
  const point = new Vector3();
  for (let i = 0; i <= samples; i++) {
    point.copy(a).lerp(b, i / samples);
    const hit = obstacles.find(obstacle => obstacle.box.distanceToPoint(point) < radius - EPSILON);
    if (hit) return [hit.id];
  }
  return [];
}
function routeHits(points: Vec3[], obstacles: Volume[], radius: number): string[] {
  return points.slice(1).flatMap((point, index) => segmentHits(points[index], point, obstacles, radius).map(id => `segment-${index} intersects ${id}`));
}
function basketHits(unit: UnitState): string[] {
  const pose = cargoAircraftPose(unit), basket = rescueBasketPose(unit), box = basketVolume(unit);
  const body = localVolume('cargo-body', pose.position, pose.heading, [0, 0, 0], [3.1, .9, 1.65], pose.scale);
  return [
    ...volumeHits([box], [...loadObstacles, ...cabVolumes, loadVolume(unit), body]),
    ...segmentHits(basket.hook, basket.cableEnd, loadObstacles, .0125).map(id => `basket-cable intersects ${id}`),
    ...(box.box.min.y < SURFACE_Y ? ['basket intersects ground'] : []),
  ];
}

describe('aircraft and physical load clearance', () => {
  it('keeps all three fire aircraft and rotors clear during staggered launch', () => {
    const hits: string[] = [];
    for (let tick = 0; tick <= 300; tick++) {
      const unit = aircraftUnit('F01', tick / 10);
      const planes = [0, 1, 2].map(index => airVolume(`F01-${index}`, fireAircraftPose(unit, index), false, index < 2));
      hits.push(...volumeHits(planes, [...solidVolumes, ...cabVolumes]).map(hit => `t=${tick / 10} ${hit}`));
      for (let i = 0; i < planes.length; i++) hits.push(...volumeHits([planes[i]], planes.slice(i + 1)).map(hit => `t=${tick / 10} ${hit}`));
      if (hits.length) break;
    }
    expect(hits).toEqual([]);
  });

  it('keeps the heavy cargo frame and carried load clear on the complete flight', () => {
    const hits: string[] = [];
    for (let tick = 0; tick <= 640; tick++) {
      const unit = aircraftUnit('C01', tick / 10), pose = cargoAircraftPose(unit);
      hits.push(...volumeHits([airVolume('C01', pose, true)], [...solidVolumes, ...cabVolumes]));
      hits.push(...volumeHits([loadVolume(unit)], loadObstacles));
      hits.push(...segmentHits(pose.hook, cargoLoadPose(unit).cableEnd, loadObstacles, 0.025).map(id => `cargo-cable intersects ${id}`));
      if (hits.length) { hits.unshift(`t=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
  });

  it.each([-10, 0, 10])('separates the cargo flight from fire aircraft with a %ss launch offset', offset => {
    const hits: string[] = [];
    for (let tick = 0; tick <= 640; tick++) {
      const cargo = aircraftUnit('C01', tick / 10);
      const fire = aircraftUnit('F01', Math.max(0, Math.min(30, tick / 10 + offset)));
      const planes = [0, 1, 2].map(index => airVolume(`F01-${index}`, fireAircraftPose(fire, index), false, index < 2));
      hits.push(...volumeHits([airVolume('C01', cargoAircraftPose(cargo), true), loadVolume(cargo)], planes));
      if (hits.length) { hits.unshift(`t=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
  });

  it.each([1, 6, 12, 24, 30])('keeps the fire return from %ss clear of other aircraft and buildings', from => {
    const unit = aircraftUnit('F01', from), hits: string[] = [];
    unit.airReturning = true; unit.airReturnFrom = from;
    for (let tick = 0; tick <= AIRCRAFT_TIMING.return * 10; tick++) {
      unit.airReturnTime = tick / 10;
      const planes = [0, 1, 2].map(index => airVolume(`F01-${index}`, fireAircraftPose(unit, index), false, index < 2));
      hits.push(...volumeHits(planes, [...solidVolumes, ...cabVolumes]));
      for (let i = 0; i < planes.length; i++) hits.push(...volumeHits([planes[i]], planes.slice(i + 1)));
      if (hits.length) { hits.unshift(`return=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
  });

  it.each([1, 6, 15, 22, 29, 33, 35, 43, 47, 59, 63])('keeps the cargo return from %ss clear including rooftop load and cable', from => {
    const unit = aircraftUnit('C01', from), hits: string[] = [];
    unit.airReturning = true; unit.airReturnFrom = from;
    for (let tick = 0; tick <= AIRCRAFT_TIMING.return * 10; tick++) {
      unit.airReturnTime = tick / 10;
      const pose = cargoAircraftPose(unit);
      hits.push(...volumeHits([airVolume('C01', pose, true)], [...solidVolumes, ...cabVolumes]));
      hits.push(...volumeHits([loadVolume(unit)], loadObstacles));
      hits.push(...segmentHits(pose.hook, cargoLoadPose(unit).cableEnd, loadObstacles, 0.025).map(id => `cargo-cable intersects ${id}`));
      if (hits.length) { hits.unshift(`return=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
  });

  it('keeps the progressively deployed water hose clear of buildings and cone bases', () => {
    const obstacles = hoseObstacles, hits: string[] = [];
    for (let tick = 1; tick <= 60; tick++) {
      const points = fireHoseRoute(aircraftUnit('F01', tick / 2));
      for (let i = 1; i < points.length; i++) {
        const hit = segmentHits(points[i - 1], points[i], obstacles, 0.13);
        if (hit.length) { hits.push(`t=${tick / 2} segment=${i} ${hit[0]}`); break; }
      }
      if (hits.length) break;
    }
    expect(hits).toEqual([]);
  });
});

describe('mobile booster water connections', () => {
  it.each(['W01', 'W02', 'W03'])('routes %s into the mobile booster inlet without crossing physical obstacles', id => {
    const water = aircraftUnit(id, 0), booster = aircraftUnit('M01', 0);
    const route = waterToBoosterRoute(water, booster, Number(id.slice(1)) - 1);
    expect(route.at(-1)).toEqual(boosterPorts(booster).inlet);
    expect(routeHits(route, hoseObstacles, .12)).toEqual([]);
  });

  it('connects the mobile booster outlet to the actual fire carrier inlet', () => {
    const booster = aircraftUnit('M01', 0), fire = aircraftUnit('F01', 30);
    const route = fireSupplyRoute(booster, fire);
    expect(route[0]).toEqual(boosterPorts(booster).outlet);
    expect(route.at(-1)).toEqual(fireCarrierPorts(fire).inlet);
    expect(routeHits(route, hoseObstacles, .13)).toEqual([]);
  });

  it('routes the boom supply outside the pump chassis and stabilizer feet', () => {
    const booster = aircraftUnit('M01', 0), boom = aircraftUnit('B01', 0);
    const route = boomSupplyRoute(booster, boom);
    expect(route[0]).toEqual(boosterPorts(booster).outlet);
    expect(routeHits(route, hoseObstacles, .13)).toEqual([]);
  });

  it('keeps the moving dog supply clear through the open building entrance', () => {
    const booster = aircraftUnit('M01', 0), carrier = aircraftUnit('D01', 0), hits: string[] = [];
    for (let tick = 0; tick <= 260; tick++) {
      const dogs = [0, 1, 2].map(index => dogRoutePosition(carrier.position, tick / 10, index));
      const route = dogSupplyRoute(booster, dogs);
      hits.push(...routeHits(route, hoseObstacles, .11));
      if (hits.length) { hits.unshift(`dog-t=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
  });
});

describe('cargo auxiliary basket clearance', () => {
  it.each([0, 22, 33.9, 44, 64])('keeps the basket stowed outside the safe hover window at %ss', time => {
    const unit = aircraftUnit('C01', time);
    advanceAircraftLift(unit, AIRCRAFT_TIMING.lift, true);
    expect(rescueBasketPose(unit).extension).toBe(0);
  });

  it('extends and retracts continuously only after authorization', () => {
    const unit = aircraftUnit('C01', 36), hits: string[] = [];
    advanceAircraftLift(unit, AIRCRAFT_TIMING.lift, false);
    expect(rescueBasketPose(unit).extension).toBe(0);
    for (const authorized of [true, false]) {
      let previous = rescueBasketPose(unit);
      for (let tick = 0; tick < 30; tick++) {
        advanceAircraftLift(unit, .1, authorized);
        const current = rescueBasketPose(unit);
        expect(new Vector3(...current.position).distanceTo(new Vector3(...previous.position))).toBeLessThan(.30);
        hits.push(...basketHits(unit));
        previous = current;
      }
      expect(rescueBasketPose(unit).extension).toBe(authorized ? 1 : 0);
    }
    expect(hits).toEqual([]);
  });

  it('keeps the basket and second winch clear through rooftop pickup and ground handoff', () => {
    const unit = aircraftUnit('C01', 0), hits: string[] = [];
    for (let tick = 0; tick <= AIRCRAFT_TIMING.roofRescue.mission * 10; tick++) {
      if (tick > 0) advanceAircraft(unit, .1);
      advanceAircraftLift(unit, .1, true);
      hits.push(...basketHits(unit));
      if (hits.length) { hits.unshift(`cargo-t=${tick / 10}`); break; }
    }
    expect(hits).toEqual([]);
    expect(unit.airRescueDelivered).toBe(true);
    expect(rescueBasketPose(unit).extension).toBe(0);
  });

  it.each(['fault', 'returning'] as const)('continuously stows an extended basket during %s recovery', status => {
    const unit = aircraftUnit('C01', 36), hits: string[] = [];
    unit.airLiftDeployment = 1;
    const start = rescueBasketPose(unit).position, carrier = [...unit.position];
    unit.status = status;
    expect(beginAircraftReturn(unit)).toBe(true);
    expect(rescueBasketPose(unit).position).toEqual(start);
    let previous = rescueBasketPose(unit);
    for (let tick = 0; tick < AIRCRAFT_TIMING.return * 10; tick++) {
      advanceAircraft(unit, .1);
      advanceAircraftLift(unit, .1, false);
      const current = rescueBasketPose(unit);
      expect(new Vector3(...current.position).distanceTo(new Vector3(...previous.position)), `return-t=${(tick + 1) / 10}`).toBeLessThan(1.35);
      if (tick >= 29) expect(current.extension).toBe(0);
      hits.push(...basketHits(unit));
      previous = current;
      if (hits.length) { hits.unshift(`return-t=${(tick + 1) / 10}`); break; }
    }
    expect(hits).toEqual([]);
    expect(unit.position).toEqual(carrier);
    expect(unit.airReturning).toBe(false);
    expect(rescueBasketPose(unit).extension).toBe(0);
  });
});
