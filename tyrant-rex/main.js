import * as THREE from 'three';
import {runSim} from 'teardown-kit/runtime.js';
import {createRex} from './model.js';
import {poseRex, posePatrol, transitionPose, roarStrengthAt, PATROL, ROAR} from './kinematics.mjs';
import {createSoundEngine} from './sound.js';
import {createStage, CAMERAS, INSPECTION} from './stage.js';
import {createUI} from './ui.js';

const mod = n => ((n % 1) + 1) % 1;
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const CFG = {duration: 96, fps: 60, theme: 'light', accent: '#e8874b', hud: {enabled: false, title: 'TYRANT RX-01', subtitle: '· 机械霸王龙拆解档案'}, director: {enabled: false}};

function tourAt(t) {
  const p = ((t % 36) + 36) % 36;
  if (p < 6) return {mode: 'assembled', selected: null, explode: 0, view: 'hero', camera: CAMERAS.hero, tourProgress: p / 36};
  if (p < 14) return {mode: 'exploded', selected: null, explode: smooth((p - 6) / 2), view: 'hero', camera: {...CAMERAS.hero, distance: 1.2}, tourProgress: p / 36};
  if (p < 21) return {mode: 'assembled', selected: 'skull', explode: 1 - smooth((p - 14) / 1.6), view: 'detail', camera: INSPECTION.skull, tourProgress: p / 36};
  if (p < 28) return {mode: 'xray', selected: 'core', explode: .32, view: 'detail', camera: INSPECTION.core, tourProgress: p / 36};
  if (p < 32) return {mode: 'assembled', selected: 'legs', explode: 0, view: 'detail', camera: INSPECTION.legs, tourProgress: p / 36};
  return {mode: 'assembled', selected: null, explode: 0, view: 'side', camera: CAMERAS.side, tourProgress: p / 36};
}

