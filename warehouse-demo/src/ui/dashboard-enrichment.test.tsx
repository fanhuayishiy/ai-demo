import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { sampleSimulation } from '../simulation';
import type { DashboardProps } from '../types';

type EnrichedProps = DashboardProps & { onFocusSelected?: () => void; onToggleTour?: () => void; touring?: boolean };
function setup(overrides: Partial<EnrichedProps> = {}) {
  const props: EnrichedProps = { selectedId: 'warehouse-01', onSelect: vi.fn(), sim: sampleSimulation(12.1), running: true, onToggle: vi.fn(), onResetView: vi.fn(), onZoomIn: vi.fn(), onZoomOut: vi.fn(), ...overrides };
  return { ...render(<Dashboard {...props} />), props };
}

describe('shared-state dashboard details', () => {
  it.each(['聚焦选中对象', '开始镜头巡游'])('closes details for %s while sending the action and allowing same-object reopen', action => {
    const onFocusSelected = vi.fn(), onToggleTour = vi.fn();
    const { props, rerender } = setup({ selectedId: 'forklift-01', selectionSequence: 0, onFocusSelected, onToggleTour });
    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));
    expect(screen.getByRole('region', { name: '对象详情' })).toHaveClass('is-open');
    fireEvent.click(screen.getByRole('button', { name: action }));
    expect(screen.getByRole('button', { name: '展开详情' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('region', { name: '对象详情' })).not.toHaveClass('is-open');
    expect(action === '聚焦选中对象' ? onFocusSelected : onToggleTour).toHaveBeenCalledOnce();
    rerender(<Dashboard {...props} selectionSequence={1} />);
    expect(screen.getByRole('button', { name: '收起详情' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: '对象详情' })).toHaveClass('is-open');
  });
  it.each([false, true])('preserves the current details state (%s) when stopping a tour', open => {
    const onToggleTour = vi.fn();
    setup({ touring: true, onToggleTour });
    if (open) fireEvent.click(screen.getByRole('button', { name: '展开详情' }));
    fireEvent.click(screen.getByRole('button', { name: '停止镜头巡游' }));
    expect(screen.getByRole('button', { name: open ? '收起详情' : '展开详情' })).toHaveAttribute('aria-expanded', String(open));
    expect(onToggleTour).toHaveBeenCalledOnce();
  });
  it.each(['', '   '])('does not select hidden results for an empty search %j', query => {
    const { props } = setup();
    const input = screen.getByRole('combobox', { name: '搜索设备、车辆或货物' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: query } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).not.toHaveBeenCalled();
  });
  it.each(['', '   '])('does not reference an absent result for an empty search %j', query => {
    setup();
    const input = screen.getByRole('combobox', { name: '搜索设备、车辆或货物' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: query } });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });
  it('shows existing stock quantities without breaking filtering or selection', () => {
    const { props } = setup();
    const detail = within(screen.getByRole('region', { name: '对象详情' }));
    expect(detail.getByRole('button', { name: /工业安全帽.*96 件/ })).toBeInTheDocument();
    expect(detail.getByRole('button', { name: /塑料周转箱.*48 件/ })).toBeInTheDocument();
    fireEvent.change(detail.getByRole('combobox', { name: '库存筛选' }), { target: { value: 'low' } });
    expect(detail.queryByRole('button', { name: /工业安全帽/ })).not.toBeInTheDocument();
    fireEvent.click(detail.getByRole('button', { name: /包装胶带.*12 箱/ }));
    expect(props.onSelect).toHaveBeenCalledWith('pallet-03');
  });
  it('derives the clearly labelled demo countdown from the sampled 32-second cycle', () => {
    const { props, rerender } = setup();
    expect(screen.getByText('演示剩余 20 秒')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '运输任务' })).getByText('WH-01 → 02 号月台')).toBeInTheDocument();
    rerender(<Dashboard {...props} sim={sampleSimulation(31.1)} />);
    expect(screen.getByText('演示剩余 1 秒')).toBeInTheDocument();
    rerender(<Dashboard {...props} sim={sampleSimulation(32)} />);
    expect(screen.getByText('演示剩余 32 秒')).toBeInTheDocument();
  });
  it('does not advance countdown or dock progress while the shared state is paused', () => {
    vi.useFakeTimers();
    try {
      setup({ running: false });
      expect(screen.getByRole('progressbar', { name: '02 号月台演示进度' })).toHaveAttribute('aria-valuenow', '38');
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByText('演示剩余 20 秒')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: '02 号月台演示进度' })).toHaveAttribute('aria-valuenow', '38');
    } finally { vi.useRealTimers(); }
  });
  it('updates only the linked dock progress from the same simulation state', () => {
    const { props, rerender } = setup();
    expect(screen.getByRole('progressbar', { name: '02 号月台演示进度' })).toHaveAttribute('aria-valuenow', '38');
    rerender(<Dashboard {...props} sim={sampleSimulation(24)} />);
    expect(screen.getByRole('progressbar', { name: '02 号月台演示进度' })).toHaveAttribute('aria-valuenow', '75');
    fireEvent.click(screen.getByRole('tab', { name: /车辆/ }));
    expect(screen.queryByRole('progressbar', { name: '02 号月台演示进度' })).not.toBeInTheDocument();
  });
  it('starts the camera tour only after explicit click and exposes focus and stop controls', () => {
    const onFocusSelected = vi.fn(), onToggleTour = vi.fn();
    const { props, rerender } = setup({ onFocusSelected, onToggleTour });
    expect(onToggleTour).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '开始镜头巡游' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: '聚焦选中对象' }));
    expect(onFocusSelected).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '开始镜头巡游' }));
    expect(onToggleTour).toHaveBeenCalledOnce();
    rerender(<Dashboard {...props} touring />);
    expect(screen.getByRole('button', { name: '停止镜头巡游' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '停止镜头巡游' }));
    expect(onToggleTour).toHaveBeenCalledTimes(2);
  });
  it('disables unavailable optional camera actions', () => {
    setup();
    expect(screen.getByRole('button', { name: '聚焦选中对象' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '开始镜头巡游' })).toBeDisabled();
  });
});
