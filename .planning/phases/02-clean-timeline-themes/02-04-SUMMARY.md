---
phase: 02-clean-timeline-themes
plan: 04
subsystem: ui
tags: [wxt, content-script, css-layout-transform, react, vitest, theme-engine]

# Dependency graph
requires:
  - phase: 02-03
    provides: lib/theme-engine.ts CSS generator architecture (generateThemeCss, presetTokenBlock, THEME_PRESETS with old-twitter palette already present), <style id="bt-theme"> zero-FOUC injection, applyThemeAttributes() live-sync via settingsItem.watch(), popup ThemesPanel/ThemeCard 2-column preset grid
provides:
  - Minimal layout CSS transform (THEME-05, D-14): hides sidebarColumn, collapses header[role="banner"] to a 68px icon-only rail, centers primaryColumn (max-width 650px, margin 0 auto)
  - Old Twitter 2015 layout CSS transform (THEME-06, D-15): fixed 46px top navbar, discrete bordered tweet cards (#ffffff on #e6ecf0, 5px radius), 4px rounded-square avatars, 3-column proportions, classic palette token block, responsive 1000px breakpoint
  - entrypoints/x.content/components/MiniProfileCard.tsx: React-rendered classic 2015 dashboard profile card (95px banner, 72px 4px-radius avatar, name/handle, 3-column TWEETS/FOLLOWING/FOLLOWERS stats grid) with mountMiniProfileCard()/unmountMiniProfileCard() lifecycle
  - features/layout-engine/index.ts: layoutEngine controller that non-destructively mounts/unmounts the mini profile card as a sibling before primaryColumn
  - Live layout-engine wiring into entrypoints/x.content/index.ts's theme pipeline (initial load, every SPA route change via setupPage, and live via settingsItem.watch())
  - Distinct ThemeCard mini preview mocks for Minimal (centered narrow column) and Old Twitter (top bar + 3-column) presets
affects: []

# Actuals (#2632)
actuals:
  tokens: 7053
  tasks: 3
  commits: 3
  plan_head_before: 04f40cd6957f2eee0e07d0fed0d81278ec3b4a5f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layout-transform theme presets (Minimal, Old Twitter) are split from the color-engine surface-application presets (Dracula/Nord/Matrix): a preset can carry a `--bt-theme-*` custom-property token block (via the existing presetTokenBlock() helper) without being folded into APPLY_SURFACE_RULES's generic cross-theme background/border application, when its layout requires hardcoded structural CSS instead (fixed positioning, column widths, media queries) rather than a uniform recolor."
    - "layoutEngine (features/layout-engine) is a third dispatch pattern alongside the boolean FeatureController contract (init/teardown) and the direct-DOM theme/accent sync (applyThemeAttributes): it owns only the non-destructive mount/unmount of an injected React island (MiniProfileCard), while all visual styling stays in the CSS-only theme-engine. Called from setupPage() (survives X's SPA route-driven DOM replacement) and from settingsItem.watch() (immediate live switching, D-09)."

key-files:
  created:
    - entrypoints/x.content/components/MiniProfileCard.tsx
    - features/layout-engine/index.ts
    - tests/unit/layout.test.ts
  modified:
    - lib/theme-engine.ts
    - entrypoints/x.content/index.ts
    - entrypoints/popup/ThemeCard.tsx

key-decisions:
  - "Old Twitter's `--bt-theme-*` palette token block is emitted via a new LAYOUT_TOKEN_ONLY_THEME_IDS list (reusing the existing presetTokenBlock() helper from 02-03) rather than adding 'old-twitter' to COLOR_ENGINE_THEME_IDS — its structural layout CSS uses hardcoded classic hex values directly (e.g. `background-color: #ffffff !important` on tweet cards) rather than `var(--bt-theme-surface)`, so the generic APPLY_SURFACE_RULES cross-theme recolor block (which forces the same background/border rule onto header/tweet/sidebar/primaryColumn for every color-engine preset uniformly) would be redundant/conflicting with Old Twitter's more specific structural transform."
  - "layoutEngine.enableOldTwitter()/disableOldTwitter() is called from three places, not one: the early FOUC-prevention block only calls applyThemeAttributes() (CSS-only, DOM not ready yet at document_start for a structural mount); setupPage() (fires on initial load AND every SPA route change) re-syncs the mount because X's client-side navigation can replace the DOM subtree the mini profile card was mounted into; settingsItem.watch() syncs it immediately on a live preset switch with zero reload (D-09). mountMiniProfileCard() unmounts any previous instance first, making repeated calls idempotent and safe across all three call sites."
  - "MiniProfileCard renders placeholder profile data (Your Name / @handle / 0 stats), not live X profile data — wiring it to the real signed-in user's avatar/banner/handle/counts is out of this plan's scope (THEME-06 is the layout-engine mount contract, not a profile-data-fetching feature) and is flagged as a known follow-up rather than a blocking stub, since the card's dimensions/typography/structure — the actual THEME-06 acceptance criteria — are fully correct and testable independent of the data source."
  - "ThemeCard.tsx gained preset-id-specific mini preview mocks for 'minimal' (centered narrow column, no side rails) and 'old-twitter' (top bar strip + 3-column layout) instead of reusing the generic color-swatch mock — without this, Minimal's card would render visually identical to Default's in the Themes panel (both fall back to native --bt-bg/--bt-surface tokens since Minimal enforces no forced palette), failing to convey 'centered, no sidebar' at a glance per UI-SPEC's Themes Panel contract."

patterns-established:
  - "Three-way theme dispatch pattern: (1) boolean FeatureController init()/teardown() for simple toggles, (2) direct applyThemeAttributes()/CSS custom-property sync for color/accent presets, (3) layoutEngine mount/unmount for presets needing an injected React island. Future layout-transform presets can follow pattern 3 directly."

requirements-completed: [THEME-05, THEME-06]

coverage:
  - id: D1
    description: "Minimal Theme (THEME-05) CSS centers the timeline in the viewport (max-width 650px, margin 0 auto), completely hides the right sidebar (display: none), and collapses the left navigation rail to a 68px icon-only rail (D-14)"
    requirement: "THEME-05"
    verification:
      - kind: unit
        ref: "tests/unit/layout.test.ts#Minimal layout engine CSS (THEME-05, D-14)"
        status: pass
    human_judgment: true
    rationale: "CSS selector correctness against live x.com's current header/primaryColumn/sidebarColumn markup (D-16 provenance) cannot be confirmed by unit tests alone — a live x.com pass toggling Minimal is needed to confirm the rail truly collapses to icon-only and the timeline visually centers with no residual right-column gap."
  - id: D2
    description: "Old Twitter Layout (THEME-06) transforms header[role=banner] into a fixed 46px horizontal top navbar, renders discrete bordered tweet cards (#ffffff on #e6ecf0, 1px #e1e8ed border, 5px radius), and converts avatars to 4px rounded squares (D-15)"
    requirement: "THEME-06"
    verification:
      - kind: unit
        ref: "tests/unit/layout.test.ts#Old Twitter 2015 layout engine CSS (THEME-06, D-15)"
        status: pass
    human_judgment: true
    rationale: "Same D-16 live-DOM caveat as D1 — X's header/article/avatar markup must be confirmed live to ensure the transform doesn't clip navigation or misalign avatars in the real virtualized timeline."
  - id: D3
    description: "MiniProfileCard.tsx renders the classic mini profile dashboard card (95px banner, 72px 4px-radius avatar, name/handle, 3-column TWEETS/FOLLOWING/FOLLOWERS stats grid) and mounts non-destructively in the left column via features/layout-engine, gracefully collapsing under 1000px viewports"
    requirement: "THEME-06"
    verification:
      - kind: unit
        ref: "tests/unit/layout.test.ts#MiniProfileCard component (THEME-06, D-15, UI-SPEC § 5) + #layoutEngine (D-09, THEME-06)"
        status: pass
      - kind: other
        ref: "bun x tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "The mount anchor (primaryColumn.parentElement, inserted before primaryColumn) is an empirically-unverified assumption about X's current flex-parent DOM structure (Claude's Discretion per 02-CONTEXT.md) — a live x.com pass is needed to confirm the card actually lands in a visually sensible left-column position and survives X's virtualizer/SPA re-renders in practice, not just in the jsdom-style unit test harness."
  - id: D4
    description: "Live layout switching (D-09): selecting any of the 6 unified presets (Default, Dracula, Nord, Matrix, Minimal, Old Twitter) from the Themes panel applies instantly with zero page reload, and the mini profile card mounts/unmounts live via settingsItem.watch() with no FOUC"
    requirement: "THEME-05"
    verification:
      - kind: other
        ref: "bun x tsc --noEmit && bun run test"
        status: pass
    human_judgment: true
    rationale: "Zero-reload, zero-flicker live switching is fundamentally a real-browser timing/visual guarantee — confirming no flash or layout jump when toggling Old Twitter on/off requires a live x.com pass, not just unit coverage of the JS/CSS that implements the contract."

