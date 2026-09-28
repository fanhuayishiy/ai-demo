import test from 'node:test';
import assert from 'node:assert/strict';
import { clampExplosion, viewState, easeInOut, PART_INFO } from '../src/state.js';

test('explosion is clamped and rejects non finite input', () => {
  assert.equal(clampExplosion(150), 100);
  assert.equal(clampExplosion(-4), 0);
  assert.equal(clampExplosion(NaN), 0);
  assert.equal(clampExplosion('62'), 62);
});
test('view presets keep shell and heat pump intent distinct', () => {
  assert.equal(viewState('assembled').explosion, 0);
  assert.equal(viewState('exploded').explosion, 62);
  assert.equal(viewState('cutaway').shell, false);
  assert.equal(viewState('thermal').flow, true);
  assert.equal(viewState('unknown').explosion, 62);
});
test('transition easing reaches exact endpoints', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(.5), .5);
});
test('core parts include meaningful Chinese explanatory content', () => {
  for (const id of ['drum', 'heatpump', 'motor', 'door', 'control', 'cabinet']) {
    assert.ok(PART_INFO[id].name.length > 1);
    assert.ok(PART_INFO[id].description.length > 20);
    assert.equal(PART_INFO[id].specs.length, 2);
  }
});
