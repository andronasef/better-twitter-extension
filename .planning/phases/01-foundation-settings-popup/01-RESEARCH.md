# Phase 1: Foundation & Settings Popup - Research

**Researched:** 2026-09-13
**Domain:** Chrome MV3 content-script foundation (WXT + React 19 + Tailwind v4 + Radix) decorating x.com's virtualized React SPA, plus the extension's settings popup
**Confidence:** MEDIUM-HIGH — HIGH for WXT/Chrome platform mechanics (official docs via Context7, official WXT examples read from source) and HIGH for live-x.com DOM facts newly sourced this pass from the shipping source of an actively maintained X extension; MEDIUM for browser-behaviour questions that remain genuinely undecided (Navigation API in isolated worlds, virtualizer gap collapse) and are carried as spikes

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

> The user declined the interactive discussion and delegated the choices ("think of what best UX and do it"). Every decision below is Claude's call on best UX, made within the phase boundary. All are open to override during planning or review.

**Popup category map (UI-01, UI-02)**
- **D-01:** The tile grid is generated from a feature registry, not hardcoded. A category tile renders only when at least one toggle is registered under it. Phase 1 registers one category ("Timeline", holding "Hide promoted tweets"); Phases 2-5 add their own registrations and their tiles appear automatically with no popup rewrite. — **Reversibility:** costly — every later feature registers against this shape, so changing the registry contract later touches every feature folder.
- **D-02:** No greyed-out "coming soon" tiles. Dead UI is noise in a personal tool, and a store-visible build must not advertise features it does not have.
- **D-03:** Navigation is in-place: a tile click swaps the grid for that category's panel inside the same fixed-size popup, with a back chevron plus category name in a header row. No nested levels, no separate options page in this phase.
- **D-04:** Footer carries the version string and a "Report an issue" link. Nothing else.

**Ad removal behaviour (CLEAN-01)**
- **D-05:** A stripped promoted tweet vanishes completely — no placeholder strip, no "1 ad hidden" counter. A visible reminder of the ad defeats the point.
- **D-06:** Hiding is done by setting an extension-owned attribute plus `display: none` on the cell wrapper — never by removing or reparenting a React-owned node (research anti-pattern 2). This also makes un-toggling instant and lossless.
- **D-07:** Phase 1 scope is in-feed promoted tweets only. Promoted trends and sidebar ad slots are clutter surfaces and belong to Phase 2's clutter toggles.

**Selector-miss reporting (FOUND-04, success criterion 5)**
- **D-08:** Misses are recorded per feature, not globally, so the user learns which one feature broke rather than "something is wrong".
- **D-09:** Surfacing is two-tier: a subtle orange dot badge on the extension action icon so it is noticed without opening the popup, and an inline warning row on the affected toggle inside the popup ("Not matching X's current layout") naming the feature. No console-only reporting.
- **D-10:** Miss state persists to a `diagnostics` storage key (feature, selector name, first-seen timestamp) so the report survives popup close and service-worker teardown. It clears automatically when the selector resolves again.
- **D-11:** Detection heuristic: a selector counts as missing only when its feature is enabled, the pipeline has observed at least one tweet, and the selector has resolved zero matches across a small consecutive-tick threshold — one counter, not a statistics engine. The exact threshold is the planner's call.

**Fresh-install defaults and off-site popup (UI-03)**
- **D-12:** "Hide promoted tweets" is ON by default. It is the project's core value and the lowest-risk read-only feature. Every toggle added in later phases defaults OFF.
- **D-13:** The popup opened on a non-X tab renders normally and stays fully usable — toggles are storage writes and do not need a live X tab. No blocking "go to x.com" screen.
- **D-14:** X's active theme is cached to storage by the content script whenever it is detected or changes; the popup reads that cached value. Off-site with no cached value, it falls back to the browser's `prefers-color-scheme`. — **Reversibility:** reversible.

### Claude's Discretion

The user delegated this entire discussion. Beyond the decisions above, researcher and planner retain full discretion on: exact popup dimensions and grid column count, the precise mechanism for reading X's active theme (open research question — `meta[name="theme-color"]`, computed body background, or a `data-*` signal), the consecutive-tick threshold in D-11, and the internal shape of the feature registry.

### Deferred Ideas (OUT OF SCOPE)

- Promoted trends and sidebar ad slot hiding — Phase 2 (clutter toggles).
- A full-page options surface (`entrypoints/options/`) — unnecessary while the popup holds every toggle; revisit only if the grid outgrows the popup.
- A user-visible diagnostics panel showing the MAIN-world bridge's captured GraphQL operation shapes — Phase 1 captures them as spike output for Phases 3-4, which is a developer artifact, not a user feature.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Single shared tweet observation pipeline, de-duplicated across recycled nodes | Pattern 3 (timeline-scoped `childList`-only observer + dual marking); verified timeline/cell selectors in Standard Selectors table |
| FOUND-02 | Feature code subscribes to the pipeline, no per-feature MutationObserver | Pattern 3 + Pattern 6 (feature controller contract with `init`/`teardown`); Anti-Pattern 1 |
| FOUND-03 | Re-initializes correctly on client-side route changes | Pattern 2 (layered route watcher). **Corrects a load-bearing error in prior research** — an isolated-world `history.pushState` patch cannot see the page's navigations. Spike S1 |
| FOUND-04 | Selector-resolution layer keyed on `data-testid` with fallbacks and miss reporting | Pattern 4 + Don't Hand-Roll; badge plumbing via `chrome.action` from the background |
| FOUND-05 | MAIN-world bridge observing X's fetch/XHR, passing data to the isolated world | Pattern 1. **X uses XMLHttpRequest for GraphQL, not only `fetch`** — verified from a shipping extension's source. Concrete URL/operation shapes in Code Examples. Spike S2 |
| FOUND-06 | Shared Radix portal-provider rendering portalled UI inside the shadow root | Pattern 5 + Code Example 5; Phase-1 proof vehicle (dev-only probe entrypoint) described in Open Questions. Spike S3 |
| FOUND-07 | Settings broadcast via `storage.onChanged`, applying live | Pattern 6 (`storage.defineItem` + `.watch()`); storage key layout table |
| FOUND-08 | 60fps scroll, no long tasks attributable to the extension | Pattern 3 (`childList` without `subtree`, bounded children re-scan, no layout reads in callback); Pitfall 2 |
| FOUND-09 | Observers/listeners/nodes cleaned up as X recycles nodes | Pattern 7 (named observer registry + `ctx` helpers + `AbortController`); Anti-Pattern 5 |
| UI-01 | Popup presents settings as a grid of categorical icon tiles with a footer | Popup Shell section; `action.default_popup`, 800x600 ceiling |
| UI-02 | Selecting a tile opens that category's panel within the popup | Popup Shell section (in-place view swap, D-03) |
| UI-03 | Popup matches the user's active X theme | Pattern 8 (body `background-color` probe + attribute observer + storage cache). **Dim was removed from x.com web in Feb 2026** — detection must be value-driven, not a 3-value enum |
| UI-04 | Popup uses X's Chirp font and native-feeling Radix/shadcn controls | Font section. Chirp resolves free inside the content shadow root; the popup needs an explicit strategy — flagged as an open decision |
| UI-05 | Each feature toggle carries a tooltip explaining what it does | Radix `Tooltip` in the popup (plain document, no shadow root, no portal gymnastics) |
| CLEAN-01 | Hide promoted/ad tweets, stripped continuously as the feed loads | Pattern 9 + Code Example 3. `[data-testid="placementTracking"]` verified; hide the cell's **firstElementChild**, not the transform-positioned cell (refines D-06). Spike S4 |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `.claude/CLAUDE.md`. These carry the same authority as locked decisions.

| # | Directive | Applies to this phase |
|---|-----------|----------------------|
| C-1 | Stack is WXT + React + TypeScript + Tailwind + Radix (shadcn). No substitutions | All plans |
| C-2 | **No top-level `vite.config.ts`.** All Vite config goes in `wxt.config.ts`'s `vite: () => ({...})` | Project scaffold |
| C-3 | **No `tailwind.config.js`/`.ts`.** Tailwind v4 is CSS-first (`@theme` in CSS); leave `components.json`'s `tailwind.config` blank | Project scaffold |
| C-4 | Use the unified `radix-ui` package, not individual `@radix-ui/react-*`. Scaffold with `shadcn init --base radix` | Project scaffold |
| C-5 | **TypeScript `^5.7` — do NOT adopt TypeScript 7.x** (`tsgo`) yet | `package.json` |
| C-6 | `postcss-rem-to-responsive-pixel` is **required**, not optional | Build config |
| C-7 | Shadow-root reset CSS must target `:host`, not only `:root` (isolated-element v3) | Shadow UI CSS |
| C-8 | **Every** Radix `*.Portal` rendered inside a shadow root must receive `container={ui.shadow}` (the `ShadowRoot`, not `shadowHost`) | FOUND-06 |
| C-9 | DOM targeting: `data-testid` selectors only; no class-name or structural-position selectors as the sole path | FOUND-04, CLEAN-01 |
| C-10 | Storage is WXT `storage.defineItem` over `chrome.storage.local`. No backend, no network calls beyond X itself | FOUND-07 |
| C-11 | Manifest: narrow host scope (`*://x.com/*`, `*://twitter.com/*`), no `<all_urls>`, minimum API permissions | Manifest |
| C-12 | No remote code, no `eval`, no `new Function` — standing rule from this phase onward | Build audit |
| C-13 | Never `append: 'replace'` against X's own DOM; insert siblings only | Any injection |
| C-14 | GSD workflow enforcement: all edits go through a GSD command | Process |

**Conflict note:** C-9 ("`data-testid` only") cannot be met literally for the timeline container — X does not put a `data-testid` on the scrolling list itself, only on `primaryColumn` and on each cell. The resolution used throughout this research is: the **primary** selector in every chain is `data-testid`-anchored where one exists, and non-`data-testid` selectors appear only as scoped fallbacks inside the selector layer (FOUND-04), never inline in feature code. The planner should treat that as the operative reading of C-9.

---

## Summary

This phase has three genuinely hard problems and one easy one. The easy one is the popup: it is an ordinary extension page (React + Tailwind v4 + shadcn, no shadow root, no portal gymnastics, 800x600 ceiling), and the official WXT `react-shadcn` example is a directly copyable wiring reference. The hard ones are (a) knowing when x.com navigated, (b) knowing when a tweet appeared, and (c) putting Radix UI inside a shadow root on a page that fights you.

