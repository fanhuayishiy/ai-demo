import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createAircraft } from "./aircraft.js";
import { Playback, formatTime } from "./playback.js";
import { FlightAudio } from "./audio.js";
import { FlightMusic } from "./music.js";
import { loadVideoMusic } from "./video-music.js";
import { OriginalMusic } from "./original-music.js";
import { bindSunsetControls, adjacentChapterIndex } from "./sunset-controls.js";
import { PilotMotion, PILOT_CAMERA_FOLLOW, PILOT_LIMITS } from "./pilot-motion.js";
import { bindPilotInput } from "./pilot-input.js";
import {
  frameCamera,
  frameReferenceCamera,
  constrainOrbitCamera,
} from "./camera.js";
import { bindSceneLifecycle } from "./lifecycle.js";
import { sampleGunfire } from "./combat.js";
import { createAnimeRenderer } from "./anime-renderer.js";
import { getSceneProfile } from "./scene-profile.js";
import { createReferenceEffects } from "./reference-effects.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
const profile = getSceneProfile(window.location.search);
const DURATION = profile.duration;
const SHOTS = profile.shots;
const { sampleFlight, sampleCamera } = profile;
const isReference = profile.id === "sunset";
document.body.classList.toggle("reference-film", isReference);
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
// The sunset experience explicitly starts playing on entry; its pause control
// remains available. Preserve the classic edition's reduced-motion default.
const player = new Playback(DURATION, { reducedMotion: !isReference && reducedMotion });
const audio = new FlightAudio();
let musicSource = "original";
let music = isReference ? createMusic() : null;
const pilot = isReference ? new PilotMotion() : null;
let pilotInput;
const canvas = $("scene");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  44,
  innerWidth / innerHeight,
  0.4,
  16000,
);
const clock = new THREE.Clock();
let renderer;
let world;
let controls;
let animeRenderer;
let mode = "cinematic";
let quality = innerWidth < 700 ? "low" : "high";
let lastShot = -1;
let soundBusy = false;
let musicBusy = false;
let startupMusicPending = isReference;
let sunsetDock;
let frameId;
let toastTimeout;
let hasRendered = false;
let sceneAvailable = true;
const lastOrbitTarget = new THREE.Vector3();
const lastPilotOffset = new THREE.Vector3();
let orbitSteeringFrame = null;
const displacement = new THREE.Vector3();
const red = profile.createAircraft();
const blue = createAircraft("blue");
blue.visible = profile.showOpponent;
scene.add(red, blue);

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $("toast").classList.remove("visible"), 2400);
}

function syncPlayback() {
  if (player.paused) pilotInput?.clear();
  document.body.classList.toggle("is-paused", player.paused);
  $("play-toggle").setAttribute(
    "aria-label",
    player.paused ? "播放飞行" : "暂停飞行",
  );
  $("play-toggle").setAttribute("aria-pressed", String(player.paused));
  audio.setPlaying(sceneAvailable && !player.paused && !document.hidden);
  syncMusicPlayback(!player.paused && !document.hidden);
  syncDock();
  syncPilot();
}

function syncPilot() {
  if (!pilot) return;
  const axes = pilotInput?.axes() || { x: 0, y: 0 };
  $("pilot-help").dataset.active = String(Boolean(axes.x || axes.y));
  for (const [direction, pressed] of Object.entries({
    up: axes.y > 0, down: axes.y < 0, left: axes.x < 0, right: axes.x > 0,
  })) $("pilot-" + direction).dataset.pressed = String(pressed);
  const boundary = (axes.x !== 0 && Math.sign(pilot.x) === Math.sign(axes.x) && Math.abs(pilot.x) >= PILOT_LIMITS.x - 0.001) ||
    (axes.y !== 0 && Math.sign(pilot.y) === Math.sign(axes.y) && Math.abs(pilot.y) >= PILOT_LIMITS.y - 0.001);
  $("pilot-help").dataset.boundary = String(boundary);
  $("pilot-help").dataset.controlMode = pilot.engaged ? "manual" : "auto";
  const needsFocus = document.activeElement?.matches?.("input,textarea,select,[contenteditable],iframe");
  const position = `${pilot.x < 0 ? "左" : "右"} ${Math.abs(pilot.x).toFixed(1)} · ${pilot.y < 0 ? "下" : "上"} ${Math.abs(pilot.y).toFixed(1)} m`;
  $("pilot-status").textContent = player.paused
    ? "已暂停 · 播放后驾驶"
    : needsFocus
      ? "点回画面，即可继续驾驶"
      : boundary
        ? "已到移动边界 · 反向移动 / G 回航"
        : pilot.active
          ? `${mode === "orbit" ? "自由视角" : "稳定尾随"} · ${position}`
          : "自动巡航 · 按键接管";
}

