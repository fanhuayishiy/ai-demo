import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, ArrowsClockwise, BatteryHigh, CaretRight, Check, Clock, Compass, Crosshair, Cube, Cursor, ListBullets, MagnifyingGlass, MapPin, Minus, Package, Pause, Play, Plus, Stop, Truck, Warehouse, X } from '@phosphor-icons/react';
import type { DashboardProps, EntityKind } from '../types';
import { entities, getEntity } from '../data';
import { CYCLE_DURATION } from '../simulation';
import './dashboard.css';

const entityIcons = { warehouse: Warehouse, truck: Truck, pallet: Package, forklift: Truck };
const kindLabels = { warehouse: '仓库', truck: '运输车辆', pallet: '托盘货物', forklift: '电动叉车' };
const stages = ['approach', 'pickup', 'transport', 'unload', 'return'];
const stageNames = ['前往货位', '提取货物', '运输中', '卸货入位', '返回待命'];
function EntityIcon({ kind, size = 18 }: { kind: EntityKind; size?: number }) { const Icon = entityIcons[kind]; return <Icon size={size} weight="duotone" aria-hidden="true" />; }

export function Dashboard({ selectedId, selectionSequence = 0, onSelect, sim, running, onToggle, onResetView, onZoomIn, onZoomOut, onFocusSelected, onToggleTour, touring = false }: DashboardProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [tab, setTab] = useState<'docks' | 'forklifts' | 'trucks'>('docks');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low'>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const previousSelection = useRef({ id: selectedId, sequence: selectionSequence });
  useEffect(() => {
    if (previousSelection.current.id !== selectedId || previousSelection.current.sequence !== selectionSequence) {
      setDetailOpen(true);
      previousSelection.current = { id: selectedId, sequence: selectionSequence };
    }
  }, [selectedId, selectionSequence]);
  const selected = getEntity(selectedId) ?? entities[0];
  const cargoStatus = sim.cargo.onForks ? '运输中' : sim.cargo.delivered ? '已送达' : '待搬运';
  const dockStatus = { approach: '等待货物', pickup: '取货中', transport: '货物在途', unload: '卸货中', return: '已完成' }[sim.stage];
  const statusFor = (entity: typeof selected) => entity.kind === 'forklift' ? sim.stageLabel : entity.id === 'pallet-01' ? cargoStatus : entity.id === 'truck-02' ? dockStatus : entity.id === 'truck-01' ? '等待中' : entity.status;
  const results = entities.filter((entity) => `${entity.id} ${entity.name} ${entity.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()));
  const searchVisible = searchOpen && !!query.trim();
  const progress = Math.round(Math.max(0, Math.min(1, sim.progress)) * 100);
  const remainingSeconds = Math.ceil(Math.max(0, CYCLE_DURATION - Math.max(0, Number.isFinite(sim.cycleTime) ? sim.cycleTime : 0)));
  const stageIndex = stages.indexOf(sim.stage);
  const choose = (id: string) => { onSelect(id); setSearchOpen(false); setQuery(''); setDetailOpen(true); };
  const focusSelected = () => { setDetailOpen(false); onFocusSelected?.(); };
  const toggleTour = () => { if (!touring) setDetailOpen(false); onToggleTour?.(); };
  const pallets = entities.filter((entity) => entity.kind === 'pallet');
  const quantityFor = (entity: typeof selected) => entity.fields.find(field => field.label === '装载数量' || field.label === '剩余数量')?.value ?? '—';
  const rows = entities.filter((entity) => entity.kind === (tab === 'forklifts' ? 'forklift' : 'truck'));
  const Status = ({ children }: { children: ReactNode }) => <span className="wt-status"><i />{children}</span>;
  return <div className="wt-overlay">
    <header className="wt-navbar">
      <button className="wt-brand" onClick={() => choose('warehouse-01')} aria-label="WareTrack 仓库总览"><span className="wt-brand-icon"><Cube weight="fill" size={29} /></span><span>WareTrack<small>仓储运营中心</small></span></button>
      <div className="wt-search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
        <MagnifyingGlass size={17} aria-hidden="true" />
        <input aria-label="搜索设备、车辆或货物" role="combobox" aria-expanded={searchVisible} aria-controls="wt-search-results" aria-autocomplete="list" aria-activedescendant={searchVisible && results[activeResult] ? `result-${results[activeResult].id}` : undefined} placeholder="搜索设备、车辆或货物…" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); setActiveResult(0); }} onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (!searchVisible) return; if (event.key === 'ArrowDown') { event.preventDefault(); setActiveResult((index) => Math.min(index + 1, results.length - 1)); } if (event.key === 'ArrowUp') { event.preventDefault(); setActiveResult((index) => Math.max(index - 1, 0)); } if (event.key === 'Enter' && results[activeResult]) choose(results[activeResult].id); }} />
        <span className="wt-search-key">⌕</span>
        {searchVisible && <div className="wt-search-results" role="listbox" id="wt-search-results" aria-label="搜索结果">{results.length ? results.map((entity, index) => <button id={`result-${entity.id}`} role="option" aria-selected={index === activeResult} key={entity.id} onClick={() => choose(entity.id)}><EntityIcon kind={entity.kind} /><span>{entity.name}<small>{entity.id}</small></span><CaretRight size={12} /></button>) : <p>未找到设备或货物，试试编号或名称</p>}</div>}
      </div>
      <div className="wt-location"><span className="wt-location-pin"><MapPin size={18} weight="fill" /></span><span>华东智慧仓<small>上海 · WH-01</small></span></div>
      <span className={`wt-live ${running ? '' : 'is-paused'}`}><i />{running ? '模拟运行中' : '模拟已暂停'}<small>模拟数据</small></span>
      <div className="wt-account"><span>LC</span><div>林晨<small>运营管理员</small></div></div>
    </header>

    <section className="wt-stats" aria-label="仓库关键指标">
      <div className="wt-stat"><span className="wt-stat-icon"><Package size={21} weight="duotone" /></span><div><p>在库库存</p><strong>1,412 <span className="wt-trend">+15 <ArrowUpRight size={10} /></span></strong><small>托盘 · 库容使用率 78%</small></div></div>
      <div className="wt-stat"><span className="wt-stat-icon"><Truck size={21} weight="duotone" /></span><div><p>在场车辆</p><strong>3 <span className="wt-unit">辆</span></strong><small>1 任务车辆 · 2 等待中</small></div></div>
      <div className="wt-stat"><span className="wt-stat-icon"><Clock size={21} weight="duotone" /></span><div><p>准时发运率</p><strong>96.6<span className="wt-unit">%</span><span className="wt-trend">+0.4%</span></strong><small>较昨日 <span className="wt-green">稳步提升</span></small></div></div>
    </section>

    <button className="wt-detail-toggle wt-panel" aria-label={detailOpen ? '收起详情' : '展开详情'} aria-expanded={detailOpen} aria-controls="wt-detail" onClick={() => setDetailOpen(!detailOpen)}><ListBullets size={17} />{detailOpen ? '收起详情' : '对象详情'}</button>
    <section id="wt-detail" className={`wt-detail wt-panel ${detailOpen ? 'is-open' : ''}`} aria-label="对象详情">
      <div className="wt-detail-heading"><span className="wt-object-icon"><EntityIcon kind={selected.kind} size={25} /></span><div><span className="wt-eyebrow">{kindLabels[selected.kind]} · {selected.id.toUpperCase()}</span><h1>{selected.name}</h1><p>{selected.subtitle}</p></div><button className="wt-icon-button wt-mobile-close" aria-label="关闭对象详情" onClick={() => setDetailOpen(false)}><X size={15} /></button></div>
      <div className="wt-detail-status"><Status>{statusFor(selected)}</Status><span>{selected.kind === 'warehouse' ? '1 任务月台 · 2 等待 · 1 空闲' : '模拟数据'}</span></div>
      {selected.kind === 'warehouse' ? <>
        <div className="wt-capacity"><div><span>仓储容量</span><strong>1,412 <small>/ 1,800</small></strong><div className="wt-bar"><i style={{ width: '78%' }} /></div></div><div><span>月台使用</span><strong>1 <small>/ 4 月台</small></strong><div className="wt-bar green"><i style={{ width: '25%' }} /></div></div></div>
        <div className="wt-mini-stats"><span>今日出库<strong>23 <small>批次</small></strong></span><span>待发托盘<strong>15 <small>托盘</small></strong></span></div>
        <div className="wt-section-title"><h2>库存概览</h2><select aria-label="库存筛选" value={inventoryFilter} onChange={(event) => setInventoryFilter(event.target.value as 'all' | 'low')}><option value="all">全部库存</option><option value="low">待补货</option></select></div>
        <div className="wt-inventory">{pallets.filter((_, index) => inventoryFilter === 'all' || index === 2).map((entity) => <button key={entity.id} onClick={() => choose(entity.id)} className={selectedId === entity.id ? 'is-selected' : ''}><span className={`wt-crate ${entity.id === 'pallet-02' ? 'blue' : ''}`}><Package weight="duotone" size={20} /></span><span>{entity.name}<small>{entity.subtitle}</small></span><span className="wt-stock-quantity">{quantityFor(entity)}</span><span className={`wt-stock ${entity.id === 'pallet-03' ? 'low' : ''}`}>{statusFor(entity)}<CaretRight size={10} /></span></button>)}</div>
        <button className="wt-fleet" onClick={() => choose('forklift-01')}><span><EntityIcon kind="forklift" /> FL-01 <small>{sim.stageLabel}</small></span><span><BatteryHigh size={16} /> 78% <CaretRight size={12} /></span></button>
      </> : <>
        <dl className="wt-fields">{selected.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
        {selected.kind === 'forklift' && <div className="wt-forklift-live"><div><BatteryHigh size={17} /><span>电池电量</span><strong>78%</strong></div><div className="wt-bar green"><i style={{ width: '78%' }} /></div><p>当前任务 <strong>SHP-78442</strong></p><p>载货状态 <strong>{sim.cargo.onForks ? '已载货' : sim.cargo.delivered ? '已卸货' : '空载'}</strong></p></div>}
        <button className="wt-back-link" onClick={() => choose('warehouse-01')}>返回仓库总览 <CaretRight size={12} /></button>
      </>}
      <footer className="wt-panel-foot"><i /> 场景与设备状态同步<span>模拟数据</span></footer>
    </section>

    <div className="wt-scene-tools wt-panel" aria-label="场景控制"><button aria-label="放大场景" title="放大场景" onClick={onZoomIn}><Plus size={17} /></button><button aria-label="缩小场景" title="缩小场景" onClick={onZoomOut}><Minus size={17} /></button><span /><button aria-label="重置视角" title="重置视角" onClick={onResetView}><ArrowsClockwise size={17} /></button><button aria-label="聚焦选中对象" title="聚焦选中对象" disabled={!onFocusSelected} onClick={focusSelected}><Crosshair size={17} /></button><button aria-label={touring ? '停止镜头巡游' : '开始镜头巡游'} title={touring ? '停止镜头巡游' : '开始镜头巡游'} aria-pressed={touring} disabled={!onToggleTour} onClick={toggleTour}>{touring ? <Stop size={17} weight="fill" /> : <Compass size={17} />}</button></div>
    <div className="wt-scene-label"><span>WH-01</span> 华东智慧仓 <i /> 3D 实时总览</div>

    <section className="wt-shipment wt-panel" aria-label="运输任务">
      <div className="wt-section-title"><h2><Truck size={17} weight="duotone" />运输任务</h2><span className="wt-subtle">WH-01 → 02 号月台</span><button className={`wt-run ${running ? '' : 'is-paused'}`} aria-label={running ? '暂停模拟' : '继续模拟'} onClick={onToggle}>{running ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}{running ? '暂停' : '继续'}</button></div>
      <div className="wt-shipment-body"><div className="wt-journey"><div className="wt-journey-line"><i style={{ width: `${Math.max(0, stageIndex) * 25}%` }} /></div><div className="wt-stages">{stageNames.map((name, index) => <div className={index <= stageIndex ? 'active' : ''} key={name}><span>{index < stageIndex ? <Check size={10} weight="bold" /> : index === stageIndex ? <Package size={11} weight="fill" /> : <i />}</span><strong>{name}</strong><small>{index < stageIndex ? '已完成' : index === stageIndex ? '进行中' : '待执行'}</small></div>)}</div></div><button className="wt-task-card" onClick={() => choose('forklift-01')}><span className="wt-task-icon"><Truck size={28} weight="duotone" /></span><span><strong>SHP-78442</strong><small>FL-01 · {sim.stageLabel}</small><span className="wt-task-progress" title="32 秒模拟循环的剩余时间，非真实发运 ETA">演示剩余 {remainingSeconds} 秒</span></span><CaretRight size={13} /></button></div>
      <div className="wt-progress" role="progressbar" aria-label="运输任务进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div>
    </section>

    <section className="wt-docks wt-panel" aria-label="设备与月台列表"><div className="wt-docks-top"><div role="tablist" aria-label="设备类别">{([{ key: 'docks', label: '月台', count: 4 }, { key: 'forklifts', label: '叉车', count: 1 }, { key: 'trucks', label: '车辆', count: 3 }] as const).map((item) => <button id={`tab-${item.key}`} role="tab" aria-selected={tab === item.key} aria-controls="wt-equipment" key={item.key} onClick={() => setTab(item.key)}>{item.label}<span>{item.count}</span></button>)}</div><span>WH-01</span></div><div id="wt-equipment" role="tabpanel" aria-labelledby={`tab-${tab}`} className="wt-equipment">{rows.map((entity, index) => <div className="wt-equipment-row" key={entity.id}><button className={entity.id === selectedId ? 'is-selected' : ''} onClick={() => choose(entity.id)}><span className="wt-row-primary">{tab === 'docks' ? `${String(index + 1).padStart(2, '0')} 号月台` : entity.kind === 'forklift' ? 'FL-01' : entity.name}<small>{tab === 'docks' ? entity.name : entity.subtitle}</small></span><span className={`wt-row-status ${entity.id === 'truck-02' || entity.kind === 'forklift' ? 'working' : ''}`}>{statusFor(entity)}</span><CaretRight size={12} /></button>{tab === 'docks' && entity.id === 'truck-02' && <div className="wt-dock-progress-line"><div className="wt-dock-progress" role="progressbar" aria-label="02 号月台演示进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div>}</div>)}{tab === 'docks' && <button onClick={() => choose('warehouse-01')}><span className="wt-row-primary">04 号月台<small>暂无车辆</small></span><span className="wt-row-status">空闲</span><CaretRight size={12} /></button>}</div></section>
    <div className="wt-hints"><Cursor size={13} /> 拖动旋转 <span /> 滚轮缩放 <span /> 点击查看对象</div>
  </div>;
}
