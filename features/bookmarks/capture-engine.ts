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
  const isComplete =
    extraction.bottomCursor === null ||
    extraction.items.length === 0 ||
    (extraction.bottomCursor === syncState.cursor && extraction.items.length === 0);

  const nextStatus = isComplete
    ? 'complete'
    : syncState.status === 'syncing'
      ? 'syncing'
      : 'idle';

  await bookmarkSyncItem.setValue({
    ...syncState,
    cursor: isComplete ? null : extraction.bottomCursor,
    totalCaptured: Object.keys(nextBookmarks).length,
    lastCheckpointTime: Date.now(),
    lastSyncTime: Date.now(),
    status: nextStatus,
    errorReason: null,
  });

  if (isComplete) {
    stopAutoScrollSync();
  } else if (nextStatus === 'syncing') {
    startAutoScrollSync();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        scrollBookmarksToBottom();
      }, 500);
    }
  }
}

/**
 * Safely scrolls the bookmarks timeline to the bottom to trigger X's infinite-scroll sentinel.
 */
export function scrollBookmarksToBottom(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const scrollTarget = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0
  );

  window.scrollTo({ top: scrollTarget, behavior: 'smooth' });

  // Also check if primary column has an independent scroll container
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  if (
    primaryColumn &&
    (primaryColumn as HTMLElement).scrollHeight > (primaryColumn as HTMLElement).clientHeight
  ) {
    (primaryColumn as HTMLElement).scrollTop = (primaryColumn as HTMLElement).scrollHeight;
  }

  window.dispatchEvent(new Event('scroll'));
  document.dispatchEvent(new Event('scroll'));
}

let autoScrollTimer: ReturnType<typeof setInterval> | null = null;
let lastCapturedCount = -1;
let stagnantCycles = 0;

/**
 * Starts continuous auto-scrolling loop while bookmarks sync is active.
 */
export function startAutoScrollSync(): void {
  if (autoScrollTimer) return;

  stagnantCycles = 0;
  lastCapturedCount = -1;

  // Immediately trigger initial scroll
  scrollBookmarksToBottom();

  autoScrollTimer = setInterval(async () => {
    if (typeof window === 'undefined') {
      stopAutoScrollSync();
      return;
    }

    const path = window.location.pathname;
    const isBookmarksPage = path === '/bookmarks' || path.startsWith('/i/bookmarks');
    if (!isBookmarksPage) {
      stopAutoScrollSync();
      return;
    }

    const syncState = await bookmarkSyncItem.getValue();
    if (syncState.status !== 'syncing') {
      stopAutoScrollSync();
      return;
    }

    const bookmarks = await bookmarksItem.getValue();
    const currentCount = Object.keys(bookmarks).length;

    if (currentCount === lastCapturedCount) {
      stagnantCycles++;
    } else {
      stagnantCycles = 0;
      lastCapturedCount = currentCount;
    }

    // If 4 consecutive cycles (~6 seconds) yield no new items while scrolled to the bottom,
    // we have reached the end of the user's bookmarks
    if (stagnantCycles >= 4) {
      stopAutoScrollSync();
      await bookmarkSyncItem.setValue({
        ...syncState,
        status: 'complete',
        cursor: null,
        lastSyncTime: Date.now(),
        errorReason: null,
      });
      return;
    }

    scrollBookmarksToBottom();
  }, 1500);
}

/**
 * Stops the continuous auto-scrolling loop.
 */
export function stopAutoScrollSync(): void {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
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
    startAutoScrollSync();
    scrollBookmarksToBottom();
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
    const unsubs: Array<() => void> = [
      onBookmarksResponse((detail) => {
        handleBookmarksPayload(detail).catch(() => {});
      }),
      onBookmarkMutated((detail) => {
        handleBookmarkMutation(detail.operationName, detail.tweetId).catch(() => {});
      }),
    ];

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isBookmarksPage = path === '/bookmarks' || path.startsWith('/i/bookmarks');

      const unwatchSync = bookmarkSyncItem.watch((state) => {
        const currentPath = window.location.pathname;
        const onBookmarks = currentPath === '/bookmarks' || currentPath.startsWith('/i/bookmarks');
        if (state?.status === 'syncing' && onBookmarks) {
          startAutoScrollSync();
        } else if (state?.status !== 'syncing') {
          stopAutoScrollSync();
        }
      });
      unsubs.push(unwatchSync);

      if (isBookmarksPage) {
        bookmarkSyncItem.getValue().then((state) => {
          if (state?.status === 'syncing') {
            startAutoScrollSync();
          }
        });
      }
    }

    return () => {
      stopAutoScrollSync();
      unsubs.forEach((u) => u());
    };
  },
  handleBookmarksPayload,
  handleBookmarkMutation,
  syncBookmarksBackground,
  resumeSync,
  startAutoScrollSync,
  stopAutoScrollSync,
  scrollBookmarksToBottom,
};
