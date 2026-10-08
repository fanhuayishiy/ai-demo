# Shared preview sharing and pageviews

Approved by the user on 2026-10-08: retain the existing GitHub entry appearance, add local screenshot sharing, and use the registration-free Busuanzi service for pageview counts. The previously proposed compact redesign is cancelled.

## User-visible contract

- Keep the GitHub destination, keyboard navigation, dismissal, Shadow DOM isolation, and edge-position avoidance. Add an accessible Share icon and a small, initially hidden pageview count; do not change a demo's source, camera, playback, or rendering configuration.
- Share captures the current visible application, excluding this utility, then appends a white footer with the page title and a scannable QR code for the current complete URL. The QR must not cover the scene or substitute the repository URL. Copy one PNG to the clipboard and show success only after the write resolves.
- The image, QR generation, and composition stay on the visitor's device. No screenshot upload or remote QR service. No capture work before a click and no perpetual capture loop.
- Some WebGL canvases discard pixels, and cross-origin frames cannot be read as DOM. Attempt an in-frame local capture first. If a complete capture is unavailable, explain the limitation and offer an explicitly clicked current-tab capture. Browser permission cannot be skipped. Stop every capture track immediately after taking one frame, including errors and cancellation; never capture audio.
- If clipboard access is denied or unavailable, show the generated image with Copy again and Save image actions. Do not claim that a link-only fallback is an image copy. Support cancellation, repeat clicks, bounded memory, and cleanup on dismiss.
- Busuanzi reports the current page's views, not unique people or a repository-wide total. Counts are approximate, are not historical backfill, and may be blocked or unavailable. Hide unavailable counts instead of inventing zero. Do not record share/click events.
- Only the production `https://fanhuayishiy.github.io/ai-demo/` preview pages automatically contact Busuanzi. Local development and test pages do not count. Respect Do Not Track / Global Privacy Control. Show a brief disclosure that the provider receives the visitor's IP and referring page address; screenshots are never sent. Skip parameterized URLs to avoid transmitting query values in the provider's required Referer.

## Boundaries and security

- Ship pinned screenshot and QR libraries inline in the deployment fragment so standalone/CSP-restricted demos do not require a screenshot CDN. Initialize those libraries only when sharing.
- Run the Busuanzi JSONP script in an invisible sandboxed frame (`allow-scripts`, no same-origin access). Accept only its frame-source and per-request token, a known message type, and a nonnegative safe-integer `page_pv`. Use a finite timeout and remove the listener/frame afterward. No polling, cookies, localStorage, or persistent visitor identifiers added by our component.
- Existing strict preview CSPs may be extended only in the staged HTML with the exact Busuanzi script origin and same-origin temporary frames/local media needed by capture. Preserve every other directive and existing source. No wildcard origin, unsafe-eval, or removal of the CSP.
- New projects still opt in through their ordinary homepage preview card. Preserve the source/build files; compile one shared fragment during Pages packaging. Keep the original single-file demo content and inline licensed dependencies.

## Verification

Use RED/GREEN Node tests for URL/QR validity, bounds, clipboard success/error semantics, capture cleanup, analytics isolation/validation/timeout/privacy exclusions, duplicate mounting, dismissal and published CSP patching. Decode a real generated QR, not merely its drawing calls. Keep all existing packaging/discovery tests, including arbitrary future projects. Check real desktop/mobile preview behavior, clipboard image bytes, and the fallback UI. Audit all 14 pages for a single shared entry and preserved previews. Verify Actions and public page contents before claiming deployment.

## Workspace decision

Reuse the existing separate publication checkout at `E:/3d-demo/仓库管理/ai-demo`, on `feat/share-and-pageviews`; leave the original `warehouse-demo` working app untouched. Baseline: 66 tests pass with Node's in-process test runner, needed because the current sandbox does not allow child processes.
