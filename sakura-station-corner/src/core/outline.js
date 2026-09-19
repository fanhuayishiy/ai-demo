// 漫描边（一）：反壳描边 Inverted Hull —— 为每个实体生成统一粗细的动漫轮廓
import { outlines } from './style.js';
import * as THREE from 'three';
import { PAL } from './palette.js';

const VERT = /* glsl */`
uniform float uBase;
uniform float uSlope;
uniform float uFaceBias;
varying float vEdgeFade;
void main() {
  vec3 n = normalize( normal );
  vec4 mv = modelViewMatrix * vec4( position, 1.0 );
  vec3 vn = normalize( normalMatrix * n );
  vec3 vd = normalize( -mv.xyz );
  float facing = 1.0 - abs( dot( vd, vn ) );
  // 正对镜头的面收薄、掠射面加宽 —— 轮廓粗细更接近手绘
  float w = mix( 1.0, 0.35 + 0.65 * pow( facing, 1.4 ), uFaceBias );
  float dist = max( 0.05, -mv.z );
  mv.xyz += vn * ( uBase + uSlope * dist ) * w;
  vEdgeFade = smoothstep( 90.0, 40.0, dist );
  gl_Position = projectionMatrix * mv;
}
`;
const FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;
varying float vEdgeFade;
void main() {
  gl_FragColor = vec4( uColor, uOpacity * vEdgeFade );
}
`;

export const OUTLINE_DEFAULTS = {
  color: PAL.outline,
  opacity: 0.92,
  base: 0.00035,
  slope: 0.00058,
  faceBias: 0.75,
};

const variantCache = new Map();
/** 按物件取用描边材质变体（可微调浓淡，仍共享 program） */
export function outlineMaterial(o = {}) {
  const key = `${o.color || OUTLINE_DEFAULTS.color}|${o.opacity ?? OUTLINE_DEFAULTS.opacity}|${o.weight ?? 1}`;
  if (variantCache.has(key)) return variantCache.get(key);
  const d = o.defaults || OUTLINE_DEFAULTS;
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uBase: { value: (d.base ?? OUTLINE_DEFAULTS.base) * (o.weight ?? 1) },
      uSlope: { value: (d.slope ?? OUTLINE_DEFAULTS.slope) * (o.weight ?? 1) },
      uFaceBias: { value: d.faceBias ?? OUTLINE_DEFAULTS.faceBias },
      uColor: { value: new THREE.Color(o.color || d.color || OUTLINE_DEFAULTS.color) },
      uOpacity: { value: o.opacity ?? d.opacity ?? OUTLINE_DEFAULTS.opacity },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  mat.name = 'hull:' + key;
  variantCache.set(key, mat);
  return mat;
}

const DEFAULT_HULL = outlineMaterial();

/**
 * 为对象（含子树）附加反壳描边。
 * @param root 目标 Object3D
 * @param o {thickness: 'thin'|'normal'|'bold'|number, exclude(name), minSize, color, opacity}
 * @returns {THREE.Group} 插入了描边壳的同一 root
 */
export function addOutline(root, o = {}) {
  if (!outlines) return root;   // 平涂风格：不画反壳描边
  const weight = o.thickness === 'thin' ? 0.62 : o.thickness === 'bold' ? 1.5 : typeof o.thickness === 'number' ? o.thickness : 1;
  const hull = outlineMaterial({ color: o.color, opacity: o.opacity, weight });
  const minSize = o.minSize ?? 0.055;   // 5.5cm 以下の小物は描边しない（描边壳は 1 物件 1 追加ドローコール）
  const targets = [];
  root.traverse((n) => {
    if (!n.isMesh || n.isInstancedMesh || n.userData.noOutline || n.userData.isHull) return;
    if (n.material && (n.material.transparent === true && n.material.opacity < 0.65)) return;
    if (o.exclude && o.exclude(n.name || '')) return;
    const g = n.geometry;
    if (!g || !g.attributes.normal || !g.attributes.position) return;
    if (g.type === 'PlaneGeometry' && !o.includePlanes) return;
    targets.push(n);
  });

  const tmp = new THREE.Box3();
  for (const n of targets) {
    const g = n.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    tmp.copy(g.boundingBox);
    const sx = tmp.max.x - tmp.min.x, sy = tmp.max.y - tmp.min.y, sz = tmp.max.z - tmp.min.z;
    const sc = n.getWorldScale(new THREE.Vector3());
    const maxDim = Math.max(sx * sc.x, sy * sc.y, sz * sc.z);
    if (maxDim < minSize) continue; // 过小零件不描边，避免糊成一团
    const h = new THREE.Mesh(g, n.userData.hullMat || hull);
    h.name = (n.name || 'mesh') + '#hull';
    h.userData.isHull = true;
    h.userData.noOutline = true;
    h.castShadow = false;
    h.receiveShadow = false;
    h.renderOrder = (n.renderOrder || 0) - 1;
    // 作为兄弟节点并复制源网格的局部矩阵 → 与源完全重合，且允许与同类描边壳一起被实例化
    n.updateMatrix();
    h.matrix.copy(n.matrix);
    h.matrixAutoUpdate = false;
    h.matrixWorldNeedsUpdate = true;
    (n.parent || root).add(h);
  }
  return root;
}

export function setOutlineDefaults(next) {
  Object.assign(OUTLINE_DEFAULTS, next);
  variantCache.clear();
}
