import * as THREE from 'three';
import {batch, group} from './geometry.js';
import {makeMaterials} from './materials.js';
import {makeArm, makeDeck, makeNose, makeSkid, makeSkidBrace, makeTank} from './airframe.js';
import {makeBattery, makeBoard, makeMotorBell, makeMotorHub, makeNavigationCaps, makeNozzle, makePropellers, makeRearRadar, makeSensors, makeStator} from './systems.js';
import {PHASES, ROTOR_MOUNTS, travel} from './kinematics.mjs';
import {PARTS} from './parts.js';
import {makeMist} from './mist.js';

const MOTOR_STACK_HEIGHT = .68;
const FEATURED_MOTOR = 3;

export function makeDrone() {
  const root = new THREE.Group();
  const m = makeMaterials();
  const records = new Map(PARTS.map(part => [part.id, {...part, pieces: [], anchor: null}]));
  const pieces = [], spinning = [], guidePairs = [], sprayers = [];
  const guidePositions = new Float32Array(ROTOR_MOUNTS.length * 6);
  const guidesGeometry = new THREE.BufferGeometry();
  guidesGeometry.setAttribute('position', new THREE.BufferAttribute(guidePositions, 3).setUsage(THREE.DynamicDrawUsage));
  const guides = new THREE.LineSegments(guidesGeometry, new THREE.LineDashedMaterial({
    color: '#526e59', transparent: true, opacity: .48, dashSize: .065, gapSize: .05, depthWrite: false, toneMapped: false,
  }));
  guides.frustumCulled = false;
  root.add(guides);

  function piece(id, phase, position, displacement, build, options = {}) {
    const node = group(root, ...position);
    node.userData.component = id;
    build(node);
    if (id !== 'propellers') batch(node);
    const part = {
      id, node, base: node.position.clone(), offset: new THREE.Vector3(...displacement), phase: PHASES[phase],
      localAnchor: new THREE.Vector3(...(options.anchor ?? [0, 0, 0])),
      closeUp: options.closeUp ?? true, outer: options.outer ?? false,
    };
    const record = records.get(id);
    record.pieces.push(part);
    if (!record.anchor || options.primary) record.anchor = part;
    pieces.push(part);
    return part;
  }

  for (const [index, rotor] of ROTOR_MOUNTS.entries()) {
    const {x, y, z, sign, front, angle, hand} = rotor;
    const end = front ? 1 : -1;
    const rx = sign * .455, rz = front ? .652 : -.655;
    const dx = x - rx, dz = z - rz;
    const detail = index === FEATURED_MOTOR;
    piece('arms', 'arms', [rx, y, rz], [sign * .39, -.22, end * .14],
      node => makeArm(node, m, {...rotor, dx, dz, length: Math.hypot(dx, dz)}),
      {anchor: [dx * .54, .025, dz * .54], primary: index === 1});
    const center = piece('motors', 'frame', [x, y, z], [sign * .50, .16, end * .26],
      node => makeMotorHub(node, m), {closeUp: detail});
    center.node.scale.y = MOTOR_STACK_HEIGHT;

    for (const side of [1, -1]) {
      const upper = side > 0;
      const stator = group => makeStator(group, m);
      const bell = group => makeMotorBell(group, m);
      const motorPart = (phase, mountY, height, build, primary) => {
        const part = piece('motors', phase, [x, y + mountY * MOTOR_STACK_HEIGHT, z], [sign * .52, height, end * .28], build,
          {closeUp: detail, primary, anchor: [0, side * .125, 0]});
        part.node.scale.y = MOTOR_STACK_HEIGHT;
        if (!upper) part.node.rotation.x = Math.PI;
      };
      motorPart('motorCore', upper ? .145 : -.183, upper ? .46 : -.13, stator, detail && upper);
      motorPart('motorTop', upper ? .312 : -.348, upper ? .90 : -.59, bell, false);

      const rotorPart = piece('propellers', 'propellers', [x, y + (upper ? .449 : -.497) * MOTOR_STACK_HEIGHT, z],
        [sign * .61, upper ? 1.44 : -.59, end * (upper ? .42 : .61)],
        node => { spinning.push(makePropellers(node, m, angle + (upper ? 0 : sign * .21), hand * side, !upper)); },
        {primary: index === 0 && upper, anchor: [0, .027, 0]});
      if (upper) guidePairs.push([center, rotorPart]);
    }
    if (!front) {
      piece('nozzles', 'nozzles', [x, y - .488 * MOTOR_STACK_HEIGHT, z - .06], [sign * .91, -.56, -.89],
        node => sprayers.push(makeMist(makeNozzle(node, m), 7043 + index)),
        {primary: index === 3, anchor: [0, -.48, -.035]});
    }
  }

  piece('arms', 'frame', [0, 0, 0], [-.47, -.33, .0], node => makeDeck(node, m));
  const tank = piece('tank', 'tank', [0, .226, -.052], [-.18, 1.66, -.36], node => makeTank(node, m),
    {anchor: [0, .43, .14], outer: true});
  tank.node.scale.z = .80;
  piece('battery', 'battery', [0, .224, -.877], [.69, .63, -1.13],
    node => makeBattery(node, m), {anchor: [0, .20, 0]});
  piece('sensors', 'sensors', [0, 0, 0], [.60, -.39, .71],
    node => makeNose(node, m), {outer: true});
  piece('sensors', 'sensors', [0, 0, 0], [.60, -.39, .71],
    node => makeSensors(node, m), {primary: true, anchor: [0, .09, 1.13]});
  piece('sensors', 'sensors', [0, -.318, -1.16], [.42, -.20, -.81],
    node => makeRearRadar(node, m), {closeUp: false});
  piece('sensors', 'sensors', [0, .075, -.86], [.51, .55, -.79],
    node => makeNavigationCaps(node, m), {closeUp: false});
  const avionics = piece('sensors', 'avionics', [0, -.14, .62], [-.77, .53, .48], node => makeBoard(node, m));
  avionics.node.scale.set(.75, .75, .64);
  for (const sign of [-1, 1]) {
    piece('gear', 'gear', [0, 0, 0], [sign * .67, -.41, .26],
      node => makeSkid(node, m, sign), {primary: sign < 0, anchor: [sign * .706, -1.16, .49]});
  }
  piece('gear', 'gear', [0, 0, 0], [0, -.42, .28], node => makeSkidBrace(node, m));

  const ghost = new THREE.MeshStandardMaterial({
    color: '#a1bdb0', metalness: .12, roughness: .42, transparent: true, opacity: .20, depthWrite: false,
  });
  const covers = [];
  for (const part of pieces) {
    if (!part.outer) continue;
    part.node.traverse(node => {
      if (!node.isMesh) return;
      const materials = node.material;
      const decal = !Array.isArray(materials) && materials.transparent;
      covers.push({node, materials, decal, castShadow: node.castShadow});
    });
  }
  const raycaster = new THREE.Raycaster();
  const point = new THREE.Vector3();
  const scratchBounds = new THREE.Box3();
  let lastTransparent = false;
  let lastFocus = null;

  function pose(amount, {xray, focus, flight, moving}) {
    root.position.set(0, flight?.lift ?? 0, flight?.z ?? 0);
    root.rotation.x = flight?.pitch ?? 0;
    for (const part of pieces) {
      part.node.position.copy(part.base).addScaledVector(part.offset, travel(amount, ...part.phase));
    }
    const speed = flight?.rotorSpeed ?? 0;
    m.rotorSweep.opacity = .74 * travel(speed, .32, .97);
    for (const animate of spinning) animate(flight?.rotorAngle ?? 0, speed);
    for (const animateMist of sprayers) animateMist(flight);

    if (lastFocus !== focus) {
      lastFocus = focus;
      for (const part of pieces) part.node.visible = !focus || (part.id === focus && part.closeUp);
    }
    if (lastTransparent !== xray) {
      lastTransparent = xray;
      for (const {node, materials, decal, castShadow} of covers) {
        node.visible = !xray || !decal;
        node.material = !xray ? materials : Array.isArray(materials) ? materials.map(() => ghost) : ghost;
        node.castShadow = !xray && castShadow;
      }
    }
    guides.visible = amount > .135 && !focus;
    if (guides.visible && moving) {
      for (const [i, [mount, propeller]] of guidePairs.entries()) {
        point.copy(mount.node.position);
        point.y += .22;
        point.toArray(guidePositions, i * 6);
        point.copy(propeller.node.position);
        point.y -= .040;
        point.toArray(guidePositions, i * 6 + 3);
      }
      guidesGeometry.attributes.position.needsUpdate = true;
      guides.computeLineDistances();
    }
    root.updateMatrixWorld(true);
  }

  function anchor(id, out) {
    const part = records.get(id).anchor;
    return out.copy(part.localAnchor).applyMatrix4(part.node.matrixWorld);
  }

  function bounds(id, out) {
    out.makeEmpty();
    for (const part of records.get(id).pieces) {
      if (part.closeUp) out.union(scratchBounds.setFromObject(part.node));
    }
    return out;
  }

  function pick(point, camera) {
    raycaster.setFromCamera(point, camera);
    const candidates = pieces.filter(({node, outer}) => node.visible && (!lastTransparent || !outer));
    const hit = raycaster.intersectObjects(candidates.map(({node}) => node), true)
      .find(result => result.object.visible);
    let leaf = hit?.object;
    while (leaf && !leaf.userData.component) leaf = leaf.parent;
    return leaf?.userData.component ?? null;
  }

  return {root, pose, anchor, bounds, pick};
}
