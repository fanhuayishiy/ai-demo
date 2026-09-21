// 引擎：渲染器 / 场景 / 相机 / 后期 / 主循环
import * as THREE from 'three';
import { U } from './toon.js';
import { buildComposer } from './postfx.js';
import { createCameraRig } from './camera-rig.js';
import { setupLighting, skyEnvironment, backgroundTexture, syncSunToView, SUN_DIR } from './lighting.js';
import { ASM } from './style.js';

/**
 * 装配进度的分段权重（0..1 的绝对区间）：地图 → 资产 → LOD → 动效 → 首帧。
 * 集中放在这里，是因为写进度的一方（world / placement / motion）分属不同模块，
 * 散着写字面量迟早会在某次调整阶段后对不上，表现为进度条跳变或卡在半路。
 */
export const BOOT_PHASES = { map: [0.03, 0.30], assets: [0.30, 0.90], lod: 0.92, motion: [0.92, 0.98], weather: 0.99 };

export const VIEWS = {
  hero: { pos: [13.6, 5.4, 15.8], target: [-3.6, 1.9, 1.2] },
  store: { pos: [-4.4, 2.4, 13.6], target: [-6.8, 1.7, 2.2] },
  interior: { pos: [-6.2, 1.9, 11.0], target: [-7.6, 1.3, 1.0] },
  corner: { pos: [10.4, 3.6, 14.2], target: [-0.6, 1.5, 3.4] },
  // 车站机位要在店北侧的空地上：原来 pos 的 z=4.6 落在店铺轮廓内（store z -0.8..4.8），
  // 等于把相机塞进店里隔着后墙看站台。
  station: { pos: [-4.6, 2.3, -2.6], target: [-9.6, 0.9, -12.2] },
  crossing: { pos: [13.6, 5.2, -4.4], target: [5.4, 0.6, -12.6] },
  top: { pos: [1.0, 40.0, 14.0], target: [-1.0, -0.5, -1.0] },
  blossom: { pos: [-12.4, 3.4, 3.6], target: [-15.0, 3.0, -5.2] },
  vending: { pos: [-9.2, 1.6, 9.6], target: [-11.3, 1.1, 5.7] },
  bike: { pos: [-6.2, 1.6, -1.6], target: [-12.4, 0.5, -4.4] },
  tight: { pos: [-4.4, 1.35, 6.9], target: [-6.6, 1.15, 3.4] },
};

