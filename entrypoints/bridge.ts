export default defineUnlistedScript(() => {
  const currentScript = document.currentScript;

  const emitEvent = (eventName: string, detail: unknown) => {
    try {
      if (currentScript) {
        currentScript.dispatchEvent(new CustomEvent(eventName, { detail }));
      }
    } catch {
      // Swallow error so observation cannot break the page
    }
  };

  const extractShape = (
    method: string,
    url: string,
    rawText: string,
    status: number = 200,
    reqBody?: string
  ) => {
    try {
      const match = url.match(/\/i\/api\/graphql\/([^/?#]+)\/([^/?#]+)/);
      const docId = match ? match[1] : '';
      const operationName = match ? match[2] : '';
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
        /bookmarks/i.test(urlPath) ||
        (operationName != null && /bookmarks/i.test(operationName)) ||
        ((operationName === 'HistoryTimeline' || (operationName != null && /history/i.test(operationName))) &&
          ((reqBody && /bookmark/i.test(reqBody)) || /bookmark/i.test(urlPath)));

      if (isBookmarksQuery && operationName !== 'CreateBookmark' && operationName !== 'DeleteBookmark') {
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
        result
          .clone()
          .text()
          .then((text) => {
            extractShape(method, url, text, result.status, reqBody);
          })
          .catch(() => {});
      }
    } catch {
      // Observation must never fail or break page
    }
    return result;
  };

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
