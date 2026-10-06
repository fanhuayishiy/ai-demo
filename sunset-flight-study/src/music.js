/** Original sunset miniature: soft struck keys and a warm, slowly breathing pad.
 * All audio is synthesized locally; there are no recordings or third-party songs.
 */
export function composeFlightMusic() {
  const tempo = 80;
  const beat = 60 / tempo;
  const chords = [
    [48, 55, 59, 64],
    [47, 55, 62, 64],
    [45, 52, 55, 60],
    [43, 55, 59, 64],
    [41, 53, 57, 64],
    [40, 52, 55, 60],
    [38, 53, 57, 64],
    [43, 53, 57, 62],
    [48, 55, 59, 64],
    [47, 55, 62, 64],
    [45, 55, 59, 64],
    [43, 55, 59, 64],
    [41, 53, 57, 64],
    [38, 53, 57, 60],
    [43, 53, 57, 62],
    [43, 55, 59, 62],
  ];
  // Four-bar phrases answer each other, with a small lift in the second half.
  // Entries are [beat within bar, MIDI pitch, length in beats].
  const melody = [
    [
      [0, 72, 1],
      [1, 76, 0.5],
      [1.5, 79, 1],
      [3, 76, 1],
    ],
    [
      [0, 74, 1.5],
      [2, 71, 1],
      [3, 67, 1],
    ],
    [
      [0, 69, 1],
      [1, 72, 1],
      [2, 76, 1.5],
    ],
    [
      [0.5, 74, 1],
      [1.5, 71, 1],
      [3, 67, 1],
    ],
    [
      [0, 69, 1],
      [1, 72, 0.5],
      [2, 76, 1],
      [3, 72, 1],
    ],
    [
      [0, 67, 1.5],
      [2, 64, 1],
      [3, 67, 1],
    ],
    [
      [0, 69, 1],
      [1, 72, 1],
      [2.5, 74, 1],
    ],
    [
      [0, 72, 1.5],
      [2, 69, 1],
      [3, 67, 1],
    ],
    [
      [0, 76, 1],
      [1, 79, 0.5],
      [1.5, 81, 1],
      [3, 79, 1],
    ],
    [
      [0, 76, 1.5],
      [2, 74, 1],
      [3, 71, 1],
    ],
    [
      [0, 72, 1],
      [1, 76, 1],
      [2, 79, 1.5],
    ],
    [
      [0.5, 76, 1],
      [1.5, 74, 1],
      [3, 71, 1],
    ],
    [
      [0, 72, 1],
      [1, 69, 1],
      [2, 64, 1],
      [3, 69, 1],
    ],
    [
      [0, 65, 1.5],
      [2, 69, 1],
      [3, 72, 1],
    ],
    [
      [0, 74, 1],
      [1, 72, 1],
      [2, 69, 1.5],
    ],
    [
      [0, 67, 1.5],
      [2, 71, 1.5],
    ],
  ];
  const notes = [];
  chords.forEach((chord, bar) => {
    chord.forEach((midi, index) =>
      notes.push({
        voice: "pad",
        midi,
        start: bar * 4 * beat,
        duration: 4.9 * beat,
        velocity: index === 0 ? 0.62 : 0.44,
        pan: (index - 1.5) * 0.32,
      }),
    );
    melody[bar].forEach(([onset, midi, length], index) =>
      notes.push({
        voice: "key",
        midi,
        start: (bar * 4 + onset) * beat,
        duration: length * beat + 1.15,
        velocity: index === 0 ? 0.8 : 0.66,
        pan: Math.sin(bar * 0.65 + index) * 0.24,
      }),
    );
  });
  return { tempo, bars: 16, beatsPerBar: 4, duration: 48, notes };
}

/** Render one periodic stereo buffer. Note tails and room reflections wrap around
 * the ring, so the first sample already contains the preceding phrase's decay.
 * Playback needs only one BufferSource and one GainNode, never per-frame voices.
 */
