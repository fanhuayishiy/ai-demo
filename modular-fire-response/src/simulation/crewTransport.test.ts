// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { advance, applyCommand, createInitialState } from './index';
import { AIRCRAFT_TIMING } from './aircraft';
import { STAGING } from '../spatial/layout';
import { firefighterPoses } from '../scene/firefighterPoses';
import type { SimulationState } from '../types';

const unit = (state: SimulationState, id = 'M01') => state.units.find(current => current.id === id)!;
function parked(id = 'M01', progress = 0) {
  const state = createInitialState();
  Object.assign(state, { mode: 'command', time: 60, phase: 3 });
  Object.assign(unit(state, id), {
    position: [...STAGING[id].position], destination: [...STAGING[id].position],
    heading: STAGING[id].heading, status: 'deploying', deployment: 0, crewProgress: progress,
  });
  return state;
}

describe('firefighters riding in their carriers', () => {
  it('keeps all seven onboard initially without adding more vehicles', () => {
    const state = createInitialState();
    expect(state.units).toHaveLength(12);
    for (const id of ['P01', 'M01', 'D01', 'C01']) expect(unit(state, id).crewProgress, id).toBe(0);
    expect(firefighterPoses(state)).toHaveLength(0);
  });

  it('does not spawn ground crew when manually waiting for dispatch', () => {
    const state = createInitialState();
    state.mode = 'command';
    const next = advance(state, 80);
    expect(next.units.every(current => current.status === 'standby')).toBe(true);
    expect(firefighterPoses(next)).toEqual([]);
  });

  it('carries the operator through delayed travel and starts walking only after final parking', () => {
    let state = createInitialState();
    Object.assign(state, { mode: 'command', time: 80 });
    state = applyCommand(state, { type: 'dispatch', id: 'M01' });
    let travelling = 0;
    for (let step = 0; step < 900 && unit(state).status === 'enroute'; step++) {
      expect(unit(state).crewProgress).toBe(0);
      expect(firefighterPoses(state)).toEqual([]);
      travelling++;
      state = advance(state, .1);
    }
    expect(travelling).toBeGreaterThan(1);
    expect(unit(state).position).toEqual(STAGING.M01.position);
    expect(unit(state).heading).toBe(STAGING.M01.heading);
    expect(unit(state).crewProgress).toBeGreaterThan(0);
    expect(unit(state).crewProgress).toBeLessThan(1);
    state = advance(state, 12);
    expect(unit(state).crewProgress).toBe(1);
    expect(firefighterPoses(state).map(person => person.id)).toEqual(['water-operator']);
  });

  it('finishes parking rotation before allowing the first person outside', () => {
    let state = parked();
    Object.assign(unit(state), { heading: Math.PI / 2, status: 'enroute', route: [] });
    state = advance(state, .1);
    expect(unit(state).heading).not.toBe(0);
    expect(unit(state).crewProgress).toBe(0);
    state = advance(state, .3);
    expect(unit(state).heading).toBe(0);
    expect(unit(state).crewProgress).toBeGreaterThan(0);
  });

  it('walks out at a bounded speed and freezes both position and state on pause', () => {
    const state = advance(parked(), .6);
    const before = structuredClone(state);
    const pose = firefighterPoses(state)[0];
    expect(pose.action).toBe('walk');
    expect(pose.position).not.toEqual(STAGING.M01.position);
    const next = advance(state, .1), moved = firefighterPoses(next)[0];
    expect(Math.hypot(...moved.position.map((value, index) => value - pose.position[index]))).toBeLessThanOrEqual(.131);
    expect(state).toEqual(before);
    state.playing = false;
    expect(advance(state, 20)).toBe(state);
    expect(firefighterPoses(advance(state, 20))).toEqual(firefighterPoses(state));
  });

  it('holds the carrier stationary until the operator has walked back and boarded', () => {
    let state = parked('M01', 1);
    Object.assign(unit(state), { status: 'working', deployment: 5 });
    const position = [...unit(state).position], heading = unit(state).heading;
    state = applyCommand(state, { type: 'recall', id: 'M01' });
    expect(unit(state).crewProgress).toBe(1);
    expect(unit(state).crewReturning).toBe(true);
    state = advance(state, .5);
    expect(unit(state).position).toEqual(position);
    expect(unit(state).heading).toBe(heading);
    expect(unit(state).status).toBe('returning');
    expect(unit(state).crewProgress).toBeGreaterThan(0);
    expect(unit(state).crewProgress).toBeLessThan(1);
    expect(firefighterPoses(state)[0].action).toBe('walk');
    state = advance(state, 10);
    expect(unit(state).crewProgress).toBe(0);
    expect(firefighterPoses(state)).toEqual([]);
    expect(unit(state).position).not.toEqual(position);
  });

  it('reverses partial disembarking continuously and supports redispatch before departure', () => {
    let state = advance(parked(), 1);
    const before = firefighterPoses(state)[0];
    state = applyCommand(state, { type: 'recall', id: 'M01' });
    expect(firefighterPoses(state)[0].position).toEqual(before.position);
    state = advance(state, .2);
    const progress = unit(state).crewProgress!;
    const returning = firefighterPoses(state)[0];
    state = applyCommand(state, { type: 'dispatch', id: 'M01' });
    expect(firefighterPoses(state)[0].position).toEqual(returning.position);
    expect(unit(state).crewReturning).toBe(false);
    state = advance(state, .2);
    expect(unit(state).crewProgress).toBeGreaterThan(progress);
    expect(unit(state).position).toEqual(STAGING.M01.position);
  });

  it('preserves the reboarding hold and destination when roads are replanned', () => {
    let state = applyCommand(parked('M01', 1), { type: 'recall', id: 'M01' });
    state = advance(state, .2);
    const before = unit(state).crewProgress;
    state = applyCommand(state, { type: 'flag', key: 'blockedRoad', value: true });
    expect(unit(state).crewProgress).toBe(before);
    expect(unit(state).destination).toEqual(unit(state).home);
    state = advance(state, .2);
    expect(unit(state).position).toEqual(STAGING.M01.position);
    expect(unit(state).crewProgress).toBeLessThan(before!);
  });

  it('does not place firefighters outside a faulted vehicle away from the incident', () => {
    const state = createInitialState();
    state.mode = 'command';
    Object.assign(unit(state), { status: 'fault', battery: 0 });
    const next = advance(state, 5);
    expect(unit(next).crewProgress).toBe(0);
    expect(firefighterPoses(next)).toEqual([]);
  });

  it('keeps the handler in control before releasing robots into the shared walking corridor', () => {
    const state = advance(parked('D01'), 3);
    expect(unit(state, 'D01').crewProgress).toBeGreaterThan(0);
    expect(unit(state, 'D01').crewProgress).toBeLessThan(1);
    expect(unit(state, 'D01').status).toBe('deploying');
    const next = advance(state, 6);
    expect(unit(next, 'D01').crewProgress).toBe(1);
    expect(unit(next, 'D01').status).toBe('working');
  });

  it('retains all C01 ground crew during occupied recovery, then boards them before moving', () => {
    let state = parked('C01', 1);
    Object.assign(unit(state, 'C01'), { status: 'working', deployment: 5, airTime: 60,
      airLiftDeployment: .4, airRescueBoarding: 1, airRescuePassenger: true });
    state = applyCommand(state, { type: 'recall', id: 'C01' });
    const position = [...unit(state, 'C01').position];
    let recovery = 0;
    while (unit(state, 'C01').airReturning && recovery++ < 200) {
      expect(unit(state, 'C01').crewProgress).toBe(1);
      expect(unit(state, 'C01').crewReturning).not.toBe(true);
      expect(unit(state, 'C01').position).toEqual(position);
      expect(firefighterPoses(state)).toHaveLength(3);
      state = advance(state, .1);
    }
    expect(recovery).toBeGreaterThan(10);
    expect(unit(state, 'C01').airReturning).toBe(false);
    expect(unit(state, 'C01').airRescueDelivered).toBe(true);
    expect(unit(state, 'C01').crewReturning).toBe(true);
    expect(unit(state, 'C01').crewProgress).toBeGreaterThan(0);
    expect(unit(state, 'C01').position).toEqual(position);
    state = advance(state, 15);
    expect(unit(state, 'C01').crewProgress).toBe(0);
    expect(unit(state, 'C01').position).not.toEqual(position);
    expect(state.life.rescued).toBe(0);
    expect(state.metrics.delivered).toBe(0);
  });

  it('does not retract crew on an aircraft fault without a vehicle recall', () => {
    let state = parked('C01', 1);
    Object.assign(unit(state, 'C01'), { status: 'working', deployment: 5, airTime: 20 });
    state = applyCommand(state, { type: 'flag', key: 'droneFault', value: true });
    state = advance(state, AIRCRAFT_TIMING.return + 2);
    expect(unit(state, 'C01').status).toBe('fault');
    expect(unit(state, 'C01').crewProgress).toBe(1);
    expect(unit(state, 'C01').crewReturning).not.toBe(true);
    expect(firefighterPoses(state)).toHaveLength(3);
  });

  it.each(['recall', 'fault'])('finishes a partially disembarked crew journey while aircraft recover after %s', reason => {
    let state = advance(parked('C01'), 5.2);
    expect(unit(state, 'C01').airTime).toBeGreaterThan(0);
    expect(unit(state, 'C01').crewProgress).toBeLessThan(1);
    state = applyCommand(state, reason === 'recall'
      ? { type: 'recall', id: 'C01' } : { type: 'flag', key: 'droneFault', value: true });
    expect(unit(state, 'C01').airReturning).toBe(true);
    const progress = unit(state, 'C01').crewProgress!;
    const before = firefighterPoses(state).find(person => person.id === 'ground-support')!;
    state = advance(state, .2);
    expect(unit(state, 'C01').crewProgress).toBeGreaterThan(progress);
    expect(unit(state, 'C01').crewReturning).toBe(false);
    const after = firefighterPoses(state).find(person => person.id === 'ground-support')!;
    expect(after.action).toBe('walk');
    expect(after.position).not.toEqual(before.position);
    expect(unit(state, 'C01').position).toEqual(STAGING.C01.position);
  });

  it('freezes at completion and resets every firefighter back onboard', () => {
    const state = advance(parked('P01'), 3);
    state.complete = true;
    expect(advance(state, 10)).toBe(state);
    const reset = applyCommand(state, { type: 'reset' });
    expect(firefighterPoses(reset)).toEqual([]);
    for (const id of ['P01', 'M01', 'D01', 'C01']) expect(unit(reset, id).crewProgress).toBe(0);
  });
});
