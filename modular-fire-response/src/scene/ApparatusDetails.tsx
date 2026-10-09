import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Matrix4,
  MeshStandardMaterial,
  Shape,
  TorusGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { C } from "./Primitives";
import type { UnitKind, Vec3 } from "../types";

const finish = (name: string, color: string, roughness: number, metalness: number) =>
  new MeshStandardMaterial({ name, color, roughness, metalness, emissiveIntensity: 0 });
const paint = finish("apparatus-enamel", C.red, .29, .18);
const white = finish("apparatus-white-enamel", C.white, .3, .16);
const steel = finish("apparatus-brushed-steel", "#aebec4", .3, .72);
const dark = finish("apparatus-dark-trim", "#222b30", .78, .06);
const glass = finish("apparatus-tinted-glass", "#263f4d", .14, .34);
const rubber = finish("apparatus-rubber", C.tire, .95, 0);
const hose = finish("apparatus-wound-hose", "#329aa8", .8, 0);
const amber = finish("apparatus-amber-lens", "#eec578", .28, .04);
amber.emissive.set("#ffb954");
amber.emissiveIntensity = .65;
const headlamp = finish("apparatus-headlamp-lens", "#eaf1f1", .2, .08);
headlamp.emissive.set("#e1edff");
headlamp.emissiveIntensity = 1.35;
const tailLamp = finish("apparatus-tail-lens", "#dc4542", .24, .04);
tailLamp.emissive.set("#ee382e");
tailLamp.emissiveIntensity = .8;

type DetailPart = {
  name: string;
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  castShadow: boolean;
};

function placed(geometry: BufferGeometry, p: Vec3, rotation: Vec3 = [0, 0, 0]) {
  return geometry.applyMatrix4(
    new Matrix4().makeRotationFromEuler(new Euler(...rotation)).setPosition(...p),
  );
}
function box(p: Vec3, size: Vec3, rotation?: Vec3) {
  return placed(new BoxGeometry(...size), p, rotation);
}
function cylinder(p: Vec3, radius: number, height: number, rotation?: Vec3, segments = 16) {
  return placed(new CylinderGeometry(radius, radius, height, segments), p, rotation);
}
function ring(p: Vec3, radius: number, thickness: number, rotation?: Vec3, arc = Math.PI * 2) {
  return placed(new TorusGeometry(radius, thickness, 4, 20, arc), p, rotation);
}

// Static fittings are merged once per finish and shared by every carrier.
function batch(name: string, pieces: BufferGeometry[], material: MeshStandardMaterial, castShadow = false): DetailPart {
  const plain = pieces.map(piece => piece.index ? piece.toNonIndexed() : piece);
  const geometry = mergeGeometries(plain)!;
  for (const piece of new Set([...pieces, ...plain])) piece.dispose();
  geometry.computeBoundingSphere();
  return { name, geometry, material, castShadow };
}
function meshes(parts: DetailPart[]) {
  return parts.map(part => (
    <mesh key={part.name} {...part} receiveShadow dispose={null} />
  ));
}

const sides = [-1, 1];
const windscreenTilt: Vec3 = [0, 0, Math.atan2(.23, .82)];
const cabProfile = new Shape();
cabProfile.moveTo(1.15, .85);
cabProfile.lineTo(3.45, .85);
cabProfile.lineTo(3.45, 2.14);
cabProfile.lineTo(3.22, 2.96);
cabProfile.lineTo(1.15, 2.96);
cabProfile.closePath();
const cabShell = new ExtrudeGeometry(cabProfile, {
  depth: 2.59, steps: 1, bevelEnabled: true, bevelThickness: .025,
  bevelSize: .025, bevelSegments: 1, curveSegments: 1,
}).translate(0, 0, -1.295);

