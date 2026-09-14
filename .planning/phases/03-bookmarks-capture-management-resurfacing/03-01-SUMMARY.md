---
phase: 03-bookmarks-capture-management-resurfacing
plan: 01
subsystem: bookmarks
tags: [storage, schemas, quota, normalization, graphql, full-text-search, tracer]

# Dependency graph
requires:
  - phase: 01-foundation-settings-popup
    provides: WXT storage definition pattern, Settings migration infrastructure
provides:
  - BookmarkItem, BookmarkFolder, BookmarkSyncState, BookmarksSettings normalized TypeScript interfaces
  - Storage schema v4 with bookmarksItem, foldersItem, bookmarkSyncItem, bookmarksSettingsItem
  - Storage quota supervisor calculating usage against 10MB quota and auto-pruning uncategorized untagged items at 95%
  - GraphQL and DOM extraction engines normalizing live payloads and handling cursor pagination
  - Fast client-side multi-token search engine and debounce utility
affects: [03-02, 03-03, 03-04, 03-05]

# Actuals
actuals:
  tasks: 3
  plan: 03-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Normalized schema: ~500B average per item with zero raw base64 media blobs (D-15)"
    - "Quota supervisor: strict protection for custom user folders and tagged bookmarks during auto-pruning (D-16, BOOK-10)"
    - "Schema-mismatch detection: handles GraphQL schema changes gracefully without throwing"
    - "Multi-token substring search: zero external dependencies, <15ms over 10k items"

key-files:
  created:
    - features/bookmarks/types.ts
    - features/bookmarks/storage.ts
    - features/bookmarks/extractor.ts
    - features/bookmarks/search.ts
    - tests/unit/bookmarks-storage.test.ts
    - tests/unit/bookmarks-normalization.test.ts
    - tests/unit/bookmarks-search.test.ts
  modified:
    - lib/storage.ts
    - tests/unit/settings-migration.test.ts

key-decisions:
  - "Default uncategorized folder: initialized with ID 'uncategorized', color #71767B, isDefault: true, resurfaceEnabled: true (D-06)"
  - "Protected custom folders: auto-pruning at 95% quota strictly evicts oldest uncategorized, untagged bookmarks (D-16, BOOK-10)"
  - "Normalized storage: strips trailing t.co media URLs and saves maximum 4 media URLs, never saving raw image buffers"

requirements-completed: [BOOK-01, BOOK-02, BOOK-10]
---

# Phase 03 Plan 01 Summary: Core Storage, Schema & Extraction Engine (Tracer Slice)

Delivered the foundational data layer, storage schemas, quota enforcement, live payload extraction, and full-text search engine for Better Twitter bookmarks.

## Key Accomplishments
1. **Data Models & Storage Items**:
   - Implemented canonical types `BookmarkItem`, `BookmarkFolder`, `BookmarkSyncState`, and `BookmarksSettings`.
   - Added `bookmarksItem`, `foldersItem`, `bookmarkSyncItem`, and `bookmarksSettingsItem` to `lib/storage.ts`.
   - Bumped `Settings` version to 4 with backward-compatible migration.
2. **Quota Supervisor**:
   - Implemented `getStorageUsage()` and `enforceStorageQuota()` monitoring the 10MB MV3 quota.
   - At 95% critical threshold, automatically prunes oldest Uncategorized untagged bookmarks while strictly preserving custom folders and tagged items.
3. **Extraction & Normalization Engine**:
   - Implemented `extractBookmarksFromGraphql` supporting `Tweet`, `TweetWithVisibilityResults`, long-form `NoteTweet` articles, and bottom cursors.
   - Implemented `extractBookmarkFromDom` extracting bookmarks directly from tweet DOM elements.
   - Returns `schemaMismatch: true` gracefully without throwing on unpredicted payload changes.
4. **Instant Client-Side Search**:
   - Implemented `searchBookmarks` multi-token AND matching across text, author name, handle, and tags.
   - Benchmarked 10,000 items in <15ms.
   - Provided debouncing utility with cancellation support.

## Test Results
- Unit tests: 19 test files, 142 passing tests (all 21 new tests passing 100%).
- TypeScript compilation: `bun run compile` (`tsc --noEmit`) passes with 0 errors.
