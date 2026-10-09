import { memo, useMemo } from "react";
import { Vector3, Quaternion } from "three";
import type { Vec3 } from "../types";
import { createHoseCurve } from "./helpers";
import { SURFACE_Y } from "../spatial/layout";
import { UrbanSurfaceMaterial, type UrbanSurface } from "./UrbanSurfaceMaterial";
export const C = {
  red: "#d63d42",
  white: "#edf2f3",
  dark: "#30383d",
  glass: "#304a58",
  metal: "#bbc7cd",
  tire: "#252a2d",
  blue: "#42b8d0",
  yellow: "#e8bf65",
};
export function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = C.white,
  rotation = [0, 0, 0],
  emissive = "#000000",
  emissiveIntensity = 0,
  roughness = color === C.metal ? .4 : color === C.red ? .36 : color === C.glass ? .2 : .65,
  metalness = color === C.metal ? .45 : color === C.red ? .18 : color === C.glass ? .24 : .04,
  surface,
}: {
  p?: Vec3;
  s?: Vec3;
  color?: string;
  rotation?: Vec3;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  surface?: UrbanSurface;
}) {
  return (
    <mesh position={p} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={s} />
      {surface ? <UrbanSurfaceMaterial
        surface={surface}
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      /> : <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />}
    </mesh>
  );
}
export function Cylinder({
  p = [0, 0, 0],
  r = 0.4,
  h = 1,
  color = C.metal,
  rotation = [0, 0, 0],
  emissive = "#000000",
  emissiveIntensity = 0,
  roughness = color === C.tire ? .95 : .46,
  metalness = color === C.tire ? 0 : color === C.metal ? .5 : .16,
}: {
  p?: Vec3;
  r?: number;
  h?: number;
  color?: string;
  rotation?: Vec3;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={p} rotation={rotation} castShadow>
      <cylinderGeometry args={[r, r, h, 12]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}
export const Tube = memo(function Tube({
  points,
  color = C.blue,
  r = 0.12,
  emissive = "#000000",
  emissiveIntensity = 0,
}: {
  points: Vec3[];
  color?: string;
  r?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const curve = useMemo(
    () => createHoseCurve(points, SURFACE_Y, r),
    [points, r],
  );
  return (
    <mesh castShadow>
      <tubeGeometry
        args={[curve, Math.max(36, points.length * 12), r, 8, false]}
      />
      <meshStandardMaterial
        color={color}
        roughness={0.6}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
});
export function Beam({
  from,
  to,
  width = 0.12,
  color = C.metal,
}: {
  from: Vec3;
  to: Vec3;
  width?: number;
  color?: string;
}) {
  const a = new Vector3(...from),
    b = new Vector3(...to),
    direction = b.clone().sub(a);
  return (
    <mesh
      position={a.add(b).multiplyScalar(0.5)}
      quaternion={new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.clone().normalize(),
      )}
      castShadow
    >
      <boxGeometry args={[width, direction.length(), width]} />
      <meshStandardMaterial color={color} roughness={color === C.metal ? .44 : .65} metalness={color === C.metal ? .42 : .06} />
    </mesh>
  );
}
