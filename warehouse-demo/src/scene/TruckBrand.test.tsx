import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasTexture, Texture } from 'three';
import { acquireTruckBrandTexture } from './TruckBrand';
import { Cube } from '@phosphor-icons/react/dist/ssr/Cube';
import { renderToStaticMarkup } from 'react-dom/server';
import cubeSvg from './phosphor-cube.svg?raw';

const drawing = { fillText: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), fill: vi.fn() };
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(drawing as any);
  vi.stubGlobal('Path2D', class { constructor(public path: string) {} });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('offline truck branding', () => {
  it('uses the installed Phosphor Cube artwork unchanged', () => {
    const official = renderToStaticMarkup(<Cube weight="fill" size={256} />);
    const paths = (svg: string) => Array.from(svg.matchAll(/\bd="([^"]+)"/g), match => match[1]);
    expect(paths(cubeSvg)).toEqual(paths(official));
    expect(paths(cubeSvg)).not.toHaveLength(0);
  });
  it('draws local brand lettering and uses one shared texture until its final consumer releases', () => {
    const dispose = vi.spyOn(Texture.prototype, 'dispose');
    const first = acquireTruckBrandTexture('WareTrack', '#2861e7');
    const second = acquireTruckBrandTexture('WareTrack', '#2861e7');
    try {
      expect(first.texture).toBeInstanceOf(CanvasTexture);
      expect(first.texture).toBe(second.texture);
      expect(drawing.fillText).toHaveBeenCalledWith('WareTrack', 122, 61, 366);
      expect((first.texture?.image as HTMLCanvasElement).width).toBe(512);
      expect((first.texture?.image as HTMLCanvasElement).height).toBe(128);
      first.release();
      expect(dispose).not.toHaveBeenCalled();
      second.release();
      expect(dispose).toHaveBeenCalledTimes(1);
      second.release();
      expect(dispose).toHaveBeenCalledTimes(1);
    } finally { first.release(); second.release(); }
  });
  it('separates brand-color variants and recreates released textures safely for StrictMode', () => {
    const first = acquireTruckBrandTexture('Bluepeak', '#42b6a8');
    const alternate = acquireTruckBrandTexture('WareTrack', '#42b6a8');
    try { expect(first.texture).not.toBe(alternate.texture); }
    finally { first.release(); alternate.release(); }
    const recreated = acquireTruckBrandTexture('Bluepeak', '#42b6a8');
    try { expect(recreated.texture).not.toBe(first.texture); }
    finally { recreated.release(); }
  });
});
