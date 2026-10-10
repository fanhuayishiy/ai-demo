import type { Vec3 } from '../types';
import { LOW_BUILDINGS, STATION_LAYOUT, SURFACE_Y, TREE_POSITIONS } from '../spatial/layout';

const SURFACE_DEPTH_BIAS = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 };
export const CITY_DETAIL_FINISHES = {
  masonry: { ...SURFACE_DEPTH_BIAS, roughness: .9, metalness: 0, emissive: '#000000', emissiveIntensity: 0 },
  metal: { ...SURFACE_DEPTH_BIAS, roughness: .43, metalness: .48, emissive: '#000000', emissiveIntensity: 0 },
  glass: { ...SURFACE_DEPTH_BIAS, roughness: .25, metalness: .18, emissive: '#20333e', emissiveIntensity: .035 },
  warm: { ...SURFACE_DEPTH_BIAS, roughness: .3, metalness: .08, emissive: '#e7b877', emissiveIntensity: .43 },
  paint: { ...SURFACE_DEPTH_BIAS, roughness: .94, metalness: 0, emissive: '#000000', emissiveIntensity: 0 },
} as const;
export type CityDetailFinish = keyof typeof CITY_DETAIL_FINISHES;
export interface CityDetailBox {
  id: string;
  p: Vec3;
  s: Vec3;
  color: string;
  finish: CityDetailFinish;
}
export interface TreeCanopy {
  p: Vec3;
  s: Vec3;
  color: string;
  tree: number;
}
type Elevation = 'front' | 'rear' | 'left' | 'right';

function box(id: string, p: Vec3, s: Vec3, color: string, finish: CityDetailFinish = 'masonry'): CityDetailBox {
  return { id, p, s, color, finish };
}
function place(details: CityDetailBox[], position: Vec3, rotation = 0): CityDetailBox[] {
  const sine = Math.sin(rotation), cosine = Math.cos(rotation);
  return details.map(detail => ({ ...detail,
    p: [position[0] + cosine * detail.p[0] + sine * detail.p[2], position[1] + detail.p[1], position[2] - sine * detail.p[0] + cosine * detail.p[2]],
    s: [Math.abs(cosine) * detail.s[0] + Math.abs(sine) * detail.s[2], detail.s[1], Math.abs(sine) * detail.s[0] + Math.abs(cosine) * detail.s[2]],
  }));
}

function windowDetail(
  id: string, elevation: Elevation, wall: number, u: number, y: number,
  width: number, height: number, lit: boolean, existingGlass = false,
): CityDetailBox[] {
  const side = elevation === 'left' || elevation === 'rear' ? -1 : 1;
  const transverse = elevation === 'left' || elevation === 'right';
  const pane = (name: string, offsetU: number, offsetY: number, normal: number, w: number, h: number, depth: number, color: string, finish: CityDetailFinish = 'metal') =>
    box(`${id}/${name}`,
      transverse ? [side * (wall + normal), y + offsetY, u + offsetU] : [u + offsetU, y + offsetY, side * (wall + normal)],
      transverse ? [depth, h, w] : [w, h, depth], color, finish);
  const details = [
    pane('reveal', 0, 0, .004, width + .22, height + .2, .025, '#3d484d', 'masonry'),
    ...[-1, 1].map(sign => pane(`jamb-${sign}`, sign * (width / 2 + .02), 0, .084, .08, height + .16, .09, '#b3bfbe')),
    ...[-1, 1].map(sign => pane(`frame-${sign}`, 0, sign * (height / 2 + .02), .084, width + .12, .08, .09, '#b3bfbe')),
    pane('mullion', 0, 0, .09, .065, height, .05, '#718086'),
    pane('sill', 0, -height / 2 - .095, .01, width + .28, .12, .28, '#b6bfbe', 'masonry'),
  ];
  if (!existingGlass) details.push(pane('pane', 0, 0, .045, width, height, .06,
    lit ? '#d2be96' : '#34464f', lit ? 'warm' : 'glass'));
  return details;
}