export function renderFlightMusic({
  sampleRate = 22050,
  composition = composeFlightMusic(),
} = {}) {
  const length = Math.round(composition.duration * sampleRate);
  const dry = [new Float32Array(length), new Float32Array(length)];
  for (const note of composition.notes) {
    const start = Math.round(note.start * sampleRate);
    const count = Math.ceil(note.duration * sampleRate);
    const frequency = 440 * 2 ** ((note.midi - 69) / 12);
    const left = Math.cos(((note.pan + 1) * Math.PI) / 4);
    const right = Math.sin(((note.pan + 1) * Math.PI) / 4);
    for (let index = 0; index < count; index++) {
      const time = index / sampleRate;
      const phase = time * frequency * Math.PI * 2;
      let value;
      if (note.voice === "key") {
        const attack = Math.min(1, time / 0.009);
        const release = Math.min(1, (note.duration - time) / 0.18);
        const envelope = attack * release * Math.exp(-time * 2.05);
        value =
          envelope *
          (Math.sin(phase) +
            0.3 * Math.sin(phase * 2) * Math.exp(-time * 2) +
            0.085 * Math.sin(phase * 3) * Math.exp(-time * 4)) *
          note.velocity *
          0.27;
      } else {
        const attack = Math.sin((Math.min(1, time / 0.72) * Math.PI) / 2) ** 2;
        const release =
          Math.sin((Math.min(1, (note.duration - time) / 0.9) * Math.PI) / 2) **
          2;
        const warm =
          Math.sin(phase) +
          0.25 * Math.sin(phase * 1.0012) +
          0.12 * Math.sin(phase * 2);
        value = warm * attack * release * note.velocity * 0.09;
      }
      const position = (start + index) % length;
      dry[0][position] += value * left;
      dry[1][position] += value * right;
    }
  }
  const channels = dry.map((channel) => new Float32Array(channel));
  const room = [
    [0.137, 0.12],
    [0.263, 0.09],
    [0.419, 0.065],
    [0.673, 0.045],
  ];
  for (let channel = 0; channel < 2; channel++) {
    for (const [delay, gain] of room) {
      const offset = Math.round((delay + channel * 0.013) * sampleRate);
      for (let index = 0; index < length; index++) {
        channels[channel][index] +=
          dry[1 - channel][(index - offset + length) % length] * gain;
      }
    }
  }
  let peak = 0;
  for (const channel of channels) {
    for (const value of channel) peak = Math.max(peak, Math.abs(value));
  }
  // Fixed musical balance with ample headroom, even if note voicings change.
  const scale = peak > 0.7 ? 0.7 / peak : 1;
  if (scale < 1) {
    for (const channel of channels) {
      for (let index = 0; index < length; index++) channel[index] *= scale;
    }
  }
  return { sampleRate, duration: composition.duration, channels };
}

function createAudioContext() {
  const AudioContextClass =
    globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass)
    throw new Error("Audio is not supported in this browser");
  return new AudioContextClass();
}

function renderInBackground({ sampleRate, signal }) {
  if (typeof Worker === "undefined") {
    // Node has no audio/UI thread; keeping the pure renderer available makes
    // composition tests deterministic. Browsers never silently block as fallback.
    if (typeof window === "undefined") return renderFlightMusic({ sampleRate });
    throw new Error(
      "Background music rendering is not supported in this browser",
    );
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./music-worker.js", import.meta.url), {
      type: "module",
    });
    let settled = false;
    const finish = (error, audio) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(audio);
    };
    const abort = () => finish(new Error("Music rendering was cancelled"));
    worker.onmessage = ({ data }) => {
      if (data.error) finish(new Error(data.error));
      else finish(null, data);
    };
    worker.onerror = () =>
      finish(new Error("Music worker failed to load or render"));
    worker.onmessageerror = () =>
      finish(new Error("Music worker returned unreadable audio"));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else {
      try {
        worker.postMessage({ sampleRate });
      } catch (error) {
        finish(error);
      }
    }
  });
}

export class FlightMusic {
  constructor({
    contextFactory = createAudioContext,
    renderer = renderInBackground,
  } = {}) {
    this.enabled = false;
    this.volume = 0.35;
    this.playing = true;
    this.context = null;
    this.master = null;
    this.source = null;
    this._contextFactory = contextFactory;
    this._renderer = renderer;
    this._renderPromise = null;
    this._renderError = null;
    this._renderAbort = null;
    this._unlockPromise = null;
    this._disposed = false;
    this._revision = 0;
    this._appliedRevision = 0;
    this._syncPromise = null;
  }

  /** Call from a click/key gesture. Failures reject so the UI can explain them. */
  async toggle() {
    if (this._disposed) return false;
    this.enabled = !this.enabled;
    try {
      if (this.enabled && !this.context) this._initialize();
      const rendering = this._renderPromise;
      await this._synchronize();
      if (this._disposed) return false;
      if (rendering) {
        await rendering;
        if (this._disposed) return false;
        await this._synchronize();
      }
      return this.enabled;
    } catch (error) {
      if (this._disposed) return false;
      this.enabled = false;
      if (!this._syncPromise) this._applyGain();
      if (this._renderError || !this.source) await this._releaseAudio();
      throw error;
    }
  }

  setVolume(volume) {
    if (this._disposed) return Promise.resolve(false);
    if (Number.isFinite(volume)) this.volume = Math.max(0, Math.min(1, volume));
    return this._synchronize().catch(() => false);
  }

