import { Children, isValidElement, type ReactNode } from "react";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SimulationState, UnitState, Vec3 } from "../types";
import { createInitialState } from "../simulation";
import { STAGING } from "../spatial/layout";
import { CargoFlight, Effects } from "./Effects";
import { rescueBasketPose } from "./aircraft";
import { Beam, Box } from "./Primitives";

type Props = {
  name?: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
  children?: ReactNode;
  userData?: { phase?: string };
  s?: Vec3;
  from?: Vec3;
  to?: Vec3;
};
type Element = { type: unknown; props: Props };
const elements = (node: ReactNode): Element[] => {
  if (!isValidElement<Props>(node)) return [];
  return [{ type: node.type, props: node.props }, ...Children.toArray(node.props.children).flatMap(elements)];
};
const named = (nodes: Element[], name: string) => nodes.find(node => node.props.name === name);

function scene(airTime = 0) {
  const state = createInitialState();
  const unit = state.units.find(unit => unit.id === "C01")!;
  Object.assign(unit, { position: [...STAGING.C01.position], heading: 0, status: "working", deployment: 5, airTime });
  return { state, unit };
}
function rooftop(state: SimulationState) {
  const { result } = renderHook(() => Effects({ state, selectedId: "C01" }));
  const component = elements(result.current).find(node =>
    typeof node.type === "function" && node.type.name === "RooftopResponse",
  );
  expect(component, "Effects must include the rooftop receiving scene").toBeDefined();
  return elements((component!.type as (props: unknown) => ReactNode)(component!.props));
}
const firstPerson = (state: SimulationState) => named(rooftop(state), "rooftop-person-0")!;
const basketFeet = (unit: UnitState): Vec3 => {
  const basket = rescueBasketPose(unit);
  return [basket.position[0], basket.position[1] + 0.08 * basket.scale, basket.position[2]];
};
afterEach(cleanup);

