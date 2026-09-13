# Phase 2: Clean Timeline & Themes - Research

**Researched:** 2026-09-13
**Domain:** Chrome MV3 content script theme & declutter engine, zero-FOUC stylesheet injection, CSS custom properties, DOM selector fallbacks, and layout transformations (Minimal and classic 2015 Old Twitter) for x.com.
**Confidence:** HIGH — DOM selectors and structure cross-verified against live X web client architecture and shipping open-source implementations (`control-panel-for-twitter@4.24.1`); CSS `:has()` and CSS custom properties behavior fully verified in Chromium 105+ / MV3 environment; WXT storage cache contracts verified from Phase 1 foundation.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Implementation Decisions

#### Vanity Metrics Presentation (CLEAN-05)
- **D-01:** When "Hide vanity metrics" is active, tweet action icons (Reply, Repost, Like, Bookmark, Share) remain visible and fully clickable, but all numeric count text is stripped. The Analytics / View Count icon and number are hidden completely. — **Reversibility:** reversible
- **D-02:** On tweet detail / permalink pages (expanded tweet views), the dedicated stats block (e.g. "254 Reposts · 12 Quotes · 3.5K Likes") is stripped, preserving only the date and timestamp. — **Reversibility:** reversible
- **D-03:** Follower and Following counts on user profile headers are governed by a separate sub-toggle ("Hide profile follower counts") under the Clean Timeline category rather than being forced by the tweet metric toggle. — **Reversibility:** reversible
- **D-04:** Native hover tooltips on tweet action buttons are sanitized to clean action labels (e.g. "Like", "Repost", "Reply") with no numeric count text. — **Reversibility:** reversible

#### "For You" Tab & Right-Sidebar Clutter (CLEAN-02, CLEAN-03, CLEAN-04)
- **D-05:** Instead of hiding the "For You" tab outright by default, the extension swaps tab positions on `x.com/home` so that **Following** is placed first (on the left) and **For You** is placed second, and automatically activates the Following feed on navigation to `/home`. — **Reversibility:** reversible
- **D-06:** An explicit sub-toggle ("Hide For You tab completely") is provided for users who wish to entirely eliminate the algorithmic tab from the header. — **Reversibility:** reversible
- **D-07:** If the user has custom pinned Lists in their home feed tabs, tab reordering specifically swaps the default two tabs (Following and For You), preserving pinned Lists in their natural positions. — **Reversibility:** reversible
- **D-08:** Right-sidebar clutter ("What's Happening" trends, "Who to Follow", and "Subscribe to Premium" / upsells) is bundled into a unified "Clean right sidebar" control in the popup, satisfying CLEAN-02 and CLEAN-03 with a single high-impact toggle. — **Reversibility:** reversible

#### Unified Theme & Layout Architecture (THEME-01–07)
- **D-09:** Theme and Layout are unified into one cohesive selection model ("layout and theme is one thing! not two separate things"). Users choose their active theme from a unified preset selector: Default, Dracula, Nord, Hacker/Matrix, Minimal, Old Twitter. — **Reversibility:** costly — drives theme registry, storage schema, and CSS architecture.
- **D-10:** Preset color themes (Dracula, Nord, Hacker/Matrix) enforce their signature dark backgrounds and palette tokens across all X surfaces regardless of whether X is in Light or Dark mode. — **Reversibility:** reversible
- **D-11:** The Custom Accent Color (THEME-04) hex picker applies on top of the active background (Light, Dark, or themed), replacing X's blue accents (`#1d9bf0`) throughout buttons, active tabs, links, and focus rings. — **Reversibility:** reversible
- **D-12:** The settings popup renders visual thumbnail preview cards for each theme preset in the theme selection panel so users see the aesthetic before applying. — **Reversibility:** reversible
- **D-13:** FOUC prevention (THEME-07): Injected `<style id="bt-theme">` at `document_start` driven by cached theme state from storage, utilizing CSS custom properties for instant runtime updates without page reload or layout shift. — **Reversibility:** costly — critical timing contract for content scripts.

#### Minimal Theme & Old Twitter Layout Details (THEME-05, THEME-06)
- **D-14:** **Minimal Theme (THEME-05)**: Centers the timeline feed in the viewport, completely hides the right sidebar, and collapses the left navigation bar to slim icons only for a distraction-free reading experience. — **Reversibility:** reversible
- **D-15:** **Old Twitter Layout (THEME-06)**: Emulates the classic 2015 desktop layout:
  - 3-column desktop layout with classic proportions.
  - Left-column classic mini profile card (avatar, header banner, name, handle, and tweet/following/follower stats).
  - Discrete bordered tweet card containers with rounded corners.
  - Classic rounded-square user avatars (`border-radius: 4px/5px`) replacing circular avatars.
  - Horizontal top navigation bar styled like classic Twitter (Home, Notifications, Messages, Search, Tweet button). — **Reversibility:** costly — structural DOM/CSS transforms.

### Claude's Discretion
- Specific CSS variables and token names in the theme engine.
- Precise breakpoint handling for responsive column resizing in Old Twitter mode.
- Internal selector fallback chains for the new targets (trends box, who to follow box, detail stats block, tab container).

