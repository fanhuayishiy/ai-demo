import * as THREE from 'three';
import {loftHull, castPanel, taperedSweep, sampleLoft, oval, CHAMFER} from './cranial-geometry.js';

export const HEAD = Object.freeze({
  origin: [-1.83, 4.23, 0],
  driveUpper: [.13, .54, .63],
  driveLower: [-.43, -.16, .56],
});
const TAU = Math.PI * 2;
const widthAt = x => .31 + .26 * THREE.MathUtils.smoothstep(x, -2.18, -.32);
const cheekSurface = (x, y) => widthAt(x) + .045 * Math.sin(y / 1.1 * Math.PI);
const jawSurface = (x, y) => .25 + .29 * THREE.MathUtils.smoothstep(x, -2.18, -.12) + .025 * Math.cos(y * 5);
const panel = (f, outline, holes, depth, surface, side, material, bevel = .012) => f.add(
  castPanel(outline, holes, depth, surface, side, bevel), material,
);
const beam = (f, points, r, material = 'silver', options = {}) => f.add(taperedSweep(points, r, options), material);
const loft = (f, stations, material, options = {}) => f.add(loftHull(stations, options), material);

function sideBolt(f, x, y, z, side, radius = .022) {
  f.bolt([x, y, z * side], radius);
  // The recessed hex socket faces outward on both sides.
  if (side < 0) f.disc([x, y, z * side - radius * .29], radius * .42, .008, 'black');
}

function rail(f, points, side, material, r = .024) {
  beam(f, points.map(([x, y, z]) => [x, y, side * z]), r, material, {segments: 36, radial: 8});
}

