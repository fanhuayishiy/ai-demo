import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

const module = await import("../src/sunset-world.js").catch(() => ({}));

function create(options) {
  assert.equal(typeof module.createSunsetWorld, "function");
  const scene = new THREE.Scene();
  const world = module.createSunsetWorld(scene, options);
  return { scene, world };
}

function meshes(scene) {
  const result = [];
  scene.traverse((object) => {
    if (object.isMesh) result.push(object);
  });
  return result;
}

test("sunset world exposes the lifecycle and identifiable sky, sea, volume clouds", () => {
  const { scene, world } = create();
  for (const method of ["update", "setQuality", "dispose"]) {
    assert.equal(typeof world[method], "function");
  }
  for (const name of [
    "sunset-world",
    "sunset-sky",
    "sunset-sea",
    "sunset-clouds",
  ]) {
    assert.ok(scene.getObjectByName(name), name);
  }
  assert.equal(scene.getObjectByName("sunset-sea").position.y, 0);
  const clouds = meshes(scene.getObjectByName("sunset-clouds"));
  assert.ok(clouds.length >= 4 && clouds.length <= 12);
  assert.ok(clouds.every((mesh) => mesh.isInstancedMesh));
  assert.ok(clouds.every((mesh) => !mesh.geometry.type.includes("Plane")));
  assert.ok(scene.getObjectByName("sunset-sun").isDirectionalLight);
  assert.ok(scene.getObjectByName("sunset-hemisphere").isHemisphereLight);
  world.dispose();
});

test("sunset geometry and shader uniforms remain finite with bounded resource counts", () => {
  const { scene, world } = create();
  const geometrySet = new Set();
  const materialSet = new Set();
  for (const mesh of meshes(scene)) {
    geometrySet.add(mesh.geometry);
    materialSet.add(mesh.material);
    for (const name of ["position", "normal"]) {
      const attribute = mesh.geometry.getAttribute(name);
      assert.ok(
        attribute && attribute.array.every(Number.isFinite),
        `${mesh.name}: ${name}`,
      );
    }
    mesh.geometry.computeBoundingSphere();
    assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));
    assert.ok(mesh.geometry.boundingSphere.radius > 0);
    if (mesh.isInstancedMesh)
      assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
    for (const { value } of Object.values(mesh.material.uniforms || {})) {
      if (typeof value === "number") assert.ok(Number.isFinite(value));
      if (value?.isColor)
        assert.ok([value.r, value.g, value.b].every(Number.isFinite));
      if (value?.isVector3) assert.ok(value.toArray().every(Number.isFinite));
    }
    assert.equal(mesh.material.toneMapped, false);
  }
  assert.ok(geometrySet.size <= 10);
  assert.ok(materialSet.size <= 5);
  assert.ok(
    meshes(scene).length <= 14,
    "batch cloud volumes into a bounded draw budget",
  );
  world.dispose();
});

test("sculpted volumes have non-flat geometry and leave the 280–400m flight ring clear", () => {
  const { scene, world } = create();
  const clouds = meshes(scene.getObjectByName("sunset-clouds"));
  let nearCount = 0;
  let farCount = 0;
  for (const mesh of clouds) {
    mesh.geometry.computeBoundingBox();
    const size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
    assert.ok(Math.min(size.x, size.y, size.z) > 0.5, "cloud must be a volume");
    for (const placement of mesh.userData.placements) {
      const radius = Math.hypot(placement.x, placement.z);
      assert.ok(radius <= 220 || radius >= 460);
      assert.ok(
        radius + placement.horizontalRadius < 280 ||
          radius - placement.horizontalRadius > 400,
      );
      if (mesh.userData.layer === "near") {
        nearCount += 1;
        assert.ok(placement.y >= 300 && placement.y <= 650);
      } else farCount += 1;
    }
  }
  assert.ok(nearCount >= 12);
  assert.ok(farCount >= 16);
  world.dispose();
});

test("near cloud angular footprints preserve open sky around the flight circle", () => {
  const { scene, world } = create();
  const near = meshes(scene.getObjectByName("sunset-clouds")).filter(
    (mesh) => mesh.userData.layer === "near",
  );
  for (const mesh of near) {
    for (const placement of mesh.userData.placements) {
      const minimumHorizontalDistance = Math.abs(
        Math.hypot(placement.x, placement.z) - 340,
      );
      assert.ok(
        placement.horizontalRadius / minimumHorizontalDistance <= 0.3,
        "a near bank must not become a frame-filling wall at any flight angle",
      );
    }
  }
  world.dispose();
});

