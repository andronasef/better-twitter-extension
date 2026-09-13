# Phase 2: Clean Timeline & Themes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md ? this log preserves the alternatives considered.

**Date:** 2026-09-13
**Phase:** 2-Clean Timeline & Themes
**Areas discussed:** Vanity metrics presentation, "For You" tab removal behavior, Theme and Layout combination model, Old Twitter & Minimal layout styling

---

## Vanity metrics presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Keep icons, strip numbers | Keep all action buttons visible/clickable, strip all numeric counter text | |
| Strip numbers + hide analytics | Strip all numbers, plus completely hide the Analytics / View Count icon entirely | ? |
| Granular sub-toggles | Separate toggles for Hide Views vs Hide Likes/Reposts/Replies | |

| Detail page stats | Description | Selected |
|-------------------|-------------|----------|
| Strip detail stats | Strip the dedicated stats block on tweet detail pages as well (preserving timestamp) | ? |
| Leave detail stats intact | Leave expanded tweet detail stats intact | |

| Profile follower counts | Description | Selected |
|------------------------|-------------|----------|
| Scope to tweets only | Leave profile Following/Followers intact | |
| Separate sub-toggle | Add a separate sub-toggle "Hide profile follower counts" under Clean Timeline | ? |

| Hover tooltips | Description | Selected |
|----------------|-------------|----------|
| Sanitize tooltips | Keep action tooltips but sanitize them to action labels only (no numbers) | ? |
| Native tooltips | Let native tooltips show if hovered | |

**User's choice:** Strip all numbers and completely hide the View Count icon; strip detail stats; add separate profile follower sub-toggle; sanitize tooltips to labels only.

---

## "For You" tab removal behavior & Sidebar Clutter

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-switch and hide | Auto-switch to Following and visually hide For You | |
| Swap order and auto-select | Don't hide it, make Following first (then For You tab) and choose it! | ? (write-in) |

| Sub-toggle to hide For You | Description | Selected |
|---------------------------|-------------|----------|
| Yes | Provide a sub-toggle to completely hide the For You tab | ? |
| No | Only swap tabs | |

| Pinned lists | Description | Selected |
|--------------|-------------|----------|
| Swap default two | Only reorder the default two tabs (Following and For You), leaving custom pinned Lists in their natural positions | ? |
| Following always first | Keep Following first, pinned Lists, For You at the very end | |

| Right sidebar clutter | Description | Selected |
|-----------------------|-------------|----------|
| Independent toggles | Separate toggles for Trends, Who to Follow, Premium upsell | |
| Bundle all right sidebar | Bundle all right-sidebar clutter into one "Clean right sidebar" toggle | ? |

**User's choice:** Reorder tabs so Following is first, auto-select Following on load; add sub-toggle to hide For You tab; bundle right-sidebar clutter into one clean toggle.

---

## Theme and Layout combination model

| Option | Description | Selected |
|--------|-------------|----------|
| Orthogonal stacking | Color themes and layout modes are separate settings | |
| Unified theme & layout | "layout and theme is one thing! not two separate things" | ? (write-in) |

| Color themes & light/dark | Description | Selected |
|--------------------------|-------------|----------|
| Signature dark force | Full themes (Dracula, Nord, Matrix) force signature dark palette regardless of X mode | ? |
| Custom accent overlay | Custom accent color replaces X blue over active background | ? |

| Popup UI | Description | Selected |
|----------|-------------|----------|
| Visual thumbnail cards | Use visual thumbnail cards in the popup for each preset theme to preview what it looks like before applying | ? |

| FOUC Prevention | Description | Selected |
|-----------------|-------------|----------|
| Synchronous style + CSS vars | CSS variables + synchronous <style id="bt-theme"> at document_start (driven by cached storage) for zero FOUC | ? |

**User's choice:** Unified Theme & Layout selector (Dracula, Nord, Matrix, Minimal, Old Twitter); visual thumbnail cards; zero FOUC via synchronous style + CSS vars.

---

## Old Twitter & Minimal layout styling

| Minimal Layout | Description | Selected |
|----------------|-------------|----------|
| Center feed + collapse left nav | Center the timeline feed, completely hide the right sidebar, and collapse the left navigation to slim icons only | ? |
| Pure zen mode | Hide both left and right sidebars completely | |

| Old Twitter fidelity | Description | Selected |
|----------------------|-------------|----------|
| Classic 3-column + profile widget | 3-column desktop layout with classic left-hand mini profile card, bounded bordered feed cards, and classic layout proportions | ? |
| Lightweight retro | Lightweight retro restyle without moving navigation | |

| Avatar & Tweet Cards | Description | Selected |
|----------------------|-------------|----------|
| Rounded-square avatars & borders | Classic rounded-square avatars (border-radius: 4px/5px) and discrete bordered tweet card containers | ? |
| Modern round avatars | Keep modern round avatars | |

| Navigation | Description | Selected |
|------------|-------------|----------|
| Classic horizontal top navbar | Horizontal top navigation bar with classic Twitter layout (Home, Notifications, Messages, Search, Tweet button) | ? |
| Left sidebar | Keep vertical left navigation | |

**User's choice:** Minimal centers feed, hides right sidebar, collapses left nav to icons. Old Twitter restores 2015 3-column layout, left mini profile card, rounded-square avatars, bordered tweet cards, and horizontal top navigation bar.

---

## Claude's Discretion

- Token variable names for CSS theme properties.
- Selector fallback heuristics for right-sidebar modules and expanded tweet detail stats.
- Responsive breakpoints for 3-column Old Twitter layout.

## Deferred Ideas

- Full user-authored CSS palette editor (THEME-08) ? v2.
- Firefox / Safari ports (PLAT-01) ? v2.
