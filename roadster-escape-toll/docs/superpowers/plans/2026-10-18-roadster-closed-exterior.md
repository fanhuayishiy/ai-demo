# Roadster Closed Exterior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the closed Roadster model's silhouette, proportions, wheels, glass, and front/rear details closer to the supplied multi-view references.

**Architecture:** Keep the existing Three.js procedural model in `buildRoadster()`. Calibrate the shared body profile and wheel coordinates first, then align the glass and exterior parts to those surfaces; preserve the existing `group`, `wheels`, and `jets` interfaces.

**Tech Stack:** Browser JavaScript, the bundled Three.js build in `libs/three.min.js`, HTML Canvas/WebGL.

---

## File Map

- Modify `game.js:780-1485`: vehicle dimensions, loft profile, cabin glass, wheel geometry, lights, side details, rear fascia, spoiler, and propulsion nozzle positions affected by changed proportions.
- Read `建模对比/01-侧视轮廓对比.png`, `02-正交侧视.png`, `07-官方渲染侧视叠加.png`, `11-正后方.png`, `12-正前方.png`, and `13-官方车头.png` during visual calibration.
- Do not modify `index.html` or `style.css`; this task does not add controls or a new presentation mode.

The workspace has no Git metadata and no existing automated test runner, so the plan uses JavaScript syntax validation, browser runtime checks, model metrics from the existing `window.__roadster` hook, and fixed-view visual comparison. Git commit steps cannot be run in this workspace.

### Task 1: Establish dimensions and wheel placement

**Files:**
- Modify: `game.js:780-910`
- Modify: `game.js:1110-1125`

- [ ] **Step 1: Record the current model baseline**

Run `node --check game.js` and capture the existing side, front 3/4, and rear 3/4 appearance from `建模对比/03-侧视.png`, `04-前45度.png`, and `05-后45度.png`. In the browser console, record the model extents and wheel centers:

```js
var api = window.__roadster;
var box = new THREE.Box3().setFromObject(api.car);
console.log('bounds', box.getSize(new THREE.Vector3()).toArray());
console.log('wheels', api.roadster.wheels.map(function (wheel) {
  return wheel.position.toArray();
}));
```

Expected: `node --check` exits 0; the log confirms the current rear axle at `z=1.22` and the model's current wheel radius/extent for later comparison.

- [ ] **Step 2: Define wheel dimensions from the reference and tire specification**

In `buildRoadster()`, replace the contradictory wheel comments and literals with the reference-aligned axle and tire values. Keep the front axle near the existing `z=-1.42`; place the rear axle near `z=1.63`, which gives an axle span near 65% of the 4.70 m body length. Derive tire radius from the labeled tire sizes and set arch clearance to 0.05 m:

```js
var WHEEL_Z_F = -1.42, WHEEL_Z_R = 1.63, WHEEL_X = 0.858;
var WHEEL_R_F = (20 * 25.4 + 2 * 265 * 0.35) / 2000;
var WHEEL_R_R = (21 * 25.4 + 2 * 325 * 0.30) / 2000;
var ARCH_R_F = WHEEL_R_F + 0.05, ARCH_R_R = WHEEL_R_R + 0.05;
```

Set each cloned wheel's center height to its own radius so its bottom remains at `y=0`. Update the nearby dimensions comment to describe the values actually used by the geometry.

- [ ] **Step 3: Check dimensions before moving on**

Run `node --check game.js`, reload the game, and run the wheel-center console snippet from Step 1.

Expected: front/rear wheel centers are approximately `-1.42` and `1.63`; front/rear tire diameters are approximately `0.694 m` and `0.728 m`; each wheel's lower extent is at ground level. Do not proceed if the rear wheel is outside the rear body profile.

### Task 2: Rebuild the closed body silhouette

**Files:**
- Modify: `game.js:847-1014`
- Modify: `game.js:1180-1265`

- [ ] **Step 1: Move the rear shoulder and arch with the rear axle**

Update the rear half of `bodyTable` so the broad rear fender peak is centered near `WHEEL_Z_R` and the outer tail still closes at `z=2.35`. Keep maximum half-width near `1.03 m` so total width stays near 2.06 m. Recheck the rear arch cut and body lower edge against `ARCH_R_R`; do not leave the old `z=1.22` fender peak behind.

Use the same table values for the shell and arch construction:

```js
arches: [
  { zc: WHEEL_Z_F, R: ARCH_R_F, yc: WHEEL_R_F, flat: 0.30 },
  { zc: WHEEL_Z_R, R: ARCH_R_R, yc: WHEEL_R_R, flat: 0.30 }
]
```

- [ ] **Step 2: Refine the nose, canopy, and tail profile**

