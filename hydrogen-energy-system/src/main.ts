import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import { EnergyScene } from './scene';
import { simulate, defaults, storageCapacity, type Controls } from './simulation';
import { devices } from './devices';
import { palette, carrierNames, type Carrier } from './palette';

const icons: Record<string, string> = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  network: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4H5v4m7-4h7v4"/>',
  chart: '<path d="M3 3v18h18M6 15l4-5 4 3 6-8"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  leaf: '<path d="M20 3C6 1 1 8 6 15s16 4 14-12ZM5 20 16 8"/>',
  tank: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v14c0 4 14 4 14 0V5M5 11c0 4 14 4 14 0"/>',
  activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3"/>',
  temp: '<path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 8v9"/>',
  rotate: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10v10M3 7l9 5 9-5M7 4l10 6"/>',
  target: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/><path d="M12 7v5l3 2"/>',
};
const icon = (name: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.activity}</svg>`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};
const format = (n: number, digits = 1) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const carriers = Object.keys(carrierNames) as Carrier[];
const controls = { ...defaults };
let stored = 2480;
let state = simulate(controls, stored);
let paused = false;
let speed = 1;
let selected = 'electrolyzer';
let scene: EnergyScene | undefined;
let elapsed = 0;
let filtered: Carrier | null = null;
const logEntries: { time: string; text: string }[] = [{ time: '00:00:00', text: '仿真初始化完成 · 五类能流守恒检查通过' }];
const history: { second: number; generation: number; demand: number; hydrogen: number }[] = [];
for (const [key, value] of Object.entries(palette)) document.documentElement.style.setProperty(`--${key}`, value);

function slider(key: keyof Controls, label: string, min: number, max: number, step: number, unit: string, symbol: string) {
  return `<div class="slider-control ${['electric', 'heat', 'cold'].includes(key) ? `load-slider carrier-${key === 'electric' ? 'electricity' : key}` : ''}">
    <label for="control-${key}"><span>${icon(symbol)}${label}</span><span class="slider-reading"><output id="value-${key}" for="control-${key}">${controls[key]}</output><small>${unit}</small></span></label>
    <input id="control-${key}" data-control="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${controls[key]}" aria-label="${label}">
    <div class="range-limits"><span>${min}${unit}</span><span>${max}${unit}</span></div>
  </div>`;
}

$('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="./" aria-label="H2 NEXUS 首页"><span class="brand-symbol">H<sub>2</sub><span></span></span><span class="brand-name">NEXUS<span>综合能源智慧管理平台</span></span></a>
    <nav class="top-nav" aria-label="主导航">
      <button class="nav-tab active" data-view="overview">${icon('grid')}总览监控</button>
      <button class="nav-tab" data-view="topology">${icon('network')}能量拓扑</button>
      <button class="nav-tab" data-view="logs">${icon('chart')}运行记录</button>
    </nav>
    <div class="top-status"><span class="online-dot"></span><span>本地仿真在线</span><span class="top-divider"></span><time id="clock"></time><button class="icon-button" id="about" title="仿真模型说明" aria-label="仿真模型说明">${icon('info')}</button></div>
  </header>
  <aside class="rail" aria-label="快捷工具">
    <button class="rail-button active" data-view="overview" title="总览监控" aria-label="总览监控">${icon('cube')}</button>
    <button class="rail-button" data-view="topology" title="能量拓扑" aria-label="能量拓扑">${icon('network')}</button>
    <button class="rail-button" id="control-focus" title="气象与负荷控制" aria-label="气象与负荷控制">${icon('settings')}</button>
    <button class="rail-button" data-view="logs" title="运行记录" aria-label="运行记录">${icon('chart')}</button>
    <div class="rail-bottom"><span class="rail-line"></span><span class="rail-version">V1.0</span></div>
  </aside>
  <main>
    <div class="page-heading">
      <div><div class="eyebrow"><span></span>INTEGRATED ENERGY DIGITAL TWIN</div><h1>综合能源数字孪生<span>多能协同，一屏掌控</span></h1></div>
      <div class="site-info"><span class="site-pin"></span>低碳示范园区 <span class="site-code">SITE / 01</span><span class="mode-tag">并网运行</span></div>
    </div>
    <div class="workspace">
      <div class="main-column">
        <section class="metrics" aria-label="系统关键指标">
          <article class="metric"><div class="metric-title"><span>总发电功率</span>${icon('bolt')}</div><div class="metric-value"><strong id="metric-generation">0</strong><span>kW</span><svg class="mini-bars" viewBox="0 0 75 30" aria-hidden="true"><path d="M3 26V21M11 26V15M19 26V18M27 26V11M35 26V14M43 26V6M51 26V10M59 26V3M67 26V7" stroke="currentColor" stroke-width="4"/></svg></div><div class="metric-sub"><span class="dot yellow"></span>光伏 · 风电 · 热电联产 · 燃料电池</div></article>
          <article class="metric"><div class="metric-title"><span>可再生能源占比</span>${icon('leaf')}</div><div class="metric-value"><strong id="metric-renewable">0</strong><span>%</span><span class="metric-orbit">${icon('leaf')}</span></div><div class="metric-sub">可再生发电 / 园区总发电</div></article>
          <article class="metric"><div class="metric-title"><span>储氢状态</span>${icon('tank')}</div><div class="metric-value"><strong id="metric-storage">62.0</strong><span>%</span><div class="tank-meter"><i id="tank-level"></i></div></div><div class="metric-sub"><span class="dot green"></span><span id="metric-kg">74.4</span> kg <span class="sub-separator">/</span> 120.0 kg</div></article>
          <article class="metric"><div class="metric-title"><span>电网交互功率</span>${icon('activity')}</div><div class="metric-value"><strong id="metric-grid">0</strong><span>kW</span><span class="grid-direction" id="grid-direction">↗</span></div><div class="metric-sub"><span class="dot blue"></span><span id="grid-label">外部电网实时平衡</span></div></article>
        </section>
        <section class="scene-card" aria-labelledby="scene-title">
          <div class="scene-toolbar"><div class="panel-title"><span class="section-mark"></span><h2 id="scene-title">园区实时全景</h2><span class="small-tag">3D LIVE</span></div><div class="scene-actions"><button class="text-button" id="label-toggle" aria-pressed="true">${icon('layers')}设备标签</button><button class="icon-button" id="fullscreen" title="全屏查看" aria-label="全屏查看">${icon('expand')}</button></div></div>
          <div class="scene-stage" id="scene">
            <div class="scene-coordinate"><span>能源协同示范站</span><small>DIGITAL TWIN / 01</small></div>
            <div class="scene-live"><span class="online-dot"></span><span id="scene-live-text">实时仿真</span><span id="fps">-- FPS</span></div>
            <div class="scene-loading" id="scene-loading"><span class="loader"></span>正在构建能源园区…</div>
            <div class="compass" aria-hidden="true"><span>N</span><i></i><b>东北</b></div>
            <div class="scene-hint">${icon('rotate')}拖动旋转 <span>·</span> 滚轮缩放 <span>·</span> 点击设备查看参数</div>
            <div class="view-controls" aria-label="相机控制">
              <button class="icon-button" id="view-reset" title="重置视角" aria-label="重置视角">${icon('target')}</button>
              <button class="icon-button" id="view-top" title="俯视视角" aria-label="俯视视角">${icon('layers')}</button>
              <span></span><button class="icon-button" id="zoom-in" title="放大" aria-label="放大">+</button>
              <button class="icon-button" id="zoom-out" title="缩小" aria-label="缩小">−</button>
              <span></span><button class="icon-button" id="auto-rotate" title="自动环绕" aria-label="自动环绕" aria-pressed="false">${icon('rotate')}</button>
            </div>
          </div>
          <div class="scene-bottom"><div class="energy-legend"><span class="legend-label">能流图层</span><button class="legend-all active" data-carrier="all">全部</button>${carriers.map(key => `<button class="legend-item" data-carrier="${key}" style="--carrier:var(--${key})" aria-pressed="false"><i></i>${carrierNames[key]}</button>`).join('')}</div><div class="simulation-actions"><button id="pause" class="text-button" aria-label="暂停仿真">${icon('pause')}<span>暂停</span></button><select id="sim-speed" aria-label="仿真速度"><option value="1">1× 速度</option><option value="10">10× 速度</option><option value="60">60× 速度</option></select></div></div>
        </section>
        <div class="analysis-row">
          <section class="panel trend-panel"><div class="panel-heading"><div class="panel-title"><span class="section-mark"></span><h2>功率运行趋势</h2></div><span class="live-caption"><span class="online-dot"></span>最近 60 秒</span></div><div class="chart-legend"><span><i class="yellow"></i>发电功率</span><span><i class="blue"></i>用电功率</span><span><i class="green"></i>制氢功率</span><small>kW</small></div><div class="chart" id="trend-chart" role="img" aria-label="最近60秒发电、用电和制氢功率趋势"></div></section>
          <section class="panel balance-panel"><div class="panel-heading"><div class="panel-title"><span class="section-mark"></span><h2>能量平衡</h2></div><span class="balanced">${icon('check')}守恒校验</span></div><div id="balance-rows"></div><div class="balance-footer"><span>全站能量残差</span><strong id="residual">0.000 kW</strong><button id="balance-info" class="icon-button" aria-label="查看能量平衡计算说明" title="查看计算说明">${icon('info')}</button></div></section>
        </div>
      </div>
      <aside class="right-column">
        <section class="panel controls-panel"><div class="panel-heading"><div class="panel-title"><span class="section-mark"></span><h2>气象与负荷</h2></div><button class="icon-button" id="reset-controls" aria-label="重置气象与负荷" title="重置气象与负荷">${icon('reset')}</button></div><div class="controls-inner"><div class="control-section-title"><span>环境条件</span><span class="micro">WEATHER</span></div><div class="weather-presets"><button class="preset active" data-preset="sunny">${icon('sun')}晴朗</button><button class="preset" data-preset="cloudy">多云</button><button class="preset" data-preset="night">夜间</button></div>
          ${slider('irradiance', '太阳辐照度', 0, 1100, 10, 'W/m²', 'sun')}
          ${slider('wind', '环境风速', 0, 30, 0.1, 'm/s', 'wind')}
          ${slider('temperature', '环境温度', -10, 45, 1, '°C', 'temp')}
          <div class="control-section-title load-title"><span>用户侧负荷</span><span class="micro">DEMAND</span></div>
          ${slider('electric', '电负荷', 0, 160, 1, '%', 'bolt')}
          ${slider('heat', '热负荷', 0, 160, 1, '%', 'temp')}
          ${slider('cold', '冷负荷', 0, 160, 1, '%', 'activity')}
          <div class="control-note"><span class="online-dot"></span>调节参数后，能流与设备状态实时联动</div></div>
        </section>
        <section class="panel device-panel" aria-labelledby="device-heading"><div class="panel-heading"><div class="panel-title"><span class="section-mark"></span><h2 id="device-heading">设备运行参数</h2></div><span class="micro">INSPECTOR</span></div><div class="device-inner"><label class="sr-only" for="device-select">选择能源设备</label><select id="device-select">${devices.map(d => `<option value="${d.id}" ${d.id === selected ? 'selected' : ''}>${d.name} / ${d.code}</option>`).join('')}</select><div class="device-identity"><span class="device-symbol">${icon('tank')}</span><div><h3 id="device-name"></h3><span id="device-english"></span></div><span class="device-status" id="device-status">运行</span></div><div class="device-values" id="device-values"></div><div class="device-conversion"><span>能量转换</span><p id="device-formula"></p></div><button id="device-detail" class="detail-button">查看设备原理与详情 ${icon('chevron')}</button></div></section>
      </aside>
    </div>
    <footer class="footer"><span><span class="online-dot"></span>系统运行正常 <i>·</i> <span id="equipment-count">10</span> 台设备已接入仿真</span><span>本地物理模型 · 数据为模拟值 <i>|</i> 模拟时长 <b id="elapsed">00:00:00</b></span><span>H₂ NEXUS <small>ENERGY OS / 1.0</small></span></footer>
  </main>
  <dialog id="modal"><div class="modal-heading"><div><span class="eyebrow" id="modal-eyebrow">ENERGY NEXUS</span><h2 id="modal-title"></h2></div><button id="modal-close" class="icon-button" aria-label="关闭">${icon('close')}</button></div><div id="modal-body"></div></dialog>
  <div class="toast" id="toast" role="status"></div>
`;

