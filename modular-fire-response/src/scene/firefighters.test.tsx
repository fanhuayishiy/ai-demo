import { Children, isValidElement, type ReactNode } from "react";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../simulation";
import { AIRCRAFT_TIMING } from "../simulation/aircraft";
import { ROOFTOP_CARGO_LANDING, STAGING, SURFACE_Y } from "../spatial/layout";
import type { SimulationState, Vec3 } from "../types";
import { Effects } from "./Effects";
import { labelText } from "./labelText";
import { Tag } from "./ProjectedTag";

type Props = {
  name?: string; position?: Vec3; rotation?: Vec3; scale?: number;
  role?: string; action?: string; time?: number; children?: ReactNode;
  userData?: { role: string; action: string; duty: string; unitId: string };
  onClick?: (event: { stopPropagation: () => void }) => void;
};
type Element = { type: unknown; props: Props };
const elements = (node: ReactNode): Element[] => {
  if (!isValidElement<Props>(node)) return [];
  return [{ type: node.type, props: node.props }, ...Children.toArray(node.props.children).flatMap(elements)];
};

function crew(state: SimulationState, selectedId = "incident", onSelect = vi.fn()) {
  const { result } = renderHook(() => Effects({ state, selectedId, onSelect }));
  const component = elements(result.current).find(node =>
    typeof node.type === "function" && node.type.name === "Firefighters",
  );
  expect(component, "the incident scene must include visible firefighters").toBeDefined();
  return elements((component!.type as (props: unknown) => ReactNode)(component!.props));
}
const people = (nodes: Element[]) => nodes.filter(node => node.props.userData?.role);
const member = (nodes: Element[], id: string) => {
  const found = nodes.find(node => node.props.name === `firefighter-${id}`);
  expect(found, `firefighter ${id} is present`).toBeDefined();
  return found!;
};
const action = (nodes: Element[], id: string) => member(nodes, id).props.userData!.action;
function deployedCrewState() {
  const state = createInitialState();
  for (const unit of state.units.filter(current => current.crewProgress !== undefined)) {
    Object.assign(unit, { position: [...STAGING[unit.id].position], heading: 0,
      status: "deploying", deployment: 0, crewProgress: 1 });
  }
  return state;
}
function cargoState(airTime: number) {
  const state = deployedCrewState();
  const cargo = state.units.find(unit => unit.id === "C01")!;
  Object.assign(cargo, { position: [...STAGING.C01.position], heading: 0, status: "working", deployment: 5, airTime });
  return { state, cargo };
}
afterEach(cleanup);

