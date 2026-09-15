import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { engagementItem, xThemeItem } from "@/lib/storage";
import type { EngagementState } from "@/lib/storage";
import { resolveScheme } from "@/lib/theme";
import { ShadowRootProvider } from "@/components/shadow-portal";
import { RateShareCard } from "./RateShareCard";

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_DISMISS_COUNT = 3;

let promptHostEl: HTMLElement | null = null;
let promptRoot: Root | null = null;
let sessionTimeoutId: any = null;
let unwatchEngagement: (() => void) | null = null;
let lastDevTrigger = 0;

/**
 * Evaluates whether the user is eligible to see the rate & share prompt.
 */
export function isEligibleForPrompt(
  state: EngagementState | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!state || !state.installedAt) {
    return false;
  }

  // Must have passed 7 days since install/first run
  if (now - state.installedAt < SEVEN_DAYS_MS) {
    return false;
  }

  // If already rated or shared, do not show
  if (state.actionTaken === "rated" || state.actionTaken === "shared") {
    return false;
  }

  // Maximum dismissals reached
  if (state.dismissCount >= MAX_DISMISS_COUNT) {
    return false;
  }

  // Snoozed
  if (state.snoozedUntil && now < state.snoozedUntil) {
    return false;
  }

  return true;
}

/**
 * Calculates a random snooze duration in milliseconds (3 to 6 days).
 */
export function calculateRandomSnoozeMs(): number {
  const days = 3 + Math.floor(Math.random() * 4); // 3, 4, 5, or 6 days
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Unmounts and removes the prompt card if currently displayed.
 */
export function unmountPrompt(): void {
  if (promptRoot) {
    try {
      promptRoot.unmount();
    } catch {
      // ignore
    }
    promptRoot = null;
  }
  if (promptHostEl) {
    promptHostEl.remove();
    promptHostEl = null;
  }
}

/**
 * Mounts the rate and share prompt in the bottom-right of Twitter/X.
 */
export async function mountPrompt(isDevForce = false): Promise<void> {
  if (promptHostEl || typeof document === "undefined") {
    return;
  }

  const [themeData, currentState] = await Promise.all([
    xThemeItem.getValue().catch(() => null),
    engagementItem.getValue().catch(() => null),
  ]);

  if (!isDevForce && !isEligibleForPrompt(currentState)) {
    return;
  }

  const scheme = resolveScheme(themeData);

  const container = document.createElement("div");
  container.id = "bt-rate-share-prompt-host";
  container.style.cssText =
    "position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: block; contain: layout style;";

  document.body.appendChild(container);
  promptHostEl = container;

  const shadow = container.attachShadow({ mode: "open" });
  promptRoot = createRoot(shadow);

  const handleRate = async () => {
    unmountPrompt();
    const curr = await engagementItem.getValue();
    await engagementItem.setValue({
      ...curr,
      actionTaken: "rated",
      lastShownAt: Date.now(),
    });
  };

  const handleShare = async () => {
    unmountPrompt();
    const curr = await engagementItem.getValue();
    await engagementItem.setValue({
      ...curr,
      actionTaken: "shared",
      lastShownAt: Date.now(),
    });
  };

  const handleDismiss = async () => {
    unmountPrompt();
    const curr = await engagementItem.getValue();
    const snoozedUntil = Date.now() + calculateRandomSnoozeMs();
    await engagementItem.setValue({
      ...curr,
      dismissCount: (curr.dismissCount || 0) + 1,
      snoozedUntil,
      lastShownAt: Date.now(),
    });
  };

  promptRoot.render(
    React.createElement(ShadowRootProvider, {
      value: shadow,
      children: React.createElement(RateShareCard, {
        scheme,
        onRate: handleRate,
        onShare: handleShare,
        onDismiss: handleDismiss,
      }),
    }),
  );

  // Update lastShownAt in storage
  if (currentState) {
    engagementItem
      .setValue({
        ...currentState,
        lastShownAt: Date.now(),
      })
      .catch(() => {});
  }
}

/**
 * Initializes the engagement prompt lifecycle on Twitter/X pages.
 */
export async function initEngagementPrompt(): Promise<void> {
  // 1. Listen for dev force-trigger events from the popup
  if (!unwatchEngagement) {
    engagementItem.getValue().then((initial) => {
      if (initial?.devForceTrigger) {
        lastDevTrigger = initial.devForceTrigger;
      }
    });

    unwatchEngagement = engagementItem.watch((newState) => {
      if (
        newState?.devForceTrigger &&
        newState.devForceTrigger > lastDevTrigger
      ) {
        lastDevTrigger = newState.devForceTrigger;
        mountPrompt(true);
      }
    });
  }

  // 2. Clear any pending session timeout
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }

  // 3. Fetch state to check eligibility
  const state = await engagementItem.getValue().catch(() => null);
  if (!state || !state.installedAt) {
    // If not set, initialize install date
    await engagementItem
      .setValue({
        installedAt: Date.now(),
        lastShownAt: null,
        actionTaken: null,
        dismissCount: 0,
        snoozedUntil: null,
        devForceTrigger: 0,
      })
      .catch(() => {});
    return;
  }

  if (!isEligibleForPrompt(state)) {
    return;
  }

  // 4. Random session timing: 50% chance per session to not feel spammy
  const sessionRoll = Math.random();
  if (sessionRoll > 0.5) {
    return;
  }

  // Random delay between 45s and 120s
  const randomDelayMs = 20000 + Math.floor(Math.random() * 50000);
  sessionTimeoutId = setTimeout(() => {
    mountPrompt();
  }, randomDelayMs);
}

/**
 * Teardown engagement prompt and cleanup listeners.
 */
export function teardownEngagementPrompt(): void {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  if (unwatchEngagement) {
    unwatchEngagement();
    unwatchEngagement = null;
  }
  unmountPrompt();
}
