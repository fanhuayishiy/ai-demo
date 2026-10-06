import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import { createAnimeRenderer } from "../src/anime-renderer.js";

test('sunset highlight glow is opt-in and leaves the sharp source sample intact', async () => {
  const { createAnimeFinishMaterial } = await import('../src/anime-renderer.js');
  const daylight = createAnimeFinishMaterial();
  const sunset = createAnimeFinishMaterial({ bloom: 0.24 });
  assert.equal(daylight.uniforms.uBloom?.value, 0);
  assert.equal(sunset.uniforms.uBloom?.value, 0.24);
  assert.match(sunset.fragmentShader, /color \+= glow/);
  daylight.dispose(); sunset.dispose();
});

// Only the WebGL boundary is substituted. Render targets, scenes, materials,
// geometry, and the compositor itself are the actual Three.js/application objects.
function rendererHarness({
  floatSupport = true,
  pixelRatio = 1,
  maxSamples = 4,
  initialTarget = null,
  failOnRender = 0,
  failure = new Error("render failed"),
} = {}) {
  let currentTarget = initialTarget;
  const calls = [];
  const renderer = {
    extensions: {
      has: (name) => name === "EXT_color_buffer_float" && floatSupport,
    },
    capabilities: { maxSamples },
    getPixelRatio: () => pixelRatio,
    getRenderTarget: () => currentTarget,
    setRenderTarget: (target) => {
      currentTarget = target;
    },
    render(scene, camera) {
      calls.push({ scene, camera, target: currentTarget });
      if (calls.length === failOnRender) throw failure;
    },
  };
  return { renderer, calls };
}

test("anime finish keeps full-resolution outlines and respects quality limits", async () => {
  assert.ok(
    existsSync("src/anime-renderer.js"),
    "anime finish implementation exists",
  );
  const { getRenderSettings } = await import("../src/anime-renderer.js");
  assert.deepEqual(getRenderSettings(1280, 720, 2, "high"), {
    width: 2240,
    height: 1260,
    samples: 4,
  });
  assert.deepEqual(getRenderSettings(390, 844, 3, "low"), {
    width: 390,
    height: 844,
    samples: 0,
  });
  const tiny = getRenderSettings(0, 0, 0, "high");
  assert.ok(tiny.width >= 1 && tiny.height >= 1);
  const huge = getRenderSettings(12000, 9000, 3, "high");
  assert.ok(huge.width <= 4096 && huge.height <= 4096);
});

test("film finish is a restrained color pass with no blur or double tone mapping", async () => {
  assert.ok(
    existsSync("src/anime-renderer.js"),
    "anime finish implementation exists",
  );
  const { createAnimeFinishMaterial } =
    await import("../src/anime-renderer.js");
  const material = createAnimeFinishMaterial();
  assert.equal(material.isShaderMaterial, true);
  assert.equal(material.toneMapped, false);
  assert.equal(material.depthTest, false);
  assert.equal(material.depthWrite, false);
  assert.ok(
    material.uniforms.uGrain.value > 0 &&
      material.uniforms.uGrain.value <= 0.015,
  );
  assert.equal(material.uniforms.uTime.value, 0);
  assert.match(material.fragmentShader, /colorspace_fragment/);
  assert.doesNotMatch(material.fragmentShader, /tonemapping_fragment/);
  material.dispose();
});

test("compositor draws the linear scene and exactly one finish pass to the previous target", (t) => {
  const previousTarget = new THREE.WebGLRenderTarget(8, 8);
  t.after(() => previousTarget.dispose());
  for (const initialTarget of [null, previousTarget]) {
    const { renderer, calls } = rendererHarness({ initialTarget });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const compositor = createAnimeRenderer(renderer, scene, camera);
    t.after(() => compositor.dispose());

    compositor.render(1.25);
    assert.equal(calls.length, 2, "one scene draw followed by one final draw");
    assert.equal(calls[0].scene, scene);
    assert.equal(calls[0].camera, camera);
    const target = calls[0].target;
    assert.ok(target.isWebGLRenderTarget);
    assert.notEqual(target, initialTarget);
    assert.equal(target.texture.colorSpace, THREE.LinearSRGBColorSpace);
    assert.equal(target.depthBuffer, true);
    assert.equal(calls[1].target, initialTarget);
    assert.notEqual(calls[1].scene, scene);
    assert.ok(calls[1].camera.isOrthographicCamera);
    assert.equal(calls[1].scene.children.length, 1);
    const quad = calls[1].scene.children[0];
    assert.ok(quad.isMesh);
    assert.equal(quad.material.uniforms.tScene.value, target.texture);
    assert.equal(quad.material.uniforms.uTime.value, 1.25);
    assert.equal(renderer.getRenderTarget(), initialTarget);

    compositor.render(Number.NaN);
    assert.equal(
      calls.length,
      4,
      "subsequent frames retain the two-pass contract",
    );
    assert.equal(quad.material.uniforms.uTime.value, 0);
    assert.equal(
      calls[2].target,
      target,
      "frames reuse the owned scene target",
    );
    assert.equal(renderer.getRenderTarget(), initialTarget);
  }
});

