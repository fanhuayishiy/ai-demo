// @vitest-environment node
import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { City } from './City';
import { CITY_DETAIL_FINISHES } from './cityDetailLayout';
import { LOW_BUILDINGS, STATION_LAYOUT, SURFACE_Y, TREE_POSITIONS } from '../spatial/layout';
import type { Vec3 } from '../types';

type Element = { type: unknown; props: Record<string, unknown> };
type Detail = { id: string; p: Vec3; s: Vec3; color: string; finish: string };
type Canopy = { p: Vec3; s: Vec3; color: string; tree: number };

function elements(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return [{ type: child.type, props: child.props }, ...elements(child.props.children)];
  });
}
function cityElements() {
  const render = (City as unknown as {
    type: (props: { onSelect: (id: string) => void }) => ReactNode;
  }).type;
  return elements(render({ onSelect: () => {} }));
}
function cityDetails() {
  const node = cityElements().find(element =>
    typeof element.type === 'function' && element.type.name === 'CityDetails');
  expect(node, 'the live city mounts its dimensional architectural detail layer').toBeDefined();
  return { node: node!, details: node!.props.details as Detail[], canopies: node!.props.canopies as Canopy[] };
}
function within(detail: Detail, min: Vec3, max: Vec3) {
  for (let axis = 0; axis < 3; axis++) {
    expect(detail.p[axis] - detail.s[axis] / 2, `${detail.id} minimum axis ${axis}`).toBeGreaterThanOrEqual(min[axis] - .00001);
    expect(detail.p[axis] + detail.s[axis] / 2, `${detail.id} maximum axis ${axis}`).toBeLessThanOrEqual(max[axis] + .00001);
  }
}