test("cloud surfaces retain measurable scalloped concavity instead of convex balloon shapes", () => {
  const { scene, world } = create();
  function volume(geometry) {
    const p = geometry.getAttribute("position");
    const a = new THREE.Vector3(),
      b = new THREE.Vector3(),
      c = new THREE.Vector3();
    let sum = 0;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i);
      b.fromBufferAttribute(p, i + 1);
      c.fromBufferAttribute(p, i + 2);
      sum += a.dot(b.cross(c)) / 6;
    }
    return Math.abs(sum);
  }
  for (const quality of ["high", "low"]) {
    world.setQuality(quality);
    const geometries = new Set(
      meshes(scene.getObjectByName("sunset-clouds")).map(
        (mesh) => mesh.geometry,
      ),
    );
    for (const geometry of geometries) {
      const p = geometry.getAttribute("position");
      const hull = new ConvexGeometry(
        Array.from({ length: p.count }, (_, i) =>
          new THREE.Vector3().fromBufferAttribute(p, i),
        ),
      );
      const occupied = volume(geometry) / volume(hull);
      assert.ok(
        occupied > 0.4 && occupied < 0.88,
        `${geometry.name} convex-hull occupancy ${occupied.toFixed(3)}`,
      );
      hull.dispose();
    }
  }
  world.dispose();
});

test("the authored palette is plum/violet with a shared amber sun direction", () => {
  const { scene, world } = create();
  const sea = scene.getObjectByName("sunset-sea").material;
  const sky = scene.getObjectByName("sunset-sky").material;
  const cloud = meshes(scene.getObjectByName("sunset-clouds"))[0].material;
  assert.equal(sea.uniforms.uDeep.value.getHexString(), "211b39");
  assert.equal(cloud.uniforms.uViolet.value.getHexString(), "694386");
  assert.equal(cloud.uniforms.uLavender.value.getHexString(), "9b68aa");
  assert.equal(cloud.uniforms.uGold.value.getHexString(), "ffbd71");
  const sun = new THREE.Vector3(-0.65, 0.2, -0.7).normalize();
  for (const material of [sea, sky, cloud]) {
    assert.ok(material.uniforms.uSunDirection.value.distanceTo(sun) < 1e-6);
    assert.equal(
      material.transparent,
      false,
      "opaque volumes do not sort as cloud cards",
    );
  }
  assert.ok(sea.uniforms.uRippleDensity.value >= 0.7);
  assert.ok(sky.uniforms.uSunRadius.value > 0);
  world.dispose();
});

