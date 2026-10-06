import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FlightMusic } from "../src/music.js";

async function videoMusicModule() {
  assert.ok(existsSync("src/video-music.js"), "video music loader exists");
  return import("../src/video-music.js");
}

test("the video soundtrack has an asynchronous loader", async () => {
  const { loadVideoMusic } = await videoMusicModule();
  assert.equal(typeof loadVideoMusic, "function");
});

function decodedAudio(overrides = {}) {
  const data = [
    new Float32Array([0, 0.125, -0.25, 0.5]),
    new Float32Array([0, -0.125, 0.25, -0.5]),
  ];
  return {
    length: data[0].length,
    sampleRate: 44100,
    duration: data[0].length / 44100,
    numberOfChannels: data.length,
    getChannelData: (index) => data[index],
    ...overrides,
  };
}

function soundtrackResponse() {
  return new Response(new Uint8Array([1, 2, 3, 4]), {
    headers: { "content-type": "audio/mp4" },
  });
}

test("the loader fetches the bundled source with its signal and preserves decoded stereo PCM", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const controller = new AbortController();
  const decoded = decodedAudio();
  const fetcher = t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  const context = {
    async decodeAudioData(bytes) {
      assert.equal(this, context, "decode uses the active audio context");
      assert.deepEqual(new Uint8Array(bytes), new Uint8Array([1, 2, 3, 4]));
      return decoded;
    },
  };

  const audio = await loadVideoMusic({ context, signal: controller.signal });

  assert.equal(fetcher.mock.calls.length, 1);
  const [url, options] = fetcher.mock.calls[0].arguments;
  assert.equal(url.href, new URL("../src/assets/reference-soundtrack.m4a", import.meta.url).href);
  assert.equal(options.signal, controller.signal);
  assert.equal(audio.sampleRate, decoded.sampleRate);
  assert.equal(audio.duration, decoded.duration);
  assert.equal(audio.channels.length, 2);
  assert.deepEqual(audio.channels[0], decoded.getChannelData(0));
  assert.deepEqual(audio.channels[1], decoded.getChannelData(1));
});

test("mono audio is duplicated for the stereo player", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const decoded = decodedAudio({ numberOfChannels: 1 });
  t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  const audio = await loadVideoMusic({
    context: { decodeAudioData: async () => decoded },
  });
  assert.equal(audio.channels.length, 2);
  assert.deepEqual(audio.channels[1], decoded.getChannelData(0));
});

test("an unsupported audio decoder is rejected before any network request", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const fetcher = t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  await assert.rejects(loadVideoMusic(), /audio decoding is not supported/i);
  await assert.rejects(loadVideoMusic({ context: {} }), /audio decoding is not supported/i);
  assert.equal(fetcher.mock.calls.length, 0);
});

test("HTTP failure is reported before audio decoding", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  t.mock.method(globalThis, "fetch", async () => new Response("not found", { status: 404 }));
  let decodes = 0;
  await assert.rejects(
    loadVideoMusic({ context: { async decodeAudioData() { decodes++; return decodedAudio(); } } }),
    /soundtrack.*404/i,
  );
  assert.equal(decodes, 0);
});

test("an empty soundtrack download is rejected before audio decoding", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  t.mock.method(globalThis, "fetch", async () => new Response(new ArrayBuffer(0)));
  let decodes = 0;
  await assert.rejects(
    loadVideoMusic({ context: { async decodeAudioData() { decodes++; return decodedAudio(); } } }),
    /empty/i,
  );
  assert.equal(decodes, 0);
});

for (const [name, decoded] of [
  ["missing buffer", null],
  ["nonfinite sample rate", decodedAudio({ sampleRate: NaN })],
  ["zero sample rate", decodedAudio({ sampleRate: 0 })],
  ["nonfinite duration", decodedAudio({ duration: Infinity })],
  ["zero duration", decodedAudio({ duration: 0 })],
  ["zero length", decodedAudio({ length: 0 })],
  ["fractional length", decodedAudio({ length: 1.5 })],
  ["no channels", decodedAudio({ numberOfChannels: 0 })],
  ["surround audio", decodedAudio({ numberOfChannels: 3 })],
  ["empty PCM", decodedAudio({ getChannelData: () => new Float32Array(0) })],
  ["non-PCM samples", decodedAudio({ getChannelData: () => [0, 0, 0, 0] })],
  ["NaN sample", decodedAudio({ getChannelData: () => new Float32Array([0, NaN, 0, 0]) })],
  ["infinite sample", decodedAudio({ getChannelData: () => new Float32Array([0, Infinity, 0, 0]) })],
]) {
  test(`the loader rejects decoded audio with ${name}`, async (t) => {
    const { loadVideoMusic } = await videoMusicModule();
    t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
    await assert.rejects(
      loadVideoMusic({ context: { decodeAudioData: async () => decoded } }),
      /invalid|unsupported/i,
    );
  });
}

