# Anime Rendering V2 Implementation Plan

> **For agentic workers:** Use subagent-driven-development with independent file ownership, then spec and quality review. The user's established preference is direct implementation; this is a continuation of the approved scene, not a new product.

**Goal:** Make the existing aerial duel read more like a painted animation film, with drawn aircraft edges, intentional cel shadows, painted cloud silhouettes, and visible water brushwork.

**Architecture:** Keep all playback, choreography, camera and control contracts. Replace the 3D-toy rendering cues at their source: a small cel-material module for the aircraft, procedural painted billboard textures for distant clouds, and a restrained final color/paper pass. No remote assets or new runtime dependencies.

**Tech Stack:** Three.js ES modules, locally generated DataTextures, GLSL, existing Node test runner and browser visual verification.

## Design decisions

Three options considered: only a final color filter (too superficial), physically lit toon models everywhere (retains the spherical-cloud toy look), or a hybrid cel-animated foreground / painted background (selected). Preserve the scarlet flying-boat silhouette and navy opponent. Six palette anchors: scarlet #ce362f, wine shadow #73333c, sea blue #2e87a2, sky #6fb9d8, cloud ivory #fff1d5, ink #33434c. Existing serif titles and restrained sans-serif controls remain; reduce the heavy dark overlay so it does not muddy the art.

## Tasks

- [x] Aircraft: tests first for deterministic cel shading, finite shader parameters, fine back-face outlines, palette differentiation and existing geometry/propeller contracts. Create `src/cel-material.js`; update `src/aircraft.js`; own `tests/aircraft.test.js` and `tests/cel-material.test.js`. Use a three-level painted shade ramp, restrained warm highlights/cool shadows, thin dark colored contour on major forms, no glossy specular. Keep +Z nose and references unchanged.
- [x] Painted world: tests first for deterministic nonempty RGBA cloud textures, varied silhouettes, edge transparency, billboarding, retained lifecycle/disposal and sea parameters. Update `src/world.js`; create `src/painted-clouds.js` if useful; own `tests/world.test.js` and `tests/painted-clouds.test.js`. Replace separate visible spherical cloud lobes with overlapping, coherent painted cloud banks. Add irregular visible wave patches and sparse foam marks without a line grid. Preserve sea Y0 and fog/camera invariants.
- [x] Film finish: tests first for restrained tone settings and quality/resizing contract. Create `src/anime-renderer.js` and its tests if a render-target pass is warranted; integrate in `src/main.js`, respecting linear/sRGB output exactly once, quality, resize and disposal. Reduce CSS overlay strength. Avoid heavy blur, outlines on the sky, or new control panels.
- [x] Browser validation: compare opening, pursuit, crossing and climb framing at the same times; check desktop/portrait layouts, runtime GLSL logs, pause/seek, orbit, quality and reduced-motion. Repair rendering issues and rerun tests/build.
- [x] Independent spec and quality review; document actual changes and verified limitations in README/validation notes. Preserve working preview.

## Verification commands

`node --test tests/aircraft.test.js tests/cel-material.test.js`

`node --test tests/world.test.js tests/painted-clouds.test.js`

`npm test` and `npm run build`

Visual acceptance: aircraft edges remain fine rather than heavy black comic outlines; red paint has distinct drawn shadow regions; cloud banks are visually coherent rather than piles of spheres; sea texture is clearly visible without moiré; the foreground remains sharper than distant painted scenery. Existing 35 tests are the regression baseline. No Git repository is present; no commits/worktree/publication actions.
