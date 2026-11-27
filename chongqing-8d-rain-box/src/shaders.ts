import * as THREE from 'three';

export interface SharedShaderUniforms {
  uTime: { value: number };
  uRainWeight: { value: number };
  uSunWeight: { value: number };
  uSnowWeight: { value: number };
}

export function createSharedShaderUniforms(): SharedShaderUniforms {
  return {
    uTime: { value: 0 },
    uRainWeight: { value: 1 },
    uSunWeight: { value: 0 },
    uSnowWeight: { value: 0 },
  };
}

/**
 * GLSL Wet Asphalt & Crosswalk Shader (Chrome Metal ANGLE Safe):
 * - Multi-octave procedural micro-grain bump
 * - Glossy tire-track wetness channels
 * - Shimmering crimson/amber/cyan neon puddle reflections across crosswalk & curbs
 * - 3-layer concentric raindrop ripples
 * - Sunlit golden sheen in sunny mode & soft matte snow blanket in snow mode (zero bloom whiteout)
 */
export function createWetRoadMaterial(shared: SharedShaderUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uRainWeight: shared.uRainWeight,
      uSunWeight: shared.uSunWeight,
      uSnowWeight: shared.uSnowWeight,
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uRainWeight;
      uniform float uSunWeight;
      uniform float uSnowWeight;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise2(p);
          p *= 2.07;
          a *= 0.5;
        }
        return v;
      }

      // 3-layer concentric raindrop ripples
      float rainRippleLayer(vec2 p, float t, float scale) {
        vec2 g = p * scale;
        vec2 cell = floor(g);
        vec2 local = fract(g) - 0.5;
        float h = hash21(cell);
        vec2 center = (vec2(hash21(cell + 11.7), hash21(cell + 27.3)) - 0.5) * 0.45;
        float dist = length(local - center);
        float phase = fract(t * (0.62 + h * 0.48) + h * 6.2831);
        float ring = exp(-pow(max(abs(dist - phase * 0.46) * 26.0, 1e-5), 2.0));
        float fade = (1.0 - phase) * smoothstep(0.0, 0.08, phase);
        return ring * fade;
      }

      void main() {
        // Road spans X in [-11.6, 11.6], Z in [2.0, 8.5]
        vec2 wp = vWorldPos.xz;

        // Multi-octave asphalt micro-grain
        float grain = fbm(wp * 5.2);
        float fineGrain = noise2(wp * 28.0);
        vec3 baseAsphalt = mix(vec3(0.055, 0.06, 0.072), vec3(0.115, 0.12, 0.135), grain * 0.75 + fineGrain * 0.25);

        // Tire-track wetness channels along two lanes (vUv.y around 0.28, 0.42, 0.62, 0.76)
        float t1 = exp(-pow(max((vUv.y - 0.26) * 14.0, 1e-5), 2.0));
        float t2 = exp(-pow(max((vUv.y - 0.40) * 14.0, 1e-5), 2.0));
        float t3 = exp(-pow(max((vUv.y - 0.60) * 14.0, 1e-5), 2.0));
        float t4 = exp(-pow(max((vUv.y - 0.74) * 14.0, 1e-5), 2.0));
        float tireTracks = clamp(t1 + t2 + t3 + t4, 0.0, 1.0);

        // Puddle mask (more puddles along curbs, crosswalk, and tire channels)
        float puddleNoise = fbm(wp * 0.52 + vec2(3.1, 1.7));
        float curbWet = smoothstep(0.22, 0.0, vUv.y) + smoothstep(0.78, 1.0, vUv.y);
        float puddleMask = smoothstep(0.42, 0.66, puddleNoise + tireTracks * 0.24 + curbWet * 0.22);
        float wetness = clamp((0.35 + puddleMask * 0.65) * uRainWeight + 0.10 * uSnowWeight, 0.0, 1.0);

        // Road markings: double yellow center line + zebra crosswalk near x = -2.2
        float centerLineA = smoothstep(0.014, 0.005, abs(vUv.y - 0.486));
        float centerLineB = smoothstep(0.014, 0.005, abs(vUv.y - 0.514));
        float inCrosswalkX = smoothstep(0.32, 0.34, vUv.x) * smoothstep(0.47, 0.45, vUv.x);
        float zebra = step(0.46, fract(vUv.y * 8.5)) * inCrosswalkX * smoothstep(0.07, 0.11, vUv.y) * smoothstep(0.93, 0.89, vUv.y);
        float yellowMask = clamp(centerLineA + centerLineB, 0.0, 1.0) * (1.0 - inCrosswalkX);

        float wear = 0.62 + 0.38 * grain;
        vec3 roadCol = baseAsphalt;
        roadCol = mix(roadCol, vec3(0.68, 0.50, 0.12) * wear, yellowMask * 0.82);
        roadCol = mix(roadCol, vec3(0.66, 0.67, 0.69) * wear, zebra * 0.76);

        // Darken wet asphalt slightly
        roadCol *= mix(1.0, 0.62, wetness);

        // 3-layer raindrop ripples
        float r1 = rainRippleLayer(wp, uTime, 1.35);
        float r2 = rainRippleLayer(wp + vec2(4.7, 2.3), uTime * 1.13, 2.15);
        float r3 = rainRippleLayer(wp + vec2(9.1, 6.4), uTime * 0.89, 3.35);
        float ripples = (r1 + r2 * 0.8 + r3 * 0.6) * puddleMask * uRainWeight;

        // Perturbed normal for shimmering reflections
        vec3 N = normalize(vec3(
          (grain - 0.5) * 0.16 + (r1 - r2) * 0.18 * uRainWeight,
          1.0,
          (fineGrain - 0.5) * 0.16 + (r2 - r3) * 0.18 * uRainWeight
        ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(N, V), 0.001, 1.0);
        float fresnel = pow(max(1.0 - ndotv, 1e-5), 3.0);

        // Neon puddle reflections aligned with actual shop & lantern positions along the street
        // Crimson hotpot glow left (x ~ -7.2), warm amber noodle/lantern center (x ~ -2.2), warm tea/cyan neon right (x ~ 5.5)
        float distCrimson = length((wp - vec2(-7.0, 3.4)) * vec2(0.22, 0.42));
        float distAmber = length((wp - vec2(-2.2, 4.1)) * vec2(0.24, 0.40));
        float distCyan = length((wp - vec2(5.6, 3.8)) * vec2(0.22, 0.42));
        float distGold = length((wp - vec2(1.4, 3.2)) * vec2(0.28, 0.45));

        float shimmer = 0.72 + 0.28 * sin(wp.x * 3.1 + uTime * 2.2 + grain * 6.0);
        vec3 neonRefl = vec3(0.0);
        neonRefl += vec3(0.95, 0.22, 0.16) * exp(-distCrimson * distCrimson * 1.15) * 0.78;
        neonRefl += vec3(1.00, 0.64, 0.22) * exp(-distAmber * distAmber * 1.05) * 0.68;
        neonRefl += vec3(0.20, 0.78, 0.88) * exp(-distCyan * distCyan * 1.25) * 0.56;
        neonRefl += vec3(0.98, 0.76, 0.34) * exp(-distGold * distGold * 1.25) * 0.50;
        neonRefl *= shimmer;

        // Wet specular streak reflection
        float specStrength = (0.28 + 0.72 * fresnel) * wetness;
        vec3 color = roadCol + neonRefl * specStrength * (0.55 + 0.65 * puddleMask) * (1.0 - uSunWeight * 0.72);
        // Subtle raindrop ripple glint
        color += vec3(0.62, 0.74, 0.88) * ripples * 0.24;

        // Sunlit warm golden afternoon lighting
        vec3 sunDir = normalize(vec3(0.55, 0.62, 0.45));
        vec3 H = normalize(sunDir + V);
        float sunDiff = clamp(dot(N, sunDir), 0.0, 1.0);
        float sunSpec = pow(max(dot(N, H), 1e-5), 26.0);
        vec3 sunCol = roadCol * (1.25 + sunDiff * 0.85) * vec3(1.08, 0.99, 0.88) + vec3(0.95, 0.80, 0.55) * sunSpec * 0.22;
        color = mix(color, sunCol, uSunWeight);

        // Snow mode: cozy matte snow drifts along curb/verge, tire tracks cleared slightly, STRICTLY capped < 0.76 (zero bloom!)
        float snowNoise = fbm(wp * 0.9 + vec2(7.3, 2.9));
        float snowMask = smoothstep(0.18, 0.62, snowNoise + curbWet * 0.55 - tireTracks * 0.38) * uSnowWeight;
        vec3 snowCol = mix(vec3(0.54, 0.60, 0.70), vec3(0.72, 0.75, 0.80), 0.5 + 0.5 * grain);
        // Gentle warm lantern tint on snow without exceeding bloom threshold
        snowCol += neonRefl * 0.14;
        color = mix(color, snowCol, snowMask * 0.88);

        // Calibrated ceiling to protect Metal UnrealBloomPass from road glare blowout
        color = min(color, vec3(0.84));

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

/**
 * Wet Bluestone Shader for terraces & stairs (青石板梯坎)
 */
export function createWetBluestoneMaterial(
  shared: SharedShaderUniforms,
  albedoTex: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uRainWeight: shared.uRainWeight,
      uSunWeight: shared.uSunWeight,
      uSnowWeight: shared.uSnowWeight,
      uMap: { value: albedoTex },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uRainWeight;
      uniform float uSunWeight;
      uniform float uSnowWeight;
      uniform sampler2D uMap;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 34.5);
        return fract(p.x * p.y);
      }

      float ripple(vec2 p, float t) {
        vec2 g = p * 2.1;
        vec2 c = floor(g);
        vec2 l = fract(g) - 0.5;
        float h = hash21(c);
        float phase = fract(t * (0.7 + h * 0.4) + h * 6.28);
        float ring = exp(-pow(max(abs(length(l) - phase * 0.42) * 24.0, 1e-5), 2.0));
        return ring * (1.0 - phase);
      }

      void main() {
        vec3 tex = texture2D(uMap, vUv * 2.2).rgb;
        vec3 N = normalize(vWorldNormal);
        float upFacing = smoothstep(0.35, 0.85, N.y);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(max(1.0 - clamp(dot(N, V), 0.001, 1.0), 1e-5), 2.8);

        // Wet dark blue-slate sheen
        vec3 col = tex * mix(0.88, 0.58, uRainWeight * upFacing);
        float rip = ripple(vWorldPos.xz, uTime) * uRainWeight * upFacing;

        // Warm lantern reflection on wet steps
        vec3 warmRefl = mix(vec3(0.95, 0.48, 0.18), vec3(0.85, 0.25, 0.20), 0.5 + 0.5 * sin(vWorldPos.x * 0.45));
        col += warmRefl * fresnel * 0.55 * uRainWeight * upFacing;
        col += vec3(0.65, 0.78, 0.92) * rip * 0.22;

        // Sun mode warm stone
        vec3 sunDir = normalize(vec3(0.55, 0.65, 0.42));
        float sunDiff = clamp(dot(N, sunDir), 0.0, 1.0);
        vec3 sunCol = tex * (0.85 + sunDiff * 0.72) * vec3(1.08, 0.98, 0.86);
        col = mix(col, sunCol, uSunWeight);

        // Snow dust on top surfaces (strictly matte, no bloom whiteout)
        vec3 snowCol = vec3(0.66, 0.71, 0.78);
        col = mix(col, snowCol, uSnowWeight * upFacing * 0.76);

        gl_FragColor = vec4(min(col, vec3(0.82)), 1.0);
      }
    `,
  });
}

/**
 * Metal-safe Fresnel volumetric halo / headlight cone material
 */
export function createVolumetricHaloMaterial(
  colorHex: number,
  opacity = 0.28,
  power = 2.4
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity },
      uPower: { value: power },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        float ndv = clamp(abs(dot(normalize(vNormal), normalize(vViewDir))), 0.0, 1.0);
        float core = pow(max(ndv, 1e-5), uPower);
        float edgeFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        float alpha = core * mix(1.0, edgeFade, 0.35) * uOpacity;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
  });
}

/**
 * Crystal-clear anti-reflective Fresnel acrylic cutaway panel (Chrome Metal SAFE: transmission = 0)
 */
export function createAcrylicCutawayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uRimColor: { value: new THREE.Color(0xcce4ff) },
      uBaseOpacity: { value: 0.055 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uRimColor;
      uniform float uBaseOpacity;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndv = clamp(abs(dot(N, V)), 0.001, 1.0);
        float fresnel = pow(max(1.0 - ndv, 1e-5), 3.6);

        // Crisp beveled acrylic edge highlight along the four edges
        float edgeX = min(vUv.x, 1.0 - vUv.x);
        float edgeY = min(vUv.y, 1.0 - vUv.y);
        float border = smoothstep(0.018, 0.0, min(edgeX, edgeY));

        // Subtle diagonal anti-reflective studio sheen
        float sheen = smoothstep(0.62, 0.92, sin((vUv.x * 1.4 + vUv.y * 0.7) * 3.14159)) * 0.045;

        float alpha = clamp(uBaseOpacity + fresnel * 0.16 + border * 0.28 + sheen, 0.0, 0.42);
        vec3 col = mix(vec3(0.75, 0.87, 0.98), uRimColor, fresnel * 0.7 + border * 0.5);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * Banyan alpha-cutout multi-leaf foliage material with smooth vertex breeze sway & snow dusting
 */
export function createBanyanFoliageMaterial(
  leafTex: THREE.Texture,
  shared: SharedShaderUniforms
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map: leafTex,
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.68,
    metalness: 0.02,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uSnowWeight = shared.uSnowWeight;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uTime;
        varying float vLeafSnowFactor;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vec4 instWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        float sway = sin(uTime * 1.55 + instWorld.x * 0.75 + instWorld.z * 0.62 + instWorld.y * 0.4) * 0.065;
        float sway2 = cos(uTime * 2.1 + instWorld.z * 0.9) * 0.035;
        transformed.x += sway * (uv.y);
        transformed.z += sway2 * (uv.y);
        vLeafSnowFactor = smoothstep(0.25, 0.95, uv.y);
        `
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uSnowWeight;
        varying float vLeafSnowFactor;
        `
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        #include <color_fragment>
        // Gentle matte snow dusting on upper tips of leaves in winter mode
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.68, 0.73, 0.80), uSnowWeight * vLeafSnowFactor * 0.58);
        `
      );
  };

  return mat;
}
