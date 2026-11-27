import * as THREE from 'three';
import { TextureBundle, createSignTexture } from '../textures';
import { createVolumetricHaloMaterial } from '../shaders';
import { AnimatedEntity, DynamicUpdateContext } from '../types';

export interface TierSubwayResult {
  group: THREE.Group;
  animated: AnimatedEntity[];
  warmLights: THREE.PointLight[];
  metroTrainGroup: THREE.Group;
}

export function buildTierSubway(textures: TextureBundle): TierSubwayResult {
  const group = new THREE.Group();
  group.name = 'TierSubway';

  const animated: AnimatedEntity[] = [];
  const warmLights: THREE.PointLight[] = [];

  // Shared materials
  const strataMat = new THREE.MeshStandardMaterial({
    map: textures.strataAlbedo,
    bumpMap: textures.strataBump,
    bumpScale: 0.14,
    roughness: 0.9,
    metalness: 0.04,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.06,
    roughness: 0.85,
    metalness: 0.05,
  });

  const darkConcreteMat = new THREE.MeshStandardMaterial({
    color: 0x3b3e45,
    roughness: 0.88,
    metalness: 0.06,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    map: textures.brassAlbedo,
    bumpMap: textures.brassBump,
    bumpScale: 0.015,
    roughness: 0.28,
    metalness: 0.85,
  });

  // =========================================================================
  // 1. GEOLOGICAL CUTAWAY SHELL & BASE SLAB (y = -10.8 to -1.2)
  // =========================================================================
  // Solid floor slab spanning entire diorama footprint
  const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.45, 18.0), strataMat);
  baseSlab.position.set(0, -10.58, 0);
  baseSlab.receiveShadow = true;
  group.add(baseSlab);

  // Back bedrock wall (z = -8.75)
  const backBedrock = new THREE.Mesh(new THREE.BoxGeometry(24.0, 9.6, 0.5), strataMat);
  backBedrock.position.set(0, -6.0, -8.75);
  group.add(backBedrock);

  // Left cutaway bedrock wall (x = -11.75) with portal cutout for Metro train entry
  // Front half solid above/below rail, portal opening at z in [1.9, 5.7], y in [-10.3, -5.2]
  const leftBackWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.6, 10.7), strataMat);
  leftBackWall.position.set(-11.75, -6.0, -3.4);
  group.add(leftBackWall);

  const leftFrontPier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.6, 3.1), strataMat);
  leftFrontPier.position.set(-11.75, -6.0, 7.45);
  group.add(leftFrontPier);

  const leftPortalHeader = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.9, 4.2), strataMat);
  leftPortalHeader.position.set(-11.75, -3.15, 3.9);
  group.add(leftPortalHeader);

  // Right bedrock exterior wall (x = +11.75)
  const rightBedrock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.6, 18.0), strataMat);
  rightBedrock.position.set(11.75, -6.0, 0);
  group.add(rightBedrock);

  // Top subterranean roof slab dividing Tier -1 from Tier 0 (y = -1.45)
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.5, 18.0), concreteMat);
  roofSlab.position.set(0, -1.45, 0);
  roofSlab.receiveShadow = true;
  group.add(roofSlab);

  // Stratified central bedrock pier dividing Subway Station (left) from Hotpot Cave (right)
  // Positioned at x = +2.85, thickness 0.85
  const dividerPier = new THREE.Mesh(new THREE.BoxGeometry(0.85, 8.8, 17.4), strataMat);
  dividerPier.position.set(2.85, -6.0, 0);
  group.add(dividerPier);

  // Brass-flanged geological drainage conduits mounted on the front face of the divider pier & left pier
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x4b555f, roughness: 0.42, metalness: 0.72 });
  for (const py of [-3.1, -4.4, -7.8]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65, 14), pipeMat);
    pipe.rotation.x = Math.PI * 0.5;
    pipe.position.set(2.85, py, 8.52);
    group.add(pipe);

    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), brassMat);
    flange.rotation.x = Math.PI * 0.5;
    flange.position.set(2.85, py, 8.76);
    group.add(flange);
  }

  // Side strata drainage pipe running along outer right wall
  const sidePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 8.4, 12), pipeMat);
  sidePipe.position.set(12.06, -6.0, 6.2);
  group.add(sidePipe);
  for (const fy of [-3.2, -5.8, -8.4]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.09, 14), brassMat);
    f.position.set(12.06, fy, 6.2);
    group.add(f);
  }

  // =========================================================================
  // 2. DEEP MOUNTAIN SUBWAY STATION (穿山地铁 · 洪崖雨巷站, x in [-11.5, +2.4])
  // =========================================================================
  const stationGroup = new THREE.Group();
  stationGroup.name = 'SubwayStation';
  group.add(stationGroup);

  // Glazed ceramic tile back wall (z = -8.3)
  const tileWallMat = new THREE.MeshStandardMaterial({
    map: textures.subwayTileAlbedo,
    roughness: 0.32,
    metalness: 0.08,
  });
  const tileBackWall = new THREE.Mesh(new THREE.PlaneGeometry(13.9, 8.2), tileWallMat);
  tileBackWall.position.set(-4.55, -6.2, -8.25);
  stationGroup.add(tileBackWall);

  // UNOBSTRUCTED CUTAWAY TUNNEL ARCH RIBS:
  // Hugging ONLY the upper back wall (above the station signs!) & ceiling to top lip z = +8.15, y = -1.95,
  // NEVER crossing in front of signs, train, or platform sightlines!
  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x5c6068,
    roughness: 0.72,
    metalness: 0.18,
  });
  const archCurvePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const z = -8.2 + t * 16.35;
    const archLift = Math.sin(t * Math.PI) * 0.65;
    const y = THREE.MathUtils.lerp(-3.55, -2.02, Math.pow(t, 0.55)) + archLift * 0.45;
    archCurvePoints.push(new THREE.Vector3(0, Math.min(-1.76, y), z));
  }
  const archCurve = new THREE.CatmullRomCurve3(archCurvePoints);
  const archRibGeo = new THREE.TubeGeometry(archCurve, 24, 0.18, 8, false);

  for (let rx = -10.8; rx <= 1.8; rx += 2.52) {
    const rib = new THREE.Mesh(archRibGeo, ribMat);
    rib.position.x = rx;
    stationGroup.add(rib);
  }

  // Platform deck (z in [-8.2, +1.5], top at y = -9.15)
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x676b74,
    roughness: 0.52,
    metalness: 0.1,
  });
  const platformDeck = new THREE.Mesh(new THREE.BoxGeometry(13.9, 1.25, 9.7), platformMat);
  platformDeck.position.set(-4.55, -9.78, -3.35);
  platformDeck.receiveShadow = true;
  stationGroup.add(platformDeck);

  // Platform granite coping lip
  const copingMat = new THREE.MeshStandardMaterial({ color: 0x8b8f97, roughness: 0.4, metalness: 0.15 });
  const coping = new THREE.Mesh(new THREE.BoxGeometry(13.9, 0.12, 0.45), copingMat);
  coping.position.set(-4.55, -9.11, 1.32);
  stationGroup.add(coping);

  // Yellow bumpy tactile paving strip (盲道) along platform safety line
  const tactileMat = new THREE.MeshStandardMaterial({
    map: textures.tactileAlbedo,
    bumpMap: textures.tactileBump,
    bumpScale: 0.04,
    roughness: 0.62,
    metalness: 0.05,
  });
  const tactileStrip = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.04, 0.58), tactileMat);
  tactileStrip.position.set(-4.55, -9.13, 0.62);
  stationGroup.add(tactileStrip);

  // Recessed ceiling louver light coves (well-calibrated luminance — crisp, ZERO whiteout!)
  const coveFrameMat = new THREE.MeshStandardMaterial({ color: 0x2e333c, roughness: 0.6, metalness: 0.4 });
  const coveEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xf7eee0,
    emissive: 0xffe4bd,
    emissiveIntensity: 0.72,
    roughness: 0.35,
  });
  for (const lz of [-4.2, -0.6, 3.2]) {
    const coveBox = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.18, 0.72), coveFrameMat);
    coveBox.position.set(-4.55, -2.06, lz);
    stationGroup.add(coveBox);

    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 0.52), coveEmissiveMat);
    diffuser.rotation.x = Math.PI * 0.5;
    diffuser.position.set(-4.55, -2.16, lz);
    stationGroup.add(diffuser);
  }

  // Crisp calibrated Chinese Station Signboards on back wall (z = -8.12)
  const mainSignTex = createSignTexture({
    text: '洪崖雨巷站',
    subtext: 'HONGYA YUXIANG STA.',
    width: 768,
    height: 196,
    bg: '#1c2330',
    fg: '#f7f2e8',
    border: '#c23430',
    badge: '渝',
    badgeColor: '#b92a28',
    fontSize: 66,
    subFontSize: 28,
  });
  const mainSignMat = new THREE.MeshStandardMaterial({
    map: mainSignTex,
    emissiveMap: mainSignTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.48,
    roughness: 0.35,
  });
  const mainSignBoard = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.48, 0.14), [
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    mainSignMat,
    coveFrameMat,
  ]);
  mainSignBoard.position.set(-4.6, -4.95, -8.1);
  stationGroup.add(mainSignBoard);

  // Left directional sign (← 2号线·李子坝)
  const leftDirTex = createSignTexture({
    text: '← 2号线 · 李子坝',
    subtext: 'TO LIZIBA MONORAIL',
    width: 512,
    height: 140,
    bg: '#19352b',
    fg: '#ecfff5',
    border: '#35a87a',
    fontSize: 44,
    subFontSize: 22,
  });
  const leftDirMat = new THREE.MeshStandardMaterial({
    map: leftDirTex,
    emissiveMap: leftDirTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const leftDirBoard = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.88, 0.12), [
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    leftDirMat,
    coveFrameMat,
  ]);
  leftDirBoard.position.set(-9.5, -5.05, -8.1);
  stationGroup.add(leftDirBoard);

  // Right exit sign (防空洞老街出口 →)
  const rightDirTex = createSignTexture({
    text: '防空洞老街出口 →',
    subtext: 'AIR-RAID SHELTER EXIT',
    width: 512,
    height: 140,
    bg: '#322014',
    fg: '#ffe4a8',
    border: '#d69032',
    fontSize: 40,
    subFontSize: 22,
  });
  const rightDirMat = new THREE.MeshStandardMaterial({
    map: rightDirTex,
    emissiveMap: rightDirTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const rightDirBoard = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.88, 0.12), [
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    rightDirMat,
    coveFrameMat,
  ]);
  rightDirBoard.position.set(0.3, -5.05, -8.1);
  stationGroup.add(rightDirBoard);

  // Hanging overhead platform lightbox sign (clearly visible above train roof)
  const hangingSign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 0.16), [
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    coveFrameMat,
    mainSignMat,
    mainSignMat,
  ]);
  hangingSign.position.set(-4.6, -3.55, -2.2);
  stationGroup.add(hangingSign);
  for (const hx of [-6.4, -2.8]) {
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), coveFrameMat);
    hanger.position.set(hx, -2.65, -2.2);
    stationGroup.add(hanger);
  }

  // Structural platform pillars cleanly placed BETWEEN back-wall signs (ZERO sign obstruction!)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xbab6ae, roughness: 0.42, metalness: 0.15 });
  const pillarAccentMat = new THREE.MeshStandardMaterial({ color: 0xa62628, roughness: 0.38, metalness: 0.2 });
  for (const px of [-11.15, -7.7, -1.45, 2.08]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.46, 7.2, 0.46), pillarMat);
    pil.position.set(px, -5.55, -5.2);
    stationGroup.add(pil);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.5), pillarAccentMat);
    band.position.set(px, -6.2, -5.2);
    stationGroup.add(band);
  }

  // Stainless steel platform benches
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xadb4be, roughness: 0.3, metalness: 0.8 });
  for (const bx of [-7.0, -2.2]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.09, 0.56), steelMat);
    seat.position.set(bx, -8.62, -2.6);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.06), steelMat);
    back.position.set(bx, -8.38, -2.88);
    stationGroup.add(seat, back);
    for (const lx of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.46), steelMat);
      leg.position.set(bx + lx, -8.88, -2.6);
      stationGroup.add(leg);
    }
  }

  // Waiting miniature commuters on platform
  const commuterSpecs: Array<[number, number, number, number]> = [
    [-8.1, -0.55, 0x2d4868, 0.18],
    [-6.6, -2.4, 0x7c3b36, 0.0], // seated near bench
    [-5.1, -0.45, 0x4b5c49, -0.15],
    [-3.4, -0.8, 0x9b7242, 0.22],
    [-1.1, -0.5, 0x3b3d4a, -0.1],
    [0.9, -1.2, 0x6e3242, 0.3],
  ];
  for (const [cx, cz, coatColor, yaw] of commuterSpecs) {
    const person = createMiniaturePerson(coatColor, false);
    person.position.set(cx, -9.15, cz);
    person.rotation.y = yaw;
    stationGroup.add(person);
  }

  // Steel rails, sleepers & track ballast (z = 2.6 to 6.2)
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.25, 6.2), darkConcreteMat);
  ballast.position.set(-4.5, -10.28, 4.7);
  stationGroup.add(ballast);

  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x4d4a46, roughness: 0.9 });
  const sleeperGeo = new THREE.BoxGeometry(0.24, 0.12, 2.35);
  const sleeperMesh = new THREE.InstancedMesh(sleeperGeo, sleeperMat, 26);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 26; i++) {
    dummy.position.set(-11.2 + i * 0.54, -10.12, 4.15);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    sleeperMesh.setMatrixAt(i, dummy.matrix);
  }
  sleeperMesh.instanceMatrix.needsUpdate = true;
  stationGroup.add(sleeperMesh);

  const railMat = new THREE.MeshStandardMaterial({ color: 0x9ba2ac, roughness: 0.28, metalness: 0.88 });
  for (const rz of [3.35, 4.95]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.14, 0.09), railMat);
    rail.position.set(-4.4, -10.02, rz);
    stationGroup.add(rail);
  }

  // =========================================================================
  // 3. AERODYNAMIC RED-AND-SILVER CHONGQING METRO TRAIN
  // =========================================================================
  const metroTrainGroup = buildChongqingMetroTrain();
  metroTrainGroup.position.set(-5.1, -9.95, 4.15);
  stationGroup.add(metroTrainGroup);

  // Keep both sculpted aerodynamic cab noses cleanly inside the station span [-11.2, +2.0] (ZERO clipping!)
  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      if (ctx.convergence) {
        const targetX = -4.9 + Math.sin(ctx.convergenceProgress * Math.PI * 2) * 0.9;
        metroTrainGroup.position.x = THREE.MathUtils.lerp(metroTrainGroup.position.x, targetX, Math.min(1, ctx.dt * 3.5));
      } else {
        const cycle = (ctx.time * 0.16) % 1;
        let offset = 0;
        if (cycle < 0.35) {
          const u = cycle / 0.35;
          const ease = 1 - Math.pow(1 - u, 3);
          offset = THREE.MathUtils.lerp(-1.25, 0.65, ease);
        } else if (cycle < 0.72) {
          offset = 0.65; // Station dwell showing full sculpted nose & commuters
        } else {
          const u = (cycle - 0.72) / 0.28;
          const ease = u * u * (3 - 2 * u);
          offset = THREE.MathUtils.lerp(0.65, -1.25, ease);
        }
        metroTrainGroup.position.x = -5.1 + offset;
      }
    },
  });

  // Calibrated station lighting (clean neutral-warm architectural illumination, zero bloom blowout)
  const staLight1 = new THREE.PointLight(0xffe6c2, 9.5, 16, 1.5);
  staLight1.position.set(-7.2, -3.6, 0.5);
  const staLight2 = new THREE.PointLight(0xffeed6, 9.5, 16, 1.5);
  staLight2.position.set(-1.8, -3.6, 1.2);
  stationGroup.add(staLight1, staLight2);
  warmLights.push(staLight1, staLight2);

  // =========================================================================
  // 4. AIR-RAID SHELTER UNDERGROUND HOTPOT CAVE (防空洞地下老火锅, x in [+3.3, +11.5])
  // =========================================================================
  const caveGroup = new THREE.Group();
  caveGroup.name = 'HotpotCave';
  group.add(caveGroup);

  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.vaultBrickAlbedo,
    bumpMap: textures.vaultBrickBump,
    bumpScale: 0.12,
    roughness: 0.82,
    metalness: 0.05,
  });

  // Cave stone floor (x in [3.3, 11.5], z in [-8.4, +8.4])
  const caveFloorMat = new THREE.MeshStandardMaterial({
    map: textures.bluestoneAlbedo,
    bumpMap: textures.bluestoneBump,
    bumpScale: 0.05,
    color: 0x8b7e72,
    roughness: 0.65,
    metalness: 0.08,
  });
  const caveFloor = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.32, 16.8), caveFloorMat);
  caveFloor.position.set(7.4, -10.22, 0);
  caveFloor.receiveShadow = true;
  caveGroup.add(caveFloor);

  // Vaulted semicircular brick cavern ceiling + side walls (open at front z = +8.3 for unobstructed cutaway!)
  const vaultGeo = new THREE.CylinderGeometry(4.05, 4.05, 16.5, 24, 1, true, 0, Math.PI);
  // Rotate so cylinder runs along Z and arch crowns upward (+Y)
  vaultGeo.rotateZ(Math.PI * 0.5);
  vaultGeo.rotateY(Math.PI * 0.5);
  const vaultMat = brickMat.clone();
  vaultMat.side = THREE.BackSide;
  const vaultShell = new THREE.Mesh(vaultGeo, vaultMat);
  vaultShell.position.set(7.4, -6.2, 0);
  caveGroup.add(vaultShell);

  // Lower vertical brick side walls below vault springline (y = -10.1 to -6.2)
  const caveLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.0, 16.5), brickMat);
  caveLeftWall.position.set(3.42, -8.2, 0);
  const caveRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.0, 16.5), brickMat);
  caveRightWall.position.set(11.38, -8.2, 0);
  const caveBackWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 8.2, 0.35), brickMat);
  caveBackWall.position.set(7.4, -6.2, -8.2);
  caveGroup.add(caveLeftWall, caveRightWall, caveBackWall);

  // Masonry arch ribs inside vault (stopping cleanly at z = +8.1)
  const ribArcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    ribArcPoints.push(new THREE.Vector3(Math.cos(a) * 3.92, Math.sin(a) * 3.92, 0));
  }
  const ribArcCurve = new THREE.CatmullRomCurve3(ribArcPoints);
  const caveRibGeo = new THREE.TubeGeometry(ribArcCurve, 22, 0.16, 8, false);
  for (const rz of [-6.8, -3.4, 0.0, 3.4, 6.8]) {
    const archRib = new THREE.Mesh(caveRibGeo, brickMat);
    archRib.position.set(7.4, -6.2, rz);
    caveGroup.add(archRib);
  }

  // Front-top Air-Raid Shelter Arch Plaque: ★ 人防防空洞 · 1969 ★
  const plaque1969Tex = createSignTexture({
    text: '★ 人防防空洞 · 1969 ★',
    width: 640,
    height: 112,
    bg: '#4b3b2c',
    fg: '#f6d27a',
    border: '#c29248',
    fontSize: 44,
  });
  const plaque1969Mat = new THREE.MeshStandardMaterial({
    map: plaque1969Tex,
    emissiveMap: plaque1969Tex,
    emissive: new THREE.Color(0xffcf88),
    emissiveIntensity: 0.4,
    roughness: 0.5,
  });
  const plaque1969 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 0.16), [
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    plaque1969Mat,
    darkConcreteMat,
  ]);
  plaque1969.position.set(7.4, -2.55, 7.65);
  caveGroup.add(plaque1969);

  // Glowing 「防空洞老火锅」 signboard beneath the arch plaque (super inviting from Hero Key 1!)
  const caveSignTex = createSignTexture({
    text: '防空洞老火锅',
    subtext: '地道老油 · 九宫格',
    width: 560,
    height: 160,
    bg: '#4d1110',
    fg: '#ffdf8c',
    border: '#e08b36',
    glow: '#ff5226',
    fontSize: 64,
    subFontSize: 26,
  });
  const caveSignMat = new THREE.MeshStandardMaterial({
    map: caveSignTex,
    emissiveMap: caveSignTex,
    emissive: new THREE.Color(0xffb870),
    emissiveIntensity: 0.72,
    roughness: 0.35,
  });
  const caveSignBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.05, 0.16), [
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    caveSignMat,
    darkConcreteMat,
  ]);
  caveSignBoard.position.set(7.4, -3.65, 7.15);
  caveGroup.add(caveSignBoard);

  // Back wall wooden menu plaque inside the cave
  const caveMenuTex = createSignTexture({
    text: '鲜毛肚 · 冰球鹅肠 · 嫩鸭血',
    subtext: '九宫格老油锅底 · 山城冰啤酒',
    width: 640,
    height: 170,
    bg: '#381912',
    fg: '#ffe2a0',
    border: '#b57b3b',
    fontSize: 40,
    subFontSize: 24,
  });
  const caveMenuMat = new THREE.MeshStandardMaterial({
    map: caveMenuTex,
    emissiveMap: caveMenuTex,
    emissive: new THREE.Color(0xffcc88),
    emissiveIntensity: 0.36,
    roughness: 0.55,
  });
  const caveMenu = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.25, 0.12), [
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    darkConcreteMat,
    caveMenuMat,
    darkConcreteMat,
  ]);
  caveMenu.position.set(7.4, -6.2, -7.95);
  caveGroup.add(caveMenu);

  // Draped Edison festoon string lights along the vaulted ceiling
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x1a1816 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe4ad,
    emissive: 0xffb347,
    emissiveIntensity: 1.05,
    roughness: 0.2,
  });
  const bulbGeo = new THREE.SphereGeometry(0.085, 8, 8);
  for (const [xStart, xEnd, zStart, zEnd] of [
    [4.1, 10.7, 5.2, 3.6],
    [10.7, 4.1, 2.2, -0.4],
    [4.1, 10.7, -1.6, -4.6],
  ]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = THREE.MathUtils.lerp(xStart, xEnd, t);
      const z = THREE.MathUtils.lerp(zStart, zEnd, t);
      const sag = Math.sin(t * Math.PI) * 0.65;
      pts.push(new THREE.Vector3(x, -4.15 - sag, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    caveGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.018, 5, false), wireMat));
    for (let i = 1; i < 10; i += 2) {
      const b = new THREE.Mesh(bulbGeo, bulbMat);
      b.position.copy(pts[i]);
      b.position.y -= 0.08;
      caveGroup.add(b);
    }
  }

  // 4 glowing red 「渝」 silk lanterns hanging inside the hotpot cave
  const caveLanterns: THREE.Group[] = [];
  const lanternCoords: Array<[number, number, number]> = [
    [5.3, -4.7, 4.8],
    [9.5, -4.7, 4.8],
    [5.3, -4.7, -1.8],
    [9.5, -4.7, -1.8],
  ];
  for (let i = 0; i < lanternCoords.length; i++) {
    const [lx, ly, lz] = lanternCoords[i];
    const lantern = createRedSilkLantern(0.42);
    lantern.position.set(lx, ly, lz);
    caveGroup.add(lantern);
    caveLanterns.push(lantern);
  }

  // 4 wooden round tables with boiling crimson nine-grid copper hotpots, bowls/bottles, stools & seated diners
  const steamPositions: THREE.Vector3[] = [];
  const tableCoords: Array<[number, number]> = [
    [5.6, 3.6],
    [9.2, 3.2],
    [5.7, -2.0],
    [9.1, -2.4],
  ];
  for (const [tx, tz] of tableCoords) {
    const tableSet = createHotpotTableSet(true);
    tableSet.position.set(tx, -10.05, tz);
    caveGroup.add(tableSet);
    steamPositions.push(new THREE.Vector3(tx, -8.85, tz));
  }

  // Rising steam wisps above the 4 cave hotpots
  const caveSteam = createRisingSteamSystem(steamPositions, textures.steamPuff, 28);
  caveGroup.add(caveSteam.group);
  animated.push(caveSteam.animated);

  // Gentle sway on cave lanterns
  animated.push({
    update: (ctx: DynamicUpdateContext) => {
      caveLanterns.forEach((l, i) => {
        l.rotation.z = Math.sin(ctx.time * 1.4 + i * 1.7) * 0.045;
      });
    },
  });

  // Warm inviting golden-amber fill lights inside the cave (glows warmly from Hero Key 1!)
  const caveLightFront = new THREE.PointLight(0xff9640, 14.0, 14, 1.4);
  caveLightFront.position.set(7.4, -5.8, 3.4);
  const caveLightBack = new THREE.PointLight(0xff7832, 11.5, 13, 1.4);
  caveLightBack.position.set(7.4, -5.8, -2.8);
  caveGroup.add(caveLightFront, caveLightBack);
  warmLights.push(caveLightFront, caveLightBack);

  // =========================================================================
  // 5. OPEN CUTAWAY BRUSHED-BRASS ARCHITECTURAL TRIM FRAME (NO GLASS)
  // =========================================================================
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.14, 0.14), brassMat);
  topBar.position.set(0, -1.42, 8.95);
  const botBar = topBar.clone();
  botBar.position.y = -10.58;
  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 9.3, 0.14), brassMat);
  leftBar.position.set(-11.82, -6.0, 8.95);
  const rightBar = leftBar.clone();
  rightBar.position.x = 11.82;
  group.add(topBar, botBar, leftBar, rightBar);

  return { group, animated, warmLights, metroTrainGroup };
}

