import * as THREE from 'three';
import { TextureBundle, createSignTexture } from '../textures';
import { createVolumetricHaloMaterial } from '../shaders';
import { AnimatedEntity, DynamicUpdateContext } from '../types';

export interface TierSkyResult {
  group: THREE.Group;
  animated: AnimatedEntity[];
  snowCaps: THREE.Object3D[];
  monorailTrainGroup: THREE.Group;
  cablewayCabinGroup: THREE.Group;
}

export function buildTierSky(textures: TextureBundle): TierSkyResult {
  const group = new THREE.Group();
  group.name = 'TierSky';

  const animated: AnimatedEntity[] = [];
  const snowCaps: THREE.Object3D[] = [];

  // Shared materials
  const mosaicMat = new THREE.MeshStandardMaterial({
    map: textures.mosaicAlbedo,
    bumpMap: textures.mosaicBump,
    bumpScale: 0.07,
    roughness: 0.76,
    metalness: 0.04,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.06,
    roughness: 0.84,
    metalness: 0.05,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x2c323c,
    roughness: 0.48,
    metalness: 0.72,
  });

  const ironCageMat = new THREE.MeshStandardMaterial({
    color: 0x3b424c,
    roughness: 0.55,
    metalness: 0.68,
  });

  const snowBlanketMat = new THREE.MeshStandardMaterial({
    color: 0x9aa8ba,
    roughness: 0.94,
    metalness: 0.0,
  });

  // =========================================================================
  // 1. LIZIBA 7-STORY APARTMENT TOWER (李子坝单轨穿楼)
  //    Footprint: x in [+2.8, +10.8], z in [-8.3, -1.7], base y = +4.9 to roof y = +19.7
  //    Clean hollow structural tunnel through Floors 3-5:
  //    y in [+11.3, +16.1], z in [-7.0, -2.8] (viaduct center z = -4.9, y = +12.5)
  // =========================================================================
  const towerGroup = new THREE.Group();
  towerGroup.name = 'LizibaApartmentTower';
  group.add(towerGroup);

  // Structural transfer slab beneath tower (crisp museum cutaway deck during Explode!)
  const podiumSlab = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.36, 7.0), concreteMat);
  podiumSlab.position.set(6.8, 5.02, -5.0);
  towerGroup.add(podiumSlab);

  // Lower Solid Floors 1–2 (y = 5.2 to 11.3, height = 6.1)
  const lowerBlock = new THREE.Mesh(new THREE.BoxGeometry(8.0, 6.1, 6.6), mosaicMat);
  lowerBlock.position.set(6.8, 8.25, -5.0);
  lowerBlock.castShadow = true;
  lowerBlock.receiveShadow = true;
  towerGroup.add(lowerBlock);

  // Mid-Level Hollow Tunnel Walls (Floors 3–5, y = 11.3 to 16.1, height = 4.8):
  // Front wall (z in [-2.8, -1.7], depth 1.1) + Back wall (z in [-8.3, -7.0], depth 1.3)
  // Leaving a completely hollow, unobstructed tunnel channel at z in [-7.0, -2.8] (width 4.2m)!
  const midFrontWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.8, 1.15), mosaicMat);
  midFrontWall.position.set(6.8, 13.7, -2.275);
  midFrontWall.castShadow = true;
  const midBackWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.8, 1.35), mosaicMat);
  midBackWall.position.set(6.8, 13.7, -7.625);
  midBackWall.castShadow = true;
  towerGroup.add(midFrontWall, midBackWall);

  // Dark acoustic concrete interior liner inside the hollow tunnel
  const tunnelLinerMat = new THREE.MeshStandardMaterial({ color: 0x30343c, roughness: 0.9 });
  const tunnelFloor = new THREE.Mesh(new THREE.BoxGeometry(8.04, 0.22, 4.3), tunnelLinerMat);
  tunnelFloor.position.set(6.8, 11.38, -4.9);
  const tunnelCeil = new THREE.Mesh(new THREE.BoxGeometry(8.04, 0.22, 4.3), tunnelLinerMat);
  tunnelCeil.position.set(6.8, 16.02, -4.9);
  towerGroup.add(tunnelFloor, tunnelCeil);

  // Interior warm tunnel maintenance strip lights inside the hollow opening
  const tunnelStripMat = new THREE.MeshStandardMaterial({
    color: 0xffebc2,
    emissive: 0xffcf82,
    emissiveIntensity: 0.72,
  });
  for (const sz of [-6.7, -3.1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 0.12), tunnelStripMat);
    strip.position.set(6.8, 15.84, sz);
    towerGroup.add(strip);
  }

  // Architectural beveled concrete collar framing both West (x = 2.8) and East (x = 10.8) tunnel portals
  for (const px of [2.75, 10.85]) {
    const topCollar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 4.8), concreteMat);
    topCollar.position.set(px, 16.12, -4.9);
    const botCollar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 4.8), concreteMat);
    botCollar.position.set(px, 11.32, -4.9);
    const frontJamb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 0.36), concreteMat);
    frontJamb.position.set(px, 13.7, -2.68);
    const backJamb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 0.36), concreteMat);
    backJamb.position.set(px, 13.7, -7.12);
    towerGroup.add(topCollar, botCollar, frontJamb, backJamb);
  }

  // Illuminated 「李子坝站 · LIZIBA」 gantry sign above the West portal!
  const lizibaSignTex = createSignTexture({
    text: '李子坝站 · LIZIBA',
    subtext: '重庆轨道交通 2号线 · CRT LINE 2',
    width: 640,
    height: 152,
    bg: '#113a2a',
    fg: '#f2fff8',
    border: '#3ec78e',
    glow: '#35d694',
    fontSize: 58,
    subFontSize: 22,
  });
  const lizibaSignMat = new THREE.MeshStandardMaterial({
    map: lizibaSignTex,
    emissiveMap: lizibaSignTex,
    emissive: new THREE.Color(0xc8ffe6),
    emissiveIntensity: 0.72,
    roughness: 0.32,
  });
  // Gantry facing both West (-X) and Front-West (+Z) so it's legible from Hero Key 1 AND Key 2 Alley!
  const gantryWest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.96, 4.2), [
    darkSteelMat,
    lizibaSignMat,
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
  ]);
  gantryWest.position.set(2.58, 16.58, -4.9);
  towerGroup.add(gantryWest);

  const gantryFront = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.78, 0.2), [
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    lizibaSignMat,
    darkSteelMat,
  ]);
  gantryFront.position.set(5.4, 16.05, -1.16);
  towerGroup.add(gantryFront);

  // Upper Solid Floors 6–7 (y = 16.1 to 19.7, height = 3.6)
  const upperBlock = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.6, 6.6), mosaicMat);
  upperBlock.position.set(6.8, 17.9, -5.0);
  upperBlock.castShadow = true;
  upperBlock.receiveShadow = true;
  towerGroup.add(upperBlock);

  // Horizontal concrete slab drip-ledges between stories
  for (const ly of [7.3, 9.4, 11.3, 16.1, 17.9, 19.72]) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(8.24, 0.16, 6.82), concreteMat);
    ledge.position.set(6.8, ly, -5.0);
    towerGroup.add(ledge);
  }

  // ---- APARTMENT WINDOWS, 3D PROTRUDING SECURITY CAGES (凸出式防盗网), POTTED PLANTS, LAUNDRY & AC UNITS ----
  const winMaterials = textures.windowVariants.map((tex, i) => {
    const isDim = i === 3;
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(i === 1 ? 0xd8ecff : 0xffc680),
      emissiveIntensity: isDim ? 0.12 : 0.62,
      roughness: 0.3,
    });
  });

  const acMat = new THREE.MeshStandardMaterial({ color: 0xc8c5bc, roughness: 0.65 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45232, roughness: 0.8 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x3b7a3c, roughness: 0.75 });
  const laundryColors = [0xd64a42, 0x4688c2, 0xe8d068, 0xe6e2da];

  // Populate front (+Z, z = -1.66) facade across all 7 stories
  const floorYs = [6.3, 8.35, 10.35, 12.6, 14.8, 17.0, 18.8];
  const frontWinXs = [3.95, 5.85, 7.75, 9.65];

  floorYs.forEach((fy, fi) => {
    frontWinXs.forEach((wx, wi) => {
      const hash = (fi * 7 + wi * 13) % 11;
      const matIdx = hash % 4;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.24), winMaterials[matIdx]);
      win.position.set(wx, fy, -1.66);
      towerGroup.add(win);

      // Concrete window sill beneath each window
      const sill = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.22), concreteMat);
      sill.position.set(wx, fy - 0.66, -1.62);
      towerGroup.add(sill);

      // 3D Protruding Wrought-Iron Security Window Cage (凸出式防盗网) on ~75% of residential windows!
      if ((fi + wi) % 4 !== 0) {
        const cage = buildSecurityWindowCage(1.24, 1.26, 0.36, ironCageMat, {
          hasPlant: (fi + wi) % 2 === 0,
          laundryColor: (fi * 3 + wi) % 3 === 0 ? laundryColors[(fi + wi) % laundryColors.length] : null,
          potMat,
          plantMat,
        });
        cage.position.set(wx, fy, -1.66);
        towerGroup.add(cage);
      }

      // Wall-mounted AC outdoor unit next to/under alternate windows
      if ((fi + wi) % 3 === 1) {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.28), acMat);
        ac.position.set(wx + 0.72, fy - 0.56, -1.56);
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10), darkSteelMat);
        fan.rotation.x = Math.PI * 0.5;
        fan.position.set(wx + 0.66, fy - 0.56, -1.41);
        towerGroup.add(ac, fan);
      }
    });
  });

  // Populate West (-X, x = 2.77) facade windows on Floors 1-2 & 6-7 (skipping hollow tunnel Floors 3-5!)
  for (const fy of [6.3, 8.35, 10.35, 17.0, 18.8]) {
    for (const wz of [-3.4, -6.5]) {
      const matIdx = Math.abs(Math.round(fy + wz)) % 4;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.2), winMaterials[matIdx]);
      win.rotation.y = -Math.PI * 0.5;
      win.position.set(2.77, fy, wz);
      towerGroup.add(win);

      const cage = buildSecurityWindowCage(1.2, 1.22, 0.32, ironCageMat, {
        hasPlant: true,
        laundryColor: null,
        potMat,
        plantMat,
      });
      cage.rotation.y = -Math.PI * 0.5;
      cage.position.set(2.77, fy, wz);
      towerGroup.add(cage);
    }
  }

  // ---- ROOFTOP ARCHITECTURE: Parapet, Stair Penthouse, Water Tanks, Solar Heater & Neon Signs ----
  const roofY = 19.8;
  // Parapet walls around rooftop edge
  const paraFront = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.62, 0.24), mosaicMat);
  paraFront.position.set(6.8, roofY + 0.31, -1.8);
  const paraBack = paraFront.clone();
  paraBack.position.z = -8.2;
  const paraLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 6.6), mosaicMat);
  paraLeft.position.set(2.88, roofY + 0.31, -5.0);
  const paraRight = paraLeft.clone();
  paraRight.position.x = 10.72;
  towerGroup.add(paraFront, paraBack, paraLeft, paraRight);

  // Rooftop stair penthouse
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 2.2), concreteMat);
  penthouse.position.set(8.8, roofY + 0.95, -6.4);
  towerGroup.add(penthouse);

  // Twin stainless-steel rooftop water tanks on tripod legs
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xbac4ce, roughness: 0.32, metalness: 0.78 });
  for (const tx of [4.2, 5.45]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.25, 14), tankMat);
    tank.position.set(tx, roofY + 0.96, -6.5);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.42, 6), darkSteelMat);
    stand.position.set(tx, roofY + 0.22, -6.5);
    towerGroup.add(tank, stand);
  }

  // Rooftop angled solar water heater (vacuum tubes + horizontal drum tank)
  const solarGroup = new THREE.Group();
  solarGroup.position.set(6.8, roofY + 0.62, -6.8);
  const solarDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 12), tankMat);
  solarDrum.rotation.z = Math.PI * 0.5;
  solarDrum.position.set(0, 0.52, -0.35);
  const solarPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.08, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x1a2840, roughness: 0.2, metalness: 0.65 })
  );
  solarPanel.rotation.x = 0.52;
  solarPanel.position.set(0, 0.16, 0.12);
  solarGroup.add(solarDrum, solarPanel);
  towerGroup.add(solarGroup);

  // Subtle glowing red rooftop neon sign: 「重庆 · 山城」
  const roofNeonTex = createSignTexture({
    text: '重庆 · 山城',
    width: 512,
    height: 152,
    bg: '#1c090a',
    fg: '#ff6e5a',
    border: '#e84438',
    glow: '#ff3626',
    fontSize: 72,
  });
  const roofNeonMat = new THREE.MeshStandardMaterial({
    map: roofNeonTex,
    emissiveMap: roofNeonTex,
    emissive: new THREE.Color(0xff5240),
    emissiveIntensity: 0.88,
  });
  const roofSignBoard = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.32, 0.18), [
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    roofNeonMat,
    darkSteelMat,
  ]);
  roofSignBoard.position.set(6.5, roofY + 1.38, -2.25);
  towerGroup.add(roofSignBoard);
  for (const sx of [4.6, 8.4]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), darkSteelMat);
    leg.position.set(sx, roofY + 0.68, -2.25);
    towerGroup.add(leg);
  }

  // Side vertical neon sign on West face facing the alley: 「雾都山城」
  const sideNeonTex = createSignTexture({
    text: '雾都山城',
    width: 128,
    height: 448,
    bg: '#161f2b',
    fg: '#68e3ff',
    border: '#3cc8eb',
    glow: '#24b4e0',
    vertical: true,
    fontSize: 72,
  });
  const sideNeonMat = new THREE.MeshStandardMaterial({
    map: sideNeonTex,
    emissiveMap: sideNeonTex,
    emissive: new THREE.Color(0x4fd4ff),
    emissiveIntensity: 0.86,
  });
  const sideNeon = new THREE.Mesh(new THREE.BoxGeometry(0.76, 3.3, 0.18), [
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    darkSteelMat,
    sideNeonMat,
    sideNeonMat,
  ]);
  sideNeon.position.set(2.34, 18.0, -2.15);
  towerGroup.add(sideNeon);

  // Rooftop matte snow blanket cap (hidden unless snow mode)
  const roofSnow = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.14, 6.2), snowBlanketMat);
  roofSnow.position.set(6.8, roofY + 0.08, -5.0);
  roofSnow.visible = false;
  towerGroup.add(roofSnow);
  snowCaps.push(roofSnow);

  // =========================================================================
  // 2. ELEVATED CONCRETE STRADDLE-BEAM VIADUCT (y = +12.5, z = -4.9)
  // =========================================================================
  const viaductGroup = new THREE.Group();
  viaductGroup.name = 'MonorailViaduct';
  group.add(viaductGroup);

  // Continuous concrete straddle-beam piercing cleanly through Liziba tower tunnel!
  const beam = new THREE.Mesh(new THREE.BoxGeometry(23.8, 1.32, 0.86), concreteMat);
  beam.position.set(0, 12.26, -4.9);
  beam.castShadow = true;
  beam.receiveShadow = true;
  viaductGroup.add(beam);

  // Side steel maintenance catwalk & handrails (outside building west span x in [-11.8, +2.6])
  const catwalkDeck = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.12, 0.72), darkSteelMat);
  catwalkDeck.position.set(-4.6, 12.32, -3.95);
  const catwalkRail = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.05, 0.05), darkSteelMat);
  catwalkRail.position.set(-4.6, 13.06, -3.62);
  viaductGroup.add(catwalkDeck, catwalkRail);
  for (let rx = -11.4; rx <= 2.2; rx += 1.7) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), darkSteelMat);
    post.position.set(rx, 12.72, -3.62);
    viaductGroup.add(post);
  }

  // Tapered concrete viaduct piers & riveted steel pier bearings supporting the West elevated span
  for (const px of [-9.4, -2.2]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.15, 7.2, 1.15), concreteMat);
    pier.position.set(px, 8.2, -4.9);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 1.65), concreteMat);
    cap.position.set(px, 11.4, -4.9);
    const bearing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 1.2), darkSteelMat);
    bearing.position.set(px, 11.66, -4.9);
    viaductGroup.add(pier, cap, bearing);
  }

  // =========================================================================
  // 3. CHONGQING CRT LINE 2 4-CAR STRADDLE MONORAIL (重庆轨道2号线跨座式单轨)
  // =========================================================================
  const monorailTrainGroup = buildCRTLine2Monorail();
  // Straddles cleanly over concrete beam top (y = 12.92) at z = -4.9!
  // Zero clipping: train z in [-5.95, -3.85] inside tunnel z in [-7.0, -2.8]; train top y = 15.32 < tunnel ceiling 15.9!
  monorailTrainGroup.position.set(-1.5, 12.3, -4.9);
  group.add(monorailTrainGroup);

  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      if (ctx.convergence) {
        // Peak 8D signature pose: emerald-green monorail nose emerging right out of the Liziba portal!
        const targetX = -0.2 + Math.sin(ctx.convergenceProgress * Math.PI * 2) * 1.4;
        monorailTrainGroup.position.x = THREE.MathUtils.lerp(
          monorailTrainGroup.position.x,
          targetX,
          Math.min(1, ctx.dt * 4.0)
        );
      } else {
        // Continuous graceful oscillation / glide right through the Liziba apartment tunnel
        const x = -1.2 + Math.sin(ctx.time * 0.42) * 4.2;
        monorailTrainGroup.position.x = x;
      }
    },
  });

  // =========================================================================
  // 4. YANGTZE RIVER CABLEWAY (长江索道)
  //    Cleanly separated high above rooftops (y ~ 20.5 to 23.0)
  // =========================================================================
  const cablewayGroup = new THREE.Group();
  cablewayGroup.name = 'YangtzeRiverCableway';
  group.add(cablewayGroup);

  const westPylonTop = new THREE.Vector3(-10.8, 24.2, -1.6);
  const eastPylonTop = new THREE.Vector3(10.8, 24.6, -0.6);

  // Twin X-braced steel lattice pylons + red pulsing aviation beacons
  const beaconMaterials: THREE.MeshStandardMaterial[] = [];
  const westPylon = buildCablewayLatticePylon(19.2, darkSteelMat, beaconMaterials);
  westPylon.position.set(westPylonTop.x, 5.0, westPylonTop.z);
  const eastPylon = buildCablewayLatticePylon(19.6, darkSteelMat, beaconMaterials);
  eastPylon.position.set(eastPylonTop.x, 5.0, eastPylonTop.z);
  cablewayGroup.add(westPylon, eastPylon);

  // Taut catenary steel carrier & haulage cables spanning between pylon cross-arms
  const catenaryCurve = new THREE.CatmullRomCurve3([
    westPylonTop.clone().add(new THREE.Vector3(0, -0.35, 0)),
    westPylonTop.clone().lerp(eastPylonTop, 0.25).add(new THREE.Vector3(0, -1.05, 0)),
    westPylonTop.clone().lerp(eastPylonTop, 0.5).add(new THREE.Vector3(0, -1.32, 0)),
    westPylonTop.clone().lerp(eastPylonTop, 0.75).add(new THREE.Vector3(0, -1.05, 0)),
    eastPylonTop.clone().add(new THREE.Vector3(0, -0.35, 0)),
  ]);

  const cableMat = new THREE.MeshStandardMaterial({ color: 0x1e232c, roughness: 0.4, metalness: 0.85 });
  for (const dz of [-0.28, 0.28]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(catenaryCurve, 32, 0.036, 6, false), cableMat);
    cable.position.z = dz;
    cablewayGroup.add(cable);
  }
  // Upper haulage rope
  const haulRope = new THREE.Mesh(new THREE.TubeGeometry(catenaryCurve, 32, 0.022, 6, false), cableMat);
  haulRope.position.y = 0.34;
  cablewayGroup.add(haulRope);

  // Iconic Red-and-Cream Aerial Tramway Gondola Cabin (长江索道轿厢)
  const cablewayCabinGroup = buildYangtzeCablewayCabin();
  cablewayGroup.add(cablewayCabinGroup);

  const cableDir = eastPylonTop.clone().sub(westPylonTop).normalize();
  const cableYaw = Math.atan2(cableDir.z, cableDir.x);

  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      // Keep cabin gliding gracefully across the open sky span cleanly above all rooftops
      let t = 0.42 + Math.sin(ctx.time * 0.22 + 0.2) * 0.26;
      if (ctx.convergence) {
        t = 0.40 + Math.sin(ctx.convergenceProgress * Math.PI * 2) * 0.12;
      }
      const pt = catenaryCurve.getPointAt(THREE.MathUtils.clamp(t, 0.14, 0.72));
      cablewayCabinGroup.position.copy(pt);
      cablewayCabinGroup.rotation.y = -cableYaw;
      // Gentle aerial pendulum sway
      cablewayCabinGroup.rotation.x = Math.sin(ctx.time * 1.15) * 0.035;

      // Red aviation beacon pulse
      const pulse = 0.65 + 0.65 * Math.sin(ctx.time * 3.8);
      for (const bm of beaconMaterials) {
        bm.emissiveIntensity = pulse;
      }
    },
  });

  return { group, animated, snowCaps, monorailTrainGroup, cablewayCabinGroup };
}

