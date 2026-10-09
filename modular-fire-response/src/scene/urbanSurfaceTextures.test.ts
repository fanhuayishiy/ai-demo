// @vitest-environment node
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, SRGBColorSpace } from "three";
import { describe, expect, it, vi } from "vitest";
import { createUrbanSurfaceTextures, disposeUrbanSurfaceTextures, refreshUrbanSurfaceTextures } from "./urbanSurfaceTextures";

const textures = (surfaces: ReturnType<typeof createUrbanSurfaceTextures>) =>
  Object.values(surfaces).flatMap(surface => [surface.map, surface.roughnessMap]);
const pixels = (texture: DataTexture) => texture.image.data as Uint8Array;

describe("shared local urban textures", () => {
  it("creates exactly four small, opaque local textures", () => {
    const surfaces = createUrbanSurfaceTextures();
    const all = textures(surfaces);
    expect(new Set(all).size).toBe(4);
    for (const texture of all) {
      expect(texture).toBeInstanceOf(DataTexture);
      expect(texture.image.width).toBe(128);
      expect(texture.image.height).toBe(128);
      const data = pixels(texture);
      expect(data.length).toBe(128 * 128 * 4);
      for (let i = 3; i < data.length; i += 4) {
        expect(data[i]).toBe(255);
      }
    }
    disposeUrbanSurfaceTextures(surfaces);
  });

  it("reproduces the same grains across resets while keeping both surface finishes distinct", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(.1);
    const first = createUrbanSurfaceTextures();
    random.mockReturnValue(.9);
    const second = createUrbanSurfaceTextures();
    random.mockRestore();
    for (const kind of ["asphalt", "concrete"] as const) {
      expect(first[kind].map.image.data).toEqual(second[kind].map.image.data);
      expect(first[kind].roughnessMap.image.data).toEqual(second[kind].roughnessMap.image.data);
    }
    expect(first.asphalt.map.image.data).not.toEqual(first.concrete.map.image.data);
    disposeUrbanSurfaceTextures(first);
    disposeUrbanSurfaceTextures(second);
  });

  it("keeps the color grain neutral and low contrast without brightening the supplied base color", () => {
    const surfaces = createUrbanSurfaceTextures();
    for (const surface of Object.values(surfaces)) {
      const data = pixels(surface.map);
      const values: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        expect(data[i]).toBe(data[i + 1]);
        expect(data[i]).toBe(data[i + 2]);
        values.push(data[i]);
      }
      const min = Math.min(...values), max = Math.max(...values);
      expect(min).toBeGreaterThanOrEqual(232);
      expect(max).toBeLessThanOrEqual(255);
      expect(max - min).toBeGreaterThanOrEqual(8);
      expect(max - min).toBeLessThanOrEqual(23);
    }
    disposeUrbanSurfaceTextures(surfaces);
  });

  it("varies the actual green roughness channel while retaining a matte nonmetal substrate", () => {
    const surfaces = createUrbanSurfaceTextures();
    for (const kind of ["asphalt", "concrete"] as const) {
      const data = pixels(surfaces[kind].roughnessMap);
      const values = Array.from({ length: data.length / 4 }, (_, i) => data[i * 4 + 1]);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(kind === "asphalt" ? 205 : 235);
      expect(Math.max(...values)).toBeLessThanOrEqual(255);
      expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(8);
      expect(surfaces[kind].roughnessMap.colorSpace).toBe(NoColorSpace);
    }
    disposeUrbanSurfaceTextures(surfaces);
  });

  it("uses repeatable world-scale samples with mipmaps and filtered oblique views", () => {
    const surfaces = createUrbanSurfaceTextures();
    for (const surface of Object.values(surfaces)) {
      expect(surface.map.colorSpace).toBe(SRGBColorSpace);
      expect(surface.map.repeat.toArray()).toEqual(surface.roughnessMap.repeat.toArray());
      for (const texture of [surface.map, surface.roughnessMap]) {
        expect(texture.wrapS).toBe(RepeatWrapping);
        expect(texture.wrapT).toBe(RepeatWrapping);
        expect(texture.magFilter).toBe(LinearFilter);
        expect(texture.minFilter).toBe(LinearMipmapLinearFilter);
        expect(texture.generateMipmaps).toBe(true);
        expect(texture.anisotropy).toBeGreaterThanOrEqual(2);
        expect(texture.version).toBeGreaterThan(0);
      }
    }
    disposeUrbanSurfaceTextures(surfaces);
  });

  it("marks the same texture objects for context reupload and releases every owned texture", () => {
    const surfaces = createUrbanSurfaceTextures();
    const all = textures(surfaces);
    const versions = all.map(texture => texture.version);
    const disposed = all.map(texture => vi.spyOn(texture, "dispose"));
    refreshUrbanSurfaceTextures(surfaces);
    expect(textures(surfaces)).toEqual(all);
    all.forEach((texture, index) => expect(texture.version).toBe(versions[index] + 1));
    disposeUrbanSurfaceTextures(surfaces);
    disposed.forEach(dispose => expect(dispose).toHaveBeenCalledTimes(1));
  });
});
