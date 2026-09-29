import test from 'node:test';
import assert from 'node:assert/strict';
import { profileAt } from '../src/scene/geometry.js';

test('tapered profiles keep a nonzero slope through intermediate stations', () => {
  const points = [
    [0, 0.1],
    [1, 0.6],
    [2, 0.9],
    [3, 1],
  ];
  const slope = (profileAt(points, 1.001) - profileAt(points, 0.999)) / 0.002;
  assert.ok(slope > 0.2 && slope < 0.5, `smooth nose slope, got ${slope}`);
  for (let x = 0; x < 3; x += 0.01)
    assert.ok(profileAt(points, x) >= 0.1 && profileAt(points, x) <= 1);
});