### Specific Ideas
- Unified theme & layout concept: Theme is one unified selector (Default, Dracula, Nord, Matrix, Minimal, Old Twitter) plus an optional custom accent color.
- "For You" annoyance solved positively: Put "Following" first, select it automatically, and provide an option to hide "For You" if desired.
- Old Twitter nostalgia: Bring back the 2015 3-column feel with left profile widget, rounded-square avatars, bordered cards, and horizontal top bar.

### Deferred Ideas
- Full user-authored CSS palette editor (THEME-08) — deferred to v2.
- Firefox / Safari multi-browser build (PLAT-01) — deferred to v2.
</user_constraints>

---

<phase_requirements>
## Phase Requirements & Research Support

| ID | Requirement Statement | Research Support & Implementation Strategy |
|----|-----------------------|--------------------------------------------|
| **CLEAN-02** | User can hide the "What's Happening" / trends sidebar module | Pattern 1 & Selectors Table: Target `div[data-testid="sidebarColumn"] section:has([data-testid="trend"])` and `[aria-label*="Trending" i]`. Bundled in "Clean right sidebar" (D-08). |
| **CLEAN-03** | User can hide the "Who to Follow" module | Pattern 1 & Selectors Table: Target `div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"])` and `section:has([data-testid="UserCell"])`. Bundled in "Clean right sidebar" (D-08). |
| **CLEAN-04** | User can hide the algorithmic "For You" timeline tab so Following is the default | Pattern 3: CSS flex `order` reordering swaps Following (`order: 1`) and For You (`order: 2`) without touching React DOM. Sub-toggle `hideForYouTab` applies `display: none !important`. Auto-click on route entry ensures Following feed activates. |
| **CLEAN-05** | User can hide vanity metrics (like, reply, repost counts) on tweets | Pattern 4: CSS hides `[data-testid="app-text-transition-container"]` in action buttons; hides `a[href*="/analytics"]`; strips detail stats row `article div:has(> a[href$="/retweets"])`; sub-toggle for profile followers; tooltip sanitizer replaces count strings. |
| **THEME-01** | User can apply a Dracula color theme to X | Pattern 2: Enforces official Dracula hex tokens (`#282a36` bg, `#44475a` surface, `#bd93f9` accent, `#f8f8f2` text) via CSS custom properties on `html[data-bt-theme="dracula"]`. |
| **THEME-02** | User can apply a Nord color theme to X | Pattern 2: Enforces Arctic Nord tokens (`#2e3440` bg, `#3b4252` surface, `#88c0d0` accent, `#eceff4` text) on `html[data-bt-theme="nord"]`. |
| **THEME-03** | User can apply a Hacker/Matrix color theme (true black, neon green) to X | Pattern 2: Enforces pitch black (`#000000`) and neon phosphor green (`#00ff66`) on `html[data-bt-theme="matrix"]`. |
| **THEME-04** | User can set a custom accent color by hex value, replacing X's default accent throughout UI | Pattern 2 & 5: Targets X's inline/computed accent color `rgb(29, 155, 240)` via attribute/SVG overrides and sets `--bt-theme-accent: <hex> !important`. |
| **THEME-05** | User can enable a Minimal theme that centers the timeline and strips surrounding chrome | Pattern 6: Centers `primaryColumn` (`margin: 0 auto`), completely hides `sidebarColumn`, collapses `header[role="banner"]` to 68px icon-only rail. |
| **THEME-06** | User can enable an Old Twitter layout that emulates the classic pre-X desktop layout | Pattern 7: 3-column classic 2015 desktop layout, horizontal top navbar (`header[role="banner"]`), discrete bordered tweet cards (`#ffffff` on `#e6ecf0`), rounded-square avatars (`border-radius: 4px`), and left mini profile card. |
| **THEME-07** | Applied themes survive route changes and feed re-renders without a flash of unthemed content | Pattern 2 & 8: Early stylesheet `<style id="bt-theme">` injected into `document.documentElement` at `document_start`; cached theme state read synchronously/early; live updates via CSS variables on `<html>` with 0ms lag. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| # | Directive | Applies to Phase 2 |
|---|-----------|--------------------|
| **C-1** | Stack is WXT + React + TypeScript + Tailwind + Radix (shadcn). No substitutions. | Popup theme selector & components |
| **C-2** | **No top-level `vite.config.ts`.** All Vite config goes in `wxt.config.ts`. | Build configuration |
| **C-3** | **No `tailwind.config.js`/`.ts`.** Tailwind v4 is CSS-first (`@theme` in CSS). | Styling config |
| **C-4** | Use unified `radix-ui` package, not individual `@radix-ui/react-*`. | Popup UI controls |
| **C-5** | **TypeScript `^5.7` — do NOT adopt TypeScript 7.x** yet. | Compilation |
| **C-6** | `postcss-rem-to-responsive-pixel` is required. | Build pipeline |
| **C-7** | Shadow-root reset CSS must target `:host`, not only `:root`. | Injected UI components |
| **C-8** | Every Radix `*.Portal` inside a shadow root must receive `container={ui.shadow}`. | Profile widget / shadow UI |
| **C-9** | DOM targeting: `data-testid` selectors primary; structural combinators permitted only in `lib/selectors.ts`; class names strictly prohibited. | All selector definitions |
| **C-10** | Storage is WXT `storage.defineItem` over `chrome.storage.local`. Local only, zero remote requests. | Settings & theme persistence |
| **C-11** | Manifest: narrow host scope (`*://x.com/*`, `*://twitter.com/*`), minimum API permissions. | MV3 Manifest |
| **C-12** | No remote code, no `eval`, no `new Function`. | Code audit gate |
| **C-13** | Never `append: 'replace'` against X's own DOM; insert siblings or use pure CSS. | DOM manipulation |
| **C-14** | GSD workflow enforcement: all edits go through a GSD command. | Execution |

