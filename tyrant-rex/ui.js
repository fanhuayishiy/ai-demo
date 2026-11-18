import {posePatrol, PATROL, ROAR} from './kinematics.mjs';

const GLYPHS = {
  rex: '<path d="M3 8h10l3 4 5 2-5 1-4-3-3 4v5H6v-7l-3-2V8ZM4 4h10v4H4z"/><path d="M7 5.5h.1M3 10h5m4 1-1 3m0-1h3"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v9m-8-4.5 8 4.5 8-4.5M12 12v9"/>',
  layers: '<path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Zm-9 9 9 4.5 9-4.5M3 16l9 4.5 9-4.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  skull: '<path d="M3 6h12l5 5-2 6h-6l-3-3H3V6Zm0 12h8l5-2m-9-3v3m-2-3v2m9-7 2 2"/><circle cx="14" cy="10" r="2"/>',
  core: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3"/>',
  armor: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="M12 2v20m-8-10h16"/>',
  legs: '<circle cx="15" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="15" cy="20" r="2"/><path d="m14 6-5 4m0 4 5 4m1 4H7"/>',
  tail: '<path d="M3 5c3 0 2 7 6 7s1-5 5-5 3 6 7 6M3 3v4m5 2v6m6-10v5m4-1v5"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  camera: '<path d="m7 6 2-3h6l2 3h4v14H3V6h4Z"/><circle cx="12" cy="12" r="4"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',
  full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  mute: '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13 0 6 6m0-6-6 6"/>',
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="3"/>',
  move: '<path d="M12 2v20M2 12h20m-13-7 3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3"/>',
};
const svg = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name] || GLYPHS.cube}</svg>`;
const SYSTEMS = {
  skull: {name: '颅骨与咬合', en: 'CRANIAL ASSEMBLY', note: '从渐窄鼻吻，到外扩眼眶与颧弓。靠近查看光学虹膜、弯曲齿冠和牙槽；拆开颅顶与两副牙列，观察腭部框架及伸缩咬合缸。', tag: '曲面颅甲 / 独立牙列 / 咬合机构'},
  core: {name: '环形动力核心', en: 'REACTOR & CONTROL', note: '七叶飞轮持续旋转，青色光随节律起伏。胸甲检视窗直接露出运转的机械心脏；展开核心还能查看定子、控制板与线束。', tag: '动力心脏 / 运动主控'},
  armor: {name: '分瓣机甲', en: 'SEGMENTED ARMOR', note: '背部与两侧装甲分别向外展开，露出脊柱与成对肋架。拆解滑块可以停在任意层次。', tag: '背部护甲 / 胸部装甲'},
  legs: {name: '液压后肢', en: 'LOCOMOTION SYSTEM', note: '三趾足一前一后踩稳，股节和胫节在蓄力时屈膝，随身体向前探出。下方可查看关节读数。', tag: '伺服轴承 / 双连杆机构'},
  tail: {name: '节段平衡尾', en: 'ARTICULATED TAIL', note: '十四节机械尾椎逐渐收窄。铜色连杆与轴承沿脊线延伸，摆动由同一运动相位驱动。', tag: '14 节尾椎 / 串联关节'},
};
const MODES = [['assembled', 'cube', '装配总览', 'THE COMPLETE MACHINE', '1'], ['exploded', 'layers', '爆炸拆解', 'TAKE IT APART', '2'], ['xray', 'eye', '透视机甲', 'BENEATH THE ARMOR', '3']];
const VIEWS = [['hero', '总览'], ['side', '侧视'], ['front', '正视'], ['top', '俯视'], ['detail', '特写']];
const maxJawDegrees = ROAR.maxJaw * 180 / Math.PI;
const jawChartY = radians => 38 - 31 * radians / ROAR.maxJaw;
const jawCurve = Array.from({length: 71}, (_, index) => {
  const height = jawChartY(posePatrol(PATROL.run * index / 70).jaw);
  return `${index ? 'L' : 'M'}${index * 3} ${height.toFixed(2)}`;
}).join(' ');

export function createUI(host, callbacks) {
  const shell = document.createElement('div');
  shell.className = 'rex-page';
  shell.innerHTML = `
    <header class="museum-header">
      <div class="brand"><span class="brand-symbol">${svg('rex', 27)}</span><div><strong>FORM / FUNCTION</strong><span>机械生命档案馆</span></div></div>
      <div class="header-center"><span class="live-dot"></span> INTERACTIVE COLLECTION <span class="header-divider">/</span> NO. 001</div>
      <div class="header-tools">
        <button class="icon-button" data-action="sound" aria-label="开启机械音效" aria-pressed="false" title="机械音效">${svg('mute')}</button>
        <button class="icon-button" data-action="capture" aria-label="保存截图" title="保存截图 · S">${svg('camera')}</button>
        <button class="icon-button" data-action="fullscreen" aria-label="全屏查看" title="全屏查看 · F">${svg('full')}</button>
        <span class="offline-note"><i></i> 离线可用</span>
      </div>
    </header>
    <main class="exhibit">
      <aside class="intro-panel">
        <div class="collection-code"><span>MECHANICAL ANATOMY</span><b>RX—01</b></div>
        <h1>TYRANT<span class="title-point">.</span></h1>
        <h2>机械霸王龙</h2>
        <p class="intro-copy">远古的轮廓，未来的骨骼。<br>拆开它，发现每一处精密。</p>
        <div class="edition-label"><span></span> CONCEPT MACHINE / 概念机械</div>
        <nav class="mode-list" aria-label="探索模式">
          ${MODES.map(([id, glyph, name, sub, key]) => `<button class="mode-button ${id === 'assembled' ? 'active' : ''}" data-mode="${id}" aria-pressed="${id === 'assembled'}"><span class="mode-icon">${svg(glyph, 22)}</span><span><strong>${name}</strong><small>${sub}</small></span><kbd>${key}</kbd></button>`).join('')}
        </nav>
        <div class="model-facts"><div><strong id="part-count">—</strong><span>精细构造零件</span></div><div><strong>05</strong><span>可探索系统</span></div></div>
        <div class="intro-bottom"><span class="tiny-heading">A CLOSER LOOK</span><p>点选任一部件，<br>让细节成为主角。</p>${svg('arrow', 15)}</div>
      </aside>
      <section class="rex-viewport" aria-label="可交互的机械霸王龙三维视图">
        <div class="viewport-watermark" aria-hidden="true">TYRANT</div>
        <div class="canvas-host"></div>
        <div class="viewport-caption"><span class="crosshair"></span><span id="mode-caption">装配视图</span><span class="caption-rule"></span><span>RX–01</span></div>
        <div class="viewport-actions">
          <button class="roar-control" data-action="roar" title="重播转头怒吼">${svg('rex', 15)}<span>转头怒吼</span></button>
          <button class="tour-control" data-action="tour" aria-label="自动导览" aria-pressed="false">${svg('play', 12)}<span>自动导览</span><i></i></button>
        </div>
        <svg class="label-leaders" aria-hidden="true">${Object.keys(SYSTEMS).map(id => `<path data-leader="${id}" hidden/>`).join('')}</svg>
        <div class="model-labels" aria-hidden="true">${Object.entries(SYSTEMS).map(([id, s]) => `<div class="part-label" data-label="${id}" hidden><i></i><span>${s.name}<small>${s.en}</small></span></div>`).join('')}</div>
        <div class="viewport-index" aria-hidden="true"><span class="index-line"></span>FIG. 001<span>TYRANNOSAURUS / MECHANICAL</span></div>
        <div class="camera-row"><div class="camera-tabs" role="group" aria-label="相机视角">${VIEWS.map(([id, name]) => `<button data-view="${id}" class="${id === 'hero' ? 'active' : ''}" aria-pressed="${id === 'hero'}">${name}</button>`).join('')}</div><span class="orbit-hint">${svg('orbit', 15)}<span>拖动旋转 · 滚轮缩放</span></span><button class="reset-button" data-action="reset" aria-label="恢复初始状态" title="恢复初始状态 · R">${svg('reset', 16)}</button></div>
        <div class="loading-overlay" id="loading" data-loading><span class="loading-icon">${svg('rex', 34)}</span><strong>正在唤醒机械生命</strong><span>预热材质与机械结构</span><div class="loading-track"><i></i></div></div>
      </section>
      <aside class="systems-panel">
        <div class="panel-heading"><h2>结构目录</h2><span>05 SYSTEMS</span></div>
        <div class="system-list">${Object.entries(SYSTEMS).map(([id, s], i) => `<button class="system-button" data-system="${id}" aria-pressed="false"><span class="system-no">${String(i + 1).padStart(2, '0')}</span>${svg(id, 21)}<span><strong>${s.name}</strong><small>${s.en}</small></span>${svg('arrow', 12)}</button>`).join('')}</div>
        <section class="detail-note" aria-live="polite"><span class="tiny-heading" id="detail-overline">ENGINEERED TO BE EXPLORED</span><h3 id="detail-title">从装甲，到骨架。</h3><p id="detail-copy">选择一套机械系统，进入特写。或者拖动模型，从你喜欢的角度开始。</p><span class="detail-tag" id="detail-tag">拖动旋转 / 点选观察</span></section>
        <section class="joint-monitor"><div class="panel-heading"><h2>关节监测</h2><span><i class="monitor-dot"></i> LIVE</span></div>
          ${[['jaw','下颌开合','MANDIBLE'],['hip','股节摆角','HIP'],['knee','膝关节角','KNEE']].map(([id, name, en]) => `<div class="joint-reading"><div><span>${name}<small>${en}</small></span><output id="angle-${id}">0.0<small>°</small></output></div><div class="reading-track"><i id="track-${id}"></i><b></b></div></div>`).join('')}
          <div class="phase-chart"><svg viewBox="0 0 210 44" preserveAspectRatio="none" aria-label="下颌张角随动作相位变化"><path class="chart-grid" d="M0 12h210M0 32h210M35 0v44m35-44v44m35-44v44m35-44v44m35-44v44"/><path class="chart-wave" d="${jawCurve}"/><path class="phase-cursor" id="phase-cursor" d="M0 2v40"/><circle id="phase-dot" r="2.8" cx="0" cy="38"/></svg><div><span>动作相位</span><output id="phase-value">000°</output></div></div>
        </section>
        <div class="systems-foot"><span class="status-indicator"></span><span id="render-status">结构初始化中</span><span id="fps-value"></span></div>
      </aside>
    </main>
    <footer class="control-deck">
      <div class="motion-control"><button class="transport-button" data-action="play" aria-label="暂停运动">${svg('pause', 19)}</button><div class="motion-meta"><strong id="motion-caption">机械生命 · 运转中</strong><span>ROAR CYCLE</span></div></div>
      <div class="speed-control"><label for="motion-speed">运动速度 <output id="speed-value">0.70×</output></label><input id="motion-speed" aria-label="运动速度" type="range" min="0.2" max="1.6" step="0.05" value="0.7"><div class="range-endpoints"><span>0.2×</span><span>1.6×</span></div></div>
      <div class="deck-divider"></div>
      <div class="explode-control"><div class="explode-label"><label for="explode-progress">${svg('layers', 15)} 拆解进度</label><output id="explode-value">000<span>%</span></output></div><input id="explode-progress" aria-label="拆解进度" type="range" min="0" max="1" step="0.01" value="0"><div class="explode-ticks"><span>完整装配</span><span>25</span><span>50</span><span>75</span><span>完全拆解</span></div></div>
      <div class="deck-caption"><span>NOT JUST A MACHINE.</span><strong>每一个细节，都值得靠近。</strong><small>BUILT WITH <a href="https://github.com/elvarofficial/teardown" target="_blank" rel="noreferrer">TEARDOWN ↗</a></small></div>
    </footer>
    <div class="rex-toast" role="status" aria-live="polite"></div>`;
  host.appendChild(shell);
  const $ = selector => shell.querySelector(selector);
  const $$ = selector => [...shell.querySelectorAll(selector)];
  const refs = {
    count: $('#part-count'), caption: $('#mode-caption'), motion: $('#motion-caption'),
    speed: $('#motion-speed'), speedValue: $('#speed-value'), explode: $('#explode-progress'), explodeValue: $('#explode-value'),
    title: $('#detail-title'), note: $('#detail-copy'), tag: $('#detail-tag'), overline: $('#detail-overline'),
    play: $('[data-action="play"]'), tour: $('[data-action="tour"]'), sound: $('[data-action="sound"]'),
    phase: $('#phase-value'), cursor: $('#phase-cursor'), dot: $('#phase-dot'), status: $('#render-status'),
    fps: $('#fps-value'), loading: $('#loading'), toast: $('.rex-toast'),
  };
  const actionMap = {
    play: 'togglePlay', roar: 'replayRoar', tour: 'toggleTour', reset: 'reset', capture: 'capture', fullscreen: 'fullscreen', sound: 'sound',
  };
  shell.addEventListener('click', e => {
    const mode = e.target.closest('[data-mode]');
    const system = e.target.closest('[data-system]');
    const view = e.target.closest('[data-view]');
    const action = e.target.closest('[data-action]');
    if (mode) callbacks.mode(mode.dataset.mode);
    if (system) callbacks.select(system.dataset.system);
    if (view) callbacks.camera(view.dataset.view);
    if (action) callbacks[actionMap[action.dataset.action]]?.();
  });
  refs.speed.addEventListener('input', () => callbacks.speed(Number(refs.speed.value)));
  refs.explode.addEventListener('input', () => callbacks.explode(Number(refs.explode.value)));
  let timer;
  let previousSelected;
  let previousPlaying, previousTour, previousSound;
  const setPressed = (el, active) => {
    el.classList.toggle('active', active);
    el.setAttribute('aria-pressed', String(active));
  };
  return {
    viewport: $('.rex-viewport'), canvasHost: $('.canvas-host'),
    update(state) {
      const {mode, selected, explode, speed, playing, tour, sound, view, phase, jawAngle, hipAngle, kneeAngle, fps, partCount, ready} = state;
      for (const el of $$('[data-mode]')) setPressed(el, el.dataset.mode === mode);
      for (const el of $$('[data-system]')) setPressed(el, el.dataset.system === selected);
      for (const el of $$('[data-view]')) setPressed(el, el.dataset.view === view);
      refs.count.textContent = partCount ? partCount.toLocaleString('en-US') : '—';
      refs.caption.textContent = selected ? SYSTEMS[selected].name : {assembled: '装配视图', exploded: '爆炸拆解', xray: '装甲透视'}[mode];
      if (document.activeElement !== refs.speed) refs.speed.value = speed;
      if (document.activeElement !== refs.explode) refs.explode.value = explode;
      refs.speed.style.setProperty('--range-value', `${(speed - .2) / 1.4 * 100}%`);
      refs.explode.style.setProperty('--range-value', `${explode * 100}%`);
      refs.speedValue.textContent = `${speed.toFixed(2)}×`;
      refs.explodeValue.innerHTML = `${Math.round(explode * 100).toString().padStart(3, '0')}<span>%</span>`;
      const roaring = playing && jawAngle > 40;
      let movement = '蓄势中';
      if (state.action === 'walk') movement = '行走中';
      else if (state.action === 'turn') movement = '掉头中';
      else if (roaring) movement = '怒吼中';
      else if (Math.abs(state.headYaw) > 15) movement = '转头中';
      refs.motion.textContent = `机械生命 · ${playing ? movement : '已暂停'}`;
      shell.classList.toggle('paused', !playing);
      if (previousPlaying !== playing) {
        refs.play.innerHTML = svg(playing ? 'pause' : 'play', 19);
        refs.play.setAttribute('aria-label', playing ? '暂停运动' : '继续运动');
        previousPlaying = playing;
      }
      if (previousTour !== tour) {
        refs.tour.querySelector('span').textContent = tour ? '停止导览' : '自动导览';
        refs.tour.setAttribute('aria-label', tour ? '停止导览' : '自动导览');
        setPressed(refs.tour, tour);
        previousTour = tour;
      }
      refs.tour.style.setProperty('--tour-progress', `${(state.tourProgress || 0) * 100}%`);
      if (previousSound !== sound) {
        refs.sound.innerHTML = svg(sound ? 'sound' : 'mute');
        refs.sound.setAttribute('aria-label', sound ? '关闭机械音效' : '开启机械音效');
        setPressed(refs.sound, sound);
        previousSound = sound;
      }
      if (previousSelected !== selected) {
        const info = SYSTEMS[selected];
        refs.overline.textContent = info?.en || 'ENGINEERED TO BE EXPLORED';
        refs.title.textContent = info?.name || '从装甲，到骨架。';
        refs.note.textContent = info?.note || '选择一套机械系统，进入特写。或者拖动模型，从你喜欢的角度开始。';
        refs.tag.textContent = info?.tag || '拖动旋转 / 点选观察';
        previousSelected = selected;
      }
      for (const [id, value, limit] of [['jaw', jawAngle, maxJawDegrees], ['hip', hipAngle, 70], ['knee', kneeAngle, 150]]) {
        $(`#angle-${id}`).innerHTML = `${Number(value || 0).toFixed(1)}<small>°</small>`;
        $(`#track-${id}`).style.width = `${Math.min(100, Math.abs(value || 0) / limit * 100)}%`;
      }
      const x = phase * 210, y = jawChartY(jawAngle * Math.PI / 180);
      refs.cursor.setAttribute('d', `M${x} 2v40`);
      refs.dot.setAttribute('cx', x); refs.dot.setAttribute('cy', y);
      refs.phase.textContent = `${Math.floor((phase || 0) * 360).toString().padStart(3, '0')}°`;
      refs.status.textContent = ready ? playing ? '运动学同步' : '姿态已锁定' : '结构初始化中';
      refs.fps.textContent = fps > 0 ? `${fps} FPS` : '';
    },
    setReady(immediate = false) {
      refs.loading.classList.add('is-ready');
      if (immediate) refs.loading.hidden = true;
      else setTimeout(() => { refs.loading.hidden = true; }, 450);
    },
    setError(message) { refs.loading.classList.add('load-error'); refs.loading.querySelector('strong').textContent = message; refs.loading.querySelector('.loading-track').hidden = true; },
    toast(message) {
      clearTimeout(timer); refs.toast.textContent = message; refs.toast.classList.add('show');
      timer = setTimeout(() => refs.toast.classList.remove('show'), 2800);
    },
    updateLabel(id, x, y, visible) {
      const el = $(`[data-label="${id}"]`);
      const leader = $(`[data-leader="${id}"]`);
      if (!el) return;
      el.hidden = !visible;
      leader.toggleAttribute('hidden', !visible);
      if (visible) {
        const w = $('.rex-viewport').clientWidth;
        const h = $('.rex-viewport').clientHeight;
        const [dx, dy] = {skull: [-76, -65], core: [83, -40], armor: [35, -73], legs: [82, 37], tail: [45, 52]}[id];
        const lx = Math.max(15, Math.min(w - 135, x + dx));
        const ly = Math.max(82, Math.min(h - 98, y + dy));
        el.style.left = `${lx}px`;
        el.style.top = `${ly}px`;
        el.classList.remove('label-left');
        leader.setAttribute('d', `M${x} ${y}L${lx - 8} ${ly}H${lx + 15}`);
      }
    },
  };
}
