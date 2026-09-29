import test from 'node:test';
import assert from 'node:assert/strict';
import { createAircraft } from '../src/scene/aircraft.js';

test('surface details belong to assemblies and follow cutaway visibility', () => {
  const model = createAircraft();
  for (const [id, name, count] of [
    ['wing-left', 'wing-surface-details', 6],
    ['wing-right', 'wing-static-wicks', 6],
    ['fuselage', 'dorsal-antennas', 2],
    ['fuselage', 'cargo-door-details', 6],
    ['nose', 'radome-seam', 1],
  ]) {
    const part = model.parts.find((p) => p.id === id);
    const object = part.group.getObjectByName(name);
    assert.equal(object.children.length, count);
    object.traverse((o) => {
      if (o.isMesh) assert.equal(o.userData.componentId, id);
      if (o.geometry) assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));
    });
  }
  for (const id of ['engine-left', 'engine-right']) {
    const spiral = model.parts
      .find((p) => p.id === id)
      .group.getObjectByName('spinner-spiral-mark');
    assert.equal(spiral.userData.componentId, id);
  }
  model.update({ mode: 'cutaway' });
  assert.equal(model.root.getObjectByName('dorsal-antennas').parent.visible, false);
  model.update({ mode: 'exploded', explosion: 1 });
  assert.equal(model.root.getObjectByName('dorsal-antennas').parent.visible, true);
  model.dispose();
});