test("network and decode errors reach the caller", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const offline = new Error("network unavailable");
  const fetcher = t.mock.method(globalThis, "fetch", async () => { throw offline; });
  const context = { decodeAudioData: async () => decodedAudio() };
  await assert.rejects(loadVideoMusic({ context }), (error) => error === offline);
  fetcher.mock.mockImplementation(async () => soundtrackResponse());
  const decodeError = new Error("unsupported codec");
  context.decodeAudioData = async () => { throw decodeError; };
  await assert.rejects(loadVideoMusic({ context }), (error) => error === decodeError);
});

function deferred() {
  let resolve;
  const promise = new Promise((finish) => { resolve = finish; });
  return { promise, resolve };
}

test("an already cancelled load never fetches the soundtrack", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const controller = new AbortController();
  controller.abort();
  const fetcher = t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  await assert.rejects(
    loadVideoMusic({ context: { decodeAudioData: async () => decodedAudio() }, signal: controller.signal }),
    { name: "AbortError" },
  );
  assert.equal(fetcher.mock.calls.length, 0);
});

test("cancellation during download prevents decoding", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const controller = new AbortController();
  const reading = deferred();
  const response = soundtrackResponse();
  t.mock.method(response, "arrayBuffer", async () => { reading.resolve(); controller.abort(); return new ArrayBuffer(4); });
  t.mock.method(globalThis, "fetch", async () => response);
  let decodes = 0;
  const loading = loadVideoMusic({
    context: { async decodeAudioData() { decodes++; return decodedAudio(); } },
    signal: controller.signal,
  });
  await reading.promise;
  await assert.rejects(loading, { name: "AbortError" });
  assert.equal(decodes, 0);
});

test("cancellation during non-abortable decoding rejects the late audio", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const controller = new AbortController();
  const decoding = deferred();
  const decoded = deferred();
  t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  const loading = loadVideoMusic({
    context: { decodeAudioData: () => { decoding.resolve(); return decoded.promise; } },
    signal: controller.signal,
  });
  await decoding.promise;
  controller.abort();
  decoded.resolve(decodedAudio());
  await assert.rejects(loading, { name: "AbortError" });
});

// Web Audio does not exist in Node. Only the device boundary is substituted;
// the loader, AbortController, Response and FlightMusic lifecycle are real.
function audioDevice(decode = async () => decodedAudio()) {
  return {
    state: "suspended",
    sampleRate: 48000,
    currentTime: 0,
    destination: {},
    sources: [],
    buffers: [],
    gains: [],
    decodeAudioData: decode,
    createBuffer(numberOfChannels, length, sampleRate) {
      const data = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
      const buffer = { numberOfChannels, length, sampleRate, duration: length / sampleRate, getChannelData: (index) => data[index] };
      this.buffers.push(buffer);
      return buffer;
    },
    createGain() {
      const node = {
        gain: { value: 1, setTargetAtTime(value) { this.value = value; } },
        connect() {},
        disconnect() {},
      };
      this.gains.push(node);
      return node;
    },
    createBufferSource() {
      const source = {
        buffer: null, loop: false, loopStart: 0, loopEnd: 0, starts: 0, stops: 0,
        connect() {},
        disconnect() {},
        start() { this.starts++; },
        stop() { this.stops++; },
      };
      this.sources.push(source);
      return source;
    },
    async resume() { if (this.state !== "closed") this.state = "running"; },
    async suspend() { if (this.state !== "closed") this.state = "suspended"; },
    async close() { this.state = "closed"; },
  };
}

