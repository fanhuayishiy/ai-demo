import type { SimulationState } from '../types';
import { CARGO_LIFT_LATEST_START } from './aircraft';

export function cargoRescueBlocker(state: SimulationState): string | null {
  const cargo = state.units.find(unit => unit.kind === 'cargo');
  if (state.complete) return '本轮演示已结束';
  if (!cargo) return '载重无人机不可用';
  if (cargo.airRescueDelivered) return '本轮屋顶吊人已完成';
  if (cargo.airRescuePassenger) return '人员已在吊篮内，等待地面交接';
  if (state.life.rescued > 0) return '本轮云梯救援已完成，不能新增吊人任务';
  if (!state.flags.liftConcept) return '等待开启载人吊运概念';
  if (state.flags.droneFault) return '无人机故障，禁止新增吊人任务';
  if (cargo.battery <= 8) return 'C01 电量不足，等待能源补给';
  if (cargo.airReturning || cargo.status === 'returning') return 'C01 正在回收或撤回';
  if (!['standby', 'enroute', 'deploying', 'working', 'recalled'].includes(cargo.status)) return 'C01 当前不可用';
  const time = cargo.airTime ?? 0;
  if (!Number.isFinite(time) || time < 0) return 'C01 出动状态无效';
  if (time > CARGO_LIFT_LATEST_START + 0.00000001) return '已错过本轮屋顶接应窗口';
  if (!state.life.confirmed) return state.life.detected ? '等待人工复核生命信号' : '等待侦察发现人员线索';
  if ((cargo.airLiftDeployment ?? 0) > 0 || (cargo.airRescueBoarding ?? 0) > 0) return '屋顶吊篮接应已经开始';
  return null;
}