/**
 * 3D Protruding Wrought-Iron Security Window Cage (凸出式防盗网) + tiny potted plant + drying laundry
 */
function buildSecurityWindowCage(
  w: number,
  h: number,
  depth: number,
  barMat: THREE.Material,
  extras: {
    hasPlant: boolean;
    laundryColor: number | null;
    potMat: THREE.Material;
    plantMat: THREE.Material;
  }
): THREE.Group {
  const g = new THREE.Group();
  const barR = 0.016;

  // Bottom & top rectangular wire frames projecting out along +Z
  const botFront = new THREE.Mesh(new THREE.BoxGeometry(w, barR * 2, barR * 2), barMat);
  botFront.position.set(0, -h * 0.5, depth);
  const topFront = botFront.clone();
  topFront.position.y = h * 0.5;
  g.add(botFront, topFront);

  // Side horizontal supports
  for (const sy of [-h * 0.5, 0, h * 0.5]) {
    for (const sx of [-w * 0.5, w * 0.5]) {
      const sideBar = new THREE.Mesh(new THREE.BoxGeometry(barR * 2, barR * 2, depth), barMat);
      sideBar.position.set(sx, sy, depth * 0.5);
      g.add(sideBar);
    }
  }

  // Vertical front bars
  for (let i = 0; i <= 5; i++) {
    const bx = -w * 0.5 + (i / 5) * w;
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(barR * 1.8, h, barR * 1.8), barMat);
    vBar.position.set(bx, 0, depth);
    g.add(vBar);
  }

  // Tiny terracotta potted plant inside security cage
  if (extras.hasPlant) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.14, 7), extras.potMat);
    pot.position.set(-w * 0.25, -h * 0.5 + 0.08, depth * 0.55);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), extras.plantMat);
    bush.position.set(-w * 0.25, -h * 0.5 + 0.2, depth * 0.55);
    g.add(pot, bush);
  }

  // Colorful tiny drying laundry hint hanging from top rail
  if (extras.laundryColor !== null) {
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.36, 0.04),
      new THREE.MeshStandardMaterial({ color: extras.laundryColor, roughness: 0.85 })
    );
    cloth.position.set(w * 0.22, h * 0.22, depth + 0.04);
    cloth.rotation.z = 0.06;
    g.add(cloth);
  }

  return g;
}

