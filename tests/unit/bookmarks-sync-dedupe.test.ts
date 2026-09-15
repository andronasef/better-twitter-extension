import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * The bridge's page-request listeners are deliberately redundant (window.postMessage,
 * the injected <script> element, and document), so one logical requestBookmarksPage()
 * call arrives up to three times. Without dedupe the duplicate responses race in
 * handleBookmarksPayload and flip sync to 'complete' after a few pages (BOOK-02).
 */
describe('Bridge bookmark page-fetch dedupe (BOOK-02)', () => {
  const EMPTY_PAGE = JSON.stringify({
    data: { bookmark_timeline_v2: { timeline: { instructions: [] } } },
  });

  let fetchStub: ReturnType<typeof vi.fn>;
  let realFetch: typeof window.fetch;
  let realOpen: typeof XMLHttpRequest.prototype.open;
  let realSend: typeof XMLHttpRequest.prototype.send;
  let realPushState: typeof history.pushState;
  let realReplaceState: typeof history.replaceState;
  let now: number;

  const flush = () => new Promise((r) => setTimeout(r, 0));

  const okResponse = () => ({
    status: 200,
    text: async () => EMPTY_PAGE,
    clone: () => ({ text: async () => EMPTY_PAGE }),
  });

  /** Mirrors requestBookmarksPage()'s multi-channel emit from the isolated world. */
  const requestPage = async (cursor: string) => {
    window.postMessage({ type: 'bt:request-bookmarks-page', cursor }, '*');
    document.dispatchEvent(
      new CustomEvent('bt:request-bookmarks-page', { detail: { cursor } })
    );
    await flush();
    await flush();
  };

  beforeEach(async () => {
    realFetch = window.fetch;
    realOpen = XMLHttpRequest.prototype.open;
    realSend = XMLHttpRequest.prototype.send;
    realPushState = history.pushState;
    realReplaceState = history.replaceState;

    now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    fetchStub = vi.fn(async () => okResponse());
    window.fetch = fetchStub as unknown as typeof window.fetch;

    // Module-scoped guards persist per module, so reload the bridge for each test.
    vi.resetModules();
    const mod: any = await import('@/entrypoints/bridge');
    (mod.default.main ?? mod.default)();

    // The bridge refuses to fetch until it has captured a request template.
    await window.fetch(
      'https://x.com/i/api/graphql/DOC1/Bookmarks?variables=%7B%7D' as any,
      { method: 'GET', headers: { authorization: 'Bearer test' } } as any
    );
    await flush();
    await flush();
    fetchStub.mockClear();
  });

  afterEach(() => {
    window.fetch = realFetch;
    XMLHttpRequest.prototype.open = realOpen;
    XMLHttpRequest.prototype.send = realSend;
    history.pushState = realPushState;
    history.replaceState = realReplaceState;
    vi.restoreAllMocks();
  });

  it('collapses the multi-channel burst into a single fetch', async () => {
    await requestPage('CURSOR_A');
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('never refetches the same non-empty cursor', async () => {
    await requestPage('CURSOR_A');
    await requestPage('CURSOR_A');
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('still fetches a distinct cursor', async () => {
    await requestPage('CURSOR_A');
    await requestPage('CURSOR_B');
    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(String(fetchStub.mock.calls[1]![0])).toContain('CURSOR_B');
  });

  it('treats an empty cursor as a fresh start that resets the guard', async () => {
    await requestPage('');
    await requestPage('');
    expect(fetchStub).toHaveBeenCalledTimes(1);

    now += 5000; // outside the fresh-start dedupe window
    await requestPage('');
    expect(fetchStub).toHaveBeenCalledTimes(2);

    // A re-sync can re-walk a cursor an earlier sync already fetched.
    await requestPage('CURSOR_A');
    expect(fetchStub).toHaveBeenCalledTimes(3);
  });

  it('releases the in-flight guard when a fetch fails', async () => {
    fetchStub.mockRejectedValueOnce(new Error('network down'));
    await requestPage('CURSOR_A');
    await requestPage('CURSOR_B');
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });
});
