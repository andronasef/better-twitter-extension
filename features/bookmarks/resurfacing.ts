import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { onTweetSeen } from '@/entrypoints/x.content/pipeline';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import { ShadowRootProvider } from '@/components/shadow-portal';
import { ResurfacedCard } from './ResurfacedCard';
import type { BookmarkItem, BookmarkFolder } from './types';

let isActive = false;
let tweetCounter = 0;
let unsubTweetSeen: (() => void) | null = null;
const mountedRoots: { root: Root; container: HTMLElement }[] = [];

/**
 * Returns current resurfacing runtime state (for testing & diagnostics).
 */
export function getResurfacingState() {
  return {
    isActive,
    tweetCounter,
    mountedCount: mountedRoots.length,
  };
}

/**
 * Smart spaced rotation algorithm (D-13).
 * Ranks bookmarks by:
 * 1. Filter out neverResurface: true
 * 2. Filter out snoozedUntil > now
 * 3. Filter out bookmarks belonging only to folders where resurfaceEnabled === false
 * 4. Multi-factor sort:
 *    - Lowest resurfaceCount ascending
 *    - Longest time since lastResurfacedAt ascending
 *    - Oldest savedAt ascending
 */
export function selectResurfacingCandidate(
  bookmarks: BookmarkItem[],
  folders: BookmarkFolder[],
  now: number = Date.now()
): BookmarkItem | null {
  const eligibleFolderIds = new Set<string>();
  let uncategorizedExplicitlyDisabled = false;

  for (const folder of folders) {
    if (folder.resurfaceEnabled !== false) {
      eligibleFolderIds.add(folder.id);
    } else if (folder.id === 'uncategorized') {
      uncategorizedExplicitlyDisabled = true;
    }
  }

  // If uncategorized is not explicitly defined in folders, it is enabled by default
  if (!uncategorizedExplicitlyDisabled && !folders.some((f) => f.id === 'uncategorized')) {
    eligibleFolderIds.add('uncategorized');
  }

  const candidates = bookmarks.filter((item) => {
    // 1. Exclude neverResurface
    if (item.neverResurface === true) {
      return false;
    }

    // 2. Exclude active snoozes
    if (item.snoozedUntil && item.snoozedUntil > now) {
      return false;
    }

    // 3. Exclude if all assigned folders are disabled
    const folderIds =
      item.folderIds && item.folderIds.length > 0 ? item.folderIds : ['uncategorized'];
    const hasEligibleFolder = folderIds.some((fid) => eligibleFolderIds.has(fid));
    if (!hasEligibleFolder) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  // 4. Multi-factor ranking
  candidates.sort((a, b) => {
    // Primary: lowest resurfaceCount ascending
    const countA = a.resurfaceCount ?? 0;
    const countB = b.resurfaceCount ?? 0;
    if (countA !== countB) {
      return countA - countB;
    }

    // Secondary: longest time since last resurfaced ascending
    const lastA = a.lastResurfacedAt ?? 0;
    const lastB = b.lastResurfacedAt ?? 0;
    if (lastA !== lastB) {
      return lastA - lastB;
    }

    // Tertiary: oldest saved bookmark first ascending
    return (a.savedAt ?? 0) - (b.savedAt ?? 0);
  });

  return candidates[0] ?? null;
}

/**
 * Initializes timeline resurfacing on /home or / feeds (BOOK-07, BOOK-08, BOOK-09, D-14).
 */
export async function initResurfacing(): Promise<void> {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  // Strict scope check: /home or / only (D-14)
  if (pathname !== '/home' && pathname !== '/') {
    return;
  }

  const settings = await bookmarksSettingsItem.getValue();
  if (!settings || !settings.resurfacingEnabled) {
    return;
  }

  if (isActive) {
    return;
  }

  isActive = true;
  tweetCounter = 0;
  const interval = Math.max(5, Math.min(50, settings.resurfacingInterval ?? 20));

  unsubTweetSeen = onTweetSeen(async (cell) => {
    if (!isActive) return;

    tweetCounter++;
    if (tweetCounter < interval) {
      return;
    }

    tweetCounter = 0;

    const [bookmarksMap, folders] = await Promise.all([
      bookmarksItem.getValue(),
      foldersItem.getValue(),
    ]);

    const allBookmarks = Object.values(bookmarksMap || {});
    const candidate = selectResurfacingCandidate(allBookmarks, folders || []);
    if (!candidate) {
      return;
    }

    // Virtualizer protection: contain: content and overflow-anchor: auto (BOOK-09)
    const container = document.createElement('div');
    container.setAttribute('data-bt-resurfaced-cell', 'true');
    container.style.cssText =
      'contain: content; min-height: 120px; overflow-anchor: auto; margin-bottom: 12px;';

    if (cell.parentElement) {
      cell.parentElement.insertBefore(container, cell.nextSibling);
    } else {
      return;
    }

    const shadow = container.attachShadow({ mode: 'open' });
    const root = createRoot(shadow);
    mountedRoots.push({ root, container });

    const handleDismiss = () => {
      root.unmount();
      container.remove();
      const idx = mountedRoots.findIndex((m) => m.container === container);
      if (idx >= 0) mountedRoots.splice(idx, 1);
    };

    root.render(
      React.createElement(ShadowRootProvider, {
        value: shadow,
        children: React.createElement(ResurfacedCard, {
          bookmark: candidate,
          folders: folders || [],
          onDismiss: handleDismiss,
        }),
      })
    );

    // Commit updated resurfaceCount & lastResurfacedAt
    const updatedCandidate: BookmarkItem = {
      ...candidate,
      resurfaceCount: (candidate.resurfaceCount ?? 0) + 1,
      lastResurfacedAt: Date.now(),
    };
    bookmarksMap[candidate.id] = updatedCandidate;
    await bookmarksItem.setValue(bookmarksMap);
  });
}

/**
 * Tears down resurfacing listeners and unmounts injected elements.
 */
export function teardownResurfacing(): void {
  isActive = false;
  tweetCounter = 0;

  if (unsubTweetSeen) {
    unsubTweetSeen();
    unsubTweetSeen = null;
  }

  // Clean up all mounted React roots
  for (const { root, container } of mountedRoots) {
    try {
      root.unmount();
      container.remove();
    } catch {
      // Handled silently
    }
  }
  mountedRoots.length = 0;

  // Clean up any stray containers in DOM
  if (typeof document !== 'undefined') {
    const strayCards = document.querySelectorAll('[data-bt-resurfaced-cell]');
    strayCards.forEach((card) => card.remove());
  }
}
