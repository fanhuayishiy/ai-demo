/**
 * 天气系统：把「光、天空、雾、后期分级、灯具亮度、风、花瓣量、雨量」收成一个可切换的状态。
 *
 * 为什么是一个 ease 而不是两段动画：每个天气是一份完整状态（stateOf），切换时只把
 * `cur` 每帧朝 `target` 收一步（指数收敛），所以中途连续按几下不会打架，
 * 也不需要「上一段动画播完没」的簿记。
 *
 * 画面零 UI：切换只走键盘（1–5 直接选、W 顺序循环）、URL 参数 `?weather=`、
 * 以及 `window.__DIORAMA__.setWeather('night')`。界面上不出现任何按钮。
 */
import * as THREE from 'three';
import { U } from '../core/toon.js';
import { SUN_DIR } from '../core/lighting.js';
import { WEATHER_PARAM } from '../core/style.js';
import { makeBackdrop, makeEnvironment, paintBackdrop } from './sky.js';
import { applyWet } from './wet.js';
import { attachWeatherUI } from './ui.js';
import CLEAR from './clear.js';
import CLOUDY from './cloudy.js';
import RAIN from './rain.js';
import DUSK from './dusk.js';
import NIGHT from './night.js';

export const WEATHERS = [CLEAR, CLOUDY, RAIN, DUSK, NIGHT];
export const NAMES = WEATHERS.map((w) => w.NAME);

/**
 * 给动效模块看的实时旋钮：rain-shower 读 rain，petal-storm 读 petal，
 * light-breath 读 lampGain。放在这里而不是各自去查天气名，是为了让动效只依赖「量」，
 * 不必知道有几种天气存在。
 */
export const WX = { rain: 0, petal: 1, lampGain: 1, breeze: 1, wet: 0 };

function stateOf(p) {
  const L = p.lights;
  const G = p.grade;
  return {
    fogColor: new THREE.Color(p.fog.color),
    fogDensity: p.fog.density,
    sunColor: new THREE.Color(L.sun.color),
    sunI: L.sun.intensity,
    sunDir: new THREE.Vector3(...L.sun.dir).normalize(),
    hemiSky: new THREE.Color(L.hemi.sky),
    hemiGround: new THREE.Color(L.hemi.ground),
    hemiI: L.hemi.intensity,
    fillColor: new THREE.Color(L.fill.color),
    fillI: L.fill.intensity,
    bounceColor: new THREE.Color(L.bounce.color),
    bounceI: L.bounce.intensity,
    kickColor: new THREE.Color(L.kicker.color),
    kickI: L.kicker.intensity,
    exposure: p.exposure,
    envI: p.envIntensity,
    sat: G.saturation,
    con: G.contrast,
    vig: G.vignette,
    grain: G.grain,
    ca: G.ca,
    lift: new THREE.Vector3(...G.lift),
    gamma: new THREE.Vector3(...G.gamma),
    gain: new THREE.Vector3(...G.gain),
    haze: new THREE.Color(G.haze),
    hazeAmt: G.hazeAmount,
    breeze: p.wx.breeze,
    lampGain: p.wx.lampGain,
    petal: p.wx.petal,
    rain: p.wx.rain,
    wet: p.wx.wet,
    back: p.sky.backdrop.map((s) => new THREE.Color(s)),
  };
}

function cloneState(s) {
  const out = {};
  for (const k in s) {
    const v = s[k];
    out[k] = Array.isArray(v) ? v.map((x) => x.clone()) : v.clone ? v.clone() : v;
  }
  return out;
}

/** 朝目标收一步。数值/Color/Vector3/Color 数组都能走，其余（名字之类）直接取目标。 */
function easeInto(cur, target, k) {
  let moved = 0;
  for (const key in target) {
    const tv = target[key];
    const cv = cur[key];
    if (typeof tv === 'number') {
      cur[key] = cv + (tv - cv) * k;
      moved = Math.max(moved, Math.abs(tv - cur[key]));
    } else if (tv && tv.isColor) {
      cv.lerp(tv, k);
      moved = Math.max(moved, Math.abs(tv.r - cv.r) + Math.abs(tv.g - cv.g) + Math.abs(tv.b - cv.b));
    } else if (tv && tv.isVector3) {
      cv.lerp(tv, k);
      moved = Math.max(moved, cv.distanceToSquared(tv));
    } else if (Array.isArray(tv)) {
      for (let i = 0; i < tv.length; i++) {
        cv[i].lerp(tv[i], k);
        moved = Math.max(moved, Math.abs(tv[i].r - cv[i].r));
      }
    } else {
      cur[key] = tv;
    }
  }
  return moved;
}

