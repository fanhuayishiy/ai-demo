import { describe, expect, it } from 'vitest';
import { advanceTime, sampleSimulation, CYCLE_DURATION } from './simulation';

describe('simulation clock', () => {
  it('freezes while paused and advances only by elapsed delta', () => {
    expect(advanceTime(10, 2, false)).toBe(10);
    expect(advanceTime(10, 2, true)).toBe(12);
  });
  it('ignores invalid or negative deltas', () => {
    expect(advanceTime(10, -2, true)).toBe(10);
    expect(advanceTime(10, NaN, true)).toBe(10);
  });
});

describe('forklift delivery', () => {
  it('starts at the loading route origin without carrying cargo', () => {
    const initial = sampleSimulation(0);
    expect(initial.stage).toBe('approach');
    expect(initial.forklift.position).toEqual([-16, 0, 3]);
    expect(initial.cargo.position).toEqual([-16, 0, 7.2]);
    expect(initial.cargo.onForks).toBe(false);
  });
  it.each([[6, 'pickup'], [9, 'transport'], [19, 'unload'], [22, 'return']] as const)(
    'enters the correct phase at %s seconds', (time, stage) => {
      expect(sampleSimulation(time).stage).toBe(stage);
    },
  );
  it('keeps forklift movement continuous at every stage boundary and wrap', () => {
    for (const t of [6, 9, 19, 22, CYCLE_DURATION]) {
      const before = sampleSimulation(t - 0.0001).forklift.position;
      const after = sampleSimulation(t + 0.0001).forklift.position;
      expect(Math.hypot(...before.map((v, i) => v - after[i]))).toBeLessThan(.01);
    }
  });
  it('picks the same cargo up and releases it at the destination', () => {
    expect(sampleSimulation(10).cargo.onForks).toBe(true);
    expect(sampleSimulation(20).cargo.onForks).toBe(true);
    expect(sampleSimulation(23).cargo.onForks).toBe(false);
    expect(sampleSimulation(23).cargo.delivered).toBe(true);
    expect(sampleSimulation(23).cargo.position).toEqual([-4, 0, 1.8]);
  });
  it('holds the cargo above the forks during transport', () => {
    const { forklift, cargo } = sampleSimulation(15);
    expect(cargo.position[0]).toBeCloseTo(forklift.position[0] + Math.sin(forklift.rotation) * 1.2);
    expect(cargo.position[2]).toBeCloseTo(forklift.position[2] + Math.cos(forklift.rotation) * 1.2);
    expect(cargo.position[1]).toBeCloseTo(forklift.lift);
  });
  it('repeats deterministic cycle data without accumulating inventory', () => {
    const { elapsed: a, ...first } = sampleSimulation(5);
    const { elapsed: b, ...next } = sampleSimulation(CYCLE_DURATION + 5);
    expect(next).toEqual(first);
    expect(b - a).toBe(CYCLE_DURATION);
  });
  it('bounds progress and handles invalid input safely', () => {
    for (const t of [-1, 0, 7, 20, 31.99, 32, NaN, Infinity]) {
      const s = sampleSimulation(t);
      expect(s.progress).toBeGreaterThanOrEqual(0);
      expect(s.progress).toBeLessThanOrEqual(1);
      expect(s.forklift.position.every(Number.isFinite)).toBe(true);
    }
  });
  it('keeps cargo continuous at pickup and release', () => {
    for (const t of [6, 9, 19, 22]) {
      const before = sampleSimulation(t - .0001).cargo.position;
      const after = sampleSimulation(t + .0001).cargo.position;
      expect(Math.hypot(...before.map((value, i) => value - after[i]))).toBeLessThan(.01);
    }
  });
  it('stays in the clear aisle when crossing the parked truck columns', () => {
    for (let t = 0; t < CYCLE_DURATION; t += .05) {
      const { forklift } = sampleSimulation(t);
      if (forklift.position[0] > -12 && forklift.position[0] < -6) {
        expect(forklift.position[2]).toBe(3);
      }
    }
  });
  it('turns continuously, including at the loop boundary', () => {
    for (let t = .01; t <= CYCLE_DURATION; t += .01) {
      const before = sampleSimulation(t - .01).forklift.rotation;
      const after = sampleSimulation(t).forklift.rotation;
      expect(Math.abs(Math.atan2(Math.sin(after - before), Math.cos(after - before)))).toBeLessThan(.05);
    }
  });
});
