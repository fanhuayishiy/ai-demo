# Closer Pilot Camera Implementation Plan

**Goal:** Move only the keyboard-assisted flight view nearer to the aircraft; preserve input response, authored camera, anchor-retention, music and orbit behavior.

**Design:** Reduce the stabilized rear vector from42m/10m lift to34m/8m lift at unchanged52° FOV. Compared with32m/8m (only3.3px minimum portrait edge margin),34m/8m retains11.4px margin in independent dense full-model boundary checks. Keeping52° rather than tightening FOV retains peripheral movement cues. Expected aircraft scale increase is about24%. Existing0.4s takeover and pure screen-anchor preservation remain unchanged. No new UI or zoom mode.

**Architecture/stack:** Two camera constants in `src/pilot-motion.js`, behavioral regression in `tests/pilot-feel.test.js`, existing Three.js projection/fullgeometry tests. Direct implementation requested; existing non-Git workspace, no commit/worktree actions.

- [x] RED: old42/10 failed stable rear/lift contract and projected subject-size regression (21.09% screenwidth versus requested quarter-frame minimum). Initial25.5% threshold was rounded to25% to express that quarter-frame requirement across both camera modes.
- [x] GREEN: changed only rear/lift and descriptive comment. Input/anchor/fullgeometry assertions unchanged; all267 tests pass.
- [x] Verify: independent dense geometry audit, complete tests and build pass. Browser desktop/390px short-key view and G reset checked. Viewport restored; original music source retained. Screenshot and validation saved.

Self-review: No control gains, movement limits, horizon behavior, FOV or autopilot camera are changed; shrinking target distance is sufficient for the user's closer-view request. Test the complete aircraft at bounds, not merely its center.
