// @vitest-environment node
import { applyProps } from "@react-three/fiber";
import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Box3, BoxGeometry, BufferGeometry, CylinderGeometry, Euler, Group, Matrix4, Quaternion, SphereGeometry, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { C } from "./Primitives";
import { FirefighterModel, type FirefighterAction } from "./FirefighterModel";

type ModelProps = ComponentProps<typeof FirefighterModel>;
type Element = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
type MeshBounds = { bounds: Box3; transform: Matrix4; color: unknown; names: string[] };
const roles = ["command", "operator", "rescue"] as const;
const stationaryActions: FirefighterAction[] = ["standby", "radio", "operate", "guide", "receive"];
const actions: FirefighterAction[] = [...stationaryActions, "walk"];
const walkPeriod = 1.2;

function modelTree(role: ModelProps["role"] = "rescue", action: FirefighterAction = "standby", time = 0) {
  return FirefighterModel({ role, action, time });
}

function expanded(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<Element["props"]>(child)) return [];
    const children = typeof child.type === "function"
      ? (child.type as (props: Element["props"]) => ReactNode)(child.props)
      : child.props.children;
    return [child, ...expanded(children)];
  });
}

function named(node: ReactNode, name: string) {
  const part = expanded(node).find(child => child.props.name === name);
  expect(part, `firefighter part ${name}`).toBeDefined();
  return part!;
}

function vector(value: unknown, fallback: [number, number, number]): Vector3 {
  return value instanceof Vector3 ? value.clone() : new Vector3(...(value ?? fallback) as [number, number, number]);
}

function geometry(node: Element): BufferGeometry {
  if (node.type === "boxGeometry") return new BoxGeometry(...node.props.args as ConstructorParameters<typeof BoxGeometry>);
  if (node.type === "cylinderGeometry") return new CylinderGeometry(...node.props.args as ConstructorParameters<typeof CylinderGeometry>);
  if (node.type === "sphereGeometry") return new SphereGeometry(...node.props.args as ConstructorParameters<typeof SphereGeometry>);
  throw new Error(`Unsupported firefighter geometry ${String(node.type)}`);
}

function meshes(node: ReactNode, parent = new Matrix4(), ancestors: string[] = []): MeshBounds[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<Element["props"]>(child)) return [];
    if (typeof child.type === "function") {
      return meshes((child.type as (props: Element["props"]) => ReactNode)(child.props), parent, ancestors);
    }
    const names = typeof child.props.name === "string" ? [...ancestors, child.props.name] : ancestors;
    const { position, rotation, quaternion, scale } = child.props;
    const local = new Matrix4().compose(
      vector(position, [0, 0, 0]),
      quaternion instanceof Quaternion ? quaternion.clone()
        : new Quaternion().setFromEuler(new Euler(...(rotation ?? [0, 0, 0]) as [number, number, number])),
      typeof scale === "number" ? new Vector3(scale, scale, scale) : vector(scale, [1, 1, 1]),
    );
    const transform = parent.clone().multiply(local);
    const children = Children.toArray(child.props.children).filter(isValidElement<Element["props"]>);
    const own: MeshBounds[] = [];
    if (child.type === "mesh") {
      const shape = children.find(item => /Geometry$/.test(String(item.type)));
      expect(shape, "each firefighter mesh has solid geometry").toBeDefined();
      const buffer = geometry(shape!);
      buffer.computeBoundingBox();
      const color = children.find(item => item.type === "meshStandardMaterial")?.props.color;
      own.push({ bounds: buffer.boundingBox!.clone().applyMatrix4(transform), transform, color, names });
      buffer.dispose();
    }
    return [...own, ...meshes(child.props.children, transform, names)];
  });
}

function bounds(node: ReactNode): Box3 {
  return meshes(node).reduce((result, mesh) => result.union(mesh.bounds), new Box3());
}

function partBounds(node: ReactNode, name: string): Box3 {
  const parts = meshes(node).filter(mesh => mesh.names.includes(name));
  expect(parts.length, `geometry below firefighter part ${name}`).toBeGreaterThan(0);
  return parts.reduce((result, mesh) => result.union(mesh.bounds), new Box3());
}

function colors(node: ReactNode): unknown[] {
  return expanded(node).filter(child => child.type === "meshStandardMaterial").map(child => child.props.color);
}

