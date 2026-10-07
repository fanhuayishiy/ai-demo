import type { Entity } from './types';

/** Local demonstration inventory, never a live WMS feed. */
export const entities: Entity[] = [
  {
    id: 'warehouse-01', kind: 'warehouse', name: '华东智慧仓', subtitle: 'WH-01 · 上海临港物流园',
    status: '运营正常', position: [-3, 0, -6], color: '#2861e7',
    fields: [{ label: '仓库编号', value: 'WH-01' }, { label: '在库托盘', value: '1,412 / 1,800' }, { label: '数据来源', value: '本地模拟数据' }],
  },
  {
    id: 'forklift-01', kind: 'forklift', name: 'FL-01 电动叉车', subtitle: '场内搬运 · 额定载重 2.5 吨',
    status: '执行任务', position: [-16, 0, 3], color: '#ffc940',
    fields: [{ label: '设备编号', value: 'FL-01' }, { label: '当前任务', value: 'SHP-78442' }, { label: '操作员', value: '张伟' }, { label: '电池电量', value: '78%' }],
  },
  {
    id: 'truck-01', kind: 'truck', name: 'TRK-2095 运输车', subtitle: '沪 B·2095 · 01 号月台',
    status: '等待中', position: [-9, 0, 8], color: '#2d63de',
    fields: [{ label: '车辆编号', value: 'TRK-2095' }, { label: '承运商', value: '华东物流' }, { label: '预约月台', value: '01 号月台' }, { label: '计划发运', value: '14:30（模拟）' }],
  },
  {
    id: 'truck-02', kind: 'truck', name: 'TRK-2205 运输车', subtitle: '沪 C·2205 · 02 号月台',
    status: '等待货物', position: [1, 0, 9], color: '#42b6a8',
    fields: [{ label: '车辆编号', value: 'TRK-2205' }, { label: '承运商', value: '城际速运' }, { label: '预约月台', value: '02 号月台' }, { label: '计划发运', value: '15:00（模拟）' }],
  },
  {
    id: 'truck-03', kind: 'truck', name: 'TRK-2287 运输车', subtitle: '苏 E·2287 · 03 号月台',
    status: '等待中', position: [9, 0, 6], color: '#486fa8',
    fields: [{ label: '车辆编号', value: 'TRK-2287' }, { label: '承运商', value: '长三角货运' }, { label: '预约月台', value: '03 号月台' }, { label: '计划发运', value: '15:20（模拟）' }],
  },
  {
    id: 'pallet-01', kind: 'pallet', name: '工业安全帽', subtitle: 'PLT-1026 · 劳保用品',
    status: '待搬运', position: [-16, 0, 7.2], color: '#dfb984',
    fields: [{ label: '托盘编号', value: 'PLT-1026' }, { label: '物料编码', value: 'SKU-00842' }, { label: '装载数量', value: '96 件' }, { label: '配送任务', value: 'SHP-78442' }],
  },
  {
    id: 'pallet-02', kind: 'pallet', name: '塑料周转箱', subtitle: 'PLT-1027 · 仓储耗材',
    status: '在库', position: [12.5, 0, 2], color: '#3975ee',
    fields: [{ label: '托盘编号', value: 'PLT-1027' }, { label: '物料编码', value: 'SKU-01208' }, { label: '装载数量', value: '48 件' }, { label: '所在区域', value: '东侧暂存区' }],
  },
  {
    id: 'pallet-03', kind: 'pallet', name: '包装胶带', subtitle: 'PLT-1028 · 包装耗材',
    status: '待补货', position: [15.2, 0, 2], color: '#dfb984',
    fields: [{ label: '托盘编号', value: 'PLT-1028' }, { label: '物料编码', value: 'SKU-02146' }, { label: '剩余数量', value: '12 箱' }, { label: '补货阈值', value: '20 箱' }],
  },
];

export function getEntity(id: string): Entity {
  return entities.find(entity => entity.id === id) ?? entities[0];
}
