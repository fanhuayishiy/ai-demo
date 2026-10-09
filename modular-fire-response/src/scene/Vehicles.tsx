import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { Box, Beam, C, Cylinder, Tube } from "./Primitives";
import { ApparatusCab, ApparatusModuleDetails, ApparatusWheel, RotorcraftSkin } from "./ApparatusDetails";
import { Tag } from "./City";
import {
  deploymentProgress,
  worldToVehicle,
  ROTOR_ARM,
  ROTOR_BLADE_HALF,
} from "./helpers";
import { FIRE_DOCK_X, FIRE_DOCK_Y, FIRE_FOLDED_SCALES } from "./aircraft";
import {
  VEHICLE_SCALE,
  LADDER_TARGET,
  BOOM_TARGET,
  STAGING,
} from "../spatial/layout";
import type { UnitState, Vec3 } from "../types";
export function Rotorcraft({
  size = 1,
  time,
  color = C.red,
}: {
  size?: number;
  time: number;
  color?: string;
}) {
  return (
    <group scale={size}>
      <Box p={[0, 0, 0]} s={[1.8, 0.65, 1.2]} color={color} roughness={.3} metalness={.18} />
      <Box p={[0.3, -0.4, 0]} s={[0.8, 0.4, 0.8]} color={C.dark} />
      <RotorcraftSkin />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          p={[side * 0.93, 0.05, -0.45]}
          s={[0.13, 0.12, 0.18]}
          color={side > 0 ? "#ff685d" : "#6af1c2"}
          emissive={side > 0 ? "#ff4c35" : "#39e7a3"}
          emissiveIntensity={2.2}
        />
      ))}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}-${z}`} position={[x * ROTOR_ARM, 0, z * ROTOR_ARM]}>
            <Beam
              from={[-x * ROTOR_ARM, 0, -z * ROTOR_ARM]}
              to={[0, 0, 0]}
              width={0.15}
              color={C.dark}
            />
            <Cylinder r={0.22} h={0.6} p={[0, 0.15, 0]} color={C.dark} />
            <group rotation={[0, time * 35, 0]}>
              <Box
                p={[0, 0.48, 0]}
                s={[ROTOR_BLADE_HALF * 2, 0.035, 0.15]}
                color="#728087"
              />
              <Box
                p={[0, 0.48, 0]}
                s={[0.15, 0.035, ROTOR_BLADE_HALF * 2]}
                color="#728087"
              />
            </group>
          </group>
        )),
      )}
      {[-0.7, 0.7].map((z) => (
        <group key={z}>
          <Beam from={[-0.6, -0.2, z]} to={[-0.8, -1, z]} width={0.1} />
          <Beam from={[0.6, -0.2, z]} to={[0.8, -1, z]} width={0.1} />
          <Box p={[0, -1, z]} s={[2, 0.12, 0.12]} color={C.dark} />
        </group>
      ))}
    </group>
  );
}
export function FireAircraft({ time, index }: { time: number; index: number }) {
  const hook: Vec3 = index === 2 ? [0, -1.75, 0] : [-4, -1.3, 0];
  return (
    <group>
      <Rotorcraft time={time} color={index === 2 ? C.red : C.white} />
      {index === 2 ? (
        <group name="fire-nozzle">
          <Beam
            from={[0, -0.4, 0]}
            to={[0, -1.25, 0]}
            width={0.16}
            color={C.blue}
          />
          <Cylinder
            p={[0, -1.25, -0.9]}
            r={0.12}
            h={1.6}
            rotation={[Math.PI / 2, 0, 0]}
            color={C.dark}
          />
          <Cylinder
            p={[0, -1.25, -1.68]}
            r={0.15}
            h={0.12}
            rotation={[Math.PI / 2, 0, 0]}
            color={C.metal}
          />
        </group>
      ) : (
        <group name="hose-support-bridle">
          {[-0.5, 0.5].map((z) => (
            <Beam
              key={z}
              from={[0, -0.48, z]}
              to={hook}
              width={0.075}
              color={C.metal}
            />
          ))}
        </group>
      )}
      <group name="fire-hose-hook">
        <Beam from={[0, -0.65, 0]} to={hook} width={0.1} color={C.blue} />
        <Cylinder
          p={hook}
          r={0.18}
          h={0.22}
          color={C.blue}
          emissive="#36a4b7"
          emissiveIntensity={0.25}
        />
      </group>
    </group>
  );
}
export function HeavyCargoAircraft({ time }: { time: number }) {
  return (
    <group>
      <Box p={[0, 0, 0]} s={[3.1, 0.9, 1.65]} color={C.white} />
      <Box p={[0, 0.54, 0]} s={[2.5, 0.22, 1.4]} color="#344047" />
      <Box
        p={[0.15, -0.25, -0.89]}
        s={[0.8, 0.3, 0.15]}
        color="#d5f3ee"
        emissive="#8edbe2"
        emissiveIntensity={1.2}
      />
      {[-2.7, 0, 2.7].map((x) =>
        [-2, 2].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <Beam
              from={[-x, 0, -z]}
              to={[0, 0, 0]}
              width={0.2}
              color="#394448"
            />
            <Cylinder p={[0, 0, 0]} r={0.22} h={1.2} color="#dfe6e3" />
            {[-1, 1].map((level) => (
              <group
                name={`cargo-rotor-${x}-${z}-${level}`}
                key={level}
                position={[0, level * 0.65, 0]}
                rotation={[0, time * 29 * level, 0]}
              >
                <Box s={[2, 0.045, 0.13]} color="#c7d0cf" />
                <Box s={[0.13, 0.045, 2]} color="#c7d0cf" />
              </group>
            ))}
            <Cylinder
              p={[0, 0.74, 0]}
              r={0.1}
              h={0.08}
              color={z < 0 ? "#f6d65f" : "#ef6d66"}
              emissive={z < 0 ? "#ffdc5a" : "#ff574f"}
              emissiveIntensity={2}
            />
          </group>
        )),
      )}
      {[-1, 1].map((x) => (
        <group key={x}>
          {[-1, 1].map((z) => (
            <Beam
              key={z}
              from={[x * 1.3, -0.25, z * 0.6]}
              to={[x * 1.9, -1.5, z * 1.15]}
              width={0.13}
              color="#414e52"
            />
          ))}
          <Box p={[x * 1.9, -1.5, 0]} s={[0.14, 0.12, 3]} color="#414e52" />
        </group>
      ))}
      <group name="cargo-main-winch">
        <Cylinder p={[0, -0.55, 0]} r={0.24} h={0.4} color={C.yellow} />
      </group>
      <group name="cargo-rescue-winch">
        <Cylinder p={[-1.15, -0.55, 0]} r={0.17} h={0.4} color={C.red} />
      </group>
    </group>
  );
}
export function BoosterModule({ label = true }: { label?: boolean } = {}) {
  return (
    <group>
      <Box p={[-1, 1.9, 0]} s={[4.3, 1.3, 2.65]} color={C.red} roughness={.3} metalness={.18} />
      <Box p={[-1, 2.55, 0]} s={[4.2, 0.16, 2.6]} color={C.white} roughness={.3} metalness={.16} />
      {[-0.6, 0.6].map((z) => (
        <group key={z}>
          <Cylinder
            p={[-1, 2.95, z]}
            r={0.43}
            h={2.6}
            rotation={[0, 0, Math.PI / 2]}
            color="#c9d4d2"
          />
          <Cylinder
            p={[-2.35, 2.95, z]}
            r={0.3}
            h={0.35}
            rotation={[0, 0, Math.PI / 2]}
            color={C.blue}
          />
        </group>
      ))}
      <Box p={[-1.2, 2, 1.355]} s={[2.5, 0.86, 0.08]} color="#263b3d" />
      {[-1.9, -0.95].map((x) => (
        <group key={x}>
          <Cylinder
            p={[x, 2.14, 1.43]}
            r={0.2}
            h={0.04}
            rotation={[Math.PI / 2, 0, 0]}
            color="#d2eddc"
            emissive="#67cda7"
            emissiveIntensity={0.55}
          />
          <Box
            p={[x + 0.025, 2.17, 1.46]}
            s={[0.03, 0.18, 0.03]}
            rotation={[0, 0, -0.6]}
            color="#374c46"
          />
        </group>
      ))}
      <group name="booster-inlet">
        <Cylinder
          p={[-0.8, 1.8, -1.5]}
          r={0.22}
          h={0.35}
          rotation={[Math.PI / 2, 0, 0]}
          color={C.blue}
        />
      </group>
      <group name="booster-outlet">
        <Cylinder
          p={[0.3, 1.8, 1.5]}
          r={0.22}
          h={0.35}
          rotation={[Math.PI / 2, 0, 0]}
          color={C.blue}
        />
      </group>
      <Box
        p={[-1, 3.48, 0]}
        s={[3.6, 0.12, 0.1]}
        color="#bef3e0"
        emissive="#6ff0c5"
        emissiveIntensity={1.5}
      />
      {label && (
        <Tag p={[-1, 4.8, 0]} tone="water">
          M01 移动增压泵车
        </Tag>
      )}
    </group>
  );
}
export function FireAirport({ deployed = false }: { deployed?: boolean } = {}) {
  return (
    <group>
      <Box p={[-1.2, 1.8, 0]} s={[4.9, 1, 2.8]} color={C.white} roughness={.3} metalness={.16} />
      <Box p={[-1.2, 2.5, 0]} s={[4.9, 0.3, 2.6]} color="#3a494c" />
      {FIRE_DOCK_X.map((x, index) => {
        const folded = FIRE_FOLDED_SCALES[index];
        const cradleTop = FIRE_DOCK_Y - 1.06 * folded;
        return (
          <group key={x} name={`fire-launch-pad-${index}`}>
            <Cylinder p={[x, 2.68, 0]} r={0.64} h={0.05} color="#e2ece5" />
            <Box p={[x, 2.715, 0]} s={[0.6, 0.016, 0.1]} color="#39846e" />
            <Box p={[x, 2.715, 0]} s={[0.1, 0.016, 0.55]} color="#39846e" />
            {[-1, 1].map((side) => (
              <group key={side} name={`fire-dock-cradle-${index}-${side}`}>
                {[-1, 1].map((end) => (
                  <Box
                    key={end}
                    p={[
                      x + end * 0.8 * folded,
                      (2.705 + cradleTop) / 2,
                      side * 0.7 * folded,
                    ]}
                    s={[0.07, cradleTop - 2.705, 0.07]}
                    color="#aebeba"
                  />
                ))}
              </group>
            ))}
            {[-1, 1].map((side) => (
              <Box
                key={side}
                p={[x, 2.72, side * 1.19]}
                s={[0.54, 0.06, 0.07]}
                color="#a2f2d6"
                emissive="#4be8b8"
                emissiveIntensity={1.8}
              />
            ))}
          </group>
        );
      })}
      <group name="fire-carrier-reel">
        <Cylinder
          p={[-3.25, 2.15, -1.2]}
          r={0.55}
          h={0.7}
          rotation={[Math.PI / 2, 0, 0]}
          color={C.blue}
        />
        {[-1.6, -0.8].map((z) => (
          <Cylinder
            key={z}
            p={[-3.25, 2.15, z]}
            r={0.65}
            h={0.08}
            rotation={[Math.PI / 2, 0, 0]}
            color={C.metal}
          />
        ))}
        {deployed && (
          <Tube
            points={[
              [-3.25, 2.7, -1.55],
              [-3.25, 2.7, -1.75],
            ]}
            r={0.15}
            color={C.blue}
          />
        )}
      </group>
      <group name="fire-carrier-inlet">
        <Cylinder
          p={[-4.04, 1.7, 0]}
          r={0.18}
          h={0.32}
          rotation={[0, 0, Math.PI / 2]}
          color={C.blue}
        />
        {deployed && (
          <Tube
            points={[
              [-4.2, 1.7, 0],
              [-4.2, 1.7, -1.8],
              [-3.25, 1.7, -1.8],
              [-3.25, 2.7, -1.75],
            ]}
            r={0.12}
            color={C.blue}
          />
        )}
      </group>
    </group>
  );
}
export function CargoLaunchFrame() {
  return (
    <group name="cargo-launch-frame">
      <Box p={[-1.1, 1.65, 0]} s={[4.8, 0.55, 2.8]} color="#394448" />
      {[-2.7, 0.5].map((x) =>
        [-1, 1].map((z) => (
          <Box
            key={`${x}-${z}`}
            p={[x, 2.88, z]}
            s={[0.14, 1.91, 0.14]}
            color="#dfe8e4"
          />
        )),
      )}
      {[-1, 1].map((z) => (
        <Box
          key={z}
          p={[-1.1, 3.856, z]}
          s={[3.4, 0.14, 0.16]}
          color="#dfe8e4"
        />
      ))}
      {[-1.86, -0.34].map((x) => (
        <Box
          key={x}
          p={[x, 3.856, 0]}
          s={[0.18, 0.14, 2.15]}
          color={C.yellow}
        />
      ))}
      {[-1.3, 1.3].map((z) => (
        <Box
          key={z}
          p={[-1.1, 1.95, z]}
          s={[4.6, 0.07, 0.08]}
          color="#ffd260"
          emissive="#ffc640"
          emissiveIntensity={1.5}
        />
      ))}
    </group>
  );
}
export function Dog({
  p,
  time,
  offset = 0,
}: {
  p: Vec3;
  time: number;
  offset?: number;
}) {
  return (
    <group position={p}>
      <Box p={[0, 0.8, 0]} s={[1.2, 0.6, 0.55]} color="#d8e0df" />
      <Box p={[0.7, 1.1, 0]} s={[0.48, 0.5, 0.45]} color="#52676e" />
      <Box p={[0.95, 0.99, 0]} s={[0.35, 0.22, 0.3]} color="#45b6c5" />
      <Box p={[-0.05, 1.13, 0]} s={[0.65, 0.1, 0.67]} color={C.red} />
      <Beam
        from={[0, 0.75, 0.24]}
        to={[0, 0.75, 0.55]}
        width={0.12}
        color={C.blue}
      />
      <Cylinder
        p={[0, 0.75, 0.55]}
        r={0.13}
        h={0.22}
        rotation={[Math.PI / 2, 0, 0]}
        color={C.blue}
      />
      {[-0.4, 0.4].map((x) =>
        [-0.2, 0.2].map((z) => (
          <Box
            key={`${x}-${z}`}
            p={[x, 0.35, z]}
            s={[0.16, 0.7, 0.16]}
            rotation={[
              0,
              0,
              Math.sin(time * 5 + offset + x * 3 + z * 8) * 0.25,
            ]}
            color="#63767a"
          />
        )),
      )}
      <Beam
        from={[-0.6, 0.8, 0]}
        to={[-1, 1.25, 0]}
        width={0.15}
        color="#718b90"
      />
    </group>
  );
}
function Ladder({
  deployment,
  time,
  rescue,
  unit,
}: {
  deployment: number;
  time: number;
  rescue: boolean;
  unit: UnitState;
}) {
  const target = worldToVehicle(
    LADDER_TARGET,
    unit.position,
    unit.heading ?? STAGING[unit.id]?.heading ?? 0,
    VEHICLE_SCALE,
  );
  const end: Vec3 = [
    -3 + (target[0] + 3) * deployment,
    3.7 + (target[1] - 3.7) * deployment,
    target[2] * deployment,
  ];
  const base: Vec3 = [-1, 3.7, 0];
  const direction = new Vector3(...end).sub(new Vector3(...base));
  const lateral = new Vector3(-direction.z, 0, direction.x)
    .normalize()
    .multiplyScalar(0.65);
  const rail = (p: Vec3, sign: number): Vec3 => [
    p[0] + lateral.x * sign,
    p[1],
    p[2] + lateral.z * sign,
  ];
  return (
    <group>
      <Cylinder p={[-1, 2.9, 0]} r={1.05} h={0.4} color={C.dark} />
      {[-1, 1].map((sign) => (
        <Beam
          key={sign}
          from={rail(base, sign)}
          to={rail(end, sign)}
          width={0.18}
          color="#eff3ed"
        />
      ))}
      {Array.from({ length: 19 }, (_, i) => {
        const t = i / 18;
        return (
          <Beam
            key={i}
            from={rail(
              [
                base[0] + direction.x * t,
                base[1] + direction.y * t,
                base[2] + direction.z * t,
              ],
              -1,
            )}
            to={rail(
              [
                base[0] + direction.x * t,
                base[1] + direction.y * t,
                base[2] + direction.z * t,
              ],
              1,
            )}
            width={0.12}
          />
        );
      })}
      <Box p={end} s={[1.8, 0.2, 1.8]} color={C.white} />
      {[-0.85, 0.85].map((z) => (
        <Box
          key={z}
          p={[end[0], end[1] + 0.5, end[2] + z]}
          s={[1.8, 1, 0.1]}
          color={C.red}
        />
      ))}
      {rescue && (
        <group
          position={[
            -1 + (end[0] + 1) * (1 - (time % 20) / 20),
            base[1] + (end[1] - base[1]) * (1 - (time % 20) / 20),
            end[2] * (1 - (time % 20) / 20),
          ]}
        >
          <Box p={[0, 0.6, 0]} s={[0.45, 0.8, 0.35]} color={C.yellow} />
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.23, 8, 8]} />
            <meshStandardMaterial color="#e7c3a0" />
          </mesh>
        </group>
      )}
    </group>
  );
}
function Payload({
  unit,
  time,
  rescue,
  selected,
}: {
  unit: UnitState;
  time: number;
  rescue: boolean;
  selected: boolean;
}) {
  const d =
    unit.status === "fault" || unit.status === "recalled"
      ? 0
      : deploymentProgress(unit.deployment);
  const boomTarget = worldToVehicle(
    BOOM_TARGET,
    unit.position,
    unit.heading ?? STAGING[unit.id]?.heading ?? 0,
    VEHICLE_SCALE,
  );
  const boomEnd: Vec3 = [
    -3 + (boomTarget[0] + 3) * d,
    3.5 + (boomTarget[1] - 3.5) * d,
    boomTarget[2] * d,
  ];
  const boomElbow: Vec3 = [
    -2 + (boomTarget[0] * 0.35 + 2) * d,
    3.3 + (boomTarget[1] * 0.64 - 3.3) * d,
    boomTarget[2] * 0.4 * d,
  ];
  switch (unit.kind) {
    case "booster":
      return <BoosterModule label={!selected} />;
    case "water":
      return (
        <>
          <mesh
            position={[-0.8, 2.5, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[1.05, 1.05, 4.4, 24]} />
            <meshStandardMaterial
              color="#e9efed"
              metalness={0.3}
              roughness={0.28}
            />
          </mesh>
          <Cylinder p={[-1, 3.75, 0]} r={0.4} h={0.35} color={C.metal} />
          <Box p={[-3, 2.1, 0]} s={[0.5, 1.5, 2]} color={C.red} roughness={.3} metalness={.18} />
          <Cylinder
            p={[-4.15, 1, 0]}
            r={0.18}
            h={0.35}
            rotation={[0, 0, Math.PI / 2]}
            color={C.blue}
          />
        </>
      );
    case "power":
      return (
        <Box p={[-1, 2.15, 0]} s={[4.2, 2, 2.6]} color={C.white} roughness={.3} metalness={.16} />
      );
    case "dog":
      return (
        <>
          <Box p={[-1, 2, 0]} s={[4.2, 1.8, 2.6]} color={C.white} roughness={.3} metalness={.16} />
          <Box
            p={[-3.4 - d * 0.6, 1 - d * 0.4, 0]}
            s={[0.2 + d * 1.8, 0.15, 2.2]}
            rotation={[0, 0, d * 0.4]}
            color={C.metal}
          />
        </>
      );
    case "tools":
      return (
        <Box p={[-1, 2.2, 0]} s={[4.2, 2.1, 2.6]} color={C.red} roughness={.3} metalness={.18} />
      );
    case "boom":
      return (
        <>
          <Cylinder
            p={[0, 1, -1.6]}
            r={0.18}
            h={0.65}
            rotation={[Math.PI / 2, 0, 0]}
            color={C.blue}
          />
          <Box p={[-1, 1.7, 0]} s={[4, 1, 2.7]} color={C.red} roughness={.3} metalness={.18} />
          <Cylinder p={[-1, 2.4, 0]} r={0.85} h={0.5} />
          <Beam
            from={[-1, 2.5, 0]}
            to={boomElbow}
            width={0.65}
            color={C.white}
          />
          <Beam from={boomElbow} to={boomEnd} width={0.45} color={C.red} />
          <Cylinder
            p={boomEnd}
            h={0.65}
            r={0.2}
            rotation={[0, 0, Math.PI / 2]}
            color={C.dark}
          />
        </>
      );
    case "ladder":
      return (
        <>
          <Box p={[-1, 1.7, 0]} s={[4.2, 1, 2.6]} color={C.red} roughness={.3} metalness={.18} />
          <Ladder
            unit={unit}
            deployment={d}
            time={time}
            rescue={rescue && d > 0.9}
          />
        </>
      );
    case "recon":
      return (
        <>
          <Box p={[-1, 1.7, 0]} s={[4.5, 0.7, 2.8]} color={C.white} roughness={.3} metalness={.16} />
          <Cylinder p={[-1, 2.1, 0]} r={1.25} h={0.1} color={C.dark} />
          {d < 0.8 && (
            <group position={[-1, 2.15 + 1.06 * 0.45, 0]}>
              <Rotorcraft size={0.45} time={0} />
            </group>
          )}
          <Cylinder p={[-2.5, 3, 0]} r={0.07} h={2} color={C.metal} />
        </>
      );
    case "fire-drone":
      return <FireAirport deployed={unit.deployment > 0.8} />;
    case "cargo":
      return <CargoLaunchFrame />;
  }
}
export const Vehicle = memo(function Vehicle({
  unit,
  time,
  selected,
  onSelect,
  rescue,
}: {
  unit: UnitState;
  time: number;
  selected: boolean;
  onSelect: (id: string) => void;
  rescue: boolean;
}) {
  const ref = useRef<Group>(null),
    wheels = useRef<Group>(null),
    initialPosition = useRef(unit.position);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(...unit.position);
    const moving = unit.status === "enroute" || unit.status === "returning";
    if (unit.heading !== undefined) ref.current.rotation.y = unit.heading;
    else if (moving && unit.route.length > 0) {
      const next = unit.route.find(
        (p) => Math.hypot(p[0] - unit.position[0], p[2] - unit.position[2]) > 1,
      );
      if (next)
        ref.current.rotation.y = Math.atan2(
          -(next[2] - unit.position[2]),
          next[0] - unit.position[0],
        );
    } else ref.current.rotation.y = STAGING[unit.id]?.heading ?? 0;
    if (wheels.current) wheels.current.rotation.z = moving ? time * 3 : 0;
  }, -0.4);
  return (
    <group
      ref={ref}
      position={initialPosition.current}
      scale={VEHICLE_SCALE}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(unit.id);
      }}
    >
      <Box p={[-0.3, 0.95, 0]} s={[7.6, 0.6, 2.7]} color={C.dark} />
      <ApparatusCab />
      <Box p={[2.3, 3.2, 0]} s={[0.7, 0.25, 2]} color={C.dark} />
      {[-0.75, 0.75].map((z) => (
        <Box
          key={z}
          p={[2.3, 3.35, z]}
          s={[0.65, 0.18, 0.6]}
          color={z > 0 ? "#f46958" : "#56bde0"}
          emissive={z > 0 ? "#ff4934" : "#45d4ef"}
          emissiveIntensity={1.5 + (Math.sin(time * 7 + z * 3) + 1) * 0.6}
        />
      ))}
      {[-2.3, 2.4].map((x) =>
        [-1.45, 1.45].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0.75, z]}>
            <ApparatusWheel side={Math.sign(z)} />
            <group ref={x === 2.4 && z === 1.45 ? wheels : undefined}>
              <Box p={[0, 0, Math.sign(z) * .211]} s={[.45, .045, .004]} color={C.dark} />
            </group>
          </group>
        )),
      )}
      <ApparatusModuleDetails kind={unit.kind} />
      <Payload unit={unit} time={time} rescue={rescue} selected={selected} />
      {["boom", "ladder", "fire-drone"].includes(unit.kind) &&
        unit.deployment > 0.05 &&
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <group key={`${x}-${z}`}>
              <Beam
                from={[x * 2, 1, z]}
                to={[
                  x * 2,
                  0.35,
                  z * (1.3 + deploymentProgress(unit.deployment) * 2),
                ]}
                width={0.22}
                color={C.metal}
              />
              <Box
                p={[
                  x * 2,
                  0.15,
                  z * (1.3 + deploymentProgress(unit.deployment) * 2),
                ]}
                s={[0.8, 0.3, 0.8]}
                color={C.dark}
              />
            </group>
          )),
        )}
      {selected && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
            <ringGeometry args={[4.1, 4.35, 48]} />
            <meshBasicMaterial color="#db463f" transparent opacity={0.8} />
          </mesh>
          <Tag p={[0, 6, 0]} tone="selected">
            {unit.name}
          </Tag>
        </>
      )}
    </group>
  );
});