  /** Suspend the dedicated context, including its clock, instead of just muting.
   * This preserves the exact phrase position and does no DSP while paused/hidden.
   * Automatic resume failures are handled here, so event listeners may ignore it.
   */
  setPlaying(playing) {
    if (this._disposed) return Promise.resolve(false);
    this.playing = Boolean(playing);
    return this._synchronize().catch(() => false);
  }

  _initialize() {
    const context = this._contextFactory();
    if (!context) throw new Error("Audio is not supported in this browser");
    this.context = context;
    try {
      this.master = context.createGain();
      this.master.gain.value = 0;
      this.master.connect(context.destination);
      // Unlock within the original click, before a Worker or promise can yield.
      // The master stays at zero until the complete buffer has arrived.
      this._unlockPromise = context.resume();
      this._unlockPromise.catch(() => {});
      this._renderAbort = new AbortController();
      this._renderError = null;
      const rendering = this._renderer({
        sampleRate: Math.min(22050, context.sampleRate),
        signal: this._renderAbort.signal,
        context,
      });
      if (rendering && typeof rendering.then === "function") {
        this._renderPromise = rendering
          .then((audio) => this._installBuffer(context, audio))
          .catch((error) => {
            if (this.context === context) this._renderError = error;
            throw error;
          });
        // Resume may itself be pending when rendering rejects. The click still
        // observes this rejection, without an interim unhandled-rejection event.
        this._renderPromise.catch(() => {});
      } else this._installBuffer(context, rendering);
    } catch (error) {
      void this._releaseAudio();
      throw error;
    }
  }

  _installBuffer(context, audio) {
    if (this._disposed || this.context !== context) return;
    const buffer = context.createBuffer(
      2,
      audio.channels[0].length,
      audio.sampleRate,
    );
    audio.channels.forEach((channel, index) =>
      buffer.getChannelData(index).set(channel),
    );
    this.source = context.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.loopStart = 0;
    this.source.loopEnd = audio.duration;
    this.source.connect(this.master);
    this.source.start();
    this._applyGain();
  }

  _wantsPlayback() {
    return !this._disposed && this.enabled && this.playing && this.volume > 0;
  }

  _applyGain() {
    if (!this.master || !this.context || this.context.state === "closed")
      return;
    this.master.gain.setTargetAtTime(
      this.source && this._wantsPlayback() ? this.volume : 0,
      this.context.currentTime,
      0.035,
    );
  }

  _synchronize() {
    this._revision++;
    this._applyGain();
    if (this._disposed || !this.context) return Promise.resolve(false);
    // Calls arriving during a pending resume/suspend share reconciliation. Their
    // latest intent is applied before returning, rather than replaying old toggles.
    if (!this._syncPromise) {
      this._syncPromise = this._reconcile().then(
        (result) => {
          this._syncPromise = null;
          // A UI event may run after reconciliation resolves but before this promise
          // continuation. Drain that last intent as well, including visibility pause.
          if (!this._disposed && this._appliedRevision !== this._revision)
            return this._synchronize();
          return result;
        },
        (error) => {
          this._syncPromise = null;
          throw error;
        },
      );
    }
    return this._syncPromise;
  }

  async _reconcile() {
    while (!this._disposed && this.context) {
      const revision = this._revision;
      const context = this.context;
      try {
        const unlock = this._unlockPromise;
        this._unlockPromise = null;
        if (unlock) await unlock;
        if (this._disposed || this.context !== context) return false;
        this._applyGain();
        if (this._wantsPlayback()) {
          if (context.state !== "running") await context.resume();
        } else await context.suspend();
      } catch (error) {
        if (this._disposed) return false;
        if (revision !== this._revision) continue;
        this.enabled = false;
        this._applyGain();
        try {
          await context.suspend();
        } catch {
          await this._releaseAudio();
        }
        if (this._disposed) return false;
        if (revision !== this._revision) continue;
        throw error;
      }
      if (this._disposed) return false;
      if (revision === this._revision) {
        this._appliedRevision = revision;
        return this.enabled;
      }
    }
    return false;
  }

  async _releaseAudio() {
    const context = this.context;
    const source = this.source;
    const master = this.master;
    this.context = null;
    this.source = null;
    this.master = null;
    this._renderAbort?.abort();
    this._renderAbort = null;
    this._renderPromise = null;
    this._unlockPromise = null;
    try {
      source?.stop();
    } catch {
      /* An unstarted/closed source is already silent. */
    }
    source?.disconnect();
    master?.disconnect();
    if (context && context.state !== "closed") {
      try {
        await context.close();
      } catch {
        /* The browser may have closed it on unload. */
      }
    }
  }

  dispose() {
    if (this._disposed) return this._disposePromise;
    this._disposed = true;
    this.enabled = false;
    this._revision++;
    this._disposePromise = this._releaseAudio();
    return this._disposePromise;
  }
}
