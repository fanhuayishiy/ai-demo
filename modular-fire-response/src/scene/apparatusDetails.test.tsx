// @vitest-environment jsdom
import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { Box3, BufferGeometry, Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Rotorcraft, Vehicle } from "./Vehicles";
import { Tag } from "./City";
import { createUnits } from "../simulation/data";
import { VEHICLE_SCALE } from "../spatial/layout";
import type { UnitKind, Vec3 } from "../types";

vi.mock("@react-three/fiber", () => ({ useFrame: () => {} }));

type Element = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
const renderVehicle = (Vehicle as unknown as {
  type: (props: ComponentProps<typeof Vehicle>) => Element;
}).type;

function vehicleTree(unit = createUnits()[0], time = 0) {
  let tree: Element | undefined;
  function Harness() {
    tree = renderVehicle({ unit, time, selected: false, rescue: false, onSelect: () => {} });
    return null;
  }
  const mounted = render(<Harness />);
  mounted.unmount();
  return tree!;
}

function expanded(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<Record<string, unknown> & { children?: ReactNode }>(child)) return [];
    const ownChildren = typeof child.type === "function" && child.type !== Tag
      ? (child.type as (props: Element["props"]) => ReactNode)(child.props)
      : child.props.children;
    return [child, ...expanded(ownChildren)];
  });
}

function named(tree: ReactNode, name: string): Element {
  const found = expanded(tree).find(node => node.props.name === name);
  expect(found, `rendered apparatus part ${name}`).toBeDefined();
  return found!;
}

function detailBounds(node: Element, parent = new Matrix4()): Box3 {
  const position = (node.props.position ?? [0, 0, 0]) as Vec3;
  const rotation = (node.props.rotation ?? [0, 0, 0]) as Vec3;
  const scale = node.props.scale ?? 1;
  const transform = new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromEuler(new Euler(...rotation)),
    typeof scale === "number" ? new Vector3(scale, scale, scale) : new Vector3(...scale as Vec3),
  );
  const world = parent.clone().multiply(transform);
  const bounds = new Box3();
  if (node.props.geometry instanceof BufferGeometry) {
    node.props.geometry.computeBoundingBox();
    bounds.union(node.props.geometry.boundingBox!.clone().applyMatrix4(world));
  }
  for (const child of Children.toArray(node.props.children)) {
    if (isValidElement<Element["props"]>(child)) bounds.union(detailBounds(child, world));
  }
  return bounds;
}

function material(tree: ReactNode, name: string) {
  const part = named(tree, name);
  expect(part.props.material).toBeInstanceOf(MeshStandardMaterial);
  return part.props.material as MeshStandardMaterial;
}

afterEach(cleanup);

