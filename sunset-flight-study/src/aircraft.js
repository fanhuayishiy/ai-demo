import * as THREE from "three";
import { createCelMaterial, createOutlineMaterial } from './cel-material.js';

// Both craft face +Z. All geometry is generated without image or DOM dependencies.
const UP = new THREE.Vector3(0, 1, 0);

function palette(type) {
  const toon = (base, lit, shadow, edgeHighlight = 0.23) =>
    createCelMaterial({ base, lit, shadow, edgeHighlight });
  const red = type === 'red';
  return {
    body: red ? toon('#ce362f', '#e64936', '#73333c') : toon('#28475d', '#537487', '#263646'),
    highlight: red ? toon('#d83c2f', '#eb523c', '#863742') : toon('#36566a', '#648596', '#293947'),
    underside: red ? toon('#9c3435', '#c24739', '#603039') : toon('#263c4d', '#47677c', '#223242'),
    cream: toon('#d8cfaf', '#f1e4c4', '#8b9691'),
    metal: toon('#485157', '#7c898a', '#2e3d47'),
    brass: toon('#b68e58', '#dcc083', '#6c6555'),
    wood: toon('#99603e', '#c68c54', '#624249'),
    woodLight: toon('#c0925c', '#dfb474', '#78614f'),
    dark: toon('#283039', '#414c54', '#232836', 0),
    leather: toon('#764936', '#a46a48', '#4f3940'),
    skin: toon('#d4a080', '#e9bb90', '#976d68'),
    scarf: toon('#e4d9bd', '#f5e9ce', '#9ba3a1'),
    green: toon('#387557', '#55956a', '#305453'),
    white: toon('#e4ddc8', '#f6ecd1', '#9faeaa'),
    glass: new THREE.MeshBasicMaterial({
      color: "#b8e0df",
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    seam: new THREE.LineBasicMaterial({
      color: type === "red" ? "#7e342c" : "#142e40",
      transparent: true,
      opacity: 0.43,
    }),
    wire: new THREE.LineBasicMaterial({
      color: "#544e43",
      transparent: true,
      opacity: 0.65,
    }),
    outline: createOutlineMaterial({ color: red ? '#63333c' : '#293e4a' }),
    lightOutline: createOutlineMaterial({ color: '#6e7066', thickness: 0.019 }),
  };
}

function addSilhouetteOutlines(group, p) {
  const majorForms = new Set([
    'hull', 'upper-wing', 'lower-wing', 'tailplane', 'bow-deck',
    'engine-nacelle', 'engine-front-cowling', 'radial-engine-cowling',
    'leather-coaming', 'wingtip-float-left', 'wingtip-float-right',
    'float-left', 'float-right', 'rudder-red', 'rudder-white',
    'rudder-green', 'navy-rudder',
  ]);
  const forms = [];
  group.traverse(object => {
    if (object.isMesh && majorForms.has(object.name)) forms.push(object);
  });
  for (const form of forms) {
    const material = Array.isArray(form.material) ? form.material[0] : form.material;
    const outline = new THREE.Mesh(form.geometry, material === p.cream || material === p.white ? p.lightOutline : p.outline);
    outline.name = `${form.name}-silhouette`;
    outline.userData.isAircraftOutline = true;
    outline.renderOrder = 1;
    outline.raycast = () => {};
    form.add(outline);
  }
}

function mesh(parent, name, geometry, material, position = [0, 0, 0], scale) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  if (scale) object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function ellipsoid(parent, name, material, position, scale) {
  return mesh(
    parent,
    name,
    new THREE.SphereGeometry(1, 24, 16),
    material,
    position,
    scale,
  );
}

function rod(parent, a, b, radius, material, name = "strut") {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const object = mesh(
    parent,
    name,
    new THREE.CylinderGeometry(radius, radius, direction.length(), 7),
    material,
  );
  object.position.copy(start.add(end).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(UP, direction.normalize());
  return object;
}

function line(parent, points, material, name = "panel-seam") {
  const object = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(...p)),
    ),
    material,
  );
  object.name = name;
  parent.add(object);
  return object;
}

