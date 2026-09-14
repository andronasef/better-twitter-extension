---
phase: 03-bookmarks-capture-management-resurfacing
plan: 02
subsystem: bookmarks
tags: [graphql, bridge, capture-engine, action-bar, dual-save, popover, shadow-dom]

# Dependency graph
requires:
  - phase: 03-bookmarks-capture-management-resurfacing
    provides: BookmarkItem types, storage schemas, extraction engine
provides:
  - MAIN-world bridge interception for Bookmarks queries, CreateBookmark, and DeleteBookmark mutations
  - Typed bridge-client event subscriptions across DOM boundary
  - Capture engine with chunked pagination checkpoint persistence and error classification (401, 429, schema mismatch)
  - Delegated action row click listener supporting dual-save and quick-save mode bypass
  - Synchronized unbookmarking deleting local copies when unbookmarked on X
  - FolderSelectorPopover component in Shadow DOM with folder search, checklist, and inline folder creation
affects: [03-03, 03-04, 03-05]

# Actuals
actuals:
  tasks: 3
  plan: 03-02

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bridge CustomEvents: plain serialized JSON objects dispatched across DOM boundary (T-03-05)"
    - "Dual-save architecture: native event fires for X cloud persistence while capture handler saves locally and opens popover (D-05)"
    - "Synchronized unbookmarking: removeBookmarkButton and DeleteBookmark mutation remove local records (D-09)"
    - "Shadow DOM Popover: BtPopover rendered in isolated host with virtual anchor positioning (D-05, D-07)"

key-files:
  created:
    - features/bookmarks/capture-engine.ts
    - features/bookmarks/action-bar.ts
    - features/bookmarks/FolderSelectorPopover.tsx
    - tests/unit/bookmarks-capture.test.ts
    - tests/unit/bookmarks-action-bar.test.ts
  modified:
    - entrypoints/bridge.ts
    - entrypoints/x.content/bridge-client.ts
    - lib/selectors.ts

key-decisions:
  - "Zero child injection in role='group': action bar integration attaches capture-phase listener to document, mounting popover via fixed coordinate anchor in document.body (D-05, T-03-08)"
  - "Quick-save setting bypass: when askFolderOnSave is false, saves directly to Uncategorized without opening popover (D-08)"
  - "Fallback save button: mounts button[data-bt-save-button] on tweets missing native bookmark button (BOOK-01, SC 2)"
  - "Tooltip contract: formats 'Saved to Uncategorized' or 'Saved in [Folder 1], [Folder 2]' verbatim (D-10)"

requirements-completed: [BOOK-01, BOOK-02, BOOK-03]
---

# Phase 03 Plan 02 Summary: Bridge Interception, Capture Engine & Action Row Popover

Delivered MAIN-world GraphQL interception, chunked background capture with pagination checkpoints, and native action bar dual-save integration with shadow-isolated folder selection.

## Key Accomplishments
1. **MAIN-World Bridge Interception**:
   - Expanded `entrypoints/bridge.ts` to intercept `Bookmarks`, `CreateBookmark`, and `DeleteBookmark` GraphQL operations from both `fetch` and `XMLHttpRequest`.
   - Dispatches `bt:graphql-bookmarks` and `bt:graphql-bookmark-mutation` CustomEvents to the isolated content script.
   - Updated `entrypoints/x.content/bridge-client.ts` with typed subscription helpers.
2. **Resilient Capture Engine**:
   - Implemented `handleBookmarksPayload` in `features/bookmarks/capture-engine.ts` extracting items, persisting bookmarks, and updating `BookmarkSyncState` cursor checkpoints.
   - Accurately classifies HTTP 401 (`not_logged_in`), HTTP 429 (`rate_limited`), and schema mismatches (`endpoint_changed`) with UI-SPEC verbatim copy.
   - Handles `handleBookmarkMutation` synchronizing local unbookmarking when deleted on X.
3. **Action Row Integration & Tooltips**:
   - Added `bookmarkButton`, `removeBookmarkButton`, and `tweetArticle` to `lib/selectors.ts`.
   - Implemented delegated capture-phase click handler preserving native cloud save while saving locally.
   - Supports quick-save mode (`askFolderOnSave: false`) auto-saving to Uncategorized.
   - Injects fallback save button (`button[data-bt-save-button]`) when native bookmark button is absent.
   - Implemented hover tooltip updater displaying "Saved to Uncategorized" or "Saved in [Folders]".
4. **Folder Selector Popover**:
   - Implemented `FolderSelectorPopover.tsx` featuring 280px width, instant folder search, multi-selection checklist with smooth scrolling, and inline "+ Create Folder" row.
   - Anchors virtually to the bookmark button bounding rect without mutating React's `role="group"`.

## Test Results
- Unit tests: 21 test files, 155 passing tests (all 13 new capture and action-bar tests passing 100%).
- TypeScript compilation: `bun run compile` (`tsc --noEmit`) passes with 0 errors.