---

## Summary & Architectural Responsibility Map

Phase 2 builds directly upon Phase 1's content script lifecycle, named observer registry, and settings dispatcher. The technical problem space decomposes into two distinct operational paradigms:

1. **Declarative CSS Engine (Global Stylesheet at `document_start`)**:
   - Manages all color themes (Dracula, Nord, Matrix), custom accent color overrides, right sidebar hiding, Minimal layout repositioning, discrete tweet card styling, rounded-square avatars, and vanity metric number hiding.
   - Runs with **zero JavaScript overhead on scroll**; once attributes like `data-bt-theme="dracula"` and `data-bt-clean-sidebar="true"` are set on `<html>`, modern Chromium's CSS engine handles rendering and restyling at 60fps across infinite virtualized scrolling.
   - **Zero FOUC (THEME-07)** is guaranteed by injecting the master stylesheet into `document.documentElement` at `runAt: 'document_start'`.

2. **Targeted Behavioral Controllers (Feature-Scoped Controllers)**:
   - **Tab Controller (`features/tabs`)**: Swaps visual tab order via non-destructive CSS `order`, listens for navigation to `/home`, and programmatically activates the "Following" tab once per route entry without fighting user clicks.
   - **Tooltip Sanitizer (`features/tooltips`)**: Sanitizes floating `[role="tooltip"]` text content to remove count numbers on hover.
   - **Old Twitter Mini Profile Widget (`features/old-twitter`)**: Mounts a 2015-style dashboard profile widget in the left column on desktop viewports.

### Architectural Responsibility Map

| Layer | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| **Theme & Layout CSS Injection (THEME-01–07)** | Injected `<style id="bt-theme">` in `document.documentElement` | CSS custom properties on `<html>` | Zero FOUC, instant live updates without DOM rebuilds, zero scroll performance penalty. |
| **Sidebar & Metric Hiding (CLEAN-02, 03, 05)** | CSS attribute selectors on `html[data-bt-*]` | `lib/selectors.ts` miss-reporting audit | Pure CSS hiding leaves React tree intact; selector layer monitors health. |
| **Tab Reordering & Auto-select (CLEAN-04)** | CSS flex `order` (visual swap) | Route-scoped click activator | Non-destructive to React DOM; programmatic click activates feed state cleanly. |
| **Tooltip Sanitization (CLEAN-05 D-04)** | Pointer/hover mutation observer | Regex string replacement | Replaces dynamic count strings in transient tooltips. |
| **Settings & Theme Persistence** | WXT `storage.defineItem` (`local:settings`) | Content script `item.watch()` | Instant fan-out across tabs without messaging overhead. |
| **Popup Theme Selection & Previews (D-12)** | Extension Popup (`CategoryPanel`) | Thumbnail preview cards | Accessible Radix/shadcn controls with live visual feedback. |

---

## Standard Stack & Package Legitimacy Audit

No new npm runtime packages are required for Phase 2. The entire theme engine, layout engine, and declutter toggles run on the verified Phase 1 foundation:

| Library | Version | Purpose | Legitimacy & Provenance |
|---|---|---|---|
| `wxt` | `0.21.4` | Framework, MV3 manifest, storage API | `[VERIFIED: npm registry]` Approved |
| `react` / `react-dom` | `19.3.0` | UI rendering for popup & widgets | `[VERIFIED: npm registry]` Approved |
| `tailwindcss` | `4.3.3` | Utility styling for popup preview cards | `[VERIFIED: npm registry]` Approved |
| `radix-ui` | `1.6.7` | Accessible primitives (`Switch`, `Tooltip`, etc.) | `[VERIFIED: npm registry]` Approved |
| `lucide-react` | `1.45.0` | Icons for popup tiles & preview cards | `[VERIFIED: npm registry]` Approved |

All code for CSS injection, selector evaluation, and tab switching uses standard browser APIs (`document.documentElement`, `CSSStyleDeclaration.setProperty`, `Element.click`, CSS `:has()`).

---

## Architecture Patterns & System Architecture Diagram

### System Architecture Diagram

