import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OrthographicCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SceneProps, Vec3 } from "../types";
import { sceneTarget } from "./focus";
import { OVERVIEW_ANCHOR, OVERVIEW_OFFSET, overviewFrame, safeCameraTarget } from "./camera";

type CameraMode = "overview" | "focus" | "follow" | "command";

export function CameraRig(props: SceneProps) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const anchor = useRef<Vec3>([...OVERVIEW_ANCHOR]);
  const desiredZoom = useRef(overviewFrame(size.width, size.height).zoom);
  const mode = useRef<CameraMode>("overview");
  const manual = useRef(false);
  const zooming = useRef(false);
  const initialized = useRef(false);
  const tourSuppressed = useRef(false);
  const sequence = useRef(-1);
  const priorSelection = useRef(props.selectedId);
  const priorView = useRef(props.view);
  const priorSize = useRef({ width: size.width, height: size.height });
  const minZoom = Math.min(.5, overviewFrame(size.width, size.height).zoom * .5);

  const stopTour = () => {
    if (props.touring && !tourSuppressed.current) {
      tourSuppressed.current = true;
      props.onTourChange(false);
    }
  };

  useFrame((_, dt) => {
    const orbit = controls.current;
    if (!orbit) return;
    const ortho = camera as OrthographicCamera;
    const resized = priorSize.current.width !== size.width || priorSize.current.height !== size.height;
    const selectionChanged = priorSelection.current !== props.selectedId;
    const viewChanged = priorView.current !== props.view;
    const command = sequence.current !== props.cameraCommand.sequence ? props.cameraCommand.type : null;
    sequence.current = props.cameraCommand.sequence;
    priorSelection.current = props.selectedId;
    priorView.current = props.view;
    priorSize.current = { width: size.width, height: size.height };
    if (!props.touring) tourSuppressed.current = false;

    if (!initialized.current || command === "reset") {
      // Flush residual orbit damping before committing all three parts of a reset.
      const damping = orbit.enableDamping;
      orbit.enableDamping = false;
      orbit.update();
      orbit.enableDamping = damping;
      const frame = overviewFrame(size.width, size.height);
      orbit.target.set(...frame.target);
      camera.position.copy(orbit.target).add(new Vector3(...OVERVIEW_OFFSET));
      ortho.zoom = frame.zoom;
      desiredZoom.current = frame.zoom;
      anchor.current = [...OVERVIEW_ANCHOR];
      mode.current = "overview";
      manual.current = false;
      zooming.current = false;
      initialized.current = true;
      ortho.updateProjectionMatrix();
      orbit.update();
      camera.updateMatrixWorld();
      if (command === "reset") {
        stopTour();
        return;
      }
    }

    const offset = camera.position.clone().sub(orbit.target);
    const reframe = () => {
      const overview = overviewFrame(size.width, size.height, offset.toArray());
      anchor.current = mode.current === "overview" ? [...OVERVIEW_ANCHOR]
        : mode.current === "command" ? [10, 8, 7]
        : sceneTarget(props.state, props.selectedId, mode.current === "follow");
      desiredZoom.current = mode.current === "overview" ? overview.zoom
        : Math.min(12, overview.zoom * (mode.current === "command" ? 1.7 : 1.9));
    };

    if (viewChanged) {
      mode.current = props.view;
      manual.current = false;
      stopTour();
      reframe();
    }
    if (selectionChanged || command === "focus") {
      mode.current = props.view === "follow" ? "follow" : "focus";
      manual.current = false;
      stopTour();
      reframe();
    }
    if (resized && !manual.current) reframe();
    if (command === "zoomIn" || command === "zoomOut") {
      desiredZoom.current = Math.min(22, Math.max(minZoom, ortho.zoom * (command === "zoomIn" ? 1.3 : 1 / 1.3)));
      zooming.current = true;
    }

    if (props.touring && !tourSuppressed.current) {
      manual.current = false;
      const angle = props.state.time * .025;
      offset.lerp(new Vector3(Math.cos(angle) * 125, 100, Math.sin(angle) * 125), 1 - Math.exp(-dt));
      camera.position.copy(orbit.target).add(offset);
      anchor.current = [4, 7, 0];
    } else if (mode.current === "follow" && !manual.current) {
      anchor.current = sceneTarget(props.state, props.selectedId, true);
    }

    if (!manual.current || zooming.current) {
      ortho.zoom += (desiredZoom.current - ortho.zoom) * (1 - Math.exp(-dt * 5));
      if (Math.abs(desiredZoom.current - ortho.zoom) < .000001) {
        ortho.zoom = desiredZoom.current;
        zooming.current = false;
      }
      if (!manual.current) {
        const target = new Vector3(...safeCameraTarget(anchor.current, size.width, size.height, ortho.zoom, offset.toArray()));
        const previous = orbit.target.clone();
        orbit.target.lerp(target, 1 - Math.exp(-dt * 4));
        camera.position.add(orbit.target.clone().sub(previous));
      }
      ortho.updateProjectionMatrix();
    }
    orbit.update();
    camera.updateMatrixWorld();
  }, -0.5);

  return <OrbitControls
    ref={controls}
    makeDefault
    enableDamping
    dampingFactor={.12}
    minZoom={minZoom}
    maxZoom={25}
    maxPolarAngle={Math.PI * .46}
    minPolarAngle={.25}
    onStart={() => {
      manual.current = true;
      zooming.current = false;
      stopTour();
    }}
  />;
}