Two findings materially change the plan relative to prior project research. **First, the prior architecture's route-watcher recommendation is wrong.** `ARCHITECTURE.md` states that patching `history.pushState` from the isolated world works "because `window.history` is a shared native DOM binding." WXT's own issue tracker states the opposite in plain terms: *"This doesn't work in isolated content scripts. `history.pushState` in the content script is not the same function as `history.pushState` in the main world."* The DOM object is shared; the JS function wrapper is per-world, so an isolated-world patch only ever intercepts the extension's own calls. WXT's built-in `wxt:locationchange` works around this by **polling location once per second**, which is too slow to be the primary watcher for "toggling feels native." The correct design for this project is to patch history **inside the MAIN-world bridge this phase already ships** (FOUND-05) and emit a `CustomEvent` — one injected script, two jobs, zero extra cost.

**Second, a live, MIT-licensed, actively maintained reference implementation exists and was read directly this session:** `insin/control-panel-for-twitter` v4.24.1 (last pushed 2026-09-06). It answers, from shipping code rather than inference, what X's promoted-tweet marker is, how to detect X's active theme, what the timeline container selector is, how to hide a timeline item without fighting the virtualizer, that X's GraphQL goes over **XMLHttpRequest** (so a `fetch`-only bridge would capture nothing), and what a real GraphQL URL looks like. It also shows that a `childList`-only observer on the timeline with a full re-scan of its (virtualized, therefore small) children list is sufficient in production — which is a meaningful simplification over the rAF-debounced subtree observer plus `IntersectionObserver` that prior research prescribed.

One scope-touching fact: **x.com removed the Dim theme from the web app in February 2026.** UI-03 names three themes; the web now serves two. Theme detection must therefore read a *value* and derive a scheme, never switch on a hardcoded three-way enum.

**Primary recommendation:** Build the phase as five sequential layers — storage/settings → MAIN-world bridge (fetch + XHR + history patch) → route watcher consuming the bridge → timeline observation pipeline + selector layer → CLEAN-01 as the end-to-end proof — then the popup shell on top, with the Radix-in-shadow-root provider proven by a dev-only probe entrypoint that never ships to production.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Observing X's network traffic (FOUND-05) | MAIN world (page JS context) | — | `fetch`/`XHR` are per-world JS bindings; only MAIN-world code sees the page's own calls |
| Detecting SPA navigation (FOUND-03) | MAIN world (history patch) | Isolated world (`popstate`, `<title>` observer) | Same per-world binding problem as above; isolated-world fallbacks cover back/forward and bridge failure |
| Tweet discovery + de-dup (FOUND-01/02) | Isolated world content script | — | Pure DOM observation; the DOM is shared, so no MAIN-world access is needed and isolation is safer |
| Selector resolution + miss counting (FOUND-04) | Isolated world content script | — | Needs `chrome.storage` to persist diagnostics; MAIN world has no `chrome.*` |
| Hiding promoted tweets (CLEAN-01) | Isolated world (attribute write) + page stylesheet | — | One extension-owned `<style>` in the page document does the hiding; the content script only toggles attributes |
| Settings persistence + broadcast (FOUND-07) | `chrome.storage.local` | Isolated world listeners, popup writer | Storage is the fan-out mechanism; it works with 0..N tabs open and needs no tab enumeration |
| Injected interactive UI (FOUND-06) | Shadow root inside the page | — | Full CSS isolation from X's atomic CSS in both directions |
| Settings UI (UI-01…05) | Popup extension page | — | Own document, own origin, own CSP; no shadow root needed |
| Action badge for selector misses (D-09) | Background service worker | Isolated world (message sender) | `chrome.action` is not callable from a content script |
| Theme detection (UI-03) | Isolated world content script | `chrome.storage.local` cache, popup reader | Only a script on x.com can see X's theme; the popup reads the cached value (D-14) |

---

## Standard Stack

### Core

