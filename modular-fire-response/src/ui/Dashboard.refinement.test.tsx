import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { createInitialState, KIND_LABELS, PHASES, STATUS_LABELS } from '../simulation';
import type { UnitKind, UnitStatus } from '../types';
import type { DashboardProps } from './types';

afterEach(cleanup);

function props(): DashboardProps {
  return {
    state: createInitialState(), command: vi.fn(), selectedId: 'incident',
    select: vi.fn(), view: 'overview', setView: vi.fn(), camera: vi.fn(),
    touring: false, setTouring: vi.fn(), contextLost: false,
  };
}

describe('command interface visual semantics', () => {
  it('gives every equipment kind a distinct decorative icon without changing selection names', () => {
    const p = props();
    render(<Dashboard {...p} />);
    const shapes = new Map<UnitKind, string>();
    for (const unit of p.state.units) {
      const button = screen.getByRole('button', {
        name: `${unit.id.toUpperCase()} ${unit.name} ${STATUS_LABELS[unit.status]}`,
      });
      const icon = button.querySelector(`svg[data-unit-kind="${unit.kind}"]`);
      expect(icon, unit.kind).not.toBeNull();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      shapes.set(unit.kind, icon!.innerHTML);
    }
    expect(shapes.size).toBe(Object.keys(KIND_LABELS).length);
    expect(new Set(shapes.values()).size).toBe(Object.keys(KIND_LABELS).length);
  });

  it.each(Object.keys(KIND_LABELS) as UnitKind[])('reuses the %s equipment icon in its selected heading', kind => {
    const p = props();
    const unit = p.state.units.find(candidate => candidate.kind === kind)!;
    p.selectedId = unit.id;
    render(<Dashboard {...p} />);
    const heading = screen.getByRole('heading', { name: unit.name, level: 2 });
    const icon = heading.querySelector(`svg[data-unit-kind="${kind}"]`);
    expect(icon).not.toBeNull();
    const button = screen.getByRole('button', {
      name: `${unit.id.toUpperCase()} ${unit.name} ${STATUS_LABELS[unit.status]}`,
    });
    expect(icon!.innerHTML).toBe(button.querySelector(`svg[data-unit-kind="${kind}"]`)?.innerHTML);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it.each(Object.keys(STATUS_LABELS) as UnitStatus[])('retains a textual, semantic %s status in the inspector', status => {
    const p = props();
    const unit = p.state.units[0];
    unit.status = status;
    p.selectedId = unit.id;
    render(<Dashboard {...p} />);
    const indicator = screen.getByRole('status');
    expect(indicator.textContent).toBe(STATUS_LABELS[status]);
    expect(indicator.getAttribute('data-status')).toBe(status);
  });

  it('names the inspection rail and connects its mobile disclosure to the panel', () => {
    render(<Dashboard {...props()} />);
    const inspector = screen.getByRole('complementary', { name: '滨河 01 号楼' });
    const toggle = screen.getByRole('button', { name: '任务详情' });
    expect(toggle.getAttribute('aria-controls')).toBe(inspector.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '收起详情' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '关闭详情' }));
    expect(screen.getByRole('button', { name: '任务详情' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('collapses equipment details when the brand returns to overview', () => {
    const p = props();
    render(<Dashboard {...p} />);
    const toggle = screen.getByRole('button', { name: '任务详情' });
    fireEvent.click(screen.getByRole('button', { name: /载重无人机 C01/ }));
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'FIRELINK 分布式智能消防' }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('complementary').classList.contains('mobile-open')).toBe(false);
    expect(p.select).toHaveBeenLastCalledWith('incident');
    expect(p.camera).toHaveBeenCalledWith('reset');
  });

  it('gives simulation progress and the buffer meter accessible values', () => {
    const p = props();
    p.state.time = 75;
    p.state.phase = 3;
    render(<Dashboard {...p} />);
    const progress = screen.getByRole('progressbar', { name: '演示进度' });
    expect(progress.getAttribute('aria-valuenow')).toBe('75');
    expect(progress.getAttribute('aria-valuemax')).toBe('180');
    expect(progress.getAttribute('aria-valuetext')).toContain(PHASES[3]);
    expect(screen.getByRole('progressbar', { name: '增压车缓冲水箱' }).getAttribute('value')).toBe(String(p.state.water.buffer));
  });
});
