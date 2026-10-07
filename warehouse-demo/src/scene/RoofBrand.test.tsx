import { describe, expect, it, vi } from 'vitest';
import { Children, isValidElement, StrictMode, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { Texture } from 'three';
import { RoofBrandPlane, useRoofBrandTexture } from './RoofBrand';

function nodes(node: ReactNode): any[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement(child)) return [];
    const element = child as any;
    return [element, ...nodes(element.props.children)];
  });
}
describe('roof brand projection', () => {
  it('creates local text textures again after StrictMode cleanup and disposes on unmount', () => {
    const fillText = vi.fn();
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillText } as any);
    const dispose = vi.spyOn(Texture.prototype, 'dispose');
    try {
      const { result, unmount } = renderHook(useRoofBrandTexture, { wrapper: StrictMode });
      expect(result.current).toBeInstanceOf(Texture);
      expect(fillText).toHaveBeenCalledWith('WareTrack', 512, 128, 980);
      expect(fillText).toHaveBeenCalledTimes(2);
      expect(dispose).toHaveBeenCalledTimes(1);
      expect(result.current).not.toBe(dispose.mock.instances[0]);
      unmount();
      expect(dispose).toHaveBeenCalledTimes(2);
    } finally { context.mockRestore(); dispose.mockRestore(); }
  });
  it('uses a flat 3D plane within the low roof footprint, not a DOM projection', () => {
    const all = nodes(RoofBrandPlane({ texture: new Texture() }));
    expect(all[0].type).toBe('mesh');
    expect(all[0].props.position).toEqual([4.3, 4.59, -5.8]);
    expect(all[0].props.rotation).toEqual([-Math.PI / 2, 0, 0]);
    expect(all.find(node => node.type === 'planeGeometry').props.args).toEqual([4.8, 1.1]);
  });
  it('maps transparent lettering without lighting or depth artifacts', () => {
    const texture = new Texture();
    const material = nodes(RoofBrandPlane({ texture })).find(node => node.type === 'meshBasicMaterial');
    expect(material.props.map).toBe(texture);
    expect(material.props.transparent).toBe(true);
    expect(material.props.depthWrite).toBe(false);
    expect(material.props.toneMapped).toBe(false);
  });
});