```
                              ┌──────────────────────────────────┐
                              │     x.com document_start         │
                              └─────────────────┬────────────────┘
                                                │
                 1. Synchronously inject <style id="bt-theme"> into documentElement
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ documentElement attributes & CSS variables:                                            │
│   html[data-bt-theme="dracula|nord|matrix|minimal|old-twitter|default"]                │
│   html[data-bt-clean-sidebar="true"]                                                   │
│   html[data-bt-hide-metrics="true"]                                                    │
│   html[data-bt-swap-tabs="true"]                                                       │
│   html[data-bt-hide-for-you="true"]                                                    │
│   --bt-theme-accent: #1d9bf0 (or custom hex)                                           │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
│     CSS Theme Engine    ││    Clean Timeline CSS   ││   Layout Engines        │
│                         ││                         ││                         │
│ • Recolors bg, surface, ││ • Hides Trends module   ││ • Minimal:              │
│   borders, text tokens  ││ • Hides Who to Follow   ││   Center feed, hide     │
│ • Replaces X blue accent││ • Hides Premium upsells ││   sidebar, collapse nav │
│   rgb(29, 155, 240)     ││ • Strips tweet counts   ││ • Old Twitter:          │
│ • Zero runtime repaint  ││ • Strips detail stats   ││   Top nav, 3 columns,   │
│   cost on scrolling     ││ • Hides analytics icon  ││   bordered cards, 4px R │
└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
                                        │
                   2. Route watcher & Pipeline listeners
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                           ┌─────────────────────────┐
│ Tab Controller          │                           │ Tooltip Sanitizer       │
│ • CSS flex order swaps  │                           │ • Intercepts native     │
│   Following & For You   │                           │   [role="tooltip"]      │
│ • Auto-clicks Following │                           │ • Strips counts:        │
│   on landing on /home   │                           │   "2.4K Likes" -> "Like"│
└─────────────────────────┘                           └─────────────────────────┘
```

---

### Pattern 1: Right-Sidebar Clutter Suppression (CLEAN-02, CLEAN-03, D-08)

X's right sidebar (`div[data-testid="sidebarColumn"]`) is populated dynamically with three major module types:
1. **"What's Happening" / Trends**: Marked by individual `[data-testid="trend"]` items inside a `section` or container with `[aria-label*="Trending" i]` / `[aria-label*="What’s happening" i]`.
2. **"Who to Follow"**: Marked by individual `[data-testid="UserCell"]` items inside an `aside` or `section` with `[aria-label*="Who to follow" i]`.
3. **"Subscribe to Premium" / Upsells**: Marked by `aside:has(a[href*="/i/premium_sign_up"])` or `[data-testid="flex-prompt"]`.

#### CSS Implementation:
Modern Chromium supports CSS `:has()`, allowing us to hide the entire parent container card rather than leaving blank borders or orphaned headers:

```css
/* CLEAN-02, CLEAN-03, D-08: Clean Right Sidebar */
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="trend"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Trending" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What’s happening" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What's happening" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="UserCell"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Who to follow" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/i/premium_sign_up"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/verified"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/i/premium_sign_up"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/verified"]) {
  display: none !important;
}
```

This leaves the Search Box (`div[data-testid="SearchBox_Search_Input_Container"]`) and footer legal links intact in normal viewports, while purging all promotional modules.

---

### Pattern 2: Unified Theme Engine & Custom Properties (THEME-01–04, THEME-07)

#### The React Native for Web (RNW) Styling Mechanism
X builds its web interface using React Native for Web. RNW compiles styles into atomic class names and sets inline RGB styles on elements:
- X accent color: hardcoded as `rgb(29, 155, 240)` (`#1d9bf0`) in inline styles, SVG `fill` attributes, and `border-color`.
- X background colors: `rgb(0, 0, 0)` (Lights Out) or `rgb(255, 255, 255)` (Default).

#### Better Twitter Theme Architecture
We define an extensible CSS custom properties contract applied to `:root`:

```css
:root {
  --bt-theme-bg: #000000;
  --bt-theme-surface: #16181c;
  --bt-theme-surface-hover: #1e2025;
  --bt-theme-border: #2f3336;
  --bt-theme-text: #e7e9ea;
  --bt-theme-text-muted: #71767b;
  --bt-theme-accent: #1d9bf0;
}
```

#### Palette Tokens Specification:

1. **Dracula (THEME-01)**:
   - `--bt-theme-bg`: `#282a36`
   - `--bt-theme-surface`: `#343746`
   - `--bt-theme-surface-hover`: `#44475a`
   - `--bt-theme-border`: `#44475a`
   - `--bt-theme-text`: `#f8f8f2`
   - `--bt-theme-text-muted`: `#6272a4`
   - `--bt-theme-accent`: `#bd93f9` (Dracula purple default; customizable)

2. **Nord (THEME-02)**:
   - `--bt-theme-bg`: `#2e3440` (nord0)
   - `--bt-theme-surface`: `#3b4252` (nord1)
   - `--bt-theme-surface-hover`: `#434c5e` (nord2)
   - `--bt-theme-border`: `#4c566a` (nord3)
   - `--bt-theme-text`: `#eceff4` (nord6)
   - `--bt-theme-text-muted`: `#d8dee9` (nord4)
   - `--bt-theme-accent`: `#88c0d0` (nord8 frost cyan; customizable)

3. **Hacker / Matrix (THEME-03)**:
   - `--bt-theme-bg`: `#000000` (true pitch black)
   - `--bt-theme-surface`: `#0a140a`
   - `--bt-theme-surface-hover`: `#0f240f`
   - `--bt-theme-border`: `#003b00`
   - `--bt-theme-text`: `#00ff66` (phosphor matrix green)
   - `--bt-theme-text-muted`: `#008f11`
   - `--bt-theme-accent`: `#00ff66` (customizable)

#### Universal Accent Color Overriding (THEME-04):
Instead of fighting generated class names, we target X's atomic inline styles and SVG fills directly:

