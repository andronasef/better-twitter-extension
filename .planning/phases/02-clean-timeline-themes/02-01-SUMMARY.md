---
phase: 02-clean-timeline-themes
plan: 01
subsystem: ui
tags: [react, typescript, wxt, radix-ui, vitest, css-attribute-hiding]

# Dependency graph
requires:
  - phase: 01-foundation-settings-popup
    provides: Popup shell (App.tsx, CategoryPanel.tsx, ToggleRow.tsx), feature registry pattern, settings storage schema v1, content-script settings dispatcher, data-bt-* attribute hiding convention
provides:
  - Storage schema v2 with cleanSidebar, hideVanityMetrics, hideProfileCounts flags and v1->v2 migration
  - Non-destructive vanity metrics stripper (tweet action counts, analytics/view count, tweet-detail stats row) via data-bt-hide-metrics CSS attribute
  - Native tooltip sanitizer (MutationObserver on [role="tooltip"], regex count-label stripping)
  - Independent profile follower/following count sub-toggle (data-bt-hide-profile-counts)
  - Right sidebar clutter stripper (Trends, Who to Follow, Premium upsells) scoped to sidebarColumn via data-bt-clean-sidebar
  - Popup registry parentId support for hierarchical sub-toggles
  - SubToggleRow component (28px indent, connector line, parent-off dimming/disable)
  - CategoryPanel nested sub-toggle rendering
affects: [03-bookmarks, 04-twemoji-reactions]

# Actuals (#2632)
actuals:
  tokens: 9700
  tasks: 3
  commits: 3
  plan_head_before: 945a049307a2b3d76fb1976fc0f8a3ec71dc6f66

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sub-toggle hierarchy: FeatureEntry.parentId links a child feature to a parent; CategoryPanel filters children by parentId and passes parentEnabled down to SubToggleRow, which self-dims/disables when the parent is OFF."
    - "All new declutter features follow the Phase 1 controller contract: id + init()/teardown() setting/removing a single html[data-bt-*] attribute, consumed by the existing createSettingsDispatcher diffing logic — zero new dispatcher wiring patterns needed."

key-files:
  created:
    - features/metrics-stripper/index.ts
    - features/sidebar-cleaner/index.ts
    - entrypoints/popup/SubToggleRow.tsx
    - tests/unit/metrics.test.ts
    - tests/unit/clutter.test.ts
    - tests/unit/settings-migration.test.ts
    - tests/unit/sub-toggle.test.tsx
  modified:
    - lib/storage.ts
    - lib/selectors.ts
    - lib/hide-style.ts
    - lib/registry.ts
    - entrypoints/x.content/index.ts
    - entrypoints/popup/CategoryPanel.tsx

key-decisions:
  - "Sub-toggle indent uses pl-7 (28px) per UI-SPEC's explicit Sub-Toggle Visual Hierarchy Contract, not the unrelated 32px/pl-8 general spacing-scale token."
  - "hideProfileCounts is a true independent sub-toggle of hideVanityMetrics: its own data-bt-hide-profile-counts attribute and its own profileCountsStripper controller, so it can be toggled off while metrics-hiding stays on (and vice versa within the UI constraint that the switch dims when the parent is off)."

patterns-established:
  - "Pattern: registry parentId + CategoryPanel childFeatures filter + SubToggleRow parentEnabled prop is now the standard way to add dependent/nested toggles for any future category (Themes panel in a later 02-0x plan can reuse this)."

requirements-completed: [CLEAN-02, CLEAN-03, CLEAN-05]

