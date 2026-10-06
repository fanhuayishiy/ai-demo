import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPeople } from '../src/people.js';

test('school has exactly 22 children and three teachers, all pickable', () => {
  const { people, pickables } = createPeople(new THREE.Scene());
  assert.equal(people.length, 25);
  assert.equal(people.filter(p => !p.isTeacher).length, 22);
  assert.equal(people.filter(p => p.isTeacher).length, 3);
  assert.equal(new Set(people.map(p => p.id)).size, 25);
  for (const p of people) {
    assert.ok(p.group instanceof THREE.Group);
    assert.ok(p.name && p.activity && p.category);
    assert.ok(pickables.some(mesh => mesh.userData.person === p));
  }
});

test('all activity loops maintain finite positions and continuous paths', () => {
  const { people, update } = createPeople(new THREE.Scene());
  update(0);
  const previous = people.map(p => p.group.position.clone());
  for (let frame = 1; frame <= 6000; frame++) {
    update(frame / 60);
    people.forEach((p, index) => {
      assert.ok(p.group.position.toArray().every(Number.isFinite));
      assert.ok(p.group.position.distanceTo(previous[index]) < 0.16, `${p.id} jumps at ${frame / 60}`);
      // A seated rig's nominal standing-foot origin can be below its low seat.
      assert.ok(p.group.position.y >= (p.id === 'child-10' ? -.23 : -0.001));
      previous[index].copy(p.group.position);
    });
  }
});

test('equipment passengers follow the exact moving seats', () => {
  const { people, update } = createPeople(new THREE.Scene());
  for (const t of [0, 1, 2.7, 9]) {
    update(t);
    const swing = people.find(p => p.id === 'child-09');
    const angle = Math.sin(t * 1.6) * 0.42;
    const seat = new THREE.Vector3(0, -2.2, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), angle).add(new THREE.Vector3(-14, 3, 2));
    swing.group.updateMatrixWorld(true);
    const hip = swing.group.children[0].localToWorld(new THREE.Vector3(0, .42, 0));
    assert.ok(hip.distanceTo(seat) < 1e-8);
    const seesaw = people.find(p => p.id === 'child-11');
    const tilt = Math.sin(t * 1.3) * .16;
    assert.ok(Math.abs(seesaw.group.position.x - (-5 - 1.5 * Math.cos(tilt) - .28 * Math.sin(tilt))) < 1e-8);
    assert.ok(Math.abs(seesaw.group.position.y + .42 * seesaw.group.scale.y - (.75 - 1.5 * Math.sin(tilt) + .28 * Math.cos(tilt))) < 1e-8);
  }
});

test('slide hips follow the actual campus CatmullRom chute without boundary jumps', () => {
  const { people, update } = createPeople(new THREE.Scene());
  const rider = people.find(p => p.id === 'child-10');
  const curve = new THREE.CatmullRomCurve3([[-9, 2.58, .35], [-9, 2.1, 1.1], [-9, .8, 2.7], [-9, .22, 4]].map(p => new THREE.Vector3(...p)));
  for (const u of [0, .1, .4, .7, .99]) {
    update(u * 14 * .22);
    rider.group.updateMatrixWorld(true);
    const hip = rider.group.children[0].localToWorld(new THREE.Vector3(0, .42, 0));
    assert.ok(hip.distanceTo(curve.getPoint(u)) < 1e-8, `slide hip off chute at ${u}`);
  }
  for (const phase of [.22, .34, .68, .77, 1]) {
    update(phase * 14 - .00001);
    const before = rider.group.position.clone();
    update(phase * 14 + .00001);
    assert.ok(rider.group.position.distanceTo(before) < .001, `jump at slide phase ${phase}`);
  }
});

test('classroom pupils face the tables while armchair readers face forward', () => {
  const { people, update } = createPeople(new THREE.Scene());
  update(3);
  for (const pupil of people.slice(0, 4)) assert.ok(Math.cos(pupil.group.rotation.y) < -.99);
  for (const pupil of people.slice(4, 6)) assert.ok(Math.cos(pupil.group.rotation.y) > .99);
});

test('classroom and sandbox children rest on actual furniture and terrain', () => {
  const { people } = createPeople(new THREE.Scene());
  assert.equal(people[0].group.position.x, -9.7);
  assert.ok(Math.abs(people[0].group.position.y + .42 * people[0].group.scale.y - 4.82) < 1e-8);
  assert.ok(Math.abs(people[4].group.position.y + .42 * people[4].group.scale.y - 5.075) < 1e-8);
  assert.equal(people[6].group.position.y, .41);
});

test('camera distance hides small details and restores them up close or without a camera', () => {
  const { people, update } = createPeople(new THREE.Scene());
  const camera = new THREE.PerspectiveCamera();
  const countHidden = () => { let count = 0; people.forEach(p => p.group.traverse(o => { if (o.isMesh && !o.visible) count++; })); return count; };
  camera.position.set(100, 80, 100);
  update(0, camera);
  assert.ok(countHidden() >= 250);
  camera.position.set(0, 8, 0);
  update(0, camera);
  assert.equal(countHidden(), 0);
  camera.position.set(100, 80, 100);
  update(0, camera);
  update(0);
  assert.equal(countHidden(), 0);
});

test('fourth classroom pupil paints with a visible colored pencil and moving hand', () => {
  const { people, update } = createPeople(new THREE.Scene());
  const painter = people[3];
  assert.equal(painter.activity, '绘画小天地');
  const pencil = painter.group.getObjectByName('colored-pencil');
  assert.ok(pencil?.isMesh);
  update(0); painter.group.updateMatrixWorld(true);
  const before = pencil.getWorldPosition(new THREE.Vector3());
  update(.5); painter.group.updateMatrixWorld(true);
  assert.ok(before.distanceTo(pencil.getWorldPosition(new THREE.Vector3())) > .005);
});
