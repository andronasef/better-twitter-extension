---
phase: 01-foundation-settings-popup
plan: 01
subsystem: foundation
tags: [wxt, react, tailwind-v4, radix-ui, shadcn, storage, mutationobserver, vitest, playwright]

requires: []
provides:
  - WXT extension skeleton with React, Tailwind v4, and Radix UI components
  - Typed WXT storage items (settingsItem, diagnosticsItem, xThemeItem)
  - Shared tweet observation pipeline with dual-marking and document-order emission
  - Grounded selector layer (resolve, resolveAll, SELECTORS)
  - Clean stylesheet-based element hiding (installHideStyle, markHidden, clearHidden)
  - Ad stripper feature controller (features/ad-stripper)
  - Popup with 360x480 frame, tile grid, and live storage switch toggle
  - Tracer E2E test proving popup-to-DOM hide/unhide chain
affects: [01-02, 01-03, 01-04, 01-05]

actuals:
  tokens: 28000
  tasks: 3
  commits: 3

tech-stack:
  added: [wxt, react, react-dom, radix-ui, tailwindcss, lucide-react, postcss-rem-to-responsive-pixel, vitest, "@playwright/test"]
  patterns: [single-shared-mutation-observer, dual-marking-data-bt-seen, css-attribute-hiding, live-storage-watch-diffing]

key-files:
  created:
    - wxt.config.ts
    - postcss.config.js
    - components.json
    - vitest.config.ts
    - playwright.config.ts
    - assets/tailwind.css
    - components/ui/switch.tsx
    - components/ui/tooltip.tsx
    - components/ui/button.tsx
    - lib/storage.ts
    - lib/registry.ts
    - lib/selectors.ts
    - lib/hide-style.ts
    - entrypoints/background.ts
    - entrypoints/popup/index.html
    - entrypoints/popup/main.tsx
    - entrypoints/popup/App.tsx
    - entrypoints/x.content/index.ts
    - entrypoints/x.content/pipeline.ts
    - entrypoints/x.content/dispatcher.ts
    - features/ad-stripper/index.ts
    - tests/unit/pipeline.test.ts
    - tests/unit/settings-dispatch.test.ts
    - e2e/fixtures/x-home.html
    - e2e/tracer.spec.ts
  modified:
    - package.json
    - bun.lock
    - tsconfig.json
    - .gitignore
    - .claude/CLAUDE.md
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/phases/01-foundation-settings-popup/01-UI-SPEC.md

key-decisions:
  - "Used route-fulfilled https://x.com/home with local fixture in Playwright to verify content script injection on MV3"
  - "Resolved output directory is .output/chrome-mv3 without suffix"
  - "CSS attribute data-bt-hidden and data-bt-hidden-cell applied cleanly without DOM node deletion or layout thrashing"
  - "Used Bun exclusively for all package installs and builds"

patterns-established:
  - "Pipeline dual-marking: data-bt-seen keyed on (element, tweetId) pair"
  - "Single MutationObserver at entrypoints/x.content with childList: true and no subtree"
  - "Selector encapsulation: all queries strictly centralized in lib/selectors.ts"

requirements-completed: [FOUND-01, FOUND-02, FOUND-07, UI-01, UI-02, CLEAN-01]

coverage:
  - id: D1
    description: "WXT + React + Tailwind v4 + Radix scaffold with exact package pinning and rem-to-px PostCSS plugin"
    requirement: FOUND-01
    verification:
      - kind: other
        ref: "bun run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Popup UI 360x480 frame with 3-column tile grid and instant paint without layout shifts"
    requirement: UI-01
    verification:
      - kind: e2e
        ref: "e2e/tracer.spec.ts#Tracer: popup toggle -> storage -> live DOM hide/un-hide on x.com"
        status: pass
    human_judgment: false
  - id: D3
    description: "Single shared MutationObserver pipeline with dual-marking and document-order replay"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "tests/unit/pipeline.test.ts#pipeline suite"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hide promoted tweets feature controller and clean CSS attribute-based hiding"
    requirement: CLEAN-01
    verification:
      - kind: e2e
        ref: "e2e/tracer.spec.ts#Tracer: popup toggle -> storage -> live DOM hide/un-hide on x.com"
        status: pass
    human_judgment: false
  - id: D5
    description: "Settings dispatcher diffing against last-applied cache with live storage sync"
    requirement: FOUND-07
    verification:
      - kind: unit
        ref: "tests/unit/settings-dispatch.test.ts#settings dispatcher suite"
        status: pass
    human_judgment: false
  - id: D6
    description: "Selector layer isolating all candidate query selectors with recorded justifications"
    requirement: UI-02
    verification:
      - kind: unit
        ref: "tests/unit/pipeline.test.ts#pipeline suite"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-09-13
