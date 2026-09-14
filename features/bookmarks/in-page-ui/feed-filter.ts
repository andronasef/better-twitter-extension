import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BookmarksEmptyState } from './BookmarksEmptyState';
import { ShadowRootProvider, injectShadowStyles } from '@/components/shadow-portal';

let emptyStateHost: HTMLDivElement | null = null;
let emptyStateShadow: ShadowRoot | null = null;
let emptyStateRoot: Root | null = null;

let activeMatchingIds: Set<string> | null = null;
let activeCallbacks: { onClearFilters?: () => void; onSyncNow?: () => void; totalBookmarks?: number } | undefined = undefined;
let filterObserver: MutationObserver | null = null;

function ensureFilterStyle() {
  if (typeof document === 'undefined') return;
  let style = document.getElementById('bt-feed-filter-style') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'bt-feed-filter-style';
    style.textContent = `
      [data-bt-bookmark-filtered="true"] {
        display: none !important;
      }
      [data-bt-bookmarks-empty-filter="true"] article[data-testid="tweet"],
      [data-bt-bookmarks-empty-filter="true"] [data-testid="cellInnerDiv"]:has(article[data-testid="tweet"]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function mountEmptyState(
  container: HTMLElement,
  mode: 'no-matches' | 'fresh-install',
  onClearFilters?: () => void,
  onSyncNow?: () => void
) {
  if (!emptyStateHost || !document.body.contains(emptyStateHost)) {
    emptyStateHost = document.createElement('div');
    emptyStateHost.id = 'bt-bookmarks-empty-state';

    const hubHost = document.getElementById('bt-bookmarks-hub-root');
    if (hubHost && hubHost.parentElement) {
      hubHost.after(emptyStateHost);
    } else {
      const section = container.querySelector('section') || container;
      section.prepend(emptyStateHost);
    }

    emptyStateShadow = emptyStateHost.attachShadow({ mode: 'open' });
    injectShadowStyles(emptyStateShadow);
    emptyStateRoot = createRoot(emptyStateShadow);
  }

  if (emptyStateRoot && emptyStateShadow) {
    emptyStateRoot.render(
      React.createElement(ShadowRootProvider, {
        value: emptyStateShadow,
        children: React.createElement(BookmarksEmptyState, {
          mode,
          onClearFilters,
          onSyncNow,
        }),
      })
    );
  }
}

function unmountEmptyState() {
  if (emptyStateRoot) {
    emptyStateRoot.render(null);
  }
  if (emptyStateHost && emptyStateHost.parentElement) {
    emptyStateHost.remove();
  }
  emptyStateHost = null;
  emptyStateShadow = null;
  emptyStateRoot = null;
}

function scanAndFilterTweets(): void {
  if (activeMatchingIds === null || typeof document === 'undefined') return;

  if (activeMatchingIds.size === 0) {
    document.documentElement.setAttribute('data-bt-bookmarks-empty-filter', 'true');
  } else {
    document.documentElement.removeAttribute('data-bt-bookmarks-empty-filter');
  }

  const tweetArticles = document.querySelectorAll(
    'article[data-testid="tweet"], [data-testid="cellInnerDiv"]:has(article[data-testid="tweet"])'
  );

  let visibleCount = 0;

  tweetArticles.forEach((el) => {
    const permalink = el.querySelector('a[href*="/status/"]');
    const href = permalink?.getAttribute('href') || '';
    const match = href.match(/\/status\/(\d+)/);
    const tweetId = match ? match[1] : null;

    if (tweetId && activeMatchingIds!.has(tweetId)) {
      el.removeAttribute('data-bt-bookmark-filtered');
      visibleCount++;
    } else {
      el.setAttribute('data-bt-bookmark-filtered', 'true');
    }
  });

  if (activeMatchingIds.size === 0 || visibleCount === 0) {
    const timeline =
      document.querySelector('div[data-testid="primaryColumn"] section') ||
      document.querySelector('div[data-testid="primaryColumn"]') ||
      document.body;

    const mode = (activeCallbacks?.totalBookmarks ?? 1) === 0 ? 'fresh-install' : 'no-matches';
    mountEmptyState(
      timeline as HTMLElement,
      mode,
      activeCallbacks?.onClearFilters,
      activeCallbacks?.onSyncNow
    );
  } else {
    unmountEmptyState();
  }
}

/**
 * In-place feed filtering applying declarative CSS attributes to non-matching tweets (D-02, BOOK-05).
 */
export function applyFeedFilter(
  matchingTweetIds: Set<string> | null,
  callbacks?: { onClearFilters?: () => void; onSyncNow?: () => void; totalBookmarks?: number }
) {
  if (typeof document === 'undefined') return;
  ensureFilterStyle();

  if (matchingTweetIds === null) {
    clearFeedFilter();
    return;
  }

  activeMatchingIds = matchingTweetIds;
  activeCallbacks = callbacks;

  scanAndFilterTweets();

  // Attach persistent observer on primaryColumn so virtualized tweets are filtered as soon as Twitter mounts them
  if (!filterObserver) {
    const primary = document.querySelector('div[data-testid="primaryColumn"]') || document.body;
    filterObserver = new MutationObserver(() => {
      if (activeMatchingIds !== null) {
        scanAndFilterTweets();
      }
    });
    filterObserver.observe(primary, { childList: true, subtree: true });
  }
}

/**
 * Clears in-place feed filter attributes and removes empty state cards.
 */
export function clearFeedFilter() {
  if (typeof document === 'undefined') return;

  activeMatchingIds = null;
  activeCallbacks = undefined;

  if (filterObserver) {
    filterObserver.disconnect();
    filterObserver = null;
  }

  document.documentElement.removeAttribute('data-bt-bookmarks-empty-filter');

  const filtered = document.querySelectorAll('[data-bt-bookmark-filtered]');
  filtered.forEach((el) => el.removeAttribute('data-bt-bookmark-filtered'));

  unmountEmptyState();

  const style = document.getElementById('bt-feed-filter-style');
  if (style) {
    style.remove();
  }
}
