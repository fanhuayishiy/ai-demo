import { BoxGeometry, BufferGeometry, CylinderGeometry, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Vec3 } from "../types";
import { CAB_SEAT_ANCHORS } from "./ApparatusDetails";
import { C } from "./Primitives";

export type CabCrewMember = {
  id: string;
  role: "command" | "operator" | "rescue";
  seat: number;
};

const finish = (name: string, color: string, roughness: number, metalness = 0) =>
  new MeshStandardMaterial({ name, color, roughness, metalness });
const turnout = finish("cab-crew-turnout-fabric", C.dark, .88);
const rescueTurnout = finish("cab-crew-rescue-fabric", "#bc623c", .88);
const equipment = finish("cab-crew-boots-and-hood", C.tire, .94);
const whiteHelmet = finish("cab-crew-command-helmet", C.white, .45, .08);
const yellowHelmet = finish("cab-crew-helmet-enamel", C.yellow, .45, .08);
const face = finish("cab-crew-face", "#bc9479", .9);
const visor = finish("cab-crew-visor", C.glass, .18, .2);
const restraint = finish("cab-crew-restraint-webbing", "#89969a", .9);
const reflective = new MeshStandardMaterial({
  name: "cab-crew-reflective-tape", color: C.yellow, roughness: .58,
  emissive: C.yellow, emissiveIntensity: .14,
});

function box(position: Vec3, size: Vec3) {
  return new BoxGeometry(...size).translate(...position);
}

function beam(from: Vec3, to: Vec3, width: number, depth = width) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const direction = b.clone().sub(a);
  return new BoxGeometry(depth, direction.length(), width)
    .applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()))
    .translate(...a.add(b).multiplyScalar(.5).toArray() as Vec3);
}

function merged(pieces: BufferGeometry[]) {
  const plain = pieces.map(piece => piece.index ? piece.toNonIndexed() : piece);
  const geometry = mergeGeometries(plain)!;
  for (const piece of new Set([...pieces, ...plain])) piece.dispose();
  geometry.computeBoundingSphere();
  return geometry;
}

const HELMET = merged([
  new SphereGeometry(.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, .93, 0),
  new CylinderGeometry(.237, .237, .04, 12).translate(0, .925, 0),
  box([.015, 1.11, 0], [.26, .034, .04]),
]);
const FACE = box([.135, .775, 0], [.075, .22, .22]);
const VISOR = box([.184, .8, 0], [.034, .16, .255]);
const RESTRAINT = merged([
  beam([.205, .59, -.19], [.245, .015, .19], .046, .025),
  box([.24, -.015, 0], [.035, .055, .45]),
  box([.245, .015, .19], [.05, .08, .055]),
]);

// The driver reaches the wheel; the other seated crew rest their hands over their laps.
function seatedUniform(driving: boolean) {
  const coat = [box([0, .335, 0], [.34, .63, .47])];
  const dark = [
    box([.035, -.015, 0], [.34, .19, .43]),
    new CylinderGeometry(.09, .09, .12, 10).translate(0, .67, 0),
    new SphereGeometry(.145, 10, 8).translate(0, .78, 0),
  ];
  const tape = [
    box([.012, .54, 0], [.365, .045, .495]),
    box([.018, .06, 0], [.365, .045, .485]),
  ];
  for (const side of [-1, 1]) {
    const elbow: Vec3 = [driving ? .1 : .08, .27, side * .285];
    const hand: Vec3 = driving ? [.67, .37, side * .14] : [.37, .19, side * .215];
    coat.push(
      beam([0, .56, side * .265], elbow, .13),
      beam(elbow, hand, .13),
    );
    dark.push(
      box([.285, -.03, side * .132], [.53, .19, .205]),
      box([.555, -.27, side * .132], [.205, .46, .205]),
      box([.67, -.52, side * .135], [.32, .22, .22]),
      box(hand, [.12, .14, .13]),
    );
    const cuffA = new Vector3(...elbow).lerp(new Vector3(...hand), .76);
    const cuffB = new Vector3(...elbow).lerp(new Vector3(...hand), .87);
    tape.push(
      box([.182, .38, side * .14], [.012, .31, .035]),
      box([.555, -.355, side * .132], [.215, .055, .215]),
      beam(cuffA.toArray() as Vec3, cuffB.toArray() as Vec3, .143),
    );
  }
  return { coat: merged(coat), dark: merged(dark), tape: merged(tape) };
}

const DRIVER = seatedUniform(true);
const PASSENGER = seatedUniform(false);

export function CabCrew({ members }: { members: readonly CabCrewMember[] }) {
  return (
    <group name="cab-crew" dispose={null}>
      {CAB_SEAT_ANCHORS.map((position, seat) => {
        const member = members.find(candidate => candidate.seat === seat);
        if (!member) return null;
        const uniform = seat === 0 ? DRIVER : PASSENGER;
        const parts = [
          { name: "cab-crew-turnout-coat", geometry: uniform.coat, material: member.role === "rescue" ? rescueTurnout : turnout },
          { name: "cab-crew-equipment", geometry: uniform.dark, material: equipment },
          { name: "cab-crew-helmet", geometry: HELMET, material: member.role === "command" ? whiteHelmet : yellowHelmet },
          { name: "cab-crew-face", geometry: FACE, material: face },
          { name: "cab-crew-visor", geometry: VISOR, material: visor },
          { name: "cab-crew-reflective-bands", geometry: uniform.tape, material: reflective },
          { name: "cab-crew-restraint", geometry: RESTRAINT, material: restraint },
        ];
        return (
          <group key={member.id} name={`cab-crew-${member.id}`} position={position}
            userData={{ ...member, pose: "seated" }}>
            {parts.map(part => <mesh key={part.name} {...part} receiveShadow dispose={null} />)}
          </group>
        );
      })}
    </group>
  );
}
