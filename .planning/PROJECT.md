# Better Twitter!

## What This Is

A Chrome extension (Manifest V3) that hands control of the X/Twitter web experience back to the person using it: it strips ads and promoted content, adds local bookmark folders with search and timeline resurfacing, puts a 1-click media downloader in the tweet action row, offers Facebook-style Twemoji reactions that post as instant emoji replies, and layers on community themes (Dracula, Nord, Matrix) plus a minimal and old-Twitter layout.

Built by and for the author as a fun side project, with a public Chrome Web Store listing as the distribution target.

## Core Value

Every annoyance the author has with X is fixed by a toggle in one popup — and toggling it feels native, not bolted on.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ads and promoted tweets are continuously stripped from the timeline
- [ ] Clutter toggles: hide "What's Happening", "Who to Follow", and the "For You" tab
- [ ] Theme engine: Dracula, Nord, Hacker/Matrix, plus a custom accent color picker
- [ ] Minimal theme (hides vanity metrics, centers timeline) and Old Twitter layout
- [ ] Media downloader button in the tweet action row (highest-res MP4/JPG/PNG)
- [ ] Twemoji reaction menu on hover/long-press of Like or Reply, posting a 1-emoji reply
- [ ] Reaction posts immediately with a 5s undo toast that deletes the reply
- [ ] Bookmark capture into chrome.storage.local via layered strategies with fallback
- [ ] Local bookmark folders/tags and search, injected onto x.com/bookmarks
- [ ] Timeline resurfacing: re-inject a saved bookmark every N tweets with a "📌 Resurfaced from your Bookmarks" header
- [ ] Settings popup: icon-grid layout with footer, Radix/shadcn components, syncs to X's active theme (Light/Dim/Lights Out)
- [ ] Chrome Web Store–compliant manifest, permissions, icons, and listing assets

### Out of Scope

- Server-side sync or accounts — everything stays in chrome.storage.local; no backend to run, no data to leak
- Firefox / Safari ports — Chrome only for v1; WXT makes this addable later if wanted
- Scheduling, analytics, or any posting beyond single-emoji replies — not what this is for
- Mobile — X's mobile web and native apps can't host a Chrome extension

## Context

- **X is a hostile DOM target.** Obfuscated class names (`css-1dbjc4n`), aggressive virtualization, and a heavily dynamic React SPA. Every selector must key on stable `data-testid` attributes (`[data-testid="tweet"]`, `[data-testid="like"]`, `[data-testid="reply"]`) with graceful degradation when they change.
- **Bookmark capture is deliberately layered.** Multiple strategies (background-tab DOM scrape of x.com/bookmarks, interception of X's own bookmark API responses, and an extension-owned save button) with automatic fallback when one breaks — no single point of failure.
- **Reactions post publicly under the user's account.** This is real, irreversible-ish social action; the undo toast exists because a misclick is a public post. It is also automated interaction with X, which X's ToS discourages — accepted knowingly for a personal-use tool.
- **Chrome Web Store review is a real gate.** Auto-reply and background scraping attract scrutiny. Keep host permissions narrow (`*://x.com/*`, `*://twitter.com/*`), avoid `<all_urls>`, request `downloads` and `storage` only, and write an honest listing describing local-only storage.
- Built for fun — there is no deadline, no user base to serve, and no revenue model. Scope decisions favor "all of it, done nicely" over ruthless cutting.

## Constraints

- **Tech stack**: WXT (wxt.dev) + React 18 + TypeScript + Tailwind CSS + Radix UI (shadcn/ui) — WXT gives MV3 generation, auto-imports, and HMR; Radix gives accessible primitives without hand-rolling menus and toggles
- **Icons**: Lucide React for settings chrome, Twemoji for reactions — Twemoji matches X's own emoji rendering so reactions look native
- **Storage**: WXT storage API over `chrome.storage.local` — no backend, no network calls beyond X itself
- **Platform**: Chrome / Manifest V3 only
- **Distribution**: Chrome Web Store — permissions and listing must survive review
- **DOM targeting**: `data-testid` selectors only; no class-name or structural-position selectors

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reaction posts immediately with a 5s undo toast | Best-feeling interaction; undo covers the misclick risk of publishing a public reply | — Pending |
| Bookmark capture uses multiple strategies with fallback | X breaks scrapers regularly; a single method is a guaranteed future outage | — Pending |
| All five feature areas ship in one release | Fun project with no deadline; the value is the complete control panel, not an MVP | — Pending |
| Settings popup uses an icon-grid + footer layout | Matches the author's reference design and scales to many feature categories | — Pending |
| Chrome Web Store as distribution target | Wants it installable by others, accepts the review constraints on permissions | — Pending |
| Local-only storage, no backend | Nothing to host, nothing to breach, no privacy policy complexity | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-13 after initialization*
