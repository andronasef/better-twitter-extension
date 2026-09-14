import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BookmarksToolbar } from './BookmarksToolbar';
import { applyFeedFilter, clearFeedFilter } from './feed-filter';
import { foldersItem, bookmarksItem, bookmarkSyncItem } from '@/lib/storage';
import { searchBookmarks } from '../search';
import { syncBookmarksBackground, stopAutoScrollSync } from '../capture-engine';
import { extractBookmarkFromDom } from '../extractor';
import { ShadowRootProvider } from '@/components/shadow-portal';
import type { BookmarkFolder, BookmarkItem } from '../types';

let hubHost: HTMLDivElement | null = null;
let hubShadow: ShadowRoot | null = null;
let hubRoot: Root | null = null;
let unwatchStorage: (() => void) | null = null;

export function mountBookmarksHub(): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (pathname !== '/bookmarks' && !pathname.startsWith('/i/bookmarks')) {
    return;
  }

  if (document.getElementById('bt-bookmarks-hub-root')) {
    return;
  }

  const primaryColumn = document.querySelector('div[data-testid="primaryColumn"]');
  if (!primaryColumn) return;

  hubHost = document.createElement('div');
  hubHost.id = 'bt-bookmarks-hub-root';

  // Mount at top of primaryColumn below sticky header
  const header = primaryColumn.querySelector('div[data-testid="TopNavBar"], section > h1, section > h2');
  if (header && header.parentElement) {
    header.parentElement.insertBefore(hubHost, header.nextSibling);
  } else {
    primaryColumn.prepend(hubHost);
  }

  hubShadow = hubHost.attachShadow({ mode: 'open' });
  hubRoot = createRoot(hubShadow);

  const renderHub = async (activeQuery = '', activeFolderId: string | null = null, activeTag: string | null = null) => {
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
      activeQuery = q;
      activeFolderId = fid;
      activeTag = tag;

      const isDefault = !q.trim() && (fid === null || fid === 'all') && !tag;
      if (isDefault) {
        applyFeedFilter(null);
      } else {
        const matches = searchBookmarks(allBookmarks, q, fid, tag);
        const matchingIds = new Set(matches.map((m) => m.id));
        applyFeedFilter(matchingIds, {
          totalBookmarks: totalCount,
          onClearFilters: () => {
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
            onFilterChange: handleFilterChange,
            onFolderSaved: () => renderHub(activeQuery, activeFolderId, activeTag),
            onFolderDeleted: () => renderHub(activeQuery, null, null),
          }),
        })
      );
    }
  };

  renderHub();

  // Scrape visible bookmarks from DOM as fallback
  scrapeVisibleBookmarksFromDom().catch(() => {});
  if (primaryColumn) {
    scrapeObserver = new MutationObserver(() => {
      scrapeVisibleBookmarksFromDom().catch(() => {});
    });
    scrapeObserver.observe(primaryColumn, { childList: true, subtree: true });
  }

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

let scrapeObserver: MutationObserver | null = null;

export async function scrapeVisibleBookmarksFromDom(): Promise<number> {
  if (typeof document === 'undefined') return 0;
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  if (articles.length === 0) return 0;

  const currentBookmarks = await bookmarksItem.getValue();
  let added = 0;
  const next = { ...currentBookmarks };

  articles.forEach((art) => {
    const item = extractBookmarkFromDom(art);
    if (item && item.id && !next[item.id]) {
      next[item.id] = item;
      added++;
    }
  });

  if (added > 0) {
    await bookmarksItem.setValue(next);
    const syncState = await bookmarkSyncItem.getValue();
    await bookmarkSyncItem.setValue({
      ...syncState,
      totalCaptured: Object.keys(next).length,
      lastSyncTime: Date.now(),
      errorReason: null,
    });
  }
  return added;
}

export function unmountBookmarksHub(): void {
  stopAutoScrollSync();

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
  }

  if (hubHost && hubHost.parentElement) {
    hubHost.remove();
    hubHost = null;
    hubShadow = null;
    hubRoot = null;
  }

  clearFeedFilter();
}
