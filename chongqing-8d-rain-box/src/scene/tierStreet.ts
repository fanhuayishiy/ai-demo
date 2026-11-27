import * as THREE from 'three';
import { TextureBundle, createSignTexture } from '../textures';
import {
  SharedShaderUniforms,
  createWetRoadMaterial,
  createWetBluestoneMaterial,
  createVolumetricHaloMaterial,
  createBanyanFoliageMaterial,
} from '../shaders';
import { AnimatedEntity, DynamicUpdateContext } from '../types';
import {
  createRedSilkLantern,
  createHotpotTableSet,
  createMiniaturePerson,
  createRisingSteamSystem,
} from './tierSubway';

export interface TierStreetResult {
  group: THREE.Group;
  animated: AnimatedEntity[];
  snowCaps: THREE.Object3D[];
  fallenLeavesMesh: THREE.InstancedMesh;
  warmLights: THREE.PointLight[];
  umbrellaGroups: THREE.Object3D[];
  headlightCones: THREE.Mesh[];
}

export function buildTierStreet(
  textures: TextureBundle,
  sharedUniforms: SharedShaderUniforms
): TierStreetResult {
  const group = new THREE.Group();
  group.name = 'TierStreet';

  const animated: AnimatedEntity[] = [];
  const snowCaps: THREE.Object3D[] = [];
  const warmLights: THREE.PointLight[] = [];
  const umbrellaGroups: THREE.Object3D[] = [];
  const headlightCones: THREE.Mesh[] = [];

  // Shared architectural materials
  const sandstoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneAlbedo,
    bumpMap: textures.sandstoneBump,
    bumpScale: 0.14,
    roughness: 0.88,
    metalness: 0.04,
  });

  const strataMat = new THREE.MeshStandardMaterial({
    map: textures.strataAlbedo,
    bumpMap: textures.strataBump,
    bumpScale: 0.12,
    roughness: 0.9,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.timberAlbedo,
    roughness: 0.62,
    metalness: 0.06,
  });

  const darkLacquerMat = new THREE.MeshStandardMaterial({
    color: 0x3b1a12,
    roughness: 0.44,
    metalness: 0.1,
  });

  const plasterWallMat = new THREE.MeshStandardMaterial({
    color: 0xd9cdb8,
    roughness: 0.85,
  });

  const roofTileMat = new THREE.MeshStandardMaterial({
    color: 0x2a3038,
    roughness: 0.56,
    metalness: 0.18,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x20242b,
    roughness: 0.52,
    metalness: 0.72,
  });

  // Calibrated matte snow blanket material (strictly low luminance < 0.72, ZERO bloom whiteout!)
  const snowBlanketMat = new THREE.MeshStandardMaterial({
    color: 0x9aa8ba,
    roughness: 0.94,
    metalness: 0.0,
  });

  const wetBluestoneMat = createWetBluestoneMaterial(sharedUniforms, textures.bluestoneAlbedo);
  const wetRoadMat = createWetRoadMaterial(sharedUniforms);

  // =========================================================================
  // 1. LOWER FOUNDATION SLAB, WET ASPHALT ROAD & SIDEWALKS
  // =========================================================================
  const subFoundation = new THREE.Mesh(new THREE.BoxGeometry(24.0, 1.2, 18.0), strataMat);
  subFoundation.position.set(0, -0.6, 0);
  subFoundation.receiveShadow = true;
  group.add(subFoundation);

  // Wet asphalt road (x in [-11.8, 11.8], z in [2.1, 8.4])
  const roadGeo = new THREE.PlaneGeometry(23.6, 6.3, 1, 1);
  roadGeo.rotateX(-Math.PI * 0.5);
  const roadMesh = new THREE.Mesh(roadGeo, wetRoadMat);
  roadMesh.position.set(0, 0.02, 5.25);
  group.add(roadMesh);

  // Raised bluestone sidewalks (north sidewalk z in [0.6, 2.1], south curb verge z in [8.4, 9.0])
  const northSidewalk = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.24, 1.6), wetBluestoneMat);
  northSidewalk.position.set(0, 0.12, 1.35);
  northSidewalk.receiveShadow = true;
  group.add(northSidewalk);

  const southCurb = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.22, 0.65), wetBluestoneMat);
  southCurb.position.set(0, 0.11, 8.7);
  group.add(southCurb);

  // =========================================================================
  // 2. MULTI-LEVEL SANDSTONE RETAINING WALL (青苔堡坎) & BLUESTONE STAIRS (青石板梯坎)
  // =========================================================================
  // Main rear cliff retaining wall massif (y = 0 to +4.8, z in [-8.9, -2.5])
  const rearTerraceLeft = new THREE.Mesh(new THREE.BoxGeometry(11.6, 4.8, 6.4), sandstoneMat);
  rearTerraceLeft.position.set(-6.1, 2.4, -5.7);
  rearTerraceLeft.receiveShadow = true;
  group.add(rearTerraceLeft);

  const rearTerraceRight = new THREE.Mesh(new THREE.BoxGeometry(10.0, 4.8, 6.5), sandstoneMat);
  rearTerraceRight.position.set(6.9, 2.4, -5.65);
  rearTerraceRight.receiveShadow = true;
  group.add(rearTerraceRight);

  // Mid cliff buttress behind staircase (z in [-8.9, -5.2])
  const stairCliffBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 4.8, 3.8), sandstoneMat);
  stairCliffBack.position.set(0.7, 2.4, -7.0);
  group.add(stairCliffBack);

  // Upper terrace bluestone deck (y = 4.82)
  const upperDeckLeft = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.16, 6.5), wetBluestoneMat);
  upperDeckLeft.position.set(-6.0, 4.86, -5.65);
  const upperDeckRight = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 6.6), wetBluestoneMat);
  upperDeckRight.position.set(6.8, 4.86, -5.6);
  const upperDeckMid = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 4.0), wetBluestoneMat);
  upperDeckMid.position.set(0.7, 4.86, -6.9);
  group.add(upperDeckLeft, upperDeckRight, upperDeckMid);

  // Weathered sandstone retaining wall cheek walls flanking the bluestone staircase (x = -1.25 and x = +2.35)
  const cheekLeft = new THREE.Mesh(new THREE.BoxGeometry(0.46, 3.8, 4.2), sandstoneMat);
  cheekLeft.position.set(-1.35, 2.1, -1.6);
  const cheekRight = new THREE.Mesh(new THREE.BoxGeometry(0.56, 4.1, 4.8), sandstoneMat);
  cheekRight.position.set(2.35, 2.25, -1.7);
  group.add(cheekLeft, cheekRight);

  // Rain-slick Bluestone Staircase (青石板梯坎) climbing from z = +1.1 (y = 0.24) up to z = -5.1 (y = 4.84)
  const stairSteps = 18;
  const stairW = 3.15;
  const stairCenterX = 0.52;
  for (let i = 0; i < stairSteps; i++) {
    const t = i / (stairSteps - 1);
    const sy = 0.24 + t * 4.55;
    const sz = 1.05 - t * 6.0;
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.28, 0.44), wetBluestoneMat);
    stepMesh.position.set(stairCenterX, sy, sz);
    stepMesh.receiveShadow = true;
    group.add(stepMesh);
  }

  // Wrought-iron stair handrails + warm low step bollards
  const railCurveLeft = new THREE.LineCurve3(
    new THREE.Vector3(stairCenterX - 1.48, 1.15, 1.1),
    new THREE.Vector3(stairCenterX - 1.48, 5.72, -5.0)
  );
  const railCurveRight = new THREE.LineCurve3(
    new THREE.Vector3(stairCenterX + 1.48, 1.15, 1.1),
    new THREE.Vector3(stairCenterX + 1.48, 5.72, -5.0)
  );
  group.add(
    new THREE.Mesh(new THREE.TubeGeometry(railCurveLeft, 12, 0.04, 6, false), darkIronMat),
    new THREE.Mesh(new THREE.TubeGeometry(railCurveRight, 12, 0.04, 6, false), darkIronMat)
  );
  for (let p = 0; p < 6; p++) {
    const t = p / 5;
    const py = 0.72 + t * 4.55;
    const pz = 1.05 - t * 6.0;
    for (const side of [-1.48, 1.48]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.92, 6), darkIronMat);
      post.position.set(stairCenterX + side, py, pz);
      group.add(post);
    }
  }

  // =========================================================================
  // 3. AUTHENTIC BAYU DIAOJIAOLOU (巴渝吊脚楼) & 3 REAL 3D RECESSED WARM SHOPS
  // =========================================================================
  const steamOrigins: THREE.Vector3[] = [];
  const swayingLanterns: THREE.Group[] = [];
  const swayingCurtains: THREE.Mesh[] = [];

  // ---- SHOP 1: 「重庆老火锅」 (x in [-10.8, -4.7], z in [-2.6, +0.9], y = 0.22 to 4.35) ----
  const hotpotShop = new THREE.Group();
  hotpotShop.name = 'ShopChongqingHotpot';
  group.add(hotpotShop);

  const warmIntWallMat = new THREE.MeshStandardMaterial({
    color: 0x7a4829,
    emissive: 0x451f0c,
    emissiveIntensity: 0.42,
    roughness: 0.72,
  });
  const warmIntFloorMat = new THREE.MeshStandardMaterial({ color: 0x4c2d1b, roughness: 0.7 });

  // Recessed hollow 3D room shell (back, left, right, floor, ceiling)
  const hpFloor = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.14, 3.5), warmIntFloorMat);
  hpFloor.position.set(-7.75, 0.26, -0.85);
  const hpCeil = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 3.6), timberMat);
  hpCeil.position.set(-7.75, 4.32, -0.85);
  const hpBack = new THREE.Mesh(new THREE.BoxGeometry(6.1, 4.1, 0.2), warmIntWallMat);
  hpBack.position.set(-7.75, 2.28, -2.55);
  const hpLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.1, 3.5), timberMat);
  hpLeft.position.set(-10.72, 2.28, -0.85);
  const hpRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.1, 3.5), timberMat);
  hpRight.position.set(-4.78, 2.28, -0.85);
  hotpotShop.add(hpFloor, hpCeil, hpBack, hpLeft, hpRight);

  // Carved wooden lattice facade (木雕花窗) framing big open view into 3D interior!
  const hpLowerWainscotLeft = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.05, 0.16), darkLacquerMat);
  hpLowerWainscotLeft.position.set(-9.75, 0.76, 0.85);
  const hpLowerWainscotRight = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.05, 0.16), darkLacquerMat);
  hpLowerWainscotRight.position.set(-5.75, 0.76, 0.85);
  const hpHeaderBeam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.65, 0.28), darkLacquerMat);
  hpHeaderBeam.position.set(-7.75, 3.92, 0.88);
  hotpotShop.add(hpLowerWainscotLeft, hpLowerWainscotRight, hpHeaderBeam);

  // Structural wooden timber pillars & carved lattice window muntins
  for (const px of [-10.65, -8.85, -6.65, -4.85]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 4.1, 8), darkLacquerMat);
    col.position.set(px, 2.25, 0.88);
    hotpotShop.add(col);
  }
  // Delicate carved lattice muntins across left & right display windows (leaving center entrance & upper panes open to interior)
  for (const wx of [-9.75, -5.75]) {
    const topLattice = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.06, 0.08), darkLacquerMat);
    topLattice.position.set(wx, 3.25, 0.86);
    hotpotShop.add(topLattice);
    for (const dx of [-0.54, 0, 0.54]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.52, 0.06), darkLacquerMat);
      bar.position.set(wx + dx, 3.48, 0.86);
      hotpotShop.add(bar);
    }
  }

  // Interior 3D furnishings: 2 wooden round hotpot tables with boiling nine-grid pots + diners
  const shopTable1 = createHotpotTableSet(true);
  shopTable1.scale.setScalar(0.84);
  shopTable1.position.set(-9.35, 0.33, -0.75);
  const shopTable2 = createHotpotTableSet(true);
  shopTable2.scale.setScalar(0.84);
  shopTable2.position.set(-6.15, 0.33, -0.82);
  hotpotShop.add(shopTable1, shopTable2);
  steamOrigins.push(new THREE.Vector3(-9.35, 1.25, -0.75), new THREE.Vector3(-6.15, 1.25, -0.82));

  // Back wall illuminated menu plaque (鲜毛肚·冰球鹅肠·嫩鸭血)
  const hpMenuTex = createSignTexture({
    text: '鲜毛肚 · 冰球鹅肠 · 嫩鸭血',
    subtext: '重庆传统九宫格老油火锅',
    width: 640,
    height: 160,
    bg: '#3a140e',
    fg: '#ffe29c',
    border: '#d68a38',
    fontSize: 40,
    subFontSize: 24,
  });
  const hpMenuMat = new THREE.MeshStandardMaterial({
    map: hpMenuTex,
    emissiveMap: hpMenuTex,
    emissive: new THREE.Color(0xffcc88),
    emissiveIntensity: 0.45,
  });
  const hpMenu = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), hpMenuMat);
  hpMenu.position.set(-7.75, 2.55, -2.42);
  hotpotShop.add(hpMenu);

  // Warm interior pendant lamps
  const pendantMat = new THREE.MeshStandardMaterial({
    color: 0xffdf9e,
    emissive: 0xffa83e,
    emissiveIntensity: 1.0,
  });
  for (const lx of [-9.35, -6.15]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 6), darkIronMat);
    cord.position.set(lx, 3.65, -0.75);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 12, 1, true), darkLacquerMat);
    shade.position.set(lx, 3.12, -0.75);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), pendantMat);
    bulb.position.set(lx, 3.04, -0.75);
    hotpotShop.add(cord, shade, bulb);
  }

  // Main glowing signboard: 「重庆老火锅」
  const hpSignTex = createSignTexture({
    text: '重庆老火锅',
    subtext: 'CHONGQING OLD HOTPOT',
    width: 640,
    height: 176,
    bg: '#4b0f0e',
    fg: '#ffe29a',
    border: '#e09b3d',
    glow: '#ff4b1f',
    fontSize: 74,
    subFontSize: 22,
  });
  const hpSignMat = new THREE.MeshStandardMaterial({
    map: hpSignTex,
    emissiveMap: hpSignTex,
    emissive: new THREE.Color(0xffc07a),
    emissiveIntensity: 0.78,
    roughness: 0.35,
  });
  const hpSign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.96, 0.18), [
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    hpSignMat,
    darkLacquerMat,
  ]);
  hpSign.position.set(-7.75, 3.68, 1.32);
  hotpotShop.add(hpSign);

  // Vertical glowing neon sign: 「毛肚鸭肠」 projecting over sidewalk
  const vertNeonTex = createSignTexture({
    text: '毛肚鸭肠',
    width: 128,
    height: 448,
    bg: '#2b090c',
    fg: '#ff7056',
    border: '#ff4838',
    glow: '#ff2b1c',
    vertical: true,
    fontSize: 72,
  });
  const vertNeonMat = new THREE.MeshStandardMaterial({
    map: vertNeonTex,
    emissiveMap: vertNeonTex,
    emissive: new THREE.Color(0xff5e47),
    emissiveIntensity: 0.92,
  });
  const vertNeon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.7, 0.78), [
    vertNeonMat,
    vertNeonMat,
    darkIronMat,
    darkIronMat,
    darkIronMat,
    darkIronMat,
  ]);
  vertNeon.position.set(-10.85, 5.1, 1.48);
  hotpotShop.add(vertNeon);

  // Stacked green 「山城啤酒」 plastic crates & beer bottles outside hotpot shop
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x206e3b, roughness: 0.6 });
  const beerGlassMat = new THREE.MeshStandardMaterial({ color: 0x2e8542, roughness: 0.22, metalness: 0.15 });
  for (let stack = 0; stack < 3; stack++) {
    const cy = 0.42 + stack * 0.36;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.36), crateMat);
    crate.position.set(-10.22, cy, 1.32);
    crate.rotation.y = (stack - 1) * 0.08;
    hotpotShop.add(crate);
  }
  for (let b = 0; b < 6; b++) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.24, 7), beerGlassMat);
    bottle.position.set(-10.32 + (b % 3) * 0.1, 1.46, 1.24 + Math.floor(b / 3) * 0.12);
    hotpotShop.add(bottle);
  }

  // Illuminated sidewalk A-frame signboard
  const aFrameTex = createSignTexture({
    text: '九宫格',
    subtext: '鲜毛肚 · 冰啤酒',
    width: 220,
    height: 300,
    bg: '#2b1210',
    fg: '#ffd98a',
    border: '#d98834',
    fontSize: 48,
    subFontSize: 24,
  });
  const aFrameMat = new THREE.MeshStandardMaterial({
    map: aFrameTex,
    emissiveMap: aFrameTex,
    emissive: new THREE.Color(0xffbd75),
    emissiveIntensity: 0.52,
  });
  const aFrameGroup = new THREE.Group();
  aFrameGroup.position.set(-5.05, 0.24, 1.56);
  aFrameGroup.rotation.y = 0.28;
  const aFront = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.84, 0.05), [
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    aFrameMat,
    darkLacquerMat,
  ]);
  aFront.position.set(0, 0.42, 0.14);
  aFront.rotation.x = -0.18;
  const aBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.84, 0.05), darkLacquerMat);
  aBack.position.set(0, 0.42, -0.14);
  aBack.rotation.x = 0.18;
  aFrameGroup.add(aFront, aBack);
  hotpotShop.add(aFrameGroup);

  // Warm interior point light spilling out through the carved lattice windows
  const hpLight = new THREE.PointLight(0xff8e3c, 12.5, 11, 1.5);
  hpLight.position.set(-7.75, 2.75, -0.2);
  hotpotShop.add(hpLight);
  warmLights.push(hpLight);

  // ---- SHOP 2: 「山城小面 · 冰粉」 (x in [-4.6, -1.5], z in [-2.3, +0.85], y = 0.22 to 3.9) ----
  const noodleShop = new THREE.Group();
  noodleShop.name = 'ShopNoodles';
  group.add(noodleShop);

  const noodleWallMat = new THREE.MeshStandardMaterial({
    color: 0xc2b299,
    emissive: 0x3b2a19,
    emissiveIntensity: 0.35,
    roughness: 0.65,
  });
  const ndFloor = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 3.1), warmIntFloorMat);
  ndFloor.position.set(-3.05, 0.26, -0.75);
  const ndBack = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.6, 0.2), noodleWallMat);
  ndBack.position.set(-3.05, 2.05, -2.25);
  const ndRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.6, 3.1), timberMat);
  ndRight.position.set(-1.58, 2.05, -0.75);
  const ndCeil = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 3.2), timberMat);
  ndCeil.position.set(-3.05, 3.85, -0.75);
  noodleShop.add(ndFloor, ndBack, ndRight, ndCeil);

  // Recessed kitchen counter + stainless stockpot + 3-tier steaming bamboo 蒸笼
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.96, 0.72), plasterWallMat);
  counter.position.set(-3.05, 0.76, -0.35);
  noodleShop.add(counter);

  const steelPotMat = new THREE.MeshStandardMaterial({ color: 0xbac2cc, roughness: 0.25, metalness: 0.85 });
  const stockpot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.38, 14), steelPotMat);
  stockpot.position.set(-3.65, 1.42, -0.3);
  noodleShop.add(stockpot);

  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xc79d5d, roughness: 0.78 });
  for (let tier = 0; tier < 3; tier++) {
    const steamer = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 14), bambooMat);
    steamer.position.set(-2.55, 1.32 + tier * 0.145, -0.25);
    noodleShop.add(steamer);
  }
  const lid = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.1, 14), bambooMat);
  lid.position.set(-2.55, 1.72, -0.25);
  noodleShop.add(lid);
  steamOrigins.push(new THREE.Vector3(-2.55, 1.85, -0.25), new THREE.Vector3(-3.65, 1.65, -0.3));

  // Signboard: 「山城小面 · 冰粉」
  const ndSignTex = createSignTexture({
    text: '山城小面 · 冰粉',
    width: 512,
    height: 128,
    bg: '#1c2b3a',
    fg: '#ffe8a8',
    border: '#e59a38',
    glow: '#ffae38',
    fontSize: 52,
  });
  const ndSignMat = new THREE.MeshStandardMaterial({
    map: ndSignTex,
    emissiveMap: ndSignTex,
    emissive: new THREE.Color(0xffd088),
    emissiveIntensity: 0.72,
  });
  const ndSign = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.72, 0.15), [
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    ndSignMat,
    darkLacquerMat,
  ]);
  ndSign.position.set(-3.05, 3.55, 1.18);
  noodleShop.add(ndSign);

  // Striped angled awning
  const awningMat = new THREE.MeshStandardMaterial({
    map: textures.awningRed,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 1.22), awningMat);
  awning.position.set(-3.05, 3.05, 1.24);
  awning.rotation.x = 0.34;
  noodleShop.add(awning);

  // Snow blanket cap on awning
  const awningSnow = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.08, 1.18), snowBlanketMat);
  awningSnow.position.set(-3.05, 3.12, 1.24);
  awningSnow.rotation.x = 0.34;
  awningSnow.visible = false;
  noodleShop.add(awningSnow);
  snowCaps.push(awningSnow);

  // Swaying multi-flap fabric doorway curtain (门帘)
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x9c2824,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  for (let f = 0; f < 4; f++) {
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.82), curtainMat);
    flap.geometry.translate(0, -0.41, 0);
    flap.position.set(-3.92 + f * 0.6, 2.75, 0.72);
    noodleShop.add(flap);
    swayingCurtains.push(flap);
  }

  // Sidewalk folding table & red plastic stools
  const foldTableTop = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.05, 0.68), steelPotMat);
  foldTableTop.position.set(-2.95, 0.86, 1.48);
  const foldLegs = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.56), darkIronMat);
  foldLegs.position.set(-2.95, 0.54, 1.48);
  noodleShop.add(foldTableTop, foldLegs);

  const redPlasticMat = new THREE.MeshStandardMaterial({ color: 0xc92c24, roughness: 0.45 });
  for (const [sx, sz] of [
    [-3.52, 1.48],
    [-2.38, 1.48],
    [-2.95, 1.92],
  ]) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.42, 8), redPlasticMat);
    stool.position.set(sx, 0.45, sz);
    noodleShop.add(stool);
  }

  const ndLight = new THREE.PointLight(0xffb454, 8.2, 8, 1.5);
  ndLight.position.set(-3.05, 2.55, 0.1);
  noodleShop.add(ndLight);
  warmLights.push(ndLight);

  // ---- SHOP 3: 「山城茶馆」 (x in [+2.7, +8.4], z in [-2.3, +0.9], y = 0.22 to 4.3) ----
  const teaShop = new THREE.Group();
  teaShop.name = 'ShopTeaHouse';
  group.add(teaShop);

  const teaFloor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 3.2), warmIntFloorMat);
  teaFloor.position.set(5.55, 0.26, -0.7);
  const teaBack = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.05, 0.2), warmIntWallMat);
  teaBack.position.set(5.55, 2.26, -2.25);
  const teaLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.05, 3.2), timberMat);
  teaLeft.position.set(2.8, 2.26, -0.7);
  const teaRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.05, 3.2), timberMat);
  teaRight.position.set(8.3, 2.26, -0.7);
  const teaCeil = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 3.3), timberMat);
  teaCeil.position.set(5.55, 4.3, -0.7);
  teaShop.add(teaFloor, teaBack, teaLeft, teaRight, teaCeil);

  // Open vintage timber frontage
  for (const tx of [2.9, 4.85, 6.25, 8.2]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 4.05, 8), darkLacquerMat);
    col.position.set(tx, 2.25, 0.85);
    teaShop.add(col);
  }
  const teaHeader = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.62, 0.26), darkLacquerMat);
  teaHeader.position.set(5.55, 3.92, 0.86);
  teaShop.add(teaHeader);

  // Illuminated back shelves stocked with colorful tea canisters!
  const canisterColors = [0xc93b2e, 0x3b8a6c, 0xd99b38, 0x2c5a8a, 0x9b5a34, 0x5c8044];
  const canisterGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 10);
  for (let row = 0; row < 3; row++) {
    const sy = 1.25 + row * 0.72;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 0.36), darkLacquerMat);
    shelf.position.set(5.55, sy, -1.96);
    teaShop.add(shelf);
    for (let c = 0; c < 11; c++) {
      const mat = new THREE.MeshStandardMaterial({
        color: canisterColors[(row * 5 + c) % canisterColors.length],
        roughness: 0.32,
        metalness: 0.25,
      });
      const can = new THREE.Mesh(canisterGeo, mat);
      can.position.set(3.45 + c * 0.42, sy + 0.18, -1.94);
      teaShop.add(can);
    }
  }
  // Wooden tea counter + brass teapot
  const teaCounter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 0.68), darkLacquerMat);
  teaCounter.position.set(5.55, 0.74, -0.55);
  teaShop.add(teaCounter);

  // Swaying 「老茶馆」 doorway curtain
  const teaCurtainTex = createSignTexture({
    text: '老茶馆',
    width: 256,
    height: 128,
    bg: '#233b4d',
    fg: '#f2e4c4',
    border: '#a68b56',
    fontSize: 54,
  });
  const teaCurtainMat = new THREE.MeshStandardMaterial({
    map: teaCurtainTex,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const teaCurtain = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.74), teaCurtainMat);
  teaCurtain.geometry.translate(0, -0.37, 0);
  teaCurtain.position.set(5.55, 3.15, 0.82);
  teaShop.add(teaCurtain);
  swayingCurtains.push(teaCurtain);

  // Signboard: 「山城茶馆」
  const teaSignTex = createSignTexture({
    text: '山城茶馆',
    subtext: '盖碗老茶 · 巴渝慢生活',
    width: 512,
    height: 156,
    bg: '#1c2c24',
    fg: '#f8e0a4',
    border: '#c2974c',
    glow: '#e6a84c',
    fontSize: 64,
    subFontSize: 24,
  });
  const teaSignMat = new THREE.MeshStandardMaterial({
    map: teaSignTex,
    emissiveMap: teaSignTex,
    emissive: new THREE.Color(0xffd796),
    emissiveIntensity: 0.66,
  });
  const teaSign = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.96, 0.16), [
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    darkLacquerMat,
    teaSignMat,
    darkLacquerMat,
  ]);
  teaSign.position.set(5.55, 4.1, 1.05);
  teaShop.add(teaSign);

  // Retro blue Chongqing enamel street nameplate: 「十八梯 · 8D山城」
  const streetPlateTex = createSignTexture({
    text: '十八梯 · 8D山城',
    subtext: 'SHIBATI OLD ALLEY',
    width: 384,
    height: 140,
    bg: '#164982',
    fg: '#f4f6fa',
    border: '#e8eef5',
    fontSize: 42,
    subFontSize: 20,
  });
  const streetPlateMat = new THREE.MeshStandardMaterial({
    map: streetPlateTex,
    emissiveMap: streetPlateTex,
    emissive: new THREE.Color(0x88bbff),
    emissiveIntensity: 0.25,
    roughness: 0.28,
    metalness: 0.22,
  });
  const streetPlate = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 0.06), [
    darkIronMat,
    darkIronMat,
    darkIronMat,
    darkIronMat,
    streetPlateMat,
    darkIronMat,
  ]);
  streetPlate.position.set(2.58, 2.55, 0.95);
  teaShop.add(streetPlate);

  const teaLight = new THREE.PointLight(0xffb866, 9.8, 10, 1.5);
  teaLight.position.set(5.55, 2.75, -0.3);
  teaShop.add(teaLight);
  warmLights.push(teaLight);

  // ---- UPPER CANTILEVERED BAYU DIAOJIAOLOU PAVILIONS (Floors 2 & 3, y = 4.4 to 10.6) ----
  // Left grand 2-tier Diaojiaolou perched above 「重庆老火锅」 & 「山城小面」 (x in [-11.0, -1.6])
  const diaoGroup = new THREE.Group();
  diaoGroup.name = 'BayuDiaojiaolouUpper';
  group.add(diaoGroup);

  // Cantilevered wooden stilt columns (吊脚立柱) & 穿斗 diagonal braces supporting overhanging balcony
  for (const cx of [-10.5, -8.3, -6.1, -3.9, -1.9]) {
    // Diagonal 穿斗 knee brace from ground facade out to cantilevered floor joist
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, 0.16), darkLacquerMat);
    brace.position.set(cx, 4.05, 1.25);
    brace.rotation.x = 0.55;
    diaoGroup.add(brace);

    // Upper floor timber posts (Level 2: y = 4.4 to 7.4)
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 3.0, 8), darkLacquerMat);
    post2.position.set(cx, 5.9, 1.48);
    diaoGroup.add(post2);
  }

  // Level 2 overhanging timber veranda deck (y = 4.42)
  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 6.2), timberMat);
  deck2.position.set(-6.2, 4.45, -1.35);
  diaoGroup.add(deck2);

  // Carved outward-canted 「美人靠」 balcony balustrade along Level 2 veranda (z = +1.62)
  const meirenBench = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 0.36), darkLacquerMat);
  meirenBench.position.set(-6.2, 4.92, 1.54);
  const meirenTopRail = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.1, 0.12), darkLacquerMat);
  meirenTopRail.position.set(-6.2, 5.42, 1.84);
  diaoGroup.add(meirenBench, meirenTopRail);
  for (let bx = -10.6; bx <= -1.8; bx += 0.44) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.62, 0.055), darkLacquerMat);
    slat.position.set(bx, 5.15, 1.72);
    slat.rotation.x = 0.34; // Authentic outward cant of 美人靠!
    diaoGroup.add(slat);
  }

  // Level 2 warm recessed wood-and-plaster pavilion walls with glowing carved lattice windows
  const lv2Core = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.8, 4.6), plasterWallMat);
  lv2Core.position.set(-6.2, 5.9, -1.6);
  diaoGroup.add(lv2Core);

  const warmWinMat = new THREE.MeshStandardMaterial({
    map: textures.windowVariants[0],
    emissiveMap: textures.windowVariants[0],
    emissive: new THREE.Color(0xffb85c),
    emissiveIntensity: 0.68,
    roughness: 0.35,
  });
  for (const wx of [-9.4, -7.2, -5.0, -2.9]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.56, 0.14), darkLacquerMat);
    winFrame.position.set(wx, 5.95, 0.72);
    const winPane = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.36), warmWinMat);
    winPane.position.set(wx, 5.95, 0.8);
    diaoGroup.add(winFrame, winPane);
  }

  // Level 3 stepped attic pavilion (x in [-10.0, -3.2], y = 7.4 to 9.7)
  const lv3Core = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.25, 4.1), plasterWallMat);
  lv3Core.position.set(-6.6, 8.55, -2.2);
  diaoGroup.add(lv3Core);
  for (const wx of [-8.8, -6.6, -4.4]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.24, 0.14), darkLacquerMat);
    winFrame.position.set(wx, 8.55, -0.14);
    const winPane = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.04), warmWinMat);
    winPane.position.set(wx, 8.55, -0.06);
    diaoGroup.add(winFrame, winPane);
  }

  // Build authentic pitched roofs with 3D INSTANCED 小青瓦 TILES + Upturned Curved Eaves (飞檐翘角) + 斗拱 brackets!
  // Roof 1: Lower eave skirting above Level 2 veranda (y = 7.45)
  const roofL2 = buildChineseTiledRoof({
    width: 10.6,
    depth: 5.8,
    ridgeHeight: 1.35,
    tileMat: roofTileMat,
    timberMat: darkLacquerMat,
    snowMat: snowBlanketMat,
    snowCaps,
    addDougong: true,
    addUnderEaveGlow: true,
  });
  roofL2.position.set(-6.2, 7.38, -1.05);
  diaoGroup.add(roofL2);

  // Roof 2: Top crowning Bayu pavilion gable roof (y = 9.72, peaking at y = 11.4 — cleanly below viaduct y = 12.5!)
  const roofL3 = buildChineseTiledRoof({
    width: 8.2,
    depth: 5.2,
    ridgeHeight: 1.58,
    tileMat: roofTileMat,
    timberMat: darkLacquerMat,
    snowMat: snowBlanketMat,
    snowCaps,
    addDougong: true,
    addUnderEaveGlow: true,
  });
  roofL3.position.set(-6.6, 9.7, -2.15);
  diaoGroup.add(roofL3);

  // Roof 3: Overhanging Bayu tiled roof over 「山城茶馆」 on the right side (x in [2.4, 8.8], y = 4.45)
  const roofTea = buildChineseTiledRoof({
    width: 6.8,
    depth: 4.4,
    ridgeHeight: 1.15,
    tileMat: roofTileMat,
    timberMat: darkLacquerMat,
    snowMat: snowBlanketMat,
    snowCaps,
    addDougong: true,
    addUnderEaveGlow: true,
  });
  roofTea.position.set(5.6, 4.42, -0.35);
  diaoGroup.add(roofTea);

  // Copper rain gutters & vertical downspouts along Diaojiaolou corners
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0x383d45, roughness: 0.45, metalness: 0.65 });
  for (const gx of [-10.95, -1.45, 8.45]) {
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), gutterMat);
    spout.position.set(gx, 2.25, 1.02);
    diaoGroup.add(spout);
  }

  // Crimson ribbed silk lanterns (大红灯笼) hanging along all Diaojiaolou eaves (flanking signs cleanly!)
  const streetLanternCoords: Array<[number, number, number, number]> = [
    [-10.2, 3.52, 1.36, 0.34],
    [-5.3, 3.52, 1.36, 0.34],
    [-9.6, 6.82, 1.72, 0.32],
    [-6.2, 6.82, 1.72, 0.32],
    [-2.8, 6.82, 1.72, 0.32],
    [3.5, 3.85, 1.28, 0.32],
    [7.6, 3.85, 1.28, 0.32],
  ];
  for (const [lx, ly, lz, sc] of streetLanternCoords) {
    const lantern = createRedSilkLantern(sc);
    lantern.position.set(lx, ly, lz);
    group.add(lantern);
    swayingLanterns.push(lantern);
  }

  // Rising steam system for street hotpot + bamboo steamer
  const streetSteam = createRisingSteamSystem(steamOrigins, textures.steamPuff, 6);
  group.add(streetSteam.group);
  animated.push(streetSteam.animated);

  // =========================================================================
  // 4. LUSH WEEPING CHONGQING BANYAN TREES (山城黄桷树 — 2,400+ GPU-INSTANCED LEAF CLUSTERS)
  // =========================================================================
  const banyanResult = buildWeepingBanyanTrees(textures, sharedUniforms);
  group.add(banyanResult.group);
  const fallenLeavesMesh = banyanResult.fallenLeaves;

  // =========================================================================
  // 5. SCULPTED YELLOW CHONGQING TAXIS (重庆黄色“法拉利”出租车)
  // =========================================================================
  const taxiPlateA = createSignTexture({
    text: '渝A·8D668',
    width: 192,
    height: 64,
    bg: '#1554a6',
    fg: '#f2f6ff',
    border: '#dce8ff',
    fontSize: 34,
  });
  const taxiPlateB = createSignTexture({
    text: '渝A·8D992',
    width: 192,
    height: 64,
    bg: '#1554a6',
    fg: '#f2f6ff',
    border: '#dce8ff',
    fontSize: 34,
  });
  const taxiRoofTex = createSignTexture({
    text: '出租 TAXI',
    width: 192,
    height: 64,
    bg: '#fff4d4',
    fg: '#c4221a',
    glow: '#ffdd88',
    fontSize: 34,
  });

  // Taxi 1: Hero yellow taxi cruising eastbound along inner lane (z = +3.95)
  const taxiEast = buildChongqingYellowTaxi(taxiPlateA, taxiRoofTex, headlightCones);
  taxiEast.position.set(-4.2, 0.04, 3.95);
  group.add(taxiEast);

  // Taxi 2: Yellow taxi cruising westbound along outer lane (z = +6.65)
  const taxiWest = buildChongqingYellowTaxi(taxiPlateB, taxiRoofTex, headlightCones);
  taxiWest.rotation.y = Math.PI;
  taxiWest.position.set(5.4, 0.04, 6.65);
  group.add(taxiWest);

  // Taxi 3: Parked/waiting yellow taxi curbside near Chongqing Old Hotpot for Key 2 signature framing!
  const taxiCurb = buildChongqingYellowTaxi(taxiPlateA, taxiRoofTex, headlightCones);
  taxiCurb.position.set(-7.6, 0.04, 2.75);
  taxiCurb.rotation.y = 0.04;
  group.add(taxiCurb);

  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      if (ctx.convergence) {
        // Synchronized convergence right across the crosswalk!
        const p = ctx.convergenceProgress;
        taxiEast.position.x = THREE.MathUtils.lerp(-9.5, 9.5, (p * 0.8 + 0.35) % 1);
        taxiWest.position.x = THREE.MathUtils.lerp(9.5, -9.5, (p * 0.8 + 0.25) % 1);
      } else {
        const span = 21.6;
        const eastX = (((ctx.time * 2.15 + 7.5) % span) + span) % span - span * 0.5;
        const westX = span * 0.5 - ((((ctx.time * 2.45 + 3.0) % span) + span) % span);
        taxiEast.position.x = eastX;
        taxiWest.position.x = westX;
      }

      // Soft headlight cone intensity modulation by weather (bright at night/rain/snow, subtle in sun)
      const coneScale = 1.0 - ctx.sunWeight * 0.78;
      for (const cone of headlightCones) {
        cone.visible = coneScale > 0.08;
        const mat = cone.material as THREE.ShaderMaterial;
        mat.uniforms.uOpacity.value = 0.24 * coneScale;
      }
    },
  });

  // =========================================================================
  // 6. ARTICULATED MINIATURE PEDESTRIANS WITH 8-RIBBED UMBRELLAS
  // =========================================================================
  interface Walker {
    group: THREE.Group;
    path: Array<[number, number, number]>;
    speed: number;
    phase: number;
  }
  const walkers: Walker[] = [];
  const pedSpecs: Array<{
    coat: number;
    umbrellaColor: number;
    translucent: boolean;
    path: Array<[number, number, number]>;
    speed: number;
    phase: number;
  }> = [
    // Climbing up/down the bluestone stairs (青石板梯坎)
    {
      coat: 0x2c4a6b,
      umbrellaColor: 0xdff0ff,
      translucent: true,
      path: [
        [0.15, 0.28, 1.3],
        [0.15, 4.86, -4.9],
      ],
      speed: 0.09,
      phase: 0.15,
    },
    {
      coat: 0x8f342d,
      umbrellaColor: 0xc93b32,
      translucent: false,
      path: [
        [0.95, 4.86, -4.9],
        [0.95, 0.28, 1.3],
      ],
      speed: 0.085,
      phase: 0.52,
    },
    // Walking along sidewalk past 「重庆老火锅」 & 「山城小面」
    {
      coat: 0x4b5c49,
      umbrellaColor: 0xdcf2ff,
      translucent: true,
      path: [
        [-10.6, 0.24, 1.72],
        [-1.8, 0.24, 1.72],
      ],
      speed: 0.11,
      phase: 0.3,
    },
    {
      coat: 0xa67c46,
      umbrellaColor: 0xe6ae3e,
      translucent: false,
      path: [
        [9.8, 0.24, 1.66],
        [2.2, 0.24, 1.66],
      ],
      speed: 0.1,
      phase: 0.65,
    },
    // Crossing zebra crosswalk
    {
      coat: 0x3b3d4a,
      umbrellaColor: 0xdbeeff,
      translucent: true,
      path: [
        [-2.35, 0.08, 1.9],
        [-2.35, 0.08, 8.5],
      ],
      speed: 0.095,
      phase: 0.42,
    },
    // Standing near noodle shop / tea house
    {
      coat: 0x6b3a54,
      umbrellaColor: 0x3d889c,
      translucent: false,
      path: [
        [4.2, 0.24, 1.48],
        [6.8, 0.24, 1.48],
      ],
      speed: 0.075,
      phase: 0.2,
    },
  ];

  for (const spec of pedSpecs) {
    const ped = createMiniaturePerson(spec.coat, false);
    const umb = createEightRibUmbrella(spec.umbrellaColor, spec.translucent);
    umb.position.set(0.14, 1.16, 0.1);
    umb.rotation.z = -0.14;
    ped.add(umb);
    umbrellaGroups.push(umb);
    group.add(ped);
    walkers.push({ group: ped, path: spec.path, speed: spec.speed, phase: spec.phase });
  }

  // =========================================================================
  // 7. DENSE FOREGROUND STREET PROPS:
  //    Storm drains, manholes, bollards, guardrails, utility poles + tangled wires,
  //    fire hydrant, and parked delivery e-scooters (外卖电瓶车)
  // =========================================================================
  buildForegroundStreetProps(group, darkIronMat, warmLights);

  // =========================================================================
  // 8. ANIMATION LOOP FOR STREET LIFE, LANTERNS, CURTAINS & UMBRELLAS
  // =========================================================================
  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      // Gentle lantern breeze sway
      swayingLanterns.forEach((l, idx) => {
        l.rotation.z = Math.sin(ctx.time * 1.65 + idx * 1.3) * 0.055;
        l.rotation.x = Math.cos(ctx.time * 1.2 + idx * 0.9) * 0.03;
      });

      // Multi-flap fabric shop curtains fluttering gently
      swayingCurtains.forEach((c, idx) => {
        c.rotation.x = -0.06 + Math.sin(ctx.time * 2.4 + idx * 0.85) * 0.085;
      });

      // Pedestrians gliding smoothly along sidewalks & stairs
      for (const w of walkers) {
        const raw = (ctx.time * w.speed + w.phase) % 2;
        const pingPong = raw <= 1 ? raw : 2 - raw;
        const [ax, ay, az] = w.path[0];
        const [bx, by, bz] = w.path[1];
        const x = THREE.MathUtils.lerp(ax, bx, pingPong);
        const y = THREE.MathUtils.lerp(ay, by, pingPong);
        const z = THREE.MathUtils.lerp(az, bz, pingPong);
        const bob = Math.abs(Math.sin(ctx.time * 7.5 + w.phase * 10)) * 0.04;
        w.group.position.set(x, y + bob, z);
        const dir = raw <= 1 ? 1 : -1;
        w.group.rotation.y = Math.atan2((bx - ax) * dir, (bz - az) * dir);
      }

      // Umbrellas open in Rain & Snow, tucked away in Sunny Afternoon!
      const showUmbrella = ctx.sunWeight < 0.55;
      for (const u of umbrellaGroups) {
        u.visible = showUmbrella;
      }

      // Fallen leaves auto-hidden in snow!
      fallenLeavesMesh.visible = ctx.snowWeight < 0.35;

      // Snow blankets on roofs & awnings appear cleanly in snow mode
      const showSnow = ctx.snowWeight > 0.2;
      for (const sc of snowCaps) {
        sc.visible = showSnow;
      }
    },
  });

  return {
    group,
    animated,
    snowCaps,
    fallenLeavesMesh,
    warmLights,
    umbrellaGroups,
    headlightCones,
  };
}