function pose(node: ReactNode) {
  return meshes(node).map(mesh => ({ transform: mesh.transform.elements, min: mesh.bounds.min.toArray(), max: mesh.bounds.max.toArray() }));
}

describe("3D firefighter model", () => {
  it.each(roles)("gives %s firefighters a helmet, front-facing visor, turnout coat, gloves, and boots", role => {
    const tree = modelTree(role);
    expect(colors(named(tree, "firefighter-helmet"))).toContain(role === "command" ? C.white : C.yellow);
    expect(colors(named(tree, "firefighter-visor"))).toContain(C.glass);
    expect(bounds(named(tree, "firefighter-visor")).min.z).toBeGreaterThan(.12);
    for (const part of ["turnout-coat", "glove-left", "glove-right", "boot-left", "boot-right"]) {
      expect(bounds(named(tree, `firefighter-${part}`)).isEmpty()).toBe(false);
    }
  });

  it("equips operator and rescue roles with a back-mounted breathing cylinder", () => {
    expect(expanded(modelTree("command")).some(node => node.props.name === "firefighter-scba")).toBe(false);
    for (const role of ["operator", "rescue"] as const) {
      const tank = named(named(modelTree(role), "firefighter-scba"), "firefighter-air-cylinder");
      expect(bounds(tank).max.z).toBeLessThan(-.15);
      expect(bounds(tank).getSize(new Vector3()).y).toBeGreaterThan(.45);
    }
  });

  it("uses reflective turnout bands without lights, sprites, or an oversized mesh budget", () => {
    for (const role of roles) {
      const nodes = expanded(modelTree(role, "operate"));
      const bands = expanded(named(modelTree(role), "firefighter-reflective-bands"))
        .filter(node => node.type === "meshStandardMaterial");
      expect(bands.length).toBeGreaterThanOrEqual(5);
      expect(bands.every(node => Number(node.props.emissiveIntensity) > 0 && Number(node.props.emissiveIntensity) <= .2)).toBe(true);
      expect(nodes.some(node => /Light$/.test(String(node.type)) || node.type === "sprite")).toBe(false);
      expect(nodes.filter(node => node.type === "mesh").length).toBeLessThanOrEqual(48);
    }
  });

  it("places both soles on local ground at human scale without a full-body scale transform", () => {
    const tree = modelTree();
    expect(tree.props.scale).toBeUndefined();
    const modelBounds = bounds(tree);
    expect(modelBounds.min.y).toBeCloseTo(0, 6);
    expect(modelBounds.max.y).toBeGreaterThanOrEqual(1.85);
    expect(modelBounds.max.y).toBeLessThanOrEqual(2.05);
    const left = partBounds(tree, "firefighter-boot-left");
    const right = partBounds(tree, "firefighter-boot-right");
    expect(left.min.y).toBeCloseTo(0, 6);
    expect(right.min.y).toBeCloseTo(0, 6);
    expect(left.max.x).toBeLessThan(0);
    expect(right.min.x).toBeGreaterThan(0);
  });

  it("includes parent transforms when measuring anchored boot positions", () => {
    const tree = <group position={[3, 2, 4]} rotation={[0, .7, 0]}>{modelTree("rescue", "guide")}</group>;
    for (const side of ["left", "right"]) {
      expect(partBounds(tree, `firefighter-boot-${side}`).min.y).toBeCloseTo(2, 6);
    }
  });

  it("shows a handheld radio only for radio calls and a tablet only while operating", () => {
    for (const action of actions) {
      const nodes = expanded(modelTree("operator", action));
      expect(nodes.some(node => node.props.name === "firefighter-radio")).toBe(action === "radio");
      expect(nodes.some(node => node.props.name === "firefighter-tablet")).toBe(action === "operate");
    }
  });

  it("aims the tablet screen toward the operator's face", () => {
    for (const time of [0, 1.7]) {
      const tree = modelTree("operator", "operate", time);
      const eyes = partBounds(tree, "firefighter-visor").getCenter(new Vector3());
      const screen = meshes(tree).find(mesh => mesh.names.includes("firefighter-tablet") && mesh.color === C.blue);
      expect(screen).toBeDefined();
      const normal = new Vector3(0, 0, 1).transformDirection(screen!.transform);
      const towardFace = eyes.sub(new Vector3().setFromMatrixPosition(screen!.transform)).normalize();
      expect(normal.dot(towardFace)).toBeGreaterThan(.5);
    }
  });

  it("raises guiding hands and reaches forward to receive people or equipment", () => {
    for (const side of ["left", "right"]) {
      expect(bounds(named(modelTree("rescue", "guide"), `firefighter-glove-${side}`)).min.y).toBeGreaterThan(1.5);
      expect(bounds(named(modelTree("rescue", "receive"), `firefighter-glove-${side}`)).min.z).toBeGreaterThan(.35);
    }
  });

  it.each(stationaryActions)("keeps %s motion deterministic and both feet anchored", action => {
    const first = modelTree("rescue", action, .4);
    const repeated = modelTree("rescue", action, .4);
    const later = modelTree("rescue", action, 1.7);
    expect(pose(repeated)).toEqual(pose(first));
    if (action === "standby") expect(pose(later)).toEqual(pose(first));
    else expect(pose(later)).not.toEqual(pose(first));
    for (const side of ["left", "right"]) {
      expect(partBounds(later, `firefighter-boot-${side}`)).toEqual(partBounds(first, `firefighter-boot-${side}`));
    }
  });

  it.each(roles)("alternates the %s firefighter's lifted foot over a complete walk cycle", role => {
    const samples = [0, .25, .5, .75, 1].map(fraction => {
      const tree = modelTree(role, "walk", fraction * walkPeriod);
      const left = partBounds(tree, "firefighter-boot-left");
      const right = partBounds(tree, "firefighter-boot-right");
      expect(meshes(tree).length).toBeGreaterThan(0);
      expect(meshes(tree).length).toBeLessThanOrEqual(48);
      return {
        leftGrounded: Math.abs(left.min.y) < 1e-6,
        rightGrounded: Math.abs(right.min.y) < 1e-6,
        leftRaised: left.min.y > .1,
        rightRaised: right.min.y > .1,
        stride: Number((left.getCenter(new Vector3()).z - right.getCenter(new Vector3()).z).toFixed(3)) || 0,
      };
    });
    expect(samples).toEqual([
      { leftGrounded: true, rightGrounded: true, leftRaised: false, rightRaised: false, stride: .44 },
      { leftGrounded: true, rightGrounded: false, leftRaised: false, rightRaised: true, stride: 0 },
      { leftGrounded: true, rightGrounded: true, leftRaised: false, rightRaised: false, stride: -.44 },
      { leftGrounded: false, rightGrounded: true, leftRaised: true, rightRaised: false, stride: 0 },
      { leftGrounded: true, rightGrounded: true, leftRaised: false, rightRaised: false, stride: .44 },
    ]);
  });

  it("bends the walking knees with independently rotating fixed-length thigh and shin geometry", () => {
    const first = modelTree("rescue", "walk", walkPeriod / 4);
    const later = modelTree("rescue", "walk", walkPeriod * 3 / 4);
    for (const side of ["left", "right"]) {
      const thigh = meshes(named(first, `firefighter-thigh-${side}`))[0];
      const shin = meshes(named(first, `firefighter-shin-${side}`))[0];
      const thighDirection = new Vector3(0, 1, 0).transformDirection(thigh.transform);
      const shinDirection = new Vector3(0, 1, 0).transformDirection(shin.transform);
      expect(thighDirection.dot(shinDirection)).toBeLessThan(.8);
      for (const part of ["thigh", "shin"]) {
        expect(pose(named(later, `firefighter-${part}-${side}`))).not.toEqual(pose(named(first, `firefighter-${part}-${side}`)));
        for (const fraction of [0, .125, .25, .375, .5, .625, .75, .875, 1]) {
          const segment = named(modelTree("rescue", "walk", fraction * walkPeriod), `firefighter-${part}-${side}`);
          const shape = expanded(segment).find(node => node.type === "boxGeometry");
          expect((shape!.props.args as number[])[1]).toBeCloseTo(.34, 8);
        }
      }
    }
  });

  it("swings each walking arm modestly opposite its same-side leg", () => {
    const first = modelTree("rescue", "walk", 0);
    const later = modelTree("rescue", "walk", walkPeriod / 2);
    for (const side of ["left", "right"]) {
      const bootMotion = partBounds(later, `firefighter-boot-${side}`).getCenter(new Vector3()).z
        - partBounds(first, `firefighter-boot-${side}`).getCenter(new Vector3()).z;
      const handMotion = partBounds(later, `firefighter-glove-${side}`).getCenter(new Vector3()).z
        - partBounds(first, `firefighter-glove-${side}`).getCenter(new Vector3()).z;
      expect(bootMotion * handMotion).toBeLessThan(0);
      expect(Math.abs(handMotion)).toBeGreaterThan(.12);
      expect(Math.abs(handMotion)).toBeLessThanOrEqual(.4);
    }
  });

  it("keeps reflective calf bands aligned with their moving shins", () => {
    for (const fraction of [0, .125, .25, .5, .75]) {
      const tree = modelTree("rescue", "walk", fraction * walkPeriod);
      for (const side of ["left", "right"]) {
        const shin = meshes(named(tree, `firefighter-shin-${side}`))[0];
        const band = meshes(named(tree, `firefighter-calf-band-${side}`))[0];
        const direction = new Vector3(0, 1, 0).transformDirection(shin.transform);
        const bandDirection = new Vector3(0, 1, 0).transformDirection(band.transform);
        const offset = new Vector3().setFromMatrixPosition(band.transform)
          .sub(new Vector3().setFromMatrixPosition(shin.transform));
        expect(bandDirection.dot(direction)).toBeCloseTo(1, 6);
        expect(offset.cross(direction).length()).toBeLessThan(1e-6);
      }
    }
  });

  it.each(stationaryActions)("restores level calf bands when a walking firefighter switches to %s", action => {
    for (const side of ["left", "right"]) {
      const band = new Group();
      applyProps(band, named(modelTree("rescue", "walk", walkPeriod / 4), `firefighter-calf-band-${side}`).props);
      expect(band.quaternion.equals(new Quaternion())).toBe(false);
      applyProps(band, named(modelTree("rescue", action, walkPeriod / 4), `firefighter-calf-band-${side}`).props);
      expect(band.quaternion.equals(new Quaternion())).toBe(true);
      expect(band.position.y).toBe(.36);
    }
  });

  it("freezes walk geometry at the supplied simulation clock and normalizes nonfinite clocks", () => {
    const first = pose(modelTree("operator", "walk", .37));
    expect(pose(modelTree("operator", "walk", .37))).toEqual(first);
    expect(pose(modelTree("operator", "walk", .47))).not.toEqual(first);
    for (const time of [NaN, Infinity, -Infinity]) {
      expect(pose(modelTree("operator", "walk", time))).toEqual(pose(modelTree("operator", "walk", 0)));
    }
  });

  it("keeps at least one walking sole planted and both soles above ground throughout the cycle", () => {
    for (let step = 0; step <= 48; step++) {
      const tree = modelTree("rescue", "walk", step / 48 * walkPeriod);
      const left = partBounds(tree, "firefighter-boot-left");
      const right = partBounds(tree, "firefighter-boot-right");
      expect(left.min.y).toBeGreaterThanOrEqual(-1e-6);
      expect(right.min.y).toBeGreaterThanOrEqual(-1e-6);
      expect(Math.min(left.min.y, right.min.y)).toBeCloseTo(0, 6);
    }
  });

  it.each(roles)("keeps every %s action finite within 0.8m radius and 2.2m height", role => {
    for (const action of actions) {
      for (const time of [-20, 0, .15, .3, .4, .45, .6, .75, .9, 1.05, Math.PI / 3.6, 1.2, Math.PI / 1.2, 3.5, 12, 900, 1e8, Number.MAX_VALUE, NaN, Infinity]) {
        for (const mesh of meshes(modelTree(role, action, time))) {
          expect(mesh.transform.elements.every(Number.isFinite)).toBe(true);
          const { min, max } = mesh.bounds;
          expect([...min.toArray(), ...max.toArray()].every(Number.isFinite)).toBe(true);
          expect(min.y).toBeGreaterThanOrEqual(-1e-6);
          expect(max.y).toBeLessThanOrEqual(2.2);
          expect(Math.hypot(Math.max(Math.abs(min.x), Math.abs(max.x)), Math.max(Math.abs(min.z), Math.abs(max.z)))).toBeLessThanOrEqual(.8);
        }
      }
    }
  });
});
