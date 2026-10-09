// @vitest-environment jsdom
import { Children, isValidElement, useLayoutEffect, type ComponentProps, type ReactElement, type ReactNode, type RefObject } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { Group } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BoosterModule,
  CargoLaunchFrame,
  FireAircraft,
  FireAirport,
  HeavyCargoAircraft,
  Vehicle,
} from "./Vehicles";
import { Tag } from "./City";
import { createUnits } from "../simulation/data";
import type { UnitState, Vec3 } from "../types";

const frameHarness = vi.hoisted(() => ({
  callback: undefined as undefined | (() => void),
  priority: 0,
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: () => void, priority = 0) => {
    frameHarness.callback = callback;
    frameHarness.priority = priority;
  },
}));

const renderVehicle = (Vehicle as unknown as {
  type: (props: ComponentProps<typeof Vehicle>) => ReactElement<{
    ref: RefObject<Group | null>;
    position: Vec3;
  }>;
}).type;

function VehiclePoseHarness({ unit, body }: { unit: UnitState; body: Group }) {
  const tree = renderVehicle({ unit, time: 10, selected: true, onSelect: () => {}, rescue: false });
  const ref = tree.props.ref;
  useLayoutEffect(() => {
    ref.current = body;
    body.position.set(...tree.props.position);
    return () => { ref.current = null; };
  }, [body, ref]);
  return null;
}

afterEach(cleanup);

function named(node: ReactNode): string[] {
  if (!isValidElement<{ name?: string; children?: ReactNode }>(node)) return [];
  return [
    node.props.name ?? "",
    ...Children.toArray(node.props.children).flatMap(named),
  ];
}

describe("aircraft and pump equipment models", () => {
  it("uses twelve visible coaxial rotors for the heavy cargo frame", () => {
    const nodes = named(HeavyCargoAircraft({ time: 0 }));
    expect(
      nodes.filter((name) => name.startsWith("cargo-rotor-")),
    ).toHaveLength(12);
    expect(nodes).toContain("cargo-main-winch");
    expect(nodes).toContain("cargo-rescue-winch");
  });
  it("attaches all fire aircraft to the hose and reserves the nozzle for its end", () => {
    for (let index = 0; index < 3; index++) {
      const nodes = named(FireAircraft({ time: 0, index }));
      expect(nodes.includes("fire-nozzle")).toBe(index === 2);
      expect(nodes).toContain("fire-hose-hook");
    }
  });
  it("provides three carrier launch pads and a physical hose reel", () => {
    const nodes = named(FireAirport());
    expect(
      nodes.filter((name) => name.startsWith("fire-launch-pad-")),
    ).toHaveLength(3);
    expect(nodes).toContain("fire-carrier-reel");
    expect(nodes).toContain("fire-carrier-inlet");
    expect(
      nodes.filter((name) => name.startsWith("fire-dock-cradle-")),
    ).toHaveLength(6);
  });
  it("mounts the booster ports and cargo launch frame on their mobile carriers", () => {
    expect(named(BoosterModule())).toContain("booster-inlet");
    expect(named(BoosterModule())).toContain("booster-outlet");
    expect(named(CargoLaunchFrame())).toContain("cargo-launch-frame");
  });
  it("lets the selected vehicle supply the single booster label", () => {
    expect(
      Children.toArray(BoosterModule({ label: false }).props.children).some(
        (node) => isValidElement(node) && node.type === Tag,
      ),
    ).toBe(false);
  });
});

describe("vehicle frame ordering", () => {
  it("commits this frame's position and heading before annotation projection", () => {
    const unit = createUnits().find(item => item.id === "M01")!;
    const body = new Group();
    const view = render(<VehiclePoseHarness unit={unit} body={body} />);
    act(() => frameHarness.callback!());
    const next: UnitState = { ...unit, position: [-6, .18, -2], heading: Math.PI / 3, status: "enroute" };
    view.rerender(<VehiclePoseHarness unit={next} body={body} />);
    const observed = { position: [] as number[], heading: Number.NaN };
    const callbacks = [
      { priority: frameHarness.priority, run: () => frameHarness.callback!() },
      { priority: -.25, run: () => {
        observed.position = body.position.toArray();
        observed.heading = body.rotation.y;
      } },
    ];
    act(() => callbacks.sort((a, b) => a.priority - b.priority).forEach(frame => frame.run()));
    expect(observed.position).toEqual(next.position);
    expect(observed.heading).toBe(next.heading);
    expect(frameHarness.priority).toBeGreaterThan(-.5);
    expect(frameHarness.priority).toBeLessThan(-.25);
  });
});
