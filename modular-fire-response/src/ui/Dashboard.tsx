import { useState, type ReactNode } from "react";
import {
  Search,
  Play,
  Pause,
  RotateCcw,
  Focus,
  Plus,
  Minus,
  Orbit,
  ChevronDown,
  ChevronUp,
  Droplets,
  Radio,
  Users,
  Truck,
  X,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
  Package,
} from "lucide-react";
import type { DashboardProps } from "./types";
import type { SimulationState, UnitKind } from "../types";
import { KIND_LABELS, STATUS_LABELS, PHASES, STATIONS } from "../simulation";
import { EquipmentIllustration, orderEquipmentUnits, UnitIcon } from "./UnitVisual";
import { ForceSummary, SupplyGauge, TaskMap } from "./CommandOverview";
import { SystemIntroduction } from "./SystemIntroduction";
import { CargoRescueIntervention } from "./CargoRescueIntervention";
import "./Dashboard.css";
import "./NightTheme.css";
const clock = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
function Meter({
  label,
  value,
  max = 100,
  unit = "%",
  water = false,
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  water?: boolean;
}) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong>
          {Math.round(value)}
          <small>{unit}</small>
        </strong>
      </div>
      <progress aria-label={label} className={water ? "water" : ""} value={value} max={max} />
    </div>
  );
}
function IconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
const flagLabels: Record<Exclude<keyof SimulationState["flags"], "liftConcept">, string> = {
  blockedRoad: "道路阻断",
  lowWater: "水源不足",
  droneFault: "无人机故障",
  powerFault: "能源故障",
  airConcept: "系留空中灭火 · 研究概念",
};
export function Dashboard(p: DashboardProps) {
  const { state: s, command: c } = p;
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false),
    [mobileDetails, setMobileDetails] = useState(false);
  const [tab, setTab] = useState<"mission" | "events" | "conditions">(
    "mission",
  );
  const selected = s.units.find((u) => u.id === p.selectedId),
    station = STATIONS.find((st) => st.id === p.selectedId);
  const results = s.units.filter((u) =>
    `${u.name} ${KIND_LABELS[u.kind]}`.includes(query.trim()),
  );
  const select = (id: string) => {
    p.select(id);
    setQuery("");
    setMobileDetails(true);
  };
  const collapsePanels = () => {
    setExpanded(false);
    setMobileDetails(false);
  };
  const restoreOverview = () => {
    collapsePanels();
    p.camera("reset");
  };
  const replay = () => {
    collapsePanels();
    c({ type: "reset" });
  };
  return (
    <div className="dashboard">
      <header className="topbar">
        <button
          className="brand"
          aria-label="FIRELINK 分布式智能消防"
          onClick={() => {
            p.select("incident");
            restoreOverview();
          }}
          title="返回火场全景"
        >
          <span className="brand-mark">
            <ShieldCheck size={27} aria-hidden="true" />
          </span>
          <span>
            <b>分布式智能消防系统</b>
            <small>FIRELINK / 联合响应指挥</small>
          </span>
        </button>
        <div className="view-tabs" role="tablist" aria-label="场景视图">
          {(
            [
              ["overview", "任务沙盘"],
              ["follow", "现场跟随"],
              ["command", "指挥总览"],
            ] as const
          ).map(([id, label]) => (
            <button
              role="tab"
              aria-selected={p.view === id}
              key={id}
              onClick={() => p.setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <Search size={15} />
          <input
            type="search"
            aria-label="搜索装备"
            placeholder="搜索装备"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
              if (e.key === "Enter" && query.trim() && results[0])
                select(results[0].id);
            }}
          />
          {query && (
            <div className="search-results" role="listbox">
              {results.length ? (
                results.map((u) => (
                  <button
                    role="option"
                    aria-selected={p.selectedId === u.id}
                    key={u.id}
                    onClick={() => select(u.id)}
                  >
                    {u.name}
                    <small>{STATUS_LABELS[u.status]}</small>
                  </button>
                ))
              ) : (
                <span>未找到装备</span>
              )}
            </div>
          )}
        </div>
        <SystemIntroduction state={s} command={c} />
        <select
          className="mode-select"
          aria-label="演示模式"
          value={s.mode}
          onChange={(e) =>
            c({ type: "mode", value: e.target.value as "guided" | "command" })
          }
        >
          <option value="guided">引导演示</option>
          <option value="command">人工指挥</option>
        </select>
      </header>
      <section className="mission-heading">
        <div className="eyebrow">
          <span className="live-dot" />
          夜间行动 / INCIDENT 001
        </div>
        <h1>高层建筑协同救援</h1>
        <p>
          滨河街区 <span>·</span> {STATIONS.length} 个分布式站点 <span>·</span> {new Set(s.units.map(u => u.kind)).size} 类装备
        </p>
      </section>
      <section className="metrics" aria-label="响应指标">
        <div>
          <Radio size={16} />
          <span>
            首轮侦察
            <strong>
              {s.metrics.firstRecon === null
                ? "待到场"
                : `${s.metrics.firstRecon.toFixed(0)}s`}
            </strong>
          </span>
        </div>
        <div>
          <Truck size={16} />
          <span>
            现场就绪
            <strong>
              {
                s.units.filter((u) =>
                  ["working", "deploying"].includes(u.status),
                ).length
              }
              <small> / {s.units.length}</small>
            </strong>
          </span>
        </div>
        <div>
          <Users size={16} />
          <span>
            安全转移
            <strong>
              {s.life.rescued}
              <small> / 2</small>
            </strong>
          </span>
        </div>
      </section>
      {p.contextLost && (
        <div role="alert" className="graphic-alert">
          图形渲染暂不可用，请检查硬件加速后刷新。调度面板仍可使用。
        </div>
      )}
      <button
        className="mobile-inspector-toggle"
        aria-controls="inspector"
        aria-expanded={mobileDetails}
        onClick={() => setMobileDetails(!mobileDetails)}
      >
        <Layers size={15} />
        {mobileDetails ? "收起详情" : "任务详情"}
        {mobileDetails ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      <aside id="inspector" aria-labelledby="inspector-title" className={`inspector ${mobileDetails ? "mobile-open" : ""}`}>
        <div className="command-rail-title">
          <b>指挥中心</b>
          <time>{clock(s.time)}</time>
        </div>
        <div className="inspector-heading">
          <span className="eyebrow">
            {selected
              ? "装备档案"
              : station
                ? "分布式站点"
                : p.selectedId === "water-node"
                  ? "供水网络"
                  : "现场态势"}
          </span>
          <button
            className="icon-button close-details"
            aria-label="关闭详情"
            onClick={() => setMobileDetails(false)}
          >
            <X size={16} />
          </button>
          <span
            className="status-pill"
            role="status"
            data-status={selected?.status ?? (s.complete ? "complete" : "responding")}
          >
            {selected
              ? STATUS_LABELS[selected.status]
              : s.complete
                ? "演示结束"
                : "响应中"}
          </span>
        </div>
        <h2 id="inspector-title">
          {selected && <UnitIcon kind={selected.kind} size={21} />}
          <span>{selected?.name ??
            station?.name ??
            (p.selectedId === "water-node" ? "移动供水枢纽" : "滨河 01 号楼")}</span>
        </h2>
        <p className="inspector-sub">
          {selected
            ? `${selected.id.toUpperCase()} / ${KIND_LABELS[selected.kind]}`
            : station
              ? "模块化设备集结与整备"
              : p.selectedId === "water-node"
                ? "移动增压车 + 车载缓冲水箱"
                : "住宅建筑 / 8 层 / 东侧立面"}
        </p>
        {selected ? (
          <>
            <div className="unit-task">
              <Activity size={16} />
              {selected.task}
            </div>
            <Meter label="电池余量" value={selected.battery} />
            {selected.kind === "water" && (
              <Meter
                label="车载水量"
                value={selected.water}
                max={selected.capacity}
                unit=" L"
                water
              />
            )}
            {selected.kind === "booster" && (
              <>
                <Meter label="缓冲水箱" value={s.water.buffer} max={s.water.capacity} unit=" L" water />
                <div className="water-grid">
                  <div><small>管网状态</small><b className="network-state">{s.water.connected ? "已并网" : "已断开"}</b></div>
                  <div><small>输出流量</small><b>{s.water.outflow.toFixed(0)} <span>L/s</span></b></div>
                </div>
              </>
            )}
            {selected.kind === "cargo" && (
              <>
                <div className="cargo-delivery"><Package size={15} />物资交付<strong>{s.metrics.delivered}<small> / 4 组</small></strong></div>
                <CargoRescueIntervention {...p} select={select} />
              </>
            )}
            <dl className="fact-list">
              <div>
                <dt>所属站点</dt>
                <dd>
                  {STATIONS.find((st) => st.id === selected.station)?.name ??
                    selected.station}
                </dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd>{STATUS_LABELS[selected.status]}</dd>
              </div>
            </dl>
            <div className="action-row">
              <button onClick={() => p.camera("focus")}>
                <Focus size={14} />
                定位装备
              </button>
              {["standby", "recalled", "returning"].includes(
                selected.status,
              ) ? (
                <button
                  onClick={() => c({ type: "dispatch", id: selected.id })}
                >
                  <ArrowUpRight size={14} />
                  出动
                </button>
              ) : (
                <button onClick={() => c({ type: "recall", id: selected.id })}>
                  撤回
                </button>
              )}
            </div>
          </>
        ) : station ? (
          <div className="station-units">
            {s.units
              .filter((u) => u.station === station.id)
              .map((u) => (
                <button key={u.id} onClick={() => select(u.id)}>
                  <UnitIcon kind={u.kind} size={17} />
                  <span>
                    {u.name}
                    <small>{STATUS_LABELS[u.status]}</small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
          </div>
        ) : (
          <>
            <div className="inspector-tabs">
              {(
                [
                  ["mission", "任务"],
                  ["events", "事件"],
                  ["conditions", "干预"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={tab === key ? "active" : ""}
                  onClick={() => setTab(key)}
                >
                  {label}
                  {key === "events" && <small>{s.events.length}</small>}
                </button>
              ))}
            </div>
            {tab === "mission" && (
              <>
                <div className="life-state">
                  <span
                    className={`signal ${s.life.confirmed ? "confirmed" : ""}`}
                  >
                    <Users size={18} />
                  </span>
                  <div>
                    <b>
                      {s.life.rescued
                        ? "人员已转移"
                        : s.life.confirmed
                          ? "受困人员已复核"
                          : s.life.detected
                            ? "疑似生命信号"
                            : "正在建立侦察链路"}
                    </b>
                    <small>
                      {s.life.detected
                        ? s.life.source
                        : "侦察与首批地面出动并行"}
                    </small>
                  </div>
                </div>
                <ForceSummary units={s.units} />
                <div className="section-label">
                  <Droplets size={15} />
                  供水保障<span>{s.water.connected ? "已并网" : "待连接"}</span>
                </div>
                <div className="supply-overview">
                  <SupplyGauge buffer={s.water.buffer} capacity={s.water.capacity} />
                  <div className="supply-readings">
                    <Meter
                      label="增压车缓冲水箱"
                      value={s.water.buffer}
                      max={s.water.capacity}
                      unit=" L"
                      water
                    />
                    <div className="water-grid">
                      <div>
                        <small>补给流量</small>
                        <b>{s.water.inflow.toFixed(0)} <span>L/s</span></b>
                      </div>
                      <div>
                        <small>喷射流量</small>
                        <b>{s.water.outflow.toFixed(0)} <span>L/s</span></b>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="supply-status">
                  <span
                    className={`live-dot ${s.water.sourceAvailable ? "" : "warning"}`}
                  />
                  {s.water.sourceAvailable ? "水源可用" : "水源不足"}
                  <span>补水 {s.water.refillCycles} 次</span>
                </div>
                <TaskMap state={s} selectedId={p.selectedId} select={select} />
                <div className="section-label">
                  <ShieldCheck size={15} />
                  人机协同
                </div>
                <ol className="checklist">
                  <li className={s.approvals.dispatch ? "done" : ""}>
                    地面车组出动
                    <span>{s.approvals.dispatch ? "已授权" : "待授权"}</span>
                  </li>
                  <li className={s.approvals.connection ? "done" : ""}>
                    现场管路连接
                    <span>{s.approvals.connection ? "已授权" : "待授权"}</span>
                  </li>
                  <li className={s.life.confirmed ? "done" : ""}>
                    生命信号复核
                    <span>{s.life.confirmed ? "已确认" : "待复核"}</span>
                  </li>
                  <li className={s.approvals.rescue ? "done" : ""}>
                    云梯人员救援
                    <span>{s.approvals.rescue ? "已授权" : "待授权"}</span>
                  </li>
                </ol>
                {s.mode === "command" && (
                  <div className="approval-actions">
                    {!s.approvals.dispatch && (
                      <button
                        onClick={() => c({ type: "approve", key: "dispatch" })}
                      >
                        授权车组出动
                      </button>
                    )}
                    {!s.approvals.connection && (
                      <button
                        onClick={() =>
                          c({ type: "approve", key: "connection" })
                        }
                      >
                        确认供水连接
                      </button>
                    )}
                    {!s.life.confirmed && (
                      <button
                        disabled={!s.life.detected}
                        onClick={() => c({ type: "confirm-life" })}
                      >
                        人工复核生命信号
                      </button>
                    )}
                    {!s.approvals.rescue && (
                      <button
                        disabled={!s.life.confirmed}
                        onClick={() => c({ type: "approve", key: "rescue" })}
                      >
                        授权云梯救援
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {tab === "events" && (
              <div className="event-list">
                {[...s.events].reverse().map((e) => (
                  <div key={e.id} className={e.level}>
                    <time>{clock(e.time)}</time>
                    <p>{e.text}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "conditions" && (
              <div className="conditions">
                <CargoRescueIntervention {...p} select={select} />
                {Object.entries(flagLabels).map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={s.flags[key as keyof typeof s.flags]}
                      onChange={(e) =>
                        c({
                          type: "flag",
                          key: key as keyof typeof s.flags,
                          value: e.target.checked,
                        })
                      }
                    />
                  </label>
                ))}
                <p className="concept-note">
                  系留水带协同为研究概念，未作工程验证。
                </p>
              </div>
            )}
          </>
        )}
        <div className="inspector-footer">
          <span className="live-dot" />
          前端概念模拟<span>非实战指挥系统</span>
        </div>
      </aside>
      <div className="scene-controls">
        <IconButton label="聚焦选中对象" onClick={() => p.camera("focus")}>
          <Focus size={17} />
        </IconButton>
        <IconButton label="恢复全景" onClick={restoreOverview}>
          <RotateCcw size={17} />
        </IconButton>
        <IconButton label="放大" onClick={() => p.camera("zoomIn")}>
          <Plus size={18} />
        </IconButton>
        <IconButton label="缩小" onClick={() => p.camera("zoomOut")}>
          <Minus size={18} />
        </IconButton>
        <IconButton
          label="环绕巡览"
          active={p.touring}
          onClick={() => p.setTouring(!p.touring)}
        >
          <Orbit size={18} />
        </IconButton>
      </div>
      <div className="scene-legend">
        <span>
          <i className="red" />
          消防装备
        </span>
        <span>
          <i className="cyan" />
          供水链路
        </span>
        <span>
          <i className="amber" />
          研究概念
        </span>
      </div>
      {s.complete && (
        <section className="completion">
          <ShieldCheck size={24} />
          <div>
            <b>
              {s.life.rescued
                ? "本轮协同救援完成"
                : "本轮演示结束 · 救援未完成"}
            </b>
            <p>
              转移 {s.life.rescued} 人 · 物资 {s.metrics.delivered} 组 · 用水{" "}
              {Math.round(s.water.totalUsed)} L
            </p>
          </div>
        </section>
      )}
      <footer className={`bottom-panel ${expanded ? "expanded" : ""}`}>
        <div className="timeline-row">
          <IconButton
            label={s.complete ? "再演示一轮" : s.playing ? "暂停演示" : "继续演示"}
            onClick={s.complete ? replay : () => c({ type: "toggle-play" })}
          >
            {s.playing ? <Pause size={19} /> : <Play size={19} />}
          </IconButton>
          <time>
            {clock(s.time)}
            <span> / 03:00</span>
          </time>
          <div className="timeline">
            <div
              className="timeline-track"
              role="progressbar"
              aria-label="演示进度"
              aria-valuemin={0}
              aria-valuemax={180}
              aria-valuenow={s.time}
              aria-valuetext={`${clock(s.time)} / 03:00 · ${PHASES[s.phase]}`}
            >
              <div style={{ width: `${(s.time / 180) * 100}%` }} />
            </div>
            <div className="phase-labels">
              {PHASES.map((phase, i) => (
                <span key={phase} className={s.phase === i ? "current" : ""}>
                  {phase}
                </span>
              ))}
            </div>
          </div>
          <select
            aria-label="播放速度"
            value={s.speed}
            onChange={(e) =>
              c({ type: "speed", value: Number(e.target.value) })
            }
          >
            {[0.5, 1, 2, 4].map((speed) => (
              <option key={speed} value={speed}>
                {speed}×
              </option>
            ))}
          </select>
          <IconButton label="重新演示" onClick={replay}>
            <RotateCcw size={17} />
          </IconButton>
          <span className="demo-clock">演示时间</span>
        </div>
        <div className="fleet-heading">
          <b>
            <Truck size={16} />
            联动装备<span>{s.units.length}</span>
          </b>
          <div className="fleet-filters">
            <select
              aria-label="装备类型"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">全部模块</option>
              {(Object.keys(KIND_LABELS) as UnitKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <IconButton
              label={expanded ? "收起装备列表" : "展开装备列表"}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </IconButton>
          </div>
        </div>
        <div className="fleet-list" role="group" aria-label="联动装备列表">
          {orderEquipmentUnits(s.units)
            .filter((u) => filter === "all" || u.kind === filter)
            .map((u) => (
              <button
                key={u.id}
                className={`fleet-unit ${p.selectedId === u.id ? "selected" : ""}`}
                aria-label={`${u.id.toUpperCase()} ${u.name} ${STATUS_LABELS[u.status]}`}
                aria-pressed={p.selectedId === u.id}
                onClick={() => select(u.id)}
              >
                <EquipmentIllustration kind={u.kind} />
                <span className="fleet-unit-content">
                  <strong>{u.name}</strong>
                  <span className="fleet-unit-meta">
                    <span className="fleet-unit-code">
                      <UnitIcon kind={u.kind} size={12} />
                      <small>{u.id.toUpperCase()}</small>
                    </span>
                    <span className="fleet-unit-status" data-status={u.status}>
                      <i className="unit-dot" aria-hidden="true" />
                      {STATUS_LABELS[u.status]}
                    </span>
                  </span>
                </span>
              </button>
            ))}
        </div>
      </footer>
    </div>
  );
}
