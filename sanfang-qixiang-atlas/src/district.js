import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Street centerlines and landmark coordinates come from the map data. Courtyard
// architecture is a deliberately stylized reconstruction, not a measured survey.
const ORIGIN = { lng: 119.2916, lat: 26.085 };
const METERS_LAT = 111_320;
const METERS_LNG = METERS_LAT * Math.cos((ORIGIN.lat * Math.PI) / 180);
export const project = (lng, lat) => ({
  x: (lng - ORIGIN.lng) * METERS_LNG,
  z: (ORIGIN.lat - lat) * METERS_LAT,
});

function random(seed = 74913) {
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}

function roofTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const rng = random(299);
  ctx.fillStyle = "#637078";
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const shade = 84 + Math.floor(rng() * 22);
    ctx.fillStyle = `rgb(${shade},${shade + 10},${shade + 14})`;
    ctx.fillRect(x, 0, 12, 256);
    ctx.fillStyle = "rgba(199,211,215,.26)";
    ctx.fillRect(x + 1, 0, 2, 256);
    ctx.fillStyle = "rgba(20,30,29,.33)";
    ctx.fillRect(x + 13, 0, 3, 256);
    for (let y = 0; y < 256; y += 24) {
      ctx.fillStyle = "rgba(15,25,26,.20)";
      ctx.fillRect(x, y + Math.floor(rng() * 3), 16, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function pavingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const rng = random(384);
  ctx.fillStyle = "#cfc9b9";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32)
    for (let x = -64; x < 256; x += 64) {
      const shade = 202 + Math.floor(rng() * 17);
      const offset = (y / 32) % 2 ? 32 : 0;
      ctx.fillStyle = `rgb(${shade + 10},${shade + 7},${shade - 4})`;
      ctx.fillRect(x + offset + 1, y + 1, 62, 30);
    }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// A low curved roof, with gently lifted eaves and a crisp central ridge.
function makeRoofGeometry() {
  const positions = [],
    uvs = [],
    indices = [];
  const xs = [-0.5, -0.46, -0.25, 0, 0.25, 0.46, 0.5];
  const zs = [-0.5, -0.44, -0.28, 0, 0.28, 0.44, 0.5];
  for (let zi = 0; zi < zs.length; zi++)
    for (let xi = 0; xi < xs.length; xi++) {
      const x = xs[xi],
        z = zs[zi];
      const y =
        1 -
        Math.abs(z) * 2 +
        (Math.abs(z) > 0.43 ? 0.105 : 0) +
        (Math.abs(x) > 0.46 ? 0.055 : 0);
      positions.push(x, y, z);
      uvs.push((x + 0.5) * 3, (z + 0.5) * 2);
    }
  for (let z = 0; z < zs.length - 1; z++)
    for (let x = 0; x < xs.length - 1; x++) {
      const a = z * xs.length + x,
        b = a + 1,
        c = a + xs.length,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Normalized Fujian saddle-shaped fire wall. The curved stepped profile is
// deliberately exaggerated so it survives a district-scale view.
function makeSaddleWall() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.54, -0.08);
  shape.lineTo(-0.54, 0.2);
  shape.quadraticCurveTo(-0.45, 0.31, -0.36, 0.21);
  shape.quadraticCurveTo(-0.24, 0.26, -0.17, 0.55);
  shape.lineTo(-0.1, 0.55);
  shape.quadraticCurveTo(0, 0.75, 0.1, 0.55);
  shape.lineTo(0.17, 0.55);
  shape.quadraticCurveTo(0.24, 0.26, 0.36, 0.21);
  shape.quadraticCurveTo(0.45, 0.31, 0.54, 0.2);
  shape.lineTo(0.54, -0.08);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: false,
    curveSegments: 5,
  });
  // shape horizontal coordinate becomes world Z; extrusion becomes X.
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-0.0225, 0, 0);
  return geometry;
}

function createBatches(group, materials) {
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    roof: makeRoofGeometry(),
    saddle: makeSaddleWall(),
    leaf: new THREE.IcosahedronGeometry(1, 1),
    trunk: new THREE.CylinderGeometry(0.7, 1, 1, 6),
    sphere: new THREE.SphereGeometry(1, 7, 5),
  };
  const batches = new Map();
  const dummy = new THREE.Object3D();
  const add = (geometry, material, x, y, z, sx, sy, sz, rotation = 0) => {
    const key = `${geometry}:${material}`;
    if (!batches.has(key))
      batches.set(key, { geometry, material, matrices: [] });
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    batches.get(key).matrices.push(dummy.matrix.clone());
  };
  const finish = () => {
    for (const { geometry, material, matrices } of batches.values()) {
      const mesh = new THREE.InstancedMesh(
        geometries[geometry],
        materials[material],
        matrices.length,
      );
      matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.castShadow = geometry !== "sphere";
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
  };
  return { add, finish, geometries };
}

