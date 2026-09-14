export type ReactionStyle = 'normal' | 'twemoji' | 'noto-animated';

export interface ReactionSlot {
  id: string;
  emoji: string;
  label: string;
  twemojiCodepoint: string;
  notoCodepoint: string;
  isCustom?: boolean;
}

export interface ReactionsSettings {
  enabled: boolean;
  style: ReactionStyle;
  slots: ReactionSlot[];
}

export interface CustomEmojiCacheEntry {
  twemojiSvg?: string;
  notoWebp?: string;
  updatedAt: number;
}

export interface CustomEmojiCache {
  [codepoint: string]: CustomEmojiCacheEntry;
}

export interface CatalogEmoji {
  codepoint: string;
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}
