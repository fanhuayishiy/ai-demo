# Keyboard Flight Implementation Plan

> Execute directly in the current non-Git workspace, following the user's direct implementation preference. Use test-first focused modules and independent spec/quality review; no worktree or commit.

**Goal:** Hold WASD or arrow keys to move the sunset aircraft visibly while preserving the existing film, music and camera controls.

**Design:** Guided steering superimposes real aircraft translation and gentle bank/pitch on the cinematic route. Inputs are screen-relative (up/down/left/right), bounded to a safe framing envelope. Releasing keys decelerates smoothly and holds the new offset. G or a visible “回到航线” button resets steering. Paused playback does not move. Seek/restart/chapter and camera changes reset steering. Blur, hidden page, modal, pause, context loss and unload clear held keys; native inputs, editable text and modifier shortcuts retain their keyboard behavior. Classic stays unchanged.

**Alternatives:** Free-world flight simulation would replace the choreographed film; camera-only panning would not move the aircraft. A guided steering layer is selected because it satisfies direct control and retains the sunset sequence.

**Architecture:** `src/pilot-motion.js` owns deterministic smoothed local offsets and pose/camera transforms. `src/pilot-input.js` owns keyboard state and release lifecycle. `src/main.js` advances and applies steering to model, camera and airflow. `index.html`/`src/style.css` expose a compact help/status strip and reset button above the existing dock.

**Tech Stack:** Three.js, native browser events, Node test runner, Vite.

## Tasks

- [x] Motion: create `tests/pilot-motion.test.js` first, run RED, then `src/pilot-motion.js`. Export `PilotMotion` with `x,y,vx,vy,bank,pitch`, `update(dt,{x,y},playing=true)`, `reset()`, `applyPose(pose,frame)`, `applyCamera(frame)`. x/y normalized and diagonal speed normalized; offsets bounded ±10/±6, max speeds 10/6 metres/s, exponential velocity smoothing with analytic displacement and dt capped0.1. No motion for paused/invalid/nonpositive dt. Pose methods clone inputs; derive screen right/up from frame lookAt+roll. Position offset = screenRight*x+screenUp*y; bank/pitch smooth and modest. Camera follows 85% offset, preserving fov/roll/shotIndex. Test directions, damping, bounds, reset, pause, step-rate consistency, no mutation and framing.
- [x] Input: test first `tests/pilot-input.test.js`, then implement `bindPilotInput(document,window,{canControl,onReset,onChange})` in `src/pilot-input.js`; return `axes()`, `clear()`, `dispose()`. Physical KeyWASD and arrows; repeated keys idempotent; opposing keys cancel; keyup always releases. Ignore native inputs/contenteditable/dialog/modifiers, clear on focus/blur/hidden/pagehide; G reset only when not repeated. Prevent default only for accepted movement keys. Actual EventTarget-based tests cover lifecycle and native focus behavior.
- [x] Integration/UI: test shell and actual integration source before editing main. Create sunset-only hint strip (`pilot-help`, `pilot-status`, `pilot-reset`) with WASD/arrow labels, offset status and 44px reset button. Step motion before scene sampling only when playing; apply transformed pose and camera; sample adjusted pose for ribbon roots and telemetry. Reset on seek/camera, clear on pause/modal/context loss. Existing keyboard shortcuts/music unaffected. Update README.
- [x] Verify: run all tests/build, independent spec then quality review. Browser hold/release each axis and G, paused state, native volume arrows and chapter reset, desktop/390px responsive checks. Save new screenshot and mark preview deliverable. Record evidence and limitations in validation.

Self-review: scope is sunset guided movement, not a full flight simulator or camera-only motion. All new code owns a bounded concern; no art assets, dependencies or external services required.
