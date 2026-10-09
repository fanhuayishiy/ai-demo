import type { SimulationState, UnitState, Vec3 } from '../types';
import { ROAD_XS, ROAD_ZS, STAGING, STATION_LAYOUT, SURFACE_Y, WATER_SOURCES } from '../spatial/layout';
import { ACCESS_ROUTES, distance, ROAD_JUNCTIONS } from './routing';
import { headingTo, sweepClear, turnAngle } from './geometry';

type TrafficState = SimulationState & { trafficOwners?: Record<string, string>; apronOwners?: Record<string, string> };
type TrafficUnit = UnitState & { trafficWait?: number; trafficYield?: boolean };
const moving = (u: UnitState) => u.status === 'enroute' || u.status === 'returning';
const roadPoint = (p: Vec3) => (ROAD_XS.includes(p[0]) && p[2] >= -30 && p[2] <= 40) || (ROAD_ZS.includes(p[2]) && p[0] >= -45 && p[0] <= 50);
const nearRoad = (p: Vec3) => ROAD_XS.some(x => Math.abs(x - p[0]) <= 4 && p[2] >= -34 && p[2] <= 44)
  || ROAD_ZS.some(z => Math.abs(z - p[2]) <= 4 && p[0] >= -49 && p[0] <= 54);
const aprons = STATION_LAYOUT.map(station => {
  const points = [...station.homes, ...station.driveway, station.entry];
  return { id: station.id, minX: Math.min(...points.map(p => p[0])) - 4, maxX: Math.max(...points.map(p => p[0])) + 4,
    minZ: Math.min(...points.map(p => p[2])) - 4, maxZ: Math.max(...points.map(p => p[2])) + 4 };
});
const inApron = (p: Vec3, apron: typeof aprons[number]) => p[0] >= apron.minX && p[0] <= apron.maxX && p[2] >= apron.minZ && p[2] <= apron.maxZ;
const apronTurns = STATION_LAYOUT.flatMap(station => station.homes.map(home => station.rotation === 0
  ? [home[0], SURFACE_Y, station.driveway[0][2]] as Vec3
  : [station.driveway[0][0], SURFACE_Y, home[2]] as Vec3));
const controlPoints = [...ROAD_JUNCTIONS, ...apronTurns, ...STATION_LAYOUT.map(s => s.driveway[0]), ...ACCESS_ROUTES.flat().filter(roadPoint)];
const zones: Vec3[][] = [];
for (const point of controlPoints) {
  const nearby = zones.filter(zone => zone.some(p => distance(p, point) <= 16.4));
  const merged = [point, ...nearby.flat()];
  nearby.forEach(zone => zones.splice(zones.indexOf(zone), 1));
  zones.push(merged);
}
const inside = (p: Vec3, zone: Vec3[]) => zone.some(q => distance(p, q) <= 8.2);

export function prepareTraffic(s: TrafficState) {
  s.trafficOwners ??= {};
  s.apronOwners ??= {};
  for (const [key, id] of Object.entries(s.trafficOwners)) {
    const owner = s.units.find(u => u.id === id);
    if (!owner || (!moving(owner) && owner.status !== 'refilling') || !inside(owner.position, zones[Number(key)]) || (owner as TrafficUnit).trafficYield) delete s.trafficOwners[key];
  }
  for (const [id, unitId] of Object.entries(s.apronOwners)) {
    const owner = s.units.find(u => u.id === unitId), apron = aprons.find(a => a.id === id)!;
    if (!owner || !moving(owner) || !inApron(owner.position, apron)) delete s.apronOwners[id];
  }
}
export function trafficOrder(s: TrafficState) {
  const owns = new Set(Object.values(s.trafficOwners ?? {}));
  return [...s.units].sort((a, b) => Number(owns.has(b.id)) - Number(owns.has(a.id)) || Number(b.kind === 'recon') - Number(a.kind === 'recon') || ((b as TrafficUnit).trafficWait ?? 0) - ((a as TrafficUnit).trafficWait ?? 0) || b.travel - a.travel || a.id.localeCompare(b.id));
}
function reserveApron(s: TrafficState, u: UnitState, next: Vec3) {
  const apron = aprons.find(a => a.id === u.station && (inApron(u.position, a) || inApron(next, a)));
  if (!apron) return true;
  const owners = s.apronOwners ??= {};
  if (owners[apron.id] && owners[apron.id] !== u.id) return false;
  // Keep same-station trucks out of one another's exit turns while road traffic yields.
  owners[apron.id] = u.id;
  return true;
}
function reserve(s: TrafficState, u: UnitState, next: Vec3) {
  const owners = s.trafficOwners ??= {};
  const needed = zones.map((zone, i) => inside(next, zone) ? String(i) : null).filter((v): v is string => v !== null);
  if (needed.some(key => owners[key] && owners[key] !== u.id)) return false;
  needed.forEach(key => { owners[key] = u.id; });
  return true;
}
function parkingHeading(u: UnitState) {
  if (distance(u.destination, u.home) < 0.001) return STATION_LAYOUT.find(s => s.id === u.station)!.homeHeading;
  if (WATER_SOURCES.some(source => distance(source.bay, u.destination) < 0.001)) return 0;
  return STAGING[u.id].heading;
}
function travelHeading(u: UnitState, next: Vec3) {
  // Reverse into a home bay; turning around among parked neighboring trucks is unsafe.
  if (distance(next, u.home) < 0.001 && distance(u.destination, u.home) < 0.001) return parkingHeading(u);
  return headingTo(u.position, next);
}

