---
phase: "2"
slug: "clean-timeline-themes"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-13"
---

# Phase 2 ? Validation Strategy

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
| 02-01-01 | 01 | 1 | CLEAN-05 | ? | Action counts stripped, analytics hidden | unit | `bun exec vitest run tests/unit/metrics.test.ts` | ? W0 | ? pending |
| 02-01-02 | 01 | 1 | CLEAN-02, CLEAN-03 | ? | Sidebar clutter cleanly hidden | unit | `bun exec vitest run tests/unit/clutter.test.ts` | ? W0 | ? pending |
| 02-02-01 | 02 | 2 | CLEAN-04 | ? | Tabs swapped, Following auto-selected | unit | `bun exec vitest run tests/unit/tabs.test.ts` | ? W0 | ? pending |
| 02-03-01 | 03 | 3 | THEME-01..04, 07 | ? | Theme tokens injected without FOUC | unit | `bun exec vitest run tests/unit/theme-engine.test.ts` | ? W0 | ? pending |
| 02-04-01 | 04 | 4 | THEME-05, THEME-06 | ? | Minimal & Old Twitter layout CSS applied | unit | `bun exec vitest run tests/unit/layout.test.ts` | ? W0 | ? pending |
| 02-05-01 | 05 | 5 | ALL | ? | Full E2E & build validation | e2e | `bun run test:e2e` | ? W0 | ? pending |

*Status: ? pending ? ? green ? ? red ? ?? flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/metrics.test.ts` ? test stubs for vanity metrics stripping and tooltip sanitization
- [ ] `tests/unit/clutter.test.ts` ? test stubs for sidebar trends and who-to-follow module hiding
- [ ] `tests/unit/tabs.test.ts` ? test stubs for Following / For You tab reordering and auto-select
- [ ] `tests/unit/theme-engine.test.ts` ? test stubs for CSS custom properties, preset tokens, and custom accent hex
- [ ] `tests/unit/layout.test.ts` ? test stubs for Minimal theme and Old Twitter 3-column layout classes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual aesthetic of Dracula, Nord, Matrix | THEME-01, 02, 03 | Color palette visual harmony on live x.com | Open live x.com with extension loaded, toggle each theme, confirm whole UI recolors |
| Old Twitter 2015 layout feel | THEME-06 | Nostalgic visual layout inspection | Inspect 3-column layout, profile card, rounded avatars on live feed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
