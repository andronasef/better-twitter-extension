# Phase 4: Twemoji Reactions — Pattern Map (PATTERNS.md)

**Phase:** 4 — Twemoji Reactions  
**Status:** COMPLETE — Ready for Planning  
**Generated:** 2026-09-15  
**Domain:** In-feed Floating Reaction Palette, DraftJS Reply Composer Prefill, Asset Bundling & Caching  
**Requirements Covered:** REACT-01, REACT-02, REACT-03, REACT-04, REACT-05, REACT-06  

---

## 1. Executive Summary & File Map

This pattern map specifies the exact existing source code analogs within the `better-twitter` codebase that each new or modified file in Phase 4 must mirror.

Every analog cited in this document has been verified through git tracking status (`git status`) and read directly from the working tree. No imaginary or unverified files are referenced.

### Target Files to Create / Modify

| Target File | Action | Role | Data Flow | Closest Analog (git-tracked) |
|---|---|---|---|---|
| `lib/selectors.ts` | **Modify** | DOM Selector Abstraction | Live DOM query & diagnostics tracking | `lib/selectors.ts` (lines 30–64) |
| `lib/storage.ts` | **Modify** | Type-Safe Persistent Storage | Storage API (`browser.storage.local`) | `lib/storage.ts` (lines 96–134) |
| `lib/registry.ts` | **Modify** | Feature & Category Registry | Popup routing and TileGrid categories | `lib/registry.ts` (lines 26–44) |
| `wxt.config.ts` | **Modify** | Extension Manifest Config | Web-accessible asset permissions | `wxt.config.ts` (lines 18–24) |
| `features/reactions/types.ts` | **Create** | Feature Type Definitions | Compile-time contract for state & models | `features/bookmarks/types.ts` (lines 1–43) |
| `features/reactions/constants.ts` | **Create** | Timing, Defaults & URL Helpers | Immutable defaults & runtime constants | `lib/theme-engine.ts` (lines 1–45) |
| `features/reactions/palette-controller.ts` | **Create** | In-Feed Interaction State Machine | Delegated capture events → ShadowRoot render | `features/bookmarks/action-bar.ts` (lines 40–97, 240–267) |
| `features/reactions/ReactionPalette.tsx` | **Create** | Floating Overlay React Component | Props & events → Shadow DOM virtual DOM | `features/bookmarks/FolderSelectorPopover.tsx` (lines 1–75) |
| `features/reactions/composer-prefiller.ts` | **Create** | Rich-Text Composer Interactor | DOM trigger → DraftJS execCommand insertion | `features/bookmarks/capture-engine.ts` (lines 30–70) |
| `features/reactions/Toast.tsx` | **Create** | Fallback Notification Component | In-shadow status feedback (D-08) | `components/shadow-portal.tsx` (lines 27–40) |
| `features/reactions/catalog.ts` | **Create** | Remote Catalog Fetch & Caching | HTTP fetch → SVG/WebP Data URIs → Storage | `features/bookmarks/search.ts` & `storage.ts` |
| `features/reactions/EmojiCatalogModal.tsx` | **Create** | Catalog Browser Modal / Popover | Search / category query → Grid selection | `features/bookmarks/FolderSelectorPopover.tsx` (lines 75–150) |
| `features/reactions/index.ts` | **Create** | Feature Lifecycle Hook | Content script init & teardown dispatcher | `features/bookmarks/in-page-ui/index.ts` (lines 25–60) |
| `entrypoints/x.content/index.ts` | **Modify** | Content Script Main Entrypoint | Page lifecycle → Controller mount/teardown | `entrypoints/x.content/index.ts` (lines 40–52, 190–210) |
| `entrypoints/popup/ReactionsPanel.tsx` | **Create** | Popup Configuration Panel | Popup UI → Storage item update | `entrypoints/popup/ThemesPanel.tsx` & `BookmarksPanel.tsx` |
| `entrypoints/popup/App.tsx` | **Modify** | Popup Shell Routing | Active category state → Panel view switch | `entrypoints/popup/App.tsx` (lines 219–235) |
| `tests/unit/reactions-storage.test.ts` | **Create** | Storage & Constants Unit Test | Vitest + fakeBrowser storage testing | `tests/unit/bookmarks-storage.test.ts` (lines 1–60) |
| `tests/unit/reactions-trigger.test.ts` | **Create** | Trigger & State Machine Unit Test | Simulated timers & pointer events | `tests/unit/bookmarks-action-bar.test.ts` (lines 1–103) |
| `tests/unit/reactions-prefiller.test.ts` | **Create** | Composer Prefill Unit Test | contenteditable & execCommand mock harness | `tests/unit/bookmarks-action-bar.test.ts` (lines 74–134) |
| `tests/unit/reactions-catalog.test.ts` | **Create** | Catalog Search & Filter Unit Test | In-memory token filter & debounce harness | `tests/unit/bookmarks-search.test.ts` (lines 1–60) |
| `e2e/reactions.spec.ts` | **Create** | Playwright E2E Test Suite | Browser persistent context + mock fixtures | `e2e/bookmarks.spec.ts` (lines 1–80) |

