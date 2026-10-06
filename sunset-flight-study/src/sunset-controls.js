const CAMERA_LABELS = {
  cinematic: "电影", chase: "追随", orbit: "自由", pilot: "驾驶",
};

export function adjacentChapterIndex(shots, time, direction) {
  const current = shots.findIndex((shot) => time < shot.end);
  const index = current < 0 ? shots.length - 1 : current;
  return (index + direction + shots.length) % shots.length;
}

/** Small DOM adapter; all scene and audio ownership stays with the application. */
export function bindSunsetControls(document, actions) {
  const get = (id) => document.getElementById(id);
  const listeners = [];
  const on = (id, event, handler) => {
    const element = get(id);
    element.addEventListener(event, handler);
    listeners.push(() => element.removeEventListener(event, handler));
  };
  for (const [id, action] of Object.entries({
    "sunset-play": "togglePlayback",
    "sunset-restart": "restart",
    "sunset-prev": "previous",
    "sunset-next": "next",
    "sunset-camera": "cycleCamera",
    "music-toggle": "toggleMusic",
  }))
    on(id, "click", () => actions[action]());
  on("music-volume", "input", () => {
    const value = Number(get("music-volume").value);
    if (Number.isFinite(value))
      actions.setVolume(Math.max(0, Math.min(100, value)) / 100);
  });
  on("music-source", "change", () => actions.selectMusicSource(get("music-source").value));
  let disposed = false;
  return {
    sync({ paused, mode, musicEnabled, musicPlaying, musicVolume, musicBusy,
      musicSource = "original", musicStatus = "idle", musicTime = "" }) {
      if (disposed) return;
      get("sunset-play").setAttribute(
        "aria-label",
        paused ? "播放飞行" : "暂停飞行",
      );
      get("sunset-play").setAttribute("aria-pressed", String(paused));
      get("sunset-play-label").textContent = paused ? "播放" : "暂停";
      const camera = CAMERA_LABELS[mode] || CAMERA_LABELS.cinematic;
      get("sunset-camera-label").textContent = `机位 · ${camera}`;
      get("sunset-camera").setAttribute(
        "aria-label",
        `切换机位，当前${camera}`,
      );
      get("sunset-camera").title = mode === "pilot"
        ? "当前为稳定驾驶视角；G 返回电影航线，点击切换机位"
        : "依次切换电影、追随、自由视角";
      const musicLabel = musicEnabled ? "关闭配乐" : "开启配乐";
      get("music-toggle").setAttribute("aria-label", musicLabel);
      get("music-toggle").setAttribute("aria-pressed", String(musicEnabled));
      get("music-toggle").disabled = musicBusy;
      get("music-volume").disabled = musicBusy;
      get("music-toggle-label").textContent = musicEnabled
        ? "配乐已开"
        : "开启配乐";
      get("music-volume").value = String(Math.round(musicVolume * 100));
      get("music-volume").setAttribute(
        "aria-valuetext",
        `${Math.round(musicVolume * 100)}%`,
      );
      const original = musicSource === "original";
      const label = original ? "原曲" : "视频片段";
      get("music-source").value = musicSource;
      get("music-source").disabled = musicBusy;
      get("music-player-mount").hidden = !original || !musicEnabled;
      get("music-player-details").hidden = !original || !musicEnabled;
      get("music-track-time").textContent = original ? musicTime : "00:15 · 片段循环";
      get("music-hint").textContent = !original
        ? "本地视频音轨 · 15.44 秒循环，不是完整版。"
        : musicStatus === "error"
          ? "官方播放器连接失败，请重新开启重试，或选择本地视频片段。"
          : musicEnabled && !paused && musicVolume > 0 && !musicPlaying && !musicBusy
            ? "若未响起，请点击下方官方播放器的播放键；驾驶前点回画面。"
            : "SoundCloud 官方流播 · 需要联网，首次播放可能需要点击播放器。";
      get("music-status").textContent = musicStatus === "error"
        ? "原曲 · 连接失败"
        : musicBusy
        ? "正在准备配乐…"
        : !musicEnabled
          ? `${label} · 未开启`
          : musicVolume === 0
            ? `${label} · 已静音`
            : !musicPlaying
              ? original && !paused ? "原曲 · 等待播放" : `${label} · 已暂停`
              : `${label} · 正在播放`;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.forEach((remove) => remove());
    },
  };
}
