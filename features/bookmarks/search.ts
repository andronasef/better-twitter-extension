import type { BookmarkItem } from './types';

/**
 * Fast client-side multi-token substring search with folder and tag filters (BOOK-05, D-02).
 * Matches all query tokens across tweet text, author name, author handle, and tags.
 */
export function searchBookmarks(
  bookmarks: BookmarkItem[],
  query: string,
  selectedFolderId?: string | null,
  selectedTag?: string | null
): BookmarkItem[] {
  let filtered = bookmarks;

  if (selectedFolderId && selectedFolderId !== 'all') {
    filtered = filtered.filter((b) => b.folderIds?.includes(selectedFolderId));
  }

  if (selectedTag) {
    filtered = filtered.filter((b) => b.tags?.includes(selectedTag));
  }

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return filtered;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return filtered;
  }

  return filtered.filter((item) => {
    const textLower = (item.text || '').toLowerCase();
    const nameLower = (item.authorName || '').toLowerCase();
    const handleLower = (item.authorHandle || '').toLowerCase();
    const hasTags = item.tags && item.tags.length > 0;

    for (const token of tokens) {
      if (
        textLower.includes(token) ||
        nameLower.includes(token) ||
        handleLower.includes(token)
      ) {
        continue;
      }
      if (hasTags && item.tags.some((t) => t.toLowerCase().includes(token))) {
        continue;
      }
      return false;
    }
    return true;
  });
}

/**
 * Debounce helper with default 150ms delay and cancel capability.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 150
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
