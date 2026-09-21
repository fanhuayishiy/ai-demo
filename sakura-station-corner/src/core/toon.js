// 三渲二材质内核：MeshToonMaterial + 注入（阴影冷染 / 卡通高光 / 边缘光 / 风吹 / 脉动 / 分级）
import * as THREE from 'three';
import { TEX } from './textures.js';
import { flatShading, IS_FLAT } from './style.js';

/** 全场景共享 uniform（引擎每帧写一次，所有材质同步） */
export const U = {
  time: { value: 0 },
  sunDirView: { value: new THREE.Vector3(0.35, 0.72, 0.6).normalize() },
  camDist: { value: 20 },
  breeze: { value: 1 },
};

const cache = new Map();

/**
 * 材质缓存键：不能用 JSON.stringify —— three 的 Texture.toJSON 会把画布重新编码成
 * PNG dataURL（每次建材质都导出一次贴图，启动耗时爆炸）。这里显式处理各类对象。
 */
function keyOf(v, depth = 0) {
  if (v === null || v === undefined) return '_';
  if (depth > 6) return '...';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(5) : 'x';
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'function') return 'fn';
  if (v.isTexture) return 'T' + v.uuid + ':' + (v.repeat ? v.repeat.x.toFixed(3) + ',' + v.repeat.y.toFixed(3) : '');
  if (v.isColor) return 'C' + v.getHexString();
  if (v.isVector2) return 'V' + v.x.toFixed(4) + ',' + v.y.toFixed(4);
  if (v.isVector3) return 'W' + v.x.toFixed(4) + ',' + v.y.toFixed(4) + ',' + v.z.toFixed(4);
  if (Array.isArray(v)) return '[' + v.map((x) => keyOf(x, depth + 1)).join(',') + ']';
  if (typeof v === 'object') {
    const out = [];
    for (const k in v) {
      if (k === 'toJSON') continue;
      out.push(k + ':' + keyOf(v[k], depth + 1));
    }
    return '{' + out.join('|') + '}';
  }
  return String(v);
}

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function applyUV(map, uv) {
  if (!map) return map;
  const m = map.clone();
  m.needsUpdate = true;
  if (uv) {
    if (uv.repeat) m.repeat.set(uv.repeat[0], uv.repeat[1]);
    if (uv.offset) m.offset.set(uv.offset[0], uv.offset[1]);
    if (uv.rotation) m.rotation = uv.rotation;
    if (uv.center) m.center.set(uv.center[0], uv.center[1]);
  }
  return m;
}

/* ------------------------- 着色器片段 ------------------------- */
const HEAD_COMMON = /* glsl */`
uniform vec3 uShadowTint;
uniform float uShadowAmt;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRimPower;
uniform vec3 uSpecColor;
uniform float uSpecStrength;
uniform float uSpecPower;
uniform float uSpecCut;
uniform float uSheen;
uniform vec3 uSunView;
uniform vec3 uTintColor;
uniform float uSat;
uniform float uContrast;
uniform float uTime;
`;

const LIGHT_BLOCK = /* glsl */`
vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
{
  vec3 nrm = normalize( normal );
  float ndv = clamp( dot( nrm, normalize( vViewPosition ) ), 0.0, 1.0 );
  float lum = dot( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, vec3( 0.33333 ) );
  float band = smoothstep( 0.08, 0.52, lum );

  // 阴影带冷染（明暗分明、通透）
  vec3 shaded = mix( outgoingLight * uShadowTint, outgoingLight, mix( 1.0 - uShadowAmt, 1.0, band ) );

  // 卡通高光：窄带阈值
  vec3 L = normalize( uSunView );
  vec3 V = normalize( vViewPosition );
  vec3 H = normalize( L + V );
  float nh = max( dot( nrm, H ), 0.0 );
  float spec = smoothstep( 1.0 - uSpecCut, 1.0, pow( nh, max( 1.0, uSpecPower ) ) ) * uSpecStrength;
  float facing = step( 0.0, dot( nrm, L ) );
  vec3 add = uSpecColor * spec * facing * band;

  // 边缘光（逆光暖粉 + 天空冷）
  float rimMask = pow( 1.0 - ndv, max( 0.5, uRimPower ) );
  float back = smoothstep( -0.4, 0.95, dot( nrm, normalize( vec3( L.x * 0.8, 0.30, L.z * 0.8 ) ) ) );
  add += uRimColor * rimMask * uRimStrength * ( 0.30 + 0.85 * back );

  // 环境薄膜反射（金属 / 塑胶 / 玻璃）
  add += uSpecColor * pow( 1.0 - ndv, 3.0 ) * uSheen;

  outgoingLight = shaded + add;
}
`;

