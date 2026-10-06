import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

async function musicModule() {
  assert.ok(
    existsSync("src/music.js"),
    "the original flight music module exists",
  );
  return import("../src/music.js");
}

test("the composition is an original 16-bar, 80 BPM instrumental loop", async () => {
  const { composeFlightMusic } = await musicModule();
  const composition = composeFlightMusic();
  assert.equal(composition.tempo, 80);
  assert.equal(composition.bars, 16);
  assert.equal(composition.beatsPerBar, 4);
  assert.equal(composition.duration, 48);
  assert.ok(
    composition.notes.filter((note) => note.voice === "key").length >= 40,
  );
  assert.ok(
    composition.notes.filter((note) => note.voice === "pad").length >= 48,
  );
  assert.ok(new Set(composition.notes.map((note) => note.midi)).size >= 12);
  for (const note of composition.notes) {
    assert.ok(note.start >= 0 && note.start < composition.duration);
    assert.ok(note.duration > 0 && note.duration < 5);
    assert.ok(note.velocity > 0 && note.velocity <= 1);
  }
  assert.deepEqual(
    composeFlightMusic(),
    composition,
    "composition is deterministic",
  );
});

test("the rendered stereo PCM is musical, finite, non-clipping and seamless", async () => {
  const { renderFlightMusic } = await musicModule();
  const audio = renderFlightMusic({ sampleRate: 8000 });
  assert.equal(audio.sampleRate, 8000);
  assert.equal(audio.duration, 48);
  assert.equal(audio.channels.length, 2);
  let stereoDifference = 0;
  for (const channel of audio.channels) {
    assert.equal(channel.length, 48 * 8000);
    let peak = 0;
    let energy = 0;
    let maximumStep = 0;
    for (let index = 0; index < channel.length; index++) {
      assert.ok(Number.isFinite(channel[index]));
      peak = Math.max(peak, Math.abs(channel[index]));
      energy += channel[index] ** 2;
      if (index)
        maximumStep = Math.max(
          maximumStep,
          Math.abs(channel[index] - channel[index - 1]),
        );
    }
    assert.ok(peak > 0.15 && peak <= 0.72, `headroom is preserved: ${peak}`);
    assert.ok(
      Math.sqrt(energy / channel.length) > 0.025,
      "not an empty or near-silent track",
    );
    const seam = Math.abs(channel[0] - channel.at(-1));
    assert.ok(
      seam < 0.03 && seam <= maximumStep,
      `loop seam has no transient: ${seam}`,
    );
  }
  for (let index = 0; index < audio.channels[0].length; index++) {
    stereoDifference += Math.abs(
      audio.channels[0][index] - audio.channels[1][index],
    );
  }
  assert.ok(
    stereoDifference / audio.channels[0].length > 0.005,
    "a gentle stereo image is rendered",
  );
});

// Node has no native Web Audio device. This boundary double models the clock,
// states, promises and resources; composition and PCM rendering remain real.
function audioDevice({ resume, suspend } = {}) {
  const context = {
    state: "suspended",
    sampleRate: 8000,
    currentTime: 0,
    destination: {},
    sources: [],
    gains: [],
    buffers: [],
    closes: 0,
    resumes: 0,
    suspends: 0,
    createBuffer(channels, length, sampleRate) {
      const data = Array.from(
        { length: channels },
        () => new Float32Array(length),
      );
      const buffer = {
        length,
        sampleRate,
        duration: length / sampleRate,
        numberOfChannels: channels,
        getChannelData: (index) => data[index],
      };
      this.buffers.push(buffer);
      return buffer;
    },
    createGain() {
      const node = {
        gain: {
          value: 1,
          setTargetAtTime(value) {
            this.value = value;
          },
          cancelScheduledValues() {},
          setValueAtTime(value) {
            this.value = value;
          },
        },
        connected: false,
        connect() {
          this.connected = true;
        },
        disconnect() {
          this.connected = false;
        },
      };
      this.gains.push(node);
      return node;
    },
    createBufferSource() {
      const source = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        starts: 0,
        stops: 0,
        connected: false,
        connect() {
          this.connected = true;
        },
        disconnect() {
          this.connected = false;
        },
        start() {
          this.starts++;
        },
        stop() {
          this.stops++;
        },
      };
      this.sources.push(source);
      return source;
    },
    async resume() {
      this.resumes++;
      if (resume) await resume(this);
      if (this.state !== "closed") this.state = "running";
    },
    async suspend() {
      this.suspends++;
      if (suspend) await suspend(this);
      if (this.state !== "closed") this.state = "suspended";
    },
    async close() {
      this.closes++;
      this.state = "closed";
    },
    advance(seconds) {
      if (this.state === "running") this.currentTime += seconds;
    },
  };
  return context;
}

