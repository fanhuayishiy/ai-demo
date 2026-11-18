import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRex} from '../model.js';
import {poseRex, ROAR} from '../kinematics.mjs';
import {HEAD} from '../cranial.js';
import {castPanel, loftHull, oval} from '../cranial-geometry.js';

test('the assembled machine has five independently inspectable systems and finite geometry', () => {
  const rex = createRex();
  assert.deepEqual(Object.keys(rex.systems).sort(), ['armor', 'core', 'legs', 'skull', 'tail']);
  assert.ok(rex.partCount > 500, 'the fine model contains actual mechanical detail');
  rex.update(poseRex(.1), {explode: 0, xray: false, selected: null});
  rex.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rex.root);
  assert.ok(box.max.x - box.min.x > 8);
  assert.ok(box.max.y - box.min.y > 4);
  assert.ok(box.min.y >= -.02, 'assembled model stays above the display floor');
  rex.root.traverse(node => {
    if (!node.isMesh) return;
    const positions = node.geometry.getAttribute('position').array;
    assert.ok(positions.every(Number.isFinite), `${node.name} has valid geometry`);
    assert.ok(node.userData.system, 'every pickable model mesh belongs to a system');
  });
});

test('explosion separates real subassemblies and restores their transforms without drift', () => {
  const rex = createRex();
  const pose = poseRex(0);
  rex.update(pose, {explode: 0, xray: false});
  const before = rex.modules.map(m => m.group.position.toArray());
  rex.update(pose, {explode: 1, xray: false});
  const after = rex.modules.map(m => m.group.position.toArray());
  assert.ok(before.filter((position, i) => position.some((n, j) => Math.abs(n - after[i][j]) > .1)).length >= 12);
  rex.update(pose, {explode: 0, xray: false});
  assert.deepEqual(rex.modules.map(m => m.group.position.toArray()), before);
});

test('xray and selection can be undone without leaking material state', () => {
  const rex = createRex();
  rex.update(poseRex(0), {explode: 0, xray: true, selected: 'core'});
  assert.ok(rex.armorMaterials.some(m => m.transparent && m.opacity < .5));
  rex.update(poseRex(0), {explode: 0, xray: false, selected: null});
  assert.ok(rex.armorMaterials.every(m => !m.transparent && m.opacity === 1));
});

test('the heart rotates independently of its housing and restores a sampled pose exactly', () => {
  const rex = createRex();
  const rotor = rex.modules.find(m => m.role === 'reactor-rotor');
  const housing = rex.modules.find(m => m.role === 'reactor-housing');
  const frame = rex.systems.core[0].group;
  assert.ok(rotor && housing, 'the flywheel and stationary casing are separate physical subassemblies');
  rex.update(poseRex(.1));
  const relativeRotation = () => housing.group.quaternion.clone().invert().multiply(rotor.group.quaternion);
  const initial = relativeRotation();
  for (const phase of [.17, .39, .93, .01]) {
    rex.update(poseRex(phase), {explode: .7});
    assert.ok(initial.angleTo(relativeRotation()) > .1);
    assert.equal(frame.rotation.z, housing.group.rotation.z, 'the housing stays fixed to the torso');
    assert.ok(rotor.group.position.distanceTo(housing.group.position) < 1e-8, 'the shaft stays seated when the core is pulled out');
  }
  rex.update(poseRex(.1));
  assert.deepEqual(relativeRotation().toArray(), initial.toArray(), 'capture does not accumulate rotations');
  rex.update(poseRex(1 - 1e-6));
  const beforeWrap = rotor.group.quaternion.clone();
  rex.update(poseRex(1e-6));
  assert.ok(beforeWrap.angleTo(rotor.group.quaternion) < .00002);
  rex.dispose();
});

