import type { SimState, Stage, Vec3 } from './types';

export const CYCLE_DURATION = 32;
const FORK_OFFSET = 1.2;
const TRAVEL_LIFT = .55;
const labels: Record<Stage, string> = {
  approach: '前往货位', pickup: '提取货物', transport: '运输中',
  unload: '卸货入位', return: '返回待命',
};
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function advanceTime(elapsed: number, delta: number, running: boolean): number {
  return running && Number.isFinite(delta) && delta >= 0 ? elapsed + delta : elapsed;
}

/** Pure sampled loop: pause, resume and frame rate never alter the route. */
export function sampleSimulation(time: number): SimState {
  const elapsed = Number.isFinite(time) ? Math.max(0, time) : 0;
  const cycleTime = elapsed % CYCLE_DURATION;
  const t = cycleTime;
  const stage: Stage = t < 6 ? 'approach' : t < 9 ? 'pickup' : t < 19 ? 'transport' : t < 22 ? 'unload' : 'return';
  const position: Vec3 = [-16, 0, 3];
  let rotation = 0;
  let lift = 0;
  if (t < 6) {
    position[2] = 3 + 3 * smooth(t / 6);
  } else if (t < 9) {
    position[2] = 6;
    lift = TRAVEL_LIFT * smooth((t - 6) / 3);
  } else if (t < 19) {
    lift = TRAVEL_LIFT;
    // Reverse into the clear z=3 aisle before turning across parked trucks.
    position[2] = 6 - 3 * smooth((t - 9) / 2);
    rotation = Math.PI / 2 * smooth((t - 11) / 1);
    position[0] = -16 + 12 * smooth((t - 12) / 6);
    rotation += Math.PI / 2 * smooth((t - 18) / 1);
  } else if (t < 22) {
    position[0] = -4;
    rotation = Math.PI;
    lift = TRAVEL_LIFT * (1 - smooth((t - 19) / 3));
  } else {
    position[0] = -4 - 12 * smooth((t - 23) / 7);
    rotation = Math.PI + Math.PI / 2 * smooth(t - 22)
      + Math.PI / 2 * smooth((t - 30) / 2);
  }
  const onForks = t >= 6 && t < 22;
  const delivered = t >= 22;
  const cargoPosition: Vec3 = onForks
    ? [position[0] + Math.sin(rotation) * FORK_OFFSET, lift, position[2] + Math.cos(rotation) * FORK_OFFSET]
    : delivered ? [-4, 0, 1.8] : [-16, 0, 7.2];
  return {
    elapsed, cycleTime, progress: t / CYCLE_DURATION, stage, stageLabel: labels[stage],
    forklift: { position, rotation, lift },
    cargo: { position: cargoPosition, onForks, delivered },
  };
}
