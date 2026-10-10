import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { advance, applyCommand, createInitialState } from '../simulation';
import { cargoFlightTime } from '../simulation/aircraft';
import type { Command, SimulationState, ViewMode } from '../types';
import type { DashboardProps } from './types';

afterEach(cleanup);

function props(state = createInitialState(), selectedId = 'incident'): DashboardProps {
  return {
    state, selectedId, command: vi.fn(), select: vi.fn(), view: 'overview',
    setView: vi.fn(), camera: vi.fn(), touring: false, setTouring: vi.fn(), contextLost: false,
  };
}

function discoveredLife() {
  let state = applyCommand(createInitialState(), { type: 'mode', value: 'command' });
  state = applyCommand(state, { type: 'dispatch', id: 'R01' });
  while (!state.life.detected && state.time < 60) state = advance(state, 0.5);
  if (!state.life.detected) throw new Error('The real reconnaissance sortie did not detect life');
  return state;
}

function eligibleState() {
  let state = applyCommand(discoveredLife(), { type: 'confirm-life' });
  state = applyCommand(state, { type: 'flag', key: 'liftConcept', value: true });
  return state;
}

function intervention() {
  return within(screen.getByRole('region', { name: '载重无人机吊人' }));
}

function authorization() {
  return intervention().getByRole('button', { name: '授权本轮吊人' }) as HTMLButtonElement;
}

function renderSurface(p: DashboardProps) {
  render(<Dashboard {...p} />);
  if (p.selectedId === 'incident') fireEvent.click(screen.getByRole('button', { name: '干预' }));
}

function renderHost(initial: SimulationState, initialSelection = 'incident') {
  const commands: Command[] = [];
  const camera = vi.fn();
  let current = initial;
  let update: (seconds: number) => void;
  function Host() {
    const [state, setState] = useState(initial);
    const [selectedId, select] = useState(initialSelection);
    const [view, setView] = useState<ViewMode>('overview');
    const [touring, setTouring] = useState(false);
    current = state;
    update = seconds => setState(previous => advance(previous, seconds));
    return <Dashboard
      state={state} selectedId={selectedId} select={select} view={view} setView={setView}
      command={command => { commands.push(command); setState(previous => applyCommand(previous, command)); }}
      camera={camera} touring={touring} setTouring={setTouring} contextLost={false}
    />;
  }
  render(<Host />);
  if (initialSelection === 'incident') fireEvent.click(screen.getByRole('button', { name: '干预' }));
  const advanceBy = (seconds: number) => act(() => update(seconds));
  return {
    commands, camera, advanceBy,
    advanceToCargoTime(time: number) {
      const cargo = () => current.units.find(unit => unit.id === 'C01')!;
      while (cargoFlightTime(cargo()) === 0 && current.time < 160 && current.playing) advanceBy(0.5);
      if (cargoFlightTime(cargo()) === 0) throw new Error('C01 has not been explicitly dispatched and launched');
      advanceBy(Math.max(0, time - cargoFlightTime(cargo())) / current.speed);
    },
  };
}

