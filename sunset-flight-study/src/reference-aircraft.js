import * as THREE from "three";
import { createCelMaterial, createOutlineMaterial } from "./cel-material.js";

const SUN_DIRECTION = [-0.65, 0.2, -0.7];
const MAIN_WING = { span: 13, chord: 2.9, sweep: -0.43, thickness: 0.082 };
const DECAL_OFFSET = 0.018;

function paint(base, lit, shadow) {
  return createCelMaterial({
    base,
    lit,
    shadow,
    lightDirection: SUN_DIRECTION,
    brushStrength: 0.012,
    edgeHighlight: 0.6,
  });
}

function palette() {
  const p = {
    ivory: paint("#ddd1bf", "#fff1c4", "#827098"),
    green: paint("#277866", "#79b791", "#273c54"),
    red: paint("#ba4053", "#ec8b70", "#623350"),
    dark: paint("#302c3e", "#655565", "#211f30"),
    leather: paint("#704638", "#b78055", "#403044"),
    skin: paint("#bd8c68", "#f5c393", "#785364"),
    glass: paint("#6a898e", "#c5dace", "#454b6c"),
    metal: paint("#81766d", "#d6b888", "#4f4560"),
    ink: createOutlineMaterial({ color: "#4b3a59", thickness: 0.012 }),
    seam: new THREE.LineBasicMaterial({
      color: "#756377",
      transparent: true,
      opacity: 0.43,
      depthWrite: false,
      toneMapped: false,
    }),
  };
  // Insignia are skin decals, not thick stacked discs. Separate paint instances
  // keep polygon offset from changing the solid aircraft surfaces.
  p.decals = [p.green, p.ivory, p.red].map((material) => {
    const decal = material.clone();
    decal.polygonOffset = true;
    decal.polygonOffsetFactor = -1;
    decal.polygonOffsetUnits = -1;
    decal.side = THREE.DoubleSide;
    return decal;
  });
  return p;
}

function mesh(
  parent,
  name,
  geometry,
  material,
  position = [0, 0, 0],
  scale = [1, 1, 1],
) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  object.scale.set(...scale);
  parent.add(object);
  return object;
}

function outline(object, material) {
  const shell = mesh(
    object,
    `${object.name}-outline`,
    object.geometry,
    material,
  );
  shell.userData.isAircraftOutline = true;
  shell.castShadow = false;
}

