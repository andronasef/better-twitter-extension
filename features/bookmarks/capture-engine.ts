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
import { isBookmarksRoute } from './routes';
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
  }
}

/**
 * Scrapes all visible tweet articles from the DOM on the bookmarks page.
 */
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

  // Scroll bottom sentinel / last cell into view to trigger IntersectionObserver
  const bottomSentinel =
    document.querySelector('div[data-testid="primaryColumn"] [role="progressbar"]') ||
    document.querySelector('div[data-testid="cellInnerDiv"]:last-child') ||
    document.querySelector('article[data-testid="tweet"]:last-of-type');

  if (bottomSentinel && typeof (bottomSentinel as HTMLElement).scrollIntoView === 'function') {
    (bottomSentinel as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  window.dispatchEvent(new Event('scroll'));
  document.dispatchEvent(new Event('scroll'));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let isSyncLoopRunning = false;

/**
 * Starts continuous auto-scrolling loop while bookmarks sync is active.
 * Intelligently waits for each batch of tweets to finish loading and rendering before scrolling again.
 */
export function startAutoScrollSync(): void {
  if (isSyncLoopRunning) return;
  isSyncLoopRunning = true;
  runAutoScrollLoop().finally(() => {
    isSyncLoopRunning = false;
  });
}

/**
 * Stops the continuous auto-scrolling loop.
 */
export function stopAutoScrollSync(): void {
  isSyncLoopRunning = false;
}

async function runAutoScrollLoop(): Promise<void> {
  // Give the page a brief moment to initialize if just opened
  await sleep(1000);

  let consecutiveEmptyChecks = 0;
  let lastCapturedCount = -1;

  while (isSyncLoopRunning) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      break;
    }

    const path = window.location.pathname;
    const isBookmarksPage = isBookmarksRoute(path);
    if (!isBookmarksPage) {
      stopAutoScrollSync();
      return;
    }

    const syncState = await bookmarkSyncItem.getValue();
    if (syncState.status !== 'syncing') {
      break;
    }

    // 1. Wait if initial page load is still in flight (0 tweets rendered)
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
    if (tweetElements.length === 0) {
      await sleep(1000);
      continue;
    }

    // 2. Ingest any visible tweets from DOM
    await scrapeVisibleBookmarksFromDom();

    // 3. Track captured count progress
    const bookmarks = await bookmarksItem.getValue();
    const currentCount = Object.keys(bookmarks).length;

    if (currentCount > lastCapturedCount) {
      lastCapturedCount = currentCount;
      consecutiveEmptyChecks = 0;
      // Newly loaded batch detected!
      // Crucial: wait for Twitter to fully finish mounting and rendering tweets before scrolling again!
      await sleep(1500);
    }

    // 4. Check if GraphQL already signaled completion
    const checkState = await bookmarkSyncItem.getValue();
    if (checkState.status === 'complete') {
      break;
    }

    // 5. Scroll down to trigger the next batch
    scrollBookmarksToBottom();

    // 6. Wait for Twitter to respond, fetch, and render the next batch of tweets
    let batchArrived = false;
    const scrollTime = Date.now();

    while (Date.now() - scrollTime < 10000 && isSyncLoopRunning) {
      await sleep(600);

      // Check if spinner is visible (Twitter is actively loading)
      const spinnerActive = Boolean(
        document.querySelector('[role="progressbar"]') ||
        document.querySelector('[aria-label*="Loading" i]')
      );
      if (spinnerActive) {
        // Keep waiting while Twitter is fetching over network
        continue;
      }

      // Check if new bookmarks were parsed and saved to storage
      const freshBookmarks = await bookmarksItem.getValue();
      if (Object.keys(freshBookmarks).length > currentCount) {
        batchArrived = true;
        break;
      }

      // Check if new tweet elements were added to the DOM
      const currentTweets = document.querySelectorAll('article[data-testid="tweet"]');
      if (currentTweets.length > tweetElements.length) {
        batchArrived = true;
        break;
      }
    }

    if (batchArrived) {
      consecutiveEmptyChecks = 0;
      // Wait for the new tweets to finish rendering and layout to settle before next scroll
      await sleep(1500);
    } else {
      consecutiveEmptyChecks++;

      // If we waited at the bottom across 3 cycles (~30 seconds) with no spinner and no new tweets,
      // all available bookmarks have been loaded
      if (consecutiveEmptyChecks >= 3) {
        const finalSync = await bookmarkSyncItem.getValue();
        await bookmarkSyncItem.setValue({
          ...finalSync,
          status: 'complete',
          cursor: null,
          lastSyncTime: Date.now(),
          errorReason: null,
        });
        break;
      }
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
    typeof location !== 'undefined' && isBookmarksRoute(location.pathname);

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
      const isBookmarksPage = isBookmarksRoute(path);

      const unwatchSync = bookmarkSyncItem.watch((state) => {
        const currentPath = window.location.pathname;
        const onBookmarks = isBookmarksRoute(currentPath);
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
