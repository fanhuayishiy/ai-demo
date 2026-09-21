// 入口引导：引擎 + 世界组装 + 动效系统。
// 成品画面零 UI / 零文字 / 零控件；唯一的例外是装配期的加载状态，它在首帧画出来后即摘除。
import { createEngine, BOOT_PHASES } from './core/engine.js';
import { attachBootScreen } from './core/boot-screen.js';
import { attachFpsHud } from './core/fps-hud.js';
import { texCacheInfo } from './core/textures.js';
import { TRACE } from './core/kit.js';
import { buildWorld } from './world/index.js';
import { registerMotion } from './motion/index.js';
import { installLod } from './core/lod.js';
import { installGpuSway } from './core/sway-gpu.js';
import { pickTier, qualityOf, installAdapt } from './core/quality.js';
import { installWeather } from './weather/index.js';

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
  // T0 本身就是「导航 → 入口代码开始跑」的墙钟：模块下载 + 解析 + 求值全算在里面。
  // 不记这一段的话，工具看到的「到 built 11 s」里有几秒是 JS 加载，却无处可查。
  timings.bootstrap = Math.round(T0);
  /**
   * 装配期引擎的 rAF 循环照跑：每次 await 让出主线程都可能插进一整帧。
   * 分不清「代码慢」还是「被渲染挤占」时，看 phaseMs 旁边的 renderMs 增量。
   */
  const mark = (key) => {
    timings[key] = Math.round(performance.now() - T0);
    timings[key + '_render'] = engine.renderMs;
    timings[key + '_frames'] = engine.frames;
  };

  // 设备分档：createEngine 过去完全不接 quality，任何机器都按 dpr 上限 2 + 2048² 阴影跑。
  // 先按设备信号猜一档，装配完成后 adapt() 再用真实帧率向下修（永不升档，避免画质呼吸）。
  const tier = pickTier();
  const q = qualityOf(tier);
  const engine = createEngine({ canvas, quality: q });
  engine.quality = q;
  // 尽早暴露：装配分批让出主线程，工具（以及调试者）需要能在建图过程中就轮询状态
  window.__DIORAMA__ = engine;
  engine.trace = TRACE;   // ?trace=1 时才有内容，零 UI 场景下耗时剖析的唯一出口
  // 加载状态：包住 markProgress，装配代码照常报进度，画面外那一层跟着走。
  // 它是整个页面里唯一一处 DOM 覆盖层，首帧画出来就摘掉。
  const bootScreen = attachBootScreen(engine);
  engine.markProgress(0.02, '起画布');
  mark('engine');

  const world = await buildWorld(engine);
  engine.add(world);
  mark('world');
  // 摆动件合并：把枝条组里的花瓣批次抽出来按树合成一个批次，摆动改由顶点着色器应用
  // （动画仍在 CPU 的 257 个组上）。必须在 installLod 之前 —— LOD 要看见合并后的批次。
  engine.swayGpu = installGpuSway(engine, world);

  // LOD 阈值：本场景有 ~3.2 万个独立 Mesh（每件道具单独建模、不合并几何），
  // 实测 Chrome/ANGLE 下每个 draw call 约 10.3 µs 的 CPU 提交成本，且帧时间的九成就是提交
  // （五点拟合 ms ≈ 10.3 µs × 提交数 + 0.31 ms × 百万三角 + 3.4 ms，见 docs 阶段 38）。
  // 历史：18px 时近景仍有 ~10200 次提交 → 抬到 26px（≈ 画面高度 2.9%）；
  // 2026-09-21 阶段 39 按拍板抬到 90px（≈ 画面高度 5.6%），1600×900 持续拖拽 +30% 帧率。
  // 隐藏的是「屏幕上已经小于 90 像素」的零件，拉近即逐件回归 —— 模型本身没有被简化。
  // 要复看旧画面：?lodpx=26（这个口同时是用来做曲线测量的，见 quality.js）。
  engine.lod = installLod(engine, world, { pxThreshold: q.lodPx, hullRange: q.hullRange, interval: 0.12 });
  engine.markProgress(BOOT_PHASES.lod, '整理可见性');
  mark('lod');
  await registerMotion(engine, world);
  mark('motion');
  // 天气装在动效之后：rain-shower / petal-storm / light-breath 都读 WX，
  // 而 installWeather 会把 ?weather= 指定的起始天气立刻推一遍。
  engine.weather = installWeather(engine);
  engine.setWeather = (n) => engine.weather && engine.weather.set(n);
  engine.markProgress(BOOT_PHASES.weather, '调好天光');
  mark('weather');
  // 右上角帧率读数（?fps=0 关）。放在天气之后：它要跟着天气切亮/暗配色。
  engine.fpsHud = attachFpsHud(engine);
  // 猜错的档位由真实帧率兜底：装配完成、画面稳定 3 秒后才开始数帧，
  // 不达标就单向降一档（dpr / 阴影贴图 / LOD 阈值一起动），最多降到 lo。
  installAdapt(engine);

  // 引擎从创建起就在跑（ready = 已渲染 >2 帧），所以 ready 只代表「画面活着」，
  // 不代表「世界建完」。装配是分批让出主线程的，工具必须等这个标记再截图。
  engine.built = true;
  engine.timings = timings;
  engine.texCacheInfo = texCacheInfo;   // 贴图字节账，供 tools/boot-trace.mjs 读
  // 阴影贴图现在只在画面静止时重绘，装配期间的若干次重绘可能都发生在世界建完之前，
  // 所以建完后再点一次脏，确保最终状态有一张完整的阴影贴图。
  engine.markShadowsDirty();
  engine.markProgress(1, '就绪');
  // 加载层要等「首帧真的画上屏幕」才撤：built 之后仍有约 1.5 s 的 GPU 首触
  // （上传视锥内那 1.6k 份几何 + 333 张贴图 + 建 59 个着色器程序 + 一次全场景阴影 bake）。
  // 在 built 那一刻就撤掉，用户会看到「进度条满了、画面还是空的」。
  requestAnimationFrame(() => requestAnimationFrame(() => bootScreen.hide()));
  // 兜底：后台标签页里 rAF 挂起，不摘掉的话无头工具等「加载层消失」会一直等到超时。
  setTimeout(() => bootScreen.hide(), 6000);
}

boot();
