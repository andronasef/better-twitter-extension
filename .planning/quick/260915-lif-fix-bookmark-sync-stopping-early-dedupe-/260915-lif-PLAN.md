---
id: 260915-lif
slug: fix-bookmark-sync-stopping-early-dedupe
date: 2026-09-15
workflow: quick
phase: quick-260915-lif
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - entrypoints/bridge.ts
  - features/bookmarks/capture-engine.ts
  - tests/unit/bookmarks-sync-dedupe.test.ts
autonomous: true
requirements: [BOOK-02]

estimate:
  tokens: 55000
  raw_tokens: 38000
  tasks: 2
  confidence: low   # no calibration samples for this repo yet

must_haves:
  truths:
    - One logical `requestBookmarksPage(cursor)` call produces exactly ONE outbound GraphQL bookmarks fetch, even though the request is delivered on three separate channels.
    - Bookmark sync on a large collection keeps paging past the first few pages instead of flipping `status` to `complete` at ~60 captured items.
    - A fresh sync request (empty cursor) issued after an earlier sync finished or aborted still fetches page one, and can re-walk cursors it already fetched.
    - A page fetch that throws releases the in-flight guard, so a failed page never permanently wedges sync.
    - `bottomCursor === null` and repeated-cursor remain the termination signals; a page that yields a NEW cursor but zero extractable items no longer terminates sync on its own.
  artifacts:
    - entrypoints/bridge.ts — dedupe guards inside `fetchBookmarksPage`
    - features/bookmarks/capture-engine.ts — narrowed `isComplete` condition
    - tests/unit/bookmarks-sync-dedupe.test.ts — one new vitest file
  key_links:
    - bridge `fetchBookmarksPage` guards <-> bridge-client `requestBookmarksPage` three-channel emit (postMessage + script CustomEvent + document CustomEvent)
    - capture-engine `handleBookmarksPayload` `isComplete` <-> `bookmarkSyncItem.cursor` checkpoint advance
---

<objective>
Fix bookmark sync halting after ~60 captured bookmarks.

`requestBookmarksPage(cursor)` (`entrypoints/x.content/bridge-client.ts:79`) emits the same page request on three channels — `window.postMessage`, a CustomEvent on the injected `<script>` element, and a CustomEvent on `document` — and `entrypoints/bridge.ts` listens on all three. A single logical request therefore runs `fetchBookmarksPage()` up to three times. Each duplicate emits `bt:graphql-bookmarks`, and the duplicates race inside `handleBookmarksPayload()`: the first write advances `syncState.cursor` to the new cursor D, then a duplicate re-reads state, sees `extraction.bottomCursor === syncState.cursor`, computes `isComplete = true`, writes `status: 'complete'` and calls `stopDirectGraphqlSync()` / `stopAutoScrollSync()`. Sync dies a few pages in.

Purpose: make the intentionally-redundant three-channel delivery safe by deduping at the single point of consumption (the bridge), and remove the one remaining premature-termination trigger in the payload handler.
Output: minimal diff across two source files plus exactly one new vitest file.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@entrypoints/bridge.ts
@entrypoints/x.content/bridge-client.ts
@features/bookmarks/capture-engine.ts
@tests/unit/bookmarks-capture.test.ts
</context>

<scope_guard>
Do NOT restructure `requestBookmarksPage`'s three channels — they exist for delivery reliability across the isolated-world / MAIN-world boundary. The bridge-side dedupe is what makes them safe.
Do NOT touch the auto-scroll loop, the extractor, storage schemas, or any other bookmark code.
Do NOT create files other than the single test file named in Task 1.
The working tree already carries unrelated uncommitted work (engagement feature, DevToolsPanel, popup/registry/storage/background edits). Commits MUST be scoped by explicit path to only the three files this plan touches.
</scope_guard>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Dedupe page fetches inside the MAIN-world bridge</name>
  <files>tests/unit/bookmarks-sync-dedupe.test.ts, entrypoints/bridge.ts</files>
  <read_first>entrypoints/bridge.ts (lines 256-363: `fetchBookmarksPage` plus the three `bt:request-bookmarks-page` listeners), entrypoints/x.content/bridge-client.ts (`requestBookmarksPage`), tests/unit/bookmarks-capture.test.ts (test conventions: plain `describe`/`it`, `vi`, `@/` path alias, WxtVitest + happy-dom, no explicit environment pragma needed)</read_first>

  <behavior>
Write `tests/unit/bookmarks-sync-dedupe.test.ts` FIRST and watch it fail, then implement the guards.