let toastTimer: ReturnType<typeof setTimeout>;
function toast(text: string) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}

function duration(seconds: number) {
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map(n => String(n).padStart(2, '0')).join(':');
}

function log(text: string) {
  logEntries.unshift({ time: duration(elapsed), text });
  if (logEntries.length > 150) logEntries.pop();
}

function openModal(title: string, body: string, eyebrow = 'SYSTEM OVERVIEW') {
  $('#modal-title').textContent = title;
  $('#modal-eyebrow').textContent = eyebrow;
  $('#modal-body').innerHTML = body;
  $<HTMLDialogElement>('#modal').showModal();
}

function modelInfo() {
  openModal('有据可循的能量守恒', `
    <p class="modal-intro">这是一个本地交互式物理仿真。所有运行参数来自同一套确定性计算模型，未连接真实现场设备。</p>
    <div class="model-grid"><article><h3>电能平衡</h3><p>光伏 + 风电 + CHP + 燃料电池 + 电网净输入 = 用户电负荷 + 电解槽 + 热泵 + 压缩式制冷耗电。</p></article><article><h3>热与冷的物理边界</h3><p>热泵输出 = 耗电 + 环境吸热。冷量指移走的用户侧热量，冷凝排热 = 冷量 + 驱动电能 / 热能，制冷不创造能量。</p></article><article><h3>氢能储存</h3><p>氢能按低位热值 33.33 kWh/kg 计量。储量变化 =（产氢功率 − 用氢功率）× 时间；容量 4,000 kWh，禁止超充及透支。</p></article><article><h3>边界与假设</h3><p>稳态功率与动态储氢结合；不模拟启停滞后、管道压降、气体状态方程或水处理。净制氢效率已包含辅助用电。不替代工程设计计算。</p></article></div>
    <div class="equation-block"><span>全站第一定律</span><p>可再生电 + 天然气 + 购电 + 环境吸热 + 用户侧移热 + 储氢释放<br>= 用户电热负荷 + 冷凝排热 + 设备损耗 + 售电 + 储氢充入</p><strong>当前残差 ${format(Math.abs(state.residuals.total), 6)} kW</strong></div>
    <div class="efficiency-table"><span>电解净效率 <b>68%</b></span><span>CHP 电 / 热 <b>36% / 46%</b></span><span>燃料电池 电 / 热 <b>52% / 32%</b></span><span>吸收式制冷 COP <b>0.72</b></span></div>`, 'PHYSICS / ENERGY CONSERVATION');
}

