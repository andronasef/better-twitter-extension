# Phase 4: Twemoji Reactions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 4-Twemoji Reactions
**Areas discussed:** Trigger & Hover Mechanics, Reply Composer Target & Prefill Behavior, Emoji Palette Configuration, Visual Styling & Animation

---

## Trigger & Hover Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Standard 350ms delay with 300ms exit grace buffer | Responsive yet avoids accidental popups during fast skimming | ✓ |
| Snappy 200ms delay with 200ms exit buffer | Opens almost immediately on hover | |
| Relaxed 500ms delay | Conservative, only opens on very deliberate pauses | |
| You decide | Tune timing to feel natural with standard defaults | |

**User's choice:** Standard 350ms delay with 300ms exit grace buffer
**Notes:** Balances responsive feel against timeline scroll noise.

| Option | Description | Selected |
|--------|-------------|----------|
| 500ms hold on both touch and mouse | Suppresses native Like click if hold threshold reached | ✓ |
| Touch devices only | Desktop mouse relies strictly on 350ms hover | |
| You decide | Standard 500ms hold with click-suppression | |

**User's choice:** 500ms hold on both touch and mouse click-and-hold
**Notes:** Provides a consistent hold gesture on both trackpads/mouse and touch screens.

| Option | Description | Selected |
|--------|-------------|----------|
| Immediately dismiss on scroll, outside click, Escape, unmount | Defensively prevents orphaned floating palettes in virtualized feed | ✓ |
| Keep palette open during scroll pinned to tweet | Dismisses only on outside click or Escape | |
| You decide | Defensive dismissal on scroll or tweet recycling | |

**User's choice:** Immediately dismiss on window/feed scroll, outside click, Escape key, or when tweet unmounts from virtualizer
**Notes:** Vital for virtualized feeds where tweet DOM nodes are recycled rapidly.

| Option | Description | Selected |
|--------|-------------|----------|
| Normal click triggers native X Like and closes palette | Passes single-click through to X's native Like handler | ✓ |
| Click Like button while open closes palette without liking | Toggles palette off | |
| You decide | Standard single-click Like passes through | |

**User's choice:** Normal click triggers native X Like action and closes the reaction palette immediately
**Notes:** Preserves primary native button functionality for standard likes.

---

## Reply Composer Target & Prefill Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Context-aware: Click native Reply button on the tweet | Opens modal on timelines, focuses inline box on permalink pages | ✓ |
| Always open modal composer | Clicks reply button on tweet regardless of page | |
| You decide | Detect inline reply box on permalinks, otherwise click reply | |

**User's choice:** Context-aware: Click native Reply button on the tweet
**Notes:** Reuses native X reply mechanics cleanly without custom navigation.

| Option | Description | Selected |
|--------|-------------|----------|
| Focus editor and dispatch document.execCommand('insertText') | Native editing command triggers X's React/DraftJS state reliably | ✓ |
| Direct synthetic InputEvent dispatch | Simulated keypress events | |
| You decide | execCommand with input event fallback | |

**User's choice:** Focus editor and dispatch document.execCommand('insertText', false, emoji + ' ') with InputEvent fallback
**Notes:** Required so X's internal editor state recognizes text and enables the Reply button.

| Option | Description | Selected |
|--------|-------------|----------|
| Append emoji with trailing space to existing draft | Places caret at end of draft | ✓ |
| Prepend emoji at the beginning of draft | Places emoji at start with trailing space | |
| Replace existing draft text entirely | Clears draft and inserts emoji | |
| You decide | Append to draft with trailing space | |

**User's choice:** Append emoji with trailing space at the end of any existing draft text, placing caret at the end
**Notes:** Non-destructive; preserves any drafted reply text the user had started.

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback: Copy emoji to clipboard and show toast | Discreet toast ("Replies unavailable — emoji copied to clipboard") | ✓ |
| Show toast without copying | Simple warning notification | |
| Silent no-op | Closes palette without message | |
| You decide | Copy to clipboard and display warning toast | |

