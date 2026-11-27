import * as THREE from 'three';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function toTexture(
  canvas: HTMLCanvasElement,
  opts?: { repeatX?: number; repeatY?: number; srgb?: boolean; anisotropy?: number }
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (opts?.repeatX !== undefined || opts?.repeatY !== undefined) {
    tex.repeat.set(opts.repeatX ?? 1, opts.repeatY ?? 1);
  }
  tex.colorSpace = opts?.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = opts?.anisotropy ?? 8;
  tex.needsUpdate = true;
  return tex;
}

export interface TextureBundle {
  mosaicAlbedo: THREE.CanvasTexture;
  mosaicBump: THREE.CanvasTexture;
  sandstoneAlbedo: THREE.CanvasTexture;
  sandstoneBump: THREE.CanvasTexture;
  strataAlbedo: THREE.CanvasTexture;
  strataBump: THREE.CanvasTexture;
  bluestoneAlbedo: THREE.CanvasTexture;
  bluestoneBump: THREE.CanvasTexture;
  walnutAlbedo: THREE.CanvasTexture;
  brassAlbedo: THREE.CanvasTexture;
  brassBump: THREE.CanvasTexture;
  vaultBrickAlbedo: THREE.CanvasTexture;
  vaultBrickBump: THREE.CanvasTexture;
  subwayTileAlbedo: THREE.CanvasTexture;
  tactileAlbedo: THREE.CanvasTexture;
  tactileBump: THREE.CanvasTexture;
  banyanLeaf: THREE.CanvasTexture;
  fallenLeaf: THREE.CanvasTexture;
  awningRed: THREE.CanvasTexture;
  awningBlue: THREE.CanvasTexture;
  concreteAlbedo: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  timberAlbedo: THREE.CanvasTexture;
  steamPuff: THREE.CanvasTexture;
  windowVariants: THREE.CanvasTexture[];
  brassPlaque: THREE.CanvasTexture;
}

export function createTextureBundle(): TextureBundle {
  const mosaic = createMosaicFacadeTextures();
  const sandstone = createSandstoneWallTextures();
  const strata = createStrataRockTextures();
  const bluestone = createBluestoneTextures();
  const brass = createBrushedBrassTextures();
  const vaultBrick = createVaultBrickTextures();
  const tactile = createTactilePavingTextures();
  const concrete = createConcreteTextures();

  return {
    mosaicAlbedo: mosaic.albedo,
    mosaicBump: mosaic.bump,
    sandstoneAlbedo: sandstone.albedo,
    sandstoneBump: sandstone.bump,
    strataAlbedo: strata.albedo,
    strataBump: strata.bump,
    bluestoneAlbedo: bluestone.albedo,
    bluestoneBump: bluestone.bump,
    walnutAlbedo: createWalnutTexture(),
    brassAlbedo: brass.albedo,
    brassBump: brass.bump,
    vaultBrickAlbedo: vaultBrick.albedo,
    vaultBrickBump: vaultBrick.bump,
    subwayTileAlbedo: createSubwayTileTexture(),
    tactileAlbedo: tactile.albedo,
    tactileBump: tactile.bump,
    banyanLeaf: createBanyanLeafClusterTexture(),
    fallenLeaf: createSingleFallenLeafTexture(),
    awningRed: createAwningTexture('#a92822', '#e8d8be'),
    awningBlue: createAwningTexture('#244f76', '#e6dfd3'),
    concreteAlbedo: concrete.albedo,
    concreteBump: concrete.bump,
    timberAlbedo: createDarkTimberTexture(),
    steamPuff: createSteamPuffTexture(),
    windowVariants: [0, 1, 2, 3].map((v) => createApartmentWindowTexture(v)),
    brassPlaque: createBrassPlaqueTexture(),
  };
}