const CAB = [
  batch("cab-paint", [cabShell], paint, true),
  batch("cab-white-trim", [
    box([2.24, 3.025, 0], [2.18, .18, 2.74]),
    box([3.475, 1.7, 0], [.025, .2, 2.54]),
    ...sides.map(side => box([2.24, 1.7, side * 1.333], [2.12, .2, .045])),
  ], white),
  batch("cab-window-frames", [
    box([3.359, 2.55, 0], [.045, .79, 2.44], windscreenTilt),
    ...sides.flatMap(side => [
      box([2.2, 2.54, side * 1.33], [1.94, .78, .045]),
      box([1.33, 1.6, side * 1.334], [.025, .95, .018]),
      box([3.14, 1.62, side * 1.334], [.022, .94, .018]),
      box([2.17, 1.98, side * 1.365], [.29, .07, .055]),
    ]),
  ], dark),
  batch("cab-glazing", [
    box([3.386, 2.554, 0], [.018, .64, 2.22], windscreenTilt),
    ...sides.map(side => box([2.2, 2.55, side * 1.358], [1.75, .6, .018])),
  ], glass),
  batch("cab-glass-dividers", [
    box([3.401, 2.55, 0], [.018, .66, .045], windscreenTilt),
    ...sides.flatMap(side => [
      box([1.79, 2.55, side * 1.373], [.045, .63, .018]),
      box([3.475, 2.295, side * .59], [.025, .035, .62], [side * .17, 0, windscreenTilt[2]]),
    ]),
  ], dark),
  batch("cab-mirrors", sides.flatMap(side => [
    box([3.08, 2.3, side * 1.475], [.08, .06, .25]),
    box([3.12, 2.39, side * 1.585], [.16, .34, .11]),
  ]), dark),
  batch("cab-mirror-faces", sides.map(side =>
    box([3.033, 2.4, side * 1.585], [.014, .25, .084])), steel),
  batch("cab-grille", [
    box([3.487, 1.23, 0], [.032, .51, 1.26]),
    ...sides.map(side => box([3.49, 1.38, side * .99], [.036, .46, .48])),
  ], dark),
  batch("cab-bumper-metal", [
    box([3.6, .85, 0], [.3, .25, 2.9]),
    box([3.506, 1.58, 0], [.028, .15, .22]),
    ...Array.from({ length: 5 }, (_, row) => box([3.51, 1.05 + row * .085, 0], [.016, .027, 1.09])),
    ...[-2.3, 2.4].flatMap(x => sides.map(side => ring([x, .75, side * 1.347], .785, .043, undefined, Math.PI))),
  ], steel),
  batch("cab-step-treads", sides.flatMap(side => [
    box([2.19, 1.08, side * 1.406], [1.9, .13, .2]),
    ...Array.from({ length: 6 }, (_, step) => box([1.44 + step * .29, 1.154, side * 1.416], [.11, .019, .16])),
  ]), dark),
  batch("cab-headlamps", sides.flatMap(side => [
    box([3.52, 1.405, side * 1.0], [.024, .145, .3]),
    box([3.52, 1.545, side * .99], [.024, .055, .34]),
  ]), headlamp),
  batch("cab-amber-markers", sides.flatMap(side => [
    box([3.52, 1.25, side * 1.065], [.024, .075, .13]),
    box([1.47, 1.49, side * 1.374], [.15, .07, .028]),
  ]), amber),
  batch("cab-tail-lamps", sides.map(side =>
    box([-4.08, 1.065, side * 1.02], [.025, .16, .25])), tailLamp),
];

export function ApparatusCab() {
  return <group name="apparatus-cab" dispose={null}>{meshes(CAB)}</group>;
}

const lugAngles = Array.from({ length: 6 }, (_, index) => index * Math.PI / 3);
const WHEEL = [
  batch("wheel-rubber", [
    cylinder([0, 0, 0], .74, .4, [Math.PI / 2, 0, 0], 20),
    ring([0, 0, .165], .635, .035),
    ring([0, 0, -.165], .635, .035),
  ], rubber, true),
  batch("wheel-rim", [
    cylinder([0, 0, .122], .43, .17, [Math.PI / 2, 0, 0], 20),
    ring([0, 0, .174], .4, .036),
    ...lugAngles.map(angle => cylinder([Math.cos(angle) * .255, Math.sin(angle) * .255, .2], .032, .024, [Math.PI / 2, 0, 0], 8)),
  ], steel),
  batch("wheel-hub", [
    cylinder([0, 0, .185], .145, .05, [Math.PI / 2, 0, 0], 12),
    ...lugAngles.map(angle => box([Math.cos(angle) * .335, Math.sin(angle) * .335, .211], [.085, .046, .006], [0, 0, angle])),
  ], dark),
];