describe('cargo rescue intervention discovery and deliberate commands', () => {
  it.each(['incident', 'C01'])('exposes a single dedicated intervention in %s', selectedId => {
    const p = props(createInitialState(), selectedId);
    renderSurface(p);
    expect(intervention().getByRole('heading', { name: '载重无人机吊人' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox', { name: '载人吊运 · 高风险概念' })).toHaveLength(1);
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('等待开启载人吊运概念')).toBeTruthy();
    expect(p.command).not.toHaveBeenCalled();
  });

  it('makes opting in a flag change only, without confirming, dispatching, or authorizing', () => {
    const p = props(discoveredLife());
    renderSurface(p);
    fireEvent.click(intervention().getByRole('checkbox', { name: '载人吊运 · 高风险概念' }));
    expect(p.command).toHaveBeenCalledExactlyOnceWith({ type: 'flag', key: 'liftConcept', value: true });
    expect(p.camera).not.toHaveBeenCalled();
    expect(p.setView).not.toHaveBeenCalled();
  });

  it('allows an explicit preauthorization before C01 dispatch without unrelated effects', () => {
    const p = props(applyCommand(eligibleState(), { type: 'toggle-play' }));
    renderSurface(p);
    expect(authorization().disabled).toBe(false);
    fireEvent.click(authorization());
    expect(p.command).toHaveBeenCalledExactlyOnceWith({ type: 'request-cargo-rescue' });
    expect(screen.getByRole('button', { name: '继续演示' })).toBeTruthy();
    expect(p.select).not.toHaveBeenCalled();
    expect(p.setView).not.toHaveBeenCalled();
  });

  it.each(['定位载重无人机', '跟随载重无人机'])('provides a named %s control without simulation commands', label => {
    const p = props();
    renderSurface(p);
    const button = intervention().getByRole('button', { name: label });
    expect(button.getAttribute('title')).toBe(label);
    fireEvent.click(button);
    expect(p.select).toHaveBeenCalledWith('C01');
    if (label.startsWith('定位')) expect(p.camera).toHaveBeenCalledWith('focus');
    else {
      expect(p.setView).toHaveBeenCalledWith('follow');
      expect(p.setTouring).toHaveBeenCalledWith(false);
    }
    expect(p.command).not.toHaveBeenCalled();
  });

  it('reframes an already selected C01 on every follow request', () => {
    const p = props(createInitialState(), 'C01');
    p.view = 'follow';
    renderSurface(p);
    const button = intervention().getByRole('button', { name: '跟随载重无人机' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(p.camera).toHaveBeenCalledTimes(2);
    expect(p.camera).toHaveBeenLastCalledWith('focus');
    expect(p.setView).toHaveBeenLastCalledWith('follow');
    expect(p.command).not.toHaveBeenCalled();
  });

  it('shows a confirmation action only after a real life detection and keeps authorization disabled until then', () => {
    const host = renderHost(applyCommand(discoveredLife(), { type: 'toggle-play' }));
    fireEvent.click(intervention().getByRole('checkbox', { name: '载人吊运 · 高风险概念' }));
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('等待人工复核生命信号')).toBeTruthy();
    fireEvent.click(intervention().getByRole('button', { name: '人工复核生命信号' }));
    expect(authorization().disabled).toBe(false);
    expect(intervention().queryByRole('button', { name: '人工复核生命信号' })).toBeNull();
    expect(host.commands).toEqual([
      { type: 'flag', key: 'liftConcept', value: true }, { type: 'confirm-life' },
    ]);
    expect(screen.getByRole('button', { name: '继续演示' })).toBeTruthy();
  });

  it('does not offer confirmation before reconnaissance has found a signal', () => {
    const state = applyCommand(createInitialState(), { type: 'flag', key: 'liftConcept', value: true });
    renderSurface(props(state));
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('等待侦察发现人员线索')).toBeTruthy();
    expect(intervention().queryByRole('button', { name: '人工复核生命信号' })).toBeNull();
  });
});

describe('simulation-backed cargo rescue UI', () => {
  it('retains preauthorization across both surfaces and visibly advances through supplies, boarding, and ground handoff', () => {
    const host = renderHost(applyCommand(eligibleState(), { type: 'toggle-play' }));
    fireEvent.click(authorization());
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('本轮已授权，等待载车出动')).toBeTruthy();
    expect(intervention().getByRole('button', { name: '取消本轮授权' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '继续演示' })).toBeTruthy();
    fireEvent.click(intervention().getByRole('button', { name: '定位载重无人机' }));
    expect(screen.getByRole('heading', { name: '载重无人机 C01', level: 2 })).toBeTruthy();
    expect(intervention().getByText('本轮已授权，等待载车出动')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '出动' }));
    expect(intervention().getByText('本轮已授权，等待载车抵达')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '继续演示' }));
    host.advanceToCargoTime(10);
    expect(intervention().getByText('本轮已授权，等待屋顶物资交付')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    host.advanceToCargoTime(34);
    expect(screen.getByText('物资交付').textContent).toContain('4');
    host.advanceToCargoTime(35);
    expect(intervention().getByText('下放空篮 · 屋顶接应')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    host.advanceToCargoTime(37.5);
    expect(intervention().getByText('屋顶人员登篮')).toBeTruthy();
    host.advanceToCargoTime(39);
    expect(intervention().getByText('人员在篮 · 吊运至地面接应区')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    host.advanceToCargoTime(59.5);
    expect(intervention().getByText('地面接应 · 下放载人吊篮')).toBeTruthy();
    host.advanceToCargoTime(62.5);
    expect(intervention().getByText('地面接应 · 人员离篮')).toBeTruthy();
    host.advanceToCargoTime(64);
    expect(intervention().getByText('地面交接完成 · 回收空篮')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    expect(screen.getByText('安全转移').textContent).toContain('0');
    host.advanceToCargoTime(72);
    expect(intervention().getByText('本轮吊人完成 · 飞行器已回收')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    expect(host.commands.filter(command => command.type === 'request-cargo-rescue')).toHaveLength(1);
  });

  it('cancels pending authorization without recalling supplies or reviving authorization on recheck', () => {
    const host = renderHost(eligibleState(), 'C01');
    fireEvent.click(authorization());
    fireEvent.click(screen.getByRole('button', { name: '出动' }));
    host.advanceToCargoTime(10);
    fireEvent.click(intervention().getByRole('button', { name: '取消本轮授权' }));
    expect(host.commands.at(-1)).toEqual({ type: 'flag', key: 'liftConcept', value: false });
    expect(host.commands.some(command => command.type === 'recall')).toBe(false);
    expect((intervention().getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    fireEvent.click(intervention().getByRole('checkbox'));
    expect(authorization().disabled).toBe(false);
    expect(intervention().queryByRole('button', { name: '取消本轮授权' })).toBeNull();
    host.advanceToCargoTime(36);
    expect(intervention().getByText('物资已交付 · 屋顶待接应')).toBeTruthy();
    host.advanceToCargoTime(64);
    expect(intervention().getByText('本轮物资飞行已结束')).toBeTruthy();
    expect(screen.getByText('物资交付').textContent).toContain('4');
    expect(authorization().disabled).toBe(true);
    expect(host.commands.filter(command => command.type === 'request-cargo-rescue')).toHaveLength(1);
  });

  it('keeps the occupied recovery visible and finishes the ground handoff after cancellation', () => {
    const host = renderHost(eligibleState(), 'C01');
    fireEvent.click(authorization());
    fireEvent.click(screen.getByRole('button', { name: '出动' }));
    host.advanceToCargoTime(39);
    fireEvent.click(intervention().getByRole('button', { name: '取消接应并回收' }));
    expect(host.commands.at(-1)).toEqual({ type: 'flag', key: 'liftConcept', value: false });
    expect(intervention().getByText('载人回收中，继续完成地面交接')).toBeTruthy();
    expect(intervention().getByText('人员在篮 · 吊运至地面接应区')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
    host.advanceToCargoTime(64);
    expect(intervention().getByText('地面交接完成 · 回收空篮')).toBeTruthy();
    expect(intervention().getByText('本轮屋顶吊人已完成')).toBeTruthy();
    expect(intervention().queryByText('接应已取消，正在安全回收')).toBeNull();
    expect(screen.getByText('安全转移').textContent).toContain('0');
    host.advanceToCargoTime(67);
    expect(intervention().getByText('地面交接完成 · 返航回收')).toBeTruthy();
    expect(intervention().getByText('本轮屋顶吊人已完成')).toBeTruthy();
    host.advanceToCargoTime(72);
    expect(intervention().getByText('本轮吊人完成 · 飞行器已回收')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
  });

  it('shows withdrawal when ladder completion revokes authorization during boarding', () => {
    let state = applyCommand(eligibleState(), { type: 'dispatch', id: 'L01' });
    while (state.units.find(unit => unit.id === 'L01')!.status !== 'working' && state.time < 100) state = advance(state, 0.5);
    state = applyCommand(state, { type: 'approve', key: 'rescue' });
    state = applyCommand(state, { type: 'request-cargo-rescue' });
    let probe = applyCommand(state, { type: 'dispatch', id: 'C01' });
    while (!(probe.units.find(unit => unit.id === 'C01')!.airTime ?? 0) && probe.time < 150) probe = advance(probe, 0.5);
    const launchDelay = probe.time - state.time - (probe.units.find(unit => unit.id === 'C01')!.airTime ?? 0);
    state = advance(state, 70 - launchDelay - 38);
    state = applyCommand(state, { type: 'dispatch', id: 'C01' });
    const host = renderHost(state, 'C01');
    host.advanceToCargoTime(37.5);
    expect(intervention().getByText('屋顶人员登篮')).toBeTruthy();
    host.advanceBy(1);
    expect(intervention().getByText('取消接应 · 人员退回屋顶')).toBeTruthy();
    expect(intervention().queryByText('屋顶人员登篮')).toBeNull();
    expect(intervention().getByText('本轮云梯救援已完成，不能新增吊人任务')).toBeTruthy();
    expect(authorization().disabled).toBe(true);
  });

  it('explains a fault without offering a replacement authorization', () => {
    let state = eligibleState();
    state = applyCommand(state, { type: 'request-cargo-rescue' });
    state = applyCommand(state, { type: 'flag', key: 'droneFault', value: true });
    const host = renderHost(state);
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('无人机故障，禁止新增吊人任务')).toBeTruthy();
    expect(intervention().queryByRole('button', { name: '取消本轮授权' })).toBeNull();
    fireEvent.click(authorization());
    expect(host.commands).toHaveLength(0);
  });

  it('explains the expired pickup window without resetting or dispatching another sortie', () => {
    let state = applyCommand(eligibleState(), { type: 'dispatch', id: 'C01' });
    while ((state.units.find(unit => unit.id === 'C01')!.airTime ?? 0) < 40 && !state.complete) state = advance(state, 0.5);
    const p = props(state);
    renderSurface(p);
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('已错过本轮屋顶接应窗口')).toBeTruthy();
    fireEvent.click(authorization());
    expect(p.command).not.toHaveBeenCalled();
  });

  it('explains the completed demo and does not silently restart it', () => {
    const p = props(advance(eligibleState(), 180));
    renderSurface(p);
    expect(authorization().disabled).toBe(true);
    expect(intervention().getByText('本轮演示已结束')).toBeTruthy();
    fireEvent.click(authorization());
    expect(p.command).not.toHaveBeenCalled();
  });
});
