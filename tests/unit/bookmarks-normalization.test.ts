import { describe, it, expect } from 'vitest';
import {
  extractBookmarksFromGraphql,
  extractBookmarkFromDom,
} from '@/features/bookmarks/extractor';

describe('Bookmarks Normalization & Extraction (BOOK-01, BOOK-02, D-15)', () => {
  it('extracts bookmarks and cursor from standard GraphQL payload with direct Tweet objects', () => {
    const mockGraphqlPayload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-1800000000000000001',
                    itemContent: {
                      tweet_results: {
                        result: {
                          __typename: 'Tweet',
                          rest_id: '1800000000000000001',
                          legacy: {
                            full_text: 'Hello world from Better Twitter! https://t.co/abc123xyz',
                            created_at: 'Wed Oct 10 20:19:24 +0000 2024',
                            entities: {
                              media: [
                                {
                                  media_url_https: 'https://pbs.twimg.com/media/F123.jpg',
                                  url: 'https://t.co/abc123xyz',
                                },
                              ],
                            },
                          },
                          core: {
                            user_results: {
                              result: {
                                legacy: {
                                  name: 'Dan Abramov',
                                  screen_name: 'dan_abramov',
                                  profile_image_url_https: 'https://pbs.twimg.com/profile_images/dan.jpg',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  {
                    entryId: 'cursor-bottom-1800000000000000001',
                    content: {
                      value: 'HBaAwL6Vzq+tKAAA',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    const result = extractBookmarksFromGraphql(mockGraphqlPayload);
    expect(result.schemaMismatch).toBe(false);
    expect(result.bottomCursor).toBe('HBaAwL6Vzq+tKAAA');
    expect(result.items).toHaveLength(1);

    const item = result.items[0]!;
    expect(item.id).toBe('1800000000000000001');
    expect(item.text).toBe('Hello world from Better Twitter!');
    expect(item.authorName).toBe('Dan Abramov');
    expect(item.authorHandle).toBe('dan_abramov');
    expect(item.authorAvatarUrl).toBe('https://pbs.twimg.com/profile_images/dan.jpg');
    expect(item.mediaUrls).toEqual(['https://pbs.twimg.com/media/F123.jpg']);
    expect(item.folderIds).toEqual(['uncategorized']);
    expect(item.tags).toEqual([]);
    expect(item.resurfaceCount).toBe(0);
    expect(item.createdAt).toBe(Date.parse('Wed Oct 10 20:19:24 +0000 2024'));
  });

  it('unwraps TweetWithVisibilityResults structures seamlessly', () => {
    const mockPayload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-2000000000000000002',
                    itemContent: {
                      tweet_results: {
                        result: {
                          __typename: 'TweetWithVisibilityResults',
                          tweet: {
                            rest_id: '2000000000000000002',
                            legacy: {
                              full_text: 'Tweet with visibility results wrapper',
                              created_at: 'Thu Oct 11 12:00:00 +0000 2024',
                            },
                            core: {
                              user_results: {
                                result: {
                                  core: {
                                    name: 'Visibility User',
                                    screen_name: '@vis_user',
                                    profile_image_url_https: 'https://pbs.twimg.com/vis.jpg',
                                  },
                                },
                              },
                            },
                          },
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

    const result = extractBookmarksFromGraphql(mockPayload);
    expect(result.schemaMismatch).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('2000000000000000002');
    expect(result.items[0]!.text).toBe('Tweet with visibility results wrapper');
    expect(result.items[0]!.authorName).toBe('Visibility User');
    expect(result.items[0]!.authorHandle).toBe('vis_user'); // '@' stripped
  });

  it('extracts expanded NoteTweet text when present', () => {
    const mockPayload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-3000000000000000003',
                    itemContent: {
                      tweet_results: {
                        result: {
                          rest_id: '3000000000000000003',
                          legacy: {
                            full_text: 'Short truncated preview...',
                          },
                          note_tweet: {
                            note_tweet_results: {
                              result: {
                                text: 'This is the complete, expanded long-form article note tweet text that exceeds 280 characters.',
                              },
                            },
                          },
                          core: {
                            user_results: {
                              result: {
                                legacy: {
                                  name: 'Author Long',
                                  screen_name: 'author_long',
                                },
                              },
                            },
                          },
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

    const result = extractBookmarksFromGraphql(mockPayload);
    expect(result.items[0]!.text).toBe(
      'This is the complete, expanded long-form article note tweet text that exceeds 280 characters.'
    );
  });

  it('reports schemaMismatch: true when payload structure diverges from instructions without throwing', () => {
    const invalidPayloads = [
      null,
      undefined,
      {},
      { data: {} },
      { data: { bookmark_timeline_v2: {} } },
      { error: 'Endpoint changed' },
    ];

    for (const invalid of invalidPayloads) {
      const result = extractBookmarksFromGraphql(invalid);
      expect(result.schemaMismatch).toBe(true);
      expect(result.items).toEqual([]);
      expect(result.bottomCursor).toBeNull();
    }
  });

  it('extracts valid BookmarkItem from simulated DOM tweet article element', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name">
          <a href="/evan_you">
            <span>Evan You</span>
          </a>
          <div><span>@evan_you</span></div>
        </div>
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/evan.jpg" alt="Evan You" />
        </div>
        <div data-testid="tweetText">
          <span>Vite 6 is coming soon with Environment API!</span>
        </div>
        <div>
          <a href="/evan_you/status/1712345678901234567">October 12</a>
        </div>
        <div>
          <img alt="Image" src="https://pbs.twimg.com/media/vite.png" />
        </div>
      </article>
    `;

    const articleEl = container.querySelector('article')!;
    const item = extractBookmarkFromDom(articleEl);

    expect(item).not.toBeNull();
    expect(item!.id).toBe('1712345678901234567');
    expect(item!.authorName).toBe('Evan You');
    expect(item!.authorHandle).toBe('evan_you');
    expect(item!.authorAvatarUrl).toBe('https://pbs.twimg.com/profile_images/evan.jpg');
    expect(item!.text).toBe('Vite 6 is coming soon with Environment API!');
    expect(item!.mediaUrls).toEqual(['https://pbs.twimg.com/media/vite.png']);
    expect(item!.folderIds).toEqual(['uncategorized']);
    expect(item!.tags).toEqual([]);
  });

  it('returns null from extractBookmarkFromDom if permalink status is missing', () => {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    article.innerHTML = '<div>Promoted content with no status permalink</div>';

    expect(extractBookmarkFromDom(article)).toBeNull();
  });

  it('extracts bottom cursor from TimelineReplaceEntry instruction (D-15)', () => {
    const mockPayload = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    entryId: 'tweet-3001',
                    itemContent: {
                      tweet_results: {
                        result: {
                          rest_id: '3001',
                          legacy: { full_text: 'Tweet on page 2' },
                          core: {
                            user_results: {
                              result: {
                                legacy: { name: 'Alice', screen_name: 'alice' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
              {
                type: 'TimelineReplaceEntry',
                entry_id_to_replace: 'cursor-bottom-12345',
                entry: {
                  entryId: 'cursor-bottom-67890',
                  content: {
                    entryType: 'TimelineTimelineCursor',
                    cursorType: 'Bottom',
                    value: 'cursor_val_page_3',
                  },
                },
              },
            ],
          },
        },
      },
    };

    const result = extractBookmarksFromGraphql(mockPayload);
    expect(result.schemaMismatch).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('3001');
    expect(result.bottomCursor).toBe('cursor_val_page_3');
  });
});
