import { Children, isValidElement, type ReactNode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { OrthographicCamera, Vector3 } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneProps, Vec3 } from "../types";
import { createInitialState } from "../simulation";
import { sceneTarget } from "./focus";
import { overviewZoom } from "./helpers";
import { sceneViewport } from "./camera";
import FireScene from "./FireScene";
import { SceneLabels } from "./ProjectedTag";

const harness = vi.hoisted(() => ({
  frame: undefined as undefined | ((state: unknown, dt: number) => void),
  priority: 0,
  camera: undefined as OrthographicCamera | undefined,
  size: { width: 1304, height: 1012 },
  controls: undefined as undefined | { target: Vector3; update: () => void; enableDamping: boolean },
  onStart: undefined as (() => void) | undefined,
  minZoom: 1.5,
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: ReactNode }) => Children.toArray(children).filter(child =>
    isValidElement(child) && typeof child.type === "function" && child.type.name === "CameraRig",
  ),
  useThree: () => ({ camera: harness.camera, size: harness.size }),
  useFrame: (frame: (state: unknown, dt: number) => void, priority = 0) => {
    harness.frame = frame;
    harness.priority = priority;
  },
}));

vi.mock("@react-three/drei", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    OrbitControls: forwardRef((props: { onStart: () => void; minZoom: number }, ref) => {
      useImperativeHandle(ref, () => harness.controls);
      harness.onStart = props.onStart;
      harness.minZoom = props.minZoom;
      return null;
    }),
    Line: () => null,
  };
});

function initialize(width = 1304, height = 1012) {
  harness.size = { width, height };
  harness.camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 600);
  harness.camera.position.set(98, 103, 120);
  harness.camera.zoom = 6;
  harness.controls = {
    target: new Vector3(8, 3, 0),
    enableDamping: true,
    update: () => {
      harness.camera!.zoom = Math.max(harness.minZoom, harness.camera!.zoom);
      harness.camera!.lookAt(harness.controls!.target);
      harness.camera!.updateProjectionMatrix();
      harness.camera!.updateMatrixWorld();
    },
  };
}

function step(frames = 300) {
  act(() => { for (let i = 0; i < frames; i++) harness.frame!({}, 1 / 60); });
}

function mount() {
  let props: SceneProps = {
    state: createInitialState(), selectedId: "incident", onSelect: vi.fn(), view: "overview",
    cameraCommand: { type: "reset", sequence: 0 }, touring: false, onTourChange: vi.fn(),
  };
  const rendered = render(<FireScene {...props} />);
  const update = (patch: Partial<SceneProps>) => {
    props = { ...props, ...patch };
    rendered.rerender(<FireScene {...props} />);
  };
  const resize = (width: number, height: number) => {
    harness.size = { width, height };
    Object.assign(harness.camera!, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
    harness.camera!.updateProjectionMatrix();
    update({});
    step();
  };
  step();
  return { update, resize, props: () => props };
}

function pose() {
  return {
    position: harness.camera!.position.toArray(),
    target: harness.controls!.target.toArray(),
    offset: harness.camera!.position.clone().sub(harness.controls!.target).toArray(),
    zoom: harness.camera!.zoom,
  };
}

function expectVector(actual: number[], expected: number[]) {
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 5));
}

function screen(point: Vec3) {
  const projected = new Vector3(...point).project(harness.camera!);
  return { x: (projected.x + 1) * harness.size.width / 2, y: (1 - projected.y) * harness.size.height / 2 };
}

beforeEach(() => initialize());
afterEach(cleanup);

