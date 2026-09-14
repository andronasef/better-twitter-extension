import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import {
  initActionBarIntegration,
  teardownActionBarIntegration,
  formatTooltipLabel,
  ensureFallbackSaveButton,
  handleActionBarClick,
  handleActionBarMouseOver,
} from '@/features/bookmarks/action-bar';
import type { BookmarkFolder, BookmarkItem } from '@/features/bookmarks/types';

describe('Bookmarks Action Bar & Dual-Save Integration (BOOK-01, D-05, D-08, D-09, D-10)', () => {
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
        id: 'dev-tools',
        name: 'Dev Tools',
        color: '#1D9BF0',
        createdAt: 100,
        resurfaceEnabled: true,
      },
      {
        id: 'ai',
        name: 'AI',
        color: '#00BA7C',
        createdAt: 200,
        resurfaceEnabled: true,
      },
    ]);
    await bookmarksSettingsItem.setValue({
      resurfacingEnabled: true,
      resurfacingInterval: 20,
      askFolderOnSave: true,
    });
  });

  afterEach(() => {
    teardownActionBarIntegration();
    container.remove();
  });

  it('formats tooltip labels according to UI-SPEC verbatim copy contract (D-10)', () => {
    const folders: BookmarkFolder[] = [
      { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, resurfaceEnabled: true },
      { id: 'dev-tools', name: 'Dev Tools', color: '#1D9BF0', createdAt: 0, resurfaceEnabled: true },
      { id: 'ai', name: 'AI', color: '#00BA7C', createdAt: 0, resurfaceEnabled: true },
    ];

    expect(formatTooltipLabel(['uncategorized'], folders)).toBe('Saved to Uncategorized');
    expect(formatTooltipLabel([], folders)).toBe('Saved to Uncategorized');
    expect(formatTooltipLabel(['dev-tools'], folders)).toBe('Saved in Dev Tools');
    expect(formatTooltipLabel(['dev-tools', 'ai'], folders)).toBe('Saved in Dev Tools, AI');
  });

  it('saves bookmark and mounts popover when native bookmark button is clicked (D-05)', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Alice</span></div>
        <div data-testid="tweetText"><span>Insightful post</span></div>
        <a href="/alice/status/987654321">Link</a>
        <div role="group">
          <button data-testid="bookmark" aria-label="Bookmark">
            <svg></svg>
          </button>
        </div>
      </article>
    `;

    const bookmarkBtn = container.querySelector('button[data-testid="bookmark"]') as HTMLButtonElement;

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(clickEvent, 'target', { value: bookmarkBtn, enumerable: true });

    await handleActionBarClick(clickEvent);

    const saved = await bookmarksItem.getValue();
    expect(saved['987654321']).toBeDefined();
    expect(saved['987654321']!.text).toBe('Insightful post');
    expect(saved['987654321']!.folderIds).toEqual(['uncategorized']);

    // Check that popover root container was appended to body
    const popoverRoot = document.getElementById('bt-folder-selector-root');
    expect(popoverRoot).not.toBeNull();
  });

  it('quick-save mode auto-saves to uncategorized without popover when askFolderOnSave is false (D-08)', async () => {
    await bookmarksSettingsItem.setValue({
      resurfacingEnabled: true,
      resurfacingInterval: 20,
      askFolderOnSave: false,
    });

    container.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Bob</span></div>
        <div data-testid="tweetText"><span>Quick saved tweet</span></div>
        <a href="/bob/status/11223344">Link</a>
        <div role="group">
          <button data-testid="bookmark">Save</button>
        </div>
      </article>
    `;

    const bookmarkBtn = container.querySelector('button[data-testid="bookmark"]') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: bookmarkBtn });

    await handleActionBarClick(clickEvent);

    const saved = await bookmarksItem.getValue();
    expect(saved['11223344']).toBeDefined();
    expect(saved['11223344']!.text).toBe('Quick saved tweet');
    expect(bookmarkBtn.title).toBe('Saved to Uncategorized');
  });

  it('removes bookmark from local storage when native unbookmark button is clicked (D-09)', async () => {
    const existing: BookmarkItem = {
      id: '556677',
      text: 'Tweet to be unbookmarked',
      authorName: 'User',
      authorHandle: 'user',
      authorAvatarUrl: '',
      createdAt: 100,
      savedAt: 100,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };
    await bookmarksItem.setValue({ '556677': existing });

    container.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>User</span></div>
        <a href="/user/status/556677">Link</a>
        <div role="group">
          <button data-testid="removeBookmark" aria-label="Remove from Bookmarks">Remove</button>
        </div>
      </article>
    `;

    const removeBtn = container.querySelector('button[data-testid="removeBookmark"]') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: removeBtn });

    await handleActionBarClick(clickEvent);

    const saved = await bookmarksItem.getValue();
    expect(saved['556677']).toBeUndefined();
  });

  it('injects fallback save button when native bookmark button is absent (BOOK-01, SC 2)', () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <div role="group">
          <button data-testid="like">Like</button>
          <button data-testid="retweet">Repost</button>
        </div>
      </article>
    `;

    const articleEl = container.querySelector('article') as HTMLElement;
    const injectedBtn = ensureFallbackSaveButton(articleEl);

    expect(injectedBtn).not.toBeNull();
    expect(injectedBtn!.getAttribute('data-bt-save-button')).toBe('true');
    expect(injectedBtn!.getAttribute('aria-label')).toBe('Save to Better Twitter bookmarks');

    // Calling again returns existing button without duplicate injection
    const secondCall = ensureFallbackSaveButton(articleEl);
    expect(secondCall).toBe(injectedBtn);
    expect(articleEl.querySelectorAll('button[data-bt-save-button]')).toHaveLength(1);
  });

  it('updates tooltip on mouseover for bookmarked tweets (D-10)', async () => {
    const existing: BookmarkItem = {
      id: '778899',
      text: 'Tweet with multiple custom folders',
      authorName: 'Developer',
      authorHandle: 'dev',
      authorAvatarUrl: '',
      createdAt: 100,
      savedAt: 100,
      folderIds: ['dev-tools', 'ai'],
      tags: [],
      resurfaceCount: 0,
    };
    await bookmarksItem.setValue({ '778899': existing });

    container.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Developer</span></div>
        <a href="/dev/status/778899">Link</a>
        <div role="group">
          <button data-testid="bookmark" title="Bookmark">Bookmark</button>
        </div>
      </article>
    `;

    const bookmarkBtn = container.querySelector('button[data-testid="bookmark"]') as HTMLButtonElement;
    const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true });
    Object.defineProperty(mouseOverEvent, 'target', { value: bookmarkBtn });

    await handleActionBarMouseOver(mouseOverEvent);

    expect(bookmarkBtn.title).toBe('Saved in Dev Tools, AI');
  });
});
