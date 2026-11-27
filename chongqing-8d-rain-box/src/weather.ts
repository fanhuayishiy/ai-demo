import * as THREE from 'three';
import { AnimatedEntity, DynamicUpdateContext } from './types';

export interface WeatherSystemResult {
  group: THREE.Group;
  animated: AnimatedEntity;
  keyLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  skyUniforms: {
    uZenith: { value: THREE.Color };
    uMid: { value: THREE.Color };
    uHorizon: { value: THREE.Color };
    uSunGlow: { value: number };
  };
}

export function buildWeatherSystem(
  scene: THREE.Scene,
  warmLights: THREE.PointLight[]
): WeatherSystemResult {
  const group = new THREE.Group();
  group.name = 'WeatherAndLighting';

  // =========================================================================
  // 1. PROCEDURAL CHONGQING ATMOSPHERIC SKY DOME (Chrome Metal Safe GLSL)
  // =========================================================================
  const skyUniforms = {
    uZenith: { value: new THREE.Color(0x090d1a) },
    uMid: { value: new THREE.Color(0x162238) },
    uHorizon: { value: new THREE.Color(0x2d2430) },
    uSunGlow: { value: 0.0 },
  };

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform float uSunGlow;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        float upper = smoothstep(0.46, 0.92, h);
        float lower = smoothstep(0.28, 0.52, h);
        vec3 col = mix(uHorizon, uMid, lower);
        col = mix(col, uZenith, upper);

        // Subtle warm apricot golden-hour sun glow on horizon in sunny mode
        vec3 sunDir = normalize(vec3(0.58, 0.34, -0.74));
        float sunDot = clamp(dot(normalize(vDir), sunDir), 0.0, 1.0);
        float sunHalo = pow(max(sunDot, 1e-5), 9.0) * 0.32 * uSunGlow;
        col += vec3(1.0, 0.78, 0.52) * sunHalo;

        gl_FragColor = vec4(min(col, vec3(0.84)), 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(140, 28, 18), skyMat);
  group.add(skyDome);

  // =========================================================================
  // 2. MUSEUM STUDIO + WEATHER DIRECTIONAL & HEMISPHERE LIGHTS
  // =========================================================================
  const hemiLight = new THREE.HemisphereLight(0x526b96, 0x261d1a, 0.85);
  group.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0x9cb8e8, 1.35);
  keyLight.position.set(22, 34, 24);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 6;
  keyLight.shadow.camera.far = 85;
  keyLight.shadow.camera.left = -22;
  keyLight.shadow.camera.right = 22;
  keyLight.shadow.camera.top = 28;
  keyLight.shadow.camera.bottom = -18;
  keyLight.shadow.bias = -0.0006;
  group.add(keyLight);

  // Warm Chongqing skyline rim light from rear-left for crisp architectural edge separation
  const rimLight = new THREE.DirectionalLight(0xff9c5c, 0.72);
  rimLight.position.set(-24, 18, -18);
  group.add(rimLight);

  // =========================================================================
  // 3. GPU-INSTANCED RAIN STREAKS & GENTLE WINTER SNOWFLAKES
  // =========================================================================
  let seed = 8848;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Rain streaks (760 delicate fine slanted droplets bounded cleanly over the diorama)
  const rainCount = 760;
  const rainGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 1.18, 4);
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0x94bce6,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  const rainData: Array<{ x: number; y: number; z: number; speed: number; len: number }> = [];
  for (let i = 0; i < rainCount; i++) {
    rainData.push({
      x: (rand() - 0.5) * 25,
      y: rand() * 34 - 2,
      z: (rand() - 0.5) * 18,
      speed: 22 + rand() * 12,
      len: 0.65 + rand() * 0.65,
    });
  }
  group.add(rainMesh);

  // Winter snowflakes (700 soft matte low-luminance flakes — ZERO bloom!)
  const snowCount = 700;
  const snowGeo = new THREE.OctahedronGeometry(0.065, 0);
  const snowMat = new THREE.MeshBasicMaterial({
    color: 0xadc0d6,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, snowCount);
  const snowData: Array<{ x: number; y: number; z: number; speed: number; phase: number; scale: number }> = [];
  for (let i = 0; i < snowCount; i++) {
    snowData.push({
      x: (rand() - 0.5) * 28,
      y: rand() * 34 - 2,
      z: (rand() - 0.5) * 22,
      speed: 1.8 + rand() * 1.6,
      phase: rand() * Math.PI * 2,
      scale: 0.55 + rand() * 0.85,
    });
  }
  group.add(snowMesh);

  // Target color palettes for the 3 Climates
  const colRainZenith = new THREE.Color(0x090e1c);
  const colRainMid = new THREE.Color(0x16243a);
  const colRainHorizon = new THREE.Color(0x2a2333);
  const colRainFog = new THREE.Color(0x141b2b);

  // 江城晴午 (Warm Golden-Hour Celadon-to-Apricot Sky)
  const colSunZenith = new THREE.Color(0x4b8794);
  const colSunMid = new THREE.Color(0x88b4ae);
  const colSunHorizon = new THREE.Color(0xe5b282);
  const colSunFog = new THREE.Color(0xc5a88d);

  // 山城初雪 (Cozy Lantern Snow Night — soft cool slate, zero whiteout)
  const colSnowZenith = new THREE.Color(0x111a2d);
  const colSnowMid = new THREE.Color(0x23334c);
  const colSnowHorizon = new THREE.Color(0x3a4256);
  const colSnowFog = new THREE.Color(0x212c40);

  const keyRainCol = new THREE.Color(0x8fb0e0);
  const keySunCol = new THREE.Color(0xffdfa8);
  const keySnowCol = new THREE.Color(0xa6bdd9);

  const hemiSkyRain = new THREE.Color(0x526b96);
  const hemiSkySun = new THREE.Color(0xaed4dc);
  const hemiSkySnow = new THREE.Color(0x738db0);

  const hemiGndRain = new THREE.Color(0x2c201a);
  const hemiGndSun = new THREE.Color(0x6e543e);
  const hemiGndSnow = new THREE.Color(0x363a47);

  const dummy = new THREE.Object3D();
  const baseWarmIntensities = warmLights.map((l) => l.intensity);
  const tmpColor = new THREE.Color();

  const mix3Colors = (
    out: THREE.Color,
    c1: THREE.Color,
    w1: number,
    c2: THREE.Color,
    w2: number,
    c3: THREE.Color,
    w3: number
  ) => {
    out.setRGB(
      c1.r * w1 + c2.r * w2 + c3.r * w3,
      c1.g * w1 + c2.g * w2 + c3.g * w3,
      c1.b * w1 + c2.b * w2 + c3.b * w3
    );
  };

  const animated: AnimatedEntity = {
    update: (ctx: DynamicUpdateContext) => {
      const wR = ctx.rainWeight;
      const wS = ctx.sunWeight;
      const wW = ctx.snowWeight;

      // Sky gradient blend
      mix3Colors(skyUniforms.uZenith.value, colRainZenith, wR, colSunZenith, wS, colSnowZenith, wW);
      mix3Colors(skyUniforms.uMid.value, colRainMid, wR, colSunMid, wS, colSnowMid, wW);
      mix3Colors(skyUniforms.uHorizon.value, colRainHorizon, wR, colSunHorizon, wS, colSnowHorizon, wW);

      skyUniforms.uSunGlow.value = wS;

      // Fog blend
      if (scene.fog instanceof THREE.FogExp2) {
        mix3Colors(tmpColor, colRainFog, wR, colSunFog, wS, colSnowFog, wW);
        scene.fog.color.copy(tmpColor);
        scene.fog.density = wR * 0.0068 + wS * 0.0038 + wW * 0.0062;
      }

      // Directional & Hemisphere lighting calibration (strictly capped in snow to prevent bloom whiteout!)
      mix3Colors(keyLight.color, keyRainCol, wR, keySunCol, wS, keySnowCol, wW);
      keyLight.intensity = wR * 1.25 + wS * 2.15 + wW * 1.05;

      mix3Colors(hemiLight.color, hemiSkyRain, wR, hemiSkySun, wS, hemiSkySnow, wW);
      mix3Colors(hemiLight.groundColor, hemiGndRain, wR, hemiGndSun, wS, hemiGndSnow, wW);
      hemiLight.intensity = wR * 0.82 + wS * 1.28 + wW * 0.78;

      rimLight.intensity = wR * 0.78 + wS * 0.65 + wW * 0.62;

      // Warm shop/lantern/cave lights: rich at night/snow, gentler in sunny afternoon (cave still glows warmly!)
      const warmMult = wR * 1.05 + wS * 0.45 + wW * 1.12;
      for (let i = 0; i < warmLights.length; i++) {
        warmLights[i].intensity = baseWarmIntensities[i] * warmMult;
      }

      // Rain particles update
      rainMesh.visible = wR > 0.05;
      if (rainMesh.visible) {
        rainMat.opacity = 0.17 * wR;
        const t = ctx.time;
        for (let i = 0; i < rainCount; i++) {
          const d = rainData[i];
          const y = 30 - (((t * d.speed + d.y * 1.7) % 33 + 33) % 33);
          const x = d.x + (30 - y) * 0.075;
          dummy.position.set(x, y, d.z);
          dummy.rotation.set(0, 0, -0.075);
          dummy.scale.set(1, d.len, 1);
          dummy.updateMatrix();
          rainMesh.setMatrixAt(i, dummy.matrix);
        }
        rainMesh.instanceMatrix.needsUpdate = true;
      }

      // Snow particles update
      snowMesh.visible = wW > 0.05;
      if (snowMesh.visible) {
        snowMat.opacity = 0.74 * wW;
        const t = ctx.time;
        for (let i = 0; i < snowCount; i++) {
          const d = snowData[i];
          const y = 30 - (((t * d.speed + d.y * 1.3) % 33 + 33) % 33);
          const driftX = Math.sin(t * 0.85 + d.phase) * 0.9;
          const driftZ = Math.cos(t * 0.72 + d.phase * 1.3) * 0.65;
          dummy.position.set(d.x + driftX, y, d.z + driftZ);
          dummy.rotation.set(t * 0.5 + d.phase, t * 0.7, 0);
          dummy.scale.setScalar(d.scale);
          dummy.updateMatrix();
          snowMesh.setMatrixAt(i, dummy.matrix);
        }
        snowMesh.instanceMatrix.needsUpdate = true;
      }
    },
  };

  return { group, animated, keyLight, rimLight, hemiLight, skyUniforms };
}
