export class Playback {
  constructor(duration, { reducedMotion = false } = {}) {
    this.duration = duration;
    this.time = 0;
    this.paused = reducedMotion;
  }

  update(delta) {
    if (!this.paused && Number.isFinite(delta) && delta >= 0) {
      this.time = (this.time + delta) % this.duration;
    }
    return this.time;
  }

  seek(time) {
    if (Number.isFinite(time))
      this.time = Math.min(this.duration, Math.max(0, time));
    return this.time;
  }
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