---

## 2. Tracked-Source Gate Verification

The following table confirms that every source file cited as an analog exists in the current git commit tree and is tracked by version control.

| Analog File Path | Status | Verification Reference |
|---|---|---|
| `lib/selectors.ts` | Git-Tracked | `git status` clean; 226 lines; verified in repo root |
| `lib/storage.ts` | Git-Tracked | `git status` clean; 134 lines; exports `settingsItem`, `bookmarksItem`, etc. |
| `lib/registry.ts` | Git-Tracked | `git status` clean; 103 lines; exports `categories`, `features` |
| `lib/theme-engine.ts` | Git-Tracked | `git status` clean; exports `THEME_PRESETS`, theme injectors |
| `wxt.config.ts` | Git-Tracked | `git status` clean; 25 lines; defines manifest permissions & web_accessible_resources |
| `components/shadow-portal.tsx` | Git-Tracked | `git status` clean; 79 lines; exports `ShadowRootProvider`, `injectShadowStyles` |
| `components/shadow-ui/BtTooltip.tsx` | Git-Tracked | `git status` clean; 91 lines; Radix tooltip wrapped for Shadow DOM |
| `features/bookmarks/types.ts` | Git-Tracked | `git status` clean; 43 lines; exports TypeScript interfaces |
| `features/bookmarks/storage.ts` | Git-Tracked | `git status` clean; 212 lines; exports storage helpers & quota enforcement |
| `features/bookmarks/action-bar.ts` | Git-Tracked | `git status` clean; 268 lines; exports delegated click/hover handlers & popover mount |
| `features/bookmarks/FolderSelectorPopover.tsx` | Git-Tracked | `git status` clean; 310 lines; Shadow DOM popover component |
| `features/bookmarks/capture-engine.ts` | Git-Tracked | `git status` clean; 566 lines; DOM inspection & bridge integration |
| `features/bookmarks/search.ts` | Git-Tracked | `git status` clean; 82 lines; exports `searchBookmarks`, `debounce` |
| `features/bookmarks/in-page-ui/index.ts` | Git-Tracked | `git status` clean; 259 lines; mounts `#bt-bookmarks-hub-root` into timeline |
| `entrypoints/x.content/index.ts` | Git-Tracked | `git status` clean; 214 lines; main content script lifecycle |
| `entrypoints/popup/ThemesPanel.tsx` | Git-Tracked | `git status` clean; 73 lines; dedicated preset selector panel |
| `entrypoints/popup/BookmarksPanel.tsx` | Git-Tracked | `git status` clean; 784 lines; dedicated management panel |
| `entrypoints/popup/App.tsx` | Git-Tracked | `git status` clean; 337 lines; popup shell with dedicated panel switches |
| `tests/unit/bookmarks-storage.test.ts` | Git-Tracked | `git status` clean; 326 lines; storage unit tests |
| `tests/unit/bookmarks-action-bar.test.ts` | Git-Tracked | `git status` clean; 227 lines; action bar DOM event simulation |
| `tests/unit/bookmarks-search.test.ts` | Git-Tracked | `git status` clean; 160 lines; client search & debounce tests |
| `e2e/bookmarks.spec.ts` | Git-Tracked | `git status` clean; 317 lines; persistent browser E2E test |
| `e2e/fixtures/x-home.html` | Git-Tracked | `git status` clean; 218 lines; home timeline HTML fixture |

---

## 3. Detailed Pattern Blueprints per File

### 3.1 `lib/selectors.ts` (Modify)

