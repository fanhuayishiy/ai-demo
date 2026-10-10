import { describe, expect, it } from 'vitest';
import type { Command, SimulationState } from '../types';
import * as aircraft from './aircraft';
import { advance, applyCommand, createInitialState } from './index';

const cargo = (s: SimulationState) => s.units.find(u => u.id === 'C01')!;
const rescueEvents = (s: SimulationState) => s.events.filter(e => e.id.startsWith('roof-rescue-'));

function roofMission(airTime = 34) {
  const s = createInitialState();
  s.mode = 'command'; s.time = 60; s.phase = 3;
  s.life.detected = true; s.life.confirmed = true;
  s.flags.liftConcept = true;
  s.metrics.delivered = airTime >= 34 ? 4 : 0;
  const u = cargo(s);
  u.status = 'working'; u.position = [...u.destination]; u.airTime = airTime;
  return s;
}

function authorize(s = roofMission()) {
  const approved = applyCommand(s, { type: 'approve', key: 'lift' });
  expect(approved.approvals.lift).toBe(true);
  return approved;
}

function boarded() {
  const s = advance(authorize(), 5);
  expect(cargo(s).airRescuePassenger).toBe(true);
  return s;
}

describe('rooftop rescue timing and authorization', () => {
  it('shares the optional rescue clock and keeps ordinary supplies at 64 seconds', () => {
    expect(aircraft.AIRCRAFT_TIMING.roofRescue).toEqual({
      boarding: 2, groundApproach: 59, groundLower: 62, groundDelivery: 64, groundRetract: 67, mission: 72,
    });
    expect(aircraft.cargoFlightTime).toBeTypeOf('function');
    expect(aircraft.cargoMissionDuration).toBeTypeOf('function');
    const u = cargo(roofMission(40));
    expect(aircraft.cargoMissionDuration(u)).toBe(64);
    expect(aircraft.cargoFlightTime(u)).toBe(40);
    u.airReturning = true; u.airReturnFrom = 40; u.airReturnTime = 5;
    expect(aircraft.cargoFlightTime(u)).toBe(40);
    u.airRescuePassenger = true; u.airRescueRecovery = true;
    expect(aircraft.cargoFlightTime(u)).toBe(45);
    expect(aircraft.cargoMissionDuration(u)).toBe(72);
    u.airRescuePassenger = false; u.airRescueDelivered = true;
    expect(aircraft.cargoMissionDuration(u)).toBe(72);
  });

  it.each([33.9, 39.01, 40, 44, 64])('rejects a new pickup at flight time %s', time => {
    const s = applyCommand(roofMission(time), { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
  });

  it.each(['switch', 'confirmation', 'fault', 'battery', 'passenger', 'delivered', 'ladder'] as const)(
    'requires the %s safety condition before accepting a pickup', unavailable => {
      const s = roofMission();
      if (unavailable === 'switch') s.flags.liftConcept = false;
      if (unavailable === 'confirmation') s.life.confirmed = false;
      if (unavailable === 'fault') s.flags.droneFault = true;
      if (unavailable === 'battery') cargo(s).battery = 8;
      if (unavailable === 'passenger') cargo(s).airRescuePassenger = true;
      if (unavailable === 'delivered') cargo(s).airRescueDelivered = true;
      if (unavailable === 'ladder') s.life.rescued = 2;
      expect(applyCommand(s, { type: 'approve', key: 'lift' }).approvals.lift).toBe(false);
    },
  );

  it('releases four rooftop supply groups without automatically authorizing rescue', () => {
    let s = advance(roofMission(0), 33.9);
    expect(s.metrics.delivered).toBe(0);
    s = advance(s, 0.1);
    expect(s.metrics.delivered).toBe(4);
    expect(s.events.find(e => e.id === 'cargo-delivered')?.text).toContain('屋顶');
    s = advance(s, 30);
    expect(cargo(s).airTime).toBe(64);
    expect(cargo(s).airRescuePassenger ?? false).toBe(false);
    expect(cargo(s).airLiftDeployment).toBe(0);
    expect(rescueEvents(s)).toHaveLength(0);
    expect(s.life.rescued).toBe(0);
  });

  it('preserves the ordinary cargo release outcome for a single long aircraft step', () => {
    const u = cargo(roofMission(0));
    expect(aircraft.advanceAircraft(u, 64)).toBe('delivered');
    expect(u.airTime).toBe(64);
  });

  it('finishes lowering and boarding by time 44 for the latest accepted authorization', () => {
    let s = authorize(roofMission(39));
    s = advance(s, 3);
    expect(cargo(s).airTime).toBe(42);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).airRescueBoarding ?? 0).toBe(0);
    expect(s.approvals.lift).toBe(true);
    s = advance(s, 1.9);
    expect(cargo(s).airRescueBoarding).toBeCloseTo(0.95);
    expect(cargo(s).airRescuePassenger ?? false).toBe(false);
    s = advance(s, 0.1);
    expect(cargo(s).airTime).toBe(44);
    expect(cargo(s).airRescueBoarding).toBe(1);
    expect(cargo(s).airRescuePassenger).toBe(true);
  });
});

