import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  ArrowDownToLine,
  ArrowUpRight,
  Bath,
  BedDouble,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CookingPot,
  DoorOpen,
  Expand,
  Eye,
  EyeOff,
  Fan,
  House,
  Layers2,
  Leaf,
  Lightbulb,
  Maximize2,
  Minus,
  Moon,
  MousePointer2,
  PanelTop,
  Plus,
  Power,
  Refrigerator,
  RotateCcw,
  ScanLine,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Speaker,
  Sun,
  Sunset,
  Thermometer,
  Tv,
  WashingMachine,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import HomeScene from "./scene/HomeScene";
import {
  applyPreset,
  initialDevices,
  readDevices,
  rooms,
  STORAGE_KEY,
} from "./data";
import type {
  Device,
  DeviceType,
  PresetId,
  RoomId,
  SceneHandle,
  TimeOfDay,
  ViewMode,
  WallMode,
} from "./types";

const roomIcons: Record<RoomId, LucideIcon> = {
  all: House,
  living: Armchair,
  bedroom: BedDouble,
  study: BookOpen,
  kitchen: CookingPot,
  bathroom: Bath,
  balcony: Leaf,
};
const deviceIcons: Record<DeviceType, LucideIcon> = {
  light: Lightbulb,
  ac: Wind,
  tv: Tv,
  curtain: PanelTop,
  fridge: Refrigerator,
  washer: WashingMachine,
  hood: Fan,
  robot: ScanLine,
  speaker: Speaker,
  oven: CookingPot,
  heater: Thermometer,
};
const presets: { id: PresetId; name: string; sub: string; icon: LucideIcon }[] =
  [
    { id: "home", name: "舒适归家", sub: "灯火，为你而留", icon: House },
    { id: "movie", name: "沉浸观影", sub: "把客厅交给电影", icon: Tv },
    { id: "night", name: "一夜好眠", sub: "让一天温柔落幕", icon: Moon },
    { id: "away", name: "安心离家", sub: "暂别，也从容", icon: DoorOpen },
  ];

function Toggle({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "is-on" : ""}`}
      onClick={onClick}
    >
      <span />
    </button>
  );
}
function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`icon-button ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <Icon size={18} />
    </button>
  );
}

