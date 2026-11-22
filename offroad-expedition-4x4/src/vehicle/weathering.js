import * as THREE from 'three';

const noise = /* glsl */ `
varying vec3 vWeatherPoint;
varying float vWeatherCrease;

float surfaceHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float surfaceNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(surfaceHash(i), surfaceHash(i + vec3(1, 0, 0)), f.x),
        mix(surfaceHash(i + vec3(0, 1, 0)), surfaceHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(surfaceHash(i + vec3(0, 0, 1)), surfaceHash(i + vec3(1, 0, 1)), f.x),
        mix(surfaceHash(i + vec3(0, 1, 1)), surfaceHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

float surfaceGrain(vec3 p) {
  return surfaceNoise(p) * 0.58 + surfaceNoise(p * 2.17 + 17.4) * 0.28 + surfaceNoise(p * 5.08 - 7.8) * 0.14;
}

float seam(float distanceToEdge, float fade) {
  return 1.0 - smoothstep(0.0025, fade, abs(distanceToEdge));
}

float impact(vec3 p, vec3 center, vec3 scale) {
  return 1.0 - smoothstep(0.12, 1.0, length((p - center) / scale));
}

float spray(vec3 p, float axle) {
  float aft = axle - p.z;
  float path = 0.59 + clamp(aft, 0.0, 0.86) * 0.48;
  float skirt = (p.y - path) / (0.18 + clamp(aft, 0.0, 0.72) * 0.14);
  return smoothstep(0.14, 0.36, aft) * (1.0 - smoothstep(0.52, 1.35, aft)) * exp(-skirt * skirt);
}

float scratch(vec3 p, float start, float lengthOfTrace, float height, float slope, float width) {
  float t = (p.z - start) / lengthOfTrace;
  float lineY = height + slope * t + sin(t * 5.0) * 0.018 + sin(t * 24.0) * 0.0025;
  return seam(p.y - lineY, width) * smoothstep(0.0, 0.19, t) * (1.0 - smoothstep(0.72, 1.0, t));
}

vec3 reliefNormal(vec3 position, vec3 surfaceNormal, float height, float facing) {
  vec3 dx = dFdx(position);
  vec3 dy = dFdy(position);
  vec3 tx = cross(dy, surfaceNormal);
  vec3 ty = cross(surfaceNormal, dx);
  float determinant = dot(dx, tx) * facing;
  vec3 gradient = sign(determinant) * (dFdx(height) * tx + dFdy(height) * ty);
  return normalize(max(abs(determinant), 1e-9) * surfaceNormal - gradient);
}
`;

