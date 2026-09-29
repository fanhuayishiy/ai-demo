import test from 'node:test';
import assert from 'node:assert/strict';
import { createAircraft } from '../src/scene/aircraft.js';

test('cabin furnishings are instanced, finite and follow cabin visibility', () => {
  const aircraft = createAircraft();
  const cabin = aircraft.parts.find((part) => part.id === 'cabin').group;
  for (const name of ['seatback-screens', 'seatback-tray-tables', 'seatbelts']) {
    assert.equal(cabin.getObjectByName(name).count, 232);
  }
  assert.equal(cabin.getObjectByName('overhead-bins').count, 30);
  assert.equal(cabin.getObjectByName('lower-deck-containers').children.length, 24);
  cabin.getObjectByName('cabin-interior-details').traverse((object) => {
    if (!object.isMesh) return;
    assert.equal(object.userData.componentId, 'cabin');
    assert.ok([...object.geometry.attributes.position.array].every(Number.isFinite));
    if (object.isInstancedMesh) assert.ok([...object.instanceMatrix.array].every(Number.isFinite));
  });
  aircraft.update({ mode: 'assembled' });
  assert.equal(cabin.visible, false);
  aircraft.update({ mode: 'cutaway' });
  assert.equal(cabin.visible, true);
  aircraft.update({ mode: 'exploded', explosion: 0.7 });
  assert.equal(cabin.visible, true);
  aircraft.dispose();
});
