# Sharing and Pageviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local screenshot-with-QR sharing and optional Busuanzi pageviews to every published preview without changing its app source.

**Architecture:** Compile independently testable browser helpers into the existing single inline, Shadow-DOM component at packaging time. Capture/composition and clipboard writes are click-driven; pageviews are a separate, timeout-bounded sandboxed-frame request. Existing preview discovery remains the only project registry.

**Tech Stack:** Node.js 22, node:test/jsdom, html2canvas 1.4.1, qrcode-generator 1.4.4, jsQR 1.4.0 for QR decoding tests, native Canvas/Clipboard/Screen Capture APIs, existing GitHub Pages Actions.

---

### Task 1: Local sharing primitives and dependency assembly

**Files:** create `shared/share-card.mjs`, `shared/share-capture.mjs`, `shared/share-clipboard.mjs`, `scripts/build-entry.mjs`, `tests/share-card.test.mjs`, `tests/share-capture.test.mjs`, `tests/share-clipboard.test.mjs`, `tests/build-entry.test.mjs`; update `package.json`, `package-lock.json`.

- [x] Add exact dependency versions through `apply_patch`; dependencies were installed by the user and verified with `npm ls --depth=0`, preserving their generated lockfile. Do not switch tools to bypass denied access.
- [x] Write failing tests for current-URL validation, bounded share-card layout and QR pixel decoding, deferred clipboard writes, no false success on denied writes, frame-track cleanup on success/error, and complete inline assembly.

```js
assert.equal(normalizeShareUrl('https://example.test/demo/?view=2#camera'),
  'https://example.test/demo/?view=2#camera');
assert.throws(() => normalizeShareUrl('javascript:alert(1)'));
assert.equal(decodeQr(renderQrPixels('https://example.test/demo/')).data,
  'https://example.test/demo/');
```

- [x] Run `node --test --experimental-test-isolation=none tests/share-card.test.mjs tests/share-capture.test.mjs tests/share-clipboard.test.mjs tests/build-entry.test.mjs`; record expected assertion failures before implementation.
- [x] Implement `normalizeShareUrl`, QR/card layout and painting with a non-overlapping footer and quiet zone; preserve full URL, reject excessive length, cap output size. Build tests decode the actual QR pixel array with jsQR.
- [x] Implement capture helpers using injected browser capabilities: snapshot visible canvas pixels inside a bounded RAF retry; reject blank/tainted canvases and visible cross-origin frames; use html2canvas's clone callback to substitute stable canvas images. Never enable preserveDrawingBuffer or alter renderer globals. Explicit tab capture takes one frame with audio false and always stops tracks.
- [x] Implement clipboard writing with `new ClipboardItem({'image/png': blobPromise})` and `navigator.clipboard.write(...)` synchronously inside the click call, attaching rejection handling immediately. Generated images remain available for manual save or a second copy attempt.
- [x] Compile helpers and pinned UMD libraries into local scopes without eval or runtime module loading. Include upstream license text, reject unresolved placeholders, and keep dependency initialization lazy.
- [x] Run the focused tests again, inspect the diff, then request spec review followed by quality review. Final Task 1 review: 35/35 tests, including real customized built-ins with closed shadow roots.

### Task 2: Isolated pageview counting and narrow CSP adjustments

**Files:** create `shared/pageviews.mjs`, `scripts/preview-csp.mjs`, `tests/pageviews.test.mjs`, `tests/preview-csp.test.mjs`.

- [x] Write tests for production host/path restrictions, query/privacy opt-out exclusions, one request, sandbox attributes, event source/token validation, safe integer counts, timeout/error cleanup, and unchanged application DOM.

```js
assert.equal(shouldCount(new URL('http://localhost:5185/demo/'), {}), false);
assert.equal(shouldCount(new URL('https://fanhuayishiy.github.io/ai-demo/demo/'), {}), true);
assert.equal(shouldCount(new URL('https://fanhuayishiy.github.io/ai-demo/demo/?token=private'), {}), false);
assert.equal(shouldCount(new URL('https://fanhuayishiy.github.io/ai-demo/demo/'), {doNotTrack:'1'}), false);
```

