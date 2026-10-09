import { useLayoutEffect, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import { CITY_CONTEXT_KINDS, CITY_CONTEXT_PARTS, type CityContextKind, type CityContextPart } from './cityContextLayout';

const ignoreContextRaycast: InstancedMesh['raycast'] = () => {};
const batches = CITY_CONTEXT_KINDS.map(kind => ({ kind, parts: CITY_CONTEXT_PARTS.filter(part => part.kind === kind) }));

function ContextBatch({ kind, parts }: { kind: CityContextKind; parts: CityContextPart[] }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D(), color = new Color();
    parts.forEach((part, index) => {
      transform.position.set(...part.p);
      transform.scale.set(...part.s);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, color.set(part.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [parts]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, parts.length]} name={`city-context-${kind}`} receiveShadow raycast={ignoreContextRaycast}>
    {kind === 'foliage' ? <icosahedronGeometry args={[.5, 2]} />
      : kind === 'trunk' ? <cylinderGeometry args={[.5, .5, 1, 7]} /> : <boxGeometry args={[1, 1, 1]} />}
    <meshStandardMaterial color="#ffffff" roughness={kind === 'curb' ? .92 : 1} metalness={0} />
  </instancedMesh>;
}

export function CityContext() {
  return <group name="city-courtyard-context">
    {batches.map(batch => <ContextBatch key={batch.kind} {...batch} />)}
  </group>;
}