All versions confirmed against `registry.npmjs.org` on 2026-09-13.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `wxt` | `0.21.4` | MV3 manifest generation, entrypoints, HMR, storage, shadow-root UI helpers, zip/submit | `[VERIFIED: npm registry]` latest is 0.21.4, 436k weekly downloads, repo `github.com/wxt-dev/wxt`. Locked by C-1 |
| `@wxt-dev/module-react` | `1.2.2` | Wires the React Vite plugin + refresh into WXT | `[VERIFIED: npm registry]`. Use `modules: ['@wxt-dev/module-react']`, never hand-wire `@vitejs/plugin-react` |
| `react` / `react-dom` | `19.3.0` | UI for popup + injected surfaces | `[VERIFIED: npm registry]`. Keep both at the identical version — mismatch is the classic "Portal is broken" red herring |
| `typescript` | `~5.7` (registry latest is `7.0.2`) | Type safety | **C-5 pins 5.7.** `[VERIFIED: npm registry]` that `latest` is now 7.0.2 — do not let a fresh `npm i typescript` pull it |
| `tailwindcss` + `@tailwindcss/vite` | `4.3.3` (both) | CSS for popup + shadow UIs | `[VERIFIED: npm registry]`. Majors must match. Registered via `wxt.config.ts`'s `vite()` hook (C-2) |
| `radix-ui` (unified) | `1.6.7` | Accessible primitives under shadcn | `[VERIFIED: npm registry]`, 10M weekly downloads. C-4 |
| `lucide-react` | `1.45.0` | Category tile + chrome icons | `[VERIFIED: npm registry]`. Per-icon imports only |
| `shadcn` (CLI, devDep/npx) | `4.21.0` | Generates component source into the repo | `[VERIFIED: npm registry]`. Not a runtime dep. `shadcn init --base radix` (C-4) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `postcss-rem-to-responsive-pixel` | `7.0.5` | Rewrites `rem` → `px` at build time | **Always** (C-6). `[VERIFIED: npm registry]` latest is **7.0.5, not the `^6.x` CLAUDE.md records** — planner must use 7.x |
| `nanoid` | `6.0.1` | IDs for registry entries / future migrations | `[VERIFIED: npm registry]` latest is **6.0.1, not the `^5.x` CLAUDE.md records**. Phase 1 barely needs it; include only if a plan actually generates an ID |
| `@wxt-dev/auto-icons` | `1.1.2` | Generates all icon sizes from one source | `[VERIFIED: npm registry]`. Optional in Phase 1, removes a whole Phase 6 failure class |
| `vitest` | `5.0.0` | Unit tests for pure logic (selector chains, settings diffing, miss counter) | `[VERIFIED: npm registry]`. Wire via `wxt/testing/vitest-plugin` + `wxt/testing/fake-browser` |
| `@playwright/test` | `1.63.0` | E2E against the real unpacked build | `[VERIFIED: npm registry]`. The only way to exercise shadow DOM + real MutationObserver behaviour |
| `tw-animate-css` | (per shadcn) | Animation utilities shadcn v4 templates import | `[CITED: github.com/wxt-dev/examples examples/react-shadcn/assets/tailwind.css]` — the official example imports it; include it or strip the `@import` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MAIN-world history patch (route watcher) | WXT's built-in `wxt:locationchange` | Free and zero-code, but **polls once per second** `[CITED: github.com/wxt-dev/wxt/issues/1567]` — a visible lag between navigating and features reapplying. Keep it as a belt-and-braces safety net, never as the primary |
| MAIN-world history patch | `<title>` MutationObserver | Proven on x.com specifically by `control-panel-for-twitter`, works from the isolated world with no patching. Costs: X sets the title asynchronously and emits a "Flash of Uninitialised Title" the reference implementation special-cases heavily. Good **secondary** |
| MAIN-world history patch | Navigation API (`window.navigation`) in the isolated world | Simplest possible code if it works. Unverified across the isolated-world boundary — Spike S1 |
| Isolated-world content script + injected bridge | Run everything in the MAIN world (`control-panel-for-twitter`'s architecture) | Gives direct access to X's React internals, but loses `chrome.*` entirely (settings must be shuttled through a `<script type="text/json">` element) and exposes all extension code to page tampering. Rejected — our UI needs `chrome.storage` and a shadow root |
| `IntersectionObserver` per discovered tweet | Nothing (defer to a later phase) | Phase 1's only per-tweet feature is a `closest()` check, which is cheap and must run whether or not the tweet is visible. Adding an IO per tweet in Phase 1 is cost with no consumer. Design the pipeline to *allow* a visibility hook; do not instantiate one |
| `@font-face` pointing at X's CDN (popup Chirp) | Bundling a Chirp font file | Chirp is proprietary (commissioned from Grilli Type). Bundling it into a Chrome Web Store package is a licensing exposure the project should not take. See Font section |

**Installation:**

```bash
npx wxt@latest init better-twitter -t react
cd better-twitter

npm install tailwindcss@^4.3 @tailwindcss/vite@^4.3
npx shadcn@latest init --base radix          # writes components.json, installs `radix-ui`
npm install lucide-react

npm install -D postcss-rem-to-responsive-pixel@^7   # NOTE: 7.x, not 6.x
npm install -D typescript@~5.7                      # NOTE: pin. `latest` is now 7.0.2
npm install -D vitest @playwright/test @wxt-dev/auto-icons
```

---

## Package Legitimacy Audit

Run via `gsd-tools query package-legitimacy check --ecosystem npm`, cross-checked against `registry.npmjs.org` metadata.

| Package | Registry | Latest publish | Weekly downloads | Source Repo | Verdict | Disposition |
|---------|----------|----------------|------------------|-------------|---------|-------------|
| `wxt` | npm | 2026-08-11 | 436,239 | github.com/wxt-dev/wxt | OK | Approved |
| `@wxt-dev/module-react` | npm | 2026-03-14 | 240,015 | github.com/wxt-dev/wxt | OK | Approved |
| `@wxt-dev/auto-icons` | npm | 2026-08-02 | 80,946 | github.com/wxt-dev/wxt | OK | Approved |
| `react` | npm | 2026-09-09 | 128,119,130 | github.com/react/react | SUS (`too-new`) | Approved — see note |
| `react-dom` | npm | 2026-09-09 | 120,650,097 | github.com/react/react | SUS (`too-new`) | Approved — see note |
| `typescript` | npm | 2026-07-08 | 203,362,610 | github.com/microsoft/TypeScript | OK | Approved **at `~5.7`**, not `latest` |
| `tailwindcss` | npm | 2026-07-16 | 92,659,855 | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `@tailwindcss/vite` | npm | 2026-07-16 | 32,719,248 | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `radix-ui` | npm | 2026-07-24 | 10,071,641 | github.com/radix-ui/primitives | OK | Approved |
| `lucide-react` | npm | 2026-09-11 | 74,057,283 | github.com/lucide-icons/lucide | SUS (`too-new`) | Approved — see note |
| `postcss-rem-to-responsive-pixel` | npm | 2026-07-26 | 15,061 | github.com/sonofmagic/postcss-plugins | OK | Approved — low downloads are expected for a niche build plugin; WXT's own FAQ names it |
| `nanoid` | npm | 2026-08-03 | 179,389,925 | github.com/ai/nanoid | OK | Approved |
| `shadcn` | npm | 2026-09-04 | 7,307,607 | github.com/shadcn-ui/ui | SUS (`too-new`) | Approved — see note |
| `vitest` | npm | 2026-09-03 | 77,062,981 | github.com/vitest-dev/vitest | SUS (`too-new`) | Approved — see note |
| `@playwright/test` | npm | 2026-09-04 | 45,794,389 | github.com/microsoft/playwright | SUS (`too-new`) | Approved — see note |

**Packages removed due to [SLOP] verdict:** none.

**Packages flagged as suspicious [SUS]:** `react`, `react-dom`, `lucide-react`, `shadcn`, `vitest`, `@playwright/test`.

**Note on the SUS verdicts — read before adding checkpoints.** In every case the *only* reason returned was `too-new`, which keys on the recency of the **latest release**, not on the package. Each of these has 7M–128M weekly downloads and a source repo matching the canonical upstream, and every one was reached from an official documentation source (WXT's own examples, shadcn's docs) rather than from a search result. This is release-cadence noise, not a slopsquatting signal. The planner should **not** insert a `checkpoint:human-verify` per install; instead, pin exact versions in `package.json` and commit the lockfile, which is the control that actually addresses the underlying risk. If the planner prefers to honour the protocol literally, one single checkpoint covering the whole `npm install` step is proportionate — six separate ones are not.

**Postinstall audit:** `npm view <pkg> scripts.postinstall` returned `null` for every package checked via the legitimacy seam (`"postinstall": null` in the signals payload for all 15). Note that the *project's own* `package.json` will carry `"postinstall": "wxt prepare"` — that is WXT's own scaffold, expected, and local.

---

## Architecture Patterns

### System Architecture Diagram

```
                    x.com page load (run_at: document_start)
                                 │
   ┌─────────────────────────────┴──────────────────────────────────────────┐
   │                        MAIN WORLD (x.com's own JS)                      │
   │                                                                          │
   │   bridge.js  (defineUnlistedScript, injected via injectScript,           │
   │               keepInDom: true, listed in web_accessible_resources)       │
   │      ├── patch window.fetch ────────────┐                               │
   │      ├── patch XMLHttpRequest.open/send ┤  observe, never modify         │
   │      └── patch history.pushState/replaceState ──┐                        │
   │                                          │      │                        │
   └──────────────────────────────────────────┼──────┼────────────────────────┘
              CustomEvent on the <script> node │      │
   ┌──────────────────────────────────────────▼──────▼────────────────────────┐
   │                     ISOLATED WORLD (single content script)               │
   │                                                                           │
   │  bridge-client ──► 'bt:graphql'  ──► operation-shape recorder (spike out) │
   │  bridge-client ──► 'bt:navigate' ──► ROUTE WATCHER ──┐                     │
   │      ▲                                               │                    │
   │      └── fallbacks: popstate · <title> observer ·    │                    │
   │                     wxt:locationchange (1s poll)     │                    │
   │                                                      ▼                    │
   │                                        ┌── teardown page-scoped work ──┐  │
   │                                        │                               │  │
   │  SELECTOR LAYER  ◄── every query ──────┤   OBSERVATION PIPELINE        │  │
   │   resolve(name) → chain → hit|miss     │   MutationObserver on the     │  │
   │   per-feature miss counters            │   timeline, childList only    │  │
   │        │                               │   → dedup (WeakSet + attr)    │  │
   │        │ miss ≥ threshold              │   → emit tweet:seen/gone      │  │
   │        ▼                               └──────────┬────────────────────┘  │
   │  DIAGNOSTICS ──runtime.sendMessage──┐              │ subscribe             │
   │                                     │              ▼                       │
   │  THEME PROBE (body style observer) ─┤   FEATURE CONTROLLERS                │
   │        │                            │   ad-stripper.init()/teardown()      │
   │        ▼                            │        │ sets data-bt-hidden         │
   │  ┌──────────────────────┐           │        ▼                             │
   │  │ SETTINGS STORE       │◄──watch───┤   one extension <style> in the page  │
   │  │ storage.defineItem   │           │   [data-bt-hidden]{display:none}     │
   │  └──────────┬───────────┘           │                                      │
   └─────────────┼───────────────────────┼──────────────────────────────────────┘
                 │ chrome.storage.local  │ chrome.runtime.sendMessage
   ┌─────────────▼───────────┐   ┌───────▼──────────────────────────────────┐
   │ chrome.storage.local    │   │ BACKGROUND SERVICE WORKER (event-driven) │
   │  local:settings   (v1)  │   │  onMessage 'bt:diagnostics-changed'      │
   │  local:diagnostics      │◄──┤    → chrome.action.setBadgeText('●')     │
   │  local:xTheme           │   │    → setBadgeBackgroundColor(orange)     │
   └─────────────┬───────────┘   └──────────────────────────────────────────┘
                 │ storage.onChanged
   ┌─────────────▼────────────────────────────────────────────────────────────┐
   │ POPUP (extension page, own document, no shadow root, ≤ 800x600)          │
   │  feature registry → tile grid ⇄ category panel (in-place swap)           │
   │  Radix Switch + Tooltip · reads local:xTheme for colours · footer        │
   └──────────────────────────────────────────────────────────────────────────┘
```

Primary use case traced through the diagram: user flips "Hide promoted tweets" in the popup → popup writes `local:settings` → `storage.onChanged` fires in every open x.com tab → the settings store diffs and calls `adStripper.init()` → the controller asks the pipeline to replay every currently-known tweet → for each, `selectors.resolve('promotedContainer', tweetEl)` runs → matches set `data-bt-hidden` on the cell's first element child → the already-present extension stylesheet hides it. No reload, no re-render of X's tree.

### Recommended Project Structure

```
better-twitter/
├── wxt.config.ts                    # modules, vite(), manifest — the ONLY build config (C-2)
├── postcss.config.js                # remToPx only (C-6)
├── components.json                  # shadcn, tailwind.config left "" (C-3)
├── assets/
│   └── tailwind.css                 # @import "tailwindcss"; @theme; :root,:host reset (C-7)
├── entrypoints/
│   ├── background.ts                # onMessage → chrome.action badge. Nothing else in Phase 1
│   ├── bridge.ts                    # defineUnlistedScript — MAIN world. fetch+XHR+history. No imports of feature code
│   ├── x.content/                   # ONE content script for the whole extension
│   │   ├── index.ts                 # bootstrap: settings → bridge → route → pipeline → features
│   │   ├── bridge-client.ts
│   │   ├── route-watcher.ts
│   │   ├── pipeline.ts
│   │   └── theme-probe.ts
│   ├── probe.content/               # DEV ONLY — Radix-in-shadow-root spike surface. exclude from prod
│   └── popup/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── features/
│   └── ad-stripper/                 # index.ts exporting { id, init, teardown }, registry.ts entry
├── lib/
│   ├── storage.ts                   # storage.defineItem definitions + typed accessors
│   ├── selectors.ts                 # the ONLY place a raw selector string appears
│   ├── diagnostics.ts               # miss counters → local:diagnostics
│   ├── registry.ts                  # feature + category registry driving the popup grid (D-01)
│   └── observers.ts                 # named observer registry + teardown scopes
└── components/ui/                   # shadcn-generated source
```

**Structure rationale:** one content-script entrypoint, not several. Each WXT content-script entrypoint is a separate bundle with its own isolated instance — two entrypoints matching `x.com` means two settings listeners, two observers, and two chances to double-process a tweet. `features/` and `lib/` are plain modules imported by that single entrypoint. `entrypoints/bridge.ts` must not import anything from `lib/` that touches `browser.*`; MAIN-world code has no `chrome.*` and the failure is a silent runtime `undefined`.

---

### Pattern 1: MAIN-world bridge patching fetch **and** XHR

**What:** A tiny unlisted script injected into the page context that wraps `window.fetch`, `XMLHttpRequest.prototype.open` and `XMLHttpRequest.prototype.send`, observes X's GraphQL traffic, and re-emits it as `CustomEvent`s on its own `<script>` node.
**When to use:** FOUND-05, and (Pattern 2) the history patch rides in the same file.
**Why XHR matters:** `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3-92]` — the shipping extension patches `XMLHttpRequest.prototype.open` and `XMLHttpRequest.prototype.send` and matches on `url.includes('/TweetDetail?')` and `url.includes('/HomeLatestTimeline')`. A `fetch`-only bridge would capture nothing for those operations. Patch both.
**Trade-offs:** MAIN-world code is visible to and tamperable by X's own JS. Keep the file to the three patches plus the event emitter; never import feature code; never accept commands *from* the page.

**Critical WXT detail:** the bridge must be injected with `keepInDom: true`. WXT's bidirectional-comms pattern dispatches events on the `<script>` element itself `[CITED: wxt.dev/guide/essentials/content-scripts]`; if the node is removed, the channel dies. The reference implementation removes its script node and falls back to `window.postMessage` — do not copy that, because `window` message events leak to every other extension and page script on the page.

### Pattern 2: Layered route watcher (MAIN-world history patch primary)

**What:** `history.pushState`/`replaceState` are wrapped inside the MAIN-world bridge; each call and each `popstate` emits `bt:navigate` with the new URL. The isolated world compares against the last-seen path, and on a real change tears down page-scoped observers and re-runs page setup.

**Why not the obvious alternatives:**

| Mechanism | Verdict |
|-----------|---------|
| Isolated-world `history.pushState` patch | **Does not work.** `[CITED: github.com/wxt-dev/wxt/issues/1567]` — *"history.pushState in the content script is not the same function as history.pushState in the main world."* This directly contradicts `ARCHITECTURE.md`'s Pattern 4, which the planner should treat as superseded |
| `popstate` alone | Back/forward only — `pushState` does not fire it. Correct as a *supplement*; it does fire in the isolated world because DOM events are shared across worlds |
| `wxt:locationchange` | Works, but is a **1-second poll** `[CITED: github.com/wxt-dev/wxt/issues/1567]`. Keep as a last-resort net |
| `<title>` MutationObserver | Proven against x.com in production `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3412-3438, 7746-7748]` — the source comment reads *"This script assumes navigation has occurred when the document title changes"*. Strong secondary; needs "Flash of Uninitialised Title" handling (`title == 'X'`) |
| Navigation API in the isolated world | Unknown — Spike S1 |

**Recommended layering:** `bt:navigate` from the bridge (primary) → `popstate` (back/forward guarantee) → `<title>` observer (bridge-failure net) → all three funnelled into one debounced `onRouteChange(url)` that no-ops when `url === lastUrl`. Cost of the redundancy is one string compare.

### Pattern 3: One timeline-scoped `childList` observer, bounded re-scan, dual marking

**What:** `MutationObserver` on the timeline container with `{ childList: true }` and **no `subtree`**. On each batch, iterate `timeline.children` (not `document.querySelectorAll`), resolve each cell's tweet, and de-dup with a `WeakSet<Element>` **plus** a `data-bt-seen="<tweetId>"` attribute.

**Why this beats the prior prescription:** `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:2932-2973 (observeElement), 3705-3712, 6116+]` — the reference implementation observes the timeline with the default `{childList: true}` and re-reads `$timeline.children` on every callback, with no rAF debounce and no `IntersectionObserver`, and ships that to a large user base. The reason it is cheap: the list is virtualized, so `children.length` stays in the tens; and without `subtree`, callbacks only fire when cells are added/removed at the top level, not for every internal React re-render inside a tweet. Prior research's rAF-debounced `subtree: true` observer is strictly more expensive and more code.

**Keep from prior research:** never read layout (`getBoundingClientRect`, `offsetHeight`) inside the callback; never `querySelectorAll` the document; `WeakSet` (not `Map`) for per-node state so recycled nodes are collectable.

**Dual marking is not optional.** X recycles a cell's DOM node for a *different* tweet during virtualization. A boolean "touched" mark produces stale state; the mark must carry the tweet ID so a recycled node is re-processed.

**Trade-off:** a single pipeline means one bug breaks every feature. It gets its own module and its own Vitest coverage (pure `WeakSet`/attribute logic is testable without a browser).

### Pattern 4: Selector resolution with fallback chains and per-feature miss counting

**What:** `lib/selectors.ts` is the only file containing selector strings. Each named selector is an ordered array of candidates. `resolve(name, root)` walks the chain, returns the first match, and reports hit/miss to `lib/diagnostics.ts` tagged with the *calling feature's* id (D-08).

**Miss heuristic (D-11):** a selector is "missing" only when all three hold — (1) its owning feature is enabled, (2) the pipeline has emitted at least one `tweet:seen` this page, (3) the chain has returned zero matches on **three consecutive** pipeline ticks. Three is the recommended threshold: one tick is noise (a cell mid-render), two can still be a single slow frame, three across separate mutation batches means the markup genuinely changed. It clears on the first hit (D-10).

**Never throw.** A miss returns `null` and the caller skips that element. One broken selector must degrade exactly one feature.

### Pattern 5: Shadow-root portal provider (FOUND-06)

**What:** A React context carrying the `ShadowRoot`, consumed by every component that renders a Radix `*.Portal`.

`[VERIFIED: context7 /websites/radix-ui_primitives]` — every floating Radix primitive's `Portal` takes `container: HTMLElement` defaulting to `document.body`; confirmed on `Popover.Portal`, `Tooltip.Portal`, `HoverCard.Portal`, `Dialog.Portal`, `DropdownMenu.Portal`. Pass `ui.shadow` (the `ShadowRoot`) — **not** `ui.shadowHost`, which sits in the page's unstyled DOM `[VERIFIED: context7 /llmstxt/wxt_dev_llms_txt — ShadowRootContentScriptUi: "shadow: ShadowRoot — the shadow root performing the isolation"; "shadowHost: HTMLElement — this element is added to the DOM and its styles are not isolated"]`.

**Phase-1 scope note:** none of FOUND-01…09 / UI-01…05 / CLEAN-01 requires a *user-facing* shadow-root surface. The provider must still be built and proven (it is inherited by Phases 4 and 5), so build it plus a **dev-only probe entrypoint** (`entrypoints/probe.content/`) that mounts a Popover, a DropdownMenu and a Tooltip inside a `createShadowRootUi`, and exclude it from production builds via the entrypoint's `exclude`/`include` options `[VERIFIED: context7 /llmstxt/wxt_dev_llms_txt — defineContentScript supports include/exclude "if the background should be removed from some builds"]`. This satisfies D-02 (no dead UI ships) while giving Spike S3 something real to test against live X overlays.

**Prefer `Popover`/`DropdownMenu` over `Dialog`** inside the shadow root — the open Radix shadow-DOM issues concentrate in `Dialog`'s focus-trap and scroll-lock paths (`radix-ui/primitives#3353`, `#3483`, `#2055`, per `PITFALLS.md` Pitfall 12).

### Pattern 6: Settings as one versioned storage item + a diffing dispatcher

**What:** `[VERIFIED: context7 /llmstxt/wxt_dev_llms_txt]` — `storage.defineItem<T>('local:key', { fallback, version, migrations })` returns an item with `getValue`/`setValue`/`watch(cb)`, and unversioned items are treated as version 1 so versioning can be added retroactively.

**Recommended key layout:**

| Key | Shape | Written by | Watched by |
|-----|-------|-----------|------------|
| `local:settings` | `{ version, features: Record<featureId, boolean> }` | Popup | Content script (diffs, dispatches per-feature) |
| `local:diagnostics` | `Record<featureId, { selector, firstSeen }>` | Content script | Popup (inline warning row), background (badge) |
| `local:xTheme` | `{ backgroundColor: string, scheme: 'light'\|'dark'\|'unknown', seenAt: number }` | Content script theme probe | Popup |

Three separate keys, not one: diagnostics writes are frequent and must not wake every feature's settings listener, and the theme cache changes independently of user intent.

**The dispatcher is the part people forget.** `watch` fires with the whole object. The content script must diff old vs new `features` and call `init()`/`teardown()` only for the ids that actually changed, or every toggle re-initializes every feature.

### Pattern 7: Named observer registry with page-scoped teardown (FOUND-09)

**What:** Two `Map<string, MutationObserver>` registries — `globalObservers` (survive navigation: `<body>` style, `<title>`) and `pageObservers` (torn down on every route change: timeline, tab container). Registering a name that already exists disconnects the old one first.

`[VERIFIED: control-panel-for-twitter@4.24.1 script.js:2415, 2458, 2932-2973]` — `let globalObservers = new Map()` / `let pageObservers = new Map()`, and `observeElement` disconnects any existing observer under the same name before registering. This is the mechanism that keeps a long session from accumulating observers across dozens of navigations.

Combine with WXT's own lifecycle helpers `[VERIFIED: context7 /websites/wxt_dev_guide]`: `ctx.addEventListener(...)`, `ctx.setTimeout(...)`, `ctx.setInterval(...)`, `ctx.requestAnimationFrame(...)`, and `ctx.isValid` / `ctx.isInvalid` — these stop firing when the extension context is invalidated (update/reload), which is the other half of FOUND-09. For raw `addEventListener` on page nodes, use `{ signal }` from an `AbortController` scoped to the page.

### Pattern 8: Theme detection by value, not by enum (UI-03)

**What:** Read `document.body.style.backgroundColor`, map it to a scheme, and observe `<body>`'s `style` attribute for changes.

`[VERIFIED: control-panel-for-twitter@4.24.1 script.js:5597-5602]`, verbatim:

```js
function getColorScheme() {
  return {
    'rgb(255, 255, 255)': 'Default',
    'rgb(0, 0, 0)': 'LightsOut',
    'rgb(5, 5, 5)': 'LightsOut',
  }[$body.style.backgroundColor]
}
```

and the change detector `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3033-3064]`:

```js
observeElement($body, () => {
  let backgroundColor = $body.style.backgroundColor
  if (backgroundColor == lastBackgroundColor) return
  $body.classList.toggle('Default', backgroundColor == 'rgb(255, 255, 255)')
  $body.classList.toggle('LightsOut', backgroundColor == 'rgb(0, 0, 0)' || backgroundColor == 'rgb(5, 5, 5)')
  // ...
}, { /* ... */ }, {
  attributes: true,
  attributeFilter: ['style']
})
```

Three things to take from this. First, X writes the theme background as an **inline style on `<body>`** — so `$body.style.backgroundColor` (not `getComputedStyle`) is the cheap, layout-free read. Second, a `MutationObserver` with `attributeFilter: ['style']` on `<body>` is the change signal, and X re-renders the app when it changes. Third and most important: **that map has no Dim entry**, which independently corroborates the press reporting that X removed Dim from the web in February 2026 `[CITED: piunikaweb.com/2026/03/05/x-removes-blue-grey-dim-theme-web/ — "you only have the pure Lights Out option now"]`.

**Therefore:** cache the raw `backgroundColor` string alongside a derived `scheme`, with an explicit `'unknown'` branch, and let the popup fall back to `prefers-color-scheme` when the scheme is `unknown` or absent (D-14). Do **not** write a three-value `'light' | 'dim' | 'lightsOut'` union — a Dim cohort may still exist, and hardcoding the enum is what turns "unknown theme" into "popup renders wrong" instead of "popup falls back gracefully."

`meta[name="theme-color"]` also exists on the page `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3468]` and is a reasonable cross-check, but the body inline style is the signal the reference implementation actually keys its theming on.

### Pattern 9: Hide the cell's inner wrapper, not the cell

**What:** One extension-owned `<style>` in the page document holds a single `display: none !important` rule keyed on an extension attribute; feature code only toggles the attribute.

`[VERIFIED: control-panel-for-twitter@4.24.1 script.js:4165-4171, 5179-5185, 6294-6305]`. The hide rule, verbatim:

```js
let hideCssSelectors = [
  '.HiddenTweet',
  '.HiddenTweet + [role="separator"]',
  '.HiddenAd',
  // Hide promoted trends
  `[data-testid="trend"]:has(path[d="${Svgs.PROMOTED_PATH}"])`,
]
```
```js
if (hideCssSelectors.length > 0) {
  cssRules.push(`
    ${hideCssSelectors.join(',\n')} {
      display: none !important;
    }
  `)
}
```
and the per-item toggle, verbatim:
```js
for (let change of changes) {
  change.$item.firstElementChild.classList.toggle('HiddenTweet', change.hideItem)
}
```

**The load-bearing detail:** the class goes on `$item.firstElementChild` — the child *inside* the timeline cell — not on the cell itself. The cell is the transform-positioned element (`div[style^="transform: translateY(...)"]`, confirmed independently by uBlock-style filter lists for x.com). Applying `display: none` to the transform-positioned cell is what risks leaving a blank gap, because the virtualizer computes offsets from measured cell heights. Collapsing the cell's *content* lets X's own measurement observe a zero-height cell and close the gap.

This **refines D-06**, which says "on the cell wrapper." The planner should read D-06's intent (extension-owned attribute + `display:none`, never remove or reparent) as satisfied, with the target narrowed one level in. Spike S4 verifies the gap actually collapses; if it does not, the fallback is to also zero the cell's own height.

Also take `'.HiddenTweet + [role="separator"]'` — hiding the item leaves its sibling separator behind, which is exactly the "visible reminder of the ad" D-05 forbids.

**Promoted detection** `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:2275, 5641-5643]`:
```js
PROMOTED_TWEET_CONTAINER: '[data-testid="placementTracking"]',
```
```js
function getTweetType($tweet, checkSocialContext = false) {
  if ($tweet.closest(Selectors.PROMOTED_TWEET_CONTAINER)) {
    return 'PROMOTED_TWEET'
  }
```

### Standard Selectors (seed values for `lib/selectors.ts`)

All `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:2264-2281]`, quoted verbatim from the `Selectors` object:

```js
  PRIMARY_COLUMN: 'div[data-testid="primaryColumn"]',
  PROMOTED_TWEET_CONTAINER: '[data-testid="placementTracking"]',
  SIDEBAR: 'div[data-testid="sidebarColumn"]',
  TIMELINE: 'div[data-testid="primaryColumn"] section > h1 + div[aria-label] > div',
  TIMELINE_HEADING: 'h2[role="heading"]',
  TWEET: '[data-testid="tweet"]',
  MODAL_TIMELINE: 'section > h1 + div[aria-label] > div',
  MOBILE_TIMELINE_HEADER: 'div[data-testid="TopNavBar"]',
```

Plus `[data-testid="cellInnerDiv"]` for the timeline cell `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:7422 — `$showMoreLink.closest('[data-testid="cellInnerDiv"]')`]`.

Two operational notes from the same source, both worth encoding in the pipeline:
- *"If the initial timeline doesn't have a style attribute it's a placeholder"* `[VERIFIED: script.js:3739-3740]` — do not attach the observer to a placeholder; wait for the styled element.
- *"When a tab which has been viewed before is revisited, the timeline is replaced"* `[VERIFIED: script.js:3716-3717]` — the pipeline must observe the timeline's *parent* for replacement, not assume a stable timeline node for the life of the page.

### Anti-Patterns to Avoid

- **A `MutationObserver` per feature.** One shared pipeline; features subscribe (Anti-Pattern 1, `ARCHITECTURE.md`).
- **Mutating or reparenting React-owned nodes.** Append siblings and set your own `data-*` attributes only (C-13, Anti-Pattern 2).
- **Patching `history` from the isolated world.** It silently only intercepts your own calls. Superseded correction to `ARCHITECTURE.md` Pattern 4.
- **`subtree: true` on the timeline observer.** Fires on every internal React re-render inside every visible tweet. Use `childList` on the timeline itself.
- **Leaving the observer attached across a route change.** X replaces the timeline node; the old observer keeps a detached node alive and the new timeline goes unobserved (FOUND-09).
- **A Radix `*.Portal` without `container`.** Renders into `document.body`, outside the shadow root, unstyled (C-8).
- **`@font-face` declared inside the shadow root.** Ignored in Chromium — see Font section.
- **A top-level `vite.config.ts` or a `tailwind.config.js`.** Silently ignored or double-applied (C-2, C-3).
- **A three-value theme enum.** Dim is gone from x.com web; derive from a value with an `unknown` branch.
- **`window.postMessage` for the bridge channel.** Use `CustomEvent` on the injected `<script>` node so the payload is not broadcast to every listener on `window`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MV3 manifest, entrypoint wiring, HMR, zip | Hand-written `manifest.json` + custom Vite | WXT (`defineContentScript`, `defineUnlistedScript`, `defineBackground`) | WXT generates the manifest from code, handles `web_accessible_resources`, and gives a tested dev/build/zip pipeline |
| Shadow root creation + CSS injection into it | `attachShadow` + manual `<style>` cloning | `createShadowRootUi` + `cssInjectionMode: 'ui'` | WXT extracts the entrypoint's CSS at build time and injects it inside the shadow root; hand-rolling this is how you end up with unstyled portals |
| Typed storage with defaults + migrations | Raw `chrome.storage.local.get/set` + ad-hoc version checks | `storage.defineItem({ fallback, version, migrations })` | Types, defaults, `watch()`, and retroactive versioning are all provided; unversioned items are auto-treated as v1 |
| Cross-context settings fan-out | `chrome.tabs.query` + `sendMessage` loop from the background | `storage.onChanged` / `item.watch()` | Works with 0..N tabs, needs no `tabs` permission (which would widen the CWS permission story) |
| Accessible toggle, tooltip, menu, focus management | Custom switch/tooltip components | Radix via shadcn (`Switch`, `Tooltip`, `Popover`) | Keyboard nav, ARIA, and focus semantics are the hard part and are the whole reason C-1 names Radix |
| `rem` → `px` conversion for shadow UIs | Manual `px` authoring or a custom `@theme` scale | `postcss-rem-to-responsive-pixel` | WXT's own FAQ names this plugin for this exact bug |
| Icon size generation | Hand-exported PNGs | `@wxt-dev/auto-icons` | One source image → every required size; removes a Phase 6 rejection class |
| "Did X's markup change?" detection | Sentry/telemetry/remote reporting | Local per-feature miss counters in `local:diagnostics` | Remote reporting would trigger CWS undisclosed-data-collection review for zero benefit on a local-only tool |
| Shadow-DOM-safe outside-click detection | Re-implementing dismissable layers | Radix `onInteractOutside` / `onPointerDownOutside` + `event.composedPath()` | `composedPath()` is the only event API that traverses shadow boundaries correctly; Radix's default checks `document.activeElement`, which reports only the host |

**Key insight:** in this domain the custom solutions that look cheapest — a per-feature observer, an inline `querySelector`, a bespoke theme enum, a hand-rolled shadow root — are precisely the ones that fail invisibly when X ships a change or the browser recycles a node. Every item above trades a small amount of setup for a failure that is *loud and localized* instead of silent and global.

---

## Common Pitfalls

### Pitfall 1: The isolated-world history patch that silently never fires

**What goes wrong:** The route watcher is implemented as `history.pushState = wrap(history.pushState)` in the content script. It compiles, it runs, nothing ever fires, and the bug presents as "features stop working after navigating" — which reads like a pipeline bug, not a routing bug.
**Why it happens:** The DOM object is shared across worlds but the function wrapper is not. `[CITED: github.com/wxt-dev/wxt/issues/1567]`
**How to avoid:** Patch in the MAIN-world bridge (Pattern 2). Add a dev-mode log on every `bt:navigate` so a dead channel is obvious on the first manual click.
**Warning signs:** Everything works on a hard reload and nothing works after an in-app click.

### Pitfall 2: Long tasks from a `subtree: true` timeline observer

**What goes wrong:** Scroll stutters, DevTools shows 50ms+ tasks inside the MutationObserver callback.
**Why it happens:** `subtree: true` on the timeline fires for every internal mutation of every visible tweet — X's React tree re-renders constantly (relative timestamps, hover states, metric counts).
**How to avoid:** `{ childList: true }` on the timeline element only; iterate `timeline.children`; never call `getBoundingClientRect`/`offsetHeight` in the callback.
**Warning signs:** Callback invocation count that scales with time-on-page rather than with cells added.

### Pitfall 3: Stale UI on a recycled node

**What goes wrong:** After fast scrolling, a normal tweet is hidden, or an ad is visible.
**Why it happens:** The virtualizer reuses a cell's DOM node for a different tweet. A boolean "processed" mark says "done" for content that changed underneath it.
**How to avoid:** Mark with the tweet ID (`data-bt-seen="<id>"`), compare before skipping, and re-evaluate when the ID differs. The `WeakSet` is a fast path, not the source of truth.
**Warning signs:** Wrong-state cells that appear only after scrolling back up, never on first render.

### Pitfall 4: The blank gap where the ad used to be

**What goes wrong:** The promoted tweet is gone, but a dead band of whitespace remains — which is precisely the "visible reminder of the ad" D-05 rules out.
**Why it happens:** Cells are transform-positioned from measured heights; hiding the positioned element itself can leave its slot allocated.
**How to avoid:** Hide the cell's `firstElementChild` (Pattern 9), and hide the adjacent `[role="separator"]` too. Spike S4 confirms; fallback is to additionally zero the cell's height.
**Warning signs:** Gaps that appear only in the middle of the feed, never at the top.

### Pitfall 5: The Radix portal that renders naked on top of x.com

**What goes wrong:** A popover opens as unstyled white text in the page's default font, floating over the timeline.
**Why it happens:** `Portal`'s `container` defaults to `document.body`, outside the shadow root where the Tailwind `<style>` lives.
**How to avoid:** The provider in Pattern 5, applied through a single wrapper component so no individual component has to remember (C-8).
**Warning signs:** Correct inside a Storybook/standalone page, broken only inside the content script.

### Pitfall 6: The popup that has never heard of Chirp

**What goes wrong:** The injected shadow-root UI renders in Chirp, the popup does not, and "feels native" breaks at exactly the surface the user looks at most.
**Why it happens:** X's `@font-face` lives in x.com's document. The popup is a different document on a different origin, and `@font-face` declared *inside* a shadow root is ignored in Chromium anyway `[CITED: issues.chromium.org/issues/41085401]`.
**How to avoid:** See the Font section — resolve it as an explicit decision, not an oversight.
**Warning signs:** Screenshots where the popup and the injected UI have visibly different letterforms.

### Pitfall 7: The bridge `<script>` that removed itself

**What goes wrong:** The bridge injects, patches successfully, and no event ever reaches the isolated world.
**Why it happens:** WXT's comms channel is the `<script>` element. `injectScript` without `keepInDom: true`, or an `onload` handler that removes the node, destroys the channel while leaving the patches in place — so it looks like the patches failed.
**How to avoid:** `injectScript('/bridge.js', { keepInDom: true })`, and attach the isolated-world listener via `modifyScript(script)` **before** the script loads, or the first events are missed.
**Warning signs:** MAIN-world console logs prove the patch ran; the isolated world sees nothing.

### Pitfall 8: `document_start` and a null `document.body`

**What goes wrong:** Theme probing and stylesheet injection throw on load because `document.body` is `null`.
**Why it happens:** Hiding ads and matching the theme without a flash both argue for `runAt: 'document_start'`, at which point only `documentElement` exists. The reference implementation appends its early stylesheet to `document.documentElement` for exactly this reason `[VERIFIED: control-panel-for-twitter@4.24.1 content.js — `document.documentElement.append($style)`]`.
**How to avoid:** Inject the hide stylesheet into `document.documentElement` immediately; defer everything body-dependent behind an element-wait helper.
**Warning signs:** Errors only on hard reload, never on HMR.

---

## Code Examples

### 1. `wxt.config.ts` — the only build config (C-2, C-3, C-11)

```ts
// Pattern from the official WXT shadcn example:
// github.com/wxt-dev/examples examples/react-shadcn/wxt.config.ts
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Better Twitter!',
    permissions: ['storage'],            // storage ONLY — see permission note below
    action: { default_popup: 'popup.html' },
    web_accessible_resources: [
      {
        resources: ['bridge.js'],
        matches: ['*://x.com/*', '*://twitter.com/*'],   // scoped, never <all_urls>
      },
    ],
  },
});
```

**Permission note (locks STORE-01 early).** A manifest-declared content script needs **no `host_permissions`** to read and modify the pages it matches — `host_permissions` buys cross-origin fetch from the background, `scripting.executeScript`, and cookie access, none of which this phase uses. `[VERIFIED: control-panel-for-twitter manifest.mv3.json — a shipping, CWS-listed extension of far larger scope declares exactly `"permissions": ["storage"]` and no `host_permissions` key at all, with content scripts matched via `content_scripts[].matches`]`. Phase 1 should therefore ship `permissions: ["storage"]` and nothing else. Every later phase must justify any addition against the single-purpose narrative.

### 2. `assets/tailwind.css` — shared by popup and shadow UIs (C-3, C-7)

```css
@import "tailwindcss";

@theme {
  /* X-derived tokens; populated from the theme probe, not hardcoded per scheme */
  --color-bt-bg: var(--bt-bg, #fff);
  --color-bt-fg: var(--bt-fg, #0f1419);
  --color-bt-accent: var(--bt-accent, rgb(29, 155, 240));
}

/* Shadow-root reset MUST include :host, not only :root (isolated-element v3) */
:root, :host {
  color-scheme: light dark;
}
```

`rgb(29, 155, 240)` is X's brand blue `[VERIFIED: control-panel-for-twitter@4.24.1 content.js — `const twitterBlue = 'rgb(29, 155, 240)'`]`.

### 3. `postcss.config.js` (C-6)

```js
// Source: wxt.dev/guide/resources/faq — "Content Script UI Styling Issues"
import remToPx from 'postcss-rem-to-responsive-pixel';

export default {
  plugins: [
    remToPx({ rootValue: 16, propList: ['*'], transformUnit: 'px' }),
  ],
};
```

### 4. MAIN-world bridge: fetch + XHR + history in one file (FOUND-05, FOUND-03)

```ts
// entrypoints/bridge.ts — defineUnlistedScript. NO chrome.* here, NO feature imports.
export default defineUnlistedScript(() => {
  const script = document.currentScript;
  const emit = (type: string, detail: unknown) =>
    script?.dispatchEvent(new CustomEvent(type, { detail }));

  // --- GraphQL over fetch -------------------------------------------------
  const nativeFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await nativeFetch.apply(this, args);
    try {
      const url = String(args[0] instanceof Request ? args[0].url : args[0]);
      if (url.includes('/i/api/graphql/')) {
        res.clone().json().then(
          (data) => emit('bt:graphql', { url, data }),
          () => {},
        );
      }
    } catch { /* never let observation break the page */ }
    return res;
  };

  // --- GraphQL over XHR (X uses this too — see note) ----------------------
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    (this as any)._btUrl = String(url);
    return nativeOpen.apply(this, [method, url, ...rest] as any);
  };
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    const url = (this as any)._btUrl as string | undefined;
    if (url?.includes('/i/api/graphql/')) {
      this.addEventListener('load', () => {
        try { emit('bt:graphql', { url, data: JSON.parse(this.responseText) }); }
        catch { /* non-JSON or cross-origin opaque */ }
      }, { once: true });
    }
    return nativeSend.apply(this, [body] as any);
  };

  // --- SPA navigation (must be MAIN world, see Pattern 2) -----------------
  const announce = () => emit('bt:navigate', { url: location.href });
  for (const name of ['pushState', 'replaceState'] as const) {
    const native = history[name];
    history[name] = function (...args: any[]) {
      const r = native.apply(this, args as any);
      announce();
      return r;
    };
  }
  window.addEventListener('popstate', announce);
});
```

**Why the XHR half is not optional** `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3-92]` — that file's first executable statements are `const XMLHttpRequest_open = XMLHttpRequest.prototype.open` and `const XMLHttpRequest_send = XMLHttpRequest.prototype.send`, used to intercept `'/TweetDetail?'` (GET, `variables` in the query string) and `'/HomeLatestTimeline'` (both GET with a `variables` query param and POST with a JSON body containing `variables`). A real GraphQL URL from the same file, verbatim: `` `/i/api/graphql/XRqGa7EeokUU5kppkh13EA/AboutAccountQuery?variables=${encodeURIComponent(JSON.stringify({screenName}))}` `` `[VERIFIED: script.js:2789]`. So the operation shape Spike S2 should expect is `/i/api/graphql/<opaque-doc-id>/<OperationName>` with `variables` as URL-encoded JSON (GET) or in a JSON body (POST), and live operation names include `HomeLatestTimeline`, `TweetDetail`, and `AboutAccountQuery`.

### 5. Isolated-world bridge client (FOUND-05)

```ts
// entrypoints/x.content/bridge-client.ts
const { script } = await injectScript('/bridge.js', {
  keepInDom: true,                       // the <script> node IS the channel — Pitfall 7
  modifyScript(script) {                 // attach BEFORE load or the first events are lost
    script.addEventListener('bt:graphql', (e) => {
      if (e instanceof CustomEvent) recordOperationShape(e.detail);
    });
    script.addEventListener('bt:navigate', (e) => {
      if (e instanceof CustomEvent) onRouteChange(e.detail.url);
    });
  },
});
```

### 6. Shadow-root portal provider (FOUND-06, C-8)

```tsx
// components/shadow-portal.tsx
import { createContext, useContext, type ReactNode } from 'react';

const ShadowRootContext = createContext<ShadowRoot | null>(null);
export const ShadowRootProvider = ShadowRootContext.Provider;
export const usePortalContainer = () =>
  (useContext(ShadowRootContext) as unknown as HTMLElement | null) ?? undefined;
```

```tsx
// any component rendering a Radix floating primitive
import { Popover as PopoverPrimitive } from 'radix-ui';
import { usePortalContainer } from '@/components/shadow-portal';

export function BtPopover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const container = usePortalContainer();          // ui.shadow, NOT ui.shadowHost
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          // Radix's default outside-click check reasons about document.activeElement,
          // which only ever reports the shadow HOST from outside the boundary.
          onPointerDownOutside={(e) => {
            const path = (e.detail.originalEvent as PointerEvent).composedPath();
            if (container && path.includes(container)) e.preventDefault();
          }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
```

```tsx
// entrypoints/probe.content/index.tsx — DEV ONLY, excluded from production (D-02)
export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  exclude: ['production'],          // never ships — proves Spike S3 only
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'bt-probe',
      position: 'inline',
      anchor: 'body',
      isolateEvents: ['keydown', 'pointerdown'],
      onMount(container) {
        const root = ReactDOM.createRoot(container.appendChild(document.createElement('div')));
        root.render(
          <ShadowRootProvider value={ui.shadow}>
            <ProbePanel />
          </ShadowRootProvider>,
        );
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
  },
});
```

### 7. Custom font into a shadow-root UI — official WXT pattern

```tsx
// Source: github.com/wxt-dev/examples examples/react-content-ui-custom-font/entrypoints/content/index.tsx
onMount: (container) => {
  // Load custom font. Don't forget add font to web accessible resources in wxt.config.ts
  const fontUrl = browser.runtime.getURL("/fonts/jbmono.ttf")
  const fontStyle = document.createElement("style")
  fontStyle.textContent = `
      @font-face {
        font-family: 'JB Mono';
        src: url('${fontUrl}') format('truetype');
        font-weight: 400;
        font-style: normal;
      }
  `
  // append style element to head
  document.head.appendChild(fontStyle)
  // ...
}
```

Note what the official example does: the `@font-face` goes to **`document.head`**, not into the shadow root. That is the documented workaround for Chromium ignoring `@font-face` inside a shadow root, and it is the pattern to copy if a bundled font is ever needed.

---

## X's Chirp Font (UI-04)

**In the content-script shadow root: free.** x.com already declares `@font-face` for Chirp at document level, and document-level font faces do reach shadow roots (only `@font-face` declared *inside* a shadow root is ignored `[CITED: issues.chromium.org/issues/41085401]`). Setting `font-family: "TwitterChirp", <fallback stack>` inside the shadow root resolves correctly with no extra work.

The exact names, `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:4083-4084, 5245, 4156]`, verbatim:
```js
        rule.style.fontFamily?.includes('TwitterChirp') &&
        !rule.style.fontFamily.includes('TwitterChirpExtendedHeavy')
```
```js
    fontFamilyRule.style.fontFamily = `"TwitterChirp", ${fontFamilyRule.style.fontFamily}`
```
```css
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```
So: the family is `TwitterChirp` (with `TwitterChirpExtendedHeavy` as the display weight), and X's own fallback stack is the `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` line above.

**In the popup: an actual decision, not an oversight.** The popup is a separate document on the extension origin and has no access to X's font faces. Three options:

| Option | How | Cost |
|--------|-----|------|
| **A — cache X's live font URL** (recommended) | The content script reads the Chirp `@font-face` `src` URL out of `document.fonts` / the page stylesheets, caches it to `local:xTheme`; the popup writes its own `@font-face` with that URL | One request to `abs.twimg.com` when the popup opens. Self-healing when X rotates the hashed asset URL. `abs.twimg.com` is X's own CDN, so this stays inside "no network calls beyond X itself" (C-10) — but it is a network call the popup makes, and that is worth the user's explicit sign-off |
| **B — bundle a Chirp file** | Ship a `.woff2` in `public/fonts/` and `@font-face` it (Pattern from Code Example 7) | Chirp is proprietary, commissioned by Twitter from Grilli Type. Redistributing it in a Chrome Web Store package is a licensing exposure with no upside. **Not recommended** |
| **C — fallback stack only** | `font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | Zero cost, zero risk, and resolves to real Chirp for anyone who has it installed locally. Partially misses UI-04 for everyone else |

**Recommendation:** implement C unconditionally as the floor, then layer A on top. If A is rejected during planning, C alone still ships a popup that matches X's *fallback* rendering exactly, which is a defensible reading of UI-04. **This needs user confirmation** — it is the one place in this phase where "feels native" trades against a network request.

---

## Popup Shell (UI-01 … UI-05)

- `action.default_popup` points at the WXT `popup` entrypoint. `[CITED: developer.chrome.com/docs/extensions/reference/api/action]` — *"The popup's size must be between 25x25 and 800x600 pixels."* Recommended: a fixed `360 × 480`, three-column tile grid. Fixed dimensions matter because D-03's in-place view swap looks broken if the popup resizes between grid and panel.
- **No shadow root, no portal container.** The popup is its own document; Radix `Tooltip` (UI-05) and any menu portal to the popup's own `body` and work out of the box. FOUND-06's provider is not used here — do not add it "for consistency," it is dead indirection.
- **Registry-driven grid (D-01).** `lib/registry.ts` exports categories and features; the grid maps over categories that have ≥1 registered feature. Phase 1 registers `{ category: 'timeline', feature: 'hidePromotedTweets', default: true }` (D-12). The registry must be importable by both the popup and the content script so ids cannot drift.
- **Off-site behaviour (D-13).** The popup never queries the active tab and never requires one. Theme comes from `local:xTheme`; when absent or `unknown`, fall back to `prefers-color-scheme`.
- **Diagnostics row (D-09).** The popup reads `local:diagnostics` and renders an inline warning on any toggle whose feature id appears there.
- **Badge (D-09).** The content script messages the background on a diagnostics transition; the background calls `chrome.action.setBadgeText` / `setBadgeBackgroundColor`. `[CITED: developer.chrome.com/docs/extensions/reference/api/action]` — content scripts are not a listed calling context for `chrome.action`, so the hop through the background is mandatory, not stylistic.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| x.com serves three web themes (Light / Dim / Lights Out) | Two on web: Default and Lights Out | Feb 2026 | UI-03 is written against three. Detect by value with an `unknown` branch, never a 3-way enum |
| Patch `history.pushState` from the content script | Patch it in a MAIN-world injected script | Always true; documented by WXT in issue #1567 | Supersedes `ARCHITECTURE.md` Pattern 4's stated rationale |
| Individual `@radix-ui/react-*` packages | Unified `radix-ui` package, `shadcn init --base radix` | Feb 2026 shadcn change | Already captured in C-4 |
| Tailwind v3 JS config | Tailwind v4 CSS-first `@theme` + `@tailwindcss/vite` | Tailwind 4.x | Already captured in C-3 |
| `postcss-rem-to-responsive-pixel` `^6.x` | `7.0.5` | by 2026-07-26 | CLAUDE.md records `^6.x`; use `^7` |
| `nanoid` `^5.x` | `6.0.1` | by 2026-08-03 | CLAUDE.md records `^5.x`; use `^6` if used at all |
| TypeScript 5.x is `latest` | `latest` is now `7.0.2` | Jul 2026 GA | C-5 pins `~5.7`; an unpinned `npm i typescript` now pulls TS7 |
| `twitter/twemoji` | `@twemoji/*` (jdecked fork) | 2023 | Not Phase 1 — Phase 5 |

**Deprecated / outdated in this project's own docs:**
- `ARCHITECTURE.md` § "Architectural Patterns 4" — the claim that an isolated-world `history` patch works. Superseded.
- `ARCHITECTURE.md` § "Architectural Patterns 3" — prescribes rAF-debounced `subtree: true` + per-node `IntersectionObserver`. Still correct in spirit (dedup, no layout reads); the observer shape is more expensive than a production implementation needs. Use Pattern 3 here.
- `ARCHITECTURE.md` / `PITFALLS.md` media-downloader and undo-toast sections — features cut; ignore (already flagged in CONTEXT.md).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | An isolated-world `window.navigation` fires `navigate` for page-initiated navigations | Pattern 2 / Spike S1 | None to the plan — the recommended design does not depend on it. Only a simplification is lost |
| A2 | Hiding the cell's `firstElementChild` lets X's virtualizer collapse the slot with no residual gap | Pattern 9 / Spike S4 | D-05 is violated (visible gap where the ad was). Fallback: also zero the cell's height. Medium — affects the phase's headline demo |
| A3 | Three consecutive zero-match ticks is the right miss threshold (D-11) | Pattern 4 | Too low → false "feature broken" warnings; too high → slow detection. Cheap to tune; no structural impact |
| A4 | `abs.twimg.com` Chirp asset URLs are discoverable from `document.fonts` / page stylesheets at runtime | Font section, Option A | Option A is not implementable; falls back to Option C. Low |
| A5 | X's GraphQL responses are same-origin JSON readable from a `clone()`/`responseText` in the page context | Pattern 1 | The bridge captures nothing useful; Spike S2 would report empty. Low — the reference implementation reads `variables` off requests successfully, but response *bodies* were not confirmed readable this pass |
| A6 | X still sets the theme as an inline `style` on `<body>` for all cohorts | Pattern 8 | Theme probe returns `unknown`; popup falls back to `prefers-color-scheme` (D-14 already covers this). Low — degradation is designed in |
| A7 | A single shared content script matching both `x.com` and `twitter.com` is sufficient (twitter.com redirects to x.com) | Manifest | A `twitter.com` visit gets no extension. Low — match pattern is already declared for both |
| A8 | `exclude: ['production']` on a WXT content-script entrypoint keeps the probe out of `wxt build`/`wxt zip` output | Code Example 6 | A dev-only surface ships to the store (violates D-02 and invites review questions). **Verify by grepping the built output** before Phase 6 |

---

## Open Questions

The roadmap names three spikes; a fourth emerged from this research. All four must be answered against live x.com, not assumed.

### S1 — Does the isolated world see `window.navigation`'s `navigate` event? (FOUND-03)
- **What we know:** An isolated-world `history` patch definitively does not see page navigations `[CITED: wxt issue #1567]`. `wxt:locationchange` is a 1s poll. `popstate` does fire in the isolated world (DOM events are shared) but covers back/forward only. The `<title>` observer is proven on x.com.
- **What's unclear:** Whether each world's `navigation` object is a separate wrapper over the same underlying browsing context (events propagate) or a genuinely separate instance (they do not). MDN says *"each window object having its own corresponding navigation instance"*, which is suggestive but not dispositive for extension worlds.
- **Recommendation:** Do **not** block on this. Build the MAIN-world history patch (Pattern 2) as primary — the bridge ships this phase regardless. The spike is a 5-line probe: in the content script, `window.navigation?.addEventListener('navigate', e => console.log('[bt]', e.destination.url))`, then click Home → Profile → a tweet. If it logs, record it as a future simplification; if not, nothing changes.

### S2 — What do X's live GraphQL operations actually look like? (FOUND-05)
- **What we know, already:** URL shape `/i/api/graphql/<doc_id>/<OperationName>`, `variables` as URL-encoded JSON on GET and in a JSON body on POST; live operation names include `HomeLatestTimeline`, `TweetDetail`, `AboutAccountQuery` `[VERIFIED: control-panel-for-twitter@4.24.1 script.js:3-92, 2789]`. X uses **both** `fetch` and `XMLHttpRequest`.
- **What's unclear:** The response envelope (`data.*.instructions[].entries[]` shape), the exact bookmark and home-timeline operation names in the current cohort, and whether response bodies are readable from the patch point (A5).
- **Recommendation:** The bridge should log `{ method, url, opName, doc_id, topLevelResponseKeys, entryCount }` — not full bodies — to a dev-only console channel, and the spike output is a committed markdown note under `.planning/phases/01-.../spikes/`. Phases 3-4 consume that note. Do not persist captured tweet content to storage in this phase; that would be data collection with no shipped feature behind it (CWS disclosure risk).

### S3 — Do Radix portals / focus trap / scroll lock survive the shadow root against real X overlays? (FOUND-06)
- **What we know:** `container` is the documented fix for portal placement. Three open upstream issues (`#3353`, `#3483`, `#2055`) describe focus-trap, scroll-lock and outside-click breakage inside shadow roots, concentrated in `Dialog`.
- **What's unclear:** Whether `Popover`/`DropdownMenu`/`Tooltip` — the primitives this project actually needs — are affected, and how they behave with X's own compose modal / image lightbox open.
- **Recommendation:** The dev-only probe entrypoint (Code Example 6). Test matrix: open the probe popover with (a) nothing else open, (b) X's compose modal open, (c) the image lightbox open, (d) an X toast visible. For each: is it styled, does Tab stay inside, does outside-click dismiss, does the timeline scroll behind it. Record the answer as the inherited pattern for Phases 4 and 5.

### S4 — Does hiding the cell's inner wrapper collapse the virtualizer's slot? (CLEAN-01, new)
- **What we know:** The reference implementation toggles its hide class on `$item.firstElementChild`, and its hide rule also targets `.HiddenTweet + [role="separator"]`. Cells are transform-positioned.
- **What's unclear:** Whether any residual gap remains, and whether it differs at the top of the feed versus mid-scroll.
- **Recommendation:** Scroll a feed with ads until three are hidden; screenshot; scroll away and back. If a gap persists, add `height: 0 !important; overflow: hidden;` on the cell itself as a second rule. This is the spike most directly tied to a success criterion (D-05) and should be run first.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | WXT build/dev | ✓ | v24.19.0 | — |
| pnpm | package install | ✓ | 9.15.4 | npm (see note) |
| bun | package install | ✓ | 1.4.0 | — |
| npm (real binary) | package install | ✓ | at `C:\Program Files\nodejs\npm.cmd` | — |
| git | version control | ✓ | 2.47.1.windows.1 | — |
| npm registry reachability | version checks, install | ✓ | verified by direct `registry.npmjs.org` fetch | — |
| Google Chrome | loading the unpacked extension, all four spikes | not observed | — | Any Chromium (Edge, Brave); Playwright can download its own Chromium for E2E |

**Shell note the planner must know:** in this environment `npm` is **aliased to `bun`** (`alias npm='bun'`), so `npm view <pkg> version` fails with `error: Script not found "view"`. Any plan step that shells out to `npm view`/`npm ls` should call the real binary at `C:\Program Files\nodejs\npm.cmd`, or query `registry.npmjs.org` directly, or use `bun`'s own equivalents.

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** Chrome was not found at the default Windows install paths from this shell, and the probe may have been blocked by sandbox restrictions rather than reflecting a genuine absence — this is *no observation*, not a finding of absence. Confirm manually before the first `wxt dev` run; any Chromium build accepts `--load-extension`, and `@playwright/test` will install its own Chromium for the E2E harness.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`. This is a local-only browser extension with no backend, no accounts, and no authenticated endpoints of its own, so most ASVS categories are structurally inapplicable — but the ones that do apply are load-bearing, because the extension runs inside a logged-in x.com session.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | The extension authenticates nothing; it never reads or transmits X session tokens |
| V3 Session Management | no | No sessions of its own. **Constraint:** the bridge must never read, log, or persist cookies, CSRF headers, or auth headers it can see on intercepted requests |
| V4 Access Control | no | No multi-user model |
| V5 Input Validation | **yes** | Everything from x.com's DOM and from intercepted GraphQL JSON is untrusted input. Never `innerHTML`/`outerHTML` with page-derived strings — use `textContent` or React. Validate captured JSON shape before use and fail closed. Attribute values read off X's DOM must never be interpolated into a selector string |
| V6 Cryptography | no | Nothing is encrypted or hashed. Do not add crypto for a local-only settings blob |
| V7 Error Handling & Logging | **yes** | Selector misses and bridge failures must be logged locally only (`local:diagnostics`). No remote reporting — that becomes undisclosed data collection under CWS policy |
| V12 Files & Resources | **yes** | `web_accessible_resources` must be scoped to `matches: ["*://x.com/*","*://twitter.com/*"]`. A `<all_urls>` WAR entry would let any site load the bridge script and fingerprint the install |
| V14 Configuration | **yes** | MV3 CSP: no `eval`, no `new Function`, no remote script (C-12). Audit `.output/` before any zip |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Page JS tampering with the MAIN-world bridge | Tampering | Keep the bridge to observation only; it accepts no inbound commands and holds no secrets. All decisions and all storage writes happen in the isolated world |
| CustomEvent payload leaking to other extensions / page scripts | Information Disclosure | Dispatch on the injected `<script>` node, never `window.postMessage` |
| Over-broad `web_accessible_resources` enabling extension fingerprinting | Information Disclosure | Scoped `matches` on every WAR entry (Code Example 1) |
| DOM-derived string injected as HTML | Tampering / XSS-equivalent | React rendering or `textContent` only; never `innerHTML` with page data |
| DOM-derived string interpolated into a selector | Tampering | Selector strings are static constants in `lib/selectors.ts`; page values are only ever *compared*, never concatenated into a query |
| Bundler leaving `eval`-based dev code in the production build | Elevation / policy rejection | `grep -RE "eval\(|new Function\(" .output/` as a build gate from this phase onward (C-12) |
| Silent local capture of tweet content with no shipped feature | Policy (undisclosed collection) | Phase 1's bridge logs operation *shapes*, never bodies, and persists nothing (see S2) |
| Permission creep across phases | Policy (single purpose) | Lock `permissions: ["storage"]` and the one-sentence purpose narrative now; every later phase justifies additions against it |

**Single-purpose narrative to lock in this phase** (per `PITFALLS.md` Pitfall 5, which explicitly says the *decision* belongs to the foundation phase): *"Better Twitter! is a personalization layer that gives a user control over how their own X/Twitter timeline looks and behaves in their own browser."* Every feature and every permission added in Phases 2-6 must be justifiable in one clause against that sentence.

---

## Sources

### Primary (HIGH confidence)

- `insin/control-panel-for-twitter` v4.24.1, `master`, MIT, last pushed 2026-09-06 — `script.js`, `content.js`, `manifest.mv3.json` downloaded and read this session. Source of: `[data-testid="placementTracking"]` (2275), `getTweetType` promoted check (5641-5643), `getColorScheme` (5597-5602), `observeBodyBackgroundColor` (3033-3064), `observeElement` + named observer registries (2415, 2458, 2932-2973), `observeTimeline` / placeholder + tab-replacement notes (3686-3745), `.HiddenTweet` toggle on `firstElementChild` (6294-6305), hide stylesheet (4165-4171, 5179-5185), XHR GraphQL interception (3-92), GraphQL URL shape (2789), `<title>`-based navigation assumption (3412-3438, 7746-7748), Chirp family names and X's fallback stack (4083-4084, 4156, 5245), minimal manifest permissions.
- `/llmstxt/wxt_dev_llms_txt` (Context7) — `createShadowRootUi` signature and `ShadowRootContentScriptUiOptions`, `ContentScriptAnchoredOptions`, `ShadowRootContentScriptUi` properties, `storage.defineItem` / `watch` / migrations, `injectScript` / `defineUnlistedScript` / `web_accessible_resources`, `defineContentScript` full option list.
- `/websites/wxt_dev_guide` (Context7) — `ContentScriptContext` invalidation, `ctx.*` helpers, `wxt:locationchange`, SPA guidance.
- `/websites/radix-ui_primitives` (Context7) — `Portal` `container` prop (default `document.body`) on Popover, Tooltip, HoverCard, Dialog, DropdownMenu.
- `github.com/wxt-dev/examples` — `examples/react-shadcn/{wxt.config.ts,assets/tailwind.css,components.json,package.json}` and `examples/react-content-ui-custom-font/{entrypoints/content/index.tsx,wxt.config.ts}`, read from source this session.
- `registry.npmjs.org` — direct metadata fetch for every package in the Standard Stack, 2026-09-13.
- `gsd-tools query package-legitimacy check --ecosystem npm` — verdicts, download counts, repo URLs, postinstall signals.
- `developer.chrome.com/docs/extensions/reference/api/action` — badge APIs, `default_popup`, 25x25–800x600 popup size limit.
- `wxt.dev/guide/resources/faq` — rem→px problem statement and `postcss-rem-to-responsive-pixel` config; component-library `<style>`-escapes-shadow-root warning.

### Secondary (MEDIUM confidence)

- `github.com/wxt-dev/wxt/issues/1567` — `wxt:locationchange` is a 1s poll; isolated-world `history.pushState` is a different function from the main world's.
- `piunikaweb.com` (2026-02-12 / 2026-03-05), corroborated by Dexerto, Roboin and ALM Corp — X removed the Dim theme from the web app in February 2026. Independently corroborated by the absence of a Dim entry in `control-panel-for-twitter`'s `getColorScheme`.
- `issues.chromium.org/issues/41085401` and the surrounding Polymer/Lit/FullCalendar issue threads — `@font-face` declared inside a shadow root is ignored in Chromium; document-level faces reach shadow content.
- `robonxt/CleanYourTwitter` filter list and `pawelgrzybek.com` — independent corroboration of `[data-testid="placementTracking"]`, `[data-testid="cellInnerDiv"]`, and `div[style^="transform: translateY"]` cell positioning.
- MDN / Chrome for Developers Navigation API pages — `navigate` event semantics; per-window `navigation` instance. Silent on extension isolated worlds.
- Community reporting on `TwitterChirp` / `abs.twimg.com` woff2 delivery — corroborates but does not independently establish the asset URL shape (A4).

### Tertiary (LOW confidence)

- General reporting on X's dark-mode colour values (`#000000` vs `#192734`) — directionally consistent with the verified `rgb(0,0,0)` / `rgb(5,5,5)` mapping, not used as a primary basis for anything.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Standard stack + versions | HIGH | Every version fetched from `registry.npmjs.org` this session; wiring copied from official WXT examples read from source |
| Build configuration (Vite/Tailwind/PostCSS) | HIGH | Official example + official FAQ, both read directly |
| WXT APIs (shadow UI, storage, injectScript, ctx) | HIGH | Context7 against WXT's own docs |
| x.com selectors and theme detection | HIGH | Read from the shipping source of an actively maintained extension (pushed 7 days ago), cross-corroborated by independent filter lists |
| GraphQL transport and URL shape | MEDIUM-HIGH | Verified from the same source; response *body* readability at the patch point is unconfirmed (A5) |
| Route-watcher design | MEDIUM-HIGH | The disqualifying fact (isolated-world patch fails) is well-sourced; the recommended design is sound, but the Navigation API branch is unresolved (S1) |
| Radix behaviour inside a shadow root | MEDIUM | Portal API is HIGH; focus-trap/scroll-lock behaviour rests on open upstream issues and must be measured (S3) |
| Virtualizer gap collapse | MEDIUM | Inferred from the reference implementation's choice of hide target; not directly observed (S4, A2) |
| Popup Chirp strategy | MEDIUM | Font family name and fallback stack are HIGH; runtime URL discoverability is assumed (A4) and the option needs user sign-off |

**Research date:** 2026-09-13
**Valid until:** 2026-10-13 for the platform/stack findings (30 days). **7 days** for every x.com selector, theme colour, and GraphQL operation name — X ships unannounced markup and cohort changes, and all four spikes should be re-run if implementation starts more than a week from now.
