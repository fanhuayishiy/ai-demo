import {runSim} from 'teardown-kit/runtime.js';
import {FLIGHT, flightPose, tourPose, TOUR_SECONDS} from './kinematics.mjs';
import {makeDrone} from './model.js';
import {makeStage} from './stage.js';
import {makeUI} from './ui.js';

const TITLE = 'DJI AGRAS T50 · 农业无人机 3D 拆解与飞行';
const query = new URLSearchParams(location.search);

runSim({
  duration: query.get('sequence') === 'flight' ? FLIGHT.seconds : TOUR_SECONDS,
  fps: 60, theme: 'light', accent: '#a64a2a',
  hud: {enabled: false, title: TITLE, subtitle: ''}, director: {enabled: false},
}, async ({canvas, capture, cfg}) => {
  const app = document.getElementById('app');
  const ui = makeUI(app, canvas);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const flightCapture = capture && (query.get('sequence') === 'flight' || cfg.sequence === 'flight');
  const state = {
    mode: !capture || flightCapture ? 'flight' : 'build',
    amount: 0, goal: 0, selection: null, focus: null, view: 'hero', tour: false, allowOrbit: false,
    flightTime: 0, flightPlaying: !capture && !preference.matches, flightPhase: 'ready',
  };
  if (matchMedia('(pointer: coarse)').matches) {
    app.querySelector('.gesture-hint').innerHTML = '拖动旋转 <i></i> 双指缩放';
  }
  let dirty = true, tourClock, flightClock, lastClock, beforeFocus, press;
  let lastPose = {};
  const invalidate = () => { dirty = true; };
  const isExploded = amount => amount > .0001 ? 'explode' : 'build';
  const shownFlight = () => state.mode === 'flight' ? flightPose(state.flightTime) : null;

  function stopTour() {
    if (!state.tour) return;
    state.tour = false;
    state.goal = state.amount;
    invalidate();
  }

  function pauseFlight() {
    state.flightPlaying = false;
    flightClock = undefined;
    invalidate();
  }

  function onOrbit() {
    stopTour();
    if (state.flightPlaying) pauseFlight();
    state.allowOrbit = true;
    invalidate();
  }

  const drone = makeDrone();
  let stage;
  try {
    stage = makeStage(canvas, ui.viewport, drone, invalidate, onOrbit);
  } catch (error) {
    console.error(error);
    ui.update(state);
    ui.fail();
    return {render() {}};
  }
  canvas.addEventListener('webglcontextlost', ui.fail);
  const resize = () => { stage.resize(); invalidate(); };
  const observer = new ResizeObserver(resize);
  observer.observe(ui.viewport);
  resize();
  const initialFlight = shownFlight();
  drone.pose(0, {xray: false, focus: null, flight: initialFlight, moving: false});
  stage.frameCamera('hero', 0, null, initialFlight, 1);
  stage.controls.update();
  ui.update(state);

  function setMode(mode) {
    stopTour();
    pauseFlight();
    state.mode = mode;
    state.focus = null;
    state.goal = mode === 'explode' ? 1 : 0;
    state.allowOrbit = false;
    beforeFocus = null;
    invalidate();
  }

  function viewFrom(view) {
    stopTour();
    state.view = view;
    state.allowOrbit = false;
    invalidate();
  }

  function select(id) {
    stopTour();
    if (state.mode === 'flight' && id) setMode('build');
    if (state.focus) {
      if (!id) return;
      state.focus = id;
      state.allowOrbit = false;
    }
    state.selection = id;
    invalidate();
  }

  function toggleFocus() {
    if (!state.selection) return;
    stopTour();
    if (state.focus) {
      state.focus = null;
      if (beforeFocus) {
        state.mode = beforeFocus.mode;
        state.goal = beforeFocus.amount;
        beforeFocus = null;
      }
    } else {
      beforeFocus = {mode: state.mode, amount: state.goal};
      state.focus = state.selection;
      state.mode = 'explode';
      state.goal = 1;
    }
    state.allowOrbit = false;
    invalidate();
  }

  function reset() {
    setMode('build');
    select(null);
    viewFrom('hero');
  }

  function toggleFlight() {
    if (state.mode === 'flight' && state.flightPlaying) {
      pauseFlight();
      return;
    }
    if (state.mode !== 'flight' || state.flightTime >= FLIGHT.seconds) {
      setMode('flight');
      state.flightTime = 0;
      state.selection = null;
      state.view = 'hero';
    }
    state.flightPlaying = true;
    flightClock = undefined;
    state.allowOrbit = false;
    invalidate();
  }

  function seekFlight(time) {
    pauseFlight();
    state.flightTime = time;
    state.allowOrbit = false;
    invalidate();
  }

  function toggleTour() {
    if (state.tour) stopTour();
    else {
      reset();
      state.tour = true;
      tourClock = performance.now() / 1000;
    }
    invalidate();
  }

  app.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const {mode, view, part, action, flightSeek} = button.dataset;
    if (mode === 'flight') {
      if (state.mode !== 'flight') toggleFlight();
    } else if (mode) setMode(mode);
    else if (view) viewFrom(view);
    else if (part) select(part);
    else if (flightSeek) seekFlight(Number(flightSeek));
    else if (action === 'focus') toggleFocus();
    else if (action === 'reset') reset();
    else if (action === 'tour') toggleTour();
    else if (action === 'flight') toggleFlight();
    else if (action === 'save') stage.save(state.focus, state.amount, shownFlight());
  });
  ui.slider.addEventListener('input', () => {
    stopTour();
    const amount = ui.slider.valueAsNumber / 100;
    state.amount = state.goal = amount;
    state.mode = isExploded(amount);
    state.focus = null;
    beforeFocus = null;
    invalidate();
  });
  ui.flightSlider.addEventListener('input', () => seekFlight(ui.flightSlider.valueAsNumber));

  canvas.addEventListener('pointerdown', event => {
    press = event.isPrimary && event.button === 0 ? [event.pointerId, event.clientX, event.clientY] : null;
  });
  canvas.addEventListener('pointercancel', () => { press = null; });
  canvas.addEventListener('pointerup', event => {
    if (press?.[0] === event.pointerId && Math.hypot(event.clientX - press[1], event.clientY - press[2]) < 5) {
      select(stage.pick(event.clientX, event.clientY));
    }
    press = null;
  });
  addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (key === '1') setMode('build');
    else if (key === '2') setMode('explode');
    else if (key === '3') setMode('xray');
    else if (key === 'p') toggleFlight();
    else if (key === 'r') reset();
    else if (key === 'escape') {
      if (state.focus) toggleFocus();
      else if (state.tour) stopTour();
      else if (state.flightPlaying) pauseFlight();
      else select(null);
    } else if (key === ' ' && !event.target.matches?.('button,input')) {
      if (state.mode === 'flight') toggleFlight();
      else toggleTour();
    } else return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  preference.addEventListener('change', event => {
    if (event.matches) {
      stopTour();
      pauseFlight();
    }
  });

  function draw(time) {
    const now = capture ? time : performance.now() / 1000;
    const dt = Math.min(.08, Math.max(.001, now - (lastClock ?? now)));
    lastClock = now;
    if ((capture && !flightCapture) || state.tour) {
      const pose = tourPose(capture ? time : now - tourClock);
      state.amount = state.goal = pose.amount;
      state.mode = isExploded(pose.amount);
      state.selection = state.focus = pose.focus;
      state.view = pose.view;
    } else if (state.mode === 'flight') {
      state.amount = state.goal = 0;
      if (flightCapture) {
        state.flightTime = Math.min(FLIGHT.seconds, Math.max(0, time));
        state.flightPlaying = state.flightTime < FLIGHT.seconds;
      } else if (state.flightPlaying) {
        flightClock ??= now - state.flightTime;
        state.flightTime = Math.min(FLIGHT.seconds, now - flightClock);
        if (state.flightTime >= FLIGHT.seconds) pauseFlight();
      }
    } else if (Math.abs(state.amount - state.goal) > .0005 && !preference.matches) {
      state.amount += (state.goal - state.amount) * (1 - Math.exp(-dt * 7.7));
    } else state.amount = state.goal;

    const xray = state.mode === 'xray';
    const flightTime = state.mode === 'flight' ? state.flightTime : null;
    const flightChanged = flightTime !== lastPose.flightTime;
    const flight = flightChanged ? shownFlight() : lastPose.flight;
    if (flight) state.flightPhase = flight.phase;
    const amountChanged = state.amount !== lastPose.amount;
    const poseChanged = amountChanged || xray !== lastPose.xray || state.focus !== lastPose.focus || flightChanged;
    if (poseChanged) {
      drone.pose(state.amount, {xray, focus: state.focus, flight, moving: amountChanged});
      lastPose = {amount: state.amount, xray, focus: state.focus, flightTime, flight};
    }
    const blend = capture || preference.matches ? 1 : 1 - Math.exp(-dt * 8.7);
    const cameraChanged = !state.allowOrbit && (dirty || poseChanged || lastPose.cameraMoving)
      ? stage.frameCamera(state.view, state.amount, state.focus, flight, blend) : false;
    lastPose.cameraMoving = cameraChanged;
    const orbitChanged = stage.controls.update();
    ui.update(state);

    if (dirty || poseChanged || cameraChanged || orbitChanged || capture) {
      stage.draw(state.focus, state.amount, flight);
      ui.showLabels(stage, state.amount, state.selection, state.focus);
      ui.ready();
      app.dataset.ready = 'true';
      dirty = false;
    }
  }

  return {render: draw, resize, warm: stage.warm};
}).catch(error => {
  console.error(error);
  const info = document.querySelector('.loading p');
  if (info) info.textContent = '无法加载 3D 模型。请重新打开页面。';
});