function DeviceControl({
  device,
  update,
  toggle,
}: {
  device: Device;
  update: (patch: Partial<Device>) => void;
  toggle: () => void;
}) {
  const Icon = deviceIcons[device.type];
  const light = device.type === "light";
  const range = light
    ? { min: 0, max: 100, unit: "%", name: "亮度" }
    : device.type === "curtain"
      ? { min: 0, max: 100, unit: "%", name: "打开比例" }
      : device.type === "ac"
        ? { min: 16, max: 30, unit: "°C", name: "设定温度" }
        : device.type === "fridge"
          ? { min: 2, max: 8, unit: "°C", name: "冷藏温度" }
          : device.type === "heater"
            ? { min: 35, max: 65, unit: "°C", name: "水温" }
            : device.type === "oven"
              ? { min: 80, max: 250, unit: "°C", name: "烘烤温度" }
              : device.type === "washer"
                ? { min: 20, max: 60, unit: "°C", name: "洗涤水温" }
                : device.type === "hood"
                  ? { min: 1, max: 3, unit: "档", name: "风量" }
                  : {
                      min: 0,
                      max: 100,
                      unit: "%",
                      name: device.type === "robot" ? "电量" : "音量",
                    };
  const modes: Partial<Record<DeviceType, string[]>> = {
    ac: ["制冷", "制热", "送风", "睡眠"],
    tv: ["艺术画廊", "电影", "音乐"],
    washer: ["日常洗", "轻柔洗", "快速洗"],
    oven: ["上下烘烤", "热风", "烧烤"],
    robot: ["全屋清扫", "沿边清扫", "定点清扫"],
    speaker: ["轻柔爵士", "自然白噪音", "钢琴"],
    hood: ["自动", "手动"],
    heater: ["节能", "速热"],
    fridge: ["智能保鲜", "假日", "速冷"],
  };
  const valueUpdate = (value: number) =>
    update({
      value,
      ...(light || device.type === "curtain" ? { on: value > 0 } : {}),
    });
  return (
    <section
      className={`device-control ${device.on ? "powered" : ""}`}
      aria-label={`${device.name}控制`}
    >
      <div className="device-art">
        <div className="device-art-orbit" />
        <Icon size={46} strokeWidth={1.1} />
        <span className={`device-state ${device.on ? "online" : ""}`}>
          <i />
          {device.on ? "已开启" : "已关闭"}
        </span>
      </div>
      <div className="device-heading">
        <div>
          <span className="eyebrow">
            {rooms.find((r) => r.id === device.room)?.name} ·{" "}
            {light ? "智能照明" : "智能家电"}
          </span>
          <h3>{device.name}</h3>
        </div>
        <Toggle
          on={device.on}
          label={`${device.on ? "关闭" : "开启"}${device.name}`}
          onClick={toggle}
        />
      </div>
      <div className="control-divider" />
      {device.type === "robot" ? (
        <div className="robot-status">
          <span>电池电量</span>
          <strong>{device.value}%</strong>
          <div className="battery-track">
            <span style={{ width: `${device.value}%` }} />
          </div>
          <p>
            {device.on
              ? "正在模拟清扫，点击开关可返回待机。"
              : "已停靠，随时准备打扫。"}
          </p>
        </div>
      ) : (
        <div className="slider-control">
          <label htmlFor={`value-${device.id}`}>{range.name}</label>
          <output>
            {device.value}
            <small>{range.unit}</small>
          </output>
          <input
            id={`value-${device.id}`}
            type="range"
            min={range.min}
            max={range.max}
            value={device.value}
            style={
              {
                "--fill": `${((device.value - range.min) / (range.max - range.min)) * 100}%`,
              } as React.CSSProperties
            }
            onChange={(e) => valueUpdate(Number(e.target.value))}
          />
          <div className="range-ends">
            <span>
              {range.min}
              {range.unit}
            </span>
            <span>
              {range.max}
              {range.unit}
            </span>
          </div>
        </div>
      )}
      {light && (
        <>
          <div className="temperature-heading">
            <span>色温</span>
            <span>
              {device.temperature} <small>K</small>
            </span>
          </div>
          <input
            aria-label={`${device.name}色温`}
            className="temperature-slider"
            type="range"
            min={2700}
            max={6500}
            step={100}
            value={device.temperature}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
          />
          <div className="temp-options">
            {[
              { name: "暖光", value: 2700 },
              { name: "自然光", value: 4000 },
              { name: "冷白光", value: 6500 },
            ].map((t) => (
              <button
                key={t.name}
                className={device.temperature === t.value ? "selected" : ""}
                onClick={() => update({ temperature: t.value })}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
      {device.type === "curtain" && (
        <div className="temp-options">
          {[
            { name: "合帘", value: 0 },
            { name: "半开", value: 50 },
            { name: "全开", value: 100 },
          ].map((t) => (
            <button
              key={t.name}
              className={device.value === t.value ? "selected" : ""}
              onClick={() => valueUpdate(t.value)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {modes[device.type] && (
        <label className="mode-label">
          {device.type === "tv"
            ? "显示内容"
            : device.type === "speaker"
              ? "播放内容"
              : "运行模式"}
          <span className="select-wrap">
            <select
              aria-label={`${device.name}模式`}
              value={device.mode}
              onChange={(e) => update({ mode: e.target.value })}
            >
              {modes[device.type]?.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </span>
        </label>
      )}
      <div className="device-footnote">
        <span className="tiny-dot" />
        {light
          ? "光照实时映射至房间"
          : device.type === "curtain"
            ? "窗帘开合实时同步至模型"
            : "设备状态实时同步至模型"}
        <span>模拟</span>
      </div>
    </section>
  );
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>(readDevices);
  const [room, setRoom] = useState<RoomId>("all");
  const [selectedId, setSelectedId] = useState<string | null>("living-pendant");
  const [wallMode, setWallMode] = useState<WallMode>("auto");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [view, setView] = useState<ViewMode>("perspective");
  const [showLabels, setShowLabels] = useState(true);
  const [ready, setReady] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const [category, setCategory] = useState<"light" | "appliance">("light");
  const [modal, setModal] = useState<"plan" | "help" | null>(null);
  const [toast, setToast] = useState("");
  const [mobilePanel, setMobilePanel] = useState(false);
  const sceneRef = useRef<SceneHandle>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const selected = devices.find((d) => d.id === selectedId);
  const activeRoom = rooms.find((r) => r.id === room)!;
  const filtered = devices.filter(
    (d) =>
      (room === "all" || d.room === room) &&
      (category === "light" ? d.type === "light" : d.type !== "light"),
  );
  const activeDevices = devices.filter((d) => d.on);
  const lights = devices.filter((d) => d.type === "light");
  const activeLights = lights.filter((d) => d.on);
  const power = activeDevices.reduce(
    (total, d) => total + d.watts * (d.type === "light" ? d.value / 100 : 1),
    0,
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch {
      /* Private browsing can disable storage; controls still work. */
    }
  }, [devices]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    controlsRef.current?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selectedId]);
  useEffect(() => {
    if (modal) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      previousFocus.current?.focus();
    }
  }, [modal]);

  function updateDevice(id: string, patch: Partial<Device>) {
    setDevices((current) =>
      current.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
    setActivePreset(null);
  }
  function toggleDevice(id: string) {
    const d = devices.find((v) => v.id === id)!;
    updateDevice(id, {
      on: !d.on,
      ...(d.type === "light" && d.value === 0 && !d.on ? { value: 65 } : {}),
      ...(d.type === "curtain" ? { value: d.on ? 0 : 100 } : {}),
    });
    setToast(`${d.name}已${d.on ? "关闭" : "开启"}`);
  }
  function selectDevice(id: string | null) {
    setSelectedId(id);
    if (id) {
      const d = devices.find((v) => v.id === id);
      if (d) {
        setCategory(d.type === "light" ? "light" : "appliance");
        if (room !== "all" && room !== d.room) setRoom(d.room);
        if (window.matchMedia("(max-width: 850px)").matches)
          setMobilePanel(true);
      }
    }
  }
  function selectRoom(id: RoomId) {
    setRoom(id);
    setMobilePanel(false);
    const d = devices.find((v) => v.room === id && v.type === "light");
    if (d) {
      setSelectedId(d.id);
      setCategory("light");
    } else if (id === "all") {
      setSelectedId("living-pendant");
      setCategory("light");
    }
  }
  function activatePreset(id: PresetId) {
    setDevices((current) => applyPreset(current, id));
    setActivePreset(id);
    setTime(id === "night" ? "night" : id === "movie" ? "dusk" : "day");
    setToast(`已切换至「${presets.find((p) => p.id === id)?.name}」场景`);
  }
  function allLights() {
    const hasOn = lights.some((d) => d.on);
    setDevices((current) =>
      current.map((d) =>
        d.type === "light" ? { ...d, on: !hasOn, value: d.value || 65 } : d,
      ),
    );
    setActivePreset(null);
    setToast(hasOn ? "全屋灯光已关闭" : "全屋灯光已开启");
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setToast("当前浏览器暂不支持全屏模式");
    }
  }
  function capture() {
    try {
      const url = sceneRef.current?.capture();
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = `栖居-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
      setToast("空间快照已保存");
    } catch {
      setToast("快照生成失败，请重试");
    }
  }
  const wallNames: Record<WallMode, string> = {
    auto: "智能隐墙",
    show: "完整墙体",
    hide: "隐藏墙体",
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            selectRoom("all");
            sceneRef.current?.reset();
          }}
          aria-label="栖居，返回全屋总览"
        >
          <div className="brand-mark">
            <House size={22} strokeWidth={1.6} />
            <span />
          </div>
          <strong>栖居</strong>
          <span className="brand-en">HABITAT</span>
        </a>
        <div className="header-path">
          <span>我的空间</span>
          <ChevronRight size={13} />
          <strong>林间寓所</strong>
          <span className="demo-tag">示例住宅</span>
        </div>
        <div className="header-actions">
          <span className="local-status">
            <i />
            本地空间已就绪
          </span>
          <IconButton
            icon={CircleHelp}
            label="操作指南"
            onClick={() => setModal("help")}
          />
          <span className="header-rule" />
          <div className="avatar">
            H<span />
          </div>
        </div>
      </header>
      <main className="workspace">
        <aside className="room-sidebar" aria-label="房间导航">
          <div className="home-heading">
            <span className="eyebrow">A PLACE TO CALL HOME</span>
            <h1>
              林间寓所<span>·</span>
            </h1>
            <p>
              108 m² <span>/</span> 自然现代 <span>/</span> 示例户型
            </p>
          </div>
          <div className="sidebar-section-title">
            <span>空间</span>
            <span>{String(rooms.length - 1).padStart(2, "0")} ROOMS</span>
          </div>
          <nav className="room-nav">
            {rooms.map((r) => {
              const Icon = roomIcons[r.id];
              const on = devices.filter(
                (d) => (r.id === "all" || d.room === r.id) && d.on,
              ).length;
              return (
                <button
                  key={r.id}
                  className={`room-button ${room === r.id ? "selected" : ""}`}
                  onClick={() => selectRoom(r.id)}
                  aria-current={room === r.id ? "true" : undefined}
                >
                  <span className="room-icon">
                    <Icon size={19} strokeWidth={1.65} />
                  </span>
                  <span className="room-copy">
                    <strong>{r.name}</strong>
                    <small>{r.english}</small>
                  </span>
                  {r.id === "all" ? (
                    <span className="room-count">{devices.length}</span>
                  ) : (
                    <span
                      className={`room-presence ${on ? "on" : ""}`}
                      title={`${on} 台设备运行中`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="material-card">
              <div className="material-swatches">
                <i />
                <i />
                <i />
                <span>NATURAL LIVING</span>
              </div>
              <h3>把日常，住成喜欢的样子。</h3>
              <p>温润木色 · 柔和织物 · 自然光线</p>
              <button onClick={() => setModal("plan")}>
                查看户型图
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="sidebar-note">
              <ShieldCheck size={14} />
              <span>设备状态保存在此浏览器</span>
            </div>
          </div>
        </aside>

        <section className="central-space" aria-label="交互式家庭三维模型">
          <div className="space-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-dot" /> LIVE YOUR SPACE
              </div>
              <h2>
                {room === "all"
                  ? "家的每一面，都在眼前。"
                  : `${activeRoom.name}，自在这一刻。`}
              </h2>
              <p>
                {room === "all"
                  ? "从一盏灯开始，感受家的回应。"
                  : `${activeRoom.english} · ${activeRoom.area} m² · 点击模型中的设备进行控制`}
              </p>
            </div>
            <button
              className="space-menu"
              onClick={() => setModal("plan")}
              title="查看户型图"
            >
              <Layers2 size={18} />
              <span>
                108<small> m²</small>
              </span>
            </button>
          </div>
          <div className="scene-stage">
            <div className="scene-topbar">
              <div className="view-switch" role="group" aria-label="视角">
                <button
                  className={view === "perspective" ? "selected" : ""}
                  onClick={() => setView("perspective")}
                >
                  <Maximize2 size={14} />
                  立体视图
                </button>
                <button
                  className={view === "top" ? "selected" : ""}
                  onClick={() => setView("top")}
                >
                  <Layers2 size={14} />
                  俯视平面
                </button>
              </div>
              <button
                className={`wall-button ${wallMode === "auto" ? "is-auto" : ""}`}
                onClick={() =>
                  setWallMode((m) =>
                    m === "auto" ? "show" : m === "show" ? "hide" : "auto",
                  )
                }
                title="切换智能隐墙、完整墙体、隐藏墙体"
              >
                {wallMode === "show" ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{wallNames[wallMode]}</span>
                <ChevronDown size={12} />
              </button>
            </div>
            <div className={`scene-canvas time-${time}`}>
              <HomeScene
                ref={sceneRef}
                devices={devices}
                selectedId={selectedId}
                room={room}
                wallMode={wallMode}
                time={time}
                view={view}
                showLabels={showLabels}
                onSelect={selectDevice}
                onReady={() => setReady(true)}
              />
            </div>
            {!ready && (
              <div className="scene-loading">
                <div className="loader-house">
                  <House size={34} />
                </div>
                <strong>正在布置你的家</strong>
                <span>构建空间与光影…</span>
              </div>
            )}
            <div className="compass" aria-hidden="true">
              <span>N</span>
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle
                  cx="21"
                  cy="21"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".22"
                />
                <path
                  d="M21 8L25 26L21 23L17 26Z"
                  fill="currentColor"
                  data-compass-needle
                />
                <path d="M8 21H11M31 21H34M21 31V34" stroke="currentColor" />
              </svg>
            </div>
            <div className="time-selector" role="group" aria-label="环境时段">
              {(
                [
                  { id: "day", name: "日光", icon: Sun },
                  { id: "dusk", name: "暮色", icon: Sunset },
                  { id: "night", name: "夜晚", icon: Moon },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  className={time === t.id ? "selected" : ""}
                  onClick={() => setTime(t.id)}
                  title={`${t.name}环境`}
                  aria-label={`${t.name}环境`}
                  aria-pressed={time === t.id}
                >
                  <t.icon size={16} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
            <div className="scene-tools">
              <IconButton
                icon={Plus}
                label="放大模型"
                onClick={() => sceneRef.current?.zoom(1.2)}
              />
              <IconButton
                icon={Minus}
                label="缩小模型"
                onClick={() => sceneRef.current?.zoom(1 / 1.2)}
              />
              <span />
              <IconButton
                icon={RotateCcw}
                label="重置视角"
                onClick={() => {
                  setRoom("all");
                  setView("perspective");
                  sceneRef.current?.reset();
                }}
              />
              <IconButton
                icon={MousePointer2}
                label={showLabels ? "隐藏设备标签" : "显示设备标签"}
                active={showLabels}
                onClick={() => setShowLabels((v) => !v)}
              />
              <IconButton icon={Expand} label="全屏查看" onClick={fullscreen} />
              <IconButton
                icon={ArrowDownToLine}
                label="保存空间快照"
                onClick={capture}
              />
            </div>
            <div className="scene-instructions">
              <MousePointer2 size={13} />
              <span className="desktop-hint">
                拖动旋转<span>·</span>滚轮缩放<span>·</span>右键平移
              </span>
              <span className="touch-hint">
                单指旋转<span>·</span>双指缩放与平移
              </span>
            </div>
            <div className="scene-caption">
              <span>INTERACTIVE RESIDENCE</span>
              <i />
              <span>01 / 林间寓所</span>
            </div>
          </div>
          <section className="presets-section" aria-label="一键场景">
            <div className="presets-heading">
              <div>
                <h3>
                  此刻，想怎样生活<span>？</span>
                </h3>
                <span>一键场景</span>
              </div>
              <button onClick={allLights}>
                <Lightbulb size={14} />
                {activeLights.length ? "全屋关灯" : "全屋开灯"}
              </button>
            </div>
            <div className="preset-grid">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className={`preset-card preset-${p.id} ${activePreset === p.id ? "selected" : ""}`}
                  onClick={() => activatePreset(p.id)}
                  aria-pressed={activePreset === p.id}
                >
                  <span className="preset-icon">
                    <p.icon size={21} strokeWidth={1.5} />
                  </span>
                  <span className="preset-copy">
                    <strong>{p.name}</strong>
                    <small>{p.sub}</small>
                  </span>
                  {activePreset === p.id ? (
                    <Check className="preset-arrow" size={15} />
                  ) : (
                    <ArrowUpRight className="preset-arrow" size={14} />
                  )}
                </button>
              ))}
            </div>
          </section>
          <footer className="space-footer">
            <span>
              <i /> {activeDevices.length} 台设备开启 <b>/</b> {devices.length}{" "}
              台可交互
            </span>
            <span>每一个小细节，都是家的温度。</span>
          </footer>
        </section>

        <aside
          id="device-panel"
          className={`control-sidebar ${mobilePanel ? "mobile-open" : ""}`}
          aria-label="设备控制面板"
        >
          <div className="panel-title">
            <div>
              <SlidersHorizontal size={17} />
              <h2>空间控制</h2>
            </div>
            <span>SMART HOME</span>
            <button
              className="mobile-close icon-button"
              aria-label="收起设备面板"
              onClick={() => setMobilePanel(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="environment-stats">
            <div>
              <span>
                <Sun size={13} />
                亮灯
              </span>
              <strong>
                {String(activeLights.length).padStart(2, "0")}
                <small> / {lights.length}</small>
              </strong>
            </div>
            <i />
            <div>
              <span>
                <Zap size={13} />
                模拟功率
              </span>
              <strong>
                {(power / 1000).toFixed(2)}
                <small> kW</small>
              </strong>
            </div>
            <div className="stats-icon">
              <Leaf size={23} strokeWidth={1.1} />
            </div>
          </div>
          <div className="controls-scroll" ref={controlsRef}>
            {selected ? (
              <DeviceControl
                key={selected.id}
                device={selected}
                update={(patch) => updateDevice(selected.id, patch)}
                toggle={() => toggleDevice(selected.id)}
              />
            ) : (
              <div className="select-prompt">
                <MousePointer2 size={30} />
                <h3>让家回应你</h3>
                <p>
                  点选模型中的灯光或家电，
                  <br />
                  在这里调整它的状态。
                </p>
              </div>
            )}
            <section className="device-directory">
              <div className="directory-heading">
                <h3>
                  {room === "all" ? "全屋设备" : `${activeRoom.name}设备`}
                </h3>
                <span>
                  {
                    devices.filter((d) => room === "all" || d.room === room)
                      .length
                  }{" "}
                  台
                </span>
              </div>
              <div className="device-tabs" role="group" aria-label="设备类型">
                <button
                  className={category === "light" ? "selected" : ""}
                  onClick={() => setCategory("light")}
                >
                  <Lightbulb size={14} />
                  灯光
                  <span>
                    {
                      devices.filter(
                        (d) =>
                          (room === "all" || d.room === room) &&
                          d.type === "light",
                      ).length
                    }
                  </span>
                </button>
                <button
                  className={category === "appliance" ? "selected" : ""}
                  onClick={() => setCategory("appliance")}
                >
                  <Settings2 size={14} />
                  家电
                  <span>
                    {
                      devices.filter(
                        (d) =>
                          (room === "all" || d.room === room) &&
                          d.type !== "light",
                      ).length
                    }
                  </span>
                </button>
              </div>
              <div className="device-list">
                {filtered.map((d) => {
                  const Icon = deviceIcons[d.type];
                  return (
                    <div
                      key={d.id}
                      className={`device-row ${selectedId === d.id ? "selected" : ""}`}
                    >
                      <button
                        className="device-row-main"
                        onClick={() => selectDevice(d.id)}
                        aria-label={`控制${d.name}`}
                      >
                        <span className={`device-row-icon ${d.on ? "on" : ""}`}>
                          <Icon size={18} strokeWidth={1.65} />
                        </span>
                        <span>
                          <strong>{d.name}</strong>
                          <small>
                            {d.on
                              ? d.type === "light"
                                ? `亮度 ${d.value}%`
                                : "已开启"
                              : "已关闭"}
                            <i>·</i>
                            {rooms.find((r) => r.id === d.room)?.name}
                          </small>
                        </span>
                      </button>
                      <button
                        className={`device-power ${d.on ? "on" : ""}`}
                        aria-label={`${d.on ? "关闭" : "开启"}${d.name}`}
                        onClick={() => toggleDevice(d.id)}
                        title={d.on ? "关闭" : "开启"}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="empty-devices">
                    此空间暂无{category === "light" ? "灯光" : "家电"}设备
                  </p>
                )}
              </div>
            </section>
          </div>
          <div className="panel-footer">
            <span className="tiny-dot" />
            本地交互演示<span>状态自动保存</span>
          </div>
        </aside>
      </main>
      <button
        className="mobile-controls-button"
        aria-expanded={mobilePanel}
        aria-controls="device-panel"
        onClick={() => setMobilePanel((v) => !v)}
      >
        <SlidersHorizontal size={18} />
        设备控制<span>{activeDevices.length}</span>
      </button>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={14} />
          </span>
          {toast}
        </div>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby="dialog-title"
        className={`app-dialog ${modal === "plan" ? "plan-dialog" : ""}`}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">
              HABITAT / {modal === "plan" ? "FLOOR PLAN" : "A LITTLE GUIDANCE"}
            </span>
            <h2 id="dialog-title">
              {modal === "plan" ? "林间寓所 · 户型图" : "探索家的另一种方式"}
            </h2>
          </div>
          <IconButton
            icon={X}
            label="关闭弹窗"
            onClick={() => setModal(null)}
          />
        </div>
        {modal === "plan" ? (
          <>
            <img
              className="floor-plan"
              src="./floorplan.svg"
              alt="108平方米原创示例户型图：主卧、书房、餐厨、卫浴、客厅与阳台的位置和尺寸"
            />
            <p className="dialog-note">
              原创示例户型 · 12 × 9 m ·
              非实际测绘。可根据真实户型与照片定制模型。
            </p>
          </>
        ) : (
          <>
            <div className="help-grid">
              {[
                {
                  icon: MousePointer2,
                  title: "自由探索",
                  text: "鼠标左键拖动旋转，滚轮缩放，右键拖动平移。触屏可单指旋转、双指缩放或平移。",
                },
                {
                  icon: Lightbulb,
                  title: "点选与控制",
                  text: "点击三维模型里的家电、灯具或设备标签，即可调节开关、亮度、色温和运行模式。也可使用设备列表。",
                },
                {
                  icon: EyeOff,
                  title: "让视野更开阔",
                  text: "智能隐墙随观察方向隐藏前景墙壁。点击按钮可切换完整墙体或隐藏全部墙体。",
                },
                {
                  icon: Sunset,
                  title: "感受不同氛围",
                  text: "选择日光、暮色或夜晚观察灯光。每个房间的多盏灯可独立控制，也可以一键应用生活场景。",
                },
              ].map((h) => (
                <div key={h.title}>
                  <h.icon size={22} />
                  <h3>{h.title}</h3>
                  <p>{h.text}</p>
                </div>
              ))}
            </div>
            <p className="dialog-note">
              此项目为本地模拟体验，不连接真实家电。设置仅保存在当前浏览器；清除浏览器数据会恢复默认状态。
            </p>
            <button
              className="reset-demo"
              onClick={() => {
                setDevices(initialDevices.map((d) => ({ ...d })));
                setActivePreset(null);
                setTime("day");
                setToast("已恢复默认设备状态");
                setModal(null);
              }}
            >
              <RotateCcw size={15} />
              恢复演示初始状态
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
