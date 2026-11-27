import * as THREE from 'three';

export type WeatherMode = 'rain' | 'sun' | 'snow';
export type ViewMode = 'hero' | 'street' | 'explode';

export interface DioramaStateOptions {
  view?: ViewMode;
  weather?: WeatherMode;
  exploded?: boolean;
  convergence?: boolean;
  time?: number;
  autoOrbit?: boolean;
}

export interface DioramaMetrics {
  fps: number;
  triangles: number;
  drawCalls: number;
  weather: WeatherMode;
  view: ViewMode;
  exploded: boolean;
  convergence: boolean;
  calloutCount: number;
  calloutOverlaps: number;
  calloutOutOfBounds: number;
}

export interface CalloutAnchor {
  id: string;
  code: string;
  elevation: string;
  title: string;
  desc: string;
  side: 'left' | 'right';
  tier: 'sky' | 'street' | 'subway';
  localPos: THREE.Vector3;
}

export interface DynamicUpdateContext {
  time: number;
  dt: number;
  weather: WeatherMode;
  rainWeight: number;
  sunWeight: number;
  snowWeight: number;
  convergence: boolean;
  convergenceProgress: number;
  explodeFactor: number;
}

export interface AnimatedEntity {
  update: (ctx: DynamicUpdateContext) => void;
}

export interface SnowSurfaceRef {
  mesh: THREE.Object3D;
  baseVisible?: boolean;
}

declare global {
  interface Window {
    __setDioramaState?: (opts: DioramaStateOptions) => void;
    __advanceSimulation?: (dt: number) => void;
    __setCameraPose?: (
      pos: [number, number, number],
      target: [number, number, number]
    ) => void;
    __getDioramaMetrics?: () => DioramaMetrics;
  }
}
