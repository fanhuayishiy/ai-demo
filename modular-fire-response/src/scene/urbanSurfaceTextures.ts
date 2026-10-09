import { DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, SRGBColorSpace } from "three";

export type UrbanSurface = "asphalt" | "concrete";
export type UrbanSurfaceTextures = Record<UrbanSurface, { map: DataTexture; roughnessMap: DataTexture }>;

const SIZE = 128;

function grain(x: number, y: number, seed: number) {
  let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function patches(x: number, y: number, seed: number) {
  const px = x / 16, py = y / 16;
  const ix = Math.floor(px), iy = Math.floor(py);
  const fx = px - ix, fy = py - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const top = grain(ix % 8, iy % 8, seed) * (1 - u) + grain((ix + 1) % 8, iy % 8, seed) * u;
  const bottom = grain(ix % 8, (iy + 1) % 8, seed) * (1 - u) + grain((ix + 1) % 8, (iy + 1) % 8, seed) * u;
  return top * (1 - v) + bottom * v;
}

function texture(data: Uint8Array, kind: UrbanSurface, color: boolean) {
  const result = new DataTexture(data, SIZE, SIZE);
  result.name = `urban-${kind}-${color ? "color" : "roughness"}`;
  result.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  result.wrapS = result.wrapT = RepeatWrapping;
  result.magFilter = LinearFilter;
  result.minFilter = LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.anisotropy = 4;
  const repeat = kind === "asphalt" ? .32 : .5;
  result.repeat.set(repeat, repeat);
  result.needsUpdate = true;
  return result;
}

function surface(kind: UrbanSurface) {
  const color = new Uint8Array(SIZE * SIZE * 4);
  const roughness = new Uint8Array(SIZE * SIZE * 4);
  const asphalt = kind === "asphalt";
  const seed = asphalt ? 0x4b612d : 0x9e3779;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const fine = grain(x, y, seed) - .5;
    const broad = patches(x, y, seed ^ 0x45d9f3b) - .5;
    const shade = Math.round((asphalt ? 244 : 248) + fine * (asphalt ? 10 : 8) + broad * (asphalt ? 8 : 6));
    const grit = Math.round((asphalt ? 225 : 248) + fine * (asphalt ? 16 : 8) + broad * (asphalt ? 24 : 6));
    const index = (y * SIZE + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      color[index + channel] = shade;
      roughness[index + channel] = grit;
    }
    color[index + 3] = roughness[index + 3] = 255;
  }
  return { map: texture(color, kind, true), roughnessMap: texture(roughness, kind, false) };
}

export function createUrbanSurfaceTextures(): UrbanSurfaceTextures {
  return { asphalt: surface("asphalt"), concrete: surface("concrete") };
}

export function refreshUrbanSurfaceTextures(surfaces: UrbanSurfaceTextures) {
  for (const { map, roughnessMap } of Object.values(surfaces)) {
    map.needsUpdate = true;
    roughnessMap.needsUpdate = true;
  }
}

export function disposeUrbanSurfaceTextures(surfaces: UrbanSurfaceTextures) {
  for (const { map, roughnessMap } of Object.values(surfaces)) {
    map.dispose();
    roughnessMap.dispose();
  }
}
