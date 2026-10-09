import { describe, expect, it } from 'vitest';
import { advance, applyCommand, createInitialState } from './index';
import type { SimulationState, UnitState } from '../types';
import { STATIC_SOLIDS } from '../spatial/layout';

function rect(unit: UnitState, heading: number) {
  const c = Math.cos(heading), s = Math.sin(heading);
  return [[-3.49, -1.42], [3.19, -1.42], [3.19, 1.42], [-3.49, 1.42]]
    .map(([x, z]) => [unit.position[0] + x * c + z * s, unit.position[2] - x * s + z * c]);
}
function intersects(a: number[][], b: number[][]) {
  for (const polygon of [a, b]) for (let i = 0; i < 4; i++) {
    const p = polygon[i], q = polygon[(i + 1) % 4], axis = [p[1] - q[1], q[0] - p[0]];
    const pa = a.map(v => v[0] * axis[0] + v[1] * axis[1]), pb = b.map(v => v[0] * axis[0] + v[1] * axis[1]);
    if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
  }
  return true;
}

describe('collision-free vehicle movement', () => {
  const solids = STATIC_SOLIDS.map(s => {
    const [x, , z] = s.center, [w, , d] = s.size;
    return { id: s.id, points: [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]] };
  });
  for (const scenario of ['default', 'blocked', 'recall', 'redispatch', 'late-redispatch', 'early-redispatch'] as const) {
    it(`keeps vehicle footprints disjoint through ${scenario} including refill trips`, () => {
      let state: SimulationState = createInitialState();
      const headings = new Map(state.units.map(u => [u.id, -Math.PI / 2]));
      const idle = new Map<string, number>();
      for (let tick = 0; tick < 1800; tick++) {
        if (scenario === 'blocked' && tick === 50) state = applyCommand(state, { type: 'flag', key: 'blockedRoad', value: true });
        if (scenario === 'recall' && tick === 800) for (const u of state.units) state = applyCommand(state, { type: 'recall', id: u.id });
        if (scenario === 'redispatch' && tick === 400) for (const u of state.units) state = applyCommand(state, { type: 'recall', id: u.id });
        if (scenario === 'redispatch' && tick === 650) for (const u of state.units) state = applyCommand(state, { type: 'dispatch', id: u.id });
        if (scenario === 'late-redispatch' && tick === 1000) for (const u of state.units) state = applyCommand(state, { type: 'recall', id: u.id });
        if (scenario === 'late-redispatch' && tick === 1300) for (const u of state.units) state = applyCommand(state, { type: 'dispatch', id: u.id });
        if (scenario === 'early-redispatch' && tick === 200) for (const u of state.units) state = applyCommand(state, { type: 'recall', id: u.id });
        if (scenario === 'early-redispatch' && tick === 400) for (const u of state.units) state = applyCommand(state, { type: 'dispatch', id: u.id });
        const previous = state;
        state = advance(state, 0.1);
        for (const u of state.units) {
          const old = previous.units.find(v => v.id === u.id)!;
          const stationary = ['enroute', 'returning'].includes(u.status) && !u.airReturning && Math.hypot(old.position[0] - u.position[0], old.position[2] - u.position[2]) < 0.0001 && old.heading === u.heading;
          idle.set(u.id, stationary ? (idle.get(u.id) ?? 0) + 0.1 : 0);
          expect(idle.get(u.id), `${scenario} deadlock ${u.id} t=${state.time}`).toBeLessThan(25);
          const heading = (u as UnitState & { heading?: number }).heading;
          if (heading !== undefined) headings.set(u.id, heading);
          else if (['enroute', 'returning'].includes(u.status)) {
            const next = u.route.find(p => Math.hypot(p[0] - u.position[0], p[2] - u.position[2]) > 1);
            if (next) headings.set(u.id, Math.atan2(-(next[2] - u.position[2]), next[0] - u.position[0]));
          }
          const collision = solids.find(solid => intersects(rect(u, headings.get(u.id)!), solid.points));
          expect(collision?.id, `${scenario} static collision ${u.id} t=${state.time}`).toBeUndefined();
        }
        for (let i = 0; i < state.units.length; i++) for (let j = i + 1; j < state.units.length; j++) {
          const a = state.units[i], b = state.units[j];
          expect(intersects(rect(a, headings.get(a.id)!), rect(b, headings.get(b.id)!)), `${scenario} t=${state.time.toFixed(1)} ${a.id}/${b.id}`).toBe(false);
        }
      }
      if (scenario === 'default' || scenario === 'blocked') {
        expect(state.life.rescued).toBe(2);
        expect(state.water.refillCycles).toBeGreaterThan(2);
        expect(state.water.interruptedFor).toBe(0);
      }
      if (scenario === 'redispatch') expect(state.life.rescued).toBe(2);
      if (scenario === 'recall') expect(state.units.every(u => u.status === 'recalled' || u.status === 'standby')).toBe(true);
    }, 15000);
  }
});
