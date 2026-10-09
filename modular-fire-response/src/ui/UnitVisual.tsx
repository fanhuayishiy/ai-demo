import {
  ArrowUpFromLine,
  BatteryCharging,
  Bot,
  Droplets,
  Fan,
  Gauge,
  MoveUpRight,
  Package,
  ScanEye,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { KIND_LABELS } from "../simulation";
import type { UnitKind, UnitState } from "../types";

const unitIcons: Record<UnitKind, LucideIcon> = {
  water: Droplets,
  booster: Gauge,
  boom: MoveUpRight,
  power: BatteryCharging,
  dog: Bot,
  tools: Wrench,
  "fire-drone": Fan,
  recon: ScanEye,
  cargo: Package,
  ladder: ArrowUpFromLine,
};

const referenceImages: Partial<Record<UnitKind, string>> = {
  water: "water.webp",
  booster: "booster.webp",
  boom: "boom.webp",
  ladder: "ladder.webp",
  "fire-drone": "fire-drone.webp",
  cargo: "cargo-drone.webp",
  dog: "robot.webp",
};

export const EQUIPMENT_KIND_ORDER: UnitKind[] = [
  "water", "booster", "boom", "ladder", "fire-drone", "cargo", "dog",
  "recon", "power", "tools",
];

export function orderEquipmentUnits(units: UnitState[]): UnitState[] {
  const primary = EQUIPMENT_KIND_ORDER.flatMap(kind => {
    const first = units.find(unit => unit.kind === kind);
    return first ? [first] : [];
  });
  const primaryIds = new Set(primary.map(unit => unit.id));
  return [...primary, ...units.filter(unit => !primaryIds.has(unit.id))];
}

export function UnitIcon({ kind, size = 18 }: { kind: UnitKind; size?: number }) {
  const Icon = unitIcons[kind];
  return <Icon className="unit-icon" data-unit-kind={kind} size={size} aria-hidden="true" />;
}

export function EquipmentIllustration({ kind }: { kind: UnitKind }) {
  const image = referenceImages[kind];
  return (
    <span className={`equipment-illustration ${image ? "" : "equipment-illustration-icon"}`}>
      {image ? (
        <img
          src={`${import.meta.env.BASE_URL}reference-equipment/${image}`}
          alt={`${KIND_LABELS[kind]}参考外观`}
          width={112}
          height={55}
          draggable={false}
        />
      ) : <UnitIcon kind={kind} size={30} />}
    </span>
  );
}
