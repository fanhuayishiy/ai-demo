import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { createInitialState } from '../simulation';
import type { DashboardProps } from './types';

afterEach(cleanup);
function readyProps(): DashboardProps {
  const state = createInitialState();
  state.life = { detected: true, confirmed: true, rescued: 0, source: '热成像' };
  state.flags.liftConcept = true;
  state.units.find(u => u.kind === 'cargo')!.status = 'working';
  state.units.find(u => u.kind === 'cargo')!.airTime = 36;
  state.metrics.delivered = 4;
  return { state, command: vi.fn(), selectedId: 'incident', select: vi.fn(), view: 'overview', setView: vi.fn(), camera: vi.fn(), touring: false, setTouring: vi.fn(), contextLost: false };
}
function liftButton(p: DashboardProps) {
  render(<Dashboard {...p} />);
  fireEvent.click(screen.getByRole('button', { name: '干预' }));
  return screen.getByRole('button', { name: '授权本轮吊人' }) as HTMLButtonElement;
}
describe('reviewed lift authorization controls', () => {
  it('keeps the separately authorized lift independent from hose concept', () => {
    const p = readyProps();
    p.state.flags.airConcept = false;
    const button = liftButton(p);
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(p.command).toHaveBeenCalledWith({ type: 'request-cargo-rescue' });
  });
  it('allows deliberate preauthorization during takeoff without bypassing the delivery gate', () => {
    const p = readyProps();
    p.state.units.find(u => u.kind === 'cargo')!.airTime = 3;
    p.state.metrics.delivered = 0;
    const button = liftButton(p);
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(p.command).toHaveBeenCalledExactlyOnceWith({ type: 'request-cargo-rescue' });
  });
  it.each(['rescued', 'complete', 'battery', 'landed', 'returning'] as const)('disables unavailable lift for %s', reason => {
    const p = readyProps();
    if (reason === 'rescued') p.state.life.rescued = 2;
    if (reason === 'complete') p.state.complete = true;
    if (reason === 'battery') p.state.units.find(u => u.kind === 'cargo')!.battery = 8;
    if (reason === 'landed') p.state.units.find(u => u.kind === 'cargo')!.airTime = 64;
    if (reason === 'returning') p.state.units.find(u => u.kind === 'cargo')!.airReturning = true;
    expect(liftButton(p).disabled).toBe(true);
  });
});
