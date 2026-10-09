import type { CSSProperties } from "react";
import { Flame, MapPin, Navigation2, Truck, Warehouse } from "lucide-react";
import { KIND_LABELS, STATIONS, STATUS_LABELS } from "../simulation";
import {
  ROAD_WIDTH, ROAD_XS, ROAD_ZS, STATIC_SOLIDS, TOWER_POSITION, WATER_SOURCES,
} from "../spatial/layout";
import type { SimulationState, Vec3, WaterState } from "../types";
import { EQUIPMENT_KIND_ORDER, UnitIcon } from "./UnitVisual";

export function ForceSummary({ units }: Pick<SimulationState, "units">) {
  return (
    <section className="force-summary command-section" aria-labelledby="force-summary-title">
      <h3 className="command-section-title" id="force-summary-title">
        <Truck size={14} aria-hidden="true" />支援力量
      </h3>
      <span className="force-count-label">车组现场 / 总量</span>
      <dl className="force-grid">
        {EQUIPMENT_KIND_ORDER.map(kind => {
          const matching = units.filter(unit => unit.kind === kind);
          if (!matching.length) return null;
          const ready = matching.filter(unit => unit.status === "working" || unit.status === "deploying").length;
          return (
            <div className="force-row" key={kind}>
              <dt><UnitIcon kind={kind} size={13} />{KIND_LABELS[kind]}</dt>
              <dd aria-label={`${KIND_LABELS[kind]}现场 ${ready} / ${matching.length}`}>
                <strong>{ready}</strong><span> / {matching.length}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function SupplyGauge({ buffer, capacity }: Pick<WaterState, "buffer" | "capacity">) {
  const percent = capacity > 0 ? Math.round(Math.min(1, Math.max(0, buffer / capacity)) * 100) : 0;
  return (
    <div
      className="reserve-gauge"
      role="meter"
      aria-label="缓冲储量"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${Math.round(buffer)} / ${Math.round(capacity)} L`}
      style={{ "--reserve-progress": `${percent}%` } as CSSProperties}
    >
      <span>{percent}<small>%</small></span>
    </div>
  );
}

const mapAnchors = [...STATIONS.map(station => station.position), ...WATER_SOURCES.map(source => source.fixture)];
const mapBounds = {
  left: Math.min(...mapAnchors.map(point => point[0])) - 20,
  right: Math.max(...mapAnchors.map(point => point[0])) + 20,
  top: Math.min(...mapAnchors.map(point => point[2])) - 20,
  bottom: Math.max(...mapAnchors.map(point => point[2])) + 20,
};
const mapWidth = mapBounds.right - mapBounds.left;
const mapDepth = mapBounds.bottom - mapBounds.top;
const mapPosition = ([x, , z]: Vec3): CSSProperties => ({
  left: `${((x - mapBounds.left) / mapWidth) * 100}%`,
  top: `${((z - mapBounds.top) / mapDepth) * 100}%`,
});
const mapBuildings = STATIC_SOLIDS.filter(solid =>
  solid.id === "tower" || solid.id.endsWith("-low") || solid.id.startsWith("station-"),
);

export function TaskMap({
  state, selectedId, select,
}: { state: SimulationState; selectedId: string; select: (id: string) => void }) {
  return (
    <section className="task-map command-section" aria-labelledby="task-map-title">
      <h3 className="command-section-title" id="task-map-title">
        <MapPin size={14} aria-hidden="true" />任务区域
      </h3>
      <div className="task-map-surface">
        <div className="task-map-geography" aria-hidden="true">
          {ROAD_XS.map(x => (
            <span className="task-map-road vertical" key={`x-${x}`} style={{
              left: `${((x - ROAD_WIDTH / 2 - mapBounds.left) / mapWidth) * 100}%`,
              width: `${(ROAD_WIDTH / mapWidth) * 100}%`,
            }} />
          ))}
          {ROAD_ZS.map(z => (
            <span className="task-map-road horizontal" key={`z-${z}`} style={{
              top: `${((z - ROAD_WIDTH / 2 - mapBounds.top) / mapDepth) * 100}%`,
              height: `${(ROAD_WIDTH / mapDepth) * 100}%`,
            }} />
          ))}
          {mapBuildings.map(building => (
            <span className="task-map-building" key={building.id} style={{
              ...mapPosition([
                building.center[0] - building.size[0] / 2,
                0,
                building.center[2] - building.size[2] / 2,
              ]),
              width: `${(building.size[0] / mapWidth) * 100}%`,
              height: `${(building.size[2] / mapDepth) * 100}%`,
            }} />
          ))}
          {state.units.map(unit => (
            <span
              className="task-map-unit"
              key={unit.id}
              data-map-unit={unit.id}
              data-status={unit.status}
              style={mapPosition(unit.position)}
              title={`${unit.name} ${STATUS_LABELS[unit.status]}`}
            />
          ))}
        </div>
        {STATIONS.map(station => (
          <button
            key={station.id}
            className="task-map-marker station"
            aria-label={`查看${station.name}`}
            title={station.name}
            aria-pressed={selectedId === station.id}
            style={mapPosition(station.position)}
            onClick={() => select(station.id)}
          >
            <Warehouse size={15} aria-hidden="true" />
          </button>
        ))}
        <button
          className={`task-map-marker incident ${state.complete ? "complete" : ""}`}
          aria-label="查看滨河 01 号楼火情"
          aria-pressed={selectedId === "incident"}
          title="滨河 01 号楼"
          style={mapPosition(TOWER_POSITION)}
          onClick={() => select("incident")}
        >
          <Flame size={17} aria-hidden="true" />
        </button>
        <span className="task-map-north" aria-hidden="true"><Navigation2 size={10} />N</span>
      </div>
    </section>
  );
}
