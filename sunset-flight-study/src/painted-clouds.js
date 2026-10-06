import * as THREE from "three";

// The cached source pixels are immutable to callers; each GPU texture gets its own copy.
const pixelCache = new Map();
const silhouettes = [
  [[-0.06, -0.10, 1.36, 0.39], [-1.02, -0.03, 0.52, 0.37], [-0.57, 0.23, 0.55, 0.55],
    [-0.27, 0.55, 0.48, 0.57], [0.49, 0.19, 0.59, 0.43], [1.04, -0.02, 0.49, 0.35],
    [1.43, -0.19, 0.27, 0.18], [-1.49, -0.22, 0.24, 0.15]],
  [[0.03, -0.11, 1.36, 0.39], [-1.08, -0.12, 0.49, 0.31], [-0.60, 0.29, 0.58, 0.64],
    [-0.40, 0.63, 0.36, 0.41], [0.08, 0.16, 0.58, 0.45], [0.75, 0.15, 0.56, 0.45],
    [1.27, -0.11, 0.40, 0.26], [-1.48, -0.25, 0.23, 0.12]],
  [[-0.03, -0.10, 1.34, 0.38], [-1.10, -0.08, 0.46, 0.32], [-0.58, 0.19, 0.56, 0.49],
    [0.12, 0.21, 0.60, 0.46], [0.61, 0.51, 0.44, 0.57], [1.04, 0.10, 0.46, 0.41],
    [1.46, -0.20, 0.23, 0.17], [-1.47, -0.23, 0.24, 0.14]],
];
const edgeLobes = [
  [[-1.20, 0.18, 0.23, 0.19], [-0.91, 0.49, 0.24, 0.23], [-0.56, 0.87, 0.21, 0.20],
    [-0.28, 1.02, 0.20, 0.16], [0.38, 0.55, 0.28, 0.18], [1.13, 0.22, 0.22, 0.17]],
  [[-1.23, 0.14, 0.22, 0.18], [-0.95, 0.58, 0.23, 0.22], [-0.67, 0.91, 0.20, 0.17],
    [-0.37, 1.00, 0.21, 0.16], [0.26, 0.48, 0.25, 0.18], [0.74, 0.54, 0.25, 0.19]],
  [[-1.21, 0.17, 0.22, 0.18], [-0.78, 0.60, 0.22, 0.19], [-0.01, 0.63, 0.23, 0.17],
    [0.40, 0.93, 0.22, 0.19], [0.69, 1.01, 0.21, 0.17], [1.29, 0.27, 0.20, 0.17]],
];

function smoothstep(low, high, value) {
  const amount = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return amount * amount * (3 - 2 * amount);
}