/**
 * Authentic Chinese Pitched Roof with 3D Instanced Ribbed 小青瓦 Tiles,
 * Upturned Curved Eaves (飞檐翘角), 斗拱 Brackets, Ridge Finials & Snow Blanket
 */
function buildChineseTiledRoof(opts: {
  width: number;
  depth: number;
  ridgeHeight: number;
  tileMat: THREE.Material;
  timberMat: THREE.Material;
  snowMat: THREE.Material;
  snowCaps: THREE.Object3D[];
  addDougong?: boolean;
  addUnderEaveGlow?: boolean;
}): THREE.Group {
  const { width, depth, ridgeHeight, tileMat, timberMat, snowMat, snowCaps } = opts;
  const g = new THREE.Group();

  const halfW = width * 0.5;
  const halfD = depth * 0.5;
  const slopeLen = Math.hypot(halfD, ridgeHeight);
  const slopeAngle = Math.atan2(ridgeHeight, halfD);

  // Structural dark roof deck underneath tiles
  for (const side of [-1, 1]) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, slopeLen), timberMat);
    deck.position.set(0, ridgeHeight * 0.5, side * halfD * 0.5);
    deck.rotation.x = side * slopeAngle;
    g.add(deck);
  }

  // Gable triangular end walls
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-halfD, 0);
  gableShape.lineTo(halfD, 0);
  gableShape.lineTo(0, ridgeHeight);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.16, bevelEnabled: false });
  gableGeo.rotateY(Math.PI * 0.5);
  const gLeft = new THREE.Mesh(gableGeo, timberMat);
  gLeft.position.set(-halfW + 0.18, 0, 0);
  const gRight = new THREE.Mesh(gableGeo, timberMat);
  gRight.position.set(halfW - 0.34, 0, 0);
  g.add(gLeft, gRight);

  // 3D INSTANCED RIBBED CHINESE SMALL ROOF TILES (小青瓦)
  const tileSpacing = 0.24;
  const cols = Math.floor(width / tileSpacing);
  const tileGeo = new THREE.CylinderGeometry(0.068, 0.072, slopeLen + 0.18, 6, 1, false, 0, Math.PI);
  tileGeo.rotateX(Math.PI * 0.5);
  const totalTiles = cols * 2;
  const tilesMesh = new THREE.InstancedMesh(tileGeo, tileMat, totalTiles);
  const dummy = new THREE.Object3D();
  let idx = 0;

  for (const side of [-1, 1]) {
    for (let c = 0; c < cols; c++) {
      const tx = -halfW + (c + 0.5) * (width / cols);
      // Subtle upturned eave sweep near both outer ends (飞檐翘角!)
      const edgeNorm = Math.abs(tx) / Math.max(0.1, halfW);
      const upturn = Math.pow(Math.max(0, edgeNorm - 0.55) / 0.45, 2) * 0.34;

      dummy.position.set(tx, ridgeHeight * 0.5 + 0.06 + upturn * 0.5, side * (halfD * 0.5 + 0.04));
      dummy.rotation.set(side * (slopeAngle - upturn * 0.32), 0, 0);
      dummy.updateMatrix();
      tilesMesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  tilesMesh.instanceMatrix.needsUpdate = true;
  g.add(tilesMesh);

  // Upturned curved corner eave horns (飞檐翘角) at all 4 corners!
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx * (halfW - 0.7), 0.14, sz * (halfD - 0.15)),
        new THREE.Vector3(sx * (halfW + 0.05), 0.24, sz * (halfD + 0.2)),
        new THREE.Vector3(sx * (halfW + 0.42), 0.62, sz * (halfD + 0.36)),
      ]);
      const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 8, 0.085, 6, false), tileMat);
      g.add(horn);
    }
  }

  // Main crown ridge beam (正脊) + carved upturned ridge finials (吻兽)
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.45, 0.22, 0.22), tileMat);
  ridge.position.set(0, ridgeHeight + 0.08, 0);
  g.add(ridge);

  for (const sx of [-1, 1]) {
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 6), tileMat);
    finial.position.set(sx * (halfW + 0.18), ridgeHeight + 0.28, 0);
    finial.rotation.z = -sx * 0.36;
    g.add(finial);
  }

  // Overhanging 斗拱 eave brackets along the front eave
  if (opts.addDougong) {
    const bracketCount = Math.max(4, Math.floor(width / 1.15));
    for (let i = 0; i < bracketCount; i++) {
      const bx = -halfW + 0.65 + (i / Math.max(1, bracketCount - 1)) * (width - 1.3);
      const dou = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.32), timberMat);
      dou.position.set(bx, -0.06, halfD - 0.24);
      const gong = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.46), timberMat);
      gong.position.set(bx, 0.04, halfD - 0.16);
      g.add(dou, gong);
    }
  }

  // Subtle warm amber under-eave LED accent strip (classic Hongyadong golden silhouette!)
  if (opts.addUnderEaveGlow) {
    const eaveGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffd280,
      emissive: 0xff9f38,
      emissiveIntensity: 0.78,
      roughness: 0.4,
    });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.06, 0.08), eaveGlowMat);
    strip.position.set(0, 0.02, halfD - 0.06);
    g.add(strip);
  }

  // Matte snow blanket cap resting neatly on top of 小青瓦 slopes (strictly hidden unless snow mode!)
  const snowGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.1, slopeLen + 0.06), snowMat);
    cap.position.set(0, ridgeHeight * 0.5 + 0.14, side * (halfD * 0.5 + 0.03));
    cap.rotation.x = side * slopeAngle;
    snowGroup.add(cap);
  }
  const ridgeSnow = new THREE.Mesh(new THREE.BoxGeometry(width + 0.25, 0.12, 0.28), snowMat);
  ridgeSnow.position.set(0, ridgeHeight + 0.22, 0);
  snowGroup.add(ridgeSnow);
  snowGroup.visible = false;
  g.add(snowGroup);
  snowCaps.push(snowGroup);

  return g;
}

