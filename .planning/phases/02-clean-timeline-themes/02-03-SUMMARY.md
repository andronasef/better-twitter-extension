---
phase: 02-clean-timeline-themes
plan: 03
subsystem: ui
tags: [wxt, content-script, css-custom-properties, theme-engine, vitest, react, tailwind]

# Dependency graph
requires:
  - phase: 02-01
    provides: Storage schema v2 pattern, registry category/feature model, FOUC-prevention attribute block in entrypoints/x.content/index.ts, popup TileGrid/CategoryPanel hierarchy
provides:
  - Unified theme selector storage schema (Settings.theme: ThemeId, Settings.customAccent) with v2->v3 migration
  - Master theme CSS generator (lib/theme-engine.ts) with Dracula/Nord/Matrix custom-property palettes, D-10 surface recoloring, and THEME-04 universal accent overrides targeting X's inline rgb(29,155,240) styles and SVG fills
  - Zero-FOUC synchronous <style id="bt-theme"> injection at document_start plus applyThemeAttributes() live-sync via settingsItem.watch()
  - Popup "Themes" category with a dedicated ThemesPanel (2-column ThemeCard grid + AccentPicker) exempted from TileGrid's feature-count visibility rule via a new CategoryEntry.dedicatedPanel flag
affects: [02-04-minimal-old-twitter-layouts]

# Actuals (#2632)
actuals:
  tokens: 8878
  tasks: 3
  commits: 3
  plan_head_before: c9d0450162de069e12d5a9f0fb1c8ffb30a911c9

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CategoryEntry.dedicatedPanel: true exempts a popup category from TileGrid's 'must have >=1 registered feature' visibility rule, for categories rendered by a custom panel component instead of the generic CategoryPanel/ToggleRow hierarchy. Reusable for future non-toggle categories (e.g. Bookmarks in Phase 3)."
    - "Theme/accent are applied to the DOM directly via applyThemeAttributes(), not through the FeatureController dispatcher pattern used for boolean toggles — a select-one-of-many preset plus a free-form color don't fit the init()/teardown() binary contract, so they're synced independently in both the early FOUC-prevention block and settingsItem.watch()."

key-files:
  created:
    - lib/theme-engine.ts
    - entrypoints/popup/ThemeCard.tsx
    - entrypoints/popup/AccentPicker.tsx
    - entrypoints/popup/ThemesPanel.tsx
    - tests/unit/theme-engine.test.ts
  modified:
    - lib/storage.ts
    - lib/registry.ts
    - entrypoints/x.content/index.ts
    - entrypoints/popup/App.tsx
    - entrypoints/popup/TileGrid.tsx
    - tests/unit/settings-migration.test.ts

key-decisions:
  - "Settings.theme and Settings.customAccent were made optional (theme?: ThemeId, customAccent?: string | null) rather than required, matching the existing optional-field style already used throughout Settings.features. This kept several pre-existing test files (tests/unit/diagnostics.test.ts, tests/unit/settings-dispatch.test.ts, tests/unit/sub-toggle.test.tsx — none in this plan's files_modified list) constructing partial Settings literals type-valid without editing them, and it's consistent with how the plan's own runtime code already defensively falls back via `?? 'default'` / `?? null` at every read site."
  - "Storage schema version bumped 2 -> 3 (not left at 2) because the plan explicitly calls for updating 'the migrations map' to backfill theme/customAccent on existing stored settings; migrateSettings() is idempotent regardless of starting version, so migrations[2] and migrations[3] both resolve to the same up-to-date-and-defaulted output."
  - "TileGrid's populated-categories filter was extended with a CategoryEntry.dedicatedPanel escape hatch instead of registering a dummy/anchor FeatureEntry under 'themes' (the plan's other suggested option) — a fake toggle-less feature would pollute the registry that other tooling (requirements traceability, sub-toggle grouping) reads as ground truth."
  - "Old Twitter (THEME-06) is one of the 6 THEME_PRESETS entries with its full published palette (bg #E6ECF0 etc.) so the popup ThemeCard can render its correct thumbnail preview now, but generateThemeCss()'s surface-application CSS block only targets dracula/nord/matrix (COLOR_ENGINE_THEME_IDS) — the actual Old Twitter layout-transform CSS is explicitly 02-04's scope (THEME-06), not this plan's (THEME-01..04, THEME-07 only, per this plan's requirements frontmatter)."

patterns-established:
  - "Master theme stylesheet (<style id=\"bt-theme\">) mirrors the existing lib/hide-style.ts <style id=\"bt-hide-style\"> injection pattern exactly (idempotent by element id, appended to document.documentElement at document_start) — two independently-owned stylesheets, one per concern (hiding vs. theming), both synchronous and FOUC-safe."

