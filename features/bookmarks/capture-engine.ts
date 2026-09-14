import {
  bookmarksItem,
  bookmarkSyncItem,
} from '@/lib/storage';
import {
  extractBookmarksFromGraphql,
  extractBookmarkFromDom,
} from './extractor';
import { saveBookmark, removeBookmark } from './storage';
import {
  onBookmarksResponse,
  onBookmarkMutated,
  type BookmarksResponseDetail,
  type BookmarkMutationDetail,
} from '@/entrypoints/x.content/bridge-client';
import type { BookmarkSyncState } from './types';

export const ERROR_COPY = {
  not_logged_in: 'Please log into X to sync bookmarks',
  rate_limited: 'X rate limit reached. Sync will resume shortly.',
  endpoint_changed: 'X endpoint schema changed. Falling back to direct save.',
  network_error: 'Network error occurred while syncing bookmarks.',
} as const;

/**
 * Handles incoming GraphQL bookmarks payload from the MAIN-world bridge (BOOK-01, BOOK-02, BOOK-03).
 */
export async function handleBookmarksPayload(detail: {
  docId?: string;
  data: any;
  status?: number;
}): Promise<void> {
  const syncState = await bookmarkSyncItem.getValue();

  // 1. Check HTTP status code errors (BOOK-03)
  if (detail.status === 401 || detail.status === 403) {
    await bookmarkSyncItem.setValue({
      ...syncState,
      status: 'error',
      errorReason: 'not_logged_in',
    });
    return;
  }

  if (detail.status === 429) {
    await bookmarkSyncItem.setValue({
      ...syncState,
      status: 'error',
      errorReason: 'rate_limited',
    });
    return;
  }

  // 2. Check GraphQL errors in payload body
  if (detail.data?.errors && Array.isArray(detail.data.errors)) {
    const isRateLimit = detail.data.errors.some(
      (err: any) => err.code === 88 || String(err.message).toLowerCase().includes('rate limit')
    );
    if (isRateLimit) {
      await bookmarkSyncItem.setValue({
        ...syncState,
        status: 'error',
        errorReason: 'rate_limited',
      });
      return;
    }
  }

  // 3. Extract items and pagination cursor
  const extraction = extractBookmarksFromGraphql(detail.data);

  if (extraction.schemaMismatch) {
    await bookmarkSyncItem.setValue({
      ...syncState,
      status: 'error',
      errorReason: 'endpoint_changed',
    });
    return;
  }

  // 4. Commit extracted items to storage
  const currentBookmarks = await bookmarksItem.getValue();
  const nextBookmarks = { ...currentBookmarks };

  for (const item of extraction.items) {
    // Preserve existing user folders/tags if already saved locally
    if (nextBookmarks[item.id]) {
      nextBookmarks[item.id] = {
        ...item,
        folderIds: nextBookmarks[item.id]!.folderIds,
        tags: nextBookmarks[item.id]!.tags,
        savedAt: nextBookmarks[item.id]!.savedAt,
      };
    } else {
      nextBookmarks[item.id] = item;
    }
  }

  await bookmarksItem.setValue(nextBookmarks);

  // 5. Update sync checkpoint (BOOK-02)
  const isComplete = extraction.bottomCursor === null;
  const nextStatus = isComplete ? 'complete' : (syncState.status === 'syncing' ? 'syncing' : 'idle');
  await bookmarkSyncItem.setValue({
    ...syncState,
    cursor: extraction.bottomCursor,
    totalCaptured: Object.keys(nextBookmarks).length,
    lastCheckpointTime: Date.now(),
    lastSyncTime: Date.now(),
    status: nextStatus,
    errorReason: null,
  });

  // If still actively syncing on the bookmarks page, auto-scroll to fetch the next batch
  if (!isComplete && syncState.status === 'syncing' && typeof window !== 'undefined') {
    const isBookmarksPage =
      window.location.pathname === '/i/bookmarks' || window.location.pathname === '/bookmarks';
    if (isBookmarksPage) {
      setTimeout(() => {
        window.scrollBy({ top: 1200, behavior: 'smooth' });
      }, 800);
    }
  }
}

/**
 * Synchronizes bookmark mutations between native X actions and Better Twitter (D-09).
 */
export async function handleBookmarkMutation(
  operationName: 'CreateBookmark' | 'DeleteBookmark',
  tweetId: string
): Promise<void> {
  if (!tweetId) return;

  if (operationName === 'DeleteBookmark') {
    await removeBookmark(tweetId);
  } else if (operationName === 'CreateBookmark') {
    const bookmarks = await bookmarksItem.getValue();
    if (!bookmarks[tweetId]) {
      // Try extracting from active DOM if tweet is currently visible
      if (typeof document !== 'undefined') {
        const article = document.querySelector(
          `article:has(a[href*="/status/${tweetId}"])`
        );
        if (article) {
          const item = extractBookmarkFromDom(article);
          if (item) {
            await saveBookmark(item);
          }
        }
      }
    }
  }
}

/**
 * Initiates or resumes background bookmark sync (BOOK-02).
 */
export async function syncBookmarksBackground(): Promise<void> {
  const syncState = await bookmarkSyncItem.getValue();
  await bookmarkSyncItem.setValue({
    ...syncState,
    status: 'syncing',
    errorReason: null,
  });

  const isBookmarksPage =
    typeof location !== 'undefined' &&
    (location.pathname === '/i/bookmarks' || location.pathname === '/bookmarks');

  if (isBookmarksPage) {
    // On the bookmarks page, scroll to trigger next chunk
    window.scrollBy({ top: 1200, behavior: 'smooth' });
  } else {
    // Outside bookmarks page, try updating active tab first, then fallback to message
    try {
      if (typeof browser !== 'undefined' && browser.tabs?.query) {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          await browser.tabs.update(activeTab.id, { url: 'https://x.com/i/bookmarks' });
          return;
        }
      }
    } catch {}

    if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
      try {
        await browser.runtime.sendMessage({ type: 'bt:start-sync' });
      } catch {
        // Handled silently
      }
    }
  }
}

/**
 * Resumes bookmark sync from the last recorded cursor checkpoint (BOOK-02).
 */
export async function resumeSync(): Promise<void> {
  const syncState = await bookmarkSyncItem.getValue();
  if (syncState.status === 'error' || syncState.status === 'paused' || syncState.status === 'idle') {
    await syncBookmarksBackground();
  }
}

/**
 * Capture engine lifecycle controller.
 */
export const captureEngine = {
  init(): () => void {
    const unsubs = [
      onBookmarksResponse((detail) => {
        handleBookmarksPayload(detail).catch(() => {});
      }),
      onBookmarkMutated((detail) => {
        handleBookmarkMutation(detail.operationName, detail.tweetId).catch(() => {});
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  },
  handleBookmarksPayload,
  handleBookmarkMutation,
  syncBookmarksBackground,
  resumeSync,
};