- **Role:** DOM Selector Abstraction Layer. Defines candidate arrays for resilient element querying across X markup changes.
- **Closest Analog:** `lib/selectors.ts` (lines 30–45, 59–64).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/lib/selectors.ts#L30-L45
  // Native bookmark button in tweet action bar (BOOK-01, D-05)
  bookmarkButton: [
    '[data-testid="bookmark"]',
    'button[aria-label*="Bookmark" i]',
    '[role="group"] button:has(svg path[d*="M4 4.5C4 3.12"])',
  ],

  // Native remove bookmark button (active saved state, D-09)
  removeBookmarkButton: [
    '[data-testid="removeBookmark"]',
    'button[aria-label*="Remove from Bookmarks" i]',
    'button[aria-label*="Bookmarked" i]',
  ],
  ```
- **Phase 4 Adaptation Blueprint:**
  Add 3 selector candidate chains:
  1. `likeButton`:
     ```ts
     likeButton: [
       '[data-testid="like"]',
       '[data-testid="unlike"]',
       'button[aria-label*="Like" i]',
       'button[aria-label*="Liked" i]',
     ],
     ```
  2. `replyButton`:
     ```ts
     replyButton: [
       '[data-testid="reply"]',
       'button[aria-label*="Reply" i]',
     ],
     ```
  3. `replyComposer`:
     ```ts
     replyComposer: [
       '[role="dialog"] [data-testid="tweetTextarea_0"]',
       '[role="dialog"] [role="textbox"][contenteditable="true"]',
       '[data-testid="tweetTextarea_0"]',
       '[role="textbox"][contenteditable="true"]',
     ],
     ```
  *Invariants Maintained:* Zero class name selectors; first match wins; never throws.

---

### 3.2 `lib/storage.ts` (Modify)

- **Role:** Centralized WXT Storage Item Declarations.
- **Closest Analog:** `lib/storage.ts` (lines 96–134).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/lib/storage.ts#L96-L100
  export const bookmarksItem = storage.defineItem<Record<string, BookmarkItem>>('local:bookmarks', {
    fallback: {},
    version: 1,
  });
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/lib/storage.ts#L127-L134
  export const bookmarksSettingsItem = storage.defineItem<BookmarksSettings>('local:bookmarksSettings', {
    fallback: {
      resurfacingEnabled: true,
      resurfacingInterval: 20,
      askFolderOnSave: true,
    },
    version: 1,
  });
  ```
- **Phase 4 Adaptation Blueprint:**
  Import `ReactionsSettings` and `CustomEmojiCache` from `@/features/reactions/types` and `DEFAULT_REACTION_SLOTS` from `@/features/reactions/constants`. Export:
  ```ts
  export const reactionsSettingsItem = storage.defineItem<ReactionsSettings>('local:reactionsSettings', {
    fallback: {
      enabled: true,
      style: 'twemoji',
      slots: DEFAULT_REACTION_SLOTS,
    },
    version: 1,
  });

  export const customEmojiCacheItem = storage.defineItem<CustomEmojiCache>('local:customEmojiCache', {
    fallback: {},
    version: 1,
  });
  ```

---

### 3.3 `lib/registry.ts` (Modify)

- **Role:** Popup Category & Feature Registry.
- **Closest Analog:** `lib/registry.ts` (lines 26–44).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/lib/registry.ts#L26-L44
  export const categories: CategoryEntry[] = [
    {
      id: 'timeline',
      caption: 'Timeline',
      icon: Columns3,
    },
    {
      id: 'themes',
      caption: 'Themes',
      icon: Palette,
      dedicatedPanel: true,
    },
    {
      id: 'bookmarks',
      caption: 'Bookmarks',
      icon: Bookmark,
      dedicatedPanel: true,
    },
  ];
  ```
- **Phase 4 Adaptation Blueprint:**
  Import `Smile` from `lucide-react`. Add entry to `categories`:
  ```ts
  {
    id: 'reactions',
    caption: 'Reactions',
    icon: Smile,
    dedicatedPanel: true,
  },
  ```
  Note: Since `dedicatedPanel: true`, this category does not require boolean toggles in `features` array and will be rendered by `App.tsx` directly (D-10).

---

### 3.4 `wxt.config.ts` (Modify)

- **Role:** Extension Build & Manifest Configuration.
- **Closest Analog:** `wxt.config.ts` (lines 18–24).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/wxt.config.ts#L18-L24
  web_accessible_resources: [
    {
      resources: ['bridge.js'],
      matches: ['*://x.com/*', '*://twitter.com/*'],
    },
  ],
  ```
- **Phase 4 Adaptation Blueprint:**
  Add `twemoji/*` and `noto-animated/*` to `resources` array:
  ```ts
  web_accessible_resources: [
    {
      resources: ['bridge.js', 'twemoji/*', 'noto-animated/*'],
      matches: ['*://x.com/*', '*://twitter.com/*'],
    },
  ],
  ```
  *Audit Gate Invariant:* Matches remain strictly scoped to `*://x.com/*` and `*://twitter.com/*` (zero wildcard origins), satisfying `scripts/audit-build.mjs` Assertion 2.

---

### 3.5 `features/reactions/types.ts` (Create)