Test harness shape (this is the only tricky part — follow it exactly):
    - `entrypoints/bridge.ts` default-exports `defineUnlistedScript(main)`, which WXT resolves to an object with a callable `main` property. The test drives the real bridge by importing that default export and calling `main()`.
    - The bridge's module-level guard variables persist for the lifetime of the module, and vitest resets the module registry per FILE, not per test. So in `beforeEach`: capture the real `window.fetch`, `XMLHttpRequest.prototype.open`, `XMLHttpRequest.prototype.send`, `history.pushState` and `history.replaceState`; install a `vi.fn()` fetch stub on `window.fetch`; call `vi.resetModules()`; `await import('@/entrypoints/bridge')`; call its `main()`. In `afterEach`: restore every captured global and call `vi.restoreAllMocks()`. That gives each test fresh guard state and leaves no patched globals behind.
    - The fetch stub resolves a plain object, not a real `Response`: `{ status: 200, text: async () => body, clone: () => ({ text: async () => body }) }`. The bridge only uses `res.status` / `res.text()` on its own fetches and `result.clone().text()` on observed ones, so this avoids happy-dom `Response` quirks. `body` is a JSON string whose shape is `{ data: { bookmark_timeline_v2: { timeline: { instructions: [] } } } }`.
    - The bridge refuses to fetch until it has captured a request template, so prime it: `await window.fetch('https://x.com/i/api/graphql/DOC1/Bookmarks?variables=%7B%7D', { method: 'GET', headers: { authorization: 'Bearer test' } })`, then flush pending microtasks (a couple of `await new Promise((r) => setTimeout(r, 0))`) because the template is captured inside a `.then()`. Then `stub.mockClear()` so later assertions count only page fetches.
    - Local helper `requestPage(cursor)` mirrors `requestBookmarksPage`: `window.postMessage({ type: 'bt:request-bookmarks-page', cursor }, '*')` and `document.dispatchEvent(new CustomEvent('bt:request-bookmarks-page', { detail: { cursor } }))`, then flush with `await new Promise((r) => setTimeout(r, 0))`. `document.currentScript` is null under vitest, so the script-element channel is not registered and the harness exercises two of the three real channels — enough to reproduce the duplicate-fetch defect.
    - Control the clock with `vi.spyOn(Date, 'now')` backed by a mutable number (NOT `vi.useFakeTimers()`, which fights the awaited flushes).

Cases:
    - Test 1 (multi-channel dedupe): one `requestPage('CURSOR_A')` — stub called exactly once.
    - Test 2 (repeat request dedupe): `requestPage('CURSOR_A')` twice — stub still called exactly once in total.
    - Test 3 (distinct cursor still fetches): `requestPage('CURSOR_A')` then `requestPage('CURSOR_B')` — stub called exactly twice, and the second call's URL carries `CURSOR_B`.
    - Test 4 (empty cursor is a fresh start): two `requestPage('')` calls at the same mocked timestamp produce exactly one fetch; after advancing mocked `Date.now()` past the fresh-start window, another `requestPage('')` fetches again, and a following `requestPage('CURSOR_A')` also fetches — proving a re-sync can re-walk an already-fetched cursor.
    - Test 5 (no wedge on failure): make the stub reject once, `requestPage('CURSOR_A')`, flush, then `requestPage('CURSOR_B')` — the second cursor still fetches, proving the in-flight guard was released.
  </behavior>

  <action>
In `entrypoints/bridge.ts` only, add three module-scoped variables next to `lastBookmarksTemplate` — a boolean in-flight flag, the last requested cursor string (initialised to a sentinel that no real cursor and no empty string can equal, e.g. `null`), and the timestamp of that last request — plus one small constant for the fresh-start dedupe window (1500 ms is right; a user-initiated re-sync always lands well outside it).

