# Spike S4: Virtualizer Gap & Cell Collapse Behavior

**Question:** Does hiding the cell's `firstElementChild` allow X's virtualizer to observe a zero-height cell and collapse the slot cleanly without leaving a residual gap of whitespace?

## Background & Knowns

- **Reference Implementation:** `control-panel-for-twitter` (v4.24.1) toggles its hide class (`.HiddenTweet`) on `$item.firstElementChild` rather than `$item` (the cell itself).
- **Separator Handling:** Adjacent separators (`.HiddenTweet + [role="separator"]` and `[data-bt-hidden-cell] + [role="separator"]`) are hidden via CSS so no orphaned divider line remains.
- **Virtualized Positioning:** X renders timeline items inside transform-positioned containers (`div[data-testid="cellInnerDiv"]` with `style="transform: translateY(...) ..."`), deriving scroll offsets from measured DOM heights.
- **Hypothesis (A2):** Hiding `firstElementChild` allows the virtualizer's ResizeObserver/mutation logic to measure a zero-height content box and recycle or collapse the slot cleanly. Hiding the transform-positioned container itself (`display: none` on `cellInnerDiv`) could corrupt virtualizer index tracking or leave an empty calculated height slot.
- **Fallback Rule:** `lib/hide-style.ts` provides `ENABLE_S4_COLLAPSE_FALLBACK` (default `false`). If enabled, `[data-bt-hidden-cell]` enforces `height: 0 !important; min-height: 0 !important; overflow: hidden !important;`.

## Procedure

1. Load the extension in a Chrome/Edge profile signed into x.com with "Hide promoted tweets" enabled.
2. Scroll the live Home timeline until at least three promoted tweets have been encountered and hidden by the extension.
3. For each hidden promoted tweet location:
   - Verify surrounding organic tweets sit flush against each other without a dead band of whitespace or leftover separator.
   - Take a screenshot of the region.
4. Scroll well past the hidden items (at least 2 viewport heights), then scroll back up to the same positions.
5. Confirm no blank gap has appeared upon scrolling back (the warning sign of virtualizer recomputing from stale cached heights).
6. Compare behavior at the very top of the feed vs. mid-scroll (mid-feed gaps are the classic virtualizer slot artifact).
7. Update the table below and replace the `PENDING LIVE RUN` marker. If gaps occur, flip `ENABLE_S4_COLLAPSE_FALLBACK = true` and re-run.

## Result

PENDING LIVE RUN

| Cell Position | Gap Observed (Initial)? | Gap After Scroll Past & Back? | Separator Visible? | Notes |
|---------------|-------------------------|--------------------------------|-------------------|-------|
| Top of feed (cell 1-3) | PENDING | PENDING | PENDING | Initial viewport slot |
| Mid-scroll (cell 10-20) | PENDING | PENDING | PENDING | Virtualizer actively recycling slots |
| Mid-scroll (cell 30+) | PENDING | PENDING | PENDING | Deep scroll session |

## Consequence

- If `firstElementChild` hiding collapses the slot cleanly with zero residual gap (as in `control-panel-for-twitter`), `ENABLE_S4_COLLAPSE_FALLBACK` remains `false`.
- If a residual gap or blank white band persists, toggle `ENABLE_S4_COLLAPSE_FALLBACK = true` in `lib/hide-style.ts` to collapse the transform-positioned outer container directly.
- Phase 4's resurfaced card insertion into the virtualized feed inherits this decision.
