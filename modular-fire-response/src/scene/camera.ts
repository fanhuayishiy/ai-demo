import { Vector3 } from "three";
import type { Vec3 } from "../types";

export const OVERVIEW_OFFSET: Vec3 = [90, 100, 120];
export const OVERVIEW_ANCHOR: Vec3 = [-4, -.95, -1];

export interface SceneViewport {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function sceneViewport(width: number, height: number): SceneViewport {
  const mobile = width <= 800;
  const sidebar = width >= 1550 ? 320 : width > 1050 ? 300 : 272;
  const left = mobile ? 16 : 20;
  const top = mobile ? 244 : width <= 1050 ? 222 : 170;
  const right = Math.max(left + 1, width - (mobile ? 16 : sidebar + 20));
  const bottom = Math.max(top + 1, height - (mobile ? 218 : 200));
  return { left, top, right, bottom, width: right - left, height: bottom - top,
    centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
}

function cameraBasis(offset: Vec3) {
  const back = new Vector3(...offset).normalize();
  const right = new Vector3(back.z, 0, -back.x).normalize();
  return { right, up: new Vector3().crossVectors(back, right) };
}

export function safeCameraTarget(anchor: Vec3, width: number, height: number, zoom: number, offset: Vec3 = OVERVIEW_OFFSET): Vec3 {
  const viewport = sceneViewport(width, height);
  const { right, up } = cameraBasis(offset);
  return new Vector3(...anchor)
    .addScaledVector(right, (width / 2 - viewport.centerX) / zoom)
    .addScaledVector(up, (viewport.centerY - height / 2) / zoom)
    .toArray();
}

export function overviewFrame(width: number, height: number, offset: Vec3 = OVERVIEW_OFFSET) {
  const viewport = sceneViewport(width, height);
  const { right, up } = cameraBasis(offset);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  // Fit the actual lower slab envelope, including its thickness, in camera space.
  for (const x of [-81, 73]) for (const y of [-2.1, .2]) for (const z of [-60, 58]) {
    const corner = new Vector3(x, y, z);
    minX = Math.min(minX, corner.dot(right)); maxX = Math.max(maxX, corner.dot(right));
    minY = Math.min(minY, corner.dot(up)); maxY = Math.max(maxY, corner.dot(up));
  }
  const zoom = Math.min(Math.max(1, viewport.width - 16) / (maxX - minX), Math.max(1, viewport.height - 16) / (maxY - minY), 7);
  return { zoom, target: safeCameraTarget(OVERVIEW_ANCHOR, width, height, zoom, offset) };
}