/**
 * Aerodynamic Red-and-Silver Chongqing Metro Train (3 articulated cars)
 */
function buildChongqingMetroTrain(): THREE.Group {
  const train = new THREE.Group();
  train.name = 'ChongqingMetroTrain';

  const bodySilverMat = new THREE.MeshStandardMaterial({
    color: 0xd6dbe2,
    roughness: 0.24,
    metalness: 0.62,
  });
  const liveryRedMat = new THREE.MeshStandardMaterial({
    color: 0xb82228,
    roughness: 0.28,
    metalness: 0.32,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e26,
    roughness: 0.35,
    metalness: 0.45,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x101722,
    roughness: 0.12,
    metalness: 0.85,
  });
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0xffe6bf,
    emissive: 0xffd79a,
    emissiveIntensity: 0.72,
    roughness: 0.5,
  });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xb53c34, roughness: 0.6 });
  const hvacMat = new THREE.MeshStandardMaterial({ color: 0x8f96a0, roughness: 0.45, metalness: 0.5 });

  // Destination LED strip texture
  const ledTex = createSignTexture({
    text: '洪崖雨巷 · 方向',
    width: 320,
    height: 64,
    bg: '#120d08',
    fg: '#ffb63d',
    glow: '#ff8a1e',
    fontSize: 34,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    map: ledTex,
    emissiveMap: ledTex,
    emissive: new THREE.Color(0xffaa33),
    emissiveIntensity: 0.92,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e2,
    emissive: 0xffe9b5,
    emissiveIntensity: 1.35,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff2820,
    emissiveIntensity: 1.15,
  });

  const carLen = 3.15;
  const carW = 2.02;
  const spacing = 3.48;

  // Build 3 cars: left cab (-1), middle coach (0), right cab (+1)
  for (let c = -1; c <= 1; c++) {
    const car = new THREE.Group();
    car.position.x = c * spacing;
    train.add(car);

    // Lower chassis & bogie skirt
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.42, carW * 0.92), darkTrimMat);
    skirt.position.y = 0.52;
    car.add(skirt);

    // Detailed bogies & wheelsets on steel rails
    for (const bx of [-0.95, 0.95]) {
      const bogieFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 1.72), darkTrimMat);
      bogieFrame.position.set(bx, 0.34, 0);
      car.add(bogieFrame);
      for (const wx of [-0.3, 0.3]) {
        for (const wz of [-0.8, 0.8]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.11, 12), hvacMat);
          wheel.rotation.x = Math.PI * 0.5;
          wheel.position.set(bx + wx, 0.24, wz);
          car.add(wheel);
        }
      }
    }

    // Recessed lit passenger cabin core
    const cabinInner = new THREE.Mesh(new THREE.BoxGeometry(carLen - 0.16, 1.55, carW - 0.24), interiorMat);
    cabinInner.position.y = 1.62;
    car.add(cabinInner);

    // Miniature seats & hanging handstraps (扶手吊环) inside cabin visible through front windows
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(carLen - 0.45, 0.22, 0.38), seatMat);
    benchSeat.position.set(0, 1.15, -0.58);
    car.add(benchSeat);

    const strapRail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, carLen - 0.55, 6), hvacMat);
    strapRail.rotation.z = Math.PI * 0.5;
    strapRail.position.set(0, 2.22, 0.22);
    car.add(strapRail);
    for (let sx = -1.0; sx <= 1.0; sx += 0.4) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 10), seatMat);
      ring.position.set(sx, 2.08, 0.22);
      car.add(ring);
    }

    // Exterior silver lower + upper body walls with real punched window cutouts!
    const lowerSide = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.72, carW), bodySilverMat);
    lowerSide.position.y = 1.06;
    car.add(lowerSide);

    // Signature Chongqing crimson livery waist stripe
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(carLen + 0.02, 0.26, carW + 0.02), liveryRedMat);
    redStripe.position.y = 1.24;
    car.add(redStripe);

    // Upper header fascia above windows
    const upperSide = new THREE.Mesh(new THREE.BoxGeometry(carLen, 0.42, carW), bodySilverMat);
    upperSide.position.y = 2.48;
    car.add(upperSide);

    // Curved roof crown
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(carW * 0.49, carW * 0.5, carLen, 14, 1, false, 0, Math.PI),
      bodySilverMat
    );
    roof.rotation.z = Math.PI * 0.5;
    roof.scale.set(0.32, 1, 1);
    roof.position.y = 2.66;
    car.add(roof);

    // Window pillars & etched sliding-door seams along both Z faces
    for (const sz of [-1, 1]) {
      const zFace = sz * (carW * 0.5 - 0.04);
      for (const px of [-1.48, -0.5, 0.5, 1.48]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.92, 0.1), bodySilverMat);
        pillar.position.set(px, 1.85, zFace);
        car.add(pillar);
      }
      // Sliding door seam frames
      for (const dx of [-0.5, 0.5]) {
        const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.85, 0.04), darkTrimMat);
        doorSeam.position.set(dx, 1.66, sz * (carW * 0.5 + 0.015));
        car.add(doorSeam);
      }
    }

    // Louvered rooftop HVAC pods
    for (const hx of [-0.82, 0.82]) {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 1.15), hvacMat);
      hvac.position.set(hx, 2.94, 0);
      car.add(hvac);
    }

    // Sculpted aerodynamic beveled fiberglass cab nose on ends (c = -1 and c = +1)
    if (c !== 0) {
      const dir = c; // +1 right nose, -1 left nose
      const noseGroup = new THREE.Group();
      noseGroup.position.x = dir * (carLen * 0.5);
      car.add(noseGroup);

      // Tapered aerodynamic nose cone
      const noseGeo = new THREE.CylinderGeometry(0.76, 1.02, 1.15, 16);
      noseGeo.rotateZ(-dir * Math.PI * 0.5);
      const noseShell = new THREE.Mesh(noseGeo, bodySilverMat);
      noseShell.scale.set(1.0, 1.18, 1.0);
      noseShell.position.set(dir * 0.52, 1.72, 0);
      noseGroup.add(noseShell);

      // Red lower cowling bumper
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.62, carW * 0.9), liveryRedMat);
      bumper.position.set(dir * 0.42, 0.96, 0);
      noseGroup.add(bumper);

      // Flush wrap-around panoramic tinted windshield
      const wind = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.84, carW * 0.84), visorMat);
      wind.position.set(dir * 0.72, 2.02, 0);
      wind.rotation.z = -dir * 0.26;
      noseGroup.add(wind);

      // Glowing amber LED destination display above windshield
      const ledPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.22), ledMat);
      ledPlane.rotation.y = dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      ledPlane.position.set(dir * 0.86, 2.52, 0);
      noseGroup.add(ledPlane);

      // Dual headlights (right nose) / red marker lights (left nose)
      for (const hz of [-0.58, 0.58]) {
        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.16, 0.28),
          dir > 0 ? headlightMat : tailMat
        );
        lamp.position.set(dir * 0.92, 1.12, hz);
        noseGroup.add(lamp);
      }
    }
  }

  // Accordion gangway bellows between cars
  const bellowMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.82 });
  for (const gx of [-spacing * 0.5, spacing * 0.5]) {
    const bellow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.15, 1.65), bellowMat);
    bellow.position.set(gx, 1.68, 0);
    train.add(bellow);
  }

  return train;
}

