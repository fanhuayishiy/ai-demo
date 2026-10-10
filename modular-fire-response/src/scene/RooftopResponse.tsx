import type { UnitState, Vec3 } from "../types";
import { AIRCRAFT_TIMING, cargoFlightTime } from "../simulation/aircraft";
import {
  GROUND_BASKET_POSITION,
  GROUND_PERSON_POSITION,
  ROOFTOP_CARGO_LANDING,
  ROOFTOP_PEOPLE,
  ROOFTOP_SURFACE_Y,
  SURFACE_Y,
} from "../spatial/layout";
import { rescueBasketPose } from "./aircraft";
import { Beam, Box, Cylinder, C } from "./Primitives";
import { Tag } from "./ProjectedTag";

type PersonPhase = "waiting" | "boarding" | "airborne" | "handoff" | "safe";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: Vec3, to: Vec3, amount: number): Vec3 =>
  from.map((value, axis) => value + (to[axis] - value) * clamp(amount)) as Vec3;

export function rooftopPersonPose(unit: UnitState | undefined, index: number): {
  position: Vec3;
  heading: number;
  phase: PersonPhase;
} {
  const waiting = ROOFTOP_PEOPLE[index];
  if (index !== 0 || !unit) return { position: [...waiting], heading: 0, phase: "waiting" };
  if (unit.airRescueDelivered) return { position: [...GROUND_PERSON_POSITION], heading: -Math.PI / 4, phase: "safe" };
  const basket = rescueBasketPose(unit);
  const feet: Vec3 = [basket.position[0], basket.position[1] + 0.08 * basket.scale, basket.position[2]];
  if (!unit.airRescuePassenger) {
    const boarding = clamp(unit.airRescueBoarding ?? 0);
    const position = mix(waiting, feet, boarding);
    position[1] = waiting[1] + (feet[1] - waiting[1]) * clamp(boarding * 2);
    return {
      position,
      heading: boarding > 0 ? (unit.airReturning ? -Math.PI / 2 : Math.PI / 2) : 0,
      phase: boarding > 0 ? "boarding" : "waiting",
    };
  }
  const timing = AIRCRAFT_TIMING.roofRescue;
  const handoff = clamp((cargoFlightTime(unit) - timing.groundLower) / (timing.groundDelivery - timing.groundLower));
  // Clear the open side before turning past the basket's corner uprights.
  const clear: Vec3 = [GROUND_PERSON_POSITION[0], feet[1], feet[2]];
  const position = handoff < 0.65 ? mix(feet, clear, handoff / 0.65)
    : mix(clear, GROUND_PERSON_POSITION, (handoff - 0.65) / 0.35);
  return {
    position,
    heading: handoff > 0 ? handoff < 0.65 ? Math.PI / 2 : 0 : basket.heading,
    phase: handoff > 0 ? "handoff" : "airborne",
  };
}

const JACKETS = ["#e6eef0", "#cd6e63", "#56a398", "#e0c573"];
const SKIN = ["#d3a483", "#b98266", "#d5ae8e", "#b7947b"];

function RescuePerson({ index, time, phase }: { index: number; time: number; phase: PersonPhase }) {
  const jacket = JACKETS[index], skin = SKIN[index];
  const waving = phase === "waiting" && index < 3;
  const wave = Math.sin(time * 2.4 + index * 1.8) * 0.14;
  const rightElbow: Vec3 = waving ? [0.44, 1.42, 0] : [0.38, 0.93, 0.04];
  const rightHand: Vec3 = waving ? [0.38 + wave, 1.72, 0.04] : [0.3, 0.78, 0.2];
  return (
    <group name={`person-model-${index}`}>
      {[-1, 1].map(side => (
        <group key={side}>
          <Box p={[side * 0.13, 0.09, 0.04]} s={[0.19, 0.18, 0.32]} color="#303b42" roughness={0.92} metalness={0} />
          <Box p={[side * 0.13, 0.44, 0]} s={[0.18, 0.55, 0.2]} color="#64727b" roughness={0.9} metalness={0} />
        </group>
      ))}
      <Box p={[0, 1.01, 0]} s={[0.5, 0.64, 0.29]} color={jacket} roughness={0.82} metalness={0} />
      <Box p={[0, 0.85, 0.151]} s={[0.51, 0.07, 0.025]} color={C.yellow} roughness={0.72} metalness={0} />
      <Box p={[-0.16, 1.1, 0.151]} s={[0.045, 0.33, 0.025]} color={C.white} roughness={0.7} metalness={0} />
      <Box p={[0.16, 1.1, 0.151]} s={[0.045, 0.33, 0.025]} color={C.white} roughness={0.7} metalness={0} />
      <Cylinder p={[0, 1.39, 0]} r={0.085} h={0.17} color={skin} roughness={0.9} metalness={0} />
      <mesh position={[0, 1.56, 0.015]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.88} metalness={0} />
      </mesh>
      {index === 3
        ? <Cylinder p={[0, 1.74, 0.005]} r={0.23} h={0.12} color={C.yellow} roughness={0.6} metalness={0.04} />
        : <Box p={[0, 1.697, -0.015]} s={[0.29, 0.1, 0.27]} color="#38434a" roughness={0.95} metalness={0} />}
      <Beam from={[-0.3, 1.22, 0]} to={[-0.4, 0.93, 0.03]} width={0.15} color={jacket} />
      <Beam from={[-0.4, 0.93, 0.03]} to={[-0.31, 0.77, 0.2]} width={0.13} color={jacket} />
      <Box p={[-0.31, 0.77, 0.2]} s={[0.13, 0.14, 0.13]} color={skin} roughness={0.86} metalness={0} />
      <Beam from={[0.3, 1.22, 0]} to={rightElbow} width={0.15} color={jacket} />
      <Beam from={rightElbow} to={rightHand} width={0.13} color={jacket} />
      <Box p={rightHand} s={[0.13, 0.14, 0.13]} color={skin} roughness={0.86} metalness={0} />
    </group>
  );
}

