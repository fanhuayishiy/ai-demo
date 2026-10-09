import type { UnitState, Vec3 } from "../types";
import { STAGING, SURFACE_Y, VEHICLE_SCALE } from "../spatial/layout";
import { boosterPorts, fireCarrierPorts } from "./aircraft";
import { vehicleToWorld } from "./helpers";

export const HOSE_GROUND_Y = SURFACE_Y + 0.3;
const localPort = (unit: UnitState, point: Vec3) =>
  vehicleToWorld(
    point,
    unit.position,
    unit.heading ?? STAGING[unit.id]?.heading ?? 0,
    VEHICLE_SCALE,
  );

export function boosterOutletRoute(unit: UnitState): Vec3[] {
  const lead = localPort(unit, [0.3, 1.8, 2.8]);
  return [
    boosterPorts(unit).outlet,
    lead,
    [lead[0], HOSE_GROUND_Y, lead[2]],
    [-9, HOSE_GROUND_Y, lead[2]],
  ];
}

export function waterToBoosterRoute(
  water: UnitState,
  booster: UnitState,
  index: number,
): Vec3[] {
  const rear = localPort(water, [-4.34, 1, 0]),
    inlet = boosterPorts(booster).inlet;
  const lead = localPort(booster, [-0.8, 1.8, -2.8]),
    west = -19.4 - index * 0.35,
    north = -6 - index * 0.35;
  return [
    rear,
    [west, HOSE_GROUND_Y, rear[2]],
    [west, HOSE_GROUND_Y, north],
    [lead[0], HOSE_GROUND_Y, north],
    [lead[0], HOSE_GROUND_Y, lead[2]],
    lead,
    inlet,
  ];
}

export function fireSupplyRoute(booster: UnitState, fire: UnitState): Vec3[] {
  const inlet = fireCarrierPorts(fire).inlet,
    west = fire.position[0] - 5;
  return [
    ...boosterOutletRoute(booster),
    [-9, HOSE_GROUND_Y, 17.2],
    [west, HOSE_GROUND_Y, 17.2],
    [west, HOSE_GROUND_Y, inlet[2]],
    inlet,
  ];
}

export function boomSupplyRoute(booster: UnitState, boom: UnitState): Vec3[] {
  return [
    ...boosterOutletRoute(booster),
    [-9, HOSE_GROUND_Y, 6.8],
    [-5, HOSE_GROUND_Y, 6.8],
    localPort(boom, [0, 1, -1.925]),
  ];
}

export function dogSupplyRoute(booster: UnitState, dogs: Vec3[]): Vec3[] {
  return [
    ...boosterOutletRoute(booster),
    [-9, HOSE_GROUND_Y, 16.8],
    [10.8, HOSE_GROUND_Y, 16.8],
    ...dogs.map((p) => [p[0] + 0.55, p[1] + 0.75, p[2]] as Vec3),
  ];
}
