import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('campus supplies a populated scene and finite equipment animation', async () => {
  const { createCampus } = await import('../src/campus.js');
  const scene = new THREE.Scene();
  const campus = createCampus(scene);
  assert.equal(typeof campus.update, 'function');
  assert.ok(scene.children.length > 0);
  assert.deepEqual(campus.anchors.swingPivot, [-14, 3, 2]);
  campus.update(1.5);
  let count = 0;
  scene.traverse(object => {
    if (object.isMesh) count++;
    assert.ok(object.position.toArray().every(Number.isFinite));
  });
  assert.ok(count > 150, 'campus includes detailed buildings and equipment');
});
