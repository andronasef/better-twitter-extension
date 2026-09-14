import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  bookmarksItem,
  bookmarkSyncItem,
} from '@/lib/storage';
import {
  handleBookmarksPayload,
  handleBookmarkMutation,
  resumeSync,
  ERROR_COPY,
} from '@/features/bookmarks/capture-engine';
import type { BookmarkItem } from '@/features/bookmarks/types';

describe('Bookmarks Capture Engine & Checkpoints (BOOK-01, BOOK-02, BOOK-03, D-18)', () => {
  beforeEach(async () => {
    await bookmarksItem.setValue({});
    await bookmarkSyncItem.setValue({
      status: 'idle',
      cursor: null,
      totalCaptured: 0,
      lastSyncTime: null,
      lastCheckpointTime: null,
      errorReason: null,
    });
  });

  it('extracts bookmarks, persists them to storage, and records cursor checkpoint', async () => {
    const payload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-100',
                    itemContent: {
                      tweet_results: {
                        result: {
                          __typename: 'Tweet',
                          rest_id: '100',
                          legacy: {
                            full_text: 'Captured bookmark content',
                            created_at: 'Wed Oct 10 20:00:00 +0000 2024',
                          },
                          core: {
                            user_results: {
                              result: {
                                legacy: {
                                  name: 'Capture Author',
                                  screen_name: 'capture_author',
                                  profile_image_url_https: 'https://avatar.com/100.png',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  {
                    entryId: 'cursor-bottom-100',
                    content: {
                      value: 'CURSOR_ABC_123',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    await handleBookmarksPayload({ data: payload, status: 200 });

    const saved = await bookmarksItem.getValue();
    expect(saved['100']).toBeDefined();
    expect(saved['100']!.text).toBe('Captured bookmark content');
    expect(saved['100']!.authorName).toBe('Capture Author');

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.cursor).toBe('CURSOR_ABC_123');
    expect(sync.totalCaptured).toBe(1);
    expect(sync.status).toBe('idle');
    expect(sync.lastCheckpointTime).toBeTypeOf('number');
  });

  it('marks sync status as complete when bottom cursor is null', async () => {
    const payloadWithoutCursor = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-200',
                    itemContent: {
                      tweet_results: {
                        result: {
                          rest_id: '200',
                          legacy: { full_text: 'Final page tweet' },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    await handleBookmarksPayload({ data: payloadWithoutCursor, status: 200 });

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.cursor).toBeNull();
    expect(sync.status).toBe('complete');
  });

  it('classifies HTTP 401 as not_logged_in error with plain-language copy (BOOK-03)', async () => {
    await handleBookmarksPayload({ data: null, status: 401 });

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('error');
    expect(sync.errorReason).toBe('not_logged_in');
    expect(ERROR_COPY['not_logged_in']).toBe('Please log into X to sync bookmarks');
  });

  it('classifies HTTP 429 and code 88 as rate_limited error with retry copy (BOOK-03)', async () => {
    // Via status code
    await handleBookmarksPayload({ data: null, status: 429 });
    let sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('error');
    expect(sync.errorReason).toBe('rate_limited');
    expect(ERROR_COPY['rate_limited']).toBe('X rate limit reached. Sync will resume shortly.');

    // Via GraphQL error body
    await handleBookmarksPayload({
      data: { errors: [{ message: 'Rate limit exceeded', code: 88 }] },
      status: 200,
    });
    sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('error');
    expect(sync.errorReason).toBe('rate_limited');
  });

  it('classifies missing instructions schema as endpoint_changed error (BOOK-03)', async () => {
    const brokenSchema = {
      data: {
        unknown_endpoint: { something: true },
      },
    };

    await handleBookmarksPayload({ data: brokenSchema, status: 200 });

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('error');
    expect(sync.errorReason).toBe('endpoint_changed');
    expect(ERROR_COPY['endpoint_changed']).toBe(
      'X endpoint schema changed. Falling back to direct save.'
    );
  });

  it('synchronizes local unbookmarking when DeleteBookmark mutation occurs (D-09)', async () => {
    const existingBookmark: BookmarkItem = {
      id: 'tweet-to-delete',
      text: 'Tweet to delete',
      authorName: 'User',
      authorHandle: 'user',
      authorAvatarUrl: '',
      createdAt: 1000,
      savedAt: 1000,
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
    };

    await bookmarksItem.setValue({ 'tweet-to-delete': existingBookmark });
    expect((await bookmarksItem.getValue())['tweet-to-delete']).toBeDefined();

    await handleBookmarkMutation('DeleteBookmark', 'tweet-to-delete');

    const afterDelete = await bookmarksItem.getValue();
    expect(afterDelete['tweet-to-delete']).toBeUndefined();
  });

  it('resumes sync from previous cursor checkpoint without restarting from zero (BOOK-02)', async () => {
    await bookmarkSyncItem.setValue({
      status: 'idle',
      cursor: 'SAVED_CURSOR_VAL',
      totalCaptured: 50,
      lastSyncTime: 1000,
      lastCheckpointTime: 1000,
      errorReason: null,
    });

    await resumeSync();

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('syncing');
    expect(sync.cursor).toBe('SAVED_CURSOR_VAL');
    expect(sync.totalCaptured).toBe(50);
  });

  it('triggers next page fetch when status is syncing and next cursor arrives', async () => {
    vi.useFakeTimers();
    try {
      await bookmarkSyncItem.setValue({
        status: 'syncing',
        cursor: null,
        totalCaptured: 0,
        lastSyncTime: null,
        lastCheckpointTime: null,
        errorReason: null,
      });

      const payload = {
        data: {
          bookmark_timeline_v2: {
            timeline: {
              instructions: [
                {
                  type: 'TimelineAddEntries',
                  entries: [
                    {
                      entryId: 'tweet-300',
                      itemContent: {
                        tweet_results: {
                          result: {
                            rest_id: '300',
                            legacy: { full_text: 'Tweet 300' },
                          },
                        },
                      },
                    },
                    {
                      entryId: 'cursor-bottom-300',
                      content: { value: 'CURSOR_PAGE_2' },
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      await handleBookmarksPayload({ data: payload, status: 200 });

      const sync = await bookmarkSyncItem.getValue();
      expect(sync.status).toBe('syncing');
      expect(sync.cursor).toBe('CURSOR_PAGE_2');
      expect(sync.totalCaptured).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops pagination loop when cursor is identical to existing checkpoint', async () => {
    await bookmarkSyncItem.setValue({
      status: 'syncing',
      cursor: 'TERMINAL_CURSOR',
      totalCaptured: 10,
      lastSyncTime: 1000,
      lastCheckpointTime: 1000,
      errorReason: null,
    });

    const terminalPayload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'cursor-bottom-end',
                    content: { value: 'TERMINAL_CURSOR' },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    await handleBookmarksPayload({ data: terminalPayload, status: 200 });

    const sync = await bookmarkSyncItem.getValue();
    expect(sync.status).toBe('complete');
    expect(sync.cursor).toBeNull();
  });
});
