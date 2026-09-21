import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createDistrict } from "./district.js";
import { icon, courtyardArt } from "./icons.js";
import "./style.css";

const $ = (selector) => document.querySelector(selector);
const esc = (text = "") =>
  String(text).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

$("#app").innerHTML = `
  <header class="header">
    <a class="brand" href="./" aria-label="三坊七巷首页"><span class="brand-seal">坊<br>巷</span><span class="brand-name">三坊七巷<small>SANFANG QIXIANG</small></span><span class="brand-divider"></span><span class="brand-sub">坊巷漫游<span>福州 · 中国</span></span></a>
    <nav class="main-nav" aria-label="导览导航"><button class="nav-item active" data-view="explore">${icon("compass")}全景导览</button><button class="nav-item" data-view="routes">${icon("route")}漫游路线</button><button class="nav-item" data-view="about">${icon("book")}关于坊巷</button></nav>
    <div class="header-actions"><span class="live-dot"></span><span class="header-caption">一片坊巷，半部近代史</span><button class="icon-button help-button" data-action="help" aria-label="操作指南" title="操作指南">${icon("info")}</button></div>
  </header>
  <main class="experience">
    <div id="map-stage" tabindex="0" role="application" aria-label="三坊七巷三维地图。拖拽旋转，滚轮缩放，方向键平移；可通过景点目录选择地点。"><div id="labels"></div></div>
    <div class="map-heading"><span class="overline">FUZHOU HERITAGE ATLAS</span><h1>坊巷之间，自有天地。</h1><p>循着青石板路，走进千年榕城</p></div>
    <aside class="explorer" aria-label="景点目录">
      <div class="explorer-heading"><div><span class="overline">EXPLORE THE NEIGHBORHOOD</span><h2>探访坊巷<span class="title-dot">.</span></h2></div><span class="collection-count">三坊 · 七巷</span></div>
      <p class="explorer-intro">看见古厝里的岁月，<br>遇见街巷间的福州。</p>
      <label class="search">${icon("search")}<input id="search" type="search" placeholder="搜索景点、街巷…" autocomplete="off" aria-label="搜索景点、街巷"/><kbd>/</kbd></label>
      <div class="filter-tabs" role="group" aria-label="筛选景点"><button class="filter active" data-filter="all" aria-pressed="true">全部</button><button class="filter" data-filter="residence" aria-pressed="false">名人故居</button><button class="filter" data-filter="heritage" aria-pressed="false">文化古迹</button><button class="filter" data-filter="street" aria-pressed="false">街巷</button></div>
      <div class="list-heading"><span id="list-caption">值得一逛</span><span id="result-count">正在载入</span></div>
      <div id="place-list" class="place-list" aria-live="polite"></div>
      <div class="explorer-bottom">${icon("pin")}<span>点击景点，开启一段坊巷故事</span></div>
    </aside>
    <section class="route-panel hidden" aria-label="漫游路线"><button class="panel-close icon-button" data-action="close-routes" aria-label="关闭路线">${icon("close")}</button><span class="overline">A WALK THROUGH TIME</span><h2>一条路，读懂福州。</h2><p>沿着南后街，在故居与庭院间漫游。</p><div class="route-meta"><span>${icon("clock")}建议 1–2 小时</span><span>${icon("route")}5 处文化地标</span></div><ol id="route-stops"></ol><button class="primary-button" data-action="start-tour">${icon("play")}开始空中漫游</button><small>镜头将依次飞往各站，可随时暂停探索</small></section>
    <div class="map-status"><span class="status-dot"></span><span id="view-state">三维全景</span><span class="status-divider"></span><span id="scene-state">日间</span></div>
    <div class="view-toggle" role="group" aria-label="地图视角"><button class="active" data-action="3d" aria-pressed="true">3D</button><button data-action="2d" aria-pressed="false">俯瞰</button></div>
    <div class="map-tools" aria-label="地图工具"><button class="icon-button" data-action="zoom-in" aria-label="放大地图" title="放大">${icon("plus")}</button><button class="icon-button" data-action="zoom-out" aria-label="缩小地图" title="缩小">${icon("minus")}</button><span class="tool-separator"></span><button class="icon-button" data-action="home" aria-label="恢复全景" title="恢复全景">${icon("expand")}</button><button class="icon-button active" data-action="labels" aria-label="显示景点标签" aria-pressed="true" title="景点标签">${icon("pin")}</button><button class="icon-button" data-action="theme" aria-label="切换夜景" title="日夜切换">${icon("moon")}</button></div>
    <button class="compass" data-action="north" aria-label="地图朝北" title="地图朝北"><span>N</span><svg id="compass-needle" viewBox="0 0 40 40"><path d="m20 3 8 27-8-5-8 5Z" fill="#466b58"/><path d="m20 3 0 22-8 5Z" fill="#b3bfb4"/></svg></button>
    <section class="selection-card hidden" aria-live="polite"></section>
    <div class="map-legend"><span><i class="legend-point green"></i>名人故居</span><span><i class="legend-point clay"></i>文化古迹</span><span><i class="legend-line"></i>漫游路线</span></div>
    <div class="tour-card"><span class="tour-icon">${icon("route")}</span><div><span class="tour-eyebrow">精选漫游</span><strong id="tour-title">循迹坊巷 · 人文之旅</strong><span class="tour-description" id="tour-description">5 处地标，串起榕城的百年故事</span></div><button class="tour-start" data-action="start-tour" aria-label="开始漫游">开始漫游 ${icon("arrow")}</button><div class="tour-controls hidden"><button class="icon-button" data-action="pause-tour" aria-label="暂停漫游">${icon("pause")}</button><button class="icon-button" data-action="next-stop" aria-label="下一站">${icon("arrow")}</button><button class="icon-button" data-action="stop-tour" aria-label="结束漫游">${icon("close")}</button></div></div>
    <div class="map-hints"><span>${icon("mouse")}滚轮缩放</span><span>${icon("move")}拖拽旋转 · 右键平移</span><span>${icon("pin")}点击飞往</span></div>
    <div class="scale"><span id="scale-label">100 m</span><i id="scale-bar"></i></div>
    <button class="mobile-explore" data-action="toggle-explorer">${icon("search")}探索景点</button>
    <footer class="attribution"><span>福州 · 三坊七巷</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a><span class="attribution-detail">建筑为风格化示意</span><button data-action="sources">数据来源 ${icon("info")}</button></footer>
    <div class="loading"><span class="loading-seal">坊巷</span><h2>一城坊巷，徐徐展开</h2><p id="loading-message">正在构建古城沙盘…</p><span class="loading-bar"><i></i></span></div>
    <div class="toast" role="status"></div>
  </main>
  <dialog id="info-dialog"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="关闭">${icon("close")}</button><div id="dialog-content"></div></dialog>
`;

