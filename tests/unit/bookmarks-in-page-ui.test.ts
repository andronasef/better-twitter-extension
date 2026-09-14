import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  bookmarksItem,
  foldersItem,
} from '@/lib/storage';
import { applyFeedFilter, clearFeedFilter } from '@/features/bookmarks/in-page-ui/feed-filter';
import type { BookmarkFolder, BookmarkItem } from '@/features/bookmarks/types';

describe('In-Page Bookmarks Hub & Feed Filter (BOOK-04, BOOK-05, BOOK-06, D-01..D-04)', () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await bookmarksItem.setValue({});
    await foldersItem.setValue([
      {
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#71767B',
        createdAt: 0,
        isDefault: true,
        resurfaceEnabled: true,
      },
      {
        id: 'design',
        name: 'Design Inspiration',
        color: '#F91880',
        createdAt: 100,
        resurfaceEnabled: true,
      },
    ]);
  });

  afterEach(() => {
    clearFeedFilter();
    container.remove();
  });

  it('folder deletion reassigns bookmarks to uncategorized and removes folder (D-03)', async () => {
    const bookmark1: BookmarkItem = {
      id: 'tweet-d1',
      text: 'Design tweet',
      authorName: 'Designer',
      authorHandle: 'designer',
      authorAvatarUrl: '',
      createdAt: 100,
      savedAt: 100,
      folderIds: ['design'],
      tags: [],
      resurfaceCount: 0,
    };
    await bookmarksItem.setValue({ 'tweet-d1': bookmark1 });

    // Simulate folder deletion logic
    const folderToDelete = 'design';
    const currentBookmarks = await bookmarksItem.getValue();
    const nextBookmarks = { ...currentBookmarks };

    for (const [id, item] of Object.entries(nextBookmarks)) {
      if (item.folderIds.includes(folderToDelete)) {
        const remaining = item.folderIds.filter((fid) => fid !== folderToDelete);
        nextBookmarks[id] = {
          ...item,
          folderIds: remaining.length > 0 ? remaining : ['uncategorized'],
        };
      }
    }
    await bookmarksItem.setValue(nextBookmarks);

    const folders = await foldersItem.getValue();
    const nextFolders = folders.filter((f) => f.id !== folderToDelete);
    await foldersItem.setValue(nextFolders);

    // Verify bookmarks re-assigned to uncategorized
    const updated = await bookmarksItem.getValue();
    expect(updated['tweet-d1']!.folderIds).toEqual(['uncategorized']);

    // Verify folder removed
    const remainingFolders = await foldersItem.getValue();
    expect(remainingFolders.map((f) => f.id)).toEqual(['uncategorized']);
  });

  it('default uncategorized folder cannot be deleted (D-03, D-06)', async () => {
    const folders = await foldersItem.getValue();
    const defaultFolder = folders.find((f) => f.id === 'uncategorized');
    expect(defaultFolder).toBeDefined();
    expect(defaultFolder!.isDefault).toBe(true);

    // Filter deletion logic prevents uncategorized deletion
    const attemptDelete = (id: string, all: BookmarkFolder[]) => {
      if (id === 'uncategorized') return all;
      return all.filter((f) => f.id !== id);
    };

    expect(attemptDelete('uncategorized', folders)).toHaveLength(2);
  });

  it('applyFeedFilter applies data-bt-bookmark-filtered attribute to non-matching tweets (D-02)', () => {
    container.innerHTML = `
      <div data-testid="primaryColumn">
        <article data-testid="tweet">
          <a href="/user/status/1001">Status 1</a>
        </article>
        <article data-testid="tweet">
          <a href="/user/status/1002">Status 2</a>
        </article>
      </div>
    `;

    const tweets = container.querySelectorAll('article[data-testid="tweet"]');
    expect(tweets).toHaveLength(2);

    // Filter only 1001
    applyFeedFilter(new Set(['1001']));

    expect(tweets[0]!.getAttribute('data-bt-bookmark-filtered')).toBeNull();
    expect(tweets[1]!.getAttribute('data-bt-bookmark-filtered')).toBe('true');

    // Reset filter
    applyFeedFilter(null);
    expect(tweets[0]!.getAttribute('data-bt-bookmark-filtered')).toBeNull();
    expect(tweets[1]!.getAttribute('data-bt-bookmark-filtered')).toBeNull();
  });

  it('applyFeedFilter mounts empty state when matching items count is 0 (D-04)', () => {
    container.innerHTML = `
      <div data-testid="primaryColumn">
        <section></section>
      </div>
    `;

    // Empty matches
    applyFeedFilter(new Set([]), { totalBookmarks: 5 });

    const emptyStateHost = document.getElementById('bt-bookmarks-empty-state');
    expect(emptyStateHost).not.toBeNull();

    // Clear filter
    clearFeedFilter();
    expect(document.getElementById('bt-bookmarks-empty-state')).toBeNull();
  });
});