function resetPilot() {
  pilotInput?.clear();
  pilot?.reset();
  syncPilot();
  syncDock();
}

function steeringFrame(time) {
  if (mode === "orbit" && controls) {
    return (
      orbitSteeringFrame || {
        position: camera.position,
        target: controls.target,
        roll: 0,
      }
    );
  }
  const frame = sampleCamera(time, mode === "chase" ? "chase" : "cinematic");
  return pilot ? pilot.steeringCamera(frame, sampleFlight(time).red) : frame;
}

function samplePilotedFlight(time) {
  const flight = sampleFlight(time);
  if (pilot) flight.red = pilot.applyPose(flight.red, steeringFrame(time), {
    stabilize: mode !== "orbit",
  });
  return flight;
}

function syncDock() {
  if (!music) return;
  sunsetDock?.sync({
    paused: player.paused,
    mode: mode !== "orbit" && pilot?.engaged ? "pilot" : mode,
    musicEnabled: music.enabled,
    musicPlaying: musicSource === "original"
      ? music.audible
      : music.playing && music.context?.state === "running",
    musicVolume: music.volume,
    musicBusy,
    musicSource,
    musicStatus: music.status,
    musicTime: music.duration > 0
      ? `${formatTime(music.position || 0)} / ${formatTime(music.duration)}`
      : "",
  });
}

function createMusic() {
  return musicSource === "clip"
    ? new FlightMusic({ renderer: loadVideoMusic })
    : new OriginalMusic({
      mount: $("music-player-mount"),
      onChange: (current) => { if (current === music) syncDock(); },
    });
}

async function selectMusicSource(source) {
  if (!music || musicBusy || !sceneAvailable || source === musicSource ||
      !["original", "clip"].includes(source)) return;
  const wasEnabled = music.enabled;
  const volume = music.volume;
  musicBusy = true;
  syncDock();
  try {
    await music.dispose();
    if (!sceneAvailable) return;
    musicSource = source;
    music = createMusic();
    await music.setVolume(volume);
    await music.setPlaying(sceneAvailable && !player.paused && !document.hidden);
  } catch {
    toast("音源切换失败，请重新开启配乐");
  } finally {
    musicBusy = false;
    syncDock();
  }
  if (wasEnabled) await toggleMusic();
}

function syncMusicPlayback(playing) {
  if (music) void music.setPlaying(playing && sceneAvailable).then(syncDock);
}

async function toggleMusic() {
  if (!music || musicBusy || !sceneAvailable) return;
  // A manual choice before the first visible frame must override autostart.
  startupMusicPending = false;
  musicBusy = true;
  syncDock();
  try {
    const enabled = await music.toggle();
    toast(
      enabled
        ? player.paused
          ? "配乐已开启，播放飞行时响起"
          : musicSource === "original"
            ? "rumination · BAANDIT! · 官方播放器已开启"
            : "视频片段 · 15.44 秒循环"
        : "配乐已关闭",
    );
  } catch {
    toast("配乐未能启动，请重试；原曲需联网，也可切换到视频片段");
  } finally {
    musicBusy = false;
    syncDock();
  }
}

function togglePlayback() {
  if (!sceneAvailable) return;
  player.paused = !player.paused;
  syncPlayback();
}