let scene, camera, renderer, controls, district;
let points = [],
  markers = [],
  activePoint = null,
  flight = null,
  routeLine;
let activeFilter = "all",
  query = "",
  isNight = false,
  showLabels = true,
  isTopDown = false;
let tour = { active: false, paused: false, index: 0, elapsed: 0, stops: [] };
let sun,
  hemi,
  selectionRing,
  lastTime = 0,
  frameId,
  toastTimeout,
  inOverview = true;
const homeTarget = new THREE.Vector3(),
  homePosition = new THREE.Vector3();
const projected = new THREE.Vector3();
const stage = $("#map-stage");

function notify(message) {
  $(".toast").textContent = message;
  $(".toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(
    () => $(".toast").classList.remove("visible"),
    3000,
  );
}

function categoryOf(p) {
  if (/街|巷|坊$/.test(p.name) && !/故居|书屋|纪念|戏台|小黄楼/.test(p.name))
    return "street";
  if (/故居|林觉民|冰心|严复/.test(p.name)) return "residence";
  return "heritage";
}
const categoryName = {
  residence: "名人故居",
  heritage: "文化古迹",
  street: "历史街巷",
};
const stories = [
  {
    match: /林觉民|冰心/,
    short: "一封与妻书，一段故园情",
    body: "这座院落连接着林觉民与冰心的故事。穿过白墙黛瓦，读一读《与妻书》，也寻一寻冰心笔下的童年。",
    address: "杨桥西路 17 号",
  },
  {
    match: /水榭/,
    short: "一方水榭，百年戏韵",
    body: "衣锦坊里的水榭戏台，以清池、木台与院落相映成趣。亭台之间，依稀能听见昔日闽剧的悠长唱腔。",
    address: "衣锦坊 4 号",
  },
  {
    match: /严复/,
    short: "译笔启蒙，故居寻踪",
    body: "郎官巷里的严复故居，留存了这位启蒙思想家晚年的生活印记。在传统院落中，重温《天演论》开启的思想回响。",
    address: "郎官巷 20 号",
  },
  {
    match: /小黄楼/,
    short: "深巷藏园，清风入楼",
    body: "黄巷中的小黄楼，是福州传统宅园的代表之一。楼阁、花厅与庭院，在深巷中展开一段安静的园居时光。",
    address: "黄巷 36 号",
  },
  {
    match: /林则徐/,
    short: "海纳百川，有容乃大",
    body: "从祠堂、碑廊到展室，在林则徐纪念馆回望一位民族英雄的生平。这里也是理解福州近代人文历史的重要一站。",
    address: "澳门路 16 号",
  },
  {
    match: /二梅/,
    short: "梅影书香，古厝雅集",
    body: "郎官巷里的二梅书屋，是一座保存传统格局的古民居。院落的细部与展陈，让坊巷的日常生活有了可触摸的轮廓。",
    address: "郎官巷 25 号",
  },
  {
    match: /南后街/,
    short: "一条南后街，千年烟火气",
    body: "南后街贯穿街区南北，将西侧三坊与东侧七巷串联起来。沿街慢行，寻访老字号、花灯与福州的日常烟火。",
    address: "三坊七巷南北中轴",
  },
];
function enrich(p, index) {
  const story = stories.find((s) => s.match.test(p.name));
  return {
    ...p,
    index,
    category: categoryOf(p),
    short: story?.short || p.tagline || "推开一扇门，遇见旧时光",
    description:
      p.description ||
      story?.body ||
      `${p.name}是三坊七巷历史街区的一部分。沿着青石路，细看古厝、院落和山墙，感受福州传统街巷的生活气息。`,
    address: p.address || story?.address || "福州 · 三坊七巷历史文化街区",
  };
}