// Smoothly lofted transverse hull sections: [longitudinal Z, width, height, center Y].
function hullGeometry(stations, rings = 64, radialSegments = 28) {
  const vertices = [];
  const materialIndices = [[], []];
  // Continuous, monotonic Hermite slopes avoid the repeated flat shoulders of
  // per-section smoothstep interpolation, especially along the tapered bow.
  const slopes = stations.map((station, index) => [1, 2, 3].map(axis => {
    const previous = stations[Math.max(0, index - 1)];
    const next = stations[Math.min(stations.length - 1, index + 1)];
    const before = index === 0 ? (next[axis] - station[axis]) / (next[0] - station[0])
      : (station[axis] - previous[axis]) / (station[0] - previous[0]);
    const after = index === stations.length - 1 ? before
      : (next[axis] - station[axis]) / (next[0] - station[0]);
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  }));
  for (let ring = 0; ring <= rings; ring++) {
    const z = THREE.MathUtils.lerp(
      stations[0][0],
      stations.at(-1)[0],
      ring / rings,
    );
    let section = 0;
    while (section < stations.length - 2 && z > stations[section + 1][0])
      section++;
    const a = stations[section];
    const b = stations[section + 1];
    const length = b[0] - a[0];
    const t = (z - a[0]) / length;
    const interpolate = axis => (2 * t ** 3 - 3 * t ** 2 + 1) * a[axis]
      + (t ** 3 - 2 * t ** 2 + t) * length * slopes[section][axis - 1]
      + (-2 * t ** 3 + 3 * t ** 2) * b[axis]
      + (t ** 3 - t ** 2) * length * slopes[section + 1][axis - 1];
    const width = interpolate(1);
    const height = interpolate(2);
    const cy = interpolate(3);
    for (let radial = 0; radial <= radialSegments; radial++) {
      const angle = (radial / radialSegments) * Math.PI * 2;
      const upper = Math.cos(angle);
      // A slightly V-shaped keel gives the red hull and floats their boat character.
      const keel = upper < 0 ? 0.82 + 0.18 * (1 + upper) : 1;
      vertices.push(Math.sin(angle) * width * keel, cy + upper * height, z);
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let radial = 0; radial < radialSegments; radial++) {
      const a = ring * (radialSegments + 1) + radial;
      const b = a + radialSegments + 1;
      const materialIndex =
        Math.cos(((radial + 0.5) / radialSegments) * Math.PI * 2) < -0.33
          ? 1
          : 0;
      materialIndices[materialIndex].push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex([...materialIndices[0], ...materialIndices[1]]);
  geometry.addGroup(0, materialIndices[0].length, 0);
  geometry.addGroup(materialIndices[0].length, materialIndices[1].length, 1);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const average = new THREE.Vector3();
  const seamEnd = new THREE.Vector3();
  for (let ring = 0; ring <= rings; ring++) {
    const start = ring * (radialSegments + 1);
    const end = start + radialSegments;
    average.fromBufferAttribute(normals, start);
    seamEnd.fromBufferAttribute(normals, end);
    average.add(seamEnd).normalize();
    normals.setXYZ(start, average.x, average.y, average.z);
    normals.setXYZ(end, average.x, average.y, average.z);
  }
  return geometry;
}

function wingSection(x, span, chord) {
  const fraction = Math.abs(x) / (span / 2);
  const tip =
    fraction < 0.87
      ? 1
      : Math.sqrt(Math.max(0.00003, 1 - ((fraction - 0.87) / 0.13) ** 2));
  return {
    chord: chord * (1 - fraction * 0.09) * tip,
    sweep: -fraction * fraction * 0.24,
  };
}

function airfoilY(u, chord, upper = true) {
  const thickness =
    5 *
    0.11 *
    chord *
    (0.2969 * Math.sqrt(u) -
      0.126 * u -
      0.3516 * u ** 2 +
      0.2843 * u ** 3 -
      0.1036 * u ** 4);
  return (
    Math.sin(Math.PI * u) * chord * 0.021 + (upper ? thickness : -thickness)
  );
}

function wing(parent, name, span, chord, position, material, p, ribs = true) {
  const rows = 72;
  const sides = 32;
  const vertices = [];
  const indices = [];
  for (let row = 0; row <= rows; row++) {
    const x = (row / rows - 0.5) * span;
    const section = wingSection(x, span, chord);
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const u = (1 - Math.cos(angle)) / 2;
      vertices.push(
        x,
        airfoilY(u, section.chord, side < sides / 2),
        (0.5 - u) * section.chord + section.sweep,
      );
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let side = 0; side < sides; side++) {
      const a = row * sides + side;
      const next = row * sides + (side + 1) % sides;
      const b = a + sides;
      indices.push(a, b, next, b, next + sides, next);
    }
  }
  for (const end of [0, rows]) {
    const center = vertices.length / 3;
    const x = (end / rows - 0.5) * span;
    vertices.push(x, 0, wingSection(x, span, chord).sweep);
    for (let side = 0; side < sides; side++) {
      const a = end * sides + side;
      const b = end * sides + (side + 1) % sides;
      if (end === 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const object = mesh(parent, name, geometry, material, position);
  if (ribs) {
    for (let x = -span / 2 + 0.65; x < span / 2 - 0.35; x += 0.64) {
      const section = wingSection(x, span, chord);
      const points = [];
      for (let i = 0; i <= 20; i++) {
        const u = 0.035 + (i / 20) * 0.93;
        points.push([
          x,
          airfoilY(u, section.chord) + 0.009,
          (0.5 - u) * section.chord + section.sweep,
        ]);
      }
      line(object, points, p.seam, "fabric-rib");
    }
    for (const sign of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 30; i++) {
        const x = sign * (span * 0.24 + (i / 30) * span * 0.21);
        const section = wingSection(x, span, chord);
        points.push([
          x,
          airfoilY(0.78, section.chord) + 0.012,
          -0.28 * section.chord + section.sweep,
        ]);
      }
      line(object, points, p.seam, "aileron-hinge");
    }
  }
  return object;
}

function propeller(parent, p, position, radius = 1.45) {
  const group = new THREE.Group();
  group.name = "propeller";
  group.position.set(...position);
  parent.add(group);
  for (const sign of [-1, 1]) {
    const blade = ellipsoid(
      group,
      "wood-propeller-blade",
      p.woodLight,
      [sign * radius * 0.5, sign * 0.06, 0],
      [radius * 0.56, 0.14, 0.062],
    );
    blade.rotation.z = -0.13;
    ellipsoid(
      group,
      "propeller-dark-tip",
      p.wood,
      [sign * radius * 0.9, sign * -0.03, 0.003],
      [radius * 0.1, 0.095, 0.064],
    );
  }
  ellipsoid(group, "propeller-hub", p.brass, [0, 0, 0.045], [0.18, 0.18, 0.13]);
  return group;
}

function cockpit(parent, p, { y, z, pig = false }) {
  const group = new THREE.Group();
  group.name = "cockpit";
  group.position.set(0, y, z);
  parent.add(group);
  ellipsoid(group, "cockpit-opening", p.dark, [0, 0, 0], [0.59, 0.09, 0.88]);
  const coaming = mesh(
    group,
    "leather-coaming",
    new THREE.TorusGeometry(0.63, 0.065, 8, 48),
    p.leather,
    [0, 0.045, 0],
    [0.87, 1.26, 1],
  );
  coaming.rotation.x = Math.PI / 2;
  ellipsoid(
    group,
    "pilot-seat",
    p.leather,
    [0, 0.09, -0.36],
    [0.35, 0.24, 0.17],
  );
  const pilot = new THREE.Group();
  pilot.name = "pilot";
  pilot.position.set(0, 0.12, -0.12);
  group.add(pilot);
  ellipsoid(pilot, "pilot-jacket", p.leather, [0, 0.15, 0], [0.28, 0.3, 0.22]);
  ellipsoid(pilot, "pilot-head", p.skin, [0, 0.49, 0.035], [0.24, 0.255, 0.23]);
  ellipsoid(
    pilot,
    "flying-cap",
    pig ? p.scarf : p.leather,
    [0, 0.64, 0.005],
    [0.247, 0.15, 0.235],
  );
  if (pig)
    ellipsoid(
      pilot,
      "pilot-snout",
      p.skin,
      [0, 0.44, 0.255],
      [0.14, 0.088, 0.078],
    );
  for (const side of [-1, 1]) {
    ellipsoid(
      pilot,
      "aviator-goggles",
      p.dark,
      [side * 0.115, 0.52, 0.231],
      [0.106, 0.073, 0.033],
    );
    ellipsoid(
      pilot,
      "goggle-highlight",
      p.glass,
      [side * 0.115, 0.534, 0.253],
      [0.061, 0.025, 0.012],
    );
  }
  rod(
    pilot,
    [-0.25, 0.22, 0.02],
    [-0.18, 0.06, 0.36],
    0.075,
    p.leather,
    "pilot-arm",
  );
  rod(
    pilot,
    [0.25, 0.22, 0.02],
    [0.18, 0.06, 0.36],
    0.075,
    p.leather,
    "pilot-arm",
  );
  const scarfCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.29, -0.16),
    new THREE.Vector3(-0.36, 0.3, -0.5),
    new THREE.Vector3(-0.23, 0.4, -0.92),
    new THREE.Vector3(-0.38, 0.36, -1.16),
  ]);
  mesh(
    pilot,
    "flowing-scarf",
    new THREE.TubeGeometry(scarfCurve, 14, 0.068, 5, false),
    p.scarf,
  );
  const shield = mesh(
    group,
    "windshield",
    new THREE.SphereGeometry(1, 24, 12, 0, Math.PI, 0, Math.PI / 2),
    p.glass,
    [0, 0.07, 0.62],
    [0.53, 0.43, 0.4],
  );
  shield.rotation.y = 0;
  const arch = [];
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI;
    arch.push([Math.cos(angle) * 0.53, 0.07 + Math.sin(angle) * 0.43, 0.62]);
  }
  line(group, arch, p.wire, "windshield-frame");
}