function lowBuildingDetails(id: string, size: Vec3): CityDetailBox[] {
  const [width, height, depth] = size;
  const details: CityDetailBox[] = [];
  const floors = Math.max(1, Math.floor((height - .7) / 2.7));
  for (const elevation of ['front', 'rear', 'left', 'right'] as const) {
    const transverse = elevation === 'left' || elevation === 'right';
    const span = transverse ? depth : width;
    const columns = Math.max(1, Math.floor(span / 2.8));
    const wall = (transverse ? width : depth) / 2;
    for (let floor = 0; floor < floors; floor++) for (let column = 0; column < columns; column++) {
      const u = -span / 2 + (column + .5) * span / columns;
      const lit = (floor * 5 + column * 3 + id.length + elevation.length) % 7 < 3;
      details.push(...windowDetail(`${id}/${elevation}/${floor}-${column}`, elevation, wall, u, 2.1 + floor * 2.7, 1.45, 1.65, lit));
    }
    const sign = elevation === 'rear' || elevation === 'left' ? -1 : 1;
    for (const y of [.5, height - .35]) details.push(box(`${id}/${elevation}/course-${y}`,
      transverse ? [sign * (wall + .045), y, 0] : [0, y, sign * (wall + .045)],
      transverse ? [.09, .16, span] : [span, .16, .09], y === .5 ? '#8c999d' : '#b2bdbc'));
  }
  for (const sign of [-1, 1]) {
    details.push(box(`${id}/roof/parapet-x-${sign}`, [sign * (width / 2 - .5), height + .57, 0], [.16, .24, depth - .8], '#aab4b7'));
    details.push(box(`${id}/roof/parapet-z-${sign}`, [0, height + .57, sign * (depth / 2 - .5)], [width - .8, .24, .16], '#aab4b7'));
  }
  for (let i = 0; i < 7; i++) {
    details.push(box(`${id}/roof/plant-grille-${i}`, [1, height + 1.592, -.78 + i * .26], [2.4, .016, .085], '#4a575d', 'metal'));
  }
  details.push(box(`${id}/roof/plant-front`, [1, height + 1, .995], [2.36, .76, .01], '#5c686d', 'metal'));
  for (let i = 0; i < 6; i++) details.push(box(`${id}/roof/plant-louvre-${i}`, [.05 + i * .38, height + 1, 1], [.06, .72, .01], '#afb9bc', 'metal'));
  return details;
}

function towerDetails(): CityDetailBox[] {
  const details: CityDetailBox[] = [];
  for (let floor = 0; floor < 7; floor++) {
    for (let column = 0; column < 3; column++) {
      const x = -4.7 + column * 4.7;
      // The ground-floor centre remains an open dog/hoseline entrance.
      if (floor !== 0 || column !== 1) details.push(...windowDetail(`tower/front/${floor}-${column}`, 'front', 6.5, x, 3.5 + floor * 3.4, 2.5, 2.2, false, true));
      details.push(...windowDetail(`tower/rear/${floor}-${column}`, 'rear', 6.5, x, 3.5 + floor * 3.4, 2.3, 2.1, (floor + column * 2) % 5 < 2));
      for (const elevation of ['left', 'right'] as const) {
        details.push(...windowDetail(`tower/${elevation}/${floor}-${column}`, elevation, 8.1, -4 + column * 4, 3.6 + floor * 3.4, 2, 2, (floor * 3 + column + elevation.length) % 7 < 3));
      }
      details.push(box(`tower/balcony/${floor}-${column}/cap`, [x, 3.4 + floor * 3.4, 7.7], [3.3, .05, .13], '#bac6c7', 'metal'));
      if (floor !== 0 || column !== 1) for (const post of [-1, 0, 1]) details.push(box(`tower/balcony/${floor}-${column}/post-${post}`, [x + post * 1.03, 3 + floor * 3.4, 7.762], [.045, .8, .006], '#4e5e65', 'metal'));
    }
    details.push(box(`tower/rear/course-${floor}`, [0, 4.7 + floor * 3.4, -6.545], [15, .18, .09], '#a4b1b5'));
    for (const sign of [-1, 1]) details.push(box(`tower/side-course-${floor}-${sign}`, [sign * 8.145, 4.7 + floor * 3.4, 0], [.09, .18, 13.4], '#a4b1b5'));
  }
  for (const sign of [-1, 1]) {
    details.push(box(`tower/roof/parapet-x-${sign}`, [sign * 7.25, 28.86, 0], [.18, .28, 12.6], '#c0c7c6'));
    details.push(box(`tower/roof/parapet-z-${sign}`, [0, 28.86, sign * 6.25], [14.6, .28, .18], '#c0c7c6'));
    details.push(box(`tower/ground/plinth-${sign}`, [sign * 4.6, .48, 6.52], [5.8, .55, .06], '#7f8c91'));
  }
  details.push(box('tower/roof/room-door', [-3, 29.91, -.248], [1.2, 1.78, .006], '#637177', 'metal'));
  for (let slot = 0; slot < 7; slot++) details.push(box(`tower/roof/room-louvre-${slot}`, [-3.95 + slot * .32, 30.6, -.242], [.06, .35, .006], '#afbaba', 'metal'));
  for (const x of [-4.6, 4.6]) for (let floor = 0; floor < 6; floor++) {
    details.push(box(`tower/stone-joint/${x}-${floor}`, [x, 1.05 + floor * .37, 6.511], [5.8, .014, .016], '#a3afaf'));
  }
  return place(details, [7, 0, 0]);
}

