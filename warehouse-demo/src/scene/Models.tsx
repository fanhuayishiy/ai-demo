import type { Ref } from 'react';
import type { Group } from 'three';
import type { Vec3 } from '../types';
import { TruckBrand } from './TruckBrand';
import { getBoxResources } from './resources';

const BLUE = '#2861e7';
export function Box({ at = [0, 0, 0], size, color, name, rotation = [0, 0, 0] }: { at?: Vec3; size: Vec3; color: string; name?: string; rotation?: Vec3 }) {
  const { geometry, material } = getBoxResources(color);
  const castShadow = name !== 'roof-seam' && name !== 'facade-seam';
  return <mesh name={name} position={at} rotation={rotation} scale={size} geometry={geometry} material={material} dispose={null} castShadow={castShadow} receiveShadow />;
}
function Wheel({ at, radius = 0.44 }: { at: Vec3; radius?: number }) {
  return <group name="wheel" position={at} rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[radius, radius, 0.26, 24]} /><meshStandardMaterial color="#283244" roughness={0.95} /></mesh>
    <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[radius * .56, radius * .56, .025, 12]} /><meshStandardMaterial color="#d7dfeb" metalness={.3} roughness={.45} /></mesh>
    <mesh position={[0, -.14, 0]}><cylinderGeometry args={[radius * .56, radius * .56, .025, 12]} /><meshStandardMaterial color="#d7dfeb" /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[0, side * .145, 0]}><cylinderGeometry args={[radius * .24, radius * .24, .016, 12]} /><meshStandardMaterial color="#6d8199" metalness={.55} roughness={.35} /></mesh>
      {Array.from({ length: 6 }, (_, i) => <mesh name="wheel-hub-bolt" key={i} position={[Math.cos(i * Math.PI / 3) * radius * .38, side * .16, Math.sin(i * Math.PI / 3) * radius * .38]}><cylinderGeometry args={[.025, .025, .015, 6]} /><meshStandardMaterial color="#899bb0" metalness={.6} roughness={.4} /></mesh>)}
    </group>)}
  </group>;
}
export function Warehouse() {
  const volumes = [
    { x: -9, width: 10, height: 5.65 },
    { x: -1.5, width: 5, height: 5.05 },
    { x: 4.5, width: 7, height: 4.45 },
  ];
  return <group name="warehouse-building">
    <Box at={[-3, .12, -6]} size={[22, .24, 8]} color="#a7b8ce" />
    {volumes.map(({ x, width, height }, index) => <group key={x}>
      <Box name="blue-facade-panel" at={[x, height / 2, -6]} size={[width, height, 8]} color={BLUE} />
      <group name={`roof-volume-${index + 1}`} position={[x, height, -6]}>
        <Box name={index === 0 ? 'blue-roof' : 'stepped-blue-roof'} size={[width, .22, 8]} color="#3473f4" />
        {Array.from({ length: Math.floor(width / .32) }, (_, i) => <Box name="roof-seam" key={i} at={[-width / 2 + .16 + i * .32, .13, 0]} size={[.022, .035, 7.94]} color="#5087f8" />)}
        {[-3.92, 3.92].map(z => <Box name="roof-edge-cap" key={z} at={[0, .09, z]} size={[width, .24, .16]} color="#2054c7" />)}
        {[-width / 2 + .06, width / 2 - .06].map(dx => <Box name="roof-edge-cap" key={dx} at={[dx, .09, 0]} size={[.12, .24, 8]} color="#2054c7" />)}
      </group>
      {Array.from({ length: Math.floor(width / .42) }, (_, i) => <Box name="facade-seam" key={i} at={[x - width / 2 + .2 + i * .42, height - .65, -1.98]} size={[.025, 1.05, .035]} color="#4379ee" />)}
    </group>)}
    {[-13.86, -3.9, 1.12, 7.86].map((x, index) => <group name="facade-downpipe" key={x}>
      <Box at={[x, 2.05, -1.88]} size={[.11, 4.1, .12]} color="#91b4ff" />
      <Box at={[x + .08, .18, -1.79]} size={[.25, .11, .25]} color="#91b4ff" />
      <Box name="facade-cap" at={[x, 4.2 - index * .15, -1.85]} size={[.2, .14, .28]} color="#d0ddf3" />
    </group>)}
    {[-10, -5, 0, 5].map((x, i) => <group name={`loading-dock-${i + 1}`} key={x} position={[x, 0, -2]}>
      <group name="projecting-dock-surround">
        <Box name="dark-door-well" at={[0, 1.68, .08]} size={[2.8, 3.15, .12]} color="#1c3046" />
        {[-1.58, 1.58].map(dx => <group key={dx}>
          <Box at={[dx, 1.8, .58]} size={[.4, 3.6, 1.2]} color="#1f55d8" />
          <Box name="beige-door-reveal" at={[dx * .85, 1.59, .63]} size={[.09, 2.96, 1.02]} color="#cbb792" />
          <Box at={[dx, 1.8, 1.21]} size={[.22, 3.6, .1]} color="#91b8ff" />
        </group>)}
        <Box at={[0, 3.52, .58]} size={[3.56, .32, 1.2]} color="#1d50ca" />
        <Box name="beige-door-reveal" at={[0, 3.25, .63]} size={[2.74, .12, 1.02]} color="#dfc9a2" />
        {Array.from({ length: 4 }, (_, j) => <Box name="roller-door-top" key={j} at={[0, 2.85 + j * .13, .18]} size={[2.68, .11, .1]} color="#f0f0e9" />)}
        <Box at={[0, .14, .62]} size={[3.1, .22, 1.22]} color="#c9b89d" />
        <Box at={[0, 3.53, 1.23]} size={[3.56, .18, .09]} color="#7ca7ff" />
      </group>
      {[-1.92, 1.92].map(dx => <group key={dx}><Box at={[dx, .48, 1.27]} size={[.14, .96, .14]} color="#f4c644" /><Box at={[dx, .65, 1.27]} size={[.16, .18, .16]} color="#273345" /></group>)}
      <Box at={[1.12, 3.92, .1]} size={[.25, .17, .2]} color="#f9edcb" />
    </group>)}
    <group name="roof-vent" position={[-8.6, 5.9, -8.1]}>
      <Box size={[1.15, .28, .85]} color="#83a4d7" />
      {[-.3, -.1, .1, .3].map(z => <Box key={z} at={[0, .17, z]} size={[1, .045, .06]} color="#456da7" />)}
    </group>
  </group>;
}
export function ShippingContainer() {
  return <group name="shipping-container">
    <Box name="container-body" at={[0, 1.3, 0]} size={[2.6, 2.6, 5]} color="#178caa" />
    {[-1, 1].map(side => <group key={side}>
      {Array.from({ length: 18 }, (_, i) => <Box name="container-side-rib" key={i} at={[side * 1.32, 1.3, -2.35 + i * .276]} size={[.07, 2.4, .07]} color="#38aabe" />)}
      {[.1, 2.5].map(y => <Box key={y} at={[side * 1.32, y, 0]} size={[.09, .13, 5]} color="#2367c4" />)}
      {[-2.48, 2.48].map(z => <Box key={z} at={[side * 1.28, 1.3, z]} size={[.14, 2.6, .14]} color="#246ddd" />)}
    </group>)}
    {Array.from({ length: 18 }, (_, i) => <Box key={i} at={[0, 2.62, -2.35 + i * .276]} size={[2.48, .045, .065]} color="#3babbd" />)}
    {[-.63, .63].map(x => <group key={x}>
      <Box name="container-door" at={[x, 1.3, 2.52]} size={[1.22, 2.43, .08]} color="#237db1" />
      {[-.3, .3].map(dx => <group key={dx}>
        <Box name="container-locking-bar" at={[x + dx, 1.3, 2.59]} size={[.045, 2.27, .055]} color="#c0d3db" />
        {[.35, 1.3, 2.25].map(y => <Box key={y} at={[x + dx, y, 2.62]} size={[.12, .08, .07]} color="#d6e3e6" />)}
        <Box at={[x + dx + .07, 1.18, 2.66]} size={[.2, .045, .05]} color="#e7ecea" />
      </group>)}
    </group>)}
  </group>;
}
export function Truck({ accent, brand = accent === '#42b6a8' ? 'Bluepeak' : 'WareTrack' }: { accent: string; brand?: string }) {
  return <group name="delivery-truck">
    <Box at={[0, .62, 0]} size={[2.2, .24, 5.4]} color="#32435f" />
    <Box name="cargo-body" at={[0, 1.8, -.82]} size={[2.24, 1.72, 3.82]} color="#fbfcff" />
    <Box at={[0, .98, -.82]} size={[2.29, .2, 3.84]} color={accent} />
    <Box at={[0, 2.71, -.82]} size={[2.3, .1, 3.87]} color="#dbe4f2" />
    <Box name="cab-body" at={[0, 1.18, 1.91]} size={[2.14, 1.12, 1.35]} color={accent} />
    <Box at={[0, 1.8, 1.82]} size={[2.1, .83, 1.18]} color={accent} />
    <Box at={[0, 2.24, 1.83]} size={[2.12, .08, 1.2]} color={accent} />
    <Box name="windshield" at={[0, 1.86, 2.425]} size={[1.82, .5, .035]} color="#16314e" />
    <TruckBrand brand={brand} accent={accent} />
    {[-1, 1].map(side => <group key={side}>
      <Box at={[side * 1.065, 1.86, 1.84]} size={[.035, .5, .92]} color="#1c3b5e" />
      <Box at={[side * 1.22, 1.78, 2.2]} size={[.15, .3, .14]} color="#213650" />
      <Box name="mirror-arm" at={[side * 1.145, 1.86, 2.2]} size={[.17, .035, .045]} color="#35465c" />
      <Box name="door-handle" at={[side * 1.09, 1.5, 1.46]} size={[.035, .055, .25]} color="#d5e0ed" />
      <Box name="cab-step" at={[side * 1.1, .69, 1.44]} size={[.27, .1, .54]} color="#aebdce" />
      {[-.14, 0, .14].map(dz => <Box key={dz} at={[side * 1.1, .75, 1.44 + dz]} size={[.23, .018, .035]} color="#586b83" />)}
      <Box at={[side * 1.079, 1.24, 1.29]} size={[.02, .69, .035]} color="#224467" />
      {[1.08, 2.54].map(y => <Box name="cargo-length-rail" key={y} at={[side * 1.13, y, -.82]} size={[.025, .045, 3.71]} color="#bfccdc" />)}
      {[-2.66, 1.02].map(z => <Box key={z} at={[side * 1.13, 1.8, z]} size={[.04, 1.52, .055]} color="#b9c9dc" />)}
      <Box at={[side * .77, 1.11, 2.6]} size={[.38, .21, .05]} color="#fff7cc" />
      <Box at={[side * .83, 1.12, -2.75]} size={[.23, .18, .04]} color="#fa705b" />
      {[-1.84, -.74, 1.76].map(z => <Wheel key={z} at={[side * 1.09, .48, z]} />)}
      {[-1.84, -.74, 1.76].map(z => <mesh name="wheel-arch" key={z} position={[side * 1.11, .48, z]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[.49, .055, 5, 16, Math.PI]} /><meshStandardMaterial color={z > 0 ? accent : '#465971'} roughness={.75} /></mesh>)}
      {[1.2, 1.8, 2.4].map(y => <Box name="tailgate-hinge" key={y} at={[side * .94, y, -2.755]} size={[.26, .09, .06]} color="#9bafc5" />)}
      <Box name="tailgate-locking-bar" at={[side * .48, 1.8, -2.78]} size={[.045, 1.5, .05]} color="#99aec4" />
      <Box at={[side * .43, 1.48, -2.835]} size={[.17, .045, .04]} color="#667e99" />
    </group>)}
    <Box at={[0, .79, 2.61]} size={[2.2, .2, .18]} color="#d8e2ed" />
    <Box at={[0, 1.2, 2.61]} size={[.95, .29, .04]} color="#273a52" />
    {[1.1, 1.17, 1.24, 1.31].map(y => <Box name="grille-slat" key={y} at={[0, y, 2.637]} size={[.85, .023, .016]} color="#a6b9ce" />)}
    <Box at={[0, .83, 2.68]} size={[.43, .12, .018]} color="#dbe8f3" />
    <Box at={[0, 1.8, -2.74]} size={[.035, 1.6, .05]} color="#bccbdc" />
    <Box at={[0, .75, -2.82]} size={[2.1, .15, .15]} color="#d9e2eb" />
  </group>;
}
export function Forklift({ carriageRef }: { carriageRef?: Ref<Group> }) {
  return <group name="forklift-model">
    <Box at={[0, .61, -.22]} size={[1.32, .65, 1.76]} color="#ffc940" />
    <Box at={[0, .82, -.81]} size={[1.4, .8, .55]} color="#f6b721" />
    <Box at={[0, .9, -.07]} size={[1.02, .2, .8]} color="#26313b" />
    <Box at={[0, 1.05, -.27]} size={[.58, .22, .55]} color="#28313e" />
    <Box at={[0, 1.35, -.5]} size={[.62, .62, .15]} color="#28313e" />
    <Box at={[0, 1.2, .34]} size={[.065, .62, .065]} color="#3b4857" rotation={[-.35, 0, 0]} />
    <group name="steering-wheel" position={[0, 1.52, .23]} rotation={[-.85, 0, 0]}>
      <mesh><torusGeometry args={[.23, .028, 6, 18]} /><meshStandardMaterial color="#1b2734" /></mesh>
      {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map(angle => <Box key={angle} at={[Math.sin(angle) * .105, Math.cos(angle) * .105, 0]} size={[.025, .21, .025]} rotation={[0, 0, -angle]} color="#354658" />)}
    </group>
    {[.32, .44].map(x => <group name="control-lever" key={x}>
      <Box at={[x, 1.27, .1]} size={[.024, .3, .024]} color="#91a2b3" rotation={[-.25, 0, 0]} />
      <mesh position={[x, 1.42, .06]}><sphereGeometry args={[.045, 8, 6]} /><meshStandardMaterial color="#243244" /></mesh>
    </group>)}
    {[-.57, .57].map(x => <group key={x}>
      {[-.77, .58].map(z => <Box key={z} at={[x, 1.63, z]} size={[.1, 1.9, .1]} color="#253341" />)}
      <Wheel at={[x * 1.22, .36, -.64]} radius={.34} /><Wheel at={[x * 1.22, .42, .6]} radius={.4} />
      <Box at={[x * .72, 1.1, 1.03]} size={[.13, 2.2, .16]} color="#263240" />
      <mesh name="hydraulic-cylinder" position={[x * .4, .65, 1.01]}><cylinderGeometry args={[.07, .07, 1.03, 10]} /><meshStandardMaterial color="#485b6e" metalness={.3} roughness={.55} /></mesh>
      <mesh name="hydraulic-rod" position={[x * .4, 1.48, 1.01]}><cylinderGeometry args={[.035, .035, .72, 10]} /><meshStandardMaterial color="#becbd6" metalness={.8} roughness={.23} /></mesh>
      <Box at={[x * .72, 1.14, .93]} size={[.035, 1.95, .028]} color="#8998a7" />
      <Box at={[x, .74, -.82]} size={[.06, .18, .2]} color="#c78a19" />
    </group>)}
    <Box at={[0, 2.6, -.1]} size={[1.4, .14, 1.6]} color="#263240" />
    {[-.48, -.16, .16, .48].map(x => <Box key={x} at={[x, 2.69, -.1]} size={[.08, .05, 1.52]} color="#586477" />)}
    <Box at={[0, 2.85, -.58]} size={[.14, .2, .14]} color="#ffac30" />
    <group ref={carriageRef} name="lifting-carriage">
      <Box at={[0, .55, 1.15]} size={[1.25, .65, .16]} color="#3b4a59" />
      {[-.42, .42].map(x => <Box key={x} name="fork-tine" at={[x, .22, 1.7]} size={[.17, .1, 1.3]} color="#627489" />)}
    </group>
  </group>;
}
export function Pallet({ blue = false, layers = 2 }: { blue?: boolean; layers?: 1 | 2 }) {
  return <group name="pallet-stack">
    {[-.58, 0, .58].map(x => <Box key={x} at={[x, .12, 0]} size={[.16, .24, 1.58]} color="#ad804e" />)}
    {[-.66, -.33, 0, .33, .66].map(z => <Box key={z} at={[0, .28, z]} size={[1.65, .1, .23]} color="#d1a36b" />)}
    {Array.from({ length: layers }, (_, y) => y).flatMap(y => [-.4, .4].flatMap(x => [-.4, .4].map(z => <group key={`${x}${y}${z}`} position={[x, .65 + y * .65, z]}>
      <Box name="carton" size={[.75, .63, .75]} color={blue ? '#3975ee' : '#dfb984'} />
      <Box at={[0, .32, 0]} size={[.13, .012, .75]} color={blue ? '#87afff' : '#f0d4a6'} />
      <Box at={[0, 0, .38]} size={[.13, .63, .014]} color={blue ? '#87afff' : '#f0d4a6'} />
      <Box at={[.2, .08, .39]} size={[.19, .19, .013]} color={blue ? '#c1d7ff' : '#f8ebd6'} />
    </group>)))}
  </group>;
}
export function Tree({ at, scale = 1 }: { at: Vec3; scale?: number }) {
  return <group position={at} scale={scale}>
    <mesh position={[0, .8, 0]} castShadow><cylinderGeometry args={[.1, .14, 1.6, 7]} /><meshStandardMaterial color="#a18e75" /></mesh>
    <mesh position={[0, 2, 0]} scale={[.87, 1.25, .87]} castShadow><icosahedronGeometry args={[.83, 2]} /><meshStandardMaterial color="#7dc7a2" roughness={1} /></mesh>
    <mesh position={[-.28, 1.8, .05]} scale={[.75, 1, .75]} castShadow><icosahedronGeometry args={[.6, 1]} /><meshStandardMaterial color="#98d6ab" /></mesh>
    <Box at={[0, .04, 0]} size={[1.6, .08, 1.6]} color="#deeee8" />
  </group>;
}
