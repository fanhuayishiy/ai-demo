// 花枝微风：对资产内标记 userData.sway 的组施加极小幅摆动
import * as THREE from 'three';

export const NAME = 'branch-sway';

/**
 * 资产在需要摆动的枝/冠 Group 上设置：
 *   obj.userData.sway = { amp: 0.012, freq: 0.55, phase: 1.2, axis: 'z', lean: 0.3 }
 * 摆动以该组自身原点为枢轴（因此枝干原点必须挂在枝根）。
 */
export function attach(engine, world) {
  const targets = [];
  world.traverse((o) => {
    const s = o.userData?.sway;
    if (!s) return;
    targets.push({
      o,
      base: { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z },
      amp: s.amp ?? 0.012,
      freq: s.freq ?? 0.55,
      phase: s.phase ?? (o.id * 0.73) % 6.283,
      axis: s.axis || 'z',
      lean: s.lean ?? 0.35,
    });
  });
  if (!targets.length) return null;

  const gusts = [
    { f: 0.19, a: 1.0 },
    { f: 0.43, a: 0.42 },
    { f: 0.87, a: 0.18 },
  ];

  engine.onUpdate((dt, t) => {
    let g = 0;
    for (const k of gusts) g += Math.sin(t * k.f * 6.2831 + k.a * 1.7) * k.a;
    g = 0.58 + g * 0.3;
    for (const s of targets) {
      const a = Math.sin(t * s.freq + s.phase) * s.amp * g + Math.sin(t * s.freq * 2.3 + s.phase * 1.7) * s.amp * 0.32 * g;
      if (s.axis === 'z') s.o.rotation.z = s.base.z + a;
      else if (s.axis === 'x') s.o.rotation.x = s.base.x + a * s.lean;
      else {
        s.o.rotation.z = s.base.z + a;
        s.o.rotation.x = s.base.x + a * s.lean * 0.7;
      }
    }
  });
  return { targets };
}
