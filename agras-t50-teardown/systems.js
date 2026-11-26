import * as THREE from 'three';
import {batch, bolt, box, cylinder, decal, group, mesh, plate, ring, tube} from './geometry.js';
import {stencil} from './materials.js';

const BLADE = [
  [.115, .11, .014, .33], [.215, .213, .010, .44], [.36, .287, -.005, .37],
  [.57, .286, -.044, .29], [.80, .255, -.099, .22], [1.02, .211, -.167, .16],
  [1.14, .174, -.216, .12], [1.23, .131, -.258, .09], [1.30, .086, -.292, .07],
  [1.34, .066, -.311, .04], [1.35, .043, -.316, .03],
];

function bladeGeometry(hand) {
  const bands = 9, row = (bands + 1) * 2;
  const positions = [], uv = [], indices = [[], [], []];
  for (const [radius, chord, sweep, twist] of BLADE) {
    for (const side of [1, -1]) {
      for (let j = 0; j <= bands; j++) {
        const t = j / bands;
        const camber = Math.sin(t * Math.PI);
        const thickness = side * .014 * camber * (1.25 - radius * .65);
        positions.push(radius * 1.16, (t - .43) * chord * twist + .023 * camber + thickness, hand * (sweep + (t - .5) * chord) * .93);
        uv.push(radius * 2.32, t * .67);
      }
    }
  }

  const triangle = (list, a, b, c) => list.push(a, hand > 0 ? b : c, hand > 0 ? c : b);
  for (let i = 0; i < BLADE.length - 1; i++) {
    const list = indices[i === 7 ? 2 : i >= 6 ? 1 : 0];
    const base = i * row;
    for (const face of [0, 1]) {
      for (let j = 0; j < bands; j++) {
        const a = base + face * (bands + 1) + j;
        if (face === 0) {
          triangle(list, a, a + 1, a + row);
          triangle(list, a + 1, a + row + 1, a + row);
        } else {
          triangle(list, a, a + row, a + 1);
          triangle(list, a + 1, a + row, a + row + 1);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices.flat());
  let offset = 0;
  indices.forEach((list, i) => {
    geometry.addGroup(offset, list.length, i);
    offset += list.length;
  });
  geometry.computeVertexNormals();
  return geometry;
}

export function makePropellers(part, m, angle, hand, lower) {
  const hub = group(part);
  const blades = [];
  for (const turn of [0, Math.PI]) {
    const blade = mesh(hub, bladeGeometry(hand), [lower ? m.bladeLower : m.blade, m.tip, m.pale]);
    blade.rotation.y = turn;
    blades.push(blade);
  }
  box(hub, m.carbon, [.44, .056, .137], [0, .002, 0], .024);
  cylinder(hub, m.black, .106, .119, .058, [0, .005, 0]);
  ring(hub, m.anodized, .103, .065, .025, [0, .043, 0]);
  cylinder(hub, m.titanium, .062, .063, .03, [0, .042, 0], 'y', 12);
  for (const x of [-.157, .157]) bolt(hub, m, [x, .033, 0], .026);
  batch(hub);
  const blur = mesh(part, new THREE.PlaneGeometry(3.22, 3.22), m.rotorSweep, 0, .009, 0);
  blur.rotation.x = -Math.PI / 2;
  blur.castShadow = blur.receiveShadow = false;
  blur.visible = false;
  return (motion, speed) => {
    hub.rotation.y = angle + hand * motion;
    blur.rotation.z = hub.rotation.y;
    blur.visible = speed > .32;
    for (const blade of blades) blade.visible = speed < .72;
  };
}

export function makeStator(part, m) {
  cylinder(part, m.titanium, .213, .203, .060, [0, .025, 0]);
  ring(part, m.steel, .221, .175, .022, [0, .060, 0]);
  cylinder(part, m.black, .110, .12, .135, [0, .110, 0]);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6, x = Math.cos(angle), z = Math.sin(angle);
    const tooth = group(part, x * .141, .126, z * .141);
    tooth.rotation.y = Math.PI / 2 - angle;
    box(tooth, m.steel, [.069, .064, .077], [0, 0, 0], .008);
    for (let turn = -1; turn <= 1; turn++) {
      const winding = mesh(tooth, new THREE.TorusGeometry(.042, .011, 8, 18), turn === 0 ? m.brightCopper : m.copper, 0, 0, turn * .019);
      winding.scale.set(.94, 1.18, .9);
    }
    box(tooth, m.titanium, [.069, .070, .015], [0, .002, .046], .005);
  }
  cylinder(part, m.steel, .034, .037, .24, [0, .149, 0]);
  ring(part, m.gold, .077, .033, .026, [0, .181, 0]);
  bolt(part, m, [0, .274, 0], .027);
}

export function makeMotorBell(part, m) {
  ring(part, m.titanium, .212, .185, .048, [0, -.065, 0]);
  ring(part, m.black, .206, .172, .063, [0, .041, 0]);
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI / 9;
    const web = box(part, m.black, [.023, .116, .040], [.185 * Math.cos(a), -.012, .185 * Math.sin(a)], .006);
    web.rotation.y = -a;
  }
  ring(part, m.ceramicEdge, .207, .192, .013, [0, .062, 0]);
  ring(part, m.titanium, .188, .067, .030, [0, .086, 0]);
  cylinder(part, m.black, .065, .089, .044, [0, .104, 0]);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    bolt(part, m, [Math.cos(a) * .135, .099, Math.sin(a) * .135], .019);
  }
}

