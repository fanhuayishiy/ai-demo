// @vitest-environment node
import { Children, isValidElement, type ReactNode } from 'react';
import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { City } from './City';
import { Box } from './Primitives';
import { UrbanSurfaceProvider } from './UrbanSurfaceMaterial';
import { ROAD_XS, ROAD_ZS, SURFACE_Y } from '../spatial/layout';
import type { Vec3 } from '../types';

type Element = { type: unknown; props: Record<string, unknown> };
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
function withSize(tree: Element[], size: Vec3) {
  return tree.find(node => node.type === Box &&
    (node.props.s as Vec3).every((value, index) => value === size[index]))!;
}

describe('industrial city surface finishes', () => {
  it('includes one bounded city context layer inside the shared surface provider', () => {
    const provider = cityElements().find(node => node.type === UrbanSurfaceProvider)!;
    const context = elements(provider.props.children as ReactNode).filter(node =>
      typeof node.type === 'function' && node.type.name === 'CityContext');
    expect(context).toHaveLength(1);
  });

  it('shares texture resources while preserving road and facade geometry', () => {
    const tree = cityElements();
    expect(tree.filter(node => node.type === UrbanSurfaceProvider)).toHaveLength(1);
    expect(withSize(tree, [8, .06, 78]).props.surface).toBe('asphalt');
    expect(withSize(tree, [15, 24.8, 13]).props.surface).toBe('concrete');
  });
  it('keeps the extended city ground subordinate to the illuminated response area', () => {
    const ground = cityElements().find(node => node.props.name === 'urban-ground')!;
    const material = elements(ground.props.children as ReactNode)
      .find(node => node.type === 'meshStandardMaterial')!;
    const color = new Color(material.props.color as string);
    expect(Math.max(color.r, color.g, color.b)).toBeLessThan(.02);
    expect(material.props.roughness).toBeGreaterThan(.9);
    expect(material.props.metalness).toBe(0);
    expect((ground.props.position as Vec3)[1]).toBeLessThan(SURFACE_Y);
  });

  it('separates ground, asphalt, and concrete with matte nonmetal surfaces', () => {
    const tree = cityElements();
    const surfaces = [
      withSize(tree, [152, 1.5, 116]),
      withSize(tree, [8, .06, 78]),
      withSize(tree, [32, .04, 29]),
    ];
    expect(new Set(surfaces.map(node => node.props.color)).size).toBe(3);
    for (const surface of surfaces) {
      expect(surface.props.roughness).toBeGreaterThanOrEqual(.85);
      expect(surface.props.metalness).toBe(0);
    }
    const asphalt = new Color(surfaces[1].props.color as string);
    const hardstand = new Color(surfaces[2].props.color as string);
    expect(asphalt.getHSL({ h: 0, s: 0, l: 0 }).l)
      .toBeLessThan(hardstand.getHSL({ h: 0, s: 0, l: 0 }).l);
  });

  it('contrasts neutral rough concrete with smoother glazing and metal rails', () => {
    const tree = cityElements();
    const facade = withSize(tree, [15, 24.8, 13]);
    const window = withSize(tree, [2.5, 2.2, .12]);
    const rail = withSize(tree, [3.3, .85, .13]);
    expect(facade.props.roughness).toBeGreaterThanOrEqual(.85);
    expect(facade.props.metalness).toBe(0);
    expect(new Color(facade.props.color as string).getHSL({ h: 0, s: 0, l: 0 }).s)
      .toBeLessThan(.16);
    expect(window.props.roughness).toBeLessThan(.35);
    expect(rail.props.metalness).toBeGreaterThan(.35);
  });

  it('keeps station light neutral without adding local shadow maps', () => {
    const lights = cityElements().filter(node => node.type === 'pointLight');
    expect(lights).toHaveLength(3);
    for (const light of lights) {
      expect(light.props.color).toBe('#e1e8ed');
      expect(light.props.position).toEqual([0, 5.4, 1.5]);
      expect(light.props.castShadow).not.toBe(true);
    }
  });

  it('keeps edge paint flat, inside the asphalt, and out of intersections', () => {
    const edges = cityElements().filter(node =>
      typeof node.type === 'function' && node.type.name === 'RoadEdge');
    expect(edges).toHaveLength(34);
    for (const edge of edges) {
      const p = edge.props.p as Vec3;
      const [width, depth] = edge.props.s as [number, number];
      expect(p[1]).toBe(SURFACE_Y);
      const withinVertical = ROAD_XS.some(x => Math.abs(p[0] - x) + width / 2 <= 4 &&
        p[2] - depth / 2 >= -34 && p[2] + depth / 2 <= 44);
      const withinHorizontal = ROAD_ZS.some(z => Math.abs(p[2] - z) + depth / 2 <= 4 &&
        p[0] - width / 2 >= -49 && p[0] + width / 2 <= 54);
      expect(withinVertical || withinHorizontal).toBe(true);
      const crossesIntersection = ROAD_XS.some(x => ROAD_ZS.some(z =>
        p[0] + width / 2 > x - 4 && p[0] - width / 2 < x + 4 &&
        p[2] + depth / 2 > z - 4 && p[2] - depth / 2 < z + 4));
      expect(crossesIntersection).toBe(false);
      const rendered = elements((edge.type as (props: typeof edge.props) => ReactNode)(edge.props));
      expect(rendered.some(node => node.type === 'planeGeometry')).toBe(true);
      expect(rendered.some(node => node.props.castShadow)).toBe(false);
      const material = rendered.find(node => node.type === 'meshStandardMaterial')!;
      expect(material.props.polygonOffset).toBe(true);
      expect(material.props.polygonOffsetFactor).toBe(0);
      expect(material.props.polygonOffsetUnits).toBeLessThan(-16);
    }
  });
});
