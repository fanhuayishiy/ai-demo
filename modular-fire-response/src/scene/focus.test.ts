import { describe, expect, it } from 'vitest';
import { createInitialState } from '../simulation';
import { STAGING } from '../spatial/layout';
import { cargoAircraftPose, fireAircraftPose } from './aircraft';
import { sceneTarget } from './focus';

describe('aircraft follow camera', () => {
  it('keeps normal focus on the carrier but follows a flying cargo aircraft', () => {
    const state = createInitialState();
    const unit = state.units.find(u => u.id === 'C01')!;
    unit.position = [...STAGING.C01.position]; unit.status = 'working'; unit.airTime = 28;
    expect(sceneTarget(state,unit.id,false)).toEqual(unit.position);
    expect(sceneTarget(state,unit.id,true)).toEqual(cargoAircraftPose(unit).position);
    unit.airTime = 64;
    expect(sceneTarget(state,unit.id,true)).toEqual(unit.position);
  });

  it('follows the highest launched fire aircraft instead of an empty pad', () => {
    const state = createInitialState();
    const unit = state.units.find(u => u.id === 'F01')!;
    unit.position = [...STAGING.F01.position]; unit.status = 'working'; unit.airTime = 12;
    const poses = [0,1,2].map(i => fireAircraftPose(unit,i)).filter(p => p.airborne).sort((a,b) => b.position[1]-a.position[1]);
    expect(sceneTarget(state,unit.id,true)).toEqual(poses[0].position);
    unit.airTime = 0;
    expect(sceneTarget(state,unit.id,true)).toEqual(unit.position);
  });

  it('locates the supply network at the actual booster position', () => {
    const state = createInitialState();
    const unit = state.units.find(u => u.kind === 'booster')!;
    expect(sceneTarget(state,'water-node',false)).toEqual(unit.position);
    unit.position = [...STAGING.M01.position];
    expect(sceneTarget(state,'water-node',false)).toEqual(unit.position);
  });
});