describe('reference-inspired city detailing', () => {
  it('uses a bounded deterministic detail layer in the real city', () => {
    const first = cityDetails(), second = cityDetails();
    expect(first.details).toEqual(second.details);
    expect(first.canopies).toEqual(second.canopies);
    expect(first.details.length).toBeGreaterThan(700);
    expect(first.details.length).toBeLessThan(3600);
    expect(new Set(first.details.map(detail => detail.id)).size).toBe(first.details.length);
  });

  it('frames all tower elevations without expanding the building or closing the entrance', () => {
    const tower = cityDetails().details.filter(detail => detail.id.startsWith('tower/'));
    for (const elevation of ['front', 'rear', 'left', 'right']) {
      expect(tower.filter(detail => detail.id.startsWith(`tower/${elevation}/`)).length).toBeGreaterThan(60);
    }
    for (const detail of tower) {
      within(detail, [-1.25, SURFACE_Y, -7.25], [15.25, 31.7, 7.8]);
      const entersDoor = detail.p[0] + detail.s[0] / 2 > 5.4 && detail.p[0] - detail.s[0] / 2 < 8.6 &&
        detail.p[1] - detail.s[1] / 2 < 2.84 && detail.p[2] + detail.s[2] / 2 > 6.48;
      expect(entersDoor, detail.id).toBe(false);
    }
  });

  it.each(LOW_BUILDINGS)('adds multi-elevation windows and rooftop detail within $id existing roof envelope', building => {
    const details = cityDetails().details.filter(detail => detail.id.startsWith(`${building.id}/`));
    for (const elevation of ['front', 'rear', 'left', 'right', 'roof']) {
      expect(details.some(detail => detail.id.startsWith(`${building.id}/${elevation}/`))).toBe(true);
    }
    for (const detail of details) within(detail,
      [building.position[0] - building.size[0] / 2 - .35, SURFACE_Y, building.position[2] - building.size[2] / 2 - .35],
      [building.position[0] + building.size[0] / 2 + .35, building.size[1] + 1.6, building.position[2] + building.size[2] / 2 + .35]);
  });

  it('keeps station detail in the existing facade and paint flat on its apron', () => {
    const details = cityDetails().details;
    for (const station of STATION_LAYOUT) {
      const stationDetails = details.filter(detail => detail.id.startsWith(`station-${station.id}/`));
      expect(stationDetails.length).toBeGreaterThan(40);
      const sine = Math.sin(station.rotation), cosine = Math.cos(station.rotation);
      for (const detail of stationDetails) {
        const dx = detail.p[0] - station.position[0], dz = detail.p[2] - station.position[2];
        const local = { ...detail,
          p: [cosine * dx - sine * dz, detail.p[1], sine * dx + cosine * dz] as Vec3,
          s: [Math.abs(cosine) * detail.s[0] + Math.abs(sine) * detail.s[2], detail.s[1], Math.abs(sine) * detail.s[0] + Math.abs(cosine) * detail.s[2]] as Vec3,
        };
        if (detail.id.includes('/apron/')) {
          within(local, [-11.5, SURFACE_Y, -8], [11.5, SURFACE_Y + .02, 18]);
        } else {
          within(local, [-10.5, SURFACE_Y, -7.5], [10.5, 6.4, -.5]);
        }
      }
    }
  });

  it('uses clustered foliage only at existing tree locations and inside their collision envelopes', () => {
    const canopies = cityDetails().canopies;
    expect(canopies.length).toBeGreaterThanOrEqual(TREE_POSITIONS.length * 7);
    expect(canopies.length).toBeLessThanOrEqual(TREE_POSITIONS.length * 12);
    for (let tree = 0; tree < TREE_POSITIONS.length; tree++) {
      const origin = TREE_POSITIONS[tree];
      const clusters = canopies.filter(canopy => canopy.tree === tree);
      expect(new Set(clusters.map(canopy => canopy.color)).size).toBeGreaterThan(2);
      for (const cluster of clusters) within({ ...cluster, id: `tree-${tree}`, finish: 'foliage' },
        [origin[0] - 1.7, .2, origin[2] - 1.7], [origin[0] + 1.7, 5, origin[2] + 1.7]);
    }
  });

  it('batches architectural surfaces by finish and adds no dynamic lights', () => {
    const { node, details } = cityDetails();
    const rendered = elements((node.type as (props: typeof node.props) => ReactNode)(node.props));
    const batches = rendered.filter(element => typeof element.type === 'function' && element.type.name === 'DetailBoxes');
    expect(batches.length).toBeGreaterThan(2);
    expect(batches.length).toBeLessThanOrEqual(6);
    expect(batches.reduce((sum, batch) => sum + (batch.props.boxes as Detail[]).length, 0)).toBe(details.length);
    expect(rendered.some(element => element.type === 'pointLight' || element.type === 'spotLight')).toBe(false);
    expect(rendered.filter(element => typeof element.type === 'function' && element.type.name === 'TreeCanopies')).toHaveLength(1);
  });

  it('biases flush roof grilles and slab details without moving the physical surface', () => {
    for (const finish of Object.values(CITY_DETAIL_FINISHES)) {
      expect(finish).toMatchObject({ polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    }
    expect(CITY_DETAIL_FINISHES.warm.emissiveIntensity).toBeLessThanOrEqual(.5);
    expect(CITY_DETAIL_FINISHES.masonry.metalness).toBe(0);
  });

  it('mounts one local sign per station with the existing station name', () => {
    const signs = cityElements().filter(element => typeof element.type === 'function' && element.type.name === 'StationSign');
    expect(signs.map(sign => sign.props.label)).toEqual(STATION_LAYOUT.map(station => station.name));
    expect(signs.every(sign => typeof sign.props.label === 'string' && !String(sign.props.label).includes('http'))).toBe(true);
  });

  it('keeps any distant buildings completely behind the operational board', () => {
    const backdrop = cityDetails().details.filter(detail => detail.id.startsWith('backdrop/'));
    expect(backdrop.length).toBeGreaterThan(50);
    for (const detail of backdrop) {
      expect(detail.p[2] + detail.s[2] / 2, detail.id).toBeLessThan(-60);
      expect(detail.p[1] + detail.s[1] / 2).toBeLessThanOrEqual(29);
    }
  });

  it('extends the urban ground below the original operating surface', () => {
    const ground = cityElements().find(element => element.type === 'mesh' && element.props.name === 'urban-ground');
    expect(ground).toBeDefined();
    expect((ground!.props.position as Vec3)[1]).toBeLessThan(.14);
    const geometry = elements(ground!.props.children as ReactNode).find(element => element.type === 'planeGeometry');
    const size = geometry!.props.args as [number, number];
    expect(size[0]).toBeGreaterThan(200);
    expect(size[1]).toBeGreaterThan(200);
  });
});
