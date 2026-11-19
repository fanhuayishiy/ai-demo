import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Exterior illustrations of Flight 15 V3 hardware. All dimensions below are in
// model space. Repeated pieces share a material and are batched before display.
const TAU = Math.PI * 2;
const shieldStart = 1.88;
const shieldArc = 3.78;
const prototypes = new Map();
let surfaces;

function noise(x, y) {
  let n = Math.imul(x + 641, 374761393) + Math.imul(y + 13, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function surfaceMap(width, height, sample) {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = 4 * (y * width + x);
      const value = sample(x, y);
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function materials() {
  if (surfaces) return surfaces;
  const steel = surfaceMap(512, 256, (x, y) => {
    const plate = Math.floor(y / 64);
    const band = y % 64;
    const longitudinal = (x + plate * 93) % 256;
    const polish = 9 * Math.sin(x / 512 * TAU + .18 * Math.sin(y / 256 * TAU))
      + 5 * Math.cos(x / 512 * TAU * 4 + plate * .46);
    return 185 + polish + 9 * noise(y, 18) + 8 * noise(x, y) + 30 * noise(plate, 6)
      - (band < 3 ? 48 : 0) + (band === 3 ? 18 : 0) - (longitudinal < 2 ? 18 : 0);
  });
  // A periodic pointy-top tessellation, with a slightly different firing
  // color per tile. Its UVs follow the hull in metres through the ogive.
  const tiles = surfaceMap(256, 256, (x, y) => {
    const u = x / 32;
    const v = y / 32;
    let nearest = Infinity;
    let tone = 0;
    const row = Math.round(v);
    for (let r = row - 1; r <= row + 1; r++) {
      const shift = (r & 1) * .5;
      const c = Math.round(u - shift);
      const dx = Math.abs(u - c - shift);
      const dy = Math.abs(v - r);
      const edge = Math.max(dx * 2, dx + 1.5 * dy);
      if (edge < nearest) {
        nearest = edge;
        tone = noise((c + 16) % 8, (r + 16) % 8);
      }
    }
    const bevel = nearest > .947 ? -18 : nearest > .88 ? 9 : 0;
    return 61 + tone * 24 + bevel + noise(x, y) * 8;
  });
  const metal = (color, metalness, roughness, more = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...more });
  surfaces = {
    shell: metal(0xe4e9ef, .71, .30, { map: steel, bumpMap: steel, bumpScale: .033 }),
    tiles: metal(0xd4d9e0, .12, .82, { map: tiles, bumpMap: tiles, bumpScale: .035 }),
    polished: metal(0xcdd4d8, .64, .25),
    silver: metal(0x9ca8b0, .55, .39),
    aluminum: metal(0xd1d4d6, .42, .38),
    graphite: metal(0x383f49, .41, .56),
    turbine: metal(0x53545a, .62, .38),
    nozzle: metal(0x6a6564, .57, .48),
    throat: metal(0x252328, .24, .78),
    copper: metal(0x9a725f, .55, .48),
    cavity: metal(0x181c22, .36, .70),
    ceramic: metal(0x50565c, .14, .80),
  };
  return surfaces;
}

const group = () => new THREE.Group();
const point = (a) => new THREE.Vector3(...a);

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}

function box(parent, size, material, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE.BoxGeometry(...size), material, x, y, z);
}

function cylinder(parent, top, base, height, material, y, segments = 48) {
  return mesh(parent, new THREE.CylinderGeometry(top, base, height, segments), material, 0, y, 0);
}

function rod(parent, p1, p2, radius, material, segments = 8) {
  const a = point(p1), b = point(p2);
  const direction = b.clone().sub(a);
  const center = a.add(b).multiplyScalar(.5);
  const part = mesh(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), segments),
    material, center.x, center.y, center.z);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return part;
}

function loop(parent, radius, tube, height, material, segments = 72) {
  const ring = mesh(parent, new THREE.TorusGeometry(radius, tube, 5, segments), material, 0, height, 0);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

function skin(parent, profile, material, start = 0, arc = TAU, mode = '', around = 80) {
  const segments = Math.max(8, Math.ceil(around * arc / TAU));
  const coords = profile.map(([radius, y]) => new THREE.Vector2(radius, y));
  const geometry = new THREE.LatheGeometry(coords, segments, start, arc);
  const uv = geometry.attributes.uv;
  if (mode) {
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j < profile.length; j++) {
        const [radius, y] = profile[j];
        const angle = start + i / segments * arc;
        const index = i * profile.length + j;
        if (mode === 'tiles') uv.setXY(index, (angle - start - arc / 2) * Math.max(radius, 1.2) / 3.15, y / 2.74);
        else uv.setXY(index, angle / TAU, y / 7.34);
      }
    }
  }
  return mesh(parent, geometry, material);
}

