import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initialDevices } from "../data";

export interface WallPart {
  group: THREE.Group;
  center: THREE.Vector3;
  normal: THREE.Vector3;
}
export interface HouseModel {
  group: THREE.Group;
  devices: Map<string, THREE.Group>;
  walls: WallPart[];
  lightEmitters: Map<string, THREE.Mesh[]>;
  animated: Map<string, THREE.Object3D[]>;
}

type Material = THREE.MeshStandardMaterial;
type Parent = THREE.Group;

/** Deterministic, locally generated materials keep the apartment entirely self contained. */
function surface(kind: "oak" | "walnut" | "rug" | "tile"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  let seed = 83;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (kind === "oak" || kind === "walnut") {
    const dark = kind === "walnut";
    ctx.fillStyle = dark ? "#6c4d36" : "#cbb394";
    ctx.fillRect(0, 0, 512, 512);
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = dark
        ? `hsl(28 28% ${29 + random() * 10}%)`
        : `hsl(33 31% ${64 + random() * 9}%)`;
      ctx.fillRect(j * 64 + 1, 0, 62, 512);
      ctx.strokeStyle = dark ? "#38291f55" : "#80674733";
      ctx.beginPath();
      ctx.moveTo(j * 64, 0);
      ctx.lineTo(j * 64, 512);
      ctx.stroke();
      const offset = (j % 3) * 155 + 35;
      ctx.fillStyle = dark ? "#38291f88" : "#85705455";
      ctx.fillRect(j * 64, offset, 64, 1.5);
      for (let i = 0; i < 28; i++) {
        const x = j * 64 + random() * 63;
        ctx.strokeStyle = dark
          ? `rgba(25,17,10,${random() * 0.17})`
          : `rgba(95,67,30,${random() * 0.13})`;
        ctx.lineWidth = 0.3 + random();
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
          x - 8 + random() * 16,
          150,
          x - 5 + random() * 10,
          350,
          x + random() * 5,
          512,
        );
        ctx.stroke();
      }
    }
  } else if (kind === "rug") {
    ctx.fillStyle = "#d4cbbb";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 13500; i++) {
      ctx.fillStyle = random() > 0.45 ? "#ffffff28" : "#7e71512b";
      ctx.fillRect(random() * 512, random() * 512, 0.8, 2 + random() * 3);
    }
    ctx.strokeStyle = "#8d887048";
    ctx.lineWidth = 7;
    ctx.strokeRect(25, 25, 462, 462);
    ctx.lineWidth = 1.3;
    ctx.strokeRect(36, 36, 440, 440);
  } else {
    ctx.fillStyle = "#c5c4b8";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = ["#ecebdf70", "#9a9a8d30", "#aaa79322"][i % 3];
      ctx.beginPath();
      ctx.ellipse(
        random() * 512,
        random() * 512,
        random() * 3 + 0.5,
        random() * 2 + 0.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.strokeStyle = "#edeee6";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1, 1, 510, 510);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  if (kind === "oak") texture.repeat.set(2, 2);
  if (kind === "tile") texture.repeat.set(4, 4);
  return texture;
}