- **Role:** Compile-time Type Contracts for Reactions Domain.
- **Closest Analog:** `features/bookmarks/types.ts` (lines 1–43).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/types.ts#L1-L8
  export interface BookmarkItem {
    id: string;
    text: string;
    authorName: string;
    ...
  }
  ```
- **Phase 4 Adaptation Blueprint:**
  Define:
  ```ts
  export type ReactionStyle = 'normal' | 'twemoji' | 'noto-animated';

  export interface ReactionSlot {
    id: string;
    emoji: string;
    label: string;
    twemojiCodepoint: string;
    notoCodepoint: string;
    isCustom?: boolean;
  }

  export interface ReactionsSettings {
    enabled: boolean;
    style: ReactionStyle;
    slots: ReactionSlot[];
  }

  export interface CustomEmojiCacheEntry {
    twemojiSvg?: string;
    notoWebp?: string;
    updatedAt: number;
  }

  export interface CustomEmojiCache {
    [codepoint: string]: CustomEmojiCacheEntry;
  }

  export interface CatalogEmoji {
    codepoint: string;
    emoji: string;
    name: string;
    category: string;
    keywords: string[];
  }
  ```

---

### 3.6 `features/reactions/constants.ts` (Create)

- **Role:** Domain Constants, Default Slots, Timing Thresholds, and Asset URL Resolvers.
- **Closest Analog:** `lib/theme-engine.ts` (lines 1–45) and `features/bookmarks/storage.ts` (lines 15–20).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/lib/theme-engine.ts#L6-L14
  export interface ThemePreset {
    id: ThemeId;
    label: string;
    desc: string;
    accent: string;
  }
  export const THEME_PRESETS: Record<ThemeId, ThemePreset> = { ... };
  ```
- **Phase 4 Adaptation Blueprint:**
  Define default 6 slots, timing constants (D-01, D-02, D-08), and URL helpers:
  ```ts
  import { browser } from 'wxt/browser';
  import type { ReactionSlot } from './types';

  export const HOVER_TRIGGER_DELAY_MS = 350;
  export const EXIT_GRACE_BUFFER_MS = 300;
  export const HOLD_TRIGGER_THRESHOLD_MS = 500;
  export const TOAST_AUTO_DISMISS_MS = 3000;
  export const COMPOSER_WAIT_TIMEOUT_MS = 1000;

  export const DEFAULT_REACTION_SLOTS: ReactionSlot[] = [
    { id: 'like', emoji: '👍', label: 'Like', twemojiCodepoint: '1f44d', notoCodepoint: '1f44d' },
    { id: 'love', emoji: '❤️', label: 'Love', twemojiCodepoint: '2764', notoCodepoint: '2764_fe0f' },
    { id: 'haha', emoji: '😂', label: 'Haha', twemojiCodepoint: '1f602', notoCodepoint: '1f602' },
    { id: 'wow', emoji: '😮', label: 'Wow', twemojiCodepoint: '1f62e', notoCodepoint: '1f62e' },
    { id: 'sad', emoji: '😢', label: 'Sad', twemojiCodepoint: '1f622', notoCodepoint: '1f622' },
    { id: 'fire', emoji: '🔥', label: 'Fire', twemojiCodepoint: '1f525', notoCodepoint: '1f525' },
  ];

  export function getTwemojiAssetUrl(codepoint: string): string {
    return browser.runtime.getURL(`twemoji/${codepoint}.svg`);
  }

  export function getNotoAssetUrl(codepoint: string): string {
    return browser.runtime.getURL(`noto-animated/${codepoint}.webp`);
  }
  ```

---

### 3.7 `features/reactions/palette-controller.ts` (Create)

- **Role:** State Machine and Delegated Interaction Controller. Manages hover delay (350ms), hold timer (500ms), exit grace buffer (300ms), positioning, and immediate dismissal triggers.
- **Closest Analog:** `features/bookmarks/action-bar.ts` (lines 40–97, 240–267).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/action-bar.ts#L40-L55
  function ensurePopoverContainer(): { host: HTMLDivElement; shadow: ShadowRoot; root: Root } {
    if (!popoverHost || !document.body.contains(popoverHost)) {
      popoverHost = document.createElement('div');
      popoverHost.id = 'bt-folder-selector-root';
      popoverHost.style.position = 'fixed';
      popoverHost.style.top = '0';
      popoverHost.style.left = '0';
      popoverHost.style.width = '0';
      popoverHost.style.height = '0';
      popoverHost.style.zIndex = '2147483647';
      document.body.appendChild(popoverHost);
      popoverShadowRoot = popoverHost.attachShadow({ mode: 'open' });
      popoverRoot = createRoot(popoverShadowRoot);
    }
    return { host: popoverHost, shadow: popoverShadowRoot!, root: popoverRoot! };
  }

  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/action-bar.ts#L64-L70
  const handleClose = () => {
    window.removeEventListener('scroll', handleClose, true);
    root.render(null);
  };
  window.addEventListener('scroll', handleClose, { capture: true, once: true });
  ```
- **Phase 4 Adaptation Blueprint:**
  - Attach singleton container `#bt-reactions-root` at `document.body` with open ShadowRoot and `ShadowRootProvider`.
  - Capture-phase delegated listeners on `document`:
    - `pointerover`: When over `[data-testid="like"]` or `[data-testid="unlike"]`, start 350ms hover timer. If over open palette, clear exit grace timer.
    - `pointerout`: Clear pending hover timer. If exiting Like button or palette, start 300ms exit grace timer.
    - `pointerdown`: When on Like button, start 500ms hold timer.
    - `pointerup`: Clear hold timer. If hold was triggered, prevent default and stop immediate propagation.
    - `click`: If hold triggered, suppress click. If normal single click (<500ms), dismiss palette immediately and let native Like execute (D-04).
  - Immediate dismissal listeners:
    - `scroll` on `window` (capture, passive) -> `closePalette()`.
    - `pointerdown` outside palette pill -> `closePalette()`.
    - `keydown` with `key === 'Escape'` -> `closePalette()`.
    - `requestAnimationFrame` verifying `document.body.contains(currentAnchorTweet)` -> unmount if virtualized out.
  - Coordinate with `composer-prefiller.ts` on emoji selection.

