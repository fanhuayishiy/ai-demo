// 程序化纹理库 —— 全部用 Canvas2D 逐张手绘生成（无外部资源、无占位图）
// 在 Node（离线 smoke test）环境下自动降级为 1x1 DataTexture，保证可 import。
import * as THREE from 'three';
import { IS_FLAT, traceMark } from './style.js';

export const HAS_DOM = typeof document !== 'undefined' && !!document.createElement;
const cache = new Map();

export function mulberry32(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 内容贴图（看板字・商品标签・行先表示・海报）的 memo 前缀。
 * 平涂模式下 core/style.js 的 flatShading 只保留带 graphic 标记的贴图，
 * 而全场景有十几处把 TEX.signboard() 直接塞进 MAT.paint({ map }) 而没有传
 * o.graphic —— 结果每一块那样的牌子都刷成无素地的白牌（自动贩卖机的 FACE、
 * 月台的空看板枠、列车行先表示器，全部同一个原因）。
 * 所以在唯一的收口 memo() 上贴标记，而不是逐个调用点补。
 */
const CONTENT = new Set(['label', 'sign', 'poster', 'ad', 'panel']);
function markGraphic(v) {
  if (!v) return;
  if (v.isTexture) v.userData.graphic = true;
  else if (v.map && v.map.isTexture) v.map.userData.graphic = true;
}

export function memo(key, factory) {
  if (cache.has(key)) return cache.get(key);
  const t0 = performance.now();
  const v = factory();
  traceMark('tex', key, t0);
  if (CONTENT.has(key.split('|')[0])) markGraphic(v);
  cache.set(key, v);
  return v;
}

/**
 * 贴图缓存的字节账（按家族）：启动慢到后来基本都是「往 GPU 灌位图」，先看清谁占的。
 * 按 source.uuid 去重 —— 一份位图 clone 出 20 张贴图只上传一次，
 * 按缓存条目累加会把这块虚报好几倍（曾经据此误判 sign/paper 是头号大户）。
 */
export function texCacheInfo() {
  const by = new Map();
  const seen = new Set();
  let bytes = 0;
  let dupes = 0;
  for (const [key, v] of cache) {
    const list = v && v.isTexture ? [v] : [v && v.map, v && v.normalMap, v && v.alphaMap, v && v.roughnessMap];
    let b = 0;
    for (const t of list) {
      if (!t || !t.image || !t.image.width) continue;
      const id = t.source ? t.source.uuid : t.uuid;
      if (seen.has(id)) { dupes++; continue; }
      seen.add(id);
      b += t.image.width * t.image.height * 4;
    }
    bytes += b;
    const fam = key.split('|')[0];
    const e = by.get(fam) || [0, 0];
    e[0] += b;
    e[1]++;
    by.set(fam, e);
  }
  return { entries: cache.size, sources: seen.size, dupes, bytes, by: [...by].map(([k, v]) => [k, v[0], v[1]]).sort((a, b) => b[1] - a[1]) };
}

function blank(rgba = 'rgba(0,0,0,0)') {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  t.needsUpdate = true;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- 平涂模式：不再生成会被剥掉的表面噪点 ----------------
   core/style.js 的 flatShading 会把非 graphic 材质的 map/normalMap 整个剥掉，
   所以下面这些「表面噪点」贴图在平涂方向上从未被绑定过 —— 但生成一次要花
   一张 512² canvas 绘制 + 一次 heightToNormal，位图还常驻内存（一对 ≈ 2 MB）。
   全场景几百对就是几百 MB 与装配期的几十秒，实测装配 66 s / JS 堆 1.6 GB。
   这里直接返回共享的「白底 + 平法线」1×1：万一被绑上也是纯色，不会变透明。 */
const SURFACE_NOISE = new Set([
  // 名字必须与 pack(`xxx|`) 的实际 key 前缀一致：这里原本写着 'corrugated'，
  // 而 pack 用的是 'corru'，闸门从来没生效过（白画一张 512² + 一次 heightToNormal）。
  'asphalt', 'concrete', 'paving', 'tile', 'wood', 'bark', 'metal', 'ballast',
  'grass', 'roofTile', 'corru', 'storeFloor', 'tactile', 'leafCluster',
]);
// 不在此列的（lightPanel / frost / fabric / paper / petal / wear / gradient /
// poster / signboard / drinkLabel / adStrip）都是**内容**或被 decal() 直接绑定，
// 平涂下也会被真正采样，必须照常生成。
let _noiselessPair = null;
function noiselessPair() {
  if (_noiselessPair) return _noiselessPair;
  const map = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.needsUpdate = true;
  const normalMap = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.needsUpdate = true;
  _noiselessPair = { map, normalMap };
  return _noiselessPair;
}

export function makeCanvas(w = 512, h = w) {
  if (!HAS_DOM) return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)';
  g.fillRect(0, 0, w, h);
  return { c, g, w, h, rnd: mulberry32(1) };
}

export function toTexture(canvasObj, { repeat = 1, repeatY = null, srgb = true, aniso = 8 } = {}) {
  if (!canvasObj) return blank();
  const t = new THREE.CanvasTexture(canvasObj.c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeatY == null ? repeat : repeatY);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** 由高度函数（或灰度 canvas）求法线图 —— 让平面贴图拥有真实起伏 */
export function heightToNormal(src, { size = 512, strength = 1.6, heightFn = null } = {}) {
  if (!HAS_DOM) return blank();
  const h = new Float32Array(size * size);
  if (heightFn) {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = heightFn(x / size, y / size);
  } else {
    const s = src instanceof HTMLCanvasElement ? src : src.c;
    const g = s.getContext('2d');
    const d = g.getImageData(0, 0, s.width, s.height).data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const sx = Math.floor((x / size) * s.width);
        const sy = Math.floor((y / size) * s.height);
        const i = (sy * s.width + sx) * 4;
        h[y * size + x] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
      }
    }
  }
  const out = new Uint8Array(size * size * 4);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx, ny = -dy, nz = 1.0;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const i = (y * size + x) * 4;
      out[i] = (nx * 0.5 + 0.5) * 255;
      out[i + 1] = (ny * 0.5 + 0.5) * 255;
      out[i + 2] = (nz * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(out, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  return t;
}

/* --------------------------------------------------------------------------
 *  绘制基元
 * ------------------------------------------------------------------------ */
export function fillGrad(g, w, h, stops, vertical = false) {
  const gr = vertical ? g.createLinearGradient(0, 0, 0, h) : g.createLinearGradient(0, 0, w, 0);
  for (const [p, c] of stops) gr.addColorStop(p, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}

export function speckle(g, w, h, { count = 4000, r = [0.4, 1.6], colors = ['#fff', '#000'], alpha = [0.03, 0.2], rnd }) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h;
    const rad = r[0] + rnd() * (r[1] - r[0]);
    g.globalAlpha = alpha[0] + rnd() * (alpha[1] - alpha[0]);
    g.fillStyle = colors[(rnd() * colors.length) | 0];
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

export function blotches(g, w, h, { count = 40, rad = [30, 140], colors = ['#000'], alpha = [0.02, 0.08], rnd }) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h, r = rad[0] + rnd() * (rad[1] - rad[0]);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const c = colors[(rnd() * colors.length) | 0];
    gr.addColorStop(0, c);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha[0] + rnd() * (alpha[1] - alpha[0]);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** 不规则流挂污渍（雨水痕） */
export function drips(g, w, h, { count = 26, color = '#000', alpha = 0.09, rnd, len = [0.2, 0.85], wide = [1, 5] }) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y0 = rnd() * h * 0.25;
    const L = h * (len[0] + rnd() * (len[1] - len[0]));
    const wd = wide[0] + rnd() * (wide[1] - wide[0]);
    const gr = g.createLinearGradient(0, y0, 0, y0 + L);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha * (0.5 + rnd());
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x - wd / 2, y0);
    g.lineTo(x + wd / 2, y0);
    g.lineTo(x + wd * 0.2, y0 + L);
    g.lineTo(x - wd * 0.2, y0 + L);
    g.closePath();
    g.fill();
    if (rnd() > 0.55) {
      g.beginPath();
      g.arc(x, y0 + L, wd * 0.7, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** 裂纹（随机折线） */
export function cracks(g, w, h, { count = 6, color = '#000', alpha = 0.22, rnd, steps = 14, width = 1.1 }) {
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    let x = rnd() * w, y = rnd() * h;
    g.strokeStyle = color;
    g.globalAlpha = alpha * (0.4 + rnd() * 0.6);
    g.lineWidth = width * (0.5 + rnd());
    g.beginPath();
    g.moveTo(x, y);
    let ang = rnd() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      ang += (rnd() - 0.5) * 1.1;
      const l = 8 + rnd() * 26;
      x += Math.cos(ang) * l;
      y += Math.sin(ang) * l;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

export function woodGrain(g, w, h, { rnd, light = '#c9a878', dark = '#8b6a45', rings = 26, warp = 0.06 } = {}) {
  fillGrad(g, w, h, [[0, light], [0.5, dark], [1, light]], true);
  for (let i = 0; i < rings; i++) {
    const base = (i / rings) * h;
    g.beginPath();
    g.strokeStyle = i % 3 === 0 ? dark : light;
    g.globalAlpha = 0.16 + rnd() * 0.3;
    g.lineWidth = 0.8 + rnd() * 2.6;
    for (let x = 0; x <= w; x += 6) {
      const t = x / w;
      const y =
        base +
        Math.sin(t * Math.PI * (1.2 + rnd() * 0.02) + i) * h * warp +
        Math.sin(t * Math.PI * 7 + i * 2.1) * h * 0.008;
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  speckle(g, w, h, { count: 2600, colors: [dark, light], alpha: [0.02, 0.1], rnd });
}

export const JP_FAMILY = "'Hiragino Sans','Yu Gothic UI','Meiryo','Noto Sans JP',sans-serif";

export function jpText(g, text, { x, y, size = 40, color = '#222', weight = 700, family = JP_FAMILY, align = 'center', baseline = 'middle', spacing = 0, rotate = 0 }) {
  g.save();
  g.translate(x, y);
  if (rotate) g.rotate(rotate);
  g.font = `${weight} ${size}px ${family}`;
  g.textAlign = align;
  g.textBaseline = baseline;
  if (!spacing) {
    g.fillStyle = color;
    g.fillText(text, 0, 0);
  } else {
    let off = 0;
    g.fillStyle = color;
    for (const ch of text) {
      g.fillText(ch, off, 0);
      off += g.measureText(ch).width + spacing;
    }
  }
  g.restore();
}

/* --------------------------------------------------------------------------
 *  纹理库
 * ------------------------------------------------------------------------ */
function pack(key, draw, opts = {}) {
  return memo(key, () => {
    if (!HAS_DOM) return { map: blank(), normalMap: blank() };
    if (IS_FLAT && SURFACE_NOISE.has(key.split('|')[0])) return noiselessPair();
    const size = opts.size || 512;
    const cv = makeCanvas(size, opts.h || size);
    draw(cv, opts);
    const map = toTexture(cv, opts);
    // 平涂模式只有 graphic 材质保留贴图，而 graphic 材质（MAT.poster / MAT.glow）从不接收
    // pack() 的 normalMap —— 这一张 heightToNormal 做出来必定被 flatShading 丢掉，
    // 白付一次 512² 逐像素循环（≈ 20 ms）和一份位图上传。
    const wantNormal = opts.normal !== false && !(IS_FLAT && !opts.graphic);
    const normalMap = wantNormal ? heightToNormal(cv, { size: Math.min(size, 512), strength: opts.normalStrength ?? 1.2 }) : null;
    if (normalMap) {
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.copy(map.repeat);
    }
    return { map, normalMap };
  });
}

export const TEX = {
  /** 沥青路面：骨料颗粒 + 裂纹 + 补丁 + 轻微泛油 */
  asphalt(o = {}) {
    return pack(`asphalt|${o.tone || 0}|${o.repeat || 4}`, (cv) => {
      const { g, w, h, rnd } = cv;
      // 基準色は「晴日のアスファルト」の実測付近（薄紫に寄せると画面全体が濁って見える）
      const base = ['#8b8880', '#83807a', '#7a7772'][o.tone || 0];
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, { count: 24000, r: [0.4, 2.1], colors: ['#b8b5ac', '#403e39', '#d8d4ca', '#514e48', '#e6e2da'], alpha: [0.03, 0.16], rnd });
      blotches(g, w, h, { count: 13, rad: [30, 120], colors: ['#34322e', '#6a675f'], alpha: [0.03, 0.07], rnd });
      // 亀甲に浅いひび（本数と濃度を絞る：路面は「擦り切れた線」の集合ではなく均質な灰）
      cracks(g, w, h, { count: 4, alpha: 0.13, rnd, steps: 12, width: 0.9 });
      // 旧补丁（境界を曖昧にして「斑」に見せない：小判型・低アルファ・重ね 2 回）
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.06 + rnd() * 0.06;
        g.fillStyle = i % 2 ? '#5e5c56' : '#97948c';
        g.beginPath();
        const cx = rnd() * w, cy = rnd() * h;
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2, r = (18 + rnd() * 44) * (1 + 0.5 * Math.abs(Math.cos(a * 2)));
          g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7);
        }
        g.closePath();
        g.fill();
      }
      g.globalAlpha = 1;
    }, { repeat: o.repeat || 4, normalStrength: 0.8 });
  },

  /** 混凝土 / 铺装 */
  concrete(o = {}) {
    return pack(`concrete|${o.base || '#cfc9be'}|${o.repeat || 2}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.base || '#cfc9be';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, { count: 12000, r: [0.4, 1.6], colors: ['#fff', '#a9a398', '#c8c2b4'], alpha: [0.04, 0.18], rnd });
      blotches(g, w, h, { count: 22, rad: [50, 200], colors: ['#7b7568', '#e7e2d8'], alpha: [0.05, 0.12], rnd });
      drips(g, w, h, { count: 14, color: '#6d6759', alpha: 0.07, rnd });
      if (o.joints) {
        g.strokeStyle = 'rgba(90,85,75,0.5)';
        g.lineWidth = 2;
        for (let i = 1; i < o.joints; i++) {
          const p = (i / o.joints) * w;
          g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke();
          g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke();
        }
      }
      cracks(g, w, h, { count: o.cracked ? 5 : 1, alpha: 0.16, rnd });
    }, { repeat: o.repeat || 2, normalStrength: 1.0 });
  },

  /** 铺装砖（歩道 / 店舗前） */
  paving(o = {}) {
    return pack(`paving|${o.color || '#c9c3b6'}|${o.mode || 'block'}|${o.repeat || 2}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.grout || '#b6b0a3';
      g.fillRect(0, 0, w, h);
      const n = o.cells || 6;
      const cw = w / n, ch = h / n;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const off = o.mode === 'run' && y % 2 ? cw / 2 : 0;
          const px = x * cw + off + 1.5, py = y * ch + 1.5;
          const t = 0.93 + rnd() * 0.16;
          g.fillStyle = shade(o.color, t);
          rr(g, px, py, cw - 3, ch - 3, 2.5);
          g.fill();
          g.globalAlpha = 0.14;
          g.fillStyle = rnd() > 0.5 ? '#fff' : '#000';
          rr(g, px, py, cw - 3, ch - 3, 2.5);
          g.fill();
          g.globalAlpha = 1;
        }
      }
      speckle(g, w, h, { count: 6000, r: [0.4, 1.2], colors: ['#fff', '#000'], alpha: [0.03, 0.12], rnd });
    }, { repeat: o.repeat || 2, normalStrength: 1.8 });
  },

  /** 瓷砖（室内壁 / 关东煮柜台） */
  tile(o = {}) {
    return pack(`tile|${o.color || '#eef2f0'}|${o.n || 8}|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.grout || '#b9bcbb';
      g.fillRect(0, 0, w, h);
      const n = o.n || 8, s = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        g.fillStyle = shade(o.color || '#eef2f0', 0.94 + rnd() * 0.12);
        g.fillRect(x * s + 1.4, y * s + 1.4, s - 2.8, s - 2.8);
        g.globalAlpha = 0.35;
        const gr = g.createLinearGradient(x * s, y * s, (x + 1) * s, (y + 1) * s);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(x * s + 1.4, y * s + 1.4, s - 2.8, s - 2.8);
        g.globalAlpha = 1;
      }
    }, { repeat: o.repeat || 1, normalStrength: 0.7 });
  },

  /** 木纹（长椅 / 上屋 / 看板） */
  wood(o = {}) {
    return pack(`wood|${o.light || '#c9a878'}|${o.dark || '#8b6a45'}|${o.repeat || 1}`, (cv) => {
      woodGrain(cv.g, cv.w, cv.h, { rnd: cv.rnd, light: o.light || '#c9a878', dark: o.dark || '#8b6a45', rings: o.rings || 26 });
      if (o.knots) for (let i = 0; i < 3; i++) {
        const x = cv.rnd() * cv.w, y = cv.rnd() * cv.h;
        const gr = cv.g.createRadialGradient(x, y, 1, x, y, 16);
        gr.addColorStop(0, o.dark || '#6d4f30'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        cv.g.fillStyle = gr; cv.g.beginPath(); cv.g.arc(x, y, 16, 0, 7); cv.g.fill();
      }
    }, { repeat: o.repeat || 1, normalStrength: 0.9 });
  },

  /** 树皮（樱树主干：深沟裂皮） */
  bark(o = {}) {
    return pack(`bark|${o.base || '#6f5a4c'}|${o.seed || 1}|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.base || '#6f5a4c';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        let x = rnd() * w, y = rnd() * h;
        g.strokeStyle = rnd() > 0.45 ? '#3c2f27' : '#96806e';
        g.globalAlpha = 0.16 + rnd() * 0.5;
        g.lineWidth = 1 + rnd() * 5;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 9; k++) {
          x += (rnd() - 0.5) * 12;
          y += 6 + rnd() * 22;
          g.lineTo(x, y % h);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
      speckle(g, w, h, { count: 9000, r: [0.4, 1.9], colors: ['#2b211c', '#b3a08c', '#7f8f5f'], alpha: [0.04, 0.22], rnd });
      blotches(g, w, h, { count: 12, rad: [20, 70], colors: ['#6f7f4c', '#2b211c'], alpha: [0.06, 0.2], rnd });
    }, { repeat: o.repeat || 1, normalStrength: 3.4 });
  },

  /** 拉丝 / 磨损金属 */
  metal(o = {}) {
    return pack(`metal|${o.base || '#b9bcc0'}|${o.dir || 'v'}|${o.repeat || 1}|${o.worn || 0}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.base || '#b9bcc0';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        const t = rnd();
        g.strokeStyle = t > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        g.lineWidth = 0.4 + rnd() * 1.4;
        g.beginPath();
        if ((o.dir || 'v') === 'v') { const x = rnd() * w, y = rnd() * h, l = 30 + rnd() * 200; g.moveTo(x, y); g.lineTo(x, y + l); }
        else { const x = rnd() * w, y = rnd() * h, l = 30 + rnd() * 200; g.moveTo(x, y); g.lineTo(x + l, y); }
        g.stroke();
      }
      if (o.worn) {
        blotches(g, w, h, { count: 12, rad: [16, 60], colors: ['#7a6b5c', '#d8d5cf'], alpha: [0.1, 0.3], rnd });
        drips(g, w, h, { count: 8, color: '#6a4a32', alpha: 0.16, rnd });
      }
      speckle(g, w, h, { count: 2000, colors: ['#fff', '#5e5f63'], alpha: [0.02, 0.1], rnd });
    }, { repeat: o.repeat || 1, normalStrength: 0.5 });
  },

  /** 掉漆 / 锈蚀遮罩（贴花用，带 alpha） */
  wear(o = {}) {
    // 种子分桶：同 kind+color 只生成有限几个变体，避免整场景重复绘制上千张做旧贴图（启动瓶颈）
    const bucket = Math.abs(Math.round((o.seed || 1) / 3)) % 9;
    const dens = Math.round((o.density || 1) * 2) / 2;
    return memo(`wear|${o.kind || 'chip'}|${o.color || '#8a5236'}|${bucket}|${dens}`, () => {
      if (!HAS_DOM) return blank();
      const size = 128;
      const cv = makeCanvas(size);
      const { g, w, h, rnd } = cv;
      g.clearRect(0, 0, w, h);
      const d = Math.round(34 * (o.density || 1));
      if (o.kind === 'chip') {
        for (let i = 0; i < d; i++) {
          const cx = rnd() * w, cy = rnd() * h;
          g.globalAlpha = 0.3 + rnd() * 0.6;
          g.fillStyle = o.color;
          g.beginPath();
          const n = 6 + ((rnd() * 6) | 0);
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2, r = 3 + rnd() * 22;
            g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          g.closePath(); g.fill();
        }
      } else if (o.kind === 'rust') {
        blotches(g, w, h, { count: d, rad: [8, 70], colors: [o.color, '#6b3f24', '#a86b45'], alpha: [0.12, 0.5], rnd });
        drips(g, w, h, { count: Math.round(d / 3), color: o.color, alpha: 0.4, rnd, wide: [2, 9] });
      } else if (o.kind === 'dirt') {
        blotches(g, w, h, { count: d, rad: [20, 120], colors: [o.color], alpha: [0.06, 0.24], rnd });
        speckle(g, w, h, { count: d * 26, colors: [o.color], alpha: [0.05, 0.25], rnd });
      } else if (o.kind === 'scratch') {
        for (let i = 0; i < d * 3; i++) {
          g.globalAlpha = 0.1 + rnd() * 0.4;
          g.strokeStyle = o.color;
          g.lineWidth = 0.5 + rnd() * 1.6;
          const x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI * 2, l = 10 + rnd() * 120;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
        }
      } else if (o.kind === 'streak') {
        // 一方向へ引いた擦れ（台車のタイヤ痕・引きずり傷）。箱で置くと「鉄筋が寝た」に見えるので
        // 面の上に薄い筋として描く。
        g.lineCap = 'round';
        for (let i = 0; i < d; i++) {
          const y = rnd() * h;
          g.globalAlpha = 0.06 + rnd() * 0.24;
          g.strokeStyle = o.color;
          g.lineWidth = 2 + rnd() * 9;
          g.beginPath();
          g.moveTo(-20 + rnd() * 40, y);
          g.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 9, w * 0.7, y + (rnd() - 0.5) * 9, w + 20 - rnd() * 40, y + (rnd() - 0.5) * 6);
          g.stroke();
        }
      } else if (o.kind === 'moss') {
        for (let i = 0; i < d; i++) {
          const cx = rnd() * w, cy = rnd() * h;
          g.globalAlpha = 0.15 + rnd() * 0.45;
          g.fillStyle = o.color;
          g.beginPath();
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2, r = 6 + rnd() * 30;
            g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          g.closePath(); g.fill();
        }
      }
      g.globalAlpha = 1;
      const t = toTexture(cv, { repeat: o.repeat || 1 });
      return t;
    });
  },

  /** 纸张（泛黄 / 皱褶），海报与告示用。
   *  底稿一律画成白：纸纹本身与底色无关，颜色交给材质 `color` 去乘。
   *  以前按 base 分 key，140 个 MAT.paper 调用各要画一张 512² 再做一次 heightToNormal
   *  （≈ 39 ms/张、合计 6.3 s），而平涂模式还会把这些非 graphic 材质的 map 剥掉，等于全白做。 */
  paper(o = {}) {
    const p = pack(`paper|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, { count: 18, rad: [40, 180], colors: ['#c9b994', '#fff8e8'], alpha: [0.05, 0.16], rnd });
      for (let i = 0; i < 60; i++) {
        g.globalAlpha = 0.05 + rnd() * 0.08;
        g.strokeStyle = rnd() > 0.5 ? '#fff' : '#a89877';
        g.lineWidth = 1 + rnd() * 6;
        const x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * w, y + Math.sin(a) * h); g.stroke();
      }
      speckle(g, w, h, { count: 3000, r: [0.3, 1], colors: ['#8c7c5c', '#fff'], alpha: [0.02, 0.1], rnd });
      g.globalAlpha = 1;
    }, { repeat: o.repeat || 1, normalStrength: 0.35 });
    // 整张画布铺满底色 = 没有 alpha 形状。decal() 靠贴图 alpha 抠形，拿到它会画成实心方块，
    // 所以打个标记让 kit.decal() 能拒绝（路边招牌上的白横杆就是这么来的）。
    if (p.map) p.map.userData.opaqueSurface = true;
    return p;
  },

  /** 织物 / 地垫（与底色无关，颜色交给材质 color）。
   *  画布只画一次：不同 repeat 用 clone() 复用同一个 source —— three 按 source 上传 GPU，
   *  以前 16 种 repeat 就是把同一张 512² 画 16 遍、传 16 遍。 */
  fabric(o = {}) {
    const rep = o.repeat || 4;
    const base = pack('fabric|base', (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      const s = 6;
      for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        g.fillStyle = (x / s + y / s) % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
        g.fillRect(x, y, s, s);
      }
      speckle(g, w, h, { count: 7000, r: [0.4, 1.4], colors: ['#fff', '#000'], alpha: [0.03, 0.14], rnd });
    }, { repeat: 4, normalStrength: 1.4 });
    if (base.map) base.map.userData.opaqueSurface = true;   // 同 paper：整幅铺底，无 alpha 形状
    if (rep === 4 || !base.map?.clone) return base;
    return memo(`fabric@${rep}`, () => {
      const map = base.map.clone();
      map.repeat.set(rep, rep);
      map.userData.opaqueSurface = true;   // clone() 不一定带 userData，显式补一次
      const normalMap = base.normalMap ? base.normalMap.clone() : null;
      if (normalMap) normalMap.repeat.set(rep, rep);
      return { map, normalMap };
    });
  },

  /** 道床砕石 */
  ballast(o = {}) {
    return pack(`ballast|${o.repeat || 6}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = '#a8a08c';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5200; i++) {
        const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 7;
        g.fillStyle = shade(o.color || '#8c8779', 0.6 + rnd() * 0.85);
        g.beginPath();
        const n = 5 + ((rnd() * 4) | 0);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2, rr = r * (0.6 + rnd() * 0.7);
          g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(30,28,24,0.5)'; g.lineWidth = 0.7; g.stroke();
      }
    }, { repeat: o.repeat || 6, normalStrength: 3.2 });
  },

  /** 視覚障害者誘導ブロック（黄色盲道：点 / 線） */
  tactile(o = {}) {
    return memo(`tactile|${o.kind || 'dot'}|${o.base || '#e8c14b'}`, () => {
      if (!HAS_DOM) return { map: blank(), normalMap: blank() };
      const size = 256, cv = makeCanvas(size);
      const { g, w, h } = cv;
      g.fillStyle = o.base || '#e8c14b';
      g.fillRect(0, 0, w, h);
      const n = 4, s = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const cx = x * s + s / 2, cy = y * s + s / 2;
        g.fillStyle = 'rgba(0,0,0,0.16)';
        if (o.kind === 'dot') { g.beginPath(); g.arc(cx + 1.5, cy + 2, s * 0.24, 0, 7); g.fill(); }
        else { g.fillRect(cx - s * 0.3, cy - s * 0.12 + 2, s * 0.6, s * 0.24); }
        g.fillStyle = shade(o.base || '#e8c14b', 1.16);
        if (o.kind === 'dot') { g.beginPath(); g.arc(cx, cy, s * 0.24, 0, 7); g.fill(); }
        else { g.fillRect(cx - s * 0.3, cy - s * 0.12, s * 0.6, s * 0.24); }
      }
      const map = toTexture(cv, { repeat: o.repeat || 1 });
      const normalMap = heightToNormal(cv, { size: 256, strength: 3.2 });
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
      return { map, normalMap };
    });
  },

  /** 产品标签（饮料瓶/罐） */
  drinkLabel(o = {}) {
    return memo(`label|${o.name || ''}|${o.a || ''}|${o.b || ''}|${o.kind || 'bottle'}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256, 128);
      const { g, w, h, rnd } = cv;
      fillGrad(g, w, h, [[0, o.b || '#dfeff5'], [0.5, o.a || '#3fa9d8'], [1, o.b || '#dfeff5']], true);
      g.globalAlpha = 0.25;
      for (let i = 0; i < 40; i++) {
        g.fillStyle = rnd() > 0.5 ? '#fff' : '#000';
        g.fillRect(0, rnd() * h, w, 1 + rnd() * 3);
      }
      g.globalAlpha = 1;
      // 品牌带
      g.fillStyle = 'rgba(255,255,255,0.92)';
      rr(g, w * 0.06, h * 0.3, w * 0.88, h * 0.4, 12); g.fill();
      jpText(g, o.name || '炭酸', { x: w / 2, y: h * 0.5, size: h * 0.2, color: o.a || '#20608a', weight: 800 });
      jpText(g, o.sub || 'SPARKLING', { x: w / 2, y: h * 0.63, size: h * 0.075, color: '#7d7d7d', weight: 700, spacing: 2 });
      jpText(g, o.ml || '500ml', { x: w * 0.86, y: h * 0.86, size: h * 0.1, color: '#ffffff', weight: 700 });
      // 条码
      g.fillStyle = '#fff'; g.fillRect(w * 0.05, h * 0.78, w * 0.16, h * 0.16);
      for (let i = 0; i < 26; i++) {
        g.fillStyle = '#222';
        g.fillRect(w * 0.055 + i * (w * 0.15 / 26), h * 0.8, (rnd() > 0.5 ? 2 : 1) * 1.6, h * 0.12);
      }
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 店招 / 看板文字条 */
  signboard(o = {}) {
    const ar = o.ar ?? 4;                              // 目標アスペクト比（w/h）。看板盤の実寸に合わせる
    return memo(`sign|${o.text || ''}|${o.bg}|${o.fg}|${o.sub || ''}|${ar}|${o.size || 0}`, () => {
      if (!HAS_DOM) return blank();
      const w = 512;
      const h = Math.max(96, Math.min(512, Math.round(w / ar)));
      const cv = makeCanvas(w, h);
      const { g } = cv;
      g.fillStyle = o.bg || '#2f6b52';
      g.fillRect(0, 0, w, h);
      if (o.stripe) { g.fillStyle = o.stripe; g.fillRect(0, h * 0.72, w, h * 0.1); }
      // o.size は「高さ 256 の盤」基準で渡されているので盤高に合わせ換算する
      const capH = h * (o.sub ? 0.5 : 0.6);
      let size = Math.min(((o.size ?? h * 0.5) * h) / 256, capH);
      const main = o.text || 'コンビニ';
      // 文字幅を実測して盤に収まる最大サイズまで縮小（正方形盤で上下引き伸ばし・縦横比崩れ防止）
      const fitW = (txt, sz, weight) => {
        g.font = `${weight} ${sz}px ${JP_FAMILY}`;
        const sp = Math.max(1, (o.spacing ?? 6) * (sz / Math.max(1, capH)) * 1.2);
        let off = 0;
        for (const ch of txt) off += g.measureText(ch).width + sp;
        return off - sp;
      };
      let guard = 0;
      while (size > h * 0.06 && guard++ < 26 && fitW(main, size, 800) > w * 0.88) size *= 0.9;
      const sp = Math.max(1, (o.spacing ?? 6) * (size / Math.max(1, capH)) * 1.2);
      jpText(g, main, { x: w / 2, y: h * (o.sub ? 0.40 : 0.52), size, color: o.fg || '#fff', weight: 800, spacing: sp });
      if (o.sub) {
        let ss = h * 0.16;
        guard = 0;
        while (ss > h * 0.04 && guard++ < 18 && fitW(o.sub, ss, 600) > w * 0.9) ss *= 0.88;
        jpText(g, o.sub, { x: w / 2, y: h * 0.74, size: ss, color: o.fg || '#fff', weight: 600, spacing: Math.max(1, sp * 0.5) });
      }
      g.globalAlpha = 0.1;
      blotches(g, w, h, { count: 10, rad: [40, 160], colors: ['#000', '#fff'], alpha: [0.06, 0.16], rnd: cv.rnd });
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 竖排看板（立ち看板 / 広告柱） */
  poster(o = {}) {
    return memo(`poster|${o.title || ''}|${o.bg}|${o.accent}|${Math.round((o.seed || 1) / 7) % 6}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256, 384);
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.bg || '#f6e9d2';
      g.fillRect(0, 0, w, h);
      g.fillStyle = o.accent || '#d9534f';
      g.fillRect(0, 0, w, h * 0.2);
      // 图形块
      for (let i = 0; i < 5; i++) {
        g.globalAlpha = 0.5 + rnd() * 0.4;
        g.fillStyle = ['#f5c542', '#7fb2d8', '#e88a9a', '#9fc37a', '#ffffff'][i % 5];
        const bw = w * (0.2 + rnd() * 0.6), bh = h * (0.06 + rnd() * 0.14);
        rr(g, rnd() * (w - bw), h * 0.3 + rnd() * (h * 0.5), bw, bh, 10); g.fill();
      }
      g.globalAlpha = 1;
      jpText(g, o.title || '新発売', { x: w / 2, y: h * 0.1, size: h * 0.075, color: '#fff', weight: 800, spacing: 4 });
      jpText(g, o.sub || '春の限定メニュー', { x: w / 2, y: h * 0.9, size: h * 0.045, color: '#4b4640', weight: 700 });
      // 做旧
      g.globalAlpha = 0.2;
      blotches(g, w, h, { count: 10, rad: [30, 130], colors: ['#8c7c5c'], alpha: [0.1, 0.3], rnd });
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 车侧广告带 / 时刻表 / 报纸 */
  adStrip(o = {}) {
    // fg 要进 key：否则「同一句文案、不同底色」会命中同一张贴图，深色底配深色字。
    return memo(`ad|${o.text || ''}|${o.bg}|${o.fg || ''}|${o.sub || ''}|${o.seed || 1}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(512, 128);
      const { g, w, h, rnd } = cv;
      const bg = o.bg || '#e9eef3';
      fillGrad(g, w, h, [[0, bg], [1, shade(bg, 0.85)]]);
      /* 以前这里画的是 6 张 130×100 的不透明角丸矩形（x = 20 + i*160）：
         ① 第 4 张起就跑到 512 px 画布外面被丢掉；
         ② 画布只有 128 px 高，y=40 起 100 px 高的板子下缘被切掉 12 px；
         ③ 每张之间留 30 px 地色，于是车身上看到的是一排互不相连的色纸块
         （`shots/y1/w-train.png`）。
         真实的車体広告是一张通栏印刷：上下压色带、地纹重复、一条主文案。 */
      const band = o.accent || shade(bg, 0.62);
      g.fillStyle = band;
      g.fillRect(0, 0, w, 10);
      g.fillRect(0, h - 10, w, 10);
      // 地纹：低透明度的花輪。alpha 低到不会读成独立色块，只让底色不显平。
      g.globalAlpha = 0.14;
      g.fillStyle = o.motif || shade(bg, 1.25);
      for (let i = 0; i < 12; i++) {
        const cx = 24 + i * 42 + (rnd() - 0.5) * 12;
        const cy = 26 + rnd() * (h - 52);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * 6.283 + 0.4;
          g.beginPath();
          g.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 5.2, 0, 7);
          g.fill();
        }
        g.beginPath(); g.arc(cx, cy, 3.4, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      jpText(g, o.text || '春のセール', { x: w / 2, y: o.sub ? h * 0.44 : h * 0.56, size: h * 0.3, color: o.fg || '#3a3a3a', weight: 800, spacing: 4 });
      if (o.sub) jpText(g, o.sub, { x: w / 2, y: h * 0.78, size: h * 0.16, color: o.fg || '#3a3a3a', weight: 600, spacing: 2 });
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 樱花花瓣贴片（单瓣 + 小簇，用于花球卡片） */
  petal(o = {}) {
    return memo(`petal|${o.tone || 0}|${o.mode || 'single'}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256);
      const { g, w, h } = cv;
      g.clearRect(0, 0, w, h);
      const tones = [['#fdeef4', '#f8c3d6', '#ee9db9'], ['#fbd9e4', '#f3aec9', '#e2849f'], ['#f7b9cd', '#e8859f', '#d3657f']][o.tone || 0];
      const drawPetal = (cx, cy, r, rot) => {
        g.save();
        g.translate(cx, cy);
        g.rotate(rot);
        const gr = g.createRadialGradient(0, r * 0.4, r * 0.05, 0, 0, r);
        gr.addColorStop(0, tones[2]);
        gr.addColorStop(0.45, tones[1]);
        gr.addColorStop(1, tones[0]);
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(0, -r * 0.92);
        g.bezierCurveTo(r * 0.85, -r * 0.5, r * 0.62, r * 0.7, 0.06, r * 0.98);
        // 瓣尖缺口（桜の切れ込み）
        g.lineTo(-0.06, r * 0.86);
        g.lineTo(-0.18, r * 1.0);
        g.bezierCurveTo(-r * 0.66, r * 0.7, -r * 0.85, -r * 0.5, 0, -r * 0.92);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(210,120,145,0.35)';
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(0, r * 0.8); g.lineTo(0, -r * 0.6); g.stroke();
        g.restore();
      };
      if (o.mode === 'cluster') {
        for (let i = 0; i < 7; i++) drawPetal(60 + (i % 3) * 68, 60 + ((i / 3) | 0) * 74, 44, Math.random() * 6.28);
      } else drawPetal(128, 128, 100, 0);
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 叶簇（新绿/常绿树卡片） */
  leafCluster(o = {}) {
    return memo(`leaf|${o.base || '#7fa35c'}|${o.seed || 1}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256);
      const { g, w, h, rnd } = cv;
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 22; i++) {
        const x = 30 + rnd() * (w - 60), y = 30 + rnd() * (h - 60), r = 22 + rnd() * 30, a = rnd() * 6.28;
        g.save(); g.translate(x, y); g.rotate(a);
        const gr = g.createLinearGradient(0, -r, 0, r);
        gr.addColorStop(0, shade(o.base || '#7fa35c', 1.2));
        gr.addColorStop(1, shade(o.base || '#7fa35c', 0.7));
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(0, -r); g.quadraticCurveTo(r * 0.6, 0, 0, r); g.quadraticCurveTo(-r * 0.6, 0, 0, -r);
        g.fill();
        g.restore();
      }
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 玻璃磨砂 / 磨砂膜 */
  frost(o = {}) {
    return pack(`frost|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = '#f2f6f7';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, { count: 26000, r: [0.3, 1.4], colors: ['#fff', '#cfd8da'], alpha: [0.05, 0.2], rnd });
    }, { repeat: o.repeat || 1, normalStrength: 0.4 });
  },

  /** 室内地坪（塩ビタイル：市松 + 导视） */
  storeFloor(o = {}) {
    return pack(`storeFloor|${o.repeat || 3}`, (cv) => {
      const { g, w, h, rnd } = cv;
      const n = 8, s = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        g.fillStyle = shade(o.a || '#e6e1d6', (x + y) % 2 ? 1 : 0.93);
        g.fillRect(x * s, y * s, s, s);
      }
      g.strokeStyle = 'rgba(150,145,135,0.5)'; g.lineWidth = 1;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
      speckle(g, w, h, { count: 6000, r: [0.3, 1.1], colors: ['#fff', '#000'], alpha: [0.02, 0.08], rnd });
      // 引导线
      g.fillStyle = o.line || '#8fb6cf';
      g.globalAlpha = 0.5; g.fillRect(w * 0.46, 0, w * 0.08, h); g.globalAlpha = 1;
    }, { repeat: o.repeat || 3, normalStrength: 0.4 });
  },

  /** 草地 / 苔 */
  grass(o = {}) {
    return pack(`grass|${o.base || '#8fae6a'}|${o.repeat || 4}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = shade(o.base || '#8fae6a', 0.72);
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 9, a = -Math.PI / 2 + (rnd() - 0.5) * 1.1;
        g.strokeStyle = shade(o.base || '#8fae6a', 0.75 + rnd() * 0.7);
        g.lineWidth = 1 + rnd() * 1.7;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      speckle(g, w, h, { count: 1200, r: [1, 4], colors: ['#5f7a45', '#c3d69a'], alpha: [0.08, 0.28], rnd });
    }, { repeat: o.repeat || 4, normalStrength: 1.6 });
  },

  /** 民家瓦屋根 */
  roofTile(o = {}) {
    return pack(`roofTile|${o.base || '#6b6a72'}|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = shade(o.base || '#6b6a72', 0.8);
      g.fillRect(0, 0, w, h);
      const rows = 8, rh = h / rows;
      for (let r = 0; r < rows; r++) {
        const gr = g.createLinearGradient(0, r * rh, 0, (r + 1) * rh);
        gr.addColorStop(0, shade(o.base || '#6b6a72', 1.18));
        gr.addColorStop(0.55, shade(o.base || '#6b6a72', 0.95));
        gr.addColorStop(1, shade(o.base || '#6b6a72', 0.66));
        g.fillStyle = gr;
        g.fillRect(0, r * rh, w, rh - 2);
        g.fillStyle = 'rgba(20,20,24,0.35)';
        g.fillRect(0, (r + 1) * rh - 3, w, 3);
        for (let i = 0; i < 8; i++) {
          const x = (i + (r % 2) * 0.5) * (w / 8);
          g.fillStyle = 'rgba(20,20,24,0.18)';
          g.fillRect(x, r * rh, 3, rh);
        }
      }
      blotches(g, w, h, { count: 16, rad: [20, 80], colors: ['#4d5b3c', '#2f2f34'], alpha: [0.1, 0.35], rnd });
    }, { repeat: o.repeat || 1, normalStrength: 2.2 });
  },

  /** 瓦楞板 / トタン（上屋） */
  corrugated(o = {}) {
    return pack(`corru|${o.base || '#9fa7a4'}|${o.repeat || 1}`, (cv) => {
      const { g, w, h, rnd } = cv;
      g.fillStyle = o.base || '#9fa7a4';
      g.fillRect(0, 0, w, h);
      const n = 16, cw = w / n;
      for (let i = 0; i < n; i++) {
        const gr = g.createLinearGradient(i * cw, 0, (i + 1) * cw, 0);
        gr.addColorStop(0, shade(o.base || '#9fa7a4', 1.2));
        gr.addColorStop(0.5, shade(o.base || '#9fa7a4', 0.82));
        gr.addColorStop(1, shade(o.base || '#9fa7a4', 1.1));
        g.fillStyle = gr;
        g.fillRect(i * cw, 0, cw, h);
      }
      drips(g, w, h, { count: 12, color: '#6b4a34', alpha: 0.2, rnd });
      speckle(g, w, h, { count: 2500, colors: ['#5b4636', '#fff'], alpha: [0.05, 0.2], rnd });
    }, { repeat: o.repeat || 1, normalStrength: 1.8 });
  },

  /** 发光面板（灯箱 / 显示屏 / LED 诱导） */
  lightPanel(o = {}) {
    return memo(`panel|${o.text || ''}|${o.bg || '#f5d78e'}|${o.mode || 'sign'}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256, 128);
      const { g, w, h } = cv;
      g.fillStyle = o.bg || '#f5d78e';
      g.fillRect(0, 0, w, h);
      if (o.mode === 'led') {
        g.fillStyle = '#141518';
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
          g.fillStyle = 'rgba(255,255,255,0.02)';
          g.fillRect(x, y, 7, 7);
        }
      }
      if (o.text) jpText(g, o.text, { x: w / 2, y: h / 2, size: h * 0.46, color: o.fg || '#3a3325', weight: 800, spacing: o.spacing ?? 4 });
      if (o.rows) {
        g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2;
        o.rows.forEach((r, i) => {
          const y = h * (0.22 + i * 0.18);
          jpText(g, r.t, { x: w * 0.1, y, size: h * 0.13, color: o.fg || '#3a3325', weight: 700, align: 'left' });
          jpText(g, r.v, { x: w * 0.9, y, size: h * 0.13, color: o.fg || '#3a3325', weight: 700, align: 'right' });
        });
      }
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 通用渐变色板（用于发光体 / 天空 / 水面） */
  gradient(o = {}) {
    return memo(`grad|${o.stops.join()}|${o.h || 256}`, () => {
      if (!HAS_DOM) return blank();
      const cv = makeCanvas(256, o.h || 256);
      fillGrad(cv.g, cv.w, cv.h, o.stops, true);
      return toTexture(cv, { repeat: 1 });
    });
  },

  /** 渐变阶梯贴图（三渲二 banding），steps 段 */
  ramp(steps = 4, { shadow = 0.42, soft = true, hi = 1.06 } = {}) {
    return memo(`ramp|${steps}|${shadow}|${soft}|${hi}`, () => {
      const size = Math.max(4, steps * 2);
      const data = new Uint8Array(size * 4);
      for (let i = 0; i < size; i++) {
        const t = i / (size - 1);
        let v;
        if (!soft) {
          const k = Math.min(steps - 1, Math.floor(t * steps));
          v = shadow + (1 - shadow) * (k / (steps - 1));
        } else {
          const band = Math.floor(t * steps);
          const f = t * steps - band;
          const eased = f < 0.5 ? 0 : 1;
          const prev = shadow + (1 - shadow) * (Math.max(0, band - 1) / (steps - 1));
          const cur = shadow + (1 - shadow) * (band / (steps - 1));
          v = prev + (cur - prev) * (eased ? 1 : 0.18);
        }
        const c = Math.max(0, Math.min(255, Math.round(v * hi * 255)));
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = c;
        data[i * 4 + 3] = 255;
      }
      const t = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
      t.minFilter = t.magFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.NoColorSpace;
      t.needsUpdate = true;
      return t;
    });
  },
};

/* -------------------------- 小工具 -------------------------- */
export function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
}
export function rr(g, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}
export { cache as TEXCACHE };