- [x] Run the new tests and observe failures before code. Implement `shouldCount(url, navigator)`, `startPageviews({window, document, onCount, onUnavailable})` returning an idempotent cleanup function. Receive Busuanzi JSONP inside `sandbox="allow-scripts"` srcdoc and only relay validated `page_pv`; do not execute provider code in the app document.
- [x] Add parse5-offset CSP tests first, then implement `patchPreviewCsp(html)`: edit actual CSP content attributes only; preserve other directives; extend script-src/script-src-elem with `https://busuanzi.ibruce.info`, frame-src with `'self'`, and local blob media only where necessary. Keep no-CSP pages and already-patched pages byte-stable.
- [x] Run focused tests and independent spec/quality reviews. No live analytics calls from unit tests. Head-only and whitespace-padded metadata regressions passed; final integration re-review found no remaining local issues.

### Task 3: Shared entry interaction and publication integration

**Files:** modify `shared/github-entry.html`, `scripts/prepare-pages.mjs`, `tests/github-entry.test.mjs`, `tests/prepare-pages.test.mjs`, `README.md`; create `shared/THIRD_PARTY.md`.

- [x] Add RED tests for the Share button and unchanged GitHub/dismiss semantics; exercise share success, denied clipboard, failed capture, repeated clicks, active dismissal, preview/save actions and accessibility labels using real component DOM and mocked browser boundaries only.
- [x] Retain current color/type/control dimensions; add an icon button, a minimal hidden-until-valid count, a polite status, and an on-demand accessible fallback dialog. Keep share and analytics lifecycles independent, recalculate placement when the count changes, and clean everything on dismissal.
- [x] Connect the compiled helpers into the component; name dismiss explicitly so adding another button cannot change the close handler. Hide utility content from generated captures. Keep all manual save/capture actions visitor initiated.
- [x] Make `prepareSite` compile the real shared template and narrowly patch each staged preview's CSP; retain simple custom fragments in packaging fixtures. Validate dependencies before copying and keep original HTML/assets untouched.
- [x] Run all Node tests and build to a fresh directory under ignored `audit-github-entry/` so existing `_site` is preserved. Final full suite: 192/192; artifact: `share-preview-20261008-c`; 14 HTML entries and 818 source-file/asset hashes checked.
- [x] Document counts/third-party disclosure, skipped query and local URLs, image privacy, browser fallbacks, source immutability and dependency licenses. Run spec review then quality review on the whole integration. Final two-delta spec and quality checks independently passed 41/41; no unresolved local findings.

### Task 4: Browser, release and public verification

**Files:** ignored audit screenshots and reports only; committed verification notes as appropriate.

**Release decision:** the earlier browser and GitHub attempts failed at automatic approval (unsupported reviewer model / API 404). The user then explicitly enabled permissions and requested direct publication without waiting for browser acceptance. Fresh GitHub access and remote-state checks now succeed, the normal `npm test` command passes 192/192, and `share-release-20261008-b` passes all 14 preview and 818 source-file checks. Browser checks below remain unverified, not passed. No model routing or security configuration was changed by the agent. See `docs/superpowers/sharing-pageviews-verification.md` for the preflight record; confirm deployment separately after pushing.

- [ ] Use the supported browser tool with an agent-owned tab and a local static server. Check a live 3D preview and the clipboard PNG, decode the footer QR back to the exact page URL, and inspect no-overlap placement on desktop and mobile. Confirm share opens no unsolicited remote screen-capture prompt.
- [ ] Exercise denied/unsupported clipboard and screenshot errors, download fallback, cancellation and stopped tracks. Check both CSP-restricted single-file voxel previews and the on-demand-rendered HABITAT preview. Preserve app playback/camera state.
- [ ] Audit all current homepage preview paths for one entry, loaded scenes and accessible controls; assert automatic new-project inclusion through fixtures. Restore temporary viewport overrides.
- [ ] Run full tests, inspect `git diff --check`, review final source/asset scope, and commit the approved change on the feature branch. Fast-forward main and push only through the authorized network path; if approval service prevents publishing, stop and clearly report that local work is not live.
- [ ] Wait for the Pages Actions result, then validate all public HTML/CSP entries and a real live sharing/counting sample. Do not infer public success solely from Actions status. Return concise Chinese results with a screenshot and remaining limitations.
