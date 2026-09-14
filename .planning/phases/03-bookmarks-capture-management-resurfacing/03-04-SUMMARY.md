---
phase: 03-bookmarks-capture-management-resurfacing
plan: 04
subsystem: bookmarks
tags: [resurfacing, spaced-rotation, native-card, popup-panel, cadence-slider, folder-eligibility, quota-gauge, backup-restore]

# Dependency graph
requires:
  - phase: 03-bookmarks-capture-management-resurfacing
    provides: BookmarkItem, storage items, capture engine, in-page UI
provides:
  - Smart spaced rotation candidate selection algorithm (D-13)
  - Timeline resurfacing engine active exclusively on /home (D-14, BOOK-07)
  - Native-styled ResurfacedCard with 32px header, accent stripe, author info, media, and overflow action menu (D-11, BOOK-08, BOOK-09)
  - Dedicated Popup BookmarksPanel with live sync status, cadence slider (5-50), folder eligibility checklist, storage quota gauge (with 80% warning banner), and JSON export/import (D-08, D-12, D-13, D-16, D-17)
  - Category registration in lib/registry.ts and viewport routing in popup App.tsx
affects: [03-05]

# Actuals
actuals:
  tasks: 3
  plan: 03-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Smart spaced rotation: multi-factor ranking by lowest resurfaceCount, oldest lastResurfacedAt, and oldest savedAt (D-13)"
    - "Virtualizer containment: contain: content and overflow-anchor: auto prevent timeline scroll jump or reflow (BOOK-09)"
    - "Dedicated popup panel: category registered with dedicatedPanel: true and routed in App.tsx (D-12, UI-SPEC)"
    - "Local JSON export/import: zero network egress, fully client-side JSON validation and merge (D-17, T-03-13, T-03-15)"

key-files:
  created:
    - features/bookmarks/resurfacing.ts
    - features/bookmarks/ResurfacedCard.tsx
    - entrypoints/popup/BookmarksPanel.tsx
    - tests/unit/bookmarks-resurfacing.test.ts
    - tests/unit/bookmarks-popup.test.ts
  modified:
    - lib/registry.ts
    - entrypoints/popup/App.tsx
    - entrypoints/x.content/index.ts

key-decisions:
  - "Timeline feed scope: resurfacing runs only on /home and /; disabled on profile, search, and status details (D-14)"
  - "Resurfaced card styling: 32px header '📌 Resurfaced from [Folder]', 3px left accent stripe, BtDropdownMenu with Snooze 7d, Never resurface, Move to folder, Remove (D-11)"
  - "Cadence control: slider clamped to 5-50 (default 20), live-updating bookmarksSettingsItem (D-12)"
  - "Quota monitoring: progress bar with green/amber/red states, displaying exact verbatim UI-SPEC warning at >=80% (D-16)"

requirements-completed: [BOOK-07, BOOK-08, BOOK-09]
---

# Phase 03 Plan 04 Summary: Timeline Resurfacing Engine & Popup BookmarksPanel

Delivered the Timeline Resurfacing Engine for `/home` feeds and the dedicated extension popup `BookmarksPanel` with sync triggers, cadence slider, folder eligibility checklist, storage quota gauge, and JSON backup/restore.

## Key Accomplishments
1. **Smart Spaced Rotation & Timeline Resurfacing Controller**:
   - Implemented `selectResurfacingCandidate` in `features/bookmarks/resurfacing.ts`, filtering out snoozed bookmarks, `neverResurface` items, and disabled folders, ranking remaining candidates by lowest `resurfaceCount`, longest time since last resurfaced, and oldest `savedAt` (D-13).
   - Implemented `initResurfacing` and `teardownResurfacing` scoped exclusively to `/home` (D-14), observing tweets via `onTweetSeen` and injecting cards every N tweets (default 20, 5-50) using `contain: content; overflow-anchor: auto;` to guarantee zero scroll displacement (BOOK-09).
   - Wired route lifecycle in `entrypoints/x.content/index.ts`.
2. **Native-Styled ResurfacedCard Component**:
   - Implemented `ResurfacedCard.tsx` with 32px header banner "📌 Resurfaced from [Folder]" (folder name truncated at 1 line with ellipsis), `border-l-[3px] border-l-[var(--bt-accent)]`, author avatar, handle, date, tweet text, media grid, and assigned badge.
   - Provided overflow action menu (`BtDropdownMenu`) with "Snooze for 7 days", "Don't resurface this tweet", "Move to folder...", and "Remove from bookmarks" (D-11).
3. **Popup BookmarksPanel**:
   - Registered `bookmarks` category with `dedicatedPanel: true` and `Bookmark` icon in `lib/registry.ts`, routed in `entrypoints/popup/App.tsx`.
   - Created `BookmarksPanel.tsx` featuring:
     - Header stat card with total bookmarks count, relative last synced label, and "Sync Bookmarks Now" CTA (with live progress indicator and "Resume Sync" error banner).
     - Timeline Resurfacing section with master toggle switch and cadence slider (5-50 tweets, step 5).
     - Folder Eligibility checklist allowing users to toggle resurfacing per folder (D-13).
     - Settings section with "Ask for folder when bookmarking" switch (D-08).
     - Storage quota section with 10MB progress bar and amber warning banner at >=80% with verbatim UI-SPEC copy (D-16).
     - Backup & Restore section with one-click "Export Bookmarks (JSON)" and "Import Bookmarks (JSON)" (D-17).
4. **Testing & Verification**:
   - 12 unit tests in `tests/unit/bookmarks-resurfacing.test.ts` verifying candidate ranking, tie-breaking, snooze expiry, and interval triggers.
   - 8 unit tests in `tests/unit/bookmarks-popup.test.ts` verifying sync states, slider updates, folder toggles, 80% quota warning, export, and import.
   - All 24 test suites and 179 unit tests passing with zero TypeScript errors.
