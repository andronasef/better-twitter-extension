# Phase 4: Twemoji Reactions - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a Facebook-style floating reaction palette anchored to the Like button on tweets that prefills X's native reply composer with the selected emoji for manual user submission.
Includes 100% customizable palette slots, support for 3 emoji visual styles (Normal/System, Twemoji, Animated Google Noto Emojis), and a hybrid delivery model (statically bundled defaults + remote catalog browsing for new emojis with local storage caching).

</domain>

<decisions>
## Implementation Decisions

### Trigger & Hover Mechanics
- **D-01:** Standard 350ms hover delay with 300ms exit grace buffer on Like button to avoid accidental popups during fast timeline skimming. — **Reversibility:** reversible
- **D-02:** 500ms click-and-hold / touch-and-hold triggers palette on desktop and touch devices, suppressing native Like click when hold threshold is reached. — **Reversibility:** reversible
- **D-03:** Dismiss palette immediately on window/feed scroll, outside click, Escape key, or when the tweet node is unmounted by the feed virtualizer. — **Reversibility:** reversible
- **D-04:** Normal single click on the Like button performs the native X Like action as usual and immediately closes any open reaction palette. — **Reversibility:** reversible

### Reply Composer Target & Prefill Behavior
- **D-05:** Context-aware composer target: click the native Reply button on the tweet (`[data-testid="reply"]`), opening the modal composer on feeds/timelines or focusing the inline box on status permalinks. — **Reversibility:** reversible
- **D-06:** Focus composer and dispatch `document.execCommand('insertText', false, emoji + ' ')` with synthetic `InputEvent` fallback to ensure X's React/DraftJS editor updates its internal state and enables the native Reply button. — **Reversibility:** reversible
- **D-07:** Append emoji with trailing space to the end of any existing draft text, placing the caret at the very end so the user can continue typing. — **Reversibility:** reversible
- **D-08:** Fallback on failure: copy emoji to clipboard and show a discreet toast ("Replies unavailable — emoji copied to clipboard") if composer fails to open or replies are restricted. — **Reversibility:** reversible

### Emoji Palette Configuration
- **D-09:** 6 slots default: 👍 (thumbs up), ❤️ (heart), 😂 (laughing), 😮 (surprised), 😢 (sad), 🔥 (fire). — **Reversibility:** reversible
- **D-10:** Customization UI: dedicated "Reactions" panel in the extension popup (matching ThemesPanel & BookmarksPanel pattern) plus an optional "+" icon on the floating palette to open it. — **Reversibility:** reversible
- **D-11:** 3 emoji visual styles supported:
  1. **Normal Emojis**: System/OS native font rendering (zero asset overhead).
  2. **Twemoji Emojis**: Twitter classic Twemoji SVGs (matches X web aesthetic).
  3. **Animated Noto Emojis**: High-fidelity Google Noto Emoji Animation (WebP) from `https://googlefonts.github.io/noto-emoji-animation/`. — **Reversibility:** costly — defines asset format and rendering components
- **D-12:** 100% customizable palette: all 6 slots can be swapped, replaced, or reordered by the user. — **Reversibility:** reversible
- **D-13:** Hybrid delivery & caching: default palette assets bundled statically in extension package for zero-latency offline loading; remote catalog browsing in popup for discovering new emojis; chosen custom emojis cached in `chrome.storage.local`. — **Reversibility:** costly — storage schema and network caching
- **D-14:** Strictly fixed slots: palette displays the exact configured slots in user-defined order without dynamic slot shifting. — **Reversibility:** reversible

### Visual Styling & Animation
- **D-15:** Container styling: floating rounded pill with backdrop blur, subtle shadow, and borders automatically synced to X's active theme (Light/Dark/Lights Out). — **Reversibility:** reversible
- **D-16:** Emoji hover animation: 1.4× spring scale-up with overshoot bounce (`cubic-bezier(0.34, 1.56, 0.64, 1)`); plays continuous animation loop while hovered in Noto animated mode. — **Reversibility:** reversible
- **D-17:** Tooltip labels: small rounded sentiment label tag (e.g. "Like", "Love", "Haha", "Fire") above hovered emoji. — **Reversibility:** reversible
- **D-18:** Palette entrance/exit: snappy 150ms spring slide-up and scale-in (0.85 → 1.0) with clean fade exit on dismiss. — **Reversibility:** reversible

### The Agent's Discretion
None — user provided direct, explicit decisions for all gray areas and architecture requirements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Assets & Specifications
- `https://googlefonts.github.io/noto-emoji-animation/` — Official Google Fonts Animated Emoji web catalog and asset reference
- `https://github.com/googlefonts/noto-emoji-animation` — Source repository for Google Animated Noto Emoji WebP/Lottie/GIF assets
- `.planning/REQUIREMENTS.md` §REACT-01…06 — Canonical requirements for Twemoji Reactions
- `.planning/ROADMAP.md` §Phase 4 — Phase goals, scope, and success criteria
- `.planning/PROJECT.md` §Core Value & Scope — Prefill-only safety constraint and non-automation boundary

### Codebase Architecture & Pitfalls
- `.planning/research/FEATURES.md` §Twemoji reaction menu — Prefill vs auto-post risk assessment
- `.planning/research/PITFALLS.md` §Anti-Abuse Automation — Prohibition against automated sending or background submissions
- `.planning/research/STACK.md` §Twemoji & Animation — Bundled asset offline safety and Shadow DOM overlay architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/shadow-portal.tsx`: Provides shadow root container for Radix popovers and floating overlays, preventing host CSS contamination.
- `entrypoints/x.content/pipeline.ts`: Centralized timeline tweet observer (`onTweetSeen`), eliminates redundant `MutationObserver` instances.
- `entrypoints/popup/App.tsx` & `lib/registry.ts`: Category registry and popup routing; clean hook to register new `reactions` category tile and panel.
- `lib/theme.ts` & `entrypoints/x.content/theme-probe.ts`: Live theme detection and CSS custom properties (`--bt-theme-*`) for styling palette container.

### Established Patterns
- Pure CSS attribute tagging (`data-bt-reaction-attached`) on tweet nodes to guarantee idempotency across virtualizer recycling.
- ShadowRoot-contained React subtrees via `createShadowRootUi` in WXT.
- Type-safe persistent settings stored in `wxt/storage` (`browser.storage.local`).

### Integration Points
- `entrypoints/x.content/index.ts`: Content script entrypoint where the reactions controller registers with the tweet pipeline.
- `features/reactions/`: New feature package containing reaction palette controller, trigger listeners, and composer prefill injector.
- `entrypoints/popup/ReactionsPanel.tsx`: New popup settings panel for customizing slots, switching between Normal / Twemoji / Animated Noto styles, and browsing emojis.

</code_context>

<specifics>
## Specific Ideas
- 3 distinct emoji presentation modes configurable by user: Normal (system font), Twemoji (classic Twitter SVGs), Animated Noto (Google animated WebP).
- Fully customizable 6-slot palette with static bundle for defaults and remote browsing with local storage caching for custom selections.
- Clean prefill-only flow: clicking reaction opens X's native composer and prefills the emoji with trailing space, leaving sending 100% to the human user.

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed strictly within phase scope.

</deferred>

---

*Phase: 4-Twemoji Reactions*
*Context gathered: 2026-09-15*
