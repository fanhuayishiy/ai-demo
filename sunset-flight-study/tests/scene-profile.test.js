import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("video-inspired sunset is default and classic daylight stays accessible", async () => {
  assert.ok(existsSync("src/scene-profile.js"));
  const { getSceneProfile } = await import("../src/scene-profile.js");
  const reference = getSceneProfile("");
  assert.equal(reference.id, "sunset");
  assert.equal(reference.duration, 24);
  assert.equal(reference.shots.length, 4);
  assert.equal(reference.showOpponent, false);
  assert.equal(getSceneProfile("?scene=classic").duration, 72);
  assert.equal(getSceneProfile("?scene=classic").showOpponent, true);
  assert.equal(getSceneProfile("?scene=unknown").id, "sunset");
  for (const profile of [reference, getSceneProfile("?scene=classic")]) {
    assert.equal(typeof profile.createWorld, "function");
    assert.equal(typeof profile.createAircraft, "function");
    assert.equal(typeof profile.sampleFlight, "function");
    assert.equal(typeof profile.sampleCamera, "function");
  }
});

test("reference shell has unobtrusive keyboard-accessible control reveal and dynamic durations", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /id="controls-toggle"/);
  assert.match(html, /aria-controls="film-controls"/);
  assert.match(html, /id="total-time"/);
  assert.match(html, /id="shot-count"/);
  assert.match(html, /just breathe\./);
  const main = readFileSync("src/main.js", "utf8");
  assert.doesNotMatch(main, /共 1 分 12 秒/);
  assert.match(main, /profile\.duration/);
});

test("reference propeller makes complete turns across the film loop", async () => {
  const { getSceneProfile } = await import("../src/scene-profile.js");
  const profile = getSceneProfile("");
  const turns = (profile.propellerSpeed * profile.duration) / (2 * Math.PI);
  assert.ok(Math.abs(turns - Math.round(turns)) < 1e-10);
  assert.ok(profile.propellerSpeed > 60);
  assert.equal(getSceneProfile("?scene=classic").propellerSpeed, 70);
});
