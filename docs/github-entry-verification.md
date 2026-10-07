# Shared GitHub entry verification — 2026-10-07

- Node test suite: 66 passed, zero failed/skipped (59 packaging tests and 7 component tests).
- TDD failure observed before implementation for packaging, component mounting, control avoidance and safe-area handling.
- Real homepage: 14 previews automatically discovered; no second registry. Synthetic future-project fixtures verify automatic inclusion of an additional arbitrary project.
- Each current HTML retains its original bytes apart from the marker-delimited shared fragment. Source HTML and scene code stay untouched.
- Browser: all 14 previews checked at 1280×800 and 390×844; one entry per page. Final measured entry rectangles did not overlap visible button/link/input/select rectangles in those checked states.
- Screenshots reviewed for desktop and mobile. Heavy scenes sometimes outlast a short browser-tool wait; this does not establish performance targets for those projects.
- Independent spec review and subsequent quality review passed. Safe-area candidate calculation was corrected following review.
- This is an entry/publishing change, not a full regression of every pre-existing 3D interaction. Complex future modal/scroll states can still overlap the entry; it can be dismissed for the current page.

The Actions run is the authoritative deployment result. Repository-local `_site` and audit images are temporary and not committed.
