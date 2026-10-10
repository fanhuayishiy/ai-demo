import type { Vec3 } from '../types';

export const SURFACE_Y = 0.18;
export const VEHICLE_SCALE = 0.85;
export const ROAD_XS = [-45, -22, 28, 50];
export const ROAD_ZS = [-30, 20, 40];
export const ROAD_WIDTH = 8;
export const TOWER_POSITION: Vec3 = [7, 0, 0];
export const PUMP_POSITION: Vec3 = [-6, SURFACE_Y, -2];
export const LADDER_TARGET: Vec3 = [11.7, 20.9, 9.2];
export const BOOM_TARGET: Vec3 = [2, 20, 10];
export const AIR_FIRE_POSITION: Vec3 = [17, 23, 15];
export const ROOFTOP_SURFACE_Y = 29.025;
export const ROOFTOP_CARGO_LANDING: Vec3 = [6.8, 29.045, 4.8];
export const ROOFTOP_BASKET_POSITION: Vec3 = [5.65, 29.045, 4.8];
export const ROOFTOP_PEOPLE: Vec3[] = [
  [3.4, 29.045, 4.8], [1.6, 29.045, 3.8],
  [2.5, 29.045, 5.5], [4.6, 29.045, 2.2],
];
export const CARGO_POSITION: Vec3 = [6.8, 38, 4.8];
export const GROUND_BASKET_POSITION: Vec3 = [43.5, SURFACE_Y, -24.5];
export const GROUND_PERSON_POSITION: Vec3 = [44.7, SURFACE_Y, -23.5];
export const RECON_HEIGHT = 35;

export const STATION_LAYOUT: {
  id: string; name: string; position: Vec3; rotation: number;
  homeHeading: number; homes: Vec3[]; driveway: Vec3[]; entry: Vec3;
}[] = [
  { id:'NORTH', name:'北部消防站', position:[-49,0,-46], rotation:0, homeHeading:-Math.PI/2,
    homes:[-55.75,-51.25,-46.75,-42.25].map(x=>[x,SURFACE_Y,-42.3] as Vec3),
    driveway:[[-45,SURFACE_Y,-34.3],[-45,SURFACE_Y,-30]], entry:[-45,SURFACE_Y,-30] },
  { id:'WEST', name:'西部模块站', position:[-64,0,23], rotation:Math.PI/2, homeHeading:0,
    homes:[28,23,18,13].map(z=>[-60.3,SURFACE_Y,z] as Vec3),
    driveway:[[-52.3,SURFACE_Y,20],[-45,SURFACE_Y,20]], entry:[-45,SURFACE_Y,20] },
  { id:'EAST', name:'东部增援站', position:[49,0,-46], rotation:0, homeHeading:-Math.PI/2,
    homes:[42.25,46.75,51.25,55.75].map(x=>[x,SURFACE_Y,-42.3] as Vec3),
    driveway:[[50,SURFACE_Y,-34.3],[50,SURFACE_Y,-30]], entry:[50,SURFACE_Y,-30] },
];

// Service and deployment positions are deliberately outside through-traffic lanes.
export const STAGING: Record<string,{position:Vec3;heading:number;approach?:Vec3}> = {
  W01:{position:[-14,SURFACE_Y,11],heading:0},
  W02:{position:[-14,SURFACE_Y,-1],heading:0},
  W03:{position:[-14,SURFACE_Y,-14],heading:0},
  B01:{position:[-5,SURFACE_Y,11],heading:0},
  D01:{position:[4,SURFACE_Y,12],heading:0},
  T01:{position:[0,SURFACE_Y,-20],heading:0},
  P01:{position:[20,SURFACE_Y,29],heading:0},
  F01:{position:[36,SURFACE_Y,11],heading:0},
  R01:{position:[36,SURFACE_Y,29],heading:0},
  C01:{position:[38,SURFACE_Y,-22],heading:0},
  L01:{position:[20,SURFACE_Y,11],heading:0},
  M01:{position:[-6,SURFACE_Y,-2],heading:0,approach:[-6,SURFACE_Y,-30]},
};

export const WATER_SOURCES: {id:string;fixture:Vec3;bay:Vec3;approach:Vec3}[] = [
  {id:'water-west',fixture:[-33,SURFACE_Y,54],bay:[-33,SURFACE_Y,48],approach:[-33,SURFACE_Y,40]},
  {id:'water-east',fixture:[65,SURFACE_Y,26],bay:[59,SURFACE_Y,26],approach:[50,SURFACE_Y,26]},
];

export const LOW_BUILDINGS: {id:string;position:Vec3;size:Vec3;color:string}[] = [
  {id:'north-low',position:[-8,0,-41],size:[17,7,10],color:'#c2d2d2'},
  {id:'northeast-low',position:[30,0,-45],size:[16,10,9],color:'#e6e4db'},
  {id:'west-low',position:[-34,0,-8],size:[10,9,19],color:'#d9e2dc'},
  {id:'east-low',position:[39,0,-8],size:[10,6,14],color:'#d0dcdf'},
  {id:'south-low',position:[0,0,31.5],size:[18,4,7],color:'#d7ded8'},
];
export const TREE_POSITIONS: Vec3[] = [
  [-34,0,-44],[-60,0,-10],[-64,0,43],[-34,0,-23],[-34,0,5],[-34,0,32],
  [-14,0,51],[13,0,48],[39,0,47],[61,0,2],[61,0,36],[21,0,-20],
];
export const STREET_LAMPS: {position:Vec3;rotation:number}[] = [
  {position:[-51,0,1],rotation:0},
  {position:[-34,0,-36],rotation:-Math.PI/2},
  {position:[21,0,-36],rotation:-Math.PI/2},
  {position:[56,0,7],rotation:Math.PI},
  {position:[44,0,31],rotation:0},
  {position:[-15,0,26],rotation:Math.PI/2},
];
export const STATIC_SOLIDS: {id:string;center:Vec3;size:Vec3}[] = [
  {id:'tower',center:[7,14,0.5],size:[16.5,28,14.6]},
  ...LOW_BUILDINGS.map(b=>({id:b.id,center:[b.position[0],b.size[1]/2,b.position[2]] as Vec3,size:b.size})),
  ...STATION_LAYOUT.map(s=>({id:`station-${s.id}`,center:[s.position[0]-Math.sin(s.rotation)*4,3,s.position[2]-Math.cos(s.rotation)*4] as Vec3,size:(s.rotation ? [6,6,20] : [20,6,6]) as Vec3})),
  ...WATER_SOURCES.map(s=>({id:s.id,center:[s.fixture[0],1,s.fixture[2]] as Vec3,size:[2.8,3,2.8] as Vec3})),
  ...TREE_POSITIONS.map((p,i)=>({id:`tree-${i}`,center:[p[0],2.5,p[2]] as Vec3,size:[3.4,5,3.4] as Vec3})),
  ...STREET_LAMPS.map(({position:p},i)=>({id:`lamp-${i}`,center:[p[0],4,p[2]] as Vec3,size:[.8,8,.8] as Vec3})),
];
