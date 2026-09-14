import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BookmarksToolbar } from './BookmarksToolbar';
import { applyFeedFilter, clearFeedFilter } from './feed-filter';
import { foldersItem, bookmarksItem, bookmarkSyncItem } from '@/lib/storage';
import { searchBookmarks } from '../search';
import { syncBookmarksBackground, stopAutoScrollSync, scrapeVisibleBookmarksFromDom } from '../capture-engine';
import { extractBookmarkFromDom } from '../extractor';
import { ShadowRootProvider } from '@/components/shadow-portal';
import { isBookmarksRoute, isBookmarksTabActive } from '../routes';
import type { BookmarkFolder, BookmarkItem } from '../types';

let hubHost: HTMLDivElement | null = null;
let hubShadow: ShadowRoot | null = null;
let hubRoot: Root | null = null;
let unwatchStorage: (() => void) | null = null;
let scrapeObserver: MutationObserver | null = null;
let tabObserver: MutationObserver | null = null;
let primaryColumnObserver: MutationObserver | null = null;

let currentQuery = '';
let currentFolderId: string | null = null;
let currentTag: string | null = null;

export function mountBookmarksHub(): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (!isBookmarksRoute(pathname)) {
    return;
  }

  const primaryColumn = document.querySelector('div[data-testid="primaryColumn"]') as HTMLElement | null;
  if (!primaryColumn) {
    if (!primaryColumnObserver && document.body) {
      primaryColumnObserver = new MutationObserver(() => {
        const pc = document.querySelector('div[data-testid="primaryColumn"]') as HTMLElement | null;
        if (pc) {
          primaryColumnObserver?.disconnect();
          primaryColumnObserver = null;
          mountBookmarksHub();
        }
      });
      primaryColumnObserver.observe(document.body, { childList: true, subtree: true });
    }
    return;
  }

  // Setup tablist observer for history / tabbed views
  setupTablistObserver(primaryColumn);

  const isTabActive = isBookmarksTabActive(primaryColumn);

  // If already mounted and attached in primaryColumn
  const existing = document.getElementById('bt-bookmarks-hub-root');
  if (existing && hubHost === existing && primaryColumn.contains(existing)) {
    hubHost.style.display = isTabActive ? '' : 'none';
    if (primaryColumn.firstElementChild !== hubHost) {
      primaryColumn.prepend(hubHost);
    }
    return;
  }

  // Clean up any stale host if detached or mismatched
  if (existing) {
    existing.remove();
  }
  if (hubHost) {
    hubHost.remove();
  }

  hubHost = document.createElement('div');
  hubHost.id = 'bt-bookmarks-hub-root';
  hubHost.style.display = isTabActive ? '' : 'none';

  // Always mount at top of primaryColumn
  primaryColumn.prepend(hubHost);

  hubShadow = hubHost.attachShadow({ mode: 'open' });
  hubRoot = createRoot(hubShadow);

  const renderHub = async (
    activeQuery = currentQuery,
    activeFolderId = currentFolderId,
    activeTag = currentTag
  ) => {
    currentQuery = activeQuery;
    currentFolderId = activeFolderId;
    currentTag = activeTag;

    const [folders, bookmarksMap] = await Promise.all([
      foldersItem.getValue(),
      bookmarksItem.getValue(),
    ]);

    const allBookmarks = Object.values(bookmarksMap);
    const totalCount = allBookmarks.length;

    // Calculate item counts per folder
    const countsByFolder: Record<string, number> = {};
    for (const b of allBookmarks) {
      for (const fid of b.folderIds || []) {
        countsByFolder[fid] = (countsByFolder[fid] || 0) + 1;
      }
    }

    // Calculate tag counts
    const tagMap: Record<string, number> = {};
    for (const b of allBookmarks) {
      for (const t of b.tags || []) {
        tagMap[t] = (tagMap[t] || 0) + 1;
      }
    }
    const tags = Object.entries(tagMap).map(([name, count]) => ({ name, count }));

    const handleFilterChange = (q: string, fid: string | null, tag: string | null) => {
      currentQuery = q;
      currentFolderId = fid;
      currentTag = tag;

      const isDefault = !q.trim() && (fid === null || fid === 'all') && !tag;
      if (isDefault) {
        applyFeedFilter(null);
      } else {
        const matches = searchBookmarks(allBookmarks, q, fid, tag);
        const matchingIds = new Set(matches.map((m) => m.id));
        applyFeedFilter(matchingIds, {
          totalBookmarks: totalCount,
          onClearFilters: () => {
            currentQuery = '';
            currentFolderId = null;
            currentTag = null;
            renderHub('', null, null);
          },
          onSyncNow: () => {
            syncBookmarksBackground().catch(() => {});
          },
        });
      }
    };

    if (hubRoot && hubShadow) {
      hubRoot.render(
        React.createElement(ShadowRootProvider, {
          value: hubShadow,
          children: React.createElement(BookmarksToolbar, {
            folders,
            countsByFolder,
            totalCount,
            tags,
            selectedFolderId: currentFolderId,
            selectedTag: currentTag,
            onFilterChange: handleFilterChange,
            onFolderSaved: () => renderHub(currentQuery, currentFolderId, currentTag),
            onFolderDeleted: () => renderHub(currentQuery, null, null),
          }),
        })
      );
    }
  };

  renderHub();

  // Scrape visible bookmarks from DOM as fallback if bookmarks tab is active
  if (isBookmarksTabActive(primaryColumn)) {
    scrapeVisibleBookmarksFromDom().catch(() => {});
  }
  scrapeObserver = new MutationObserver(() => {
    if (isBookmarksTabActive(primaryColumn)) {
      scrapeVisibleBookmarksFromDom().catch(() => {});
    }
  });
  scrapeObserver.observe(primaryColumn, { childList: true, subtree: true });

  // Watch storage updates
  const unwatchFolders = foldersItem.watch(() => {
    renderHub();
  });
  const unwatchBookmarks = bookmarksItem.watch(() => {
    renderHub();
  });

  unwatchStorage = () => {
    unwatchFolders();
    unwatchBookmarks();
  };
}

function setupTablistObserver(primaryColumn: HTMLElement): void {
  if (tabObserver) return;

  tabObserver = new MutationObserver(() => {
    const isTabActive = isBookmarksTabActive(primaryColumn);
    if (isTabActive) {
      if (hubHost) {
        hubHost.style.display = '';
        if (primaryColumn.firstElementChild !== hubHost) {
          primaryColumn.prepend(hubHost);
        }
      }
    } else {
      if (hubHost) {
        hubHost.style.display = 'none';
      }
      clearFeedFilter();
    }
  });

  tabObserver.observe(primaryColumn, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-selected'],
  });
}

export { scrapeVisibleBookmarksFromDom };

export function unmountBookmarksHub(): void {
  stopAutoScrollSync();

  if (primaryColumnObserver) {
    primaryColumnObserver.disconnect();
    primaryColumnObserver = null;
  }

  if (tabObserver) {
    tabObserver.disconnect();
    tabObserver = null;
  }

  if (scrapeObserver) {
    scrapeObserver.disconnect();
    scrapeObserver = null;
  }

  if (unwatchStorage) {
    unwatchStorage();
    unwatchStorage = null;
  }

  if (hubRoot) {
    hubRoot.render(null);
    hubRoot = null;
  }

  const existing = document.getElementById('bt-bookmarks-hub-root');
  if (existing) {
    existing.remove();
  }
  if (hubHost) {
    hubHost.remove();
    hubHost = null;
  }
  hubShadow = null;

  clearFeedFilter();
}