async function player(options) {
  const { FlightMusic } = await musicModule();
  assert.equal(
    typeof FlightMusic,
    "function",
    "FlightMusic lifecycle API is exported",
  );
  return new FlightMusic(options);
}

test("music is Node-safe, silent and lazy until the explicit toggle", async () => {
  let creations = 0;
  const context = audioDevice();
  const music = await player({
    contextFactory: () => {
      creations++;
      return context;
    },
  });
  assert.equal(music.enabled, false);
  assert.equal(music.volume, 0.35);
  music.setVolume(0.5);
  await music.setPlaying(false);
  await music.setPlaying(true);
  assert.equal(creations, 0);
  assert.equal(await music.toggle(), true);
  assert.equal(creations, 1);
  assert.equal(context.state, "running");
  assert.equal(context.sources.length, 1);
  assert.equal(context.sources[0].loop, true);
  assert.equal(context.sources[0].starts, 1);
  assert.equal(context.sources[0].buffer.duration, 48);
  assert.equal(context.sources[0].buffer.numberOfChannels, 2);
  assert.equal(context.gains[0].gain.value, 0.5);
  await music.dispose();
});

test("pausing or disabling preserves position and reuses one loop source", async () => {
  const context = audioDevice();
  const music = await player({ contextFactory: () => context });
  await music.toggle();
  context.advance(5);
  await music.setPlaying(false);
  context.advance(20);
  assert.equal(context.currentTime, 5);
  assert.equal(context.state, "suspended");
  assert.equal(music.enabled, true, "pausing preserves music preference");
  await music.setPlaying(true);
  context.advance(2);
  assert.equal(context.currentTime, 7);
  assert.equal(await music.toggle(), false);
  context.advance(10);
  assert.equal(context.currentTime, 7);
  assert.equal(await music.toggle(), true);
  assert.equal(context.sources.length, 1);
  assert.equal(context.buffers.length, 1);
  assert.equal(context.sources[0].starts, 1);
  await music.dispose();
});

test("volume is clamped and zero volume suspends audio without losing its preference", async () => {
  const context = audioDevice();
  const music = await player({ contextFactory: () => context });
  music.setVolume(2);
  assert.equal(music.volume, 1);
  music.setVolume(NaN);
  assert.equal(music.volume, 1);
  await music.toggle();
  await music.setVolume(-1);
  assert.equal(music.volume, 0);
  assert.equal(context.state, "suspended");
  assert.equal(music.enabled, true);
  await music.setVolume(0.4);
  assert.equal(context.state, "running");
  assert.equal(context.gains[0].gain.value, 0.4);
  await music.dispose();
});

test("enabling while flight is paused stays silent until playback resumes", async () => {
  const context = audioDevice();
  const music = await player({ contextFactory: () => context });
  await music.setPlaying(false);
  assert.equal(await music.toggle(), true);
  assert.equal(context.state, "suspended");
  assert.equal(
    context.resumes,
    1,
    "the click unlocks audio before the paused state is restored",
  );
  assert.equal(context.gains[0].gain.value, 0);
  await music.setPlaying(true);
  assert.equal(context.state, "running");
  await music.dispose();
});

test("unsupported audio and rejected resume do not leave music falsely enabled", async () => {
  const unsupported = await player({ contextFactory: () => null });
  await assert.rejects(unsupported.toggle(), /not supported/i);
  assert.equal(unsupported.enabled, false);
  await unsupported.dispose();
  let rejected = true;
  const context = audioDevice({
    resume: async () => {
      if (rejected) throw new Error("gesture refused");
    },
  });
  const music = await player({ contextFactory: () => context });
  await assert.rejects(music.toggle(), /gesture refused/);
  assert.equal(music.enabled, false);
  assert.equal(context.state, "suspended");
  assert.equal(context.gains[0].gain.value, 0);
  rejected = false;
  assert.equal(await music.toggle(), true, "a later user gesture can retry");
  await music.dispose();
});