export function buildCranium(f) {
  for (const side of [-1, 1]) {
    // Forged maxilla. Its cross-section changes along the dental arch.
    loft(f, [
      [-2.22, .258, side * .16, .10, .10],
      [-2.08, .274, side * .29, .095, .13],
      [-1.77, .266, side * .365, .10, .14],
      [-1.25, .248, side * .435, .10, .13],
      [-.77, .24, side * .51, .095, .12],
      [-.55, .26, side * .545, .055, .09],
    ], 'armorLight', {profile: CHAMFER});
    // The antorbital casting has a real, deep opening. Its face curves outward.
    const surround = [
      [-1.99, .31], [-1.92, .59], [-1.66, .81], [-1.18, .87], [-.89, 1.00],
      [-.74, .93], [-.70, .59], [-.51, .35], [-.79, .22], [-1.35, .20], [-1.75, .24],
    ];
    const window = [
      [-1.75, .40], [-1.72, .56], [-1.55, .70], [-1.25, .72],
      [-1.03, .80], [-.91, .74], [-.94, .48], [-1.09, .37], [-1.48, .33],
    ];
    panel(f, surround, [window], .145, cheekSurface, side, 'silver', .021);
    // A recessed dark lip and a thin copper seal reveal the wall thickness.
    rail(f, [...window, window[0]].map(([x, y]) => [x, y, cheekSurface(x, y) - .074]), side, 'dark', .024);
    rail(f, [[-1.83, .35, .402], [-1.42, .30, .479], [-.98, .35, .56], [-.82, .53, .58]], side, 'copper', .014);
    // The forward nasal casting wraps around the narrowing snout.
    const nose = [[-2.27, .28], [-2.28, .59], [-2.13, .76], [-1.88, .78], [-1.72, .61], [-1.83, .36], [-2.05, .24]];
    const nostril = oval(-2.075, .60, .107, .061);
    panel(f, nose, [nostril], .12, (x, y) => .25 + (x + 2.28) * .23 + .03 * Math.sin(y * 4), side, 'armorLight', .018);
    panel(f, oval(-2.075, .60, .087, .042), [], .018, () => .263, side, 'black', .006);
    rail(f, [...oval(-2.075, .60, .108, .061, 28), [-1.967, .60]].map(([x, y]) => [x, y, .313 + (x + 2.075) * .17]), side, 'dark', .010);
    // Small facial pressure/sensor ports, inset into the casting rather than floating.
    for (let i = 0; i < 8; i++) {
      const x = -2.05 + i * .16, y = .30 + .02 * Math.cos(i * .5);
      const z = cheekSurface(x, y) + .086;
      f.disc([x, y, side * z], .021, .015, 'dark');
      f.disc([x, y, side * (z + .01)], .010, .013, i % 3 ? 'black' : 'copper');
    }
    // Lacrimal pillar and an overhanging, angled supraorbital brow.
    rail(f, [[-.83, .39, .52], [-.85, .69, .56], [-.77, .95, .61], [-.62, 1.10, .63]], side, 'steel', .084);
    const orbital = [
      [-.79, .86], [-.65, 1.04], [-.30, 1.10], [.02, .94], [.11, .64],
      [-.02, .32], [-.36, .28], [-.62, .45],
    ];
    const eyeWindow = [
      [-.62, .79], [-.51, .92], [-.31, .94], [-.13, .83], [-.11, .64],
      [-.25, .45], [-.41, .44], [-.57, .58],
    ];
    panel(f, orbital, [eyeWindow], .15, (x, y) => .59 + .052 * Math.sin(y * 3) + .03 * Math.cos(x * 3), side, 'silver', .020);
    rail(f, [...eyeWindow, eyeWindow[0]].map(([x, y]) => [x, y, .58 + .03 * Math.sin(y * 3)]), side, 'dark', .024);
    // The jugal arch is a separate curved casting under the orbit.
    rail(f, [[-.95, .25, .54], [-.67, .15, .62], [-.38, .23, .71], [-.05, .30, .73], [.19, .25, .61]], side, 'armorLight', .087);
    // Temporal opening, deep posterior cheek and quadrate hinge column.
    const rear = [[-.06, .92], [.21, .92], [.37, .67], [.30, .22], [.12, -.04], [-.16, .10], [-.18, .37], [-.08, .60]];
    const temporal = [[.06, .72], [.18, .76], [.24, .63], [.18, .44], [.08, .42], [.02, .54]];
    panel(f, rear, [temporal], .17, (x, y) => .53 + .10 * Math.sin(y * 3.2), side, 'armor', .021);
    rail(f, [[.23, .66, .59], [.28, .36, .62], [.09, .01, .60]], side, 'steel', .074);
    const cheek = [[-.28, .38], [-.07, .48], [.22, .29], [.23, -.05], [.07, -.18], [-.17, -.01], [-.36, .20]];
    panel(f, cheek, [oval(.02, .08, .086, .092, 24)], .075, () => .635, side, 'armor', .013);
    panel(f, [[-.25, .30], [-.10, .35], [.12, .21], [.10, .15], [-.07, .23]], [], .021, () => .684, side, 'armorLight', .005);
    // Rear skull side connection. The jaw hinge is exactly at the local origin.
    f.disc([0, 0, side * .54], .197, .10, 'dark');
    f.torus([0, 0, side * .61], .171, .019, 'silver');
    for (const [x, y] of [[-1.93, .42], [-1.66, .76], [-1.17, .82], [-.94, .93], [-.74, .37], [-.49, 1.02], [-.01, .94], [.22, .81], [.20, .32], [-.27, .30]]) {
      sideBolt(f, x, y, x < -.8 ? cheekSurface(x, y) + .094 : .718, side);
    }
    // Inset structural ribs are visible through both skull windows.
    rail(f, [[-1.76, .39, .25], [-1.22, .41, .30], [-.77, .70, .36], [-.32, .93, .36]], side, 'dark', .037);
    rail(f, [[-1.63, .54, .27], [-1.34, .69, .33], [-.75, .80, .38], [-.16, .61, .40], [.22, .25, .36]], side, 'copper', .021);
    rail(f, [[-.51, .56, .36], [-.15, .46, .40], [.19, .26, .35], [.25, .10, .28]], side, 'rubber', .033);
    // Actuator mounting clevis and transverse pin.
    const [ax, ay, az] = HEAD.driveUpper;
    f.disc([ax, ay, side * az], .105, .15, 'dark');
    f.torus([ax, ay, side * (az + .088)], .073, .014, 'copper');
    sideBolt(f, ax, ay, az + .102, side, .038);
  }
  // A closed premaxillary cap completes the snout in front view. The lateral
  // nostrils are behind this short cap, and remain actual recessed apertures.
  loft(f, [
    [-2.315, .485, 0, .205, .175], [-2.27, .475, 0, .255, .215],
    [-2.19, .475, 0, .285, .23], [-2.145, .46, 0, .292, .205],
  ], 'armorLight', {steps: 20, profile: CHAMFER});
  f.box([-2.326, .533, 0], [.013, .084, .245], 'dark', [0, 0, .03]);
  for (const side of [-1, 1]) {
    f.add(new THREE.CylinderGeometry(.030, .030, .016, 24), 'black', [-2.34, .533, side * .070], [0, 0, Math.PI / 2]);
    f.add(new THREE.CylinderGeometry(.018, .018, .021, 24), 'lens', [-2.35, .533, side * .070], [0, 0, Math.PI / 2]);
  }
  for (let i = 0; i < 3; i++) {
    f.box([-2.32, .376 + i * .032, 0], [.020, .011, .24 - i * .025], 'dark');
  }
  // Palatal vault: curved cross-members, longitudinal septum and recessed lamellae.
  loft(f, [
    [-2.21, .31, 0, .14, .11], [-2.09, .34, 0, .27, .13], [-1.94, .31, 0, .32, .08],
  ], 'armorLight', {steps: 18, profile: CHAMFER});
  for (let i = 0; i < 8; i++) {
    const x = -1.85 + i * .19, w = widthAt(x) - .07;
    beam(f, [[x, .255, -w], [x + .025, .40, -w * .55], [x + .03, .435, 0], [x + .025, .40, w * .55], [x, .255, w]], .029, i % 3 ? 'steel' : 'copper', {segments: 22, radial: 8});
    f.box([x, .454, 0], [.115, .025, .20 + i * .014], 'dark', [0, 0, -.12]);
  }
  loft(f, [[-1.93, .39, 0, .055, .058], [-1.37, .47, 0, .064, .056], [-.69, .50, 0, .08, .10], [-.11, .38, 0, .12, .12]], 'dark', {steps: 30, profile: CHAMFER});
  f.rod([.10, .15, -.56], [.10, .15, .56], .085, 'steel');
  f.rod([.17, .71, -.54], [.17, .71, .54], .065, 'dark');
  loft(f, [[.02, .39, 0, .27, .20], [.20, .35, 0, .31, .25], [.34, .30, 0, .19, .17]], 'dark', {steps: 18});
  for (let i = 0; i < 7; i++) {
    f.torus([.30 + i * .016, .30, 0], .173 - i * .004, .011, 'silver', [0, Math.PI / 2, 0]);
  }
}