coverage:
  - id: D1
    description: "Vanity metrics stripper hides tweet action counts, analytics/view count, and tweet-detail stats row via data-bt-hide-metrics CSS attribute, leaving action buttons interactive"
    requirement: "CLEAN-05"
    verification:
      - kind: unit
        ref: "tests/unit/metrics.test.ts"
        status: pass
    human_judgment: true
    rationale: "CSS selector correctness against live x.com DOM (D-16 provenance) cannot be confirmed by unit tests alone — visual/functional verification on real x.com is needed to confirm action icons stay clickable and counts are actually gone in the rendered page."
  - id: D2
    description: "Native tooltip sanitizer strips numeric counts from hover tooltips (e.g. '24 Likes' -> 'Like')"
    requirement: "CLEAN-05"
    verification:
      - kind: unit
        ref: "tests/unit/metrics.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Profile follower/following counts hidden independently via data-bt-hide-profile-counts sub-toggle"
    requirement: "CLEAN-05"
    verification:
      - kind: unit
        ref: "tests/unit/settings-migration.test.ts"
        status: pass
    human_judgment: true
    rationale: "Selector correctness on live profile pages needs visual confirmation."
  - id: D4
    description: "Right sidebar clutter stripper bundles Trends, Who to Follow, and Premium upsell removal scoped to sidebarColumn"
    requirement: "CLEAN-02"
    verification:
      - kind: unit
        ref: "tests/unit/clutter.test.ts"
        status: pass
    human_judgment: true
    rationale: "Scoping correctness (no collateral hiding on Explore/search pages) needs visual confirmation on live x.com."
  - id: D5
    description: "Right sidebar clutter stripper (Who to Follow) — same toggle as D4"
    requirement: "CLEAN-03"
    verification:
      - kind: unit
        ref: "tests/unit/clutter.test.ts"
        status: pass
    human_judgment: true
    rationale: "Same live-DOM caveat as D4."
  - id: D6
    description: "Settings schema v1->v2 migration adds cleanSidebar, hideVanityMetrics, hideProfileCounts defaulted to false without losing existing user settings"
    verification:
      - kind: unit
        ref: "tests/unit/settings-migration.test.ts"
        status: pass
    human_judgment: false
  - id: D7
    description: "Popup registry registers cleanSidebar/hideVanityMetrics/hideProfileCounts with parentId support and verbatim UI-SPEC titles/tooltips; SubToggleRow renders 28px-indented, connector-lined, parent-off-dimmed sub-toggles nested under parents in CategoryPanel"
    verification:
      - kind: unit
        ref: "tests/unit/sub-toggle.test.tsx"
        status: pass
      - kind: other
        ref: "bun x tsc --noEmit"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-13
status: complete
---

# Phase 02 Plan 01: Timeline & Sidebar Declutter Engine Summary

**Non-destructive vanity-metrics stripper, tooltip sanitizer, right-sidebar clutter remover, and popup sub-toggle hierarchy (CLEAN-02, CLEAN-03, CLEAN-05) built on CSS attribute hiding with a v1->v2 settings migration**

## Performance

- **Duration (this session, Task 3 only):** ~5 min — Tasks 1 and 2 were already implemented and committed prior to this session (see Task Commits below).
- **Started:** 2026-09-13T19:30:06+03:00 (Task 1 commit)
- **Completed:** 2026-09-13T21:52:02+03:00
- **Tasks:** 3/3
- **Files modified:** 13 (7 created, 6 modified) across the full plan

## Accomplishments
- Storage schema bumped to v2 with `cleanSidebar`, `hideVanityMetrics`, `hideProfileCounts` flags and a tested v1->v2 migration that preserves existing user settings.
- Vanity metrics stripper (`features/metrics-stripper/index.ts`) hides tweet action counts, analytics/view counts, and the tweet-detail stats row via `data-bt-hide-metrics`, while a MutationObserver-driven tooltip sanitizer rewrites native hover tooltip text (e.g. "24 Likes" -> "Like").
- Independent `hideProfileCounts` sub-toggle (`profileCountsStripper`) hides follower/following counts via its own `data-bt-hide-profile-counts` attribute.
- Right sidebar clutter stripper (`features/sidebar-cleaner/index.ts`) bundles Trends, Who to Follow, and Premium upsell removal into one `cleanSidebar` toggle, strictly scoped to `div[data-testid="sidebarColumn"]` to avoid collateral hiding on Explore/search pages.
- Popup registry (`lib/registry.ts`) gained `parentId` support; `cleanSidebar`, `hideVanityMetrics`, and `hideProfileCounts` are registered with verbatim UI-SPEC titles/tooltips.
- New `SubToggleRow` component renders 28px-indented (`pl-7`) sub-toggles with a visual connector line, dimming to 50% opacity and disabling its switch when the parent toggle is OFF.
- `CategoryPanel` now renders child features nested directly beneath their parent `ToggleRow`, passing the parent's live enabled state down as `parentEnabled`.

## Task Commits

Task 1 and Task 2 were completed and committed in a prior session; Task 3 was completed in this session.

1. **Task 1: Vanity metrics stripper & tooltip sanitizer (CLEAN-05, D-01, D-02, D-03, D-04)** - `6633f90` (feat)
2. **Task 2: Right sidebar clutter stripper (CLEAN-02, CLEAN-03, D-08)** - `85f83d7` (feat)
3. **Task 3: Popup settings integration for Clean Timeline & sub-toggles (D-01, D-03, D-08, UI-SPEC)** - `0010592` (feat)

