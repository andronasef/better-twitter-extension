import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  recordHit,
  recordMiss,
  recordTweetSeen,
  resetDiagnosticsForPage,
  currentDiagnostics,
  MISS_THRESHOLD,
} from '@/lib/diagnostics';
import { diagnosticsItem, settingsItem } from '@/lib/storage';

describe('diagnostics selector miss heuristics', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    resetDiagnosticsForPage();
    await diagnosticsItem.setValue({});
    await settingsItem.setValue({
      version: 1,
      features: {
        hidePromotedTweets: true,
      },
    });
  });

  it('MISS_THRESHOLD is exported and equals 3', () => {
    expect(MISS_THRESHOLD).toBe(3);
  });

  it('condition 1 failing: feature disabled records no miss even after 3 consecutive ticks with tweets seen', async () => {
    // Disable the feature
    await settingsItem.setValue({
      version: 1,
      features: {
        hidePromotedTweets: false,
      },
    });
    recordTweetSeen();

    // 3 ticks
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');

    const diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeUndefined();
  });

  it('condition 2 failing: zero tweets seen on page records no miss even if feature enabled and 3 ticks elapse', async () => {
    // Feature enabled, but recordTweetSeen NOT called
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');

    const diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeUndefined();
  });

  it('condition 3 failing: fewer than 3 consecutive ticks persists nothing', async () => {
    recordTweetSeen();

    // Tick 1
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    let diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeUndefined();

    // Tick 2
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeUndefined();

    // Tick 3: reaches threshold and persists
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeDefined();
    expect(diag.hidePromotedTweets?.selector).toBe('promotedContainer');
    expect(typeof diag.hidePromotedTweets?.firstSeen).toBe('number');
  });

  it('hit resets counter to zero and removes persisted miss', async () => {
    recordTweetSeen();

    // Trigger miss
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');

    let diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeDefined();

    // Record hit
    await recordHit('hidePromotedTweets', 'promotedContainer');
    diag = await currentDiagnostics();
    expect(diag.hidePromotedTweets).toBeUndefined();
  });

  it('recorded miss does not modify local:settings', async () => {
    recordTweetSeen();

    const initialSettings = await settingsItem.getValue();

    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');
    await recordMiss('hidePromotedTweets', 'promotedContainer');

    const finalSettings = await settingsItem.getValue();
    expect(finalSettings).toEqual(initialSettings);
  });
});
