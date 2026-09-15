import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { reactionsSettingsItem, customEmojiCacheItem } from '@/lib/storage';
import {
  DEFAULT_REACTION_SLOTS,
  HOVER_TRIGGER_DELAY_MS,
  EXIT_GRACE_BUFFER_MS,
  HOLD_TRIGGER_THRESHOLD_MS,
  TOAST_AUTO_DISMISS_MS,
  COMPOSER_WAIT_TIMEOUT_MS,
  getTwemojiAssetUrl,
  getNotoAssetUrl,
} from '@/features/reactions/constants';
import { resolve, resolveAll } from '@/lib/selectors';

describe('Reactions Storage, Constants & Selectors (REACT-06, D-09, D-11, D-13, D-14)', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    document.body.innerHTML = '';
  });

  describe('Storage fallback values and mutations (D-09, D-11)', () => {
    it('initializes reactionsSettingsItem with enabled: true, autoComment: true, style: twemoji, and 6 default slots', async () => {
      const settings = await reactionsSettingsItem.getValue();
      expect(settings).toBeDefined();
      expect(settings.enabled).toBe(true);
      expect(settings.autoComment).toBe(true);
      expect(settings.style).toBe('twemoji');
      expect(settings.slots).toHaveLength(6);
      expect(settings.slots.map((s) => s.emoji)).toEqual(['👍', '❤️', '😂', '😮', '😢', '🔥']);
    });

    it('persists updated settings and custom slots', async () => {
      await reactionsSettingsItem.setValue({
        enabled: false,
        style: 'noto-animated',
        slots: [
          ...DEFAULT_REACTION_SLOTS.slice(0, 5),
          {
            id: 'party',
            emoji: '🥳',
            label: 'Party',
            twemojiCodepoint: '1f973',
            notoCodepoint: '1f973',
            isCustom: true,
          },
        ],
      });

      const updated = await reactionsSettingsItem.getValue();
      expect(updated.enabled).toBe(false);
      expect(updated.style).toBe('noto-animated');
      expect(updated.slots).toHaveLength(6);
      expect(updated.slots[5]!.id).toBe('party');
      expect(updated.slots[5]!.isCustom).toBe(true);
    });

    it('initializes customEmojiCacheItem to empty record and persists cached entries', async () => {
      const initial = await customEmojiCacheItem.getValue();
      expect(initial).toEqual({});

      await customEmojiCacheItem.setValue({
        '1f973': {
          twemojiSvg: 'data:image/svg+xml;utf8,<svg>party</svg>',
          notoWebp: 'data:image/webp;base64,UklGRk...',
          updatedAt: 1726358400000,
        },
      });

      const cache = await customEmojiCacheItem.getValue();
      expect(cache['1f973']).toBeDefined();
      expect(cache['1f973']?.twemojiSvg).toBe('data:image/svg+xml;utf8,<svg>party</svg>');
      expect(cache['1f973']?.notoWebp).toBe('data:image/webp;base64,UklGRk...');
      expect(cache['1f973']?.updatedAt).toBe(1726358400000);
    });
  });

  describe('Default Reaction Slots Structure & Invariants (D-09, D-14)', () => {
    it('contains exactly 6 locked slots in canonical order', () => {
      expect(DEFAULT_REACTION_SLOTS).toHaveLength(6);
      expect(DEFAULT_REACTION_SLOTS.map((s) => s.id)).toEqual([
        'like',
        'love',
        'haha',
        'wow',
        'sad',
        'fire',
      ]);
    });

    it('each slot has valid emoji, label, twemojiCodepoint, and notoCodepoint', () => {
      for (const slot of DEFAULT_REACTION_SLOTS) {
        expect(slot.id).toBeTypeOf('string');
        expect(slot.emoji).toBeTypeOf('string');
        expect(slot.label).toBeTypeOf('string');
        expect(slot.twemojiCodepoint).toBeTypeOf('string');
        expect(slot.notoCodepoint).toBeTypeOf('string');
        expect(slot.twemojiCodepoint.length).toBeGreaterThan(0);
        expect(slot.notoCodepoint.length).toBeGreaterThan(0);
      }
    });

    it('differentiates red heart codepoints between Twemoji (2764) and Google Noto (2764_fe0f)', () => {
      const loveSlot = DEFAULT_REACTION_SLOTS.find((s) => s.id === 'love');
      expect(loveSlot).toBeDefined();
      expect(loveSlot?.twemojiCodepoint).toBe('2764');
      expect(loveSlot?.notoCodepoint).toBe('2764_fe0f');
    });

    it('exports all interaction timing constants', () => {
      expect(HOVER_TRIGGER_DELAY_MS).toBe(350);
      expect(EXIT_GRACE_BUFFER_MS).toBe(300);
      expect(HOLD_TRIGGER_THRESHOLD_MS).toBe(500);
      expect(TOAST_AUTO_DISMISS_MS).toBe(3000);
      expect(COMPOSER_WAIT_TIMEOUT_MS).toBe(3500);
    });
  });

  describe('Asset URL generation (REACT-06, D-13)', () => {
    it('resolves getTwemojiAssetUrl ending in twemoji/[codepoint].svg', () => {
      for (const slot of DEFAULT_REACTION_SLOTS) {
        const url = getTwemojiAssetUrl(slot.twemojiCodepoint);
        expect(url).toMatch(new RegExp(`twemoji/${slot.twemojiCodepoint}\\.svg$`));
      }
    });

    it('resolves getNotoAssetUrl ending in noto-animated/[codepoint].webp', () => {
      for (const slot of DEFAULT_REACTION_SLOTS) {
        const url = getNotoAssetUrl(slot.notoCodepoint);
        expect(url).toMatch(new RegExp(`noto-animated/${slot.notoCodepoint}\\.webp$`));
      }
    });
  });

  describe('Selector resolution for Reactions (D-05, D-06)', () => {
    describe('likeButton', () => {
      it('resolves [data-testid="like"]', () => {
        document.body.innerHTML = '<button data-testid="like" id="like-btn">Like</button>';
        const match = resolve('likeButton');
        expect(match?.id).toBe('like-btn');
      });

      it('resolves [data-testid="unlike"] when already liked', () => {
        document.body.innerHTML = '<button data-testid="unlike" id="unlike-btn">Unlike</button>';
        const match = resolve('likeButton');
        expect(match?.id).toBe('unlike-btn');
      });

      it('resolves button with aria-label containing Like', () => {
        document.body.innerHTML = '<button aria-label="10 Likes. Like" id="aria-like-btn">❤️</button>';
        const match = resolve('likeButton');
        expect(match?.id).toBe('aria-like-btn');
      });

      it('first candidate in chain wins when multiple exist', () => {
        document.body.innerHTML = `
          <button data-testid="like" id="priority-like">Like</button>
          <button aria-label="Like" id="fallback-like">Like</button>
        `;
        const match = resolve('likeButton');
        expect(match?.id).toBe('priority-like');
      });
    });

    describe('replyButton', () => {
      it('resolves [data-testid="reply"]', () => {
        document.body.innerHTML = '<button data-testid="reply" id="reply-btn">Reply</button>';
        const match = resolve('replyButton');
        expect(match?.id).toBe('reply-btn');
      });

      it('resolves button with aria-label containing Reply', () => {
        document.body.innerHTML = '<button aria-label="5 Replies. Reply" id="aria-reply-btn">💬</button>';
        const match = resolve('replyButton');
        expect(match?.id).toBe('aria-reply-btn');
      });
    });

    describe('replyComposer', () => {
      it('resolves modal composer with [role="dialog"] [data-testid="tweetTextarea_0"]', () => {
        document.body.innerHTML = `
          <div role="dialog">
            <div data-testid="tweetTextarea_0" id="dialog-textarea" contenteditable="true"></div>
          </div>
        `;
        const match = resolve('replyComposer');
        expect(match?.id).toBe('dialog-textarea');
      });

      it('resolves modal composer with contenteditable textbox fallback', () => {
        document.body.innerHTML = `
          <div role="dialog">
            <div role="textbox" contenteditable="true" id="dialog-textbox"></div>
          </div>
        `;
        const match = resolve('replyComposer');
        expect(match?.id).toBe('dialog-textbox');
      });

      it('resolves inline composer on status permalink', () => {
        document.body.innerHTML = `
          <div data-testid="inline_reply">
            <div data-testid="tweetTextarea_0" id="inline-textarea" contenteditable="true"></div>
          </div>
        `;
        const match = resolve('replyComposer');
        expect(match?.id).toBe('inline-textarea');
      });

      it('resolves inline contenteditable textbox fallback', () => {
        document.body.innerHTML = `
          <div data-testid="inline_reply">
            <div role="textbox" contenteditable="true" id="inline-textbox"></div>
          </div>
        `;
        const match = resolve('replyComposer');
        expect(match?.id).toBe('inline-textbox');
      });

      it('returns null and does not throw when composer is absent', () => {
        document.body.innerHTML = '<div>No composer</div>';
        expect(() => {
          const match = resolve('replyComposer');
          expect(match).toBeNull();
        }).not.toThrow();
      });
    });
  });
});
