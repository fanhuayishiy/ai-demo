# Sharing and pageviews verification

Date: 2026-10-08. Branch: `feat/share-and-pageviews`. Baseline: `7eba94b402857ed4beedeaeb8985cdf1018cb156`.

## Latest release preflight

The user explicitly enabled the required permissions and again authorized direct publication. Network access now succeeds: the repository's default branch is `main`, the signed-in GitHub account has administrative access, and Pages uses the existing workflow at `https://fanhuayishiy.github.io/ai-demo/`. A fresh fetch confirmed the remote is still at the baseline above; no newer changes need merging. No model routing or application security configuration was modified by the agent.

The normal `npm test` command now runs successfully with its standard test workers: **192/192 passed**, zero failures/skips. The new ignored `audit-github-entry/share-release-20261008-b` package also passed all 14 single-entry HTML, script syntax, CSP and idempotence checks; its build-time before/after hashes confirmed all 818 publishable source files were unchanged. Older packages and `_site` are preserved. Documentation updated after that snapshot does not change its runtime bundle.

This is a pre-commit/push record, not a deployment-success claim. The user accepts publication before browser acceptance; real clipboard behavior, visual capture fidelity and live pageview attribution are still unverified. Check the repository's Pages Actions and the served preview HTML for the outcome of this release. The earlier blockers below are retained as historical evidence, not current permission requirements.

## Local checks

- The user installed the pinned dependencies; `npm ls --depth=0` confirmed html2canvas 1.4.1, qrcode-generator 1.4.4 and development-only jsQR 1.4.0.
- Tests run in-process because the current sandbox denies the default Node test runner's child-process spawn (`EPERM`). The final full run passed **192/192**, with zero failures/skips: `node --test --experimental-test-isolation=none --test-reporter=spec tests/*.test.mjs`. An independent reviewer reproduced the earlier 182-test suite; the final added regressions were independently checked in the 41-test UI/CSP re-review.
- Tests cover real QR pixel decoding (including URL query/hash, Unicode and long URLs), card bounds, deferred clipboard activation/success, denied access, canvas capture fallback, original-size clone allocation limits, track cleanup, isolated pageview validation, privacy exclusions, CSP offsets, sharing UI cancellation, packaging source immutability and arbitrary future projects.
- Review regressions were first observed failing and then fixed: closed-root custom elements (including genuinely registered customized built-ins without a literal `is` attribute), capture versus composition errors, BFCache return, cancellation focus, non-enforcing body/padded-keyword CSP metas, and keeping controls reachable after tab capture while PNG/clipboard work continues. Task 1 and Task 2/3 spec and quality reviews passed, with no unresolved local findings. Independent extra probes also confirmed that cancelled old captures cannot change newer captures' visibility or announce late clipboard success.
- The final runtime was packaged into the new ignored `audit-github-entry/share-preview-20261008-c` by `node audit-github-entry/verify-share-package.mjs`. All 14 discovered previews contain exactly one entry with valid inline JavaScript, the current helper bundle, licensed libraries and idempotent CSP/entry injection. Before/after SHA-256 checks covered 818 publishable source files, all unchanged; every non-preview artifact matched its source. The root homepage was not injected. Earlier `share-preview-20261008-a` and `share-preview-20261008-b` remain older snapshots.
- The pre-existing `_site` and original sibling `warehouse-demo` app were not overwritten. Documentation/checklist edits may be newer than the audit snapshot; any code changes require a fresh package before release.
- DOM reconstruction cannot inspect closed roots on arbitrary ordinary native elements or guarantee every browser visual effect. Unverified custom elements conservatively require an explicitly chosen tab capture; actual per-demo image verification remains mandatory.
- A passing local suite/build is not a claim that browser APIs, correct live page attribution or public deployment were verified.

## Earlier browser gate — acceptance still not completed

Opening the local browser probe was blocked before navigation by the desktop automatic approval service: its configured `claude-3-5-haiku-20241022` reviewer model returned API 404 / unsupported model. The dependency installation did not resolve this separate browser-approval problem. No alternate browser surface, raw CDP or external automation was used to bypass it.

Required after approval access is restored:

1. Verify that a `sandbox="allow-scripts"` srcdoc frame actually supplies the correct public page Referer under the selected policy. The ignored local server includes a no-external-network probe at `/__referrer-probe.html`. If it does not, redesign safely before enabling per-page analytics; do not add `allow-same-origin` to run the provider inside the application's origin.
2. Read a real clipboard PNG after sharing and decode the composed footer QR back to the exact page URL. Visually compare screenshot to the scene.
3. Test desktop/mobile on all 14 previews, particularly both strict-CSP voxel pages and on-demand-rendered HABITAT. Exercise clipboard denial, PNG save, explicit tab selection/cancel and absence of leftover tracks/frames.
4. Rebuild, review the final diff and integrate/push only through an authorized channel. Verify Pages Actions and actual public HTML before reporting deployment.

The agent-owned local audit server on ports 5187/5188 has been stopped. Its source remains at `audit-github-entry/share-audit-server.mjs` for an authorized later run. The user's pre-existing preview server/tab was not changed, and no current-feature browser screenshot was produced.

No commit, push, Pages deployment or public counting success has been claimed for this feature.

## Earlier direct-publication attempt — blocked before GitHub access

The user subsequently explicitly requested direct publication and continuation without waiting for browser acceptance. This changes the requested release order; it does not turn the unperformed browser checks into passing checks or waive tool approvals.

- The full in-process test command was rerun for this release attempt: **192/192 passed**, zero failures/skips. `git diff --check` passed.
- The existing Pages workflow installs the lockfile with `npm ci`, runs `npm test`, builds `_site`, and deploys only on `main` pushes (or manual dispatch). The existing `_site` is preserved locally.
- `gh repo view fanhuayishiy/ai-demo --json nameWithOwner,defaultBranchRef,url,isPrivate,viewerPermission` first encountered the sandbox's blocked proxy. Its normal escalation was then rejected before execution because automatic approval returned API 404 / unsupported `claude-3-5-haiku-20241022`.
- No alternate GitHub connector, proxy bypass, different browser, approval-policy change or model substitution was attempted. No commit, push or deployment was performed.
- The additional release-review agent hit a model rate limit and produced no review; it is not counted as a successful review. Previously completed feature reviews remain the latest independent evidence.

That attempt needed a functioning authorization path. The latest preflight above records its subsequent restoration and the fresh local checks. Public URLs and live counting must still be checked separately before claiming online feature verification.
