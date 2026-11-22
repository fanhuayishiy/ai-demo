import * as THREE from 'three';
import { applyWeathering } from './weathering.js';

export function createMaterials() {
  const surface = (color, roughness, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const webbing = surface(0x39352b, 0.97);
  webbing.side = THREE.DoubleSide;
  const materials = {
    olive: surface(0x515941, 0.7, 0.16),
    bonnet: surface(0x4a543c, 0.65, 0.19),
    top: surface(0x61654f, 0.72, 0.14),
    seal: surface(0x242621, 0.88),
    steel: surface(0x383b36, 0.58, 0.67),
    rim: surface(0x66675f, 0.52, 0.66),
    rawSteel: surface(0x929083, 0.52, 0.78),
    oxide: surface(0x733e26, 0.76, 0.37),
    gunmetal: surface(0x2a2c27, 0.71, 0.43),
    tire: surface(0x252823, 0.88),
    tread: surface(0x292b26, 0.89),
    rubber: surface(0x32342d, 0.86),
    canvas: surface(0x786844, 0.97),
    roll: surface(0x4a514b, 0.95),
    webbing,
    saddle: surface(0x5b5040, 0.91),
    jug: surface(0x68603a, 0.83, 0.23),
    reflector: new THREE.MeshStandardMaterial({ color: 0xd0ccc0, roughness: 0.19, metalness: 0.92, side: THREE.DoubleSide, flatShading: true }),
    lampCore: new THREE.MeshStandardMaterial({ color: 0xffdeb0, roughness: 0.28, emissive: 0xffbe63, emissiveIntensity: 0 }),
    glazeMirror: surface(0xb7c1b7, 0.12, 0.91),
    glazing: new THREE.MeshPhysicalMaterial({
      color: 0x42524d, transparent: true, opacity: 0.53, roughness: 0.19, metalness: 0.32,
      clearcoat: 0.72, clearcoatRoughness: 0.18, depthWrite: false, side: THREE.DoubleSide,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0xe0dfcd, transparent: true, opacity: 0.36, roughness: 0.13, metalness: 0.18,
      clearcoat: 0.85, clearcoatRoughness: 0.16, depthWrite: false, emissive: 0xffc876, emissiveIntensity: 0,
    }),
    amber: surface(0xac561d, 0.32, 0.07),
    tailLens: new THREE.MeshStandardMaterial({ color: 0x691e19, roughness: 0.32, metalness: 0.08, emissive: 0xa62316, emissiveIntensity: 0 }),
    ivory: surface(0xc9bba1, 0.56, 0.16),
  };

  for (const name of ['olive', 'bonnet', 'top']) applyWeathering(materials[name], 'paint');
  for (const name of ['steel', 'rawSteel', 'gunmetal', 'rim', 'jug', 'oxide']) applyWeathering(materials[name], 'metal');
  for (const name of ['canvas', 'roll', 'webbing', 'saddle']) applyWeathering(materials[name], 'fabric');
  for (const name of ['rubber', 'seal']) applyWeathering(materials[name], 'rubber');
  for (const name of ['tire', 'tread']) applyWeathering(materials[name], 'tire');
  applyWeathering(materials.glazing, 'glass');
  return materials;
}