export function buildCanopy(f) {
  // Three compound-curved nasal shells, each formed across the skull width.
  const stations = [
    [-2.23, .728, .00, .247, .10], [-2.02, .80, .00, .33, .11],
    [-1.64, .85, .00, .382, .115], [-1.23, .90, .00, .42, .12],
    [-.88, 1.02, .00, .46, .105],
  ];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    const start = [...a], end = [...b];
    start[0] += .014; end[0] -= .014;
    const shell = [start, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .012, 0, (a[3] + b[3]) / 2, .116], end];
    loft(f, shell, i === 0 ? 'armorLight' : 'armor', {steps: 18, profile: CHAMFER});
    for (const side of [-1, 1]) {
      const marks = [.30, .50, .70].map(t => {
        const [x, y, , , h] = sampleLoft(shell, t);
        return [x, y + h + .005, .115];
      });
      rail(f, marks, side, i === 1 ? 'orange' : 'steel', .007);
      const [sx, sy, , , sh] = sampleLoft(shell, .5);
      f.add(new THREE.CylinderGeometry(.017, .017, .010, 8), 'silver', [sx, sy + sh + .004, side * .20]);
      f.add(new THREE.CylinderGeometry(.007, .007, .012, 6), 'black', [sx, sy + sh + .007, side * .20]);
    }
  }
  // Wide, domed frontal and parietal roof, with an actual sagittal seam.
  const roof = [
    [-1.02, .94, 0, .44, .10], [-.77, 1.03, 0, .49, .145],
    [-.35, 1.095, 0, .57, .15], [.02, .98, 0, .55, .17], [.28, .81, 0, .40, .14],
  ];
  const ventProfile = [...CHAMFER, ...[-.375, -.25, -.125, 0, .125, .25, .375].map(z => [1, z])];
  loft(f, roof, 'armor', {
    steps: 48, profile: ventProfile,
    opening: (t, a, b) => t >= .38 && t <= .67 && a[0] === 1 && b[0] === 1 &&
      Math.abs((a[1] + b[1]) / 2) >= .12 && Math.abs((a[1] + b[1]) / 2) < .4,
  });
  for (const side of [-1, 1]) {
    // Overlapping supraorbital armour has thickness, a bevel and an undercut.
    panel(f, [[-.84, .98], [-.65, 1.18], [-.35, 1.23], [.02, 1.05], [.08, .91], [-.21, 1.00], [-.48, 1.06], [-.69, .93]], [], .17,
      (x, y) => .59 + .055 * Math.sin((x + .8) * 3), side, 'armor', .018);
    const browDetail = points => points.map(([x, y]) => [x, y, .59 + .055 * Math.sin((x + .8) * 3) + .103]);
    rail(f, browDetail([[-.72, 1.125], [-.52, 1.205], [-.29, 1.20]]), side, 'silver', .010);
    rail(f, browDetail([[-.60, 1.15], [-.45, 1.17], [-.31, 1.14]]), side, 'orange', .009);
    // Genuine roof openings with recessed trays and slanted cooling blades.
    // Sample the same loft as the casting so the grille follows its curved surface.
    const ventRail = (fraction, lateral) => {
      const [x, y, , w, h] = sampleLoft(roof, fraction);
      return [x, y + h + .003, side * w * lateral];
    };
    for (const lateral of [.125, .375]) {
      beam(f, [.375, .43, .50, .58, .675].map(t => ventRail(t, lateral)), .009, 'steel', {segments: 24, radial: 6});
    }
    for (let i = 0; i < 9; i++) {
      const t = .39 + i * .034, p = ventRail(t, .25);
      beam(f, [ventRail(t + .006, .125), [p[0], p[1] + .012, p[2]], ventRail(t - .006, .375)],
        .010, i % 3 ? 'steel' : 'silver', {segments: 8, radial: 6});
    }
    f.box([-.40, 1.14, side * .145], [.47, .027, .17], 'black', [0, 0, -.17]);
    for (const [x, y, z] of [[-.72, 1.13, .70], [-.07, 1.015, .727], [.22, .85, .47]]) sideBolt(f, x, y, z, side, .024);
  }
  // Sagittal crest is a shaped structural spine, not rectangular roof blocks.
  panel(f, [[-1.93, .88], [-1.60, .99], [-1.17, 1.04], [-.85, 1.16], [-.54, 1.28], [-.27, 1.27], [.12, 1.05], [-.18, 1.13], [-.57, 1.14], [-1.23, .97]],
    [], .085, () => 0, 1, 'armorLight', .013);
  rail(f, [[-1.61, .993, 0], [-1.18, 1.04, 0], [-.85, 1.17, 0], [-.53, 1.28, 0], [-.28, 1.27, 0]], 1, 'copper', .012);
}

