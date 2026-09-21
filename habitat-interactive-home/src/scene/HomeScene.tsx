import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { rooms } from "../data";
import type { Device, HomeSceneProps, SceneHandle } from "../types";
import { buildHouse } from "./house";

type Surface = {
  material: THREE.MeshStandardMaterial;
  color: THREE.Color;
  emissive: THREE.Color;
  strength: number;
  baseMap: THREE.Texture | null;
};
type DeviceLight = { light: THREE.PointLight };
type WallSurface = { material: THREE.Material; opacity: number };
type Label = {
  element: HTMLButtonElement;
  dot: HTMLSpanElement;
  text: HTMLSpanElement;
};
const initialDirection = new THREE.Vector3(13, 15, 19).normalize();
const labelOrder = [
  "living-pendant",
  "bedroom-main",
  "kitchen-main",
  "study-main",
  "bathroom-main",
  "balcony-washer",
];
const palettes = {
  day: {
    sky: "#f2f3f4",
    ground: "#aca18e",
    sun: "#fff3de",
    ambient: 0.85,
    direct: 2.1,
    fill: 0.42,
    exposure: 0.96,
  },
  dusk: {
    sky: "#b5bce0",
    ground: "#78604e",
    sun: "#ffba8a",
    ambient: 0.43,
    direct: 1.08,
    fill: 0.23,
    exposure: 1.03,
  },
  night: {
    sky: "#889ab8",
    ground: "#404e61",
    sun: "#bdcfea",
    ambient: 0.15,
    direct: 0.12,
    fill: 0.08,
    exposure: 1.0,
  },
};

function temperatureColor(kelvin = 3000) {
  const t = THREE.MathUtils.clamp(kelvin, 2700, 6500) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b =
    t >= 66
      ? 255
      : t <= 19
        ? 0
        : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return new THREE.Color().setRGB(
    THREE.MathUtils.clamp(r / 255, 0, 1),
    THREE.MathUtils.clamp(g / 255, 0, 1),
    THREE.MathUtils.clamp(b / 255, 0, 1),
    THREE.SRGBColorSpace,
  );
}

