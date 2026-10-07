import { useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group } from 'three';
import { MapPin } from '@phosphor-icons/react';
import { RoofBrand } from './RoofBrand';
import { Box, Forklift, Pallet, ShippingContainer, Tree, Truck, Warehouse } from './Models';
import { containerPosition, stagingPallets } from './layout';
import { sampleSimulation } from '../simulation';
import type { SceneProps, Vec3 } from '../types';

function Entity({ id, label, at = [0, 0, 0], radius = 1.8, labelHeight = 3.5, selectedId, onSelect, children }: { id: string; label: string; at?: Vec3; radius?: number; labelHeight?: number; children: ReactNode } & Pick<SceneProps, 'selectedId' | 'onSelect'>) {
  const [hovered, hover] = useState(false);
  const selected = id === selectedId;
  return <group position={at} onClick={event => { event.stopPropagation(); onSelect(id); }} onPointerOver={event => { event.stopPropagation(); hover(true); }} onPointerOut={() => hover(false)}>
    {children}
    {(selected || hovered) &&
      <mesh position={[0, .065, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius, radius + .055, 64]} /><meshBasicMaterial color={selected ? '#3472ff' : '#8baaff'} transparent opacity={.85} depthWrite={false} /></mesh>
    }
    <Html center position={[0, labelHeight, 0]} zIndexRange={[20, 0]} style={{ display: selected || hovered ? 'block' : 'none', pointerEvents: 'none', whiteSpace: 'nowrap' }}><div style={{ padding: '5px 9px', borderRadius: 5, background: selected ? '#376df0' : '#fff', color: selected ? '#fff' : '#3a5680', boxShadow: '0 4px 14px #27478322', fontSize: 10, fontWeight: 700 }}>{label}</div></Html>
  </group>;
}
function Ground() {
  return <group>
    <Box at={[0, -.25, 1]} size={[90, .4, 80]} color="#e9effb" />
    <Box at={[-2, -.025, 2]} size={[40, .12, 29]} color="#f5f7fc" />
    <Box at={[0, -.005, 18.2]} size={[90, .07, 7.6]} color="#bdcff0" />
    <Box at={[-24, -.005, 0]} size={[7.5, .07, 80]} color="#bdcff0" />
    <Box at={[0, .035, 14.45]} size={[60, .06, .14]} color="#fff" />
    <Box at={[-20.3, .035, -1.5]} size={[.14, .06, 31.5]} color="#fff" />
    {Array.from({ length: 15 }, (_, i) => <Box key={i} at={[-28 + i * 4, .04, 18.2]} size={[1.8, .025, .14]} color="#fff" />)}
    {Array.from({ length: 10 }, (_, i) => <Box key={i} at={[-24, .04, -20 + i * 4]} size={[.14, .025, 1.8]} color="#fff" />)}
    {[-9, 1, 9].map(x => <group key={x}>
      <Box at={[x - 1.65, .055, 8.2]} size={[.065, .03, 7]} color="#ebc76a" />
      <Box at={[x + 1.65, .055, 8.2]} size={[.065, .03, 7]} color="#ebc76a" />
      <Box at={[x, .055, 11.7]} size={[3.36, .03, .065]} color="#ebc76a" />
    </group>)}
    {Array.from({ length: 9 }, (_, i) => <Box key={i} at={[-18 + i * 3.8, .055, 13]} size={[1.4, .025, .09]} color="#e9c667" />)}
    {[-19, -14, -9, -4, 1, 6, 11, 16].map((x, i) => <Tree key={x} at={[x, .04, -14]} scale={.88 + (i % 3) * .08} />)}
    {[0, 5, 10].map(z => <Tree key={z} at={[18, .04, z]} scale={.9} />)}
    {[-9, -4, 1].map(z => <Tree key={z} at={[-19, .04, z]} scale={.8} />)}
    {Array.from({ length: 20 }, (_, i) => <Box key={i} at={[-19 + i * 2, .62, -12]} size={[.07, 1.24, .07]} color="#b5c2d7" />)}
    {[.2, .65, 1.15].map(y => <Box key={y} at={[0, y, -12]} size={[38, .035, .035]} color="#c7d1e2" />)}
    {Array.from({ length: 13 }, (_, i) => <Box key={i} at={[20, .6, -11 + i * 2]} size={[.07, 1.2, .07]} color="#bbc8db" />)}
    {[.2, .65, 1.15].map(y => <Box key={y} at={[20, y, 1]} size={[.035, .035, 24]} color="#c7d1e2" />)}
    <Box at={[11, .045, -7.5]} size={[5.8, .05, 7]} color="#e2e9f3" />
    <group position={[10.6, 0, -7.5]}>
      {[-1.6, 1.6].map(x => [-2, 0, 2].map(z => <Box key={`${x}${z}`} at={[x, 2.45, z]} size={[.1, 4.9, .1]} color="#4c70b6" />))}
      {[.3, 2, 3.7].map(y => <group key={y}><Box at={[0, y, 0]} size={[3.4, .12, 4.2]} color="#e4b369" />{[-1.65, 1.65].map(x => <Box key={x} at={[x, y + .14, 0]} size={[.08, .22, 4.25]} color="#eca33b" />)}</group>)}
      {[0, 1].map(y => [-1.05, 1.05].map(z => <group key={`${y}${z}`} position={[0, .38 + y * 1.7, z]} scale={.82}><Pallet /></group>))}
    </group>
    <group position={containerPosition}><ShippingContainer /></group>
    {stagingPallets.map((p, i) => <group key={i} position={p.at} rotation={[0, p.yaw, 0]}><Pallet layers={p.layers} blue={p.blue} /></group>)}
    <Box at={[-13.1, .06, 13.4]} size={[5.2, .025, .08]} color="#5e89e7" />
    <Box at={[-15.7, .06, 11.5]} size={[.08, .025, 3.8]} color="#5e89e7" />
  </group>;
}
export function World(props: SceneProps) {
  const forklift = useRef<Group>(null);
  const cargo = useRef<Group>(null);
  const carriage = useRef<Group>(null);
  useFrame(() => {
    const state = sampleSimulation(props.elapsedRef.current);
    if (forklift.current) { forklift.current.position.set(...state.forklift.position); forklift.current.rotation.y = state.forklift.rotation; }
    if (carriage.current) carriage.current.position.y = state.forklift.lift;
    if (cargo.current) { cargo.current.position.set(...state.cargo.position); cargo.current.rotation.y = state.cargo.onForks ? state.forklift.rotation : 0; }
  });
  return <>
    <Ground />
    <Entity {...props} id="warehouse-01" label="WH-01 · 华东智慧仓" labelHeight={6.2} radius={0}><Warehouse /></Entity>
    <RoofBrand />
    {[-10, -5, 0, 5].map((x, i) => <Html key={x} center position={[x, 3.55, -.7]} transform distanceFactor={8} zIndexRange={[4, 0]} style={{ pointerEvents: 'none', color: '#fff', fontWeight: 700, fontSize: 10 }}>0{i + 1}</Html>)}
    {([[12.5, 2.7, 2], [15.2, 2.7, 2], [-5.5, 2.7, 11.9]] as Vec3[]).map((at, i) => <Html key={`pin-${i}`} center position={at} zIndexRange={[6, 0]} style={{ pointerEvents: 'none', color: '#3878f8' }}><MapPin size={26} weight="fill" /></Html>)}
    <Entity {...props} id="truck-01" label="TRK-2095 运输车" at={[-9, 0, 8]} radius={3.1}><Truck accent="#2d63de" /></Entity>
    <Entity {...props} id="truck-02" label="TRK-2205 运输车" at={[1, 0, 9]} radius={3.1}><Truck accent="#42b6a8" /></Entity>
    <Entity {...props} id="truck-03" label="TRK-2287 运输车" at={[9, 0, 6]} radius={3.1}><Truck accent="#486fa8" /></Entity>
    <group ref={forklift} position={[-16, 0, 3]}><Entity {...props} id="forklift-01" label="FL-01 电动叉车" labelHeight={3.2} radius={1.6}><Forklift carriageRef={carriage} /></Entity></group>
    <group ref={cargo} position={[-16, 0, 7.2]}><Entity {...props} id="pallet-01" label="PLT-1026 · 工业安全帽" labelHeight={2.3} radius={1.2}><Pallet /></Entity></group>
    <Entity {...props} id="pallet-02" label="PLT-1027 · 塑料周转箱" at={[12.5, 0, 2]} labelHeight={2.3} radius={1.2}><Pallet blue /></Entity>
    <Entity {...props} id="pallet-03" label="PLT-1028 · 包装胶带" at={[15.2, 0, 2]} labelHeight={2.3} radius={1.2}><Pallet /></Entity>
    <group position={[-10, 0, -.7]} scale={.72}><Pallet /></group>
    <group position={[5, 0, -.7]} scale={.72}><Pallet /></group>
  </>;
}