function makeGeometry(vertices, indices, groups) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  if (groups) {
    let offset = 0;
    for (const [material, count] of groups) {
      geometry.addGroup(offset, count, material);
      offset += count;
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// All rings use shared seam indices and single-vertex end poles. This gives the
// painted surface and its inverted-hull outline one closed, watertight topology.
function closedLoft(rings, poles, sides, materialForInterval = () => 0) {
  const vertices = rings.flat();
  const batches = [[], []];
  for (let row = 0; row < rings.length - 1; row++) {
    const indices = batches[materialForInterval(row)];
    for (let side = 0; side < sides; side++) {
      const a = row * sides + side;
      const next = row * sides + ((side + 1) % sides);
      const b = a + sides;
      indices.push(a, b, next, b, next + sides, next);
    }
  }
  for (let end = 0; end < 2; end++) {
    const pole = vertices.length / 3;
    vertices.push(...poles[end]);
    const row = end === 0 ? 0 : rings.length - 1;
    const indices =
      batches[materialForInterval(end === 0 ? 0 : rings.length - 2)];
    for (let side = 0; side < sides; side++) {
      const a = row * sides + side;
      const b = row * sides + ((side + 1) % sides);
      if (end === 0) indices.push(pole, a, b);
      else indices.push(pole, b, a);
    }
  }
  return makeGeometry(
    vertices,
    batches.flat(),
    batches[1].length
      ? [
          [0, batches[0].length],
          [1, batches[1].length],
        ]
      : undefined,
  );
}

function wingSection(x, spec) {
  const fraction = Math.abs(x) / (spec.span / 2);
  return {
    chord: spec.chord * Math.sqrt(Math.max(0, 1 - fraction * fraction)),
    sweep: spec.sweep * fraction * fraction,
    rise: 0.035 * fraction * fraction,
  };
}

function airfoilY(u, chord, thickness, upper = true) {
  const t =
    5 *
    thickness *
    chord *
    (0.2969 * Math.sqrt(u) -
      0.126 * u -
      0.3516 * u ** 2 +
      0.2843 * u ** 3 -
      0.1036 * u ** 4);
  return Math.sin(Math.PI * u) * chord * 0.012 + (upper ? t : -t);
}

function wingGeometry(spec, paintedTips = false) {
  const rings = [];
  const rows = 52;
  const sides = 36;
  const spanPositions = [];
  for (let row = 1; row < rows; row++) {
    const x = (-Math.cos((row / rows) * Math.PI) * spec.span) / 2;
    spanPositions.push(x);
    const section = wingSection(x, spec);
    const ring = [];
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const u = (1 - Math.cos(angle)) / 2;
      ring.push(
        x,
        section.rise +
          airfoilY(u, section.chord, spec.thickness, side <= sides / 2),
        section.sweep + (0.5 - u) * section.chord,
      );
    }
    rings.push(ring);
  }
  return closedLoft(
    rings,
    [
      [-spec.span / 2, 0.035, spec.sweep],
      [spec.span / 2, 0.035, spec.sweep],
    ],
    sides,
    (row) =>
      paintedTips &&
      Math.abs((spanPositions[row] + spanPositions[row + 1]) / 2) >
        spec.span * 0.455
        ? 1
        : 0,
  );
}

function fuselageGeometry() {
  // Smooth radius stations follow the reference's long engine cover and pencil
  // tail, without the flat underside or keel of the previous flying boat.
  const profile = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-4.87, 0.055, 0.13),
      new THREE.Vector3(-4.35, 0.18, 0.1),
      new THREE.Vector3(-3.3, 0.31, 0.06),
      new THREE.Vector3(-1.6, 0.49, 0.03),
      new THREE.Vector3(0.35, 0.61, 0),
      new THREE.Vector3(1.85, 0.6, 0),
      new THREE.Vector3(3.3, 0.51, 0),
      new THREE.Vector3(4.18, 0.405, 0),
      new THREE.Vector3(4.39, 0.33, 0),
    ],
    false,
    "centripetal",
  );
  const rings = profile.getPoints(68).map((point) => {
    const ring = [];
    for (let side = 0; side < 36; side++) {
      const angle = (side / 36) * Math.PI * 2;
      ring.push(
        Math.sin(angle) * point.y,
        Math.cos(angle) * point.y * 0.97 + point.z,
        point.x,
      );
    }
    return ring;
  });
  return closedLoft(
    rings,
    [
      [0, 0.13, -4.94],
      [0, 0, 4.4],
    ],
    36,
  );
}

function roundelGeometry(centerX, top) {
  const vertices = [];
  const indices = [];
  const groups = [];
  const radii = [
    [0.43, 0.64],
    [0.255, 0.43],
    [0, 0.255],
  ];
  const side = top ? 1 : -1;
  const vertex = (radius, angle) => {
    const x = centerX + Math.cos(angle) * radius;
    const z = -0.12 + Math.sin(angle) * radius;
    const section = wingSection(x, MAIN_WING);
    const u = 0.5 - (z - section.sweep) / section.chord;
    return [
      x,
      section.rise +
        airfoilY(u, section.chord, MAIN_WING.thickness, top) +
        DECAL_OFFSET * side,
      z,
    ];
  };
  radii.forEach(([inner, outer], band) => {
    const start = vertices.length / 3;
    const firstIndex = indices.length;
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      vertices.push(...vertex(outer, angle));
      if (inner > 0) vertices.push(...vertex(inner, angle));
    }
    if (inner === 0) {
      const center = vertices.length / 3;
      vertices.push(...vertex(0, 0));
      for (let i = 0; i < 48; i++)
        indices.push(center, start + ((i + 1) % 48), start + i);
    } else {
      for (let i = 0; i < 48; i++) {
        const a = start + i * 2;
        const b = start + ((i + 1) % 48) * 2;
        indices.push(a, b + 1, b, a, a + 1, b + 1);
      }
    }
    groups.push([band, indices.length - firstIndex]);
  });
  if (!top) {
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  }
  return makeGeometry(vertices, indices, groups);
}

function lines(parent, segments, material, name) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    segments.flatMap((points) =>
      points.map((point) => new THREE.Vector3(...point)),
    ),
  );
  const object = new THREE.LineSegments(geometry, material);
  object.name = name;
  parent.add(object);
  return object;
}

