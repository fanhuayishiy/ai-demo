import { describe, expect, it } from 'vitest';
import { advance, applyCommand, createInitialState } from './index';
import { planRoute } from './routing';
import type { SimulationState } from '../types';

const unit = (s: SimulationState, id: string) => s.units.find(u => u.id === id)!;
function until(s: SimulationState, condition: (s: SimulationState) => boolean) {
  for (let i = 0; i < 1800 && !s.complete && !condition(s); i++) s = advance(s, 0.1);
  expect(condition(s)).toBe(true);
  return s;
}

describe('mobile booster', () => {
  it('dispatches independently from the fourth west bay through its dedicated north access', () => {
    const s = createInitialState();
    expect(unit(s, 'M01')).toMatchObject({ kind: 'booster', home: [-60.3, 0.18, 13], status: 'standby' });
    const booster = unit(s, 'M01');
    const route = planRoute(booster.home, booster.destination, false);
    expect(route).toContainEqual([-6, 0.18, -30]);
    expect(route.at(-1)).toEqual([-6, 0.18, -2]);
    expect(route.some(p => p[0] === -22 && p[2] === -2)).toBe(false);
    expect(unit(advance(s, 2), 'M01').status).toBe('enroute');
  });

  it('disconnects pressure immediately on recall while conserving the buffered water', () => {
    let s = advance(createInitialState(), 75);
    expect(s.water.connected).toBe(true);
    expect(s.water.outflow).toBe(33);
    s = applyCommand(s, { type: 'flag', key: 'lowWater', value: true });
    const before = s.water.buffer + s.units.reduce((n, u) => n + u.water, 0) + s.water.totalUsed;
    s = applyCommand(s, { type: 'recall', id: 'M01' });
    expect(s.water.connected).toBe(false);
    expect(s.water.outflow).toBe(0);
    const buffer = s.water.buffer;
    s = advance(s, 1);
    expect(s.water.buffer).toBe(buffer);
    expect(s.water.outflow).toBe(0);
    expect(s.water.buffer + s.units.reduce((n, u) => n + u.water, 0) + s.water.totalUsed).toBeCloseTo(before, 6);
  });

  it('stops pumping on booster battery exhaustion without losing its buffer', () => {
    let s = advance(createInitialState(), 75);
    expect(unit(s, 'M01')).toBeDefined();
    unit(s, 'M01').battery = 8;
    const buffer = s.water.buffer;
    s = advance(s, 0.1);
    expect(unit(s, 'M01').status).toBe('fault');
    expect(s.water.connected).toBe(false);
    expect(s.water.outflow).toBe(0);
    expect(s.water.buffer).toBe(buffer);
  });
});

