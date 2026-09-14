# Roadmap: Better Twitter!

## Overview

Better Twitter is a Chrome MV3 extension that layers toggles onto a hostile, virtualized, client-routed React SPA. The whole project rests on one piece of shared plumbing — a single tweet observation pipeline, a route watcher, a selector-resolution layer, a MAIN-world fetch bridge, a Radix-in-shadow-root portal provider, and a live settings broadcast — so that phase comes first and proves itself by making promoted tweets disappear the instant a toggle flips. From there the work climbs the risk curve exactly the way all four research passes independently ordered it: pure DOM/CSS features that only read the page (clutter hiding, themes), then bookmarks (capturing via undocumented GraphQL, local management/search, and timeline resurfacing), then the reaction palette that has to hand the user a prefilled composer without ever posting for them, and finally the Chrome Web Store package whose single-purpose narrative was locked in on day one.

Every phase is a vertical slice: at the end of each one the extension is installable and the user has something new they can actually use, not a layer they have to wait on.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Settings Popup** - Shared plumbing plus a working popup, proven end-to-end by a live ad-stripping toggle
- [x] **Phase 2: Clean Timeline & Themes** - Clutter toggles and the full theme engine — read-only DOM/CSS features on top of the pipeline
- [x] **Phase 3: Bookmarks (Capture, Management & Resurfacing)** - Multi-strategy capture, local storage/quota management, folder/tag organization, in-page search, and feed resurfacing
- [ ] **Phase 4: Twemoji Reactions** - Hover/long-press palette that prefills X's native reply composer for the user to send
- [ ] **Phase 5: Chrome Web Store Packaging** - Permission audit, privacy policy, single-purpose listing, and a submittable package

## Phase Details

### Phase 1: Foundation & Settings Popup

**Goal**: The extension installs on x.com, presents a working icon-grid settings popup, and promoted tweets disappear the instant the user flips a toggle — proving the whole settings → pipeline → DOM → live-toggle chain on the lowest-risk feature.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, UI-01, UI-02, UI-03, UI-04, UI-05, CLEAN-01
**Success Criteria** (what must be TRUE):

  1. User can load the extension, open the popup on x.com, and see a grid of category tiles that open into per-category panels, rendered in native-feel substitute font (BTPopupSans/Inter, zero network requests, D-15), matching their active X theme (Light / Lights Out), with a tooltip explaining every toggle.
  2. User can flip "Hide promoted tweets" and watch ads vanish from the feed immediately — no page reload — and reappear when they flip it back, including on tweets that load after the toggle.
  3. User can navigate x.com client-side (Home → Profile → Bookmarks → tweet detail → Back) and the extension keeps working on every view, with no need to refresh.
  4. User can scroll the timeline for several minutes with the extension on and see no stutter and no memory growth attributable to it, even as X recycles feed nodes.
  5. When X changes its markup, the user gets a reported selector miss for the one affected feature instead of a feature that silently stops working.

**Spikes** (empirical, must be answered against live x.com — not assumed from research):

  - Does x.com's client-side routing fire the Navigation API `navigate` event, or must `history.pushState`/`replaceState` be patched? Research proposes Navigation API primary with a history patch fallback; neither path was verified against the live site. Settles the route watcher's design (FOUND-03).
  - What do X's live GraphQL operations actually look like on the wire — operation names, URL shape, response envelope? The MAIN-world bridge proves itself here by capturing and reporting them; the captured shapes are the input Phase 3 and Phase 4 build against, so running this now rather than later de-risks both (FOUND-05).
  - Do Radix portals, focus trap, and scroll lock behave inside the shadow root against real X overlay states? First Radix-in-shadow-root usage — the pattern set here is inherited by the reaction palette and resurfaced card, so it must be right once (FOUND-06).

**Plans**: 5 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: scaffold the WXT/React/Tailwind/Radix project and prove the popup → storage → pipeline → DOM → live-toggle chain end to end on promoted-tweet hiding

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — MAIN-world bridge (fetch + XHR + history), layered route watcher, named observer registry with page-scoped teardown, and spikes S1 + S2

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Selector-resolution layer with per-feature miss reporting to the action badge, pipeline hardening for 60fps scroll, and spike S4

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — X theme probe and cached theme, bundled popup typeface, and the full UI-SPEC popup shell with tooltips and every declared state

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-05-PLAN.md — Radix shadow-root portal provider, dev-only probe with spike S3, and the standing build/permission audit plus the locked single-purpose narrative

**UI hint**: yes

### Phase 2: Clean Timeline & Themes

**Goal**: X looks the way the user wants it — algorithmic clutter gone, a community theme applied, timeline centered or laid out like old Twitter — with every piece its own independent live toggle.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07
**Success Criteria** (what must be TRUE):

  1. User can independently hide "What's Happening", "Who to Follow", the "For You" tab, and vanity metrics (like / reply / repost counts), each from its own toggle, each applying live.
  2. User can pick Dracula, Nord, or Hacker/Matrix and see X recolored end to end — timeline, sidebars, composer, modals — with no leftover default-blue surfaces.
  3. User can enter a custom accent hex and see it replace X's blue everywhere the accent is used.
  4. User can switch on the Minimal theme (centered timeline, surrounding chrome stripped) or the Old Twitter layout and read their whole feed in it.
  5. User can navigate between pages and scroll a long feed without a flash of unthemed content and without any section reverting to X's default styling.

