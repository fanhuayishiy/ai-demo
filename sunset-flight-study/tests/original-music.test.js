import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

async function originalMusicModule() {
  assert.ok(existsSync("src/original-music.js"), "official original music module exists");
  return import("../src/original-music.js");
}

test("official original music is exported without accessing a browser", async () => {
  const { OriginalMusic } = await originalMusicModule();
  assert.equal(typeof OriginalMusic, "function");
});

// Only DOM, SDK and clock boundaries are substituted. The adapter and all
// asynchronous state transitions are exercised through its public methods.
function documentBoundary() {
  const document = {
    defaultView: {},
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(), ownerDocument: document, children: [],
        parentNode: null, style: {}, attributes: {},
        setAttribute(name, value) { this.attributes[name] = String(value); },
        appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
        remove() {
          if (this.parentNode) {
            const siblings = this.parentNode.children;
            siblings.splice(siblings.indexOf(this), 1);
            this.parentNode = null;
          }
        },
      };
    },
  };
  document.head = document.createElement("head");
  const mount = document.createElement("section");
  return { document, mount };
}

function widgetBoundary() {
  const widgets = [];
  const Events = Object.fromEntries(
    ["READY", "PLAY", "PAUSE", "FINISH", "ERROR", "PLAY_PROGRESS"].map((name) => [name, name]),
  );
  function Widget(frame) {
    const listeners = new Map();
    const widget = {
      frame, commands: [], listeners, duration: 116625,
      bind(event, callback) { listeners.set(event, callback); },
      unbind(event) { listeners.delete(event); },
      emit(event, value) { listeners.get(event)?.(value); },
      play() { this.commands.push(["play"]); },
      pause() { this.commands.push(["pause"]); },
      seekTo(value) { this.commands.push(["seekTo", value]); },
      setVolume(value) { this.commands.push(["volume", value]); },
      getDuration(callback) { callback(this.duration); },
    };
    widgets.push(widget);
    return widget;
  }
  Widget.Events = Events;
  return { Widget, widgets, Events };
}

async function flush() {
  for (let step = 0; step < 8; step++) await Promise.resolve();
}

async function setup(t, extra = {}) {
  const { OriginalMusic } = await originalMusicModule();
  const dom = documentBoundary();
  const sdk = widgetBoundary();
  const changes = [];
  let loads = 0;
  const music = new OriginalMusic({
    mount: dom.mount,
    widgetLoader: async ({ document }) => {
      assert.equal(document, dom.document);
      loads++;
      return sdk.Widget;
    },
    onChange: (state) => changes.push({
      status: state.status, audible: state.audible, duration: state.duration,
      enabled: state.enabled, position: state.position,
    }),
    ...extra,
  });
  t.after(() => music.dispose?.());
  return { ...dom, ...sdk, music, changes, loads: () => loads };
}

test("original music is silent and does not load the SDK or iframe before toggle", async (t) => {
  const { music, mount, loads } = await setup(t);
  assert.equal(music.enabled, false);
  assert.equal(music.playing, true);
  assert.equal(music.volume, 0.35);
  assert.equal(music.audible, false);
  assert.equal(music.status, "idle");
  assert.equal(music.duration, 0);
  await music.setVolume(0.5);
  await music.setPlaying(false);
  await music.setPlaying(true);
  assert.equal(loads(), 0);
  assert.equal(mount.children.length, 0);
});

