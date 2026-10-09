import type { UnitKind, UnitState, UnitStatus, Vec3 } from '../types';
import { STAGING, STATION_LAYOUT, WATER_SOURCES } from '../spatial/layout';

export const PHASES = ['警情触发', '并行出动', '现场展开', '协同处置', '循环保障', '救援收束'];
export const KIND_LABELS: Record<UnitKind, string> = {
  water: '供水模块', booster: '移动增压', boom: '举高喷射', power: '能源保障', dog: '机器犬', tools: '破拆工具',
  'fire-drone': '灭火无人机', recon: '侦察无人机', cargo: '载重无人机', ladder: '云梯救援',
};
export const STATUS_LABELS: Record<UnitStatus, string> = {
  standby: '待命', enroute: '赴场', deploying: '展开', working: '作业', refilling: '补给', returning: '返程', fault: '受限', recalled: '已撤回',
};
export const STATIONS = STATION_LAYOUT;
export const WATER_POINTS: Vec3[] = WATER_SOURCES.map(source => source.bay);
const ALLOCATIONS: [string, UnitKind, string][] = [
  ['W01', 'water', 'NORTH'], ['W02', 'water', 'WEST'], ['W03', 'water', 'EAST'],
  ['B01', 'boom', 'NORTH'], ['P01', 'power', 'WEST'], ['D01', 'dog', 'NORTH'],
  ['T01', 'tools', 'WEST'], ['F01', 'fire-drone', 'EAST'], ['R01', 'recon', 'NORTH'],
  ['C01', 'cargo', 'EAST'], ['L01', 'ladder', 'EAST'], ['M01', 'booster', 'WEST'],
];
export const stagingFor = (id: string): Vec3 => [...STAGING[id].position];
export function createUnits(): UnitState[] {
  return ALLOCATIONS.map(([id, kind, station]) => {
    const layout = STATION_LAYOUT.find(s => s.id === station)!;
    const peers = ALLOCATIONS.filter(a => a[2] === station);
    const localIndex = peers.findIndex(a => a[0] === id);
    const home: Vec3 = [...layout.homes[localIndex]];
    return { id, name: `${KIND_LABELS[kind]} ${id}`, kind, station, position: [...home], home, heading: layout.homeHeading,
      destination: stagingFor(id), battery: 100, water: kind === 'water' ? 900 : 0,
      capacity: kind === 'water' ? 900 : 0, status: 'standby', task: '等待调度', route: [], travel: 0, deployment: 0,
      ...(kind === 'fire-drone' || kind === 'cargo' ? { airTime: 0, airReturning: false, airReturnFrom: 0, airReturnTime: 0 } : {}),
      ...(kind === 'cargo' ? { airLiftDeployment: 0 } : {}) };
  });
}
