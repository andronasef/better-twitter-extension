export default defineUnlistedScript(() => {
  const currentScript = document.currentScript;

  const emitEvent = (eventName: string, detail: unknown) => {
    try {
      if (currentScript) {
        currentScript.dispatchEvent(new CustomEvent(eventName, { detail }));
      }
      document.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch {
      // Swallow error so observation cannot break the page
    }
  };

  const isBookmarksPath = (p: string) => {
    const lower = p.toLowerCase();
    return (
      lower.includes('/bookmarks') ||
      lower === '/history' ||
      lower === '/i/history' ||
      lower.startsWith('/i/history') ||
      lower.startsWith('/history')
    );
  };

  interface BookmarksTemplate {
    endpoint: string;
    docId: string;
    operationName: string;
    method: string;
    headers: Record<string, string>;
    variables?: any;
    features?: any;
    fieldToggles?: any;
  }
  let lastBookmarksTemplate: BookmarksTemplate | null = null;

  // The page-request listeners below are deliberately redundant (postMessage +
  // script element + document), so one logical request arrives up to 3x. These
  // guards collapse that burst into a single outbound fetch — without them the
  // duplicate responses race in handleBookmarksPayload and end sync early.
  const FRESH_START_WINDOW_MS = 1500;
  let bookmarksFetchInFlight = false;
  let lastRequestedCursor: string | null = null;
  let lastRequestedAt = 0;

  const extractShape = (
    method: string,
    url: string,
    rawText: string,
    status: number = 200,
    reqBody?: string,
    reqHeaders?: Record<string, string>
  ) => {
    try {
      const match = url.match(/\/i\/api\/graphql\/([^/?#]+)\/([^/?#]+)/);
      const docId = (match && match[1]) ? match[1] : '';
      const operationName = (match && match[2]) ? match[2] : '';
      const urlPath = url.split('?')[0] || '';

      let topLevelResponseKeys: string[] = [];
      let entryCount = 0;
      let parsedData: any = null;

      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed.data === 'object' && parsed.data !== null) {
            parsedData = parsed.data;
            topLevelResponseKeys = Object.keys(parsed.data);

            const findEntries = (obj: any): number => {
              if (!obj || typeof obj !== 'object') return 0;
              if (Array.isArray(obj.entries)) return obj.entries.length;
              if (Array.isArray(obj.instructions)) {
                for (const inst of obj.instructions) {
                  if (Array.isArray(inst.entries)) return inst.entries.length;
                }
              }
              for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object') {
                  const count = findEntries(obj[key]);
                  if (count > 0) return count;
                }
              }
              return 0;
            };
            entryCount = findEntries(parsed.data);
          }
        } catch {}
      }

      emitEvent('bt:graphql', {
        method,
        urlPath,
        operationName,
        docId,
        topLevelResponseKeys,
        entryCount,
      });

      // Intercept Bookmarks query response (BOOK-01, D-18)
      const isBookmarksQuery =
        operationName === 'Bookmarks' ||
        operationName === 'BookmarkTimeline' ||
        operationName === 'BookmarksTimeline' ||
        operationName === 'BookmarkFolderTimeline' ||
        operationName === 'HistoryBookmarksTimeline' ||
        /bookmarks/i.test(url) ||
        /bookmark/i.test(url) ||
        (operationName != null && /bookmarks/i.test(operationName)) ||
        (operationName != null && /bookmark/i.test(operationName)) ||
        Boolean(reqBody && /bookmark/i.test(reqBody)) ||
        Boolean(parsedData?.bookmark_timeline_v2 || parsedData?.bookmark_timeline) ||
        ((operationName === 'HistoryTimeline' || (operationName != null && /history/i.test(operationName))) &&
          isBookmarksPath(location.pathname));

      if (isBookmarksQuery && operationName !== 'CreateBookmark' && operationName !== 'DeleteBookmark') {
        try {
          const urlObj = new URL(url, location.origin);
          const endpoint = urlObj.origin + urlObj.pathname;
          let vars: any = undefined;
          let feats: any = undefined;
          let toggles: any = undefined;

          if (method === 'GET') {
            const varsRaw = urlObj.searchParams.get('variables');
            if (varsRaw) {
              try { vars = JSON.parse(varsRaw); } catch {}
            }
            const featsRaw = urlObj.searchParams.get('features');
            if (featsRaw) {
              try { feats = JSON.parse(featsRaw); } catch { feats = featsRaw; }
            }
            const togglesRaw = urlObj.searchParams.get('fieldToggles');
            if (togglesRaw) {
              try { toggles = JSON.parse(togglesRaw); } catch { toggles = togglesRaw; }
            }
          } else if (reqBody) {
            try {
              const bodyParsed = JSON.parse(reqBody);
              vars = bodyParsed.variables;
              feats = bodyParsed.features;
              toggles = bodyParsed.fieldToggles;
            } catch {}
          }

          lastBookmarksTemplate = {
            endpoint,
            docId,
            operationName: operationName || 'Bookmarks',
            method,
            headers: reqHeaders && Object.keys(reqHeaders).length > 0
              ? reqHeaders
              : (lastBookmarksTemplate?.headers ?? {}),
            variables: vars,
            features: feats,
            fieldToggles: toggles,
          };
        } catch {}

        emitEvent('bt:graphql-bookmarks', {
          docId,
          operationName: operationName || 'Bookmarks',
          data: parsedData,
          status,
        });
      }

      // Intercept CreateBookmark / DeleteBookmark mutations (BOOK-01, D-05, D-09)
      if (operationName === 'CreateBookmark' || operationName === 'DeleteBookmark') {
        let tweetId = '';
        if (reqBody) {
          try {
            const parsedReq = JSON.parse(reqBody);
            tweetId = parsedReq.variables?.tweet_id || parsedReq.tweet_id || '';
          } catch {}
        }
        if (!tweetId && url.includes('variables=')) {
          try {
            const urlObj = new URL(url, location.origin);
            const vars = urlObj.searchParams.get('variables');
            if (vars) {
              const parsedVars = JSON.parse(vars);
              tweetId = parsedVars.tweet_id || parsedVars.tweetId || '';
            }
          } catch {}
        }

        emitEvent('bt:graphql-bookmark-mutation', {
          operationName,
          tweetId: String(tweetId || ''),
          url,
        });
      }
    } catch {
      // Swallow all errors
    }
  };

  // 1. Patch window.fetch
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const result = await origFetch.apply(this, args);
    try {
      const input = args[0];
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : input instanceof URL
              ? input.href
              : '';
      if (url.includes('/i/api/graphql/')) {
        const init = args[1];
        const method = (
          init && init.method
            ? init.method
            : input instanceof Request
              ? input.method
              : 'GET'
        ).toUpperCase();
        let reqBody: string | undefined;
        if (init && typeof init.body === 'string') {
          reqBody = init.body;
        }

        const rawHeaders =
          (init && init.headers) ||
          (input instanceof Request ? input.headers : undefined);
        const headersObj: Record<string, string> = {};
        if (rawHeaders) {
          if (typeof (rawHeaders as any).forEach === 'function') {
            (rawHeaders as any).forEach((val: string, key: string) => {
              headersObj[key.toLowerCase()] = val;
            });
          } else if (Array.isArray(rawHeaders)) {
            for (const [k, v] of rawHeaders) {
              if (k && v) headersObj[k.toLowerCase()] = v;
            }
          } else if (typeof rawHeaders === 'object') {
            for (const k of Object.keys(rawHeaders)) {
              if (typeof (rawHeaders as any)[k] === 'string') {
                headersObj[k.toLowerCase()] = (rawHeaders as any)[k];
              }
            }
          }
        }

        result
          .clone()
          .text()
          .then((text) => {
            extractShape(method, url, text, result.status, reqBody, headersObj);
          })
          .catch(() => {});
      }
    } catch {
      // Observation must never fail or break page
    }
    return result;
  };

  const fetchBookmarksPage = async (cursor: string) => {
    if (!lastBookmarksTemplate) {
      emitEvent('bt:graphql-bookmarks-error', {
        reason: 'no_template',
      });
      return;
    }

    // Guards are read and written synchronously before the first await so that
    // same-tick duplicates from the other channels observe them.
    const wanted = (cursor || '').trim();
    const requestedAt = Date.now();

    if (bookmarksFetchInFlight) return;

    if (wanted) {
      // A repeated non-empty cursor is never a new page — the capture engine
      // already treats a repeated cursor as the end of the timeline.
      if (wanted === lastRequestedCursor) return;
    } else if (
      lastRequestedCursor === '' &&
      requestedAt - lastRequestedAt < FRESH_START_WINDOW_MS
    ) {
      return;
    }

    // Recording the empty cursor here is the reset: a fresh sync overwrites the
    // memory, so it can re-walk cursors an earlier sync already fetched.
    bookmarksFetchInFlight = true;
    lastRequestedCursor = wanted;
    lastRequestedAt = requestedAt;

    try {
      const vars: any = {
        ...(lastBookmarksTemplate.variables || {}),
        count: 20,
      };
      if (cursor && cursor.trim()) {
        vars.cursor = cursor.trim();
      }

      const urlObj = new URL(lastBookmarksTemplate.endpoint, location.origin);
      const reqHeaders: Record<string, string> = {
        ...lastBookmarksTemplate.headers,
      };

      if (!reqHeaders['x-csrf-token']) {
        const ct0 = document.cookie.match(/(?:^|;\s*)ct0=([a-f0-9]+)/)?.[1];
        if (ct0) reqHeaders['x-csrf-token'] = ct0;
      }
      if (!reqHeaders['authorization']) {
        reqHeaders['authorization'] =
          'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
      }

      const fetchInit: RequestInit = {
        method: lastBookmarksTemplate.method,
        headers: reqHeaders,
        credentials: 'include',
      };

      if (lastBookmarksTemplate.method === 'GET') {
        urlObj.searchParams.set('variables', JSON.stringify(vars));
        if (lastBookmarksTemplate.features) {
          urlObj.searchParams.set(
            'features',
            typeof lastBookmarksTemplate.features === 'string'
              ? lastBookmarksTemplate.features
              : JSON.stringify(lastBookmarksTemplate.features)
          );
        }
        if (lastBookmarksTemplate.fieldToggles) {
          urlObj.searchParams.set(
            'fieldToggles',
            typeof lastBookmarksTemplate.fieldToggles === 'string'
              ? lastBookmarksTemplate.fieldToggles
              : JSON.stringify(lastBookmarksTemplate.fieldToggles)
          );
        }
      } else {
        fetchInit.body = JSON.stringify({
          variables: vars,
          features: lastBookmarksTemplate.features,
          fieldToggles: lastBookmarksTemplate.fieldToggles,
        });
      }

      const res = await origFetch(urlObj.toString(), fetchInit);
      const text = await res.text();
      let parsedData: any = null;
      try {
        const parsed = JSON.parse(text);
        parsedData = parsed?.data ?? parsed;
      } catch {}

      emitEvent('bt:graphql-bookmarks', {
        docId: lastBookmarksTemplate.docId,
        operationName: lastBookmarksTemplate.operationName,
        data: parsedData,
        status: res.status,
      });
    } catch (err: any) {
      emitEvent('bt:graphql-bookmarks-error', {
        reason: 'fetch_failed',
        error: String(err?.message || err),
      });
    } finally {
      bookmarksFetchInFlight = false;
    }
  };

  window.addEventListener('message', (event) => {
    try {
      if (event.data && event.data.type === 'bt:request-bookmarks-page') {
        fetchBookmarksPage(String(event.data.cursor || ''));
      }
    } catch {}
  });

  if (currentScript) {
    currentScript.addEventListener('bt:request-bookmarks-page', (event: any) => {
      try {
        const cursor = event.detail?.cursor;
        fetchBookmarksPage(String(cursor || ''));
      } catch {}
    });
  }

  document.addEventListener('bt:request-bookmarks-page', (event: any) => {
    try {
      const cursor = event.detail?.cursor;
      fetchBookmarksPage(String(cursor || ''));
    } catch {}
  });

  // 2. Patch XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _btUrl?: string; _btMethod?: string },
    ...args: any[]
  ) {
    try {
      this._btMethod = typeof args[0] === 'string' ? args[0].toUpperCase() : 'GET';
      this._btUrl = typeof args[1] === 'string' ? args[1] : '';
    } catch {}
    return origOpen.apply(this, args as any);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _btUrl?: string; _btMethod?: string; _btBody?: string },
    ...args: any[]
  ) {
    try {
      if (typeof args[0] === 'string') {
        this._btBody = args[0];
      }
      if (this._btUrl && this._btUrl.includes('/i/api/graphql/')) {
        const url = this._btUrl;
        const method = this._btMethod || 'GET';
        const body = this._btBody;
        this.addEventListener(
          'load',
          () => {
            try {
              extractShape(method, url, this.responseText, this.status, body);
            } catch {}
          },
          { once: true }
        );
      }
    } catch {}
    return origSend.apply(this, args as any);
  };

  // 3. Patch history and popstate
  const emitNav = () => {
    try {
      emitEvent('bt:navigate', { url: location.href });
    } catch {}
  };

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    const res = origPushState.apply(this, args);
    emitNav();
    return res;
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const res = origReplaceState.apply(this, args);
    emitNav();
    return res;
  };

  window.addEventListener('popstate', () => {
    emitNav();
  });
});
