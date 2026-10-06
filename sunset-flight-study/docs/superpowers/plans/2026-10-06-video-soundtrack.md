# Video Soundtrack Implementation Plan

> Execute in the current workspace as directly requested. No Git repository; preserve the source video and existing flight features.

**Goal:** User refined request to identify and add the full original song in the supplied MP4. Identified BAANDIT! — rumination using two independent fingerprints; integrate its artist-published official stream, with local video clip as explicitly selected fallback.

**Architecture:** `OriginalMusic` wraps the official SoundCloud Widget SDK, lazy-loaded after user opt-in, exposing actual playback, pause, volume, duration, repeat and disposal. Default full recording streams inside visible attributed iframe; no paid download or rehosting. Explicit clip option reuses losslessly extracted AAC and existing FlightMusic. Switching disposes old track before creating next. Synthetic generator remains unselected.

**Design:** Same P shortcut/button, opt-in and35% volume. Original speed, independent of24s visual loop. A quiet sunset-glass track card uses existing purple/ivory/amber tokens and italic Georgia song title, with artist credit, source selector and full visible166px official player when enabled. Narrow screens wrap within existing stack; short screens allow control-stack scrolling. Primary scene remains the signature, no unrelated visual redesign. Source is always labeled; errors and user-gesture waits cannot claim playback. Direct user requests authorize implementation without another design-approval round.

- [x] Asset: lossless AAC remux verified, source preserved, compressed audio SHA256 matches140032b3fd1304712144848ef5c4eb178659e1683fb82dd10229cef8deebfd48.
- [x] Loader TDD:29 new tests, full previous192tests passed; clip lazy-load/decode/abort/retry/lifecycle validated.
- [x] Identify: Shazam672983150, ISRC QZNWV2399079; artist Bandcamp and SoundCloud verified; official widget Play became Pause in browser.
- [x] Official adapter TDD:30 tests for lazy SDK/iframe, real PLAY, pause/visibility/mute intent, loop, timeout/error/retry and late callback cleanup.
- [x] Integration/copy TDD: default official stream, explicit clip selector, truthful statuses and artist credit; fix sunset disclaimer without changing classic copy. Preserve flight and camera.
- [x] Verify: root full229/229tests; buildPASS with existing bundle-size warning; independent review. Browser actual01:56original playback, pause/resume, loop, volume, nativepause-volume preservation, bothsource switches, mobile390px and foldableplayer checked. Screenshot saved and preview kept; see docs/validation.md. No physical speaker-listening claim.
