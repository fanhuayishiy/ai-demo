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
    TOLL_SPACING: 210,       // 收费站间距
    FIRST_TOLL: 190,         // 第一个收费站距离
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
    SPEED_STEP: 2.4,         // 每过一站提速
    MAX_SPEED: 84,
    SCORE_PER_TOLL: 100,
    GAUGE_MAX: 36,

    /* 冷气（氮气）推进剂：一次性装填，全程不再补充 */
    GAS_MAX: 100,            // 总装填量（%）
    GAS_BURN: 20,            // 每秒消耗（%）→ 满罐只有 5 秒总点火时间
    GAS_LOW: 25,             // 低量警戒线（%）

    /* 低空飞越返还：点火越晚、穿站越低，回收的冷气越多。
       门槛按实测标定 —— 跟着蓝色提示点火并抬到 9.3 时，穿站高度约 19；
       每延迟点火 80ms 约降低 1 个高度单位，压到 13 已是精细操作。 */
    GAS_REFUND_TIGHT: 8,     // 车底最低点 ≤ CLEAR_ALT + TIGHT_MARGIN
    GAS_REFUND_CLEAN: 4,     // ≤ CLEAR_ALT + CLEAN_MARGIN
    TIGHT_MARGIN: 4.4,       // → 13.0
    CLEAN_MARGIN: 8.4,       // → 17.0
    REFUND_SCORE: 6,         // 每返还 1% 冷气额外给的分

    /* 收费站间距：正常 170–250 随机，每 DOUBLE_EVERY 个间隔插一次「连站」 */
    TOLL_GAP_MIN: 170,
    TOLL_GAP_MAX: 250,
    TOLL_GAP_DOUBLE: 110,
    DOUBLE_EVERY: 4
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var HORIZON = 0xa9cce9;                    // 雾色与天空地平线保持同色，避免出现硬边
  scene.fog = new T.Fog(0xffffff, 70, 470);
  scene.fog.color.setHex(HORIZON).convertSRGBToLinear();

  var camera = new T.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.6, 1600);
  camera.position.set(0, 6, 14);

  /* ---------------- 天空 ---------------- */
  var skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      cTop: { value: new T.Color(0x1d5ba3) },
      cMid: { value: new T.Color(HORIZON) },
      cBot: { value: new T.Color(0xb9d2e4) }
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
      '  vec3 c = h > 0.0 ? mix(cMid, cTop, pow(h, 0.62)) : mix(cMid, cBot, pow(-h, 0.42));' +
      /* 淡淡的云层：三层噪声叠出大团块，靠近地平线淡出，避免规则条带 */
      '  if (h > 0.015) {' +
      '    vec2 uv = d.xz / (h + 0.22) * 1.35;' +
      '    float n = noise(uv) * 0.55 + noise(uv * 2.4) * 0.30 + noise(uv * 5.3) * 0.15;' +
      '    float cl = smoothstep(0.52, 0.86, n) * smoothstep(0.015, 0.30, h);' +
      '    c = mix(c, vec3(1.0, 1.0, 0.985), cl * 0.62);' +
      '  }' +
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
  scene.add(new T.HemisphereLight(0xf2f6fa, 0x6b6b62, 0.42));

  var sun = new T.DirectionalLight(0xfff3dd, 0.92);
  sun.position.set(55, 95, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
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
    g.fillStyle = '#57763f'; g.fillRect(0, 0, 256, 256);
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
    g.fillStyle = '#3b4048'; g.fillRect(0, 0, 256, 256);
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
    new T.MeshStandardMaterial({ color: 0x35552f, roughness: 1 }),
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
    new T.MeshStandardMaterial({ color: 0x47603f, roughness: 1 }),
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

  /* 间距生成器：正常 170–250 随机，每 DOUBLE_EVERY 个间隔来一次「连站」 */
  var gapCount = 0;
  function nextTollGap() {
    gapCount++;
    if (gapCount % CFG.DOUBLE_EVERY === 0) return CFG.TOLL_GAP_DOUBLE + Math.random() * 14;
    return CFG.TOLL_GAP_MIN + Math.random() * (CFG.TOLL_GAP_MAX - CFG.TOLL_GAP_MIN);
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
    pts.frustumCulled = false;
    scene.add(pts);

    var P = {
      count: count, head: 0,
      pos: position, col: aColor, size: aSize, alpha: aAlpha,
      vx: new Float32Array(count), vy: new Float32Array(count), vz: new Float32Array(count),
      life: new Float32Array(count), maxLife: new Float32Array(count),
      r: new Float32Array(count), g: new Float32Array(count), b: new Float32Array(count),
      drag: new Float32Array(count), grav: new Float32Array(count), power: new Float32Array(count),
      geo: geo
    };

    P.spawn = function (x, y, z, vx, vy, vz, r, g, b, size, life, drag, grav, power) {
      var i = P.head; P.head = (P.head + 1) % count;
      P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z;
      P.vx[i] = vx; P.vy[i] = vy; P.vz[i] = vz;
      P.r[i] = r; P.g[i] = g; P.b[i] = b;
      P.col[i * 3] = r; P.col[i * 3 + 1] = g; P.col[i * 3 + 2] = b;
      P.size[i] = size;
      P.life[i] = life; P.maxLife[i] = life;
      P.alpha[i] = 1;
      P.drag[i] = drag; P.grav[i] = grav; P.power[i] = power;
    };

    P.update = function (dt) {
      for (var i = 0; i < count; i++) {
        if (P.life[i] <= 0) { if (P.alpha[i] !== 0) P.alpha[i] = 0; continue; }
        P.life[i] -= dt;
        if (P.life[i] <= 0) { P.alpha[i] = 0; P.size[i] = 0; continue; }
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
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    };

    P.reset = function () {
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

    function mute(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.42; }

    return {
      init: init, engine: engine, engineSpeed: engineSpeed, thrust: thrust,
      boom: boom, ding: ding, whoosh: whoosh, warn: warn, dry: dry, mute: mute
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
    flash: document.getElementById('flash')
  };

  /* 仪表标尺 */
  (function layoutGauge() {
    var g = CFG.GAUGE_MAX;
    var safeBottom = (CFG.CLEAR_ALT / g) * 100;
    var safeTop = (CFG.MAX_ALT / g) * 100;
    el.gaugeSafe.style.bottom = safeBottom + '%';
    el.gaugeSafe.style.height = (safeTop - safeBottom) + '%';
    el.gaugeDanger.style.bottom = safeTop + '%';
    el.gaugeDanger.style.height = (100 - safeTop) + '%';
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
        '<span>' + r.cleared + ' 站 · ' + (r.kind === 'sky' ? '飞过头' : '撞上收费站') + '</span>' +
        '<time>' + stamp + '</time>';
      el.boardList.appendChild(li);
    });
  }

  var state = {
    mode: 'ready',      // ready | playing | crashing | over
    carZ: 0,
    prevZ: 0,
    alt: 0,
    vy: 0,
    speed: CFG.BASE_SPEED,
    score: 0,
    cleared: 0,
    refunds: 0,         // 贴顶/干净飞越次数（返还冷气的站数）
    best: 0,
    thrusting: false,
    gas: CFG.GAS_MAX,   // 剩余冷气（%），只减不增
    gasDry: false,      // 是否已经烧干过
    gasWarned: false,   // 低量提示只响一次
    crashKind: '',
    crashTimer: 0,
    shake: 0,
    maxSpeed: 0,
    spin: 0,
    time: 0
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
    state.prevZ = 0;
    state.alt = 0;
    state.vy = 0;
    state.speed = CFG.BASE_SPEED;
    state.score = 0;
    state.cleared = 0;
    state.refunds = 0;
    state.thrusting = false;
    state.gas = CFG.GAS_MAX;      // 每次重新出发都是满罐，中途不会补充
    state.gasDry = false;
    state.gasWarned = false;
    state.crashKind = '';
    state.crashTimer = 0;
    state.shake = 0;
    state.maxSpeed = CFG.BASE_SPEED;
    state.spin = 0;

    for (var i = 0; i < tolls.length; i++) {
      tolls[i].position.z = -(CFG.FIRST_TOLL + i * CFG.TOLL_SPACING);
      tolls[i].rotation.set(0, 0, 0);
      tolls[i].userData.passed = false;
      tolls[i].userData.minAlt = Infinity;
    }
    gapCount = 0;
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
    el.prompt.innerHTML = '长按 <kbd>空格</kbd> / 点击屏幕 点火起飞';
    el.best.textContent = state.best;
    updateHUD();

    Sound.init();
    Sound.engine(true);
    Sound.engineSpeed(0);
    Sound.thrust(false);
  }

  function crash(kind) {
    if (state.mode !== 'playing') return;
    state.mode = 'crashing';
    state.crashKind = kind;
    state.crashTimer = 0;
    state.shake = 1;
    state.thrusting = false;

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
    Sound.engine(false);
    Sound.thrust(false);

    var prevBest = state.best;
    if (state.score > state.best) {
      state.best = state.score;
      try { localStorage.setItem(BEST_KEY, String(state.best)); } catch (e) { }
    }

    var titles = {
      toll: '撞上收费站',
      sky: '飞过头，冲出马路'
    };
    var descs = {
      toll: '点火太晚，车身还没抬起来就撞上了收费站的栏杆和顶棚。下次看到蓝色光带就按住。',
      sky: '推力给太猛，Roadster 直接窜上平流层，错过了整条公路。松手要果断。'
    };
    if (state.gas <= 0 && state.crashKind === 'toll') {
      titles.toll = '冷气耗尽 · 撞上收费站';
      descs.toll = 'A71 冷气推进器的储罐空了。它不烧燃料，靠的是预装的高压冷气，一趟任务里不会补充 —— 罐子见底就只能贴地滑行。起飞时机要准，按住不放最费气。';
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
   *  通过收费站
   * ------------------------------------------------------------------ */
  function onCleared(minAlt) {
    state.cleared++;

    /* 贴顶程度决定冷气返还：贴着顶棚飞比猛喷更划算 */
    var margin = minAlt - CFG.CLEAR_ALT;
    var refund = 0, label = '';
    if (margin <= CFG.TIGHT_MARGIN) { refund = CFG.GAS_REFUND_TIGHT; label = '贴顶飞越'; }
    else if (margin <= CFG.CLEAN_MARGIN) { refund = CFG.GAS_REFUND_CLEAN; label = '低空飞越'; }
    if (refund > 0) state.gas = Math.min(CFG.GAS_MAX, state.gas + refund);

    var gain = CFG.SCORE_PER_TOLL + Math.round((state.speed - CFG.BASE_SPEED) * 4) + refund * CFG.REFUND_SCORE;
    state.score += gain;
    state.speed = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + state.cleared * CFG.SPEED_STEP);
    Sound.ding();
    Sound.whoosh();
    if (label) {
      state.refunds++;
      toast(label + '  +' + gain + '  ·  冷气 +' + refund + '%', '#6ff0c0');
    } else {
      toast('飞越成功  +' + gain, '#6ff0c0');
    }
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

  function updateWorldRecycle() {
    var cz = state.carZ;

    road.position.z = cz; grass.position.z = cz;
    for (var i = 0; i < shoulders.length; i++) shoulders[i].position.z = cz;
    for (var e = 0; e < edgeLines.length; e++) edgeLines[e].position.z = cz;
    for (var r = 0; r < rails.length; r++) rails[r].position.z = cz;

    /* 虚线 */
    for (var d = 0; d < DASH_N; d++) if (dashZ[d] > cz + 40) dashZ[d] -= DASH_SPAN;
    var m = new T.Matrix4();
    for (var k = 0; k < DASH_N; k++) {
      m.makeTranslation(CFG.LANE_X[0], 0.016, dashZ[k]);
      dashIM.setMatrixAt(k * 2, m);
      m.makeTranslation(CFG.LANE_X[1], 0.016, dashZ[k]);
      dashIM.setMatrixAt(k * 2 + 1, m);
    }
    dashIM.instanceMatrix.needsUpdate = true;

    /* 护栏立柱 */
    for (var p = 0; p < POST_N; p++) if (postZ[p] > cz + 40) postZ[p] -= POST_SPAN;
    for (var p2 = 0; p2 < POST_N; p2++) {
      m.makeTranslation(-(CFG.ROAD_HALF + 2.0), 0.45, postZ[p2]);
      postIM.setMatrixAt(p2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 2.0, 0.45, postZ[p2]);
      postIM.setMatrixAt(p2 * 2 + 1, m);
    }
    postIM.instanceMatrix.needsUpdate = true;

    /* 路灯 */
    for (var q = 0; q < POLE_N; q++) if (poleZ[q] > cz + 60) poleZ[q] -= POLE_SPAN;
    for (var q2 = 0; q2 < POLE_N; q2++) {
      m.makeTranslation(-(CFG.ROAD_HALF + 3.4), 4.2, poleZ[q2]);
      poleIM.setMatrixAt(q2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 3.4, 4.2, poleZ[q2]);
      poleIM.setMatrixAt(q2 * 2 + 1, m);
      m.makeTranslation(-(CFG.ROAD_HALF + 2.0), 8.3, poleZ[q2]);
      lampIM.setMatrixAt(q2 * 2, m);
      m.makeTranslation(CFG.ROAD_HALF + 2.0, 8.3, poleZ[q2]);
      lampIM.setMatrixAt(q2 * 2 + 1, m);
    }
    poleIM.instanceMatrix.needsUpdate = true;
    lampIM.instanceMatrix.needsUpdate = true;

    /* 树 */
    for (var t2 = 0; t2 < TREE_N; t2++) {
      if (treeZ[t2] > cz + 80) treeZ[t2] -= TREE_SPAN;
      m.makeScale(2.2, 1.6, 2.2);
      m.setPosition(treeX[t2], 1.1, treeZ[t2]);
      treeIM.setMatrixAt(t2, m);
    }
    treeIM.instanceMatrix.needsUpdate = true;

    /* 远景丘陵带 */
    for (var l2 = 0; l2 < TL_N; l2++) {
      if (tlZ[l2] > cz + 140) tlZ[l2] -= TL_SPAN;
      m.makeScale(tlW[l2], tlH[l2], tlW[l2] * 1.5);
      m.setPosition(tlX[l2], 0, tlZ[l2]);
      tlIM.setMatrixAt(l2, m);
    }
    tlIM.instanceMatrix.needsUpdate = true;

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

      if (inside && ud.minAlt < CFG.CLEAR_ALT) { crash('toll'); return; }

      if (prevZ > zB && cz <= zB) {
        ud.passed = true;
        if (ud.minAlt < CFG.CLEAR_ALT) { crash('toll'); return; }
        onCleared(ud.minAlt);
      }
    }

    if (state.alt > CFG.MAX_ALT) { crash('sky'); return; }
  }

  function updateHUD() {
    el.score.textContent = state.score;
    el.cleared.textContent = state.cleared;
    el.speed.textContent = Math.round(state.speed * 3.6);

    var pct = Math.max(0, Math.min(1, state.alt / CFG.GAUGE_MAX));
    el.gaugeMarker.style.bottom = 'calc(' + (pct * 100).toFixed(1) + '% - 2px)';

    /* 冷气余量 —— 只减不增 */
    var g = Math.max(0, Math.min(1, state.gas / CFG.GAS_MAX));
    var low = g <= CFG.GAS_LOW / CFG.GAS_MAX;
    el.gasFill.style.height = (g * 100).toFixed(1) + '%';
    el.gasFill.classList.toggle('low', low && g > 0.0005);
    el.gasFill.classList.toggle('empty', g <= 0.0005);
    el.gasTrack.classList.toggle('low', low && g > 0.0005);
    el.gasCaption.classList.toggle('low', low);
    el.gasCaption.textContent = '冷气 ' + Math.round(g * 100) + '%';
  }

  /* 跟车相机：斜后方 3/4 视角（正后方会把车拍成一个方盒子，
     斜着看才有官方渲染图那种车身透视 —— 能看到车顶、侧面和尾部） */
  var CAM_SIDE = 1.00;        /* 接近正后方，只留少量侧面透视 */
  var CAM_BACK = 4.80;        /* 靠近车辆，让尾部细节在游戏画面中可辨 */
  var CAM_UP = 2.15;          /* 降低机位，减少俯视压扁尾板的感觉 */

  function updateCamera(dt) {
    var alt = state.alt;
    var spd = state.speed;

    camDesired.set(
      car.position.x * 0.5 + CAM_SIDE,
      CAM_UP + alt * 0.86,
      car.position.z + CAM_BACK + (spd - CFG.BASE_SPEED) * 0.045
    );

    var k1 = 1 - Math.pow(0.0016, dt);
    camera.position.lerp(camDesired, k1);

    /* 视线目标夹在车与相机之间（同样带一点横偏），车身落在画面中偏左，
       右侧留出道路纵深 —— 斜视角该有的构图 */
    lookDesired.set(
      car.position.x * 0.7 + CAM_SIDE * 0.22,
      alt * 0.92 + 1.15,
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

  function rollWheels(distance) {
    roadster.wheels.forEach(function (wheel) {
      wheel.rotateX(distance / wheel.userData.rollRadius * wheel.userData.rollSign);
    });
  }

  function tick() {
    var dtReal = clock.getDelta();
    var dt = Math.min(dtReal, 0.05);   // 物理步长封顶，避免卡顿时穿模
    state.time += dt;

    var thrusting = false;

    if (state.mode === 'playing') {
      state.speed = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + state.cleared * CFG.SPEED_STEP);
      state.maxSpeed = Math.max(state.maxSpeed, state.speed);

      state.prevZ = state.carZ;
      state.carZ -= state.speed * dt;
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
        state.vy = Math.max(-CFG.MAX_UP_V * 1.4, state.vy - CFG.GRAVITY * dt);
      }
      state.alt += state.vy * dt;
      if (state.alt <= 0) {
        state.alt = 0;
        if (state.vy < 0) {
          if (state.vy < -6) Sound.whoosh();
          state.vy = 0;
        }
      }

      /* 车姿态 */
      car.position.set(0, state.alt, state.carZ);
      var pitch = Math.max(-0.42, Math.min(0.42, state.vy * 0.017));
      car.rotation.x += (pitch - car.rotation.x) * (1 - Math.pow(0.001, dt));
      car.rotation.z = Math.sin(state.time * 3.4) * 0.008;

      updateWorldRecycle();
      updateTollLogic();

      if (state.mode === 'playing') {
        /* ---- 冷气推进器：车底向下顶、车尾向前踹、侧面成对配平 ---- */
        var on = thrusting;
        var boost = Math.min(1, Math.max(0, state.vy / CFG.MAX_UP_V));
        var airborne = state.alt > 0.6;

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

        setJets(
          power * (0.55 + boost * 0.45),
          power * (0.45 + boost * 0.55),
          sideL * power, sideR * power
        );

        roadster.thrustLight.intensity += ((on ? 1.6 : 0) - roadster.thrustLight.intensity) * (1 - Math.pow(0.01, dt));

        /* ---- 白雾粒子：高压气体膨胀致冷，水汽凝结成白雾 ---- */
        if (on) {
          var spread = state.alt < 1.7 ? 3.4 : 1.1;   // 贴近地面时气流向四周铺开
          for (var pe = 0; pe < 4; pe++) {
            psExhaust.spawn(
              (Math.random() < 0.5 ? -0.55 : 0.55) + (Math.random() - 0.5) * 0.18,
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
              (Math.random() < 0.5 ? -0.185 : 0.185) + (Math.random() - 0.5) * 0.06,
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
      }

      /* 速度音 */
      Sound.engineSpeed(Math.min(1, (state.speed - CFG.BASE_SPEED) / (CFG.MAX_SPEED - CFG.BASE_SPEED)));
      Sound.thrust(thrusting);

      updateHUD();

      /* 最佳点火光带 + 提示 */
      var nt = findNextToll();
      var dry = state.gas <= 0;

      if (dry) {
        takeoffLine.visible = false;
        el.dist.textContent = nt ? Math.round(nt.dist) : '---';
        el.prompt.classList.remove('hot');
        el.prompt.classList.add('dry');
        el.prompt.textContent = state.alt > 0.5
          ? '冷气耗尽 —— 只能往下掉了'
          : '冷气耗尽 —— 贴地滑行，躲不开了';
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
          el.prompt.textContent = '准备点火…';
        }
      } else {
        takeoffLine.visible = false;
        el.dist.textContent = nt ? Math.round(nt.dist) : '---';
        el.prompt.classList.remove('hot');
        el.prompt.classList.remove('dry');
        el.prompt.textContent = state.alt > 0.5 ? '松开就下落 —— 稳住高度' : '长按 <kbd>空格</kbd> / 点击屏幕 点火起飞';
      }
    } else if (state.mode === 'crashing') {
      state.crashTimer += Math.min(dtReal, 0.25);   // 用真实时间，低帧率下结算也不会拖慢
      state.prevZ = state.carZ;
      state.carZ -= state.speed * dt * 0.55;
      rollWheels(state.speed * dt * 0.55);
      state.vy -= CFG.GRAVITY * 0.55 * dt;
      state.alt = Math.max(0, state.alt + state.vy * dt);

      car.position.set(0, state.alt, state.carZ);
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
    sun.position.set(car.position.x + 55, 95, car.position.z + 40);
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

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (state.mode === 'playing') pressDown();
      else if (state.mode === 'over') resetGame();
    } else if (e.key === 'r' || e.key === 'R') {
      if (state.mode === 'over') resetGame();
    } else if (e.key === 'm' || e.key === 'M') {
      applyMute(!mutedPref);
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); pressUp(); }
  });

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    Sound.init();
    pressDown();
  });
  window.addEventListener('pointerup', pressUp);
  window.addEventListener('pointercancel', pressUp);
  window.addEventListener('blur', pressUp);

  el.btnStart.addEventListener('click', function () { resetGame(); });
  el.btnRetry.addEventListener('click', function () { resetGame(); });

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
    if (document.hidden) { pressUp(); Sound.engine(false); }
    else if (state.mode === 'playing') { Sound.init(); Sound.engine(true); }
  });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
  updateWorldRecycle();
  updateHUD();
  el.best.textContent = state.best;
  if (loadingEl) loadingEl.classList.add('hidden');

  /* 调试钩子：可在控制台查看状态、手动改参数 */
  window.__roadster = {
    state: state, CFG: CFG, tolls: tolls, reset: resetGame,
    renderer: renderer, camera: camera, scene: scene, car: car, roadster: roadster
  };
})();
