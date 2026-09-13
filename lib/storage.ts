import { storage } from 'wxt/utils/storage';

export interface Settings {
  version: number;
  features: Record<string, boolean>;
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

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: {
    version: 1,
    features: {
      hidePromotedTweets: true,
    },
  },
  version: 1,
});

export const diagnosticsItem = storage.defineItem<Diagnostics>('local:diagnostics', {
  fallback: {},
  version: 1,
});

export const xThemeItem = storage.defineItem<XTheme | null>('local:xTheme', {
  fallback: null,
  version: 1,
});