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
    GAS_LOW: 25              // 低量警戒线（%）
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
  /* 半球光的地面色偏灰一点：原来是饱和的橄榄绿，会在银色车漆的侧面染出绿调 */
  scene.add(new T.HemisphereLight(0xdcefff, 0x5b6052, 0.38));

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

  /* ------------------------------------------------------------------ *
   *  几何工具 —— 截面放样：用一串平滑横截面 loft 出真正的曲面车壳
   * ------------------------------------------------------------------ */
  function catmullRom(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  /* 8 个控制点描述一个车体横截面。
     平滑模式：闭合 Catmull-Rom 采样，得到圆润过渡。
     折面模式（c.facet）：控制点直接当顶点、段间直线相连，得到平板折面。
     真车 Roadster 2 是「隐形战机」式的大平面拼板 —— 机盖、翼子板、车侧
     都是几块平板在锐利棱线处交汇，圆滑插值只会把棱角全部磨没。 */
  function sectionOutline(c, samples) {
    var ctrl = [
      [c.hw, c.ys],
      [c.hwt, c.yt],
      [0, c.yt + (c.crown || 0)],
      [-c.hwt, c.yt],
      [-c.hw, c.ys],
      [-c.hwb, c.yb],
      [0, c.yb],
      [c.hwb, c.yb]
    ];
    if (c.facet) return ctrl.map(function (p) { return [p[0], p[1]]; });
    var n = ctrl.length, out = [], i, j;
    for (i = 0; i < n; i++) {
      var p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
      for (j = 0; j < samples; j++) {
        var t = j / samples;
        out.push([
          catmullRom(p0[0], p1[0], p2[0], p3[0], t),
          catmullRom(p0[1], p1[1], p2[1], p3[1], t)
        ]);
      }
    }
    return out;
  }

  /* 放样。split=true 时按面片拆分顶点：
     面片之间不共享顶点 → 棱线是硬边（法线不会被相邻面平均掉）；
     同一面片沿 z 方向共享顶点 → 沿车长方向仍然平滑，不会出现一圈圈等高线。
     这是折面车身的关键：横向是锐利棱线，纵向是顺滑的型面 sweep。 */
  function loftGeometry(sections, capFront, capBack, split) {
    var N = sections[0].pts.length, S = sections.length;
    var pos = [], idx = [], s, i;
    var stride = split ? 2 * N : N;
    var at = function (s2, i2) { return s2 * stride + (split ? 2 * i2 : i2); };

    for (s = 0; s < S; s++) {
      if (split) {
        for (i = 0; i < N; i++) {
          var p = sections[s].pts[i];
          pos.push(p[0], p[1], sections[s].z);   /* 面片 i 的起点 = 点 i */
          pos.push(p[0], p[1], sections[s].z);   /* 面片 i 的终点 = 点 i+1（复制一份） */
        }
      } else {
        for (i = 0; i < N; i++) pos.push(sections[s].pts[i][0], sections[s].pts[i][1], sections[s].z);
      }
    }
    for (s = 0; s < S - 1; s++) {
      for (i = 0; i < N; i++) {
        var a = at(s, i), b = at(s, (i + 1) % N);
        var c = at(s + 1, (i + 1) % N), d = at(s + 1, i);
        idx.push(a, b, c, a, c, d);
      }
    }
    if (capFront) {
      var ci = pos.length / 3, cx = 0, cy = 0;
      for (i = 0; i < N; i++) { cx += sections[0].pts[i][0]; cy += sections[0].pts[i][1]; }
      pos.push(cx / N, cy / N, sections[0].z);
      for (i = 0; i < N; i++) idx.push(ci, at(0, (i + 1) % N), at(0, i));
    }
    if (capBack) {
      var base = (S - 1) * stride, ci2 = pos.length / 3, cx2 = 0, cy2 = 0;
      for (i = 0; i < N; i++) { cx2 += sections[S - 1].pts[i][0]; cy2 += sections[S - 1].pts[i][1]; }
      pos.push(cx2 / N, cy2 / N, sections[S - 1].z);
      for (i = 0; i < N; i++) idx.push(ci2, base + at(0, i), base + at(0, (i + 1) % N));
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* 在参数表上按 z 线性插值 */
  function sampleProfile(table, z) {
    var first = table[0], last = table[table.length - 1];
    if (z <= first[0]) return first.slice(1);
    if (z >= last[0]) return last.slice(1);
    for (var i = 0; i < table.length - 1; i++) {
      if (z >= table[i][0] && z <= table[i + 1][0]) {
        var a = table[i], b = table[i + 1];
        var t = (z - a[0]) / (b[0] - a[0]);
        var out = [];
        for (var k = 1; k < a.length; k++) out.push(a[k] + (b[k] - a[k]) * t);
        return out;
      }
    }
    return last.slice(1);
  }

  /* 由参数表生成放样体。opt.arches 用来在车侧挖出轮拱 */
  function buildShell(table, opt) {
    var step = opt.step || 0.045;
    /* extraSecs：在等距截面网格之外，按指定 z 补插截面。
       用途：参数表里有尖折角（如车尾行李厢面在 z=1.03 的陡坎）而
       等距网格恰好跨过折角时，线性放样会把折角抹平 —— 补一个
       落在折角上的截面，陡坎才立得起来。 */
    var zs = [];
    for (var z = opt.z0; z <= opt.z1 + 1e-6; z += step) zs.push(z);
    if (opt.extraSecs) {
      for (var ei = 0; ei < opt.extraSecs.length; ei++) {
        var ze = opt.extraSecs[ei];
        if (ze > opt.z0 + 1e-9 && ze <= opt.z1 + 1e-6 && zs.indexOf(ze) < 0) zs.push(ze);
      }
      zs.sort(function (a, b) { return a - b; });
    }
    var secs = [];
    for (var zi = 0; zi < zs.length; zi++) {
      var z = zs[zi];
      var p = sampleProfile(table, z);
      var hw = p[0], hwt = p[1], hwb = p[2], ys = p[3], yt = p[4], yb = p[5];
      /* 第 8 列 dip：顶面中央相对两侧翼子板的下凹量（真车机盖是中间低的槽，
         不是一整块鼓起来的穹顶）。负 crown 正好做出这条槽。 */
      var dip = p[6] || 0;

      if (opt.arches) {
        for (var a = 0; a < opt.arches.length; a++) {
          var ar = opt.arches[a], d = z - ar.zc;
          if (Math.abs(d) >= ar.R) continue;
          /* 方角轮拱：中间一段保持平顶，两端沿圆弧滑下去。拐角是硬顶点，
             正好配 facet 折面，做出真车那种有棱的轮眉而不是圆弧。 */
          var flat = ar.R * (ar.flat === undefined ? 0.40 : ar.flat);
          var h = Math.abs(d) < flat
            ? ar.yc + Math.sqrt(ar.R * ar.R - flat * flat)
            : ar.yc + Math.sqrt(ar.R * ar.R - d * d);
          yb = Math.max(yb, h);
        }
      }
      /* hwFn：按外部参考（如车身型面）改写横向尺寸。用于"贴在车身外侧"
         的薄壳 —— 它必须贴着车身宽度走，不能只靠固定 scale。
         第二个参数 p 是该 z 处的原始参数行 [hw,hwt,hwb,ys,yt,yb,dip]，
         便于只改其中一列（例如只加宽 hw 而保留窄 hwt）。 */
      if (opt.hwFn) {
        var hwp = opt.hwFn(z, p);
        hw = hwp[0]; hwt = hwp[1];
      }
      /* ysFn：压低/抬高肩线。侧墙的范围是 [ys, yt]，玻璃带这类"贴在车身外侧
         的暗色窗带"需要自己的肩线比车身低，否则会被同高度的车身侧墙遮住。 */
      if (opt.ysFn) ys = opt.ysFn(z, ys);
      if (opt.ybFn) yb = opt.ybFn(z, yb, yt);
      if (opt.ytFn) yt = opt.ytFn(z, yb, yt);
      /* 高度守卫：侧墙至少 minH 高。贴面壳（如车顶亮棱贴玻璃面）
         需要 0.004 级别的极薄壳，默认 0.03 会多露出一圈侧面。 */
      var minH = opt.minH === undefined ? 0.03 : opt.minH;
      if (yb > yt - minH) yb = yt - minH;

      var sc = opt.scale || 1;
      secs.push({
        z: z,
        pts: sectionOutline({
          hw: hw * sc, hwt: hwt * sc, hwb: hwb * sc,
          ys: ys, yt: yt, yb: yb,
          crown: (opt.crown || 0) - dip * (opt.dipScale === undefined ? 1 : opt.dipScale),
          facet: opt.facet
        }, opt.samples || 4)
      });
    }
    return loftGeometry(secs, opt.capFront !== false, opt.capBack !== false, opt.facet);
  }

  /* 车壳顶面在 (z, x) 处的高度 —— 用来把灯带、饰条精确压到曲面上 */
  function surfaceTopY(table, z, x, crown) {
    crown = crown || 0;
    var p = sampleProfile(table, z);
    var hw = p[0], hwt = p[1], ys = p[3], yt = p[4];
    crown -= (p[6] || 0);          /* 与 buildShell 里的下凹量保持一致 */
    var ax = Math.abs(x);
    if (ax <= hwt) {
      var t = ax / Math.max(1e-4, hwt);
      return yt + crown * (1 - t * t);
    }
    if (ax >= hw) return ys;
    var u = (ax - hwt) / Math.max(1e-4, hw - hwt);
    return yt + (ys - yt) * (u * u * (3 - 2 * u));
  }

  /* 车壳肩线高度（参数表第 5 列 ys），用来把贴片的下缘对到腰带线上 */
  function surfaceProfileYs(table, z) {
    return sampleProfile(table, z)[3];
  }

  /* 车壳侧面在 (z, y) 处的 x —— 用来把进气口、侧鳃贴到曲面上 */
  function surfaceSideX(table, z, y) {
    var p = sampleProfile(table, z);
    var hw = p[0], hwt = p[1], hwb = p[2], ys = p[3], yt = p[4], yb = p[5];
    if (y >= yt) return hwt;
    if (y <= yb) return hwb;
    if (y >= ys) {
      var u = (y - ys) / Math.max(1e-4, yt - ys);
      return hw + (hwt - hw) * (u * u * (3 - 2 * u));
    }
    var u2 = (ys - y) / Math.max(1e-4, ys - yb);
    return hw + (hwb - hw) * (u2 * u2 * (3 - 2 * u2));
  }

  /* 沿车壳顶面铺一条带（大灯刀锋、DRL 灯带）—— 每个顶点都按曲面高度落位 */
  function topRibbon(path, table, lift, crown) {
    var pos = [], idx = [], n = path.length, i;
    for (i = 0; i < n; i++) {
      var p = path[i];
      var xa = p.x - p.w, xb = p.x + p.w;
      pos.push(xa, surfaceTopY(table, p.z, xa, crown) + lift, p.z);
      pos.push(xb, surfaceTopY(table, p.z, xb, crown) + lift, p.z);
    }
    for (var s = 0; s < n - 1; s++) {
      var a = s * 2;
      idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* 三角楔形透镜：真车大灯是隐形战机式的尖三角，不是横条灯带。
     三个顶点都按 surfaceTopY 贴到翼子板顶面上，沿 y 抬一点避免与车身共面闪烁。 */
  function lensWedge(table, crown, verts, lift) {
    var pos = [];
    for (var i = 0; i < verts.length; i++) {
      var y = surfaceTopY(table, verts[i].z, verts[i].x, crown) + lift;
      pos.push(verts[i].x, y, verts[i].z);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  /* 把多个几何合并成一个，减少 draw call */
  function mergeGeometries(geos) {
    var pos = [], nor = [], uv = [], hasUv = true;
    for (var g = 0; g < geos.length; g++) {
      var geo = geos[g].index ? geos[g].toNonIndexed() : geos[g];
      if (!geo.attributes.uv) hasUv = false;
      var p = geo.attributes.position.array, n = geo.attributes.normal.array;
      for (var i = 0; i < p.length; i++) pos.push(p[i]);
      for (var j = 0; j < n.length; j++) nor.push(n[j]);
      if (hasUv && geo.attributes.uv) {
        var u = geo.attributes.uv.array;
        for (var k = 0; k < u.length; k++) uv.push(u[k]);
      }
    }
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    if (hasUv && uv.length) out.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  Roadster —— 一比一还原的第二代 Roadster 曲面车身 + SpaceX 冷气推进器
   *  官方规格：长 4.70 m / 宽 2.06 m / 高 1.13 m；轮胎前 265/35R20、后 325/30R21。
   *  车身型面不是估的：把实车正侧照片逐列抠出轮廓（归一化红色掩膜 + 形态学开运算），
   *  再按官方车长/车高换算成米，得到前轴 z=-1.22、后轴 z=+1.98、轮拱顶 0.72 m、
   *  车顶弧线峰值 1.13 m 等一整张剖面表。
   *  冷气推进器不燃烧、无尾焰：高压气体喷出后骤冷，空气中的水汽凝结成白雾。
   * ------------------------------------------------------------------ */
  function buildRoadster() {
    var car = new T.Group();

    /* 车漆：发布会的银色（2017 亮相 / 2019 车展那台）。金属漆靠 scene.environment 的反射出效果。
       envMapIntensity 收一点，否则整块漆反射天空会白到发飘。
       不用 flatShading：棱线靠 loftGeometry 的顶点拆分做硬边，逐面着色反而会
       把沿车长方向的平滑型面打成一圈圈等高线。 */
    var paint = new T.MeshStandardMaterial({
      color: 0x7b828a, metalness: 0.70, roughness: 0.30, envMapIntensity: 0.85
    });
    /* 碳件/车顶暗玻璃：官方侧视实测是暖暗棕灰（rgb≈39,34,31 / 58,46,43，
       即 r−b≈+8~+15），冷蓝黑在银漆车身上会显出一片蓝。
       metalness 必须低（0.46 → 0.08）：金属材质在明亮环境贴图下会把
       暗色反射成浅灰，玻璃带就"消失"在银色车身里了（曾是这个状态）。
       roughness 提高让反射散开，暗色才压得住，读出深色玻璃带。 */
    var carbon = new T.MeshStandardMaterial({
      color: 0x140f0c, metalness: 0.08, roughness: 0.82, envMapIntensity: 0.35
    });
    /* 车顶亮棱：官方侧视顶缘那条 2.3~3.6cm 宽的亮银棱（峰值 rgb≈227,227,229），
       比车身漆更亮更挺 —— 漆面顶棱正面捕光 */
    var roofEdge = new T.MeshStandardMaterial({ color: 0xaab2bc, metalness: 0.82, roughness: 0.24, envMapIntensity: 1.0 });
    var matte = new T.MeshStandardMaterial({ color: 0x0b0d11, metalness: 0.18, roughness: 0.88 });
    var glass = new T.MeshStandardMaterial({
      color: 0x0f0c08, metalness: 0.9, roughness: 0.06,
      transparent: true, opacity: 0.70
    });
    var cabinInner = new T.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.12, roughness: 0.92 });
    var chrome = new T.MeshStandardMaterial({ color: 0xc6ccd4, metalness: 1.0, roughness: 0.16 });
    var alloy = new T.MeshStandardMaterial({ color: 0x9aa2ac, metalness: 0.94, roughness: 0.26 });
    var rimDark = new T.MeshStandardMaterial({ color: 0x1d2026, metalness: 0.86, roughness: 0.36 });
    var rimFace = new T.MeshStandardMaterial({ color: 0x464c55, metalness: 0.82, roughness: 0.38 });
    var tireMat = new T.MeshStandardMaterial({ color: 0x0d0f12, metalness: 0.05, roughness: 0.96, side: T.DoubleSide });
    var discMat = new T.MeshStandardMaterial({ color: 0x6e757d, metalness: 0.85, roughness: 0.42 });
    var caliperMat = new T.MeshStandardMaterial({ color: 0xd0261f, metalness: 0.4, roughness: 0.45 });
    /* 大灯：熄火时是一片深色刀锋镜片，只有一条极细的 DRL 灯丝发亮 */
    var lensMat = new T.MeshStandardMaterial({ color: 0x0a0d12, metalness: 0.25, roughness: 0.32, side: T.DoubleSide });
    var drlMat = new T.MeshStandardMaterial({
      color: 0xcfe6f6, emissive: 0x8fc8ee, emissiveIntensity: 1.25,
      roughness: 0.30, side: T.DoubleSide
    });
    var tailMat = new T.MeshStandardMaterial({ color: 0x2a0206, emissive: 0xff2233, emissiveIntensity: 2.0, roughness: 0.3 });
    /* 喷口做得低调：真车的冷气推进器都藏在车身里，不该像排气管那样抢眼 */
    var nozzleMat = new T.MeshStandardMaterial({ color: 0x4a515a, metalness: 0.95, roughness: 0.34, side: T.DoubleSide });
    var frostMat = new T.MeshStandardMaterial({
      color: 0x8fa6b6, metalness: 0.15, roughness: 0.72,
      emissive: 0x4a7d9e, emissiveIntensity: 0.10
    });

    /* 尺寸对齐特斯拉官网官方渲染图（tesla.cn/roadster/reserve）：
       长 4.70 m / 宽 2.06 m / 高 1.13 m。
       轮位、腰线、机盖、车顶弧线全部从官方侧视图逐列量出再换算成米：
       前轴 z=-0.95、后轴 z=+1.22（轴距 2.17 m）、轮拱顶 0.50 m、
       车头尖端 y=0.26 m（薄楔）、前翼子板脊 0.82 m、风挡基线 0.64 m、
       车顶 1.13 m、尾部行李厢面 1.05 m 滑到 0.70 m。
       轮胎按渲染图实测 Ø 0.52 m（渲染图轮径比量产规格小） */
    var WHEEL_Z_F = -1.415, WHEEL_Z_R = 1.22, WHEEL_X = 0.858;
    var WHEEL_R_F = 0.26, WHEEL_R_R = 0.26;
    var ARCH_R_F = 0.31, ARCH_R_R = 0.31;
    var CROWN = 0.014;

    /* ---------- 车身参数表 ----------
       z, 最宽半宽, 顶面半宽, 底面半宽, 肩高, 顶高, 底高, 机盖下凹
       全部按 tesla.cn 官方侧视图逐列实测（Sobel 边缘 + 385.5 px/m 标定）。
       真车是「长鼻薄楔」：车头尖端 0.26 m，机盖一条长斜面直接爬进风挡
       （z=-1.5 处 0.66 / -1.1 处 0.81 / -0.95 处 0.84 —— 中间没有凹陷），
       风挡从 z=-0.95 爬到车顶 1.13 m，顶点在 z=+0.25。
       尾部是 fastback：行李厢面从顶点一路滑到 z=+2.0 的 0.91 m，
       然后是一道垂直尾板切面（0.91 → 0.15，尾灯条嵌在切面中部）。
       宽度列按官方 3/4 后视图实测：后翼子板峰 z=+1.22 满宽 1.04，
       之后只微微收窄到 z=+2.35 的 0.95（尾板近乎满宽 1.90 ——
       官方车尾是宽平切面 + 满宽灯条，不是收窄的薄刃），
       尾灯板/灯带/扩散器/尾翼随型面同步保持满宽。
       z=1.00~1.02 是玻璃带尾端的腰带线：车身顶面在这里压到官方实测的
       玻璃带下缘（0.978@1.00 / 0.980@1.02），暗玻璃带从腰带线升到
       玻璃顶线（1.038@1.00），上面再压一条 3.6cm 宽的银色亮棱到
       roofline 1.074@1.00；银棱在 z=1.028 收口后，身体行李厢面接棒
       升到官方 roofline 1.067@1.03（注意顶高列已扣掉 crown 0.014 - dip
       0.006，表中 yt=1.059 才是渲染顶 1.067），
       玻璃带与行李厢面在官方侧视里是一条连续斜坡，不在中间留台阶。 */
    var bodyTable = [
      /* 车头前五行的横向尺寸按官方「正前视图」重排：官方前脸是收窄的
         圆润盾形 —— 最前缘只有约 1/3 车宽，然后沿机盖两侧平滑外扩到
         前翼子板。原来 [-2.35] 处 hw=0.315（正面宽 63cm）而 z=-2.0 就
         突增到 0.690，正面看就是一截方盒子。 */
      [-2.35, 0.190, 0.165, 0.140, 0.330, 0.480, 0.150, 0.014],
      [-2.20, 0.360, 0.315, 0.265, 0.368, 0.548, 0.148, 0.016],
      [-2.00, 0.620, 0.545, 0.470, 0.412, 0.640, 0.142, 0.018],
      [-1.80, 0.880, 0.800, 0.710, 0.455, 0.703, 0.130, 0.020],
      [-1.55, 1.018, 0.950, 0.882, 0.498, 0.755, 0.115, 0.024],
      [-1.42, 1.048, 1.002, 0.942, 0.560, 0.769, 0.112, 0.026],
      [-1.22, 1.032, 0.987, 0.932, 0.545, 0.803, 0.112, 0.026],
      [-0.95, 1.045, 1.005, 0.965, 0.575, 0.880, 0.120, 0.022],
      [-0.60, 1.040, 1.000, 0.965, 0.560, 0.958, 0.130, 0.024],
      [-0.45, 1.019, 0.980, 0.950, 0.540, 1.039, 0.140, 0.018],
      [-0.20, 0.997, 0.960, 0.930, 0.520, 1.090, 0.150, 0.014],
      [0.13, 0.997, 0.960, 0.930, 0.510, 1.121, 0.160, 0.012],
      [0.44, 1.008, 0.970, 0.940, 0.510, 1.124, 0.170, 0.010],
      [0.91, 1.019, 0.965, 0.950, 0.520, 1.102, 0.190, 0.008],
      [1.00, 1.024, 0.972, 0.955, 0.530, 1.094, 0.195, 0.007],
      [1.02, 1.026, 0.975, 0.957, 0.532, 1.093, 0.198, 0.007],
      [1.03, 1.027, 0.977, 0.958, 0.534, 1.091, 0.200, 0.006],
      [1.10, 1.029, 0.990, 0.960, 0.540, 1.087, 0.200, 0.006],
      [1.22, 1.040, 1.000, 0.970, 0.570, 1.077, 0.210, 0.005],
      [1.50, 0.965, 0.760, 0.900, 0.530, 1.038, 0.230, 0.004],
      [1.80, 0.925, 0.725, 0.865, 0.500, 0.958, 0.240, 0.004],
      [2.00, 0.895, 0.700, 0.840, 0.492, 0.913, 0.200, 0.004],
      [2.15, 0.870, 0.680, 0.815, 0.485, 0.902, 0.180, 0.004],
      [2.35, 0.845, 0.660, 0.790, 0.475, 0.867, 0.150, 0.004]
    ];

    var bodyMesh = new T.Mesh(buildShell(bodyTable, {
      z0: -2.35, z1: 2.35, step: 0.042, crown: CROWN, samples: 4,
      facet: true,
      extraSecs: [1.03],   /* 行李厢面陡坎：等距截面落在 1.01/1.052，
                             会把 0.980@1.02→1.067@1.03 抹平 —— 补截面立起来 */
      arches: [
        { zc: WHEEL_Z_F, R: ARCH_R_F, yc: WHEEL_R_F, flat: 0.30 },
        { zc: WHEEL_Z_R, R: ARCH_R_R, yc: WHEEL_R_R, flat: 0.30 }
      ]
    }), paint);
    car.add(bodyMesh);

    /* ---------- 座舱：一整块深色玻璃顶篷，从风挡一路溜到车尾 ----------
       按官方正侧视图（图5）逐点实测重写：风挡底在 z=-0.95（y≈0.88），
       玻璃顶陡升到 z=+0.25 的顶点 1.130（官方峰值，规格车高 1.13），
       之后后风挡极缓地降到 z=+1.0 的 1.10（坡度仅 0.04，正是官方那种
       「长而平的车顶」），玻璃后缘落在行李厢面上。
       官方侧视表（roofline）：-1.88:0.675 / -1.41:0.758 / -0.95:0.893 /
       -0.47:1.029 / 0.24:1.130 / 0.71:1.121 / 1.18:1.089 / 1.65:1.020 */
    var cabinTable = [
      [-0.95, 0.980, 0.940, 0.970, 0.700, 0.881, 0.700],
      [-0.75, 0.972, 0.932, 0.966, 0.720, 0.939, 0.720],
      [-0.55, 0.950, 0.910, 0.940, 0.745, 0.990, 0.745],
      [-0.30, 0.940, 0.900, 0.935, 0.790, 1.054, 0.790],
      [0.00, 0.940, 0.900, 0.935, 0.810, 1.109, 0.810],
      [0.25, 0.935, 0.895, 0.930, 0.820, 1.118, 0.820],
      [0.50, 0.930, 0.890, 0.925, 0.830, 1.113, 0.830],
      [0.75, 0.940, 0.900, 0.932, 0.880, 1.108, 0.880],
      [1.00, 0.918, 0.878, 0.912, 0.950, 1.101, 0.950],
      [1.02, 0.916, 0.876, 0.906, 0.960, 1.100, 0.950]
    ];

    /* 玻璃顶篷（外层）—— 前缘埋进机器盖里，不留切口。折面后是一整块楔形玻璃，
       侧面近乎垂直、顶部是浅梯形，正是真车那种「座舱楔形」。
       后缘延到 z=+1.03：官方侧视玻璃带在 z≈1.01-1.02 随斜坡自然闭合，之后顶面
       就是行李厢面（1.073@1.02 → 1.067@1.03 连续顺接），不留台阶。
       z1=1.03 但 step 0.038 只到 1.026 —— 恰好覆盖闭合点，甲板内侧不留缝。
       z>0.86 顶面拉平 1.2cm：官方行李厢面是平的（1.085~1.089），
       拉平后玻璃顶弧永远压在银壳亮棱顶弧下方 2mm，不共面不穿模。 */
    car.add(new T.Mesh(buildShell(cabinTable, {
      z0: -0.95, z1: 1.03, step: 0.038, crown: 0.012, facet: true,
      ytFn: function (z, yb, yt) { return z > 0.86 ? yt - 0.012 : yt; }
    }), glass));

    /* 座舱内衬：挡住天空，顺便把座椅兜在里面 */
    car.add(new T.Mesh(buildShell(cabinTable, {
      z0: -0.93, z1: 0.98, step: 0.038, scale: 0.90,
      ybFn: function () { return 0.70; },
      ytFn: function (z, yb, yt) { return yt - 0.018; }
    }), cabinInner));

    /* 官方车顶的分层线（glass-top.mjs 实测拟合，误差 ≤3mm）：
       亮银棱 → 暗玻璃的分界线。中段（z≤0.25）是一条抛物线顶点在 1.102@0.25；
       后段（z>0.25）二次曲线降到 1.038@1.00；前段（z<-0.25）从风挡根部
       1.038@-0.25 线性降到 0.915@-0.75（max 兜底防穿进机盖）。 */
    /* 官方车顶的分层线：亮银棱 → 暗玻璃的分界线 = roofline 下方约 3.6cm
       （银棱宽度）。按官方侧视表（顶点 1.130@0.25）重新拟合
       （原公式对应旧的 1.118@0.25 车顶，整体偏低 3cm）。 */
    function glassTopFn(z) {
      if (z < -0.25) return Math.max(0.925, 1.045 + 0.26 * (z + 0.25));
      if (z <= 0.25) { var u = z - 0.25; return 1.094 - 0.196 * u * u; }
      var d = z - 0.25;
      return 1.094 - 0.0067 * d - 0.0427 * d * d;
    }

    /* 车顶面板：暗玻璃带，盖住整个风挡到后窗。下缘（ybFn）压在官方玻璃顶线上，
       肩线从 ys 升到 yt —— 侧面看到的就是腰带线上方那条暖暗玻璃带
       （官方实测 rgb≈39,34,31 暖暗棕灰）。
       关键：cabinTable 的 hw 只有 0.94，而车身在同一 z 是 1.00~1.045 ——
       碳壳整体比车身窄，侧视时玻璃带整条被车身侧墙遮住，侧面只剩一片银色
       （实测座舱侧面像素全是 110,125,135 的银灰）。
       所以底宽 hw 必须按车身型面逐 z 贴上去（+6mm 才能压在外面不打架），
       但顶宽 hwt 仍用 cabinTable 自己的窄值 —— 两条都加宽会把车顶
       顶成一块宽平板，座舱结构就散了。 */
    car.add(new T.Mesh(buildShell(cabinTable, {
      z0: -0.86, z1: 1.00, step: 0.038, scale: 1.008, facet: true,
      ybFn: function (z) { return glassTopFn(z); }
    }), carbon));

    /* 银色亮棱 + 行李厢面：官方车顶不是整片黑 —— 玻璃带上方压着一条
       2.3~3.6cm 宽的亮银棱（峰值 rgb 227,227,229），棱的顶线就是 roofline。
       银壳 ys 与 yb 同时 := glassTopFn，侧墙退化为零、只露肩线
       [glassTop, yt] 这条亮棱。scale 1.010 比碳壳的 1.020 窄 ——
       这样碳壳（暗玻璃带）在外层、银壳在内层，侧视先看到暗玻璃带，
       顶视看到银壳顶弧。反过来（银壳更宽）会把玻璃带整个遮住。
       crown 取负值 0.012：银壳顶面中央下凹一点，顶视时被碳壳盖住、
       只从侧面露出那条亮棱；取正 crown 会让整块车顶从上往下看全是银的。
       下凹量不能再大（曾试 -0.038，会把银壳彻底埋掉、亮棱消失）。
       z>0.86 顶面拉平 1.2cm 对齐官方平坦行李厢面（1.085~1.089），
       z1=1.03 延过玻璃壳末端接过车身行李厢面 1.067，消除 roofline 跌落台阶。 */
    car.add(new T.Mesh(buildShell(cabinTable.map(function (r) {
      return [r[0], r[1], r[2], r[3], glassTopFn(r[0]), r[5], r[6]];
    }), {
      z0: -0.72, z1: 1.03, step: 0.038, scale: 1.010, crown: -0.012, facet: true,
      minH: 0.004,
      ybFn: function (z) { return glassTopFn(z); },
      ytFn: function (z, yb, yt) { return z > 0.86 ? yt - 0.012 : yt; }
    }), roofEdge));

    /* 行李厢盖：官方 3/4 后视图里 C 柱之后是**银色**车身盖，不是深色玻璃
       —— 深色只到座舱后缘（z≈1.03）。这里只铺一段很短的深色尾盖玻璃
       （z 1.03~1.30）做出过渡，之后交给银色行李厢面。 */
    car.add(new T.Mesh(buildShell(bodyTable, {
      z0: 1.03, z1: 1.30, step: 0.045, scale: 0.962, crown: 0.016, facet: true,
      minH: 0.004,
      ybFn: function (z, yb, yt) { return yt - 0.005; }
    }), glass));

    /* 内饰：两张座椅 + 中控屏 + 方向盘（都不能戳出顶篷和内衬） */
    (function interior() {
      [-0.33, 0.33].forEach(function (x) {
        var base = new T.Mesh(new T.BoxGeometry(0.40, 0.10, 0.46), cabinInner);
        base.position.set(x, 0.805, 0.42);
        car.add(base);
        var back = new T.Mesh(new T.BoxGeometry(0.38, 0.30, 0.12), cabinInner);
        back.position.set(x, 0.920, 0.62); back.rotation.x = -0.20;
        car.add(back);
        var head = new T.Mesh(new T.BoxGeometry(0.19, 0.12, 0.09), carbon);
        head.position.set(x, 1.010, 0.66); head.rotation.x = -0.20;
        car.add(head);
      });
      var dash = new T.Mesh(new T.BoxGeometry(1.02, 0.13, 0.28), carbon);
      dash.position.set(0, 0.860, -0.44);
      car.add(dash);
      var screen = new T.Mesh(new T.BoxGeometry(0.38, 0.20, 0.025),
        new T.MeshStandardMaterial({ color: 0x0b1c2c, emissive: 0x1d6fa8, emissiveIntensity: 0.5, roughness: 0.3 }));
      screen.position.set(0, 0.855, -0.54); screen.rotation.x = -0.25;
      car.add(screen);
      var sw = new T.Mesh(new T.TorusGeometry(0.130, 0.021, 8, 20), carbon);
      sw.position.set(0.33, 0.855, -0.30); sw.rotation.x = 1.15;
      car.add(sw);
    })();

    /* ---------- 轮子：六角星形深色轮毂 ----------
       真车轮毂是 6 根锥形辐条从中心盖向外辐射（轮毂处窄、轮缘处宽），
       辐条之间露出深灰轮辋面 —— 正侧看就是一颗六角星 */
    /* 锥形辐条：形状面是 (切向, 径向) 的梯形，沿轮轴(x)挤出。
       Extrude 形状在 xy 面、沿 z 挤出；rotateY(π/2) 把 z→x(轴向)、x→-z(切向)。 */
    function starSpoke(r0, r1, w0, w1, depth) {
      var sh = new T.Shape();
      sh.moveTo(-w0, r0);
      sh.lineTo(-w1, r1);
      sh.lineTo(w1, r1);
      sh.lineTo(w0, r0);
      sh.closePath();
      var geo = new T.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: false });
      geo.rotateY(Math.PI / 2);
      return geo;
    }

    function buildWheel(radius, halfWidth) {
      var w = new T.Group();
      var r = radius, hw = halfWidth;

      /* 轮胎：带胎肩圆角、胎侧鼓包 */
      var prof = [
        new T.Vector2(r * 0.64, -hw),
        new T.Vector2(r * 0.84, -hw * 1.02),
        new T.Vector2(r * 0.955, -hw * 0.86),
        new T.Vector2(r, -hw * 0.46),
        new T.Vector2(r, hw * 0.46),
        new T.Vector2(r * 0.955, hw * 0.86),
        new T.Vector2(r * 0.84, hw * 1.02),
        new T.Vector2(r * 0.64, hw)
      ];
      var tireGeo = new T.LatheGeometry(prof, 40);
      tireGeo.rotateZ(Math.PI / 2);
      w.add(new T.Mesh(tireGeo, tireMat));

      /* 轮辋桶 + 亮色轮辋外圈 */
      var lipR = r * 0.665;
      var barrel = new T.Mesh(new T.CylinderGeometry(lipR, lipR, hw * 1.88, 32, 1, true), rimFace);
      barrel.rotation.z = Math.PI / 2;
      w.add(barrel);
      var lip = new T.Mesh(new T.TorusGeometry(lipR, 0.015, 8, 40), alloy);
      lip.rotation.y = Math.PI / 2;
      lip.position.x = hw * 0.92;
      w.add(lip);

      /* 刹车盘 + 红色卡钳 */
      var disc = new T.Mesh(new T.CylinderGeometry(r * 0.60, r * 0.60, 0.026, 26), discMat);
      disc.rotation.z = Math.PI / 2;
      w.add(disc);
      var cal = new T.Mesh(new T.BoxGeometry(0.048, r * 0.40, r * 0.28), caliperMat);
      cal.position.set(0, r * 0.40, -r * 0.28);
      w.add(cal);

      /* 6 根锥形辐条：从中心盖向外辐射，中间窄、轮缘宽，拼成六角星 */
      var spokeGeos = [];
      for (var i = 0; i < 6; i++) {
        var base = (i / 6) * Math.PI * 2;
        var sg = starSpoke(r * 0.05, r * 0.94, 0.034, 0.088, hw * 0.82);
        sg.rotateX(base);                      /* 绕轮轴均布 6 根 */
        sg.translate(hw * 0.17, 0, 0);         /* 贴到轮辋外侧面 */
        spokeGeos.push(sg);
      }
      w.add(new T.Mesh(mergeGeometries(spokeGeos), rimDark));

      /* 中心盖：深色，与真车轮毂中心一致 */
      var hub = new T.Mesh(new T.CylinderGeometry(r * 0.165, r * 0.165, 0.042, 18), rimDark);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = hw * 0.90;
      w.add(hub);

      w.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      return w;
    }

    var wheelF = buildWheel(WHEEL_R_F, 0.133);   /* 265/35 R20 */
    var wheelR = buildWheel(WHEEL_R_R, 0.163);   /* 325/30 R21 */
    var wheels = [];
    [[-1, WHEEL_Z_F, wheelF, WHEEL_R_F], [1, WHEEL_Z_F, wheelF, WHEEL_R_F],
    [-1, WHEEL_Z_R, wheelR, WHEEL_R_R], [1, WHEEL_Z_R, wheelR, WHEEL_R_R]].forEach(function (p) {
      var w = p[2].clone();
      w.position.set(p[0] * WHEEL_X, p[3], p[1]);
      if (p[0] < 0) w.rotation.y = Math.PI;
      car.add(w);
      wheels.push(w);
    });

    /* ---------- 灯组 / 空气动力学件 ---------- */
    /* 前大灯：三角楔形透镜，嵌在翼子板顶面靠近机盖棱线的位置。
       真车是隐形战机式的尖三角（外窄内宽、向后扫），不是一条横条灯带。
       灭车时是深色刀锋镜片，沿前缘埋一条极细的 DRL 灯丝。 */
    /* 官方正前视图实测：大灯是**横向细长**的斜切灯组，嵌在机盖两侧的
       翼子板面上（x 从约 0.42 到 0.86，y 在 0.44~0.51），内端高、外端低，
       前端尖细 —— 不是贴着机盖中线画一道弧线。 */
    var LIGHT_VERTS = [
      { z: -2.16, x: 0.30 },   /* 内端：靠鼻梁中线 */
      { z: -1.62, x: 0.86 },   /* 外端：落在前翼子板外缘 */
      { z: -1.94, x: 0.60 }    /* 下缘顶点：收成薄刃 */
    ];
    [-1, 1].forEach(function (s) {
      var verts = LIGHT_VERTS.map(function (p) { return { z: p.z, x: s * p.x }; });
      car.add(new T.Mesh(lensWedge(bodyTable, CROWN, verts, 0.016), lensMat));
      /* DRL 灯丝：沿「鼻尖 → 后外端」这条长棱走，是最显眼的一道 */
      var drl = [];
      for (var i = 0; i <= 8; i++) {
        var t = i / 8;
        drl.push({
          x: s * (0.30 + (0.86 - 0.30) * t),
          z: -2.16 + (-1.62 + 2.16) * t,
          w: 0.013
        });
      }
      car.add(new T.Mesh(topRibbon(drl, bodyTable, 0.012, CROWN), drlMat));
    });

    /* 前脸下唇：拿同一张型面表放样，自然贴着鼻锥下缘包一圈 —— 不会像方块那样支出来。
       做薄：只包住鼻锥最下面一条，别读成一整块黑色围裙把车头撑成方头 */
    var chinRows = [];
    for (var cri = 0; cri < bodyTable.length; cri++) {
      if (bodyTable[cri][0] > -1.90) break;
      var br = bodyTable[cri];
      chinRows.push([br[0], br[1] + 0.012, br[2] + 0.012, br[3] + 0.012, br[4], br[5], br[6] - 0.006]);
    }
    /* 下唇高度：官方前脸的下缘是一条「中间低、两侧抬」的 V 形，
       中间（进气口下方）最深，到两侧轮眉处收上去。
       原来是一条平直的 0.19 线，正面看就是一截方形围裙。 */
    car.add(new T.Mesh(buildShell(chinRows, {
      z0: -2.35, z1: -1.90, step: 0.030, crown: CROWN, facet: true,
      ytFn: function (z, yb, yt) { return Math.min(yt, 0.150 + (z + 2.35) * 0.115); }
    }), matte));

    [-1, 1].forEach(function (s) {
      var zc = -1.98, yc = 0.372;
      var sx = surfaceSideX(bodyTable, zc, yc);
      var intake = new T.Mesh(new T.BoxGeometry(0.030, 0.105, 0.30), matte);
      intake.position.set(s * (sx - 0.010), yc, zc);
      intake.rotation.z = s * 0.16;
      intake.rotation.y = s * -0.22;
      car.add(intake);
    });

    /* ---------- 侧窗带 ----------
       官方侧视里，腰带线（约 0.88 m）以上到车顶这一整片都是暖暗玻璃，
       而不是银色车身。车身壳是单一银色材质，没法只把这一块染暗；
       舱壳（碳壳）比车身窄，侧视被车身侧墙挡住也露不出来。
       所以单独做一条贴片：沿车身侧面（surfaceSideX 逐点贴合）从腰带线
       铺到玻璃顶线，两侧各一条，外扩 4mm 避免共面闪烁。
       z 范围 -0.80~1.00 覆盖风挡到后窗。 */
    (function sideWindows() {
      var Z0 = -0.80, Z1 = 0.98, N = 26;
      var pos = [], idx = [];
      /* 用舱壳自身的横截面取 x：车身在上部已经收窄，若按 bodyTable 的
         最大半宽去取，贴片会被推到车外、悬在空中（曾是这个状态）。 */
      function sideXat(z, y) { return surfaceSideX(bodyTable, z, y); }
      for (var side = 0; side < 2; side++) {
        var sg = side === 0 ? 1 : -1;
        var base = pos.length / 3;
        for (var i = 0; i <= N; i++) {
          var z = Z0 + (Z1 - Z0) * (i / N);
          var gTop = glassTopFn(z);
          /* 窗台高度按官方实测：腰带线约 0.88 m，窗顶随玻璃顶线走
             （顶线以下 6mm 留那条银棱）。用固定下限而不是车身肩线 ——
             车身肩线在尾部会掉到 0.47，窗带就会一路压到车身中部。 */
          var yBot = Math.max(surfaceProfileYs(bodyTable, z) + 0.010, 0.880);
          /* 窗顶取车身顶面再往上 4mm：要盖住银壳肩线，
             否则只剩一条细缝（银壳顶面正好压在玻璃顶线上）。
             车身顶 = yt + crown - dip，取它 +4mm 让窗带压在外面。 */
          var bp2 = sampleProfile(bodyTable, z);
          var bodyTop = bp2[4] + CROWN - (bp2[6] || 0);
          var yTop = Math.max(gTop + 0.004, bodyTop + 0.004);
          if (yTop < yBot + 0.02) yTop = yBot + 0.02;
          var xB = sideXat(z, yBot) + 0.005;
          var xT = sideXat(z, yTop) + 0.005;
          pos.push(sg * xB, yBot, z);
          pos.push(sg * xT, yTop, z);
        }
        for (var k = 0; k < N; k++) {
          var a = base + k * 2, b = base + k * 2 + 1;
          var c = base + (k + 1) * 2, d = base + (k + 1) * 2 + 1;
          if (sg > 0) idx.push(a, b, d, a, d, c);
          else idx.push(a, d, b, a, c, d);
        }
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      car.add(new T.Mesh(geo, new T.MeshStandardMaterial({
        color: 0x140f0c, metalness: 0.08, roughness: 0.82,
        envMapIntensity: 0.35, side: T.DoubleSide
      })));
    })();

    /* 前轮后方的侧鳃 —— 贴着翼子板曲面的细长斜缝（Roadster 的标志性细节） */
    [-1, 1].forEach(function (s) {
      var zc = -0.80, yc = 0.700;
      var sx = surfaceSideX(bodyTable, zc, yc);
      var vent = new T.Mesh(new T.BoxGeometry(0.026, 0.062, 0.44), matte);
      vent.position.set(s * (sx + 0.002), yc, zc);
      vent.rotation.z = s * -0.13;
      vent.rotation.y = s * -0.05;
      car.add(vent);
    });

    /* ---------- 车尾 ----------
       按官方正后视图（发布会现场）实测的层次，从上到下四段：
         ① 银色车身上部 + 车顶肩部
         ② 贯穿式红灯条 —— 横贯整个尾板，宽 = 尾板宽（实测 549/549 px）
         ③ 银色尾板面（占尾面约 1/3，中间挂牌照）—— **是银的，不是深的**
         ④ 深色面板：一排 4 个圆形排气口 + 下方碳黑扩散器
       之前把 ③ 做成深色面板、并把排气口摆成 2×2，都与官方不符。
       宽度：官方尾板 549px / 整体车尾 660px ≈ 83%，所以尾板接近满宽，
       两侧只留很窄的肩部（不是之前 63% 那种"窄尾"。 */
    /* ③ 银色尾板面 */
    var tailFace = new T.Mesh(new T.BoxGeometry(1.74, 0.215, 0.040), roofEdge);
    tailFace.position.set(0, 0.520, 2.330);
    car.add(tailFace);
    /* ② 贯穿式尾灯：横贯尾板整宽，厚 8.5cm（官方 553×51 px ≈ 10.8:1） */
    var tailBar = new T.Mesh(new T.BoxGeometry(1.74, 0.085, 0.030), tailMat);
    tailBar.position.set(0, 0.660, 2.338);
    car.add(tailBar);
    /* 灯带两端沿尾板转角包过去 */
    [-1, 1].forEach(function (s) {
      var cap = new T.Mesh(new T.BoxGeometry(0.070, 0.085, 0.060), tailMat);
      cap.position.set(s * 0.868, 0.660, 2.322);
      cap.rotation.y = s * -0.42;
      car.add(cap);
    });
    /* 牌照（官方尾板上那块浅色方牌，居中偏上） */
    var plate = new T.Mesh(new T.BoxGeometry(0.30, 0.115, 0.012), chrome);
    plate.position.set(0, 0.525, 2.352);
    car.add(plate);

    /* ④ 深色面板（排气口所在层）+ 碳黑扩散器 */
    var tailDark = new T.Mesh(new T.BoxGeometry(1.72, 0.215, 0.045), matte);
    tailDark.position.set(0, 0.306, 2.332);
    car.add(tailDark);
    var diff = new T.Mesh(new T.BoxGeometry(1.70, 0.220, 0.220), carbon);
    diff.position.set(0, 0.132, 2.245);
    car.add(diff);
    for (var fi = -2; fi <= 2; fi++) {
      var fin = new T.Mesh(new T.BoxGeometry(0.020, 0.190, 0.200), matte);
      fin.position.set(fi * 0.320, 0.132, 2.255);
      car.add(fin);
    }

    /* 主动尾翼（收起位）—— 官方 3/4 后视图里这条薄唇就压在尾板上沿，
       即甲板后缘的「鸭尾」：不是立在尾箱中段，而是贴着尾板顶缘向外探出。
       前缘随甲板坡度扎进 deck、后缘抬起约 3 cm，做出收起位鸭尾的样子。 */
    var wingBlade = new T.Mesh(new T.BoxGeometry(1.44, 0.024, 0.20), carbon);
    wingBlade.position.set(0, 0.882, 2.280);
    wingBlade.rotation.x = -0.09;
    car.add(wingBlade);
    [-1, 1].forEach(function (s) {
      var end = new T.Mesh(new T.BoxGeometry(0.012, 0.036, 0.20), carbon);
      end.position.set(s * 0.705, 0.876, 2.280);
      end.rotation.x = -0.09;
      car.add(end);
    });

    /* 侧裙 + 车门分缝（都贴着车壳表面走） */
    [-1, 1].forEach(function (s) {
      var skirt = new T.Mesh(new T.BoxGeometry(0.048, 0.095, 2.34), carbon);
      skirt.position.set(s * 0.955, 0.185, 0.370);
      car.add(skirt);
      [-0.15, 0.95].forEach(function (dz) {
        var lx = surfaceSideX(bodyTable, dz, 0.640);
        var line = new T.Mesh(new T.BoxGeometry(0.010, 0.30, 0.018), matte);
        line.position.set(s * (lx - 0.002), 0.640, dz);
        car.add(line);
      });
    });

    /* 底盘护板：按车身参数表放样，两端随车头/车尾收窄 ——
       原来是一块 1.70×3.20 的矩形平板，车尾（半宽 0.615）远比它窄，
       从下方/斜后方看就露出一块方板。scale 0.94 让它始终缩在车身轮廓以内。 */
    var floorRows = [];
    for (var fri = 0; fri < bodyTable.length; fri++) {
      var fr = bodyTable[fri];
      floorRows.push([fr[0], fr[1], fr[2], fr[3], fr[4], 0.150, fr[6]]);
    }
    car.add(new T.Mesh(buildShell(floorRows, {
      z0: -2.20, z1: 2.20, step: 0.12, scale: 0.94, facet: true,
      minH: 0.005,
      ytFn: function (z, yb, yt) { return 0.150; },
      ybFn: function (z, yb) { return 0.120; }
    }), matte));

    /* ---------- 冷气推进器 ---------- */
    /* 白雾羽流：高压气体喷出后骤冷，水汽凝结 —— 没有火焰 */
    function plumeMaterial(opacity) {
      return new T.ShaderMaterial({
        transparent: true, depthWrite: false, side: T.FrontSide,
        blending: T.NormalBlending,
        uniforms: {
          uColor: { value: new T.Color(0xf2f9ff) },
          uOpacity: { value: opacity }
        },
        vertexShader:
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){ vUv = uv;' +
          '  vec4 mv = modelViewMatrix * vec4(position,1.0);' +
          '  vN = normalize(normalMatrix * normal);' +
          '  vV = normalize(-mv.xyz);' +
          '  gl_Position = projectionMatrix * mv; }',
        fragmentShader:
          'uniform vec3 uColor; uniform float uOpacity;' +
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){' +
          '  float along = 1.0 - vUv.y;' +                       /* 1 在喷口，0 在羽流末端 */
          '  float body = pow(clamp(along,0.0,1.0), 0.8);' +
          '  float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));' +
          '  float a = uOpacity * body * (0.42 + 0.95 * fres);' +
          '  if (a < 0.004) discard;' +
          '  gl_FragColor = vec4(uColor, a); }'
      });
    }
    var PLUME_OP = [0.80, 0.40, 0.17];
    var PLUME_LEN = [1.00, 1.15, 1.42];
    var plumeGeo = [
      new T.CylinderGeometry(0.085, 0.030, PLUME_LEN[0], 18, 1, true),
      new T.CylinderGeometry(0.180, 0.060, PLUME_LEN[1], 18, 1, true),
      new T.CylinderGeometry(0.340, 0.105, PLUME_LEN[2], 16, 1, true)
    ];
    plumeGeo.forEach(function (g, i) { g.translate(0, PLUME_LEN[i] / 2, 0); });

    var jets = [];
    function makeJet(kind, x, y, z, rx, ry, rz, nozzleGeo, frostGeo) {
      var grp = new T.Group();
      grp.position.set(x, y, z);
      grp.rotation.set(rx, ry, rz);
      grp.userData.kind = kind;
      grp.userData.side = x > 0.01 ? 1 : (x < -0.01 ? -1 : 0);
      grp.userData.plumes = [];
      grp.userData.mats = [];

      if (nozzleGeo) grp.add(new T.Mesh(nozzleGeo, nozzleMat));
      if (frostGeo) {
        var fr = new T.Mesh(frostGeo, frostMat);
        fr.position.y = 0.012;
        grp.add(fr);
      }
      for (var i = 0; i < 3; i++) {
        var mat = plumeMaterial(PLUME_OP[i]);
        var pm = new T.Mesh(plumeGeo[i], mat);
        pm.visible = false;
        pm.renderOrder = 5;
        grp.add(pm);
        grp.userData.plumes.push(pm);
        grp.userData.mats.push(mat);
      }
      car.add(grp);
      jets.push(grp);
      return grp;
    }

    /* 喷嘴几何沿局部 +Y 埋进车身：局部原点 = 喷口面，羽流正好从喷口长出来 */
    /* 车底 4 个：向下喷 → 把车顶起来 */
    var nozDown = new T.CylinderGeometry(0.105, 0.085, 0.11, 14, 1, true);
    nozDown.translate(0, -0.055, 0);
    var frostRing = new T.TorusGeometry(0.098, 0.016, 6, 16);
    frostRing.rotateX(Math.PI / 2);
    [[-0.55, -0.75], [0.55, -0.75], [-0.55, 1.30], [0.55, 1.30]].forEach(function (p) {
      makeJet('under', p[0], 0.175, p[1], Math.PI, 0, 0, nozDown, frostRing);
    });

    /* 车尾 4 个：**一排 4 个**（官方正后视图就是这个排布，不是 2×2），
       向后喷 → 向前推。收小并嵌进尾部深色件里，别做成抢眼的大白圈。
       官方排气口 x ≈ ±0.10 / ±0.31（间距约 84mm），y ≈ 0.30 */
    var nozBack = new T.CylinderGeometry(0.062, 0.048, 0.12, 16, 1, true);
    nozBack.translate(0, -0.060, 0);
    var frostRingB = new T.TorusGeometry(0.052, 0.008, 6, 18);
    frostRingB.rotateX(Math.PI / 2);
    [-0.315, -0.105, 0.105, 0.315].forEach(function (x) {
      makeJet('rear', x, 0.300, 2.345, Math.PI / 2, 0, 0, nozBack, frostRingB);
    });

    /* 车身两侧成对：姿态控制 */
    var nozSide = new T.CylinderGeometry(0.066, 0.050, 0.10, 12, 1, true);
    nozSide.translate(0, -0.05, 0);
    var frostRingS = new T.TorusGeometry(0.060, 0.012, 6, 14);
    frostRingS.rotateX(Math.PI / 2);
    [[-0.955, -0.95], [0.955, -0.95], [-0.955, 1.30], [0.955, 1.30]].forEach(function (p) {
      makeJet('side', p[0], 0.665, p[1], 0, 0, p[0] > 0 ? -Math.PI / 2 : Math.PI / 2, nozSide, frostRingS);
    });

    /* 车底冷光（气体膨胀致冷的感觉） */
    /* 车底冷光：只留一个向下的点光源。原方案是一块 2.6×4.0 m 的水平
       加色平面贴在车底，车一升空、相机俯视时整块平面就露出来，读成
       "车底下垫了一块灰板" —— 已移除，冷光效果交给点光源 + 白色冷雾。 */
    var thrustLight = new T.PointLight(0xbfe4ff, 0, 16, 2);
    thrustLight.position.set(0, -0.35, 0);
    car.add(thrustLight);

    car.traverse(function (o) {
      if (o.isMesh && o.material && !o.material.transparent) o.castShadow = true;
    });

    return {
      group: car,
      jets: jets,
      plumeOp: PLUME_OP,
      plumeLen: PLUME_LEN,
      thrustLight: thrustLight,
      wheels: wheels
    };
  }

  var roadster = buildRoadster();
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
      master.gain.value = 0.42;
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
  function onCleared() {
    state.cleared++;
    var gain = CFG.SCORE_PER_TOLL + Math.round((state.speed - CFG.BASE_SPEED) * 4);
    state.score += gain;
    state.speed = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + state.cleared * CFG.SPEED_STEP);
    Sound.ding();
    Sound.whoosh();
    toast('飞越成功  +' + gain, '#6ff0c0');
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

    /* 收费站回收 */
    for (var g = 0; g < tolls.length; g++) {
      var tt = tolls[g];
      if (cz < tt.position.z - 50) {
        tt.position.z -= CFG.TOLL_SPACING * CFG.TOLL_COUNT;
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
        onCleared();
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
  var CAM_SIDE = 2.75;        /* 相机相对车的横向偏移（右后方） */
  var CAM_BACK = 6.40;        /* 纵向距离 */
  var CAM_UP = 2.45;          /* 基础高度 */

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
      car.position.z - 15
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