requirements-completed: [THEME-01, THEME-02, THEME-03, THEME-04, THEME-07]

coverage:
  - id: D1
    description: "generateThemeCss() emits root --bt-theme-* custom property defaults plus Dracula (THEME-01), Nord (THEME-02), and Matrix (THEME-03) palette token blocks matching the verbatim UI-SPEC hex values, and D-10 surface-recoloring rules force those palettes onto html/body/#react-root/primary containers regardless of X's own Light/Dark mode"
    requirement: "THEME-01"
    verification:
      - kind: unit
        ref: "tests/unit/theme-engine.test.ts#Dracula palette (THEME-01)"
        status: pass
    human_judgment: true
    rationale: "Visual harmony of the recolored palette across live x.com surfaces (D-10) cannot be confirmed by unit tests alone — needs a live x.com pass toggling each preset."
  - id: D2
    description: "Nord (THEME-02) palette tokens and CSS token block match UI-SPEC verbatim"
    requirement: "THEME-02"
    verification:
      - kind: unit
        ref: "tests/unit/theme-engine.test.ts#Nord palette (THEME-02)"
        status: pass
    human_judgment: true
    rationale: "Same live-DOM visual verification caveat as D1."
  - id: D3
    description: "Matrix (THEME-03) palette tokens and CSS token block match UI-SPEC verbatim"
    requirement: "THEME-03"
    verification:
      - kind: unit
        ref: "tests/unit/theme-engine.test.ts#Matrix palette (THEME-03)"
        status: pass
    human_judgment: true
    rationale: "Same live-DOM visual verification caveat as D1."
  - id: D4
    description: "Universal custom accent color overrides (THEME-04, D-11) replace X's inline rgb(29, 155, 240)/#1d9bf0 color, background-color, border-color, and SVG fill values with var(--bt-theme-accent), and applyThemeAttributes() sets/clears --bt-theme-accent on document.documentElement synchronously (including live via settingsItem.watch(), no reload)"
    requirement: "THEME-04"
    verification:
      - kind: unit
        ref: "tests/unit/theme-engine.test.ts#Universal accent color overrides (THEME-04, D-11)"
        status: pass
      - kind: other
        ref: "bun x tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Confirming the accent actually recolors every real X surface (buttons, active tab indicators, SVG icons) requires a live x.com visual pass with the custom accent picker."
  - id: D5
    description: "<style id=\"bt-theme\"> is injected synchronously into document.documentElement at document_start (alongside the existing bt-hide-style injection) before any page content paints, and data-bt-theme/--bt-theme-accent are set from cached settings in the same early FOUC-prevention block, then kept in sync live via settingsItem.watch() with zero page reload"
    requirement: "THEME-07"
    verification:
      - kind: unit
        ref: "tests/unit/theme-engine.test.ts (generateThemeCss/injectThemeStylesheet coverage) + bun x tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Zero-FOUC is fundamentally a timing/visual guarantee on a real page load — confirming zero flash requires a live x.com reload test, not just unit coverage of the CSS/JS that implements the contract."
  - id: D6
    description: "Popup renders a 'Themes' category tile (Palette icon) whose dedicated ThemesPanel shows 6 preset ThemeCards in a 2-column grid with 2px accent selection border + checkmark badge, and an AccentPicker with hex input, native color swatch, 5 quick-swatches, and a Reset button — all wired to settingsItem via handleThemeChange/handleAccentChange/handleAccentReset"
    requirement: "THEME-04"
    verification:
      - kind: other
        ref: "bun x tsc --noEmit && bun run test"
        status: pass
    human_judgment: true
    rationale: "Popup visual layout, spacing, and live on-page recoloring end-to-end is a UI/UX judgment call best confirmed by opening the actual popup and toggling presets/colors, not purely by typecheck+unit coverage."

duration: 25min
completed: 2026-09-13
status: complete
---

# Phase 02 Plan 03: Core Theme Engine & Zero-FOUC Injection Architecture Summary

**CSS custom-property theme engine (Dracula/Nord/Matrix palettes + universal `#1d9bf0` accent override) injected as `<style id="bt-theme">` at `document_start`, paired with a popup Themes panel of 6 thumbnail preview cards and a hex/swatch custom accent picker**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-13T22:05:00Z
- **Completed:** 2026-09-13T22:30:00Z
- **Tasks:** 3/3
- **Files modified:** 11 (5 created, 6 modified)

