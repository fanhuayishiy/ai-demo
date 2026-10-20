/* =========================================================================
 *  Roadster 逃离收费站  —  three.js 小游戏
 *  梗来源：2026/10 特斯拉第二代 Roadster 搭载 SpaceX 冷气推进器，可空中悬浮，
 *          网友调侃「开特斯拉的人谁还过收费站，直接飞过去」。
 * ========================================================================= */
(function () {
  'use strict';

  var T = window.THREE;
  var loadingEl = document.getElementById('loading');
  if (!T) {
    if (loadingEl) loadingEl.innerHTML = '<div class="load-txt">three.js 加载失败，请检查 libs/three.min.js</div>';
    return;
  }

  /* ------------------------------------------------------------------ *
   *  配置
   * ------------------------------------------------------------------ */
  var CFG = {
    ROAD_HALF: 7.6,          // 路面半宽
    LANE_X: [-2.5, 2.5],     // 车道虚线位置
    LANE_CENTERS: [-5, 0, 5], // 左、中、右三条车道的固定中心
    LANE_CHANGE_TIME: 0.28,  // 相邻车道切换时间，途中平滑移动，最终停在车道中心
    TOLL_SPACING: 520,       // 初始几个收费站的间距（后续由 TOLL_GAP_* 随机）
    FIRST_TOLL: 240,         // 第一个收费站距离
    TOLL_COUNT: 4,           // 同时在场的收费站数量
    TOLL_DEPTH: 19,          // 收费站顶棚纵深
    ROOF_BOTTOM: 6.0,        // 顶棚底面高度
    ROOF_THICK: 1.8,         // 顶棚厚度
    CLEAR_ALT: 8.6,          // 安全通过所需车底高度
    MAX_ALT: 34,             // 超过即「飞过头」
    GRAVITY: 34,             // 重力加速度
    THRUST: 80,              // 推进净加速度（未扣重力）
    MAX_UP_V: 27,            // 最大上升速度
    BASE_SPEED: 38,          // 初速 (单位/秒)
    SPEED_STEP: 1.8,         // 每行驶一个初始站间距缓慢提高目标速度
    MAX_SPEED: 84,
    SCORE_PER_TOLL: 100,
    GAUGE_MAX: 36,

    /* 冷气（氮气）推进剂：飞越车辆可补充，贴近车顶奖励更多 */
    GAS_MAX: 100,            // 总装填量（%）
    GAS_BURN: 20,            // 每秒消耗（%）→ 满罐只有 5 秒总点火时间
    GAS_LOW: 25,             // 低量警戒线（%）

    /* 低空飞越返还：点火越晚、穿站越低，回收的冷气越多。
       门槛按实测标定 —— 跟着蓝色提示点火并抬到 9.3 时，穿站高度约 19；
       每延迟点火 80ms 约降低 1 个高度单位，压到 13 已是精细操作。 */
    GAS_REFUND_TIGHT: 5,     // 车底最低点 ≤ CLEAR_ALT + TIGHT_MARGIN
    GAS_REFUND_CLEAN: 2,     // ≤ CLEAR_ALT + CLEAN_MARGIN
    TIGHT_MARGIN: 4.4,       // → 13.0
    CLEAN_MARGIN: 8.4,       // → 17.0
    REFUND_SCORE: 4,         // 每返还 1% 冷气额外给的分

    /* 空中翻转（A71 姿态控制）—— 照发布会现场那套做：
       车身绕纵轴左右横滚整圈，10 个喷嘴边翻边配平，落地自己回正，不会歪着砸下来 */
    FLIP_DUR: 0.62,          // 一次 360° 空翻耗时（秒）
    FLIP_GAS: 5,             // 每次空翻消耗冷气（%），喷嘴配平也得烧气
    FLIP_MIN_ALT: 2.5,       // 离地低于这个高度翻不动
    FLIP_SCORE: 80,          // 每完成一次空翻的基础分
    FLIP_CHAIN: 0.5,         // 同一次腾空里第 n 次空翻 → 得分 ×(1 + 0.5(n-1))
    FLIP_AIR_BONUS: 60,      // 带着空翻飞越收费站，额外加分
    FLIP_DIR: -1,            // 横滚方向：-1 = 向右横滚（车顶朝镜头这边翻）
    FLIP_PIVOT: 0.70,        // 旋转轴心离车底的高度（车重中心大致在轮心上方）
    FLIP_FLOOR: 1.0,         // 横滚时喷嘴把车托在这个最低高度（侧翻到 90° 轮胎会低于车底 0.54）
    FLIP_GRAVITY: 0.45,      // 空翻期间喷嘴托着车身，重力只按 45% 生效

    /* 收费站间距：正常 480–640 随机，每 DOUBLE_EVERY 个间隔插一次「连站」。
       连站也至少留 420：最高速度 84 时中心间隔 5 秒，给越站后的下降、
       落地缓冲和下一次起飞留出空间，避免连续悬空才能过站。 */
    TOLL_GAP_MIN: 480,
    TOLL_GAP_MAX: 640,
    TOLL_GAP_DOUBLE: 420,
    DOUBLE_EVERY: 6,

    /* 路面车流：可变道绕行，也可飞越补气。
       贴近车顶飞越的补气量高于一次短跳消耗，支持持续续航。 */
    TRAFFIC_COUNT: 8,          // 玩家车道：要跳过去的车
    TRAFFIC_SIDE_COUNT: 12,    // 相邻两条车道的车辆
    TRAFFIC_SPEED_MIN: 8,      // 车流初始速度，随后随玩家速度逐渐提升
    TRAFFIC_SPEED_MAX: 13,
    TRAFFIC_GAP_START: 140,    // 开局车辆间距
    TRAFFIC_GAP_END: 140,      // 后期保持车距，给连续起落留出空间
    TRAFFIC_MARGIN: 0.8,       // 车顶以上再留这么高才算过
    TRAFFIC_TIGHT: 1.2,        // 贴地跳过：整段通过期间离车顶都不超过 1.2
    TRAFFIC_CLEAN: 3.0,
    TRAFFIC_SCORE: 40,         // 普通跳过
    TRAFFIC_SCORE_TIGHT: 60,   // 贴地跳过
    TRAFFIC_SCORE_HIGH: 25,    // 跳太高（不返气）
    TRAFFIC_REFUND_TIGHT: 10,
    TRAFFIC_REFUND_CLEAN: 7,
    TRAFFIC_REFUND_HIGH: 4,
    ROW_EVERY: 10,             // 每次生成有 1/10 概率「横停一排」
    ROW_SCORE: 150,
    ROW_REFUND: 12
  };
  CFG.ROOF_TOP = CFG.ROOF_BOTTOM + CFG.ROOF_THICK;
  CFG.HALF_DEPTH = CFG.TOLL_DEPTH / 2;
  var NET_THRUST = CFG.THRUST - CFG.GRAVITY;

  /* 到 CLEAR_ALT 所需的上升时间（数值积分，用于计算最佳点火距离） */
  function timeToAltitude(target) {
    var v = 0, y = 0, t = 0, dt = 0.002;
    while (y < target && t < 4) { v = Math.min(v + NET_THRUST * dt, CFG.MAX_UP_V); y += v * dt; t += dt; }
    return t;
  }
  var RISE_TIME = timeToAltitude(CFG.CLEAR_ALT);

  /* ------------------------------------------------------------------ *
   *  渲染器 / 场景 / 相机
   * ------------------------------------------------------------------ */
  var canvas = document.getElementById('scene');
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    if (loadingEl) loadingEl.innerHTML = '<div class="load-txt">当前浏览器不支持 WebGL，无法运行</div>';
    return;
  }
  var renderScale = 1, qualityTimer = 0, frameAverage = 1 / 60;
  function renderPixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 1.35,
      Math.sqrt(1400000 / Math.max(1, window.innerWidth * window.innerHeight))) * renderScale;
  }
  function updateRenderQuality(dt) {
    if (paused || document.hidden || state.mode !== 'playing') return;
    frameAverage += (Math.min(dt, 0.1) - frameAverage) * 0.04;
    qualityTimer += Math.min(dt, 0.1);
    if (qualityTimer < 2) return;
    qualityTimer = 0;
    var nextScale = renderScale;
    if (frameAverage > 0.026) nextScale = Math.max(0.65, renderScale - 0.12);
    else if (frameAverage < 0.018) nextScale = Math.min(1, renderScale + 0.04);
    if (nextScale !== renderScale) {
      renderScale = nextScale;
      renderer.setPixelRatio(renderPixelRatio());
    }
  }
  renderer.setPixelRatio(renderPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var HORIZON = 0xd6c0a1;                    // 傍晚暖色地平线，与雾色保持一致
  scene.fog = new T.Fog(0xffffff, 70, 470);
  scene.fog.color.setHex(HORIZON).convertSRGBToLinear();

  var camera = new T.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.6, 1600);
  camera.position.set(0, 6, 14);

  /* ---------------- 天空 ---------------- */
  var skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      cTop: { value: new T.Color(0x1b5c98) },
      cMid: { value: new T.Color(HORIZON) },
      cBot: { value: new T.Color(0xe2be94) }
    },
    vertexShader:
      'varying vec3 vP;' +
      'void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader:
      'uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot; varying vec3 vP;' +
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
      'float noise(vec2 p){' +
      '  vec2 i = floor(p), f = fract(p);' +
      '  f = f * f * (3.0 - 2.0 * f);' +
      '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),' +
      '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);' +
      '}' +
      'void main(){' +
      '  vec3 d = normalize(vP);' +
      '  float h = d.y;' +
      '  vec3 c = h > 0.0 ? mix(cMid, cTop, pow(h, 0.42)) : mix(cMid, cBot, pow(-h, 0.42));' +
      /* 淡淡的云层：三层噪声叠出大团块，靠近地平线淡出，避免规则条带 */
      '  if (h > 0.015) {' +
      '    vec2 uv = d.xz / (h + 0.22) * 1.35;' +
      '    float n = noise(uv) * 0.55 + noise(uv * 2.4) * 0.30 + noise(uv * 5.3) * 0.15;' +
      '    float cl = smoothstep(0.52, 0.86, n) * smoothstep(0.015, 0.30, h);' +
      '    c = mix(c, vec3(1.0, 0.94, 0.84), cl * 0.38);' +
      '  }' +
      '  float sun = max(0.0, dot(d, normalize(vec3(0.48, 0.24, -0.84))));' +
      '  c += vec3(1.0, 0.62, 0.26) * pow(sun, 48.0) * 0.20;' +
      '  c = mix(c, vec3(1.0, 0.89, 0.64), smoothstep(0.9993, 0.9998, sun));' +
      '  gl_FragColor = vec4(c, 1.0);' +
      '}'
  });
  var sky = new T.Mesh(new T.SphereGeometry(60, 32, 16), skyMat);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  scene.add(sky);

  /* ---------------- 环境反射贴图（让金属/玻璃有反射，否则 metalness 高的材质会发黑） ---------------- */
  (function buildEnvironment() {
    try {
      var faces = [], size = 64;
      for (var i = 0; i < 6; i++) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = size;
        var g = cv.getContext('2d');
        var grd = g.createLinearGradient(0, 0, 0, size);
        grd.addColorStop(0.00, '#e6f2ff');
        grd.addColorStop(0.42, '#a9cce9');
        grd.addColorStop(0.50, '#93ab8c');
        grd.addColorStop(1.00, '#3d4c2d');
        g.fillStyle = grd;
        g.fillRect(0, 0, size, size);
        if (i === 2) {                                   // +Y：太阳
          var rg = g.createRadialGradient(size * 0.5, size * 0.28, 1, size * 0.5, size * 0.28, size * 0.34);
          rg.addColorStop(0, 'rgba(255,255,245,1)');
          rg.addColorStop(1, 'rgba(255,255,245,0)');
          g.fillStyle = rg;
          g.fillRect(0, 0, size, size);
        }
        faces.push(cv);
      }
      var cube = new T.CubeTexture(faces);
      cube.needsUpdate = true;
      cube.encoding = T.sRGBEncoding;

      var pmrem = new T.PMREMGenerator(renderer);
      if (pmrem.compileCubemapShader) pmrem.compileCubemapShader();
      var rt = pmrem.fromCubemap(cube);
      scene.environment = rt.texture;
      pmrem.dispose();
      cube.dispose();
    } catch (e) {
      /* 环境贴图失败不影响游戏运行 */
    }
  })();

  /* ---------------- 灯光 ---------------- */
  /* 半球光：天空色不能用纯蓝（0xdcefff 会把银漆染成青灰），
     地面色不能用橄榄绿（0x5b6052 会在车身下缘染绿）。
     官方渲染是暖银灰，这里天空取近白微暖、地面取中性灰。 */
  scene.add(new T.HemisphereLight(0xd4e4f3, 0x736750, 0.50));

  var sun = new T.DirectionalLight(0xffd5a2, 0.92);
  sun.position.set(55, 70, -95);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 320;
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);

  /* ------------------------------------------------------------------ *
   *  地面 / 公路
   * ------------------------------------------------------------------ */
  var GROUND_LEN = 1400;

  /* ---------------- 程序化地表纹理 ----------------
     纯色平面在远景会读成一块塑料板：加一层斑驳噪声后近处有草皮/沥青颗粒，
     远处被雾吃掉也不会显脏。纹理随世界滚动（见 updateWorldRecycle 里的 offset），
     否则平面跟着车走会像传送带。 */
  function makeGrassTex() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    g.fillStyle = '#606449'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 3400; i++) {
      var x = Math.random() * 256, y = Math.random() * 256;
      var r = 1 + Math.random() * 3.2;
      g.fillStyle = Math.random() < 0.55
        ? 'rgba(58,80,44,' + (0.10 + Math.random() * 0.22).toFixed(3) + ')'
        : 'rgba(126,152,94,' + (0.06 + Math.random() * 0.16).toFixed(3) + ')';
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    for (var j = 0; j < 30; j++) {          /* 几缕干草/浅色条纹，避免过于均匀 */
      g.strokeStyle = 'rgba(140,158,104,' + (0.04 + Math.random() * 0.07).toFixed(3) + ')';
      g.lineWidth = 1 + Math.random() * 2.4;
      g.beginPath();
      var sx = Math.random() * 256, sy = Math.random() * 256;
      g.moveTo(sx, sy);
      g.lineTo(sx + (Math.random() - 0.5) * 96, sy + (Math.random() - 0.5) * 96);
      g.stroke();
    }
    var t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(1700 / 16, GROUND_LEN / 16);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  function makeAsphaltTex() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    g.fillStyle = '#2b323c'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 5200; i++) {
      var x = Math.random() * 256, y = Math.random() * 256;
      g.fillStyle = Math.random() < 0.62
        ? 'rgba(26,29,34,' + (0.10 + Math.random() * 0.20).toFixed(3) + ')'
        : 'rgba(96,102,112,' + (0.05 + Math.random() * 0.13).toFixed(3) + ')';
      g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    var t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(4, GROUND_LEN / 8);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  var grassTex = makeGrassTex(), asphaltTex = makeAsphaltTex();

  var grass = new T.Mesh(
    new T.PlaneGeometry(1700, GROUND_LEN),
    new T.MeshStandardMaterial({ color: 0xffffff, map: grassTex, roughness: 1, metalness: 0 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.04;
  scene.add(grass);

  var road = new T.Mesh(
    new T.PlaneGeometry(CFG.ROAD_HALF * 2, GROUND_LEN),
    new T.MeshStandardMaterial({ color: 0xffffff, map: asphaltTex, roughness: 0.94, metalness: 0.02 })
  );
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  scene.add(road);

  /* 路肩（略浅的水泥带） */
  var shoulderMat = new T.MeshStandardMaterial({ color: 0x6b7079, roughness: 0.95 });
  var shoulders = [-1, 1].map(function (s) {
    var m = new T.Mesh(new T.PlaneGeometry(1.6, GROUND_LEN), shoulderMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(s * (CFG.ROAD_HALF + 0.8), 0.004, 0);
    scene.add(m);
    return m;
  });

  /* 边缘实线 */
  var edgeMat = new T.MeshStandardMaterial({ color: 0xeef3f8, roughness: 0.72 });
  var edgeLines = [-1, 1].map(function (s) {
    var m = new T.Mesh(new T.PlaneGeometry(0.34, GROUND_LEN), edgeMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(s * CFG.ROAD_HALF, 0.014, 0);
    scene.add(m);
    return m;
  });

  /* 车道虚线（实例化） */
  var DASH_N = 64, DASH_GAP = 11, DASH_SPAN = DASH_N * DASH_GAP;
  var dashGeo = new T.PlaneGeometry(0.30, 4.6);
  dashGeo.rotateX(-Math.PI / 2);
  var dashIM = new T.InstancedMesh(
    dashGeo,
    new T.MeshStandardMaterial({ color: 0xe6ecf3, roughness: 0.75 }),
    DASH_N * 2
  );
  dashIM.frustumCulled = false;
  scene.add(dashIM);
  var dashZ = new Float32Array(DASH_N);
  for (var di = 0; di < DASH_N; di++) dashZ[di] = 30 - di * DASH_GAP;

  /* 护栏（长条 + 实例化立柱） */
  var railMat = new T.MeshStandardMaterial({ color: 0xb8c0c9, roughness: 0.45, metalness: 0.75 });
  var rails = [-1, 1].map(function (s) {
    var m = new T.Mesh(new T.BoxGeometry(0.16, 0.34, GROUND_LEN), railMat);
    m.position.set(s * (CFG.ROAD_HALF + 2.0), 0.82, 0);
    m.castShadow = true;
    scene.add(m);
    return m;
  });

  var POST_N = 46, POST_GAP = 12, POST_SPAN = POST_N * POST_GAP;
  var postGeo = new T.BoxGeometry(0.14, 0.9, 0.14);
  var postIM = new T.InstancedMesh(postGeo, new T.MeshStandardMaterial({ color: 0x8b939c, roughness: 0.6, metalness: 0.5 }), POST_N * 2);
  postIM.frustumCulled = false;
  scene.add(postIM);
  var postZ = new Float32Array(POST_N);
  for (var pi = 0; pi < POST_N; pi++) postZ[pi] = 30 - pi * POST_GAP;

  /* 路灯 */
  var POLE_N = 16, POLE_GAP = 55, POLE_SPAN = POLE_N * POLE_GAP;
  var poleIM = new T.InstancedMesh(
    new T.CylinderGeometry(0.12, 0.16, 8.4, 8),
    new T.MeshStandardMaterial({ color: 0x7f878f, roughness: 0.5, metalness: 0.7 }),
    POLE_N * 2
  );
  poleIM.frustumCulled = false;
  scene.add(poleIM);
  var lampIM = new T.InstancedMesh(
    new T.BoxGeometry(0.7, 0.18, 1.9),
    new T.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd88a, emissiveIntensity: 0.9, roughness: 0.4 }),
    POLE_N * 2
  );
  lampIM.frustumCulled = false;
  scene.add(lampIM);
  var poleZ = new Float32Array(POLE_N);
  for (var qi = 0; qi < POLE_N; qi++) poleZ[qi] = 30 - qi * POLE_GAP;

  /* 远处树丛（低矮灌木球，不是尖锥——尖锥在远景会读成"圣诞树"） */
  var TREE_N = 40, TREE_SPAN = 900;
  var treeIM = new T.InstancedMesh(
    new T.SphereGeometry(1, 8, 5),
    new T.MeshStandardMaterial({ color: 0x455440, roughness: 1 }),
    TREE_N
  );
  treeIM.frustumCulled = false;
  scene.add(treeIM);
  var treeZ = new Float32Array(TREE_N), treeX = new Float32Array(TREE_N);
  for (var ti = 0; ti < TREE_N; ti++) {
    treeZ[ti] = 20 - (ti % 20) * 46;
    treeX[ti] = (ti % 2 === 0 ? -1 : 1) * (38 + ((ti * 7) % 50));
  }

  /* 远景丘陵带：沿公路两侧铺到 400 m 外，在地平线附近形成起伏的深绿轮廓。
     原来草地平面直接切到天空是一条硬边，远处读起来像纸片。
     用压扁的球（只露出上半）叠成连绵山脊，比一排尖锥自然得多 */
  var TL_N = 220, TL_SPAN = 1100;
  var tlIM = new T.InstancedMesh(
    new T.SphereGeometry(1, 7, 4),
    new T.MeshStandardMaterial({ color: 0x626b65, roughness: 1 }),
    TL_N
  );
  tlIM.frustumCulled = false;
  scene.add(tlIM);
  var tlZ = new Float32Array(TL_N), tlX = new Float32Array(TL_N),
    tlH = new Float32Array(TL_N), tlW = new Float32Array(TL_N);
  for (var li = 0; li < TL_N; li++) {
    tlZ[li] = 90 - (li % 70) * 15.5;
    var sd = li % 2 === 0 ? -1 : 1;
    tlX[li] = sd * (120 + ((li * 37) % 260));
    tlH[li] = 5.0 + ((li * 13) % 5) * 1.6;
    tlW[li] = 22 + ((li * 7) % 7) * 7;
  }

  /* ------------------------------------------------------------------ *
   *  收费站
   * ------------------------------------------------------------------ */
  function makeSignTexture() {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 256;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#12457a');
    grd.addColorStop(1, '#08213c');
    g.fillStyle = grd; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = '#5fd8ff'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
    g.fillStyle = '#ffffff';
    g.font = 'bold 116px "Microsoft YaHei","PingFang SC",sans-serif';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('收费站', 68, 132);
    g.fillStyle = '#5fd8ff';
    g.font = 'bold 82px Arial,Helvetica,sans-serif';
    g.textAlign = 'right';
    g.fillText('TOLL', 958, 136);
    var tex = new T.CanvasTexture(cv);
    tex.anisotropy = 8;
    tex.encoding = T.sRGBEncoding;
    return tex;
  }
  var signTex = makeSignTexture();

  var concreteMat = new T.MeshStandardMaterial({ color: 0xb6bcc4, roughness: 0.92, metalness: 0.02 });
  var canopyMat = new T.MeshStandardMaterial({ color: 0x24354f, roughness: 0.6, metalness: 0.25 });
  var steelMat = new T.MeshStandardMaterial({ color: 0x99a3ae, roughness: 0.38, metalness: 0.85 });
  var glassMat = new T.MeshStandardMaterial({ color: 0x1d2b3c, roughness: 0.12, metalness: 0.7 });
  var boothMat = new T.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.7 });
  var warnMat = new T.MeshStandardMaterial({ color: 0xe23c3c, roughness: 0.7 });
  var warnMat2 = new T.MeshStandardMaterial({ color: 0xf3f5f8, roughness: 0.7 });

  function buildToll() {
    var g = new T.Group();

    /* 立柱 */
    [-1, 1].forEach(function (s) {
      var p = new T.Mesh(new T.BoxGeometry(1.5, CFG.ROOF_BOTTOM, 2.4), concreteMat);
      p.position.set(s * 9.4, CFG.ROOF_BOTTOM / 2, 0);
      p.castShadow = true; p.receiveShadow = true;
      g.add(p);

      /* 防撞警示条 */
      for (var k = 0; k < 4; k++) {
        var st = new T.Mesh(new T.BoxGeometry(1.56, 0.28, 2.46), k % 2 === 0 ? warnMat : warnMat2);
        st.position.set(s * 9.4, 0.5 + k * 0.62, 0);
        g.add(st);
      }
    });

    /* 顶棚 */
    var roof = new T.Mesh(new T.BoxGeometry(22, CFG.ROOF_THICK, CFG.TOLL_DEPTH), canopyMat);
    roof.position.set(0, CFG.ROOF_BOTTOM + CFG.ROOF_THICK / 2, 0);
    roof.castShadow = true;
    g.add(roof);

    /* 顶棚包边（只在四周露出一圈金属边，不要盖住深色顶面） */
    var fascia = new T.Mesh(new T.BoxGeometry(22.5, 0.34, CFG.TOLL_DEPTH + 0.5), steelMat);
    fascia.position.set(0, CFG.ROOF_TOP - 0.24, 0);
    g.add(fascia);

    /* 正面 / 背面招牌 */
    var signMat = new T.MeshBasicMaterial({ map: signTex, transparent: false });
    var s1 = new T.Mesh(new T.PlaneGeometry(9, 2.25), signMat);
    s1.position.set(0, CFG.ROOF_BOTTOM + CFG.ROOF_THICK / 2, CFG.TOLL_DEPTH / 2 + 0.06);
    g.add(s1);
    var s2 = s1.clone();
    s2.position.z = -s1.position.z;
    s2.rotation.y = Math.PI;
    g.add(s2);

    /* 岗亭 */
    [-1, 1].forEach(function (s) {
      var booth = new T.Group();
      var base = new T.Mesh(new T.BoxGeometry(2.5, 2.9, 3.4), boothMat);
      base.position.y = 1.45; base.castShadow = true;
      booth.add(base);
      var win = new T.Mesh(new T.BoxGeometry(2.6, 1.2, 2.3), glassMat);
      win.position.y = 1.95;
      booth.add(win);
      var br = new T.Mesh(new T.BoxGeometry(3.1, 0.22, 4.0), canopyMat);
      br.position.y = 3.0;
      br.castShadow = true;
      booth.add(br);
      booth.position.set(s * 5.4, 0, 0);
      g.add(booth);
    });

    /* 栏杆（红白相间，横跨路面，放在收费站最前沿 —— 地面冲过去就是撞这里） */
    var armY = 1.0;
    var armZ = CFG.HALF_DEPTH - 2.2;
    var segW = 15.2 / 12;
    for (var a = 0; a < 12; a++) {
      var seg = new T.Mesh(new T.BoxGeometry(segW, 0.26, 0.20), a % 2 === 0 ? warnMat : warnMat2);
      seg.position.set(-7.6 + segW * 0.5 + a * segW, armY, armZ);
      g.add(seg);
    }
    [-1, 1].forEach(function (s) {
      var post = new T.Mesh(new T.BoxGeometry(0.34, 1.5, 0.34), steelMat);
      post.position.set(s * 7.9, 0.75, armZ);
      post.castShadow = true;
      g.add(post);
    });

    /* 顶棚下照明 */
    for (var i = -2; i <= 2; i++) {
      var lamp = new T.Mesh(new T.BoxGeometry(1.5, 0.1, 0.5),
        new T.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xffe6a8, emissiveIntensity: 1.2 }));
      lamp.position.set(i * 3.6, CFG.ROOF_BOTTOM - 0.06, 0);
      g.add(lamp);
    }

    g.userData.passed = false;
    g.userData.minAlt = Infinity;
    return g;
  }

  var tolls = [];
  for (var ti2 = 0; ti2 < CFG.TOLL_COUNT; ti2++) {
    var tl = buildToll();
    tl.position.z = -(CFG.FIRST_TOLL + ti2 * CFG.TOLL_SPACING);
    scene.add(tl);
    tolls.push(tl);
  }

  /* 间距生成器：正常 480–640 随机，连站 420–434，保留落地窗口 */
  var gapCount = 0;
  function nextTollGap() {
    gapCount++;
    if (gapCount % CFG.DOUBLE_EVERY === 0) return CFG.TOLL_GAP_DOUBLE + Math.random() * 14;
    return CFG.TOLL_GAP_MIN + Math.random() * (CFG.TOLL_GAP_MAX - CFG.TOLL_GAP_MIN);
  }

  /* ------------------------------------------------------------------ *
   *  路面车流（同向慢车）
   *  中间和相邻车道均可绕行或飞越，横停一排时需要起飞。
   * ------------------------------------------------------------------ */
  var CAR_PAINT = [0xf2f4f6, 0xd8dde3, 0xb43a48, 0x2f6b96, 0xc9d0d8, 0x4a8f68, 0xe8d9a8, 0x9aa4b0, 0xdfe6ee, 0x8a5a3c];
  /* 场景末尾统一做过 sRGB→linear，之后换色也必须用线性值，否则车身会发白 */
  var CAR_PAINT_LINEAR = CAR_PAINT.map(function (hex) { return new T.Color(hex).convertSRGBToLinear(); });
  var ROW_X = CFG.LANE_CENTERS;   // 三条车道各停一辆，必须飞越

  function buildTrafficCar(kind) {
    var g = new T.Group();
    var paint = new T.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.38, metalness: 0.6 });
    var dark = new T.MeshStandardMaterial({ color: 0x16191e, roughness: 0.9, metalness: 0.05 });
    var glass = new T.MeshStandardMaterial({ color: 0x33465c, roughness: 0.12, metalness: 0.65 });
    var tail = new T.MeshStandardMaterial({ color: 0x7e0d14, emissive: 0xff2433, emissiveIntensity: 1.5 });

    var W, L, bodyH, cabH, cabW, cabL, cabZ;
    if (kind === 1) {          /* SUV */
      W = 1.96; L = 4.7; bodyH = 0.78; cabH = 0.66; cabW = 1.72; cabL = 2.7; cabZ = 0.2;
    } else if (kind === 2) {   /* 皮卡 */
      W = 1.98; L = 5.0; bodyH = 0.74; cabH = 0.72; cabW = 1.76; cabL = 2.0; cabZ = -0.5;
    } else {                   /* 轿车 */
      W = 1.86; L = 4.4; bodyH = 0.66; cabH = 0.52; cabW = 1.6; cabL = 2.1; cabZ = 0.15;
    }
    var base = 0.42;
    var h = base + bodyH + cabH;

    /* 四圈截面形成车头、车尾倒角，兼容项目的精简 three.js */
    var profile = [
      [-W/2+0.12,base], [W/2-0.12,base], [W/2,base+bodyH-0.15],
      [W/2-0.12,base+bodyH], [-W/2+0.12,base+bodyH], [-W/2,base+bodyH-0.15]
    ];
    var bodyVertices = [], bodyIndices = [];
    var sections = [-L/2, -L/2+0.1, L/2-0.1, L/2];
    for (var section = 0; section < 4; section++) {
      var inset = section === 0 || section === 3 ? 0.94 : 1;
      for (var point = 0; point < 6; point++) {
        bodyVertices.push(profile[point][0]*inset,
          base+bodyH/2+(profile[point][1]-base-bodyH/2)*inset, sections[section]);
      }
      if (section < 3) {
        for (var edge = 0; edge < 6; edge++) {
          var a = section*6+edge, b = section*6+(edge+1)%6;
          bodyIndices.push(a,b,b+6, a,b+6,a+6);
        }
      }
    }
    for (var cap = 1; cap < 5; cap++) bodyIndices.push(0,cap+1,cap,18,18+cap,19+cap);
    var bodyGeo = new T.BufferGeometry();
    bodyGeo.setAttribute('position', new T.Float32BufferAttribute(bodyVertices,3));
    bodyGeo.setIndex(bodyIndices);
    bodyGeo = bodyGeo.toNonIndexed();
    bodyGeo.computeVertexNormals();
    var body = new T.Mesh(bodyGeo, paint);
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    var y0 = base + bodyH - 0.02, y1 = base + bodyH + cabH - 0.05;
    var z0 = cabZ - cabL / 2, z1 = cabZ + cabL / 2;
    var topW = cabW * 0.88;
    var frontSlope = kind === 0 ? 0.43 : 0.28;
    var rearSlope = kind === 0 ? 0.34 : 0.14;
    var cabinGeo = new T.BufferGeometry();
    cabinGeo.setAttribute('position', new T.Float32BufferAttribute([
      -cabW/2,y0,z0, cabW/2,y0,z0, cabW/2,y0,z1, -cabW/2,y0,z1,
      -topW/2,y1,z0+frontSlope, topW/2,y1,z0+frontSlope,
      topW/2,y1,z1-rearSlope, -topW/2,y1,z1-rearSlope
    ], 3));
    cabinGeo.setIndex([0,4,5,0,5,1, 1,5,6,1,6,2, 2,6,7,2,7,3, 3,7,4,3,4,0, 4,7,6,4,6,5]);
    cabinGeo.computeVertexNormals();
    glass.side = T.DoubleSide;
    var cabin = new T.Mesh(cabinGeo, glass);
    cabin.castShadow = true;
    g.add(cabin);

    var roofL = cabL - frontSlope - rearSlope;
    var roof = new T.Mesh(new T.BoxGeometry(topW + 0.05, 0.06, roofL + 0.06), paint);
    roof.position.set(0, y1 + 0.03, cabZ + (frontSlope - rearSlope) / 2);
    g.add(roof);

    var alloy = new T.MeshStandardMaterial({ color: 0x9ba5b1, roughness: 0.26, metalness: 0.85 });
    var plate = new T.MeshStandardMaterial({ color: 0x2e69a8, roughness: 0.45, metalness: 0.2 });
    var headlamp = new T.MeshStandardMaterial({ color: 0xe7f2ff, emissive: 0xc5deff, emissiveIntensity: 0.7 });
    function detail(name, w, hh, depth, x, y, z, material) {
      var mesh = new T.Mesh(new T.BoxGeometry(w, hh, depth), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    }
    function pillar(x0, yy0, zz0, x1, yy1, zz1, material, radius) {
      var a = new T.Vector3(x0, yy0, zz0), b = new T.Vector3(x1, yy1, zz1);
      var mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, a.distanceTo(b), 6), material);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
      g.add(mesh);
    }
    [-1, 1].forEach(function (sx) {
      pillar(sx*cabW/2,y0,z0, sx*topW/2,y1,z0+frontSlope,paint,0.045);
      pillar(sx*cabW/2,y0,z1, sx*topW/2,y1,z1-rearSlope,paint,0.055);
      pillar(sx*cabW/2,y0,cabZ, sx*topW/2,y1,cabZ,dark,0.045);
      detail('window-sill', 0.045, 0.055, cabL, sx*cabW/2, y0, cabZ, alloy);
      detail('side-skirt', 0.065, 0.12, L-1.0, sx*(W/2-0.04), base+0.04, 0, dark);
      detail('door-handle', 0.045, 0.045, 0.21, sx*(W/2-0.065), base+bodyH*0.77, cabZ+0.24, alloy);
      detail('mirror-arm', 0.16, 0.045, 0.05, sx*(W/2+0.015), y0+0.13, z0+0.24, dark);
      detail(sx < 0 ? 'mirror-left' : 'mirror-right', 0.18, 0.13, 0.23, sx*(W/2+0.13), y0+0.16, z0+0.24, paint);
      detail('mirror-glass', 0.14, 0.085, 0.012, sx*(W/2+0.13), y0+0.16, z0+0.362, alloy);
      pillar(sx*(W/2-0.05),base+0.17,cabZ, sx*(W/2-0.06),y0-0.08,cabZ,dark,0.008);
      detail('headlight', 0.4, 0.12, 0.075, sx*(W/2-0.36), base+bodyH*0.73, -L/2-0.015, headlamp);
    });
    detail('front-grille', W*0.44, 0.22, 0.065, 0, base+bodyH*0.4, -L/2-0.02, dark);
    for (var grilleRow = 0; grilleRow < 3; grilleRow++) {
      detail('grille-slat', W*0.42, 0.018, 0.015, 0, base+bodyH*0.29+grilleRow*0.065, -L/2-0.06, alloy);
    }
    detail('front-bumper', W*0.85, 0.09, 0.08, 0, base+0.1, -L/2, dark);
    detail('rear-bumper', W*0.87, 0.12, 0.08, 0, base+0.1, L/2, dark);
    detail('rear-plate', 0.42, 0.16, 0.025, 0, base+bodyH*0.46, L/2+0.052, plate);
    for (var letter = 0; letter < 6; letter++) {
      detail('plate-letter', 0.025, 0.075, 0.008, -0.14+letter*0.055, base+bodyH*0.46, L/2+0.069, headlamp);
    }
    detail('rear-badge', 0.13, 0.045, 0.018, 0, base+bodyH*0.84, L/2+0.045, alloy);
    if (kind === 1) {
      [-1, 1].forEach(function (sx) {
        detail('roof-rail', 0.055, 0.035, roofL*0.85, sx*topW*0.39, y1+0.065, cabZ+(frontSlope-rearSlope)/2, alloy);
      });
    }

    /* 皮卡：车厢两侧的斗壁 + 尾门，不然远看就是一块平板 */
    if (kind === 2) {
      var bedZ0 = cabZ + cabL / 2 + 0.05, bedZ1 = L / 2 - 0.06;
      var bedLen = bedZ1 - bedZ0, bedMid = (bedZ0 + bedZ1) / 2;
      [-1, 1].forEach(function (sx) {
        var wall = new T.Mesh(new T.BoxGeometry(0.12, 0.34, bedLen), paint);
        wall.position.set(sx * (W / 2 - 0.06), base + bodyH + 0.17, bedMid);
        g.add(wall);
      });
      var gate = new T.Mesh(new T.BoxGeometry(W - 0.1, 0.34, 0.1), paint);
      gate.position.set(0, base + bodyH + 0.17, bedZ1);
      g.add(gate);
    }

    var wheelGeo = new T.CylinderGeometry(0.36, 0.36, 0.26, 24);
    var wheels = [];
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        var wheel = new T.Group();
        wheel.position.set(sx * (W / 2 - 0.05), 0.36, sz * (L / 2 - 1.0));
        var w = new T.Mesh(wheelGeo, dark);
        w.rotation.z = Math.PI / 2;
        wheel.add(w);
        var rim = new T.Mesh(new T.CylinderGeometry(0.255, 0.255, 0.018, 24), alloy);
        rim.rotation.z = Math.PI / 2;
        rim.position.x = sx*0.139;
        wheel.add(rim);
        var inset = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.022, 20), dark);
        inset.rotation.z = Math.PI/2;
        inset.position.x = sx*0.15;
        wheel.add(inset);
        for (var spoke = 0; spoke < 5; spoke++) {
          var angle = spoke*Math.PI*2/5;
          var spokeMesh = new T.Mesh(new T.BoxGeometry(0.025, 0.36, 0.045), alloy);
          spokeMesh.position.x = sx*0.17;
          spokeMesh.rotation.x = angle;
          wheel.add(spokeMesh);
        }
        var hub = new T.Mesh(new T.CylinderGeometry(0.075,0.075,0.035,12), alloy);
        hub.rotation.z = Math.PI/2; hub.position.x = sx*0.18;
        wheel.add(hub);
        g.add(wheel); wheels.push(wheel);
      });
    });

    /* 尾灯：远处先看到的就是这两点红光 */
    [-1, 1].forEach(function (sx) {
      var t = new T.Mesh(new T.BoxGeometry(0.46, 0.15, 0.07), tail);
      t.position.set(sx * (W / 2 - 0.36), base + bodyH * 0.62, L / 2 + 0.02);
      g.add(t);
    });

    /* 同材质零件合并提交，轮子单独保留旋转，避免细节增多拖慢车流渲染。 */
    function mergeParts(parent) {
      var batches = new Map();
      parent.updateMatrixWorld(true);
      parent.children.slice().forEach(function (part) {
        if (!part.isMesh || /^(front-grille|rear-plate|mirror-left|mirror-right)$/.test(part.name)) return;
        if (!batches.has(part.material)) batches.set(part.material, []);
        batches.get(part.material).push(part);
      });
      batches.forEach(function (parts, material) {
        if (parts.length < 2) return;
        var positions = [], normals = [];
        parts.forEach(function (part) {
          var geo = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
          geo.applyMatrix4(part.matrix);
          var pos = geo.getAttribute('position'), normal = geo.getAttribute('normal');
          for (var n = 0; n < pos.array.length; n++) {
            positions.push(pos.array[n]); normals.push(normal.array[n]);
          }
          geo.dispose();
          parent.remove(part);
        });
        var geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
        var combined = new T.Mesh(geometry, material);
        combined.castShadow = true; combined.receiveShadow = true;
        parent.add(combined);
      });
    }
    wheels.forEach(mergeParts);
    mergeParts(g);
    var nearModel = new T.Group();
    g.children.slice().forEach(function (part) { nearModel.add(part); });
    g.add(nearModel);
    /* 远处只需车身、玻璃、轮胎和尾灯；95 米内再显示完整零件。 */
    var farModel = new T.Group();
    farModel.add(new T.Mesh(bodyGeo, paint));
    farModel.add(new T.Mesh(cabinGeo, glass));
    var farRoof = new T.Mesh(roof.geometry, paint);
    farRoof.position.copy(roof.position);
    farModel.add(farRoof);
    var farWheelGeo = new T.CylinderGeometry(0.36, 0.36, 0.26, 10);
    wheels.forEach(function (wheel) {
      var farWheel = new T.Mesh(farWheelGeo, dark);
      farWheel.rotation.z = Math.PI / 2;
      farWheel.position.copy(wheel.position);
      farModel.add(farWheel);
    });
    [-1, 1].forEach(function (sx) {
      var lamp = new T.Mesh(new T.BoxGeometry(0.46, 0.15, 0.07), tail);
      lamp.position.set(sx * (W / 2 - 0.36), base + bodyH * 0.62, L / 2 + 0.02);
      farModel.add(lamp);
    });
    if (kind === 2) {
      /* 皮卡远处仍保留斗壁，避免轮廓突然变化。 */
      [-1, 1].forEach(function (sx) {
        var bedWall = new T.Mesh(new T.BoxGeometry(0.12, 0.34, bedLen), paint);
        bedWall.position.set(sx*(W/2-0.06),base+bodyH+0.17,bedMid);
        farModel.add(bedWall);
      });
      var farGate = new T.Mesh(gate.geometry, paint);
      farGate.position.copy(gate.position);farModel.add(farGate);
    }
    mergeParts(farModel);
    farModel.visible = false;
    g.add(farModel);
    g.userData = { kind: kind, h: h, len: L, width: W, paint: paint, wheels: wheels,
      nearModel: nearModel, farModel: farModel };
    return g;
  }

  function buildTrafficSlot(count, side, laneSign) {
    var g = new T.Group();
    var cars = [];
    for (var i = 0; i < count; i++) {
      var c = buildTrafficCar(i % 3);
      c.visible = false;
      g.add(c);
      cars.push(c);
    }
    g.userData = {
      cars: cars, kind: 'car', speed: 20, len: 4.4, width: 1.86,
      clearH: 2.3, baseX: 0, passed: false, minAlt: Infinity,
      side: !!side, laneSign: laneSign || 0, lane: side ? (laneSign || 1) : 0
    };
    return g;
  }

  /* 玩家车道上「要跳过去」的车 */
  var traffic = [];
  for (var ci = 0; ci < CFG.TRAFFIC_COUNT; ci++) {
    var slot = buildTrafficSlot(3);
    scene.add(slot);
    traffic.push(slot);
  }

  /* 旁边车道的车：变道后也参与碰撞与飞越补气 */
  var trafficSide = [];
  for (var cs = 0; cs < CFG.TRAFFIC_SIDE_COUNT; cs++) {
    var sSlot = buildTrafficSlot(1, true, cs % 2 === 0 ? -1 : 1);
    scene.add(sSlot);
    trafficSide.push(sSlot);
  }

  /* 把槽位重新填成「一辆慢车」或「横停一排」 */
  function placeTraffic(slot, z, forceKind) {
    var ud = slot.userData;
    var kind = forceKind || (ud.side ? 'car' : (Math.random() < 1 / CFG.ROW_EVERY ? 'row' : 'car'));
    var i;
    for (i = 0; i < ud.cars.length; i++) {
      ud.cars[i].visible = false;
      ud.cars[i].position.x = 0;
    }
    ud.minAlt = Infinity;
    ud.passed = false;
    ud.kind = kind;

    if (kind === 'row') {
      var maxH = 0, maxL = 0;
      for (i = 0; i < ROW_X.length; i++) {
        var c = ud.cars[i];
        c.visible = true;
        c.position.x = ROW_X[i];
        c.userData.paint.color.copy(CAR_PAINT_LINEAR[(Math.random() * CAR_PAINT_LINEAR.length) | 0]);
        if (c.userData.h > maxH) maxH = c.userData.h;
        if (c.userData.len > maxL) maxL = c.userData.len;
      }
      ud.speed = 0;
      ud.baseSpeed = 0;
      ud.len = maxL;
      ud.width = 15.2;
      ud.clearH = maxH + CFG.TRAFFIC_MARGIN;
      ud.baseX = 0;
    } else {
      var v = ud.side ? 0 : (Math.random() * 3) | 0;
      var car = ud.cars[v];
      car.visible = true;
      car.userData.paint.color.copy(CAR_PAINT_LINEAR[(Math.random() * CAR_PAINT_LINEAR.length) | 0]);
      ud.baseX = ud.side
        ? CFG.LANE_CENTERS[ud.laneSign < 0 ? 0 : 2]
        : CFG.LANE_CENTERS[1];
      ud.baseSpeed = CFG.TRAFFIC_SPEED_MIN + Math.random() * (CFG.TRAFFIC_SPEED_MAX - CFG.TRAFFIC_SPEED_MIN);
      ud.speed = ud.baseSpeed + Math.max(0, state.speed - CFG.BASE_SPEED) * 0.32;
      ud.len = car.userData.len;
      ud.width = car.userData.width;
      ud.clearH = car.userData.h + CFG.TRAFFIC_MARGIN;
    }
    slot.position.set(ud.baseX, 0, z);
    protectTrafficPlacement(slot);
    ud._motionBefore={x:slot.position.x,y:slot.position.y,z:slot.position.z};
  }

  /* 生成时避开收费站：宁可推到站后面，也别塞进岗亭里 */
  function freeTrafficZ(z) {
    for (var t = 0; t < tolls.length; t++) {
      if (Math.abs(z - tolls[t].position.z) < CFG.HALF_DEPTH + 24) {
        z = tolls[t].position.z - CFG.HALF_DEPTH - 24 - Math.random() * 26;
      }
    }
    return z;
  }


  /* 最佳点火光带 */
  var takeoffLine = new T.Group();
  var tlBand = new T.Mesh(
    new T.PlaneGeometry(CFG.ROAD_HALF * 2, 5.2),
    new T.MeshBasicMaterial({ color: 0x1fc9ff, transparent: true, opacity: 0.42, depthWrite: false })
  );
  tlBand.rotation.x = -Math.PI / 2;
  tlBand.position.y = 0.05;
  takeoffLine.add(tlBand);

  var tlCore = new T.Mesh(
    new T.PlaneGeometry(CFG.ROAD_HALF * 2, 0.85),
    new T.MeshBasicMaterial({ color: 0xf0feff, transparent: true, opacity: 0.9, depthWrite: false })
  );
  tlCore.rotation.x = -Math.PI / 2;
  tlCore.position.y = 0.07;
  takeoffLine.add(tlCore);

  takeoffLine.visible = false;
  scene.add(takeoffLine);

  // Photo-reference exterior; gameplay interfaces remain group/wheels/jets.
  var roadster = window.createRoadsterModel(T);
  var car = roadster.group;
  scene.add(car);

  /* 冷气推进器点火：车底向下喷（抬升）、车尾向后喷（推进）、侧面成对喷（姿态） */
  function setJets(under, rear, sideL, sideR) {
    for (var i = 0; i < roadster.jets.length; i++) {
      var g = roadster.jets[i];
      var kind = g.userData.kind;
      var amt;
      if (kind === 'under') amt = under;
      else if (kind === 'rear') amt = rear;
      else amt = g.userData.side > 0 ? sideR : sideL;

      var len = kind === 'under' ? (0.85 + amt * 1.55)
        : kind === 'rear' ? (0.55 + amt * 1.05)
          : (0.30 + amt * 0.75);

      for (var j = 0; j < g.userData.plumes.length; j++) {
        var p = g.userData.plumes[j];
        var on = amt > 0.015;
        p.visible = on;
        if (on) {
          var ls = (len / roadster.plumeLen[j]) * (0.93 + Math.random() * 0.14);
          var rs = Math.pow(ls, 0.55);   // 羽流拉长的同时同步变粗，维持真实的扩散角
          p.scale.set(rs, ls, rs);
          g.userData.mats[j].uniforms.uOpacity.value = roadster.plumeOp[j] * amt;
        }
      }
    }
  }

  /* ------------------------------------------------------------------ *
   *  粒子系统
   * ------------------------------------------------------------------ */
  function createParticles(count, blending) {
    var geo = new T.BufferGeometry();
    var position = new Float32Array(count * 3);
    var aColor = new Float32Array(count * 3);
    var aSize = new Float32Array(count);
    var aAlpha = new Float32Array(count);
    geo.setAttribute('position', new T.BufferAttribute(position, 3));
    geo.setAttribute('aColor', new T.BufferAttribute(aColor, 3));
    geo.setAttribute('aSize', new T.BufferAttribute(aSize, 1));
    geo.setAttribute('aAlpha', new T.BufferAttribute(aAlpha, 1));

    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: blending || T.AdditiveBlending,
      vertexShader:
        'attribute vec3 aColor; attribute float aSize; attribute float aAlpha;' +
        'varying vec3 vColor; varying float vAlpha;' +
        'void main(){ vColor=aColor; vAlpha=aAlpha;' +
        '  vec4 mv = modelViewMatrix * vec4(position,1.0);' +
        '  gl_PointSize = clamp(aSize * (560.0 / max(-mv.z, 1.0)), 1.0, 190.0);' +
        '  gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying vec3 vColor; varying float vAlpha;' +
        'void main(){ float r = length(gl_PointCoord - vec2(0.5));' +
        '  float a = smoothstep(0.5, 0.05, r) * vAlpha;' +
        '  if(a <= 0.003) discard;' +
        '  gl_FragColor = vec4(vColor, a); }'
    });

    var pts = new T.Points(geo, mat);
    pts.visible = false;
    pts.frustumCulled = false;
    scene.add(pts);

    var P = {
      count: count, head: 0, active: 0,
      pos: position, col: aColor, size: aSize, alpha: aAlpha,
      vx: new Float32Array(count), vy: new Float32Array(count), vz: new Float32Array(count),
      life: new Float32Array(count), maxLife: new Float32Array(count),
      r: new Float32Array(count), g: new Float32Array(count), b: new Float32Array(count),
      drag: new Float32Array(count), grav: new Float32Array(count), power: new Float32Array(count),
      geo: geo
    };

    P.spawn = function (x, y, z, vx, vy, vz, r, g, b, size, life, drag, grav, power) {
      var i = P.head; P.head = (P.head + 1) % count;
      if (P.life[i] <= 0) P.active++;
      pts.visible = true;
      P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z;
      P.vx[i] = vx; P.vy[i] = vy; P.vz[i] = vz;
      P.r[i] = r; P.g[i] = g; P.b[i] = b;
      P.col[i * 3] = r; P.col[i * 3 + 1] = g; P.col[i * 3 + 2] = b;
      P.size[i] = size;
      P.life[i] = life; P.maxLife[i] = life;
      P.alpha[i] = 1;
      P.drag[i] = drag; P.grav[i] = grav; P.power[i] = power;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
    };

    P.update = function (dt) {
      if (P.active === 0 || dt <= 0) return;
      for (var i = 0; i < count; i++) {
        if (P.life[i] <= 0) { if (P.alpha[i] !== 0) P.alpha[i] = 0; continue; }
        P.life[i] -= dt;
        if (P.life[i] <= 0) { P.alpha[i] = 0; P.active--; continue; }
        var d = Math.pow(P.drag[i], dt * 60);
        P.vx[i] *= d; P.vz[i] *= d; P.vy[i] = P.vy[i] * d + P.grav[i] * dt;
        P.pos[i * 3] += P.vx[i] * dt;
        P.pos[i * 3 + 1] += P.vy[i] * dt;
        P.pos[i * 3 + 2] += P.vz[i] * dt;
        var k = P.life[i] / P.maxLife[i];
        var a = Math.pow(k, P.power[i]);
        P.alpha[i] = a;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      pts.visible = P.active > 0;
    };

    P.reset = function () {
      P.active = 0;
      pts.visible = false;
      for (var i = 0; i < count; i++) { P.life[i] = 0; P.alpha[i] = 0; P.size[i] = 0; }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    };

    return P;
  }

  /* 白雾用普通混合（白雾是"遮挡"而不是"发光"），爆炸用叠加混合 */
  var psExhaust = createParticles(360, T.NormalBlending);
  var psBoom = createParticles(320, T.AdditiveBlending);

  /* ------------------------------------------------------------------ *
   *  音效（WebAudio 合成，无需外部资源）
   * ------------------------------------------------------------------ */
  var Sound = (function () {
    var ctx = null, master = null, engGain = null, osc1 = null, osc2 = null, osc3 = null, filt = null;
    var thrustGain = null, ready = false, muted = false;

    function init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ctx = new AC(); } catch (e) { return; }

      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.42;
      master.connect(ctx.destination);

      /* 电机：纯电驱动，只有轻微低频嗡鸣 + 高频逆变器啸叫 */
      filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 520;
      filt.Q.value = 2;
      engGain = ctx.createGain();
      engGain.gain.value = 0;
      osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 84;
      osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = 168;
      var g2 = ctx.createGain(); g2.gain.value = 0.22;
      osc1.connect(filt); osc2.connect(g2); g2.connect(filt);
      filt.connect(engGain); engGain.connect(master);
      osc1.start(); osc2.start();

      /* 电机高频啸叫 */
      osc3 = ctx.createOscillator(); osc3.type = 'sine'; osc3.frequency.value = 700;
      var g3 = ctx.createGain(); g3.gain.value = 0.035;
      osc3.connect(g3); g3.connect(engGain);
      osc3.start();

      /* 冷气推进器：高压气体高速喷出 —— 高频气流嘶声，没有低频轰鸣 */
      var len = Math.floor(ctx.sampleRate * 2);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;

      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1250; hp.Q.value = 0.6;
      var hpG = ctx.createGain(); hpG.gain.value = 1.0;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4600; bp.Q.value = 0.9;
      var bpG = ctx.createGain(); bpG.gain.value = 0.8;

      thrustGain = ctx.createGain(); thrustGain.gain.value = 0;
      src.connect(hp); hp.connect(hpG); hpG.connect(thrustGain);
      src.connect(bp); bp.connect(bpG); bpG.connect(thrustGain);
      thrustGain.connect(master);
      src.start();

      ready = true;
    }

    function engine(on) {
      if (!ready) return;
      var now = ctx.currentTime;
      engGain.gain.cancelScheduledValues(now);
      engGain.gain.linearRampToValueAtTime(muted ? 0 : (on ? 0.11 : 0), now + 0.3);
    }
    function engineSpeed(n) {
      if (!ready) return;
      var f = 70 + n * 120;
      osc1.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
      osc2.frequency.setTargetAtTime(f * 2, ctx.currentTime, 0.08);
      osc3.frequency.setTargetAtTime(620 + n * 2300, ctx.currentTime, 0.09);
      filt.frequency.setTargetAtTime(460 + n * 1200, ctx.currentTime, 0.1);
    }
    var thrustOn = false;
    function thrust(on) {
      if (!ready || on === thrustOn) return;
      thrustOn = on;
      var now = ctx.currentTime;
      thrustGain.gain.cancelScheduledValues(now);
      if (on) {
        /* 阀门瞬间打开，嘶声几乎立刻起来 */
        thrustGain.gain.setValueAtTime(0.0001, now);
        thrustGain.gain.linearRampToValueAtTime(muted ? 0 : 0.20, now + 0.03);
        noiseBurst(0.14, 3400, 0.28, 'highpass');   // 瞬时泄气声
      } else {
        thrustGain.gain.linearRampToValueAtTime(0, now + 0.10);
      }
    }
    function noiseBurst(dur, freq, vol, type) {
      if (!ready || muted) return;
      var len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var s = ctx.createBufferSource(); s.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
      var g = ctx.createGain(); g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(master);
      s.start();
    }
    function boom() {
      if (!ready || muted) return;
      noiseBurst(1.1, 420, 0.85, 'lowpass');
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.7);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.9, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.8);
    }
    function ding() {
      if (!ready || muted) return;
      [880, 1320].forEach(function (fr, i) {
        var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
        var g = ctx.createGain();
        var t0 = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.22, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + 0.36);
      });
    }
    function whoosh() {
      if (!ready || muted) return;
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.45);
    }
    /* 低量警戒：两声短促电子提示音 */
    function warn() {
      if (!ready || muted) return;
      [0, 0.16].forEach(function (off, i) {
        var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = i ? 1180 : 880;
        var g = ctx.createGain();
        var t0 = ctx.currentTime + off;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.09, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + 0.15);
      });
    }

    /* 罐子见底：阀门啪地关上，气流从尖啸变成干哑的噗噗声 */
    function dry() {
      if (!ready || muted) return;
      noiseBurst(0.30, 5200, 0.30, 'highpass');
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(320, ctx.currentTime + 0.05);
      o.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 0.55);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.connect(lp); lp.connect(g); g.connect(master);
      o.start(ctx.currentTime + 0.05); o.stop(ctx.currentTime + 0.65);
    }

    /* 空翻点火：几组喷嘴同时开阀，一记短促的高压泄气声，尾音往上挑 */
    function flip() {
      if (!ready || muted) return;
      noiseBurst(0.42, 4200, 0.24, 'highpass');
      noiseBurst(0.22, 900, 0.20, 'lowpass');
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(95, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.42);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.52);
    }

    function mute(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.42; }

    return {
      init: init, engine: engine, engineSpeed: engineSpeed, thrust: thrust,
      boom: boom, ding: ding, whoosh: whoosh, warn: warn, dry: dry, flip: flip, mute: mute
    };
  })();

  /* ------------------------------------------------------------------ *
   *  DOM
   * ------------------------------------------------------------------ */
  var el = {
    hud: document.getElementById('hud'),
    score: document.getElementById('score'),
    cleared: document.getElementById('cleared'),
    best: document.getElementById('best'),
    speed: document.getElementById('speed'),
    dist: document.getElementById('dist'),
    prompt: document.getElementById('prompt'),
    gaugeSafe: document.getElementById('gaugeSafe'),
    gaugeDanger: document.getElementById('gaugeDanger'),
    gaugeMarker: document.getElementById('gaugeMarker'),
    gasFill: document.getElementById('gasFill'),
    gasTrack: document.getElementById('gasTrack'),
    gasCaption: document.getElementById('gasCaption'),
    toast: document.getElementById('toast'),
    start: document.getElementById('start'),
    over: document.getElementById('over'),
    overReason: document.getElementById('overReason'),
    overDesc: document.getElementById('overDesc'),
    finalScore: document.getElementById('finalScore'),
    finalCleared: document.getElementById('finalCleared'),
    finalSpeed: document.getElementById('finalSpeed'),
    finalBest: document.getElementById('finalBest'),
    boardList: document.getElementById('boardList'),
    boardEmpty: document.getElementById('boardEmpty'),
    btnStart: document.getElementById('btnStart'),
    btnRetry: document.getElementById('btnRetry'),
    btnMute: document.getElementById('btnMute'),
    overGap: document.getElementById('overGap'),
    btnFlip: document.getElementById('btnFlip'),
    flash: document.getElementById('flash')
  };

  /* 触屏设备：提示语写「点右下角」而不是「按 F」 */
  var TOUCH = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);

  /* 仪表标尺 */
  (function layoutGauge() {
    var g = CFG.GAUGE_MAX;
    var safeBottom = (CFG.CLEAR_ALT / g) * 100;
    var safeTop = (CFG.MAX_ALT / g) * 100;
    el.gaugeSafe.style.left = safeBottom + '%';
    el.gaugeSafe.style.width = (safeTop - safeBottom) + '%';
    el.gaugeDanger.style.left = safeTop + '%';
    el.gaugeDanger.style.width = (100 - safeTop) + '%';
  })();

  /* ------------------------------------------------------------------ *
   *  游戏状态
   * ------------------------------------------------------------------ */
  var BEST_KEY = 'roadster_toll_best_v1';
  var BOARD_KEY = 'roadster_board_v1';
  var MUTE_KEY = 'roadster_muted_v1';
  var BOARD_MAX = 10;

  /* ------------------------------------------------------------------ *
   *  本地排行榜（localStorage）
   *  只存最近 10 条，按得分降序。同分时飞越站数多的排前面。
   * ------------------------------------------------------------------ */
  function loadBoard() {
    try {
      var raw = localStorage.getItem(BOARD_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (r) {
        return r && typeof r.score === 'number' && typeof r.cleared === 'number' && r.at;
      });
    } catch (e) { return []; }
  }

  /* 写入一条记录，返回 { list, mine } —— mine 是本次这条在榜上的序号（-1 表示没挤进去） */
  function pushBoard(rec) {
    var arr = loadBoard();
    arr.push(rec);
    arr.sort(function (a, b) {
      return (b.score - a.score) || (b.cleared - a.cleared) || (b.at - a.at);
    });
    arr = arr.slice(0, BOARD_MAX);
    try { localStorage.setItem(BOARD_KEY, JSON.stringify(arr)); } catch (e) { /* 隐私模式等场景静默失败 */ }
    var mine = -1;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].at === rec.at) { mine = i; break; }
    }
    return { list: arr, mine: mine };
  }

  function renderBoard(mine) {
    var arr = loadBoard();
    el.boardList.innerHTML = '';
    if (!arr.length) {
      el.boardEmpty.classList.remove('hidden');
      return;
    }
    el.boardEmpty.classList.add('hidden');
    arr.forEach(function (r, i) {
      var d = new Date(r.at);
      var stamp = isNaN(d.getTime()) ? '' :
        (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
        ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      var li = document.createElement('li');
      li.className = 'board-row' + (i === mine ? ' me' : '');
      li.innerHTML =
        '<i>' + (i + 1) + '</i>' +
        '<b>' + r.score + '</b>' +
        '<span>' + r.cleared + ' 站 · ' + (r.kind === 'sky' ? '飞过头' : (r.kind === 'traffic' ? '追尾' : '撞上收费站')) + '</span>' +
        '<time>' + stamp + '</time>';
      el.boardList.appendChild(li);
    });
  }

  var state = {
    mode: 'ready',      // ready | playing | crashing | over
    carZ: 0,
    carX: 0,
    laneIndex: 1,
    laneFromX: 0,
    laneChangeT: 1,
    laneChangeDuration: CFG.LANE_CHANGE_TIME,
    steer: 0,
    prevZ: 0,
    alt: 0,
    vy: 0,
    speed: CFG.BASE_SPEED,
    score: 0,
    cleared: 0,
    refunds: 0,         // 贴顶/干净飞越次数（返还冷气的站数）
    passedCars: 0,      // 飞过去的车辆数
    best: 0,
    thrusting: false,
    gas: CFG.GAS_MAX,   // 剩余冷气（%），飞越车辆可补充
    gasDry: false,      // 是否已经烧干过
    gasWarned: false,   // 低量提示只响一次
    crashKind: '',
    crashTimer: 0,
    shake: 0,
    maxSpeed: 0,
    spin: 0,
    time: 0,

    /* 空中翻转 */
    flip: 0,            // 当前空翻角度（弧度，0 → 2π）
    flipping: false,    // 是否正在翻
    flipT: 0,           // 本次空翻进度 0..1
    flipCool: 0,        // 两次空翻之间的间隔
    flips: 0,           // 全场完成次数
    airFlips: 0,        // 本次腾空完成次数（落地清零，用来算连翻）
    pitch: 0,           // 基础俯仰（不含空翻角度）
    camFlip: 0          // 空翻时的镜头侧移量（缓动）
  };

  try { state.best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { state.best = 0; }

  var camLook = new T.Vector3(0, 1.5, -14);
  var camDesired = new T.Vector3();
  var lookDesired = new T.Vector3();

  /* ------------------------------------------------------------------ *
   *  流程控制
   * ------------------------------------------------------------------ */
  function resetGame() {
    state.mode = 'playing';
    state.carZ = 0;
    state.carX = 0;
    state.laneIndex = 1;
    state.laneFromX = 0;
    state.laneChangeT = 1;
    state.laneChangeDuration = CFG.LANE_CHANGE_TIME;
    state.steer = 0;
    steeringKeys = {};
    state.prevZ = 0;
    state._trafficBefore=null;
    state.alt = 0;
    state.vy = 0;
    state.speed = CFG.BASE_SPEED;
    state.score = 0;
    state.cleared = 0;
    state.refunds = 0;
    state.passedCars = 0;
    state.thrusting = false;
    state.gas = CFG.GAS_MAX;      // 每次重新出发都是满罐
    state.gasDry = false;
    state.gasWarned = false;
    state.crashKind = '';
    state.failure = null;
    state.crashTimer = 0;
    state.shake = 0;
    state.maxSpeed = CFG.BASE_SPEED;
    state.spin = 0;
    state.flip = 0;
    state.flipping = false;
    state.flipT = 0;
    state.flipCool = 0;
    state.flips = 0;
    state.airFlips = 0;
    state.pitch = 0;
    state.camFlip = 0;
    worldInstancesDirty = true;
    hudElapsed = 0;

    for (var i = 0; i < tolls.length; i++) {
      tolls[i].position.z = -(CFG.FIRST_TOLL + i * CFG.TOLL_SPACING);
      tolls[i].rotation.set(0, 0, 0);
      tolls[i].userData.passed = false;
      tolls[i].userData.minAlt = Infinity;
    }
    gapCount = 0;
    traffic.concat(trafficSide).forEach(function (slot) {
      slot.userData._placementReady = false;
      slot.userData._flightRecords = null;
    });
    for (var ti = 0; ti < traffic.length; ti++) {
      placeTraffic(traffic[ti], freeTrafficZ(-(180 + ti * CFG.TRAFFIC_GAP_START)), ti === 3 ? 'row' : 'car');
    }
    for (var tj = 0; tj < trafficSide.length; tj++) {
      placeTraffic(trafficSide[tj], freeTrafficZ(-(130 + tj * 82)), 'car');
    }
    for (var d = 0; d < DASH_N; d++) dashZ[d] = 30 - d * DASH_GAP;
    for (var p = 0; p < POST_N; p++) postZ[p] = 30 - p * POST_GAP;
    for (var q = 0; q < POLE_N; q++) poleZ[q] = 30 - q * POLE_GAP;

    car.position.set(0, 0, 0);
    car.rotation.set(0, 0, 0);
    roadster.jets.forEach(function (g) {
      g.userData.plumes.forEach(function (p) { p.visible = false; });
    });
    roadster.thrustLight.intensity = 0;

    psExhaust.reset();
    psBoom.reset();

    camera.position.set(0, 6, 14);
    camLook.set(0, 1.5, -14);

    el.over.classList.add('hidden');
    el.start.classList.add('hidden');
    el.hud.classList.remove('hidden');
    el.prompt.classList.remove('hot');
    el.prompt.classList.remove('dry');
    el.prompt.classList.remove('warn');
    el.prompt.innerHTML = '长按 <kbd>空格</kbd> / 点击屏幕 点火起飞';
    el.best.textContent = state.best;
    updateHUD();

    Sound.init();
    Sound.engine(true);
    Sound.engineSpeed(0);
    Sound.thrust(false);
  }

  function crash(kind, detail) {
    if (state.mode !== 'playing') return;
    // Preserve the incident before the crash animation changes height and speed.
    state.failure = Object.assign({ alt: state.alt, gas: state.gas,
      changingLane: state.laneChangeT < 1, vy: state.vy }, detail || {});
    updateTrafficDebug();
    state.mode = 'crashing';
    state.crashKind = kind;
    state.crashTimer = 0;
    state.shake = 1;
    state.thrusting = false;
    /* 半空翻着撞上也不硬掰回来：把当前翻转角度冻住，让残骸接着翻出去 */
    state.flipping = false;

    Sound.thrust(false);
    Sound.engine(false);
    Sound.boom();

    var p = car.position;
    if (kind === 'toll') {
      state.vy = 7;
      state.spin = 9;
      for (var i = 0; i < 130; i++) {
        var a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
        var sp = 6 + Math.random() * 22;
        psBoom.spawn(
          p.x + (Math.random() - 0.5) * 2, p.y + 0.8 + (Math.random() - 0.5) * 1.5, p.z + (Math.random() - 0.5) * 3,
          Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 6, Math.sin(a) * Math.cos(e) * sp,
          1.0, 0.45 + Math.random() * 0.4, 0.1, 0.8 + Math.random() * 1.1,
          0.5 + Math.random() * 0.9, 0.965, -22, 1.6
        );
      }
      for (var s = 0; s < 40; s++) {
        psBoom.spawn(p.x, p.y + 1, p.z, (Math.random() - 0.5) * 8, 2 + Math.random() * 5, (Math.random() - 0.5) * 8,
          0.32, 0.32, 0.34, 1.6 + Math.random() * 1.6, 1.4 + Math.random(), 0.985, 1.2, 2.0);
      }
    } else if (kind === 'traffic') {
      /* 追尾：车头怼上前车，翻出去，但没撞收费站那么夸张 */
      state.vy = 8;
      state.spin = 8;
      for (var i2 = 0; i2 < 80; i2++) {
        var a2 = Math.random() * Math.PI * 2, e2 = Math.random() * Math.PI - Math.PI / 2;
        var sp2 = 5 + Math.random() * 16;
        psBoom.spawn(
          p.x + (Math.random() - 0.5) * 1.8, p.y + 0.7 + (Math.random() - 0.5) * 1.2, p.z + (Math.random() - 0.5) * 2.6,
          Math.cos(a2) * Math.cos(e2) * sp2, Math.sin(e2) * sp2 + 5, Math.sin(a2) * Math.cos(e2) * sp2,
          1.0, 0.55, 0.18, 0.7 + Math.random() * 0.8, 0.5 + Math.random() * 0.8, 0.955, -20, 1.6
        );
      }
      for (var s2 = 0; s2 < 24; s2++) {
        psBoom.spawn(p.x, p.y + 0.9, p.z, (Math.random() - 0.5) * 6, 1.5 + Math.random() * 4, (Math.random() - 0.5) * 6,
          0.30, 0.30, 0.32, 1.4 + Math.random() * 1.4, 1.2 + Math.random(), 0.985, 1.0, 2.0);
      }
    } else {
      /* 飞过头 —— 继续冲上天空并失控 */
      state.vy = Math.max(state.vy, 20);
      state.spin = 6;
      for (var j = 0; j < 70; j++) {
        psBoom.spawn(p.x, p.y + 1, p.z, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10,
          1.0, 0.6, 0.2, 0.7 + Math.random() * 0.9, 0.6 + Math.random() * 0.6, 0.96, -6, 1.5);
      }
    }

    el.flash.classList.add('on');
    setTimeout(function () { el.flash.classList.remove('on'); }, 55);
  }

  function finish() {
    state.mode = 'over';
    el.hud.classList.add('hidden');
    Sound.engine(false);
    Sound.thrust(false);

    var prevBest = state.best;
    if (state.score > state.best) {
      state.best = state.score;
      try { localStorage.setItem(BEST_KEY, String(state.best)); } catch (e) { }
    }

    var titles = {
      toll: '撞上收费站',
      sky: '飞过头，冲出马路',
      traffic: '追尾前车'
    };
    var descs = {
      toll: '点火太晚，车身还没抬起来就撞上了收费站的栏杆和顶棚。下次看到蓝色光带就按住。',
      sky: '推力给太猛，Roadster 直接窜上平流层，错过了整条公路。松手要果断。',
      traffic: '前面那辆慢车不会让路 —— 起跳晚了，或者跳得不够高，车头就怼上去了。看到尾灯就该拉起来，跳过去还能返还冷气。'
    };
    if (state.gas <= 0 && state.crashKind === 'toll') {
      titles.toll = '冷气耗尽 · 撞上收费站';
      descs.toll = '冷气储罐空了。试着在站间飞越车辆补气，贴近车顶飞越奖励更多；也可以左右绕开车流，省下起飞用气。按住不放最费气。';
    }

    var failure = state.failure;
    if (failure) {
      if (state.crashKind === 'traffic') {
        var deficit = Math.max(0, failure.roof - failure.alt);
        descs.traffic = '碰撞时车底 ' + failure.alt.toFixed(1) + ' m，前车车顶 ' +
          failure.roof.toFixed(1) + ' m，还差 ' + deficit.toFixed(1) + ' m。' +
          (failure.changingLane ? '变道途中碰到了相邻车道的车，先确认侧方空间再换道。' :
          (failure.gas <= 0 ? '冷气已耗尽，下次提早变道绕行，保留起飞用气。' :
          '下次提前短按起飞，或切换到空车道；完整飞越才会返还冷气。'));
      } else if (state.crashKind === 'toll' && failure.gas > 0) {
        descs.toll = '穿站最低高度 ' + failure.alt.toFixed(1) + ' m，需要 ' +
          CFG.CLEAR_ALT.toFixed(1) + ' m，还差 ' + Math.max(0, CFG.CLEAR_ALT - failure.alt).toFixed(1) +
          ' m。' + (failure.vy < 0 ? '越站途中已在下降，等整车过站后再松开点火。' :
          '点火偏晚，下次在蓝色光带附近提早起飞。');
      } else if (state.crashKind === 'sky') {
        descs.sky = '高度达到 ' + failure.alt.toFixed(1) + ' m，超过 ' + CFG.MAX_ALT +
          ' m 上限。提前松开点火，车辆仍会惯性上升；短按比一直按住更省冷气。';
      }
    }

    el.overReason.textContent = titles[state.crashKind] || '游戏结束';
    el.overReason.classList.remove('win');
    el.overDesc.textContent = descs[state.crashKind] || '';
    el.finalScore.textContent = state.score;
    el.finalCleared.textContent = state.cleared;
    el.finalSpeed.textContent = Math.round(state.maxSpeed * 3.6);
    el.finalBest.textContent = state.best;

    /* 距最高分 / 新纪录 —— 比只看历史分更能推动「再来一把」 */
    if (el.overGap) {
      var tight = state.refunds ? '  ·  贴顶飞越 ' + state.refunds + ' 次' : '';
      if (state.flips) tight += '  ·  横滚 ' + state.flips + ' 次';
      if (state.passedCars) tight += '  ·  跳过 ' + state.passedCars + ' 辆';
      if (prevBest > 0 && state.score > prevBest) {
        el.overGap.textContent = '新纪录！比上次多 ' + (state.score - prevBest) + ' 分' + tight;
        el.overGap.className = 'over-gap record';
      } else if (prevBest > 0 && state.score === prevBest) {
        el.overGap.textContent = '追平最高分' + tight;
        el.overGap.className = 'over-gap record';
      } else if (prevBest > 0) {
        el.overGap.textContent = '距最高分还差 ' + (prevBest - state.score) + ' 分' + tight;
        el.overGap.className = 'over-gap';
      } else {
        el.overGap.textContent = '首个纪录：' + state.score + ' 分' + tight;
        el.overGap.className = 'over-gap record';
      }
    }

    /* 记入本地排行榜并高亮本次这一行 */
    var pushed = pushBoard({
      score: state.score,
      cleared: state.cleared,
      kind: state.crashKind,
      at: Date.now()
    });
    renderBoard(pushed.mine);

    el.over.classList.remove('hidden');
  }

  function toast(text, color) {
    el.toast.textContent = text;
    el.toast.style.color = color || '#7fe0ff';
    el.toast.classList.remove('show');
    void el.toast.offsetWidth;
    el.toast.classList.add('show');
  }

  /* ------------------------------------------------------------------ *
   *  空中翻转（A71 姿态控制）
   * ------------------------------------------------------------------ */
  /* 车体局部坐标 → 世界坐标，绕车身中心横滚 */
  function flipPoint(lx, ly, lz) {
    var H = CFG.FLIP_PIVOT, th = state.flip * CFG.FLIP_DIR;
    var y = ly - H, c = Math.cos(th), s = Math.sin(th);
    return {
      x: state.carX + lx * c - y * s,
      y: state.alt + H + lx * s + y * c,
      z: state.carZ + lz
    };
  }

  function startFlip() {
    if (state.mode !== 'playing') return false;
    if (state.flipping || state.flipCool > 0) return false;
    if (state.alt < CFG.FLIP_MIN_ALT) {
      state.flipCool = 0.45;
      toast('先飞起来再翻', '#ffc46b');
      return false;
    }
    if (state.gas < CFG.FLIP_GAS) {
      state.flipCool = 0.45;
      toast('冷气不够，喷嘴顶不起来', '#ff8a6b');
      return false;
    }
    state.gas = Math.max(0, state.gas - CFG.FLIP_GAS);
    state.flipping = true;
    state.flipT = 0;
    state.flip = 0;
    Sound.flip();
    return true;
  }

  function completeFlip() {
    state.flipping = false;
    state.flip = 0;
    state.flipT = 1;
    state.flipCool = 0.16;
    state.flips++;
    state.airFlips++;
    var gain = Math.round(CFG.FLIP_SCORE * (1 + CFG.FLIP_CHAIN * (state.airFlips - 1)));
    state.score += gain;
    Sound.whoosh();
    toast(state.airFlips > 1 ? '横滚 ×' + state.airFlips + '  +' + gain : '空中横滚  +' + gain, '#9fd0ff');
  }

  /* ------------------------------------------------------------------ *
   *  通过收费站
   * ------------------------------------------------------------------ */
  function onCleared(minAlt) {
    state.cleared++;

    /* 贴顶程度决定冷气返还：贴着顶棚飞比猛喷更划算 */
    var margin = minAlt - CFG.CLEAR_ALT;
    var refund = 0, label = '';
    if (margin <= CFG.TIGHT_MARGIN) { refund = CFG.GAS_REFUND_TIGHT; label = '贴顶飞越'; }
    else if (margin <= CFG.CLEAN_MARGIN) { refund = CFG.GAS_REFUND_CLEAN; label = '低空飞越'; }
    if (refund > 0) addGas(refund);

    /* 带着空翻飞过收费站 —— 发布会同款动作，额外给分 */
    var airBonus = state.airFlips > 0 ? CFG.FLIP_AIR_BONUS * Math.min(state.airFlips, 3) : 0;

    var gain = CFG.SCORE_PER_TOLL + Math.round((state.speed - CFG.BASE_SPEED) * 4) + refund * CFG.REFUND_SCORE + airBonus;
    state.score += gain;
    Sound.ding();
    Sound.whoosh();
    var parts = [];
    if (label) { state.refunds++; parts.push(label); }
    else parts.push('飞越成功');
    if (airBonus) parts.push('横滚飞越');
    parts.push('+' + gain);
    if (refund) parts.push('冷气 +' + refund + '%');
    toast(parts.join('  ·  '), airBonus ? '#9fd0ff' : '#6ff0c0');
    if (state.cleared % 5 === 0) toast('连飞 ' + state.cleared + ' 站！', '#ffd166');
  }

  /* ------------------------------------------------------------------ *
   *  每帧更新
   * ------------------------------------------------------------------ */
  function findNextToll() {
    var best = null, bestD = Infinity;
    for (var i = 0; i < tolls.length; i++) {
      var t = tolls[i];
      if (t.userData.passed) continue;
      var d = state.carZ - (t.position.z + CFG.HALF_DEPTH);
      if (d > -CFG.TOLL_DEPTH && d < bestD) { bestD = d; best = t; }
    }
    return best ? { toll: best, dist: bestD } : null;
  }

  var worldInstancesDirty = true;
  var recycleMatrix = new T.Matrix4();
  function updateWorldRecycle() {
    var cz = state.carZ;

    road.position.z = cz; grass.position.z = cz;
    for (var i = 0; i < shoulders.length; i++) shoulders[i].position.z = cz;
    for (var e = 0; e < edgeLines.length; e++) edgeLines[e].position.z = cz;
    for (var r = 0; r < rails.length; r++) rails[r].position.z = cz;

    /* 虚线 */
    var m = recycleMatrix, changed = false;
    for (var k = 0; k < DASH_N; k++) {
      var dashWrap = dashZ[k] > cz + 40;
      if (!worldInstancesDirty && !dashWrap) continue;
      if (dashWrap) dashZ[k] -= DASH_SPAN;
      changed = true;
      m.makeTranslation(CFG.LANE_X[0], 0.016, dashZ[k]);
      dashIM.setMatrixAt(k * 2, m);
      m.makeTranslation(CFG.LANE_X[1], 0.016, dashZ[k]);
      dashIM.setMatrixAt(k * 2 + 1, m);
    }
    if (changed) dashIM.instanceMatrix.needsUpdate = true;

    /* 护栏立柱 */
    changed = false;
    for (var p2 = 0; p2 < POST_N; p2++) {
      var postWrap = postZ[p2] > cz + 40;
      if (!worldInstancesDirty && !postWrap) continue;
      if (postWrap) postZ[p2] -= POST_SPAN;
      changed = true;
      m.makeTranslation(-(CFG.ROAD_HALF + 2.0), 0.45, postZ[p2]);
      postIM.setMatrixAt(p2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 2.0, 0.45, postZ[p2]);
      postIM.setMatrixAt(p2 * 2 + 1, m);
    }
    if (changed) postIM.instanceMatrix.needsUpdate = true;

    /* 路灯 */
    changed = false;
    for (var q2 = 0; q2 < POLE_N; q2++) {
      var poleWrap = poleZ[q2] > cz + 60;
      if (!worldInstancesDirty && !poleWrap) continue;
      if (poleWrap) poleZ[q2] -= POLE_SPAN;
      changed = true;
      m.makeTranslation(-(CFG.ROAD_HALF + 3.4), 4.2, poleZ[q2]);
      poleIM.setMatrixAt(q2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 3.4, 4.2, poleZ[q2]);
      poleIM.setMatrixAt(q2 * 2 + 1, m);
      m.makeTranslation(-(CFG.ROAD_HALF + 2.0), 8.3, poleZ[q2]);
      lampIM.setMatrixAt(q2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 2.0, 8.3, poleZ[q2]);
      lampIM.setMatrixAt(q2 * 2 + 1, m);
    }
    if (changed) {
      poleIM.instanceMatrix.needsUpdate = true;
      lampIM.instanceMatrix.needsUpdate = true;
    }

    /* 树 */
    changed = false;
    for (var t2 = 0; t2 < TREE_N; t2++) {
      var treeWrap = treeZ[t2] > cz + 80;
      if (!worldInstancesDirty && !treeWrap) continue;
      if (treeWrap) treeZ[t2] -= TREE_SPAN;
      changed = true;
      m.makeScale(2.2, 1.6, 2.2);
      m.setPosition(treeX[t2], 1.1, treeZ[t2]);
      treeIM.setMatrixAt(t2, m);
    }
    if (changed) treeIM.instanceMatrix.needsUpdate = true;

    /* 远景丘陵带 */
    changed = false;
    for (var l2 = 0; l2 < TL_N; l2++) {
      var hillWrap = tlZ[l2] > cz + 140;
      if (!worldInstancesDirty && !hillWrap) continue;
      if (hillWrap) tlZ[l2] -= TL_SPAN;
      changed = true;
      m.makeScale(tlW[l2], tlH[l2], tlW[l2] * 1.5);
      m.setPosition(tlX[l2], 0, tlZ[l2]);
      tlIM.setMatrixAt(l2, m);
    }
    if (changed) tlIM.instanceMatrix.needsUpdate = true;
    worldInstancesDirty = false;

    /* 地表纹理随世界滚动：抵消平面跟车移动，否则地面像传送带 */
    grassTex.offset.y = -cz / 16;
    asphaltTex.offset.y = -cz / 8;

    /* 收费站回收：间距随机，每 DOUBLE_EVERY 个间隔插一次「连站」 */
    for (var g = 0; g < tolls.length; g++) {
      var tt = tolls[g];
      if (cz < tt.position.z - 50) {
        var frontZ = Infinity;
        for (var q = 0; q < tolls.length; q++) {
          if (tolls[q] !== tt && tolls[q].position.z < frontZ) frontZ = tolls[q].position.z;
        }
        tt.position.z = frontZ - nextTollGap();
        tt.userData.passed = false;
        tt.userData.minAlt = Infinity;
        /* 收费站挪到前面时，把附近车流挪到站前排队，别扣在岗亭上 */
        for (var tv = 0; tv < traffic.length; tv++) {
          if (Math.abs(traffic[tv].position.z - tt.position.z) < CFG.HALF_DEPTH + 26) {
            traffic[tv].position.z = tt.position.z + CFG.HALF_DEPTH + 10;
          }
        }
      }
      var tollAhead = cz - tt.position.z;
      tt.visible = tollAhead > -65 && tollAhead < 520;
    }
    for (var vi = 0; vi < traffic.length + trafficSide.length; vi++) {
      var actor = vi < traffic.length ? traffic[vi] : trafficSide[vi - traffic.length];
      var ahead = cz - actor.position.z;
      actor.visible = ahead > -35 && ahead < 480;
      for (var vc = 0; vc < actor.userData.cars.length; vc++) {
        var visual = actor.userData.cars[vc].userData;
        visual.nearModel.visible = ahead < 95;
        visual.farModel.visible = ahead >= 95;
      }
    }
  }

  function updateTollLogic() {
    var prevZ = state.prevZ, cz = state.carZ, alt = state.alt;

    for (var i = 0; i < tolls.length; i++) {
      var t = tolls[i], ud = t.userData;
      if (ud.passed) continue;

      var zF = t.position.z + CFG.HALF_DEPTH;
      var zB = t.position.z - CFG.HALF_DEPTH;

      var crossedFront = prevZ > zF && cz <= zF;
      var inside = cz <= zF && cz >= zB;

      if (crossedFront || inside) ud.minAlt = Math.min(ud.minAlt, alt);

      if (inside && ud.minAlt < CFG.CLEAR_ALT) { crash('toll', {alt: ud.minAlt}); return; }

      if (prevZ > zB && cz <= zB) {
        ud.passed = true;
        if (ud.minAlt < CFG.CLEAR_ALT) { crash('toll', {alt: ud.minAlt}); return; }
        onCleared(ud.minAlt);
      }
    }

    if (state.alt > CFG.MAX_ALT) { crash('sky'); return; }
  }

  /* ------------------------------------------------------------------ *
   *  车流：移动 / 回收 / 碰撞 / 计分
   * ------------------------------------------------------------------ */
  // A distance-based cycle avoids abrupt speed changes or denser rows as time passes.
  function difficultyPhase(distance) {
    distance = distance === undefined ? Math.max(0, -state.carZ) : Math.max(0, distance);
    if (distance < 1040) return { key: 'warmup', label: '热身路段', acceleration: 0.18, spacing: 1.15 };
    if ((distance - 1040) % 1800 < 900)
      return { key: 'push', label: '提速路段', acceleration: 0.28, spacing: 1 };
    return { key: 'recover', label: '喘息路段', acceleration: 0.10, spacing: 1.18 };
  }

  function trafficGap() {
    var k = Math.min(1, state.cleared / 12);   // 后期车距由配置控制，不再持续加密
    return (CFG.TRAFFIC_GAP_START + (CFG.TRAFFIC_GAP_END - CFG.TRAFFIC_GAP_START) * k) *
      difficultyPhase().spacing + Math.random() * 26;
  }

  /* 收费站前的排队线：车到栏杆前就停住，绝不穿过岗亭。
     排队位置按「前面已经排了几辆」往后让，避免两辆叠在一起。 */
  function queueStopZ(slot, list) {
    var ud = slot.userData;
    for (var t = 0; t < tolls.length; t++) {
      var toll = tolls[t];
      var frontZ = toll.position.z + CFG.HALF_DEPTH;
      if (slot.position.z > frontZ + 75 || slot.position.z < toll.position.z - CFG.HALF_DEPTH - 2) continue;

      /* 只跟「同一条车道」的车排队，左右车道各排各的 */
      var rank = 0;
      for (var i = 0; i < list.length; i++) {
        var o = list[i];
        if (o === slot || o.userData.kind !== 'car' || o.userData.lane !== ud.lane) continue;
        if (o.position.z < slot.position.z && o.position.z > toll.position.z - CFG.HALF_DEPTH) rank++;
      }
      return frontZ + 7 + rank * 11;
    }
    return Infinity;
  }

  /* 重新投放：玩家车道必须满足最小车距，近处放不下就放到车流末尾 */
  function respawnZ(slot, list) {
    var minGap = slot.userData.side ? 0 : trafficGap();
    function pick(minAhead, span) {
      var best = null, bestGap = -1;
      for (var k = 0; k < 7; k++) {
        var z = state.carZ - (minAhead + Math.random() * span);
        var clash = false;
        for (var t = 0; t < tolls.length; t++) {
          if (Math.abs(z - tolls[t].position.z) < CFG.HALF_DEPTH + 26) { clash = true; break; }
        }
        if (clash) continue;
        var near = Infinity;
        for (var i = 0; i < list.length; i++) {
          if (list[i] === slot) continue;
          var d = Math.abs(list[i].position.z - z);
          if (d < near) near = d;
        }
        if (near > bestGap) { bestGap = near; best = z; }
      }
      return bestGap >= minGap ? best : null;
    }
    /* 先试近段，塞不下就退到更远 */
    var picked = pick(180, 300) || pick(500, 400);
    if (picked !== null) return picked;
    var farthestZ = state.carZ - 180;
    for (var j = 0; j < list.length; j++) {
      if (list[j] !== slot) farthestZ = Math.min(farthestZ, list[j].position.z);
    }
    return freeTrafficZ(farthestZ - minGap);
  }

  function updateTraffic(dt) {
    traffic.concat(trafficSide).forEach(function(slot) {
      slot.userData._motionBefore={x:slot.position.x,y:slot.position.y,z:slot.position.z};
    });
    updateTrafficList(traffic, dt);
    updateTrafficList(trafficSide, dt);
  }

  function updateTrafficList(list, dt) {
    var cz = state.carZ;
    for (var i = 0; i < list.length; i++) {
      var slot = list[i], ud = slot.userData;

      /* 只在车道里开，不变道；快到收费站就减速排队 */
      if (ud.kind === 'car') {
        var targetSpeed = ud.baseSpeed + Math.max(0, state.speed - CFG.BASE_SPEED) * 0.32;
        ud.speed += Math.min(Math.max(0, targetSpeed - ud.speed), dt);
      }
      var move = ud.speed * dt;
      var stopZ = ud.kind === 'car' ? queueStopZ(slot, list) : Infinity;
      if (isFinite(stopZ)) {
        /* 站前 100 米开始减速，越靠近越慢（排队缓行），别一下停死 */
        var toStop = slot.position.z - stopZ;
        move *= Math.min(1, 0.18 + 0.82 * Math.min(1, toStop / 100));
      }
      var previousZ = slot.position.z;
      slot.position.z -= move;
      if (isFinite(stopZ) && slot.position.z < stopZ) slot.position.z = stopZ;
      var wheelDistance = Math.max(0, previousZ - slot.position.z);
      for (var v = 0; v < ud.cars.length; v++) {
        var trafficCar = ud.cars[v];
        if (!trafficCar.visible || slot.visible === false || !trafficCar.userData.nearModel.visible) continue;
        for (var w = 0; w < trafficCar.userData.wheels.length; w++) {
          trafficCar.userData.wheels[w].rotation.x -= wheelDistance / 0.36;
        }
      }
      slot.position.x = ud.baseX;

      /* 被甩到身后就重新投放到玩家前方 —— 不能一路甩到「最前面那辆」后面，
         否则近处那段会越来越空，车全堆到远处收费站排队 */
      if (slot.position.z > cz + 45) {
        placeTraffic(slot, respawnZ(slot, list));
      }
    }
  }

  function addGas(amount) {
    var before = state.gas;
    state.gas = Math.min(CFG.GAS_MAX, state.gas + amount);
    if (state.gas > 0) state.gasDry = false;
    if (state.gas > CFG.GAS_LOW) state.gasWarned = false;
    return state.gas - before;
  }

  function scoreTraffic(ud) {
    var margin = ud.minAlt - ud.clearH;
    var gain, refund, label, color;
    if (ud.kind === 'row') {
      gain = CFG.ROW_SCORE; refund = CFG.ROW_REFUND; label = '跃过一排车'; color = '#ffd166';
    } else if (margin <= CFG.TRAFFIC_TIGHT) {
      gain = CFG.TRAFFIC_SCORE_TIGHT; refund = CFG.TRAFFIC_REFUND_TIGHT; label = '贴地跳过'; color = '#6ff0c0';
    } else if (margin <= CFG.TRAFFIC_CLEAN) {
      gain = CFG.TRAFFIC_SCORE; refund = CFG.TRAFFIC_REFUND_CLEAN; label = '跳过前车'; color = '#9fd0ff';
    } else {
      gain = CFG.TRAFFIC_SCORE_HIGH; refund = CFG.TRAFFIC_REFUND_HIGH; label = '高空飞越'; color = '#ffc46b';
    }
    state.score += gain;
    state.passedCars++;
    if (refund) addGas(refund);
    toast(label + '  +' + gain + (refund ? '  ·  冷气 +' + refund + '%' : ''), color);
    Sound.whoosh();
  }

  function trafficOverlapsPlayer(slot) {
    var ud = slot.userData;
    if (ud.kind === 'row') {
      for (var i = 0; i < ud.cars.length; i++) {
        var rowCar = ud.cars[i];
        if (rowCar.visible && Math.abs(state.carX - slot.position.x - rowCar.position.x) < 0.95 + rowCar.userData.width / 2) return true;
      }
      return false;
    }
    return Math.abs(state.carX - slot.position.x) < 0.95 + ud.width / 2;
  }

  function trafficSweepInterval(a,b,hx,hz,roof) {
    var lo=0,hi=1;
    function clip(p,q,min,max) {
      var v=q-p;
      if(Math.abs(v)<1e-10) return p>min && p<max;
      var t0=(min-p)/v,t1=(max-p)/v;
      if(t0>t1) {var s=t0;t0=t1;t1=s;}
      lo=Math.max(lo,t0);hi=Math.min(hi,t1);
      return lo<hi;
    }
    return clip(a.x,b.x,-hx,hx) && clip(a.z,b.z,-hz,hz) &&
      clip(a.y,b.y,-Infinity,roof);
  }
  var developerMode = new URLSearchParams(window.location.search).get('debug') === '1';
  var trafficDebugEnabled=false,trafficDebugHelpers=[];
  function makeCollisionHelper(color) {
    // The bundled three.js omits helper and line exports; use its built-in wireframe mode.
    var helper = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({
      color: color, wireframe: true, depthTest: false, depthWrite: false
    }));
    helper.box = new T.Box3();
    helper.renderOrder = 999;
    helper.frustumCulled = false;
    return helper;
  }
  function updateTrafficDebug() {
    if(!trafficDebugEnabled) return;
    var boxes=[{x:state.carX,y:state.alt+0.7,z:state.carZ,w:1.9,h:1.4,l:4.7}];
    traffic.concat(trafficSide).forEach(function(slot) {
      slot.userData.cars.forEach(function(v) {
        if(!v.visible) return;
        var d=v.userData;
        boxes.push({x:slot.position.x+v.position.x,
          y:slot.position.y+v.position.y+d.h/2,
          z:slot.position.z+v.position.z,w:d.width,h:d.h,l:d.len});
      });
    });
    boxes.forEach(function(b,i) {
      var h=trafficDebugHelpers[i];
      if(!h) {
        h=makeCollisionHelper(i===0?0x00ffcc:0xffaa33);
        scene.add(h);trafficDebugHelpers.push(h);
      }
      h.visible=true;
      h.box.min.set(b.x-b.w/2,b.y-b.h/2,b.z-b.l/2);
      h.box.max.set(b.x+b.w/2,b.y+b.h/2,b.z+b.l/2);
      h.position.set(b.x,b.y,b.z);
      h.scale.set(b.w,b.h,b.l);
    });
    for(var i=boxes.length;i<trafficDebugHelpers.length;i++)
      trafficDebugHelpers[i].visible=false;
  }
  function setTrafficDebug(enabled) {
    trafficDebugEnabled=!!enabled;
    trafficDebugHelpers.forEach(function(h) {
      scene.remove(h);h.geometry.dispose();h.material.dispose();
    });
    trafficDebugHelpers=[];
    var legend = document.getElementById('collisionLegend');
    if (legend) legend.classList.toggle('hidden', !trafficDebugEnabled);
    var button = document.getElementById('btnDebug');
    if (button) button.setAttribute('aria-pressed', String(trafficDebugEnabled));
    updateTrafficDebug();
  }
  function protectTrafficPlacement(slot){
    var all=traffic.concat(trafficSide),gap=Math.max(24,state.speed*1.6)*difficultyPhase().spacing,z=slot.position.z,valid=false;
    for(var attempt=0;attempt<256;attempt++){
      var next=z;
      all.forEach(function(other){
        if(other===slot||!other.userData._placementReady)return;
        var shared=slot.userData.kind==="row"||other.userData.kind==="row"||Math.abs(slot.position.x-other.position.x)<2.5;
        if(shared&&Math.abs(z-other.position.z)<gap)next=Math.min(next,other.position.z-gap-.01);
      });
      tolls.forEach(function(toll){
        if(Math.abs(next-toll.position.z)<CFG.HALF_DEPTH+26)next=Math.min(next,toll.position.z-CFG.HALF_DEPTH-26.01);
      });
      if(next===z){valid=true;break;}z=next;
    }
    if(!valid)throw Error("Traffic spacing search exhausted");
    slot.position.z=z;slot.userData._placementReady=true;slot.userData._flightRecords=null;
  }
  function updateTrafficLogic() {
    var prev=state._trafficBefore||{x:state.carX,y:state.alt,z:state.carZ};
    var all=traffic.concat(trafficSide),pending=[];
    for(var i=0;i<all.length;i++){
      var slot=all[i],ud=slot.userData,before=ud._motionBefore||slot.position;
      var records=ud._flightRecords||(ud._flightRecords=[]),behind=true,best=null;
      for(var j=0;j<ud.cars.length;j++){
        var v=ud.cars[j];if(!v.visible)continue;
        var d=v.userData,hx=.95+d.width/2,hz=2.35+d.len/2;
        var a={x:prev.x-before.x-v.position.x,y:prev.y-before.y-v.position.y,z:prev.z-before.z-v.position.z};
        var b={x:state.carX-slot.position.x-v.position.x,y:state.alt-slot.position.y-v.position.y,z:state.carZ-slot.position.z-v.position.z};
        if(trafficSweepInterval(a,b,hx,hz,d.h)){crash("traffic",{roof:d.h});return;}
        if(b.z>=-hz)behind=false;
        if(ud.passed)continue;
        var r=records[j]||(records[j]={entered:false,invalid:false,complete:false,minAlt:Infinity});
        if(!r.entered&&a.z>=hz&&b.z<hz){
          var t=(a.z-hz)/(a.z-b.z);
          if(Math.abs(a.x+(b.x-a.x)*t)<hx&&a.y+(b.y-a.y)*t>=d.h)r.entered=true;
        }
        if(r.entered&&!r.invalid&&!r.complete){
          if(b.z>=a.z)r.invalid=true;
          else{
            var lo=Math.max(0,(a.z-hz)/(a.z-b.z)),hi=Math.min(1,(a.z+hz)/(a.z-b.z));
            if(lo<=hi){
              if(Math.abs(a.x+(b.x-a.x)*lo)>=hx||Math.abs(a.x+(b.x-a.x)*hi)>=hx)r.invalid=true;
              r.minAlt=Math.min(r.minAlt,a.y+(b.y-a.y)*lo,a.y+(b.y-a.y)*hi);
            }
            if(b.z<=-hz&&!r.invalid)r.complete=isFinite(r.minAlt);
          }
        }
        if(r.complete&&!r.invalid){
          var margin=r.minAlt-d.h-CFG.TRAFFIC_MARGIN;
          if(!best||margin<best.margin)best={margin:margin,minAlt:r.minAlt,clearH:d.h+CFG.TRAFFIC_MARGIN};
        }
      }
      if(!ud.passed&&behind){
        ud.passed=true;
        if(best)pending.push({kind:ud.kind,minAlt:best.minAlt,clearH:best.clearH});
      }
    }
    pending.forEach(function(r){scoreTraffic(r);});
    state._trafficBefore=null;
  }

  /* 前车预警：按「还有几秒撞上」算，不看绝对距离 */
  function nearestTrafficThreat() {
    for (var i = 0; i < traffic.length + trafficSide.length; i++) {
      var slot = i < traffic.length ? traffic[i] : trafficSide[i - traffic.length], ud = slot.userData;
      if (ud.passed) continue;
      var xHit = trafficOverlapsPlayer(slot);
      if (!xHit) continue;
      var d = state.carZ - (slot.position.z + ud.len / 2);
      if (d <= 0) continue;
      var closing = Math.max(6, state.speed - ud.speed);
      if (d / closing < 1.15 && state.alt < ud.clearH + 0.25) return slot;
    }
    return null;
  }

  function updateHUD() {
    el.score.textContent = state.score;
    el.cleared.textContent = state.cleared;
    el.speed.textContent = Math.round(state.speed * 3.6);
    var phaseEl = document.getElementById('pace');
    if (phaseEl) phaseEl.textContent = difficultyPhase().label;
    var riskEl = document.getElementById('riskHint');
    if (riskEl) {
      var riskText = '完整飞越才补气 · 绕行更省气';
      var bestMargin = Infinity, rewardKind = '';
      traffic.concat(trafficSide).forEach(function (slot) {
        if (slot.userData.passed || !slot.userData._flightRecords) return;
        slot.userData._flightRecords.forEach(function (r, i) {
          if (!r.entered || r.invalid || r.complete) return;
          var margin = r.minAlt - slot.userData.cars[i].userData.h - CFG.TRAFFIC_MARGIN;
          if (margin < bestMargin) { bestMargin = margin; rewardKind = slot.userData.kind; }
        });
      });
      if (rewardKind) {
        var refund = rewardKind === 'row' ? CFG.ROW_REFUND : bestMargin <= CFG.TRAFFIC_TIGHT ?
          CFG.TRAFFIC_REFUND_TIGHT : bestMargin <= CFG.TRAFFIC_CLEAN ? CFG.TRAFFIC_REFUND_CLEAN : CFG.TRAFFIC_REFUND_HIGH;
        riskText = '飞越中 · 完整通过预计冷气 +' + refund + '%';
      }
      if (state.flipping) riskText = '横滚已消耗 ' + CFG.FLIP_GAS + '% 冷气 · 留足越站用气';
      if (riskEl.textContent !== riskText) riskEl.textContent = riskText;
    }

    var pct = Math.max(0, Math.min(1, state.alt / CFG.GAUGE_MAX));
    el.gaugeMarker.style.left = 'calc(' + (pct * 100).toFixed(1) + '% - 1px)';
    document.getElementById('altValue').textContent = state.alt.toFixed(1) + ' m';

    /* 冷气余量 —— 飞越车辆补充，上限为满罐 */
    var g = Math.max(0, Math.min(1, state.gas / CFG.GAS_MAX));
    var low = g <= CFG.GAS_LOW / CFG.GAS_MAX;
    el.gasFill.style.width = (g * 100).toFixed(1) + '%';
    el.gasFill.classList.toggle('low', low && g > 0.0005);
    el.gasFill.classList.toggle('empty', g <= 0.0005);
    el.gasTrack.classList.toggle('low', low && g > 0.0005);
    el.gasCaption.classList.toggle('low', low);
    document.getElementById('gasValue').textContent = Math.round(g * 100) + '%';

    /* 翻转按钮：现在能不能按、按下去是不是正在翻 */
    if (el.btnFlip) {
      var canFlip = state.mode === 'playing' && !state.flipping &&
        state.alt >= CFG.FLIP_MIN_ALT && state.gas >= CFG.FLIP_GAS;
      el.btnFlip.classList.toggle('on', canFlip);
      el.btnFlip.classList.toggle('flipping', state.flipping);
      el.btnFlip.classList.toggle('empty', state.gas < CFG.FLIP_GAS);
      el.btnFlip.style.setProperty('--p', state.flipping ? (state.flipT * 100).toFixed(1) : '0');
    }
  }

  /* 跟车相机：斜后方 3/4 视角（正后方会把车拍成一个方盒子，
     斜着看才有官方渲染图那种车身透视 —— 能看到车顶、侧面和尾部） */
  var CAM_SIDE = 1.00;        /* 接近正后方，只留少量侧面透视 */
  var CAM_BACK = 4.80;        /* 靠近车辆，让尾部细节在游戏画面中可辨 */
  var CAM_UP = 2.15;          /* 降低机位，减少俯视压扁尾板的感觉 */

  function updateCamera(dt) {
    var alt = state.alt;
    var spd = state.speed;

    /* 横滚时镜头往右后方让一点、退一点：车身在画面里是斜着转圈的，不至于糊成一团黑 */
    state.camFlip += ((state.flipping ? 1 : 0) - state.camFlip) * (1 - Math.pow(0.002, dt));

    camDesired.set(
      car.position.x * 0.5 + CAM_SIDE + state.camFlip * 2.4,
      CAM_UP + alt * 0.86 + state.camFlip * 0.8,
      car.position.z + CAM_BACK + (spd - CFG.BASE_SPEED) * 0.045 + state.camFlip * 1.4
    );

    var k1 = 1 - Math.pow(0.0016, dt);
    camera.position.lerp(camDesired, k1);

    /* 视线目标夹在车与相机之间（同样带一点横偏），车身落在画面中偏左，
       右侧留出道路纵深 —— 斜视角该有的构图 */
    lookDesired.set(
      car.position.x * 0.7 + CAM_SIDE * 0.22 + state.camFlip * 0.2,
      alt * 0.92 + 1.15 + state.camFlip * 0.5,
      car.position.z - 14
    );
    camLook.lerp(lookDesired, 1 - Math.pow(0.0022, dt));
    camera.lookAt(camLook);

    /* 震动 */
    if (state.shake > 0) {
      var s = state.shake;
      camera.position.x += (Math.random() - 0.5) * s * 1.6;
      camera.position.y += (Math.random() - 0.5) * s * 1.6;
      camera.rotation.z += (Math.random() - 0.5) * s * 0.05;
      state.shake = Math.max(0, state.shake - dt * 2.2);
    }

    var fov = 62 + Math.max(0, (spd - CFG.BASE_SPEED)) * 0.22 + Math.min(alt, 26) * 0.22;
    camera.fov += (Math.min(fov, 88) - camera.fov) * (1 - Math.pow(0.02, dt));
    camera.updateProjectionMatrix();
  }

  /* ------------------------------------------------------------------ *
   *  主循环
   * ------------------------------------------------------------------ */
  var clock = new T.Clock();
  var paused = false;   // 调试用：暂停时间推进但仍渲染（截图取姿态）
  var hudElapsed = 0;

  function rollWheels(distance) {
    roadster.wheels.forEach(function (wheel) {
      wheel.rotateX(distance / wheel.userData.rollRadius * wheel.userData.rollSign);
    });
  }

  function tick() {
    var dtReal = clock.getDelta();
    // The cover is opaque and the results use the last frame. Neither needs a live WebGL scene.
    // Consume the clock even while idle so resuming never creates a large physics delta.
    if (document.hidden || state.mode === 'ready' || state.mode === 'over') return;
    updateRenderQuality(dtReal);
    var dt = paused ? 0 : Math.min(dtReal, 0.05);   // 物理步长封顶，避免卡顿时穿模
    state.time += dt;

    var thrusting = false;

    if (state.mode === 'playing') {
      /* 连续提速：按行驶距离增加目标速度，每秒最多增加 0.65，过站时不跳变 */
      var targetSpeed = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + Math.max(0, -state.carZ) / CFG.TOLL_SPACING * CFG.SPEED_STEP);
      state.speed += Math.min(Math.max(0, targetSpeed - state.speed), difficultyPhase().acceleration * dt);
      state.maxSpeed = Math.max(state.maxSpeed, state.speed);

      state._trafficBefore={x:state.carX,y:state.alt,z:state.carZ};
      state.prevZ = state.carZ;
      state.carZ -= state.speed * dt;
      updateSteering(dt);
      rollWheels(state.speed * dt);

      /* 垂直运动 —— 冷气是定量的，烧完就再也点不着 */
      thrusting = state.thrusting && state.gas > 0;
      if (thrusting) {
        state.gas = Math.max(0, state.gas - CFG.GAS_BURN * dt);
        state.vy = Math.min(CFG.MAX_UP_V, state.vy + NET_THRUST * dt);

        if (state.gas <= CFG.GAS_LOW && !state.gasWarned) {
          state.gasWarned = true;
          toast('冷气不足 25%', '#ffc46b');
          Sound.warn();
        }
        if (state.gas <= 0 && !state.gasDry) {
          state.gasDry = true;
          Sound.dry();
          toast('冷气耗尽 —— 无法再起飞', '#ff8a6b');
        }
      } else {
        /* 空翻期间喷嘴一直在配平，车身被托住，重力只按一部分生效 */
        var gScale = state.flipping ? CFG.FLIP_GRAVITY : 1;
        state.vy = Math.max(-CFG.MAX_UP_V * 1.4, state.vy - CFG.GRAVITY * gScale * dt);
      }
      state.alt += state.vy * dt;
      /* 翻转中喷嘴托着车身：不让车头在 270° 那一下啃进路面 */
      var floorY = state.flipping ? CFG.FLIP_FLOOR : 0;
      if (state.alt <= floorY) {
        state.alt = floorY;
        if (state.vy < 0) {
          if (state.vy < -6 && floorY === 0) Sound.whoosh();
          state.vy = 0;
        }
        if (!state.flipping) state.airFlips = 0;   // 落地：连翻计数清零
      }

      /* 空中翻转：推进进度并结算 */
      if (state.flipCool > 0) state.flipCool = Math.max(0, state.flipCool - dt);
      if (state.flipping) {
        state.flipT = Math.min(1, state.flipT + dt / CFG.FLIP_DUR);
        /* 匀顺的整圈：起翻不突兀，收尾自己回正 */
        var ft = state.flipT;
        state.flip = ft * ft * (3 - 2 * ft) * Math.PI * 2;
        if (state.flipT >= 1) completeFlip();
      }

      /* 车姿态：绕车身纵轴横滚（发布会那个左右翻），轴心在车重中心而不是车底 */
      var fH = CFG.FLIP_PIVOT, fTh = state.flip * CFG.FLIP_DIR;
      car.position.set(state.carX + fH * Math.sin(fTh), state.alt + fH * (1 - Math.cos(fTh)), state.carZ);
      var pitch = Math.max(-0.42, Math.min(0.42, state.vy * 0.017)) * (state.flipping ? 0.25 : 1);
      state.pitch += (pitch - state.pitch) * (1 - Math.pow(0.001, dt));
      car.rotation.x = state.pitch;
      car.rotation.y += (-state.steer * 0.1 - car.rotation.y) * (1 - Math.pow(0.002, dt));
      car.rotation.z = fTh + Math.sin(state.time * 3.4) * 0.008 + (state.flipping ? 0 : state.steer * 0.04);

      updateWorldRecycle();
      updateTollLogic();
      if (state.mode === 'playing') {
        updateTraffic(dt);
        updateTrafficLogic();
        updateTrafficDebug();
      }

      if (state.mode === 'playing') {
        /* ---- 冷气推进器：车底向下顶、车尾向前踹、侧面成对配平 ---- */
        var on = thrusting;
        var boost = Math.min(1, Math.max(0, state.vy / CFG.MAX_UP_V));
        var airborne = state.alt > 0.6;
        var flipping = state.flipping;

        var sidePhase = (state.time % 0.72) / 0.72;
        var sideWave = Math.sin(sidePhase * Math.PI * 2);
        var sideR = (on && airborne) ? Math.max(0, sideWave) * 0.8 : 0;
        var sideL = (on && airborne) ? Math.max(0, -sideWave) * 0.8 : 0;

        /* 罐压下降 → 喷流变弱并开始断续（气快没了的样子） */
        var sputter = 1;
        if (state.gas < 14) {
          var sp = (state.time % 0.16) / 0.16;
          sputter = 0.34 + 0.66 * Math.max(0, Math.sin(sp * Math.PI * 2));
        }
        var power = on ? sputter : 0;

        var underJet = power * (0.55 + boost * 0.45);
        var rearJet = power * (0.45 + boost * 0.55);

        /* 空翻时姿态喷口接管：左右侧交替猛喷把车身翻过去，底喷托着不让它掉 */
        if (flipping) {
          var fw = Math.sin(state.flipT * Math.PI * 4);
          sideR = Math.max(0, fw);
          sideL = Math.max(0, -fw);
          underJet = Math.max(underJet, 0.34);
          rearJet = Math.max(rearJet, 0.18);
        }

        setJets(underJet, rearJet, sideL, sideR);

        roadster.thrustLight.intensity += (((on || flipping) ? 1.6 : 0) - roadster.thrustLight.intensity) * (1 - Math.pow(0.01, dt));

        /* ---- 白雾粒子：高压气体膨胀致冷，水汽凝结成白雾 ---- */
        if (on && !flipping && !paused) {
          var spread = state.alt < 1.7 ? 3.4 : 1.1;   // 贴近地面时气流向四周铺开
          for (var pe = 0; pe < 4; pe++) {
            psExhaust.spawn(
              state.carX + (Math.random() < 0.5 ? -0.55 : 0.55) + (Math.random() - 0.5) * 0.18,
              state.alt + 0.09,
              state.carZ + (Math.random() < 0.5 ? -0.75 : 1.30) + (Math.random() - 0.5) * 0.18,
              (Math.random() - 0.5) * spread,
              -3.5 - Math.random() * 5.5,
              (Math.random() - 0.5) * spread,
              0.94, 0.97, 1.0,
              0.30 + Math.random() * 0.42,
              0.22 + Math.random() * 0.26,
              0.90, 1.2, 1.3
            );
          }
          for (var pr = 0; pr < 3; pr++) {
            psExhaust.spawn(
              state.carX + (Math.random() < 0.5 ? -0.185 : 0.185) + (Math.random() - 0.5) * 0.06,
              state.alt + (Math.random() < 0.5 ? 0.47 : 0.58),
              state.carZ + 2.42,
              (Math.random() - 0.5) * 1.0,
              (Math.random() - 0.5) * 0.8,
              5 + Math.random() * 6,
              0.95, 0.98, 1.0,
              0.24 + Math.random() * 0.28,
              0.18 + Math.random() * 0.18,
              0.90, 1.0, 1.3
            );
          }
        }

        /* ---- 空翻配平：白雾从车身两侧甩出去，跟着车身一起转 ---- */
        if (flipping && !paused) {
          var fSign = Math.sin(state.flipT * Math.PI * 4) >= 0 ? 1 : -1;
          for (var pf = 0; pf < 3; pf++) {
            var fp = flipPoint(fSign * (0.80 + Math.random() * 0.25), 0.50, (Math.random() - 0.5) * 2.4);
            psExhaust.spawn(
              fp.x, fp.y, fp.z,
              fSign * (3.5 + Math.random() * 5.5),
              (Math.random() - 0.5) * 2.6,
              (Math.random() - 0.5) * 3.4,
              0.94, 0.97, 1.0,
              0.26 + Math.random() * 0.34,
              0.20 + Math.random() * 0.22,
              0.90, 1.1, 1.3
            );
          }
          /* 底喷托举 */
          for (var pb = 0; pb < 2; pb++) {
            var bp = flipPoint((Math.random() < 0.5 ? -0.55 : 0.55), 0.08, (Math.random() < 0.5 ? -0.75 : 1.30));
            psExhaust.spawn(
              bp.x, bp.y, bp.z,
              (Math.random() - 0.5) * 1.6,
              -2.4 - Math.random() * 3.2,
              (Math.random() - 0.5) * 1.6,
              0.94, 0.97, 1.0,
              0.28 + Math.random() * 0.30,
              0.18 + Math.random() * 0.20,
              0.90, 1.0, 1.3
            );
          }
        }
      }

      /* 速度音 */
      Sound.engineSpeed(Math.min(1, (state.speed - CFG.BASE_SPEED) / (CFG.MAX_SPEED - CFG.BASE_SPEED)));
      Sound.thrust(thrusting);

      hudElapsed += dt;
      if (hudElapsed >= 0.1) { updateHUD(); hudElapsed = 0; }

      /* 最佳点火光带 + 提示 */
      var nt = findNextToll();
      var dry = state.gas <= 0;
      /* 能横滚的时候，把快捷键缀在「不着急」的提示后面 —— 赶时间的两句不缀 */
      var flipReady = !state.flipping && state.alt >= CFG.FLIP_MIN_ALT && state.gas >= CFG.FLIP_GAS;
      var flipHint = flipReady ? (TOUCH ? '右下角「翻转」' : '<kbd>F</kbd>/右键 横滚') : '';

      if (dry) {
        takeoffLine.visible = false;
        el.dist.textContent = nt ? Math.round(nt.dist) : '---';
        el.prompt.classList.remove('hot');
        el.prompt.classList.add('dry');
        el.prompt.textContent = state.alt > 0.5
          ? '冷气耗尽 —— 飞越前车可补气'
          : '冷气耗尽 —— 左右移动躲避车流';
      } else if (nt && nt.dist < 190) {
        var ideal = RISE_TIME * state.speed + 9;   // 提前量留一点余量，点火带更好把握
        var pulse = 0.5 + 0.5 * Math.sin(state.time * 7);
        takeoffLine.visible = true;
        takeoffLine.position.z = nt.toll.position.z + CFG.HALF_DEPTH + ideal;
        tlBand.material.opacity = 0.28 + 0.34 * pulse;
        tlCore.material.opacity = 0.6 + 0.35 * pulse;
        el.dist.textContent = Math.max(0, Math.round(nt.dist));
        el.prompt.classList.remove('dry');

        if (nt.dist <= ideal * 1.45 && nt.dist >= ideal * 0.55) {
          el.prompt.classList.add('hot');
          el.prompt.textContent = '点火起飞！';
        } else if (nt.dist < ideal * 0.55) {
          el.prompt.classList.remove('hot');
          el.prompt.textContent = '太晚了 —— 快拉起来！';
        } else {
          el.prompt.classList.remove('hot');
          el.prompt.innerHTML = flipHint ? '准备点火…  ·  ' + flipHint : '准备点火…';
        }
      } else {
        takeoffLine.visible = false;
        el.dist.textContent = nt ? Math.round(nt.dist) : '---';
        el.prompt.classList.remove('hot');
        el.prompt.classList.remove('dry');
        if (state.flipping) {
          el.prompt.textContent = '横滚中 —— 喷嘴在配平';
        } else if (flipReady) {
          el.prompt.innerHTML = TOUCH
            ? '点右下角「翻转」横滚一圈'
            : '按 <kbd>F</kbd> 或鼠标右键 横滚一圈 · 冷气 −' + CFG.FLIP_GAS + '%';
        } else if (state.alt > 0.5) {
          el.prompt.textContent = '松开就下落 —— 稳住高度';
        } else {
          el.prompt.innerHTML = '长按 <kbd>空格</kbd> / 点击屏幕 点火起飞';
        }
      }

      /* 前车预警：马上要撞上就把提示语抢过来（正在「点火起飞」时不抢） */
      if (!dry && nearestTrafficThreat()) {
        if (!el.prompt.classList.contains('hot')) {
          el.prompt.classList.add('warn');
          el.prompt.textContent = '前车 —— 起跳！';
        }
      } else {
        el.prompt.classList.remove('warn');
      }
    } else if (state.mode === 'crashing') {
      state.crashTimer += Math.min(dtReal, 0.25);   // 用真实时间，低帧率下结算也不会拖慢
      state.prevZ = state.carZ;
      state.carZ -= state.speed * dt * 0.55;
      rollWheels(state.speed * dt * 0.55);
      state.vy -= CFG.GRAVITY * 0.55 * dt;
      state.alt = Math.max(0, state.alt + state.vy * dt);

      var cTh = state.flip * CFG.FLIP_DIR;
      car.position.set(state.carX + CFG.FLIP_PIVOT * Math.sin(cTh), state.alt + CFG.FLIP_PIVOT * (1 - Math.cos(cTh)), state.carZ);
      car.rotation.x += state.spin * dt;
      car.rotation.z += state.spin * 0.7 * dt;
      car.rotation.y += state.spin * 0.45 * dt;

      roadster.thrustLight.intensity = 0;
        roadster.jets.forEach(function (g) {
        g.userData.plumes.forEach(function (p) { p.visible = false; });
      });

      updateWorldRecycle();
      if (state.crashTimer > 1.15) finish();
    }

    psExhaust.update(dt);
    psBoom.update(dt);

    /* 阳光跟随 */
    sun.position.set(car.position.x + 55, 70, car.position.z - 95);
    sun.target.position.set(car.position.x, 0, car.position.z);
    sun.target.updateMatrixWorld();

    sky.position.copy(camera.position);

    updateCamera(dt);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(tick);

  /* ------------------------------------------------------------------ *
   *  输入
   * ------------------------------------------------------------------ */
  function pressDown() {
    if (state.mode === 'playing') state.thrusting = true;
  }
  function pressUp() {
    state.thrusting = false;
  }
  var thrustIds = {};   // 正在按住 canvas 的指针
  var steeringKeys = {};
  function changeLane(direction) {
    if (state.mode !== 'playing') return;
    var previous = state.laneIndex;
    state.laneIndex = Math.max(0, Math.min(2, previous + direction));
    if (previous === state.laneIndex) return;
    state.laneFromX = state.carX;
    state.laneChangeT = 0;
    state.laneChangeDuration = Math.max(0.08, CFG.LANE_CHANGE_TIME *
      Math.abs(CFG.LANE_CENTERS[state.laneIndex] - state.carX) / 5);
  }

  function updateSteering(dt) {
    var target = CFG.LANE_CENTERS[state.laneIndex];
    if (state.laneChangeT >= 1) { state.carX = target; state.steer = 0; return; }
    state.laneChangeT = Math.min(1, state.laneChangeT + dt / state.laneChangeDuration);
    var t = state.laneChangeT;
    var eased = t * t * (3 - 2 * t);
    state.carX = t >= 1 ? target : state.laneFromX + (target - state.laneFromX) * eased;
    state.steer = t >= 1 ? 0 : Math.sign(target - state.laneFromX) * Math.sin(t * Math.PI);
  }

  function clearControls() {
    steeringKeys = {};
    state.steer = 0;
    thrustIds = {};
    pressUp();
  }

  window.addEventListener('keydown', function (e) {
    /* Ctrl+F / Cmd+F 是浏览器查找，别当成横滚 */
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.code==='F2') {
      if (!developerMode) return;
      e.preventDefault();
      if(!e.repeat) setTrafficDebug(!trafficDebugEnabled);
      return;
    }
    if (/^(ArrowLeft|ArrowRight|KeyA|KeyD)$/.test(e.code)) {
      e.preventDefault();
      if (state.mode === 'playing' && !e.repeat && !steeringKeys[e.code]) {
        steeringKeys[e.code] = true;
        changeLane(e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : 1);
      }
    } else if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (state.mode === 'playing') pressDown();
      else if (state.mode === 'over') resetGame();
    } else if (e.key === 'r' || e.key === 'R') {
      if (state.mode === 'over') resetGame();
    } else if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F' ||
               e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.key === 'Shift') {
      e.preventDefault();
      if (e.repeat) return;
      startFlip();
    } else if (e.key === 'm' || e.key === 'M') {
      applyMute(!mutedPref);
    }
  });
  window.addEventListener('keyup', function (e) {
    if (/^(ArrowLeft|ArrowRight|KeyA|KeyD)$/.test(e.code)) {
      e.preventDefault();
      delete steeringKeys[e.code];
    }
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); pressUp(); }
  });

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    Sound.init();
    /* 鼠标右键 = 横滚，不点火；左键/手指仍然是点火 */
    if (e.button === 2) { startFlip(); return; }
    thrustIds[e.pointerId] = true;
    pressDown();
  });
  /* 右键菜单会挡住画面，直接吃掉 */
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  /* 只认「按在 canvas 上」的手指：右手点翻转按钮时，别把左手的推力一起掐了 */
  window.addEventListener('pointerup', function (e) {
    if (!thrustIds[e.pointerId]) return;
    delete thrustIds[e.pointerId];
    for (var k in thrustIds) { if (thrustIds[k]) return; }
    pressUp();
  });
  window.addEventListener('pointercancel', function (e) {
    if (!thrustIds[e.pointerId]) return;
    delete thrustIds[e.pointerId];
    for (var k in thrustIds) { if (thrustIds[k]) return; }
    pressUp();
  });
  window.addEventListener('blur', clearControls);

  ['btnLeft', 'btnRight'].forEach(function (id, index) {
    var button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (state.mode !== 'playing') return;
      changeLane(index === 0 ? -1 : 1);
      button.setPointerCapture(e.pointerId);
    });
  });

  el.btnStart.addEventListener('click', function () { resetGame(); });
  el.btnRetry.addEventListener('click', function () { resetGame(); });
  var debugButton = document.getElementById('btnDebug');
  if (debugButton) debugButton.addEventListener('click', function () { setTrafficDebug(!trafficDebugEnabled); });

  /* 翻转按钮（手机主入口，桌面也能点）—— 必须挡住，别让指针事件落到 canvas 上变成点火 */
  if (el.btnFlip) {
    el.btnFlip.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      Sound.init();
      startFlip();
    });
  }

  /* ------------------------------------------------------------------ *
   *  静音开关（按钮 / M 键，状态存本机）
   * ------------------------------------------------------------------ */
  var mutedPref = false;
  try { mutedPref = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { }
  function applyMute(v) {
    mutedPref = v;
    Sound.mute(v);
    if (el.btnMute) {
      el.btnMute.setAttribute('aria-pressed', v ? 'true' : 'false');
      el.btnMute.setAttribute('aria-label', v ? '取消静音' : '静音');
    }
    try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) { }
  }
  applyMute(mutedPref);
  if (el.btnMute) {
    el.btnMute.addEventListener('click', function (e) {
      e.stopPropagation();
      applyMute(!mutedPref);
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearControls(); Sound.engine(false); }
    else if (state.mode === 'playing') { Sound.init(); Sound.engine(true); }
  });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(renderPixelRatio());
  });

  /* ------------------------------------------------------------------ *
   *  色彩管理
   *  three r149 默认不做色彩管理，而渲染器输出为 sRGB；
   *  若直接把 sRGB 十六进制色当作线性色参与光照，画面会整体发灰发白。
   *  这里统一把材质色/自发光色转换到线性空间，让输出与所见一致。
   * ------------------------------------------------------------------ */
  scene.traverse(function (o) {
    if (!o.material) return;
    var mats = Array.isArray(o.material) ? o.material : [o.material];
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      if (m.userData && m.userData._linearized) continue;
      if (m.userData) m.userData._linearized = true;
      if (m.blending === T.AdditiveBlending) continue;   // 发光叠加保持鲜亮
      if (m.color && m.color.isColor) m.color.convertSRGBToLinear();
      if (m.emissive && m.emissive.isColor) m.emissive.convertSRGBToLinear();
    }
  });

  /* ------------------------------------------------------------------ *
   *  启动
   * ------------------------------------------------------------------ */
  /* 车流必须等颜色管理跑完再上色：材质在 traverse 里统一做过 sRGB→linear，
     提前上色会被二次转换，车身会黑成一块炭 */
  for (var si2 = 0; si2 < traffic.length; si2++) {
    placeTraffic(traffic[si2], freeTrafficZ(-(180 + si2 * CFG.TRAFFIC_GAP_START)), si2 === 3 ? 'row' : 'car');
  }
  for (var sj = 0; sj < trafficSide.length; sj++) {
    placeTraffic(trafficSide[sj], freeTrafficZ(-(130 + sj * 82)), 'car');
  }

  updateWorldRecycle();
  updateHUD();
  el.best.textContent = state.best;
  if (loadingEl) loadingEl.classList.add('hidden');

  /* 调试钩子：可在控制台查看状态、手动改参数 */
  window.__roadster = {
    state: state, CFG: CFG, tolls: tolls, traffic: traffic, trafficSide: trafficSide, reset: resetGame, flip: startFlip, place: placeTraffic,
    pause: function (v) { paused = v !== false; }, camLook: camLook, ps: psExhaust,
    renderer: renderer, camera: camera, scene: scene, car: car, roadster: roadster
  };
})();
