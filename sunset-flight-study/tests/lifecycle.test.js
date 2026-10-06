import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

function pageEvent(type, persisted) {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", { value: persisted });
  return event;
}

test("back-forward cache suspends and resumes without destroying WebGL resources", async () => {
  assert.ok(existsSync("src/lifecycle.js"), "page lifecycle is implemented");
  const { bindSceneLifecycle } = await import("../src/lifecycle.js");
  const target = new EventTarget();
  const actions = [];
  bindSceneLifecycle(target, {
    suspend: () => actions.push("suspend"),
    resume: () => actions.push("resume"),
    dispose: () => actions.push("dispose"),
  });
  target.dispatchEvent(pageEvent("pagehide", true));
  target.dispatchEvent(pageEvent("pageshow", true));
  assert.deepEqual(actions, ["suspend", "resume"]);
});

test("actual unload disposes once and cannot revive a destroyed scene", async () => {
  assert.ok(existsSync("src/lifecycle.js"), "page lifecycle is implemented");
  const { bindSceneLifecycle } = await import("../src/lifecycle.js");
  const target = new EventTarget();
  const actions = [];
  bindSceneLifecycle(target, {
    suspend: () => actions.push("suspend"),
    resume: () => actions.push("resume"),
    dispose: () => actions.push("dispose"),
  });
  target.dispatchEvent(pageEvent("pagehide", false));
  target.dispatchEvent(pageEvent("pagehide", false));
  target.dispatchEvent(pageEvent("pageshow", true));
  assert.deepEqual(actions, ["dispose"]);
});
