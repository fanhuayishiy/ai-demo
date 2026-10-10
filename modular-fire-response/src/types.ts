export type Vec3 = [number, number, number];
export type UnitKind = 'water' | 'booster' | 'boom' | 'power' | 'dog' | 'tools' | 'fire-drone' | 'recon' | 'cargo' | 'ladder';
export type UnitStatus = 'standby' | 'enroute' | 'deploying' | 'working' | 'refilling' | 'returning' | 'fault' | 'recalled';
export interface UnitState {
  id: string; name: string; kind: UnitKind; station: string; position: Vec3; home: Vec3; destination: Vec3;
  battery: number; water: number; capacity: number; status: UnitStatus; task: string;
  route: Vec3[]; travel: number; deployment: number; heading?: number;
  // One reversible journey clock keeps seated and ground crew mutually exclusive.
  crewProgress?: number; crewReturning?: boolean;
  airTime?: number; airReturning?: boolean; airReturnFrom?: number; airReturnTime?: number; airLiftDeployment?: number;
  // Pickup stays latched after the ground handoff so the return route keeps its identity.
  airRescueBoarding?: number; airRescuePassenger?: boolean; airRescueDelivered?: boolean; airRescueRecovery?: boolean;
  airRescueRequested?: boolean;
}
export interface SimEvent { id: string; time: number; text: string; level: 'info' | 'success' | 'warning'; }
export interface WaterState { buffer: number; capacity: number; inflow: number; outflow: number; totalUsed: number; interruptedFor: number; connected: boolean; sourceAvailable: boolean; refillCycles: number; }
export interface Flags { blockedRoad: boolean; lowWater: boolean; droneFault: boolean; powerFault: boolean; airConcept: boolean; liftConcept: boolean; }
export interface Approvals { dispatch: boolean; connection: boolean; rescue: boolean; lift: boolean; }
export interface SimulationState {
  time: number; playing: boolean; speed: number; mode: 'guided' | 'command'; phase: number; complete: boolean;
  units: UnitState[]; water: WaterState; flags: Flags; approvals: Approvals;
  life: { detected: boolean; confirmed: boolean; rescued: number; source: string };
  events: SimEvent[]; metrics: { firstRecon: number | null; firstArrival: number | null; delivered: number; energySwaps: number };
}
export type Command = {type:'toggle-play'} | {type:'speed';value:number} | {type:'mode';value:'guided'|'command'}
  | {type:'approve';key:keyof Approvals} | {type:'flag';key:keyof Flags;value:boolean}
  | {type:'recall';id:string} | {type:'dispatch';id:string} | {type:'confirm-life'} | {type:'request-cargo-rescue'} | {type:'reset'};
export type ViewMode = 'overview' | 'follow' | 'command';
export interface CameraCommand {type:'reset'|'focus'|'zoomIn'|'zoomOut';sequence:number;}
export interface SceneProps {
  state: SimulationState; selectedId: string; onSelect:(id:string)=>void; view:ViewMode;
  cameraCommand:CameraCommand; touring:boolean; onTourChange:(value:boolean)=>void; onContextStatus?:(lost:boolean)=>void;
}
