import { describe, it, expect, beforeEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
  bookmarkSyncItem,
  bookmarkAutoSyncItem,
} from '@/lib/storage';
import { BookmarksPanel } from '@/entrypoints/popup/BookmarksPanel';
import type { BookmarkFolder, BookmarkItem } from '@/features/bookmarks/types';

describe('Popup BookmarksPanel (BOOK-08, BOOK-10, D-08, D-12, D-13, D-16, D-17)', () => {
  let container: HTMLDivElement;

  const sampleFolders: BookmarkFolder[] = [
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
  ];

  const sampleBookmarks: Record<string, BookmarkItem> = {
    t1: {
      id: 't1',
      authorName: 'Developer',
      authorHandle: 'developer',
      authorAvatarUrl: '',
      text: 'First tweet',
      createdAt: 1000,
      savedAt: 1000,
      folderIds: ['dev-tools'],
      tags: [],
      resurfaceCount: 0,
    },
    t2: {
      id: 't2',
      authorName: 'Creator',
      authorHandle: 'creator',
      authorAvatarUrl: '',
      text: 'Second tweet',
      createdAt: 2000,
      savedAt: 2000,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    },
  };

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await bookmarksItem.setValue(sampleBookmarks);
    await foldersItem.setValue(sampleFolders);
    await bookmarksSettingsItem.setValue({
      resurfacingEnabled: true,
      resurfacingInterval: 20,
      askFolderOnSave: true,
    });
    await bookmarkSyncItem.setValue({
      status: 'idle',
      lastSyncTime: Date.now() - 3600000, // 1 hr ago
      totalCaptured: 2,
      lastCheckpointTime: null,
      cursor: null,
      errorReason: null,
    });
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: null,
    });
  });

  it('renders sync card with bookmark count and last synced label', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    expect(container.textContent).toContain('2 Bookmarks Captured');
    expect(container.textContent).toContain('Sync Bookmarks Now');

    root.unmount();
  });

  it('shows syncing state with progress when sync is active', async () => {
    await bookmarkSyncItem.setValue({
      status: 'syncing',
      lastSyncTime: Date.now(),
      totalCaptured: 2,
      lastCheckpointTime: null,
      cursor: 'cur-1',
      errorReason: null,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    expect(container.textContent).toContain('Syncing bookmarks: 2 captured...');

    root.unmount();
  });

  it('shows error banner and Resume Sync CTA when sync is paused/error', async () => {
    await bookmarkSyncItem.setValue({
      status: 'error',
      lastSyncTime: Date.now(),
      totalCaptured: 2,
      lastCheckpointTime: null,
      cursor: 'cur-1',
      errorReason: 'not_logged_in',
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    expect(container.textContent).toContain('Resume Sync');
    expect(container.textContent).toContain(
      "Bookmark Sync Paused: Unable to connect to X or session expired. Please verify you are logged into x.com and click 'Resume Sync'."
    );

    root.unmount();
  });

  it('updates cadence slider and commits to bookmarksSettingsItem', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    const slider = container.querySelector('input[aria-label="Resurface interval in tweets"]') as HTMLInputElement;
    expect(slider).not.toBeNull();
    expect(slider.value).toBe('20');

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeSetter?.call(slider, '35');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const settings = await bookmarksSettingsItem.getValue();
    expect(settings.resurfacingInterval).toBe(35);

    root.unmount();
  });

  it('toggles folder eligibility and commits to foldersItem', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    const devToolsItem = Array.from(container.querySelectorAll('[data-slot="folder-eligibility-item"]'))
      .find((el) => el.textContent?.includes('Dev Tools'));
    expect(devToolsItem).not.toBeUndefined();

    const checkbox = devToolsItem?.querySelector('button, [role="checkbox"], input[type="checkbox"]') as HTMLElement;
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox.click();
    });

    const folders = await foldersItem.getValue();
    const updated = folders.find((f) => f.id === 'dev-tools');
    expect(updated?.resurfaceEnabled).toBe(false);

    root.unmount();
  });

  it('calculates quota and displays 80% warning banner when usage exceeds threshold', async () => {
    // Generate large payload in bookmarks to trigger >= 80% of 10MB quota (~8.5MB)
    const largeBookmarks: Record<string, BookmarkItem> = {};
    const dummyText = 'A'.repeat(500000); // 500KB per item * 18 items = 9MB
    for (let i = 0; i < 18; i++) {
      largeBookmarks[`item-${i}`] = {
        id: `item-${i}`,
        authorName: 'User',
        authorHandle: 'user',
        authorAvatarUrl: '',
        text: dummyText,
        createdAt: 1000,
        savedAt: 1000,
        folderIds: ['uncategorized'],
        tags: [],
        resurfaceCount: 0,
      };
    }
    await bookmarksItem.setValue(largeBookmarks);

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    expect(container.textContent).toContain(
      'Storage 80% Full: Older uncategorized bookmarks will be auto-pruned if storage fills completely. Custom folders are protected.'
    );

    root.unmount();
  });

  it('exports bookmarks and folders into JSON format', async () => {
    let createdUrl = '';
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      createdUrl = 'blob:mock-url';
      return createdUrl;
    });
    URL.revokeObjectURL = vi.fn();

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    const exportBtn = Array.from(container.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Export Bookmarks'));
    expect(exportBtn).not.toBeUndefined();

    await act(async () => {
      exportBtn?.click();
    });

    expect(URL.createObjectURL).toHaveBeenCalled();

    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    root.unmount();
  });

  it('imports valid JSON and merges bookmarks into storage', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const importPayload = {
      version: 1,
      bookmarks: {
        t99: {
          id: 't99',
          authorName: 'Imported Author',
          authorHandle: 'imported',
          text: 'Imported tweet content',
          createdAt: 3000,
          savedAt: 3000,
          folderIds: ['dev-tools'],
          tags: [],
          resurfaceCount: 0,
        },
      },
    };

    const file = new File([JSON.stringify(importPayload)], 'bookmarks.json', {
      type: 'application/json',
    });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: true,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const bookmarks = await bookmarksItem.getValue();
    expect(bookmarks['t99']).not.toBeUndefined();
    expect(bookmarks['t99']?.text).toBe('Imported tweet content');

    root.unmount();
  });

  it('renders the auto-sync toggle', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    expect(container.textContent).toContain('Auto-sync every 7 days');

    root.unmount();
  });

  it('shows the overdue hint only when a sync is due', async () => {
    let root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });
    expect(container.textContent).not.toContain('Sync is overdue');
    root.unmount();

    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: Date.now(),
    });

    root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });
    expect(container.textContent).toContain('Sync is overdue');

    root.unmount();
  });

  it('persists the auto-sync toggle without clearing timestamps', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: 1234,
      dueSince: 5678,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(BookmarksPanel));
    });

    const btn = container.querySelector<HTMLButtonElement>(
      'button[role="switch"]#toggle-auto-sync'
    );
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
    });

    const record = await bookmarkAutoSyncItem.getValue();
    expect(record.enabled).toBe(false);
    expect(record.lastAutoSyncAt).toBe(1234);
    expect(record.dueSince).toBe(5678);

    root.unmount();
  });
});
