import test from "node:test";
import assert from "node:assert/strict";
import { createRenderLoop } from "../src/scene/renderLoop.ts";

function fakeAnimationFrames() {
  let nextId = 0;
  const pending = new Map<number, (time: number) => void>();
  return {
    requestFrame(callback: (time: number) => void) {
      const id = ++nextId;
      pending.set(id, callback);
      return id;
    },
    cancelFrame(id: number) {
      pending.delete(id);
    },
    step(time: number) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(time);
    },
    get pendingCount() {
      return pending.size;
    },
  };
}

test("an idle scene has no pending frames and invalidation coalesces into one draw", () => {
  const frames = fakeAnimationFrames();
  const rendered: number[] = [];
  const loop = createRenderLoop((time) => {
    rendered.push(time);
    return false;
  }, frames);

  assert.equal(frames.pendingCount, 0);
  loop.invalidate();
  loop.invalidate();
  loop.invalidate();
  assert.equal(frames.pendingCount, 1);
  frames.step(0);
  assert.deepEqual(rendered, [0]);
  assert.equal(frames.pendingCount, 0);

  frames.step(1000);
  assert.deepEqual(rendered, [0]);
  loop.invalidate();
  frames.step(1100);
  assert.deepEqual(rendered, [0, 1100]);
  assert.equal(frames.pendingCount, 0);
});

test("continuous animation limits expensive draws to 30 FPS and clamps elapsed time", () => {
  const frames = fakeAnimationFrames();
  const rendered: { time: number; dt: number }[] = [];
  let animating = true;
  const loop = createRenderLoop((time, dt) => {
    rendered.push({ time, dt });
    return animating;
  }, frames);

  loop.invalidate();
  for (let index = 0; index <= 120; index++) frames.step(index * 1000 / 120);
  assert.equal(rendered.length, 31);
  assert.equal(rendered[0].dt, 1 / 30);
  assert.equal(frames.pendingCount, 1);
  for (let index = 1; index < rendered.length; index++) {
    assert.ok(rendered[index].time - rendered[index - 1].time >= 1000 / 30 - 0.1);
  }

  animating = false;
  frames.step(3000);
  assert.equal(rendered.at(-1)?.dt, 0.05);
  assert.equal(frames.pendingCount, 0);
});

test("a custom frame rate and rapid external invalidations both respect the render limit", () => {
  const frames = fakeAnimationFrames();
  const rendered: number[] = [];
  const loop = createRenderLoop((time) => {
    rendered.push(time);
    return false;
  }, { ...frames, maxFps: 20 });

  for (let time = 0; time <= 200; time += 10) {
    loop.invalidate();
    frames.step(time);
    assert.ok(frames.pendingCount <= 1);
  }
  assert.deepEqual(rendered, [0, 50, 100, 150, 200]);
  assert.equal(frames.pendingCount, 0);
});

test("pausing cancels animation and resuming requests a fresh frame without a large time step", () => {
  const frames = fakeAnimationFrames();
  const deltas: number[] = [];
  const loop = createRenderLoop((_time, dt) => {
    deltas.push(dt);
    return true;
  }, frames);

  loop.invalidate();
  frames.step(100);
  assert.equal(frames.pendingCount, 1);
  loop.setActive(false);
  loop.invalidate();
  assert.equal(frames.pendingCount, 0);
  frames.step(10000);
  assert.equal(deltas.length, 1);

  loop.setActive(true);
  loop.setActive(true);
  assert.equal(frames.pendingCount, 1);
  frames.step(20000);
  assert.deepEqual(deltas, [1 / 30, 1 / 30]);
  loop.dispose();
});

test("disposing cancels pending frames and permanently prevents wake-up", () => {
  const frames = fakeAnimationFrames();
  let renders = 0;
  const loop = createRenderLoop(() => {
    renders++;
    return true;
  }, frames);

  loop.invalidate();
  assert.equal(frames.pendingCount, 1);
  loop.dispose();
  loop.dispose();
  loop.setActive(false);
  loop.setActive(true);
  loop.invalidate();
  frames.step(0);
  assert.equal(frames.pendingCount, 0);
  assert.equal(renders, 0);
});

test("synchronous control changes during a draw do not perpetuate an idle render loop", () => {
  const frames = fakeAnimationFrames();
  let renders = 0;
  const loop = createRenderLoop(() => {
    renders++;
    loop.invalidate();
    loop.invalidate();
    return false;
  }, frames);

  loop.invalidate();
  frames.step(0);
  assert.equal(renders, 1);
  assert.equal(frames.pendingCount, 0);
  loop.invalidate();
  frames.step(100);
  assert.equal(renders, 2);
  assert.equal(frames.pendingCount, 0);
});

test("a control change during active animation still schedules only one continuation", () => {
  const frames = fakeAnimationFrames();
  const loop = createRenderLoop(() => {
    loop.invalidate();
    return true;
  }, frames);

  loop.invalidate();
  frames.step(0);
  assert.equal(frames.pendingCount, 1);
  frames.step(40);
  assert.equal(frames.pendingCount, 1);
  loop.dispose();
  assert.equal(frames.pendingCount, 0);
});
