import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

async function aircraft() {
  const module = await import("../src/reference-aircraft.js").catch(() => null);
  assert.equal(
    typeof module?.createReferenceAircraft,
    "function",
    "reference module exports createReferenceAircraft",
  );
  return module.createReferenceAircraft();
}

test("reference aircraft exposes the nose-axis propeller and local trail anchors", async () => {
  const plane = await aircraft();
  assert.ok(plane instanceof THREE.Group);
  assert.equal(plane.name, "sunset-reference-aircraft");
  for (const name of [
    "fuselage",
    "main-wing",
    "tailplane",
    "tail-fin",
    "cockpit",
    "pilot",
    "spinner",
  ]) {
    assert.ok(plane.getObjectByName(name), `missing ${name}`);
  }
  const propeller = plane.userData.propeller;
  assert.ok(propeller instanceof THREE.Group);
  assert.ok(propeller.position.z > 4, "nose points along positive Z");
  assert.equal(propeller.rotation.x, 0);
  assert.equal(propeller.rotation.y, 0);
  assert.ok(
    propeller.children.filter((child) =>
      child.name.startsWith("propeller-blade"),
    ).length >= 2,
  );
  assert.equal(plane.userData.wingTips.length, 2);
  assert.ok(
    plane.userData.wingTips.every((tip) => tip instanceof THREE.Vector3),
  );
  assert.deepEqual(
    plane.userData.wingTips.map((tip) => Math.sign(tip.x)),
    [-1, 1],
  );
  assert.ok(
    plane.userData.wingTips.every(
      (tip) => Math.abs(tip.x) > 6 && Math.abs(tip.y) < 0.4,
    ),
  );
});

test("silhouette is a slender single low-wing fighter without flying-boat hardware", async () => {
  const plane = await aircraft();
  const size = new THREE.Box3()
    .setFromObject(plane)
    .getSize(new THREE.Vector3());
  assert.ok(size.x >= 12.6 && size.x <= 13.6, `span ${size.x}`);
  assert.ok(size.z >= 9.5 && size.z <= 10.7, `length ${size.z}`);
  const bodySize = new THREE.Box3()
    .setFromObject(plane.getObjectByName("fuselage"))
    .getSize(new THREE.Vector3());
  assert.ok(bodySize.z / bodySize.x > 6.5, "slim cylindrical fuselage");
  assert.ok(
    plane.getObjectByName("main-wing").position.y <= 0.05,
    "wing is low/center-mounted",
  );
  plane.traverse((object) =>
    assert.doesNotMatch(object.name, /float|strut|upper-wing|lower-wing|boat/i),
  );
  const wing = plane.getObjectByName("main-wing").geometry.attributes.position;
  const chord = (x) => {
    const z = [];
    for (let i = 0; i < wing.count; i++)
      if (Math.abs(wing.getX(i) - x) < 0.12) z.push(wing.getZ(i));
    return Math.max(...z) - Math.min(...z);
  };
  assert.ok(chord(0) > 2.4 && chord(0) < 3.3);
  assert.ok(chord(6) < chord(3), "ellipse tapers toward tips");
});

test("major surfaces are closed indexed manifolds with outward top normals", async () => {
  const plane = await aircraft();
  for (const name of ["main-wing", "tailplane", "fuselage"]) {
    const geometry = plane.getObjectByName(name).geometry;
    const edgeUses = new Map();
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      for (const [a, b] of [
        [indices[i], indices[i + 1]],
        [indices[i + 1], indices[i + 2]],
        [indices[i + 2], indices[i]],
      ]) {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edgeUses.set(key, (edgeUses.get(key) || 0) + 1);
      }
    }
    assert.ok(
      [...edgeUses.values()].every((count) => count === 2),
      `${name} has no open edges`,
    );
    const pos = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    let upward = 0;
    for (let i = 0; i < pos.count; i++) {
      if (
        pos.getY(i) > (name === "fuselage" ? 0.4 : 0.075) &&
        Math.abs(pos.getX(i)) < 0.3 &&
        Math.abs(pos.getZ(i)) < 1
      ) {
        assert.ok(normal.getY(i) > 0, `${name} outward top normal`);
        upward++;
      }
    }
    assert.ok(upward > 0, `${name} has inspectable upper surface`);
  }
});

