import type { Vec3 } from '../types';
import { LOW_BUILDINGS, SURFACE_Y } from '../spatial/layout';

export const CITY_CONTEXT_KINDS = ['paving', 'curb', 'soil', 'trunk', 'foliage'] as const;
export type CityContextKind = typeof CITY_CONTEXT_KINDS[number];
export type CityContextPart = { id: string; kind: CityContextKind; p: Vec3; s: Vec3; color: string };

const parts: CityContextPart[] = [];
const add = (id: string, kind: CityContextKind, p: Vec3, s: Vec3, color: string) => parts.push({ id, kind, p, s, color });

function paving(id: string, x: number, z: number, width: number, depth: number, edge: 'x' | 'z', sign: number) {
  add(id, 'paving', [x, SURFACE_Y, z], [width, .08, depth], '#626e70');
  const across = edge === 'z', span = across ? width : depth;
  const edgeX = x + (across ? 0 : sign * (width / 2 - .07));
  const edgeZ = z + (across ? sign * (depth / 2 - .07) : 0);
  const length = (span - 2) / 2;
  for (const side of [-1, 1]) add(`${id}/curb-${side}`, 'curb',
    [edgeX + (across ? side * (length / 2 + 1) : 0), SURFACE_Y + .075, edgeZ + (across ? 0 : side * (length / 2 + 1))],
    across ? [length, .1, .14] : [.14, .1, length], '#899390');
  for (let joint = -span / 2 + 3.6; joint < span / 2 - .4; joint += 3.6) add(`${id}/joint-${joint.toFixed(1)}`, 'curb',
    [x + (across ? joint : 0), SURFACE_Y + .042, z + (across ? 0 : joint)],
    across ? [.025, .004, depth - .26] : [width - .26, .004, .025], '#485557');
}

for (const building of LOW_BUILDINGS) {
  const [x, , z] = building.position, [width, , depth] = building.size;
  const band = 1.15, gap = .05;
  // The northeast block abuts a station apron; its east edge stays completely open.
  if (building.id === 'northeast-low') {
    paving(`${building.id}/west`, 21.375, z, band, depth, 'x', -1);
    paving(`${building.id}/north`, 29, -50.125, 16.4, band, 'z', -1);
    paving(`${building.id}/south`, 29, -39.875, 16.4, band, 'z', 1);
    continue;
  }
  for (const sign of [-1, 1]) {
    paving(`${building.id}/side-${sign}`, x + sign * (width / 2 + gap + band / 2), z, band, depth, 'x', sign);
    const endBand = building.id === 'south-low' && sign === 1 ? .55 : band;
    paving(`${building.id}/end-${sign}`, x, z + sign * (depth / 2 + gap + endBand / 2), width + 2 * (band + gap), endBand, 'z', sign);
  }
}

const gardens: { building: string; x: number; z: number; width: number; depth: number }[] = [
  { building: 'north-low', x: -22.2, z: -43, width: 5.6, depth: 6.2 },
  { building: 'northeast-low', x: 15.8, z: -44.8, width: 5.5, depth: 6.6 },
  { building: 'west-low', x: -34, z: 11, width: 7.6, depth: 4.2 },
  { building: 'east-low', x: 40, z: 4, width: 5.8, depth: 3.8 },
  { building: 'south-low', x: -13.7, z: 31.5, width: 3.5, depth: 4.9 },
];
const greens = ['#52715a', '#657c57', '#41634f', '#75865e', '#4c6c52'];
gardens.forEach((garden, index) => {
  const { x, z, width, depth } = garden, id = `${garden.building}/garden`;
  add(`${id}/soil`, 'soil', [x, SURFACE_Y, z], [width, .08, depth], '#35463b');
  for (const sign of [-1, 1]) {
    add(`${id}/edge-x-${sign}`, 'curb', [x + sign * (width / 2 - .07), SURFACE_Y + .075, z], [.14, .1, depth], '#778780');
    add(`${id}/edge-z-${sign}`, 'curb', [x, SURFACE_Y + .075, z + sign * (depth / 2 - .07)], [width - .28, .1, .14], '#778780');
  }
  const across = width > depth;
  for (const sign of [-1, 1]) {
    const tx = x + (across ? sign * width * .23 : sign * .13);
    const tz = z + (across ? sign * .13 : sign * depth * .23);
    const y = 2.68 + ((index + sign + 1) % 3) * .12;
    add(`${id}/tree-${sign}/trunk`, 'trunk', [tx, 1.28, tz], [.25, 2.12, .25], '#6b6e60');
    add(`${id}/tree-${sign}/crown`, 'foliage', [tx, y + .18, tz], [1.95, 2.25, 1.9], greens[index]);
    for (let lobe = 0; lobe < 4; lobe++) {
      const angle = lobe * Math.PI / 2 + index * .32;
      add(`${id}/tree-${sign}/lobe-${lobe}`, 'foliage', [tx + Math.cos(angle) * .44, y - .22, tz + Math.sin(angle) * .44], [1.55, 1.7, 1.55], greens[(index + lobe + 1) % greens.length]);
    }
  }
  for (const a of [-1, 1]) for (const b of [-1, 1]) add(`${id}/shrub-${a}-${b}`, 'foliage',
    [x + a * (across ? .62 : width / 2 - .7), SURFACE_Y + .42, z + b * (across ? depth / 2 - .7 : .62)],
    [.9, .75, 1], greens[(index + 2) % greens.length]);
});

export const CITY_CONTEXT_PARTS: CityContextPart[] = parts;