/**
 * 4-Car Articulated Chongqing CRT Line 2 Straddle Monorail (emerald-green / silver / white)
 */
function buildCRTLine2Monorail(): THREE.Group {
  const train = new THREE.Group();
  train.name = 'CRTLine2Monorail';

  const whiteBodyMat = new THREE.MeshStandardMaterial({
    color: 0xe6eae8,
    roughness: 0.26,
    metalness: 0.35,
  });
  const emeraldMat = new THREE.MeshStandardMaterial({
    color: 0x127852,
    roughness: 0.28,
    metalness: 0.32,
  });
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xbcc4cc,
    roughness: 0.28,
    metalness: 0.65,
  });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x222830, roughness: 0.65 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x101822, roughness: 0.12, metalness: 0.85 });
  const cabinLightMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cf,
    emissive: 0xffd996,
    emissiveIntensity: 0.78,
  });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e8a62, roughness: 0.6 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e2,
    emissive: 0xffe4a8,
    emissiveIntensity: 1.35,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff2820,
    emissiveIntensity: 1.15,
  });

  const ledTex = createSignTexture({
    text: '2号线 · 较场口',
    width: 320,
    height: 64,
    bg: '#0c100d',
    fg: '#ffb83c',
    glow: '#ff901e',
    fontSize: 34,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    map: ledTex,
    emissiveMap: ledTex,
    emissive: new THREE.Color(0xffaa33),
    emissiveIntensity: 0.92,
  });

  const carLen = 3.15;
  const carW = 1.96;
  const spacing = 3.45;
  const carIndices = [-1.5, -0.5, 0.5, 1.5];

  for (let i = 0; i < 4; i++) {
    const cx = carIndices[i] * spacing;
    const car = new THREE.Group();
    car.position.x = cx;
    train.add(car);

    // Straddle bogie skirts hugging BOTH sides of the concrete viaduct beam!
    for (const sz of [-0.66, 0.66]) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(carLen * 0.96, 0.82, 0.34), skirtMat);
      skirt.position.set(0, 0.42, sz);
      car.add(skirt);
    }

    // Recessed lit passenger cabin interior + seats + 扶手吊环 handstraps
    const cabinInner = new THREE.Mesh(new THREE.BoxGeometry(carLen - 0.14, 1.38, carW - 0.24), cabinLightMat);
    cabinInner.position.y = 1.65;
    car.add(cabinInner);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(carLen - 0.5, 0.2, 0.32), seatMat);
    bench.position.set(0, 1.18, -0.56);
    car.add(bench);

    for (let hx = -1.0; hx <= 1.0; hx += 0.4) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 10), seatMat);
      ring.position.set(hx, 2.12, 0.2);
      car.add(ring);
    }

    // Lower silver & emerald-green livery body panels
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.64, carW), silverMat);
    lowerBody.position.y = 1.04;
    const emeraldStripe = new THREE.Mesh(new THREE.BoxGeometry(carLen + 0.02, 0.28, carW + 0.02), emeraldMat);
    emeraldStripe.position.y = 1.18;
    const upperHeader = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.36, carW), whiteBodyMat);
    upperHeader.position.y = 2.42;
    car.add(lowerBody, emeraldStripe, upperHeader);

    // Curved rooftop shell + HVAC pod
    const roof = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.22, carW * 0.88), whiteBodyMat);
    roof.position.y = 2.68;
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, 1.02), silverMat);
    hvac.position.y = 2.86;
    car.add(roof, hvac);

    // Side window pillars
    for (const sz of [-1, 1]) {
      for (const px of [-1.48, -0.52, 0.52, 1.48]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.08), whiteBodyMat);
        pillar.position.set(px, 1.82, sz * (carW * 0.5 - 0.03));
        car.add(pillar);
      }
    }

    // Aerodynamic sculpted cab noses on Car 0 (West, -X) and Car 3 (East, +X)
    if (i === 0 || i === 3) {
      const dir = i === 0 ? -1 : 1;
      const nose = new THREE.Group();
      nose.position.x = dir * (carLen * 0.5);
      car.add(nose);

      const noseBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.85, carW * 0.94), whiteBodyMat);
      noseBody.position.set(dir * 0.38, 1.68, 0);
      const noseGreen = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, carW * 0.96), emeraldMat);
      noseGreen.position.set(dir * 0.42, 1.08, 0);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, carW * 0.84), visorMat);
      visor.position.set(dir * 0.64, 1.98, 0);
      visor.rotation.z = -dir * 0.28;
      nose.add(noseBody, noseGreen, visor);

      // Amber LED destination strip (2号线 · 较场口)
      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.2), ledMat);
      led.rotation.y = dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      led.position.set(dir * 0.82, 2.45, 0);
      nose.add(led);

      // Headlights on West front nose (-1) / Taillights on East nose (+1)
      for (const hz of [-0.54, 0.54]) {
        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.14, 0.24),
          dir < 0 ? headMat : tailMat
        );
        lamp.position.set(dir * 0.85, 1.15, hz);
        nose.add(lamp);
      }
    }
  }

  // Articulated accordion gangway bellows between all 4 cars
  for (const gx of [-spacing, 0, spacing]) {
    const bellow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.96, 1.54), skirtMat);
    bellow.position.set(gx, 1.66, 0);
    train.add(bellow);
  }

  return train;
}

