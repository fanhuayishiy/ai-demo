import { BoxGeometry, MeshStandardMaterial } from 'three';

export interface BoxResources {
  readonly geometry: BoxGeometry;
  readonly material: MeshStandardMaterial;
}

let unitBox: BoxGeometry | undefined;
const boxesByColor = new Map<string, BoxResources>();
let sceneOwners = 0;
let pendingRelease: ReturnType<typeof setTimeout> | undefined;

/** Shared immutable resources; size belongs on the consuming mesh's scale. */
export function getBoxResources(color: string): BoxResources {
  const cached = boxesByColor.get(color);
  if (cached) return cached;
  unitBox ??= new BoxGeometry(1, 1, 1);
  const resources = {
    geometry: unitBox,
    material: new MeshStandardMaterial({ color, roughness: .76 }),
  };
  boxesByColor.set(color, resources);
  return resources;
}

/**
 * Retain once per mounted scene and return its idempotent cleanup.
 * Consuming meshes must use dispose={null}: this registry owns disposal.
 * One deferred tick lets StrictMode's cleanup/setup replay keep resources alive.
 */
export function retainSceneResources(): () => void {
  if (pendingRelease !== undefined) {
    clearTimeout(pendingRelease);
    pendingRelease = undefined;
  }
  sceneOwners += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    sceneOwners -= 1;
    if (sceneOwners !== 0) return;
    pendingRelease = setTimeout(() => {
      pendingRelease = undefined;
      if (sceneOwners !== 0) return;
      for (const { material } of boxesByColor.values()) material.dispose();
      boxesByColor.clear();
      unitBox?.dispose();
      unitBox = undefined;
    }, 0);
  };
}
