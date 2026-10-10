import { describe, expect, it } from 'vitest';
import type { Command, SimulationState, UnitStatus } from '../types';
import { advance, applyCommand, createInitialState } from './index';

const request: Command = { type: 'request-cargo-rescue' };
const cargo = (s: SimulationState) => s.units.find(u => u.id === 'C01')!;
const pending = (s: SimulationState) => cargo(s).airRescueRequested ?? false;

function mission(airTime = 0, status: UnitStatus = 'working') {
  const s = createInitialState();
  s.mode = 'command'; s.time = 60;
  s.life = { detected: true, confirmed: true, rescued: 0, source: '屋顶人员复核' };
  s.flags.liftConcept = true;
  s.metrics.delivered = airTime >= 34 ? 4 : 0;
  Object.assign(cargo(s), { airTime, status });
  return s;
}

describe('explicit cargo rescue intervention', () => {
  it('queues a deliberate request without active approval or unrelated commands', () => {
    const original = mission();
    original.playing = false;
    const s = applyCommand(original, request);
    expect(pending(s)).toBe(true);
    expect(s.approvals).toEqual({ dispatch: false, connection: false, rescue: false, lift: false });
    expect(s.time).toBe(60);
    expect(s.playing).toBe(false);
    expect(s.mode).toBe('command');
    expect(s.flags).toEqual(original.flags);
    expect(cargo(s).position).toEqual(cargo(original).position);
    expect(pending(original)).toBe(false);
    expect(s.events.at(-1)?.text).toContain('本轮');
  });

  it.each(['standby', 'enroute', 'deploying', 'recalled'] as const)(
    'accepts preauthorization while the carrier is %s without dispatching it', status => {
      const s = applyCommand(mission(0, status), request);
      expect(pending(s)).toBe(true);
      expect(cargo(s).status).toBe(status);
      expect(s.approvals.lift).toBe(false);
      expect(s.approvals.dispatch).toBe(false);
    },
  );

  it('keeps the request through standby and does not confuse it with active lift approval', () => {
    let s = applyCommand(mission(0, 'standby'), request);
    s = advance(s, 1);
    expect(pending(s)).toBe(true);
    expect(cargo(s).airTime).toBe(0);
    expect(cargo(s).status).toBe('standby');
    expect(s.approvals.lift).toBe(false);
  });

  it('waits for the actual roof delivery, then lowers and boards using the established clock', () => {
    let s = advance(applyCommand(mission(), request), 33.9);
    expect(pending(s)).toBe(true);
    expect(s.metrics.delivered).toBe(0);
    expect(s.approvals.lift).toBe(false);
    expect(cargo(s).airLiftDeployment ?? 0).toBe(0);
    s = advance(s, 0.1);
    expect(s.metrics.delivered).toBe(4);
    expect(cargo(s).airLiftDeployment ?? 0).toBe(0);
    s = advance(s, 0.1);
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(true);
    expect(cargo(s).airLiftDeployment).toBeGreaterThan(0);
    s = advance(s, 4.9);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airTime).toBe(39);
    expect(s.life.rescued).toBe(0);
  });

  it.each([34, 36, 39])('activates an in-window request at %s before advancing the clock', airTime => {
    let s = applyCommand(mission(airTime), request);
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(true);
    s = advance(s, 5);
    expect(cargo(s).airRescuePassenger).toBe(true);
    expect(cargo(s).airTime).toBe(airTime + 5);
  });

  it.each([39.01, 44, 64])('rejects a late request without rewinding at %s', airTime => {
    const s = applyCommand(mission(airTime), request);
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(false);
    expect(cargo(s).airTime).toBe(airTime);
    expect(s.events.at(-1)?.level).toBe('warning');
    expect(s.events.at(-1)?.text).toContain('窗口');
  });

  it.each([
    'concept off', 'no signal', 'unconfirmed', 'drone fault', 'battery', 'faulted carrier',
    'returning carrier', 'returning aircraft', 'passenger', 'delivered', 'ladder complete', 'complete', 'missing cargo',
  ])('rejects the request for %s without creating permission', reason => {
    const s = mission();
    if (reason === 'concept off') s.flags.liftConcept = false;
    if (reason === 'no signal') { s.life.detected = false; s.life.confirmed = false; }
    if (reason === 'unconfirmed') s.life.confirmed = false;
    if (reason === 'drone fault') s.flags.droneFault = true;
    if (reason === 'battery') cargo(s).battery = 8;
    if (reason === 'faulted carrier') cargo(s).status = 'fault';
    if (reason === 'returning carrier') cargo(s).status = 'returning';
    if (reason === 'returning aircraft') cargo(s).airReturning = true;
    if (reason === 'passenger') cargo(s).airRescuePassenger = true;
    if (reason === 'delivered') cargo(s).airRescueDelivered = true;
    if (reason === 'ladder complete') s.life.rescued = 2;
    if (reason === 'complete') { s.complete = true; s.playing = false; }
    if (reason === 'missing cargo') s.units = s.units.filter(u => u.kind !== 'cargo');
    const next = applyCommand(s, request);
    expect(next.units.some(u => u.airRescueRequested)).toBe(false);
    expect(next.approvals.lift).toBe(false);
    expect(next.life.confirmed).toBe(s.life.confirmed);
    expect(next.flags.liftConcept).toBe(s.flags.liftConcept);
    expect(next.events.at(-1)?.level).toBe('warning');
    expect(next.events.at(-1)?.id).toMatch(/^cargo-rescue-denied-/);
  });

  it('does not queue any request by merely turning on the concept', () => {
    const s = mission();
    s.flags.liftConcept = false;
    const next = advance(applyCommand(s, { type: 'flag', key: 'liftConcept', value: true }), 64);
    expect(pending(next)).toBe(false);
    expect(next.approvals.lift).toBe(false);
    expect(cargo(next).airRescuePassenger ?? false).toBe(false);
    expect(next.metrics.delivered).toBe(4);
  });

  it('makes repeated pending and active requests idempotent', () => {
    const once = applyCommand(mission(), request);
    const twice = applyCommand(once, request);
    expect(twice).toEqual(once);
    const active = advance(twice, 34.1);
    expect(active.approvals.lift).toBe(true);
    expect(applyCommand(active, request)).toEqual(active);
  });

  it('allows cancellation of a pending request without recalling ordinary supplies', () => {
    let s = applyCommand(mission(10), request);
    expect(pending(s)).toBe(true);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: false });
    expect(pending(s)).toBe(false);
    expect(cargo(s).airReturning ?? false).toBe(false);
    expect(cargo(s).airTime).toBe(10);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: true });
    s = advance(s, 54);
    expect(cargo(s).airTime).toBe(64);
    expect(cargo(s).airRescuePassenger ?? false).toBe(false);
    expect(s.metrics.delivered).toBe(4);
  });

  it.each(['standby', 'working'] as const)('clears pending on recall from %s', status => {
    const requested = applyCommand(mission(status === 'working' ? 10 : 0, status), request);
    expect(pending(requested)).toBe(true);
    const s = applyCommand(requested, { type: 'recall', id: 'C01' });
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(false);
  });

  it.each(['standby', 'working'] as const)('revokes pending on a drone fault while %s', status => {
    let s = applyCommand(mission(status === 'working' ? 10 : 0, status), request);
    expect(pending(s)).toBe(true);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: true });
    expect(pending(s)).toBe(false);
    s = applyCommand(s, { type: 'flag', key: 'droneFault', value: false });
    expect(pending(advance(s, 0.1))).toBe(false);
    expect(s.approvals.lift).toBe(false);
  });

  it('revokes a pending request when battery availability is lost', () => {
    let s = applyCommand(mission(10), request);
    expect(pending(s)).toBe(true);
    cargo(s).battery = 8;
    s = advance(s, 0.1);
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(false);
  });

  it('expires unexecuted intent when the demonstration ends or resets', () => {
    const s = applyCommand(mission(), request);
    expect(pending(s)).toBe(true);
    s.time = 179;
    const completed = advance(s, 1);
    expect(completed.complete).toBe(true);
    expect(pending(completed)).toBe(false);
    expect(completed.approvals.lift).toBe(false);
    const reset = applyCommand(s, { type: 'reset' });
    expect(pending(reset)).toBe(false);
    expect(reset.flags.liftConcept).toBe(false);
  });

  it('consumes pending when direct lift approval is used instead', () => {
    let s = advance(applyCommand(mission(), request), 34);
    s = applyCommand(s, { type: 'approve', key: 'lift' });
    expect(pending(s)).toBe(false);
    expect(s.approvals.lift).toBe(true);
    expect(cargo(advance(s, 5)).airRescuePassenger).toBe(true);
  });

  it('keeps cargo rescue independent from the hose-aircraft concept', () => {
    const s = mission();
    s.flags.airConcept = false;
    const next = advance(applyCommand(s, request), 64);
    expect(cargo(next).airRescueDelivered).toBe(true);
    expect(next.flags.airConcept).toBe(false);
    expect(next.life.rescued).toBe(0);
  });

  it('preserves occupied recovery after a requested pickup is canceled', () => {
    let s = advance(applyCommand(mission(), request), 39);
    expect(cargo(s).airRescuePassenger).toBe(true);
    s = applyCommand(s, { type: 'flag', key: 'liftConcept', value: false });
    expect(pending(s)).toBe(false);
    expect(cargo(s).airRescueRecovery).toBe(true);
    s = advance(s, 33);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(cargo(s).airTime).toBe(72);
    expect(cargo(s).airReturning).toBe(false);
    expect(s.life.rescued).toBe(0);
    expect(s.metrics.delivered).toBe(4);
  });

  it('works in the unmodified guided mission after personnel are confirmed', () => {
    let s = applyCommand(createInitialState(), { type: 'flag', key: 'liftConcept', value: true });
    while (!s.life.confirmed && s.time < 75) s = advance(s, 0.5);
    expect(s.life.confirmed).toBe(true);
    expect(cargo(s).airTime ?? 0).toBeLessThanOrEqual(39);
    s = applyCommand(s, request);
    expect(pending(s) || s.approvals.lift).toBe(true);
    while (!cargo(s).airRescueDelivered && !s.complete) s = advance(s, 0.5);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(s.events.filter(e => e.id === 'roof-rescue-delivered')).toHaveLength(1);
  });

  it.each([0.5, 1, 2, 4])('uses simulation time at %sx and respects pause', speed => {
    let s = applyCommand(mission(), request);
    s.speed = speed; s.playing = false;
    expect(advance(s, 100)).toBe(s);
    s.playing = true;
    s = advance(s, 64 / speed);
    expect(cargo(s).airRescueDelivered).toBe(true);
    expect(cargo(s).airTime).toBe(64);
    expect(s.life.rescued).toBe(0);
  });
});