function wingDetails(wing, p) {
  for (const side of [-1, 1]) {
    for (const top of [true, false]) {
      const roundel = mesh(
        wing,
        `wing-roundel-${side < 0 ? "left" : "right"}-${top ? "top" : "bottom"}`,
        roundelGeometry(side * 4.7, top),
        p.decals,
      );
      roundel.userData.roundel = true;
      roundel.userData.surfaceOffset = DECAL_OFFSET;
      roundel.renderOrder = 1;
    }
  }
  const segments = [];
  const onWing = (x, u) => {
    const section = wingSection(x, MAIN_WING);
    return [
      x,
      section.rise + airfoilY(u, section.chord, MAIN_WING.thickness) + 0.009,
      (0.5 - u) * section.chord + section.sweep,
    ];
  };
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const x = sign * (2.1 + (i / 26) * 3.7);
      const nextX = sign * (2.1 + ((i + 1) / 26) * 3.7);
      segments.push([onWing(x, 0.79), onWing(nextX, 0.79)]);
    }
    for (const x of [1.3, 2.9, 5.7]) {
      for (let i = 0; i < 16; i++)
        segments.push([
          onWing(sign * x, 0.1 + (i / 16) * 0.82),
          onWing(sign * x, 0.1 + ((i + 1) / 16) * 0.82),
        ]);
    }
  }
  lines(wing, segments, p.seam, "wing-panel-lines");
}

const FIN_POLYGON = [
  [3.22, 0.17],
  [3.65, 0.56],
  [4.12, 1.72],
  [4.36, 1.77],
  [4.77, 1.18],
  [4.94, 0.17],
];

function clipPolygon(polygon, limit, keepGreater) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const insideA = keepGreater ? a[0] >= limit : a[0] <= limit;
    const insideB = keepGreater ? b[0] >= limit : b[0] <= limit;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const t = (limit - a[0]) / (b[0] - a[0]);
      result.push([limit, THREE.MathUtils.lerp(a[1], b[1], t)]);
    }
  }
  return result;
}

function fin(parent, p) {
  const shape = new THREE.Shape(
    FIN_POLYGON.map((point) => new THREE.Vector2(...point)),
  );
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSize: 0.022,
    bevelThickness: 0.015,
    bevelSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -0.05);
  geometry.rotateY(Math.PI / 2);
  const finMesh = mesh(parent, "tail-fin", geometry, p.ivory);
  outline(finMesh, p.ink);
  const ranges = [
    [3.2, 4.03],
    [4.03, 4.46],
    [4.46, 5],
  ];
  ranges.forEach(([min, max], color) => {
    const polygon = clipPolygon(
      clipPolygon(FIN_POLYGON, min, true),
      max,
      false,
    );
    for (const side of [-1, 1]) {
      const stripe = new THREE.ShapeGeometry(
        new THREE.Shape(polygon.map((point) => new THREE.Vector2(...point))),
      );
      stripe.rotateY(Math.PI / 2);
      if (side < 0) {
        const indices = stripe.index.array;
        for (let i = 0; i < indices.length; i += 3)
          [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        stripe.computeVertexNormals();
      }
      mesh(
        finMesh,
        `tail-stripe-${["green", "ivory", "red"][color]}`,
        stripe,
        p.decals[color],
        [side * 0.068, 0, 0],
      );
    }
  });
}

function cockpit(parent, p, sphere) {
  const group = new THREE.Group();
  group.name = "cockpit";
  group.position.set(0, 0.53, -0.6);
  parent.add(group);
  mesh(
    group,
    "cockpit-opening",
    sphere,
    p.dark,
    [0, 0.015, 0],
    [0.385, 0.072, 0.65],
  );
  const coaming = mesh(
    group,
    "cockpit-coaming",
    new THREE.TorusGeometry(0.46, 0.035, 8, 40),
    p.leather,
    [0, 0.035, 0],
    [0.84, 1.41, 1],
  );
  coaming.rotation.x = Math.PI / 2;
  outline(coaming, p.ink);
  mesh(
    group,
    "seat-back",
    sphere,
    p.leather,
    [0, 0.08, -0.37],
    [0.27, 0.2, 0.13],
  );
  const pilot = new THREE.Group();
  pilot.name = "pilot";
  pilot.position.set(0, 0.06, -0.1);
  group.add(pilot);
  mesh(
    pilot,
    "pilot-jacket",
    sphere,
    p.leather,
    [0, 0.08, 0],
    [0.21, 0.23, 0.18],
  );
  const head = mesh(
    pilot,
    "pilot-head",
    sphere,
    p.skin,
    [0, 0.36, 0.06],
    [0.18, 0.19, 0.18],
  );
  outline(head, p.ink);
  mesh(
    pilot,
    "pilot-cap",
    sphere,
    p.leather,
    [0, 0.46, 0.015],
    [0.185, 0.12, 0.18],
  );
  for (const sign of [-1, 1]) {
    mesh(
      pilot,
      "pilot-goggles",
      sphere,
      p.dark,
      [sign * 0.082, 0.38, 0.215],
      [0.072, 0.049, 0.022],
    );
    mesh(
      pilot,
      "goggle-lens",
      sphere,
      p.glass,
      [sign * 0.082, 0.39, 0.231],
      [0.045, 0.022, 0.008],
    );
  }
  const windshield = mesh(
    group,
    "windshield",
    new THREE.SphereGeometry(1, 24, 12, 0, Math.PI, 0, Math.PI / 2),
    p.glass,
    [0, 0.035, 0.44],
    [0.3, 0.26, 0.26],
  );
  windshield.material.side = THREE.DoubleSide;
  const arch = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI;
    const b = ((i + 1) / 24) * Math.PI;
    arch.push([
      [Math.cos(a) * 0.3, 0.035 + Math.sin(a) * 0.26, 0.44],
      [Math.cos(b) * 0.3, 0.035 + Math.sin(b) * 0.26, 0.44],
    ]);
  }
  lines(group, arch, p.seam, "windshield-frame");
}