const GRADE_BLOCK = /* glsl */`
{
  vec3 c = gl_FragColor.rgb;
  float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
  c = mix( vec3( l ), c, uSat );
  c = ( c - 0.5 ) * uContrast + 0.5;
  c *= uTintColor;
  gl_FragColor.rgb = c;
}
`;

function windPars(o) {
  if (!o.wind) return '';
  return /* glsl */`
uniform vec4 uWind;
uniform vec2 uWindPhase;
uniform float uBreeze;
`;
}
function windMain(o) {
  if (!o.wind) return '#include <begin_vertex>';
  const w = o.wind;
  return /* glsl */`
#include <begin_vertex>
{
  float span = max(0.001, ${num(w.span, 2).toFixed(4)});
  float mask = clamp((transformed.y - ${num(w.base, 0.5).toFixed(4)}) / span, 0.0, 1.0);
  mask = mask * mask * (3.0 - 2.0 * mask);
  float ph = uTime * ${num(w.freq, 1.1).toFixed(4)} * uBreeze + position.x * ${num(w.px, 0.7).toFixed(4)} + position.z * ${num(w.pz, 0.5).toFixed(4)};
  float amp = ${num(w.amp, 0.02).toFixed(4)};
  transformed.x += sin(ph) * amp * mask;
  transformed.z += cos(ph * 0.83 + 1.7) * amp * 0.75 * mask;
  transformed.y += sin(ph * 1.63) * amp * 0.28 * mask;
}
`;
}
/**
 * 摆动件 GPU 合并的着色器侧。
 *
 * 原理（代数恒等，不需要在 GLSL 里复刻风的公式）：
 *   摆动组 g 的静态世界矩阵 W_s、当前世界矩阵 W_a，令 **B = W_a · W_s⁻¹**；
 *   某顶点静止时的世界位置 x = W_s·R·p，则摆动后的位置 = W_a·R·p = B·x。
 *   B 含平移（绕枝根的旋转本身就是「旋转 + 平移」的仿射阵），所以乘一次就够。
 *   祖先组的运动已经含在 W_a / W_s 里 → **每个实例只需一个骨骼号**，与链深无关。
 *   动画仍然跑在 CPU 上（全场 257 个组、每帧 257 次矩阵乘），搬进 GPU 的只是「应用变换」。
 */
const SWAY_DECL = /* glsl */`
#ifdef USE_INSTANCING
#endif
uniform sampler2D uSwayBones;
uniform vec2 uSwayTexel;
attribute float aSwayBone;
mat4 swayBone(float i) {
  float x = i * 4.0;
  return mat4(
    texture2D( uSwayBones, vec2( ( x + 0.5 ) * uSwayTexel.x, 0.5 ) ),
    texture2D( uSwayBones, vec2( ( x + 1.5 ) * uSwayTexel.x, 0.5 ) ),
    texture2D( uSwayBones, vec2( ( x + 2.5 ) * uSwayTexel.x, 0.5 ) ),
    texture2D( uSwayBones, vec2( ( x + 3.5 ) * uSwayTexel.x, 0.5 ) )
  );
}
`;