describe('visible rooftop pickup and ground handoff', () => {
  it('lowers first, boards one person, and retracts the occupied basket continuously', () => {
    let s = authorize();
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBeCloseTo(0.5);
    expect(cargo(s).airRescueBoarding ?? 0).toBe(0);
    expect(cargo(s).task).toContain('下放');
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).airRescueBoarding ?? 0).toBe(0);
    s = advance(s, 1);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).airRescueBoarding).toBeCloseTo(0.5);
    expect(cargo(s).task).toContain('登篮');
    s = advance(s, 1);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airRescueBoarding).toBe(1);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(s.approvals.lift).toBe(false);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBeCloseTo(0.5);
    expect(cargo(s).task).toContain('转运');
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBe(0);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airRescueDelivered ?? false).toBe(false);
    expect(s.life.rescued).toBe(0);
  });

  it('hands off once at time 64 and lands at 72 without inflating ladder statistics', () => {
    let s = boarded();
    s = advance(s, 20);
    expect(cargo(s).airTime).toBe(59);
    expect(cargo(s).airLiftDeployment).toBe(0);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBeCloseTo(0.5);
    s = advance(s, 1.5);
    expect(cargo(s).airTime).toBe(62);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).task).toContain('地面接应');
    s = advance(s, 1.9);
    expect(cargo(s).airRescueDelivered ?? false).toBe(false);
    expect(cargo(s).airLiftDeployment).toBe(1);
    s = advance(s, 0.1);
    expect(cargo(s).airTime).toBe(64);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(aircraft.aircraftInFlight(cargo(s))).toBe(true);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
    expect(s.life.rescued).toBe(0);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBeCloseTo(0.5);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBe(0);
    s = advance(s, 5);
    expect(cargo(s).airTime).toBe(72);
    expect(aircraft.aircraftInFlight(cargo(s))).toBe(false);
    expect(s.events.filter(e => e.id.startsWith('air-landed-C01-'))).toHaveLength(1);
    s = advance(s, 10);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
    expect(s.life.rescued).toBe(0);
    expect(s.metrics.delivered).toBe(4);
  });

  it('does not claim overall rescue success when only an optional handoff occurred', () => {
    const s = advance(boarded(), 180);
    expect(s.complete).toBe(true);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(s.life.rescued).toBe(0);
    expect(s.events.find(e => e.id === 'complete')?.level).toBe('warning');
    expect(s.approvals.lift).toBe(false);
  });

  it('does not fabricate a handoff when the simulation ends before ground receiving', () => {
    const active = boarded();
    active.time = 179;
    const s = advance(active, 10);
    expect(s.complete).toBe(true);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airRescueDelivered ?? false).toBe(false);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(0);
    expect(s.life.rescued).toBe(0);
  });
});

