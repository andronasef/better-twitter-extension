import {
  bookmarksItem,
  foldersItem,
  bookmarkSyncItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import type { BookmarkItem } from './types';

declare const chrome: any;

export const QUOTA_LIMIT = 10485760; // 10MB
export const WARNING_THRESHOLD = 8388608; // 80% (8.4MB)
export const CRITICAL_THRESHOLD = 9961472; // 95% (9.9MB)

async function calculateBytesFallback(): Promise<number> {
  const [bookmarks, folders, sync, settings] = await Promise.all([
    bookmarksItem.getValue(),
    foldersItem.getValue(),
    bookmarkSyncItem.getValue(),
    bookmarksSettingsItem.getValue(),
  ]);
  const str = JSON.stringify({ bookmarks, folders, sync, settings });
  return new TextEncoder().encode(str).length;
}

export async function getStorageUsage(): Promise<{
  bytesInUse: number;
  quotaLimit: number;
  percent: number;
  isWarning: boolean;
  isCritical: boolean;
}> {
  let bytesInUse: number;

  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local?.getBytesInUse) {
      bytesInUse = await new Promise<number>((resolve) => {
        chrome.storage.local.getBytesInUse(null, (bytes: number | undefined) => {
          if (chrome.runtime?.lastError || bytes === undefined) {
            calculateBytesFallback().then(resolve);
          } else {
            resolve(bytes);
          }
        });
      });
    } else {
      bytesInUse = await calculateBytesFallback();
    }
  } catch {
    bytesInUse = await calculateBytesFallback();
  }

  const percent = Number(((bytesInUse / QUOTA_LIMIT) * 100).toFixed(2));
  const isWarning = bytesInUse >= WARNING_THRESHOLD;
  const isCritical = bytesInUse >= CRITICAL_THRESHOLD;

  return {
    bytesInUse,
    quotaLimit: QUOTA_LIMIT,
    percent,
    isWarning,
    isCritical,
  };
}

export async function enforceStorageQuota(overrideBytesInUse?: number): Promise<{
  prunedCount: number;
  bytesInUse: number;
  percent: number;
}> {
  let usage = await getStorageUsage();
  if (overrideBytesInUse !== undefined) {
    usage = {
      ...usage,
      bytesInUse: overrideBytesInUse,
      percent: Number(((overrideBytesInUse / QUOTA_LIMIT) * 100).toFixed(2)),
      isWarning: overrideBytesInUse >= WARNING_THRESHOLD,
      isCritical: overrideBytesInUse >= CRITICAL_THRESHOLD,
    };
  }

  if (!usage.isCritical) {
    return {
      prunedCount: 0,
      bytesInUse: usage.bytesInUse,
      percent: usage.percent,
    };
  }

  const bookmarks = await bookmarksItem.getValue();
  const allItems = Object.values(bookmarks);

  // Filter strictly uncategorized items with zero tags (D-16, BOOK-10)
  const prunables = allItems.filter(
    (b) =>
      b.folderIds.length === 1 &&
      b.folderIds[0] === 'uncategorized' &&
      (!b.tags || b.tags.length === 0)
  );

  prunables.sort((a, b) => a.savedAt - b.savedAt);

  const pruneBatch = prunables.slice(0, 100);
  if (pruneBatch.length === 0) {
    return {
      prunedCount: 0,
      bytesInUse: usage.bytesInUse,
      percent: usage.percent,
    };
  }

  const nextBookmarks = { ...bookmarks };
  for (const item of pruneBatch) {
    delete nextBookmarks[item.id];
  }

  await bookmarksItem.setValue(nextBookmarks);

  const syncState = await bookmarkSyncItem.getValue();
  await bookmarkSyncItem.setValue({
    ...syncState,
    totalCaptured: Object.keys(nextBookmarks).length,
    lastPrunedCount: pruneBatch.length,
    lastPrunedAt: Date.now(),
  });

  const updatedUsage = await getStorageUsage();
  return {
    prunedCount: pruneBatch.length,
    bytesInUse: updatedUsage.bytesInUse,
    percent: updatedUsage.percent,
  };
}

export async function saveBookmark(item: BookmarkItem): Promise<void> {
  const bookmarks = await bookmarksItem.getValue();
  bookmarks[item.id] = item;
  await bookmarksItem.setValue(bookmarks);

  await enforceStorageQuota();

  const syncState = await bookmarkSyncItem.getValue();
  await bookmarkSyncItem.setValue({
    ...syncState,
    totalCaptured: Object.keys(bookmarks).length,
    lastSyncTime: Date.now(),
  });
}

export async function removeBookmark(id: string): Promise<void> {
  const bookmarks = await bookmarksItem.getValue();
  if (bookmarks[id]) {
    delete bookmarks[id];
    await bookmarksItem.setValue(bookmarks);

    const syncState = await bookmarkSyncItem.getValue();
    await bookmarkSyncItem.setValue({
      ...syncState,
      totalCaptured: Object.keys(bookmarks).length,
    });
  }

  // Also clean up legacy/accidental raw or prefixed keys if present in chrome.storage.local
  try {
    const raw = await (globalThis as any).chrome?.storage?.local?.get(['bookmarks', 'local:bookmarks']);
    if (raw?.bookmarks && raw.bookmarks[id]) {
      delete raw.bookmarks[id];
      await (globalThis as any).chrome?.storage?.local?.set({ bookmarks: raw.bookmarks });
    }
    if (raw?.['local:bookmarks'] && raw['local:bookmarks'][id]) {
      delete raw['local:bookmarks'][id];
      await (globalThis as any).chrome?.storage?.local?.set({ 'local:bookmarks': raw['local:bookmarks'] });
    }
  } catch {}
}

export async function getBookmarksList(): Promise<BookmarkItem[]> {
  const bookmarks = await bookmarksItem.getValue();
  return Object.values(bookmarks).sort((a, b) => b.savedAt - a.savedAt);
}