describe("rooftop supply and rescue scene", () => {
  it("shows four individually placed people and receiving marks above the actual roof", () => {
    const { state } = scene();
    const nodes = rooftop(state);
    const people = nodes.filter(node => node.props.name?.startsWith("rooftop-person-"));
    expect(people).toHaveLength(4);
    expect(new Set(people.map(person => JSON.stringify(person.props.position))).size).toBe(4);
    for (const person of people) {
      expect(person.props.position![1]).toBeGreaterThanOrEqual(29.025);
      expect(person.props.position![1]).toBeLessThan(29.1);
      expect(person.props.scale).toBe(1);
      expect(person.props.userData?.phase).toBe("waiting");
    }
    expect(named(nodes, "rooftop-receiving-area")).toBeDefined();
    expect(named(nodes, "ground-receiving-area")).toBeDefined();
  });

  it("walks the same person into a grounded basket only during boarding", () => {
    const { state, unit } = scene(38);
    Object.assign(unit, { airLiftDeployment: 1, airRescueBoarding: 0 });
    const waiting = firstPerson(state).props.position!;
    Object.assign(unit, { airRescueBoarding: 0.5 });
    const halfway = firstPerson(state);
    expect(halfway.props.userData?.phase).toBe("boarding");
    basketFeet(unit).forEach((value, axis) =>
      expect(halfway.props.position![axis]).toBeCloseTo(axis === 1 ? value : (waiting[axis] + value) / 2, 8),
    );
    Object.assign(unit, { airRescueBoarding: 1, airRescuePassenger: true });
    expect(firstPerson(state).props.position).toEqual(basketFeet(unit));
    expect(rooftop(state).filter(node => node.props.name?.startsWith("rooftop-person-"))).toHaveLength(4);
  });

  it("keeps the boarded person full-size and attached while the winch retracts and aircraft flies", () => {
    const { state, unit } = scene(50);
    Object.assign(unit, { airRescuePassenger: true, airRescueBoarding: 1, airLiftDeployment: 0 });
    const person = firstPerson(state);
    expect(person.props.position).toEqual(basketFeet(unit));
    expect(person.props.scale).toBe(1);
    expect(person.props.userData?.phase).toBe("airborne");
    const basket = named(elements(CargoFlight({ unit, time: 80, delivered: 4 })), "rescue-basket")!;
    const gates = Children.toArray(basket.props.children).flatMap(elements)
      .filter(node => node.props.name?.startsWith("rescue-basket-gate-"));
    expect(gates).toHaveLength(2);
    for (const gate of gates) {
      expect(elements(gate.props.children).find(node => node.type === Box)?.props.s?.[1]).toBeGreaterThanOrEqual(0.7);
      expect(gate.props.rotation?.[1]).toBe(0);
    }
  });

  it("moves the passenger from the grounded basket to the receiving area before marking them safe", () => {
    const { state, unit } = scene(62);
    Object.assign(unit, { airRescuePassenger: true, airRescueBoarding: 1, airLiftDeployment: 1 });
    const start = firstPerson(state).props.position!;
    unit.airTime = 63;
    const midway = firstPerson(state);
    expect(midway.props.userData?.phase).toBe("handoff");
    unit.airTime = 64;
    Object.assign(unit, { airRescueDelivered: true });
    const end = firstPerson(state);
    expect(end.props.position).toEqual([44.7, 0.18, -23.5]);
    expect(end.props.userData?.phase).toBe("safe");
    expect(midway.props.position![0]).toBeGreaterThan(start[0]);
    expect(midway.props.position![0]).toBeLessThan(end.props.position![0]);
    expect(midway.props.position![1]).toBe(start[1]);
    expect(midway.props.position![2]).toBe(start[2]);
    unit.position = [50, 0.18, -42];
    unit.airTime = 72;
    expect(firstPerson(state).props.position).toEqual(end.props.position);
    expect(state.life.rescued).toBe(0);
  });

  it("uses recovery time for a recalled occupied aircraft without moving the person at recall", () => {
    const { state, unit } = scene(50);
    Object.assign(unit, { airRescuePassenger: true, airRescueBoarding: 1, airLiftDeployment: 0 });
    const before = firstPerson(state).props.position;
    Object.assign(unit, { airReturning: true, airReturnFrom: 50, airReturnTime: 0, airRescueRecovery: true });
    expect(firstPerson(state).props.position).toEqual(before);
    unit.airReturnTime = 13;
    unit.airLiftDeployment = 1;
    expect(firstPerson(state).props.userData?.phase).toBe("handoff");
  });

  it("restores all four people to the rooftop on simulation reset", () => {
    const { state, unit } = scene(72);
    Object.assign(unit, { airRescuePassenger: true, airRescueDelivered: true });
    expect(firstPerson(state).props.userData?.phase).toBe("safe");
    const reset = rooftop(createInitialState()).filter(node => node.props.name?.startsWith("rooftop-person-"));
    expect(reset).toHaveLength(4);
    expect(reset.every(node => node.props.userData?.phase === "waiting")).toBe(true);
  });

  it("opens the actual entry side before boarding and the exit side at ground handoff", () => {
    const { unit } = scene(38);
    Object.assign(unit, { airLiftDeployment: 1, airRescueBoarding: 0.5 });
    const frame = () => elements(CargoFlight({ unit, time: 80, delivered: 4 }));
    const gate = (side: number) => named(frame(), `rescue-basket-gate-${side}`);
    expect(gate(-1)?.props.rotation?.[1]).toBeCloseTo(-Math.PI / 2);
    expect(gate(1)?.props.rotation?.[1]).toBe(0);
    Object.assign(unit, { airTime: 63, airRescueBoarding: 1, airRescuePassenger: true });
    expect(gate(-1)?.props.rotation?.[1]).toBe(0);
    expect(gate(1)?.props.rotation?.[1]).toBeCloseTo(Math.PI / 2);
  });

  it("keeps the lifting spreader overhead instead of routing diagonal slings through the entry", () => {
    const { unit } = scene(50);
    Object.assign(unit, { airLiftDeployment: 0, airRescueBoarding: 1, airRescuePassenger: true });
    const frame = named(elements(CargoFlight({ unit, time: 80, delivered: 4 })), "rescue-basket-top-frame");
    expect(frame).toBeDefined();
    const spreaders = Children.toArray(frame!.props.children).flatMap(elements).filter(node => node.type === Beam);
    expect(spreaders).toHaveLength(4);
    for (const beam of spreaders) {
      expect(beam.props.from![1]).toBeCloseTo(2.1);
      expect(beam.props.to![1]).toBeCloseTo(2.1);
    }
  });
});