/**
 * Shared Helper: Crimson ribbed silk lantern with gold end-caps & tassel
 */
export function createRedSilkLantern(scale = 0.36): THREE.Group {
  const g = new THREE.Group();
  const silkMat = new THREE.MeshStandardMaterial({
    color: 0xd6241c,
    emissive: 0xff3b1f,
    emissiveIntensity: 0.88,
    roughness: 0.45,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe3b857,
    emissive: 0xc28a2e,
    emissiveIntensity: 0.22,
    roughness: 0.35,
    metalness: 0.72,
  });

  // Cord
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, scale * 1.1, 6), goldMat);
  cord.position.y = scale * 0.85;
  g.add(cord);

  // Ribbed ovoid lantern body
  const body = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.65, 14, 10), silkMat);
  body.scale.set(1.0, 1.12, 1.0);
  g.add(body);

  // Top & bottom gold caps
  const capGeo = new THREE.CylinderGeometry(scale * 0.32, scale * 0.32, scale * 0.14, 10);
  const topCap = new THREE.Mesh(capGeo, goldMat);
  topCap.position.y = scale * 0.68;
  const botCap = topCap.clone();
  botCap.position.y = -scale * 0.68;
  g.add(topCap, botCap);

  // Gold silk tassel
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.14, scale * 0.58, 8), goldMat);
  tassel.position.y = -scale * 1.02;
  g.add(tassel);

  // Soft warm volumetric glow halo around lantern (Metal safe)
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 1.25, 12, 10),
    createVolumetricHaloMaterial(0xff6b35, 0.24, 2.2)
  );
  g.add(halo);

  return g;
}

