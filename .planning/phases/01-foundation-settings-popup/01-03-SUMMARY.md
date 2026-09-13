---
phase: 01-foundation-settings-popup
plan: 03
subsystem: diagnostics-and-performance
tags: [diagnostics, selector-miss, badge, scroll-performance, observers, virtualizer, spike-s4]

requires:
  - phase: 01-01
    provides: Walking skeleton, pipeline, selectors, storage
  - phase: 01-02
    provides: Bridge, route watcher, named observers
provides:
  - Selector miss reporting with 3-condition heuristic (lib/diagnostics.ts)
  - Feature-scoped selector resolution with withFeature (lib/selectors.ts)
  - Action icon badge and title notification handler (entrypoints/background.ts)
  - 60fps-hardened pipeline with removal batch early exit and page-scoped observer cleanup
  - E2E selector miss reporting verification spec (e2e/selector-miss.spec.ts)
  - E2E scroll performance and long task (<50ms) verification spec (e2e/scroll-performance.spec.ts)
  - Spike S4 virtualizer collapse documentation and fallback rule (lib/hide-style.ts, spikes/S4-virtualizer-gap.md)
affects: [01-04, 01-05, phase-04]

actuals:
  tokens: 36000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns: [three-condition-miss-heuristic, transition-based-badge-messaging, removal-batch-early-exit, zero-height-cell-collapse]

key-files:
  created:
    - lib/diagnostics.ts
    - tests/unit/diagnostics.test.ts
    - tests/unit/selectors.test.ts
    - e2e/selector-miss.spec.ts
    - e2e/scroll-performance.spec.ts
    - .planning/phases/01-foundation-settings-popup/spikes/S4-virtualizer-gap.md
  modified:
    - lib/selectors.ts
    - lib/hide-style.ts
    - entrypoints/background.ts
    - entrypoints/x.content/pipeline.ts
    - entrypoints/x.content/route-watcher.ts
    - features/ad-stripper/index.ts
    - tests/unit/pipeline.test.ts
    - e2e/fixtures/x-home.html
    - e2e/tracer.spec.ts

key-decisions:
  - "Three-condition miss heuristic strictly enforced: feature enabled, at least 1 tweet seen on page, and 3 consecutive zero-match ticks (D-11)"
  - "Diagnostics persisted to local:diagnostics without modifying user's toggle setting in local:settings (D-08, D-10)"
  - "Badge notifications driven by diagnostics transitions (empty <-> non-empty) to minimize service worker wakeups"
  - "Timeline observer registered through registerPageObserver('pipeline:timeline') with childList only (no subtree, no layout reads)"
  - "Early exit in pipeline for removal-only mutation batches avoids unnecessary processing and selector resolutions"
  - "Spike S4 documented with PENDING LIVE RUN; ENABLE_S4_COLLAPSE_FALLBACK implemented off-by-default in lib/hide-style.ts"

patterns-established:
  - "Feature-scoped selector resolution via withFeature(featureId) tagging hits/misses to owning feature"
  - "Action badge color #E07C00 (UI-SPEC warning) with title string indicating layout mismatch"
  - "Synthetic feed testing with PerformanceObserver floor monitoring for long tasks (<50ms)"

requirements-completed: [FOUND-01, FOUND-04, FOUND-08, FOUND-09, CLEAN-01]

coverage:
  - id: D1
    description: "Per-feature selector miss counter with 3-condition heuristic, clearing on hit, persisting to local:diagnostics"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "tests/unit/diagnostics.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/selectors.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Action badge and tooltip title set on diagnostics transition to non-empty, cleared on transition to empty"
    requirement: FOUND-04
    verification:
      - kind: e2e
        ref: "e2e/selector-miss.spec.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pipeline hardened for scroll performance: childList only, zero layout reads, removal early exit, page-scoped lifecycle"
    requirement: FOUND-08
    verification:
      - kind: unit
        ref: "tests/unit/pipeline.test.ts"
        status: pass
      - kind: e2e
        ref: "e2e/scroll-performance.spec.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Spike S4 virtualizer gap collapse verified in fixture with collapsed cell height 0, suppressed separator, and fallback ready"
    requirement: CLEAN-01
    verification:
      - kind: e2e
        ref: "e2e/tracer.spec.ts"
        status: pass
      - kind: other
        ref: "powershell S4 acceptance criteria check"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-09-13
