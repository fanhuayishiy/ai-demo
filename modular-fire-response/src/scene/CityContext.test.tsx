import { Children, isValidElement, type ReactElement, type ReactNode, type RefObject } from 'react';
import { cleanup, render } from '@testing-library/react';
import { BoxGeometry, Color, CylinderGeometry, IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D } from 'three';
import { afterEach, expect, it } from 'vitest';
import type { Vec3 } from '../types';

type Element = ReactElement<Record<string, unknown>>;
type Part = { p: Vec3; s: Vec3; color: string };
const modules = import.meta.glob('./CityContext.tsx');
const allocated: InstancedMesh[] = [];
function elements(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) ? [child as Element, ...elements(child.props.children)] : []);
}
afterEach(() => {
  cleanup();
  for (const mesh of allocated) { mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose(); }
  allocated.length = 0;
});

it('renders five non-shadow-casting batches with real instance transforms, colors and bounds', async () => {
  const load = modules['./CityContext.tsx'];
  expect(load, 'the isolated CityContext component is available').toBeTypeOf('function');
  const { CityContext } = await load() as { CityContext: () => ReactNode };
  const tree = elements(CityContext());
  const batches = tree.filter(element => typeof element.type === 'function');
  expect(batches).toHaveLength(5);
  expect(tree.some(element => typeof element.type === 'string' && element.type.endsWith('Light'))).toBe(false);

  for (const batch of batches) {
    let native: Element;
    let mesh: InstancedMesh;
    function Probe() {
      native = (batch.type as (props: typeof batch.props) => Element)(batch.props);
      const geometry = elements(native.props.children as ReactNode).find(element => String(element.type).endsWith('Geometry'))!;
      const args = geometry.props.args as number[];
      const shape = geometry.type === 'boxGeometry' ? new BoxGeometry(args[0], args[1], args[2])
        : geometry.type === 'cylinderGeometry' ? new CylinderGeometry(args[0], args[1], args[2], args[3]) : new IcosahedronGeometry(args[0], args[1]);
      mesh = new InstancedMesh(shape, new MeshStandardMaterial(), (native.props.args as unknown[])[2] as number);
      allocated.push(mesh);
      (native.props.ref as RefObject<InstancedMesh | null>).current = mesh;
      return null;
    }
    render(<Probe />);
    expect(native!.type).toBe('instancedMesh');
    expect(native!.props.castShadow).not.toBe(true);
    expect(native!.props.receiveShadow).toBe(true);
    expect(native!.props.raycast).toBeTypeOf('function');
    const parts = batch.props.parts as Part[];
    expect(mesh!.count).toBe(parts.length);
    expect(mesh!.instanceMatrix.version).toBeGreaterThan(0);
    expect(mesh!.boundingSphere?.radius).toBeGreaterThan(0);
    parts.forEach((part, index) => {
      const actual = new Matrix4(), expected = new Object3D(), color = new Color();
      mesh!.getMatrixAt(index, actual);
      mesh!.getColorAt(index, color);
      expected.position.set(...part.p); expected.scale.set(...part.s); expected.updateMatrix();
      actual.elements.forEach((value, axis) => expect(value).toBeCloseTo(expected.matrix.elements[axis], 4));
      expect(color.getHexString()).toBe(new Color(part.color).getHexString());
    });
  }
});
