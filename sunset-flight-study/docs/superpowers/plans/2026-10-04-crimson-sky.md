# Crimson Sky Implementation Plan

> **For agentic workers:** Use subagent-driven-development with independent file ownership, then review spec compliance and code quality. The user explicitly requested direct implementation without further design gates.

**Goal:** Build an interactive, cinematic Web3D homage to the Adriatic aerial duel in Porco Rosso, emphasizing aircraft silhouette, painted color, and directed camera movement.

**Architecture:** A Vite + Three.js single-page scene with independently owned procedural aircraft, environment, deterministic flight choreography, and a small accessible film-player UI. All geometry and effects are locally generated; no remote model downloads or runtime services.

**Tech Stack:** ES modules, Three.js, Vite, Node test runner, Playwright verification.

## Visual specification

Full-viewport scenery, restrained ivory typography, small aviation labels and a translucent bottom film transport. Signature: detailed scarlet flying boat banking above a turquoise sea, with a navy biplane and sculpted cream clouds. Palette: vermilion #cc382b, navy #233f58, sea #397f91, sky #a9d5da, warm cloud #fff3d6, ink #183e44. Chinese headings use a restrained serif with system sans utility text. A 72-second directed sequence with replayable chapters, orbit mode, pause, audio toggle, quality and fullscreen. No claim of shot-for-shot fidelity without source frames.

## Tasks and ownership

### 1. Aircraft — src/aircraft.js, tests/aircraft.test.js
- [x] Add failing tests for red/blue groups, bounding sizes, named cockpit/engine/wings, animated propeller references, and distinct material palettes. Run `node --test tests/aircraft.test.js` and confirm missing implementation failure.
- [x] Export `createAircraft(type)` returning a Group, nose +Z, up +Y. Red span ~16, length ~12; high single wing, flying-boat hull, upper nacelle, open pilot cockpit, wing floats and tricolor tail. Blue double wing, struts, floats, open cockpit. Set `group.userData.propeller` and `group.userData.wingTips`.
- [x] Run model tests, inspect bounding boxes and geometry counts; review silhouette in browser after integration.

### 2. Environment — src/world.js, tests/world.test.js
- [x] Add failing tests for `createWorld(scene, {quality})` return/update/dispose contract and finite geometry. Run `node --test tests/world.test.js`.
- [x] Create stylized sea shader, horizon sky, sculpted clouds, rocky green islands and warm ambient/directional light. Export controller `{update(time,camera), dispose(), setQuality(quality)}`. Sea level 0, aircraft flight area radius 400, altitude 60–110, landscape outside the flight path.
- [x] Run world tests; verify no shader errors in browser.

### 3. Choreography — src/flight.js, tests/flight.test.js
- [x] Add failing deterministic motion tests: loop, finite transforms, above-sea bounds, stable camera and complete shot intervals. Run `node --test tests/flight.test.js`.
- [x] Export `DURATION=72`, `SHOTS` with `{id,title,subtitle,start,end}`, `sampleFlight(time)` returning red/blue position and quaternion, and `sampleCamera(time,mode='cinematic')` returning position,target,fov,roll,shotIndex. Nose +Z, smooth banking, cinematic initial three-quarter front view with red plane large in frame, blue opponent visible.
- [x] Run motion tests at interval boundaries and dense full-cycle sampling.

### 4. Integration — index.html, src/main.js, src/style.css, src/audio.js, tests/app.test.js
- [x] Add failing application shell tests for accessible controls, dialog and canvas fallback; run `node --test tests/app.test.js`.
- [x] Initialize WebGL renderer with clamped pixel ratio and resize handling, connect deterministic playback to airplane transforms and cameras, include OrbitControls, subtle trails, optional synthesized engine/wind sound, fullscreen and quality switching.
- [x] Implement responsive scene UI with title, live telemetry, shot selector, transport timeline, keyboard shortcuts, focus-visible states, reduced-motion initial pause and useful WebGL error message.
- [x] Run all tests and production build.

### 5. Validation
- [x] Use browser screenshots at desktop/mobile and multiple timeline locations; inspect aircraft readability, contrast and framing.
- [x] Verify playback/pause, shot jump, orbit reset, timeline seek, sound, fullscreen where supported, quality, and no runtime/shader errors.
- [x] Review spec compliance first, then code correctness and accessibility. Repair issues and rerun tests/build.
- [x] Open the local running page and document commands and limitations in README.md.

No Git repository exists in the starting directory; do not create a worktree, commit or publish.

Final additions from review: src/camera.js and tests/camera.test.js enforce portrait/orbit sea clearance; src/lifecycle.js and tests/lifecycle.test.js preserve cached pages; src/combat.js and tests/combat.test.js restrict gunfire to forward targets. Final verification: 35 tests pass, production build succeeds, desktop/mobile UI verified. GPU performance on physical mobile devices and actual BFCache browser restoration were not measured.