test("compositor selects half-float targets only when the renderer supports them", (t) => {
  for (const floatSupport of [true, false]) {
    const { renderer, calls } = rendererHarness({ floatSupport });
    const compositor = createAnimeRenderer(
      renderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
    );
    t.after(() => compositor.dispose());
    compositor.render(0);
    assert.equal(
      calls[0].target.texture.type,
      floatSupport ? THREE.HalfFloatType : THREE.UnsignedByteType,
    );
    assert.equal(calls[0].target.texture.minFilter, THREE.LinearFilter);
    assert.equal(calls[0].target.texture.magFilter, THREE.LinearFilter);
  }
});

test("compositor resizes its target and finish uniforms while respecting quality and device sample limits", (t) => {
  for (const maxSamples of [0, 2, 8]) {
    const { renderer, calls } = rendererHarness({ pixelRatio: 2, maxSamples });
    const compositor = createAnimeRenderer(
      renderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
    );
    t.after(() => compositor.dispose());
    compositor.resize(1280, 720, "high");
    compositor.render(0);
    const target = calls[0].target;
    const material = calls[1].scene.children[0].material;
    const texture = target.texture;
    assert.deepEqual(
      [target.width, target.height, target.samples],
      [2240, 1260, Math.min(4, maxSamples)],
    );
    assert.deepEqual(
      material.uniforms.uResolution.value.toArray(),
      [2240, 1260],
    );

    compositor.resize(390, 844, "low");
    assert.deepEqual(
      [target.width, target.height, target.samples],
      [390, 844, 0],
    );
    assert.deepEqual(material.uniforms.uResolution.value.toArray(), [390, 844]);

    compositor.resize(12000, 9000, "high");
    assert.deepEqual(
      [target.width, target.height, target.samples],
      [4096, 3072, Math.min(4, maxSamples)],
    );
    assert.deepEqual(
      material.uniforms.uResolution.value.toArray(),
      [4096, 3072],
    );
    assert.equal(target.texture, texture);
    assert.equal(
      material.uniforms.tScene.value,
      texture,
      "finish still samples the resized texture",
    );
    assert.equal(
      renderer.getRenderTarget(),
      null,
      "resize does not redirect the caller's rendering",
    );
  }
});

test("changing MSAA quality invalidates target resources even when dimensions stay unchanged", (t) => {
  const { renderer, calls } = rendererHarness({ pixelRatio: 1, maxSamples: 2 });
  const compositor = createAnimeRenderer(
    renderer,
    new THREE.Scene(),
    new THREE.PerspectiveCamera(),
  );
  t.after(() => compositor.dispose());
  compositor.resize(320, 180, "low");
  compositor.render(0);
  const target = calls[0].target;
  let invalidations = 0;
  target.addEventListener("dispose", () => {
    invalidations += 1;
  });

  compositor.resize(320, 180, "high");
  assert.deepEqual(
    [target.width, target.height, target.samples],
    [320, 180, 2],
  );
  assert.equal(invalidations, 1);
  compositor.resize(320, 180, "high");
  assert.equal(
    invalidations,
    1,
    "unchanged settings do not churn render-target resources",
  );
  compositor.resize(320, 180, "low");
  assert.equal(target.samples, 0);
  assert.equal(invalidations, 2);
});

test("compositor restores the caller's target when either render pass throws", (t) => {
  for (const failOnRender of [1, 2]) {
    const previousTarget = new THREE.WebGLRenderTarget(8, 8);
    const failure = new Error(`pass ${failOnRender} failed`);
    const { renderer, calls } = rendererHarness({
      initialTarget: previousTarget,
      failOnRender,
      failure,
    });
    const compositor = createAnimeRenderer(
      renderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
    );
    t.after(() => {
      compositor.dispose();
      previousTarget.dispose();
    });

    assert.throws(
      () => compositor.render(2),
      (error) => error === failure,
    );
    assert.equal(
      calls.length,
      failOnRender,
      "a failed scene draw must not proceed to the finish pass",
    );
    assert.equal(renderer.getRenderTarget(), previousTarget);
  }
});

test("compositor disposes its owned resources once and cannot be revived by render or resize", (t) => {
  const { renderer, calls } = rendererHarness();
  const compositor = createAnimeRenderer(
    renderer,
    new THREE.Scene(),
    new THREE.PerspectiveCamera(),
  );
  t.after(() => compositor.dispose());
  compositor.resize(320, 180, "high");
  compositor.render(4);
  const target = calls[0].target;
  const quad = calls[1].scene.children[0];
  const resources = [target, quad.material, quad.geometry];
  const disposed = resources.map(() => 0);
  resources.forEach((resource, index) =>
    resource.addEventListener("dispose", () => {
      disposed[index] += 1;
    }),
  );

  compositor.dispose();
  compositor.dispose();
  assert.deepEqual(disposed, [1, 1, 1]);
  compositor.resize(1024, 768, "low");
  compositor.render(9);
  assert.equal(
    calls.length,
    2,
    "disposed compositors never issue another draw",
  );
  assert.deepEqual(
    [target.width, target.height, target.samples],
    [320, 180, 4],
  );
  assert.deepEqual(
    quad.material.uniforms.uResolution.value.toArray(),
    [320, 180],
  );
  assert.equal(quad.material.uniforms.uTime.value, 4);
  assert.equal(renderer.getRenderTarget(), null);
  assert.deepEqual(disposed, [1, 1, 1]);
});