**Spikes** (empirical, must be answered against live x.com):

  - Do the `data-testid` fallback chains hold across X's A/B variant cohorts? Research is explicit that a selector can be correct in one account and broken in a beta bucket simultaneously — test against 2+ real accounts, not just the developer's own session.

**Plans**: 5 plans

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Timeline & Sidebar Declutter Engine: vanity metrics stripper, right sidebar clutter stripper, popup integration for Clean Timeline controls

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — Tab Reordering & Auto-Selection Engine: CSS flex order tab swap, Following auto-activation on /home, popup controls

**Wave 3** *(blocked on Wave 1 completion)*
- [x] 02-03-PLAN.md — Theme Engine Core & Zero-FOUC Injection: Dracula, Nord, Matrix, custom accent picker, synchronous document_start stylesheet injection, popup thumbnail cards

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 02-04-PLAN.md — Layout Engines: Minimal centered layout, Old Twitter 2015 3-column layout, horizontal top navbar, left mini profile card

**Wave 5** *(blocked on Wave 2, Wave 4 completion)*
- [x] 02-05-PLAN.md — Full Phase Integration: Playwright E2E verification, full unit test suite, and standing build/permission audit

**UI hint**: yes

### Phase 3: Bookmarks (Capture, Management & Resurfacing)