const paint = /* glsl */ `
  vec3 p = vWeatherPoint;
  float side = smoothstep(0.66, 0.81, abs(p.x));
  float broad = surfaceGrain(p * 3.5 + vec3(12.9, 1.1, 4.0));
  float fine = surfaceNoise(p * 128.0 + 5.4);
  float crumbs = surfaceNoise(p * 66.0 - 11.7);
  float chalk = surfaceGrain(p * 8.0 + 21.4);
  float shade = smoothstep(0.17, 0.82, broad);
  float fade = smoothstep(0.30, 0.72, broad * 0.88 + chalk * 0.28 + 0.16 * smoothstep(1.05, 2.0, p.y));
  vec3 oldColor = diffuseColor.rgb * (0.70 + shade * 0.33);
  vec3 chalkyOlive = max(diffuseColor.rgb * vec3(1.43, 1.37, 1.13), vec3(0.104, 0.114, 0.056));
  vec3 paintColor = mix(oldColor, chalkyOlive, fade * 0.70) * (0.94 + fine * 0.12);

  float arch = min(abs(length(vec2(p.z - 1.25, p.y - 0.433)) - 0.527),
                   abs(length(vec2(p.z + 1.24, p.y - 0.433)) - 0.527));
  float lowEdge = seam(p.y - 0.603, 0.100) * side;
  float belt = seam(p.y - 1.237, 0.050) * (0.40 + side * 0.60);
  float archEdge = seam(arch, 0.067) * side * (1.0 - smoothstep(0.99, 1.06, p.y));
  float doorEdge = max(seam(p.z - 0.605, 0.044), seam(p.z + 0.632, 0.055)) * side;
  float ends = max(seam(p.z - 1.925, 0.110), seam(p.z + 1.861, 0.079));
  float roofLip = seam(p.y - 1.919, 0.045) * side;
  float edge = max(vWeatherCrease * 0.85, max(max(archEdge, lowEdge), max(max(belt * 0.62, roofLip), max(doorEdge * 0.68, ends * 0.64))));

  float impactZone = max(impact(p, vec3(-0.818, 0.73, 0.57), vec3(0.19, 0.29, 0.31)),
                         impact(p, vec3(0.811, 0.79, -1.687), vec3(0.22, 0.30, 0.41)));
  impactZone = max(impactZone, impact(p, vec3(-0.785, 0.95, 1.795), vec3(0.25, 0.29, 0.27)));
  impactZone = max(impactZone, impact(p, vec3(0.41, 1.243, 1.859), vec3(0.34, 0.11, 0.21)) * 0.85);
  impactZone = max(impactZone, impact(p, vec3(-0.57, 1.25, 0.795), vec3(0.27, 0.11, 0.24)) * 0.53);
  float cracked = surfaceGrain(p * 13.4 + vec3(3.66, 7.1, 18.5));
  float mottled = (cracked * 0.47 + chalk * 0.46 + crumbs * 0.10) + edge * 0.14 + impactZone * 0.24;
  float darkPrimer = smoothstep(0.603, 0.697, mottled);
  float rust = smoothstep(0.653, 0.749, mottled + (fine - 0.5) * 0.038);
  vec3 dryRust = mix(vec3(0.047, 0.018, 0.008), vec3(0.160, 0.054, 0.019), crumbs * 0.58 + cracked * 0.38);
  vec3 tint = mix(paintColor, vec3(0.073, 0.047, 0.023), darkPrimer * 0.71);
  tint = mix(tint, dryRust * (0.69 + fine * 0.51), rust * 0.96);

  float trace = max(scratch(p, -0.62, 1.19, 0.98, -0.102, 0.0062), scratch(p, -0.43, 0.84, 0.950, -0.065, 0.0035));
  float trail = max(scratch(p, -1.80, 0.93, 1.075, -0.116, 0.0058), scratch(p, 0.68, 0.98, 1.071, -0.086, 0.0043));
  trace = mix(trail, trace, step(p.x, 0.0)) * smoothstep(0.82, 0.832, abs(p.x));
  float thinMark = surfaceNoise(vec3(p.x * 75.0, p.y * 264.0 + p.z * 66.0, p.z * 13.0));
  float hairline = smoothstep(0.807, 0.927, thinMark + edge * 0.07) * smoothstep(0.53, 0.79, broad);
  float flakes = smoothstep(0.77, 0.894, crumbs * 0.56 + fine * 0.36 + edge * 0.22 + impactZone * 0.059);
  float exposed = max(flakes * (1.0 - 0.68 * rust), max(trace * (0.28 + 0.72 * crumbs), hairline * 0.52));
  vec3 bareMetal = mix(vec3(0.127, 0.119, 0.092), vec3(0.325, 0.299, 0.251), fine * 0.81);
  tint = mix(tint, bareMetal, exposed * 0.86);

  float underwash = (1.0 - smoothstep(0.62, 1.02, p.y)) * 0.63;
  float wheelSpray = max(spray(p, 1.25), spray(p, -1.24)) * side;
  float dirtAmount = max(underwash, wheelSpray * 0.77);
  float drain = surfaceNoise(vec3(p.x * 75.0, p.y * 5.3, p.z * 71.0));
  vec3 sprayWarp = vec3(crumbs - 0.5, cracked - 0.5, drain - 0.5) * 0.026;
  float grit = surfaceNoise((p + sprayWarp) * 43.0 + vec3(15.1, 2.3, 5.4));
  float deposits = smoothstep(0.55, 0.84, grit * 0.53 + crumbs * 0.19 + dirtAmount * (0.45 + drain * 0.28));
  float dust = clamp(deposits + dirtAmount * 0.19, 0.0, 0.84);
  vec3 silt = mix(vec3(0.067, 0.047, 0.028), vec3(0.192, 0.133, 0.071), grit * 0.74 + drain * 0.15);
  diffuseColor.rgb = mix(tint, silt, dust);
  float surfaceMetal = mix(0.085 + rust * 0.08, 0.70, exposed) * (1.0 - dust * 0.75);
  float surfaceRough = clamp(0.53 + fade * 0.09 + rust * 0.35 + dust * 0.35 - exposed * 0.17, 0.34, 0.97);
  float surfaceRelief = (fine - 0.5) * 0.00033 + rust * (crumbs - 0.38) * 0.00133 + deposits * 0.00048 - exposed * 0.00032;
`;

