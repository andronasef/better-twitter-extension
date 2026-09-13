---
phase: "2"
slug: "clean-timeline-themes"
status: approved
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-13"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + playwright 1.x |
| **Config file** | `vitest.config.ts` & `playwright.config.ts` |
| **Quick run command** | `bun run test` |
| **Full suite command** | `bun run test && bun x tsc --noEmit && bun run build && node scripts/audit-build.mjs && bun run test:e2e` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test`
- **After every plan wave:** Run `bun run test && bun x tsc --noEmit && bun run build && node scripts/audit-build.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CLEAN-05 | — | Action counts stripped, analytics hidden, detail stats removed, profile count toggle | unit | `bun exec vitest run tests/unit/metrics.test.ts tests/unit/settings-migration.test.ts` | ❌ W0 | ⏳ pending |
| 02-01-02 | 01 | 1 | CLEAN-02, CLEAN-03 | — | Sidebar clutter (trends, who-to-follow, upsell) cleanly hidden | unit | `bun exec vitest run tests/unit/clutter.test.ts` | ❌ W0 | ⏳ pending |
| 02-01-03 | 01 | 1 | CLEAN-02, CLEAN-05 | — | Popup settings panel & sub-toggle hierarchy | typecheck | `bun x tsc --noEmit && bun run test` | ✅ | ⏳ pending |
| 02-02-01 | 02 | 2 | CLEAN-04 | — | Tabs swapped via flex order, For You hidden via sub-toggle | unit | `bun exec vitest run tests/unit/tabs.test.ts` | ❌ W0 | ⏳ pending |
| 02-02-02 | 02 | 2 | CLEAN-04 | — | Single-activation Following auto-click on /home entry | unit | `bun exec vitest run tests/unit/tabs.test.ts` | ❌ W0 | ⏳ pending |
| 02-02-03 | 02 | 2 | CLEAN-04 | — | Popup tab reorder settings & sub-toggle | typecheck | `bun x tsc --noEmit && bun run test` | ✅ | ⏳ pending |
| 02-03-01 | 03 | 3 | THEME-01..04 | — | Dracula, Nord, Matrix tokens and custom accent overrides | unit | `bun exec vitest run tests/unit/theme-engine.test.ts` | ❌ W0 | ⏳ pending |
| 02-03-02 | 03 | 3 | THEME-07 | — | Zero-FOUC early stylesheet injection at document_start | typecheck | `bun x tsc --noEmit` | ✅ | ⏳ pending |
| 02-03-03 | 03 | 3 | THEME-01..04, D-12 | — | Popup Theme panel, thumbnail cards, and accent hex picker | typecheck | `bun x tsc --noEmit && bun run test` | ✅ | ⏳ pending |
| 02-04-01 | 04 | 4 | THEME-05 | — | Minimal theme centered feed, 68px rail, hidden sidebar | unit | `bun exec vitest run tests/unit/layout.test.ts` | ❌ W0 | ⏳ pending |
| 02-04-02 | 04 | 4 | THEME-06 | — | Old Twitter 2015 3-column, top bar, 4px avatars, mini profile card | unit | `bun exec vitest run tests/unit/layout.test.ts` | ❌ W0 | ⏳ pending |
| 02-04-03 | 04 | 4 | THEME-05..07 | — | Live layout switching integration in unified theme selector | typecheck | `bun x tsc --noEmit && bun run test` | ✅ | ⏳ pending |
| 02-05-01 | 05 | 5 | ALL | — | Full E2E Playwright verification of declutter, themes & layouts | e2e | `bun run test:e2e` | ❌ W0 | ⏳ pending |
| 02-05-02 | 05 | 5 | ALL | — | Full unit test suite + production build security audit | build | `bun run test && bun x tsc --noEmit && bun run build && node scripts/audit-build.mjs` | ✅ | ⏳ pending |

*Status: ⏳ pending · 🟢 green · 🔴 red · 🟡 flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/metrics.test.ts` — test stubs for vanity metrics stripping and tooltip sanitization
- [ ] `tests/unit/settings-migration.test.ts` — test stubs for settings v1 to v2 migration
- [ ] `tests/unit/clutter.test.ts` — test stubs for sidebar trends and who-to-follow module hiding
- [ ] `tests/unit/tabs.test.ts` — test stubs for Following / For You tab reordering and auto-select
- [ ] `tests/unit/theme-engine.test.ts` — test stubs for CSS custom properties, preset tokens, and custom accent hex
- [ ] `tests/unit/layout.test.ts` — test stubs for Minimal theme and Old Twitter 3-column layout classes
- [ ] `e2e/clean-timeline.spec.ts`, `e2e/tabs.spec.ts`, `e2e/theme-switch.spec.ts` — E2E test specs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual aesthetic of Dracula, Nord, Matrix | THEME-01, 02, 03 | Color palette visual harmony on live x.com | Open live x.com with extension loaded, toggle each theme, confirm whole UI recolors |
| Old Twitter 2015 layout feel | THEME-06 | Nostalgic visual layout inspection | Inspect 3-column layout, profile card, rounded avatars on live feed |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (gsd-planner, 2026-09-13)