function finGeometry(zStart, zEnd, zMin, zMax, baseY, height) {
  const shape = new THREE.Shape();
  const top = (z) =>
    baseY +
    0.12 +
    height *
      Math.pow(
        Math.max(0, Math.sin((Math.PI * (z - zMin)) / (zMax - zMin))),
        0.66,
      );
  shape.moveTo(zStart, baseY);
  shape.lineTo(zEnd, baseY);
  for (let i = 20; i >= 0; i--) {
    const z = THREE.MathUtils.lerp(zStart, zEnd, i / 20);
    shape.lineTo(z, top(z));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.028,
    bevelThickness: 0.025,
  });
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const longitudinal = positions.getX(i);
    positions.setXYZ(
      i,
      positions.getZ(i) - 0.06,
      positions.getY(i),
      longitudinal,
    );
  }
  // Mapping from shape XY to the aircraft YZ plane reverses handedness.
  const positionArray = positions.array;
  for (let i = 0; i < positions.count; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      const temporary = positionArray[(i + 1) * 3 + axis];
      positionArray[(i + 1) * 3 + axis] = positionArray[(i + 2) * 3 + axis];
      positionArray[(i + 2) * 3 + axis] = temporary;
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function tail(parent, p, red) {
  wing(
    parent,
    "tailplane",
    red ? 5.15 : 4.7,
    1.38,
    [0, 0.75, -4.57],
    red ? p.body : p.cream,
    p,
    false,
  );
  const rudder = new THREE.Group();
  rudder.name = "rudder";
  parent.add(rudder);
  const start = -5.68;
  const end = -3.9;
  if (red) {
    [p.body, p.white, p.green].forEach((material, i) => {
      mesh(
        rudder,
        ["rudder-red", "rudder-white", "rudder-green"][i],
        finGeometry(
          start + (i * (end - start)) / 3,
          start + ((i + 1) * (end - start)) / 3,
          start,
          end,
          0.74,
          1.78,
        ),
        material,
      );
    });
  } else {
    mesh(
      rudder,
      "navy-rudder",
      finGeometry(start, end, start, end, 0.74, 1.78),
      p.body,
    );
    ellipsoid(
      rudder,
      "rudder-roundel-ivory",
      p.cream,
      [0.095, 1.53, -4.68],
      [0.014, 0.31, 0.31],
    );
    ellipsoid(
      rudder,
      "rudder-roundel-gold",
      p.brass,
      [0.111, 1.53, -4.68],
      [0.008, 0.16, 0.16],
    );
    ellipsoid(
      rudder,
      "rudder-roundel-ivory-port",
      p.cream,
      [-0.095, 1.53, -4.68],
      [0.014, 0.31, 0.31],
    );
  }
  for (const side of [-1, 1]) {
    rod(
      parent,
      [side * 0.16, 0.22, -4.14],
      [side * 2.04, 0.7, -4.63],
      0.027,
      p.metal,
      "tail-brace",
    );
  }
}

function redCraft(group, p) {
  mesh(
    group,
    "hull",
    hullGeometry([
      [-5.8, 0.025, 0.03, 0.76],
      [-4.6, 0.3, 0.3, 0.55],
      [-3.4, 0.57, 0.47, 0.36],
      [-1.5, 0.82, 0.7, 0.16],
      [0.8, 0.91, 0.88, 0.07],
      [3.15, 0.77, 0.8, 0.13],
      [4.8, 0.41, 0.55, 0.31],
      [5.72, 0.015, 0.035, 0.59],
    ]),
    [p.body, p.underside],
  );
  // Narrow cream waterline and small raised nose decking.
  for (const sign of [-1, 1]) {
    line(
      group,
      [
        [sign * 0.12, 0.53, 5.45],
        [sign * 0.54, 0.15, 4.3],
        [sign * 0.79, -0.04, 2.3],
        [sign * 0.83, -0.07, 0.2],
        [sign * 0.68, 0.04, -2.3],
        [sign * 0.25, 0.43, -4.7],
      ],
      p.seam,
      "hull-waterline",
    );
  }
  ellipsoid(
    group,
    "bow-deck",
    p.highlight,
    [0, 0.64, 3.35],
    [0.56, 0.26, 1.55],
  );
  wing(group, "upper-wing", 16.4, 3.08, [0, 2.07, 0.61], p.body, p);
  for (const sign of [-1, 1]) {
    rod(
      group,
      [sign * 0.56, 0.59, 1.03],
      [sign * 3.9, 1.94, 1.48],
      0.059,
      p.cream,
      "main-wing-strut",
    );
    rod(
      group,
      [sign * 0.54, 0.58, -0.05],
      [sign * 3.9, 1.99, -0.24],
      0.048,
      p.cream,
      "rear-wing-strut",
    );
    rod(
      group,
      [sign * 0.62, 0.61, 0.43],
      [sign * 1.17, 2.02, 0.49],
      0.061,
      p.body,
      "wing-cabane",
    );
    const float = mesh(
      group,
      sign < 0 ? "wingtip-float-left" : "wingtip-float-right",
      hullGeometry(
        [
          [-1.08, 0.025, 0.03, 0.09],
          [-0.5, 0.22, 0.21, 0],
          [0.5, 0.24, 0.25, 0],
          [1.25, 0.015, 0.025, 0.16],
        ],
        24,
        16,
      ),
      [p.body, p.underside],
      [sign * 6.75, -0.14, 0.29],
    );
    for (const z of [-0.2, 0.94])
      rod(
        group,
        [sign * 6.75, 0.09, z],
        [sign * 6.75, 2.02, z],
        0.039,
        p.cream,
        "float-strut",
      );
    float.userData.component = "stabilizing-float";
  }
  const engine = new THREE.Group();
  engine.name = "engine";
  engine.position.set(0, 3.08, 0.5);
  group.add(engine);
  ellipsoid(engine, "engine-nacelle", p.body, [0, 0, 0], [0.49, 0.48, 1.39]);
  ellipsoid(
    engine,
    "engine-front-cowling",
    p.cream,
    [0, 0.015, 1.14],
    [0.46, 0.43, 0.26],
  );
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const cylinder = mesh(
        engine,
        "engine-cylinder",
        new THREE.CylinderGeometry(0.093, 0.12, 0.25, 10),
        p.metal,
        [sign * 0.45, 0.025, 0.7 - i * 0.28],
      );
      cylinder.rotation.z = (sign * Math.PI) / 3;
    }
    rod(
      group,
      [sign * 0.82, 2.18, 1.37],
      [sign * 0.29, 2.92, 1.19],
      0.045,
      p.metal,
      "engine-mount",
    );
    rod(
      group,
      [sign * 0.7, 2.17, -0.45],
      [sign * 0.28, 2.87, -0.32],
      0.04,
      p.metal,
      "engine-mount",
    );
    rod(
      engine,
      [sign * 0.41, -0.13, 0.68],
      [sign * 0.47, -0.23, -1.03],
      0.04,
      p.metal,
      "exhaust",
    );
  }
  group.userData.propeller = propeller(group, p, [0, 3.1, 2.05], 1.51);
  cockpit(group, p, { y: 0.95, z: -1.93, pig: true });
  tail(group, p, true);
  group.userData.wingTips = [
    new THREE.Vector3(-8.08, 2.09, 0.37),
    new THREE.Vector3(8.08, 2.09, 0.37),
  ];
}

