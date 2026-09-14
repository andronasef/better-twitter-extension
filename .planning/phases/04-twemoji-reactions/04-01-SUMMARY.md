---
phase: 04-twemoji-reactions
plan: 01
subsystem: reactions
tags: [assets, twemoji, noto-animated, storage, schemas, selectors, tracer]

# Dependency graph
requires:
  - phase: 01-foundation-settings-popup
    provides: WXT storage definition pattern, Settings infrastructure
provides:
  - Bundled offline Twemoji SVGs (6 assets) and Google Noto Animated WebPs (6 assets)
  - Scoped web-accessible resources in manifest for x.com and twitter.com
  - Selector candidate chains for likeButton, replyButton, and replyComposer
  - TypeScript contracts: ReactionStyle, ReactionSlot, ReactionsSettings, CustomEmojiCache, CatalogEmoji
  - WXT storage items: reactionsSettingsItem and customEmojiCacheItem
  - Unit test suite for reactions storage fallbacks, mutations, default slots, URL helpers, and selectors
affects: [04-02, 04-03, 04-04, 04-05]

# Actuals
actuals:
  tasks: 3
  plan: 04-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Offline asset pipeline: zero external runtime CDN dependencies for default palette (REACT-06, D-13)"
    - "Strict manifest scoping: web_accessible_resources restricted to x.com and twitter.com with zero wildcard origins (audit-build Assertion 2)"
    - "Canonical 6-slot palette: locked default slots (👍, ❤️, 😂, 😮, 😢, 🔥) with sentiment labels and codepoints (D-09, D-14)"
    - "Codepoint variation handling: separates twemojiCodepoint (2764) and notoCodepoint (2764_fe0f) for red heart"
    - "Resilient DOM targeting: testid + aria-label candidate chains, zero class names, never throws (D-05)"

key-files:
  created:
    - public/twemoji/1f44d.svg
    - public/twemoji/2764.svg
    - public/twemoji/1f602.svg
    - public/twemoji/1f62e.svg
    - public/twemoji/1f622.svg
    - public/twemoji/1f525.svg
    - public/noto-animated/1f44d.webp
    - public/noto-animated/2764_fe0f.webp
    - public/noto-animated/1f602.webp
    - public/noto-animated/1f62e.webp
    - public/noto-animated/1f622.webp
    - public/noto-animated/1f525.webp
    - features/reactions/types.ts
    - features/reactions/constants.ts
    - tests/unit/reactions-storage.test.ts
  modified:
    - wxt.config.ts
    - lib/selectors.ts
    - lib/storage.ts

key-decisions:
  - "Default assets bundled statically: 6 Twemoji SVGs (~6KB) and 6 Google Noto Animated WebPs (~2.2MB) committed directly to public/ (REACT-06, D-13)"
  - "Manifest web-accessible resources: scoped strictly to *://x.com/* and *://twitter.com/* without wildcards, satisfying security audit Assertion 2"
  - "Red heart codepoint mapping: twemojiCodepoint uses '2764' while notoCodepoint uses '2764_fe0f'"
  - "Default visual style fallback: 'twemoji' with enabled: true and 6 locked default slots (D-09, D-11, D-14)"

requirements-completed: [REACT-06]
---

# Phase 04 Plan 01 Summary: Asset Pipeline & Type-Safe Storage (Tracer Slice)

Delivered the tracer slice for Phase 4 (Twemoji Reactions), establishing the offline static asset pipeline, manifest permissions, selector candidate chains, domain models, WXT storage items, and comprehensive unit tests.

## Key Accomplishments

1. **Offline Static Asset Pipeline (REACT-06, D-11, D-13)**:
   - Acquired and bundled 6 clean vector Twemoji SVGs (`1f44d`, `2764`, `1f602`, `1f62e`, `1f622`, `1f525`) in `public/twemoji/`.
   - Acquired and bundled 6 high-fidelity Google Noto Animated WebPs (`1f44d`, `2764_fe0f`, `1f602`, `1f62e`, `1f622`, `1f525`) in `public/noto-animated/`.
   - Expanded `web_accessible_resources` in `wxt.config.ts` to include `'twemoji/*'` and `'noto-animated/*'`.
   - Manifest remains strictly scoped to `*://x.com/*` and `*://twitter.com/*` with zero wildcard origins, fully passing `scripts/audit-build.mjs` Assertion 2.

2. **DOM Selector Candidate Chains (D-05, D-06)**:
   - Added candidate arrays to `lib/selectors.ts`:
     - `likeButton`: `[data-testid="like"]`, `[data-testid="unlike"]`, `button[aria-label*="Like" i]`, `button[aria-label*="Liked" i]`.
     - `replyButton`: `[data-testid="reply"]`, `button[aria-label*="Reply" i]`.
     - `replyComposer`: modal dialog and inline textareas (`tweetTextarea_0`, `role="textbox"`).
   - Maintained all DOM-targeting invariants: zero class name selectors, first candidate wins, never throws.

3. **Domain Contracts & Constants (D-09, D-11, D-14)**:
   - Implemented `features/reactions/types.ts` defining `ReactionStyle`, `ReactionSlot`, `ReactionsSettings`, `CustomEmojiCache`, and `CatalogEmoji`.
   - Implemented `features/reactions/constants.ts` defining interaction timings (`HOVER_TRIGGER_DELAY_MS` = 350, `EXIT_GRACE_BUFFER_MS` = 300, `HOLD_TRIGGER_THRESHOLD_MS` = 500, `TOAST_AUTO_DISMISS_MS` = 3000), `DEFAULT_REACTION_SLOTS` (6 locked slots), and URL resolvers `getTwemojiAssetUrl` / `getNotoAssetUrl`.

4. **WXT Storage Schema**:
   - Declared `reactionsSettingsItem` in `lib/storage.ts` with fallback to `enabled: true`, `style: 'twemoji'`, and `DEFAULT_REACTION_SLOTS`.
   - Declared `customEmojiCacheItem` in `lib/storage.ts` initializing to an empty object for user-selected custom emoji caching.

5. **Unit Testing Suite**:
   - Authored `tests/unit/reactions-storage.test.ts` containing 20 tests verifying storage defaults, mutations, custom slots, URL helpers, and DOM selector resolution.
   - All 20 tests pass cleanly, and full test suite passes 27/27 test files (230 tests).

## Test Results
- Unit tests: 20/20 passed in `tests/unit/reactions-storage.test.ts`; 230/230 passed overall.
- Typecheck: `tsc --noEmit` clean with 0 errors.
- Build & Security Audit: `bun run build` and `scripts/audit-build.mjs` passed all 5 security and platform assertions.
