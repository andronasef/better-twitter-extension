import { describe, it, expect } from 'vitest';
import { isBookmarksRoute, isBookmarksTabActive, BOOKMARKS_URL } from '@/features/bookmarks/routes';

describe('Bookmarks Routes & History Detection', () => {
  it('points BOOKMARKS_URL to https://x.com/i/history', () => {
    expect(BOOKMARKS_URL).toBe('https://x.com/i/history');
  });
  it('identifies classic bookmark routes', () => {
    expect(isBookmarksRoute('/bookmarks')).toBe(true);
    expect(isBookmarksRoute('/i/bookmarks')).toBe(true);
    expect(isBookmarksRoute('/i/bookmarks/123')).toBe(true);
    expect(isBookmarksRoute('/i/bookmarks/folder/abc')).toBe(true);
  });

  it('identifies unified history hub bookmarks routes', () => {
    expect(isBookmarksRoute('/i/history')).toBe(true);
    expect(isBookmarksRoute('/i/history/')).toBe(true);
    expect(isBookmarksRoute('/i/history/bookmarks')).toBe(true);
    expect(isBookmarksRoute('/history')).toBe(true);
    expect(isBookmarksRoute('/history/bookmarks')).toBe(true);
  });

  it('excludes non-bookmark history subtabs', () => {
    expect(isBookmarksRoute('/i/history/likes')).toBe(false);
    expect(isBookmarksRoute('/i/history/videos')).toBe(false);
    expect(isBookmarksRoute('/i/history/articles')).toBe(false);
    expect(isBookmarksRoute('/history/likes')).toBe(false);
    expect(isBookmarksRoute('/history/videos')).toBe(false);
    expect(isBookmarksRoute('/history/articles')).toBe(false);
  });

  it('rejects other Twitter routes', () => {
    expect(isBookmarksRoute('/home')).toBe(false);
    expect(isBookmarksRoute('/explore')).toBe(false);
    expect(isBookmarksRoute('/notifications')).toBe(false);
    expect(isBookmarksRoute('/messages')).toBe(false);
    expect(isBookmarksRoute('/user/status/123')).toBe(false);
    expect(isBookmarksRoute('')).toBe(false);
    expect(isBookmarksRoute(null)).toBe(false);
  });

  describe('isBookmarksTabActive', () => {
    it('returns true if no tablist is present', () => {
      document.body.innerHTML = '<div>No tablist</div>';
      expect(isBookmarksTabActive()).toBe(true);
    });

    it('returns true when Bookmarks tab is selected', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-selected="true">Bookmarks</div>
          <div role="tab" aria-selected="false">Likes</div>
        </div>
      `;
      expect(isBookmarksTabActive()).toBe(true);
    });

    it('returns false when Likes or Videos tab is selected', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-selected="false">Bookmarks</div>
          <div role="tab" aria-selected="true">Likes</div>
        </div>
      `;
      expect(isBookmarksTabActive()).toBe(false);

      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-selected="false">Bookmarks</div>
          <div role="tab" aria-selected="true">Videos</div>
        </div>
      `;
      expect(isBookmarksTabActive()).toBe(false);
    });
  });
});
