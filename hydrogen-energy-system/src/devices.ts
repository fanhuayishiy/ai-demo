import type { Simulation } from './simulation';
import type { Carrier } from './palette';

export interface Device {
  id: string;
  name: string;
  english: string;
  code: string;
  carrier: Carrier;
  position: [number, number];
  labelHeight: number;
  formula: string;
  description: string;
  values: (s: Simulation) => [string, number, string][];
}

export const devices: Device[] = [
  { id: 'solar', name: '光伏发电阵列', english: 'PHOTOVOLTAIC ARRAY', code: 'PV-01', carrier: 'electricity', position: [-14, -8], labelHeight: 2.8, formula: '太阳辐射 → 电能', description: '900 kWp 光伏阵列。辐照度及环境温度共同影响输出功率，温度系数 −0.4%/°C。', values: s => [['发电功率', s.pv, 'kW'], ['额定容量', 900, 'kWp'], ['负载率', s.pv / 9, '%']] },
  { id: 'wind', name: '风力发电机', english: 'WIND TURBINES', code: 'WT-01', carrier: 'electricity', position: [-21, -9], labelHeight: 9, formula: '风能 → 电能', description: '两台 300 kW 风机。3 m/s 切入、12 m/s 额定、25 m/s 切出，输出采用立方功率曲线。', values: s => [['发电功率', s.wind, 'kW'], ['额定容量', 600, 'kW'], ['负载率', s.wind / 6, '%']] },
  { id: 'electrolyzer', name: 'PEM 电解制氢', english: 'PEM ELECTROLYZER', code: 'EL-01', carrier: 'hydrogen', position: [-2, -8], labelHeight: 3.7, formula: '电能 + 水 → 氢能 + 氧气 + 散热', description: '优先利用可再生电力余量制氢；净效率 68%（含辅助设备，LHV）。储氢罐充满后自动停止。', values: s => [['输入电功率', s.electrolyzer, 'kW'], ['产氢速率', s.hydrogenKgPerHour, 'kg/h'], ['系统效率 · LHV', 68, '%'], ['散热损耗', s.electrolysisLoss, 'kW']] },
  { id: 'storage', name: '高压储氢罐', english: 'HYDROGEN STORAGE', code: 'HS-01', carrier: 'hydrogen', position: [9, -9], labelHeight: 5.5, formula: '电解制氢 → 储氢 → 燃料电池', description: '4,000 kWh 储氢容量，按氢气低位热值 33.33 kWh/kg 折算；库存按模拟时间积分。', values: s => [['储氢能量', s.nextStored, 'kWh'], ['储氢质量', s.nextStored / 33.33, 'kg'], ['库存比例', s.nextStored / 40, '%'], ['净充入功率', s.hydrogenDelta, 'kW']] },
  { id: 'fuelcell', name: '氢燃料电池', english: 'HYDROGEN FUEL CELL', code: 'FC-01', carrier: 'hydrogen', position: [19, -8], labelHeight: 3.4, formula: '氢能 + 氧气 → 电能 + 热能 + 水', description: '电效率 52%，回收热效率 32%，其余 16% 散热。可再生电力不足时放电，受储氢库存约束。', values: s => [['发电功率', s.fuelElectric, 'kW'], ['回收热功率', s.fuelHeat, 'kW'], ['氢能输入 · LHV', s.fuelHydrogen, 'kW'], ['散热损耗', s.fuelLoss, 'kW']] },
  { id: 'gas', name: '天然气调压站', english: 'NATURAL GAS INLET', code: 'NG-01', carrier: 'gas', position: [-20, 5], labelHeight: 3.1, formula: '天然气管网 → 调压 → 热电联产', description: '外部天然气供给，以低位热值功率计量。模型不将天然气直接视为电能。', values: s => [['燃气输入 · LHV', s.chpGas, 'kW'], ['折算气量', s.chpGas / 9.7, 'Nm³/h']] },
  { id: 'chp', name: '燃气热电联产', english: 'COMBINED HEAT & POWER', code: 'CHP-01', carrier: 'heat', position: [-10, 4], labelHeight: 5.2, formula: '天然气 → 电能 36% + 热能 46% + 损耗 18%', description: '燃气内燃机驱动发电机，烟气和缸套余热回收用于供热及吸收式制冷。热、电分别进入母线。', values: s => [['输出电功率', s.chpElectric, 'kW'], ['回收热功率', s.chpHeat, 'kW'], ['燃气输入', s.chpGas, 'kW'], ['综合效率', 82, '%']] },
  { id: 'heatpump', name: '空气源热泵', english: 'AIR SOURCE HEAT PUMP', code: 'HP-01', carrier: 'heat', position: [0, 5], labelHeight: 3.2, formula: '电能 + 环境热 → 供热', description: '补足热负荷缺口。COP 随气温变化，环境吸热单独计入能量平衡，因此输出热量可以高于耗电。', values: s => [['供热功率', s.heatPumpHeat, 'kW'], ['输入电功率', s.heatPumpElectric, 'kW'], ['环境吸热', s.ambientHeat, 'kW'], ['制热 COP', s.heatPumpCOP, '']] },
  { id: 'chiller', name: '复合制冷机组', english: 'HYBRID COOLING PLANT', code: 'CL-01', carrier: 'cold', position: [9, 5], labelHeight: 3.3, formula: '余热 → 吸收式制冷 / 电能 → 压缩式制冷', description: '吸收式 COP 0.72，压缩式 COP 随气温变化。冷量是从用户侧移走的热量；冷凝排热包含冷量与驱动能量。', values: s => [['总供冷功率', s.coldLoad, 'kW'], ['余热驱动制冷', s.absorptionCold, 'kW'], ['电驱动制冷', s.chillerCold, 'kW'], ['压缩式 COP', s.chillerCOP, '']] },
  { id: 'load', name: '综合用能中心', english: 'CAMPUS ENERGY LOAD', code: 'LD-01', carrier: 'electricity', position: [19, 7], labelHeight: 6.6, formula: '电母线 + 热水管网 + 冷水管网 → 用户', description: '园区建筑的电、热、冷负荷可独立调节。电网双向交换平衡电力缺口或剩余电量。', values: s => [['电负荷', s.electricLoad, 'kW'], ['热负荷', s.heatLoad, 'kW'], ['冷负荷', s.coldLoad, 'kW'], ['电网净购电', s.grid, 'kW']] },
];
