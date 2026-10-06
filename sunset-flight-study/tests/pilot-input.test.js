import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

async function setup() {
  assert.ok(
    existsSync("src/pilot-input.js"),
    "keyboard pilot input is implemented",
  );
  const { bindPilotInput } = await import("../src/pilot-input.js");
  const document = new EventTarget();
  const window = new EventTarget();
  document.hidden = false;
  let allowed = true;
  let resets = 0;
  const changes = [];
  const input = bindPilotInput(document, window, {
    canControl: () => allowed,
    onReset: () => resets++,
    onChange: (axes) => changes.push(axes),
  });
  function key(code, type = "keydown", extra = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { code, repeat: false, ...extra });
    document.dispatchEvent(event);
    return event;
  }
  return {
    input,
    document,
    window,
    key,
    changes,
    allow: (value) => (allowed = value),
    resets: () => resets,
  };
}

test("WASD and arrows provide held directional axes and keyup releases them", async () => {
  const { input, key } = await setup();
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  assert.equal(key("KeyW").defaultPrevented, true);
  key("ArrowRight");
  assert.deepEqual(input.axes(), { x: 1, y: 1 });
  key("KeyW", "keyup");
  key("ArrowRight", "keyup");
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  key("KeyA");
  key("KeyS");
  assert.deepEqual(input.axes(), { x: -1, y: -1 });
});

test("aliases, repeated keydowns and opposite keys do not produce sticky or doubled axes", async () => {
  const { input, key, changes } = await setup();
  key("KeyD");
  key("KeyD", "keydown", { repeat: true });
  key("ArrowRight");
  key("KeyD", "keyup");
  assert.deepEqual(input.axes(), { x: 1, y: 0 });
  key("ArrowLeft");
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  key("ArrowRight", "keyup");
  assert.deepEqual(input.axes(), { x: -1, y: 0 });
  assert.ok(changes.length > 0);
});

test("paused/unavailable application and modified shortcuts cannot steer", async () => {
  const { input, key, allow } = await setup();
  for (const modifier of ["ctrlKey", "altKey", "metaKey"]) {
    assert.equal(
      key("KeyW", "keydown", { [modifier]: true }).defaultPrevented,
      false,
    );
  }
  allow(false);
  assert.equal(key("ArrowUp").defaultPrevented, false);
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  assert.equal(key("KeyP").defaultPrevented, false);
});

test("native sliders, editable descendants and modal input retain keys", async () => {
  const { input, document } = await setup();
  for (const selector of [
    "input",
    "textarea",
    "select",
    "[contenteditable]",
    "dialog[open]",
  ]) {
    const event = new Event("keydown", { cancelable: true });
    Object.assign(event, { code: "ArrowUp" });
    Object.defineProperty(event, "target", {
      value: { closest: (s) => (s.includes(selector) ? {} : null) },
    });
    document.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false, selector);
    assert.deepEqual(input.axes(), { x: 0, y: 0 });
  }
});

test("keyup releases keys even after control eligibility changes", async () => {
  const { input, key, allow } = await setup();
  key("KeyW");
  allow(false);
  key("KeyW", "keyup", { ctrlKey: true });
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
});

test("blur, visibility loss, pagehide and editable focus clear held keys", async () => {
  const { input, key, document, window } = await setup();
  for (const type of ["blur", "pagehide"]) {
    key("KeyA");
    window.dispatchEvent(new Event(type));
    assert.deepEqual(input.axes(), { x: 0, y: 0 });
  }
  key("KeyW");
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  document.hidden = false;
  key("KeyD");
  const focus = new Event("focusin");
  Object.defineProperty(focus, "target", { value: { closest: () => ({}) } });
  document.dispatchEvent(focus);
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
});

test("G resets once, clears held inputs, and dispose removes listeners idempotently", async () => {
  const { input, key, resets } = await setup();
  key("KeyW");
  key("KeyG");
  key("KeyG", "keydown", { repeat: true });
  assert.equal(resets(), 1);
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  input.dispose();
  input.dispose();
  key("KeyW");
  key("KeyG");
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  assert.equal(resets(), 1);
});

