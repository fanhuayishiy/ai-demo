import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

async function factory() {
  const module = await import("../src/aircraft.js").catch(() => null);
  assert.equal(
    typeof module?.createAircraft,
    "function",
    "aircraft module must export createAircraft",
  );
  return module.createAircraft;
}

test("red aircraft exposes the animated, identifiable flying-boat parts", async () => {
  const createAircraft = await factory();
  const plane = createAircraft();
  assert.ok(plane instanceof THREE.Group);
  assert.equal(plane.userData.type, "red");
  for (const name of [
    "hull",
    "upper-wing",
    "cockpit",
    "engine",
    "rudder",
    "pilot",
    "wingtip-float-left",
    "wingtip-float-right",
  ]) {
    assert.ok(plane.getObjectByName(name), `missing ${name}`);
  }
  assert.ok(plane.userData.propeller instanceof THREE.Object3D);
  assert.ok(plane.getObjectById(plane.userData.propeller.id));
  const propeller = plane.userData.propeller;
  assert.ok(propeller.position.z > 0, "propeller is ahead of engine");
  assert.ok(propeller.children.length >= 3, "separate blades and hub");
  assert.deepEqual(
    plane.userData.wingTips.map((v) => Math.sign(v.x)),
    [-1, 1],
  );
  assert.ok(plane.userData.wingTips.every((v) => v instanceof THREE.Vector3));
});

test("aircraft geometry remains finite with a broad wing and elongated hull", async () => {
  const createAircraft = await factory();
  for (const type of ["red", "blue"]) {
    const plane = createAircraft(type);
    const meshes = [];
    plane.traverse((object) => {
      if (!object.isMesh) return;
      meshes.push(object);
      assert.ok(
        Array.from(object.geometry.attributes.position.array).every(
          Number.isFinite,
        ),
        `${object.name} position data`,
      );
      assert.ok(
        Array.from(object.geometry.attributes.normal.array).every(
          Number.isFinite,
        ),
        `${object.name} normal data`,
      );
    });
    assert.ok(
      meshes.length > 35,
      "silhouette includes detailed structural components",
    );
    const size = new THREE.Box3()
      .setFromObject(plane)
      .getSize(new THREE.Vector3());
    assert.ok(size.x >= 14 && size.x <= 19, `wingspan ${size.x}`);
    assert.ok(size.z >= 10 && size.z <= 15, `aircraft length ${size.z}`);
    assert.ok(size.y >= 3 && size.y <= 8, `aircraft height ${size.y}`);
    const hullSize = new THREE.Box3()
      .setFromObject(plane.getObjectByName("hull"))
      .getSize(new THREE.Vector3());
    assert.ok(hullSize.z > hullSize.x * 3, "hull is elongated");
  }
});

test("blue opponent has a distinct biplane silhouette and twin main floats", async () => {
  const createAircraft = await factory();
  const red = createAircraft("red");
  const blue = createAircraft("blue");
  assert.equal(blue.userData.type, "blue");
  for (const name of [
    "hull",
    "upper-wing",
    "lower-wing",
    "cockpit",
    "engine",
    "float-left",
    "float-right",
  ]) {
    assert.ok(blue.getObjectByName(name), `missing ${name}`);
  }
  assert.equal(red.getObjectByName("lower-wing"), undefined);
  assert.ok(
    blue.getObjectByName("upper-wing").position.y >
      blue.getObjectByName("lower-wing").position.y,
  );
  assert.notEqual(
    red.getObjectByName("hull").material,
    blue.getObjectByName("hull").material,
  );
  assert.ok(blue.userData.propeller instanceof THREE.Object3D);
});

