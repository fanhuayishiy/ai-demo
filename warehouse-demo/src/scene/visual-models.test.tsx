import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import * as Models from './Models';

function nodes(node: ReactNode): any[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as any;
    if (typeof element.type === 'function') return nodes(element.type(element.props));
    return [element, ...nodes(element.props.children)];
  });
}
describe('blue WH-01 reference architecture', () => {
  it('shares box geometry and color materials while preserving each mesh transform', () => {
    const first = Models.Box({ size: [2, 3, 4], color: '#2861e7', at: [1, 2, 3] });
    const second = Models.Box({ size: [4, 5, 6], color: '#2861e7' });
    const white = Models.Box({ size: [1, 1, 1], color: '#ffffff' });
    expect(first.props.geometry).toBeDefined();
    expect(first.props.geometry).toBe(second.props.geometry);
    expect(first.props.geometry).toBe(white.props.geometry);
    expect(first.props.material).toBeDefined();
    expect(first.props.material).toBe(second.props.material);
    expect(first.props.material).not.toBe(white.props.material);
    expect(first.props.scale).toEqual([2, 3, 4]);
    expect(second.props.scale).toEqual([4, 5, 6]);
    expect(first.props.position).toEqual([1, 2, 3]);
    expect(first.props.dispose).toBeNull();
    expect(second.props.dispose).toBeNull();
  });
  it('keeps thin roof and facade seams visible without casting extra shadows', () => {
    for (const name of ['roof-seam', 'facade-seam']) {
      const seam = Models.Box({ name, size: [.02, .03, 1], color: '#2861e7' });
      expect(seam.props.castShadow).toBe(false);
      expect(seam.props.receiveShadow).toBe(true);
    }
    expect(Models.Box({ name: 'cargo-body', size: [2, 2, 4], color: '#fff' }).props.castShadow).toBe(true);
  });
  it('has three stepped roof volumes, blue facade panels and projecting loading bays', () => {
    const all = nodes(<Models.Warehouse />);
    const roofs = all.filter(node => node.props.name?.startsWith('roof-volume-'));
    expect(roofs).toHaveLength(3);
    expect(roofs.map(node => node.props.position[1])).toEqual([...roofs.map(node => node.props.position[1])].sort((a, b) => b - a));
    expect(new Set(roofs.map(node => node.props.position[1])).size).toBe(3);
    const panels = all.filter(node => node.props.name === 'blue-facade-panel');
    expect(panels.length).toBeGreaterThanOrEqual(3);
    for (const panel of panels) expect(panel.props.material.color.getHexString()).toBe('2861e7');
    expect(all.filter(node => node.props.name === 'projecting-dock-surround')).toHaveLength(4);
    expect(all.filter(node => node.props.name === 'dark-door-well')).toHaveLength(4);
    expect(all.filter(node => node.props.name === 'roof-vent').length).toBeLessThanOrEqual(2);
  });
  it('provides a corrugated container with two detailed locking doors', () => {
    expect(Models).toHaveProperty('ShippingContainer');
    const Container = (Models as any).ShippingContainer;
    if (!Container) return;
    const all = nodes(<Container />);
    expect(all.filter(node => node.props.name === 'container-side-rib').length).toBeGreaterThanOrEqual(24);
    expect(all.filter(node => node.props.name === 'container-door')).toHaveLength(2);
    expect(all.filter(node => node.props.name === 'container-locking-bar')).toHaveLength(4);
    const body = all.find(node => node.props.name === 'container-body');
    expect(body.props.scale).toEqual([2.6, 2.6, 5]);
  });
  it('supports four cartons on a single layer while retaining eight by default', () => {
    const Pallet = Models.Pallet as any;
    expect(nodes(<Pallet layers={1} />).filter(node => node.props.name === 'carton')).toHaveLength(4);
    expect(nodes(<Pallet />).filter(node => node.props.name === 'carton')).toHaveLength(8);
  });
});