function stationDetails(id: string): CityDetailBox[] {
  const details: CityDetailBox[] = [];
  const prefix = `station-${id}`;
  for (const x of [-9.7, -3, 3, 9.7]) details.push(box(`${prefix}/pilaster-${x}`, [x, 2.7, -1.02], [.23, 4.9, .18], '#aab6ba'));
  details.push(box(`${prefix}/sign-fascia`, [0, 4.78, -.915], [19.6, 1.02, .21], '#883b38'));
  details.push(box(`${prefix}/sign-cap`, [0, 5.32, -.86], [19.7, .1, .18], '#bdc7c8', 'metal'));
  for (const x of [-6, 0, 6]) {
    const bay = `${prefix}/bay-${x}`;
    for (const side of [-1, 1]) details.push(box(`${bay}/trim-${side}`, [x + side * 2.5, 2.21, -.93], [.15, 4.05, .18], '#9b453e', 'metal'));
    details.push(box(`${bay}/header`, [x, 4.12, -.875], [5.12, .18, .15], '#9b453e', 'metal'));
    for (let pane = 0; pane < 4; pane++) {
      const px = x - 1.72 + pane * 1.15;
      details.push(box(`${bay}/glazing-frame-${pane}`, [px, 3.05, -.817], [.97, .65, .025], '#bbc6c7', 'metal'));
      details.push(box(`${bay}/glazing-${pane}`, [px, 3.05, -.8], [.79, .46, .01], pane === 1 ? '#d7bd93' : '#455b64', pane === 1 ? 'warm' : 'glass'));
    }
    details.push(box(`${bay}/handle`, [x, 1.38, -.82], [.58, .08, .04], '#cad1d0', 'metal'));
    details.push(box(`${bay}/threshold`, [x, .21, -.88], [4.7, .06, .18], '#7b8a8d', 'metal'));
  }
  for (const side of [-1, 1]) {
    details.push(box(`${prefix}/roof-edge-${side}`, [side * 10.28, 6.28, -4], [.18, .2, 6.55], '#a8b4b8', 'metal'));
    details.push(box(`${prefix}/roof-channel-${side}`, [side * 4.1, 6.394, -4], [.1, .012, 6.6], '#702e2d', 'metal'));
    for (let pane = 0; pane < 2; pane++) {
      details.push(...windowDetail(`${prefix}/side-${side}/${pane}`, side === 1 ? 'right' : 'left', 10, -5.5 + pane * 2.8, 3.1, 1.6, 1.7, pane === 0));
    }
    details.push(box(`${prefix}/rear-course-${side}`, [0, side === -1 ? .5 : 5.35, -7.025], [19.8, .18, .05], '#aab7ba'));
  }
  // Leave channel footprints open because both finishes share the same depth bias.
  details.push(box(`${prefix}/roof-center`, [0, 6.396, -4], [8.1, .008, 6.6], '#6f797d'));
  for (const side of [-1, 1]) details.push(box(`${prefix}/roof-center-${side}`, [side * 7, 6.396, -4], [5.7, .008, 6.6], '#6f797d'));
  for (let i = 0; i < 6; i++) details.push(box(`${prefix}/apron/joint-x-${i}`, [-10 + i * 4, SURFACE_Y + .004, 5], [.025, .008, 25.7], '#657174', 'paint'));
  for (let i = 0; i < 6; i++) details.push(box(`${prefix}/apron/joint-z-${i}`, [0, SURFACE_Y + .004, -6 + i * 4.7], [22.8, .008, .025], '#657174', 'paint'));
  for (const x of [-8.6, -3, 3, 8.6]) details.push(box(`${prefix}/apron/bay-line-${x}`, [x, SURFACE_Y + .007, 3.6], [.08, .01, 6.9], '#b0b8b4', 'paint'));
  return details;
}

