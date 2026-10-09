import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Color, IcosahedronGeometry, InstancedMesh, Object3D, SRGBColorSpace } from 'three';
import { CITY_DETAIL_FINISHES, type CityDetailBox, type CityDetailFinish, type TreeCanopy } from './cityDetailLayout';

const ignoreDetailRaycast: InstancedMesh['raycast'] = () => {};

function DetailBoxes({ boxes, finish }: { boxes: CityDetailBox[]; finish: CityDetailFinish }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D(), color = new Color();
    boxes.forEach((detail, index) => {
      transform.position.set(...detail.p);
      transform.scale.set(...detail.s);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, color.set(detail.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [boxes]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, boxes.length]} receiveShadow raycast={ignoreDetailRaycast} name={`city-detail-${finish}`}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#ffffff" {...CITY_DETAIL_FINISHES[finish]} />
  </instancedMesh>;
}

function TreeCanopies({ canopies }: { canopies: TreeCanopy[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const shape = new IcosahedronGeometry(1, 2);
    const points = shape.getAttribute('position');
    for (let index = 0; index < points.count; index++) {
      const x = points.getX(index), y = points.getY(index), z = points.getZ(index);
      const ripple = .91 + .055 * Math.sin(x * 19 + z * 23) * Math.cos(y * 17 - x * 11);
      points.setXYZ(index, x * ripple, y * ripple, z * ripple);
    }
    shape.computeVertexNormals();
    return shape;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D(), color = new Color();
    canopies.forEach((canopy, index) => {
      transform.position.set(...canopy.p);
      transform.scale.set(canopy.s[0] / 2, canopy.s[1] / 2, canopy.s[2] / 2);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, color.set(canopy.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [canopies]);
  return <instancedMesh ref={mesh} args={[geometry, undefined, canopies.length]} castShadow receiveShadow raycast={ignoreDetailRaycast} name="clustered-street-canopies">
    <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
  </instancedMesh>;
}

export function CityDetails({ details, canopies }: { details: CityDetailBox[]; canopies: TreeCanopy[] }) {
  return <group name="city-surface-details">
    {(Object.keys(CITY_DETAIL_FINISHES) as CityDetailFinish[]).map(finish =>
      <DetailBoxes key={finish} boxes={details.filter(detail => detail.finish === finish)} finish={finish} />)}
    <TreeCanopies canopies={canopies} />
  </group>;
}

export function StationSign({ label }: { label: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#873a36';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#c6b8a8';
      context.lineWidth = 3;
      context.strokeRect(8, 8, 1008, 112);
      context.fillStyle = '#fff3de';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '700 82px "Microsoft YaHei", "Arial", sans-serif';
      context.fillText(label, 512, 66, 930);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 4.79, -.8]} name="station-nameplate">
    <planeGeometry args={[10.6, .86]} />
    <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={.3} roughness={.84} metalness={0} />
  </mesh>;
}