test("lofted hull has outward-facing normals and batches material groups", async () => {
  const createAircraft = await factory();
  const hull = createAircraft().getObjectByName("hull");
  assert.ok(
    hull.geometry.groups.length <= 2,
    "upper and lower colors require only two draw groups",
  );
  const normals = hull.geometry.attributes.normal;
  const positions = hull.geometry.attributes.position;
  let foundTop = false;
  for (let i = 0; i < positions.count; i++) {
    if (
      positions.getY(i) > 0.8 &&
      Math.abs(positions.getX(i)) < 0.05 &&
      Math.abs(positions.getZ(i)) < 2
    ) {
      foundTop = true;
      assert.ok(normals.getY(i) > 0, "top surface normal points upward");
    }
  }
  assert.ok(foundTop);
});

test('major aircraft forms use cel paint with thin shared-geometry silhouette shells', async () => {
  const createAircraft = await factory();
  for (const type of ['red', 'blue']) {
    const plane = createAircraft(type);
    const hull = plane.getObjectByName('hull');
    assert.ok(hull.material.every(material => material.isShaderMaterial && material.userData.celPaint));
    const outlines = [];
    plane.traverse(object => { if (object.userData.isAircraftOutline) outlines.push(object); });
    assert.ok(outlines.length >= 8 && outlines.length <= 16, `major-form-only outline budget: ${outlines.length}`);
    for (const outline of outlines) {
      assert.equal(outline.geometry, outline.parent.geometry, 'shell reuses source geometry');
      assert.equal(outline.material.side, THREE.BackSide);
      assert.ok(outline.material.uniforms.uThickness.value >= 0.018 && outline.material.uniforms.uThickness.value <= 0.025);
      assert.deepEqual(outline.scale.toArray(), [1, 1, 1], 'normal extrusion handles scaled parents');
      assert.equal(outline.castShadow, false);
      assert.doesNotMatch(outline.parent.name, /strut|brace|wire|propeller/);
    }
    for (const name of ['hull', 'upper-wing', 'tailplane', 'leather-coaming']) {
      assert.ok(plane.getObjectByName(name).children.some(child => child.userData.isAircraftOutline), `${name} has silhouette`);
    }
  }
});

test('airfoil surfaces are closed so outline shells cannot leak through open wing tips', async () => {
  const createAircraft = await factory();
  for (const type of ['red', 'blue']) {
    const geometry = createAircraft(type).getObjectByName('upper-wing').geometry;
    const edgeUses = new Map();
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edgeUses.set(key, (edgeUses.get(key) || 0) + 1);
      }
    }
    assert.ok([...edgeUses.values()].every(count => count === 2), 'all triangle edges have two adjacent faces');
  }
});

test('bow taper keeps a smooth directional slope instead of stopping at loft stations', async () => {
  const createAircraft = await factory();
  const positions = createAircraft().getObjectByName('hull').geometry.attributes.position;
  const side = [];
  for (let i = 0; i < positions.count; i++) {
    if (positions.getX(i) > 0 && Math.abs(positions.getZ(i) - 4.8) < 0.5) {
      const z = positions.getZ(i);
      const previous = side.find(value => Math.abs(value.z - z) < 0.0001);
      if (previous) previous.x = Math.max(previous.x, positions.getX(i));
      else side.push({ z, x: positions.getX(i) });
    }
  }
  side.sort((a, b) => a.z - b.z);
  const slopes = side.slice(1).map((value, index) => (value.x - side[index].x) / (value.z - side[index].z));
  assert.ok(slopes.every(slope => slope < -0.12), `nose taper should not flatten at station: ${slopes}`);
});

test('duplicated hull seam vertices share smooth normals', async () => {
  const createAircraft = await factory();
  const geometry = createAircraft().getObjectByName('hull').geometry;
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const atCenterTop = [];
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(positions.getZ(i) + 0.04) < 0.001 && Math.abs(positions.getX(i)) < 0.0001 && positions.getY(i) > 0.8) atCenterTop.push(i);
  }
  assert.equal(atCenterTop.length, 2);
  const [a, b] = atCenterTop.map(i => new THREE.Vector3().fromBufferAttribute(normals, i));
  assert.ok(a.distanceTo(b) < 0.0001, 'lighting must not reveal the longitudinal UV seam');
});
