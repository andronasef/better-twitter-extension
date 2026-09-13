import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  observeElement,
  registerGlobalObserver,
  registerPageObserver,
  teardownPageScope,
} from '@/lib/observers';

describe('named observer registries', () => {
  beforeEach(() => {
    teardownPageScope();
  });

  it('registering a page-scoped observer under an existing name disconnects the previous observer', () => {
    const disconnect1 = vi.fn();
    const disconnect2 = vi.fn();

    registerPageObserver('timeline', { disconnect: disconnect1 });
    expect(disconnect1).not.toHaveBeenCalled();

    registerPageObserver('timeline', { disconnect: disconnect2 });
    expect(disconnect1).toHaveBeenCalledTimes(1);
    expect(disconnect2).not.toHaveBeenCalled();
  });

  it('registering a global observer under an existing name disconnects the previous observer', () => {
    const disconnect1 = vi.fn();
    const disconnect2 = vi.fn();

    registerGlobalObserver('bodyStyle', { disconnect: disconnect1 });
    expect(disconnect1).not.toHaveBeenCalled();

    registerGlobalObserver('bodyStyle', { disconnect: disconnect2 });
    expect(disconnect1).toHaveBeenCalledTimes(1);
    expect(disconnect2).not.toHaveBeenCalled();
  });

  it('teardownPageScope disconnects every page observer and empties page registry', () => {
    const disconnect1 = vi.fn();
    const disconnect2 = vi.fn();

    registerPageObserver('obs1', { disconnect: disconnect1 });
    registerPageObserver('obs2', { disconnect: disconnect2 });

    teardownPageScope();

    expect(disconnect1).toHaveBeenCalledTimes(1);
    expect(disconnect2).toHaveBeenCalledTimes(1);

    // Further teardown should not call disconnect again since registry is emptied
    teardownPageScope();
    expect(disconnect1).toHaveBeenCalledTimes(1);
    expect(disconnect2).toHaveBeenCalledTimes(1);
  });

  it('teardownPageScope leaves global-registry observers connected', () => {
    const globalDisconnect = vi.fn();
    const pageDisconnect = vi.fn();

    registerGlobalObserver('globalTitle', { disconnect: globalDisconnect });
    registerPageObserver('pageTimeline', { disconnect: pageDisconnect });

    teardownPageScope();

    expect(pageDisconnect).toHaveBeenCalledTimes(1);
    expect(globalDisconnect).not.toHaveBeenCalled();
  });

  it('observeElement creates, observes, and disconnects prior observer in given scope', () => {
    const target = document.createElement('div');
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const obs1 = observeElement('el', target, callback1, { childList: true }, 'page');
    const disconnectSpy = vi.spyOn(obs1, 'disconnect');

    observeElement('el', target, callback2, { childList: true }, 'page');
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
