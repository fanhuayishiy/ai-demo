import * as THREE from "three";
import "./style.css";
import {
  createColliders,
  movePlayer,
  screenMovement,
  nearestInteraction,
  SPEED,
  BRIDGE,
} from "./core.js";
import { buildWorld, character } from "./models.js";

const host = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor("#c7d0b3");
host.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.domElement.setAttribute("aria-label", "松风镇 3D 游戏画面");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#c7d0b3");
scene.fog = new THREE.Fog("#c7d0b3", 70, 130);
scene.add(new THREE.HemisphereLight("#fff4d7", "#819473", 2.3));
const sun = new THREE.DirectionalLight("#ffe3b0", 3);
sun.position.set(-18, 32, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -42,
  right: 42,
  top: 42,
  bottom: -42,
  near: 1,
  far: 100,
});
sun.shadow.normalBias = 0.035;
sun.shadow.bias = -0.00015;
scene.add(sun);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshLambertMaterial({ color: "#bcc8a5" }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.1;
ground.receiveShadow = true;
scene.add(ground);
const world = buildWorld(scene);
const player = character("#7e9ca8", "#684b38", true);
scene.add(player.group);
let position = { x: -5.4, z: 3.7 },
  walkingTime = 0,
  harvests = 0;
player.group.position.set(position.x, 0.1, position.z);
player.group.rotation.y = Math.PI / 4;
const villagers = [
  {
    id: "apricot",
    type: "npc",
    name: "杏子",
    action: "和杏子聊聊",
    x: -4.6,
    z: 2.5,
    shirt: "#c88b79",
    hair: "#665040",
    lines: [
      "早呀！今天的风有一点青草香，正适合慢慢走。",
      "菜园里的胡萝卜熟了，阿禾说，路过的人都可以带一点回家。",
      "桥那边有一片小树林。累了，就坐在广场的长椅旁歇一会儿。",
    ],
  },
  {
    id: "farmer",
    type: "npc",
    name: "阿禾",
    action: "和阿禾聊聊",
    x: -10,
    z: 9.6,
    shirt: "#98a275",
    hair: "#6c513b",
    lines: [
      "你看，胡萝卜都冒出头啦。靠近它们按 E，就能采摘。",
      "种菜不能心急。浇一点水，晒一点太阳，剩下的交给春天。",
    ],
  },
  {
    id: "woodworker",
    type: "npc",
    name: "林叔",
    action: "和林叔聊聊",
    x: 19.6,
    z: 3.4,
    shirt: "#b99b6f",
    hair: "#a1a093",
    lines: [
      "木桥前些天刚修好，放心走吧。河水每天都这样慢慢流。",
      "树林里很安静。听，风吹树叶的声音，是小镇的钟。",
    ],
  },
];
villagers.forEach((v, i) => {
  const c = character(v.shirt, v.hair, i === 1);
  c.group.position.set(v.x, 0.1, v.z);
  c.group.rotation.y = [0.5, -0.8, 2.5][i];
  scene.add(c.group);
  v.character = c;
  v.line = 0;
});
const sign = {
  id: "notice",
  type: "sign",
  name: "松风镇 · 小镇告示",
  action: "阅读小镇告示",
  x: -8,
  z: 2.7,
  range: 2,
  lines: [
    "欢迎来到松风镇。沿小路去拜访邻居，向西是菜园，向东过木桥是树林。房屋暂不开放，成熟的胡萝卜可以自由采摘。愿你在这里，拥有一个不赶时间的下午。",
  ],
};
const interactions = [...villagers, sign, ...world.crops];
const colliders = createColliders();
const keys = new Set();
const prompt = document.querySelector("#prompt"),
  dialogue = document.querySelector("#dialogue");
let current = null,
  dialogueOpen = false;
function showDialogue(name, message) {
  document.querySelector("#speaker").textContent = name;
  document.querySelector("#message").textContent = message;
  dialogue.hidden = false;
  dialogueOpen = true;
  prompt.hidden = true;
}
function closeDialogue() {
  dialogue.hidden = true;
  dialogueOpen = false;
}
function interact() {
  if (dialogueOpen) {
    closeDialogue();
    return;
  }
  if (!current) return;
  if (current.type === "crop") {
    current.harvested = true;
    current.group.visible = false;
    harvests++;
    showDialogue(
      "菜园 · 收获的喜悦",
      `采到了一根新鲜的胡萝卜！泥土还带着阳光的温度。今天已经收获 ${harvests} 根。`,
    );
  } else {
    showDialogue(
      current.name,
      current.lines[(current.line ?? 0) % current.lines.length],
    );
    current.line = (current.line ?? 0) + 1;
  }
}
window.addEventListener("keydown", (e) => {
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyE",
      "Escape",
      "Space",
    ].includes(e.code)
  )
    e.preventDefault();
  if (e.code === "KeyE" && !e.repeat) interact();
  else if (e.code === "Escape") closeDialogue();
  else keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) keys.clear();
});
document.querySelector("#close-dialogue").onclick = closeDialogue;
document.querySelector("#help").onclick = () =>
  showDialogue(
    "在松风镇散散步",
    "WASD 或方向键移动，E 与附近的人或物互动，Esc 收起对话。滚轮可以拉近或拉远视野。沿主路向右过桥可到树林；向左下方的小路走，可以找到菜园。",
  );
