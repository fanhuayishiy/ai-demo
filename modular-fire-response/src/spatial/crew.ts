import type { UnitState, Vec3 } from '../types';
import { GROUND_BASKET_POSITION, GROUND_PERSON_POSITION, ROOFTOP_CARGO_LANDING, STAGING, SURFACE_Y } from './layout';

export type CrewPost = {
  id: string; title: string; role: 'command' | 'operator' | 'rescue';
  unitId: string; carrierId: string; seat: number; offset: number;
  position: Vec3; target: Vec3; path: Vec3[];
};

export const CREW_WALK_SPEED = 1.3;
// Side-door paths are used only after the carrier completes its parking turn.
export const CREW_POSTS: CrewPost[] = [
  { id: 'commander', title: '消防指挥', role: 'command', unitId: 'incident', carrierId: 'P01', seat: 0, offset: 0,
    position: [14, SURFACE_Y, 25], target: [7, SURFACE_Y, 8],
    path: [[21.87, SURFACE_Y, 26.5], [14, SURFACE_Y, 25]] },
  { id: 'water-operator', title: '供水保障员', role: 'operator', unitId: 'M01', carrierId: 'M01', seat: 0, offset: 0,
    position: [-4.2, SURFACE_Y, 3.5], target: STAGING.M01.position,
    path: [[-4.13, SURFACE_Y, .5], [-4.2, SURFACE_Y, 3.5]] },
  { id: 'dog-handler', title: '机器犬操作员', role: 'operator', unitId: 'D01', carrierId: 'D01', seat: 0, offset: 0,
    position: [11.4, SURFACE_Y, 13.2], target: [7, SURFACE_Y, 8],
    path: [[5.87, SURFACE_Y, 14.5], [8.6, SURFACE_Y, 14.5], [11.4, SURFACE_Y, 13.2]] },
  { id: 'cargo-operator', title: '无人机操作员', role: 'operator', unitId: 'C01', carrierId: 'C01', seat: 0, offset: 0,
    position: [34, SURFACE_Y, -18], target: STAGING.C01.position,
    path: [[39.87, SURFACE_Y, -19.5], [34, SURFACE_Y, -18]] },
  { id: 'rescue-observer', title: '观察联络员', role: 'rescue', unitId: 'C01', carrierId: 'P01', seat: 1, offset: 2,
    position: [16, SURFACE_Y, 25], target: ROOFTOP_CARGO_LANDING,
    path: [[21.87, SURFACE_Y, 26.5], [16, SURFACE_Y, 25]] },
  { id: 'ground-receiver', title: '地面接应组', role: 'rescue', unitId: 'C01', carrierId: 'C01', seat: 1, offset: 2,
    position: [44.9, SURFACE_Y, -21.8], target: GROUND_BASKET_POSITION,
    path: [[39.87, SURFACE_Y, -19.5], [43, SURFACE_Y, -19.5], [44.9, SURFACE_Y, -21.8]] },
  { id: 'ground-support', title: '接应保障员', role: 'rescue', unitId: 'C01', carrierId: 'C01', seat: 2, offset: 4,
    position: [43, SURFACE_Y, -22], target: GROUND_PERSON_POSITION,
    path: [[39.87, SURFACE_Y, -19.5], [43, SURFACE_Y, -19.5], [43, SURFACE_Y, -22]] },
];

const length = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const lengths = new Map(CREW_POSTS.map(post => [post.id, post.path.slice(1).map((point, index) => length(post.path[index], point))]));
const pathLength = (post: CrewPost) => lengths.get(post.id)!.reduce((total, segment) => total + segment, 0);
export const crewForCarrier = (id: string) => CREW_POSTS.filter(post => post.carrierId === id);
export const crewTravelSeconds = (id: string) => Math.max(0, ...crewForCarrier(id).map(post => post.offset + pathLength(post) / CREW_WALK_SPEED));
export const crewReady = (unit: UnitState) => !crewForCarrier(unit.id).length || (unit.crewProgress ?? 0) >= 1;

export function crewJourney(post: CrewPost, unit: Pick<UnitState, 'crewProgress' | 'crewReturning'>) {
  const groupProgress = Number.isFinite(unit.crewProgress) ? Math.max(0, Math.min(1, unit.crewProgress!)) : 0;
  const total = pathLength(post);
  const travelled = groupProgress === 1 ? total
    : Math.max(0, Math.min(total, (groupProgress * crewTravelSeconds(post.carrierId) - post.offset) * CREW_WALK_SPEED));
  let remaining = travelled;
  const segments = lengths.get(post.id)!;
  for (let index = 0; index < segments.length; index++) {
    if (remaining > segments[index] && index < segments.length - 1) { remaining -= segments[index]; continue; }
    const from = post.path[index], to = post.path[index + 1], t = Math.min(1, remaining / segments[index]);
    return {
      progress: travelled / total,
      position: travelled === total ? [...post.position] as Vec3
        : from.map((value, axis) => value + (to[axis] - value) * t) as Vec3,
      heading: Math.atan2(to[0] - from[0], to[2] - from[2]) + (unit.crewReturning ? Math.PI : 0),
    };
  }
  return { progress: 1, position: [...post.position] as Vec3, heading: 0 };
}

export const onboardCrew = (unit: UnitState) => crewForCarrier(unit.id).filter(post => crewJourney(post, unit).progress === 0);