function attach(parent, obj, angle, radius, height) {
  // Local +X is radial, +Z tangential.
  obj.rotation.y = angle - Math.PI / 2;
  obj.position.set(radius * Math.sin(angle), height, radius * Math.cos(angle));
  parent.add(obj);
  return obj;
}

// Illustration offsets are chosen for legibility in the viewer. Components
// are batched inside each named section, retaining their identities for picks.
function section(node, name, delta, partId) {
  node.name = name;
  node.userData.section = { delta, partId };
  return node;
}

function subgroup(parent, name, delta, partId) {
  const layer = section(group(), name, delta, partId);
  parent.add(layer);
  return layer;
}

function outward(angle, distance, vertical = 0) {
  return [distance * Math.sin(angle), vertical, distance * Math.cos(angle)];
}

function bake(source, name) {
  source.updateMatrixWorld(true);
  const result = group();
  result.name = name;
  result.userData.partId = name;
  const batches = new Map();
  function collect(item, owner) {
    if (item.userData.section) {
      const { delta, partId } = item.userData.section;
      const layer = group();
      layer.name = item.name;
      layer.userData.partId = partId || owner.userData.partId;
      const toWorld = new THREE.Matrix3().setFromMatrix4(item.parent.matrixWorld);
      layer.userData.viewOffset = point(delta).applyMatrix3(toWorld).toArray();
      owner.add(layer);
      owner = layer;
    }
    if (item.isMesh) {
      let geometry = item.geometry.index ? item.geometry.toNonIndexed() : item.geometry.clone();
      geometry.applyMatrix4(item.matrixWorld);
      if (item.matrixWorld.determinant() < 0) {
        const indices = [];
        for (let i = 0; i < geometry.attributes.position.count; i += 3) indices.push(i, i + 2, i + 1);
        geometry.setIndex(indices);
        geometry = geometry.toNonIndexed();
      }
      geometry.clearGroups();
      if (!batches.has(owner)) batches.set(owner, new Map());
      const materials = batches.get(owner);
      if (!materials.has(item.material)) materials.set(item.material, []);
      materials.get(item.material).push(geometry);
    }
    for (const child of item.children) collect(child, owner);
  }
  collect(source, result);
  for (const [owner, batch] of batches) {
    for (const [material, geometries] of batch) {
      const merged = mergeGeometries(geometries, false);
      merged.computeBoundingSphere();
      mesh(owner, merged, material).userData.partId = owner.userData.partId;
    }
  }
  return result;
}

export function setModelExplosion(object, amount) {
  const fraction = THREE.MathUtils.clamp(Number.isFinite(amount) ? amount : 0, 0, 1);
  object.traverse(node => {
    if (node.userData.viewOffset) node.position.fromArray(node.userData.viewOffset).multiplyScalar(fraction);
  });
}
function bell(parent, x, y, z, radius, height, detailed = false) {
  const m = materials();
  const mount = group();
  mount.position.set(x, y, z);
  parent.add(mount);
  const profile = [
    [1, 0], [.98, .08], [.83, .33], [.63, .57], [.43, .76], [.30, .86],
    [.24, .9], [.28, .95], [.28, 1],
  ].map(([r, h]) => [r * radius, h * height]);
  const rimResolution = detailed ? 64 : 32;
  skin(mount, profile, m.nozzle, 0, TAU, '', rimResolution);
  const liner = profile.map(([r, y]) => [r * .966, y + .015]).reverse();
  skin(mount, liner, m.throat, 0, TAU, '', rimResolution);
  cylinder(mount, .28 * radius, .28 * radius, height * .08, m.cavity, height * .94, 24);
  loop(mount, radius * .99, radius * .038, height * .02, m.silver, detailed ? 64 : 24);
  if (!detailed) return;
  for (let i = 1; i < 10; i++) {
    const yFrac = i * .073;
    let k = 1;
    while (profile[k][1] < height * yFrac) k++;
    const [a, b] = [profile[k - 1], profile[k]];
    const radiusAt = THREE.MathUtils.lerp(a[0], b[0], (yFrac * height - a[1]) / (b[1] - a[1]));
    loop(mount, radiusAt, .021, yFrac * height, i === 7 ? m.copper : m.turbine, 48);
  }
}

