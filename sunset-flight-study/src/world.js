import * as THREE from "three";
import { createPaintedCloudTexture } from "./painted-clouds.js";

const HORIZON = "#add5df";
const TAU = Math.PI * 2;

const seaVertex = /* glsl */ `
  varying vec3 vWorldPosition;
  #include <fog_pars_vertex>
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const seaFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uTeal;
  uniform vec3 uDistant;
  uniform vec3 uFoam;
  uniform vec3 uSun;
  uniform float uRippleOpacity;
  uniform float uRippleDensity;
  uniform vec2 uRippleLength;
  uniform float uPatchContrast;
  uniform vec2 uWashFade;
  varying vec3 vWorldPosition;
  #include <fog_pars_fragment>

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
      mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
  float brushWave(vec2 p, float scale, vec2 offset) {
    p = p / scale + offset;
    vec2 drift = p + vec2(uTime * 0.23, uTime * 0.18);
    vec2 warp = vec2(noise(p * 0.012), noise(p * 0.015 + 51.0)) * 16.0;
    vec2 brushSpace = drift + warp;
    vec2 cellSize = vec2(76.0, 34.0);
    vec2 cell = floor(brushSpace / cellSize);
    float seed = hash(cell + 19.0);
    vec2 anchor = vec2(0.32 + hash(cell + 7.0) * 0.36, 0.28 + hash(cell + 31.0) * 0.44);
    vec2 mark = brushSpace - (cell + anchor) * cellSize;
    float angle = (hash(cell + 67.0) - 0.5) * 0.48;
    mark = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * mark;
    float halfLength = mix(uRippleLength.x, uRippleLength.y, hash(cell + 47.0)) * 0.5;
    float curve = (hash(cell + 83.0) - 0.5) * 0.012 * mark.x * mark.x + sin(mark.x * 0.27 + seed * 6.0) * 0.28;
    float lineWidth = 0.42 + seed * 0.34;
    float brushDistance = abs(mark.y - curve);
    float footprint = max(fwidth(brushDistance), 0.025);
    float line = 1.0 - smoothstep(lineWidth, lineWidth + footprint, brushDistance);
    float ends = 1.0 - smoothstep(halfLength * 0.55, halfLength, abs(mark.x));
    float clusters = smoothstep(0.28, 0.60, noise(p * 0.005 + 21.0));
    float rippleMask = step(1.0 - uRippleDensity, seed) * clusters;
    float coverage = min(1.0, lineWidth / footprint);
    float dryBrush = 0.65 + noise(mark * vec2(0.55, 2.8) + seed * 30.0) * 0.35;
    return line * ends * rippleMask * coverage * dryBrush;
  }
  void main() {
    vec2 p = vWorldPosition.xz;
    float viewDistance = distance(cameraPosition, vWorldPosition);
    float washVisibility = 1.0 - smoothstep(uWashFade.x, uWashFade.y, viewDistance);
    vec2 washWarp = vec2(noise(p * 0.003), noise(p * 0.004 + 41.0)) * 0.85;
    float broad = noise(p * vec2(0.0028, 0.014) + washWarp + vec2(uTime * 0.002, 0.0));
    float brushWash = noise(p * vec2(0.009, 0.055) + washWarp * 0.8);
    float paint = clamp(0.5 + ((broad - 0.5) * uPatchContrast * 2.2 + (brushWash - 0.5) * 0.14) * washVisibility, 0.0, 1.0);
    vec3 color = mix(uDeep, uShallow, smoothstep(0.12, 0.88, paint));
    float tealPatch = smoothstep(0.51, 0.73, noise(p * vec2(0.010, 0.018) + washWarp + 67.0));
    color = mix(color, uTeal, tealPatch * 0.24 * washVisibility);
    color = mix(color, uDistant, (1.0 - washVisibility) * 0.64);
    float pigment = noise(p * vec2(0.11, 0.18));
    color *= 1.0 + (pigment - 0.5) * 0.023 * washVisibility;
    float swell = sin(p.y * 0.040 + sin(p.x * 0.011) * 1.8 + uTime * 0.32);
    float paintedWaves = brushWave(p, 1.0, vec2(0.0)) + brushWave(p, 0.56, vec2(391.2, -713.4)) * 0.72;
    float nearFade = 1.0 - smoothstep(450.0, 1800.0, viewDistance);
    color = mix(color, uFoam, clamp(paintedWaves, 0.0, 1.0) * nearFade * uRippleOpacity);

    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(vec3(-0.62, 0.65, -0.44));
    vec3 halfDirection = normalize(viewDirection + sunDirection);
    vec3 waveNormal = normalize(vec3(swell * 0.04, 1.0, sin(p.x * 0.037 + uTime * 0.5) * 0.04));
    float sunRoad = pow(max(dot(waveNormal, halfDirection), 0.0), 26.0);
    float glitter = smoothstep(0.83, 0.97, noise(p * vec2(0.27, 0.58) + uTime * 0.15));
    color = mix(color, uSun, sunRoad * (0.035 + glitter * 0.08) * nearFade);
    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createSea() {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color("#337c98") },
        uShallow: { value: new THREE.Color("#4897a7") },
        uTeal: { value: new THREE.Color("#3c929f") },
        uDistant: { value: new THREE.Color("#6796a7") },
        uFoam: { value: new THREE.Color("#a7d5d5") },
        uSun: { value: new THREE.Color("#f4e5b8") },
        uRippleOpacity: { value: 0.32 },
        uRippleDensity: { value: 0.32 },
        uRippleLength: { value: new THREE.Vector2(12, 35) },
        uPatchContrast: { value: 0.40 },
        uWashFade: { value: new THREE.Vector2(300, 1800) },
      },
    ]),
    vertexShader: seaVertex,
    fragmentShader: seaFragment,
    fog: true,
    toneMapped: false,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(18000, 18000), material);
  sea.name = "adriatic-sea";
  sea.rotation.x = -Math.PI / 2;
  return sea;
}

function createSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color("#6fb9d8") },
      uHorizon: { value: new THREE.Color(HORIZON) },
      uCream: { value: new THREE.Color("#eee7cd") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uCream;
      varying vec3 vWorldPosition;
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        float height = max(direction.y, 0.0);
        vec3 color = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.62, height), 0.36));
        float sun = max(dot(direction, normalize(vec3(-0.62, 0.65, -0.44))), 0.0);
        color = mix(color, uCream, pow(sun, 16.0) * 0.20);
        color = mix(color, uCream, pow(sun, 90.0) * 0.10);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 20), material);
  sky.name = "adriatic-sky";
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return sky;
}

function createClouds() {
  const clouds = new THREE.Group();
  clouds.name = "adriatic-clouds";
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials = [0, 1, 2].map(variant => new THREE.MeshBasicMaterial({
    map: createPaintedCloudTexture({ variant }),
    transparent: true,
    alphaTest: 0.004,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  const banks = [
    [
      [-760, 310, -1080, 560, 280, 0],
      [720, 380, -1320, 650, 325, 2],
      [40, 460, -2050, 850, 390, 1],
      [-1550, 330, 150, 680, 315, 2],
      [1580, 380, 280, 700, 350, 0],
      [240, 300, 1620, 640, 300, 1],
      [-1170, 450, 1620, 730, 350, 0],
    ],
    [
      [-300, 240, -1250, 290, 145, 2],
      [1260, 230, -2100, 520, 245, 0],
      [-1780, 420, -1850, 840, 410, 1],
      [2130, 450, -1180, 700, 350, 2],
      [-2080, 280, 940, 690, 310, 0],
      [1320, 320, 1860, 610, 305, 1],
      [-150, 460, 2550, 960, 420, 2],
    ],
  ];
  banks.forEach((placements, bankIndex) => {
    const bank = new THREE.Group();
    bank.name = bankIndex === 0 ? "clouds-primary" : "clouds-distant";
    placements.forEach(([x, y, z, width, height, variant], index) => {
      const cloud = new THREE.Mesh(geometry, materials[variant]);
      cloud.name = `painted-cloud-${bankIndex}-${index}`;
      cloud.position.set(x, y, z);
      cloud.scale.set(width, height, 1);
      bank.add(cloud);
    });
    clouds.add(bank);
  });
  return clouds;
}

function coastline(theta, seed) {
  return (
    1 +
    0.17 * Math.sin(theta * 3 + seed) +
    0.072 * Math.cos(theta * 7 - seed * 0.8) +
    0.034 * Math.sin(theta * 13 + seed * 2)
  );
}

function islandGeometry(radiusX, radiusZ, height, seed, top) {
  const positions = [];
  const colors = [];
  const indices = [];
  const segments = 96;
  const ringCount = top ? 7 : 6;
  const cliffLow = new THREE.Color("#a5ada0");
  const cliffHigh = new THREE.Color("#e5d1ac");
  const greenLow = new THREE.Color("#778d65");
  const greenHigh = new THREE.Color("#a7ad76");
  const color = new THREE.Color();

  for (let ring = 0; ring < ringCount; ring += 1) {
    const fraction = ring / (ringCount - 1);
    const radial = top
      ? 0.86 * (1 - fraction) + 0.008 * fraction
      : [1.05, 1.005, 0.98, 0.93, 0.91, 0.86][ring];
    for (let segment = 0; segment <= segments; segment += 1) {
      const theta = (segment / segments) * TAU;
      const weathering = top
        ? 0
        : Math.sin(fraction * Math.PI) *
          (0.026 * Math.sin(theta * 11 + seed + fraction) +
            0.015 * Math.cos(theta * 23));
      const coast = coastline(theta, seed) + weathering;
      const x = Math.cos(theta) * radiusX * radial * coast;
      const z = Math.sin(theta) * radiusZ * radial * coast;
      const rim =
        height *
        (0.72 +
          0.11 * Math.sin(theta * 3 + seed) +
          0.028 * Math.sin(theta * 7) +
          0.018 * Math.cos(theta * 11 + seed));
      const y = top
        ? rim * (1 - fraction) +
          height * fraction +
          Math.sin(fraction * Math.PI) *
            height *
            (0.16 * Math.sin(theta * 2 + seed) + 0.04 * Math.sin(theta * 5))
        : -3 +
          (rim + 3) * fraction +
          Math.sin(theta * 17 + ring * 0.7) *
            2.3 *
            Math.sin(fraction * Math.PI);
      positions.push(x, y, z);
      if (top) {
        color
          .copy(greenLow)
          .lerp(greenHigh, 0.45 + 0.25 * Math.sin(x * 0.047 + z * 0.053));
      } else {
        color.copy(cliffLow).lerp(cliffHigh, Math.pow(fraction, 0.48));
        const stratum =
          Math.sin(fraction * 27 + Math.sin(theta * 5) * 0.9) * 0.025;
        color.multiplyScalar(
          0.94 + 0.055 * Math.sin(theta * 19 + seed) + stratum,
        );
      }
      colors.push(color.r, color.g, color.b);
      if (ring < ringCount - 1 && segment < segments) {
        const a = ring * (segments + 1) + segment;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Fixed broad directional values read like background paint, not lit plastic.
  const normals = geometry.attributes.normal;
  const paintedColors = geometry.attributes.color;
  const shadowColor = new THREE.Color("#859fa6");
  const sunlight = new THREE.Vector3(-0.62, 0.65, -0.44).normalize();
  const normal = new THREE.Vector3();
  for (let index = 0; index < paintedColors.count; index += 1) {
    normal.fromBufferAttribute(normals, index);
    const illumination = THREE.MathUtils.smoothstep(normal.dot(sunlight), -0.45, 0.75);
    color.fromBufferAttribute(paintedColors, index);
    if (top) color.multiplyScalar(0.89 + illumination * 0.11);
    else color.lerp(shadowColor, (1 - illumination) * 0.34);
    paintedColors.setXYZ(index, color.r, color.g, color.b);
  }
  return geometry;
}

function createShore(radiusX, radiusZ, seed) {
  const vertices = [];
  const indices = [];
  const segments = 128;
  for (let i = 0; i <= segments; i += 1) {
    const theta = (i / segments) * TAU;
    const coast = coastline(theta, seed);
    for (const radius of [1.04, 1.08]) {
      vertices.push(
        Math.cos(theta) * radiusX * coast * radius,
        0.4,
        Math.sin(theta) * radiusZ * coast * radius,
      );
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createIslands() {
  const islands = new THREE.Group();
  islands.name = "adriatic-islands";
  const landMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    toneMapped: false,
  });
  const foamMaterial = new THREE.MeshBasicMaterial({
    color: "#b9d9cf",
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const placements = [
    [700, -720, 225, 120, 88, 1.8, -0.48],
    [-860, -1080, 260, 155, 112, 0.7, 0.42],
    [1450, 850, 310, 130, 64, 3.2, -0.7],
    [-1480, 920, 190, 85, 49, 2.4, 0.3],
  ];
  placements.forEach(([x, z, radiusX, radiusZ, height, seed, angle], index) => {
    const island = new THREE.Group();
    island.name = `limestone-island-${index + 1}`;
    island.position.set(x, 0, z);
    island.rotation.y = angle;
    const cliff = new THREE.Mesh(
      islandGeometry(radiusX, radiusZ, height, seed, false),
      landMaterial,
    );
    cliff.name = `island-cliffs-${index + 1}`;
    const top = new THREE.Mesh(
      islandGeometry(radiusX, radiusZ, height, seed, true),
      landMaterial,
    );
    top.name = `island-meadow-${index + 1}`;
    const shore = new THREE.Mesh(
      createShore(radiusX, radiusZ, seed),
      foamMaterial,
    );
    shore.name = `island-surf-${index + 1}`;
    island.add(cliff, top, shore);
    islands.add(island);
  });
  return islands;
}

/** Create a DOM-free, locally generated Adriatic stage. Coordinates are Y-up; sea is Y=0. */
export function createWorld(scene, { quality = "high" } = {}) {
  const previousFog = scene.fog;
  const previousBackground = scene.background;
  const fog = new THREE.Fog(HORIZON, 1350, 8400);
  const background = new THREE.Color(HORIZON);
  scene.fog = fog;
  scene.background = background;

  const root = new THREE.Group();
  root.name = "adriatic-world";
  const sea = createSea();
  const sky = createSky();
  const clouds = createClouds();
  root.add(sea, sky, clouds, createIslands());

  const ambient = new THREE.HemisphereLight("#fff0d5", "#66949d", 2.2);
  ambient.name = "adriatic-hemisphere";
  const sun = new THREE.DirectionalLight("#fff0cc", 2.6);
  sun.name = "adriatic-sun";
  sun.position.set(-650, 850, -450);
  root.add(ambient, sun);
  scene.add(root);

  const cloudCards = [];
  clouds.traverse(object => { if (object.isMesh) cloudCards.push(object); });
  const cameraWorldPosition = new THREE.Vector3();

  let disposed = false;
  const setQuality = (nextQuality) => {
    if (disposed) return;
    clouds.children[1].visible = nextQuality !== "low";
  };
  setQuality(quality);

  return {
    update(time, camera) {
      if (disposed) return;
      sea.material.uniforms.uTime.value = Number.isFinite(time) ? time : 0;
      if (camera?.position) {
        camera.getWorldPosition(cameraWorldPosition);
        sky.position.x = cameraWorldPosition.x;
        sky.position.z = cameraWorldPosition.z;
        for (const cloud of cloudCards) cloud.lookAt(cameraWorldPosition);
      }
    },
    setQuality,
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) {
        if (material.map) textures.add(material.map);
        material.dispose();
      }
      for (const texture of textures) texture.dispose();
      scene.remove(root);
      if (scene.fog === fog) scene.fog = previousFog;
      if (scene.background === background)
        scene.background = previousBackground;
    },
  };
}
