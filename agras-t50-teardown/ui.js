import {PARTS} from './parts.js';
import {FLIGHT} from './kinematics.mjs';

const PART_BY_ID = new Map(PARTS.map(part => [part.id, part]));
const LEFT_LABELS = new Set(['propellers', 'tank', 'gear', 'nozzles']);
const MODE_NAMES = {build: '装配状态', explode: '爆炸拆解', xray: '外壳透视', flight: '飞行作业'};
const FLIGHT_NAMES = {ready: '待飞', takeoff: '起飞', forward: '前进', spray: '喷洒作业', landing: '降落', landed: '已落地'};
const MODES = [
  ['build', '装配', '整机与起落架', '1'],
  ['explode', '爆炸拆解', '展开八组部件', '2'],
  ['xray', '透视', '查看机身内部', '3'],
  ['flight', '飞行作业', '起飞、撒药与降落', 'P'],
];

export function makeUI(app, canvas) {
  app.innerHTML = [
    '<header class="mast"><div class="mast-brand"><span class="brand-emblem" aria-hidden="true"><span class="brand-mark"><i></i><i></i><i></i><i></i></span></span>',
    '<span class="brand-text"><span class="brand-name">TEARDOWN</span><span class="brand-subtitle">3D 拆解档案</span></span></div>',
    '<div class="mast-actions">',
    '<button type="button" data-action="tour" class="tour-button" aria-pressed="false"><i class="play-mark" aria-hidden="true"></i><span>拆解导览</span></button>',
    '<button type="button" data-action="save" class="save-button" aria-label="保存画面" title="保存画面"><i class="camera-mark" aria-hidden="true"></i></button>',
    '<span class="offline-note"><i aria-hidden="true"></i>离线可用</span></div></header>',
    '<main class="workbench"><section class="explore" aria-labelledby="title">',
    '<div class="stage-title"><p class="kicker">大疆 · 农业无人飞机</p><h1 id="title">AGRAS <span>T50</span></h1></div>',
    '<nav class="mode-control" aria-labelledby="modes-title"><h2 id="modes-title">探索模式</h2>',
    MODES.map(([id, name, caption, key]) => '<button type="button" class="mode-option" data-mode="' + id +
      '" aria-label="' + name + '" aria-pressed="false"><i class="mode-glyph" aria-hidden="true"></i><span><strong>' + name + '</strong><small>' + caption +
      '</small></span><kbd aria-hidden="true">' + key + '</kbd></button>').join(''),
    '</nav></section>',
    '<section class="stage" aria-labelledby="title">',
    '<div class="stage-header"><span class="stage-caption"><i aria-hidden="true"></i><span id="stage-mode"></span></span></div>',
    '<div class="viewport" role="region" aria-label="无人机三维视图"><div class="viewport-corners" aria-hidden="true"></div>',
    '<canvas class="leaders" aria-hidden="true"></canvas><div class="callouts"></div>',
    '<div class="loading" role="status"><span></span><p>正在准备 3D 模型</p></div></div>',
    '<div class="viewline"><div class="view-controls" role="group" aria-label="相机视角">',
    '<button type="button" data-view="hero" aria-pressed="true">斜视</button>',
    '<button type="button" data-view="top" aria-pressed="false">俯视</button>',
    '<button type="button" data-view="front" aria-pressed="false">正视</button>',
    '<button type="button" data-action="reset" class="reset-view" title="复位 (R)">复位</button></div>',
    '<span class="gesture-hint">拖动旋转 <i></i> 滚轮缩放</span></div></section>',
    '<footer class="control-deck" aria-label="飞行与拆解控制">',
    '<button type="button" data-action="flight" class="flight-button"><span class="transport-disc" aria-hidden="true"><i class="play-mark"></i></span>',
    '<span class="transport-label">飞行演示</span></button>',
    '<div class="dock">',
    '<div class="scrub"><div class="scrub-head"><label for="scrub">拆解进度</label><output for="scrub" class="readout">0<span>%</span></output></div>',
    '<input id="scrub" type="range" min="0" max="100" step="1" value="0" aria-valuetext="拆解 0%">',
    '<div class="scrub-ends"><span>装配</span><span>25</span><span>50</span><span>75</span><span>完全拆解</span></div></div>',
    '<div class="flight-panel scrub" hidden><div class="scrub-head"><label for="flight-clock">飞行时间</label>',
    '<span class="flight-state"></span><output for="flight-clock" class="flight-readout"></output></div>',
    '<input id="flight-clock" type="range" min="0" max="' + FLIGHT.seconds + '" step="0.01" value="0" aria-valuetext="0 秒">',
    '<div class="flight-steps" role="group" aria-label="查看飞行阶段">',
    '<button type="button" data-flight-seek="3.1" data-phase="takeoff">起飞</button>',
    '<button type="button" data-flight-seek="4.85" data-phase="forward">前进</button>',
    '<button type="button" data-flight-seek="6.4" data-phase="spray">撒药</button>',
    '<button type="button" data-flight-seek="10.5" data-phase="landing">降落</button></div></div></div></footer>',
    '<aside class="component-index" aria-labelledby="parts-title"><div class="rail-head"><h2 id="parts-title">部件索引</h2>',
    '<span class="rail-count">' + String(PARTS.length).padStart(2, '0') + ' 组</span></div>',
    '<div class="part-list" aria-label="选择部件">' + PARTS.map(part =>
      '<button type="button" class="part-row" data-part="' + part.id + '" aria-pressed="false"><span class="part-number">' + part.number +
      '</span><span>' + part.name + '</span><i class="row-chevron" aria-hidden="true"></i></button>').join('') + '</div></aside>',
    '<aside class="rail" aria-labelledby="observations-title"><div class="rail-head"><h2 id="observations-title">观察面板</h2></div>',
    '<section class="detail" aria-label="部件说明"><p class="detail-code"></p><h3></h3><p class="detail-text"></p>',
    '<ul class="detail-notes"></ul><button type="button" data-action="focus" class="focus-button" hidden>单独查看</button></section>',
    '<section class="flight-monitor" aria-label="飞行状态" hidden><div class="monitor-heading"><h3>飞行状态</h3>',
    '<span class="playback-status"><i aria-hidden="true"></i><span></span></span></div>',
    '<dl><div><dt>当前阶段</dt><dd class="monitor-phase"></dd></div>',
    '<div><dt>双喷头</dt><dd class="monitor-spray"></dd></div></dl></section></aside></main>',
  ].join('');

  const viewport = app.querySelector('.viewport');
  viewport.prepend(canvas);
  canvas.setAttribute('aria-label', '可旋转的大疆 T50 3D 模型');
  const loading = app.querySelector('.loading');
  const slider = app.querySelector('#scrub');
  const flightSlider = app.querySelector('#flight-clock');
  const readout = app.querySelector('.readout');
  const flightPanel = app.querySelector('.flight-panel');
  const flightReadout = app.querySelector('.flight-readout');
  const flightStatus = app.querySelector('.flight-state');
  const flightMonitor = app.querySelector('.flight-monitor');
  const playback = flightMonitor.querySelector('.playback-status');
  const playbackText = playback.querySelector('span');
  const monitorPhase = flightMonitor.querySelector('.monitor-phase');
  const monitorSpray = flightMonitor.querySelector('.monitor-spray');
  const stageMode = app.querySelector('#stage-mode');
  const flightSteps = [...app.querySelectorAll('[data-flight-seek]')];
  const flightButton = app.querySelector('[data-action="flight"]');
  const flightText = flightButton.querySelector('.transport-label');
  const detail = app.querySelector('.detail');
  const detailCode = detail.querySelector('.detail-code');
  const detailTitle = detail.querySelector('h3');
  const detailText = detail.querySelector('.detail-text');
  const detailNotes = detail.querySelector('.detail-notes');
  const focusButton = detail.querySelector('.focus-button');
  const tourButton = app.querySelector('[data-action="tour"]');
  const tourText = tourButton.querySelector('span');
  const railRows = [...app.querySelectorAll('.part-row')];
  const modeButtons = [...app.querySelectorAll('[data-mode]')];
  const viewButtons = [...app.querySelectorAll('[data-view]')];
  const callouts = app.querySelector('.callouts');
  const leaderCanvas = app.querySelector('.leaders');
  const leaders = leaderCanvas.getContext('2d');
  const labels = PARTS.map(part => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'callout';
    button.dataset.part = part.id;
    button.setAttribute('aria-label', '查看' + part.name);
    button.innerHTML = '<span>' + part.number + '</span>' + part.name;
    button.hidden = true;
    callouts.append(button);
    return {id: part.id, button, left: LEFT_LABELS.has(part.id)};
  });

  let lastAmount = -1, lastDetail, lastFocus, lastMode, lastView, lastTour, lastFlightPhase, lastFlightTime, lastFlightLabel;
  function update({mode, amount, selection, focus, view, tour, flightTime, flightPlaying, flightPhase}) {
    const value = Math.round(amount * 100);
    if (value !== lastAmount) {
      lastAmount = value;
      slider.value = value;
      slider.style.setProperty('--progress', value + '%');
      slider.setAttribute('aria-valuetext', '拆解 ' + value + '%');
      readout.innerHTML = value + '<span>%</span>';
    }
    if (mode !== lastMode) {
      lastMode = mode;
      app.dataset.mode = mode;
      modeButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === mode));
      viewport.setAttribute('aria-label', '无人机三维视图，' + MODE_NAMES[mode]);
      stageMode.textContent = MODE_NAMES[mode];
      slider.closest('.scrub').hidden = mode === 'flight';
      flightPanel.hidden = mode !== 'flight';
      flightMonitor.hidden = mode !== 'flight';
    }
    const flightLabel = mode !== 'flight' || flightTime === 0 && !flightPlaying ? '飞行演示'
      : flightPlaying ? '暂停飞行' : flightTime >= FLIGHT.seconds ? '重播飞行' : '继续飞行';
    if (flightLabel !== lastFlightLabel) {
      lastFlightLabel = flightLabel;
      flightText.textContent = flightLabel;
      flightButton.dataset.playing = flightPlaying ? 'true' : 'false';
      playback.dataset.playing = flightButton.dataset.playing;
      playbackText.textContent = flightPlaying ? '运行中' : flightTime >= FLIGHT.seconds ? '已结束' : flightTime ? '已暂停' : '待播放';
    }
    if (mode === 'flight') {
      const rounded = flightTime.toFixed(2);
      if (lastFlightTime !== rounded) {
        lastFlightTime = rounded;
        flightSlider.value = rounded;
        flightSlider.style.setProperty('--progress', flightTime / FLIGHT.seconds * 100 + '%');
        flightSlider.setAttribute('aria-valuetext', rounded + ' 秒');
        flightReadout.textContent = flightTime.toFixed(1) + ' / ' + FLIGHT.seconds.toFixed(1) + ' s';
      }
      if (lastFlightPhase !== flightPhase) {
        lastFlightPhase = flightPhase;
        flightPanel.dataset.phase = flightPhase;
        flightStatus.textContent = monitorPhase.textContent = FLIGHT_NAMES[flightPhase];
        monitorSpray.textContent = flightPhase === 'spray' ? '喷洒中' : '关闭';
        monitorSpray.dataset.active = String(flightPhase === 'spray');
        flightSteps.forEach(button => button.setAttribute('aria-current', button.dataset.phase === flightPhase ? 'step' : 'false'));
      }
    }
    if (view !== lastView) {
      lastView = view;
      viewButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.view === view));
    }
    if (tour !== lastTour) {
      lastTour = tour;
      tourButton.setAttribute('aria-pressed', tour);
      tourText.textContent = tour ? '停止导览' : '拆解导览';
    }
    if (selection !== lastDetail) {
      lastDetail = selection;
      const part = PART_BY_ID.get(selection);
      railRows.forEach(button => button.setAttribute('aria-pressed', button.dataset.part === selection));
      detailCode.textContent = part ? part.number + ' / ' + part.english : 'DJI AGRAS T50';
      detailTitle.textContent = part ? part.name : '整机总览';
      detailText.textContent = part
        ? part.description
        : '机臂、电机和上拱滑橇参考 T50 整机图建模。铜绕组与航电板用于观察拆解结构。';
      const notes = part ? part.details : ['4 组同轴旋翼', '8 副桨', '40 L 药箱'];
      detailNotes.replaceChildren(...notes.map(text => {
        const item = document.createElement('li');
        item.textContent = text;
        return item;
      }));
    }
    if (selection !== lastFocus?.selection || focus !== lastFocus?.focus) {
      lastFocus = {selection, focus};
      focusButton.hidden = !selection;
      focusButton.textContent = focus ? '返回整机' : '单独查看';
      focusButton.setAttribute('aria-pressed', Boolean(focus));
    }
  }

  function showLabels(stage, amount, selection, focus) {
    const width = stage.width(), height = stage.height();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const wide = width > 720 && height > 325;
    const all = wide && amount >= .73;
    const columns = [[], []];
    if (leaderCanvas.width !== Math.round(width * ratio) || leaderCanvas.height !== Math.round(height * ratio)) {
      leaderCanvas.width = Math.round(width * ratio);
      leaderCanvas.height = Math.round(height * ratio);
    }
    leaders.setTransform(ratio, 0, 0, ratio, 0, 0);
    leaders.clearRect(0, 0, width, height);
    for (const label of labels) {
      if (focus || (!all && selection !== label.id) || width < 355) {
        label.button.hidden = true;
        continue;
      }
      const p = stage.project(label.id);
      const visible = p.inside && p.x > 20 && p.x < width - 20 && p.y > 3 && p.y < height - 3;
      label.button.hidden = !visible;
      if (!visible) continue;
      label.button.dataset.active = String(selection === label.id);
      columns[label.left ? 0 : 1].push({...label, p, width: label.button.offsetWidth});
    }
    for (const column of columns) {
      const gap = 34, edge = 23;
      column.sort((a, b) => a.p.y - b.p.y);
      let y = edge - gap;
      for (const [index, label] of column.entries()) {
        const limit = height - edge - gap * (column.length - 1 - index);
        y = Math.max(y + gap, Math.min(limit, Math.max(edge, label.p.y)));
        const selected = selection === label.id;
        const start = label.left ? edge + label.width : width - edge - label.width;
        const direction = label.left ? 1 : -1;
        label.button.style.transform = 'translate(' + (label.left ? edge : start) + 'px,' + (y - 12) + 'px)';
        leaders.strokeStyle = selected ? '#a64b26' : '#46687d66';
        leaders.fillStyle = selected ? '#a64b26' : '#54798d';
        leaders.lineWidth = selected ? 1.15 : .85;
        leaders.beginPath();
        leaders.moveTo(start, y);
        leaders.lineTo(start + direction * 13, y);
        leaders.lineTo(label.p.x, label.p.y);
        leaders.stroke();
        leaders.beginPath();
        leaders.arc(label.p.x, label.p.y, selected ? 3.1 : 2.25, 0, Math.PI * 2);
        leaders.fill();
      }
    }
  }

  function fail() {
    loading.hidden = false;
    loading.classList.add('loading-error');
    loading.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = '当前浏览器未能启动 3D 视图';
    const hint = document.createElement('p');
    hint.textContent = '请在启用硬件加速的 Chrome 或 Edge 中重新打开。';
    loading.append(title, hint);
  }
  return {viewport, slider, flightSlider, update, showLabels, fail, ready: () => { loading.hidden = true; }};
}