function raptor() {
  const m = materials(), g = group();
  const nozzle = subgroup(g, 'Nozzle exterior', [0, -.96, 0]);
  bell(nozzle, 0, 0, 0, 1.02, 1.72, true);
  // The compact Raptor 3 has a cleaner cast exterior than earlier variants.
  const head = subgroup(g, 'Upper housing', [0, .65, 0]);
  skin(head, [[.28, 1.62], [.45, 1.83], [.46, 2.06], [.38, 2.23], [.26, 2.43]], m.turbine);
  for (const h of [1.76, 1.99, 2.22]) loop(head, .40, .046, h, m.silver, 32);
  for (const [x, z, lean] of [[-.33, .06, -.42], [.34, -.12, .52]]) {
    const housing = group();
    housing.position.set(x, 2.17, z);
    housing.rotation.z = lean;
    head.add(housing);
    skin(housing, [[.18, -.43], [.28, -.30], [.29, .13], [.23, .25], [.21, .46]], m.silver);
    for (const y of [-.27,.15,.43]) loop(housing, y > .2 ? .21 : .28, .038, y, m.polished, 28);
    cylinder(housing, .17, .17, .035, m.cavity, .46, 24);
  }
  const brace = subgroup(g, 'External mount', [.49, .22, .12]);
  box(brace, [.99, .11, .60], m.turbine, 0, 2.63, 0);
  for (const side of [-1, 1]) {
    rod(brace, [side * .43, 2.60, .23], [side * .33, 1.93, .26], .052, m.silver);
  }
  return g;
}

function engineSection(upper = false) {
  const m = materials(), g = group();
  const support = upper ? 1.83 : 1.50;
  // Exposed engine mounts form an open spoke structure on the third generation.
  cylinder(g, 1.14, 1.24, .32, m.graphite, support);
  loop(g, 4.31, .12, support - .12, m.silver);
  const rings = upper ? [[3, 2.56, 1.05, 0], [3, 1.00, .59, Math.PI / 3]]
    : [[20, 3.66, .49, 0], [10, 2.28, .57, .10], [3, .91, .59, .32]];
  for (const [order, [count, circle, radius, phase]] of rings.entries()) {
    const nozzles = subgroup(g, 'Engine row ' + (order + 1), [0, -.90 - order * 1.36, 0], 'raptor');
    for (let i = 0; i < count; i++) {
      const a = phase + i / count * TAU;
      bell(nozzles, circle * Math.sin(a), .04, circle * Math.cos(a), radius, support);
    }
  }
  // Visible pale webs break up the dark underside between the bells.
  for (let i = 0; i < (upper ? 6 : 12); i++) {
    const a = i * TAU / (upper ? 6 : 12);
    rod(g, [.4 * Math.sin(a), support - .22, .4 * Math.cos(a)],
      [4.11 * Math.sin(a), support - .22, 4.11 * Math.cos(a)], .06, m.silver);
  }
  return g;
}

function gridFin() {
  const m = materials(), g = group();
  // A through-lattice: every aperture remains open when viewed from above.
  const length = 4.55, width = 4.0, thick = .75;
  const lattice = subgroup(g, 'Grid blade', [1.24, .58, 0]);
  const span = (x) => width * (.86 + .14 * x / length);
  for (let i = 0; i <= 7; i++) {
    const x = i / 7 * length;
    box(lattice, [i === 0 || i === 7 ? .19 : .11, thick, span(x)], m.turbine, x, 0, 0);
  }
  for (let i = 0; i <= 7; i++) {
    const k = i / 7 - .5;
    const z1 = k * span(0), z2 = k * span(length);
    const blade = box(lattice, [Math.hypot(length, z2 - z1), thick + .035, i === 0 || i === 7 ? .20 : .11],
      i === 0 || i === 7 ? m.graphite : m.turbine, length / 2, 0, (z1 + z2) / 2);
    blade.rotation.y = -Math.atan2(z2 - z1, length);
  }
  box(lattice, [.98, .30, .80], m.polished, .15, -.48, 0);
  rod(g, [-.82, -.12, 0], [.12, -.12, 0], .30, m.silver, 20);
  box(g, [.59, .68, .88], m.graphite, -.72, -.08, 0);
  return g;
}