function roadRibbon(path, width, y, material, group) {
  if (path.length < 2) return;
  const vertices = [],
    uv = [],
    indices = [];
  let distance = 0;
  for (let i = 0; i < path.length; i++) {
    const prev = path[Math.max(0, i - 1)],
      next = path[Math.min(path.length - 1, i + 1)];
    const dx = next[0] - prev[0],
      dz = next[1] - prev[1],
      length = Math.hypot(dx, dz) || 1;
    const nx = ((-dz / length) * width) / 2,
      nz = ((dx / length) * width) / 2;
    if (i)
      distance += Math.hypot(
        path[i][0] - path[i - 1][0],
        path[i][1] - path[i - 1][1],
      );
    vertices.push(
      path[i][0] + nx,
      y,
      path[i][1] + nz,
      path[i][0] - nx,
      y,
      path[i][1] - nz,
    );
    uv.push(0, distance / 12, width / 12, distance / 12);
    if (i) {
      const b = i * 2;
      indices.push(b - 2, b, b - 1, b - 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "road-ribbon";
  mesh.receiveShadow = true;
  group.add(mesh);
}

function segmentHitsBox(a, b, minX, maxX, minZ, maxZ) {
  let low = 0,
    high = 1;
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - minX],
    [dx, maxX - a[0]],
    [-dz, a[1] - minZ],
    [dz, maxZ - a[1]],
  ]) {
    if (Math.abs(p) < 0.00001) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) low = Math.max(low, r);
      else high = Math.min(high, r);
      if (low > high) return false;
    }
  }
  return true;
}

function pointRoadDistance(x, z, roads) {
  let nearest = { distance: Infinity, width: 0, road: null };
  for (const road of roads)
    for (let i = 1; i < road.path.length; i++) {
      const a = road.path[i - 1],
        b = road.path[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = THREE.MathUtils.clamp(
        ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1),
        0,
        1,
      );
      const distance = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
      if (distance < nearest.distance)
        nearest = { distance, width: road.width, road };
    }
  return nearest;
}

function inPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

function roundRect(width, depth, radius) {
  const s = new THREE.Shape(),
    x = -width / 2,
    y = -depth / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + depth - radius);
  s.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  s.lineTo(x + radius, y + depth);
  s.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`地图资源加载失败：${url}（${response.status}）`);
  return response.json();
}