/**
 * Shared Helper: Wooden Round Table + Boiling Crimson Nine-Grid Copper Hotpot (九宫格) + Stools + Diners
 */
export function createHotpotTableSet(withDiners = true): THREE.Group {
  const g = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3621, roughness: 0.65 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xc77d42, roughness: 0.32, metalness: 0.82 });
  const brothMat = new THREE.MeshStandardMaterial({
    color: 0x9e1810,
    emissive: 0xd93514,
    emissiveIntensity: 0.82,
    roughness: 0.22,
  });
  const stoolMat = new THREE.MeshStandardMaterial({ color: 0xa62620, roughness: 0.58 });
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x2c7838, roughness: 0.25, metalness: 0.1 });
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xebe5d9, roughness: 0.35 });

  // Round table top & pedestal
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.08, 16), woodMat);
  top.position.y = 0.78;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 0.78, 10), woodMat);
  leg.position.y = 0.39;
  g.add(top, leg);

  // Copper hotpot basin
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.31, 0.18, 16), copperMat);
  pot.position.y = 0.9;
  g.add(pot);

  // Glowing crimson chili broth
  const broth = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 16), brothMat);
  broth.position.y = 0.985;
  g.add(broth);

  // Nine-grid stainless/copper divider bars (九宫格)
  const barGeoA = new THREE.BoxGeometry(0.62, 0.05, 0.022);
  const barGeoB = new THREE.BoxGeometry(0.022, 0.05, 0.62);
  for (const offset of [-0.11, 0.11]) {
    const b1 = new THREE.Mesh(barGeoA, copperMat);
    b1.position.set(0, 1.0, offset);
    const b2 = new THREE.Mesh(barGeoB, copperMat);
    b2.position.set(offset, 1.0, 0);
    g.add(b1, b2);
  }

  // Tiny bowls & green Chongqing beer bottles
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.055, 10), bowlMat);
    bowl.position.set(Math.cos(a) * 0.58, 0.85, Math.sin(a) * 0.58);
    g.add(bowl);

    if (i % 2 === 0) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.24, 8), bottleMat);
      bottle.position.set(Math.cos(a + 0.35) * 0.62, 0.94, Math.sin(a + 0.35) * 0.62);
      g.add(bottle);
    }
  }

  // 4 stools + 2–3 seated miniature diners
  const dinerCoats = [0x344a66, 0x854236, 0x4b5c42, 0x725236];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const sx = Math.cos(a) * 1.12;
    const sz = Math.sin(a) * 1.12;
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.46, 10), stoolMat);
    stool.position.set(sx, 0.23, sz);
    g.add(stool);

    if (withDiners && i < 3) {
      const diner = createMiniaturePerson(dinerCoats[i % dinerCoats.length], true);
      diner.position.set(sx, 0.44, sz);
      diner.lookAt(0, 0.44, 0);
      g.add(diner);
    }
  }

  return g;
}