function createMosaicFacadeTextures() {
  const rand = mulberry32(101);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  // Grout base
  ctx.fillStyle = '#5c5348';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#383838';
  bctx.fillRect(0, 0, 512, 512);

  const cols = 32;
  const rows = 64;
  const tw = 512 / cols;
  const th = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const isBand = r % 16 < 3;
    for (let col = 0; col < cols; col++) {
      const jitter = (rand() - 0.5) * 18;
      let R = isBand ? 168 + jitter : 212 + jitter;
      let G = isBand ? 112 + jitter * 0.7 : 194 + jitter * 0.85;
      let B = isBand ? 92 + jitter * 0.6 : 168 + jitter * 0.75;
      // Subtle damp grime variation
      const grime = rand() * 0.14;
      R *= 1 - grime;
      G *= 1 - grime;
      B *= 1 - grime;
      ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
      ctx.fillRect(col * tw + 1, r * th + 1, tw - 1.6, th - 1.4);

      const bv = 175 + ((rand() - 0.5) * 35) | 0;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(col * tw + 1, r * th + 1, tw - 1.6, th - 1.4);
    }
  }

  // Vertical rain-drip weathering streaks
  for (let i = 0; i < 42; i++) {
    const x = rand() * 512;
    const y0 = rand() * 260;
    const len = 80 + rand() * 220;
    const w = 3 + rand() * 11;
    const g = ctx.createLinearGradient(x, y0, x, y0 + len);
    g.addColorStop(0, 'rgba(34, 30, 26, 0.34)');
    g.addColorStop(0.5, 'rgba(42, 39, 34, 0.18)');
    g.addColorStop(1, 'rgba(42, 39, 34, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, w, len);
  }

  return {
    albedo: toTexture(c, { repeatX: 2, repeatY: 2 }),
    bump: toTexture(bc, { repeatX: 2, repeatY: 2, srgb: false }),
  };
}