function artwork(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const x = c.getContext("2d")!;
  x.fillStyle = "#dfd9c8";
  x.fillRect(0, 0, 512, 320);
  x.fillStyle = "#9d7755";
  x.beginPath();
  x.arc(330, 113, 69, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#4b6155";
  x.beginPath();
  x.moveTo(0, 238);
  x.bezierCurveTo(125, 100, 270, 330, 512, 167);
  x.lineTo(512, 320);
  x.lineTo(0, 320);
  x.fill();
  x.fillStyle = "#798169";
  x.beginPath();
  x.moveTo(0, 276);
  x.bezierCurveTo(180, 170, 270, 277, 512, 265);
  x.lineTo(512, 320);
  x.lineTo(0, 320);
  x.fill();
  x.strokeStyle = "#eee8d8";
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.moveTo(0, 285 + i * 9);
    x.bezierCurveTo(180, 190 + i * 9, 300, 275 + i * 9, 512, 273 + i * 9);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildHouse(): HouseModel {
  const group = new THREE.Group();
  group.name = "Habitat · Garden apartment";
  const devices = new Map<string, THREE.Group>();
  const walls: WallPart[] = [];
  const lightEmitters = new Map<string, THREE.Mesh[]>();
  const animated = new Map<string, THREE.Object3D[]>();
  const mat = (color: string, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const oak = new THREE.MeshStandardMaterial({
    map: surface("oak"),
    roughness: 0.76,
  });
  const walnut = new THREE.MeshStandardMaterial({
    map: surface("walnut"),
    roughness: 0.59,
  });
  const wallMat = mat("#e8e5db", 0.92),
    trim = mat("#f7f3e9", 0.76);
  const white = mat("#efece2", 0.46),
    charcoal = mat("#28302d", 0.5),
    dark = mat("#182322", 0.48);
  const brass = mat("#aa8b53", 0.33, 0.72),
    steel = mat("#9baca5", 0.28, 0.72);
  const sage = mat("#788b78", 0.96),
    paleSage = mat("#99a18c", 0.95),
    olive = mat("#596651", 0.92);
  const linen = mat("#e4ddcc", 1),
    terracotta = mat("#b5795e", 0.94),
    stone = mat("#dddacc", 0.6);
  const tile = new THREE.MeshStandardMaterial({
    map: surface("tile"),
    roughness: 0.72,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: "#b5cec1",
    transparent: true,
    opacity: 0.16,
    roughness: 0.2,
    metalness: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const rugMat = new THREE.MeshStandardMaterial({
    map: surface("rug"),
    roughness: 1,
  });
  const unitBox = new THREE.BoxGeometry(1, 1, 1),
    sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 24);
  const roundedCache = new Map<string, THREE.BufferGeometry>();

  function mesh(
    parent: Parent,
    geometry: THREE.BufferGeometry,
    material: Material,
    x = 0,
    y = 0,
    z = 0,
  ): THREE.Mesh {
    const o = new THREE.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(
    p: Parent,
    w: number,
    h: number,
    d: number,
    material: Material,
    x = 0,
    y = 0,
    z = 0,
    radius = 0,
  ): THREE.Mesh {
    if (radius) {
      const key = `${w}/${h}/${d}/${radius}`;
      if (!roundedCache.has(key))
        roundedCache.set(
          key,
          new RoundedBoxGeometry(
            w,
            h,
            d,
            2,
            Math.min(radius, w / 3, h / 3, d / 3),
          ),
        );
      return mesh(p, roundedCache.get(key)!, material, x, y, z);
    }
    const o = mesh(p, unitBox, material, x, y, z);
    o.scale.set(w, h, d);
    return o;
  }
  function cylinder(
    p: Parent,
    radius: number,
    height: number,
    material: Material,
    x = 0,
    y = 0,
    z = 0,
  ): THREE.Mesh {
    const o = mesh(p, cylinderGeometry, material, x, y, z);
    o.scale.set(radius, height, radius);
    return o;
  }
  function ball(
    p: Parent,
    sx: number,
    sy: number,
    sz: number,
    material: Material,
    x = 0,
    y = 0,
    z = 0,
  ): THREE.Mesh {
    const o = mesh(p, sphereGeometry, material, x, y, z);
    o.scale.set(sx, sy, sz);
    return o;
  }
  function ring(
    p: Parent,
    radius: number,
    tube: number,
    material: Material,
    x = 0,
    y = 0,
    z = 0,
    horizontal = false,
  ): THREE.Mesh {
    const o = mesh(
      p,
      new THREE.TorusGeometry(radius, tube, 8, 56),
      material,
      x,
      y,
      z,
    );
    if (horizontal) o.rotation.x = Math.PI / 2;
    return o;
  }
  function line(
    p: Parent,
    a: THREE.Vector3,
    b: THREE.Vector3,
    width: number,
    material: Material,
  ): THREE.Mesh {
    const m = cylinder(p, width, a.distanceTo(b), material);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return m;
  }
  function at(
    x: number,
    y: number,
    z: number,
    rotation = 0,
    parent = group,
  ): Parent {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotation;
    parent.add(g);
    return g;
  }
  function dev(id: string): Parent {
    const data = initialDevices.find((d) => d.id === id)!;
    const g = at(...data.position);
    g.name = data.name;
    g.userData.deviceId = id;
    devices.set(id, g);
    return g;
  }
  function glow(
    id: string,
    m: THREE.Mesh,
    color = "#ffdb99",
    strength = 1,
  ): THREE.Mesh {
    const material = (m.material as Material).clone();
    material.emissive.set(color);
    material.emissiveIntensity = strength;
    m.material = material;
    lightEmitters.set(id, [...(lightEmitters.get(id) || []), m]);
    return m;
  }
  function pot(
    p: Parent,
    x: number,
    y: number,
    z: number,
    scale = 1,
    planter = stone,
  ): void {
    const g = at(x, y, z, 0, p);
    const geometry = new THREE.CylinderGeometry(
      0.19 * scale,
      0.145 * scale,
      0.3 * scale,
      20,
    );
    mesh(g, geometry, planter, 0, 0.15 * scale, 0);
    cylinder(
      g,
      0.165 * scale,
      0.016 * scale,
      mat("#3f4232"),
      0,
      0.297 * scale,
      0,
    );
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        reach = (0.15 + (i % 3) * 0.055) * scale,
        h = (0.43 + (i % 4) * 0.105) * scale;
      const target = new THREE.Vector3(
        Math.cos(a) * reach,
        h,
        Math.sin(a) * reach,
      );
      line(
        g,
        new THREE.Vector3(0, 0.28 * scale, 0),
        target,
        0.008 * scale,
        olive,
      );
      const leaf = ball(
        g,
        0.065 * scale,
        0.155 * scale,
        0.025 * scale,
        i % 2 ? sage : olive,
        target.x,
        target.y,
        target.z,
      );
      leaf.rotation.set(Math.cos(a) * 0.65, a, Math.sin(a) * -0.65);
    }
  }
  function vase(
    p: Parent,
    x: number,
    y: number,
    z: number,
    scale = 1,
    material = terracotta,
  ): void {
    const points = [
      new THREE.Vector2(0.08, 0),
      new THREE.Vector2(0.13, 0.03),
      new THREE.Vector2(0.14, 0.13),
      new THREE.Vector2(0.1, 0.21),
      new THREE.Vector2(0.056, 0.24),
      new THREE.Vector2(0.057, 0.3),
    ].map((v) => v.multiplyScalar(scale));
    mesh(p, new THREE.LatheGeometry(points, 20), material, x, y, z);
  }
  function book(
    p: Parent,
    x: number,
    y: number,
    z: number,
    color: string,
    w = 0.08,
    h = 0.31,
    d = 0.22,
  ): void {
    box(p, w, h, d, mat(color), x, y + h / 2, z, 0.01);
    box(p, w + 0.003, 0.014, 0.009, brass, x, y + h * 0.22, z + d / 2 + 0.003);
  }
  function rug(x: number, z: number, w: number, d: number): void {
    box(group, w, 0.018, d, rugMat, x, 0.025, z, 0.08);
    for (let i = 0; i < Math.floor(w * 11); i++) {
      box(
        group,
        0.018,
        0.009,
        0.045,
        linen,
        x - w / 2 + 0.06 + i * 0.09,
        0.032,
        z + d / 2 + 0.015,
      );
    }
  }
  function picture(
    p: Parent,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    angle = 0,
  ): void {
    const g = at(x, y, z, angle, p);
    box(g, w + 0.06, h + 0.06, 0.04, walnut);
    box(g, w, h, 0.012, trim, 0, 0, 0.025);
    box(
      g,
      w * 0.86,
      h * 0.84,
      0.009,
      new THREE.MeshStandardMaterial({ map: artwork(), roughness: 0.8 }),
      0,
      0,
      0.035,
    );
  }
  function wall(
    name: string,
    normal: [number, number, number],
    center: [number, number, number],
    pieces: [number, number, number, number, number, number][],
  ): Parent {
    const g = new THREE.Group();
    g.name = name;
    group.add(g);
    for (const [x, y, z, w, h, d] of pieces) {
      box(g, w, h, d, wallMat, x, y, z);
      if (y - h / 2 < 0.1)
        box(g, w + 0.022, 0.11, d + 0.022, trim, x, 0.065, z);
      if (y + h / 2 > 2.5)
        box(g, w + 0.025, 0.035, d + 0.025, trim, x, 2.652, z);
    }
    walls.push({
      group: g,
      center: new THREE.Vector3(...center),
      normal: new THREE.Vector3(...normal),
    });
    return g;
  }
  function windowFrame(
    p: Parent,
    x: number,
    z: number,
    width: number,
    angle: number,
  ): void {
    const g = at(x, 1.6, z, angle, p);
    box(g, width, 1.55, 0.018, glass);
    for (const side of [-1, 1])
      box(g, 0.055, 1.63, 0.105, trim, (width / 2) * side, 0, 0);
    for (const side of [-1, 1])
      box(g, width + 0.05, 0.06, 0.105, trim, 0, 0.79 * side, 0);
    box(g, 0.035, 1.6, 0.06, trim);
    box(g, width + 0.12, 0.065, 0.24, stone, 0, -0.84, 0.025);
  }

  // Floating architectural base and continuous finishes.
  box(group, 12.32, 0.27, 9.32, mat("#71786d"), 0, -0.19, 0, 0.07);
  box(group, 12.1, 0.11, 9.1, stone, 0, -0.055, 0, 0.025);
  box(group, 4.3, 0.035, 5.3, oak, 0.15, -0.001, 1.85);
  box(group, 4, 0.035, 5.1, oak, -4, -0.001, -1.95);
  box(group, 4.3, 0.035, 3.7, oak, 0.15, -0.001, -2.65);
  box(group, 3.7, 0.035, 7, tile, 4.15, -0.001, -1);
  box(group, 4, 0.035, 3.9, tile, -4, -0.001, 2.55);
  box(group, 3.7, 0.035, 2, oak, 4.15, -0.001, 3.5);
  // Brass room thresholds make openings legible with the walls removed.
  box(group, 0.028, 0.01, 9, brass, -2, 0.025, 0);
  box(group, 0.028, 0.01, 9, brass, 2.3, 0.025, 0);
  box(group, 4.3, 0.01, 0.028, brass, 0.15, 0.025, -0.8);
  box(group, 4, 0.01, 0.028, brass, -4, 0.025, 0.6);
  box(group, 3.7, 0.01, 0.028, brass, 4.15, 0.025, 2.5);

  const north = wall(
    "North facade",
    [0, 0, -1],
    [0, 1.3, -4.5],
    [
      [-4, 1.325, -4.5, 4, 2.65, 0.16],
      [-1.7, 1.325, -4.5, 0.6, 2.65, 0.16],
      [0.55, 0.385, -4.5, 3.9, 0.77, 0.16],
      [0.55, 2.57, -4.5, 3.9, 0.16, 0.16],
      [4.25, 1.325, -4.5, 3.5, 2.65, 0.16],
    ],
  );
  windowFrame(north, 0.5, -4.48, 3.65, 0);
  const west = wall(
    "West facade",
    [-1, 0, 0],
    [-6, 1.3, 0],
    [
      [-6, 1.325, -3.65, 0.16, 2.65, 1.7],
      [-6, 0.385, -1.25, 0.16, 0.77, 3.1],
      [-6, 2.57, -1.25, 0.16, 0.16, 3.1],
      [-6, 1.325, 2.35, 0.16, 2.65, 4.3],
    ],
  );
  windowFrame(west, -5.99, -1.25, 3.05, Math.PI / 2);
  const east = wall(
    "East facade",
    [1, 0, 0],
    [6, 1.3, 0],
    [
      [6, 1.325, -2.3, 0.16, 2.65, 4.4],
      [6, 0.385, 1.15, 0.16, 0.77, 2.5],
      [6, 2.57, 1.15, 0.16, 0.16, 2.5],
      [6, 1.325, 2.6, 0.16, 2.65, 0.4],
      [6, 0.42, 3.65, 0.16, 0.84, 1.7],
    ],
  );
  windowFrame(east, 5.99, 1.1, 2.5, Math.PI / 2);
  const south = wall(
    "South facade",
    [0, 0, 1],
    [0, 1.3, 4.5],
    [
      [-4, 1.325, 4.5, 4, 2.65, 0.16],
      [-1.45, 1.325, 4.5, 1.1, 2.65, 0.16],
      [0.15, 0.35, 4.5, 2.1, 0.7, 0.16],
      [0.15, 2.57, 4.5, 2.1, 0.16, 0.16],
      [1.74, 1.325, 4.5, 1.12, 2.65, 0.16],
      [4.15, 0.43, 4.5, 3.7, 0.86, 0.14],
    ],
  );
  windowFrame(south, 0.15, 4.5, 2.05, 0);
  // Balcony glass balustrade sits inside the cutaway facade.
  box(south, 3.6, 0.65, 0.025, glass, 4.15, 1.18, 4.48);
  box(south, 3.8, 0.025, 0.065, charcoal, 4.15, 1.52, 4.48);
  wall(
    "Bedroom partition",
    [1, 0, 0],
    [-2, 1.3, -1.95],
    [
      [-2, 1.325, -2.5, 0.14, 2.65, 4],
      [-2, 2.43, 0.075, 0.14, 0.44, 1.15],
    ],
  );
  wall(
    "Bedroom bathroom partition",
    [0, 0, 1],
    [-4, 1.3, 0.6],
    // Bedroom and bathroom have separate entrances from the living room.
    [[-4, 1.325, 0.6, 4, 2.65, 0.14]],
  );
  wall(
    "Bathroom partition",
    [1, 0, 0],
    [-2, 1.3, 2.55],
    [
      [-2, 1.325, 3.25, 0.14, 2.65, 2.5],
      [-2, 2.43, 1.3, 0.14, 0.44, 1.4],
    ],
  );
  const tvWall = wall(
    "Living study partition",
    [0, 0, 1],
    [0.15, 1.3, -0.8],
    // A continuous TV backing wall; there is no doorway to the study here.
    [[0.15, 1.325, -0.8, 4.3, 2.65, 0.13]],
  );
  wall(
    "Kitchen partition",
    [1, 0, 0],
    [2.3, 1.3, -1],
    [
      [2.3, 1.325, -3.5, 0.14, 2.65, 2],
      [2.3, 2.43, -1.65, 0.14, 0.44, 1.7],
      // The floor plan leaves a broad opening between the kitchen and living room.
      [2.3, 1.325, -0.55, 0.14, 2.65, 0.5],
      [2.3, 1.325, 2.225, 0.14, 2.65, 0.55],
    ],
  );
  // The living room and balcony are separated by a full-height side wall.
  // Keep it as its own segment so the 3D model matches the floor-plan partition.
  wall(
    "Living balcony partition",
    [1, 0, 0],
    [2.3, 1.3, 3.5],
    [[2.3, 1.325, 3.5, 0.14, 2.65, 2]],
  );
  // A broad passage connects the dining room and conservatory.
  wall(
    "Balcony threshold",
    [0, 0, 1],
    [4.15, 1.3, 2.5],
    [
      [2.775, 1.325, 2.5, 0.95, 2.65, 0.13],
      [5.475, 1.325, 2.5, 1.05, 2.65, 0.13],
      [4.1, 2.49, 2.5, 1.7, 0.32, 0.13],
    ],
  );

  // Living room: low slatted console, organic seating, nested stone tables.
  const consoleTable = at(0.15, 0, -0.42);
  box(consoleTable, 2.95, 0.08, 0.55, walnut, 0, 0.18, 0, 0.025);
  box(consoleTable, 2.9, 0.32, 0.52, walnut, 0, 0.39, 0, 0.025);
  box(consoleTable, 3, 0.035, 0.58, stone, 0, 0.57, 0, 0.015);
  for (let i = 0; i < 29; i++)
    box(
      consoleTable,
      0.032,
      0.29,
      0.022,
      oak,
      -1.38 + i * 0.098,
      0.39,
      0.269,
      0.008,
    );
  for (const x of [-1.28, 1.28])
    for (const z of [-0.18, 0.18])
      cylinder(consoleTable, 0.025, 0.18, charcoal, x, 0.09, z);
  rug(0.1, 2.08, 3.38, 2.67);
  const couch = at(0.18, 0, 3.3);
  box(couch, 2.68, 0.17, 0.95, walnut, 0, 0.19, 0, 0.055);
  box(couch, 2.6, 0.32, 0.94, sage, 0, 0.42, 0, 0.13);
  box(couch, 2.61, 0.69, 0.24, sage, 0, 0.69, 0.4, 0.11);
  for (const x of [-1.25, 1.25])
    box(couch, 0.2, 0.46, 0.94, sage, x, 0.63, 0, 0.085);
  for (const x of [-0.79, 0, 0.79]) {
    box(couch, 0.76, 0.19, 0.77, paleSage, x, 0.66, -0.06, 0.085);
    const cushion = box(couch, 0.75, 0.45, 0.2, paleSage, x, 0.87, 0.29, 0.1);
    cushion.rotation.x = -0.1;
  }
  const pillowA = box(couch, 0.39, 0.39, 0.17, linen, -0.93, 0.91, 0.12, 0.075);
  pillowA.rotation.set(-0.15, 0, 0.18);
  const pillowB = box(
    couch,
    0.37,
    0.35,
    0.18,
    terracotta,
    0.92,
    0.88,
    0.13,
    0.075,
  );
  pillowB.rotation.set(-0.2, 0, -0.2);
  box(couch, 0.47, 0.025, 0.63, linen, 0.69, 0.765, -0.16, 0.03);
  box(couch, 0.47, 0.3, 0.022, linen, 0.69, 0.6, -0.476, 0.02);
  cylinder(group, 0.55, 0.07, stone, -0.19, 0.4, 1.91);
  cylinder(group, 0.255, 0.35, walnut, -0.19, 0.2, 1.91);
  cylinder(group, 0.36, 0.055, walnut, 0.54, 0.29, 1.67);
  cylinder(group, 0.15, 0.25, walnut, 0.54, 0.14, 1.67);
  box(group, 0.32, 0.035, 0.24, terracotta, -0.25, 0.46, 1.88, 0.006);
  box(group, 0.27, 0.025, 0.21, linen, -0.22, 0.49, 1.89, 0.005);
  vase(group, 0.05, 0.444, 1.99, 0.52, stone);
  const cup = cylinder(group, 0.052, 0.063, white, 0.52, 0.349, 1.66);
  ring(group, 0.022, 0.008, white, 0.576, 0.358, 1.66);
  cup.name = "Espresso";
  pot(group, 1.66, 0, 0.04, 1.23, stone);
  picture(tvWall, -0.55, 1.77, -0.895, 0.93, 0.62, Math.PI);

  // Television is an interactive physical object, including its gallery screen.
  const tv = dev("living-tv");
  box(tv, 1.76, 1.02, 0.075, charcoal, 0, 0, 0, 0.032);
  const tvScreen = box(
    tv,
    1.66,
    0.923,
    0.012,
    new THREE.MeshStandardMaterial({ map: artwork(), roughness: 0.48 }),
    0,
    0,
    0.047,
    0.008,
  );
  glow("living-tv", tvScreen, "#d7e8d6", 0.24);
  box(tv, 0.03, 0.013, 0.004, brass, 0, -0.49, 0.047);
  for (const x of [-0.58, 0.58])
    line(
      tv,
      new THREE.Vector3(x, -0.49, 0),
      new THREE.Vector3(x + 0.08, -0.73, 0.16),
      0.015,
      charcoal,
    );
  const strip = dev("living-strip");
  glow(
    "living-strip",
    box(strip, 2.63, 0.02, 0.03, white, 0, -0.055, 0.037, 0.009),
  );
  // Explicit micro indicator surfaces give appliances instant on/off feedback.
  function indicator(
    id: string,
    p: Parent,
    x: number,
    y: number,
    z: number,
    w = 0.06,
    h = 0.014,
  ): void {
    glow(id, box(p, w, h, 0.007, white, x, y, z, 0.004), "#9de1bb", 0.8);
  }
  function airConditioner(id: string, rotation = 0): void {
    const p = dev(id);
    p.rotation.y = rotation;
    box(p, 1.03, 0.32, 0.235, white, 0, 0, 0, 0.06);
    box(p, 0.88, 0.042, 0.015, charcoal, 0, -0.108, 0.113, 0.007);
    for (let i = 0; i < 4; i++)
      box(p, 0.87, 0.008, 0.022, stone, 0, -0.105 + i * 0.008, 0.122);
    indicator(id, p, 0.32, 0.031, 0.122, 0.068, 0.019);
  }
  airConditioner("living-ac");
  airConditioner("bedroom-ac", -Math.PI / 2);
  const speaker = dev("living-speaker");
  cylinder(speaker, 0.1, 0.22, olive, 0, 0.018, 0);
  ring(speaker, 0.084, 0.009, white, 0, 0.135, 0, true);
  indicator("living-speaker", speaker, 0, 0.035, 0.102, 0.035, 0.012);
  const robot = dev("living-robot");
  cylinder(robot, 0.22, 0.115, white, 0, -0.075, 0);
  cylinder(robot, 0.221, 0.037, charcoal, 0, -0.103, 0);
  cylinder(robot, 0.061, 0.055, white, 0, 0.005, -0.05);
  indicator("living-robot", robot, 0, -0.042, 0.201, 0.052, 0.013);
  animated.set("living-robot", [robot]);
  box(group, 0.5, 0.29, 0.15, charcoal, 1.73, 0.145, 4.25, 0.04);

  // Light fittings remain suspended in the cutaway and are individually selectable.
  function pendant(
    id: string,
    radius: number,
    style: "ring" | "dome" | "disc" = "ring",
  ): void {
    const p = dev(id);
    cylinder(p, 0.012, 0.34, brass, 0, 0.19, 0);
    cylinder(p, 0.055, 0.025, brass, 0, 0.366, 0);
    if (style === "ring") {
      ring(p, radius, 0.031, brass, 0, 0, 0, true);
      glow(id, ring(p, radius, 0.018, white, 0, -0.023, 0, true));
      for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3])
        line(
          p,
          new THREE.Vector3(0, 0.31, 0),
          new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius),
          0.005,
          brass,
        );
    } else if (style === "disc") {
      cylinder(p, radius, 0.05, stone);
      glow(id, cylinder(p, radius * 0.92, 0.018, white, 0, -0.032, 0));
    } else {
      mesh(
        p,
        new THREE.SphereGeometry(
          radius,
          28,
          14,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2,
        ),
        terracotta,
        0,
        -0.02,
        0,
      );
      glow(id, cylinder(p, radius * 0.9, 0.018, white, 0, -0.031, 0));
    }
  }
  pendant("living-pendant", 0.67);
  pendant("bedroom-main", 0.46, "disc");
  pendant("study-main", 0.38, "dome");
  pendant("kitchen-main", 0.4, "dome");
  const floorLamp = dev("living-floor");
  cylinder(floorLamp, 0.22, 0.04, brass, 0, -1.59, 0);
  cylinder(floorLamp, 0.019, 1.42, brass, 0, -0.86, 0);
  mesh(
    floorLamp,
    new THREE.CylinderGeometry(0.19, 0.29, 0.31, 32, 1, true),
    linen,
    0,
    -0.05,
    0,
  );
  glow("living-floor", ball(floorLamp, 0.13, 0.13, 0.13, white, 0, -0.13, 0));
  cylinder(floorLamp, 0.192, 0.012, brass, 0, 0.11, 0);

  // Bedroom: padded bed, layered linen, side tables and a low oak credenza.
  rug(-4, -1.89, 3.45, 3.58);
  const bed = at(-4, 0, -2.3);
  box(bed, 2.35, 0.2, 2.85, walnut, 0, 0.23, 0, 0.075);
  box(bed, 2.2, 0.3, 2.69, linen, 0, 0.46, 0, 0.16);
  box(bed, 2.56, 1.08, 0.15, paleSage, 0, 0.64, -1.42, 0.08);
  for (const x of [-0.6, 0, 0.6])
    box(bed, 0.015, 0.9, 0.015, olive, x, 0.65, -1.329, 0.005);
  box(bed, 2.24, 0.18, 1.89, white, 0, 0.65, 0.35, 0.12);
  box(bed, 2.255, 0.075, 0.8, sage, 0, 0.76, 1, 0.035);
  box(bed, 2.23, 0.3, 0.045, sage, 0, 0.55, 1.364, 0.03);
  for (const x of [-0.58, 0.58]) {
    const pillow = box(bed, 0.89, 0.2, 0.55, white, x, 0.75, -0.86, 0.12);
    pillow.rotation.x = -0.13;
    box(bed, 0.61, 0.16, 0.36, linen, x, 0.81, -0.42, 0.095);
  }
  for (const x of [-5.45, -2.55]) {
    box(group, 0.6, 0.39, 0.57, walnut, x, 0.25, -3.12, 0.035);
    box(group, 0.63, 0.04, 0.61, stone, x, 0.465, -3.12, 0.025);
    box(group, 0.5, 0.016, 0.022, brass, x, 0.34, -2.825, 0.005);
  }
  vase(group, -2.59, 0.49, -3.15, 0.8, terracotta);
  const bedside = dev("bedroom-bedside");
  cylinder(bedside, 0.14, 0.035, brass, 0, -0.44, 0);
  cylinder(bedside, 0.014, 0.27, brass, 0, -0.29, 0);
  mesh(
    bedside,
    new THREE.CylinderGeometry(0.125, 0.195, 0.24, 24, 1, true),
    linen,
    0,
    -0.04,
    0,
  );
  glow(
    "bedroom-bedside",
    ball(bedside, 0.098, 0.099, 0.098, white, 0, -0.095, 0),
  );
  const wardrobe = at(-4.55, 0, -0.01);
  box(wardrobe, 2.55, 0.88, 0.56, walnut, 0, 0.48, 0, 0.025);
  box(wardrobe, 2.59, 0.035, 0.6, stone, 0, 0.935, 0, 0.02);
  for (let i = 0; i < 4; i++) {
    box(
      wardrobe,
      0.618,
      0.79,
      0.045,
      i % 2 === 0 ? linen : white,
      -0.944 + i * 0.63,
      0.5,
      0.299,
      0.012,
    );
    box(
      wardrobe,
      0.2,
      0.018,
      0.037,
      brass,
      -0.944 + i * 0.63,
      0.69,
      0.332,
      0.006,
    );
  }
  vase(wardrobe, -0.77, 0.956, 0, 0.74, terracotta);
  box(wardrobe, 0.45, 0.036, 0.31, olive, 0.67, 0.963, 0, 0.007);
  box(wardrobe, 0.4, 0.025, 0.28, linen, 0.63, 0.992, 0, 0.007);
  // Curtains: animated entries are two panels, local Z scale controls the opening.
  const curtain = dev("bedroom-curtain");
  const curtainRod = cylinder(curtain, 0.017, 3.19, brass, 0, 1.02, 0);
  curtainRod.rotation.x = Math.PI / 2;
  const curtainPanels: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const panel = at(0, -0.02, side * 0.77, 0, curtain);
    panel.userData.curtainSide = side;
    for (let i = 0; i < 9; i++) {
      const fold = box(
        panel,
        0.07,
        2.1,
        0.14,
        linen,
        Math.cos(i * Math.PI) * 0.028,
        0,
        (i - 4) * 0.151,
        0.033,
      );
      fold.castShadow = true;
    }
    curtainPanels.push(panel);
  }
  animated.set("bedroom-curtain", curtainPanels);
  picture(north, -4, 1.9, -4.396, 1.08, 0.62);

  // Study: daylight desk, upholstered task chair, tall open shelving.
  rug(0.35, -2.74, 2.7, 2.25);
  box(group, 2.68, 0.09, 0.79, walnut, 0.02, 0.79, -3.77, 0.035);
  for (const x of [-1.11, 1.13])
    for (const z of [-4.03, -3.52])
      cylinder(group, 0.037, 0.74, walnut, x, 0.39, z);
  box(group, 0.65, 0.63, 0.65, stone, -0.88, 0.375, -3.78, 0.035);
  for (const y of [0.22, 0.44, 0.64]) {
    box(group, 0.56, 0.18, 0.027, white, -0.88, y, -3.439, 0.012);
    box(group, 0.16, 0.012, 0.021, brass, -0.88, y + 0.06, -3.42);
  }
  const monitor = at(-0.12, 0.86, -3.87);
  box(monitor, 0.93, 0.57, 0.044, charcoal, 0, 0.36, 0, 0.024);
  box(monitor, 0.86, 0.5, 0.009, mat("#748376", 0.5), 0, 0.36, 0.027, 0.013);
  cylinder(monitor, 0.12, 0.025, charcoal, 0, 0, 0);
  cylinder(monitor, 0.017, 0.14, charcoal, 0, 0.08, 0);
  box(group, 0.5, 0.014, 0.17, stone, -0.17, 0.854, -3.44, 0.022);
  box(group, 0.1, 0.025, 0.13, charcoal, 0.23, 0.859, -3.45, 0.035);
  const deskLamp = dev("study-desk");
  cylinder(deskLamp, 0.13, 0.024, brass, 0, -0.395, 0);
  line(
    deskLamp,
    new THREE.Vector3(0, -0.38, 0),
    new THREE.Vector3(0.015, -0.04, -0.08),
    0.013,
    brass,
  );
  line(
    deskLamp,
    new THREE.Vector3(0.015, -0.04, -0.08),
    new THREE.Vector3(-0.15, 0.085, 0.025),
    0.014,
    brass,
  );
  const shade = mesh(
    deskLamp,
    new THREE.ConeGeometry(0.14, 0.17, 24, 1, true),
    olive,
    -0.15,
    0.047,
    0.025,
  );
  shade.rotation.z = 0.28;
  glow(
    "study-desk",
    cylinder(deskLamp, 0.11, 0.012, white, -0.15, -0.04, 0.025),
  );
  const chair = at(0.02, 0, -2.65, Math.PI);
  box(chair, 0.69, 0.13, 0.67, paleSage, 0, 0.48, 0, 0.12);
  box(chair, 0.68, 0.55, 0.13, paleSage, 0, 0.75, -0.28, 0.1);
  for (const x of [-0.24, 0.24])
    for (const z of [-0.22, 0.22])
      line(
        chair,
        new THREE.Vector3(x, 0.44, z),
        new THREE.Vector3(x * 1.25, 0.04, z * 1.3),
        0.027,
        walnut,
      );
  const shelf = at(-1.68, 0, -2.8, Math.PI / 2);
  box(shelf, 2.49, 2.32, 0.3, walnut, 0, 1.18, -0.05, 0.017);
  box(shelf, 2.38, 2.21, 0.34, stone, 0, 1.18, 0.0);
  for (const y of [0.11, 0.63, 1.17, 1.71, 2.25])
    box(shelf, 2.52, 0.055, 0.4, walnut, 0, y, 0.06);
  for (const x of [-1.24, 0, 1.24])
    box(shelf, 0.055, 2.26, 0.4, walnut, x, 1.18, 0.06);
  const bookColors = ["#a38166", "#ddd4bd", "#5b6c60", "#8c5740", "#bdac8b"];
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 6; i++)
      book(
        shelf,
        -1.05 + i * 0.135 + (row % 2 ? 1.18 : 0),
        0.15 + row * 0.535,
        0.12,
        bookColors[(i + row) % 5],
        0.08 + (i % 3) * 0.013,
        0.29 + (i % 3) * 0.036,
        0.21,
      );
  vase(shelf, 0.54, 0.68, 0.12, 0.78, terracotta);
  pot(shelf, -0.67, 1.74, 0.08, 0.45, stone);
  pot(group, 1.71, 0, -4.04, 1.06, terracotta);

  // Kitchen: walnut lower cabinets, light upper units and visible working fittings.
  const kitchen = at(3.59, 0, -3.99);
  box(kitchen, 2.27, 0.83, 0.82, walnut, 0, 0.47, 0, 0.017);
  box(kitchen, 2.29, 0.065, 0.91, stone, 0, 0.915, 0, 0.018);
  box(kitchen, 2.23, 0.11, 0.69, charcoal, 0, 0.06, 0.025);
  for (let i = 0; i < 4; i++) {
    box(
      kitchen,
      0.54,
      0.73,
      0.031,
      walnut,
      -0.84 + i * 0.56,
      0.48,
      0.427,
      0.016,
    );
    box(
      kitchen,
      0.36,
      0.022,
      0.029,
      brass,
      -0.84 + i * 0.56,
      0.773,
      0.45,
      0.007,
    );
  }
  const backsplash = at(3.76, 1.27, -4.395);
  box(backsplash, 2.92, 0.58, 0.03, white);
  for (let i = 0; i < 14; i++)
    box(backsplash, 0.009, 0.58, 0.006, stone, -1.37 + i * 0.208, 0, 0.024);
  for (let j = 0; j < 3; j++)
    box(backsplash, 2.88, 0.008, 0.006, stone, 0, -0.19 + j * 0.195, 0.024);
  for (const x of [3.89, 4.45]) {
    box(group, 0.53, 0.66, 0.38, linen, x, 1.97, -4.24, 0.018);
    box(group, 0.04, 0.11, 0.03, brass, x + 0.18, 1.75, -4.04, 0.007);
  }
  // Sink, faucet and draining grooves.
  box(group, 0.68, 0.025, 0.52, steel, 4.34, 0.958, -3.96, 0.055);
  box(group, 0.56, 0.024, 0.39, dark, 4.34, 0.977, -3.96, 0.06);
  box(group, 0.5, 0.021, 0.335, steel, 4.34, 0.991, -3.96, 0.045);
  cylinder(group, 0.022, 0.24, steel, 4.34, 1.1, -4.2);
  line(
    group,
    new THREE.Vector3(4.34, 1.22, -4.2),
    new THREE.Vector3(4.34, 1.22, -4.015),
    0.019,
    steel,
  );
  cylinder(group, 0.016, 0.06, steel, 4.34, 1.19, -4.015);
  box(group, 0.69, 0.018, 0.48, charcoal, 3.25, 0.956, -3.96, 0.035);
  for (const x of [3.08, 3.43])
    for (const z of [-4.08, -3.84]) {
      ring(group, 0.096, 0.009, steel, x, 0.971, z, true);
      ring(group, 0.067, 0.005, steel, x, 0.972, z, true);
    }
  const oven = dev("kitchen-oven");
  box(oven, 0.63, 0.66, 0.065, charcoal, 0, 0, 0.383, 0.014);
  box(oven, 0.51, 0.39, 0.022, dark, 0, -0.069, 0.424, 0.02);
  box(oven, 0.43, 0.3, 0.008, mat("#3b3930", 0.27), 0, -0.069, 0.44, 0.016);
  box(oven, 0.49, 0.026, 0.05, steel, 0, 0.172, 0.454, 0.007);
  indicator("kitchen-oven", oven, 0, 0.259, 0.423, 0.13, 0.033);
  for (const x of [-0.215, 0.215]) {
    const knob = cylinder(oven, 0.034, 0.021, steel, x, 0.265, 0.434);
    knob.rotation.x = Math.PI / 2;
  }
  const hood = dev("kitchen-hood");
  box(hood, 0.85, 0.13, 0.62, steel, 0, -0.13, 0, 0.018);
  box(hood, 0.39, 0.56, 0.28, steel, 0, 0.175, -0.13, 0.017);
  box(hood, 0.76, 0.035, 0.043, charcoal, 0, -0.15, 0.327, 0.008);
  indicator("kitchen-hood", hood, 0.25, -0.139, 0.355, 0.053, 0.01);
  const task = dev("kitchen-task");
  glow(
    "kitchen-task",
    box(task, 1.06, 0.018, 0.027, white, 0.15, -0.039, -0.014, 0.006),
    "#e7f6e9",
  );
  const fridge = dev("kitchen-fridge");
  box(fridge, 1.02, 2.1, 0.91, stone, 0, -0.025, 0, 0.07);
  for (const side of [-1, 1]) {
    box(fridge, 0.492, 1.33, 0.056, white, side * 0.251, 0.315, 0.462, 0.025);
    box(fridge, 0.023, 0.49, 0.046, steel, side * 0.066, 0.37, 0.512, 0.011);
  }
  box(fridge, 0.998, 0.56, 0.05, white, 0, -0.68, 0.461, 0.026);
  box(fridge, 0.54, 0.022, 0.029, steel, 0, -0.411, 0.506, 0.007);
  box(fridge, 0.13, 0.18, 0.008, charcoal, -0.28, 0.57, 0.497, 0.014);
  indicator("kitchen-fridge", fridge, -0.28, 0.605, 0.505, 0.065, 0.017);
  vase(group, 2.76, 0.956, -4.06, 0.73, terracotta);
  cylinder(group, 0.063, 0.19, walnut, 2.91, 1.05, -4.23);
  // Round dining table and four individually modelled bentwood chairs.
  const dining = at(3.74, 0, 0.74);
  cylinder(dining, 0.84, 0.07, oak, 0, 0.77, 0);
  cylinder(dining, 0.24, 0.72, walnut, 0, 0.375, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.25;
    const c = at(Math.sin(a) * 1.17, 0, Math.cos(a) * 1.17, a, dining);
    box(c, 0.52, 0.075, 0.51, walnut, 0, 0.45, 0, 0.09);
    box(c, 0.44, 0.055, 0.44, linen, 0, 0.5, 0, 0.095);
    box(c, 0.53, 0.36, 0.072, walnut, 0, 0.72, 0.245, 0.065);
    for (const x of [-0.19, 0.19])
      for (const z of [-0.18, 0.18])
        line(
          c,
          new THREE.Vector3(x, 0.44, z),
          new THREE.Vector3(x * 1.16, 0.03, z * 1.2),
          0.023,
          walnut,
        );
  }
  vase(dining, 0, 0.81, 0, 0.8, stone);
  for (const a of [-0.45, 0.3, 0.85])
    line(
      dining,
      new THREE.Vector3(0, 1.01, 0),
      new THREE.Vector3(a * 0.2, 1.42, Math.sin(a) * 0.17),
      0.006,
      olive,
    );
  for (const a of [0, Math.PI]) {
    cylinder(
      dining,
      0.17,
      0.012,
      white,
      Math.cos(a) * 0.51,
      0.816,
      Math.sin(a) * 0.51,
    );
    cylinder(dining, 0.075, 0.072, terracotta, Math.cos(a) * 0.38, 0.85, -0.34);
  }
  picture(east, 5.895, 1.88, -1.26, 0.8, 1.09, -Math.PI / 2);

  // Bathroom: terrazzo floor, fluted vanity, brass tapware, glazed shower.
  const bath = at(-5.5, 0, 1.83, Math.PI / 2);
  box(bath, 1.64, 0.51, 0.73, walnut, 0, 0.64, 0, 0.035);
  for (let i = 0; i < 23; i++)
    box(bath, 0.026, 0.43, 0.025, oak, -0.76 + i * 0.069, 0.64, 0.375, 0.007);
  box(bath, 1.7, 0.075, 0.77, stone, 0, 0.94, 0, 0.027);
  ball(bath, 0.45, 0.14, 0.25, white, 0, 1.018, 0.035);
  ball(bath, 0.36, 0.027, 0.175, stone, 0, 1.138, 0.045);
  cylinder(bath, 0.022, 0.24, brass, 0, 1.08, -0.25);
  line(
    bath,
    new THREE.Vector3(0, 1.2, -0.25),
    new THREE.Vector3(0, 1.2, -0.04),
    0.018,
    brass,
  );
  box(bath, 1.22, 1.04, 0.037, brass, 0, 1.77, -0.372, 0.18);
  box(
    bath,
    1.16,
    0.98,
    0.018,
    mat("#afbcb2", 0.2, 0.64),
    0,
    1.77,
    -0.346,
    0.17,
  );
  const mirrorLight = dev("bathroom-main");
  glow(
    "bathroom-main",
    box(mirrorLight, 0.035, 0.035, 1.14, white, 0, 0.279, 0.08, 0.015),
    "#e7f1e8",
  );
  box(bath, 0.37, 0.1, 0.24, linen, 0.52, 1.03, 0.06, 0.026);
  vase(bath, -0.57, 0.985, 0.04, 0.48, terracotta);
  const toilet = at(-3.0, 0, 3.64, Math.PI);
  box(toilet, 0.53, 0.79, 0.25, white, 0, 0.44, -0.28, 0.075);
  ball(toilet, 0.315, 0.23, 0.39, white, 0, 0.37, 0.09);
  ball(toilet, 0.275, 0.052, 0.337, stone, 0, 0.548, 0.095);
  ball(toilet, 0.246, 0.018, 0.296, white, 0, 0.59, 0.095);
  box(toilet, 0.26, 0.36, 0.34, white, 0, 0.19, -0.04, 0.065);
  box(toilet, 0.09, 0.015, 0.045, steel, 0, 0.844, -0.27, 0.007);
  const shower = at(-4.8, 0, 3.48);
  box(shower, 1.76, 0.08, 1.64, white, 0, 0.07, 0, 0.065);
  box(shower, 1.64, 0.018, 1.51, stone, 0, 0.117, 0, 0.04);
  box(shower, 0.028, 2.25, 1.67, glass, 0.87, 1.22, 0);
  box(shower, 1.74, 2.25, 0.028, glass, 0, 1.22, -0.79);
  for (const x of [-0.86, 0.87])
    cylinder(shower, 0.013, 2.31, brass, x, 1.235, -0.79);
  box(shower, 1.76, 0.025, 0.035, brass, 0, 2.395, -0.79);
  box(shower, 0.035, 0.025, 1.63, brass, 0.87, 2.395, 0);
  box(shower, 0.02, 0.23, 0.034, brass, 0.6, 1.21, -0.767, 0.005);
  cylinder(shower, 0.023, 1.31, brass, -0.73, 1.48, 0.55);
  line(
    shower,
    new THREE.Vector3(-0.73, 2.13, 0.55),
    new THREE.Vector3(-0.38, 2.13, 0.55),
    0.022,
    brass,
  );
  cylinder(shower, 0.15, 0.034, brass, -0.37, 2.11, 0.55);
  box(shower, 0.2, 0.085, 0.1, brass, -0.73, 1.03, 0.55, 0.021);
  const heater = dev("bathroom-heater");
  const tank = cylinder(heater, 0.235, 0.73, white);
  tank.rotation.z = Math.PI / 2;
  for (const x of [-0.376, 0.376]) {
    const cap = cylinder(heater, 0.217, 0.019, stone, x, 0, 0);
    cap.rotation.z = Math.PI / 2;
  }
  indicator("bathroom-heater", heater, 0, -0.025, 0.236, 0.118, 0.034);
  for (const x of [-0.19, 0.19])
    cylinder(heater, 0.016, 0.19, steel, x, -0.3, 0);
  box(group, 0.66, 0.025, 0.45, rugMat, -3.65, 0.036, 1.7, 0.03);

  // Balcony: laundry joinery and a small planted retreat.
  box(group, 1.13, 0.065, 1.1, stone, 5.3, 1.125, 3.65, 0.022);
  box(group, 0.055, 1.09, 1.09, walnut, 5.878, 0.56, 3.65, 0.02);
  const washer = dev("balcony-washer");
  box(washer, 0.99, 1.04, 0.91, white, 0, 0, 0, 0.045);
  box(washer, 0.91, 0.16, 0.024, stone, 0, 0.385, 0.471, 0.012);
  const drum = at(0, -0.06, 0.477, 0, washer);
  const drumOuter = cylinder(drum, 0.31, 0.049, charcoal);
  drumOuter.rotation.x = Math.PI / 2;
  const drumSteel = cylinder(drum, 0.245, 0.055, steel, 0, 0, 0.025);
  drumSteel.rotation.x = Math.PI / 2;
  const drumGlass = cylinder(
    drum,
    0.204,
    0.06,
    mat("#354744", 0.18, 0.35),
    0,
    0,
    0.04,
  );
  drumGlass.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const paddle = box(
      drum,
      0.067,
      0.17,
      0.008,
      steel,
      Math.sin(a) * 0.125,
      Math.cos(a) * 0.125,
      0.075,
      0.03,
    );
    paddle.rotation.z = -a;
  }
  ring(washer, 0.276, 0.013, steel, 0, -0.06, 0.515);
  animated.set("balcony-washer", [drum]);
  const washerKnob = cylinder(washer, 0.051, 0.02, steel, -0.22, 0.38, 0.499);
  washerKnob.rotation.x = Math.PI / 2;
  indicator("balcony-washer", washer, 0.2, 0.387, 0.49, 0.178, 0.038);
  box(group, 0.42, 0.11, 0.53, linen, 5.25, 1.219, 3.78, 0.025);
  box(group, 0.39, 0.09, 0.51, white, 5.28, 1.313, 3.78, 0.028);
  pot(group, 5.67, 1.16, 3.35, 0.54, terracotta);
  const sconce = dev("balcony-main");
  box(sconce, 0.045, 0.32, 0.15, brass, 0.08, 0, 0, 0.013);
  glow("balcony-main", ball(sconce, 0.105, 0.18, 0.105, white, -0.025, 0, 0));
  box(group, 1.44, 0.075, 0.48, walnut, 3.55, 0.49, 4.05, 0.02);
  for (const x of [3.0, 4.1])
    box(group, 0.065, 0.45, 0.4, walnut, x, 0.24, 4.05, 0.014);
  box(group, 0.63, 0.065, 0.43, linen, 3.35, 0.56, 4.05, 0.065);
  pot(group, 2.86, 0, 3.03, 1.25, terracotta);
  pot(group, 4.39, 0, 4.04, 0.78, stone);
  pot(group, 4.32, 0.53, 4.08, 0.54, terracotta);

  // Lightweight provenance for debugging and exported screenshots.
  group.userData = {
    title: "栖居 · 108㎡花园公寓",
    layout: "Original concept floor plan, six distinct rooms",
    units: "metres",
  };
  group.traverse((object) => {
    if (
      object instanceof THREE.Mesh &&
      (object.material as Material).transparent
    )
      object.castShadow = false;
  });
  return { group, devices, walls, lightEmitters, animated };
}