const metal = /* glsl */ `
  vec3 p = vWeatherPoint;
  float patina = surfaceGrain(p * 21.0 + vec3(2.0, 16.1, 5.1));
  float etch = surfaceNoise(p * vec3(110.0, 37.0, 168.0));
  float grain = surfaceNoise(p * 230.0 + 42.3);
  float corrosion = smoothstep(0.636, 0.800, patina * 0.82 + etch * 0.27);
  float polished = smoothstep(0.751, 0.947, etch) * (1.0 - corrosion);
  vec3 oxide = mix(vec3(0.038, 0.026, 0.018), vec3(0.151, 0.068, 0.026), patina * 0.42 + grain * 0.28);
  vec3 worn = diffuseColor.rgb * mix(0.56, 1.28, patina);
  diffuseColor.rgb = mix(mix(worn, oxide, corrosion * 0.87), worn * 1.58, polished * 0.78);
  float surfaceMetal = mix(0.54, 0.20, corrosion) + polished * 0.29;
  float surfaceRough = clamp(0.45 + patina * 0.25 + corrosion * 0.28 - polished * 0.16, 0.25, 0.96);
  float surfaceRelief = (grain - 0.5) * 0.00016 + (etch - 0.48) * corrosion * 0.00118;
`;

const rubber = /* glsl */ `
  vec3 p = vWeatherPoint;
  float ash = surfaceGrain(p * 32.2 + vec3(7.2, 15.0, 0.82));
  float grain = surfaceNoise(p * 188.0 + 17.1);
  float grainsOfSilt = surfaceNoise(p * 74.3);
  float shoulderScuff = 0.48;
  float treadField = 0.51;
  #ifdef TIRE_SURFACE
    float radius = length(p.xy);
    shoulderScuff = smoothstep(0.252, 0.374, radius) * smoothstep(0.09, 0.144, abs(p.z));
    treadField = smoothstep(0.343, 0.425, radius);
  #endif
  float dust = smoothstep(0.55, 0.803, ash * 0.57 + grainsOfSilt * 0.29 + shoulderScuff * 0.15 + treadField * 0.14);
  float wear = smoothstep(0.52, 0.808, ash + shoulderScuff * 0.10) * (0.68 + grain * 0.32);
  vec3 dustyGray = vec3(0.062, 0.056, 0.041);
  vec3 dirt = mix(vec3(0.039, 0.032, 0.023), vec3(0.103, 0.079, 0.047), grainsOfSilt);
  diffuseColor.rgb = mix(mix(diffuseColor.rgb * (0.68 + grain * 0.30), dustyGray, wear * 0.52), dirt, dust * 0.84);
  float surfaceMetal = 0.005;
  float surfaceRough = 0.77 + ash * 0.16 + dust * 0.06;
  float surfaceRelief = (grain - 0.5) * 0.00032 + (grainsOfSilt - 0.49) * dust * 0.00092;
`;

const fabric = /* glsl */ `
  vec3 p = vWeatherPoint;
  float weave = cos(p.x * 655.0 + p.y * 515.0) * cos(p.z * 712.0) * 0.5 + 0.5;
  float dye = surfaceGrain(p * 19.8 + vec3(11.0, 17.4, 3.2));
  float spill = smoothstep(0.58, 0.765, surfaceGrain(p * 8.5 - 3.9));
  diffuseColor.rgb *= (0.64 + dye * 0.68 + weave * 0.065) * (1.0 - spill * 0.32);
  float surfaceMetal = 0.0;
  float surfaceRough = 0.94 + weave * 0.05;
  float surfaceRelief = (weave - 0.5) * 0.00016 + (dye - 0.5) * 0.0011;
`;

