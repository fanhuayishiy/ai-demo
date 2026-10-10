// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CREW_POSTS, CREW_WALK_SPEED, crewForCarrier, crewJourney, crewTravelSeconds, onboardCrew } from './crew';
import { createInitialState } from '../simulation';
import { firefighterPoses } from '../scene/firefighterPoses';

describe('shared firefighter transport manifest', () => {
  it('assigns seven distinct identities to four existing cabs without overbooking', () => {
    expect(CREW_POSTS).toHaveLength(7);
    expect(new Set(CREW_POSTS.map(post => post.id)).size).toBe(7);
    expect(['P01', 'M01', 'D01', 'C01'].map(id => crewForCarrier(id).length)).toEqual([2, 1, 1, 3]);
    for (const id of ['P01', 'M01', 'D01', 'C01']) {
      const seats = crewForCarrier(id).map(post => post.seat);
      expect(new Set(seats).size).toBe(seats.length);
      expect(seats.every(seat => seat >= 0 && seat < 3)).toBe(true);
    }
    expect(CREW_POSTS.find(post => post.id === 'rescue-observer')).toMatchObject({ carrierId: 'P01', unitId: 'C01' });
    expect(CREW_POSTS.find(post => post.id === 'commander')).toMatchObject({ carrierId: 'P01', unitId: 'incident' });
  });

  it('ends every journey exactly at the existing post, with no residual walking', () => {
    for (const post of CREW_POSTS) {
      expect(crewJourney(post, { crewProgress: 0 }).progress).toBe(0);
      const end = crewJourney(post, { crewProgress: 1 });
      expect(end.progress, post.id).toBe(1);
      expect(end.position, post.id).toEqual(post.position);
      expect(post.path.at(-1)).toEqual(post.position);
    }
  });

  it('shows each person exactly once, either seated or on the ground, throughout both directions', () => {
    const state = createInitialState();
    for (const returning of [false, true]) for (let tick = 0; tick <= 100; tick++) {
      for (const unit of state.units) { unit.crewProgress = tick / 100; unit.crewReturning = returning; }
      const ids = [...state.units.flatMap(unit => onboardCrew(unit).map(post => post.id)), ...firefighterPoses(state).map(pose => pose.id)];
      expect(ids).toHaveLength(7);
      expect(new Set(ids).size).toBe(7);
    }
  });

  it('keeps the second and third passengers seated until their own departure slots', () => {
    const cargo = createInitialState().units.find(unit => unit.id === 'C01')!;
    const expected = ['cargo-operator', 'ground-receiver', 'ground-support'];
    expect(onboardCrew(cargo).map(post => post.id)).toEqual(expected);
    cargo.crewProgress = 1 / crewTravelSeconds(cargo.id);
    expect(onboardCrew(cargo).map(post => post.id)).toEqual(expected.slice(1));
    cargo.crewProgress = 3 / crewTravelSeconds(cargo.id);
    expect(onboardCrew(cargo).map(post => post.id)).toEqual(expected.slice(2));
    cargo.crewProgress = 1;
    expect(onboardCrew(cargo)).toEqual([]);
  });

  it('reverses direction at the exact same position and moves no faster than walking speed', () => {
    for (const post of CREW_POSTS) {
      const duration = crewTravelSeconds(post.carrierId);
      for (let time = .1; time < duration; time += .1) {
        const start = crewJourney(post, { crewProgress: time / duration });
        const reverse = crewJourney(post, { crewProgress: time / duration, crewReturning: true });
        expect(reverse.position).toEqual(start.position);
        expect(reverse.heading - start.heading).toBeCloseTo(Math.PI, 10);
        const next = crewJourney(post, { crewProgress: Math.min(1, (time + .1) / duration) });
        expect(Math.hypot(...next.position.map((value, axis) => value - start.position[axis]))).toBeLessThanOrEqual(CREW_WALK_SPEED * .1 + 1e-8);
      }
    }
  });

  it('clamps missing or invalid clocks to finite onboard poses without mutating the manifest', () => {
    const original = structuredClone(CREW_POSTS);
    for (const post of CREW_POSTS) for (const value of [undefined, NaN, Infinity, -5]) {
      const pose = crewJourney(post, { crewProgress: value });
      expect(pose.progress).toBe(0);
      expect(pose.position.every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(pose.heading)).toBe(true);
    }
    expect(CREW_POSTS).toEqual(original);
    expect(crewTravelSeconds('W01')).toBe(0);
  });
});
