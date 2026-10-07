import { memo, useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';
import cubeSvg from './phosphor-cube.svg?raw';

const textures = new Map<string, { texture: CanvasTexture; references: number }>();

export function acquireTruckBrandTexture(brand: string, accent: string): { texture: Texture | null; release: () => void } {
  const key = JSON.stringify([brand, accent]);
  let entry = textures.get(key);
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return { texture: null, release: () => {} };
    context.fillStyle = accent;
    context.save();
    context.translate(14, 22);
    context.scale(.31, .31);
    for (const [, path] of cubeSvg.matchAll(/\bd="([^"]+)"/g)) context.fill(new Path2D(path));
    context.restore();
    context.font = '700 66px "Segoe UI", Arial, sans-serif';
    context.fillStyle = '#263650';
    context.textBaseline = 'middle';
    context.fillText(brand, 122, 61, 366);
    context.font = '500 17px "Segoe UI", "Microsoft YaHei", sans-serif';
    context.fillStyle = '#6b7c94';
    context.fillText('仓储物流 · WH-01', 125, 102, 350);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    entry = { texture, references: 0 };
    textures.set(key, entry);
  }
  const retained = entry;
  retained.references++;
  let released = false;
  return { texture: retained.texture, release: () => {
    if (released) return;
    released = true;
    if (--retained.references === 0) {
      textures.delete(key);
      retained.texture.dispose();
    }
  } };
}

// Memoization keeps the static decals out of the ten-Hz dashboard update work.
export const TruckBrand = memo(function TruckBrand({ brand, accent }: { brand: string; accent: string }) {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    const lease = acquireTruckBrandTexture(brand, accent);
    setTexture(lease.texture);
    return lease.release;
  }, [brand, accent]);
  return texture ? <group name="truck-brand-decals">{[-1, 1].map(side =>
    <mesh name="truck-brand-decal" key={side} position={[side * 1.127, 1.91, -.81]} rotation={[0, side * Math.PI / 2, 0]}>
      <planeGeometry args={[3.02, .755]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>,
  )}</group> : null;
});
