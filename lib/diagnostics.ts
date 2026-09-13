import { diagnosticsItem, settingsItem } from '@/lib/storage';
import type { Diagnostics } from '@/lib/storage';

export const MISS_THRESHOLD = 3;

const consecutiveMisses = new Map<string, number>();
let pageHasSeenTweets = false;

export function recordTweetSeen(): void {
  pageHasSeenTweets = true;
}

export function resetDiagnosticsForPage(): void {
  pageHasSeenTweets = false;
  consecutiveMisses.clear();
}

export async function currentDiagnostics(): Promise<Diagnostics> {
  return await diagnosticsItem.getValue();
}

async function notifyBackgroundTransition(hasMisses: boolean): Promise<void> {
  try {
    if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
      await browser.runtime.sendMessage({
        type: 'bt:diagnostics-transition',
        hasMisses,
      });
    }
  } catch {
    // Ignore message dispatch error if background not listening or tearing down
  }
}

export async function recordHit(
  featureId: string,
  selectorName: string
): Promise<void> {
  const key = `${featureId}:${selectorName}`;
  consecutiveMisses.set(key, 0);

  const diagnostics = await diagnosticsItem.getValue();
  if (diagnostics[featureId] && diagnostics[featureId]?.selector === selectorName) {
    const nextDiagnostics = { ...diagnostics };
    delete nextDiagnostics[featureId];
    await diagnosticsItem.setValue(nextDiagnostics);

    // If transitioned to empty, notify background
    if (Object.keys(nextDiagnostics).length === 0) {
      await notifyBackgroundTransition(false);
    }
  }
}

export async function recordMiss(
  featureId: string,
  selectorName: string,
  featureEnabledOverride?: boolean
): Promise<void> {
  // Condition 2: Pipeline must have emitted at least one tweet on this page
  if (!pageHasSeenTweets) {
    return;
  }

  // Condition 1: Owning feature must be enabled
  let isEnabled = featureEnabledOverride;
  if (isEnabled === undefined) {
    const settings = await settingsItem.getValue();
    isEnabled = Boolean(settings.features?.[featureId]);
  }

  if (!isEnabled) {
    return;
  }

  // Condition 3: Three consecutive ticks
  const key = `${featureId}:${selectorName}`;
  const currentCount = (consecutiveMisses.get(key) || 0) + 1;
  consecutiveMisses.set(key, currentCount);

  if (currentCount >= MISS_THRESHOLD) {
    const diagnostics = await diagnosticsItem.getValue();
    const isFirstMiss = Object.keys(diagnostics).length === 0;

    if (!diagnostics[featureId]) {
      const nextDiagnostics: Diagnostics = {
        ...diagnostics,
        [featureId]: {
          selector: selectorName,
          firstSeen: Date.now(),
        },
      };
      await diagnosticsItem.setValue(nextDiagnostics);

      // If transitioned from empty to non-empty, notify background
      if (isFirstMiss) {
        await notifyBackgroundTransition(true);
      }
    }
  }
}