describe("command composition", () => {
  it.each([
    [1672, 940],
    [1304, 1012],
    [390, 844],
    [900, 560],
  ])("uses the closer command framing without changing overview at %i x %i", (width, height) => {
    initialize(width, height);
    const app = mount();
    const overview = pose();
    app.update({ view: "command" }); step();
    expect(pose().zoom).toBeCloseTo(Math.min(12, overview.zoom * 1.7), 5);
    expectVector(pose().offset, overview.offset);
    const anchor = screen([10, 8, 7]);
    const viewport = sceneViewport(width, height);
    expect(anchor.x).toBeCloseTo(viewport.centerX, 3);
    expect(anchor.y).toBeCloseTo(viewport.centerY, 3);
    app.update({ view: "overview" }); step();
    expect(pose().zoom).toBeCloseTo(overview.zoom, 5);
    expectVector(pose().position, overview.position);
    expectVector(pose().target, overview.target);
  });

  it.each([false, true])("retains the subject zoom when leaving command with follow=%s", following => {
    initialize(1672, 940);
    const app = mount();
    const overview = pose().zoom;
    app.update({ view: "command" }); step();
    expect(pose().zoom).toBeCloseTo(Math.min(12, overview * 1.7), 5);
    app.update({ view: following ? "follow" : "command", selectedId: "C01" }); step();
    expect(pose().zoom).toBeCloseTo(Math.min(12, overview * 1.9), 5);
    const anchor = screen(sceneTarget(app.props().state, "C01", following));
    const viewport = sceneViewport(1672, 940);
    expect(anchor.x).toBeCloseTo(viewport.centerX, 3);
    expect(anchor.y).toBeCloseTo(viewport.centerY, 3);
  });

  it("atomically resets from command when view and selection also change", () => {
    const app = mount();
    const overview = pose();
    app.update({ view: "command" }); step();
    expect(pose().zoom).toBeCloseTo(Math.min(12, overview.zoom * 1.7), 5);
    app.update({ view: "follow", selectedId: "C01", cameraCommand: { type: "reset", sequence: 1 } });
    step(1);
    expect(pose().zoom).toBeCloseTo(overview.zoom, 5);
    expectVector(pose().position, overview.position);
    expectVector(pose().target, overview.target);
    expectVector(pose().offset, overview.offset);
    const state = structuredClone(app.props().state);
    state.units.find(unit => unit.id === "C01")!.position = [30, 0, 20];
    app.update({ state }); step();
    expect(pose().zoom).toBeCloseTo(overview.zoom, 5);
    expectVector(pose().position, overview.position);
    expectVector(pose().target, overview.target);
  });
});

