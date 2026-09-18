export interface Controls {
  irradiance: number;
  wind: number;
  temperature: number;
  electric: number;
  heat: number;
  cold: number;
}

export const defaults: Controls = {
  irradiance: 780, wind: 7.2, temperature: 26, electric: 100, heat: 80, cold: 85,
};

export const storageCapacity = 4000;
export const hydrogenLHV = 33.33;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function simulate(c: Controls, stored: number, dtSeconds = 1) {
  const hours = Math.max(dtSeconds, 0) / 3600;
  const dispatchHours = Math.max(hours, 1 / 3600);
  const inventory = clamp(stored, 0, storageCapacity);
  const pv = 900 * clamp(c.irradiance, 0, 1100) / 1000
    * clamp(1 - 0.004 * (c.temperature - 25), 0.75, 1.2);
  const wind = c.wind < 3 || c.wind >= 25 ? 0
    : 600 * clamp((c.wind ** 3 - 27) / (12 ** 3 - 27), 0, 1);
  const electricLoad = 620 * clamp(c.electric, 0, 160) / 100;
  const heatLoad = 560 * clamp(c.heat, 0, 160) / 100;
  const coldLoad = 420 * clamp(c.cold, 0, 160) / 100;
  const chpGas = clamp(heatLoad * 1.05 + electricLoad * 0.2, 0, 1100);
  const chpElectric = chpGas * 0.36;
  const chpHeat = chpGas * 0.46;
  const chpLoss = chpGas * 0.18;
  const fuelHydrogen = Math.min(
    clamp((electricLoad - pv - wind) / 0.52, 0, 260),
    inventory / dispatchHours,
  );
  const fuelElectric = fuelHydrogen * 0.52;
  const fuelHeat = fuelHydrogen * 0.32;
  const fuelLoss = fuelHydrogen * 0.16;
  const electrolyzer = Math.min(
    clamp((pv + wind - electricLoad) * 0.9, 0, 450),
    ((storageCapacity - inventory) / dispatchHours + fuelHydrogen) / 0.68,
  );
  const producedHydrogen = electrolyzer * 0.68;
  const electrolysisLoss = electrolyzer * 0.32;
  const hydrogenDelta = producedHydrogen - fuelHydrogen;
  const nextStored = clamp(inventory + hydrogenDelta * hours, 0, storageCapacity);
  const absorptionHeat = Math.min(
    Math.max(0, chpHeat + fuelHeat - heatLoad * 0.55),
    coldLoad / 0.72,
  );
  const absorptionCold = absorptionHeat * 0.72;
  const chillerCold = coldLoad - absorptionCold;
  const chillerCOP = clamp(4.5 - (c.temperature - 20) * 0.045, 2.6, 5.5);
  const chillerElectric = chillerCold / chillerCOP;
  const directHeat = Math.min(heatLoad, chpHeat + fuelHeat - absorptionHeat);
  const rejectedCHPHeat = chpHeat + fuelHeat - absorptionHeat - directHeat;
  const heatPumpHeat = heatLoad - directHeat;
  const heatPumpCOP = clamp(3.5 + (c.temperature - 15) * 0.04, 2.1, 4.6);
  const heatPumpElectric = heatPumpHeat / heatPumpCOP;
  const ambientHeat = heatPumpHeat - heatPumpElectric;
  const generation = pv + wind + chpElectric + fuelElectric;
  const consumption = electricLoad + electrolyzer + chillerElectric + heatPumpElectric;
  const grid = consumption - generation;
  const losses = chpLoss + fuelLoss + electrolysisLoss;
  const rejection = coldLoad + absorptionHeat + chillerElectric + rejectedCHPHeat;
  const globalInput = pv + wind + chpGas + Math.max(grid, 0) + ambientHeat
    + coldLoad + Math.max(-hydrogenDelta, 0);
  const globalOutput = electricLoad + heatLoad + rejection + losses
    + Math.max(-grid, 0) + Math.max(hydrogenDelta, 0);
  const residuals = {
    electricity: generation + grid - consumption,
    heat: directHeat + heatPumpHeat - heatLoad,
    cold: absorptionCold + chillerCold - coldLoad,
    hydrogen: hours > 0 ? hydrogenDelta - (nextStored - inventory) / hours : 0,
    total: globalInput - globalOutput,
  };

  return {
    pv, wind, electricLoad, heatLoad, coldLoad, chpGas, chpElectric, chpHeat, chpLoss,
    fuelHydrogen, fuelElectric, fuelHeat, fuelLoss, electrolyzer, producedHydrogen,
    electrolysisLoss, hydrogenDelta, nextStored, absorptionHeat, absorptionCold,
    chillerCold, chillerCOP, chillerElectric, directHeat, heatPumpHeat, heatPumpCOP,
    heatPumpElectric, ambientHeat, generation, consumption, grid, losses, rejection,
    globalInput, globalOutput, residuals,
    renewableShare: generation > 0 ? (pv + wind) / generation * 100 : 0,
    hydrogenKgPerHour: producedHydrogen / hydrogenLHV,
  };
}

export type Simulation = ReturnType<typeof simulate>;
