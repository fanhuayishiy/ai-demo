export const ROAD = Object.freeze({
  carLength: 3.6, stopLine: 12.6, stopPosition: -14.65,
  clearancePosition: 14.65, crossingLength: 20, crossingOffset: 10.2,
});
export const CROSSWALKS = Object.freeze([
  { id: 0, name: '北侧', travelAxis: 'ew', conflictAxis: 'ns' },
  { id: 1, name: '东侧', travelAxis: 'ns', conflictAxis: 'ew' },
  { id: 2, name: '南侧', travelAxis: 'ew', conflictAxis: 'ns' },
  { id: 3, name: '西侧', travelAxis: 'ns', conflictAxis: 'ew' },
]);
export const axisName = axis => axis === 'ns' ? '南北' : '东西';
export const oppositeAxis = axis => axis === 'ns' ? 'ew' : 'ns';
export function vehiclePose({ dir, p }) {
  return dir === 'N' ? { x: -2.4, z: p, rot: 0 }
    : dir === 'S' ? { x: 2.4, z: -p, rot: Math.PI }
    : dir === 'W' ? { x: p, z: 2.4, rot: Math.PI / 2 }
    : { x: -p, z: -2.4, rot: -Math.PI / 2 };
}
export function pedestrianPose(p, time = 0) {
  const direction = p.side ? -1 : 1;
  let distance = p.state === 'crossing' || p.state === 'done' ? p.progress * ROAD.crossingLength : 0;
  if (p.state === 'approach') distance = -3 + p.approach * 3;
  if (p.state === 'done') distance += (time - p.doneAt) * .7;
  const x = direction * (-10 + distance), z = -ROAD.crossingOffset + direction * .3;
  const a = p.crosswalk * Math.PI / 2;
  return { x: x * Math.cos(a) - z * Math.sin(a), z: x * Math.sin(a) + z * Math.cos(a), rot: Math.PI / 2 - a + (p.side ? Math.PI : 0) };
}
