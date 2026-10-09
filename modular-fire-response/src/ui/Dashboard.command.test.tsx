import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { createInitialState, KIND_LABELS, STATIONS, STATUS_LABELS } from '../simulation';
import type { UnitKind } from '../types';
import type { DashboardProps } from './types';

afterEach(cleanup);

function props(): DashboardProps {
  return {
    state: createInitialState(), command: vi.fn(), selectedId: 'incident',
    select: vi.fn(), view: 'overview', setView: vi.fn(), camera: vi.fn(),
    touring: false, setTouring: vi.fn(), contextLost: false,
  };
}

describe('reference command interface', () => {
  it('shows the Chinese system name while keeping the existing overview command name', () => {
    const p = props();
    render(<Dashboard {...p} />);
    const brand = screen.getByRole('button', { name: 'FIRELINK 分布式智能消防' });
    expect(brand.textContent).toContain('分布式智能消防系统');
    expect(screen.getByText('指挥中心')).toBeTruthy();
    fireEvent.click(brand);
    expect(p.select).toHaveBeenCalledWith('incident');
    expect(p.camera).toHaveBeenCalledWith('reset');
  });

  it.each([
    ['water', 'water.webp'], ['booster', 'booster.webp'], ['boom', 'boom.webp'],
    ['ladder', 'ladder.webp'], ['fire-drone', 'fire-drone.webp'],
    ['cargo', 'cargo-drone.webp'], ['dog', 'robot.webp'],
  ] as [UnitKind, string][])('shows the supplied %s illustration inside its selectable equipment card', (kind, asset) => {
    const p = props();
    const unit = p.state.units.find(candidate => candidate.kind === kind)!;
    render(<Dashboard {...p} />);
    const card = screen.getByRole('button', {
      name: `${unit.id.toUpperCase()} ${unit.name} ${STATUS_LABELS[unit.status]}`,
    });
    const image = within(card).getByRole('img', { name: `${KIND_LABELS[kind]}参考外观` });
    expect(image.getAttribute('src')).toBe(`/reference-equipment/${asset}`);
    expect(image.getAttribute('width')).toBe('112');
    expect(image.getAttribute('height')).toBe('55');
    expect(card.querySelector(`svg[data-unit-kind="${kind}"]`)).not.toBeNull();
    fireEvent.click(card);
    expect(p.select).toHaveBeenCalledWith(unit.id);
  });

  it.each(['power', 'recon', 'tools'] as UnitKind[])('keeps an honest icon-only illustration for %s', kind => {
    const p = props();
    const unit = p.state.units.find(candidate => candidate.kind === kind)!;
    render(<Dashboard {...p} />);
    const card = screen.getByRole('button', {
      name: `${unit.id.toUpperCase()} ${unit.name} ${STATUS_LABELS[unit.status]}`,
    });
    expect(within(card).queryByRole('img')).toBeNull();
    expect(card.querySelector('.equipment-illustration svg')).not.toBeNull();
  });

  it('puts distinct reference equipment first while retaining every vehicle and its type filter', () => {
    const p = props();
    render(<Dashboard {...p} />);
    const gallery = screen.getByRole('group', { name: '联动装备列表' });
    const cards = within(gallery).getAllByRole('button');
    expect(cards).toHaveLength(p.state.units.length);
    expect(cards.slice(0, 7).map(card => card.getAttribute('aria-label')?.split(' ')[0])).toEqual([
      'W01', 'M01', 'B01', 'L01', 'F01', 'C01', 'D01',
    ]);
    fireEvent.change(screen.getByRole('combobox', { name: '装备类型' }), { target: { value: 'water' } });
    expect(within(gallery).getAllByRole('button')).toHaveLength(3);
    expect(within(gallery).getAllByRole('img', { name: '供水模块参考外观' })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: '展开装备列表' }));
    expect(screen.getByRole('button', { name: '收起装备列表' })).toBeTruthy();
    expect(within(gallery).getAllByRole('button')).toHaveLength(3);
  });

  it('derives force readiness and totals from the current fleet and updates after recall', () => {
    const p = props();
    p.state.units.find(unit => unit.id === 'W01')!.status = 'working';
    p.state.units.find(unit => unit.id === 'W02')!.status = 'deploying';
    p.state.units.find(unit => unit.id === 'W03')!.status = 'refilling';
    const { rerender } = render(<Dashboard {...p} />);
    const summary = screen.getByRole('region', { name: '支援力量' });
    expect(within(summary).getByText('车组现场 / 总量')).toBeTruthy();
    expect(within(summary).getByLabelText('供水模块现场 2 / 3')).toBeTruthy();
    expect(within(summary).getByLabelText('移动增压现场 0 / 1')).toBeTruthy();
    p.state.units.find(unit => unit.id === 'W02')!.status = 'returning';
    p.state.units.find(unit => unit.id === 'M01')!.status = 'working';
    rerender(<Dashboard {...p} />);
    expect(within(summary).getByLabelText('供水模块现场 1 / 3')).toBeTruthy();
    expect(within(summary).getByLabelText('移动增压现场 1 / 1')).toBeTruthy();
  });

  it('shows the actual buffer percentage instead of reference-image water statistics', () => {
    const p = props();
    p.state.water.buffer = 450;
    p.state.water.capacity = 1800;
    const { rerender } = render(<Dashboard {...p} />);
    const gauge = screen.getByRole('meter', { name: '缓冲储量' });
    expect(gauge.getAttribute('aria-valuenow')).toBe('25');
    expect(gauge.getAttribute('aria-valuetext')).toBe('450 / 1800 L');
    expect(screen.getByRole('progressbar', { name: '增压车缓冲水箱' }).getAttribute('value')).toBe('450');
    p.state.water.buffer = 0;
    p.state.water.capacity = 0;
    rerender(<Dashboard {...p} />);
    expect(gauge.getAttribute('aria-valuenow')).toBe('0');
    expect(gauge.textContent).not.toContain('NaN');
  });

  it('offers every actual station and the incident as selectable task-map targets', () => {
    const p = props();
    render(<Dashboard {...p} />);
    const map = screen.getByRole('region', { name: '任务区域' });
    for (const station of STATIONS) {
      const marker = within(map).getByRole('button', { name: `查看${station.name}` });
      expect(marker.getAttribute('aria-pressed')).toBe('false');
      fireEvent.click(marker);
      expect(p.select).toHaveBeenLastCalledWith(station.id);
    }
    const incident = within(map).getByRole('button', { name: '查看滨河 01 号楼火情' });
    expect(incident.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(incident);
    expect(p.select).toHaveBeenLastCalledWith('incident');
    expect(screen.getByRole('button', { name: '收起详情' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('updates map equipment positions and statuses from the simulation', () => {
    const p = props();
    const unit = p.state.units[0];
    const { rerender } = render(<Dashboard {...p} />);
    const map = screen.getByRole('region', { name: '任务区域' });
    const marker = map.querySelector(`[data-map-unit="${unit.id}"]`) as HTMLElement;
    expect(marker).not.toBeNull();
    const initialLeft = marker.style.left;
    const initialTop = marker.style.top;
    unit.position = [unit.position[0] + 12, unit.position[1], unit.position[2] + 20];
    unit.status = 'working';
    rerender(<Dashboard {...p} />);
    expect(Number.parseFloat(marker.style.left)).toBeGreaterThan(Number.parseFloat(initialLeft));
    expect(Number.parseFloat(marker.style.top)).toBeGreaterThan(Number.parseFloat(initialTop));
    expect(marker.getAttribute('data-status')).toBe('working');
    expect(map.querySelectorAll('[data-map-unit]').length).toBe(p.state.units.length);
  });
});

describe('reset viewport contract', () => {
  it.each(['FIRELINK 分布式智能消防', '恢复全景', '重新演示', '再演示一轮'])(
    'clears temporary panels on %s without changing its existing command', label => {
      const p = props();
      p.state.complete = label === '再演示一轮';
      render(<Dashboard {...p} />);
      fireEvent.click(screen.getByRole('button', { name: '展开装备列表' }));
      fireEvent.click(screen.getByRole('button', { name: /载重无人机 C01/ }));
      expect(screen.getByRole('contentinfo').classList.contains('expanded')).toBe(true);
      expect(screen.getByRole('complementary').classList.contains('mobile-open')).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: label }));

      expect(screen.getByRole('contentinfo').classList.contains('expanded')).toBe(false);
      expect(screen.getByRole('button', { name: '展开装备列表' })).toBeTruthy();
      expect(screen.getByRole('complementary').classList.contains('mobile-open')).toBe(false);
      expect(screen.getByRole('button', { name: '任务详情' }).getAttribute('aria-expanded')).toBe('false');
      if (label === 'FIRELINK 分布式智能消防' || label === '恢复全景') {
        expect(p.camera).toHaveBeenCalledExactlyOnceWith('reset');
        expect(p.command).not.toHaveBeenCalled();
        expect(p.select).toHaveBeenLastCalledWith(label === 'FIRELINK 分布式智能消防' ? 'incident' : 'C01');
      } else {
        expect(p.command).toHaveBeenCalledExactlyOnceWith({ type: 'reset' });
        expect(p.camera).not.toHaveBeenCalled();
      }
    },
  );

  it.each([true, false])('keeps panels open when only toggling playback from playing=%s', playing => {
    const p = props();
    p.state.playing = playing;
    render(<Dashboard {...p} />);
    fireEvent.click(screen.getByRole('button', { name: '展开装备列表' }));
    fireEvent.click(screen.getByRole('button', { name: /载重无人机 C01/ }));

    fireEvent.click(screen.getByRole('button', { name: playing ? '暂停演示' : '继续演示' }));

    expect(screen.getByRole('contentinfo').classList.contains('expanded')).toBe(true);
    expect(screen.getByRole('complementary').classList.contains('mobile-open')).toBe(true);
    expect(p.command).toHaveBeenCalledExactlyOnceWith({ type: 'toggle-play' });
    expect(p.camera).not.toHaveBeenCalled();
  });
});