**User's choice:** Fallback: Copy emoji to clipboard and show a discreet toast
**Notes:** Gracefully handles locked or restricted replies without leaving the user stranded.

---

## Emoji Palette Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| 6 slots with defaults: 👍, ❤️, 😂, 😮, 😢, 🔥 | Standard sentiment set matching social conventions | ✓ |
| 7 slots adding 🚀 | Tech/hype reaction | |
| 8 slots adding 🤔 and 💀 | Extended sentiment set | |
| You decide | 6 standard sentiment emojis | |

**User's choice:** 6 slots with defaults: 👍 (thumbs up), ❤️ (heart), 😂 (laughing), 😮 (surprised), 😢 (sad), 🔥 (fire)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated Reactions panel in popup + optional "+" icon on palette | Extends popup settings with slot configurator and quick link | ✓ |
| Extension popup Reactions panel only | Keeps palette uncluttered | |
| You decide | Dedicated popup panel for slot configuration | |

**User's choice:** Dedicated "Reactions" panel in the extension popup plus an optional "+" icon on palette to open it

| Option | Description | Selected |
|--------|-------------|----------|
| 3 styles + hybrid asset delivery (user specification) | 1. Normal emojis (OS), 2. Twemoji SVGs, 3. Animated Noto emojis (https://googlefonts.github.io/noto-emoji-animation/); static bundled defaults + remote browsing for new emojis with local storage caching | ✓ |

**User's choice:** Custom specification: 3 options (normal emojis / twemoji emojis / animated noto ones), static copy for defaults, remote browsing for adding new ones with local caching, 100% customizable palette.
**Notes:** Major user architectural direction. Delivers rich animated emoji capability while safeguarding offline speed and storage bounds.

| Option | Description | Selected |
|--------|-------------|----------|
| Strictly fixed slots | Palette always displays exact customized slots in user-defined order | ✓ |
| Dynamic last slot | 6th slot dynamically reflects most recently picked emoji | |
| You decide | Fixed slots for predictable muscle memory | |

**User's choice:** Strictly fixed slots — palette always displays the exact customized slots in user-defined order

---

## Visual Styling & Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Floating rounded pill with backdrop blur & theme borders | Border and surface colors automatically synced to Light/Dark | ✓ |
| Minimal flat bar with crisp border | Solid background without blur | |
| You decide | Rounded pill synced with active X theme colors | |

**User's choice:** Floating rounded pill with backdrop blur, subtle shadow, and borders automatically synced to X's active theme (Light/Dark)

| Option | Description | Selected |
|--------|-------------|----------|
| Tactile 1.4× spring scale-up with overshoot bounce | Plays animation loop while hovered in Noto mode | ✓ |
| Subtle 1.15× scale with smooth easing | Linear smooth scale | |
| Fixed size without scale expansion | Background highlight only | |
| You decide | 1.4× spring scale with hover animation loop | |

**User's choice:** Tactile 1.4× spring scale-up with overshoot bounce (plays animation loop while hovered in Noto mode)

| Option | Description | Selected |
|--------|-------------|----------|
| Small rounded label tag above hovered emoji | Shows sentiment name (e.g. "Fire", "Haha", "Love") | ✓ |
| Clean icons only | No text label tags above emojis | |
| You decide | Subtle sentiment label tag above hovered emoji | |

**User's choice:** Small rounded label tag above hovered emoji showing sentiment name (e.g. "Fire", "Haha", "Love")

| Option | Description | Selected |
|--------|-------------|----------|
| Snappy spring entrance (0.85 → 1.0, 150ms slide-up) | Clean fade-out on dismiss | ✓ |
| Instant pop | 0ms entrance and exit without motion transitions | |
| You decide | Snappy 150ms spring slide-up with clean fade exit | |

**User's choice:** Snappy spring entrance: subtle slide-up + scale-in (0.85 → 1.0, 150ms) with clean fade-out on dismiss

---

## The Agent's Discretion
None — all options were explicitly decided by the user.

## Deferred Ideas
None — all discussed features fit within Phase 4 scope.
