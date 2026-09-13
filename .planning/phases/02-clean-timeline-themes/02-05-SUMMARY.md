---
phase: 02-clean-timeline-themes
plan: 05
subsystem: testing
tags: [playwright, e2e, vitest, security-audit, standing-gates, theme-engine, layout-engine]

# Dependency graph
requires:
  - phase: 02-01
    provides: Vanity metric stripper and sidebar clutter cleaner feature controllers and selectors
  - phase: 02-02
    provides: Tab order engine and Following auto-activation controller
  - phase: 02-03
    provides: Color engine presets (Dracula, Nord, Matrix) and custom accent recoloring
  - phase: 02-04
    provides: Minimal and Old Twitter 2015 layout engines
provides:
  - Full end-to-end browser verification suite (24 passing Playwright tests) covering declutter features, tab order swapping, theme presets, custom accent, and layout transforms
  - Realistic synthetic HTML test fixture (`e2e/fixtures/x-home.html`) with sidebar modules, tablist, vanity metrics action bar, detail stats, and tweet articles
  - Verification that standing build gates (Vitest 110 unit tests, `tsc --noEmit`, WXT production build, `audit-build.mjs` 5 security assertions) pass cleanly
affects: []

# Actuals
actuals:
  tokens: 14500
  tasks: 2
  commits: 1
  plan_head_before: c802b20f4c3cb5303c73bbfae7aa23ffaa364cb6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subpixel rounding resilience in Playwright CSS assertions: when testing CSS dimensions (such as fixed 46px top navbar or 68px left rail in Minimal layout) on Chromium with high-DPI scaling, assert rounded numeric pixel values or absolute differences (< 1px) rather than exact string equality."
    - "Scoped Playwright switch locators: when multiple switches coexist within a panel (e.g. 6 switches in Timeline category), target by unique ID (`#hidePromotedTweets[role='switch']`) to avoid strict mode violations."

key-files:
  created:
    - e2e/clean-timeline.spec.ts
    - e2e/tabs.spec.ts
    - e2e/theme-switch.spec.ts
  modified:
    - e2e/fixtures/x-home.html
    - e2e/popup-states.spec.ts
    - e2e/tracer.spec.ts

key-decisions:
  - "Updated e2e/popup-states.spec.ts to account for Phase 2 expansion: category tiles count increased from 1 to 2 ('Timeline' and 'Themes'), and switch locators are qualified with specific feature IDs (`#hidePromotedTweets`) to resolve strict mode collisions."
  - "Added subpixel rounding tolerance to e2e/theme-switch.spec.ts for margin difference (< 1px) and rail/navbar dimensions to ensure tests pass consistently across varying display DPI settings."

patterns-established:
  - "Full standing build gate protocol: `bun run test`, `bun x tsc --noEmit`, `bun run build`, and `node scripts/audit-build.mjs` passing before milestone closure."

requirements-completed: [CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07]

---

# Phase 2 Plan 05 Summary: E2E Browser Verification & Standing Build Gate Audits

## Overview
Plan 02-05 completes the verification phase for Phase 2 ("Clean Timeline & Themes"). All 24 Playwright end-to-end tests across declutter features, tab order swapping, color theme presets, custom accent recoloring, and layout transformations (Minimal & Old Twitter) pass with 100% success rate in real Chromium browser contexts. All standing build gates—including 110 Vitest unit tests, TypeScript type checking, and the 5-point production security audit—pass cleanly.

## Key Accomplishments
1. **End-to-End Test Suite**:
   - `e2e/clean-timeline.spec.ts`: Validated vanity metric stripping (like/retweet/reply counts hidden, action buttons interactive, tweet detail stats hidden) and sidebar clutter suppression (trends, who-to-follow, premium hidden; search stays visible).
   - `e2e/tabs.spec.ts`: Validated tab reordering (Following first, For You second via CSS flex order), hide-completely sub-toggle, and Following auto-activation on `/home` route.
   - `e2e/theme-switch.spec.ts`: Validated Dracula zero-FOUC initial load, live switch to Nord and Matrix with zero page reload, custom accent recoloring (`--bt-theme-accent`), Minimal layout (hidden sidebar, centered 650px timeline, 68px rail), and Old Twitter layout (rounded-square avatars, 46px fixed navbar).
   - Updated `e2e/popup-states.spec.ts` and `e2e/tracer.spec.ts` to cleanly support Phase 2 multi-category and multi-toggle popup environments.
2. **Standing Build Gates**:
   - `bun run test`: 15 test files, 110 unit tests all passing.
   - `bun x tsc --noEmit`: Exited 0 with zero TypeScript errors.
   - `bun run build`: Built production extension into `.output/chrome-mv3` with WXT 0.21.4 and Vite 8.3.0.
   - `node scripts/audit-build.mjs`: PASSED all 5 security invariant assertions (minimal storage permission, zero host permissions, scoped web-accessible resources for `x.com`/`twitter.com`, exactly 1 content script, 0 CSP overrides, 0 dynamic code execution).
