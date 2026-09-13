---
id: 260914-43b
status: complete
date: 2026-09-14
---

# Summary

Fixed three Minimal-theme left-rail defects in `lib/theme-engine.ts` (`MINIMAL_LAYOUT_CSS`):

- **Stray scrollbars (issues 1 + 2):** `header[role="banner"] > div` is `position: fixed` on
  x.com, so `width: 100%` sized it to the viewport instead of the 68px rail; its overflow
  scrollbars painted across the page and over the timeline. Now pinned to 68px with
  `overflow: hidden`, and scrollbar hiding applies to the whole header subtree
  (`header, header *` + `::-webkit-scrollbar`) rather than one hand-picked child.
- **Clipped pill (issue 3):** rail content (50px items) overflowed a ~630px viewport, so it
  scrolled and cut the pill's top corners. Items are 44px with tighter margins, the wrapper
  is vertically centered with 8px padding, and the pill has 4px vertical margin.

Verification: 117 unit tests pass. Visual confirmation pending on live x.com.