function hash(x, y, seed) {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed + 1, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smoothstep(0, 1, x - ix), fy = smoothstep(0, 1, y - iy);
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function paintPixels(width, height, variant) {
  const pixels = new Uint8Array(width * height * 4);
  const lobes = [...silhouettes[variant], ...edgeLobes[variant]];
  const antialias = 3.9 / width * 0.95;
  const cream = [244, 240, 220];
  const middle = [224, 232, 221];
  const shade = [194, 210, 211];
  for (let y = 0; y < height; y += 1) {
    const py = y / (height - 1) * 1.95 - 0.68;
    for (let x = 0; x < width; x += 1) {
      const px = x / (width - 1) * 3.9 - 1.95;
      let signedDistance = Infinity;
      for (const [cx, cy, rx, ry] of lobes) {
        const dx = (px - cx) / rx, dy = (py - cy) / ry;
        signedDistance = Math.min(signedDistance, (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(rx, ry));
      }
      const contourBrush = (noise(px * 5, py * 6, variant + 11) - 0.5) * 0.028
        + (noise(px * 12, py * 13, variant + 17) - 0.5) * 0.004;
      signedDistance += contourBrush;
      const scallopedBase = -0.415 + Math.sin(px * 8 + variant) * 0.025 + Math.cos(px * 15) * 0.006;
      signedDistance = Math.max(signedDistance, scallopedBase - py);
      const offset = (y * width + x) * 4;
      const alpha = 1 - smoothstep(-antialias, antialias, signedDistance);
      // RGB extends through transparent texels, preventing a dark outline after filtering.
      if (alpha === 0) {
        pixels.set(cream, offset);
        continue;
      }
      const pigment = noise(px * 11, py * 13, variant) * 0.60 + noise(px * 38, py * 39, variant + 4) * 0.28 + hash(x, y, variant) * 0.12;
      // One bottom-connected paint mass rises between warm overlapping lobes.
      // A height contour, rather than separate disks, cannot form polka-dot holes.
      const shift = (variant - 1) * 0.06;
      const leftRise = 0.24 * Math.exp(-Math.pow((px + 0.88 + shift) / 0.45, 2));
      const mainRise = 0.36 * Math.exp(-Math.pow((px - 0.43 + shift) / 0.54, 2));
      const rightRise = 0.13 * Math.exp(-Math.pow((px - 1.24) / 0.38, 2));
      const warmOverlap = 0.11 * Math.exp(-Math.pow((px + 0.24) / 0.29, 2))
        + 0.12 * Math.exp(-Math.pow((px - 0.98) / 0.28, 2));
      const paintEdge = (noise(px * 5, py * 6, variant + 7) - 0.5) * 0.018;
      const shadowContour = -0.22 + leftRise + mainRise + rightRise - warmOverlap + paintEdge;
      const broadShadow = 1 - smoothstep(shadowContour - 0.025, shadowContour + 0.11, py);
      const underside = (1 - smoothstep(shadowContour - 0.055, shadowContour + 0.065, py)) * 0.82;
      const softLight = smoothstep(0.05, 0.7, py) * (1 - smoothstep(-0.8, 0.85, px)) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const body = cream[channel] + (middle[channel] - cream[channel]) * broadShadow;
        const shaded = body + (shade[channel] - body) * underside;
        pixels[offset + channel] = Math.round(Math.max(0, Math.min(255, shaded + (pigment - 0.5) * 7 + softLight)));
      }
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  // Edge pigment can leave isolated one-pixel flecks at small resolutions. Keep the body coherent.
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const seed = Math.floor(height * 0.45) * width + Math.floor(width * 0.5);
  let head = 0, tail = 1;
  queue[0] = seed;
  visited[seed] = 1;
  while (head < tail) {
    const index = queue[head++];
    for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
      if (neighbor < 0 || neighbor >= visited.length || visited[neighbor] || pixels[neighbor * 4 + 3] <= 127) continue;
      visited[neighbor] = 1;
      queue[tail++] = neighbor;
    }
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (!visited[index] && pixels[index * 4 + 3] > 127) pixels[index * 4 + 3] = 0;
  }
  return pixels;
}

/** Pure-JS gouache-style cloud art; texture rows run bottom-to-top for WebGL UVs. */
export function createPaintedCloudTexture({ width = 512, height = 256, variant = 0 } = {}) {
  for (const dimension of [width, height]) {
    if (!Number.isInteger(dimension) || dimension < 32 || dimension > 1024) {
      throw new RangeError("Cloud texture dimensions must be integers between 32 and 1024.");
    }
  }
  const shape = Number.isFinite(variant) ? ((Math.floor(variant) % silhouettes.length) + silhouettes.length) % silhouettes.length : 0;
  const key = `${width}:${height}:${shape}`;
  if (!pixelCache.has(key)) {
    if (pixelCache.size >= 6) pixelCache.delete(pixelCache.keys().next().value);
    pixelCache.set(key, paintPixels(width, height, shape));
  }
  const texture = new THREE.DataTexture(new Uint8Array(pixelCache.get(key)), width, height, THREE.RGBAFormat);
  texture.name = `painted-cumulus-${shape}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