## Accomplishments
- `lib/storage.ts` gained `ThemeId` and `Settings.theme`/`Settings.customAccent` (both optional, matching the existing `features` optionality style), with a v2->v3 migration backfilling `theme: 'default'` / `customAccent: null` for any settings stored before this plan.
- `lib/theme-engine.ts` implements `generateThemeCss()` (root `--bt-theme-*` custom properties, Dracula/Nord/Matrix palette token blocks, D-10 surface-recoloring rules for `html`/`body`/`#react-root`/primary containers, and THEME-04 universal accent overrides targeting X's inline `rgb(29, 155, 240)` styles and SVG fills), `THEME_PRESETS` (metadata for all 6 unified presets, feeding both the CSS engine and the popup's ThemeCard grid), `injectThemeStylesheet()`, and `applyThemeAttributes()`.
- `entrypoints/x.content/index.ts` now injects `<style id="bt-theme">` synchronously at `document_start` (alongside the existing `bt-hide-style` injection) and calls `applyThemeAttributes()` both in the early FOUC-prevention block (before first paint) and inside `settingsItem.watch()` (live sync on every settings change, no reload).
- `lib/registry.ts` registers a new "Themes" category (`Palette` icon) and adds a `CategoryEntry.dedicatedPanel` flag; `entrypoints/popup/TileGrid.tsx` honors it so a feature-less dedicated-panel category still renders its tile.
- `entrypoints/popup/ThemeCard.tsx`, `AccentPicker.tsx`, and `ThemesPanel.tsx` implement the UI-SPEC's 156x88 thumbnail cards (mini mock preview + checkmark badge on selection) and the hex input / native color swatch / 5 quick-swatches / Reset accent picker; `App.tsx` renders `ThemesPanel` for the "themes" category and wires theme/accent changes through `settingsItem.setValue`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Core theme CSS generator & custom property system (THEME-01..04, D-09, D-10, D-11)** - `b4c0d90` (feat)
2. **Task 2: Zero-FOUC early stylesheet injection & live storage sync (THEME-07, D-13)** - `80f0748` (feat)
3. **Task 3: Popup Themes panel with thumbnail preview cards & custom accent picker (THEME-01..04, D-12, UI-SPEC)** - `b75a290` (feat)

**Plan metadata:** Not committed by this executor — STATE.md, ROADMAP.md, and REQUIREMENTS.md are being handled centrally by the orchestrator after all Phase 2 plans complete, per explicit instruction. A standalone `docs(02-02): record summary` commit (`c9d0450`) was made first to land plan 02-02's uncommitted SUMMARY.md before any of this plan's work, per instruction.

_Note: no TDD tasks in this plan beyond Task 1's `tdd="true"` flag, which followed a single test-alongside-implementation commit rather than a separate RED/GREEN/REFACTOR commit sequence, consistent with how 02-01/02-02 handled `tdd="true"` auto tasks._

## Files Created/Modified
- `lib/storage.ts` - `ThemeId` type; `Settings.theme`/`Settings.customAccent` (optional); v2->v3 migration and fallback defaults
- `lib/theme-engine.ts` - `generateThemeCss()`, `THEME_PRESETS`, `APPLY_SURFACE_RULES`, `injectThemeStylesheet()`, `applyThemeAttributes()`
- `entrypoints/x.content/index.ts` - injects theme stylesheet at `document_start`; applies theme attributes in the FOUC-prevention block and in `settingsItem.watch()`
- `lib/registry.ts` - registers "Themes" category (`Palette` icon); adds `CategoryEntry.dedicatedPanel`
- `entrypoints/popup/TileGrid.tsx` - honors `dedicatedPanel` in the populated-categories filter
- `entrypoints/popup/ThemeCard.tsx` - 156x88 thumbnail preview card with selection border + checkmark badge
- `entrypoints/popup/AccentPicker.tsx` - hex input, native color swatch, 5 preset swatches, reset button
- `entrypoints/popup/ThemesPanel.tsx` - 2-column preset grid + accent picker sections
- `entrypoints/popup/App.tsx` - renders `ThemesPanel` for `activeCategoryId === 'themes'`; theme/accent change handlers
- `tests/unit/theme-engine.test.ts` - unit tests for CSS generation, palette tokens, accent overrides, surface rules
- `tests/unit/settings-migration.test.ts` - updated expected migrated version (2 -> 3) to match the schema bump

