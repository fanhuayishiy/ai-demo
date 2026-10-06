# Responsive Keyboard Flight Implementation Plan

> Direct execution requested in this ongoing project. Use focused subagents and TDD in the existing non-Git workspace; preserve current scene and official music. No commits/worktrees apply.

**Goal:** Make brief key presses visibly responsive and manual steering legible against the cinematic flight, while retaining route-assisted flight, G/reset and safety controls.

**Architecture:** Retain the deterministic reference route and shared piloted sampler. PilotMotion owns faster motion, increased envelope, visible attitude and an engagement blend; a pure steering-camera transformation widens/stabilizes the camera while preserving the aircraft's existing screen anchor when the user takes over. Input accumulates a bounded minimum tap duration consumed by the frame loop, so a down/up pair between frames is not lost. Use one shared camera follow constant in camera and orbit corrections.

**Tech stack:** Three.js, ES modules, Node test, existing Vite, browser UI verification.

## Context / choice

Measured baseline:85% camera-follow cancellation; desktop100ms horizontal2.47–2.93px, portrait<1px. Response time to90%velocity192ms; full travel reaches its bound in~1.08s. Automatic camera roll reaches105deg/s, stronger than the11.46deg input bank. Current user preview is at y=6 limit. Existing tests require only positive movement, not perceptual thresholds.

Options considered: only adjust two gains (low risk but auto-roll still dominates); stable arcade-style assisted control (chosen, preserves original video route/music while making keys readable); full unconstrained flight simulator (materially different, excluded).

Chosen feel: increase velocity response24/s, quicker braking, bank≈30deg and pitch≈14deg. Horizontal/vertical limits20/12m and speeds16/10m/s passed complete-aircraft framing tests. Camera follow55% (shared constant), manual camera rear vector42m with10m lift,FOV52, world-up horizon; camera and target are translated together to preserve authored screen anchor, including portrait dolly. Engagement blends over roughly0.4s rather than snapping. Motion remains bounded and route-assisted; show a boundary cue when a held key reaches the limit. G/seek/restart/mode changes restore authored framing.

- [x] Input TDD: `sample(dt)` with bounded75ms credits;30 tests cover tap/held/repeat/aliases/opposites/cancellation/nativecontrols/IME.
- [x] Motion TDD:24 tests cover100/250ms response, reversal, release, stablecamera, fullgeometry,30/60/120fps and actual pre-engagement four-direction/released-tap projections. Independent review exposed recentering drift; RED then pure anchor-retention fix GREEN.
- [x] Root integration TDD: one sample(delta), common steeringCamera, shared orbitfollow constant, reset/pause/seek safety, keycaps/boundary/focus/driver mode feedback and truthful notes. Extracted actualmain functions verified.
- [x] Verification: root266/266 tests and productionbuild passed; independentreview plus24 realinput/extractedmain mathematical checks; browserfourdirections/G/pause/volume/orbit/music;390px layout; screenshots/validation record. Browsertool rejects sustainedkeydown, so longholds are automated tests only.

Self-review: Scope excludes full free-flight, touch joystick, new soundtrack and visual asset changes. Camera/input changes must be verified together because amplification alone clips the original close crop. Projected-delta tests cover both same route time and actual advancing route, comparing against the true pre-engagement view so camera takeover cannot hide opposite motion.
