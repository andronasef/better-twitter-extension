import { resolve, withFeature } from '@/lib/selectors';
import { onRouteChange } from '@/entrypoints/x.content/route-watcher';
import { registerPageObserver } from '@/lib/observers';
import type { FeatureController } from '@/entrypoints/x.content/dispatcher';

const selectors = withFeature('swapHomeTabs');

let hasAutoSelectedForRoute = false;
let routeUnsubscribe: (() => void) | null = null;
let tabObserver: MutationObserver | null = null;

function isHomeRoute(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const path = window.location.pathname;
  return path === '/home' || path === '/';
}

/**
 * Auto-selects the Following tab on x.com/home if it is not already selected.
 * Dispatches the click at most once per route entry (guarded by hasAutoSelectedForRoute)
 * to avoid fighting the user if they explicitly switch back to "For You" (Pitfall 2).
 *
 * Returns true when Following ends up selected (already selected, or just clicked);
 * returns false when the tab could not be resolved, or the guard already fired this
 * route without Following becoming selected.
 */
export function autoSelectFollowingTab(root?: ParentNode): boolean {
  if (!isHomeRoute()) return false;

  const followingTab = selectors.resolve('followingTab', root ?? document);
  if (!followingTab) return false;

  if (followingTab.getAttribute('aria-selected') === 'true') {
    return true;
  }

  if (!hasAutoSelectedForRoute) {
    hasAutoSelectedForRoute = true;
    (followingTab as HTMLElement).click();
    return true;
  }

  return false;
}

/** Resets the route-scoped single-activation guard. Called on every route change. */
export function resetAutoSelectGuard(): void {
  hasAutoSelectedForRoute = false;
}

function attachTabObserverIfNeeded(): void {
  if (typeof document === 'undefined') return;
  const primary = resolve('primaryColumn') || document.body;
  if (!primary) return;

  if (tabObserver) {
    tabObserver.disconnect();
    tabObserver = null;
  }

  const observer = new MutationObserver(() => {
    if (autoSelectFollowingTab()) {
      observer.disconnect();
      if (tabObserver === observer) {
        tabObserver = null;
      }
    }
  });
  observer.observe(primary, { childList: true, subtree: true });
  registerPageObserver('tab-reorder:auto-select', observer);
  tabObserver = observer;
}

function checkAndAutoSelect(): void {
  if (!isHomeRoute()) return;
  const selected = autoSelectFollowingTab();
  if (!selected) {
    // Tablist may not have mounted yet; watch primaryColumn briefly to catch it.
    attachTabObserverIfNeeded();
  }
}

export const tabReorder: FeatureController & { id: string } = {
  id: 'swapHomeTabs',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-swap-tabs', 'true');
    }

    if (!routeUnsubscribe) {
      routeUnsubscribe = onRouteChange(() => {
        resetAutoSelectGuard();
        checkAndAutoSelect();
      });
    }

    checkAndAutoSelect();
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-swap-tabs');
    }

    if (routeUnsubscribe) {
      routeUnsubscribe();
      routeUnsubscribe = null;
    }

    if (tabObserver) {
      tabObserver.disconnect();
      tabObserver = null;
    }

    resetAutoSelectGuard();
  },
};

export const hideForYou: FeatureController & { id: string } = {
  id: 'hideForYouTab',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-hide-for-you', 'true');
    }
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-hide-for-you');
    }
  },
};