function topology() {
  openModal('五种能流，一个协同系统', `
    <p class="modal-intro">点击下方设备可定位到三维园区并查看实时运行参数。所有功率以 kW 计，氢和天然气使用低位热值口径。</p>
    <div class="topology-source"><span>太阳能 / 风能</span><b>→</b><span class="carrier-electricity">电母线 ↔ 外部电网</span><b>→</b><span>用户电负荷</span></div>
    <div class="topology-grid">${devices.filter(d => !['solar', 'wind', 'load', 'gas'].includes(d.id)).map(d => `<button class="topology-device" data-select="${d.id}" style="--carrier:var(--${d.carrier})"><span>${d.code}</span><h3>${d.name}</h3><p>${d.formula}</p><strong>${format(d.values(state)[0][1])} <small>${d.values(state)[0][2]}</small></strong></button>`).join('')}</div>
    <p class="topology-note">${icon('info')}余热优先用于供热与吸收式制冷，热泵及压缩式制冷补足缺口。多余可再生电力优先制氢；电网承担剩余功率平衡。</p>`, 'ENERGY FLOW / TOPOLOGY');
  document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(button => button.addEventListener('click', () => {
    selectDevice(button.dataset.select!);
    ($('#modal') as HTMLDialogElement).close();
  }));
}

