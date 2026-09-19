// 后期管线：屏幕空间描边（法线/深度边缘）、薄透镜景深、电影级色彩分级、bloom、SMAA
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { postChain } from './style.js';

/* ---------------------- 漫描边（二）：屏幕空间边缘检测 ---------------------- */
export const ToonEdgeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uProjInfo: { value: new THREE.Vector2(1, 1) },
    uNearFar: { value: new THREE.Vector2(0.1, 400) },
    uEdgeColor: { value: new THREE.Color('#3a2f36') },
    uNormalThreshold: { value: 0.62 },
    uDepthThreshold: { value: 0.012 },
    uDepthScale: { value: 0.42 },
    uStrength: { value: 0.86 },
    uLineWidth: { value: 1.0 },
    uEnabled: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;
    uniform vec2 uProjInfo;      // x = 1/tan(fov/2) * aspect 的倒数, y = 1/tan(fov/2) 的倒数
    uniform vec2 uNearFar;
    uniform vec3 uEdgeColor;
    uniform float uNormalThreshold;
    uniform float uDepthThreshold;
    uniform float uDepthScale;
    uniform float uStrength;
    uniform float uLineWidth;
    uniform float uEnabled;
    varying vec2 vUv;

    float readRaw( vec2 uv ) {
      return textureLod( tDepth, uv, 0.0 ).x;
    }
    float viewZFrom( float d ) {
      float nz = ( uNearFar.x * uNearFar.y ) / ( ( uNearFar.y - uNearFar.x ) * d - uNearFar.y );
      return nz; // 负值（视空间）
    }
    vec3 viewPos( vec2 uv ) {
      float d = readRaw( uv );
      float vz = viewZFrom( d );
      vec2 ndc = uv * 2.0 - 1.0;
      return vec3( ndc.x * uProjInfo.x * vz, ndc.y * uProjInfo.y * vz, vz );
    }
    void main() {
      vec4 base = texture2D( tDiffuse, vUv );
      if ( uEnabled < 0.5 || readRaw( vUv ) >= 0.9999 ) {
        gl_FragColor = base;
        return;
      }
      vec2 px = uLineWidth / uResolution;
      vec3 p  = viewPos( vUv );
      float dist = max( 0.05, -p.z );

      // 深度精度噪声底（窗口深度非线性，远处量化误差按距离平方增长）
      float noiseFloor = dist * dist * 2.6e-5 + 0.0016;

      vec2 dirs[4];
      dirs[0] = vec2( px.x, 0.0 );
      dirs[1] = vec2( -px.x, 0.0 );
      dirs[2] = vec2( 0.0, px.y );
      dirs[3] = vec2( 0.0, -px.y );

      vec3 q[4];
      float activity = 0.0;
      for ( int i = 0; i < 4; i++ ) {
        q[i] = viewPos( vUv + dirs[i] );
        activity = max( activity, abs( q[i].z - p.z ) );
      }
      // 局部几何活动度：平坦大面上法线由量化噪声主导，直接抑制，避免画面噪点
      float detail = smoothstep( noiseFloor, noiseFloor * 3.2, activity );

      // 法线边缘（中心差分法线 + 四邻域偏折）
      vec3 dx = q[0] - q[1];
      vec3 dy = q[2] - q[3];
      vec3 n0 = normalize( cross( dx, dy ) );
      float normalEdge = 0.0;
      for ( int i = 0; i < 4; i++ ) {
        vec2 o = dirs[i];
        vec3 a = viewPos( vUv + o + vec2( px.x, 0.0 ) ) - viewPos( vUv + o - vec2( px.x, 0.0 ) );
        vec3 b = viewPos( vUv + o + vec2( 0.0, px.y ) ) - viewPos( vUv + o - vec2( 0.0, px.y ) );
        vec3 n = normalize( cross( a, b ) );
        normalEdge = max( normalEdge, 1.0 - abs( dot( n0, n ) ) );
      }
      normalEdge = smoothstep( 1.0 - uNormalThreshold, 1.0 - uNormalThreshold * 0.42, normalEdge ) * detail;

      // 深度边缘：减去噪声底后做相对跳变判定
      float depthEdge = 0.0;
      for ( int i = 0; i < 4; i++ ) {
        float dz = max( 0.0, abs( q[i].z - p.z ) - noiseFloor );
        float rel = dz / max( 0.05, max( -q[i].z, dist ) );
        depthEdge = max( depthEdge, smoothstep( uDepthThreshold, uDepthThreshold * 2.8, rel ) );
      }
      depthEdge *= clamp( 1.0 - dist / ( uNearFar.y * uDepthScale ), 0.0, 1.0 );

      float edge = clamp( max( normalEdge, depthEdge * 0.9 ) * uStrength, 0.0, 1.0 );
      gl_FragColor = vec4( mix( base.rgb, uEdgeColor, edge ), base.a );
    }
  `,
};

/* ----------------------------- 薄透镜景深 ----------------------------- */
export const MiniDofShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uNearFar: { value: new THREE.Vector2(0.1, 400) },
    uFocus: { value: 20 },
    uFStop: { value: 2.8 },
    uMaxBlur: { value: 0.0072 },
    uFocalLengthM: { value: 0.05 },
    uBokehTint: { value: new THREE.Color('#ffe9d8') },
    uEnabled: { value: 1 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;
    uniform vec2 uNearFar;
    uniform float uFocus;
    uniform float uFStop;
    uniform float uMaxBlur;
    uniform vec3 uBokehTint;
    uniform float uEnabled;
    varying vec2 vUv;

    float viewZ( vec2 uv ) {
      float d = textureLod( tDepth, uv, 0.0 ).x;
      return ( uNearFar.x * uNearFar.y ) / ( ( uNearFar.y - uNearFar.x ) * d - uNearFar.y );
    }
    float coc( float dist ) {
      // 焦点带内完全清晰，偏离才渐进虚化（微缩移轴感，主体不糊）
      const float bandNear = 0.10; // 焦点前后 10% 距离内为清晰区
      const float bandFar = 0.62;  // 达到最大虚化的相对偏移
      float t = abs( dist - uFocus ) / max( 1.0, uFocus );
      float k = smoothstep( bandNear, bandFar, t );
      float dolly = 1.0 - 0.55 * exp( -dist * 0.06 ); // 近距特写虚化更强
      return uMaxBlur * k * dolly;
    }
    vec4 sampleBlur( vec2 uv, float radius, float angleSeed ) {
      vec4 sum = vec4( 0.0 );
      const int N = 13;
      for ( int i = 0; i < N; i++ ) {
        float t = float( i ) / float( N );
        float a = t * 6.2831853 * 3.0 + angleSeed;
        float r = sqrt( t ) * radius;
        vec2 off = vec2( cos( a ), sin( a ) ) * r * vec2( uResolution.y / uResolution.x, 1.0 );
        sum += textureLod( tDiffuse, uv + off, 0.0 );
      }
      return sum / float( N );
    }
    void main() {
      vec4 base = texture2D( tDiffuse, vUv );
      if ( uEnabled < 0.5 ) { gl_FragColor = base; return; }
      float dist = -viewZ( vUv );
      float r = coc( dist );
      if ( r < 0.0004 ) { gl_FragColor = base; return; }
      float seed = fract( sin( dot( vUv, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) * 6.283;
      vec4 blur = sampleBlur( vUv, r, seed );
      // 散景微染色：高光处偏暖
      float lum = dot( blur.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
      blur.rgb = mix( blur.rgb, blur.rgb * uBokehTint, smoothstep( 0.62, 1.1, lum ) * 0.35 );
      gl_FragColor = mix( base, blur, clamp( r / max( 0.0008, uMaxBlur ) * 1.6, 0.0, 1.0 ) );
    }
  `,
};