test("FlightMusic injects its context into the real loader and fetches only on explicit enable", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const fetcher = t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  const decoded = decodedAudio();
  const context = audioDevice(async function () {
    assert.equal(this, context);
    return decoded;
  });
  let devices = 0;
  const music = new FlightMusic({
    renderer: loadVideoMusic,
    contextFactory: () => { devices++; return context; },
  });
  t.after(() => music.dispose());
  await music.setVolume(0.6);
  await music.setPlaying(false);
  await music.setPlaying(true);
  assert.equal(devices, 0);
  assert.equal(fetcher.mock.calls.length, 0);

  assert.equal(await music.toggle(), true);

  assert.equal(devices, 1);
  assert.equal(fetcher.mock.calls.length, 1);
  assert.equal(context.sources.length, 1);
  const [source] = context.sources;
  assert.equal(source.loop, true);
  assert.equal(source.loopEnd, decoded.duration);
  assert.equal(source.starts, 1);
  assert.equal(source.buffer.sampleRate, decoded.sampleRate, "the synthesized renderer's 22.05kHz limit is not imposed on the recording");
  assert.deepEqual(source.buffer.getChannelData(0), decoded.getChannelData(0));
  assert.deepEqual(source.buffer.getChannelData(1), decoded.getChannelData(1));
  assert.equal(context.gains[0].gain.value, 0.6);
  assert.equal(context.state, "running");
  await music.toggle();
  await music.toggle();
  assert.equal(fetcher.mock.calls.length, 1, "subsequent toggles reuse the decoded recording");
  assert.equal(context.sources.length, 1);
});

test("disabling while the real loader decodes stays muted and suspended after completion", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const decoding = deferred();
  const decoded = deferred();
  t.mock.method(globalThis, "fetch", async () => soundtrackResponse());
  const context = audioDevice(() => { decoding.resolve(); return decoded.promise; });
  const music = new FlightMusic({ renderer: loadVideoMusic, contextFactory: () => context });
  t.after(() => music.dispose());
  const enabling = music.toggle();
  await decoding.promise;
  assert.equal(context.gains[0].gain.value, 0);
  const disabling = music.toggle();
  await music.setPlaying(false);
  decoded.resolve(decodedAudio());

  assert.deepEqual(await Promise.all([enabling, disabling]), [false, false]);
  assert.equal(music.enabled, false);
  assert.equal(context.state, "suspended");
  assert.equal(context.gains[0].gain.value, 0);
  await music.setPlaying(true);
  assert.equal(context.state, "suspended");
  assert.equal(await music.toggle(), true);
  assert.equal(context.sources.length, 1);
});

for (const failure of ["fetch", "decode"]) {
  test(`a real loader ${failure} failure leaves FlightMusic disabled and releases its context`, async (t) => {
    const { loadVideoMusic } = await videoMusicModule();
    const expected = new Error(`${failure} failed`);
    t.mock.method(globalThis, "fetch", async () => {
      if (failure === "fetch") throw expected;
      return soundtrackResponse();
    });
    const context = audioDevice(async () => { throw expected; });
    const music = new FlightMusic({ renderer: loadVideoMusic, contextFactory: () => context });
    t.after(() => music.dispose());

    await assert.rejects(music.toggle(), (error) => error === expected);

    assert.equal(music.enabled, false);
    assert.equal(music.context, null);
    assert.equal(context.state, "closed");
    assert.equal(context.sources.length, 0);
    assert.equal(context.gains[0].gain.value, 0);
  });
}

test("disposing FlightMusic aborts the real loader's pending fetch", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  let fetchSignal;
  t.mock.method(globalThis, "fetch", (_url, { signal }) => {
    fetchSignal = signal;
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  });
  const context = audioDevice();
  const music = new FlightMusic({ renderer: loadVideoMusic, contextFactory: () => context });
  const pending = music.toggle();

  await music.dispose();

  assert.equal(fetchSignal.aborted, true);
  assert.equal(await pending, false);
  assert.equal(context.state, "closed");
  assert.equal(context.buffers.length, 0);
  assert.equal(context.sources.length, 0);
  assert.equal(await music.toggle(), false);
});

test("disposing FlightMusic discards the real loader's late decode without installing audio", async (t) => {
  const { loadVideoMusic } = await videoMusicModule();
  const decoding = deferred();
  const decoded = deferred();
  let fetchSignal;
  t.mock.method(globalThis, "fetch", async (_url, { signal }) => {
    fetchSignal = signal;
    return soundtrackResponse();
  });
  const context = audioDevice(() => { decoding.resolve(); return decoded.promise; });
  const music = new FlightMusic({ renderer: loadVideoMusic, contextFactory: () => context });
  const pending = music.toggle();
  await decoding.promise;

  await music.dispose();
  decoded.resolve(decodedAudio());

  assert.equal(fetchSignal.aborted, true);
  assert.equal(await pending, false);
  assert.equal(music.enabled, false);
  assert.equal(context.state, "closed");
  assert.equal(context.buffers.length, 0);
  assert.equal(context.sources.length, 0);
  assert.equal(await music.toggle(), false);
});