function showLogs() {
  openModal('运行记录', `<div class="log-toolbar"><p class="modal-intro">记录本次会话的参数调整与操作。</p><button class="detail-button" id="export-logs">${icon('download')}导出 CSV</button></div><div class="log-list">${logEntries.map(entry => `<div><time>${entry.time}</time><span class="online-dot"></span><p>${entry.text}</p></div>`).join('')}</div>`, 'OPERATIONS / SESSION LOG');
  $('#export-logs').addEventListener('click', () => {
    const csv = '\ufeff模拟时间,事件\n' + logEntries.map(entry => `${entry.time},"${entry.text.replaceAll('"', '""')}"`).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'H2-NEXUS-运行记录.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('运行记录已导出');
  });
}

function selectDevice(id: string) {
  selected = id;
  scene?.select(id);
  $<HTMLSelectElement>('#device-select').value = id;
  updateDevice();
}

function updateDevice() {
  const device = devices.find(d => d.id === selected)!;
  $('#device-name').textContent = device.name;
  $('#device-english').textContent = device.english;
  $('.device-symbol').style.color = palette[device.carrier];
  $('.device-symbol').innerHTML = icon(device.id === 'solar' ? 'sun' : device.id === 'wind' ? 'wind' : device.carrier === 'hydrogen' ? 'tank' : 'activity');
  const values = device.values(state);
  $('#device-values').innerHTML = values.map(([label, value, unit]) => `<div><span>${label}</span><strong>${format(value, label.includes('COP') || unit === 'kg/h' ? 2 : 1)}<small>${unit}</small></strong></div>`).join('');
  $('#device-formula').textContent = device.formula;
  const running = Math.abs(values[0][1]) > 0.01;
  $('#device-status').textContent = running ? '运行' : '待机';
  $('#device-status').classList.toggle('idle', !running);
}

