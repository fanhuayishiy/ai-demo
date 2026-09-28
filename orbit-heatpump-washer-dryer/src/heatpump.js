/** A self-contained, serviceable heat-pump cassette. Local up is +Y, front is +Z. */
export function createHeatPump(THREE, materials = {}) {
  const assembly = new THREE.Group();
  assembly.name = 'Heat pump · refrigeration cassette';

  const material = (key, color, metalness, roughness) => materials[key] || new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const aluminum = material('aluminum', '#aebdc1', 0.88, 0.30);
  const steel = material('steel', '#68777c', 0.88, 0.35);
  const copper = material('copper', '#b96b36', 0.90, 0.24);
  const dark = material('dark', '#142229', 0.65, 0.27);
  const rubber = material('rubber', '#131c20', 0.05, 0.68);
  const brass = new THREE.MeshStandardMaterial({ color: '#bea166', metalness: 0.84, roughness: 0.30 });
  const finMaterial = new THREE.MeshStandardMaterial({ color: '#c5d0d1', metalness: 0.93, roughness: 0.38 });
  const paleSteel = new THREE.MeshStandardMaterial({ color: '#a1afb0', metalness: 0.77, roughness: 0.42 });
  const teal = new THREE.MeshStandardMaterial({ color: '#6fe1cd', emissive: '#2fc8af', emissiveIntensity: 0.30, metalness: 0.35, roughness: 0.35 });
  const groups = new Map();
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 20),
    bolt: new THREE.CylinderGeometry(1, 1, 1, 6),
    sphere: new THREE.SphereGeometry(1, 32, 16),
    torus: new THREE.TorusGeometry(1, 0.06, 8, 48),
  };
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const vector = p => new THREE.Vector3(...p);
  function instance(type, mat, position, scale, quaternion = null) {
    let byMaterial = groups.get(type);
    if (!byMaterial) groups.set(type, byMaterial = new Map());
    let items = byMaterial.get(mat);
    if (!items) byMaterial.set(mat, items = []);
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.quaternion.copy(quaternion || new THREE.Quaternion());
    dummy.updateMatrix();
    items.push(dummy.matrix.clone());
  }
  const box = (mat, p, s) => instance('box', mat, p, s);
  const cylinder = (mat, p, r, h) => instance('cylinder', mat, p, [r, h, r]);
  function rod(mat, a, b, radius) {
    const first = vector(a), last = vector(b), delta = last.clone().sub(first);
    instance('cylinder', mat, first.clone().add(last).multiplyScalar(0.5).toArray(), [radius, delta.length(), radius], new THREE.Quaternion().setFromUnitVectors(up, delta.normalize()));
  }
  function sphere(mat, p, s) { instance('sphere', mat, p, s); }
  function ring(mat, p, radius, axis = 'y', thickness = 1) {
    const q = new THREE.Quaternion();
    if (axis === 'y') q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    if (axis === 'x') q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    instance('torus', mat, p, [radius, radius, radius * thickness], q);
  }

  // Tubes are merged by material to keep the numerous copper returns inexpensive.
  const tubing = new Map();
  function tube(points, radius = 0.018, mat = copper, cornerRadius = 0.045) {
    const pts = points.map(vector);
    const path = new THREE.CurvePath();
    let start = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], previous = pts[i - 1], next = pts[i + 1];
      const inset = Math.min(cornerRadius, p.distanceTo(previous) * 0.45, p.distanceTo(next) * 0.45);
      const a = p.clone().add(previous.clone().sub(p).normalize().multiplyScalar(inset));
      const b = p.clone().add(next.clone().sub(p).normalize().multiplyScalar(inset));
      if (start.distanceTo(a) > 0.00001) path.add(new THREE.LineCurve3(start, a));
      path.add(new THREE.QuadraticBezierCurve3(a, p, b));
      start = b;
    }
    if (start.distanceTo(pts[pts.length - 1]) > 0.00001) path.add(new THREE.LineCurve3(start, pts[pts.length - 1]));
    const geometry = new THREE.TubeGeometry(path, Math.max(20, points.length * 9), radius, 10, false);
    if (!tubing.has(mat)) tubing.set(mat, []);
    tubing.get(mat).push(geometry);
  }
  function merge(list) {
    let vertexCount = 0, indexCount = 0;
    for (const g of list) { vertexCount += g.attributes.position.count; indexCount += g.index.count; }
    const positions = new Float32Array(vertexCount * 3), normals = new Float32Array(vertexCount * 3), uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(indexCount);
    let vertexOffset = 0, indexOffset = 0;
    for (const g of list) {
      positions.set(g.attributes.position.array, vertexOffset * 3);
      normals.set(g.attributes.normal.array, vertexOffset * 3);
      uvs.set(g.attributes.uv.array, vertexOffset * 2);
      for (let i = 0; i < g.index.count; i++) indices[indexOffset + i] = g.index.array[i] + vertexOffset;
      vertexOffset += g.attributes.position.count;
      indexOffset += g.index.count;
      g.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    return geometry;
  }
  function screw(x, y, z, size = 0.016) {
    instance('bolt', steel, [x, y, z], [size, 0.009, size]);
    box(dark, [x, y + 0.005, z], [size * 1.12, 0.0015, 0.0025]);
    box(dark, [x, y + 0.005, z], [0.0025, 0.0015, size * 1.12]);
  }
  function label(text, subtext, p, width, height, rotation = [-Math.PI / 2, 0, 0]) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#e3e8df'; ctx.fillRect(0, 0, 512, 192);
    ctx.fillStyle = '#183631'; ctx.fillRect(0, 0, 10, 192);
    ctx.font = '600 43px Arial'; ctx.fillText(text, 29, 68);
    ctx.fillStyle = '#586964'; ctx.font = '24px Arial'; ctx.fillText(subtext, 30, 111);
    // A machine-readable-looking product marking; deterministic, decorative only.
    for (let x = 30; x < 338; x += 7) { ctx.fillStyle = '#273d36'; ctx.fillRect(x, 137, x % 3 ? 3 : 5, 29); }
    ctx.font = '18px Arial'; ctx.fillText('R290', 379, 159);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.65, metalness: 0.10, side: THREE.DoubleSide }));
    mesh.position.set(...p); mesh.rotation.set(...rotation);
    assembly.add(mesh);
  }

  // Pressed tray, return flanges, transverse stiffeners and rubber mounting pads.
  box(steel, [0, -0.227, 0], [2.0, 0.026, 2.0]);
  box(paleSteel, [0, -0.186, 0.975], [2.0, 0.062, 0.028]);
  box(paleSteel, [0, -0.186, -0.975], [2.0, 0.062, 0.028]);
  for (const x of [-0.975, 0.975]) box(paleSteel, [x, -0.186, 0], [0.028, 0.062, 1.93]);
  for (const z of [-0.65, -0.13, 0.65]) box(steel, [0, -0.205, z], [1.88, 0.035, 0.052]);
  for (const x of [-0.88, 0.88]) for (const z of [-0.86, 0.86]) {
    cylinder(rubber, [x, -0.235, z], 0.069, 0.024);
    screw(x, -0.202, z, 0.023);
  }
  for (const x of [-0.70, 0, 0.70]) for (const z of [-0.974, 0.974]) screw(x, -0.151, z);

  // Independent evaporator and condenser cores. Thin deep fins expose real depth,
  // with three copper tube rows passing through them and external return elbows.
  for (let bank = 0; bank < 2; bank++) {
    const cx = bank === 0 ? -0.485 : 0.485;
    const left = cx - 0.36, right = cx + 0.36;
    box(dark, [cx, -0.183, 0.465], [0.79, 0.035, 0.73]);
    for (let i = 0; i < 43; i++) {
      const x = cx - 0.347 + i * (0.694 / 42);
      box(finMaterial, [x, -0.005, 0.468], [0.0054, 0.306, 0.635]);
      // Folded edge lips catch a sharp highlight across every fin.
      box(aluminum, [x + 0.0016, 0.149, 0.468], [0.0086, 0.005, 0.633]);
      box(aluminum, [x + 0.0016, -0.158, 0.468], [0.0086, 0.005, 0.633]);
    }
    for (const x of [left - 0.015, right + 0.015]) {
      box(paleSteel, [x, -0.008, 0.465], [0.022, 0.333, 0.67]);
      for (const z of [0.152, 0.777]) {
        box(steel, [x, 0.162, z], [0.045, 0.014, 0.051]);
        screw(x, 0.173, z, 0.013);
      }
    }
    for (const z of [0.14, 0.793]) {
      box(aluminum, [cx, 0.162, z], [0.776, 0.020, 0.023]);
      box(aluminum, [cx, -0.166, z], [0.776, 0.018, 0.023]);
    }
    const rows = [-0.103, -0.008, 0.087];
    const depths = [0.233, 0.467, 0.701];
    for (const z of depths) {
      for (const y of rows) rod(copper, [left - 0.037, y, z], [right + 0.037, y, z], 0.018);
      const side = bank === 0 ? left : right;
      const direction = bank === 0 ? -1 : 1;
      const neck = side + direction * 0.037, bend = side + direction * 0.083;
      tube([[neck, rows[0], z], [bend, rows[0], z], [bend, rows[1], z], [neck, rows[1], z]], 0.018, copper, 0.039);
      // Braze sleeves are slightly larger, pale copper rings around the necks.
      for (const y of rows) rod(brass, [side + direction * 0.018, y, z], [side + direction * 0.047, y, z], 0.022);
    }
    const interiorSide = bank === 0 ? right : left;
    const dir = bank === 0 ? 1 : -1;
    tube([[interiorSide + dir * 0.037, -0.008, depths[0]], [interiorSide + dir * 0.065, -0.008, depths[0]], [interiorSide + dir * 0.065, 0.087, depths[1]], [interiorSide + dir * 0.037, 0.087, depths[1]]], 0.016, copper, 0.031);
    tube([[interiorSide + dir * 0.037, -0.008, depths[1]], [interiorSide + dir * 0.065, -0.008, depths[1]], [interiorSide + dir * 0.065, 0.087, depths[2]], [interiorSide + dir * 0.037, 0.087, depths[2]]], 0.016, copper, 0.031);
    box(dark, [cx, 0.170, 0.447], [0.29, 0.012, 0.097]);
    label(bank === 0 ? 'EVAPORATOR' : 'CONDENSER', bank === 0 ? '01 / LOW PRESSURE' : '02 / HEAT RECOVERY', [cx, 0.177, 0.447], 0.274, 0.091);
    box(teal, [cx - 0.16, 0.173, 0.447], [0.022, 0.005, 0.071]);
  }

  // Hermetic rotary compressor: domed pressure shell, welded seam, service feet.
  const compressor = { x: 0.53, z: -0.57 };
  for (const [dx, dz] of [[-0.20, -0.16], [0.20, -0.16], [-0.20, 0.17], [0.20, 0.17]]) {
    cylinder(rubber, [compressor.x + dx, -0.181, compressor.z + dz], 0.043, 0.047);
    box(dark, [compressor.x + dx * 0.80, -0.149, compressor.z + dz * 0.80], [0.124, 0.018, 0.070]);
    screw(compressor.x + dx, -0.145, compressor.z + dz, 0.016);
  }
  cylinder(dark, [compressor.x, -0.009, compressor.z], 0.217, 0.292);
  sphere(dark, [compressor.x, 0.134, compressor.z], [0.217, 0.076, 0.217]);
  sphere(dark, [compressor.x, -0.148, compressor.z], [0.216, 0.037, 0.216]);
  ring(steel, [compressor.x, -0.109, compressor.z], 0.218, 'y', 0.37);
  ring(dark, [compressor.x, 0.128, compressor.z], 0.219, 'y', 0.30);
  box(rubber, [0.66, 0.16, -0.57], [0.113, 0.10, 0.117]);
  box(dark, [0.66, 0.214, -0.57], [0.122, 0.011, 0.126]);
  screw(0.66, 0.223, -0.57, 0.014);
  label('INVERTER', 'HERMETIC ROTARY / 230V', [0.493, 0.205, -0.58], 0.19, 0.093);
  box(teal, [0.53, 0.01, -0.350], [0.098, 0.022, 0.009]);
  cylinder(brass, [0.445, 0.206, -0.579], 0.032, 0.026);
  cylinder(brass, [0.602, 0.18, -0.721], 0.026, 0.031);

  // Blower scroll, axial motor and open intake with discrete radial blades.
  // The impeller axis is vertical so the exploded product view reveals its internals.
  const blowerX = -0.53, blowerZ = -0.55;
  cylinder(dark, [blowerX, -0.12, blowerZ], 0.288, 0.119);
  cylinder(steel, [blowerX, -0.056, blowerZ], 0.296, 0.025);
  box(steel, [-0.44, -0.083, -0.24], [0.40, 0.149, 0.27]);
  box(dark, [-0.44, -0.083, -0.093], [0.33, 0.090, 0.026]);
  box(paleSteel, [-0.44, -0.15, -0.19], [0.434, 0.019, 0.43]);
  cylinder(rubber, [blowerX, -0.035, blowerZ], 0.225, 0.015);
  cylinder(aluminum, [blowerX, 0.015, blowerZ], 0.068, 0.110);
  sphere(steel, [blowerX, 0.071, blowerZ], [0.067, 0.025, 0.067]);
  for (let i = 0; i < 28; i++) {
    const angle = i / 28 * Math.PI * 2;
    const q = new THREE.Quaternion().setFromAxisAngle(up, -angle - 0.40);
    instance('box', aluminum, [blowerX + Math.cos(angle) * 0.182, 0.022, blowerZ + Math.sin(angle) * 0.182], [0.073, 0.088, 0.007], q);
  }
  ring(paleSteel, [blowerX, 0.068, blowerZ], 0.226, 'y', 0.5);
  ring(steel, [blowerX, 0.009, blowerZ], 0.284, 'y', 1.6);
  // Raised stamped scroll rim leaves the center visibly open.
  for (let i = 0; i < 28; i++) {
    const a = 0.18 + i / 28 * Math.PI * 1.83;
    const b = 0.18 + (i + 1) / 28 * Math.PI * 1.83;
    rod(steel, [blowerX + Math.cos(a) * 0.28, 0.050, blowerZ + Math.sin(a) * 0.28], [blowerX + Math.cos(b) * 0.28, 0.050, blowerZ + Math.sin(b) * 0.28], 0.024);
  }
  for (const [x, z] of [[-0.77, -0.75], [-0.28, -0.75], [-0.75, -0.29]]) {
    box(steel, [x, -0.184, z], [0.082, 0.035, 0.082]);
    screw(x, -0.157, z, 0.017);
  }
  for (const a of [0.7, 2.8, 4.8]) screw(blowerX + Math.cos(a) * 0.278, 0.077, blowerZ + Math.sin(a) * 0.278, 0.014);

  // Discharge/suction lines are routed around the service components, never through
  // the coil face. The thicker low-side line has a short closed-cell insulation boot.
  tube([[0.445, 0.21, -0.579], [0.35, 0.224, -0.579], [0.20, 0.224, -0.43], [0.20, 0.145, -0.12], [0.89, 0.145, -0.12], [0.93, 0.12, 0.03], [0.93, 0.087, 0.233], [0.882, 0.087, 0.233]], 0.019, copper, 0.054);
  tube([[-0.882, 0.087, 0.233], [-0.936, 0.087, 0.233], [-0.936, 0.087, -0.088], [-0.15, 0.087, -0.088], [-0.10, 0.075, -0.80], [0.31, 0.075, -0.80], [0.36, 0.008, -0.672]], 0.026, copper, 0.064);
  tube([[-0.10, 0.075, -0.49], [-0.10, 0.075, -0.80], [0.16, 0.075, -0.80]], 0.041, rubber, 0.061);
  for (const z of [-0.54, -0.68]) {
    box(steel, [-0.10, 0.074, z], [0.105, 0.024, 0.026]);
    box(steel, [-0.155, -0.039, z], [0.021, 0.21, 0.026]);
    screw(-0.155, -0.143, z, 0.014);
  }
  tube([[0.882, -0.103, 0.701], [0.947, -0.103, 0.701], [0.947, -0.11, -0.26], [0.89, -0.06, -0.48]], 0.013, copper, 0.035);

  // Filter-drier capsule, brass coupling, fine coiled metering capillary.
  rod(copper, [0.865, -0.041, -0.455], [0.865, -0.041, -0.744], 0.048);
  sphere(copper, [0.865, -0.041, -0.455], [0.048, 0.048, 0.036]);
  sphere(copper, [0.865, -0.041, -0.744], [0.048, 0.048, 0.036]);
  rod(brass, [0.865, -0.041, -0.422], [0.865, -0.041, -0.452], 0.027);
  tube([[0.865, -0.041, -0.773], [0.865, -0.041, -0.864], [0.28, -0.041, -0.864]], 0.008, copper, 0.025);
  const helix = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160, a = t * Math.PI * 2 * 5;
    helix.push([0.18 + Math.cos(a) * 0.054, -0.015 + Math.sin(a) * 0.054, -0.845 + t * 0.24]);
  }
  tube([[0.28, -0.041, -0.864], ...helix], 0.0065, copper, 0.01);
  tube([helix[helix.length - 1], [0.11, -0.015, -0.50], [0.04, -0.015, -0.05], [-0.07, -0.08, 0.04], [-0.882, -0.103, 0.04], [-0.929, -0.103, 0.233], [-0.882, -0.103, 0.233]], 0.008, copper, 0.028);
  for (const z of [-0.518, -0.680]) {
    ring(steel, [0.865, -0.041, z], 0.049, 'z', 0.80);
    box(steel, [0.865, -0.151, z], [0.014, 0.123, 0.031]);
    box(steel, [0.865, -0.208, z], [0.095, 0.017, 0.053]);
    screw(0.897, -0.195, z, 0.013);
  }

  // Small pressure transducer, service valve, wiring loom and drain fitting.
  cylinder(brass, [0.21, 0.162, -0.17], 0.025, 0.052);
  cylinder(dark, [0.21, 0.202, -0.17], 0.026, 0.03);
  box(teal, [0.21, 0.220, -0.17], [0.021, 0.005, 0.018]);
  tube([[0.21, 0.218, -0.17], [0.13, 0.218, -0.19], [0.10, 0.17, -0.40], [0.19, 0.12, -0.72], [0.65, 0.14, -0.76], [0.68, 0.195, -0.625]], 0.009, rubber, 0.033);
  tube([[-0.53, -0.02, -0.82], [-0.53, -0.09, -0.906], [0.16, -0.09, -0.906], [0.67, 0.10, -0.851], [0.69, 0.18, -0.616]], 0.012, rubber, 0.044);
  rod(brass, [0.74, 0.147, -0.12], [0.74, 0.208, -0.12], 0.022);
  cylinder(dark, [0.74, 0.219, -0.12], 0.026, 0.025);
  rod(paleSteel, [-0.92, -0.18, 0.855], [-0.92, -0.18, 0.968], 0.034);
  ring(rubber, [-0.92, -0.18, 0.973], 0.024, 'z');
  label('THERMAL MODULE', 'CLOSED LOOP / VARIABLE SPEED', [0.01, -0.210, -0.951], 0.39, 0.048);

  // Instantiate only once per geometry/material pair; all coil fins and fasteners
  // are instanced even though each retains its own physically modeled silhouette.
  for (const [type, byMaterial] of groups) for (const [mat, transforms] of byMaterial) {
    const mesh = new THREE.InstancedMesh(geometries[type], mat, transforms.length);
    for (let i = 0; i < transforms.length; i++) mesh.setMatrixAt(i, transforms[i]);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `${type} · ${transforms.length} heat-pump parts`;
    assembly.add(mesh);
  }
  for (const [mat, list] of tubing) {
    const mesh = new THREE.Mesh(merge(list), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = mat === copper ? 'Brazed refrigerant circuit' : 'Insulated line and electrical loom';
    assembly.add(mesh);
  }
  assembly.userData = {
    description: 'Twin fin-and-tube evaporator and condenser, hermetic inverter compressor, scroll blower, copper refrigerant circuit, filter-drier and coiled expansion capillary.',
    bounds: { min: [-1.0, -0.247, -1.0], max: [1.0, 0.246, 1.0] },
    front: '+Z',
    ports: { warmAir: [0.485, 0, 0.82], returnAir: [-0.485, 0, 0.82], condensate: [-0.92, -0.18, 0.973] },
  };
  return assembly;
}
