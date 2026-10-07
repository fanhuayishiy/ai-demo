# Unified GitHub entry

User approved implementation on 2026-10-07. Scope: all collection preview pages, including future entries discovered from the homepage, with unchanged public URLs.

## Contract

- One shared component links to https://github.com/fanhuayishiy/ai-demo in a new tab with noopener/noreferrer. Desktop text: GitHub · 源码 / 提示词. Mobile uses a compact labeled icon. Keyboard focus is visible. No analytics, forced redirects or popups.
- Keep app code untouched. During Pages packaging, discover local HTML previews from homepage anchors carrying both `badge` and `cover` classes. Directory links resolve to index.html. Deduplicate targets; reject traversal, external URLs, missing files, and symlinks. Never inject into the collection homepage.
- Inject the shared component inline into each published HTML, with stable begin/end markers and idempotent replacement. Isolate styles from applications. Preserve existing script ordering, assets and paths, including standalone voxel pages.
- A missing preview or malformed shell fails the build before deployment. The deployed artifact excludes repository internals and local dependencies. Do not mutate source HTML or commit generated Pages output.
- GitHub Actions runs tests and packages on main push and manual dispatch, then uses the official Pages artifact/deploy actions. Migrate Pages from branch publishing to workflow publishing after review. Permissions are restricted to read contents, write pages and OIDC.
- Future projects require a committed static preview and one normal homepage card; no component import or separate manifest. Unlisted projects and local dev servers are outside automatic deployment injection.
- Default compact corner placement can be overridden centrally for existing densely packed pages after browser checks. This requested repository link is an explicit new exception to Sakura's historical no-overlay presentation rule; its 3D assets remain untouched.

## Verification

Test current discovery count/order, a new arbitrary project, folder URLs, query/hash, duplicate cards, invalid paths, missing previews, repeated packaging, source immutability and shared markup reuse. Test component keyboard semantics, safe target, mobile rules and dismissal. Check all 14 published pages for the entry and desktop/mobile placement; confirm direct GitHub navigation once. Inspect workflow result and public Pages before claiming completion.
