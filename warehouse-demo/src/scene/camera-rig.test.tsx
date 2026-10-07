import { act, render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import type { SceneProps } from '../types';
import { CameraRig } from './Scene';

const harness = vi.hoisted(() => ({ state: null as any, controls: null as any, frame: null as any }));
vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useThree: () => harness.state, useFrame: (callback: any) => { harness.frame = callback; } }));
vi.mock('@react-three/drei', async () => {
  const React = await import('react');
  return { Html: () => null, OrbitControls: React.forwardRef((_, ref) => { React.useImperativeHandle(ref, () => harness.controls); return null; }) };
});
beforeEach(() => {
  harness.controls = { target: new Vector3(-2, 0, 1), update: vi.fn() };
  harness.state = { camera: new OrthographicCamera(), size: { width: 1280, height: 736 }, gl: { domElement: document.createElement('canvas') } };
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
it('finishes a focus requested in the same render that stops a tour', () => {
  const props: SceneProps = { selectedId: 'truck-02', onSelect: vi.fn(), elapsedRef: { current: 13 }, cameraCommand: { sequence: 0, type: 'reset' }, touring: true };
  const { rerender } = render(<CameraRig {...props} />);
  act(() => harness.frame({}, .1));
  rerender(<CameraRig {...props} touring={false} cameraCommand={{ sequence: 1, type: 'focus', entityId: 'truck-02' }} />);
  act(() => { for (let i = 0; i < 10; i++) harness.frame({}, .1); });
  expect(harness.controls.target.toArray()).toEqual([1, 1, 9]);
  expect(harness.state.camera.zoom).toBeCloseTo(Math.min(1280 / 48, 736 / 31) * 1.9);
});
it('focuses without animation when reduced motion is preferred', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<CameraRig selectedId="truck-02" onSelect={vi.fn()} elapsedRef={{ current: 13 }} cameraCommand={{ sequence: 1, type: 'focus', entityId: 'truck-02' }} />);
  expect(harness.controls.target.toArray()).toEqual([1, 1, 9]);
});
