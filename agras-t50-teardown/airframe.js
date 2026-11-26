import * as THREE from 'three';
import {bolt, box, cylinder, decal, group, loft, mesh, plate, ring, tube} from './geometry.js';
import {stencil} from './materials.js';
import {FLIGHT} from './kinematics.mjs';

function mold(parent, material, outline, sections) {
  const width = outline.length, points = [], uv = [], indices = [];
  for (const [y, sx, sz, shift] of sections) {
    for (const [x, z] of outline) {
      points.push(x * sx, y, z * sz + shift);
      uv.push(x * sx + .5, z * sz * .5 + .5);
    }
  }
  for (let row = 0; row < sections.length - 1; row++) {
    for (let i = 0; i < width; i++) {
      const a = row * width + i, b = row * width + (i + 1) % width;
      indices.push(a, b, a + width, b, b + width, a + width);
    }
  }
  const top = (sections.length - 1) * width;
  for (let i = 1; i < width - 1; i++) indices.push(0, i + 1, i, top, top + i, top + i + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material);
}

const TANK = [
  [-.42, -.72], [-.54, -.59], [-.57, -.37], [-.57, .30], [-.51, .47],
  [-.29, .69], [-.18, .77], [.18, .77], [.29, .69], [.51, .47], [.57, .30],
  [.57, -.37], [.54, -.59], [.42, -.72],
];

export function makeTank(part, m) {
  mold(part, m.porcelain, TANK, [
    [-.35, .67, .78, -.03], [-.29, .80, .89, 0], [-.15, .92, .96, 0],
    [-.027, 1, 1, 0], [.27, 1, 1, 0], [.401, .95, .94, -.012], [.432, .87, .88, -.023],
  ]);
  const gasket = TANK.map(([x, z]) => [x * .69, z * .79 - .03]);
  plate(part, m.shellLow, gasket, -.358, .038, .010);
  const lip = TANK.map(([x, z]) => [x * .988, .09, z * .993]);
  tube(part, m.hdpeEdge, [...lip, lip[0], lip[1]], .011, 42, 6);
  plate(part, m.porcelain, [[-.30, -.596], [-.35, -.44], [-.26, .374], [0, .42], [.24, .31], [.26, -.48], [.16, -.596]],
    .440, .028, .012);
  const capX = .255, capZ = -.385;
  cylinder(part, m.hdpeEdge, .186, .208, .068, [capX, .449, capZ]);
  cylinder(part, m.black, .162, .175, .085, [capX, .509, capZ]);
  ring(part, m.titanium, .171, .147, .022, [capX, .526, capZ]);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const tooth = box(part, m.black, [.034, .047, .043], [capX + .166 * Math.cos(a), .516, capZ + .166 * Math.sin(a)], .007);
    tooth.rotation.y = -a;
  }
  tube(part, m.rubber, [[.397, .503, -.40], [.437, .464, -.304], [.407, .443, -.20]], .014, 16, 8);
  const label = stencil([['AGRAS T50', 850, .39], ['40 L', 650, .22, 'JetBrains Mono']], '#354237');
  decal(part, label, [.49, .158], [-.065, .462, .187]);
  for (const sign of [-1, 1]) {
    box(part, m.black, [.060, .137, .126], [sign * .467, -.266, -.18], .011);
    box(part, m.safety, [.062, .063, .140], [sign * .473, -.21, -.18], .016);
  }
}

const DECK = [
  [-.40, -.99], [-.56, -.80], [-.56, .84], [-.42, 1.00], [.42, 1.00], [.56, .84], [.56, -.80], [.40, -.99],
];

export function makeDeck(part, m) {
  const mountingHole = [[-.30, -.52], [-.31, .56], [0, .66], [.31, .56], [.30, -.52]];
  plate(part, m.titanium, DECK, -.196, .129, .026, [mountingHole]);
  plate(part, m.black, DECK.map(([x, z]) => [x * .90, z * .93]), -.312, .109, .025);
  for (const sign of [-1, 1]) {
    const x = sign * .52;
    tube(part, m.carbon, [[x, -.21, -.91], [x, -.06, -.68], [x, .08, -.24], [x, .08, .52], [x, -.08, .92]], .071, 25, 14);
    const clamp = box(part, m.titanium, [.155, .18, .88], [x, -.091, .05], .024);
    clamp.rotation.z = -sign * .08;
    for (const z of [-.74, -.41, .37, .74]) {
      const level = z < -.7 ? .112 : .023;
      box(part, m.black, [.19, .18, .17], [sign * .495, level, z], .028);
      bolt(part, m, [sign * .54, level + .106, z], .034);
    }
    box(part, m.titanium, [.182, .14, .171], [sign * .500, -.004, -.74], .018);
    box(part, m.anodized, [.07, .047, .77], [sign * .352, -.122, -.22], .012);
  }
  box(part, m.titanium, [.89, .08, .13], [0, -.107, -.67], .014);
  box(part, m.titanium, [.89, .08, .12], [0, -.117, .65], .014);
}