/** 替换 project_vertex：世界位置算完再乘 B（modelViewMatrix 这条路会把 B 挤到错误的一侧） */
const SWAY_PROJECT = /* glsl */`
vec4 swayWorld = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  swayWorld = instanceMatrix * swayWorld;
#endif
swayWorld = modelMatrix * swayWorld;
swayWorld = swayBone( aSwayBone ) * swayWorld;
vec4 mvPosition = viewMatrix * swayWorld;
gl_Position = projectionMatrix * mvPosition;
`;

/** 替换 worldpos_vertex：阴影 / 环境采样用的世界位置要走同一条变换，否则影子停在静止姿态 */
const SWAY_WORLDPOS = /* glsl */`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
  #endif
  worldPosition = modelMatrix * worldPosition;
  worldPosition = swayBone( aSwayBone ) * worldPosition;
#endif
`;

/** 把摆动补丁打到任意一个自带 project_vertex 的顶点着色器上（MeshDepthMaterial 也走这个） */
export function patchSwayShader(shader, bones = null, texel = null) {
  shader.uniforms.uSwayBones = { value: bones };
  shader.uniforms.uSwayTexel = { value: texel || new THREE.Vector2(0, 0) };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + SWAY_DECL)
    .replace('#include <project_vertex>', SWAY_PROJECT)
    .replace('#include <worldpos_vertex>', SWAY_WORLDPOS);
}

function pulsePars(o) {
  return o.pulse ? `uniform vec4 uPulse;\nvarying float vPulse;\n` : '';
}
function pulseMain(o) {
  if (!o.pulse) return '';
  return /* glsl */`
{
  float g = ${num(o.pulse.spread, 1.2).toFixed(3)};
  vPulse = ${num(o.pulse.base, 1).toFixed(3)} + ${num(o.pulse.amount, 0.06).toFixed(3)} *
           (0.5 + 0.5 * sin(uTime * ${num(o.pulse.speed, 0.8).toFixed(3)} + transformed.y * g + position.x * 0.6));
}
`;
}
function pulseFragApply(o) {
  return o.pulse ? 'gl_FragColor.rgb *= vPulse;\n' : '';
}
function scrollPars(o) {
  return o.scroll ? `uniform vec2 uScroll;\n` : '';
}
function scrollMain(o) {
  if (!o.scroll) return '';
  // 让贴图随时间流动（玻璃反光带、水面、灯带流光）
  return /* glsl */`
#ifdef USE_MAP
  vMapUv += uScroll * uTime;
#endif
`;
}