/**
 * Lush Weeping Chongqing Banyan Trees (山城黄桷树):
 * Sculpted gnarly dark-bark trunks + hanging aerial roots + 2,400+ GPU-instanced alpha-cutout leaf clusters
 * (STRICTLY ZERO spheres/icosahedrons!) + 160 fallen wet leaves along steps & gutters
 */
function buildWeepingBanyanTrees(
  textures: TextureBundle,
  sharedUniforms: SharedShaderUniforms
): { group: THREE.Group; fallenLeaves: THREE.InstancedMesh } {
  const group = new THREE.Group();
  group.name = 'WeepingBanyanTrees';

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x382c23,
    roughness: 0.92,
    metalness: 0.02,
  });

  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x463628,
    roughness: 0.9,
  });

  // Deterministic PRNG for organic branching and foliage placement
  let seed = 4242;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  interface CrownAnchor {
    pos: THREE.Vector3;
    radiusX: number;
    radiusY: number;
    radiusZ: number;
    count: number;
  }
  const crownAnchors: CrownAnchor[] = [];

  const buildSingleBanyan = (
    rootPos: THREE.Vector3,
    scale: number,
    leanDir: THREE.Vector3,
    aerialRootDrop: number
  ) => {
    const tree = new THREE.Group();
    tree.position.copy(rootPos);
    group.add(tree);

    // Gnarly main curved trunk
    const trunkPts = [
      new THREE.Vector3(0, -0.4, 0),
      new THREE.Vector3(leanDir.x * 0.45 * scale, 0.9 * scale, leanDir.z * 0.45 * scale),
      new THREE.Vector3(leanDir.x * 0.95 * scale, 2.0 * scale, leanDir.z * 0.85 * scale),
      new THREE.Vector3(leanDir.x * 1.15 * scale, 3.05 * scale, leanDir.z * 1.1 * scale),
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.36 * scale, 8, false);
    tree.add(new THREE.Mesh(trunkGeo, barkMat));

    // Spreading gnarled limbs radiating out into an umbrella-like Chongqing banyan canopy
    const limbDirs: Array<[number, number, number]> = [
      [-1.7, 1.4, 1.3],
      [1.8, 1.5, 1.1],
      [-0.6, 1.8, 1.9],
      [0.9, 1.7, -1.3],
      [-1.6, 1.6, -1.1],
      [0.1, 2.1, 0.2],
      [1.9, 1.2, -0.2],
    ];

    const topOrigin = trunkPts[3];
    for (const [dx, dy, dz] of limbDirs) {
      const mid = new THREE.Vector3(
        topOrigin.x + dx * 0.55 * scale,
        topOrigin.y + dy * 0.62 * scale,
        topOrigin.z + dz * 0.55 * scale
      );
      const end = new THREE.Vector3(
        topOrigin.x + dx * 1.15 * scale,
        topOrigin.y + dy * 0.92 * scale,
        topOrigin.z + dz * 1.15 * scale
      );
      const bCurve = new THREE.CatmullRomCurve3([topOrigin.clone(), mid, end]);
      tree.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 8, 0.14 * scale, 6, false), barkMat));

      // World-space crown cluster anchor at limb tip and midpoint
      crownAnchors.push({
        pos: end.clone().add(rootPos),
        radiusX: 1.55 * scale,
        radiusY: 0.85 * scale,
        radiusZ: 1.45 * scale,
        count: Math.floor(215 * scale),
      });
      crownAnchors.push({
        pos: mid.clone().add(rootPos).add(new THREE.Vector3(0, 0.45 * scale, 0)),
        radiusX: 1.2 * scale,
        radiusY: 0.72 * scale,
        radiusZ: 1.2 * scale,
        count: Math.floor(115 * scale),
      });
    }

    // Hanging weeping aerial roots (气生根) clinging down the sandstone retaining wall
    for (let r = 0; r < 14; r++) {
      const a = (r / 14) * Math.PI * 2;
      const rx = topOrigin.x + Math.cos(a) * (0.45 + rand() * 1.1) * scale;
      const rz = topOrigin.z + Math.sin(a) * (0.35 + rand() * 0.9) * scale;
      const startY = topOrigin.y + (0.1 + rand() * 0.8) * scale;
      const len = (1.6 + rand() * aerialRootDrop) * scale;
      const rCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, startY, rz),
        new THREE.Vector3(rx + (rand() - 0.5) * 0.22, startY - len * 0.5, rz + (rand() - 0.5) * 0.22),
        new THREE.Vector3(rx + (rand() - 0.5) * 0.3, startY - len, rz + (rand() - 0.5) * 0.25),
      ]);
      tree.add(new THREE.Mesh(new THREE.TubeGeometry(rCurve, 7, 0.025 + rand() * 0.02, 5, false), rootMat));
    }
  };

  // Hero Banyan overhanging the bluestone stairs & sandstone retaining wall (x = +1.85, y = 3.2, z = -1.6)
  buildSingleBanyan(new THREE.Vector3(1.95, 3.1, -1.65), 1.05, new THREE.Vector3(-0.35, 0, 0.85), 2.8);
  // Companion Banyan perched on far-left retaining cliff behind Diaojiaolou (x = -10.5, y = 4.6, z = -5.4)
  buildSingleBanyan(new THREE.Vector3(-10.3, 4.6, -5.6), 0.85, new THREE.Vector3(0.2, 0, 0.55), 2.1);

  // Build crossed botanical quad geometry for each instanced multi-leaf cluster (rich 3D volume from EVERY angle!)
  const p1 = new THREE.PlaneGeometry(0.92, 0.92);
  const p2 = new THREE.PlaneGeometry(0.92, 0.92);
  p2.rotateY(Math.PI * 0.5);
  const clusterGeo = mergeSimpleGeometries([p1, p2]);

  const leafMat = createBanyanFoliageMaterial(textures.banyanLeaf, sharedUniforms);
  const totalInstances = crownAnchors.reduce((acc, a) => acc + a.count, 0);
  const foliageMesh = new THREE.InstancedMesh(clusterGeo, leafMat, totalInstances);
  foliageMesh.castShadow = false;
  foliageMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  for (const anchor of crownAnchors) {
    for (let i = 0; i < anchor.count; i++) {
      // Ellipsoidal shell-biased distribution for feathery banyan layering
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const rad = 0.35 + Math.pow(rand(), 0.55) * 0.65;

      const x = anchor.pos.x + Math.sin(phi) * Math.cos(theta) * anchor.radiusX * rad;
      const y = anchor.pos.y + Math.cos(phi) * anchor.radiusY * rad;
      const z = anchor.pos.z + Math.sin(phi) * Math.sin(theta) * anchor.radiusZ * rad;

      dummy.position.set(x, y, z);
      dummy.rotation.set((rand() - 0.5) * 0.85, rand() * Math.PI * 2, (rand() - 0.5) * 0.85);
      const s = 0.65 + rand() * 0.72;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      foliageMesh.setMatrixAt(idx, dummy.matrix);

      // Subtle botanical variation from deep shade green inside to vibrant sunlit jade on top
      const shade = THREE.MathUtils.clamp((y - (anchor.pos.y - anchor.radiusY)) / (anchor.radiusY * 2), 0, 1);
      color.setHSL(0.28 + (rand() - 0.5) * 0.04, 0.36 + shade * 0.14, 0.24 + shade * 0.2);
      foliageMesh.setColorAt(idx, color);
      idx++;
    }
  }
  foliageMesh.instanceMatrix.needsUpdate = true;
  if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
  group.add(foliageMesh);

  // 160 wet fallen leaves scattered along bluestone steps & road gutters (auto-hidden in snow)
  const fallenGeo = new THREE.PlaneGeometry(0.18, 0.18);
  fallenGeo.rotateX(-Math.PI * 0.5);
  const fallenMat = new THREE.MeshStandardMaterial({
    map: textures.fallenLeaf,
    alphaTest: 0.35,
    roughness: 0.32,
    metalness: 0.05,
  });
  const fallenLeaves = new THREE.InstancedMesh(fallenGeo, fallenMat, 160);
  for (let i = 0; i < 160; i++) {
    if (i < 55) {
      // Along bluestone stairs
      const st = Math.floor(rand() * 18);
      const t = st / 17;
      dummy.position.set(0.52 + (rand() - 0.5) * 2.8, 0.39 + t * 4.55, 1.05 - t * 6.0 + (rand() - 0.5) * 0.22);
    } else {
      // Along sidewalk & road gutter
      dummy.position.set((rand() - 0.5) * 21.0, rand() > 0.5 ? 0.255 : 0.035, 1.05 + rand() * 1.75);
    }
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(0.75 + rand() * 0.65);
    dummy.updateMatrix();
    fallenLeaves.setMatrixAt(i, dummy.matrix);
  }
  fallenLeaves.instanceMatrix.needsUpdate = true;
  group.add(fallenLeaves);

  return { group, fallenLeaves };
}