function propeller(parent, p, sphere) {
  const group = new THREE.Group();
  group.name = "propeller";
  group.position.set(0, 0, 4.47);
  parent.add(group);
  for (const side of [-1, 1]) {
    const blade = mesh(
      group,
      `propeller-blade-${side}`,
      sphere,
      p.dark,
      [side * 0.82, side * 0.075, 0],
      [0.87, 0.105, 0.042],
    );
    blade.rotation.z = -0.11;
    mesh(
      group,
      "propeller-tip",
      sphere,
      p.metal,
      [side * 1.54, side * -0.005, 0.003],
      [0.12, 0.072, 0.044],
    );
  }
  const spinner = mesh(
    group,
    "spinner",
    sphere,
    p.ivory,
    [0, 0, 0.19],
    [0.355, 0.355, 0.52],
  );
  outline(spinner, p.ink);
  return group;
}

/** A reference-video-inspired single-seat fighter; +Z nose, +Y up. */
export function createReferenceAircraft() {
  const plane = new THREE.Group();
  plane.name = "sunset-reference-aircraft";
  plane.userData.type = "reference";
  const p = palette();
  // Per-aircraft sharing avoids a new tessellated sphere for every tiny detail,
  // while keeping disposal independent of other aircraft instances.
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const fuselage = mesh(plane, "fuselage", fuselageGeometry(), p.ivory);
  outline(fuselage, p.ink);
  const wing = mesh(
    plane,
    "main-wing",
    wingGeometry(MAIN_WING, true),
    [p.ivory, p.green],
    [0, -0.18, 0.55],
  );
  outline(wing, p.ink);
  wingDetails(wing, p);
  const tailplane = mesh(
    plane,
    "tailplane",
    wingGeometry({ span: 4.65, chord: 1.55, sweep: -0.17, thickness: 0.085 }),
    p.ivory,
    [0, 0.17, -3.95],
  );
  outline(tailplane, p.ink);
  fin(plane, p);
  cockpit(plane, p, sphere);
  plane.userData.propeller = propeller(plane, p, sphere);
  const cowlingSeams = [];
  for (const z of [2.9, 4.07]) {
    const radius = z > 4 ? 0.422 : 0.55;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const b = ((i + 1) / 48) * Math.PI * 2;
      cowlingSeams.push([
        [Math.sin(a) * radius, Math.cos(a) * radius * 0.97, z],
        [Math.sin(b) * radius, Math.cos(b) * radius * 0.97, z],
      ]);
    }
  }
  lines(plane, cowlingSeams, p.seam, "cowling-panel-lines");
  const exhaustGeometry = new THREE.CylinderGeometry(0.045, 0.055, 0.19, 8);
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const pipe = mesh(plane, "engine-exhaust", exhaustGeometry, p.dark, [
        sign * 0.54,
        -0.04,
        1.95 + i * 0.27,
      ]);
      pipe.rotation.z = (sign * Math.PI) / 2;
      pipe.rotation.y = -sign * 0.22;
    }
  }
  plane.userData.wingTips = [
    new THREE.Vector3(-6.43, -0.145, 0.13),
    new THREE.Vector3(6.43, -0.145, 0.13),
  ];
  return plane;
}
