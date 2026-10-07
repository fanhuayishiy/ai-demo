import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { Playback } from "../src/playback.js";

const main = readFileSync("src/main.js", "utf8");
const animate = main.match(/function animate\(\) \{[\s\S]*?\n\}/)[0];
const toggle = main.match(/async function toggleMusic\(\) \{[\s\S]*?\n\}/)[0];

function application({ hidden = false, paused = false } = {}) {
  const requests = [];
  const player = new Playback(24);
  player.paused = paused;
  const context = {
    startupMusicPending: true, isReference: true, sceneAvailable: true,
    hasRendered: false, musicBusy: false, musicSource: "original", player,
    document: { hidden, body: { dataset: {} } },
    requestAnimationFrame: () => 1,
    clock: { getDelta: () => 0.016 },
    updateScene() {}, animeRenderer: { render() {} },
    $: () => ({ classList: { add() {} } }),
    syncDock() {}, toast() {},
    music: { enabled: false, async toggle() {
      this.enabled = !this.enabled;
      requests.push(this.enabled);
      return this.enabled;
    } },
  };
  const api = runInNewContext(`${toggle}; ${animate}; ({animate, toggleMusic})`, context);
  return { context, requests, ...api };
}

test("sunset starts the animation by explicit default, including reduced-motion preference", () => {
  const expression = main.match(/const player = (new Playback\([^;]+);/)[1];
  for (const reducedMotion of [false, true]) {
    const player = runInNewContext(expression, { Playback, DURATION: 24, reducedMotion, isReference: true });
    assert.equal(player.paused, false);
    player.update(0.1);
    assert.equal(player.time, 0.1);
  }
  const classic = runInNewContext(expression, { Playback, DURATION: 72, reducedMotion: true, isReference: false });
  assert.equal(classic.paused, true, "classic retains its original accessibility default");
});

test("first rendered frame enables music once alongside the animation", async () => {
  assert.match(main, /let startupMusicPending = isReference/);
  const app = application();
  app.animate();
  await Promise.resolve();
  app.animate();
  assert.deepEqual(app.requests, [true]);
  assert.equal(app.context.hasRendered, true);
  assert.equal(app.context.startupMusicPending, false);
  assert.ok(app.context.player.time > 0);
});

test("hidden startup defers music and animation until the first visible frame", async () => {
  const app = application({ hidden: true });
  app.animate();
  assert.deepEqual(app.requests, []);
  assert.equal(app.context.hasRendered, false);
  assert.equal(app.context.player.time, 0);
  app.context.document.hidden = false;
  app.animate();
  await Promise.resolve();
  assert.deepEqual(app.requests, [true]);
});

test("manual on then off before the first visible frame prevents automatic re-enabling", async () => {
  const app = application({ hidden: true });
  await app.toggleMusic();
  await app.toggleMusic();
  app.context.document.hidden = false;
  app.animate();
  await Promise.resolve();
  assert.deepEqual(app.requests, [true, false]);
  assert.equal(app.context.music.enabled, false);
  assert.equal(app.context.startupMusicPending, false);
});

test("turning music off after startup stays off on later frames", async () => {
  const app = application();
  app.animate();
  // Drain the VM promise adoption before simulating the enabled UI button.
  await new Promise(setImmediate);
  assert.equal(app.context.musicBusy, false);
  await app.toggleMusic();
  app.animate();
  app.animate();
  assert.deepEqual(app.requests, [true, false]);
});

test("startup never resumes an animation the user has paused", async () => {
  const app = application({ paused: true });
  app.animate();
  await Promise.resolve();
  assert.deepEqual(app.requests, [true]);
  assert.equal(app.context.player.paused, true);
  assert.equal(app.context.player.time, 0);
});

test("unavailable or failed rendering cannot start music", () => {
  const unavailable = application();
  unavailable.context.sceneAvailable = false;
  unavailable.animate();
  assert.deepEqual(unavailable.requests, []);
  const failed = application();
  failed.context.animeRenderer.render = () => { throw new Error("WebGL unavailable"); };
  assert.throws(failed.animate, /WebGL unavailable/);
  assert.deepEqual(failed.requests, []);
  assert.equal(failed.context.hasRendered, false);
});

test("classic pages do not opt into original music startup", () => {
  const app = application();
  app.context.isReference = false;
  app.context.startupMusicPending = false;
  app.context.music = null;
  app.animate();
  assert.deepEqual(app.requests, []);
});
