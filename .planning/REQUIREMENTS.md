# Requirements: Better Twitter!

**Defined:** 2026-09-13
**Core Value:** Every annoyance the author has with X is fixed by a toggle in one popup — and toggling it feels native, not bolted on.

**Global property:** Every user-facing feature below is independently toggleable from the settings popup, and every toggle applies live without a page reload. This is not repeated per-requirement.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: A single shared tweet observation pipeline emits a "tweet seen" event for every tweet rendered in the feed, de-duplicated so a recycled node is never processed twice
- [ ] **FOUND-02**: Feature code subscribes to the shared pipeline rather than registering its own MutationObserver
- [ ] **FOUND-03**: Extension re-initializes correctly on client-side route changes (x.com is a client-routed SPA; content scripts do not re-run on navigation)
- [ ] **FOUND-04**: All DOM targeting goes through a selector-resolution layer keyed on `data-testid`, with fallbacks, that reports when a selector stops matching instead of silently doing nothing
- [ ] **FOUND-05**: A MAIN-world bridge can observe X's own fetch/XHR traffic and pass captured data to the isolated-world content script
- [ ] **FOUND-06**: A shared Radix portal-provider utility renders all portalled UI inside the shadow root with styles intact
- [ ] **FOUND-07**: Settings changes broadcast to running content scripts via `storage.onChanged` and apply live without a page reload
- [ ] **FOUND-08**: Scrolling the timeline with all features enabled holds 60fps with no long tasks attributable to the extension
- [ ] **FOUND-09**: Observers, listeners, and injected nodes are cleaned up as X recycles feed nodes, so memory does not grow across a long session

### Clean Timeline

- [ ] **CLEAN-01**: User can hide promoted and ad tweets, which are stripped continuously as the feed loads
- [ ] **CLEAN-02**: User can hide the "What's Happening" / trends sidebar module
- [ ] **CLEAN-03**: User can hide the "Who to Follow" module
- [ ] **CLEAN-04**: User can hide the algorithmic "For You" timeline tab so Following is the default
- [ ] **CLEAN-05**: User can hide vanity metrics (like, reply, and repost counts) on tweets

### Themes

- [ ] **THEME-01**: User can apply a Dracula color theme to X
- [ ] **THEME-02**: User can apply a Nord color theme to X
- [ ] **THEME-03**: User can apply a Hacker/Matrix color theme (true black, neon green) to X
- [ ] **THEME-04**: User can set a custom accent color by hex value, replacing X's default accent throughout the UI
- [ ] **THEME-05**: User can enable a Minimal theme that centers the timeline and strips surrounding chrome for focused reading
- [ ] **THEME-06**: User can enable an Old Twitter layout that emulates the classic pre-X desktop layout
- [ ] **THEME-07**: Applied themes survive route changes and feed re-renders without a flash of unthemed content

### Bookmarks

- [ ] **BOOK-01**: Extension captures the user's X bookmarks into local storage using layered strategies — intercepting X's own bookmark API responses, scraping a background-loaded x.com/bookmarks tab, and an extension-owned save button — falling back automatically when one strategy fails
- [ ] **BOOK-02**: A capture run that is interrupted (service worker termination, background-tab throttling, closed tab) resumes from where it stopped rather than restarting or silently failing
- [ ] **BOOK-03**: User is told explicitly when capture cannot proceed (not logged in, X endpoint changed, rate limited) rather than seeing an empty or stale list
- [ ] **BOOK-04**: User can create folders/tags and assign saved tweets to them
- [ ] **BOOK-05**: User can full-text search their captured bookmarks by tweet text and author
- [ ] **BOOK-06**: Folder, tag, and search UI is injected into the native x.com/bookmarks page rather than living in a separate window
- [ ] **BOOK-07**: User can enable timeline resurfacing, which re-injects a saved bookmark into the feed every N tweets under a "📌 Resurfaced from your Bookmarks" header
- [ ] **BOOK-08**: User can configure the resurfacing interval N
- [ ] **BOOK-09**: A resurfaced card does not disturb scroll position and is not wiped by the feed's virtualizer
- [ ] **BOOK-10**: Bookmark storage is pruned or bounded so the local cache cannot grow past `chrome.storage.local` quota

### Reactions

- [ ] **REACT-01**: Hovering the Like button on a tweet reveals a Twemoji reaction palette
- [ ] **REACT-02**: Long-pressing the Like button reveals the same palette, as an alternate trigger
- [ ] **REACT-03**: Picking a reaction opens X's native reply composer prefilled with that emoji, leaving the user to send it
- [ ] **REACT-04**: The extension never posts, likes, or replies on the user's behalf without the user's own send action
- [ ] **REACT-05**: User can choose which emoji appear in their reaction palette instead of a fixed set
- [ ] **REACT-06**: Reaction glyphs render from bundled Twemoji assets, matching X's native emoji rendering, with no CDN hotlinking

### Settings UI

- [ ] **UI-01**: Popup presents settings as a grid of categorical icon tiles with a footer
- [ ] **UI-02**: Selecting a tile opens that category's settings panel within the popup
- [ ] **UI-03**: Popup automatically matches the user's active X theme (Light, Dim, Lights Out)
- [ ] **UI-04**: Popup uses X's Chirp font and native-feeling Radix/shadcn controls
- [ ] **UI-05**: Each feature toggle carries a tooltip explaining what it does

### Store Readiness

- [ ] **STORE-01**: Manifest requests only narrow host permissions (`*://x.com/*`, `*://twitter.com/*`) and the minimum API permissions, with no `<all_urls>`
- [ ] **STORE-02**: Production build contains no remote code execution or eval-like code paths
- [ ] **STORE-03**: A published privacy policy states that all data stays in local browser storage and nothing is transmitted
- [ ] **STORE-04**: Store listing frames the extension around a single coherent purpose to satisfy the single-purpose policy
- [ ] **STORE-05**: Store assets (icons, screenshots, description) are complete and the package builds and zips for submission

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### Bookmarks

- **BOOK-11**: Export bookmarks and folder structure to JSON/CSV
- **BOOK-12**: Decay-based resurfacing priority (older or never-seen bookmarks surface more often) rather than uniform random selection

### Themes

- **THEME-08**: User-authored custom themes beyond accent color (full palette editing)

### Platform

- **PLAT-01**: Firefox port via WXT's multi-browser build

## Out of Scope

| Feature | Reason |
|---------|--------|
| Media downloader | A near-identical X media downloader was already removed from the Chrome Web Store for facilitating unauthorized download of copyrighted media |
| Automatic posting of replies or likes | Chrome Web Store policy requires the user be able to confirm sent content; X treats scripted site interaction as a suspension-risk category |
| Undo-send toast | Nothing to undo — the extension never posts on the user's behalf |
| Server-side sync, accounts, or any backend | Local-only by design: nothing to host, nothing to breach, no privacy policy complexity |
| AI auto-tagging of bookmarks | Requires a backend, which the project explicitly does not have |
| Scheduling or analytics features | Not what this is for; also the highest-risk category for X account actioning |
| Safari / Firefox in v1 | Chrome only for v1; WXT makes a port addable later |
| Mobile | X mobile web and native apps cannot host a Chrome extension |
| Full alternative-client rewrite | Better TweetDeck died outright when its host surface changed; layering toggles on the real app is the survivable strategy |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (pending roadmap) | — | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 0
- Unmapped: 42 ⚠️

---
*Requirements defined: 2026-09-13*
*Last updated: 2026-09-13 after initial definition*
