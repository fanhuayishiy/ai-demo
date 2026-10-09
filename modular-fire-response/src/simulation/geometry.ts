import type { UnitState, Vec3 } from '../types';
import { STATIC_SOLIDS } from '../spatial/layout';

type Point = [number, number];
export type Solid = { id: string; center: Vec3; size: Vec3 };
export const headingTo = (a: Vec3, b: Vec3) => Math.atan2(a[2] - b[2], b[0] - a[0]);
export const turnAngle = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export function footprint(p: Vec3, heading: number, padding = 0.08): Point[] {
  const c = Math.cos(heading), s = Math.sin(heading);
  return [[-3.49 - padding, -1.43 - padding], [3.2 + padding, -1.43 - padding], [3.2 + padding, 1.43 + padding], [-3.49 - padding, 1.43 + padding]]
    .map(([x, z]) => [p[0] + x * c + z * s, p[2] - x * s + z * c]);
}
export function overlaps(a: Point[], b: Point[]): boolean {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], axis = [p[1] - q[1], q[0] - p[0]];
    const project = (points: Point[]) => points.map(v => v[0] * axis[0] + v[1] * axis[1]);
    const pa = project(a), pb = project(b);
    if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
  }
  return true;
}
export function solidFootprint(solid: Solid): Point[] {
  const [x, , z] = solid.center, [w, , d] = solid.size;
  return [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]];
}
const obstacles = STATIC_SOLIDS.map(solidFootprint);
export function poseClear(p: Vec3, heading: number) {
  const body = footprint(p, heading);
  return !obstacles.some(solid => overlaps(body, solid));
}
export function segmentClear(a: Vec3, b: Vec3): boolean {
  const body = [...footprint(a, headingTo(a, b)), ...footprint(b, headingTo(a, b))];
  const xs = body.map(p => p[0]), zs = body.map(p => p[1]);
  const swept: Point[] = [[Math.min(...xs), Math.min(...zs)], [Math.max(...xs), Math.min(...zs)], [Math.max(...xs), Math.max(...zs)], [Math.min(...xs), Math.max(...zs)]];
  return !obstacles.some(solid => overlaps(swept, solid));
}
export function sweepClear(from: Vec3, to: Vec3, heading: number, nextHeading: number, others: UnitState[] = []): boolean {
  const turn = turnAngle(heading, nextHeading), d = Math.hypot(to[0] - from[0], to[2] - from[2]);
  const samples = Math.max(1, Math.ceil(d / 0.35), Math.ceil(Math.abs(turn) / 0.08));
  const otherBodies = others.filter(u => Math.hypot(u.position[0] - from[0], u.position[2] - from[2]) < d + 9)
    .map(u => footprint(u.position, u.heading ?? 0));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples, p: Vec3 = [from[0] + (to[0] - from[0]) * t, from[1], from[2] + (to[2] - from[2]) * t];
    const body = footprint(p, heading + turn * t);
    if (obstacles.some(solid => overlaps(body, solid)) || otherBodies.some(other => overlaps(body, other))) return false;
  }
  return true;
}