runSim(CFG, async ({canvas, capture}) => {
  const app = document.getElementById('app');
  const state = {
    ready: false, mode: 'assembled', selected: null, explode: 0, speed: .7,
    playing: !reducedMotion.matches, tour: false, sound: false, view: 'hero',
    phase: 0, action: 'walk', blink: 0, headYaw: 0, jawAngle: 0, hipAngle: 0, kneeAngle: 0, fps: 0,
    partCount: 0, meshCount: 0, tourProgress: 0,
  };
  let targetExplode = 0;
  let stage, rex;
  let tourStart = 0;
  let previousFrame = performance.now();
  let lastUI = -1;
  let fpsFrame = 0, fpsSince = performance.now();
  let initializedCamera = false;
  let heartPhase = .075;
  let patrolTime = 0;
  let pose = posePatrol(patrolTime, {heartPhase});
  let replay, blendFrom, blendElapsed = 0;
  let inspectionCamera;
  const blendDuration = .36;
  const audio = createSoundEngine();
  let soundWanted = null, stillVoiceStart = null, soundRequest = 0;
  const setSound = async (enabled, automatic = false) => {
    const request = ++soundRequest;
    if (!automatic) soundWanted = enabled;
    const active = await audio.setEnabled(enabled);
    if (request !== soundRequest) return;
    state.sound = active;
    if (active) soundWanted = true;
    if (enabled && !active && !automatic) {
      soundWanted = null;
      ui.toast('声音暂未开启，点扬声器可重试');
    }
    ui.update(state);
  };
  const updateSound = now => {
    if (!state.sound || capture) return;
    const moving = state.playing && !document.hidden;
    let phase = pose.phase;
    let strength = moving ? pose.motion.roar : 0;
    if (stillVoiceStart !== null && !document.hidden) {
      phase = ROAR.voiceStart + (now - stillVoiceStart) * state.speed / (ROAR.duration * 1000);
      strength = roarStrengthAt(phase);
      if (phase >= ROAR.voiceEnd) stillVoiceStart = null;
    }
    audio.tick(state.speed, moving, strength, phase);
  };
  const own = () => {
    state.tour = false;
    state.tourProgress = 0;
    stillVoiceStart = null;
  };
  const setCamera = (name, immediate = false) => {
    state.view = name;
    const base = CAMERAS[name] || CAMERAS.hero;
    inspectionCamera = name === 'detail' ? base : undefined;
    if (!inspectionCamera) {
      const distance = state.mode === 'exploded' ? Math.max(1.23, base.distance || 1) : base.distance;
      stage?.setCamera({...base, distance}, immediate || reducedMotion.matches);
    }
  };
  const followInspection = spec => {
    const toWorld = coordinates => rex.root.localToWorld(new THREE.Vector3(...coordinates)).toArray();
    return {...spec, position: toWorld(spec.position), target: toWorld(spec.target)};
  };
  const mode = name => {
    own();
    state.mode = name;
    state.selected = null;
    targetExplode = name === 'exploded' ? 1 : 0;
    setCamera('hero');
    audio.chime();
  };
  const select = id => {
    own();
    const selected = state.selected === id ? null : id;
    state.selected = selected;
    if (!selected) {
      targetExplode = 0;
      state.mode = 'assembled';
      setCamera('hero');
      return;
    }
    targetExplode = id === 'armor' ? .48 : id === 'core' ? .32 : 0;
    state.mode = id === 'core' ? 'xray' : id === 'armor' ? 'exploded' : 'assembled';
    state.view = 'detail';
    inspectionCamera = INSPECTION[id];
    audio.chime();
  };
  const reset = () => {
    own();
    state.mode = 'assembled';
    state.selected = null;
    state.speed = .7;
    patrolTime = 0;
    state.playing = !reducedMotion.matches;
    heartPhase = .075;
    replay = blendFrom = undefined;
    targetExplode = 0;
    setCamera('hero');
  };
  const replayRoar = () => {
    own();
    if (!capture && soundWanted !== false) void setSound(true);
    state.mode = 'assembled';
    state.selected = null;
    targetExplode = 0;
    state.playing = !reducedMotion.matches;
    replay = {phase: state.playing ? ROAR.start : ROAR.peak, path: pose.path};
    blendFrom = state.playing ? pose : undefined;
    blendElapsed = 0;
    if (!state.playing) stillVoiceStart = performance.now();
    setCamera('hero');
  };
  const save = () => {
    own();
    stage.render();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#e9edef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    const size = Math.max(12, Math.round(canvas.width * .012));
    ctx.font = `600 ${size}px Inter, sans-serif`;
    ctx.fillStyle = '#17374b';
    ctx.fillText('TYRANT / RX–01', size * 1.5, canvas.height - size * 1.5);
    ctx.textAlign = 'right';
    ctx.font = `${Math.round(size * .72)}px "JetBrains Mono", monospace`;
    ctx.fillText('MECHANICAL ANATOMY / TEARDOWN', canvas.width - size * 1.5, canvas.height - size * 1.5);
    const anchor = document.createElement('a');
    anchor.download = `TYRANT-RX01-${state.mode}.png`;
    anchor.href = exportCanvas.toDataURL('image/png');
    anchor.click();
    ui.toast('三维视图已保存');
  };
  const fullscreen = async () => {
    own();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await app.requestFullscreen();
    } catch {
      ui.toast('当前浏览器无法全屏，可按 F11 查看');
    }
  };
  const toggleTour = () => {
    const next = !state.tour;
    own();
    state.tour = next;
    tourStart = performance.now();
    if (next) {
      state.playing = true;
      ui.toast('开始结构导览 · 拖动即可接管');
    }
  };
  const ui = createUI(app, {
    mode, select, reset, replayRoar, capture: save, fullscreen,
    camera: name => { own(); state.selected = null; setCamera(name); },
    explode: value => {
      own(); state.selected = null;
      targetExplode = Math.max(0, Math.min(1, value));
      state.mode = targetExplode > .001 ? 'exploded' : 'assembled';
      if (state.view === 'detail') setCamera('hero');
    },
    speed: value => { own(); state.speed = Number(value); },
    togglePlay: () => { own(); state.playing = !state.playing; audio.chime(); },
    toggleTour,
    sound: () => { own(); void setSound(!soundWanted); },
  });
  ui.canvasHost.appendChild(canvas);
  try {
    stage = createStage(canvas, ui.viewport);
    rex = createRex();
    stage.scene.add(rex.root);
    state.partCount = rex.partCount;
    state.meshCount = rex.meshCount;
    rex.update(pose);
    stage.render();
  } catch (error) {
    console.error(error);
    ui.setError?.('无法初始化三维视图。请使用支持 WebGL 2 的 Chrome 或 Edge 打开。');
    throw error;
  }
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let down = null, lastHovered = null;
  canvas.addEventListener('pointerdown', e => {
    own();
    inspectionCamera = undefined;
    stage.stopCamera();
    down = {x: e.clientX, y: e.clientY, time: performance.now()};
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointerup', e => {
    canvas.style.cursor = 'grab';
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5 || performance.now() - down.time > 600) { down = null; return; }
    down = null;
    const rect = canvas.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, stage.camera);
    const hit = raycaster.intersectObject(rex.root, true).find(h => h.object.userData.system);
    if (hit) select(hit.object.userData.system);
  });
  canvas.addEventListener('pointercancel', () => { down = null; canvas.style.cursor = 'grab'; });
  canvas.addEventListener('pointermove', e => {
    if (down || e.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, stage.camera);
    lastHovered = raycaster.intersectObject(rex.root, true).find(h => h.object.userData.system)?.object.userData.system || null;
    canvas.style.cursor = lastHovered ? 'pointer' : 'grab';
  });
  canvas.addEventListener('wheel', own, {passive: true});
  stage.controls.addEventListener('start', () => { own(); inspectionCamera = undefined; stage.stopCamera(); });
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.target.isContentEditable) {
      // Keep native focus/slider/button actions, without the kit's global seek shortcuts.
      e.stopImmediatePropagation();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (![' ', '1', '2', '3', 'x', 'r', 'g', 'f', 's'].includes(key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (key === '1') mode('assembled');
    if (key === '2') mode('exploded');
    if (key === '3' || key === 'x') mode(state.mode === 'xray' && key === 'x' ? 'assembled' : 'xray');
    if (key === ' ') { own(); state.playing = !state.playing; }
    if (key === 'r') reset();
    if (key === 'g') toggleTour();
    if (key === 'f') fullscreen();
    if (key === 's') save();
    ui.update(state);
  }, {capture: true});
  const observer = new ResizeObserver(() => {
    stage.resize();
    if (initializedCamera) {
      if (inspectionCamera) stage.setCamera(followInspection(inspectionCamera), true);
      else if (state.view !== 'detail') setCamera(state.view, true);
    }
    initializedCamera = true;
  });
  observer.observe(ui.viewport);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { own(); state.playing = false; }
  });
  document.addEventListener('visibilitychange', () => {
    previousFrame = performance.now();
    if (document.hidden) stillVoiceStart = null;
    updateSound(previousFrame);
  });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    state.playing = false;
    ui.toast('三维上下文已中断，请刷新页面恢复');
  });
  let stats = {};
  window.TYRANT = {
    get state() { return {...state}; },
    get stats() { return {...stats}; },
  };
  const finishLoading = () => {
    state.ready = true;
    ui.setReady(capture);
    ui.update(state);
    if (!capture && state.playing && soundWanted === null) void setSound(true, true);
  };
  if (capture) finishLoading();
  const render = t => {
    const now = performance.now();
    const dt = Math.min(.06, Math.max(0, (now - previousFrame) / 1000));
    previousFrame = now;
    let tourCamera;
    if (capture) {
      const tour = tourAt(t);
      Object.assign(state, tour);
      patrolTime = t;
      heartPhase = mod(.075 + t * .45);
      tourCamera = tour.camera;
    } else {
      if (state.tour) {
        const tour = tourAt((now - tourStart) / 1000);
        Object.assign(state, tour);
        targetExplode = tour.explode;
        tourCamera = tour.camera;
      }
      if (state.playing && !document.hidden) {
        const elapsed = dt * state.speed;
        heartPhase = mod(heartPhase + elapsed * .45);
        if (replay) {
          replay.phase += elapsed / ROAR.duration;
          if (replay.phase >= 1) {
            replay = undefined;
            blendFrom = pose;
            blendElapsed = 0;
          }
        } else {
          patrolTime = (patrolTime + elapsed) % PATROL.duration;
        }
        if (blendFrom) {
          blendElapsed += dt;
          if (blendElapsed >= blendDuration) blendFrom = undefined;
        }
      }
      const alpha = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 6);
      state.explode += (targetExplode - state.explode) * alpha;
      if (Math.abs(targetExplode - state.explode) < .0003) state.explode = targetExplode;
    }
    pose = posePatrol(patrolTime, {heartPhase});
    if (!capture && replay) {
      const roar = poseRex(replay.phase, {heartPhase});
      const facing = Math.cos(replay.path.yaw) >= 0 ? 1 : -1.24;
      roar.motion.headYaw *= facing;
      pose = {...roar, path: replay.path, stage: 'roar',
        cyclePhase: (PATROL.walk + replay.phase * ROAR.duration) / PATROL.run};
    }
    if (!capture && blendFrom) pose = transitionPose(blendFrom, pose, blendElapsed / blendDuration);
    rex.update(pose, {explode: state.explode, xray: state.mode === 'xray', selected: state.selected});
    stage.updateFootShadows(rex.getFeet());
    if (tourCamera) stage.setCamera(state.view === 'detail' ? followInspection(tourCamera) : tourCamera, capture);
    else if (inspectionCamera) stage.setCamera(followInspection(inspectionCamera), reducedMotion.matches);
    stage.step(capture ? 1 : dt);
    stage.render();
    const deg = 180 / Math.PI;
    state.action = pose.stage;
    state.phase = pose.cyclePhase;
    state.blink = pose.blink;
    state.headYaw = pose.motion.headYaw * deg;
    state.jawAngle = pose.jaw * deg;
    state.hipAngle = (pose.legs[1].angles[0] + Math.PI / 2) * deg;
    state.kneeAngle = pose.legs[1].angles[2] * deg;
    if (!capture) fpsFrame++;
    if (!capture && now - fpsSince > 800) {
      state.fps = Math.round(fpsFrame * 1000 / (now - fpsSince));
      fpsSince = now;
      fpsFrame = 0;
    }
    stats = {
      parts: rex.partCount, meshes: rex.meshCount,
      travelX: pose.path.x,
      reactorAngle: rex.reactorAngle,
      drawCalls: stage.renderer.info.render.calls,
      triangles: stage.renderer.info.render.triangles,
      fps: state.fps, geometries: stage.renderer.info.memory.geometries,
      viewport: stage.size,
    };
    if (capture || now - lastUI > 70) {
      ui.update(state);
      for (const id of Object.keys(rex.systems)) {
        const p = stage.project(rex.getAnchor(id));
        const visible = (stage.size.width > 650 && state.mode === 'exploded' && state.explode > .5 && !state.selected || state.selected === id) && p.visible;
        ui.updateLabel(id, p.x, p.y, visible);
      }
      updateSound(now);
      lastUI = now;
    }
    return {};
  };
  return {
    render,
    resize() { stage.resize(); },
    async warm() {
      try { await stage.warm(); } catch { /* Browsers without parallel compilation use their first draw. */ }
      finishLoading();
    },
  };
}).catch(error => {
  console.error('TYRANT initialization failed', error);
  const loading = document.querySelector('[data-loading], #loading');
  if (loading) loading.textContent = '三维初始化未完成，请尝试 Chrome 或 Edge。';
});