export function makeMotorHub(part, m) {
  const profile = [[0, -.214], [.164, -.214], [.205, -.187], [.234, -.136], [.245, -.085],
    [.245, .044], [.233, .092], [.210, .135], [.177, .174], [0, .174]].map(p => new THREE.Vector2(...p));
  mesh(part, new THREE.LatheGeometry(profile, 48), m.black);
  ring(part, m.rubber, .247, .230, .019, [0, -.071, 0]);
  for (const end of [-1, 1]) {
    ring(part, m.titanium, .199, .159, .050, [0, end > 0 ? .16 : -.174, 0]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      bolt(part, m, [.165 * Math.sin(a), .196 * end, .165 * Math.cos(a)], .021);
    }
  }
  cylinder(part, m.steel, .047, .047, .65, [0, -.008, 0]);
}

export function makeBattery(part, m) {
  box(part, m.nose, [.748, .70, .462], [0, -.013, -.010], .066);
  box(part, m.black, [.721, .09, .460], [0, .324, -.019], .023);
  box(part, m.titanium, [.703, .14, .440], [0, -.288, -.016], .043);
  box(part, m.black, [.48, .12, .083], [0, .236, -.247], .016);
  box(part, m.shellLow, [.382, .046, .084], [0, .385, -.024], .015);
  for (const sign of [-1, 1]) {
    box(part, m.shellLow, [.092, .108, .085], [sign * .154, .363, -.024], .016);
    box(part, m.black, [.032, .129, .307], [sign * .375, .237, -.018], .013);
    for (let i = 0; i < 7; i++) box(part, m.shellLow, [.010, .398, .019], [sign * .374, -.066, -.161 + i * .048], .004);
  }
  const label = stencil([['DB1560', 820, .38], ['FLIGHT BATTERY', 600, .18, 'JetBrains Mono']], '#d5d9d3');
  decal(part, label, [.42, .15], [0, .116, -.246], Math.PI);
  for (let i = 0; i < 4; i++) {
    box(part, i < 3 ? m.led : m.shellLow, [.032, .016, .019], [-.073 + i * .048, .242, -.292], .004);
  }
}

function chip(part, m, x, z, size, rows) {
  box(part, m.chip, [size, .047, size], [x, .051, z], .008);
  const pitch = size * .84 / rows;
  for (let i = 0; i < rows; i++) {
    const offset = (i - (rows - 1) / 2) * pitch;
    for (const sign of [-1, 1]) {
      box(part, m.gold, [.063, .013, pitch * .56], [x + sign * size * .52, .030, z + offset], .002);
      box(part, m.gold, [pitch * .56, .013, .063], [x + offset, .030, z + sign * size * .52], .002);
    }
  }
  cylinder(part, m.silk, .015, .015, .002, [x - size * .32, .076, z - size * .32], 'y', 12);
}

