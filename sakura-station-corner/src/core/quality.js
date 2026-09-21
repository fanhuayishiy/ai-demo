// 设备分档：把「渲染预算」从一个写死的常量变成按机器能力选出来的档位。
//
// 为什么必须有：`createEngine({ canvas })` 过去完全不接 quality，等于任何机器都按
// 「dpr 上限 2 + 2048² 阴影 + LOD 阈值 26」跑。实测 1600×900 / dpr1 / RTX 4060 下
// CPU 提交 81 ms、交互 14.5 fps —— 而 draw call 数与分辨率无关，所以一台 dpr 2 的
// 笔记本要付 4 倍像素 **加上同样 7300 次提交**，弱机直接不可用。
//
// 平涂模式已经把 edge/dof/bloom/grade 全关了（core/style.js 的 postChain），
// 所以后期不是瓶颈，瓶颈是「视锥内可绘制对象数 × 每次提交成本」。
// 这一档只动三件事：渲染分辨率、LOD 剔除阈值、阴影贴图尺寸。
const TIERS = {
  // hi 就是历史行为：画面与之前逐像素一致，不加不减。
  hi: { name: 'hi', pixelRatio: 2, shadow: 2048, lodPx: 26, hullRange: 10 },
  mid: { name: 'mid', pixelRatio: 1.3, shadow: 1536, lodPx: 34, hullRange: 9 },
  lo: { name: 'lo', pixelRatio: 1, shadow: 1024, lodPx: 46, hullRange: 8 },
};

const ORDER = ['lo', 'mid', 'hi'];

/** 只向下取档，永不因为一次抖动就升回去（来回切会表现为画质呼吸） */
export function downgrade(name) {
  const i = ORDER.indexOf(name);
  return i <= 0 ? null : ORDER[i - 1];
}

export function qualityOf(name) {
  const q = TIERS[name] || TIERS.hi;
  // ?lodpx=N：单独拨「投影像素剔除阈值」，用来量 阈值 ↔ 帧率 ↔ 画面 这条曲线，
  // 不动 dpr / 阴影 / 描边距离。装配期（installLod）与降档期（applyQuality）都读这一份。
  const px = Number(typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lodpx') : 0);
  return px > 0 ? { ...q, lodPx: px } : q;
}

/**
 * 初始档位靠设备信号猜，不靠 UA 字符串。
 * 猜错的代价由 adapt() 在真实帧率上兜底，所以这里宁可保守。
 */
export function pickTier() {
  const forced = typeof location !== 'undefined' && new URLSearchParams(location.search).get('q');
  // 返回**档名**而不是档位对象：调用方 pickTier() 的契约是字符串，
  // 这里直接返回对象会让 qualityOf() 查不到而下文静默回落到 hi。
  if (forced && TIERS[forced]) return forced;

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  const cpu = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 8;
  const dpr = nav.devicePixelRatio || 1;
  const px = (window.innerWidth || 1440) * (window.innerHeight || 900) * dpr * dpr;

  let score = 2;
  if (mem < 8 || cpu <= 8) score = Math.min(score, 1);
  if (mem < 4 || cpu <= 4) score = 0;
  // 4K/Retina 面板上像素量本身就是负担，即便 GPU 还行也先给 mid
  if (px > 6.2e6 && score === 2) score = 1;
  return ORDER[score];
}

/** 把档位落到 renderer / LOD 上，可反复调用（降档时复用同一个入口） */
export function applyQuality(engine, q) {
  const dpr = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
  if (engine.renderer.getPixelRatio() !== dpr) engine.setPixelRatio(dpr);
  engine.shadowMapSize(q.shadow);
  engine.lod?.setThresholds({ pxThreshold: q.lodPx, hullRange: q.hullRange });
  engine.quality = q;
  return q;
}

/**
 * 用真实帧率兜底猜错的档位。
 *
 * 只在装配完成、画面稳定之后开始数帧（`grace` 秒），否则会把「装配期本来就慢的帧」
 * 误读成机器不行。降档单向：一次实测不达标就降一档，再观察，直到达标或落到 lo。
 * 不升档 —— 升档会让画面在用户眼前来回呼吸，比一直低一档更糟。
 */
export function installAdapt(engine, { targetFps = 24, window = 2.5, grace = 3 } = {}) {
  let t = 0, acc = 0, frames = 0, cool = 0;
  engine.onUpdate((dt) => {
    if (!engine.ready) return;
    t += dt;
    if (t < grace) return;
    if (cool > 0) { cool -= dt; if (cool > 0) return; }
    acc += dt; frames++;
    if (acc < window) return;
    const fps = frames / acc;
    acc = 0; frames = 0;
    if (fps >= targetFps) return;
    const next = downgrade(engine.quality?.name);
    if (!next) return;
    applyQuality(engine, qualityOf(next));
    console.info(`[quality] 实测 ${fps.toFixed(1)} fps < ${targetFps} → 降到 ${next}（dpr ${qualityOf(next).pixelRatio} / 阴影 ${qualityOf(next).shadow} / LOD ${qualityOf(next).lodPx}px）`);
    cool = 4;   // 降档本身要重算 composer 与阴影贴图，给几秒稳定期再测
  });
}
