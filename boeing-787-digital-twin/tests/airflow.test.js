import test from 'node:test';
import assert from 'node:assert/strict';
import { createAirflow } from '../src/scene/airflow.js';
import { sampleFlight } from '../src/scene/flight.js';

test('airflow is deterministic, finite, speed-sensitive and reversible', () => {
  const flow = createAirflow();
  const sample = { ...sampleFlight('takeoff', 0.65), progress: 0.65 };
  const positions = () => [...flow.root.children.at(-1).geometry.attributes.position.array];
  flow.update(sample);
  const before = positions();
  assert.ok(flow.root.visible);
  flow.update(sample);
  assert.deepEqual(positions(), before);
  flow.update({ ...sample, enabled: false });
  assert.equal(flow.root.visible, false);
  flow.update({ ...sample, speed: 0 });
  assert.equal(flow.root.visible, false);
  for (const progress of [-0.001, 0, 0.2, 0.62, 0.9, 1]) {
    flow.update({ ...sampleFlight('landing', progress), progress });
    assert.ok(positions().every(Number.isFinite));
  }
  flow.dispose();
});