---

### 3.8 `features/reactions/ReactionPalette.tsx` (Create)

- **Role:** Floating Pill Overlay Component. Renders 6 emoji reaction slots with spring scale hover animation, theme syncing, and sentiment tooltips.
- **Closest Analog:** `features/bookmarks/FolderSelectorPopover.tsx` (lines 1–75) and `components/shadow-ui/BtTooltip.tsx`.
- **Existing Pattern Excerpt:**
  ```tsx
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/FolderSelectorPopover.tsx#L16-L30
  export interface FolderSelectorPopoverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetRect?: { top: number; left: number; width: number; height: number } | null;
    tweetId: string;
    onClose?: () => void;
  }
  ```
- **Phase 4 Adaptation Blueprint:**
  ```tsx
  export interface ReactionPaletteProps {
    anchorRect: DOMRect;
    slots: ReactionSlot[];
    style: ReactionStyle;
    customCache: CustomEmojiCache;
    onSelectEmoji: (slot: ReactionSlot) => void;
    onOpenSettings?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }
  ```
  - **Container Styling:** `fixed flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-150 ease-out z-50 pointer-events-auto`
  - **Background & Border:** Uses `color-mix(in srgb, var(--bt-surface) 88%, transparent)` and `var(--bt-border)` to inherit active theme from `:host`.
  - **Hover Scale:** `transform: scale(1.4) translateY(-4px); transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);`
  - **Tooltip:** High-contrast sentiment badge (`rgba(0, 0, 0, 0.85)` background, 11px/600 pill) centered directly above hovered emoji.
  - **Slot Renderers:**
    - `normal`: `<span className="text-[24px] select-none leading-none">{slot.emoji}</span>`
    - `twemoji`: `<img src={customSvg || getTwemojiAssetUrl(slot.twemojiCodepoint)} alt={slot.emoji} className="w-7 h-7 select-none pointer-events-none" />`
    - `noto-animated`: `<img src={customWebp || getNotoAssetUrl(slot.notoCodepoint)} alt={slot.emoji} className="w-7 h-7 select-none pointer-events-none" />`

---

### 3.9 `features/reactions/composer-prefiller.ts` (Create)

