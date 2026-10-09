// @vitest-environment node
import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FireAircraft, Rotorcraft } from './Vehicles';
import { C } from './Primitives';

function elements(node: ReactNode): { type: unknown; props: Record<string, unknown> }[] {
  return Children.toArray(node).flatMap(child => !isValidElement<{ children?: ReactNode }>(child)
    ? [] : [{ type: child.type, props: child.props }, ...elements(child.props.children)]);
}

describe('shared-hose aircraft roles', () => {
  it.each([0, 1])('gives support %i a visible bridle and no independent nozzle', index => {
    const tree = elements(FireAircraft({ time: 8, index }));
    expect(tree.some(node => node.props.name === 'fire-nozzle')).toBe(false);
    expect(tree.some(node => node.props.name === 'hose-support-bridle')).toBe(true);
    expect(tree.find(node => node.type === Rotorcraft)?.props.color).toBe(C.white);
    expect(tree.some(node => node.props.name === 'fire-hose-hook')).toBe(true);
  });

  it('reserves the red nozzle-equipped aircraft for the hose end', () => {
    const tree = elements(FireAircraft({ time: 30, index: 2 }));
    expect(tree.filter(node => node.props.name === 'fire-nozzle')).toHaveLength(1);
    expect(tree.some(node => node.props.name === 'hose-support-bridle')).toBe(false);
    expect(tree.find(node => node.type === Rotorcraft)?.props.color).toBe(C.red);
    expect(tree.some(node => node.props.name === 'fire-hose-hook')).toBe(true);
  });
});
