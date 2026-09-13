# Phase 1: Foundation & Settings Popup - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ships the shared plumbing every later feature subscribes to — one tweet observation pipeline, a route watcher, a `data-testid` selector-resolution layer with miss reporting, a passive MAIN-world fetch/XHR bridge, a Radix-in-shadow-root portal provider, and a live `storage.onChanged` settings broadcast — plus the settings popup shell, proven end-to-end by exactly one working feature: hide promoted tweets (CLEAN-01).

In scope: FOUND-01…09, UI-01…05, CLEAN-01.
Not in scope: clutter toggles beyond promoted tweets, themes (Phase 2), bookmarks (Phases 3-4), reactions (Phase 5), store packaging (Phase 6).

</domain>

<decisions>
## Implementation Decisions

The user declined the interactive discussion and delegated the choices ("think of what best UX and do it"). Every decision below is Claude's call on best UX, made within the phase boundary. All are open to override during planning or review.

### Popup category map (UI-01, UI-02)
- **D-01:** The tile grid is generated from a feature registry, not hardcoded. A category tile renders only when at least one toggle is registered under it. Phase 1 registers one category ("Timeline", holding "Hide promoted tweets"); Phases 2-5 add their own registrations and their tiles appear automatically with no popup rewrite. — **Reversibility:** costly — every later feature registers against this shape, so changing the registry contract later touches every feature folder.
- **D-02:** No greyed-out "coming soon" tiles. Dead UI is noise in a personal tool, and a store-visible build must not advertise features it does not have.
- **D-03:** Navigation is in-place: a tile click swaps the grid for that category's panel inside the same fixed-size popup, with a back chevron plus category name in a header row. No nested levels, no separate options page in this phase.
- **D-04:** Footer carries the version string and a "Report an issue" link. Nothing else.

### Ad removal behaviour (CLEAN-01)
- **D-05:** A stripped promoted tweet vanishes completely — no placeholder strip, no "1 ad hidden" counter. A visible reminder of the ad defeats the point.
- **D-06:** Hiding is done by setting an extension-owned attribute plus `display: none` on the cell wrapper — never by removing or reparenting a React-owned node (research anti-pattern 2). This also makes un-toggling instant and lossless.
- **D-07:** Phase 1 scope is in-feed promoted tweets only. Promoted trends and sidebar ad slots are clutter surfaces and belong to Phase 2's clutter toggles.

### Selector-miss reporting (FOUND-04, success criterion 5)
- **D-08:** Misses are recorded per feature, not globally, so the user learns which one feature broke rather than "something is wrong".
- **D-09:** Surfacing is two-tier: a subtle orange dot badge on the extension action icon so it is noticed without opening the popup, and an inline warning row on the affected toggle inside the popup ("Not matching X's current layout") naming the feature. No console-only reporting.
- **D-10:** Miss state persists to a `diagnostics` storage key (feature, selector name, first-seen timestamp) so the report survives popup close and service-worker teardown. It clears automatically when the selector resolves again.
- **D-11:** Detection heuristic: a selector counts as missing only when its feature is enabled, the pipeline has observed at least one tweet, and the selector has resolved zero matches across a small consecutive-tick threshold — one counter, not a statistics engine. The exact threshold is the planner's call.

### Fresh-install defaults and off-site popup (UI-03)
- **D-12:** "Hide promoted tweets" is ON by default. It is the project's core value and the lowest-risk read-only feature. Every toggle added in later phases defaults OFF.
- **D-13:** The popup opened on a non-X tab renders normally and stays fully usable — toggles are storage writes and do not need a live X tab. No blocking "go to x.com" screen.
- **D-14:** X's active theme is cached to storage by the content script whenever it is detected or changes; the popup reads that cached value. Off-site with no cached value, it falls back to the browser's `prefers-color-scheme`. — **Reversibility:** reversible.

### Decisions taken directly by the user during plan review (2026-09-13)

Unlike D-01…D-14 above, these two are **not** Claude's call under the delegation. The user was
asked and answered. They are inputs to planning, not open questions.

- **D-15:** The popup ships a bundled, openly-licensed typeface rather than X's Chirp face, and the extension makes **zero outbound network requests**. The user was offered three paths — cache X's live `@font-face` URL and fetch it from `abs.twimg.com` (one GET per install), declare no webfont and ride X's fallback stack only, or bundle an OFL substitute — and chose the bundled substitute explicitly in order to keep outbound requests at zero. The consequence is accepted and recorded: the popup is *near*-native rather than pixel-native. Chirp is proprietary and is never redistributed; shadow-root surfaces name the Chirp family so the page's own document-level declaration resolves it for free. This supersedes the literal wording of REQUIREMENTS.md UI-04 and ROADMAP Phase 1 SC-1. — **Reversibility:** reversible (one `@font-face` block in one stylesheet).
- **D-16:** Where `.claude/CLAUDE.md`'s DOM-targeting constraint and X's real markup disagree, **the constraint bends to X's markup**, not the other way round. The user's words: *"do what x does actaully"*. Operative reading: selectors are `data-testid`-anchored wherever X exposes a testid for the target; where X exposes none (the scrolling timeline list is the known case), a structural-combinator candidate is permitted, but only inside `lib/selectors.ts`, only carrying a recorded justification naming the unlabelled target, and only when registered with the selector layer's miss reporting so it degrades loudly rather than silently (FOUND-04). Class-name selectors stay prohibited outright. Selector values are grounded by observation against live x.com, never by copying a research constant. The checked-in constraint is amended to say this, so the codebase does not stand in knowing violation of its own rule. — **Reversibility:** reversible (a constraint-text edit plus per-candidate annotations).

