# Research Synthesis: Better Twitter Extension

**Synthesized:** 2026-09-13
**Research basis:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, PROJECT.md

---

## Executive Summary

Better Twitter is a Chrome MV3 content-script extension that personalizes X/Twitter through five integrated feature areas: ad/clutter stripping, media downloader, local bookmarks with timeline resurfacing, community themes, and emoji-reply reactions.

**Recommended stack:** WXT framework, React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix), chrome.storage.local (no backend).

**Central tension:** Five feature areas with different risk profiles bundled into one Chrome Web Store listing. Must frame all five as one "personalization control panel" narrative to survive single-purpose policy review.

**Critical policy tensions:**
1. CWS forbids sending messages without user confirmation — tensions with fire-immediately emoji reactions
2. CWS single-purpose policy tensions with five-feature-area bundle
3. Similar X media downloader was already removed from CWS — expect scrutiny
4. Radix portals escape shadow root by default (open upstream issues) — needs early portal-provider utility
5. Feed injection should splice into GraphQL responses, not manipulate virtualized DOM

**Key convergence:** All four researchers independently converged on the same build order. This is a strong signal the phase structure is load-bearing.

---

## Key Findings

### From STACK.md

**Core tech stack:**
- WXT 0.21.4 — MV3 framework
- React 19.x — Required by shadcn/ui and Radix
- TypeScript 5.7.x — Do NOT adopt TS 7.0 yet
- Tailwind v4 — CSS-first config
- Radix UI unified package (1.6)
- shadcn/ui CLI v4 — init with --base radix
- @twemoji/parser v17.0 — bundle glyphs locally

**Critical integration risks:**
1. Radix Portals default to document.body — Fix: ShadowRootProvider context with container={shadowRoot}
2. rem units silently rescale — Fix: postcss-rem-to-responsive-pixel conversion
3. Radix focus-trap and outside-click break in Shadow DOM — Mitigate: use lower-level primitives, manual testing
4. CSS injection requires cssInjectionMode: ui — WXT handles natively

---

### From FEATURES.md

**Feature scope (all five in v1):**
- Table stakes: Ad/promoted hiding, media download, clutter hiding
- Differentiators: Bookmark capture with folders/tags/search, timeline resurfacing, theme engine
- Highest-risk: Emoji reactions with 5s undo (ship last)

**Anti-features to exclude:**
- No bulk/automated actions beyond single emoji reactions
- No cloud sync — contradicts no-backend
- No AI auto-tagging — requires hosted LLM
- No alternative-client rewrite — too fragile

---

### From ARCHITECTURE.md

**System components (all required before any feature):**
1. Storage layer — WXT storage.defineItem
2. Route watcher — Navigation API + history.pushState patch
3. Tweet observation pipeline — MutationObserver + IntersectionObserver + WeakSet
4. MAIN-world bridge — fetch/XHR patch, CustomEvent dispatch
5. Selector resolution layer — Centralized data-testid with fallback chains
6. Radix-in-shadow-root portal provider — ShadowRootProvider context

**Architectural patterns:**
- Response-splice feed injection (splice into GraphQL, not DOM)
- Sibling-portal decoration (trailing siblings)
- Shared observation pipeline (one MutationObserver)
- MAIN-world bridge via injectScript()
- Settings broadcast via storage.onChanged

---

### From PITFALLS.md

**12 critical pitfalls:**

1. Selector staleness — Centralize in lib/selectors.ts; fallback chains
2. MutationObserver scroll jank — Scope to timeline; process only addedNodes
3. Automated-interaction risk — 1:1 click to request; no async gap
4. Undo toast dishonesty — Wait for server ID; verify delete
5. CWS single-purpose policy — Lock in coherent narrative early
6. Remote code / eval — Audit production build
7. Media downloader CWS precedent — Frame narrowly; scope to view-visible
8. MV3 service worker dies mid-scrape — Persist progress; use chrome.alarms
9. GraphQL query-id churn — Extract from live traffic; auto-fallback
10. Background-tab throttling — Use chrome.alarms; check auth state
11. Storage quota exhaustion — Request unlimitedStorage; shard keys
12. Shadow DOM + Radix portal breakage — Redirect portals; test focus/scroll

---

## Roadmap Implications

### Recommended Phase Structure

**All four researchers independently converged on this order.**

**Phase 0: Foundation (2-3 weeks)**
- Storage, settings broadcast, route watcher, observation pipeline
- MAIN-world bridge, selector resolution, portal provider
- Requirements: 60fps scroll, no Long Tasks, correct Radix rendering

**Phase 1: Low-Risk DOM/CSS (2-3 weeks)**
- Ad/promoted hiding, clutter hiding, vanity metrics
- Theme engine, presets, minimal theme, Old Twitter layout
- Requirements: Independent toggles, 60fps, no selector misses on A/B variants
- Research flag: Test fallback selectors against 2+ real accounts

**Phase 2: Action-Row Injection (1-2 weeks)**
- Media downloader button, format picker, chrome.downloads integration
- Requirements: Works on all images/videos, readable filenames
- Research flag: Verify X video_info.variants response shape

**Phase 3: Bookmark Capture (3-4 weeks, highest complexity)**
- Three-layer fallback: GraphQL intercept, DOM scrape, save button
- Requirements: Captures correctly, survives worker termination, explicit auth detection
- Research flags: GraphQL shapes, background-tab reliability, storage growth

**Phase 4: Bookmark Management UI (1-2 weeks)**
- Folders, tags, full-text search, deletion

**Phase 5: Timeline Resurfacing (2-3 weeks)**
- Stochastic re-injection with priority and decay
- Research flag: Cadence tuning

**Phase 6: Emoji Reactions (2-3 weeks, highest-risk, isolated)**
- Fixed palette, one-click reply, 5s undo with delete verification
- Requirements: 1:1 click to request, explicit delete failure handling
- Research flag: X reply endpoint contract

**Phase 7: Store Packaging (1-2 weeks)**
- Privacy policy, listing copy, icons, manifest audit

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs verified |
| Features | MEDIUM-HIGH | Competitors analyzed |
| Architecture | MEDIUM-HIGH | Chrome MV3 verified; X.com needs empirical validation |
| Pitfalls | MEDIUM-HIGH | CWS/MV3 verified; X automation from secondary sources |
| Phase structure | MEDIUM-HIGH | Convergence across four researchers |

---

## Key Gaps

- Selector effectiveness vs. real A/B variants — test Phase 1
- GraphQL response shapes and query IDs — Phase 3 spike
- X media URL patterns — Phase 2
- Storage growth under 1000+ bookmarks — Phase 3
- Radix edge cases with real overlays — late Phase 0/early Phase 1
- Resurfacing cadence tuning — Phase 5 alpha
- Competitor emoji-reaction UX — Phase 6 spike

---

*Synthesized: 2026-09-13 | Confidence: MEDIUM-HIGH*
