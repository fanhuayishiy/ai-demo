import { Children, isValidElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../simulation";
import { Effects, FireFlights } from "./Effects";

function fireProps(node: ReactNode): { spray: boolean } | undefined {
  if (!isValidElement<{ children?: ReactNode; spray: boolean }>(node)) return undefined;
  if (node.type === FireFlights) return node.props;
  return Children.toArray(node.props.children).map(fireProps).find(Boolean);
}

function suppliedScene(outflow: number) {
  const state = createInitialState();
  state.time = 90;
  state.water.connected = true;
  state.water.outflow = outflow;
  for (const id of ["F01", "M01"]) {
    const unit = state.units.find(unit => unit.id === id)!;
    unit.status = "working";
    unit.deployment = 5;
  }
  state.units.find(unit => unit.id === "F01")!.airTime = 30;
  return state;
}

describe("fire hose visual supply gate", () => {
  it.each([0, 1e-12, 0.001])("does not show spray for exhausted flow %s", outflow => {
    const { result } = renderHook(() => Effects({ state: suppliedScene(outflow) }));
    expect(fireProps(result.current)?.spray).toBe(false);
  });

  it("passes meaningful flow to the hose chain", () => {
    const { result } = renderHook(() => Effects({ state: suppliedScene(6) }));
    expect(fireProps(result.current)?.spray).toBe(true);
  });

  it.each(["connection", "booster", "airConcept", "droneFault"] as const)("honors the %s interlock", interlock => {
    const state = suppliedScene(6);
    if (interlock === "connection") state.water.connected = false;
    if (interlock === "booster") state.units.find(unit => unit.id === "M01")!.status = "fault";
    if (interlock === "airConcept") state.flags.airConcept = false;
    if (interlock === "droneFault") state.flags.droneFault = true;
    const { result } = renderHook(() => Effects({ state }));
    expect(fireProps(result.current)?.spray).toBe(false);
  });
});
