import { onBridgeNavigate } from './bridge-client';
import { registerGlobalObserver } from '@/lib/observers';

export type NavigationSource =
  | 'bridge'
  | 'popstate'
  | 'title'
  | 'locationchange';

export interface NavigationSignal {
  url: string;
  source: NavigationSource;
}

export interface RouteWatcherOptions {
  ctx?: {
    setTimeout?: (fn: () => void, ms: number) => number;
    clearTimeout?: (id: number) => void;
  };
  debounceMs?: number;
}

type RouteHandler = (signal: NavigationSignal) => void;

const routeHandlers: RouteHandler[] = [];
let lastSeenUrl = '';
let pendingSignal: NavigationSignal | null = null;
let timerId: number | null = null;
let activeCtx: RouteWatcherOptions['ctx'] | null = null;
let activeDebounceMs = 50;
let started = false;

const scheduleTimer = (fn: () => void, ms: number): number => {
  if (activeCtx?.setTimeout) {
    return activeCtx.setTimeout(fn, ms);
  }
  return window.setTimeout(fn, ms);
};

const cancelTimer = (id: number): void => {
  if (activeCtx?.clearTimeout) {
    activeCtx.clearTimeout(id);
  } else {
    window.clearTimeout(id);
  }
};

export function resetRouteWatcherForTesting(): void {
  if (timerId !== null) {
    cancelTimer(timerId);
    timerId = null;
  }
  lastSeenUrl = '';
  pendingSignal = null;
  routeHandlers.length = 0;
  started = false;
  activeCtx = null;
  activeDebounceMs = 50;
}

export function dispatchNavigationSignal(signal: NavigationSignal): void {
  // If no pending signal or URL changed, set it. Keep existing if same URL (first winner)
  if (!pendingSignal) {
    pendingSignal = signal;
  } else if (pendingSignal.url !== signal.url) {
    pendingSignal = signal;
  }

  if (timerId !== null) {
    cancelTimer(timerId);
  }

  timerId = scheduleTimer(() => {
    timerId = null;
    const current = pendingSignal;
    pendingSignal = null;

    if (current && current.url !== lastSeenUrl) {
      lastSeenUrl = current.url;

      if (import.meta.env.DEV) {
        console.log(`[bt:spike] Navigation won by ${current.source}: ${current.url}`);
      }

      for (const handler of routeHandlers) {
        try {
          handler(current);
        } catch {
          // Handler error guard
        }
      }
    }
  }, activeDebounceMs);
}

export function onRouteChange(handler: RouteHandler): () => void {
  routeHandlers.push(handler);
  return () => {
    const idx = routeHandlers.indexOf(handler);
    if (idx !== -1) routeHandlers.splice(idx, 1);
  };
}

export function startRouteWatcher(options?: RouteWatcherOptions): void {
  if (options?.ctx) activeCtx = options.ctx;
  if (options?.debounceMs !== undefined) activeDebounceMs = options.debounceMs;

  if (started) return;
  started = true;

  // Source 1: MAIN-world bridge (Primary)
  onBridgeNavigate(({ url }) => {
    dispatchNavigationSignal({ url, source: 'bridge' });
  });

  // Source 2: popstate in isolated world
  window.addEventListener('popstate', () => {
    dispatchNavigationSignal({ url: window.location.href, source: 'popstate' });
  });

  // Source 3: Document title observer in global scope (bridge-failure net)
  const titleEl = document.querySelector('title');
  const checkTitle = () => {
    const title = document.title ? document.title.trim() : '';
    // Flash of uninitialized title: ignore bare product names
    if (/^(X|Twitter|\s*)$/i.test(title)) {
      return;
    }
    dispatchNavigationSignal({ url: window.location.href, source: 'title' });
  };

  if (titleEl) {
    const titleObserver = new MutationObserver(() => checkTitle());
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
    registerGlobalObserver('route-watcher:title', titleObserver);
  } else {
    // If <title> not present yet, watch document.head
    const headObserver = new MutationObserver(() => {
      const headTitle = document.querySelector('title');
      if (headTitle) {
        headObserver.disconnect();
        const titleObserver = new MutationObserver(() => checkTitle());
        titleObserver.observe(headTitle, { childList: true, characterData: true, subtree: true });
        registerGlobalObserver('route-watcher:title', titleObserver);
      }
    });
    if (document.head) {
      headObserver.observe(document.head, { childList: true });
      registerGlobalObserver('route-watcher:head', headObserver);
    }
  }

  // Source 4: wxt:locationchange event (last-resort net)
  window.addEventListener('wxt:locationchange', ((e: CustomEvent<{ newUrl?: string }>) => {
    const url = e.detail?.newUrl || window.location.href;
    dispatchNavigationSignal({ url, source: 'locationchange' });
  }) as EventListener);
}