function filteredPoints() {
  return points.filter(
    (p) =>
      (activeFilter === "all" || p.category === activeFilter) &&
      `${p.name}${p.address}${p.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
}

function renderList() {
  const visible = filteredPoints();
  $("#result-count").textContent = `${visible.length} 处景点`;
  $("#list-caption").textContent = query
    ? "搜索结果"
    : activeFilter === "all"
      ? "值得一逛"
      : categoryName[activeFilter];
  $("#place-list").innerHTML = visible.length
    ? visible
        .map(
          (p) =>
            `<button class="place-card ${activePoint?.id === p.id ? "selected" : ""}" data-place="${esc(p.id)}" aria-label="飞往${esc(p.name)}"><span class="place-art">${courtyardArt(p.index)}</span><span class="place-copy"><strong>${esc(p.name)}</strong><span>${esc(p.short)}</span><small><i class="tiny-dot ${p.category}"></i>${categoryName[p.category]}</small></span>${icon("chevron")}</button>`,
        )
        .join("")
    : `<div class="empty-state">${icon("search")}<strong>还没找到这个地方</strong><p>试试“严复”“黄巷”或“南后街”</p><button data-action="clear-search">清除筛选</button></div>`;
  const ids = new Set(visible.map((p) => p.id));
  markers.forEach((m) => {
    m.filtered = !ids.has(m.point.id);
  });
}

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function flyTo(target, position, duration = 1500) {
  flight = {
    fromTarget: controls.target.clone(),
    fromPosition: camera.position.clone(),
    target: target.clone(),
    position: position.clone(),
    start: performance.now(),
    duration: reducedMotion ? 1 : duration,
  };
}

function selectPlace(id, fromTour = false) {
  const p = points.find((p) => p.id === id);
  if (!p || !district) return;
  if (!fromTour && tour.active) stopTour(false);
  activePoint = p;
  inOverview = false;
  const target = new THREE.Vector3(p.x, 8, p.z);
  const offset = isTopDown
    ? new THREE.Vector3(0, 330, 0.1)
    : new THREE.Vector3(155, 205, 215);
  flyTo(target, target.clone().add(offset));
  selectionRing.visible = true;
  selectionRing.position.set(p.x, 2.6, p.z);
  markers.forEach((m) =>
    m.element.classList.toggle("selected", m.point.id === id),
  );
  $(".selection-card").innerHTML =
    `<button class="selection-close icon-button" data-action="close-selection" aria-label="关闭景点详情">${icon("close")}</button><span class="overline">${categoryName[p.category]} <i>／</i> SANFANG QIXIANG</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><span class="place-address">${icon("pin")}${esc(p.address)}${p.coordinateAccuracy === "approximate" ? '<span class="approximate-label" title="根据公开地址定位至相应街段，非入口实测坐标">位置示意</span>' : ""}</span><div class="selection-footer"><span>${icon("eye")}正在探索此处</span><button data-action="home">返回全景 ${icon("arrow")}</button></div>`;
  $(".selection-card").classList.remove("hidden");
  if (window.innerWidth <= 720) $(".explorer").classList.remove("mobile-open");
  $("#view-state").textContent = "景点近览";
  renderList();
}

function clearSelection() {
  activePoint = null;
  if (selectionRing) selectionRing.visible = false;
  $(".selection-card").classList.add("hidden");
  markers.forEach((m) => m.element.classList.remove("selected"));
  renderList();
}

function restoreOverview() {
  if (!controls) return;
  stopTour(false);
  clearSelection();
  inOverview = true;
  fitOverview();
  flyTo(
    homeTarget,
    isTopDown
      ? homeTarget
          .clone()
          .add(
            new THREE.Vector3(
              0,
              homePosition.distanceTo(homeTarget) * 0.83,
              0.1,
            ),
          )
      : homePosition,
  );
  $("#view-state").textContent = isTopDown ? "俯瞰全景" : "三维全景";
}

function prepareTour() {
  const stopPatterns = [/林觉民|冰心/, /严复/, /水榭/, /小黄楼/, /林则徐/];
  tour.stops = stopPatterns
    .map((pattern) => points.find((p) => pattern.test(p.name)))
    .filter(Boolean);
  if (tour.stops.length < 2)
    tour.stops = points.filter((p) => p.category !== "street").slice(0, 5);
  $("#route-stops").innerHTML = tour.stops
    .map(
      (p, i) =>
        `<li><button data-place="${esc(p.id)}"><span class="stop-number">${i + 1}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.short)}</small></span>${icon("arrow")}</button></li>`,
    )
    .join("");
  const vertices = [];
  // The dashed line connects stops as a sightseeing sequence, not a walking navigation route.
  tour.stops.forEach((p) => vertices.push(new THREE.Vector3(p.x, 30, p.z)));
  const curve = new THREE.CatmullRomCurve3(vertices, false, "centripetal");
  routeLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(160)),
    new THREE.LineDashedMaterial({
      color: 0xb08a50,
      dashSize: 7,
      gapSize: 4,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    }),
  );
  routeLine.computeLineDistances();
  routeLine.visible = false;
  routeLine.renderOrder = 2;
  scene.add(routeLine);
}

function startTour() {
  if (!tour.stops.length) return;
  tour.active = true;
  tour.paused = false;
  tour.index = 0;
  tour.elapsed = 0;
  $(".tour-start").classList.add("hidden");
  $(".tour-controls").classList.remove("hidden");
  $(".route-panel").classList.add("hidden");
  $('[data-action="pause-tour"]').innerHTML = icon("pause");
  $('[data-action="pause-tour"]').setAttribute("aria-label", "暂停漫游");
  routeLine.visible = true;
  visitStop();
}
function visitStop() {
  const p = tour.stops[tour.index];
  selectPlace(p.id, true);
  $("#tour-title").textContent =
    `${String(tour.index + 1).padStart(2, "0")} / ${tour.stops.length} · ${p.name}`;
  $("#tour-description").textContent = tour.paused
    ? "已暂停 · 自由探索这一站"
    : "空中漫游中 · 每站停留 10 秒";
  tour.elapsed = 0;
}
function nextStop() {
  if (!tour.active) return;
  if (tour.index + 1 >= tour.stops.length) {
    stopTour(false);
    notify("这段坊巷之旅已走完，继续自由探索吧");
    return;
  }
  tour.index++;
  visitStop();
}
function stopTour(resetView = false) {
  tour.active = false;
  tour.paused = false;
  $(".tour-start").classList.remove("hidden");
  $(".tour-controls").classList.add("hidden");
  $("#tour-title").textContent = "循迹坊巷 · 人文之旅";
  $("#tour-description").textContent = "5 处地标，串起榕城的百年故事";
  if (routeLine) routeLine.visible = false;
  if (resetView) restoreOverview();
}

function setView(topDown) {
  if (!camera) return;
  isTopDown = topDown;
  $('[data-action="2d"]').classList.toggle("active", topDown);
  $('[data-action="3d"]').classList.toggle("active", !topDown);
  $('[data-action="2d"]').setAttribute("aria-pressed", String(topDown));
  $('[data-action="3d"]').setAttribute("aria-pressed", String(!topDown));
  const distance = camera.position.distanceTo(controls.target);
  const offset = topDown
    ? new THREE.Vector3(0, distance, 0.1)
    : new THREE.Vector3(0.48, 0.68, 0.7).normalize().multiplyScalar(distance);
  flyTo(controls.target, controls.target.clone().add(offset));
  $("#view-state").textContent = topDown
    ? "俯瞰全景"
    : activePoint
      ? "景点近览"
      : "三维全景";
}
function toggleTheme() {
  if (!renderer) return;
  isNight = !isNight;
  document.documentElement.classList.toggle("night", isNight);
  scene.fog.color.set(isNight ? "#243a3c" : "#e7eeeb");
  hemi.color.set(isNight ? "#93b9d2" : "#f1f7f4");
  hemi.intensity = isNight ? 1.25 : 1.8;
  sun.color.set(isNight ? "#b4d6ef" : "#fff4dc");
  sun.intensity = isNight ? 0.85 : 2.5;
  renderer.toneMappingExposure = isNight ? 0.85 : 1.0;
  district.group.traverse((obj) => {
    if (obj.isMesh && obj.material?.emissive && obj.userData?.nightGlow) {
      obj.material.emissiveIntensity = isNight ? 1.5 : 0.1;
    }
  });
  $("#scene-state").textContent = isNight ? "月夜" : "日间";
  const button = $('[data-action="theme"]');
  button.innerHTML = icon(isNight ? "sun" : "moon");
  button.setAttribute("aria-label", isNight ? "切换日景" : "切换夜景");
}

function openDialog(kind) {
  const content = {
    help: `<span class="overline">YOUR GUIDE TO EXPLORING</span><h2>自在漫游，从这里开始</h2><div class="help-grid"><span>${icon("mouse")}<strong>滚轮缩放</strong><p>滚动鼠标滚轮，拉近细节或俯瞰全景。</p></span><span>${icon("move")}<strong>拖拽探索</strong><p>左键拖拽旋转，右键拖拽平移。触屏可单指旋转、双指缩放。</p></span><span>${icon("pin")}<strong>点击飞往</strong><p>点击地图标记或景点目录，镜头将自动飞到目的地。</p></span><span>${icon("route")}<strong>空中漫游</strong><p>沿精选地标依次游览，可随时暂停、跳转下一站或结束。</p></span></div><p class="dialog-note">键盘：方向键平移，+ / − 缩放，Home 恢复全景，/ 搜索，Esc 关闭弹窗。</p>`,
    about: `<span class="overline">A CITY'S MEMORY, IN ITS LANES</span><h2>三坊七巷，千年福州的缩影。</h2><div class="about-art">${courtyardArt(2)}<span>白墙黛瓦<br>榕荫深巷</span></div><p>以南后街为轴，西侧是衣锦坊、文儒坊、光禄坊，东侧是杨桥巷、郎官巷、塔巷、黄巷、安民巷、宫巷、吉庇巷。坊与巷相连，古厝与庭院相望。</p><p>这里保留着福州传统里坊街区的历史肌理，也与林则徐、严复、林觉民、冰心等人的故事紧紧相连。</p><div class="about-facts"><span><strong>3</strong>座历史坊</span><span><strong>7</strong>条古街巷</span><span><strong>1</strong>条南后街</span></div><p class="dialog-note">本页面是交互式文化导览。建筑采用风格化复原，具体开放时间和游览安排请以景区现场公告为准。</p>`,
    sources: `<span class="overline">MAP & REFERENCE</span><h2>有据可循的坊巷</h2><p>道路与建筑平面轮廓来自 OpenStreetMap，街区历史格局参考 UNESCO 与公开文献。建筑高度、屋顶和植被为艺术化表达；近似景点坐标已在详情中标注“位置示意”。</p><ul class="source-links"><li><a href="https://www.openstreetmap.org/#map=17/26.085/119.2916" target="_blank" rel="noopener noreferrer">OpenStreetMap · 三坊七巷区域 ${icon("arrow")}</a></li><li><a href="https://whc.unesco.org/en/tentativelists/5808/" target="_blank" rel="noopener noreferrer">UNESCO · 三坊七巷历史格局 ${icon("arrow")}</a></li><li><a href="/sources.md" target="_blank" rel="noopener noreferrer">查看本项目的数据与建模说明 ${icon("arrow")}</a></li></ul><p class="dialog-note">地图数据 © OpenStreetMap contributors，采用 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">ODbL 许可</a>。本图不是实景摄影或测绘模型，虚线表示景点参观顺序，不代表步行路径。</p>`,
  };
  $("#dialog-content").innerHTML = content[kind] || content.help;
  if (!$("#info-dialog").open) $("#info-dialog").showModal();
}