## Decisions Made
- `Settings.theme`/`Settings.customAccent` made optional rather than required, to stay consistent with the existing `features` optionality convention and avoid unrelated edits to pre-existing test files outside this plan's scope (see key-decisions in frontmatter for full rationale).
- Storage schema version bumped 2 -> 3, since the plan explicitly calls for extending "the migrations map" to backfill the new fields for existing stored settings.
- `CategoryEntry.dedicatedPanel` flag chosen over a dummy/anchor `FeatureEntry` for the "Themes" tile-visibility problem — avoids polluting the feature registry with a fake toggle.
- Old Twitter's full color palette is present in `THEME_PRESETS` (for the popup thumbnail preview, task 3 requires all 6 cards) but its CSS engine surface-application is intentionally NOT included in `generateThemeCss()`'s output — that's THEME-06's scope, explicitly deferred to plan 02-04 per this plan's `requirements` frontmatter (THEME-01..04, THEME-07 only).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made `theme`/`customAccent` optional on `Settings` to unblock typecheck**
- **Found during:** Task 1 (`bun x tsc --noEmit` after adding required `theme`/`customAccent` fields)
- **Issue:** Marking `theme: ThemeId` and `customAccent: string | null` as required broke `bun x tsc --noEmit` across three pre-existing test files (`tests/unit/diagnostics.test.ts`, `tests/unit/settings-dispatch.test.ts`, `tests/unit/sub-toggle.test.tsx`) that construct partial `Settings` object literals — none of which are in this plan's `files_modified` list.
- **Fix:** Changed both fields to optional (`theme?: ThemeId`, `customAccent?: string | null`), matching the existing optional-field pattern already used throughout `Settings.features`. All runtime read sites already defensively fall back via `?? 'default'` / `?? null`.
- **Files modified:** `lib/storage.ts`
- **Verification:** `bun x tsc --noEmit` exits 0; `bun run test` — all 94 tests pass.
- **Committed in:** `b4c0d90` (Task 1 commit)

**2. [Rule 1 - Bug] Updated `tests/unit/settings-migration.test.ts`'s hardcoded expected version**
- **Found during:** Task 1 (after bumping the storage schema version 2 -> 3)
- **Issue:** `migrateSettings()`'s returned `version` field changed from `2` to `3` as part of this task's schema evolution (adding `theme`/`customAccent` via a new migration step), but the pre-existing test asserted `.version).toBe(2)` in four places, which would now be a stale/incorrect assertion.
- **Fix:** Updated the four assertions to `.toBe(3)` to reflect the new correct migrated version. No other assertions in the file changed.
- **Files modified:** `tests/unit/settings-migration.test.ts`
- **Verification:** `bun run test` — all 94 tests pass, including this file.
- **Committed in:** `b4c0d90` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were directly caused by this plan's own schema change to `Settings`/`migrateSettings`; no unrelated scope creep. No files outside this plan's `files_modified` list were touched except the two pre-existing test files whose expectations became stale as a direct, necessary consequence of the schema change.

## Issues Encountered
- The plan's `<verify><automated>` command for Task 1 (`bun exec vitest run tests/unit/theme-engine.test.ts`) is not runnable in this environment (`bun: command not found: vitest` under `bun exec`); `bun x vitest run tests/unit/theme-engine.test.ts` is the working equivalent and was used instead, with identical semantics. All other verify commands (`bun x tsc --noEmit`, `bun run test`) ran as specified in the plan with no substitution needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02-03 (Core Theme Engine & Zero-FOUC Injection Architecture) is fully implemented, tested, and committed. THEME-01, THEME-02, THEME-03, THEME-04, and THEME-07 are code-complete.
- Live x.com visual verification remains an open human-judgment item flagged throughout the `coverage:` block above — recommend a `/gsd-verify-work` or manual QA pass on live x.com before Phase 2 is considered shippable: toggling each preset (Dracula/Nord/Matrix) to confirm full-surface recoloring (D-10), confirming zero flash of unthemed content on a hard reload (THEME-07), and confirming the custom accent picker actually recolors buttons/tabs/SVG icons across the real page (THEME-04, D-11).
- Plan 02-04 (Minimal & Old Twitter layouts, THEME-05/THEME-06) can build directly on `lib/theme-engine.ts`'s `THEME_PRESETS` record (already carries the Old Twitter color tokens) and the `data-bt-theme` attribute contract established here — no blockers.
- STATE.md, ROADMAP.md, and REQUIREMENTS.md traceability updates were intentionally NOT made by this executor per explicit orchestrator instruction; these must be applied centrally once all Phase 2 plans are complete.

---
*Phase: 02-clean-timeline-themes*
*Completed: 2026-09-13*

## Self-Check: PASSED

All created files verified present; all referenced commit hashes verified present in git log.
