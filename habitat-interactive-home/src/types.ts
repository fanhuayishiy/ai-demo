export type RoomId =
  | "all"
  | "living"
  | "bedroom"
  | "study"
  | "kitchen"
  | "bathroom"
  | "balcony";
export type DeviceType =
  | "light"
  | "ac"
  | "tv"
  | "curtain"
  | "fridge"
  | "washer"
  | "hood"
  | "robot"
  | "speaker"
  | "oven"
  | "heater";
export interface Room {
  id: RoomId;
  name: string;
  english: string;
  area: number;
  center: [number, number, number];
}
export interface Device {
  id: string;
  name: string;
  room: Exclude<RoomId, "all">;
  type: DeviceType;
  on: boolean;
  value: number;
  temperature?: number;
  mode?: string;
  watts: number;
  position: [number, number, number];
}
export type PresetId = "home" | "movie" | "night" | "away";
export type WallMode = "auto" | "show" | "hide";
export type TimeOfDay = "day" | "dusk" | "night";
export type ViewMode = "perspective" | "top";
export interface SceneHandle {
  zoom: (factor: number) => void;
  reset: () => void;
  capture: () => string;
}
export interface HomeSceneProps {
  devices: Device[];
  selectedId: string | null;
  room: RoomId;
  wallMode: WallMode;
  time: TimeOfDay;
  view: ViewMode;
  showLabels: boolean;
  onSelect: (id: string | null) => void;
  onReady: () => void;
}
