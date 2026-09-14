import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  codepointToEmoji,
  searchEmojiCatalog,
  cacheCustomEmoji,
  NOTO_API_URL,
} from '@/features/reactions/catalog';
import type { CatalogEmoji } from '@/features/reactions/types';
import { customEmojiCacheItem } from '@/lib/storage';

describe('Reactions Emoji Catalog & Search Engine (REACT-05, D-13)', () => {
  const sampleCatalog: CatalogEmoji[] = [
    {
      codepoint: '1f44d',
      emoji: '👍',
      name: 'thumbs up',
      category: 'People',
      keywords: ['thumbs up', 'like', 'approve', 'gesture'],
    },
    {
      codepoint: '2764_fe0f',
      emoji: '❤️',
      name: 'red heart',
      category: 'Smileys and emotions',
      keywords: ['red heart', 'love', 'heart', 'like'],
    },
    {
      codepoint: '1f602',
      emoji: '😂',
      name: 'face with tears of joy',
      category: 'Smileys and emotions',
      keywords: ['face with tears of joy', 'laugh', 'lol', 'funny'],
    },
    {
      codepoint: '1f525',
      emoji: '🔥',
      name: 'fire',
      category: 'Travel and places',
      keywords: ['fire', 'flame', 'lit', 'hot'],
    },
    {
      codepoint: '1f436',
      emoji: '🐶',
      name: 'dog face',
      category: 'Animals and nature',
      keywords: ['dog', 'puppy', 'pet'],
    },
    {
      codepoint: '1f355',
      emoji: '🍕',
      name: 'pizza',
      category: 'Food and drink',
      keywords: ['pizza', 'cheese', 'slice'],
    },
  ];

  beforeEach(async () => {
    fakeBrowser.reset();
    await customEmojiCacheItem.setValue({});
  });

  describe('codepointToEmoji', () => {
    it('converts single hex codepoints to correct unicode emoji', () => {
      expect(codepointToEmoji('1f44d')).toBe('👍');
      expect(codepointToEmoji('1f525')).toBe('🔥');
    });

    it('converts composite codepoints with underscores', () => {
      expect(codepointToEmoji('2764_fe0f')).toBe('❤️');
    });

    it('handles invalid hex safely without throwing', () => {
      expect(codepointToEmoji('invalid_hex')).toBe('❓');
    });
  });

  describe('searchEmojiCatalog', () => {
    it('returns entire catalog when query is empty and category is All', () => {
      const results = searchEmojiCatalog(sampleCatalog, '', 'All');
      expect(results.length).toBe(sampleCatalog.length);
    });

    it('filters by category chip correctly', () => {
      const smileys = searchEmojiCatalog(sampleCatalog, '', 'Smileys');
      expect(smileys.map((e) => e.emoji)).toEqual(['❤️', '😂']);

      const animals = searchEmojiCatalog(sampleCatalog, '', 'Animals');
      expect(animals.map((e) => e.emoji)).toEqual(['🐶']);

      const food = searchEmojiCatalog(sampleCatalog, '', 'Food');
      expect(food.map((e) => e.emoji)).toEqual(['🍕']);
    });

    it('performs single token keyword search across name and keywords', () => {
      const results = searchEmojiCatalog(sampleCatalog, 'laugh');
      expect(results.length).toBe(1);
      expect(results[0]?.emoji).toBe('😂');
    });

    it('performs multi-token AND search (all tokens must match)', () => {
      const results = searchEmojiCatalog(sampleCatalog, 'tears joy');
      expect(results.length).toBe(1);
      expect(results[0]?.emoji).toBe('😂');

      const noMatch = searchEmojiCatalog(sampleCatalog, 'tears pizza');
      expect(noMatch.length).toBe(0);
    });

    it('combines category filter and text query', () => {
      const likeInSmileys = searchEmojiCatalog(sampleCatalog, 'like', 'Smileys');
      expect(likeInSmileys.map((e) => e.emoji)).toEqual(['❤️']);

      const likeInPeople = searchEmojiCatalog(sampleCatalog, 'like', 'Gestures');
      expect(likeInPeople.map((e) => e.emoji)).toEqual(['👍']);
    });
  });

  describe('cacheCustomEmoji', () => {
    it('fetches remote SVG and WebP and saves Data URIs to storage cache', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('.svg')) {
          return {
            ok: true,
            status: 200,
            text: async () => '<svg>custom-svg</svg>',
          } as Response;
        }
        if (url.includes('.webp')) {
          return {
            ok: true,
            status: 200,
            arrayBuffer: async () => new Uint8Array([82, 73, 70, 70]).buffer,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const entry = await cacheCustomEmoji('1f970');
      expect(entry.twemojiSvg).toContain('data:image/svg+xml;utf8,');
      expect(entry.notoWebp).toContain('data:image/webp;base64,');

      const stored = await customEmojiCacheItem.getValue();
      expect(stored['1f970']).toBeDefined();
      expect(stored['1f970']?.twemojiSvg).toContain('custom-svg');
    });
  });
});
