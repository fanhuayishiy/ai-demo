import { useId } from 'react';
import { ArrowDownToLine, Focus, ScanEye, ShieldCheck, Undo2, Users } from 'lucide-react';
import type { SimulationState, UnitState } from '../types';
import { AIRCRAFT_TIMING, CARGO_LIFT_LATEST_START, cargoFlightTime } from '../simulation/aircraft';
import { cargoRescueBlocker } from '../simulation/cargoRescue';
import type { DashboardProps } from './types';
import './CargoRescueIntervention.css';

type Props = Pick<DashboardProps, 'state' | 'command' | 'select' | 'camera' | 'setView' | 'setTouring'>;

function rescueStage(state: SimulationState, cargo?: UnitState) {
  if (!cargo) return '载重无人机不可用';
  const time = cargoFlightTime(cargo);
  const rescue = AIRCRAFT_TIMING.roofRescue;
  const flight = AIRCRAFT_TIMING.cargo;
  // The passenger flag stays latched after handoff to preserve the return route.
  if (cargo.airRescueDelivered) {
    if (time < rescue.groundRetract) return '地面交接完成 · 回收空篮';
    return time < rescue.mission ? '地面交接完成 · 返航回收' : '本轮吊人完成 · 飞行器已回收';
  }
  if (cargo.airRescuePassenger) {
    if (time < rescue.groundApproach) return '人员在篮 · 吊运至地面接应区';
    return time < rescue.groundLower ? '地面接应 · 下放载人吊篮' : '地面接应 · 人员离篮';
  }
  if (cargo.airReturning) {
    if ((cargo.airRescueBoarding ?? 0) > 0) return '取消接应 · 人员退回屋顶';
    return (cargo.airLiftDeployment ?? 0) > 0 ? '取消接应 · 回收空篮' : '飞行器返航回收';
  }
  if ((cargo.airRescueBoarding ?? 0) > 0) {
    return state.approvals.lift ? '屋顶人员登篮' : '取消接应 · 人员退回屋顶';
  }
  if ((cargo.airLiftDeployment ?? 0) > 0) {
    return state.approvals.lift ? '下放空篮 · 屋顶接应' : '取消接应 · 回收空篮';
  }
  if (cargo.status === 'standby') return '机场载车待命';
  if (cargo.status === 'recalled') return '机场载车已撤回';
  if (cargo.status === 'returning') return '机场载车撤回中';
  if (cargo.status === 'enroute') return '机场载车赴场中';
  if (cargo.status === 'deploying') return '机场载车展开中';
  if (cargo.status === 'fault') return '设备故障闭锁';
  if (time === 0) return '飞行器待起飞';
  if (time < flight.launch) return '飞行器垂直起飞';
  if (time < flight.transit) return '飞往屋顶接收区';
  if (time < flight.approach) return '接近屋顶接收区';
  if (time < flight.delivery) return '向屋顶吊放物资';
  if (time <= CARGO_LIFT_LATEST_START) return '物资已交付 · 屋顶待接应';
  if (time < flight.retract) return '接人窗口已过 · 回收吊索';
  return time < flight.mission ? '运输机返航中' : '本轮物资飞行已结束';
}

function pendingReason(cargo: UnitState, delivered: number) {
  if (cargo.status === 'standby' || cargo.status === 'recalled') return '本轮已授权，等待载车出动';
  if (cargo.status === 'enroute') return '本轮已授权，等待载车抵达';
  if (cargo.status === 'deploying') return '本轮已授权，等待载车展开';
  return delivered < 4 || cargoFlightTime(cargo) < AIRCRAFT_TIMING.cargo.delivery
    ? '本轮已授权，等待屋顶物资交付' : '本轮已授权，等待屋顶吊篮接应';
}