test("rapid toggles and pause reconcile to the latest intent after an in-flight resume", async () => {
  let finishResume;
  const context = audioDevice({
    resume: () =>
      new Promise((resolve) => {
        finishResume = resolve;
      }),
  });
  const music = await player({ contextFactory: () => context });
  const on = music.toggle();
  assert.equal(
    typeof finishResume,
    "function",
    "resume is called inside the user gesture",
  );
  const off = music.toggle();
  const pause = music.setPlaying(false);
  finishResume();
  assert.deepEqual(await Promise.all([on, off]), [false, false]);
  await pause;
  assert.equal(music.enabled, false);
  assert.equal(context.state, "suspended");
  assert.equal(context.gains[0].gain.value, 0);
  await music.dispose();
});

test("dispose during pending resume stops and closes once, and cannot be revived", async () => {
  let finishResume;
  const context = audioDevice({
    resume: () =>
      new Promise((resolve) => {
        finishResume = resolve;
      }),
  });
  let creations = 0;
  const music = await player({
    contextFactory: () => {
      creations++;
      return context;
    },
  });
  const pending = music.toggle();
  await music.dispose();
  await music.dispose();
  finishResume();
  assert.equal(await pending, false);
  await music.setPlaying(true);
  await music.setVolume(0.8);
  assert.equal(await music.toggle(), false);
  assert.equal(music.enabled, false);
  assert.equal(context.state, "closed");
  assert.equal(context.closes, 1);
  assert.equal(context.sources[0].stops, 1);
  assert.equal(context.sources[0].connected, false);
  assert.equal(context.gains[0].connected, false);
  assert.equal(creations, 1);
});

test("a failed automatic resume is safely handled even when its promise is ignored", async () => {
  let rejected = false;
  const context = audioDevice({
    resume: async () => {
      if (rejected) throw new Error("resume denied");
    },
  });
  const music = await player({ contextFactory: () => context });
  await music.toggle();
  await music.setPlaying(false);
  rejected = true;
  await assert.doesNotReject(music.setPlaying(true));
  assert.equal(music.enabled, false);
  assert.equal(context.state, "suspended");
  await music.dispose();
});

test("an enable arriving while failed-resume cleanup is pending is not overwritten", async () => {
  let failResume = true;
  let finishCleanup;
  const context = audioDevice({
    resume: async () => {
      if (failResume) throw new Error("first gesture refused");
    },
    suspend: () =>
      new Promise((resolve) => {
        finishCleanup = resolve;
      }),
  });
  const music = await player({ contextFactory: () => context });
  const first = music.toggle();
  // Flush the rejected browser promise into the cleanup await, without timers.
  for (let index = 0; index < 6; index++) await Promise.resolve();
  assert.equal(typeof finishCleanup, "function");
  assert.equal(music.enabled, false);
  failResume = false;
  const retry = music.toggle();
  finishCleanup();
  const results = await Promise.allSettled([first, retry]);
  assert.equal(results[1].status, "fulfilled");
  assert.equal(results[1].value, true);
  assert.equal(music.enabled, true);
  assert.equal(context.state, "running");
  await music.dispose();
});

test("enable during a pending suspension resumes the same source at the same position", async () => {
  let finishSuspend;
  const context = audioDevice({
    suspend: () =>
      new Promise((resolve) => {
        finishSuspend = resolve;
      }),
  });
  const music = await player({ contextFactory: () => context });
  await music.toggle();
  context.advance(12);
  const off = music.toggle();
  const on = music.toggle();
  finishSuspend();
  assert.deepEqual(await Promise.all([off, on]), [true, true]);
  assert.equal(context.state, "running");
  assert.equal(context.currentTime, 12);
  assert.equal(context.sources.length, 1);
  await music.dispose();
});

test("a pause in the resume promise-completion microtask is not dropped", async () => {
  const context = audioDevice();
  const music = await player({ contextFactory: () => context });
  const enabling = music.toggle();
  const pause = Promise.resolve().then(() => music.setPlaying(false));
  await Promise.all([enabling, pause]);
  assert.equal(music.enabled, true);
  assert.equal(context.state, "suspended");
  await music.dispose();
});

function tinyRenderedLoop() {
  return {
    sampleRate: 8000,
    duration: 48,
    channels: [new Float32Array(48 * 8000), new Float32Array(48 * 8000)],
  };
}