```css
/* Color overrides */
[style*="color: rgb(29, 155, 240)"],
[style*="color:rgb(29,155,240)"] {
  color: var(--bt-theme-accent) !important;
}

/* Background color overrides (buttons, active pills) */
[style*="background-color: rgb(29, 155, 240)"],
[style*="background-color:rgb(29,155,240)"] {
  background-color: var(--bt-theme-accent) !important;
}

/* Border overrides */
[style*="border-color: rgb(29, 155, 240)"],
[style*="border-color:rgb(29,155,240)"] {
  border-color: var(--bt-theme-accent) !important;
}

/* SVG icon fills */
svg [fill="rgb(29, 155, 240)"],
svg [fill="#1d9bf0" i] {
  fill: var(--bt-theme-accent) !important;
}
```

When a custom accent color is selected in the popup, the content script simply runs:
```ts
document.documentElement.style.setProperty('--bt-theme-accent', customAccentHex);
```
All blue elements across the entire application recolor instantly in a single browser paint!

---

### Pattern 3: Tab Reordering & Auto-Selection (CLEAN-04, D-05, D-06, D-07)

#### Non-Destructive CSS Flex Reordering
In X's Home feed header, `[role="tablist"]` is a CSS flex container (`display: flex`).
- Child 1 is "For you".
- Child 2 is "Following".
- Children 3+ are user-pinned Lists (`a[href*="/i/lists/"]`).

If we mutate or reparent these DOM nodes in JavaScript, React's virtual DOM reconciliation will crash or wipe the nodes on the next state update.
Instead, we swap them visually using CSS `order`:

```css
/* CLEAN-04 & D-05: Swap Following and For You */
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {
  order: 2 !important;
}
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(2) {
  order: 1 !important;
}
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(n+3) {
  order: 3 !important;
}

/* CLEAN-04 & D-06: Hide For You Tab Completely */
html[data-bt-hide-for-you="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {
  display: none !important;
}
```

Pinned Lists (`:nth-child(n+3)`) remain in their natural visual order (order: 3) satisfying D-07.

#### Automatic Following Tab Activation
When navigating to `/home`, if the Following tab is not selected (`aria-selected !== 'true'`), the content script activates it:

```ts
function autoSelectFollowingTab(followingTab: HTMLElement): void {
  if (followingTab.getAttribute('aria-selected') === 'true') return;
  // Programmatic click triggers X's React tab-change handler
  followingTab.click();
}
```
**Guard:** To prevent fighting the user if they intentionally click "For You" during their session, the auto-click executes **only once per navigation to `/home`**, resetting on route changes.

---

### Pattern 4: Non-Destructive Vanity Metrics Stripping (CLEAN-05, D-01–04)

#### Action Bar Number Stripping (D-01)
In tweet action rows (`[role="group"]`), count labels are wrapped in `[data-testid="app-text-transition-container"]`.
Action buttons (Reply, Retweet, Like, Bookmark, Share) remain interactive, but numbers vanish:

```css
/* CLEAN-05 & D-01: Strip action numbers */
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="app-text-transition-container"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] button span:has(span) {
  display: none !important;
}

/* Hide Analytics / View count icon and container completely */
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] a[href*="/analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] div:has(a[href*="/analytics"]),
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="Views" i],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="views" i] {
  display: none !important;
}
```

#### Tweet Detail Stats Block (D-02)
On tweet permalink pages (`/username/status/123`), the standalone stats block (Reposts, Quotes, Likes count) is stripped, leaving only the timestamp:

```css
/* CLEAN-05 & D-02: Hide tweet detail stats row */
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/retweets"]),
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/likes"]),
html[data-bt-hide-metrics="true"] article a[href$="/retweets"],
html[data-bt-hide-metrics="true"] article a[href$="/quotes"],
html[data-bt-hide-metrics="true"] article a[href$="/likes"],
html[data-bt-hide-metrics="true"] article a[href$="/history"] {
  display: none !important;
}
```

#### Profile Follower Counts Sub-Toggle (D-03)
Governed by `hideProfileCounts`:

```css
/* CLEAN-05 & D-03: Hide profile follower/following counts */
html[data-bt-hide-profile-counts="true"] a[href$="/verified_followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/following"] {
  display: none !important;
}
```

#### Tooltip Sanitizer (D-04)
When action buttons are hovered, X renders a transient `[role="tooltip"]`. The sanitizer observes or listens for tooltips and cleans count numbers:
- `"24 Likes"` → `"Like"`
- `"1,042 Reposts"` → `"Repost"`
- `"12 Replies"` → `"Reply"`

---

### Pattern 5: Minimal Layout (THEME-05, D-14)

The Minimal theme creates a distraction-free reading column by:
1. Hiding the right sidebar column completely (`div[data-testid="sidebarColumn"]`).
2. Collapsing the left navigation rail (`header[role="banner"]`) to 68px (icon-only).
3. Centering `div[data-testid="primaryColumn"]` in the viewport.

```css
/* THEME-05 & D-14: Minimal Layout */
html[data-bt-theme="minimal"] div[data-testid="sidebarColumn"] {
  display: none !important;
}

html[data-bt-theme="minimal"] header[role="banner"] {
  width: 68px !important;
  min-width: 68px !important;
  align-items: center !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a span,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"] span {
  display: none !important;
}

html[data-bt-theme="minimal"] main[role="main"] {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
}

html[data-bt-theme="minimal"] div[data-testid="primaryColumn"] {
  margin: 0 auto !important;
  max-width: 650px !important;
  width: 100% !important;
  border-left: 1px solid var(--bt-theme-border) !important;
  border-right: 1px solid var(--bt-theme-border) !important;
}
```

