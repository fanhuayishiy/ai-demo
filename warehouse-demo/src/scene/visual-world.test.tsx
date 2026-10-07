import { describe, expect, it, vi } from 'vitest';
import world from './World.tsx?raw';
import { getCameraLayout, stagingPallets, containerPosition } from './layout';

describe('reference-aligned composition', () => {
  it('reserves the right detail panel while keeping a full-width mobile view', () => {
    expect(getCameraLayout(1280, 736).offsetX).toBeLessThan(0);
    expect(getCameraLayout(1280, 736).offsetY).toBeGreaterThan(0);
    expect(getCameraLayout(390, 844).offsetX).toBe(0);
    expect(getCameraLayout(1280, 736).zoom).toBeGreaterThan(23);
  });
  it('adds varied staging pallets away from the forklift transport corridor', () => {
    expect(stagingPallets.length).toBeGreaterThanOrEqual(6);
    expect(new Set(stagingPallets.map(p => p.layers)).size).toBe(2);
    for (const p of stagingPallets) {
      expect(p.at[0] < -17.8 || p.at[0] > -2 || p.at[2] > 8.8 || p.at[2] < 0).toBe(true);
    }
    expect(containerPosition[0]).toBeLessThan(-17.8);
  });
  it('renders a container, staging pallets and library map-pin markers', () => {
    expect(world).toContain('<ShippingContainer');
    expect(world).toContain('stagingPallets.map');
    expect(world).toContain('<MapPin');
    expect(world).not.toContain('[-9, -4, 1, 6, 11].map');
  });
  it('keeps 3D label stacking below the interface panels', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('node:fs');
    expect(readFileSync('src/styles.css', 'utf8')).toMatch(/\.warehouse-scene\s*\{[^}]*z-index:\s*0/);
  });
});
