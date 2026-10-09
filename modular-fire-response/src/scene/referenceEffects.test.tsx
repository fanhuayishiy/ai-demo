// @vitest-environment node
import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Flame, FireFlights } from "./Effects";
import { createUnits } from "../simulation/data";
import { STAGING } from "../spatial/layout";

type Props = { name?: string; children?: ReactNode; time?: number; intensity?: number };
function elements(node: ReactNode): { type: unknown; props: Props }[] {
  if (!isValidElement<Props>(node)) return [];
  return [{ type: node.type, props: node.props }, ...Children.toArray(node.props.children).flatMap(elements)];
}

describe("reference-style incident rendering", () => {
  it("replaces solid polygon flames with a simulation-driven particle field", () => {
    const frame = elements(Flame({ time: 35, intensity: .8 }));
    expect(frame.some(node => node.type === "coneGeometry")).toBe(false);
    const particles = frame.find(node => node.props.name === "incident-particles");
    expect(particles).toBeDefined();
    expect(particles?.props.time).toBe(35);
    expect(particles?.props.intensity).toBe(.8);
  });
  it("uses a mist-producing water jet only at the ready, supplied hose end", () => {
    const initial = createUnits().find(unit => unit.id === "F01")!;
    const unit = { ...initial, position: STAGING.F01.position, status: "working" as const, deployment: 5, airTime: 30 };
    const jets = (spray: boolean) => elements(FireFlights({ unit, time: 40, spray }))
      .filter(node => typeof node.type === "function" && node.type.name === "WaterJet");
    expect(jets(true)).toHaveLength(1);
    expect(jets(false)).toHaveLength(0);
    unit.airReturning = true;
    expect(jets(true)).toHaveLength(0);
  });
});
