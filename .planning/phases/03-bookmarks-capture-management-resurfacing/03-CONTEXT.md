# Phase 3: Bookmarks (Capture, Management & Resurfacing) - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers multi-strategy bookmark capture into local `chrome.storage.local`, native in-page folder/tag organization and search on `x.com/bookmarks`, and timeline feed resurfacing. Users can organize X bookmarks into custom folders, search bookmark text and authors instantly, and rediscover saved tweets seamlessly in their home timeline without leaving x.com or relying on external cloud servers.

In scope: BOOK-01 through BOOK-10.
Not in scope: Reactions (Phase 4), Chrome Web Store distribution packaging (Phase 5), external server-side sync or accounts (explicitly out of scope per PROJECT.md).

</domain>

<decisions>
## Implementation Decisions

### In-Page Bookmarks UI on x.com/bookmarks (BOOK-04, BOOK-05, BOOK-06)
- **D-01:** Sticky top toolbar positioned directly below X's native Bookmarks page header. Contains a full-width instant search input and horizontal scrollable folder/tag filter chips. Preserves natural feed column width.
- **D-02:** In-place feed filtering: activating a search query or selecting a folder chip filters the bookmarks feed container directly in real time, with active filter indicator badges.
- **D-03:** Inline folder & tag management: an inline Radix popover dialog triggered from a "+ Folder / Tag" chip allows creating, renaming, coloring, or deleting folders and tags directly in-page without leaving the feed.
- **D-04:** Actionable native-feel empty state card: renders when no bookmarks match a query (with "Clear search/filter" button) or on fresh install with zero bookmarks (with "Sync Bookmarks Now" CTA showing live progress).

### Tweet Save Button & Action Bar Integration (BOOK-01, BOOK-03)
- **D-05:** Unified dual-save: Clicking X's native Bookmark button triggers the native cloud save AND opens a Better Twitter folder selector popup, keeping X's remote state and local folders synchronized. — **Reversibility:** costly — touches action row observation, click handling, and cloud interception.
- **D-06:** Default "Uncategorized" folder: A built-in, non-deletable (but user-renamable) folder holds all imported bookmarks and unassigned saves by default.
- **D-07:** Bookmark assignment popup: A clean Radix popover anchored to the bookmark button provides a folder list, instant search bar, on-the-fly "+ New Folder" button, and Cancel button.
- **D-08:** Quick-save settings option: A toggle in popup settings ("Ask for folder when bookmarking") allows users to bypass the prompt and auto-save directly to "Uncategorized".
- **D-09:** Synchronized unbookmarking: Clicking the bookmark button on an already-bookmarked tweet to remove it on X also removes it from local Better Twitter storage.
- **D-10:** Action bar visual indicator: X's native bookmark icon shows the active/filled state, and hovering reveals a tooltip naming the assigned folder(s) to maintain a clean action row without visual clutter.

### Timeline Resurfacing (BOOK-07, BOOK-08, BOOK-09)
- **D-11:** Card styling: Injected resurfaced bookmark card renders as a distinct native-styled tweet card with a top header "📌 Resurfaced from [Folder]", subtle theme accent border tint, and quick-action menu (Snooze / Don't resurface / Move folder).
- **D-12:** Cadence: Defaults to 1 resurfaced card every 20 tweets, configurable via a slider in popup settings from 5 to 50 tweets.
- **D-13:** Smart spaced rotation: Prioritizes older or less-frequently seen bookmarks, with folder-level eligibility toggles in settings so users choose which folders resurface.
- **D-14:** Feed scope: Resurfacing operates exclusively on Home timeline feeds (`/home` Following and For You); excluded from profile pages, search results, and tweet detail reply trees.

### Storage Quota, Backup & Sync Strategy (BOOK-01, BOOK-02, BOOK-10)
- **D-15:** Payload structure: Stores tweet text, author details (name, handle, avatar URL), timestamp, and external CDN media URLs (~1KB per bookmark, supporting 5,000–10,000 bookmarks within the 10MB `chrome.storage.local` quota; no raw media blobs).
- **D-16:** Quota & eviction: Quota warning banner at 80% utilization. If 100% full, auto-prunes oldest bookmarks in "Uncategorized" only. Custom folders and tagged bookmarks are protected and NEVER auto-pruned.
- **D-17:** Export & Import JSON: Full backup and restore available in the extension settings popup (one-click download/upload of bookmarks, folders, and tags).
- **D-18:** Layered capture pipeline: Passive GraphQL interception during normal browsing (via `bt:graphql` bridge) + one-click chunked background-tab sync with persistent resume checkpoints.

### Claude's Discretion
- Exact debounce timing for live search input (recommended 150-200ms).
- Specific SVG iconography for folder chips and resurfaced card header.
- Internal data schema and indexing structures for client-side search.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md` — Core value, constraints (WXT/React/Tailwind/Radix, zero external font requests, local-only storage), out-of-scope list.
- `.planning/REQUIREMENTS.md` lines 40-52 — BOOK-01 through BOOK-10 requirements verbatim.
- `.planning/ROADMAP.md` § "Phase 3: Bookmarks (Capture, Management & Resurfacing)" — Goal, success criteria, and empirical spikes (GraphQL shape churn, action row injection, background tab throttling, storage footprint, response-splice vs DOM insertion).

### Foundation contracts and existing infrastructure
- `entrypoints/bridge.ts` — Passive MAIN-world fetch/XHR bridge already dispatching `bt:graphql` events with `operationName`, `docId`, and entry counts.
- `lib/storage.ts` — WXT storage schema, defineItem patterns, and migration versioning.
- `lib/selectors.ts` — Selector resolution engine with `withFeature` and miss reporting.
- `lib/registry.ts` — Category and feature registry for settings popup integration.
- `lib/observers.ts` — Named MutationObserver registry and route-scoped lifecycle teardown.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `entrypoints/bridge.ts`: Already intercepts GraphQL requests in MAIN world and dispatches custom events; can be expanded to capture bookmark query payloads.
- `lib/storage.ts`: Established WXT `storage.defineItem` pattern with versioned migrations for bookmarks, folders, and sync state.
- `features/layout-engine/index.ts`: Pattern for mounting non-destructive React islands adjacent to native feed containers.
- `lib/theme-engine.ts`: CSS variables and theme tokens (`--bt-theme-*`) that all injected Shadow DOM components and cards will automatically inherit.

### Established Patterns
- Non-destructive DOM mounting: React islands rendered via Shadow DOM or appended without removing React-owned DOM nodes.
- Settings live broadcast via `storage.onChanged`.
- Zero outbound network calls: all processing, search indexing, and storage stay local in the browser.

### Integration Points
- `entrypoints/x.content/index.ts`: Route watcher checks for `/i/bookmarks` or `/bookmarks` to mount the in-page toolbar, and watches `/home` timeline for resurfacing insertions.
- `entrypoints/popup/`: Add "Bookmarks" category tile with sync controls, resurfacing cadence slider, folder checklist, and Export/Import buttons.

</code_context>

<specifics>
## Specific Ideas

- Unified bookmarking: User clicks X native bookmark button, X saves to cloud, Better Twitter simultaneously pops up a clean folder selector.
- Uncategorized folder: Non-deletable default folder for all unsorted bookmarks, renamable by the user, with an option in settings to disable the prompt and auto-file there silently.
- Spaced rediscovery: "📌 Resurfaced from [Folder]" cards in `/home` timeline every 20 tweets so saved knowledge does not rot.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed strictly within Phase 3 scope.

</deferred>

---

*Phase: 03-Bookmarks (Capture, Management & Resurfacing)*
*Context gathered: 2026-09-14*
