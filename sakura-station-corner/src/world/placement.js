// 资产落位总表：docs/LAYOUT.md 的坐标 → 场景实例
// 通过 Vite 的 import.meta.glob 静态收集 src/assets/**/*.js，清单里写明的资产会自动入场景；
// 尚未交付的资产会被记录到 engine.missing（便于装配阶段核对，不会中断运行）。
import { grp, yieldToBrowser, traceMark, THREE } from '../core/kit.js';
import { place } from './index.js';
import { SEG, STORE, POLES, SPANS, PLOT, RAIL, CROSSWALK, CROP } from './plan.js';

// Vite 构建期把 import.meta.glob 替换为「路径 → 动态 import」表；
// 单个资产文件出错只会让它自己加载失败，不会拖垮整个场景。Node 下无该 API，降级为空表。
let FILES = {};
try {
  FILES = import.meta.glob('../assets/**/*.js');
} catch {
  FILES = {};
}

const resolved = new Map();

/**
 * 一次性并发预热所有资产 chunk。
 * 本地 localhost 察觉不到问题，但构建产物把资产切成 ~100 个 lazy chunk，
 * 而下面的清单循环是 `await resolveModule(file)` 逐个取 —— 放到 GitHub Pages 上
 * 就是 100 次串行往返：同一份产物，世界阶段从 4.2 s 涨到 31.4 s（tools/net-lag.mjs
 * 给每个 chunk 加 120 ms 即可在本地复现，加前 13.9 s / 加后见下）。
 * 这里提前把 import() 全部发起，循环里的 await 就只是查表；
 * 同一 URL 的第二次 import() 走 ES 模块注册表，不会再发一次请求。
 * 单个文件失败仍只丢它自己（吞掉 rejection，让 resolveModule 那边照常告警）。
 */
try {
  for (const key of Object.keys(FILES)) Promise.resolve().then(() => FILES[key]()).catch(() => {});
} catch { /* Node（tools/check-assets.mjs）下没有 glob */ }

export async function resolveModule(file) {
  if (resolved.has(file)) return resolved.get(file);
  const fn = FILES[`../assets/${file}.js`];
  if (typeof fn !== 'function') {
    resolved.set(file, null);
    return null;
  }
  try {
   
    const m = await fn();
   
    const ok = m && typeof m.build === 'function' ? m : null;
    if (!ok) console.warn('[placement] 模块未导出 build():', file);
    resolved.set(file, ok);
    return ok;
  } catch (e) {
    console.warn('[placement] 模块加载失败:', file, e && e.message);
    resolved.set(file, null);
    return null;
  }
}

