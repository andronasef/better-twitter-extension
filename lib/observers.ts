export interface Disconnectable {
  disconnect: () => void;
}

const globalObservers = new Map<string, Disconnectable>();
const pageObservers = new Map<string, Disconnectable>();

let pageAbortController = new AbortController();

export function getPageAbortSignal(): AbortSignal {
  return pageAbortController.signal;
}

export function registerGlobalObserver(
  name: string,
  observer: Disconnectable
): void {
  const existing = globalObservers.get(name);
  if (existing) {
    try {
      existing.disconnect();
    } catch {
      // Ignore disconnect error
    }
  }
  globalObservers.set(name, observer);
}

export function registerPageObserver(
  name: string,
  observer: Disconnectable
): void {
  const existing = pageObservers.get(name);
  if (existing) {
    try {
      existing.disconnect();
    } catch {
      // Ignore disconnect error
    }
  }
  pageObservers.set(name, observer);
}

export function observeElement(
  name: string,
  target: Node,
  callback: MutationCallback,
  options?: MutationObserverInit,
  scope: 'page' | 'global' = 'page'
): MutationObserver {
  const observer = new MutationObserver(callback);
  observer.observe(target, options);

  if (scope === 'global') {
    registerGlobalObserver(name, observer);
  } else {
    registerPageObserver(name, observer);
  }

  return observer;
}

export function teardownPageScope(): void {
  for (const observer of pageObservers.values()) {
    try {
      observer.disconnect();
    } catch {
      // Ignore disconnect error
    }
  }
  pageObservers.clear();

  try {
    pageAbortController.abort();
  } catch {
    // Ignore abort error
  }
  pageAbortController = new AbortController();
}