export function createEngine({ canvas, quality = {} } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    preserveDrawingBuffer: typeof location !== 'undefined' && location.search.includes('sample'),
  });
  /** 视口尺寸：兼容离屏 / 无窗口环境（innerWidth 为 0 时回退） */
  const viewSize = () => ({
    w: window.innerWidth || canvas.clientWidth || quality.width || 1280,
    h: window.innerHeight || canvas.clientHeight || quality.height || 720,
  });
  let { w: vw, h: vh } = viewSize();
  const dpr = Math.min(window.devicePixelRatio || 1, quality.pixelRatio ?? 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(vw, vh, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = quality.toneMapping ?? THREE.NeutralToneMapping;
  renderer.toneMappingExposure = quality.exposure ?? 0.94;
  renderer.shadowMap.enabled = true;
  // VSM 会在大平面接收者（路面・铺砖）上拉出「梳齿」状的漏光条纹，而且每帧要跑两次
  // 12 样本高斯。r186 已删除 PCFSoftShadowMap（设了会回退到 PCF 并打一条警告），
  // 软边交给贴图的接触影与 SMAA。
  renderer.shadowMap.type = quality.shadowType ?? THREE.PCFShadowMap;
  // 微缩场景：日光与几何基本静止，阴影贴图按需刷新（省去每帧整场景阴影 pass）
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  scene.name = 'diorama';
  const env = skyEnvironment(renderer);
  if (env) scene.environment = env;
  scene.background = backgroundTexture();
  scene.fog = new THREE.FogExp2(0xe9eef2, 0.0041);

  const camera = new THREE.PerspectiveCamera(quality.fov ?? 32, vw / vh, 0.12, 220);
  camera.position.set(...VIEWS.hero.pos);

  const light = setupLighting(scene, { quality });
  const rig = createCameraRig(camera, canvas, { target: VIEWS.hero.target });
  rig.place(VIEWS.hero.pos, VIEWS.hero.target);

  const fx = buildComposer(renderer, scene, camera, { size: { width: vw, height: vh }, dpr, quality });

  const updaters = [];
  const resizeSubs = [];
  let running = true;
  let frame = 0;
  let framesTotal = 0;
  let shadowTick = 999;
  let camStill = 0;
  let renderMs = 0;     // 累计花在 renderFrame() 里的毫秒（含 updaters）
  let booted = false;   // 世界装配完成后才允许重绘阴影（见 renderFrame 的闸门）
  const _camPos = new THREE.Vector3();
  const _camQuat = new THREE.Quaternion();
  let acc = 0;
  const stats = { fps: 60, calls: 0, tris: 0 };
  /**
   * 「这一帧提交了多少次」必须在**场景那次 render 结束的瞬间**取。
   * renderer.info 默认 autoReset=true，而 composer 每个 pass 都调一次 renderer.render，
   * 于是帧末读到的是最后一个全屏 quad 的 1 次提交 —— 看着是个合理数字，其实测的是别的东西
   * （右上角 HUD 第一版就这么理直气壮地显示过「1 draw」）。
   * 这里取的是场景 pass 的总数：不含后面 SMAA / 输出那 2–3 次全屏 quad，作为「画面里有多少东西要画」
   * 反而是更干净的口径。
   */
  let frameCalls = 0, frameTris = 0;
  const prevAfterRender = scene.onAfterRender;
  scene.onAfterRender = (r, s, c) => {
    frameCalls = r.info.render.calls;
    frameTris = r.info.render.triangles;
    if (prevAfterRender) prevAfterRender(r, s, c);
  };

  function onResize() {
    const { w, h } = viewSize();
    vw = w; vh = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    fx.composer.setSize(w, h);
    const px = renderer.getDrawingBufferSize(new THREE.Vector2());
    fx.edge.uniforms.uResolution.value.set(px.x, px.y);
    fx.dof.uniforms.uResolution.value.set(px.x, px.y);
    for (const f of resizeSubs) f(w, h);
  }
  window.addEventListener('resize', onResize);
  onResize();

  function renderFrame(dt) {
    // 累计「花在渲染上的墙钟时间」：装配期每次让出主线程，rAF 都可能插进一整帧，
    // 没有这个计数器就分不清「装配代码慢」还是「被渲染挤掉了」。
    const _t = performance.now();
    U.time.value += dt;
    rig.update(dt);
    syncSunToView(camera);

    // 景深：焦点锁定视线目标 —— 绕视时主体始终清晰，前后景柔化（移轴微缩感）
    const dist = camera.position.distanceTo(rig.controls.target);
    const f = fx.dof.uniforms;
    f.uFocus.value += (dist - f.uFocus.value) * Math.min(1, dt * 6);
    f.uNearFar.value.set(camera.near, camera.far);
    const g = fx.grade.uniforms;
    g.uTime.value = U.time.value;

    // 描边：投影信息随相机变化
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    fx.edge.uniforms.uProjInfo.value.set(1 / (tanHalf * camera.aspect), 1 / tanHalf);
    fx.edge.uniforms.uNearFar.value.set(camera.near, camera.far);
    fx.edge.uniforms.uStrength.value = THREE.MathUtils.clamp(1.12 - dist * 0.006, 0.42, 1.05) * (quality.edge ?? 1);
    fx.edge.uniforms.uLineWidth.value = dist < 6 ? 0.8 : 1.0;

    // 阴影只在「画面静止」后才重绘。日光方向固定、正交视锥罩住整块台座，
    // 唯一会动的投影物是花枝与吊幌子；拖动过程中每 0.45 s 重画一次整场景阴影，
    // 实测每 10 帧插入一个尖峰帧（draw calls 9.5k → 15k，多花 ~75 ms），
    // 表现就是「一闪一闪的一顿一顿」。松手后再补一次即可。
    // 阻尼是指数收敛的，永远差一点点 → 四元数要用点积容差判等，否则「静止」永远攒不出来
    const turned = 1 - Math.abs(camera.quaternion.dot(_camQuat)) > 1e-10;
    if (camera.position.distanceToSquared(_camPos) > 1e-9 || turned) {
      camStill = 0;
      _camPos.copy(camera.position);
      _camQuat.copy(camera.quaternion);
    } else {
      camStill += dt;
    }
    shadowTick += dt;
    // 装配期间（world 已挂上、动效还没注册完）不要重绘阴影：那时相机本来就是静止的，
    // 每让出一帧就会被塞进一次全场景阴影 pass（~1 s），启动墙钟里凭空多出 5-6 s。
    // booted 由 main.js 的 `engine.built = true` 翻起来（见下方 setter），随后立即补一次刷新。
    const refresh = camStill > 3 ? (quality.shadowRefresh ?? 0.45) * 5 : (quality.shadowRefresh ?? 0.45);
    if (booted && shadowTick > refresh && camStill > (quality.shadowSettle ?? 0.2)) {
      shadowTick = 0;                 // 注意不要清 camStill：清了它就永远攒不到「静止很久」
      renderer.shadowMap.needsUpdate = true;
    }
    for (const fn of updaters) fn(dt, U.time.value, { camera, scene, renderer, rig, dist });
    fx.composer.render(dt);

    frame++;
    framesTotal++;
    renderMs += performance.now() - _t;
    acc += dt;
    if (acc > 0.5) {
      stats.fps = frame / acc;
      frame = 0;
      acc = 0;
      stats.calls = frameCalls;
      stats.tris = frameTris;
    }
  }

  let raf = 0;
  let last = performance.now();
  // 装配期节流（?asm=）：见 style.js 的 ASM。世界建完之前每次 await 让出主线程，rAF 都会
  // 插进一整帧（实测 192 帧 / 3.1 s）。限到 ~8 fps 后 to built 从 7.9 s 降到 4.8 s，
  // 但「看到成品」的时间几乎没变（8.13 → 7.81 s）—— 那 3 s 是在分批灌 GPU，省不掉，只能挪。
  const bootGap = ASM === 'freeze' ? Infinity : ASM === 'full' ? 0 : 125;
  let lastBoot = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    const now = performance.now();
    // 前 2 帧照常渲染：那是天空底图，也是 ready 判据的来源，不能因为节流变成黑屏。
    // 注意不要更新 last：跳过帧不该把时间差算进下一帧的 dt
    if (!booted && bootGap && framesTotal >= 2 && now - lastBoot < bootGap) return;
    lastBoot = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    renderFrame(dt);
  }
  loop();

  const api = {
    THREE,
    renderer,
    scene,
    camera,
    rig,
    lights: light,
    fx,
    stats,
    sunDir: SUN_DIR,
    /**
     * 装配进度（0..1）：由 world / placement / motion 逐段写入，加载画面只读它。
     * 刻意做成真进度而不是假动画 —— 装配本身有 122 个资产、10 个地图层，
     * 每一段结束都能报一次，用户看到的推进是实际发生的推进。
     */
    progress: { v: 0, label: '启动引擎' },
    /** 记一段装配进度。单调不回退：各阶段并发推进时，进度条倒退比不走更刺眼。 */
    markProgress(v, label) {
      const p = api.progress;
      if (v != null) p.v = Math.max(p.v, Math.min(1, v));
      if (label) p.label = label;
    },
    onUpdate(fn) {
      updaters.push(fn);
      return fn;
    },
    onResize(fn) {
      resizeSubs.push(fn);
    },
    add(o) {
      scene.add(o);
      return o;
    },
    /** 让世界在下一帧重画一次阴影贴图（装配完成、或任何静止几何发生变化时调用） */
    markShadowsDirty() {
      shadowTick = 999;
      camStill = 999;
    },
    /**
     * 把动画时间钉到 t 秒并跑一遍所有 updater（dt=0，只重算姿态不推进状态）。
     * 存在的理由：摆动件合并必须证明「和 CPU 逐组转动是同一个姿态」，
     * 而 rAF 的 dt 是墙钟量来的，两次运行对不上 —— 钉住 t 之后两侧截图才能逐像素比。
     */
    setAnimTime(t) {
      U.time.value = t;
      syncSunToView(camera);
      for (const fn of updaters) fn(0, t, { camera, scene, renderer, rig, dist: camera.position.distanceTo(rig.controls.target) });
    },
    // main.js 用 `engine.built = true` 标记装配完成。它同时是阴影闸门的开关：
    // 装配期间相机本来就是静止的，若不挡住，每次让帧都会被塞进一次全场景阴影 pass。
    get built() {
      return booted;
    },
    set built(v) {
      booted = !!v;
      if (booted) { shadowTick = 999; camStill = 999; }
    },
    setView(name, { instant = true } = {}) {
      const v = VIEWS[name] || VIEWS.hero;
      rig.place(v.pos, v.target);
      return v;
    },
    resize(w, h) {
      if (w && h) { vw = w; vh = h; }
      onResize();
    },
    /**
     * 换档用：改渲染分辨率。
     * 必须走 onResize()，因为 composer / 边缘检测的 uResolution 都按绘制缓冲尺寸建，
     * 只调 setPixelRatio 会让 SMAA 与描边在旧分辨率上采样。
     */
    setPixelRatio(v) {
      renderer.setPixelRatio(v);
      onResize();
    },
    /** 换档用：重设日光阴影贴图尺寸，并丢掉已分配的旧贴图让它按新尺寸重建 */
    shadowMapSize(n) {
      if (!light.sun?.shadow) return;
      light.sun.shadow.mapSize.set(n, n);
      const m = light.sun.shadow.map;
      if (m) { m.dispose(); light.sun.shadow.map = null; }
      renderer.shadowMap.needsUpdate = true;
    },
    get ready() {
      return framesTotal > 2;
    },
    /** 到目前为止跑过多少帧、在帧上花了多少毫秒：区分「装配慢」与「被渲染挤占」 */
    get frames() {
      return framesTotal;
    },
    get renderMs() {
      return Math.round(renderMs);
    },
    step(dt = 1 / 60, n = 1) {
      for (let i = 0; i < n; i++) renderFrame(dt);
    },
    pause(v = true) {
      running = !v;
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener('resize', onResize);
      rig.dispose();
      fx.composer.dispose?.();
      renderer.dispose();
    },
  };
  return api;
}
