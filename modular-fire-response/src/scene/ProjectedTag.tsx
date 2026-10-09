import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3, type WebGLRenderer } from "three";
import type { Vec3 } from "../types";
import { labelText } from "./labelText";
import { placeSceneLabels } from "./labelLayout";
import { sceneViewport } from "./camera";

interface Annotation {
  id: number;
  node: HTMLDivElement;
  leader: HTMLDivElement;
  x: number;
  y: number;
  priority: number;
  eligible: boolean;
}

const registries = new WeakMap<WebGLRenderer, Map<number, Annotation>>();
let nextId = 1;
const registryFor = (gl: WebGLRenderer) => {
  let registry = registries.get(gl);
  if (!registry) {
    registry = new Map();
    registries.set(gl, registry);
  }
  return registry;
};

// One layout pass follows every anchor projection, without creating DOM React roots.
export function SceneLabels() {
  const { gl } = useThree();
  useFrame(({ size }) => {
    const registry = registryFor(gl);
    const labels = [...registry.values()];
    const overlays = gl.domElement.closest(".app")?.querySelectorAll(
      ".scene-controls, .scene-legend, .inspector, .bottom-panel, .search-results, .completion",
    );
    const canvasBounds = gl.domElement.getBoundingClientRect();
    const obstacles = Array.from(overlays ?? []).map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0)
      .map(rect => ({
        left: rect.left - canvasBounds.left, top: rect.top - canvasBounds.top,
        right: rect.right - canvasBounds.left, bottom: rect.bottom - canvasBounds.top,
      }));
    const placed = placeSceneLabels(
      labels.filter(label => label.eligible).map(label => ({
        id: label.id, x: label.x, y: label.y, priority: label.priority,
        width: label.node.offsetWidth, height: label.node.offsetHeight,
      })),
      sceneViewport(size.width, size.height),
      obstacles,
    );
    const visible = new Set(placed.map(label => label.id));
    for (const label of labels) {
      if (!visible.has(label.id)) {
        label.node.style.visibility = "hidden";
        label.leader.style.visibility = "hidden";
      }
    }
    for (const p of placed) {
      const label = registry.get(p.id)!;
      label.node.style.visibility = "visible";
      label.node.style.transform = `translate3d(${p.left}px,${p.top}px,0)`;
      const endX = Math.max(p.left, Math.min(p.left + p.width, p.anchorX));
      const endY = Math.max(p.top, Math.min(p.top + p.height, p.anchorY));
      const length = Math.hypot(endX - p.anchorX, endY - p.anchorY);
      label.leader.style.visibility = length > 5 ? "visible" : "hidden";
      if (length > 5) {
        label.leader.style.width = `${length}px`;
        label.leader.style.transform = `translate3d(${p.anchorX}px,${p.anchorY}px,0) rotate(${Math.atan2(endY - p.anchorY, endX - p.anchorX)}rad)`;
      }
    }
  }, 0);
  return null;
}

// These text-only overlays deliberately have no nested React DOM root.
export function Tag({
  children,
  p,
  tone = "",
}: {
  children: ReactNode;
  p: Vec3;
  tone?: string;
}) {
  const { gl } = useThree();
  const group = useRef<Group>(null);
  const annotation = useRef<Annotation | null>(null);
  const vectors = useRef({
    world: new Vector3(),
    clip: new Vector3(),
    camera: new Vector3(),
    forward: new Vector3(),
  });
  const text = labelText(children);
  useLayoutEffect(() => {
    const node = document.createElement("div");
    const leader = document.createElement("div");
    node.style.cssText =
      "position:absolute;left:0;top:0;pointer-events:none;visibility:hidden;z-index:8;";
    leader.setAttribute("aria-hidden", "true");
    gl.domElement.parentElement?.appendChild(leader);
    gl.domElement.parentElement?.appendChild(node);
    const entry = { id: nextId++, node, leader, x: 0, y: 0, priority: 0, eligible: false };
    annotation.current = entry;
    registryFor(gl).set(entry.id, entry);
    return () => {
      node.remove();
      leader.remove();
      registryFor(gl).delete(entry.id);
      if (annotation.current === entry) annotation.current = null;
    };
  }, [gl]);
  useLayoutEffect(() => {
    if (annotation.current) {
      const entry = annotation.current;
      entry.node.className = "scene-tag " + tone;
      entry.node.textContent = text;
      entry.leader.className = "scene-tag-leader " + tone;
      entry.priority = tone === "selected" ? 100 : tone === "incident" ? 90 : tone === "warning" ? 70 : tone === "water" ? 60 : 40;
    }
  }, [text, tone, gl]);
  useFrame(({ camera, size }) => {
    const entry = annotation.current;
    if (!entry || !group.current) return;
    group.current.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    const { world, clip, camera: eye, forward } = vectors.current;
    group.current.getWorldPosition(world);
    clip.copy(world).project(camera);
    camera.getWorldPosition(eye);
    camera.getWorldDirection(forward);
    const inFront = world.sub(eye).dot(forward) > 0;
    entry.eligible =
      inFront &&
      Number.isFinite(clip.x) &&
      Math.abs(clip.x) <= 1 &&
      Math.abs(clip.y) <= 1 &&
      Math.abs(clip.z) <= 1;
    entry.x = ((clip.x + 1) * size.width) / 2;
    entry.y = ((1 - clip.y) * size.height) / 2;
  }, -0.25);
  return <group ref={group} position={p} />;
}
