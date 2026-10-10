// @vitest-environment node
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Box3, BufferGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Raycaster, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { ApparatusCab, RotorcraftSkin } from "./ApparatusDetails";
import { CabCrew, type CabCrewMember } from "./CabCrew";
import { C } from "./Primitives";
import type { Vec3 } from "../types";

type Element = ReactElement<Record<string, unknown> & { children?: ReactNode }>;

function objects(node: ReactNode): Object3D[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<Element["props"]>(child)) return [];
    if (typeof child.type === "function") {
      return objects((child.type as (props: Element["props"]) => ReactNode)(child.props));
    }
    const object = child.type === "mesh"
      ? new Mesh(child.props.geometry as BufferGeometry, child.props.material as MeshStandardMaterial)
      : new Group();
    object.name = child.props.name as string ?? "";
    object.userData = child.props.userData as Record<string, unknown> ?? {};
    object.position.fromArray((child.props.position ?? [0, 0, 0]) as Vec3);
    object.rotation.set(...(child.props.rotation ?? [0, 0, 0]) as Vec3);
    const scale = child.props.scale ?? 1;
    if (typeof scale === "number") object.scale.setScalar(scale);
    else object.scale.fromArray(scale as Vec3);
    for (const descendant of objects(child.props.children)) object.add(descendant);
    return [object];
  });
}

function scene(node: ReactNode) {
  const root = new Group();
  for (const object of objects(node)) root.add(object);
  root.updateMatrixWorld(true);
  return root;
}

function part(root: Object3D, name: string) {
  const object = root.getObjectByName(name);
  expect(object, `cab geometry ${name}`).toBeDefined();
  return object!;
}

function meshParts(root: Object3D) {
  const result: Mesh<BufferGeometry, MeshStandardMaterial>[] = [];
  root.traverse(object => {
    if (object instanceof Mesh) result.push(object);
  });
  return result;
}

function crewCab() {
  return scene(ApparatusCab({ crewCab: true }));
}

describe("hollow crew cab", () => {
  it("uses transparent cab-only glazing without changing the default cab or aircraft glass", () => {
    const original = scene(ApparatusCab());
    const crew = crewCab();
    const aircraft = scene(RotorcraftSkin());
    const glass = (part(crew, "cab-glazing") as Mesh<BufferGeometry, MeshStandardMaterial>).material;
    const defaultGlass = (part(original, "cab-glazing") as Mesh<BufferGeometry, MeshStandardMaterial>).material;
    const aircraftGlass = (part(aircraft, "rotorcraft-camera") as Mesh<BufferGeometry, MeshStandardMaterial>).material;
    expect(glass.transparent).toBe(true);
    expect(glass.opacity).toBeGreaterThan(0);
    expect(glass.opacity).toBeLessThanOrEqual(.3);
    expect(glass.depthWrite).toBe(false);
    expect(glass).not.toBe(defaultGlass);
    expect(defaultGlass.transparent).toBe(false);
    expect(aircraftGlass).toBe(defaultGlass);
    expect(defaultGlass.opacity).toBe(1);
    expect(new Box3().setFromObject(crew)).toEqual(new Box3().setFromObject(original));
  });

  it("leaves a small head silhouette unobstructed behind the front and both side windows", () => {
    const cab = crewCab();
    for (const z of [-.78, 0, .78]) {
      for (const y of [2.46, 2.6, 2.72]) {
        for (const offset of [-.08, 0, .08]) {
          const head = new Vector3(2.1 + offset, y, z + offset);
          const origins = [new Vector3(4, y, head.z), new Vector3(head.x, y, -2), new Vector3(head.x, y, 2)];
          for (const origin of origins) {
            const distance = origin.distanceTo(head);
            const hits = new Raycaster(origin, head.clone().sub(origin).normalize(), 0, distance)
              .intersectObject(cab, true);
            expect(hits.length, "a glazing pane covers each view of the head").toBeGreaterThan(0);
            expect(hits.every(hit => (hit.object as Mesh<BufferGeometry, MeshStandardMaterial>).material.transparent),
              `opaque cabin in sightline from ${origin.toArray()} to ${head.toArray()}`).toBe(true);
          }
        }
      }
    }
  });

  it("provides three separated seats within the cabin and reuses their static geometry", () => {
    const cab = crewCab();
    const next = crewCab();
    const envelope = new Box3(new Vector3(1.15, .85, -1.295), new Vector3(3.45, 2.96, 1.295));
    const seats = [0, 1, 2].map(seat => part(cab, `cab-seat-${seat}`));
    for (let index = 0; index < seats.length; index++) {
      const seat = seats[index];
      expect(seat.userData.seat).toBe(index);
      expect(envelope.containsBox(new Box3().setFromObject(seat))).toBe(true);
      expect(meshParts(seat).length).toBeGreaterThan(0);
      expect(meshParts(seat)[0].geometry).toBe(meshParts(part(next, `cab-seat-${index}`))[0].geometry);
      for (const other of seats.slice(index + 1)) {
        expect(new Box3().setFromObject(seat).intersectsBox(new Box3().setFromObject(other))).toBe(false);
      }
    }
    expect(meshParts(cab).length).toBeLessThanOrEqual(24);
  });
});