function hotStage() {
  const m = materials(), g = group();
  const lower = subgroup(g, 'Integrated vented wall', [0, -.48, 0]);
  const crown = subgroup(g, 'Interface rim', [0, .95, 0]);
  skin(lower, [[4.42, 0], [4.50, .12], [4.50, .52]], m.shell, 0, TAU, 'steel');
  skin(crown, [[4.46, 2.76], [4.50, 2.79], [4.50, 3.16], [4.43, 3.30]], m.shell, 0, TAU, 'steel');
  loop(crown, 4.47, .06, 3.22, m.polished);
  const middle = subgroup(g, 'Vented panels', [0, 0, 0]);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    skin(middle, [[4.50, .46], [4.50, 2.79]], m.shell, a, .15, 'steel');
    const left = [4.46 * Math.sin(a + .09), .50, 4.46 * Math.cos(a + .09)];
    const right = [4.46 * Math.sin(a + .21), 2.80, 4.46 * Math.cos(a + .21)];
    rod(middle, left, right, .095, m.silver);
  }
  return g;
}

function flap(forward = false) {
  const m = materials(), g = group();
  const corners = forward
    ? [[0, 0], [.68, -.34], [2.53, -.10], [2.68, .33], [2.26, 2.56], [.12, 6.23], [0, 6.29]]
    : [[0, .40], [1.45, -.18], [4.48, -.38], [4.81, .35], [4.48, 5.73], [.23, 15.05], [0, 15.10]];
  const outline = new THREE.Shape(corners.map(([x, y]) => new THREE.Vector2(x, y)));
  const body = new THREE.ExtrudeGeometry(outline,
    { depth: .31, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .083, bevelThickness: .10 });
  mesh(g, body, m.silver, 0, 0, -.16);
  const tileFace = new THREE.ShapeGeometry(outline);
  const uv = tileFace.attributes.uv, coords = tileFace.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, coords.getX(i) / 3.15, coords.getY(i) / 2.74);
  // Flip winding for the dark windward face.
  const indices = tileFace.index.array;
  for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  tileFace.computeVertexNormals();
  section(mesh(g, tileFace, m.tiles, 0, 0, -.266), 'Ceramic face', [0, 0, -1.25]);
  const height = forward ? 5.64 : 14.36;
  const hinges = subgroup(g, 'Hinge fairings', [-1.05, .30, .45]);
  // Shallow skins and hinge fairings pick up narrow highlights from the studio lights.
  for (let i = 0; i < (forward ? 3 : 5); i++) {
    const y = i / (forward ? 3 : 5) * height;
    const y2 = y + (forward ? 1.61 : 2.56);
    rod(hinges, [.09, y, .11], [.09, y2, .11], forward ? .26 : .32, m.polished, 16);
  }
  const outer = forward ? 2.14 : 4.14;
  for (const t of [.17, .40, .68]) {
    rod(g, [.26, height * t + .30, .26], [outer * (1 - t * .70), (forward ? 2.3 : 4.5) * t, .26],
      .028, m.aluminum, 6);
  }
  return g;
}

const noseProfile = [[4.5, 29.7], [4.48, 32.5], [4.40, 34.4], [4.25, 36.25],
  [4.01, 38.1], [3.67, 40.1], [3.23, 42.2], [2.73, 44.2], [2.12, 46.1],
  [1.43, 47.85], [.81, 49.0], [.26, 49.77], [.04, 50.0]];

function splitSkin(g, profile) {
  const m = materials();
  const shield = skin(g, profile, m.tiles, shieldStart, shieldArc, 'tiles');
  section(shield, 'Windward ceramic skin', outward(shieldStart + shieldArc / 2, 3.3), 'heatshield');
  skin(g, profile, m.shell, shieldStart + shieldArc, TAU - shieldArc, 'steel');
}