/**
 * Helper: Merge two simple indexed BufferGeometries (for crossed foliage cards)
 */
function mergeSimpleGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const posArr: number[] = [];
  const normArr: number[] = [];
  const uvArr: number[] = [];
  const idxArr: number[] = [];
  let vertexOffset = 0;

  for (const g of geos) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const u = g.getAttribute('uv');
    const idx = g.getIndex();
    for (let i = 0; i < p.count; i++) {
      posArr.push(p.getX(i), p.getY(i), p.getZ(i));
      normArr.push(n.getX(i), n.getY(i), n.getZ(i));
      uvArr.push(u.getX(i), u.getY(i));
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        idxArr.push(idx.getX(i) + vertexOffset);
      }
    }
    vertexOffset += p.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  out.setIndex(idxArr);
  return out;
}

/**
 * Sculpted Yellow Chongqing Taxi (重庆黄色“法拉利”出租车):
 * Multi-section beveled sedan body, radiator grille, slanted glass with A/B/C pillars,
 * mirrors, visible interior seats & driver, 5-spoke silver alloy rims, crisp blue 渝A plates,
 * glowing 出租/TAXI roof beacon, taillights, and soft Fresnel volumetric headlight cones!
 */
function buildChongqingYellowTaxi(
  plateTex: THREE.Texture,
  roofSignTex: THREE.Texture,
  headlightCones: THREE.Mesh[]
): THREE.Group {
  const car = new THREE.Group();
  car.name = 'ChongqingYellowTaxi';

  const yellowPaint = new THREE.MeshStandardMaterial({
    color: 0xf0b216,
    roughness: 0.24,
    metalness: 0.35,
  });
  const tealStripeMat = new THREE.MeshStandardMaterial({
    color: 0x1e6b62, // Signature Chongqing taxi lower teal accent stripe
    roughness: 0.32,
    metalness: 0.25,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x1c2028, roughness: 0.52, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x14202e,
    roughness: 0.12,
    metalness: 0.72,
    transparent: true,
    opacity: 0.72,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.85 });
  const alloyMat = new THREE.MeshStandardMaterial({ color: 0xd0d6df, roughness: 0.25, metalness: 0.88 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e0,
    emissive: 0xffe4a8,
    emissiveIntensity: 1.4,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xe62b22,
    emissive: 0xff281c,
    emissiveIntensity: 1.15,
  });
  const roofBeaconMat = new THREE.MeshStandardMaterial({
    map: roofSignTex,
    emissiveMap: roofSignTex,
    emissive: new THREE.Color(0xffe094),
    emissiveIntensity: 0.88,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTex,
    emissiveMap: plateTex,
    emissive: new THREE.Color(0x5588dd),
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });

  // Lower sculpted sedan chassis (oriented facing +X)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.56, 1.48), yellowPaint);
  lowerBody.position.set(0, 0.58, 0);
  lowerBody.castShadow = true;
  car.add(lowerBody);

  // Lower Chongqing teal accent trim band along flanks
  const tealBand = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.14, 1.5), tealStripeMat);
  tealBand.position.set(0, 0.42, 0);
  car.add(tealBand);

  // Sloping sculpted front hood & trunk deck
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.16, 1.42), yellowPaint);
  hood.position.set(1.18, 0.84, 0);
  hood.rotation.z = -0.1;
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 1.42), yellowPaint);
  trunk.position.set(-1.32, 0.86, 0);
  trunk.rotation.z = 0.06;
  car.add(hood, trunk);

  // Dark front radiator grille & front/rear bumpers
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.82), darkTrimMat);
  grille.position.set(1.72, 0.62, 0);
  const fBumper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 1.5), darkTrimMat);
  fBumper.position.set(1.68, 0.38, 0);
  const rBumper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.5), darkTrimMat);
  rBumper.position.set(-1.68, 0.38, 0);
  car.add(grille, fBumper, rBumper);

  // Greenhouse cabin: interior seats & driver silhouette visible inside translucent glass!
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.8 });
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshStandardMaterial({ color: 0xdab292 }));
  driverHead.position.set(0.12, 1.12, -0.26);
  const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.36), seatMat);
  driverSeat.position.set(-0.04, 0.96, -0.26);
  const passSeat = driverSeat.clone();
  passSeat.position.z = 0.26;
  car.add(driverHead, driverSeat, passSeat);

  // Slanted windshield, rear window & side cabin windows
  const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.48, 1.3), glassMat);
  cabinGlass.position.set(-0.1, 1.08, 0);
  car.add(cabinGlass);

  // Curved yellow roof cap + thin A/B/C pillars
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.1, 1.32), yellowPaint);
  roof.position.set(-0.12, 1.34, 0);
  car.add(roof);

  for (const sz of [-0.63, 0.63]) {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.08), yellowPaint);
    aPillar.position.set(0.62, 1.08, sz);
    aPillar.rotation.z = 0.34;
    const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), darkTrimMat);
    bPillar.position.set(-0.08, 1.08, sz);
    const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.54, 0.08), yellowPaint);
    cPillar.position.set(-0.82, 1.08, sz);
    cPillar.rotation.z = -0.32;
    car.add(aPillar, bPillar, cPillar);

    // Side wing mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.16), yellowPaint);
    mirror.position.set(0.62, 0.92, sz * 1.24);
    car.add(mirror);
  }

  // Glowing roof 「出租 / TAXI」 beacon
  const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.19, 0.58), [
    roofBeaconMat,
    roofBeaconMat,
    yellowPaint,
    darkTrimMat,
    roofBeaconMat,
    roofBeaconMat,
  ]);
  roofSign.position.set(-0.06, 1.48, 0);
  car.add(roofSign);

  // Crisp blue 渝A license plates (front & rear)
  const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), plateMat);
  frontPlate.rotation.y = Math.PI * 0.5;
  frontPlate.position.set(1.8, 0.45, 0);
  const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), plateMat);
  rearPlate.rotation.y = -Math.PI * 0.5;
  rearPlate.position.set(-1.79, 0.52, 0);
  car.add(frontPlate, rearPlate);

  // Headlights, crimson taillight clusters & soft Fresnel volumetric headlight cones
  const coneGeo = new THREE.ConeGeometry(0.68, 2.8, 16, 1, true);
  coneGeo.rotateZ(Math.PI * 0.5);
  coneGeo.translate(1.4, 0, 0);

  for (const lz of [-0.5, 0.5]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.28), headMat);
    hl.position.set(1.72, 0.65, lz);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), tailMat);
    tl.position.set(-1.72, 0.66, lz);
    car.add(hl, tl);

    const coneMat = createVolumetricHaloMaterial(0xffe7ad, 0.24, 2.2);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(1.72, 0.58, lz);
    cone.rotation.z = -0.06;
    car.add(cone);
    headlightCones.push(cone);
  }

  // 4 wheels with flared dark wheel arches & 5-spoke silver alloy rims
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16);
  wheelGeo.rotateX(Math.PI * 0.5);
  const rimGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.23, 12);
  rimGeo.rotateX(Math.PI * 0.5);

  for (const wx of [-1.05, 1.05]) {
    for (const wz of [-0.71, 0.71]) {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(wx, 0.3, wz);
      const rim = new THREE.Mesh(rimGeo, alloyMat);
      rim.position.set(wx, 0.3, wz);
      car.add(wheel, rim);
    }
  }

  return car;
}

