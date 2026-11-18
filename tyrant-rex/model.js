import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {DIM} from './kinematics.mjs';
import {HEAD, buildCranium, buildCanopy, buildOptic, buildEyelid, buildMandible, buildTeeth, buildJawDrive} from './cranial.js';
import {loftHull, CHAMFER} from './cranial-geometry.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const DOWN = V(0, -1, 0);
const Z = V(0, 0, 1);
const TAU = Math.PI * 2;
const circle = (cx, cy, r, count = 48) => Array.from({length: count}, (_, i) => [
  cx + Math.cos(i / count * TAU) * r, cy + Math.sin(i / count * TAU) * r,
]);

function shapeOf(outline, holes = []) {
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  for (const outline of holes) {
    const hole = new THREE.Path();
    outline.forEach(([x, y], i) => i ? hole.lineTo(x, y) : hole.moveTo(x, y));
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

function plate(outline, depth = .10, holes = [], bevel = .018) {
  const geo = new THREE.ExtrudeGeometry(shapeOf(outline, holes), {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 2, steps: 1, curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function capsuleBox(w, h, d, r = .035) {
  const s = new THREE.Shape();
  r = Math.min(r, w / 4, h / 4);
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const bevel = Math.min(.012, w * .12, h * .12, d * .15);
  return new THREE.ExtrudeGeometry(s, {
    depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1,
  }).translate(0, 0, -d / 2);
}

function gearGeometry(radius, depth, teeth = 28, bore = .38) {
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    for (let j = 0; j < 4; j++) {
      const a = (i + j / 4) * TAU / teeth;
      const r = radius * (j === 1 || j === 2 ? 1 : .90);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  return plate(pts, depth, [circle(0, 0, radius * bore, bore > .7 ? 48 : 24)], .005);
}

function materialSet() {
  // One tiny locally synthesized brushed roughness map; no network or image dependencies.
  const data = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const n = 228 + ((x * 17 + y * 43 + (x * y % 23)) % 23);
    const at = (y * 64 + x) * 4;
    data[at] = data[at + 1] = data[at + 2] = n;
    data[at + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, 64, 64);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 1);
  texture.needsUpdate = true;
  let lettering = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d2e2e5';
    ctx.font = '600 73px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RX–01', 256, 83);
    ctx.font = '23px Inter, sans-serif';
    ctx.fillStyle = '#9cbdc8';
    ctx.fillText('TYRANT / MECHANICAL DIVISION', 256, 128);
    lettering = new THREE.CanvasTexture(canvas);
    lettering.colorSpace = THREE.SRGBColorSpace;
  }
  const metal = (color, roughness = .4, metalness = .82) => new THREE.MeshStandardMaterial({
    color, roughness, metalness, envMapIntensity: .72, roughnessMap: texture,
  });
  return {
    armor: metal('#315b6e', .48, .68),
    armorLight: metal('#b8cbd1', .42, .76),
    silver: metal('#aabcc4', .31, .88),
    steel: metal('#52717d', .43, .86),
    dark: metal('#1d313c', .52, .65),
    black: metal('#111e26', .65, .30),
    copper: metal('#b87c50', .38, .80),
    gold: metal('#ce9a61', .32, .82),
    orange: metal('#ed8b49', .43, .42),
    ivory: metal('#d5e1df', .3, .70),
    rubber: new THREE.MeshStandardMaterial({color: '#172830', metalness: .12, roughness: .78}),
    circuit: new THREE.MeshStandardMaterial({color: '#1b4d52', roughness: .6, metalness: .35}),
    glow: new THREE.MeshStandardMaterial({color: '#9ef1e8', emissive: '#45cbbf', emissiveIntensity: .55, roughness: .28, metalness: .3}),
    reactorGlow: new THREE.MeshStandardMaterial({color: '#b0fff0', emissive: '#28d9c0', emissiveIntensity: 1.15, roughness: .25, metalness: .25}),
    lens: new THREE.MeshPhysicalMaterial({color: '#16525b', emissive: '#30baa9', emissiveIntensity: .32, metalness: .35, roughness: .11, clearcoat: 1}),
    red: new THREE.MeshStandardMaterial({color: '#ed9b5d', emissive: '#dc7235', emissiveIntensity: .3}),
    decal: new THREE.MeshStandardMaterial({map: lettering, color: '#ffffff', roughness: .75, metalness: .05, transparent: true, opacity: lettering ? 1 : 0, depthWrite: false}),
  };
}

/** Fine pieces are merged by material inside each moving module, keeping draw calls low. */
class Fabricator {
  constructor(materials) {
    this.materials = materials;
    this.buckets = new Map();
    this.count = 0;
  }
  add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const mat = typeof material === 'string' ? this.materials[material] : material;
    const m = new THREE.Matrix4().compose(
      V(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), V(...scale),
    );
    const geo = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geo.applyMatrix4(m);
    if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(geo);
    this.count++;
    return this;
  }
  box(pos, size, mat = 'steel', rot = [0, 0, 0]) {
    return this.add(capsuleBox(...size), mat, pos, rot);
  }
  rod(a, b, r = .05, mat = 'steel', r2 = r, segments = 12) {
    const from = V(...a), to = V(...b), dir = to.clone().sub(from);
    const q = new THREE.Quaternion().setFromUnitVectors(Y, dir.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return this.add(new THREE.CylinderGeometry(r2, r, dir.length(), segments, 1), mat, from.add(to).multiplyScalar(.5).toArray(), [e.x, e.y, e.z]);
  }
  tube(points, radius = .025, mat = 'copper', segments = 24) {
    return this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), segments, radius, 6, false), mat);
  }
  disc(pos, r, depth, mat = 'silver') {
    return this.add(new THREE.CylinderGeometry(r, r, depth, 32), mat, pos, [Math.PI / 2, 0, 0]);
  }
  torus(pos, r, tube, mat = 'silver', rot = [0, 0, 0]) {
    return this.add(new THREE.TorusGeometry(r, tube, 8, 40), mat, pos, rot);
  }
  bolt(pos, r = .03, mat = 'silver') {
    this.add(new THREE.CylinderGeometry(r, r, r * .48, 6), mat, pos, [Math.PI / 2, 0, 0]);
    this.disc([pos[0], pos[1], pos[2] + r * .28], r * .42, .007, 'black');
    return this;
  }
  bearing(pos, radius = .25, side = 1) {
    const [x, y, z] = pos;
    this.disc(pos, radius, .12, 'black');
    this.add(gearGeometry(radius * .94, .055, 32), 'copper', [x, y, z + side * .08]);
    this.torus([x, y, z + side * .12], radius * .75, radius * .11, 'silver');
    this.disc([x, y, z + side * .12], radius * .51, .10, 'dark');
    this.disc([x, y, z + side * .182], radius * .24, .02, 'silver');
    this.torus([x, y, z + side * .198], radius * .12, radius * .035, 'glow');
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      this.bolt([x + Math.cos(a) * radius * .61, y + Math.sin(a) * radius * .61, z + side * .17], radius * .058);
    }
    return this;
  }
  piston(a, b, r = .09) {
    const av = V(...a), bv = V(...b);
    const mid = av.clone().lerp(bv, .58);
    this.rod(a, mid.toArray(), r, 'dark', r);
    this.rod(mid.toArray(), b, r * .52, 'silver');
    const axis = bv.clone().sub(av).normalize();
    for (const t of [.05, .48, .58]) {
      const p = av.clone().lerp(bv, t);
      this.rod(p.clone().addScaledVector(axis, -.022).toArray(), p.clone().addScaledVector(axis, .022).toArray(), r * 1.18, 'copper');
    }
    return this;
  }
  finish(group, system) {
    for (const [mat, geos] of this.buckets) {
      const geometry = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.name = `${system}/${mat.uuid.slice(0, 4)}`;
      mesh.userData.system = system;
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      for (const g of geos) g.dispose();
    }
    return this.count;
  }
}

