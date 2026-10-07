import { describe, expect, it } from 'vitest';
import { focusPose, tourPose, TOUR_DURATION } from './camera';
import { sampleSimulation } from '../simulation';

describe('camera poses', () => {
  it('focuses dynamic entities at the current simulation position', () => {
    const sim = sampleSimulation(13);
    expect(focusPose('forklift-01', sim).target).toEqual([sim.forklift.position[0], 1, sim.forklift.position[2]]);
    expect(focusPose('pallet-01', sim).target[0]).toBe(sim.cargo.position[0]);
    expect(focusPose('truck-02', sim).target).toEqual([1, 1, 9]);
  });
  it('falls back to overview for warehouse and unknown IDs', () => {
    const sim = sampleSimulation(0);
    expect(focusPose('missing', sim)).toEqual(focusPose('warehouse-01', sim));
    expect(focusPose('warehouse-01', sim).zoomFactor).toBe(1);
  });
  it('tours continuously and repeats without a snap', () => {
    expect(tourPose(TOUR_DURATION)).toEqual(tourPose(0));
    for (const boundary of [7, 14, 21, 28]) {
      const a = tourPose(boundary - .0001), b = tourPose(boundary + .0001);
      a.position.forEach((v, i) => expect(Math.abs(v - b.position[i])).toBeLessThan(.01));
      a.target.forEach((v, i) => expect(Math.abs(v - b.target[i])).toBeLessThan(.01));
    }
    expect(tourPose(7)).not.toEqual(tourPose(0));
  });
});