/**
 * 8-Ribbed Translucent Vinyl / Colored Umbrella with Curved J-Handle
 */
function createEightRibUmbrella(colorHex: number, translucent: boolean): THREE.Group {
  const g = new THREE.Group();
  const canopyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.28,
    metalness: 0.08,
    transparent: translucent,
    opacity: translucent ? 0.54 : 0.94,
    side: THREE.DoubleSide,
  });
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.4, metalness: 0.7 });

  // 8-sided umbrella dome canopy
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.24, 8, 1, true), canopyMat);
  canopy.position.y = 0.64;
  g.add(canopy);

  // 8 thin wire ribs along cone edges
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.58, 4), ribMat);
    rib.position.set(Math.cos(a) * 0.26, 0.62, Math.sin(a) * 0.26);
    rib.rotation.z = -Math.cos(a) * 1.18;
    rib.rotation.x = Math.sin(a) * 1.18;
    g.add(rib);
  }

  // Shaft & curved handle
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.74, 6), ribMat);
  shaft.position.y = 0.36;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.1, 6), ribMat);
  tip.position.y = 0.79;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 10, Math.PI), ribMat);
  handle.rotation.z = Math.PI;
  handle.position.set(0.055, 0.01, 0);
  g.add(shaft, tip, handle);

  return g;
}

