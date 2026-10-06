# Sunset Controls and Music Implementation Plan

> Execute directly in the current workspace as requested by the user. No Git repository; no commits or worktree creation. Parallel tasks own disjoint files; root integrates and performs browser checks, followed by spec and quality reviews.

**Goal:** Make the sunset edition immediately operable through visible buttons and add an original, optional instrumental soundtrack.

**Design:** Preserve the Web3D film and centered title. Use a compact plum translucent control dock with ivory labels and amber active states: previous chapter, play/pause, restart, next chapter, camera cycle, music toggle and volume. Keep the full timeline behind the existing reveal action. Desktop is one compact strip; portrait wraps into two useful rows. Original 48-second soft piano/pad composition, no imported soundtrack or external requests, initially silent. Music follows playback pause and page visibility, independently enabled from engine sound.

**Architecture:** Isolated `FlightMusic` Web Audio module; isolated DOM controls controller forwarding user intent to the existing player. `main.js` remains the integration point. No changes to aircraft, world or flight paths. Existing classic controls and engine audio remain usable.

**Alternatives considered:** Always show the existing full panel (too large for the film); add only a music icon (flight operations still hidden); compact always-visible dock plus expandable timeline (selected). Local original synthesis avoids unavailable/unknown-rights music downloads and makes the build self-contained.

## Tasks

- [x] UI: edit `index.html`, `src/style.css`; create `tests/sunset-controls-shell.test.js` first. Dock IDs `sunset-dock`, `sunset-prev`, `sunset-play`, `sunset-restart`, `sunset-next`, `sunset-camera`, `music-toggle`, `music-volume`, `music-status`. `music-volume` range0–100 default35, accessible names; all buttons native and44px targets. Reference only, hidden in classic. Dock remains accessible with full timeline expanded; suppress duplicate reference camera strip. Colors #281d39/#fff0da/#e7b475/#b299bd; existing Georgia display + Arial/YaHei utility.
- [x] Music: create `src/music.js` and `tests/music.test.js` test-first. Export `FlightMusic` with `enabled=false`, `volume=.35`, `async toggle()->boolean`, `setVolume(0..1)`, `setPlaying(boolean)`, `dispose()`. Lazy audio context only after gesture. Original48s melodic piano/softpad loop, warm restrained mix, no vocals/external audio. Guard unsupported audio, resume failure, pending-toggle/disposal race; smooth gains and bounded node lifetime. Expose pure composition/render helpers only when also used in runtime; test note timing, finite/nonzero waveform, peak bounds and lifecycle with injected context factory where required.
- [x] Integration: create `src/sunset-controls.js` / `tests/sunset-controls.test.js` with injected document/actions, bind dock intents and synchronize labels, enabled state and volume. `main.js` connects controller to playback/chapters/camera/music; P toggles music (M retains engines); music mirrors playback/hidden/pagehide, dispose on real unload. Keep keyboard controls and paused-state feedback coherent; failure is visible and retryable.
- [x] Verify: targeted red→green tests, full `npm test`, `npm run build`; browser desktop/390px default and expanded dock, chapter/transport/camera actions, music enable/off/volume and visibility/pause, reduced motion and classic fallback. Inspect audio output through browser-supported developer tooling if available, otherwise report verification scope honestly. Independent spec then quality review. Update README/validation and save screenshot; leave final preview available.

Self-review: scope limited to controls and music; no new assets, external services or changes to the film's art direction. Exact IDs/API shared with implementers before parallel dispatch.