Then restructure the head of `fetchBookmarksPage(cursor)` in this exact order:
1. Keep the existing `lastBookmarksTemplate` absence check first, unchanged — it emits `bt:graphql-bookmarks-error` with reason `no_template` and returns without touching any guard, so a later retry with the same cursor is still allowed (the capture engine's auto-scroll fallback depends on that path).
2. Normalise the argument once by trimming it into a local `const`, and read `Date.now()` once into a local.
3. Return early if the in-flight flag is set — only one page fetch may be outstanding at a time. This is what collapses the same-tick CustomEvent burst.
4. If the normalised cursor is non-empty and equals the remembered last requested cursor, return early. A repeated non-empty cursor is never a legitimate new page: repeated-cursor is the termination signal the capture engine relies on, so refetching it can only duplicate work.
5. If the normalised cursor is empty, treat it as "fresh sync start": return early only when the remembered cursor is also the empty string AND the elapsed time since the remembered timestamp is under the fresh-start window. Otherwise let it through. Because the guard remembers only the LAST cursor, letting an empty cursor through overwrites that memory, which is exactly the required reset — a re-sync can then re-fetch cursors it walked earlier.
6. Set the in-flight flag to true and record the normalised cursor (including the empty string) and the timestamp, all synchronously before the first `await`, so same-tick duplicates observe the flag.
7. Wrap the existing fetch body by adding a `finally` clause to its existing `try`/`catch` that clears the in-flight flag. Do not nest a second `try`, and leave the existing `catch` (which emits the `fetch_failed` error event) as-is.

Leave the three `bt:request-bookmarks-page` listeners (window `message`, script element, `document`) exactly as they are — they stay redundant on purpose; the guards above are what make the redundancy safe. Leave `extractShape`, the fetch/XHR patches, and the history patches untouched.
  </action>

  <verify>
    <automated>bun run test tests/unit/bookmarks-sync-dedupe.test.ts</automated>
  </verify>

  <done>`tests/unit/bookmarks-sync-dedupe.test.ts` exists with the five cases above and all pass; `entrypoints/bridge.ts` contains the in-flight + last-cursor + timestamp guards inside `fetchBookmarksPage` with the flag cleared in a `finally`; the three request listeners are unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Stop treating an empty page as terminal, then verify and commit scoped</name>
  <files>features/bookmarks/capture-engine.ts</files>
  <read_first>features/bookmarks/capture-engine.ts lines 105-137 (`isComplete` / `nextStatus` / the stop-vs-continue branch), features/bookmarks/extractor.ts lines 100-110 (an entries-less payload already returns `bottomCursor: null`)</read_first>

  <action>
One small edit in `handleBookmarksPayload`: drop the extracted-items-count clause from the three-way `isComplete` expression, leaving exactly two termination signals — `extraction.bottomCursor === null` and `extraction.bottomCursor === syncState.cursor`. Keep both of those, and keep every other line of the function (status mapping, cursor checkpoint write, `totalCaptured`, the `stopDirectGraphqlSync()` / `stopAutoScrollSync()` branch, the `triggerNextPageFetch` branch) byte-identical.

Why this is safe and bounded: the extractor already returns a null `bottomCursor` when a payload carries no entries at all, so the only behaviour that changes is the narrow case "X handed back a NEW cursor but no extractable tweets" — which should keep paging, not declare the collection exhausted. Unbounded paging is impossible because each distinct cursor is now fetched at most once (Task 1) and X's timeline terminates by repeating its bottom cursor or returning none.

Do not adjust the repeated-cursor comparison or the null-cursor comparison, and do not add retry counters, backoff, or any other new state to this file.

Then run the full verification below, and commit with paths listed explicitly — `entrypoints/bridge.ts`, `features/bookmarks/capture-engine.ts`, `tests/unit/bookmarks-sync-dedupe.test.ts` — so the unrelated uncommitted engagement / DevToolsPanel / popup / registry / storage / background changes in the working tree stay out of the commit. Never use `git add -A` or `git commit -a` here.
  </action>

  <verify>
    <automated>bun run test</automated>
    <automated>bun run compile</automated>
    <automated>grep -c "extraction.bottomCursor === syncState.cursor" features/bookmarks/capture-engine.ts</automated>
    <automated>grep -v '^[[:space:]]*//' features/bookmarks/capture-engine.ts | grep -c "extraction.items.length === 0"</automated>
    <automated>git show --stat --name-only HEAD</automated>
  </verify>

  <done>Full suite green at 34+1 files / 294+5 or more tests (baseline before this plan: 34 files, 294 tests, all passing); `bun run compile` emits no output; the repeated-cursor grep reports 1; the comment-filtered items-count grep reports 0; the committed file list contains exactly the three files this plan touches and none of the pre-existing unrelated changes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| x.com page (MAIN world) -> bridge script | The bridge runs in the page's own execution context; page-controlled data reaches `extractShape` and the request template. |
| bridge (MAIN world) -> content script (isolated world) | `bt:graphql-bookmarks` CustomEvents cross the world boundary and drive storage writes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-lif-01 | Denial of Service | `fetchBookmarksPage` in-flight guard | medium | mitigate | Clear the flag in a `finally` so a rejected fetch cannot leave sync permanently unable to request another page. |
| T-lif-02 | Denial of Service | cursor-repeat guard vs. X pagination | low | accept | Blocking a repeated non-empty cursor can only skip a fetch the capture engine already treats as terminal; an empty cursor always resets the memory so a user re-sync is never locked out. |
| T-lif-03 | Tampering | dependency installs | low | accept | No package-manager installs in this plan — no `package.json` change, no new permissions, no new `web_accessible_resources`. Package-legitimacy gate not applicable. |
</threat_model>

<verification>
- `bun run test` — whole unit suite, including the new dedupe file.
- `bun run compile` — `tsc --noEmit` clean.
- Manual (optional, live x.com): open `/i/bookmarks` on an account with several hundred bookmarks, start sync from the popup, and confirm `totalCaptured` climbs well past ~60 and `status` stays `syncing` until the timeline genuinely runs out.
</verification>

<success_criteria>
- One logical page request yields exactly one outbound GraphQL fetch across all delivery channels.
- Sync no longer self-terminates from a duplicated response re-reading an already-advanced cursor checkpoint.
- Termination still happens on a null bottom cursor or a repeated bottom cursor.
- A fresh (empty-cursor) sync still works after a prior sync.
- Diff limited to three files; commit excludes all pre-existing unrelated working-tree changes.
</success_criteria>

<output>
Commit message: `fix(bookmarks): dedupe bridge page fetches so sync no longer stops early`
</output>
