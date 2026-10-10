import type { UnitState } from '../types';

export const AIRCRAFT_TIMING = {
  fire: { mission: 30, launchOffsets: [0, 7, 14], route: 16 },
  cargo: { launch: 4, transit: 16, approach: 22, lower: 30, delivery: 34, retract: 44, mission: 64 },
  roofRescue: { boarding: 2, groundApproach: 59, groundLower: 62, groundDelivery: 64, groundRetract: 67, mission: 72 },
  lift: 3,
  return: 24,
} as const;

// Illustrative demo flow for one terminal nozzle, not an engineering rating.
export const FIRE_HOSE_DEMO_FLOW_LPS = 6;
export const CARGO_LIFT_LATEST_START = AIRCRAFT_TIMING.cargo.retract - AIRCRAFT_TIMING.lift - AIRCRAFT_TIMING.roofRescue.boarding;

const EPSILON = 0.00000001;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const roundTime = (time: number) => Number(time.toFixed(9));
const approach = (current: number, target: number, step: number) => Math.abs(target - current) <= step + EPSILON
  ? target : current + Math.sign(target - current) * step;

export const cargoMissionDuration = (u: UnitState) => u.airRescuePassenger || u.airRescueDelivered
  ? AIRCRAFT_TIMING.roofRescue.mission : AIRCRAFT_TIMING.cargo.mission;
export const cargoFlightTime = (u: UnitState) => u.airRescueRecovery
  ? Math.min(AIRCRAFT_TIMING.roofRescue.mission, roundTime((u.airReturnFrom ?? u.airTime ?? 0) + (u.airReturnTime ?? 0)))
  : u.airTime ?? 0;
export const isAircraftCarrier = (u: UnitState) => u.kind === 'fire-drone' || u.kind === 'cargo';
export const cargoLiftReady = (u: UnitState) => u.kind === 'cargo' && u.status === 'working' && u.battery > 8 && !u.airReturning
  && !u.airRescuePassenger && !u.airRescueDelivered && (u.airTime ?? 0) >= AIRCRAFT_TIMING.cargo.delivery
  && (u.airTime ?? 0) <= CARGO_LIFT_LATEST_START + EPSILON;
export const aircraftInFlight = (u: UnitState) => isAircraftCarrier(u) && (u.airReturning || ((u.airTime ?? 0) > 0
  && (u.kind === 'fire-drone' || (u.airTime ?? 0) < cargoMissionDuration(u))));

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
  if (u.kind === 'cargo') u.airRescueRecovery = !!(u.airRescuePassenger || u.airRescueDelivered);
  return true;
}

export function advanceAircraftLift(u: UnitState, dt: number, authorized: boolean) {
  if (u.kind !== 'cargo') return;
  const t = cargoFlightTime(u), current = clamp(u.airLiftDeployment ?? 0), timing = AIRCRAFT_TIMING.roofRescue;
  if (u.airRescuePassenger || u.airRescueDelivered) {
    u.airLiftDeployment = t < timing.groundApproach ? approach(current, 0, dt / AIRCRAFT_TIMING.lift)
      : t < timing.groundDelivery ? clamp((t - timing.groundApproach) / AIRCRAFT_TIMING.lift)
        : clamp((timing.groundRetract - t) / AIRCRAFT_TIMING.lift);
    return;
  }
  const boarding = clamp(u.airRescueBoarding ?? 0);
  const pickupWindow = t >= AIRCRAFT_TIMING.cargo.delivery && t <= AIRCRAFT_TIMING.cargo.retract + EPSILON;
  const canStart = current > 0 || boarding > 0
    || t - dt <= CARGO_LIFT_LATEST_START + EPSILON;
  const canBoard = authorized && u.status === 'working' && u.battery > 8 && !u.airReturning && pickupWindow && canStart;
  let remaining = dt;
  u.airRescueBoarding = boarding;
  if (canBoard) {
    const lowering = (1 - current) * AIRCRAFT_TIMING.lift;
    u.airLiftDeployment = approach(current, 1, remaining / AIRCRAFT_TIMING.lift);
    if (remaining <= lowering + EPSILON) return;
    remaining -= lowering;
    u.airRescueBoarding = approach(boarding, 1, remaining / timing.boarding);
    if (u.airRescueBoarding < 1) return;
    u.airRescuePassenger = true;
    remaining = Math.max(0, roundTime(remaining - (1 - boarding) * timing.boarding));
    u.airLiftDeployment = approach(1, 0, remaining / AIRCRAFT_TIMING.lift);
    return;
  }
  // A person who has not boarded must step back before the empty basket moves.
  if (boarding > 0) {
    const withdrawal = boarding * timing.boarding;
    u.airRescueBoarding = approach(boarding, 0, remaining / timing.boarding);
    u.airLiftDeployment = 1;
    if (remaining <= withdrawal + EPSILON) return;
    remaining -= withdrawal;
  }
  u.airLiftDeployment = approach(current, 0, remaining / AIRCRAFT_TIMING.lift);
}

function completeGroundHandoff(u: UnitState) {
  if (u.kind !== 'cargo' || !u.airRescuePassenger || u.airRescueDelivered || cargoFlightTime(u) < AIRCRAFT_TIMING.roofRescue.groundDelivery) return false;
  u.airRescueDelivered = true;
  return true;
}

export function advanceAircraft(u: UnitState, dt: number): 'delivered' | 'rescued' | 'landed' | undefined {
  if (!isAircraftCarrier(u)) return;
  if (u.airReturning) {
    const duration = u.airRescueRecovery ? Math.max(0, AIRCRAFT_TIMING.roofRescue.mission - (u.airReturnFrom ?? 0)) : AIRCRAFT_TIMING.return;
    u.airReturnTime = Math.min(duration, roundTime((u.airReturnTime ?? 0) + dt));
    const rescued = completeGroundHandoff(u);
    if (u.airReturnTime + EPSILON < duration) return rescued ? 'rescued' : undefined;
    // A released cargo stays delivered even when its normal return was interrupted.
    u.airTime = u.airRescueRecovery ? AIRCRAFT_TIMING.roofRescue.mission
      : u.kind === 'cargo' && (u.airReturnFrom ?? 0) >= AIRCRAFT_TIMING.cargo.delivery ? AIRCRAFT_TIMING.cargo.mission : 0;
    u.airReturning = false;
    if (u.airRescueRecovery) u.airRescueRecovery = false;
    return 'landed';
  }
  if (u.status !== 'working' || u.battery <= 8) return;
  const previous = u.airTime ?? 0;
  const duration = u.kind === 'cargo' ? cargoMissionDuration(u) : AIRCRAFT_TIMING.fire.mission;
  u.airTime = Math.min(duration, roundTime(previous + dt));
  const rescued = completeGroundHandoff(u);
  if (u.kind === 'cargo' && previous < AIRCRAFT_TIMING.cargo.delivery && u.airTime >= AIRCRAFT_TIMING.cargo.delivery) return 'delivered';
  if (u.kind === 'cargo' && previous < duration && u.airTime === duration) return 'landed';
  if (rescued) return 'rescued';
}
