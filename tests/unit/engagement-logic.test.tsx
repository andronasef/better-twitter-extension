(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isEligibleForPrompt,
  calculateRandomSnoozeMs,
  SEVEN_DAYS_MS,
  MAX_DISMISS_COUNT,
} from '@/features/engagement';
import { RateShareCard } from '@/features/engagement/RateShareCard';

describe('Engagement Prompt Eligibility & Logic', () => {
  const now = 1773700000000;

  it('rejects null or uninitialized state', () => {
    expect(isEligibleForPrompt(null, now)).toBe(false);
    expect(isEligibleForPrompt(undefined, now)).toBe(false);
    expect(isEligibleForPrompt({ installedAt: 0, lastShownAt: null, actionTaken: null, dismissCount: 0, snoozedUntil: null }, now)).toBe(false);
  });

  it('rejects users who installed less than 7 days ago', () => {
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    expect(
      isEligibleForPrompt(
        { installedAt: sixDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 0, snoozedUntil: null },
        now
      )
    ).toBe(false);
  });

  it('accepts users who installed 7 or more days ago', () => {
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    expect(
      isEligibleForPrompt(
        { installedAt: sevenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 0, snoozedUntil: null },
        now
      )
    ).toBe(true);

    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 0, snoozedUntil: null },
        now
      )
    ).toBe(true);
  });

  it('rejects users who have already rated or shared', () => {
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: 'rated', dismissCount: 0, snoozedUntil: null },
        now
      )
    ).toBe(false);

    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: 'shared', dismissCount: 0, snoozedUntil: null },
        now
      )
    ).toBe(false);
  });

  it('rejects users who have reached MAX_DISMISS_COUNT (3)', () => {
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 3, snoozedUntil: null },
        now
      )
    ).toBe(false);

    // 2 dismissals is still eligible (if not active snooze)
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 2, snoozedUntil: null },
        now
      )
    ).toBe(true);
  });

  it('rejects actively snoozed users until snooze expires', () => {
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    const futureSnooze = now + 86400000; // 1 day in future
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 1, snoozedUntil: futureSnooze },
        now
      )
    ).toBe(false);

    const pastSnooze = now - 1000; // expired snooze
    expect(
      isEligibleForPrompt(
        { installedAt: tenDaysAgo, lastShownAt: null, actionTaken: null, dismissCount: 1, snoozedUntil: pastSnooze },
        now
      )
    ).toBe(true);
  });

  it('calculates random snooze duration between 3 and 6 days', () => {
    for (let i = 0; i < 20; i++) {
      const ms = calculateRandomSnoozeMs();
      const days = ms / (24 * 60 * 60 * 1000);
      expect(days).toBeGreaterThanOrEqual(3);
      expect(days).toBeLessThanOrEqual(6);
    }
  });
});

describe('RateShareCard Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders card with store name and triggers callbacks on click', () => {
    const onRate = vi.fn();
    const onShare = vi.fn();
    const onDismiss = vi.fn();

    vi.spyOn(window, 'open').mockImplementation(() => null);

    act(() => {
      const root = createRoot(container);
      root.render(
        <RateShareCard
          scheme="dark"
          onRate={onRate}
          onShare={onShare}
          onDismiss={onDismiss}
        />
      );
    });

    // Contains Better Twitter title
    expect(container.textContent).toContain('Better Twitter');
    expect(container.textContent).toContain('Rate on Chrome Web Store');
    expect(container.textContent).toContain('Share on X');

    // Click Rate button
    const buttons = Array.from(container.querySelectorAll('button'));
    const rateBtn = buttons.find((b) => b.textContent?.includes('Rate on'));
    expect(rateBtn).toBeDefined();

    act(() => {
      rateBtn?.click();
    });
    expect(onRate).toHaveBeenCalledTimes(1);

    // Click Share button
    const shareBtn = buttons.find((b) => b.textContent?.includes('Share on X'));
    expect(shareBtn).toBeDefined();

    act(() => {
      shareBtn?.click();
    });
    expect(onShare).toHaveBeenCalledTimes(1);

    // Click Dismiss / Maybe Later
    const dismissBtn = buttons.find((b) => b.textContent?.includes('Maybe later'));
    expect(dismissBtn).toBeDefined();

    act(() => {
      dismissBtn?.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
