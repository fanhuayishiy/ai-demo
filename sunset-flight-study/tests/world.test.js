import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

const worldModule = await import("../src/world.js").catch(() => ({}));

test("world provides the documented lifecycle controller", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  for (const method of ["update", "setQuality", "dispose"]) {
    assert.equal(typeof world[method], "function");
  }
  world.dispose();
});

test("world contains sea, sky, sculpted clouds, islands and daylight", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  for (const name of [
    "adriatic-sea",
    "adriatic-sky",
    "adriatic-clouds",
    "adriatic-islands",
  ]) {
    assert.ok(scene.getObjectByName(name), `missing ${name}`);
  }
  const lights = [];
  scene.traverse((object) => {
    if (object.isLight) lights.push(object);
  });
  assert.ok(lights.some((light) => light.isHemisphereLight));
  assert.ok(lights.some((light) => light.isDirectionalLight));
  assert.ok(scene.fog);
  assert.equal(scene.getObjectByName("adriatic-sea").position.y, 0);
  const islandGroup = scene.getObjectByName("adriatic-islands");
  assert.ok(islandGroup.children.length >= 2);
  for (const island of islandGroup.children) {
    assert.ok(Math.hypot(island.position.x, island.position.z) > 600);
  }
  world.dispose();
});

test("every world mesh has finite positions, normals and bounds", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  let meshCount = 0;
  scene.traverse((object) => {
    if (!object.isMesh) return;
    meshCount += 1;
    for (const attribute of ["position", "normal"]) {
      const values = object.geometry.attributes[attribute];
      assert.ok(values, `${object.name} missing ${attribute}`);
      assert.ok(
        values.array.every(Number.isFinite),
        `${object.name} non-finite ${attribute}`,
      );
    }
    object.geometry.computeBoundingSphere();
    assert.ok(Number.isFinite(object.geometry.boundingSphere.radius));
    assert.ok(object.geometry.boundingSphere.radius > 0);
  });
  assert.ok(
    meshCount >= 6 && meshCount < 40,
    "world should batch repeating scenery",
  );
  world.dispose();
});

test("update animates the sea and follows the camera with the sky", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(142, 88, -331);
  world.update(12.5, camera);
  const sea = scene.getObjectByName("adriatic-sea");
  assert.ok(sea.material.isShaderMaterial);
  assert.equal(sea.material.uniforms.uTime.value, 12.5);
  const sky = scene.getObjectByName("adriatic-sky");
  assert.equal(sky.position.x, camera.position.x);
  assert.equal(sky.position.z, camera.position.z);
  world.update(0, camera);
  assert.equal(sea.material.uniforms.uTime.value, 0);
  world.dispose();
});

test("quality reduces optional clouds without removing the atmosphere", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene, { quality: "low" });
  const clouds = scene.getObjectByName("adriatic-clouds");
  const visibleLow = clouds.children.filter((object) => object.visible).length;
  world.setQuality("high");
  const visibleHigh = clouds.children.filter((object) => object.visible).length;
  assert.ok(visibleLow > 0);
  assert.ok(visibleHigh > visibleLow);
  world.setQuality("low");
  assert.equal(
    clouds.children.filter((object) => object.visible).length,
    visibleLow,
  );
  world.dispose();
});

test("painted sea exposes visible short brush wave controls at mixed scales", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const { uniforms } = scene.getObjectByName("adriatic-sea").material;
  assert.ok(
    uniforms.uRippleOpacity?.value >= 0.2 && uniforms.uRippleOpacity.value <= 0.4,
  );
  assert.ok(
    uniforms.uRippleDensity?.value > 0 && uniforms.uRippleDensity.value <= 0.35,
  );
  assert.ok(uniforms.uRippleLength?.value.isVector2);
  assert.ok(uniforms.uRippleLength.value.x >= 12);
  assert.ok(uniforms.uRippleLength.value.y >= 25 && uniforms.uRippleLength.value.y <= 35);
  assert.ok(uniforms.uPatchContrast?.value >= 0.3);
  world.dispose();
});

test("sea shader does not declare the GLSL reserved identifier active", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const shader = scene.getObjectByName("adriatic-sea").material.fragmentShader;
  assert.doesNotMatch(shader, /\b(?:float|int|bool|vec[234])\s+active\b/);
  world.dispose();
});

test("sea wash contrast has a finite distance fade and a separate distant greyblue palette", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const { uniforms } = scene.getObjectByName("adriatic-sea").material;
  assert.ok(uniforms.uWashFade?.value.isVector2);
  assert.ok(uniforms.uWashFade.value.x > 0);
  assert.ok(uniforms.uWashFade.value.y > uniforms.uWashFade.value.x);
  assert.ok(uniforms.uDistant?.value.isColor);
  assert.ok(uniforms.uDistant.value.b > uniforms.uDistant.value.r);
  world.dispose();
});

