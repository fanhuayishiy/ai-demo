import { describe, expect, it } from 'vitest';
import { Children, isValidElement, type ReactNode } from 'react';
import * as Models from './Models';
import worldSource from './World.tsx?raw';
import sceneSource from './Scene.tsx?raw';
import { entities } from '../data';

function nodes(node: ReactNode): any[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as any;
    if (typeof element.type === 'function') return nodes(element.type(element.props));
    return [element, ...nodes(element.props.children)];
  });
}
describe('crafted warehouse models', () => {
  it('keeps entity Html mounted outside the conditional selection ring', () => {
    const entitySource = worldSource.slice(worldSource.indexOf('function Entity('), worldSource.indexOf('function Ground('));
    expect(entitySource).toMatch(/<\/mesh>\s*\}\s*<Html/);
    expect(entitySource).toContain("display: selected || hovered ? 'block' : 'none'");
    expect(entitySource).toContain("pointerEvents: 'none'");
  });
  it('chooses the supported PCF shadow map explicitly', () => {
    expect(sceneSource).toContain('shadows={{ type: PCFShadowMap }}');
  });
  it('labels entities with catalog Chinese names, never fixed live statuses', () => {
    const labels = Array.from(worldSource.matchAll(/id="([^"]+)" label="([^"]+)"/g));
    expect(labels).toHaveLength(entities.length);
    for (const [, id, label] of labels) {
      expect(label).toContain(entities.find(entity => entity.id === id)?.name);
      expect(label).toMatch(/[\u4e00-\u9fff]/);
      expect(label).not.toMatch(/Loading|Available|In queue|Active/);
    }
  });
  it('builds four distinct loading docks and a blue roof', () => {
    expect(Models.Warehouse).toBeTypeOf('function');
    const all = nodes(<Models.Warehouse />);
    expect(all.filter(n => n.props.name?.startsWith('loading-dock-'))).toHaveLength(4);
    expect(all.some(n => n.props.name === 'blue-roof')).toBe(true);
  });
  it('builds a truck with six wheels, glazed cab, and cargo body', () => {
    const all = nodes(<Models.Truck accent="#2864ed" />);
    expect(all.filter(n => n.props.name === 'wheel')).toHaveLength(6);
    expect(all.some(n => n.props.name === 'windshield')).toBe(true);
    expect(all.some(n => n.props.name === 'cargo-body')).toBe(true);
  });
  it('keeps forklift forks separate from the carriage and supplies stacked pallet boxes', () => {
    const all = nodes(<Models.Forklift />);
    expect(all.filter(n => n.props.name === 'fork-tine')).toHaveLength(2);
    expect(nodes(<Models.Pallet />).filter(n => n.props.name === 'carton')).toHaveLength(8);
  });
});