test("toggle creates an attributed official iframe and only PLAY confirms audibility", async (t) => {
  const { music, mount, widgets, changes, loads } = await setup(t);
  assert.equal(typeof music.toggle, "function");
  const pending = music.toggle();
  await flush();
  assert.equal(loads(), 1);
  assert.equal(music.status, "loading");
  assert.equal(music.audible, false);
  assert.equal(mount.children.length, 1);
  const frame = mount.children[0];
  const url = new URL(frame.src);
  assert.equal(url.origin, "https://w.soundcloud.com");
  assert.equal(url.searchParams.get("url"), "https://soundcloud.com/user-133547811/rumination");
  assert.equal(url.searchParams.get("auto_play"), "false");
  assert.equal(url.searchParams.get("show_user"), "true");
  assert.ok(frame.title.includes("BAANDIT!"));
  assert.equal(frame.hidden, undefined);
  assert.equal(frame.height, "166");
  widgets[0].emit("READY");
  assert.equal(await pending, true);
  assert.equal(music.status, "ready");
  assert.equal(music.audible, false, "autoplay refusal must not look like playback");
  assert.equal(music.duration, 116.625, "widget milliseconds become public seconds");
  assert.deepEqual(widgets[0].commands.slice(-2), [["volume", 35], ["play"]]);
  widgets[0].emit("PLAY");
  assert.equal(music.audible, true);
  assert.equal(music.status, "playing");
  assert.ok(changes.some((state) => state.status === "playing" && state.audible));
  widgets[0].emit("PAUSE");
  assert.equal(music.audible, false);
  assert.equal(music.status, "ready");
});

async function readyPlayer(t) {
  const state = await setup(t);
  const enabling = state.music.toggle();
  await flush();
  state.widgets[0].emit("READY");
  await enabling;
  return { ...state, widget: state.widgets[0] };
}

for (const [name, stop, enabled] of [
  ["disable", (music) => music.toggle(), false],
  ["pause or hide", (music) => music.setPlaying(false), true],
  ["zero volume", (music) => music.setVolume(0), true],
]) {
  test(`${name} silences immediately and rejects a delayed PLAY event`, async (t) => {
    const { music, widget } = await readyPlayer(t);
    widget.emit("PLAY");
    await stop(music);
    assert.equal(music.enabled, enabled);
    assert.equal(music.audible, false);
    assert.equal(music.status, "ready");
    assert.deepEqual(widget.commands.slice(-2), [["volume", 0], ["pause"]]);
    widget.emit("PLAY");
    assert.equal(music.audible, false);
    assert.equal(music.status, "ready");
    assert.deepEqual(widget.commands.at(-1), ["pause"]);
  });
}

test("volume clamps finite values and ignores invalid values", async (t) => {
  const { music, widget } = await readyPlayer(t);
  await music.setVolume(4);
  assert.equal(music.volume, 1);
  await music.setVolume(NaN);
  await music.setVolume(Infinity);
  assert.equal(music.volume, 1);
  await music.setVolume(-2);
  assert.equal(music.volume, 0);
  assert.equal(music.enabled, true);
  await music.setVolume(0.4);
  assert.deepEqual(widget.commands.slice(-2), [["volume", 40], ["play"]]);
  assert.equal(music.audible, false, "a new play request awaits actual PLAY");
});

test("pause before READY preserves the enabled preference without requesting play", async (t) => {
  const { music, widgets } = await setup(t);
  const pending = music.toggle();
  await music.setPlaying(false);
  await flush();
  widgets[0].emit("READY");
  assert.equal(await pending, true);
  assert.equal(music.audible, false);
  assert.equal(widgets[0].commands.some(([command]) => command === "play"), false);
  await music.setPlaying(true);
  assert.deepEqual(widgets[0].commands.at(-1), ["play"]);
});

test("FINISH restarts the full recording only while playback is wanted", async (t) => {
  const { music, widget } = await readyPlayer(t);
  widget.emit("PLAY");
  widget.emit("FINISH");
  assert.equal(music.audible, false);
  assert.equal(music.position, 0);
  assert.deepEqual(widget.commands.slice(-2), [["seekTo", 0], ["play"]]);
  await music.setPlaying(false);
  const before = widget.commands.length;
  widget.emit("FINISH");
  assert.equal(widget.commands.length, before);
  assert.equal(music.audible, false);
});

