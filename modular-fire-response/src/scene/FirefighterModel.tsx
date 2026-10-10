import { Quaternion, Vector3 } from "three";
import type { Vec3 } from "../types";
import { Beam, Box, Cylinder, C } from "./Primitives";

export type FirefighterAction = "standby" | "radio" | "operate" | "guide" | "receive" | "walk";

function walkingLegPose(side: number, phase: number): { hip: Vec3; knee: Vec3; ankle: Vec3; boot: Vec3 } {
  const stride = -side * Math.cos(phase) * .22;
  const lift = Math.max(0, side * Math.sin(phase)) ** 2 * .14;
  const hip: Vec3 = [side * .14, .78, 0];
  const ankle: Vec3 = [side * .14, .22 + lift, stride];
  const drop = ankle[1] - hip[1];
  const reach = Math.hypot(drop, stride);
  // Solve two equal-length segments with the knee bent toward local +Z.
  const bend = Math.sqrt(.34 ** 2 - reach ** 2 / 4);
  const knee: Vec3 = [side * .14, (hip[1] + ankle[1]) / 2 + stride / reach * bend, stride / 2 - drop / reach * bend];
  return { hip, knee, ankle, boot: [side * .14, .13 + lift, .055 + stride] };
}

function armPose(action: FirefighterAction, side: number, motion: number): { elbow: Vec3; hand: Vec3 } {
  if (action === "walk") {
    return { elbow: [side * .37, 1.075, side * motion * .085], hand: [side * .34, .87, .08 + side * motion * .16] };
  }
  if (action === "radio" && side > 0) {
    return { elbow: [.39, 1.13, .07], hand: [.23, 1.47 + motion * .014, .26] };
  }
  if (action === "operate") {
    return {
      elbow: [side * .33, 1.01, .12],
      hand: [side * .185, 1.015 + (side > 0 ? .045 : 0) + motion * .009, .4],
    };
  }
  if (action === "guide") {
    return { elbow: [side * .38, 1.39, .045], hand: [side * .48, 1.69 + side * motion * .035, .1] };
  }
  if (action === "receive") {
    return {
      elbow: [side * .38, 1.05, .19],
      hand: [side * .29, 1.2 + (side > 0 ? -.02 : 0) + motion * .025, .48],
    };
  }
  return { elbow: [side * .37, 1.08, .02], hand: [side * .34, .86, .1] };
}