function wait(u: TrafficUnit, dt: number, reason: string, canYield = true) {
  u.task = `通行等待：${reason}`;
  u.trafficWait = (u.trafficWait ?? 0) + dt;
  // A queue must not hold an upstream region indefinitely while waiting for another.
  // Yielding changes priority only; every movement still passes swept collision checks.
  u.trafficYield = canYield && u.trafficWait >= 0.8;
}
function progressed(u: TrafficUnit) { u.trafficWait = 0; u.trafficYield = false; }

function junctionApproach(u: UnitState) {
  const index = u.route.findIndex(p => ROAD_JUNCTIONS.some(j => distance(p, j) < 0.001));
  if (index < 0) return;
  const junction = u.route[index], from = index ? u.route[index - 1] : u.position;
  const lastLeg = distance(from, junction);
  if (lastLeg < 0.001) return;
  const remaining = u.route.slice(0, index + 1).reduce((total, p, i) => total + distance(i ? u.route[i - 1] : u.position, p), 0);
  return { junction, remaining, dx: (junction[0] - from[0]) / lastLeg, dz: (junction[2] - from[2]) / lastLeg };
}

function conflictingMergeBlocked(u: UnitState, candidate: Vec3, others: UnitState[]) {
  const approach = junctionApproach(u);
  if (!approach || distance(candidate, approach.junction) >= 8.2) return false;
  // Conflicting approach lanes must leave room for the nearer vehicle's turn.
  return others.some(other => {
    if (!moving(other)) return false;
    const next = junctionApproach(other);
    return next && distance(next.junction, approach.junction) < 0.001 && approach.dx * next.dx + approach.dz * next.dz < 0.95
      && (next.remaining < approach.remaining - 0.001 || (Math.abs(next.remaining - approach.remaining) < 0.001 && other.id < u.id));
  });
}

export function moveVehicle(s: TrafficState, u: TrafficUnit, dt: number): boolean {
  const others = s.units.filter(other => other.id !== u.id);
  while (u.route.length && distance(u.position, u.route[0]) < 0.00001) u.route.shift();
  const desired = u.route.length ? travelHeading(u, u.route[0]) : parkingHeading(u);
  const heading = u.heading ?? desired;
  const turn = turnAngle(heading, desired);
  if (Math.abs(turn) > 0.005) {
    const nextHeading = heading + Math.sign(turn) * Math.min(Math.abs(turn), Math.PI * 3 * dt);
    if (reserveApron(s, u, u.position) && sweepClear(u.position, u.position, heading, nextHeading, others) && reserve(s, u, u.position)) { u.heading = nextHeading; progressed(u); }
    else wait(u, dt, '转向空间不足', sweepClear(u.position, u.position, heading, nextHeading));
    return false;
  }
  u.heading = desired;
  if (!u.route.length) { progressed(u); return true; }
  const next = u.route[0], d = distance(u.position, next);
  const amount = Math.min(d, (u.kind === 'recon' ? 32 : u.kind === 'water' ? 14 : 16) * dt);
  const candidate: Vec3 = [u.position[0] + (next[0] - u.position[0]) * amount / d, SURFACE_Y, u.position[2] + (next[2] - u.position[2]) * amount / d];
  if (!reserveApron(s, u, candidate)) { wait(u, dt, '站区前车尚未驶离'); return false; }
  if (conflictingMergeBlocked(u, candidate, others)) { wait(u, dt, '合流车辆先行'); return false; }
  if (nearRoad(candidate) && others.some(other => moving(other) && nearRoad(other.position) && distance(candidate, other.position) < 7.8)) {
    wait(u, dt, '保留前车转向空间'); return false;
  }
  if (!sweepClear(u.position, candidate, desired, desired, others)) { wait(u, dt, '保持安全车距', sweepClear(u.position, candidate, desired, desired)); return false; }
  if (!reserve(s, u, candidate)) { wait(u, dt, '合流区域已占用'); return false; }
  progressed(u);
  u.position = candidate; u.travel += amount;
  if (amount >= d - 0.00001) { u.position = [...next]; u.route.shift(); }
  u.task = u.status === 'returning' ? '沿专用车道撤回' : '沿专用车道行驶';
  return false;
}
