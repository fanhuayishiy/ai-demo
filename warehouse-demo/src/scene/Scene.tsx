import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping, OrthographicCamera, PCFShadowMap } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { SceneProps } from '../types';
import { World } from './World';
import { CAMERA_POSITION, CAMERA_TARGET, getCameraLayout } from './layout';
import { blendPose, focusPose, tourPose, type CameraPose } from './camera';
import { sampleSimulation } from '../simulation';
import { listenForContext } from './context';
import { retainSceneResources } from './resources';

export function CameraRig({ cameraCommand: command, elapsedRef, touring, onCameraInteract, onContextStatus }: SceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size, gl } = useThree();
  const tween = useRef<{ from: CameraPose; to: CameraPose; time: number } | null>(null);
  const tourTime = useRef(0);
  const tourStart = useRef<CameraPose | null>(null);
  const isTouring = useRef(false);
  const layout = getCameraLayout(size.width, size.height);
  const baseline = layout.zoom;
  const snapshot = (): CameraPose => ({ position: camera.position.toArray(), target: controls.current?.target.toArray() ?? [...CAMERA_TARGET], zoomFactor: (camera as OrthographicCamera).zoom / baseline });
  const apply = (pose: CameraPose) => {
    camera.position.set(...pose.position);
    controls.current?.target.set(...pose.target);
    (camera as OrthographicCamera).zoom = baseline * pose.zoomFactor;
    camera.updateProjectionMatrix();
    controls.current?.update();
  };
  useEffect(() => retainSceneResources(), []);
  useEffect(() => listenForContext(gl.domElement, lost => {
    onContextStatus?.(lost);
    if (lost) { tween.current = null; isTouring.current = false; onCameraInteract?.(); }
  }), [gl, onContextStatus, onCameraInteract]);
  useEffect(() => {
    const ortho = camera as OrthographicCamera;
    tween.current = null;
    ortho.zoom = baseline;
    ortho.setViewOffset(size.width, size.height, -layout.offsetX, -layout.offsetY, size.width, size.height);
    ortho.updateProjectionMatrix();
  }, [baseline, camera, size.width, size.height, layout.offsetX, layout.offsetY]);
  useEffect(() => {
    const ortho = camera as OrthographicCamera;
    tween.current = null;
    if (command.type === 'reset') {
      camera.position.set(...CAMERA_POSITION);
      controls.current?.target.set(...CAMERA_TARGET);
      ortho.zoom = baseline;
      controls.current?.update();
    } else if (command.type === 'focus') {
      const pose = focusPose(command.entityId ?? 'warehouse-01', sampleSimulation(elapsedRef.current));
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) apply(pose);
      else tween.current = { from: snapshot(), to: pose, time: 0 };
    } else ortho.zoom = Math.max(baseline * .65, Math.min(baseline * 2.7, ortho.zoom * (command.type === 'zoomIn' ? 1.2 : 1 / 1.2)));
    ortho.updateProjectionMatrix();
  }, [command.sequence]);
  useEffect(() => {
    isTouring.current = !!touring;
    if (touring) tween.current = null;
    tourTime.current = 0;
    tourStart.current = touring ? snapshot() : null;
  }, [touring]);
  useFrame((_, delta) => {
    if (document.hidden) return;
    const dt = Math.min(delta, .1);
    if (isTouring.current) {
      tourTime.current += dt;
      const t = tourTime.current;
      apply(t < 1 ? blendPose(tourStart.current!, tourPose(0), t) : tourPose(t - 1));
    } else if (tween.current) {
      tween.current.time += dt;
      apply(blendPose(tween.current.from, tween.current.to, tween.current.time / .8));
      if (tween.current.time >= .8) tween.current = null;
    }
  });
  return <OrbitControls ref={controls} makeDefault target={CAMERA_TARGET} enableDamping dampingFactor={.09} onStart={() => { tween.current = null; isTouring.current = false; onCameraInteract?.(); }} minPolarAngle={.3} maxPolarAngle={1.28} minZoom={baseline * .65} maxZoom={baseline * 2.7} maxDistance={100} />;
}
export function Scene(props: SceneProps) {
  return <Canvas orthographic shadows={{ type: PCFShadowMap }} dpr={[1, 1.7]} camera={{ position: CAMERA_POSITION, zoom: 22, near: .1, far: 180 }} gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }} style={{ width: '100%', height: '100%' }}>
    <color attach="background" args={['#e9effb']} />
    <ambientLight intensity={1.2} />
    <hemisphereLight args={['#e5edff', '#becedc', 1.2]} />
    <directionalLight position={[-16, 30, 18]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-near={1} shadow-camera-far={85} shadow-bias={-.0002} shadow-normalBias={.035} />
    <World {...props} />
    <CameraRig {...props} />
  </Canvas>;
}