/**
 * X-Braced Steel Lattice Pylon for Yangtze River Cableway + Red Aviation Beacon
 */
function buildCablewayLatticePylon(
  height: number,
  steelMat: THREE.Material,
  beaconMaterials: THREE.MeshStandardMaterial[]
): THREE.Group {
  const g = new THREE.Group();

  // 4 tapered corner steel legs
  const baseHalf = 0.72;
  const topHalf = 0.34;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p0 = new THREE.Vector3(sx * baseHalf, 0, sz * baseHalf);
      const p1 = new THREE.Vector3(sx * topHalf, height, sz * topHalf);
      const curve = new THREE.LineCurve3(p0, p1);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 2, 0.065, 6, false), steelMat));
    }
  }

  // Horizontal tiers + X-bracing
  const tiers = 7;
  for (let t = 0; t < tiers; t++) {
    const y0 = (t / tiers) * height;
    const y1 = ((t + 1) / tiers) * height;
    const r0 = THREE.MathUtils.lerp(baseHalf, topHalf, t / tiers);
    const r1 = THREE.MathUtils.lerp(baseHalf, topHalf, (t + 1) / tiers);

    // Perimeter horizontal brace at y1
    const hBarX = new THREE.BoxGeometry(r1 * 2, 0.06, 0.06);
    const hBarZ = new THREE.BoxGeometry(0.06, 0.06, r1 * 2);
    for (const s of [-1, 1]) {
      const bx = new THREE.Mesh(hBarX, steelMat);
      bx.position.set(0, y1, s * r1);
      const bz = new THREE.Mesh(hBarZ, steelMat);
      bz.position.set(s * r1, y1, 0);
      g.add(bx, bz);

      // Diagonal X-brace on front & back faces
      const d1 = new THREE.LineCurve3(new THREE.Vector3(-r0, y0, s * r0), new THREE.Vector3(r1, y1, s * r1));
      const d2 = new THREE.LineCurve3(new THREE.Vector3(r0, y0, s * r0), new THREE.Vector3(-r1, y1, s * r1));
      g.add(
        new THREE.Mesh(new THREE.TubeGeometry(d1, 2, 0.028, 4, false), steelMat),
        new THREE.Mesh(new THREE.TubeGeometry(d2, 2, 0.028, 4, false), steelMat)
      );
    }
  }

  // Top cable saddle cross-arm & pulley wheels
  const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 1.35), steelMat);
  crossArm.position.set(0, height - 0.32, 0);
  g.add(crossArm);

  // Red aviation beacon atop pylon
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff281c,
    emissiveIntensity: 1.2,
  });
  beaconMaterials.push(beaconMat);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), beaconMat);
  beacon.position.set(0, height + 0.24, 0);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 10, 8),
    createVolumetricHaloMaterial(0xff3828, 0.3, 2.1)
  );
  halo.position.copy(beacon.position);
  g.add(beacon, halo);

  return g;
}