**Goal**: The user's X bookmarks land in local storage reliably via layered strategies, are organized and searchable inside x.com/bookmarks, and resurfaced back into the timeline so saved tweets don't rot.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09, BOOK-10
**Success Criteria** (what must be TRUE):

  1. User can run a capture and watch their bookmark count climb in the popup, with the extension silently picking whichever strategy works (API interception, background-tab scrape, or the extension's own save button) rather than asking the user to choose.
  2. User can click an extension-added save button on any tweet and see that tweet in their local bookmark store immediately.
  3. User can close the laptop or lose the tab mid-capture, come back, and have capture resume from where it stopped rather than restarting from zero or reporting a false "done".
  4. User is told in plain language when capture cannot proceed — not logged in, X's endpoint changed, rate limited — instead of being shown an empty or stale list.
  5. User with a very large bookmark collection stays inside the local storage budget and is told what was pruned, rather than hitting an opaque storage error.
  6. User can open x.com/bookmarks and find folder, tag, and search controls living in the native page itself, not in a separate window or popup.
  7. User can create folders and tags and file saved tweets into them.
  8. User can type a word from a tweet's text or an author's name and get the matching bookmarks back.
  9. User can turn on resurfacing, set the interval N, and see a "📌 Resurfaced from your Bookmarks" card appear every N tweets in their feed.
  10. User can scroll past a resurfaced card without the page jumping, and the card stays where it belongs as the feed virtualizes around it.

**Spikes** (empirical, must be answered against live x.com):

  - The live bookmark GraphQL operation's request and response shape, and its `doc_id`/query-id churn. Query IDs must be extracted from X's own live traffic at runtime and never hardcoded; the interception layer needs schema-mismatch detection that fails over to the next capture strategy from day one, since a stale ID returns an empty result rather than an error.
  - Does React tolerate a trailing sibling appended to the action row (`role="group"`)? This is the first action-row injection in the project — the save button — and the answer also governs the reaction trigger in Phase 4. Research flags that flex-wrap / `justify-content: space-between` layout can shift on child-count change, so this needs a visual check, not just a "the node survived" check.
  - Does a backgrounded scrape tab actually keep running under Chrome's throttling, and does the service worker survive a full capture run? Verify by manually terminating the worker mid-scrape via DevTools and by running a scrape backgrounded 10+ minutes while logged out.
  - How does storage behave at 1000+ bookmarks — what is the real per-bookmark footprint against the `chrome.storage.local` quota?
  - The live timeline GraphQL `instructions`/`entries` shape, so a synthetic resurfaced entry can be spliced into the response before X renders it. Research strongly prefers response-splice over DOM insertion precisely to avoid the scroll-jump and virtualizer-wipe class of bugs; DOM sibling insertion is a documented-fragile fallback only.
  - Resurfacing cadence: what value of N and what selection behavior actually feels good rather than nagging.
  - Re-verification, not new work: 60fps scroll (FOUND-08) and storage headroom (BOOK-10) under resurfacing load — this phase adds the most write-heavy DOM mutation in the project and repeatedly reads the largest dataset, so both are the most likely to regress here.

**Plans**: 5 plans

Plans:
**Wave 1**
- [x] 03-01-PLAN.md — Core Storage, Schema & Extraction Engine (BOOK-01, BOOK-02, BOOK-10, D-01..18)

**Wave 2**
- [x] 03-02-PLAN.md — MAIN Bridge, Background Sync, Action Row Dual-Save & Popover (BOOK-01, BOOK-03, D-05..10)
- [x] 03-03-PLAN.md — In-Page Bookmarks Hub UI & Feed Filtering (BOOK-04, BOOK-05, BOOK-06, D-01..04)

**Wave 3**
- [x] 03-04-PLAN.md — Timeline Resurfacing Engine & Popup BookmarksPanel (BOOK-07, BOOK-08, BOOK-09, D-11..17)

**Wave 4**
- [x] 03-05-PLAN.md — Full Integration, E2E Playwright Verification, Build Security Audit (BOOK-01..10)

**UI hint**: yes

### Phase 4: Twemoji Reactions

**Goal**: A Facebook-style Twemoji palette on the Like button that hands the user X's own reply composer prefilled with their chosen emoji — and never sends anything itself.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: REACT-01, REACT-02, REACT-03, REACT-04, REACT-05, REACT-06
**Success Criteria** (what must be TRUE):

  1. User can hover the Like button on any tweet and get a Twemoji reaction palette, and can get the same palette by long-pressing instead.
  2. User can pick an emoji and land in X's native reply composer with that emoji already entered, with pressing Reply still entirely their own action.
  3. User can choose which emoji appear in their palette instead of living with a fixed set.
  4. User can confirm the extension never posts, likes, or replies on their behalf — every send is their own click.
  5. User sees reaction glyphs that match X's own emoji rendering, served from the bundled package with no network request to a CDN.

**Spikes** (empirical, must be answered against live x.com):

  - How to reliably open and prefill X's reply composer. X's composer is a rich-text editor (DraftJS/contenteditable lineage), so setting `.value` will not work — this needs the right sequence of focus and input events for the text to register in X's own state. Research flags this as unresolved and it is the load-bearing unknown for the entire phase.
  - Does the palette survive the virtualized feed recycling nodes underneath it — i.e. does an open palette anchored to a tweet that scrolls out of range detach cleanly rather than reattaching to a different tweet?

**Plans**: 5 plans

Plans:
**Wave 1**
- [ ] 04-01-PLAN.md — Asset Pipeline, Storage Definitions & Types (REACT-06, D-09, D-11, D-13, D-14)

**Wave 2**
- [ ] 04-02-PLAN.md — Reply Composer Prefiller & Fallback Mechanism (REACT-03, REACT-04, D-05, D-06, D-07, D-08)

**Wave 3**
- [ ] 04-03-PLAN.md — Floating Reaction Palette & Interaction Engine (REACT-01, REACT-02, D-01..04, D-15..18)
- [ ] 04-04-PLAN.md — Popup Reactions Panel & Hybrid Catalog Caching (REACT-05, D-10, D-12..14)

**Wave 4**
- [ ] 04-05-PLAN.md — Playwright E2E Suite & Full Standing Verification Gate (REACT-01..06, D-01..18)
**UI hint**: yes

### Phase 5: Chrome Web Store Packaging

**Goal**: The extension is a submittable, policy-clean package that a stranger can install, with a listing that reads as one coherent purpose rather than five bundled features.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05
**Success Criteria** (what must be TRUE):

  1. A stranger can install the packaged extension from the built zip and have every feature work exactly as it did unpacked.
  2. The install prompt asks only for `*://x.com/*` and `*://twitter.com/*` host access plus the minimum API permissions — no `<all_urls>`, no permission the user cannot account for.
  3. A reader of the store listing can state what the extension does in one sentence, and the published privacy policy tells them truthfully that nothing leaves their browser.
  4. The production build contains no remote code and no eval-like execution path.

**Spikes**: None. This phase audits decisions rather than discovering them — the single-purpose narrative and the no-remote-code rule are both locked in Phase 1 and enforced from there onward, so that later feature phases cannot each add permissions ad hoc. What is verified here is that they held.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Settings Popup | 5/5 | Completed | 2026-09-13 |
| 2. Clean Timeline & Themes | 5/5 | Completed | 2026-09-13 |
| 3. Bookmarks (Capture, Management & Resurfacing) | 0/TBD | Not started | - |
| 4. Twemoji Reactions | 0/TBD | Not started | - |
| 5. Chrome Web Store Packaging | 0/TBD | Not started | - |

## Coverage

All 47 v1 requirements map to exactly one phase. No orphans, no duplicates.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1 | FOUND-01…09, UI-01…05, CLEAN-01 | 15 |
| 2 | CLEAN-02…05, THEME-01…07 | 11 |
| 3 | BOOK-01…10 | 10 |
| 4 | REACT-01…06 | 6 |
| 5 | STORE-01…05 | 5 |
| **Total** | | **47** |

## Scope Notes

Two features were cut after research and appear in no phase:

- **Media downloader** — removed from the project entirely. A near-identical X media downloader was already pulled from the Chrome Web Store. No `chrome.downloads`, no action-row download button. Sections of `research/ARCHITECTURE.md` and `research/PITFALLS.md` still discuss it; those are stale.
- **Reactions that post** — reactions prefill X's native reply composer and the user sends. There is no programmatic reply, no undo toast, and no delete verification. Research sections covering undo semantics and reply-posting automation risk are stale.

---
*Roadmap created: 2026-09-13*