/* --------------------------- 电影级色彩分级 --------------------------- */
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSaturation: { value: 1.13 },
    uContrast: { value: 1.13 },
    uLift: { value: new THREE.Vector3(0.020, 0.015, 0.027) },
    uGamma: { value: new THREE.Vector3(1.0, 0.995, 0.982) },
    uGain: { value: new THREE.Vector3(1.062, 1.018, 0.972) },
    uVignette: { value: 0.24 },
    uGrain: { value: 0.016 },
    uHaze: { value: new THREE.Color('#ffdfe6') },
    uHazeAmount: { value: 0.036 },
    uCA: { value: 0.00045 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime, uSaturation, uContrast, uVignette, uGrain, uHazeAmount, uCA;
    uniform vec3 uLift, uGamma, uGain, uHaze;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 d = uv - 0.5;
      float r2 = dot( d, d );
      // 极轻微色散（镜头感，只在边缘）
      vec2 ca = d * uCA * r2 * 12.0;
      vec3 col;
      col.r = texture2D( tDiffuse, uv + ca ).r;
      col.g = texture2D( tDiffuse, uv ).g;
      col.b = texture2D( tDiffuse, uv - ca ).b;

      col = max( vec3( 0.0 ), col );
      col = col * uGain + uLift;
      col = pow( max( vec3( 0.0 ), col ), uGamma );

      float l = dot( col, vec3( 0.2126, 0.7152, 0.0722 ) );
      col = mix( vec3( l ), col, uSaturation );
      col = clamp( ( col - 0.5 ) * uContrast + 0.5, 0.0, 1.0 );

      // 春日空气光晕：中心暖亮、四周柔粉雾
      float vig = smoothstep( 0.86, 0.12, r2 * 1.7 );
      col = mix( col * 0.82 + uHaze * 0.05, col, vig );
      col = mix( col, col + uHaze * uHazeAmount * ( 0.55 + 0.45 * sin( uTime * 0.11 ) ), 1.0 - smoothstep( 0.0, 0.55, length( d ) ) );
      col *= mix( 1.0 - uVignette, 1.0, vig );

      // 胶片颗粒（极轻，随时间扰动避免固定噪点）
      float g = fract( sin( dot( gl_FragCoord.xy + uTime * 37.0, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
      col += ( g - 0.5 ) * uGrain;
      gl_FragColor = vec4( col, 1.0 );
    }
  `,
};

/* ------------------------------ 组装 ------------------------------ */
export function buildComposer(renderer, scene, camera, { size, dpr, quality = {} } = {}) {
  const w = Math.max(2, Math.floor(size.width * dpr));
  const h = Math.max(2, Math.floor(size.height * dpr));

  const rt = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    colorSpace: THREE.LinearSRGBColorSpace,
    samples: quality.samples ?? 2,
    depthBuffer: true,
    stencilBuffer: false,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(dpr);
  composer.setSize(size.width, size.height);

  // RenderPass 渲染进 readBuffer(renderTarget2)：把深度贴图交给它
  const size2 = composer.renderTarget2;
  const depthTex = new THREE.DepthTexture(Math.max(2, size2.width), Math.max(2, size2.height));
  depthTex.format = THREE.DepthFormat;
  depthTex.type = THREE.UnsignedIntType;
  depthTex.minFilter = THREE.NearestFilter;
  depthTex.magFilter = THREE.NearestFilter;
  depthTex.generateMipmaps = false;
  size2.depthTexture = depthTex;

  const renderPass = new RenderPass(scene, camera);
  renderPass.clearColor = new THREE.Color('#dfeaf3');
  composer.addPass(renderPass);

  const edge = new ShaderPass(ToonEdgeShader);
  edge.enabled = postChain.edge;
  edge.name = 'toonEdge';
  edge.uniforms.tDepth.value = depthTex;
  edge.renderToScreen = false;
  composer.addPass(edge);

  const dof = new ShaderPass(MiniDofShader);
  dof.enabled = postChain.dof;
  dof.name = 'dof';
  dof.uniforms.tDepth.value = depthTex;
  composer.addPass(dof);

  // Bloom は NeutralToneMapping より前＝リニア HDR で行われる。
  // 閾値を 1.35 にすると、晴日の白いディフューズ面（albedo×sun×NdotL ≒ 2.1〜2.6）が
  // 全部閾を越えて光り、花びらカードのような微小な明面が揺れる毎に画面が「ちかちか」した。
  // 閾値を日射拡散面より上（2.55）へ置き、本物の発光だけが太く咲くようにする。
  // 平涂模式不建 bloom（构造本身要分配一组 RT）
  const bloom = postChain.bloom ? new UnrealBloomPass(new THREE.Vector2(w, h), quality.bloom ?? 0.42, 0.5, quality.bloomThreshold ?? 2.55) : null;
  if (bloom) { bloom.name = 'bloom'; composer.addPass(bloom); }

  const grade = new ShaderPass(GradeShader);
  grade.enabled = postChain.grade;
  grade.name = 'grade';
  composer.addPass(grade);

  const smaa = new SMAAPass(w, h);
  smaa.name = 'smaa';
  composer.addPass(smaa);

  const output = new OutputPass();
  output.name = 'output';
  composer.addPass(output);

  // ── 闪烁根因修复（重要，勿删）───────────────────────────────────────────
  // EffectComposer 不会在每帧开始时复位 read/writeBuffer，它只按各 pass 的 needsSwap
  // 逐次交换。本链的交换次数是奇数（toonEdge/dof/grade/smaa/output 各 1 次 = 5），
  // 于是 readBuffer 的起点逐帧在两张贴图之间翻转：
  //   A 帧 RenderPass 写进「挂着 depthTexture 的 renderTarget2」→ 深度是新的；
  //   B 帧 RenderPass 写进「没有 depthTexture 的 renderTarget1」→ 描边与景深采样到的是
  //        上一帧的深度，且 bloom 的叠加目标也跟着错位。
  // 结果就是整画面逐帧明暗交替（实测画面平均亮度 134.8 ↔ 146.2，约 4.5% 的频闪）。
  // 复位起点即可，不改变任何画面参数；今后增删 pass 也不会再被奇偶性影响。
  const depthOwner = size2;
  const scratch = composer.renderTarget1;
  const baseRender = composer.render.bind(composer);
  composer.render = function (deltaTime) {
    this.readBuffer = depthOwner;
    this.writeBuffer = scratch;
    return baseRender(deltaTime);
  };

  return { composer, depthTex, edge, dof, bloom, grade, smaa, renderPass };
}
