import test from 'node:test';
import assert from 'node:assert/strict';

test('view state supports reversible explosion and component selection', async () => {
  const api = await import('../src/state.js').catch(() => ({}));
  assert.equal(typeof api.viewerReducer, 'function', 'viewerReducer is implemented');
  let state = api.viewerReducer(api.initialState, { type: 'mode', mode: 'exploded' });
  assert.equal(state.mode, 'exploded');
  assert.ok(state.explosion > 0);
  state = api.viewerReducer(state, { type: 'select', id: 'engine-left' });
  assert.equal(state.selected, 'engine-left');
  state = api.viewerReducer(state, { type: 'mode', mode: 'assembled' });
  assert.equal(state.explosion, 0);
  assert.equal(state.playing, false);
});

test('explosion clamp and reset protect valid viewer state', async () => {
  const api = await import('../src/state.js').catch(() => ({}));
  assert.equal(typeof api.viewerReducer, 'function');
  let state = api.viewerReducer(api.initialState, { type: 'explosion', value: 3 });
  assert.equal(state.explosion, 1);
  state = api.viewerReducer(state, { type: 'explosion', value: -3 });
  assert.equal(state.explosion, 0);
  state = api.viewerReducer(state, { type: 'reset' });
  assert.equal(state.mode, 'assembled');
  assert.equal(state.selected, null);
  assert.equal(state.autoRotate, false);
});

test('component catalogue has unique ids and inspectable engineering data', async () => {
  const api = await import('../src/data.js').catch(() => ({}));
  assert.ok(Array.isArray(api.components));
  assert.ok(api.components.length >= 8);
  assert.equal(new Set(api.components.map((c) => c.id)).size, api.components.length);
  for (const c of api.components) {
    assert.ok(c.name && c.code && c.material && c.description);
    assert.ok(c.health > 0 && c.health <= 100);
  }
});

test('opening the cabin reveals a cutaway instead of selecting hidden geometry', async () => {
  const { viewerReducer, initialState } = await import('../src/state.js');
  const assembled = viewerReducer(initialState, { type: 'mode', mode: 'assembled' });
  const selected = viewerReducer(assembled, { type: 'select', id: 'cabin' });
  assert.equal(selected.mode, 'cutaway');
  assert.equal(selected.explosion, 0);
});
