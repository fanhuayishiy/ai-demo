import test from 'node:test';
import assert from 'node:assert/strict';
test('navigation includes all focus areas and a five-stop safe tour', async () => {
  const { VIEWS, TOUR } = await import('../src/navigation.js');
  assert.deepEqual(TOUR, ['overview','sports','play','classroom','reading']);
  for (const id of ['overview','sports','play','classroom','reading','rest']) {
    assert.ok(VIEWS[id]);
    assert.ok(VIEWS[id].position[1] > VIEWS[id].target[1] + 3);
  }
});
test('smooth easing clamps endpoints and progresses monotonically', async () => {
  const { ease } = await import('../src/navigation.js');
  assert.equal(ease(-1),0); assert.equal(ease(2),1);
  let previous = 0;
  for(let i=0;i<=100;i++){ const value=ease(i/100); assert.ok(value>=previous); previous=value; }
});
