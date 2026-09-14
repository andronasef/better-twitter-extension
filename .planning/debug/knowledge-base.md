## bookmark-sync-slow-broken — Direct GraphQL cursor pagination replaces stalled DOM auto-scroll sync
- **Date:** 2026-09-14
- **Error patterns:** premature sync completion, bookmarks sync slow and broken, stalled at 40 bookmarks, background tab throttling, dom virtualization
- **Root cause(s):** Bookmark sync depended exclusively on simulated DOM scrolling (`runAutoScrollLoop`), which suffers from DOM virtualization element pruning, background tab throttling, and artificial 1.5s-10s delays, prematurely aborting after 3 stalled checks (~40 bookmarks) while completely ignoring the GraphQL `bottomCursor` already extracted in memory.
- **Fix:** Implemented direct cursor-based GraphQL pagination in `entrypoints/bridge.ts`, `entrypoints/x.content/bridge-client.ts`, and `features/bookmarks/capture-engine.ts`. The bridge captures the initial Bookmarks request template and headers in the MAIN world, enabling `capture-engine.ts` to request subsequent pages directly via cursor at 300ms intervals, completely bypassing DOM scrolling and virtualization.
- **Files changed:** entrypoints/bridge.ts, entrypoints/x.content/bridge-client.ts, features/bookmarks/capture-engine.ts, tests/unit/bookmarks-capture.test.ts
- **Why not caught:** No gate existed for this class (previous unit tests only tested single-payload extraction, not multi-page pagination loop execution).
- **Recurrence guard:** Automated unit tests in `tests/unit/bookmarks-capture.test.ts` verifying `triggerNextPageFetch`, cursor progression, and terminal loop handling.
---
