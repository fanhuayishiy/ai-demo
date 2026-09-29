import test from 'node:test';
import assert from 'node:assert/strict';
import { createAircraft } from '../src/scene/aircraft.js';
import * as THREE from 'three';
import { fitDistance } from '../src/scene/framing.js';

test('close-up framing keeps every bounding-box corner inside desktop and mobile viewports', () => {
  const bounds = new THREE.Box3(new THREE.Vector3(-7, -1.5, -2.3), new THREE.Vector3(7, 1.5, 2.3));
  const direction = new THREE.Vector3(-1, 0.25, 0.45).normalize();
  for (const aspect of [0.612, 1, 1.84]) {
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 250);
    camera.position.copy(direction).multiplyScalar(fitDistance(bounds, direction, aspect, 35));
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(camera);
          assert.ok(Math.abs(projected.x) <= 0.8 && Math.abs(projected.y) <= 0.8);
          assert.ok(projected.z > -1 && projected.z < 1);
        }
  }
});

test('787 cockpit has four distinct mirrored panes, with dark glass under selection', () => {
  const model = createAircraft();
  try {
    const panes = [];
    model.root.traverse((object) => {
      if (object.name.startsWith('cockpit-glass-')) panes.push(object);
    });
    assert.equal(panes.length, 4);
    assert.equal(panes.filter((pane) => pane.name.includes('windshield')).length, 2);
    assert.equal(panes.filter((pane) => pane.name.includes('side')).length, 2);
    for (const type of ['windshield', 'side']) {
      const left = panes.find((pane) => pane.name === `cockpit-glass-${type}-left`).geometry
        .attributes.position.array;
      const right = panes.find((pane) => pane.name === `cockpit-glass-${type}-right`).geometry
        .attributes.position.array;
      for (let i = 0; i < left.length; i += 3) {
        assert.equal(left[i], right[i]);
        assert.equal(left[i + 1], right[i + 1]);
        assert.equal(left[i + 2], -right[i + 2]);
      }
    }
    model.update({ selected: 'nose' });
    for (const pane of panes) {
      assert.equal(pane.userData.componentId, 'nose');
      assert.equal(pane.material.emissiveIntensity, 0);
      assert.ok([...pane.geometry.attributes.position.array].every(Number.isFinite));
    }
  } finally {
    model.dispose();
  }
});

test('engine service details and cabin fixtures belong to selectable assemblies', () => {
  const model = createAircraft();
  try {
    for (const id of ['engine-left', 'engine-right']) {
      const engine = model.parts.find((part) => part.id === id);
      const bolts = engine.group.getObjectByName('engine-flange-fasteners');
      assert.ok(bolts?.isInstancedMesh, 'fasteners use instancing');
      assert.equal(bolts.count, 48);
      assert.equal(bolts.userData.componentId, id);
      assert.ok(engine.group.getObjectByName('engine-service-lines'));
    }
    assert.ok(model.root.getObjectByName('seat-armrests')?.isInstancedMesh);
    assert.ok(model.root.getObjectByName('gear-torque-links'));
  } finally {
    model.dispose();
  }
});

test('hover illumination is subtle, selection takes priority, and both reset', () => {
  const model = createAircraft();
  try {
    const engine = model.parts.find((part) => part.id === 'engine-left');
    model.update({ hovered: 'engine-left' });
    const material = engine.materials.find((m) => m.emissive);
    assert.ok(material.emissiveIntensity > 0 && material.emissiveIntensity < 0.3);
    const hover = material.emissiveIntensity;
    model.update({ selected: 'engine-left', hovered: 'engine-left' });
    assert.ok(material.emissiveIntensity > hover);
    model.update();
    assert.equal(material.emissiveIntensity, 0);
  } finally {
    model.dispose();
  }
});

test('component focus isolates visible geometry and restores the current cutaway', () => {
  const model = createAircraft();
  try {
    model.update({ mode: 'cutaway', focused: 'engine-left' });
    assert.deepEqual(
      model.parts.filter((part) => part.group.visible).map((part) => part.id),
      ['engine-left'],
    );
    assert.equal(model.root.getObjectByName('engine-cowling').visible, false);
    model.update({ mode: 'cutaway' });
    assert.equal(model.parts.filter((part) => part.group.visible).length, 9);
    assert.equal(model.root.getObjectByName('upper-fuselage-shell').visible, false);
  } finally {
    model.dispose();
  }
});

test('annotation placement fits narrow screens and avoids labels and controls', async () => {
  const { layoutAnnotations } = await import('../src/scene/annotations.js');
  const obstacle = { x: 260, y: 175, width: 44, height: 160 };
  const items = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    x: 160 + i * 3,
    y: 200 + i * 2,
    width: 148,
    height: 28,
    offset: [0, 0],
  }));
  const overlaps = (a, b) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const placed = layoutAnnotations(items, { width: 320, height: 500, obstacles: [obstacle] });
  assert.ok(placed.length >= 2);
  for (const [i, box] of placed.entries()) {
    assert.ok(box.x >= 8 && box.x + box.width <= 312);
    assert.ok(box.y >= 120 && box.y + box.height <= 365);
    assert.equal(overlaps(box, obstacle), false);
    for (const other of placed.slice(i + 1)) assert.equal(overlaps(box, other), false);
  }
});