duration: 20min
completed: 2026-09-13
status: complete
---

# Phase 02 Plan 04: Layout Transformation Engines (Minimal & Old Twitter) Summary

**CSS layout-transform engines for Minimal (THEME-05: centered 650px column, hidden sidebar, 68px icon rail) and Old Twitter 2015 (THEME-06: 46px top navbar, bordered tweet cards, 4px rounded avatars, 3-column layout), plus a React-mounted classic mini profile dashboard card wired into live theme switching with zero reload**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-13T22:17:00Z
- **Completed:** 2026-09-13T22:23:00Z
- **Tasks:** 3/3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- `lib/theme-engine.ts` gained `MINIMAL_LAYOUT_CSS` (hides `sidebarColumn`, collapses `header[role="banner"]` to a 68px icon-only rail, centers `primaryColumn` at max-width 650px) and `OLD_TWITTER_LAYOUT_CSS` (fixed 46px top navbar, `#e6ecf0`/`#ffffff` discrete bordered tweet cards with 5px radius, 4px rounded-square avatars, approximate 590px/290px column widths, and a `@media (max-width: 1000px)` breakpoint collapsing the injected mini profile card), both folded into `generateThemeCss()`. Old Twitter's classic palette token block is emitted via a new `LAYOUT_TOKEN_ONLY_THEME_IDS` list reusing 02-03's `presetTokenBlock()` helper.
- `entrypoints/x.content/components/MiniProfileCard.tsx` implements the classic 2015 dashboard profile card (95px banner with cyan fallback, 72×72px 4px-radius avatar overlapping the banner, display name/handle, and a 3-column TWEETS/FOLLOWING/FOLLOWERS stats grid) with `mountMiniProfileCard(targetEl, beforeEl?)`/`unmountMiniProfileCard()` — idempotent, non-destructive sibling-insert lifecycle functions backed by `react-dom/client`'s `createRoot`.
- `features/layout-engine/index.ts` implements `layoutEngine.enableOldTwitter()`/`disableOldTwitter()`, resolving `primaryColumn` via the existing `lib/selectors.ts` and mounting the card as a preceding sibling — never replacing or reparenting any of X's own DOM.
- `entrypoints/x.content/index.ts` wires `layoutEngine` into the theme pipeline via a new `syncLayoutEngine()` helper: called from `setupPage()` (fires on initial load and every SPA route change, re-mounting the card since X's client routing can replace the subtree it was mounted into) and from `settingsItem.watch()` (immediate live mount/unmount on preset switch, D-09, zero reload).
- `entrypoints/popup/ThemeCard.tsx` gained distinct mini preview mocks for `minimal` (centered narrow column, no side rails) and `old-twitter` (top bar strip + 3-column layout) presets, replacing the generic color-swatch mock that would otherwise render Minimal identically to Default.

## Task Commits

Each task was committed atomically:

1. **Task 1: Minimal layout engine (THEME-05, D-14)** - `4f25bc1` (feat)
2. **Task 2: Old Twitter 2015 layout engine & mini profile card (THEME-06, D-15)** - `8810f09` (feat)
3. **Task 3: Live layout switching integration into unified theme selector (D-09, THEME-05, THEME-06, THEME-07)** - `0d25c84` (feat)

**Plan metadata:** Not committed by this executor — STATE.md, ROADMAP.md, and REQUIREMENTS.md are being handled centrally by the orchestrator after all Phase 2 plans complete, per explicit instruction.

## Files Created/Modified
- `lib/theme-engine.ts` - `MINIMAL_LAYOUT_CSS`, `OLD_TWITTER_LAYOUT_CSS`, `LAYOUT_TOKEN_ONLY_THEME_IDS`/`LAYOUT_PRESET_TOKEN_BLOCKS`; `generateThemeCss()` extended to append both layout transforms
- `entrypoints/x.content/components/MiniProfileCard.tsx` - `MiniProfileCard` component, `mountMiniProfileCard()`, `unmountMiniProfileCard()`
- `features/layout-engine/index.ts` - `layoutEngine.enableOldTwitter()`/`disableOldTwitter()`
- `entrypoints/x.content/index.ts` - `syncLayoutEngine()` helper wired into `setupPage()` and `settingsItem.watch()`
- `entrypoints/popup/ThemeCard.tsx` - preset-id-specific mini preview mocks for `minimal` and `old-twitter`
- `tests/unit/layout.test.ts` - unit coverage for Minimal CSS, Old Twitter CSS, `MiniProfileCard` rendering/mount/unmount/idempotency, and `layoutEngine` mount/unmount (non-destructive DOM check)

## Decisions Made
- Old Twitter's palette tokens are emitted through a dedicated `LAYOUT_TOKEN_ONLY_THEME_IDS` list rather than added to `COLOR_ENGINE_THEME_IDS`, since its structural CSS uses hardcoded classic hex values directly rather than the generic `var(--bt-theme-*)` surface-application rules — see key-decisions in frontmatter for full rationale.
- `layoutEngine` sync is called from three sites (setupPage on load/route-change, settingsItem.watch on live switch) rather than only the early FOUC-prevention block, because a structural React mount can't happen at `document_start` (DOM not ready) and must survive X's SPA route-driven DOM replacement.
- `MiniProfileCard` renders placeholder profile data rather than live X profile data — this is a known, explicitly-scoped follow-up (THEME-06 here is the layout-engine mount contract, not a profile-data-fetching feature), not a blocking stub, since dimensions/typography/structure (the actual acceptance criteria) are fully correct.
- `ThemeCard.tsx` was extended with preset-specific mini mocks for Minimal/Old Twitter so the Themes panel visually distinguishes all 6 presets, since Minimal's empty color tokens would otherwise render identically to Default's card.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended ThemeCard.tsx with distinct Minimal/Old Twitter mini mocks**
- **Found during:** Task 3 (verifying "Minimal mock: centered feed with no sidebar" / "Old Twitter mock: top bar, left profile card, 3-column classic layout" acceptance intent from the plan's action item)
- **Issue:** The existing generic ThemeCard preview (from 02-03) renders a nav-rail + 2 lines + accent-pill mock colored by `preset.bg`/`preset.surface`/`preset.accent`. Since Minimal is a layout-only preset with empty color tokens (falls back to native `--bt-bg`/`--bt-surface`), its card would render visually identical to Default's — failing to convey "centered, distraction-free" as the UI-SPEC's Themes Panel contract requires.
- **Fix:** Added preset-id-specific mock branches for `minimal` (centered narrow column, no side rails) and `old-twitter` (top bar strip + 3-column layout), leaving the generic mock for Default/Dracula/Nord/Matrix.
- **Files modified:** `entrypoints/popup/ThemeCard.tsx`
- **Verification:** `bun x tsc --noEmit` and `bun run test` pass (no existing tests reference ThemeCard's internal markup).
- **Committed in:** `0d25c84` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Directly implements Task 3's own literal action item 2 ("Ensure Minimal and Old Twitter preview cards... properly display their mini preview mocks"); no scope creep beyond what the plan already specified.

## Issues Encountered
- The plan's `<verify><automated>` command (`bun exec vitest run tests/unit/layout.test.ts`) is not runnable in this environment (`bun exec` doesn't resolve `vitest`); `bun x vitest run tests/unit/layout.test.ts` was used instead, per the orchestrator's instruction — identical semantics, consistent with how 02-01/02-02/02-03 handled the same substitution.
- Both Task 1 and Task 2 modify `lib/theme-engine.ts` and `tests/unit/layout.test.ts`. To honor the per-task atomic-commit protocol, the Old Twitter (Task 2) additions were temporarily reverted from both files, Task 1's Minimal-only content was verified and committed first, and the Old Twitter additions were then re-applied and committed separately as Task 2 — rather than landing both tasks' CSS changes in a single combined commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02-04 (Layout Transformation Engines) is fully implemented, tested, and committed. THEME-05 and THEME-06 are code-complete.
- Live x.com visual/structural verification remains an open human-judgment item flagged throughout the `coverage:` block above — recommend a `/gsd-verify-work` or manual QA pass on live x.com before Phase 2 is considered shippable: toggling Minimal to confirm the nav rail truly collapses to icon-only and the timeline centers correctly; toggling Old Twitter to confirm the top navbar doesn't clip real navigation items, tweet cards render correctly bordered in the live virtualized timeline, and the mini profile card lands in a sensible left-column position and survives scrolling/route changes; and confirming zero-reload live switching between all 6 presets shows no flash or layout jump.
- `MiniProfileCard` currently renders placeholder profile data (not the signed-in user's real avatar/banner/handle/counts) — wiring live profile data is a known, explicitly out-of-scope follow-up for a future plan, not a blocker for THEME-06's layout-engine contract.
- This is the last plan in Phase 2 (waves 1-4 all complete: 02-01, 02-02, 02-03, 02-04). STATE.md, ROADMAP.md, and REQUIREMENTS.md traceability updates were intentionally NOT made by this executor per explicit orchestrator instruction — these must be applied centrally now that all Phase 2 plans are complete.

---
*Phase: 02-clean-timeline-themes*
*Completed: 2026-09-13*

## Self-Check: PASSED

All created files verified present; all referenced commit hashes verified present in git log.
