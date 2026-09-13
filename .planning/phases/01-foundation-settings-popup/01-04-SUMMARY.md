---
phase: 01-foundation-settings-popup
plan: 04
subsystem: popup-and-theming
tags: [popup, radix-ui, tailwindcss, typography, fonts, themes, tile-grid, tooltips]

requires:
  - phase: 01-01
    provides: Walking skeleton, settings store, storage definitions
  - phase: 01-02
    provides: Bridge, route watcher, global observers
  - phase: 01-03
    provides: Diagnostics store, selector miss reporting
provides:
  - Value-based theme resolver with prefers-color-scheme fallback (lib/theme.ts)
  - Layout-free body background observer probe (entrypoints/x.content/theme-probe.ts)
  - Bundled Inter static Latin cuts (400 & 700) and SIL OFL 1.1 license (public/fonts/)
  - BTPopupSans font-family stack matching X fallback chain with zero outbound requests (entrypoints/popup/popup.css)
  - Registry-driven 3-column tile grid with empty state (entrypoints/popup/TileGrid.tsx)
  - In-place category panel with accessible back chevron navigation (entrypoints/popup/CategoryPanel.tsx)
  - Toggle row with keyboard-accessible info tooltip and diagnostics warning strip (entrypoints/popup/ToggleRow.tsx)
  - Fixed 360x480 popup shell with manifest runtime version footer (entrypoints/popup/App.tsx)
  - Playwright UI states and interaction contract test suite (e2e/popup-states.spec.ts)
affects: [01-05, phase-02, phase-06]

actuals:
  tokens: 42000
  tasks: 3
  commits: 3

tech-stack:
  added: ["@fontsource/inter@5.3.0 (devDependency for font vendoring)"]
  patterns: [value-driven-theme-derivation, extension-origin-bundled-fonts, registry-driven-tile-grid, in-place-viewport-swap, keyboard-accessible-tooltips]

key-files:
  created:
    - lib/theme.ts
    - entrypoints/x.content/theme-probe.ts
    - entrypoints/popup/popup.css
    - entrypoints/popup/TileGrid.tsx
    - entrypoints/popup/CategoryPanel.tsx
    - entrypoints/popup/ToggleRow.tsx
    - public/fonts/inter-400.woff2
    - public/fonts/inter-700.woff2
    - public/fonts/OFL.txt
    - tests/unit/theme.test.ts
    - e2e/popup-states.spec.ts
  modified:
    - package.json
    - bun.lock
    - components/ui/tooltip.tsx
    - entrypoints/x.content/index.ts
    - entrypoints/popup/App.tsx
    - entrypoints/popup/main.tsx
    - e2e/selector-miss.spec.ts

key-decisions:
  - "Task 1 approved @fontsource/inter for vendoring: static Latin 400 and 700 cuts (~24KB each) copied to public/fonts/ with SIL OFL 1.1 license text, guaranteeing zero runtime network requests"
  - "Theme derived strictly by value (rgb(255,255,255) -> light, rgb(0,0,0) and rgb(5,5,5) -> dark) with an explicit 'unknown' branch falling back to prefers-color-scheme"
  - "Body background probe reads inline style directly without layout reads (getComputedStyle) and registers in globalObserver scope"
  - "Popup frame strictly locked at 360x480 on both axes with in-place viewport swap to eliminate window resize stutter"
  - "Tooltip trigger is restricted to the Info glyph alone (not the row), is focusable by keyboard, and disables hoverable content bridge to prevent accidental sticking"
  - "Diagnostics warning strip renders directly beneath the affected row on a 10%-alpha warn tint with switch remaining interactive"

patterns-established:
  - "BTPopupSans typography stack: BTPopupSans followed verbatim by X's native fallback chain"
  - "Theme CSS variable injection on popup root based on cached XTheme"
  - "Registry-driven category filtering: only categories with >= 1 registered feature render in the grid"

requirements-completed: [UI-01, UI-02, UI-03, UI-04, UI-05]

coverage:
  - id: D1
    description: "Value-based theme mapping and prefers-color-scheme fallback logic"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/unit/theme.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bundled font assets under 60KB each with OFL license and zero external network URLs"
    requirement: UI-04
    verification:
      - kind: other
        ref: "node font asset size and CSP audit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Popup shell, tile grid, category navigation, tooltips, empty and error states, and visual backstops"
    requirement: [UI-01, UI-02, UI-05]
    verification:
      - kind: e2e
        ref: "e2e/popup-states.spec.ts"
        status: pass
    human_judgment: false

