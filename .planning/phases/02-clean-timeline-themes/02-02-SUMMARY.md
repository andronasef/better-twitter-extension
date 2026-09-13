---
phase: 02-clean-timeline-themes
plan: 02
subsystem: ui
tags: [wxt, content-script, css-flex-order, mutationobserver, vitest, route-watcher]

# Dependency graph
requires:
  - phase: 02-01
    provides: Storage schema v2 pattern, registry parentId/SubToggleRow sub-toggle hierarchy, CategoryPanel nested rendering, data-bt-* CSS attribute hiding convention
provides:
  - Storage schema fields swapHomeTabs and hideForYouTab (default false) with migration/fallback defaults
  - Non-destructive CSS flex order tab reordering (Following first, For You second, pinned Lists preserved) via data-bt-swap-tabs
  - "Hide For You tab completely" sub-toggle via data-bt-hide-for-you (display: none)
  - Route-scoped single-activation Following auto-select controller (features/tab-reorder) with MutationObserver fallback for late tablist mount
  - Popup registry entries for "Following first on Home" and its "Hide For You tab completely" sub-toggle, rendered via the existing 02-01 sub-toggle hierarchy with zero component changes
affects: [03-bookmarks, 04-twemoji-reactions]

# Actuals (#2632)
actuals:
  tokens: 4013
  tasks: 3
  commits: 3
  plan_head_before: e432519d2e5d8a6d42c5f5c14a1c1d6c8a2e3f9a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tab reordering never reparents React-owned DOM nodes; it swaps visual position purely via CSS flexbox order on html[data-bt-swap-tabs] with :nth-child positional targeting, leaving React's virtual DOM untouched (Pitfall 1)."
    - "Route-scoped single-activation guard (module-level boolean reset by onRouteChange) is the reusable pattern for any future auto-click-once-per-navigation behavior, avoiding infinite click loops (Pitfall 2)."

key-files:
  created:
    - features/tab-reorder/index.ts
    - tests/unit/tabs.test.ts
  modified:
    - lib/storage.ts
    - lib/selectors.ts
    - lib/hide-style.ts
    - lib/registry.ts
    - entrypoints/x.content/index.ts

key-decisions:
  - "autoSelectFollowingTab() returns false (no click) on repeat calls within the same route once the guard has fired, rather than continuously retrying — this is what makes Pitfall 2's guard observable/testable as a return value, not just a side effect."
  - "Early FOUC-prevention attribute block in entrypoints/x.content/index.ts was extended to set data-bt-swap-tabs / data-bt-hide-for-you synchronously from cached settings before dispatch, matching the existing cleanSidebar/hideVanityMetrics pattern from 02-01 (Rule 2: missing critical functionality — without this, a page reload would flash unswapped tabs for one frame)."

patterns-established:
  - "Route-scoped MutationObserver fallback: when a target element isn't mounted yet at controller init time, observe a stable ancestor (primaryColumn) briefly and disconnect once the target resolves — reusable for any future feature needing to catch late React mounts without polling."

requirements-completed: [CLEAN-04]

coverage:
  - id: D1
    description: "CSS flex order rules swap Following to first position and For You to second on html[data-bt-swap-tabs=\"true\"], preserving pinned Lists (child 3+) at their natural order (D-07), without reparenting DOM nodes"
    requirement: "CLEAN-04"
    verification:
      - kind: unit
        ref: "tests/unit/tabs.test.ts#CSS flex order rules"
        status: pass
    human_judgment: true
    rationale: "CSS selector correctness against live x.com's tablist markup (D-16 provenance, :nth-child positional assumptions) cannot be confirmed by unit tests alone — visual verification on real x.com is needed to confirm Following visually renders first and pinned Lists are unaffected."
  - id: D2
    description: "'Hide For You tab completely' sub-toggle hides the For You tab via display:none on html[data-bt-hide-for-you=\"true\"] (D-06)"
    requirement: "CLEAN-04"
    verification:
      - kind: unit
        ref: "tests/unit/tabs.test.ts#CSS flex order rules > hides the For You tab completely"
        status: pass
    human_judgment: true
    rationale: "Same live-DOM selector caveat as D1."
  - id: D3
    description: "autoSelectFollowingTab() auto-clicks Following exactly once per route entry on /home when not already selected, holds the guard against repeat clicks, resets on route change, and never fires when Following is already selected"
    requirement: "CLEAN-04"
    verification:
      - kind: unit
        ref: "tests/unit/tabs.test.ts#Single-activation Following feed auto-selection"
        status: pass
    human_judgment: false
  - id: D4
    description: "tabReorder and hideForYou feature controllers toggle their data-bt-* attributes and are registered in the settings dispatcher and FOUC-prevention block"
    verification:
      - kind: unit
        ref: "tests/unit/tabs.test.ts#tabReorder & hideForYou controller lifecycle"
        status: pass
      - kind: other
        ref: "bun x tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D5
    description: "Popup registry registers swapHomeTabs (\"Following first on Home\") and hideForYouTab (\"Hide For You tab completely\", sub-toggle) with verbatim UI-SPEC copy; renders via the existing 02-01 CategoryPanel/SubToggleRow hierarchy"
    verification:
      - kind: unit
        ref: "tests/unit/sub-toggle.test.tsx"
        status: pass
      - kind: other
        ref: "bun x tsc --noEmit && bun run test"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-13