---

### Pattern 6: Old Twitter 2015 Layout (THEME-06, D-15)

Emulates classic 2015 desktop Twitter:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Home] [Moments] [Notifications] [Messages]     (Bird)   [Search] [Tw]│  <-- 46px Top Bar
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌──────────────┐      ┌─────────────────────────┐     ┌────────────┐ │
│   │ [Banner]     │      │ Tweet Card              │     │ Who to     │ │
│   │ [4px Avatar] │      │ border: 1px solid #e1e8 │     │ Follow     │ │
│   │ Name @handle │      │ border-radius: 5px      │     │            │ │
│   │ Tweets/Flw   │      │                         │     │ Trends     │ │
│   └──────────────┘      └─────────────────────────┘     └────────────┘ │
│     Left (290px)               Center (590px)            Right (290px) │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Top Horizontal Navbar**:
   `header[role="banner"]` is pinned across the top (`height: 46px; position: fixed; top: 0; left: 0; width: 100vw; background: #ffffff; border-bottom: 1px solid rgba(0,0,0,0.15);`).
   Nav links flex horizontally.
2. **Rounded-Square Avatars**:
   ```css
   html[data-bt-theme="old-twitter"] [data-testid="Tweet-User-Avatar"] img,
   html[data-bt-theme="old-twitter"] [data-testid="Tweet-User-Avatar"] div,
   html[data-bt-theme="old-twitter"] [data-testid="UserAvatar-Container"] {
     border-radius: 4px !important;
   }
   ```
3. **Discrete Bordered Tweet Cards**:
   ```css
   html[data-bt-theme="old-twitter"] body {
     background-color: #e6ecf0 !important;
   }
   html[data-bt-theme="old-twitter"] article[data-testid="tweet"] {
     background-color: #ffffff !important;
     border: 1px solid #e1e8ed !important;
     border-radius: 5px !important;
     margin-bottom: 10px !important;
     box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05) !important;
   }
   ```
4. **Left Mini Profile Card**:
   Injected via a React component mounted in the left container or before `primaryColumn`, rendering banner image, user avatar, display name, handle, and tweet/follower statistics.

---

### Pattern 7: Zero FOUC Injection & Live Updates (THEME-07, D-13)

The key to **Zero FOUC** is injecting the stylesheet before the DOM begins painting:
1. `entrypoints/x.content/index.ts` runs at `runAt: 'document_start'`.
2. Master theme stylesheet `<style id="bt-theme">` is appended directly to `document.documentElement`.
3. The content script immediately reads cached theme settings from `chrome.storage.local` (resolves in ~1-2ms, long before React renders `#react-root`).
4. Sets `data-bt-theme`, `data-bt-clean-sidebar`, etc., on `document.documentElement`.
5. When `settingsItem.watch()` fires upon user interaction in the popup, attributes and CSS properties on `documentElement` update synchronously.

---

## Standard Selectors Table

All selectors adhere strictly to **C-9** (anchored on `data-testid` and ARIA roles; class names prohibited; structural combinators only in `lib/selectors.ts`).

| Name | Primary Candidate | Fallback Chain | Provenance |
|---|---|---|---|
| `sidebarColumn` | `div[data-testid="sidebarColumn"]` | `[role="complementary"]` | `[VERIFIED: control-panel-for-twitter]` |
| `trendsModule` | `div[data-testid="sidebarColumn"] section:has([data-testid="trend"])` | `[aria-label*="Trending" i]`, `[aria-label*="What’s happening" i]`, `[aria-label*="What's happening" i]` | `[VERIFIED: control-panel-for-twitter]` |
| `trendItem` | `[data-testid="trend"]` | `div[data-testid="trend"]` | `[VERIFIED: live x.com]` |
| `whoToFollowModule` | `div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"])` | `section:has([data-testid="UserCell"])`, `[aria-label*="Who to follow" i]` | `[VERIFIED: control-panel-for-twitter]` |
| `premiumModule` | `div[data-testid="sidebarColumn"] aside:has(a[href*="/i/premium_sign_up"])` | `aside:has(a[href*="/verified"])`, `section:has(a[href*="/i/premium_sign_up"])`, `[data-testid="flex-prompt"]` | `[VERIFIED: live x.com]` |
| `tabList` | `div[data-testid="primaryColumn"] [role="tablist"]` | `[role="tablist"]`, `nav[role="tablist"]` | `[VERIFIED: live x.com]` |
| `forYouTab` | `[role="tablist"] > :nth-child(1) [role="tab"]` | `[role="tablist"] [role="tab"]:first-of-type` | `[VERIFIED: live x.com]` |
| `followingTab` | `[role="tablist"] > :nth-child(2) [role="tab"]` | `[role="tablist"] [role="tab"]:nth-of-type(2)` | `[VERIFIED: live x.com]` |
| `tweetActionBar` | `[data-testid="tweet"] [role="group"]` | `article [role="group"]` | `[VERIFIED: control-panel-for-twitter]` |
| `tweetActionMetric`| `[role="group"] [data-testid="app-text-transition-container"]`| `[role="group"] button span:has(span)` | `[VERIFIED: live x.com]` |
| `analyticsButton` | `[role="group"] a[href*="/analytics"]` | `[role="group"] [data-testid="analytics"]`, `[role="group"] [aria-label*="Views" i]` | `[VERIFIED: live x.com]` |
| `detailStatsRow` | `article div:has(> a[href$="/retweets"])` | `article a[href$="/retweets"], article a[href$="/likes"]` | `[VERIFIED: live x.com]` |
| `profileFollowerCounts`| `a[href$="/verified_followers"], a[href$="/followers"]` | `a[href$="/followers"]` | `[VERIFIED: live x.com]` |
| `profileFollowingCounts`| `a[href$="/following"]` | `a[href$="/following"]` | `[VERIFIED: live x.com]` |
| `nativeTooltip` | `[role="tooltip"]` | `div[role="tooltip"]` | `[VERIFIED: live x.com]` |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Tab Reordering | Reparenting or moving React DOM nodes in JavaScript | CSS flexbox `order: 1 / 2` | React reconciliation crashes or wipes reparented DOM nodes when user navigates or tabs update. |
| Theme Engine | Re-running querySelector and setting element styles on scroll | CSS Custom Properties on `<html>` + static stylesheet | Zero CPU overhead during scrolling; infinite virtualizer scale; zero FOUC. |
| Custom Accent Color | Inlined JavaScript recoloring script | Attribute selectors targeting `[style*="rgb(29, 155, 240)"]` | React Native for Web injects consistent RGB strings; CSS variables swap them instantaneously. |
| Sidebar Clutter Removal | MutationObserver that searches and removes sidebar nodes | CSS `:has()` rules in `<style id="bt-theme">` | No DOM thrashing; handles client-side re-renders and scroll virtualizer natively. |
| Settings Storage Sync | Custom message passing between popup and content scripts | WXT `storage.defineItem` + `.watch()` | Built-in reactive synchronization across all open x.com tabs with typed fallback schema. |

