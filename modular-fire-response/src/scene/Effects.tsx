import { useRef } from "react";
import type { SimulationState, UnitState, Vec3 } from "../types";
import { Box, Tube, C, Beam } from "./Primitives";
import { Dog, FireAircraft, HeavyCargoAircraft, Rotorcraft } from "./Vehicles";
import { Tag } from "./City";
import { actionAllowed, dogRoutePosition } from "./helpers";
import { BOOM_TARGET, RECON_HEIGHT, TOWER_POSITION } from "../spatial/layout";
import { AIRCRAFT_TIMING, cargoFlightTime, fireHoseChainReady } from "../simulation/aircraft";
import {
  cargoAircraftPose,
  cargoLoadPose,
  fireAircraftPose,
  fireHoseRoute,
  rescueBasketPose,
  type FlightStage,
} from "./aircraft";
import {
  boomSupplyRoute,
  dogSupplyRoute,
  fireSupplyRoute,
  waterToBoosterRoute,
} from "./waterPaths";
import { IncidentParticles, WaterJet } from "./IncidentParticles";
import { RooftopResponse } from "./RooftopResponse";
import { Firefighters } from "./Firefighters";
import { crewReady } from "../spatial/crew";

const fireTarget: Vec3 = [TOWER_POSITION[0], 18, 7.9];
const stages: Record<FlightStage, string> = {
  docked: "待命",
  takeoff: "起飞",
  transit: "航渡",
  working: "作业",
  delivering: "投送",
  returning: "返航",
};

export function Flame({ time, intensity }: { time: number; intensity: number }) {
  return (
    <group position={[7, 17.1, 7.45]}>
      <pointLight position={[0,.6,1.4]} color="#ffb168" intensity={180 * intensity * (.94 + Math.sin(time * 7) * .06)} distance={23} decay={2} />
      <IncidentParticles name="incident-particles" time={time} intensity={intensity} />
    </group>
  );
}

export function FireFlights({
  unit,
  time,
  spray,
  detailedLabels = false,
}: {
  unit: UnitState;
  time: number;
  spray: boolean;
  detailedLabels?: boolean;
}) {
  const hoseDeployed =
    (["deploying", "working"].includes(unit.status) && unit.deployment > 0.8) ||
    !!unit.airReturning;
  const aircraft = [0, 1, 2].map((index) => fireAircraftPose(unit, index)),
    hose = hoseDeployed ? fireHoseRoute(unit) : [];
  const airborne = aircraft.map((pose) => pose.airborne);
  const airborneCount = airborne.filter(Boolean).length;
  const lastAirborne = airborne.lastIndexOf(true);
  const terminal = aircraft[2],
    chainReady = fireHoseChainReady(unit),
    spraying = spray && chainReady && terminal.workReady;
  const chainStage = unit.airReturning
    ? "收管返航"
    : chainReady
      ? spraying ? "末端喷射" : "等待供水"
      : "依次起飞";
  const roleStage = (index: number) => {
    const pose = aircraft[index];
    if (unit.airReturning) return pose.airborne ? "收管返航" : "已回收";
    if (pose.stage === "docked") return "待起飞";
    if (pose.stage === "takeoff") return "提管起飞";
    if (pose.stage === "transit") return "携管上升";
    if (index < 2) return index === 0 ? "下段承托" : "中段承托";
    return spraying ? "末端喷射" : "等待供水";
  };
  return (
    <group>
      {aircraft.map((pose, index) => (
        <group
          name={`fire-aircraft-${index}`}
          key={index}
          position={pose.position}
          rotation={[0, pose.heading, 0]}
        >
          <group scale={pose.scale}>
            <FireAircraft time={pose.airborne ? time : 0} index={index} />
          </group>
          {(detailedLabels ? hoseDeployed || pose.airborne : pose.airborne && index === lastAirborne) && (
            <Tag p={[0, index === 2 ? 4 : 2.5, 0]} tone="water">
              {detailedLabels
                ? `${index === 2 ? "喷射机" : "托管机"} 0${index + 1} · ${roleStage(index)}`
                : `分段托管 · ${airborneCount}/3 · ${chainStage}`}
            </Tag>
          )}
        </group>
      ))}
      {hose.length > 1 && (
        <group name="shared-fire-hose">
          <Tube
            points={hose}
            r={0.13}
            color="#309dcc"
            emissive="#207790"
            emissiveIntensity={0.2}
          />
        </group>
      )}
      {spraying && (
        <group name="fire-water-jet-2">
          <WaterJet
            points={[
              terminal.nozzle,
              [
                (terminal.nozzle[0] + fireTarget[0]) / 2,
                (terminal.nozzle[1] + fireTarget[1]) / 2 + 0.2,
                (terminal.nozzle[2] + fireTarget[2]) / 2,
              ],
              fireTarget,
            ]}
            time={time}
            radius={0.17}
          />
        </group>
      )}
    </group>
  );
}