/**
 * Dense Foreground Street Props:
 * Storm-drain grates, embossed manhole covers, black-yellow bollards, guardrails,
 * utility poles with insulators/transformers & tangled sagging overhead wires,
 * red fire hydrant, and 2 parked delivery e-scooters (外卖电瓶车).
 */
function buildForegroundStreetProps(
  group: THREE.Group,
  darkIronMat: THREE.Material,
  warmLights: THREE.PointLight[]
) {
  const props = new THREE.Group();
  props.name = 'ForegroundStreetProps';
  group.add(props);

  const grateMat = new THREE.MeshStandardMaterial({ color: 0x262a32, roughness: 0.48, metalness: 0.78 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xe3ad24, roughness: 0.45 });
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xdde4ec, roughness: 0.25 });
  const fireRedMat = new THREE.MeshStandardMaterial({ color: 0xc2261e, roughness: 0.35, metalness: 0.25 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x454a52, roughness: 0.65, metalness: 0.5 });

  // 1. Flush dark-iron storm-drain grates (雨水篦子) along north road gutter
  for (const gx of [-9.4, -3.6, 2.2, 8.1]) {
    const grateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.025, 0.36), grateMat);
    grateFrame.position.set(gx, 0.03, 2.28);
    props.add(grateFrame);
    for (let s = -0.26; s <= 0.26; s += 0.13) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.032, 0.3), darkIronMat);
      slot.position.set(gx + s, 0.033, 2.28);
      props.add(slot);
    }
  }

  // 2. Embossed cast-iron circular manhole covers on wet asphalt
  for (const [mx, mz] of [
    [-5.8, 5.1],
    [3.8, 5.4],
    [9.4, 4.9],
  ]) {
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.03, 16), grateMat);
    cover.position.set(mx, 0.032, mz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 16), darkIronMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(mx, 0.048, mz);
    props.add(cover, ring);
  }

  // 3. Black-and-yellow roadside bollards & pedestrian guardrails
  for (const bx of [-10.8, -9.2, -4.6, 2.2, 4.4, 9.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.72, 10), darkIronMat);
    post.position.set(bx, 0.6, 2.02);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.16, 10), yellowMat);
    stripe.position.set(bx, 0.78, 2.02);
    props.add(post, stripe);
  }
  // Pedestrian steel guardrail along right sidewalk stretch
  const railSpan = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 0.05), grateMat);
  railSpan.position.set(7.0, 0.88, 2.02);
  const railLow = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.04, 0.04), grateMat);
  railLow.position.set(7.0, 0.56, 2.02);
  props.add(railSpan, railLow);
  for (let rx = 4.9; rx <= 9.2; rx += 1.05) {
    const rp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), grateMat);
    rp.position.set(rx, 0.58, 2.02);
    props.add(rp);
  }

  // 4. Red cast-iron fire hydrant on sidewalk corner
  const hydBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.62, 10), fireRedMat);
  hydBase.position.set(2.05, 0.55, 1.85);
  const hydCap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), fireRedMat);
  hydCap.position.set(2.05, 0.87, 1.85);
  const hydNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), fireRedMat);
  hydNozzle.rotation.z = Math.PI * 0.5;
  hydNozzle.position.set(2.05, 0.72, 1.85);
  props.add(hydBase, hydCap, hydNozzle);

  // 5. Utility poles with ceramic insulators, pole-mounted transformers, warm streetlamps & tangled overhead wires!
  const poleCoords: Array<[number, number]> = [
    [-10.9, 1.92],
    [-1.4, 1.92],
    [9.9, 1.92],
  ];
  const lampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe4ad,
    emissive: 0xffab44,
    emissiveIntensity: 1.25,
  });

  for (let i = 0; i < poleCoords.length; i++) {
    const [px, pz] = poleCoords[i];
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.8, 10), poleMat);
    pole.position.set(px, 3.6, pz);
    props.add(pole);

    // Steel cross-arm + white ceramic insulators
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.15), darkIronMat);
    crossArm.position.set(px, 6.35, pz);
    props.add(crossArm);
    for (const iz of [-0.46, 0, 0.46]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.14, 8), ceramicMat);
      ins.position.set(px, 6.46, pz + iz);
      props.add(ins);
    }

    // Pole-mounted electrical transformer on center & right poles
    if (i > 0) {
      const trans = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.72, 12), poleMat);
      trans.position.set(px + 0.28, 5.15, pz - 0.12);
      props.add(trans);
    }

    // Curved streetlamp arm overhanging road + soft Fresnel volumetric halo
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.35), poleMat);
    arm.position.set(px, 6.0, pz + 0.65);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.46), darkIronMat);
    hood.position.set(px, 5.95, pz + 1.26);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lampBulbMat);
    bulb.position.set(px, 5.88, pz + 1.26);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 12, 10),
      createVolumetricHaloMaterial(0xffb552, 0.22, 2.3)
    );
    halo.position.set(px, 5.86, pz + 1.26);
    props.add(arm, hood, bulb, halo);

    const sLight = new THREE.PointLight(0xffb250, 9.0, 12, 1.5);
    sLight.position.set(px, 5.5, pz + 1.26);
    props.add(sLight);
    warmLights.push(sLight);
  }

  // Sagging tangled catenary overhead utility wires crisscrossing the alley
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x151820 });
  const wireSpans: Array<[THREE.Vector3, THREE.Vector3, number]> = [
    [new THREE.Vector3(-10.9, 6.45, 1.5), new THREE.Vector3(-1.4, 6.45, 1.5), 0.75],
    [new THREE.Vector3(-10.9, 6.45, 2.35), new THREE.Vector3(-1.4, 6.45, 2.35), 0.95],
    [new THREE.Vector3(-1.4, 6.45, 1.5), new THREE.Vector3(9.9, 6.45, 1.5), 0.85],
    [new THREE.Vector3(-1.4, 6.45, 2.35), new THREE.Vector3(9.9, 6.45, 2.35), 1.1],
    // Diagonal alley feeder wires into Diaojiaolou & Tea House eaves
    [new THREE.Vector3(-1.4, 6.1, 1.9), new THREE.Vector3(-5.8, 6.8, 0.9), 0.45],
    [new THREE.Vector3(9.9, 6.0, 1.9), new THREE.Vector3(6.2, 4.3, 0.8), 0.42],
  ];
  for (const [p0, p1, sag] of wireSpans) {
    const mid = p0.clone().lerp(p1, 0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
    props.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.015, 4, false), wireMat));
  }

  // 6. Two parked delivery e-scooters (外卖电瓶车) with yellow & blue insulated food boxes
  const scooterYellow = buildDeliveryScooter(0xf2b818);
  scooterYellow.position.set(-4.35, 0.24, 1.62);
  scooterYellow.rotation.y = -0.35;
  props.add(scooterYellow);

  const scooterBlue = buildDeliveryScooter(0x1f8fe0);
  scooterBlue.position.set(8.65, 0.24, 1.6);
  scooterBlue.rotation.y = 2.65;
  props.add(scooterBlue);
}

