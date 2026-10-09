import { Children, isValidElement, type ReactNode } from 'react';
import { Color } from 'three';
import { describe, expect, it, vi } from 'vitest';
import FireScene from './FireScene';
import { City } from './City';
import { NightLighting } from './NightLighting';
import { createInitialState } from '../simulation';

vi.mock('@react-three/drei', () => ({OrbitControls: () => null, Line: () => null}));

function elements(node: ReactNode): {type: unknown; props: Record<string, unknown>}[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{children?: ReactNode}>(child)) return [];
    return [{type: child.type, props: child.props}, ...elements(child.props.children)];
  });
}

describe('night response environment', () => {
  it('renders a night background with readable fill lighting', () => {
    const tree = elements(FireScene({state:createInitialState(),selectedId:'incident',onSelect:vi.fn(),view:'overview',cameraCommand:{type:'reset',sequence:0},touring:false,onTourChange:vi.fn()}));
    const background = tree.find(e => e.type === 'color' && e.props.attach === 'background')!;
    const color = new Color((background.props.args as string[])[0]);
    expect(Math.max(color.r,color.g,color.b)).toBeLessThan(0.05);
    expect(tree.some(e => e.type === NightLighting)).toBe(true);
    const fill = elements(NightLighting()).find(e => e.type === 'hemisphereLight')!;
    expect((fill.props.args as unknown[])[2]).toBeGreaterThan(0.4);
    expect((fill.props.args as unknown[])[2]).toBeLessThan(1.5);
  });

  it('removes the fixed booster from the city geometry', () => {
    const geometry = City as unknown as {type: (props: {onSelect: (id: string) => void}) => ReactNode};
    const tree = elements(geometry.type({onSelect:vi.fn()}));
    expect(tree.some(e => e.props.children === '固定增压泵')).toBe(false);
  });
});
