import { getEntity } from '../data';
import type { SimState, Vec3 } from '../types';
import { CAMERA_POSITION, CAMERA_TARGET } from './layout';

export interface CameraPose { position: Vec3; target: Vec3; zoomFactor: number }
const overview: CameraPose = { position: CAMERA_POSITION, target: CAMERA_TARGET, zoomFactor: 1 };
export const TOUR_DURATION = 28;
const stops: CameraPose[] = [
  overview,
  { position: [5, 22, 34], target: [-10, 1, 7], zoomFactor: 1.45 },
  { position: [23, 18, 31], target: [-1, 1, -1], zoomFactor: 1.45 },
  { position: [27, 23, 41], target: [5, 1, 8], zoomFactor: 1.4 },
];
export function blendPose(a: CameraPose, b: CameraPose, fraction: number): CameraPose {
  const t = Math.max(0, Math.min(1, fraction));
  const ease = t * t * (3 - 2 * t);
  const lerp = (x: Vec3, y: Vec3) => x.map((v, i) => v + (y[i] - v) * ease) as Vec3;
  return { position: lerp(a.position, b.position), target: lerp(a.target, b.target), zoomFactor: a.zoomFactor + (b.zoomFactor - a.zoomFactor) * ease };
}
export function focusPose(id: string, sim: SimState): CameraPose {
  const entity = getEntity(id);
  if (entity.kind === 'warehouse') return overview;
  const at = entity.id === 'forklift-01' ? sim.forklift.position : entity.id === 'pallet-01' ? sim.cargo.position : entity.position;
  return { target: [at[0], 1, at[2]], position: [at[0] + 24, 26, at[2] + 38], zoomFactor: 1.9 };
}
export function tourPose(elapsed: number): CameraPose {
  const time = ((elapsed % TOUR_DURATION) + TOUR_DURATION) % TOUR_DURATION;
  const index = Math.floor(time / 7);
  return blendPose(stops[index], stops[(index + 1) % stops.length], (time % 7) / 7);
}
