import { NightEnvironment } from "./NightEnvironment";

export function NightLighting() {
  return (
    <group name="night-lighting">
      <NightEnvironment />
      <hemisphereLight args={["#d2dce5", "#292d31", .48]} />
      <ambientLight intensity={.08} color="#dce1e5" />
      <directionalLight
        name="moon-key"
        position={[-35, 80, 35]}
        intensity={1.4}
        color="#e2e9f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-normalBias={.04}
        shadow-bias={-.0001}
      />
      <directionalLight position={[40, 30, -45]} intensity={.16} color="#e4e9ec" />
      <pointLight position={[6, 14, 16]} intensity={110} distance={40} decay={2} color="#e7eff1" />
    </group>
  );
}
