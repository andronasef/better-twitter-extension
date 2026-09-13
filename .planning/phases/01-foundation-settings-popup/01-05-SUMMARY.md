---
phase: 01-foundation-settings-popup
plan: 05
subsystem: shadow-dom-and-compliance
tags: [shadow-dom, radix-ui, portal, audit, single-purpose, compliance, spikes]

requires:
  - phase: 01-01
    provides: Walking skeleton, styling tokens
  - phase: 01-02
    provides: Bridge, route watcher, global observers
  - phase: 01-03
    provides: Diagnostics store, selector miss reporting
  - phase: 01-04
    provides: Popup shell, bundled fonts, theme resolution
provides:
  - ShadowRoot React context provider and hook (components/shadow-portal.tsx)
  - Shadow-safe Radix Popover wrapper with composed-path outside click (components/shadow-ui/BtPopover.tsx)
  - Shadow-safe Radix DropdownMenu wrapper with composed-path outside click (components/shadow-ui/BtDropdownMenu.tsx)
  - Shadow-safe Radix Tooltip wrapper with composed-path outside click (components/shadow-ui/BtTooltip.tsx)
  - Dev-only Radix in ShadowRoot probe entrypoint (entrypoints/probe.content/)
  - Standing automated production build audit gate (scripts/audit-build.mjs)
  - Locked single-purpose narrative and permission ledger (.planning/phases/01-foundation-settings-popup/PURPOSE.md)
  - API coverage and subtraction record (.planning/phases/01-foundation-settings-popup/COVERAGE.md)
  - Spike S3 finding and inherited pattern document (.planning/phases/01-foundation-settings-popup/spikes/S3-radix-shadow-root.md)
affects: [phase-02, phase-04, phase-05, phase-06]

actuals:
  tokens: 46000
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: [shadow-root-portal-delegation, composed-path-outside-click-discrimination, dev-only-entrypoint-exclusion, standing-build-audit-gate]

key-files:
  created:
    - components/shadow-portal.tsx
    - components/shadow-ui/BtPopover.tsx
    - components/shadow-ui/BtDropdownMenu.tsx
    - components/shadow-ui/BtTooltip.tsx
    - components/ui/popover.tsx
    - components/ui/dropdown-menu.tsx
    - entrypoints/probe.content/index.tsx
    - entrypoints/probe.content/ProbePanel.tsx
    - entrypoints/probe.content/probe.css
    - tests/unit/shadow-portal.test.tsx
    - scripts/audit-build.mjs
    - .planning/phases/01-foundation-settings-popup/PURPOSE.md
    - .planning/phases/01-foundation-settings-popup/COVERAGE.md
    - .planning/phases/01-foundation-settings-popup/spikes/S3-radix-shadow-root.md
  modified:
    - package.json
    - e2e/popup-states.spec.ts
    - e2e/route-change.spec.ts
    - e2e/scroll-performance.spec.ts
    - e2e/selector-miss.spec.ts
    - e2e/tracer.spec.ts

key-decisions:
  - "Built ShadowRootProvider and usePortalContainer returning undefined outside providers, ensuring zero disruption to extension popup while guaranteeing portalled content in content scripts mounts directly into ShadowRoot"
  - "Composed-path comparison implemented across all three shadow wrappers (BtPopover, BtDropdownMenu, BtTooltip) to defeat event-retargeting false positives on pointerdown"
  - "Exclusion of probe entrypoint verified at build time: development produces 2 content scripts, production bundle produces exactly 1 content script"
  - "Zero Dialog or Sheet components installed; all modal or floating interactions rely on anchored non-modal primitives"
  - "Standing build audit gate wired to 'bun run build' and 'package.json'; asserts minimal permissions (storage only), zero host permissions, scoped resources, single content script, zero CSP overrides, and zero dynamic code execution (eval, new Function)"
  - "Single-purpose narrative locked in PURPOSE.md: 'Better Twitter is a personalization layer giving a user control over how their own X/Twitter timeline looks and behaves in their own browser.'"

patterns-established:
  - "All future injected UI (Phase 4 bookmark manager, Phase 5 reactions) MUST consume floating UI exclusively via components/shadow-ui/"
  - "All manifest modifications must update PURPOSE.md permission ledger in the same commit"
  - "Build gate runs automatically during build and blocks package bundling if invariants are violated"

requirements-completed: [FOUND-06]
---

# Plan 01-05: Shadow-Root Portal Provider, Dev Probe, Build Gate & Single-Purpose Ledger Summary

## 1. Accomplishments