function updateUI() {
  $('#metric-generation').textContent = format(state.generation);
  $('#metric-renewable').textContent = format(state.renewableShare);
  $('#metric-storage').textContent = format(state.nextStored / storageCapacity * 100);
  $('#metric-kg').textContent = format(state.nextStored / 33.33);
  $('#tank-level').style.width = `${state.nextStored / storageCapacity * 100}%`;
  $('#metric-grid').textContent = format(Math.abs(state.grid));
  const exchange = Math.abs(state.grid) < 1e-6 ? 0 : state.grid;
  $('#grid-direction').textContent = exchange > 0 ? '↙' : exchange < 0 ? '↗' : '→';
  $('#grid-label').textContent = exchange > 0 ? '电网购电 · 补足用电缺口' : exchange < 0 ? '余电上网 · 双向功率平衡' : '电网平衡 · 无功率交换';
  $('#residual').textContent = `${format(Math.abs(state.residuals.total), 3)} kW`;
  const rows: [Carrier, number, string][] = [
    ['electricity', state.consumption, '供需平衡'],
    ['heat', state.heatLoad, '供需平衡'],
    ['cold', state.coldLoad, '供需平衡'],
    ['hydrogen', Math.abs(state.hydrogenDelta), state.hydrogenDelta >= 0 ? '净储氢' : '净释氢'],
  ];
  const max = Math.max(...rows.map(row => row[1]), 1);
  $('#balance-rows').innerHTML = rows.map(([carrier, value, label]) => `<div class="balance-row" style="--carrier:var(--${carrier})"><span class="balance-name">${carrierNames[carrier]}</span><div class="balance-track"><i style="width:${Math.max(1, value / max * 100)}%"></i></div><strong>${format(value, 0)}<small>kW</small></strong><span class="balance-status">${label}</span></div>`).join('');
  $('#elapsed').textContent = duration(elapsed);
  scene?.update(state, controls.wind, !paused);
  updateDevice();
}

