// @vitest-environment node
import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createUnits } from "../simulation/data";
import { STAGING } from "../spatial/layout";
import { CargoFlight, FireFlights } from "./Effects";
import { Tag } from "./City";
const names = (node: ReactNode): string[] => {
  if (!isValidElement<{ name?: string; children?: ReactNode }>(node)) return [];
  return [
    node.props.name ?? "",
    ...Children.toArray(node.props.children).flatMap(names),
  ];
};
const labels = (
  node: ReactNode,
  parent = "",
): { parent: string; text: string }[] => {
  if (!isValidElement<{ name?: string; children?: ReactNode }>(node)) return [];
  const owner = node.props.name ?? parent;
  if (node.type === Tag) {
    return [
      { parent: owner, text: Children.toArray(node.props.children).join("") },
    ];
  }
  return Children.toArray(node.props.children).flatMap((child) =>
    labels(child, owner),
  );
};
const staged = (id: string) => ({
  ...createUnits().find((unit) => unit.id === id)!,
  position: [...STAGING[id].position] as [number, number, number],
  heading: 0,
  status: "working" as const,
  deployment: 5,
});

describe("visible flight effects", () => {
  it("retains all three aircraft at their carrier before launch", () => {
    expect(
      names(FireFlights({ unit: staged("F01"), time: 0, spray: true })).filter(
        (name) => name.startsWith("fire-aircraft-"),
      ),
    ).toHaveLength(3);
    expect(
      names(FireFlights({ unit: staged("F01"), time: 0, spray: true })).filter(
        (name) => name.startsWith("fire-water-jet-"),
      ),
    ).toHaveLength(0);
  });
  it("waits for the whole hose chain before showing only the terminal spray", () => {
    const unit = staged("F01");
    unit.airTime = 16;
    expect(
      names(FireFlights({ unit, time: 20, spray: true })).filter((name) =>
        name.startsWith("fire-water-jet-"),
      ),
    ).toHaveLength(0);
    unit.airTime = 23;
    expect(names(FireFlights({ unit, time: 27, spray: true })).filter(name =>
      name.startsWith("fire-water-jet-"))).toHaveLength(0);
    unit.airTime = 30;
    expect(
      names(FireFlights({ unit, time: 40, spray: true })).filter((name) =>
        name.startsWith("fire-water-jet-"),
      ),
    ).toEqual(["fire-water-jet-2"]);
    expect(names(FireFlights({ unit, time: 40, spray: false })).filter(name =>
      name.startsWith("fire-water-jet-"))).toHaveLength(0);
    unit.airReturning = true;
    unit.airReturnFrom = 30;
    unit.airReturnTime = 0;
    expect(
      names(FireFlights({ unit, time: 40, spray: true })).filter((name) =>
        name.startsWith("fire-water-jet-"),
      ),
    ).toHaveLength(0);
  });
  it("shows one compact group label on the last airborne aircraft by default", () => {
    const unit = staged("F01");
    unit.airTime = 30;
    expect(labels(FireFlights({ unit, time: 30, spray: true }))).toEqual([
      { parent: "fire-aircraft-2", text: "分段托管 · 3/3 · 末端喷射" },
    ]);
  });
  it("updates the compact label count and anchor during launch and return", () => {
    const unit = staged("F01");
    expect(labels(FireFlights({ unit, time: 0, spray: false }))).toEqual([]);
    unit.airTime = 8;
    expect(labels(FireFlights({ unit, time: 8, spray: false }))).toEqual([
      { parent: "fire-aircraft-1", text: "分段托管 · 2/3 · 依次起飞" },
    ]);
    unit.airTime = 30;
    unit.airReturning = true;
    unit.airReturnFrom = 30;
    unit.airReturnTime = 17;
    expect(labels(FireFlights({ unit, time: 47, spray: false }))).toEqual([
      { parent: "fire-aircraft-1", text: "分段托管 · 2/3 · 收管返航" },
    ]);
  });
  it("retains individual airborne labels when detail is selected", () => {
    const unit = staged("F01");
    unit.airTime = 30;
    expect(
      labels(
        FireFlights({ unit, time: 30, spray: true, detailedLabels: true }),
      ),
    ).toEqual([
      { parent: "fire-aircraft-0", text: "托管机 01 · 下段承托" },
      { parent: "fire-aircraft-1", text: "托管机 02 · 中段承托" },
      { parent: "fire-aircraft-2", text: "喷射机 03 · 末端喷射" },
    ]);
  });
  it("shows the terminal waiting for water when the supports are already in position", () => {
    const unit = { ...staged("F01"), airTime: 30 };
    expect(labels(FireFlights({ unit, time: 30, spray: false }))).toEqual([
      { parent: "fire-aircraft-2", text: "分段托管 · 3/3 · 等待供水" },
    ]);
    expect(labels(FireFlights({ unit, time: 30, spray: false, detailedLabels: true })).at(-1)).toEqual({
      parent: "fire-aircraft-2", text: "喷射机 03 · 等待供水",
    });
  });
  it("identifies the waiting aircraft during a selected sequential launch", () => {
    const unit = staged("F01");
    unit.airTime = 2;
    expect(labels(FireFlights({ unit, time: 2, spray: false, detailedLabels: true }))).toEqual([
      { parent: "fire-aircraft-0", text: "托管机 01 · 提管起飞" },
      { parent: "fire-aircraft-1", text: "托管机 02 · 待起飞" },
      { parent: "fire-aircraft-2", text: "喷射机 03 · 待起飞" },
    ]);
  });
  it("shows the preconnected hose at the deployed carrier, not while driving or stowed", () => {
    const unit = staged("F01");
    expect(names(FireFlights({ unit, time: 0, spray: false }))).toContain("shared-fire-hose");
    for (const status of ["standby", "enroute", "recalled"] as const) {
      expect(names(FireFlights({ unit: { ...unit, status }, time: 0, spray: false }))).not.toContain("shared-fire-hose");
    }
    expect(names(FireFlights({ unit: { ...unit, airTime: 30, airReturning: true, status: "returning" }, time: 40, spray: false }))).toContain("shared-fire-hose");
  });
  it("waits for the carrier to unfold before laying out the connected hose", () => {
    const unit = { ...staged("F01"), status: "deploying" as const };
    expect(names(FireFlights({ unit: { ...unit, deployment: 0.5 }, time: 0, spray: false }))).not.toContain("shared-fire-hose");
    expect(names(FireFlights({ unit: { ...unit, deployment: 1 }, time: 0, spray: false }))).toContain("shared-fire-hose");
  });
  it("keeps one heavy aircraft and four supply groups visible across the entire mission", () => {
    for (const time of [0, 4, 16, 30, 34, 50, 64]) {
      const unit = staged("C01");
      unit.airTime = time;
      const nodes = names(
        CargoFlight({ unit, time, delivered: time >= 34 ? 4 : 0 }),
      );
      expect(nodes.filter((name) => name === "cargo-aircraft")).toHaveLength(1);
      expect(
        nodes.filter((name) => name.startsWith("supply-group-")),
      ).toHaveLength(4);
      expect(nodes).toContain("rescue-basket");
    }
  });
  it("only labels the heavy aircraft while airborne, leaving docked labels to the carrier", () => {
    const tags = (node: ReactNode): number => {
      if (!isValidElement<{ children?: ReactNode }>(node)) return 0;
      return (
        Number(node.type === Tag) +
        Children.toArray(node.props.children).reduce<number>(
          (sum, child) => sum + tags(child),
          0,
        )
      );
    };
    const unit = staged("C01");
    expect(tags(CargoFlight({ unit, time: 0, delivered: 0 }))).toBe(0);
    unit.airTime = 22;
    expect(tags(CargoFlight({ unit, time: 22, delivered: 0 }))).toBe(1);
  });
  it("hides delivered supply text by default and reveals it on selection without hiding the four groups", () => {
    const unit = staged("C01");
    unit.airTime = 64;
    const overview = CargoFlight({ unit, time: 64, delivered: 4 });
    const selected = CargoFlight({
      unit,
      time: 64,
      delivered: 4,
      detailedLabels: true,
    });
    expect(labels(overview)).toEqual([]);
    expect(labels(selected)).toEqual([{ parent: "", text: "补给物资 · 4 组" }]);
    for (const view of [overview, selected]) {
      expect(
        names(view).filter((name) => name.startsWith("supply-group-")),
      ).toHaveLength(4);
    }
  });
  it.each([
    [30, false, "楼顶物资投送"],
    [50, true, "人员转运"],
    [63, true, "地面交接"],
  ] as const)("identifies the actual rooftop mission at aircraft time %s", (airTime, passenger, stage) => {
    const unit = { ...staged("C01"), airTime, airRescuePassenger: passenger, airRescueBoarding: passenger ? 1 : 0 };
    const aircraftLabel = labels(CargoFlight({ unit, time: 80, delivered: airTime >= 34 ? 4 : 0 }))
      .find(label => label.parent === "cargo-aircraft");
    expect(aircraftLabel?.text).toBe(`载重无人机 · ${stage}`);
  });
});