function nose() {
  const g = group(), m = materials();
  splitSkin(g, noseProfile.map(([r, y]) => [r, y + 2]));
  cylinder(g, 4.48, 4.48, .07, m.graphite, 31.74);
  section(skin(g, [[.26, 51.77], [.12, 51.99], [.004, 52.10]], m.graphite), 'Nose cap', [0, 2.5, 0]);
  for (const a of [-.72, 2.15]) {
    const catchFitting = group();
    box(catchFitting, [.16, .70, .64], m.graphite);
    rod(catchFitting, [.035, 0, 0], [.50, 0, 0], .14, m.polished, 16);
    attach(g, catchFitting, a, 4.40, 36.26);
  }
  return g;
}

function markings(parent, angle, y, radius, label) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext('2d');
  if (!c) return;
  const bx = 42, by = 23, width = 172, height = 91;
  c.fillStyle = '#eae9e4';
  c.fillRect(bx, by, width, height);
  c.fillStyle = '#974a4c';
  for (let s = 0; s < 13; s += 2) c.fillRect(bx, by + s * 7, width, 7);
  c.fillStyle = '#394958';
  c.fillRect(bx, by, 71, 49);
  c.fillStyle = '#eceae1';
  for (let row = 0; row < 9; row++) for (let col = 0; col < 6 - row % 2; col++) {
    c.fillRect(bx + 4 + col * 11 + row % 2 * 5.5, by + 3 + row * 5, 2.9, 2.9);
  }
  c.font = 'bold 45px Arial';
  c.textAlign = 'center';
  c.fillStyle = '#343c45';
  c.fillText(label, 128, 175);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: .34,
    depthWrite: false, roughness: .64, polygonOffset: true, polygonOffsetFactor: -3 });
  const decal = mesh(parent, new THREE.CylinderGeometry(radius + .016, radius + .016, 2.20,
    12, 1, true, angle - .25, .50), mat, 0, y, 0);
  decal.name = label;
}

function shipModel() {
  const m = materials(), g = group();
  const profile = [[4.5, 1.16], [4.5, 5.8], [4.5, 15.1], [4.5, 31.70]];
  splitSkin(g, profile);
  splitSkin(g, [[4.49, .10], [4.51, .24], [4.50, 1.16]]);
  g.add(section(nose(), 'Ogive', [0, 7.2, 0], 'nose'));
  g.add(section(engineSection(true), 'Upper-stage engine cluster', [0, -5.6, 0], 'shipengines'));
  loop(g, 4.47, .084, .15, m.graphite);
  for (const a of [-.77, 2.03]) {
    const aft = flap();
    const front = flap(true);
    // The two assemblies place their tiles toward the same windward side.
    if (a < 0) {
      aft.scale.z = -1;
      front.scale.z = -1;
    }
    const frontAngle = a < 0 ? -.27 : 1.54;
    section(aft, 'Aft flap', outward(a, 5.8, -.45), 'flaps');
    section(front, 'Forward flap', outward(frontAngle, 5.0, 5), 'foreflap');
    attach(g, aft, a, 4.37, .61);
    attach(g, front, frontAngle, 3.93, 39.9);
    front.rotateZ(.23);
  }
  for (const y of [9.3, 15.5, 22.7, 29.7]) {
    const cover = group();
    box(cover, [.10, .52, .68], m.silver);
    box(cover, [.11, .35, .46], m.graphite, .013, 0, 0);
    attach(g, cover, .97, 4.48, y);
  }
  const dorsal = group();
  box(dorsal, [.10, 21.0, .23], m.silver, .028, 0, 0);
  attach(g, dorsal, 1.02, 4.49, 17.3);
  markings(g, .39, 28.4, 4.50, 'S42');
  return g;
}

