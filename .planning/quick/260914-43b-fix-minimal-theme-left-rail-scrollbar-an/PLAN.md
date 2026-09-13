---
id: 260914-43b
slug: fix-minimal-theme-left-rail-scrollbar-an
date: 2026-09-14
workflow: quick
---

# Fix Minimal theme left-rail scrollbar and edge-clipping issues

User-reported visual bugs in the Minimal theme (live x.com screenshot):

1. Stray full-width white horizontal scrollbar drawn across the page.
2. The left rail's scroll container renders a vertical scrollbar over the timeline.
3. The rail is flush against the viewport top/bottom, clipping the nav pill's rounded corners.

## Root cause

`header[role="banner"] > div` is `position: fixed` on x.com. `width: 100%` on a fixed
element resolves against the **viewport**, not the 68px rail — so the rail's scroll
container is viewport-wide, and its scrollbars (horizontal at its bottom edge, vertical
at its right edge) paint across the page. Scrollbar hiding was only applied to
`> div > div`, not the actual overflowing element. Separately, 50px nav items + 50px
logo + Post + account switcher exceed a ~630px viewport, so the rail scrolls and the
pill's top corners get cut off.

## Tasks

1. Constrain the fixed rail wrapper to 68px, `overflow: hidden`, vertically centered
   with padding (`lib/theme-engine.ts`, `MINIMAL_LAYOUT_CSS`).
2. Hide scrollbars across the entire `header[role="banner"]` subtree, not just one child.
3. Shrink rail items 50px -> 44px and tighten margins so the rail fits without scrolling.

## Verify

`bun run test` (unit) passes; visual confirmation by the user on live x.com.
