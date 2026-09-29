import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('gear folds inward continuously and remains present inside the fuselage', async () => {
  const { createAircraft } = await import('../src/scene/aircraft.js');
  const model = createAircraft();
  const left = model.root.getObjectByName('main-gear-pivot-left');
  const right = model.root.getObjectByName('main-gear-pivot-right');
  const nose = model.root.getObjectByName('nose-gear-pivot');
  let last = 0;
  for (let i = 0; i <= 200; i++) {
    model.update({ gearExtension: 1 - i / 200 });
    assert.ok(left.visible && right.visible && nose.visible);
    assert.ok(left.rotation.x <= 0 && right.rotation.x >= 0);
    assert.ok(Math.abs(right.rotation.x - last) < 0.025);
    last = right.rotation.x;
  }
  assert.ok(right.position.y > -0.2);
  model.update({ gearExtension: 1 });
  assert.equal(right.position.y, -0.8);
  assert.equal(right.rotation.x, 0);
  model.dispose();
});

test('aircraft has nine selectable assemblies with finite, plausible geometry', async () => {
  const api = await import('../src/scene/aircraft.js').catch(() => ({}));
  assert.equal(typeof api.createAircraft, 'function', 'aircraft factory must exist');
  const model = api.createAircraft();
  assert.equal(model.parts.length, 9);
  assert.equal(new Set(model.parts.map((p) => p.id)).size, 9);
  const bounds = new THREE.Box3().setFromObject(model.root);
  const size = bounds.getSize(new THREE.Vector3());
  assert.ok(size.x >= 30 && size.x < 37);
  assert.ok(size.z >= 28 && size.z < 34);
  let meshes = 0;
  model.root.traverse((object) => {
    if (object.isMesh) {
      meshes++;
      assert.ok(object.userData.componentId);
      assert.ok([...object.geometry.attributes.position.array].every(Number.isFinite));
    }
  });
  assert.ok(meshes > 40);
  model.dispose();
});

test('explosion separates assemblies and assembly restores exact positions', async () => {
  const api = await import('../src/scene/aircraft.js').catch(() => ({}));
  assert.equal(typeof api.createAircraft, 'function');
  const model = api.createAircraft();
  const initial = model.parts.map((p) => p.group.position.clone());
  model.update({ mode: 'exploded', explosion: 1, selected: 'engine-left', time: 0 });
  assert.ok(model.parts.some((p, i) => p.group.position.distanceTo(initial[i]) > 2));
  model.update({ mode: 'assembled', explosion: 0, selected: null, time: 0 });
  model.parts.forEach((p, i) => assert.ok(p.group.position.distanceTo(initial[i]) < 0.00001));
  model.dispose();
});

test('cutaway exposes the cabin and engine core, and highlighting is reversible', async () => {
  const { createAircraft } = await import('../src/scene/aircraft.js');
  const model = createAircraft();
  const shell = model.root.getObjectByName('upper-fuselage-shell');
  const cabin = model.parts.find((p) => p.id === 'cabin').group;
  const cowling = model.root.getObjectByName('engine-cowling');
  assert.equal(shell.visible, true);
  assert.equal(cabin.visible, false);
  model.update({ mode: 'cutaway', explosion: 0, selected: 'engine-left' });
  assert.equal(shell.visible, false);
  assert.equal(cabin.visible, true);
  assert.equal(cowling.visible, false);
  const engine = model.parts.find((p) => p.id === 'engine-left');
  assert.ok(engine.materials.some((m) => m.emissiveIntensity > 0));
  model.update({ mode: 'assembled', explosion: 0, selected: null });
  assert.equal(shell.visible, true);
  assert.equal(cabin.visible, false);
  assert.equal(cowling.visible, true);
  assert.ok(engine.materials.every((m) => !m.emissive || m.emissive.getHex() === 0));
  model.dispose();
});