describe("camera transitions", () => {
  it("lets reset win over a selection change in the same frame", () => {
    const app = mount();
    app.update({ selectedId: "C01" }); step();
    app.update({ selectedId: "incident", cameraCommand: { type: "reset", sequence: 1 } }); step();
    expect(harness.camera!.zoom).toBeCloseTo(overviewZoom(1304, 1012), 5);
  });

  it("restores the canonical offset after a focus and every repeated reset", () => {
    const app = mount();
    app.update({ selectedId: "C01" }); step();
    app.update({ cameraCommand: { type: "reset", sequence: 1 } }); step();
    expectVector(pose().offset, [90, 100, 120]);
    const first = pose();
    app.update({ cameraCommand: { type: "reset", sequence: 2 } }); step();
    expectVector(pose().position, first.position);
    expectVector(pose().target, first.target);
    expect(pose().zoom).toBeCloseTo(first.zoom, 5);
  });

  it("does not resume follow after reset until a new follow request", () => {
    const app = mount();
    app.update({ view: "follow", selectedId: "C01" }); step();
    app.update({ cameraCommand: { type: "reset", sequence: 1 } }); step();
    const reset = pose();
    const state = structuredClone(app.props().state);
    state.units.find(unit => unit.id === "C01")!.position = [30, 0, 20];
    app.update({ state }); step();
    expectVector(pose().target, reset.target);
    expectVector(pose().offset, [90, 100, 120]);
  });

  it("stops touring when reset is requested and keeps the reset pose", () => {
    const app = mount();
    app.update({ touring: true, state: { ...app.props().state, time: 80 } }); step();
    app.update({ cameraCommand: { type: "reset", sequence: 1 } }); step();
    expect(app.props().onTourChange).toHaveBeenCalledWith(false);
    expectVector(pose().offset, [90, 100, 120]);
  });

  it("produces the same desktop pose after desktop-mobile-desktop and mobile-desktop histories", () => {
    let app = mount();
    const desktop = pose();
    app.resize(390, 844);
    app.resize(1304, 1012);
    expectVector(pose().position, desktop.position);
    expectVector(pose().target, desktop.target);
    cleanup(); initialize(390, 844);
    app = mount(); app.resize(1304, 1012);
    expectVector(pose().position, desktop.position);
    expectVector(pose().target, desktop.target);
    expect(pose().zoom).toBeCloseTo(desktop.zoom, 5);
  });

  it("keeps manual pan and orbit intact while applying an explicit zoom", () => {
    const app = mount();
    harness.controls!.target.add(new Vector3(12, 3, -4));
    harness.camera!.position.copy(harness.controls!.target).add(new Vector3(-80, 70, 110));
    harness.onStart!();
    const manual = pose();
    app.update({ cameraCommand: { type: "zoomIn", sequence: 1 } }); step();
    expectVector(pose().target, manual.target);
    expectVector(pose().offset, manual.offset);
    expect(pose().zoom).toBeGreaterThan(manual.zoom);
  });

  it("sets a closer follow zoom when entering follow without changing selection", () => {
    const app = mount();
    const overview = pose().zoom;
    app.update({ view: "follow" }); step();
    expect(pose().zoom).toBeGreaterThan(overview * 1.5);
  });

  it("updates after controls and before projected annotations", () => {
    mount();
    expect(harness.priority).toBe(-0.5);
  });

  it("mounts exactly one annotation layout after the camera rig", () => {
    const app = mount();
    const canvas = FireScene(app.props()).props.children.props.children;
    expect(Children.toArray(canvas.props.children).filter(child => isValidElement(child) && child.type === SceneLabels)).toHaveLength(1);
  });
});

describe("unobstructed scene framing", () => {
  it.each([
    { width: 1304, height: 1012, left: 20, top: 170, right: 984, bottom: 812 },
    { width: 390, height: 844, left: 16, top: 244, right: 374, bottom: 626 },
    { width: 900, height: 560, left: 20, top: 222, right: 608, bottom: 360 },
  ])("fits every base corner within safe bounds at $width x $height", bounds => {
    initialize(bounds.width, bounds.height); mount();
    for (const x of [-81, 73]) for (const y of [-2.1, .2]) for (const z of [-60, 58]) {
      const p = screen([x, y, z]);
      expect(p.x).toBeGreaterThanOrEqual(bounds.left);
      expect(p.x).toBeLessThanOrEqual(bounds.right);
      expect(p.y).toBeGreaterThanOrEqual(bounds.top);
      expect(p.y).toBeLessThanOrEqual(bounds.bottom);
    }
  });

  it("puts a focused subject at the safe center instead of the full canvas center", () => {
    const app = mount();
    app.update({ selectedId: "C01" }); step();
    const point = screen(sceneTarget(app.props().state, "C01", false));
    expect(point.x).toBeCloseTo(502, 3);
    expect(point.y).toBeCloseTo(491, 3);
  });

  it("keeps focus and the chosen angle after resizing to mobile", () => {
    const app = mount();
    harness.camera!.position.copy(harness.controls!.target).add(new Vector3(-80, 70, 110));
    harness.onStart!();
    app.update({ selectedId: "C01" }); step();
    const offset = pose().offset;
    app.resize(390, 844);
    const point = screen(sceneTarget(app.props().state, "C01", false));
    expect(point.x).toBeCloseTo(195, 3);
    expect(point.y).toBeCloseTo(435, 3);
    expectVector(pose().offset, offset);
    expect(pose().zoom).toBeGreaterThan(overviewZoom(390, 844));
  });
});
