// @vitest-environment node
import { Children, isValidElement, type ReactNode } from 'react';
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { City } from './City';
import { Box } from './Primitives';
import { STAGING, SURFACE_Y } from '../spatial/layout';
import type { Vec3 } from '../types';

type Props = {
  children?: ReactNode; p?: Vec3; s?: Vec3; position?: Vec3; rotation?: Vec3;
  color?: string; depthLayer?: number;
};
type Slab = { bounds: Box3; size: Vec3; color?: string; layer: number };
const EPSILON = 1e-7;

function transform(position: Vec3 = [0, 0, 0], rotation: Vec3 = [0, 0, 0]) {
  return new Matrix4().compose(new Vector3(...position),
    new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(1, 1, 1));
}

function groundSlabs() {
  const slabs: Slab[] = [];
  function visit(node: ReactNode, parent = new Matrix4()) {
    Children.forEach(node, child => {
      if (!isValidElement<Props>(child)) return;
      const props = child.props;
      if (child.type === Box) {
        const size = props.s ?? [1, 1, 1];
        const world = parent.clone().multiply(transform(props.p, props.rotation));
        const bounds = new Box3().setFromCenterAndSize(new Vector3(), new Vector3(...size)).applyMatrix4(world);
        if (size[1] <= .1 && Math.abs(bounds.max.y - SURFACE_Y) < EPSILON) {
          slabs.push({ bounds, size, color: props.color, layer: props.depthLayer ?? 0 });
        }
        return;
      }
      // Expand the pure access-road component, not hook-owning scene components.
      if (typeof child.type === 'function' && child.type.name === 'Driveway') {
        visit((child.type as (props: Props) => ReactNode)(props), parent);
        return;
      }
      const world = child.type === 'group'
        ? parent.clone().multiply(transform(props.position, props.rotation)) : parent;
      visit(props.children, world);
    });
  }
  const render = (City as unknown as {
    type: (props: { onSelect: (id: string) => void }) => ReactNode;
  }).type;
  visit(render({ onSelect: () => {} }));
  return slabs;
}

function overlaps(a: Box3, b: Box3) {
  return Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > EPSILON &&
    Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > EPSILON;
}

describe('coplanar city ground finishes', () => {
  it('gives every overlapping ground slab a distinct depth priority', () => {
    const slabs = groundSlabs();
    const conflicts: string[][] = [];
    for (let i = 0; i < slabs.length; i++) for (let j = i + 1; j < slabs.length; j++) {
      const a = slabs[i], b = slabs[j];
      if (overlaps(a.bounds, b.bounds) && a.layer === b.layer) {
        conflicts.push([a, b].map(slab => `${slab.color} at ${slab.bounds.min.toArray()}`));
      }
    }
    expect(slabs).toHaveLength(30);
    expect(conflicts).toEqual([]);
  });

  it.each([
    { name: 'lobby', x: 7, z: 0, color: '#89979b' },
    { name: 'lobby threshold seam', x: 7, z: 6.45, color: '#99aaae' },
    { name: 'entrance', x: 7, z: 8.5, color: '#99aaae' },
    { name: 'entrance and D01 bay seam', x: 7, z: 9.55, color: '#99aaae' },
    { name: 'D01 bay', x: 4, z: 12, color: '#424b50' },
    { name: 'M01 bay', x: -6, z: -2, color: '#424b50' },
    { name: 'road and station access', x: -45, z: 20, color: '#424c52' },
    { name: 'rotated west station apron', x: -47, z: 20, color: '#495459' },
  ])('keeps one intended finish visible at the $name', ({ x, z, color }) => {
    const covering = groundSlabs().filter(({ bounds }) =>
      x > bounds.min.x && x < bounds.max.x && z > bounds.min.z && z < bounds.max.z);
    expect(covering.length).toBeGreaterThan(1);
    const frontLayer = Math.max(...covering.map(slab => slab.layer));
    expect(covering.filter(slab => slab.layer === frontLayer).map(slab => slab.color)).toEqual([color]);
  });

  it('preserves all twelve bay footprints and the shared vehicle and pedestrian elevation', () => {
    const slabs = groundSlabs();
    const bays = slabs.filter(slab => slab.size[0] === 8 && slab.size[1] === .04 && slab.size[2] === 5);
    expect(bays).toHaveLength(12);
    for (const { position } of Object.values(STAGING)) {
      expect(bays.some(({ bounds }) => Math.abs(bounds.min.x - (position[0] - 4)) < EPSILON &&
        Math.abs(bounds.min.z - (position[2] - 2.5)) < EPSILON)).toBe(true);
    }
    for (const slab of slabs) expect(slab.bounds.max.y).toBeCloseTo(SURFACE_Y, 8);
    expect(slabs.find(slab => slab.color === '#89979b')!.size).toEqual([15, .05, 13]);
    expect(slabs.find(slab => slab.color === '#99aaae')!.size).toEqual([3.2, .03, 3.2]);
  });
});
