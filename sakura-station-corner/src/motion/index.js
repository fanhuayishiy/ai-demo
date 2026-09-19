// 动效注册中心：所有动态系统在此挂载（模块各自容忍目标缺失）
import { yieldToBrowser } from '../core/kit.js';
import * as PetalStorm from './petal-storm.js';
import * as BranchSway from './branch-sway.js';
import * as LightBreath from './light-breath.js';
import * as GlassShimmer from './glass-shimmer.js';
import * as TrafficSignal from './traffic-signal.js';
import * as AirHaze from './air-haze.js';

const SYSTEMS = [PetalStorm, BranchSway, LightBreath, GlassShimmer, TrafficSignal, AirHaze];


/**
 * 逐个让出：petal-storm 要建 6700 个实例、light-breath 要遍历全场景换材质，
 * 串在一起会把主线程锁死十秒以上，用户此时拖不动画面。
 */
export async function registerMotion(engine, world) {
  const active = [];
  for (const s of SYSTEMS) {
    await yieldToBrowser();
    try {
      const r = s.attach ? s.attach(engine, world) : null;
      if (r) active.push({ name: s.NAME || 'motion', handle: r });
    } catch (e) {
      console.warn('[motion] attach failed:', s.NAME || s, e);
    }
  }
  engine.motion = active;
  return active;
}