duration: 35 min
completed: 2026-09-13
status: complete
---

# Phase 1 Plan 04: Popup UI Expansion & Theming Summary

**Registry-driven settings popup with categorical icon tiles, in-place category panels, bundled BTPopupSans typeface with zero outbound requests, value-based X theme derivation, keyboard-accessible tooltips, and comprehensive UI state verification.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-13T17:57:00+03:00
- **Completed:** 2026-09-13T18:06:00+03:00
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments

- **Task 1 (Font Source Gate):** Confirmed package legitimacy for `@fontsource/inter` (canonical repo `fontsource/font-files`, 2.18M weekly downloads, OFL-1.1 license, zero postinstall scripts). User explicitly approved installing and extracting static cuts.
- **Task 2 (Theme Probe & Fonts):**
  - Created `lib/theme.ts` exporting `schemeForBackground` (mapping `rgb(255, 255, 255)` to light, `rgb(0, 0, 0)` and `rgb(5, 5, 5)` to dark, and all other values to `'unknown'`) and `resolveScheme` (falling back to `prefers-color-scheme`).
  - Created `entrypoints/x.content/theme-probe.ts` observing `document.body` inline styles layout-free via a global MutationObserver and caching updates to `local:xTheme`.
  - Extracted static Latin 400 (`23.66 KB`) and 700 (`24.36 KB`) cuts to `public/fonts/` alongside `OFL.txt`.
  - Declared `BTPopupSans` in `entrypoints/popup/popup.css` resolved from the extension origin via `runtime.getURL` with `font-display: block` and `@media (prefers-reduced-motion)` overrides.
  - Verified no CSP overrides in built `manifest.json` and zero external URLs across all stylesheets.
- **Task 3 (Full Popup Shell):**
  - Built `entrypoints/popup/TileGrid.tsx`: 3-column grid mapping over categories with `>= 1` registered feature, 104x104 buttons, and centered empty-state fallback ("No settings yet").
  - Built `entrypoints/popup/CategoryPanel.tsx`: in-place view swap with 120ms ease-out cross-fade and 4px slide, accessible back chevron button ("Back to all settings"), and feature toggle list.
  - Built `entrypoints/popup/ToggleRow.tsx`: 48px-minimum rows, left-aligned title with 16px info tooltip trigger button, right-aligned `Switch`, and inline diagnostics warning strip ("Not matching X's current layout") when a selector miss is recorded.
  - Hardened `components/ui/tooltip.tsx` with `disableHoverableContent = true`.
  - Expanded `entrypoints/popup/App.tsx`: 360x480 fixed frame, runtime manifest version footer with GitHub issue link, and full-viewport unreadable-settings error state.
  - Added comprehensive `e2e/popup-states.spec.ts` covering all 7 declared UI states, interaction contracts, and visual backstop floors (12 synthetic toggles scroll inside 392px viewport; 40-char category & 60-char title wrap cleanly without horizontal overflow).

## Theme & Dim Cohort Status

- **Theme Strategy:** Mapped strictly by observable background color values rather than hardcoded scheme names.
- **Dim Cohort Resolution:** Any unmapped slate-blue background value automatically returns `'unknown'` and safely falls back to `prefers-color-scheme` without breaking the popup layout. If live telemetry or manual testing observes active Dim users, a fourth value map entry can be added without any architectural changes.

## Font Path Verification

- **Approved Path:** `@fontsource/inter` devDependency package path approved at Task 1.
- **Static Cuts:** Only static Latin 400 and 700 cuts extracted (under 25KB each, well below the 60KB ceiling).
- **Zero Outbound Requests:** Every font face resolves from `chrome-extension://...` origin via WXT asset bundling; no requests are made to `abs.twimg.com` or any external CDN.

## Self-Check: PASSED

- `wxt prepare` & `tsc --noEmit` exit 0 cleanly.
- `lib/theme.ts` exports `schemeForBackground` and `resolveScheme` with `unknown` branch.
- Zero references to `LightsOut` across all source files.
- Zero `getComputedStyle` calls in `theme-probe.ts`.
- Zero external HTTP/HTTPS font URLs in CSS files.
- Manifest contains zero `content_security_policy` overrides.
- Exactly one `TooltipProvider` rendered across the popup.
- Version string dynamically read from runtime manifest.
- All 39 Vitest unit tests pass across 7 test suites.
- All 11 Playwright E2E tests pass (`popup-states`, `route-change`, `scroll-performance`, `selector-miss`, `tracer`).