function tvTexture(mode: string | undefined): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  if (mode === "电影") {
    gradient.addColorStop(0, "#151927");
    gradient.addColorStop(0.45, "#273552");
    gradient.addColorStop(1, "#8c4c52");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e7c1a2";
    context.beginPath();
    context.arc(703, 185, 60, 0, Math.PI * 2);
    context.fill();
    ["#314353", "#233543", "#162935"].forEach((color, index) => {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, 420 + index * 27);
      context.bezierCurveTo(
        180,
        200 + index * 70,
        295,
        395 + index * 25,
        447,
        330 + index * 48,
      );
      context.bezierCurveTo(
        631,
        198 + index * 76,
        766,
        390 + index * 42,
        960,
        277 + index * 76,
      );
      context.lineTo(960, 540);
      context.lineTo(0, 540);
      context.closePath();
      context.fill();
    });
    context.fillStyle = "rgba(244,224,178,.86)";
    context.font = "600 36px Georgia, serif";
    context.fillText("CINEMA", 56, 82);
    context.font = "19px sans-serif";
    context.fillStyle = "rgba(238,225,207,.75)";
    context.fillText("an evening in motion", 59, 114);
    context.fillStyle = "rgba(5,8,18,.68)";
    context.fillRect(0, canvas.height - 44, canvas.width, 44);
    context.fillStyle = "rgba(248,229,184,.82)";
    context.fillRect(60, canvas.height - 24, 230, 3);
    context.beginPath();
    context.arc(308, canvas.height - 22, 6, 0, Math.PI * 2);
    context.fill();
  } else {
    gradient.addColorStop(0, "#d9b78d");
    gradient.addColorStop(0.45, "#5d6e62");
    gradient.addColorStop(1, "#26353c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#172b2c";
    context.beginPath();
    context.arc(700, 282, 174, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(238,231,194,.14)";
    context.lineWidth = 2;
    for (let radius = 68; radius < 170; radius += 13) {
      context.beginPath();
      context.arc(700, 282, radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = "#d6af78";
    context.beginPath();
    context.arc(700, 282, 57, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#213536";
    context.beginPath();
    context.arc(700, 282, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,242,207,.92)";
    context.font = "600 31px sans-serif";
    context.fillText("NOW PLAYING", 50, 74);
    context.font = "18px sans-serif";
    context.fillStyle = "rgba(255,246,221,.72)";
    context.fillText("soft light / slow morning", 53, 106);
    const bars = [44, 72, 34, 96, 59, 84, 50, 69, 38, 77, 56, 88, 42];
    context.fillStyle = "rgba(248,226,171,.78)";
    bars.forEach((bar, index) =>
      context.fillRect(54 + index * 25, 424 - bar, 11, bar),
    );
    context.strokeStyle = "rgba(255,237,194,.52)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(48, 424);
    context.lineTo(411, 424);
    context.stroke();
    context.font = "30px serif";
    context.fillText("♫", 854, 88);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const HomeScene = forwardRef<SceneHandle, HomeSceneProps>(
  function HomeScene(props, forwardedRef) {
    const hostRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(props);
    propsRef.current = props;
    const apiRef = useRef<SceneHandle>({
      zoom: () => {},
      reset: () => {},
      capture: () => "",
    });
    const [error, setError] = useState("");
    useImperativeHandle(
      forwardedRef,
      () => ({
        zoom: (factor) => apiRef.current.zoom(factor),
        reset: () => apiRef.current.reset(),
        capture: () => apiRef.current.capture(),
      }),
      [],
    );

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      const compassNeedle = host
        .closest(".scene-stage")
        ?.querySelector("[data-compass-needle]");
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        });
      } catch {
        setError(
          "当前浏览器无法启用 3D 图形。请开启浏览器硬件加速，或使用新版 Chrome / Edge 打开。",
        );
        propsRef.current.onReady();
        return;
      }
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const scene = new THREE.Scene();
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = palettes.day.exposure;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const environmentRoom = new RoomEnvironment();
      const environmentGenerator = new THREE.PMREMGenerator(renderer);
      const environmentTarget = environmentGenerator.fromScene(
        environmentRoom,
        0.02,
      );
      scene.environment = environmentTarget.texture;
      scene.environmentIntensity = 0.2;
      environmentRoom.dispose();
      environmentGenerator.dispose();
      renderer.domElement.setAttribute(
        "aria-label",
        "可交互三维家居模型，拖动旋转，滚轮缩放，点击家电进行控制",
      );
      renderer.domElement.setAttribute("role", "img");
      Object.assign(renderer.domElement.style, {
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
        outline: "none",
      });
      host.appendChild(renderer.domElement);

      const labelLayer = document.createElement("div");
      Object.assign(labelLayer.style, {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: "2",
      });
      host.appendChild(labelLayer);
      const labels = new Map<string, Label>();
      propsRef.current.devices.forEach((device) => {
        const element = document.createElement("button");
        element.type = "button";
        element.dataset.deviceLabel = device.id;
        element.setAttribute("aria-label", `控制${device.name}`);
        Object.assign(element.style, {
          position: "absolute",
          left: "0",
          top: "0",
          display: "none",
          alignItems: "center",
          gap: "7px",
          height: "31px",
          padding: "0 11px",
          border: "1px solid rgba(255,255,255,.78)",
          borderRadius: "9px",
          color: "#323e36",
          background: "rgba(255,255,252,.92)",
          boxShadow: "0 3px 15px rgba(53,64,49,.08)",
          fontFamily: "inherit",
          fontSize: "11px",
          fontWeight: "500",
          whiteSpace: "nowrap",
          pointerEvents: "auto",
          cursor: "pointer",
          transition: "background .2s, box-shadow .2s",
          backdropFilter: "blur(8px)",
        });
        const dot = document.createElement("span");
        Object.assign(dot.style, {
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          flexShrink: "0",
        });
        const text = document.createElement("span");
        text.textContent = device.name;
        element.append(dot, text);
        element.addEventListener("pointerdown", (event) =>
          event.stopPropagation(),
        );
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          propsRef.current.onSelect(device.id);
        });
        element.addEventListener("mouseenter", () => {
          element.style.boxShadow = "0 4px 18px rgba(53,64,49,.2)";
        });
        element.addEventListener("mouseleave", () => {
          element.style.boxShadow = "0 3px 15px rgba(53,64,49,.08)";
        });
        labelLayer.appendChild(element);
        labels.set(device.id, { element, dot, text });
      });

      const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 150);
      camera.position.copy(initialDirection).multiplyScalar(25);
      camera.lookAt(0, 0.4, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.4, 0);
      controls.enableDamping = !reducedMotion;
      controls.dampingFactor = 0.075;
      controls.minPolarAngle = 0.02;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.minZoom = 0.6;
      controls.maxZoom = 4.8;
      controls.rotateSpeed = 0.62;
      controls.panSpeed = 0.85;
      controls.zoomSpeed = 0.75;
      controls.screenSpacePanning = true;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      const house = buildHouse();
      scene.add(house.group);

      const hemi = new THREE.HemisphereLight(
        palettes.day.sky,
        palettes.day.ground,
        palettes.day.ambient,
      );
      scene.add(hemi);
      const sunlight = new THREE.DirectionalLight(
        palettes.day.sun,
        palettes.day.direct,
      );
      sunlight.position.set(-7, 17, 9);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.set(2048, 2048);
      sunlight.shadow.camera.left = -12;
      sunlight.shadow.camera.right = 12;
      sunlight.shadow.camera.top = 12;
      sunlight.shadow.camera.bottom = -12;
      sunlight.shadow.camera.near = 1;
      sunlight.shadow.camera.far = 45;
      sunlight.shadow.bias = -0.0004;
      sunlight.shadow.normalBias = 0.035;
      sunlight.shadow.radius = 3;
      scene.add(sunlight);
      const fill = new THREE.DirectionalLight("#d8e8ef", palettes.day.fill);
      fill.position.set(7, 8, -10);
      scene.add(fill);
      const shadowFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(45, 45),
        new THREE.ShadowMaterial({ opacity: 0.11, depthWrite: false }),
      );
      shadowFloor.rotation.x = -Math.PI / 2;
      shadowFloor.position.y = -0.28;
      shadowFloor.receiveShadow = true;
      scene.add(shadowFloor);

      const deviceLights = new Map<string, DeviceLight>();
      const emissionSurfaces = new Map<string, Surface[]>();
      propsRef.current.devices.forEach((device) => {
        if (device.type === "light") {
          const light = new THREE.PointLight(
            temperatureColor(device.temperature),
            0,
            device.id.includes("strip") ? 3.5 : 5.5,
            2,
          );
          light.position.fromArray(device.position);
          light.position.y = Math.max(0.25, light.position.y - 0.17);
          light.castShadow = false;
          scene.add(light);
          deviceLights.set(device.id, { light });
        }
        const surfaces: Surface[] = [];
        (house.lightEmitters.get(device.id) ?? []).forEach((mesh) => {
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          mats.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial)
              surfaces.push({
                material: mat,
                color: mat.color.clone(),
                emissive: mat.emissive.clone(),
                strength: mat.emissiveIntensity,
                baseMap: mat.map,
              });
          });
        });
        emissionSurfaces.set(device.id, surfaces);
      });
      const tvModeTextures = new Map<string, THREE.CanvasTexture>();
      let appliedTvMode: string | undefined;
      const wallSurfaces = house.walls.map((wall) => {
        const surfaces: WallSurface[] = [];
        wall.group.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const originals = Array.isArray(child.material)
            ? child.material
            : [child.material];
          const clones = originals.map((material) => {
            const clone = material.clone();
            clone.transparent = true;
            surfaces.push({ material: clone, opacity: material.opacity });
            return clone;
          });
          child.material = Array.isArray(child.material) ? clones : clones[0];
        });
        return { wall, surfaces, opacity: 1 };
      });
      const animatedOrigins = new Map<
        THREE.Object3D,
        { position: THREE.Vector3; scale: THREE.Vector3 }
      >();
      house.animated.forEach((objects) =>
        objects.forEach((object) =>
          animatedOrigins.set(object, {
            position: object.position.clone(),
            scale: object.scale.clone(),
          }),
        ),
      );

      const selection = new THREE.Group();
      const selectionMaterial = new THREE.MeshBasicMaterial({
        color: "#708e73",
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.735, 64),
        selectionMaterial,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.1;
      selection.add(ring);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: "#92b098",
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.68, 0.94, 64),
        haloMaterial,
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.095;
      selection.add(halo);
      selection.visible = false;
      scene.add(selection);
      const hoverMaterial = new THREE.MeshBasicMaterial({
        color: "#9cae8f",
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const hoverRing = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.455, 48),
        hoverMaterial,
      );
      hoverRing.rotation.x = -Math.PI / 2;
      hoverRing.position.y = 0.1;
      hoverRing.visible = false;
      scene.add(hoverRing);

      let width = 1;
      let height = 1;
      let desiredZoom = 1;
      let cameraMoving = false;
      const desiredTarget = controls.target.clone();
      const desiredPosition = camera.position.clone();
      const projected = new THREE.Vector3();
      const cameraDirection = new THREE.Vector3();
      const pointer = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      const activePointers = new Set<number>();
      let pointerStart: { x: number; y: number; time: number } | null = null;
      let moved = false;
      let hoverId: string | null = null;
      let lastSelectedId: string | null = null;
      let previousRoom = propsRef.current.room;
      let previousView = propsRef.current.view;
      let lastFrameTime = 0;
      let ready = false;
      let disposed = false;
      let frameId = 0;

      function fitZoom() {
        const aspect = width / Math.max(1, height);
        return propsRef.current.view === "top"
          ? Math.min(1.28, aspect * 1.04)
          : Math.min(1.18, aspect * 0.84);
      }
      function navigate(reset = false) {
        const current = propsRef.current;
        const selectedRoom =
          rooms.find((room) => room.id === current.room) ?? rooms[0];
        desiredTarget.fromArray(selectedRoom.center);
        desiredTarget.y = current.view === "top" ? 0 : 0.45;
        const direction =
          current.view === "top"
            ? new THREE.Vector3(0, 1, 0.0001)
            : initialDirection;
        desiredPosition.copy(desiredTarget).addScaledVector(direction, 25);
        desiredZoom =
          current.room === "all" ? fitZoom() : Math.min(2.8, fitZoom() * 2.0);
        if (reset) {
          desiredTarget.set(0, current.view === "top" ? 0 : 0.45, 0);
          desiredPosition.copy(desiredTarget).addScaledVector(direction, 25);
          desiredZoom = fitZoom();
        }
        controls.enableRotate = current.view !== "top";
        controls.minPolarAngle = current.view === "top" ? 0 : 0.02;
        cameraMoving = true;
      }
      function resize() {
        const bounds = host!.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        const aspect = width / height;
        camera.left = -7.2 * aspect;
        camera.right = 7.2 * aspect;
        camera.top = 7.2;
        camera.bottom = -7.2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        if (propsRef.current.room === "all") {
          desiredZoom = fitZoom();
          camera.zoom = desiredZoom;
          camera.updateProjectionMatrix();
        }
      }
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      navigate();
      camera.position.copy(desiredPosition);
      controls.target.copy(desiredTarget);
      camera.zoom = desiredZoom;
      camera.updateProjectionMatrix();
      controls.update();
      cameraMoving = false;

      function hitDevice(event: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(house.group, true);
        for (const hit of hits) {
          if (!(hit.object instanceof THREE.Mesh)) continue;
          const materials = Array.isArray(hit.object.material)
            ? hit.object.material
            : [hit.object.material];
          const faceMaterial =
            materials[hit.face?.materialIndex ?? 0] ?? materials[0];
          if (!faceMaterial.visible || faceMaterial.opacity < 0.45) continue;
          let object: THREE.Object3D | null = hit.object;
          let deviceId: string | null = null;
          let visible = true;
          while (object) {
            if (!object.visible) {
              visible = false;
              break;
            }
            if (object.userData.deviceId)
              deviceId = object.userData.deviceId as string;
            object = object.parent;
          }
          if (!visible) continue;
          return deviceId;
        }
        return null;
      }
      function pointerDown(event: PointerEvent) {
        if (event.button !== 0) return;
        activePointers.add(event.pointerId);
        if (activePointers.size > 1) {
          pointerStart = null;
          moved = true;
          return;
        }
        pointerStart = {
          x: event.clientX,
          y: event.clientY,
          time: performance.now(),
        };
        moved = false;
      }
      function pointerMove(event: PointerEvent) {
        if (
          pointerStart &&
          Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          ) > 5
        )
          moved = true;
        if (event.buttons) {
          renderer.domElement.style.cursor = "grabbing";
          hoverId = null;
          return;
        }
        hoverId = hitDevice(event);
        renderer.domElement.style.cursor = hoverId ? "pointer" : "grab";
      }
      function pointerUp(event: PointerEvent) {
        activePointers.delete(event.pointerId);
        if (
          pointerStart &&
          !moved &&
          performance.now() - pointerStart.time < 600
        )
          propsRef.current.onSelect(hitDevice(event));
        pointerStart = null;
        renderer.domElement.style.cursor = hoverId ? "pointer" : "grab";
      }
      function pointerCancel() {
        activePointers.clear();
        pointerStart = null;
        hoverId = null;
      }
      function pointerLeave() {
        hoverId = null;
        renderer.domElement.style.cursor = "grab";
      }
      function startControl() {
        cameraMoving = false;
        desiredZoom = camera.zoom;
      }
      function changeControl() {
        if (!cameraMoving) desiredZoom = camera.zoom;
      }
      function keyDown(event: KeyboardEvent) {
        if (
          event.key !== "Escape" ||
          event.defaultPrevented ||
          document.querySelector("dialog[open]")
        )
          return;
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.matches("input, textarea, select") ||
            target.closest('[role="dialog"]'))
        )
          return;
        propsRef.current.onSelect(null);
      }
      function contextLost(event: Event) {
        event.preventDefault();
        setError("3D 图形连接已中断，请刷新页面重新进入你的家。");
      }
      renderer.domElement.addEventListener("pointerdown", pointerDown);
      renderer.domElement.addEventListener("pointermove", pointerMove);
      renderer.domElement.addEventListener("pointerup", pointerUp);
      renderer.domElement.addEventListener("pointercancel", pointerCancel);
      renderer.domElement.addEventListener("pointerleave", pointerLeave);
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      window.addEventListener("keydown", keyDown);
      controls.addEventListener("start", startControl);
      controls.addEventListener("change", changeControl);
      renderer.domElement.style.cursor = "grab";

      apiRef.current = {
        zoom: (factor) => {
          desiredZoom = THREE.MathUtils.clamp(
            camera.zoom * factor,
            controls.minZoom,
            controls.maxZoom,
          );
          camera.zoom = desiredZoom;
          camera.updateProjectionMatrix();
        },
        reset: () => navigate(true),
        capture: () => {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL("image/png");
        },
      };

      const skyTarget = new THREE.Color();
      const groundTarget = new THREE.Color();
      const sunTarget = new THREE.Color();
      const screenOff = new THREE.Color("#141b1c");
      const screenOn = new THREE.Color("#ffffff");
      const black = new THREE.Color("#000000");

      function updateLabels(devices: Device[]) {
        const { selectedId, showLabels, room } = propsRef.current;
        labels.forEach((label) => {
          label.element.style.display = "none";
        });
        if (!showLabels) return;
        const candidates = devices.filter(
          (device) =>
            device.id === selectedId ||
            (showLabels &&
              (room === "all"
                ? labelOrder.includes(device.id)
                : device.room === room)),
        );
        candidates.sort((a, b) =>
          a.id === selectedId
            ? -1
            : b.id === selectedId
              ? 1
              : labelOrder.indexOf(a.id) - labelOrder.indexOf(b.id),
        );
        const used: { x: number; y: number; w: number }[] = [];
        const maxCount = width < 570 ? 3 : room === "all" ? 6 : 5;
        for (const device of candidates) {
          if (used.length >= maxCount) break;
          const label = labels.get(device.id);
          if (!label) continue;
          projected.fromArray(device.position);
          projected.y += 0.32;
          projected.project(camera);
          const x = (projected.x * 0.5 + 0.5) * width;
          const y = (-projected.y * 0.5 + 0.5) * height - 14;
          const labelWidth = device.name.length * 11 + 35;
          if (
            projected.z < -1 ||
            projected.z > 1 ||
            x < labelWidth / 2 + 8 ||
            x > width - labelWidth / 2 - 8 ||
            y < 99 ||
            y > height - 65
          )
            continue;
          if (x + labelWidth / 2 > width - 57 && y > height - 275) continue;
          if (
            used.some(
              (box) =>
                Math.abs(box.x - x) < (box.w + labelWidth) / 2 + 6 &&
                Math.abs(box.y - y) < 38,
            )
          )
            continue;
          used.push({ x, y, w: labelWidth });
          label.element.style.display = "flex";
          label.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
          label.element.style.background =
            selectedId === device.id ? "#edf3e8" : "rgba(255,255,252,.92)";
          label.element.style.borderColor =
            selectedId === device.id ? "#9dad91" : "rgba(255,255,255,.78)";
          label.dot.style.background = device.on ? "#7d9d72" : "#aab0a7";
          label.dot.style.boxShadow = device.on
            ? "0 0 0 3px rgba(126,157,114,.12)"
            : "none";
        }
      }

      function frame(time: number) {
        if (disposed) return;
        frameId = requestAnimationFrame(frame);
        const dt = Math.min((time - lastFrameTime) / 1000 || 0.016, 0.05);
        lastFrameTime = time;
        const step = reducedMotion ? 1 : 1 - Math.exp(-dt * 8);
        const current = propsRef.current;
        if (previousRoom !== current.room || previousView !== current.view) {
          previousRoom = current.room;
          previousView = current.view;
          navigate();
        }
        if (cameraMoving) {
          camera.position.lerp(desiredPosition, step);
          controls.target.lerp(desiredTarget, step);
          camera.zoom = THREE.MathUtils.lerp(camera.zoom, desiredZoom, step);
          camera.updateProjectionMatrix();
          if (
            camera.position.distanceToSquared(desiredPosition) < 0.0001 &&
            Math.abs(camera.zoom - desiredZoom) < 0.001
          ) {
            // At a near-vertical angle, millimetres of residual X offset can
            // leave a large azimuth error. Finish at the exact requested pose.
            camera.position.copy(desiredPosition);
            controls.target.copy(desiredTarget);
            camera.zoom = desiredZoom;
            camera.updateProjectionMatrix();
            cameraMoving = false;
          }
        }
        controls.update();
        const palette = palettes[current.time];
        hemi.color.lerp(skyTarget.set(palette.sky), step);
        hemi.groundColor.lerp(groundTarget.set(palette.ground), step);
        sunlight.color.lerp(sunTarget.set(palette.sun), step);
        hemi.intensity = THREE.MathUtils.lerp(
          hemi.intensity,
          palette.ambient,
          step,
        );
        sunlight.intensity = THREE.MathUtils.lerp(
          sunlight.intensity,
          palette.direct,
          step,
        );
        fill.intensity = THREE.MathUtils.lerp(
          fill.intensity,
          palette.fill,
          step,
        );
        scene.environmentIntensity = THREE.MathUtils.lerp(
          scene.environmentIntensity,
          current.time === "day" ? 0.2 : current.time === "dusk" ? 0.1 : 0.025,
          step,
        );
        renderer.toneMappingExposure = THREE.MathUtils.lerp(
          renderer.toneMappingExposure,
          palette.exposure,
          step,
        );

        cameraDirection.copy(camera.position).sub(controls.target).normalize();
        wallSurfaces.forEach(({ wall, surfaces }, index) => {
          let visible = current.wallMode === "show";
          if (current.wallMode === "auto") {
            const facing = wall.normal.dot(cameraDirection);
            // Internal partitions can obstruct rooms from either side. Keep
            // them only near edge-on; retain the exterior walls behind rooms.
            const exterior =
              Math.abs(wall.center.x) === 6 || Math.abs(wall.center.z) === 4.5;
            visible = exterior ? facing < 0.1 : Math.abs(facing) < 0.1;
          }
          if (current.view === "top" || current.wallMode === "hide")
            visible = false;
          const state = wallSurfaces[index];
          state.opacity = THREE.MathUtils.lerp(
            state.opacity,
            visible ? 1 : 0,
            step,
          );
          wall.group.visible = state.opacity > 0.015;
          surfaces.forEach((surface) => {
            surface.material.opacity = surface.opacity * state.opacity;
            surface.material.depthWrite = state.opacity > 0.8;
          });
        });

        current.devices.forEach((device) => {
          const source = deviceLights.get(device.id);
          const lightColor = temperatureColor(device.temperature);
          if (device.type === "tv") {
            const mode =
              device.mode === "电影" || device.mode === "音乐"
                ? device.mode
                : "艺术画廊";
            if (mode !== appliedTvMode) {
              if (mode !== "艺术画廊" && !tvModeTextures.has(mode))
                tvModeTextures.set(mode, tvTexture(mode));
              (emissionSurfaces.get(device.id) ?? []).forEach((surface) => {
                const texture =
                  mode === "艺术画廊"
                    ? surface.baseMap
                    : tvModeTextures.get(mode)!;
                surface.material.map = texture;
                surface.material.emissiveMap = texture;
                surface.material.needsUpdate = true;
              });
              appliedTvMode = mode;
            }
          }
          if (source) {
            const power = device.on
              ? ((device.watts * 0.82 + 8) * device.value) / 100
              : 0;
            source.light.intensity = THREE.MathUtils.lerp(
              source.light.intensity,
              power,
              step,
            );
            source.light.color.lerp(lightColor, step);
          }
          (emissionSurfaces.get(device.id) ?? []).forEach((surface) => {
            if (device.type === "light") {
              surface.material.emissive.lerp(
                device.on ? lightColor : black,
                step,
              );
              surface.material.emissiveIntensity = THREE.MathUtils.lerp(
                surface.material.emissiveIntensity,
                device.on ? 0.4 + (device.value / 100) * 1.7 : 0,
                step,
              );
            } else if (device.type === "tv") {
              surface.material.color.lerp(
                device.on ? screenOn : screenOff,
                step,
              );
              surface.material.emissive.lerp(
                device.on ? screenOn : black,
                step,
              );
              surface.material.emissiveIntensity = THREE.MathUtils.lerp(
                surface.material.emissiveIntensity,
                device.on ? 0.6 : 0,
                step,
              );
            } else {
              surface.material.emissiveIntensity = THREE.MathUtils.lerp(
                surface.material.emissiveIntensity,
                device.on ? Math.max(0.5, surface.strength) : 0,
                step,
              );
              surface.material.emissive.lerp(
                device.on
                  ? surface.emissive.getHex()
                    ? surface.emissive
                    : lightColor
                  : black,
                step,
              );
            }
          });
          const animated = house.animated.get(device.id) ?? [];
          if (device.type === "curtain") {
            animated.forEach((object, index) => {
              const origin = animatedOrigins.get(object)!;
              const openness = device.on ? device.value / 100 : 0;
              object.scale.z = THREE.MathUtils.lerp(
                object.scale.z,
                origin.scale.z * (1 - openness * 0.83),
                step,
              );
              object.position.z = THREE.MathUtils.lerp(
                object.position.z,
                origin.position.z + (index === 0 ? -1 : 1) * openness * 0.53,
                step,
              );
            });
          }
          if (device.type === "washer" && device.on && !reducedMotion)
            animated.forEach((object) => {
              object.rotation.z += dt * 1.3;
            });
          if (device.type === "robot")
            animated.forEach((object) => {
              const origin = animatedOrigins.get(object)!;
              const offset =
                device.on && !reducedMotion
                  ? Math.sin(time * 0.0005) * 0.35
                  : 0;
              object.position.x = THREE.MathUtils.lerp(
                object.position.x,
                origin.position.x + offset,
                step,
              );
            });
        });
        const selectedDevice = current.devices.find(
          (device) => device.id === current.selectedId,
        );
        selection.visible = !!selectedDevice;
        if (selectedDevice) {
          selection.position.set(
            selectedDevice.position[0],
            0,
            selectedDevice.position[2],
          );
          if (lastSelectedId !== selectedDevice.id) {
            const object = house.devices.get(selectedDevice.id);
            const size = object
              ? new THREE.Box3()
                  .setFromObject(object)
                  .getSize(new THREE.Vector3())
              : new THREE.Vector3(0.5, 0.5, 0.5);
            const scale = THREE.MathUtils.clamp(
              Math.max(size.x, size.z) * 0.7,
              0.6,
              1.45,
            );
            selection.scale.setScalar(scale);
            lastSelectedId = selectedDevice.id;
          }
          selectionMaterial.opacity = reducedMotion
            ? 0.7
            : 0.58 + Math.sin(time * 0.003) * 0.13;
        }
        const hoveredDevice = current.devices.find(
          (device) => device.id === hoverId,
        );
        hoverRing.visible = !!hoveredDevice && hoverId !== current.selectedId;
        if (hoveredDevice)
          hoverRing.position.set(
            hoveredDevice.position[0],
            0.105,
            hoveredDevice.position[2],
          );
        updateLabels(current.devices);
        compassNeedle?.setAttribute(
          "transform",
          `rotate(${THREE.MathUtils.radToDeg(controls.getAzimuthalAngle())} 21 21)`,
        );
        renderer.render(scene, camera);
        if (!ready) {
          ready = true;
          propsRef.current.onReady();
        }
      }
      frameId = requestAnimationFrame(frame);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        observer.disconnect();
        controls.removeEventListener("start", startControl);
        controls.removeEventListener("change", changeControl);
        controls.dispose();
        window.removeEventListener("keydown", keyDown);
        renderer.domElement.removeEventListener("pointerdown", pointerDown);
        renderer.domElement.removeEventListener("pointermove", pointerMove);
        renderer.domElement.removeEventListener("pointerup", pointerUp);
        renderer.domElement.removeEventListener("pointercancel", pointerCancel);
        renderer.domElement.removeEventListener("pointerleave", pointerLeave);
        renderer.domElement.removeEventListener(
          "webglcontextlost",
          contextLost,
        );
        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        const textures = new Set<THREE.Texture>();
        tvModeTextures.forEach((texture) => textures.add(texture));
        emissionSurfaces.forEach((surfaces) =>
          surfaces.forEach((surface) => {
            if (surface.baseMap) textures.add(surface.baseMap);
          }),
        );
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => {
            materials.add(material);
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) textures.add(value);
            });
          });
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
        sunlight.shadow.dispose();
        environmentTarget.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        labelLayer.remove();
        apiRef.current = { zoom: () => {}, reset: () => {}, capture: () => "" };
      };
    }, []);

    return (
      <div
        ref={hostRef}
        className="home-scene"
        style={{ position: "absolute", inset: 0 }}
      >
        {error && (
          <div
            role="alert"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeContent: "center",
              textAlign: "center",
              padding: 40,
              color: "#56624f",
              zIndex: 4,
              background: "#eeeae2",
            }}
          >
            <strong style={{ fontSize: 20, marginBottom: 12 }}>
              暂时无法打开三维空间
            </strong>
            <p style={{ maxWidth: 330, fontSize: 14, lineHeight: 1.8 }}>
              {error}
            </p>
          </div>
        )}
      </div>
    );
  },
);

export default HomeScene;