function fitOverview() {
  if (!district) return;
  const b = district.bounds;
  homeTarget.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
  const direction = new THREE.Vector3(0.43, 0.72, 0.74).normalize();
  const testCamera = new THREE.PerspectiveCamera(
    camera.fov,
    camera.aspect,
    1,
    10000,
  );
  const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
  let lo = size * 0.8,
    hi = size * 6;
  const corner = new THREE.Vector3();
  for (let step = 0; step < 22; step++) {
    const distance = (lo + hi) / 2;
    testCamera.position.copy(homeTarget).addScaledVector(direction, distance);
    testCamera.lookAt(homeTarget);
    testCamera.updateMatrixWorld();
    let fits = true;
    for (const x of [b.minX, b.maxX])
      for (const z of [b.minZ, b.maxZ])
        for (const y of [-12, 30]) {
          corner.set(x, y, z).project(testCamera);
          if (Math.abs(corner.x) > 0.89 || corner.y < -0.7 || corner.y > 0.77)
            fits = false;
        }
    if (fits) hi = distance;
    else lo = distance;
  }
  homePosition.copy(homeTarget).addScaledVector(direction, hi);
  controls.maxDistance = Math.max(2400, hi * 1.6);
  camera.far = Math.max(6000, hi * 3);
  camera.updateProjectionMatrix();
}