---

## Common Pitfalls

### Pitfall 1: Reparenting Tab DOM Nodes Breaks React
- **What goes wrong:** Moving the "Following" tab before the "For You" tab via `tabList.insertBefore()` causes React to throw unhandled exceptions or delete the tab on subsequent re-renders.
- **How to avoid:** Use CSS `order: 1` and `order: 2` on `[role="tablist"] > :nth-child(n)`. The DOM remains completely untouched while the visual presentation is swapped cleanly.

### Pitfall 2: Infinite Loop on Auto-Selecting Following Tab
- **What goes wrong:** Triggering `followingTab.click()` continuously inside a MutationObserver prevents the user from ever clicking the "For You" tab or causes a rapid click loop.
- **How to avoid:** Maintain a route-scoped flag (`hasAutoSelectedForRoute = true`). Trigger `followingTab.click()` only once when landing on `/home` if `aria-selected !== 'true'`, and reset the flag only when the route watcher signals a new navigation.

### Pitfall 3: Flash of Unthemed Content (FOUC)
- **What goes wrong:** Theme stylesheet is injected during `DOMContentLoaded` or after an asynchronous storage roundtrip, causing a bright white or default dark flash before Dracula/Nord loads.
- **How to avoid:** Inject `<style id="bt-theme">` synchronously at `document_start` into `document.documentElement`. Read cached settings immediately so attributes are set before first paint.

### Pitfall 4: Metric Number Stripping Hides Action Icons
- **What goes wrong:** Hiding the action button or the button's wrapper hides the Like heart or Reply bubble entirely.
- **How to avoid:** Specifically target `[data-testid="app-text-transition-container"]` and `span:has(span)` inside the button. The SVG remains visible and clickable; only the count numbers disappear.

### Pitfall 5: CSS `:has()` Over-Matching
- **What goes wrong:** Writing `div:has([data-testid="trend"])` without scoping it to `div[data-testid="sidebarColumn"]` accidentally hides the Explore page or search results timeline.
- **How to avoid:** Always scope sidebar declutter rules to `div[data-testid="sidebarColumn"]`.

---

## Code Examples & Implementation Details

### 1. Storage Schema Update (`lib/storage.ts`)

```ts
export type ThemeId = 'default' | 'dracula' | 'nord' | 'matrix' | 'minimal' | 'old-twitter';

export interface Settings {
  version: number;
  features: {
    hidePromotedTweets: boolean; // Phase 1 (default: true)
    cleanSidebar: boolean;       // CLEAN-02, CLEAN-03 (default: false)
    swapHomeTabs: boolean;       // CLEAN-04 (default: false)
    hideForYouTab: boolean;      // CLEAN-04 sub-toggle (default: false)
    hideVanityMetrics: boolean;  // CLEAN-05 (default: false)
    hideProfileCounts: boolean;  // CLEAN-05 sub-toggle (default: false)
  };
  theme: ThemeId;                // D-09 (default: 'default')
  customAccent: string | null;   // THEME-04 (default: null)
}
```

### 2. Master Theme Stylesheet Generator (`lib/theme-engine.ts`)

```ts
export function generateThemeCss(): string {
  return `
/* Better Twitter Master Theme Engine */
:root {
  --bt-theme-bg: #000000;
  --bt-theme-surface: #16181c;
  --bt-theme-surface-hover: #1e2025;
  --bt-theme-border: #2f3336;
  --bt-theme-text: #e7e9ea;
  --bt-theme-text-muted: #71767b;
  --bt-theme-accent: #1d9bf0;
}