function setMode(nextMode) {
  if (nextMode === mode) return;
  resetPilot();
  mode = nextMode;
  orbitSteeringFrame = null;
  document
    .querySelectorAll("[data-mode]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)),
    );
  controls.enabled = mode === "orbit";
  if (mode === "orbit") {
    const time = player.time === DURATION ? DURATION - 0.001 : player.time;
    lastPilotOffset.set(0, 0, 0);
    if (pilot)
      lastPilotOffset.subVectors(red.position, sampleFlight(time).red.position);
    controls.target.copy(red.position).addScaledVector(lastPilotOffset, -(1 - PILOT_CAMERA_FOLLOW));
    lastOrbitTarget.copy(red.position);
    camera.up.set(0, 1, 0);
    controls.update();
    $("interaction-hint").textContent = "拖动 旋转 · 滚轮 缩放 · 空格 暂停飞行";
    toast("自由视角 · 拖动旋转，滚轮缩放");
  } else {
    $("interaction-hint").textContent =
      "空格 暂停 · 拖动时间轴，重温每一次交错";
  }
  syncDock();
}

function seek(time) {
  resetPilot();
  player.seek(time);
  if (mode === "orbit") {
    const next = sampleFlight(player.time).red.position;
    displacement.subVectors(next, lastOrbitTarget);
    if (pilot) displacement.addScaledVector(lastPilotOffset, 1 - PILOT_CAMERA_FOLLOW);
    camera.position.add(displacement);
    controls.target.copy(next);
    lastOrbitTarget.copy(next);
    lastPilotOffset.set(0, 0, 0);
    orbitSteeringFrame = null;
  }
  updateScene(0);
}

function jumpToShot(index) {
  const shot = SHOTS[index];
  if (!shot) return;
  if (mode === "orbit") setMode("cinematic");
  seek(shot.start + 0.02);
  toast(`${String(index + 1).padStart(2, "0")} / ${shot.title}`);
}

async function toggleSound() {
  if (soundBusy) return;
  soundBusy = true;
  try {
    const enabled = await audio.toggle();
    $("sound-toggle").setAttribute("aria-pressed", String(enabled));
    $("sound-toggle").setAttribute(
      "aria-label",
      enabled ? "关闭引擎音效" : "开启引擎音效",
    );
    $("sound-toggle").title = enabled
      ? "关闭引擎音效（M）"
      : "开启引擎音效（M）";
    toast(enabled ? "引擎与海风，已开启" : "音效已关闭");
  } catch {
    toast("当前浏览器无法启用音效，请检查声音权限");
  } finally {
    soundBusy = false;
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen();
    else toast("此浏览器暂不支持全屏");
  } catch {
    toast("无法进入全屏，请在浏览器中打开体验");
  }
}

function applyQuality() {
  renderer?.setPixelRatio(
    Math.min(devicePixelRatio, quality === "high" ? 1.75 : 1),
  );
  world?.setQuality(quality);
  referenceEffects?.setQuality(quality);
  animeRenderer?.resize(innerWidth, innerHeight, quality);
  $("quality-toggle").innerHTML =
    `${quality === "high" ? "高画质" : "流畅"} <span>⌄</span>`;
  $("quality-toggle").setAttribute(
    "aria-label",
    quality === "high" ? "切换为流畅画质" : "切换为高画质",
  );
}

