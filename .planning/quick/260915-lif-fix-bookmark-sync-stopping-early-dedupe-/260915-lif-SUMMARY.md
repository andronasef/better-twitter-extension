---
id: 260915-lif
slug: fix-bookmark-sync-stopping-early-dedupe
date: 2026-09-15
workflow: quick
status: complete
commits:
  - c175b02
files_modified:
  - entrypoints/bridge.ts
  - features/bookmarks/capture-engine.ts
  - tests/unit/bookmarks-sync-dedupe.test.ts
---

# Quick Task 260915-lif — Bookmark sync stopped early (~60 captured)

## Root cause

`requestBookmarksPage(cursor)` (`entrypoints/x.content/bridge-client.ts:79`) emits each page
request on three channels — `window.postMessage`, a CustomEvent on the injected `<script>`
element, and a CustomEvent on `document` — and `entrypoints/bridge.ts` listens on all three.
One logical request therefore ran `fetchBookmarksPage()` up to 3x, each emitting
`bt:graphql-bookmarks`. The duplicates raced in `handleBookmarksPayload()`: the first write
advanced `syncState.cursor` to D, a duplicate then re-read state, saw
`extraction.bottomCursor === syncState.cursor`, computed `isComplete = true`, wrote
`status: 'complete'` and stopped both the direct-fetch and auto-scroll loops.

Reproduced empirically before the fix: the new test showed 2 outbound fetches per request
(2 of 3 channels are live under vitest — `document.currentScript` is null there).

## Fix

- `entrypoints/bridge.ts`: three module-scoped guards in `fetchBookmarksPage` — an in-flight
  flag (collapses the same-tick burst), a last-requested-cursor memory (a repeated non-empty
  cursor is never refetched), and a 1500 ms fresh-start window for the empty cursor. Guards
  are set synchronously before the first `await`; the flag clears in a `finally` so a failed
  page cannot wedge sync. The `no_template` early return is untouched and touches no guard,
  so the auto-scroll fallback path still works.
- `features/bookmarks/capture-engine.ts`: dropped the `extraction.items.length === 0` clause
  from `isComplete`. The extractor already returns `bottomCursor: null` for an entries-less
  payload, so the only behaviour change is that a NEW cursor with no extractable tweets keeps
  paging. Bounded: each distinct cursor is now fetched at most once.
- The three delivery channels were deliberately left in place — they exist for reliability
  across the isolated/MAIN world boundary; the bridge-side dedupe is what makes them safe.

## Verification

- `bun run test` — 35 files / 299 tests passing (baseline 34 / 294).
- `bun run compile` — clean.
- Not yet verified on live x.com: confirm `totalCaptured` climbs past ~60 and `status` stays
  `syncing` until the timeline genuinely runs out.
