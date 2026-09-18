import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, simulate, storageCapacity } from '../src/simulation.ts';

test('all carriers and the whole site conserve energy over weather and load extremes', () => {
  for (const irradiance of [0, 400, 1100]) {
    for (const wind of [0, 7, 12, 25, 30]) {
      for (const temperature of [-10, 26, 45]) {
        for (const load of [0, 50, 160]) {
          for (const storage of [0, 0.001, 2400, storageCapacity]) {
            const result = simulate({ irradiance, wind, temperature, electric: load, heat: load, cold: 160 - load }, storage, 30);
            for (const [carrier, residual] of Object.entries(result.residuals)) {
              assert.ok(Math.abs(residual) < 1e-6, `${carrier} balance ${residual}`);
            }
            assert.ok(result.nextStored >= 0 && result.nextStored <= storageCapacity);
            for (const [key, value] of Object.entries(result)) {
              if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
            }
          }
        }
      }
    }
  }
});

test('electrolysis stops at full storage and fuel cell stops at empty storage', () => {
  const full = simulate({ ...defaults, irradiance: 1100, wind: 12, electric: 0 }, storageCapacity);
  const empty = simulate({ ...defaults, irradiance: 0, wind: 0 }, 0);
  assert.equal(full.electrolyzer, 0);
  assert.equal(empty.fuelElectric, 0);
});

test('wind turbine cuts out at 25 m/s and refrigeration accounts for heat rejection', () => {
  assert.equal(simulate({ ...defaults, wind: 25 }, 2000).wind, 0);
  const result = simulate(defaults, 2000);
  assert.ok(result.rejection >= result.coldLoad + result.chillerElectric);
  assert.ok(result.heatPumpHeat >= result.heatPumpElectric);
});

test('long-running dispatch cannot create or deplete hydrogen beyond the tank limits', () => {
  let storage = 2400;
  for (let i = 0; i < 1440; i++) {
    const result = simulate({ ...defaults, irradiance: i < 720 ? 1100 : 0, wind: 0 }, storage, 60);
    assert.ok(Math.abs(result.residuals.hydrogen) < 1e-6);
    storage = result.nextStored;
  }
});

test('recalculating a paused simulation never changes the inventory', () => {
  const result = simulate({ ...defaults, irradiance: 1100 }, 2400, 0);
  assert.equal(result.nextStored, 2400);
  assert.ok(Math.abs(result.residuals.total) < 1e-6);
});
