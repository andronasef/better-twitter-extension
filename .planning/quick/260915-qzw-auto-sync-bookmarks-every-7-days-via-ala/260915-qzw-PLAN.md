---
id: 260915-qzw
slug: auto-sync-bookmarks-every-7-days-via-alarms
date: 2026-09-15
workflow: quick
phase: quick-260915-qzw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - features/bookmarks/types.ts
  - features/bookmarks/auto-sync.ts
  - lib/storage.ts
  - entrypoints/background.ts
  - entrypoints/x.content/index.ts
  - entrypoints/popup/BookmarksPanel.tsx
  - wxt.config.ts
  - scripts/audit-build.mjs
  - scripts/package-cws.ts
  - tests/unit/bookmarks-auto-sync.test.ts
  - tests/unit/bookmarks-popup.test.ts
autonomous: true
requirements: [BOOK-02]

estimate:
  tokens: 68000
  raw_tokens: 45000
  tasks: 3
  confidence: low   # no calibration samples for this repo yet

must_haves:
  truths:
    - A periodic 7-day `chrome.alarms` alarm exists after install and survives browser restarts without having its countdown reset.
    - When that alarm fires and auto-sync is enabled, the extension records that a sync is due (`dueSince`) and the MV3 service worker does nothing else — it never fetches, so it can sleep freely.
    - The next time the user lands on an X bookmarks route with a sync due, the existing `syncBookmarksBackground()` runs once, without opening any background tab.
    - Once a sync has run (opportunistically or from the popup's Sync button), the due flag clears and `lastAutoSyncAt` is stamped.
    - The opportunistic trigger fires at most once per content-script page session, never off a bookmarks route, never while a sync is already in flight, and never when the user turned auto-sync off.
    - The popup exposes an "Auto-sync every 7 days" switch bound to the stored `enabled` field, and surfaces an unobtrusive overdue hint near the Sync button while a sync is due.
    - The standing build gate still passes with the newly declared `alarms` permission, and the permission allow-list in both audit scripts still rejects any permission outside that list.
  artifacts:
    - features/bookmarks/types.ts — `BookmarkAutoSyncState` interface next to `BookmarkSyncState`
    - lib/storage.ts — `bookmarkAutoSyncItem` (`local:bookmarkAutoSync`, version 1)
    - features/bookmarks/auto-sync.ts — the only new module; alarm constants plus due-state logic
    - entrypoints/background.ts — alarm creation on install/startup and the `onAlarm` listener
    - entrypoints/x.content/index.ts — opportunistic call inside the existing bookmarks-route branch of `setupPage()`
    - entrypoints/popup/BookmarksPanel.tsx — auto-sync switch, overdue hint, manual-sync clears due
    - wxt.config.ts — `alarms` added to `manifest.permissions`
    - scripts/audit-build.mjs + scripts/package-cws.ts — permission assertions widened to an explicit allow-list
    - tests/unit/bookmarks-auto-sync.test.ts — one new vitest file
    - tests/unit/bookmarks-popup.test.ts — three appended cases
  key_links:
    - background `browser.alarms.onAlarm` <-> `handleAutoSyncAlarm` <-> `bookmarkAutoSyncItem.dueSince`
    - content-script `setupPage()` bookmarks branch <-> `runOpportunisticAutoSync` <-> `captureEngine.syncBookmarksBackground()`
    - `markAutoSyncSatisfied()` <-> both the opportunistic path and the popup's manual Sync button
    - `wxt.config.ts` permissions <-> `scripts/audit-build.mjs` Assertion 1 <-> `scripts/package-cws.ts` permission gate
---

<objective>
Make bookmark sync happen on its own roughly every 7 days, without the service worker ever fetching and without opening a background tab.

The hard constraint driving the whole design: sync CANNOT run in the MV3 service worker. `entrypoints/bridge.ts` only learns X's GraphQL request template (docId, headers, csrf token, feature flags) by observing a real Bookmarks request on the page, so a sync requires a live x.com bookmarks tab. Auto-opening one was explicitly rejected (Chrome Web Store scrutiny + visible tab churn). The chosen shape is therefore **opportunistic + manual fallback**: an alarm only ever writes a "a sync is due" flag; the content script cashes that flag in the next time the user visits their bookmarks; the popup exposes the toggle and an overdue hint so the user can act sooner.

Purpose: unattended bookmark freshness with zero new network behaviour, zero new tab behaviour, and exactly one new permission.
Output: one new source module, one new storage item, one new test file, and small edits to eight existing files.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@wxt.config.ts
@entrypoints/background.ts
@entrypoints/x.content/index.ts
@features/bookmarks/capture-engine.ts
@features/bookmarks/routes.ts
@features/bookmarks/types.ts
@lib/storage.ts
@entrypoints/popup/BookmarksPanel.tsx
@tests/unit/bookmarks-capture.test.ts
@tests/unit/bookmarks-popup.test.ts
</context>

<scope_guard>
Do NOT change the sync mechanics themselves. `syncBookmarksBackground`, `handleBookmarksPayload`, `runAutoScrollLoop`, `triggerNextPageFetch`, the bridge, and the extractor are all off-limits. This plan only decides *when* `syncBookmarksBackground()` gets called.

Do NOT add the `tabs` permission, and do NOT add any code that opens, creates, or navigates a tab on the extension's own initiative. `alarms` is the only new permission.

Do NOT migrate `bookmarkSyncItem` or `bookmarksSettingsItem`. The new state deliberately lives in its own storage item precisely so neither existing schema needs a version bump.

Do NOT introduce any abstraction beyond the single new `features/bookmarks/auto-sync.ts` module and the single new storage item. No scheduler class, no event bus, no retry/backoff engine.

Do NOT restyle the popup. The only visual additions are one toggle row that copies the existing toggle markup verbatim and one muted text line.

`features/bookmarks/auto-sync.ts` is imported by BOTH the background service worker and the content script. It must therefore touch `browser.alarms` only inside function bodies (never at module scope), and must not import anything that reaches `window`/`document` at module load — `@/lib/storage` and `./routes` are safe; `./capture-engine` and `@/entrypoints/x.content/bridge-client` are NOT and must not be imported here.

**Committing is the orchestrator's job.** Do not run `git add`, `git commit`, or any other git mutation in this plan. The working tree already carries unrelated uncommitted work (the engagement feature, `DevToolsPanel`, and edits to `popup/App.tsx`, `lib/registry.ts`, `lib/storage.ts`, `entrypoints/background.ts`, `entrypoints/x.content/index.ts`) — several of those are files this plan also edits, so no per-file scoped commit is even possible here. Leave the tree dirty and report what changed.
</scope_guard>

<research_note>
Verified before planning, so the executor does not have to re-derive it:

- **`fakeBrowser` DOES implement alarms.** `@webext-core/fake-browser` (WXT 0.21.4's testing backend, re-exported as `wxt/testing/fake-browser`) ships a real in-memory `alarms` API — `create`, `get`, `getAll`, `clear`, `clearAll`, a `resetState()` wired into `fakeBrowser.reset()`, and `onAlarm` built from `defineEventWithTrigger()` so `fakeBrowser.alarms.onAlarm.trigger(alarm)` synchronously invokes registered listeners. No stubbing workaround is needed. (If a future version regresses this, the fallback is to test `markAutoSyncDue()` directly and skip only the two alarm-delivery cases — the due-state logic does not depend on the alarms API.)
- **Adding a permission WILL break the standing build gate unless the audit scripts are updated too.** `scripts/audit-build.mjs` Assertion 1 and `scripts/package-cws.ts` both hard-assert `permissions.length !== 1 || permissions[0] !== 'storage'`. Widening those to an explicit allow-list is a required, in-scope consequence of declaring `alarms` — not scope creep.
</research_note>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Due-state core — storage item plus the auto-sync module, end to end</name>
  <files>features/bookmarks/types.ts, lib/storage.ts, features/bookmarks/auto-sync.ts, tests/unit/bookmarks-auto-sync.test.ts</files>
  <read_first>features/bookmarks/types.ts (`BookmarkSyncState` — put the new interface directly after it), lib/storage.ts (the `defineItem` shape used by `bookmarkSyncItem`, and the grouped type import block at the top), features/bookmarks/routes.ts (`isBookmarksRoute` is pure and safe to import anywhere), tests/unit/bookmarks-capture.test.ts and tests/unit/reactions-storage.test.ts (test conventions: plain `describe`/`it`, `vi`, `@/` alias, `fakeBrowser.reset()` first in `beforeEach`, WxtVitest + happy-dom, no environment pragma)</read_first>

  <behavior>
Write `tests/unit/bookmarks-auto-sync.test.ts` FIRST, watch it fail, then implement.

Harness shape:
    - `import { fakeBrowser } from 'wxt/testing/fake-browser';` and call `fakeBrowser.reset()` as the FIRST statement in `beforeEach`, before seeding any storage value — reset clears both fake storage and the fake alarm list.
    - After reset, seed `bookmarkAutoSyncItem` and `bookmarkSyncItem` explicitly per test rather than relying on fallbacks, so each case states its own preconditions.
    - Call `__resetAutoSyncSessionGuard()` in `beforeEach` too — the once-per-page-session flag is module scope and vitest resets modules per FILE, not per test.
    - Use a `vi.fn()` as the `trigger` argument and assert on its call count. Do not import `capture-engine` into this test file.

Cases:
    - Test 1: `markAutoSyncDue(1000)` on `{ enabled: true, dueSince: null }` sets `dueSince` to `1000` and returns `true`.
    - Test 2: `markAutoSyncDue()` on `{ enabled: false }` leaves the stored record byte-identical and returns `false`.
    - Test 3: `markAutoSyncDue(2000)` on a record that already has `dueSince: 1000` leaves it at `1000` and returns `false`.
    - Test 4: `fakeBrowser.alarms.onAlarm.addListener(handleAutoSyncAlarm)` then `await fakeBrowser.alarms.onAlarm.trigger({ name: AUTOSYNC_ALARM_NAME, scheduledTime: Date.now() })` results in a non-null `dueSince`.
    - Test 5: the same listener triggered with `{ name: 'something-else', scheduledTime: Date.now() }` leaves `dueSince` null.
    - Test 6: `await ensureAutoSyncAlarm()` registers exactly one alarm named `AUTOSYNC_ALARM_NAME` whose `periodInMinutes` is `AUTOSYNC_PERIOD_MINUTES`; with `vi.spyOn(fakeBrowser.alarms, 'create')` installed, a SECOND `await ensureAutoSyncAlarm()` does not call `create` again (the existing schedule is preserved, not reset).
    - Test 7 (the happy path): with `{ enabled: true, dueSince: 1000 }`, `bookmarkSyncItem.status: 'idle'`, and `pathname: '/i/bookmarks'`, `runOpportunisticAutoSync` calls the trigger exactly once, returns `true`, and afterwards the stored record has `dueSince: null` and a non-null `lastAutoSyncAt`.
    - Test 8: `dueSince: null` — trigger not called, returns `false`.
    - Test 9: `enabled: false` with `dueSince: 1000` — trigger not called, returns `false`, `dueSince` still `1000`.
    - Test 10: `pathname: '/home'` with everything else satisfied — trigger not called, returns `false`, `dueSince` still `1000`.
    - Test 11: `bookmarkSyncItem.status: 'syncing'` with everything else satisfied — trigger not called, returns `false`, `dueSince` still `1000`.
    - Test 12 (session guard): two back-to-back awaited `runOpportunisticAutoSync` calls, both fully satisfied (re-seed `dueSince` between them so only the guard can block the second) — the trigger is called exactly once in total and the second call returns `false`.
  </behavior>

  <action>
Three source edits, in this order.

**1. `features/bookmarks/types.ts`** — add one exported interface immediately after `BookmarkSyncState`, with three fields: a boolean for whether the user wants auto-sync at all, a nullable number for the timestamp of the last completed auto-sync, and a nullable number for the timestamp at which a sync first became due. Nothing else in this file changes.

**2. `lib/storage.ts`** — add the new interface to the existing grouped `import type { ... } from '@/features/bookmarks/types'` block, then declare a new `storage.defineItem` for key `local:bookmarkAutoSync` at `version: 1`, placed directly after `bookmarkSyncItem`. Its fallback enables auto-sync and leaves both timestamps null. Do NOT touch `bookmarkSyncItem`, `bookmarksSettingsItem`, or any existing `migrations` map — the whole point of a separate item is that no existing schema moves.

**3. `features/bookmarks/auto-sync.ts`** (new file, the ONLY new module in this plan) — imports limited to `bookmarkAutoSyncItem` + `bookmarkSyncItem` from `@/lib/storage` and `isBookmarksRoute` from `./routes`. It exports exactly these, and nothing more:

- Two constants: the alarm name (the project's `bt:` prefix followed by a bookmark-autosync identifier) and the period in minutes, which is 7 days expressed in minutes. Give the period constant a short comment naming the day count so the magic number reads.
- `ensureAutoSyncAlarm(): Promise<void>` — `await browser.alarms.get(name)` first and return early if an alarm already exists; only create otherwise, passing `periodInMinutes` and nothing else (no `when`, no `delayInMinutes`, so the first fire lands one full period out). The get-then-create ordering matters: the background calls this on every browser startup, and an unconditional `create` would silently reset the 7-day countdown on every restart, so a user who restarts Chrome daily would never see the alarm fire at all. Wrap the body in try/catch and swallow — a missing `alarms` API must never take down background startup.
- `handleAutoSyncAlarm(alarm): Promise<void>` — return immediately unless `alarm?.name` equals the alarm-name constant, otherwise delegate to `markAutoSyncDue()`. Never throws.
- `markAutoSyncDue(now = Date.now()): Promise<boolean>` — read the item; return `false` if auto-sync is disabled; return `false` if a due timestamp is already recorded (do not restamp — the point is "first became due"); otherwise write the record back with the due timestamp set to `now` and return `true`.
- `markAutoSyncSatisfied(now = Date.now()): Promise<void>` — read the item, write it back with the due timestamp cleared to null and the last-auto-sync timestamp set to `now`. Unconditional: it runs after a sync actually started, whether that sync was opportunistic or user-initiated from the popup.
- `runOpportunisticAutoSync(opts: { pathname: string; trigger: () => void | Promise<void>; now?: number }): Promise<boolean>` — the guards, in this exact order, each returning `false` on failure: (a) `isBookmarksRoute(opts.pathname)`; (b) the module-scoped once-per-session flag is not already set; (c) the stored record has auto-sync enabled; (d) the stored record has a non-null due timestamp; (e) `bookmarkSyncItem`'s `status` is not `'syncing'`. Route and session checks come first because they are synchronous and by far the most common rejections. Only after all five pass: set the session flag to `true` BEFORE awaiting anything else (so a concurrent caller in the same tick cannot slip through), `await opts.trigger()`, then `await markAutoSyncSatisfied(opts.now)`, then return `true`. Wrap the trigger-and-satisfy pair in try/catch: on throw, reset the session flag back to `false`, leave the due timestamp untouched so the sync stays due, and return `false`.
- `__resetAutoSyncSessionGuard(): void` — sets the module flag back to `false`. Test-only seam; say so in a one-line comment above it.

The session flag is a plain module-level `let` — its lifetime is the content script's page session, which is exactly the required "once per page session" scope.
  </action>

  <verify>
    <automated>bun run test tests/unit/bookmarks-auto-sync.test.ts</automated>
    <automated>bun run compile</automated>
  </verify>

  <done>`tests/unit/bookmarks-auto-sync.test.ts` exists with all twelve cases above and every one passes; `features/bookmarks/auto-sync.ts` exists exporting exactly the seven names listed and imports nothing from `capture-engine` or `bridge-client`; `bookmarkAutoSyncItem` is defined in `lib/storage.ts` at version 1 with no change to any existing item's version or migrations; `bun run compile` emits no output.</done>
</task>

<task type="auto">
  <name>Task 2: Wire the alarm into the extension and widen the permission allow-lists</name>
  <files>wxt.config.ts, entrypoints/background.ts, entrypoints/x.content/index.ts, scripts/audit-build.mjs, scripts/package-cws.ts</files>
  <read_first>wxt.config.ts (the whole file — it is 25 lines), entrypoints/background.ts lines 28-47 (the existing `runtime.onInstalled` listener), entrypoints/x.content/index.ts lines 128-157 (the bookmarks-route branch inside `setupPage()`), scripts/audit-build.mjs lines 1-12 and 53-60 (the header docstring and Assertion 1), scripts/package-cws.ts lines 138-172 (the permission gate and the numbered success lines)</read_first>

  <action>
**1. `wxt.config.ts`** — add the alarms permission to the existing `manifest.permissions` array. Nothing else in the manifest changes: no host permissions, no new `web_accessible_resources`, no `tabs`.

**2. `entrypoints/background.ts`** — import `ensureAutoSyncAlarm` and `handleAutoSyncAlarm` from `@/features/bookmarks/auto-sync`, then make three small additions inside the existing `defineBackground` callback:
   - Call `ensureAutoSyncAlarm()` near the top of the EXISTING `browser.runtime.onInstalled` listener, before the `details.reason` branching, so it runs for install and update alike. Chain `.catch(() => {})` in the house style.
   - Add a new `browser.runtime.onStartup` listener that does the same single call. This is what re-establishes the alarm after a browser restart; because `ensureAutoSyncAlarm` checks for an existing alarm first, the pending countdown is preserved rather than reset.
   - Register `browser.alarms.onAlarm` at TOP level of the callback (not nested inside any other listener) — MV3 requires listeners to be registered synchronously on every service-worker wake or the event is missed while the worker is asleep. The handler body is a single delegation to `handleAutoSyncAlarm(alarm)` with `.catch(() => {})`.

   Do not touch `configureUninstallUrl`, the engagement-state initialisation, `syncBadge`, or the existing `onMessage` listener. In particular, do not extend the `bt:start-sync` message path — the service worker still never fetches and never opens a tab on its own initiative here; its entire contribution is writing one timestamp.

**3. `entrypoints/x.content/index.ts`** — import `runOpportunisticAutoSync` from `@/features/bookmarks/auto-sync`, and inside `setupPage()`'s existing `if (isBookmarksRoute(path)) { ... }` branch, directly after the existing `bookmarkSyncItem.getValue()` resume check, add one fire-and-forget call passing the local `path` as `pathname` and an arrow that invokes `captureEngine.syncBookmarksBackground()` as `trigger`, with `.catch(() => {})` appended. Put it in that branch rather than in `captureEngine.init()` because `setupPage()` is the one place that runs both on initial load AND on every client-side route change, so it also catches a user who SPA-navigates to bookmarks mid-session — `captureEngine.init()` runs once at `document_start` and would miss that.

   The two calls cannot fight each other: if the pre-existing resume check finds `status === 'syncing'` and restarts the sync, guard (e) inside `runOpportunisticAutoSync` sees the same `'syncing'` status and declines. Leave the resume check, `mountBookmarksHub`, the else-branch teardown, and everything else in `setupPage()` untouched.

**4. `scripts/audit-build.mjs`** — Assertion 1 currently requires the permission array to be a single fixed entry, which the new manifest now fails. Replace that length-and-index check with an explicit module-scope allow-list array holding the storage and alarms permission names, and assert instead that (a) every declared permission is a member of the allow-list and (b) no permission is declared twice. Keep the failure message informative by including the offending entries and the allow-list. Leave the `host_permissions` half of Assertion 1 exactly as it is, leave Assertions 2-5 untouched, and keep the assertion count at five (the trailing summary line still says five). Update the file's header docstring line for invariant 1 so it describes an allow-list rather than a single permission.

   Widening rather than deleting matters: this gate is the thing that stops an unreviewed permission from reaching the Chrome Web Store, so it must still reject anything outside the two named entries.

**5. `scripts/package-cws.ts`** — apply the identical change to its permission gate (same allow-list semantics, same membership + no-duplicates rules, same `process.exit(1)` on failure), leave the host-permission and wildcard checks alone, and reword the numbered success line about permissions so it reports the allow-list instead of a single permission. Do not renumber the success lines and do not change the hardcoded test count in the line above it.
  </action>

  <verify>
    <automated>bun run compile</automated>
    <automated>bun run test</automated>
    <automated>bun run build</automated>
    <automated>grep -c "alarms" wxt.config.ts</automated>
    <automated>grep -c "onStartup" entrypoints/background.ts</automated>
    <automated>grep -c "alarms.onAlarm.addListener" entrypoints/background.ts</automated>
    <automated>grep -c "runOpportunisticAutoSync" entrypoints/x.content/index.ts</automated>
    <automated>grep -v '^[[:space:]]*//' scripts/audit-build.mjs | grep -c "permissions\[0\]"</automated>
    <automated>find .output -maxdepth 2 -name manifest.json -path '*chrome*' -exec grep -c '"alarms"' {} +</automated>
  </verify>

  <done>`bun run build` completes and the audit script reports all five assertions passing against a manifest that now declares two permissions; the built-manifest find/grep reports at least 1 for the chrome output manifest (proving the permission actually reached the built artifact, since the allow-list alone would also tolerate its absence); `bun run test` is fully green; `bun run compile` emits no output; the alarms grep on the config reports 1, the startup and alarm-listener greps on the background each report 1, the opportunistic grep on the content entrypoint reports 2 (import plus call site), and the comment-filtered index-check grep on the audit script reports 0.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Popup toggle, overdue hint, and manual-sync clears the due flag</name>
  <files>entrypoints/popup/BookmarksPanel.tsx, tests/unit/bookmarks-popup.test.ts</files>
  <read_first>entrypoints/popup/BookmarksPanel.tsx lines 76-125 (the `loadAll` + watcher `useEffect`), lines 145-162 (`handleToggleResurfacing` / `handleToggleAskFolder` — copy their shape), lines 216-232 (the head of `handleSyncClick`), lines 330-380 (the header sync card and its CTA button), lines 675-694 (the Settings section card and the ask-folder toggle markup to mirror), components/ui/switch.tsx (the Radix `Switch` renders a `button[role="switch"]` and forwards `id`), tests/unit/bookmarks-popup.test.ts (render convention: `createRoot` + `await act(async () => root.render(React.createElement(BookmarksPanel)))`, assertions against `container.textContent`, `root.unmount()` at the end of each case)</read_first>

  <behavior>
Append three cases to `tests/unit/bookmarks-popup.test.ts`, and first extend its `beforeEach` to seed `bookmarkAutoSyncItem` with auto-sync enabled and both timestamps null — that file's `beforeEach` seeds storage without a `fakeBrowser.reset()`, so without an explicit seed the new state would leak between cases.

    - Test A (toggle renders): render the panel and assert the auto-sync label text is present in `container.textContent`.
    - Test B (overdue hint is conditional): with the seeded record (no due timestamp) the overdue text is absent; then re-seed the record with a due timestamp, re-render, and assert the overdue text IS present. Keep `bookmarkSyncItem.status` at `'idle'` for this case.
    - Test C (toggle persists): render, `container.querySelector('button[role="switch"]#toggle-auto-sync')`, click it inside `await act(async () => { btn.click(); })`, then read `bookmarkAutoSyncItem` back and assert auto-sync is now disabled while both timestamps are unchanged.
  </behavior>

  <action>
All edits in `entrypoints/popup/BookmarksPanel.tsx`; no other source file changes.

**State and wiring** — import `bookmarkAutoSyncItem` from `@/lib/storage`, the new state type from `@/features/bookmarks/types`, and `markAutoSyncSatisfied` from `@/features/bookmarks/auto-sync`. Add one `useState` for the auto-sync record initialised to the same defaults as the storage fallback, add `bookmarkAutoSyncItem.getValue()` to the existing `Promise.all` in `loadAll` (and its `setState` alongside the others), and add a `bookmarkAutoSyncItem.watch(...)` subscription next to the existing four watchers — including its unsubscribe in the cleanup return, matching the existing pattern exactly.

**Toggle handler** — add `handleToggleAutoSync` modelled byte-for-byte on `handleToggleAskFolder`: build the next record by spreading the current one and replacing only the enabled field, `setState` optimistically, then persist. Do not clear or set either timestamp here — turning the feature off must not erase the fact that a sync is due, so that re-enabling restores the prior state rather than silently resetting the clock.

**Toggle markup** — in the Settings section (the card currently holding only the ask-folder row), the card `div` is itself the flex row. Convert it minimally: keep every class on that card except swap its `flex items-center justify-between` for `space-y-4`, wrap the existing label-block-plus-`Switch` contents in a new `div` carrying exactly the `flex items-center justify-between` classes that were removed, then add a second sibling `div` for the new row. Give that second row the same `pt-2 border-t border-[var(--bt-border,#2f3336)]` separator treatment the resurfacing card already uses for its second block, plus the same `flex items-center justify-between`. Inside it, mirror the ask-folder row exactly: a `label` with `htmlFor="toggle-auto-sync"` and the identical label classes reading as an auto-sync-every-7-days title, a muted `span` beneath it with the identical helper-text classes explaining that syncing happens the next time the user opens Bookmarks on X, and a `Switch` with `id="toggle-auto-sync"`, `checked` bound to the record's enabled field, and `onCheckedChange={handleToggleAutoSync}`. Reuse the existing class strings verbatim — no new colours, sizes, spacing scales, or icons.

**Overdue hint** — in the header sync card (section 1), immediately after the primary CTA `button` and before the existing paused/error banner, render a conditional single-line `<p>` shown only when the record has a due timestamp AND `isSyncing` is false. Style it with the already-used muted 12px treatment (`text-[12px] text-[var(--bt-fg-muted,#71767b)]`) plus `text-center`; its copy states that a sync is overdue and that it will run the next time the user opens Bookmarks on X. No icon, no border, no background — it must read as a hint, not a second banner alongside the existing warning banner directly below it.

**Manual sync satisfies the due flag** — in `handleSyncClick`, immediately after the existing `await bookmarkSyncItem.setValue({...status: 'syncing'...})` and before the `browser.tabs.query` block, `await markAutoSyncSatisfied();`. Without this the overdue hint would survive a user-initiated sync forever: the popup's Sync button flips status to `'syncing'` before the bookmarks tab loads, and the opportunistic path then correctly declines (guard (e)), so nothing else would ever clear the flag. Everything else in `handleSyncClick` — the optimistic `setSyncState`, the tab query, the navigation fallbacks — stays exactly as it is.
  </action>

  <verify>
    <automated>bun run test tests/unit/bookmarks-popup.test.ts</automated>
    <automated>bun run test</automated>
    <automated>bun run compile</automated>
    <automated>grep -c "toggle-auto-sync" entrypoints/popup/BookmarksPanel.tsx</automated>
    <automated>grep -c "markAutoSyncSatisfied" entrypoints/popup/BookmarksPanel.tsx</automated>
    <automated>grep -c "bookmarkAutoSyncItem.watch" entrypoints/popup/BookmarksPanel.tsx</automated>
  </verify>

  <done>All three appended popup cases pass; the full `bun run test` suite is green with the new auto-sync file and the three added popup cases included; `bun run compile` emits no output; the toggle-id grep reports 2 (label `htmlFor` plus `Switch` id), the satisfied-call grep reports 2 (import plus call), and the watcher grep reports 1.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Chrome alarms scheduler -> background service worker | A platform-triggered wake-up crosses into extension code and causes a storage write. |
| background service worker -> `chrome.storage.local` | The only thing the alarm path is allowed to touch. |
| x.com page (content script) -> `syncBookmarksBackground()` | Page presence and route are what authorise the sync to actually run. |
| popup -> `chrome.storage.local` | User-facing toggle writes the enabled flag read by both other contexts. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qzw-01 | Elevation of Privilege | new `alarms` manifest permission | medium | mitigate | Declare `alarms` and nothing else; keep the audit allow-list in `scripts/audit-build.mjs` and `scripts/package-cws.ts` as a hard membership check so no further permission can slip in unreviewed, and keep `host_permissions` assertions untouched. |
| T-qzw-02 | Denial of Service | `runOpportunisticAutoSync` session guard | medium | mitigate | Guard is a per-page-session flag reset on every content-script load; a throwing `trigger` releases it in the catch and leaves `dueSince` intact, so a failed attempt can never permanently wedge auto-sync. |
| T-qzw-03 | Denial of Service | alarm re-creation on browser startup | medium | mitigate | `ensureAutoSyncAlarm` does get-then-create, so a daily browser restart cannot indefinitely reset the 7-day countdown and starve the feature. |
| T-qzw-04 | Information Disclosure | background alarm handler | low | accept | The handler writes one local timestamp and performs no fetch, no message send, and no tab access; no data leaves the device and no new host is contacted. |
| T-qzw-05 | Tampering | dependency installs | low | accept | No package-manager installs in this plan — `package.json` is untouched, so the package-legitimacy gate is not applicable. |
| T-qzw-06 | Repudiation | user-facing auto-sync control | low | mitigate | The behaviour is disclosed and user-controllable via the popup switch bound to the stored `enabled` field, and the overdue hint makes pending activity visible rather than silent. |
</threat_model>

<verification>
- `bun run test` — full unit suite, including the new `bookmarks-auto-sync` file and the three appended popup cases.
- `bun run compile` — `tsc --noEmit` clean.
- `bun run build` — `wxt build` plus the standing audit gate, proving the widened permission allow-list accepts the new manifest and still enforces its other four invariants.
- <human-check>Load the unpacked build, open `chrome://extensions` -> service worker -> console, and confirm an alarm named for bookmark auto-sync appears under `chrome.alarms.getAll()`. Then set the stored `dueSince` manually (popup Dev Tools or the service-worker console), navigate to `x.com/i/bookmarks`, and confirm a sync starts on its own exactly once, the overdue hint disappears from the popup afterwards, and `lastAutoSyncAt` is stamped. Finally toggle the popup switch off, restore `dueSince`, reload bookmarks, and confirm nothing fires.</human-check>
</verification>

<success_criteria>
- A 7-day periodic alarm is created on install and re-established (not restarted) on every browser startup.
- The alarm handler writes exactly one timestamp and nothing else; the service worker performs no fetch and opens no tab.
- Visiting an X bookmarks route with a sync due runs the existing `syncBookmarksBackground()` once per page session, and clears the due flag afterwards.
- The opportunistic trigger declines off-route, while disabled, while already syncing, and on repeat within the same page session.
- The popup switch controls the stored enabled flag, the overdue hint appears only while a sync is due and not in flight, and a manual Sync clears the due flag.
- No existing storage schema version changed, no sync mechanics changed, and `alarms` is the only permission added.
- Standing gate green: `bun run test`, `bun run compile`, and `bun run build` all pass.
</success_criteria>

<output>
Create `.planning/quick/260915-qzw-auto-sync-bookmarks-every-7-days-via-ala/260915-qzw-SUMMARY.md` when done.

Do NOT commit. The orchestrator owns committing; the working tree legitimately contains unrelated in-flight work in several of the same files. Report the changed-file list in the summary instead.

Suggested commit message for the orchestrator: `feat(bookmarks): auto-sync every 7 days via alarms with opportunistic trigger`
</output>