describe('simulation-owned aircraft missions', () => {
  it('starts a delayed cargo mission at deployment and only counts the actual release', () => {
    let s = applyCommand(createInitialState(), { type: 'mode', value: 'command' });
    s = advance(s, 80);
    s = applyCommand(s, { type: 'dispatch', id: 'C01' });
    s = until(s, state => unit(state, 'C01').status === 'working');
    expect(s.metrics.delivered).toBe(0);
    expect(unit(s, 'C01').airTime).toBeLessThan(1);
    s = until(s, state => (unit(state, 'C01').airTime ?? 0) >= 33.9);
    expect(s.metrics.delivered).toBe(0);
    s = advance(s, 0.2);
    expect(s.metrics.delivered).toBe(4);
    s = advance(s, 35);
    expect(unit(s, 'C01').airTime).toBe(64);
    expect(s.metrics.delivered).toBe(4);
    expect(s.events.filter(e => e.id === 'cargo-delivered')).toHaveLength(1);
  });

  it('adds one terminal nozzle only after both hose supports and the terminal aircraft arrive', () => {
    let s = applyCommand(createInitialState(), { type: 'flag', key: 'airConcept', value: false });
    s = advance(s, 70);
    expect(unit(s, 'F01').airTime).toBe(0);
    expect(s.water.outflow).toBe(27);
    s = applyCommand(s, { type: 'flag', key: 'airConcept', value: true });
    s = advance(s, 15.9);
    expect(s.water.outflow).toBe(27);
    s = advance(s, 0.2);
    expect(s.water.outflow).toBe(27);
    s = advance(s, 7);
    expect(s.water.outflow).toBe(27);
    s = advance(s, 7);
    expect(s.water.outflow).toBe(33);
    expect(unit(s, 'F01').airTime).toBe(30);
  });

  it.each(['F01', 'C01'])('holds %s until its airborne payload and any ground crew have returned before driving home', id => {
    let s = advance(createInitialState(), 60);
    const before = unit(s, id);
    expect(before.airTime).toBeGreaterThan(0);
    s = applyCommand(s, { type: 'recall', id });
    expect(unit(s, id)).toMatchObject({ airReturning: true, airReturnFrom: before.airTime, airReturnTime: 0 });
    s = advance(s, 12);
    expect(unit(s, id).position).toEqual(before.position);
    expect(unit(s, id).airTime).toBe(before.airTime);
    expect(unit(s, id).airReturnTime).toBeCloseTo(12);
    s = applyCommand(s, { type: 'flag', key: 'blockedRoad', value: true });
    s = advance(s, 11.9);
    expect(unit(s, id).position).toEqual(before.position);
    expect(unit(s, id).airReturning).toBe(true);
    s = advance(s, 1.1);
    expect(unit(s, id).airReturning).toBe(false);
    if (id === 'C01') {
      expect(unit(s, id).position).toEqual(before.position);
      expect(unit(s, id).crewReturning).toBe(true);
      expect(unit(s, id).crewProgress).toBeGreaterThan(0);
      s = until(s, state => unit(state, id).crewProgress === 0);
      expect(unit(s, id).position).toEqual(before.position);
      s = advance(s, 1.1);
    }
    expect(unit(s, id).position).not.toEqual(before.position);
    if (id === 'C01') expect(s.metrics.delivered).toBe(0);
  });

  it('finishes a fault return from its exact cargo return phase without restarting the route', () => {
    let s = until(createInitialState(), state => (unit(state, 'C01').airTime ?? 0) >= 50);
    const before = unit(s, 'C01');
    expect(s.metrics.delivered).toBe(4);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    expect(unit(s, 'C01').airReturnFrom).toBe(before.airTime);
    s = advance(s, 5);
    expect(unit(s, 'C01').airTime).toBe(before.airTime);
    expect(unit(s, 'C01').airReturnTime).toBeCloseTo(5);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    expect(unit(s, 'C01').airReturnTime).toBeCloseTo(5);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: false });
    s = advance(s, 20);
    expect(unit(s, 'C01').airReturning).toBe(false);
    expect(unit(s, 'C01').airTime).toBe(64);
    expect(s.metrics.delivered).toBe(4);
  });

  it('does not award cargo during an interrupted pre-release flight or its return', () => {
    let s = advance(createInitialState(), 55);
    expect(unit(s, 'C01').airTime).toBeGreaterThan(0);
    expect(unit(s, 'C01').airTime).toBeLessThan(34);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    s = advance(s, 30);
    expect(s.metrics.delivered).toBe(0);
    expect(unit(s, 'C01').airTime).toBe(0);
    expect(unit(s, 'C01').airReturning).toBe(false);
  });

  it('does not release the carrier hold when redispatched during aircraft recovery', () => {
    let s = advance(createInitialState(), 60);
    const position = unit(s, 'F01').position;
    s = applyCommand(s, { type: 'recall', id: 'F01' });
    s = advance(s, 5);
    s = applyCommand(s, { type: 'dispatch', id: 'F01' });
    s = advance(s, 18);
    expect(unit(s, 'F01').position).toEqual(position);
    expect(unit(s, 'F01').airReturning).toBe(true);
    s = advance(s, 10);
    expect(unit(s, 'F01').status).toBe('working');
    expect(unit(s, 'F01').position).toEqual(position);
    expect(unit(s, 'F01').airReturning).toBe(false);
  });

  it('keeps aircraft clocks paused and advances them deterministically at changed speed', () => {
    let s = advance(createInitialState(), 45);
    expect(unit(s, 'F01').airTime).toBeGreaterThan(0);
    const paused = applyCommand(s, { type: 'toggle-play' });
    expect(advance(paused, 10)).toEqual(paused);
    const fast = advance(applyCommand(s, { type: 'speed', value: 4 }), 2);
    s = advance(s, 8);
    for (const id of ['F01', 'C01']) expect(unit(fast, id).airTime).toBe(unit(s, id).airTime);
  });

  it('only authorizes a lift with enough roof hover time after the cargo release', () => {
    let s = advance(createInitialState(), 60);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
    // Lowering and boarding need five seconds before the roof departure at 44.
    s = advance(s, 10);
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(true);
    s = advance(s, 10);
    expect(s.approvals.lift).toBe(false);
    s = advance(s, 20);
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
  });

  it('deploys and recovers the optional lift continuously on the simulation clock', () => {
    let s = advance(createInitialState(), 70);
    expect(unit(s, 'C01').airLiftDeployment).toBe(0);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(true);
    s = advance(s, 1.5);
    expect(unit(s, 'C01').airLiftDeployment).toBeCloseTo(0.5);
    s = applyCommand(s, { type: 'toggle-play' });
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: false });
    expect(unit(advance(s, 10), 'C01').airLiftDeployment).toBeCloseTo(0.5);
    s = applyCommand(s, { type: 'toggle-play' });
    s = advance(s, 1.5);
    expect(unit(s, 'C01').airLiftDeployment).toBe(0);
  });

  it('recovers a deployed lift while keeping the aircraft carrier stationary', () => {
    let s = advance(createInitialState(), 70);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    s = advance(s, 3);
    expect(unit(s, 'C01').airLiftDeployment).toBe(1);
    const position = unit(s, 'C01').position;
    s = applyCommand(s, { type: 'recall', id: 'C01' });
    expect(unit(s, 'C01').airLiftDeployment).toBe(1);
    s = advance(s, 1.5);
    expect(unit(s, 'C01').airLiftDeployment).toBeCloseTo(0.5);
    expect(unit(s, 'C01').position).toEqual(position);
    s = advance(s, 1.5);
    expect(unit(s, 'C01').airLiftDeployment).toBe(0);
    expect(unit(s, 'C01').position).toEqual(position);
  });
});