export function makeBoard(part, m) {
  const outline = [[-.40, -.62], [-.48, -.53], [-.48, .51], [-.36, .63], [.36, .63], [.48, .51], [.48, -.53], [.40, -.62]];
  plate(part, m.boardEdge, outline, 0, .036, .008);
  plate(part, m.board, outline.map(([x, z]) => [x * .98, z * .985]), .021, .009, .002);
  chip(part, m, -.059, .115, .291, 9);
  chip(part, m, .23, -.28, .16, 5);
  chip(part, m, -.256, -.33, .131, 5);
  const mark = stencil([['T50 / AVIONICS', 700, .38, 'JetBrains Mono']], '#c2d4c1', [256, 84]);
  decal(part, mark, [.275, .091], [.204, .036, .44]);
  const cpu = stencil([['T50', 700, .46, 'JetBrains Mono']], '#a4bcb8', [128, 80]);
  decal(part, cpu, [.118, .074], [-.040, .077, .117]);
  for (const [x, z] of [[-.38, -.50], [.38, -.50], [-.39, .49], [.39, .49]]) {
    ring(part, m.gold, .052, .026, .006, [x, .029, z]);
    cylinder(part, m.black, .021, .021, .003, [x, .031, z], 'y', 12);
    cylinder(part, m.steel, .049, .057, .080, [x, -.062, z], 'y', 12);
  }

  for (const sign of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z0 = -.031 + i * .043;
      const bend = sign * (.267 + i * .018);
      const z1 = z0 + (i < 4 ? -.118 : .127);
      const coordinates = [[sign * .116, z0], [bend - sign * .042, z0], [bend, z1], [sign * .443, z1]];
      for (let j = 1; j < coordinates.length; j++) {
        const [x0, za] = coordinates[j - 1], [x1, zb] = coordinates[j];
        const trace = box(part, i % 3 === 0 ? m.gold : m.boardEdge,
          [Math.hypot(x1 - x0, zb - za) + .007, .002, .006], [(x0 + x1) * .5, .027, (za + zb) * .5]);
        trace.rotation.y = Math.atan2(za - zb, x1 - x0);
      }
      cylinder(part, m.gold, .011, .011, .004, [sign * .442, .028, z1], 'y', 10);
    }
  }
  for (let i = 0; i < 30; i++) {
    const row = Math.floor(i / 10), x = -.327 + .072 * (i % 10);
    const z = [.393, -.46, -.544][row];
    box(part, i % 3 === 0 ? m.ceramicEdge : m.chip, [.043, .024, .027], [x, .040, z], .003);
    for (const side of [-1, 1]) box(part, m.gold, [.010, .016, .028], [x + .024 * side, .033, z], .001);
  }
  for (const z of [-.31, -.17]) {
    cylinder(part, m.indigo, .053, .054, .070, [-.065, .065, z], 'y', 24);
    cylinder(part, m.anodized, .048, .048, .003, [-.065, .102, z], 'y', 24);
  }
  for (const x of [-.26, .055, .28]) {
    box(part, m.pale, [.177, .073, .083], [x, .057, .572], .007);
    box(part, m.black, [.144, .042, .008], [x, .063, .618]);
    for (let pin = -2; pin <= 2; pin++) box(part, m.gold, [.011, .011, .013], [x + pin * .022, .053, .622]);
  }
}

function optics(parent, m, radius, position, main) {
  const lens = group(parent, ...position);
  ring(lens, m.titanium, radius, radius * .69, .090 * radius / .23, [0, 0, 0], 'z');
  ring(lens, m.anodized, radius * .96, radius * .86, .021 * radius / .23, [0, 0, .045 * radius / .23], 'z');
  ring(lens, m.black, radius * .85, radius * .64, .025 * radius / .23, [0, 0, .043 * radius / .23], 'z');
  const lensSurface = mesh(lens, new THREE.SphereGeometry(radius * .70, 32, 20), main ? m.lensCoat : m.lensDark,
    0, 0, .025 * radius / .23);
  lensSurface.scale.z = .28;
  const iris = mesh(lens, new THREE.SphereGeometry(radius * .34, 28, 16), m.lensDark, 0, 0, .059 * radius / .23);
  iris.scale.z = .25;
  if (main) {
    for (const [a, b, r] of [[.40, 1.15, .47], [3.60, 4.14, .55]]) {
      const points = Array.from({length: 8}, (_, i) => {
        const angle = THREE.MathUtils.lerp(a, b, i / 7);
        return [Math.cos(angle) * radius * r, Math.sin(angle) * radius * r, radius * .287];
      });
      tube(lens, m.lensGlint, points, radius * .014, 12, 6).castShadow = false;
    }
  }
  return lens;
}

