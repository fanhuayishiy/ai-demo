import { memo } from "react";
import { Tag } from "./ProjectedTag";
export { Tag } from "./ProjectedTag";
import { Box, Cylinder, C } from "./Primitives";
import type { Vec3 } from "../types";
import { LOW_BUILDINGS, ROAD_XS, ROAD_ZS, STAGING, STATION_LAYOUT, STREET_LAMPS, SURFACE_Y, TREE_POSITIONS, WATER_SOURCES } from '../spatial/layout';
import { CityDetails, StationSign } from './CityDetails';
import { CITY_DETAIL_BOXES, CITY_TREE_CANOPIES } from './cityDetailLayout';
import { UrbanSurfaceProvider } from './UrbanSurfaceMaterial';
import { CityContext } from './CityContext';
// Flush ground finishes need distinct depth priorities, without raising vehicle or hose contact surfaces.
// Unit-only offsets stay small at oblique camera angles; a slope factor can cover nearby feet and wheels.
const GROUND_LAYERS = { road: 0, crossing: 1, courtyard: 1, driveway: 2, bay: 2, apron: 3, lobby: 3, entrance: 4, paint: 5 } as const;
function StreetLamp({p,rotation}:{p:Vec3;rotation:number}) {
  return <group position={p} rotation={[0,rotation,0]}>
    <Cylinder p={[0,4,0]} r={.12} h={8} color="#7e898e" roughness={.36} metalness={.62}/>
    <Box p={[.95,7.95,0]} s={[2,.14,.16]} color={C.metal} roughness={.35} metalness={.6}/>
    <Box p={[1.7,7.8,0]} s={[1.25,.18,.75]} color="#3f4a50" roughness={.52} metalness={.25}/>
    <mesh position={[1.7,7.69,0]}>
      <boxGeometry args={[1.1,.06,.61]}/>
      <meshBasicMaterial color="#ffe1aa" toneMapped={false}/>
    </mesh>
    <pointLight position={[1.7,7.5,0]} intensity={170} distance={20} decay={2} color="#f2c58c"/>
  </group>;
}
function Tree({ p }: { p: Vec3 }) {
  return (
    <group position={p}>
      <Cylinder p={[0, 1.7, 0]} r={0.23} h={3.4} color="#706961" roughness={1} metalness={0} />
      <Box p={[0, 0.2, 0]} s={[3, 0.4, 3]} color="#68746c" roughness={.94} metalness={0} />
      <Box p={[0, .389, 0]} s={[2.65, .02, 2.65]} color="#314336" roughness={1} metalness={0} />
    </group>
  );
}
function LowBuilding({ p, s, color }: { p: Vec3; s: Vec3; color: string }) {
  return (
    <group position={p}>
      <Box p={[0, s[1] / 2, 0]} s={s} color={color} roughness={.88} metalness={0} surface="concrete" />
      <Box
        p={[0, s[1] + 0.2, 0]}
        s={[s[0] + 0.7, 0.4, s[2] + 0.7]}
        color="#bdc8cc"
        roughness={.84}
        metalness={0}
        surface="concrete"
      />
      <Box
        p={[0, s[1] + 0.55, 0]}
        s={[s[0] - 0.8, 0.3, s[2] - 0.8]}
        color="#859498"
        roughness={.8}
        metalness={.05}
        surface="concrete"
      />
      <Box p={[1, s[1] + 1, 0]} s={[2.8, 1.2, 2]} color={C.metal} />
    </group>
  );
}
function Driveway({from,to,width=5}:{from:Vec3;to:Vec3;width?:number}) {
  return <Box p={[(from[0]+to[0])/2,SURFACE_Y-.025,(from[2]+to[2])/2]} s={[Math.max(width,Math.abs(from[0]-to[0])+width),.05,Math.max(width,Math.abs(from[2]-to[2])+width)]} color="#424c52" roughness={.94} metalness={0} surface="asphalt" depthLayer={GROUND_LAYERS.driveway}/>;
}
function RoadArrow({p,angle=0}:{p:Vec3;angle?:number}) {
  return <group position={p} rotation={[0,angle,0]}><Box p={[-.5,.01,0]} s={[2.4,.015,.15]} color="#c9d2d1" roughness={.92} metalness={0}/>{[-1,1].map(s=><Box key={s} p={[.4,.01,s*.42]} s={[1.2,.015,.15]} rotation={[0,s*Math.PI/4,0]} color="#c9d2d1" roughness={.92} metalness={0}/>)}</group>;
}
function RoadEdge({ p, s }: { p: Vec3; s: [number, number] }) {
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={s} />
      <meshStandardMaterial
        color="#7e8a90"
        roughness={.9}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={0}
        polygonOffsetUnits={-4 * GROUND_LAYERS.paint}
      />
    </mesh>
  );
}
export const City = memo(function City({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  return (
    <UrbanSurfaceProvider><group>
      <mesh name="urban-ground" position={[-4, .13, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[340, 290]} />
        <meshStandardMaterial color="#172023" roughness={.97} metalness={0} />
      </mesh>
      <Box p={[-4, -0.61, -1]} s={[152, 1.5, 116]} color="#292f33" roughness={.95} metalness={0} />
      <Box p={[-4, -1.7, -1]} s={[154, 0.8, 118]} color="#242b30" roughness={.9} metalness={0} />
      {ROAD_XS.map((x) => (
        <group key={x}>
          <Box p={[x, SURFACE_Y-.03, 5]} s={[8, 0.06, 78]} color="#20272b" roughness={.96} metalness={0} surface="asphalt" depthLayer={GROUND_LAYERS.road} />
          {[-1, 1].flatMap(sign => [[-26, 16], [24, 36]].map(([from, to]) => (
            <RoadEdge key={`${sign}-${from}`} p={[x + sign * 3.8, SURFACE_Y, (from + to) / 2]} s={[.16, to - from]} />
          )))}
          {[-20,-4,10,31].map(z=><RoadArrow key={z} p={[x,SURFACE_Y,z]} angle={x===-45||x===28 ? Math.PI/2 : -Math.PI/2}/>) }
        </group>
      ))}
      {ROAD_ZS.map((z) => (
        <group key={z}>
          <Box p={[2.5, SURFACE_Y-.03, z]} s={[103, 0.06, 8]} color="#20272b" roughness={.96} metalness={0} surface="asphalt" depthLayer={GROUND_LAYERS.crossing} />
          {[-1, 1].flatMap(sign => [[-41, -26], [-18, 24], [32, 46]].map(([from, to]) => (
            <RoadEdge key={`${sign}-${from}`} p={[(from + to) / 2, SURFACE_Y, z + sign * 3.8]} s={[to - from, .16]} />
          )))}
          {[-35,-10,10,39].map(x=><RoadArrow key={x} p={[x,SURFACE_Y,z]} angle={z===40?Math.PI:0}/>) }
        </group>
      ))}
      {[-22, 28].map((x) =>
        [-30, 20].map((z) => (
          <group key={`${x}-${z}`}>
            {Array.from({ length: 6 }, (_, i) => (
              <Box
                key={i}
                p={[x - 2.8 + i * 1.1, 0.19, z - 5.3]}
                s={[0.55, 0.05, 2]}
                color="#c9d2d1"
                roughness={.92}
                metalness={0}
              />
            ))}
          </group>
        )),
      )}
      <Box p={[7, SURFACE_Y-.02, -2]} s={[32, 0.04, 29]} color="#4a5357" roughness={.94} metalness={0} surface="concrete" depthLayer={GROUND_LAYERS.courtyard} />
      {Object.entries(STAGING).map(([id,bay])=><group key={id} position={bay.position}><Box p={[0,-.02,0]} s={[8,.04,5]} color="#424b50" roughness={.94} metalness={0} depthLayer={GROUND_LAYERS.bay}/>{[-1,1].map(sign=><Box key={sign} p={[0,.005,sign*2.3]} s={[7.6,.015,.08]} color="#98a7ab" roughness={.94} metalness={0}/>)}</group>)}
      <group
        position={[7, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("incident");
        }}
      >
        <Box p={[0, 15.6, 0]} s={[15, 24.8, 13]} color="#b5bec2" roughness={.89} metalness={0} surface="concrete" />
        {[-4.6,4.6].map(x=><Box key={x} p={[x,1.69,0]} s={[5.8,3.02,13]} color="#b5bec2" roughness={.89} metalness={0} surface="concrete"/>)}
        <Box p={[0,1.69,-6.2]} s={[3.4,3.02,.6]} color="#909fa5" roughness={.88} metalness={0}/>
        <Box p={[0,SURFACE_Y-.025,0]} s={[15,.05,13]} color="#89979b" roughness={.93} metalness={0} depthLayer={GROUND_LAYERS.lobby}/>
        <Box p={[-7.7, 14, 0]} s={[0.8, 28, 13.5]} color="#aab7bc" roughness={.87} metalness={0} surface="concrete" />
        <Box p={[7.7, 14, 0]} s={[0.8, 28, 13.5]} color="#aab7bc" roughness={.87} metalness={0} surface="concrete" />
        {Array.from({ length: 7 }, (_, floor) => (
          <group key={floor}>
            {[-4.7, 0, 4.7].map((x, i) => (
              <group key={x}>
                <Box
                  p={[x, 3.5 + floor * 3.4, 6.55]}
                  s={[2.5, 2.2, 0.12]}
                  color={floor === 4 && i === 1 ? "#ce693d" : (floor+i)%3 === 0 ? "#c7b797" : "#33434b"}
                  emissive={floor === 4 && i === 1 ? "#ff6a2b" : (floor+i)%3 === 0 ? "#e5c38a" : "#192c36"}
                  emissiveIntensity={floor === 4 && i === 1 ? 1 : (floor+i)%3 === 0 ? .4 : .045}
                  roughness={.25}
                  metalness={.2}
                />
                <Box
                  p={[x, 2.5 + floor * 3.4, 7]}
                  s={[3.3, 0.25, 1.5]}
                  color="#b4c0c4"
                  roughness={.9}
                  metalness={0}
                />
                <Box
                  p={[x, 3 + floor * 3.4, 7.7]}
                  s={[3.3, 0.85, 0.13]}
                  color="#8e9da5"
                  roughness={.4}
                  metalness={.45}
                />
                {[-1.5, 1.5].map((v) => (
                  <Box
                    key={v}
                    p={[x + v, 3 + floor * 3.4, 7]}
                    s={[0.12, 0.85, 1.5]}
                    color="#a0adb2"
                    roughness={.44}
                    metalness={.4}
                  />
                ))}
              </group>
            ))}
            <Box
              p={[0, 4.7 + floor * 3.4, 6.7]}
              s={[15, 0.25, 0.2]}
              color="#b7c2c6"
              roughness={.85}
              metalness={0}
            />
          </group>
        ))}
        <Box p={[0, 28.3, 0]} s={[16.5, 0.6, 14.5]} color="#758087" roughness={.78} metalness={.05} />
        <Box p={[0, 28.8, 0]} s={[14.8, 0.45, 12.8]} color="#8d979a" roughness={.8} metalness={0} />
        <Box p={[-3, 30, -2]} s={[4.3, 2, 3.5]} color="#c5cfd2" roughness={.76} metalness={.05} />
        <Cylinder p={[3.5, 30.3, -2.6]} r={1.5} h={2.8} />
        <Box
          p={[3, 29.3, 2]}
          s={[3.8, 0.3, 2.8]}
          color="#354d58"
          roughness={.28}
          metalness={.3}
          rotation={[-0.18, 0, 0]}
        />
        {[-1.6,1.6].map(x=><Box key={x} p={[x,1.6,6.7]} s={[.15,2.84,.15]} color="#6e838e" roughness={.4} metalness={.5}/>)}
        <Box p={[0, 3, 7.3]} s={[4, 0.3, 2]} color="#955149" roughness={.8} metalness={0} />
        <Box p={[0,SURFACE_Y-.015,8]} s={[3.2,.03,3.2]} color="#99aaae" roughness={.94} metalness={0} depthLayer={GROUND_LAYERS.entrance}/>
        <Box p={[0,2.8,8.12]} s={[3.5,.12,.1]} color={C.white} emissive="#d4e3e9" emissiveIntensity={1.2}/>
        <Tag p={[0, 33, 0]} tone="incident">
          滨河 01 号楼 · 8F
        </Tag>
      </group>
      {STATION_LAYOUT.map(({id, position:p, name:label, rotation}) => (
        <group
          key={id}
          position={p}
          rotation={[0,rotation,0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
        >
          <Box p={[0, SURFACE_Y-.04, 5]} s={[23, .08, 26]} color="#495459" roughness={.94} metalness={0} surface="asphalt" depthLayer={GROUND_LAYERS.apron} />
          <Box p={[0, 3, -4]} s={[20, 6, 6]} color="#cbd4d7" roughness={.86} metalness={0} surface="concrete" />
          <Box p={[0, 6.2, -4]} s={[21, 0.4, 7]} color={C.red} roughness={.7} metalness={.06} />
          <Box p={[0,5.6,-.88]} s={[19,.14,.16]} color="#edf3f5" emissive="#d7e6ed" emissiveIntensity={1.8}/>
          <pointLight position={[0,5.4,1.5]} intensity={140} distance={21} decay={2} color="#e1e8ed"/>
          {[-6, 0, 6].map((x) => (
            <group key={x}>
              <Box p={[x, 2, -0.95]} s={[4.7, 3.8, 0.12]} color="#98453d" roughness={.48} metalness={.4} />
              {[0, 1, 2, 3].map((i) => (
                <Box
                  key={i}
                  p={[x, 0.7 + i * 0.8, -0.86]}
                  s={[4.5, 0.07, 0.04]}
                  color="#98aab2"
                  roughness={.35}
                  metalness={.48}
                />
              ))}
            </group>
          ))}
          <StationSign label={label} />
          <Tag p={[0, 9, -4]}>{label}</Tag>
        </group>
      ))}
      {STATION_LAYOUT.map(s=><Driveway key={s.id} from={s.driveway[0]} to={s.entry}/>)}
      {LOW_BUILDINGS.map(b=><LowBuilding key={b.id} p={b.position} s={b.size} color={b.color}/>)}
      {TREE_POSITIONS.map((p,i)=><Tree key={i} p={p}/>)}
      <CityDetails details={CITY_DETAIL_BOXES} canopies={CITY_TREE_CANOPIES} />
      <CityContext />
      {STREET_LAMPS.map(({position,rotation},i)=><StreetLamp key={i} p={position} rotation={rotation}/>)}
      {WATER_SOURCES.map(({fixture:p,bay,approach}, i) => (
        <group key={i}>
        <Driveway from={approach} to={bay}/>
        <group
          position={p}
          onClick={(e) => {
            e.stopPropagation();
            onSelect("water-node");
          }}
        >
          <Cylinder p={[0, 0.5, 0]} r={1.4} h={1} color="#c5cfd2" roughness={.9} metalness={0} />
          <Cylinder p={[0, 1.5, 0]} r={0.42} h={1.5} color={C.blue} />
          <Box p={[0, 2, 0]} s={[1.5, 0.35, 0.4]} color={C.blue} />
          <Tag p={[0, 4, 0]} tone="water">
            市政补水点
          </Tag>
        </group>
        </group>
      ))}
      {[-11,-5,-1,11,15].map((x) => (
        <group key={x} position={[x, SURFACE_Y, 16]}>
          <Box p={[0, 0.1, 0]} s={[0.9, 0.2, 0.9]} color={C.dark} />
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.4, 1.3, 8]} />
            <meshStandardMaterial color="#ef744c" />
          </mesh>
          <Cylinder p={[0, 0.8, 0]} r={0.18} h={0.2} color={C.white} />
        </group>
      ))}
    </group></UrbanSurfaceProvider>
  );
});