/**
 * Shared Helper: Articulated miniature human figure (standing or seated)
 */
export function createMiniaturePerson(coatHex: number, seated = false): THREE.Group {
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: coatHex, roughness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6be9a, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1716, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x242830, roughness: 0.85 });

  if (seated) {
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.48, 8), coatMat);
    torso.position.y = 0.26;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), skinMat);
    head.position.y = 0.6;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.116, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    hair.position.y = 0.62;
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.26), pantsMat);
    lap.position.set(0, 0.06, 0.12);
    g.add(torso, head, hair, lap);
  } else {
    // Legs
    for (const lx of [-0.065, 0.065]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.68, 8), pantsMat);
      leg.position.set(lx, 0.34, 0);
      g.add(leg);
    }
    // Coat torso
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.66, 9), coatMat);
    coat.position.y = 0.98;
    // Head + hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), skinMat);
    head.position.y = 1.44;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
    hair.position.y = 1.46;
    g.add(coat, head, hair);
  }
  return g;
}

/**
 * Shared Helper: Rising curling steam wisps for hotpots & bamboo steamers
 */
export function createRisingSteamSystem(
  origins: THREE.Vector3[],
  puffTex: THREE.Texture,
  countPerOrigin = 7
): { group: THREE.Group; animated: AnimatedEntity } {
  const group = new THREE.Group();
  const total = origins.length * countPerOrigin;
  const mat = new THREE.SpriteMaterial({
    map: puffTex,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    color: 0xfff5e8,
  });

  interface PuffData {
    sprite: THREE.Sprite;
    origin: THREE.Vector3;
    phase: number;
    speed: number;
    driftX: number;
    driftZ: number;
  }

  const puffs: PuffData[] = [];
  for (let o = 0; o < origins.length; o++) {
    for (let i = 0; i < countPerOrigin; i++) {
      const sp = new THREE.Sprite(mat.clone());
      group.add(sp);
      puffs.push({
        sprite: sp,
        origin: origins[o],
        phase: (i / countPerOrigin) + o * 0.17,
        speed: 0.28 + ((i * 37) % 10) * 0.015,
        driftX: Math.sin(i * 2.1 + o) * 0.14,
        driftZ: Math.cos(i * 1.7 + o) * 0.14,
      });
    }
  }

  const animated: AnimatedEntity = {
    update: (ctx: DynamicUpdateContext) => {
      for (const p of puffs) {
        const life = (ctx.time * p.speed + p.phase) % 1;
        p.sprite.position.set(
          p.origin.x + Math.sin(ctx.time * 1.4 + p.phase * 6.28) * 0.2 + p.driftX * life * 1.6,
          p.origin.y + life * 1.65,
          p.origin.z + Math.cos(ctx.time * 1.2 + p.phase * 6.28) * 0.2 + p.driftZ * life * 1.6
        );
        const s = 0.24 + life * 0.85;
        p.sprite.scale.set(s, s, 1);
        const fade = Math.sin(life * Math.PI);
        (p.sprite.material as THREE.SpriteMaterial).opacity = fade * (0.14 + ctx.snowWeight * 0.08);
      }
    },
  };

  return { group, animated };
}
