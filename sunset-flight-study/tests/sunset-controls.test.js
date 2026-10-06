import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

class Control extends EventTarget {
  constructor() {
    super();
    this.attributes = new Map();
    this.value = "35";
  }
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  getAttribute(name) {
    return this.attributes.get(name);
  }
}
function documentFixture() {
  const ids = [
    "sunset-prev",
    "sunset-play",
    "sunset-restart",
    "sunset-next",
    "sunset-camera",
    "music-toggle",
    "music-volume",
    "music-status",
    "sunset-play-label",
    "sunset-camera-label",
    "music-toggle-label",
    "music-source",
    "music-player-mount",
    "music-hint",
    "music-track-time",
    "music-player-details",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Control()]));
  return { elements, getElementById: (id) => elements[id] };
}

test("sunset dock forwards native button and volume events and releases handlers", async () => {
  assert.ok(existsSync("src/sunset-controls.js"));
  const { bindSunsetControls } = await import("../src/sunset-controls.js");
  const doc = documentFixture();
  const received = [];
  const actions = Object.fromEntries(
    [
      "togglePlayback",
      "restart",
      "previous",
      "next",
      "cycleCamera",
      "toggleMusic",
      "setVolume",
    ].map((name) => [name, (value) => received.push([name, value])]),
  );
  const dock = bindSunsetControls(doc, actions);
  for (const id of [
    "sunset-play",
    "sunset-restart",
    "sunset-prev",
    "sunset-next",
    "sunset-camera",
    "music-toggle",
  ]) {
    doc.elements[id].dispatchEvent(new Event("click"));
  }
  doc.elements["music-volume"].value = "60";
  doc.elements["music-volume"].dispatchEvent(new Event("input"));
  assert.deepEqual(
    received.map(([name]) => name),
    [
      "togglePlayback",
      "restart",
      "previous",
      "next",
      "cycleCamera",
      "toggleMusic",
      "setVolume",
    ],
  );
  assert.equal(received.at(-1)[1], 0.6);
  dock.dispose();
  dock.dispose();
  doc.elements["sunset-play"].dispatchEvent(new Event("click"));
  assert.equal(received.length, 7);
});

test("sunset dock reflects paused playback, camera, and independent soundtrack state", async () => {
  assert.ok(existsSync("src/sunset-controls.js"));
  const { bindSunsetControls } = await import("../src/sunset-controls.js");
  const doc = documentFixture();
  const noop = () => {};
  const dock = bindSunsetControls(doc, {
    togglePlayback: noop,
    restart: noop,
    previous: noop,
    next: noop,
    cycleCamera: noop,
    toggleMusic: noop,
    setVolume: noop,
  });
  dock.sync({
    paused: true,
    mode: "orbit",
    musicEnabled: true,
    musicPlaying: false,
    musicVolume: 0.35,
    musicBusy: false,
  });
  assert.equal(
    doc.elements["sunset-play"].getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(doc.elements["sunset-play-label"].textContent, "播放");
  assert.match(doc.elements["sunset-camera-label"].textContent, /自由/);
  assert.match(doc.elements["music-status"].textContent, /暂停/);
  assert.equal(
    doc.elements["music-toggle"].getAttribute("aria-pressed"),
    "true",
  );
  dock.sync({
    paused: false,
    mode: "cinematic",
    musicEnabled: false,
    musicPlaying: true,
    musicVolume: 0.6,
    musicBusy: true,
  });
  assert.equal(doc.elements["music-toggle"].disabled, true);
  assert.equal(doc.elements["music-volume"].disabled, true);
  assert.match(doc.elements["music-status"].textContent, /准备/);
  assert.equal(doc.elements["music-volume"].value, "60");
  dock.sync({ paused: false, mode: "pilot", musicEnabled: false,
    musicPlaying: false, musicVolume: 0.35, musicBusy: false });
  assert.equal(doc.elements["sunset-camera-label"].textContent, "机位 · 驾驶");
  assert.match(doc.elements["sunset-camera"].title, /G.*电影/);
  dock.dispose();
});

test("chapter stepping wraps safely at both film endpoints", async () => {
  assert.ok(existsSync("src/sunset-controls.js"));
  const { adjacentChapterIndex } = await import("../src/sunset-controls.js");
  const shots = [
    { start: 0, end: 6 },
    { start: 6, end: 12 },
    { start: 12, end: 18 },
    { start: 18, end: 24 },
  ];
  assert.equal(adjacentChapterIndex(shots, 0, -1), 3);
  assert.equal(adjacentChapterIndex(shots, 23, 1), 0);
  assert.equal(adjacentChapterIndex(shots, 24, -1), 2);
  assert.equal(adjacentChapterIndex(shots, 6, 1), 2);
});

test("application integrates music with reference controls, pause, visibility and disposal", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(
    main,
    /isReference\s*\? createMusic\(\)\s*: null/,
  );
  assert.match(main, /bindSunsetControls\(document/);
  assert.match(main, /music\?\.dispose\(\)/);
  assert.match(main, /sunsetDock\?\.dispose\(\)/);
  assert.match(
    main,
    /syncMusicPlayback\(!player\.paused && !document\.hidden\)/,
  );
  assert.match(main, /syncMusicPlayback\(false\)/);
  assert.match(main, /event\.key\.toLowerCase\(\) === "p"/);
});

test("soundtrack UI identifies the original song and explicitly labels the clip fallback", async () => {
  const { bindSunsetControls } = await import("../src/sunset-controls.js");
  const doc = documentFixture();
  const dock = bindSunsetControls(doc, {});
  for (const enabled of [false, true]) {
    dock.sync({
      paused: false,
      mode: "cinematic",
      musicEnabled: enabled,
      musicPlaying: enabled,
      musicVolume: 0.35,
      musicBusy: false,
      musicSource: "original",
      musicStatus: enabled ? "playing" : "idle",
    });
    assert.match(doc.elements["music-status"].textContent, /原曲/);
    assert.doesNotMatch(
      doc.elements["music-status"].textContent,
      /原创|夕空小夜曲/,
    );
  }
  dock.sync({ musicSource: "clip", musicVolume: 0.35 });
  assert.match(doc.elements["music-status"].textContent, /视频片段/);
  assert.match(doc.elements["music-hint"].textContent, /15.44/);
  assert.equal(doc.elements["music-player-mount"].hidden, true);
  const main = readFileSync("src/main.js", "utf8");
  assert.ok(main.includes('from "./video-music.js"'));
  assert.doesNotMatch(main, /原创配乐|48 秒原创|夕空小夜曲/);
  dock.dispose();
});

test("official ready, paused and failed states never claim audio is playing", async () => {
  const { bindSunsetControls } = await import("../src/sunset-controls.js");
  const doc = documentFixture();
  const dock = bindSunsetControls(doc, {});
  const state = { musicSource: "original", musicEnabled: true, musicVolume: 0.35, musicPlaying: false };
  dock.sync({ ...state, musicStatus: "ready", musicTime: "00:00 / 01:56" });
  assert.match(doc.elements["music-status"].textContent, /等待播放/);
  assert.match(doc.elements["music-hint"].textContent, /播放键/);
  assert.equal(doc.elements["music-track-time"].textContent, "00:00 / 01:56");
  assert.equal(doc.elements["music-player-mount"].hidden, false);
  dock.sync({ ...state, paused: true, musicStatus: "ready" });
  assert.match(doc.elements["music-status"].textContent, /暂停/);
  dock.sync({ ...state, musicEnabled: false, musicStatus: "error" });
  assert.match(doc.elements["music-status"].textContent, /连接失败/);
  assert.match(doc.elements["music-hint"].textContent, /重试|视频片段/);
  dock.dispose();
});

test("music source change uses native selection and releases its listener", async () => {
  const { bindSunsetControls } = await import("../src/sunset-controls.js");
  const doc = documentFixture();
  const selected = [];
  const dock = bindSunsetControls(doc, { selectMusicSource: source => selected.push(source) });
  doc.elements["music-source"].value = "clip";
  doc.elements["music-source"].dispatchEvent(new Event("change"));
  assert.deepEqual(selected, ["clip"]);
  dock.dispose();
  doc.elements["music-source"].dispatchEvent(new Event("change"));
  assert.equal(selected.length, 1);
});

test("original song is the default, while the old audio clip stays an explicit fallback", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /let musicSource = "original"/);
  assert.match(main, /new OriginalMusic\(/);
  assert.match(main, /new FlightMusic\(\{ renderer: loadVideoMusic \}\)/);
  assert.match(main, /music\.audible/);
  assert.match(main, /\$\("notes-disclaimer"\)\.textContent/);
  assert.match(main, /BAANDIT!/);
});