- **Role:** Context-Aware Native Reply Composer Trigger & DraftJS Text Inserter.
- **Closest Analog:** `features/bookmarks/capture-engine.ts` (lines 30–70) and `features/bookmarks/extractor.ts` (lines 255–270).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/extractor.ts#L256-L265
  export function extractBookmarkFromDom(articleEl: Element): BookmarkItem | null {
    if (!articleEl) return null;
    const permalinkAnchor = articleEl.querySelector('a[href*="/status/"]');
    ...
  }
  ```
- **Phase 4 Adaptation Blueprint:**
  Follow 4-step pipeline documented in Spike 1:
  1. Find tweet article: `buttonEl.closest('article[data-testid="tweet"]')`.
  2. Click native reply button (`[data-testid="reply"]`).
  3. Wait up to 1000ms for editor (`resolve('replyComposer')`).
  4. Focus editor, collapse selection to end of existing text (D-07), execute `document.execCommand('insertText', false, `${emoji} `)`.
  5. Fallback: dispatch synthetic `beforeinput` (`inputType: 'insertText'`) and `input` events.
  6. Failure fallback (D-08): if no reply button or composer timeout, copy emoji to clipboard via `navigator.clipboard.writeText(emoji)` and invoke `onFallback`.
  *Anti-Abuse Invariant (REACT-04):* Extension never presses the submit button. Control is handed 100% to the human user.

---

### 3.10 `features/reactions/Toast.tsx` (Create)

- **Role:** Discreet Fallback Notification Toast inside Shadow Root.
- **Closest Analog:** `components/shadow-portal.tsx` (lines 27–40) and `components/ui/button.tsx`.
- **Phase 4 Adaptation Blueprint:**
  - Fixed at bottom-center of viewport (`bottom: 24px`, `left: 50%`, `transform: translateX(-50%)`).
  - Dark pill container with `ClipboardCheck` icon: `"Replies unavailable — emoji copied to clipboard"`.
  - Auto-dismisses after 3000ms (`TOAST_AUTO_DISMISS_MS`).
  - Dismiss button `[✕]` with `aria-label="Dismiss notification"`.
  - Role: `role="status" aria-live="polite"`.

---

### 3.11 `features/reactions/catalog.ts` (Create)

- **Role:** Remote Google Noto Catalog Fetcher, Search Filter, and Local Storage Caching.
- **Closest Analog:** `features/bookmarks/search.ts` (lines 1–55) and `features/bookmarks/storage.ts` (lines 20–45).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/search.ts#L7-L20
  export function searchBookmarks(
    bookmarks: BookmarkItem[],
    query: string,
    selectedFolderId?: string | null,
    selectedTag?: string | null
  ): BookmarkItem[] {
    let filtered = bookmarks;
    ...
  ```
- **Phase 4 Adaptation Blueprint:**
  - `fetchEmojiCatalog()`: Fetches `https://googlefonts.github.io/noto-emoji-animation/data/api.json` (verified CORS `Access-Control-Allow-Origin: *`).
  - `searchEmojiCatalog(catalog, query, category)`: Multi-token keyword search matching emoji name, category, and keywords with category chip filter.
  - `cacheCustomEmoji(slot, codepoint)`: Fetches SVG from jsDelivr Twemoji and WebP from Google Fonts, converts to base64/Data URI, and writes to `customEmojiCacheItem` in `chrome.storage.local`.
  *Zero Host Permissions Invariant:* No manifest `host_permissions` needed because standard CORS headers exist on these endpoints.

---

### 3.12 `features/reactions/EmojiCatalogModal.tsx` (Create)

- **Role:** Catalog Browser Modal / Popover mounted from `ReactionsPanel`.
- **Closest Analog:** `features/bookmarks/FolderSelectorPopover.tsx` (lines 75–150).
- **Existing Pattern Excerpt:**
  ```tsx
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/FolderSelectorPopover.tsx#L78-L84
  const filteredFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);
  ```
- **Phase 4 Adaptation Blueprint:**
  - Search input with 150ms debounced filter.
  - Category chips row ("All", "Smileys", "Gestures", "Animals", "Food", etc.) with horizontal scroll.
  - 40×40px clickable emoji cell grid.
  - Empty state: centered icon, "No Emojis Found", suggestion to change keyword or category.
  - Error state: "Emoji Catalog Unavailable", "Retry Catalog Fetch" button.
  - Loading skeleton: 12 pulsing 40×40px skeleton boxes.
  - On select: replaces target slot, triggers asset caching, saves settings, and closes modal.

---

### 3.13 `features/reactions/index.ts` (Create)

- **Role:** Reactions Feature Lifecycle Entrypoint.
- **Closest Analog:** `features/bookmarks/in-page-ui/index.ts` (lines 25–45) and `features/bookmarks/action-bar.ts` (lines 240–267).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/features/bookmarks/action-bar.ts#L242-L267
  export function initActionBarIntegration(): () => void {
    if (isInitialized) return teardownActionBarIntegration;
    isInitialized = true;
    document.addEventListener('click', handleActionBarClick, { capture: true });
    ...
    return teardownActionBarIntegration;
  }
  ```
- **Phase 4 Adaptation Blueprint:**
  Export:
  - `initReactions(): () => void` — initializes palette controller capture listeners and storage watchers.
  - `teardownReactions(): void` — unmounts `#bt-reactions-root` overlay and removes document listeners.

---

### 3.14 `entrypoints/x.content/index.ts` (Modify)

