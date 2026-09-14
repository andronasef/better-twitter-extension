import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import {
  selectResurfacingCandidate,
  initResurfacing,
  teardownResurfacing,
  getResurfacingState,
} from '@/features/bookmarks/resurfacing';
import type { BookmarkFolder, BookmarkItem } from '@/features/bookmarks/types';

describe('Bookmarks Resurfacing Engine (BOOK-07, BOOK-08, BOOK-09, D-11, D-12, D-13, D-14)', () => {
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
    {
      id: 'private',
      name: 'Private Archive',
      color: '#F91880',
      createdAt: 200,
      resurfaceEnabled: false,
    },
  ];

  const createItem = (overrides: Partial<BookmarkItem>): BookmarkItem => ({
    id: 'tweet-1',
    authorName: 'Developer',
    authorHandle: 'developer',
    authorAvatarUrl: '',
    text: 'Insightful tweet',
    createdAt: 1000,
    savedAt: 1000,
    folderIds: ['dev-tools'],
    tags: [],
    resurfaceCount: 0,
    ...overrides,
  });

  describe('selectResurfacingCandidate (Smart Rotation Algorithm D-13)', () => {
    it('prioritizes candidate with lowest resurfaceCount', () => {
      const b1 = createItem({ id: 't1', resurfaceCount: 2, savedAt: 100 });
      const b2 = createItem({ id: 't2', resurfaceCount: 0, savedAt: 200 });
      const b3 = createItem({ id: 't3', resurfaceCount: 1, savedAt: 150 });

      const candidate = selectResurfacingCandidate([b1, b2, b3], sampleFolders);
      expect(candidate?.id).toBe('t2');
    });

    it('tie-breaks with longest time since last resurfaced', () => {
      const b1 = createItem({ id: 't1', resurfaceCount: 1, lastResurfacedAt: 5000, savedAt: 100 });
      const b2 = createItem({ id: 't2', resurfaceCount: 1, lastResurfacedAt: 2000, savedAt: 200 });

      const candidate = selectResurfacingCandidate([b1, b2], sampleFolders);
      expect(candidate?.id).toBe('t2');
    });

    it('tie-breaks with oldest savedAt when resurfaceCount and lastResurfacedAt match', () => {
      const b1 = createItem({ id: 't1', resurfaceCount: 0, savedAt: 500 });
      const b2 = createItem({ id: 't2', resurfaceCount: 0, savedAt: 100 });

      const candidate = selectResurfacingCandidate([b1, b2], sampleFolders);
      expect(candidate?.id).toBe('t2');
    });

    it('excludes candidate with active snoozedUntil > now', () => {
      const now = 10000;
      const b1 = createItem({ id: 't1', snoozedUntil: 15000, resurfaceCount: 0 });
      const b2 = createItem({ id: 't2', snoozedUntil: 9000, resurfaceCount: 1 });

      const candidate = selectResurfacingCandidate([b1, b2], sampleFolders, now);
      expect(candidate?.id).toBe('t2');
    });

    it('excludes candidate with neverResurface: true', () => {
      const b1 = createItem({ id: 't1', neverResurface: true, resurfaceCount: 0 });
      const b2 = createItem({ id: 't2', neverResurface: false, resurfaceCount: 1 });

      const candidate = selectResurfacingCandidate([b1, b2], sampleFolders);
      expect(candidate?.id).toBe('t2');
    });

    it('excludes candidate belonging exclusively to disabled folders', () => {
      const b1 = createItem({ id: 't1', folderIds: ['private'], resurfaceCount: 0 });
      const b2 = createItem({ id: 't2', folderIds: ['dev-tools'], resurfaceCount: 1 });

      const candidate = selectResurfacingCandidate([b1, b2], sampleFolders);
      expect(candidate?.id).toBe('t2');
    });

    it('includes candidate if at least one folder is eligible', () => {
      const b1 = createItem({ id: 't1', folderIds: ['private', 'dev-tools'], resurfaceCount: 0 });

      const candidate = selectResurfacingCandidate([b1], sampleFolders);
      expect(candidate?.id).toBe('t1');
    });

    it('returns null when candidate pool is empty', () => {
      const candidate = selectResurfacingCandidate([], sampleFolders);
      expect(candidate).toBeNull();
    });
  });

  describe('initResurfacing & Timeline Injection Controller (BOOK-07, BOOK-08, BOOK-09, D-12, D-14)', () => {
    let container: HTMLDivElement;

    beforeEach(async () => {
      container = document.createElement('div');
      document.body.appendChild(container);

      await foldersItem.setValue(sampleFolders);
      await bookmarksSettingsItem.setValue({
        resurfacingEnabled: true,
        resurfacingInterval: 3, // Cadence: every 3 tweets for test
        askFolderOnSave: true,
      });

      const b1 = createItem({ id: 't1', text: 'Tweet one', resurfaceCount: 0, savedAt: 100 });
      await bookmarksItem.setValue({ t1: b1 });
    });

    afterEach(() => {
      teardownResurfacing();
      container.remove();
      window.history.pushState({}, '', '/');
    });

    it('strictly does not initialize if pathname is not /home or / (D-14)', async () => {
      window.history.pushState({}, '', '/bookmarks');
      await initResurfacing();

      expect(getResurfacingState().isActive).toBe(false);
    });

    it('does not initialize if resurfacingEnabled is false', async () => {
      window.history.pushState({}, '', '/home');
      await bookmarksSettingsItem.setValue({
        resurfacingEnabled: false,
        resurfacingInterval: 3,
        askFolderOnSave: true,
      });

      await initResurfacing();
      expect(getResurfacingState().isActive).toBe(false);
    });

    it('initializes when on /home and tracks tweet count up to interval N', async () => {
      window.history.pushState({}, '', '/home');
      await initResurfacing();

      expect(getResurfacingState().isActive).toBe(true);
      expect(getResurfacingState().tweetCounter).toBe(0);
    });

    it('teardownResurfacing removes injected cards and resets state', async () => {
      window.history.pushState({}, '', '/home');
      await initResurfacing();

      // Simulate an injected card
      const mockCard = document.createElement('div');
      mockCard.setAttribute('data-bt-resurfaced-cell', 'true');
      container.appendChild(mockCard);

      teardownResurfacing();

      expect(getResurfacingState().isActive).toBe(false);
      expect(document.querySelector('[data-bt-resurfaced-cell]')).toBeNull();
    });
  });
});
