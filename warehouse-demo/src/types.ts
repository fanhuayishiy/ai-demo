import type { MutableRefObject } from 'react';

export type Vec3 = [number, number, number];
export type EntityKind = 'warehouse' | 'forklift' | 'truck' | 'pallet';
export interface Entity {
  id: string; kind: EntityKind; name: string; subtitle: string;
  status: string; position: Vec3; color: string;
  fields: { label: string; value: string }[];
}
export type Stage = 'approach' | 'pickup' | 'transport' | 'unload' | 'return';
export interface SimState {
  elapsed: number; cycleTime: number; progress: number; stage: Stage; stageLabel: string;
  forklift: { position: Vec3; rotation: number; lift: number };
  cargo: { position: Vec3; onForks: boolean; delivered: boolean };
}
export interface DashboardProps {
  selectedId: string; onSelect: (id: string) => void; sim: SimState;
  selectionSequence?: number;
  running: boolean; onToggle: () => void; onResetView: () => void;
  onZoomIn: () => void; onZoomOut: () => void;
  onFocusSelected?: () => void; onToggleTour?: () => void; touring?: boolean;
}
export interface CameraCommand { sequence: number; type: 'reset' | 'zoomIn' | 'zoomOut' | 'focus'; entityId?: string }
export interface SceneProps {
  selectedId: string; onSelect: (id: string) => void;
  elapsedRef: MutableRefObject<number>; cameraCommand: CameraCommand;
  touring?: boolean; onCameraInteract?: () => void; onContextStatus?: (lost: boolean) => void;
}
