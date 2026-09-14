import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BookmarksEmptyState } from './BookmarksEmptyState';
import { ShadowRootProvider } from '@/components/shadow-portal';

let emptyStateHost: HTMLDivElement | null = null;
let emptyStateShadow: ShadowRoot | null = null;
let emptyStateRoot: Root | null = null;

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
    container.appendChild(emptyStateHost);
    emptyStateShadow = emptyStateHost.attachShadow({ mode: 'open' });
    emptyStateRoot = createRoot(emptyStateShadow);
  }

  if (emptyStateRoot) {
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
    emptyStateHost = null;
    emptyStateShadow = null;
    emptyStateRoot = null;
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

  // Find all tweet articles or their virtualized cells
  const tweetArticles = document.querySelectorAll(
    'article[data-testid="tweet"], [data-testid="cellInnerDiv"]:has(article[data-testid="tweet"])'
  );

  let visibleCount = 0;

  tweetArticles.forEach((el) => {
    const permalink = el.querySelector('a[href*="/status/"]');
    const href = permalink?.getAttribute('href') || '';
    const match = href.match(/\/status\/(\d+)/);
    const tweetId = match ? match[1] : null;

    if (tweetId && matchingTweetIds.has(tweetId)) {
      el.removeAttribute('data-bt-bookmark-filtered');
      visibleCount++;
    } else {
      el.setAttribute('data-bt-bookmark-filtered', 'true');
    }
  });

  if (matchingTweetIds.size === 0 || visibleCount === 0) {
    const timeline =
      document.querySelector('div[data-testid="primaryColumn"] section') ||
      document.querySelector('div[data-testid="primaryColumn"]') ||
      document.body;

    const mode = (callbacks?.totalBookmarks ?? 1) === 0 ? 'fresh-install' : 'no-matches';
    mountEmptyState(
      timeline as HTMLElement,
      mode,
      callbacks?.onClearFilters,
      callbacks?.onSyncNow
    );
  } else {
    unmountEmptyState();
  }
}

/**
 * Clears in-place feed filter attributes and removes empty state cards.
 */
export function clearFeedFilter() {
  if (typeof document === 'undefined') return;

  const filtered = document.querySelectorAll('[data-bt-bookmark-filtered]');
  filtered.forEach((el) => el.removeAttribute('data-bt-bookmark-filtered'));

  unmountEmptyState();

  const style = document.getElementById('bt-feed-filter-style');
  if (style) {
    style.remove();
  }
}
