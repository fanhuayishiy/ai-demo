// 灯光呼吸：路灯 / 店铺灯箱 / 室内灯带 的极轻微明暗起伏
import * as THREE from 'three';
import { uniqueOf } from '../core/toon.js';
import { WX } from '../weather/index.js';

export const NAME = 'light-breath';

/**
 * 资产在灯具根节点上设置：
 *   obj.userData.breathe = { speed: 0.42, amount: 0.07, phase: 0, kind: 'lamp' }
 * 该节点下所有网格的材质会被替换为独立副本，逐个呼吸，互不影响。
 */
export function attach(engine, world) {
  const list = [];
  const tagged = [];
  world.traverse((o) => {
    if (o.userData?.breathe) tagged.push(o);
  });

  for (const root of tagged) {
    const cfg = typeof root.userData.breathe === 'object' ? root.userData.breathe : {};
    const mats = [];
    // 安全弁：breathe を「大きな群の根」に付けると全 Mesh が個別マテリアル化され、
    // ユニフォーム別枠のシェーダが数百本発生して描画が安定しない（明滅の原因）。
    // 灯器単位で付けること。上限を超えた Mesh は共有マテリアルのまま呼吸させない。
    const CAP = cfg.maxMats ?? 40;
    root.traverse((n) => {
      if (!n.isMesh || n.userData?.isHull) return;
      const src = n.material;
      if (!src || Array.isArray(src)) return;
      if (mats.length >= CAP) return;
      if (!n.userData._breathMat) {
        const u = uniqueOf(src);
        n.material = u;
        n.userData._breathMat = true;
      }
      if (mats.every((x) => x.m !== n.material)) {
        mats.push({
          m: n.material,
          baseEmissive: n.material.emissiveIntensity ?? 1,
          baseColor: n.material.color ? n.material.color.clone() : null,
          gain: n.material.userData?.spec?.breatheGain ?? 1,
        });
      }
    });
    if (mats.length > CAP) console.warn('[light-breath] 呼吸マテリアルが上限超過', root.name);
    if (mats.length) {
      list.push({
        mats,
        speed: cfg.speed ?? 0.42,
        amount: cfg.amount ?? 0.06,
        phase: cfg.phase ?? Math.random() * 6.283,
        flicker: cfg.flicker ?? 0,
        lights: (cfg.lights || []).map((l) => (typeof l === 'string' ? root.getObjectByName(l) : l)).filter(Boolean),
      });
    }
  }

  if (!list.length) return null;

  engine.onUpdate((dt, t) => {
    // 天气决定的整体亮度乘数：夜里灯具要自己把画面点亮，雨天白天也开灯。
    // 乘在这里而不是去改每个材质的 baseEmissive，是为了让呼吸与天气两个系统互不知情。
    const gain = WX.lampGain;
    for (const s of list) {
      const w = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
      let k = 1 - s.amount + w * s.amount * 2 * 0.5;
      if (s.flicker) {
        const n = Math.sin(t * 21.3 + s.phase) * Math.sin(t * 7.7 + s.phase * 2.1);
        k *= 1 - Math.max(0, n) * s.flicker;
      }
      for (const e of s.mats) {
        if (e.baseColor && e.m.color) e.m.color.copy(e.baseColor).multiplyScalar(THREE.MathUtils.lerp(1 - s.amount * 0.5, 1 + s.amount, w));
        if (e.m.emissiveIntensity !== undefined) e.m.emissiveIntensity = e.baseEmissive * (0.94 + 0.12 * w) * e.gain * gain;
      }
      for (const lo of s.lights) {
        if (lo.isLight) lo.intensity = lo.userData._baseI ?? (lo.userData._baseI = lo.intensity);
        if (lo.isLight) lo.intensity = lo.userData._baseI * (0.88 + 0.24 * w) * gain;
      }
    }
  });
  return { list };
}