Adjust the front rows of `bodyTable`, `cabinTable`, and `glassTopFn()` together. Preserve the narrow leading nose, gradual shoulder expansion, long low dark canopy, thin roof edge, and broad rear cut visible in the references. Keep the model's total body length `z=-2.35..2.35` and maximum roof height near `1.13 m`.

Use `sampleProfile(bodyTable, z)` and `surfaceSideX()` for attached glass and details instead of adding new fixed-width side plates. Render the side silhouette after this step and correct profile rows before adjusting trim.

- [ ] **Step 3: Align side windows to the closed body**

Keep the continuous warm-dark side glass and narrow silver roof edge. Reduce the B-pillar strip to a subtle closed-panel separator that does not read as a wide vertical post. Recheck both sides for gaps, z-fighting, or glass covered by the body shell.

Run `node --check game.js` and compare a fixed side view with `02-正交侧视.png` and `07-官方渲染侧视叠加.png`.

Expected: the side silhouette reads as a low long wedge; the canopy is continuous; both wheel arches center on the wheels; the model does not exceed its target length, width, or height.

### Task 3: Replace the six-spoke wheel with a five-spoke aero wheel

**Files:**
- Modify: `game.js:1041-1125`

- [ ] **Step 1: Change spoke count and geometry**

Change the spoke loop from six instances to five equally spaced instances and widen each spoke into a tapered aero blade. Keep the extruded spokes inside the tire sidewall and leave visible dark gaps between blades:

```js
for (var i = 0; i < 5; i++) {
  var base = (i / 5) * Math.PI * 2;
  var sg = starSpoke(r * 0.08, r * 0.94, 0.045, 0.105, hw * 0.82);
  sg.rotateX(base);
  sg.translate(hw * 0.17, 0, 0);
  spokeGeos.push(sg);
}
```

- [ ] **Step 2: Validate the wheel profile and rolling update**

Run `node --check game.js`; inspect front and rear wheels from a low front 3/4 view and a square side view. Start a run and confirm all four wheel groups still rotate with the existing update loop.

Expected: five wide blades remain identifiable at gameplay camera distance; brake discs, calipers, and tire sidewalls do not protrude beyond the wheel; no wheel floats or clips through its arch.

### Task 4: Refit exterior details to the revised surfaces

**Files:**
- Modify: `game.js:1128-1350`
- Modify: `game.js:1435-1466`

- [ ] **Step 1: Refine the front fascia**

Place the narrow dark headlight wedges and DRL strips on `bodyTable` with `surfaceTopY()`. Reduce or remove protruding box-shaped front corner/intake details, and keep the lower lip thin and attached to the nose. Check the front view against `12-正前方.png` and `13-官方车头.png`.

- [ ] **Step 2: Refine the side and rear fascia**

Use body-profile helpers to place the side vent and skirt. Make the tail light a thin full-width line on the rear plane; keep the centered plate above a compact dark lower panel and diffuser. Preserve four rear propulsion outlets in one horizontal row. Model the 2026 Roadster active rear wing in the deployed static display position, with a near-full-width airfoil, twin center struts, and downturned endplates; do not add wing animation.

Update the relevant nozzle positions if the rear-body geometry changes, preserving the `jets` list and all plume update behavior.

- [ ] **Step 3: Inspect all exterior parts at reference angles**

Render side, front, rear, top, front 3/4, and rear 3/4 views at a fixed scale. Correct intersections and detached surfaces before gameplay checks.

Expected: the front and rear details follow the body planes; the rear light reads as one thin line; the lower rear panel and four nozzles remain visible without appearing as a protruding rectangular block.

### Task 5: Run browser and gameplay regression checks

**Files:**
- Modify: `game.js` only

- [ ] **Step 1: Run JavaScript syntax validation**

Run `node --check game.js`.

Expected: exit code 0 and no syntax diagnostics.

- [ ] **Step 2: Verify startup and browser rendering**

Open `index.html` in a local browser or serve the workspace over localhost. Confirm the loading overlay clears, the start screen appears, and the vehicle renders with no WebGL or JavaScript console errors.

- [ ] **Step 3: Verify flight and retry**

Start a run, hold Space to activate thrust, confirm the vehicle still rises and plume effects still appear, then finish or reset the run and confirm retry works.

Expected: exterior edits do not alter controls, vehicle movement, jet groups, or retry behavior.

- [ ] **Step 4: Recheck model metrics and references**

Use the browser console snippet from Task 1 to confirm body extents and wheel centers, then compare the six fixed views with the listed reference images. Confirm the target body ratio, wheelbase ratio near 65%, tire-to-body ratio, five-spoke count, and absence of visible geometry intersections.

Expected: all checks in `docs/superpowers/specs/2026-10-18-roadster-exterior-design.md` pass; record any remaining visual limitation as a concrete mismatch rather than claiming exact CAD-level reproduction.
