# Architecture Research

**Domain:** Chrome MV3 content-script-heavy extension that decorates a virtualized third-party React SPA (x.com)
**Researched:** 2026-09-13
**Confidence:** MEDIUM overall — HIGH for MV3/WXT platform mechanics (official Chrome + WXT docs, cross-checked), LOW-MEDIUM for X.com-specific DOM/virtualizer tactics (community precedent + reasoning from virtualization principles; must be verified against live x.com DOM during Phase 1 implementation since X's markup and virtualizer internals change without notice and were not directly inspected in this research pass)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PAGE CONTEXT (x.com's own JS, React tree, MAIN world)                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  MAIN-WORLD BRIDGE (unlisted script, injected via injectScript)     │  │
│  │  - patches window.fetch / XMLHttpRequest.prototype.open+send        │  │
│  │  - captures X GraphQL responses (timeline, bookmarks, tweet detail) │  │
│  │  - CustomEvent dispatch on injected <script> node → isolated world  │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼────────────────────────────────────────────┘
                                │ CustomEvent (script.dispatchEvent/addEventListener)
┌──────────────────────────────▼────────────────────────────────────────────┐
│  ISOLATED WORLD (content script — the extension's real home)             │
│  ┌────────────────┐ ┌──────────────────┐ ┌───────────────────────────┐  │
│  │ Route Watcher   │ │ Tweet Observation │ │ Decoration/Injection      │  │
│  │ (history patch  │ │ Pipeline          │ │ Layer                     │  │
│  │  or Navigation  │ │ (MutationObserver │ │ (action-bar buttons,      │  │
│  │  API)           │ │  + IntersectionOb │ │  popup menus, portals)    │  │
│  └────────┬────────┘ └────────┬──────────┘ └────────────┬──────────────┘  │
│           │                   │                          │                │
│  ┌────────▼───────────────────▼──────────────────────────▼─────────────┐ │
│  │                    Feature Controllers                               │ │
│  │  ad-stripper · clutter-hider · media-downloader · reaction-menu ·    │ │
│  │  bookmark-capture · feed-resurfacer · theme-applier                  │ │
│  └────────┬──────────────────────────────────────────────┬─────────────┘ │
│           │ chrome.storage.local (read/write)             │ chrome.runtime│
│  ┌────────▼────────────────────┐              ┌───────────▼────────────┐ │
│  │ Settings Store (reactive)    │              │ Message Client          │ │
│  │ storage.onChanged listener   │              │ (one-off requests to    │ │
│  └───────────────────────────────┘              │  service worker)       │ │
└──────────────────────────────────────────────────┴────────────┬───────────┘
                                                                  │
┌─────────────────────────────────────────────────────────────▼───────────┐
│  BACKGROUND SERVICE WORKER (event-driven, terminates when idle)          │
│  - chrome.downloads (media downloader)                                   │
│  - chrome.tabs orchestration (background-tab bookmark scrape fallback)   │
│  - chrome.alarms (periodic bookmark-scrape refresh, cache pruning)       │
│  - chrome.action / installed-state bookkeeping                          │
└──────────────────────────────────────────────┬───────────────────────────┘
                                                 │ chrome.storage.local
┌────────────────────────────────────────────────▼─────────────────────────┐
│  STORAGE (chrome.storage.local via WXT storage API)                      │
│  settings | bookmarks[] | folders[] | tags[] | themeCache | captureMeta  │
└──────────────────────────────────────────────┬───────────────────────────┘
                                                 │ storage.onChanged (broadcast)
┌────────────────────────────────────────────────▼─────────────────────────┐
│  POPUP (extension page — its own isolated context, reads/writes storage) │
│  icon-grid settings UI, theme picker, folder manager                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| MAIN-world bridge | Patch `fetch`/`XHR` in the page's own JS context to observe X's GraphQL responses (timeline entries, bookmark API, tweet-detail) without X seeing a modified stack trace from an "extension" origin | WXT `defineUnlistedScript` injected via `injectScript()` from the content script; talks back over `CustomEvent` on the `<script>` node |
| Route watcher | Detect x.com's client-side navigation (timeline ↔ profile ↔ bookmarks ↔ tweet detail) since the content script does not re-run | `window.navigation.addEventListener('navigate', …)` (Navigation API) as primary, with an isolated-world `history.pushState`/`replaceState` patch as the compatibility fallback |
| Tweet observation pipeline | Find every `[data-testid="tweet"]` cell as it is created by X's virtualizer, exactly once, and hand it to feature controllers | `MutationObserver` on a stable ancestor (the scroll region, not individual cells) + `IntersectionObserver` per discovered cell + `WeakSet`/marker attribute for de-dup |
| Decoration/injection layer | Insert extension UI (download button, reaction menu, bookmark-save button) into a tweet's action row without React clobbering it, and re-inject after recycling | Sibling DOM node appended next to (not inside) the React-owned action-bar children, mounted with a tiny React root or vanilla DOM, keyed by tweet ID |
| Feed injection (resurfacing) | Insert a synthetic "resurfaced bookmark" card into the timeline that X's virtualizer treats as native | Primary: splice a synthetic entry into the intercepted GraphQL response *before* X's own code renders it (MAIN-world bridge). Fallback: DOM sibling insertion between measured cells (fragile — documented as a known-fragile fallback, not the default) |
| Settings store | Single source of truth for all feature toggles, read on init, kept live via broadcast | `chrome.storage.local` + `storage.onChanged` listener in every content-script instance; WXT `storage` API wrapper |
| Feature controllers | Own one feature end-to-end (ad-stripper, clutter-hider, media-downloader, reaction-menu, bookmark-capture, feed-resurfacer, theme-applier); subscribe to settings, register with the observation pipeline, clean up on disable | Plain TS modules with `init()`/`teardown()`, registered against the shared pipeline rather than each running their own `MutationObserver` |
| Background service worker | The only place that can own `chrome.downloads`, orchestrate a hidden background tab, or run `chrome.alarms`-driven periodic work | WXT `background` entrypoint; event-driven, must persist all state to storage since it can be killed at any time |
| Popup | Renders the icon-grid settings UI; writes to `chrome.storage.local` and otherwise has no direct line to the content script | React + Radix/shadcn, WXT `popup` entrypoint |
| Theming layer | Detect X's live theme (Light/Dim/Lights Out) and layer a custom theme (Dracula/Nord/Matrix/accent) on top via CSS custom properties injected into the real page, not shadow DOM | A `<style>` tag with `:root{--bt-*: …}` custom properties injected at `document_start`, mapped from X's background-color signal, updated on theme change without reload |

## Recommended Project Structure

```
src/
├── entrypoints/
│   ├── content/                    # ISOLATED-world content script (main extension logic)
│   │   ├── index.content.ts        # bootstraps pipeline + feature controllers on load
│   │   ├── route-watcher.ts        # Navigation API / history patch → 'bt:route-change' event
│   │   ├── observation-pipeline.ts # MutationObserver + IntersectionObserver + WeakSet dedup
│   │   ├── bridge-client.ts        # listens for CustomEvents from the MAIN-world bridge
│   │   └── theme/
│   │       ├── detect-theme.ts     # read X's current Light/Dim/Lights-Out signal
│   │       └── apply-theme.ts      # inject/update the CSS-variable <style> tag
│   ├── main-world-bridge.ts        # defineUnlistedScript — fetch/XHR patch, runs in page JS context
│   ├── background.ts               # service worker: downloads, tabs, alarms
│   ├── popup/                      # settings UI (React + Radix)
│   └── options/                    # (if a full-page settings surface is ever needed)
├── features/                       # one folder per toggleable feature, each exporting init()/teardown()
│   ├── ad-stripper/
│   ├── clutter-hider/
│   ├── media-downloader/
│   ├── reaction-menu/
│   ├── bookmark-capture/
│   ├── bookmark-folders/           # UI injected onto x.com/bookmarks
│   └── feed-resurfacer/
├── lib/
│   ├── storage/                    # typed WXT storage schema + accessors
│   ├── selectors.ts                # centralized data-testid selector constants
│   ├── dom-mark.ts                 # WeakSet + data-bt-processed marker helpers
│   └── messaging.ts                # typed wrappers over chrome.runtime + storage.onChanged
└── components/                     # shared Radix/shadcn UI primitives (used by popup + injected menus)
```

### Structure Rationale

- **One observation pipeline, many feature controllers.** X's DOM is expensive to query repeatedly; every feature that needs "run this when a tweet appears" subscribes to a single shared `MutationObserver`/`IntersectionObserver` pair instead of instantiating its own — this is both a performance requirement and the natural place to put the de-dup `WeakSet`.
- **`lib/selectors.ts` is a single point of change.** Since the project's own constraint is "data-testid only, no class names," every feature imports selector constants from one file so a future X markup change is a one-file fix, not a grep-and-pray across the codebase.
- **`main-world-bridge.ts` is deliberately tiny and isolated from feature logic.** It only patches fetch/XHR and re-emits raw responses as events; it must never import feature code, because MAIN-world code has no `chrome.*` API access and any accidental dependency would silently break at runtime with no isolated-world safety net.
- **Feature folders mirror the settings schema.** Each feature's `init()` is gated by a `chrome.storage.local` key of the same name, making the "toggle in popup → thing happens/stops" contract trivial to trace end-to-end.

## Architectural Patterns

### Pattern 1: Response-splice feed injection (not DOM injection)

**What:** Rather than inserting a real DOM node into X's live-rendered timeline, splice a synthetic "entry" object into the intercepted GraphQL/XHR response for the timeline *before* X's own React code consumes it. X's virtualizer then renders your resurfaced-bookmark card exactly as if it were a native timeline item — correct height measurement, correct virtualization slot, no fighting with React's reconciliation.
**When to use:** Any time you need to add an item to a feed you don't own (the timeline, not the bookmarks page you fully control).
**Trade-offs:** Requires the MAIN-world fetch/XHR bridge to already be in place (dependency on Pattern 4 below) and requires reverse-engineering the shape of a single "entry" in X's GraphQL response (an `instructions`/`entries` array keyed by `entryId`), which is undocumented and can change. In exchange it sidesteps the entire class of "React deleted my injected DOM node" and "scroll position jumped" bugs that plague direct DOM insertion into virtualized lists.

```typescript
// MAIN-world bridge (simplified)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const url = args[0]?.toString?.() ?? '';
  if (!url.includes('/graphql/') || !url.includes('HomeTimeline')) return response;

  const cloned = response.clone();
  const json = await cloned.json();
  injectResurfacedEntry(json); // mutate in place, matching X's own entry shape
  return new Response(JSON.stringify(json), response);
};
```

### Pattern 2: Sibling-portal decoration (never mutate React's own children)

**What:** To add a button to a tweet's action row, never reparent or edit the elements React renders (`role="group"` action bar children). Instead, append one extra sibling `<div data-bt-injected>` as the last child of that row. React's reconciliation diffs its own known children by key/position; an appended trailing sibling it didn't create is generally left alone on re-render *as long as it does not change the row's child count in a way X's own layout code reacts to* (verify against live X markup — flex-wrap / `justify-content: space-between` roles can shift on child-count change, so test visually).
**When to use:** Any per-tweet UI injection (download button, save-to-folder button, reaction trigger).
**Trade-offs:** Cheap and framework-agnostic, but must re-run on every "new tweet cell appeared" event from the observation pipeline, and must check the marker attribute first (idempotent re-injection) because X recycles the underlying DOM node for a different tweet during virtualization — the marker must be tied to the tweet's ID, not just "has this element been touched," or a recycled node will keep stale UI.

```typescript
function decorateTweet(tweetEl: HTMLElement, tweetId: string) {
  const actionRow = tweetEl.querySelector('[role="group"]');
  if (!actionRow) return;
  const existing = actionRow.querySelector('[data-bt-injected]');
  if (existing?.getAttribute('data-bt-tweet-id') === tweetId) return; // already correct
  existing?.remove(); // stale from a recycled node — remove before re-adding
  const btn = createDownloadButton(tweetId);
  btn.setAttribute('data-bt-injected', '');
  btn.setAttribute('data-bt-tweet-id', tweetId);
  actionRow.appendChild(btn);
}
```

### Pattern 3: Shared observation pipeline with WeakSet + attribute dual-marking

**What:** One `MutationObserver({childList: true, subtree: true})` on the scroll container (e.g. the element wrapping `[aria-label="Timeline: ..."]` / `[data-testid="primaryColumn"]`), debounced via `requestAnimationFrame` or a ~50ms timer since virtualized scrolling fires many mutation records per frame. On each batch, scan only added nodes for `[data-testid="tweet"]`, check a `WeakSet<Element>` (fast, per-session, auto-GC'd when the DOM node is discarded) *and* a `data-bt-processed="<tweetId>"` attribute (survives cases where the WeakSet reference is lost, e.g. hot-reload during dev) before dispatching to feature controllers. Pair with `IntersectionObserver` per discovered tweet to defer expensive work (image/video URL extraction) until the tweet is actually visible, and to get free cleanup — `unobserve` when the entry stops intersecting and the node is later removed.
**When to use:** This is the foundation every per-tweet feature sits on; build it before any feature controller.
**Trade-offs:** A single shared pipeline is more efficient than N observers but means a bug in the pipeline breaks every feature at once — worth isolating in its own module with its own tests before feature work starts.

```typescript
const processed = new WeakSet<Element>();
const observer = new MutationObserver((mutations) => {
  scheduleFlush(mutations); // rAF-debounced
});
function scheduleFlush(mutations: MutationRecord[]) {
  // collect addedNodes across the batch, then on next rAF:
  for (const node of collectedTweetCells) {
    if (processed.has(node)) continue;
    const tweetId = node.getAttribute('data-bt-processed') ?? extractTweetId(node);
    if (node.getAttribute('data-bt-processed') === tweetId) continue;
    processed.add(node);
    node.setAttribute('data-bt-processed', tweetId);
    emit('tweet-discovered', { node, tweetId });
  }
}
```

### Pattern 4: MAIN-world bridge for fetch/XHR, isolated-world for everything else

**What:** MV3 supports `world: "MAIN"` directly as a manifest `content_scripts[].world` value, and separately via `chrome.userScripts.register({world:"MAIN"})`. WXT exposes this as `defineContentScript({world:'MAIN'})`, but WXT's own guidance is to prefer `injectScript()` from an ISOLATED-world content script instead: it works across MV2/MV3 and all browsers, and — critically — the ISOLATED-world caller keeps a live communication channel to the injected script via `CustomEvent`s dispatched on the `<script>` element itself, so the MAIN-world code never needs (and never gets) `chrome.*` API access while the ISOLATED side still has it.
**When to use:** Only for the fetch/XHR patch (needs the page's real, unshimmed global functions to intercept calls X's own bundle makes) and any other case where the page must not be able to tell an extension is present. Route-change detection does *not* need MAIN world — patching `history.pushState`/`replaceState` from the ISOLATED world content script works, because `window.history` is a shared native DOM binding, not a JS-heap object private to one world; simpler still, prefer the Navigation API (`window.navigation`, `'navigate'` event) where available, which requires no patching at all.
**Trade-offs:** MAIN-world code is visible to and can be tampered with by the host page (Chrome's own docs flag this as a real risk) — keep it minimal (just the fetch/XHR shim and the event bridge) so there is as little surface area as possible exposed to X's own JS.

```typescript
// entrypoints/main-world-bridge.ts
export default defineUnlistedScript(() => {
  const script = document.currentScript;
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (shouldCapture(args[0])) {
      const clone = res.clone();
      clone.json().then((data) =>
        script?.dispatchEvent(new CustomEvent('bt:graphql-response', { detail: data })),
      );
    }
    return res;
  };
});

// entrypoints/content/bridge-client.ts (ISOLATED world)
const { script } = await injectScript('/main-world-bridge.js', { keepInDom: true });
script.addEventListener('bt:graphql-response', (e) => {
  if (e instanceof CustomEvent) handleCapturedResponse(e.detail);
});
```

### Pattern 5: Settings broadcast via `storage.onChanged`, not message passing

**What:** The popup writes a setting with `storage.local.set(...)`; every running content script (there is exactly one per x.com tab, but the user may have several tabs open) registers `chrome.storage.onChanged.addListener` once at bootstrap and reacts to the specific keys it cares about, toggling its feature controller's `init()`/`teardown()` live. `chrome.runtime.sendMessage` is reserved for one-off request/response needs (e.g. content script asking the service worker to start a download), not for settings fan-out, because `sendMessage` has no built-in "broadcast to every tab" semantics — you'd have to manually enumerate tabs from the service worker, which is strictly more code than storage already gives you for free.
**When to use:** Always, for settings. Use message passing only when a content script needs the service worker to *do* something (download a file, open a background tab) or needs a value only the service worker can compute.
**Trade-offs:** `storage.onChanged` fires for the whole changed object, not surgically per feature, so the listener needs to diff `changes` and only act on keys it owns — trivial but easy to forget, causing redundant re-inits.

## Data Flow

### Request Flow (settings change)

```
Popup (toggle "Hide ads")
    ↓ storage.local.set({ features: { adStripper: false } })
chrome.storage.local
    ↓ storage.onChanged fires in every x.com tab's content script
Settings Store listener (content script)
    ↓ diff changes.features
Ad-Stripper Controller.teardown()
    ↓ (removes its own MutationObserver hooks / un-hides elements)
Timeline returns to unmodified state — no page reload
```

### Request Flow (tweet decoration)

```
X's virtualizer mounts a new tweet cell (React)
    ↓ DOM childList mutation
Shared MutationObserver (debounced via rAF)
    ↓ dedup check (WeakSet + data-bt-processed)
'tweet-discovered' event → feature controllers subscribed to it
    ↓ (media-downloader, reaction-menu, bookmark-capture each react)
Decoration Layer appends sibling node(s) into the action row
    ↓
IntersectionObserver (per node) fires when visible
    ↓
Expensive work (media URL extraction, thumbnail fetch) deferred until here
```

### Request Flow (bookmark capture, layered fallback)

```
Primary: MAIN-world bridge intercepts X's own Bookmarks GraphQL response
    ↓ CustomEvent → bridge-client (isolated world)
    ↓ normalize + chrome.storage.local write (bookmarks[])
Fallback (if GraphQL shape changes / interception misses a bookmark):
Background-tab scrape: service worker opens a hidden tab at x.com/bookmarks
    ↓ chrome.scripting.executeScript scrapes rendered DOM
    ↓ chrome.tabs.remove(hiddenTabId)
    ↓ chrome.storage.local write, deduped against existing bookmark IDs
Tertiary: extension-owned "Save" button on the tweet card
    ↓ direct chrome.storage.local write at point of click, no interception needed
```

### Key Data Flows

1. **Settings are always popup → storage → content script**, never popup → content script directly. This means settings work identically whether zero, one, or five x.com tabs are open, and a newly opened tab picks up current settings on content-script bootstrap by reading storage once before subscribing to `onChanged`.
2. **Captured X data (bookmarks, tweet metadata) flows MAIN world → isolated world → storage**, and is read back out of storage by every feature that needs it (folders UI, resurfacer) — the MAIN-world bridge is a one-way producer, never a consumer of extension state.
3. **The tweet observation pipeline is the single producer of `'tweet-discovered'` events**; every per-tweet feature is a consumer, never a second producer. This is what keeps the "12 features but one DOM scan" performance property intact.

## Scaling Considerations

This is a single-user, local-only extension (no backend, no concurrent users), so "scale" here means DOM/data volume on one page, not traffic.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Normal scrolling session (dozens of tweets/min recycled) | Shared debounced `MutationObserver` + `IntersectionObserver` as described is sufficient; no further work needed |
| Power-user bookmark library (thousands of saved bookmarks) | `chrome.storage.local` has a much larger quota than `sync` but reads/writes of a giant single array get slow — store bookmarks as a keyed map (`bookmarks.<id>`) or paginate reads for the folders UI rather than reading/writing one giant array on every capture |
| Rapid-fire scrolling (fast flick-scroll through hundreds of tweets) | Debounce interval and IntersectionObserver `rootMargin` become the main tuning knobs — widen `rootMargin` so decoration work starts slightly before a tweet is on-screen, avoiding visible pop-in of injected buttons |

### Scaling Priorities

1. **First bottleneck:** MutationObserver callback doing synchronous, expensive work (querySelectorAll over large subtrees) on every mutation batch during fast scrolling — fix by debouncing to animation-frame granularity and scoping queries to only the mutation's `addedNodes`, never re-scanning the whole timeline.
2. **Second bottleneck:** `chrome.storage.local` read/write of one large JSON blob for bookmarks as the library grows — fix by keying storage entries per-bookmark or per-folder instead of one array, so a single capture is an O(1) write, not a read-modify-write of the whole collection.

## Anti-Patterns

### Anti-Pattern 1: Attaching a `MutationObserver` per feature

**What people do:** Each feature (ad-stripper, media-downloader, reaction-menu, resurfacer) wires up its own `MutationObserver` on the timeline because it's the fastest way to get that one feature working in isolation.
**Why it's wrong:** On a page as mutation-heavy as x.com's virtualized timeline, N observers means N redundant scans of the same DOM churn, and N independent de-dup/cleanup implementations that will drift and each accumulate their own edge-case bugs.
**Do this instead:** Build the shared observation pipeline first (Pattern 3) and have every feature subscribe to its `'tweet-discovered'`/`'tweet-removed'` events.

### Anti-Pattern 2: Mutating or reparenting React-owned DOM nodes

**What people do:** Directly editing the `innerHTML`, removing children, or reordering elements inside a container React actively re-renders (e.g. rewriting the action-bar's own children instead of appending a sibling).
**Why it's wrong:** React's reconciliation will detect the mismatch between its virtual DOM and the real DOM on the next re-render of that subtree and either revert your change or throw a DOM exception (`NotFoundError: removeChild`) — a classic and well-documented class of bug for any "extension modifies a React app" project.
**Do this instead:** Only ever *append* extension-owned sibling nodes marked with your own `data-*` attribute, and only read (never write) the attributes/children React itself owns.

### Anti-Pattern 3: Direct DOM insertion into a live virtualized list to fake a feed item

**What people do:** Try to insert the "resurfaced bookmark" card directly into the timeline's rendered DOM between two existing tweet cells.
**Why it's wrong:** X's virtualizer positions cells with computed offsets (typically `transform: translateY(px)` derived from a running height total keyed to item index/count); inserting a foreign node throws that math off, causing overlap or being silently removed on the next re-render/recycle pass — and it does not restore scroll position correctly since the virtualizer doesn't know your node's height.
**Do this instead:** Use Pattern 1 (response-splice into the intercepted GraphQL data) so X's own virtualizer measures and positions your card exactly like a native one.

### Anti-Pattern 4: Relying on `popstate` to detect x.com navigation

**What people do:** Listen for `window.addEventListener('popstate', ...)` expecting it to fire on every URL change.
**Why it's wrong:** SPA routers (including x.com's) navigate via `history.pushState`/`replaceState`, and `popstate` only fires on browser back/forward — a content script relying on it alone will never notice the user clicking from Home to a profile to a tweet detail page.
**Do this instead:** Use the Navigation API's `'navigate'` event (simplest, fires for all navigation types) with an isolated-world `history.pushState`/`replaceState` monkey-patch as the compatibility fallback for engines/older Chrome without the Navigation API.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| x.com GraphQL API (undocumented, internal) | Passive interception via MAIN-world `fetch`/`XHR` patch — never call it directly yourself | Endpoint names/shapes (`HomeTimeline`, `Bookmarks`, etc.) are unversioned and can change; this is exactly why the project's own design calls for layered bookmark-capture fallbacks |
| Chrome Web Store review | Manifest permissions kept to `*://x.com/*`, `*://twitter.com/*`, `storage`, `downloads` | No `<all_urls>`, no remote code — the MAIN-world bridge script must ship inside the extension bundle, not be fetched at runtime, or it violates CWS remote-code policy |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MAIN world ↔ ISOLATED world | `CustomEvent` dispatched on the injected `<script>` DOM node (`script.dispatchEvent`/`addEventListener`) | Never `window.postMessage` broadly — scoping the event to the specific script element avoids leaking data to other extensions or page scripts listening on `window` |
| Popup ↔ content script(s) | `chrome.storage.local` write + `storage.onChanged` listener (no direct messaging) | One writer (popup), many readers (every open x.com tab's content script) |
| Content script ↔ service worker | `chrome.runtime.sendMessage`/`onMessage`, request/response only | Used for: trigger a download, request a background-tab bookmark scrape, never for settings |
| Observation pipeline ↔ feature controllers | In-page event emitter (`'tweet-discovered'`, `'tweet-removed'`, `'route-changed'`) | Plain in-memory pub/sub inside the isolated-world content script bundle — no chrome API involved, it's all one JS context |

## Suggested Build Order

The observation pipeline is the foundation every visual feature sits on; nothing that touches individual tweets can be built (or even meaningfully tested) before it exists. The settings store is the second foundation, since every feature is gated by a toggle. Everything else layers on top in roughly this dependency order:

1. **Storage schema + settings store** (`lib/storage`, `storage.onChanged` wiring) — no dependencies; needed by literally everything else, including the popup.
2. **Route watcher** (Navigation API + history-patch fallback) — needed before any feature that must react to navigating between timeline/bookmarks/profile/tweet-detail.
3. **Tweet observation pipeline** (MutationObserver + IntersectionObserver + WeakSet/marker de-dup) — the foundation for every per-tweet feature (ad-stripper, media-downloader, reaction-menu, bookmark-capture-via-DOM).
4. **MAIN-world bridge + isolated-world bridge-client** — unlocks fetch/XHR interception, which the primary bookmark-capture strategy and the feed-resurfacer's response-splice both depend on. Can be built in parallel with step 3 since it has no dependency on the observation pipeline itself.
5. **Simplest visual feature end-to-end (ad-stripper or clutter-hider)** — validates the whole chain (settings → pipeline → decoration → live toggle) on the lowest-complexity feature before building anything with injected interactive UI.
6. **Decoration/injection layer for interactive per-tweet UI** (media-downloader button, reaction menu) — depends on steps 1, 3, and the sibling-portal pattern; also the first place idempotent re-injection on node recycling must be proven out.
7. **Theming layer** (theme detection + CSS-variable injection) — independent of the tweet pipeline, but benefits from the route watcher existing (theme can be reapplied on navigation without a flash).
8. **Bookmark capture (all three layered strategies) + local folders/tags UI** — depends on storage schema (1) and the MAIN-world bridge (4) for the primary strategy, and the service worker (background tab) for the fallback strategy.
9. **Feed resurfacer (response-splice feed injection)** — depends on bookmark capture (8) existing as a data source and the MAIN-world bridge (4) for the splice technique; this is the most technically novel piece and should be built last so the underlying interception plumbing is already proven reliable.
10. **Background service worker responsibilities** (downloads, background-tab orchestration, alarms) — individual pieces are pulled in as needed by steps 6 (downloads) and 8 (background-tab fallback), so this isn't a single phase but a capability added incrementally alongside the features that need it.

## Sources

- [Chrome Extensions — Content Scripts reference (world: MAIN/ISOLATED)](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) — HIGH confidence, official docs, fetched via Context7
- [Chrome Extensions — chrome.userScripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts) — HIGH confidence, official docs
- [Chrome Extensions — chrome.storage API (onChanged)](https://developer.chrome.com/docs/extensions/reference/api/storage) — HIGH confidence, official docs
- [Chrome Extensions — Messaging concepts](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) — HIGH confidence, official docs
- [Chrome Extensions — chrome.alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms) — HIGH confidence, official docs
- [Chrome Extensions — MV3 migration checklist (service worker lifecycle)](https://developer.chrome.com/docs/extensions/develop/migrate/checklist) — HIGH confidence, official docs
- [WXT — Content Scripts guide (injectScript, MAIN world, defineUnlistedScript)](https://github.com/wxt-dev/wxt/blob/main/docs/guide/essentials/content-scripts.md) — MEDIUM-HIGH confidence, official framework docs, fetched via Context7
- [Chrome for Developers — Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api) — HIGH confidence, official docs (found via web search, not directly queried through Context7 this pass — recommend a direct read during Phase 2 implementation)
- [MDN — Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API) — HIGH confidence
- [eramdam/BetterTweetDeck — inject.js and architecture](https://github.com/eramdam/BetterTweetDeck) — LOW-MEDIUM confidence, real precedent for a heavy content-script Twitter-decorating extension, but targets the (now-defunct) TweetDeck product with a different virtualizer than x.com's own timeline — treat as directional evidence for the sibling-portal pattern, not a direct blueprint
- General MutationObserver/IntersectionObserver-for-infinite-scroll and virtualized-list scroll-position community writing (dev.to, Medium, w3.org list archive) — LOW confidence, general web community sources, cross-referenced against first-principles reasoning about how absolutely-positioned virtualizers compute offsets; **the specific selectors, GraphQL operation names, and virtualizer internals for x.com must be verified against the live site during implementation, not assumed from this research**

---
*Architecture research for: Chrome MV3 content-script-heavy extension decorating x.com*
*Researched: 2026-09-13*
