import type { SimulationState, Vec3 } from "../types";
import { AIRCRAFT_TIMING, cargoFlightTime, cargoMissionDuration } from "../simulation/aircraft";
import { GROUND_PERSON_POSITION } from "../spatial/layout";
import { CREW_POSTS, crewJourney, type CrewPost } from "../spatial/crew";
import type { FirefighterAction } from "./FirefighterModel";
import { actionAllowed } from "./helpers";
import { rooftopPersonPose } from "./RooftopResponse";

export type FirefighterPose = Pick<CrewPost, "id" | "title" | "role" | "unitId" | "carrierId" | "position"> & {
  heading: number; action: FirefighterAction; duty: string;
};

export function firefighterPoses(state: SimulationState, dogPositions: Vec3[] = []): FirefighterPose[] {
  const cargo = state.units.find(unit => unit.id === "C01");
  const person = rooftopPersonPose(cargo, 0);
  const flightTime = cargo ? cargoFlightTime(cargo) : 0;
  const deployed = (id: string) => state.units.some(unit => unit.id === id && actionAllowed(unit.status, unit.deployment));
  const cargoWorking = cargo && (cargo.airReturning || (deployed("C01") && flightTime < cargoMissionDuration(cargo)));
  const boardingAllowed = cargo?.status === "working" && cargo.battery > 8 && !cargo.airReturning
    && state.approvals.lift && state.flags.liftConcept && !state.flags.droneFault
    && state.life.confirmed && !state.life.rescued;

  return CREW_POSTS.flatMap<FirefighterPose>(post => {
    const carrier = state.units.find(unit => unit.id === post.carrierId);
    if (!carrier) return [];
    const journey = crewJourney(post, carrier);
    if (!journey.progress) return [];
    let action: FirefighterAction = "standby", duty = "现场待命", target = post.target;
    switch (post.id) {
      case "commander":
        action = "radio";
        duty = "人机协同";
        break;
      case "water-operator":
        if (deployed("M01") && state.water.connected) { action = "operate"; duty = "供水监护"; }
        else duty = "等待接管";
        break;
      case "dog-handler":
        if (deployed("D01") && state.phase >= 3 && dogPositions.length) {
          action = "operate"; duty = "机器犬协同"; target = dogPositions[0];
        } else duty = "入口警戒";
        break;
      case "cargo-operator":
        if (cargoWorking) { action = "operate"; duty = cargo.airReturning ? "回收监护" : "空中作业监护"; }
        else duty = "起降区待命";
        break;
      case "rescue-observer":
        duty = "现场观察";
        if (person.phase === "boarding") {
          action = "radio"; duty = boardingAllowed ? "登篮观察联络" : "撤回观察联络"; target = person.position;
        } else if (cargoWorking || state.life.detected) {
          action = "radio";
          duty = cargo?.airReturning ? "回收联络"
            : state.metrics.delivered >= 4 && flightTime >= AIRCRAFT_TIMING.cargo.delivery
              && flightTime < AIRCRAFT_TIMING.cargo.delivery + 4 ? "物资到达复核" : "楼顶通信联络";
        }
        break;
      case "ground-receiver":
      case "ground-support":
        duty = "等待人员到达";
        if (person.phase === "safe") { duty = "交接完成"; target = GROUND_PERSON_POSITION; }
        else if (person.phase === "handoff") { action = "receive"; duty = "人员交接"; target = person.position; }
        else if (cargo?.airRescuePassenger && flightTime >= AIRCRAFT_TIMING.roofRescue.groundApproach) {
          action = "guide"; duty = "引导下篮";
        }
        break;
    }
    if (journey.progress < 1) {
      action = "walk";
      duty = carrier.crewReturning ? "返回登车" : "下车就位";
    } else if (carrier.crewReturning) {
      action = "standby"; duty = "等待登车";
    }
    if (state.complete) action = "standby";
    const { id, title, role, unitId, carrierId } = post;
    return [{ id, title, role, unitId, carrierId, position: journey.position, action, duty,
      heading: journey.progress < 1 ? journey.heading
        : Math.atan2(target[0] - post.position[0], target[2] - post.position[2]) }];
  });
}