/** 落位清单（顺序 = 装配顺序，同类聚在一起便于核对） */
export const PLACEMENT = [
  /* ---------------- 植生 ---------------- */
  // 桜の主木は西端の空き地（x -18..-11.2, z -9.4..-3.4）中央寄せ。
  // 元の名残（-16.2 + 樹冠 5.6）だと枝先が x=-19.0 まで出て台座に載らないため、
  // 枠内に収まる範囲で樹高 5.2 / 幅 4.5 に置き、東へ 1.7 m 寄せている。
  ['flora/sakura-somei-yoshino', [-14.5, 0, -6.6], 0, 1.0, { seed: 11, height: 5.2, spread: 4.5, age: 1 }, 'sakura-a1'],
  ['flora/sakura-somei-yoshino', [-0.6, 0, -2.6], 90, 0.86, { seed: 23, height: 4.9, spread: 4.6 }, 'sakura-a2'],
  ['flora/sakura-somei-yoshino', [16.6, 0, 12.2], 0, 0.92, { seed: 37, height: 5.1, spread: 4.8 }, 'sakura-a3'],
  ['flora/sakura-somei-yoshino', [-9.6, 0, 15.6], 0, 0.58, { seed: 41, height: 3.3, spread: 2.9, age: 0.4 }, 'sakura-a4'],
  ['flora/sakura-late-yaezeni', [2.6, 0, -6.6], 0, 0.9, { seed: 53, height: 4.6 }, 'sakura-b1'],
  ['flora/sakura-late-yaezeni', [15.2, 0, 8.2], 0, 0.8, { seed: 61, height: 4.1 }, 'sakura-b2'],
  ['flora/sakura-branch-detail', [-14.6, 0.156, 5.6], 20, 1, { seed: 71 }, 'sakura-branch-1'],
  ['flora/sakura-branch-detail', [-5.4, 0.16, 5.2], -35, 0.9, { seed: 73 }, 'sakura-branch-2'],
  ['flora/sakura-branch-detail', [-11.9, 0.02, -6.2], 120, 1.05, { seed: 77 }, 'sakura-branch-3'],
  ['flora/street-tree-keyaki', [-6.2, 0.15, 15.3], 0, 0.8, { seed: 81, height: 4.2 }, 'keyaki-1'],
  ['flora/street-tree-keyaki', [5.2, 0.15, 15.3], 0, 0.72, { seed: 83, height: 3.8 }, 'keyaki-2'],
  ['flora/street-tree-keyaki', [-13.4, 0.15, 6.35], 0, 0.6, { seed: 87, height: 3.2 }, 'keyaki-3'],
  ['flora/hedge', [-16.5, 0, 4.6], 90, 1, { len: 3.4, h: 0.72, seed: 91 }, 'hedge-1'],
  // hedge-2（旧 x=-18 的东西向き生垣）は取景框の外。民家の西界隈そのものが枠から落ちたので削除。
  ['flora/hedge', [1.2, 0.72, -11.8], 0, 1, { len: 2.4, h: 0.5, seed: 95 }, 'hedge-3'],
  ['flora/flower-bed', [-1.6, 0, -8.2], 0, 1, { w: 2.2, d: 0.9, seed: 101 }, 'flower-bed'],
  // 法面：z 方向の圧縮を 0.115 → 0.16 に緩め、法先が軌道帯を侵さないよう北へ寄せる
  ['flora/grass-slope', [0, 0, -17.72], 0, [1, 0.55, 0.16], { len: 36, height: 1.6, seed: 111 }, 'grass-slope'],
  ['flora/potted-plant', [-11.0, 0.16, 4.3], 0, 1, { kind: 'conifer', seed: 121 }, 'potted-store-1'],
  ['flora/potted-plant', [-2.25, 0.222, 4.3], 0, 0.9, { kind: 'seasonal', seed: 123 }, 'potted-store-2'],
  ['flora/potted-plant', [-13.4, 0, -1.4], 0, 1, { kind: 'bigpot', seed: 127 }, 'potted-minka'],
  ['flora/ground-cover', [-14.5, 0.01, -6.4], 0, 1, { area: [4, 4], kind: 'moss', seed: 131 }, 'cover-1'],
  ['flora/ground-cover', [-11.4, 0.01, -7.6], 0, 1, { area: [3, 3], kind: 'fallen-petals', seed: 133 }, 'cover-2'],
  ['flora/ground-cover', [2.2, 0.01, 16.2], 0, 1, { area: [6, 2], kind: 'weeds-crack', seed: 137 }, 'cover-3'],

  /* ---------------- 便利店外壳 ---------------- */
  ['store/convenience-store', [STORE.cx, 0, STORE.cz], 0, 1, { seed: 201 }, 'store'],
  ['store/glass-curtain-wall', [STORE.cx, 0, STORE.z1], 0, 1, { seed: 203 }, 'store-glass'],
  ['store/auto-door', [STORE.doorX, 0, STORE.z1 + 0.02], 0, 1, { seed: 207, open: 0.35 }, 'store-door'],
  ['store/awning', [STORE.cx, 0, STORE.z1], 0, 1, { seed: 211 }, 'store-awning'],
  ['store/store-signage', [STORE.cx, 3.42, STORE.z1 - 0.02], 0, 1, { kind: 'fascia', seed: 217, name: 'サクラ・マート' }, 'store-signage'],
  ['store/store-signage', [1.2, 0.15, 5.4], 0, 1, { kind: 'pylon', seed: 219 }, 'store-pylon'],
  ['store/store-signage', [STORE.x1 + 0.02, 0, 4.2], 90, 1, { kind: 'pillar', seed: 221 }, 'store-pillar'],
  ['store/entrance-mat', [STORE.doorX, STORE.floorY, STORE.z1 - 0.45], 0, 1, { seed: 223 }, 'store-mat'],
  ['store/exterior-poster-case', [STORE.x1 + 0.02, 1.05, 3.0], 90, 1, { kind: 'case', seed: 227 }, 'poster-case'],
  ['store/exterior-poster-case', [STORE.x0 - 0.02, 0.95, 1.4], 270, 1, { kind: 'flyer', seed: 229 }, 'flyer-box'],
  ['store/exterior-poster-case', [STORE.cx + 2.2, 1.05, STORE.z1], 0, 1, { kind: 'menu', seed: 231 }, 'menu-board'],
  ['store/backroom-door', [STORE.x1, 0, STORE.z0 + 1.2], 90, 1, { seed: 227 }, 'backroom-door'],
  ['store/wall-facilities', [STORE.cx, 0, STORE.z0], 180, 1, { seed: 231 }, 'wall-facilities'],
  // 铺面资产的原点＝地盤（y=0）：它自己的天端已经是 0.158 / 0.162 / 0.222。
  // 这里再抬 0.152 会把整条店前铺面抬到 0.31，实拍里就是「人行道上躺着的黑棒」。
  ['store/pavement-frontage', [STORE.cx, 0, STORE.z1 + 1.05], 0, 1, { seed: 233 }, 'frontage'],

  /* ---------------- 店前道具 ---------------- */
  ['street/vending-machine', [-10.62, 0.16, 5.72], 0, 1, { seed: 301, variant: 'drink' }, 'vending-front'],
  ['street/umbrella-stand', [-5.62, 0.16, 5.5], 0, 1, { seed: 307, slots: 6 }, 'umbrella-stand'],
  ['street/trash-bin-combustible', [-3.34, 0.222, 5.62], 0, 1, { seed: 311 }, 'bin-combustible'],
  ['street/trash-bin-recyclable', [-2.76, 0.222, 5.62], 0, 1, { seed: 313 }, 'bin-recyclable'],
  ['street/trash-bin-bottle-can', [-2.18, 0.222, 5.62], 0, 1, { seed: 317 }, 'bin-bottle'],
  ['street/flower-planter', [-8.35, 0.16, 5.66], 0, 1, { seed: 321 }, 'planter-1'],
  ['street/flower-planter', [-4.55, 0.16, 5.66], 0, 1, { seed: 323 }, 'planter-2'],
  ['street/ac-outdoor-unit', [STORE.cx + 1.4, 0, STORE.z0 - 0.34], 180, 1, { seed: 331, wallMount: true }, 'ac-1'],
  ['street/ac-outdoor-unit', [STORE.cx - 1.2, 0, STORE.z0 - 0.34], 180, 1, { seed: 333, wallMount: true }, 'ac-2'],
  ['street/ac-outdoor-unit', [STORE.x0 + 0.36, 0, STORE.z0 - 0.42], 180, 1, { seed: 337, wallMount: false }, 'ac-3'],
  ['street/bulletin-board', [0.4, 0.15, -6.2], 0, 1, { seed: 341, w: 1.8 }, 'bulletin'],
  ['street/post-box', [2.3, 0.15, 5.9], 0, 1, { seed: 347 }, 'post-box'],
  ['street/bench-wait', [1.1, 0.15, 5.9], 0, 1, { seed: 351 }, 'bench-wait'],
  ['street/vending-machine-tea', [-13.6, 0.72, -10.6], 0, 1, { seed: 357, variant: 'tea' }, 'vending-platform'],

  /* ---------------- 街道电气与交通 ---------------- */
  ['street/utility-pole', [POLES[0].x, 0, POLES[0].z], POLES[0].rotY, 1, { seed: 401, height: POLES[0].h, transformer: true }, 'pole-P0'],
  ['street/utility-pole', [POLES[1].x, 0, POLES[1].z], POLES[1].rotY, 1, { seed: 403, height: POLES[1].h, transformer: false }, 'pole-P1'],
  ['street/utility-pole', [POLES[2].x, 0, POLES[2].z], POLES[2].rotY, 1, { seed: 407, height: POLES[2].h, transformer: true }, 'pole-P2'],
  ['street/utility-pole', [POLES[3].x, 0, POLES[3].z], POLES[3].rotY, 1, { seed: 409, height: POLES[3].h, transformer: false }, 'pole-P3'],
  ['street/utility-pole', [POLES[4].x, 0, POLES[4].z], POLES[4].rotY, 1, { seed: 411, height: POLES[4].h, transformer: true }, 'pole-P4'],
  ['street/power-lines', null, 0, 1, { span: 0 }, 'wire-0'],
  ['street/power-lines', null, 0, 1, { span: 1 }, 'wire-1'],
  ['street/power-lines', null, 0, 1, { span: 2 }, 'wire-2'],
  ['street/power-lines', null, 0, 1, { span: 3 }, 'wire-3'],
  ['street/street-lamp-retro', [-8.8, 0.15, 6.4], 0, 1, { seed: 421, height: 4.6 }, 'lamp-1'],
  ['street/street-lamp-retro', [1.0, 0.15, 6.4], 0, 1, { seed: 423, height: 4.6 }, 'lamp-2'],
  ['street/street-lamp-retro', [-6.0, 0.72, -9.0], 0, 1, { seed: 427, height: 4.2 }, 'lamp-3'],
  ['street/traffic-light-vehicle', [1.7, 0.15, 6.5], 0, 1, { seed: 431, faces: 2 }, 'signal-vehicle'],
  ['street/traffic-light-pedestrian', [2.5, 0.15, 13.9], 180, 1, { seed: 433 }, 'signal-ped'],
  ['street/road-sign-set', [3.0, 0.15, 6.2], 0, 1, { kind: 'stop', seed: 441 }, 'sign-stop'],
  ['street/road-sign-set', [2.2, 0.15, 6.2], 0, 1, { kind: 'signal', seed: 443 }, 'sign-signal'],
  ['street/road-sign-set', [-4.6, 0.15, 6.3], 0, 1, { kind: 'speed30', seed: 447 }, 'sign-speed'],
  ['street/road-sign-set', [-1.2, 0.15, 13.9], 180, 1, { kind: 'bicycle-only', seed: 449 }, 'sign-bike'],
  ['street/road-sign-set', [10.2, 0.15, -10.6], 90, 1, { kind: 'crossing', seed: 451 }, 'sign-crossing'],
  ['street/road-sign-set', [-12.0, 0.15, 6.6], 0, 1, { kind: 'no-parking', seed: 453 }, 'sign-nopark'],
  ['street/road-sign-set', [-13.6, 0.15, 6.4], 0, 1, { kind: 'children', seed: 457 }, 'sign-children'],
  ['street/guard-rail', [-11.0, 0.15, 6.55], 0, 1, { len: 4, endType: 'middle', seed: 461 }, 'rail-1'],
  ['street/guard-rail', [-6.9, 0.15, 6.55], 0, 1, { len: 4, endType: 'middle', seed: 463 }, 'rail-2'],
  ['street/guard-rail', [9.7, 0.15, 12.0], 90, 1, { len: 4, endType: 'start', seed: 467 }, 'rail-3'],
  ['street/bollard', [2.0, 0.15, 6.9], 0, 1, { kind: 'pipe', seed: 471 }, 'bollard-1'],
  ['street/bollard', [2.9, 0.15, 7.3], 0, 1, { kind: 'pipe', seed: 473 }, 'bollard-2'],
  ['street/bollard', [1.4, 0.15, 4.6], 0, 1, { kind: 'concrete', seed: 477 }, 'bollard-3'],
  ['street/manhole-cover', [-5.0, 0, 9.6], 0, 1, { kind: 'manhole', size: 0.6, seed: 481 }, 'manhole-1'],
  ['street/manhole-cover', [7.2, 0, 3.0], 0, 1, { kind: 'manhole', size: 0.56, seed: 483 }, 'manhole-2'],
  ['street/manhole-cover', [-1.0, 0, 12.2], 0, 1, { kind: 'grate', size: 0.5, seed: 487 }, 'manhole-3'],
  ['street/parking-space', [0.4, 0.014, 1.6], 0, 1, { len: 5, seed: 491 }, 'parking-1'],
  ['street/parking-space', [0.4, 0.014, 4.4], 0, 1, { len: 5, seed: 495 }, 'parking-2'],
  ['street/fire-hydrant', [-15.2, 0.15, 6.2], 0, 1, { seed: 493 }, 'hydrant'],
  ['street/traffic-cone', [-2.4, 0, 6.0], 0, 1, { kind: 'cone', seed: 497 }, 'cone-1'],
  ['street/traffic-cone', [-2.9, 0.15, 5.9], 0, 1, { kind: 'stand', seed: 499 }, 'stand-board'],

  /* ---------------- 駐輪場 ---------------- */
  ['bike/bike-parking-rack', [-5.9, 0, -6.9], 0, 1, { bays: 6, seed: 501 }, 'rack-row-1'],
  ['bike/bike-parking-rack', [-5.9, 0, -4.9], 0, 1, { bays: 6, seed: 503 }, 'rack-row-2'],
  ['bike/bicycle-commuter-a', [-8.5, 0, -6.9], 90, 1, { seed: 511, lean: 3 }, 'bike-a1'],
  ['bike/bicycle-commuter-b', [-7.6, 0, -6.9], 90, 1, { seed: 513, lean: -2 }, 'bike-b1'],
  ['bike/bicycle-old-c', [-6.7, 0, -6.9], 90, 1, { seed: 517, lean: 5 }, 'bike-c1'],
  ['bike/bicycle-parent-d', [-5.8, 0, -6.9], 90, 1, { seed: 521, lean: -3 }, 'bike-d1'],
  ['bike/bicycle-commuter-a', [-8.5, 0, -4.9], 90, 1, { seed: 523, lean: -4, frame: '#4a7f6a' }, 'bike-a2'],
  ['bike/bicycle-commuter-b', [-6.7, 0, -4.9], 90, 1, { seed: 527, lean: 2 }, 'bike-b2'],
  // 店前駐輪：z=4.5 在玻璃内侧（店铺 z -0.8..4.8），等于把自行车停在店里。
  // 移到东北角的人行道上（walkFront z 4.8..7.0），避开自动门 x -7.5..-5.7 与既有道具。
  ['bike/bicycle-commuter-a', [-1.25, 0.16, 6.05], 74, 1, { seed: 531, lean: 6, basket: true }, 'bike-storefront'],
  ['bike/bike-park-sign', [-2.9, 0, -3.4], 0, 1, { seed: 537 }, 'bike-sign'],
  ['bike/bike-pump', [-3.6, 0, -3.6], 0, 1, { seed: 541 }, 'bike-pump'],
  ['bike/bike-lock-post', [-10.2, 0, -5.6], 0, 1, { kind: 'post', seed: 543 }, 'lock-post'],

  /* ---------------- 车站 ---------------- */
  ['station/platform-canopy', [-8.4, 0.72, -11.0], 0, 1, { len: 12, seed: 601 }, 'canopy'],
  ['station/station-name-sign', [-6.2, 0.72, -11.5], 0, 1, { seed: 603 }, 'sign-name-1'],
  ['station/station-name-sign', [-12.4, 0.72, -11.5], 0, 1, { seed: 607 }, 'sign-name-2'],
  ['station/platform-bench', [-9.8, 0.72, -11.3], 0, 1, { seed: 611 }, 'bench-platform'],
  ['station/timetable-board', [-3.6, 0.72, -11.6], 0, 1, { seed: 613 }, 'timetable'],
  ['station/platform-bin', [-2.4, 0.72, -11.4], 0, 1, { seed: 617 }, 'platform-bin'],
  ['station/platform-stairs', [0.6, 0, -9.2], 180, 1, { steps: 5, width: 1.6, rise: 0.72, seed: 621 }, 'stairs'],
  ['station/crossing-barrier', [3.26, 0, -12.4], 0, 1, { kind: 'barrier', side: 'left', seed: 623 }, 'barrier-1'],
  ['station/crossing-barrier', [9.54, 0, -12.4], 180, 1, { kind: 'barrier', side: 'right', seed: 627 }, 'barrier-2'],
  ['station/crossing-barrier', [3.26, 0, -16.9], 0, 1, { kind: 'warning', side: 'left', seed: 631 }, 'warning-1'],
  ['station/crossing-barrier', [9.54, 0, -16.9], 180, 1, { kind: 'emergency', side: 'right', seed: 637 }, 'emergency-1'],
  ['station/rail-signal', [1.9, 0, -16.4], 0, 1, { seed: 641 }, 'rail-signal'],
  ['station/ticket-machine', [-15.2, 0.72, -9.9], 0, 1, { seed: 643 }, 'ticket-machine'],
  // 地方線の単行（1 両）編成：16m 車体を 2 両連ねると 36m 内容区に収まらないため
  ['station/train-car-front', [-8.5, -0.30, RAIL.centerZ], 0, 1, { seed: 651 }, 'train-single'],
  // ホーム有効長 19.4m に対し 16m×2 両は収まらないため地方線らしい単行（1 両）編成。
  // train-car-rear.js は連結仕様としてモジュールを保持する。
  ['station/rail-furniture', [2.8, 0, -13.4], 0, 1, { kind: 'switch', seed: 661 }, 'rail-furn-1'],
  ['station/rail-furniture', [-15.6, 0, -13.4], 0, 1, { kind: 'duct', seed: 663 }, 'rail-furn-2'],

  /* ---------------- 便利店内部设备（世界坐标，透过玻璃全可见） ---------------- */
  // 店内可用范围：x∈[-11.0,-2.2]、z∈[-0.5,4.5]、地坪 y=0.12（原点=轮廓中心 (-6.6,2.0)）
  ['interior/wall-and-floor', [STORE.cx, 0, STORE.cz], 0, 1, { seed: 701 }, 'in-shell'],
  ['interior/ceiling-lights', [STORE.cx, 0, STORE.cz], 0, 1, { seed: 703, strips: 4 }, 'in-ceiling'],
  ['interior/drink-fridge', [-8.0, STORE.floorY, -0.2], 0, 1, { seed: 707, doors: 4, density: 0.3 }, 'in-fridge'],
  ['interior/bento-display', [-5.0, STORE.floorY, -0.25], 0, 1, { seed: 711, len: 2.4, density: 0.32 }, 'in-bento'],
  ['interior/shelf-gondola', [-9.3, STORE.floorY, 1.4], 0, 1, { seed: 713, len: 3.2, tiers: 4, len: 2.7, density: 0.2 }, 'in-gondola-1'],
  ['interior/shelf-gondola', [-5.2, STORE.floorY, 1.4], 0, 1, { seed: 717, len: 3.2, tiers: 4, len: 2.7, density: 0.2 }, 'in-gondola-2'],
  ['interior/shelf-wall', [-10.85, STORE.floorY, 1.3], 90, 1, { seed: 721, len: 2.6, density: 0.2 }, 'in-shelf-wall'],
  ['interior/register-counter', [-4.2, STORE.floorY, 3.3], 0, 1, { seed: 723, len: 2.6 }, 'in-register'],
  ['interior/coffee-machine', [-3.4, STORE.floorY, 1.6], 0, 1, { seed: 727 }, 'in-coffee'],
  ['interior/oden-counter', [-2.9, STORE.floorY, 4.05], 180, 1, { seed: 731 }, 'in-oden'],
  ['interior/magazine-rack', [-10.75, STORE.floorY, 3.7], 90, 1, { seed: 733, len: 1.6 }, 'in-magazine'],
  ['interior/upright-freezer', [-2.52, STORE.floorY, 0.2], 270, 1, { seed: 737, doors: 2, density: 0.34 }, 'in-freezer'],
  // コインロッカーは東壁の内側（freezer z0.67 終端と register z2.22 開始の空き帯）。
  // z=-1.6 に置くと店舗外（北壁は z=-0.8）に出て壁を貫通する。
  ['interior/lockers', [-2.42, STORE.floorY, 1.45], 270, 1, { seed: 741, cols: 4, rows: 3 }, 'in-lockers'],
  ['interior/poster-lightbox', [-9.6, STORE.floorY, 4.6], 0, 1, { seed: 743, kind: 'wall' }, 'in-lightbox-1'],
  ['interior/poster-lightbox', [-4.0, STORE.floorY, 4.6], 0, 1, { seed: 747, kind: 'wall' }, 'in-lightbox-2'],
  ['interior/poster-lightbox', [-6.6, 2.235, 0.4], 0, 1, { seed: 749, kind: 'ceiling' }, 'in-lightbox-3'],
  // 在庫ラック：北壁際（fridge/bento）と東壁際（freezer/lockers）が埋まっているため、
  // レジ前の中央通路南端に置く。x=-3.0 だと東壁と北壁を貫通していた。
  ['interior/backroom-shelving', [-6.6, STORE.floorY, 3.2], 0, 1, { seed: 751, len: 1.6 }, 'in-backroom'],
  ['interior/floor-guidance', [STORE.cx, STORE.floorY, 2.6], 0, 1, { seed: 753 }, 'in-floor-guide'],
  ['interior/basket-and-cart', [-9.0, STORE.floorY, 4.0], 0, 1, { seed: 757 }, 'in-basket'],
  ['products/price-tag', [-6.6, STORE.floorY, 4.42], 0, 1, { variant: 'pop', seed: 761 }, 'in-pop-1'],
  ['products/price-tag', [-9.6, STORE.floorY, 3.4], 20, 1, { variant: 'floor', seed: 763 }, 'in-pop-2'],
  ['products/price-tag', [-3.6, STORE.floorY, 2.2], -15, 1, { variant: 'new100', seed: 767 }, 'in-pop-3'],

  /* ---------------- 背景建筑 ---------------- */
  // 民家（旧 x=-16.3、rotY 90、d=4.6 → 屋簷 x -18.68..-13.92）在红线取景里放不下：
  // 西边界从 x=-18 提到 -17 后，那块地只剩 2.6 m 宽，而巷道西墙在 -14.25。
  // 住宅体量由 alley-houses（x -16..-10.05）承担，民家模块保留但不落位。
  // 鉄塔・遠景民家（buildings/utility-background, z=-18.5）与北法面（flora/grass-slope, z=-17.72）
  // 同理落在框外，由 placeAll 的 inCrop 过滤掉。
  ['buildings/alley-houses', [-13.0, 0, -2.4], 180, 1, { seed: 803, len: 5.2 }, 'alley-houses'],
  // 西側の界隈を枠内へ：塀・生垣を x=-16.7 の線で南北に並べ替える（間隔 0.6 m 以上）。
  ['buildings/fence-set', [-16.75, 0, -3.6], 90, 1, { kind: 'block', len: 3.3, seed: 811 }, 'fence-1'],
  ['buildings/fence-set', [-16.7, 0, 0.6], 90, 1, { kind: 'plaster', len: 2.6, seed: 813 }, 'fence-2'],
  // 店舗裏の作業ヤード境界（AC 屋外機の列より北＝z -1.62。-1.15 にすると AC 本体を貫く）
  ['buildings/fence-set', [-8.0, 0, -1.62], 0, 1, { kind: 'mesh', len: 4.0, seed: 817 }, 'fence-3'],
  ['buildings/fence-set', [-14.35, 0, 4.6], 0, 1, { kind: 'gate', len: 1.2, seed: 821 }, 'fence-gate'],
];

