import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import type { DashboardProps, SimState } from '../types';

const sim: SimState = { elapsed: 12, cycleTime: 40, progress: .3, stage: 'transport', stageLabel: '运输中', forklift: { position: [0, 0, 0], rotation: 0, lift: 0 }, cargo: { position: [0, 0, 0], onForks: true, delivered: false } };
function setup(overrides: Partial<DashboardProps> = {}) {
  const props: DashboardProps = { selectedId: 'warehouse-01', onSelect: vi.fn(), sim, running: true, onToggle: vi.fn(), onResetView: vi.fn(), onZoomIn: vi.fn(), onZoomOut: vi.fn(), ...overrides };
  return { ...render(<Dashboard {...props} />), props };
}
describe('Dashboard', () => {
  it('collapses panels before they overlap and bounds short-screen details', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('node:fs');
    const dashboardCss = readFileSync('src/ui/dashboard.css', 'utf8');
    expect(dashboardCss).toContain('@media(max-width:900px)');
    expect(dashboardCss).toContain('@media(max-height:650px)');
    expect(dashboardCss).toContain('max-height:calc(100dvh - 320px)');
    expect(dashboardCss).toContain('@media(min-width:901px){.wt-detail{max-height:calc(100dvh - 310px);overflow:auto}}');
    expect(dashboardCss.match(/max-height:calc\(100dvh - 350px\)/g)).toHaveLength(2);
    expect(dashboardCss).not.toContain('max-height:calc(100dvh - 330px)');
    expect(dashboardCss).not.toContain('max-height:calc(100dvh - 328px)');
  });
  it.each([[true, false, '运输中'], [false, true, '已送达'], [false, false, '待搬运']] as const)('reflects cargo ownership %s/%s', (onForks, delivered, status) => {
    setup({ selectedId: 'pallet-01', sim: { ...sim, cargo: { ...sim.cargo, onForks, delivered } } });
    expect(within(screen.getByRole('region', { name: '对象详情' })).getByText(status)).toBeInTheDocument();
  });
  it('opens compact details when scene selection changes', () => {
    const { rerender, props } = setup();
    rerender(<Dashboard {...props} selectedId="pallet-02" />);
    expect(screen.getByRole('button', { name: '收起详情' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('lists all four physical docks including the free fourth dock', () => {
    const { props } = setup();
    const panel = within(screen.getByRole('tabpanel'));
    expect(panel.getAllByRole('button')).toHaveLength(4);
    fireEvent.click(panel.getByRole('button', { name: /04 号月台.*空闲/ }));
    expect(props.onSelect).toHaveBeenCalledWith('warehouse-01');
    expect(screen.getByText('/ 4 月台')).toBeInTheDocument();
  });
  it.each([['approach', '等待货物'], ['pickup', '取货中'], ['transport', '货物在途'], ['unload', '卸货中'], ['return', '已完成']] as const)('synchronizes dock task at %s', (stage, status) => {
    setup({ sim: { ...sim, stage } });
    expect(within(screen.getByRole('tabpanel')).getByRole('button', { name: new RegExp(`02 号月台.*${status}`) })).toBeInTheDocument();
  });
  it('links the transport route and active dock to truck 02', () => {
    const { props } = setup();
    expect(screen.getByText('WH-01 → 02 号月台')).toBeInTheDocument();
    const panel = within(screen.getByRole('tabpanel'));
    expect(panel.getByRole('button', { name: /01 号月台.*等待中/ })).toBeInTheDocument();
    fireEvent.click(panel.getByRole('button', { name: /02 号月台.*货物在途/ }));
    expect(props.onSelect).toHaveBeenCalledWith('truck-02');
  });
  it('shows the linked task state in truck 02 details', () => {
    setup({ selectedId: 'truck-02' });
    expect(within(screen.getByRole('region', { name: '对象详情' })).getByText('货物在途')).toBeInTheDocument();
  });
  it('exposes the simulation control and its current state', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: '暂停模拟' }));
    expect(props.onToggle).toHaveBeenCalledOnce();
    expect(screen.getAllByText('模拟数据').length).toBeGreaterThan(0);
  });
  it('offers resume when simulation is paused', () => {
    setup({ running: false });
    expect(screen.getByRole('button', { name: '继续模拟' })).toBeInTheDocument();
  });
  it('selects the forklift from the equipment tab', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('tab', { name: /叉车/ }));
    fireEvent.click(within(screen.getByRole('tabpanel')).getByRole('button', { name: /FL-01/ }));
    expect(props.onSelect).toHaveBeenCalledWith('forklift-01');
  });
  it('searches actual entities and selects the result', () => {
    const { props } = setup();
    fireEvent.change(screen.getByRole('combobox', { name: '搜索设备、车辆或货物' }), { target: { value: 'forklift-01' } });
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option'));
    expect(props.onSelect).toHaveBeenCalledWith('forklift-01');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
  it('shows a helpful empty search state', () => {
    setup();
    fireEvent.change(screen.getByRole('combobox', { name: '搜索设备、车辆或货物' }), { target: { value: 'does-not-exist' } });
    expect(screen.getByText('未找到设备或货物，试试编号或名称')).toBeInTheDocument();
  });
  it('uses the real simulation stage in selected forklift details', () => {
    setup({ selectedId: 'forklift-01' });
    expect(within(screen.getByRole('region', { name: '对象详情' })).getByText('运输中')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '运输任务进度' })).toHaveAttribute('aria-valuenow', '30');
  });
  it('toggles the compact detail panel', () => {
    setup();
    const toggle = screen.getByRole('button', { name: '展开详情' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '收起详情' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('exposes all scene camera controls', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: '放大场景' }));
    fireEvent.click(screen.getByRole('button', { name: '缩小场景' }));
    fireEvent.click(screen.getByRole('button', { name: '重置视角' }));
    expect(props.onZoomIn).toHaveBeenCalledOnce();
    expect(props.onZoomOut).toHaveBeenCalledOnce();
    expect(props.onResetView).toHaveBeenCalledOnce();
  });
});
