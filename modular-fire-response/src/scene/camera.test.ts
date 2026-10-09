import { OrthographicCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../types";
import { OVERVIEW_OFFSET, overviewFrame, safeCameraTarget, sceneViewport } from "./camera";

describe("shared scene viewport", () => {
  it.each([
    [390, 844, 16, 244, 374, 626],
    [800, 844, 16, 244, 784, 626],
    [801, 900, 20, 222, 509, 700],
    [1050, 900, 20, 222, 758, 700],
    [1051, 900, 20, 170, 731, 700],
    [1304, 1012, 20, 170, 984, 812],
    [1550, 1080, 20, 170, 1210, 880],
  ])("reserves the correct UI area at %i x %i", (width, height, left, top, right, bottom) => {
    expect(sceneViewport(width, height)).toEqual({ left, top, right, bottom, width: right - left,
      height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 });
  });

  it("remains finite in a temporarily collapsed host", () => {
    const viewport = sceneViewport(0, 0);
    expect(viewport.width).toBeGreaterThan(0);
    expect(viewport.height).toBeGreaterThan(0);
    const frame = overviewFrame(0, 0);
    expect(frame.zoom).toBeGreaterThan(0);
    frame.target.forEach(value => expect(Number.isFinite(value)).toBe(true));
  });
});

describe("orthographic composition", () => {
  function camera(width: number, height: number, zoom: number, target: Vec3, offset: Vec3) {
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 600);
    camera.zoom = zoom;
    camera.position.set(...target).add(new Vector3(...offset));
    camera.lookAt(new Vector3(...target));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    return camera;
  }

  it.each<Vec3>([OVERVIEW_OFFSET, [-80, 70, 110], [60, 130, -95], [140, 30, 35]])("fits the entire slab after an arbitrary permitted orbit (%j)", (x, y, z) => {
    const offset: Vec3 = [x, y, z];
    const frame = overviewFrame(1304, 1012, offset);
    const view = sceneViewport(1304, 1012);
    const lens = camera(1304, 1012, frame.zoom, frame.target, offset);
    for (const x of [-81, 73]) for (const y of [-2.1, .2]) for (const z of [-60, 58]) {
      const p = new Vector3(x, y, z).project(lens);
      expect((p.x + 1) * 652).toBeGreaterThanOrEqual(view.left + 7.99);
      expect((p.x + 1) * 652).toBeLessThanOrEqual(view.right - 7.99);
      expect((1 - p.y) * 506).toBeGreaterThanOrEqual(view.top + 7.99);
      expect((1 - p.y) * 506).toBeLessThanOrEqual(view.bottom - 7.99);
    }
  });

  it("places an elevated aircraft at the usable center for a noncanonical angle", () => {
    const anchor: Vec3 = [5, 26, 14], offset: Vec3 = [-80, 70, 110];
    const target = safeCameraTarget(anchor, 390, 844, 4, offset);
    const p = new Vector3(...anchor).project(camera(390, 844, 4, target, offset));
    expect((p.x + 1) * 195).toBeCloseTo(195, 5);
    expect((1 - p.y) * 422).toBeCloseTo(435, 5);
  });
});