test('opaque assembled chest armor exposes the actual spinning flywheel on both sides', () => {
  const rex = createRex();
  const rotor = rex.modules.find(m => m.role === 'reactor-rotor');
  const housing = rex.modules.find(m => m.role === 'reactor-housing');
  assert.ok(rotor, 'the rotating heart is present');
  const solids = [];
  rex.root.traverse(object => { if (object.isMesh) solids.push(object); });
  for (const side of [-1, 1]) {
    for (const phase of [0, .13, .37, .72]) {
      const pose = poseRex(phase);
      rex.update(pose, {explode: 0, xray: false});
      assert.ok(rex.armorMaterials.every(m => !m.transparent));
      // Includes the oblique direction of the core inspection camera.
      for (const skew of [0, -.38]) {
        let visible = 0;
        for (let i = 0; i < 48; i++) {
          const a = i / 48 * Math.PI * 2;
          const point = housing.group.localToWorld(new THREE.Vector3(Math.cos(a) * .175, Math.sin(a) * .175, side * .55));
          const origin = point.clone().add(new THREE.Vector3(skew * 4, .10 * Math.abs(skew) * 4, side * 4));
          const ray = new THREE.Raycaster(origin, point.clone().sub(origin).normalize());
          const hit = ray.intersectObjects(solids, false)[0];
          if (hit && rotor.group.children.includes(hit.object)) visible++;
        }
        assert.ok(visible >= 8, `the armor, frame and ribs must leave the rotor visible at side ${side}, phase ${phase}, skew ${skew}; saw ${visible} rays`);
      }
    }
  }
  rex.dispose();
});

test('the fixed rib frame clears the complete swept volume of both flywheel faces', () => {
  const rex = createRex();
  rex.update(poseRex(0));
  const frame = rex.systems.core.find(m => m.group.name === '脊柱承力框架');
  const rotor = rex.modules.find(m => m.role === 'reactor-rotor');
  const center = rotor.group.getWorldPosition(new THREE.Vector3());
  const point = new THREE.Vector3();
  let intrusions = 0;
  frame.group.traverse(mesh => {
    if (!mesh.isMesh) return;
    const vertices = mesh.geometry.getAttribute('position');
    // Sample every triangle corner and centroid, including the entire outer toothed rim.
    for (let i = 0; i < vertices.count; i++) {
      point.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).sub(center);
      const r = Math.hypot(point.x, point.y), z = Math.abs(point.z);
      if (r > .095 && r < .368 && z > .498 && z < .588) intrusions++;
      if (i % 3 === 0) {
        point.set(0, 0, 0);
        for (let j = 0; j < 3; j++) point.add(new THREE.Vector3().fromBufferAttribute(vertices, i + j));
        point.multiplyScalar(1 / 3).applyMatrix4(mesh.matrixWorld).sub(center);
        const radius = Math.hypot(point.x, point.y), depth = Math.abs(point.z);
        if (radius > .095 && radius < .368 && depth > .498 && depth < .588) intrusions++;
      }
    }
  });
  assert.equal(intrusions, 0, 'stationary ribs must leave clearance around the rotating blades and outer gear rim');
  rex.dispose();
});

test('the cranium flares behind the narrow snout instead of using parallel side plates', () => {
  const rex = createRex();
  rex.update({...poseRex(0), jaw: 0});
  const front = new THREE.Box3(), rear = new THREE.Box3();
  for (const module of rex.systems.skull.filter(m => ['head', 'head-shell'].includes(m.role))) {
    module.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      const positions = mesh.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
        if (p.x > -4.05 && p.x < -3.65 && p.y > 4.5) front.expandByPoint(p);
        if (p.x > -2.5 && p.x < -1.65 && p.y > 4.5) rear.expandByPoint(p);
      }
    });
  }
  assert.ok(!front.isEmpty() && !rear.isEmpty(), 'both the snout and posterior skull contain real geometry');
  const frontWidth = front.max.z - front.min.z, rearWidth = rear.max.z - rear.min.z;
  assert.ok(rearWidth / frontWidth > 1.4, 'posterior skull is substantially broader than the snout');
  rex.dispose();
});

