# Phase 2: Clean Timeline & Themes - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers clutter toggles and the full theme engine on top of the shared foundation established in Phase 1. Users can eliminate algorithmic and visual clutter (sidebar junk, vanity metrics, and "For You" feed annoyance) and restyle X using community themes, custom accent colors, or full vintage/minimal layouts. Every toggle operates independently and updates live via `chrome.storage.local` without requiring a page reload.

In scope: CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07.
Not in scope: Bookmark capture or UI (Phases 3-4), Twemoji reactions (Phase 5), Chrome Web Store submission packaging (Phase 6).
</domain>

<decisions>
## Implementation Decisions

### Vanity Metrics Presentation (CLEAN-05)
- **D-01:** When "Hide vanity metrics" is active, tweet action icons (Reply, Repost, Like, Bookmark, Share) remain visible and fully clickable, but all numeric count text is stripped. The Analytics / View Count icon and number are hidden completely. ? **Reversibility:** reversible
- **D-02:** On tweet detail / permalink pages (expanded tweet views), the dedicated stats block (e.g. "254 Reposts ? 12 Quotes ? 3.5K Likes") is stripped, preserving only the date and timestamp. ? **Reversibility:** reversible
- **D-03:** Follower and Following counts on user profile headers are governed by a separate sub-toggle ("Hide profile follower counts") under the Clean Timeline category rather than being forced by the tweet metric toggle. ? **Reversibility:** reversible
- **D-04:** Native hover tooltips on tweet action buttons are sanitized to clean action labels (e.g. "Like", "Repost", "Reply") with no numeric count text. ? **Reversibility:** reversible

### "For You" Tab & Right-Sidebar Clutter (CLEAN-02, CLEAN-03, CLEAN-04)
- **D-05:** Instead of hiding the "For You" tab outright by default, the extension swaps tab positions on `x.com/home` so that **Following** is placed first (on the left) and **For You** is placed second, and automatically activates the Following feed on navigation to `/home`. ? **Reversibility:** reversible
- **D-06:** An explicit sub-toggle ("Hide For You tab completely") is provided for users who wish to entirely eliminate the algorithmic tab from the header. ? **Reversibility:** reversible
- **D-07:** If the user has custom pinned Lists in their home feed tabs, tab reordering specifically swaps the default two tabs (Following and For You), preserving pinned Lists in their natural positions. ? **Reversibility:** reversible
- **D-08:** Right-sidebar clutter ("What's Happening" trends, "Who to Follow", and "Subscribe to Premium" / upsells) is bundled into a unified "Clean right sidebar" control in the popup, satisfying CLEAN-02 and CLEAN-03 with a single high-impact toggle. ? **Reversibility:** reversible

### Unified Theme & Layout Architecture (THEME-01?07)
- **D-09:** Theme and Layout are unified into one cohesive selection model ("layout and theme is one thing! not two separate things"). Users choose their active theme from a unified preset selector: Default, Dracula, Nord, Hacker/Matrix, Minimal, Old Twitter. ? **Reversibility:** costly ? drives theme registry, storage schema, and CSS architecture.
- **D-10:** Preset color themes (Dracula, Nord, Hacker/Matrix) enforce their signature dark backgrounds and palette tokens across all X surfaces regardless of whether X is in Light or Dark mode. ? **Reversibility:** reversible
- **D-11:** The Custom Accent Color (THEME-04) hex picker applies on top of the active background (Light, Dark, or themed), replacing X's blue accents (`#1d9bf0`) throughout buttons, active tabs, links, and focus rings. ? **Reversibility:** reversible
- **D-12:** The settings popup renders visual thumbnail preview cards for each theme preset in the theme selection panel so users see the aesthetic before applying. ? **Reversibility:** reversible
- **D-13:** FOUC prevention (THEME-07): Injected `<style id="bt-theme">` at `document_start` driven by cached theme state from storage, utilizing CSS custom properties for instant runtime updates without page reload or layout shift. ? **Reversibility:** costly ? critical timing contract for content scripts.

