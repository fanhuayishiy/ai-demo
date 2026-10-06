/** Official attributed playback; audio stays inside the visible SoundCloud player. */
const sdkLoads = new WeakMap();

function loadWidgetSDK({ document }) {
  const view = document.defaultView || globalThis;
  if (typeof view.SC?.Widget === "function") return Promise.resolve(view.SC.Widget);
  if (sdkLoads.has(document)) return sdkLoads.get(document);
  const loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    const timer = setTimeout(() => {
      finish(new Error("SoundCloud SDK timed out. Please try again."));
    }, 15000);
    const finish = (error) => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else resolve(view.SC.Widget);
    };
    script.onload = () => {
      finish(typeof view.SC?.Widget === "function" ? null : new Error("SoundCloud SDK is unavailable"));
    };
    script.onerror = () => finish(new Error("SoundCloud SDK failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkLoads.delete(document);
    throw error;
  });
  sdkLoads.set(document, loading);
  return loading;
}

export class OriginalMusic {
  constructor({ mount, onChange = () => {}, widgetLoader = loadWidgetSDK } = {}) {
    this.enabled = false;
    this.playing = true;
    this.volume = 0.35;
    this.audible = false;
    this.status = "idle";
    this.duration = 0;
    this.position = 0;
    this.lastError = null;
    this._mount = mount;
    this._onChange = onChange;
    this._widgetLoader = widgetLoader;
    this._frame = null;
    this._widget = null;
    this._loading = null;
    this._ready = false;
    this._events = [];
    this._disposed = false;
    this._generation = 0;
    this._settleStartup = null;
  }

  async toggle() {
    if (this._disposed) return false;
    this.enabled = !this.enabled;
    this._notify();
    if (this.enabled) await this._initialize();
    if (!this._disposed && this.status === "error") throw this.lastError;
    this._synchronize();
    return this.enabled;
  }

  async setPlaying(playing) {
    if (this._disposed) return false;
    this.playing = Boolean(playing);
    try {
      this._synchronize();
    } catch {
      return false;
    }
    return this.enabled;
  }

  async setVolume(volume) {
    if (this._disposed) return false;
    const previousVolume = this.volume;
    if (Number.isFinite(volume)) this.volume = Math.max(0, Math.min(1, volume));
    try {
      this._synchronize(previousVolume === 0 && this.volume > 0);
    } catch {
      return false;
    }
    return this.enabled;
  }

  _notify() {
    this._onChange(this);
  }

  _wantsPlayback() {
    return !this._disposed && this.enabled && this.playing && this.volume > 0;
  }

  _synchronize(requestPlay = true) {
    if (this._disposed || !this._ready) return;
    try {
      this._widget.setVolume(this._wantsPlayback() ? this.volume * 100 : 0);
      if (this._wantsPlayback()) {
        if (requestPlay) this._widget.play();
      } else {
        this.audible = false;
        this.status = "ready";
        this._widget.pause();
        this._notify();
      }
    } catch (error) {
      this._fail(error, this._generation);
      throw error;
    }
  }

  _initialize() {
    if (this._loading) return this._loading;
    const generation = ++this._generation;
    this.status = "loading";
    this.lastError = null;
    this.duration = 0;
    this.position = 0;
    this._notify();
    const loading = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._fail(new Error("SoundCloud player timed out. Please try again."), generation);
      }, 15000);
      this._settleStartup = (error) => {
        clearTimeout(timer);
        this._settleStartup = null;
        if (error) reject(error);
        else resolve();
      };
    });
    this._loading = loading;
    try {
      const document = this._mount.ownerDocument;
      const frame = document.createElement("iframe");
      frame.src = "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fuser-133547811%2Frumination&auto_play=false&show_artwork=false&show_comments=false&show_user=true&color=%23b85139";
      frame.title = "BAANDIT! — rumination (SoundCloud)";
      frame.width = "100%";
      frame.height = "166";
      frame.setAttribute("allow", "autoplay");
      frame.setAttribute("frameborder", "0");
      this._mount.appendChild(frame);
      this._frame = frame;
      Promise.resolve()
        .then(() => this._active(generation) ? this._widgetLoader({ document }) : null)
        .then((Widget) => {
          if (this._active(generation)) this._attachWidget(Widget, frame, generation);
        })
        .catch((error) => this._fail(error, generation));
    } catch (error) {
      this._fail(error, generation);
    }
    return loading;
  }

  _active(generation) {
    return !this._disposed && generation === this._generation;
  }

  _attachWidget(Widget, frame, generation) {
    const widget = Widget(frame);
    this._widget = widget;
    const bind = (name, callback) => {
      const event = Widget.Events[name];
      this._events.push(event);
      widget.bind(event, (...args) => {
        if (!this._active(generation)) return;
        try {
          callback(...args);
        } catch (error) {
          this._fail(error, generation);
        }
      });
    };
    bind("READY", () => {
      if (this._ready) return;
      this._ready = true;
      this.status = "ready";
      widget.getDuration((duration) => {
        if (!this._active(generation)) return;
        if (!Number.isFinite(duration) || duration < 0) return;
        this.duration = duration / 1000;
        this._notify();
      });
      this._notify();
      this._settleStartup?.();
    });
    bind("PLAY", () => {
      if (!this._ready || !this._wantsPlayback()) {
        this.audible = false;
        widget.setVolume(0);
        widget.pause();
        this._notify();
        return;
      }
      this.audible = true;
      this.status = "playing";
      this._notify();
    });
    bind("PAUSE", () => {
      this.audible = false;
      if (this._ready) this.status = "ready";
      this._notify();
    });
    bind("FINISH", () => {
      if (!this._ready) return;
      this.audible = false;
      this.position = 0;
      this.status = "ready";
      this._notify();
      if (this._wantsPlayback()) {
        widget.seekTo(0);
        if (this._wantsPlayback()) widget.play();
      }
    });
    bind("PLAY_PROGRESS", ({ currentPosition } = {}) => {
      if (!Number.isFinite(currentPosition) || currentPosition < 0) return;
      const previousSecond = Math.floor(this.position);
      this.position = currentPosition / 1000;
      if (Math.floor(this.position) !== previousSecond) this._notify();
    });
    bind("ERROR", () =>
      this._fail(new Error("SoundCloud playback failed. Please try again."), generation),
    );
  }

  _fail(error, generation) {
    if (!this._active(generation)) return;
    this.enabled = false;
    this.audible = false;
    this.lastError = error instanceof Error ? error : new Error("SoundCloud playback failed");
    this.status = "error";
    this._release(this.lastError);
    this._notify();
  }

  _release(error) {
    this._generation++;
    this._settleStartup?.(error);
    const widget = this._widget;
    const frame = this._frame;
    const events = this._events;
    this._widget = null;
    this._frame = null;
    this._ready = false;
    this._loading = null;
    this._events = [];
    try {
      widget?.setVolume(0);
    } catch {
      /* Frame removal also stops playback. */
    }
    try {
      widget?.pause();
    } catch {
      /* Frame may already be unavailable. */
    }
    for (const event of events) {
      try {
        widget.unbind(event);
      } catch {
        /* Continue releasing other handlers. */
      }
    }
    frame?.remove();
  }

  async dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.enabled = false;
    this.audible = false;
    this.status = "disposed";
    this._release();
  }
}
