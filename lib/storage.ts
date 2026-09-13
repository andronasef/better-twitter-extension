import { storage } from 'wxt/utils/storage';

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
    version: 3,
    features: {
      ...oldFeatures,
      hidePromotedTweets: oldFeatures.hidePromotedTweets ?? true,
      cleanSidebar: oldFeatures.cleanSidebar ?? false,
      hideVanityMetrics: oldFeatures.hideVanityMetrics ?? false,
      hideProfileCounts: oldFeatures.hideProfileCounts ?? false,
      swapHomeTabs: oldFeatures.swapHomeTabs ?? false,
      hideForYouTab: oldFeatures.hideForYouTab ?? false,
    },
    theme,
    customAccent: oldSettings?.customAccent ?? null,
  };
}

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: {
    version: 3,
    features: {
      hidePromotedTweets: true,
      cleanSidebar: false,
      hideVanityMetrics: false,
      hideProfileCounts: false,
      swapHomeTabs: false,
      hideForYouTab: false,
    },
    theme: 'default',
    customAccent: null,
  },
  version: 3,
  migrations: {
    2: (old: any) => migrateSettings(old),
    3: (old: any) => migrateSettings(old),
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