const opticCenter = [-.365, .70, .60];

export function buildOptic(f, side) {
  const [x, y, z] = opticCenter;
  // A spherical pan/tilt body is recessed inside the orbital frame.
  f.add(new THREE.SphereGeometry(.187, 32, 24), 'black', [x, y, side * .51], [0, 0, 0], [1, 1, .88]);
  f.torus([x, y, side * z], .168, .017, 'steel');
  f.add(new THREE.TorusGeometry(.147, .014, 10, 48, Math.PI * 1.58), 'copper', [x, y, side * (z + .023)], [0, 0, -.66]);
  f.disc([x, y, side * (z + .014)], .138, .065, 'dark');
  f.torus([x, y, side * (z + .06)], .118, .010, 'silver');
  // Nine overlapping iris vanes, engraved scale and a curved lens stack.
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU;
    const vane = [[-.022, -.044], [.040, -.038], [.058, .025], [.012, .045]];
    const outline = vane.map(([vx, vy]) => [
      x + Math.cos(a) * (.080 + vx) - Math.sin(a) * vy,
      y + Math.sin(a) * (.080 + vx) + Math.cos(a) * vy,
    ]);
    panel(f, outline, [], .008, () => z + .073, side, i % 3 ? 'steel' : 'dark', .001);
  }
  f.add(new THREE.SphereGeometry(.069, 32, 20), 'lens', [x, y, side * (z + .081)], [0, 0, 0], [1, 1, .38]);
  f.torus([x, y, side * (z + .093)], .072, .007, 'glow');
  f.box([x - .014, y + .008, side * (z + .11)], [.016, .097, .006], 'black', [0, 0, -.08]);
  f.box([x - .031, y + .035, side * (z + .108)], [.025, .008, .008], 'glow', [0, 0, -.16]);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    f.box([x + Math.cos(a) * .158, y + Math.sin(a) * .158, side * (z + .043)], [.012, i % 3 === 0 ? .027 : .013, .009], i % 3 ? 'silver' : 'copper', [0, 0, a - Math.PI / 2]);
  }
  f.rod([x, y - .235, side * .48], [x, y + .235, side * .48], .029, 'steel');
  for (const v of [-1, 1]) {
    f.disc([x, y + v * .205, side * .54], .051, .07, 'dark');
    sideBolt(f, x, y + v * .205, .585, side, .024);
  }
  rail(f, [[x + .14, y + .10, .46], [x + .28, y + .12, .45], [.12, .49, .42], [.18, .28, .34]], side, 'rubber', .024);
}

