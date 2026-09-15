---
id: 260915-rsd
slug: rate-share-and-dev-tools
date: 2026-09-15
workflow: quick
---

# Rate in Store & Share Extension Prompt + Popup Dev Tools

## Requirements
1. Rate in Store based on browser + Share with friends request:
   - Appear in bottom right of Twitter/X.
   - Small, friendly, non-intrusive card.
   - Only after 7 days of installing/using the extension.
   - Triggers at random times/intervals after 7 days.
   - Detects current browser (Chrome, Firefox, Edge, etc.) and routes to appropriate store review URL.
   - Provides native X share intent + copy share link.
   - Snoozes on dismiss and respects completed action (rate / share).
2. Development tools in Popup (DEV version only):
   - Available only in dev builds (`import.meta.env.DEV`).
   - Force trigger / test the prompt on active tab.
   - Simulate 7+ days installation date.
   - Reset engagement state.
   - Test other features: simulate broken selector diagnostics alert, seed/clear sample bookmarks, view storage usage.

## Tasks
1. Storage schema (`lib/storage.ts`): Add `engagementItem` for install date, last shown, action taken, dismiss count, snooze, dev trigger.
2. Background tracking (`entrypoints/background.ts`): Initialize `installedAt` on install.
3. Browser detection & URLs (`features/engagement/browser-detect.ts`): Multi-browser detection and store review URLs.
4. Rate & Share UI card (`features/engagement/RateShareCard.tsx`): Small friendly UI with Shadow DOM isolation.
5. In-page controller (`features/engagement/index.ts`): 7-day threshold logic, random timing, storage watch for dev triggers.
6. Dev Tools panel (`entrypoints/popup/DevToolsPanel.tsx`): Interactive testing panel for engagement and extension features.
7. Registry & Popup integration (`lib/registry.ts`, `entrypoints/popup/App.tsx`): Register Dev Tools tile and render panel strictly in DEV mode.
8. Tests (`tests/unit/engagement-*.test.ts`, `tests/unit/devtools-*.test.ts`): Full unit test coverage.
9. Verification: Run `bun run verify` to test build, audit, and tests.
