import { storage } from 'wxt/utils/storage';
import type {
  BookmarkItem,
  BookmarkFolder,
  BookmarkSyncState,
  BookmarksSettings,
} from '@/features/bookmarks/types';
import type {
  ReactionsSettings,
  CustomEmojiCache,
} from '@/features/reactions/types';
import { DEFAULT_REACTION_SLOTS } from '@/features/reactions/constants';

export type ThemeId = 'default' | 'dracula' | 'nord' | 'matrix' | 'minimal' | 'old-twitter';

export interface Settings {
  version: number;
  features: {
    hidePromotedTweets?: boolean;
    cleanSidebar?: boolean;
    hideVanityMetrics?: boolean;
    hideProfileCounts?: boolean;
    swapHomeTabs?: boolean;
    hideForYouTab?: boolean;
    hideFloatingDrawers?: boolean;
    [key: string]: boolean | undefined;
  };
  theme?: ThemeId;
  customAccent?: string | null;
}

export interface Diagnostics {
  [featureId: string]: {
    selector: string;
    firstSeen: number;
  };
}

export interface XTheme {
  backgroundColor: string;
  scheme: 'light' | 'dark' | 'unknown';
  seenAt: number;
}

export function migrateSettings(oldSettings: any): Settings {
  const oldFeatures = oldSettings?.features || {};
  let theme = (oldSettings?.theme as ThemeId) ?? 'default';
  if (theme === 'old-twitter') {
    theme = 'default';
  }
  return {
    version: 4,
    features: {
      ...oldFeatures,
      hidePromotedTweets: oldFeatures.hidePromotedTweets ?? true,
      cleanSidebar: oldFeatures.cleanSidebar ?? false,
      hideVanityMetrics: oldFeatures.hideVanityMetrics ?? false,
      hideProfileCounts: oldFeatures.hideProfileCounts ?? false,
      swapHomeTabs: oldFeatures.swapHomeTabs ?? false,
      hideForYouTab: oldFeatures.hideForYouTab ?? false,
      hideFloatingDrawers: oldFeatures.hideFloatingDrawers ?? false,
    },
    theme,
    customAccent: oldSettings?.customAccent ?? null,
  };
}

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: {
    version: 4,
    features: {
      hidePromotedTweets: true,
      cleanSidebar: false,
      hideVanityMetrics: false,
      hideProfileCounts: false,
      swapHomeTabs: false,
      hideForYouTab: false,
      hideFloatingDrawers: false,
    },
    theme: 'default',
    customAccent: null,
  },
  version: 4,
  migrations: {
    2: (old: any) => migrateSettings(old),
    3: (old: any) => migrateSettings(old),
    4: (old: any) => migrateSettings(old),
  },
});

export const diagnosticsItem = storage.defineItem<Diagnostics>('local:diagnostics', {
  fallback: {},
  version: 1,
});

export const xThemeItem = storage.defineItem<XTheme | null>('local:xTheme', {
  fallback: null,
  version: 1,
});

export const bookmarksItem = storage.defineItem<Record<string, BookmarkItem>>('local:bookmarks', {
  fallback: {},
  version: 1,
});

export const foldersItem = storage.defineItem<BookmarkFolder[]>('local:folders', {
  fallback: [
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      color: '#71767B',
      createdAt: 0,
      isDefault: true,
      resurfaceEnabled: true,
    },
  ],
  version: 1,
});

export const bookmarkSyncItem = storage.defineItem<BookmarkSyncState>('local:bookmarkSync', {
  fallback: {
    status: 'idle',
    cursor: null,
    totalCaptured: 0,
    lastSyncTime: null,
    lastCheckpointTime: null,
    errorReason: null,
  },
  version: 1,
});

export const bookmarksSettingsItem = storage.defineItem<BookmarksSettings>('local:bookmarksSettings', {
  fallback: {
    resurfacingEnabled: true,
    resurfacingInterval: 20,
    askFolderOnSave: true,
  },
  version: 1,
});

export const reactionsSettingsItem = storage.defineItem<ReactionsSettings>('local:reactionsSettings', {
  fallback: {
    enabled: true,
    style: 'twemoji',
    slots: DEFAULT_REACTION_SLOTS,
    autoComment: true,
  },
  version: 1,
});

export const customEmojiCacheItem = storage.defineItem<CustomEmojiCache>('local:customEmojiCache', {
  fallback: {},
  version: 1,
});