describe("reference-inspired apparatus detailing", () => {
  it("builds a stepped cab with glazing, mirrors, grille, and treaded steps", () => {
    const tree = vehicleTree();
    for (const name of ["cab-paint", "cab-glazing", "cab-mirrors", "cab-grille", "cab-headlamps", "cab-step-treads"]) {
      const part = named(tree, name);
      expect(part.props.geometry).toBeInstanceOf(BufferGeometry);
      expect((part.props.geometry as BufferGeometry).getAttribute("position").count).toBeGreaterThan(12);
    }
    const paint = material(tree, "cab-paint");
    const glass = material(tree, "cab-glazing");
    expect(paint.roughness).toBeLessThanOrEqual(.35);
    expect(paint.metalness).toBeGreaterThan(.1);
    expect(paint.emissiveIntensity).toBe(0);
    expect(glass.roughness).toBeLessThan(.2);
    expect(glass.metalness).toBeGreaterThan(.2);
    for (const name of ["cab-mirrors", "cab-grille", "cab-headlamps", "cab-step-treads"]) {
      expect(named(tree, name).props.castShadow).not.toBe(true);
    }
  });

  it("keeps cab and paired mirrors inside the existing rolling footprint", () => {
    const tree = vehicleTree();
    const cab = detailBounds(named(tree, "apparatus-cab"));
    expect(cab.isEmpty()).toBe(false);
    expect(cab.min.x).toBeGreaterThanOrEqual(-4.1 - 1e-5);
    expect(cab.max.x).toBeLessThanOrEqual(3.75 + 1e-5);
    expect(cab.min.y).toBeGreaterThanOrEqual(.6);
    expect(cab.max.y).toBeLessThanOrEqual(3.125 + 1e-5);
    expect(cab.min.z).toBeGreaterThanOrEqual(-1.665 - 1e-5);
    expect(cab.max.z).toBeLessThanOrEqual(1.665 + 1e-5);
    const mirrors = detailBounds(named(tree, "cab-mirrors"));
    expect(mirrors.min.z).toBeLessThan(-1.4);
    expect(mirrors.max.z).toBeGreaterThan(1.4);
  });

  it("gives all four wheels matte tires, metal rims, and recessed hubs", () => {
    const tree = vehicleTree();
    const wheels = expanded(tree).filter(node => node.props.name === "apparatus-wheel");
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      const rubber = material(wheel, "wheel-rubber");
      const rim = material(wheel, "wheel-rim");
      expect(rubber.roughness).toBeGreaterThanOrEqual(.9);
      expect(rubber.metalness).toBe(0);
      expect(rim.roughness).toBeLessThan(.4);
      expect(rim.metalness).toBeGreaterThanOrEqual(.65);
      expect(named(wheel, "wheel-hub").props.geometry).toBeInstanceOf(BufferGeometry);
      const bounds = detailBounds(wheel);
      expect(bounds.min.x).toBeGreaterThanOrEqual(-.74 - 1e-5);
      expect(bounds.max.x).toBeLessThanOrEqual(.74 + 1e-5);
      expect(bounds.min.y).toBeGreaterThanOrEqual(-.74 - 1e-5);
      expect(bounds.max.y).toBeLessThanOrEqual(.74 + 1e-5);
      expect(bounds.min.z).toBeGreaterThanOrEqual(-.215 - 1e-5);
      expect(bounds.max.z).toBeLessThanOrEqual(.215 + 1e-5);
    }
  });

  it("keeps the hub and lug faces visible above the solid rim without coplanar faces", () => {
    const tree = vehicleTree();
    expect(detailBounds(named(tree, "wheel-rim")).max.z).toBeGreaterThan(.211);
    const hub = named(tree, "wheel-hub").props.geometry as BufferGeometry;
    const vertices = hub.getAttribute("position");
    let centerFace = -Infinity;
    for (let index = 0; index < vertices.count; index++) {
      if (Math.hypot(vertices.getX(index), vertices.getY(index)) < .2) {
        centerFace = Math.max(centerFace, vertices.getZ(index));
      }
    }
    expect(centerFace).toBeGreaterThan(.209);
    expect(centerFace).toBeLessThanOrEqual(.215);
  });

  it("retains twelve compact carriers and details every equipment family", () => {
    const units = createUnits();
    expect(units).toHaveLength(12);
    expect(new Set(units.map(unit => unit.kind)).size).toBe(10);
    for (const unit of units) {
      const tree = vehicleTree(unit);
      expect(tree.props.position).toEqual(unit.position);
      expect(tree.props.scale).toBe(VEHICLE_SCALE);
      const details = named(tree, `apparatus-${unit.kind}-details`);
      const bounds = detailBounds(details);
      expect(bounds.isEmpty()).toBe(false);
      expect(bounds.min.x).toBeGreaterThanOrEqual(-4.1 - 1e-5);
      expect(bounds.max.x).toBeLessThanOrEqual(1.3 + 1e-5);
      expect(bounds.min.z).toBeGreaterThanOrEqual(-1.665 - 1e-5);
      expect(bounds.max.z).toBeLessThanOrEqual(1.665 + 1e-5);
    }
  });

  it("keeps new carrier detail strictly below the aircraft launch surfaces", () => {
    const deckTops: Partial<Record<UnitKind, number>> = { "fire-drone": 2.3, cargo: 1.925, recon: 2.05 };
    for (const unit of createUnits().filter(unit => unit.kind in deckTops)) {
      const bounds = detailBounds(named(vehicleTree(unit), `apparatus-${unit.kind}-details`));
      expect(bounds.max.y).toBeLessThanOrEqual(deckTops[unit.kind]! + 1e-5);
    }
  });

  it("keeps fixed equipment detail below the original module roof limits", () => {
    const roofLimits: Partial<Record<UnitKind, number>> = {
      water: 3.925, booster: 3.54, power: 3.425, dog: 2.9, tools: 3.525, boom: 2.2, ladder: 2.25,
    };
    for (const unit of createUnits().filter(unit => unit.kind in roofLimits)) {
      const bounds = detailBounds(named(vehicleTree(unit), `apparatus-${unit.kind}-details`));
      expect(bounds.max.y).toBeLessThanOrEqual(roofLimits[unit.kind]! + 1e-5);
    }
  });

  it("uses real shutter ribs, equipment racks, and a wound hose reel", () => {
    const units = createUnits();
    const tools = vehicleTree(units.find(unit => unit.kind === "tools")!);
    expect(named(tools, "module-shutter-ribs").props.geometry).toBeInstanceOf(BufferGeometry);
    expect(named(tools, "module-roof-rack").props.geometry).toBeInstanceOf(BufferGeometry);
    const water = vehicleTree(units.find(unit => unit.kind === "water")!);
    expect(named(water, "module-hose-reel").props.geometry).toBeInstanceOf(BufferGeometry);
    expect(named(water, "module-tank-bands").props.geometry).toBeInstanceOf(BufferGeometry);
  });

  it("supports the water-side shutters with locker housings connected to the chassis", () => {
    const water = vehicleTree(createUnits().find(unit => unit.kind === "water")!);
    const backing = detailBounds(named(water, "module-compartment-bodies"));
    expect(backing.min.y).toBeLessThanOrEqual(1.25);
    expect(backing.max.y).toBeGreaterThan(1.95);
    expect(backing.min.z).toBeLessThanOrEqual(-1.3);
    expect(backing.max.z).toBeGreaterThanOrEqual(1.3);
    expect(backing.max.x).toBeGreaterThanOrEqual(1.199);
  });

  it("shares static detail geometry across time updates without new light objects", () => {
    const a = vehicleTree(undefined, 0);
    const b = vehicleTree(undefined, 12);
    for (const name of ["cab-paint", "cab-glazing", "cab-mirrors", "cab-grille", "wheel-rim"]) {
      expect(named(a, name).props.geometry).toBe(named(b, name).props.geometry);
    }
    for (const unit of createUnits()) {
      for (const deployed of [false, true]) {
        const tree = vehicleTree(deployed ? { ...unit, status: "working", deployment: 5 } : unit);
        const nodes = expanded(tree);
        expect(nodes.filter(node => /^(point|spot|directional)Light$/.test(String(node.type)))).toHaveLength(0);
        expect(nodes.filter(node => node.type === "mesh").length).toBeLessThanOrEqual(100);
        const detailMeshes = expanded(named(tree, `apparatus-${unit.kind}-details`)).filter(node => node.type === "mesh");
        expect(detailMeshes.every(node => node.props.castShadow !== true)).toBe(true);
      }
    }
  });

  it("fits the light aircraft casing and camera inside its existing central body clearance", () => {
    const skin = named(Rotorcraft({ time: 0 }), "rotorcraft-skin");
    const bounds = detailBounds(skin);
    expect(bounds.isEmpty()).toBe(false);
    expect(bounds.min.x).toBeGreaterThanOrEqual(-.9 - 1e-5);
    expect(bounds.max.x).toBeLessThanOrEqual(.9 + 1e-5);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-.6 - 1e-5);
    expect(bounds.max.y).toBeLessThanOrEqual(.5 + 1e-5);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-.6 - 1e-5);
    expect(bounds.max.z).toBeLessThanOrEqual(.6 + 1e-5);
    expect(named(skin, "rotorcraft-camera").props.geometry).toBeInstanceOf(BufferGeometry);
  });
});
