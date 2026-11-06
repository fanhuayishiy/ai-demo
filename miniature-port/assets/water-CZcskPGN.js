import{G as I,P as L,k as E,l as G,V as $,m as _,D as U,M as V,c as O}from"./index-8eIWcX-w.js";const p=6,l=c=>Number(c).toFixed(3);function X(c){const{L:D,palette:a,rng:R}=c,{PIER:f,BREAKWATER:s,ANCHOR:h}=D,t=R(20240517),m=new I;m.name="sea";const M=58,W=21.4,C=(.1+21.5)*.5;let g=128,x=88;c.quality==="medium"?(g=96,x=66):c.quality==="low"&&(g=72,x=50);const y=new L(M,W,g,x);y.rotateX(-Math.PI/2),y.translate(0,0,C);const o=i=>new O(i),k=o(a.waterNight).lerp(o(a.waterDeep),.28),P=o(a.skyTop).lerp(o(a.skyHorizon),.34),r={uTime:{value:0},uNight:{value:0},uSunDir:{value:new $(h.SUN_DIR.x,h.SUN_DIR.y,h.SUN_DIR.z).normalize()},uShallow:{value:o(a.waterShallow)},uMid:{value:o(a.waterMid)},uDeep:{value:o(a.waterDeep)},uFoam:{value:o(a.foam)},uResolution:{value:new G(1280,720)},uNightShallow:{value:k},uNightDeep:{value:o(a.waterNight)},uSeabed:{value:o(a.seabed)},uSkyDay:{value:P},uSkyNight:{value:o(a.skyNight)},uSunWarm:{value:o(a.sunWarm)},uMoonCool:{value:o(a.lampCool)},uRings:{value:Array.from({length:p},()=>new E(0,0,0,0))}},T=`
    uniform float uTime;
    uniform float uNight;

    varying vec3  vWorld;
    varying vec3  vNrm;
    varying float vCrest;
    varying vec2  vUv2;

    // 单个 Gerstner 波：累加位移 disp 与法线分量 nrm（GPU Gems Ch.1）
    //   P.xz += Q*A*D*cos(th);  P.y += A*sin(th)
    //   N = normalize( -Σ D*(kA)*cos(th), 1 - Σ Q*(kA)*sin(th), ... )
    void addWave(vec2 dir, float k, float amp, float speed, float steep, float phase,
                 vec2 pos, float t, inout vec3 disp, inout vec3 nrm, inout float crest) {
      vec2 d = normalize(dir);
      float th = k * dot(d, pos) - speed * t + phase;
      float s = sin(th);
      float c = cos(th);
      float ka = k * amp;
      disp.xz += steep * amp * d * c;
      disp.y  += amp * s;
      nrm.x   -= d.x * ka * c;
      nrm.z   -= d.y * ka * c;
      nrm.y   -= steep * ka * s;
      crest   += amp * s;
    }

    void main() {
      vec2 p = position.xz;                    // 几何体已平移，即世界 XZ
      float calm = mix(1.0, 0.78, uNight);    // 夜里的海略平静
      vec3 disp = vec3(0.0);
      vec3 nrm  = vec3(0.0, 1.0, 0.0);
      float crest = 0.0;

      // 保留最长涌浪 (k=0.42) 到一层细波 (k=2.60) 共 4 层，删去原 k=4.20 / 6.80
      // 两层最高频；位移 / 解析法线 / 波峰 crest 的累加随调用数同步收敛。
      addWave(vec2( 0.90,  0.44), 0.42, 0.082 * calm, 0.72, 0.55, 0.0, p, uTime, disp, nrm, crest);
      addWave(vec2(-0.62,  0.78), 0.85, 0.061 * calm, 1.10, 0.45, 1.7, p, uTime, disp, nrm, crest);
      addWave(vec2( 0.32, -0.95), 1.50, 0.045 * calm, 1.55, 0.38, 3.1, p, uTime, disp, nrm, crest);
      addWave(vec2(-0.85, -0.53), 2.60, 0.032 * calm, 2.15, 0.30, 0.6, p, uTime, disp, nrm, crest);

      // 浅水波谷受海床限制：base.js 的不透明海床平面在 y=-0.045（depthWrite:true）。
      // 把水面整体抬到 SEA_Y≈+0.045（basemaker 建议 0.02~0.06），并把 Gerstner
      // 波谷平滑压缩到不低于约 -0.01，避免波谷沉到海床之下被深度剔除出现破洞；
      // 波峰幅度完全保留。压缩区解析法线同步收敛到垂直，保证高光与波形一致。
      const float waveFloor = -0.055;   // disp.y 的软下限
      const float waveSoft  =  0.055;   // 过渡尺度
      float dy = disp.y;
      float waveY = max(dy, 0.0) + waveFloor * (1.0 - exp(min(dy, 0.0) / waveSoft));
      float flatten = dy < 0.0 ? exp(dy / waveSoft) : 1.0;
      nrm = normalize(mix(vec3(0.0, 1.0, 0.0), nrm, flatten));

      vec3 world = position + vec3(disp.x, waveY + 0.045, disp.z);
      vWorld = (modelMatrix * vec4(world, 1.0)).xyz;
      vNrm   = normalize(nrm);
      vCrest = crest;
      vUv2   = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(world, 1.0);
    }
  `,B=`
    uniform float uTime;
    uniform float uNight;
    uniform vec3  uSunDir;
    uniform vec3  uShallow;
    uniform vec3  uMid;
    uniform vec3  uDeep;
    uniform vec3  uFoam;
    uniform vec2  uResolution;
    uniform vec3  uNightShallow;
    uniform vec3  uNightDeep;
    uniform vec3  uSeabed;
    uniform vec3  uSkyDay;
    uniform vec3  uSkyNight;
    uniform vec3  uSunWarm;
    uniform vec3  uMoonCool;
    uniform vec4  uRings[${p}];

    varying vec3  vWorld;
    varying vec3  vNrm;
    varying float vCrest;
    varying vec2  vUv2;

    // 结构边界（由 contract.js 注入，保证与 base.js 对齐）
    const vec4 PIER = vec4(${l(f.x0)}, ${l(f.x1)}, ${l(f.z0)}, ${l(f.z1)});
    const vec4 BW   = vec4(${l(s.x0)}, ${l(s.x1)}, ${l(s.z0)}, ${l(s.z1)});
    const vec2 GAP  = vec2(${l(s.gapX0)}, ${l(s.gapX1)});

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float s = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        s += a * vnoise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return s;
    }

    float sdBox(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    // 到突堤矩形边缘的距离
    float pierD(vec2 p) {
      vec2 c = vec2((PIER.x + PIER.y) * 0.5, (PIER.z + PIER.w) * 0.5);
      vec2 h = vec2((PIER.y - PIER.x) * 0.5, (PIER.w - PIER.z) * 0.5);
      return abs(sdBox(p - c, h));
    }

    // 到防波堤（左段 / 右段，中间口门无缝隙）边缘的距离
    float bwD(vec2 p) {
      float cz = (BW.z + BW.w) * 0.5;
      float hz = (BW.w - BW.z) * 0.5;
      vec2 cL = vec2((BW.x + GAP.x) * 0.5, cz);
      vec2 hL = vec2((GAP.x - BW.x) * 0.5, hz);
      vec2 cR = vec2((GAP.y + BW.y) * 0.5, cz);
      vec2 hR = vec2((BW.y - GAP.y) * 0.5, hz);
      return min(abs(sdBox(p - cL, hL)), abs(sdBox(p - cR, hR)));
    }

    // 综合：岸线 Z=0 / 突堤 / 防波堤三者最近距离（口门处自动让开）
    float edgeD(vec2 p) {
      return min(p.y, min(pierD(p), bwD(p)));
    }

    void main() {
      vec2 p = vWorld.xz;   // p.x = 世界 X, p.y = 世界 Z
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 N = normalize(vNrm);
      if (!gl_FrontFacing) N = -N;

      // 细碎法线扰动（两级 fbm，随时间流动）
      float nA = fbm(p * 2.6 + vec2(uTime * 0.35, -uTime * 0.22));
      float nB = fbm(p * 7.5 - vec2(uTime * 0.55,  uTime * 0.40));
      vec3 Nd = normalize(N + vec3(
        (nA - 0.5) * 0.55 + (nB - 0.5) * 0.28,
        0.0,
        (nB - 0.5) * 0.55 - (nA - 0.5) * 0.28
      ));
      N = normalize(mix(N, Nd, 0.60));

      // ── 深度 / 距离着色 ──────────────────────────────────────────
      float depth = clamp(p.y / 21.5, 0.0, 1.0);
      float dVar  = (fbm(p * 0.13) - 0.5) * 0.28;
      float dMix  = clamp(depth * 0.92 + dVar + 0.04, 0.0, 1.0);
      float ed    = edgeD(p);
      float shallowBoost = 1.0 - smoothstep(0.0, 3.6, ed);
      dMix = clamp(dMix - shallowBoost * 0.42, 0.0, 1.0);

      vec3 dayCol = mix(uShallow, uMid, smoothstep(0.0, 0.52, dMix));
      dayCol = mix(dayCol, uDeep, smoothstep(0.46, 1.0, dMix));
      // 水下海床透出：浅水处混入一点暖绿海床色 + 流动焦散光斑
      dayCol = mix(dayCol, uSeabed, shallowBoost * 0.16 * (1.0 - dMix));
      float caust = fbm(p * 1.6 + vec2(uTime * 0.18, -uTime * 0.12));
      float cc = max(0.0, 1.0 - abs(caust * 2.0 - 1.0));
      float cc2 = cc * cc;
      caust = cc2 * cc2 * cc2;   // 等价于 pow(cc, 6.0)，省一次 pow
      dayCol += uSeabed * caust * (1.0 - dMix) * 0.16;
      // 长涌浪条纹（极淡，只调制明度）
      float swell = sin(p.x * 0.33 + p.y * 0.82 - uTime * 0.42 + fbm(p * 0.20) * 2.0);
      dayCol *= 1.0 + swell * 0.05;

      // ── 夜景基色：深蓝，冷，泡沫与高光随之收敛 ────────────────────
      vec3 nightCol = mix(uNightShallow, uNightDeep, smoothstep(0.0, 1.0, dMix));
      nightCol *= 0.72 + 0.28 * fbm(p * 0.32);
      vec3 base = mix(dayCol, nightCol, uNight);

      // ── 菲涅尔：掠射角偏天空色 ────────────────────────────────────
      float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
      vec3 sky = mix(uSkyDay, uSkyNight, uNight);
      base = mix(base, sky, clamp(fres * 0.62, 0.0, 0.72));

      // ── 暖阳镜面高光带 + sun glitter ──────────────────────────────
      vec3 Ldir = normalize(uSunDir);
      if (Ldir.y < 0.0) Ldir = -Ldir;   // 始终取「指向光源」的方向
      vec3 H = normalize(Ldir + V);
      float ndh = max(dot(N, H), 0.0);
      // 两次同底整数幂合并为一次 log2 + 两次 exp2（等价于 pow(ndh, 96.0 / 14.0)）
      float logN = log2(max(ndh, 1.0e-7));
      vec2 scr = gl_FragCoord.xy / max(uResolution, vec2(1.0));
      float grain = hash21(floor(scr * uResolution * 0.35) + floor(uTime * 8.0));
      float spec  = exp2(96.0 * logN) * (0.60 + 0.40 * grain) * (0.55 + 0.45 * nB);
      float spec2 = exp2(14.0 * logN) * 0.10;
      vec3 sunCol = mix(uSunWarm, uMoonCool, uNight);
      base += sunCol * (spec * 1.55 + spec2) * (1.0 - uNight * 0.50);

      // ── 白沫：波峰碎沫 + 岸线 / 结构边缘拍岸沫 ────────────────────
      float crestFoam = smoothstep(0.15, 0.26, vCrest) * smoothstep(0.42, 0.76, nB);
      float pulse = 0.55 + 0.45 * sin(uTime * 1.7 - ed * 5.0 + fbm(p * 1.4) * 5.0);
      float edgeFoam = (1.0 - smoothstep(0.0, 1.25, ed + (nA - 0.5) * 0.7)) * pulse;
      edgeFoam *= smoothstep(0.30, 0.72, fbm(p * 2.2 + uTime * 0.12));
      float foam = clamp(max(crestFoam, edgeFoam * 1.12), 0.0, 1.0);
      foam *= mix(1.0, 0.42, uNight);
      base = mix(base, uFoam * mix(1.0, 0.62, uNight), foam * 0.86);

      // ── 水面涟漪环（uRings: xy=圆心, z=半径, w=强度）────────────────
      float ringL = 0.0;
      for (int i = 0; i < ${p}; i++) {
        vec4 r = uRings[i];
        float dd = length(p - r.xy);
        float q = (dd - r.z) / 0.32;
        ringL += exp(-q * q) * r.w;   // 等价于 exp(-pow(q, 2.0))
      }
      ringL = min(ringL, 1.4);
      base += uFoam * ringL * 0.30 * mix(1.0, 0.55, uNight);

      // ── 半透明浅水感：浅水更透，深水更实；泡沫处不透明 ─────────────
      float alpha = mix(0.82, 0.97, dMix);
      alpha = mix(alpha, 1.0, foam * 0.8);
      alpha = clamp(alpha + ringL * 0.12, 0.0, 1.0);

      gl_FragColor = vec4(max(base, vec3(0.0)), alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,b=new _({uniforms:r,vertexShader:T,fragmentShader:B,transparent:!0,depthWrite:!1,depthTest:!0,side:U,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});b.name="sea:gerstner";const u=new V(y,b);u.name="sea:surface",u.renderOrder=1,u.castShadow=!1,u.receiveShadow=!1,m.add(u);const n=[[-17,4.1],[-3.2,6.6],[20.5,8.2],[23,4.5],[11.4,14.3],[-9,9.5]],z=[];for(let i=0;i<p;i++){const v=n[i%n.length];z.push({x:v[0]+(t()-.5)*2,z:v[1]+(t()-.5)*2,age:t()*4,life:4.2+t()*2.4,speed:.5+t()*.4,spot:i%n.length})}let S=0;return m.userData.update=(i,v)=>{r.uTime.value=i,r.uResolution.value.set(window.innerWidth||1280,window.innerHeight||720),r.uNight.value+=(S-r.uNight.value)*Math.min(1,v*2.2);for(let d=0;d<p;d++){const e=z[d];if(e.age+=v,e.age>e.life){e.age=0;const N=n[(e.spot+1+Math.floor(t()*3))%n.length];e.spot=n.indexOf(N),e.x=N[0]+(t()-.5)*3,e.z=N[1]+(t()-.5)*3,e.speed=.5+t()*.45,e.life=4+t()*2.5}const w=e.age/e.life,A=.25+w*(2.8+e.speed),F=Math.sin(Math.PI*Math.min(1,w))*.85*(1-w*.35);r.uRings.value[d].set(e.x,e.z,A,F)}},m.userData.setNight=i=>{S=i?1:0},m}export{X as createWater,X as default};