function createSandstoneWallTextures() {
  const rand = mulberry32(202);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#332e28';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#202020';
  bctx.fillRect(0, 0, 512, 512);

  const rows = 12;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -(rand() * 40);
    while (x < 512) {
      const w = 52 + rand() * 68;
      const base = 98 + (rand() - 0.5) * 34;
      const warm = (rand() - 0.4) * 18;
      ctx.fillStyle = `rgb(${(base + warm) | 0},${(base + warm * 0.45) | 0},${(base - 12) | 0})`;
      ctx.fillRect(x + 2, r * rh + 2, w - 4, rh - 4);

      // Stone surface grain
      for (let s = 0; s < 16; s++) {
        const sx = x + 3 + rand() * Math.max(4, w - 8);
        const sy = r * rh + 3 + rand() * (rh - 6);
        const alpha = 0.08 + rand() * 0.12;
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,244,220,${alpha})` : `rgba(24,20,16,${alpha})`;
        ctx.fillRect(sx, sy, 3 + rand() * 8, 2 + rand() * 4);
      }

      const bv = 145 + (rand() * 75) | 0;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x + 2, r * rh + 2, w - 4, rh - 4);
      x += w;
    }
  }

  // Damp moss patches (青苔堡坎)
  for (let i = 0; i < 48; i++) {
    const mx = rand() * 512;
    const my = rand() * 512;
    const rad = 14 + rand() * 42;
    const g = ctx.createRadialGradient(mx, my, 2, mx, my, rad);
    g.addColorStop(0, 'rgba(46, 74, 38, 0.52)');
    g.addColorStop(0.55, 'rgba(54, 82, 42, 0.25)');
    g.addColorStop(1, 'rgba(54, 82, 42, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Damp vertical seepage streaks
  for (let i = 0; i < 20; i++) {
    const sx = rand() * 512;
    const g = ctx.createLinearGradient(sx, 0, sx, 512);
    g.addColorStop(0, 'rgba(18, 24, 16, 0.28)');
    g.addColorStop(0.6, 'rgba(20, 26, 20, 0.12)');
    g.addColorStop(1, 'rgba(18, 22, 18, 0.32)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, 0, 8 + rand() * 18, 512);
  }

  return {
    albedo: toTexture(c, { repeatX: 2.5, repeatY: 1.5 }),
    bump: toTexture(bc, { repeatX: 2.5, repeatY: 1.5, srgb: false }),
  };
}

function createStrataRockTextures() {
  const rand = mulberry32(303);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  const bands = [
    '#4c3f34',
    '#5c4a3b',
    '#3e362f',
    '#6a5442',
    '#453b33',
    '#554539',
    '#342e2a',
    '#634e3e',
  ];

  let y = 0;
  let idx = 0;
  while (y < 512) {
    const h = 18 + rand() * 42;
    ctx.fillStyle = bands[idx % bands.length];
    ctx.fillRect(0, y, 512, h + 2);

    const bv = 90 + (idx % 4) * 32 + (rand() * 20) | 0;
    bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bctx.fillRect(0, y, 512, h + 2);

    // Wavy geological bedding seam
    ctx.strokeStyle = 'rgba(20, 16, 14, 0.45)';
    ctx.lineWidth = 1.5 + rand() * 2;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const wy = y + Math.sin(x * 0.02 + idx) * 4 + (rand() - 0.5) * 2;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Mineral speckles
    for (let s = 0; s < 45; s++) {
      const sx = rand() * 512;
      const sy = y + rand() * h;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(210,185,155,0.12)' : 'rgba(18,14,12,0.18)';
      ctx.fillRect(sx, sy, 2 + rand() * 14, 1.5 + rand() * 3);
    }
    y += h;
    idx++;
  }

  return {
    albedo: toTexture(c, { repeatX: 2, repeatY: 1 }),
    bump: toTexture(bc, { repeatX: 2, repeatY: 1, srgb: false }),
  };
}

function createBluestoneTextures() {
  const rand = mulberry32(404);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#22272f';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#242424';
  bctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 4;
  const rw = 512 / cols;
  const rh = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (rw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * rw + off;
      const y = r * rh;
      const base = 62 + (rand() - 0.5) * 20;
      ctx.fillStyle = `rgb(${(base - 4) | 0},${(base + 2) | 0},${(base + 11) | 0})`;
      ctx.fillRect(x + 2, y + 2, rw - 4, rh - 4);

      const bv = 155 + (rand() * 55) | 0;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x + 2, y + 2, rw - 4, rh - 4);
    }
  }

  return {
    albedo: toTexture(c, { repeatX: 2, repeatY: 2 }),
    bump: toTexture(bc, { repeatX: 2, repeatY: 2, srgb: false }),
  };
}

function createWalnutTexture() {
  const rand = mulberry32(505);
  const [c, ctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#2d1c13';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.045) * 14 + Math.sin(y * 0.13) * 5;
    const tone = 38 + wave + (rand() - 0.5) * 8;
    ctx.fillStyle = `rgb(${(tone + 18) | 0},${(tone + 2) | 0},${(tone - 8) | 0})`;
    ctx.fillRect(0, y, 512, 2.2);
  }

  // Fine dark wood pores
  ctx.strokeStyle = 'rgba(18, 9, 4, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const y = rand() * 512;
    const x = rand() * 440;
    const len = 30 + rand() * 140;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.3, y + (rand() - 0.5) * 4, x + len * 0.7, y + (rand() - 0.5) * 4, x + len, y);
    ctx.stroke();
  }

  return toTexture(c, { repeatX: 2, repeatY: 1 });
}

function createBrushedBrassTextures() {
  const rand = mulberry32(606);
  const [c, ctx] = makeCanvas(512, 128);
  const [bc, bctx] = makeCanvas(512, 128);

  const grad = ctx.createLinearGradient(0, 0, 512, 128);
  grad.addColorStop(0, '#bfa065');
  grad.addColorStop(0.5, '#d9ba7b');
  grad.addColorStop(1, '#a9894f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 128);

  for (let y = 0; y < 128; y++) {
    const a = 0.05 + rand() * 0.12;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,244,210,${a})` : `rgba(60,42,15,${a})`;
    ctx.fillRect(0, y, 512, 1);

    const bv = 110 + (rand() * 38) | 0;
    bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bctx.fillRect(0, y, 512, 1);
  }

  return {
    albedo: toTexture(c, { repeatX: 2, repeatY: 1 }),
    bump: toTexture(bc, { repeatX: 2, repeatY: 1, srgb: false }),
  };
}

function createVaultBrickTextures() {
  const rand = mulberry32(707);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#383029';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#222222';
  bctx.fillRect(0, 0, 512, 512);

  const rows = 20;
  const cols = 8;
  const rw = 512 / cols;
  const rh = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (rw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * rw + offset;
      const y = r * rh;
      const warm = rand();
      const R = (118 + warm * 46 + (rand() - 0.5) * 20) | 0;
      const G = (72 + warm * 24 + (rand() - 0.5) * 14) | 0;
      const B = (54 + warm * 14 + (rand() - 0.5) * 12) | 0;
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(x + 2, y + 2, rw - 4, rh - 3.5);

      const bv = 165 + (rand() * 60) | 0;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x + 2, y + 2, rw - 4, rh - 3.5);
    }
  }

  return {
    albedo: toTexture(c, { repeatX: 3, repeatY: 2 }),
    bump: toTexture(bc, { repeatX: 3, repeatY: 2, srgb: false }),
  };
}

