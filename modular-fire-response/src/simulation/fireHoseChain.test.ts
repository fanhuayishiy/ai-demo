import { describe, expect, it } from 'vitest';
import type { SimulationState, UnitState } from '../types';
import * as aircraft from './aircraft';
import { advance, applyCommand, createInitialState } from './index';

const unit = (s: SimulationState, id = 'F01') => s.units.find(u => u.id === id)!;
const hoseEvents = (s: SimulationState) => s.events.filter(e => /^air-(launch|ready)-F01-/.test(e.id));

function hoseMission() {
  const s = createInitialState();
  s.mode = 'command'; s.time = 60; s.phase = 3; s.approvals.connection = true;
  for (const id of ['F01', 'M01']) {
    const u = unit(s, id);
    u.status = 'working'; u.position = [...u.destination];
  }
  return s;
}

describe('fire hose chain readiness', () => {
  it('names the illustrative flow of its single terminal nozzle', () => {
    expect(aircraft.FIRE_HOSE_DEMO_FLOW_LPS).toBe(6);
  });

  it.each<[number, number, boolean]>([
    [0, 0, false], [15.9, 0, false], [16, 1, false], [23, 2, false], [29.9, 2, false], [30, 3, true],
  ])('requires all three arrivals at sortie time %s', (airTime, count, ready) => {
    const u = { ...unit(hoseMission()), airTime };
    expect(aircraft.fireAircraftReadyCount(u)).toBe(count);
    expect(aircraft.fireHoseChainReady).toBeTypeOf('function');
    expect(aircraft.fireHoseChainReady(u)).toBe(ready);
  });

  it.each<Partial<UnitState>>([
    { kind: 'cargo' }, { kind: 'boom' }, { status: 'standby' }, { status: 'fault' },
    { status: 'returning' }, { battery: 8 }, { battery: 0 }, { airReturning: true },
  ])('rejects an unavailable carrier even after the final arrival: %j', unavailable => {
    const u = { ...unit(hoseMission()), airTime: 30, ...unavailable };
    expect(aircraft.fireAircraftReadyCount(u)).toBe(0);
    expect(aircraft.fireHoseChainReady).toBeTypeOf('function');
    expect(aircraft.fireHoseChainReady(u)).toBe(false);
  });
});

