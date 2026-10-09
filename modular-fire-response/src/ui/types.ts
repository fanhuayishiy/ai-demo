import type { CameraCommand, Command, SimulationState, ViewMode } from '../types';
export interface DashboardProps {
  state: SimulationState; command: (command: Command) => void;
  selectedId: string; select: (id: string) => void;
  view: ViewMode; setView: (view: ViewMode) => void;
  camera: (type: CameraCommand['type']) => void;
  touring: boolean; setTouring: (value: boolean) => void;
  contextLost: boolean;
}