describe('interrupted rooftop operations', () => {
  const interruptions: [string, Command][] = [
    ['recall', { type: 'recall', id: 'C01' }],
    ['fault', { type: 'flag', key: 'droneFault', value: true }],
    ['switch off', { type: 'flag', key: 'liftConcept', value: false }],
  ];

  it.each(interruptions)('walks a partial passenger back before retracting after %s', (_label, command) => {
    let s = advance(authorize(), 4);
    const position = [...cargo(s).position];
    expect(cargo(s).airRescueBoarding).toBeCloseTo(0.5);
    s = applyCommand(s, command);
    expect(cargo(s).airReturning).toBe(true);
    expect(cargo(s).airRescueRecovery ?? false).toBe(false);
    expect(s.approvals.lift).toBe(false);
    s = advance(s, 0.5);
    expect(cargo(s).airRescueBoarding).toBeCloseTo(0.25);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).position).toEqual(position);
    s = advance(s, 0.5);
    expect(cargo(s).airRescueBoarding).toBe(0);
    expect(cargo(s).airLiftDeployment).toBe(1);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBeCloseTo(0.5);
    s = advance(s, 1.5);
    expect(cargo(s).airLiftDeployment).toBe(0);
    s = advance(s, 20);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airTime).toBe(64);
    expect(cargo(s).airRescuePassenger ?? false).toBe(false);
    expect(cargo(s).airRescueDelivered ?? false).toBe(false);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(0);
  });

  it('does not resume boarding when the concept switch is re-enabled during empty recovery', () => {
    let s = advance(authorize(), 4);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: false });
    const returnFrom = cargo(s).airReturnFrom;
    const boarding = cargo(s).airRescueBoarding;
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
    expect(cargo(s).airRescueBoarding).toBe(boarding);
    expect(cargo(s).airReturnFrom).toBe(returnFrom);
    s = advance(s, 24);
    expect(cargo(s).airRescueBoarding).toBe(0);
    expect(cargo(s).airRescuePassenger ?? false).toBe(false);
    expect(cargo(s).airRescueDelivered ?? false).toBe(false);
    expect(cargo(s).airReturning).toBe(false);
  });

  it.each(interruptions)('keeps its occupied route and finishes ground receiving after %s', (_label, command) => {
    let s = boarded();
    const position = [...cargo(s).position];
    s = applyCommand(s, command);
    expect(cargo(s)).toMatchObject({ airReturning: true, airReturnFrom: 39, airReturnTime: 0, airRescueRecovery: true });
    s = advance(s, 23);
    expect(cargo(s).airTime).toBe(39);
    expect(cargo(s).airReturnTime).toBe(23);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airLiftDeployment).toBe(1);
    expect(cargo(s).position).toEqual(position);
    s = advance(s, 2);
    expect(cargo(s).airReturning).toBe(true);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
    expect(cargo(s).position).toEqual(position);
    s = advance(s, 7.9);
    expect(cargo(s).airReturning).toBe(true);
    expect(cargo(s).position).toEqual(position);
    s = advance(s, 0.1);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airTime).toBe(72);
    expect(s.events.filter(e => e.id.startsWith('air-landed-C01-'))).toHaveLength(1);
    expect(s.life.rescued).toBe(0);
    if (command.type === 'recall') {
      s = advance(s, 1);
      expect(cargo(s).position).not.toEqual(position);
    }
  });

  it('uses occupied recovery on low battery and does not discard the passenger', () => {
    const active = boarded();
    cargo(active).battery = 8;
    let s = advance(active, 0.1);
    expect(cargo(s)).toMatchObject({ status: 'fault', airReturning: true, airRescueRecovery: true, airRescuePassenger: true });
    s = advance(s, 32.9);
    expect(cargo(s).airTime).toBe(72);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(s.life.rescued).toBe(0);
  });

  it('does not restart an occupied recovery when faults are repeated or cleared', () => {
    let s = applyCommand(boarded(), { type: 'flag', key: 'droneFault', value: true });
    s = advance(s, 5);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    expect(cargo(s).airReturnTime).toBe(5);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: false });
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(s.approvals.lift).toBe(false);
    expect(cargo(s).airRescueRecovery).toBe(true);
    s = advance(s, 28);
    expect(cargo(s).airTime).toBe(72);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
  });

  it.each([64, 68, 71.9])('does not restart the route or ground handoff when recalled at %s', time => {
    let s = advance(boarded(), time - 39);
    const position = [...cargo(s).position];
    s = applyCommand(s, { type: 'recall', id: 'C01' });
    expect(cargo(s).airReturnFrom).toBe(time);
    expect(cargo(s).airRescueRecovery).toBe(true);
    s = advance(s, 72 - time);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airTime).toBe(72);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
    s = advance(s, 1);
    expect(cargo(s).position).not.toEqual(position);
  });

  it('retains a pending redispatch until occupied recovery has fully landed', () => {
    let s = applyCommand(boarded(), { type: 'recall', id: 'C01' });
    const position = [...cargo(s).position];
    s = advance(s, 5);
    s = applyCommand(s, { type: 'dispatch', id: 'C01' });
    s = advance(s, 27.9);
    expect(cargo(s).position).toEqual(position);
    expect(cargo(s).airReturning).toBe(true);
    s = advance(s, 6);
    expect(cargo(s).airReturning).toBe(false);
    expect(cargo(s).airTime).toBe(72);
    expect(cargo(s).status).toBe('working');
    expect(cargo(s).airRescueDelivered).toBe(true);
  });

  it('reports a rescue handoff separately and still reports the eventual occupied landing', () => {
    const u = cargo(boarded());
    aircraft.beginAircraftReturn(u);
    expect(aircraft.advanceAircraft(u, 25)).toBe('rescued');
    expect(u.airReturning).toBe(true);
    expect(u.airRescueDelivered).toBe(true);
    expect(aircraft.advanceAircraft(u, 8)).toBe('landed');
    expect(u.airReturning).toBe(false);
    expect(u.airTime).toBe(72);
    expect(aircraft.cargoFlightTime(u)).toBe(72);
    expect(aircraft.advanceAircraft(u, 1)).toBeUndefined();
  });
});

describe('simulation-owned rooftop progress', () => {
  it('pauses boarding and handoff without moving or duplicating events', () => {
    for (const s of [advance(authorize(), 4), advance(boarded(), 24)]) {
      const paused = applyCommand(s, { type: 'toggle-play' });
      expect(advance(paused, 30)).toEqual(paused);
      expect(applyCommand(paused, { type: 'reset' })).toEqual(createInitialState());
    }
  });

  it('keeps boarding, ground handoff, and occupied recovery deterministic at changed speeds', () => {
    for (const s of [authorize(), applyCommand(boarded(), { type: 'recall', id: 'C01' })]) {
      const normal = advance(s, 33);
      const fast = advance(applyCommand(s, { type: 'speed', value: 4 }), 8.25);
      expect(cargo(fast)).toEqual(cargo(normal));
      expect(rescueEvents(fast)).toEqual(rescueEvents(normal));
      expect(fast.life).toEqual(normal.life);
    }
  });
});