test("paint uses sunset bands, colored wing tips, flat roundels and fine depth-writing outlines", async () => {
  const plane = await aircraft();
  const bodyPaint = plane.getObjectByName("fuselage").material;
  assert.ok(bodyPaint.userData.celPaint);
  assert.equal(bodyPaint.toneMapped, false);
  const expectedSun = new THREE.Vector3(-0.65, 0.2, -0.7).normalize();
  assert.ok(
    bodyPaint.uniforms.uLightDirection.value.distanceTo(expectedSun) < 0.0001,
  );
  const wing = plane.getObjectByName("main-wing");
  assert.equal(wing.material.length, 2);
  assert.equal(wing.geometry.groups.length, 2);
  const roundels = [];
  const shells = [];
  plane.traverse((object) => {
    if (object.userData.roundel) roundels.push(object);
    if (object.userData.isAircraftOutline) shells.push(object);
  });
  assert.equal(roundels.length, 4, "both sides of both wings carry insignia");
  for (const roundel of roundels) {
    assert.equal(
      roundel.geometry.groups.length,
      3,
      "green/ivory/red concentric bands",
    );
    assert.ok(
      roundel.material.every(
        (material) =>
          material.polygonOffset && material.polygonOffsetFactor < 0,
      ),
    );
    assert.ok(
      roundel.userData.surfaceOffset >= 0.014,
      "decals clear wing skin",
    );
  }
  for (const color of ["green", "ivory", "red"])
    assert.ok(plane.getObjectByName(`tail-stripe-${color}`));
  assert.ok(shells.length >= 5 && shells.length <= 12);
  for (const shell of shells) {
    assert.equal(shell.geometry, shell.parent.geometry);
    assert.equal(shell.material.side, THREE.BackSide);
    assert.equal(shell.material.depthWrite, true);
    assert.ok(shell.material.uniforms.uThickness.value <= 0.016);
  }
});

test("all geometry is finite and resources remain bounded and independently disposable", async () => {
  const plane = await aircraft();
  const geometries = new Set();
  const materials = new Set();
  let draws = 0;
  let vertices = 0;
  plane.traverse((object) => {
    if (!object.geometry) return;
    draws += object.geometry.groups.length || 1;
    const geometry = object.geometry;
    if (!geometries.has(geometry))
      vertices += geometry.attributes.position.count;
    geometries.add(geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      materials.add(material);
    for (const attribute of Object.values(geometry.attributes))
      assert.ok(
        Array.from(attribute.array).every(Number.isFinite),
        `${object.name} finite attribute`,
      );
    if (object.isMesh)
      assert.ok(geometry.attributes.normal, `${object.name} has normals`);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    assert.ok(
      Number.isFinite(geometry.boundingSphere.radius) &&
        geometry.boundingSphere.radius < 20,
    );
  });
  assert.ok(geometries.size <= 55, `geometry budget ${geometries.size}`);
  assert.ok(materials.size <= 16, `material budget ${materials.size}`);
  assert.ok(draws <= 85, `draw budget ${draws}`);
  assert.ok(vertices < 18000, `vertex budget ${vertices}`);
  const second = await aircraft();
  assert.notEqual(
    second.getObjectByName("fuselage").material,
    plane.getObjectByName("fuselage").material,
  );
  assert.notEqual(
    second.getObjectByName("fuselage").geometry,
    plane.getObjectByName("fuselage").geometry,
  );
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
});

test("two-sided insignia have outward normals for independent sunset lighting", async () => {
  const plane = await aircraft();
  plane.traverse((object) => {
    if (object.userData.roundel) {
      const direction = object.name.endsWith("top") ? 1 : -1;
      const normals = object.geometry.attributes.normal;
      for (let i = 0; i < normals.count; i++)
        assert.ok(
          normals.getY(i) * direction > 0.8,
          `${object.name} outward normal`,
        );
    }
    if (object.name.startsWith("tail-stripe-")) {
      const normals = object.geometry.attributes.normal;
      for (let i = 0; i < normals.count; i++)
        assert.ok(
          normals.getX(i) * Math.sign(object.position.x) > 0.99,
          "tail flag shades correctly on both faces",
        );
    }
  });
});
