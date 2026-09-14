export interface GraphqlShape {
  method: string;
  urlPath: string;
  operationName: string;
  docId: string;
  topLevelResponseKeys: string[];
  entryCount: number;
}

export interface BridgeNavigate {
  url: string;
}

export interface BookmarksResponseDetail {
  docId: string;
  operationName: string;
  data: any;
  status: number;
}

export interface BookmarkMutationDetail {
  operationName: 'CreateBookmark' | 'DeleteBookmark';
  tweetId: string;
  url?: string;
}

export interface BookmarksErrorDetail {
  reason: 'no_template' | 'fetch_failed';
  error?: string;
}

type GraphqlHandler = (shape: GraphqlShape) => void;
type NavigateHandler = (nav: BridgeNavigate) => void;
type BookmarksHandler = (detail: BookmarksResponseDetail) => void;
type BookmarkMutationHandler = (detail: BookmarkMutationDetail) => void;
type BookmarksErrorHandler = (detail: BookmarksErrorDetail) => void;

const graphqlHandlers: GraphqlHandler[] = [];
const navigateHandlers: NavigateHandler[] = [];
const bookmarksHandlers: BookmarksHandler[] = [];
const mutationHandlers: BookmarkMutationHandler[] = [];
const bookmarksErrorHandlers: BookmarksErrorHandler[] = [];

let bridgeStarted = false;
let bridgeScriptElement: HTMLScriptElement | null = null;

export function onGraphqlShape(handler: GraphqlHandler): () => void {
  graphqlHandlers.push(handler);
  return () => {
    const idx = graphqlHandlers.indexOf(handler);
    if (idx !== -1) graphqlHandlers.splice(idx, 1);
  };
}

export function onBridgeNavigate(handler: NavigateHandler): () => void {
  navigateHandlers.push(handler);
  return () => {
    const idx = navigateHandlers.indexOf(handler);
    if (idx !== -1) navigateHandlers.splice(idx, 1);
  };
}

export function onBookmarksResponse(handler: BookmarksHandler): () => void {
  bookmarksHandlers.push(handler);
  return () => {
    const idx = bookmarksHandlers.indexOf(handler);
    if (idx !== -1) bookmarksHandlers.splice(idx, 1);
  };
}

export function onBookmarksError(handler: BookmarksErrorHandler): () => void {
  bookmarksErrorHandlers.push(handler);
  return () => {
    const idx = bookmarksErrorHandlers.indexOf(handler);
    if (idx !== -1) bookmarksErrorHandlers.splice(idx, 1);
  };
}

export function requestBookmarksPage(cursor: string): void {
  if (typeof window !== 'undefined') {
    window.postMessage({ type: 'bt:request-bookmarks-page', cursor }, '*');
    if (bridgeScriptElement) {
      bridgeScriptElement.dispatchEvent(
        new CustomEvent('bt:request-bookmarks-page', { detail: { cursor } })
      );
    }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(
        new CustomEvent('bt:request-bookmarks-page', { detail: { cursor } })
      );
    }
  }
}

export function onBookmarkMutated(handler: BookmarkMutationHandler): () => void {
  mutationHandlers.push(handler);
  return () => {
    const idx = mutationHandlers.indexOf(handler);
    if (idx !== -1) mutationHandlers.splice(idx, 1);
  };
}

export function onBookmarkCreated(handler: (tweetId: string) => void): () => void {
  return onBookmarkMutated((detail) => {
    if (detail.operationName === 'CreateBookmark' && detail.tweetId) {
      handler(detail.tweetId);
    }
  });
}

export function onBookmarkDeleted(handler: (tweetId: string) => void): () => void {
  return onBookmarkMutated((detail) => {
    if (detail.operationName === 'DeleteBookmark' && detail.tweetId) {
      handler(detail.tweetId);
    }
  });
}

export async function startBridge(): Promise<void> {
  if (bridgeStarted) return;
  bridgeStarted = true;

  try {
    await injectScript('/bridge.js', {
      keepInDom: true,
      modifyScript(script: HTMLScriptElement) {
        bridgeScriptElement = script;

        script.addEventListener('bt:graphql', (event: Event) => {
          const customEvent = event as CustomEvent<GraphqlShape>;
          if (customEvent.detail) {
            for (const handler of graphqlHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        let lastBookmarksDetail: any = null;
        const handleBookmarksDetail = (detail: BookmarksResponseDetail) => {
          if (detail === lastBookmarksDetail) return;
          lastBookmarksDetail = detail;
          for (const handler of bookmarksHandlers) {
            try {
              handler(detail);
            } catch {
              // Ignore handler errors
            }
          }
        };

        script.addEventListener('bt:graphql-bookmarks', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarksResponseDetail>;
          if (customEvent.detail) {
            handleBookmarksDetail(customEvent.detail);
          }
        });

        document.addEventListener('bt:graphql-bookmarks', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarksResponseDetail>;
          if (customEvent.detail) {
            handleBookmarksDetail(customEvent.detail);
          }
        });

        script.addEventListener('bt:graphql-bookmarks-error', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarksErrorDetail>;
          if (customEvent.detail) {
            for (const handler of bookmarksErrorHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        document.addEventListener('bt:graphql-bookmarks-error', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarksErrorDetail>;
          if (customEvent.detail) {
            for (const handler of bookmarksErrorHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        script.addEventListener('bt:graphql-bookmark-mutation', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarkMutationDetail>;
          if (customEvent.detail) {
            for (const handler of mutationHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        document.addEventListener('bt:graphql-bookmark-mutation', (event: Event) => {
          const customEvent = event as CustomEvent<BookmarkMutationDetail>;
          if (customEvent.detail) {
            for (const handler of mutationHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        script.addEventListener('bt:navigate', (event: Event) => {
          const customEvent = event as CustomEvent<BridgeNavigate>;
          if (customEvent.detail) {
            for (const handler of navigateHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        document.addEventListener('bt:navigate', (event: Event) => {
          const customEvent = event as CustomEvent<BridgeNavigate>;
          if (customEvent.detail) {
            for (const handler of navigateHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });
      },
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[bt:bridge] Failed to inject bridge script', err);
    }
  }
}