export function ApparatusWheel({ side }: { side: number }) {
  return <group name="apparatus-wheel" scale={[1, 1, side]} dispose={null}>{meshes(WHEEL)}</group>;
}

type Cabinet = { xs: number[]; y: number; width: number; height: number; z: number; mode?: "vent" | "bars"; sides?: number[] };
const CABINETS: Record<UnitKind, Cabinet> = {
  water: { xs: [-1.9, -.55, .65], y: 1.66, width: 1.03, height: .48, z: 1.325 },
  booster: { xs: [-2.15, -.65, .62], y: 1.89, width: .92, height: .88, z: 1.342, sides: [-1] },
  power: { xs: [-2.3, -.9, .5], y: 2.2, width: 1.18, height: 1.48, z: 1.325, mode: "vent" },
  dog: { xs: [-2.2, -.8, .6], y: 2.19, width: 1.08, height: 1.1, z: 1.325, mode: "bars" },
  tools: { xs: [-2.3, -.9, .5], y: 2.19, width: 1.19, height: 1.68, z: 1.325 },
  boom: { xs: [-2.15, -.65, .65], y: 1.69, width: 1.03, height: .67, z: 1.365 },
  ladder: { xs: [-2.3, -.9, .5], y: 1.73, width: 1.18, height: .78, z: 1.325 },
  recon: { xs: [-2.4, -.9, .55], y: 1.71, width: 1.12, height: .43, z: 1.412 },
  "fire-drone": { xs: [-2.7, -1.15, .4], y: 1.85, width: 1.32, height: .61, z: 1.412 },
  cargo: { xs: [-2.5, -.9, .65], y: 1.66, width: 1.13, height: .27, z: 1.412 },
};