function createTrails() {
  const lines = [];
  for (const aircraft of [red, blue]) {
    for (const tip of aircraft.userData.wingTips || []) {
      const points = new Float32Array(40 * 3);
      const colors = new Float32Array(40 * 3);
      for (let i = 0; i < 40; i++) {
        const light = (1 - i / 40) * 0.75;
        colors.set([light, light, light], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.LineBasicMaterial({
        color: "#e6ecd7",
        vertexColors: true,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      scene.add(line);
      lines.push({
        line,
        aircraft: aircraft === red ? "red" : "blue",
        tip,
        positions: points,
      });
    }
  }
  return lines;
}

const trails = profile.showOpponent ? createTrails() : [];
const referenceEffects = isReference
  ? createReferenceEffects(scene, samplePilotedFlight, red.userData.wingTips, {
      quality,
    })
  : null;
const trailPoint = new THREE.Vector3();
const bulletPoints = new Float32Array(10 * 2 * 3);
const bulletGeometry = new THREE.BufferGeometry();
bulletGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(bulletPoints, 3),
);
const tracers = new THREE.LineSegments(
  bulletGeometry,
  new THREE.LineBasicMaterial({
    color: "#ffde91",
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  }),
);
tracers.frustumCulled = false;
scene.add(tracers);
const bulletDirection = new THREE.Vector3();
const bulletStart = new THREE.Vector3();

function updateEffects(time, flight) {
  if (referenceEffects) {
    referenceEffects.update(time);
    tracers.visible = false;
    return;
  }
  // Short, faint wing condensation emphasizes banks without long smoke ribbons.
  const trailSamples = Array.from({ length: 40 }, (_, i) =>
    sampleFlight(time - i * 0.025),
  );
  for (const { line, aircraft, tip, positions } of trails) {
    line.visible = time > 23 && time < 60;
    for (let i = 0; i < 40; i++) {
      const pose = trailSamples[i][aircraft];
      trailPoint.copy(tip).applyQuaternion(pose.quaternion).add(pose.position);
      trailPoint.toArray(positions, i * 3);
    }
    line.geometry.attributes.position.needsUpdate = true;
  }
  const burst = sampleGunfire(time, flight);
  tracers.visible = Boolean(burst);
  if (tracers.visible) {
    bulletStart.copy(burst.origin);
    bulletDirection.copy(burst.direction);
    const length = burst.distance;
    for (let i = 0; i < 10; i++) {
      const travel = ((time * 2.1 + i / 10) % 1) * length;
      trailPoint
        .copy(bulletStart)
        .addScaledVector(bulletDirection, travel)
        .toArray(bulletPoints, i * 6);
      trailPoint
        .addScaledVector(bulletDirection, 0.85)
        .toArray(bulletPoints, i * 6 + 3);
    }
    bulletGeometry.attributes.position.needsUpdate = true;
  }
}

function updateOrbitCamera(time, delta) {
  displacement.subVectors(red.position, lastOrbitTarget);
  if (pilot) {
    const offset = red.position.clone().sub(sampleFlight(time).red.position);
    // Follow the automatic route completely, with the shared manual follow gain.
    // Applying this to the offset delta also handles G/reset without drifting.
    displacement
      .addScaledVector(lastPilotOffset, 1 - PILOT_CAMERA_FOLLOW)
      .addScaledVector(offset, -(1 - PILOT_CAMERA_FOLLOW));
    lastPilotOffset.copy(offset);
  }
  camera.position.add(displacement);
  controls.target.add(displacement);
  lastOrbitTarget.copy(red.position);
  controls.update(delta);
  constrainOrbitCamera(camera, controls.target);
}

function updateScene(delta) {
  const wasEngaged = pilot?.engaged;
  pilot?.update(delta, pilotInput?.sample(delta) || { x: 0, y: 0 }, !player.paused);
  if (pilot?.engaged && !wasEngaged) {
    toast(mode === "orbit" ? "已接管 · 自由视角驾驶 · G 回航" : "已接管 · 稳定尾随 · G 返回电影航线");
    syncDock();
  }
  // OrbitControls may rotate/damp later in this render. Keep the aircraft and
  // every historical vapor sample in the same immutable steering frame. While
  // paused, retain that frame so orbiting cannot rotate the aircraft's offset.
  if (mode === "orbit" && controls) {
    if (!player.paused || !orbitSteeringFrame) {
      orbitSteeringFrame = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        roll: 0,
      };
    }
  } else {
    orbitSteeringFrame = null;
  }
  const time = player.time === DURATION ? DURATION - 0.001 : player.time;
  const flight = samplePilotedFlight(time);
  for (const [model, pose] of [
    [red, flight.red],
    [blue, flight.blue],
  ]) {
    model.position.copy(pose.position);
    model.quaternion.copy(pose.quaternion);
    model.userData.propeller.rotation.z = time * profile.propellerSpeed;
  }
  let cameraFrame = steeringFrame(time);
  // Orbit's steering snapshot has no shot metadata; the authored route still owns chapters.
  if (mode === "orbit") cameraFrame = { ...cameraFrame, shotIndex: sampleCamera(time).shotIndex };
  if (pilot && mode !== "orbit") cameraFrame = pilot.applyCamera(cameraFrame);
  if (mode !== "orbit") {
    if (isReference) {
      camera.position.copy(
        frameReferenceCamera(
          cameraFrame.position,
          cameraFrame.target,
          camera.aspect,
        ),
      );
    } else {
      camera.position.copy(
        frameCamera(cameraFrame.position, cameraFrame.target, camera.aspect),
      );
    }
    camera.up.set(0, 1, 0);
    camera.fov = cameraFrame.fov;
    camera.lookAt(cameraFrame.target);
    camera.rotateZ(cameraFrame.roll);
    camera.updateProjectionMatrix();
  } else {
    updateOrbitCamera(time, delta);
  }
  world?.update(time, camera);
  updateEffects(time, flight);
  $("current-time").textContent = formatTime(player.time);
  $("timeline").value = player.time;
  $("timeline").style.setProperty(
    "--progress",
    `${(player.time / DURATION) * 100}%`,
  );
  $("timeline").setAttribute(
    "aria-valuetext",
    `${formatTime(player.time)}，共 ${formatTime(DURATION)}`,
  );
  const shotIndex = cameraFrame.shotIndex;
  if (lastShot !== shotIndex) {
    lastShot = shotIndex;
    $("shot-number").textContent = String(shotIndex + 1).padStart(2, "0");
    $("shot-label").textContent = SHOTS[shotIndex].title;
    $("reference-shot").textContent = SHOTS[shotIndex].subtitle;
    document
      .querySelectorAll(".chapter")
      .forEach((button, i) =>
        button.setAttribute("aria-current", String(i === shotIndex)),
      );
  }
  $("altitude").textContent = Math.round(red.position.y);
  const nextPosition = samplePilotedFlight(time + 0.1).red.position;
  $("airspeed").textContent = Math.round(
    nextPosition.distanceTo(red.position) * 36,
  );
  const direction = nextPosition.sub(red.position);
  $("compass-needle").style.transform =
    `rotate(${Math.atan2(direction.x, direction.z)}rad)`;
  audio.update(time, camera.position.distanceTo(red.position));
  syncPilot();
}

function animate() {
  if (!sceneAvailable) return;
  frameId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  if (document.hidden) return;
  player.update(delta);
  updateScene(delta);
  animeRenderer.render(player.time);
  if (!hasRendered) {
    hasRendered = true;
    $("loading").classList.add("ready");
    document.body.dataset.ready = "true";
    if (startupMusicPending) {
      startupMusicPending = false;
      if (music && !music.enabled) void toggleMusic();
    }
  }
}

function bindControls() {
  $("timeline").max = String(DURATION);
  $("total-time").textContent = formatTime(DURATION);
  $("shot-count").textContent = String(SHOTS.length).padStart(2, "0");
  $("chapters").style.gridTemplateColumns = `repeat(${SHOTS.length}, 1fr)`;
  $("scene-version").href = isReference ? "?scene=classic" : "./";
  $("scene-version").textContent = isReference ? "日间空战 ↗" : "夕空飞行 ↗";
  if (isReference) {
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-describedby", "pilot-help");
    canvas.addEventListener("pointerdown", () =>
      canvas.focus({ preventScroll: true }),
    );
    const returnToRoute = () => {
      if (!sceneAvailable) return;
      resetPilot();
      toast("已回到自动航线");
    };
    pilotInput = bindPilotInput(document, window, {
      canControl: () =>
        sceneAvailable && !player.paused && !$("notes-dialog").open,
      onReset: returnToRoute,
      onChange: syncPilot,
    });
    $("pilot-reset").addEventListener("click", returnToRoute);
    document.title = "夕空飞行 · Just breathe";
    canvas.setAttribute(
      "aria-label",
      "奶油白单翼机穿越紫色夕阳云海的三维飞行场景",
    );
    $("notes-title").textContent = "跟随夕阳，穿过云海";
    $("notes-intro").textContent =
      "根据你提供的视频重新设计：奶油白单翼机、紫色立体云群、橙金夕阳，以及贴近机尾的滚转跟随镜头。场景由 Web3D 实时渲染，并非视频背景。";
    $("notes-details").innerHTML =
      "<div><dt>单翼机与翼尖气流</dt><dd>低置椭圆机翼、圆形翼徽、三色尾舵和透明翼尖气流。模型和材质均本地生成。</dd></div><div><dt>夕空里的四段动作</dt><dd>尾随、剪刀、回旋、俯冲组成 24 秒连续循环；自由视角可拖动观察。</dd></div><div><dt>原版本仍然保留</dt><dd>点击上方「日间空战」可返回双机与亚得里亚海的晴天场景。</dd></div>";
    $("notes-details").insertAdjacentHTML(
      "beforeend",
      "<div><dt>rumination · BAANDIT!</dt><dd>视频里的原曲已识别，默认通过艺术家在 SoundCloud 发布的官方播放器在线播放，约 1 分 56 秒；不是电影《红猪》的原声。点击配乐按钮或按 P 开关，暂停飞行时配乐暂停。若浏览器限制自动播放，请点播放器播放键。可切换到本地 15.44 秒视频片段。引擎声由 M 单独控制。</dd></div>",
    );
    $("notes-disclaimer").textContent =
      "模型与环境由程序生成。原曲通过官方播放器流播，备用片段来自你提供的视频；未下载或再分发原曲整首音频。音乐权利归原作者所有，公开部署前请核实适用授权。";
    $("notes-details").insertAdjacentHTML(
      "beforeend",
      "<div><dt>亲手驾驶</dt><dd>WASD 或方向键均可短按或长按。按键后平滑进入稳定尾随视角，左右侧倾移动、上下俯仰移动，松手快速停稳。范围扩大到左右 20 米、上下 12 米，到达边界会提示。G 或「回到航线」恢复电影航线；暂停、切换分镜、机位或重播时按键会释放。仍是电影航线附近的辅助驾驶，并非无限自由飞行。</dd></div>",
    );
    $("notes-shortcuts").textContent = "1–4";
    $("loading-copy").textContent = "等一束光，穿过云海。";
    sunsetDock = bindSunsetControls(document, {
      togglePlayback,
      restart: () => $("restart").click(),
      previous: () => jumpToShot(adjacentChapterIndex(SHOTS, player.time, -1)),
      next: () => jumpToShot(adjacentChapterIndex(SHOTS, player.time, 1)),
      cycleCamera: () => {
        const modes = ["cinematic", "chase", "orbit"];
        setMode(modes[(modes.indexOf(mode) + 1) % modes.length]);
      },
      toggleMusic,
      selectMusicSource,
      setVolume: (value) => {
        void music.setVolume(value).then(syncDock);
        syncDock();
      },
    });
  }
  const setControls = (shown) => {
    document.body.classList.toggle("controls-open", shown);
    $("controls-toggle").setAttribute("aria-expanded", String(shown));
    $("controls-toggle").textContent = shown ? "收起控制" : "显示控制";
  };
  $("controls-toggle").addEventListener("click", () =>
    setControls(!document.body.classList.contains("controls-open")),
  );
  for (const [index, shot] of SHOTS.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter";
    button.setAttribute("aria-label", `分镜 ${index + 1}：${shot.title}`);
    button.innerHTML = `<span class="chapter-number">${String(index + 1).padStart(2, "0")}</span><span class="chapter-title">${shot.title}<span class="chapter-english">${shot.subtitle}</span></span>`;
    button.addEventListener("click", () => jumpToShot(index));
    $("chapters").append(button);
  }
  $("play-toggle").addEventListener("click", togglePlayback);
  $("restart").addEventListener("click", () => {
    if (!sceneAvailable) return;
    seek(0);
    player.paused = false;
    syncPlayback();
    toast(isReference ? "再次飞向夕阳" : "重返亚得里亚海上空");
  });
  $("timeline").addEventListener("input", (event) =>
    seek(Number(event.target.value)),
  );
  document
    .querySelectorAll("[data-mode]")
    .forEach((button) =>
      button.addEventListener("click", () => setMode(button.dataset.mode)),
    );
  $("sound-toggle").addEventListener("click", toggleSound);
  $("fullscreen-toggle").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () =>
    $("fullscreen-toggle").setAttribute(
      "aria-label",
      document.fullscreenElement ? "退出全屏" : "进入全屏",
    ),
  );
  $("quality-toggle").addEventListener("click", () => {
    quality = quality === "high" ? "low" : "high";
    applyQuality();
    toast(
      quality === "high"
        ? "高画质 · 更细腻的海与天空"
        : "流畅画质 · 降低渲染负载",
    );
  });
  $("notes-open").addEventListener("click", () => {
    pilotInput?.clear();
    $("notes-dialog").showModal();
  });
  $("notes-close").addEventListener("click", () => $("notes-dialog").close());
  $("notes-dialog").addEventListener("click", (event) => {
    if (event.target === $("notes-dialog")) {
      const rect = event.target.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        event.target.close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      !sceneAvailable ||
      event.isComposing || event.keyCode === 229 ||
      $("notes-dialog").open ||
      event.target.closest("input,textarea,select,[contenteditable]") ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    // Native buttons and disclosures own Space/Enter.
    if (event.code === "Space" && !event.target.closest("button,a,summary")) {
      event.preventDefault();
      togglePlayback();
    }
    if (/^[1-6]$/.test(event.key)) jumpToShot(Number(event.key) - 1);
    if (event.key.toLowerCase() === "r") $("restart").click();
    if (event.key.toLowerCase() === "m") toggleSound();
    if (event.key.toLowerCase() === "p" && !event.repeat) void toggleMusic();
    if (event.key.toLowerCase() === "f") toggleFullscreen();
    if (event.key.toLowerCase() === "h") {
      if (isReference) {
        setControls(!document.body.classList.contains("controls-open"));
        return;
      }
      document.body.classList.toggle("ui-hidden");
      toast(
        document.body.classList.contains("ui-hidden")
          ? "按 H 重新显示界面"
          : "界面已显示",
      );
    }
  });
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    animeRenderer.resize(innerWidth, innerHeight, quality);
  });
  document.addEventListener("visibilitychange", () => {
    clock.getDelta();
    audio.setPlaying(sceneAvailable && !player.paused && !document.hidden);
    syncMusicPlayback(!player.paused && !document.hidden);
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    sceneAvailable = false;
    player.paused = true;
    syncPlayback();
    cancelAnimationFrame(frameId);
    audio.setPlaying(false);
    syncMusicPlayback(false);
    $("error-message").hidden = false;
    $("error-message").textContent =
      "画面暂时中断。请刷新页面恢复飞行，或关闭其他占用显卡的标签页后重试。";
  });
  bindSceneLifecycle(window, {
    suspend() {
      cancelAnimationFrame(frameId);
      audio.setPlaying(false);
      syncMusicPlayback(false);
    },
    resume() {
      if (!sceneAvailable) return;
      clock.getDelta();
      audio.setPlaying(!player.paused && !document.hidden);
      syncMusicPlayback(!player.paused && !document.hidden);
      animate();
    },
    dispose() {
        sceneAvailable = false;
      cancelAnimationFrame(frameId);
      audio.dispose();
      void music?.dispose();
      sunsetDock?.dispose();
      pilotInput?.dispose();
      controls.dispose();
      world.dispose();
      referenceEffects?.dispose();
      animeRenderer.dispose();
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material)
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        material.gradientMap?.dispose();
        material.dispose();
      });
      renderer.dispose();
    },
  });
}

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  world = profile.createWorld(scene, { quality });
  animeRenderer = createAnimeRenderer(renderer, scene, camera, {
    bloom: profile.bloom,
  });
  controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 15;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.83;
  applyQuality();
  bindControls();
  syncPlayback();
  updateScene(0);
  animate();
} catch (error) {
  console.error("Flight scene initialization failed:", error);
  $("loading").classList.add("ready");
  $("error-message").hidden = false;
  $("error-message").textContent =
    "这片天空需要支持 WebGL 2 的浏览器。请使用最新版 Chrome、Edge 或 Safari，开启硬件加速后刷新页面。";
}