export function FirefighterModel({ role, action, time }: {
  role: "command" | "operator" | "rescue";
  action: FirefighterAction;
  time: number;
}) {
  const helmet = role === "command" ? C.white : C.yellow;
  const orange = "#bc623c";
  const coat = role === "rescue" ? orange : C.dark;
  // Keep the periodic input bounded even when the simulation clock is very large.
  const safeTime = Number.isFinite(time) ? time : 0;
  const walkPhase = (safeTime % 1.2) / 1.2 * Math.PI * 2;
  const motion = action === "walk" ? Math.cos(walkPhase) : Math.sin((safeTime % (Math.PI * 2 / 1.8)) * 1.8);
  const rightHand = armPose(action, 1, motion).hand;
  const legs = [-1, 1].map(side => ({
    side,
    name: side < 0 ? "left" : "right",
    walk: action === "walk" ? walkingLegPose(side, walkPhase) : undefined,
  }));

  return (
    <group name="firefighter-model" userData={{ role, action }}>
      {legs.map(({ side, name, walk }) => (
        <group key={side} name={`firefighter-leg-${name}`}>
          <group name={`firefighter-boot-${name}`}>
            <Box p={walk?.boot ?? [side * .14, .13, .055]} s={[.23, .26, .35]} color={C.tire} roughness={.96} metalness={0} />
          </group>
          {walk ? <>
            <group name={`firefighter-thigh-${name}`}>
              <Beam from={walk.hip} to={walk.knee} width={.205} color={C.dark} />
            </group>
            <group name={`firefighter-shin-${name}`}>
              <Beam from={walk.knee} to={walk.ankle} width={.195} color={C.dark} />
            </group>
          </> : <Box p={[side * .14, .48, 0]} s={[.205, .59, .24]} color={C.dark} roughness={.91} metalness={0} />}
        </group>
      ))}

      <group name="firefighter-turnout-coat">
        <Box p={[0, 1.055, 0]} s={[.53, .65, .31]} color={coat} roughness={.88} metalness={0} />
        <Box p={[0, 1.32, 0]} s={[.55, .135, .32]} color={orange} roughness={.87} metalness={0} />
        <Cylinder p={[0, 1.43, 0]} r={.11} h={.16} color={C.dark} roughness={.91} metalness={0} />
        {[-1, 1].map(side => (
          <Box key={side} p={[side * .15, .99, .166]} s={[.135, .12, .03]} color={C.dark} roughness={.9} metalness={0} />
        ))}
      </group>

      <group name="firefighter-reflective-bands">
        <Box p={[0, .85, 0]} s={[.555, .065, .335]} color={C.yellow} emissive={C.yellow} emissiveIntensity={.14} roughness={.58} />
        <Box p={[0, 1.2, 0]} s={[.545, .05, .33]} color={C.yellow} emissive={C.yellow} emissiveIntensity={.14} roughness={.58} />
        {legs.map(({ side, name, walk }) => {
          const bandPosition = walk ? new Vector3(...walk.knee).lerp(new Vector3(...walk.ankle), .68) : new Vector3(side * .14, .36, 0);
          const bandRotation = walk ? new Quaternion().setFromUnitVectors(
            new Vector3(0, 1, 0), new Vector3(...walk.ankle).sub(new Vector3(...walk.knee)).normalize(),
          ) : new Quaternion();
          return (
            <group key={side}>
              <Box p={[side * .155, 1.075, .177]} s={[.045, .29, .018]} color={C.white} emissive={C.white} emissiveIntensity={.1} roughness={.55} />
              <group name={`firefighter-calf-band-${name}`} position={bandPosition} quaternion={bandRotation}>
                <Box s={[.216, .055, .25]} color={C.yellow} emissive={C.yellow} emissiveIntensity={.14} roughness={.58} />
              </group>
            </group>
          );
        })}
      </group>

      <mesh position={[0, 1.565, .006]} castShadow>
        <sphereGeometry args={[.165, 10, 8]} />
        <meshStandardMaterial color={C.dark} roughness={.92} metalness={0} />
      </mesh>
      <Box p={[0, 1.55, .129]} s={[.2, .23, .06]} color="#bc9479" roughness={.9} metalness={0} />
      <group name="firefighter-visor">
        <Box p={[0, 1.62, .165]} s={[.29, .17, .055]} color={C.glass} roughness={.16} metalness={.22} />
      </group>
      <group name="firefighter-helmet">
        <mesh position={[0, 1.72, 0]} castShadow>
          <sphereGeometry args={[.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={helmet} roughness={.45} metalness={.08} />
        </mesh>
        <Cylinder p={[0, 1.715, 0]} r={.255} h={.045} color={helmet} roughness={.48} metalness={.06} />
        <Box p={[0, 1.905, 0]} s={[.045, .06, .3]} color={helmet} roughness={.45} metalness={.08} />
        <Box p={[0, 1.785, .223]} s={[.095, .075, .019]} color={role === "command" ? C.red : C.dark} roughness={.62} />
      </group>

      {[-1, 1].map(side => {
        const { elbow, hand } = armPose(action, side, motion);
        const forearm = new Vector3(...hand).sub(new Vector3(...elbow));
        const cuff = new Vector3(...elbow).lerp(new Vector3(...hand), .77);
        const cuffRotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), forearm.normalize());
        const name = side < 0 ? "left" : "right";
        return (
          <group key={side} name={`firefighter-arm-${name}`}>
            <Beam from={[side * .285, 1.29, 0]} to={elbow} width={.17} color={coat} />
            <Beam from={elbow} to={hand} width={.15} color={coat} />
            <group position={cuff} quaternion={cuffRotation}>
              <Box s={[.17, .055, .17]} color={C.yellow} emissive={C.yellow} emissiveIntensity={.14} roughness={.58} />
            </group>
            <group name={`firefighter-glove-${name}`}>
              <Box p={hand} s={[.14, .15, .14]} color={C.tire} roughness={.95} metalness={0} />
            </group>
          </group>
        );
      })}

      {role !== "command" && (
        <group name="firefighter-scba">
          <Box p={[0, 1.09, -.18]} s={[.29, .48, .075]} color={C.tire} roughness={.94} metalness={0} />
          <group name="firefighter-air-cylinder">
            <Cylinder p={[0, 1.1, -.3]} r={.115} h={.55} color={C.yellow} roughness={.5} metalness={.18} />
            {[.97, 1.23].map(y => <Cylinder key={y} p={[0, y, -.3]} r={.118} h={.035} color={C.dark} roughness={.82} />)}
            <Cylinder p={[0, 1.405, -.3]} r={.04} h={.07} color={C.metal} />
          </group>
          {[-1, 1].map(side => (
            <Box key={side} p={[side * .19, 1.12, .187]} s={[.035, .43, .022]} rotation={[0, 0, side * .08]} color={C.tire} roughness={.93} metalness={0} />
          ))}
          <Box p={[0, 1.497, .182]} s={[.145, .105, .075]} color={C.tire} roughness={.9} metalness={0} />
        </group>
      )}

      {action === "radio" && (
        <group name="firefighter-radio" position={rightHand} rotation={[.1, 0, .08]}>
          <Box p={[0, .055, .025]} s={[.075, .155, .065]} color={C.tire} roughness={.85} metalness={0} />
          <Cylinder p={[.018, .17, .018]} r={.007} h={.085} color={C.dark} roughness={.87} metalness={0} />
          <Box p={[0, .078, .062]} s={[.045, .036, .01]} color={C.metal} roughness={.56} />
        </group>
      )}
      {action === "operate" && (
        <group name="firefighter-tablet" position={[0, 1.03 + motion * .009, .405]} rotation={[-1.9, 0, 0]}>
          <Box s={[.3, .2, .034]} color={C.tire} roughness={.77} metalness={0} />
          <Box p={[0, 0, .022]} s={[.256, .148, .008]} color={C.blue} emissive={C.blue} emissiveIntensity={.08} roughness={.22} metalness={.12} />
        </group>
      )}
    </group>
  );
}
