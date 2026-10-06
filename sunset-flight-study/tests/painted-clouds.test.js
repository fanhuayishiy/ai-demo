import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

const cloudModule = await import("../src/painted-clouds.js").catch(() => ({}));

function create(options) {
  assert.equal(typeof cloudModule.createPaintedCloudTexture, "function");
  return cloudModule.createPaintedCloudTexture(options);
}

test("painted cloud generator creates bounded deterministic sRGB RGBA pixels without a DOM", () => {
  const first = create({ width: 256, height: 128, variant: 1 });
  const second = create({ width: 256, height: 128, variant: 1 });
  assert.ok(first.isDataTexture);
  assert.equal(first.colorSpace, THREE.SRGBColorSpace);
  assert.equal(first.image.data.length, 256 * 128 * 4);
  assert.deepEqual(first.image.data, second.image.data);
  assert.notEqual(first, second, "worlds need independently disposable texture resources");
  first.dispose();
  second.dispose();
});

test("cloud silhouette has transparent borders, a substantial solid body and antialiased edges", () => {
  const texture = create({ width: 256, height: 128 });
  const { data, width, height } = texture.image;
  let solid = 0;
  let edge = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) assert.equal(alpha, 0);
      if (alpha === 255) solid += 1;
      if (alpha > 0 && alpha < 255) edge += 1;
    }
  }
  assert.ok(solid > width * height * 0.22 && solid < width * height * 0.75);
  assert.ok(edge > 100, "silhouette should have a feathered pixel edge");
  texture.dispose();
});

test("cloud silhouette is coherent and asymmetric, with varied painted alternatives", () => {
  const a = create({ width: 256, height: 128, variant: 0 });
  const b = create({ width: 256, height: 128, variant: 2 });
  const { width, height, data } = a.image;
  let asymmetric = 0;
  let different = 0;
  const opaque = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const alpha = data[index * 4 + 3] > 127;
      if (alpha !== (data[(y * width + width - 1 - x) * 4 + 3] > 127)) asymmetric += 1;
      if (alpha !== (b.image.data[index * 4 + 3] > 127)) different += 1;
      if (alpha) opaque.push(index);
    }
  }
  assert.ok(asymmetric > width * height * 0.035);
  assert.ok(different > width * height * 0.04);
  const remaining = new Set(opaque);
  const stack = [opaque[0]];
  remaining.delete(opaque[0]);
  while (stack.length) {
    const index = stack.pop();
    for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
      if (remaining.delete(neighbor)) stack.push(neighbor);
    }
  }
  assert.equal(remaining.size, 0, "cloud should be one connected painted silhouette");
  a.dispose();
  b.dispose();
});

test("cloud paint has one broad cool underside and a warm illuminated upper body", () => {
  const texture = create({ width: 256, height: 128 });
  const { width, height, data } = texture.image;
  const lower = [], upper = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] < 250) continue;
      if (y < height * 0.30) lower.push(data[offset]);
      if (y > height * 0.55) upper.push(data[offset]);
    }
  }
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(lower.length > 100 && upper.length > 100);
  assert.ok(mean(upper) - mean(lower) > 25, "shading should read across the full silhouette");
  texture.dispose();
});

test("cloud generator rejects invalid or unbounded texture allocations", () => {
  assert.equal(typeof cloudModule.createPaintedCloudTexture, "function");
  for (const width of [0, -1, 16.5, Infinity, 8192]) {
    assert.throws(() => cloudModule.createPaintedCloudTexture({ width }), RangeError);
  }
});

test("cloud shadows form one pale connected underside with uneven rises", () => {
  const texture = create({ width: 256, height: 128 });
  const { width, height, data } = texture.image;
  const remaining = new Set();
  const shadowTop = Array(width).fill(-1);
  let darkestRed = 255;
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] < 250) continue;
    darkestRed = Math.min(darkestRed, data[offset]);
    if (data[offset] < 223 && data[offset + 2] >= data[offset]) {
      remaining.add(index);
      shadowTop[index % width] = Math.floor(index / width);
    }
  }
  const total = remaining.size;
  let largest = 0;
  while (remaining.size) {
    const seed = remaining.values().next().value;
    const stack = [seed];
    remaining.delete(seed);
    let size = 0;
    while (stack.length) {
      const index = stack.pop();
      size += 1;
      for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
        if (remaining.delete(neighbor)) stack.push(neighbor);
      }
    }
    largest = Math.max(largest, size);
  }
  assert.ok(total > width * height * 0.08);
  assert.ok(largest / total > 0.95, "underside must not split into isolated circular spots");
  const riseHeights = shadowTop.slice(Math.floor(width * 0.25), Math.floor(width * 0.75)).filter(value => value >= 0);
  assert.ok(Math.max(...riseHeights) - Math.min(...riseHeights) > height * 0.08, "connected shade should rise into the cloud, not form a straight stripe");
  assert.ok(darkestRed >= 195, "shadow paint should stay pale and low-contrast");
  texture.dispose();
});

test("cloud highlights are warm ivory rather than saturated yellow", () => {
  const texture = create({ width: 256, height: 128 });
  const { width, height, data } = texture.image;
  let colorDifference = 0, count = 0;
  for (let y = Math.round(height * 0.6); y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] < 250) continue;
      colorDifference += data[offset] - data[offset + 2];
      count += 1;
    }
  }
  assert.ok(count > 100);
  assert.ok(colorDifference / count <= 30);
  texture.dispose();
});

test("cloud skyline retains broad towers without excessive high-frequency jaggedness", () => {
  const texture = create({ width: 512, height: 256 });
  const { width, height, data } = texture.image;
  const skyline = Array.from({ length: width }, (_, x) => {
    let top = -1;
    for (let y = 0; y < height; y += 1) if (data[(y * width + x) * 4 + 3] > 127) top = y;
    return top;
  });
  let roughness = 0, samples = 0;
  for (let x = 3; x < width - 3; x += 1) {
    if (skyline[x - 1] < 0 || skyline[x] < 0 || skyline[x + 1] < 0) continue;
    roughness += Math.abs(skyline[x - 1] - 2 * skyline[x] + skyline[x + 1]);
    samples += 1;
  }
  assert.ok(roughness / samples < 0.90, "small edge noise should not create tree-like spikes");
  const body = skyline.filter(value => value >= 0);
  assert.ok(Math.max(...body) - Math.min(...body) > height * 0.40, "rounded cloud towers should remain visible");
  texture.dispose();
});
