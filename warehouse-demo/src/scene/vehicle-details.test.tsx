import { Children, isValidElement, type ReactNode } from 'react';
import { createRef } from 'react';
import type { Group } from 'three';
import { Box3, BoxGeometry, CylinderGeometry, TorusGeometry, Matrix4, Euler, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { Truck, Forklift } from './Models';

function nodes(node: ReactNode): any[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement(child)) return [];
    const element = child as any;
    if (typeof element.type === 'function') return nodes(element.type(element.props));
    return [element, ...nodes(element.props.children)];
  });
}
describe('vehicle detail pass', () => {
  it('keeps the detailed truck within the original footprint and a bounded mesh count', () => {
    const bounds = new Box3();
    let meshCount = 0;
    function measure(node: ReactNode, parent = new Matrix4()) {
      Children.forEach(node, child => {
        if (!isValidElement(child)) return;
        const element = child as any;
        if (typeof element.type === 'function') { measure(element.type(element.props), parent); return; }
        const { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] } = element.props;
        const local = new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...(Array.isArray(scale) ? scale : [scale, scale, scale])));
        const matrix = parent.clone().multiply(local);
        if (element.type === 'mesh') {
          meshCount++;
          const geometryNode = Children.toArray(element.props.children).find((item: any) => ['boxGeometry', 'cylinderGeometry', 'torusGeometry'].includes(item.type)) as any;
          const geometry = element.props.geometry?.clone() ?? (geometryNode
            ? geometryNode.type === 'boxGeometry' ? new BoxGeometry(...geometryNode.props.args) : geometryNode.type === 'cylinderGeometry' ? new CylinderGeometry(...geometryNode.props.args) : new TorusGeometry(...geometryNode.props.args)
            : undefined);
          if (geometry) {
            geometry.computeBoundingBox();
            bounds.union(geometry.boundingBox!.clone().applyMatrix4(matrix));
            geometry.dispose();
          }
        }
        measure(element.props.children, matrix);
      });
    }
    measure(<Truck accent="#2861e7" />);
    expect(bounds.min.x).toBeGreaterThanOrEqual(-1.3);
    expect(bounds.max.x).toBeLessThanOrEqual(1.3);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-2.9);
    // Three stores primitive vertices as Float32, so allow sub-micrometer rounding.
    expect(bounds.max.z).toBeLessThanOrEqual(2.7 + 1e-6);
    expect(bounds.max.y).toBeLessThan(2.8);
    // The memoized brand adds two simple planes at runtime.
    expect(meshCount + 2).toBeLessThanOrEqual(172);
  });
  it('has a longer lower cargo silhouette with a separated compact cab inside the existing footprint', () => {
    const all = nodes(<Truck accent="#2861e7" />);
    const cargo = all.find(node => node.props.name === 'cargo-body');
    const size = cargo.props.scale;
    expect(size[2] / size[1]).toBeGreaterThan(2.1);
    expect(size[2]).toBeGreaterThan(3.7);
    const cab = all.find(node => node.props.name === 'cab-body');
    expect(cab).toBeDefined();
    const cabSize = cab.props.scale;
    expect(cab.props.position[2] - cabSize[2] / 2).toBeGreaterThan(cargo.props.position[2] + size[2] / 2);
    expect(cargo.props.position[2] - size[2] / 2).toBeGreaterThanOrEqual(-2.755);
    expect(cab.props.position[2] + cabSize[2] / 2).toBeLessThanOrEqual(2.7);
    expect(cargo.props.position[1] + size[1] / 2).toBeLessThan(2.8);
  });
  it('keeps hub bolt faces clear of the wheel hub disk', () => {
    const all = nodes(<Truck accent="#2861e7" />);
    const wheel = all.find(node => node.props.name === 'wheel');
    const wheelNodes = nodes(wheel.props.children);
    const hubDisks = wheelNodes.filter(node => node.type === 'mesh' && Math.abs(node.props.position?.[1]) === .14);
    expect(hubDisks).toHaveLength(2);
    const diskFace = Math.max(...hubDisks.map(node => Math.abs(node.props.position[1]) + nodes(node.props.children).find(child => child.type === 'cylinderGeometry').props.args[2] / 2));
    for (const bolt of wheelNodes.filter(node => node.props.name === 'wheel-hub-bolt')) {
      const thickness = nodes(bolt.props.children).find(node => node.type === 'cylinderGeometry').props.args[2];
      const boltFace = Math.abs(bolt.props.position[1]) + thickness / 2;
      expect(boltFace - diskFace).toBeGreaterThan(.01);
    }
  });
  it('adds truck entry, mirrors, arches, rear hardware and grille without moving wheel centers', () => {
    const all = nodes(<Truck accent="#2861e7" />);
    for (const [name, count] of [['wheel-arch', 6], ['cab-step', 2], ['door-handle', 2], ['mirror-arm', 2], ['tailgate-hinge', 6], ['tailgate-locking-bar', 2], ['grille-slat', 4]] as const) {
      expect(all.filter(node => node.props.name === name), name).toHaveLength(count);
    }
    expect(all.filter(node => node.props.name === 'wheel').map(node => node.props.position)).toEqual([-1, 1].flatMap(side => [-1.84, -.74, 1.76].map(z => [side * 1.09, .48, z])));
    expect(all.filter(node => node.props.name === 'cargo-length-rail')).toHaveLength(4);
    expect(all.filter(node => node.props.name === 'wheel-hub-bolt')).toHaveLength(72);
  });
  it('adds forklift controls and hydraulic detail while preserving fork and carriage contracts', () => {
    const carriageRef = createRef<Group>();
    const all = nodes(<Forklift carriageRef={carriageRef} />);
    expect(all.filter(node => node.props.name === 'steering-wheel')).toHaveLength(1);
    expect(all.filter(node => node.props.name === 'hydraulic-cylinder')).toHaveLength(2);
    expect(all.filter(node => node.props.name === 'hydraulic-rod')).toHaveLength(2);
    expect(all.filter(node => node.props.name === 'control-lever')).toHaveLength(2);
    expect(all.find(node => node.props.name === 'lifting-carriage').props.ref).toBe(carriageRef);
    expect(all.filter(node => node.props.name === 'fork-tine').map(node => node.props.position)).toEqual([[-.42, .22, 1.7], [.42, .22, 1.7]]);
  });
});