/**
 * Iconic Red-and-Cream Yangtze River Cableway Gondola Cabin (长江索道)
 * Suspended from curved steel hanger arm & 4-wheel roller trolley
 */
function buildYangtzeCablewayCabin(): THREE.Group {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x303640, roughness: 0.4, metalness: 0.78 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc42824, roughness: 0.3, metalness: 0.22 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xefe3cb, roughness: 0.34, metalness: 0.12 });
  const warmCabinMat = new THREE.MeshStandardMaterial({
    color: 0xffe5b0,
    emissive: 0xffc66e,
    emissiveIntensity: 0.82,
  });

  // 4-wheel overhead roller trolley riding along carrier cables
  const trolleyBar = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.72), steelMat);
  trolleyBar.position.set(0, 0.08, 0);
  g.add(trolleyBar);

  const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  wheelGeo.rotateX(Math.PI * 0.5);
  for (const wx of [-0.62, -0.22, 0.22, 0.62]) {
    for (const wz of [-0.28, 0.28]) {
      const wheel = new THREE.Mesh(wheelGeo, steelMat);
      wheel.position.set(wx, 0.06, wz);
      g.add(wheel);
    }
  }

  // Curved steel hanger arm descending cleanly to cabin roof
  const hangerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0, -0.65, -0.34),
    new THREE.Vector3(0, -1.55, 0),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(hangerCurve, 12, 0.065, 8, false), steelMat));

  // Gondola Cabin (centered at y = -2.35)
  const cab = new THREE.Group();
  cab.position.y = -2.35;
  g.add(cab);

  // Warm illuminated interior core + miniature passengers silhouettes
  const innerGlow = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.15, 1.16), warmCabinMat);
  innerGlow.position.y = 0.05;
  cab.add(innerGlow);

  const silMat = new THREE.MeshStandardMaterial({ color: 0x2c2420, roughness: 0.8 });
  for (const px of [-0.7, -0.15, 0.4, 0.85]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 7), silMat);
    p.position.set(px, -0.12, 0.12);
    cab.add(p);
  }

  // Iconic Chongqing red lower hull + cream upper sash & roof!
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.54, 1.36), redMat);
  lowerHull.position.y = -0.42;
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.24, 1.38), creamMat);
  roofCap.position.y = 0.68;
  const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.12, 1.4), redMat);
  roofStripe.position.y = 0.52;
  cab.add(lowerHull, roofCap, roofStripe);

  // Wrap-around cream window frame mullions
  for (const sz of [-0.66, 0.66]) {
    for (const mx of [-1.24, -0.42, 0.42, 1.24]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.08), creamMat);
      m.position.set(mx, 0.16, sz);
      cab.add(m);
    }
  }

  // Subtle side nameplate 「长江索道」
  const plateTex = createSignTexture({
    text: '长江索道',
    width: 256,
    height: 64,
    bg: '#b82420',
    fg: '#fff3d4',
    fontSize: 40,
  });
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.35 });
  const sidePlate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), plateMat);
  sidePlate.position.set(0, -0.42, 0.69);
  cab.add(sidePlate);

  return g;
}
