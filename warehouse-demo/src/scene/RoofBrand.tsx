import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

export function RoofBrandPlane({ texture }: { texture: Texture }) {
  return <mesh name="roof-brand" position={[4.3, 4.59, -5.8]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[4.8, 1.1]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
  </mesh>;
}

export function useRoofBrandTexture(): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.font = '800 164px "Segoe UI", Arial, sans-serif';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('WareTrack', 512, 128, 980);
    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    setTexture(nextTexture);
    // Each effect setup owns a fresh texture, including StrictMode's second setup.
    return () => nextTexture.dispose();
  }, []);
  return texture;
}

export function RoofBrand() {
  const texture = useRoofBrandTexture();
  return texture ? <RoofBrandPlane texture={texture} /> : null;
}
