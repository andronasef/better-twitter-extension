---
id: 260915-rsd
slug: rate-share-and-dev-tools
date: 2026-09-15
status: complete
---

# Quick Task Summary: Rate in Store & Share Extension Prompt + Popup Dev Tools

## What was built

1. **In-Page Rate in Store & Share Prompt (`features/engagement/`)**:
   - **Browser Detection (`browser-detect.ts`)**: Accurately recognizes Chrome, Firefox, Edge, Opera, and Brave. Generates respective store review URLs (Chrome Web Store reviews tab, Firefox AMO reviews, etc.) and pre-composed X/Twitter share intent URLs.
   - **Smart Eligibility Logic (`index.ts`)**: Ensures prompt is only displayed after **7 days** since installation (`Date.now() - installedAt >= 7 days`). Uses randomized session delays (45–120s) and randomized session probabilities so it appears naturally rather than nagging on every page load.
   - **Snooze & Dismissal Invariants**: Dismissing ("Maybe later") snoozes for 3–6 days (randomized) and permanently caps at 3 dismissals. Permanently hides once rated or shared.
   - **Friendly UI Card (`RateShareCard.tsx`)**: Mounted inside isolated Shadow DOM at `bottom: 24px; right: 24px` on Twitter/X with light/dark adaptive theme tokens, star rating CTA, share CTA, copy-link with feedback, and snooze action.

2. **Popup Developer Tools (`entrypoints/popup/DevToolsPanel.tsx`)**:
   - **Dev Mode Exclusivity**: Guarded by `import.meta.env.DEV` across registry, popup router, and tile grid. Completely stripped from production builds.
   - **Prompt Testing**: One-click "⚡ Force Show Prompt on Active Tab" (reactively triggers content script prompt via storage watcher), "Set 8 Days Old", "Set 0 Days Old", and "Reset Engagement State".
   - **Internals Testing**: Simulate broken selector diagnostics alert (tests orange `•` icon badge and popup warning), seed 3 sample bookmarks, clear bookmarks, view storage usage, and reset settings.

3. **Storage & Background Tracking (`lib/storage.ts`, `entrypoints/background.ts`)**:
   - Added `engagementItem` storage schema tracking `installedAt`, `lastShownAt`, `actionTaken`, `dismissCount`, `snoozedUntil`, and `devForceTrigger`.
   - Initialized `installedAt` on extension install in `background.ts`.

4. **Testing & Quality Gates**:
   - 19 new tests added across 3 new test suites (`engagement-browser-detect.test.ts`, `engagement-logic.test.tsx`, `devtools-panel.test.tsx`).
   - All 34 test files (294 unit tests) passed.
   - Production build audit passed (5/5 invariants clean).
