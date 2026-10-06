# Sunset Flight Video Reference Implementation Plan

> Execute with independent owned modules and two-stage review. User explicitly asks to build from the supplied video and previously requested direct implementation. No additional design approval gate; no Git repository/commit operations.

**Goal:** Make the default Web3D experience match the supplied video's dominant visual and motion language: ivory single-wing plane, violet sculpted clouds, amber sunset ocean, close rolling chase camera and long wingtip ribbons.

**Architecture:** Preserve existing daylight modules and make them reachable through `?scene=classic`. Add isolated reference-world, reference-aircraft and reference-flight modules. The application selects a profile at initialization. Reuse playback, lifecycle, orbit, audio, quality and the linear compositor. Generate all geometry and shaders locally; do not embed the video as the scene or copy watermarks.

**Tech Stack:** Existing Three.js/Vite, procedural meshes and GLSL, Node tests, browser verification. The reference is 16.43s, of which about 14s is flight; the account end card is excluded. A 24s seamless flight interpretation keeps the motions readable and scrub-able.

## Reference observations and choices

Frames were extracted into `docs/reference-video/`: warm ivory monoplane with green-white-red tail and concentric wing insignia; nose propeller, open cockpit, no high-mounted flying-boat wing. Camera remains above/behind, subject generally lower-right; horizon rolls by roughly 45–80 degrees. Clouds have deep indigo/violet bodies, pink facets and gold backlit rims. Sea is dark plum with tight gold reflection. Bright wingtip ribbons and brief distant streaks suggest speed. Central restrained serif text, minimal HUD.

Palette: night plum #211b39, cloud violet #694386, lavender #9b68aa, coral #d98180, sunset #ffbd71, plane ivory #f2dcc0. Signature is flying through rim-lit purple cloud towers with a rolling horizon. Do not use the old aqua ocean / blue sky / big lower-left headline as the default.

Three approaches: recolor daylight only (insufficient geometry/motion change), play the supplied video (not interactive Web3D), or new locally rendered sunset scene (selected). Keep the original scene as an explicitly labeled alternate, not blended into the reference.

## Tasks and ownership

- [x] **Aircraft agent:** create `src/reference-aircraft.js`, `tests/reference-aircraft.test.js`. Export `createReferenceAircraft() -> THREE.Group`, +Z nose/+Y up, `userData.propeller` and two local `wingTips`. Slim tapered ivory fuselage, single low/center-mounted elliptical wing (span≈13m, length≈10m), open cockpit/pilot, nose prop, tail fin with tricolor, dark green wingtips and three-color concentric roundels. Fine linework and warm-light/lavender-shadow cel shading. Preserve older aircraft module. Test named parts, finite/outward geometry, silhouette proportions and contracts before implementation.
- [x] **World agent:** create `src/sunset-world.js`, `tests/sunset-world.test.js`. Export `createSunsetWorld(scene,{quality}) -> {update(time,camera),setQuality,dispose}`. World Y0 sea, flight path radius≈340, altitude≈420±90. True sculpted volume clouds (grouped lobe geometry/instancing with coherent shaded masses and gold rim), near and far layers off the flight corridor. Indigo/plum sky, broad coral/amber horizon near sun direction [-.65,.2,-.7], visible sunset glow and fine reflective plum water. No flat ivory cloud cards, islands or external textures. Test material/geometry/quality/lifetime before implementation.
- [x] **Flight agent:** create `src/reference-flight.js`, `tests/reference-flight.test.js`. Export `DURATION=24`, four SHOTS of6s (尾随/剪刀/回旋/俯冲), `sampleFlight(t)->{red,blue}` and `sampleCamera(t,mode)->{position,target,fov,roll,shotIndex}`. Loop radius≈340 at altitude420±90, smooth nose-velocity alignment, strong ±1.1rad banks, safe close rear-quarter camera keeping ivory plane large/lower-right with horizon following banks. No editorial cuts; modes cinematic/chase/wide. Blue pose exists for compatibility but default scene hides opponent. Test continuity, periodicity, finite values, sea clearance, camera behind subject, bank/roll magnitude.
- [x] **Root integration:** create `src/scene-profile.js` and `src/reference-effects.js` with tests first. Default reference profile, `?scene=classic` retains72s original modules. Long two-wing ribbons sampled from flight history in world space (warm translucent tapered triangle strips, 64samples≈1.4s); short decorative distant speed streaks, no targeting/gunfire fabrication in reference. Add restrained glow to compositor without blurring plane detail. Integrate profile-specific renderer/UI behavior in main/index/style. Minimal center `just breathe.` and bottom maneuver caption; a control reveal button keeps controls operable and hidden by default, accessible focus and reduced motion. Keep classic UI unchanged.
- [x] **Verification:** unit tests before each new implementation, full test/build, actual browser at first/scissors/spiral phases, portrait layout, controls/seek/quality/orbit, shader logs, resource disposal. Inspect against reference frames, repair issues. Independent spec then quality review. Save final screenshot and update README/validation; mark working preview deliverable.

## Root regression contracts

```js
assert.equal(getSceneProfile('').id, 'sunset');
assert.equal(getSceneProfile('?scene=classic').duration, 72);
assert.equal(getSceneProfile('').duration, 24);
assert.equal(referenceEffects.root.children.length >= 2, true);
```

Run `node --test tests/reference-*.test.js tests/scene-profile.test.js`, then `npm test` and `npm run build`. Browser checks confirm effects, not Node shader-string assertions alone. Existing62tests remain baseline. No original video mutation or remote upload.