export function createRex() {
  const materials = materialSet();
  const root = new THREE.Group();
  root.name = 'TYRANT / RX-01';
  const systems = Object.fromEntries(['skull', 'core', 'armor', 'legs', 'tail'].map(id => [id, []]));
  const modules = [];
  const anchors = {
    skull: V(-.65, .99, .70), core: V(.17, .17, .72), tail: V(.1, .14, .18),
    armor: V(.05, 3.9, .55), legs: V(.20, -.52, .32),
  };
  let partCount = 0;
  function module(id, name, position, offset, build, role = null) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    root.add(group);
    const f = new Fabricator(materials);
    build(f);
    partCount += f.finish(group, id);
    const item = {group, base: V(...position), offset: V(...offset), id, role, index: modules.length};
    modules.push(item);
    systems[id].push(item);
    return item;
  }

  // All cranial modules use the same anatomical hinge and a shared neck rotation.
  const upper = module('skull', '立体开窗颅骨与腭部框架', HEAD.origin, [-1.18, .80, 0], buildCranium, 'head');
  module('skull', '复合曲面鼻甲与颅顶', HEAD.origin, [-1.12, 1.68, 0], buildCanopy, 'head-shell');
  const eyelids = [];
  for (const side of [-1, 1]) {
    const optic = module('skull', `${side < 0 ? '右' : '左'}眼眶光学总成`, HEAD.origin, [-.55, 1.05, side * 1.08], f => buildOptic(f, side), 'head-optic');
    const lid = buildEyelid(side, materials);
    optic.group.add(lid.mesh);
    eyelids.push(lid);
    partCount++;
  }
  const jaw = module('skull', '弧面下颌骨与舌侧线槽', HEAD.origin, [-1.06, -.42, 0], buildMandible, 'jaw');
  module('skull', '上颌弯齿与牙座总成', HEAD.origin, [-1.50, .24, 0], f => buildTeeth(f), 'upper-teeth');
  module('skull', '下颌弯齿与牙座总成', HEAD.origin, [-1.45, -.95, 0], f => buildTeeth(f, true), 'lower-teeth');
  const jawDrives = [];
  for (const side of [-1, 1]) {
    const body = module('skull', `${side < 0 ? '右' : '左'}咬合液压缸`, HEAD.origin, [-.25, .44, side * 1.05], f => buildJawDrive(f), 'jaw-drive');
    const rod = module('skull', `${side < 0 ? '右' : '左'}咬合活塞杆`, HEAD.origin, [-.50, -.48, side * .92], f => buildJawDrive(f, true), 'jaw-drive');
    jawDrives.push({side, body, rod});
  }

  // A chain of independently separable cervical vertebrae.
  const neckBones = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const bone = module('skull', `颈椎连接 ${i + 1}`, [-1.12 - t * .63, 3.45 + t * .69, 0], [-.3 - t * .15, .28 + t * .15, 0], f => {
      f.add(loftHull([
        [-.17, .075, 0, .17, .10], [-.05, .035, 0, .215, .145],
        [.08, -.035, 0, .215, .14], [.17, -.075, 0, .16, .10],
      ], {steps: 18, profile: CHAMFER}), 'dark');
      for (const side of [-1, 1]) {
        f.bearing([0, 0, side * .23], .17, side);
        f.rod([-.14, .08, side * .28], [.14, -.07, side * .28], .04, 'copper');
        f.add(plate([[-.20, .10], [-.14, .28], [.04, .29], [.18, .06], [.10, -.09], [-.03, .09]],
          .055, [circle(-.045, .183, .050, 18)], .009), 'steel', [0, 0, side * .19]);
        f.rod([-.12, .17, side * .14], [.07, .11, side * .14], .025, 'silver');
      }
      f.add(loftHull([[-.12, .23, 0, .18, .035], [-.015, .245, 0, .23, .055], [.105, .16, 0, .19, .035]], {steps: 14, profile: CHAMFER}), 'armorLight');
      f.box([-.01, .283, 0], [.09, .018, .28], 'orange', [0, 0, -.35]);
      for (let fin = 0; fin < 4; fin++) {
        f.rod([-.105 + fin * .054, -.115 - fin * .01, -.16], [-.105 + fin * .054, -.115 - fin * .01, .16], .018, 'steel');
      }
    }, 'neck');
    neckBones.push(bone);
  }
  module('skull', '颈部液压与套管', [-1.1, 3.51, 0], [-.44, .3, 0], f => {
    for (const side of [-1, 1]) {
      f.piston([.10, -.25, side * .34], [-.70, .54, side * .32], .075);
      f.tube([[.22, -.12, side * .38], [-.2, .18, side * .43], [-.32, .56, side * .35], [-.63, .74, side * .32]], .045, 'rubber');
      for (let i = 0; i < 12; i++) {
        const t = i / 12;
        f.torus([-.13 - t * .28, .08 + t * .49, side * .40], .047, .009, 'silver', [Math.PI / 2, 0, -.45]);
      }
    }
  }, 'neck-support');

  // The exposed central spine and paired copper-alloy ribs.
  module('core', '脊柱承力框架', [0, 3.38, 0], [0, .12, 0], f => {
    f.rod([-1.06, .07, 0], [1.2, .07, 0], .12, 'dark');
    f.rod([-1.04, -.69, 0], [.90, -.69, 0], .07, 'silver');
    for (let i = 0; i < 11; i++) {
      const x = -1.02 + i * .20;
      f.box([x, .05, 0], [.125, .30, .40], 'silver');
      f.box([x, .28, 0], [.10, .22, .15], 'dark', [0, 0, -.23]);
      for (const side of [-1, 1]) {
        if (i >= 3 && i <= 6) {
          // The center ribs terminate at the bearing cradle, leaving its rotating face clear.
          const dx = (i - 4) * .17;
          const reach = Math.sqrt(.465 ** 2 - dx ** 2);
          f.tube([[x, .03, side * .19], [x, .15, side * .35], [-.22 + dx, -.37 + reach, side * .43]], .034, 'silver', 14);
          f.tube([[x + .04, -.78, side * .10], [x, -.87, side * .30], [-.22 + dx, -.37 - reach, side * .43]], .034, 'copper', 14);
        } else {
          f.tube([[x, .03, side * .19], [x - .04, -.10, side * .53], [x - .12, -.45, side * .65], [x - .04, -.76, side * .37], [x + .04, -.78, side * .10]], .046, i % 3 ? 'silver' : 'copper', 20);
        }
        f.bolt([x, .05, side * .24], .03);
      }
    }
    for (const side of [-1, 1]) {
      f.tube([[-1.05, -.29, side * .32], [-.55, -.72, side * .42], [.35, -.73, side * .41], [.95, -.17, side * .30]], .035, 'rubber');
      f.tube([[-1.10, -.08, side * .30], [-.3, -.04, side * .46], [.65, -.22, side * .41]], .022, 'orange');
    }
  });
  const heartHousing = module('core', '动力心脏 · 固定定子与轴承座', [-.22, 3.01, 0], [0, -.12, 1.55], f => {
    f.disc([0, 0, 0], .405, .76, 'dark');
    for (const side of [-1, 1]) {
      f.add(gearGeometry(.45, .055, 40, .83), 'steel', [0, 0, side * .405]);
      f.torus([0, 0, side * .44], .425, .024, 'copper');
      f.disc([0, 0, side * .467], .379, .025, 'black');
      f.torus([0, 0, side * .53], .386, .018, 'silver');
      f.torus([0, 0, side * .548], .381, .007, 'reactorGlow');
      f.disc([0, 0, side * .582], .044, .023, 'steel');
      f.disc([0, 0, side * .599], .029, .012, 'lens');
      f.torus([0, 0, side * .605], .027, .006, 'reactorGlow');
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        f.bolt([Math.cos(a) * .425, Math.sin(a) * .425, side * .467], .018);
        f.box([Math.cos(a) * .401, Math.sin(a) * .401, side * .51], [.026, .039, .035], i % 3 ? 'steel' : 'copper', [0, 0, a]);
      }
    }
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      f.rod([Math.cos(a) * .32, Math.sin(a) * .32, -.35], [Math.cos(a) * .32, Math.sin(a) * .32, .35], .032, 'copper');
    }
  }, 'reactor-housing');
  const heartRotor = module('core', '动力心脏 · 七叶涡轮飞轮', [-.22, 3.01, 0], [0, -.12, 1.55], f => {
    f.disc([0, 0, 0], .065, 1.11, 'silver');
    for (const side of [-1, 1]) {
      f.add(gearGeometry(.356, .028, 36, .80), 'steel', [0, 0, side * .525]);
      f.torus([0, 0, side * .548], .338, .010, 'copper');
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU;
        const polar = (r, t) => [Math.cos(a + t) * r, Math.sin(a + t) * r];
        const blade = [[.095, 0], [.17, -.02], [.30, .23], [.326, .35], [.285, .49], [.20, .29], [.11, .18]].map(([r, t]) => polar(r, t));
        f.add(plate(blade, .026, [], .004), i === 0 ? 'copper' : 'silver', [0, 0, side * .548]);
        const tip = [[.267, .285], [.310, .32], [.291, .39], [.252, .35]].map(([r, t]) => polar(r, t));
        f.add(plate(tip, .010, [], .002), i === 0 ? 'orange' : 'steel', [0, 0, side * .568]);
        if (i === 0 || i === 3) {
          const from = polar(.14, .13), to = polar(.258, .30);
          f.rod([...from, side * .569], [...to, side * .569], .009, 'reactorGlow', .009, 8);
        }
      }
      f.disc([0, 0, side * .546], .094, .061, 'copper');
      f.disc([0, 0, side * .581], .067, .014, 'dark');
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU;
        f.bolt([Math.cos(a) * .078, Math.sin(a) * .078, side * .584], .009);
      }
      // A short luminous arc and a copper blade make the motion legible at any phase.
      f.add(new THREE.TorusGeometry(.325, .009, 8, 24, Math.PI * .47), 'reactorGlow', [0, 0, side * .565]);
    }
  }, 'reactor-rotor');
  module('core', '主控与电源总成', [.52, 3.13, 0], [.5, .15, -1.5], f => {
    f.box([0, 0, 0], [.59, .64, .63], 'dark');
    for (let side of [-1, 1]) {
      f.box([0, 0, side * .33], [.49, .52, .025], 'circuit');
      f.box([-.06, .07, side * .355], [.19, .18, .045], 'black');
      for (let i = 0; i < 6; i++) {
        f.box([.13, -.16 + i * .055, side * .36], [.13, .023, .035], 'silver');
        f.box([-.17 + i * .052, -.20, side * .36], [.025, .045, .03], 'gold');
      }
      for (const x of [-.20, .20]) for (const y of [-.22, .22]) f.bolt([x, y, side * .37], .024);
      f.box([.06, .20, side * .36], [.14, .018, .025], 'glow');
      f.tube([[-.28, -.19, side * .2], [-.44, -.31, side * .37], [-.63, -.27, side * .32]], .028, 'orange');
    }
    for (let i = 0; i < 6; i++) f.box([0, .35 + i * .023, 0], [.51, .012, .54], 'silver');
  });

  // Shingled upper carapace: dark teal, silver cheek plates and orange inlays.
  for (let i = 0; i < 6; i++) {
    const x = -.94 + i * .35;
    module('armor', `背部装甲 ${i + 1}`, [x, 3.65, 0], [0, 1.22 + .15 * Math.sin(i), 0], f => {
      const w = (.76 - .1 * Math.abs(i - 2.5) / 3) / 2;
      f.add(loftHull([[-.15, .00, 0, w * .87, .07], [-.03, .025, 0, w, .10], [.15, -.015, 0, w * .93, .065]], {steps: 12, profile: CHAMFER}), 'armor');
      f.box([0, .09, 0], [.16, .055, .21], i % 2 ? 'armorLight' : 'orange');
      for (const side of [-1, 1]) {
        f.box([0, -.075, side * .37], [.29, .16, .13], 'armorLight', [side * -.30, 0, 0]);
        f.bolt([0, -.10, side * .45], .025);
      }
    });
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      module('armor', `${side < 0 ? '右' : '左'}侧分瓣胸甲 ${i + 1}`, [-.72 + i * .55, 3.23, side * .64], [0, .45, side * (1.22 + i * .06)], f => {
        const outline = i === 1
          ? [[-.29, .32], [.18, .38], [.33, .16], [.28, -.35], [.13, -.48], [-.13, -.49], [-.32, -.32], [-.32, .12]]
          : [[-.29, .32], [.18, .38], [.33, .16], [.24, -.35], [-.02, -.49], [-.28, -.24]];
        const hole = circle(-.025, -.16, .235, 64);
        f.add(plate(outline, .10, i === 1 ? [hole] : [], i === 1 ? .016 : .025), i === 1 ? 'armorLight' : 'armor');
        if (i === 1) {
          // A genuine inspection aperture with a thick machined lip, open in assembled mode.
          f.add(plate(circle(0, 0, .255, 64), .025, [circle(0, 0, .231, 64)], .003), 'steel', [-.025, -.16, side * .067]);
          f.torus([-.025, -.16, side * .086], .243, .008, 'copper');
          for (let j = 0; j < 4; j++) {
            const a = (j + .5) / 4 * TAU;
            f.bolt([-.025 + Math.cos(a) * .271, -.16 + Math.sin(a) * .271, side * .077], .011);
          }
        }
        f.box([-.03, .285, side * .073], [.31, .026, .025], 'orange', [0, 0, .13]);
        if (i === 0) {
          f.add(new THREE.PlaneGeometry(.30, .094), 'decal', [-.025, .08, side * .082], [0, side < 0 ? Math.PI : 0, 0]);
          for (let code = 0; code < 12; code++) {
            f.box([-.15 + code * .020, -.018, side * .071], [code % 3 === 0 ? .010 : .005, .033, .009], 'silver');
          }
        }
        const fasteners = i === 1 ? [[-.22, .23], [.23, .12], [.18, -.35], [-.20, -.38]] : [[-.20, .22], [.21, .12], [.12, -.27], [-.20, -.19]];
        for (const [x, y] of fasteners) f.bolt([x, y, side * .075], .025);
        if (i !== 1) for (let j = 0; j < 5; j++) f.box([-.12 + j * .056, -.16 - j * .012, side * .066], [.023, .16, .016], 'black', [0, 0, -.19]);
      });
    }
  }
  module('armor', '骨盆桥架', [.96, 3.06, 0], [.36, .72, 0], f => {
    f.box([0, 0, 0], [.61, .50, .95], 'dark');
    for (const side of [-1, 1]) {
      f.add(plate([[-.41, .34], [.16, .41], [.49, .13], [.34, -.31], [-.18, -.36], [-.43, -.10]], .14, [circle(0, 0, .16, 24)], .025), 'armor', [0, 0, side * .55]);
      f.bearing([0, 0, side * .65], .31, side);
      f.box([.10, .32, side * .40], [.43, .075, .25], 'armorLight', [0, 0, -.2]);
    }
  });

  // Tiny two-finger forelimbs, a defining Tyrannosaurus feature.
  for (const side of [-1, 1]) {
    module('legs', `${side < 0 ? '右' : '左'}双指前肢`, [-1.02, 3.1, side * .54], [-.55, -.2, side * .75], f => {
      f.bearing([0, 0, 0], .16, side);
      f.rod([0, 0, 0], [-.25, -.48, side * .10], .075, 'silver', .095);
      f.rod([-.25, -.48, side * .10], [-.58, -.43, side * .14], .056, 'dark');
      f.box([-.125, -.22, side * .05], [.13, .37, .16], 'armor', [0, 0, -.45]);
      f.bearing([-.25, -.48, side * .1], .10, side);
      for (const finger of [-1, 1]) {
        const z = side * .14 + finger * .07;
        f.rod([-.56, -.43, z], [-.75, -.50, z], .033, 'silver');
        f.rod([-.75, -.50, z], [-.79, -.62, z], .025, 'ivory', .006);
      }
      f.piston([.04, -.1, side * .08], [-.44, -.43, side * .13], .036);
    }, 'forelimb');
  }

  const legParts = [];
  for (const side of [-1, 1]) {
    const thigh = module('legs', `${side < 0 ? '右' : '左'}股节伺服`, [0, 0, 0], [-.1, .12, side * 1.25], f => {
      const len = DIM.femur;
      f.rod([0, 0, 0], [0, -len, 0], .13, 'dark', .18);
      for (const s of [-1, 1]) {
        f.rod([-.16, -.17, s * .13], [-.12, -len + .12, s * .13], .045, 'silver');
      }
      f.piston([.20, -.15, .16], [.20, -len + .12, .16], .09);
      f.piston([-.16, -.10, -.16], [-.12, -len + .1, -.16], .065);
      const outline = [[-.21, -.20], [.19, -.21], [.27, -.54], [.18, -1.12], [.04, -1.34], [-.20, -1.08], [-.29, -.56]];
      const holes = [[[-.13, -.43], [.10, -.42], [.10, -.69], [-.12, -.77]]];
      f.add(plate(outline, .12, holes, .024), 'armor', [0, 0, side * .24]);
      f.add(plate([[-.14, -.28], [.15, -.30], [.18, -.43], [-.13, -.44]], .04, [], .01), 'armorLight', [0, 0, side * .32]);
      f.box([.03, -.84, side * .32], [.035, .32, .02], 'orange', [0, 0, -.10]);
      f.bearing([0, 0, side * .10], .34, side);
      f.bearing([0, -len, side * .10], .25, side);
      for (const [x, y] of [[-.17, -.30], [.17, -.31], [.13, -1.06], [-.14, -1.0]]) f.bolt([x, y, side * .32], .026);
      f.tube([[.05, -.12, -side * .25], [.14, -.55, -side * .30], [.02, -1.26, -side * .24], [0, -len, -side * .19]], .034, 'rubber');
    }, 'thigh');
    const shin = module('legs', `${side < 0 ? '右' : '左'}胫节液压`, [0, 0, 0], [.40, -.12, side * 1.52], f => {
      const len = DIM.tibia;
      f.rod([0, 0, 0], [0, -len, 0], .085, 'silver', .12);
      f.rod([-.115, -.10, .08], [-.10, -len + .05, .08], .055, 'dark');
      f.piston([.13, -.1, .0], [.08, -len + .08, .0], .086);
      f.add(plate([[-.19, -.19], [.16, -.18], [.20, -.42], [.08, -1.22], [-.04, -1.40], [-.12, -1.10]], .10, [[[-.09, -.36], [.085, -.34], [.04, -.77], [-.075, -.81]]], .022), 'armorLight', [0, 0, side * .20]);
      f.box([.06, -.95, side * .27], [.045, .23, .025], 'armor', [0, 0, -.11]);
      f.bearing([0, -len, side * .10], .18, side);
      for (const y of [-.26, -.80, -1.17]) f.bolt([-.03, y, side * .27], .022);
      f.tube([[.04, -.03, -side * .15], [.18, -.50, -side * .17], [.07, -1.3, -side * .17]], .023, 'orange');
    }, 'shin');
    const foot = module('legs', `${side < 0 ? '右' : '左'}三趾承力足`, [0, 0, 0], [-.28, -.15, side * 1.55], f => {
      f.box([-.10, -.07, 0], [.36, .25, .42], 'dark');
      f.box([-.19, .02, 0], [.34, .13, .41], 'armor');
      f.box([-.22, .095, 0], [.13, .025, .15], 'orange');
      for (let toe = -1; toe <= 1; toe++) {
        const z = toe * .205;
        f.rod([-.18, -.15, toe * .11], [-.50, -.36, z], .073, 'silver');
        f.rod([-.5, -.36, z], [-.74 + Math.abs(toe) * .07, -.43, z * 1.15], .063, 'armorLight');
        f.bearing([-.50, -.36, z], .07, side);
        const clawX = -.88 + Math.abs(toe) * .09;
        f.rod([clawX + .16, -.43, z * 1.15], [clawX, -.47, z * 1.17], .069, 'ivory', .004);
        f.box([-.49, -.30, z], [.12, .065, .11], 'armor', [0, 0, -.15]);
      }
      f.rod([.0, -.1, -side * .15], [.20, -.22, -side * .20], .045, 'silver', .005);
    }, 'foot');
    legParts.push({side, thigh, shin, foot});
  }

  // Fourteen tapered vertebral cartridges. Every one has its own joint and cable saddle.
  const tailModules = [];
  const tailLengths = Array.from({length: DIM.tailSegments}, (_, i) => .365 - i * .008);
  for (let i = 0; i < DIM.tailSegments; i++) {
    const radius = .35 * (1 - i / 16) + .026;
    const len = tailLengths[i];
    const item = module('tail', `平衡尾椎 ${String(i + 1).padStart(2, '0')}`, [0, 0, 0], [.16 * i, .04 * i, i % 2 ? .42 : -.42], f => {
      f.rod([-.03, 0, 0], [len + .03, 0, 0], radius * .46, 'dark', radius * .43);
      f.add(new THREE.CylinderGeometry(radius * .64, radius * .78, len * .62, 8), 'armor', [len * .45, 0, 0], [0, 0, Math.PI / 2]);
      for (const side of [-1, 1]) {
        f.disc([.025, 0, side * radius * .56], radius * .55, .045, 'copper');
        f.torus([.025, 0, side * radius * .60], radius * .39, radius * .07, 'silver');
        f.bolt([.025, 0, side * radius * .66], radius * .12);
        f.rod([.045, radius * .43, side * radius * .36], [len * .87, radius * .37, side * radius * .29], Math.max(.012, radius * .08), 'copper');
      }
      f.add(plate([[.03, radius * .50], [len * .18, radius + .11], [len * .62, radius * .92], [len * .89, radius * .45]], radius * .6, [], .01), i % 3 === 0 ? 'armorLight' : 'armor');
      f.box([len * .45, radius * .75, 0], [len * .35, .025, Math.max(.03, radius * .24)], i < 6 ? 'orange' : 'silver');
      if (i < 8) {
        f.rod([len * .38, -radius * .52, 0], [len * .58, -radius * .93, 0], radius * .1, 'silver', radius * .025);
      }
    }, 'tail');
    tailModules.push(item);
  }
  const tip = module('tail', '尾端锥形配重', [0, 0, 0], [2.4, .7, 0], f => {
    f.rod([0, 0, 0], [.50, -.09, 0], .072, 'armorLight', .004, 12);
    f.rod([.04, .01, .04], [.26, -.03, .02], .014, 'orange', .003, 8);
  }, 'tailTip');

  // Exploded view leaders are drawn separately and are never selectable.
  const leaderGeometry = new THREE.BufferGeometry();
  leaderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(modules.length * 6), 3));
  leaderGeometry.setAttribute('lineDistance', new THREE.Float32BufferAttribute(new Float32Array(modules.length * 2), 1));
  const leaders = new THREE.LineSegments(leaderGeometry, new THREE.LineDashedMaterial({
    color: '#71909b', transparent: true, opacity: .32, dashSize: .07, gapSize: .055, depthWrite: false,
  }));
  leaders.name = 'assembly-guides';
  root.add(leaders);
  const armorMaterials = [materials.armor, materials.armorLight];
  const glowBase = materials.glow.emissiveIntensity;
  const bodyPivot = V(DIM.hipX, DIM.hipY, 0);
  const neckPivot = V(-1.10, 3.46, 0);
  const posedHip = V();
  const torsoRotation = new THREE.Quaternion();
  const cervicalRotation = new THREE.Quaternion();
  const jointRotation = new THREE.Quaternion();
  const headRotation = new THREE.Quaternion(), jawRotation = new THREE.Quaternion();
  const headOrigin = V(), neckCenter = V(), neckStep = V();
  const neckRest = [neckPivot, ...neckBones.map(bone => bone.base), V(...HEAD.origin)];
  const neckLinks = neckRest.slice(1).map((end, index) => end.clone().sub(neckRest[index]));
  const onTorso = position => position.sub(bodyPivot).applyQuaternion(torsoRotation).add(posedHip);
  const orientNeck = (turn, flex) => cervicalRotation.copy(torsoRotation)
    .multiply(jointRotation.setFromAxisAngle(Y, turn))
    .multiply(jointRotation.setFromAxisAngle(Z, flex));
  const rigidHead = ['head', 'head-shell', 'head-optic', 'upper-teeth'];
  const lowerHead = ['jaw', 'lower-teeth'];
  const placedSeparately = ['foot', 'thigh', 'shin', 'tail', 'tailTip', 'jaw-drive', 'neck'];
  const tailStart = V(1.24, 3.18, 0);
  const limbDirection = V();
  const nominal = modules.map(() => V());

  const update = (pose, {explode = 0, xray = false, selected = null} = {}) => {
    const path = pose.path;
    root.rotation.y = path?.yaw ?? 0;
    root.position.copy(bodyPivot).setY(0).applyQuaternion(root.quaternion).negate();
    root.position.x += path?.x ?? DIM.hipX;
    root.position.z += path?.z ?? 0;
    for (const lid of eyelids) lid.close(pose.blink ?? 0);
    const amount = Math.max(0, Math.min(1, explode));
    for (const mat of armorMaterials) {
      const opacity = xray ? .17 : 1;
      if (mat.transparent !== xray) {
        mat.transparent = xray;
        mat.depthWrite = !xray;
        mat.needsUpdate = true;
      }
      mat.opacity = opacity;
    }
    const {motion} = pose;
    materials.glow.emissiveIntensity = glowBase + pose.reactor * .22;
    materials.reactorGlow.emissiveIntensity = .65 + pose.reactor * .7 + motion.roar * .4;
    torsoRotation.setFromAxisAngle(Z, motion.pitch);
    posedHip.set(DIM.hipX + motion.shift, DIM.hipY + motion.rise, 0);
    onTorso(neckCenter.copy(neckPivot));
    headOrigin.copy(neckCenter);
    for (const [index, link] of neckLinks.entries()) {
      const neckFraction = (index + .5) / neckLinks.length;
      orientNeck(motion.headYaw * .68 * neckFraction, motion.neckFlex);
      headOrigin.add(neckStep.copy(link).applyQuaternion(cervicalRotation));
      const bone = neckBones[index];
      if (bone) {
        bone.group.position.copy(headOrigin);
        bone.group.quaternion.copy(cervicalRotation);
      }
    }
    headRotation.copy(orientNeck(motion.headYaw, motion.headTilt));
    jawRotation.copy(headRotation).multiply(jointRotation.setFromAxisAngle(Z, pose.jaw));
    orientNeck(motion.headYaw * .34, motion.neckFlex);
    for (const m of modules) {
      const {group, base, role} = m;
      if (placedSeparately.includes(role)) continue;
      group.rotation.set(0, 0, 0);
      if (rigidHead.includes(role) || lowerHead.includes(role)) {
        group.position.copy(headOrigin);
        group.quaternion.copy(lowerHead.includes(role) ? jawRotation : headRotation);
      } else if (role === 'neck-support') {
        group.position.copy(base).sub(neckPivot).applyQuaternion(cervicalRotation).add(neckCenter);
        group.quaternion.copy(cervicalRotation);
      } else {
        onTorso(group.position.copy(base));
        group.rotation.z = motion.pitch + (role === 'forelimb' ? motion.armBend : 0);
      }
    }
    heartRotor.group.rotation.z += pose.reactorAngle;
    for (const {side, body, rod} of jawDrives) {
      const a = V(HEAD.driveUpper[0], HEAD.driveUpper[1], side * HEAD.driveUpper[2]).applyQuaternion(headRotation).add(headOrigin);
      const b = V(HEAD.driveLower[0], HEAD.driveLower[1], side * HEAD.driveLower[2]).applyQuaternion(jawRotation).add(headOrigin);
      const direction = b.clone().sub(a).normalize();
      body.group.position.copy(a);
      rod.group.position.copy(b);
      body.group.quaternion.setFromUnitVectors(Y, direction);
      rod.group.quaternion.copy(body.group.quaternion);
    }
    for (let i = 0; i < legParts.length; i++) {
      const {thigh, shin, foot} = legParts[i];
      const leg = pose.legs[i];
      thigh.group.position.set(...leg.hip);
      shin.group.position.set(...leg.knee);
      foot.group.position.set(...leg.ankle);
      thigh.group.quaternion.setFromUnitVectors(DOWN, limbDirection.subVectors(shin.group.position, thigh.group.position).normalize());
      shin.group.quaternion.setFromUnitVectors(DOWN, limbDirection.subVectors(foot.group.position, shin.group.position).normalize());
      foot.group.rotation.y = leg.yaw;
    }
    const tailPos = onTorso(tailStart.clone());
    let angle = motion.pitch + motion.tailLift, yaw = 0;
    for (let i = 0; i < tailModules.length; i++) {
      const m = tailModules[i];
      angle -= .009 + i * .001;
      yaw += pose.tail[i];
      m.group.position.copy(tailPos);
      m.group.rotation.set(0, yaw, angle);
      const dir = V(tailLengths[i], 0, 0).applyEuler(m.group.rotation);
      tailPos.add(dir);
    }
    tip.group.position.copy(tailPos);
    tip.group.rotation.set(0, yaw, angle);
    const positions = leaderGeometry.getAttribute('position');
    const distances = leaderGeometry.getAttribute('lineDistance');
    for (const m of modules) {
      nominal[m.index].copy(m.group.position);
      m.group.position.addScaledVector(m.offset, amount);
      positions.setXYZ(m.index * 2, ...nominal[m.index].toArray());
      positions.setXYZ(m.index * 2 + 1, ...m.group.position.toArray());
      distances.setX(m.index * 2, 0);
      distances.setX(m.index * 2 + 1, m.offset.length() * amount);
      // Selected modules remain crisp; subordinate systems keep their original material.
      m.group.userData.selected = selected === m.id;
    }
    positions.needsUpdate = true;
    distances.needsUpdate = true;
    leaders.visible = amount > .02;
    root.updateMatrixWorld(true);
  };
  const anchorParts = {skull: upper, core: heartHousing, armor: systems.armor[2], legs: legParts[1].shin, tail: tailModules[7]};
  anchors.armor.sub(anchorParts.armor.base);
  const getAnchor = id => anchorParts[id] ? anchorParts[id].group.localToWorld(anchors[id].clone()) : root.localToWorld(V());
  return {
    root, systems, modules, materials, armorMaterials, partCount,
    update, getAnchor,
    getFeet: () => legParts.map(({foot}) => foot.group.getWorldPosition(V())),
    get reactorAngle() { return heartRotor.group.rotation.z - heartHousing.group.rotation.z; },
    get meshCount() { let n = 0; root.traverse(o => { if (o.isMesh) n++; }); return n; },
    dispose() {
      root.traverse(o => { o.geometry?.dispose(); });
      Object.values(materials).forEach(m => m.dispose());
    },
  };
}