export function CargoRescueIntervention({ state, command, select, camera, setView, setTouring }: Props) {
  const id = useId();
  const cargo = state.units.find(unit => unit.kind === 'cargo');
  const blocker = cargoRescueBlocker(state);
  const boarding = (cargo?.airRescueBoarding ?? 0) > 0;
  const basketDeployed = (cargo?.airLiftDeployment ?? 0) > 0;
  const occupied = !!cargo?.airRescuePassenger && !cargo.airRescueDelivered;
  const pending = !!cargo?.airRescueRequested;
  const active = state.approvals.lift || boarding || basketDeployed || occupied;
  const disabled = !!blocker || pending || active || !!cargo?.airRescueDelivered;
  const canCancel = !state.complete && !cargo?.airRescueDelivered && (pending || active);
  const reason = state.complete || cargo?.airRescueDelivered ? blocker
    : occupied && cargo?.airRescueRecovery ? '载人回收中，继续完成地面交接'
      : occupied ? '人员已在吊篮内，等待地面交接'
        : cargo?.airReturning && (boarding || basketDeployed) ? '接应已取消，正在安全回收'
          : pending && cargo ? blocker ?? pendingReason(cargo, state.metrics.delivered)
            : state.approvals.lift ? '本轮吊人已授权'
              : blocker ?? '尚未授权';
  const status = cargo?.airRescueDelivered ? 'complete' : cargo?.airReturning ? 'recovery'
    : active ? 'active' : pending ? 'pending' : 'idle';
  return (
    <section className="cargo-rescue-intervention" aria-labelledby={`${id}-title`}>
      <div className="cargo-rescue-heading">
        <h3 id={`${id}-title`}><Users size={15} aria-hidden="true" />载重无人机吊人</h3>
        <div className="cargo-rescue-view-actions">
          <button
            type="button" className="cargo-rescue-icon" title="定位载重无人机" aria-label="定位载重无人机"
            disabled={!cargo} onClick={() => { if (cargo) { select(cargo.id); camera('focus'); } }}
          ><Focus size={15} aria-hidden="true" /></button>
          <button
            type="button" className="cargo-rescue-icon" title="跟随载重无人机" aria-label="跟随载重无人机"
            disabled={!cargo} onClick={() => { if (cargo) { select(cargo.id); setTouring(false); setView('follow'); camera('focus'); } }}
          ><ScanEye size={15} aria-hidden="true" /></button>
        </div>
      </div>
      <label className="cargo-rescue-opt-in">
        <span>载人吊运 · 高风险概念</span>
        <input
          className="cargo-rescue-checkbox" type="checkbox" checked={state.flags.liftConcept}
          aria-describedby={`${id}-risk`}
          onChange={event => command({ type: 'flag', key: 'liftConcept', value: event.target.checked })}
        />
      </label>
      <div className="cargo-rescue-progress" aria-live="polite" aria-atomic="true" data-state={status}>
        <p className="cargo-rescue-stage"><ArrowDownToLine size={15} aria-hidden="true" /><strong>{rescueStage(state, cargo)}</strong></p>
        <p className="cargo-rescue-reason" id={`${id}-reason`}>{reason}</p>
      </div>
      <div className="cargo-rescue-actions">
        {state.life.detected && !state.life.confirmed && !state.complete && !state.life.rescued && (
          <button type="button" onClick={() => command({ type: 'confirm-life' })}>
            <ShieldCheck size={14} aria-hidden="true" />人工复核生命信号
          </button>
        )}
        <button
          type="button" className="cargo-rescue-authorize" disabled={disabled}
          aria-describedby={`${id}-reason ${id}-risk`} onClick={() => command({ type: 'request-cargo-rescue' })}
        ><ShieldCheck size={14} aria-hidden="true" />授权本轮吊人</button>
        {canCancel && (
          <button
            type="button" disabled={cargo?.airReturning} aria-describedby={`${id}-reason`}
            onClick={() => command({ type: 'flag', key: 'liftConcept', value: false })}
          ><Undo2 size={14} aria-hidden="true" />{basketDeployed || boarding || occupied ? '取消接应并回收' : '取消本轮授权'}</button>
        )}
      </div>
      <p className="cargo-rescue-risk" id={`${id}-risk`}>高风险研究概念，未经工程验证；不计入安全转移人数。</p>
    </section>
  );
}