function boosterModel() {
  const m = materials(), g = group();
  skin(g, [[4.21, .47], [4.40, .82], [4.50, 2.92], [4.5, 67.88], [4.44, 69.03]], m.shell, 0, TAU, 'steel');
  g.add(section(engineSection(), 'Booster engine cluster', [0, -6.8, 0], 'engines'));
  for (const h of [1.12, 2.9, 4.02, 66.34, 67.7, 68.78]) {
    loop(g, h < 2 ? 4.40 : 4.49, .055, h, m.silver);
  }
  // Raised circumferential welds give the stacked steel rings a subtle edge
  // highlight even when the hull texture is viewed at a shallow angle.
  for (let h = 5.50; h < 66.0; h += 1.835) {
    loop(g, 4.496, .027, h, m.silver, 64);
  }
  // The vented interstage is integrated with this forward dome during flight.
  skin(g, [[4.44, 68.98], [4.27, 69.13], [4.03, 69.39], [3.10, 69.86],
    [1.70, 70.12], [.02, 70.19]], m.turbine);
  loop(g, 4.43, .085, 69.0, m.silver);
  cylinder(g, .29, .35, .12, m.graphite, 70.20, 24);
  const vents = section(hotStage(), 'hotstage', [0, 4.2, 0], 'hotstage');
  vents.position.y = 69;
  g.add(vents);
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 + .51;
    const fin = section(gridFin(), 'Grid fin', outward(a, 6.5), 'gridfins');
    attach(g, fin, a, 4.64, 60.8);
    const mount = group();
    box(mount, [.36, 1.42, 1.38], m.silver);
    attach(g, mount, a, 4.48, 60.8);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + .51;
    const lower = group();
    const strake = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.91, 0),
      new THREE.Vector2(.80, 6.74), new THREE.Vector2(.32, 9.76), new THREE.Vector2(0, 10.50)]);
    mesh(lower, new THREE.ExtrudeGeometry(strake, { depth: .54, bevelEnabled: true, bevelSegments: 1,
      bevelSize: .12, bevelThickness: .12 }), m.silver, 0, 0, -.27);
    attach(g, lower, a, 4.44, 1.45);
  }
  for (const a of [.31, .36, 2.81]) {
    const spine = group();
    rod(spine, [0, 0, 0], [0, 48.1, 0], .134, m.silver, 10);
    for (let y = 1.3; y < 48.1; y += 3.65) box(spine, [.16, .11, .47], m.graphite, .044, y, 0);
    attach(g, spine, a, 4.55, 8.65);
  }
  markings(g, -.13, 56.0, 4.50, 'B22');
  return g;
}

function tilePanel() {
  const g = group(), m = materials();
  const swatches = [0x373c43, 0x40444a, 0x45494e, 0x4c5155, 0x52565c]
    .map(color => new THREE.MeshStandardMaterial({ color, roughness: .83, metalness: .10 }));
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + Math.PI / 6;
    corners.push(new THREE.Vector2(Math.cos(a) * .49, Math.sin(a) * .49));
  }
  const outline = new THREE.Shape(corners), rad = 5.1;
  const hex = new THREE.ExtrudeGeometry(outline, { depth: .14, bevelEnabled: true,
    bevelSize: .015, bevelThickness: .024, bevelSegments: 1, steps: 1 });
  for (let row = 0; row < 6; row++) {
    const rowTiles = subgroup(g, 'Ceramic tile course ' + (row + 1), [0, (row - 2.5) * .23, 1.15]);
    for (let c = 0; c < (row % 2 ? 6 : 7); c++) {
      const theta = ((c - 3 + (row % 2) * .5) * .89) / rad;
      const swatch = swatches[Math.floor(noise(c, row) * swatches.length)];
      const tile = mesh(rowTiles, hex, swatch, rad * Math.sin(theta), row * .77, rad * (Math.cos(theta) - 1));
      tile.rotation.y = theta;
    }
  }
  // A dark carrier between the cells makes the panel legible from the back.
  const back = skin(g, [[rad - .13, -.21], [rad - .13, 4.04]], m.graphite, -.57, 1.14);
  back.position.z = -rad;
  return g;
}

const builders = {
  ship: shipModel, booster: boosterModel, raptor, heatshield: tilePanel, flaps: flap,
  foreflap: () => flap(true), shipengines: () => engineSection(true),
  gridfins: gridFin, hotstage: hotStage, engines: engineSection, nose,
};

export function createPart(id) {
  if (!Object.hasOwn(builders, id)) throw new RangeError('Unknown vehicle component: ' + id);
  if (!prototypes.has(id)) prototypes.set(id, bake(builders[id](), id));
  return prototypes.get(id).clone();
}

export function createVehicle() {
  const root = group();
  root.name = 'Flight 15 · Starship V3';
  const booster = createPart('booster');
  const ship = createPart('ship');
  ship.position.y = 72.3;
  root.add(booster, ship);
  return { root, booster, ship, hotStage: booster.getObjectByName('hotstage') };
}
