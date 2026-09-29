import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Box,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDot,
  Clock3,
  Crosshair,
  Expand,
  FileCheck2,
  Focus,
  Grid2X2,
  Layers3,
  Minus,
  Orbit,
  PanelTop,
  Pause,
  Plane,
  Play,
  Plus,
  Radio,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  SquareStack,
  Tag,
  Wind,
  X,
} from 'lucide-react';
import { Scene } from './scene/Scene';
import { EngineGauge, HealthBars, MaterialChart, StrainChart } from './components/Charts';
import { components, events } from './data';
import { initialState, viewerReducer } from './state';

function IconButton({ label, children, active, ...props }) {
  return (
    <button
      className={`icon-button ${active ? 'active' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      {...props}
    >
      {children}
      <span className="tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

function SectionTitle({ icon: Icon, title, meta, children }) {
  return (
    <div className="section-title">
      <div>
        {Icon && <Icon size={14} />}
        <h2>{title}</h2>
      </div>
      {children || <span>{meta}</span>}
    </div>
  );
}

function PartIcon({ type }) {
  const Icon =
    {
      cockpit: PanelTop,
      body: Box,
      wing: Wind,
      engine: Orbit,
      tail: Plane,
      cabin: Grid2X2,
      gear: CircleDot,
    }[type] || Box;
  return <Icon size={15} strokeWidth={1.5} />;
}

function Report({ onClose, onDownload, selected }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      className="report-dialog"
      aria-labelledby="report-title"
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="report-heading">
        <span id="report-title">
          <FileCheck2 size={19} />
          结构检测报告
        </span>
        <IconButton label="关闭报告" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <div className="report-body">
        <p className="eyebrow">STRUCTURAL INTEGRITY REPORT</p>
        <h2>BOEING 787-9</h2>
        <p className="report-date">
          样机 B-789 · {new Date().toLocaleDateString('zh-CN')} · 演示数据
        </p>
        <div className="report-result">
          <ShieldCheck size={27} />
          <div>
            <strong>结构状态正常</strong>
            <span>{selected ? '当前总成检测在演示阈值内' : '9 项总成检测均在演示阈值内'}</span>
          </div>
          <b>
            {selected ? selected.health.toFixed(1) : '99.6'}
            <small>%</small>
          </b>
        </div>
        <table>
          <thead>
            <tr>
              <th>检测总成</th>
              <th>结构健康度</th>
              <th>结论</th>
            </tr>
          </thead>
          <tbody>
            {(selected ? [selected] : components).map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.health.toFixed(1)}%</td>
                <td>
                  <span className="healthy-label">
                    <Check size={12} />
                    通过
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="report-note">
          本报告为可视化演示。模型与数值不用于实际飞机维护、适航或工程判断。
        </p>
        <button className="primary-button" onClick={onDownload}>
          <ArrowDownToLine size={15} />
          下载 JSON 报告
        </button>
      </div>
    </dialog>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(viewerReducer, initialState);
  const [tab, setTab] = useState('structure'),
    [ready, setReady] = useState(false);
  const [time, setTime] = useState(new Date()),
    [range, setRange] = useState('30');
  const [toast, setToast] = useState(''),
    [report, setReport] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const sceneRef = useRef(null),
    toastTimer = useRef(null);
  const selected = components.find((c) => c.id === state.selected);
  const activeTab =
    tab === 'monitoring' ? 'monitoring' : state.mode === 'assembled' ? 'overview' : 'structure';
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  };
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    const syncFullScreen = () => setFullScreen(Boolean(document.fullscreenElement));
    const keydown = (event) => {
      if (event.key === 'Escape' && !report) dispatch({ type: 'select', id: null });
    };
    document.addEventListener('fullscreenchange', syncFullScreen);
    document.addEventListener('keydown', keydown);
    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', syncFullScreen);
      document.removeEventListener('keydown', keydown);
    };
  }, [report]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  function changeTab(value) {
    setTab(value);
    if (value === 'overview') dispatch({ type: 'mode', mode: 'assembled' });
    if (value === 'structure') dispatch({ type: 'mode', mode: 'exploded' });
    if (value === 'monitoring') dispatch({ type: 'select', id: null });
  }
  function changeMode(mode) {
    dispatch({ type: 'mode', mode });
    setTab(mode === 'assembled' ? 'overview' : 'structure');
  }
  function togglePlayback() {
    if (state.playing)
      dispatch({ type: 'explosion', value: sceneRef.current?.getExplosion() ?? state.explosion });
    dispatch({ type: 'toggle', key: 'playing' });
  }
  function download(url, name) {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  }
  function exportImage() {
    const data = sceneRef.current?.export();
    if (!data) {
      notify('模型尚未准备就绪');
      return;
    }
    download(data, `B787-9-${state.mode}.png`);
    notify('三维视图已导出为 PNG');
  }
  function downloadReport() {
    const payload = {
      aircraft: 'Boeing 787-9',
      sample: 'B-789',
      generatedAt: new Date().toISOString(),
      source: 'SIMULATED DEMONSTRATION DATA - NOT FOR ENGINEERING USE',
      components: selected ? [selected] : components,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    download(url, 'B787-9-structural-report.json');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('检测报告已导出');
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify('当前浏览器不支持全屏模式');
    }
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            changeTab('overview');
            dispatch({ type: 'reset' });
          }}
          aria-label="AEROSTRUCT 首页"
        >
          <span className="brand-mark">
            <Layers3 size={25} strokeWidth={1.7} />
          </span>
          <div>
            <strong>
              AEROSTRUCT<span>®</span>
            </strong>
            <small>航空结构数字孪生</small>
          </div>
        </a>
        <nav className="main-nav" aria-label="主导航">
          {[
            ['overview', Plane, '飞机总览'],
            ['structure', Layers3, '结构拆解'],
            ['monitoring', Activity, '系统监测'],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              className={activeTab === id ? 'active' : ''}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => changeTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="demo-badge">
            <i />
            演示环境
          </span>
          <div className="clock">
            <strong>{time.toLocaleTimeString('en-GB', { hour12: false })}</strong>
            <span>{time.toLocaleDateString('en-CA')}</span>
          </div>
          <span className="topbar-divider" />
          <IconButton
            label={fullScreen ? '退出全屏' : '全屏显示'}
            active={fullScreen}
            onClick={toggleFullscreen}
          >
            <Expand size={17} />
          </IconButton>
        </div>
      </header>

      <div className="contextbar">
        <div>
          <span>数字机库</span>
          <ChevronRight size={12} />
          <span>宽体客机</span>
          <ChevronRight size={12} />
          <b>Boeing 787-9</b>
          <span className="version-tag">DIGITAL TWIN</span>
        </div>
        <div className="context-meta">
          <span>
            MODEL ID <b>B789-001</b>
          </span>
          <span className="online-indicator">
            <i />
            模型在线
          </span>
        </div>
      </div>

      <main className="dashboard">
        <aside className="left-rail">
          <section className="aircraft-profile">
            <SectionTitle icon={Plane} title="飞机档案" meta="AIRCRAFT" />
            <div className="profile-name">
              <h3>
                787-9 <span>Dreamliner</span>
              </h3>
              <span className="cert-badge">宽体双发</span>
            </div>
            <div className="profile-metrics">
              <div>
                <span>机身长度</span>
                <strong>
                  62.81<small>m</small>
                </strong>
              </div>
              <div>
                <span>翼展</span>
                <strong>
                  60.12<small>m</small>
                </strong>
              </div>
              <div>
                <span>最大起飞重量</span>
                <strong>
                  254<small>t</small>
                </strong>
              </div>
              <div>
                <span>典型航程</span>
                <strong>
                  14,140<small>km</small>
                </strong>
              </div>
            </div>
            <div className="profile-foot">
              <span>BOEING COMMERCIAL AIRPLANES</span>
              <ArrowRight size={12} />
            </div>
          </section>
          <section className="assembly-section">
            <SectionTitle icon={Layers3} title="结构总成" meta="09 ASSEMBLIES" />
            <div className="assembly-list">
              {components.map((component, i) => (
                <button
                  key={component.id}
                  aria-pressed={state.selected === component.id}
                  className={`assembly-item ${state.selected === component.id ? 'selected' : ''}`}
                  onClick={() =>
                    dispatch({
                      type: 'select',
                      id: state.selected === component.id ? null : component.id,
                    })
                  }
                >
                  <span className="assembly-index">{String(i + 1).padStart(2, '0')}</span>
                  <PartIcon type={component.icon} />
                  <span className="assembly-name">
                    {component.name}
                    <small>{component.code}</small>
                  </span>
                  <i className="assembly-dot" />
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
            <div className="assembly-summary">
              <span>
                <CheckCheck size={13} />
                全部总成已加载
              </span>
              <b>9 / 9</b>
            </div>
          </section>
        </aside>

        <section className="viewer" aria-label="飞机三维视图">
          <div className="viewer-heading">
            <div>
              <div className="viewer-eyebrow">
                <i />
                AIRFRAME DIGITAL TWIN <span> / 001</span>
              </div>
              <h1>
                BOEING <strong>787-9</strong>
              </h1>
              <p>
                DREAMLINER
                <span />
                结构数字孪生
              </p>
            </div>
            <div className="viewer-status">
              <span className="live-dot" />
              <span>{ready ? '三维场景已就绪' : '正在构建三维场景'}</span>
              <small>LOD 01 · HIGH DETAIL</small>
            </div>
          </div>
          <Scene
            ref={sceneRef}
            state={state}
            onSelect={(id) => dispatch({ type: 'select', id })}
            onReady={() => setReady(true)}
          />
          {!ready && (
            <div className="loading-state">
              <div />
              <span>正在构建数字样机</span>
            </div>
          )}
          <div className="viewer-side-tools">
            <IconButton label="放大" onClick={() => sceneRef.current?.zoom(0.85)}>
              <Plus size={17} />
            </IconButton>
            <IconButton label="缩小" onClick={() => sceneRef.current?.zoom(1.17)}>
              <Minus size={17} />
            </IconButton>
            <span />
            <IconButton
              label="重置视图"
              onClick={() => {
                dispatch({ type: 'reset' });
                setTab('overview');
              }}
            >
              <Focus size={17} />
            </IconButton>
            <IconButton label="导出视图" onClick={exportImage}>
              <ArrowDownToLine size={16} />
            </IconButton>
          </div>
          <div className="view-presets">
            <button
              className={state.camera === 'perspective' ? 'active' : ''}
              onClick={() => dispatch({ type: 'camera', camera: 'perspective' })}
            >
              透视
            </button>
            <button
              className={state.camera === 'top' ? 'active' : ''}
              onClick={() => dispatch({ type: 'camera', camera: 'top' })}
            >
              俯视
            </button>
            <button
              className={state.camera === 'side' ? 'active' : ''}
              onClick={() => dispatch({ type: 'camera', camera: 'side' })}
            >
              侧视
            </button>
            <button
              className={state.camera === 'front' ? 'active' : ''}
              onClick={() => dispatch({ type: 'camera', camera: 'front' })}
            >
              前视
            </button>
          </div>
          <div className="axis-gizmo" aria-hidden="true">
            <span className="axis-y">Y</span>
            <span className="axis-x">X</span>
            <span className="axis-z">Z</span>
            <i />
            <b />
            <em />
          </div>
          <div className="viewer-bottom">
            <div
              className={`explosion-control ${state.mode === 'exploded' ? 'visible' : ''}`}
              aria-hidden={state.mode !== 'exploded'}
            >
              <span>拆解程度</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(state.explosion * 100)}
                disabled={state.mode !== 'exploded' || state.playing}
                aria-label="拆解程度"
                onChange={(event) =>
                  dispatch({ type: 'explosion', value: Number(event.target.value) / 100 })
                }
                style={{ '--progress': `${state.explosion * 100}%` }}
              />
              <b>{state.playing ? 'AUTO' : `${Math.round(state.explosion * 100)}%`}</b>
              <IconButton
                label={state.playing ? '暂停拆解演示' : '播放拆解演示'}
                active={state.playing}
                onClick={togglePlayback}
              >
                {state.playing ? <Pause size={13} /> : <Play size={13} />}
              </IconButton>
            </div>
            <div className="viewer-toolbar">
              <div className="mode-control" aria-label="模型模式">
                {[
                  ['assembled', Box, '整机视图'],
                  ['exploded', Layers3, '爆炸视图'],
                  ['cutaway', ScanLine, '剖面视图'],
                ].map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    className={state.mode === mode ? 'active' : ''}
                    aria-pressed={state.mode === mode}
                    onClick={() => changeMode(mode)}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
              <span className="tool-divider" />
              <div className="display-control">
                <IconButton
                  label="自动旋转"
                  active={state.autoRotate}
                  onClick={() => dispatch({ type: 'toggle', key: 'autoRotate' })}
                >
                  <RotateCcw size={15} />
                </IconButton>
                <IconButton
                  label="部件标注"
                  active={state.labels}
                  onClick={() => dispatch({ type: 'toggle', key: 'labels' })}
                >
                  <Tag size={15} />
                </IconButton>
                <IconButton
                  label="坐标网格"
                  active={state.grid}
                  onClick={() => dispatch({ type: 'toggle', key: 'grid' })}
                >
                  <Grid2X2 size={15} />
                </IconButton>
              </div>
            </div>
            <div className="viewer-caption">
              <span>
                <span className="mini-cross">+</span>{' '}
                {state.mode === 'assembled'
                  ? 'ASSEMBLED CONFIGURATION'
                  : state.mode === 'exploded'
                    ? 'EXPLODED CONFIGURATION'
                    : 'SECTIONAL CONFIGURATION'}
              </span>
              <span>PARAMETRIC MODEL · 1:2</span>
            </div>
          </div>
        </section>

        <aside className="right-rail">
          <section className="health-section">
            <SectionTitle
              icon={selected ? Crosshair : ShieldCheck}
              title={selected ? '部件详情' : tab === 'monitoring' ? '系统状态监测' : '结构健康评估'}
            >
              {selected ? (
                <IconButton
                  label="取消部件选择"
                  onClick={() => dispatch({ type: 'select', id: null })}
                >
                  <X size={13} />
                </IconButton>
              ) : (
                <span className="healthy-label">
                  <i />
                  状态正常
                </span>
              )}
            </SectionTitle>
            {selected ? (
              <div className="component-inspector">
                <div className="component-code">
                  {selected.code}
                  <span>SELECTED</span>
                </div>
                <h3>{selected.name}</h3>
                <small>{selected.en}</small>
                <p>{selected.description}</p>
                <div className="component-properties">
                  <div>
                    <span>结构材料</span>
                    <b>{selected.material}</b>
                  </div>
                  <div>
                    <span>示意质量</span>
                    <b>
                      {selected.mass} <small>kg</small>
                    </b>
                  </div>
                  <div>
                    <span>应力读数</span>
                    <b>
                      {selected.stress} <small>MPa</small>
                    </b>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="health-score">
                  <div>
                    <strong>{tab === 'monitoring' ? '100.0' : '99.6'}</strong>
                    <span>%</span>
                    <small>{tab === 'monitoring' ? '关键系统在线率' : '综合结构健康度'}</small>
                  </div>
                  <div className="score-trend">
                    <span>
                      <Activity size={12} />
                      稳定
                    </span>
                    <div>
                      {[10, 17, 14, 24, 17, 30, 23, 32, 30, 34, 33, 39, 37, 44, 42, 45].map(
                        (h, i) => (
                          <i key={i} style={{ height: h }} />
                        ),
                      )}
                    </div>
                  </div>
                </div>
                <HealthBars monitoring={tab === 'monitoring'} />
              </>
            )}
            <button className="report-link" onClick={() => setReport(true)}>
              <FileCheck2 size={13} />
              <span>{selected ? '查看部件检测报告' : '查看结构检测报告'}</span>
              <ArrowRight size={13} />
            </button>
          </section>
          <section className="engine-section">
            <SectionTitle icon={Orbit} title="动力系统" meta="GEnx-1B" />
            <div className="engine-gauges">
              <EngineGauge value={84.2} index={1} temperature={642} />
              <EngineGauge value={84.5} index={2} temperature={638} />
            </div>
            <div className="engine-foot">
              <span>
                <i />
                双发运行正常
              </span>
              <span>SIMULATED</span>
            </div>
          </section>
          <section className="sensor-section">
            <SectionTitle icon={Radio} title="传感网络" meta="SENSOR NETWORK" />
            <div className="sensor-metrics">
              <div>
                <strong>
                  1,284<span>/ 1,284</span>
                </strong>
                <small>
                  <i />
                  节点在线
                </small>
              </div>
              <div className="sensor-pulse">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="sensor-foot">
              <span>
                采样频率 <b>100 Hz</b>
              </span>
              <span>
                数据延迟 <b>12 ms</b>
              </span>
            </div>
          </section>
        </aside>

        <section className="bottom-panels">
          <section className="material-panel">
            <SectionTitle icon={SquareStack} title="机体材料构成" meta="BY WEIGHT" />
            <MaterialChart />
          </section>
          <section className="strain-panel">
            <SectionTitle icon={Activity} title="机翼应变趋势">
              <div className="chart-tools">
                <span className="chart-legend">
                  <i />
                  左翼
                  <i />
                  右翼
                </span>
                <select
                  aria-label="应变趋势时间范围"
                  value={range}
                  onChange={(event) => setRange(event.target.value)}
                >
                  <option value="30">近 30 分钟</option>
                  <option value="15">近 15 分钟</option>
                </select>
              </div>
            </SectionTitle>
            <span className="chart-unit">με</span>
            <StrainChart range={range} />
          </section>
          <section className="event-panel">
            <SectionTitle icon={Clock3} title="检测动态" meta="LATEST EVENTS" />
            <div className="event-table">
              <div className="event-table-head">
                <span>时间</span>
                <span>检测项目</span>
                <span>状态</span>
              </div>
              {events.map((event) => (
                <div className="event-row" key={event.code}>
                  <time>{event.time}</time>
                  <div>
                    {event.name}
                    <small>{event.code}</small>
                  </div>
                  <span>
                    <Check size={11} />
                    {event.state}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
      <footer className="statusbar">
        <span>
          <i />
          AEROSTRUCT ENGINE <b>v1.0</b>
          <span className="status-divider" />
          结构可视化工作站
        </span>
        <span>
          示意模型 · 模拟监测数据 · 非工程用途
          <span className="status-divider" />
          <span className="footer-location">AIRFRAME LAB / CN</span>
        </span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
      {report && (
        <Report selected={selected} onClose={() => setReport(false)} onDownload={downloadReport} />
      )}
    </div>
  );
}
