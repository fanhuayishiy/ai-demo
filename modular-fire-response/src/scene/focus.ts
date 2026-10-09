import type { SimulationState, Vec3 } from '../types';
import { PUMP_POSITION, STATION_LAYOUT } from '../spatial/layout';
import { cargoAircraftPose, fireAircraftPose } from './aircraft';

export function sceneTarget(state: SimulationState, selectedId: string, following: boolean): Vec3 {
  const unit = state.units.find(u => u.id === selectedId);
  if (unit && following) {
    if (unit.kind === 'cargo') {
      const aircraft = cargoAircraftPose(unit);
      if (aircraft.airborne) return aircraft.position;
    }
    if (unit.kind === 'fire-drone') {
      const aircraft = [0,1,2].map(index => fireAircraftPose(unit,index))
        .filter(pose => pose.airborne).sort((a,b) => b.position[1]-a.position[1])[0];
      if (aircraft) return aircraft.position;
    }
  }
  if (unit) return unit.position;
  return STATION_LAYOUT.find(station => station.id === selectedId)?.position
    ?? (selectedId === 'water-node' ? state.units.find(u => u.kind === 'booster')?.position ?? PUMP_POSITION : [7,12,0]);
}