status: complete
---

# Phase 02 Plan 02: Tab Reordering & Auto-Selection Engine Summary

**Non-destructive CSS flex-order tab swap plus a route-scoped single-activation Following auto-select controller (CLEAN-04), wired into the popup's existing sub-toggle hierarchy**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-13T21:55:00Z
- **Completed:** 2026-09-13T22:00:00Z
- **Tasks:** 3/3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments
- `lib/storage.ts` gained `swapHomeTabs` and `hideForYouTab` feature flags (default `false`) with migration/fallback defaults consistent with the existing v2 schema.
- `lib/selectors.ts` gained `tabList`, `forYouTab`, and `followingTab` selectors with D-16 provenance comments justifying the `:nth-child` structural combinators (X's tab elements carry no `data-testid`).
- `lib/hide-style.ts` gained the CSS flex `order` rules that swap Following (order 1) and For You (order 2) while preserving pinned Lists at order 3 (D-07), plus a `display: none` rule for the `hideForYouTab` sub-toggle (D-06) — all purely declarative, never touching React's DOM.
- `features/tab-reorder/index.ts` implements `autoSelectFollowingTab()` (route-scoped single-activation guard preventing infinite click loops per Pitfall 2), `resetAutoSelectGuard()`, and two feature controllers: `tabReorder` (sets `data-bt-swap-tabs`, wires `onRouteChange` to reset the guard and re-attempt auto-selection, with a `MutationObserver` fallback for a tablist that hasn't mounted yet) and `hideForYou` (sets `data-bt-hide-for-you`).
- `entrypoints/x.content/index.ts` registers both new controllers in the settings dispatcher and extends the early FOUC-prevention attribute block to set `data-bt-swap-tabs`/`data-bt-hide-for-you` synchronously from cached settings.
- `lib/registry.ts` registers `swapHomeTabs` ("Following first on Home") and `hideForYouTab` ("Hide For You tab completely", `parentId: 'swapHomeTabs'`) with verbatim UI-SPEC copy — rendered by the existing (02-01) `CategoryPanel`/`SubToggleRow` hierarchy with zero component changes required.

## Task Commits

Each task was committed atomically:

1. **Task 1: CSS flex order tab swap & 'Hide For You completely' sub-toggle (CLEAN-04, D-05, D-06, D-07)** - `ee34da1` (feat)
2. **Task 2: Single-activation Following feed auto-selection on /home navigation (CLEAN-04, D-05)** - `486041a` (feat)
3. **Task 3: Popup settings integration for tab reordering controls (CLEAN-04, D-05, D-06, UI-SPEC)** - `87dc827` (feat)

**Plan metadata:** Not committed by this executor — STATE.md, ROADMAP.md, and REQUIREMENTS.md are being handled centrally by the orchestrator after all Phase 2 plans complete, per explicit instruction.

## Files Created/Modified
- `lib/storage.ts` - Settings.features gains `swapHomeTabs`/`hideForYouTab`, migration and fallback defaults updated
- `lib/selectors.ts` - `tabList`, `forYouTab`, `followingTab` selectors with D-16 provenance
- `lib/hide-style.ts` - CSS_RULES additions: flex order swap rules + hideForYouTab display:none rule
- `features/tab-reorder/index.ts` - `autoSelectFollowingTab`, `resetAutoSelectGuard`, `tabReorder` controller, `hideForYou` controller
- `entrypoints/x.content/index.ts` - registers `tabReorder`/`hideForYou` in dispatcher and FOUC-prevention attribute block
- `lib/registry.ts` - registers `swapHomeTabs` and `hideForYouTab` (sub-toggle of `swapHomeTabs`)
- `tests/unit/tabs.test.ts` - unit tests for CSS rules, selector definitions, auto-selection guard behavior, and controller lifecycle

## Decisions Made
- `autoSelectFollowingTab()` is designed to return `false` (and dispatch no click) on any call after the route-scoped guard has already fired without Following becoming selected, rather than silently retrying — this makes the single-activation contract from Pitfall 2 directly observable and testable via the function's return value, not just a side effect on the DOM.
- Extended the existing 02-01 early FOUC-prevention attribute block (which already handled `cleanSidebar`/`hideVanityMetrics`/`hideProfileCounts`) to also cover `swapHomeTabs`/`hideForYouTab`, since omitting it would mean the first paint after a fresh page load briefly shows unswapped tabs before the dispatcher runs — a Rule 2 (missing critical functionality) auto-fix consistent with THEME-07's zero-FOUC contract established in 02-RESEARCH.md.
- No changes were needed to `CategoryPanel.tsx` or `SubToggleRow.tsx`: the `parentId`/`childFeatures`/`parentEnabled` pattern built in 02-01 was explicitly designed for reuse by this plan's toggles, and it works unmodified.

## Deviations from Plan

None - plan executed exactly as written. The only additions beyond the plan's literal action items were the early FOUC-prevention attribute wiring in `entrypoints/x.content/index.ts` (Rule 2 - Missing Critical Functionality, described above), which follows the identical pattern already established for the other Phase 2 toggles in 02-01 and is necessary for the zero-FOUC contract (THEME-07 principle) to hold for these new toggles too.

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added swapHomeTabs/hideForYouTab to early FOUC-prevention attribute block**
- **Found during:** Task 2 (registering tabReorder/hideForYou in the content script)
- **Issue:** The plan's action items covered registering the controllers in the settings dispatcher, but the existing early-attribute-application block (which reads cached settings synchronously before first paint to prevent a flash of unstyled/undeclu ttered content) only listed the 02-01 toggles.
- **Fix:** Added `swapHomeTabs`/`hideForYouTab` checks to the same block, mirroring the `cleanSidebar`/`hideVanityMetrics`/`hideProfileCounts` pattern.
- **Files modified:** `entrypoints/x.content/index.ts`
- **Verification:** `bun x tsc --noEmit` and `bun run test` pass; behavior mirrors the existing tested pattern for the other three toggles.
- **Committed in:** `486041a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary for FOUC-free behavior consistent with the rest of the toggle set. No scope creep.

## Issues Encountered
None. All three tasks' `<verify><automated>` commands passed on first run; final `bun x tsc --noEmit && bun run test` passed with zero errors (13 test files, 79 tests).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02-02 (Tab Reordering & Auto-Selection Engine) is fully implemented, tested, and committed. CLEAN-04 is code-complete.
- Live x.com selector verification (D-16 provenance for `:nth-child` positional tab targeting) remains an open human-judgment item flagged in the `coverage:` block above — recommend a `/gsd-verify-work` or manual QA pass against live x.com before considering Phase 2 fully shippable, in particular confirming that X's actual tablist DOM order still matches the assumed For You (1st) / Following (2nd) / Lists (3rd+) positions.
- No blockers for subsequent 02-0x plans (Theme engine, etc.) — `features/tab-reorder`'s route-scoped single-activation guard pattern and MutationObserver-fallback-for-late-mount pattern are directly reusable for any future feature needing to react to X's client-side navigation.
- STATE.md, ROADMAP.md, and REQUIREMENTS.md traceability updates were intentionally NOT made by this executor per explicit orchestrator instruction; these must be applied centrally once all Phase 2 plans are complete.

---
*Phase: 02-clean-timeline-themes*
*Completed: 2026-09-13*

## Self-Check: PASSED

All created files verified present; all referenced commit hashes verified present in git log.