function resize() {
  if (!renderer) return;
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  fitOverview();
  if (district && inOverview) {
    flight = null;
    camera.position.copy(
      isTopDown
        ? homeTarget
            .clone()
            .add(
              new THREE.Vector3(
                0,
                homePosition.distanceTo(homeTarget) * 0.83,
                0.1,
              ),
            )
        : homePosition,
    );
    controls.target.copy(homeTarget);
  }
}

function addMarkers() {
  points.forEach((p) => {
    const element = document.createElement("button");
    element.className = `map-marker ${p.category}`;
    element.dataset.place = p.id;
    element.setAttribute("aria-label", `地图景点：${p.name}`);
    element.innerHTML = `<span class="marker-bubble">${icon(p.category === "residence" ? "home" : p.category === "street" ? "route" : "building")}<span>${esc(p.name)}</span></span><span class="marker-stem"></span><span class="marker-foot"></span>`;
    $("#labels").append(element);
    markers.push({
      point: p,
      element,
      position: new THREE.Vector3(p.x, 24, p.z),
      filtered: false,
    });
  });
}

function renderMarkers() {
  const w = stage.clientWidth,
    h = stage.clientHeight;
  const boxes = [];
  const ordered = [...markers].sort(
    (a, b) =>
      (b.point.id === activePoint?.id ? 1 : 0) -
        (a.point.id === activePoint?.id ? 1 : 0) ||
      (a.point.category === "street") - (b.point.category === "street"),
  );
  for (const marker of ordered) {
    projected.copy(marker.position).project(camera);
    const x = (projected.x * 0.5 + 0.5) * w,
      y = (-projected.y * 0.5 + 0.5) * h;
    const width = Math.min(marker.point.name.length * 13 + 44, 214);
    const box = {
      left: x - width / 2,
      right: x + width / 2,
      top: y - 57,
      bottom: y + 8,
    };
    const overlap = boxes.some(
      (b) =>
        b.left < box.right &&
        b.right > box.left &&
        b.top < box.bottom &&
        b.bottom > box.top,
    );
    const hide =
      !showLabels ||
      (marker.filtered && marker.point.id !== activePoint?.id) ||
      projected.z > 1 ||
      projected.z < -1 ||
      x < 20 ||
      x > w - 20 ||
      y < 72 ||
      y > h - 90 ||
      (overlap && marker.point.id !== activePoint?.id);
    marker.element.hidden = hide;
    if (!hide) {
      boxes.push(box);
      marker.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      marker.element.style.zIndex = marker.point.id === activePoint?.id ? 4 : 2;
    }
  }
  const angle = Math.atan2(
    camera.position.x - controls.target.x,
    camera.position.z - controls.target.z,
  );
  $("#compass-needle").style.transform = `rotate(${-angle}rad)`;
  const distance = camera.position.distanceTo(controls.target);
  const metersPerPixel =
    (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h;
  const meters =
    metersPerPixel * 60 > 100 ? 100 : metersPerPixel * 60 > 50 ? 50 : 20;
  $("#scale-label").textContent = `${meters} m`;
  $("#scale-bar").style.width = `${meters / metersPerPixel}px`;
}

function animate(time) {
  frameId = requestAnimationFrame(animate);
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (flight) {
    const t = Math.min(1, (time - flight.start) / flight.duration);
    camera.position.lerpVectors(flight.fromPosition, flight.position, ease(t));
    controls.target.lerpVectors(flight.fromTarget, flight.target, ease(t));
    if (t >= 1) flight = null;
  }
  controls.update();
  if (selectionRing.visible && !reducedMotion) {
    const scale = 1 + Math.sin(time / 550) * 0.06;
    selectionRing.scale.setScalar(scale);
  }
  if (tour.active && !tour.paused && !document.hidden) {
    tour.elapsed += delta;
    if (tour.elapsed >= 10) nextStop();
  }
  renderMarkers();
  renderer.render(scene, camera);
}

async function init() {
  try {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#e7eeeb", 1800, 4400);
    camera = new THREE.PerspectiveCamera(
      38,
      stage.clientWidth / stage.clientHeight,
      1,
      6000,
    );
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.prepend(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 100;
    controls.maxDistance = 2200;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.001;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.65;
    controls.screenSpacePanning = false;
    controls.addEventListener("start", () => {
      flight = null;
      inOverview = false;
      if (tour.active && !tour.paused) {
        tour.paused = true;
        $("#tour-description").textContent = "已暂停 · 自由探索这一站";
        $('[data-action="pause-tour"]').innerHTML = icon("play");
        $('[data-action="pause-tour"]').setAttribute("aria-label", "继续漫游");
      }
    });
    hemi = new THREE.HemisphereLight("#f1f7f4", "#a5aea0", 1.8);
    scene.add(hemi);
    sun = new THREE.DirectionalLight("#fff4dc", 2.5);
    sun.position.set(-350, 760, 450);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -650,
      right: 650,
      top: 650,
      bottom: -650,
      near: 1,
      far: 2000,
    });
    sun.shadow.bias = -0.00035;
    sun.shadow.normalBias = 0.7;
    sun.shadow.radius = 3;
    scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.ShadowMaterial({ color: "#6c8376", opacity: 0.13 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -15;
    ground.receiveShadow = true;
    scene.add(ground);
    district = await createDistrict({
      scene,
      onProgress: (message) => {
        $("#loading-message").textContent =
          typeof message === "string" ? message : "正在铺展坊巷与院落…";
      },
    });
    const preferred = [
      /林觉民|冰心/,
      /严复/,
      /水榭/,
      /小黄楼/,
      /林则徐/,
      /二梅/,
      /南后街/,
    ];
    points = district.points.map(enrich).sort((a, b) => {
      const ai = preferred.findIndex((re) => re.test(a.name)),
        bi = preferred.findIndex((re) => re.test(b.name));
      return (ai < 0 ? 100 + a.index : ai) - (bi < 0 ? 100 + b.index : bi);
    });
    fitOverview();
    camera.position.copy(homePosition);
    controls.target.copy(homeTarget);
    controls.update();
    selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(22, 25, 64),
      new THREE.MeshBasicMaterial({
        color: "#72986d",
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.visible = false;
    selectionRing.renderOrder = 1;
    scene.add(selectionRing);
    addMarkers();
    renderList();
    prepareTour();
    $(".loading").classList.add("loaded");
    setTimeout(() => $(".loading").remove(), 800);
    lastTime = performance.now();
    animate(lastTime);
    new ResizeObserver(resize).observe(stage);
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      cancelAnimationFrame(frameId);
      notify("图形显示已中断，请刷新页面重新加载");
    });
  } catch (error) {
    console.error(error);
    $(".loading").innerHTML =
      `<span class="loading-seal">坊巷</span><h2>沙盘暂时没有展开</h2><p>地图数据或图形环境未能载入，请重新加载页面。</p><button class="primary-button" data-action="reload">重新加载</button><small>${esc(error.message)}</small>`;
  }
}

document.addEventListener("click", (event) => {
  const placeButton = event.target.closest("[data-place]");
  if (placeButton) return selectPlace(placeButton.dataset.place);
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("active", el === filter);
      el.setAttribute("aria-pressed", String(el === filter));
    });
    return renderList();
  }
  const view = event.target.closest("[data-view]");
  if (view) {
    if (view.dataset.view === "about") return openDialog("about");
    document
      .querySelectorAll("[data-view]")
      .forEach((el) => el.classList.toggle("active", el === view));
    $(".route-panel").classList.toggle(
      "hidden",
      view.dataset.view !== "routes",
    );
    if (routeLine)
      routeLine.visible = view.dataset.view === "routes" || tour.active;
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const actions = {
    "zoom-in": () => zoom(0.78),
    "zoom-out": () => zoom(1.28),
    home: restoreOverview,
    "3d": () => setView(false),
    "2d": () => setView(true),
    theme: toggleTheme,
    labels: () => {
      showLabels = !showLabels;
      const el = $('[data-action="labels"]');
      el.classList.toggle("active", showLabels);
      el.setAttribute("aria-pressed", String(showLabels));
    },
    north: () => {
      if (!camera) return;
      const distance = camera.position.distanceTo(controls.target);
      const elevation = isTopDown ? 0.001 : 0.68;
      flyTo(
        controls.target,
        controls.target
          .clone()
          .add(
            new THREE.Vector3(
              0,
              Math.cos(elevation),
              Math.sin(elevation),
            ).multiplyScalar(distance),
          ),
      );
    },
    help: () => openDialog("help"),
    sources: () => openDialog("sources"),
    "close-dialog": () => $("#info-dialog").close(),
    "close-selection": clearSelection,
    "start-tour": startTour,
    "stop-tour": () => stopTour(true),
    "next-stop": nextStop,
    "pause-tour": () => {
      tour.paused = !tour.paused;
      if (tour.paused) flight = null;
      else selectPlace(tour.stops[tour.index].id, true);
      const b = $('[data-action="pause-tour"]');
      b.innerHTML = icon(tour.paused ? "play" : "pause");
      b.setAttribute("aria-label", tour.paused ? "继续漫游" : "暂停漫游");
      $("#tour-description").textContent = tour.paused
        ? "已暂停 · 自由探索这一站"
        : "空中漫游中 · 每站停留 10 秒";
    },
    "close-routes": () => {
      $(".route-panel").classList.add("hidden");
      document
        .querySelectorAll("[data-view]")
        .forEach((el) =>
          el.classList.toggle("active", el.dataset.view === "explore"),
        );
      if (routeLine) routeLine.visible = tour.active;
    },
    "clear-search": () => {
      query = "";
      activeFilter = "all";
      $("#search").value = "";
      document.querySelectorAll("[data-filter]").forEach((el) => {
        el.classList.toggle("active", el.dataset.filter === "all");
        el.setAttribute("aria-pressed", String(el.dataset.filter === "all"));
      });
      renderList();
    },
    "toggle-explorer": () => $(".explorer").classList.toggle("mobile-open"),
    reload: () => location.reload(),
  };
  actions[action]?.();
});