test("progress exposes seconds but only notifies once per elapsed second", async (t) => {
  const { music, widget, changes } = await readyPlayer(t);
  const before = changes.length;
  widget.emit("PLAY_PROGRESS", { currentPosition: 1001 });
  widget.emit("PLAY_PROGRESS", { currentPosition: 1240 });
  widget.emit("PLAY_PROGRESS", { currentPosition: 1999 });
  assert.equal(music.position, 1.999);
  assert.equal(changes.length, before + 1);
  widget.emit("PLAY_PROGRESS", { currentPosition: 2050 });
  assert.equal(changes.length, before + 2);
  widget.emit("PLAY_PROGRESS", { currentPosition: NaN });
  widget.emit("PLAY_PROGRESS", { currentPosition: -1 });
  assert.equal(music.position, 2.05);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function clockBoundary(t) {
  const timers = new Set();
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    const timer = { callback, delay };
    timers.add(timer);
    return timer;
  });
  t.mock.method(globalThis, "clearTimeout", (timer) => timers.delete(timer));
  return {
    timers,
    run() {
      for (const timer of [...timers]) {
        timers.delete(timer);
        timer.callback();
      }
    },
  };
}

test("SDK failure disables playback, exposes an error, removes the frame and permits retry", async (t) => {
  const error = new Error("SDK unavailable");
  const sdk = widgetBoundary();
  let attempts = 0;
  const { music, mount } = await setup(t, {
    widgetLoader: async () => {
      attempts++;
      if (attempts === 1) throw error;
      return sdk.Widget;
    },
  });
  await assert.rejects(music.toggle(), (received) => received === error);
  assert.equal(music.enabled, false);
  assert.equal(music.audible, false);
  assert.equal(music.status, "error");
  assert.equal(music.lastError, error);
  assert.equal(mount.children.length, 0);
  const retry = music.toggle();
  await flush();
  sdk.widgets[0].emit("READY");
  assert.equal(await retry, true);
  assert.equal(attempts, 2);
  assert.equal(music.lastError, null);
});

test("widget ERROR rejects a waiting toggle and detaches its callbacks", async (t) => {
  const { music, widgets, mount } = await setup(t);
  const pending = music.toggle();
  const rejected = assert.rejects(pending, /soundcloud.*playback/i);
  await flush();
  assert.equal(typeof widgets[0].listeners.get("ERROR"), "function");
  widgets[0].emit("ERROR");
  await rejected;
  assert.equal(music.status, "error");
  assert.equal(music.enabled, false);
  assert.equal(mount.children.length, 0);
  assert.equal(widgets[0].listeners.size, 0);
});

for (const stage of ["SDK", "READY"]) {
  test(`${stage} startup timeout is bounded to 15 seconds and rejects toggle`, async (t) => {
    const clock = clockBoundary(t);
    const state = await setup(t, stage === "SDK" ? { widgetLoader: () => new Promise(() => {}) } : {});
    const pending = state.music.toggle();
    const rejected = assert.rejects(pending, /timed out/i);
    await flush();
    assert.ok(clock.timers.size > 0);
    assert.ok([...clock.timers].every(({ delay }) => delay <= 15000));
    clock.run();
    await rejected;
    assert.equal(state.music.status, "error");
    assert.equal(state.music.enabled, false);
    assert.equal(state.mount.children.length, 0);
    assert.equal(clock.timers.size, 0);
  });
}

test("dispose settles an SDK-pending toggle and prevents a late loader from creating a widget", async (t) => {
  const sdkLoading = deferred();
  const { music, Widget, widgets, mount } = await setup(t, { widgetLoader: () => sdkLoading.promise });
  const pending = music.toggle();
  let settled = false;
  pending.then(() => { settled = true; });
  await music.dispose();
  await flush();
  assert.equal(settled, true);
  assert.equal(await pending, false);
  sdkLoading.resolve(Widget);
  await flush();
  assert.equal(widgets.length, 0);
  assert.equal(mount.children.length, 0);
  assert.equal(music.status, "disposed");
  assert.equal(await music.toggle(), false);
});

