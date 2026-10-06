import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { PILOT_CAMERA_FOLLOW, PILOT_LIMITS } from "../src/pilot-motion.js";

const main = readFileSync("src/main.js", "utf8");
const html = readFileSync("index.html", "utf8");
const css = readFileSync("src/style.css", "utf8");

test("sunset exposes keyboard instructions, live position feedback and native reset", () => {
  assert.match(html, /id="pilot-help"/);
  assert.match(html, /WASD/);
  assert.match(html, /↑↓←→/);
  assert.match(html, /id="pilot-status"/);
  assert.match(html, /<button[^>]*type="button"[^>]*id="pilot-reset"/);
  assert.match(html, /回到航线/);
  assert.match(css, /\.pilot-help\s*\{[^}]*display:\s*none/s);
  assert.match(
    css,
    /\.reference-film\s+\.pilot-help\s*\{[^}]*display:\s*flex/s,
  );
  assert.match(css, /#pilot-reset\s*\{[^}]*min-height:\s*44px/s);
});

test("actual scene sampler applies steering to the aircraft but leaves the opponent unchanged", () => {
  const source = main.match(
    /function samplePilotedFlight\(time\) \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(source, "scene and airflow share the piloted flight sampler");
  const blue = { position: "opponent" };
  const calls = [];
  const context = {
    sampleFlight: (time) => ({ red: { position: time }, blue }),
    steeringFrame: (time) => ({ time }),
    pilot: {
      applyPose: (pose, frame) => {
        calls.push([pose.position, frame.time]);
        return { position: pose.position + 10 };
      },
    },
    mode: "cinematic",
  };
  const actual = runInNewContext(`${source}; samplePilotedFlight(3)`, context);
  assert.equal(actual.red.position, 13);
  assert.equal(actual.blue, blue);
  assert.deepEqual(calls, [[3, 3]]);
  context.pilot = null;
  assert.equal(
    runInNewContext(`${source}; samplePilotedFlight(3)`, context).red.position,
    3,
  );
});

test("render loop updates steering only during playback and wires motion into camera and airflow", () => {
  assert.match(main, /isReference \? new PilotMotion\(\) : null/);
  assert.match(main, /pilot\?\.update\([\s\S]*?!player\.paused/);
  assert.match(main, /pilotInput\?\.sample\(delta\)/);
  assert.match(main, /const flight = samplePilotedFlight\(time\)/);
  assert.match(main, /pilot\.applyCamera\(cameraFrame\)/);
  assert.match(main, /createReferenceEffects\(scene, samplePilotedFlight/);
  assert.match(main, /pilotInput\?\.dispose\(\)/);
  assert.match(main, /bindPilotInput\(document, window/);
});

test("actual reset clears held keys and pilot displacement, and seeking invokes reset", () => {
  const source = main.match(/function resetPilot\([^)]*\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(source, "pilot reset has a single integration point");
  const calls = [];
  runInNewContext(`${source}; resetPilot();`, {
    pilotInput: { clear: () => calls.push("clear") },
    pilot: { reset: () => calls.push("reset") },
    syncPilot: () => calls.push("sync"),
    syncDock: () => calls.push("dock"),
  });
  assert.deepEqual(calls, ["clear", "reset", "sync", "dock"]);
  const seek = main.match(/function seek\(time\) \{[\s\S]*?\n\}/)[0];
  assert.match(seek, /resetPilot\(\)/);
  assert.match(main, /if \(player\.paused\) pilotInput\?\.clear\(\)/);
});

test("actual steering frame is stabilized before both aircraft and camera transforms", () => {
  const fn = main.match(/function steeringFrame\(time\) \{[\s\S]*?\n\}/)[0];
  const calls = [];
  const state = { mode: "chase", controls: null,
    sampleCamera: (time, mode) => ({ time, mode }),
    sampleFlight: time => ({ red: { time } }),
    pilot: { steeringCamera(frame, pose) { calls.push([frame.time, frame.mode, pose.time]); return { ...frame, stable: true }; } },
  };
  assert.equal(runInNewContext(`${fn}; steeringFrame(4)`, state).stable, true);
  assert.deepEqual(calls, [[4, "chase", 4]]);
  assert.match(main, /let cameraFrame = steeringFrame\(time\)/);
  assert.match(main, /stabilize: mode !== "orbit"/);
});

test("pilot feedback highlights accepted keys and identifies a travel boundary", () => {
  const fn = main.match(/function syncPilot\(\) \{[\s\S]*?\n\}/)[0];
  const elements = Object.fromEntries(["pilot-help", "pilot-status", "pilot-up", "pilot-down", "pilot-left", "pilot-right"].map(id => [id, { dataset: {}, textContent: "" }]));
  const context = { $: id => elements[id], pilot: { x: PILOT_LIMITS.x, y: 0, active: true, engaged: true },
    pilotInput: { axes: () => ({ x: 1, y: 0 }) }, PILOT_LIMITS,
    player: { paused: false }, mode: "cinematic", document: { activeElement: null } };
  runInNewContext(`${fn}; syncPilot()`, context);
  assert.equal(elements["pilot-right"].dataset.pressed, "true");
  assert.equal(elements["pilot-left"].dataset.pressed, "false");
  assert.equal(elements["pilot-help"].dataset.boundary, "true");
  assert.match(elements["pilot-status"].textContent, /边界/);
  context.pilot.x = 2;
  runInNewContext(`${fn}; syncPilot()`, context);
  assert.match(elements["pilot-status"].textContent, /稳定尾随/);
  context.player.paused = true;
  runInNewContext(`${fn}; syncPilot()`, context);
  assert.match(elements["pilot-status"].textContent, /暂停/);
});

test("main camera corrections share the motion follow coefficient", () => {
  assert.equal(PILOT_CAMERA_FOLLOW, 0.55);
  assert.match(main, /PILOT_CAMERA_FOLLOW/);
  assert.doesNotMatch(main, /addScaledVector\(lastPilotOffset, 0\.15\)/);
  assert.doesNotMatch(main, /addScaledVector\(offset, -0\.15\)/);
});
