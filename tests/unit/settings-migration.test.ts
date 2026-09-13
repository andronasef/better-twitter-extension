import { describe, it, expect } from 'vitest';
import { migrateSettings } from '@/lib/storage';

describe('Settings migration v1 -> v2 (CLEAN-05, D-08)', () => {
  it('migrates v1 settings with default values to v2 schema', () => {
    const v1Settings = {
      version: 1,
      features: {
        hidePromotedTweets: true,
      },
    };

    const v2Settings = migrateSettings(v1Settings);

    expect(v2Settings.version).toBe(3);
    expect(v2Settings.features.hidePromotedTweets).toBe(true);
    expect(v2Settings.features.cleanSidebar).toBe(false);
    expect(v2Settings.features.hideVanityMetrics).toBe(false);
    expect(v2Settings.features.hideProfileCounts).toBe(false);
  });

  it('preserves customized false value for existing v1 toggles', () => {
    const v1Settings = {
      version: 1,
      features: {
        hidePromotedTweets: false,
      },
    };

    const v2Settings = migrateSettings(v1Settings);

    expect(v2Settings.version).toBe(3);
    expect(v2Settings.features.hidePromotedTweets).toBe(false);
    expect(v2Settings.features.cleanSidebar).toBe(false);
    expect(v2Settings.features.hideVanityMetrics).toBe(false);
    expect(v2Settings.features.hideProfileCounts).toBe(false);
  });

  it('handles null, undefined, or empty v1 settings gracefully', () => {
    const v2Null = migrateSettings(null);
    expect(v2Null.version).toBe(3);
    expect(v2Null.features.hidePromotedTweets).toBe(true);
    expect(v2Null.features.cleanSidebar).toBe(false);
    expect(v2Null.features.hideVanityMetrics).toBe(false);
    expect(v2Null.features.hideProfileCounts).toBe(false);

    const v2Empty = migrateSettings({});
    expect(v2Empty.version).toBe(3);
    expect(v2Empty.features.hidePromotedTweets).toBe(true);
  });

  it('preserves any existing or future feature flags', () => {
    const customSettings = {
      version: 1,
      features: {
        hidePromotedTweets: false,
        cleanSidebar: true,
        customFlag: true,
      },
    };

    const v2Settings = migrateSettings(customSettings);
    expect(v2Settings.features.cleanSidebar).toBe(true);
    expect(v2Settings.features.customFlag).toBe(true);
    expect(v2Settings.features.hideVanityMetrics).toBe(false);
  });

  it('migrates archived old-twitter theme to default', () => {
    const oldTwitterSettings = {
      version: 3,
      features: {},
      theme: 'old-twitter',
    };

    const migrated = migrateSettings(oldTwitterSettings);
    expect(migrated.theme).toBe('default');
  });
});