test("async rendering unlocks audio in the click but stays silent until the worker completes", async () => {
  let finishRendering;
  const context = audioDevice();
  const music = await player({
    contextFactory: () => context,
    renderer: () =>
      new Promise((resolve) => {
        finishRendering = resolve;
      }),
  });
  const pending = music.toggle();
  assert.equal(
    context.resumes,
    1,
    "resume happens synchronously in the gesture",
  );
  assert.equal(
    context.sources.length,
    0,
    "no synchronous PCM generation or source",
  );
  assert.equal(context.gains[0].gain.value, 0);
  finishRendering(tinyRenderedLoop());
  assert.equal(await pending, true);
  assert.equal(context.sources.length, 1);
  assert.equal(context.gains[0].gain.value, 0.35);
  await music.dispose();
});

test("disable and pause during worker rendering remain silent after the result arrives", async () => {
  let finishRendering;
  const context = audioDevice();
  const music = await player({
    contextFactory: () => context,
    renderer: () =>
      new Promise((resolve) => {
        finishRendering = resolve;
      }),
  });
  const enabling = music.toggle();
  const disabling = music.toggle();
  await music.setPlaying(false);
  assert.equal(context.state, "suspended");
  assert.equal(
    typeof finishRendering,
    "function",
    "the asynchronous renderer is used",
  );
  finishRendering(tinyRenderedLoop());
  assert.deepEqual(await Promise.all([enabling, disabling]), [false, false]);
  assert.equal(context.gains[0].gain.value, 0);
  assert.equal(context.state, "suspended");
  await music.setPlaying(true);
  assert.equal(
    context.state,
    "suspended",
    "play does not change the disabled preference",
  );
  assert.equal(await music.toggle(), true);
  assert.equal(context.sources.length, 1);
  await music.dispose();
});

test("dispose aborts pending rendering and ignores a late worker result", async () => {
  let finishRendering;
  let renderSignal;
  const context = audioDevice();
  const music = await player({
    contextFactory: () => context,
    renderer: ({ signal }) => {
      renderSignal = signal;
      return new Promise((resolve) => {
        finishRendering = resolve;
      });
    },
  });
  const pending = music.toggle();
  await music.dispose();
  assert.ok(renderSignal, "renderer receives a cancellation signal");
  assert.equal(renderSignal.aborted, true);
  finishRendering(tinyRenderedLoop());
  assert.equal(await pending, false);
  assert.equal(context.sources.length, 0);
  assert.equal(context.buffers.length, 0);
  assert.equal(context.state, "closed");
  assert.equal(await music.toggle(), false);
});

test("worker rendering failure is visible to the click handler and releases audio", async () => {
  const context = audioDevice();
  let renderSignal;
  const music = await player({
    contextFactory: () => context,
    renderer: ({ signal }) => {
      renderSignal = signal;
      return Promise.reject(new Error("Music worker failed to load"));
    },
  });
  await assert.rejects(music.toggle(), /worker failed to load/);
  assert.equal(music.enabled, false);
  assert.equal(context.state, "closed");
  assert.equal(renderSignal.aborted, true);
  assert.equal(context.sources.length, 0);
  await music.dispose();
});

test("browser runtime delegates to a module worker and terminates it after transfer or disposal", async () => {
  const originalWorker = globalThis.Worker;
  const workers = [];
  globalThis.Worker = class {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.terminated = 0;
      workers.push(this);
    }
    postMessage(message) {
      this.request = message;
    }
    terminate() {
      this.terminated++;
    }
  };
  try {
    const context = audioDevice();
    const music = await player({ contextFactory: () => context });
    const pending = music.toggle();
    assert.equal(
      workers.length,
      1,
      "runtime creates a worker instead of rendering on the main thread",
    );
    assert.equal(workers[0].options.type, "module");
    assert.ok(workers[0].url.pathname.endsWith("/music-worker.js"));
    assert.equal(context.sources.length, 0);
    workers[0].onmessage({ data: tinyRenderedLoop() });
    assert.equal(await pending, true);
    assert.equal(workers[0].terminated, 1);
    await music.dispose();
    const next = await player({ contextFactory: () => audioDevice() });
    const nextPending = next.toggle();
    await next.dispose();
    assert.equal(await nextPending, false);
    assert.equal(
      workers[1].terminated,
      1,
      "disposal cancels the pending worker",
    );
  } finally {
    if (originalWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = originalWorker;
  }
});
