import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HOUSES, TREES } from "./core.js";
const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();
export function mat(color) {
  if (!materials.has(color))
    materials.set(color, new THREE.MeshLambertMaterial({ color }));
  return materials.get(color);
}
export function cube(parent, x, y, z, w, h, d, color) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const coloredMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
// Combine a model's fixed blocks without losing their individual colors.
function compact(group) {
  const meshes = group.children.filter((child) => child.isMesh),
    geometries = [];
  for (const mesh of meshes) {
    mesh.updateMatrix();
    const g = mesh.geometry.clone().applyMatrix4(mesh.matrix);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3)
      mesh.material.color.toArray(colors, i);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometries.push(g);
    group.remove(mesh);
  }
  const merged = mergeGeometries(geometries);
  geometries.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(merged, coloredMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}
export function character(shirt = "#718ea3", hair = "#5d4435", hat = false) {
  const g = new THREE.Group();
  const left = new THREE.Group(),
    right = new THREE.Group();
  left.position.set(-0.17, 0.43, 0);
  right.position.set(0.17, 0.43, 0);
  g.add(left, right);
  cube(left, 0, -0.2, 0, 0.23, 0.4, 0.25, "#4e6261");
  cube(right, 0, -0.2, 0, 0.23, 0.4, 0.25, "#4e6261");
  cube(left, 0, -0.36, 0.05, 0.25, 0.13, 0.36, "#6a4d37");
  cube(right, 0, -0.36, 0.05, 0.25, 0.13, 0.36, "#6a4d37");
  cube(g, 0, 0.73, 0, 0.62, 0.61, 0.4, shirt);
  cube(g, 0, 1.26, 0, 0.62, 0.55, 0.53, "#edbf93");
  cube(g, 0, 1.57, -0.025, 0.66, 0.17, 0.59, hair);
  cube(g, 0, 1.37, -0.25, 0.65, 0.35, 0.12, hair);
  cube(g, -0.15, 1.28, 0.274, 0.065, 0.075, 0.025, "#3f3c34");
  cube(g, 0.15, 1.28, 0.274, 0.065, 0.075, 0.025, "#3f3c34");
  cube(g, 0, 1.12, 0.278, 0.09, 0.035, 0.025, "#b97c67");
  cube(g, -0.26, 1.17, 0.27, 0.1, 0.06, 0.02, "#e5a28c");
  cube(g, 0.26, 1.17, 0.27, 0.1, 0.06, 0.02, "#e5a28c");
  const armL = new THREE.Group(),
    armR = new THREE.Group();
  armL.position.set(-0.41, 0.94, 0);
  armR.position.set(0.41, 0.94, 0);
  g.add(armL, armR);
  for (const arm of [armL, armR]) {
    cube(arm, 0, -0.12, 0, 0.2, 0.32, 0.3, shirt);
    cube(arm, 0, -0.34, 0, 0.18, 0.18, 0.25, "#edbf93");
  }
  if (hat) {
    cube(g, 0, 1.66, 0, 0.96, 0.12, 0.85, "#d8b96c");
    cube(g, 0, 1.81, -0.02, 0.63, 0.25, 0.56, "#e6c77e");
    cube(g, 0, 1.72, -0.02, 0.65, 0.08, 0.58, "#a78051");
  }
  for (const part of [g, left, right, armL, armR]) compact(part);
  return { group: g, left, right, armL, armR };
}
export function buildWorld(scene) {
  const batches = new Map(),
    dummy = new THREE.Object3D();
  function box(x, y, z, w, h, d, color, ry = 0) {
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push([x, y, z, w, h, d, ry]);
  }
  let seed = 31415;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function flower(x, z, color, base = 0) {
    box(x, base + 0.18, z, 0.065, 0.3, 0.065, "#6f8a4c");
    box(x, base + 0.36, z, 0.24, 0.14, 0.24, color);
    box(x, base + 0.45, z, 0.1, 0.08, 0.1, "#f1d78b");
  }
  function flowers(x, z, count = 7, base = 0) {
    for (let i = 0; i < count; i++)
      flower(
        x + (random() - 0.5) * 1.5,
        z + (random() - 0.5) * 1.4,
        ["#f3d39a", "#e7a398", "#fff0cd", "#b3a4c0"][i % 4],
        base,
      );
  }
  function fence(x, z, length, axis = "x") {
    const n = Math.round(length / 1.15);
    for (let i = 0; i <= n; i++) {
      const a = (i * length) / n - length / 2;
      box(
        x + (axis === "x" ? a : 0),
        0.52,
        z + (axis === "z" ? a : 0),
        0.15,
        1,
        0.15,
        "#d4b17e",
      );
      box(
        x + (axis === "x" ? a : 0),
        1.05,
        z + (axis === "z" ? a : 0),
        0.2,
        0.12,
        0.2,
        "#edd2a0",
      );
    }
    for (const y of [0.36, 0.77])
      box(
        x,
        y,
        z,
        axis === "x" ? length : 0.1,
        0.13,
        axis === "z" ? length : 0.1,
        "#c59c6d",
      );
  }
  function path(x, z, w, d) {
    box(x, 0.035, z, w, 0.08, d, "#d8c198");
    for (let i = 0; i < (w * d) / 1.3; i++) {
      box(
        x + (random() - 0.5) * (w - 0.2),
        0.084,
        z + (random() - 0.5) * (d - 0.2),
        0.18 + random() * 0.3,
        0.025,
        0.14 + random() * 0.22,
        random() > 0.5 ? "#e7d1a9" : "#cdb68d",
      );
    }
  }
  // A cutaway block of earth, with little stones visible along the edge.
  box(0, -0.87, 0, 53, 1.6, 45, "#9c7856");
  box(0, -0.25, 0, 53.4, 0.5, 45.4, "#90a56e");
  box(0, -1.68, 0, 51.8, 0.25, 43.8, "#88674e");
  for (let i = 0; i < 80; i++) {
    const side = i % 4;
    const x = side < 2 ? (random() - 0.5) * 52 : side === 2 ? -26.52 : 26.52;
    const z = side < 2 ? (side === 0 ? -22.52 : 22.52) : (random() - 0.5) * 44;
    box(
      x,
      -0.7 - random() * 0.65,
      z,
      0.25 + random() * 0.5,
      0.18,
      0.25,
      "#bb9971",
    );
  }
  // Ground mosaics are broad and quiet; small tufts add scale.
  for (let i = 0; i < 170; i++) {
    let x = (random() - 0.5) * 51,
      z = (random() - 0.5) * 43;
    if (x > 9 && x < 15) continue;
    box(
      x,
      0.009,
      z,
      1 + random() * 2,
      0.025,
      1 + random() * 1.8,
      ["#96aa75", "#9aae79", "#8fa36e"][i % 3],
    );
  }
  path(-4, 1.5, 39, 2.8);
  path(18.5, 1.5, 10, 2.8);
  path(-11.5, -5, 2.7, 14);
  path(-10, -6, 24, 2.6);
  path(-17, -7.5, 2.4, 3);
  path(-6.5, -9.2, 2.4, 5);
  path(2.5, -6.5, 2.4, 3);
  path(-9.7, 7.7, 2.7, 11);
  path(-7, 10, 10, 2.4);
  path(-3, 7.6, 2.4, 7);
  path(20, 6, 2.3, 9);
  // Rounded-square village green, patterned pavers, a flower bed and benches.
  box(-3, 0.07, 1, 9.2, 0.16, 8.5, "#cfbf9b");
  for (let ix = 0; ix < 10; ix++)
    for (let iz = 0; iz < 9; iz++) {
      box(
        -7.05 + ix * 0.9,
        0.165,
        -2.6 + iz * 0.9,
        0.85,
        0.06,
        0.85,
        (ix + iz) % 3 === 0 ? "#e1d2af" : "#d8c8a6",
      );
    }
  box(-3, 0.36, -0.5, 2.5, 0.6, 2.5, "#c3aa80");
  box(-3, 0.7, -0.5, 2.2, 0.12, 2.2, "#ead4aa");
  box(-3, 0.77, -0.5, 1.9, 0.12, 1.9, "#806849");
  for (let i = 0; i < 20; i++)
    flower(
      -3 + (random() - 0.5) * 1.7,
      -0.5 + (random() - 0.5) * 1.7,
      ["#e6a29b", "#f5d888", "#f6e8bd"][i % 3],
      0.84,
    );
  function bench(x, z, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
    cube(g, 0, 0.53, 0, 1.7, 0.15, 0.57, "#a77a52");
    cube(g, 0, 0.97, -0.3, 1.7, 0.5, 0.12, "#bd9264");
    for (const a of [-0.6, 0.6])
      cube(g, a, 0.25, 0, 0.13, 0.5, 0.43, "#68684d");
  }
  bench(-6, -1.7);
  bench(0.3, -1.8, Math.PI / 2);
  function lamp(x, z) {
    box(x, 1.6, z, 0.13, 3.2, 0.13, "#68705a");
    box(x, 3.16, z, 0.65, 0.13, 0.65, "#5c634f");
    box(x, 2.85, z, 0.43, 0.5, 0.43, "#fbe6ae");
    box(x, 2.53, z, 0.55, 0.12, 0.55, "#6e7257");
    box(x, 3.31, z, 0.4, 0.15, 0.4, "#6e7257");
  }
  [
    [-8, -1.4],
    [1.5, 4.8],
    [-13, -5],
    [7.8, 3.8],
    [16, 3.8],
    [-13.7, 13],
  ].forEach(([x, z]) => lamp(x, z));
  // Houses are assembled from block courses, including stepped gables and shingle roofs.
  HOUSES.forEach((h, index) => {
    const { x, z, w, d, wall, roof } = h;
    box(x, 0.24, z, w + 0.35, 0.46, d + 0.3, "#9c947b");
    box(x, 1.8, z, w, 3.1, d, wall);
    box(x, 0.55, z, w + 0.08, 0.22, d + 0.08, "#c6ae83");
    for (let i = 0; i < 7; i++) {
      const rw = w + 0.65 - i * (w / 7);
      box(x, 3.5 + i * 0.27, z, rw, 0.28, d + 0.7, roof);
    }
    // Gable under the roof, in cream, visible at the front and back.
    for (let i = 0; i < 6; i++) {
      box(
        x,
        3.53 + i * 0.25,
        z + d / 2 + 0.015,
        w - (i * w) / 6,
        0.25,
        0.05,
        wall,
      );
    }
    box(x, 5.1, z - 0.7, 1.02, 1.4, 0.85, "#bc9f82");
    box(x, 5.83, z - 0.7, 1.18, 0.18, 1, "#886e59");
    for (const a of [-w / 2 + 0.13, w / 2 - 0.13])
      box(x + a, 1.85, z + d / 2 + 0.04, 0.2, 2.7, 0.12, "#ad8860");
    const doorX = index === 0 ? x + 0.6 : x;
    box(doorX, 1.33, z + d / 2 + 0.08, 1.05, 2, 0.15, "#907052");
    box(doorX, 1.37, z + d / 2 + 0.18, 0.77, 1.7, 0.05, "#a48460");
    box(doorX + 0.28, 1.2, z + d / 2 + 0.23, 0.1, 0.1, 0.08, "#e7cc85");
    box(doorX, 0.17, z + d / 2 + 0.65, 1.75, 0.3, 1.2, "#b8ad8f");
    box(doorX, 0.08, z + d / 2 + 1.25, 2.1, 0.16, 0.5, "#cabf9c");
    for (const a of [-1.85, 1.85]) {
      if (Math.abs(a) > w / 2 - 0.7) continue;
      const wx = x + a;
      box(wx, 2, z + d / 2 + 0.1, 1.13, 1.2, 0.16, "#9a7c5b");
      box(wx, 2.04, z + d / 2 + 0.2, 0.89, 0.94, 0.05, "#a9c8c0");
      box(wx, 2.04, z + d / 2 + 0.24, 0.07, 1, 0.05, "#eee0b7");
      box(wx, 2.04, z + d / 2 + 0.24, 0.94, 0.07, 0.05, "#eee0b7");
      box(wx, 1.38, z + d / 2 + 0.32, 1.3, 0.28, 0.45, "#a67c54");
      for (let i = 0; i < 4; i++)
        flower(
          wx - 0.43 + i * 0.28,
          z + d / 2 + 0.4,
          ["#f3d39a", "#e7a398"][i % 2],
          1.52,
        );
    }
    box(x + w / 2 + 0.04, 2, z, 0.12, 1.2, 1.2, "#92795e");
    box(x + w / 2 + 0.11, 2, z, 0.05, 0.98, 0.98, "#b1c9c0");
    box(x + w / 2 + 0.15, 2, z, 0.05, 1, 0.07, "#eee0b7");
    box(x + w / 2 + 0.15, 2, z, 0.05, 0.07, 1, "#eee0b7");
    if (index === 1) {
      box(x, 2.8, z + d / 2 + 0.65, 3.7, 0.13, 1.3, "#f2d6a1");
      for (let a = 0; a < 5; a++)
        box(
          x - 1.5 + a * 0.75,
          2.79,
          z + d / 2 + 0.65,
          0.36,
          0.16,
          1.32,
          "#b88065",
        );
    }
    fence(x - w / 2 - 0.65, z + 1, 3, "z");
    flowers(x + w / 2 + 0.9, z + 1.5, 12);
  });
  // Vegetable garden, open gate facing the main road and wide walking aisles.
  box(-16, 0.05, 9, 8.4, 0.12, 8.2, "#b89c6c");
  const crops = [];
  for (let row = 0; row < 3; row++) {
    const z = 6 + row * 2.5;
    box(-16, 0.14, z, 7, 0.22, 1.65, "#8b694b");
    for (let j = 0; j < 9; j++)
      box(-19.25 + j * 0.8, 0.26, z, 0.04, 0.04, 1.5, "#a07b54");
    for (let col = 0; col < 6; col++) {
      const x = -18.9 + col * 1.15;
      const crop = new THREE.Group();
      crop.position.set(x, 0, z);
      scene.add(crop);
      cube(crop, 0, 0.36, 0, 0.27, 0.3, 0.27, "#df9753");
      cube(crop, 0, 0.58, 0, 0.1, 0.3, 0.1, "#75934f");
      const leaf = cube(crop, -0.13, 0.6, 0, 0.32, 0.1, 0.14, "#829f58");
      leaf.rotation.z = -0.5;
      const leaf2 = cube(crop, 0.13, 0.63, 0.03, 0.32, 0.1, 0.14, "#99ad61");
      leaf2.rotation.z = 0.5;
      compact(crop);
      crops.push({
        id: `crop-${row}-${col}`,
        type: "crop",
        name: "成熟的胡萝卜",
        action: "采摘胡萝卜",
        x,
        z,
        range: 1.35,
        group: crop,
        harvested: false,
      });
    }
  }
  fence(-20.7, 9, 9, "z");
  fence(-16, 13.45, 9.4);
  fence(-16, 4.65, 9.4);
  fence(-11.3, 5.4, 1.5, "z");
  fence(-11.3, 12.5, 1.6, "z");
  // Water replaces the grass top; bank blocks hide the edges of the river cut.
  box(12, 0.045, 0, 4.2, 0.12, 45.5, "#78aeb0");
  for (let side of [9.75, 14.25]) {
    box(side, 0.13, 0, 0.5, 0.3, 45, "#c5bc8d");
    for (let i = 0; i < 28; i++) {
      const z = -21 + i * 1.6;
      if (z > -0.8 && z < 3.9) continue;
      box(
        side,
        0.24,
        z,
        0.6,
        0.2,
        0.7,
        ["#a6ad7a", "#9ba572", "#b5b98a"][i % 3],
      );
    }
  }
  for (let i = 0; i < 15; i++) {
    box(
      12,
      0.24,
      -0.22 + i * 0.245,
      5,
      0.25,
      0.22,
      i % 3 === 0 ? "#b28a5c" : "#c39a69",
    );
  }
  for (const z of [-0.36, 3.36]) {
    for (let x = 9.6; x <= 14.5; x += 1.2)
      box(x, 0.9, z, 0.15, 1.5, 0.15, "#94724f");
    box(12, 1.32, z, 5.2, 0.14, 0.14, "#b38c60");
    box(12, 0.78, z, 5.2, 0.11, 0.1, "#b38c60");
  }
  const water = new THREE.Group();
  scene.add(water);
  const ripples = [];
  for (let i = 0; i < 32; i++) {
    const z = (random() - 0.5) * 43;
    if (z > -0.5 && z < 3.5) continue;
    const m = cube(
      water,
      10.4 + random() * 3.2,
      0.124,
      z,
      0.3 + random() * 0.75,
      0.018,
      0.04,
      "#b1d1c5",
    );
    m.castShadow = false;
    ripples.push({ mesh: m, x: m.position.x, phase: random() * 6 });
  }
  for (const z of [-15, -5, 8, 17])
    for (let j = 0; j < 5; j++) {
      const x = 14.6 + random() * 0.5;
      box(x, 0.4, z + random(), 0.055, 0.65, 0.055, "#7f8f57");
      box(x, 0.74, z + random(), 0.1, 0.16, 0.1, "#b19b66");
    }
  // The grove has warm trunks and staggered block canopies, with a trail through it.
  const trees = [];
  TREES.forEach(([x, z], i) => {
    const h = 2.9 + random() * 1.2;
    box(x, h / 2, z, 0.65, h, 0.65, "#8c6d4d");
    box(x + 0.35, h * 0.65, z, 0.65, 0.24, 0.24, "#8c6d4d");
    const crown = new THREE.Group();
    crown.position.set(x, h - 0.3, z);
    scene.add(crown);
    const colors =
      i % 5 === 0
        ? ["#b6b77c", "#c3c68a", "#a8b273"]
        : i % 4 === 0
          ? ["#819567", "#97a975", "#a6b880"]
          : ["#819c6a", "#95ae79", "#acc08a"];
    cube(crown, 0, 0.35, 0, 2.6, 1.25, 2.5, colors[0]);
    cube(crown, -0.65, 0.9, 0.2, 1.8, 1.2, 1.85, colors[1]);
    cube(crown, 0.6, 0.83, -0.35, 1.7, 1.3, 1.8, colors[1]);
    cube(crown, -0.1, 1.6, -0.1, 1.8, 0.85, 1.7, colors[2]);
    cube(crown, 0.95, 0.25, 0.65, 1.05, 0.85, 1.3, colors[0]);
    compact(crown);
    trees.push({ group: crown, phase: random() * 6 });
  });
  function crate(x, z) {
    box(x, 0.4, z, 0.85, 0.8, 0.85, "#b98c59");
    for (const y of [0.12, 0.65])
      box(x, y, z + 0.44, 0.9, 0.1, 0.05, "#8b6948");
    for (const a of [-0.34, 0.34])
      box(x + a, 0.4, z + 0.45, 0.08, 0.8, 0.05, "#d0a575");
    box(x, 0.82, z, 0.8, 0.06, 0.8, "#c69c68");
  }
  [
    [-20, -7],
    [-19, -6.7],
    [-9, -9],
    [-9.6, 12.5],
    [4.4, -5.7],
    [21, 5],
  ].forEach(([x, z]) => crate(x, z));
  // Notice board, with pinned paper notices and a little tiled cap.
  box(-8, 0.7, 2.7, 0.16, 1.4, 0.18, "#90714d");
  box(-8, 1.6, 2.7, 1.7, 1.05, 0.19, "#a47c50");
  box(-8, 1.63, 2.82, 1.44, 0.78, 0.06, "#c9a675");
  box(-8, 2.23, 2.7, 1.95, 0.19, 0.5, "#8c7050");
  for (let i = 0; i < 3; i++) {
    box(-8.47 + i * 0.46, 1.64, 2.86, 0.33, 0.48, 0.025, "#f2e5c2");
    box(-8.47 + i * 0.46, 1.83, 2.88, 0.06, 0.06, 0.02, "#ac7657");
  }
  for (const [x, z] of [
    [-10, 3.8],
    [-1, 5.7],
    [-21, 1],
    [3, -3.5],
    [8.5, -5],
    [16.5, 5],
    [-8, 14],
    [22, 4],
  ])
    flowers(x, z, 12);
  for (let i = 0; i < 160; i++) {
    const x = (random() - 0.5) * 50,
      z = (random() - 0.5) * 42;
    if (
      (x > 9 && x < 15) ||
      Math.abs(z - 1.5) < 2 ||
      (x > -21 && x < -10 && z > 4 && z < 14) ||
      (x > -8 && x < 3 && z > -4 && z < 6) ||
      (z < -6 && x < 6)
    )
      continue;
    box(x, 0.12, z, 0.08, 0.22, 0.08, "#7e985e");
    if (i % 3 === 0) box(x + 0.11, 0.1, z, 0.06, 0.17, 0.06, "#8b9f66");
  }
  // Mushroom and stone clusters in the grove.
  for (const [x, z] of [
    [18, 4],
    [22, -5],
    [16, 9],
    [-21, 15],
  ]) {
    box(x, 0.2, z, 0.12, 0.3, 0.12, "#eed8ad");
    box(x, 0.39, z, 0.45, 0.15, 0.4, "#ba7e61");
    box(x + 0.6, 0.17, z + 0.5, 0.65, 0.35, 0.5, "#b5b69b");
  }
  for (const [color, items] of batches) {
    const mesh = new THREE.InstancedMesh(geometry, mat(color), items.length);
    items.forEach(([x, y, z, w, h, d, ry], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }
  return { trees, ripples, crops };
}
