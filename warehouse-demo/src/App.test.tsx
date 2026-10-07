import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SceneProps } from './types';
import { App } from './App.jsx';

// Only the GPU boundary is substituted: dashboard, catalog and clock are real.
const scene = vi.hoisted(() => ({ props: null as SceneProps | null, fail: false }));
vi.mock('./scene/Scene', () => ({ Scene: (props: SceneProps) => {
  scene.props = props;
  if (scene.fail) throw new Error('WebGL unavailable');
  return null;
} }));
let frame: FrameRequestCallback;
beforeEach(() => {
  scene.props = null; scene.fail = false;
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { frame = callback; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function mount() { await act(async () => { render(<App />); }); }
function tick(time: number) { act(() => frame(time)); }

it('selects real dashboard objects and shares selection with the scene', async () => {
  await mount();
  const search = screen.getByRole('combobox', { name: '搜索设备、车辆或货物' });
  fireEvent.change(search, { target: { value: 'forklift-01' } });
  fireEvent.keyDown(search, { key: 'Enter' });
  expect(scene.props?.selectedId).toBe('forklift-01');
  expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('华东智慧仓');
  act(() => scene.props?.onSelect('warehouse-01'));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('华东智慧仓');
});

it('pauses the shared clock immediately and resumes without a time jump', async () => {
  await mount(); tick(0); tick(1000);
  expect(scene.props?.elapsedRef.current).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: '暂停模拟' }));
  const progress = screen.getByRole('progressbar', { name: '运输任务进度' }).getAttribute('aria-valuenow');
  tick(10000);
  expect(scene.props?.elapsedRef.current).toBe(1);
  expect(screen.getByRole('progressbar', { name: '运输任务进度' })).toHaveAttribute('aria-valuenow', progress);
  fireEvent.click(screen.getByRole('button', { name: '继续模拟' }));
  tick(20000); tick(21000);
  expect(scene.props?.elapsedRef.current).toBe(2);
});

it('reopens closed details when selecting the same scene object without resetting dashboard state', async () => {
  await mount();
  act(() => scene.props?.onSelect('forklift-01'));
  fireEvent.click(screen.getByRole('tab', { name: /车辆/ }));
  const search = screen.getByRole('combobox', { name: '搜索设备、车辆或货物' });
  fireEvent.change(search, { target: { value: 'TRK' } });
  fireEvent.click(screen.getByRole('button', { name: '关闭对象详情' }));
  expect(screen.getByRole('button', { name: '展开详情' })).toHaveAttribute('aria-expanded', 'false');
  act(() => scene.props?.onSelect('forklift-01'));
  expect(screen.getByRole('button', { name: '收起详情' })).toHaveAttribute('aria-expanded', 'true');
  expect(search).toHaveValue('TRK');
  expect(screen.getByRole('tab', { name: /车辆/ })).toHaveAttribute('aria-selected', 'true');
});

it('sends repeatable camera commands without resetting simulation time', async () => {
  await mount(); tick(0); tick(1000);
  fireEvent.click(screen.getByRole('button', { name: '重置视角' }));
  expect(scene.props?.cameraCommand).toEqual({ type: 'reset', sequence: 1 });
  fireEvent.click(screen.getByRole('button', { name: '放大场景' }));
  expect(scene.props?.cameraCommand).toEqual({ type: 'zoomIn', sequence: 2 });
  expect(scene.props?.elapsedRef.current).toBe(1);
});

it('starts paused for reduced motion but permits explicit playback', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  await mount();
  fireEvent.click(screen.getByRole('button', { name: '继续模拟' }));
  expect(screen.getByRole('button', { name: '暂停模拟' })).toBeInTheDocument();
});

it('drops background time when the page becomes visible again', async () => {
  await mount(); tick(0); tick(1000);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  fireEvent(document, new Event('visibilitychange')); tick(10000);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  fireEvent(document, new Event('visibilitychange')); tick(20000); tick(21000);
  expect(scene.props?.elapsedRef.current).toBe(2);
});

it('keeps the dashboard usable when rendering the 3D scene fails', async () => {
  scene.fail = true;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await mount();
  expect(screen.getByRole('alert')).toHaveTextContent('3D 场景暂不可用');
  fireEvent.click(screen.getByRole('button', { name: '暂停模拟' }));
  expect(screen.getByRole('button', { name: '继续模拟' })).toBeInTheDocument();
});

it('normalizes unknown scene IDs consistently to the warehouse', async () => {
  await mount();
  act(() => scene.props?.onSelect('missing'));
  expect(scene.props?.selectedId).toBe('warehouse-01');
});

it('starts a tour only on request and stops it on selection or camera interaction', async () => {
  await mount();
  expect(scene.props?.touring).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '开始镜头巡游' }));
  expect(scene.props?.touring).toBe(true);
  act(() => scene.props?.onCameraInteract?.());
  expect(scene.props?.touring).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '开始镜头巡游' }));
  act(() => scene.props?.onSelect('truck-02'));
  expect(scene.props?.touring).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '聚焦选中对象' }));
  expect(scene.props?.cameraCommand).toMatchObject({ type: 'focus', entityId: 'truck-02' });
});

it('shows recoverable context loss without disabling the dashboard', async () => {
  await mount();
  act(() => scene.props?.onContextStatus?.(true));
  expect(screen.getByRole('alert')).toHaveTextContent('图形连接暂时中断');
  fireEvent.click(screen.getByRole('button', { name: '暂停模拟' }));
  expect(screen.getByRole('button', { name: '继续模拟' })).toBeInTheDocument();
  act(() => scene.props?.onContextStatus?.(false));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