export function buildEyelid(side, materials) {
  const columns = 24, rows = 12;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array((rows + 1) * (columns + 1) * 3), 3);
  positions.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positions);
  const indices = [];
  for (let row = 0; row < rows; row++) {
    const start = indices.length;
    for (let column = 0; column < columns; column++) {
      const top = row * (columns + 1) + column;
      const bottom = top + columns + 1;
      if (side > 0) indices.push(top, bottom, top + 1, top + 1, bottom, bottom + 1);
      else indices.push(top, top + 1, bottom, top + 1, bottom + 1, bottom);
    }
    if (row === rows - 1) {
      geometry.addGroup(0, start, 0);
      geometry.addGroup(start, indices.length - start, 1);
    }
  }
  geometry.setIndex(indices);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(...opticCenter.slice(0, 2), side * .70), .19);
  const mesh = new THREE.Mesh(geometry, [materials.steel, materials.copper]);
  mesh.name = 'eyelid';
  mesh.userData.system = 'skull';
  let lastClosure;
  const close = closure => {
    if (lastClosure === closure) return;
    lastClosure = closure;
    const [centerX, centerY, centerZ] = opticCenter;
    const tip = .68 + 2.34 * closure;
    for (let row = 0; row <= rows; row++) {
      const polar = row === rows ? tip : .08 + (tip - .14) * row / (rows - 1);
      const span = Math.sin(polar);
      for (let column = 0; column <= columns; column++) {
        const arc = Math.PI * (column / columns - .5);
        positions.setXYZ(row * (columns + 1) + column,
          centerX + .132 * span * Math.sin(arc),
          centerY + .137 * Math.cos(polar),
          side * (centerZ + .076 + .086 * span * Math.cos(arc)));
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  close(0);
  return {mesh, close};
}

export function buildMandible(f) {
  for (const side of [-1, 1]) {
    // A continuous horseshoe casting below joins the two hollow posterior rami.
    const ramus = [
      [-1.16, -.15], [-.92, -.08], [-.66, -.025], [-.42, .20], [-.21, .31], [.055, .14],
      [.17, .03], [.15, -.19], [-.21, -.31], [-.62, -.39], [-1.02, -.38],
    ];
    const fenestra = [[-.89, -.20], [-.66, -.14], [-.44, -.09], [-.33, -.15], [-.44, -.26], [-.68, -.29], [-.89, -.27]];
    panel(f, ramus, [fenestra], .145, jawSurface, side, 'silver', .019);
    rail(f, [...fenestra, fenestra[0]].map(([x, y]) => [x, y, jawSurface(x, y) - .074]), side, 'dark', .014);
    // Outer dentary shield is milled into several flowing panels.
    panel(f, [[-2.13, -.20], [-1.91, -.18], [-1.59, -.21], [-1.20, -.25], [-1.08, -.32], [-1.57, -.37], [-1.94, -.32]],
      [], .032, (x, y) => jawSurface(x, y) + .033, side, 'armor', .009);
    rail(f, [[-2.04, -.27, .339], [-1.74, -.32, .377], [-1.39, -.34, .445], [-1.07, -.30, .514], [-.72, -.33, .578], [-.33, -.22, .626]], side, 'copper', .016);
    rail(f, [[-1.84, -.18, .365], [-1.47, -.21, .429], [-1.17, -.25, .495]], side, 'silver', .011);
    // Coronoid tendon plate and hinge. Both rotate with the jaw, not with the skull.
    panel(f, [[-.49, .13], [-.27, .36], [-.14, .37], [-.01, .16], [-.21, .06]], [], .07, () => .51, side, 'dark', .012);
    for (let i = 0; i < 4; i++) {
      rail(f, [[-.35 + i * .045, .21, .56], [-.26 + i * .035, .10, .57]], side, 'silver', .009);
    }
    f.bearing([0, 0, side * .59], .204, side);
    for (const [x, y] of [[-2.10, -.25], [-1.84, -.31], [-1.45, -.34], [-1.07, -.32], [-.74, -.35], [-.34, -.27]]) {
      sideBolt(f, x, y, jawSurface(x, y) + .09, side, .020);
    }
    const [ax, ay, az] = HEAD.driveLower;
    f.disc([ax, ay, side * az], .093, .13, 'dark');
    f.torus([ax, ay, side * (az + .078)], .058, .012, 'copper');
    sideBolt(f, ax, ay, az + .095, side, .031);
  }
  // One smooth U-shaped dentary avoids the butt joints of separate chin blocks.
  beam(f, [
    [-.80, -.25, -.47], [-1.22, -.275, -.39], [-1.70, -.24, -.31],
    [-2.03, -.20, -.235], [-2.175, -.18, -.12], [-2.21, -.18, 0],
    [-2.175, -.18, .12], [-2.03, -.20, .235], [-1.70, -.24, .31],
    [-1.22, -.275, .39], [-.80, -.25, .47],
  ], t => .105 + .035 * Math.sin(t * Math.PI), 'armorLight', {segments: 110, radial: 20, flatten: .85});
  // Recessed, articulated cable cradle between the mandibular rami.
  for (let i = 0; i < 7; i++) {
    const x = -1.85 + i * .19, w = .13 + i * .025;
    loft(f, [[x - .07, -.22, 0, w * .9, .026], [x, -.195, 0, w, .04], [x + .075, -.20, 0, w, .026]], 'dark', {steps: 8, profile: CHAMFER});
    for (const side of [-1, 1]) {
      f.rod([x, -.22, side * w], [x, -.24, side * (w + .10)], .023, 'steel');
    }
  }
  for (const side of [-1, 1]) rail(f, [[-1.94, -.18, .09], [-1.45, -.14, .13], [-.85, -.13, .17], [-.16, -.12, .26]], side, 'copper', .019);
  f.rod([0, 0, -.59], [0, 0, .59], .085, 'steel');
  f.box([-.28, -.20, 0], [.17, .12, .64], 'dark');
}

/** The same arch positions drive tooth sockets, collars, crowns and visual checks. */
export function dentalArch(lower = false) {
  const count = lower ? 12 : 13;
  return Array.from({length: count}, (_, i) => {
    const t = i / (count - 1);
    const x = (lower ? -2.135 : -2.18) + (lower ? 1.42 : 1.50) * t;
    const z = (lower ? .105 : .155) + (lower ? .326 : .327) * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2);
    return {
      x, y: lower ? -.115 - .035 * Math.sin(t * Math.PI) : .181 + .024 * Math.cos(t * Math.PI),
      z, height: (lower ? .16 : .20) + (lower ? .105 : .15) * Math.sin(t * Math.PI) ** .7,
      radius: (lower ? .041 : .050) + (lower ? .017 : .022) * Math.sin(t * Math.PI),
    };
  });
}

export function buildTeeth(f, lower = false) {
  const direction = lower ? 1 : -1;
  const teeth = dentalArch(lower);
  for (const side of [-1, 1]) {
    const points = teeth.map(t => [t.x, t.y - direction * .027, side * t.z]);
    beam(f, points, lower ? .043 : .051, 'dark', {segments: 54, radial: 10});
    for (let i = 0; i < teeth.length; i++) {
      const {x, y, z, height: h, radius: r} = teeth[i];
      f.rod([x, y - direction * .048, side * z], [x, y + direction * .012, side * z], r * 1.25, 'steel');
      f.torus([x, y, side * z], r * 1.13, .009, 'copper', [Math.PI / 2, 0, 0]);
      const bend = .055 + h * .24;
      const crown = [
        [x, y, side * z], [x - .008, y + direction * h * .30, side * (z - .004)],
        [x + bend * .28, y + direction * h * .70, side * (z - .018)],
        [x + bend, y + direction * h, side * (z - .034)],
      ];
      beam(f, crown, t => r * (t < .16 ? 1 + .03 * Math.sin(t * Math.PI / .16) : Math.max(.012, (1 - t) ** .68)),
        'ivory', {segments: 22, radial: 16, flatten: .76});
      // A narrow cutting carina follows the recurved crown; it is not a straight cone.
      const carina = crown.slice(0, 3).map(([cx, cy, cz], n) => [cx - r * (.84 - n * .22), cy, cz + side * r * .13]);
      carina.push(crown[3]);
      beam(f, carina, t => .0045 * (1 - t) + .0007, 'silver', {segments: 15, radial: 5});
    }
  }
}

export function buildJawDrive(f, rod = false) {
  const length = rod ? .58 : .48;
  const sign = rod ? -1 : 1;
  f.rod([0, 0, 0], [0, sign * length, 0], rod ? .029 : .063, rod ? 'silver' : 'dark');
  if (!rod) {
    for (const y of [.07, .34, .445]) f.rod([0, y - .018, 0], [0, y + .018, 0], .074, 'steel');
    f.rod([0, .085, .058], [0, .36, .058], .012, 'copper');
    f.rod([.062, .10, 0], [.062, .33, 0], .010, 'silver');
  } else {
    f.rod([0, -.055, 0], [0, -.013, 0], .051, 'dark');
    f.rod([0, -.073, 0], [0, -.049, 0], .054, 'copper');
  }
  f.disc([0, 0, 0], rod ? .060 : .068, .095, 'steel');
  f.torus([0, 0, .051], rod ? .034 : .039, .009, 'copper');
}
