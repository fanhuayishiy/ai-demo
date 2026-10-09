import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator, type Scene, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export function installNightEnvironment(renderer: WebGLRenderer, scene: Scene) {
  const previous = scene.environment;
  const previousIntensity = scene.environmentIntensity;
  const createTarget = (): WebGLRenderTarget => {
    const generator = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    try {
      return generator.fromScene(room, .02);
    } finally {
      room.dispose();
      generator.dispose();
    }
  };
  let target = createTarget();
  scene.environment = target.texture;
  scene.environmentIntensity = .14;
  const restored = () => {
    if (scene.environment !== target.texture) return;
    const replacement = createTarget();
    const expired = target;
    target = replacement;
    scene.environment = target.texture;
    expired.dispose();
  };
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  return () => {
    renderer.domElement.removeEventListener("webglcontextrestored", restored);
    if (scene.environment === target.texture) {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
    }
    target.dispose();
  };
}

export function NightEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => installNightEnvironment(gl, scene), [gl, scene]);
  return null;
}
