import test from 'node:test';
import assert from 'node:assert/strict';
import { createAircraft } from '../src/scene/aircraft.js';

test('flight deck is exposed in focus and cutaway and restores exterior glazing', () => {
  const model = createAircraft();
  const interior = model.root.getObjectByName('cockpit-interior');
  const roof = model.root.getObjectByName('cockpit-roof');
  assert.equal(interior.children.filter((o) => o.name.startsWith('flight-display-')).length, 5);
  assert.equal(interior.children.filter((o) => o.name === 'pilot-seat-back').length, 2);
  interior.traverse((o) => {
    if (!o.isMesh) return;
    assert.equal(o.userData.componentId, 'nose');
    assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));
  });
  model.update({ focused: 'nose' });
  assert.equal(roof.visible, false);
  assert.equal(interior.visible, true);
  model.update({ mode: 'assembled' });
  assert.equal(roof.visible, true);
  assert.equal(interior.visible, false);
  model.update({ mode: 'cutaway' });
  assert.equal(interior.visible, true);
  assert.equal(roof.visible, false);
  model.dispose();
});
