import * as THREE from "three";

export function getRenderSettings(
  width,
  height,
  pixelRatio = 1,
  quality = "high",
) {
  const ratio = Math.min(
    Math.max(Number.isFinite(pixelRatio) ? pixelRatio : 1, 1),
    quality === "high" ? 1.75 : 1,
  );
  const safeWidth = Math.max(1, Number.isFinite(width) ? width : 1);
  const safeHeight = Math.max(1, Number.isFinite(height) ? height : 1);
  const scale = Math.min(ratio, 4096 / Math.max(safeWidth, safeHeight));
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    samples: quality === "high" ? 4 : 0,
  };
}

export function createAnimeFinishMaterial({ bloom = 0 } = {}) {
  return new THREE.ShaderMaterial({
    name: "painted-film-finish",
    uniforms: {
      tScene: { value: null },
      uTime: { value: 0 },
      uGrain: { value: 0.009 },
      uBloom: {
        value: THREE.MathUtils.clamp(
          Number.isFinite(bloom) ? bloom : 0,
          0,
          0.6,
        ),
      },
      uResolution: { value: new THREE.Vector2(1280, 720) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform float uTime;
      uniform float uGrain;
      uniform float uBloom;
      uniform vec2 uResolution;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      void main() {
        vec3 color = texture2D(tScene, vUv).rgb;
        if (uBloom > 0.0) {
          vec3 glow = vec3(0.0);
          for (int i = 0; i < 8; i++) {
            float angle = float(i) * 0.78539816;
            vec2 ray = vec2(cos(angle), sin(angle)) / uResolution;
            vec3 nearLight = texture2D(tScene, vUv + ray * 5.0).rgb;
            vec3 farLight = texture2D(tScene, vUv + ray * 16.0).rgb;
            glow += max(nearLight - vec3(0.62), vec3(0.0)) * 0.075;
            glow += max(farLight - vec3(0.62), vec3(0.0)) * 0.05;
          }
          // Add only luminous spill; the unblurred foreground sample stays intact.
          color += glow * uBloom;
        }
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        // Preserve hand-authored paint colors; never blur or globally posterize.
        color = mix(vec3(luminance), color, 1.025);
        color *= vec3(1.012, 1.002, 0.986);
        vec2 pixel = floor(vUv * uResolution);
        float paper = hash(pixel) - 0.5;
        float exposureGrain = hash(pixel + floor(uTime * 12.0)) - 0.5;
        float pigment = sin(pixel.y * 0.019 + sin(pixel.x * 0.013)) * 0.16;
        color += (paper * 0.68 + exposureGrain * 0.22 + pigment) * uGrain * (0.28 + luminance * 0.72);
        gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
  });
}

/** Linear scene target -> tiny paint finish -> one sRGB conversion on screen. */
export function createAnimeRenderer(renderer, scene, camera, options = {}) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: renderer.extensions.has("EXT_color_buffer_float")
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  target.texture.name = "linear-painted-scene";
  target.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const material = createAnimeFinishMaterial(options);
  material.uniforms.tScene.value = target.texture;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  const screen = new THREE.Scene();
  screen.add(quad);
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let disposed = false;

  return {
    resize(width, height, quality = "high") {
      if (disposed) return;
      const settings = getRenderSettings(
        width,
        height,
        renderer.getPixelRatio(),
        quality,
      );
      const samples = Math.min(
        settings.samples,
        renderer.capabilities.maxSamples || 0,
      );
      if (target.samples !== samples) {
        target.dispose();
        target.samples = samples;
      }
      target.setSize(settings.width, settings.height);
      material.uniforms.uResolution.value.set(settings.width, settings.height);
    },
    render(time) {
      if (disposed) return;
      material.uniforms.uTime.value = Number.isFinite(time) ? time : 0;
      const previous = renderer.getRenderTarget();
      try {
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(previous);
        renderer.render(screen, screenCamera);
      } finally {
        renderer.setRenderTarget(previous);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      target.dispose();
      material.dispose();
      geometry.dispose();
    },
  };
}
