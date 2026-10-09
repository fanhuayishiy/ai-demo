import type { Vec3, UnitStatus } from "../types";
import { CurvePath, LineCurve3, Vector3 } from "three";
import { overviewFrame } from "./camera";
export const ROTOR_ARM = 1.8;
export const ROTOR_BLADE_HALF = 1.25;
export const STOWED_AIRCRAFT_SCALE = 0.5;
export function worldToVehicle(
  world: Vec3,
  origin: Vec3,
  heading: number,
  scale: number,
): Vec3 {
  const x = world[0] - origin[0],
    z = world[2] - origin[2],
    c = Math.cos(heading),
    s = Math.sin(heading);
  return [
    (c * x - s * z) / scale,
    (world[1] - origin[1]) / scale,
    (s * x + c * z) / scale,
  ];
}
export function vehicleToWorld(
  local: Vec3,
  origin: Vec3,
  heading: number,
  scale: number,
): Vec3 {
  const c = Math.cos(heading),
    s = Math.sin(heading);
  return [
    origin[0] + scale * (c * local[0] + s * local[2]),
    origin[1] + scale * local[1],
    origin[2] + scale * (-s * local[0] + c * local[2]),
  ];
}
export function createHoseCurve(
  points: Vec3[],
  surface: number,
  radius: number,
) {
  const safe = points.map(
    (p) => new Vector3(p[0], Math.max(surface + radius + 0.025, p[1]), p[2]),
  );
  const curve = new CurvePath<Vector3>();
  for (let i = 1; i < safe.length; i++)
    if (safe[i].distanceToSquared(safe[i - 1]) > 1e-8)
      curve.add(new LineCurve3(safe[i - 1], safe[i]));
  if (!curve.curves.length) {
    const p = safe[0] ?? new Vector3(0, surface + radius + 0.025, 0);
    curve.add(new LineCurve3(p, p.clone().add(new Vector3(0.001, 0, 0))));
  }
  return curve;
}
export function dogRoutePosition(
  carrier: Vec3,
  elapsed: number,
  index: number,
): Vec3 {
  const progress = Math.max(0, Math.min(1, elapsed / 26));
  const z =
    carrier[2] - 2.5 + (-2 - carrier[2] + 2.5) * progress + (2 - index) * 3;
  const turn = Math.max(0, Math.min(1, (9.3 - z) / 1.5));
  const x = carrier[0] + 4.7 + (7 - carrier[0] - 4.7) * turn;
  return [x, carrier[1] + 0.03, z];
}
export function deploymentProgress(seconds: number) {
  return Math.max(0, Math.min(1, seconds / 5));
}
export function routePosition(route: Vec3[], progress: number): Vec3 {
  if (!route.length) return [0, 0, 0];
  const lengths = route
    .slice(1)
    .map((p, i) => Math.hypot(...p.map((v, j) => v - route[i][j])));
  let remaining =
    Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0)
      return route[i].map(
        (v, j) => v + ((route[i + 1][j] - v) * remaining) / lengths[i],
      ) as Vec3;
    remaining -= lengths[i];
  }
  return [...route[route.length - 1]];
}
export function overviewZoom(width: number, height: number) {
  return overviewFrame(width, height).zoom;
}
export function overviewTarget(width:number,height:number):Vec3 {
  return overviewFrame(width, height).target;
}
export function actionAllowed(status: UnitStatus, deployment: number) {
  return status === "working" && deployment > 0.8;
}