test("cloud material retains mid-purple shadows and a broad soft directional rim", () => {
  const { scene, world } = create();
  const material = meshes(scene.getObjectByName("sunset-clouds"))[0].material;
  const uniforms = material.uniforms;
  assert.equal(uniforms.uDeep.value.getHexString(), "49345f");
  assert.equal(uniforms.uShadow.value.getHexString(), "604079");
  assert.ok(
    uniforms.uRimPower?.value >= 1.5 && uniforms.uRimPower.value <= 2.1,
  );
  assert.ok(
    uniforms.uBandSoftness?.value >= 0.08 &&
      uniforms.uBandSoftness.value <= 0.12,
  );
  assert.match(material.fragmentShader, /pow\(silhouette,\s*uRimPower/);
  assert.match(material.fragmentShader, /smoothstep\(-0\.15 - uBandSoftness/);
  world.dispose();
});

test("sky strata use bounded translucency and two-axis low-frequency domain warping", () => {
  const { scene, world } = create();
  const material = scene.getObjectByName("sunset-sky").material;
  const uniforms = material.uniforms;
  assert.ok(
    uniforms.uStrataOpacity?.value > 0.25 &&
      uniforms.uStrataOpacity.value <= 0.5,
  );
  assert.ok(uniforms.uStrataWarp?.value.isVector2);
  assert.ok(
    uniforms.uStrataWarp.value.x > 1 && uniforms.uStrataWarp.value.y > 2,
  );
  assert.match(material.fragmentShader, /p \+= warp \* uStrataWarp/);
  assert.doesNotMatch(material.fragmentShader, /direction\.y \* 33\.0/);
  world.dispose();
});

test("shader ramps avoid undefined reversed constant smoothstep boundaries", () => {
  const { scene, world } = create();
  const materials = new Set(meshes(scene).map((mesh) => mesh.material));
  const pattern = /smoothstep\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,/g;
  for (const material of materials) {
    for (const match of material.fragmentShader.matchAll(pattern)) {
      assert.ok(
        Number(match[1]) < Number(match[2]),
        `${material.name}: ${match[0]}`,
      );
    }
  }
  world.dispose();
});

test("update follows a parented camera and supports deterministic scrubbing and invalid time", () => {
  const { scene, world } = create();
  const rig = new THREE.Group();
  const camera = new THREE.PerspectiveCamera();
  rig.position.set(100, 400, -100);
  camera.position.set(10, 20, 30);
  rig.add(camera);
  const sea = scene.getObjectByName("sunset-sea");
  const sky = scene.getObjectByName("sunset-sky");
  world.update(12.5, camera);
  assert.equal(sea.material.uniforms.uTime.value, 12.5);
  assert.deepEqual(sky.position.toArray(), [110, 420, -70]);
  const matrices = meshes(scene.getObjectByName("sunset-clouds")).map((mesh) =>
    Array.from(mesh.instanceMatrix.array),
  );
  world.update(0, camera);
  world.update(12.5, camera);
  assert.deepEqual(
    meshes(scene.getObjectByName("sunset-clouds")).map((mesh) =>
      Array.from(mesh.instanceMatrix.array),
    ),
    matrices,
  );
  world.update(Number.NaN);
  assert.equal(sea.material.uniforms.uTime.value, 0);
  world.dispose();
});

test("all animated shader coordinates are continuous and periodic across 24 seconds", () => {
  const { scene, world } = create();
  const materials = [
    scene.getObjectByName("sunset-sea").material,
    scene.getObjectByName("sunset-sky").material,
  ];
  for (const material of materials) {
    assert.ok(material.uniforms.uDrift?.value.isVector2);
    assert.doesNotMatch(
      material.fragmentShader,
      /\buTime\b/,
      "only periodic coordinate offsets may drive animation, not wrapped linear time",
    );
  }
  const offsetsAt = (time) => {
    world.update(time);
    return materials.map((material) => material.uniforms.uDrift.value.clone());
  };
  for (const time of [-4, 0, 2.7, 12, 23.99]) {
    const first = offsetsAt(time),
      repeat = offsetsAt(time + 24);
    first.forEach((value, index) =>
      assert.ok(value.distanceTo(repeat[index]) < 1e-12),
    );
  }
  const before = offsetsAt(24 - 0.001),
    seam = offsetsAt(0),
    after = offsetsAt(0.001);
  before.forEach((value, index) => {
    assert.ok(value.distanceTo(after[index]) < 0.001);
    const leftVelocity = seam[index].clone().sub(value).multiplyScalar(1000);
    const rightVelocity = after[index]
      .clone()
      .sub(seam[index])
      .multiplyScalar(1000);
    assert.ok(leftVelocity.distanceTo(rightVelocity) < 0.001);
  });
  world.dispose();
});

test("low quality reduces cloud instances and geometry without allocating on each switch", () => {
  const { scene, world } = create({ quality: "low" });
  const clouds = meshes(scene.getObjectByName("sunset-clouds"));
  const total = () =>
    clouds.reduce((sum, mesh) => sum + (mesh.visible ? mesh.count : 0), 0);
  const triangles = () =>
    clouds.reduce(
      (sum, mesh) =>
        sum +
        (mesh.visible
          ? (mesh.count * mesh.geometry.getAttribute("position").count) / 3
          : 0),
      0,
    );
  const lowCount = total();
  const lowTriangles = triangles();
  const lowGeometries = clouds.map((mesh) => mesh.geometry);
  world.setQuality("high");
  assert.ok(total() > lowCount && lowCount >= 16);
  assert.ok(triangles() > lowTriangles * 1.4);
  const highGeometries = clouds.map((mesh) => mesh.geometry);
  for (let i = 0; i < 4; i += 1) {
    world.setQuality("low");
    assert.equal(total(), lowCount);
    assert.deepEqual(
      clouds.map((mesh) => mesh.geometry),
      lowGeometries,
    );
    world.setQuality("high");
    assert.deepEqual(
      clouds.map((mesh) => mesh.geometry),
      highGeometries,
    );
  }
  world.dispose();
});

test("dispose restores borrowed scene state and disposes each shared resource once", () => {
  assert.equal(typeof module.createSunsetWorld, "function");
  const scene = new THREE.Scene();
  const originalFog = new THREE.Fog("red", 1, 20);
  const originalBackground = new THREE.Color("blue");
  const unrelated = new THREE.Group();
  scene.fog = originalFog;
  scene.background = originalBackground;
  scene.add(unrelated);
  const world = module.createSunsetWorld(scene);
  const resources = new Set();
  for (const quality of ["low", "high"]) {
    world.setQuality(quality);
    for (const mesh of meshes(scene)) {
      resources.add(mesh.geometry);
      resources.add(mesh.material);
      if (mesh.isInstancedMesh) resources.add(mesh);
    }
  }
  const counts = new Map();
  for (const resource of resources)
    resource.addEventListener("dispose", () => {
      counts.set(resource, (counts.get(resource) || 0) + 1);
    });
  world.dispose();
  world.dispose();
  world.update(1, new THREE.PerspectiveCamera());
  world.setQuality("low");
  assert.deepEqual(scene.children, [unrelated]);
  assert.equal(scene.fog, originalFog);
  assert.equal(scene.background, originalBackground);
  for (const resource of resources) assert.equal(counts.get(resource), 1);
});

test("disposal never overwrites a newer scene owner's fog or background", () => {
  const { scene, world } = create();
  const newerFog = new THREE.Fog("pink", 1, 10);
  const newerBackground = new THREE.Color("purple");
  scene.fog = newerFog;
  scene.background = newerBackground;
  world.dispose();
  assert.equal(scene.fog, newerFog);
  assert.equal(scene.background, newerBackground);
});