test("hand-painted sky and clouds preserve their palette through scene tone mapping", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const sky = scene.getObjectByName("adriatic-sky");
  assert.equal(sky.material.toneMapped, false);
  const hsl = sky.material.uniforms.uZenith.value.getHSL({});
  assert.ok(hsl.s > 0.45, "upper sky should retain blue chroma");
  scene.getObjectByName("adriatic-clouds").traverse((object) => {
    if (object.isMesh) assert.equal(object.material.toneMapped, false);
  });
  world.dispose();
});

test("cloud banks use shared painted alpha textures instead of overlapping sphere geometry", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const textures = new Set();
  let cloudCount = 0;
  scene.getObjectByName("adriatic-clouds").traverse(cloud => {
    if (!cloud.isMesh) return;
    cloudCount += 1;
    assert.ok(cloud.geometry.attributes.position.count <= 8);
    assert.ok(cloud.material.isMeshBasicMaterial);
    assert.ok(cloud.material.map?.isDataTexture);
    assert.equal(cloud.material.map.colorSpace, THREE.SRGBColorSpace);
    assert.equal(cloud.material.depthWrite, false);
    textures.add(cloud.material.map);
  });
  assert.ok(cloudCount >= 8 && cloudCount <= 16);
  assert.ok(textures.size >= 3 && textures.size < cloudCount);
  world.dispose();
});

test("painted cloud cards face an orbiting camera without moving or regenerating textures", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const clouds = [];
  scene.getObjectByName("adriatic-clouds").traverse(object => { if (object.isMesh) clouds.push(object); });
  const initial = clouds.map(cloud => ({ position: cloud.position.clone(), texture: cloud.material.map }));
  const camera = new THREE.PerspectiveCamera();
  for (const position of [[100, 90, -200], [-300, 140, 180], [220, 60, 310]]) {
    camera.position.set(...position);
    world.update(3, camera);
    clouds.forEach((cloud, index) => {
      assert.ok(cloud.position.equals(initial[index].position));
      assert.equal(cloud.material.map, initial[index].texture);
      const towardCamera = camera.position.clone().sub(cloud.getWorldPosition(new THREE.Vector3())).normalize();
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(cloud.getWorldQuaternion(new THREE.Quaternion()));
      assert.ok(normal.dot(towardCamera) > 0.999);
    });
  }
  world.dispose();
});

test("island meadows have an irregular rolling silhouette", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const geometry = scene.getObjectByName("island-meadow-1").geometry;
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  assert.ok(
    max.y - min.y > max.y * 0.3,
    "meadow silhouette should not be a flat tier",
  );
  world.dispose();
});

test("limestone islands retain a varied painted vertex palette independent of scene lights", () => {
  const scene = new THREE.Scene();
  const world = worldModule.createWorld(scene);
  const cliff = scene.getObjectByName("island-cliffs-1");
  assert.ok(cliff.material.isMeshBasicMaterial);
  assert.equal(cliff.material.vertexColors, true);
  assert.equal(cliff.material.toneMapped, false);
  const colors = cliff.geometry.attributes.color.array;
  const swatches = new Set();
  for (let index = 0; index < colors.length; index += 3) {
    swatches.add(`${colors[index].toFixed(2)}:${colors[index + 1].toFixed(2)}:${colors[index + 2].toFixed(2)}`);
  }
  assert.ok(swatches.size > 30, "limestone needs broad shaded and weathered color regions");
  world.dispose();
});

test("dispose releases owned resources once and preserves preexisting scene state", () => {
  assert.equal(typeof worldModule.createWorld, "function");
  const scene = new THREE.Scene();
  const originalFog = new THREE.Fog(0xffffff, 100, 1000);
  const originalBackground = new THREE.Color(0x112233);
  const existing = new THREE.Group();
  scene.fog = originalFog;
  scene.background = originalBackground;
  scene.add(existing);
  const world = worldModule.createWorld(scene);
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) materials.add(object.material);
    if (object.material?.map) textures.add(object.material.map);
  });
  let disposedGeometry = 0;
  let disposedMaterial = 0;
  let disposedTexture = 0;
  for (const geometry of geometries)
    geometry.addEventListener("dispose", () => {
      disposedGeometry += 1;
    });
  for (const material of materials)
    material.addEventListener("dispose", () => {
      disposedMaterial += 1;
    });
  assert.ok(textures.size >= 3, "painted world should own shared cloud textures");
  for (const texture of textures) texture.addEventListener("dispose", () => { disposedTexture += 1; });
  world.dispose();
  world.dispose();
  assert.equal(disposedGeometry, geometries.size);
  assert.equal(disposedMaterial, materials.size);
  assert.equal(disposedTexture, textures.size);
  assert.deepEqual(scene.children, [existing]);
  assert.equal(scene.fog, originalFog);
  assert.equal(scene.background, originalBackground);
});