const glass = /* glsl */ `
  vec3 p = vWeatherPoint;
  float fogged = surfaceGrain(p * 16.0 + vec3(1.31, 6.21, 9.0));
  float rain = surfaceNoise(vec3(p.x * 89.0, p.y * 5.5, p.z * 93.0));
  float edgeDust = max(seam(p.y - 1.33, 0.080), seam(p.y - 1.817, 0.055));
  float arcL = length(vec2(p.x + 0.621, p.y - 1.349));
  float arcR = length(vec2(p.x - 0.125, p.y - 1.349));
  float swept = smoothstep(0.46, 0.61, p.z) * max(
    smoothstep(0.095, 0.176, arcL) * (1.0 - smoothstep(0.41, 0.466, arcL)),
    smoothstep(0.095, 0.176, arcR) * (1.0 - smoothstep(0.41, 0.466, arcR)));
  float haze = clamp(((fogged - 0.36) * 0.40 + edgeDust * (0.16 + rain * 0.39)) * (1.0 - swept * 0.62), 0.0, 0.54);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.165, 0.154, 0.114), haze);
  diffuseColor.a = clamp(diffuseColor.a + haze * 0.38, 0.0, 1.0);
  float surfaceMetal = 0.22;
  float surfaceRough = 0.16 + haze * 0.57;
  float surfaceRelief = 0.0;
`;

const formulas = { paint, metal, rubber, tire: rubber, fabric, glass };

export function applyWeathering(material, type) {
  const useRestPosition = type === 'paint' || type === 'glass';
  material.userData.weatherRest = useRestPosition;
  material.customProgramCacheKey = () => `expedition-surface-${type}`;
  material.onBeforeCompile = (shader) => {
    const coordinates = useRestPosition ? 'attribute vec3 weatherPosition; attribute float weatherCrease;' : '';
    const vertex = useRestPosition ? /* glsl */ `
      vWeatherPoint = weatherPosition;
      vWeatherCrease = weatherCrease;
    ` : /* glsl */ `
      vec4 localWeather = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        localWeather = instanceMatrix * localWeather;
      #endif
      vWeatherPoint = localWeather.xyz;
      vWeatherCrease = 0.0;
    `;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${coordinates}\nvarying vec3 vWeatherPoint; varying float vWeatherCrease;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertex}`);
    const finish = type === 'glass' ? /* glsl */ `
      float glassAngle = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      diffuseColor.a = min(0.88, diffuseColor.a + pow(1.0 - glassAngle, 4.0) * 0.24);
    ` : 'normal = reliefNormal(-vViewPosition, normal, surfaceRelief, faceDirection);';
    const define = type === 'tire' ? '#define TIRE_SURFACE' : '';
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${define}\n${noise}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${formulas[type]}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = surfaceRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = surfaceMetal;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${finish}`);
  };
  return material;
}

// Keep finish coordinates in the closed vehicle's local frame, including on hinged panels.
export function bakeWeatherCoordinates(root) {
  root.updateMatrixWorld(true);
  const inverseRoot = root.matrixWorld.clone().invert();
  const rest = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  root.traverse((object) => {
    if (!object.isMesh || !object.material.userData.weatherRest) return;
    const geometry = object.geometry.clone();
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const points = new Float32Array(positions.count * 3);
    const creases = new Float32Array(positions.count);
    rest.multiplyMatrices(inverseRoot, object.matrixWorld);
    normalMatrix.getNormalMatrix(rest);
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(rest).toArray(points, i * 3);
      direction.fromBufferAttribute(normals, i).applyNormalMatrix(normalMatrix);
      const planar = Math.max(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z));
      creases[i] = THREE.MathUtils.smoothstep(1 - planar, 0.029, 0.27);
    }
    geometry.setAttribute('weatherPosition', new THREE.BufferAttribute(points, 3));
    geometry.setAttribute('weatherCrease', new THREE.BufferAttribute(creases, 1));
    object.geometry = geometry;
  });
}
