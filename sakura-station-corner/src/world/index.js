// 世界组装：地图层 + 资产摆放（坐标取自 docs/LAYOUT.md / plan.js）
// 每个资产来自独立模块文件；此处只做 import 与落位。几何数据永不改写、永不 merge；
// 允许的是「同一几何+同一材质的实例列表拼接」（InstancedMesh，逐件变换仍独立）。
import * as THREE from 'three';
import { grp, finish, put, rotY, autoInstance, mergeInstances, pruneHulls, pruneToClip, yieldToBrowser, setWorldClip, traceMark } from '../core/kit.js';

import * as Baseplate from './baseplate.js';
import * as Ground from './ground.js';
import * as RoadNetwork from './road-network.js';
import * as Crosswalk from './crosswalk.js';
import * as Drainage from './drainage.js';
import * as Sidewalk from './sidewalk.js';
import * as Alley from './alley.js';
import * as StationPlatform from './station-platform.js';
import * as StationTrack from './station-track.js';
import * as LevelCrossing from './level-crossing.js';
import { placeAll } from './placement.js';
import { CROP } from './plan.js';
import { markStatic } from '../core/lod.js';

/** 落位工具 */
export function place(parent, mod, { pos = [0, 0, 0], rotY: ry = 0, scale = 1, options = {}, name } = {}) {
  const o = mod.build(options);
  o.position.set(pos[0], pos[1], pos[2]);
  o.rotation.y = (ry * Math.PI) / 180;
  if (Array.isArray(scale)) o.scale.set(scale[0], scale[1], scale[2]);
  else if (scale !== 1) o.scale.setScalar(scale);
  if (name) o.name = name;
  if (options.lodPx) o.userData.lodPx = options.lodPx;   // 该资产的 LOD 剔除阈值覆盖（见 core/lod.js）
  parent.add(o);
  // 变换定稿：先修剪无价值的小描边壳，再折叠同类零件（资产内部可能还会改 lean 等）
  const t0 = performance.now();
  pruneHulls(o, options.hullMin ?? 0.16);
  // min 2：两个完全相同的零件（同一几何、同一材质、同一渲染状态）并成一次绘制调用
  // 就已经省一次 8.8 µs 的提交；零件仍是独立实例，几何数据不改写。
  autoInstance(o, { min: 2 });
  // 资产普遍「每个小群组 inst() 一次」（樱花每个花房一套花瓣/叶），
  // 同几何+同材质的实例再并一次才能把 draw call 压下来 —— 见 kit.mergeInstances
  mergeInstances(o);
  traceMark('misc', '收尾 ' + (name || mod.id || ''), t0);
  return o;
}

export async function buildWorld(engine) {
  const world = grp('world');
  setWorldClip(CROP);   // 必须在任何地图模块之前

  /* ---------- 地图层 ---------- */
  const map = grp('map');
  // 每个地图模块后真正让出一帧（rAF，不是微任务——微任务不会让浏览器绘制/派发指针事件）：
  // 底座/路网/站台各自要建上万图元，串起来就是十几秒主线程死锁，期间画面拖不动。
  const mk = async (n, f) => {
    const t0 = performance.now();
    map.add(f());
    traceMark('map', n, t0);
    await yieldToBrowser();
  };
  await mk('baseplate', Baseplate.build);
  await mk('ground', Ground.build);
  await mk('road', RoadNetwork.build);
  await mk('crosswalk', Crosswalk.build);
  await mk('drainage', Drainage.build);
  await mk('sidewalk', Sidewalk.build);
  await mk('alley', Alley.build);
  await mk('platform', StationPlatform.build);
  await mk('track', StationTrack.build);
  await mk('crossing', LevelCrossing.build);
  pruneToClip(map);   // 兜底：地图模块里直接 mesh(box(...)) 自由排布的散件按世界位置收口
  const post0 = performance.now();
  pruneHulls(map, 0.14);
  autoInstance(map, { min: 4 });
  mergeInstances(map);
  traceMark('misc', 'map 收尾(prune/autoInstance/merge)', post0);
  world.add(map);

  /* ---------- 资产层（按 docs/LAYOUT.md 落位） ---------- */
  const assets = grp('assets');
  await placeAll(assets, engine);
  const post1 = performance.now();
  markStatic(assets);
  markStatic(map);
  traceMark('misc', 'markStatic', post1);
  world.add(assets);
  if (engine) engine.assetsGroup = assets;
  world.map = map;
  return world;
}

export { Baseplate, Ground, RoadNetwork, Crosswalk, Drainage, Sidewalk, Alley, StationPlatform, StationTrack, LevelCrossing };