export async function createDistrict({ scene, onProgress = () => {} }) {
  onProgress(0.08);
  const dataBase = import.meta.env.BASE_URL;
  const [map, placesData] = await Promise.all([
    loadJson(`${dataBase}data/map.geojson`),
    loadJson(`${dataBase}data/places.json`),
  ]);
  if (!map.features?.length || !placesData.length)
    throw new Error("地图数据不完整，请检查 data 目录。");
  const group = new THREE.Group();
  group.name = "三坊七巷 · 建筑示意沙盘";
  scene.add(group);
  const roofMap = roofTexture(),
    pavingMap = pavingTexture();
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: "#eee9d9", roughness: 0.94 }),
    warmWall: new THREE.MeshStandardMaterial({
      color: "#dfd7c0",
      roughness: 0.95,
    }),
    whiteWall: new THREE.MeshStandardMaterial({
      color: "#faf6e9",
      roughness: 0.94,
    }),
    roof: new THREE.MeshStandardMaterial({
      color: "#dee4e3",
      map: roofMap,
      roughness: 0.92,
      side: THREE.DoubleSide,
    }),
    ridge: new THREE.MeshStandardMaterial({ color: "#637176", roughness: 0.9 }),
    timber: new THREE.MeshStandardMaterial({
      color: "#66533c",
      roughness: 0.85,
    }),
    door: new THREE.MeshStandardMaterial({ color: "#4c4c40", roughness: 0.86 }),
    trim: new THREE.MeshStandardMaterial({ color: "#b9b1a0", roughness: 0.95 }),
    ground: new THREE.MeshStandardMaterial({ color: "#d9d7c5", roughness: 1 }),
    base: new THREE.MeshStandardMaterial({ color: "#c5bd9f", roughness: 0.92 }),
    pavement: new THREE.MeshStandardMaterial({
      color: "#faf4df",
      map: pavingMap,
      roughness: 1,
    }),
    mainStreet: new THREE.MeshStandardMaterial({
      color: "#eae0bd",
      map: pavingMap,
      roughness: 0.98,
    }),
    courtyard: new THREE.MeshStandardMaterial({
      color: "#cfc8b5",
      map: pavingMap,
      roughness: 0.98,
    }),
    garden: new THREE.MeshStandardMaterial({ color: "#afba8b", roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#827b58", roughness: 1 }),
    leaf1: new THREE.MeshStandardMaterial({
      color: "#355c4c",
      roughness: 1,
      flatShading: true,
    }),
    leaf2: new THREE.MeshStandardMaterial({
      color: "#4d6c4f",
      roughness: 1,
      flatShading: true,
    }),
    leaf3: new THREE.MeshStandardMaterial({
      color: "#668058",
      roughness: 1,
      flatShading: true,
    }),
    leaf4: new THREE.MeshStandardMaterial({
      color: "#476849",
      roughness: 1,
      flatShading: true,
    }),
    water: new THREE.MeshStandardMaterial({
      color: "#91b1a1",
      roughness: 0.31,
      metalness: 0.08,
    }),
    lantern: new THREE.MeshStandardMaterial({
      color: "#ac593a",
      roughness: 0.8,
    }),
    gold: new THREE.MeshStandardMaterial({ color: "#b89757", roughness: 0.6 }),
  };
  const { add, finish } = createBatches(group, materials);
  const rng = random(1966);
  const roadFeatures = (map.features || []).filter(
    (f) =>
      f.geometry?.type === "LineString" ||
      f.geometry?.type === "MultiLineString",
  );
  const roads = roadFeatures.flatMap((f, fi) => {
    const paths =
      f.geometry.type === "LineString"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    return paths.map((coords, pi) => {
      const name = f.properties?.name || f.properties?.["name:zh"] || "";
      const type = f.properties?.highway || f.properties?.type || "";
      const main = /南后街/.test(name);
      const perimeter = /杨桥|通湖|澳门|道山|白马|八一七/.test(name);
      const streetWidth = main
        ? 16
        : type === "primary"
          ? 23
          : type === "secondary"
            ? 20
            : perimeter
              ? 15
              : type === "tertiary"
                ? 11
                : ["footway", "steps", "path"].includes(type)
                  ? 3.2
                  : 7.8;
      return {
        id: f.id || `road-${fi}-${pi}`,
        name,
        main,
        width: Number(f.properties?.width) || streetWidth,
        type,
        path: coords.map((c) => {
          const p = project(c[0], c[1]);
          return [p.x, p.z];
        }),
      };
    });
  });

  // Useful fallback for a missing data file, kept distinct from measured data.
  if (!roads.length) {
    roads.push({
      id: "nanhou",
      name: "南后街",
      main: true,
      width: 16,
      path: [
        [18, -390],
        [-5, 370],
      ],
    });
    ["衣锦坊", "文儒坊", "光禄坊"].forEach((name, i) =>
      roads.push({
        id: `west-${i}`,
        name,
        width: 8,
        path: [
          [-305, -225 + i * 216],
          [10, -240 + i * 216],
        ],
      }),
    );
    ["杨桥巷", "郎官巷", "塔巷", "黄巷", "安民巷", "宫巷", "吉庇巷"].forEach(
      (name, i) =>
        roads.push({
          id: `east-${i}`,
          name,
          width: 8,
          path: [
            [15 - i * 3, -340 + i * 113],
            [300, -333 + i * 113],
          ],
        }),
    );
  }
  const boundaryFeature =
    (map.features || []).find(
      (f) =>
        f.geometry?.type === "Polygon" &&
        (f.properties?.kind === "display-boundary" ||
          f.properties?.kind === "display_boundary"),
    ) ||
    (map.features || []).find(
      (f) =>
        f.geometry?.type === "Polygon" &&
        (f.properties?.kind === "boundary" ||
          f.properties?.type === "boundary" ||
          /核心区|范围|boundary/.test(f.properties?.name || "")),
    );
  let polygon = boundaryFeature?.geometry.coordinates[0].map((c) => {
    const p = project(c[0], c[1]);
    return [p.x, p.z];
  });
  const roadXs = roads.flatMap((r) => r.path.map((p) => p[0])),
    roadZs = roads.flatMap((r) => r.path.map((p) => p[1]));
  const displayBounds = map.metadata?.displayBounds || map.bbox;
  if (displayBounds) {
    const nw = project(displayBounds[0], displayBounds[3]),
      se = project(displayBounds[2], displayBounds[1]);
    polygon = [
      [nw.x, nw.z],
      [se.x, nw.z],
      [se.x, se.z],
      [nw.x, se.z],
    ];
  }
  const bounds = polygon
    ? {
        minX: Math.min(...polygon.map((p) => p[0])),
        maxX: Math.max(...polygon.map((p) => p[0])),
        minZ: Math.min(...polygon.map((p) => p[1])),
        maxZ: Math.max(...polygon.map((p) => p[1])),
      }
    : {
        minX: Math.max(-500, Math.min(...roadXs) - 16),
        maxX: Math.min(500, Math.max(...roadXs) + 16),
        minZ: Math.max(-600, Math.min(...roadZs) - 16),
        maxZ: Math.min(600, Math.max(...roadZs) + 16),
      };
  polygon ||= [
    [bounds.minX, bounds.minZ],
    [bounds.maxX, bounds.minZ],
    [bounds.maxX, bounds.maxZ],
    [bounds.minX, bounds.maxZ],
  ];
  const cx = (bounds.minX + bounds.maxX) / 2,
    cz = (bounds.minZ + bounds.maxZ) / 2;
  const width = bounds.maxX - bounds.minX + 34,
    depth = bounds.maxZ - bounds.minZ + 34;
  const baseGeo = new THREE.ExtrudeGeometry(roundRect(width, depth, 9), {
    depth: 10,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 1.8,
    bevelThickness: 1.5,
    curveSegments: 8,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, materials.base);
  base.position.set(cx, -11.7, cz);
  base.receiveShadow = true;
  group.add(base);
  const topGeo = new THREE.ShapeGeometry(roundRect(width - 3, depth - 3, 8));
  topGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(topGeo, materials.ground);
  ground.position.set(cx, 0.02, cz);
  ground.receiveShadow = true;
  group.add(ground);
  // A fine border gives the model a tangible architectural-maquette edge.
  add("box", "trim", cx, -0.3, bounds.minZ - 12, width - 16, 0.6, 0.7);
  add("box", "trim", cx, -0.3, bounds.maxZ + 12, width - 16, 0.6, 0.7);
  add("box", "trim", bounds.minX - 12, -0.3, cz, 0.7, 0.6, depth - 16);
  add("box", "trim", bounds.maxX + 12, -0.3, cz, 0.7, 0.6, depth - 16);
  for (const road of roads) {
    roadRibbon(road.path, road.width + 2.5, 0.06, materials.trim, group);
    roadRibbon(
      road.path,
      road.width,
      0.1,
      road.main ? materials.mainStreet : materials.pavement,
      group,
    );
    if (road.main)
      roadRibbon(road.path, 1.1, 0.115, materials.courtyard, group);
  }
  // Merge all street segments sharing a material into a handful of draw calls.
  for (const material of [
    materials.trim,
    materials.mainStreet,
    materials.pavement,
    materials.courtyard,
  ]) {
    const ribbons = group.children.filter(
      (child) => child.name === "road-ribbon" && child.material === material,
    );
    if (ribbons.length < 2) continue;
    const geometry = mergeGeometries(ribbons.map((mesh) => mesh.geometry));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    group.add(mesh);
    ribbons.forEach((ribbon) => {
      group.remove(ribbon);
      ribbon.geometry.dispose();
    });
  }
  const landscapePolygons = [];
  for (const feature of (map.features || []).filter(
    (f) =>
      ["water", "park"].includes(f.properties?.kind) &&
      f.geometry?.type === "Polygon",
  )) {
    const projectedRings = feature.geometry.coordinates.map((ring) =>
      ring.map((c) => {
        const p = project(c[0], c[1]);
        return [p.x, p.z];
      }),
    );
    const makePath = (ring) => {
      const path = new THREE.Shape();
      ring.forEach((p, i) =>
        i ? path.lineTo(p[0], -p[1]) : path.moveTo(p[0], -p[1]),
      );
      return path;
    };
    const shape = makePath(projectedRings[0]);
    shape.holes = projectedRings.slice(1).map(makePath);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(
      geo,
      feature.properties.kind === "water" ? materials.water : materials.garden,
    );
    mesh.position.y = 0.145;
    mesh.receiveShadow = true;
    group.add(mesh);
    landscapePolygons.push({
      kind: feature.properties.kind,
      ring: projectedRings[0],
    });
  }
  onProgress(0.35);
  const places = Array.isArray(placesData)
    ? placesData
    : placesData.places || [];
  const points = places
    .map((p, index) => {
      const lng = Number(p.lng ?? p.lon ?? p.longitude ?? p.coordinates?.[0]);
      const lat = Number(p.lat ?? p.latitude ?? p.coordinates?.[1]);
      const position = project(lng, lat);
      return { ...p, id: p.id || `place-${index}`, ...position, y: p.y || 18 };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.z));

  const tree = (x, z, size = 5, banyan = false) => {
    const h = size * (banyan ? 1.75 : 1.5);
    add("trunk", "trunk", x, h / 2, z, size * 0.12, h, size * 0.12);
    if (banyan)
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + 0.3;
        add(
          "trunk",
          "trunk",
          x + Math.cos(a) * size * 0.36,
          h * 0.42,
          z + Math.sin(a) * size * 0.36,
          size * 0.035,
          h * 0.84,
          size * 0.035,
        );
      }
    for (let k = 0; k < (banyan ? 7 : 4); k++) {
      const a = k * 2.399,
        reach = size * (k ? 0.44 : 0),
        scale = size * (0.65 + rng() * 0.15);
      add(
        "leaf",
        `leaf${1 + Math.floor(rng() * 4)}`,
        x + Math.cos(a) * reach,
        h + (k ? rng() * size * 0.45 : size * 0.35),
        z + Math.sin(a) * reach,
        scale,
        scale * 0.76,
        scale,
        rng() * 6,
      );
    }
  };

  const house = (x, z, w, d, height, angle = 0, special = false) => {
    const wallMaterial = special
      ? "whiteWall"
      : rng() < 0.18
        ? "warmWall"
        : "wall";
    const local = (dx, dz) => [
      x + Math.cos(angle) * dx + Math.sin(angle) * dz,
      z - Math.sin(angle) * dx + Math.cos(angle) * dz,
    ];
    add("box", "trim", x, 0.8, z, w + 0.4, 1.6, d + 0.4, angle);
    add("box", wallMaterial, x, height / 2 + 0.8, z, w, height, d, angle);
    const rh = Math.min(5.8, d * 0.29);
    add("roof", "roof", x, height + 0.8, z, w + 1.7, rh, d + 1.7, angle);
    add("box", "ridge", x, height + rh + 0.92, z, w + 1.55, 0.34, 0.4, angle);
    for (const side of [-1, 1]) {
      const [sx, sz] = local(side * w * 0.49, 0);
      add(
        "saddle",
        wallMaterial,
        sx,
        height + 0.5,
        sz,
        14,
        rh * 1.78,
        d + 0.7,
        angle,
      );
      const [ex, ez] = local(0, side * (d / 2 + 0.08));
      add("box", "timber", ex, height * 0.82, ez, w * 0.94, 0.32, 0.22, angle);
      for (let j = -1; j <= 1; j++) {
        const [wx, wz] = local(j * w * 0.26, side * (d / 2 + 0.11));
        add(
          "box",
          "door",
          wx,
          height * 0.44,
          wz,
          Math.min(1.9, w * 0.12),
          height * 0.36,
          0.14,
          angle,
        );
        add(
          "box",
          "timber",
          wx,
          height * 0.44,
          wz,
          0.13,
          height * 0.38,
          0.2,
          angle,
        );
      }
    }
  };

  const courtyard = (x, z, w, d, special = false) => {
    const h = special ? 13.8 + rng() * 3 : 9.2 + rng() * 4.6;
    add("box", "courtyard", x, 0.2, z, w, 0.3, d);
    house(x, z - d * 0.31, w * 0.89, d * 0.26, h, 0, special);
    house(
      x - w * 0.365,
      z + d * 0.035,
      d * 0.42,
      w * 0.22,
      h * 0.79,
      Math.PI / 2,
      special,
    );
    house(
      x + w * 0.365,
      z + d * 0.035,
      d * 0.42,
      w * 0.22,
      h * 0.79,
      Math.PI / 2,
      special,
    );
    house(x, z + d * 0.36, w * 0.75, d * 0.2, h * 0.78, 0, special);
    for (const side of [-1, 1]) {
      add(
        "box",
        "whiteWall",
        x + (side * w) / 2,
        h * 0.21,
        z,
        0.7,
        h * 0.42,
        d,
      );
      add(
        "box",
        "ridge",
        x + (side * w) / 2,
        h * 0.42 + 0.15,
        z,
        1,
        0.3,
        d + 0.5,
      );
      add(
        "box",
        "whiteWall",
        x + side * w * 0.38,
        h * 0.21,
        z + d / 2,
        w * 0.25,
        h * 0.42,
        0.7,
      );
    }
    if (rng() > 0.35 || special) {
      const tx = x + (rng() < 0.5 ? -1 : 1) * w * 0.13,
        tz = z + d * 0.03;
      add("box", "garden", tx, 0.38, tz, w * 0.17, 0.35, d * 0.16);
      tree(tx, tz, special ? 4.3 : 2.8 + rng() * 1.3);
    }
    if (special) {
      add("box", "gold", x, h * 0.72, z + d * 0.465, w * 0.22, 1.15, 0.25);
      for (const side of [-1, 1])
        add(
          "sphere",
          "lantern",
          x + side * w * 0.13,
          h * 0.51,
          z + d * 0.475,
          0.65,
          0.8,
          0.65,
        );
    }
  };

  const blocked = (x, z, w, d, margin = 0.5) => {
    if (
      ![
        [x - w / 2, z - d / 2],
        [x + w / 2, z - d / 2],
        [x + w / 2, z + d / 2],
        [x - w / 2, z + d / 2],
      ].every((p) => inPolygon(...p, polygon))
    )
      return true;
    return roads.some((r) =>
      r.path.some(
        (b, i) =>
          i &&
          segmentHitsBox(
            r.path[i - 1],
            b,
            x - w / 2 - r.width / 2 - margin,
            x + w / 2 + r.width / 2 + margin,
            z - d / 2 - r.width / 2 - margin,
            z + d / 2 + r.width / 2 + margin,
          ),
      ),
    );
  };
  const occupied = [];
  const overlaps = (x, z, w, d) =>
    occupied.some(
      (p) =>
        Math.abs(x - p.x) < (w + p.w) / 2 + 1.5 &&
        Math.abs(z - p.z) < (d + p.d) / 2 + 1.5,
    );

  const buildingFeatures = (map.features || []).filter(
    (f) =>
      ["Polygon", "MultiPolygon"].includes(f.geometry?.type) &&
      (f.properties?.building ||
        f.properties?.kind === "building" ||
        f.properties?.type === "building"),
  );
  if (buildingFeatures.length > 12) {
    const wallVertices = [],
      wallColors = [],
      roofVertices = [],
      roofUvs = [];
    const white = new THREE.Color();
    const appendWall = (vertices, color) => {
      wallVertices.push(...vertices);
      for (let i = 0; i < vertices.length / 3; i++)
        wallColors.push(color.r, color.g, color.b);
    };
    for (const feature of buildingFeatures) {
      const polygons =
        feature.geometry.type === "Polygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;
      for (const ringsLng of polygons) {
        const rings = ringsLng
          .map((ring) =>
            ring.slice(0, -1).map((c) => {
              const p = project(c[0], c[1]);
              return [p.x, p.z];
            }),
          )
          .filter((r) => r.length >= 3);
        if (!rings.length) continue;
        const ring = rings[0];
        const centerX = ring.reduce((sum, p) => sum + p[0], 0) / ring.length,
          centerZ = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
        if (
          centerX < bounds.minX ||
          centerX > bounds.maxX ||
          centerZ < bounds.minZ ||
          centerZ > bounds.maxZ
        )
          continue;
        let longest = 0,
          ux = 1,
          uz = 0;
        for (let i = 0; i < ring.length; i++) {
          const p = ring[i],
            q = ring[(i + 1) % ring.length],
            dx = q[0] - p[0],
            dz = q[1] - p[1],
            len = Math.hypot(dx, dz);
          if (len > longest) {
            longest = len;
            ux = dx / len;
            uz = dz / len;
          }
        }
        let vx = -uz,
          vz = ux;
        let localRings = rings.map((r) =>
          r.map((p) => [p[0] * ux + p[1] * uz, p[0] * vx + p[1] * vz]),
        );
        let allLocal = localRings.flat(),
          minU = Math.min(...allLocal.map((p) => p[0])),
          maxU = Math.max(...allLocal.map((p) => p[0])),
          minV = Math.min(...allLocal.map((p) => p[1])),
          maxV = Math.max(...allLocal.map((p) => p[1]));
        if (maxU - minU < maxV - minV) {
          const oldUx = ux,
            oldUz = uz;
          ux = vx;
          uz = vz;
          vx = -oldUx;
          vz = -oldUz;
          localRings = rings.map((r) =>
            r.map((p) => [p[0] * ux + p[1] * uz, p[0] * vx + p[1] * vz]),
          );
          allLocal = localRings.flat();
          minU = Math.min(...allLocal.map((p) => p[0]));
          maxU = Math.max(...allLocal.map((p) => p[0]));
          minV = Math.min(...allLocal.map((p) => p[1]));
          maxV = Math.max(...allLocal.map((p) => p[1]));
        }
        const bw = maxU - minU,
          bd = maxV - minV;
        if (bw < 1.5 || bd < 1.5) continue;
        const midV = (minV + maxV) / 2,
          midU = (minU + maxU) / 2;
        const named = Boolean(feature.properties?.name);
        const levels = Number(feature.properties?.["building:levels"]) || 1;
        const h = THREE.MathUtils.clamp(
          Number(feature.properties?.height) ||
            9.5 + Math.min(levels, 4) * 2 + rng() * 3,
          8,
          23,
        );
        const rh = Math.min(5.8, bd * 0.28);
        const roofY = (v) =>
          h + 0.2 + Math.max(0, 1 - Math.abs(v - midV) / (bd / 2)) * rh;
        const world = (u, v) => [u * ux + v * vx, u * uz + v * vz];
        white.set(named ? "#f5f0dc" : rng() < 0.2 ? "#dcd6c3" : "#ebe6d6");
        // Walls use the exact OSM outer and inner rings. A procedural roof pitch
        // is fitted to each footprint; heights and architectural details are illustrative.
        for (const local of localRings)
          for (let i = 0; i < local.length; i++) {
            const a = local[i],
              b = local[(i + 1) % local.length];
            const split = [a];
            if ((a[1] - midV) * (b[1] - midV) < 0) {
              const t = (midV - a[1]) / (b[1] - a[1]);
              split.push([a[0] + (b[0] - a[0]) * t, midV]);
            }
            split.push(b);
            for (let j = 1; j < split.length; j++) {
              const pa = world(...split[j - 1]),
                pb = world(...split[j]),
                ya = roofY(split[j - 1][1]),
                yb = roofY(split[j][1]);
              appendWall(
                [
                  pa[0],
                  0.25,
                  pa[1],
                  pb[0],
                  0.25,
                  pb[1],
                  pb[0],
                  yb,
                  pb[1],
                  pa[0],
                  0.25,
                  pa[1],
                  pb[0],
                  yb,
                  pb[1],
                  pa[0],
                  ya,
                  pa[1],
                ],
                white,
              );
              const length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
              if (Math.abs(ya - yb) < 0.2 && length > 2)
                add(
                  "box",
                  "ridge",
                  (pa[0] + pb[0]) / 2,
                  (ya + yb) / 2,
                  (pa[1] + pb[1]) / 2,
                  length + 0.5,
                  0.35,
                  0.6,
                  -Math.atan2(pb[1] - pa[1], pb[0] - pa[0]),
                );
            }
            const pa = world(...a),
              pb = world(...b),
              length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
            if (length > 4) {
              const angle = -Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
              add(
                "box",
                "trim",
                (pa[0] + pb[0]) / 2,
                0.65,
                (pa[1] + pb[1]) / 2,
                length,
                1.25,
                0.45,
                angle,
              );
              const winding =
                Math.sign(
                  local.reduce((sum, p, j) => {
                    const q = local[(j + 1) % local.length];
                    return sum + p[0] * q[1] - q[0] * p[1];
                  }, 0),
                ) || 1;
              const nx = ((pb[1] - pa[1]) / length) * winding,
                nz = (-(pb[0] - pa[0]) / length) * winding;
              const count = Math.min(8, Math.floor(length / 6));
              for (let j = 1; j <= count; j++) {
                const t = j / (count + 1),
                  wx = pa[0] + (pb[0] - pa[0]) * t + nx * 0.14,
                  wz = pa[1] + (pb[1] - pa[1]) * t + nz * 0.14;
                add(
                  "box",
                  "door",
                  wx,
                  h * 0.47,
                  wz,
                  1.5,
                  h * 0.26,
                  0.19,
                  angle,
                );
                add(
                  "box",
                  "timber",
                  wx,
                  h * 0.47,
                  wz,
                  0.12,
                  h * 0.27,
                  0.23,
                  angle,
                );
              }
            }
          }
        const flat = localRings.flat();
        const faces = THREE.ShapeUtils.triangulateShape(
          localRings[0].map((p) => new THREE.Vector2(...p)),
          localRings.slice(1).map((r) => r.map((p) => new THREE.Vector2(...p))),
        );
        const clip = (triangle, side) => {
          const out = [];
          for (let i = 0; i < triangle.length; i++) {
            const a = triangle[i],
              b = triangle[(i + 1) % triangle.length],
              insideA = (a[1] - midV) * side >= -0.0001,
              insideB = (b[1] - midV) * side >= -0.0001;
            if (insideA) out.push(a);
            if (insideA !== insideB) {
              const t = (midV - a[1]) / (b[1] - a[1]);
              out.push([a[0] + (b[0] - a[0]) * t, midV]);
            }
          }
          return out;
        };
        for (const face of faces)
          for (const side of [-1, 1]) {
            const vertices = clip(
              face.map((index) => flat[index]),
              side,
            );
            for (let i = 1; i < vertices.length - 1; i++)
              for (const p of [vertices[0], vertices[i], vertices[i + 1]]) {
                const wp = world(...p);
                roofVertices.push(wp[0], roofY(p[1]) + 0.09, wp[1]);
                roofUvs.push(p[0] / 9, p[1] / 13);
              }
          }
        // Only ridge portions that lie over a real roof receive a ridge cap.
        const intersections = [];
        for (const local of localRings)
          for (let i = 0; i < local.length; i++) {
            const a = local[i],
              b = local[(i + 1) % local.length];
            if ((a[1] <= midV && b[1] > midV) || (b[1] <= midV && a[1] > midV))
              intersections.push(
                a[0] + ((b[0] - a[0]) * (midV - a[1])) / (b[1] - a[1]),
              );
          }
        intersections.sort((a, b) => a - b);
        for (let i = 0; i < intersections.length - 1; i += 2) {
          const p = world((intersections[i] + intersections[i + 1]) / 2, midV);
          add(
            "box",
            "ridge",
            p[0],
            h + rh + 0.35,
            p[1],
            intersections[i + 1] - intersections[i] + 0.3,
            0.38,
            0.48,
            -Math.atan2(uz, ux),
          );
        }
        const area =
          Math.abs(
            ring.reduce((sum, p, i) => {
              const q = ring[(i + 1) % ring.length];
              return sum + p[0] * q[1] - q[0] * p[1];
            }, 0),
          ) / 2;
        if (
          area / (bw * bd) > 0.88 &&
          localRings.length === 1 &&
          bd < 31 &&
          bw < 65
        ) {
          for (const u of [minU + 0.3, maxU - 0.3]) {
            const p = world(u, midV);
            add(
              "saddle",
              "whiteWall",
              p[0],
              h,
              p[1],
              12,
              rh * 1.78,
              bd + 0.3,
              -Math.atan2(uz, ux),
            );
          }
        }
        for (const inner of localRings.slice(1)) {
          const u = inner.reduce((sum, p) => sum + p[0], 0) / inner.length,
            v = inner.reduce((sum, p) => sum + p[1], 0) / inner.length;
          const iw =
              Math.max(...inner.map((p) => p[0])) -
              Math.min(...inner.map((p) => p[0])),
            id =
              Math.max(...inner.map((p) => p[1])) -
              Math.min(...inner.map((p) => p[1]));
          if (iw > 6 && id > 6 && inPolygon(u, v, inner)) {
            const p = world(u, v);
            add(
              "box",
              "courtyard",
              p[0],
              0.12,
              p[1],
              iw * 0.72,
              0.14,
              id * 0.72,
              -Math.atan2(uz, ux),
            );
            if (iw > 12 && id > 12 && rng() > 0.52) {
              add("box", "garden", p[0], 0.23, p[1], 4, 0.32, 4);
              tree(p[0], p[1], Math.min(4.1, Math.min(iw, id) * 0.15));
            }
          }
        }
        occupied.push({
          x: centerX,
          z: centerZ,
          w:
            Math.max(...ring.map((p) => p[0])) -
            Math.min(...ring.map((p) => p[0])),
          d:
            Math.max(...ring.map((p) => p[1])) -
            Math.min(...ring.map((p) => p[1])),
        });
      }
    }
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(wallVertices, 3),
    );
    wallGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(wallColors, 3),
    );
    wallGeo.computeVertexNormals();
    materials.footprintWalls = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.94,
    });
    const wallMesh = new THREE.Mesh(wallGeo, materials.footprintWalls);
    wallMesh.castShadow = wallMesh.receiveShadow = true;
    group.add(wallMesh);
    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(roofVertices, 3),
    );
    roofGeo.setAttribute("uv", new THREE.Float32BufferAttribute(roofUvs, 2));
    roofGeo.computeVertexNormals();
    const roofMesh = new THREE.Mesh(roofGeo, materials.roof);
    roofMesh.castShadow = roofMesh.receiveShadow = true;
    group.add(roofMesh);
  } else {
    // Give named houses a richer courtyard while keeping the verified road clear.
    for (const point of points) {
      if (
        /街|巷|坊$|入口|出口/.test(point.name) &&
        !/故居|水榭|吟台|小黄楼|衣锦坊/.test(point.name)
      )
        continue;
      let spot = null;
      for (const [dx, dz] of [
        [0, 0],
        [-20, 0],
        [20, 0],
        [0, -24],
        [0, 24],
        [-28, -22],
        [28, 22],
      ]) {
        const x = point.x + dx,
          z = point.z + dz;
        if (!blocked(x, z, 37, 42) && !overlaps(x, z, 37, 42)) {
          spot = { x, z, w: 37, d: 42 };
          break;
        }
      }
      if (spot) {
        occupied.push(spot);
        courtyard(spot.x, spot.z, spot.w, spot.d, true);
      }
    }
    // Reproducible courtyard lots are fitted around the street topology. These
    // are interpretative massing rather than claims of exact building footprints.
    for (let z = bounds.minZ + 21; z < bounds.maxZ - 16; z += 38) {
      for (
        let x = bounds.minX + 20 + (Math.round(z / 38) % 2) * 3;
        x < bounds.maxX - 15;
        x += 37
      ) {
        let w = 31 + rng() * 3,
          d = 31 + rng() * 3;
        if (!blocked(x, z, w, d) && !overlaps(x, z, w, d)) {
          occupied.push({ x, z, w, d });
          courtyard(x, z, w, d);
        } else {
          // Smaller street-front houses fill narrow parcels between alleys.
          w = 17;
          d = 19;
          if (!blocked(x, z, w, d, 0.8) && !overlaps(x, z, w, d)) {
            occupied.push({ x, z, w, d });
            house(x, z, w, d, 9 + rng() * 5);
          }
        }
      }
    }
  }
  onProgress(0.72);
  // Low garden pockets and occasional old banyans soften the dense historic fabric.
  for (let z = bounds.minZ + 14; z < bounds.maxZ - 12; z += 22)
    for (let x = bounds.minX + 13; x < bounds.maxX - 12; x += 23) {
      const tx = x + (rng() - 0.5) * 21,
        tz = z + (rng() - 0.5) * 21;
      const nearest = pointRoadDistance(tx, tz, roads);
      const isPark = landscapePolygons.some(
        (p) => p.kind === "park" && inPolygon(tx, tz, p.ring),
      );
      const nearBuilding = occupied.some(
        (p) =>
          Math.abs(tx - p.x) < p.w / 2 + 21 &&
          Math.abs(tz - p.z) < p.d / 2 + 21,
      );
      if (
        inPolygon(tx, tz, polygon) &&
        (isPark || nearBuilding) &&
        !landscapePolygons.some(
          (p) => p.kind === "water" && inPolygon(tx, tz, p.ring),
        ) &&
        !overlaps(tx, tz, 7, 7) &&
        nearest.distance > nearest.width / 2 + 3.5 &&
        rng() > (isPark ? 0.18 : 0.63)
      ) {
        if (rng() > 0.6)
          add("box", "garden", tx, 0.2, tz, 5 + rng() * 3, 0.25, 5 + rng() * 3);
        tree(tx, tz, 3.1 + rng() * 2.6, rng() > 0.82);
      }
    }
  // A double row of tiny stone bollards and lanterns makes Nanhou Street legible.
  for (const road of roads.filter((r) => r.main))
    for (let i = 1; i < road.path.length; i++) {
      const a = road.path[i - 1],
        b = road.path[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      const steps = Math.floor(length / 18);
      for (let j = 1; j <= steps; j++)
        for (const side of [-1, 1]) {
          const t = j / (steps + 1),
            x = a[0] + dx * t - (dz / length) * side * (road.width / 2 - 0.7),
            z = a[1] + dz * t + (dx / length) * side * (road.width / 2 - 0.7);
          add("box", "trim", x, 0.7, z, 0.7, 1.4, 0.7);
          if (j % 3 === 0) {
            add("box", "timber", x, 2.8, z, 0.18, 5.6, 0.18);
            add("sphere", "lantern", x, 5.3, z, 0.55, 0.7, 0.55);
          }
        }
    }
  finish();
  onProgress(1);
  return {
    group,
    bounds,
    points,
    roads,
    origin: ORIGIN,
    stats: { courtyards: occupied.length, roads: roads.length },
    dispose() {
      group.traverse((object) => {
        object.geometry?.dispose();
      });
      Object.values(materials).forEach((material) => material.dispose());
      roofMap.dispose();
      pavingMap.dispose();
      scene.remove(group);
    },
  };
}