describe("firefighters in the incident scene", () => {
  it("adds seven distinct full-size personnel after arrival without replacing the four civilians", () => {
    expect(people(crew(createInitialState()))).toHaveLength(0);
    const state = deployedCrewState();
    const nodes = crew(state);
    expect(people(nodes)).toHaveLength(7);
    expect(new Set(people(nodes).map(node => node.props.name)).size).toBe(7);
    expect(new Set(people(nodes).map(node => JSON.stringify(node.props.position))).size).toBe(7);
    expect(people(nodes).every(node => node.props.scale === 1)).toBe(true);
    const { result } = renderHook(() => Effects({ state }));
    const rooftop = elements(result.current).find(node => typeof node.type === "function" && node.type.name === "RooftopResponse")!;
    const roofNodes = elements((rooftop.type as (props: unknown) => ReactNode)(rooftop.props));
    expect(roofNodes.filter(node => node.props.name?.startsWith("rooftop-person-"))).toHaveLength(4);
    expect(roofNodes.filter(node => node.type === Tag).map(node => labelText(node.props.children))).toContain("楼顶受困 · 4 人");
  });

  it("keeps all firefighters on the ground throughout delivery, boarding, transfer and reset", () => {
    for (const time of [0, 35, 38, 43, 60, 63, 66, 72]) {
      const { state, cargo } = cargoState(time);
      Object.assign(cargo, { airRescueBoarding: time === 38 ? .5 : 0,
        airRescuePassenger: time >= 39, airRescueDelivered: time >= 64 });
      const nodes = people(crew(state));
      expect(nodes).toHaveLength(7);
      for (const node of nodes) {
        const position = node.props.position!;
        expect(position.every(Number.isFinite)).toBe(true);
        expect(node.props.rotation!.every(Number.isFinite)).toBe(true);
        expect(position[1], `${node.props.name} at ${time}s`).toBe(SURFACE_Y);
      }
    }
    expect(people(crew(createInitialState()))).toHaveLength(0);
  });

  it("does not perform device operations before the associated modules are deployed", () => {
    const nodes = crew(deployedCrewState());
    expect(action(nodes, "commander")).toBe("radio");
    for (const id of ["water-operator", "dog-handler", "cargo-operator", "rescue-observer", "ground-receiver", "ground-support"]) {
      expect(action(nodes, id)).toBe("standby");
    }
  });

  it("operates the water module only after actual deployment and connection", () => {
    const state = deployedCrewState(), pump = state.units.find(unit => unit.id === "M01")!;
    Object.assign(pump, { status: "working", deployment: 5, position: [...STAGING.M01.position] });
    expect(action(crew(state), "water-operator")).toBe("standby");
    state.water.connected = true;
    expect(action(crew(state), "water-operator")).toBe("operate");
    pump.status = "returning";
    expect(action(crew(state), "water-operator")).toBe("standby");
  });

  it("shows the robot handler operating only when actual robots are deployed", () => {
    const state = deployedCrewState(), dogs = state.units.find(unit => unit.id === "D01")!;
    Object.assign(dogs, { status: "working", deployment: 5, position: [...STAGING.D01.position] });
    state.phase = 2;
    expect(action(crew(state), "dog-handler")).toBe("standby");
    state.phase = 3;
    expect(action(crew(state), "dog-handler")).toBe("operate");
    dogs.status = "fault";
    expect(action(crew(state), "dog-handler")).toBe("standby");
  });

  it("does not mistake early lifting authorization or a supply flight for a passenger arriving", () => {
    const { state, cargo } = cargoState(22);
    cargo.airRescueRequested = true;
    expect(action(crew(state), "cargo-operator")).toBe("operate");
    for (const id of ["ground-receiver", "ground-support"]) expect(action(crew(state), id)).toBe("standby");
    cargo.airTime = AIRCRAFT_TIMING.roofRescue.groundLower;
    for (const id of ["ground-receiver", "ground-support"]) expect(action(crew(state), id)).toBe("standby");
  });

  it("uses a ground radio observer during boarding and withdrawal without an invented roof access route", () => {
    const { state, cargo } = cargoState(38);
    state.flags.liftConcept = true;
    state.life.confirmed = true;
    state.approvals.lift = true;
    Object.assign(cargo, { airRescueBoarding: 0.5, airLiftDeployment: 1 });
    const observer = member(crew(state), "rescue-observer");
    expect(observer.props.position![1]).toBe(SURFACE_Y);
    expect(observer.props.userData!.action).toBe("radio");
    expect(observer.props.userData!.duty).toBe("登篮观察联络");
    state.approvals.lift = false;
    expect(member(crew(state), "rescue-observer").props.userData!.duty).toBe("撤回观察联络");
    expect(action(crew(state), "rescue-observer")).toBe("radio");
  });

  it("observes roof deliveries from the ground without pretending to receive supplies there", () => {
    const { state, cargo } = cargoState(33);
    expect(action(crew(state), "rescue-observer")).toBe("radio");
    cargo.airTime = 35;
    expect(member(crew(state), "rescue-observer").props.userData!.duty).toBe("楼顶通信联络");
    state.metrics.delivered = 4;
    const observer = member(crew(state), "rescue-observer"), position = observer.props.position!;
    expect(position[1]).toBe(SURFACE_Y);
    expect(observer.props.userData!.action).toBe("radio");
    expect(observer.props.userData!.duty).toBe("物资到达复核");
    expect(observer.props.rotation![1]).toBeCloseTo(Math.atan2(
      ROOFTOP_CARGO_LANDING[0] - position[0], ROOFTOP_CARGO_LANDING[2] - position[2],
    ), 8);
    cargo.airReturning = true;
    expect(member(crew(state), "rescue-observer").props.userData!.duty).toBe("回收联络");
    cargo.airReturning = false;
    cargo.airTime = AIRCRAFT_TIMING.cargo.mission;
    expect(action(crew(state), "rescue-observer")).toBe("standby");
  });

  it("waits for the occupied aircraft to approach before guiding and receiving", () => {
    const { state, cargo } = cargoState(42);
    Object.assign(cargo, { airRescuePassenger: true, airLiftDeployment: 1 });
    expect(action(crew(state), "ground-receiver")).toBe("standby");
    cargo.airTime = AIRCRAFT_TIMING.roofRescue.groundApproach + 1;
    expect(action(crew(state), "ground-receiver")).toBe("guide");
    cargo.airTime = AIRCRAFT_TIMING.roofRescue.groundLower + 1;
    expect(action(crew(state), "ground-receiver")).toBe("receive");
    expect(action(crew(state), "ground-support")).toBe("receive");
    cargo.airRescueDelivered = true;
    expect(member(crew(state), "ground-receiver").props.userData!.duty).toBe("交接完成");
  });

  it("tracks occupied recovery using the existing rescue clock, not a reset airTime", () => {
    const { state, cargo } = cargoState(0);
    Object.assign(cargo, { airRescuePassenger: true, airRescueRecovery: true, airReturning: true,
      airReturnTime: AIRCRAFT_TIMING.roofRescue.groundLower + 1 - 41, airReturnFrom: 41, airLiftDeployment: 1 });
    expect(action(crew(state), "ground-receiver")).toBe("receive");
    expect(member(crew(state), "cargo-operator").props.userData!.duty).toBe("回收监护");
  });

  it("freezes gesture inputs on pause, has stable positions and resets without duplicating people", () => {
    const { state, cargo } = cargoState(60);
    Object.assign(cargo, { airRescuePassenger: true });
    state.time = 86;
    const positions = people(crew(state)).map(node => node.props.position);
    state.playing = false;
    const paused = crew(state);
    expect(people(paused).map(node => node.props.position)).toEqual(positions);
    const models = paused.filter(node => typeof node.type === "function" && node.type.name === "FirefighterModel");
    expect(models).toHaveLength(7);
    expect(models.every(node => node.props.time === state.time)).toBe(true);
    const poses = (nodes: Element[]) => people(nodes).map(node => [node.props.position, node.props.rotation, node.props.userData]);
    expect(poses(crew(state))).toEqual(poses(paused));
    state.complete = true;
    expect(people(crew(state)).every(node => node.props.userData!.action === "standby")).toBe(true);
    const reset = crew(createInitialState());
    expect(people(reset)).toHaveLength(0);
  });

  it("preserves simulation state, four civilian identities, and both rescue counters", () => {
    const { state, cargo } = cargoState(66);
    Object.assign(cargo, { airRescuePassenger: true, airRescueDelivered: true });
    state.life.rescued = 2;
    const original = structuredClone(state);
    crew(state);
    expect(state).toEqual(original);
  });

  it("routes crew selection to their related existing module without dispatching it", () => {
    const state = deployedCrewState(), onSelect = vi.fn();
    const before = structuredClone(state);
    const nodes = crew(state, "incident", onSelect);
    for (const [id, target] of [["commander", "incident"], ["water-operator", "M01"], ["dog-handler", "D01"],
      ["cargo-operator", "C01"], ["rescue-observer", "C01"], ["ground-receiver", "C01"], ["ground-support", "C01"]]) {
      const stopPropagation = vi.fn();
      member(nodes, id).props.onClick!({ stopPropagation });
      expect(stopPropagation).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenLastCalledWith(target);
    }
    expect(state).toEqual(before);
  });

  it("keeps ordinary-view crew labels restrained and shows relevant module duties when selected", () => {
    const state = deployedCrewState();
    const labels = (id: string) => crew(state, id).filter(node => node.type === Tag).map(node => labelText(node.props.children));
    expect(labels("incident")).toEqual(["消防指挥 · 人机协同"]);
    expect(labels("M01")).toEqual(["供水保障员 · 等待接管"]);
    const cargoLabels = labels("C01");
    expect(cargoLabels).toHaveLength(3);
    expect(cargoLabels.some(text => text.startsWith("观察联络员"))).toBe(true);
    expect(cargoLabels.join(" ")).not.toContain("楼顶消防员");
    expect(cargoLabels.some(text => text.startsWith("地面接应组"))).toBe(true);
  });
});
