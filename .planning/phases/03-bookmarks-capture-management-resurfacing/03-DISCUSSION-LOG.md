# Phase 3: Bookmarks (Capture, Management & Resurfacing) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 03-Bookmarks (Capture, Management & Resurfacing)
**Areas discussed:** In-page UI layout on x.com/bookmarks, Tweet save button & action bar injection, Timeline resurfacing card styling & cadence, Storage quota, caching & eviction policy

---

## In-page UI layout on x.com/bookmarks

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky top toolbar | Below X native Bookmarks header with search input and horizontal folder chips | ✓ |
| Collapsible sidebar | Dedicated drawer alongside feed | |
| Floating bottom dock | Overlay at viewport bottom | |

**User choice:** Sticky top toolbar directly below X native header.
**Notes:** Keeps normal feed width completely intact, avoids sidebar breakpoint collapse.

| Option | Description | Selected |
|--------|-------------|----------|
| In-place feed filtering | Updates bookmarks feed container directly in real time | ✓ |
| Modal / overlay | Overlay dialog with results list | |
| Inline dropdown | Dropdown below toolbar | |

**User choice:** In-place feed filtering.
**Notes:** Natural experience matching X feeds.

| Option | Description | Selected |
|--------|-------------|----------|
| Inline popover dialog | "+ Folder / Tag" chip opens Radix dialog in-page | ✓ |
| Popup settings | Manage folders inside extension popup only | |
| Context menu | Right-click / tweet menu | |

**User choice:** Inline popover dialog from "+ Folder / Tag" chip.

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable empty state | Illustrated card with Clear search / Sync Bookmarks CTA | ✓ |
| Minimal text notice | 1-line text message | |
| Native empty state | Preserve X default empty state | |

**User choice:** Actionable native-feel empty state card.

---

## Tweet save button & action bar injection

| Option | Description | Selected |
|--------|-------------|----------|
| Separate save button | Dedicated button next to bookmark icon | |
| Replace bookmark button | Intercept native bookmark | |
| Unified cloud + local | Clicking native bookmark saves to X cloud AND prompts folder popup | ✓ |

**User choice:** User requested unified integration: clicking native bookmark saves to X cloud AND opens folder prompt in Better Twitter.
**Notes:** Both X cloud and local extension store stay synchronized.

| Option | Description | Selected |
|--------|-------------|----------|
| Default Uncategorized + popup | Folder popup with search, add folder, cancel + settings toggle to bypass | ✓ |
| Popover only | Simple dropdown | |
| Bottom toast | Notification toast | |

**User choice:** Default non-deletable (renamable) "Uncategorized" folder. When adding bookmark, popup shows folder list, search, add folder, cancel. Setting to auto-file silently if preferred.

| Option | Description | Selected |
|--------|-------------|----------|
| Synchronized unbookmark | Removing bookmark on X also removes it locally | ✓ |
| Keep in local archive | Soft delete | |
| Prompt on unbookmark | Confirm removal | |

**User choice:** Synchronized unbookmark.

| Option | Description | Selected |
|--------|-------------|----------|
| Clean active icon + tooltip | Native active bookmark state with folder name on hover tooltip | ✓ |
| Folder tag pill | Text badge next to bookmark | |
| Colored dot indicator | Dot on icon | |

**User choice:** Clean native active bookmark icon with folder name in hover tooltip.

---

## Timeline resurfacing card styling & cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Distinct card | "📌 Resurfaced from [Folder]" header with accent border & quick actions | ✓ |
| Exact twin | Looks identical to normal tweet | |
| Compact quote card | Half height embed | |

**User choice:** Distinct tweet card with "📌 Resurfaced from [Folder]" header, subtle accent border, and Snooze / Move folder menu.

| Option | Description | Selected |
|--------|-------------|----------|
| Every 20 tweets (slider 5-50) | Default 20 tweets cadence configurable in popup | ✓ |
| Every 10 tweets | Higher frequency | |
| Time-based interval | 5 minute timer | |

**User choice:** Every 20 tweets by default, configurable from 5 to 50 via slider in popup.

| Option | Description | Selected |
|--------|-------------|----------|
| Smart spaced rotation | Older/less-seen first + folder filter | ✓ |
| Pure random | Complete serendipity | |
| Oldest-first queue | Chronological | |

**User choice:** Smart spaced rotation with folder inclusion filters.

| Option | Description | Selected |
|--------|-------------|----------|
| Home timeline only | /home Following & For You feeds | ✓ |
| Following only | Strictly Following | |
| All timelines | Home, Lists, Search | |

**User choice:** Home timeline only (/home Following & For You).

---

## Storage quota, caching & eviction policy

| Option | Description | Selected |
|--------|-------------|----------|
| Text + metadata + media URLs | ~1KB per bookmark, 5,000-10,000 capacity | ✓ |
| Minimal text-only | ~300B per bookmark | |
| IndexedDB with image blobs | Requires unlimitedStorage | |

**User choice:** Text + metadata + media URLs.

| Option | Description | Selected |
|--------|-------------|----------|
| Warning at 80% + prune Uncategorized | Prune oldest Uncategorized at 100%; protect custom folders | ✓ |
| Hard stop at 95% | Modal warning | |
| Strict FIFO | Prune all | |

**User choice:** Warning at 80% + Auto-prune oldest Uncategorized bookmarks if 100% full (custom folders protected).

| Option | Description | Selected |
|--------|-------------|----------|
| Export & Import JSON | Backup and restore in popup settings | ✓ |
| Export only | JSON/CSV download | |
| Defer export | Future phase | |

**User choice:** Export & Import JSON in popup settings.

| Option | Description | Selected |
|--------|-------------|----------|
| Layered capture | Passive GraphQL + chunked background sync with resume checkpoint | ✓ |
| Manual sync only | Explicit click only | |
| Background polling | Hourly sync | |

**User choice:** Layered capture (passive GraphQL + chunked background sync with checkpoint).

---

## the agent's Discretion
- Search debounce timing (150-200ms).
- SVG iconography for folder chips and resurfacing header.
- Search index internal structures.

## Deferred Ideas
None — discussion stayed within Phase 3 scope.
