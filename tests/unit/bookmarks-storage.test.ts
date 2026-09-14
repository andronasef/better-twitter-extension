import { describe, it, expect, beforeEach } from 'vitest';
import {
  bookmarksItem,
  foldersItem,
  bookmarkSyncItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import {
  getStorageUsage,
  enforceStorageQuota,
  saveBookmark,
  removeBookmark,
  getBookmarksList,
  renameFolder,
  deleteFolder,
  QUOTA_LIMIT,
  WARNING_THRESHOLD,
  CRITICAL_THRESHOLD,
} from '@/features/bookmarks/storage';
import type { BookmarkItem } from '@/features/bookmarks/types';

describe('Bookmarks Storage & Quota Eviction (BOOK-02, BOOK-10, D-06, D-15, D-16)', () => {
  beforeEach(async () => {
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
    ]);
    await bookmarkSyncItem.setValue({
      status: 'idle',
      cursor: null,
      totalCaptured: 0,
      lastSyncTime: null,
      lastCheckpointTime: null,
      errorReason: null,
    });
    await bookmarksSettingsItem.setValue({
      resurfacingEnabled: true,
      resurfacingInterval: 20,
      askFolderOnSave: true,
    });
  });

  it('initializes default Uncategorized folder with required metadata (D-06)', async () => {
    const folders = await foldersItem.getValue();
    expect(folders).toHaveLength(1);
    expect(folders[0]).toEqual({
      id: 'uncategorized',
      name: 'Uncategorized',
      color: '#71767B',
      createdAt: 0,
      isDefault: true,
      resurfaceEnabled: true,
    });
  });

  it('calculates storage usage and detects warning threshold (80%)', async () => {
    const usageNormal = await getStorageUsage();
    expect(usageNormal.quotaLimit).toBe(QUOTA_LIMIT);
    expect(usageNormal.isWarning).toBe(false);
    expect(usageNormal.isCritical).toBe(false);

    // Test warning detection when usage crosses 80% (WARNING_THRESHOLD)
    const usageWarning = await enforceStorageQuota(WARNING_THRESHOLD + 100);
    expect(usageWarning.prunedCount).toBe(0); // Only critical (95%) prunes
  });

  it('saves and retrieves bookmarks sorted by savedAt descending', async () => {
    const item1: BookmarkItem = {
      id: '1001',
      text: 'First tweet',
      authorName: 'User 1',
      authorHandle: 'user1',
      authorAvatarUrl: 'https://avatar.com/1.png',
      createdAt: 1000,
      savedAt: 1000,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    const item2: BookmarkItem = {
      id: '1002',
      text: 'Second tweet',
      authorName: 'User 2',
      authorHandle: 'user2',
      authorAvatarUrl: 'https://avatar.com/2.png',
      createdAt: 2000,
      savedAt: 2000,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    await saveBookmark(item1);
    await saveBookmark(item2);

    const list = await getBookmarksList();
    expect(list).toHaveLength(2);
    expect(list[0]!.id).toBe('1002');
    expect(list[1]!.id).toBe('1001');

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.totalCaptured).toBe(2);
    expect(sync.lastSyncTime).toBeTypeOf('number');
  });

  it('removes bookmark and updates sync state count', async () => {
    const item: BookmarkItem = {
      id: '1001',
      text: 'To be removed',
      authorName: 'User',
      authorHandle: 'user',
      authorAvatarUrl: 'https://avatar.com/u.png',
      createdAt: 1000,
      savedAt: 1000,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    await saveBookmark(item);
    expect(await getBookmarksList()).toHaveLength(1);

    await removeBookmark('1001');
    expect(await getBookmarksList()).toHaveLength(0);

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.totalCaptured).toBe(0);
  });

  it('auto-prunes oldest uncategorized bookmarks at critical 95% threshold (D-16, BOOK-10)', async () => {
    // Populate with 3 uncategorized items at different savedAt times
    const itemOld: BookmarkItem = {
      id: 'old-1',
      text: 'Oldest uncategorized',
      authorName: 'User Old',
      authorHandle: 'old',
      authorAvatarUrl: 'https://avatar.com/old.png',
      createdAt: 100,
      savedAt: 100,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    const itemNew: BookmarkItem = {
      id: 'new-1',
      text: 'Newer uncategorized',
      authorName: 'User New',
      authorHandle: 'new',
      authorAvatarUrl: 'https://avatar.com/new.png',
      createdAt: 200,
      savedAt: 200,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    await saveBookmark(itemOld);
    await saveBookmark(itemNew);

    // Simulate critical threshold breach
    const result = await enforceStorageQuota(CRITICAL_THRESHOLD + 1000);
    expect(result.prunedCount).toBe(2);

    const remaining = await getBookmarksList();
    expect(remaining).toHaveLength(0);

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.lastPrunedCount).toBe(2);
    expect(sync.lastPrunedAt).toBeTypeOf('number');
  });

  it('strictly protects custom user folders and tagged bookmarks from pruning (D-16, BOOK-10)', async () => {
    // 1 uncategorized untagged (prunable)
    const prunableItem: BookmarkItem = {
      id: 'prunable-1',
      text: 'Uncategorized untagged',
      authorName: 'Author',
      authorHandle: 'author',
      authorAvatarUrl: 'https://avatar.com/a.png',
      createdAt: 100,
      savedAt: 100,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    // 1 item in custom folder (PROTECTED)
    const customFolderItem: BookmarkItem = {
      id: 'custom-folder-1',
      text: 'Important research',
      authorName: 'Scientist',
      authorHandle: 'scientist',
      authorAvatarUrl: 'https://avatar.com/s.png',
      createdAt: 50, // older than prunable!
      savedAt: 50,
      folderIds: ['tech-research'],
      tags: [],
      resurfaceCount: 0,
    };

    // 1 item with custom tag in uncategorized (PROTECTED)
    const taggedItem: BookmarkItem = {
      id: 'tagged-1',
      text: 'Tagged tweet',
      authorName: 'Coder',
      authorHandle: 'coder',
      authorAvatarUrl: 'https://avatar.com/c.png',
      createdAt: 60, // older than prunable!
      savedAt: 60,
      folderIds: ['uncategorized'],
      tags: ['must-read'],
      resurfaceCount: 0,
    };

    await saveBookmark(prunableItem);
    await saveBookmark(customFolderItem);
    await saveBookmark(taggedItem);

    // Trigger critical quota
    const result = await enforceStorageQuota(CRITICAL_THRESHOLD + 5000);
    expect(result.prunedCount).toBe(1);

    const remaining = await getBookmarksList();
    expect(remaining).toHaveLength(2);
    const ids = remaining.map((r) => r.id);
    expect(ids).toContain('custom-folder-1');
    expect(ids).toContain('tagged-1');
    expect(ids).not.toContain('prunable-1');
  });

  describe('Folder renaming and deletion (Category management)', () => {
    it('renames a custom folder and updates color', async () => {
      await foldersItem.setValue([
        { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
        { id: 'dev-tools', name: 'Dev Tools', color: '#1D9BF0', createdAt: 100, resurfaceEnabled: true },
      ]);

      const updated = await renameFolder('dev-tools', 'Coding Tools', '#00BA7C');
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Coding Tools');
      expect(updated?.color).toBe('#00BA7C');

      const folders = await foldersItem.getValue();
      const dev = folders.find((f) => f.id === 'dev-tools');
      expect(dev?.name).toBe('Coding Tools');
      expect(dev?.color).toBe('#00BA7C');
    });

    it('returns null when renaming with empty name or non-existent id', async () => {
      const res1 = await renameFolder('dev-tools', '   ');
      expect(res1).toBeNull();

      const res2 = await renameFolder('non-existent', 'Valid Name');
      expect(res2).toBeNull();
    });

    it('cannot delete default uncategorized folder', async () => {
      const success = await deleteFolder('uncategorized');
      expect(success).toBe(false);

      const folders = await foldersItem.getValue();
      expect(folders.find((f) => f.id === 'uncategorized')).toBeDefined();
    });

    it('deletes a custom folder and moves orphaned bookmarks to uncategorized', async () => {
      await foldersItem.setValue([
        { id: 'uncategorized', name: 'Uncategorized', color: '#71767B', createdAt: 0, isDefault: true, resurfaceEnabled: true },
        { id: 'design', name: 'Design', color: '#FF7A00', createdAt: 100, resurfaceEnabled: true },
        { id: 'code', name: 'Code', color: '#1D9BF0', createdAt: 200, resurfaceEnabled: true },
      ]);

      // Bookmark only in 'design' -> should move to 'uncategorized'
      const b1: BookmarkItem = {
        id: 'tweet-1',
        authorName: 'A',
        authorHandle: 'a',
        authorAvatarUrl: '',
        text: 'Design tweet',
        createdAt: 1000,
        savedAt: 1000,
        folderIds: ['design'],
        tags: [],
        resurfaceCount: 0,
      };

      // Bookmark in both 'design' and 'code' -> should keep 'code'
      const b2: BookmarkItem = {
        id: 'tweet-2',
        authorName: 'B',
        authorHandle: 'b',
        authorAvatarUrl: '',
        text: 'Both tweet',
        createdAt: 2000,
        savedAt: 2000,
        folderIds: ['design', 'code'],
        tags: [],
        resurfaceCount: 0,
      };

      await bookmarksItem.setValue({ 'tweet-1': b1, 'tweet-2': b2 });

      const deleted = await deleteFolder('design');
      expect(deleted).toBe(true);

      // Verify folder removed from foldersItem
      const folders = await foldersItem.getValue();
      expect(folders.find((f) => f.id === 'design')).toBeUndefined();
      expect(folders).toHaveLength(2);

      // Verify bookmarks updated
      const bookmarks = await bookmarksItem.getValue();
      expect(bookmarks['tweet-1']?.folderIds).toEqual(['uncategorized']);
      expect(bookmarks['tweet-2']?.folderIds).toEqual(['code']);
    });
  });
});