const members: CabCrewMember[] = [
  { id: "chief", role: "command", seat: 0 },
  { id: "pump", role: "operator", seat: 1 },
  { id: "rescue", role: "rescue", seat: 2 },
];

describe("seated cab crew", () => {
  it("renders only provided occupants with stable member and seat identities", () => {
    expect(meshParts(scene(CabCrew({ members: [] })))).toHaveLength(0);
    const root = scene(CabCrew({ members: [members[2], members[0]] }));
    expect(root.getObjectByName("cab-crew-pump")).toBeUndefined();
    for (const member of [members[0], members[2]]) {
      const occupant = part(root, `cab-crew-${member.id}`);
      expect(occupant.userData).toMatchObject({ ...member, pose: "seated" });
      expect(meshParts(occupant).length).toBeGreaterThan(0);
      expect(occupant.position.z).toBeCloseTo((member.seat - 1) * .78);
    }
  });

  it("keeps at most one occupant in each of the three physical seats", () => {
    const root = scene(CabCrew({ members: [
      ...members,
      { id: "duplicate", role: "rescue", seat: 1 },
      { id: "outside", role: "rescue", seat: 3 },
      { id: "invalid", role: "rescue", seat: NaN },
    ] }));
    for (const member of members) expect(root.getObjectByName(`cab-crew-${member.id}`)).toBeDefined();
    for (const id of ["duplicate", "outside", "invalid"]) expect(root.getObjectByName(`cab-crew-${id}`)).toBeUndefined();
  });

  it("gives every role a helmet, forward visor, reflective coat and seat restraint", () => {
    const root = scene(CabCrew({ members }));
    for (const member of members) {
      const occupant = part(root, `cab-crew-${member.id}`);
      const helmet = part(occupant, "cab-crew-helmet") as Mesh<BufferGeometry, MeshStandardMaterial>;
      expect(helmet.material.color.getHexString()).toBe((member.role === "command" ? C.white : C.yellow).slice(1));
      const headCenter = new Box3().setFromObject(helmet).getCenter(new Vector3());
      expect(new Box3().setFromObject(part(occupant, "cab-crew-visor")).min.x).toBeGreaterThan(headCenter.x + .12);
      expect(meshParts(part(occupant, "cab-crew-turnout-coat"))).toHaveLength(1);
      expect(new Box3().setFromObject(part(occupant, "cab-crew-restraint")).min.x).toBeGreaterThan(2.28);
      const reflective = part(occupant, "cab-crew-reflective-bands") as Mesh<BufferGeometry, MeshStandardMaterial>;
      expect(reflective.material.emissiveIntensity).toBeGreaterThan(0);
      expect(reflective.material.emissiveIntensity).toBeLessThanOrEqual(.2);
      expect(new Box3().setFromObject(reflective).getSize(new Vector3()).y).toBeGreaterThan(.8);
    }
  });

  it("fits seated people within the cabin with headroom, grounded boots and lateral separation", () => {
    const root = scene(CabCrew({ members }));
    const envelope = new Box3(new Vector3(1.3, .99 - 1e-5, -1.18), new Vector3(3.27, 2.82, 1.18));
    const people = members.map(member => part(root, `cab-crew-${member.id}`));
    for (let index = 0; index < people.length; index++) {
      const bounds = new Box3().setFromObject(people[index]);
      expect(envelope.containsBox(bounds)).toBe(true);
      expect(bounds.min.y).toBeCloseTo(.99, 5);
      expect(bounds.getSize(new Vector3()).x).toBeGreaterThan(.85);
      const helmet = new Box3().setFromObject(part(people[index], "cab-crew-helmet"));
      expect(helmet.max.y).toBeLessThan(2.87 - .07);
      expect(helmet.min.y).toBeGreaterThan(2.5);
      for (const other of people.slice(index + 1)) {
        expect(bounds.intersectsBox(new Box3().setFromObject(other))).toBe(false);
      }
    }
  });

  it("rests the thighs on the seat cushions without embedding the uniform in them", () => {
    const cab = crewCab();
    const people = scene(CabCrew({ members }));
    for (const member of members) {
      const seat = part(cab, `cab-seat-${member.seat}`);
      const uniform = part(part(people, `cab-crew-${member.id}`), "cab-crew-equipment");
      for (const offset of [-.132, .132]) {
        const z = (member.seat - 1) * .78 + offset;
        const cushion = new Raycaster(new Vector3(2.25, 2.2, z), new Vector3(0, -1, 0), 0, 2)
          .intersectObject(seat, true)[0];
        const thigh = new Raycaster(new Vector3(2.25, 1.3, z), new Vector3(0, 1, 0), 0, 2)
          .intersectObject(uniform, true)[0];
        expect(cushion).toBeDefined();
        expect(thigh).toBeDefined();
        expect(cushion.point.y).toBeLessThanOrEqual(thigh.point.y + 1e-5);
        expect(thigh.point.y - cushion.point.y).toBeLessThan(.015);
      }
    }
  });

  it("exposes all three helmet silhouettes through the front glazing", () => {
    const root = scene(<group><ApparatusCab crewCab /><CabCrew members={members} /></group>);
    for (const member of members) {
      for (const offset of [-.08, 0, .08]) {
        const z = (member.seat - 1) * .78 + offset;
        const hits = new Raycaster(new Vector3(4, 2.66, z), new Vector3(-1, 0, 0), 0, 3).intersectObject(root, true);
        expect(hits[0].object.name).toBe("cab-glazing");
        const solid = hits.find(hit => !(hit.object as Mesh<BufferGeometry, MeshStandardMaterial>).material.transparent);
        expect(solid?.object.name).toBe("cab-crew-helmet");
        expect(solid?.object.parent?.userData.id).toBe(member.id);
      }
    }
    for (const side of [-1, 1]) {
      const hits = new Raycaster(new Vector3(2.1, 2.66, side * 2), new Vector3(0, 0, -side), 0, 3).intersectObject(root, true);
      expect(hits[0].object.name).toBe("cab-glazing");
      const solid = hits.find(hit => !(hit.object as Mesh<BufferGeometry, MeshStandardMaterial>).material.transparent);
      expect(solid?.object.name).toBe("cab-crew-helmet");
      expect(solid?.object.parent?.userData.seat).toBe(side < 0 ? 0 : 2);
    }
  });

  it("reuses compact meshes and materials without texture maps or dynamic lights", () => {
    const a = scene(CabCrew({ members }));
    const b = scene(CabCrew({ members }));
    expect(meshParts(a).length).toBeLessThanOrEqual(21);
    for (const member of members) {
      const first = meshParts(part(a, `cab-crew-${member.id}`));
      const repeated = meshParts(part(b, `cab-crew-${member.id}`));
      expect(first.length).toBeLessThanOrEqual(7);
      for (let index = 0; index < first.length; index++) {
        expect(first[index].geometry).toBe(repeated[index].geometry);
        expect(first[index].material).toBe(repeated[index].material);
        expect(first[index].material.map).toBeNull();
        expect(first[index].material.emissiveMap).toBeNull();
      }
    }
    const tree = CabCrew({ members });
    const kinds = (node: ReactNode): string[] => Children.toArray(node).flatMap(child =>
      isValidElement<Element["props"]>(child) ? [String(child.type), ...kinds(child.props.children)] : []);
    expect(kinds(tree).some(kind => /Light$/.test(kind) || kind === "sprite")).toBe(false);
  });
});