- **Role:** Content Script Integration.
- **Closest Analog:** `entrypoints/x.content/index.ts` (lines 42–51).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/entrypoints/x.content/index.ts#L42-L51
  // 4. Initialize bookmarks capture engine and action bar integration (BOOK-01, D-05)
  captureEngine.init();
  initActionBarIntegration();

  ctx.onInvalidated(() => {
    captureEngine.stopAutoScrollSync();
    teardownActionBarIntegration();
    unmountBookmarksHub();
    teardownResurfacing();
  });
  ```
- **Phase 4 Adaptation Blueprint:**
  Import `initReactions` and `teardownReactions` from `@/features/reactions`.
  ```ts
  // Initialize Twemoji Reactions
  initReactions();

  ctx.onInvalidated(() => {
    ...
    teardownReactions();
  });
  ```

---

### 3.15 `entrypoints/popup/ReactionsPanel.tsx` (Create)

- **Role:** Popup Settings Panel for Customizing Reaction Slots and Visual Styles.
- **Closest Analog:** `entrypoints/popup/ThemesPanel.tsx` (lines 1–73) and `entrypoints/popup/BookmarksPanel.tsx` (lines 45–100).
- **Existing Pattern Excerpt:**
  ```tsx
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/entrypoints/popup/ThemesPanel.tsx#L20-L40
  export function ThemesPanel({ settings, onThemeChange, ... }: ThemesPanelProps) {
    ...
    return (
      <div className="view-enter-panel flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-[var(--bt-fg-muted)]">
          Preset Themes
        </h2>
        ...
  ```
- **Phase 4 Adaptation Blueprint:**
  - Visual Style Selector: 3 cards (`Normal`, `Twemoji`, `Animated Noto`) with active accent border ring (`border: 2px solid var(--bt-accent)`).
  - Palette Slots (6): 6 slot rows showing index, emoji glyph/preview, sentiment label, Move Left/Right (`[←]`, `[→]`) reorder buttons, and `[Change]` swap button.
  - "Reset to Defaults" button opening destructive confirmation dialog ("Reset Default Slots" red CTA vs "Keep Custom Slots").
  - Storage Quota Indicator & "Clear Cached Emojis" action when storage exceeds quota.
  - Connects to `reactionsSettingsItem` and `customEmojiCacheItem`.

---

### 3.16 `entrypoints/popup/App.tsx` (Modify)

- **Role:** Popup Shell View Switcher.
- **Closest Analog:** `entrypoints/popup/App.tsx` (lines 219–235).
- **Existing Pattern Excerpt:**
  ```tsx
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/entrypoints/popup/App.tsx#L219-L228
  ) : activeCategoryId === 'themes' ? (
    <ThemesPanel
      settings={settings}
      onThemeChange={handleThemeChange}
      onAccentChange={handleAccentChange}
      onAccentReset={handleAccentReset}
    />
  ) : activeCategoryId === 'bookmarks' ? (
    <BookmarksPanel />
  ) : activeCategory ? (
  ```
- **Phase 4 Adaptation Blueprint:**
  Import `ReactionsPanel` from `./ReactionsPanel`.
  Add conditional branch:
  ```tsx
  ) : activeCategoryId === 'reactions' ? (
    <ReactionsPanel />
  ```

---

### 3.17 `tests/unit/reactions-storage.test.ts` (Create)

- **Role:** Unit Tests for Reactions Storage Schema, Default Slots, and Cache Items.
- **Closest Analog:** `tests/unit/bookmarks-storage.test.ts` (lines 1–60).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/tests/unit/bookmarks-storage.test.ts#L22-L48
  describe('Bookmarks Storage & Quota Eviction (BOOK-02, BOOK-10, D-06, D-15, D-16)', () => {
    beforeEach(async () => {
      await bookmarksItem.setValue({});
      await foldersItem.setValue([...]);
    });
  ```
- **Phase 4 Adaptation Blueprint:**
  - Verify default 6 slots match D-09 (👍, ❤️, 😂, 😮, 😢, 🔥).
  - Verify fallback style is `'twemoji'`.
  - Verify asset URL resolution helpers (`getTwemojiAssetUrl`, `getNotoAssetUrl`).
  - Verify `customEmojiCacheItem` read/write.

---

### 3.18 `tests/unit/reactions-trigger.test.ts` (Create)

- **Role:** Unit Tests for Interaction Timing, Hover Delay, Hold Threshold, and Click Suppression.
- **Closest Analog:** `tests/unit/bookmarks-action-bar.test.ts` (lines 1–103).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/tests/unit/bookmarks-action-bar.test.ts#L87-L94
  const bookmarkBtn = container.querySelector('button[data-testid="bookmark"]') as HTMLButtonElement;
  const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
  Object.defineProperty(clickEvent, 'target', { value: bookmarkBtn, enumerable: true });
  await handleActionBarClick(clickEvent);
  ```
- **Phase 4 Adaptation Blueprint:**
  - Use `vi.useFakeTimers()` to test:
    - 350ms hover trigger delay (pointerout at 200ms cancels popup; pointerout after 350ms keeps popup open).
    - 300ms exit grace buffer (returning to palette within 300ms prevents dismiss).
    - 500ms long-press hold timer (suppresses click event with `preventDefault()` / `stopImmediatePropagation()`).
    - Single click (<500ms) closes palette and allows native like event to proceed.
    - Scroll event immediately dismisses palette.

---

### 3.19 `tests/unit/reactions-prefiller.test.ts` (Create)

- **Role:** Unit Tests for Reply Composer Detection, Caret Collapse, and DraftJS Text Prefilling.
- **Closest Analog:** `tests/unit/bookmarks-action-bar.test.ts` (lines 74–134).
- **Phase 4 Adaptation Blueprint:**
  - Mock article DOM containing `[data-testid="reply"]` and contenteditable textarea `[data-testid="tweetTextarea_0"]`.
  - Verify `prefillReplyComposer` clicks native reply button.
  - Verify `document.execCommand('insertText', false, '👍 ')` is invoked and appends with trailing space.
  - Verify clipboard fallback when reply button or composer is missing (D-08).

---

### 3.20 `tests/unit/reactions-catalog.test.ts` (Create)

- **Role:** Unit Tests for Emoji Search, Multi-token Filtering, and Debounce Mechanism.
- **Closest Analog:** `tests/unit/bookmarks-search.test.ts` (lines 1–60).
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/tests/unit/bookmarks-search.test.ts#L45-L60
  it('filters by single keyword in tweet text', () => {
    const results = searchBookmarks(sampleBookmarks, 'compiler');
    expect(results).toHaveLength(1);
  });
  it('performs multi-token AND search across fields', () => {
    const results = searchBookmarks(sampleBookmarks, 'dan server');
    expect(results).toHaveLength(1);
  });
  ```
- **Phase 4 Adaptation Blueprint:**
  - Test single keyword search against emoji name and keywords.
  - Test multi-token keyword search.
  - Test category chip filtering.
  - Test empty query returns full category list.

---

### 3.21 `e2e/reactions.spec.ts` (Create)

- **Role:** Playwright End-to-End Test Suite.
- **Closest Analog:** `e2e/bookmarks.spec.ts` (lines 1–80) and `e2e/fixtures/x-home.html`.
- **Existing Pattern Excerpt:**
  ```ts
  // file:///d:/Work/Dev/Projects/Opensource/better-twitter/e2e/bookmarks.spec.ts#L37-L44
  context = await chromium.launchPersistentContext('', {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  ```
- **Phase 4 Adaptation Blueprint:**
  - Navigate to mock `https://x.com/home` fixture.
  - Hover over tweet's Like button (`[data-testid="like"]`) and wait 350ms.
  - Assert `#bt-reactions-root` shadow root contains 6 emoji reaction slots.
  - Click the thumbs-up emoji (`👍`).
  - Verify mock composer textarea is prefilled with `'👍 '`.
  - Verify scrolling the window immediately unmounts `#bt-reactions-root`.
  - Verify popup style selection switches rendering mode.

---

## 4. Cross-Cutting Patterns & Standing Rules

### 4.1 Bundler & Tooling Rule
- **Invariant:** ALWAYS use `bun` as bundler and node installer (`bun run test`, `bun run build`, `bun add`, etc.).

### 4.2 Security & Permissions Audit Gate (`scripts/audit-build.mjs`)
- **Minimal Permissions:** Strictly `permissions: ['storage']` in `manifest.json`. Absolutely NO `host_permissions`.
- **Remote Catalog Fetching:** Google Fonts Noto API (`api.json`) and jsDelivr Twemoji return `Access-Control-Allow-Origin: *`, enabling standard CORS `fetch()` in the extension popup without requiring `host_permissions`.
- **Scoped Web-Accessible Resources:** All declared assets (`twemoji/*`, `noto-animated/*`, `bridge.js`) match only `*://x.com/*` and `*://twitter.com/*` (zero wildcard origins).

### 4.3 Anti-Abuse Safety Boundary (REACT-04)
- The extension **never** posts, likes, or replies on the user's behalf.
- Clicks are strictly directed to the native reply trigger button to open X's composer.
- Zero clicks or network calls are dispatched to the native submit button (`[data-testid="tweetButton"]`). Control remains 100% with the human user.

### 4.4 Shadow DOM CSS Isolation
- Reuses `components/shadow-portal.tsx` (`ShadowRootProvider` + `injectShadowStyles`).
- Injected Tailwind v4 styles use `:root, :host` variables (`--bt-surface`, `--bt-border`, `--bt-accent`, `--bt-fg`).
- Guarantees zero CSS leaks into X's interface and zero host CSS contamination into the reactions palette.

### 4.5 Delegated Event Listeners & Virtualizer Idempotency
- Capture-phase delegated listeners on `document` eliminate memory leaks across virtualized tweet cell recycling.
- Immediate dismissal on `scroll` ensures the reaction palette never hovers over recycled cells or detached tweets.