### Minimal Theme & Old Twitter Layout Details (THEME-05, THEME-06)
- **D-14:** **Minimal Theme (THEME-05)**: Centers the timeline feed in the viewport, completely hides the right sidebar, and collapses the left navigation bar to slim icons only for a distraction-free reading experience. ? **Reversibility:** reversible
- **D-15:** **Old Twitter Layout (THEME-06)**: Emulates the classic 2015 desktop layout:
  - 3-column desktop layout with classic proportions.
  - Left-column classic mini profile card (avatar, header banner, name, handle, and tweet/following/follower stats).
  - Discrete bordered tweet card containers with rounded corners.
  - Classic rounded-square user avatars (`border-radius: 4px/5px`) replacing circular avatars.
  - Horizontal top navigation bar styled like classic Twitter (Home, Notifications, Messages, Search, Tweet button). ? **Reversibility:** costly ? structural DOM/CSS transforms.

### Claude's Discretion
- Specific CSS variables and token names in the theme engine.
- Precise breakpoint handling for responsive column resizing in Old Twitter mode.
- Internal selector fallback chains for the new targets (trends box, who to follow box, detail stats block, tab container).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md` ? Core value, constraints (WXT/React/Tailwind/Radix, zero external font requests, local-only storage), out-of-scope list.
- `.planning/REQUIREMENTS.md` lines 22-39 ? CLEAN-02?05, THEME-01?07 requirements verbatim.
- `.planning/ROADMAP.md` ? "Phase 2: Clean Timeline & Themes" ? Goal, success criteria, and empirical spike requirements.

### Architecture & Foundation contracts
- `.planning/phases/01-foundation-settings-popup/01-CONTEXT.md` ? Prior decisions: D-06 (attribute hiding `data-bt-hidden` instead of removing React DOM nodes), D-12 (default toggle states), D-15 (zero outbound network requests), D-16 (`data-testid` selectors with miss reporting).
- `lib/selectors.ts` ? Selector resolution engine with `withFeature(...)` and miss reporting (FOUND-04).
- `lib/registry.ts` ? Feature and category registry driving popup category tiles and panels.
- `lib/theme.ts` ? Phase 1 X theme detector and storage cache.
- `lib/hide-style.ts` ? CSS attribute hiding utilities and `<style>` injection helpers.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/hide-style.ts`: Injects CSS hiding rules into document head; can be extended or mirrored for theme `<style id="bt-theme">` injection.
- `lib/selectors.ts`: Robust selector layer with `withFeature("cleanTimeline")` and miss reporting to the action badge.
- `lib/registry.ts`: Popup registry ready to register new categories (`clutter`, `themes`) or expand `timeline`.
- `lib/theme.ts`: Existing theme detection observer can be connected to the new theme engine.

### Established Patterns
- All hiding uses extension attributes (`data-bt-hidden`, etc.) and CSS rules rather than destroying or reparenting React DOM nodes.
- Settings changes broadcast automatically via `storage.onChanged` and apply live with no reload.
- Zero outbound network requests; everything self-contained and bundled.

### Integration Points
- `entrypoints/content.ts`: Injects early theme CSS at `document_start` to prevent FOUC, initializes clutter and theme observers.
- `entrypoints/popup/`: Theme selector panel with visual thumbnail cards and clutter toggle switches.
- `lib/registry.ts`: Add features for sidebar clutter, vanity metrics, profile counts, For You tab swap/hide, and themes.

</code_context>

<specifics>
## Specific Ideas

- Unified theme & layout concept: Theme is one unified selector (Default, Dracula, Nord, Matrix, Minimal, Old Twitter) plus an optional custom accent color.
- "For You" annoyance solved positively: Put "Following" first, select it automatically, and provide an option to hide "For You" if desired.
- Old Twitter nostalgia: Bring back the 2015 3-column feel with left profile widget, rounded-square avatars, bordered cards, and horizontal top bar.

</specifics>

<deferred>
## Deferred Ideas

- Full user-authored CSS palette editor (THEME-08) ? deferred to v2.
- Firefox / Safari multi-browser build (PLAT-01) ? deferred to v2.

</deferred>

---

*Phase: 2-Clean Timeline & Themes*
*Context gathered: 2026-09-13*