function inject(mat, o) {
  const uniforms = {
    // 影の色：乗算なので、彩度の高い青を渡すと画面全体が青く濁る。
    // 「少しだけ寒色・ただし彩度を落とす」が春の陽差しの治愈系に必要な値。
    uShadowTint: { value: new THREE.Color(o.shadowTint ?? '#aeb8d4') },
    uShadowAmt: { value: o.shadowAmt ?? 0.9 },
    uRimColor: { value: new THREE.Color(o.rimColor ?? '#ffdde7') },
    uRimStrength: { value: o.rim ?? 0.16 },
    uRimPower: { value: o.rimPower ?? 2.8 },
    uSpecColor: { value: new THREE.Color(o.specColor ?? '#fff8ea') },
    uSpecStrength: { value: o.spec ?? 0.22 },
    uSpecPower: { value: o.specPower ?? 46 },
    uSpecCut: { value: o.specCut ?? 0.3 },
    uSheen: { value: o.sheen ?? 0.04 },
    uSunView: U.sunDirView,
    uTime: U.time,
    uTintColor: { value: new THREE.Color(o.tint ?? '#ffffff') },
    uSat: { value: o.sat ?? 1.02 },
    uContrast: { value: o.contrast ?? 1.0 },
  };
  if (o.wind) {
    uniforms.uBreeze = U.breeze;
    uniforms.uWind = { value: new THREE.Vector4(1, 1, 1, 1) };
    uniforms.uWindPhase = { value: new THREE.Vector2(1, 1) };
  }
  if (o.pulse) uniforms.uPulse = { value: new THREE.Vector4(1, 1, 1, 1) };
  if (o.scroll) uniforms.uScroll = { value: new THREE.Vector2(o.scroll[0], o.scroll[1]) };
  if (o.swayBones) {
    uniforms.uSwayBones = { value: null };
    uniforms.uSwayTexel = { value: new THREE.Vector2(0, 0) };
  }

  mat.userData.u = uniforms;
  const tag = `${o.wind ? 'W' : ''}${o.pulse ? 'P' : ''}${o.scroll ? 'S' : ''}${o.swayBones ? 'Y' : ''}`;
  mat.customProgramCacheKey = () => 'toon' + tag;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\n${windPars(o)}${pulsePars(o)}${scrollPars(o)}${o.swayBones ? SWAY_DECL : ''}`)
      .replace('#include <begin_vertex>', `${windMain(o)}${pulseMain(o)}`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>\n${scrollMain(o)}`);
    if (o.swayBones) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <project_vertex>', SWAY_PROJECT)
        .replace('#include <worldpos_vertex>', SWAY_WORLDPOS);
    }

    const dither = (o.dither ?? 0.010).toFixed(4);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD_COMMON}${windPars(o)}${pulsePars(o)}`)
      .replace(
        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
        LIGHT_BLOCK,
      )
      .replace('#include <tonemapping_fragment>', `${GRADE_BLOCK}${pulseFragApply(o)}#include <tonemapping_fragment>`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
{
  float _dth = fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
  gl_FragColor.rgb += ( _dth - 0.5 ) * ${dither};
}`,
      );
  };
}

/**
 * 平涂模式下的「玻璃」：参考图里的玻璃就是一块半透明浅色，没有折射、没有环境反射、
 * 也没有高光斑。用 transmission 的physical 玻璃既贵又会把画面搅浑，这里直接降级。
 */
function physicalFlat(o = {}) {
  return {
    ...o,
    transmission: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
    ior: 1,
    thickness: 0,
    attenuationDistance: 1e6,
    metalness: 0,
    roughness: 0.22,
    envMapIntensity: 0.18,
    specularIntensity: 0.12,
    sheen: 0,
    transparent: true,
    opacity: o.flatOpacity ?? 0.34,
  };
}

/** 主入口：三渲二材质（同参数共享实例） */
export function toon(raw = {}) {
  // 平涂风格在此统一接管：丢程序化贴图、压掉阴影/高光/边缘光。
  // 放在缓存键之前，两种风格不会共用同一个材质实例。
  const o = flatShading(raw);
  const key = 'T|' + keyOf(o);
  if (cache.has(key)) return cache.get(key);

  const steps = o.steps ?? 3;
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(o.color ?? '#ffffff'),
    gradientMap: o.gradientMap || TEX.ramp(steps, { shadow: o.shadowBase ?? 0.46, soft: !!o.softRamp }),
    side: o.side ?? THREE.FrontSide,
    transparent: !!o.transparent,
    opacity: o.opacity ?? 1,
    alphaTest: o.alphaTest ?? 0,
    depthWrite: o.depthWrite ?? true,
    fog: o.fog !== false,
    vertexColors: !!o.vertexColors,
    emissive: new THREE.Color(o.emissive ?? '#000000'),
    emissiveIntensity: o.emissiveIntensity ?? 1,
  });

  if (o.map) mat.map = applyUV(o.map, o.uv);
  if (o.normalMap) {
    mat.normalMap = applyUV(o.normalMap, o.uv || o.normalUV);
    mat.normalScale = new THREE.Vector2(o.normalScaleX ?? 1, o.normalScaleY ?? 1);
  }
  if (o.emissiveMap) mat.emissiveMap = applyUV(o.emissiveMap, o.uv);
  if (o.alphaMap) mat.alphaMap = applyUV(o.alphaMap, o.uv);
  if (o.colorWrite === false) mat.colorWrite = false;

  inject(mat, o);
  mat.userData.spec = o;
  cache.set(key, mat);
  return mat;
}

/** 独立副本：需要单独控制 uniform（如某一盏灯单独呼吸）时使用 */
export function toonUnique(o = {}) {
  const m = toon(o).clone();
  m.isToonUnique = true;
  inject(m, o);
  m.userData.spec = o;
  return m;
}

/** 由已存在的共享材质派生独立副本（Material.clone 不保留 onBeforeCompile，必须重新注入） */
export function uniqueOf(mat) {
  if (!mat) return mat;
  if (mat.userData?.isUniqueClone) return mat;
  const spec = mat.userData?.spec;
  if (spec && mat.isMeshToonMaterial) {
    const m = toonUnique(spec);
    m.userData.isUniqueClone = true;
    return m;
  }
  if (spec && mat.isMeshBasicMaterial) {
    const m = new THREE.MeshBasicMaterial();
    if (spec.color !== undefined) m.color = new THREE.Color(spec.color);
    if (spec.opacity !== undefined) m.opacity = spec.opacity;
    if (spec.transparent !== undefined) m.transparent = !!spec.transparent;
    if (spec.side !== undefined) m.side = spec.side;
    if (spec.depthWrite !== undefined) m.depthWrite = spec.depthWrite;
    if (spec.toneMapped !== undefined) m.toneMapped = spec.toneMapped;
    if (spec.map) { m.map = spec.map.clone(); m.map.needsUpdate = true; }
    m.userData = { spec, isUniqueClone: true };
    return m;
  }
  const c = mat.clone();
  c.userData = { ...(mat.userData || {}), spec, isUniqueClone: true };
  return c;
}

/** 纯自发光（屏幕 / 指示灯 / 灯箱芯 / 灯罩） */
export function glow(o = {}) {
  const key = 'G|' + keyOf(o);
  if (cache.has(key)) return cache.get(key);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(o.color ?? '#ffffff'),
    transparent: !!o.transparent,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
    toneMapped: o.toneMapped ?? true,
    fog: o.fog !== false,
  });
  if (o.map) mat.map = applyUV(o.map, o.uv);
  mat.userData.spec = o;
  cache.set(key, mat);
  return mat;
}

/** 物理玻璃 / 透明壳体（真实折射反射，与三渲二并存） */
export function physical(raw = {}) {
  const o = IS_FLAT ? physicalFlat(raw) : raw;
  const key = 'P|' + keyOf(o);
  if (cache.has(key)) return cache.get(key);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(o.color ?? '#dfeef0'),
    roughness: o.roughness ?? 0.05,
    metalness: o.metalness ?? 0,
    transmission: o.transmission ?? 0.94,
    thickness: o.thickness ?? 0.02,
    ior: o.ior ?? 1.5,
    transparent: true,
    opacity: o.opacity ?? 1,
    reflectivity: o.reflectivity ?? 0.6,
    clearcoat: o.clearcoat ?? 0.4,
    clearcoatRoughness: o.clearcoatRoughness ?? 0.12,
    envMapIntensity: o.envMapIntensity ?? 1.15,
    side: o.side ?? THREE.FrontSide,
    attenuationColor: new THREE.Color(o.attenuation ?? '#cfe6e4'),
    attenuationDistance: o.attenuationDistance ?? 2.2,
    specularIntensity: o.specularIntensity ?? 1,
    sheen: o.sheen ?? 0,
  });
  if (o.map) mat.map = applyUV(o.map, o.uv);
  if (o.normalMap) {
    mat.normalMap = applyUV(o.normalMap, o.uv);
    mat.normalScale = new THREE.Vector2(o.normalScaleX ?? 0.3, o.normalScaleY ?? 0.3);
  }
  mat.userData.spec = o;
  cache.set(key, mat);
  return mat;
}

export const MATERIAL_CACHE = cache;