test("a press released between render frames still reaches the next input sample", async () => {
  const { input, key } = await setup();
  key("ArrowRight");
  key("ArrowRight", "keyup");
  assert.deepEqual(input.axes(), { x: 0, y: 0 }, "UI stays instantaneous");
  // The fallback reproduces the original frame loop's held-only sampling.
  const sample = input.sample?.(1 / 60) ?? input.axes();
  assert.deepEqual(sample, { x: 1, y: 0 }, "a complete inter-frame tap is retained");
});

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${message}: ${actual} vs ${expected}`);
}

test("released taps have exactly 75ms integrated input at 30, 60 and 120fps", async () => {
  for (const fps of [30, 60, 120]) {
    const { input, key } = await setup();
    key("KeyW");
    key("KeyW", "keyup");
    let integrated = 0;
    for (let frame = 0; frame < fps; frame++) {
      const { x, y } = input.sample(1 / fps);
      assert.equal(x, 0);
      assert.ok(y >= 0 && y <= 1);
      integrated += y / fps;
    }
    near(integrated, 0.075, `${fps}fps tap duration`);
    assert.deepEqual(input.sample(1 / fps), { x: 0, y: 0 });
  }
});

test("fractional final frames preserve the tap budget with irregular and capped dt", async () => {
  const { input, key } = await setup();
  key("KeyA");
  key("KeyA", "keyup");
  assert.deepEqual(input.sample(0.02), { x: -1, y: 0 });
  near(input.sample(0.08).x, -0.055 / 0.08, "remaining time is weighted");
  assert.deepEqual(input.sample(0.01), { x: 0, y: 0 });
  key("KeyS");
  key("KeyS", "keyup");
  near(input.sample(2).y, -0.75, "dt is capped at the motion limit of 0.1s");
  assert.deepEqual(input.sample(0.01), { x: 0, y: 0 });
});

test("invalid or nonpositive sample times do not consume pending tap credit", async () => {
  const { input, key } = await setup();
  key("KeyD");
  key("KeyD", "keyup");
  for (const dt of [0, -1, NaN, Infinity, -Infinity, undefined]) {
    assert.deepEqual(input.sample(dt), { x: 0, y: 0 });
  }
  near(input.sample(0.1).x, 0.75, "all credit remains after invalid samples");
});

test("held input stays full-strength and consumes credit so long holds have no tail", async () => {
  const { input, key } = await setup();
  key("KeyD");
  for (let frame = 0; frame < 20; frame++) {
    assert.deepEqual(input.sample(0.02), { x: 1, y: 0 });
  }
  key("KeyD", "keyup");
  assert.deepEqual(input.sample(0.02), { x: 0, y: 0 });
  key("KeyD");
  assert.deepEqual(input.sample(0.05), { x: 1, y: 0 });
  key("KeyD", "keyup");
  near(input.sample(0.05).x, 0.5, "short held time counts toward the same 75ms minimum");
  assert.deepEqual(input.sample(0.05), { x: 0, y: 0 });
});

test("alias and repeated keydowns cannot refresh an already held direction's credit", async () => {
  const { input, key } = await setup();
  key("KeyD");
  input.sample(0.05);
  key("KeyD", "keydown", { repeat: true });
  key("KeyD");
  key("ArrowRight");
  key("KeyD", "keyup");
  assert.deepEqual(input.axes(), { x: 1, y: 0 });
  key("ArrowRight", "keyup");
  near(input.sample(0.05).x, 0.5, "aliases share the original remaining credit");
  assert.deepEqual(input.sample(0.05), { x: 0, y: 0 });
});

test("opposite pending directions cancel without leaving an unconsumed backlog", async () => {
  const { input, key } = await setup();
  for (const code of ["KeyA", "KeyD", "KeyW", "KeyS"]) {
    key(code);
    key(code, "keyup");
  }
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  key("KeyA");
  key("KeyD");
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  key("KeyA", "keyup");
  assert.deepEqual(input.sample(0.01), { x: 1, y: 0 });
  key("KeyD", "keyup");
  assert.deepEqual(input.sample(0.01), { x: 0, y: 0 });
});

test("rapid inter-frame taps saturate at one credit while later presses can engage again", async () => {
  const { input, key } = await setup();
  for (let tap = 0; tap < 40; tap++) {
    key(tap % 2 ? "KeyD" : "ArrowRight");
    key(tap % 2 ? "KeyD" : "ArrowRight", "keyup");
  }
  near(input.sample(0.1).x, 0.75, "rapid taps do not queue a long steering tail");
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  key("KeyD");
  key("KeyD", "keyup");
  near(input.sample(0.1).x, 0.75, "a new press after consumption gets a fresh minimum");
});

for (const cancellation of [
  "clear", "pause", "blur", "pagehide", "visibility", "G", "dispose", "native-focus",
]) {
  test(`${cancellation} cancels pending taps as well as held directions`, async () => {
    const context = await setup();
    const { input, key, document, window, allow } = context;
    key("KeyD");
    key("KeyD", "keyup");
    key("KeyW");
    if (cancellation === "clear") input.clear();
    else if (cancellation === "pause") {
      allow(false);
      assert.deepEqual(input.sample(0.01), { x: 0, y: 0 });
      allow(true);
    } else if (cancellation === "blur" || cancellation === "pagehide") {
      window.dispatchEvent(new Event(cancellation));
    } else if (cancellation === "visibility") {
      document.hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
      document.hidden = false;
    } else if (cancellation === "G") key("KeyG");
    else if (cancellation === "dispose") input.dispose();
    else {
      const event = new Event("focusin");
      Object.defineProperty(event, "target", { value: { closest: () => ({}) } });
      document.dispatchEvent(event);
    }
    assert.deepEqual(input.axes(), { x: 0, y: 0 });
    assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  });
}

test("clearing a released-only tap does not depend on any keys remaining held", async () => {
  const { input, key } = await setup();
  key("KeyA");
  key("KeyA", "keyup");
  input.clear();
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
});

test("a held key's OS repeat cannot re-arm input after cancellation", async () => {
  const { input, key } = await setup();
  key("KeyW");
  input.clear();
  assert.equal(key("KeyW", "keydown", { repeat: true }).defaultPrevented, false);
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
});

test("native keyboard owners cancel pending control even without a focus event", async () => {
  for (const selector of ["input", "textarea", "select", "[contenteditable]", "dialog[open]"]) {
    const { input, key, document, resets } = await setup();
    key("KeyD");
    key("KeyD", "keyup");
    key("KeyW");
    for (const code of ["ArrowUp", "KeyG"]) {
      const event = new Event("keydown", { cancelable: true });
      Object.assign(event, { code });
      Object.defineProperty(event, "target", {
        value: { closest: (s) => (s.includes(selector) ? {} : null) },
      });
      document.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false, selector);
    }
    assert.equal(resets(), 0, selector);
    assert.deepEqual(input.axes(), { x: 0, y: 0 }, selector);
    assert.deepEqual(input.sample(0.1), { x: 0, y: 0 }, selector);
  }
});

test("Chinese IME key events are not prevented, steered or treated as G reset", async () => {
  for (const composing of [{ isComposing: true }, { keyCode: 229 }]) {
    const { input, key, resets } = await setup();
    key("KeyD");
    key("KeyD", "keyup");
    key("KeyW");
    assert.equal(key("ArrowUp", "keydown", composing).defaultPrevented, false);
    assert.equal(key("KeyG", "keydown", composing).defaultPrevented, false);
    assert.equal(resets(), 0);
    assert.deepEqual(input.axes(), { x: 0, y: 0 });
    assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  }
});

test("compositionstart immediately cancels previously accepted steering", async () => {
  const { input, key, document } = await setup();
  key("KeyD");
  key("KeyD", "keyup");
  key("KeyW");
  document.dispatchEvent(new Event("compositionstart"));
  assert.deepEqual(input.axes(), { x: 0, y: 0 });
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
});

test("a release while paused discards all credit before control resumes", async () => {
  const { input, key, allow } = await setup();
  key("KeyW");
  key("KeyD");
  key("KeyD", "keyup");
  allow(false);
  key("KeyW", "keyup");
  allow(true);
  assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
});

test("IME keyup cannot leave a pending input impulse behind", async () => {
  for (const composing of [{ isComposing: true }, { keyCode: 229 }]) {
    const { input, key } = await setup();
    key("KeyD");
    key("KeyD", "keyup");
    key("KeyW");
    assert.equal(key("KeyW", "keyup", composing).defaultPrevented, false);
    assert.deepEqual(input.axes(), { x: 0, y: 0 });
    assert.deepEqual(input.sample(0.1), { x: 0, y: 0 });
  }
});
