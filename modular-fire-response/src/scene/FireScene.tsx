import { Component, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import type { SceneProps, Vec3 } from "../types";
import { City } from "./City";
import { Vehicle } from "./Vehicles";
import { Effects } from "./Effects";
import { CameraRig } from "./CameraRig";
import { NightLighting } from "./NightLighting";
import { SceneLabels } from "./ProjectedTag";
import "./Scene.css";
function ContextEvents({
  onContextStatus,
}: Pick<SceneProps, "onContextStatus">) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextStatus?.(true);
    };
    const restored = () => onContextStatus?.(false);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, onContextStatus]);
  return null;
}
class SceneBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        三维场景暂不可用，请检查浏览器硬件加速后刷新。
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function FireScene(props: SceneProps) {
  return (
    <div className="scene-root">
      <SceneBoundary onError={() => props.onContextStatus?.(true)}>
        <Canvas
          orthographic
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [98, 103, 120], zoom: 6, near: 0.1, far: 600 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
          onPointerMissed={() => props.onSelect("incident")}
          fallback={
            <div className="scene-fallback">
              当前浏览器不支持 WebGL 三维渲染。
            </div>
          }
        >
          <color attach="background" args={["#101518"]} />
          <NightLighting />
          <City onSelect={props.onSelect} />
          {props.state.units.map((unit) => (
            <Vehicle
              key={unit.id}
              unit={unit}
              time={props.state.time}
              selected={props.selectedId === unit.id}
              onSelect={props.onSelect}
              rescue={
                props.state.approvals.rescue &&
                props.state.life.confirmed &&
                props.state.life.rescued === 0 &&
                !props.state.complete &&
                unit.status === "working"
              }
            />
          ))}
          <Effects state={props.state} selectedId={props.selectedId} onSelect={props.onSelect} />
          {props.state.units.filter(u=>u.id===props.selectedId&&u.route.length>0).map(u=><Line key={u.id} points={[u.position,...u.route].map(p=>[p[0],.35,p[2]] as Vec3)} color="#dc5046" lineWidth={2} dashed dashSize={1.2} gapSize={.65}/>)}
          <CameraRig {...props} />
          <SceneLabels />
          <ContextEvents onContextStatus={props.onContextStatus} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
