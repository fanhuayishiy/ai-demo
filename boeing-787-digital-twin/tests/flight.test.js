import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleFlight } from '../src/scene/flight.js';

test('flight endpoints and landing contact are deterministic', () => {
  assert.equal(sampleFlight('takeoff', 0).altitude, 0);
  assert.equal(sampleFlight('takeoff', 1).gear, 0);
  assert.equal(sampleFlight('landing', 1).altitude, 0);
  assert.equal(sampleFlight('landing', 1).speed, 0);
  assert.equal(sampleFlight('landing', 1).gear, 1);
  for (const kind of ['takeoff', 'landing']) {
    let previous = -1;
    for (let i = 0; i <= 1000; i++) {
      const sample = sampleFlight(kind, i / 1000);
      assert.ok(sample.altitude >= 0);
      assert.ok(sample.gear >= 0 && sample.gear <= 1);
      assert.ok(sample.distance >= previous);
      previous = sample.distance;
    }
  }
});