export function CargoFlight({
  unit,
  time,
  delivered,
  detailedLabels = false,
}: {
  unit: UnitState;
  time: number;
  delivered: number;
  detailedLabels?: boolean;
}) {
  const pose = cargoAircraftPose(unit),
    load = cargoLoadPose(unit, delivered),
    basket = rescueBasketPose(unit);
  const { railHeight, slingHeight } = basket;
  const groundAccess = (unit.airRescuePassenger || unit.airRescueDelivered)
    && cargoFlightTime(unit) >= AIRCRAFT_TIMING.roofRescue.groundApproach;
  const gateOpen = Math.max(0, Math.min(1, (basket.extension - 0.7) / 0.3));
  const flightTime = cargoFlightTime(unit), rescueTiming = AIRCRAFT_TIMING.roofRescue;
  let cargoStage = stages[pose.stage];
  if (unit.airRescuePassenger && !unit.airRescueDelivered) {
    cargoStage = flightTime < AIRCRAFT_TIMING.cargo.retract ? "楼顶人员起吊"
      : flightTime < rescueTiming.groundApproach ? "人员转运"
        : flightTime < rescueTiming.groundLower ? "下放吊篮" : "地面交接";
  } else if (unit.airRescueDelivered && flightTime < rescueTiming.groundRetract) {
    cargoStage = "回收空篮";
  } else if (unit.airReturning && (unit.airRescueBoarding ?? 0) > 0) {
    cargoStage = "接应撤销";
  } else if (!unit.airReturning && (unit.airRescueBoarding ?? 0) > 0) {
    cargoStage = "楼顶人员登篮";
  } else if (basket.extension > 0) {
    cargoStage = unit.airReturning ? "回收吊篮" : "屋顶接应";
  } else if (pose.stage === "delivering") {
    cargoStage = flightTime < AIRCRAFT_TIMING.cargo.delivery ? "楼顶物资投送" : "楼顶物资接应";
  }
  return (
    <group>
      <group
        name="cargo-aircraft"
        position={pose.position}
        rotation={[0, pose.heading, 0]}
      >
        <group scale={pose.scale}>
          <HeavyCargoAircraft time={pose.airborne ? time : 0} />
        </group>
        {pose.airborne && (
          <Tag p={[0, 3.6, 0]} tone="warning">
            载重无人机 · {cargoStage}
          </Tag>
        )}
      </group>
      <Beam from={pose.hook} to={load.cableEnd} width={0.045} color="#d0d8d3" />
      <group
        position={load.position}
        rotation={[0, load.attached ? pose.heading : 0, 0]}
      >
        <Box p={[0, 0.05, 0]} s={[1.3, 0.1, 0.72]} color="#485653" />
        {[-0.33, 0.33].flatMap((x, ix) =>
          [-0.19, 0.19].map((z, iz) => (
            <group name={`supply-group-${ix * 2 + iz}`} key={`${x}-${z}`}>
              <Box p={[x, 0.375, z]} s={[0.55, 0.55, 0.31]} color={C.yellow} />
              <Box p={[x, 0.65, z]} s={[0.57, 0.06, 0.33]} color="#f5d479" />
              <Box
                p={[x, 0.39, z + 0.16]}
                s={[0.07, 0.5, 0.025]}
                color="#e7eee6"
              />
            </group>
          )),
        )}
        {load.attached &&
          [-1, 1].flatMap((x) =>
            [-1, 1].map((z) => (
              <Beam
                key={`${x}-${z}`}
                from={[0, 0.86, 0]}
                to={[x * 0.56, 0.65, z * 0.3]}
                width={0.025}
                color="#d6ded9"
              />
            )),
          )}
        {detailedLabels && !load.attached && (
          <Tag p={[0, 1.7, 0]} tone="warning">
            补给物资 · 4 组
          </Tag>
        )}
      </group>
      <Beam
        from={basket.hook}
        to={basket.cableEnd}
        width={0.025}
        color="#e2e5df"
      />
      <group
        name="rescue-basket"
        position={basket.position}
        rotation={[0, basket.heading, 0]}
        scale={basket.scale}
      >
        <Box p={[0, 0.04, 0]} s={[0.9, 0.08, 1.25]} color={C.red} />
        {[-1, 1].map(x => (
          <group
            key={x}
            name={`rescue-basket-gate-${x}`}
            position={[x * 0.43, 0, -0.58]}
            rotation={[0, x === (groundAccess ? 1 : -1) && gateOpen > 0 ? x * gateOpen * Math.PI / 2 : 0, 0]}
          >
            <Box p={[0, railHeight / 2, 0.58]} s={[0.04, railHeight, 1.16]} color="#d5dfda" />
          </group>
        ))}
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <Beam
              key={`${x}-${z}`}
              from={[x * 0.43, 0, z * 0.58]}
              to={[x * 0.43, slingHeight, z * 0.58]}
              width={0.035}
              color="#d9e3dc"
            />
          )),
        )}
        <group name="rescue-basket-top-frame">
          {[-1, 1].flatMap(x => [-1, 1].map(z => (
            <Beam key={`${x}-${z}`} from={[x * 0.43, slingHeight, z * 0.58]} to={[0, slingHeight, 0]} width={0.035} color="#d9e3dc" />
          )))}
        </group>
        {(basket.extension > 0.05 || (unit.airRescuePassenger && !unit.airRescueDelivered)) && (
          <Tag p={[0, 2, 0]} tone="warning">
            {unit.airRescuePassenger ? "人员转运 · 概念演示" : "屋顶接人 · 概念演示"}
          </Tag>
        )}
      </group>
    </group>
  );
}

