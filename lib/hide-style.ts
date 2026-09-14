/**
 * Spike S4 fallback: Zero the cell container's height and hide overflow
 * if hiding firstElementChild alone leaves residual virtualizer slot gaps on live x.com.
 * Off by default; if live testing reveals gaps, toggle to true.
 * Reference: .planning/phases/01-foundation-settings-popup/spikes/S4-virtualizer-gap.md
 */
export const ENABLE_S4_COLLAPSE_FALLBACK = false;

const HIDE_STYLE_ID = 'bt-hide-style';

const FALLBACK_RULES = ENABLE_S4_COLLAPSE_FALLBACK
  ? `
[data-bt-hidden-cell] {
  height: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
}
`
  : '';

export const CSS_RULES = `
[data-bt-hidden] {
  display: none !important;
}
[data-bt-hidden] + [role="separator"],
[data-bt-hidden-cell] + [role="separator"] {
  display: none !important;
}
${FALLBACK_RULES}

/* Vanity metrics hiding (CLEAN-05, D-01) */
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="app-text-transition-container"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] button span:has(span) {
  display: none !important;
}

/* Hide Analytics / View count icon and container completely (D-01) */
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] a[href*="/analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="analytics"],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] div:has(a[href*="/analytics"]),
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="Views" i],
html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [aria-label*="views" i] {
  display: none !important;
}

/* Tweet detail stats row (D-02) */
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/retweets"]),
html[data-bt-hide-metrics="true"] article div:has(> a[href$="/likes"]),
html[data-bt-hide-metrics="true"] article a[href$="/retweets"],
html[data-bt-hide-metrics="true"] article a[href$="/quotes"],
html[data-bt-hide-metrics="true"] article a[href$="/likes"],
html[data-bt-hide-metrics="true"] article a[href$="/history"] {
  display: none !important;
}

/* Profile follower/following counts (CLEAN-05, D-03) */
html[data-bt-hide-profile-counts="true"] a[href$="/verified_followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/followers"],
html[data-bt-hide-profile-counts="true"] a[href$="/following"] {
  display: none !important;
}

/* Right sidebar declutter (CLEAN-02, CLEAN-03, D-08) */
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

/* CLEAN-04 & D-05, D-07: Tab Reordering via CSS flex order */
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

/* Floating Chat & Grok drawer buttons */
html[data-bt-hide-drawers="true"] [data-testid="GrokDrawer"],
html[data-bt-hide-drawers="true"] [data-testid="chat-drawer-root"],
html[data-bt-hide-drawers="true"] [data-testid="BottomBar"],
html[data-bt-hide-drawers="true"] div:has(> [data-testid="GrokDrawer"]),
html[data-bt-hide-drawers="true"] div:has(> [data-testid="chat-drawer-root"]),
html[data-bt-hide-drawers="true"] div:has(> div > [data-testid="GrokDrawer"]),
html[data-bt-hide-drawers="true"] div:has(> div > [data-testid="chat-drawer-root"]),
html[data-bt-hide-drawers="true"] div:has(> div > div > [data-testid="GrokDrawer"]),
html[data-bt-hide-drawers="true"] div:has(> div > div > [data-testid="chat-drawer-root"]),
html[data-bt-hide-drawers="true"] [data-testid="DMDrawer"],
html[data-bt-hide-drawers="true"] [data-testid="floatingActionButton"] {
  display: none !important;
}
`;

/**
 * Injects extension-owned stylesheet into document.documentElement at document_start.
 */
export function injectHideStylesheet(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(HIDE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIDE_STYLE_ID;
  style.textContent = CSS_RULES;

  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(style);
  }
}

/**
 * Hides a promoted tweet cell by setting extension-owned attributes.
 * contentWrapper receives data-bt-hidden (display: none !important).
 * cell receives data-bt-hidden-cell (collapses trailing separator).
 */
export function hideTweetCell(cell: Element, contentWrapper: Element): void {
  cell.setAttribute('data-bt-hidden-cell', '');
  contentWrapper.setAttribute('data-bt-hidden', '');
}

/**
 * Restores a tweet cell's visibility losslessly by removing extension attributes.
 */
export function unhideTweetCell(cell: Element, contentWrapper: Element): void {
  cell.removeAttribute('data-bt-hidden-cell');
  contentWrapper.removeAttribute('data-bt-hidden');
}

/**
 * Removes all extension-owned hide attributes from the DOM.
 */
export function clearAllHidden(): void {
  if (typeof document === 'undefined') return;
  const hiddenElements = document.querySelectorAll('[data-bt-hidden]');
  hiddenElements.forEach((el) => el.removeAttribute('data-bt-hidden'));

  const hiddenCells = document.querySelectorAll('[data-bt-hidden-cell]');
  hiddenCells.forEach((el) => el.removeAttribute('data-bt-hidden-cell'));
}