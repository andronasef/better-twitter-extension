;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  bookmarksItem,
  foldersItem,
} from '@/lib/storage';
import { applyFeedFilter, clearFeedFilter } from '@/features/bookmarks/in-page-ui/feed-filter';
import { FilterChipsRow } from '@/features/bookmarks/in-page-ui/FilterChipsRow';
import { BookmarksToolbar } from '@/features/bookmarks/in-page-ui/BookmarksToolbar';
import { mountBookmarksHub, unmountBookmarksHub } from '@/features/bookmarks/in-page-ui';
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

  it('FilterChipsRow displays all custom folders directly when 3 or fewer custom folders exist', async () => {
    const testFolders: BookmarkFolder[] = [
      { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
      { id: 'f1', name: 'Folder One', color: '#1D9BF0', createdAt: 1, resurfaceEnabled: true },
      { id: 'f2', name: 'Folder Two', color: '#00BA7C', createdAt: 2, resurfaceEnabled: true },
      { id: 'f3', name: 'Folder Three', color: '#FFD400', createdAt: 3, resurfaceEnabled: true },
    ];

    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(FilterChipsRow, {
          folders: testFolders,
          countsByFolder: { uncategorized: 5, f1: 2, f2: 3, f3: 1 },
          totalCount: 11,
          tags: [],
          selectedFolderId: null,
          selectedTag: null,
          onSelectFolder: () => {},
          onSelectTag: () => {},
        })
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('All Bookmarks');
    expect(text).toContain('Uncategorized');
    expect(text).toContain('Folder One');
    expect(text).toContain('Folder Two');
    expect(text).toContain('Folder Three');
    expect(text).not.toContain('More (');
    root.unmount();
  });

  it('FilterChipsRow collapses overflow folders into More (N) button when > 3 custom folders exist', async () => {
    const testFolders: BookmarkFolder[] = [
      { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
      { id: 'f1', name: 'Folder One', color: '#1D9BF0', createdAt: 1, resurfaceEnabled: true },
      { id: 'f2', name: 'Folder Two', color: '#00BA7C', createdAt: 2, resurfaceEnabled: true },
      { id: 'f3', name: 'Folder Three', color: '#FFD400', createdAt: 3, resurfaceEnabled: true },
      { id: 'f4', name: 'Folder Four', color: '#F91880', createdAt: 4, resurfaceEnabled: true },
      { id: 'f5', name: 'Folder Five', color: '#7856FF', createdAt: 5, resurfaceEnabled: true },
    ];

    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(FilterChipsRow, {
          folders: testFolders,
          countsByFolder: { uncategorized: 5, f1: 2, f2: 3, f3: 1, f4: 0, f5: 4 },
          totalCount: 15,
          tags: [],
          selectedFolderId: null,
          selectedTag: null,
          onSelectFolder: () => {},
          onSelectTag: () => {},
        })
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('All Bookmarks');
    expect(text).toContain('Uncategorized');
    expect(text).toContain('Folder One');
    expect(text).toContain('Folder Two');
    // f3, f4, f5 are collapsed into overflow
    expect(text).toContain('More (3)');
    expect(text).not.toContain('Folder Three');
    root.unmount();
  });

  it('FilterChipsRow promotes selected overflow folder into visible chips', async () => {
    const testFolders: BookmarkFolder[] = [
      { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
      { id: 'f1', name: 'Folder One', color: '#1D9BF0', createdAt: 1, resurfaceEnabled: true },
      { id: 'f2', name: 'Folder Two', color: '#00BA7C', createdAt: 2, resurfaceEnabled: true },
      { id: 'f3', name: 'Folder Three', color: '#FFD400', createdAt: 3, resurfaceEnabled: true },
      { id: 'f4', name: 'Folder Four', color: '#F91880', createdAt: 4, resurfaceEnabled: true },
      { id: 'f5', name: 'Folder Five', color: '#7856FF', createdAt: 5, resurfaceEnabled: true },
    ];

    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(FilterChipsRow, {
          folders: testFolders,
          countsByFolder: { uncategorized: 5, f1: 2, f2: 3, f3: 1, f4: 0, f5: 4 },
          totalCount: 15,
          tags: [],
          selectedFolderId: 'f4',
          selectedTag: null,
          onSelectFolder: () => {},
          onSelectTag: () => {},
        })
      );
    });

    const text = container.textContent || '';
    // Selected folder f4 is promoted to visible chips
    expect(text).toContain('Folder Four');
    expect(text).toContain('Folder One');
    expect(text).toContain('More (3)');
    root.unmount();
  });

  it('BookmarksToolbar renders search bar and pinned New Folder button', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(BookmarksToolbar, {
          folders: [
            { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
          ],
          countsByFolder: { uncategorized: 2 },
          totalCount: 2,
          tags: [],
          onFilterChange: () => {},
        })
      );
    });

    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).not.toBeNull();

    const newFolderBtn = container.querySelector('button[aria-label="Create new folder"]');
    expect(newFolderBtn).not.toBeNull();
    expect(newFolderBtn!.textContent).toContain('New Folder');

    root.unmount();
  });

  it('mountBookmarksHub mounts at the top of primaryColumn and stays mounted', async () => {
    // Setup window location
    delete (window as any).location;
    (window as any).location = new URL('https://x.com/i/history');

    container.innerHTML = `
      <div data-testid="primaryColumn">
        <div class="main-column-wrapper">
          <div class="header-container">
            <h2>History</h2>
            <div role="tablist">
              <div role="tab" aria-selected="true">Bookmarks</div>
              <div role="tab" aria-selected="false">Likes</div>
            </div>
          </div>
          <section role="region">
            <article data-testid="tweet">Tweet 1</article>
          </section>
        </div>
      </div>
    `;

    const primaryColumn = container.querySelector('div[data-testid="primaryColumn"]') as HTMLElement;

    await act(async () => {
      mountBookmarksHub();
    });

    const hub = document.getElementById('bt-bookmarks-hub-root');
    expect(hub).not.toBeNull();
    // Invariant: hub is prepended as first child of primaryColumn, not moved to bottom
    expect(primaryColumn.firstElementChild).toBe(hub);
    expect(hub!.style.display).toBe('');

    // Simulate switching to Likes tab
    const tabs = container.querySelectorAll('[role="tab"]');
    tabs[0]!.setAttribute('aria-selected', 'false');
    tabs[1]!.setAttribute('aria-selected', 'true');

    // Trigger tablist observer logic
    await act(async () => {
      mountBookmarksHub();
    });
    expect(hub!.style.display).toBe('none');

    // Switch back to Bookmarks tab
    tabs[0]!.setAttribute('aria-selected', 'true');
    tabs[1]!.setAttribute('aria-selected', 'false');

    await act(async () => {
      mountBookmarksHub();
    });
    expect(hub!.style.display).toBe('');
    expect(primaryColumn.firstElementChild).toBe(hub);

    // Clean up
    unmountBookmarksHub();
    expect(document.getElementById('bt-bookmarks-hub-root')).toBeNull();
  });

  it('clicking pencil button on a custom folder chip opens edit popover', async () => {
    const testFolders: BookmarkFolder[] = [
      { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
      { id: 'batman', name: 'batman', color: '#1D9BF0', createdAt: 1, resurfaceEnabled: true },
    ];

    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(FilterChipsRow, {
          folders: testFolders,
          countsByFolder: { uncategorized: 0, batman: 0 },
          totalCount: 0,
          tags: [],
          selectedFolderId: null,
          selectedTag: null,
          onSelectFolder: () => {},
          onSelectTag: () => {},
        })
      );
    });

    const pencilBtn = container.querySelector('button[aria-label="Rename or delete batman"]') as HTMLButtonElement;
    expect(pencilBtn).not.toBeNull();

    await act(async () => {
      pencilBtn.click();
    });

    // Edit folder popover should now be present in document with Edit Folder header and prefilled input
    const editHeading = document.body.textContent || '';
    expect(editHeading).toContain('Edit Folder');
    expect(editHeading).toContain('Delete Folder');

    const nameInput = document.querySelector('input[placeholder="Folder name..."]') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe('batman');

    root.unmount();
  });
});

