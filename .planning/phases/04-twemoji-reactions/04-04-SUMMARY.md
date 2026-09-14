---
phase: 04-twemoji-reactions
plan: 04
subsystem: reactions-popup
tags: [catalog, noto, emoji-browser, popup-panel, caching, storage, data-uri]

# Dependency graph
requires:
  - phase: 04-twemoji-reactions
    provides: Domain types in features/reactions/types.ts, default slots and asset helpers in constants.ts, wxt storage items in lib/storage.ts
provides:
  - Google Noto remote catalog fetcher and multi-token search engine with category filtering (REACT-05, D-13)
  - Zero-host_permissions CORS client preserving audit-build.mjs manifest constraints
  - Local custom emoji caching as SVG and WebP Data URIs in chrome.storage.local (D-13)
  - Accessible EmojiCatalogModal browser with 150ms debounce, category chips, 40x40px grid, skeletons, and error/empty states (REACT-05, D-10, D-12)
  - Reactions category registration with Smile icon and dedicated panel in popup shell (D-10)
  - ReactionsPanel settings surface featuring 3 visual style cards, 6 slot reordering rows, and destructive reset dialog (D-10, D-11, D-12, D-14)
  - 9 unit tests in tests/unit/reactions-catalog.test.ts passing 100%
affects: [04-03, 04-05]

# Actuals
actuals:
  tasks: 3
  plan: 04-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CORS-only remote catalog client: consumes https://googlefonts.github.io/noto-emoji-animation/data/api.json without host_permissions"
    - "Multi-token AND search filter: splits query by whitespace and tests every token across name, category, keywords, and codepoints"
    - "Data URI caching: downloads custom Twemoji SVG and Noto animated WebP to base64 Data URIs stored directly in chrome.storage.local"
    - "Accessible React modal: role='dialog', aria-modal='true', 150ms debounced input, role='button' emoji cells, and keyboard support"
    - "Popup dedicated panel: integrated into App.tsx view switcher with back navigation and theme synchronization"

key-files:
  created:
    - features/reactions/catalog.ts
    - features/reactions/EmojiCatalogModal.tsx
    - entrypoints/popup/ReactionsPanel.tsx
    - tests/unit/reactions-catalog.test.ts
  modified:
    - lib/registry.ts
    - entrypoints/popup/App.tsx

key-decisions:
  - "Zero host_permissions remote catalog: Google Noto repository provides standard Access-Control-Allow-Origin: * headers, enabling client fetch without manifest expansion (REACT-05, STRIDE T-04-13)"
  - "Selective Data URI caching: only custom-assigned emoji slots are fetched and stored as Data URIs, keeping storage footprint under 1MB (D-13)"
  - "Multi-token search matching: requires all tokens to be present in name, category, or keywords, ensuring high precision for terms like 'tears joy' (REACT-05)"
  - "Exact UI-SPEC copywriting: implemented verbatim strings for modal titles, search placeholders, category chips, empty states, and reset dialog (UI-SPEC § Copywriting)"
  - "Three visual style selector: allows one-click switching between Normal, Twemoji, and Animated Noto with live preview cards (D-11)"

requirements-completed: [REACT-05]
---

# Phase 04 Plan 04 Summary: Popup Reactions Panel & Hybrid Catalog Caching

Implemented the remote Google Noto Emoji Catalog client, Data URI asset caching engine, accessible `EmojiCatalogModal` browser, and the extension popup `ReactionsPanel` settings interface for Phase 4 (Twemoji Reactions), fulfilling requirement REACT-05 and user decisions D-10, D-11, D-12, D-13, and D-14.

## Key Accomplishments

1. **Remote Google Noto Catalog Client & Search Engine (REACT-05, D-13)**:
   - Built `features/reactions/catalog.ts` exporting `fetchEmojiCatalog`, `searchEmojiCatalog`, `codepointToEmoji`, and `cacheCustomEmoji`.
   - Fetches and parses 881 categorized emojis from Google Noto API with in-memory caching.
   - Implemented multi-token AND search with category filtering across name and keywords.
   - Implemented Data URI caching for custom emojis into `chrome.storage.local` (`customEmojiCacheItem`).
   - Authored `tests/unit/reactions-catalog.test.ts` with 9 passing unit tests.

2. **Emoji Catalog Browser Modal (REACT-05, D-10, D-12)**:
   - Created `features/reactions/EmojiCatalogModal.tsx` following all UI-SPEC dimensions.
   - Features 150ms debounced search with clear button, 9 category filter chips, 40×40px clickable emoji grid, 18 loading skeleton boxes, and exact copywriting for empty ("No Emojis Found") and network failure ("Emoji Catalog Unavailable") states.

3. **Extension Popup Reactions Panel & Navigation (D-10, D-11, D-12, D-14)**:
   - Registered `reactions` category in `lib/registry.ts` with `Smile` icon and `dedicatedPanel: true`.
   - Created `entrypoints/popup/ReactionsPanel.tsx` with:
     - 3 Visual Style cards (Normal, Twemoji, Animated Noto) with active border ring and check badge.
     - 6 Palette Slot customizer rows with slot index badges, live emoji rendering, reorder buttons (`[←]`, `[→]`), and `[Change]` swap trigger.
     - Destructive confirmation dialog for "Reset to Defaults" ("Reset Default Slots" vs "Keep Custom Slots").
     - Storage quota indicator and cache clearing action.
   - Routed `activeCategoryId === 'reactions'` in `entrypoints/popup/App.tsx`.

## Verification

- `bun run test tests/unit/reactions-catalog.test.ts`: 9/9 passed.
- `bun x tsc --noEmit`: 0 errors.
- `bun run test`: 29 test files, 249 tests passed 100%.
- `bun run build`: Built successfully, `audit-build.mjs` PASSED all 5 assertions (zero host_permissions, strictly scoped web_accessible_resources).
