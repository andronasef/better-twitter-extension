import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSettingsDispatcher } from '@/entrypoints/x.content/dispatcher';

describe('Settings dispatch & convergence (FOUND-07)', () => {
  let initFn: ReturnType<typeof vi.fn>;
  let teardownFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    initFn = vi.fn();
    teardownFn = vi.fn();
  });

  it('Given the identical settings object is written twice: the dispatcher invokes zero further init/teardown calls on the second write', () => {
    const registry = {
      hidePromotedTweets: { init: initFn, teardown: teardownFn },
    };

    const dispatcher = createSettingsDispatcher(registry);

    // Initial state: hidePromotedTweets is true
    dispatcher.dispatch({ version: 1, features: { hidePromotedTweets: true } });
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(teardownFn).toHaveBeenCalledTimes(0);

    // Write identical settings object
    dispatcher.dispatch({ version: 1, features: { hidePromotedTweets: true } });
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(teardownFn).toHaveBeenCalledTimes(0);
  });

  it('Flipping false tears down, flipping true re-inits', () => {
    const registry = {
      hidePromotedTweets: { init: initFn, teardown: teardownFn },
    };

    const dispatcher = createSettingsDispatcher(registry);

    dispatcher.dispatch({ version: 1, features: { hidePromotedTweets: true } });
    expect(initFn).toHaveBeenCalledTimes(1);

    dispatcher.dispatch({ version: 1, features: { hidePromotedTweets: false } });
    expect(teardownFn).toHaveBeenCalledTimes(1);

    dispatcher.dispatch({ version: 1, features: { hidePromotedTweets: true } });
    expect(initFn).toHaveBeenCalledTimes(2);
  });

  it('Two tabs open at once both converge: each tab diffs against the value it last applied', () => {
    const tab1Init = vi.fn();
    const tab1Teardown = vi.fn();
    const tab2Init = vi.fn();
    const tab2Teardown = vi.fn();

    const tab1Dispatcher = createSettingsDispatcher({
      hidePromotedTweets: { init: tab1Init, teardown: tab1Teardown },
    });
    const tab2Dispatcher = createSettingsDispatcher({
      hidePromotedTweets: { init: tab2Init, teardown: tab2Teardown },
    });

    // Both start at default ON
    const initial = { version: 1, features: { hidePromotedTweets: true } };
    tab1Dispatcher.dispatch(initial);
    tab2Dispatcher.dispatch(initial);

    expect(tab1Init).toHaveBeenCalledTimes(1);
    expect(tab2Init).toHaveBeenCalledTimes(1);

    // Tab 1 flips toggle OFF
    const changed = { version: 1, features: { hidePromotedTweets: false } };
    tab1Dispatcher.dispatch(changed);
    // Storage onChanged broadcasts to Tab 2
    tab2Dispatcher.dispatch(changed);

    expect(tab1Teardown).toHaveBeenCalledTimes(1);
    expect(tab2Teardown).toHaveBeenCalledTimes(1);
  });
});