function refreshControls() {
  for (const key of Object.keys(controls) as (keyof Controls)[]) {
    const input = $<HTMLInputElement>(`#control-${key}`);
    input.value = String(controls[key]);
    input.style.setProperty('--fill', `${(controls[key] - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
    $(`#value-${key}`).textContent = key === 'wind' ? format(controls[key]) : String(controls[key]);
    input.setAttribute('aria-valuetext', `${controls[key]} ${key === 'irradiance' ? '瓦每平方米' : key === 'wind' ? '米每秒' : key === 'temperature' ? '摄氏度' : '百分比'}`);
  }
}

function recalculate() {
  state = simulate(controls, stored, 0);
  updateUI();
}

document.querySelectorAll<HTMLInputElement>('[data-control]').forEach(input => {
  input.addEventListener('input', () => {
    const key = input.dataset.control as keyof Controls;
    controls[key] = Number(input.value);
    if (['irradiance', 'wind', 'temperature'].includes(key)) document.querySelectorAll('.preset').forEach(button => button.classList.remove('active'));
    refreshControls();
    recalculate();
  });
  input.addEventListener('change', () => {
    const labels = { irradiance: '太阳辐照度', wind: '环境风速', temperature: '环境温度', electric: '电负荷', heat: '热负荷', cold: '冷负荷' };
    const key = input.dataset.control as keyof Controls;
    log(`${labels[key]}调整为 ${controls[key]}${key === 'irradiance' ? ' W/m²' : key === 'wind' ? ' m/s' : key === 'temperature' ? ' °C' : '%'}`);
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
  const presets: Record<string, [number, number, number]> = { sunny: [780, 7.2, 26], cloudy: [280, 9.5, 19], night: [0, 4.5, 16] };
  [controls.irradiance, controls.wind, controls.temperature] = presets[button.dataset.preset!];
  document.querySelectorAll('.preset').forEach(p => p.classList.toggle('active', p === button));
  refreshControls();
  recalculate();
  log(`切换气象场景：${button.textContent}`);
}));
$('#reset-controls').addEventListener('click', () => {
  Object.assign(controls, defaults);
  document.querySelectorAll<HTMLButtonElement>('.preset').forEach(p => p.classList.toggle('active', p.dataset.preset === 'sunny'));
  refreshControls();
  recalculate();
  log('气象与负荷已恢复默认值，储氢库存保留');
  toast('已重置气象与负荷，储氢库存保留');
});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.view === 'topology') topology();
  else if (button.dataset.view === 'logs') showLogs();
  else { ($('#modal') as HTMLDialogElement).close(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}));
$('#about').addEventListener('click', modelInfo);
$('#balance-info').addEventListener('click', modelInfo);
$('#modal-close').addEventListener('click', () => ($('#modal') as HTMLDialogElement).close());
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) ($('#modal') as HTMLDialogElement).close(); });
$('#device-select').addEventListener('change', e => selectDevice((e.target as HTMLSelectElement).value));
$('#device-detail').addEventListener('click', () => {
  const device = devices.find(d => d.id === selected)!;
  openModal(device.name, `<p class="modal-intro">${device.description}</p><div class="equation-block"><span>${device.code} / 能量转换</span><p>${device.formula}</p></div><div class="detail-readings">${device.values(state).map(([label, value, unit]) => `<div><span>${label}</span><strong>${format(value, 2)} <small>${unit}</small></strong></div>`).join('')}</div><p class="model-footnote">数值为打开详情时的仿真快照。关闭窗口后可在侧栏持续观察实时参数。</p>`, device.english);
});
$('#control-focus').addEventListener('click', () => {
  $('.controls-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#control-irradiance').focus({ preventScroll: true });
});
$('#pause').addEventListener('click', () => {
  paused = !paused;
  $('#pause').innerHTML = `${icon(paused ? 'play' : 'pause')}<span>${paused ? '继续' : '暂停'}</span>`;
  $('#pause').setAttribute('aria-label', paused ? '继续仿真' : '暂停仿真');
  $('#scene-live-text').textContent = paused ? '仿真已暂停' : '实时仿真';
  $('.scene-live').classList.toggle('is-paused', paused);
  log(paused ? '暂停仿真时钟与能流动画' : '恢复仿真');
  scene?.update(state, controls.wind, !paused);
});
$('#sim-speed').addEventListener('change', e => {
  speed = Number((e.target as HTMLSelectElement).value);
  log(`仿真速度调整为 ${speed}×`);
});
document.querySelectorAll<HTMLButtonElement>('[data-carrier]').forEach(button => button.addEventListener('click', () => {
  filtered = button.dataset.carrier === 'all' || filtered === button.dataset.carrier ? null : button.dataset.carrier as Carrier;
  scene?.setCarrier(filtered);
  document.querySelectorAll<HTMLButtonElement>('[data-carrier]').forEach(b => {
    const active = b.dataset.carrier === (filtered || 'all');
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}));
$('#label-toggle').addEventListener('click', () => {
  if (!scene) return;
  scene.showLabels = !scene.showLabels;
  $('#label-toggle').setAttribute('aria-pressed', String(scene.showLabels));
});
$('#view-reset').addEventListener('click', () => { scene?.resetView(); $('#view-top').classList.remove('active'); });
$('#view-top').addEventListener('click', () => { const top = $('#view-top').classList.toggle('active'); scene?.resetView(top); });
$('#zoom-in').addEventListener('click', () => scene?.zoom(0.85));
$('#zoom-out').addEventListener('click', () => scene?.zoom(1.18));
$('#auto-rotate').addEventListener('click', () => {
  const active = $('#auto-rotate').getAttribute('aria-pressed') !== 'true';
  $('#auto-rotate').setAttribute('aria-pressed', String(active));
  scene?.setAutoRotate(active);
});
$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('.scene-card').requestFullscreen();
  } catch { toast('当前浏览器不支持全屏，可使用缩放与视角工具'); }
});