test('jaw and upper skull share their hinge throughout head motion', () => {
  const rex = createRex();
  const upper = rex.modules.find(m => m.role === 'head');
  const jaw = rex.modules.find(m => m.role === 'jaw');
  for (let i = 0; i <= 16; i++) {
    const pose = poseRex(i / 16);
    rex.update(pose);
    const a = upper.group.getWorldPosition(new THREE.Vector3());
    const b = jaw.group.getWorldPosition(new THREE.Vector3());
    assert.ok(a.distanceTo(b) < 1e-8, 'neck motion cannot pull the two hinge halves apart');
    const relative = upper.group.quaternion.clone().invert().multiply(jaw.group.quaternion);
    const hinge = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pose.jaw);
    assert.ok(relative.angleTo(hinge) < 1e-7, 'the jaw opens about the same local hinge even when the head turns');
  }
  rex.dispose();
});

test('the neck carries the snout toward the viewer and the mouth opens in the turned pose', () => {
  const rex = createRex();
  const head = rex.modules.find(module => module.role === 'head').group;
  const torso = rex.systems.core[0].group;
  const neck = rex.modules.filter(module => module.role === 'neck').map(module => module.group);
  const [upper, lower] = ['upper-teeth', 'lower-teeth'].map(role => rex.modules.find(module => module.role === role).group);
  const snout = new THREE.Vector3(-2.18, .5, 0);
  rex.update(poseRex(.11));
  const coiled = head.localToWorld(snout.clone());
  const boneCenters = [...neck, head].map(group => group.position.clone());
  rex.update(poseRex(ROAR.peak));
  const extended = head.localToWorld(snout.clone());
  const forward = new THREE.Vector3(-1, 0, 0);
  const facing = forward.clone().applyQuaternion(head.quaternion);
  assert.ok(extended.z - coiled.z > 1.7 && extended.y - coiled.y > .3);
  assert.ok(facing.z > .74 && Math.abs(forward.clone().applyQuaternion(torso.quaternion).z) < 1e-6);
  for (const [index, bone] of neck.entries()) {
    assert.ok(forward.clone().applyQuaternion(bone.quaternion).z < facing.z);
    const next = neck[index + 1] || head;
    assert.ok(Math.abs(bone.position.distanceTo(next.position) - boneCenters[index].distanceTo(boneCenters[index + 1])) < 1e-8);
  }
  const upperTip = upper.localToWorld(new THREE.Vector3(-1.95, -.10, .27));
  const lowerTip = lower.localToWorld(new THREE.Vector3(-1.95, .10, .25));
  assert.ok(upperTip.y - lowerTip.y > 1.35, 'the visible upper and lower tooth rows separate during the roar');
  assert.ok(new THREE.Box3().setFromObject(rex.root).min.y >= -.02, 'the deepest lunge stays above the floor');
  rex.dispose();
});

test('both eyelids uncover and physically occlude the lenses in a turned pose', () => {
  const rex = createRex();
  const optics = rex.modules.filter(module => module.role === 'head-optic');
  const pose = poseRex(ROAR.peak);
  for (const [index, optic] of optics.entries()) {
    const side = index === 0 ? -1 : 1;
    const lid = optic.group.getObjectByName('eyelid');
    assert.ok(lid?.isMesh, 'the eye has a physical moving cover');
    const visibleLid = blink => {
      rex.update({...pose, blink}, {explode: .19});
      const origin = optic.group.localToWorld(new THREE.Vector3(-.365, .70, side * 1.4));
      const direction = new THREE.Vector3(0, 0, -side).applyQuaternion(optic.group.quaternion);
      return new THREE.Raycaster(origin, direction).intersectObject(lid).length > 0;
    };
    assert.equal(visibleLid(0), false);
    assert.equal(visibleLid(1), true);
    assert.equal(visibleLid(0), false);
  }
  rex.dispose();
});

test('the tooth cassettes articulate with their own jaws and separate during teardown', () => {
  const rex = createRex();
  const teeth = ['upper-teeth', 'lower-teeth'].map(role => rex.modules.find(m => m.role === role));
  assert.ok(teeth.every(Boolean), 'both dental arches are removable solid subassemblies');
  const pose = poseRex(.25);
  rex.update(pose);
  for (let i = 0; i < teeth.length; i++) {
    const parent = rex.modules.find(m => m.role === (i ? 'jaw' : 'head'));
    assert.ok(teeth[i].group.position.distanceTo(parent.group.position) < 1e-8);
    assert.equal(teeth[i].group.rotation.z, parent.group.rotation.z);
    const box = new THREE.Box3().setFromObject(teeth[i].group);
    assert.ok(box.max.z - box.min.z > .6 && box.max.x - box.min.x > 1.4, 'teeth occupy a complete three-dimensional arch');
  }
  const assembled = teeth.map(m => m.group.position.clone());
  rex.update(pose, {explode: 1});
  teeth.forEach((m, i) => assert.ok(m.group.position.distanceTo(assembled[i]) > .6));
  rex.dispose();
});

