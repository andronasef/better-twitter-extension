import { describe, it, expect } from 'vitest';
import { migrateSettings } from '@/lib/storage';

describe('Settings migration v1..v3 -> v4 (CLEAN-05, D-08, Phase 3)', () => {
  it('migrates v1 settings with default values to v4 schema', () => {
    const v1Settings = {
      version: 1,
      features: {
        hidePromotedTweets: true,
      },
    };

    const v4Settings = migrateSettings(v1Settings);

    expect(v4Settings.version).toBe(4);
    expect(v4Settings.features.hidePromotedTweets).toBe(true);
    expect(v4Settings.features.cleanSidebar).toBe(false);
    expect(v4Settings.features.hideVanityMetrics).toBe(false);
    expect(v4Settings.features.hideProfileCounts).toBe(false);
  });

  it('preserves customized false value for existing v1 toggles', () => {
    const v1Settings = {
      version: 1,
      features: {
        hidePromotedTweets: false,
      },
    };

    const v4Settings = migrateSettings(v1Settings);

    expect(v4Settings.version).toBe(4);
    expect(v4Settings.features.hidePromotedTweets).toBe(false);
    expect(v4Settings.features.cleanSidebar).toBe(false);
    expect(v4Settings.features.hideVanityMetrics).toBe(false);
    expect(v4Settings.features.hideProfileCounts).toBe(false);
  });

  it('handles null, undefined, or empty settings gracefully', () => {
    const v4Null = migrateSettings(null);
    expect(v4Null.version).toBe(4);
    expect(v4Null.features.hidePromotedTweets).toBe(true);
    expect(v4Null.features.cleanSidebar).toBe(false);
    expect(v4Null.features.hideVanityMetrics).toBe(false);
    expect(v4Null.features.hideProfileCounts).toBe(false);

    const v4Empty = migrateSettings({});
    expect(v4Empty.version).toBe(4);
    expect(v4Empty.features.hidePromotedTweets).toBe(true);
  });

  it('preserves any existing or future feature flags', () => {
    const customSettings = {
      version: 3,
      features: {
        hidePromotedTweets: false,
        cleanSidebar: true,
        customFlag: true,
      },
    };

    const v4Settings = migrateSettings(customSettings);
    expect(v4Settings.version).toBe(4);
    expect(v4Settings.features.cleanSidebar).toBe(true);
    expect(v4Settings.features.customFlag).toBe(true);
    expect(v4Settings.features.hideVanityMetrics).toBe(false);
  });

  it('migrates archived old-twitter theme to default', () => {
    const oldTwitterSettings = {
      version: 3,
      features: {},
      theme: 'old-twitter',
    };

    const migrated = migrateSettings(oldTwitterSettings);
    expect(migrated.version).toBe(4);
    expect(migrated.theme).toBe('default');
  });
});