### Claude's Discretion
The user delegated this entire discussion apart from D-15 and D-16. Beyond the decisions above, researcher and planner retain full discretion on: exact popup dimensions and grid column count, the precise mechanism for reading X's active theme (open research question — `meta[name="theme-color"]`, computed body background, or a `data-*` signal), the consecutive-tick threshold in D-11, and the internal shape of the feature registry.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md` — core value, constraints (WXT/React/Tailwind/Radix, `data-testid` only, local-only storage), out-of-scope list, key decisions table
- `.planning/REQUIREMENTS.md` lines 12-20, 24, 64-68 — FOUND-01…09, CLEAN-01, UI-01…05 verbatim
- `.planning/ROADMAP.md` § "Phase 1: Foundation & Settings Popup" — goal, five success criteria, three empirical spikes (route-change detection, live GraphQL operation shapes, Radix-in-shadow-root behaviour)

### Architecture (load-bearing for this phase)
- `.planning/research/ARCHITECTURE.md` § "Recommended Project Structure" — the `entrypoints/` / `features/` / `lib/` layout this phase establishes
- `.planning/research/ARCHITECTURE.md` § "Architectural Patterns" 3, 4, 5 — shared observation pipeline with WeakSet + attribute dual-marking; MAIN-world bridge boundary; settings broadcast via `storage.onChanged` rather than message passing
- `.planning/research/ARCHITECTURE.md` § "Anti-Patterns" 1, 2, 4 — per-feature MutationObserver, mutating React-owned nodes, relying on `popstate`
- `.planning/research/PITFALLS.md` — selector fragility and A/B cohort variance
- `.planning/research/STACK.md` and `.claude/CLAUDE.md` § "Integration Risk" — Radix portal `container={ui.shadow}` requirement, Tailwind v4 into the shadow root, `postcss-rem-to-responsive-pixel` requirement

### Known-stale material
- Sections of `.planning/research/ARCHITECTURE.md` and `.planning/research/PITFALLS.md` covering the media downloader and reaction undo/posting semantics are stale — both were cut post-research (see `.planning/ROADMAP.md` § "Scope Notes"). Ignore them; plan no `chrome.downloads` work.

</canonical_refs>

<code_context>
## Existing Code Insights

The repository contains no source code yet — only `.planning/` and `.claude/`. This phase creates the project from scratch.

### Reusable Assets
- None in-repo. The WXT React template (`create-wxt`) plus `shadcn init --base radix` provide the starting scaffold per `.claude/CLAUDE.md`.

### Established Patterns
- `.claude/CLAUDE.md` locks the stack and its pitfalls: no top-level `vite.config.ts`, no `tailwind.config.js` under Tailwind v4, the unified `radix-ui` package, `:host` (not only `:root`) in shadow reset CSS, `postcss-rem-to-responsive-pixel` required.

### Integration Points
- Every later phase's feature folder plugs into three Phase 1 contracts: the pipeline's tweet-discovered / tweet-removed events, the selector layer in `lib/selectors.ts`, and the feature registry that drives the popup grid (D-01). Getting these three shapes right is the phase's real deliverable.

</code_context>

<specifics>
## Specific Ideas

- The popup's icon-grid + footer layout comes from a reference design the author already has (PROJECT.md key decisions). Treat "icon grid opening into per-category panels" as fixed shape, not a proposal.
- "Toggling it feels native, not bolted on" is the phase's quality bar: Chirp font, X's own theme, Radix controls that match X's control feel.

</specifics>

<deferred>
## Deferred Ideas

- Promoted trends and sidebar ad slot hiding — Phase 2 (clutter toggles).
- A full-page options surface (`entrypoints/options/`) — unnecessary while the popup holds every toggle; revisit only if the grid outgrows the popup.
- A user-visible diagnostics panel showing the MAIN-world bridge's captured GraphQL operation shapes — Phase 1 captures them as spike output for Phases 3-4, which is a developer artifact, not a user feature.

</deferred>

---

*Phase: 1-Foundation & Settings Popup*
*Context gathered: 2026-09-13*