export function installWeather(engine) {
  const { scene, renderer, lights, fx } = engine;
  if (!lights || !fx || !fx.grade) return null;

  const backdrop = makeBackdrop(WEATHERS[0].sky.backdrop);
  // 引擎在装配期先挂了一张默认天空（那时还没有天气），换掉后把它释放掉，
  // 否则 8×512 的位图会白占一份显存到页面结束。
  if (scene.background && scene.background.isTexture) scene.background.dispose();
  scene.background = backdrop;
  const envCaches = new Map(NAMES.map((n) => [n, {}]));
  let target = stateOf(CLEAR);
  let cur = cloneState(target);
  let name = CLEAR.NAME;
  let settled = true;
  let shadowCool = 0;

  function useEnv(n) {
    const p = WEATHERS.find((w) => w.NAME === n) || CLEAR;
    const cache = envCaches.get(n);
    // 第一次切到某个天气要生成一张 PMREM（约几十毫秒）。放在切换瞬间而不是启动时，
    // 是为了不让五种天气的预生成压进那 8 秒的启动预算里。
    scene.environment = makeEnvironment(renderer, cache, p.sky);
  }

  function push() {
    scene.fog.color.copy(cur.fogColor);
    scene.fog.density = cur.fogDensity;
    const sun = lights.sun;
    sun.color.copy(cur.sunColor);
    sun.intensity = cur.sunI;
    SUN_DIR.copy(cur.sunDir);
    sun.position.copy(cur.sunDir).multiplyScalar(46);
    sun.target.updateMatrixWorld();
    lights.hemi.color.copy(cur.hemiSky);
    lights.hemi.groundColor.copy(cur.hemiGround);
    lights.hemi.intensity = cur.hemiI;
    lights.fill.color.copy(cur.fillColor);
    lights.fill.intensity = cur.fillI;
    lights.bounce.color.copy(cur.bounceColor);
    lights.bounce.intensity = cur.bounceI;
    lights.kicker.color.copy(cur.kickColor);
    lights.kicker.intensity = cur.kickI;
    renderer.toneMappingExposure = cur.exposure;
    scene.environmentIntensity = cur.envI;
    const g = fx.grade.uniforms;
    g.uSaturation.value = cur.sat;
    g.uContrast.value = cur.con;
    g.uVignette.value = cur.vig;
    g.uGrain.value = cur.grain;
    g.uCA.value = cur.ca;
    g.uLift.value.copy(cur.lift);
    g.uGamma.value.copy(cur.gamma);
    g.uGain.value.copy(cur.gain);
    g.uHaze.value.copy(cur.haze);
    g.uHazeAmount.value = cur.hazeAmt;
    U.breeze.value = cur.breeze;
    WX.breeze = cur.breeze;
    WX.rain = cur.rain;
    WX.petal = cur.petal;
    WX.lampGain = cur.lampGain;
    WX.wet = cur.wet;
    applyWet(cur.wet);
    paintBackdrop(backdrop, cur.back);
  }

  engine.onUpdate((dt) => {
    if (settled) return;
    // 指数收敛：tau 0.42 s → 约 1.3 s 走完 95%。用 dt 而不是固定步长，掉帧时也不会变慢。
    const moved = easeInto(cur, target, 1 - Math.exp(-dt / 0.42));
    push();
    // 日光方向在动，阴影就得跟着重画；但一次全场景阴影 pass 是几十毫秒级，
    // 每帧都点脏会把过渡期变成幻灯片，所以限到每 0.2 s 一次，收尾时再补最后一次。
    shadowCool -= dt;
    if (moved < 2e-3) {
      settled = true;
      shadowCool = 0;
    }
    if (shadowCool <= 0) {
      shadowCool = 0.2;
      engine.markShadowsDirty();
    }
  });

  function set(next) {
    const p = WEATHERS.find((w) => w.NAME === next);
    if (!p || p.NAME === name) return name;
    name = p.NAME;
    target = stateOf(p);
    settled = false;
    shadowCool = 0;
    useEnv(name);
    push();
    return name;
  }

  function cycle(step = 1) {
    const i = NAMES.indexOf(name);
    return set(NAMES[(i + step + NAMES.length) % NAMES.length]);
  }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= NAMES.length) set(NAMES[n - 1]);
    else if (e.code === 'KeyW') cycle(e.shiftKey ? -1 : 1);
  };
  window.addEventListener('keydown', onKey);

  useEnv(name);
  push();
  const ui = attachWeatherUI(engine, {
    set,
    get current() { return name; },
    get dark() { return !!(WEATHERS.find((w) => w.NAME === name) || CLEAR).DARK; },
  }, WEATHERS);
  if (WEATHER_PARAM && WEATHER_PARAM !== name) set(WEATHER_PARAM);

  return {
    set,
    cycle,
    names: NAMES,
    ui,
    get current() {
      return name;
    },
    get label() {
      return (WEATHERS.find((w) => w.NAME === name) || CLEAR).LABEL;
    },
    get easing() {
      return !settled;
    },
  };
}