function drawTrend() {
  const width = 540, height = 130, left = 40, right = 12, top = 12, bottom = 24;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const max = Math.max(500, Math.ceil(Math.max(...history.flatMap(p => [p.generation, p.demand, p.hydrogen]), 0) / 500) * 500);
  const latest = history.at(-1)?.second || 0;
  const x = (second: number) => left + (second - latest + 60) / 60 * plotWidth;
  const y = (value: number) => top + plotHeight * (1 - value / max);
  const lines = ['generation', 'demand', 'hydrogen'] as const;
  const colors = [palette.electricity, palette.cold, palette.hydrogen];
  const grid = [0, 0.5, 1].map(t => `<line x1="${left}" x2="${width - right}" y1="${y(t * max)}" y2="${y(t * max)}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${left - 8}" y="${y(t * max) + 3}" text-anchor="end">${Math.round(t * max)}</text>`).join('');
  const paths = lines.map((key, index) => {
    const points = history.map((point, i) => `${i ? 'L' : 'M'}${x(point.second).toFixed(1)} ${y(point[key]).toFixed(1)}`).join(' ');
    const last = history.at(-1);
    return `<path d="${points}" fill="none" stroke="${colors[index]}" stroke-width="1.8"/>${last ? `<circle cx="${x(last.second)}" cy="${y(last[key])}" r="2.8" fill="${colors[index]}"/>` : ''}`;
  }).join('');
  const ticks = [0, 15, 30, 45, 60].map(t => `<text x="${left + t / 60 * plotWidth}" y="${height - 3}" text-anchor="middle">${t === 60 ? '现在' : `−${60 - t}s`}</text>`).join('');
  $('#trend-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${grid}${paths}${ticks}</svg>`;
}

refreshControls();
updateUI();
history.push({ second: 0, generation: state.generation, demand: state.consumption, hydrogen: state.electrolyzer });
drawTrend();
requestAnimationFrame(() => {
  try {
    scene = new EnergyScene($('#scene'), selectDevice);
    scene.onFps = fps => { $('#fps').textContent = `${fps} FPS`; };
    scene.update(state, controls.wind, !paused);
    $('#scene-loading').remove();
  } catch (error) {
    console.error(error);
    $('#scene-loading').innerHTML = `<div class="webgl-fallback">${icon('info')}<h3>三维视图暂不可用</h3><p>请启用浏览器硬件加速并重新加载。能量仿真与设备选择仍可使用。</p><button id="retry-scene" class="detail-button">重新加载</button></div>`;
    $('#retry-scene').addEventListener('click', () => location.reload());
  }
});
let previous = performance.now();
let historySeconds = 0;
setInterval(() => {
  const now = performance.now();
  const dt = Math.min((now - previous) / 1000, 2);
  previous = now;
  $('#clock').textContent = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '.');
  if (!paused) {
    state = simulate(controls, stored, dt * speed);
    stored = state.nextStored;
    elapsed += dt * speed;
    historySeconds += dt;
    history.push({ second: historySeconds, generation: state.generation, demand: state.consumption, hydrogen: state.electrolyzer });
    while (history.length > 1 && history[0].second < historySeconds - 60) history.shift();
    updateUI();
    drawTrend();
  }
}, 1000);
window.addEventListener('pagehide', event => {
  if (!event.persisted) scene?.dispose();
});
