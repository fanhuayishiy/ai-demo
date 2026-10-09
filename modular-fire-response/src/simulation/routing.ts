import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';
import type { Vec3 } from '../types';
import { ROAD_XS, ROAD_ZS, STAGING, STATION_LAYOUT, SURFACE_Y, WATER_SOURCES } from '../spatial/layout';
import { segmentClear } from './geometry';

export const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const key = (p: Vec3) => `${p[0].toFixed(5)},${p[2].toFixed(5)}`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(v, b));
type Segment = { a: Vec3; b: Vec3; directed: boolean };
const segments: Segment[] = [];
function addChain(points: Vec3[], directed = false) {
  for (let i = 1; i < points.length; i++) if (distance(points[i - 1], points[i]) > 0.001) {
    const a = points[i - 1], b = points[i];
    if (segmentClear(a, b) && segmentClear(b, a)) segments.push({ a, b, directed });
  }
}
const at = (x: number, z: number): Vec3 => [x, SURFACE_Y, z];
ROAD_XS.forEach(x => addChain(x === -45 || x === 28 ? [at(x, 40), at(x, -30)] : [at(x, -30), at(x, 40)], true));
ROAD_ZS.forEach(z => addChain(z === 40 ? [at(50, z), at(-45, z)] : [at(-45, z), at(50, z)], true));

export const ROAD_JUNCTIONS: Vec3[] = ROAD_XS.flatMap(x => ROAD_ZS.map(z => at(x, z)));
export const ACCESS_ROUTES: Vec3[][] = [];
for (const station of STATION_LAYOUT) for (const home of station.homes) {
  const row = station.driveway[0];
  const join = station.rotation === 0 ? at(home[0], row[2]) : at(row[0], home[2]);
  const route = [home, join, ...station.driveway];
  ACCESS_ROUTES.push(route); addChain(route);
}
function projection(p: Vec3): Vec3 | undefined {
  const candidates = [
    ...ROAD_XS.map(x => at(x, clamp(p[2], -30, 40))),
    ...ROAD_ZS.map(z => at(clamp(p[0], -45, 50), z)),
  ];
  return candidates.filter(q => (Math.abs(q[0] - p[0]) < 0.001 || Math.abs(q[2] - p[2]) < 0.001) && segmentClear(p, q) && segmentClear(q, p))
    .sort((a, b) => distance(a, p) - distance(b, p))[0];
}
for (const stage of Object.values(STAGING)) {
  const entry = stage.approach ?? projection(stage.position);
  if (entry) { const route = [entry, stage.position]; ACCESS_ROUTES.push(route); addChain(route); }
}
for (const source of WATER_SOURCES) { const route = [source.approach, source.bay]; ACCESS_ROUTES.push(route); addChain(route); }

const onSegment = (p: Vec3, segment: Segment) => Math.abs(distance(segment.a, p) + distance(p, segment.b) - distance(segment.a, segment.b)) < 0.0001;
const basePoints = new Map(segments.flatMap(s => [[key(s.a), s.a], [key(s.b), s.b]] as [string, Vec3][]));
for (const a of segments) for (const b of segments) {
  if (a.a[0] === a.b[0] && b.a[2] === b.b[2]) {
    const cross = at(a.a[0], b.a[2]);
    if (onSegment(cross, a) && onSegment(cross, b)) basePoints.set(key(cross), cross);
  }
}

// Directed emergency lanes plus explicit orthogonal apron and service connectors.
export function planRoute(from: Vec3, to: Vec3, blocked: boolean): Vec3[] {
  if (![...from, ...to].every(Number.isFinite)) return [];
  const graph = createGraph<Vec3, number>();
  const extra: Segment[] = [];
  for (const endpoint of [from, to]) if (!segments.some(s => onSegment(endpoint, s))) {
    const join = projection(endpoint);
    if (!join) return [];
    extra.push({ a: endpoint, b: join, directed: false });
  }
  const allSegments = [...segments, ...extra];
  const points = new Map(basePoints);
  [from, to, ...extra.flatMap(s => [s.a, s.b])].forEach(p => points.set(key(p), p));
  const unique = [...points.values()];
  unique.forEach(p => graph.addNode(key(p), p));
  for (const segment of allSegments) {
    const chain = unique.filter(p => onSegment(p, segment)).sort((a, b) => distance(segment.a, a) - distance(segment.a, b));
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1], b = chain[i];
      if (blocked && a[0] === -22 && b[0] === -22 && Math.min(a[2], b[2]) <= -5 && Math.max(a[2], b[2]) >= -5) continue;
      graph.addLink(key(a), key(b), distance(a, b));
      const controlledAccess = blocked && a[0] === -22 && b[0] === -22 && a[2] <= 20 && b[2] <= 20;
      if (!segment.directed || controlledAccess) graph.addLink(key(b), key(a), distance(a, b));
    }
  }
  const path = aStar(graph, { oriented: true, distance: (_a, _b, link) => link.data, heuristic: (a, b) => distance(a.data, b.data) }).find(key(from), key(to));
  if (!path.length) return [];
  return path.reverse().map(n => n.data)
    .filter((p, i, all) => i === 0 || distance(p, all[i - 1]) > 0.001)
    .map(p => [...p] as Vec3);
}