export function Effects({
  state,
  selectedId,
  onSelect,
}: {
  state: SimulationState;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const { time } = state;
  const active = (kind: string) =>
    state.units.find(
      (unit) =>
        unit.kind === kind && actionAllowed(unit.status, unit.deployment),
    );
  const fire = state.units.find((unit) => unit.kind === "fire-drone"),
    cargo = state.units.find((unit) => unit.kind === "cargo");
  const dogs = active("dog"),
    boom = active("boom"),
    booster = active("booster");
  const connected = !!booster && state.water.connected;
  const spray = connected && state.water.outflow > 0.001;
  const dogClock = useRef({ start: time, last: time, active: false }),
    dogActive = !!dogs && crewReady(dogs) && state.phase >= 3;
  if (time < dogClock.current.last || !dogActive) {
    dogClock.current.start = time;
    dogClock.current.active = false;
  }
  if (dogActive && !dogClock.current.active) {
    dogClock.current.start = time;
    dogClock.current.active = true;
  }
  dogClock.current.last = time;
  const dogElapsed = time - dogClock.current.start;
  const dogPositions = dogs
    ? [0, 1, 2].map((index) =>
        dogRoutePosition(dogs.position, dogElapsed, index),
      )
    : [];
  const dogEntered = dogPositions.filter(
    (position) => position[2] < 6.5,
  ).length;
  const intensity = state.complete
    ? 0.2
    : Math.max(0.35, 1 - state.water.totalUsed / 22000);
  return (
    <group>
      {!state.complete && <Flame time={time} intensity={intensity} />}
      <RooftopResponse unit={cargo} time={time} delivered={state.metrics.delivered} detailedLabels={selectedId === "C01"} />
      <Firefighters state={state} dogPositions={dogActive ? dogPositions : []} selectedId={selectedId} onSelect={onSelect} />
      {state.life.detected && !state.life.confirmed && (
        <Tag p={[7, 21, 8]} tone="warning">
          疑似热目标 · 待复核
        </Tag>
      )}
      {time > 0 &&
        state.units.some(
          (unit) =>
            unit.kind === "recon" &&
            !["standby", "recalled", "fault", "returning"].includes(
              unit.status,
            ),
        ) &&
        !state.flags.droneFault && (
          <group
            position={[
              7 + Math.cos(time * 0.35) * 13,
              RECON_HEIGHT,
              Math.sin(time * 0.35) * 12,
            ]}
          >
            <Rotorcraft size={0.65} time={time} />
            <Tag p={[0, 3, 0]}>无人机侦察</Tag>
          </group>
        )}
      {fire && (
        <FireFlights
          unit={fire}
          time={time}
          spray={spray && state.flags.airConcept && !state.flags.droneFault}
          detailedLabels={fire.id === selectedId}
        />
      )}
      {cargo && (
        <CargoFlight
          unit={cargo}
          time={time}
          delivered={state.metrics.delivered}
          detailedLabels={cargo.id === selectedId}
        />
      )}
      {connected &&
        booster &&
        state.units
          .filter((unit) => unit.kind === "water" && unit.status === "working")
          .map((unit, index) => (
            <Tube
              key={unit.id}
              points={waterToBoosterRoute(unit, booster, index)}
              color={C.blue}
              r={0.12}
              emissive="#236d8c"
              emissiveIntensity={0.2}
            />
          ))}
      {connected &&
        booster &&
        fire &&
        (actionAllowed(fire.status, fire.deployment) || fire.airReturning) && (
          <Tube
            points={fireSupplyRoute(booster, fire)}
            color={C.blue}
            r={0.13}
            emissive="#236d8c"
            emissiveIntensity={0.2}
          />
        )}
      {boom && connected && booster && (
        <Tube points={boomSupplyRoute(booster, boom)} color={C.blue} r={0.13} />
      )}
      {boom && spray && (
        <WaterJet
          points={[BOOM_TARGET, [5, 21, 9], fireTarget]}
          time={time}
          radius={.18}
        />
      )}
      {dogActive && (
        <group>
          {dogPositions.map((position, index) => (
            <group
              key={index}
              position={position}
              rotation={[0, Math.PI / 2, 0]}
            >
              <Dog
                p={[0, 0, 0]}
                time={dogElapsed < 26 ? time : 0}
                offset={index}
              />
            </group>
          ))}
          {connected && booster && (
            <Tube
              points={dogSupplyRoute(booster, dogPositions)}
              r={0.11}
              color="#d8b259"
            />
          )}
          {spray && dogPositions[2][2] <= 8.1 && dogPositions[2][2] >= 6.5 && (
            <WaterJet
              points={[
                [dogPositions[2][0], 1.5, dogPositions[2][2] - 0.7],
                [7, 1.3, dogPositions[2][2] - 1.5],
                [7, 1, Math.max(5, dogPositions[2][2] - 3)],
              ]}
              time={time}
              radius={.085}
            />
          )}
          {dogEntered > 0 && (
            <Tag p={[7, 4.5, 8]} tone="water">
              机器犬入内 · {dogEntered}/3
            </Tag>
          )}
        </group>
      )}
      {state.flags.blockedRoad && (
        <group position={[-22, 0, -5]}>
          <Box p={[0, 1.1, 0]} s={[7, 0.7, 0.3]} color={C.red} />
          {[-3, 0, 3].map((x) => (
            <Box key={x} p={[x, 0.6, 0]} s={[0.2, 1.2, 0.6]} color={C.white} />
          ))}
          <Tag p={[0, 4, 0]} tone="warning">
            道路封闭
          </Tag>
        </group>
      )}
    </group>
  );
}
