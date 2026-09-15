---
id: 260915-qzw
slug: auto-sync-bookmarks-every-7-days
date: 2026-09-15
workflow: quick
status: complete
files_modified:
  - wxt.config.ts
  - lib/storage.ts
  - features/bookmarks/types.ts
  - features/bookmarks/auto-sync.ts
  - entrypoints/background.ts
  - entrypoints/x.content/index.ts
  - entrypoints/popup/BookmarksPanel.tsx
  - scripts/audit-build.mjs
  - scripts/package-cws.ts
  - tests/unit/bookmarks-auto-sync.test.ts
  - tests/unit/bookmarks-popup.test.ts
---

# Quick Task 260915-qzw — Bookmark auto-sync every 7 days

## Constraint that shaped the design

Sync cannot run in the MV3 service worker. `entrypoints/bridge.ts` only learns X's GraphQL
request template (docId, headers, csrf, feature flags) by observing a real Bookmarks request
on the page, so a sync needs an open x.com bookmarks tab. The user rejected auto-opening a
background tab (CWS scrutiny + visible tab churn), so the chosen shape is opportunistic +
manual fallback.

## What was built

- `features/bookmarks/auto-sync.ts` (only new module): alarm constants, `ensureAutoSyncAlarm`
  (get-then-create so a browser restart does not reset the 7-day countdown),
  `handleAutoSyncAlarm`, `markAutoSyncDue` (never restamps — the value means "first became
  due"), `markAutoSyncSatisfied`, `runOpportunisticAutoSync` (route → session guard → enabled
  → due → not already syncing), and a test-only session-guard reset.
- `bookmarkAutoSyncItem` (`local:bookmarkAutoSync`, v1) as a SEPARATE storage item so no
  existing schema needed a migration.
- Background: `ensureAutoSyncAlarm()` on `onInstalled` and `onStartup`; `alarms.onAlarm`
  registered at top level (MV3 drops events whose listener is not attached synchronously on
  service-worker wake). The worker only ever writes one timestamp — it never fetches.
- Content script: opportunistic trigger in `setupPage()`'s bookmarks branch, so it also
  catches SPA navigation to bookmarks mid-session.
- Popup: "Auto-sync every 7 days" switch, a muted "Sync is overdue" hint, and
  `markAutoSyncSatisfied()` on manual sync (otherwise the hint would never clear, since the
  popup flips status to `syncing` before the tab loads and the opportunistic path then
  correctly declines).
- `alarms` permission added. Both build gates (`scripts/audit-build.mjs` assertion 1 and
  `scripts/package-cws.ts`) hard-asserted `permissions === ['storage']` and would have failed
  the build, so each was widened to an explicit two-name allow-list that still rejects
  anything unreviewed and now also rejects duplicates.

## Verification

- `bun run test` — 36 files / 316 tests passing (14 new auto-sync cases, 3 new popup cases).
- `bun run compile` — clean.
- `bun run build` — audit passed 5/5; built manifest declares `["storage","alarms"]`.
- Not verified live: the 7-day alarm actually firing (would need a week, or Chrome's alarm
  debugging). The alarm→due→trigger path is covered by unit tests using fakeBrowser's alarms.
