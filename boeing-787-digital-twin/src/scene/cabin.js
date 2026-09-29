import * as THREE from 'three';

export function addCabinInterior(cabin, seats, materials) {
  const interior = new THREE.Group();
  interior.name = 'cabin-interior-details';
  cabin.add(interior);
  const screen = new THREE.MeshStandardMaterial({
    color: 0x18333e,
    emissive: 0x315365,
    emissiveIntensity: 0.22,
    roughness: 0.28,
  });
  screen.userData.preserveTint = true;
  const light = new THREE.MeshStandardMaterial({
    color: 0xf0e8c6,
    emissive: 0xe4d3a4,
    emissiveIntensity: 0.45,
  });
  light.userData.preserveTint = true;
  function boxes(name, size, material, positions) {
    const result = new THREE.InstancedMesh(
      new THREE.BoxGeometry(...size),
      material,
      positions.length,
    );
    result.name = name;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(...p);
      dummy.updateMatrix();
      result.setMatrixAt(i, dummy.matrix);
    });
    interior.add(result);
    return result;
  }
  boxes(
    'seatback-screen-frames',
    [0.022, 0.15, 0.16],
    materials.graphite,
    seats.map(([x, y, z]) => [x + 0.2, y + 0.23, z]),
  );
  boxes(
    'seatback-screens',
    [0.024, 0.115, 0.13],
    screen,
    seats.map(([x, y, z]) => [x + 0.204, y + 0.23, z]),
  );
  boxes(
    'seatback-tray-tables',
    [0.025, 0.13, 0.16],
    materials.seatHead,
    seats.map(([x, y, z]) => [x + 0.2, y + 0.055, z]),
  );
  boxes(
    'seat-supports',
    [0.22, 0.17, 0.028],
    materials.metal,
    seats.flatMap(([x, , z]) => [-1, 1].map((side) => [x, -0.09, z + side * 0.075])),
  );
  boxes(
    'seatbelts',
    [0.024, 0.006, 0.16],
    materials.graphite,
    seats.map(([x, y, z]) => [x - 0.06, y + 0.063, z]),
  );
  boxes(
    'seatbelt-buckles',
    [0.04, 0.01, 0.035],
    materials.metal,
    seats.map(([x, y, z]) => [x - 0.06, y + 0.068, z]),
  );

  const bins = [],
    handles = [],
    lamps = [];
  for (let i = 0; i < 15; i++) {
    for (const side of [-1, 1]) {
      const x = -9.3 + i * 1.2;
      bins.push([x, 0.78, side * 0.97]);
      handles.push([x, 0.71, side * 0.744]);
      lamps.push([x, 0.645, side * 0.85]);
    }
  }
  boxes('overhead-bins', [1.15, 0.26, 0.44], materials.white, bins);
  boxes('overhead-bin-handles', [0.18, 0.025, 0.015], materials.graphite, handles);
  boxes('reading-light-panels', [0.36, 0.015, 0.08], light, lamps);
  boxes('aisle-light-strips', [18.4, 0.008, 0.016], light, [
    [-0.6, -0.159, -0.34],
    [-0.6, -0.159, 0.34],
  ]);
  const galley = [];
  for (const x of [-10.04, 8.45]) {
    for (const z of [-0.85, 0.85]) galley.push([x, 0.22, z]);
  }
  boxes('galley-cabinets', [0.42, 0.76, 0.56], materials.seatHead, galley);
  boxes(
    'galley-worktops',
    [0.45, 0.025, 0.58],
    materials.metal,
    galley.map(([x, , z]) => [x, 0.32, z]),
  );
  boxes(
    'galley-cart-doors',
    [0.025, 0.34, 0.43],
    materials.deck,
    galley.map(([x, , z]) => [x + (x < 0 ? 0.22 : -0.22), 0.05, z]),
  );
  boxes(
    'galley-cart-handles',
    [0.035, 0.025, 0.22],
    materials.metal,
    galley.map(([x, , z]) => [x + (x < 0 ? 0.24 : -0.24), 0.17, z]),
  );
  boxes('aft-bulkhead', [0.04, 0.88, 0.5], materials.white, [
    [8.09, 0.28, -0.87],
    [8.09, 0.28, 0.87],
  ]);

  const cargo = new THREE.Group();
  cargo.name = 'lower-deck-containers';
  interior.add(cargo);
  const profile = new THREE.Shape();
  profile.moveTo(-0.4, 0.26);
  profile.lineTo(0.4, 0.26);
  profile.lineTo(0.4, -0.08);
  profile.lineTo(0.18, -0.26);
  profile.lineTo(-0.4, -0.26);
  profile.closePath();
  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: 1.25,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 1,
    steps: 1,
  });
  for (let i = 0; i < 12; i++) {
    for (const side of [-1, 1]) {
      const container = new THREE.Mesh(geometry, materials.metal);
      container.rotation.y = (side * Math.PI) / 2;
      container.position.set(-8.9 + i * 1.45 - side * 0.625, -0.82, side * 0.53);
      cargo.add(container);
    }
  }
  boxes(
    'cargo-loading-rails',
    [18.6, 0.035, 0.045],
    materials.graphite,
    [-0.8, -0.25, 0.25, 0.8].map((z) => [-0.4, -1.12, z]),
  );
  return interior;
}