function moduleParts(kind: UnitKind) {
  const cabinet = CABINETS[kind];
  const panels: BufferGeometry[] = [], frames: BufferGeometry[] = [], ribs: BufferGeometry[] = [];
  const latches: BufferGeometry[] = [], markers: BufferGeometry[] = [];
  for (const side of cabinet.sides ?? sides) for (const x of cabinet.xs) {
    const { y, width, height, z, mode } = cabinet;
    panels.push(box([x, y, side * z], [width, height, .032]));
    for (const edge of sides) {
      frames.push(box([x + edge * (width / 2 + .018), y, side * (z + .02)], [.034, height + .055, .06]));
      frames.push(box([x, y + edge * (height / 2 + .016), side * (z + .02)], [width + .07, .032, .06]));
    }
    const rows = mode === "bars" ? 4 : Math.max(3, Math.round(height / .15));
    for (let row = 0; row < rows; row++) {
      ribs.push(mode === "bars"
        ? box([x - width * .32 + row * width * .21, y, side * (z + .042)], [.04, height - .05, .027])
        : box([x, y - height * .43 + row * height * .86 / (rows - 1), side * (z + .039)], [width - .07, mode === "vent" ? .055 : .022, .023]));
    }
    latches.push(box([x + width * .23, y - height * .28, side * (z + .064)], [.22, .045, .025]));
    markers.push(box([x, y - height / 2 - .063, side * (z + .02)], [.12, .045, .035]));
  }
  const parts = [
    batch("module-compartment-panels", panels, cabinet.mode ? dark : steel),
    batch("module-compartment-frames", frames, white),
    batch("module-shutter-ribs", ribs, cabinet.mode ? steel : dark),
    batch("module-compartment-latches", latches, steel),
    batch("module-side-markers", markers, amber),
  ];

  if (kind === "tools" || kind === "power") {
    const top = kind === "tools" ? 3.49 : 3.39;
    parts.push(batch("module-roof-rack", [
      ...sides.map(side => box([-1, top, side * .92], [3.4, .05, .055])),
      ...[-2.68, .68].map(x => box([x, top, 0], [.06, .05, 1.9])),
      ...[-2.5, -.8, .5].flatMap(x => sides.map(side => box([x, top - .1, side * .92], [.05, .22, .05]))),
    ], steel));
    parts.push(batch("module-roof-equipment", [
      box([-1, top - .145, 0], [3.43, .06, 1.95]),
      box([-2.13, top - .054, -.08], [1.04, .15, 1.22]),
      box([-.39, top - .075, .08], [1.58, .12, 1.35]),
    ], dark));
    parts.push(batch("module-roof-retainers", [
      box([-2.48, top - .046, -.08], [.07, .16, 1.26]),
      box([-1.8, top - .046, -.08], [.07, .16, 1.26]),
      ...sides.map(side => box([-.36, top + .005, side * .46], [1.48, .035, .08])),
      ...[-.98, -.58, -.18, .22].map(x => box([x, top + .005, 0], [.04, .035, .94])),
    ], steel));
  }
  if (kind === "water") {
    parts.push(batch("module-compartment-bodies", sides.map(side =>
      box([-.95, 1.64, side * 1.155], [4.3, .8, .3])), paint));
    parts.push(batch("module-tank-bands", [-2, .4].map(x => ring([x, 2.5, 0], 1.055, .045, [0, Math.PI / 2, 0])), paint));
    parts.push(batch("module-tank-walkway", [
      ...sides.map(side => box([-1, 3.68, side * .51], [3.3, .055, .05])),
      ...[-2.62, .62].flatMap(x => sides.map(side => box([x, 3.575, side * .51], [.045, .26, .045]))),
      box([-1, 3.57, 0], [2.7, .045, .72]),
    ], steel));
    parts.push(batch("module-hose-reel", [
      cylinder([-3.53, 2.14, 0], .46, .34, [0, 0, Math.PI / 2]),
      ...[-3.66, -3.59, -3.52, -3.45, -3.38].map(x => ring([x, 2.14, 0], .445, .032, [0, Math.PI / 2, 0])),
    ], hose));
    parts.push(batch("module-reel-frame", [
      ...[-3.77, -3.29].map(x => cylinder([x, 2.14, 0], .55, .055, [0, 0, Math.PI / 2])),
      cylinder([-3.81, 2.14, 0], .14, .045, [0, 0, Math.PI / 2]),
      ...sides.map(side => box([-3.53, 1.58, side * .47], [.58, .14, .08])),
    ], steel));
  }
  if (kind === "booster") {
    parts.push(batch("module-pump-straps", [-1.86, -.13].flatMap(x => [-.6, .6].map(z =>
      ring([x, 2.95, z], .43, .023, [0, Math.PI / 2, 0]))), steel));
    parts.push(batch("module-instrument-trim", [
      ...[-2.49, .09].map(x => box([x, 2, 1.397], [.035, .9, .032])),
      ...[1.54, 2.46].map(y => box([-1.2, y, 1.397], [2.62, .035, .032])),
      ...[-1.9, -.95].map(x => ring([x, 2.14, 1.464], .22, .022)),
    ], steel));
  }
  if (kind === "ladder") {
    parts.push(batch("module-turntable-deck", [
      box([-1, 2.2, 0], [4.12, .09, 2.6]),
      ...sides.map(side => box([-1, 2.12, side * 1.31], [4.16, .075, .055])),
    ], steel));
  }
  return parts;
}

const MODULES = Object.fromEntries(
  (Object.keys(CABINETS) as UnitKind[]).map(kind => [kind, moduleParts(kind)]),
) as Record<UnitKind, DetailPart[]>;

export function ApparatusModuleDetails({ kind }: { kind: UnitKind }) {
  return <group name={`apparatus-${kind}-details`} dispose={null}>{meshes(MODULES[kind])}</group>;
}

const ROTORCRAFT_SKIN = [
  batch("rotorcraft-casing", [
    box([0, .265, 0], [1.72, .1, 1.1]),
    box([-.08, .337, 0], [1.44, .045, .91]),
    ...sides.map(side => box([side * .79, .055, 0], [.12, .32, .91])),
  ], white),
  batch("rotorcraft-cooling-vents", [
    ...[-.42, -.18, .06, .3].map(x => box([x, .369, .05], [.095, .018, .57])),
    cylinder([.3, -.43, -.435], .15, .08, [Math.PI / 2, 0, 0]),
  ], dark),
  batch("rotorcraft-camera", [
    cylinder([.3, -.43, -.485], .109, .025, [Math.PI / 2, 0, 0]),
    ring([.3, -.43, -.497], .112, .012),
  ], glass),
];

export function RotorcraftSkin() {
  return <group name="rotorcraft-skin" dispose={null}>{meshes(ROTORCRAFT_SKIN)}</group>;
}
