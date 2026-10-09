import type { UnitState } from '../types';

export const AIRCRAFT_TIMING = {
  fire: { mission: 30, launchOffsets: [0, 7, 14], route: 16 },
  cargo: { launch: 4, transit: 16, approach: 22, lower: 30, delivery: 34, retract: 44, mission: 64 },
  lift: 3,
  return: 24,
} as const;

// Illustrative demo flow for one terminal nozzle, not an engineering rating.
export const FIRE_HOSE_DEMO_FLOW_LPS = 6;

export const isAircraftCarrier = (u: UnitState) => u.kind === 'fire-drone' || u.kind === 'cargo';
export const cargoLiftReady = (u: UnitState) => u.kind === 'cargo' && u.status === 'working' && u.battery > 8 && !u.airReturning
  && (u.airTime ?? 0) >= AIRCRAFT_TIMING.cargo.delivery && (u.airTime ?? 0) < AIRCRAFT_TIMING.cargo.retract;
export const aircraftInFlight = (u: UnitState) => isAircraftCarrier(u) && (u.airReturning || ((u.airTime ?? 0) > 0
  && (u.kind === 'fire-drone' || (u.airTime ?? 0) < AIRCRAFT_TIMING.cargo.mission)));

export function fireAircraftReadyCount(u: UnitState) {
  if (u.kind !== 'fire-drone' || u.status !== 'working' || u.battery <= 8 || u.airReturning) return 0;
  return AIRCRAFT_TIMING.fire.launchOffsets.filter(offset => (u.airTime ?? 0) >= offset + AIRCRAFT_TIMING.fire.route).length;
}

export function fireHoseChainReady(u: UnitState): boolean {
  return fireAircraftReadyCount(u) === AIRCRAFT_TIMING.fire.launchOffsets.length;
}

export function beginAircraftReturn(u: UnitState) {
  if (u.airReturning || !aircraftInFlight(u)) return false;
  u.airReturning = true; u.airReturnFrom = u.airTime ?? 0; u.airReturnTime = 0;
  return true;
}

export function advanceAircraftLift(u: UnitState, dt: number, authorized: boolean) {
  if (u.kind !== 'cargo') return;
  const target = authorized && cargoLiftReady(u) ? 1 : 0, current = u.airLiftDeployment ?? 0;
  const step = dt / AIRCRAFT_TIMING.lift;
  u.airLiftDeployment = Math.abs(target - current) <= step + 0.00000001 ? target : current + Math.sign(target - current) * step;
}

export function advanceAircraft(u: UnitState, dt: number): 'delivered' | 'landed' | undefined {
  if (!isAircraftCarrier(u)) return;
  if (u.airReturning) {
    u.airReturnTime = Math.min(AIRCRAFT_TIMING.return, Number(((u.airReturnTime ?? 0) + dt).toFixed(9)));
    if (u.airReturnTime < AIRCRAFT_TIMING.return) return;
    // A released cargo stays delivered even when its normal return was interrupted.
    u.airTime = u.kind === 'cargo' && (u.airReturnFrom ?? 0) >= AIRCRAFT_TIMING.cargo.delivery ? AIRCRAFT_TIMING.cargo.mission : 0;
    u.airReturning = false;
    return 'landed';
  }
  if (u.status !== 'working' || u.battery <= 8) return;
  const previous = u.airTime ?? 0;
  const duration = u.kind === 'cargo' ? AIRCRAFT_TIMING.cargo.mission : AIRCRAFT_TIMING.fire.mission;
  u.airTime = Math.min(duration, Number((previous + dt).toFixed(9)));
  if (u.kind === 'cargo' && previous < AIRCRAFT_TIMING.cargo.delivery && u.airTime >= AIRCRAFT_TIMING.cargo.delivery) return 'delivered';
  if (u.kind === 'cargo' && previous < duration && u.airTime === duration) return 'landed';
}
