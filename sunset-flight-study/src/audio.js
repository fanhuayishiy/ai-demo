/** Original synthesized engine and wind; no recorded soundtrack. */
export class FlightAudio {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.playing = true;
  }

  async toggle() {
    if (!this.context) this.initialize();
    await this.context.resume();
    this.enabled = !this.enabled;
    this.setPlaying(this.playing);
    return this.enabled;
  }

  initialize() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Audio is not supported");
    this.context = new AudioContextClass();
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;
    filter.Q.value = 0.4;
    filter.connect(this.master);
    this.engines = [52, 78].map((frequency, i) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = i ? "triangle" : "sawtooth";
      oscillator.frequency.value = frequency;
      const gain = ctx.createGain();
      gain.gain.value = i ? 0.13 : 0.09;
      oscillator.connect(gain).connect(filter);
      oscillator.start();
      return oscillator;
    });

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
      samples[i] = previous * 3.5;
    }
    this.wind = ctx.createBufferSource();
    this.wind.buffer = buffer;
    this.wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 1700;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.23;
    this.wind.connect(windFilter).connect(windGain).connect(this.master);
    this.wind.start();
  }

  setPlaying(playing) {
    this.playing = playing;
    if (this.context)
      this.master.gain.setTargetAtTime(
        this.enabled && playing ? 0.46 : 0,
        this.context.currentTime,
        0.2,
      );
  }

  update(time, distance) {
    if (!this.context || !this.enabled) return;
    const modulation = Math.sin(time * 0.6) * 3 + Math.sin(time * 11) * 0.6;
    this.engines[0].frequency.setTargetAtTime(
      52 + modulation,
      this.context.currentTime,
      0.1,
    );
    this.engines[1].frequency.setTargetAtTime(
      78 + modulation * 0.7,
      this.context.currentTime,
      0.1,
    );
    this.master.gain.setTargetAtTime(
      this.playing ? Math.max(0.2, 0.6 - distance * 0.004) : 0,
      this.context.currentTime,
      0.3,
    );
  }

  dispose() {
    this.engines?.forEach((oscillator) => oscillator.stop());
    this.wind?.stop();
    this.context?.close();
  }
}