function blueCraft(group, p) {
  mesh(
    group,
    "hull",
    hullGeometry([
      [-5.74, 0.025, 0.03, 0.65],
      [-4.3, 0.27, 0.31, 0.58],
      [-2.4, 0.56, 0.5, 0.51],
      [-0.8, 0.78, 0.74, 0.45],
      [1.9, 0.81, 0.8, 0.41],
      [3.85, 0.6, 0.64, 0.39],
      [4.55, 0.21, 0.3, 0.39],
    ]),
    [p.body, p.underside],
  );
  wing(group, "upper-wing", 15.4, 2.44, [0, 2.43, 0.67], p.cream, p);
  wing(group, "lower-wing", 14.6, 2.28, [0, 0.13, 0.5], p.body, p);
  for (const sign of [-1, 1]) {
    for (const x of [4.95, 6.08]) {
      rod(
        group,
        [sign * x, 0.24, -0.2],
        [sign * x, 2.4, 1.27],
        0.052,
        p.wood,
        "interplane-strut",
      );
      rod(
        group,
        [sign * x, 0.24, 1.22],
        [sign * x, 2.4, 1.27],
        0.052,
        p.wood,
        "interplane-strut",
      );
    }
    line(
      group,
      [
        [sign * 1.07, 0.28, 0.14],
        [sign * 5.02, 2.4, 0.1],
        [sign * 5.02, 0.26, 0.14],
        [sign * 1.07, 2.4, 0.1],
      ],
      p.wire,
      "biplane-bracing-wire",
    );
    rod(
      group,
      [sign * 0.55, 1.01, -0.02],
      [sign * 1.04, 2.4, -0.05],
      0.044,
      p.metal,
      "cabane-strut",
    );
    rod(
      group,
      [sign * 0.55, 1.01, 1.65],
      [sign * 1.04, 2.4, 1.4],
      0.044,
      p.metal,
      "cabane-strut",
    );
    mesh(
      group,
      sign < 0 ? "float-left" : "float-right",
      hullGeometry(
        [
          [-3.3, 0.025, 0.04, 0.05],
          [-2.2, 0.32, 0.3, 0],
          [1.3, 0.38, 0.35, 0],
          [3.35, 0.28, 0.29, 0.18],
          [4.15, 0.015, 0.04, 0.4],
        ],
        48,
        20,
      ),
      [p.cream, p.underside],
      [sign * 1.79, -1.83, 0.15],
    );
    for (const z of [-1.46, 2.01]) {
      rod(
        group,
        [sign * 0.64, -0.13, z],
        [sign * 1.79, -1.53, z],
        0.075,
        p.metal,
        "float-mount",
      );
      rod(
        group,
        [sign * 2.61, 0.02, z * 0.48],
        [sign * 1.79, -1.53, z],
        0.061,
        p.metal,
        "float-mount",
      );
    }
    // Cream wing recognition bands wrap the shallow airfoil with their own geometry.
    const band = wing(
      group,
      "wing-recognition-band",
      1.18,
      2.38,
      [sign * 5.05, 2.442, 0.57],
      p.body,
      p,
      false,
    );
    band.scale.y = 1.06;
  }
  const engine = new THREE.Group();
  engine.name = "engine";
  group.add(engine);
  const cowl = mesh(
    engine,
    "radial-engine-cowling",
    new THREE.CylinderGeometry(0.76, 0.73, 0.85, 32),
    p.cream,
    [0, 0.44, 4.11],
  );
  cowl.rotation.x = Math.PI / 2;
  const face = mesh(
    engine,
    "radial-engine-face",
    new THREE.CylinderGeometry(0.61, 0.61, 0.09, 24),
    p.dark,
    [0, 0.44, 4.57],
  );
  face.rotation.x = Math.PI / 2;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    rod(
      engine,
      [Math.cos(a) * 0.24, 0.44 + Math.sin(a) * 0.24, 4.63],
      [Math.cos(a) * 0.55, 0.44 + Math.sin(a) * 0.55, 4.63],
      0.09,
      p.metal,
      "radial-cylinder",
    );
  }
  group.userData.propeller = propeller(group, p, [0, 0.44, 4.91], 1.59);
  cockpit(group, p, { y: 1.07, z: -1.71 });
  tail(group, p, false);
  group.userData.wingTips = [
    new THREE.Vector3(-7.61, 2.45, 0.42),
    new THREE.Vector3(7.61, 2.45, 0.42),
  ];
}

export function createAircraft(type = "red") {
  const actualType = type === "blue" ? "blue" : "red";
  const group = new THREE.Group();
  group.name = actualType === "red" ? "scarlet-flying-boat" : "navy-biplane";
  group.userData.type = actualType;
  const materials = palette(actualType);
  if (actualType === "red") redCraft(group, materials);
  else blueCraft(group, materials);
  addSilhouetteOutlines(group, materials);
  return group;
}
