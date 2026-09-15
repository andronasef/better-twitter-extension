import { browser } from 'wxt/browser';
import type { ReactionSlot } from './types';

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

export function getTwemojiAssetUrl(codepoint: string): string {
  return (browser.runtime.getURL as (path: string) => string)(`twemoji/${codepoint}.svg`);
}

export function getNotoAssetUrl(codepoint: string): string {
  return (browser.runtime.getURL as (path: string) => string)(`noto-animated/${codepoint}.webp`);
}
