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

    it('injects candidate inside cellInnerDiv when interval is reached', async () => {
      window.history.pushState({}, '', '/home');

      // Create container matching selector: primaryColumn section > h1 + div[aria-label] > div[style]
      const primaryColumn = document.createElement('div');
      primaryColumn.setAttribute('data-testid', 'primaryColumn');
      const section = document.createElement('section');
      const h1 = document.createElement('h1');
      const ariaDiv = document.createElement('div');
      ariaDiv.setAttribute('aria-label', 'Timeline: Your Home Timeline');
      const timeline = document.createElement('div');
      timeline.setAttribute('style', 'position: relative; min-height: 500px;');

      ariaDiv.appendChild(timeline);
      section.appendChild(h1);
      section.appendChild(ariaDiv);
      primaryColumn.appendChild(section);
      document.body.appendChild(primaryColumn);

      const makeCell = (id: string) => {
        const cell = document.createElement('div');
        cell.setAttribute('data-testid', 'cellInnerDiv');
        const article = document.createElement('article');
        article.setAttribute('data-testid', 'tweet');
        const a = document.createElement('a');
        a.href = `https://x.com/user/status/${id}`;
        article.appendChild(a);
        cell.appendChild(article);
        timeline.appendChild(cell);
        return cell;
      };

      const c1 = makeCell('101');
      const c2 = makeCell('102');
      const c3 = makeCell('103');

      const pipeline = await import('@/entrypoints/x.content/pipeline');
      pipeline.resetPipeline();

      await initResurfacing();
      pipeline.startPipeline();

      // Give microtasks time to run async storage resolution and createRoot
      await new Promise((r) => setTimeout(r, 50));

      expect(c1.querySelector('[data-bt-resurfaced-cell]')).toBeNull();
      expect(c2.querySelector('[data-bt-resurfaced-cell]')).toBeNull();
      expect(c3.querySelector('[data-bt-resurfaced-cell]')).not.toBeNull();

      pipeline.resetPipeline();
      primaryColumn.remove();
    });

    it('ignores non-tweet cells such as composers or prompts without tweet article', async () => {
      window.history.pushState({}, '', '/home');

      const primaryColumn = document.createElement('div');
      primaryColumn.setAttribute('data-testid', 'primaryColumn');
      const section = document.createElement('section');
      const h1 = document.createElement('h1');
      const ariaDiv = document.createElement('div');
      ariaDiv.setAttribute('aria-label', 'Timeline: Your Home Timeline');
      const timeline = document.createElement('div');
      timeline.setAttribute('style', 'position: relative; min-height: 500px;');

      ariaDiv.appendChild(timeline);
      section.appendChild(h1);
      section.appendChild(ariaDiv);
      primaryColumn.appendChild(section);
      document.body.appendChild(primaryColumn);

      // Composer cell (no article[data-testid="tweet"])
      const composerCell = document.createElement('div');
      composerCell.setAttribute('data-testid', 'cellInnerDiv');
      const input = document.createElement('div');
      input.textContent = "What is happening?!";
      composerCell.appendChild(input);
      timeline.appendChild(composerCell);

      const pipeline = await import('@/entrypoints/x.content/pipeline');
      pipeline.resetPipeline();

      await initResurfacing();
      pipeline.startPipeline();

      await new Promise((r) => setTimeout(r, 50));

      expect(getResurfacingState().tweetCounter).toBe(0);
      expect(composerCell.querySelector('[data-bt-resurfaced-cell]')).toBeNull();

      pipeline.resetPipeline();
      primaryColumn.remove();
    });

    it('does not inject into cell if an adjacent cell already has a resurfaced card', async () => {
      window.history.pushState({}, '', '/home');

      await bookmarksSettingsItem.setValue({
        resurfacingEnabled: true,
        resurfacingInterval: 1, // 1 to test immediate injection attempt
        askFolderOnSave: true,
      });

      const primaryColumn = document.createElement('div');
      primaryColumn.setAttribute('data-testid', 'primaryColumn');
      const section = document.createElement('section');
      const h1 = document.createElement('h1');
      const ariaDiv = document.createElement('div');
      ariaDiv.setAttribute('aria-label', 'Timeline: Your Home Timeline');
      const timeline = document.createElement('div');
      timeline.setAttribute('style', 'position: relative; min-height: 500px;');

      ariaDiv.appendChild(timeline);
      section.appendChild(h1);
      section.appendChild(ariaDiv);
      primaryColumn.appendChild(section);
      document.body.appendChild(primaryColumn);

      const makeCell = (id: string) => {
        const cell = document.createElement('div');
        cell.setAttribute('data-testid', 'cellInnerDiv');
        const article = document.createElement('article');
        article.setAttribute('data-testid', 'tweet');
        const a = document.createElement('a');
        a.href = `https://x.com/user/status/${id}`;
        article.appendChild(a);
        cell.appendChild(article);
        timeline.appendChild(cell);
        return cell;
      };

      const c1 = makeCell('201');
      const c2 = makeCell('202');

      // Pre-mark c1 with a resurfaced card
      const preCard = document.createElement('div');
      preCard.setAttribute('data-bt-resurfaced-cell', 'true');
      c1.appendChild(preCard);

      const pipeline = await import('@/entrypoints/x.content/pipeline');
      pipeline.resetPipeline();

      await initResurfacing();
      pipeline.startPipeline();

      await new Promise((r) => setTimeout(r, 50));

      // c2 is immediately adjacent to c1 which already has a resurfaced card, so proximity guard skips c2
      expect(c2.querySelector('[data-bt-resurfaced-cell]')).toBeNull();

      pipeline.resetPipeline();
      primaryColumn.remove();
    });
  });
});