test("source switching disposes the old track before enabling the next and preserves volume", async () => {
  const main = readFileSync("src/main.js", "utf8");
  const select = main.match(/async function selectMusicSource\(source\) \{[\s\S]*?\n\}/)[0];
  const calls = [];
  const state = {
    music: { enabled: true, volume: 0.62, dispose: async () => calls.push("dispose old") },
    musicSource: "original", musicBusy: false, sceneAvailable: true,
    player: { paused: true }, document: { hidden: false },
    syncDock() {}, toast() {},
    createMusic: () => {
      calls.push("create next");
      return {
        setVolume: async v => calls.push(["volume", v]),
        setPlaying: async v => calls.push(["playing", v]),
      };
    },
    toggleMusic: async () => calls.push("toggle next"),
  };
  await runInNewContext(`${select}; selectMusicSource("clip")`, state);
  assert.deepEqual(calls, ["dispose old", "create next", ["volume", 0.62], ["playing", false], "toggle next"]);
  assert.equal(state.musicSource, "clip");
  assert.equal(state.musicBusy, false);
});

test("source switching cannot recreate music after lifecycle disposal during teardown", async () => {
  const main = readFileSync("src/main.js", "utf8");
  const select = main.match(/async function selectMusicSource\(source\) \{[\s\S]*?\n\}/)[0];
  let finish;
  let created = 0;
  const state = {
    music: { enabled: true, volume: 0.35, dispose: () => new Promise(resolve => { finish = resolve; }) },
    musicSource: "original", musicBusy: false, sceneAvailable: true,
    player: { paused: false }, document: { hidden: false },
    syncDock() {}, toast() {}, createMusic: () => { created++; },
    toggleMusic: async () => { throw new Error("Unexpected late toggle"); },
  };
  const pending = runInNewContext(`${select}; selectMusicSource("clip")`, state);
  state.sceneAvailable = false;
  finish();
  await pending;
  assert.equal(created, 0);
});

test("actual music synchronization never resumes after the scene becomes unavailable", async () => {
  const main = readFileSync("src/main.js", "utf8");
  const sync = main.match(
    /function syncMusicPlayback\(playing\) \{[\s\S]*?\n\}/,
  )[0];
  const intents = [];
  const state = {
    sceneAvailable: true,
    syncDock() {},
    music: {
      setPlaying(value) {
        intents.push(value);
        return Promise.resolve();
      },
    },
  };
  runInNewContext(
    `${sync}; syncMusicPlayback(true); sceneAvailable = false; syncMusicPlayback(false); syncMusicPlayback(true);`,
    state,
  );
  await Promise.resolve();
  assert.deepEqual(intents, [true, false, false]);
  assert.match(main, /sceneAvailable = false;\s*player\.paused = true;/);
});