test("dispose ignores already queued widget callbacks and late duration getters", async (t) => {
  const { music, widgets, mount, changes } = await setup(t);
  const pending = music.toggle();
  await flush();
  const widget = widgets[0];
  let durationCallback;
  widget.getDuration = (callback) => { durationCallback = callback; };
  widget.emit("READY");
  await pending;
  const queued = [...widget.listeners].filter(([name]) => name !== "PLAY_PROGRESS");
  await music.dispose();
  const before = changes.length;
  queued.forEach(([, callback]) => callback());
  durationCallback(999000);
  assert.equal(music.status, "disposed");
  assert.equal(music.enabled, false);
  assert.equal(music.audible, false);
  assert.equal(music.duration, 0);
  assert.equal(changes.length, before);
  assert.equal(widget.listeners.size, 0);
  assert.equal(mount.children.length, 0);
});

test("old-generation events cannot alter a recovered player", async (t) => {
  const { music, widget, widgets, mount } = await readyPlayer(t);
  const oldPlay = widget.listeners.get("PLAY");
  const oldReady = widget.listeners.get("READY");
  assert.equal(typeof widget.listeners.get("ERROR"), "function");
  widget.emit("ERROR");
  assert.equal(music.status, "error");
  const retry = music.toggle();
  await flush();
  widgets[1].emit("READY");
  await retry;
  oldReady();
  oldPlay();
  assert.equal(music.status, "ready");
  assert.equal(music.audible, false);
  assert.equal(mount.children.length, 1);
});

test("the default loader lazily loads the official SDK and retains visible attribution", async (t) => {
  const { music, document, Widget, widgets } = await setup(t, { widgetLoader: undefined });
  assert.equal(document.head.children.length, 0);
  const pending = music.toggle();
  pending.catch(() => {});
  await flush();
  assert.equal(document.head.children.length, 1);
  const script = document.head.children[0];
  assert.equal(script.src, "https://w.soundcloud.com/player/api.js");
  assert.equal(script.async, true);
  document.defaultView.SC = { Widget };
  script.onload();
  await flush();
  widgets[0].emit("READY");
  assert.equal(await pending, true);
  assert.equal(music.status, "ready");
});

test("the default loader reuses an already available official SDK", async (t) => {
  const { music, document, Widget, widgets } = await setup(t, { widgetLoader: undefined });
  document.defaultView.SC = { Widget };
  const pending = music.toggle();
  pending.catch(() => {});
  await flush();
  assert.equal(widgets.length, 1);
  widgets[0].emit("READY");
  await pending;
  assert.equal(document.head.children.length, 0);
});

test("SDK script errors remove the failed script and a later toggle loads a fresh one", async (t) => {
  const { music, document, Widget, widgets } = await setup(t, { widgetLoader: undefined });
  const pending = music.toggle();
  const rejected = assert.rejects(pending, /soundcloud.*sdk/i);
  await flush();
  assert.equal(document.head.children.length, 1);
  document.head.children[0].onerror();
  await rejected;
  assert.equal(document.head.children.length, 0);
  assert.equal(music.status, "error");
  const retry = music.toggle();
  await flush();
  assert.equal(document.head.children.length, 1);
  document.defaultView.SC = { Widget };
  document.head.children[0].onload();
  await flush();
  widgets[0].emit("READY");
  assert.equal(await retry, true);
});

test("a pending SDK is shared and one disposed player cannot abort another", async (t) => {
  const { OriginalMusic } = await originalMusicModule();
  const { music, document, Widget, widgets } = await setup(t, { widgetLoader: undefined });
  const other = new OriginalMusic({ mount: document.createElement("section") });
  t.after(() => other.dispose());
  const first = music.toggle();
  const second = other.toggle();
  first.catch(() => {});
  second.catch(() => {});
  await flush();
  assert.equal(document.head.children.length, 1);
  await music.dispose();
  document.defaultView.SC = { Widget };
  document.head.children[0].onload();
  await flush();
  assert.equal(widgets.length, 1);
  widgets[0].emit("READY");
  assert.equal(await first, false);
  assert.equal(await second, true);
});