function zoom(factor) {
  if (!camera) return;
  inOverview = false;
  const offset = camera.position.clone().sub(controls.target);
  const distance = THREE.MathUtils.clamp(
    offset.length() * factor,
    controls.minDistance,
    controls.maxDistance,
  );
  flyTo(
    controls.target,
    controls.target.clone().add(offset.setLength(distance)),
    350,
  );
}

$("#search").addEventListener("input", (event) => {
  query = event.target.value.trim();
  renderList();
});
$("#info-dialog").addEventListener("click", (event) => {
  if (event.target === $("#info-dialog")) $("#info-dialog").close();
});
document.addEventListener("keydown", (event) => {
  if (event.target.matches("input,textarea") || $("#info-dialog").open) return;
  if (event.key === "/") {
    event.preventDefault();
    $(".explorer").classList.add("mobile-open");
    $("#search").focus();
  }
  if (event.key === "Escape") {
    clearSelection();
    $(".explorer").classList.remove("mobile-open");
  }
});
stage.addEventListener("keydown", (event) => {
  if (!camera) return;
  if (
    [
      "+",
      "=",
      "-",
      "Home",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ].includes(event.key)
  )
    event.preventDefault();
  if (event.key === "+" || event.key === "=") zoom(0.8);
  if (event.key === "-") zoom(1.25);
  if (event.key === "Home") restoreOverview();
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  if (directions[event.key]) {
    inOverview = false;
    const d = directions[event.key],
      offset = new THREE.Vector3(d[0] * 25, 0, d[1] * 25);
    flyTo(
      controls.target.clone().add(offset),
      camera.position.clone().add(offset),
      180,
    );
  }
});
init();
