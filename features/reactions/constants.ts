import { browser } from 'wxt/browser';
import { EmojiStyle } from 'emoji-picker-react';
import type { ReactionSlot, ReactionStyle, CustomEmojiCache } from './types';

export const HOVER_TRIGGER_DELAY_MS = 350;
export const EXIT_GRACE_BUFFER_MS = 300;
export const HOLD_TRIGGER_THRESHOLD_MS = 500;
export const TOAST_AUTO_DISMISS_MS = 3000;
export const COMPOSER_WAIT_TIMEOUT_MS = 3500;
export const DEFAULT_AUTO_COMMENT = true;

export const DEFAULT_REACTION_SLOTS: ReactionSlot[] = [
  { id: 'like', emoji: '👍', label: 'Like', twemojiCodepoint: '1f44d', notoCodepoint: '1f44d' },
  { id: 'love', emoji: '❤️', label: 'Love', twemojiCodepoint: '2764', notoCodepoint: '2764_fe0f' },
  { id: 'haha', emoji: '😂', label: 'Haha', twemojiCodepoint: '1f602', notoCodepoint: '1f602' },
  { id: 'wow', emoji: '😮', label: 'Wow', twemojiCodepoint: '1f62e', notoCodepoint: '1f62e' },
  { id: 'sad', emoji: '😢', label: 'Sad', twemojiCodepoint: '1f622', notoCodepoint: '1f622' },
  { id: 'fire', emoji: '🔥', label: 'Fire', twemojiCodepoint: '1f525', notoCodepoint: '1f525' },
];

export const BUNDLED_TWEMOJI_CODEPOINTS = new Set(['1f44d', '2764', '1f602', '1f62e', '1f622', '1f525']);
export const BUNDLED_NOTO_CODEPOINTS = new Set(['1f44d', '2764_fe0f', '1f602', '1f62e', '1f622', '1f525']);

export function getTwemojiAssetUrl(codepoint: string): string {
  return (browser.runtime.getURL as (path: string) => string)(`twemoji/${codepoint}.svg`);
}

export function getNotoAssetUrl(codepoint: string): string {
  return (browser.runtime.getURL as (path: string) => string)(`noto-animated/${codepoint}.webp`);
}

export function toEmojiPickerStyle(style: ReactionStyle): EmojiStyle {
  switch (style) {
    case 'normal':
      return EmojiStyle.NATIVE;
    case 'apple':
      return EmojiStyle.APPLE;
    case 'twemoji':
      return EmojiStyle.TWITTER;
    case 'google':
    case 'noto-animated':
      return EmojiStyle.GOOGLE;
    case 'facebook':
      return EmojiStyle.FACEBOOK;
    default:
      return EmojiStyle.TWITTER;
  }
}

export function getReactionEmojiSource(
  slot: ReactionSlot,
  style: ReactionStyle,
  customCache: CustomEmojiCache = {}
): string | null {
  if (style === 'normal') {
    return null;
  }

  if (style === 'twemoji') {
    const cached = customCache[slot.twemojiCodepoint]?.twemojiSvg;
    if (cached) return cached;
    if (BUNDLED_TWEMOJI_CODEPOINTS.has(slot.twemojiCodepoint)) {
      return getTwemojiAssetUrl(slot.twemojiCodepoint);
    }
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-twitter/img/twitter/64/${slot.twemojiCodepoint}.png`;
  }

  if (style === 'noto-animated') {
    const cached = customCache[slot.notoCodepoint]?.notoWebp;
    if (cached) return cached;
    if (BUNDLED_NOTO_CODEPOINTS.has(slot.notoCodepoint)) {
      return getNotoAssetUrl(slot.notoCodepoint);
    }
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-google/img/google/64/${slot.notoCodepoint || slot.twemojiCodepoint}.png`;
  }

  if (style === 'apple') {
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${slot.twemojiCodepoint}.png`;
  }

  if (style === 'google') {
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-google/img/google/64/${slot.notoCodepoint || slot.twemojiCodepoint}.png`;
  }

  if (style === 'facebook') {
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${slot.twemojiCodepoint}.png`;
  }

  return null;
}