test("a stalled default SDK times out and is removed for retry", async (t) => {
  const clock = clockBoundary(t);
  const { music, document } = await setup(t, { widgetLoader: undefined });
  const pending = music.toggle();
  const rejected = assert.rejects(pending, /timed out/i);
  await flush();
  assert.equal(document.head.children.length, 1);
  clock.run();
  await rejected;
  await flush();
  assert.equal(document.head.children.length, 0);
  assert.equal(clock.timers.size, 0);
});

test("dispose before the loader microtask prevents starting an unnecessary SDK request", async (t) => {
  const { music, loads, mount } = await setup(t);
  const pending = music.toggle();
  await music.dispose();
  assert.equal(await pending, false);
  assert.equal(loads(), 0);
  assert.equal(mount.children.length, 0);
});

test("PLAY before READY cannot bypass a disabled intent", async (t) => {
  const { music, widgets } = await setup(t);
  const pending = music.toggle();
  await flush();
  await music.toggle();
  widgets[0].emit("PLAY");
  assert.equal(music.audible, false);
  assert.deepEqual(widgets[0].commands.slice(-2), [["volume", 0], ["pause"]]);
  widgets[0].emit("READY");
  assert.equal(await pending, false);
});

test("an SDK play command failure rejects toggle and leaves a retryable error state", async (t) => {
  const { music, widgets, mount } = await setup(t);
  const pending = music.toggle();
  const rejected = assert.rejects(pending, /frame unavailable/);
  await flush();
  widgets[0].play = () => { throw new Error("frame unavailable"); };
  widgets[0].emit("READY");
  await rejected;
  assert.equal(music.enabled, false);
  assert.equal(music.audible, false);
  assert.equal(music.status, "error");
  assert.equal(mount.children.length, 0);
});

test("automatic playback changes handle failed SDK commands without unhandled rejections", async (t) => {
  const { music, widget, mount } = await readyPlayer(t);
  widget.pause = () => { throw new Error("frame unavailable"); };
  await assert.doesNotReject(music.setPlaying(false));
  assert.equal(music.enabled, false);
  assert.equal(music.status, "error");
  assert.equal(mount.children.length, 0);
});

test("invalid duration callbacks do not expose nonfinite metadata", async (t) => {
  const { music, widgets } = await setup(t);
  const pending = music.toggle();
  await flush();
  widgets[0].duration = NaN;
  widgets[0].emit("READY");
  await pending;
  assert.equal(music.duration, 0);
});

test("adjusting a nonzero volume does not undo a direct pause in the visible iframe", async (t) => {
  const { music, widget } = await readyPlayer(t);
  widget.emit("PLAY");
  widget.emit("PAUSE");
  const before = widget.commands.length;
  await music.setVolume(0.6);
  assert.deepEqual(widget.commands.slice(before), [["volume", 60]]);
  assert.equal(music.audible, false);
  assert.equal(music.status, "ready");
  await music.setVolume(0);
  await music.setVolume(0.6);
  assert.deepEqual(widget.commands.slice(-2), [["volume", 60], ["play"]]);
});

test("ERROR immediately after READY still rejects the pending toggle", async (t) => {
  const { music, widgets } = await setup(t);
  const pending = music.toggle();
  const rejected = assert.rejects(pending, /soundcloud.*playback/i);
  await flush();
  widgets[0].emit("READY");
  widgets[0].emit("ERROR");
  await rejected;
  assert.equal(music.status, "error");
  assert.equal(music.enabled, false);
});

test("PAUSE and FINISH before READY do not claim readiness or restart playback", async (t) => {
  const { music, widgets } = await setup(t);
  const pending = music.toggle();
  await flush();
  widgets[0].emit("PAUSE");
  widgets[0].emit("FINISH");
  assert.equal(music.status, "loading");
  assert.equal(widgets[0].commands.length, 0);
  widgets[0].emit("READY");
  await pending;
});