export function makeSensors(part, m) {
  const tower = group(part, 0, .286, .884);
  cylinder(tower, m.titanium, .162, .163, .072, [0, -.027, 0]);
  cylinder(tower, m.nose, .145, .162, .224, [0, .111, 0], 'y', 44);
  cylinder(tower, m.hdpeEdge, .135, .145, .032, [0, .235, 0], 'y', 44);
  ring(tower, m.rubber, .165, .151, .016, [0, .026, 0]);
  for (const side of [-1, 1]) {
    const eye = group(part, side * .279, -.052, 1.208);
    eye.rotation.y = side * .17;
    box(eye, m.black, [.190, .091, .080], [0, 0, -.009], .028);
    optics(eye, m, .032, [-side * .046, 0, .037], false);
    cylinder(eye, m.pale, .022, .022, .011, [side * .052, 0, .040], 'z', 20);
    const lowerEye = group(part, side * .111, -.295, 1.055);
    lowerEye.rotation.x = .98;
    box(lowerEye, m.black, [.104, .076, .046], [0, 0, -.009], .013);
    optics(lowerEye, m, .031, [0, 0, .022], false);
  }
  box(part, m.titanium, [.288, .122, .173], [0, -.287, 1.033], .028);
  cylinder(part, m.black, .067, .079, .075, [0, -.345, 1.110]);
  const camera = group(part, 0, -.399, 1.136);
  camera.rotation.x = .19;
  box(camera, m.black, [.192, .144, .129], [0, 0, -.035], .027);
  optics(camera, m, .061, [0, 0, .043], true);
}

export function makeRearRadar(part, m) {
  box(part, m.titanium, [.261, .163, .129], [0, .009, .052], .025);
  cylinder(part, m.black, .140, .151, .110, [0, -.061, -.038], 'z', 36);
  cylinder(part, m.nose, .123, .134, .041, [0, -.061, -.101], 'z', 36);
  ring(part, m.rubber, .146, .120, .014, [0, -.061, -.099], 'z');
}

export function makeNavigationCaps(part, m) {
  for (const x of [-.425, .425]) {
    box(part, m.titanium, [.12, .254, .131], [x, .153, 0], .026);
    cylinder(part, m.black, .072, .079, .052, [x, .282, 0]);
    cylinder(part, m.nose, .064, .074, .085, [x, .342, 0]);
  }
}

export function makeNozzle(part, m) {
  cylinder(part, m.black, .079, .084, .118, [0, -.038, 0]);
  const bracket = box(part, m.titanium, [.148, .322, .109], [0, -.238, -.060], .024);
  bracket.rotation.x = -.285;
  plate(part, m.black, [[-.066, -.082], [-.071, .048], [0, .08], [.069, .049], [.066, -.087]], -.382, .093, .021);
  tube(part, m.rubber, [[.083, -.112, .015], [.096, -.215, -.036], [.076, -.323, -.070], [.053, -.411, -.024]], .017, 14, 10);
  cylinder(part, m.nose, .068, .073, .125, [0, -.463, -.018]);
  ring(part, m.steel, .081, .055, .026, [0, -.512, -.018]);
  cylinder(part, m.black, .092, .103, .044, [0, -.548, -.018]);
  ring(part, m.titanium, .120, .096, .021, [0, -.576, -.018]);
  for (const x of [-.050, .050]) bolt(part, m, [x, -.133, -.081], .019, 'z');
  return group(part, 0, -.587, -.018);
}
