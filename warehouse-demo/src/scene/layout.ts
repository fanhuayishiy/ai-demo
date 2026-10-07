import type { Vec3 } from '../types';

export const CAMERA_POSITION: Vec3 = [26, 31, 46];
export const CAMERA_TARGET: Vec3 = [-2, 0, 1];
export function getCameraLayout(width: number, height: number) {
  const desktop = width > 900;
  return { zoom: Math.min(width / (desktop ? 48 : 54), height / (desktop ? 31 : 36)), offsetX: desktop ? -135 : 0, offsetY: desktop ? 65 : 0 };
}

export const containerPosition: Vec3 = [-19, 0, 9];
// Static props are outside the swept forklift/load corridor, not just its centreline.
export const stagingPallets: { at: Vec3; layers: 1 | 2; blue?: boolean; yaw: number }[] = [
  { at: [-15, 0, 11.6], layers: 1, yaw: .07 },
  { at: [-12.8, 0, 10.1], layers: 2, yaw: -.06 },
  { at: [-12.5, 0, 12.3], layers: 1, yaw: .03 },
  { at: [-5.5, 0, 11.9], layers: 2, yaw: -.04 },
  { at: [-3.3, 0, 12.1], layers: 1, yaw: .09 },
  { at: [10.3, 0, -10.9], layers: 2, blue: true, yaw: 0 },
  { at: [12.5, 0, -10.9], layers: 1, blue: true, yaw: .03 },
];
