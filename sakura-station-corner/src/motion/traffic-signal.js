// 交通信号与踏切警灯：缓慢渐变的灯色循环（白昼下柔和可见，不刺眼）
import * as THREE from 'three';
import { uniqueOf } from '../core/toon.js';

export const NAME = 'traffic-signal';

const KINDS = {
  red: { on: '#ff4a3c', off: '#4a2b2b', base: 1.0 },
  yellow: { on: '#ffcf52', off: '#4a412c', base: 1.0 },
  green: { on: '#5fe28a', off: '#2c4536', base: 1.0 },
  walk: { on: '#63e08f', off: '#2f4536', base: 1.0 },
  stop: { on: '#ff5b4a', off: '#4a2f2c', base: 1.0 },
  count: { on: '#ffb04a', off: '#3a3327', base: 0.8 },
  crossing: { on: '#ff3f30', off: '#3a2422', base: 1.0 },
};

/**
 * 资产在灯头 Mesh 上写：userData.signalLamp = { kind:'red'|'yellow'|'green'|'walk'|'stop'|'count'|'crossing', group:'v'|'p'|'x', index:0 }
 * group: v=车辆, p=步行者, x=踏切
 */
export function attach(engine, world) {
  const lamps = [];
  world.traverse((o) => {
    const cfg = o.userData?.signalLamp;
    if (!cfg) return;
    const src = o.material;
    const mat = uniqueOf(src);
    o.material = mat;
    if (mat.emissive) mat.emissive = new THREE.Color(KINDS[cfg.kind]?.on ?? '#fff');
    lamps.push({
      mat,
      kind: cfg.kind || 'red',
      group: cfg.group || 'v',
      index: cfg.index || 0,
      baseOn: KINDS[cfg.kind]?.on ?? '#ffffff',
      baseOff: KINDS[cfg.kind]?.off ?? '#2a2a2a',
      baseEmissive: mat.emissiveIntensity ?? 1,
      wasOn: null,
    });
  });
  if (!lamps.length) return null;

  const _c = new THREE.Color();
  // 周期（秒）：车辆 绿10 / 黄2.5 / 红11 ；步行者 绿8 / 点灭3 / 红11
  const CYC = { v: [10, 2.5, 11], p: [8, 3, 11] };
  const FADE = 1.15; // 渐变时长（缓慢）

  function phase(group, t) {
    const [a, b, c] = CYC[group] || CYC.v;
    const total = a + b + c;
    const x = t % total;
    if (x < a) return { state: 0, k: fade(x, a) };
    if (x < a + b) return { state: 1, k: 1 };
    return { state: 2, k: 1 };
  }
  function fade(x, len) {
    // 段末淡出 / 段初淡入
    return Math.min(1, x / FADE, (len - x) / FADE + 0.0);
  }

  engine.onUpdate((dt, t) => {
    const pv = phase('v', t);
    const pp = phase('p', t);
    for (const L of lamps) {
      let level = 0;
      if (L.group === 'v') level = (L.kind === 'green' && pv.state === 0) || (L.kind === 'yellow' && pv.state === 1) || (L.kind === 'red' && pv.state === 2) ? pv.state === 0 ? pv.k : 1 : 0;
      else if (L.group === 'p') {
        const on = (L.kind === 'walk' && pp.state === 0) || (L.kind === 'stop' && pp.state === 2);
        const blink = L.kind === 'walk' && pp.state === 1 ? (Math.sin(t * 5.2) > 0 ? 1 : 0.08) : 1;
        level = on ? 1 : L.kind === 'count' ? 0.55 : 0.06;
        if (on) level *= blink;
      } else if (L.group === 'x') {
        // 踏切：左右交替的柔和呼吸（非刺眼闪烁）
        const ph = L.index % 2 ? Math.PI : 0;
        level = 0.16 + 0.84 * Math.max(0, Math.sin(t * 2.1 + ph)) ** 1.6;
      } else level = 0.5 + 0.5 * Math.sin(t * 0.7 + L.index);
      if (L.group === 'v' && L.kind === 'green' && pv.state === 0) level = Math.max(0.35, pv.k);
      if (L.group === 'v' && L.kind === 'red' && pv.state !== 2) level = 0.05;
      const k = THREE.MathUtils.clamp(level, 0, 1);
      _c.set(L.baseOff).lerp(_c.clone().set(L.baseOn), k);
      if (L.mat.color) L.mat.color.copy(_c);
      if (L.mat.emissiveIntensity !== undefined) L.mat.emissiveIntensity = L.baseEmissive * (0.12 + k * 1.55);
      L.mat.toneMapped = true;
    }
  });
  return { lamps };
}
