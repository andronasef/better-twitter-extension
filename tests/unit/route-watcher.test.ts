import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startRouteWatcher,
  onRouteChange,
  dispatchNavigationSignal,
  resetRouteWatcherForTesting,
  type NavigationSignal,
} from '@/entrypoints/x.content/route-watcher';

describe('layered route watcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRouteWatcherForTesting();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('two sources delivering the same URL inside the debounce window produce exactly one handler invocation', () => {
    const handler = vi.fn();
    onRouteChange(handler);

    startRouteWatcher({ debounceMs: 50 });

    dispatchNavigationSignal({ url: 'https://x.com/home', source: 'bridge' });
    dispatchNavigationSignal({ url: 'https://x.com/home', source: 'popstate' });

    vi.advanceTimersByTime(50);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://x.com/home',
        source: 'bridge',
      })
    );
  });

  it('a URL identical to the last-seen URL results in zero handler invocations', () => {
    const handler = vi.fn();
    onRouteChange(handler);

    startRouteWatcher({ debounceMs: 50 });

    dispatchNavigationSignal({ url: 'https://x.com/home', source: 'bridge' });
    vi.advanceTimersByTime(50);
    expect(handler).toHaveBeenCalledTimes(1);

    // Same URL delivered later
    dispatchNavigationSignal({ url: 'https://x.com/home', source: 'locationchange' });
    vi.advanceTimersByTime(50);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('a URL differing from the last-seen URL results in exactly one handler invocation', () => {
    const handler = vi.fn();
    onRouteChange(handler);

    startRouteWatcher({ debounceMs: 50 });

    dispatchNavigationSignal({ url: 'https://x.com/home', source: 'bridge' });
    vi.advanceTimersByTime(50);
    expect(handler).toHaveBeenCalledTimes(1);

    dispatchNavigationSignal({ url: 'https://x.com/explore', source: 'bridge' });
    vi.advanceTimersByTime(50);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: 'https://x.com/explore',
        source: 'bridge',
      })
    );
  });

  it('bare product name in document.title does not dispatch a navigation signal', () => {
    const handler = vi.fn();
    onRouteChange(handler);

    startRouteWatcher({ debounceMs: 50 });

    document.title = 'X';
    // Title observer triggers
    vi.advanceTimersByTime(50);

    expect(handler).not.toHaveBeenCalled();
  });
});
