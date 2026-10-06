import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

const TAU = Math.PI * 2;
const SUN = new THREE.Vector3(-0.65, 0.2, -0.7).normalize();
const color = (hex) => new THREE.Color(hex);

const noiseGLSL = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    return noise(p) * 0.57 + noise(p * 2.07 + 17.4) * 0.28 + noise(p * 4.13 + 31.8) * 0.15;
  }
`;

const worldVertex = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

function createSky() {
  const material = new THREE.ShaderMaterial({
    name: "sunset-painted-sky",
    uniforms: {
      uTime: { value: 0 },
      uDrift: { value: new THREE.Vector2(0, 1) },
      uSunDirection: { value: SUN.clone() },
      uSunRadius: { value: 0.037 },
      uStrataOpacity: { value: 0.46 },
      uStrataWarp: { value: new THREE.Vector2(1.7, 3.6) },
      uZenith: { value: color("#382647") },
      uHorizon: { value: color("#c87675") },
      uGold: { value: color("#ffbd71") },
      uRose: { value: color("#d98180") },
      uPlum: { value: color("#795369") },
    },
    vertexShader: worldVertex,
    fragmentShader: /* glsl */ `
      uniform vec2 uDrift;
      uniform vec2 uStrataWarp;
      uniform float uSunRadius;
      uniform float uStrataOpacity;
      uniform vec3 uSunDirection, uZenith, uHorizon, uGold, uRose, uPlum;
      varying vec3 vWorldPosition;
      ${noiseGLSL}
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        float sunDot = max(dot(direction, uSunDirection), 0.0);
        float height = max(direction.y, 0.0);
        float sunset = pow(sunDot, 3.5);
        vec3 paint = mix(uHorizon, uZenith, smoothstep(0.04, 0.88, height));
        paint = mix(paint, uRose, sunset * 0.55);
        paint = mix(paint, uGold, pow(sunDot, 10.0) * 0.90);
        paint += uGold * pow(sunDot, 36.0) * 0.16;

        // Low-frequency two-axis curls break up elongated washes. Keeping the
        // contrast translucent avoids evenly spaced, ruler-straight stripes.
        float longitude = atan(direction.z, direction.x);
        vec2 washSpace = vec2(longitude * 1.6, direction.y * 5.2);
        vec2 warp = vec2(fbm(washSpace + vec2(9.2, 3.1)),
          fbm(washSpace + vec2(23.8, 11.7))) - 0.5;
        vec2 p = vec2(longitude * 5.8, direction.y * 17.0);
        p += warp * uStrataWarp;
        p.y += sin(longitude * 2.3 + warp.x * 4.0) * 0.72;
        p += uDrift * vec2(0.035, 0.018);
        float cloudWash = fbm(p);
        float streak = smoothstep(0.38, 0.79, cloudWash);
        float skyMask = smoothstep(-0.01, 0.08, direction.y) *
          (1.0 - smoothstep(0.65, 0.94, direction.y));
        float brokenEdge = smoothstep(0.30, 0.72,
          fbm(washSpace * vec2(2.8, 1.5) + warp * 1.6 + 40.0));
        vec3 cloudPaint = mix(uPlum, uRose, sunset * 0.56);
        paint = mix(paint, cloudPaint,
          streak * skyMask * (0.28 + brokenEdge * 0.72) * uStrataOpacity);
        float warmLip = smoothstep(0.44, 0.53, cloudWash) *
          (1.0 - smoothstep(0.53, 0.61, cloudWash));
        paint = mix(paint, uGold, warmLip * skyMask * sunset * 0.12);

        float angularDistance = acos(clamp(sunDot, 0.0, 1.0));
        float disk = 1.0 - smoothstep(uSunRadius * 0.89, uSunRadius, angularDistance);
        float halo = exp(-angularDistance * angularDistance / 0.010);
        paint += uGold * halo * 0.25;
        paint = mix(paint, uGold * 1.42 + vec3(0.10, 0.07, 0.035), disk);
        gl_FragColor = vec4(paint, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 20), material);
  sky.name = "sunset-sky";
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  return sky;
}