### Task 1: Shadow-Root Portal Provider and Safe Wrappers
- Implemented `components/shadow-portal.tsx` providing `ShadowRootProvider` and `usePortalContainer`.
- Coerces `ShadowRoot` to `HTMLElement` for Radix `container` prop compatibility, returning `undefined` when outside a provider (allowing native default fallback without throwing).
- Generated standard UI primitives `components/ui/popover.tsx` and `components/ui/dropdown-menu.tsx` via shadcn; intentionally avoided `dialog` and `sheet` to protect against open upstream focus-trap and scroll-lock bugs.
- Built three shadow-safe wrappers under `components/shadow-ui/`: `BtPopover`, `BtDropdownMenu`, and `BtTooltip`. Each binds `container={container}` on their respective portals and overrides `onPointerDownOutside` using native `composedPath()` inspection to prevent premature dismissals caused by Shadow DOM event retargeting.
- Created unit test suite `tests/unit/shadow-portal.test.tsx` validating container resolution, `undefined` fallback, portal mounting within shadow roots, simultaneous overlay stacking, and composed-path inside/outside discrimination.

### Task 2: Dev-Only Probe and Spike S3 Investigation
- Created `entrypoints/probe.content/` with `ProbePanel.tsx`, `probe.css`, and `index.tsx`.
- Declared entrypoint-level exclusion (`exclude: import.meta.env.PROD ? ['chrome', 'firefox', 'safari', 'edge'] : undefined`).
- Verified mechanically that `wxt build --mode development` produces 2 content scripts (`x.js` and `probe.js`), while production `wxt build` skips `probe` entirely and generates exactly 1 content script (`x.js`).
- Re-checked the 3 upstream issues referenced in research as of 2026-09-13:
  - `radix-ui/primitives#3353`: OPEN (focus trap and scroll lock in Shadow DOM)
  - `radix-ui/primitives#3483`: OPEN (scroll disable in Shadow DOM)
  - `radix-ui/primitives#2055`: CLOSED as completed on 2026-06-08 (outside-click retargeting across shadow boundaries)
- Documented test matrix and inherited architectural patterns in `.planning/phases/01-foundation-settings-popup/spikes/S3-radix-shadow-root.md`.

### Task 3: Build Audit Gate & Single-Purpose Ledger
- Authored `.planning/phases/01-foundation-settings-popup/PURPOSE.md` declaring the locked one-sentence purpose narrative and the permission ledger with one-clause justifications for `storage` and `bridge.js`. Established the standing rule requiring all future phases to maintain this ledger.
- Created `scripts/audit-build.mjs` verifying five standing security invariants:
  1. Manifest permissions strictly equal `['storage']`; zero `host_permissions`.
  2. Web accessible resources scoped strictly to `*://x.com/*` and `*://twitter.com/*`; zero wildcard origins (`<all_urls>`, `*://*/*`).
  3. Exactly one content script in production.
  4. Zero Content Security Policy overrides.
  5. Zero dynamic code execution (`eval`, `new Function`) across all bundled JavaScript chunks.
- Chained `audit-build` into `package.json` under `"build"` and `"verify"`.
- Documented full capability subtraction ledger in `.planning/phases/01-foundation-settings-popup/COVERAGE.md`, justifying all opted-out transport and extension APIs.

---

## 2. Verification Results

- `bun run compile` (`tsc --noEmit`): PASSED (0 errors).
- `bun run build`: PASSED, WXT build completed in ~900ms and triggered `audit-build`.
- `node scripts/audit-build.mjs`: PASSED (all 5 assertions passed on `.output/chrome-mv3`, 4 scripts clean, 0 dynamic execution constructs found).
- `bun x vitest run`: PASSED (44/44 tests passed across 8 unit test suites).
- `bun x playwright test`: PASSED (11/11 tests passed across 5 E2E test suites).
- `COVERAGE.md` automated check: PASSED (`coverage matrix ok`).
- `PURPOSE.md` automated check: PASSED (`single purpose` statement verified).

---

## 3. Spike S3 Inherited Pattern & Matrix

The 12-row test matrix for Radix in ShadowRoot is documented in `spikes/S3-radix-shadow-root.md`.
**Inherited Pattern for Phase 4 (Bookmark Manager) & Phase 5 (Reaction Palette):**
1. Never import directly from `radix-ui` in injected UI; consume `components/shadow-ui/` exclusively.
2. Root content script UI must wrap components in `<ShadowRootProvider value={ui.shadow}>`.
3. Overlays inherit composed-path outside-click discrimination automatically.
4. Favor anchored non-modal primitives (`BtPopover`, `BtDropdownMenu`) over modal traps (`Dialog`).