status: complete
---

# Phase 1 Plan 01: Walking Skeleton Summary

**WXT extension walking skeleton with React 19, Tailwind v4, Radix UI, shared MutationObserver pipeline, clean CSS attribute ad stripping, and Playwright MV3 tracer.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-13T10:35:00Z
- **Completed:** 2026-09-13T11:00:00Z
- **Tasks:** 3
- **Files modified:** 34

## Accomplishments

- Scaffolded WXT extension targeting Chrome MV3 with React 19, Tailwind v4 CSS-first theming, PostCSS rem-to-px transforms, and Radix UI components (Switch, Tooltip, Button) pinned with `bun.lock`.
- Implemented typed WXT storage items (`settingsItem`, `diagnosticsItem`, `xThemeItem`) with defaults matching design specs (promoted tweet hiding enabled by default).
- Implemented single shared `MutationObserver` (`childList: true`, no `subtree`) in `entrypoints/x.content/pipeline.ts` with dual-marking (`data-bt-seen="<tweetId>"`) and document-order replay.
- Centralized all DOM selectors in `lib/selectors.ts` with candidate chains and recorded justifications, ensuring zero `data-testid` query strings in feature or UI modules.
- Created `features/ad-stripper/index.ts` using clean CSS attribute-based hiding (`data-bt-hidden`, `data-bt-hidden-cell`), leaving X's React DOM untouched.
- Implemented popup UI with fixed 360x480 frame, 3-column tile grid, Timeline panel, and live storage switch bindings.
- Successfully verified full stack with unit tests in Vitest and end-to-end integration test in Playwright (`e2e/tracer.spec.ts`) using route-fulfilled `https://x.com/home` against the `.output/chrome-mv3` extension build.

## Key Decisions & Details

- **Playwright Content Script Injection Path:** Used route-fulfilled `https://x.com/home` interception via Playwright `context.route` with `e2e/fixtures/x-home.html`. This accurately tests real MV3 content script injection under exact production manifest matches (`*://x.com/*`).
- **Resolved Build Output Directory:** Built directly to `.output/chrome-mv3`. Plans 01-02 through 01-05 can reliably reference this directory.
- **Package Management:** Strictly executed via `bun` and `bun.lock` per user constraint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Package Legitimacy Audit** - Approved by user checkpoint
2. **Task 2: Scaffold Project** - `ba5ef55` (`feat(01-01): scaffold project with WXT, React, Tailwind v4, and shadcn/Radix`)
3. **Task 3: Unit Tests (RED)** - `650df55` (`test(01-01): add unit tests for pipeline, settings dispatch, and tracer e2e spec`)
4. **Task 3: Implementation & Tracer (GREEN)** - `be2b10b` (`feat(01-01): implement pipeline, selectors, storage, ad-stripper feature, and popup toggle`)

## Self-Check: PASSED

- `wxt.config.ts` exists with `@wxt-dev/module-react`.
- `lib/storage.ts` exports `settingsItem`, `diagnosticsItem`, `xThemeItem`.
- `lib/registry.ts` exports `categories`, `features`, `featureDefaults`.
- `lib/selectors.ts` exports `resolve`, `resolveAll`, `SELECTORS`.
- `entrypoints/x.content/pipeline.ts` implements single shared pipeline without subtree.
- `bun run build` produces `.output/chrome-mv3` with `manifest.json` declaring `permissions: ["storage"]` and no `host_permissions`.
- `bun x vitest run` passes (2 files, 9 tests).
- `bun x playwright test e2e/tracer.spec.ts` passes (1 test, 907ms).