export function makeArm(part, m, {dx, dz, length, front}) {
  const arm = group(part);
  arm.rotation.y = Math.atan2(dx, dz);
  cylinder(arm, m.carbon, .088, .105, length - .20, [0, 0, length / 2 + .015], 'z');
  for (const [z, radius, h] of [[.20, .110, .066], [length - .20, .108, .070]]) {
    ring(arm, m.titanium, radius, .088, h, [0, 0, z], 'z');
  }
  ring(arm, m.safety, .106, .101, .070, [0, 0, .31], 'z');
  box(arm, m.rubber, [.198, .165, .084], [0, -.013, .098], .020);
  const riser = [[-.149, -.17], [-.152, .04], [-.10, .133], [.10, .133], [.152, .04], [.149, -.17]];
  const hole = [[-.061, -.114], [-.068, .03], [.073, .03], [.061, -.114]];
  for (const y of [-.075, .070]) plate(arm, m.titanium, riser, y, .060, .012, [hole]);
  cylinder(arm, m.black, .109, .109, .184, [0, 0, -.075]);
  ring(arm, m.anodized, .097, .047, .021, [0, .107, -.075]);
  bolt(arm, m, [0, .124, -.075], .049);
  box(arm, front ? m.safety : m.titanium, [.146, .036, .116], [0, .128, .062], .011);
  const end = box(arm, m.titanium, [.232, .168, .305], [0, -.002, length - .111], .039);
  end.rotation.y = -.035;
  for (let i = 0; i < 8; i++) {
    box(arm, m.black, [.205, .016, .009], [0, .084, length - .217 + .020 * i], .003);
  }
  for (const x of [-.078, .078]) bolt(arm, m, [x, .10, length - .10], .022);
}

export function makeSkid(part, m, sign) {
  const x = sign * .706;
  const bottom = FLIGHT.floor + .046;
  tube(part, m.rubber, [
    [x, bottom + .13, -1.01], [x, bottom + .031, -.89], [x, bottom + .002, -.755],
    [x, bottom + .034, -.61], [x, bottom + .157, -.42], [x, bottom + .184, -.29],
    [x, bottom + .184, .27], [x, bottom + .16, .40], [x, bottom + .034, .62],
    [x, bottom + .002, .755], [x, bottom + .031, .89], [x, bottom + .13, 1.01],
  ], .040, 46, 12);
  for (const end of [-1, 1]) {
    const z = end * .755;
    tube(part, m.carbon, [[sign * .45, -.263, z * .67], [sign * .51, -.46, z * .74], [x, -.99, z], [x, bottom + .015, z]],
      .061, 16, 12);
    const foot = box(part, m.rubber, [.127, .082, .226], [x, FLIGHT.floor + .041, z], .023);
    foot.rotation.y = sign * .009;
    box(part, m.titanium, [.179, .100, .162], [sign * .46, -.275, z * .67], .024);
    bolt(part, m, [sign * .465, -.214, z * .67], .031);
    for (let i = 0; i < 3; i++) box(part, m.black, [.137, .024, .018], [x, bottom + .007, z - .053 + .053 * i], .005);
  }
}

export function makeSkidBrace(part, m) {
  for (const z of [-.70, .70]) {
    cylinder(part, m.titanium, .041, .041, 1.26, [0, -.979, z], 'x');
    for (const sign of [-1, 1]) {
      box(part, m.black, [.088, .121, .143], [sign * .641, -.979, z], .019);
      bolt(part, m, [sign * .643, -.906, z], .025);
    }
  }
}

const NOSE = [
  [.53, .49, .260, .57], [.74, .501, .279, .54], [.91, .480, .242, .53],
  [1.09, .437, .160, .448], [1.18, .337, .075, .341],
];
const CROSS = [
  [-.79, 1], [-.99, .67], [-1, .39], [-.76, .095], [-.41, 0], [.41, 0],
  [.76, .095], [1, .39], [.99, .67], [.79, 1],
];

export function makeNose(part, m) {
  loft(part, [m.nose, m.shellLow, m.black], NOSE, CROSS, [2, 1, 0, 0, 0, 0, 0, 1, 2], .034);
  const outline = [[-.40, .54], [-.42, .89], [-.33, 1.126], [.33, 1.126], [.42, .89], [.40, .54]];
  plate(part, m.shellLow, outline, -.247, .090, .024);
  box(part, m.nose, [.696, .327, .114], [0, -.094, 1.152], .045);
  box(part, m.rubber, [.258, .047, .045], [0, -.209, 1.204], .009);
  for (const sign of [-1, 1]) bolt(part, m, [sign * .241, .178, .885], .028);
}