function backdropDetails(): CityDetailBox[] {
  const blocks: { p: Vec3; s: Vec3; color: string }[] = [
    { p: [-54, 0, -76], s: [19, 13, 12], color: '#6f797c' },
    { p: [-24, 0, -82], s: [21, 19, 13], color: '#858b89' },
    { p: [6, 0, -85], s: [19, 15, 12], color: '#707e82' },
    { p: [36, 0, -82], s: [20, 17, 12], color: '#848b8c' },
    { p: [64, 0, -76], s: [17, 11, 10], color: '#748184' },
  ];
  return blocks.flatMap((block, index) => {
    const [width, height, depth] = block.s;
    const id = `backdrop/${index}`;
    const details = [
      box(`${id}/shell`, [0, height / 2 + .13, 0], block.s, block.color),
      box(`${id}/roof`, [0, height + .23, 0], [width + .4, .2, depth + .4], '#637176'),
      box(`${id}/plant`, [-width * .18, height + .68, -1], [width * .32, .7, depth * .4], '#778389'),
    ];
    for (let floor = 0; floor < Math.floor(height / 3); floor++) {
      for (let column = 0; column < Math.floor(width / 3.2); column++) {
        const lit = (floor * 3 + column + index * 2) % 7 < 2;
        const x = -width / 2 + 1.65 + column * 3.2;
        details.push(box(`${id}/front/${floor}-${column}`, [x, 2 + floor * 3, depth / 2 + .03], [1.45, 1.65, .06], lit ? '#b7a787' : '#30424c', lit ? 'warm' : 'glass'));
        details.push(box(`${id}/front/sill-${floor}-${column}`, [x, 1.11 + floor * 3, depth / 2 + .035], [1.7, .1, .1], '#939d9d'));
      }
      details.push(box(`${id}/course-${floor}`, [0, 3.2 + floor * 3, depth / 2 + .04], [width, .14, .08], '#8e999a'));
      for (let column = 0; column < Math.floor(depth / 3); column++) {
        const lit = (floor + column + index) % 4 === 0;
        details.push(box(`${id}/side/${floor}-${column}`, [width / 2 + .03, 2 + floor * 3, -depth / 2 + 1.6 + column * 3], [.06, 1.65, 1.4], lit ? '#b7a787' : '#30424c', lit ? 'warm' : 'glass'));
      }
    }
    return place(details, block.p);
  });
}

export const CITY_DETAIL_BOXES: CityDetailBox[] = [
  ...towerDetails(),
  ...LOW_BUILDINGS.flatMap(building => place(lowBuildingDetails(building.id, building.size), building.position)),
  ...STATION_LAYOUT.flatMap(station => place(stationDetails(station.id), station.position, station.rotation)),
  ...backdropDetails(),
];

const FOLIAGE_COLORS = ['#415d47', '#52714e', '#647c53', '#496548', '#71845d'];
export const CITY_TREE_CANOPIES: TreeCanopy[] = TREE_POSITIONS.flatMap((origin, tree) => {
  const clusters: TreeCanopy[] = [
    { p: [origin[0], 3.65, origin[2]], s: [2.5, 2.6, 2.45], color: FOLIAGE_COLORS[tree % 5], tree },
    { p: [origin[0] + .12, 4.04, origin[2] - .1], s: [1.7, 1.8, 1.75], color: FOLIAGE_COLORS[(tree + 2) % 5], tree },
  ];
  for (let cluster = 0; cluster < 7; cluster++) {
    const angle = cluster * Math.PI * 2 / 7 + tree * .63;
    clusters.push({
      p: [origin[0] + Math.cos(angle) * .76, 3.31 + .25 * Math.sin(angle * 2 + tree), origin[2] + Math.sin(angle) * .76],
      s: [1.66, 1.84, 1.62], color: FOLIAGE_COLORS[(tree + cluster) % 5], tree,
    });
  }
  return clusters;
});