/** 电线档距：把 POLES/SPANS 换算成 power-lines 资产需要的 a/b 端点 */
function spanOptions(entry) {
  const i = entry.options.span;
  const [pa, pb] = SPANS[i];
  const A = POLES.find((p) => p.id === pa);
  const B = POLES.find((p) => p.id === pb);
  return { ...entry.options, a: [A.x, A.z], b: [B.x, B.z], aHeight: A.h, bHeight: B.h, aRot: A.rotY, bRot: B.rotY, config: 'primary', sag: 0.6 };
}


export async function placeAll(assets, engine, { budgetMs = 12, overflowTol = 0.06 } = {}) {
  const missing = [];
  const overflow = [];
  const poleOk = {};   // 电线档距只有在两端电线杆真的落了地时才成立
  const bb = new THREE.Box3();
  let i = 0;
  // 只保留红线矩形内的资产。x 向放 1.0 m 余量（西侧电柱列 P0/邮筒的原点刚好压在
  // 内容边界上，严格裁剪会把整排电线杆切掉）；z 向不放余量（北法面与鉄塔、南侧桜並木
  // 的原点都紧贴边界，一旦放余量就会把它们留在画面里）。
  const MX = 1.0, MZ = 0;
  const inCrop = (x, z) => x >= CROP.x0 - MX && x <= CROP.x1 + MX && z >= CROP.z0 - MZ && z <= CROP.z1 + MZ;
  // 时间预算式让出，而不是「每 N 个让一次」：单个资产可以长达数百毫秒
  // （drink-fridge 上万 Mesh、樱花数千花瓣卡），固定步长仍会把主线程连续锁死几十秒，
  // 期间画面不动、OrbitControls 收不到指针事件 —— 表现就是「很卡，无法移动」。
  let last = performance.now();
  for (const entry of PLACEMENT) {
    i++;
    if (performance.now() - last > budgetMs) {
      await yieldToBrowser();
      last = performance.now();
    }
    const [file, pos, rotY, scale, options, name] = entry;
    const t0 = performance.now();
    const mod = await resolveModule(file);
    if (!mod) {
      missing.push(file);
      continue;
    }
    const opt = file.endsWith('power-lines') ? spanOptions({ options }) : { ...options };
    // 店内商品、贩卖机里的饮料：标签色带只有 2 cm 上下，是需求点名「每层都要看得见」的内容，
    // 不能被远景 LOD 的 26 px 剔除吃掉 —— 给这些资产单独更严（更小）的阈值。
    if (/^interior\//.test(file) || /^products\//.test(file) || /vending-machine/.test(file)) opt.lodPx = 16;
    const p = file === null || pos === null ? null : pos;
    // 裁剪框过滤：电线档距要两端都在框内，否则线头会悬在空处
    if (file.endsWith('power-lines')) {
      const [pa, pb] = SPANS[opt.span];
      if (!inCrop(opt.a[0], opt.a[1]) || !inCrop(opt.b[0], opt.b[1])) continue;
      if (!poleOk[pa] || !poleOk[pb]) continue;   // 端杆被裁掉 → 这一档电线一并去掉
    } else if (p && !inCrop(p[0], p[2])) {
      continue;
    }
    let o = null;
    try {
      if (file.endsWith('power-lines')) {
        // 资产内部已把档距方向烘进局部坐标：装配层只平移，绝不再旋转
        o = mod.build(opt);
        o.position.set((opt.a[0] + opt.b[0]) / 2, 0, (opt.a[1] + opt.b[1]) / 2);
        o.name = name;
        assets.add(o);
      } else {
        o = place(assets, mod, { pos: p, rotY, scale, options: opt, name });
      }
    } catch (e) {
      console.warn('[placement] build failed:', file, e && e.message);
      missing.push(file + ' (throw)');
      traceMark('asset', (name || file) + ' (throw)', t0);
      continue;
    }
    /* 中心在框内 ≠ 东西在框内：树冠、屋簷、4 m 绿篱都会伸出台座，
       而台座是一块实心板 —— 伸出去的部分就是「悬在空中的杂物」。
       量实际包围盒，越界的整件不落地，并记录越界量供 tools/inspect 核对后改坐标。 */
    if (o) {
      bb.makeEmpty();
      bb.setFromObject(o);
      if (!bb.isEmpty()) {
        const over = Math.max(CROP.x0 - bb.min.x, bb.max.x - CROP.x1, CROP.z0 - bb.min.z, bb.max.z - CROP.z1);
        if (over > overflowTol) {
          if (o.parent) o.parent.remove(o);
          overflow.push({ name: name || file, over: +over.toFixed(2) });
          traceMark('asset', (name || file) + ' (越界丢弃)', t0);
          continue;
        }
      }
    }
    traceMark('asset', name || file, t0);
    const pid = /^pole-(P\d)$/.exec(name || '');
    if (pid) poleOk[pid[1]] = true;
  }
  if (engine) {
    engine.missing = [...new Set(missing)];
    engine.overflow = overflow;
    engine.placedCount = assets.children.length;
  }
  return assets;
}
