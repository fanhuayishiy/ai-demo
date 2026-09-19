// 入口引导：引擎 + 世界组装 + 动效系统（无任何 UI / 文字 / 控件）
import { createEngine } from './core/engine.js';
import { buildWorld } from './world/index.js';
import { registerMotion } from './motion/index.js';
import { installLod } from './core/lod.js';

/**
 * 装配收进 async 函数，入口模块保持「同步完成求值」。
 * 顶层 await 会把入口 chunk 变成异步模块：Rollup 分包后，资产 chunk 反过来引用入口里的
 * 共享代码（kit / materials / textures），带 TLA 的循环在构建产物里直接死锁 ——
 * `import()` 既不报错也不 resolve（开发服务器逐文件加载时看不出来）。
 */
async function boot() {
  const canvas = document.getElementById('stage');
  // 装配耗时是交付指标之一（「打开太慢」必须能被量化），记在 engine.timings 上给工具读；
  // 页面上仍然不出现任何东西，零 UI 不变。
  const T0 = performance.now();
  const timings = {};

  const engine = createEngine({ canvas });
  // 尽早暴露：装配分批让出主线程，工具（以及调试者）需要能在建图过程中就轮询状态
  window.__DIORAMA__ = engine;
  timings.engine = Math.round(performance.now() - T0);

  const world = await buildWorld(engine);
  engine.add(world);
  timings.world = Math.round(performance.now() - T0);

  // LOD 阈值：本场景有 ~3.2 万个独立 Mesh（每件道具单独建模、不合并几何），
  // 实测 Chrome/ANGLE 下每个 draw call 约 8.3 µs 的 CPU 提交成本，且 85% 的帧时间就是提交
  // （把分辨率降到 400×300 只从 77 ms 掉到 65 ms → 不是填充率问题）。
  // 默认 18px 时近景仍有 ~10200 次提交；抬到 26px（≈ 画面高度 2.9%，2 cm 的标签在 14 m 外）
  // 实测 store 100.8→79.8 ms、interior 109→85.2 ms、hero 73.3→64.4 ms。
  // 隐藏的是「屏幕上已经小于 26 像素」的零件，拉近即逐件回归 —— 模型本身没有被简化。
  engine.lod = installLod(engine, world, { pxThreshold: 26, hullRange: 10, interval: 0.12 });
  timings.lod = Math.round(performance.now() - T0);
  await registerMotion(engine, world);
  timings.motion = Math.round(performance.now() - T0);

  // 引擎从创建起就在跑（ready = 已渲染 >2 帧），所以 ready 只代表「画面活着」，
  // 不代表「世界建完」。装配是分批让出主线程的，工具必须等这个标记再截图。
  engine.built = true;
  engine.timings = timings;
  // 阴影贴图现在只在画面静止时重绘，装配期间的若干次重绘可能都发生在世界建完之前，
  // 所以建完后再点一次脏，确保最终状态有一张完整的阴影贴图。
  engine.markShadowsDirty();
}

boot();