document.querySelector("#touch-interact").onclick = interact;
for (const button of document.querySelectorAll("[data-key]")) {
  button.onpointerdown = (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    keys.add(button.dataset.key);
  };
  button.onpointerup = button.onpointercancel = () =>
    keys.delete(button.dataset.key);
  button.onlostpointercapture = () => keys.delete(button.dataset.key);
}
const camera = new THREE.OrthographicCamera();
let viewHeight = 34;
const target = new THREE.Vector3(position.x, 0, position.z),
  offset = new THREE.Vector3(26, 33, 26);
function resize() {
  const aspect = innerWidth / innerHeight;
  const height = innerWidth < 650 ? viewHeight * 1.2 : viewHeight;
  camera.left = (-height * aspect) / 2;
  camera.right = (height * aspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.near = 0.1;
  camera.far = 180;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
resize();
window.addEventListener("resize", resize);
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    viewHeight = THREE.MathUtils.clamp(viewHeight + e.deltaY * 0.012, 19, 46);
    resize();
  },
  { passive: false },
);
const projected = new THREE.Vector3(),
  clock = new THREE.Clock();
let lastTime = 0,
  frameCount = 0;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
function animate() {
  const dt = Math.min(clock.getDelta(), 0.1),
    time = clock.elapsedTime;
  const right =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft"));
  const down =
    Number(keys.has("KeyS") || keys.has("ArrowDown")) -
    Number(keys.has("KeyW") || keys.has("ArrowUp"));
  const direction = dialogueOpen ? { x: 0, z: 0 } : screenMovement(right, down);
  const next = movePlayer(
    position,
    direction.x * SPEED * dt,
    direction.z * SPEED * dt,
    colliders,
  );
  const moving = Math.hypot(next.x - position.x, next.z - position.z) > 0.0001;
  position = next;
  if (moving) {
    walkingTime += dt * 11;
    const angle = Math.atan2(direction.x, direction.z);
    player.group.rotation.y +=
      Math.atan2(
        Math.sin(angle - player.group.rotation.y),
        Math.cos(angle - player.group.rotation.y),
      ) *
      (1 - Math.exp(-16 * dt));
  }
  const gait = moving ? Math.sin(walkingTime) * 0.48 : 0;
  player.left.rotation.x = gait;
  player.right.rotation.x = -gait;
  player.armL.rotation.x = -gait * 0.8;
  player.armR.rotation.x = gait * 0.8;
  const onBridge =
    position.x > BRIDGE.minX &&
    position.x < BRIDGE.maxX &&
    position.z > BRIDGE.minZ &&
    position.z < BRIDGE.maxZ;
  player.group.position.set(
    position.x,
    (onBridge ? 0.38 : 0.1) +
      (moving ? Math.abs(Math.sin(walkingTime)) * 0.055 : 0),
    position.z,
  );
  target.lerp(
    new THREE.Vector3(position.x, 0, position.z),
    1 - Math.exp(-5 * dt),
  );
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  const reduced = motionPreference.matches;
  world.trees.forEach((t) => {
    t.group.rotation.z = reduced ? 0 : Math.sin(time * 0.8 + t.phase) * 0.017;
    t.group.rotation.x = reduced ? 0 : Math.cos(time * 0.65 + t.phase) * 0.009;
  });
  world.ripples.forEach((r) => {
    r.mesh.position.x =
      r.x + (reduced ? 0 : Math.sin(time * 0.7 + r.phase) * 0.22);
    r.mesh.scale.x = reduced ? 0.7 : 0.7 + Math.sin(time + r.phase) * 0.23;
  });
  villagers.forEach((v, i) => {
    v.character.group.position.y =
      0.1 + (reduced ? 0 : Math.sin(time * 1.5 + i * 2) * 0.018);
  });
  current = nearestInteraction(position, interactions);
  if (current && !dialogueOpen) {
    projected
      .set(
        current.x,
        current.type === "npc" ? 2.35 : current.type === "sign" ? 2.7 : 1.15,
        current.z,
      )
      .project(camera);
    prompt.style.left = `${Math.max(90, Math.min(innerWidth - 90, (projected.x * 0.5 + 0.5) * innerWidth))}px`;
    prompt.style.top = `${Math.max(72, Math.min(innerHeight - 110, (-projected.y * 0.5 + 0.5) * innerHeight))}px`;
    prompt.querySelector("span").textContent = current.action;
    prompt.hidden = false;
  } else prompt.hidden = true;
  renderer.render(scene, camera);
  frameCount++;
  lastTime = time;
  requestAnimationFrame(animate);
}
animate();
requestAnimationFrame(() => {
  document.querySelector("#loading").classList.add("loaded");
  setTimeout(() => document.querySelector("#loading").remove(), 700);
});
// Read-only diagnostics for reproducible runtime checks; never used for normal gameplay.
if (import.meta.env.DEV && new URLSearchParams(location.search).has("test")) {
  window.__town = {
    snapshot: () => ({
      position: { ...position },
      camera: { x: target.x, z: target.z },
      current: current?.id,
      harvests,
      dialogueOpen,
      frames: frameCount,
      time: lastTime,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      interactions: interactions.map((o) => ({
        id: o.id,
        x: o.x,
        z: o.z,
        type: o.type,
        harvested: !!o.harvested,
      })),
      trees: world.trees[0].group.rotation.z,
      water: world.ripples[0].mesh.position.x,
      gait: player.left.rotation.x,
    }),
    colliders,
    project: (x, z) => {
      const p = new THREE.Vector3(x, 0, z).project(camera);
      return {
        x: (p.x * 0.5 + 0.5) * innerWidth,
        y: (-0.5 * p.y + 0.5) * innerHeight,
      };
    },
  };
}