test('both ends of the telescoping jaw drives stay pinned throughout the bite cycle', () => {
  const rex = createRex();
  const head = rex.modules.find(m => m.role === 'head'), jaw = rex.modules.find(m => m.role === 'jaw');
  const drives = rex.modules.filter(m => m.role === 'jaw-drive');
  assert.equal(drives.length, 4, 'each side has a cylinder body and a separate piston rod');
  for (let i = 0; i <= 32; i++) {
    rex.update(poseRex(i / 32));
    for (let j = 0; j < 4; j += 2) {
      const side = j === 0 ? -1 : 1;
      const a = head.group.localToWorld(new THREE.Vector3(HEAD.driveUpper[0], HEAD.driveUpper[1], side * HEAD.driveUpper[2]));
      const b = jaw.group.localToWorld(new THREE.Vector3(HEAD.driveLower[0], HEAD.driveLower[1], side * HEAD.driveLower[2]));
      assert.ok(drives[j].group.getWorldPosition(new THREE.Vector3()).distanceTo(a) < 1e-8);
      assert.ok(drives[j + 1].group.getWorldPosition(new THREE.Vector3()).distanceTo(b) < 1e-8);
      const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(drives[j].group.quaternion);
      assert.ok(axis.distanceTo(b.clone().sub(a).normalize()) < 1e-8);
      assert.ok(a.distanceTo(b) < 1.06 && a.distanceTo(b) > .58, 'cylinder and rod retain positive telescoping overlap');
    }
  }
  rex.dispose();
});

test('formed cranial castings keep their openings and outside-facing walls on both sides', () => {
  for (const side of [-1, 1]) {
    const geometry = castPanel([[-1, -.5], [1, -.5], [1, .5], [-1, .5]], [oval(0, 0, .25, .2)], .14, () => .6, side);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, side * 3), new THREE.Vector3(0, 0, -side));
    assert.equal(ray.intersectObject(mesh).length, 0, 'fenestra is an open passage, not a painted recess');
    ray.ray.origin.x = .8;
    assert.ok(ray.intersectObject(mesh).length > 0, 'the cast surface faces its viewer on either side');
    geometry.dispose(); mesh.material.dispose();
  }
  const geometry = loftHull([[-1, 0, 0, .2, .2], [0, .1, 0, .5, .3], [1, .2, 0, .7, .4]]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  for (const [origin, direction] of [[[0, .1, 2], [0, 0, -1]], [[-2, 0, 0], [1, 0, 0]], [[2, .2, 0], [-1, 0, 0]]]) {
    assert.ok(new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(mesh).length > 0, 'loft and both end caps face outward');
  }
  geometry.dispose(); mesh.material.dispose();
});

test('a warped temporal casting is watertight after shared-edge refinement', () => {
  const outline = [[-.06, .92], [.21, .92], [.37, .67], [.30, .22], [.12, -.04], [-.16, .10], [-.18, .37], [-.08, .60]];
  const hole = [[.06, .72], [.18, .76], [.24, .63], [.18, .44], [.08, .42], [.02, .54]];
  for (const side of [-1, 1]) {
    const geometry = castPanel(outline, [hole], .17, (x, y) => .53 + .10 * Math.sin(y * 3.2), side, .021);
    const edges = new Map(), index = geometry.getIndex().array;
    for (let i = 0; i < index.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = index[i + k], b = index[i + (k + 1) % 3];
        const key = a < b ? `${a}/${b}` : `${b}/${a}`;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    const boundary = [...edges.values()].filter(count => count !== 2);
    assert.equal(boundary.length, 0, 'every casting edge must belong to exactly two faces; fenestra walls are closed too');
    geometry.dispose();
  }
});