function createSea() {
  const material = new THREE.ShaderMaterial({
    name: "sunset-plum-reflective-water",
    uniforms: {
      uTime: { value: 0 },
      uDrift: { value: new THREE.Vector2(0, 1) },
      uSunDirection: { value: SUN.clone() },
      uDeep: { value: color("#211b39") },
      uViolet: { value: color("#49304e") },
      uBronze: { value: color("#9e6262") },
      uGold: { value: color("#ffbd71") },
      uRippleDensity: { value: 0.86 },
    },
    vertexShader: worldVertex,
    fragmentShader: /* glsl */ `
      uniform float uRippleDensity;
      uniform vec2 uDrift;
      uniform vec3 uSunDirection, uDeep, uViolet, uBronze, uGold;
      varying vec3 vWorldPosition;
      ${noiseGLSL}
      float wavelet(vec2 p, float scale, float seed) {
        p /= scale;
        vec2 drift = uDrift * vec2(0.9, 1.3);
        p += drift + vec2(noise(p * 0.013), noise(p * 0.029 + seed)) * 2.7;
        vec2 cellSize = vec2(12.0, 4.0);
        vec2 cell = floor(p / cellSize);
        float random = hash(cell + seed);
        vec2 local = p - (cell + vec2(0.25 + hash(cell + 21.0) * 0.5,
          0.25 + hash(cell + 38.0) * 0.5)) * cellSize;
        float halfLength = 1.4 + random * 3.8;
        float bend = sin(local.x * 0.36 + random * 6.2) * 0.12;
        float distanceToLine = abs(local.y - bend);
        float footprint = max(fwidth(distanceToLine), 0.02);
        float width = 0.10 + random * 0.18;
        float line = 1.0 - smoothstep(width, width + footprint, distanceToLine);
        float ends = 1.0 - smoothstep(halfLength * 0.45, halfLength, abs(local.x));
        return line * ends * min(1.0, width / footprint) * step(1.0 - uRippleDensity, random);
      }
      void main() {
        vec2 sunAxis = normalize(uSunDirection.xz);
        vec2 crossAxis = vec2(-sunAxis.y, sunAxis.x);
        vec2 p = vec2(dot(vWorldPosition.xz, crossAxis), dot(vWorldPosition.xz, sunAxis));
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        vec3 halfDirection = normalize(viewDirection + uSunDirection);
        float broadReflection = pow(max(halfDirection.y, 0.0), 19.0);
        float horizon = 1.0 - smoothstep(0.03, 0.45, viewDirection.y);
        float swell = noise(p * vec2(0.003, 0.017) + uDrift * 0.06);
        vec3 paint = mix(uDeep, uViolet, 0.2 + swell * 0.55);
        paint = mix(paint, uBronze, broadReflection * (0.32 + swell * 0.43));
        paint = mix(paint, uBronze, horizon * 0.22);

        float shortWaves = wavelet(p, 1.0, 7.0) + wavelet(p, 0.46, 71.0) * 0.62;
        float fine = noise(p * vec2(0.12, 0.87) + uDrift * 0.14);
        vec3 normal = normalize(vec3((noise(p * 0.024) - 0.5) * 0.11, 1.0,
          (fine - 0.5) * 0.23));
        float glint = pow(max(dot(normal, halfDirection), 0.0), 110.0);
        float distanceFade = 1.0 - smoothstep(2400.0, 9500.0,
          distance(cameraPosition, vWorldPosition));
        float goldMark = (shortWaves * (0.13 + broadReflection * 0.67) +
          glint * smoothstep(0.60, 0.85, fine) * 0.50) * distanceFade;
        paint = mix(paint, mix(uBronze, uGold, broadReflection), clamp(goldMark, 0.0, 0.93));
        paint += uGold * glint * shortWaves * 0.17 * distanceFade;
        gl_FragColor = vec4(paint, 1.0);
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000), material);
  sea.name = "sunset-sea";
  sea.rotation.x = -Math.PI / 2;
  return sea;
}

function createCloudMaterial() {
  return new THREE.ShaderMaterial({
    name: "sunset-violet-cloud-paint",
    uniforms: {
      uSunDirection: { value: SUN.clone() },
      uDeep: { value: color("#49345f") },
      uShadow: { value: color("#604079") },
      uViolet: { value: color("#694386") },
      uLavender: { value: color("#9b68aa") },
      uCoral: { value: color("#d98180") },
      uGold: { value: color("#ffbd71") },
      uHaze: { value: color("#a0698e") },
      uRimPower: { value: 1.75 },
      uBandSoftness: { value: 0.095 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        mat3 instanceBasis = mat3(instanceMatrix);
        vec3 scaleSquared = vec3(dot(instanceBasis[0], instanceBasis[0]),
          dot(instanceBasis[1], instanceBasis[1]), dot(instanceBasis[2], instanceBasis[2]));
        vWorldNormal = normalize(mat3(modelMatrix) * instanceBasis * (normal / scaleSquared));
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDirection, uDeep, uShadow, uViolet, uLavender, uCoral, uGold, uHaze;
      uniform float uRimPower, uBandSoftness;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPosition;
      ${noiseGLSL}
      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 eye = normalize(cameraPosition - vWorldPosition);
        float sunFacing = dot(n, uSunDirection);
        float brush = fbm(vLocalPosition.xz * 4.1 + vLocalPosition.y * 2.6);
        float light = sunFacing * 0.77 + n.y * 0.24 + (brush - 0.5) * 0.20;

        // Soft shoulders between stable paint tones preserve stepped faces
        // without dark, hollow-looking contour bands between every billow.
        vec3 paint = mix(uDeep, uShadow,
          smoothstep(-0.56 - uBandSoftness, -0.56 + uBandSoftness, light));
        paint = mix(paint, uViolet,
          smoothstep(-0.15 - uBandSoftness, -0.15 + uBandSoftness, light));
        paint = mix(paint, uLavender,
          smoothstep(0.235 - uBandSoftness, 0.235 + uBandSoftness, light));
        paint = mix(paint, uCoral,
          smoothstep(0.715 - uBandSoftness, 0.715 + uBandSoftness, light) * 0.57);
        float hollow = (1.0 - smoothstep(-0.76, -0.08, n.y)) *
          (1.0 - smoothstep(0.0, 0.42, sunFacing));
        paint = mix(paint, uShadow, hollow * 0.28);
        paint *= 0.965 + brush * 0.07;

        float silhouette = 1.0 - max(dot(n, eye), 0.0);
        float sunEdge = pow(silhouette, uRimPower + brush * 0.55) *
          smoothstep(-0.34, 0.30, sunFacing);
        float edge = smoothstep(0.035, 0.64, sunEdge);
        paint = mix(paint, uGold * 1.13, edge * 0.87);
        paint += uGold * pow(sunEdge, 1.5) * 0.18;

        float haze = smoothstep(800.0, 6200.0, distance(cameraPosition, vWorldPosition));
        float sunward = pow(max(dot(normalize(vWorldPosition - cameraPosition), uSunDirection), 0.0), 5.0);
        vec3 hazePaint = mix(uHaze, mix(uCoral, uGold, 0.35), sunward * 0.72);
        paint = mix(paint, hazePaint, haze * 0.73);
        gl_FragColor = vec4(paint, 1.0);
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false,
  });
}

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Bake an implicit sculpted bank once; no field sampling is done per frame. */
function createCloudGeometry(variant, resolution, material) {
  const random = randomSequence(4169 + variant * 977);
  const field = new MarchingCubes(resolution, material, false, false, 22000);
  field.isolation = 0;
  // A locally smoothed union retains each billow's shoulder and scalloped
  // valley. Additive metaballs overfill those valleys and become one balloon.
  const lobes = [
    [0.22, 0.37, 0.5, 0.102],
    [0.35, 0.35, 0.5, 0.113],
    [0.49, 0.35, 0.48, 0.115],
    [0.62, 0.36, 0.5, 0.105],
    [0.75, 0.39, 0.5, 0.091],
    [0.3, 0.48, 0.45, 0.101],
    [0.44, 0.48, 0.53, 0.112],
    [0.59, 0.49, 0.47, 0.106],
    [0.7, 0.52, 0.51, 0.085],
    [0.41, 0.62, 0.49, 0.101],
    [0.55, 0.63, 0.51, 0.106],
    [0.49, 0.76, 0.48, 0.093],
    [0.34, 0.4, 0.36, 0.094],
    [0.58, 0.41, 0.34, 0.093],
    [0.42, 0.4, 0.65, 0.092],
    [0.62, 0.4, 0.64, 0.095],
    [0.49, 0.57, 0.36, 0.088],
    [0.52, 0.56, 0.65, 0.092],
  ];
  for (const lobe of lobes) {
    lobe[0] += (random() - 0.5) * 0.035;
    lobe[1] += (random() - 0.5) * 0.035;
    lobe[2] += (random() - 0.5) * 0.035;
    lobe[3] *= 0.94 + random() * 0.12;
  }
  for (let i = 0; i < 22; i += 1) {
    const parent = lobes[i % 18];
    const angle = random() * TAU;
    const vertical = random() * 2 - 1;
    const radial = Math.sqrt(1 - vertical * vertical);
    const offset = parent[3] * 1.02;
    lobes.push([
      parent[0] + Math.cos(angle) * radial * offset,
      parent[1] + vertical * offset,
      parent[2] + Math.sin(angle) * radial * offset,
      0.046 + random() * 0.018,
    ]);
  }
  const blend = 0.012;
  for (let z = 0; z < resolution; z += 1) {
    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        let union = -2;
        for (const [cx, cy, cz, radius] of lobes) {
          const dx = x / resolution - cx,
            dy = y / resolution - cy,
            dz = z / resolution - cz;
          const distance = radius - Math.sqrt(dx * dx + dy * dy + dz * dz);
          const overlap =
            Math.max(blend - Math.abs(union - distance), 0) / blend;
          union = Math.max(union, distance) + overlap * overlap * blend * 0.25;
        }
        field.field[x + y * resolution + z * resolution * resolution] = union;
      }
    }
  }
  field.update();
  const geometry = new THREE.BufferGeometry();
  geometry.name = `sculpted-cloud-${variant}-${resolution}`;
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      field.geometry.getAttribute("position").array.slice(0, field.count * 3),
      3,
    ),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(
      field.geometry.getAttribute("normal").array.slice(0, field.count * 3),
      3,
    ),
  );
  field.geometry.dispose();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  const positions = geometry.getAttribute("position");
  let horizontalRadius = 0;
  for (let i = 0; i < positions.count; i += 1) {
    horizontalRadius = Math.max(
      horizontalRadius,
      Math.hypot(positions.getX(i), positions.getZ(i)),
    );
  }
  const height = [1.1, 1.72, 0.92, 1.42][variant];
  geometry.scale(
    1 / horizontalRadius,
    height / horizontalRadius,
    1 / horizontalRadius,
  );
  geometry.normalizeNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function cloudPlacements() {
  const near = [];
  const far = [];
  const random = randomSequence(98317);
  // The central island of cloud and outer banks frame, but never intersect,
  // the 280–400m clear flight annulus. Radii include the complete silhouettes.
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * TAU) / 4 + 0.29;
    const radius = 50 + random() * 35;
    near.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 320 + random() * 265,
      horizontalRadius: 35 + random() * 25,
      angle: random() * TAU,
      variant: i % 4,
    });
  }
  for (let i = 0; i < 16; i += 1) {
    const angle = (i * TAU) / 16 + 0.11;
    const radius = 890 + random() * 370;
    near.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 310 + random() * 315,
      horizontalRadius: 80 + random() * 55,
      angle: random() * TAU,
      variant: i % 4,
    });
  }
  for (let i = 0; i < 32; i += 1) {
    const angle = (i * TAU) / 16 + (i >= 16 ? 0.19 : 0.0);
    const radius = (i < 16 ? 1900 : 3700) + random() * 550;
    far.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 370 + random() * (i < 16 ? 650 : 1050),
      horizontalRadius: (i < 16 ? 155 : 290) + random() * 145,
      angle: random() * TAU,
      variant: i % 4,
    });
  }
  return { near, far };
}

function createClouds() {
  const root = new THREE.Group();
  root.name = "sunset-clouds";
  const material = createCloudMaterial();
  const high = Array.from({ length: 4 }, (_, i) =>
    createCloudGeometry(i, 44, material),
  );
  const low = Array.from({ length: 4 }, (_, i) =>
    createCloudGeometry(i, 28, material),
  );
  const placements = cloudPlacements();
  const transform = new THREE.Object3D();
  for (const layer of ["near", "far"]) {
    for (let variant = 0; variant < 4; variant += 1) {
      const cluster = placements[layer].filter(
        (entry) => entry.variant === variant,
      );
      const mesh = new THREE.InstancedMesh(
        high[variant],
        material,
        cluster.length,
      );
      mesh.name = `sunset-${layer}-cloud-bank-${variant}`;
      mesh.userData = {
        layer,
        placements: cluster,
        highCount: cluster.length,
        lowCount: layer === "near" ? 3 : 5,
        variant,
      };
      cluster.forEach((entry, index) => {
        transform.position.set(entry.x, entry.y, entry.z);
        transform.rotation.set(0, entry.angle, 0);
        transform.scale.setScalar(entry.horizontalRadius);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      // Each bank covers several quadrants. The frozen conservative bounding
      // sphere also contains both tessellation levels during quality changes.
      mesh.computeBoundingSphere();
      root.add(mesh);
    }
  }
  return { root, high, low, material };
}

/** Locally rendered violet-cloud sunset. Y-up; water is at Y=0. */
export function createSunsetWorld(scene, { quality = "high" } = {}) {
  const previousFog = scene.fog;
  const previousBackground = scene.background;
  const fog = new THREE.Fog("#9c687f", 1600, 8500);
  const background = color("#211b39");
  scene.fog = fog;
  scene.background = background;
  const root = new THREE.Group();
  root.name = "sunset-world";
  const sky = createSky();
  const sea = createSea();
  const clouds = createClouds();
  const hemisphere = new THREE.HemisphereLight("#d99bab", "#352744", 1.5);
  hemisphere.name = "sunset-hemisphere";
  const sun = new THREE.DirectionalLight("#ffbd71", 2.8);
  sun.name = "sunset-sun";
  sun.position.copy(SUN).multiplyScalar(1000);
  root.add(sky, sea, clouds.root, hemisphere, sun);
  scene.add(root);

  let disposed = false;
  const cameraPosition = new THREE.Vector3();
  const setQuality = (nextQuality) => {
    if (disposed) return;
    const low = nextQuality === "low";
    for (const mesh of clouds.root.children) {
      mesh.geometry = (low ? clouds.low : clouds.high)[mesh.userData.variant];
      mesh.count = low ? mesh.userData.lowCount : mesh.userData.highCount;
    }
    root.userData.quality = low ? "low" : "high";
  };
  setQuality(quality);

  return {
    update(time, camera) {
      if (disposed) return;
      const safeTime = Number.isFinite(time) ? time : 0;
      sea.material.uniforms.uTime.value = safeTime;
      sky.material.uniforms.uTime.value = safeTime;
      const phase = ((((safeTime % 24) + 24) % 24) * TAU) / 24;
      sea.material.uniforms.uDrift.value.set(Math.sin(phase), Math.cos(phase));
      sky.material.uniforms.uDrift.value.copy(
        sea.material.uniforms.uDrift.value,
      );
      if (camera?.getWorldPosition) {
        camera.getWorldPosition(cameraPosition);
        if (cameraPosition.toArray().every(Number.isFinite))
          sky.position.copy(cameraPosition);
      }
    },
    setQuality,
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set([
        sky.geometry,
        sea.geometry,
        ...clouds.high,
        ...clouds.low,
      ]);
      for (const geometry of geometries) geometry.dispose();
      for (const material of new Set([
        sky.material,
        sea.material,
        clouds.material,
      ]))
        material.dispose();
      for (const mesh of clouds.root.children) mesh.dispose();
      scene.remove(root);
      if (scene.fog === fog) scene.fog = previousFog;
      if (scene.background === background)
        scene.background = previousBackground;
    },
  };
}
