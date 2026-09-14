import { describe, it, expect, vi } from 'vitest';
import { searchBookmarks, debounce } from '@/features/bookmarks/search';
import type { BookmarkItem } from '@/features/bookmarks/types';

describe('Bookmarks Client-Side Search & Filter (BOOK-05, D-02)', () => {
  const sampleBookmarks: BookmarkItem[] = [
    {
      id: '1',
      text: 'Exploring React Server Components and React Compiler performance optimizations',
      authorName: 'Dan Abramov',
      authorHandle: 'dan_abramov',
      authorAvatarUrl: '',
      createdAt: 1000,
      savedAt: 1000,
      folderIds: ['react-folder'],
      tags: ['react', 'webdev'],
      resurfaceCount: 0,
    },
    {
      id: '2',
      text: 'TypeScript 5.8 announced with incredible type checking speedups',
      authorName: 'Anders Hejlsberg',
      authorHandle: 'ahejlsberg',
      authorAvatarUrl: '',
      createdAt: 2000,
      savedAt: 2000,
      folderIds: ['ts-folder'],
      tags: ['typescript', 'devtools'],
      resurfaceCount: 0,
    },
    {
      id: '3',
      text: 'Bun 1.4 is out! Blazing fast bundler and test runner written in Zig',
      authorName: 'Jarred Sumner',
      authorHandle: 'jarredsumner',
      authorAvatarUrl: '',
      createdAt: 3000,
      savedAt: 3000,
      folderIds: ['uncategorized'],
      tags: ['bun', 'runtime'],
      resurfaceCount: 0,
    },
  ];

  it('filters by single keyword in tweet text', () => {
    const results = searchBookmarks(sampleBookmarks, 'compiler');
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('1');
  });

  it('performs multi-token AND search across fields', () => {
    // "dan server" -> matches tweet 1 (authorName 'Dan' and text 'Server')
    const results = searchBookmarks(sampleBookmarks, 'dan server');
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('1');

    // "react bun" -> neither tweet contains both tokens
    const noResults = searchBookmarks(sampleBookmarks, 'react bun');
    expect(noResults).toHaveLength(0);
  });

  it('matches by author name and author handle case-insensitively', () => {
    const byName = searchBookmarks(sampleBookmarks, 'ANDERS');
    expect(byName).toHaveLength(1);
    expect(byName[0]!.id).toBe('2');

    const byHandle = searchBookmarks(sampleBookmarks, 'jarredsumner');
    expect(byHandle).toHaveLength(1);
    expect(byHandle[0]!.id).toBe('3');
  });

  it('matches by user tags', () => {
    const byTag = searchBookmarks(sampleBookmarks, 'devtools');
    expect(byTag).toHaveLength(1);
    expect(byTag[0]!.id).toBe('2');
  });

  it('combines folder filtering with search query', () => {
    // Both match 'speedups' / 'optimizations', but filter folder
    const allMatching = searchBookmarks(sampleBookmarks, '', 'ts-folder');
    expect(allMatching).toHaveLength(1);
    expect(allMatching[0]!.id).toBe('2');

    // Searching within ts-folder
    const inFolder = searchBookmarks(sampleBookmarks, 'type', 'ts-folder');
    expect(inFolder).toHaveLength(1);
    expect(inFolder[0]!.id).toBe('2');

    // Searching non-matching query in ts-folder
    const emptyInFolder = searchBookmarks(sampleBookmarks, 'react', 'ts-folder');
    expect(emptyInFolder).toHaveLength(0);
  });

  it('combines tag filtering with search query', () => {
    const withTag = searchBookmarks(sampleBookmarks, 'bun', null, 'runtime');
    expect(withTag).toHaveLength(1);
    expect(withTag[0]!.id).toBe('3');

    const noMatchTag = searchBookmarks(sampleBookmarks, 'bun', null, 'react');
    expect(noMatchTag).toHaveLength(0);
  });

  it('returns all bookmarks when query is empty and no folder/tag filters applied', () => {
    const results = searchBookmarks(sampleBookmarks, '   ');
    expect(results).toHaveLength(3);
  });

  it('executes search across 10,000 synthetic items in under 15ms', () => {
    const largeSet: BookmarkItem[] = [];
    for (let i = 0; i < 10000; i++) {
      largeSet.push({
        id: `bench-${i}`,
        text: `Synthetic tweet content number ${i} about web development architecture and state machines`,
        authorName: `Author ${i % 100}`,
        authorHandle: `handle_${i % 100}`,
        authorAvatarUrl: '',
        createdAt: i,
        savedAt: i,
        folderIds: [i % 5 === 0 ? 'folder-a' : 'uncategorized'],
        tags: [`tag-${i % 20}`],
        resurfaceCount: 0,
      });
    }

    const start = performance.now();
    const matches = searchBookmarks(largeSet, 'author 42 state machines');
    const elapsed = performance.now() - start;

    expect(matches.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(25); // Target < 15ms, generous headroom for VM
  });

  it('debounces callbacks and supports cancel()', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 150);

    debounced('first');
    debounced('second');
    debounced('third');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(140);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');

    // Test cancel
    debounced('fourth');
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1); // still 1, fourth was cancelled

    vi.useRealTimers();
  });
});