describe('single-nozzle hose supply', () => {
  it('has no aerial demand at 16 or 23 seconds and exactly 6 L/s at 30 without a boom', () => {
    let s = advance(hoseMission(), 16);
    expect(unit(s).airTime).toBe(16);
    expect(s.water.outflow).toBe(0);
    expect(s.water.totalUsed).toBe(0);
    s = advance(s, 7);
    expect(unit(s).airTime).toBe(23);
    expect(s.water.outflow).toBe(0);
    s = advance(s, 6.9);
    expect(s.water.outflow).toBe(0);
    s = advance(s, 0.1);
    expect(unit(s).airTime).toBe(30);
    expect(s.water.outflow).toBe(6);
    const used = s.water.totalUsed;
    s = advance(s, 2);
    expect(s.water.totalUsed - used).toBeCloseTo(12);
  });

  it('reports sectional supports without mistaking boom flow for terminal spraying', () => {
    let s = hoseMission();
    unit(s, 'B01').status = 'working';
    s = advance(s, 0.1);
    expect(unit(s).task).toContain('依次起飞');
    s = advance(s, 15.9);
    expect(s.water.outflow).toBeCloseTo(24, 8);
    expect(unit(s).task).toContain('托举');
    expect(unit(s).task).toContain('1/2');
    expect(unit(s).task).not.toContain('辅助喷射');
    s = advance(s, 7);
    expect(s.water.outflow).toBeCloseTo(24, 8);
    expect(unit(s).task).toContain('2/2');
    s = advance(s, 7);
    expect(s.water.outflow).toBeCloseTo(30, 8);
    expect(unit(s).task).toContain('2架');
    expect(unit(s).task).toContain('末端喷射');
    s = applyCommand(s, { type: 'recall', id: 'B01' });
    expect(s.water.outflow).toBe(6);
  });

  it.each(['authorization', 'booster'] as const)('waits for the unavailable %s after the chain is assembled', unavailable => {
    const initial = hoseMission();
    if (unavailable === 'authorization') initial.approvals.connection = false;
    else unit(initial, 'M01').status = 'standby';
    const s = advance(initial, 30);
    expect(s.water.connected).toBe(false);
    expect(s.water.outflow).toBe(0);
    expect(unit(s).task).toContain('等待');
    expect(unit(s).task).toContain('供水');
  });

  it('updates the waiting state immediately when the booster is recalled while paused', () => {
    let s = advance(hoseMission(), 30);
    s = applyCommand(s, { type: 'toggle-play' });
    s = applyCommand(s, { type: 'recall', id: 'M01' });
    expect(s.water.connected).toBe(false);
    expect(s.water.outflow).toBe(0);
    expect(unit(s).task).toContain('等待');
    expect(unit(s).task).toContain('供水');
    expect(advance(s, 5)).toEqual(s);
  });

  it('uses the remaining buffer during source loss and waits when it is exhausted', () => {
    let s = advance(hoseMission(), 30);
    s = applyCommand(s, { type: 'flag', key: 'lowWater', value: true });
    s.water.buffer = 6;
    const used = s.water.totalUsed;
    s = advance(s, 1);
    expect(s.water.totalUsed - used).toBeCloseTo(6);
    expect(s.water.sourceAvailable).toBe(false);
    expect(s.water.buffer).toBeCloseTo(0);
    s = advance(s, 0.1);
    expect(s.water.outflow).toBeCloseTo(0);
    expect(unit(s).task).toContain('等待');
    expect(unit(s).task).toContain('供水');
  });

  it.each(['airConcept', 'droneFault'] as const)('stops its nozzle immediately when %s becomes unavailable', key => {
    let s = advance(hoseMission(), 30);
    s = applyCommand(s, { type: 'flag', key, value: key === 'droneFault' });
    expect(unit(s)).toMatchObject({ status: 'fault', airReturning: true });
    expect(s.water.outflow).toBe(0);
    const events = hoseEvents(s);
    s = advance(s, 5);
    expect(s.water.outflow).toBe(0);
    expect(hoseEvents(s)).toEqual(events);
  });

  it('stops the nozzle on fire aircraft battery exhaustion', () => {
    const ready = advance(hoseMission(), 30);
    unit(ready).battery = 8;
    const s = advance(ready, 0.1);
    expect(unit(s)).toMatchObject({ status: 'fault', airReturning: true });
    expect(s.water.outflow).toBe(0);
  });

  it('removes aerial demand as soon as the carrier is recalled', () => {
    let s = advance(hoseMission(), 30);
    const position = unit(s).position;
    s = applyCommand(s, { type: 'recall', id: 'F01' });
    expect(s.water.outflow).toBe(0);
    s = advance(s, 12);
    expect(unit(s).position).toEqual(position);
    expect(s.water.outflow).toBe(0);
  });
});

describe('ordered hose aircraft mission events', () => {
  it('records three launches followed by two support arrivals and one terminal arrival exactly once', () => {
    let s = advance(hoseMission(), 30);
    const events = hoseEvents(s);
    expect(events.map(e => e.id.split('-').slice(0, 4).join('-'))).toEqual([
      'air-launch-F01-1', 'air-launch-F01-2', 'air-launch-F01-3',
      'air-ready-F01-1', 'air-ready-F01-2', 'air-ready-F01-3',
    ]);
    const times = [60.1, 67, 74, 76, 83, 90];
    events.forEach((event, index) => expect(event.time).toBeCloseTo(times[index]));
    expect(events[3].text).toContain('托举');
    expect(events[4].text).toContain('托举');
    expect(events[5].text).toContain('末端');
    s = advance(s, 10);
    expect(hoseEvents(s)).toEqual(events);
  });

  it('does not log arrivals during recovery and logs a fresh sequence on relaunch', () => {
    let s = advance(hoseMission(), 16);
    const firstMission = hoseEvents(s);
    expect(firstMission).toHaveLength(4);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    s = advance(s, 24);
    expect(unit(s).airTime).toBe(0);
    expect(hoseEvents(s)).toEqual(firstMission);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: false });
    s = advance(s, 30);
    const events = hoseEvents(s);
    expect(events).toHaveLength(10);
    expect(new Set(events.map(e => e.id)).size).toBe(10);
    expect(s.water.outflow).toBe(6);
  });

  it('keeps mission events deterministic under pause, speed changes, and reset', () => {
    const normal = advance(hoseMission(), 30);
    const fast = advance(applyCommand(hoseMission(), { type: 'speed', value: 4 }), 7.5);
    expect(hoseEvents(fast)).toEqual(hoseEvents(normal));
    const paused = applyCommand(normal, { type: 'toggle-play' });
    expect(advance(paused, 10)).toEqual(paused);
    const reset = applyCommand(paused, { type: 'reset' });
    expect(reset).toEqual(createInitialState());
    expect(hoseEvents(reset)).toHaveLength(0);
  });
});