function createSubwayTileTexture() {
  const rand = mulberry32(808);
  const [c, ctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#d7d3ca';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 16;
  const rows = 16;
  const tw = 512 / cols;
  const th = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const v = 212 + ((rand() - 0.5) * 12) | 0;
      ctx.fillStyle = `rgb(${v},${v - 3},${v - 9})`;
      ctx.fillRect(col * tw + 1, r * th + 1, tw - 2, th - 2);
    }
  }

  // Chongqing Rail crimson + amber architectural stripe
  ctx.fillStyle = '#a82628';
  ctx.fillRect(0, 226, 512, 34);
  ctx.fillStyle = '#d98f2b';
  ctx.fillRect(0, 262, 512, 10);
  // Dark granite dado base
  ctx.fillStyle = '#3a3d45';
  ctx.fillRect(0, 405, 512, 107);

  return toTexture(c, { repeatX: 2.5, repeatY: 1 });
}

function createTactilePavingTextures() {
  const [c, ctx] = makeCanvas(256, 256);
  const [bc, bctx] = makeCanvas(256, 256);

  ctx.fillStyle = '#d8a623';
  ctx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#606060';
  bctx.fillRect(0, 0, 256, 256);

  const step = 32;
  for (let y = 16; y < 256; y += step) {
    for (let x = 16; x < 256; x += step) {
      ctx.fillStyle = '#ecc03b';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9e7412';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      bctx.fillStyle = '#ececec';
      bctx.beginPath();
      bctx.arc(x, y, 8, 0, Math.PI * 2);
      bctx.fill();
    }
  }

  return {
    albedo: toTexture(c, { repeatX: 16, repeatY: 1 }),
    bump: toTexture(bc, { repeatX: 16, repeatY: 1, srgb: false }),
  };
}