/* Theme Presets */
html[data-bt-theme="dracula"] {
  --bt-theme-bg: #282a36 !important;
  --bt-theme-surface: #343746 !important;
  --bt-theme-surface-hover: #44475a !important;
  --bt-theme-border: #44475a !important;
  --bt-theme-text: #f8f8f2 !important;
  --bt-theme-text-muted: #6272a4 !important;
  --bt-theme-accent: #bd93f9 !important;
}

html[data-bt-theme="nord"] {
  --bt-theme-bg: #2e3440 !important;
  --bt-theme-surface: #3b4252 !important;
  --bt-theme-surface-hover: #434c5e !important;
  --bt-theme-border: #4c566a !important;
  --bt-theme-text: #eceff4 !important;
  --bt-theme-text-muted: #d8dee9 !important;
  --bt-theme-accent: #88c0d0 !important;
}

html[data-bt-theme="matrix"] {
  --bt-theme-bg: #000000 !important;
  --bt-theme-surface: #0a140a !important;
  --bt-theme-surface-hover: #0f240f !important;
  --bt-theme-border: #003b00 !important;
  --bt-theme-text: #00ff66 !important;
  --bt-theme-text-muted: #008f11 !important;
  --bt-theme-accent: #00ff66 !important;
}

/* Apply Backgrounds & Surfaces */
html[data-bt-theme="dracula"],
html[data-bt-theme="nord"],
html[data-bt-theme="matrix"] {
  background-color: var(--bt-theme-bg) !important;
}
html[data-bt-theme="dracula"] body,
html[data-bt-theme="nord"] body,
html[data-bt-theme="matrix"] body,
html[data-bt-theme="dracula"] #react-root,
html[data-bt-theme="nord"] #react-root,
html[data-bt-theme="matrix"] #react-root {
  background-color: var(--bt-theme-bg) !important;
  color: var(--bt-theme-text) !important;
}

/* Universal Accent Overrides */
[style*="color: rgb(29, 155, 240)"],
[style*="color:rgb(29,155,240)"] {
  color: var(--bt-theme-accent) !important;
}
[style*="background-color: rgb(29, 155, 240)"],
[style*="background-color:rgb(29,155,240)"] {
  background-color: var(--bt-theme-accent) !important;
}
[style*="border-color: rgb(29, 155, 240)"],
[style*="border-color:rgb(29,155,240)"] {
  border-color: var(--bt-theme-accent) !important;
}
svg [fill="rgb(29, 155, 240)"],
svg [fill="#1d9bf0" i] {
  fill: var(--bt-theme-accent) !important;
}

/* Sidebar Clutter */
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="trend"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Trending" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What’s happening" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What's happening" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="UserCell"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Who to follow" i],
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/i/premium_sign_up"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/verified"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/i/premium_sign_up"]),
html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/verified"]) {
  display: none !important;
}

/* Vanity Metrics */
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="app-text-transition-container"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] button span:has(span) {
  display: none !important;
}
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] a[href*="/analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] div:has(a[href*="/analytics"]),
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="Views" i],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="views" i] {
  display: none !important;
}
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/retweets"]),
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/likes"]),
html[data-bt-hide-metrics="true"] article a[href$="/retweets"],
html[data-bt-hide-metrics="true"] article a[href$="/quotes"],
html[data-bt-hide-metrics="true"] article a[href$="/likes"],
html[data-bt-hide-metrics="true"] article a[href$="/history"] {
  display: none !important;
}
html[data-bt-hide-profile-counts="true"] a[href$="/verified_followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/following"] {
  display: none !important;
}

/* Tab Reordering */
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {
  order: 2 !important;
}
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(2) {
  order: 1 !important;
}
html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(n+3) {
  order: 3 !important;
}
html[data-bt-hide-for-you="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {
  display: none !important;
}
`;
}
```

---

## Validation Architecture

### 1. Test Strategies

#### Vitest Unit Tests (`tests/unit/`)
- **Theme Engine (`tests/unit/theme-engine.test.ts`)**: Verify that `generateThemeCss()` produces valid CSS rules containing all theme tokens and custom properties without syntax errors.
- **Tab Reordering (`tests/unit/tabs.test.ts`)**: Verify that auto-selection logic properly queries candidates and triggers clicks exactly once per route change.
- **Vanity Metrics (`tests/unit/metrics.test.ts`)**: Test tooltip sanitization regex patterns on various tweet action button text inputs (`"24 Likes"` → `"Like"`).
- **Settings Migration (`tests/unit/settings-migration.test.ts`)**: Test migration of v1 settings objects to v2 including new feature toggles and theme keys.

#### Playwright E2E Tests (`e2e/`)
- **Zero FOUC & Live Theme (`e2e/theme-switch.spec.ts`)**: Verify that changing theme in popup updates `document.documentElement` attributes and applies theme background without page reload.
- **Sidebar & Vanity Hiding (`e2e/clean-timeline.spec.ts`)**: Verify on fixture timeline that trends, who to follow, and action count texts are hidden when active.
- **Tab Order (`e2e/tabs.spec.ts`)**: Verify that flex `order` styles are correctly applied and Following tab is prioritized.

### 2. Verify Commands

```bash
# Run unit test suite
bun run test

# Run type check
bun x tsc --noEmit

# Run build audit gate
bun run build
node scripts/audit-build.mjs

# Run E2E tests
bun run test:e2e
```

---

## RESEARCH COMPLETE
