import * as THREE from 'three';
import { TextureBundle } from '../textures';
import { AnimatedEntity, DynamicUpdateContext } from '../types';

export interface PlinthBuildResult {
  group: THREE.Group;
  guideAxesGroup: THREE.Group;
  animated: AnimatedEntity[];
}

export function buildExhibitionPlinth(textures: TextureBundle): PlinthBuildResult {
  const group = new THREE.Group();
  group.name = 'ExhibitionPlinth';

  const walnutMat = new THREE.MeshStandardMaterial({
    map: textures.walnutAlbedo,
    roughness: 0.42,
    metalness: 0.08,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    map: textures.brassAlbedo,
    bumpMap: textures.brassBump,
    bumpScale: 0.015,
    roughness: 0.44,
    metalness: 0.78,
  });

  // Lower stepped museum walnut skirt (y = -13.0 to -12.1)
  const lowerBase = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.9, 20.6), walnutMat);
  lowerBase.position.set(0, -12.55, 0);
  lowerBase.receiveShadow = true;
  lowerBase.castShadow = true;
  group.add(lowerBase);

  // Brass inlay channel separating lower & upper plinth tiers
  const brassBand = new THREE.Mesh(new THREE.BoxGeometry(25.8, 0.14, 19.8), brassMat);
  brassBand.position.set(0, -12.04, 0);
  group.add(brassBand);

  // Upper dark-walnut main cradle (y = -11.97 to -10.85)
  const upperBase = new THREE.Mesh(new THREE.BoxGeometry(25.2, 1.12, 19.2), walnutMat);
  upperBase.position.set(0, -11.41, 0);
  upperBase.receiveShadow = true;
  upperBase.castShadow = true;
  group.add(upperBase);

  // Top recessed brushed-brass rim lip cradling the diorama block
  const rimThickness = 0.22;
  const rimH = 0.2;
  const topRimY = -10.82;
  const rimFront = new THREE.Mesh(new THREE.BoxGeometry(24.6, rimH, rimThickness), brassMat);
  rimFront.position.set(0, topRimY, 9.25);
  const rimBack = rimFront.clone();
  rimBack.position.z = -9.25;
  const rimLeft = new THREE.Mesh(new THREE.BoxGeometry(rimThickness, rimH, 18.7), brassMat);
  rimLeft.position.set(-12.2, topRimY, 0);
  const rimRight = rimLeft.clone();
  rimRight.position.x = 12.2;
  group.add(rimFront, rimBack, rimLeft, rimRight);

  // Corner brass L-brackets on upper walnut base
  const cornerGeo = new THREE.BoxGeometry(0.45, 1.16, 0.45);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const c = new THREE.Mesh(cornerGeo, brassMat);
      c.position.set(sx * 12.45, -11.41, sz * 9.45);
      group.add(c);
    }
  }

  // Engraved brushed-brass front nameplate (angled slightly upward for museum legibility)
  const plaqueGroup = new THREE.Group();
  plaqueGroup.position.set(0, -11.42, 9.74);
  plaqueGroup.rotation.x = -0.18;

  const plaqueBezel = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.38, 0.14), brassMat);
  plaqueGroup.add(plaqueBezel);

  const plaqueFaceMat = new THREE.MeshStandardMaterial({
    map: textures.brassPlaque,
    roughness: 0.34,
    metalness: 0.78,
  });
  const plaqueFace = new THREE.Mesh(new THREE.PlaneGeometry(7.52, 1.18), plaqueFaceMat);
  plaqueFace.position.z = 0.078;
  plaqueGroup.add(plaqueFace);
  group.add(plaqueGroup);

  // Subtle dark exhibition floor shadow-catcher pad beneath plinth
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x090b11,
    roughness: 0.92,
    metalness: 0.05,
  });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(28, 29, 0.16, 48), padMat);
  pad.position.set(0, -13.1, 0);
  pad.receiveShadow = true;
  group.add(pad);

  // Illuminated technical CAD guide axes (revealed smoothly during Key 4 Explode view)
  const guideAxesGroup = new THREE.Group();
  guideAxesGroup.name = 'ExplodeGuideAxes';
  const axisMat = new THREE.MeshBasicMaterial({
    color: 0xdab674,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x56d8c5,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const cornerCoords: Array<[number, number]> = [
    [-12.15, 9.05],
    [12.15, 9.05],
    [-12.15, -9.05],
    [12.15, -9.05],
  ];

  const rodGeo = new THREE.CylinderGeometry(0.032, 0.032, 41, 8);
  const tickGeo = new THREE.TorusGeometry(0.24, 0.026, 8, 20);
  const tickElevations = [-10.5, -1.2, 6.2, 14.5, 22.8];

  for (const [cx, cz] of cornerCoords) {
    const rod = new THREE.Mesh(rodGeo, axisMat);
    rod.position.set(cx, 9.5, cz);
    guideAxesGroup.add(rod);

    for (const ty of tickElevations) {
      const tick = new THREE.Mesh(tickGeo, ringMat);
      tick.rotation.x = Math.PI * 0.5;
      tick.position.set(cx, ty, cz);
      guideAxesGroup.add(tick);
    }
  }
  group.add(guideAxesGroup);

  const animated: AnimatedEntity[] = [
    {
      update: (ctx: DynamicUpdateContext) => {
        const f = ctx.explodeFactor;
        guideAxesGroup.visible = f > 0.01;
        axisMat.opacity = f * 0.48;
        ringMat.opacity = f * 0.72;
      },
    },
  ];

  return { group, guideAxesGroup, animated };
}
