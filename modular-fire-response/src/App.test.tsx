import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SceneProps, SimulationState } from './types';
import App from './App';

vi.mock('./scene/FireScene', () => ({
  default: ({ state, selectedId, view, touring, cameraCommand }: SceneProps) => <>
    <output data-testid="scene-state">{JSON.stringify(state)}</output>
    <output data-testid="camera-state">{JSON.stringify({ selectedId, view, touring, cameraCommand })}</output>
  </>,
}));

function media(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}
function sceneState(): SimulationState {
  return JSON.parse(screen.getByTestId('scene-state').textContent!);
}
function cameraState(): Pick<SceneProps, 'selectedId' | 'view' | 'touring' | 'cameraCommand'> {
  return JSON.parse(screen.getByTestId('camera-state').textContent!);
}
async function mount() {
  render(<App />);
  await screen.findByTestId('scene-state');
}

beforeEach(() => {
  media(false);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('application playback and reset policy', () => {
  it.each(['恢复全景', '重新演示'])('synchronizes the overview navigation and stops touring through %s', async button => {
    await mount();
    fireEvent.click(screen.getByRole('tab', { name: '现场跟随' }));
    fireEvent.click(screen.getByRole('button', { name: '环绕巡览' }));
    expect(cameraState().view).toBe('follow');
    expect(cameraState().touring).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(cameraState().view).toBe('overview');
    expect(cameraState().touring).toBe(false);
    expect(cameraState().cameraCommand).toEqual({ type: 'reset', sequence: 1 });
    expect(screen.getByRole('tab', { name: '任务沙盘' }).getAttribute('aria-selected')).toBe('true');
  });

  it('does not reset mission state when only restoring the camera overview', async () => {
    await mount();
    fireEvent.change(screen.getByRole('combobox', { name: '演示模式' }), { target: { value: 'command' } });
    fireEvent.click(screen.getByRole('button', { name: '授权车组出动' }));
    const state = sceneState();
    fireEvent.click(screen.getByRole('button', { name: '恢复全景' }));
    expect(sceneState()).toEqual(state);
  });

  it('starts paused when reduced motion is preferred', async () => {
    media(true);
    await mount();
    expect(sceneState().playing).toBe(false);
    expect(sceneState().time).toBe(0);
    expect(screen.getByRole('button', { name: '继续演示' })).toBeTruthy();
  });

  it('resets to paused under reduced motion even after an explicit play', async () => {
    media(true);
    await mount();
    fireEvent.click(screen.getByRole('button', { name: '继续演示' }));
    expect(sceneState().playing).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '重新演示' }));
    expect(sceneState().playing).toBe(false);
    expect(sceneState().time).toBe(0);
  });

  it('starts the normal guided demonstration playing', async () => {
    await mount();
    expect(sceneState().playing).toBe(true);
    expect(sceneState().mode).toBe('guided');
    expect(screen.getByRole('button', { name: '暂停演示' })).toBeTruthy();
  });

  it('preserves command mode while resetting all dispatch authorization', async () => {
    await mount();
    fireEvent.change(screen.getByRole('combobox', { name: '演示模式' }), { target: { value: 'command' } });
    fireEvent.click(screen.getByRole('button', { name: '授权车组出动' }));
    expect(sceneState().approvals.dispatch).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '重新演示' }));
    const reset = sceneState();
    expect(reset.mode).toBe('command');
    expect(reset.approvals).toEqual({ dispatch: false, connection: false, rescue: false, lift: false });
    expect(reset.units.every(unit => unit.status === 'standby')).toBe(true);
    expect(reset.time).toBe(0);
    expect(screen.getByRole('button', { name: '授权车组出动' })).toBeTruthy();
  });
});
