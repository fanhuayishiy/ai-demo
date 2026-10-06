import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("the film player exposes accessible scene and playback controls", () => {
  assert.ok(existsSync("index.html"), "application shell exists");
  const html = readFileSync("index.html", "utf8");
  for (const id of [
    "scene",
    "play-toggle",
    "timeline",
    "camera-mode",
    "sound-toggle",
    "quality-toggle",
    "notes-dialog",
    "restart",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `${id} is present`);
  }
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /type="range"/);
  assert.match(html, /aria-label=/);
  assert.match(html, /type="module"/);
});

test("playback advances only while playing and loops without drift", async () => {
  assert.ok(existsSync("src/playback.js"), "playback implementation exists");
  const { Playback } = await import("../src/playback.js");
  const player = new Playback(72);
  player.update(1);
  assert.equal(player.time, 1);
  player.paused = true;
  player.update(3);
  assert.equal(player.time, 1);
  player.seek(71.5);
  player.paused = false;
  player.update(1);
  assert.equal(player.time, 0.5);
});

test("seeking clamps to the film bounds and ignores invalid values", async () => {
  assert.ok(existsSync("src/playback.js"), "playback implementation exists");
  const { Playback, formatTime } = await import("../src/playback.js");
  const player = new Playback(72);
  player.seek(-10);
  assert.equal(player.time, 0);
  player.seek(100);
  assert.equal(player.time, 72);
  player.seek(Number.NaN);
  assert.equal(player.time, 72);
  assert.equal(formatTime(72), "01:12");
  assert.equal(formatTime(8.9), "00:08");
});

test("reduced-motion preference starts the film paused", async () => {
  assert.ok(existsSync("src/playback.js"), "playback implementation exists");
  const { Playback } = await import("../src/playback.js");
  assert.equal(new Playback(72, { reducedMotion: true }).paused, true);
});

test("touch layouts retain a direct restart action without external font loading", () => {
  const style = readFileSync("src/style.css", "utf8");
  assert.doesNotMatch(style, /\.restart-button\s*\{\s*display:\s*none/);
  assert.doesNotMatch(style, /@import url\(['"]https:/);
});
