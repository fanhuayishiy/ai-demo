# Default animation and music playback

**Request:** Open the page with both animation and music playing. Initially implemented locally; the user subsequently confirmed publishing the update to GitHub Pages.

**Design:** Explicitly start the sunset Playback, leaving classic reduced-motion behavior unchanged. Only after the first successful visible rendered frame, consume a one-shot `startupMusicPending` intent and enable the existing official music controller. Its iframe remains `auto_play=false` so the SDK can first apply35% volume and the current pause/visibility intent, then request play. A manual accepted toggle consumes startup intent too. Existing real PLAY/PAUSE events determine audible state, and blocked autoplay is honestly shown as waiting with an official-player button hint. Do not change browser policy, camera, audio source or controls.

**Alternatives:** Eager iframe autoplay could start before volume/pause control; a forced click gate contradicts opening immediately. Controlled SDK playback after the first rendered frame is chosen. Browser permission to autoplay sound cannot be guaranteed by site code.

- [x] Tests first: default sunset animation including reduced-motion, once-only music, hidden entry, explicit off before/after first frame, paused animation, failed rendering, and classic exclusion. Old behavior failed6/8.
- [x] Minimal implementation in main.js, no adapter changes. Targeted startup/audio/UI58/58 passing.
- [x] Fresh full tests276/276 and production build passed. Browser reload without click showed actual widget Pause and advancing elapsed time; pause/resume and explicit music-off preservation verified. Final screenshot and validation record saved; current preview error/warning logs empty.

Scope: Update only sunset-flight-study source, tests, documentation and production dist. User confirmed push and deployment on 2026-10-07; keep other projects unchanged.
