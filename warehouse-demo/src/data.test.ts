import { describe, expect, it } from 'vitest';
import { entities, getEntity } from './data';

describe('scene entity catalog', () => {
  it('contains every selectable scene entity exactly once', () => {
    expect(entities.map(entity => entity.id).sort()).toEqual([
      'forklift-01', 'pallet-01', 'pallet-02', 'pallet-03',
      'truck-01', 'truck-02', 'truck-03', 'warehouse-01',
    ]);
  });
  it('provides Chinese descriptions and populated simulated fields', () => {
    for (const entity of entities) {
      expect(entity.name).toMatch(/[\u4e00-\u9fff]/);
      expect(entity.subtitle).toMatch(/[\u4e00-\u9fff]/);
      expect(entity.fields.length).toBeGreaterThan(2);
      expect(entity.fields.every(field => field.label && field.value)).toBe(true);
      expect(entity.position.every(Number.isFinite)).toBe(true);
    }
  });
  it('looks up known IDs and safely falls back to the warehouse', () => {
    expect(getEntity('forklift-01').kind).toBe('forklift');
    expect(getEntity('unknown').id).toBe('warehouse-01');
  });
  it('reserves dock 02 for the simulated delivery and leaves dock 01 waiting', () => {
    expect(getEntity('truck-01').status).toBe('等待中');
    expect(getEntity('truck-02').status).toBe('等待货物');
  });
});
