import * as THREE from 'three';

function displayTexture(index) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#081118';
  ctx.fillRect(0, 0, 256, 256);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#dce9e7';
  ctx.fillText(['PFD L', 'NAV L', 'ENGINE', 'NAV R', 'PFD R'][index], 10, 18);
  if (index === 0 || index === 4) {
    ctx.fillStyle = '#285d86';
    ctx.fillRect(40, 32, 176, 90);
    ctx.fillStyle = '#63583f';
    ctx.fillRect(40, 122, 176, 92);
    ctx.strokeStyle = '#d9e6df';
    ctx.lineWidth = 2;
    for (let y = 68; y < 184; y += 18) {
      ctx.beginPath();
      ctx.moveTo(106, y);
      ctx.lineTo(150, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#eab761';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(78, 124);
    ctx.lineTo(112, 124);
    ctx.lineTo(128, 134);
    ctx.lineTo(144, 124);
    ctx.lineTo(178, 124);
    ctx.stroke();
    ctx.fillStyle = '#e1eae7';
    ctx.fillText('175', 8, 128);
    ctx.fillText('048', 220, 128);
  } else if (index === 2) {
    for (const x of [76, 180])
      for (const y of [78, 160]) {
        ctx.strokeStyle = '#84d0bc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 32, 0.4, 5.6);
        ctx.stroke();
        ctx.fillStyle = '#cde7df';
        ctx.fillText(y === 78 ? '84.5' : '642', x - 16, y + 4);
      }
  } else {
    ctx.strokeStyle = '#346258';
    ctx.lineWidth = 1;
    for (const r of [40, 75, 108]) {
      ctx.beginPath();
      ctx.arc(128, 164, r, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#da95d9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(128, 200);
    ctx.lineTo(140, 146);
    ctx.lineTo(107, 95);
    ctx.lineTo(120, 45);
    ctx.stroke();
    ctx.fillStyle = '#dce9e7';
    ctx.fillText('TRK 090', 92, 234);
  }
  ctx.fillStyle = '#8bc7b8';
  ctx.fillText('DEMO', 10, 246);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function addFlightDeck(parent, materials) {
  const root = new THREE.Group();
  root.name = 'cockpit-interior';
  parent.add(root);
  function box(name, size, position, material = materials.graphite) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    object.name = name;
    object.position.set(...position);
    root.add(object);
    return object;
  }
  box('cockpit-floor', [2.7, 0.06, 1.95], [-12, -0.32, 0], materials.deck);
  box('instrument-panel', [0.19, 0.5, 1.84], [-13.05, 0.29, 0]);
  box('glare-shield', [0.42, 0.07, 1.95], [-13.12, 0.58, 0]);
  for (let i = 0; i < 5; i++) {
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: displayTexture(i) });
    screenMaterial.userData.preserveTint = true;
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.34), screenMaterial);
    display.name = `flight-display-${i}`;
    display.rotation.y = Math.PI / 2;
    display.position.set(-12.948, 0.31, (i - 2) * 0.355);
    root.add(display);
  }
  box('center-pedestal', [1.22, 0.36, 0.36], [-12.1, -0.11, 0]);
  for (const side of [-1, 1]) {
    box('pilot-seat-base', [0.55, 0.11, 0.46], [-11.62, -0.05, side * 0.58], materials.seat);
    box('pilot-seat-back', [0.12, 0.67, 0.46], [-11.34, 0.22, side * 0.58], materials.seat);
    box('pilot-headrest', [0.15, 0.18, 0.32], [-11.33, 0.62, side * 0.58], materials.seatHead);
    for (const delta of [-0.21, 0.21]) {
      box(
        'pilot-armrest',
        [0.47, 0.045, 0.055],
        [-11.63, 0.17, side * 0.58 + delta],
        materials.seatHead,
      );
      box('seat-rail', [0.8, 0.035, 0.025], [-11.62, -0.27, side * 0.58 + delta], materials.metal);
    }
    box('control-column', [0.07, 0.48, 0.07], [-12.34, -0.03, side * 0.58]);
    box('control-yoke-bar', [0.045, 0.04, 0.3], [-12.34, 0.22, side * 0.58]);
    for (const delta of [-0.14, 0.14]) {
      box('control-yoke-grip', [0.055, 0.13, 0.045], [-12.34, 0.265, side * 0.58 + delta]);
      box(
        'rudder-pedal',
        [0.14, 0.06, 0.12],
        [-12.73, -0.22, side * 0.58 + delta],
        materials.metal,
      );
    }
    box('throttle-lever', [0.035, 0.21, 0.025], [-12.15, 0.13, side * 0.07], materials.metal);
    box('throttle-grip', [0.13, 0.055, 0.05], [-12.15, 0.25, side * 0.07], materials.seatHead);
    box('side-console', [1.35, 0.18, 0.19], [-12.05, -0.06, side * 0.9]);
  }
  const switches = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.026, 0.017, 0.024),
    materials.seatHead,
    48,
  );
  switches.name = 'pedestal-switches';
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) {
    dummy.position.set(-11.98 + Math.floor(i / 6) * 0.06, 0.079, ((i % 6) - 2.5) * 0.048);
    dummy.updateMatrix();
    switches.setMatrixAt(i, dummy.matrix);
  }
  root.add(switches);
  return root;
}
