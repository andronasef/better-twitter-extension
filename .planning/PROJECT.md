# Better Twitter!

## What This Is

A Chrome extension (Manifest V3) that hands control of the X/Twitter web experience back to the person using it: it strips ads and promoted content, adds local bookmark folders with search and timeline resurfacing, offers Facebook-style Twemoji reactions that prefill a 1-emoji reply for the user to send, and layers on community themes (Dracula, Nord, Matrix) plus a minimal and old-Twitter layout.

Built by and for the author as a fun side project, with a public Chrome Web Store listing as the distribution target.

## Core Value

Every annoyance the author has with X is fixed by a toggle in one popup — and toggling it feels native, not bolted on.

## Requirements

### Validated

- ✓ Ads and promoted tweets are continuously stripped from the timeline — Phase 1
- ✓ Settings popup: icon-grid layout with footer, Radix/shadcn components, syncs to X's active theme — Phase 1
- ✓ Clutter toggles: hide "What's Happening", "Who to Follow", and the "For You" tab — Phase 2
- ✓ Theme engine: Dracula, Nord, Hacker/Matrix, plus a custom accent color picker — Phase 2
- ✓ Minimal theme (hides vanity metrics, centers timeline) and Old Twitter layout — Phase 2
- ✓ Bookmark capture into chrome.storage.local via layered strategies with fallback — Phase 3
- ✓ Local bookmark folders/tags and search, injected onto x.com/bookmarks — Phase 3
- ✓ Timeline resurfacing: re-inject a saved bookmark every N tweets with a "📌 Resurfaced from your Bookmarks" header — Phase 3
- ✓ Twemoji reaction menu on hover/long-press of Like or Reply — Phase 4
- ✓ Picking a reaction prefills the native reply composer with that emoji; the user sends it — Phase 4

### Active

- [ ] Chrome Web Store–compliant manifest, permissions, icons, and listing assets

### Out of Scope

- Server-side sync or accounts — everything stays in chrome.storage.local; no backend to run, no data to leak
- Firefox / Safari ports — Chrome only for v1; WXT makes this addable later if wanted
- Media downloader — cut. A near-identical X media downloader was already pulled from the Chrome Web Store for facilitating unauthorized download of copyrighted media; not worth the listing risk
- Posting anything automatically on the user's behalf — Chrome Web Store policy requires the user be able to confirm message content, and X treats scripted site interaction as a suspension-risk category
- Scheduling, analytics, or any posting beyond single-emoji replies — not what this is for
- Mobile — X's mobile web and native apps can't host a Chrome extension

## Context

- **X is a hostile DOM target.** Obfuscated class names (`css-1dbjc4n`), aggressive virtualization, and a heavily dynamic React SPA. Every selector must key on stable `data-testid` attributes (`[data-testid="tweet"]`, `[data-testid="like"]`, `[data-testid="reply"]`) with graceful degradation when they change.
- **Bookmark capture is deliberately layered.** Multiple strategies (background-tab DOM scrape of x.com/bookmarks, interception of X's own bookmark API responses, and an extension-owned save button) with automatic fallback when one breaks — no single point of failure.
- **Reactions never post by themselves.** Picking an emoji prefills X's own reply composer and the user presses Reply. This keeps the extension inside Chrome Web Store policy (the user confirms the content), keeps it clear of X's scripted-interaction rules, and is far more durable than driving X's posting internals.
- **Chrome Web Store review is a real gate.** Background scraping and a multi-feature scope attract scrutiny (single-purpose policy). Keep host permissions narrow (`*://x.com/*`, `*://twitter.com/*`), avoid `<all_urls>`, request `storage` only, frame the listing around one coherent purpose, and describe local-only storage honestly.
- Built for fun — there is no deadline, no user base to serve, and no revenue model. Scope decisions favor "all of it, done nicely" over ruthless cutting.

## Constraints

- **Tech stack**: WXT (wxt.dev) + React 18 + TypeScript + Tailwind CSS + Radix UI (shadcn/ui) — WXT gives MV3 generation, auto-imports, and HMR; Radix gives accessible primitives without hand-rolling menus and toggles
- **Icons**: Lucide React for settings chrome, Twemoji for reactions — Twemoji matches X's own emoji rendering so reactions look native
- **Storage**: WXT storage API over `chrome.storage.local` — no backend, no network calls beyond X itself
- **Platform**: Chrome / Manifest V3 only
- **Distribution**: Chrome Web Store — permissions and listing must survive review
- **DOM targeting**: `data-testid` selectors wherever X provides one; structural combinators permitted only in `lib/selectors.ts` where X exposes no testid for that target (and registered with miss-reporting FOUND-04 so failures degrade loudly); class names prohibited. Selector values grounded empirically against live x.com, not unverified research constants. (D-16)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reactions prefill the reply composer instead of posting | CWS policy requires user confirmation of sent content; X treats scripted posting as suspension-risk; also far more durable than driving X's posting internals | Validated (Phase 4) |
| Bookmark capture uses multiple strategies with fallback | X breaks scrapers regularly; a single method is a guaranteed future outage | Validated (Phase 3) |
| All remaining feature areas ship in one release | Fun project with no deadline; the value is the complete control panel, not an MVP | In Progress |
| Media downloader cut from scope | Direct precedent: a near-identical X downloader was removed from the Chrome Web Store | Out of Scope |
| Settings popup uses an icon-grid + footer layout | Matches the author's reference design and scales to many feature categories | Validated (Phase 1) |
| Chrome Web Store as distribution target | Wants it installable by others, accepts the review constraints on permissions | Phase 5 Focus |
| Local-only storage, no backend | Nothing to host, nothing to breach, no privacy policy complexity | Validated (Phases 1-4) |

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
*Last updated: 2026-09-15 after Phase 04 completion*