export function RooftopResponse({
  unit,
  time,
  delivered,
  detailedLabels = false,
}: {
  unit?: UnitState;
  time: number;
  delivered: number;
  detailedLabels?: boolean;
}) {
  const people = ROOFTOP_PEOPLE.map((_, index) => rooftopPersonPose(unit, index));
  const roofCount = people.filter(person => person.phase === "waiting" || person.phase === "boarding").length;
  return (
    <group name="rooftop-response">
      <group name="rooftop-receiving-area" position={[5.2, ROOFTOP_SURFACE_Y + 0.008, 4.6]}>
        {[-1, 1].flatMap(x => [-1, 1].map(z => (
          <group key={`${x}-${z}`}>
            <Box p={[x * 4.15, 0.01, z * 1.42]} s={[0.58, 0.02, 0.07]} color={C.white} roughness={0.94} metalness={0} />
            <Box p={[x * 4.4, 0.01, z * 1.16]} s={[0.07, 0.02, 0.58]} color={C.white} roughness={0.94} metalness={0} />
          </group>
        )))}
      </group>
      <Box p={[ROOFTOP_CARGO_LANDING[0], ROOFTOP_SURFACE_Y + 0.007, ROOFTOP_CARGO_LANDING[2]]} s={[1.7, 0.014, 1.08]} color="#576b65" roughness={0.95} metalness={0} />
      <group name="rooftop-work-light" position={[0.65, ROOFTOP_SURFACE_Y, 5.6]}>
        <Box p={[0, 0.05, 0]} s={[0.55, 0.1, 0.45]} color={C.dark} />
        <Cylinder p={[0, 0.8, 0]} r={0.045} h={1.5} color={C.metal} />
        <Box p={[0, 1.53, 0]} s={[0.65, 0.32, 0.13]} color={C.dark} />
        <Box p={[0.03, 1.53, 0.07]} s={[0.54, 0.22, 0.025]} color={C.white} emissive="#e4e9e1" emissiveIntensity={1.4} />
        <pointLight position={[0.35, 1.8, 0.15]} color="#e6eddd" intensity={90} distance={12} decay={2} />
      </group>
      {people.map((person, index) => (
        <group
          key={index}
          name={`rooftop-person-${index}`}
          position={person.position}
          rotation={[0, person.heading, 0]}
          scale={1}
          userData={{ phase: person.phase }}
        >
          <RescuePerson index={index} time={time} phase={person.phase} />
        </group>
      ))}
      <Tag p={[1.8, 32, 5.8]} tone="warning">
        {`楼顶受困 · ${roofCount} 人${delivered > 0 ? " · 物资已到达" : ""}`}
      </Tag>
      <group name="ground-receiving-area" position={[44.15, SURFACE_Y + 0.02, -23.6]}>
        {[-1, 1].map(side => (
          <group key={side}>
            <Box p={[side * 1.5, 0, 0]} s={[0.06, 0.02, 2.4]} color="#c5d4cc" roughness={0.95} metalness={0} />
            <Box p={[0, 0, side * 1.2]} s={[3, 0.02, 0.06]} color="#c5d4cc" roughness={0.95} metalness={0} />
          </group>
        ))}
      </group>
      {(detailedLabels || unit?.airRescuePassenger) && (
        <Tag p={[GROUND_BASKET_POSITION[0], 3.1, GROUND_BASKET_POSITION[2]]} tone="warning">
          {unit?.airRescueDelivered ? "地面接应 · 概念转移 1 人" : "地面接应区"}
        </Tag>
      )}
    </group>
  );
}