function buildDeliveryScooter(boxColorHex: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c323d, roughness: 0.4, metalness: 0.45 });
  const boxMat = new THREE.MeshStandardMaterial({ color: boxColorHex, roughness: 0.45 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.85 });

  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.11, 12);
  wGeo.rotateX(Math.PI * 0.5);
  const wFront = new THREE.Mesh(wGeo, wheelMat);
  wFront.position.set(0.46, 0.18, 0);
  const wRear = new THREE.Mesh(wGeo, wheelMat);
  wRear.position.set(-0.44, 0.18, 0);
  g.add(wFront, wRear);

  // Deck, seat & front steering column
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.34), bodyMat);
  deck.position.set(0, 0.28, 0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.28), bodyMat);
  seat.position.set(-0.14, 0.56, 0);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.22), bodyMat);
  stem.position.set(0.42, 0.58, 0);
  stem.rotation.z = 0.22;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.58, 6), bodyMat);
  bar.rotation.x = Math.PI * 0.5;
  bar.position.set(0.36, 0.88, 0);
  g.add(deck, seat, stem, bar);

  // Rear insulated delivery box (外卖箱)
  const foodBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.44), boxMat);
  foodBox.position.set(-0.56, 0.72, 0);
  g.add(foodBox);

  // Small red rear reflector
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.08, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xff3b2f, emissive: 0xff2b1f, emissiveIntensity: 0.9 })
  );
  tail.position.set(-0.8, 0.48, 0);
  g.add(tail);

  return g;
}