function createBanyanLeafClusterTexture() {
  const rand = mulberry32(909);
  const [c, ctx] = makeCanvas(512, 512);
  ctx.clearRect(0, 0, 512, 512);

  // Fine dark botanical twigs radiating from center-bottom
  ctx.strokeStyle = '#33271e';
  ctx.lineCap = 'round';
  const twigs = [
    [256, 460, 256, 175, 5],
    [256, 360, 130, 225, 3.5],
    [256, 340, 385, 220, 3.5],
    [256, 255, 165, 118, 2.8],
    [256, 245, 348, 125, 2.8],
    [188, 285, 88, 285, 2.5],
    [328, 275, 428, 280, 2.5],
  ];
  for (const [x0, y0, x1, y1, lw] of twigs) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) * 0.5, (y0 + y1) * 0.5 - 12, x1, y1);
    ctx.stroke();
  }

  // Draw 46 overlapping pointed lanceolate Chongqing banyan leaves
  const drawLeaf = (cx: number, cy: number, angle: number, len: number, wid: number, tone: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const g = ctx.createLinearGradient(0, 0, len, 0);
    const r0 = (32 + tone * 24) | 0;
    const g0 = (68 + tone * 46) | 0;
    const b0 = (34 + tone * 18) | 0;
    const r1 = (58 + tone * 34) | 0;
    const g1 = (112 + tone * 52) | 0;
    const b1 = (44 + tone * 20) | 0;
    g.addColorStop(0, `rgb(${r0},${g0},${b0})`);
    g.addColorStop(0.65, `rgb(${r1},${g1},${b1})`);
    g.addColorStop(1, `rgb(${Math.min(148, r1 + 26)},${Math.min(182, g1 + 26)},${Math.min(92, b1 + 14)})`);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.28, -wid, len * 0.72, -wid * 0.82, len, 0);
    ctx.bezierCurveTo(len * 0.72, wid * 0.82, len * 0.28, wid, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Subtle midrib vein
    ctx.strokeStyle = 'rgba(148, 194, 110, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(len * 0.88, 0);
    ctx.stroke();

    ctx.restore();
  };

  for (let i = 0; i < 48; i++) {
    const t = i / 48;
    const radius = 25 + Math.sqrt(rand()) * 165;
    const theta = rand() * Math.PI * 2;
    const cx = 256 + Math.cos(theta) * radius * 0.92;
    const cy = 248 + Math.sin(theta) * radius * 0.88;
    const angle = Math.atan2(cy - 330, cx - 256) + (rand() - 0.5) * 1.15;
    const len = 46 + rand() * 44;
    const wid = 13 + rand() * 11;
    drawLeaf(cx, cy, angle, len, wid, t * 0.75 + rand() * 0.35);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createSingleFallenLeafTexture() {
  const [c, ctx] = makeCanvas(64, 64);
  ctx.clearRect(0, 0, 64, 64);
  ctx.save();
  ctx.translate(8, 32);
  const g = ctx.createLinearGradient(0, 0, 48, 0);
  g.addColorStop(0, '#5e5624');
  g.addColorStop(0.5, '#8c752b');
  g.addColorStop(1, '#b08432');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(14, -14, 34, -12, 48, 0);
  ctx.bezierCurveTo(34, 12, 14, 14, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAwningTexture(stripeA: string, stripeB: string) {
  const [c, ctx] = makeCanvas(256, 256);
  const count = 8;
  const sw = 256 / count;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 === 0 ? stripeA : stripeB;
    ctx.fillRect(i * sw, 0, sw + 1, 256);
  }
  // Subtle rain weathering gradient toward lower edge
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(0,0,0,0.08)');
  g.addColorStop(0.75, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(16,12,10,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(c, { repeatX: 1, repeatY: 1 });
}

function createConcreteTextures() {
  const rand = mulberry32(1111);
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(512, 512);

  ctx.fillStyle = '#7e7d78';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const s = 1 + rand() * 4;
    const v = 105 + (rand() * 44) | 0;
    ctx.fillStyle = `rgba(${v},${v - 1},${v - 4},0.22)`;
    ctx.fillRect(x, y, s, s);
    bctx.fillStyle = `rgba(${v},${v},${v},0.3)`;
    bctx.fillRect(x, y, s, s);
  }

  // Formwork panel seams
  ctx.strokeStyle = 'rgba(42,40,38,0.3)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  return {
    albedo: toTexture(c, { repeatX: 2, repeatY: 1 }),
    bump: toTexture(bc, { repeatX: 2, repeatY: 1, srgb: false }),
  };
}

function createDarkTimberTexture() {
  const rand = mulberry32(1212);
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#331d14';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 2) {
    const v = 40 + (rand() - 0.5) * 16;
    ctx.fillStyle = `rgb(${(v + 16) | 0},${(v - 4) | 0},${(v - 14) | 0})`;
    ctx.fillRect(x, 0, 2, 256);
  }
  return toTexture(c, { repeatX: 1, repeatY: 2 });
}

function createSteamPuffTexture() {
  const [c, ctx] = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0, 'rgba(255, 248, 238, 0.72)');
  g.addColorStop(0.45, 'rgba(240, 235, 228, 0.32)');
  g.addColorStop(1, 'rgba(220, 220, 225, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createApartmentWindowTexture(variant: number) {
  const [c, ctx] = makeCanvas(256, 256);
  const palettes = [
    { bg: '#f2b86d', wall: '#d6954c', curtain: '#7d3a2c', light: '#fff2cf' },
    { bg: '#c8dce8', wall: '#8fa9bc', curtain: '#3d5163', light: '#e8f5ff' },
    { bg: '#e8a256', wall: '#bd7634', curtain: '#5b3928', light: '#ffe8b8' },
    { bg: '#414c5e', wall: '#2c3544', curtain: '#232a36', light: '#7a8ea8' }, // dimly lit room
  ];
  const p = palettes[variant % palettes.length];

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, p.light);
  grad.addColorStop(0.45, p.bg);
  grad.addColorStop(1, p.wall);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle room furniture / shelving silhouette
  ctx.fillStyle = 'rgba(28, 18, 12, 0.28)';
  ctx.fillRect(36, 168, 184, 88);
  ctx.fillRect(88, 118, 68, 50);

  // Hanging ceiling lamp silhouette
  ctx.fillStyle = p.light;
  ctx.beginPath();
  ctx.arc(128, 44, 18, 0, Math.PI * 2);
  ctx.fill();

  // Curtains on left & right
  ctx.fillStyle = p.curtain;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(66, 0);
  ctx.quadraticCurveTo(42, 130, 58, 256);
  ctx.lineTo(0, 256);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(192, 0);
  ctx.quadraticCurveTo(214, 130, 198, 256);
  ctx.lineTo(256, 256);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Window sash frame bars
  ctx.strokeStyle = '#383430';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 246);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 170);
  ctx.lineTo(256, 170);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrassPlaqueTexture() {
  const [c, ctx] = makeCanvas(1024, 192);
  const g = ctx.createLinearGradient(0, 0, 1024, 192);
  g.addColorStop(0, '#a68548');
  g.addColorStop(0.5, '#d6b472');
  g.addColorStop(1, '#9b7b3e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 192);

  // Engraved inner hairline border
  ctx.strokeStyle = '#3a2a12';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 996, 164);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, 980, 148);

  // Corner screw dots
  for (const [sx, sy] of [
    [36, 36],
    [988, 36],
    [36, 156],
    [988, 156],
  ]) {
    ctx.fillStyle = '#473315';
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#241708';
  ctx.font = '700 42px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('重庆 8D 山城雨夜微缩沙盘', 512, 74);

  ctx.font = '600 22px "SF Mono", "Consolas", monospace';
  ctx.fillStyle = '#34230e';
  ctx.fillText('CHONGQING 8D RAIN BOX  ·  1:150 ARCHITECTURAL CUTAWAY DIORAMA', 512, 132);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export interface SignTextureOptions {
  text: string;
  subtext?: string;
  width?: number;
  height?: number;
  bg?: string;
  fg?: string;
  border?: string;
  glow?: string;
  vertical?: boolean;
  fontSize?: number;
  subFontSize?: number;
  badge?: string;
  badgeColor?: string;
}

export function createSignTexture(opts: SignTextureOptions): THREE.CanvasTexture {
  const w = opts.width ?? 512;
  const h = opts.height ?? 160;
  const [c, ctx] = makeCanvas(w, h);

  ctx.fillStyle = opts.bg ?? '#181012';
  ctx.fillRect(0, 0, w, h);

  if (opts.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.045);
    const pad = ctx.lineWidth * 1.2;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 14;
  }

  ctx.fillStyle = opts.fg ?? '#ffdf9e';

  if (opts.vertical) {
    const chars = Array.from(opts.text);
    const fs = opts.fontSize ?? Math.floor(Math.min(w * 0.64, (h * 0.82) / Math.max(1, chars.length)));
    ctx.font = `700 ${fs}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const step = (h * 0.82) / Math.max(1, chars.length);
    const startY = h * 0.09 + step * 0.5;
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, w * 0.5, startY + idx * step);
    });
  } else {
    const fs = opts.fontSize ?? Math.floor(h * 0.44);
    ctx.font = `700 ${fs}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    let textX = w * 0.5;

    if (opts.badge) {
      const r = h * 0.28;
      const bx = Math.max(r + 22, w * 0.11);
      const by = h * 0.5;
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = opts.badgeColor ?? '#c42b2b';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f6dfb2';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#fff8ec';
      ctx.font = `700 ${Math.floor(r * 1.15)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(opts.badge, bx, by + 1);
      ctx.restore();
      textX = w * 0.56;
    }

    if (opts.subtext) {
      ctx.fillText(opts.text, textX, h * 0.38);
      ctx.shadowBlur = 4;
      const sfs = opts.subFontSize ?? Math.floor(h * 0.2);
      ctx.font = `600 ${sfs}px "SF Mono", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = opts.fg ?? '#ffe7bc';
      ctx.globalAlpha = 0.9;
      ctx.fillText(opts.subtext, textX, h * 0.74);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillText(opts.text, textX, h * 0.52);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createOfflineEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const [c, ctx] = makeCanvas(512, 256);
  // Subtle moody warm-amber + slate-blue Chongqing night sky & warm city glow reflection map
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#10182b');
  grad.addColorStop(0.38, '#1e2c44');
  grad.addColorStop(0.52, '#4a352a');
  grad.addColorStop(0.65, '#2b2022');
  grad.addColorStop(1.0, '#0d1018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Soft studio highlight patches for crisp metallic brass & glass reflections
  const blobs: Array<[number, number, number, string]> = [
    [110, 65, 58, 'rgba(130, 175, 225, 0.35)'],
    [360, 72, 68, 'rgba(255, 200, 130, 0.38)'],
    [250, 128, 45, 'rgba(235, 95, 72, 0.32)'],
    [440, 132, 38, 'rgba(72, 200, 185, 0.28)'],
  ];
  for (const [x, y, r, col] of blobs) {
    const rg = ctx.createRadialGradient(x, y, 2, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const eqTex = new THREE.CanvasTexture(c);
  eqTex.mapping = THREE.EquirectangularReflectionMapping;
  eqTex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(eqTex);
  eqTex.dispose();
  pmrem.dispose();
  return envRT.texture;
}
