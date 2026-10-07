# Shared GitHub Entry Implementation Plan

> **For agentic workers:** Use subagent-driven-development for isolated tasks, then independent spec and quality reviews. User has approved execution; use the dedicated feature branch in the existing publication checkout.

**Goal:** Automatically add one centrally maintained repository entry to every listed preview during publication.

**Architecture:** Parse homepage links, stage existing static files without changing source, inject an inline shared component, and deploy the resulting Pages artifact. Project assets and preview URLs stay unchanged.

**Tech Stack:** Node.js 22, parse5 for HTML discovery, node:test/jsdom, vanilla HTML/CSS/JavaScript, GitHub Actions Pages.

### Task 1: Discovery and packaging

Files: `scripts/prepare-pages.mjs`, `tests/prepare-pages.test.mjs`, root `package.json` and lockfile.

- [ ] Write temporary-directory fixtures with a homepage and two preview shells. Assert `discoverPreviews(home)` returns normalized relative HTML paths; assert adding a third card requires no manifest edit.
- [ ] Run `node --test tests/prepare-pages.test.mjs` and observe missing behavior fail.
- [ ] Export `discoverPreviews(html)` and `prepareSite({sourceDir, outputDir})`; read `shared/github-entry.html` once, inject marker-delimited copies into staged HTML, and return discovered paths.
- [ ] Reject unsafe/missing/duplicate-invalid targets, preserve query/hash navigation, prevent root injection and output/source overlap. Filter dotfiles, node_modules and generated staging. Refuse overwriting a nonempty output directory.
- [ ] Run all tests, including source immutability and byte-for-byte idempotent injection. Commit reviewed implementation.

### Task 2: Shared component

Files: `shared/github-entry.html`, `tests/github-entry.test.mjs`.

- [ ] Write jsdom tests that evaluate the actual fragment and assert a single shadow-isolated link, correct href/target/rel, visible name and local dismiss behavior; run failing tests.
- [ ] Implement one inline fragment with a dark compact pill, white text, GitHub icon, visible focus, 44px touch target and safe-area offsets. Keep unrelated pointer and keyboard interaction intact; no network fetch/storage.
- [ ] At widths up to 600px hide secondary copy. Provide a local dismiss button; reset on reload. Permit central per-project position rules if visual checks reveal collisions.
- [ ] Re-run component tests and capture browser screenshots at desktop and 390px after integrating packaging.

### Task 3: Publishing and documentation

Files: `.github/workflows/pages.yml`, `README.md`, `.gitignore`.

- [ ] Configure main pushes and workflow_dispatch. Build job checks out, installs Node/npm dependencies, runs `npm test`, then `npm run build:pages`; upload `_site` via upload-pages-artifact.
- [ ] Deploy job depends on build, uses github-pages environment, pages:write and id-token:write permissions, and deploy-pages. Serialize Pages deployments.
- [ ] Document homepage `badge cover` convention, automatic future inclusion, missing-preview failure, local packaging preview command, centralized component location, and no change to unprocessed dev servers.
- [ ] Run tests and package a full artifact. Validate all 14 entries, an added fixture entry and source immutability. Review spec compliance, then code quality.
- [ ] Push reviewed feature to main normally, change Pages build_type to workflow, run workflow, verify deployment success and public entry behavior. Never force push.