**Unrelated stray working-tree changes** (pre-existing, not part of this plan; swept into a separate commit at the user's direction so they didn't block the Task 3 commit): `157a2eb` (chore) — prettier reformatting of `components/shadow-portal.tsx`, a type-widening fix in `entrypoints/x.content/dispatcher.ts` (`lastApplied: Record<string, boolean | undefined>`), and a phase-renumbering edit in `.planning/REQUIREMENTS.md` (Bookmarks phases 3-4 merged into Phase 3).

**Plan metadata:** Not committed by this executor — STATE.md, ROADMAP.md, and REQUIREMENTS.md are being handled centrally by the orchestrator after all Phase 2 plans complete, per explicit instruction.

## Files Created/Modified
- `lib/storage.ts` - Settings v2 schema (cleanSidebar, hideVanityMetrics, hideProfileCounts) with v1->v2 migration
- `lib/selectors.ts` - tweetActionBar, tweetActionMetric, analyticsButton, detailStatsRow, profileFollowerCounts, profileFollowingCounts, nativeTooltip, sidebarColumn, trendsModule, whoToFollowModule, premiumModule selectors with D-16 provenance
- `lib/hide-style.ts` - CSS_RULES for data-bt-hide-metrics, data-bt-hide-profile-counts, data-bt-clean-sidebar
- `features/metrics-stripper/index.ts` - metricsStripper + profileCountsStripper controllers, tooltip sanitizer observer
- `features/sidebar-cleaner/index.ts` - sidebarCleaner controller
- `entrypoints/x.content/index.ts` - registers new controllers in settings dispatcher, applies initial data-bt-* attributes to prevent FOUC
- `lib/registry.ts` - parentId support on FeatureEntry; registers cleanSidebar, hideVanityMetrics, hideProfileCounts
- `entrypoints/popup/SubToggleRow.tsx` - indented, connector-lined, parent-dimmed sub-toggle row component
- `entrypoints/popup/CategoryPanel.tsx` - renders nested sub-toggles under parent ToggleRow
- `tests/unit/metrics.test.ts`, `tests/unit/clutter.test.ts`, `tests/unit/settings-migration.test.ts`, `tests/unit/sub-toggle.test.tsx` - unit test coverage for all of the above

## Decisions Made
- Used `pl-7` (28px) for sub-toggle indentation per the UI-SPEC's explicit Sub-Toggle Visual Hierarchy Contract section, not the unrelated 32px (`pl-8`) general spacing-scale token that appears elsewhere in the same document for a different purpose (back-chevron hit area).
- Kept `hideProfileCounts` as a fully independent controller/attribute (`data-bt-hide-profile-counts`) rather than folding it into `hideVanityMetrics`'s attribute, so its stored value is preserved even while visually dimmed/disabled when the parent is off — matching UI-SPEC's "Sub-toggle switch remains in its saved state" requirement.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1-2 were pre-completed in a prior session; Task 3 was verified against the plan's acceptance criteria and found already fully implemented in the working tree (registry, SubToggleRow, CategoryPanel, sub-toggle test file) — this session's work was verification (tsc, vitest), committing, and separating out 3 unrelated stray working-tree changes that predate this plan's scope.

## Issues Encountered
None. `bun x tsc --noEmit` passed with zero errors and `bun run test` passed all 12 test files / 68 tests on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02-01 (Timeline & Sidebar Declutter Engine) is fully implemented, tested, and committed.
- All three requirements this plan targets (CLEAN-02, CLEAN-03, CLEAN-05) are code-complete; live x.com selector verification (D-16 provenance) remains an open human-judgment item flagged in the `coverage:` block above — recommend a `/gsd-verify-work` or manual QA pass against live x.com before considering Phase 2 fully shippable.
- No blockers for subsequent 02-0x plans (Themes panel, etc.) — the `parentId`/`SubToggleRow`/`CategoryPanel` sub-toggle pattern established here is directly reusable for the "Following first on Home" / "Hide For You tab completely" sub-toggles referenced in the UI-SPEC's Component Inventory.
- STATE.md, ROADMAP.md, and REQUIREMENTS.md traceability updates were intentionally NOT made by this executor per explicit orchestrator instruction; these must be applied centrally once all Phase 2 plans are complete.

---
*Phase: 02-clean-timeline-themes*
*Completed: 2026-09-13*

## Self-Check: PASSED

All created files verified present; all referenced commit hashes verified present in git log.