status: complete
---

# Phase 1 Plan 03: Diagnostics & Scroll Performance Summary

**Per-feature selector-miss reporting via 3-condition heuristic, action icon badge notification on diagnostics transitions, 60fps timeline observation pipeline with removal-batch early exit, and Spike S4 virtualizer collapse fallback.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-13T17:30:00+03:00
- **Completed:** 2026-09-13T17:56:00+03:00
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Created `lib/diagnostics.ts` implementing D-11's 3-condition heuristic (feature enabled, at least 1 tweet seen on page, 3 consecutive zero-match ticks), persisting failures to `local:diagnostics` and auto-clearing immediately upon a subsequent hit.
- Extended `lib/selectors.ts` with `withFeature(featureId)` so every selector resolution reports hits and misses attributed directly to the owning feature without global pollution.
- Updated `entrypoints/background.ts` to listen for diagnostics transition messages and toggle the action icon badge (`•`, `#E07C00`) and warning title string.
- Hardened `entrypoints/x.content/pipeline.ts`: registered timeline observers via `registerPageObserver` for clean route-change teardown, added an early return on removal-only mutation batches, and eliminated all layout reads.
- Added `e2e/selector-miss.spec.ts` testing the synthetic "X changed its markup" scenario: verified badge set, diagnostics persisted, settings untouched, organic cells unharmed, and automatic clearing upon selector recovery.
- Added `e2e/scroll-performance.spec.ts` testing a 200-cell synthetic timeline scroll with zero tasks exceeding 50ms and flat observer counts across navigations.
- Documented Spike S4 (`spikes/S4-virtualizer-gap.md`) with `PENDING LIVE RUN` marker, implemented `ENABLE_S4_COLLAPSE_FALLBACK` (default `false`) in `lib/hide-style.ts`, and verified in `e2e/tracer.spec.ts` that hidden cell computed height collapses to 0 and suppresses trailing separators.

## Spike S4 Status & Consequence

- **Spike Question:** Does hiding the cell's `firstElementChild` allow X's virtualizer to observe a zero-height cell and collapse the slot cleanly without leaving a residual gap of whitespace?
- **Status:** Documented with `PENDING LIVE RUN` in `.planning/phases/01-foundation-settings-popup/spikes/S4-virtualizer-gap.md`.
- **Fallback Status:** `ENABLE_S4_COLLAPSE_FALLBACK = false` in `lib/hide-style.ts`. The fallback rule targeting `[data-bt-hidden-cell]` is ready to be enabled if live testing reveals residual slot gaps.
- **Fixture Verification:** `e2e/tracer.spec.ts` confirms that hiding the cell's inner content wrapper collapses the cell container's computed height to 0 and suppresses the sibling `[role="separator"]`.
- **Impact on Future Phases:** Phase 4's custom card insertion into the virtualized feed inherits this decision and will reuse the proven collapse mechanism.

## Task Commits

1. **Task 1: Per-feature Selector-Miss Reporting**
   - RED tests: `d775938` (`test(01-03): add unit test suites for selector miss diagnostics and scoped resolution`)
   - Implementation & E2E: `5447789` (`feat(01-03): implement selector miss diagnostics, background badge handler, and e2e test`)
2. **Task 2: Scroll Performance & Observer Hardening**
   - Implementation & E2E: `0770fac` (`feat(01-03): harden pipeline for 60fps scroll and add scroll performance e2e test`)
3. **Task 3: Spike S4 Fallback & Documentation**
   - Fallback & E2E: `2f6b0b9` (`feat(01-03): implement S4 height-zeroing fallback, tracer assertions, and spike S4 note`)

## Self-Check: PASSED

- `lib/diagnostics.ts` exports `MISS_THRESHOLD` (value 3), `recordHit`, `recordMiss`, `currentDiagnostics`.
- Zero outbound telemetry or network calls in `lib/diagnostics.ts`.
- `entrypoints/background.ts` is the only caller of `chrome.action.setBadgeText`.
- Zero `subtree: true` across all content script files.
- Zero layout reads (`getBoundingClientRect`, `offsetHeight`, etc.) in `entrypoints/x.content/pipeline.ts`.
- All 32 Vitest unit tests pass across 6 test suites.
- All 4 Playwright E2E tests pass (`tracer`, `route-change`, `selector-miss`, `scroll-performance`).
