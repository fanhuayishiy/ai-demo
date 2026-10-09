import { describe, expect, it } from 'vitest';
import { advance, applyCommand, createInitialState, KIND_LABELS } from './index';
import { planRoute } from './routing';
import type { SimulationState } from '../types';

function run(state = createInitialState(), seconds = 180) {
  for (let i = 0; i < seconds; i++) state = advance(state, 1);
  return state;
}

describe('response simulation', () => {
  it('allocates twelve units covering all ten capabilities', () => {
    const s = createInitialState();
    expect(s.units).toHaveLength(12);
    expect(new Set(s.units.map(u => u.kind)).size).toBe(10);
    expect(Object.keys(KIND_LABELS)).toHaveLength(10);
    expect(s.flags.airConcept).toBe(true);
    expect(s.flags.liftConcept).toBe(false);
  });
  it('honors pause, supported speeds, reset, and immutable inputs', () => {
    const initial = createInitialState();
    const pause = applyCommand(initial, { type: 'toggle-play' });
    expect(advance(pause, 5)).toEqual(pause);
    expect(advance(applyCommand(initial, { type: 'speed', value: 4 }), 2).time).toBe(8);
    expect(applyCommand(initial, { type: 'speed', value: 9 }).speed).toBe(1);
    expect(initial.time).toBe(0);
    expect(applyCommand(run(initial, 10), { type: 'reset' })).toEqual(initial);
  });
  it('completes default response with bounded events and real resource use', () => {
    const s = run();
    expect(s.complete).toBe(true);
    expect(s.time).toBe(180);
    expect(s.phase).toBe(5);
    expect(s.metrics.firstRecon).toBeLessThanOrEqual(12);
    expect(s.metrics.firstArrival).toBeLessThanOrEqual(30);
    expect(s.water.totalUsed).toBeGreaterThan(2000);
    expect(s.water.refillCycles).toBeGreaterThan(0);
    expect(s.metrics.energySwaps).toBeGreaterThan(0);
    expect(s.life.confirmed).toBe(true);
    expect(s.life.rescued).toBeGreaterThan(0);
    expect(s.approvals.lift).toBe(false);
    expect(s.events.length).toBeLessThanOrEqual(80);
    expect(advance(s, 99).time).toBe(180);
  });
  it('does not grant command-mode permissions or rescue automatically', () => {
    let s = applyCommand(createInitialState(), { type: 'mode', value: 'command' });
    s = run(s);
    expect(s.approvals.dispatch).toBe(false);
    expect(s.approvals.rescue).toBe(false);
    expect(s.life.rescued).toBe(0);
    expect(s.units.every(u => u.status === 'standby')).toBe(true);
  });
  it('guards confirmation and experimental lifting', () => {
    let s = applyCommand(createInitialState(), { type: 'confirm-life' });
    expect(s.life.confirmed).toBe(false);
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
    s = run(s, 75);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    expect(s.approvals.lift).toBe(false);
    expect(run(s, 40).approvals.lift).toBe(false);
  });
  it('reroutes around a blocked road and keeps the current location continuous', () => {
    const normal = planRoute([-45, 0.18, -30], [-14, 0.18, 11], false);
    const blocked = planRoute([-45, 0.18, -30], [-14, 0.18, 11], true);
    expect(blocked).not.toEqual(normal);
    expect(blocked.length).toBeGreaterThan(1);
    const s = run(createInitialState(), 3);
    const rerouted = applyCommand(s, { type: 'flag', key: 'blockedRoad', value: true });
    expect(rerouted.units.map(u => u.position)).toEqual(s.units.map(u => u.position));
  });
  it('conserves water and makes loss of source interrupt suppression', () => {
    let s = createInitialState();
    const initial = s.water.buffer + s.units.reduce((n, u) => n + u.water, 0);
    s = applyCommand(s, { type: 'flag', key: 'lowWater', value: true });
    s = run(s);
    const remaining = s.water.buffer + s.units.reduce((n, u) => n + u.water, 0);
    expect(remaining + s.water.totalUsed).toBeCloseTo(initial, 5);
    expect(s.water.interruptedFor).toBeGreaterThan(0);
    expect(s.water.outflow).toBeLessThan(30);
    expect(s.water.sourceAvailable).toBe(false);
  });
  it('recalls continuously and withdrawn ladder cannot perform rescue', () => {
    let s = run(createInitialState(), 55);
    const ladder = s.units.find(u => u.kind === 'ladder')!;
    s = applyCommand(s, { type: 'recall', id: ladder.id });
    expect(s.units.find(u => u.id === ladder.id)!.position).toEqual(ladder.position);
    s = run(s, 125);
    expect(s.life.rescued).toBe(0);
    expect(s.units.find(u => u.id === ladder.id)!.status).toBe('recalled');
  });
  it('never rescues on approval alone without confirmation', () => {
    let s = applyCommand(createInitialState(), { type: 'mode', value: 'command' });
    s = applyCommand(s, { type: 'approve', key: 'dispatch' });
    s = applyCommand(s, { type: 'approve', key: 'rescue' });
    s = run(s);
    expect(s.life.confirmed).toBe(false);
    expect(s.life.rescued).toBe(0);
  });
  it('faults suppress air operation and never create negative resources', () => {
    let s: SimulationState = createInitialState();
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    s = applyCommand(s, { type: 'flag', key: 'powerFault', value: true });
    for (let i = 0; i < 180; i++) {
      s = advance(s, 1);
      expect(s.water.buffer).toBeGreaterThanOrEqual(0);
      expect(s.water.buffer).toBeLessThanOrEqual(s.water.capacity);
      s.units.forEach(u => { expect(u.battery).toBeGreaterThanOrEqual(0); expect(u.water).toBeGreaterThanOrEqual(0); });
    }
    expect(s.units.find(u => u.kind === 'fire-drone')!.status).toBe('fault');
    expect(s.metrics.energySwaps).toBe(0);
  });
  it('lets a unit already on the closed road retreat to a connected junction', () => {
    const route = planRoute([-22, 0, -20], [2, 0, 20], true);
    expect(route.length).toBeGreaterThan(1);
    expect(route[0]).toEqual([-22, 0, -20]);
    expect(route.at(-1)).toEqual([2, 0, 20]);
    expect(route.some(p => p[2] === -30)).toBe(true);
  });
  it('can redispatch a returning unit without teleporting or auto-recalling it', () => {
    let s = run(createInitialState(), 50);
    s = applyCommand(s, { type: 'recall', id: 'B01' });
    s = run(s, 2);
    const position = s.units.find(u => u.id === 'B01')!.position;
    s = applyCommand(s, { type: 'dispatch', id: 'B01' });
    expect(s.units.find(u => u.id === 'B01')!.position).toEqual(position);
    expect(run(s, 50).units.find(u => u.id === 'B01')!.status).toBe('working');
  });
  it('recalling the power module stops subsequent charging', () => {
    let s = run(createInitialState(), 75);
    s = applyCommand(s, { type: 'recall', id: 'P01' });
    expect(run(s, 50).metrics.energySwaps).toBe(s.metrics.energySwaps);
  });
  it('requires explicit lift permission and removes it when the aircraft faults', () => {
    let s = run(createInitialState(), 75);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(true);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    expect(s.approvals.lift).toBe(false);
  });
  it('keeps unreachable units stopped instead of restoring them to working', () => {
    let s = run(createInitialState(), 3);
    const u = s.units.find(u => u.id === 'B01')!;
    u.position = [-22, 0, -5];
    s = applyCommand(s, { type: 'flag', key: 'blockedRoad', value: true });
    expect(s.units.find(u => u.id === 'B01')!.status).toBe('fault');
    s = run(s, 50);
    expect(s.units.find(u => u.id === 'B01')!.status).toBe('fault');
    expect(s.units.find(u => u.id === 'B01')!.position).toEqual([-22, 0, -5]);
    s = applyCommand(s, { type: 'flag', key: 'blockedRoad', value: false });
    expect(s.units.find(u => u.id === 'B01')!.status).toBe('enroute');
  });
  it('cancels partial rescue when its ladder is recalled', () => {
    let s = run(createInitialState(), 110);
    s = applyCommand(s, { type: 'recall', id: 'L01' });
    s = run(s, 15);
    s = applyCommand(s, { type: 'dispatch', id: 'L01' });
    s = run(s, 55);
    expect(s.life.rescued).toBe(0);
  });
  it('consumes travel energy and prevents movement after exhaustion', () => {
    let s = run(createInitialState(), 2);
    const u = s.units.find(u => u.id === 'W01')!;
    expect(u.battery).toBeLessThan(100);
    u.battery = 0;
    const position = [...u.position];
    s = advance(s, 1);
    expect(s.units.find(u => u.id === 'W01')!.position).toEqual(position);
    expect(s.units.find(u => u.id === 'W01')!.status).toBe('fault');
  });
  it('parks inside station aprons without overlapping bays', () => {
    const s = createInitialState();
    expect(s.units.find(u => u.id === 'W01')!.home).toEqual([-55.75, 0.18, -42.3]);
    expect(s.units.find(u => u.id === 'L01')!.home).toEqual([55.75, 0.18, -42.3]);
    expect(new Set(s.units.map(u => u.home.join(','))).size).toBe(12);
  });
  it('keeps conventional recon active when experimental hose operations are disabled', () => {
    let s = applyCommand(createInitialState(), { type: 'flag', key: 'airConcept', value: false });
    s = run(s, 20);
    expect(s.metrics.firstRecon).toBeLessThanOrEqual(12);
    expect(s.units.find(u => u.kind === 'recon')!.status).toBe('working');
  });
  it('does not deliver drone cargo when aircraft are faulted', () => {
    let s = applyCommand(createInitialState(), { type: 'flag', key: 'droneFault', value: true });
    s = run(s, 100);
    expect(s.metrics.delivered).toBe(0);
    expect(s.units.find(u => u.kind === 'cargo')!.status).toBe('fault');
  });
  it('reflects equipment faults immediately even while paused', () => {
    let s = run(createInitialState(), 60);
    s = applyCommand(s, { type: 'toggle-play' });
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    s = applyCommand(s, { type: 'flag', key: 'powerFault', value: true });
    expect(s.units.find(u => u.kind === 'fire-drone')!.status).toBe('fault');
    expect(s.units.find(u => u.kind === 'power')!.status).toBe('fault');
    expect(s.water.outflow).toBe(27);
  });
  it('allows independent authorized lift trials without enabling the hose concept', () => {
    let s = run(createInitialState(), 75);
    s = applyCommand(s, { type: 'flag', key: 'airConcept', value: false });
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(true);
  });
  it('revokes lift authorization on cargo recall and requires fresh approval', () => {
    let s = run(createInitialState(), 75);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    s = applyCommand(s, { type: 'recall', id: 'C01' });
    expect(s.approvals.lift).toBe(false);
    s = applyCommand(s, { type: 'dispatch', id: 'C01' });
    expect(run(s, 20).approvals.lift).toBe(false);
  });
  it('does not authorize a new lift after people are already rescued', () => {
    let s = run(createInitialState(), 150);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
  });
  it('does not label a confirmed signal as awaiting confirmation', () => {
    const s = run(createInitialState(), 70);
    expect(s.life.confirmed).toBe(true);
    expect(s.life.source).not.toContain('待人工复核');
  });
  it('dispatches a preset first response then requests high-rise support after detection', () => {
    let s = run(createInitialState(), 2);
    const first = ['R01', 'W01', 'M01', 'B01', 'D01', 'T01'];
    expect(s.units.filter(u => first.includes(u.id)).every(u => u.status === 'enroute')).toBe(true);
    expect(s.units.filter(u => !first.includes(u.id)).every(u => u.status === 'standby')).toBe(true);
    s = run(s, 10);
    expect(s.life.detected).toBe(true);
    expect(s.units.filter(u => !first.includes(u.id)).every(u => u.status !== 'standby')).toBe(true);
    expect(s.events.some(e => e.id === 'support-dispatch')).toBe(true);
  });
  it('uses staged deployment after command-mode dispatch approval without approving rescue', () => {
    let s = applyCommand(createInitialState(), { type: 'mode', value: 'command' });
    s = applyCommand(s, { type: 'approve', key: 'dispatch' });
    expect(s.units.filter(u => u.status === 'enroute')).toHaveLength(6);
    s = run(s, 20);
    expect(s.units.some(u => u.status === 'standby')).toBe(false);
    expect(s.approvals.rescue).toBe(false);
    expect(s.life.confirmed).toBe(false);
  });
  it('includes deployed dog suppression in water balance and removes its demand on recall', () => {
    let s = run(createInitialState(), 75);
    expect(s.phase).toBeGreaterThanOrEqual(3);
    expect(s.water.outflow).toBe(33);
    const before = s.water.totalUsed;
    s = advance(s, 1);
    expect(s.water.totalUsed - before).toBeCloseTo(33);
    s = applyCommand(s, { type: 'recall', id: 'D01' });
    s = advance(s, 1);
    expect(s.water.outflow).toBe(30);
  });
});
